import { useGame } from "@/lib/game/store";
import type { RoomKind } from "@/lib/game/types";

const KIND_NAME: Record<RoomKind, string> = {
  enemy: "fight", swarm: "enemy pack", elite: "elite threat", loot: "loot pile", hazard: "hazard", rest: "safe nest",
  miniboss: "mini-boss", boss: "BOSS",
};

export function Objective() {
  const dive = useGame(s => s.dive)!;
  const truckPct = dive.timerSec / dive.truckTimerStart;
  const lowTimer = truckPct < 0.25;
  const finalRoom = dive.room >= dive.totalRooms;

  let text = "";
  let tone = "text-primary";

  if (dive.roomCleared) {
    if (finalRoom) {
      text = "Objective: Climb out and claim the run!";
      tone = "text-accent";
    } else {
      const next = dive.rooms[dive.room]; // next index
      const knownKind = next?.revealed ? KIND_NAME[next.kind] : "the unknown";
      text = lowTimer
        ? `Objective: The truck is close — push deeper into ${knownKind} only if you dare.`
        : `Objective: Choose — push deeper into ${knownKind} or flee with your loot.`;
      tone = lowTimer ? "text-destructive" : "text-accent";
    }
  } else if (dive.enemy) {
    const foeText = dive.enemies.length > 1
      ? `${dive.enemies.length} enemies`
      : `the ${dive.enemy.name}`;
    text = lowTimer
      ? `Objective: Drop ${foeText} — the truck is almost here!`
      : `Objective: Defeat ${foeText} before the truck arrives.`;
    tone = lowTimer ? "text-destructive" : "text-primary";
  } else {
    const k = dive.currentKind;
    text = `Objective: Investigate the ${KIND_NAME[k]}.`;
    tone = k === "hazard" ? "text-destructive" : k === "loot" ? "text-accent" : "text-primary";
  }

  return (
    <div className="chunky-panel bg-black/90 px-3 py-2">
      <div className={`text-xs md:text-sm font-bold uppercase tracking-wider ${tone}`}>
        {text}
      </div>
    </div>
  );
}