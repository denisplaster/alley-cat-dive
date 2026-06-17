import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useGame, rarityClass, rarityGlow } from "@/lib/game/store";
import type { Cat, Item, ItemKind } from "@/lib/game/types";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Stash — Alley Cat Dumpster Divers" },
      { name: "description", content: "Sort the trash treasures you dragged out of the dumpster — equip weapons, armor, and relics, eat food, or hoard junk for crafting." },
      { property: "og:title", content: "Stash" },
      { property: "og:description", content: "Sort, equip, sell, or hoard the trash treasures your cats dragged out of the dumpster dungeons." },
      { property: "og:url", content: "https://alleycatdive.com/inventory" },
    ],
    links: [
      { rel: "canonical", href: "https://alleycatdive.com/inventory" },
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
  const eatFood = useGame(s => s.eatFood);
  const craftRelic = useGame(s => s.craftRelic);
  const hideout = useGame(s => s.hideout);
  const [filter, setFilter] = useState<ItemKind | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const items = inventory.filter(i => filter === "all" || i.kind === filter);
  const selected = inventory.find(i => i.id === selectedId);
  const activeCat = cats.find(c => c.id === activeCatId)!;
  const alchemyBuilt = (hideout.find(h => h.id === "alchemy")?.level ?? 0) >= 1;
  const fodderCount = inventory.filter(i => i.kind === "junk" || i.kind === "crafting").length;
  const recovering = cats.some(c => c.status === "injured" || c.status === "resting");

  return (
    <div className="mt-6">
      <header className="mb-4">
        <h1 className="font-display text-4xl uppercase md:text-5xl">Stash</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{inventory.length} pieces of certified trash treasure</p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`chunky-button px-3 py-1.5 text-xs font-bold uppercase ${filter === f.key ? "bg-primary text-black" : "bg-slate-900"}`}
          >
            {f.label}
          </button>
        ))}
        {alchemyBuilt && (
          <button
            disabled={fodderCount < 3}
            onClick={() => craftRelic()}
            title="Trash Alchemy Table — consume 3 junk/crafting items"
            className="chunky-button ml-auto bg-accent px-3 py-1.5 text-xs font-bold uppercase text-black disabled:bg-slate-800 disabled:text-muted-foreground"
          >
            🧪 Combine 3 → Relic ({fodderCount})
          </button>
        )}
      </div>

      <CharacterPanel cat={activeCat} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <h2 className="mb-3 font-display text-2xl uppercase">Item Stash</h2>
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
              <h2 className="font-display text-xl uppercase">{selected.name}</h2>
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
                {selected.kind === "food" ? (
                  <button
                    disabled={!recovering}
                    onClick={() => { eatFood(selected.id); setSelectedId(null); }}
                    title={recovering ? "Feed a recovering cat to cut its downtime" : "No cat is recovering right now"}
                    className="chunky-button flex-1 bg-primary py-2 text-xs font-bold uppercase text-black disabled:bg-slate-800 disabled:text-muted-foreground"
                  >
                    Feed Crew
                  </button>
                ) : (
                  <button
                    disabled={!["weapon","armor","relic"].includes(selected.kind)}
                    onClick={() => { equip(selected.id, activeCatId); setSelectedId(null); }}
                    className="chunky-button flex-1 bg-primary py-2 text-xs font-bold uppercase text-black disabled:bg-slate-800 disabled:text-muted-foreground"
                  >
                    Equip
                  </button>
                )}
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

function CharacterPanel({ cat }: { cat: Cat }) {
  const atkBonus = sumBonus(cat, "attack");
  const defBonus = sumBonus(cat, "defense");
  const spdBonus = sumBonus(cat, "speed");
  const hpBonus = sumBonus(cat, "health");
  return (
    <div className="chunky-panel mb-4 grid grid-cols-1 gap-4 bg-black/80 p-4 md:grid-cols-[auto_1fr_1fr]">
      <div className="flex items-center gap-3">
        <img
          src={cat.portrait}
          alt={cat.name}
          width={112}
          height={112}
          className="size-28 border-4 border-black bg-slate-800 object-cover"
        />
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-secondary">Equipping</div>
          <h2 className="font-display text-2xl uppercase leading-none">{cat.name}</h2>
          <p className="text-[11px] uppercase text-muted-foreground">{cat.catClass} · Lvl {cat.level}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 self-center md:grid-cols-4">
        <StatBox label="HP" value={cat.maxHp} bonus={hpBonus} />
        <StatBox label="ATK" value={cat.attack} bonus={atkBonus} />
        <StatBox label="DEF" value={cat.defense} bonus={defBonus} />
        <StatBox label="SPD" value={cat.speed} bonus={spdBonus} />
      </div>

      <div className="grid grid-cols-3 gap-2 self-center">
        <Slot label="Weapon" item={cat.equipment.weapon} />
        <Slot label="Armor" item={cat.equipment.armor} />
        <Slot label="Relic" item={cat.equipment.relic} />
      </div>
    </div>
  );
}

function sumBonus(cat: Cat, key: "attack" | "defense" | "speed" | "health"): number {
  return (Object.values(cat.equipment) as (Item | undefined)[])
    .reduce((sum, it) => sum + (it?.[key] ?? 0), 0);
}

function StatBox({ label, value, bonus }: { label: string; value: number; bonus: number }) {
  return (
    <div className="border-2 border-black bg-slate-900 p-2 text-center">
      <div className="text-[9px] font-bold uppercase text-muted-foreground">{label}</div>
      <div className="font-display text-xl leading-none text-primary">{value}</div>
      {bonus > 0 && <div className="mt-0.5 text-[9px] font-bold uppercase text-accent">+{bonus} gear</div>}
    </div>
  );
}

function Slot({ label, item }: { label: string; item?: Item }) {
  return (
    <div className={`border-2 border-black p-2 text-center ${item ? `bg-slate-900 ${rarityGlow(item.rarity)}` : "bg-slate-950"}`}>
      <div className="text-[9px] font-bold uppercase text-muted-foreground">{label}</div>
      {item ? (
        <>
          <div className={`mx-auto mt-1 inline-block border px-1 text-[8px] font-bold uppercase ${rarityClass(item.rarity)}`}>{item.rarity[0]}</div>
          <div className="mt-1 font-display text-[11px] uppercase leading-tight">{item.name}</div>
        </>
      ) : (
        <div className="mt-2 text-[10px] uppercase text-muted-foreground">Empty</div>
      )}
    </div>
  );
}