import { createFileRoute, Link } from "@tanstack/react-router";
import { useGame } from "@/lib/game/store";
import { RAIDS } from "@/lib/game/raidData";
import { STORY_CHAPTERS } from "@/lib/game/story";

export const Route = createFileRoute("/raids")({
  head: () => ({
    meta: [
      { title: "Raids — Alley Cat Dumpster Divers" },
      { name: "description", content: "Post-story team raids. FFX-style turn combat, sphere grids, overdrives." },
      { property: "og:title", content: "Raids" },
      { property: "og:description", content: "Take a crew of 3 cats into a dungeon for spheres and glory." },
    ],
  }),
  component: RaidsScreen,
});

function RaidsScreen() {
  const completed = useGame(s => s.completedChapters);
  const cats = useGame(s => s.cats);
  const team = useGame(s => s.raidTeam);
  const setTeam = useGame(s => s.setRaidTeam);
  const spheres = useGame(s => s.spheres);
  const skipStoryline = useGame(s => s.skipStoryline);
  const toggleSkip = useGame(s => s.toggleSkipStoryline);
  const storyDone = completed.length >= STORY_CHAPTERS.length || skipStoryline;

  if (!storyDone) {
    return (
      <div className="mt-10 text-center">
        <h1 className="font-display text-4xl uppercase">Raids</h1>
        <p className="mt-3 text-sm uppercase tracking-widest text-muted-foreground">Locked</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Finish the campaign to unlock team raids. ({completed.length}/{STORY_CHAPTERS.length} chapters complete)
        </p>
        <Link to="/story" className="chunky-button mt-6 inline-block bg-primary px-4 py-2 text-xs font-bold uppercase text-black">Go to Story</Link>
        <button
          onClick={toggleSkip}
          className="chunky-button mt-4 block mx-auto border-2 border-dashed border-destructive/60 bg-transparent px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10"
        >
          [Dev] Skip Storyline → Unlock Raids
        </button>
      </div>
    );
  }

  const toggleCat = (id: string) => {
    if (team.includes(id)) setTeam(team.filter(t => t !== id));
    else if (team.length < 3) setTeam([...team, id]);
    else setTeam([...team.slice(1), id]);
  };

  const teamReady = team.length === 3;

  return (
    <div className="mt-6 space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl uppercase md:text-5xl">Raids</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">CTB combat. 3 cats. Spheres on the line.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="chunky-panel bg-amber-500 px-3 py-1 text-sm font-bold uppercase text-black">💠 {spheres} Spheres</span>
          <Link to="/grid/$catId" params={{ catId: team[0] ?? cats[0].id }} className="chunky-button bg-secondary px-3 py-2 text-xs font-bold uppercase text-black">Sphere Grid</Link>
        </div>
      </header>

      {/* Team picker */}
      <section className="chunky-panel bg-black/80 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-lg uppercase">Raid Team — {team.length}/3</h2>
          {!teamReady && <span className="text-[10px] uppercase text-destructive">Pick exactly 3 cats</span>}
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {cats.map(c => {
            const picked = team.includes(c.id);
            return (
              <button key={c.id} onClick={() => toggleCat(c.id)}
                className={`chunky-button flex flex-col items-center gap-1 p-2 text-[10px] font-bold uppercase ${picked ? "bg-primary text-black ring-4 ring-primary" : "bg-slate-900"}`}>
                <img src={c.portrait} alt={c.name} className="size-16 border-2 border-black object-cover" />
                <span>{c.name}</span>
                <span className="text-[9px] text-muted-foreground">L{c.level} · {c.catClass}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Raid list */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {RAIDS.map(r => (
          <Link key={r.id} to="/raid/$dungeonId" params={{ dungeonId: r.id }}
            disabled={!teamReady}
            className={`chunky-panel relative overflow-hidden bg-slate-950 p-3 transition-transform ${teamReady ? "hover:scale-[1.01]" : "opacity-60 pointer-events-none"}`}>
            {r.image && <img src={r.image} alt="" aria-hidden className="absolute inset-0 size-full object-cover opacity-30" />}
            <div className="relative">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl uppercase leading-tight">{r.name}</h3>
                <span className="border-2 border-black bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase">Diff {r.difficulty}</span>
              </div>
              <p className="text-xs italic text-muted-foreground">{r.subtitle}</p>
              <div className="mt-3 flex flex-wrap gap-1 text-[10px]">
                <span className="border-2 border-black bg-slate-900 px-2 py-0.5">{r.rooms.length} Rooms</span>
                <span className="border-2 border-black bg-amber-500 px-2 py-0.5 text-black">+{r.rewards.spheres} 💠</span>
                <span className="border-2 border-black bg-slate-900 px-2 py-0.5">+{r.rewards.bones} 🦴</span>
                <span className="border-2 border-black bg-slate-900 px-2 py-0.5">+{r.rewards.caps} 🪙</span>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
