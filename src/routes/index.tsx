import { createFileRoute, Link } from "@tanstack/react-router";
import heroCat from "@/assets/hero-cat.png";
import { useGame } from "@/lib/game/store";
import { STORY_CHAPTERS } from "@/lib/game/story";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alley Cat Dumpster Divers — Hub" },
      { name: "description", content: "Your alley hideout. Pick a dumpster, dive deep, escape with the loot." },
      { property: "og:title", content: "Alley Cat Dumpster Divers" },
      { property: "og:description", content: "Every dumpster is a dungeon." },
    ],
  }),
  component: AlleyHub,
});

function AlleyHub() {
  const dumpsters = useGame(s => s.dumpsters);
  const selectedId = useGame(s => s.selectedDumpsterId);
  const cats = useGame(s => s.cats);
  const activeCatId = useGame(s => s.activeCatId);
  const inventory = useGame(s => s.inventory);
  const storyIdx = useGame(s => s.storyChapterIdx);
  const completed = useGame(s => s.completedChapters);
  const openCutscene = useGame(s => s.openCutscene);
  const selected = dumpsters.find(d => d.id === selectedId)!;
  const activeCat = cats.find(c => c.id === activeCatId)!;
  const latest = inventory[inventory.length - 1];
  const currentChapter = STORY_CHAPTERS[storyIdx];
  const showStoryCta = currentChapter && !completed.includes(currentChapter.id);

  return (
    <div className="relative mt-2 md:mt-6">
      {/* Title */}
      <div className="pointer-events-none relative z-10 mb-4 text-center">
        <h1 className="font-display text-5xl uppercase leading-[0.85] tracking-tighter md:text-7xl lg:text-8xl">
          <span className="block text-foreground drop-shadow-[0_0_18px_rgba(217,70,239,0.45)]">Alley Cat</span>
          <span className="block animate-flicker text-primary drop-shadow-[0_0_18px_rgba(74,222,128,0.6)]">Dumpster</span>
          <span className="block text-foreground drop-shadow-[0_0_18px_rgba(217,70,239,0.45)]">Divers</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Every dumpster is a dungeon.
        </p>
      </div>

      <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
        {/* Hero */}
        <div className="order-2 lg:order-1 lg:col-span-4">
          <div className="chunky-panel bg-black/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-black">Active Diver</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lvl {activeCat.level}</span>
            </div>
            <h3 className="font-display text-2xl uppercase">{activeCat.name}</h3>
            <p className="mb-3 text-xs text-muted-foreground">{activeCat.catClass}</p>
            <div className="grid grid-cols-3 gap-1 text-center">
              <Stat label="ATK" value={activeCat.attack} />
              <Stat label="DEF" value={activeCat.defense} />
              <Stat label="SPD" value={activeCat.speed} />
            </div>
            <p className="mt-3 border-t-2 border-dashed border-white/10 pt-3 text-[11px] italic leading-relaxed text-muted-foreground">
              {activeCat.ability}
            </p>
            <Link to="/crew" className="chunky-button mt-4 block w-full bg-slate-800 py-2 text-center text-xs font-bold uppercase tracking-wider">
              Swap Cat
            </Link>
          </div>
        </div>

        {/* Hero cat */}
        <div className="order-1 lg:order-2 lg:col-span-4">
          <div className="relative mx-auto aspect-square max-w-sm">
            <div className="absolute inset-8 rounded-full bg-primary/20 blur-3xl" />
            <img
              src={heroCat}
              alt="Hero alley cat"
              width={800}
              height={800}
              className="animate-floaty relative z-10 h-full w-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.6)]"
            />
          </div>
        </div>

        {/* Next target */}
        <div className="order-3 lg:col-span-4">
          <div className="chunky-panel rotate-[1deg] border-t-8 border-t-secondary/60 bg-black/80 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-black">Next Target</span>
              {selected.status === "dangerous" && (
                <span className="animate-pulse text-[10px] font-bold uppercase text-destructive">Dangerous</span>
              )}
              {selected.status === "locked" && (
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Locked</span>
              )}
            </div>
            <h3 className="mb-1 font-display text-xl uppercase">{selected.name}</h3>
            <p className="mb-3 text-[11px] uppercase tracking-wider text-muted-foreground">
              Diff {"★".repeat(selected.difficulty)}{"☆".repeat(6 - selected.difficulty)}
            </p>
            <div className="mb-3 overflow-hidden border-4 border-black">
              <img src={selected.image} alt={selected.name} width={512} height={200} className="h-28 w-full object-cover" loading="lazy" />
            </div>
            <ul className="mb-3 space-y-1 text-[11px] text-muted-foreground">
              <li>Expected loot: <span className="text-accent">{selected.expectedLoot}</span></li>
              <li>Trash truck: <span className="text-foreground">{Math.floor(selected.truckTimerSec/60)}m {selected.truckTimerSec%60}s</span></li>
              <li>Rec. power: <span className="text-foreground">{selected.recommendedPower}</span></li>
            </ul>
            <Link to="/map" className="chunky-button block w-full bg-slate-800 py-2 text-center text-xs font-bold uppercase">
              Browse Bins
            </Link>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 mt-10 flex flex-col items-center gap-3">
        {showStoryCta && (
          <button
            onClick={() => openCutscene(currentChapter.id, "intro")}
            className="chunky-button rotate-[1deg] bg-secondary px-6 py-3 font-display text-lg uppercase text-black"
          >
            ▶ Continue Story · {currentChapter.title}
          </button>
        )}
        <Link
          to="/dive"
          className="chunky-button animate-pulse-glow rotate-[-1deg] bg-primary px-12 py-5 font-display text-3xl uppercase text-black md:text-4xl"
        >
          Start Dive
        </Link>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {latest ? `Last find: ${latest.name}` : "Your stash is empty. Time to dive."}
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="chunky-panel bg-slate-900 px-1 py-1.5">
      <div className="text-[9px] font-bold uppercase text-muted-foreground">{label}</div>
      <div className="font-display text-lg leading-none text-primary">{value}</div>
    </div>
  );
}
