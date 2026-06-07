import { createFileRoute } from "@tanstack/react-router";
import { useGame } from "@/lib/game/store";
import { STORY_CHAPTERS } from "@/lib/game/story";
import { EVOLUTIONS, computeEvolution, nextEvolutionHint } from "@/lib/game/evolution";

export const Route = createFileRoute("/story")({
  head: () => ({
    meta: [
      { title: "Story — Alley Cat Dumpster Divers" },
      { name: "description", content: "From abandoned kitten to alley legend. Play the chapters." },
      { property: "og:title", content: "Story" },
      { property: "og:description", content: "From abandoned kitten to alley legend." },
    ],
  }),
  component: StoryScreen,
});

function StoryScreen() {
  const completed = useGame(s => s.completedChapters);
  const chapterIdx = useGame(s => s.storyChapterIdx);
  const choices = useGame(s => s.storyChoices);
  const openCutscene = useGame(s => s.openCutscene);
  const roomsCleared = useGame(s => s.roomsCleared);
  const bossesBeaten = useGame(s => s.bossesBeaten);
  const progress = { completedChapters: completed, roomsCleared, bossesBeaten };
  const evo = EVOLUTIONS[computeEvolution(progress)];
  const evoHint = nextEvolutionHint(progress);
  const current = STORY_CHAPTERS[chapterIdx];

  return (
    <div className="mt-6 space-y-4">
      <header>
        <h1 className="font-display text-4xl uppercase md:text-5xl">Story</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          From a tin can to the throne of the alley.
        </p>
      </header>

      {/* Campaign status card */}
      <div className="chunky-panel grid grid-cols-1 gap-3 bg-black/80 p-4 md:grid-cols-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-secondary">Current Form</div>
          <div className="font-display text-xl uppercase">{evo.name}</div>
          <div className="text-[11px] italic text-muted-foreground">{evo.tagline}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-secondary">Next Goal</div>
          <div className="font-display text-sm uppercase leading-tight">
            {current ? current.title : "Campaign complete"}
          </div>
          <div className="text-[11px] italic text-muted-foreground">
            {current ? current.subtitle : "Legend of the alley."}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-secondary">Progression</div>
          <div className="text-[11px] uppercase">{completed.length} / {STORY_CHAPTERS.length} chapters</div>
          <div className="text-[11px] uppercase">{roomsCleared} rooms · {bossesBeaten} bosses</div>
          {evoHint && <div className="mt-1 text-[10px] italic text-primary">{evoHint}</div>}
        </div>
      </div>

      <div className="space-y-3">
        {STORY_CHAPTERS.map((ch, i) => {
          const isDone = completed.includes(ch.id);
          const isCurrent = i === chapterIdx && !isDone;
          const isLocked = i > chapterIdx;
          const choice = choices[ch.id];
          return (
            <div
              key={ch.id}
              className={`chunky-panel p-4 ${isCurrent ? "bg-primary/15 border-primary" : "bg-black/80"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-display text-lg uppercase leading-tight">{ch.title}</h3>
                  <p className="text-[11px] italic text-muted-foreground">{ch.subtitle}</p>
                  {choice && ch.choice && (
                    <p className="mt-2 text-[11px] uppercase tracking-wider text-secondary">
                      Choice: {ch.choice.options.find(o => o.id === choice)?.label ?? choice}
                    </p>
                  )}
                  {/* Unlock list */}
                  {ch.rewards && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ch.rewards.map((r, idx) => (
                        <span key={idx}
                          className={`border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase ${
                            isLocked ? "bg-slate-900 text-muted-foreground" : "bg-slate-900 text-foreground"
                          }`}
                        >
                          {r.icon} {r.label}
                        </span>
                      ))}
                    </div>
                  )}
                  {isLocked && ch.unlockRequirement && (
                    <p className="mt-2 text-[10px] uppercase tracking-wider text-destructive">
                      🔒 {ch.unlockRequirement}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {isDone && (
                    <span className="border-2 border-black bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-black">Done</span>
                  )}
                  {isCurrent && (
                    <button
                      onClick={() => openCutscene(ch.id, "intro")}
                      className="chunky-button bg-primary px-3 py-2 text-xs font-bold uppercase text-black"
                    >
                      Play
                    </button>
                  )}
                  {isLocked && (
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Locked</span>
                  )}
                  {isDone && (
                    <button
                      onClick={() => openCutscene(ch.id, "intro")}
                      className="chunky-button bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase"
                    >
                      Replay
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}