import { create } from "zustand";
import {
  DUMPSTERS, ENEMIES, HIDEOUT_UPGRADES, INITIAL_CATS, LOOT_POOL, newItemId,
} from "./data";
import type {
  Cat, Dumpster, Enemy, Fx, HideoutUpgrade, Item, Rarity, Room, RoomKind,
} from "./types";

interface CombatEntry { id: number; text: string; tone: "info" | "hit" | "crit" | "loot" | "warn" }

interface DiveState {
  dumpsterId: string;
  catId: string;
  room: number; // 1-based current index
  totalRooms: number;
  rooms: Room[];
  currentKind: RoomKind;
  enemy: Enemy | null;
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
}

let _logId = 0;
const mklog = (text: string, tone: CombatEntry["tone"] = "info"): CombatEntry => ({ id: ++_logId, text, tone });
let _fxId = 0;
const nextFxId = () => ++_fxId;

const generateRooms = (totalRooms: number): Room[] => {
  const arr: RoomKind[] = Array.from({ length: totalRooms }, () => "enemy" as RoomKind);
  arr[totalRooms - 1] = "boss";
  if (totalRooms >= 3) arr[1] = "loot";
  if (totalRooms >= 5) arr[Math.floor(totalRooms / 2)] = Math.random() < 0.5 ? "hazard" : "rest";
  if (totalRooms >= 6) arr[totalRooms - 2] = "miniboss";
  return arr.map((k, i) => ({ kind: k, cleared: false, revealed: i === 0 }));
};

const spawnEnemy = (dump: Dumpster, kind: RoomKind, roomIdx: number): Enemy => {
  const enemyKey = dump.enemyPool[roomIdx % dump.enemyPool.length];
  const tmpl = ENEMIES[enemyKey];
  let hp = tmpl.baseHp + dump.difficulty * 10 + roomIdx * 4;
  let atk = tmpl.attack;
  let name = tmpl.name;
  let emoji = tmpl.emoji;
  if (kind === "miniboss") { hp = Math.round(hp * 1.6); atk = Math.round(atk * 1.3); name = "Mini-Boss " + name; }
  if (kind === "boss") { hp = Math.round(hp * 2.4); atk = Math.round(atk * 1.5); name = "BOSS — " + name; emoji = "👑"; }
  return { id: enemyKey, name, hp, maxHp: hp, attack: atk, emoji };
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
    const enemy = (firstKind === "enemy" || firstKind === "miniboss" || firstKind === "boss")
      ? spawnEnemy(dump, firstKind, 0) : null;
    set({
      dive: {
        dumpsterId: dump.id,
        catId: cat.id,
        room: 1,
        totalRooms: dump.rooms,
        rooms,
        currentKind: firstKind,
        enemy,
        catHp: cat.hp,
        catMaxHp: cat.maxHp,
        timerSec: dump.truckTimerSec,
        truckTimerStart: dump.truckTimerSec,
        collected: [],
        bonesFound: 0,
        capsFound: 0,
        log: [
          mklog(`Diving into ${dump.name}…`, "info"),
          enemy ? mklog(`A ${enemy.name} blocks the way!`, "warn")
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

    let { catHp, enemy, collected, log: clog, bonesFound, capsFound, fx,
      shakeKey, shakeHard, enemyFlashKey, catFlashKey, enemyDefeatKey, lastLootKey,
      combo, comboLastAction, panelSplitKey, knockbackKey, catKnockbackKey } = d;
    enemy = { ...enemy! };

    if (action === "item") {
      const heal = 30;
      catHp = Math.min(d.catMaxHp, catHp + heal);
      clog = [...clog, mklog("Munched a sardine. +30 HP", "loot")];
      fx = [...fx, { id: nextFxId(), target: "cat", kind: "heal", amount: heal }];
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
      const incoming = Math.max(1, Math.round(enemy.attack * (0.8 + Math.random() * 0.4) - cat.defense * 0.4));
      const blocked = incoming <= Math.max(4, Math.round(cat.defense * 0.55));
      const heavy = incoming >= 14;
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
        combo: 0, comboLastAction: null, knockbackKey, catKnockbackKey, panelSplitKey } });
      return;
    }

    // Panel 1: cat-attacker view (enemy hurt). Damage already applied.
    set({ dive: { ...d, catHp: d.catHp, enemy, collected, log: clog, fx, bonesFound, capsFound,
      shakeKey, shakeHard, enemyFlashKey, catFlashKey, enemyDefeatKey, lastLootKey,
      catPose, enemyPose, mangaFx, mangaWord, mangaFocus,
      combo, comboLastAction, knockbackKey, catKnockbackKey, panelSplitKey } });

    // Panel 2: enemy counter-attack — apply HP loss and swap to counter visuals after a beat.
    if (counter) {
      const ctr = counter;
      const finalCatHp = Math.max(0, catHp - ctr.incoming);
      const willKo = finalCatHp <= 0;
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
          ended: willKo ? true : cur.ended,
          fled: willKo ? true : cur.fled,
        } });
        if (willKo) get().endDive(false);
      }, 850);
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
    const enemy = (nextKind === "enemy" || nextKind === "miniboss" || nextKind === "boss")
      ? spawnEnemy(dump, nextKind, nextIdx) : null;
    const log2 = [...d.log,
      mklog(`Crawl deeper… Room ${nextRoom}/${d.totalRooms} — ${roomLabel(nextKind)}`, "info"),
      enemy ? mklog(`A ${enemy.name} appears!`, "warn") : mklog(roomDescriptor(nextKind), "info"),
    ];
    set({ dive: { ...d, room: nextRoom, rooms, currentKind: nextKind, enemy,
      roomCleared: false, roomEvent: null, log: log2,
      catPose: "idle", enemyPose: enemy ? "idle" : "ko", mangaFx: null, mangaWord: null, mangaFocus: null } });
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
    set({
      inventory: newInv,
      fishbones: s.fishbones + s.lastRewards.bones,
      bottlecaps: s.bottlecaps + s.lastRewards.caps,
      cats: updatedCats,
      dive: null,
      lastRewards: null,
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
}));

function roomLabel(k: RoomKind): string {
  return ({ enemy: "Enemy", loot: "Loot", hazard: "Hazard", rest: "Rest", miniboss: "Mini-Boss", boss: "BOSS" } as const)[k];
}
function roomDescriptor(k: RoomKind): string {
  return ({
    enemy: "Something's rustling…",
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