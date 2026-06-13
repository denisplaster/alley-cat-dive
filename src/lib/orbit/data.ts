import orbitCover from "@/assets/orbit-cover.jpg";
import orbitBg from "@/assets/orbit-bg.jpg";
import orbitRaccX from "@/assets/orbit-raccx.jpg";

export { orbitCover, orbitBg, orbitRaccX };

export type OrbitRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface OrbitChapter {
  id: string;
  title: string;
  subtitle: string;
  unlocks: string;
  panels: { speaker?: string; text: string }[];
}

export const ORBIT_CHAPTERS: OrbitChapter[] = [
  {
    id: "wrong_dumpster",
    title: "Chapter 1 — Wrong Dumpster",
    subtitle: "Behind the research lab, one bin glows blue.",
    unlocks: "Space Station Map · Zero-G Tutorial",
    panels: [
      { speaker: "Narrator", text: "Behind the research lab, the dumpster hummed like a fridge full of bees." },
      { speaker: "Scrapper", text: "Sniff. Tuna. Electricity. Trouble." },
      { speaker: "Narrator", text: "The crew voted no. Scrapper jumped in anyway." },
      { speaker: "Narrator", text: "The lid slammed. The floor shook. The sky got very close." },
      { speaker: "Narrator", text: "By morning, the alley was gone. The trash was floating." },
      { speaker: "Narrator", text: "Welcome to STAR-BIN 9." },
    ],
  },
  {
    id: "star_bin_9",
    title: "Chapter 2 — Star-Bin 9",
    subtitle: "The trash is floating.",
    unlocks: "Galley Waste Ring",
    panels: [
      { speaker: "Narrator", text: "Alarms blink red. Trash drifts in midair like lazy snowflakes." },
      { speaker: "Scrapper", text: "Crew. Stay close. Don't lick anything." },
      { speaker: "Narrator", text: "Somewhere in the dark, something mechanical sorts garbage." },
    ],
  },
  {
    id: "no_gravity",
    title: "Chapter 3 — No Gravity, No Rules",
    subtitle: "Scrapper learns to pounce sideways.",
    unlocks: "Zero-G Dodge · Space Junk loot tier",
    panels: [
      { speaker: "Scrapper", text: "Rule one of the alley: land on your feet." },
      { speaker: "Scrapper", text: "Up here? There are no feet. There is no down." },
      { speaker: "Narrator", text: "He pounced sideways. It worked. Sort of." },
    ],
  },
  {
    id: "luxury_trash",
    title: "Chapter 4 — Luxury Trash",
    subtitle: "Rich people throw away the weirdest things.",
    unlocks: "Luxury Disposal · Premium Junk",
    panels: [
      { speaker: "Narrator", text: "Perfume clouds. Untouched lobster. Gold-trim wrappers." },
      { speaker: "Scrapper", text: "Who throws this away?? Mew. I respect them. I also hate them." },
    ],
  },
  {
    id: "waste_ring",
    title: "Chapter 5 — The Waste Ring",
    subtitle: "Raccoons got here first.",
    unlocks: "Raccoon Pirate enemy · Black Market Shop",
    panels: [
      { speaker: "Pirate", text: "Tribute time, fleabags. Caps. Snacks. Now." },
      { speaker: "Scrapper", text: "We already did this back home. We won." },
    ],
  },
  {
    id: "racc_x",
    title: "Chapter 6 — Captain Racc-X",
    subtitle: "King of the orbital bins.",
    unlocks: "Boss Dive: Waste Throne",
    panels: [
      { speaker: "Racc-X", text: "This station's trash belongs to me, kitten." },
      { speaker: "Scrapper", text: "Then I'll just take it twice." },
    ],
  },
  {
    id: "core_compactor",
    title: "Chapter 7 — Core Compactor",
    subtitle: "The station wants everything smaller.",
    unlocks: "Timed Escape Dive",
    panels: [
      { speaker: "Narrator", text: "Klaxons. The walls move INWARD." },
      { speaker: "Scrapper", text: "GO. GO. GO. Bring the snacks!" },
    ],
  },
  {
    id: "trash_moon",
    title: "Chapter 8 — Trash Moon",
    subtitle: "Home is very far away.",
    unlocks: "To be continued… (Edition #3)",
    panels: [
      { speaker: "Narrator", text: "The escape pod was made of a soda can and a dream." },
      { speaker: "Scrapper", text: "That's not Earth." },
      { speaker: "Narrator", text: "Below them, a moon made entirely of garbage rolled into view." },
      { speaker: "Narrator", text: "TO BE CONTINUED…" },
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
];

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