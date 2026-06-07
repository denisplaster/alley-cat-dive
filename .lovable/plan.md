# Story Mode + Living Hideout

Turn the game into a narrative arc: a kitten abandoned in an alley grows into a legendary dumpster diver. Story is told in manga-style chapters between dives. The hideout becomes a real, illustrated room that physically evolves (tin can → cardboard box → crate fort → alley throne room) and lets the player place trophies and stash inside.

## Story Arc (5 chapters)

1. **Abandoned** — Rainy alley. Kitten finds a tin can. Tutorial dive: one rat.
2. **First Scraps** — Meets Scrapper. Cardboard box hideout. Choice: share food (Kind path) or hoard (Cunning path).
3. **The Alley Pact** — Forms the crew. Crate fort hideout. Choice: ally with raccoons or fight them.
4. **King of the Bins** — Defeats a miniboss. Pallet throne hideout. Choice: mercy or dominance.
5. **Hero of the Trash** — Boss dive (Luxury Condo). Final hideout: full alley throne room.

Each chapter = 1 cutscene before + 1-2 dives + 1 cutscene after + 1 choice. Choices affect later flavor text, a stat buff, and which hideout decor unlocks.

## Cutscene Format

Manga-panel cutscene component: 2-4 panels with a background image, a character pose, and a speech bubble (reusing the bubble system we just shipped). Player taps to advance panels. Final panel of "choice" cutscenes shows 2 buttons.

## Hideout Evolution

Replace the current upgrades grid with a **room view**: an illustrated interior that swaps as the story progresses. Stages: `tin_can` → `cardboard_box` → `crate_fort` → `pallet_throne` → `alley_palace`.

Inside the room, **placement slots** (3-6 spots depending on stage): floor, wall, shelf, corner. Player drags trophies/stash items from inventory into slots. Each placed item shows as a small icon overlay on the room image with a tooltip.

The existing upgrades (gym, pantry, etc.) move to a secondary "Build" tab on the same page so we don't lose them.

## Technical Plan

**New files**
- `src/lib/game/story.ts` — chapter definitions, panel scripts, choice effects, `STORY_CHAPTERS` array.
- `src/components/game/story/Cutscene.tsx` — full-screen manga panel player with bubble + advance/choice UI.
- `src/components/game/hideout/HideoutRoom.tsx` — illustrated room with placement slots.
- `src/components/game/hideout/PlacedItem.tsx` — draggable item icon.
- `src/routes/story.tsx` — chapter list / replay screen.
- 5 hideout-stage images in `src/assets/` (tin_can, cardboard_box, crate_fort, pallet_throne, alley_palace) — generated via imagegen.
- ~6-8 cutscene background images (alley_rain, dumpster_first, raccoon_standoff, crew_pact, throne_moment, hero_dawn).

**Edits**
- `src/lib/game/store.ts` — add `story: { chapter, panel, choices: Record<string,string>, completedChapters: string[] }`, `hideoutStage`, `placedItems: Record<slotId, itemId>`. Add `advanceStory()`, `makeChoice(id)`, `placeItem(slot,itemId)`, `unplaceItem(slot)`. Trigger cutscene after each dive completion if chapter milestone met.
- `src/routes/hideout.tsx` — render `HideoutRoom` on top, existing upgrades grid below in a "Build" tab.
- `src/routes/index.tsx` — add "Continue Story" CTA showing current chapter.
- `src/routes/__root.tsx` — mount `<Cutscene/>` overlay when `story.activeCutscene` is set.
- `src/components/game/AppShell.tsx` — add Story nav link.

**Persistence** — extend the existing zustand persist slice to include story + hideout state.

## Scope / Order of Implementation

This plan is the scaffold + Chapter 1 fully playable, with chapters 2-5 stubbed with placeholder text/images you can flesh out turn-by-turn. That keeps the first PR reviewable.

1. Store + types + persistence
2. Cutscene component + 1 generated alley_rain background
3. Chapter 1 script + trigger on first dive completion
4. Hideout room view + tin_can image + 3 placement slots
5. Story route + nav link
6. Stub chapters 2-5 with titles and "Coming soon" panels

After you approve, I'll ask which art style you want for the cutscene backgrounds (gritty noir manga vs colorful shonen vs watercolor) before generating images.