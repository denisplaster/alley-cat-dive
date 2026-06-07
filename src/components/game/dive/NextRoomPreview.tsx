import { useGame } from "@/lib/game/store";
import type { RoomKind } from "@/lib/game/types";

const META: Record<RoomKind, { icon: string; label: string; risk: string; reward: string; tone: string }> = {
  enemy:    { icon: "⚔️", label: "Enemy Encounter", risk: "Low",    reward: "Loot drop",        tone: "text-primary" },
  swarm:    { icon: "🐀", label: "Enemy Swarm",     risk: "Medium", reward: "More loot",         tone: "text-destructive" },
  elite:    { icon: "💢", label: "Elite Threat",    risk: "High",   reward: "Better loot",       tone: "text-secondary" },
  loot:     { icon: "💰", label: "Loot Pile",       risk: "None",   reward: "Free items + 🦴",  tone: "text-accent" },
  hazard:   { icon: "☣️", label: "Toxic Hazard",    risk: "Medium", reward: "Path forward",     tone: "text-destructive" },
  rest:     { icon: "💤", label: "Safe Nest",       risk: "None",   reward: "Restore HP",       tone: "text-secondary" },
  miniboss: { icon: "👹", label: "Mini-Boss",       risk: "High",   reward: "2× loot",          tone: "text-secondary" },
  boss:     { icon: "👑", label: "BOSS",            risk: "EXTREME",reward: "3× loot + caps",   tone: "text-secondary" },
};

export function NextRoomPreview() {
  const dive = useGame(s => s.dive)!;
  if (!dive.roomCleared) return null;
  if (dive.room >= dive.totalRooms) return null;

  const next = dive.rooms[dive.room]; // next index = current room (1-based) since arr is 0-based
  const revealed = next?.revealed;
  const m = revealed && next ? META[next.kind] : null;

  const mm = Math.floor(dive.timerSec / 60);
  const ss = (dive.timerSec % 60).toString().padStart(2, "0");

  return (
    <div className="mt-3 mx-auto max-w-md chunky-panel bg-black/95 px-4 py-3 text-left">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Next Room</div>
      {m ? (
        <>
          <div className={`font-display text-2xl uppercase leading-none ${m.tone}`}>
            <span className="mr-2">{m.icon}</span>{m.label}
          </div>
          <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] font-bold uppercase">
            <div><span className="text-muted-foreground">Risk: </span><span className={m.tone}>{m.risk}</span></div>
            <div><span className="text-muted-foreground">Reward: </span><span className="text-foreground">{m.reward}</span></div>
          </div>
        </>
      ) : (
        <>
          <div className="font-display text-2xl uppercase leading-none text-foreground">❓ Unknown</div>
          <div className="mt-1 text-[11px] font-bold uppercase text-muted-foreground">
            Possible: loot, hazard, or fight
          </div>
        </>
      )}
      <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Truck time: <span className="text-destructive">{mm}:{ss}</span>
      </div>
    </div>
  );
}