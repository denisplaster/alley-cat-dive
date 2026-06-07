import hideoutTinCan from "@/assets/hideout-tin-can.jpg";
import hideoutBox from "@/assets/hideout-cardboard-box.jpg";
import hideoutFort from "@/assets/hideout-crate-fort.jpg";
import hideoutThrone from "@/assets/hideout-pallet-throne.jpg";
import hideoutPalace from "@/assets/hideout-alley-palace.jpg";

// Per-panel story art. Each panel gets its own image so no dialogue beat reuses art.
import c1p1 from "@/assets/story/ch1-01.jpg";
import c1p2 from "@/assets/story/ch1-02.jpg";
import c1p3 from "@/assets/story/ch1-03.jpg";
import c1p4 from "@/assets/story/ch1-04.jpg";
import c1p5 from "@/assets/story/ch1-05.jpg";
import c1p6 from "@/assets/story/ch1-06.jpg";
import c1p7 from "@/assets/story/ch1-07.jpg";
import c1p8 from "@/assets/story/ch1-08.jpg";
import c1p9 from "@/assets/story/ch1-09.jpg";
import c1p10 from "@/assets/story/ch1-10.jpg";
import c2p1 from "@/assets/story/ch2-01.jpg";
import c2p2 from "@/assets/story/ch2-02.jpg";
import c2p3 from "@/assets/story/ch2-03.jpg";
import c2p4 from "@/assets/story/ch2-04.jpg";
import c2p5 from "@/assets/story/ch2-05.jpg";
import c2p6 from "@/assets/story/ch2-06.jpg";
import c2p7 from "@/assets/story/ch2-07.jpg";
import c2p8 from "@/assets/story/ch2-08.jpg";
import c2p9 from "@/assets/story/ch2-09.jpg";
import c2p10 from "@/assets/story/ch2-10.jpg";
import c2p11 from "@/assets/story/ch2-11.jpg";
import c2p12 from "@/assets/story/ch2-12.jpg";
import c3p1 from "@/assets/story/ch3-01.jpg";
import c3p2 from "@/assets/story/ch3-02.jpg";
import c3p3 from "@/assets/story/ch3-03.jpg";
import c3p4 from "@/assets/story/ch3-04.jpg";
import c3p5 from "@/assets/story/ch3-05.jpg";
import c3p6 from "@/assets/story/ch3-06.jpg";
import c3p7 from "@/assets/story/ch3-07.jpg";
import c3p8 from "@/assets/story/ch3-08.jpg";
import c3p9 from "@/assets/story/ch3-09.jpg";
import c3p10 from "@/assets/story/ch3-10.jpg";
import c4p1 from "@/assets/story/ch4-01.jpg";
import c4p2 from "@/assets/story/ch4-02.jpg";
import c4p3 from "@/assets/story/ch4-03.jpg";
import c4p4 from "@/assets/story/ch4-04.jpg";
import c4p5 from "@/assets/story/ch4-05.jpg";
import c4p6 from "@/assets/story/ch4-06.jpg";
import c4p7 from "@/assets/story/ch4-07.jpg";
import c5p1 from "@/assets/story/ch5-01.jpg";
import c5p2 from "@/assets/story/ch5-02.jpg";
import c5p3 from "@/assets/story/ch5-03.jpg";
import c5p4 from "@/assets/story/ch5-04.jpg";
import c5p5 from "@/assets/story/ch5-05.jpg";
import c5p6 from "@/assets/story/ch5-06.jpg";
import c5p7 from "@/assets/story/ch5-07.jpg";
import c5p8 from "@/assets/story/ch5-08.jpg";
import c5p9 from "@/assets/story/ch5-09.jpg";
import c6p1 from "@/assets/story/ch6-01.jpg";
import c6p2 from "@/assets/story/ch6-02.jpg";
import c6p3 from "@/assets/story/ch6-03.jpg";
import c6p4 from "@/assets/story/ch6-04.jpg";
import c6p5 from "@/assets/story/ch6-05.jpg";
import c6p6 from "@/assets/story/ch6-06.jpg";
import c6p7 from "@/assets/story/ch6-07.jpg";
import c6p8 from "@/assets/story/ch6-08.jpg";
import c7p1 from "@/assets/story/ch7-01.jpg";
import c7p2 from "@/assets/story/ch7-02.jpg";
import c7p3 from "@/assets/story/ch7-03.jpg";
import c7p4 from "@/assets/story/ch7-04.jpg";
import c7p5 from "@/assets/story/ch7-05.jpg";
import c7p6 from "@/assets/story/ch7-06.jpg";
import c7p7 from "@/assets/story/ch7-07.jpg";
import c7p8 from "@/assets/story/ch7-08.jpg";
import c8p1 from "@/assets/story/ch8-01.jpg";
import c8p2 from "@/assets/story/ch8-02.jpg";
import c8p3 from "@/assets/story/ch8-03.jpg";
import c8p4 from "@/assets/story/ch8-04.jpg";
import c8p5 from "@/assets/story/ch8-05.jpg";
import c8p6 from "@/assets/story/ch8-06.jpg";
import c8p7 from "@/assets/story/ch8-07.jpg";
import c8p8 from "@/assets/story/ch8-08.jpg";
import c8p9 from "@/assets/story/ch8-09.jpg";

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
  /** Short list of gameplay unlocks shown on the reward panel. */
  rewards?: { icon: string; label: string; detail: string }[];
  /** Human-readable prerequisite shown on locked chapters. */
  unlockRequirement?: string;
}

export const STORY_CHAPTERS: Chapter[] = [
  {
    id: "ch1_abandoned",
    title: "Chapter 1 — Abandoned",
    subtitle: "The rain. The alley. The can.",
    intro: [
      { image: c1p1, speaker: "narrator",
        text: "It rained for three days straight. The kind of rain that washes names off mailboxes and memories off doorsteps." },
      { image: c1p2, speaker: "narrator",
        text: "On the third night, a cardboard box was left behind the diner on the corner. Inside it: one shivering bundle of gray fluff." },
      { image: c1p3, speaker: "kitten",
        text: "…m-mew?" },
      { image: c1p4, speaker: "narrator",
        text: "She had no name. No mother. No memory of either. Only the cold, and the smell of stale rain." },
      { image: c1p5, speaker: "kitten",
        text: "Mew… mew?? Anyone…?" },
      { image: c1p6, speaker: "narrator",
        text: "A rusted tin can rolled out from beneath the dumpster. Old tuna. Tiny shelter. It would have to do." },
      { image: c1p7, speaker: "kitten",
        text: "(It smells… kinda nice in here.)" },
    ],
    outro: [
      { image: c1p8, speaker: "kitten",
        text: "Mine. My can. My place." },
      { image: c1p9, speaker: "narrator",
        text: "She didn't know the word for 'home' yet. But she knew the shape of one." },
      { image: c1p10, speaker: "narrator",
        text: "Tonight, she sleeps. Tomorrow… she hunts." },
    ],
    unlocksStage: "tin_can",
  },
  {
    id: "ch2_first_scraps",
    title: "Chapter 2 — First Scraps",
    subtitle: "She meets the one they call Scrapper.",
    intro: [
      { image: c2p1, speaker: "narrator",
        text: "Day four. The hunger was louder than the rain now." },
      { image: c2p2, speaker: "kitten",
        text: "(A fish head. Right there. Mine.)" },
      { image: c2p3, speaker: "scrapper",
        text: "Paws off, runt. That's MY dumpster." },
      { image: c2p4, speaker: "kitten",
        text: "I-I was here first! The rat agreed!" },
      { image: c2p5, speaker: "scrapper",
        text: "Heh. The RAT. You named the rat?" },
      { image: c2p6, speaker: "kitten",
        text: "His name's Gerald. He has a family." },
      { image: c2p7, speaker: "scrapper",
        text: "…kid, you're either a legend in the making or about to get eaten. Probably both." },
    ],
    outro: [
      { image: c2p8, speaker: "scrapper",
        text: "Listen. You got guts but no claws. That's a death sentence out here." },
      { image: c2p9, speaker: "scrapper",
        text: "Take the box behind the laundromat. It's dry. I'll show you the ropes." },
      { image: c2p10, speaker: "kitten",
        text: "Why help me?" },
      { image: c2p11, speaker: "scrapper",
        text: "…someone helped me once. Don't make me regret it." },
      { image: c2p12, speaker: "narrator",
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
      { image: c3p1, speaker: "scrapper",
        text: "Rule one: you don't fight what you can't out-run." },
      { image: c3p2, speaker: "scrapper",
        text: "Rule two: if you GOTTA fight — make the first move count." },
      { image: c3p3, speaker: "kitten",
        text: "Like… this?!" },
      { image: c3p4, speaker: "scrapper",
        text: "Higher! Faster! The rooftops don't catch you if you hesitate!" },
      { image: c3p5, speaker: "narrator",
        text: "Weeks blurred together. She fell. She climbed. She fell again." },
      { image: c3p6, speaker: "kitten",
        text: "(Land. Land. LAND—!)" },
      { image: c3p7, speaker: "scrapper",
        text: "…huh. Kid actually stuck the landing." },
    ],
    outro: [
      { image: c3p8, speaker: "scrapper",
        text: "You're not a kitten anymore. You're a stray. There's a difference." },
      { image: c3p9, speaker: "kitten",
        text: "What's the difference?" },
      { image: c3p10, speaker: "scrapper",
        text: "A kitten waits for help. A stray decides who gets it." },
    ],
    unlocksStage: "crate_fort",
  },
  {
    id: "ch4_rival_meeting",
    title: "Chapter 4 — The Rival",
    subtitle: "Every story needs a mirror.",
    intro: [
      { image: c4p1, speaker: "rival",
        text: "So you're Scrapper's new pet. Cute." },
      { image: c4p2, speaker: "kitten",
        text: "Who're you supposed to be?" },
      { image: c4p3, speaker: "rival",
        text: "Name's Domino. I run the east blocks. Word travels fast about a kitten who doesn't know when to quit." },
      { image: c4p4, speaker: "rival",
        text: "Tell you what. Survive the raccoons this week and I'll consider you competition." },
      { image: c4p5, speaker: "kitten",
        text: "(Competition. Heh. I like the sound of that.)" },
    ],
    outro: [
      { image: c4p6, speaker: "rival",
        text: "…not bad, stray. Not bad at all." },
      { image: c4p7, speaker: "narrator",
        text: "Domino vanished into the dark. He'd be back. They always are." },
    ],
  },
  {
    id: "ch5_alley_pact",
    title: "Chapter 5 — The Alley Pact",
    subtitle: "Raccoons run the back lots. Today, that changes.",
    intro: [
      { image: c5p1, speaker: "raccoon",
        text: "Tribute time, cats. One fish a week. Or the dumpsters burn." },
      { image: c5p2, speaker: "scrapper",
        text: "We've been paying for a year. They keep raising it." },
      { image: c5p3, speaker: "kitten",
        text: "Then we stop paying." },
      { image: c5p4, speaker: "scrapper",
        text: "Kid, that's six of them. Six." },
      { image: c5p5, speaker: "kitten",
        text: "Good. They'll be too crowded to swing." },
      { image: c5p6, speaker: "raccoon",
        text: "You ALL DIE TONIGHT, fleabags!" },
    ],
    outro: [
      { image: c5p7, speaker: "narrator",
        text: "The raccoons retreated. Their crates stayed behind. The cats stacked them." },
      { image: c5p8, speaker: "kitten",
        text: "From now on, the alley pays itself." },
      { image: c5p9, speaker: "scrapper",
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
      { image: c6p1, speaker: "narrator",
        text: "Word climbs fast in the alley. Three blocks over, atop a mountain of trash bags, an old king heard about a young upstart." },
      { image: c6p2, speaker: "boss",
        text: "A KITTEN took my raccoons? A kitten??" },
      { image: c6p3, speaker: "boss",
        text: "Bring her to me. Whole. Or in pieces. I'm not picky." },
      { image: c6p4, speaker: "scrapper",
        text: "Kid… this is the Bin Boss. He eats strays for warm-up." },
      { image: c6p5, speaker: "kitten",
        text: "Then I'll be the snack that bites back." },
      { image: c6p6, speaker: "boss",
        text: "Step onto my throne, fleabag. I dare you." },
    ],
    outro: [
      { image: c6p7, speaker: "narrator",
        text: "The throne creaked under new weight. Smaller weight. Sharper claws." },
      { image: c6p8, speaker: "kitten",
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
      { image: c7p1, speaker: "narrator",
        text: "Word of the Luxury Condo run spread through every dumpster from the docks to downtown." },
      { image: c7p2, speaker: "scrapper",
        text: "Every stray in the city wants in. They're waiting on YOU." },
      { image: c7p3, speaker: "rival",
        text: "Even me, stray. Even me." },
      { image: c7p4, speaker: "kitten",
        text: "(All these eyes. All this hope. Don't shake. Don't shake.)" },
      { image: c7p5, speaker: "kitten",
        text: "Tonight we dive the Condo. Tonight we take what was ours from the start." },
      { image: c7p6, speaker: "narrator",
        text: "The roar that followed could be heard three boroughs over." },
    ],
    outro: [
      { image: c7p7, speaker: "scrapper",
        text: "…you've come a long way from that tin can, kid." },
      { image: c7p8, speaker: "kitten",
        text: "I still carry it. Right here." },
    ],
  },
  {
    id: "ch8_hero",
    title: "Chapter 8 — Hero of the Trash",
    subtitle: "The Luxury Condo run. The final dive.",
    intro: [
      { image: c8p1, speaker: "narrator",
        text: "The Condo loomed like a cathedral of waste. Marble lobby. Gold-trimmed bins. Guards on every floor." },
      { image: c8p2, speaker: "boss",
        text: "You made it further than I thought, stray. Pity it ends in MY arena." },
      { image: c8p3, speaker: "kitten",
        text: "I didn't come here to end. I came here to start." },
      { image: c8p4, speaker: "narrator",
        text: "Lightning split the smoke. The alley held its breath." },
      { image: c8p5, speaker: "kitten",
        text: "FOR THE ALLEY!" },
    ],
    outro: [
      { image: c8p6, speaker: "kitten",
        text: "From a tin can to this. Mew." },
      { image: c8p7, speaker: "scrapper",
        text: "Not bad, kid. Not bad at all." },
      { image: c8p8, speaker: "rival",
        text: "Don't get comfortable up there. I'll be back." },
      { image: c8p9, speaker: "narrator",
        text: "Hero of the trash. Legend of the alley. And somewhere out there — a tin can, still rolling." },
    ],
    unlocksStage: "alley_palace",
  },
];

export const chapterById = (id: string) => STORY_CHAPTERS.find(c => c.id === id);