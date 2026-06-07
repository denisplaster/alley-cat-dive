
## Dive Screen Overhaul — Alley Cat Dumpster Divers

Scope: only `/dive` and its supporting components/state. Hub, map, loot, crew, inventory, hideout, shop untouched. Keep neon-grime arcade identity (black panels, toxic green, magenta/yellow accents, Anton + JetBrains Mono).

### New file layout

```
src/components/game/dive/
  DungeonStage.tsx       # scene background + props + cat/enemy sprites
  RunHeader.tsx          # dumpster name, difficulty, rec power, loot tier, room x/y
  RoomPath.tsx           # icon-based room path (enemy/loot/hazard/rest/mini-boss/boss)
  TruckTimer.tsx         # 4-state dramatic timer
  Combatant.tsx          # cat / enemy panel w/ HP, flash, shake, defeat fx
  FloatingNumbers.tsx    # damage / heal / crit popups
  ActionBar.tsx          # context-aware actions
  CombatLog.tsx          # color-coded scrollable log
  RunPile.tsx            # bones, caps, item mini-cards w/ rarity
  RoomClearBanner.tsx    # "ROOM CLEARED" celebration
  LootToast.tsx          # transient loot-gained pop
```

`src/routes/dive.tsx` becomes a thin composition of the above + the existing `useGame` store.

### Store additions (`src/lib/game/store.ts`, `types.ts`)

Add per-run structure without breaking existing fields:

- `RoomKind = "enemy" | "loot" | "hazard" | "rest" | "miniboss" | "boss"`
- `DiveState.rooms: { kind: RoomKind; cleared: boolean }[]` — generated at `startDive` from the dumpster (last room = boss, second-to-last chance of miniboss, sprinkle 1 loot + 1 hazard/rest).
- `DiveState.bonesFound`, `capsFound` — accumulated mid-run; awarded on `collectRewards`.
- `DiveState.fx` (transient, not persisted across renders): `{ id, kind: "dmg"|"crit"|"heal"|"miss", target: "cat"|"enemy", amount }[]` plus a `shakeKey` and `flashKey` bumped on hits. A `clearFx(id)` action lets popups self-remove after animation.
- `roomCleared: boolean` — true between enemy KO and "Go Deeper". `goDeeper()` advances to the next room and spawns the next enemy / triggers hazard / opens loot room.
- Room-kind handling in `doAction`:
  - enemy/miniboss/boss: current combat path (boss = higher HP, magenta tint, "BOSS" tag).
  - loot: skip combat; auto-drop 1–2 items, `goDeeper` enabled immediately.
  - hazard: small HP tick on entry, log entry, `goDeeper` enabled.
  - rest: +HP on entry, log entry, `goDeeper` enabled.

Engine logic stays in the store so it remains easy to port. No backend.

### Dungeon scene (`DungeonStage`)

Replace the alley-bg feel with an interior:
- Layered CSS: dark vignette + radial toxic-green light from above (`bg-[radial-gradient(...)]`), subtle scanlines kept from existing `crt-overlay`.
- Background props as absolutely-positioned emoji/SVG with `floaty`/drift animations: 🍕 boxes, 🦴 bones, 🥫 cans, 🪰 flies (looping translate), slime drips (CSS gradient strips), torn cardboard edges via `clip-path`.
- Foreground "floor" line with neon green glow under the combatants so the cat/enemy read as standing inside the dumpster.
- Scene tint shifts by current room kind (boss = magenta wash, hazard = sickly yellow, rest = cool blue-green).

### Combatant presentation

- Larger portrait (~96–128px) with chunky black border and pulse-glow on low HP (<30%).
- Hit flash: bump `flashKey` → component applies a 120ms red/white overlay via key-based remount of a `<div className="animate-flash" />`.
- Screen shake: `DungeonStage` listens to `shakeKey`, applies `animate-shake` (new keyframes) on the scene wrapper for ~200ms; stronger amplitude on crits/boss hits.
- Enemy defeat: scale-down + fade + green particle burst (CSS-only, 6 spans with `animate-burst`).
- HP bars segmented (10 ticks) for readability; numeric `hp/max` underneath.

### Floating damage numbers

`FloatingNumbers` reads `dive.fx`, renders each as an absolutely-positioned span anchored to the target portrait. Animation: rise + fade over 700ms; crits in larger Anton w/ accent yellow + slight wobble; heals in primary green with `+`; misses in muted.

### Room path

Horizontal strip above the stage:
- One pill per room, ~44px square, chunky-panel styling.
- Icon per kind: ⚔️ enemy, 💰 loot, ☣️ hazard, 💤 rest, 👹 miniboss, 👑 boss.
- Cleared rooms: muted + checkmark overlay. Current: pulsing neon-green border + scale 1.1. Future: dimmed with `?` for unknown kinds beyond next (reveal next room's kind, hide kinds 2+ ahead).
- Connecting line between pills, fills in green as rooms clear.

### Run header

Single chunky-panel strip at top: `[Dumpster Name]  •  DIFF ★★★☆☆  •  LOOT: EPIC  •  REC ⚡110  •  ROOM 2/5  •  truck-timer-mini`. Pulls all from selected dumpster + `dive`. Difficulty stars colored by tier.

### Trash truck timer

`TruckTimer` derives state from `dive.timerSec / dive.dumpster.truckTimerSec`:
- >60% → Safe (muted, "🚛 distant rumble")
- 30–60% → Inbound (yellow, slow pulse)
- 10–30% → Nearby (orange, faster pulse, slight tilt)
- <10% → Pickup imminent (red, hard flicker via existing `flicker` keyframe, occasional shake on scene)

Bar uses gradient that recolors per state. Sub-label changes copy. At <10%, a thin red border flashes around the whole DungeonStage.

### Action bar (context-aware)

`ActionBar` reads `roomCleared`, `enemy`, `roomKind`, `catHp/maxHp`:
- Combat (enemy alive): Scratch (primary, large), Pounce (secondary, "CRIT chance"), Use Item, Flee. Auto Dive toggle as a smaller chip.
- Room cleared: hide combat buttons; primary becomes a big pulsing **GO DEEPER ▶** (or **CLAIM RUN 🏆** on last room cleared).
- Loot room: primary **GRAB LOOT**, secondary skip.
- Rest room: primary **NAP (+HP)**, secondary skip.
- Hazard room: primary **PUSH THROUGH**, optional **USE ITEM** if HP <50%.
- Low HP (<30%): Use Item highlighted with pulse-glow and "HEAL" label hint.
- All buttons keep `chunky-button` look; pulse glow on the currently-recommended action.

### Combat log

Same data, better styling:
- Icons per tone (⚔️ player, 💢 enemy, ✨ crit, 💰 loot, 🛡️ status, ⏱️ timer).
- Latest entry at top with a subtle fade-in highlight (key-based).
- Max-height scroll preserved.

### Run pile

`RunPile` panel shows:
- 🦴 fishbones running total, 🧴 caps running total (large numbers, Anton).
- Items grid (up to 8 mini-cards, rarity border + glow from existing `rarityClass`/`rarityGlow`, name + rarity tag, +N badge if overflow).
- Empty state copy: "Nothing yet. Smack something."

### Loot toast + room-clear banner

- `LootToast`: fixed bottom-right, slides in on new item, auto-dismisses 2.2s, rarity-colored glow.
- `RoomClearBanner`: full-width chunky overlay across the stage when `roomCleared`, big "ROOM CLEARED" in Anton, small line "Bones +X · Caps +Y · Item: <name>". Dismisses on Go Deeper.

### Animations / tokens (`src/styles.css`)

Add (kept minimal, all token-driven):
- `@keyframes shake` (translate jitter), `animate-shake`.
- `@keyframes flash` (white→transparent), `animate-flash`.
- `@keyframes burst` (scale + opacity for defeat particles).
- `@keyframes rise-fade` for floating numbers.
- `@keyframes banner-slam` for room-clear banner.
- New utility tokens for truck states: `--color-truck-safe/inbound/nearby/imminent` (re-using existing palette).

No changes to color identity or font stack.

### Out of scope

- Hub / map / loot / crew / inventory / hideout / shop screens.
- Real audio (sound effects mentioned in original spec stay deferred).
- Persistence / backend.
- Balancing pass beyond what the new room kinds require.

### Verification

- Manual click-through: start dive from `/map` → confirm rooms render with mixed kinds, combat triggers fx, room-clear banner appears, Go Deeper advances, last room awards full loot, flee/KO still routes to `/loot`.
- Truck timer reaches each of the 4 states across a fast forward (temporarily lower `truckTimerSec` if needed, then revert).
- No console errors; build passes.
