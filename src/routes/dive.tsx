import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useGame } from "@/lib/game/store";

export const Route = createFileRoute("/dive")({
  head: () => ({
    meta: [
      { title: "Dumpster Dive — Alley Cat Dumpster Divers" },
      { name: "description", content: "Active dive in progress. Fight, loot, escape." },
      { property: "og:title", content: "Dumpster Dive" },
      { property: "og:description", content: "Active dive in progress." },
    ],
  }),
  component: DiveScreen,
});

function DiveScreen() {
  const dive = useGame(s => s.dive);
  const startDive = useGame(s => s.startDive);
  const doAction = useGame(s => s.doAction);
  const toggleAuto = useGame(s => s.toggleAuto);
  const tickDive = useGame(s => s.tickDive);
  const cats = useGame(s => s.cats);
  const lastRewards = useGame(s => s.lastRewards);
  const navigate = useNavigate();

  useEffect(() => {
    if (!dive && !lastRewards) startDive();
  }, [dive, lastRewards, startDive]);

  useEffect(() => {
    if (lastRewards) navigate({ to: "/loot" });
  }, [lastRewards, navigate]);

  useEffect(() => {
    if (!dive || dive.ended) return;
    const id = setInterval(() => tickDive(), 1000);
    return () => clearInterval(id);
  }, [dive?.ended, tickDive, dive]);

  if (!dive) {
    return <div className="mt-10 text-center text-muted-foreground">Spinning up the dive…</div>;
  }

  const cat = cats.find(c => c.id === dive.catId)!;
  const timerPct = (dive.timerSec / 240) * 100;
  const catHpPct = (dive.catHp / dive.catMaxHp) * 100;
  const enemyHpPct = dive.enemy ? (dive.enemy.hp / dive.enemy.maxHp) * 100 : 0;

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Combatants */}
      <div className="lg:col-span-8 space-y-4">
        {/* Truck timer */}
        <div className="chunky-panel bg-black/80 p-3">
          <div className="mb-1 flex justify-between text-[10px] font-bold uppercase">
            <span>🚛 Trash Truck Inbound</span>
            <span className="text-destructive">{Math.floor(dive.timerSec/60)}:{(dive.timerSec%60).toString().padStart(2,"0")}</span>
          </div>
          <div className="h-3 border-2 border-black bg-slate-900">
            <div className="h-full bg-destructive transition-all" style={{ width: `${Math.max(0, Math.min(100, timerPct))}%` }} />
          </div>
        </div>

        {/* Room indicator */}
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
          <span className="text-muted-foreground">Depth</span>
          <div className="flex gap-1">
            {Array.from({ length: dive.totalRooms }).map((_, i) => (
              <div key={i} className={`size-3 border-2 border-black ${i < dive.room ? "bg-primary" : "bg-slate-800"}`} />
            ))}
          </div>
          <span>Room {dive.room}/{dive.totalRooms}</span>
        </div>

        {/* Cat vs Enemy */}
        <div className="grid grid-cols-2 gap-3">
          <Combatant
            name={cat.name}
            portrait={cat.portrait}
            hp={dive.catHp}
            maxHp={dive.catMaxHp}
            hpPct={catHpPct}
            tone="primary"
            sub={cat.catClass}
          />
          {dive.enemy ? (
            <Combatant
              emoji={dive.enemy.emoji}
              name={dive.enemy.name}
              hp={dive.enemy.hp}
              maxHp={dive.enemy.maxHp}
              hpPct={enemyHpPct}
              tone="destructive"
              sub="Trash Mob"
            />
          ) : (
            <div className="chunky-panel flex items-center justify-center bg-black/80 p-6 text-center">
              <span className="font-display uppercase text-primary">Clear!</span>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <ActionBtn label="Scratch" onClick={() => doAction("scratch")} disabled={dive.ended} />
          <ActionBtn label="Pounce" onClick={() => doAction("pounce")} disabled={dive.ended} tone="secondary" />
          <ActionBtn label="Use Item" onClick={() => doAction("item")} disabled={dive.ended} tone="accent" />
          <ActionBtn label="Flee" onClick={() => doAction("flee")} disabled={dive.ended} tone="destructive" />
          <ActionBtn label={dive.autoDive ? "Stop Auto" : "Auto Dive"} onClick={toggleAuto} disabled={dive.ended} />
        </div>
      </div>

      {/* Combat log + collected */}
      <div className="lg:col-span-4 space-y-4">
        <div className="chunky-panel bg-black/85 p-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Combat Log</div>
          <ul className="max-h-[280px] space-y-1 overflow-y-auto text-xs">
            {[...dive.log].reverse().map(e => (
              <li key={e.id} className={
                e.tone === "crit" ? "text-accent font-bold" :
                e.tone === "hit" ? "text-primary" :
                e.tone === "loot" ? "text-secondary" :
                e.tone === "warn" ? "text-destructive" : "text-muted-foreground"
              }>
                › {e.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="chunky-panel bg-black/85 p-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pile So Far ({dive.collected.length})</div>
          {dive.collected.length === 0 ? (
            <p className="text-xs italic text-muted-foreground">Nothing yet. Smack something.</p>
          ) : (
            <ul className="space-y-1 text-xs">
              {dive.collected.map(i => (
                <li key={i.id} className="flex items-center justify-between">
                  <span>{i.name}</span>
                  <span className="text-[10px] uppercase opacity-70">{i.rarity}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Combatant({
  name, portrait, emoji, hp, maxHp, hpPct, tone, sub,
}: {
  name: string; portrait?: string; emoji?: string; hp: number; maxHp: number; hpPct: number;
  tone: "primary" | "destructive"; sub: string;
}) {
  const barColor = tone === "primary" ? "bg-primary" : "bg-destructive";
  return (
    <div className="chunky-panel bg-black/80 p-3">
      <div className="mb-2 flex items-center gap-2">
        {portrait ? (
          <img src={portrait} alt={name} width={48} height={48} className="size-12 border-2 border-black bg-slate-800 object-cover" />
        ) : (
          <div className="flex size-12 items-center justify-center border-2 border-black bg-slate-800 text-2xl">{emoji}</div>
        )}
        <div>
          <div className="font-display text-base uppercase leading-none">{name}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{sub}</div>
        </div>
      </div>
      <div className="h-4 border-2 border-black bg-slate-900">
        <div className={`h-full transition-all ${barColor}`} style={{ width: `${Math.max(0, hpPct)}%` }} />
      </div>
      <div className="mt-1 text-right text-[10px] font-bold">{hp}/{maxHp}</div>
    </div>
  );
}

function ActionBtn({ label, onClick, disabled, tone = "default" }: { label: string; onClick: () => void; disabled?: boolean; tone?: "default" | "secondary" | "accent" | "destructive" }) {
  const bg = tone === "secondary" ? "bg-secondary text-black"
    : tone === "accent" ? "bg-accent text-black"
    : tone === "destructive" ? "bg-destructive text-foreground"
    : "bg-slate-900 text-foreground";
  return (
    <button onClick={onClick} disabled={disabled} className={`chunky-button px-3 py-3 font-display text-base uppercase ${bg}`}>
      {label}
    </button>
  );
}