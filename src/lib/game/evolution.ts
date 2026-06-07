/**
 * Cat evolution stages. Progress is derived from gameplay milestones
 * (completed chapters, rooms cleared, bosses beaten) so the player's
 * growth feels tied to what they actually did.
 */
export type EvolutionStage =
  | "lost_kitten"
  | "alley_cat"
  | "scrapper"
  | "dumpster_diver"
  | "alley_legend";

export interface EvolutionDef {
  id: EvolutionStage;
  name: string;
  tagline: string;
  actions: string[];
  blurb: string;
  statBonus: { atk: number; def: number; hp: number };
  unlockText: string;
}

export const EVOLUTIONS: Record<EvolutionStage, EvolutionDef> = {
  lost_kitten: {
    id: "lost_kitten",
    name: "Lost Kitten",
    tagline: "Small. Scared. Hungry.",
    actions: ["Hide", "Swat"],
    blurb: "Just a shivering bundle of fluff. Tiny claws. Big eyes. Tinier hopes.",
    statBonus: { atk: 0, def: 0, hp: 0 },
    unlockText: "Starting form.",
  },
  alley_cat: {
    id: "alley_cat",
    name: "Alley Cat",
    tagline: "Knows the rules of the alley now.",
    actions: ["Swat", "Bite", "Snack", "Flee"],
    blurb: "No longer the smallest thing in the alley. Eyes adjusted to the dark.",
    statBonus: { atk: 2, def: 1, hp: 10 },
    unlockText: "Complete Chapter 1 — Abandoned.",
  },
  scrapper: {
    id: "scrapper",
    name: "Scrapper",
    tagline: "Picks fights. Wins most of them.",
    actions: ["Scratch", "Pounce", "Combo", "Item"],
    blurb: "Lean muscle, sharper claws, a chip on her shoulder.",
    statBonus: { atk: 5, def: 3, hp: 25 },
    unlockText: "Clear 3 dumpster rooms.",
  },
  dumpster_diver: {
    id: "dumpster_diver",
    name: "Dumpster Diver",
    tagline: "Reads dumpsters like other cats read birds.",
    actions: ["Scratch", "Pounce", "Combo", "Item", "Sniff Loot"],
    blurb: "Better loot. Sees hazards coming. Walks out heavier than she came in.",
    statBonus: { atk: 8, def: 5, hp: 40 },
    unlockText: "Defeat your first dumpster boss.",
  },
  alley_legend: {
    id: "alley_legend",
    name: "Alley Legend",
    tagline: "Hero of the trash. Queen of the bins.",
    actions: ["Scratch", "Pounce", "Combo", "Item", "Rally Crew"],
    blurb: "Every stray knows her name. Crew bonuses. Leadership aura.",
    statBonus: { atk: 12, def: 8, hp: 60 },
    unlockText: "Complete the campaign.",
  },
};

export const EVOLUTION_ORDER: EvolutionStage[] = [
  "lost_kitten", "alley_cat", "scrapper", "dumpster_diver", "alley_legend",
];

export interface ProgressInputs {
  completedChapters: string[];
  roomsCleared: number;
  bossesBeaten: number;
}

/** Highest stage the player has earned given their gameplay progress. */
export function computeEvolution(p: ProgressInputs): EvolutionStage {
  let stage: EvolutionStage = "lost_kitten";
  if (p.completedChapters.includes("ch1_abandoned")) stage = "alley_cat";
  if (p.roomsCleared >= 3) stage = ord(stage, "scrapper");
  if (p.bossesBeaten >= 1) stage = ord(stage, "dumpster_diver");
  if (p.completedChapters.includes("ch8_hero")) stage = ord(stage, "alley_legend");
  return stage;
}

function ord(a: EvolutionStage, b: EvolutionStage): EvolutionStage {
  return EVOLUTION_ORDER.indexOf(b) > EVOLUTION_ORDER.indexOf(a) ? b : a;
}

/** Returns the next unlock requirement description for the UI hint. */
export function nextEvolutionHint(p: ProgressInputs): string | null {
  const cur = computeEvolution(p);
  const idx = EVOLUTION_ORDER.indexOf(cur);
  if (idx >= EVOLUTION_ORDER.length - 1) return null;
  const next = EVOLUTIONS[EVOLUTION_ORDER[idx + 1]];
  return `Next: ${next.name} — ${next.unlockText}`;
}