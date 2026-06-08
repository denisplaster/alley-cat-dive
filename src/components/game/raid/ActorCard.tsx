import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Actor, FloatingNumber } from "@/lib/game/raidTypes";
import { ElementIcon } from "./ElementIcon";

export function ActorCard({
  a, isActive, isTarget, flashKey, onClick, floats,
}: {
  a: Actor; isActive?: boolean; isTarget?: boolean; flashKey?: number;
  onClick?: () => void; floats?: FloatingNumber[];
}) {
  const dead = !a.alive;
  // Auto-expire damage popups: each new float lives ~1.1s then disappears.
  const [visible, setVisible] = useState<FloatingNumber[]>([]);
  useEffect(() => {
    if (!floats?.length) return;
    const known = new Set(visible.map(v => v.id));
    const fresh = floats.filter(f => !known.has(f.id));
    if (!fresh.length) return;
    setVisible(v => [...v, ...fresh]);
    const timers = fresh.map(f =>
      setTimeout(() => setVisible(v => v.filter(x => x.id !== f.id)), 1100));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floats]);

  const facing = a.side === "party" ? "" : "scale-x-[-1]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`chunky-panel relative w-full text-left p-2 ${dead ? "opacity-40" : ""} ${
        isActive ? "ring-4 ring-primary" : ""
      } ${isTarget ? "ring-4 ring-destructive cursor-pointer hover:scale-[1.02] transition-transform" : ""} ${
        a.side === "party"
          ? "bg-gradient-to-r from-slate-900 to-slate-800"
          : "bg-gradient-to-l from-rose-950 to-rose-900"
      }`}
    >
      <motion.div
        key={flashKey ?? 0}
        initial={flashKey ? { backgroundColor: "rgba(255,80,80,0.6)" } : false}
        animate={{ backgroundColor: "rgba(0,0,0,0)" }}
        transition={{ duration: 0.4 }}
        className="relative flex items-start gap-2 p-1"
      >
        <div className={`relative flex size-24 shrink-0 items-end justify-center overflow-hidden border-2 border-black ${
          a.side === "party" ? "bg-gradient-to-b from-slate-950 to-indigo-950" : "bg-gradient-to-b from-rose-950 to-black"
        }`}>
          {/* subtle stage glow */}
          <div className={`absolute inset-x-0 bottom-0 h-6 ${a.side === "party" ? "bg-primary/20" : "bg-destructive/20"} blur-md`} />
          {a.portrait ? (
            <motion.img
              src={a.portrait} alt={a.name} loading="lazy"
              animate={dead ? { y: 0, rotate: 90, opacity: 0.5 } : { y: [0, -3, 0] }}
              transition={dead ? { duration: 0.4 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className={`relative h-full w-auto object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] ${facing}`}
            />
          ) : (
            <span className={`relative text-5xl ${facing}`}>{a.emoji}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <div className="truncate font-display text-sm uppercase leading-none">{a.name}</div>
            <ElementIcon el={a.element} />
          </div>
          <Bar label="HP" v={a.hp} max={a.maxHp} color="bg-emerald-500" />
          {a.side === "party" && <Bar label="MP" v={a.mp} max={a.maxMp} color="bg-cyan-500" />}
          <Bar label="OD" v={a.od} max={a.odMax} color="bg-amber-400" />
          {a.side === "enemy" && a.knownTypes.length > 0 && (
            <div className="mt-1 flex gap-1">
              {a.knownTypes.map(t => (
                <span key={t} className="border border-black bg-black/60 px-1 text-[9px]">
                  Weak: <ElementIcon el={t} size="xs" />
                </span>
              ))}
            </div>
          )}
          {a.statuses.some(s => s.id === "defend") && (
            <div className="mt-0.5 text-[9px] font-bold uppercase text-secondary">🛡 Defending</div>
          )}
          {dead && <div className="text-[10px] font-bold uppercase text-destructive">KO</div>}
        </div>
        {/* Floating damage / heal numbers anchored to this actor */}
        <div className="pointer-events-none absolute inset-0">
          <AnimatePresence>
            {visible.map(f => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 10, scale: 0.7 }}
                animate={{ opacity: 1, y: -36, scale: f.kind === "crit" ? 1.5 : 1.1 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 1.0, ease: "easeOut" }}
                className={`absolute left-10 top-8 font-display text-2xl drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] ${
                  f.kind === "crit" ? "text-amber-300"
                  : f.kind === "heal" ? "text-emerald-300"
                  : f.kind === "weak" ? "text-rose-300"
                  : f.kind === "resist" ? "text-cyan-300"
                  : f.kind === "null" ? "text-muted-foreground"
                  : "text-white"
                }`}
              >
                {f.kind === "null" ? "—" : f.kind === "heal" ? `+${f.amount}` : f.amount}
                {f.kind === "crit" && " ★"}
                {f.kind === "weak" && "!"}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </button>
  );
}

function Bar({ label, v, max, color }: { label: string; v: number; max: number; color: string }) {
  const pct = max ? Math.max(0, Math.min(100, (v / max) * 100)) : 0;
  return (
    <div className="mt-1">
      <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
        <span>{label}</span><span>{Math.round(v)}/{max}</span>
      </div>
      <div className="h-1.5 border border-black bg-slate-950">
        <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} className={`h-full ${color}`} />
      </div>
    </div>
  );
}
