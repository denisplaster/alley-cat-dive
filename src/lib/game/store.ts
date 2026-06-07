import { create } from "zustand";
import {
  DUMPSTERS, ENEMIES, HIDEOUT_UPGRADES, INITIAL_CATS, LOOT_POOL, newItemId,
} from "./data";
import type { Cat, Dumpster, Enemy, HideoutUpgrade, Item, Rarity } from "./types";

interface CombatEntry { id: number; text: string; tone: "info" | "hit" | "crit" | "loot" | "warn"; }

interface DiveState {
  dumpsterId: string;
  catId: string;
  room: number; // 1-based
  totalRooms: number;
  enemy: Enemy | null;
  catHp: number;
  catMaxHp: number;
  timerSec: number;
  collected: Item[];
  log: CombatEntry[];
  autoDive: boolean;
  ended: boolean;
  fled: boolean;
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
  toggleAuto: () => void;
  tickDive: () => void;
  endDive: (escape: boolean) => void;
  collectRewards: () => void;
  equip: (itemId: string, catId: string) => void;
  sell: (itemId: string) => void;
  upgrade: (id: string) => void;
  buy: (cost: { bones: number; caps: number }, granted: Item) => boolean;
}

let _logId = 0;
const log = (text: string, tone: CombatEntry["tone"] = "info"): CombatEntry => ({
  id: ++_logId, text, tone,
});

const rollLoot = (target: Rarity): Item => {
  // 70% chance target tier, 30% chance one tier lower
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
    const enemyKey = dump.enemyPool[0];
    const tmpl = ENEMIES[enemyKey];
    const hp = tmpl.baseHp + dump.difficulty * 10;
    set({
      dive: {
        dumpsterId: dump.id,
        catId: cat.id,
        room: 1,
        totalRooms: dump.rooms,
        enemy: { id: enemyKey, name: tmpl.name, hp, maxHp: hp, attack: tmpl.attack, emoji: tmpl.emoji },
        catHp: cat.hp,
        catMaxHp: cat.maxHp,
        timerSec: dump.truckTimerSec,
        collected: [],
        log: [log(`Diving into ${dump.name}…`, "info"), log(`A ${tmpl.name} ${tmpl.emoji} blocks the way!`, "warn")],
        autoDive: false,
        ended: false,
        fled: false,
      },
      lastRewards: null,
    });
  },

  tickDive: () => {
    const s = get();
    if (!s.dive || s.dive.ended) return;
    const newTimer = s.dive.timerSec - 1;
    if (newTimer <= 0) {
      const log2 = [...s.dive.log, log("🚛 The trash truck arrived! You scramble out.", "warn")];
      set({ dive: { ...s.dive, timerSec: 0, log: log2, ended: true, fled: true } });
      get().endDive(false);
      return;
    }
    set({ dive: { ...s.dive, timerSec: newTimer } });
    if (s.dive.autoDive) {
      setTimeout(() => get().doAction("scratch"), 50);
    }
  },

  doAction: (action) => {
    const s = get();
    if (!s.dive || s.dive.ended || !s.dive.enemy) return;
    const cat = s.cats.find(c => c.id === s.dive!.catId)!;
    const dump = s.dumpsters.find(d => d.id === s.dive!.dumpsterId)!;
    let { catHp, enemy, room, totalRooms, collected, log: clog } = s.dive;
    enemy = { ...enemy };

    if (action === "flee") {
      clog = [...clog, log("You bolt for the lid! Half the loot stays behind.", "warn")];
      set({ dive: { ...s.dive, log: clog, ended: true, fled: true } });
      get().endDive(false);
      return;
    }

    if (action === "item") {
      catHp = Math.min(s.dive.catMaxHp, catHp + 30);
      clog = [...clog, log("Munched a sardine. +30 HP", "loot")];
    } else {
      const isCrit = Math.random() < 0.18;
      const base = action === "pounce" ? cat.attack * 1.6 : cat.attack;
      const dmg = Math.round(base * (isCrit ? 2 : 1) * (0.85 + Math.random() * 0.3));
      enemy.hp = Math.max(0, enemy.hp - dmg);
      clog = [...clog, log(`${cat.name} ${action === "pounce" ? "pounces" : "scratches"} for ${dmg}${isCrit ? " (CRIT!)" : ""}`, isCrit ? "crit" : "hit")];
    }

    if (enemy.hp > 0 && action !== "item") {
      const incoming = Math.max(1, Math.round(enemy.attack * (0.8 + Math.random() * 0.4) - cat.defense * 0.4));
      catHp = Math.max(0, catHp - incoming);
      clog = [...clog, log(`${enemy.name} hits back for ${incoming}`, "warn")];
    }

    if (catHp <= 0) {
      clog = [...clog, log(`💀 ${cat.name} went down! Dragging them out…`, "warn")];
      set({ dive: { ...s.dive, catHp: 0, enemy, log: clog, ended: true, fled: true } });
      get().endDive(false);
      return;
    }

    if (enemy.hp <= 0) {
      const drop = rollLoot(dump.expectedLoot);
      collected = [...collected, drop];
      clog = [...clog, log(`✨ Looted ${drop.name} (${drop.rarity})`, "loot")];
      if (room >= totalRooms) {
        clog = [...clog, log("Dumpster cleared. Climbing out with the goods!", "loot")];
        set({ dive: { ...s.dive, enemy: null, catHp, collected, log: clog, ended: true } });
        get().endDive(true);
        return;
      }
      const nextKey = dump.enemyPool[room % dump.enemyPool.length];
      const tmpl = ENEMIES[nextKey];
      const hp = tmpl.baseHp + dump.difficulty * 10 + room * 4;
      enemy = { id: nextKey, name: tmpl.name, hp, maxHp: hp, attack: tmpl.attack, emoji: tmpl.emoji };
      room += 1;
      clog = [...clog, log(`Deeper… room ${room}/${totalRooms}. A ${tmpl.name} ${tmpl.emoji} appears!`, "info")];
    }

    set({ dive: { ...s.dive, catHp, enemy, room, collected, log: clog } });
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
    const multiplier = escape ? 1 : 0.4;
    const bones = Math.round(dump.rewardBones * multiplier);
    const caps = Math.round(dump.rewardCaps * multiplier);
    const items = escape ? s.dive.collected : s.dive.collected.slice(0, Math.ceil(s.dive.collected.length / 2));
    set({ lastRewards: { items, bones, caps } });
  },

  collectRewards: () => {
    const s = get();
    if (!s.lastRewards) return;
    const newInv = [...s.inventory, ...s.lastRewards.items];
    // mark cat injured if dive failed
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
      // unequip old
      const old = c.equipment[slot];
      return { ...c, equipment: { ...c.equipment, [slot]: item } } as Cat & { _old?: Item };
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