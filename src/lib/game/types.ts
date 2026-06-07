export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
export type ItemKind = "weapon" | "armor" | "relic" | "food" | "junk" | "crafting";

export interface Item {
  id: string;
  name: string;
  rarity: Rarity;
  kind: ItemKind;
  attack?: number;
  defense?: number;
  health?: number;
  speed?: number;
  flavor: string;
  sellPrice: number;
}

export type CatClass = "Scrapper" | "Sneak" | "Moldmancer" | "Knight" | "Greasefang";
export type CatStatus = "ready" | "diving" | "injured" | "resting";

export interface Cat {
  id: string;
  name: string;
  catClass: CatClass;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  ability: string;
  portrait: string;
  status: CatStatus;
  recoverySecondsLeft: number;
  equipment: { weapon?: Item; armor?: Item; relic?: Item };
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  emoji: string;
}

export type DumpsterStatus = "unlocked" | "locked" | "completed" | "dangerous";

export type RoomKind = "enemy" | "swarm" | "elite" | "loot" | "hazard" | "rest" | "miniboss" | "boss";

export interface Room {
  kind: RoomKind;
  cleared: boolean;
  revealed: boolean;
}

export interface Fx {
  id: number;
  target: "cat" | "enemy";
  kind: "dmg" | "crit" | "heal" | "miss";
  amount: number;
}

export interface Dumpster {
  id: string;
  name: string;
  image: string;
  difficulty: number; // 1-6
  expectedLoot: Rarity;
  enemyPool: string[]; // enemy ids
  rooms: number;
  truckTimerSec: number;
  recommendedPower: number;
  status: DumpsterStatus;
  rewardCaps: number;
  rewardBones: number;
  /** If true, the chapter boss only appears for the final room (they're
   *  taunting/escaping until the climactic fight). Otherwise the boss is
   *  encountered multiple times across the dive. */
  bossRunsAway?: boolean;
}

export interface HideoutUpgrade {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  costBones: (lvl: number) => number;
  costCaps: (lvl: number) => number;
  benefit: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  costBones: number;
  costCaps: number;
  rarity: Rarity;
}