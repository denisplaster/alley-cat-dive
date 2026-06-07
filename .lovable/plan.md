## Alley Cat Dumpster Divers — UI Prototype Plan

A polished, game-HUD style React prototype using the Arcade Neon Grime direction (chunky panels with hard black borders + 6px offset shadows, Anton + JetBrains Mono, neon green/magenta/yellow on near-black, CRT scanline overlay, flicker/float/pulse-glow animations).

### Design tokens (src/styles.css)
- Background `#09090b`, foreground `#f8fafc`, primary neon green `#4ade80`, secondary magenta `#d946ef`, accent yellow `#fde047`, plus rarity colors (common/uncommon/rare/epic/legendary/mythic).
- Anton (display) + JetBrains Mono (body) loaded via `<link>` in `__root.tsx`.
- Utilities: `chunky-panel`, `chunky-button`, `crt-overlay`, `flicker`, `float`, `pulse-glow` keyframes.

### Routes (TanStack file-based)
- `/` → Alley Hub (landing)
- `/map` → Dumpster Map
- `/dive` → Dumpster Dive Screen (active run)
- `/loot` → Loot Reward Screen (post-dive)
- `/crew` → Cat Crew
- `/inventory` → Inventory
- `/hideout` → Hideout Upgrades
- `/shop` → Raccoon Shop

Each route gets unique `head()` meta.

### Shared components (`src/components/game/`)
- `AppShell` — persistent CRT overlay, vignette, top HUD (level/XP/currencies), bottom nav dock with chunky buttons, alley background.
- `CurrencyBar`, `GameNav`, `ChunkyButton`, `ChunkyPanel`, `RarityBadge`.
- Screen-specific: `DumpsterCard`, `DiveScreen`, `CombatLog`, `LootReveal`, `CatCard`, `ItemCard`, `InventoryGrid`, `HideoutUpgradePanel`, `RaccoonShop`.

### Mock data (`src/lib/game/`)
- `dumpsters.ts`, `cats.ts`, `enemies.ts`, `loot.ts`, `upgrades.ts`, `shop.ts` — typed arrays.
- `gameStore.ts` — Zustand store holding: currencies, level/xp, cats (with status/recovery), inventory, equipped items, hideout levels, selected dumpster, active dive state (depth, HP, enemy, timer, combat log, collected loot), unlocked dumpsters.

### Interactions
- Hub: shows hero cat, currencies, "next target" teaser, Start Dive routes to /map.
- Map: dumpster grid, click to select (updates panel), Start dive routes to /dive.
- Dive: dive timer countdown, enemy/cat HP bars, Scratch/Pounce/Item/Flee/Auto buttons mutate combat log + HP; on enemy KO advance room; on cat KO or flee → /loot with partial rewards; on full clear → /loot with full.
- Loot: animated reveal cards by rarity, "Take All" adds to inventory store and bumps currencies.
- Inventory: grid with rarity borders, filter tabs (Weapons/Armor/Relics/Food/Junk/Crafting), equip/sell buttons.
- Crew: cat cards with stats + status; cat selection sets active diver; injured cats show recovery countdown.
- Hideout: upgrade cards with cost/benefit, button disabled if insufficient currency.
- Shop: raccoon merchant header, item rows with buy buttons (deducts currency, adds to inventory).

### Imagery
- Hero cat portrait, alley background, 6 dumpster thumbnails, 5 cat portraits, raccoon merchant — generated via imagegen and saved to `src/assets/`. Use `fast` model except hero cat (`standard`).

### Tech notes
- Single AppShell wraps all game routes via `__root.tsx` (with Outlet).
- Game state in a Zustand store kept in memory only (no backend).
- All combat/dive logic in `src/lib/game/engine.ts` — easy to port later.
- Desktop-first, responsive via Tailwind breakpoints; bottom nav collapses on mobile.

### Out of scope (V1)
- Persistence, auth, multiplayer, real combat balancing, sound.
