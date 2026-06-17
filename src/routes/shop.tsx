import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import raccoon from "@/assets/raccoon-merchant.png";
import { useGame, rarityClass } from "@/lib/game/store";
import { SHOP_ITEMS } from "@/lib/game/data";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Raccoon Shop — Alley Cat Dumpster Divers" },
      { name: "description", content: "Trade fishbones and bottlecaps with a shifty raccoon merchant for weapons, armor, snacks, and the occasional cursed relic." },
      { property: "og:title", content: "Raccoon Shop" },
      { property: "og:description", content: "Trade fishbones and bottlecaps with a shifty raccoon merchant for gear, snacks, and cursed relics." },
      { property: "og:url", content: "https://alleycatdive.com/shop" },
    ],
    links: [
      { rel: "canonical", href: "https://alleycatdive.com/shop" },
    ],
  }),
  component: ShopScreen,
});

function ShopScreen() {
  const buyShopItem = useGame(st => st.buyShopItem);
  const fishbones = useGame(s => s.fishbones);
  const caps = useGame(s => s.bottlecaps);
  const hideout = useGame(s => s.hideout);
  const disc = 1 - 0.05 * (hideout.find(h => h.id === "fence")?.level ?? 0); // Raccoon Fence discount
  const [flash, setFlash] = useState<string | null>(null);

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <div className="chunky-panel bg-black/80 p-4 text-center">
            <img src={raccoon} alt="Raccoon merchant" width={320} height={320} className="mx-auto h-64 w-auto" />
            <h2 className="font-display text-3xl uppercase text-secondary drop-shadow-[0_0_12px_rgba(217,70,239,0.5)]">Trash Rico</h2>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Probably bites. Definitely cheats.</p>
            <p className="mt-3 text-xs italic text-muted-foreground">"Pssst… for you, friend, half price. ‘Half.’"</p>
          </div>
        </aside>

        <div className="lg:col-span-8">
          <header className="mb-4 flex items-end justify-between">
            <h1 className="font-display text-4xl uppercase md:text-5xl">Shop</h1>
            {flash && <span className="text-xs font-bold uppercase text-primary animate-flicker">{flash}</span>}
          </header>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SHOP_ITEMS.map(s => {
              const cb = Math.ceil(s.costBones * disc);
              const cc = Math.ceil(s.costCaps * disc);
              const canAfford = fishbones >= cb && caps >= cc;
              return (
                <div key={s.id} className="chunky-panel flex items-start justify-between gap-3 bg-black/80 p-4">
                  <div className="flex-1">
                    <div className={`mb-1 inline-block border-2 px-2 py-0.5 text-[10px] font-bold uppercase ${rarityClass(s.rarity)}`}>{s.rarity}</div>
                    <h3 className="font-display text-lg uppercase leading-tight">{s.name}</h3>
                    <p className="text-[11px] italic text-muted-foreground">{s.description}</p>
                    <div className="mt-2 flex gap-2 text-[11px]">
                      {cb > 0 && <span className="border-2 border-black bg-slate-900 px-2 py-0.5">{cb} 🦴{disc < 1 && s.costBones > cb ? ` (was ${s.costBones})` : ""}</span>}
                      {cc > 0 && <span className="border-2 border-black bg-slate-900 px-2 py-0.5">{cc} 🪙{disc < 1 && s.costCaps > cc ? ` (was ${s.costCaps})` : ""}</span>}
                    </div>
                  </div>
                  <button
                    disabled={!canAfford}
                    onClick={() => {
                      const ok = buyShopItem(s);
                      setFlash(ok ? `Bought ${s.name}` : s.id === "healing_sardine" ? "No fallen cat to revive" : "Can't buy that");
                      setTimeout(() => setFlash(null), 1500);
                    }}
                    className="chunky-button bg-primary px-4 py-2 text-xs font-bold uppercase text-black"
                  >
                    {canAfford ? "Buy" : "Nope"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}