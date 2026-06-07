import { createFileRoute } from "@tanstack/react-router";
import { useGame } from "@/lib/game/store";
import type { Cat } from "@/lib/game/types";
import { EVOLUTIONS, computeEvolution } from "@/lib/game/evolution";

export const Route = createFileRoute("/crew")({
  head: () => ({
    meta: [
      { title: "Cat Crew — Alley Cat Dumpster Divers" },
      { name: "description", content: "Your scrappy crew of alley cats. Pick your diver." },
      { property: "og:title", content: "Cat Crew" },
      { property: "og:description", content: "Pick your alley cat diver." },
    ],
  }),
  component: CrewScreen,
});

function CrewScreen() {
  const cats = useGame(s => s.cats);
  const activeId = useGame(s => s.activeCatId);
  const setActive = useGame(s => s.setActiveCat);
  const completed = useGame(s => s.completedChapters);
  const roomsCleared = useGame(s => s.roomsCleared);
  const bossesBeaten = useGame(s => s.bossesBeaten);
  const evo = EVOLUTIONS[computeEvolution({ completedChapters: completed, roomsCleared, bossesBeaten })];

  return (
    <div className="mt-6">
      <header className="mb-6">
        <h1 className="font-display text-4xl uppercase md:text-5xl">Cat Crew</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Five strays. One alley. Infinite problems.</p>
      </header>
      <div className="chunky-panel mb-4 flex flex-wrap items-center gap-3 bg-black/80 p-3">
        <span className="border-2 border-black bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-black">
          Main Cat Evolution
        </span>
        <span className="font-display text-lg uppercase">{evo.name}</span>
        <span className="text-[11px] italic text-muted-foreground">{evo.tagline}</span>
        <span className="ml-auto text-[10px] uppercase text-secondary">
          +{evo.statBonus.atk} ATK · +{evo.statBonus.def} DEF · +{evo.statBonus.hp} HP
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cats.map(c => <CatCard key={c.id} c={c} active={c.id === activeId} onSelect={() => setActive(c.id)} />)}
      </div>
    </div>
  );
}

const statusTone: Record<Cat["status"], string> = {
  ready: "bg-primary text-black",
  diving: "bg-secondary text-black",
  injured: "bg-destructive text-foreground",
  resting: "bg-accent text-black",
};

function CatCard({ c, active, onSelect }: { c: Cat; active: boolean; onSelect: () => void }) {
  const recoverMin = Math.floor(c.recoverySecondsLeft / 60);
  const recoverSec = c.recoverySecondsLeft % 60;
  return (
    <div className={`chunky-panel bg-black/80 p-4 ${active ? "ring-4 ring-primary" : ""}`}>
      <div className="mb-3 flex items-start gap-3">
        <img src={c.portrait} alt={c.name} width={96} height={96} className="size-20 border-4 border-black bg-slate-800 object-cover" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl uppercase leading-none">{c.name}</h3>
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Lvl {c.level}</span>
          </div>
          <p className="text-xs text-muted-foreground">{c.catClass}</p>
          <span className={`mt-2 inline-block border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase ${statusTone[c.status]}`}>
            {c.status}{c.status !== "ready" && c.recoverySecondsLeft > 0 ? ` · ${recoverMin}m ${recoverSec}s` : ""}
          </span>
        </div>
      </div>

      <div className="mb-3">
        <div className="mb-1 flex justify-between text-[10px] font-bold uppercase">
          <span>HP</span><span>{c.hp}/{c.maxHp}</span>
        </div>
        <div className="h-3 border-2 border-black bg-slate-900">
          <div className="h-full bg-primary" style={{ width: `${(c.hp / c.maxHp) * 100}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 text-center">
        <S label="ATK" v={c.attack} />
        <S label="DEF" v={c.defense} />
        <S label="SPD" v={c.speed} />
      </div>

      <p className="mt-3 border-t-2 border-dashed border-white/10 pt-3 text-[11px] italic text-muted-foreground">{c.ability}</p>

      <div className="mt-3 flex gap-2 text-[10px] uppercase tracking-wider">
        <SlotDot label="Wpn" filled={!!c.equipment.weapon} />
        <SlotDot label="Arm" filled={!!c.equipment.armor} />
        <SlotDot label="Rel" filled={!!c.equipment.relic} />
      </div>

      <button
        disabled={c.status !== "ready" || active}
        onClick={onSelect}
        className={`chunky-button mt-4 w-full py-2 text-xs font-bold uppercase ${active ? "bg-primary text-black" : "bg-slate-800"}`}
      >
        {active ? "Active Diver" : c.status === "ready" ? "Set Active" : "Unavailable"}
      </button>
    </div>
  );
}

function S({ label, v }: { label: string; v: number }) {
  return (
    <div className="border-2 border-black bg-slate-900 py-1">
      <div className="text-[9px] font-bold uppercase text-muted-foreground">{label}</div>
      <div className="font-display text-lg leading-none text-primary">{v}</div>
    </div>
  );
}
function SlotDot({ label, filled }: { label: string; filled: boolean }) {
  return (
    <span className={`flex-1 border-2 border-black px-1 py-0.5 text-center ${filled ? "bg-accent text-black" : "bg-slate-900 text-muted-foreground"}`}>
      {label}{filled ? " ✓" : ""}
    </span>
  );
}