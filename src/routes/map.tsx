import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useGame } from "@/lib/game/store";
import { isDumpsterUnlocked, DUMPSTER_CHAPTER } from "@/lib/game/story";
import type { Dumpster } from "@/lib/game/types";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Dumpster Map — Alley Cat Dumpster Divers" },
      { name: "description", content: "Browse the neighborhood map and pick your next dumpster dungeon — each bin has unique loot, enemies, and a different trash-truck timer." },
      { property: "og:title", content: "Dumpster Map" },
      { property: "og:description", content: "Browse the neighborhood map and pick your next dumpster dungeon in Alley Cat Dumpster Divers." },
      { property: "og:url", content: "https://alleycatdive.com/map" },
    ],
    links: [
      { rel: "canonical", href: "https://alleycatdive.com/map" },
    ],
  }),
  component: MapScreen,
});

function MapScreen() {
  const dumpsters = useGame(s => s.dumpsters);
  const selectedId = useGame(s => s.selectedDumpsterId);
  const storyIdx = useGame(s => s.storyChapterIdx);
  const completed = useGame(s => s.completedChapters);
  const select = useGame(s => s.selectDumpster);
  const keys = useGame(s => s.dumpsterKeys);
  const navigate = useNavigate();

  function dive(id: string) {
    select(id);
    navigate({ to: "/dive" });
  }

  return (
    <div className="mt-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-4xl uppercase md:text-5xl">Neighborhood Map</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Tap a bin to dive. New bins open as you push through the story.
          </p>
        </div>
        {keys > 0 && (
          <span className="chunky-panel bg-black/80 px-3 py-1.5 text-[11px] font-bold uppercase text-secondary">
            🔑 {keys} Dumpster Key{keys > 1 ? "s" : ""}
          </span>
        )}
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dumpsters.map(d => (
          <DumpsterCard
            key={d.id}
            d={d}
            selected={d.id === selectedId}
            unlocked={isDumpsterUnlocked(d.id, storyIdx)}
            keyable={keys > 0}
            cleared={completed.includes(DUMPSTER_CHAPTER[d.id])}
            onDive={() => dive(d.id)}
          />
        ))}
      </div>
    </div>
  );
}

function DumpsterCard({ d, selected, unlocked, keyable, cleared, onDive }: {
  d: Dumpster; selected: boolean; unlocked: boolean; keyable: boolean; cleared: boolean; onDive: () => void;
}) {
  const canDive = unlocked || keyable; // a Premium Dumpster Key opens a locked bin
  return (
    <button
      onClick={onDive}
      disabled={!canDive}
      className={`chunky-panel group relative overflow-hidden bg-black/80 p-3 text-left transition-transform ${
        selected ? "ring-4 ring-primary -translate-y-1" : ""
      } ${canDive ? "hover:-translate-y-1" : "opacity-50"}`}
    >
      <div className="relative mb-3 aspect-video overflow-hidden border-4 border-black">
        <img src={d.image} alt={d.name} width={512} height={288} loading="lazy" className={`h-full w-full object-cover ${unlocked ? "" : "grayscale"}`} />
        {unlocked && cleared && (
          <span className="absolute right-2 top-2 bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-black">Cleared</span>
        )}
        {unlocked && !cleared && (
          <span className="absolute right-2 top-2 bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-black">▶ Dive</span>
        )}
        {!unlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/70 text-center font-display uppercase tracking-widest text-muted-foreground">
            <span className="text-3xl">{keyable ? "🔑" : "🔒"}</span>
            <span className="text-[10px]">{keyable ? "Use a key to dive" : "Locked · advance the story"}</span>
          </div>
        )}
      </div>
      <div className="mb-2 flex items-start justify-between gap-2">
        <h2 className="font-display text-lg uppercase leading-tight">{d.name}</h2>
        <span className="shrink-0 text-[10px] font-bold uppercase text-accent">
          {"★".repeat(d.difficulty)}{"☆".repeat(Math.max(0, 8 - d.difficulty))}
        </span>
      </div>
      <ul className="space-y-1 text-[11px] text-muted-foreground">
        <li>Loot: <span className="text-accent capitalize">{d.expectedLoot}</span></li>
        <li>Enemies: <span className="text-foreground">{d.enemyPool.length} types · {d.rooms} rooms</span></li>
        <li>Truck: <span className="text-foreground">{Math.floor(d.truckTimerSec/60)}m {d.truckTimerSec%60}s</span></li>
        <li>Rec. power: <span className="text-foreground">{d.recommendedPower}</span></li>
      </ul>
    </button>
  );
}
