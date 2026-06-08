import type { HideoutStage } from "./story";

import kittenIdle from "@/assets/anime/kitten-idle.png";
import kittenScratch from "@/assets/anime/kitten-scratch.png";
import kittenPounce from "@/assets/anime/kitten-pounce.png";
import kittenHurt from "@/assets/anime/kitten-hurt.png";
import kittenBlock from "@/assets/anime/kitten-block.png";
import kittenKo from "@/assets/anime/kitten-ko.png";
import kittenVictory from "@/assets/anime/kitten-victory.png";

import juvenileIdle from "@/assets/anime/juvenile-idle.png";
import juvenileScratch from "@/assets/anime/juvenile-scratch.png";
import juvenilePounce from "@/assets/anime/juvenile-pounce.png";
import juvenileHurt from "@/assets/anime/juvenile-hurt.png";
import juvenileBlock from "@/assets/anime/juvenile-block.png";
import juvenileKo from "@/assets/anime/juvenile-ko.png";

import beetleIdle from "@/assets/anime/beetle-idle.png";
import beetleAttack from "@/assets/anime/beetle-attack.png";
import beetleHurt from "@/assets/anime/beetle-hurt.png";
import beetleKo from "@/assets/anime/beetle-ko.png";

import mouseIdle from "@/assets/anime/mouse-idle.png";
import mouseAttack from "@/assets/anime/mouse-attack.png";
import mouseHurt from "@/assets/anime/mouse-hurt.png";
import mouseKo from "@/assets/anime/mouse-ko.png";

import bunnyIdle from "@/assets/anime/bunny-idle.png";
import bunnyAttack from "@/assets/anime/bunny-attack.png";
import bunnyHurt from "@/assets/anime/bunny-hurt.png";
import bunnyKo from "@/assets/anime/bunny-ko.png";

import raccoonIdle from "@/assets/anime/raccoon-idle.png";
import raccoonAttack from "@/assets/anime/raccoon-attack.png";
import raccoonHurt from "@/assets/anime/raccoon-hurt.png";
import raccoonKo from "@/assets/anime/raccoon-ko.png";

import ratSwarmIdle from "@/assets/anime/rat-swarm-idle.png";
import ratSwarmAttack from "@/assets/anime/rat-swarm-attack.png";
import ratSwarmHurt from "@/assets/anime/rat-swarm-hurt.png";
import ratSwarmKo from "@/assets/anime/rat-swarm-ko.png";

import pigeonIdle from "@/assets/anime/pigeon-idle.png";
import trashSlimeIdle from "@/assets/anime/trash-slime-idle.png";
import trashBagIdle from "@/assets/anime/trash-bag-idle.png";
import moldGoblinIdle from "@/assets/anime/mold-goblin-idle.png";
import gullIdle from "@/assets/anime/gull-idle.png";
import canCrabIdle from "@/assets/anime/can-crab-idle.png";
import chihuahuaIdle from "@/assets/anime/chihuahua-idle.png";
import greaseSpriteIdle from "@/assets/anime/grease-sprite-idle.png";
import crowIdle from "@/assets/anime/crow-idle.png";
import scrapSerpentIdle from "@/assets/anime/scrap-serpent-idle.png";
import spoiledImpIdle from "@/assets/anime/spoiled-imp-idle.png";
import condoHoundIdle from "@/assets/anime/condo-hound-idle.png";
import pigeonLordIdle from "@/assets/anime/pigeon-lord-idle.png";
import ventWispIdle from "@/assets/anime/vent-wisp-idle.png";
import antennaImpIdle from "@/assets/anime/antenna-imp-idle.png";
import subwayRatKingIdle from "@/assets/anime/subway-rat-king-idle.png";
import tunnelGhoulIdle from "@/assets/anime/tunnel-ghoul-idle.png";
import graffitiWraithIdle from "@/assets/anime/graffiti-wraith-idle.png";

export type LifeStage = "kitten" | "juvenile" | "adult";

export const lifeStageFromHideout = (s: HideoutStage): LifeStage => {
  if (s === "tin_can" || s === "cardboard_box") return "kitten";
  if (s === "crate_fort") return "juvenile";
  return "adult";
};

export const lifeStageLabel: Record<LifeStage, string> = {
  kitten: "Kitten",
  juvenile: "Young Stray",
  adult: "Adult Cat",
};

/**
 * Partial pose maps for younger life stages. Missing poses fall back to the
 * adult sprite set in DungeonStage so we always have *something* to render.
 */
export const KITTEN_POSES: Partial<Record<string, string>> = {
  idle: kittenIdle,
  scratch: kittenScratch,
  pounce: kittenPounce,
  item: kittenIdle,
  hurt: kittenHurt,
  block: kittenBlock,
  ko: kittenKo,
  victory: kittenVictory,
  combo: kittenScratch,
  knockback: kittenHurt,
};

export const JUVENILE_POSES: Partial<Record<string, string>> = {
  idle: juvenileIdle,
  scratch: juvenileScratch,
  pounce: juvenilePounce,
  item: juvenileIdle,
  hurt: juvenileHurt,
  block: juvenileBlock,
  ko: juvenileKo,
  victory: juvenileIdle,
  combo: juvenileScratch,
  knockback: juvenileHurt,
};

export const BEETLE_POSES = {
  idle: beetleIdle,
  attack: beetleAttack,
  hurt: beetleHurt,
  ko: beetleKo,
} as const;

export const MOUSE_POSES = {
  idle: mouseIdle,
  attack: mouseAttack,
  hurt: mouseHurt,
  ko: mouseKo,
} as const;

export const BUNNY_POSES = {
  idle: bunnyIdle,
  attack: bunnyAttack,
  hurt: bunnyHurt,
  ko: bunnyKo,
} as const;

export const RACCOON_POSES = {
  idle: raccoonIdle,
  attack: raccoonAttack,
  hurt: raccoonHurt,
  ko: raccoonKo,
} as const;

export const RAT_SWARM_POSES = {
  idle: ratSwarmIdle,
  attack: ratSwarmAttack,
  hurt: ratSwarmHurt,
  ko: ratSwarmKo,
} as const;

export const PIGEON_POSES = {
  idle: pigeonIdle,
  attack: pigeonIdle,
  hurt: pigeonIdle,
  ko: pigeonIdle,
} as const;

const onePose = (idle: string): typeof BEETLE_POSES => ({ idle, attack: idle, hurt: idle, ko: idle });

/**
 * Enemy id -> custom sprite override. Enemies not listed here fall back to
 * the generic enemy/miniboss/boss sprite set in DungeonStage.
 */
export const ENEMY_SPRITE_OVERRIDES: Record<string, typeof BEETLE_POSES> = {
  garbage_beetle: BEETLE_POSES,
  litter_mouse: MOUSE_POSES,
  dust_bunny: BUNNY_POSES,
  raccoon: RACCOON_POSES,
  rat_swarm: RAT_SWARM_POSES,
  pigeon_thief: PIGEON_POSES,
  trash_slime: onePose(trashSlimeIdle),
  trash_bag: onePose(trashBagIdle),
  mold_goblin: onePose(moldGoblinIdle),
  gull_raider: onePose(gullIdle),
  can_crab: onePose(canCrabIdle),
  feral_chihuahua: onePose(chihuahuaIdle),
  grease_sprite: onePose(greaseSpriteIdle),
  alley_crow: onePose(crowIdle),
  scrap_serpent: onePose(scrapSerpentIdle),
  spoiled_imp: onePose(spoiledImpIdle),
  condo_hound: onePose(condoHoundIdle),
  pigeon_lord: onePose(pigeonLordIdle),
  vent_wisp: onePose(ventWispIdle),
  antenna_imp: onePose(antennaImpIdle),
  subway_rat_king: onePose(subwayRatKingIdle),
  tunnel_ghoul: onePose(tunnelGhoulIdle),
  graffiti_wraith: onePose(graffitiWraithIdle),
};