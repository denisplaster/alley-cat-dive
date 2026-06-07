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
    <div className="chunky-panel h-full bg-black/90 px-3 py-1">
      <div className="flex h-full flex-wrap items-center gap-x-3 gap-y-1">
        <div className="font-display text-sm md:text-base uppercase leading-none text-primary">
          {dump.name}
        </div>
        <Pill label="Diff" hideOnMobile>
          <span className="text-accent">
            {"★".repeat(dump.difficulty)}<span className="text-muted-foreground/40">{"★".repeat(6 - dump.difficulty)}</span>
          </span>
        </Pill>
        <Pill label="Loot" hideOnMobile>
          <span className={`font-display uppercase ${LOOT_TIER[dump.expectedLoot]}`}>{dump.expectedLoot}</span>
        </Pill>
        <Pill label="Pwr" hideOnMobile>
          <span className="font-display text-foreground">{dump.recommendedPower}</span>
        </Pill>
        <Pill label="Room">
          <span className="font-display text-primary">{room}<span className="text-muted-foreground"> / {totalRooms}</span></span>
        </Pill>
      </div>
    </div>
  );
}

function Pill({ label, children, hideOnMobile }: { label: string; children: React.ReactNode; hideOnMobile?: boolean }) {
  return (
    <div className={`flex items-baseline gap-1 ${hideOnMobile ? "hidden md:flex" : ""}`}>
      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-xs font-bold">{children}</span>
    </div>
  );
}