import sceneAlleyRain from "@/assets/scene-alley-rain.jpg";
import scenePact from "@/assets/scene-pact.jpg";
import sceneHeroDawn from "@/assets/scene-hero-dawn.jpg";
import hideoutTinCan from "@/assets/hideout-tin-can.jpg";
import hideoutBox from "@/assets/hideout-cardboard-box.jpg";
import hideoutFort from "@/assets/hideout-crate-fort.jpg";
import hideoutThrone from "@/assets/hideout-pallet-throne.jpg";
import hideoutPalace from "@/assets/hideout-alley-palace.jpg";
import sceneKittenFound from "@/assets/scene-kitten-found.jpg";
import sceneMentor from "@/assets/scene-mentor.jpg";
import sceneTraining from "@/assets/scene-training.jpg";
import sceneRaccoonGang from "@/assets/scene-raccoon-gang.jpg";
import sceneBinBossThrone from "@/assets/scene-bin-boss-throne.jpg";
import sceneRally from "@/assets/scene-rally.jpg";
import sceneFinalShowdown from "@/assets/scene-final-showdown.jpg";
import sceneRival from "@/assets/scene-rival.jpg";

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
  speaker?: "kitten" | "narrator" | "scrapper" | "rival" | "boss" | "raccoon" | "elder";
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
        text: "It rained for three days straight. The kind of rain that washes names off mailboxes and memories off doorsteps." },
      { image: sceneAlleyRain, speaker: "narrator",
        text: "On the third night, a cardboard box was left behind Mama Wu's noodle shop. Inside it: one shivering bundle of gray fluff." },
      { image: sceneKittenFound, speaker: "kitten",
        text: "…m-mew?" },
      { image: sceneKittenFound, speaker: "narrator",
        text: "She had no name. No mother. No memory of either. Only the cold, and the smell of stale rain." },
      { image: sceneKittenFound, speaker: "kitten",
        text: "Mew… mew?? Anyone…?" },
      { image: sceneAlleyRain, speaker: "narrator",
        text: "A rusted tin can rolled out from beneath the dumpster. Old tuna. Tiny shelter. It would have to do." },
      { image: sceneAlleyRain, speaker: "kitten",
        text: "(It smells… kinda nice in here.)" },
    ],
    outro: [
      { image: hideoutTinCan, speaker: "kitten",
        text: "Mine. My can. My place." },
      { image: hideoutTinCan, speaker: "narrator",
        text: "She didn't know the word for 'home' yet. But she knew the shape of one." },
      { image: hideoutTinCan, speaker: "narrator",
        text: "Tonight, she sleeps. Tomorrow… she hunts." },
    ],
    unlocksStage: "tin_can",
  },
  {
    id: "ch2_first_scraps",
    title: "Chapter 2 — First Scraps",
    subtitle: "She meets the one they call Scrapper.",
    intro: [
      { image: sceneAlleyRain, speaker: "narrator",
        text: "Day four. The hunger was louder than the rain now." },
      { image: sceneAlleyRain, speaker: "kitten",
        text: "(A fish head. Right there. Mine.)" },
      { image: scenePact, speaker: "scrapper",
        text: "Paws off, runt. That's MY dumpster." },
      { image: scenePact, speaker: "kitten",
        text: "I-I was here first! The rat agreed!" },
      { image: scenePact, speaker: "scrapper",
        text: "Heh. The RAT. You named the rat?" },
      { image: scenePact, speaker: "kitten",
        text: "His name's Gerald. He has a family." },
      { image: scenePact, speaker: "scrapper",
        text: "…kid, you're either a legend in the making or about to get eaten. Probably both." },
    ],
    outro: [
      { image: sceneMentor, speaker: "scrapper",
        text: "Listen. You got guts but no claws. That's a death sentence out here." },
      { image: sceneMentor, speaker: "scrapper",
        text: "Take the box behind the laundromat. It's dry. I'll show you the ropes." },
      { image: sceneMentor, speaker: "kitten",
        text: "Why help me?" },
      { image: sceneMentor, speaker: "scrapper",
        text: "…someone helped me once. Don't make me regret it." },
      { image: hideoutBox, speaker: "narrator",
        text: "The kitten had a teacher now. And a roof. Sort of." },
    ],
    unlocksStage: "cardboard_box",
    choice: {
      question: "Gerald the rat begs you for half your fish — his pups are starving.",
      options: [
        { id: "kind",    label: "Share it",     blurb: "A friend in the alley is worth more than a meal." },
        { id: "cunning", label: "Keep it all",  blurb: "Strength now. Reputation later." },
      ],
    },
  },
  {
    id: "ch3_training",
    title: "Chapter 3 — Claws Out",
    subtitle: "Scrapper teaches. The kitten learns.",
    intro: [
      { image: sceneMentor, speaker: "scrapper",
        text: "Rule one: you don't fight what you can't out-run." },
      { image: sceneMentor, speaker: "scrapper",
        text: "Rule two: if you GOTTA fight — make the first move count." },
      { image: sceneTraining, speaker: "kitten",
        text: "Like… this?!" },
      { image: sceneTraining, speaker: "scrapper",
        text: "Higher! Faster! The rooftops don't catch you if you hesitate!" },
      { image: sceneTraining, speaker: "narrator",
        text: "Weeks blurred together. She fell. She climbed. She fell again." },
      { image: sceneTraining, speaker: "kitten",
        text: "(Land. Land. LAND—!)" },
      { image: sceneTraining, speaker: "scrapper",
        text: "…huh. Kid actually stuck the landing." },
    ],
    outro: [
      { image: sceneMentor, speaker: "scrapper",
        text: "You're not a kitten anymore. You're a stray. There's a difference." },
      { image: sceneMentor, speaker: "kitten",
        text: "What's the difference?" },
      { image: sceneMentor, speaker: "scrapper",
        text: "A kitten waits for help. A stray decides who gets it." },
    ],
  },
  {
    id: "ch4_rival_meeting",
    title: "Chapter 4 — The Rival",
    subtitle: "Every story needs a mirror.",
    intro: [
      { image: sceneRival, speaker: "rival",
        text: "So you're Scrapper's new pet. Cute." },
      { image: sceneRival, speaker: "kitten",
        text: "Who're you supposed to be?" },
      { image: sceneRival, speaker: "rival",
        text: "Name's Domino. I run the east blocks. Word travels fast about a kitten who doesn't know when to quit." },
      { image: sceneRival, speaker: "rival",
        text: "Tell you what. Survive the raccoons this week and I'll consider you competition." },
      { image: sceneRival, speaker: "kitten",
        text: "(Competition. Heh. I like the sound of that.)" },
    ],
    outro: [
      { image: sceneRival, speaker: "rival",
        text: "…not bad, stray. Not bad at all." },
      { image: sceneRival, speaker: "narrator",
        text: "Domino vanished into the dark. He'd be back. They always are." },
    ],
  },
  {
    id: "ch5_alley_pact",
    title: "Chapter 5 — The Alley Pact",
    subtitle: "Raccoons run the back lots. Today, that changes.",
    intro: [
      { image: sceneRaccoonGang, speaker: "raccoon",
        text: "Tribute time, cats. One fish a week. Or the dumpsters burn." },
      { image: sceneRaccoonGang, speaker: "scrapper",
        text: "We've been paying for a year. They keep raising it." },
      { image: sceneRaccoonGang, speaker: "kitten",
        text: "Then we stop paying." },
      { image: sceneRaccoonGang, speaker: "scrapper",
        text: "Kid, that's six of them. Six." },
      { image: sceneRaccoonGang, speaker: "kitten",
        text: "Good. They'll be too crowded to swing." },
      { image: sceneRaccoonGang, speaker: "raccoon",
        text: "You ALL DIE TONIGHT, fleabags!" },
    ],
    outro: [
      { image: hideoutFort, speaker: "narrator",
        text: "The raccoons retreated. Their crates stayed behind. The cats stacked them." },
      { image: hideoutFort, speaker: "kitten",
        text: "From now on, the alley pays itself." },
      { image: hideoutFort, speaker: "scrapper",
        text: "…you got a crew now, kid. Lead 'em right." },
    ],
    unlocksStage: "crate_fort",
    choice: {
      question: "The raccoon boss offers a truce — split the alley fifty-fifty.",
      options: [
        { id: "ally",  label: "Shake on it", blurb: "Allies are cheaper than enemies." },
        { id: "fight", label: "Claws out",   blurb: "The alley belongs to cats. ALL of it." },
      ],
    },
  },
  {
    id: "ch6_king_of_bins",
    title: "Chapter 6 — King of the Bins",
    subtitle: "The Bin Boss has heard your name. He's not happy.",
    intro: [
      { image: sceneBinBossThrone, speaker: "narrator",
        text: "Word climbs fast in the alley. Three blocks over, atop a mountain of trash bags, an old king heard about a young upstart." },
      { image: sceneBinBossThrone, speaker: "boss",
        text: "A KITTEN took my raccoons? A kitten??" },
      { image: sceneBinBossThrone, speaker: "boss",
        text: "Bring her to me. Whole. Or in pieces. I'm not picky." },
      { image: scenePact, speaker: "scrapper",
        text: "Kid… this is the Bin Boss. He eats strays for warm-up." },
      { image: scenePact, speaker: "kitten",
        text: "Then I'll be the snack that bites back." },
      { image: sceneBinBossThrone, speaker: "boss",
        text: "Step onto my throne, fleabag. I dare you." },
    ],
    outro: [
      { image: hideoutThrone, speaker: "narrator",
        text: "The throne creaked under new weight. Smaller weight. Sharper claws." },
      { image: hideoutThrone, speaker: "kitten",
        text: "Tell every cat in the city. This block answers to me now." },
    ],
    unlocksStage: "pallet_throne",
    choice: {
      question: "The defeated Bin Boss lies at your paws.",
      options: [
        { id: "mercy",     label: "Spare them", blurb: "Mercy makes legends." },
        { id: "dominance", label: "Finish it",  blurb: "Fear makes rulers." },
      ],
    },
  },
  {
    id: "ch7_rally",
    title: "Chapter 7 — The Rally",
    subtitle: "Before the final dive, the alley gathers.",
    intro: [
      { image: sceneRally, speaker: "narrator",
        text: "Word of the Luxury Condo run spread through every dumpster from the docks to downtown." },
      { image: sceneRally, speaker: "scrapper",
        text: "Every stray in the city wants in. They're waiting on YOU." },
      { image: sceneRally, speaker: "rival",
        text: "Even me, stray. Even me." },
      { image: sceneRally, speaker: "kitten",
        text: "(All these eyes. All this hope. Don't shake. Don't shake.)" },
      { image: sceneRally, speaker: "kitten",
        text: "Tonight we dive the Condo. Tonight we take what was ours from the start." },
      { image: sceneRally, speaker: "narrator",
        text: "The roar that followed could be heard three boroughs over." },
    ],
    outro: [
      { image: sceneRally, speaker: "scrapper",
        text: "…you've come a long way from that tin can, kid." },
      { image: sceneRally, speaker: "kitten",
        text: "I still carry it. Right here." },
    ],
  },
  {
    id: "ch8_hero",
    title: "Chapter 8 — Hero of the Trash",
    subtitle: "The Luxury Condo run. The final dive.",
    intro: [
      { image: sceneHeroDawn, speaker: "narrator",
        text: "The Condo loomed like a cathedral of waste. Marble lobby. Gold-trimmed bins. Guards on every floor." },
      { image: sceneFinalShowdown, speaker: "boss",
        text: "You made it further than I thought, stray. Pity it ends in MY arena." },
      { image: sceneFinalShowdown, speaker: "kitten",
        text: "I didn't come here to end. I came here to start." },
      { image: sceneFinalShowdown, speaker: "narrator",
        text: "Lightning split the smoke. The alley held its breath." },
      { image: sceneFinalShowdown, speaker: "kitten",
        text: "FOR THE ALLEY!" },
    ],
    outro: [
      { image: hideoutPalace, speaker: "kitten",
        text: "From a tin can to this. Mew." },
      { image: hideoutPalace, speaker: "scrapper",
        text: "Not bad, kid. Not bad at all." },
      { image: hideoutPalace, speaker: "rival",
        text: "Don't get comfortable up there. I'll be back." },
      { image: hideoutPalace, speaker: "narrator",
        text: "Hero of the trash. Legend of the alley. And somewhere out there — a tin can, still rolling." },
    ],
    unlocksStage: "alley_palace",
  },
];

export const chapterById = (id: string) => STORY_CHAPTERS.find(c => c.id === id);