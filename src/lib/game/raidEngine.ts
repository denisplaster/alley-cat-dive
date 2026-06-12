// Pure-function combat math + queue logic for raids. State lives in the zustand store.

import type { Actor, Element, Skill, OverdriveDef } from "./raidTypes";

export const BASE_TICK = 1000;

/** Sum a flat stat modifier contributed by active statuses. */
export function statusMod(actor: Actor, key: "atkMod" | "defMod" | "spdMod"): number {
  let m = 0;
  for (const st of actor.statuses) m += (st[key] ?? 0);
  return m;
}
export function effAtk(a: Actor): number { return Math.max(1, a.atk + statusMod(a, "atkMod")); }
export function effDef(a: Actor): number { return Math.max(0, a.def + statusMod(a, "defMod")); }
export function effSpd(a: Actor): number { return Math.max(1, a.spd + statusMod(a, "spdMod")); }


/** Lower tick = goes sooner. Returns `tick increment` for an action. */
export function tickFor(actor: Actor, actionCost = 1): number {
  const spd = Math.max(1, effSpd(actor));
  return Math.round((BASE_TICK / spd) * actionCost);
}

/** Element matchup multiplier on damage. */
export function elementMult(target: Actor, el: Element): { mult: number; tag: "weak"|"resist"|"null"|"normal" } {
  if (target.nullEl.includes(el)) return { mult: 0,   tag: "null" };
  if (target.weak.includes(el))   return { mult: 1.5, tag: "weak" };
  if (target.resist.includes(el)) return { mult: 0.5, tag: "resist" };
  return { mult: 1, tag: "normal" };
}

export interface HitResult {
  damage: number;
  crit: boolean;
  element: Element;
  tag: "weak"|"resist"|"null"|"normal";
}

/** Compute damage for a damage skill (or basic attack). */
export function rollDamage(attacker: Actor, target: Actor, power: number, element: Element): HitResult {
  const base = Math.max(1, effAtk(attacker) * power - effDef(target) * 0.7);
  const crit = Math.random() < 0.10;
  const variance = 0.9 + Math.random() * 0.2;
  const em = elementMult(target, element);
  const defending = target.statuses.some(s => s.id === "defend");
  const guard = defending ? 0.35 : 1;
  const raw = base * (crit ? 1.6 : 1) * variance * em.mult * guard;
  return {
    damage: em.mult === 0 ? 0 : Math.max(1, Math.round(raw)),
    crit, element, tag: em.tag,
  };
}

/** Compute heal for a heal skill. */
export function rollHeal(attacker: Actor, target: Actor, power: number): number {
  return Math.round(Math.max(5, attacker.atk * power * (0.9 + Math.random() * 0.2)));
}

/** Pick the next actor in the CTB queue. */
export function pickActive(actors: Actor[]): Actor | null {
  const alive = actors.filter(a => a.alive);
  if (!alive.length) return null;
  return [...alive].sort((a, b) => a.nextTick - b.nextTick)[0];
}

/** Normalize tick values so they don't grow unbounded. */
export function normalizeTicks(actors: Actor[]): Actor[] {
  const alive = actors.filter(a => a.alive);
  if (!alive.length) return actors;
  const min = Math.min(...alive.map(a => a.nextTick));
  if (min < 1000) return actors;
  return actors.map(a => ({ ...a, nextTick: a.nextTick - min }));
}

/** Decrement status counters at the start of an actor's turn. */
export function tickStatuses(actor: Actor): { actor: Actor; dotDamage: number } {
  if (!actor.statuses.length) return { actor, dotDamage: 0 };
  let dot = 0;
  for (const st of actor.statuses) {
    if (st.dotPower && st.sourceAtk) {
      dot += Math.max(1, Math.round(st.sourceAtk * st.dotPower - actor.def * 0.2));
    }
  }
  const hp = Math.max(0, actor.hp - dot);
  const next = actor.statuses
    .map(s => ({ ...s, turnsLeft: s.turnsLeft - 1 }))
    .filter(s => s.turnsLeft > 0);
  return { actor: { ...actor, hp, alive: hp > 0 ? actor.alive : false, statuses: next }, dotDamage: dot };
}

/** Returns the next 5-7 actors in queue order (for the side strip). */
export function previewQueue(actors: Actor[], depth = 6): Actor[] {
  // Simulate forward — copy ticks and pull off the smallest each step.
  const sim = actors.filter(a => a.alive).map(a => ({ ...a }));
  const out: Actor[] = [];
  for (let i = 0; i < depth && sim.length; i++) {
    sim.sort((a, b) => a.nextTick - b.nextTick);
    const next = sim[0];
    out.push({ ...next });
    next.nextTick += tickFor(next);
  }
  return out;
}

/** Choose a simple enemy action: 70% basic attack, sometimes a skill, low HP defends. */
export function chooseEnemyAction(self: Actor, party: Actor[]):
  | { kind: "attack"; target: Actor }
  | { kind: "skill"; skill: Skill; targets: Actor[] }
  | { kind: "defend" }
  | { kind: "overdrive"; def: OverdriveDef; targets: Actor[] }
{
  const alive = party.filter(p => p.alive);
  if (!alive.length) return { kind: "defend" };
  const lowHp = self.hp / self.maxHp < 0.25;

  // Boss overdrive when meter full.
  if (self.od >= self.odMax) {
    return { kind: "overdrive", def: self.overdrive, targets: alive };
  }
  if (lowHp && Math.random() < 0.35) return { kind: "defend" };

  // Use a skill ~35% of the time if available and MP is there.
  const usable = self.skills.filter(s => self.mp >= s.mpCost);
  if (usable.length && Math.random() < 0.45) {
    const skill = usable[Math.floor(Math.random() * usable.length)];
    const targets = skill.target === "allEnemies" ? alive
      : skill.target === "allAllies" ? [self]
      : [alive[Math.floor(Math.random() * alive.length)]];
    return { kind: "skill", skill, targets };
  }

  // Prefer hitting the lowest-HP party member.
  const target = [...alive].sort((a, b) => a.hp - b.hp)[0];
  return { kind: "attack", target };
}

/** OD meter fills from damage taken (+25% of dmg/maxHp) and damage dealt (+12%). */
export function gainOD(actor: Actor, amount: number): Actor {
  return { ...actor, od: Math.min(actor.odMax, actor.od + amount) };
}
