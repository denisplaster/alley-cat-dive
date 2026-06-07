import { useGame } from "@/lib/game/store";
import { chapterById } from "@/lib/game/story";

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

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {needsChoice ? "Make your choice" : "Tap panel to continue"}
          </p>
          {!needsChoice && (
            <button
              onClick={advance}
              className="chunky-button bg-primary px-4 py-2 text-xs font-bold uppercase text-black"
            >
              {active.panel < panels.length - 1 ? "Next" : active.phase === "intro" ? "Start Dive" : "Continue"}
            </button>
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