import { createFileRoute } from "@tanstack/react-router";
import { useGame } from "@/lib/game/store";
import { STORY_CHAPTERS } from "@/lib/game/story";

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

  return (
    <div className="mt-6 space-y-4">
      <header>
        <h1 className="font-display text-4xl uppercase md:text-5xl">Story</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          From a tin can to the throne of the alley.
        </p>
      </header>

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