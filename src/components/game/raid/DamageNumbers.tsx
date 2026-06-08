import { AnimatePresence, motion } from "framer-motion";
import type { FloatingNumber } from "@/lib/game/raidTypes";

export function DamageNumbers({ floats }: { floats: FloatingNumber[] }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <AnimatePresence>
        {floats.slice(-12).map(f => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -50, scale: f.kind === "crit" ? 1.4 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1 }}
            data-uid={f.uid}
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 font-display text-2xl ${
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
  );
}
