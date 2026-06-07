import sceneAlleyRain from "@/assets/scene-alley-rain.jpg";
import scenePact from "@/assets/scene-pact.jpg";
import sceneHeroDawn from "@/assets/scene-hero-dawn.jpg";
import hideoutTinCan from "@/assets/hideout-tin-can.jpg";
import hideoutBox from "@/assets/hideout-cardboard-box.jpg";
import hideoutFort from "@/assets/hideout-crate-fort.jpg";
import hideoutThrone from "@/assets/hideout-pallet-throne.jpg";
import hideoutPalace from "@/assets/hideout-alley-palace.jpg";

export type HideoutStage =
  | "tin_can"
  | "cardboard_box"
  | "crate_fort"
  | "pallet_throne"
  | "alley_palace";

export interface HideoutStageDef {
  id: HideoutStage;
  name: string;
  image: string;
  blurb: string;
  slots: { id: string; label: string; x: number; y: number }[]; // % coords
}

export const HIDEOUT_STAGES: Record<HideoutStage, HideoutStageDef> = {
  tin_can: {
    id: "tin_can",
    name: "The Tin Can",
    image: hideoutTinCan,
    blurb: "A discarded can. Smells faintly of tuna. Home, for now.",
    slots: [
      { id: "floor", label: "Bedding", x: 50, y: 75 },
      { id: "wall",  label: "Wall",    x: 78, y: 32 },
    ],
  },
  cardboard_box: {
    id: "cardboard_box",
    name: "The Cardboard Den",
    image: hideoutBox,
    blurb: "Upgraded. A whole box. Even has a window.",
    slots: [
      { id: "shelf",  label: "Shelf",  x: 56, y: 38 },
      { id: "floor",  label: "Floor",  x: 40, y: 75 },
      { id: "lantern",label: "Lantern",x: 76, y: 55 },
    ],
  },
  crate_fort: {
    id: "crate_fort",
    name: "The Crate Fort",
    image: hideoutFort,
    blurb: "Two stories of stolen crates. Bottle-cap currency on display.",
    slots: [
      { id: "top",    label: "Top Shelf",    x: 50, y: 22 },
      { id: "mid",    label: "Trophy Wall",  x: 35, y: 48 },
      { id: "rack",   label: "Weapon Rack",  x: 70, y: 55 },
      { id: "floor",  label: "Floor",        x: 50, y: 82 },
    ],
  },
  pallet_throne: {
    id: "pallet_throne",
    name: "The Pallet Throne",
    image: hideoutThrone,
    blurb: "Power has a smell. It's mostly fish.",
    slots: [
      { id: "crown",  label: "Above Throne", x: 50, y: 18 },
      { id: "left",   label: "Left Pillar",  x: 14, y: 60 },
      { id: "right",  label: "Right Pillar", x: 86, y: 60 },
      { id: "rug",    label: "Royal Rug",    x: 50, y: 86 },
      { id: "throne", label: "On the Throne",x: 50, y: 52 },
    ],
  },
  alley_palace: {
    id: "alley_palace",
    name: "The Alley Palace",
    image: hideoutPalace,
    blurb: "Every alley cat knows your name. You earned this.",
    slots: [
      { id: "banner", label: "Banner",      x: 50, y: 18 },
      { id: "fountain",label:"Fountain",    x: 50, y: 60 },
      { id: "left",   label: "Left Chair",  x: 14, y: 70 },
      { id: "right",  label: "Right Chair", x: 86, y: 70 },
      { id: "shelf",  label: "Trophy Shelf",x: 22, y: 38 },
      { id: "altar",  label: "Altar",       x: 78, y: 38 },
    ],
  },
};

export const STAGE_ORDER: HideoutStage[] = [
  "tin_can", "cardboard_box", "crate_fort", "pallet_throne", "alley_palace",
];

export interface ChoiceOption {
  id: string;
  label: string;
  blurb: string;
}

export interface CutscenePanel {
  image: string;
  speaker?: "kitten" | "narrator" | "scrapper" | "rival" | "boss";
  text: string;
}

export interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  intro: CutscenePanel[];
  outro: CutscenePanel[];
  /** Promotes to this hideout stage when completed. */
  unlocksStage?: HideoutStage;
  /** Choice presented at the end of the chapter. */
  choice?: { question: string; options: ChoiceOption[] };
}

export const STORY_CHAPTERS: Chapter[] = [
  {
    id: "ch1_abandoned",
    title: "Chapter 1 — Abandoned",
    subtitle: "The rain. The alley. The can.",
    intro: [
      { image: sceneAlleyRain, speaker: "narrator",
        text: "The rain didn't ask permission. Neither did whoever left the kitten by the dumpster." },
      { image: sceneAlleyRain, speaker: "kitten",
        text: "…m-mew?" },
      { image: sceneAlleyRain, speaker: "narrator",
        text: "A tin can rolled to a stop at her paws. Inside: warmth. Outside: everything else." },
    ],
    outro: [
      { image: hideoutTinCan, speaker: "kitten",
        text: "It's mine. My can. My place." },
      { image: hideoutTinCan, speaker: "narrator",
        text: "Tonight she sleeps. Tomorrow she hunts." },
    ],
    unlocksStage: "tin_can",
  },
  {
    id: "ch2_first_scraps",
    title: "Chapter 2 — First Scraps",
    subtitle: "She meets the one they call Scrapper.",
    intro: [
      { image: scenePact, speaker: "scrapper",
        text: "That's my dumpster, runt." },
      { image: scenePact, speaker: "kitten",
        text: "I was here first. The rat agreed." },
    ],
    outro: [
      { image: hideoutBox, speaker: "scrapper",
        text: "You got guts. Take the box. I'll show you the ropes." },
    ],
    unlocksStage: "cardboard_box",
    choice: {
      question: "A starving alley cat begs for half your fish. What do you do?",
      options: [
        { id: "kind", label: "Share it", blurb: "Earn a friend. Maybe an ally." },
        { id: "cunning", label: "Keep it", blurb: "Strength now, reputation later." },
      ],
    },
  },
  {
    id: "ch3_alley_pact",
    title: "Chapter 3 — The Alley Pact",
    subtitle: "Raccoons run the back lots. Today, that changes.",
    intro: [
      { image: scenePact, speaker: "rival",
        text: "The raccoons want a tribute. You gonna pay it, kitten?" },
    ],
    outro: [
      { image: hideoutFort, speaker: "narrator",
        text: "The crew rises. A crate fort rises with it." },
    ],
    unlocksStage: "crate_fort",
    choice: {
      question: "The raccoon boss offers a truce — split the alley.",
      options: [
        { id: "ally",  label: "Shake on it",   blurb: "Allies. For now." },
        { id: "fight", label: "Claws out",     blurb: "The alley belongs to cats." },
      ],
    },
  },
  {
    id: "ch4_king_of_bins",
    title: "Chapter 4 — King of the Bins",
    subtitle: "The miniboss falls. The throne rises.",
    intro: [
      { image: scenePact, speaker: "boss",
        text: "I OWN this block, fleabag." },
    ],
    outro: [
      { image: hideoutThrone, speaker: "narrator",
        text: "The pallets stack. The drape falls. The crown is yours." },
    ],
    unlocksStage: "pallet_throne",
    choice: {
      question: "The defeated boss lies at your paws.",
      options: [
        { id: "mercy",     label: "Spare them",  blurb: "Mercy makes legends." },
        { id: "dominance", label: "Finish it",   blurb: "Fear makes rulers." },
      ],
    },
  },
  {
    id: "ch5_hero",
    title: "Chapter 5 — Hero of the Trash",
    subtitle: "The Luxury Condo run. The final dive.",
    intro: [
      { image: sceneHeroDawn, speaker: "narrator",
        text: "Every diver in the city watches the alley tonight." },
    ],
    outro: [
      { image: hideoutPalace, speaker: "kitten",
        text: "From a tin can to this. Mew." },
      { image: hideoutPalace, speaker: "narrator",
        text: "Hero of the trash. Legend of the alley." },
    ],
    unlocksStage: "alley_palace",
  },
];

export const chapterById = (id: string) => STORY_CHAPTERS.find(c => c.id === id);