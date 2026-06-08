import { motion } from "framer-motion";
import { useState } from "react";
import { useGame } from "@/lib/game/store";
import { ActorCard } from "./ActorCard";
import { TurnQueue } from "./TurnQueue";
import { RaidActionBar } from "./RaidActionBar";
import { OverdriveOverlay } from "./OverdriveOverlay";

export function RaidStage({ bgImage }: { bgImage?: string }) {
  const raid = useGame(s => s.raid);
  const inv = useGame(s => s.inventory);
  const basic = useGame(s => s.raidBasicAttack);
  const useSkill = useGame(s => s.raidUseSkill);
  const od = useGame(s => s.raidOverdrive);
  const advanceRoom = useGame(s => s.raidAdvanceRoom);
  const claim = useGame(s => s.raidClaim);
  const [target, setTarget] = useState<{ mode: "basic"|"skill"|"od"; skillId?: string } | null>(null);

  if (!raid) return null;
  const active = [...raid.party, ...raid.enemies].find(a => a.uid === raid.activeUid) ?? null;
  const foodCount = inv.filter(i => i.kind === "food").length;
  const livingFoes = raid.enemies.filter(e => e.alive);
  const roomCleared = livingFoes.length === 0 && !raid.ended;

  const onPickTarget = (mode: "basic"|"skill"|"od"|null, skillId?: string) => {
    if (!mode) { setTarget(null); return; }
    setTarget({ mode, skillId });
  };

  const handleTargetClick = (uid: string) => {
    if (!target) return;
    if (target.mode === "basic") basic(uid);
    else if (target.mode === "skill" && target.skillId) useSkill(target.skillId, uid);
    else if (target.mode === "od") od(uid);
    setTarget(null);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-2">
      <motion.div
        key={raid.shakeKey}
        animate={{ x: [0, -6, 6, -4, 4, 0] }}
        transition={{ duration: 0.35 }}
        className="relative grid min-h-0 flex-1 grid-cols-[1fr_auto] gap-2"
      >
        {/* Battle area */}
        <div className="chunky-panel relative overflow-hidden bg-slate-950 p-3">
          {bgImage && <img src={bgImage} alt="" aria-hidden className="absolute inset-0 size-full object-cover opacity-30" />}
          <div className="relative grid h-full grid-cols-2 gap-3">
            {/* Party */}
            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Crew</div>
              {raid.party.map(p => (
                <ActorCard key={p.uid} a={p} isActive={p.uid === raid.activeUid}
                  flashKey={raid.flash[p.uid]}
                  floats={raid.floats.filter(f => f.uid === p.uid)} />
              ))}
            </div>
            {/* Enemies */}
            <div className="flex flex-col gap-2">
              <div className="text-right text-[10px] font-bold uppercase tracking-widest text-destructive">Foes</div>
              {raid.enemies.map(e => (
                <ActorCard key={e.uid} a={e} isActive={e.uid === raid.activeUid}
                  isTarget={!!target && e.alive}
                  flashKey={raid.flash[e.uid]}
                  floats={raid.floats.filter(f => f.uid === e.uid)}
                  onClick={target ? () => handleTargetClick(e.uid) : undefined} />
              ))}
            </div>
          </div>
          <OverdriveOverlay overlay={raid.overdriveOverlay} />
        </div>
        <TurnQueue actors={[...raid.party, ...raid.enemies]} activeUid={raid.activeUid} />
      </motion.div>

      {/* Bottom bar */}
      {raid.ended ? (
        <div className={`chunky-panel flex items-center justify-between px-3 py-2 ${raid.victory ? "bg-emerald-700" : "bg-rose-900"}`}>
          <div className="font-display text-lg uppercase">{raid.victory ? "VICTORY" : "DEFEATED"}</div>
          <button onClick={() => claim()} className="chunky-button bg-accent px-4 py-2 font-display text-xs uppercase text-black">
            {raid.victory ? `Claim +${raid.rewards?.spheres ?? 0} 💠` : "Leave"}
          </button>
        </div>
      ) : roomCleared ? (
        <div className="chunky-panel flex items-center justify-between bg-emerald-800 px-3 py-2">
          <div className="font-display text-sm uppercase">Room Cleared</div>
          <button onClick={() => advanceRoom()} className="chunky-button bg-accent px-4 py-2 font-display text-xs uppercase text-black">
            Advance →
          </button>
        </div>
      ) : (
        <RaidActionBar
          active={active}
          enemies={raid.enemies}
          onPickTarget={onPickTarget}
          onSelectTarget={handleTargetClick}
          foodCount={foodCount}
          onTargetMode={!!target}
        />
      )}

      {/* Log */}
      <details className="chunky-panel bg-black/85 p-2">
        <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Battle Log</summary>
        <ul className="mt-2 max-h-32 space-y-0.5 overflow-y-auto text-xs">
          {[...raid.log].reverse().slice(0, 30).map(e => (
            <li key={e.id} className={
              e.tone === "crit" ? "text-amber-300"
              : e.tone === "heal" ? "text-emerald-300"
              : e.tone === "warn" ? "text-destructive"
              : e.tone === "hit" ? "text-primary"
              : "text-muted-foreground"
            }>{e.text}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
