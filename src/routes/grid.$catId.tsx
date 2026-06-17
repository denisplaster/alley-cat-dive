import { createFileRoute, Link } from "@tanstack/react-router";
import { useGame } from "@/lib/game/store";
import { GRID_LAYOUTS, NODE_META, isUnlockable, aggregateGrid } from "@/lib/game/gridData";

export const Route = createFileRoute("/grid/$catId")({
  head: ({ params }) => ({
    meta: [
      { title: `Sphere Grid: ${params.catId} — Alley Cat Dumpster Divers` },
      { name: "description", content: "Spend spheres earned in raids to grow your cat's stats — unlock nodes across the FFX-style sphere grid to shape their build." },
      { property: "og:title", content: `Sphere Grid: ${params.catId}` },
      { property: "og:description", content: "Spend raid spheres to unlock nodes on the FFX-style sphere grid and shape your cat's stat build." },
      { property: "og:url", content: `https://alleycatdive.com/grid/${params.catId}` },
    ],
    links: [
      { rel: "canonical", href: `https://alleycatdive.com/grid/${params.catId}` },
    ],
  }),
  component: GridScreen,
});

function GridScreen() {
  const { catId } = Route.useParams();
  const cats = useGame(s => s.cats);
  const spheres = useGame(s => s.spheres);
  const catGrid = useGame(s => s.catGrid);
  const spend = useGame(s => s.spendSphere);

  const cat = cats.find(c => c.id === catId);
  const layout = GRID_LAYOUTS[catId];
  if (!cat || !layout) {
    return <div className="mt-10 text-center text-muted-foreground">No grid for that cat.</div>;
  }
  const unlocked = catGrid[catId] ?? [];
  const agg = aggregateGrid(catId, unlocked);

  return (
    <div className="mt-4 space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src={cat.portrait} alt={cat.name} className="size-16 border-2 border-black object-cover" />
          <div>
            <h1 className="font-display text-3xl uppercase leading-none">{cat.name}'s Grid</h1>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{cat.catClass} · Lvl {cat.level}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="chunky-panel bg-amber-500 px-3 py-1 font-display text-lg text-black">💠 {spheres}</span>
          <Link to="/raids" className="chunky-button bg-slate-900 px-3 py-2 text-xs font-bold uppercase">← Raids</Link>
        </div>
      </header>

      {/* Switch between every cat's grid (not just the raid leader's). */}
      <div className="flex flex-wrap gap-2">
        {cats.filter(c => GRID_LAYOUTS[c.id]).map(c => (
          <Link
            key={c.id}
            to="/grid/$catId"
            params={{ catId: c.id }}
            className={`chunky-button flex items-center gap-2 px-2 py-1 text-[11px] font-bold uppercase ${c.id === catId ? "bg-primary text-black" : "bg-slate-900"}`}
          >
            <img src={c.portrait} alt="" className="size-5 border border-black object-cover" />
            {c.name}
          </Link>
        ))}
      </div>

      <div className="chunky-panel flex flex-wrap gap-2 bg-black/80 p-2 text-[10px] uppercase tracking-wider">
        <Stat label="HP" v={agg.hp} />
        <Stat label="ATK" v={agg.atk} />
        <Stat label="DEF" v={agg.def} />
        <Stat label="SPD" v={agg.spd} />
        <Stat label="MP" v={agg.mp} />
        <Stat label="OD−" v={agg.od} />
      </div>

      <div className="chunky-panel relative aspect-[3/2] w-full overflow-hidden bg-slate-950">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
          {/* edges */}
          {layout.nodes.flatMap(n =>
            n.neighbors.map(nb => {
              const other = layout.nodes.find(o => o.id === nb);
              if (!other) return null;
              if (n.id > nb) return null; // draw each edge once
              const a = unlocked.includes(n.id);
              const b = unlocked.includes(nb);
              return (
                <line key={n.id + nb} x1={n.x} y1={n.y} x2={other.x} y2={other.y}
                  stroke={a && b ? "#fbbf24" : "#475569"} strokeWidth={a && b ? 0.6 : 0.3} />
              );
            })
          )}
        </svg>
        {/* Node buttons */}
        {layout.nodes.map(n => {
          const isOn = unlocked.includes(n.id);
          const canBuy = !isOn && isUnlockable(layout, unlocked, n.id) && spheres > 0;
          return (
            <button
              key={n.id}
              onClick={() => canBuy && spend(catId, n.id)}
              disabled={!canBuy}
              title={`${NODE_META[n.kind].label} +${n.value}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 border-2 border-black font-display text-[9px] uppercase leading-none ${
                isOn ? "ring-2 ring-amber-300" : canBuy ? "hover:scale-110" : "opacity-40"
              }`}
              style={{
                left: `${n.x}%`, top: `${n.y}%`,
                width: "44px", height: "44px",
                background: NODE_META[n.kind].color,
                color: "#000",
              }}
            >
              <div className="flex h-full flex-col items-center justify-center">
                <span className="text-[8px]">{NODE_META[n.kind].label}</span>
                <span className="text-[11px] font-bold">+{n.value}</span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        Click any node adjacent to an unlocked node to spend 1 sphere. Unlocked nodes glow gold.
      </p>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <span className="border-2 border-black bg-slate-900 px-2 py-0.5">
      <b className="text-primary">{label}</b> +{v}
    </span>
  );
}
