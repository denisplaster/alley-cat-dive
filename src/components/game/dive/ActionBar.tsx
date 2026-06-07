import { useGame } from "@/lib/game/store";
import type { RoomKind } from "@/lib/game/types";

export function ActionBar() {
  const dive = useGame(s => s.dive)!;
  const doAction = useGame(s => s.doAction);
  const goDeeper = useGame(s => s.goDeeper);
  const resolve = useGame(s => s.resolveNonCombat);
  const toggleAuto = useGame(s => s.toggleAuto);

  const lowHp = dive.catHp / dive.catMaxHp < 0.3;
  const isFinalRoom = dive.room >= dive.totalRooms;

  // 1) Room cleared → Go Deeper / Claim
  if (dive.roomCleared) {
    return (
      <Bar>
        <Btn label={isFinalRoom ? "🏆 CLAIM RUN" : "▶ GO DEEPER"} onClick={goDeeper} primary big />
        <Btn label="Flee" onClick={() => doAction("flee")} tone="destructive" />
      </Bar>
    );
  }

  // 2) Non-combat room → kind-specific resolve
  if (!dive.enemy) {
    const k = dive.currentKind;
    const map: Record<RoomKind, { label: string; tone?: "secondary" | "accent" | "destructive" }> = {
      enemy: { label: "Continue" },
      miniboss: { label: "Continue" },
      boss: { label: "Continue" },
      loot: { label: "💰 GRAB LOOT", tone: "accent" },
      rest: { label: "💤 NAP (+HP)", tone: "secondary" },
      hazard: { label: "☣️ PUSH THROUGH", tone: "destructive" },
    };
    const cfg = map[k];
    return (
      <Bar>
        <Btn label={cfg.label} onClick={resolve} primary big tone={cfg.tone} />
        <Btn label="Flee" onClick={() => doAction("flee")} tone="destructive" />
      </Bar>
    );
  }

  // 3) Combat
  return (
    <Bar>
      <Btn label="⚔️ Scratch" onClick={() => doAction("scratch")} primary />
      <Btn label="🐾 Pounce" onClick={() => doAction("pounce")} tone="secondary" />
      <Btn label={lowHp ? "🐟 HEAL!" : "🐟 Item"} onClick={() => doAction("item")} tone="accent" highlight={lowHp} />
      <Btn label="💨 Flee" onClick={() => doAction("flee")} tone="destructive" />
      <Btn label={dive.autoDive ? "⏸ Stop Auto" : "⏵ Auto"} onClick={toggleAuto} />
    </Bar>
  );
}

function Bar({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2 md:grid-cols-5">{children}</div>;
}

function Btn({ label, onClick, primary, big, tone = "default", highlight }: {
  label: string; onClick: () => void; primary?: boolean; big?: boolean;
  tone?: "default" | "secondary" | "accent" | "destructive"; highlight?: boolean;
}) {
  const bg = tone === "secondary" ? "bg-secondary text-black"
    : tone === "accent" ? "bg-accent text-black"
    : tone === "destructive" ? "bg-destructive text-destructive-foreground"
    : primary ? "bg-primary text-primary-foreground"
    : "bg-slate-900 text-foreground";
  const span = big ? "col-span-2 md:col-span-4" : "";
  const pulse = (primary || highlight) ? "animate-pulse-glow" : "";
  return (
    <button onClick={onClick}
      className={`chunky-button px-3 ${big ? "py-4" : "py-3"} font-display uppercase ${big ? "text-xl" : "text-base"} ${bg} ${span} ${pulse}`}>
      {label}
    </button>
  );
}