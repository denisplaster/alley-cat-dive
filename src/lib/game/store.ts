import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DUMPSTERS, ENEMIES, HIDEOUT_UPGRADES, INITIAL_CATS, LOOT_POOL, newItemId,
} from "./data";
import type {
  Cat, Dumpster, Enemy, Fx, HideoutUpgrade, Item, Rarity, Room, RoomKind, ShopItem,
} from "./types";
import { STORY_CHAPTERS, STAGE_ORDER, CHAPTER_DUMPSTER, isDumpsterUnlocked, type HideoutStage, chapterById } from "./story";
import { computeEvolution, EVOLUTIONS, type EvolutionStage } from "./evolution";
import type {
  Actor, FloatingNumber, RaidLogEntry, RaidState, Skill,
} from "./raidTypes";
import { OVERDRIVES } from "./raidTypes";
import {
  PARTY_TEMPLATES, RAID_ENEMIES, RAIDS, SKILLS, knownSkillIds, type RaidDef,
} from "./raidData";
import { ENEMY_SPRITES } from "./enemySprites";
import {
  BASE_TICK, chooseEnemyAction, gainOD, normalizeTicks, pickActive,
  rollDamage, rollHeal, tickFor, tickStatuses,
} from "./raidEngine";
import { aggregateGrid, GRID_LAYOUTS, isUnlockable, NODE_COST } from "./gridData";

interface CombatEntry { id: number; text: string; tone: "info" | "hit" | "crit" | "loot" | "warn" }

interface DiveState {
  dumpsterId: string;
  catId: string;
  room: number; // 1-based current index
  totalRooms: number;
  rooms: Room[];
  currentKind: RoomKind;
  enemy: Enemy | null;
  enemies: Enemy[];
  catHp: number;
  catMaxHp: number;
  catMp: number;
  catMaxMp: number;
  catStatuses: import("./raidTypes").Status[];
  enemyStatuses: import("./raidTypes").Status[];
  timerSec: number;
  truckTimerStart: number;
  collected: Item[];
  bonesFound: number;
  capsFound: number;
  log: CombatEntry[];
  autoDive: boolean;
  ended: boolean;
  fled: boolean;
  roomCleared: boolean;
  roomEvent: string | null;     // summary text for room-clear banner
  fx: Fx[];
  shakeKey: number;
  shakeHard: boolean;
  enemyFlashKey: number;
  catFlashKey: number;
  enemyDefeatKey: number;
  lastLootKey: number;
  catPose: "idle" | "scratch" | "pounce" | "item" | "hurt" | "block" | "ko" | "victory" | "combo" | "knockback";
  enemyPose: "idle" | "attack" | "hurt" | "ko" | "knockback";
  mangaFx: "slash" | "impact" | "crit" | "heal" | "block" | "miss" | "combo" | null;
  mangaWord: "bam" | "pow" | "slash" | "crit" | "combo" | null;
  mangaFocus: "cat" | "enemy" | "center" | null;
  combo: number;             // current consecutive attack streak
  comboLastAction: "scratch" | "pounce" | null;
  panelSplitKey: number;     // bumps to trigger split-screen overlay
  knockbackKey: number;      // bumps to trigger enemy knockback animation
  catKnockbackKey: number;   // bumps to trigger cat knockback animation
  bubble: { side: "cat" | "enemy"; text: string; key: number } | null;
  inAction: boolean;          // true while enemy is mid-counter-attack — locks player input
  /** Telegraphed enemy intent for the upcoming exchange. */
  enemyIntent: "attack" | "heavy" | "block" | null;
  /** Turns until Pounce is ready again (0 = ready). */
  pounceCd: number;
  /** True while the cat is animating between rooms (side-scrolling transition). */
  transitioning: boolean;
  /** Short flavor text shown during a room transition. */
  transitionMessage: string | null;
  /** Bumps when a new room is revealed so the title card can re-mount. */
  roomRevealKey: number;
  /** While transitioning, this is the upcoming room's kind so the new
   * background can slide in over the outgoing one. */
  nextKind: RoomKind | null;
}

interface GameState {
  playerLevel: number;
  playerXp: number;
  fishbones: number;
  bottlecaps: number;
  cats: Cat[];
  activeCatId: string;
  inventory: Item[];
  /** Pending +HP buff from a Tuna Snack, applied & consumed at the next dive start. */
  nextDiveHp: number;
  /** Premium Dumpster Keys — each one lets a single dive into a story-locked bin. */
  dumpsterKeys: number;
  dumpsters: Dumpster[];
  selectedDumpsterId: string;
  hideout: HideoutUpgrade[];
  dive: DiveState | null;
  lastRewards: { items: Item[]; bones: number; caps: number } | null;

  // story
  storyChapterIdx: number;             // 0-based pointer to next chapter to play
  completedChapters: string[];
  seenIntros: string[];
  storyChoices: Record<string, string>;
  hideoutStage: HideoutStage;
  placedItems: Record<string, string>; // slotId -> itemId
  activeCutscene: { chapterId: string; phase: "intro" | "outro"; panel: number } | null;
  /** Reward panel shown after a chapter outro before returning to gameplay. */
  pendingReward: { chapterId: string; newEvolution?: EvolutionStage } | null;

  // raids (post-story FFX-style party combat)
  raid: RaidState | null;
  spheres: number;
  /** Per-cat sphere-grid progress: cat.id -> unlocked node ids. */
  catGrid: Record<string, string[]>;
  /** Selected raid team (cat ids). Defaults to first 3 ready cats. */
  raidTeam: string[];

  // progression milestones
  roomsCleared: number;
  bossesBeaten: number;
  divesCompleted: number;

  /** Dev / testing flag — bypasses storyline requirements for raids. */
  skipStoryline: boolean;

  selectDumpster: (id: string) => void;
  setActiveCat: (id: string) => void;
  startDive: () => void;
  doAction: (action: "scratch" | "pounce" | "block" | "item" | "flee") => void;
  doSkill: (skillId: string) => void;
  goDeeper: () => void;
  resolveNonCombat: () => void;
  toggleAuto: () => void;
  tickDive: () => void;
  endDive: (escape: boolean) => void;
  collectRewards: () => void;
  clearFx: (id: number) => void;
  equip: (itemId: string, catId: string) => void;
  sell: (itemId: string) => void;
  upgrade: (id: string) => void;
  buy: (cost: { bones: number; caps: number }, granted: Item) => boolean;
  /** Purchase a shop item by identity and apply its real effect. */
  buyShopItem: (item: ShopItem) => boolean;
  buySnack: () => boolean;
  /** Tick down resting/injured cats' recovery; flips them back to Ready at 0. */
  tickRecovery: (seconds: number) => void;
  /** Combine junk/crafting items into a relic (Trash Alchemy Table). */
  craftRelic: () => boolean;
  /** Feed a food item to a recovering cat to cut its downtime. */
  eatFood: (itemId: string) => void;

  // raid actions
  setRaidTeam: (catIds: string[]) => void;
  startRaid: (dungeonId: string) => void;
  raidBasicAttack: (targetUid: string) => void;
  raidUseSkill: (skillId: string, targetUid?: string) => void;
  raidDefend: () => void;
  raidUseItem: () => void;
  raidOverdrive: (targetUid?: string) => void;
  raidFlee: () => void;
  raidAdvanceRoom: () => void;
  raidClaim: () => void;
  /** Spend 1 sphere to unlock a grid node on a cat. */
  spendSphere: (catId: string, nodeId: string) => void;


  openCutscene: (chapterId: string, phase: "intro" | "outro") => void;
  advanceCutscene: () => void;
  closeCutscene: () => void;
  makeChoice: (chapterId: string, optionId: string) => void;
  placeItem: (slotId: string, itemId: string) => void;
  unplaceItem: (slotId: string) => void;
  dismissReward: () => void;
  /** Award player-account XP (the top HUD bar, 0–100 per level); rolls into playerLevel. */
  awardPlayerXp: (amount: number) => void;

  /** Toggle dev flag to skip storyline requirements. */
  toggleSkipStoryline: () => void;
}

let _logId = 0;
const mklog = (text: string, tone: CombatEntry["tone"] = "info"): CombatEntry => ({ id: ++_logId, text, tone });
let _fxId = 0;
const nextFxId = () => ++_fxId;

let _bubbleKey = 0;
const nextBubbleKey = () => ++_bubbleKey;

const CAT_LINES = {
  scratch: ["Take that, nya!", "Scratch attack!", "Eat my claws!", "Feel the fluff!"],
  pounce:  ["Pouncing time!", "Gotcha, nya!", "Air strike!", "Here I come!"],
  combo:   ["COMBO FINISHER!", "This is the end, nya!", "Witness my fury!"],
  item:    ["Snack break!", "Mmm, sardines.", "Yum, healing!"],
  hurt:    ["Owie!", "Hisss!", "That stings, nya!"],
  block:   ["Nice try!", "Blocked it, nya!", "Too slow!"],
};
const ENEMY_LINES = {
  attack:   ["Get over here!", "You're mine!", "Take this!", "Grrr!"],
  heavy:    ["FEEL MY WRATH!", "CRUSH!", "DIE, CAT!"],
  boss:     ["I rule this dumpster!", "Bow before me!", "You dare?!"],
  miniboss: ["You're outmatched!", "I've been waiting."],
};
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const pickEnemyIntent = (kind?: RoomKind): "attack" | "heavy" | "block" => {
  // Bosses and elites are more aggressive and use heavy/block more often.
  const r = Math.random();
  const tough = kind === "boss" || kind === "miniboss" || kind === "elite";
  if (tough) {
    if (r < 0.25) return "block";
    if (r < 0.55) return "heavy";
    return "attack";
  }
  if (r < 0.2) return "block";
  if (r < 0.4) return "heavy";
  return "attack";
};

const generateRooms = (totalRooms: number): Room[] => {
  const arr: RoomKind[] = Array.from({ length: totalRooms }, () => "enemy" as RoomKind);
  // The chapter boss only shows up for the final fight of the dumpster.
  arr[totalRooms - 1] = "boss";
  if (totalRooms >= 3) arr[1] = Math.random() < 0.5 ? "loot" : "rest";
  if (totalRooms >= 4) arr[2] = "swarm";
  // Mid-dive: an elite goon tests the cat — the boss stays off-screen until
  // the climactic final room.
  if (totalRooms >= 5) arr[Math.floor(totalRooms / 2)] = "elite";
  if (totalRooms >= 6) arr[Math.max(3, totalRooms - 3)] = Math.random() < 0.5 ? "hazard" : "loot";
  // Penultimate room: a mini-boss lieutenant softens the cat up before the
  // real boss in the final room.
  if (totalRooms >= 7) arr[totalRooms - 2] = "miniboss";
  return arr.map((k, i) => ({ kind: k, cleared: false, revealed: i === 0 }));
};

const spawnEnemy = (dump: Dumpster, kind: RoomKind, roomIdx: number): Enemy => {
  // Pick a random non-boss enemy from the pool so the signature boss, always
  // stored as the last pool entry, only appears in the final boss room.
  const regularPool = dump.enemyPool.slice(0, -1);
  const enemyKey = kind === "boss"
    ? dump.enemyPool[dump.enemyPool.length - 1]
    : regularPool[Math.floor(Math.random() * regularPool.length)] ?? dump.enemyPool[0];
  const tmpl = ENEMIES[enemyKey];
  let hp = tmpl.baseHp + dump.difficulty * 10 + roomIdx * 4;
  let atk = tmpl.attack;
  let name = tmpl.name;
  let emoji = tmpl.emoji;
  // Boss/mini scaling ramps with dumpster difficulty so the first dumpster's
  // boss isn't a brick wall for a fresh kitten.
  if (kind === "elite") {
    hp = Math.round(hp * (1.18 + dump.difficulty * 0.06));
    atk = Math.round(atk * (1.08 + dump.difficulty * 0.03));
    name = "Elite " + name;
  }
  if (kind === "miniboss") {
    hp = Math.round(hp * (1.25 + dump.difficulty * 0.08));
    atk = Math.round(atk * (1.10 + dump.difficulty * 0.04));
    name = "Mini-Boss " + name;
  }
  if (kind === "boss") {
    const isFinal = roomIdx >= dump.rooms - 1;
    // The signature boss only appears for the dumpster's final fight.
    const hpMult = isFinal ? 1.45 + dump.difficulty * 0.18 : 1.05 + dump.difficulty * 0.08;
    const atkMult = isFinal ? 1.15 + dump.difficulty * 0.06 : 1.0 + dump.difficulty * 0.03;
    hp = Math.round(hp * hpMult);
    atk = Math.round(atk * atkMult);
    name = (isFinal ? "FINAL BOSS — " : "BOSS — ") + name;
  }
  return { id: enemyKey, name, hp, maxHp: hp, attack: atk, emoji };
};

const spawnEnemies = (dump: Dumpster, kind: RoomKind, roomIdx: number): Enemy[] => {
  if (kind === "swarm") {
    const count = dump.difficulty >= 4 ? 3 : 2;
    return Array.from({ length: count }, (_, idx) => {
      const enemy = spawnEnemy(dump, "enemy", roomIdx + idx);
      return { ...enemy, name: count > 2 ? `${enemy.name} ${idx + 1}` : enemy.name };
    });
  }
  return [spawnEnemy(dump, kind, roomIdx)];
};

const rollLoot = (target: Rarity): Item => {
  const tiers: Rarity[] = ["common","uncommon","rare","epic","legendary","mythic"];
  const idx = tiers.indexOf(target);
  const useIdx = Math.random() < 0.7 ? idx : Math.max(0, idx - 1);
  const pool = LOOT_POOL.filter(i => i.rarity === tiers[useIdx]);
  const pick = pool[Math.floor(Math.random() * pool.length)] ?? LOOT_POOL[0];
  return { ...pick, id: newItemId() };
};

const seedInventory: Item[] = [
  { ...LOOT_POOL[0], id: newItemId() },
  { ...LOOT_POOL[1], id: newItemId() },
  { ...LOOT_POOL[4], id: newItemId() },
  { ...LOOT_POOL[8], id: newItemId() },
];

// --- Award room-clear rewards when a SKILL lands the killing blow on the last foe. ---
export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
  playerLevel: 1,
  playerXp: 0,
  fishbones: 1240,
  bottlecaps: 48,
  cats: INITIAL_CATS,
  activeCatId: "scrapper",
  inventory: seedInventory,
  nextDiveHp: 0,
  dumpsterKeys: 0,
  dumpsters: DUMPSTERS,
  selectedDumpsterId: "greasy",
  hideout: HIDEOUT_UPGRADES,
  dive: null,
  lastRewards: null,

  storyChapterIdx: 0,
  completedChapters: [],
  seenIntros: [],
  storyChoices: {},
  hideoutStage: "tin_can",
  placedItems: {},
  activeCutscene: null,
  pendingReward: null,
  roomsCleared: 0,
  bossesBeaten: 0,
  divesCompleted: 0,

  raid: null,
  spheres: 0,
  catGrid: {},
  raidTeam: ["scrapper", "sneakpaw", "moldmancer"],
  skipStoryline: false,

  selectDumpster: (id) => set({ selectedDumpsterId: id }),
  setActiveCat: (id) => {
    const cat = get().cats.find(c => c.id === id);
    if (!cat || cat.status !== "ready") return;
    set({ activeCatId: id });
  },

  startDive: () => {
    const s = get();
    const baseCat = s.cats.find(c => c.id === s.activeCatId);
    if (!baseCat) return;
    const cat = withCombatStats(s, baseCat, true);
    // Dive the bin the player picked (from the map or the story's Start Dive).
    // If it's still story-locked (e.g. a stale selection), fall back to the
    // current chapter's bin, which is always unlocked.
    let dumpId = s.selectedDumpsterId;
    let usedKey = false;
    if (!isDumpsterUnlocked(dumpId, s.storyChapterIdx)) {
      if (s.dumpsterKeys > 0) {
        usedKey = true; // a Premium Dumpster Key opens this story-locked bin for one run
      } else {
        const ch = STORY_CHAPTERS[s.storyChapterIdx];
        dumpId = (ch && CHAPTER_DUMPSTER[ch.id])
          ?? s.dumpsters.find(d => isDumpsterUnlocked(d.id, s.storyChapterIdx))?.id
          ?? dumpId;
      }
    }
    const dump = s.dumpsters.find(d => d.id === dumpId);
    if (!dump || (!usedKey && !isDumpsterUnlocked(dump.id, s.storyChapterIdx))) return;
    if (dumpId !== s.selectedDumpsterId) set({ selectedDumpsterId: dumpId });
    if (usedKey) set({ dumpsterKeys: s.dumpsterKeys - 1 });
    const rooms = generateRooms(dump.rooms);
    const firstKind = rooms[0].kind;
    const wave = (firstKind === "enemy" || firstKind === "swarm" || firstKind === "elite" || firstKind === "miniboss" || firstKind === "boss")
      ? spawnEnemies(dump, firstKind, 0) : [];
    const enemy = wave[0] ?? null;
    const rest = wave.slice(1);
    const diveMaxHp = cat.maxHp + s.nextDiveHp; // Tuna Snack buff applies this dive
    set({
      nextDiveHp: 0,
      dive: {
        dumpsterId: dump.id,
        catId: cat.id,
        room: 1,
        totalRooms: dump.rooms,
        rooms,
        currentKind: firstKind,
        enemy,
        enemies: rest,
        catHp: diveMaxHp,
        catMaxHp: diveMaxHp,
        catMp: 30 + cat.level * 2,
        catMaxMp: 30 + cat.level * 2,
        catStatuses: [],
        enemyStatuses: [],
        timerSec: dump.truckTimerSec,
        truckTimerStart: dump.truckTimerSec,
        collected: [],
        bonesFound: 0,
        capsFound: 0,
        log: [
          mklog(`Diving into ${dump.name}…`, "info"),
          enemy ? mklog(wave.length > 1
                  ? `${wave.length} foes block the way — ${enemy.name} leads!`
                  : `A ${enemy.name} blocks the way!`, "warn")
                : mklog(roomDescriptor(firstKind), "info"),
        ],
        autoDive: false,
        ended: false,
        fled: false,
        roomCleared: false,
        roomEvent: null,
        fx: [],
        shakeKey: 0,
        shakeHard: false,
        enemyFlashKey: 0,
        catFlashKey: 0,
        enemyDefeatKey: 0,
        lastLootKey: 0,
        catPose: "idle",
        enemyPose: "idle",
        mangaFx: null,
        mangaWord: null,
        mangaFocus: null,
        combo: 0,
        comboLastAction: null,
        panelSplitKey: 0,
        knockbackKey: 0,
        catKnockbackKey: 0,
        bubble: null,
        inAction: false,
        enemyIntent: enemy ? pickEnemyIntent() : null,
        pounceCd: 0,
        transitioning: false,
        transitionMessage: null,
        roomRevealKey: 0,
        nextKind: null,
      },
      lastRewards: null,
    });
  },

  clearFx: (id) => {
    const s = get();
    if (!s.dive) return;
    set({ dive: { ...s.dive, fx: s.dive.fx.filter(f => f.id !== id) } });
  },

  tickDive: () => {
    const s = get();
    if (!s.dive || s.dive.ended) return;
    const newTimer = s.dive.timerSec - 1;
    if (newTimer <= 0) {
      const log2 = [...s.dive.log, mklog("🚛 The trash truck arrived! You scramble out.", "warn")];
      set({ dive: { ...s.dive, timerSec: 0, log: log2, ended: true, fled: true } });
      get().endDive(false);
      return;
    }
    set({ dive: { ...s.dive, timerSec: newTimer } });
    if (s.dive.autoDive && s.dive.enemy && !s.dive.roomCleared) {
      // Auto-play picks a sensible move: block big swings, pounce when off cd, else scratch.
      const d = s.dive;
      const auto: "scratch" | "pounce" | "block" =
        d.enemyIntent === "heavy" ? "block"
        : d.pounceCd === 0 && d.enemyIntent !== "block" ? "pounce"
        : "scratch";
      setTimeout(() => get().doAction(auto), 50);
    }
  },

  doAction: (action) => {
    const s = get();
    if (!s.dive || s.dive.ended) return;
    const d = s.dive;
    const cat = withCombatStats(s, s.cats.find(c => c.id === d.catId)!, true);
    const dump = s.dumpsters.find(x => x.id === d.dumpsterId)!;

    if (action === "flee") {
      const clog = [...d.log, mklog("You bolt for the lid! Half the loot stays behind.", "warn")];
      set({ dive: { ...d, log: clog, ended: true, fled: true } });
      get().endDive(false);
      return;
    }
    if (d.roomCleared || !d.enemy) return;
    if (d.inAction) return;   // turn-based lock: wait for enemy counter to resolve

    // Pounce has a 2-turn cooldown — refuse if not ready yet.
    if (action === "pounce" && d.pounceCd > 0) {
      const warnLog = [...d.log, mklog(`Pounce recharging — ${d.pounceCd} turn${d.pounceCd>1?"s":""}.`, "warn")];
      set({ dive: { ...d, log: warnLog } });
      return;
    }

    let { catHp, enemy, collected, log: clog, bonesFound, capsFound, fx,
      shakeKey, shakeHard, enemyFlashKey, catFlashKey, enemyDefeatKey, lastLootKey,
      combo, comboLastAction, panelSplitKey, knockbackKey, catKnockbackKey } = d;
    enemy = { ...enemy! };

    // Telegraphed enemy intent for this exchange (set when the foe spawned or last turn ended).
    const intent = d.enemyIntent ?? "attack";
    const enemyWillBlock = intent === "block";
    const heavyIntent = intent === "heavy";
    // Cat-side block toggle (no damage dealt, big damage reduction taken).
    const catBlocking = action === "block";

    if (action === "item") {
      // Healing now consumes a food item from inventory.
      const foodIdx = s.inventory.findIndex(i => i.kind === "food");
      if (foodIdx === -1) {
        const warnLog = [...clog, mklog("No snacks left in your bag!", "warn")];
        set({ dive: { ...d, log: warnLog } });
        return;
      }
      const food = s.inventory[foodIdx];
      const pantryMult = 1 + 0.2 * hideoutLevel(s, "pantry"); // Tuna Can Pantry
      const heal = Math.round(Math.max(10, food.health ?? 20) * pantryMult);
      catHp = Math.min(d.catMaxHp, catHp + heal);
      clog = [...clog, mklog(`Munched ${food.name}. +${heal} HP`, "loot")];
      fx = [...fx, { id: nextFxId(), target: "cat", kind: "heal", amount: heal }];
      const newInv = [...s.inventory.slice(0, foodIdx), ...s.inventory.slice(foodIdx + 1)];
      set({ inventory: newInv });
      // item breaks combo
      combo = 0;
      comboLastAction = null;
    } else if (catBlocking) {
      // Defensive stance — no attack output, but incoming damage is heavily reduced.
      clog = [...clog, mklog(`${cat.name} braces to block!`, "info")];
      combo = 0;
      comboLastAction = null;
    } else {
      const isCrit = Math.random() < (action === "pounce" ? 0.28 : 0.14);
      // Momentum: alternating actions and reaching combo 3+ ramps damage
      const isFinisher = combo >= 2 && comboLastAction !== null && comboLastAction !== action;
      const comboMult = 1 + Math.min(combo, 4) * 0.12 + (isFinisher ? 0.5 : 0);
      const base = action === "pounce" ? cat.attack * 1.6 : cat.attack;
      // If the enemy telegraphed a block, our hit barely lands.
      const blockMult = enemyWillBlock ? 0.25 : 1;
      const dmg = Math.max(1, Math.round(base * (isCrit ? 2 : 1) * comboMult * (0.85 + Math.random() * 0.3) * blockMult));
      enemy.hp = Math.max(0, enemy.hp - dmg);
      const verb = action === "pounce" ? "pounces" : "scratches";
      const suffix = enemyWillBlock ? " — BLOCKED!" : isFinisher ? " — COMBO FINISHER!" : isCrit ? " (CRIT!)" : "";
      clog = [...clog, mklog(`${cat.name} ${verb} for ${dmg}${suffix}`, isFinisher || isCrit ? "crit" : "hit")];
      fx = [...fx, { id: nextFxId(), target: "enemy", kind: isCrit ? "crit" : "dmg", amount: dmg }];
      enemyFlashKey += 1;
      shakeKey += 1;
      shakeHard = isCrit || action === "pounce" || isFinisher;
      // momentum bookkeeping
      combo = combo + 1;
      comboLastAction = action === "pounce" ? "pounce" : "scratch";
      // big hits knock the enemy back
      if (isCrit || isFinisher || action === "pounce") knockbackKey += 1;
      // combo finisher triggers split-screen panel
      if (isFinisher) { panelSplitKey += 1; }
    }

    // Cooldown bookkeeping: pounce sets cd, anything else (incl. block) ticks it down.
    let pounceCd = d.pounceCd;
    if (action === "pounce") pounceCd = 2;
    else pounceCd = Math.max(0, pounceCd - 1);

    // ---- Panel 1: the CAT's action ----
    let catPose: DiveState["catPose"];
    let enemyPose: DiveState["enemyPose"];
    let mangaFx: DiveState["mangaFx"];
    let mangaWord: DiveState["mangaWord"];
    let mangaFocus: DiveState["mangaFocus"];

    if (action === "item") {
      catPose = "item";
      enemyPose = enemy.hp <= 0 ? "ko" : "idle";
      mangaFx = "heal";
      mangaWord = null;
      mangaFocus = "cat";
    } else if (catBlocking) {
      catPose = "block";
      enemyPose = "idle";
      mangaFx = "block";
      mangaWord = null;
      mangaFocus = "cat";
    } else {
      const wasFinisher = combo >= 3 && comboLastAction !== d.comboLastAction;
      catPose = wasFinisher ? "combo" : action === "pounce" ? "pounce" : "scratch";
      enemyPose = enemy.hp <= 0 ? "ko" : "hurt";
      mangaFx = wasFinisher ? "combo"
        : enemy.hp <= 0 && action === "pounce" ? "crit"
        : action === "scratch" ? "slash" : "impact";
      mangaWord = wasFinisher ? "combo"
        : enemy.hp <= 0 ? "crit"
        : action === "scratch" ? "slash"
        : action === "pounce" ? "pow" : "bam";
      mangaFocus = "enemy";
    }

    // Cat speech bubble for panel 1
    let bubble: DiveState["bubble"] = null;
    if (action === "item") {
      bubble = { side: "cat", text: pick(CAT_LINES.item), key: nextBubbleKey() };
    } else if (catBlocking) {
      bubble = { side: "cat", text: pick(["Bring it!", "Try me!", "Guard up!", "Nyah, blocked!"]), key: nextBubbleKey() };
    } else {
      const wasFinisher = combo >= 3 && comboLastAction !== d.comboLastAction;
      const pool = wasFinisher ? CAT_LINES.combo : action === "pounce" ? CAT_LINES.pounce : CAT_LINES.scratch;
      bubble = { side: "cat", text: pick(pool), key: nextBubbleKey() };
    }

    // ---- Panel 2: enemy counter-attack (data computed now, visuals deferred) ----
    let counter: null | {
      incoming: number;
      blocked: boolean;
      enemyName: string;
      catPose: DiveState["catPose"];
      enemyPose: DiveState["enemyPose"];
      mangaFx: DiveState["mangaFx"];
      mangaWord: DiveState["mangaWord"];
      mangaFocus: DiveState["mangaFocus"];
      catFlashKey: number;
      catKnockbackKey: number;
    } = null;

    // Enemy only swings if its intent was attack/heavy AND it's still alive.
    // Healing doesn't provoke a counter (legacy behavior preserved).
    if (enemy.hp > 0 && action !== "item" && !enemyWillBlock) {
      const heavyMult = heavyIntent ? 1.55 : 1;
      const rawIncoming = enemy.attack * (0.95 + Math.random() * 0.45) * heavyMult - cat.defense * 0.28;
      // Cat's block soaks 75% of the incoming damage.
      const damageMult = catBlocking ? 0.25 : 1;
      const incoming = Math.max(catBlocking ? 1 : 2, Math.round(rawIncoming * damageMult));
      const blocked = catBlocking || incoming <= Math.max(3, Math.round(cat.defense * 0.35));
      const heavy = !catBlocking && incoming >= 18;
      const nextCatFlash = catFlashKey + 1;
      const nextCatKb = heavy ? catKnockbackKey + 1 : catKnockbackKey;
      if (heavy) { combo = 0; comboLastAction = null; }
      else if (!blocked && combo > 2) combo = Math.max(0, combo - 1);
      counter = {
        incoming,
        blocked,
        enemyName: enemy.name,
        catPose: blocked ? "block" : heavy ? "knockback" : "hurt",
        enemyPose: heavyIntent ? "attack" : "attack",
        mangaFx: blocked ? "block" : "impact",
        mangaWord: blocked ? null : incoming >= 12 ? "bam" : "pow",
        mangaFocus: "cat",
        catFlashKey: nextCatFlash,
        catKnockbackKey: nextCatKb,
      };
    } else if (enemy.hp > 0 && enemyWillBlock && action !== "item") {
      // Telegraphed enemy block — no counter damage, brief log entry.
      clog = [...clog, mklog(`${enemy.name} braces — no counter.`, "info")];
    }

    // Pick the NEXT telegraphed intent for the upcoming player turn.
    const nextIntent = pickEnemyIntent(d.currentKind);

    // Enemy dead from the cat's hit — show victory panel, no counter to schedule.
    if (enemy.hp <= 0) {
      // If this room has more foes in the wave, promote the next one and keep fighting.
      if (d.enemies.length > 0) {
        const [nextFoe, ...remaining] = d.enemies;
        const nextLog = [...clog, mklog(`${enemy.name} drops! ${nextFoe.name} steps up.`, "warn")];
        set({ dive: { ...d, enemy: nextFoe, enemies: remaining, catHp, collected, log: nextLog,
          bonesFound, capsFound, fx, shakeKey, shakeHard, enemyFlashKey, catFlashKey,
          enemyDefeatKey: enemyDefeatKey + 1, lastLootKey,
          catPose: "idle", enemyPose: "idle", mangaFx: null, mangaWord: null, mangaFocus: null,
          combo: 0, comboLastAction: null, knockbackKey, catKnockbackKey, panelSplitKey,
          bubble: null, inAction: false,
          enemyIntent: pickEnemyIntent(d.currentKind), pounceCd } });
        return;
      }
      const isBoss = d.currentKind === "boss";
      const isMini = d.currentKind === "miniboss";
      const dropCount = isBoss ? 3 : isMini ? 2 : 1;
      const newDrops: Item[] = [];
      for (let i = 0; i < dropCount; i++) newDrops.push(rollLoot(dump.expectedLoot));
      collected = [...collected, ...newDrops];
      const bonesGain = Math.round((dump.rewardBones / d.totalRooms) * (isBoss ? 1.8 : isMini ? 1.3 : 1));
      const capsGain = Math.round((dump.rewardCaps / d.totalRooms) * (isBoss ? 1.8 : isMini ? 1.3 : 1));
      bonesFound += bonesGain;
      capsFound += capsGain;
      newDrops.forEach(dr => { clog = [...clog, mklog(`✨ Looted ${dr.name}`, "loot")]; });
      clog = [...clog, mklog(`Room cleared. +${bonesGain} 🦴 +${capsGain} 🧴`, "loot")];
      const rooms = d.rooms.map((r, i) => i === d.room - 1 ? { ...r, cleared: true } : r);
      enemyDefeatKey += 1;
      lastLootKey += 1;
      // milestone bookkeeping: every cleared combat room counts, bosses too.
      const isBossClear = d.currentKind === "boss";
      set({
        ...rollPlayerXp(s.playerLevel, s.playerXp, isBoss ? 40 : isMini ? 24 : 14),
        roomsCleared: s.roomsCleared + 1,
        bossesBeaten: s.bossesBeaten + (isBossClear ? 1 : 0),
      });
      set({ dive: { ...d, enemy, catHp, collected, log: clog, bonesFound, capsFound, fx, rooms,
        roomCleared: true, autoDive: false,
        roomEvent: `+${bonesGain} 🦴  +${capsGain} 🧴  ·  ${dropCount} item${dropCount>1?"s":""}`,
        shakeKey, shakeHard, enemyFlashKey, catFlashKey, enemyDefeatKey, lastLootKey,
        catPose: "victory", enemyPose: "ko", mangaFx, mangaWord, mangaFocus,
        combo: 0, comboLastAction: null, knockbackKey, catKnockbackKey, panelSplitKey,
        inAction: false, enemyIntent: null, pounceCd: 0 } });
      return;
    }

    // Panel 1: cat-attacker view (enemy hurt). Damage already applied.
    const regenMp = Math.min(d.catMaxMp ?? 0, (d.catMp ?? 0) + 3);
    set({ dive: { ...d, catHp, enemy, collected, log: clog, fx, bonesFound, capsFound, catMp: regenMp,
      shakeKey, shakeHard, enemyFlashKey, catFlashKey, enemyDefeatKey, lastLootKey,
      catPose, enemyPose, mangaFx, mangaWord, mangaFocus,
      combo, comboLastAction, knockbackKey, catKnockbackKey, panelSplitKey, bubble,
      inAction: counter !== null,
      enemyIntent: counter !== null ? d.enemyIntent : nextIntent,
      pounceCd } });

    // Panel 2: enemy counter-attack — apply HP loss and swap to counter visuals after a beat.
    if (counter) {
      const ctr = counter;
      const finalCatHp = Math.max(0, catHp - ctr.incoming);
      const willKo = finalCatHp <= 0;
      // Pick enemy bubble pool based on context
      const enemyPool = d.currentKind === "boss" ? ENEMY_LINES.boss
        : d.currentKind === "miniboss" ? ENEMY_LINES.miniboss
        : ctr.incoming >= 18 ? ENEMY_LINES.heavy
        : ENEMY_LINES.attack;
      const enemyText = pick(enemyPool);
      setTimeout(() => {
        const cur = get().dive;
        if (!cur || cur.ended || cur.roomCleared) return;
        const counterLog = mklog(`${ctr.enemyName} hits back for ${ctr.incoming}`, "warn");
        const log2 = willKo
          ? [...cur.log, counterLog, mklog(`💀 ${cat.name} went down! Dragging them out…`, "warn")]
          : [...cur.log, counterLog];
        const newFx = [...cur.fx, { id: nextFxId(), target: "cat" as const, kind: "dmg" as const, amount: ctr.incoming }];
        set({ dive: { ...cur,
          catHp: finalCatHp,
          fx: newFx,
          catPose: willKo ? "ko" : ctr.catPose,
          enemyPose: ctr.enemyPose,
          mangaFx: ctr.mangaFx,
          mangaWord: ctr.mangaWord,
          mangaFocus: ctr.mangaFocus,
          catFlashKey: ctr.catFlashKey,
          catKnockbackKey: ctr.catKnockbackKey,
          log: log2,
          bubble: { side: "enemy", text: enemyText, key: nextBubbleKey() },
          ended: willKo ? true : cur.ended,
          fled: willKo ? true : cur.fled,
          inAction: false,
          enemyIntent: nextIntent,
        } });
        if (willKo) get().endDive(false);
      }, 1800);
    }
  },

  doSkill: (skillId) => {
    const s = get();
    if (!s.dive || s.dive.ended) return;
    const d = s.dive;
    if (d.roomCleared || !d.enemy || d.inAction) return;
    const cat = withCombatStats(s, s.cats.find(c => c.id === d.catId)!, true);
    const skill = SKILLS[skillId];
    if (!skill) return;
    if ((d.catMp ?? 0) < skill.mpCost) {
      set({ dive: { ...d, log: [...d.log, mklog(`Not enough MP for ${skill.name}!`, "warn")] } });
      return;
    }

    let catStatuses = [...(d.catStatuses ?? [])];
    let enemyStatuses = [...(d.enemyStatuses ?? [])];

    // Tick existing statuses at the start of this exchange: DoT on the enemy,
    // duration decrement on both sides. (Declared before use to avoid TDZ.)
    const enemy0 = { ...d.enemy! };
    const preFx: Fx[] = [];
    const preLog: CombatEntry[] = [];
    {
      const tick = tickDiveStatuses(enemyStatuses);
      if (tick.dot > 0) {
        enemy0.hp = Math.max(0, enemy0.hp - tick.dot);
        preFx.push({ id: nextFxId(), target: "enemy", kind: "dmg", amount: tick.dot });
        preLog.push(mklog(`${enemy0.name} takes ${tick.dot} from poison/burn`, "warn"));
      }
      enemyStatuses = tick.next;
      const ct = tickDiveStatuses(catStatuses);
      catStatuses = ct.next; // (cats currently only receive buffs, no self-DoT)
    }

    let enemy = enemy0;
    let catHp = d.catHp;
    let catMp = Math.min(d.catMaxMp, (d.catMp - skill.mpCost) + 3);
    let clog = [...d.log, ...preLog];
    let fx = [...d.fx, ...preFx];
    let { shakeKey, shakeHard, enemyFlashKey, catFlashKey, enemyDefeatKey,
          knockbackKey, catKnockbackKey, panelSplitKey } = d;

    const atk = cat.attack + sumStatusMod(catStatuses, "atkMod");

    // A DoT may have finished the foe before the skill even lands.
    if (enemy0.hp <= 0) {
      if (d.enemies.length > 0) {
        const [nextFoe, ...remaining] = d.enemies;
        set({ dive: { ...d, enemy: nextFoe, enemies: remaining, catMp, catStatuses, enemyStatuses: [],
          log: [...clog, mklog(`${enemy0.name} succumbs! ${nextFoe.name} steps up.`, "warn")],
          fx, enemyDefeatKey: d.enemyDefeatKey + 1, inAction: false,
          enemyIntent: pickEnemyIntent(d.currentKind) } });
        return;
      }
      clearDiveRoom(get, set, {
        enemy: enemy0, catHp, catMp, catStatuses, enemyStatuses, log: clog, fx,
        shakeKey: d.shakeKey, shakeHard: true, enemyFlashKey: d.enemyFlashKey, catFlashKey: d.catFlashKey,
        enemyDefeatKey: d.enemyDefeatKey, catPose: "victory", mangaFx: "crit", mangaWord: "crit",
        mangaFocus: "enemy", bubble: null, knockbackKey: d.knockbackKey, panelSplitKey: d.panelSplitKey,
      });
      return;
    }

    let catPose: DiveState["catPose"] = skill.ultimate ? "combo" : "pounce";
    let mangaFx: DiveState["mangaFx"] = skill.ultimate ? "crit" : skill.kind === "heal" ? "heal" : "slash";
    let mangaWord: DiveState["mangaWord"] = skill.ultimate ? "crit" : skill.kind === "heal" ? null : "pow";
    let mangaFocus: DiveState["mangaFocus"] = skill.kind === "heal" || skill.kind === "buff" ? "cat" : "enemy";

    if (skill.kind === "heal") {
      const heal = Math.round(Math.max(10, atk * skill.power * 1.2));
      catHp = Math.min(d.catMaxHp, catHp + heal);
      clog.push(mklog(`${cat.name} uses ${skill.name} — +${heal} HP`, "loot"));
      fx.push({ id: nextFxId(), target: "cat", kind: "heal", amount: heal });
      catPose = "item";
    } else if (skill.kind === "buff") {
      if (skill.applyStatus) catStatuses = applyStatusList(catStatuses, skill.applyStatus, atk);
      // Describe the buff so it clearly reads as "I got stronger".
      const sp = skill.applyStatus;
      const parts: string[] = [];
      if (sp?.atkMod) parts.push(`ATK ${sp.atkMod > 0 ? "+" : ""}${sp.atkMod}`);
      if (sp?.defMod) parts.push(`DEF ${sp.defMod > 0 ? "+" : ""}${sp.defMod}`);
      if (sp?.spdMod) parts.push(`SPD ${sp.spdMod > 0 ? "+" : ""}${sp.spdMod}`);
      clog.push(mklog(`${cat.name} uses ${skill.name}! ${parts.join(", ")} for ${sp?.turns ?? 0} turns`, "loot"));
      // a green "+" float on the cat signals the power-up
      fx.push({ id: nextFxId(), target: "cat", kind: "heal", amount: 0 });
      catPose = "combo";       // flex/power-up pose, not a block
      mangaFx = "combo";
      mangaWord = "combo";
    } else {
      // damage / debuff — possibly multi-hit
      const hits = Math.max(1, skill.hits ?? 1);
      const enemyDef = sumStatusMod(enemyStatuses, "defMod"); // negative def = more dmg
      let total = 0;
      for (let h = 0; h < hits && enemy.hp > 0; h++) {
        const isCrit = Math.random() < 0.15;
        const real = Math.max(1, Math.round(
          atk * skill.power * (isCrit ? 1.8 : 1) * (0.9 + Math.random() * 0.2) - enemyDef * 0.5));
        enemy.hp = Math.max(0, enemy.hp - real);
        total += real;
        fx.push({ id: nextFxId(), target: "enemy", kind: isCrit ? "crit" : "dmg", amount: real });
      }
      enemyFlashKey += 1; shakeKey += 1; shakeHard = true;
      if (skill.ultimate) { knockbackKey += 1; panelSplitKey += 1; }
      clog.push(mklog(`${cat.name}'s ${skill.name} hits for ${total}${hits > 1 ? ` (${hits} hits)` : ""}!`, skill.ultimate ? "crit" : "hit"));
      if (skill.applyStatus && enemy.hp > 0) {
        enemyStatuses = applyStatusList(enemyStatuses, skill.applyStatus, atk);
        clog.push(mklog(`${enemy.name} is afflicted by ${skill.name}!`, "info"));
      }
    }

    const enemyDead = enemy.hp <= 0;
    const bubble: DiveState["bubble"] = { side: "cat", text: skill.name + "!", key: nextBubbleKey() };

    // Build the enemy counter (skills DO provoke a counter, except heals/buffs which are quicker — keep parity with item: no counter on support).
    const isSupport = skill.kind === "heal" || skill.kind === "buff";
    const nextIntent = pickEnemyIntent(d.currentKind);

    if (enemyDead) {
      // Defer to the same wave/clear handling used by doAction by writing state then calling the shared resolver path.
      const cleared = d.enemies.length === 0;
      if (!cleared) {
        const [nextFoe, ...remaining] = d.enemies;
        set({ dive: { ...d, enemy: nextFoe, enemies: remaining, catHp, catMp, catStatuses, enemyStatuses: [],
          log: [...clog, mklog(`${enemy.name} drops! ${nextFoe.name} steps up.`, "warn")],
          fx, shakeKey, shakeHard, enemyFlashKey, catFlashKey, enemyDefeatKey: enemyDefeatKey + 1,
          catPose, enemyPose: "ko", mangaFx, mangaWord, mangaFocus, bubble, knockbackKey, panelSplitKey,
          inAction: false, enemyIntent: nextIntent } });
        return;
      }
      clearDiveRoom(get, set, {
        enemy, catHp, catMp, catStatuses, enemyStatuses, log: clog, fx,
        shakeKey, shakeHard, enemyFlashKey, catFlashKey, enemyDefeatKey,
        catPose, mangaFx, mangaWord, mangaFocus, bubble, knockbackKey, panelSplitKey,
      });
      return;
    }

    // Enemy survives: write cat's panel, then schedule a counter (unless support).
    const counterIncoming = isSupport ? 0 : (() => {
      const heavy = d.enemyIntent === "heavy";
      const raw = enemy.attack * (0.95 + Math.random() * 0.45) * (heavy ? 1.55 : 1)
        - (cat.defense + sumStatusMod(catStatuses, "defMod")) * 0.28;
      return Math.max(2, Math.round(raw));
    })();

    set({ dive: { ...d, enemy: { ...enemy }, catHp, catMp, catStatuses, enemyStatuses,
      log: clog, fx, shakeKey, shakeHard, enemyFlashKey, catFlashKey,
      catPose, enemyPose: enemyDead ? "ko" : "hurt", mangaFx, mangaWord, mangaFocus, bubble,
      knockbackKey, panelSplitKey,
      inAction: counterIncoming > 0,
      enemyIntent: counterIncoming > 0 ? d.enemyIntent : nextIntent } });

    if (counterIncoming > 0) {
      setTimeout(() => {
        const cur = get().dive;
        if (!cur || cur.ended || cur.roomCleared) return;
        const finalCatHp = Math.max(0, cur.catHp - counterIncoming);
        const willKo = finalCatHp <= 0;
        set({ dive: { ...cur,
          catHp: finalCatHp,
          fx: [...cur.fx, { id: nextFxId(), target: "cat" as const, kind: "dmg" as const, amount: counterIncoming }],
          catPose: willKo ? "ko" : "hurt", enemyPose: "attack",
          mangaFx: "impact", mangaWord: counterIncoming >= 12 ? "bam" : "pow", mangaFocus: "cat",
          catFlashKey: cur.catFlashKey + 1,
          log: willKo
            ? [...cur.log, mklog(`${enemy.name} hits back for ${counterIncoming}`, "warn"), mklog(`💀 ${cat.name} went down!`, "warn")]
            : [...cur.log, mklog(`${enemy.name} hits back for ${counterIncoming}`, "warn")],
          ended: willKo ? true : cur.ended,
          fled: willKo ? true : cur.fled,
          inAction: false, enemyIntent: nextIntent,
        } });
        if (willKo) get().endDive(false);
      }, 1500);
    }
  },

  resolveNonCombat: () => {
    const s = get();
    if (!s.dive || s.dive.ended || s.dive.roomCleared) return;
    const d = s.dive;
    const dump = s.dumpsters.find(x => x.id === d.dumpsterId)!;
    let { catHp, collected, log: clog, bonesFound, capsFound, fx, lastLootKey } = d;
    let event = "";

    if (d.currentKind === "loot") {
      const drops = [rollLoot(dump.expectedLoot), rollLoot(dump.expectedLoot)];
      collected = [...collected, ...drops];
      const bg = Math.round(dump.rewardBones / d.totalRooms * 0.6);
      bonesFound += bg;
      drops.forEach(dr => clog = [...clog, mklog(`✨ Found ${dr.name}`, "loot")]);
      clog = [...clog, mklog(`Loot room raided. +${bg} 🦴`, "loot")];
      lastLootKey += 1;
      event = `+${bg} 🦴  ·  2 items`;
    } else if (d.currentKind === "rest") {
      const heal = Math.round(d.catMaxHp * 0.4);
      catHp = Math.min(d.catMaxHp, catHp + heal);
      fx = [...fx, { id: nextFxId(), target: "cat", kind: "heal", amount: heal }];
      clog = [...clog, mklog(`Curled up in some warm laundry. +${heal} HP`, "loot")];
      event = `+${heal} HP restored`;
    } else if (d.currentKind === "hazard") {
      const dmg = Math.max(5, Math.round(d.catMaxHp * 0.15));
      catHp = Math.max(1, catHp - dmg);
      fx = [...fx, { id: nextFxId(), target: "cat", kind: "dmg", amount: dmg }];
      clog = [...clog, mklog(`☣️ Stepped in toxic goo. -${dmg} HP`, "warn")];
      event = `Took ${dmg} damage`;
    }
    const rooms = d.rooms.map((r, i) => i === d.room - 1 ? { ...r, cleared: true } : r);
    // non-combat rooms still count as progression toward Scrapper evolution.
    set({ roomsCleared: s.roomsCleared + 1 });
    set({ dive: { ...d, catHp, collected, log: clog, bonesFound, capsFound, fx, rooms,
      roomCleared: true, roomEvent: event, lastLootKey,
      catPose: d.currentKind === "rest" ? "item" : "idle", enemyPose: "idle",
      mangaFx: d.currentKind === "hazard" ? "impact" : d.currentKind === "rest" ? "heal" : null,
      mangaWord: null, mangaFocus: d.currentKind === "hazard" ? "cat" : "center" } });
  },

  goDeeper: () => {
    const s = get();
    if (!s.dive || s.dive.ended || !s.dive.roomCleared) return;
    if (s.dive.transitioning) return;
    const d = s.dive;
    const dump = s.dumpsters.find(x => x.id === d.dumpsterId)!;
    if (d.room >= d.totalRooms) {
      // run complete
      const clog = [...d.log, mklog("Dumpster cleared. Climbing out with the goods!", "loot")];
      set({ dive: { ...d, log: clog, ended: true } });
      get().endDive(true);
      return;
    }
    // Kick off a short side-scrolling transition: cat runs right, bg scrolls
    // right-to-left, then the next room loads.
    const flavorPool = [
      "Diving deeper…",
      "Scrapper squeezes through the trash wall…",
      "Something rustles ahead…",
      "The dumpster groans around you…",
      "A new pile shifts in the dark…",
    ];
    const flavor = flavorPool[Math.floor(Math.random() * flavorPool.length)];
    const peekedNextKind = d.rooms[d.room]?.kind ?? d.currentKind;
    set({ dive: { ...d, transitioning: true, transitionMessage: flavor, nextKind: peekedNextKind,
      roomCleared: false, roomEvent: null,
      catPose: "idle", enemyPose: "idle", mangaFx: null, mangaWord: null, mangaFocus: null, bubble: null,
      // hide previous enemy immediately so the arena reads as empty during the run
      enemy: null, enemies: [],
    } });
    setTimeout(() => {
      const cur = get().dive;
      if (!cur || cur.ended) return;
      const nextRoom = cur.room + 1;
      const nextIdx = nextRoom - 1;
      const nextKind = cur.rooms[nextIdx].kind;
      const rooms = cur.rooms.map((r, i) => i === nextIdx ? { ...r, revealed: true }
        : i === nextIdx + 1 ? { ...r, revealed: true } : r);
      const wave = (nextKind === "enemy" || nextKind === "swarm" || nextKind === "elite" || nextKind === "miniboss" || nextKind === "boss")
        ? spawnEnemies(dump, nextKind, nextIdx) : [];
      const enemy = wave[0] ?? null;
      const rest = wave.slice(1);
      const log2 = [...cur.log,
        mklog(`Crawl deeper… Room ${nextRoom}/${cur.totalRooms} — ${roomLabel(nextKind)}`, "info"),
        enemy ? mklog(wave.length > 1
                ? `${wave.length} foes appear — ${enemy.name} steps up first!`
                : `A ${enemy.name} appears!`, "warn")
              : mklog(roomDescriptor(nextKind), "info"),
      ];
      set({ dive: { ...cur, room: nextRoom, rooms, currentKind: nextKind, enemy, enemies: rest,
        roomCleared: false, roomEvent: null, log: log2,
        catPose: "idle", enemyPose: enemy ? "idle" : "ko", mangaFx: null, mangaWord: null, mangaFocus: null, bubble: null,
        transitioning: false, transitionMessage: null, nextKind: null, roomRevealKey: cur.roomRevealKey + 1,
        enemyIntent: enemy ? pickEnemyIntent(nextKind) : null, pounceCd: 0,
      } });
    }, 1100);
  },

  toggleAuto: () => {
    const s = get();
    if (!s.dive) return;
    set({ dive: { ...s.dive, autoDive: !s.dive.autoDive } });
  },

  endDive: (escape) => {
    const s = get();
    if (!s.dive) return;
    const dump = s.dumpsters.find(d => d.id === s.dive!.dumpsterId)!;
    const multiplier = escape ? 1 : 0.5;
    const baseBones = s.dive.bonesFound > 0 ? s.dive.bonesFound : dump.rewardBones;
    const baseCaps = s.dive.capsFound > 0 ? s.dive.capsFound : dump.rewardCaps;
    const capMult = 1 + 0.1 * hideoutLevel(s, "bank"); // Bottle Cap Bank: +10% caps/level
    const vetMult = 1 + 0.02 * (s.playerLevel - 1);    // Veteran scavenger: account level pays off
    const bones = Math.round(baseBones * multiplier * vetMult);
    const caps = Math.round(baseCaps * multiplier * capMult * vetMult);
    const items = escape ? s.dive.collected : s.dive.collected.slice(0, Math.ceil(s.dive.collected.length / 2));
    set({ lastRewards: { items, bones, caps } });
  },

  collectRewards: () => {
    const s = get();
    if (!s.lastRewards) return;
    const newInv = [...s.inventory, ...s.lastRewards.items];
    const wasFled = s.dive?.fled ?? false;
    let levelUpMsg: string | null = null;
    const updatedCats = s.cats.map(c => {
      if (c.id !== s.dive?.catId) return c;
      if (wasFled) {
        return { ...c, status: "injured" as const, recoverySecondsLeft: 300, hp: Math.max(1, Math.round(c.maxHp * 0.3)) };
      }
      const before = c.level;
      const beforeSkills = knownSkillIds(c.id, c.level);
      const leveled = applyXp({ ...c, hp: c.maxHp }, 12);
      if (leveled.level > before) {
        const afterSkills = knownSkillIds(leveled.id, leveled.level);
        const learned = afterSkills.filter(id => !beforeSkills.includes(id)).map(id => SKILLS[id]?.name).filter(Boolean);
        levelUpMsg = `${leveled.name} reached Lv${leveled.level}!` +
          (learned.length ? ` Learned ${learned.join(", ")}!` : "");
      }
      return leveled;
    });
    // Only diving the current chapter's bin advances the story; free re-dives of
    // earlier bins just hand over loot. (Diving the current bin from the map
    // still counts as playing that beat.)
    const chapter = STORY_CHAPTERS[s.storyChapterIdx];
    const divedChapterBin = chapter && s.dive?.dumpsterId === CHAPTER_DUMPSTER[chapter.id];
    const shouldPlayOutro = !wasFled && chapter && !s.completedChapters.includes(chapter.id) && divedChapterBin;
    set({
      inventory: newInv,
      fishbones: s.fishbones + s.lastRewards.bones,
      bottlecaps: s.bottlecaps + s.lastRewards.caps,
      cats: updatedCats,
      dive: null,
      lastRewards: null,
      divesCompleted: s.divesCompleted + (wasFled ? 0 : 1),
      activeCutscene: shouldPlayOutro
        ? { chapterId: chapter.id, phase: "outro", panel: 0 }
        : s.activeCutscene,
    });
  },

  awardPlayerXp: (amount) => {
    if (amount <= 0) return;
    const s = get();
    set(rollPlayerXp(s.playerLevel, s.playerXp, amount));
  },

  equip: (itemId, catId) => {
    const s = get();
    const item = s.inventory.find(i => i.id === itemId);
    if (!item) return;
    const slot = item.kind === "weapon" ? "weapon" : item.kind === "armor" ? "armor" : item.kind === "relic" ? "relic" : null;
    if (!slot) return;
    const newInv = s.inventory.filter(i => i.id !== itemId);
    const cats = s.cats.map(c => {
      if (c.id !== catId) return c;
      return { ...c, equipment: { ...c.equipment, [slot]: item } };
    });
    const old = s.cats.find(c => c.id === catId)?.equipment[slot];
    set({ inventory: old ? [...newInv, old] : newInv, cats });
  },

  sell: (itemId) => {
    const s = get();
    const item = s.inventory.find(i => i.id === itemId);
    if (!item) return;
    set({
      inventory: s.inventory.filter(i => i.id !== itemId),
      fishbones: s.fishbones + item.sellPrice,
    });
  },

  upgrade: (id) => {
    const s = get();
    const u = s.hideout.find(h => h.id === id);
    if (!u || u.level >= u.maxLevel) return;
    const cb = u.costBones(u.level + 1);
    const cc = u.costCaps(u.level + 1);
    if (s.fishbones < cb || s.bottlecaps < cc) return;
    set({
      fishbones: s.fishbones - cb,
      bottlecaps: s.bottlecaps - cc,
      hideout: s.hideout.map(h => h.id === id ? { ...h, level: h.level + 1 } : h),
    });
  },

  buy: (cost, granted) => {
    const s = get();
    if (s.fishbones < cost.bones || s.bottlecaps < cost.caps) return false;
    set({
      fishbones: s.fishbones - cost.bones,
      bottlecaps: s.bottlecaps - cost.caps,
      inventory: [...s.inventory, granted],
    });
    return true;
  },

  // Mid-dive snack vendor: spend fishbones to top up consumables when the
  // bag runs dry. Price climbs a little per snack already in inventory so it
  // can't be spammed to trivialize a fight.
  buySnack: () => {
    const s = get();
    const snacks = s.inventory.filter(i => i.kind === "food").length;
    const price = 30 + snacks * 15;
    if (s.fishbones < price) {
      if (s.dive) {
        const warnLog = [...s.dive.log, mklog(`Need ${price} 🦴 for a snack from the alley vendor.`, "warn")];
        set({ dive: { ...s.dive, log: warnLog } });
      }
      return false;
    }
    const sardine = LOOT_POOL.find(i => i.name === "Sardine of Healing") ?? LOOT_POOL[8];
    const item: Item = { ...sardine, id: newItemId() };
    const log = s.dive
      ? [...s.dive.log, mklog(`Bought ${item.name} from a passing rat. -${price} 🦴`, "loot")]
      : null;
    set({
      fishbones: s.fishbones - price,
      inventory: [...s.inventory, item],
      dive: s.dive && log ? { ...s.dive, log } : s.dive,
    });
    return true;
  },

  buyShopItem: (item) => {
    const s = get();
    const disc = 1 - 0.05 * hideoutLevel(s, "fence"); // Raccoon Fence: cheaper prices
    const costBones = Math.ceil(item.costBones * disc);
    const costCaps = Math.ceil(item.costCaps * disc);
    if (s.fishbones < costBones || s.bottlecaps < costCaps) return false;
    const debit = { fishbones: s.fishbones - costBones, bottlecaps: s.bottlecaps - costCaps };
    const mk = (it: Omit<Item, "id">): Item => ({ ...it, id: newItemId() });
    const randOf = (pool: Omit<Item, "id">[]) => pool[Math.floor(Math.random() * pool.length)];

    switch (item.id) {
      case "tuna_snack": // +25 HP on the next dive
        set({ ...debit, nextDiveHp: s.nextDiveHp + 25 });
        return true;
      case "healing_sardine": { // revive a fallen/resting cat
        const idx = s.cats.findIndex(c => c.status === "injured" || c.status === "resting");
        if (idx === -1) return false; // nobody to revive — don't waste the purchase
        set({ ...debit, cats: s.cats.map((c, i) => i === idx
          ? { ...c, status: "ready" as const, recoverySecondsLeft: 0, hp: c.maxHp } : c) });
        return true;
      }
      case "premium_key": // unlock one locked-bin dive
        set({ ...debit, dumpsterKeys: s.dumpsterKeys + 1 });
        return true;
      case "shiny_junk": { // five pieces of junk
        const junk = LOOT_POOL.filter(i => i.kind === "junk");
        const pool = junk.length ? junk : LOOT_POOL.filter(i => i.rarity === "common");
        set({ ...debit, inventory: [...s.inventory, ...Array.from({ length: 5 }, () => mk(randOf(pool)))] });
        return true;
      }
      case "random_relic": { // a real relic
        const relics = LOOT_POOL.filter(i => i.kind === "relic");
        set({ ...debit, inventory: [...s.inventory, mk(randOf(relics.length ? relics : LOOT_POOL))] });
        return true;
      }
      case "mystery_bag":
      default: // a genuine mystery — any item in the pool
        set({ ...debit, inventory: [...s.inventory, mk(randOf(LOOT_POOL))] });
        return true;
    }
  },

  tickRecovery: (seconds) => {
    const s = get();
    const napMult = 1 + 0.25 * hideoutLevel(s, "nap"); // Nap Pile Recovery Zone
    let changed = false;
    const cats = s.cats.map(c => {
      if (c.status !== "injured" && c.status !== "resting") return c;
      changed = true;
      const left = c.recoverySecondsLeft - seconds * napMult;
      if (left <= 0) return { ...c, status: "ready" as const, recoverySecondsLeft: 0, hp: c.maxHp };
      return { ...c, recoverySecondsLeft: left }; // keep the float so the Nap Pile speedup isn't rounded away

    });
    if (changed) set({ cats });
  },

  craftRelic: () => {
    const s = get();
    if (hideoutLevel(s, "alchemy") < 1) return false; // Trash Alchemy Table not built
    const fodder = s.inventory.filter(i => i.kind === "junk" || i.kind === "crafting");
    if (fodder.length < 3) return false;
    const consumed = new Set(fodder.slice(0, 3).map(i => i.id));
    const relics = LOOT_POOL.filter(i => i.kind === "relic");
    const newRelic: Item = { ...relics[Math.floor(Math.random() * relics.length)], id: newItemId() };
    set({ inventory: [...s.inventory.filter(i => !consumed.has(i.id)), newRelic] });
    return true;
  },

  eatFood: (itemId) => {
    const s = get();
    const item = s.inventory.find(i => i.id === itemId);
    if (!item || item.kind !== "food") return;
    // Feed the cat who needs it most; cut their recovery downtime.
    let idx = -1, worst = 0;
    s.cats.forEach((c, i) => {
      if ((c.status === "injured" || c.status === "resting") && c.recoverySecondsLeft > worst) { worst = c.recoverySecondsLeft; idx = i; }
    });
    if (idx === -1) return; // nobody recovering — keep the snack for a dive
    const heal = Math.round((item.health ?? 20) * (1 + 0.2 * hideoutLevel(s, "pantry")));
    const cats = s.cats.map((c, i) => {
      if (i !== idx) return c;
      const left = c.recoverySecondsLeft - heal * 3;
      return left <= 0
        ? { ...c, status: "ready" as const, recoverySecondsLeft: 0, hp: c.maxHp }
        : { ...c, recoverySecondsLeft: left };
    });
    set({ inventory: s.inventory.filter(i => i.id !== itemId), cats });
  },

  openCutscene: (chapterId, phase) => {
    const s = get();
    const chapterBin = CHAPTER_DUMPSTER[chapterId];
    set({
      activeCutscene: { chapterId, phase, panel: 0 },
      seenIntros: phase === "intro" && !s.seenIntros.includes(chapterId)
        ? [...s.seenIntros, chapterId]
        : s.seenIntros,
      // Point the next dive at this chapter's bin so "Start Dive" plays the
      // story beat — not whatever bin was last picked on the map.
      selectedDumpsterId: phase === "intro" && chapterBin ? chapterBin : s.selectedDumpsterId,
    });
  },
  advanceCutscene: () => {
    const s = get();
    const c = s.activeCutscene;
    if (!c) return;
    const chapter = chapterById(c.chapterId);
    if (!chapter) { set({ activeCutscene: null }); return; }
    const panels = c.phase === "intro" ? chapter.intro : chapter.outro;
    if (c.panel < panels.length - 1) {
      set({ activeCutscene: { ...c, panel: c.panel + 1 } });
      return;
    }
    // last panel of phase
    if (c.phase === "intro") {
      // close — go play the chapter (dive)
      set({ activeCutscene: null });
      return;
    }
    // outro finished — mark complete, unlock stage, advance pointer
    const stage = chapter.unlocksStage ?? s.hideoutStage;
    const stageIdx = STAGE_ORDER.indexOf(stage);
    const curIdx = STAGE_ORDER.indexOf(s.hideoutStage);
    const nextStage = stageIdx > curIdx ? stage : s.hideoutStage;
    const completed = s.completedChapters.includes(chapter.id)
      ? s.completedChapters : [...s.completedChapters, chapter.id];
    const nextIdx = Math.min(STORY_CHAPTERS.length, s.storyChapterIdx + 1);
    // Detect a new evolution unlock to celebrate on the reward panel.
    const prevEvo = computeEvolution({
      completedChapters: s.completedChapters,
      roomsCleared: s.roomsCleared,
      bossesBeaten: s.bossesBeaten,
    });
    const nextEvo = computeEvolution({
      completedChapters: completed,
      roomsCleared: s.roomsCleared,
      bossesBeaten: s.bossesBeaten,
    });
    set({
      activeCutscene: null,
      hideoutStage: nextStage,
      completedChapters: completed,
      storyChapterIdx: nextIdx,
      pendingReward: {
        chapterId: chapter.id,
        newEvolution: nextEvo !== prevEvo ? nextEvo : undefined,
      },
    });
  },
  closeCutscene: () => {
    const s = get();
    const c = s.activeCutscene;
    // Skipping an outro must still complete the chapter, otherwise the
    // next dive replays the same chapter forever.
    if (c?.phase === "outro") {
      const chapter = chapterById(c.chapterId);
      if (chapter) {
        const stage = chapter.unlocksStage ?? s.hideoutStage;
        const stageIdx = STAGE_ORDER.indexOf(stage);
        const curIdx = STAGE_ORDER.indexOf(s.hideoutStage);
        const nextStage = stageIdx > curIdx ? stage : s.hideoutStage;
        const completed = s.completedChapters.includes(chapter.id)
          ? s.completedChapters : [...s.completedChapters, chapter.id];
        const nextIdx = Math.min(STORY_CHAPTERS.length, s.storyChapterIdx + 1);
        const prevEvo = computeEvolution({
          completedChapters: s.completedChapters,
          roomsCleared: s.roomsCleared,
          bossesBeaten: s.bossesBeaten,
        });
        const nextEvo = computeEvolution({
          completedChapters: completed,
          roomsCleared: s.roomsCleared,
          bossesBeaten: s.bossesBeaten,
        });
        set({
          activeCutscene: null,
          hideoutStage: nextStage,
          completedChapters: completed,
          storyChapterIdx: nextIdx,
          pendingReward: {
            chapterId: chapter.id,
            newEvolution: nextEvo !== prevEvo ? nextEvo : undefined,
          },
        });
        return;
      }
    }
    set({ activeCutscene: null });
  },
  makeChoice: (chapterId, optionId) => {
    const s = get();
    set({ storyChoices: { ...s.storyChoices, [chapterId]: optionId } });
  },
  placeItem: (slotId, itemId) => {
    const s = get();
    // remove from any other slot first
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(s.placedItems)) {
      if (v !== itemId) cleaned[k] = v;
    }
    cleaned[slotId] = itemId;
    set({ placedItems: cleaned });
  },
  unplaceItem: (slotId) => {
    const s = get();
    const next = { ...s.placedItems };
    delete next[slotId];
    set({ placedItems: next });
  },
  dismissReward: () => set({ pendingReward: null }),
  toggleSkipStoryline: () => set(s => ({ skipStoryline: !s.skipStoryline })),

  // ============================================================
  // RAID MODE — FFX-inspired CTB combat (post-story unlock)
  // ============================================================

  setRaidTeam: (catIds) => {
    const s = get();
    const valid = catIds
      .filter(id => s.cats.find(c => c.id === id))
      .slice(0, 3);
    set({ raidTeam: valid });
  },

  startRaid: (dungeonId) => {
    const s = get();
    const def = RAIDS.find(r => r.id === dungeonId);
    if (!def) return;
    const team = (s.raidTeam.length ? s.raidTeam : s.cats.slice(0, 3).map(c => c.id))
      .slice(0, 3);
    const party = team.map((id, i) => buildPartyActor(s, id, i)).filter(Boolean) as Actor[];
    if (party.length === 0) return;
    const enemies = buildEnemiesForRoom(def, 0);
    const startLog: RaidLogEntry[] = [
      mklog(`Raid started — ${def.name}`, "info") as unknown as RaidLogEntry,
      mklog(`Room 1/${def.rooms.length} — ${def.rooms[0].flavor}`, "info") as unknown as RaidLogEntry,
    ];
    const raid: RaidState = {
      dungeonId,
      party,
      enemies,
      log: startLog,
      floats: [],
      activeUid: null,
      resolving: false,
      overdriveOverlay: null,
      shakeKey: 0,
      flash: {},
      ended: false,
      victory: false,
      rewards: null,
    };
    set({ raid });
    // Kick off the first actor.
    setTimeout(() => advanceTurn(get, set), 80);
  },

  raidBasicAttack: (targetUid) => {
    actAsActive(get, set, (active, raid) => {
      const target = raid.enemies.find(e => e.uid === targetUid && e.alive);
      if (!target) return null;
      const hit = rollDamage(active, target, 1, active.element);
      applyDamage(raid, active, target, hit);
      return { tickCost: 1 };
    });
  },

  raidUseSkill: (skillId, targetUid) => {
    const skill = SKILLS[skillId];
    if (!skill) return;
    actAsActive(get, set, (active, raid) => {
      if (active.mp < skill.mpCost) return null;
      active.mp -= skill.mpCost;
      const targets = resolveTargets(skill, active, raid, targetUid);
      if (!targets.length) return null;
      const hits = Math.max(1, skill.hits ?? 1);

      for (const t of targets) {
        if (skill.kind === "heal") {
          const amt = rollHeal(active, t, skill.power);
          t.hp = Math.min(t.maxHp, t.hp + amt);
          raid.floats.push(newFloat(t.uid, amt, "heal"));
          pushLog(raid, `${active.name} heals ${t.name} +${amt}`, "heal");
        } else if (skill.kind === "buff" || skill.kind === "debuff") {
          // pure (de)buff — no direct damage, just apply the status
          if (skill.power > 0 && skill.kind === "debuff") {
            const hit = rollDamage(active, t, skill.power, skill.element);
            applyDamage(raid, active, t, hit);
          }
          applySkillStatus(raid, active, t, skill);
        } else {
          // damage — possibly multi-hit
          for (let h = 0; h < hits; h++) {
            const hit = rollDamage(active, t, skill.power, skill.element);
            applyDamage(raid, active, t, hit);
            if (!t.alive) break;
          }
          if (skill.applyStatus && t.alive) applySkillStatus(raid, active, t, skill);
        }
      }
      if (skill.kind === "buff" && (skill.target === "self" || skill.target === "allAllies")) {
        pushLog(raid, `${active.name} uses ${skill.name}!`, "heal");
      }
      return { tickCost: skill.tickCost ?? (skill.ultimate ? 1.6 : 1) };
    });
  },

  raidDefend: () => {
    actAsActive(get, set, (active, raid) => {
      active.statuses = [...active.statuses.filter(s => s.id !== "defend"),
        { id: "defend", turnsLeft: 2 }];
      active.od = Math.min(active.odMax, active.od + 6);
      pushLog(raid, `${active.name} braces — incoming damage reduced.`, "info");
      return { tickCost: 0.7 };
    });
  },

  raidUseItem: () => {
    const s = get();
    if (!s.raid) return;
    const foodIdx = s.inventory.findIndex(i => i.kind === "food");
    if (foodIdx === -1) return;
    const food = s.inventory[foodIdx];
    const heal = Math.max(20, food.health ?? 30);
    actAsActive(get, set, (active, raid) => {
      active.hp = Math.min(active.maxHp, active.hp + heal);
      raid.floats.push(newFloat(active.uid, heal, "heal"));
      pushLog(raid, `${active.name} munches ${food.name}. +${heal} HP`, "heal");
      return { tickCost: 0.8 };
    });
    set({ inventory: [...s.inventory.slice(0, foodIdx), ...s.inventory.slice(foodIdx + 1)] });
  },

  raidOverdrive: (targetUid) => {
    actAsActive(get, set, (active, raid) => {
      if (active.od < active.odMax) return null;
      const def = active.overdrive;
      active.od = 0;
      raid.overdriveOverlay = { uid: active.uid, def, key: Date.now() };
      raid.shakeKey += 1;
      pushLog(raid, `${active.name} unleashes ${def.name}!`, "crit");
      const enemies = raid.enemies.filter(e => e.alive);
      const party = raid.party.filter(p => p.alive);
      if (def.kind === "heal") {
        for (const ally of raid.party) {
          if (!ally.alive) {
            ally.alive = true;
            ally.hp = Math.round(ally.maxHp * 0.5);
            pushLog(raid, `${ally.name} revives!`, "heal");
          } else {
            const amt = rollHeal(active, ally, def.power);
            ally.hp = Math.min(ally.maxHp, ally.hp + amt);
            raid.floats.push(newFloat(ally.uid, amt, "heal"));
          }
        }
      } else {
        const targets = def.target === "one"
          ? (targetUid ? enemies.filter(e => e.uid === targetUid) : enemies.slice(0, 1))
          : enemies;
        for (let h = 0; h < def.hits; h++) {
          for (const t of targets) {
            if (!t.alive) continue;
            const hit = rollDamage(active, t, def.power, def.element);
            applyDamage(raid, active, t, hit);
          }
        }
      }
      return { tickCost: 1.4 };
    });
  },

  raidFlee: () => {
    const s = get();
    if (!s.raid) return;
    const raid: RaidState = { ...s.raid, ended: true, victory: false };
    pushLog(raid, "Your crew bails out the back. No spheres earned.", "warn");
    set({ raid });
  },

  raidAdvanceRoom: () => {
    const s = get();
    if (!s.raid) return;
    const def = RAIDS.find(r => r.id === s.raid!.dungeonId);
    if (!def) return;
    const currentRoomIdx = roomIndexFromState(s.raid, def);
    const nextIdx = currentRoomIdx + 1;
    if (nextIdx >= def.rooms.length) {
      // victory — already handled in advanceTurn; safety:
      set({ raid: { ...s.raid, ended: true, victory: true,
        rewards: def.rewards } });
      return;
    }
    const enemies = buildEnemiesForRoom(def, nextIdx);
    const party = s.raid.party.map(p => ({
      ...p, statuses: [], nextTick: tickFor(p),
      // small inter-room heal
      hp: p.alive ? Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.15)) : p.hp,
    }));
    const raid: RaidState = {
      ...s.raid,
      party, enemies,
      activeUid: null, resolving: false, overdriveOverlay: null,
      log: [...s.raid.log, mklog(`Room ${nextIdx + 1}/${def.rooms.length} — ${def.rooms[nextIdx].flavor}`, "info") as unknown as RaidLogEntry],
    };
    set({ raid });
    setTimeout(() => advanceTurn(get, set), 120);
  },

  raidClaim: () => {
    const s = get();
    if (!s.raid || !s.raid.rewards) {
      set({ raid: null });
      return;
    }
    const r = s.raid.rewards;
    const def = RAIDS.find(rd => rd.id === s.raid!.dungeonId);
    // Credit every room of the raid (counts toward the rooms-cleared evolution
    // gate and Story counter) and level up the cats that actually fought it
    // (derived from the party uids `p<idx>-<catId>`, robust to a stale team).
    const roomCredit = def?.rooms.length ?? 0;
    const fought = new Set(s.raid.party.map(p => p.uid.replace(/^p\d+-/, "")));
    const cats = s.cats.map(c => fought.has(c.id) ? applyXp({ ...c, hp: c.maxHp }, 30) : c);
    set({
      raid: null,
      spheres: s.spheres + r.spheres,
      fishbones: s.fishbones + r.bones,
      bottlecaps: s.bottlecaps + r.caps,
      bossesBeaten: s.bossesBeaten + 1,
      roomsCleared: s.roomsCleared + roomCredit,
      cats,
    });
  },

  spendSphere: (catId, nodeId) => {
    const s = get();
    if (s.spheres < NODE_COST) return;
    const layout = GRID_LAYOUTS[catId];
    if (!layout) return;
    const unlocked = s.catGrid[catId] ?? [];
    if (!isUnlockable(layout, unlocked, nodeId)) return;
    const nextUnlocked = [...unlocked, nodeId];
    // Re-apply aggregate to the cat's base stats.
    const cats = s.cats.map(c => {
      if (c.id !== catId) return c;
      const prevAgg = aggregateGrid(catId, unlocked);
      const newAgg = aggregateGrid(catId, nextUnlocked);
      const dHp = newAgg.hp - prevAgg.hp;
      const dAtk = newAgg.atk - prevAgg.atk;
      const dDef = newAgg.def - prevAgg.def;
      const dSpd = newAgg.spd - prevAgg.spd;
      return {
        ...c,
        maxHp: c.maxHp + dHp,
        hp: Math.min(c.maxHp + dHp, c.hp + dHp),
        attack: c.attack + dAtk,
        defense: c.defense + dDef,
        speed: c.speed + dSpd,
      };
    });
    set({
      spheres: s.spheres - NODE_COST,
      catGrid: { ...s.catGrid, [catId]: nextUnlocked },
      cats,
    });
  },
    }),
    {
      name: "alley-cat-game-v1",
      version: 1,
      // skipHydration + manual rehydrate (in __root) keeps SSR and the first
      // client render on defaults, so there's no hydration mismatch — real
      // progress pops in just after mount.
      skipHydration: true,
      // Persist durable progression only — never the in-flight battle, active
      // cutscene, or transient reward/FX state.
      partialize: (s) => ({
        playerLevel: s.playerLevel,
        playerXp: s.playerXp,
        fishbones: s.fishbones,
        bottlecaps: s.bottlecaps,
        cats: s.cats,
        activeCatId: s.activeCatId,
        inventory: s.inventory,
        nextDiveHp: s.nextDiveHp,
        dumpsterKeys: s.dumpsterKeys,
        dumpsters: s.dumpsters,
        selectedDumpsterId: s.selectedDumpsterId,
        hideout: s.hideout,
        storyChapterIdx: s.storyChapterIdx,
        completedChapters: s.completedChapters,
        seenIntros: s.seenIntros,
        storyChoices: s.storyChoices,
        hideoutStage: s.hideoutStage,
        placedItems: s.placedItems,
        spheres: s.spheres,
        catGrid: s.catGrid,
        raidTeam: s.raidTeam,
        roomsCleared: s.roomsCleared,
        bossesBeaten: s.bossesBeaten,
        divesCompleted: s.divesCompleted,
        skipStoryline: s.skipStoryline,
      }),
    },
  ),
);

// ============================================================
// Raid helpers (module-level)
// ============================================================

/** Apply a skill's status payload (buff/debuff/DoT) to a target. */
function applySkillStatus(raid: RaidState, source: Actor, target: Actor, skill: import("./raidTypes").Skill) {
  const sp = skill.applyStatus;
  if (!sp) return;
  // Replace any existing status of the same id (refresh duration/magnitude).
  target.statuses = [
    ...target.statuses.filter(st => st.id !== sp.id),
    {
      id: sp.id, turnsLeft: sp.turns,
      atkMod: sp.atkMod, defMod: sp.defMod, spdMod: sp.spdMod,
      dotPower: sp.dotPower, sourceAtk: source.atk,
    },
  ];
  const verb = (sp.atkMod ?? 0) > 0 || (sp.defMod ?? 0) > 0 || (sp.spdMod ?? 0) > 0 ? "is empowered" :
               sp.dotPower ? "is afflicted" : "is weakened";
  pushLog(raid, `${target.name} ${verb} by ${skill.name}`, "info");
}

function newFloat(uid: string, amount: number, kind: FloatingNumber["kind"], element?: import("./raidTypes").Element): FloatingNumber {
  return { id: ++_fxId, uid, amount, kind, element };
}

function pushLog(raid: RaidState, text: string, tone: RaidLogEntry["tone"] = "info") {
  raid.log.push({ id: ++_logId, text, tone });
}

export function xpForNextLevel(level: number): number {
  return 30 + level * 10;
}

function levelGains(cat: Cat): { hp: number; atk: number; def: number; spd: number } {
  switch (cat.catClass) {
    case "Knight":      return { hp: 6, atk: 1, def: 2, spd: 0 };
    case "Sneak":       return { hp: 3, atk: 2, def: 0, spd: 2 };
    case "Moldmancer":  return { hp: 3, atk: 2, def: 1, spd: 1 };
    case "Greasefang":  return { hp: 4, atk: 2, def: 1, spd: 1 };
    case "Scrapper":
    default:            return { hp: 5, atk: 2, def: 1, spd: 1 };
  }
}

export function applyXp(cat: Cat, amount: number): Cat {
  let { level, xp, attack, defense, speed, maxHp } = cat;
  xp += amount;
  let leveled = false;
  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level += 1;
    const g = levelGains(cat);
    maxHp += g.hp; attack += g.atk; defense += g.def; speed += g.spd;
    leveled = true;
  }
  return { ...cat, level, xp, attack, defense, speed, maxHp, hp: leveled ? maxHp : cat.hp };
}

/** Roll the player-account XP bar (0–100 per level) and carry into levels. */
export function rollPlayerXp(playerLevel: number, playerXp: number, amount: number): { playerLevel: number; playerXp: number } {
  let level = playerLevel;
  let xp = playerXp + amount;
  while (xp >= 100) { xp -= 100; level += 1; }
  return { playerLevel: level, playerXp: xp };
}

export function effectiveStats(cat: Cat): { attack: number; defense: number; speed: number; maxHp: number } {
  let attack = cat.attack, defense = cat.defense, speed = cat.speed, maxHp = cat.maxHp;
  for (const slot of ["weapon", "armor", "relic"] as const) {
    const it = cat.equipment[slot];
    if (!it) continue;
    attack += it.attack ?? 0;
    defense += it.defense ?? 0;
    speed += it.speed ?? 0;
    maxHp += it.health ?? 0;
  }
  return { attack, defense, speed, maxHp };
}

/** Level of a hideout upgrade (0 if not built). */
function hideoutLevel(s: GameState, id: string): number {
  return s.hideout.find(h => h.id === id)?.level ?? 0;
}

/**
 * A cat's full COMBAT stats: base (already includes level gains + sphere-grid)
 * plus equipped gear, the account evolution bonus, and passive hideout upgrades
 * (Cardboard Castle = +8% max HP/level, Scratching Post Gym = +5% ATK/level).
 * Use this everywhere the game actually fights so gear/evolution/hideout are
 * real, not just display text.
 */
function withCombatStats(s: GameState, cat: Cat, crewAssist = false): Cat {
  const eff = effectiveStats(cat);
  const evo = EVOLUTIONS[computeEvolution({
    completedChapters: s.completedChapters,
    roomsCleared: s.roomsCleared,
    bossesBeaten: s.bossesBeaten,
  })].statBonus;
  const atkPct = 0.05 * hideoutLevel(s, "gym");
  const hpPct = 0.08 * hideoutLevel(s, "castle");
  // Multi-Cat Dive Support (Ch7 reward): ready crewmates back the diver up.
  const allies = (crewAssist && s.completedChapters.includes("ch7_rally"))
    ? s.cats.filter(c => c.id !== cat.id && c.status === "ready").length : 0;
  return {
    ...cat,
    attack: Math.round((eff.attack + evo.atk) * (1 + atkPct)) + allies,
    defense: eff.defense + evo.def,
    speed: eff.speed,
    maxHp: Math.round((eff.maxHp + evo.hp) * (1 + hpPct)) + allies * 3,
  };
}

function buildPartyActor(s: GameState, catId: string, idx: number): Actor | null {
  const cat = s.cats.find(c => c.id === catId);
  if (!cat) return null;
  const tpl = PARTY_TEMPLATES[catId] ?? PARTY_TEMPLATES.scrapper;
  // Skills grow with the cat's level (template skills + level-gated learnset).
  const skills = knownSkillIds(catId, cat.level).map(id => SKILLS[id]).filter(Boolean);
  const eff = withCombatStats(s, cat);
  const agg = aggregateGrid(catId, s.catGrid[catId] ?? []);
  return {
    uid: `p${idx}-${cat.id}`,
    side: "party",
    name: cat.name,
    portrait: cat.portrait,
    hp: eff.maxHp, maxHp: eff.maxHp,
    mp: tpl.mp + agg.mp, maxMp: tpl.mp + agg.mp,
    atk: eff.attack,
    def: eff.defense,
    spd: eff.speed,
    od: 0, odMax: 100 - agg.od,
    element: tpl.element,
    weak: tpl.weak,
    resist: tpl.resist,
    nullEl: [],
    skills,
    overdrive: tpl.od,
    statuses: [],
    nextTick: 0,
    alive: true,
    knownTypes: [],
  };
}

function buildEnemiesForRoom(def: RaidDef, roomIdx: number): Actor[] {
  const room = def.rooms[roomIdx];
  return room.enemyIds.map((eid, i) => {
    const t = RAID_ENEMIES[eid];
    const isBoss = roomIdx === def.rooms.length - 1 && room.enemyIds.length === 1;
    const hp = Math.round(t.hp * (1 + def.difficulty * 0.05));
    return {
      uid: `e${roomIdx}-${i}-${eid}`,
      side: "enemy",
      name: t.name,
      emoji: t.emoji,
      portrait: ENEMY_SPRITES[eid],
      hp, maxHp: hp,
      mp: t.mp ?? 30, maxMp: t.mp ?? 30,
      atk: t.atk, def: t.def, spd: t.spd,
      od: 0, odMax: isBoss ? 100 : 9999,  // only bosses can OD
      element: t.element,
      weak: t.weak, resist: t.resist, nullEl: t.nullEl ?? [],
      skills: (t.skills ?? []).map(id => SKILLS[id]).filter(Boolean),
      overdrive: { ...OVERDRIVES.hairball_cannon, power: t.odPower ?? 2.4, name: `${t.name} Rage` },
      statuses: [],
      nextTick: Math.round(BASE_TICK / Math.max(1, t.spd)) * (i + 1),
      alive: true,
      knownTypes: [],
    } as Actor;
  });
}

function roomIndexFromState(raid: RaidState, def: RaidDef): number {
  // Determine by enemy uid prefix `e{idx}-`.
  const e = raid.enemies[0];
  if (!e) return 0;
  const m = e.uid.match(/^e(\d+)-/);
  return m ? Number(m[1]) : 0;
}

function resolveTargets(skill: Skill, attacker: Actor, raid: RaidState, targetUid?: string): Actor[] {
  const allies = raid.party.filter(p => p.alive);
  const foes   = raid.enemies.filter(e => e.alive);
  if (skill.target === "allAllies")  return allies;
  if (skill.target === "allEnemies") return foes;
  if (skill.target === "self")       return [attacker];
  if (targetUid) {
    const pool = skill.kind === "heal" ? allies : foes;
    const t = pool.find(a => a.uid === targetUid);
    if (t) return [t];
  }
  return foes.slice(0, 1);
}

function applyDamage(raid: RaidState, attacker: Actor, target: Actor, hit: ReturnType<typeof rollDamage>) {
  target.hp = Math.max(0, target.hp - hit.damage);
  raid.floats.push({
    id: ++_fxId, uid: target.uid, amount: hit.damage,
    kind: hit.crit ? "crit" : hit.tag === "weak" ? "weak" : hit.tag === "resist" ? "resist" : hit.tag === "null" ? "null" : "dmg",
    element: hit.element,
  });
  raid.flash = { ...raid.flash, [target.uid]: (raid.flash[target.uid] ?? 0) + 1 };
  if (hit.crit) raid.shakeKey += 1;
  // mark known weakness
  if (hit.tag === "weak" && !target.knownTypes.includes(hit.element)) {
    target.knownTypes = [...target.knownTypes, hit.element];
  }
  const tone: RaidLogEntry["tone"] = hit.crit ? "crit" : hit.tag === "weak" ? "hit" : "info";
  const flavor = hit.tag === "weak" ? " (WEAK!)" : hit.tag === "resist" ? " (resisted)" : hit.tag === "null" ? " (no effect)" : "";
  pushLog(raid, `${attacker.name} → ${target.name} ${hit.damage}${flavor}${hit.crit ? " ★" : ""}`, tone);
  if (target.hp <= 0) {
    target.alive = false;
    pushLog(raid, `${target.name} is KO'd!`, "warn");
  }
  // OD gains
  attacker.od = Math.min(attacker.odMax, attacker.od + Math.round(hit.damage * 0.16));
  target.od   = Math.min(target.odMax,   target.od   + Math.round((hit.damage / Math.max(1,target.maxHp)) * 25));
}

/** Pull the active actor (from the raid object) and run a player-side action.
 *  Callback returns the tick cost for the action (or null to cancel). */
function actAsActive(
  get: () => GameState,
  set: (partial: Partial<GameState>) => void,
  fn: (active: Actor, raid: RaidState) => { tickCost: number } | null,
) {
  const s = get();
  if (!s.raid || s.raid.ended || s.raid.resolving) return;
  const raid: RaidState = cloneRaid(s.raid);
  const active = [...raid.party].find(p => p.uid === raid.activeUid && p.alive);
  if (!active || active.side !== "party") return;
  const result = fn(active, raid);
  if (!result) {
    set({ raid });
    return;
  }
  active.nextTick += tickFor(active, result.tickCost);
  raid.activeUid = null;
  raid.resolving = true;
  set({ raid });
  setTimeout(() => finishTurnAndAdvance(get, set), 620);
}

function finishTurnAndAdvance(
  get: () => GameState,
  set: (partial: Partial<GameState>) => void,
) {
  const s = get();
  if (!s.raid) return;
  const raid = cloneRaid(s.raid);
  // Check end states.
  if (raid.enemies.every(e => !e.alive)) {
    // Room cleared — pause for confirmation, advance via raidAdvanceRoom.
    raid.resolving = false;
    raid.activeUid = null;
    pushLog(raid, "Room cleared!", "heal");
    const def = RAIDS.find(r => r.id === raid.dungeonId)!;
    const idx = roomIndexFromState(raid, def);
    if (idx >= def.rooms.length - 1) {
      raid.ended = true;
      raid.victory = true;
      raid.rewards = def.rewards;
      pushLog(raid, `Raid complete — +${def.rewards.spheres} 💠  +${def.rewards.bones} 🦴`, "heal");
    }
    set({ raid });
    return;
  }
  if (raid.party.every(p => !p.alive)) {
    raid.ended = true;
    raid.victory = false;
    pushLog(raid, "Party wiped. Raid failed.", "warn");
    set({ raid });
    return;
  }
  raid.resolving = false;
  set({ raid });
  advanceTurn(get, set);
}

function advanceTurn(
  get: () => GameState,
  set: (partial: Partial<GameState>) => void,
) {
  const s = get();
  if (!s.raid || s.raid.ended) return;
  const raid = cloneRaid(s.raid);
  const allActors = [...raid.party, ...raid.enemies];
  const normalized = normalizeTicks(allActors);
  const N = raid.party.length;
  raid.party = normalized.slice(0, N);
  raid.enemies = normalized.slice(N);
  const next = pickActive([...raid.party, ...raid.enemies]);
  if (!next) return;
  // Tick statuses at start of turn (applies poison/burn DoT, expires buffs).
  const applyTick = (arr: Actor[]) => arr.map(a => {
    if (a.uid !== next.uid) return a;
    const { actor, dotDamage } = tickStatuses(a);
    if (dotDamage > 0) {
      raid.floats.push(newFloat(actor.uid, dotDamage, "dmg"));
      pushLog(raid, `${actor.name} takes ${dotDamage} from poison/burn`, "warn");
      if (!actor.alive) pushLog(raid, `${actor.name} succumbs!`, "warn");
    }
    return actor;
  });
  raid.party = applyTick(raid.party);
  raid.enemies = applyTick(raid.enemies);
  raid.activeUid = next.uid;
  // A DoT may have killed the active actor — if so, skip its turn.
  const stillAlive = [...raid.party, ...raid.enemies].find(a => a.uid === next.uid)?.alive;
  set({ raid });
  if (!stillAlive) { setTimeout(() => finishTurnAndAdvance(get, set), 200); return; }

  if (next.side === "enemy") {
    raid.resolving = true;
    set({ raid });
    setTimeout(() => runEnemyTurn(get, set, next.uid), 380);
  }
}

function runEnemyTurn(
  get: () => GameState,
  set: (partial: Partial<GameState>) => void,
  enemyUid: string,
) {
  const s = get();
  if (!s.raid) return;
  const raid = cloneRaid(s.raid);
  const self = raid.enemies.find(e => e.uid === enemyUid && e.alive);
  if (!self) {
    raid.resolving = false;
    set({ raid });
    advanceTurn(get, set);
    return;
  }
  const decision = chooseEnemyAction(self, raid.party);
  let tickCost = 1;
  if (decision.kind === "attack") {
    const t = raid.party.find(p => p.uid === decision.target.uid && p.alive);
    if (t) {
      const hit = rollDamage(self, t, 1, self.element);
      applyDamage(raid, self, t, hit);
    }
  } else if (decision.kind === "skill") {
    self.mp -= decision.skill.mpCost;
    const targets = decision.targets
      .map(t => (t.side === "enemy" ? raid.enemies : raid.party).find(a => a.uid === t.uid))
      .filter((a): a is Actor => !!a && a.alive);
    const eHits = Math.max(1, decision.skill.hits ?? 1);
    for (const t of targets) {
      if (decision.skill.kind === "heal") {
        const amt = rollHeal(self, t, decision.skill.power);
        t.hp = Math.min(t.maxHp, t.hp + amt);
        raid.floats.push(newFloat(t.uid, amt, "heal"));
        pushLog(raid, `${self.name} heals ${t.name} +${amt}`, "heal");
      } else if (decision.skill.kind === "buff" || decision.skill.kind === "debuff") {
        if (decision.skill.power > 0) {
          const hit = rollDamage(self, t, decision.skill.power, decision.skill.element);
          applyDamage(raid, self, t, hit);
        }
        applySkillStatus(raid, self, t, decision.skill);
      } else {
        for (let h = 0; h < eHits; h++) {
          const hit = rollDamage(self, t, decision.skill.power, decision.skill.element);
          applyDamage(raid, self, t, hit);
          if (!t.alive) break;
        }
        if (decision.skill.applyStatus && t.alive) applySkillStatus(raid, self, t, decision.skill);
      }
    }
    tickCost = decision.skill.tickCost ?? 1;
  } else if (decision.kind === "defend") {
    self.statuses = [...self.statuses.filter(s => s.id !== "defend"), { id: "defend", turnsLeft: 2 }];
    pushLog(raid, `${self.name} braces.`, "info");
    tickCost = 0.7;
  } else if (decision.kind === "overdrive") {
    self.od = 0;
    raid.overdriveOverlay = { uid: self.uid, def: self.overdrive, key: Date.now() };
    raid.shakeKey += 1;
    pushLog(raid, `${self.name} unleashes ${self.overdrive.name}!`, "crit");
    for (const t of decision.targets) {
      const target = raid.party.find(p => p.uid === t.uid && p.alive);
      if (!target) continue;
      const hit = rollDamage(self, target, self.overdrive.power, self.overdrive.element);
      applyDamage(raid, self, target, hit);
    }
    tickCost = 1.4;
  }
  self.nextTick += tickFor(self, tickCost);
  raid.activeUid = null;
  raid.resolving = true;
  set({ raid });
  setTimeout(() => finishTurnAndAdvance(get, set), 620);
}

function cloneRaid(raid: RaidState): RaidState {
  return {
    ...raid,
    party: raid.party.map(p => ({ ...p, statuses: [...p.statuses], skills: [...p.skills], knownTypes: [...p.knownTypes] })),
    enemies: raid.enemies.map(e => ({ ...e, statuses: [...e.statuses], skills: [...e.skills], knownTypes: [...e.knownTypes] })),
    log: [...raid.log],
    floats: raid.floats.slice(-40),
    flash: { ...raid.flash },
  };
}

function roomLabel(k: RoomKind): string {
  return ({ enemy: "Enemy", swarm: "Swarm", elite: "Elite", loot: "Loot", hazard: "Hazard", rest: "Rest", miniboss: "Mini-Boss", boss: "BOSS" } as const)[k];
}
function roomDescriptor(k: RoomKind): string {
  return ({
    enemy: "Something's rustling…",
    swarm: "A pack of critters skitters out at once!",
    elite: "A scarred, oversized foe blocks the path.",
    loot: "A glittering pile of trash treasure!",
    hazard: "Glowing green ooze drips from above. Careful.",
    rest: "A warm laundry pile. Safe… for now.",
    miniboss: "A bigger silhouette looms.",
    boss: "The whole dumpster shakes. Something huge is here.",
  } as const)[k];
}

export const rarityClass = (r: Rarity): string => ({
  common: "border-rarity-common text-rarity-common",
  uncommon: "border-rarity-uncommon text-rarity-uncommon",
  rare: "border-rarity-rare text-rarity-rare",
  epic: "border-rarity-epic text-rarity-epic",
  legendary: "border-rarity-legendary text-rarity-legendary",
  mythic: "border-rarity-mythic text-rarity-mythic",
})[r];

export const rarityGlow = (r: Rarity): string => ({
  common: "shadow-[0_0_0_0_transparent]",
  uncommon: "shadow-[0_0_12px_rgba(74,222,128,0.4)]",
  rare: "shadow-[0_0_14px_rgba(59,130,246,0.5)]",
  epic: "shadow-[0_0_18px_rgba(168,85,247,0.55)]",
  legendary: "shadow-[0_0_22px_rgba(250,204,21,0.65)]",
  mythic: "shadow-[0_0_26px_rgba(239,68,68,0.7)]",
})[r];

// ---- Dive combat helpers (placed last so all referenced module consts are initialized) ----
function clearDiveRoom(
  get: () => GameState,
  set: (partial: Partial<GameState>) => void,
  ctx: {
    enemy: Enemy; catHp: number; catMp: number;
    catStatuses: import("./raidTypes").Status[]; enemyStatuses: import("./raidTypes").Status[];
    log: CombatEntry[]; fx: Fx[];
    shakeKey: number; shakeHard: boolean; enemyFlashKey: number; catFlashKey: number; enemyDefeatKey: number;
    catPose: DiveState["catPose"]; mangaFx: DiveState["mangaFx"]; mangaWord: DiveState["mangaWord"]; mangaFocus: DiveState["mangaFocus"];
    bubble: DiveState["bubble"]; knockbackKey: number; panelSplitKey: number;
  },
) {
  const s = get();
  const d = s.dive!;
  const dump = s.dumpsters.find(x => x.id === d.dumpsterId)!;
  const isBoss = d.currentKind === "boss";
  const isMini = d.currentKind === "miniboss";
  const dropCount = isBoss ? 3 : isMini ? 2 : 1;
  const newDrops: Item[] = [];
  for (let i = 0; i < dropCount; i++) newDrops.push(rollLoot(dump.expectedLoot));
  const bonesGain = Math.round((dump.rewardBones / d.totalRooms) * (isBoss ? 1.8 : isMini ? 1.3 : 1));
  const capsGain = Math.round((dump.rewardCaps / d.totalRooms) * (isBoss ? 1.8 : isMini ? 1.3 : 1));
  let log = [...ctx.log];
  newDrops.forEach(dr => { log = [...log, mklog(`✨ Looted ${dr.name}`, "loot")]; });
  log = [...log, mklog(`Room cleared. +${bonesGain} 🦴 +${capsGain} 🧴`, "loot")];
  const rooms = d.rooms.map((r, i) => i === d.room - 1 ? { ...r, cleared: true } : r);
  set({
    ...rollPlayerXp(s.playerLevel, s.playerXp, isBoss ? 40 : isMini ? 24 : 14),
    roomsCleared: s.roomsCleared + 1,
    bossesBeaten: s.bossesBeaten + (isBoss ? 1 : 0),
  });
  set({ dive: { ...d,
    enemy: { ...ctx.enemy }, catHp: ctx.catHp, catMp: ctx.catMp,
    catStatuses: ctx.catStatuses, enemyStatuses: ctx.enemyStatuses,
    collected: [...d.collected, ...newDrops],
    bonesFound: d.bonesFound + bonesGain, capsFound: d.capsFound + capsGain,
    log, rooms, roomCleared: true, autoDive: false,
    roomEvent: `+${bonesGain} 🦴  +${capsGain} 🧴  ·  ${dropCount} item${dropCount > 1 ? "s" : ""}`,
    shakeKey: ctx.shakeKey, shakeHard: ctx.shakeHard, enemyFlashKey: ctx.enemyFlashKey,
    catFlashKey: ctx.catFlashKey, enemyDefeatKey: ctx.enemyDefeatKey + 1,
    catPose: "victory", enemyPose: "ko", mangaFx: ctx.mangaFx, mangaWord: ctx.mangaWord, mangaFocus: ctx.mangaFocus,
    combo: 0, comboLastAction: null, knockbackKey: ctx.knockbackKey, panelSplitKey: ctx.panelSplitKey,
    bubble: ctx.bubble, inAction: false, enemyIntent: null, pounceCd: 0,
  } });
}

// --- Dive status-effect helpers (shared shape with raid statuses) ---
function tickDiveStatuses(list: import("./raidTypes").Status[]): { next: import("./raidTypes").Status[]; dot: number } {
  let dot = 0;
  for (const st of list) {
    if (st.dotPower && st.sourceAtk) dot += Math.max(1, Math.round(st.sourceAtk * st.dotPower));
  }
  const next = list.map(st => ({ ...st, turnsLeft: st.turnsLeft - 1 })).filter(st => st.turnsLeft > 0);
  return { next, dot };
}
function sumStatusMod(statuses: import("./raidTypes").Status[], key: "atkMod" | "defMod" | "spdMod"): number {
  let m = 0;
  for (const st of statuses) m += (st[key] ?? 0);
  return m;
}
function applyStatusList(
  list: import("./raidTypes").Status[],
  sp: NonNullable<import("./raidTypes").Skill["applyStatus"]>,
  sourceAtk: number,
): import("./raidTypes").Status[] {
  return [
    ...list.filter(st => st.id !== sp.id),
    { id: sp.id, turnsLeft: sp.turns, atkMod: sp.atkMod, defMod: sp.defMod, spdMod: sp.spdMod, dotPower: sp.dotPower, sourceAtk },
  ];
}
