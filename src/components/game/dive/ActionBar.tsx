import { useGame } from "@/lib/game/store";
import type { RoomKind } from "@/lib/game/types";
import { lifeStageFromHideout, type LifeStage } from "@/lib/game/lifestage";

// Move sets unlock as the cat grows up. Action ids stay the same so combat
// logic doesn't care which stage we're in — only the labels change.
const MOVES: Record<LifeStage, { id: "scratch" | "pounce" | "item"; label: string; tone?: "secondary" | "accent" }[]> = {
  kitten: [
    { id: "scratch", label: "Swat" },
    { id: "item",    label: "Snack",   tone: "accent" },
  ],
  juvenile: [
    { id: "scratch", label: "Claw" },
    { id: "pounce",  label: "Pounce", tone: "secondary" },
    { id: "item",    label: "Snack",  tone: "accent" },
  ],
  adult: [
    { id: "scratch", label: "Slash" },
    { id: "pounce",  label: "Pounce", tone: "secondary" },
    { id: "item",    label: "Snack",  tone: "accent" },
  ],
};

export function ActionBar() {
  const dive = useGame(s => s.dive)!;
  const hideoutStage = useGame(s => s.hideoutStage);
  const stage = lifeStageFromHideout(hideoutStage);
  const snackCount = useGame(s => s.inventory.filter(i => i.kind === "food").length);
  const doAction = useGame(s => s.doAction);
  const goDeeper = useGame(s => s.goDeeper);
  const resolve = useGame(s => s.resolveNonCombat);
  const toggleAuto = useGame(s => s.toggleAuto);

  const lowHp = dive.catHp / dive.catMaxHp < 0.3;
  const isFinalRoom = dive.room >= dive.totalRooms;

  // Turn-based lock: while the enemy is mid-counter-attack the store flips
  // `dive.inAction = true` and rejects further actions until its counter resolves.
  const locked = dive.inAction;

  // 1) Room cleared → Go Deeper / Claim
  if (dive.roomCleared) {
    return (
      <Bar>
        <Btn label={isFinalRoom ? "CLAIM RUN" : "GO DEEPER"} onClick={goDeeper} primary big />
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
      loot: { label: "GRAB LOOT", tone: "accent" },
      rest: { label: "REST (+HP)", tone: "secondary" },
      hazard: { label: "PUSH THROUGH", tone: "destructive" },
    };
    const cfg = map[k];
    return (
      <Bar>
        <Btn label={cfg.label} onClick={resolve} primary big tone={cfg.tone} />
        <Btn label="Flee" onClick={() => doAction("flee")} tone="destructive" />
      </Bar>
    );
  }

  // 3) Combat — moves depend on life stage
  const moves = MOVES[stage];
  return (
    <Bar>
      {moves.map((m, i) => {
        const isHeal = m.id === "item";
        const noSnacks = isHeal && snackCount === 0;
        const label = isHeal
          ? (snackCount === 0 ? "No Snacks" : (lowHp ? `Heal (${snackCount})` : `Snack (${snackCount})`))
          : m.label;
        return (
          <Btn
            key={m.id}
            label={label}
            onClick={() => doAction(m.id)}
            primary={i === 0}
            tone={m.tone}
            highlight={isHeal && lowHp && !noSnacks}
            disabled={locked || noSnacks}
          />
        );
      })}
      <Btn label="Flee" onClick={() => doAction("flee")} tone="destructive" />
      <Btn label={dive.autoDive ? "Stop Auto" : "Auto"} onClick={toggleAuto} disabled={locked && !dive.autoDive} />
    </Bar>
  );
}

function Bar({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-1.5 md:grid-cols-5 md:gap-2">{children}</div>;
}

function Btn({ label, onClick, primary, big, tone = "default", highlight, disabled }: {
  label: string; onClick: () => void; primary?: boolean; big?: boolean;
  tone?: "default" | "secondary" | "accent" | "destructive";
  highlight?: boolean; disabled?: boolean;
}) {
  const bg = tone === "secondary" ? "bg-secondary text-black"
    : tone === "accent" ? "bg-accent text-black"
    : tone === "destructive" ? "bg-destructive text-destructive-foreground"
    : primary ? "bg-primary text-primary-foreground"
    : "bg-slate-900 text-foreground";
  const span = big ? "col-span-3 md:col-span-4" : "";
  const pulse = (primary || highlight) && !disabled ? "animate-pulse-glow" : "";
  const dim = disabled ? "opacity-60 cursor-not-allowed" : "";
  return (
    <button onClick={onClick} disabled={disabled}
      className={`chunky-button relative px-2 ${big ? "py-3" : "py-2"} font-display uppercase ${big ? "text-lg md:text-xl" : "text-xs md:text-sm"} ${bg} ${span} ${pulse} ${dim}`}>
      {label}
    </button>
  );
}