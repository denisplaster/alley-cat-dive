// FFX-inspired raid combat. Solo dives use the existing `dive` engine in store.ts;
// raids run on this separate, party-based, CTB engine.

export type Element = "claw" | "fire" | "ice" | "shock" | "stink";

export const ELEMENT_META: Record<Element, { label: string; icon: string; color: string }> = {
  claw:  { label: "Claw",  icon: "🐾", color: "text-foreground" },
  fire:  { label: "Fire",  icon: "🔥", color: "text-orange-400" },
  ice:   { label: "Ice",   icon: "❄️", color: "text-cyan-300" },
  shock: { label: "Shock", icon: "⚡", color: "text-yellow-300" },
  stink: { label: "Stink", icon: "💨", color: "text-lime-400" },
};

export interface SkillStatus {
  id: StatusId;
  turns: number;
  atkMod?: number;   // flat add to ATK while active (can be negative)
  defMod?: number;
  spdMod?: number;
  dotPower?: number; // damage-over-time per turn = caster.atk * dotPower
}

export interface Skill {
  id: string;
  name: string;
  mpCost: number;
  power: number;          // multiplier on attacker.atk (per hit)
  element: Element;
  target: "one" | "allEnemies" | "allAllies" | "self";
  kind: "damage" | "heal" | "buff" | "debuff";
  hits?: number;          // number of strikes (default 1) — multi-hit/combo
  applyStatus?: SkillStatus; // buff/debuff/DoT applied to each target
  ultimate?: boolean;     // signature move — bigger VFX, higher cost
  tickCost?: number;      // default 1
  description: string;
}

export interface OverdriveDef {
  id: "hairball_cannon" | "nine_lives" | "alley_swarm";
  name: string;
  description: string;
  // multiplier on attacker.atk applied per hit
  power: number;
  hits: number;
  element: Element;
  target: "one" | "allEnemies" | "allAllies";
  kind: "damage" | "heal";
  tint: string; // tailwind bg-* class for the overlay flash
}

export const OVERDRIVES: Record<OverdriveDef["id"], OverdriveDef> = {
  hairball_cannon: { id: "hairball_cannon", name: "Hairball Cannon",
    description: "One screen-shaking shot at a single enemy.",
    power: 4.5, hits: 1, element: "stink", target: "one", kind: "damage",
    tint: "bg-lime-400" },
  nine_lives: { id: "nine_lives", name: "Nine Lives",
    description: "Restore all party HP and revive fallen cats.",
    power: 1.8, hits: 1, element: "claw", target: "allAllies", kind: "heal",
    tint: "bg-emerald-400" },
  alley_swarm: { id: "alley_swarm", name: "Alley Swarm",
    description: "Five quick strikes that hit every enemy.",
    power: 1.1, hits: 5, element: "claw", target: "allEnemies", kind: "damage",
    tint: "bg-amber-400" },
};

export type ActorSide = "party" | "enemy";

export type StatusId = "defend" | "haste" | "slow" | "poison" | "guard_up" | "rally" | "weaken" | "burn";

export interface Status {
  id: StatusId;
  turnsLeft: number;
  atkMod?: number;   // flat ATK modifier while active
  defMod?: number;
  spdMod?: number;
  dotPower?: number; // per-turn damage = sourceAtk * dotPower
  sourceAtk?: number; // attacker atk snapshot, for DoT scaling
}

export interface Actor {
  uid: string;            // unique per-battle id
  side: ActorSide;
  name: string;
  portrait?: string;       // image url
  emoji?: string;
  hp: number; maxHp: number;
  mp: number; maxMp: number;
  atk: number; def: number; spd: number;
  od: number; odMax: number;          // overdrive meter
  element: Element;
  weak: Element[]; resist: Element[]; nullEl: Element[];
  skills: Skill[];
  overdrive: OverdriveDef;
  statuses: Status[];
  nextTick: number;        // lower = goes sooner
  alive: boolean;
  /** Weakness icons reveal after first hit of that type. */
  knownTypes: Element[];
}

export interface RaidLogEntry {
  id: number;
  text: string;
  tone: "info" | "hit" | "crit" | "heal" | "warn";
}

export interface FloatingNumber {
  id: number;
  uid: string;      // actor uid
  amount: number;
  kind: "dmg" | "crit" | "heal" | "weak" | "resist" | "null";
  element?: Element;
}

export interface RaidState {
  dungeonId: string;
  party: Actor[];
  enemies: Actor[];
  log: RaidLogEntry[];
  floats: FloatingNumber[];
  /** Currently acting actor uid. Null while resolving / between turns. */
  activeUid: string | null;
  /** Animation locked while a turn resolves. */
  resolving: boolean;
  /** When fired, the overdrive overlay component plays. */
  overdriveOverlay: { uid: string; def: OverdriveDef; key: number } | null;
  /** Bumps to trigger a screen-shake. */
  shakeKey: number;
  /** Bumps to trigger an actor hit flash, keyed by actor uid. */
  flash: Record<string, number>;
  ended: boolean;
  victory: boolean;
  /** Spheres + gold awarded on victory (claimed via claimRaid). */
  rewards: { spheres: number; bones: number; caps: number } | null;
}
