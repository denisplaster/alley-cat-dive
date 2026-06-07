import { createFileRoute, Link } from "@tanstack/react-router";
import { useGame } from "@/lib/game/store";
import type { Dumpster } from "@/lib/game/types";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Dumpster Map — Alley Cat Dumpster Divers" },
      { name: "description", content: "Choose your dumpster. Each one is a different dungeon." },
      { property: "og:title", content: "Dumpster Map" },
      { property: "og:description", content: "Choose your dumpster. Each one is a different dungeon." },
    ],
  }),
  component: MapScreen,
});

function MapScreen() {
  const dumpsters = useGame(s => s.dumpsters);
  const selectedId = useGame(s => s.selectedDumpsterId);
  const select = useGame(s => s.selectDumpster);
  const selected = dumpsters.find(d => d.id === selectedId)!;

  return (
    <div className="mt-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl uppercase md:text-5xl">Neighborhood Map</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Pick your bin. Pick your fight.</p>
        </div>
        <Link to="/dive" className="chunky-button bg-primary px-6 py-3 font-display text-xl uppercase text-black">
          Dive {selected.name.split(" ")[0]}
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dumpsters.map(d => (
          <DumpsterCard key={d.id} d={d} selected={d.id === selectedId} onSelect={() => select(d.id)} />
        ))}
      </div>
    </div>
  );
}

function DumpsterCard({ d, selected, onSelect }: { d: Dumpster; selected: boolean; onSelect: () => void }) {
  const locked = d.status === "locked";
  return (
    <button
      onClick={onSelect}
      disabled={locked}
      className={`chunky-panel group relative overflow-hidden bg-black/80 p-3 text-left transition-transform ${
        selected ? "ring-4 ring-primary -translate-y-1" : ""
      } ${locked ? "opacity-50" : "hover:-translate-y-1"}`}
    >
      <div className="relative mb-3 aspect-video overflow-hidden border-4 border-black">
        <img src={d.image} alt={d.name} width={512} height={288} loading="lazy" className={`h-full w-full object-cover ${locked ? "grayscale" : ""}`} />
        {d.status === "dangerous" && (
          <span className="absolute right-2 top-2 bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase animate-pulse">Dangerous</span>
        )}
        {d.status === "completed" && (
          <span className="absolute right-2 top-2 bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-black">Cleared</span>
        )}
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 font-display text-3xl uppercase tracking-widest text-muted-foreground">
            Locked
          </div>
        )}
      </div>
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-display text-lg uppercase leading-tight">{d.name}</h3>
        <span className="shrink-0 text-[10px] font-bold uppercase text-accent">
          {"★".repeat(d.difficulty)}{"☆".repeat(6 - d.difficulty)}
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