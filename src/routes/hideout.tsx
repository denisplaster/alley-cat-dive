import { createFileRoute } from "@tanstack/react-router";
import { useGame } from "@/lib/game/store";

export const Route = createFileRoute("/hideout")({
  head: () => ({
    meta: [
      { title: "Hideout — Alley Cat Dumpster Divers" },
      { name: "description", content: "Upgrade the alley hideout. Make your cats stronger." },
      { property: "og:title", content: "Hideout" },
      { property: "og:description", content: "Upgrade your alley base." },
    ],
  }),
  component: HideoutScreen,
});

function HideoutScreen() {
  const hideout = useGame(s => s.hideout);
  const upgrade = useGame(s => s.upgrade);
  const fishbones = useGame(s => s.fishbones);
  const caps = useGame(s => s.bottlecaps);

  return (
    <div className="mt-6">
      <header className="mb-6">
        <h1 className="font-display text-4xl uppercase md:text-5xl">Hideout</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Cardboard, ambition, and a little duct tape.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {hideout.map(u => {
          const nextLvl = u.level + 1;
          const maxed = u.level >= u.maxLevel;
          const cb = maxed ? 0 : u.costBones(nextLvl);
          const cc = maxed ? 0 : u.costCaps(nextLvl);
          const canAfford = fishbones >= cb && caps >= cc;
          return (
            <div key={u.id} className="chunky-panel bg-black/80 p-4">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-display text-lg uppercase leading-tight">{u.name}</h3>
                <span className="border-2 border-black bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-black">
                  Lv {u.level}/{u.maxLevel}
                </span>
              </div>
              <p className="text-[11px] italic text-muted-foreground">{u.description}</p>
              <p className="mt-3 text-[11px] uppercase tracking-wider text-primary">{u.benefit}</p>

              <div className="mt-3 flex gap-2 text-[11px]">
                <span className="border-2 border-black bg-slate-900 px-2 py-0.5">{maxed ? "—" : `${cb} 🦴`}</span>
                {cc > 0 && <span className="border-2 border-black bg-slate-900 px-2 py-0.5">{cc} 🪙</span>}
              </div>

              <button
                disabled={maxed || !canAfford}
                onClick={() => upgrade(u.id)}
                className="chunky-button mt-4 w-full bg-primary py-2 text-xs font-bold uppercase text-black"
              >
                {maxed ? "Maxed" : canAfford ? "Upgrade" : "Too Broke"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}