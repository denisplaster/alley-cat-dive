import { useGame } from "@/lib/game/store";

const ICON = {
  info: "›", hit: "⚔️", crit: "✨", loot: "💰", warn: "💢",
} as const;

const TONE = {
  info: "text-muted-foreground",
  hit: "text-primary",
  crit: "text-accent font-bold",
  loot: "text-secondary",
  warn: "text-destructive",
} as const;

export function CombatLog() {
  const log = useGame(s => s.dive!.log);
  return (
    <div className="chunky-panel bg-black/85 p-3">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Combat Log</div>
      <ul className="max-h-[260px] space-y-1 overflow-y-auto text-xs leading-relaxed">
        {[...log].reverse().map(e => (
          <li key={e.id} className={TONE[e.tone]}>
            <span className="mr-1">{ICON[e.tone]}</span>{e.text}
          </li>
        ))}
      </ul>
    </div>
  );
}