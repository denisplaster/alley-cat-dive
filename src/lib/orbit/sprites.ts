import scrapperIdle from "@/assets/orbit-anime/scrapper-idle.png";
import scrapperSwat from "@/assets/orbit-anime/scrapper-swat.png";
import scrapperPounce from "@/assets/orbit-anime/scrapper-pounce.png";
import scrapperBite from "@/assets/orbit-anime/scrapper-bite.png";
import scrapperHurt from "@/assets/orbit-anime/scrapper-hurt.png";
import scrapperBlock from "@/assets/orbit-anime/scrapper-block.png";
import scrapperKo from "@/assets/orbit-anime/scrapper-ko.png";
import scrapperVictory from "@/assets/orbit-anime/scrapper-victory.png";

export type ScrapperPose = "idle" | "swat" | "pounce" | "bite" | "hurt" | "block" | "ko" | "victory";

export const SCRAPPER_POSES: Record<ScrapperPose, string> = {
  idle: scrapperIdle,
  swat: scrapperSwat,
  pounce: scrapperPounce,
  bite: scrapperBite,
  hurt: scrapperHurt,
  block: scrapperBlock,
  ko: scrapperKo,
  victory: scrapperVictory,
};

export type EnemyPose = "idle" | "attack" | "hurt" | "ko";

// Use Vite's eager glob import so we don't need to enumerate 36 enemy poses by hand.
const enemyAssets = import.meta.glob<{ default: string }>(
  "../../assets/orbit-anime/enemy-*.png",
  { eager: true },
);

function resolve(id: string, pose: EnemyPose): string {
  const key = `../../assets/orbit-anime/enemy-${id}-${pose}.png`;
  return enemyAssets[key]?.default ?? enemyAssets[`../../assets/orbit-anime/enemy-${id}-idle.png`]?.default ?? "";
}

export function getEnemyPoses(id: string): Record<EnemyPose, string> {
  return {
    idle: resolve(id, "idle"),
    attack: resolve(id, "attack"),
    hurt: resolve(id, "hurt"),
    ko: resolve(id, "ko"),
  };
}

/** Per-ability barks for Scrapper. */
export const SCRAPPER_LINES: Record<"swat" | "pounce" | "bite" | "hurt" | "ko" | "victory" | "block", string[]> = {
  swat:   ["Take that!", "Eat claw!", "Trash day.", "Bonk."],
  pounce: ["MAGNETIC POUNCE!", "Stick the landing!", "Gotcha!", "Incoming cat!"],
  bite:   ["Chomp!", "Tastes like circuits.", "Nyam!", "Crunch."],
  hurt:   ["Ow ow ow!", "RUDE.", "Mrrrr—!", "Not the helmet!"],
  ko:     ["…nine lives left… probably…"],
  victory:["Easy. Next bin.", "Trash collected.", "Purrfect."],
  block:  ["Try harder!", "Heh.", "Whiffed it."],
};

/** Generic enemy lines, plus a special override per enemy id. */
export const ENEMY_LINES: Record<string, { attack: string[]; hurt: string[] }> = {
  mite:      { attack: ["zzzkt!", "*latches on*"],       hurt: ["skreee!", "*pop*"] },
  drone:     { attack: ["BZZT-bite!", "Wire-snap!"],     hurt: ["—!!", "static hiss"] },
  beetle:    { attack: ["KRRRNCH.", "Shell smash."],     hurt: ["CRACK.", "Hngh."] },
  bot:       { attack: ["Please remain still.", "Sanitizing."], hurt: ["MALFUNCTION.", "Beep— ow."] },
  pigeon:    { attack: ["COO-RAAGH!", "Helmet peck!"],   hurt: ["Cooo…", "*ruffle*"] },
  mold:      { attack: ["Sploosh!", "*absorb*"],         hurt: ["squelch", "ngghh"] },
  pirate:    { attack: ["Arrr, kitty!", "Hook ya!"],     hurt: ["Blast it!", "Owww!"] },
  raccx:     { attack: ["Bow, fleabag!", "I AM THE BIN KING!"], hurt: ["IMPOSSIBLE!", "My crown!"] },
  compactor: { attack: ["COMPACTING.", "REDUCING MASS."], hurt: ["WARNING.", "SYSTEM STRAIN."] },
};

export function randLine(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}