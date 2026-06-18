import intake from "@/assets/orbit-bg/intake.jpg";
import galley from "@/assets/orbit-bg/galley.jpg";
import cargo from "@/assets/orbit-bg/cargo.jpg";
import luxury from "@/assets/orbit-bg/luxury.jpg";
import biohazard from "@/assets/orbit-bg/biohazard.jpg";
import throne from "@/assets/orbit-bg/throne.jpg";
import core from "@/assets/orbit-bg/core.jpg";
import reentry from "@/assets/orbit-bg/reentry.jpg";

/** Per-sector room backgrounds for the Orbit Trash dive screen. */
export const ORBIT_SECTOR_BG: Record<string, string> = {
  intake, galley, cargo, luxury, biohazard, throne, core, reentry,
};

/** Sector + room-kind → background. Today we tint/swap per sector; this hook
 *  lets us add per-room variations later without touching the dive code. */
export function getOrbitBg(sectorId: string, _kind: string): string {
  return ORBIT_SECTOR_BG[sectorId] ?? intake;
}

/** Per-sector neon accent token used for HUD chrome inside the dive. */
export const ORBIT_SECTOR_ACCENT: Record<string, string> = {
  intake:    "text-emerald-300",
  galley:    "text-lime-300",
  cargo:     "text-amber-300",
  luxury:    "text-pink-300",
  biohazard: "text-emerald-400",
  throne:    "text-fuchsia-300",
  core:      "text-red-400",
  reentry:   "text-cyan-300",
};

/** Friendly room titles used for the room-clear / transition banner. */
export const ORBIT_ROOM_TITLES: Record<string, string[]> = {
  intake:    ["Airlock Intake", "Pipe Bend A", "Hazard Door", "Lock 9"],
  galley:    ["Galley Waste Ring", "Tray Chute", "Crumb Drift", "Nutrient Leak", "Sink Pit"],
  cargo:     ["Cargo Chute 6", "Crate Maze", "Magnet Run", "Bolt Cloud", "Conveyor C", "Hazard Lift"],
  luxury:    ["Disposal Foyer", "Caviar Drift", "Perfume Cloud", "Gold Chute", "Concierge Bin", "Vault Trash"],
  biohazard: ["Biohazard Bin", "Slime Tank", "Spore Cloud", "Mold Hall", "Containment 3", "Vent Drip", "Quarantine"],
  throne:    ["Pirate Camp", "Trash Banners", "Throne Steps", "Crown Floor", "Waste Throne"],
  core:      ["Reactor Hall", "Crusher A", "Crusher B", "Wall Pinch", "Core Heart", "Escape Pod"],
  reentry:   ["Debris Wall", "Satellite Field", "Re-Entry Burn", "Moon Approach", "Touchdown"],
};