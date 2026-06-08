import { useState } from "react";
import type { Actor } from "@/lib/game/raidTypes";
import { useGame } from "@/lib/game/store";
import { ElementIcon } from "./ElementIcon";

export function RaidActionBar({ active, enemies, onPickTarget, foodCount, onTargetMode }:
  { active: Actor | null; enemies: Actor[]; onPickTarget: (mode: "basic"|"skill"|"od"|null, skillId?: string) => void; foodCount: number; onTargetMode: boolean })
{
  const raidDefend = useGame(s => s.raidDefend);
  const raidUseItem = useGame(s => s.raidUseItem);
  const raidFlee = useGame(s => s.raidFlee);
  const raidUseSkill = useGame(s => s.raidUseSkill);
  const [skillsOpen, setSkillsOpen] = useState(false);

  if (!active || active.side !== "party") {
    return (
      <div className="chunky-panel flex h-14 items-center justify-center bg-black/85 px-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Enemy acting…
      </div>
    );
  }

  if (onTargetMode) {
    return (
      <div className="chunky-panel flex h-14 items-center justify-center gap-3 bg-amber-500 px-3 font-display text-sm uppercase text-black">
        Pick a target
        <button onClick={() => onPickTarget(null)} className="chunky-button bg-black/40 px-2 py-1 text-[10px] uppercase">Cancel</button>
      </div>
    );
  }

  const odReady = active.od >= active.odMax;

  return (
    <div className="flex flex-col gap-1">
      <div className="chunky-panel flex items-center justify-between bg-black/85 px-3 py-1 text-[11px] uppercase tracking-wider">
        <span><b className="text-primary">{active.name}</b>'s turn</span>
        <span>MP {active.mp}/{active.maxMp}  ·  OD {Math.round(active.od)}/{active.odMax}</span>
      </div>
      <div className="grid grid-cols-3 gap-1 md:grid-cols-6">
        <Btn label="Attack" onClick={() => onPickTarget("basic")} primary />
        <Btn label="Skill" onClick={() => setSkillsOpen(s => !s)} />
        <Btn label={`Item (${foodCount})`} onClick={() => raidUseItem()} disabled={foodCount === 0} />
        <Btn label="Defend" onClick={() => raidDefend()} />
        <Btn
          label={odReady ? `★ ${active.overdrive.name}` : "OD —"}
          onClick={() => odReady && (active.overdrive.target === "one" ? onPickTarget("od") : (useGame.getState().raidOverdrive(undefined)))}
          disabled={!odReady}
          tone="accent"
        />
        <Btn label="Flee" onClick={() => raidFlee()} tone="destructive" />
      </div>
      {skillsOpen && (
        <div className="chunky-panel grid grid-cols-1 gap-1 bg-black/90 p-2 md:grid-cols-2">
          {active.skills.length === 0 && <div className="text-xs text-muted-foreground">No skills.</div>}
          {active.skills.map(s => {
            const ok = active.mp >= s.mpCost;
            return (
              <button
                key={s.id}
                disabled={!ok}
                onClick={() => {
                  setSkillsOpen(false);
                  if (s.target === "one") onPickTarget("skill", s.id);
                  else raidUseSkill(s.id);
                }}
                className={`chunky-button flex items-center justify-between px-2 py-1.5 text-xs uppercase ${ok ? "bg-slate-800" : "bg-slate-900 opacity-60"}`}
              >
                <span className="flex items-center gap-1.5"><ElementIcon el={s.element} /> {s.name}</span>
                <span className="text-[10px] text-cyan-300">{s.mpCost} MP</span>
              </button>
            );
          })}
        </div>
      )}
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        Live foes: {enemies.filter(e => e.alive).length}
      </div>
    </div>
  );
}

function Btn({ label, onClick, disabled, primary, tone }:
  { label: string; onClick: () => void; disabled?: boolean; primary?: boolean; tone?: "accent"|"destructive" }) {
  const bg = tone === "accent" ? "bg-accent text-black"
    : tone === "destructive" ? "bg-destructive text-destructive-foreground"
    : primary ? "bg-primary text-primary-foreground"
    : "bg-slate-900";
  return (
    <button onClick={onClick} disabled={disabled}
      className={`chunky-button px-2 py-1.5 font-display text-xs uppercase ${bg} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      {label}
    </button>
  );
}
