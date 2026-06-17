import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ORBIT_CHAPTERS, ORBIT_SECTORS, ORBIT_LOOT, orbitProgressPct, type OrbitLoot } from "./data";

export type EditionId = "alley" | "orbit";

interface OrbitState {
  activeEdition: EditionId;
  /** Transient (not persisted): is the full-screen edition overlay open. */
  isOpen: boolean;
  chapterIdx: number;            // index of next chapter to play
  completedChapters: string[];
  clearedSectors: string[];
  defeatedBosses: string[];
  stash: OrbitLoot[];
  setEdition: (e: EditionId) => void;
  /** Make Orbit the active edition and open its full-screen overlay. */
  openEdition: () => void;
  /** Close the edition overlay (back to the hub). */
  closeEdition: () => void;
  playChapter: (id: string) => void;
  clearSector: (id: string, lootRolls?: number) => void;
  reset: () => void;
  /** computed helpers */
  isChapterUnlocked: (idx: number) => boolean;
  isSectorUnlocked: (id: string) => boolean;
  progressPct: () => number;
}

function rollLoot(rolls: number): OrbitLoot[] {
  const out: OrbitLoot[] = [];
  for (let i = 0; i < rolls; i++) {
    const r = Math.random();
    const tier =
      r < 0.5 ? "common" :
      r < 0.78 ? "uncommon" :
      r < 0.92 ? "rare" :
      r < 0.98 ? "epic" : "legendary";
    const pool = ORBIT_LOOT.filter(l => l.rarity === tier);
    out.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return out;
}

export const useOrbit = create<OrbitState>()(
  persist(
    (set, get) => ({
      activeEdition: "alley",
      isOpen: false,
      chapterIdx: 0,
      completedChapters: [],
      clearedSectors: [],
      defeatedBosses: [],
      stash: [],

      setEdition: (e) => set({ activeEdition: e }),
      openEdition: () => set({ activeEdition: "orbit", isOpen: true }),
      closeEdition: () => set({ isOpen: false }),

      playChapter: (id) => {
        const s = get();
        if (s.completedChapters.includes(id)) return;
        const idx = ORBIT_CHAPTERS.findIndex(c => c.id === id);
        if (idx === -1) return;
        const completed = [...s.completedChapters, id];
        set({
          completedChapters: completed,
          chapterIdx: Math.max(s.chapterIdx, idx + 1),
        });
      },

      clearSector: (id, lootRolls = 3) => {
        const s = get();
        const sector = ORBIT_SECTORS.find(x => x.id === id);
        if (!sector) return;
        const loot = rollLoot(lootRolls);
        set({
          clearedSectors: s.clearedSectors.includes(id) ? s.clearedSectors : [...s.clearedSectors, id],
          defeatedBosses: sector.bossId && !s.defeatedBosses.includes(sector.bossId)
            ? [...s.defeatedBosses, sector.bossId]
            : s.defeatedBosses,
          stash: [...s.stash, ...loot],
        });
        return;
      },

      reset: () => set({
        chapterIdx: 0,
        completedChapters: [],
        clearedSectors: [],
        defeatedBosses: [],
        stash: [],
      }),

      isChapterUnlocked: (idx) => {
        const s = get();
        return idx <= s.completedChapters.length;
      },
      isSectorUnlocked: (id) => {
        const s = get();
        const sector = ORBIT_SECTORS.find(x => x.id === id);
        if (!sector) return false;
        return s.completedChapters.length >= sector.unlocksAfter;
      },
      progressPct: () => {
        const s = get();
        return orbitProgressPct(s.completedChapters.length, s.clearedSectors.length);
      },
    }),
    {
      name: "orbit-edition-v1",
      // Persist progress only — never the transient overlay-open flag.
      partialize: (s) => ({
        activeEdition: s.activeEdition,
        chapterIdx: s.chapterIdx,
        completedChapters: s.completedChapters,
        clearedSectors: s.clearedSectors,
        defeatedBosses: s.defeatedBosses,
        stash: s.stash,
      }),
    },
  ),
);