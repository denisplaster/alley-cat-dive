import { useGame } from "@/lib/game/store";
import type { RoomKind } from "@/lib/game/types";
import { lifeStageFromHideout, type LifeStage } from "@/lib/game/lifestage";

// Move sets unlock as the cat grows up. Action ids stay the same so combat
// logic doesn't care which stage we're in — only the labels change.
const MOVES: Record<LifeStage, { id: "scratch" | "pounce" | "block" | "item"; label: string; tone?: "secondary" | "accent" }[]> = {
  kitten: [
    { id: "scratch", label: "Swat" },
    { id: "pounce",  label: "Bite",  tone: "secondary" },
    { id: "block",   label: "Guard" },
    { id: "item",    label: "Snack",   tone: "accent" },
  ],
  juvenile: [
    { id: "scratch", label: "Claw" },
    { id: "pounce",  label: "Pounce", tone: "secondary" },
    { id: "block",   label: "Block" },
    { id: "item",    label: "Snack",  tone: "accent" },
  ],
  adult: [
    { id: "scratch", label: "Slash" },
    { id: "pounce",  label: "Pounce", tone: "secondary" },
    { id: "block",   label: "Block" },
    { id: "item",    label: "Snack",  tone: "accent" },
  ],
};

export function ActionBar({ footerActions }: { footerActions?: React.ReactNode } = {}) {
  const dive = useGame(s => s.dive)!;
  const hideoutStage = useGame(s => s.hideoutStage);
  const stage = lifeStageFromHideout(hideoutStage);
  const snackCount = useGame(s => s.inventory.filter(i => i.kind === "food").length);
  const doAction = useGame(s => s.doAction);
  const goDeeper = useGame(s => s.goDeeper);
  const resolve = useGame(s => s.resolveNonCombat);
  const toggleAuto = useGame(s => s.toggleAuto);
  const buySnack = useGame(s => s.buySnack);
  const fishbones = useGame(s => s.fishbones);
  const snackPrice = 30 + snackCount * 15;
  const canAffordSnack = fishbones >= snackPrice;

  const lowHp = dive.catHp / dive.catMaxHp < 0.3;
  const isFinalRoom = dive.room >= dive.totalRooms;

  // Turn-based lock: while the enemy is mid-counter-attack the store flips
  // `dive.inAction = true` and rejects further actions until its counter resolves.
  const locked = dive.inAction;
  const pounceCd = dive.pounceCd ?? 0;
  const intent = dive.enemyIntent;
  const intentLabel = intent === "heavy" ? "💥 Charging Heavy"
    : intent === "block" ? "🛡️ Bracing"
    : intent === "attack" ? "⚔️ Attacking"
    : null;
  const intentTone = intent === "heavy" ? "bg-destructive text-destructive-foreground"
    : intent === "block" ? "bg-secondary text-black"
    : "bg-slate-900 text-foreground";

  // 0) Mid-transition between rooms — disable all input.
  if (dive.transitioning) {
    return (
      <>
        <Bar>
          <Btn label="Diving deeper…" onClick={() => {}} primary big disabled />
        </Bar>
        {footerActions}
      </>
    );
  }

  // 1) Room cleared → Go Deeper / Claim
  if (dive.roomCleared) {
    return (
      <>
        <Bar>
          <Btn label={isFinalRoom ? "CLAIM RUN" : "GO DEEPER"} onClick={goDeeper} primary big />
          <Btn label="Flee" onClick={() => doAction("flee")} tone="destructive" />
        </Bar>
        {footerActions}
      </>
    );
  }

  // 2) Non-combat room → kind-specific resolve
  if (!dive.enemy) {
    const k = dive.currentKind;
    const map: Record<RoomKind, { label: string; tone?: "secondary" | "accent" | "destructive" }> = {
      enemy: { label: "Continue" },
      swarm: { label: "Hold Formation" },
      elite: { label: "Brace Up", tone: "secondary" },
      miniboss: { label: "Continue" },
      boss: { label: "Continue" },
      loot: { label: "GRAB LOOT", tone: "accent" },
      rest: { label: "REST (+HP)", tone: "secondary" },
      hazard: { label: "PUSH THROUGH", tone: "destructive" },
    };
    const cfg = map[k];
    return (
      <>
        <Bar>
          <Btn label={cfg.label} onClick={resolve} primary big tone={cfg.tone} />
          <Btn label="Flee" onClick={() => doAction("flee")} tone="destructive" />
        </Bar>
        {footerActions}
      </>
    );
  }

  // 3) Combat — moves depend on life stage
  const moves = MOVES[stage];
  return (
    <>
    {intentLabel && (
      <div className={`mb-1.5 inline-flex w-full items-center justify-center gap-2 rounded px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${intentTone}`}>
        Next: {intentLabel}
      </div>
    )}
    <Bar>
      {moves.map((m, i) => {
        const isHeal = m.id === "item";
        const isPounce = m.id === "pounce";
        const isBlock = m.id === "block";
        const noSnacks = isHeal && snackCount === 0;
        const onCd = isPounce && pounceCd > 0;
        const label = isHeal
          ? (snackCount === 0 ? "No Snacks" : (lowHp ? `Heal (${snackCount})` : `Snack (${snackCount})`))
          : isPounce && onCd ? `${m.label} (${pounceCd})`
          : isBlock && intent === "block" ? `${m.label} ⚠`
          : m.label;
        return (
          <Btn
            key={m.id}
            label={label}
            onClick={() => doAction(m.id)}
            primary={i === 0}
            tone={m.tone}
            highlight={isHeal && lowHp && !noSnacks}
            disabled={locked || noSnacks || onCd}
          />
        );
      })}
      <Btn label="Flee" onClick={() => doAction("flee")} tone="destructive" />
      <Btn label={dive.autoDive ? "Stop Auto" : "Auto"} onClick={toggleAuto} disabled={locked && !dive.autoDive} />
    </Bar>
    {/* Mid-fight snack vendor — buy a sardine with fishbones if the bag is dry. */}
    <div className="flex items-stretch gap-2">
      <button
        onClick={() => buySnack()}
        disabled={!canAffordSnack}
        className={`chunky-button min-w-0 flex-1 px-3 py-1.5 text-[11px] font-bold uppercase ${canAffordSnack ? "bg-accent text-black" : "bg-slate-900 opacity-60 cursor-not-allowed"}`}
      >
        🐀 Buy Sardine — {snackPrice} 🦴 ({fishbones} avail)
      </button>
      {footerActions}
    </div>
    </>
  );
}

function Bar({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-1 md:grid-cols-5 md:gap-1.5">{children}</div>;
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
      className={`chunky-button relative px-2 ${big ? "py-2.5" : "py-1.5"} font-display uppercase ${big ? "text-lg md:text-xl" : "text-xs md:text-sm"} ${bg} ${span} ${pulse} ${dim}`}>
      {label}
    </button>
  );
}