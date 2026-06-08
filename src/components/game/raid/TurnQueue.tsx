import { motion, AnimatePresence } from "framer-motion";
import { previewQueue } from "@/lib/game/raidEngine";
import type { Actor } from "@/lib/game/raidTypes";

export function TurnQueue({ actors, activeUid }: { actors: Actor[]; activeUid: string | null }) {
  const queue = previewQueue(actors, 7);
  return (
    <div className="chunky-panel flex flex-col gap-1 bg-black/85 p-2">
      <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Turn Order</div>
      <AnimatePresence initial={false}>
        {queue.map((a, i) => (
          <motion.div
            layout
            key={a.uid + "-" + i}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.25 }}
            className={`flex items-center gap-2 border-2 border-black px-1.5 py-1 ${
              a.uid === activeUid ? "bg-primary text-black"
              : a.side === "party" ? "bg-slate-800" : "bg-rose-950"
            }`}
          >
            <span className="font-display text-xs leading-none">{i + 1}</span>
            {a.portrait
              ? <img src={a.portrait} alt="" className="size-6 border border-black object-cover" />
              : <span className="text-base leading-none">{a.emoji ?? "•"}</span>}
            <span className="truncate text-[10px] font-bold uppercase">{a.name}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
