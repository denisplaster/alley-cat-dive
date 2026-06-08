
# Raid Mode → Phaser 3 Rebuild

Replace the React/framer-motion raid stage with a real game canvas. Battles, room transitions, encounter intros, and victory screens all render inside Phaser. React keeps the shell (team picker, sphere grid, menus).

## 1. Engine setup

- `bun add phaser` (Phaser 3.80+).
- New file `src/game/phaser/RaidGame.ts` — boots a single `Phaser.Game` instance with `Scale.FIT`, `parent` = a div ref, transparent background false (we draw our own).
- React wrapper `src/components/game/raid/PhaserCanvas.tsx`:
  - Mounts the game on `useEffect`, destroys on unmount.
  - Bridges Zustand ↔ Phaser via a typed `EventBus` (`phaser.events`): React subscribes to `damage`, `turn`, `roomCleared`, `raidEnded`; Phaser listens for `command` (basic/skill/od/target/advance/claim).
  - No re-renders driven by combat state — Phaser owns the frame loop.

## 2. Scenes

Files in `src/game/phaser/scenes/`:

- `BootScene` — load shared atlases/fonts, then `RaidScene`.
- `RaidScene` — main combat scene. Owns:
  - Painted background image (current `def.image`) drawn full-bleed.
  - 3 party actors on left, up to 3 enemies on right, positioned with depth sort.
  - CTB turn queue HUD along top.
  - HP/MP/OD bars under each actor (Phaser `Graphics`).
  - Action menu rendered as Phaser DOM (`scene.add.dom`) reusing existing `RaidActionBar` markup, OR a native Phaser menu (decision: native — keeps everything in one render layer).
  - Tweens for: actor lunge on attack, hit recoil, KO fall, damage number float, screen shake (`cameras.main.shake`), white flash on crit, color tint flash on element weakness, OD overlay (radial burst sprite + name banner).
  - Particle emitters: claw slashes, fire burst, ice shards, shock arcs, stink cloud — one emitter per element, configured in `src/game/phaser/fx.ts`.
- `RoomTransitionScene` — between rooms: camera pan + parallax scroll on background to the next room's image with a "ROOM 2/3" banner.
- `EncounterScene` — short zoom-in on enemy line with name label slide, then hand off to `RaidScene`.
- `VictoryScene` — actors pose (idle bob amplified), rewards count up (spheres/bones/caps), then emits `claim` event.
- `DefeatScene` — desaturate, "DEFEATED" banner, retry/leave buttons.

Scene flow: `Boot → Encounter → Raid → (RoomTransition → Encounter → Raid)* → Victory|Defeat`.

## 3. Art pipeline (mixed style)

- **Backgrounds**: keep current painted dungeon images (`def.image`). Generate one painted image per *room* (so transitions feel new) — 3 per dungeon × 4 dungeons = 12 backgrounds. Use existing `imagegen` premium tier, 1536×864.
- **Actors → pixel sprites**: regenerate every cat and every enemy as a pixel sprite sheet (idle 4f, attack 4f, cast 4f, hit 2f, ko 1f). Style prompt: "16-bit JRPG sprite, Octopath Traveler HD-2D, clean pixel art on transparent background, front-facing, 4-frame idle". 5 cats + 12 enemies = 17 sprite sheets.
  - Generate each as a single PNG with frames in a row; pack into Phaser atlases at load.
- **VFX**: tiny pixel particle textures (claw slash, spark, flame, ice shard, lightning, stink puff) — 6 small PNGs.

This is a LOT of asset generation. To stay tractable, **phase 1** will generate the 5 cat sprite sheets, regenerate 4 boss enemies with full frames, and use single-frame static sprites for the remaining 8 enemies (still pixel art, just no animation frames yet). Phase 2 (follow-up) fills out the rest.

## 4. Game logic — keep the engine

`raidEngine.ts`, `raidTypes.ts`, `raidData.ts`, and the Zustand `raid` slice stay the source of truth for combat math, CTB, statuses, rewards, sphere grid. Phaser is a *view* over that state.

Flow:
1. React calls `startRaid(dungeonId)` → Zustand builds `RaidState`.
2. `PhaserCanvas` mounts, `RaidScene` reads initial state from store, draws actors.
3. When it's a party member's turn, scene shows action menu, emits `command`.
4. React handler calls the existing `raidBasicAttack` / `raidUseSkill` / `raidOverdrive` store actions.
5. Store mutation produces `floats`, `flash`, log entries, queue changes; store emits a `combatTick` event (new) on each mutation.
6. Scene consumes the tick, plays the appropriate tween/particle, then advances.

This keeps all rules in TypeScript and lets Phaser focus on presentation.

## 5. Routes & files

- Replace body of `src/routes/raid.$dungeonId.tsx` with `<PhaserCanvas dungeonId=... />`. Keep header.
- Old React components (`RaidStage`, `ActorCard`, `TurnQueue`, `OverdriveOverlay`, `RaidActionBar`, `DamageNumbers`, `ElementIcon`) — retire `RaidStage`, `ActorCard`, `TurnQueue`, `OverdriveOverlay`, `DamageNumbers`. Keep `ElementIcon` (still used by `raids.tsx` list) and `RaidActionBar` (could reuse on mobile if Phaser DOM menus prove cramped — decide during build).
- Sphere grid (`grid.$catId.tsx`) and raid list (`raids.tsx`) untouched.

## 6. Store additions

- New `combatTick` event channel: a small `mitt`-style emitter exported from `store.ts` so Phaser subscribes without re-rendering React. Each existing action (`raidBasicAttack`, etc.) emits `{ kind: 'attack' | 'skill' | 'od' | 'enemyTurn', actorUid, targetUid, damage, element, crit, weak }` after mutating state.
- Cap `floats` already exists; keep.

## 7. Implementation order

1. Install Phaser, scaffold `RaidGame.ts` + `PhaserCanvas.tsx` rendering a single test sprite over the current background.
2. Wire `EventBus` + `combatTick` from store.
3. Generate Phase 1 sprite assets (5 cats + 4 boss enemies animated, 8 enemies static, 6 VFX particles, 12 room backgrounds).
4. Build `RaidScene` (actors, bars, queue HUD, menu, tweens, particles).
5. Add `EncounterScene`, `RoomTransitionScene`, `VictoryScene`, `DefeatScene`.
6. Swap route body; remove retired components.
7. QA: full raid playthrough in preview, check bars/queue/damage/element FX, mobile viewport.

## Risks & notes

- Asset gen volume: ~30 image generations. Will batch in parallel where possible. Phase 1 keeps it to ~20.
- Bundle size: Phaser is ~1MB gz; acceptable for a game route. Lazy-load `PhaserCanvas` with dynamic import so it only loads on `/raid/$dungeonId`.
- Mobile: Phaser canvas scales via `Scale.FIT`; touch input works for menu buttons drawn in-scene.
- SSR: Phaser is client-only — `PhaserCanvas` guards with `if (typeof window === 'undefined') return null` and uses `useEffect` for boot. The route loader does not import Phaser.

Ready to start with step 1 on approval.
