import orbitCover from "@/assets/orbit-cover.jpg";
import orbitBg from "@/assets/orbit-bg.jpg";
import orbitRaccX from "@/assets/orbit-raccx.jpg";

export { orbitCover, orbitBg, orbitRaccX };

// Per-panel story art (Edition #2 — Orbit Trash). One image per sentence,
// generated from docs/orbit-shotlist.md. Mapped intro-then-outro per chapter.
import c1p1 from "@/assets/orbit-story/ch1-01.jpg";
import c1p2 from "@/assets/orbit-story/ch1-02.jpg";
import c1p3 from "@/assets/orbit-story/ch1-03.jpg";
import c1p4 from "@/assets/orbit-story/ch1-04.jpg";
import c1p5 from "@/assets/orbit-story/ch1-05.jpg";
import c1p6 from "@/assets/orbit-story/ch1-06.jpg";
import c1p7 from "@/assets/orbit-story/ch1-07.jpg";
import c1p8 from "@/assets/orbit-story/ch1-08.jpg";
import c1p9 from "@/assets/orbit-story/ch1-09.jpg";
import c2p1 from "@/assets/orbit-story/ch2-01.jpg";
import c2p2 from "@/assets/orbit-story/ch2-02.jpg";
import c2p3 from "@/assets/orbit-story/ch2-03.jpg";
import c2p4 from "@/assets/orbit-story/ch2-04.jpg";
import c2p5 from "@/assets/orbit-story/ch2-05.jpg";
import c2p6 from "@/assets/orbit-story/ch2-06.jpg";
import c2p7 from "@/assets/orbit-story/ch2-07.jpg";
import c2p8 from "@/assets/orbit-story/ch2-08.jpg";
import c3p1 from "@/assets/orbit-story/ch3-01.jpg";
import c3p2 from "@/assets/orbit-story/ch3-02.jpg";
import c3p3 from "@/assets/orbit-story/ch3-03.jpg";
import c3p4 from "@/assets/orbit-story/ch3-04.jpg";
import c3p5 from "@/assets/orbit-story/ch3-05.jpg";
import c3p6 from "@/assets/orbit-story/ch3-06.jpg";
import c3p7 from "@/assets/orbit-story/ch3-07.jpg";
import c3p8 from "@/assets/orbit-story/ch3-08.jpg";
import c4p1 from "@/assets/orbit-story/ch4-01.jpg";
import c4p2 from "@/assets/orbit-story/ch4-02.jpg";
import c4p3 from "@/assets/orbit-story/ch4-03.jpg";
import c4p4 from "@/assets/orbit-story/ch4-04.jpg";
import c4p5 from "@/assets/orbit-story/ch4-05.jpg";
import c4p6 from "@/assets/orbit-story/ch4-06.jpg";
import c4p7 from "@/assets/orbit-story/ch4-07.jpg";
import c5p1 from "@/assets/orbit-story/ch5-01.jpg";
import c5p2 from "@/assets/orbit-story/ch5-02.jpg";
import c5p3 from "@/assets/orbit-story/ch5-03.jpg";
import c5p4 from "@/assets/orbit-story/ch5-04.jpg";
import c5p5 from "@/assets/orbit-story/ch5-05.jpg";
import c5p6 from "@/assets/orbit-story/ch5-06.jpg";
import c5p7 from "@/assets/orbit-story/ch5-07.jpg";
import c5p8 from "@/assets/orbit-story/ch5-08.jpg";
import c6p1 from "@/assets/orbit-story/ch6-01.jpg";
import c6p2 from "@/assets/orbit-story/ch6-02.jpg";
import c6p3 from "@/assets/orbit-story/ch6-03.jpg";
import c6p4 from "@/assets/orbit-story/ch6-04.jpg";
import c6p5 from "@/assets/orbit-story/ch6-05.jpg";
import c6p6 from "@/assets/orbit-story/ch6-06.jpg";
import c6p7 from "@/assets/orbit-story/ch6-07.jpg";
import c6p8 from "@/assets/orbit-story/ch6-08.jpg";
import c7p1 from "@/assets/orbit-story/ch7-01.jpg";
import c7p2 from "@/assets/orbit-story/ch7-02.jpg";
import c7p3 from "@/assets/orbit-story/ch7-03.jpg";
import c7p4 from "@/assets/orbit-story/ch7-04.jpg";
import c7p5 from "@/assets/orbit-story/ch7-05.jpg";
import c7p6 from "@/assets/orbit-story/ch7-06.jpg";
import c7p7 from "@/assets/orbit-story/ch7-07.jpg";
import c8p1 from "@/assets/orbit-story/ch8-01.jpg";
import c8p2 from "@/assets/orbit-story/ch8-02.jpg";
import c8p3 from "@/assets/orbit-story/ch8-03.jpg";
import c8p4 from "@/assets/orbit-story/ch8-04.jpg";
import c8p5 from "@/assets/orbit-story/ch8-05.jpg";
import c8p6 from "@/assets/orbit-story/ch8-06.jpg";
import c8p7 from "@/assets/orbit-story/ch8-07.jpg";

export type OrbitRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface OrbitPanel {
  image: string;
  speaker?: string;
  text: string;
}

export interface OrbitChapter {
  id: string;
  title: string;
  subtitle: string;
  unlocks: string;
  /** Sector dive woven between this chapter's intro and outro. */
  sectorId?: string;
  intro: OrbitPanel[];
  outro: OrbitPanel[];
}

export const ORBIT_CHAPTERS: OrbitChapter[] = [
  {
    id: "wrong_dumpster",
    title: "Chapter 1 — Wrong Dumpster",
    subtitle: "Behind the research lab, one bin glows blue.",
    unlocks: "Space Station Map · Zero-G Tutorial",
    sectorId: "intake",
    intro: [
      { image: c1p1, speaker: "Narrator", text: "Behind the research lab, the dumpster hummed like a fridge full of bees." },
      { image: c1p2, speaker: "Scrapper", text: "Sniff. Tuna. Electricity. Trouble." },
      { image: c1p3, speaker: "Narrator", text: "The crew voted no. Scrapper jumped in anyway." },
      { image: c1p4, speaker: "Scrapper", text: "(Worst case, I find a snack. Best case, I find a BIG snack.)" },
      { image: c1p5, speaker: "Narrator", text: "The lid slammed. The floor shook. The sky got very, very close." },
      { image: c1p6, speaker: "Scrapper", text: "…that's not the floor. WHY ISN'T THAT THE FLOOR—" },
    ],
    outro: [
      { image: c1p7, speaker: "Narrator", text: "By morning, the alley was gone. The trash was floating." },
      { image: c1p8, speaker: "Scrapper", text: "Mew. Okay. New plan. Survive." },
      { image: c1p9, speaker: "Narrator", text: "A hatch hissed open above a sea of drifting garbage. Welcome to STAR-BIN 9." },
    ],
  },
  {
    id: "star_bin_9",
    title: "Chapter 2 — Star-Bin 9",
    subtitle: "The trash is floating.",
    unlocks: "Galley Waste Ring",
    sectorId: "galley",
    intro: [
      { image: c2p1, speaker: "Narrator", text: "Alarms blink red. Trash drifts in midair like lazy snowflakes." },
      { image: c2p2, speaker: "Scrapper", text: "Crew. Stay close. Don't lick anything." },
      { image: c2p3, speaker: "Narrator", text: "Somewhere in the dark, something mechanical sorts garbage. Click. Whirr. Crunch." },
      { image: c2p4, speaker: "Scrapper", text: "That's a cafeteria. Where there's a cafeteria, there's leftovers." },
      { image: c2p5, speaker: "Scrapper", text: "And where there's leftovers… there's me." },
    ],
    outro: [
      { image: c2p6, speaker: "Narrator", text: "The galley ring went quiet. The snacks did not survive." },
      { image: c2p7, speaker: "Scrapper", text: "Floating food. No gravity tax. I could get used to this." },
      { image: c2p8, speaker: "Narrator", text: "But the station had noticed the cat. And it was hungry too." },
    ],
  },
  {
    id: "no_gravity",
    title: "Chapter 3 — No Gravity, No Rules",
    subtitle: "Scrapper learns to pounce sideways.",
    unlocks: "Zero-G Dodge · Space Junk loot tier",
    sectorId: "cargo",
    intro: [
      { image: c3p1, speaker: "Scrapper", text: "Rule one of the alley: always land on your feet." },
      { image: c3p2, speaker: "Scrapper", text: "Up here? There are no feet. There is no down." },
      { image: c3p3, speaker: "Narrator", text: "He pushed off a crate. He kept going. And going." },
      { image: c3p4, speaker: "Scrapper", text: "(Okay. Okay. I totally meant to do that.)" },
      { image: c3p5, speaker: "Narrator", text: "He pounced sideways off a conveyor. It worked. Sort of." },
    ],
    outro: [
      { image: c3p6, speaker: "Narrator", text: "By the third crate, the sideways pounce looked almost graceful." },
      { image: c3p7, speaker: "Scrapper", text: "Zero-G Dodge. Patent pending. Don't tell the raccoons." },
      { image: c3p8, speaker: "Narrator", text: "The cargo chute spat him toward the luxury deck. Fancy." },
    ],
  },
  {
    id: "luxury_trash",
    title: "Chapter 4 — Luxury Trash",
    subtitle: "Rich people throw away the weirdest things.",
    unlocks: "Luxury Disposal · Premium Junk",
    sectorId: "luxury",
    intro: [
      { image: c4p1, speaker: "Narrator", text: "Perfume clouds. Untouched lobster. Gold-trim wrappers, still warm." },
      { image: c4p2, speaker: "Scrapper", text: "Who throws this away?? Mew. I respect them. I also hate them." },
      { image: c4p3, speaker: "Narrator", text: "The luxury deck disposal was a buffet pretending to be garbage." },
      { image: c4p4, speaker: "Scrapper", text: "Note to self: rich people are bad at finishing their food. Good for me." },
    ],
    outro: [
      { image: c4p5, speaker: "Scrapper", text: "Premium junk. Tastes the same as regular junk. Just judgier." },
      { image: c4p6, speaker: "Narrator", text: "Scrapper left three pounds heavier and twice as smug." },
      { image: c4p7, speaker: "Narrator", text: "Beyond the gold doors, something growled. Something that hadn't eaten in a while." },
    ],
  },
  {
    id: "waste_ring",
    title: "Chapter 5 — The Waste Ring",
    subtitle: "Raccoons got here first.",
    unlocks: "Raccoon Pirate enemy · Black Market Shop",
    sectorId: "biohazard",
    intro: [
      { image: c5p1, speaker: "Pirate", text: "Tribute time, fleabags. Caps. Snacks. Now." },
      { image: c5p2, speaker: "Scrapper", text: "We already did this back home. We won." },
      { image: c5p3, speaker: "Narrator", text: "The waste ring crawled with raccoon pirates and things that used to be lunch." },
      { image: c5p4, speaker: "Pirate", text: "This is OUR bin, kitten. Float along." },
      { image: c5p5, speaker: "Scrapper", text: "Make me, trash panda." },
    ],
    outro: [
      { image: c5p6, speaker: "Narrator", text: "The pirates scattered. Their loot did not." },
      { image: c5p7, speaker: "Scrapper", text: "Tell your captain the alley cat says hi." },
      { image: c5p8, speaker: "Pirate", text: "…you'll regret that. Racc-X eats cats for breakfast." },
    ],
  },
  {
    id: "racc_x",
    title: "Chapter 6 — Captain Racc-X",
    subtitle: "King of the orbital bins.",
    unlocks: "Boss Dive: Waste Throne",
    sectorId: "throne",
    intro: [
      { image: c6p1, speaker: "Narrator", text: "Atop a throne of crushed satellites sat the king of the orbital bins." },
      { image: c6p2, speaker: "Racc-X", text: "This station's trash belongs to me, kitten." },
      { image: c6p3, speaker: "Scrapper", text: "Then I'll just take it twice." },
      { image: c6p4, speaker: "Racc-X", text: "Cute claws. Bad orbit." },
      { image: c6p5, speaker: "Narrator", text: "Six pirates. One crown. One very confident cat." },
    ],
    outro: [
      { image: c6p6, speaker: "Narrator", text: "The crown drifted free. Scrapper snatched it out of the air." },
      { image: c6p7, speaker: "Scrapper", text: "Heavy is the head. Good thing I skip leg day." },
      { image: c6p8, speaker: "Racc-X", text: "This isn't over, fleabag. The station won't let you leave." },
    ],
  },
  {
    id: "core_compactor",
    title: "Chapter 7 — Core Compactor",
    subtitle: "The station wants everything smaller.",
    unlocks: "Timed Escape Dive",
    sectorId: "core",
    intro: [
      { image: c7p1, speaker: "Narrator", text: "Klaxons. Red light. The walls began to move INWARD." },
      { image: c7p2, speaker: "Scrapper", text: "GO. GO. GO. Bring the snacks!" },
      { image: c7p3, speaker: "Narrator", text: "STAR-BIN 9 had decided everything would be smaller. Including the cat." },
      { image: c7p4, speaker: "Scrapper", text: "(Run. Don't look at the walls. Don't look at the WALLS.)" },
    ],
    outro: [
      { image: c7p5, speaker: "Narrator", text: "The compactor groaned shut on empty air. The cat was already gone." },
      { image: c7p6, speaker: "Scrapper", text: "Escape pod. Soda can. Same energy." },
      { image: c7p7, speaker: "Narrator", text: "He grabbed the key, the crown, and a suspicious amount of snacks." },
    ],
  },
  {
    id: "trash_moon",
    title: "Chapter 8 — Trash Moon",
    subtitle: "Home is very far away.",
    unlocks: "To be continued… (Edition #3)",
    sectorId: "reentry",
    intro: [
      { image: c8p1, speaker: "Narrator", text: "The escape pod was made of a soda can and a dream." },
      { image: c8p2, speaker: "Scrapper", text: "Wait. That's not Earth." },
      { image: c8p3, speaker: "Narrator", text: "Below them, a moon made entirely of garbage rolled into view." },
      { image: c8p4, speaker: "Scrapper", text: "…is it weird that I'm hungry again?" },
    ],
    outro: [
      { image: c8p5, speaker: "Narrator", text: "Somewhere down there, a new alley waited. A bigger one." },
      { image: c8p6, speaker: "Scrapper", text: "Crew. Buckle up. We're divin'." },
      { image: c8p7, speaker: "Narrator", text: "TO BE CONTINUED… (Edition #3 — Trash Moon)" },
    ],
  },
];

export interface OrbitEnemy {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  atk: number;
  blurb: string;
}

export const ORBIT_ENEMIES: Record<string, OrbitEnemy> = {
  mite:    { id: "mite",    name: "Vacuum Mite",      emoji: "🦟", hp: 14, atk: 3,  blurb: "Clings. Slows. Annoying." },
  drone:   { id: "drone",   name: "Drone Rat",        emoji: "🐀", hp: 26, atk: 5,  blurb: "Wires and teeth. Drops scrap." },
  beetle:  { id: "beetle",  name: "Garbage Beetle Mk II", emoji: "🪲", hp: 42, atk: 6, blurb: "Armored. Slow. Sticky." },
  bot:     { id: "bot",     name: "Sanitation Bot",   emoji: "🤖", hp: 34, atk: 7,  blurb: "Politely lasers cats." },
  pigeon:  { id: "pigeon",  name: "Space Pigeon",     emoji: "🕊️", hp: 18, atk: 4,  blurb: "Cracked helmet. Sticky claws." },
  mold:    { id: "mold",    name: "Mutant Mold Blob", emoji: "🟢", hp: 48, atk: 5,  blurb: "Regenerates. Smells worse." },
  pirate:  { id: "pirate",  name: "Raccoon Pirate",   emoji: "🦝", hp: 52, atk: 9,  blurb: "Trash-hook. No mercy." },
  raccx:   { id: "raccx",   name: "Captain Racc-X",   emoji: "👑", hp: 220, atk: 14, blurb: "BOSS. King of the bins." },
  compactor: { id: "compactor", name: "Core Compactor", emoji: "⚙️", hp: 320, atk: 18, blurb: "FINAL. The walls close in." },
};

export interface OrbitSector {
  id: string;
  name: string;
  subtitle: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Boss" | "Final";
  loot: string;
  enemies: string[];
  rooms: number;
  modifier: string;
  /** Index in ORBIT_CHAPTERS that must be completed to unlock. */
  unlocksAfter: number;
  /** Boss enemy id if this is a boss sector. */
  bossId?: string;
}

export const ORBIT_SECTORS: OrbitSector[] = [
  {
    id: "intake", name: "Airlock Intake",
    subtitle: "Where the station swallows the trash — and the cat.",
    difficulty: "Easy", loot: "Scrap Salvage",
    enemies: ["mite", "pigeon"], rooms: 4, modifier: "Drifting Debris",
    unlocksAfter: 0,
  },
  {
    id: "galley", name: "Galley Waste Ring",
    subtitle: "Cafeteria scraps in zero-G.",
    difficulty: "Easy", loot: "Space Snacks",
    enemies: ["mite", "mold"], rooms: 5, modifier: "Drifting Crumbs",
    unlocksAfter: 1,
  },
  {
    id: "cargo", name: "Cargo Chute 6",
    subtitle: "Magnetic conveyors and rolling crates.",
    difficulty: "Medium", loot: "Magnetic Scrap",
    enemies: ["drone", "bot"], rooms: 6, modifier: "Magnetic Pull",
    unlocksAfter: 2,
  },
  {
    id: "luxury", name: "Luxury Deck Disposal",
    subtitle: "Perfume clouds and gold wrappers.",
    difficulty: "Medium", loot: "Premium Junk",
    enemies: ["bot", "pigeon"], rooms: 6, modifier: "Snack Stabilizer",
    unlocksAfter: 3,
  },
  {
    id: "biohazard", name: "Biohazard Bin",
    subtitle: "Forgotten leftovers fight back.",
    difficulty: "Hard", loot: "Mutant Mold Relics",
    enemies: ["mold", "mite", "beetle"], rooms: 7, modifier: "Vacuum Warning",
    unlocksAfter: 4,
  },
  {
    id: "throne", name: "Racc-X Waste Throne",
    subtitle: "Captain Racc-X holds court.",
    difficulty: "Boss", loot: "Legendary Space Trash",
    enemies: ["pirate", "raccx"], rooms: 5, modifier: "Boss: Loot Steal",
    unlocksAfter: 5,
    bossId: "raccx",
  },
  {
    id: "core", name: "Core Compactor",
    subtitle: "Escape before the walls close.",
    difficulty: "Final", loot: "Escape Pod Key",
    enemies: ["bot", "compactor"], rooms: 6, modifier: "Crusher Countdown",
    unlocksAfter: 6,
    bossId: "compactor",
  },
  {
    id: "reentry", name: "Junk Reentry",
    subtitle: "Punch through the trash moon's debris field.",
    difficulty: "Hard", loot: "Moon Salvage",
    enemies: ["bot", "drone", "pigeon"], rooms: 5, modifier: "Debris Field",
    unlocksAfter: 7,
  },
];

/**
 * Edition completion %, derived purely from the given counts. Components compute
 * it from field selectors (not a get()-based store method) so the SSR snapshot
 * matches and the progress bar hydrates without a mismatch.
 */
export const orbitProgressPct = (completedChapters: number, clearedSectors: number) =>
  Math.round(((completedChapters + clearedSectors) / (ORBIT_CHAPTERS.length + ORBIT_SECTORS.length)) * 100);

export interface OrbitLoot {
  id: string;
  name: string;
  rarity: OrbitRarity;
  emoji: string;
}

export const ORBIT_LOOT: OrbitLoot[] = [
  // Common
  { id: "freeze_sardine", name: "Freeze-Dried Sardine", rarity: "common", emoji: "🐟" },
  { id: "bent_spoon",     name: "Bent Airlock Spoon",   rarity: "common", emoji: "🥄" },
  { id: "snack_wrapper",  name: "Space Snack Wrapper",  rarity: "common", emoji: "🍿" },
  { id: "float_cap",      name: "Floating Bottle Cap",  rarity: "common", emoji: "🧢" },
  { id: "food_tube",      name: "Cracked Food Tube",    rarity: "common", emoji: "🧪" },
  // Uncommon
  { id: "mag_fishbone",   name: "Magnetic Fishbone",    rarity: "uncommon", emoji: "🦴" },
  { id: "zg_sock",        name: "Zero-G Sock",          rarity: "uncommon", emoji: "🧦" },
  { id: "thermal_torn",   name: "Torn Thermal Blanket", rarity: "uncommon", emoji: "🛏️" },
  { id: "whisker_wire",   name: "Robot Whisker Wire",   rarity: "uncommon", emoji: "🔌" },
  { id: "tuna_pouch",     name: "Emergency Tuna Pouch", rarity: "uncommon", emoji: "🥫" },
  // Rare
  { id: "space_fork",     name: "Shiny Space Fork",     rarity: "rare", emoji: "🍴" },
  { id: "drone_tail",     name: "Drone Rat Tail Cable", rarity: "rare", emoji: "⛓️" },
  { id: "vac_sardine",    name: "Vacuum-Sealed Sardine",rarity: "rare", emoji: "🐠" },
  { id: "antigrav_collar",name: "Anti-Gravity Collar",  rarity: "rare", emoji: "📿" },
  { id: "moon_dust",      name: "Moon Dust Charm",      rarity: "rare", emoji: "🌙" },
  // Epic
  { id: "bio_plate",      name: "Bio-Shell Plate",      rarity: "epic", emoji: "🛡️" },
  { id: "lux_relic",      name: "Luxury Snack Relic",   rarity: "epic", emoji: "🍰" },
  { id: "pigeon_helm",    name: "Space Pigeon Helmet",  rarity: "epic", emoji: "⛑️" },
  { id: "mold_core",      name: "Mutant Mold Core",     rarity: "epic", emoji: "🧫" },
  { id: "comet_claw",     name: "Comet Claw Charm",     rarity: "epic", emoji: "☄️" },
  // Legendary
  { id: "starbin_crown", name: "Star-Bin Crown",        rarity: "legendary", emoji: "👑" },
  { id: "raccx_hook",   name: "Racc-X Hook Claw",       rarity: "legendary", emoji: "🪝" },
  { id: "pod_key",      name: "Escape Pod Key",         rarity: "legendary", emoji: "🔑" },
  { id: "orbital_fish", name: "Orbital Fishbone",       rarity: "legendary", emoji: "🦴" },
  { id: "core_heart",   name: "Core Compactor Heart",   rarity: "legendary", emoji: "💠" },
];

export const RACCX_TAUNTS = [
  "This station's trash belongs to me.",
  "Cute claws. Bad orbit.",
  "You're a long way from your alley, kitten.",
  "Space has no curbs, Scrapper.",
];

export const RARITY_TINT: Record<OrbitRarity, string> = {
  common:    "bg-slate-700 text-slate-100",
  uncommon:  "bg-emerald-700 text-emerald-50",
  rare:      "bg-sky-700 text-sky-50",
  epic:      "bg-fuchsia-700 text-fuchsia-50",
  legendary: "bg-amber-500 text-black",
};

export const ORBIT_ABILITIES = [
  { id: "zg_dodge",    name: "Zero-G Dodge",       desc: "20% chance to fully dodge attacks in space dives." },
  { id: "mag_pounce",  name: "Magnetic Pounce",    desc: "+50% damage vs. robotic enemies." },
  { id: "snack_stab",  name: "Snack Stabilizer",   desc: "Food items heal +50% in orbit." },
  { id: "space_scram", name: "Space Scramble",     desc: "Some loot floats away — grab fast." },
  { id: "vac_warn",    name: "Vacuum Warning",     desc: "Hazard rooms tick down HP until cleared." },
];
