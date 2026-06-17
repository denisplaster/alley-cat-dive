import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useOrbit } from "@/lib/orbit/store";
import { useGame } from "@/lib/game/store";
import {
  ORBIT_CHAPTERS, ORBIT_SECTORS, ORBIT_ENEMIES, ORBIT_LOOT, ORBIT_ABILITIES,
  RACCX_TAUNTS, RARITY_TINT, orbitBg, orbitRaccX, orbitProgressPct,
  type OrbitSector, type OrbitEnemy, type OrbitLoot,
  type OrbitChapter, type OrbitPanel,
} from "@/lib/orbit/data";
import {
  SCRAPPER_POSES, getEnemyPoses, SCRAPPER_LINES, ENEMY_LINES, randLine,
  type ScrapperPose, type EnemyPose,
} from "@/lib/orbit/sprites";

export const Route = createFileRoute("/orbit")({
  head: () => ({
    meta: [
      { title: "Orbit Trash — Edition #2 — Alley Cat Dumpster Divers" },
      { name: "description", content: "Dive into STAR-BIN 9 in Orbit Trash, Edition #2 of Alley Cat Dumpster Divers. Zero-G dumpsters, space raccoon pirates, mutant mold, and Captain Racc-X." },
      { property: "og:title", content: "Orbit Trash — Edition #2" },
      { property: "og:description", content: "Side-scroll through a sprawling orbital sanitation station. Loot. Fight. Escape." },
      { property: "og:image", content: "https://alleycatdive.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://alleycatdive.com/orbit" }],
  }),
  component: OrbitRoute,
});

// Legacy/deep-link route: Orbit no longer has its own page or nav tab, so open
// the edition overlay and drop the player on the hub.
function OrbitRoute() {
  const openEdition = useOrbit(s => s.openEdition);
  const navigate = useNavigate();
  useEffect(() => {
    openEdition();
    navigate({ to: "/", replace: true });
  }, [openEdition, navigate]);
  return null;
}

type Tab = "story" | "map" | "codex";

/** The full Orbit Trash edition UI, hosted inside the full-screen OrbitOverlay. */
function OrbitEdition() {
  const [tab, setTab] = useState<Tab>("story");
  const [diveSector, setDiveSector] = useState<OrbitSector | null>(null);
  const closeEdition = useOrbit(s => s.closeEdition);

  if (diveSector) {
    return <OrbitDive sector={diveSector} onExit={() => setDiveSector(null)} />;
  }

  return (
    <div className="space-y-4">
      <OrbitHero />

      <div className="flex flex-wrap gap-2">
        {(["story","map","codex"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`chunky-button px-3 py-1.5 text-[11px] font-bold uppercase ${tab === t ? "bg-secondary text-black" : "bg-slate-900"}`}
          >
            {t === "story" ? "Story" : t === "map" ? "Station Map" : "Codex"}
          </button>
        ))}
        <button onClick={closeEdition} className="chunky-button bg-slate-900 px-3 py-1.5 text-[11px] font-bold uppercase ml-auto">
          ✕ Exit Edition
        </button>
      </div>

      {tab === "story" && <OrbitStory />}
      {tab === "map" && <OrbitMap onDive={setDiveSector} />}
      {tab === "codex" && <OrbitCodex />}
    </div>
  );
}

/** Full-screen overlay hosting the edition — covers the nav like Edition 1's
 *  Cutscene. Mounted globally in __root; shown whenever an edition is launched. */
export function OrbitOverlay() {
  const isOpen = useOrbit(s => s.isOpen);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <img src={orbitBg} alt="" aria-hidden className="h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 to-background" />
      </div>
      <div className="mx-auto w-full max-w-7xl px-3 py-4 md:px-6">
        <OrbitEdition />
      </div>
    </div>
  );
}

function OrbitHero() {
  const progress = useOrbit(s => orbitProgressPct(s.completedChapters.length, s.clearedSectors.length));
  const next = useOrbit(s => {
    const nextCh = ORBIT_CHAPTERS[s.completedChapters.length];
    return nextCh?.title ?? "All chapters cleared";
  });
  return (
    <header className="chunky-panel relative overflow-hidden bg-black p-0">
      <div className="relative aspect-[3/1] w-full">
        <img src={orbitBg} alt="STAR-BIN 9 interior" width={1920} height={640} loading="lazy"
             className="h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
        <div className="absolute left-4 top-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary">Monthly Edition #2</div>
          <h1 className="font-display text-3xl uppercase leading-tight text-white md:text-5xl">Orbit Trash</h1>
          <p className="text-[11px] uppercase tracking-widest text-fuchsia-300">STAR-BIN 9 · Orbital Sanitation Station</p>
        </div>
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Next:</div>
            <div className="font-display text-sm uppercase text-secondary">{next}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Edition progress</div>
            <div className="chunky-panel h-3 w-40 bg-black p-[2px]">
              <div className="h-full bg-secondary" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ===================== STORY (webtoon: intro → dive → outro → reward) ===================== */
type StoryPhase = "intro" | "dive" | "outro" | "reward";

function OrbitStory() {
  const completed = useOrbit(s => s.completedChapters);
  const play = useOrbit(s => s.playChapter);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [phase, setPhase] = useState<StoryPhase>("intro");
  const [panel, setPanel] = useState(0);

  const active = ORBIT_CHAPTERS.find(c => c.id === activeId) ?? null;
  const sector = active?.sectorId ? ORBIT_SECTORS.find(s => s.id === active.sectorId) ?? null : null;

  function openCh(id: string) { setActiveId(id); setPhase("intro"); setPanel(0); }
  function close() { setActiveId(null); }

  function advanceIntro() {
    if (!active) return;
    if (panel < active.intro.length - 1) { setPanel(p => p + 1); return; }
    // End of intro → into the dive if this chapter has one, else straight to outro.
    if (sector) setPhase("dive");
    else { setPhase("outro"); setPanel(0); }
  }
  function advanceOutro() {
    if (!active) return;
    if (panel < active.outro.length - 1) { setPanel(p => p + 1); return; }
    setPhase("reward");
  }
  function claim() {
    if (!active) return;
    play(active.id);
    setActiveId(null);
  }

  // --- Chapter list (always the story-tab content; the active chapter plays in
  //     a focused full-screen overlay on top, mirroring Edition 1's Cutscene). ---
  const chapterList = (
    <div className="space-y-3">
      {ORBIT_CHAPTERS.map((ch, i) => {
        const done = completed.includes(ch.id);
        const unlocked = i <= completed.length;
        return (
          <article key={ch.id} className={`chunky-panel p-4 ${unlocked && !done ? "bg-secondary/15 border-secondary" : "bg-black/80"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h2 className="font-display text-lg uppercase leading-tight">{ch.title}</h2>
                <p className="text-[11px] italic text-muted-foreground">{ch.subtitle}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  <span className="border-2 border-black bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase">
                    Unlocks: {ch.unlocks}
                  </span>
                  {ch.sectorId
                    ? <span className="border-2 border-black bg-fuchsia-900 px-2 py-0.5 text-[10px] font-bold uppercase text-fuchsia-100">⚔ Dive</span>
                    : <span className="border-2 border-black bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">★ Cinematic</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {done && <span className="border-2 border-black bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-black">Done</span>}
                {!unlocked && <span className="text-[10px] font-bold uppercase text-muted-foreground">🔒 Locked</span>}
                {unlocked && (
                  <button onClick={() => openCh(ch.id)}
                    className="chunky-button bg-primary px-3 py-2 text-xs font-bold uppercase text-black">
                    {done ? "Replay" : "Play"}
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );

  if (!active) return chapterList;

  // --- Active chapter: intro → dive → outro → reward, all in one focused overlay ---
  let inner: ReactNode = null;
  if (phase === "dive" && sector) {
    // The battle fills the same width as Edition 1's dive (the app's max-w-7xl).
    inner = (
      <div className="w-full max-w-7xl">
        <OrbitDive
          sector={sector}
          onExit={() => { setPhase("intro"); setPanel(Math.max(0, active.intro.length - 1)); }}
          onComplete={() => { setPhase("outro"); setPanel(0); }}
        />
      </div>
    );
  } else if (phase === "reward") {
    inner = <div className="w-full max-w-2xl"><StoryReward chapter={active} onClaim={claim} /></div>;
  } else {
    const viewPhase: "intro" | "outro" = phase === "outro" ? "outro" : "intro";
    const panels = viewPhase === "intro" ? active.intro : active.outro;
    const p = panels[panel];
    if (p) {
      const isLastIntro = viewPhase === "intro" && panel === panels.length - 1;
      const nextLabel = panel < panels.length - 1
        ? "Next ▸"
        : viewPhase === "intro" ? (sector ? "Start Dive ▶" : "Continue ▸") : "Continue ▸";
      inner = (
        <div className="w-full max-w-3xl">
          <StoryPanelView
            chapter={active}
            phase={viewPhase}
            panels={panels}
            idx={panel}
            nextLabel={nextLabel}
            highlightNext={isLastIntro && !!sector}
            onNext={viewPhase === "intro" ? advanceIntro : advanceOutro}
            onSkip={close}
          />
        </div>
      );
    }
  }

  return (
    <>
      {chapterList}
      {/* Portal to <body> so the overlay escapes the page's stacking context and
          covers the nav/header, exactly like Edition 1's root-level Cutscene. */}
      {typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/95 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
            {inner}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

/** One webtoon panel: full-bleed art + a speech bubble, mirroring Edition 1's Cutscene. */
function StoryPanelView({ chapter, phase, panels, idx, nextLabel, highlightNext, onNext, onSkip }: {
  chapter: OrbitChapter; phase: "intro" | "outro"; panels: OrbitPanel[];
  idx: number; nextLabel: string; highlightNext: boolean; onNext: () => void; onSkip: () => void;
}) {
  const p = panels[idx];
  const isNarrator = !p.speaker || p.speaker.toLowerCase() === "narrator";
  return (
    <div className="space-y-3">
      {/* Chapter banner */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary">
            {phase === "intro" ? "Chapter Begins" : "Chapter Ends"}
          </div>
          <h2 className="font-display text-2xl uppercase leading-tight md:text-3xl">{chapter.title}</h2>
          <p className="text-[11px] italic text-muted-foreground">{chapter.subtitle}</p>
        </div>
        <button onClick={onSkip} className="chunky-button bg-slate-900 px-2 py-1 text-[10px] font-bold uppercase">Skip</button>
      </div>

      {/* Webtoon panel */}
      <div className="chunky-panel relative aspect-[4/3] cursor-pointer overflow-hidden bg-black" onClick={onNext}>
        <img
          key={`${chapter.id}-${phase}-${idx}`}
          src={p.image}
          alt=""
          className="h-full w-full animate-[fade-in_0.4s_ease-out] object-cover"
        />
        {p.text && (
          <div className="absolute inset-x-3 bottom-3 md:inset-x-6 md:bottom-6">
            {isNarrator ? (
              <div className="chunky-panel border-2 border-black bg-black/85 px-4 py-3 text-sm leading-snug text-foreground md:text-base">
                <p className="italic">{p.text}</p>
              </div>
            ) : (
              <div className="chunky-panel relative bg-white px-4 py-3 text-black">
                <div className="absolute -top-3 left-3 border-2 border-black bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-black">
                  {p.speaker}
                </div>
                <p className="text-sm font-bold leading-snug md:text-base">{p.text}</p>
              </div>
            )}
          </div>
        )}

        {/* Panel dots */}
        <div className="absolute right-3 top-3 flex gap-1">
          {panels.map((_, i) => (
            <span key={i} className={`h-1.5 w-6 border border-black ${i <= idx ? "bg-secondary" : "bg-white/30"}`} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button onClick={onSkip} className="chunky-button bg-slate-900 px-3 py-2 text-[11px] font-bold uppercase">Skip</button>
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{idx + 1} / {panels.length}</span>
        </div>
        <button
          onClick={onNext}
          className={`chunky-button px-4 py-2 text-xs font-bold uppercase text-black ${highlightNext ? "animate-pulse bg-primary" : "bg-secondary"}`}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}

/** Chapter-complete reward screen, mirroring Edition 1's reward panel. */
function StoryReward({ chapter, onClaim }: { chapter: OrbitChapter; onClaim: () => void }) {
  const unlocks = chapter.unlocks.split("·").map(s => s.trim()).filter(Boolean);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="text-center">
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary animate-pulse">Chapter Complete</div>
        <h2 className="font-display text-3xl uppercase leading-tight text-primary drop-shadow-[0_0_18px_rgba(74,222,128,0.55)] md:text-4xl">
          {chapter.title.replace(/^Chapter \d+\s—\s/, "")}
        </h2>
        <p className="text-[11px] italic text-muted-foreground">{chapter.subtitle}</p>
      </div>
      <div className="chunky-panel bg-black/85 p-4">
        <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-secondary">Unlocks</div>
        <ul className="space-y-2">
          {unlocks.map((u, i) => (
            <li key={i} className="flex items-center gap-3 border-2 border-black bg-slate-900/80 p-2">
              <span className="text-2xl">🛰️</span>
              <div className="font-display text-sm uppercase leading-tight">{u}</div>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-end">
        <button onClick={onClaim} className="chunky-button bg-primary px-6 py-2 text-xs font-bold uppercase text-black">
          Claim &amp; Continue
        </button>
      </div>
    </div>
  );
}

/* ===================== STATION MAP ===================== */
function OrbitMap({ onDive }: { onDive: (s: OrbitSector) => void }) {
  const isUnlocked = useOrbit(s => s.isSectorUnlocked);
  const cleared = useOrbit(s => s.clearedSectors);
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {ORBIT_SECTORS.map(sec => {
        const unlocked = isUnlocked(sec.id);
        const done = cleared.includes(sec.id);
        return (
          <div key={sec.id}
               className={`chunky-panel relative overflow-hidden bg-black/80 p-3 ${done ? "ring-2 ring-secondary" : ""} ${!unlocked ? "opacity-60" : ""}`}>
            <div className="mb-3 grid h-32 place-items-center overflow-hidden border-4 border-black bg-gradient-to-br from-slate-900 via-fuchsia-950 to-emerald-950">
              <SectorArt id={sec.id} />
              <span className="absolute right-2 top-2 border-2 border-black bg-fuchsia-700 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                {sec.difficulty}
              </span>
              {done && <span className="absolute left-2 top-2 border-2 border-black bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-black">Cleared</span>}
              {!unlocked && (
                <div className="absolute inset-0 grid place-items-center bg-black/70 font-display text-2xl uppercase tracking-widest text-muted-foreground">
                  🔒 Locked
                </div>
              )}
            </div>
            <h3 className="font-display text-lg uppercase leading-tight">{sec.name}</h3>
            <p className="text-[11px] italic text-muted-foreground">{sec.subtitle}</p>
            <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
              <li>Loot: <span className="text-accent">{sec.loot}</span></li>
              <li>Enemies: <span className="text-foreground">{sec.enemies.map(id => ORBIT_ENEMIES[id].emoji).join(" ")}</span></li>
              <li>Rooms: <span className="text-foreground">{sec.rooms}</span> · Mod: <span className="text-fuchsia-300">{sec.modifier}</span></li>
            </ul>
            <button
              disabled={!unlocked}
              onClick={() => onDive(sec)}
              className="chunky-button mt-3 w-full bg-secondary px-3 py-2 text-xs font-bold uppercase text-black disabled:bg-slate-800 disabled:text-muted-foreground"
            >
              {unlocked ? (done ? "Re-Dive" : "Start Dive") : "Locked"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function SectorArt({ id }: { id: string }) {
  const map: Record<string, string> = {
    galley: "🍱", cargo: "📦", luxury: "🍷", biohazard: "☣️", throne: "👑", core: "⚙️",
  };
  return <span className="text-6xl drop-shadow-[0_0_12px_rgba(0,255,180,0.6)]">{map[id] ?? "🛰️"}</span>;
}

/* ===================== CODEX ===================== */
function OrbitCodex() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="chunky-panel bg-black/80 p-4">
        <h2 className="font-display text-xl uppercase">Enemies</h2>
        <ul className="mt-2 space-y-1.5">
          {Object.values(ORBIT_ENEMIES).map(e => (
            <li key={e.id} className="flex items-center gap-3 border-2 border-black bg-slate-900 px-3 py-2 text-[12px]">
              <span className="text-2xl">{e.emoji}</span>
              <div className="flex-1">
                <div className="font-display uppercase">{e.name}</div>
                <div className="text-[10px] italic text-muted-foreground">{e.blurb}</div>
              </div>
              <div className="text-right text-[10px] font-bold uppercase">
                <div>HP {e.hp}</div>
                <div>ATK {e.atk}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-4">
        <div className="chunky-panel bg-black/80 p-4">
          <h2 className="font-display text-xl uppercase">Abilities</h2>
          <ul className="mt-2 space-y-1.5">
            {ORBIT_ABILITIES.map(a => (
              <li key={a.id} className="border-2 border-black bg-slate-900 px-3 py-2 text-[12px]">
                <div className="font-display uppercase text-secondary">{a.name}</div>
                <div className="text-[11px] text-muted-foreground">{a.desc}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="chunky-panel bg-black/80 p-4">
          <h2 className="font-display text-xl uppercase">Loot Tiers</h2>
          <div className="mt-2 flex flex-wrap gap-1">
            {ORBIT_LOOT.map(l => (
              <span key={l.id} className={`border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase ${RARITY_TINT[l.rarity]}`}>
                {l.emoji} {l.name}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ===================== DIVE (side-scrolling) ===================== */
type DiveStatus = "combat" | "roomCleared" | "transitioning" | "lootRoom" | "hazardRoom" | "bossRoom" | "summary";

function buildRoomPlan(sec: OrbitSector) {
  const plan: { kind: "combat" | "loot" | "hazard" | "boss"; enemyId?: string }[] = [];
  const rooms = sec.rooms;
  for (let i = 0; i < rooms - 1; i++) {
    const roll = Math.random();
    if (roll < 0.2) plan.push({ kind: "loot" });
    else if (roll < 0.32) plan.push({ kind: "hazard" });
    else plan.push({ kind: "combat", enemyId: sec.enemies[Math.floor(Math.random() * sec.enemies.length)] });
  }
  plan.push(sec.bossId ? { kind: "boss", enemyId: sec.bossId } : { kind: "combat", enemyId: sec.enemies[sec.enemies.length - 1] });
  return plan;
}

function OrbitDive({ sector, onExit, onComplete }: { sector: OrbitSector; onExit: () => void; onComplete?: () => void }) {
  const clearSector = useOrbit(s => s.clearSector);
  const awardPlayerXp = useGame(s => s.awardPlayerXp);
  const plan = useMemo(() => buildRoomPlan(sector), [sector.id]);

  const [roomIdx, setRoomIdx] = useState(0);
  const room = plan[roomIdx];
  const [status, setStatus] = useState<DiveStatus>(() => initial(room.kind));
  const [enemy, setEnemy] = useState<OrbitEnemy | null>(null);
  const [enemyHp, setEnemyHp] = useState(0);
  const [enemyMaxHp, setEnemyMaxHp] = useState(0);
  const [catHp, setCatHp] = useState(100);
  const [taunt, setTaunt] = useState<string | null>(null);
  const [grab, setGrab] = useState<OrbitLoot[]>([]);
  const [log, setLog] = useState<string[]>([`You enter ${sector.name}.`]);
  const [parallaxRun, setParallaxRun] = useState(false);
  const [catPose, setCatPose] = useState<ScrapperPose>("idle");
  const [enemyPose, setEnemyPose] = useState<EnemyPose>("idle");
  const [catBubble, setCatBubble] = useState<string | null>(null);
  const [enemyBubble, setEnemyBubble] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  function flashCatPose(p: ScrapperPose, ms = 550) {
    setCatPose(p);
    setTimeout(() => setCatPose(prev => (prev === p ? "idle" : prev)), ms);
  }
  function flashEnemyPose(p: EnemyPose, ms = 550) {
    setEnemyPose(p);
    setTimeout(() => setEnemyPose(prev => (prev === p ? "idle" : prev)), ms);
  }
  function sayCat(line: string, ms = 1400) {
    setCatBubble(line);
    setTimeout(() => setCatBubble(prev => (prev === line ? null : prev)), ms);
  }
  function sayEnemy(line: string, ms = 1400) {
    setEnemyBubble(line);
    setTimeout(() => setEnemyBubble(prev => (prev === line ? null : prev)), ms);
  }

  function initial(kind: typeof room.kind): DiveStatus {
    if (kind === "loot") return "lootRoom";
    if (kind === "hazard") return "hazardRoom";
    if (kind === "boss") return "bossRoom";
    return "combat";
  }

  function pushLog(line: string) { setLog(l => [line, ...l].slice(0, 8)); }

  // Initialize enemy for combat/boss rooms
  useEffect(() => {
    if (!room) return;
    if (room.kind === "combat" || room.kind === "boss") {
      const e = ORBIT_ENEMIES[room.enemyId!];
      setEnemy(e);
      setEnemyHp(e.hp);
      setEnemyMaxHp(e.hp);
      setEnemyPose("idle");
      setCatPose("idle");
      if (room.kind === "boss" && e.id === "raccx") {
        setTaunt(RACCX_TAUNTS[Math.floor(Math.random() * RACCX_TAUNTS.length)]);
      }
    } else {
      setEnemy(null);
    }
  }, [roomIdx]);

  function attack(power: number, label: "Swat" | "Pounce" | "Bite") {
    if (!enemy) return;
    const dmg = power + Math.floor(Math.random() * 6);
    const next = Math.max(0, enemyHp - dmg);
    setEnemyHp(next);
    pushLog(`${label} hits for ${dmg}.`);
    const poseKey: ScrapperPose = label === "Swat" ? "swat" : label === "Pounce" ? "pounce" : "bite";
    flashCatPose(poseKey, 600);
    sayCat(randLine(SCRAPPER_LINES[poseKey]));
    setTimeout(() => {
      flashEnemyPose("hurt", 500);
      setShakeKey(k => k + 1);
    }, 180);
    if (next <= 0) {
      setEnemyPose("ko");
      sayCat(randLine(SCRAPPER_LINES.victory), 1800);
      // XP scales with the foe — a Vacuum Mite is a nibble, Racc-X is a feast.
      const xp = Math.max(4, Math.round(enemy.hp / 4));
      awardPlayerXp(xp);
      pushLog(`${enemy.name} defeated! +${xp} XP`);
      setStatus("roomCleared");
      return;
    }
    // Enemy retaliates (Zero-G dodge 20%)
    const dodged = Math.random() < 0.2;
    if (dodged) {
      pushLog(`Zero-G Dodge! Scrapper drifts aside.`);
      setTimeout(() => { flashCatPose("block", 600); sayCat(randLine(SCRAPPER_LINES.block)); }, 500);
      return;
    }
    const taken = enemy.atk + Math.floor(Math.random() * 4);
    setCatHp(h => Math.max(0, h - taken));
    pushLog(`${enemy.name} hits Scrapper for ${taken}.`);
    const lines = ENEMY_LINES[enemy.id];
    setTimeout(() => {
      flashEnemyPose("attack", 550);
      if (lines) sayEnemy(randLine(lines.attack));
    }, 650);
    setTimeout(() => {
      flashCatPose("hurt", 600);
      sayCat(randLine(SCRAPPER_LINES.hurt));
      setShakeKey(k => k + 1);
    }, 1000);
    if (enemy.id === "raccx" && Math.random() < 0.4) {
      setTaunt(RACCX_TAUNTS[Math.floor(Math.random() * RACCX_TAUNTS.length)]);
    }
  }

  function grabLoot() {
    const rolls = 1 + Math.floor(Math.random() * 2);
    const out: OrbitLoot[] = [];
    for (let i = 0; i < rolls; i++) {
      const r = Math.random();
      const tier = r < 0.55 ? "common" : r < 0.85 ? "uncommon" : r < 0.97 ? "rare" : "epic";
      const pool = ORBIT_LOOT.filter(l => l.rarity === tier);
      out.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    setGrab(g => [...g, ...out]);
    out.forEach(o => pushLog(`Grabbed ${o.emoji} ${o.name}`));
    setStatus("roomCleared");
  }

  function ventHazard() {
    setCatHp(h => Math.max(1, h - 8));
    pushLog(`Hazard vents! Scrapper takes 8 from a leaky bin.`);
    setStatus("roomCleared");
  }

  function goDeeper() {
    if (roomIdx >= plan.length - 1) {
      // Sector cleared
      clearSector(sector.id, 4);
      grab.forEach(() => {/* already added via clearSector roll separately */});
      setStatus("summary");
      return;
    }
    setStatus("transitioning");
    setParallaxRun(true);
    pushLog("Floating deeper…");
    setTimeout(() => {
      const nextIdx = roomIdx + 1;
      setRoomIdx(nextIdx);
      setStatus(initial(plan[nextIdx].kind));
      setParallaxRun(false);
    }, 1400);
  }

  // KO handling
  useEffect(() => {
    if (catHp <= 0 && status !== "summary") {
      setCatPose("ko");
      sayCat(randLine(SCRAPPER_LINES.ko), 2200);
      pushLog("Scrapper drifts into the dark. Run ended.");
      setStatus("summary");
    }
  }, [catHp]);

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-secondary">Orbit Trash · Dive</div>
          <h1 className="font-display text-2xl uppercase">{sector.name}</h1>
        </div>
        <button onClick={onExit} className="chunky-button bg-slate-900 px-3 py-1.5 text-[11px] font-bold uppercase">
          ← Abort Dive
        </button>
      </div>

      {/* Stage */}
      <div key={`shake-${shakeKey}`} className={`chunky-panel relative h-80 overflow-hidden bg-black p-0 md:h-[28rem] ${shakeKey > 0 ? "animate-shake" : ""}`}>
        <div className="absolute inset-0">
          <img src={orbitBg} alt="" aria-hidden className="h-full w-full object-cover opacity-50" />
        </div>
        <ParallaxLayers running speed={parallaxRun ? 1 : 0.18} />

        {/* Combatants */}
        {(status === "combat" || status === "bossRoom" || status === "roomCleared") && enemy && (
          <>
            <CombatantSprite
              side="left"
              src={SCRAPPER_POSES[catPose]}
              name="Scrapper"
              bubble={catBubble}
              drifting={false}
              boss={false}
            />
            <CombatantSprite
              side="right"
              src={getEnemyPoses(enemy.id)[enemyPose]}
              name={enemy.name}
              bubble={enemyBubble ?? (status === "bossRoom" && taunt ? taunt : null)}
              drifting={false}
              boss={status === "bossRoom"}
            />
          </>
        )}

        {/* Idle Scrapper for non-combat rooms */}
        {(status === "lootRoom" || status === "hazardRoom" || status === "transitioning") && (
          <CombatantSprite
            side="left"
            src={SCRAPPER_POSES[catHp < 30 ? "hurt" : "idle"]}
            name="Scrapper"
            bubble={catBubble}
            drifting={status === "transitioning"}
            boss={false}
          />
        )}

        {/* Room content overlay */}
        <div className="absolute inset-x-0 top-3 flex items-center justify-center p-2 pointer-events-none">
          {status === "transitioning" && (
            <div className="font-display text-xl uppercase tracking-widest text-secondary animate-pulse">
              Floating deeper…
            </div>
          )}
          {status === "lootRoom" && (
            <div className="chunky-panel bg-amber-500/90 px-4 py-2 text-center text-black">
              <div className="font-display text-xl uppercase">Loot Room</div>
              <div className="text-[10px]">Drifting trash. Grab fast.</div>
            </div>
          )}
          {status === "hazardRoom" && (
            <div className="chunky-panel bg-destructive/90 px-4 py-2 text-center text-white">
              <div className="font-display text-xl uppercase">⚠ Hazard</div>
              <div className="text-[10px]">Vacuum warning. Vent or escape.</div>
            </div>
          )}
          {status === "roomCleared" && (
            <div className="chunky-panel bg-secondary/90 px-4 py-2 text-center text-black">
              <div className="font-display text-xl uppercase">Room Clear</div>
            </div>
          )}
        </div>

        {/* HP bars for combatants */}
        {(status === "combat" || status === "bossRoom") && enemy && (
          <div className="absolute top-12 right-3 w-44 chunky-panel bg-black/80 p-2">
            <div className="flex items-baseline justify-between gap-2">
              <div className="font-display text-[11px] uppercase truncate">{enemy.name}</div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
                {status === "bossRoom" ? "BOSS" : "Foe"}
              </div>
            </div>
            <div className="mt-1 chunky-panel h-2 bg-black p-[2px]">
              <div className="h-full bg-destructive transition-all" style={{ width: `${(enemyHp / enemyMaxHp) * 100}%` }} />
            </div>
            <div className="text-[9px] uppercase text-muted-foreground">{enemyHp} / {enemyMaxHp}</div>
          </div>
        )}
        {/* Room path */}
        <div className="absolute left-3 top-3 flex gap-1">
          {plan.map((r, i) => (
            <span key={i}
              className={`size-3 border border-black ${i < roomIdx ? "bg-secondary" : i === roomIdx ? "bg-primary" : "bg-slate-700"} ${r.kind === "boss" ? "rounded-full" : ""}`}
              title={`${i + 1}. ${r.kind}`}
            />
          ))}
        </div>

        {/* HP bar */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3">
          <span className="font-display text-[10px] uppercase tracking-widest text-white">Scrapper</span>
          <div className="chunky-panel h-3 flex-1 bg-black p-[2px]">
            <div className="h-full bg-primary transition-all" style={{ width: `${catHp}%` }} />
          </div>
          <span className="font-display text-[10px] uppercase tracking-widest text-primary">{catHp} / 100</span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="chunky-panel bg-black/80 p-3">
        {status === "summary" ? (
          <SummaryPanel sector={sector} loot={grab} onExit={onExit} onComplete={onComplete} />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {(status === "combat" || status === "bossRoom") && (
              <>
                <button onClick={() => attack(8, "Swat")} className="chunky-button bg-primary px-3 py-2 text-xs font-bold uppercase text-black">Swat</button>
                <button onClick={() => attack(12, "Pounce")} className="chunky-button bg-accent px-3 py-2 text-xs font-bold uppercase text-black">Magnetic Pounce</button>
                <button onClick={() => attack(5, "Bite")} className="chunky-button bg-slate-900 px-3 py-2 text-xs font-bold uppercase">Bite</button>
              </>
            )}
            {status === "lootRoom" && (
              <button onClick={grabLoot} className="chunky-button bg-amber-400 px-3 py-2 text-xs font-bold uppercase text-black">Grab Trash</button>
            )}
            {status === "hazardRoom" && (
              <button onClick={ventHazard} className="chunky-button bg-destructive px-3 py-2 text-xs font-bold uppercase text-white">Vent Bin (-8 HP)</button>
            )}
            {status === "roomCleared" && (
              <button onClick={goDeeper} className="chunky-button bg-secondary px-3 py-2 text-xs font-bold uppercase text-black">
                {roomIdx >= plan.length - 1 ? "Escape Sector" : "Go Deeper ▶"}
              </button>
            )}
            {status === "transitioning" && (
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Drifting…</span>
            )}
            <div className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">
              Room {roomIdx + 1} / {plan.length}
            </div>
          </div>
        )}
      </div>

      {/* Log */}
      <div className="chunky-panel bg-black/70 p-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-secondary">Dive Log</div>
        <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
          {log.map((l, i) => <li key={i}>· {l}</li>)}
        </ul>
      </div>
    </div>
  );
}

function EnemyBlock({ enemy, hp, max, boss }: { enemy: OrbitEnemy; hp: number; max: number; boss?: boolean }) {
  return (
    <div className={`chunky-panel flex flex-col items-center gap-1 bg-black/80 p-3 ${boss ? "border-fuchsia-500" : ""}`}>
      {!boss && <div className="text-5xl">{enemy.emoji}</div>}
      <div className="font-display text-sm uppercase">{enemy.name}</div>
      <div className="chunky-panel h-2 w-32 bg-black p-[2px]">
        <div className="h-full bg-destructive transition-all" style={{ width: `${(hp / max) * 100}%` }} />
      </div>
      <div className="text-[10px] uppercase text-muted-foreground">{hp} / {max}</div>
    </div>
  );
}

function SummaryPanel({ sector, loot, onExit, onComplete }: { sector: OrbitSector; loot: OrbitLoot[]; onExit: () => void; onComplete?: () => void }) {
  return (
    <div className="space-y-2 text-center">
      <div className="font-display text-2xl uppercase text-secondary">Sector Resolved</div>
      <div className="text-[12px] text-muted-foreground">{sector.name} — added to your conquered list.</div>
      {loot.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1">
          {loot.map((l, i) => (
            <span key={i} className={`border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase ${RARITY_TINT[l.rarity]}`}>
              {l.emoji} {l.name}
            </span>
          ))}
        </div>
      )}
      <button onClick={onComplete ?? onExit} className="chunky-button bg-primary px-4 py-2 text-xs font-bold uppercase text-black">
        {onComplete ? "Continue Story ▸" : "Return to Station Map"}
      </button>
    </div>
  );
}

/* ===================== PARALLAX ===================== */
function ParallaxLayers({ running = true, speed = 0.2 }: { running?: boolean; speed?: number }) {
  // CSS-driven layered parallax. We render 3 layers of emoji "trash" and scroll them via animation.
  const baseDur = 18 / Math.max(0.1, speed);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <Layer dur={baseDur * 2} symbols="✦ ⋆ · ✦ ⋆ · ✦" top="8%" size="text-xs" opacity={0.4} running={running} />
      <Layer dur={baseDur} symbols="🛢️ 📦 🗑️ 🧪 ⚠️ 🛠️" top="30%" size="text-2xl" opacity={0.8} running={running} />
      <Layer dur={baseDur * 0.6} symbols="🥫 🐟 🦴 🧢 🍿 🥄 🔩" top="60%" size="text-3xl" opacity={1} running={running} />
      <Layer dur={baseDur * 0.45} symbols="✨ ✦ ⋆ ✨" top="78%" size="text-sm" opacity={0.6} running={running} />
    </div>
  );
}

function Layer({ symbols, top, dur, size, opacity, running }: {
  symbols: string; top: string; dur: number; size: string; opacity: number; running: boolean;
}) {
  const arr = symbols.split(" ");
  return (
    <div
      className={`absolute left-0 right-0 flex gap-12 whitespace-nowrap ${size}`}
      style={{
        top,
        opacity,
        animation: `orbit-scroll ${dur}s linear infinite ${running ? "running" : "paused"}`,
      }}
    >
      {Array.from({ length: 3 }).map((_, k) => (
        <div key={k} className="flex gap-12">
          {arr.map((s, i) => <span key={i} className="drop-shadow-[0_0_4px_rgba(0,255,180,0.4)]">{s}</span>)}
        </div>
      ))}
    </div>
  );
}

function ScrapperSprite({ drifting, hurt }: { drifting: boolean; hurt: boolean }) {
  return (
    <div
      className="absolute left-6 bottom-12 select-none transition-transform"
      style={{
        transform: drifting ? "translateX(60px) rotate(8deg)" : "translateX(0) rotate(0deg)",
        transitionDuration: "1.2s",
      }}
    >
      <div className={`relative ${hurt ? "animate-pulse" : ""}`}>
        <div className="text-6xl md:text-7xl drop-shadow-[0_0_10px_rgba(0,200,255,0.5)]">😼</div>
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl">🪖</div>
      </div>
    </div>
  );
}