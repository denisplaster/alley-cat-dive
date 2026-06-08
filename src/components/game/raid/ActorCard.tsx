import { motion } from "framer-motion";
import type { Actor } from "@/lib/game/raidTypes";
import { ElementIcon } from "./ElementIcon";

export function ActorCard({
  a, isActive, isTarget, flashKey, onClick,
}: {
  a: Actor; isActive?: boolean; isTarget?: boolean; flashKey?: number; onClick?: () => void;
}) {
  const dead = !a.alive;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`chunky-panel w-full text-left p-2 ${dead ? "opacity-40" : ""} ${
        isActive ? "ring-4 ring-primary" : ""
      } ${isTarget ? "ring-4 ring-destructive cursor-pointer hover:scale-[1.02] transition-transform" : ""} ${
        a.side === "party" ? "bg-slate-900" : "bg-rose-950"
      }`}
    >
      <motion.div
        key={flashKey ?? 0}
        initial={flashKey ? { backgroundColor: "rgba(255,80,80,0.6)" } : false}
        animate={{ backgroundColor: "rgba(0,0,0,0)" }}
        transition={{ duration: 0.4 }}
        className="flex items-start gap-2 p-1"
      >
        {a.portrait
          ? <img src={a.portrait} alt={a.name} className="size-14 border-2 border-black bg-black object-cover" />
          : <div className="flex size-14 items-center justify-center border-2 border-black bg-black text-3xl">{a.emoji}</div>}
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
