import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useGame, rarityClass, rarityGlow } from "@/lib/game/store";
import type { ItemKind } from "@/lib/game/types";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Stash — Alley Cat Dumpster Divers" },
      { name: "description", content: "Sort your trash treasures. Equip, sell, or hoard." },
      { property: "og:title", content: "Stash" },
      { property: "og:description", content: "Sort your trash treasures." },
    ],
  }),
  component: InventoryScreen,
});

const FILTERS: { key: ItemKind | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "weapon", label: "Weapons" },
  { key: "armor", label: "Armor" },
  { key: "relic", label: "Relics" },
  { key: "food", label: "Food" },
  { key: "junk", label: "Junk" },
  { key: "crafting", label: "Crafting" },
];

function InventoryScreen() {
  const inventory = useGame(s => s.inventory);
  const cats = useGame(s => s.cats);
  const activeCatId = useGame(s => s.activeCatId);
  const equip = useGame(s => s.equip);
  const sell = useGame(s => s.sell);
  const [filter, setFilter] = useState<ItemKind | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const items = inventory.filter(i => filter === "all" || i.kind === filter);
  const selected = inventory.find(i => i.id === selectedId);
  const activeCat = cats.find(c => c.id === activeCatId)!;

  return (
    <div className="mt-6">
      <header className="mb-4">
        <h1 className="font-display text-4xl uppercase md:text-5xl">Stash</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{inventory.length} pieces of certified trash treasure</p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`chunky-button px-3 py-1.5 text-xs font-bold uppercase ${filter === f.key ? "bg-primary text-black" : "bg-slate-900"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {items.length === 0 ? (
            <div className="chunky-panel bg-black/60 p-10 text-center text-sm uppercase tracking-widest text-muted-foreground">
              Nothing here. Go dive a dumpster.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-5">
              {items.map(it => (
                <button
                  key={it.id}
                  onClick={() => setSelectedId(it.id)}
                  className={`chunky-panel aspect-square bg-black/70 p-2 text-left ${rarityGlow(it.rarity)} ${selectedId === it.id ? "ring-4 ring-primary" : ""}`}
                >
                  <div className={`inline-block border-2 px-1 text-[9px] font-bold uppercase ${rarityClass(it.rarity)}`}>{it.rarity[0]}</div>
                  <div className="mt-2 font-display text-sm uppercase leading-tight">{it.name}</div>
                  <div className="mt-auto text-[10px] uppercase text-muted-foreground">{it.kind}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="lg:col-span-4">
          {selected ? (
            <div className={`chunky-panel bg-black/85 p-4 ${rarityGlow(selected.rarity)}`}>
              <div className={`mb-2 inline-block border-2 px-2 py-0.5 text-[10px] font-bold uppercase ${rarityClass(selected.rarity)}`}>{selected.rarity}</div>
              <h3 className="font-display text-xl uppercase">{selected.name}</h3>
              <p className="text-[11px] uppercase text-muted-foreground">{selected.kind}</p>
              <div className="mt-3 grid grid-cols-3 gap-1 text-center text-[10px]">
                <div className="border-2 border-black bg-slate-900 p-1"><div className="text-muted-foreground">ATK</div><div className="font-display text-lg text-primary">{selected.attack ?? "—"}</div></div>
                <div className="border-2 border-black bg-slate-900 p-1"><div className="text-muted-foreground">DEF</div><div className="font-display text-lg text-primary">{selected.defense ?? "—"}</div></div>
                <div className="border-2 border-black bg-slate-900 p-1"><div className="text-muted-foreground">SPD</div><div className="font-display text-lg text-primary">{selected.speed ?? "—"}</div></div>
              </div>
              <p className="mt-3 border-t-2 border-dashed border-white/10 pt-2 text-[11px] italic text-muted-foreground">{selected.flavor}</p>
              <div className="mt-3 text-[11px] uppercase text-muted-foreground">Compare vs {activeCat.name}</div>
              <div className="mt-1 text-[11px]">
                Sell value: <span className="text-accent">{selected.sellPrice} fishbones</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  disabled={!["weapon","armor","relic"].includes(selected.kind)}
                  onClick={() => { equip(selected.id, activeCatId); setSelectedId(null); }}
                  className="chunky-button flex-1 bg-primary py-2 text-xs font-bold uppercase text-black"
                >
                  Equip
                </button>
                <button
                  onClick={() => { sell(selected.id); setSelectedId(null); }}
                  className="chunky-button flex-1 bg-destructive py-2 text-xs font-bold uppercase"
                >
                  Sell
                </button>
              </div>
            </div>
          ) : (
            <div className="chunky-panel bg-black/60 p-6 text-center text-xs uppercase tracking-widest text-muted-foreground">
              Pick a piece of trash.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}