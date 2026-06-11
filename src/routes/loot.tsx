import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useGame, rarityClass, rarityGlow } from "@/lib/game/store";

export const Route = createFileRoute("/loot")({
  head: () => ({
    meta: [
      { title: "Loot — Alley Cat Dumpster Divers" },
      { name: "description", content: "Survey the loot you dragged out of the dumpster — rare relics, weapons, and snacks ready to be collected into your stash." },
      { property: "og:title", content: "Loot Reveal" },
      { property: "og:description", content: "The post-dive loot reveal — see every relic, weapon, and snack you hauled out of the dumpster." },
      { property: "og:url", content: "https://alleycatdive.com/loot" },
    ],
    links: [
      { rel: "canonical", href: "https://alleycatdive.com/loot" },
    ],
  }),
  component: LootScreen,
});

function LootScreen() {
  const lastRewards = useGame(s => s.lastRewards);
  const collect = useGame(s => s.collectRewards);
  const dive = useGame(s => s.dive);
  const cats = useGame(s => s.cats);
  const navigate = useNavigate();
  const wasDefeated = !!dive?.fled && dive?.catPose === "ko";
  const [showDefeat, setShowDefeat] = useState(wasDefeated);
  const cat = cats.find(c => c.id === dive?.catId);

  useEffect(() => {
    if (!lastRewards) navigate({ to: "/" });
  }, [lastRewards, navigate]);

  if (!lastRewards) return null;

  if (showDefeat) {
    return (
      <div className="mt-20 flex flex-col items-center text-center">
        <h1 className="font-display text-6xl uppercase text-destructive drop-shadow-[0_0_24px_rgba(244,63,94,0.7)] md:text-7xl animate-floaty">
          Defeated
        </h1>
        <p className="mt-4 max-w-md text-sm uppercase tracking-[0.25em] text-muted-foreground">
          💀 {cat?.name ?? "Your cat"} went down in the bin. The crew dragged them out before the truck rolled in — but half the haul was lost in the scramble.
        </p>
        <div className="mt-10 text-6xl">🪦</div>
        <button
          onClick={() => setShowDefeat(false)}
          className="chunky-button mt-10 bg-destructive px-10 py-4 font-display text-2xl uppercase text-white"
        >
          See What's Left
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <header className="mb-6 text-center">
        <h1 className="font-display text-5xl uppercase text-primary drop-shadow-[0_0_18px_rgba(74,222,128,0.6)] md:text-6xl">
          {lastRewards.items.length > 0 ? "Loot Pile!" : "Empty-Pawed"}
        </h1>
        <p className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          +{lastRewards.bones} fishbones · +{lastRewards.caps} caps
        </p>
      </header>

      {lastRewards.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {lastRewards.items.map((it, idx) => (
            <div
              key={it.id}
              className={`chunky-panel relative bg-black/80 p-4 ${rarityGlow(it.rarity)} animate-floaty`}
              style={{ animationDelay: `${idx * 0.12}s` }}
            >
              <div className={`mb-2 inline-block border-2 px-2 py-0.5 text-[10px] font-bold uppercase ${rarityClass(it.rarity)}`}>{it.rarity}</div>
              <h2 className="font-display text-lg uppercase leading-tight">{it.name}</h2>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{it.kind}</p>
              <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[10px]">
                <Mini label="ATK" v={it.attack} />
                <Mini label="DEF" v={it.defense} />
                <Mini label="SPD" v={it.speed} />
              </div>
              <p className="mt-3 border-t-2 border-dashed border-white/10 pt-2 text-[11px] italic text-muted-foreground">{it.flavor}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">Better luck next bin.</p>
      )}

      <div className="mt-10 flex justify-center">
        <button onClick={collect} className="chunky-button bg-primary px-10 py-4 font-display text-3xl uppercase text-black">
          Take Everything
        </button>
      </div>
    </div>
  );
}

function Mini({ label, v }: { label: string; v?: number }) {
  return (
    <div className="border-2 border-black bg-slate-900 px-1 py-1">
      <div className="text-[8px] font-bold uppercase text-muted-foreground">{label}</div>
      <div className="font-display text-sm leading-none text-primary">{v ?? "—"}</div>
    </div>
  );
}