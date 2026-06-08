
# Post-Story Raid Mode (FFX-Inspired)

Solo dives stay exactly as they are. A new **Raids** tab unlocks the moment the campaign's final chapter is marked complete. Raids run on a different combat engine and use a separate progression layer (sphere grid + gear) layered on top of existing cats.

## What unlocks and where

- New route `src/routes/raids.tsx` — hidden in `AppShell` nav until `completedChapters` contains the last chapter id.
- New route `src/routes/raid.$dungeonId.tsx` — the actual fight screen.
- New route `src/routes/grid.$catId.tsx` — sphere grid screen.
- Story screen gets a "Raids Unlocked" callout once the campaign is done.

## Combat model (CTB)

- Turn queue: every actor has a `speed` stat. Time-to-next-turn = `baseTick / speed`. The queue is recomputed on every action and shown as a vertical strip on the right of the battle screen (portraits + tick numbers, FFX-style).
- Haste / slow / wait-actions modify the actor's next tick (e.g. heavy attack adds +30% tick cost, sets the actor further back in the queue).
- 3 active cats vs. 1–4 enemies. No bench swapping (per your choice).
- Action menu per cat: **Attack, Skill ▸, Item, Defend, Overdrive (when full), Flee**.
- Skills cost MP, can target single/all, can carry an element.

## Elements & weaknesses

- 5 elements: `claw` (physical), `fire`, `ice`, `shock`, `stink` (the cat-flavoured "poison/dark").
- Each enemy has `weak`, `resist`, `null` arrays. Hitting weakness = ×1.5 damage + advances that actor's next turn (FFX-style speed-up). Resist = ×0.5. Null = 0.
- UI: weakness icons revealed after first hit of that type (Scan mechanic via Snack item later — for v1 always reveal after first hit).

## Overdrives

- Each cat has an `overdrive` meter 0–100. Fills from damage taken (+dmg%) and damage dealt (+half).
- Three flavours mapped to life stage / personality (data-driven):
  - **Hairball Cannon** (offense, single target, big number + screen shake)
  - **Nine Lives** (support, full party heal + cleanse)
  - **Alley Swarm** (aoe, 5 quick hits with stray-cat silhouettes)
- Triggered from the action menu when meter full, consumes meter, plays a 1.5–2s framer-motion animation (no new assets required — reuse cat portraits + tween effects, colored flashes, scaled SVG slashes).

## Sphere Grid (per cat)

- Hex / square grid of ~40 nodes per cat: `+HP`, `+ATK`, `+SPD`, `+MP`, skill unlocks, element affinity unlocks.
- Earn `spheres` (new resource) from raid completion. Spend on the active cat in `grid.$catId`.
- Implemented as a JSON layout per cat archetype; render with SVG, pan/zoom optional v2.
- Saved in `cat.grid: { unlocked: string[] }` on the cat record.

## Gear

- 3 slots: **Collar** (weapon-ish, sets base ATK & element), **Charm** (defensive/utility), **Trinket** (overdrive/speed mods).
- Each item has 1–3 affixes (e.g. `+10% fire dmg`, `+5 spd`, `start battle with +25% OD`).
- Dropped by raid bosses + crafted at hideout (reuse fishbones/caps).
- New inventory section under existing `/inventory`.

## Raids (dungeons with teams)

- 4 raids at launch, themed off existing dumpster art (Subway King, Mall Wraith, Luxury Tyrant, Haunted Den).
- Each raid = 4 rooms + boss; encounters use CTB combat.
- Reward table: spheres, gear drops, fishbones, story flavor unlock.
- Difficulty scales with team's combined grid progress.

## State changes (`src/lib/game/store.ts`)

- Add `raid: RaidState | null`, `spheres: number`, per-cat `grid` and `equipment`.
- Existing `dive` flow untouched.
- New actions: `startRaid`, `raidAction`, `swapTarget`, `spendSphere`, `equipGear`.

## File-level plan

```text
src/lib/game/
  raidTypes.ts          # CTB types, elements, overdrive defs
  raidData.ts           # 4 raid definitions, enemy stats, drop tables
  raidEngine.ts         # turn queue, damage calc, status effects (pure fns)
  gridData.ts           # per-archetype sphere grid layouts
  gearData.ts           # affix pool, gear templates
  store.ts              # extend with raid/grid/gear state + actions

src/components/game/raid/
  RaidStage.tsx         # battle scene (party left, enemies right)
  TurnQueue.tsx         # vertical CTB portrait list
  ActorCard.tsx         # HP/MP/OD bars, status icons
  RaidActionBar.tsx     # Attack/Skill/Item/Defend/OD/Flee
  SkillMenu.tsx
  OverdriveOverlay.tsx  # framer-motion cinematic
  DamageNumber.tsx      # floating damage popups
  ElementIcon.tsx

src/components/game/grid/
  SphereGrid.tsx        # SVG grid, click-to-unlock
  GridNode.tsx

src/components/game/gear/
  GearSlot.tsx
  GearTooltip.tsx

src/routes/
  raids.tsx             # raid select list (locked until campaign done)
  raid.$dungeonId.tsx   # active raid
  grid.$catId.tsx       # sphere grid for one cat
```

## Animations

- `framer-motion` only (already in stack). No new sprite art required for v1.
- Per attack: actor scale-bump + slide toward target + impact flash + damage number float.
- Element hits tint the impact (fire = orange burst, ice = cyan shards via CSS clip-paths, etc).
- Overdrives: full-screen radial gradient sweep + character zoom + 3–5 staged hits, ~1.8s total. Skippable.
- Turn-queue reshuffle animates portraits sliding to new positions (layout animation).

## Out of scope (v1)

- Party swap mid-battle (you chose 3 active only).
- Pan/zoom on sphere grid (static layout fits in viewport).
- Crafting UI for gear (drops only in v1; crafting can come later).
- Multiplayer / co-op raids.

## Rollout order

1. Types + engine + store wiring (no UI).
2. Raid screen + CTB queue + basic Attack/Defend/Flee.
3. Skills, elements, items.
4. Overdrives + animations.
5. Sphere grid screen.
6. Gear slots + drops.
7. Polish: damage numbers, screen shake, sound stub.

This is a sizable build (~10–14 new files, ~1500 LOC). I'll implement in the order above so you can play-test after each milestone.
