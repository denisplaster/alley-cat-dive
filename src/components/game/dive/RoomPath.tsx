import type { Room, RoomKind } from "@/lib/game/types";

const ICON: Record<RoomKind, string> = {
  enemy: "⚔️",
  loot: "💰",
  hazard: "☣️",
  rest: "💤",
  miniboss: "👹",
  boss: "👑",
};

export function RoomPath({ rooms, current }: { rooms: Room[]; current: number }) {
  return (
    <div className="chunky-panel bg-black/85 px-2 py-1.5">
      <div className="mb-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        <span>Run Path</span>
        <span>{rooms.filter(r => r.cleared).length}/{rooms.length} cleared</span>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto">
        {rooms.map((r, i) => {
          const isCurrent = i === current - 1;
          const isLast = i === rooms.length - 1;
          const revealed = r.revealed || r.cleared || isCurrent;
          return (
            <div key={i} className="flex items-center gap-1 shrink-0">
              <div className={`relative flex size-7 md:size-9 items-center justify-center chunky-panel text-sm md:text-lg
                ${r.cleared ? "bg-slate-900/80 opacity-60 grayscale" :
                  isCurrent ? "bg-primary text-primary-foreground scale-110 animate-pulse-glow" :
                  revealed ? "bg-slate-800" : "bg-slate-900/60 text-muted-foreground"}
                ${r.kind === "boss" && !r.cleared ? "ring-2 ring-secondary/70" : ""}
              `}>
                {revealed || isCurrent ? ICON[r.kind] : "?"}
                {r.cleared && (
                  <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full border-2 border-black bg-primary text-[8px] text-primary-foreground">🐾</span>
                )}
              </div>
              {!isLast && (
                <div className={`h-1 w-2 md:w-3 ${r.cleared ? "bg-primary" : "bg-slate-700"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}