import { useEffect, useState } from "react";
import { useGame } from "@/lib/game/store";
import type { Cat, Enemy, Fx, RoomKind } from "@/lib/game/types";

const KIND_TINT: Record<RoomKind, string> = {
  enemy: "from-emerald-950/60 via-black to-black",
  loot: "from-yellow-900/60 via-black to-black",
  hazard: "from-lime-950/70 via-black to-black",
  rest: "from-cyan-950/60 via-black to-black",
  miniboss: "from-fuchsia-950/60 via-black to-black",
  boss: "from-fuchsia-900/70 via-rose-950/40 to-black",
};

const BG_PROPS = ["🍕","🦴","🥫","📦","🍌","🥡","🍣","🧃","🍔","🧻"];

export function DungeonStage({ cat, enemy }: { cat: Cat; enemy: Enemy | null }) {
  const dive = useGame(s => s.dive)!;
  const tint = KIND_TINT[dive.currentKind];
  const truckPct = dive.timerSec / dive.truckTimerStart;
  const danger = truckPct < 0.1;

  // shake handling
  const [shakeId, setShakeId] = useState(0);
  useEffect(() => { setShakeId(k => k + 1); }, [dive.shakeKey]);

  return (
    <div className={`relative overflow-hidden chunky-panel bg-gradient-to-b ${tint} ${danger ? "animate-danger-border" : ""}`}>
      {/* Backdrop layers */}
      <div className="absolute inset-0 pointer-events-none">
        {/* radial top light */}
        <div className="absolute inset-x-0 -top-20 h-60 bg-[radial-gradient(ellipse_at_center,_rgba(74,222,128,0.35),_transparent_70%)]" />
        {/* slime drips */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="absolute top-0 w-1 h-full bg-gradient-to-b from-toxic/70 via-toxic/30 to-transparent animate-drip"
            style={{ left: `${10 + i * 18}%`, animationDelay: `${i * 0.7}s`, animationDuration: `${4 + i}s`, opacity: 0.5 }} />
        ))}
        {/* background prop emojis */}
        {BG_PROPS.map((p, i) => (
          <span key={i} className="absolute text-2xl md:text-3xl opacity-25 select-none"
            style={{
              left: `${(i * 17) % 92 + 3}%`,
              top: `${(i * 23) % 78 + 12}%`,
              transform: `rotate(${(i*37)%60 - 30}deg)`,
            }}>{p}</span>
        ))}
        {/* flies */}
        <span className="absolute left-[18%] top-[22%] animate-fly text-lg opacity-80">🪰</span>
        <span className="absolute right-[14%] top-[40%] animate-fly text-base opacity-70" style={{ animationDelay: "1.2s" }}>🪰</span>
        <span className="absolute left-[44%] bottom-[20%] animate-fly text-xl opacity-70" style={{ animationDelay: "2.4s" }}>🪰</span>
        {/* dumpster lip top */}
        <div className="absolute inset-x-0 top-0 h-3 bg-black/80 border-b-4 border-toxic/70" />
        {/* floor glow */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-toxic/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-9 h-[3px] bg-toxic/80 shadow-[0_0_18px_4px_rgba(74,222,128,0.6)]" />
      </div>

      {/* Stage with shake */}
      <div key={shakeId} className={dive.shakeKey > 0 ? (dive.shakeHard ? "animate-shake-hard" : "animate-shake") : ""}>
        <div className="relative grid grid-cols-2 gap-4 p-6 md:p-10 min-h-[320px] md:min-h-[380px]">
          <CombatantSprite
            name={cat.name}
            sub={cat.catClass}
            portrait={cat.portrait}
            hp={dive.catHp}
            maxHp={dive.catMaxHp}
            side="left"
            flashKey={dive.catFlashKey}
            fx={dive.fx.filter(f => f.target === "cat")}
            tone="primary"
          />
          {enemy ? (
            <CombatantSprite
              key={`${enemy.id}-${dive.room}`}
              emoji={enemy.emoji}
              name={enemy.name}
              sub={dive.currentKind === "boss" ? "BOSS" : dive.currentKind === "miniboss" ? "MINI-BOSS" : "Trash Mob"}
              hp={enemy.hp}
              maxHp={enemy.maxHp}
              side="right"
              flashKey={dive.enemyFlashKey}
              defeatKey={enemy.hp <= 0 ? dive.enemyDefeatKey : 0}
              fx={dive.fx.filter(f => f.target === "enemy")}
              tone={dive.currentKind === "boss" ? "boss" : "destructive"}
            />
          ) : (
            <NonCombatPanel kind={dive.currentKind} cleared={dive.roomCleared} />
          )}
        </div>
      </div>

      {/* Room cleared banner */}
      {dive.roomCleared && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="animate-banner-slam chunky-panel bg-primary text-primary-foreground px-8 py-4 text-center">
            <div className="font-display text-4xl md:text-5xl tracking-widest leading-none">
              {dive.room >= dive.totalRooms ? "DUMPSTER CLEARED" : "ROOM CLEARED"}
            </div>
            {dive.roomEvent && (
              <div className="mt-2 font-bold text-sm uppercase tracking-wider">{dive.roomEvent}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CombatantSprite({
  name, sub, portrait, emoji, hp, maxHp, side, flashKey, defeatKey = 0, fx, tone,
}: {
  name: string; sub: string; portrait?: string; emoji?: string;
  hp: number; maxHp: number; side: "left" | "right";
  flashKey: number; defeatKey?: number; fx: Fx[];
  tone: "primary" | "destructive" | "boss";
}) {
  const [flashId, setFlashId] = useState(0);
  useEffect(() => { if (flashKey > 0) setFlashId(k => k + 1); }, [flashKey]);
  const pct = (hp / maxHp) * 100;
  const low = pct > 0 && pct < 30;
  const dead = hp <= 0;
  const barColor = tone === "primary" ? "bg-primary" : tone === "boss" ? "bg-secondary" : "bg-destructive";
  const align = side === "left" ? "items-start" : "items-end";
  const portraitSize = "size-28 md:size-32";

  return (
    <div className={`relative flex flex-col ${align} justify-end gap-2`}>
      {/* Floating numbers anchor */}
      <div className="relative">
        <FloatingNumbers fx={fx} />
        {dead && defeatKey > 0 && <DefeatBurst k={defeatKey} />}
        <div className={`relative ${portraitSize} ${low ? "animate-pulse-glow" : ""} ${dead ? "opacity-30 grayscale" : ""}`}>
          {portrait ? (
            <img src={portrait} alt={name} className={`size-full chunky-panel object-cover bg-slate-800`} />
          ) : (
            <div className={`size-full chunky-panel flex items-center justify-center text-6xl md:text-7xl ${tone === "boss" ? "bg-secondary/30" : "bg-slate-800"}`}>
              {emoji}
            </div>
          )}
          {/* hit flash */}
          {flashId > 0 && (
            <div key={flashId} className="pointer-events-none absolute inset-0 bg-white animate-flash-hit" />
          )}
        </div>
        {/* shadow */}
        <div className="mx-auto mt-1 h-1.5 w-20 rounded-full bg-black/70 blur-sm" />
      </div>

      {/* HP block */}
      <div className={`w-full max-w-[260px] ${side === "right" ? "self-end text-right" : ""}`}>
        <div className="flex items-baseline justify-between gap-2">
          <div className="font-display text-lg uppercase leading-none truncate">{name}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{sub}</div>
        </div>
        <div className="mt-1 h-3 border-2 border-black bg-slate-900 grid grid-cols-10 gap-px overflow-hidden">
          {Array.from({ length: 10 }).map((_, i) => {
            const filled = (pct / 10) > i;
            return <div key={i} className={`${filled ? barColor : "bg-transparent"}`} />;
          })}
        </div>
        <div className="mt-0.5 font-mono text-[10px] font-bold">{hp}/{maxHp}</div>
      </div>
    </div>
  );
}

function FloatingNumbers({ fx }: { fx: Fx[] }) {
  const clearFx = useGame(s => s.clearFx);
  useEffect(() => {
    const timers = fx.map(f => setTimeout(() => clearFx(f.id), 900));
    return () => { timers.forEach(clearTimeout); };
  }, [fx, clearFx]);
  return (
    <div className="pointer-events-none absolute left-1/2 top-2 z-10">
      {fx.map(f => {
        const cls = f.kind === "crit" ? "text-accent text-4xl md:text-5xl"
          : f.kind === "heal" ? "text-primary text-2xl"
          : f.kind === "miss" ? "text-muted-foreground text-xl"
          : "text-destructive text-2xl";
        const label = f.kind === "heal" ? `+${f.amount}` : f.kind === "miss" ? "MISS" : `-${f.amount}`;
        const suffix = f.kind === "crit" ? "  CRIT!" : "";
        return (
          <span key={f.id} className={`absolute left-0 top-0 -translate-x-1/2 font-display font-black drop-shadow-[2px_2px_0_#000] animate-rise-fade ${cls}`}>
            {label}{suffix}
          </span>
        );
      })}
    </div>
  );
}

function DefeatBurst({ k }: { k: number }) {
  const parts = Array.from({ length: 8 });
  return (
    <div key={k} className="pointer-events-none absolute inset-0 z-10">
      {parts.map((_, i) => {
        const a = (i / parts.length) * Math.PI * 2;
        const r = 60;
        return (
          <span key={i}
            className="absolute left-1/2 top-1/2 text-2xl animate-burst"
            style={{
              ["--bx" as never]: `${Math.cos(a) * r}px`,
              ["--by" as never]: `${Math.sin(a) * r}px`,
              animationDelay: `${i * 20}ms`,
            }}>
            ✨
          </span>
        );
      })}
    </div>
  );
}

function NonCombatPanel({ kind, cleared }: { kind: RoomKind; cleared: boolean }) {
  const meta = {
    loot: { icon: "💰", title: "LOOT PILE", desc: "A shimmering mound of trash treasure." },
    hazard: { icon: "☣️", title: "HAZARD", desc: "Glowing goo bubbling from a busted jar." },
    rest: { icon: "💤", title: "SAFE NEST", desc: "Warm laundry. The cat can catch a breath." },
    enemy: { icon: "⚔️", title: "EMPTY", desc: "" },
    miniboss: { icon: "👹", title: "EMPTY", desc: "" },
    boss: { icon: "👑", title: "EMPTY", desc: "" },
  }[kind];
  return (
    <div className="relative flex flex-col items-end justify-end gap-2">
      <div className={`size-28 md:size-32 chunky-panel flex items-center justify-center text-7xl bg-slate-800 ${cleared ? "opacity-40 grayscale" : "animate-floaty"}`}>
        {meta.icon}
      </div>
      <div className="mx-auto mt-1 h-1.5 w-20 rounded-full bg-black/70 blur-sm" />
      <div className="w-full max-w-[260px] text-right">
        <div className="font-display text-lg uppercase leading-none">{meta.title}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{meta.desc}</div>
      </div>
    </div>
  );
}