import { AnimatePresence, motion } from "framer-motion";
import type { OverdriveDef } from "@/lib/game/raidTypes";

export function OverdriveOverlay({ overlay }: { overlay: { def: OverdriveDef; key: number } | null }) {
  return (
    <AnimatePresence>
      {overlay && (
        <motion.div
          key={overlay.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: 6, opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className={`absolute size-40 rounded-full ${overlay.def.tint} blur-2xl`}
          />
          <motion.div
            initial={{ scale: 0.6, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="chunky-panel relative z-10 bg-black/90 px-6 py-4 text-center"
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-secondary">OVERDRIVE</div>
            <div className="font-display text-3xl uppercase">{overlay.def.name}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
