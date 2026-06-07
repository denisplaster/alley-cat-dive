import { useGame } from "@/lib/game/store";
import { chapterById } from "@/lib/game/story";
import { EVOLUTIONS } from "@/lib/game/evolution";
import { Link } from "@tanstack/react-router";

const SPEAKER_LABEL: Record<string, string> = {
  kitten: "Kitten",
  narrator: "",
  scrapper: "Scrapper",
  rival: "Rival",
  boss: "Bin Boss",
};

export function Cutscene() {
  const active = useGame(s => s.activeCutscene);
  const advance = useGame(s => s.advanceCutscene);
  const close = useGame(s => s.closeCutscene);
  const choices = useGame(s => s.storyChoices);
  const makeChoice = useGame(s => s.makeChoice);
  const pendingReward = useGame(s => s.pendingReward);
  const dismissReward = useGame(s => s.dismissReward);

  // Reward panel takes priority once an outro completes.
  if (pendingReward) {
    const ch = chapterById(pendingReward.chapterId);
    if (!ch) { dismissReward(); return null; }
    const evo = pendingReward.newEvolution ? EVOLUTIONS[pendingReward.newEvolution] : null;
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-2xl animate-[fade-in_0.4s_ease-out]">
          <div className="mb-3 text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary animate-pulse">
              Chapter Complete
            </div>
            <h2 className="font-display text-3xl uppercase leading-tight text-primary drop-shadow-[0_0_18px_rgba(74,222,128,0.55)] md:text-4xl">
              {ch.title.replace(/^Chapter \d+\s—\s/, "")}
            </h2>
            <p className="text-[11px] italic text-muted-foreground">{ch.subtitle}</p>
          </div>

          {evo && (
            <div className="chunky-panel mb-3 rotate-[-1deg] bg-primary/20 p-3 ring-2 ring-primary">
              <div className="text-[10px] font-bold uppercase tracking-widest text-primary">New Cat Form</div>
              <div className="font-display text-2xl uppercase">{evo.name}</div>
              <div className="text-[11px] italic text-muted-foreground">{evo.tagline}</div>
              <div className="mt-2 flex flex-wrap gap-1 text-[10px] uppercase">
                {evo.actions.map(a => (
                  <span key={a} className="border-2 border-black bg-black/60 px-2 py-0.5">{a}</span>
                ))}
              </div>
              <div className="mt-2 flex gap-2 text-[10px] uppercase tracking-wider">
                <span className="border-2 border-black bg-accent px-2 py-0.5 text-black">+{evo.statBonus.atk} ATK</span>
                <span className="border-2 border-black bg-accent px-2 py-0.5 text-black">+{evo.statBonus.def} DEF</span>
                <span className="border-2 border-black bg-accent px-2 py-0.5 text-black">+{evo.statBonus.hp} HP</span>
              </div>
            </div>
          )}

          <div className="chunky-panel bg-black/85 p-4">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-secondary">Unlocks</div>
            <ul className="space-y-2">
              {(ch.rewards ?? []).map((r, i) => (
                <li key={i} className="flex items-center gap-3 border-2 border-black bg-slate-900/80 p-2">
                  <span className="text-2xl">{r.icon}</span>
                  <div className="flex-1">
                    <div className="font-display text-sm uppercase leading-tight">{r.label}</div>
                    <div className="text-[11px] italic text-muted-foreground">{r.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex flex-col gap-2 md:flex-row md:justify-end">
            <Link
              to="/hideout"
              onClick={dismissReward}
              className="chunky-button bg-slate-900 px-4 py-2 text-center text-xs font-bold uppercase"
            >
              View Hideout
            </Link>
            <button
              onClick={dismissReward}
              className="chunky-button bg-primary px-6 py-2 text-xs font-bold uppercase text-black"
            >
              Claim & Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!active) return null;
  const chapter = chapterById(active.chapterId);
  if (!chapter) return null;
  const panels = active.phase === "intro" ? chapter.intro : chapter.outro;
  const panel = panels[active.panel];
  if (!panel) return null;

  const isLastOutroPanel =
    active.phase === "outro" && active.panel === panels.length - 1;
  const needsChoice = isLastOutroPanel && chapter.choice && !choices[chapter.id];
  const speakerLabel = panel.speaker ? SPEAKER_LABEL[panel.speaker] : "";
  const isLastIntroPanel = active.phase === "intro" && active.panel === panels.length - 1;
  const nextLabel = active.panel < panels.length - 1
    ? "Next ▸"
    : active.phase === "intro" ? "Start Dive ▶" : "Continue ▸";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl">
        {/* Chapter banner */}
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
              {active.phase === "intro" ? "Chapter Begins" : "Chapter Ends"}
            </div>
            <h2 className="font-display text-2xl uppercase leading-tight md:text-3xl">
              {chapter.title}
            </h2>
            <p className="text-[11px] italic text-muted-foreground">{chapter.subtitle}</p>
          </div>
          <button
            onClick={close}
            className="chunky-button bg-slate-900 px-2 py-1 text-[10px] font-bold uppercase"
          >
            Skip
          </button>
        </div>

        {/* Manga panel */}
        <div
          className="chunky-panel relative aspect-[4/3] cursor-pointer overflow-hidden bg-black"
          onClick={() => { if (!needsChoice) advance(); }}
        >
          <img
            key={`${chapter.id}-${active.phase}-${active.panel}`}
            src={panel.image}
            alt=""
            className="h-full w-full animate-[fade-in_0.4s_ease-out] object-cover"
          />
          {/* Speech bubble */}
          {panel.text && (
            <div className="absolute inset-x-3 bottom-3 md:inset-x-6 md:bottom-6">
              {panel.speaker === "narrator" ? (
                <div className="chunky-panel border-2 border-black bg-black/85 px-4 py-3 text-sm leading-snug text-foreground md:text-base">
                  <p className="italic">{panel.text}</p>
                </div>
              ) : (
                <div className="chunky-panel relative bg-white px-4 py-3 text-black">
                  {speakerLabel && (
                    <div className="absolute -top-3 left-3 border-2 border-black bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-black">
                      {speakerLabel}
                    </div>
                  )}
                  <p className="text-sm font-bold leading-snug md:text-base">{panel.text}</p>
                </div>
              )}
            </div>
          )}

          {/* Panel indicator */}
          <div className="absolute right-3 top-3 flex gap-1">
            {panels.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-6 border border-black ${i <= active.panel ? "bg-primary" : "bg-white/30"}`}
              />
            ))}
          </div>
        </div>

        {/* Footer — Next + Skip always visible. */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={close}
              className="chunky-button bg-slate-900 px-3 py-2 text-[11px] font-bold uppercase"
            >
              Skip
            </button>
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {active.panel + 1} / {panels.length}
            </span>
          </div>
          {!needsChoice && (
            isLastIntroPanel ? (
              <Link
                to="/dive"
                onClick={advance}
                className="chunky-button animate-pulse-glow bg-primary px-4 py-2 text-xs font-bold uppercase text-black"
              >
                {nextLabel}
              </Link>
            ) : (
              <button
                onClick={advance}
                className="chunky-button bg-primary px-4 py-2 text-xs font-bold uppercase text-black"
              >
                {nextLabel}
              </button>
            )
          )}
          {needsChoice && (
            <span className="text-[11px] uppercase tracking-widest text-primary">Make your choice ↓</span>
          )}
        </div>

        {/* Choice overlay */}
        {needsChoice && chapter.choice && (
          <div className="mt-4 chunky-panel bg-black/85 p-4">
            <p className="mb-3 text-center font-display text-lg uppercase">
              {chapter.choice.question}
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              {chapter.choice.options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    makeChoice(chapter.id, opt.id);
                    advance();
                  }}
                  className="chunky-button bg-secondary px-3 py-3 text-left text-black hover:bg-secondary/80"
                >
                  <div className="font-display text-base uppercase">{opt.label}</div>
                  <div className="text-[11px] italic opacity-80">{opt.blurb}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}