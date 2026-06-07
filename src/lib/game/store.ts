import { create } from "zustand";
import {
  DUMPSTERS, ENEMIES, HIDEOUT_UPGRADES, INITIAL_CATS, LOOT_POOL, newItemId,
} from "./data";
import type {
  Cat, Dumpster, Enemy, Fx, HideoutUpgrade, Item, Rarity, Room, RoomKind,
} from "./types";
import { STORY_CHAPTERS, STAGE_ORDER, type HideoutStage, chapterById } from "./story";
import { computeEvolution, type EvolutionStage } from "./evolution";

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
}

interface GameState {
  playerLevel: number;
  playerXp: number;
  fishbones: number;
  bottlecaps: number;
  cats: Cat[];
  activeCatId: string;
  inventory: Item[];
  dumpsters: Dumpster[];
  selectedDumpsterId: string;
  hideout: HideoutUpgrade[];
  dive: DiveState | null;
  lastRewards: { items: Item[]; bones: number; caps: number } | null;

  // story
  storyChapterIdx: number;             // 0-based pointer to next chapter to play
  completedChapters: string[];
  storyChoices: Record<string, string>;
  hideoutStage: HideoutStage;
  placedItems: Record<string, string>; // slotId -> itemId
  activeCutscene: { chapterId: string; phase: "intro" | "outro"; panel: number } | null;
  /** Reward panel shown after a chapter outro before returning to gameplay. */
  pendingReward: { chapterId: string; newEvolution?: EvolutionStage } | null;

  // progression milestones
  roomsCleared: number;
  bossesBeaten: number;
  divesCompleted: number;

  selectDumpster: (id: string) => void;
  setActiveCat: (id: string) => void;
  startDive: () => void;
  doAction: (action: "scratch" | "pounce" | "item" | "flee") => void;
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
  buySnack: () => boolean;

  openCutscene: (chapterId: string, phase: "intro" | "outro") => void;
  advanceCutscene: () => void;
  closeCutscene: () => void;
  makeChoice: (chapterId: string, optionId: string) => void;
  placeItem: (slotId: string, itemId: string) => void;
  unplaceItem: (slotId: string) => void;
  dismissReward: () => void;
  /** Derived: current evolution from milestones. */
  getEvolution: () => EvolutionStage;
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

const generateRooms = (totalRooms: number): Room[] => {
  const arr: RoomKind[] = Array.from({ length: totalRooms }, () => "enemy" as RoomKind);
  arr[totalRooms - 1] = "boss";
  if (totalRooms >= 3) arr[1] = Math.random() < 0.5 ? "loot" : "rest";
  if (totalRooms >= 4) arr[2] = "swarm";
  if (totalRooms >= 5) arr[Math.floor(totalRooms / 2)] = "elite";
  if (totalRooms >= 6) arr[Math.max(3, totalRooms - 3)] = Math.random() < 0.5 ? "hazard" : "loot";
  if (totalRooms >= 7) arr[totalRooms - 2] = "miniboss";
  return arr.map((k, i) => ({ kind: k, cleared: false, revealed: i === 0 }));
};

const spawnEnemy = (dump: Dumpster, kind: RoomKind, roomIdx: number): Enemy => {
  // Pick a random enemy from the pool so repeat dives don't always face the
  // same lineup. Boss room uses the last entry as the "signature" boss.
  const enemyKey = kind === "boss"
    ? dump.enemyPool[dump.enemyPool.length - 1]
    : dump.enemyPool[Math.floor(Math.random() * dump.enemyPool.length)];
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
    hp = Math.round(hp * (1.45 + dump.difficulty * 0.18));
    atk = Math.round(atk * (1.15 + dump.difficulty * 0.06));
    name = "BOSS — " + name;
    emoji = "👑";
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

export const useGame = create<GameState>((set, get) => ({
  playerLevel: 14,
  playerXp: 65,
  fishbones: 1240,
  bottlecaps: 48,
  cats: INITIAL_CATS,
  activeCatId: "scrapper",
  inventory: seedInventory,
  dumpsters: DUMPSTERS,
  selectedDumpsterId: "greasy",
  hideout: HIDEOUT_UPGRADES,
  dive: null,
  lastRewards: null,

  storyChapterIdx: 0,
  completedChapters: [],
  storyChoices: {},
  hideoutStage: "tin_can",
  placedItems: {},
  activeCutscene: { chapterId: STORY_CHAPTERS[0].id, phase: "intro", panel: 0 },
  pendingReward: null,
  roomsCleared: 0,
  bossesBeaten: 0,
  divesCompleted: 0,

  selectDumpster: (id) => set({ selectedDumpsterId: id }),
  setActiveCat: (id) => {
    const cat = get().cats.find(c => c.id === id);
    if (!cat || cat.status !== "ready") return;
    set({ activeCatId: id });
  },

  startDive: () => {
    const s = get();
    const dump = s.dumpsters.find(d => d.id === s.selectedDumpsterId);
    const cat = s.cats.find(c => c.id === s.activeCatId);
    if (!dump || !cat || dump.status === "locked") return;
    const rooms = generateRooms(dump.rooms);
    const firstKind = rooms[0].kind;
    const wave = (firstKind === "enemy" || firstKind === "swarm" || firstKind === "elite" || firstKind === "miniboss" || firstKind === "boss")
      ? spawnEnemies(dump, firstKind, 0) : [];
    const enemy = wave[0] ?? null;
    const rest = wave.slice(1);
    set({
      dive: {
        dumpsterId: dump.id,
        catId: cat.id,
        room: 1,
        totalRooms: dump.rooms,
        rooms,
        currentKind: firstKind,
        enemy,
        enemies: rest,
        catHp: cat.hp,
        catMaxHp: cat.maxHp,
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
      setTimeout(() => get().doAction("scratch"), 50);
    }
  },

  doAction: (action) => {
    const s = get();
    if (!s.dive || s.dive.ended) return;
    const d = s.dive;
    const cat = s.cats.find(c => c.id === d.catId)!;
    const dump = s.dumpsters.find(x => x.id === d.dumpsterId)!;

    if (action === "flee") {
      const clog = [...d.log, mklog("You bolt for the lid! Half the loot stays behind.", "warn")];
      set({ dive: { ...d, log: clog, ended: true, fled: true } });
      get().endDive(false);
      return;
    }
    if (d.roomCleared || !d.enemy) return;
    if (d.inAction) return;   // turn-based lock: wait for enemy counter to resolve

    let { catHp, enemy, collected, log: clog, bonesFound, capsFound, fx,
      shakeKey, shakeHard, enemyFlashKey, catFlashKey, enemyDefeatKey, lastLootKey,
      combo, comboLastAction, panelSplitKey, knockbackKey, catKnockbackKey } = d;
    enemy = { ...enemy! };

    if (action === "item") {
      // Healing now consumes a food item from inventory.
      const foodIdx = s.inventory.findIndex(i => i.kind === "food");
      if (foodIdx === -1) {
        const warnLog = [...clog, mklog("No snacks left in your bag!", "warn")];
        set({ dive: { ...d, log: warnLog } });
        return;
      }
      const food = s.inventory[foodIdx];
      const heal = Math.max(10, food.health ?? 20);
      catHp = Math.min(d.catMaxHp, catHp + heal);
      clog = [...clog, mklog(`Munched ${food.name}. +${heal} HP`, "loot")];
      fx = [...fx, { id: nextFxId(), target: "cat", kind: "heal", amount: heal }];
      const newInv = [...s.inventory.slice(0, foodIdx), ...s.inventory.slice(foodIdx + 1)];
      set({ inventory: newInv });
      // item breaks combo
      combo = 0;
      comboLastAction = null;
    } else {
      const isCrit = Math.random() < (action === "pounce" ? 0.28 : 0.14);
      // Momentum: alternating actions and reaching combo 3+ ramps damage
      const isFinisher = combo >= 2 && comboLastAction !== null && comboLastAction !== action;
      const comboMult = 1 + Math.min(combo, 4) * 0.12 + (isFinisher ? 0.5 : 0);
      const base = action === "pounce" ? cat.attack * 1.6 : cat.attack;
      const dmg = Math.round(base * (isCrit ? 2 : 1) * comboMult * (0.85 + Math.random() * 0.3));
      enemy.hp = Math.max(0, enemy.hp - dmg);
      const verb = action === "pounce" ? "pounces" : "scratches";
      const suffix = isFinisher ? " — COMBO FINISHER!" : isCrit ? " (CRIT!)" : "";
      clog = [...clog, mklog(`${cat.name} ${verb} for ${dmg}${suffix}`, isFinisher || isCrit ? "crit" : "hit")];
      fx = [...fx, { id: nextFxId(), target: "enemy", kind: isCrit ? "crit" : "dmg", amount: dmg }];
      enemyFlashKey += 1;
      shakeKey += 1;
      shakeHard = isCrit || action === "pounce" || isFinisher;
      // momentum bookkeeping
      combo = combo + 1;
      comboLastAction = action;
      // big hits knock the enemy back
      if (isCrit || isFinisher || action === "pounce") knockbackKey += 1;
      // combo finisher triggers split-screen panel
      if (isFinisher) { panelSplitKey += 1; }
    }

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

    if (enemy.hp > 0 && action !== "item") {
      // Enemies hit harder: bigger base swing, lower defense scaling.
      const incoming = Math.max(2, Math.round(enemy.attack * (0.95 + Math.random() * 0.45) - cat.defense * 0.28));
      const blocked = incoming <= Math.max(3, Math.round(cat.defense * 0.35));
      const heavy = incoming >= 18;
      const nextCatFlash = catFlashKey + 1;
      const nextCatKb = heavy ? catKnockbackKey + 1 : catKnockbackKey;
      if (heavy) { combo = 0; comboLastAction = null; }
      else if (!blocked && combo > 2) combo = Math.max(0, combo - 1);
      counter = {
        incoming,
        blocked,
        enemyName: enemy.name,
        catPose: blocked ? "block" : heavy ? "knockback" : "hurt",
        enemyPose: "attack",
        mangaFx: blocked ? "block" : "impact",
        mangaWord: blocked ? null : incoming >= 12 ? "bam" : "pow",
        mangaFocus: "cat",
        catFlashKey: nextCatFlash,
        catKnockbackKey: nextCatKb,
      };
    }

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
          bubble: null, inAction: false } });
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
      set({ dive: { ...d, enemy, catHp, collected, log: clog, bonesFound, capsFound, fx, rooms,
        roomCleared: true, autoDive: false,
        roomEvent: `+${bonesGain} 🦴  +${capsGain} 🧴  ·  ${dropCount} item${dropCount>1?"s":""}`,
        shakeKey, shakeHard, enemyFlashKey, catFlashKey, enemyDefeatKey, lastLootKey,
        catPose: "victory", enemyPose: "ko", mangaFx, mangaWord, mangaFocus,
        combo: 0, comboLastAction: null, knockbackKey, catKnockbackKey, panelSplitKey,
        inAction: false } });
      return;
    }

    // Panel 1: cat-attacker view (enemy hurt). Damage already applied.
    set({ dive: { ...d, catHp, enemy, collected, log: clog, fx, bonesFound, capsFound,
      shakeKey, shakeHard, enemyFlashKey, catFlashKey, enemyDefeatKey, lastLootKey,
      catPose, enemyPose, mangaFx, mangaWord, mangaFocus,
      combo, comboLastAction, knockbackKey, catKnockbackKey, panelSplitKey, bubble,
      inAction: counter !== null } });

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
        } });
        if (willKo) get().endDive(false);
      }, 1800);
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
    set({ dive: { ...d, catHp, collected, log: clog, bonesFound, capsFound, fx, rooms,
      roomCleared: true, roomEvent: event, lastLootKey,
      catPose: d.currentKind === "rest" ? "item" : "idle", enemyPose: "idle",
      mangaFx: d.currentKind === "hazard" ? "impact" : d.currentKind === "rest" ? "heal" : null,
      mangaWord: null, mangaFocus: d.currentKind === "hazard" ? "cat" : "center" } });
  },

  goDeeper: () => {
    const s = get();
    if (!s.dive || s.dive.ended || !s.dive.roomCleared) return;
    const d = s.dive;
    const dump = s.dumpsters.find(x => x.id === d.dumpsterId)!;
    if (d.room >= d.totalRooms) {
      // run complete
      const clog = [...d.log, mklog("Dumpster cleared. Climbing out with the goods!", "loot")];
      set({ dive: { ...d, log: clog, ended: true } });
      get().endDive(true);
      return;
    }
    const nextRoom = d.room + 1;
    const nextIdx = nextRoom - 1;
    const nextKind = d.rooms[nextIdx].kind;
    const rooms = d.rooms.map((r, i) => i === nextIdx ? { ...r, revealed: true }
      : i === nextIdx + 1 ? { ...r, revealed: true } : r);
    const wave = (nextKind === "enemy" || nextKind === "swarm" || nextKind === "elite" || nextKind === "miniboss" || nextKind === "boss")
      ? spawnEnemies(dump, nextKind, nextIdx) : [];
    const enemy = wave[0] ?? null;
    const rest = wave.slice(1);
    const log2 = [...d.log,
      mklog(`Crawl deeper… Room ${nextRoom}/${d.totalRooms} — ${roomLabel(nextKind)}`, "info"),
      enemy ? mklog(wave.length > 1
              ? `${wave.length} foes appear — ${enemy.name} steps up first!`
              : `A ${enemy.name} appears!`, "warn")
            : mklog(roomDescriptor(nextKind), "info"),
    ];
    set({ dive: { ...d, room: nextRoom, rooms, currentKind: nextKind, enemy, enemies: rest,
      roomCleared: false, roomEvent: null, log: log2,
      catPose: "idle", enemyPose: enemy ? "idle" : "ko", mangaFx: null, mangaWord: null, mangaFocus: null, bubble: null } });
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
    const bones = Math.round(baseBones * multiplier);
    const caps = Math.round(baseCaps * multiplier);
    const items = escape ? s.dive.collected : s.dive.collected.slice(0, Math.ceil(s.dive.collected.length / 2));
    set({ lastRewards: { items, bones, caps } });
  },

  collectRewards: () => {
    const s = get();
    if (!s.lastRewards) return;
    const newInv = [...s.inventory, ...s.lastRewards.items];
    const wasFled = s.dive?.fled ?? false;
    const updatedCats = s.cats.map(c => {
      if (c.id !== s.dive?.catId) return c;
      return wasFled
        ? { ...c, status: "injured" as const, recoverySecondsLeft: 300, hp: Math.max(1, Math.round(c.maxHp * 0.3)) }
        : { ...c, hp: c.maxHp, xp: c.xp + 12 };
    });
    // If the current story chapter hasn't been completed, queue its outro.
    const chapter = STORY_CHAPTERS[s.storyChapterIdx];
    const shouldPlayOutro = !wasFled && chapter && !s.completedChapters.includes(chapter.id);
    set({
      inventory: newInv,
      fishbones: s.fishbones + s.lastRewards.bones,
      bottlecaps: s.bottlecaps + s.lastRewards.caps,
      cats: updatedCats,
      dive: null,
      lastRewards: null,
      activeCutscene: shouldPlayOutro
        ? { chapterId: chapter.id, phase: "outro", panel: 0 }
        : s.activeCutscene,
    });
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

  openCutscene: (chapterId, phase) => {
    set({ activeCutscene: { chapterId, phase, panel: 0 } });
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
    // if chapter has a choice, leave cutscene closed; the Cutscene UI handles
    // showing the choice on the final outro panel before advancing.
    set({
      activeCutscene: null,
      hideoutStage: nextStage,
      completedChapters: completed,
      storyChapterIdx: nextIdx,
    });
  },
  closeCutscene: () => set({ activeCutscene: null }),
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
  getEvolution: () => {
    const s = get();
    return computeEvolution({
      completedChapters: s.completedChapters,
      roomsCleared: s.roomsCleared,
      bossesBeaten: s.bossesBeaten,
    });
  },
}));

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