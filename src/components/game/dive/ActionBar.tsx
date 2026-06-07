import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/game/store";
import type { RoomKind } from "@/lib/game/types";

const ATTACK_COOLDOWN_MS = 750;

export function ActionBar() {
  const dive = useGame(s => s.dive)!;
  const doAction = useGame(s => s.doAction);
  const goDeeper = useGame(s => s.goDeeper);
  const resolve = useGame(s => s.resolveNonCombat);
  const toggleAuto = useGame(s => s.toggleAuto);

  const lowHp = dive.catHp / dive.catMaxHp < 0.3;
  const isFinalRoom = dive.room >= dive.totalRooms;

  // Attack cooldown — disables attack buttons briefly after each action so
  // players can't just mash through fights.
  const [cdUntil, setCdUntil] = useState(0);
  const [, force] = useState(0);
  const rafRef = useRef<number | null>(null);
  const onCooldown = cdUntil > Date.now();
  useEffect(() => {
    if (!onCooldown) return;
    const tick = () => {
      force(n => n + 1);
      if (cdUntil > Date.now()) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [cdUntil, onCooldown]);

  const attack = (a: "scratch" | "pounce" | "item") => {
    if (onCooldown) return;
    doAction(a);
    setCdUntil(Date.now() + ATTACK_COOLDOWN_MS);
  };
  const cdPct = onCooldown
    ? Math.max(0, Math.min(1, (cdUntil - Date.now()) / ATTACK_COOLDOWN_MS))
    : 0;

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

  // 3) Combat
  return (
    <Bar>
      <Btn label="Scratch" onClick={() => attack("scratch")} primary disabled={onCooldown} cooldown={cdPct} />
      <Btn label="Pounce" onClick={() => attack("pounce")} tone="secondary" disabled={onCooldown} cooldown={cdPct} />
      <Btn label={lowHp ? "Heal" : "Item"} onClick={() => attack("item")} tone="accent" highlight={lowHp} disabled={onCooldown} cooldown={cdPct} />
      <Btn label="Flee" onClick={() => doAction("flee")} tone="destructive" />
      <Btn label={dive.autoDive ? "Stop Auto" : "Auto"} onClick={toggleAuto} />
    </Bar>
  );
}

function Bar({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2 md:grid-cols-5">{children}</div>;
}

function Btn({ label, onClick, primary, big, tone = "default", highlight, disabled, cooldown = 0 }: {
  label: string; onClick: () => void; primary?: boolean; big?: boolean;
  tone?: "default" | "secondary" | "accent" | "destructive";
  highlight?: boolean; disabled?: boolean; cooldown?: number;
}) {
  const bg = tone === "secondary" ? "bg-secondary text-black"
    : tone === "accent" ? "bg-accent text-black"
    : tone === "destructive" ? "bg-destructive text-destructive-foreground"
    : primary ? "bg-primary text-primary-foreground"
    : "bg-slate-900 text-foreground";
  const span = big ? "col-span-2 md:col-span-4" : "";
  const pulse = (primary || highlight) && !disabled ? "animate-pulse-glow" : "";
  const dim = disabled ? "opacity-60 cursor-not-allowed" : "";
  return (
    <button onClick={onClick} disabled={disabled}
      className={`chunky-button relative overflow-hidden px-3 ${big ? "py-4" : "py-3"} font-display uppercase ${big ? "text-xl" : "text-base"} ${bg} ${span} ${pulse} ${dim}`}>
      <span className="relative z-10">{label}</span>
      {cooldown > 0 && (
        <span
          className="pointer-events-none absolute inset-y-0 left-0 z-0 bg-black/55"
          style={{ width: `${cooldown * 100}%` }}
        />
      )}
    </button>
  );
}