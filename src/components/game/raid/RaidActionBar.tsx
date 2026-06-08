import { useEffect, useMemo, useRef, useState } from "react";
import type { Actor } from "@/lib/game/raidTypes";
import { useGame } from "@/lib/game/store";
import { ElementIcon } from "./ElementIcon";

/**
 * Battle action bar with full keyboard support and smart targeting.
 *
 * Keyboard:
 *   1 Attack · 2 Skill · 3 Item · 4 Defend · 5 Overdrive · F Flee
 *   While picking a target: 1..9 pick that foe, ← → / Tab cycle, Enter confirm, Esc cancel
 *   In the skill list: 1..9 choose a skill, Esc closes
 *
 * Smart targeting: if a "single target" action is chosen and only ONE enemy is
 * alive, it fires immediately — no extra target step.
 */

type PendingMode = "basic" | "skill" | "od";

export function RaidActionBar({ active, enemies, onPickTarget, onSelectTarget, foodCount, onTargetMode }:
  { active: Actor | null; enemies: Actor[]; onPickTarget: (mode: "basic"|"skill"|"od"|null, skillId?: string) => void; onSelectTarget: (uid: string) => void; foodCount: number; onTargetMode: boolean })
{
  const raidDefend = useGame(s => s.raidDefend);
  const raidUseItem = useGame(s => s.raidUseItem);
  const raidFlee = useGame(s => s.raidFlee);
  const raidUseSkill = useGame(s => s.raidUseSkill);
  const raidBasicAttack = useGame(s => s.raidBasicAttack);
  const raidOverdrive = useGame(s => s.raidOverdrive);

  const [skillsOpen, setSkillsOpen] = useState(false);
  // Local targeting state, so this component can resolve simple targets itself
  // (one click / one key) instead of bouncing through canvas sprite clicks.
  const [pending, setPending] = useState<{ mode: PendingMode; skillId?: string } | null>(null);
  const [cursor, setCursor] = useState(0); // index into liveEnemies while targeting

  const liveEnemies = useMemo(() => enemies.filter(e => e.alive), [enemies]);
  const isMyTurn = !!active && active.side === "party";

  // keep cursor in range
  useEffect(() => { if (cursor > liveEnemies.length - 1) setCursor(Math.max(0, liveEnemies.length - 1)); }, [liveEnemies.length, cursor]);
  // reset transient UI whenever the acting actor changes
  useEffect(() => { setPending(null); setSkillsOpen(false); setCursor(0); }, [active?.uid]);

  const odReady = !!active && active.od >= active.odMax;

  // ---- action helpers ----
  function fireOnTarget(mode: PendingMode, uid: string, skillId?: string) {
    if (mode === "basic") raidBasicAttack(uid);
    else if (mode === "skill" && skillId) raidUseSkill(skillId, uid);
    else if (mode === "od") raidOverdrive(uid);
    setPending(null);
    onPickTarget(null); // clear any canvas-side targeting highlight
  }

  // Begin a single-target action. Auto-fires if exactly one foe is alive.
  function beginTarget(mode: PendingMode, skillId?: string) {
    if (liveEnemies.length === 0) return;
    if (liveEnemies.length === 1) { fireOnTarget(mode, liveEnemies[0].uid, skillId); return; }
    setPending({ mode, skillId });
    setCursor(0);
    onPickTarget(mode, skillId); // mirror highlight onto the canvas sprites too
  }

  function cancelTarget() { setPending(null); onPickTarget(null); }

  function chooseAttack() { if (isMyTurn) beginTarget("basic"); }
  function chooseSkillMenu() { if (isMyTurn && active!.skills.length) setSkillsOpen(o => !o); }
  function chooseItem() { if (isMyTurn && foodCount > 0) raidUseItem(); }
  function chooseDefend() { if (isMyTurn) raidDefend(); }
  function chooseOD() {
    if (!isMyTurn || !odReady) return;
    if (active!.overdrive.target === "one") beginTarget("od");
    else raidOverdrive(undefined);
  }
  function chooseSkill(skillId: string, target: Actor["skills"][number]["target"]) {
    setSkillsOpen(false);
    if (target === "one") beginTarget("skill", skillId);
    else raidUseSkill(skillId);
  }

  // ---- keyboard ----
  const handlers = useRef({ chooseAttack, chooseSkillMenu, chooseItem, chooseDefend, chooseOD });
  handlers.current = { chooseAttack, chooseSkillMenu, chooseItem, chooseDefend, chooseOD };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!isMyTurn) return;
      // don't hijack typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      // --- targeting mode ---
      if (pending) {
        if (e.key === "Escape") { e.preventDefault(); cancelTarget(); return; }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const t = liveEnemies[cursor]; if (t) fireOnTarget(pending.mode, t.uid, pending.skillId);
          return;
        }
        if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "Tab") {
          e.preventDefault(); setCursor(c => (c + 1) % liveEnemies.length); return;
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault(); setCursor(c => (c - 1 + liveEnemies.length) % liveEnemies.length); return;
        }
        const n = parseInt(e.key, 10);
        if (!isNaN(n) && n >= 1 && n <= liveEnemies.length) {
          e.preventDefault(); fireOnTarget(pending.mode, liveEnemies[n - 1].uid, pending.skillId); return;
        }
        return;
      }

      // --- skill list open ---
      if (skillsOpen) {
        if (e.key === "Escape") { e.preventDefault(); setSkillsOpen(false); return; }
        const n = parseInt(e.key, 10);
        if (!isNaN(n) && active && n >= 1 && n <= active.skills.length) {
          const s = active.skills[n - 1];
          if (active.mp >= s.mpCost) { e.preventDefault(); chooseSkill(s.id, s.target); }
          return;
        }
        return;
      }

      // --- root menu ---
      switch (e.key) {
        case "1": e.preventDefault(); handlers.current.chooseAttack(); break;
        case "2": e.preventDefault(); handlers.current.chooseSkillMenu(); break;
        case "3": e.preventDefault(); handlers.current.chooseItem(); break;
        case "4": e.preventDefault(); handlers.current.chooseDefend(); break;
        case "5": e.preventDefault(); handlers.current.chooseOD(); break;
        case "f": case "F": e.preventDefault(); raidFlee(); break;
        default: break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMyTurn, pending, skillsOpen, cursor, liveEnemies, active?.uid]);

  // keep parent/canvas in sync if it drives targeting too
  useEffect(() => {
    if (!pending && onTargetMode) { /* parent still thinks we're targeting; leave it */ }
  }, [pending, onTargetMode]);

  if (!isMyTurn) {
    return (
      <div className="chunky-panel flex h-14 items-center justify-center bg-black/85 px-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Enemy acting…
      </div>
    );
  }

  // ---- targeting UI ----
  if (pending || onTargetMode) {
    const list = liveEnemies;
    return (
      <div className="chunky-panel flex min-h-14 flex-wrap items-center justify-center gap-2 bg-amber-500 px-3 py-2 font-display text-sm uppercase text-black">
        <span className="mr-1">Pick a target</span>
        {list.map((e, i) => {
          const selected = i === cursor;
          return (
            <button
              key={e.uid}
              onMouseEnter={() => setCursor(i)}
              onClick={() => (pending ? fireOnTarget(pending.mode, e.uid, pending.skillId) : onSelectTarget(e.uid))}
              className={`chunky-button px-3 py-1 text-[10px] uppercase ${selected ? "bg-rose-700 text-white ring-2 ring-white" : "bg-black/70 text-white"}`}
            >
              <span className="mr-1 rounded bg-white/20 px-1">{i + 1}</span>
              {e.name} · {Math.max(0, Math.round(e.hp))}/{e.maxHp}
            </button>
          );
        })}
        <button onClick={() => (pending ? cancelTarget() : onPickTarget(null))} className="chunky-button bg-black/40 px-2 py-1 text-[10px] uppercase text-white">
          Cancel <span className="opacity-70">(Esc)</span>
        </button>
        <span className="ml-1 text-[9px] normal-case opacity-70">1–{list.length} / ←→ / Enter</span>
      </div>
    );
  }

  // ---- root menu ----
  return (
    <div className="flex flex-col gap-1">
      <div className="chunky-panel flex items-center justify-between bg-black/85 px-3 py-1 text-[11px] uppercase tracking-wider">
        <span><b className="text-primary">{active!.name}</b>'s turn</span>
        <span>MP {active!.mp}/{active!.maxMp}  ·  OD {Math.round(active!.od)}/{active!.odMax}</span>
      </div>
      <div className="grid grid-cols-3 gap-1 md:grid-cols-6">
        <Btn k="1" label="Attack" onClick={chooseAttack} primary />
        <Btn k="2" label="Skill" onClick={chooseSkillMenu} disabled={active!.skills.length === 0} />
        <Btn k="3" label={`Item (${foodCount})`} onClick={chooseItem} disabled={foodCount === 0} />
        <Btn k="4" label="Defend" onClick={chooseDefend} />
        <Btn k="5" label={odReady ? `★ ${active!.overdrive.name}` : "OD —"} onClick={chooseOD} disabled={!odReady} tone="accent" />
        <Btn k="F" label="Flee" onClick={() => raidFlee()} tone="destructive" />
      </div>
      {skillsOpen && (
        <div className="chunky-panel grid grid-cols-1 gap-1 bg-black/90 p-2 md:grid-cols-2">
          {active!.skills.length === 0 && <div className="text-xs text-muted-foreground">No skills.</div>}
          {active!.skills.map((s, i) => {
            const ok = active!.mp >= s.mpCost;
            return (
              <button
                key={s.id}
                disabled={!ok}
                onClick={() => chooseSkill(s.id, s.target)}
                className={`chunky-button flex items-center justify-between px-2 py-1.5 text-xs uppercase ${ok ? "bg-slate-800" : "bg-slate-900 opacity-60"}`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="rounded bg-white/15 px-1 text-[10px]">{i + 1}</span>
                  <ElementIcon el={s.element} /> {s.name}
                  {s.target !== "one" && <span className="text-[9px] opacity-60">(all)</span>}
                </span>
                <span className="text-[10px] text-cyan-300">{s.mpCost} MP</span>
              </button>
            );
          })}
          <div className="col-span-full text-[9px] uppercase tracking-wider text-muted-foreground">Press 1–{active!.skills.length} · Esc to close</div>
        </div>
      )}
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Live foes: {liveEnemies.length}</span>
        <span className="normal-case opacity-70">Keys: 1 Atk · 2 Skill · 3 Item · 4 Def · 5 OD · F Flee</span>
      </div>
    </div>
  );
}

function Btn({ label, onClick, disabled, primary, tone, k }:
  { label: string; onClick: () => void; disabled?: boolean; primary?: boolean; tone?: "accent"|"destructive"; k?: string }) {
  const bg = tone === "accent" ? "bg-accent text-black"
    : tone === "destructive" ? "bg-destructive text-destructive-foreground"
    : primary ? "bg-primary text-primary-foreground"
    : "bg-slate-900";
  return (
    <button onClick={onClick} disabled={disabled}
      className={`chunky-button relative px-2 py-1.5 font-display text-xs uppercase ${bg} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      {k && <span className="absolute left-1 top-0.5 rounded bg-black/30 px-1 text-[8px] leading-tight opacity-80">{k}</span>}
      {label}
    </button>
  );
}
