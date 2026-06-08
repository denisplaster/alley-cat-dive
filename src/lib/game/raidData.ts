import type { Element, OverdriveDef, Skill } from "./raidTypes";
import { OVERDRIVES } from "./raidTypes";

// ---- Skills (shared library) ----
export const SKILLS: Record<string, Skill> = {
  fire_claw:   { id: "fire_claw",   name: "Fire Claw",   mpCost: 8,  power: 1.6, element: "fire",
    target: "one", kind: "damage", description: "Single hit, fire damage." },
  ice_lance:   { id: "ice_lance",   name: "Ice Lance",   mpCost: 10, power: 1.7, element: "ice",
    target: "one", kind: "damage", description: "Pierces armor with frost." },
  static_hiss: { id: "static_hiss", name: "Static Hiss", mpCost: 12, power: 1.2, element: "shock",
    target: "allEnemies", kind: "damage", tickCost: 1.2,
    description: "Shocks every enemy at once." },
  spore_cloud: { id: "spore_cloud", name: "Spore Cloud", mpCost: 14, power: 1.0, element: "stink",
    target: "allEnemies", kind: "damage", tickCost: 1.2,
    description: "Toxic puff. AoE stink damage." },
  field_heal:  { id: "field_heal",  name: "Field Lick",  mpCost: 9,  power: 1.4, element: "claw",
    target: "allAllies", kind: "heal",
    description: "Restores HP to the whole party." },
  quick_swipe: { id: "quick_swipe", name: "Quick Swipe", mpCost: 4,  power: 0.9, element: "claw",
    target: "one", kind: "damage", tickCost: 0.6,
    description: "Faster than a normal attack — short tick cost." },
  heavy_paw:   { id: "heavy_paw",   name: "Heavy Paw",   mpCost: 6,  power: 2.4, element: "claw",
    target: "one", kind: "damage", tickCost: 1.5,
    description: "Big hit, big wind-up." },
};

// ---- Party archetype loadouts ----
// One per existing cat id from data.ts; bench cats not used (3 active only).
export interface PartyTemplate {
  catId: string;          // matches cats[].id
  element: Element;
  weak: Element[]; resist: Element[];
  mp: number;
  od: OverdriveDef;
  skills: string[];       // SKILLS keys
}

export const PARTY_TEMPLATES: Record<string, PartyTemplate> = {
  scrapper:   { catId: "scrapper",   element: "claw",  weak: ["fire"],  resist: ["claw"],
    mp: 40, od: OVERDRIVES.alley_swarm,    skills: ["quick_swipe", "heavy_paw"] },
  sneakpaw:   { catId: "sneakpaw",   element: "ice",   weak: ["fire"],  resist: ["ice"],
    mp: 60, od: OVERDRIVES.hairball_cannon, skills: ["ice_lance", "quick_swipe"] },
  moldmancer: { catId: "moldmancer", element: "stink", weak: ["shock"], resist: ["stink"],
    mp: 90, od: OVERDRIVES.alley_swarm,    skills: ["spore_cloud", "field_heal"] },
  tinknight:  { catId: "tinknight",  element: "claw",  weak: ["shock"], resist: ["claw","ice"],
    mp: 30, od: OVERDRIVES.nine_lives,     skills: ["heavy_paw", "field_heal"] },
  greasefang: { catId: "greasefang", element: "fire",  weak: ["ice"],   resist: ["fire"],
    mp: 50, od: OVERDRIVES.hairball_cannon, skills: ["fire_claw", "static_hiss"] },
};

// ---- Enemy templates for raids ----
export interface RaidEnemyTpl {
  id: string;
  name: string;
  emoji: string;
  hp: number; atk: number; def: number; spd: number;
  mp?: number;
  element: Element;
  weak: Element[]; resist: Element[]; nullEl?: Element[];
  skills?: string[];        // optional skill ids the enemy can use
  odPower?: number;         // optional boss-tier overdrive multiplier
}

export const RAID_ENEMIES: Record<string, RaidEnemyTpl> = {
  pigeon_lord:    { id: "pigeon_lord",    name: "Pigeon Lord",     emoji: "🕊️", hp: 220, atk: 22, def: 10, spd: 12,
    element: "shock", weak: ["fire"], resist: ["shock"], skills: ["static_hiss"] },
  vent_wisp:      { id: "vent_wisp",      name: "Vent Wisp",       emoji: "💨", hp: 160, atk: 20, def: 6,  spd: 18,
    element: "stink", weak: ["fire"], resist: ["stink"] },
  tunnel_ghoul:   { id: "tunnel_ghoul",   name: "Tunnel Ghoul",    emoji: "👻", hp: 240, atk: 24, def: 12, spd: 8,
    element: "stink", weak: ["fire","ice"], resist: ["stink"], nullEl: ["claw"] },
  subway_rat_king:{ id: "subway_rat_king",name: "Subway Rat King", emoji: "🐀", hp: 380, atk: 26, def: 14, spd: 10,
    element: "stink", weak: ["fire"], resist: ["stink","claw"], skills: ["spore_cloud","heavy_paw"], odPower: 3.0 },
  graffiti_wraith:{ id: "graffiti_wraith",name: "Graffiti Wraith", emoji: "🎨", hp: 320, atk: 24, def: 10, spd: 14,
    element: "shock", weak: ["claw"], resist: ["shock","ice"], skills: ["static_hiss"], odPower: 2.6 },
  mall_wraith:    { id: "mall_wraith",    name: "Mall Wraith",     emoji: "🛍️", hp: 360, atk: 25, def: 12, spd: 12,
    element: "ice",   weak: ["fire"], resist: ["ice","stink"],   skills: ["ice_lance","heavy_paw"], odPower: 2.8 },
  condo_hound:    { id: "condo_hound",    name: "Condo Hound",     emoji: "🐩", hp: 280, atk: 26, def: 14, spd: 13,
    element: "claw",  weak: ["stink"], resist: ["claw"], skills: ["heavy_paw"] },
  luxury_tyrant:  { id: "luxury_tyrant",  name: "Luxury Tyrant",   emoji: "👑", hp: 460, atk: 30, def: 16, spd: 12,
    element: "fire",  weak: ["ice","stink"], resist: ["fire","claw"], skills: ["fire_claw","heavy_paw","field_heal"], odPower: 3.2 },
  haunted_lord:   { id: "haunted_lord",   name: "Haunted Lord",    emoji: "🕯️", hp: 420, atk: 28, def: 14, spd: 11,
    element: "stink", weak: ["fire","shock"], resist: ["stink","ice"], skills: ["spore_cloud","static_hiss"], odPower: 3.0 },
  rat_pack:       { id: "rat_pack",       name: "Rat Pack",        emoji: "🐭", hp: 90,  atk: 14, def: 4,  spd: 16,
    element: "claw",  weak: ["fire"], resist: [] },
  mold_goblin:    { id: "mold_goblin",    name: "Mold Goblin",     emoji: "👹", hp: 140, atk: 17, def: 8,  spd: 10,
    element: "stink", weak: ["fire"], resist: ["stink"] },
  trash_bag:      { id: "trash_bag",      name: "Sentient Trash Bag", emoji: "🗑️", hp: 200, atk: 19, def: 12, spd: 6,
    element: "stink", weak: ["claw"], resist: ["stink"] },
};

// ---- Raid (dungeon) definitions ----
export interface RaidRoom {
  enemyIds: string[];       // 1-3 enemies per room
  flavor: string;
}

export interface RaidDef {
  id: string;
  name: string;
  subtitle: string;
  difficulty: number;       // 1-5
  image?: string;           // optional bg
  rooms: RaidRoom[];        // last room is boss
  rewards: { spheres: number; bones: number; caps: number };
}

import dSubway  from "@/assets/dumpster-subway.jpg";
import dMall    from "@/assets/dumpster-mall.jpg";
import dLuxury  from "@/assets/dumpster-luxury.jpg";
import dHaunted from "@/assets/dumpster-haunted.jpg";

export const RAIDS: RaidDef[] = [
  {
    id: "subway_king", name: "Subway King's Court", subtitle: "Tunnel rats rule the deep.",
    difficulty: 2, image: dSubway,
    rooms: [
      { enemyIds: ["rat_pack", "rat_pack"],       flavor: "Skittering in the dark." },
      { enemyIds: ["tunnel_ghoul"],               flavor: "A pale shape hisses from a vent." },
      { enemyIds: ["graffiti_wraith", "rat_pack"],flavor: "Spray-paint fumes thicken the air." },
      { enemyIds: ["subway_rat_king"],            flavor: "The throne of garbage looms ahead." },
    ],
    rewards: { spheres: 5, bones: 600, caps: 30 },
  },
  {
    id: "mall_wraith", name: "Mall Food-Court Haunt", subtitle: "Closing time… forever.",
    difficulty: 3, image: dMall,
    rooms: [
      { enemyIds: ["mold_goblin","trash_bag"],    flavor: "Sticky tiles. Flickering lights." },
      { enemyIds: ["vent_wisp","vent_wisp"],      flavor: "Cold air moans through HVAC." },
      { enemyIds: ["mall_wraith"],                flavor: "She's still trying to ring you up." },
    ],
    rewards: { spheres: 6, bones: 800, caps: 40 },
  },
  {
    id: "haunted_den", name: "Haunted Recycling Den", subtitle: "Bottles whisper your name.",
    difficulty: 4, image: dHaunted,
    rooms: [
      { enemyIds: ["mold_goblin","mold_goblin"],  flavor: "Mold drips from the ceiling." },
      { enemyIds: ["vent_wisp","trash_bag"],      flavor: "Plastic rustles on its own." },
      { enemyIds: ["tunnel_ghoul","mold_goblin"], flavor: "A choir of dead recyclables." },
      { enemyIds: ["haunted_lord"],               flavor: "The Lord of Litter rises." },
    ],
    rewards: { spheres: 8, bones: 1100, caps: 55 },
  },
  {
    id: "luxury_tyrant", name: "Luxury Condo Tyrant", subtitle: "Top-floor garbage tastes the same.",
    difficulty: 5, image: dLuxury,
    rooms: [
      { enemyIds: ["condo_hound","condo_hound"],  flavor: "Imported kibble breath." },
      { enemyIds: ["pigeon_lord"],                flavor: "He owns the balconies." },
      { enemyIds: ["graffiti_wraith","mall_wraith"], flavor: "The lobby's haunted now." },
      { enemyIds: ["condo_hound","tunnel_ghoul"], flavor: "Hired security and free hauntings." },
      { enemyIds: ["luxury_tyrant"],              flavor: "He owns the building. You owe rent in blood." },
    ],
    rewards: { spheres: 12, bones: 1800, caps: 90 },
  },
];
