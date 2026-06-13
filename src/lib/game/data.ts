import type { Cat, Dumpster, Enemy, HideoutUpgrade, Item, ShopItem } from "./types";
import heroCat from "@/assets/hero-cat.png";
import catScrapper from "@/assets/cat-scrapper.png";
import catSneakpaw from "@/assets/cat-sneakpaw.png";
import catMoldmancer from "@/assets/cat-moldmancer.png";
import catTinknight from "@/assets/cat-tinknight.png";
import catGreasefang from "@/assets/cat-greasefang.png";
import dGreasy from "@/assets/dumpster-greasy.jpg";
import dApartment from "@/assets/dumpster-apartment.jpg";
import dMall from "@/assets/dumpster-mall.jpg";
import dFish from "@/assets/dumpster-fish.jpg";
import dHaunted from "@/assets/dumpster-haunted.jpg";
import dLuxury from "@/assets/dumpster-luxury.jpg";
import dRooftop from "@/assets/dumpster-rooftop.jpg";
import dSubway from "@/assets/dumpster-subway.jpg";

export const portraits = {
  hero: heroCat,
  scrapper: catScrapper,
  sneakpaw: catSneakpaw,
  moldmancer: catMoldmancer,
  tinknight: catTinknight,
  greasefang: catGreasefang,
};

export const INITIAL_CATS: Cat[] = [
  {
    id: "scrapper", name: "Scrapper", catClass: "Scrapper", level: 1, xp: 0,
    hp: 75, maxHp: 75, attack: 11, defense: 4, speed: 5,
    ability: "Junk Frenzy — chains 3 extra scratches when below half HP",
    portrait: portraits.scrapper, status: "ready", recoverySecondsLeft: 0,
    equipment: {},
  },
  {
    id: "sneakpaw", name: "Sneakpaw", catClass: "Sneak", level: 1, xp: 0,
    hp: 58, maxHp: 58, attack: 13, defense: 3, speed: 10,
    ability: "Shadow Pounce — first strike each room deals double damage",
    portrait: portraits.sneakpaw, status: "ready", recoverySecondsLeft: 0,
    equipment: {},
  },
  {
    id: "moldmancer", name: "Moldmancer", catClass: "Moldmancer", level: 1, xp: 0,
    hp: 54, maxHp: 54, attack: 10, defense: 4, speed: 5,
    ability: "Spore Cloud — poisons enemy for 3 ticks",
    portrait: portraits.moldmancer, status: "ready", recoverySecondsLeft: 0,
    equipment: {},
  },
  {
    id: "tinknight", name: "Tin Knight", catClass: "Knight", level: 1, xp: 0,
    hp: 92, maxHp: 92, attack: 8, defense: 8, speed: 3,
    ability: "Lid Block — absorbs 50% of next 3 hits",
    portrait: portraits.tinknight, status: "injured", recoverySecondsLeft: 252,
    equipment: {},
  },
  {
    id: "greasefang", name: "Greasefang", catClass: "Greasefang", level: 1, xp: 0,
    hp: 66, maxHp: 66, attack: 10, defense: 4, speed: 6,
    ability: "Slick Coat — 25% dodge after eating any food item",
    portrait: portraits.greasefang, status: "resting", recoverySecondsLeft: 88,
    equipment: {},
  },
];

export const ENEMIES: Record<string, Omit<Enemy, "id" | "hp" | "maxHp"> & { baseHp: number }> = {
  rat_swarm:    { name: "Rat Swarm",       baseHp: 40,  attack: 8,  emoji: "🐀" },
  raccoon:      { name: "Angry Raccoon",   baseHp: 80,  attack: 14, emoji: "🦝" },
  trash_slime:  { name: "Trash Slime",     baseHp: 55,  attack: 6,  emoji: "🟢" },
  mold_goblin:  { name: "Mold Goblin",     baseHp: 70,  attack: 12, emoji: "👹" },
  pigeon_thief: { name: "Pigeon Thief",    baseHp: 35,  attack: 10, emoji: "🐦" },
  trash_bag:    { name: "Sentient Trash Bag", baseHp: 110, attack: 16, emoji: "🗑️" },
  // Beginner enemies for kitten/juvenile stage dives
  garbage_beetle: { name: "Garbage Beetle", baseHp: 95, attack: 14, emoji: "🪲" },
  dust_bunny:     { name: "Dust Bunny",     baseHp: 75, attack: 12, emoji: "🌫️" },
  litter_mouse:   { name: "Litter Mouse",   baseHp: 60, attack: 10, emoji: "🐁" },
  gull_raider:    { name: "Dumpster Gull",  baseHp: 68, attack: 13, emoji: "🪶" },
  can_crab:       { name: "Can Crab",       baseHp: 88, attack: 15, emoji: "🦀" },
  feral_chihuahua:{ name: "Feral Chihuahua",baseHp: 92, attack: 17, emoji: "🐕" },
  grease_sprite:  { name: "Grease Sprite",  baseHp: 72, attack: 14, emoji: "🫧" },
  alley_crow:     { name: "Alley Crow",     baseHp: 82, attack: 15, emoji: "🐦‍⬛" },
  scrap_serpent:  { name: "Scrap Serpent",  baseHp: 120, attack: 18, emoji: "🪤" },
  spoiled_imp:    { name: "Spoiled Imp",    baseHp: 98, attack: 16, emoji: "😈" },
  condo_hound:    { name: "Condo Hound",    baseHp: 132, attack: 20, emoji: "🐩" },
  // Rooftop & subway themed foes for late-chapter dumpsters
  pigeon_lord:    { name: "Pigeon Lord",    baseHp: 140, attack: 19, emoji: "🕊️" },
  vent_wisp:      { name: "Vent Wisp",      baseHp: 105, attack: 17, emoji: "💨" },
  antenna_imp:    { name: "Antenna Imp",    baseHp: 115, attack: 18, emoji: "📡" },
  subway_rat_king:{ name: "Subway Rat King",baseHp: 160, attack: 21, emoji: "🐀" },
  tunnel_ghoul:   { name: "Tunnel Ghoul",   baseHp: 145, attack: 22, emoji: "👻" },
  graffiti_wraith:{ name: "Graffiti Wraith",baseHp: 125, attack: 20, emoji: "🎨" },
};

export const DUMPSTERS: Dumpster[] = [
  { id: "greasy", name: "Greasy Spoon Dumpster", image: dGreasy, difficulty: 1,
    expectedLoot: "uncommon", enemyPool: ["litter_mouse","garbage_beetle","dust_bunny","rat_swarm","pigeon_thief","gull_raider","grease_sprite"], rooms: 5,
    truckTimerSec: 180, recommendedPower: 30, status: "unlocked", rewardCaps: 8, rewardBones: 60 },
  { id: "apartment", name: "Apartment Alley Bin", image: dApartment, difficulty: 2,
    expectedLoot: "rare", enemyPool: ["garbage_beetle","rat_swarm","pigeon_thief","alley_crow","can_crab","raccoon"], rooms: 6,
    truckTimerSec: 200, recommendedPower: 55, status: "unlocked", rewardCaps: 14, rewardBones: 120 },
  { id: "mall", name: "Mall Food Court Compactor", image: dMall, difficulty: 3,
    expectedLoot: "rare", enemyPool: ["raccoon","mold_goblin","trash_bag","feral_chihuahua","gull_raider","spoiled_imp"], rooms: 7,
    truckTimerSec: 240, recommendedPower: 80, status: "dangerous", rewardCaps: 22, rewardBones: 220 },
  { id: "fish", name: "Fish Market Dumpster", image: dFish, difficulty: 4,
    expectedLoot: "epic", enemyPool: ["pigeon_thief","trash_bag","raccoon","alley_crow","scrap_serpent","can_crab"], rooms: 8,
    truckTimerSec: 220, recommendedPower: 110, status: "unlocked", rewardCaps: 30, rewardBones: 340,
    bossRunsAway: true },
  { id: "haunted", name: "Haunted Recycling Bin", image: dHaunted, difficulty: 5,
    expectedLoot: "legendary", enemyPool: ["mold_goblin","trash_bag","raccoon","grease_sprite","scrap_serpent","spoiled_imp"], rooms: 9,
    truckTimerSec: 260, recommendedPower: 150, status: "locked", rewardCaps: 45, rewardBones: 520,
    bossRunsAway: true },
  { id: "luxury", name: "Luxury Condo Trash Room", image: dLuxury, difficulty: 6,
    expectedLoot: "mythic", enemyPool: ["raccoon","trash_bag","mold_goblin","condo_hound","spoiled_imp","scrap_serpent"], rooms: 10,
    truckTimerSec: 300, recommendedPower: 200, status: "locked", rewardCaps: 80, rewardBones: 900 },
  { id: "rooftop", name: "Rooftop AC Bin", image: dRooftop, difficulty: 5,
    expectedLoot: "legendary", enemyPool: ["vent_wisp","antenna_imp","alley_crow","gull_raider","grease_sprite","pigeon_lord"], rooms: 9,
    truckTimerSec: 270, recommendedPower: 160, status: "locked", rewardCaps: 50, rewardBones: 560 },
  { id: "subway", name: "Subway Platform Dumpster", image: dSubway, difficulty: 5,
    expectedLoot: "legendary", enemyPool: ["tunnel_ghoul","graffiti_wraith","rat_swarm","mold_goblin","scrap_serpent","subway_rat_king"], rooms: 9,
    truckTimerSec: 270, recommendedPower: 170, status: "locked", rewardCaps: 55, rewardBones: 620 },
];

let _itemId = 1000;
export const newItemId = () => `it_${_itemId++}`;

export const LOOT_POOL: Omit<Item, "id">[] = [
  { name: "Rusty Can Lid Shield", rarity: "common",    kind: "armor",  defense: 4,  flavor: "Slightly tetanus-flavored.", sellPrice: 5 },
  { name: "Shiny Fork Dagger",    rarity: "uncommon",  kind: "weapon", attack: 8,   flavor: "One tine missing. Still pokes.", sellPrice: 12 },
  { name: "Half-Eaten Tuna Relic",rarity: "rare",      kind: "relic",  attack: 4, defense: 4, flavor: "Smells like victory.", sellPrice: 28 },
  { name: "Bottle Cap Ring",      rarity: "rare",      kind: "relic",  speed: 6,    flavor: "Pops off the most stubborn fights.", sellPrice: 30 },
  { name: "Grease-Stained Cape",  rarity: "epic",      kind: "armor",  defense: 14, speed: 4,  flavor: "Repels water. Attracts flies.", sellPrice: 70 },
  { name: "Cursed Pizza Slice",   rarity: "epic",      kind: "food",   health: 40, attack: 6, flavor: "Pepperoni whispers.", sellPrice: 60 },
  { name: "Cardboard Crown",      rarity: "legendary", kind: "relic",  attack: 10, defense: 10, speed: 4, flavor: "King of the alley. For tonight.", sellPrice: 180 },
  { name: "Legendary Fishbone",   rarity: "legendary", kind: "weapon", attack: 24,  flavor: "Ancient. Stinky. Pointy.", sellPrice: 220 },
  { name: "Sardine of Healing",   rarity: "uncommon",  kind: "food",   health: 25, flavor: "Single use. Don't share.", sellPrice: 10 },
  { name: "Moldy Crouton Charm",  rarity: "common",    kind: "junk",   flavor: "It pulses, kind of.", sellPrice: 3 },
  { name: "Mythic Trash Goo Vial",rarity: "mythic",    kind: "crafting", attack: 18, defense: 18, health: 30, flavor: "DO NOT INGEST.", sellPrice: 500 },
];

export const HIDEOUT_UPGRADES: HideoutUpgrade[] = [
  { id: "castle",   name: "Cardboard Castle",      level: 2, maxLevel: 10,
    costBones: (l)=>120*l, costCaps:(l)=>4*l, benefit: "+8% max HP per level",
    description: "Layered boxes, duct-tape walls. The cats love it." },
  { id: "pantry",   name: "Tuna Can Pantry",       level: 1, maxLevel: 8,
    costBones: (l)=>80*l, costCaps:(l)=>2*l, benefit: "Unlocks better food drops",
    description: "Stockpile of slightly-dented tuna treasure." },
  { id: "gym",      name: "Scratching Post Gym",   level: 3, maxLevel: 10,
    costBones: (l)=>150*l, costCaps:(l)=>5*l, benefit: "+5% attack per level",
    description: "Hand-shredded for maximum claw sharpness." },
  { id: "bank",     name: "Bottle Cap Bank",       level: 1, maxLevel: 6,
    costBones: (l)=>200*l, costCaps:(l)=>0, benefit: "+10% caps from dives",
    description: "A sock under a brick. Audited weekly." },
  { id: "alchemy",  name: "Trash Alchemy Table",   level: 0, maxLevel: 6,
    costBones: (l)=>(l+1)*250, costCaps:(l)=>(l+1)*8, benefit: "Combine junk into relics",
    description: "Smells like science. Or rot." },
  { id: "nap",      name: "Nap Pile Recovery Zone",level: 1, maxLevel: 8,
    costBones: (l)=>100*l, costCaps:(l)=>3*l, benefit: "Cats recover 25% faster per level",
    description: "A mound of warm laundry. Sacred." },
  { id: "fence",    name: "Raccoon Fence",         level: 0, maxLevel: 5,
    costBones: (l)=>(l+1)*400, costCaps:(l)=>(l+1)*12, benefit: "Better shop rotations",
    description: "Keeps the merchant honest. Ish." },
];

export const SHOP_ITEMS: ShopItem[] = [
  { id: "mystery_bag", name: "Mystery Trash Bag", description: "Might be loot. Might be a wasp.", costBones: 80, costCaps: 0, rarity: "uncommon" },
  { id: "tuna_snack", name: "Tuna Snack", description: "+25 HP next dive.", costBones: 30, costCaps: 0, rarity: "common" },
  { id: "healing_sardine", name: "Healing Sardine", description: "Revives a fallen cat instantly.", costBones: 0, costCaps: 6, rarity: "rare" },
  { id: "random_relic", name: "Random Relic", description: "A relic from nowhere good.", costBones: 220, costCaps: 0, rarity: "rare" },
  { id: "shiny_junk", name: "Shiny Junk Pack", description: "Five pieces of suspicious junk.", costBones: 60, costCaps: 0, rarity: "common" },
  { id: "premium_key", name: "Premium Dumpster Key", description: "Unlocks a single locked bin for one run.", costBones: 0, costCaps: 18, rarity: "legendary" },
];
