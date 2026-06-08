import type { RoomKind } from "./types";

// Greasy Spoon Dumpster
import greasyEnemy from "@/assets/anime/bg-greasy-enemy.jpg";
import greasySwarm from "@/assets/anime/bg-greasy-swarm.jpg";
import greasyElite from "@/assets/anime/bg-greasy-elite.jpg";
import greasyLoot from "@/assets/anime/bg-greasy-loot.jpg";
import greasyHazard from "@/assets/anime/bg-greasy-hazard.jpg";
import greasyRest from "@/assets/anime/bg-greasy-rest.jpg";
import greasyMiniboss from "@/assets/anime/bg-greasy-miniboss.jpg";
import greasyBoss from "@/assets/anime/bg-greasy-boss.jpg";

// Apartment Alley Bin
import apartmentEnemy from "@/assets/anime/bg-apartment-enemy.jpg";
import apartmentSwarm from "@/assets/anime/bg-apartment-swarm.jpg";
import apartmentElite from "@/assets/anime/bg-apartment-elite.jpg";
import apartmentLoot from "@/assets/anime/bg-apartment-loot.jpg";
import apartmentHazard from "@/assets/anime/bg-apartment-hazard.jpg";
import apartmentRest from "@/assets/anime/bg-apartment-rest.jpg";
import apartmentMiniboss from "@/assets/anime/bg-apartment-miniboss.jpg";
import apartmentBoss from "@/assets/anime/bg-apartment-boss.jpg";

// Mall Food Court Compactor
import mallEnemy from "@/assets/anime/bg-mall-enemy.jpg";
import mallSwarm from "@/assets/anime/bg-mall-swarm.jpg";
import mallElite from "@/assets/anime/bg-mall-elite.jpg";
import mallLoot from "@/assets/anime/bg-mall-loot.jpg";
import mallHazard from "@/assets/anime/bg-mall-hazard.jpg";
import mallRest from "@/assets/anime/bg-mall-rest.jpg";
import mallMiniboss from "@/assets/anime/bg-mall-miniboss.jpg";
import mallBoss from "@/assets/anime/bg-mall-boss.jpg";

// Fish Market Dumpster
import fishEnemy from "@/assets/anime/bg-fish-enemy.jpg";
import fishSwarm from "@/assets/anime/bg-fish-swarm.jpg";
import fishElite from "@/assets/anime/bg-fish-elite.jpg";
import fishLoot from "@/assets/anime/bg-fish-loot.jpg";
import fishHazard from "@/assets/anime/bg-fish-hazard.jpg";
import fishRest from "@/assets/anime/bg-fish-rest.jpg";
import fishMiniboss from "@/assets/anime/bg-fish-miniboss.jpg";
import fishBoss from "@/assets/anime/bg-fish-boss.jpg";

// Haunted Recycling Bin
import hauntedEnemy from "@/assets/anime/bg-haunted-enemy.jpg";
import hauntedSwarm from "@/assets/anime/bg-haunted-swarm.jpg";
import hauntedElite from "@/assets/anime/bg-haunted-elite.jpg";
import hauntedLoot from "@/assets/anime/bg-haunted-loot.jpg";
import hauntedHazard from "@/assets/anime/bg-haunted-hazard.jpg";
import hauntedRest from "@/assets/anime/bg-haunted-rest.jpg";
import hauntedMiniboss from "@/assets/anime/bg-haunted-miniboss.jpg";
import hauntedBoss from "@/assets/anime/bg-haunted-boss.jpg";

// Luxury Condo Trash Room
import luxuryEnemy from "@/assets/anime/bg-luxury-enemy.jpg";
import luxurySwarm from "@/assets/anime/bg-luxury-swarm.jpg";
import luxuryElite from "@/assets/anime/bg-luxury-elite.jpg";
import luxuryLoot from "@/assets/anime/bg-luxury-loot.jpg";
import luxuryHazard from "@/assets/anime/bg-luxury-hazard.jpg";
import luxuryRest from "@/assets/anime/bg-luxury-rest.jpg";
import luxuryMiniboss from "@/assets/anime/bg-luxury-miniboss.jpg";
import luxuryBoss from "@/assets/anime/bg-luxury-boss.jpg";

// Rooftop AC Bin
import rooftopEnemy from "@/assets/anime/bg-rooftop-enemy.jpg";
import rooftopSwarm from "@/assets/anime/bg-rooftop-swarm.jpg";
import rooftopElite from "@/assets/anime/bg-rooftop-elite.jpg";
import rooftopLoot from "@/assets/anime/bg-rooftop-loot.jpg";
import rooftopHazard from "@/assets/anime/bg-rooftop-hazard.jpg";
import rooftopRest from "@/assets/anime/bg-rooftop-rest.jpg";
import rooftopMiniboss from "@/assets/anime/bg-rooftop-miniboss.jpg";
import rooftopBoss from "@/assets/anime/bg-rooftop-boss.jpg";

// Subway Platform Dumpster
import subwayEnemy from "@/assets/anime/bg-subway-enemy.jpg";
import subwaySwarm from "@/assets/anime/bg-subway-swarm.jpg";
import subwayElite from "@/assets/anime/bg-subway-elite.jpg";
import subwayLoot from "@/assets/anime/bg-subway-loot.jpg";
import subwayHazard from "@/assets/anime/bg-subway-hazard.jpg";
import subwayRest from "@/assets/anime/bg-subway-rest.jpg";
import subwayMiniboss from "@/assets/anime/bg-subway-miniboss.jpg";
import subwayBoss from "@/assets/anime/bg-subway-boss.jpg";

const SETS: Record<string, Record<RoomKind, string>> = {
  greasy:    { enemy: greasyEnemy,    swarm: greasySwarm,    elite: greasyElite,    loot: greasyLoot,    hazard: greasyHazard,    rest: greasyRest,    miniboss: greasyMiniboss,    boss: greasyBoss },
  apartment: { enemy: apartmentEnemy, swarm: apartmentSwarm, elite: apartmentElite, loot: apartmentLoot, hazard: apartmentHazard, rest: apartmentRest, miniboss: apartmentMiniboss, boss: apartmentBoss },
  mall:      { enemy: mallEnemy,      swarm: mallSwarm,      elite: mallElite,      loot: mallLoot,      hazard: mallHazard,      rest: mallRest,      miniboss: mallMiniboss,      boss: mallBoss },
  fish:      { enemy: fishEnemy,      swarm: fishSwarm,      elite: fishElite,      loot: fishLoot,      hazard: fishHazard,      rest: fishRest,      miniboss: fishMiniboss,      boss: fishBoss },
  haunted:   { enemy: hauntedEnemy,   swarm: hauntedSwarm,   elite: hauntedElite,   loot: hauntedLoot,   hazard: hauntedHazard,   rest: hauntedRest,   miniboss: hauntedMiniboss,   boss: hauntedBoss },
  luxury:    { enemy: luxuryEnemy,    swarm: luxurySwarm,    elite: luxuryElite,    loot: luxuryLoot,    hazard: luxuryHazard,    rest: luxuryRest,    miniboss: luxuryMiniboss,    boss: luxuryBoss },
  rooftop:   { enemy: rooftopEnemy,   swarm: rooftopSwarm,   elite: rooftopElite,   loot: rooftopLoot,   hazard: rooftopHazard,   rest: rooftopRest,   miniboss: rooftopMiniboss,   boss: rooftopBoss },
  subway:    { enemy: subwayEnemy,    swarm: subwaySwarm,    elite: subwayElite,    loot: subwayLoot,    hazard: subwayHazard,    rest: subwayRest,    miniboss: subwayMiniboss,    boss: subwayBoss },
};

/** Get a per-dumpster, per-room-kind background. Falls back to the greasy set
 *  if the dumpster id isn't registered yet. */
export function getRoomBackground(dumpsterId: string, kind: RoomKind): string {
  const set = SETS[dumpsterId] ?? SETS.greasy;
  return set[kind];
}