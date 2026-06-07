import type { Dumpster, Rarity } from "@/lib/game/types";

const LOOT_TIER: Record<Rarity, string> = {
  common: "text-rarity-common",
  uncommon: "text-rarity-uncommon",
  rare: "text-rarity-rare",
  epic: "text-rarity-epic",
  legendary: "text-rarity-legendary",
  mythic: "text-rarity-mythic",
};

export function RunHeader({ dump, room, totalRooms }: { dump: Dumpster; room: number; totalRooms: number }) {
  return (
    <div className="chunky-panel bg-black/90 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="font-display text-xl md:text-2xl uppercase leading-none text-primary">
          {dump.name}
        </div>
        <Pill label="Difficulty">
          <span className="text-accent">
            {"★".repeat(dump.difficulty)}<span className="text-muted-foreground/40">{"★".repeat(6 - dump.difficulty)}</span>
          </span>
        </Pill>
        <Pill label="Loot">
          <span className={`font-display uppercase ${LOOT_TIER[dump.expectedLoot]}`}>{dump.expectedLoot}</span>
        </Pill>
        <Pill label="Rec. Power">
          <span className="font-display text-foreground">⚡{dump.recommendedPower}</span>
        </Pill>
        <Pill label="Room">
          <span className="font-display text-primary">{room}<span className="text-muted-foreground"> / {totalRooms}</span></span>
        </Pill>
      </div>
    </div>
  );
}

function Pill({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-sm font-bold">{children}</span>
    </div>
  );
}