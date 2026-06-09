import { createFileRoute, Link } from "@tanstack/react-router";
import heroCat from "@/assets/hero-cat.png";
import { useGame } from "@/lib/game/store";
import { STORY_CHAPTERS } from "@/lib/game/story";
import { EVOLUTIONS, computeEvolution } from "@/lib/game/evolution";

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
  const roomsCleared = useGame(s => s.roomsCleared);
  const bossesBeaten = useGame(s => s.bossesBeaten);
  const skipStoryline = useGame(s => s.skipStoryline);
  const toggleSkip = useGame(s => s.toggleSkipStoryline);
  const evo = EVOLUTIONS[computeEvolution({ completedChapters: completed, roomsCleared, bossesBeaten })];
  const selected = dumpsters.find(d => d.id === selectedId)!;
  const activeCat = cats.find(c => c.id === activeCatId)!;
  const latest = inventory[inventory.length - 1];
  const currentChapter = STORY_CHAPTERS[storyIdx];
  const showStoryCta = currentChapter && !completed.includes(currentChapter.id);

  return (
    <div className="relative mt-1 md:mt-2">
      {/* Title */}
      <div className="pointer-events-none relative z-10 mb-2 text-center md:mb-3">
        <h1 className="font-display uppercase leading-[0.85] tracking-tighter text-3xl md:text-5xl lg:text-6xl">
          <span className="text-foreground drop-shadow-[0_0_18px_rgba(217,70,239,0.45)]">Alley Cat </span>
          <span className="animate-flicker text-primary drop-shadow-[0_0_18px_rgba(74,222,128,0.6)]">Dumpster </span>
          <span className="text-foreground drop-shadow-[0_0_18px_rgba(217,70,239,0.45)]">Divers</span>
        </h1>
      </div>

      <div className="grid grid-cols-2 items-center gap-2 md:gap-4 lg:grid-cols-12">
        {/* Hero */}
        <div className="order-2 lg:order-1 lg:col-span-4">
          <div className="chunky-panel bg-black/70 p-2 md:p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-black">Active Diver</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lvl {activeCat.level}</span>
            </div>
            <h3 className="font-display text-lg uppercase leading-tight md:text-xl">{activeCat.name}</h3>
            <p className="mb-2 text-[10px] text-muted-foreground">{activeCat.catClass}</p>
            <div className="mb-2 border-2 border-black bg-primary/20 px-2 py-1">
              <div className="text-[9px] font-bold uppercase tracking-wider text-primary">Evolution</div>
              <div className="font-display text-sm uppercase leading-tight">{evo.name}</div>
              <div className="text-[9px] italic text-muted-foreground">{evo.tagline}</div>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              <Stat label="ATK" value={activeCat.attack} />
              <Stat label="DEF" value={activeCat.defense} />
              <Stat label="SPD" value={activeCat.speed} />
            </div>
            <Link to="/crew" className="chunky-button mt-2 block w-full bg-slate-800 py-1.5 text-center text-[11px] font-bold uppercase tracking-wider">
              Swap Cat
            </Link>
          </div>
        </div>

        {/* Hero cat */}
        <div className="order-1 col-span-2 lg:order-2 lg:col-span-4">
          <div className="relative mx-auto aspect-square max-w-[180px] md:max-w-[240px] lg:max-w-xs">
            <div className="absolute inset-6 rounded-full bg-primary/20 blur-3xl" />
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
          <div className="chunky-panel rotate-[1deg] border-t-4 border-t-secondary/60 bg-black/80 p-2 md:p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-black">Next Target</span>
              {selected.status === "dangerous" && (
                <span className="animate-pulse text-[10px] font-bold uppercase text-destructive">Dangerous</span>
              )}
              {selected.status === "locked" && (
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Locked</span>
              )}
            </div>
            <h3 className="mb-0.5 font-display text-base uppercase leading-tight md:text-lg">{selected.name}</h3>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Diff {"★".repeat(selected.difficulty)}{"☆".repeat(6 - selected.difficulty)}
            </p>
            <div className="mb-2 overflow-hidden border-2 border-black">
              <img src={selected.image} alt={selected.name} width={512} height={120} className="h-14 w-full object-cover md:h-20" loading="lazy" />
            </div>
            <Link to="/map" className="chunky-button block w-full bg-slate-800 py-1.5 text-center text-[11px] font-bold uppercase">
              Browse Bins
            </Link>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 mt-3 flex flex-col items-center gap-2 md:mt-5">
        {showStoryCta && (
          <button
            onClick={() => openCutscene(currentChapter.id, "intro")}
            className="chunky-button rotate-[1deg] bg-secondary px-4 py-2 font-display text-sm uppercase text-black md:text-base"
          >
            ▶ {completed.length === 0 ? "Begin Story" : "Continue Story"} · {currentChapter.title}
          </button>
        )}
        <Link
          to="/dive"
          className="chunky-button animate-pulse-glow rotate-[-1deg] bg-primary px-8 py-3 font-display text-2xl uppercase text-black md:px-12 md:py-4 md:text-3xl"
        >
          Start Dive
        </Link>
        <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
          {latest ? `Last find: ${latest.name}` : "Your stash is empty. Time to dive."}
        </p>
        <button
          onClick={toggleSkip}
          className={`mt-1 border-2 border-dashed px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${skipStoryline ? "border-primary/60 text-primary" : "border-muted-foreground/30 text-muted-foreground hover:border-destructive/60 hover:text-destructive"}`}
          title="Dev flag: bypass story requirements"
        >
          {skipStoryline ? "✓ Storyline Skipped" : "[Dev] Skip Storyline"}
        </button>
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
