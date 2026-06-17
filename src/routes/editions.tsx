import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useOrbit } from "@/lib/orbit/store";
import { orbitCover, ORBIT_CHAPTERS, ORBIT_SECTORS, orbitProgressPct } from "@/lib/orbit/data";
import alleyHero from "@/assets/hero-cat.png";

export const Route = createFileRoute("/editions")({
  head: () => ({
    meta: [
      { title: "Monthly Editions — Alley Cat Dumpster Divers" },
      { name: "description", content: "Pick a monthly edition of Alley Cat Dumpster Divers. Edition #1 The Alley Begins, or the new Edition #2 Orbit Trash — one giant leap into garbage." },
      { property: "og:title", content: "Monthly Editions — Alley Cat Dumpster Divers" },
      { property: "og:description", content: "New monthly story-and-game arcs. Play Orbit Trash, the latest issue." },
      { property: "og:image", content: "https://alleycatdive.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://alleycatdive.com/editions" }],
  }),
  component: EditionsScreen,
});

function EditionsScreen() {
  const active = useOrbit(s => s.activeEdition);
  const setEdition = useOrbit(s => s.setEdition);
  const openEdition = useOrbit(s => s.openEdition);
  const progress = useOrbit(s => orbitProgressPct(s.completedChapters.length, s.clearedSectors.length));
  const completedCh = useOrbit(s => s.completedChapters.length);
  const clearedSec = useOrbit(s => s.clearedSectors.length);
  const navigate = useNavigate();

  return (
    <div className="mt-6 space-y-5">
      <header>
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary">Monthly Issue</div>
        <h1 className="font-display text-4xl uppercase md:text-5xl">Editions</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          One arc a month. New story. New trash.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Edition 1 */}
        <article className={`chunky-panel relative overflow-hidden bg-black/80 p-4 ${active === "alley" ? "ring-4 ring-primary" : ""}`}>
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-accent">Edition #1</div>
              <h2 className="font-display text-2xl uppercase leading-tight">The Alley Begins</h2>
              <p className="text-[11px] italic text-muted-foreground">Scrapper, the crew, and the first dumpster dives.</p>
            </div>
            <span className="border-2 border-black bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-black">Live</span>
          </div>
          <div className="relative mb-3 aspect-video overflow-hidden border-4 border-black bg-slate-900">
            <img src={alleyHero} alt="Edition 1 cover — Scrapper in the alley" loading="lazy" className="h-full w-full object-cover" />
          </div>
          <ul className="mb-3 space-y-1 text-[11px] text-muted-foreground">
            <li>Reward: <span className="text-accent">Alley Palace hideout · Hero of the Trash form</span></li>
            <li>Chapters: <span className="text-foreground">8</span></li>
          </ul>
          <div className="flex gap-2">
            <button
              onClick={() => { setEdition("alley"); navigate({ to: "/story" }); }}
              className="chunky-button bg-primary px-4 py-2 text-xs font-bold uppercase text-black"
            >
              {active === "alley" ? "Continue" : "Play Edition 1"}
            </button>
            {active !== "alley" && (
              <button onClick={() => setEdition("alley")} className="chunky-button bg-slate-900 px-3 py-2 text-[11px] font-bold uppercase">
                Set Active
              </button>
            )}
          </div>
        </article>

        {/* Edition 2 */}
        <article className={`chunky-panel relative overflow-hidden bg-black/80 p-4 ${active === "orbit" ? "ring-4 ring-secondary" : ""}`}>
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-secondary">Edition #2 — NEW</div>
              <h2 className="font-display text-2xl uppercase leading-tight">Orbit Trash</h2>
              <p className="text-[11px] italic text-muted-foreground">One small step for cat. One giant leap into garbage.</p>
            </div>
            <span className="border-2 border-black bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-black animate-pulse">New</span>
          </div>
          <div className="relative mb-3 aspect-video overflow-hidden border-4 border-black bg-slate-900">
            <img src={orbitCover} alt="Edition 2 cover — Scrapper in zero gravity inside STAR-BIN 9" loading="lazy" className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-fuchsia-500/20" />
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <span className="border-2 border-black bg-black/80 px-2 py-0.5 text-[10px] font-bold uppercase text-secondary">STAR-BIN 9</span>
              <span className="border-2 border-black bg-fuchsia-700 px-2 py-0.5 text-[10px] font-bold uppercase text-white">{progress}%</span>
            </div>
          </div>
          <ul className="mb-3 space-y-1 text-[11px] text-muted-foreground">
            <li>Reward: <span className="text-accent">Star-Bin Crown · Escape Pod Key</span></li>
            <li>Chapters: <span className="text-foreground">{ORBIT_CHAPTERS.length}</span> · Sectors: <span className="text-foreground">{ORBIT_SECTORS.length}</span></li>
            <li>Progress: <span className="text-foreground">{completedCh} chapters · {clearedSec} sectors cleared</span></li>
          </ul>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { openEdition(); navigate({ to: "/" }); }}
              className="chunky-button bg-secondary px-4 py-2 text-xs font-bold uppercase text-black"
            >
              {clearedSec || completedCh ? "Continue Orbit Trash" : "Launch Edition 2"}
            </button>
            {active !== "orbit" && (
              <button onClick={() => setEdition("orbit")} className="chunky-button bg-slate-900 px-3 py-2 text-[11px] font-bold uppercase">
                Set Active
              </button>
            )}
          </div>
        </article>
      </div>

      <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">
        Edition #3 coming soon — Trash Moon
      </p>
    </div>
  );
}