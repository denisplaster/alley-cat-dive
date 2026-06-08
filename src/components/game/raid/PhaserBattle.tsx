import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/game/store";
import { ENEMY_SPRITES } from "@/lib/game/enemySprites";
import { portraits } from "@/lib/game/data";
import { RaidActionBar } from "./RaidActionBar";
import type { RaidState } from "@/lib/game/raidTypes";

/**
 * Phaser-powered battle stage. The Zustand `raid` slice remains the source of
 * truth; this component subscribes to it and forwards every update to the
 * RaidScene which handles all visuals (sprites, particles, damage numbers,
 * shake, OD overlay, banners).
 */
export function PhaserBattle({ bgUrl }: { bgUrl: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<any | null>(null);
  const sceneRef = useRef<{ syncState: (s: RaidState) => void; scene: { isActive: () => boolean } } | null>(null);
  const targetRef = useRef<{ mode: "basic"|"skill"|"od"; skillId?: string } | null>(null);
  const [, force] = useState(0);

  const raid = useGame(s => s.raid);
  const inv = useGame(s => s.inventory);
  const basic = useGame(s => s.raidBasicAttack);
  const useSkill = useGame(s => s.raidUseSkill);
  const od = useGame(s => s.raidOverdrive);
  const advanceRoom = useGame(s => s.raidAdvanceRoom);
  const claim = useGame(s => s.raidClaim);

  // Boot phaser once
  useEffect(() => {
    if (gameRef.current || !containerRef.current) return;
    let cancelled = false;
    let game: any = null;
    (async () => {
      const [{ default: Phaser }, { RaidScene }] = await Promise.all([
        import("phaser"),
        import("@/game/phaser/RaidScene"),
      ]);
      if (cancelled || !containerRef.current) return;
      const sprites: Record<string, string> = {};
      Object.entries(portraits).forEach(([id, url]) => { sprites[`cat:${id}`] = url as string; });
      Object.entries(ENEMY_SPRITES).forEach(([id, url]) => { sprites[`enemy:${id}`] = url; });
      const scene = new RaidScene();
      sceneRef.current = scene as unknown as typeof sceneRef.current;
      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current,
        backgroundColor: "#05060a",
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
        render: { pixelArt: false, antialias: true },
        scene: [scene],
      });
      gameRef.current = game;
      game.scene.start(RaidScene.KEY, {
        bgUrl,
        sprites,
        onActorClick: (uid: string) => handleTargetClick(uid),
        getTargetMode: () => !!targetRef.current,
      });
      // Trigger a state push as soon as the scene is up.
      force(x => x + 1);
    })();
    return () => {
      cancelled = true;
      if (game) { try { game.destroy(true); } catch { /* ignore */ } }
      gameRef.current = null;
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push state into scene each render
  useEffect(() => {
    if (!raid) return;
    const scene = sceneRef.current;
    if (!scene || !scene.scene.isActive()) {
      // Scene not yet booted — wait one tick
      const id = setTimeout(() => force(x => x + 1), 60);
      return () => clearTimeout(id);
    }
    scene.syncState(raid);
  }, [raid]);

  const handleTargetClick = (uid: string) => {
    const t = targetRef.current;
    if (!t) return;
    if (t.mode === "basic") basic(uid);
    else if (t.mode === "skill" && t.skillId) useSkill(t.skillId, uid);
    else if (t.mode === "od") od(uid);
    targetRef.current = null;
    force(x => x + 1);
  };

  const onPickTarget = (mode: "basic"|"skill"|"od"|null, skillId?: string) => {
    targetRef.current = mode ? { mode, skillId } : null;
    force(x => x + 1);
  };

  if (!raid) return null;
  const active = [...raid.party, ...raid.enemies].find(a => a.uid === raid.activeUid) ?? null;
  const foodCount = inv.filter(i => i.kind === "food").length;
  const roomCleared = raid.enemies.every(e => !e.alive) && !raid.ended;

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-2">
      <div ref={containerRef} className="chunky-panel relative min-h-0 flex-1 overflow-hidden bg-black" />

      {/* React UI overlay: bottom action bar / cleared / ended */}
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
          foodCount={foodCount}
          onTargetMode={!!targetRef.current}
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