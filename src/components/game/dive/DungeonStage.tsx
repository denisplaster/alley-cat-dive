import { useEffect, useState } from "react";
import { useGame } from "@/lib/game/store";
import type { Cat, Enemy, Fx, RoomKind } from "@/lib/game/types";
import { NextRoomPreview } from "./NextRoomPreview";
import arenaBg from "@/assets/anime/bg-arena.jpg";
import catIdle from "@/assets/anime/cat-idle.png";
import catScratch from "@/assets/anime/cat-scratch.png";
import catPounce from "@/assets/anime/cat-pounce.png";
import catItem from "@/assets/anime/cat-item.png";
import catHurt from "@/assets/anime/cat-hurt.png";
import catBlock from "@/assets/anime/cat-block.png";
import catKo from "@/assets/anime/cat-ko.png";
import catVictory from "@/assets/anime/cat-victory.png";
import catCombo from "@/assets/anime/cat-combo.png";
import catKnockback from "@/assets/anime/cat-knockback.png";
import enemyIdle from "@/assets/anime/enemy-idle.png";
import enemyAttack from "@/assets/anime/enemy-attack.png";
import enemyHurt from "@/assets/anime/enemy-hurt.png";
import enemyKo from "@/assets/anime/enemy-ko.png";
import bossIdle from "@/assets/anime/boss-idle.png";
import bossAttack from "@/assets/anime/boss-attack.png";
import bossHurt from "@/assets/anime/boss-hurt.png";
import bossKo from "@/assets/anime/boss-ko.png";
import minibossIdle from "@/assets/anime/miniboss-idle.png";
import minibossAttack from "@/assets/anime/miniboss-attack.png";
import minibossHurt from "@/assets/anime/miniboss-hurt.png";
import minibossKo from "@/assets/anime/miniboss-ko.png";
import roomLoot from "@/assets/anime/room-loot.png";
import roomHazard from "@/assets/anime/room-hazard.png";
import roomRest from "@/assets/anime/room-rest.png";
import fxSlash from "@/assets/anime/fx-slash.png";
import fxImpact from "@/assets/anime/fx-impact.png";
import fxCrit from "@/assets/anime/fx-crit.png";
import fxHeal from "@/assets/anime/fx-heal.png";
import fxMiss from "@/assets/anime/fx-miss.png";
import fxBlock from "@/assets/anime/fx-block.png";
import fxCombo from "@/assets/anime/fx-combo.png";
import fxSpeedlines from "@/assets/anime/fx-speedlines.png";
import wordBam from "@/assets/anime/word-bam.png";
import wordPow from "@/assets/anime/word-pow.png";
import wordSlash from "@/assets/anime/word-slash.png";
import wordCrit from "@/assets/anime/word-crit.png";
import wordCombo from "@/assets/anime/word-combo.png";
import panelSplit from "@/assets/anime/panel-split.png";

const KIND_TINT: Record<RoomKind, string> = {
  enemy: "from-emerald-950/60 via-black to-black",
  loot: "from-yellow-900/60 via-black to-black",
  hazard: "from-lime-950/70 via-black to-black",
  rest: "from-cyan-950/60 via-black to-black",
  miniboss: "from-fuchsia-950/60 via-black to-black",
  boss: "from-fuchsia-900/70 via-rose-950/40 to-black",
};

const BG_PROPS = ["🍕","🦴","🥫","📦","🍌","🥡","🍣","🧃","🍔","🧻"];

export function DungeonStage({ cat, enemy }: { cat: Cat; enemy: Enemy | null }) {
  const dive = useGame(s => s.dive)!;
  const tint = KIND_TINT[dive.currentKind];
  const truckPct = dive.timerSec / dive.truckTimerStart;
  const danger = truckPct < 0.1;
  const mangaFxArt = dive.mangaFx ? FX_ART[dive.mangaFx] : null;
  const mangaWordArt = dive.mangaWord ? WORD_ART[dive.mangaWord] : null;

  // shake handling
  const [shakeId, setShakeId] = useState(0);
  useEffect(() => { setShakeId(k => k + 1); }, [dive.shakeKey]);

  return (
    <div className={`relative overflow-hidden chunky-panel bg-gradient-to-b ${tint} ${danger ? "animate-danger-border" : ""}`}>
      {/* Backdrop layers */}
      <div className="absolute inset-0 pointer-events-none">
        <img src={arenaBg} alt="Dumpster dungeon arena" className="absolute inset-0 size-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-black/35" />
        <img src={fxSpeedlines} alt="" aria-hidden="true" className={`absolute inset-0 size-full object-cover opacity-0 ${dive.mangaFocus ? "manga-speedlines-active" : ""}`} />
        {/* radial top light */}
        <div className="absolute inset-x-0 -top-20 h-60 bg-[radial-gradient(ellipse_at_center,_rgba(74,222,128,0.35),_transparent_70%)]" />
        {/* dumpster metal side walls */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black via-slate-800/80 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-black via-slate-800/80 to-transparent" />
        {/* horizontal metal ribs */}
        {[18, 48, 78].map((y, i) => (
          <div key={i} className="absolute left-0 right-0 h-px bg-white/5" style={{ top: `${y}%` }} />
        ))}
        {/* back garbage bags (rounded black blobs) */}
        <div className="absolute -bottom-6 left-4 h-24 w-32 rounded-[50%_50%_40%_60%/60%_60%_40%_40%] bg-black/90 shadow-[inset_-10px_-6px_0_rgba(255,255,255,0.05)]" />
        <div className="absolute -bottom-8 left-1/3 h-28 w-36 rounded-[60%_40%_45%_55%/60%_55%_45%_45%] bg-black/85 shadow-[inset_-12px_-4px_0_rgba(255,255,255,0.04)]" />
        <div className="absolute -bottom-6 right-6 h-24 w-32 rounded-[45%_55%_40%_60%/55%_60%_40%_45%] bg-black/90 shadow-[inset_-10px_-4px_0_rgba(255,255,255,0.05)]" />
        {/* bag ties */}
        <span className="absolute bottom-14 left-12 text-xs opacity-70">〰️</span>
        <span className="absolute bottom-16 right-16 text-xs opacity-70">〰️</span>
        {/* torn cardboard slabs */}
        <div className="absolute top-6 left-2 h-16 w-10 -rotate-12 bg-amber-900/60 [clip-path:polygon(0_10%,100%_0,90%_90%,10%_100%)]" />
        <div className="absolute top-4 right-4 h-20 w-12 rotate-12 bg-amber-800/55 [clip-path:polygon(10%_0,100%_15%,85%_100%,0_85%)]" />
        {/* rat hole */}
        <div className="absolute bottom-1 left-[6%] h-6 w-10 rounded-t-full bg-black" />
        <span className="absolute bottom-1 left-[7%] text-[10px] opacity-70">·  ·</span>
        {/* grease puddle */}
        <div className="absolute bottom-2 right-[18%] h-3 w-20 rounded-full bg-yellow-900/60 blur-[1px]" />
        <div className="absolute bottom-3 right-[22%] h-2 w-10 rounded-full bg-amber-700/50" />
        {/* moldy glow patches */}
        <div className="absolute top-1/3 left-[8%] size-10 rounded-full bg-toxic/30 blur-xl" />
        <div className="absolute top-1/2 right-[10%] size-12 rounded-full bg-toxic/25 blur-xl" />
        {/* slime drips */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="absolute top-0 w-1 h-full bg-gradient-to-b from-toxic/70 via-toxic/30 to-transparent animate-drip"
            style={{ left: `${10 + i * 18}%`, animationDelay: `${i * 0.7}s`, animationDuration: `${4 + i}s`, opacity: 0.5 }} />
        ))}
        {/* background prop emojis */}
        {BG_PROPS.map((p, i) => (
          <span key={i} className="absolute text-xl md:text-2xl opacity-20 select-none"
            style={{
              left: `${(i * 17) % 92 + 3}%`,
              top: `${(i * 23) % 78 + 12}%`,
              transform: `rotate(${(i*37)%60 - 30}deg)`,
            }}>{p}</span>
        ))}
        {/* flies */}
        <span className="absolute left-[18%] top-[22%] animate-fly text-lg opacity-80">🪰</span>
        <span className="absolute right-[14%] top-[40%] animate-fly text-base opacity-70" style={{ animationDelay: "1.2s" }}>🪰</span>
        <span className="absolute left-[44%] bottom-[20%] animate-fly text-xl opacity-70" style={{ animationDelay: "2.4s" }}>🪰</span>
        {/* dumpster lip top */}
        <div className="absolute inset-x-0 top-0 h-3 bg-black/80 border-b-4 border-toxic/70" />
        {/* floor glow */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-toxic/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-9 h-[3px] bg-toxic/80 shadow-[0_0_18px_4px_rgba(74,222,128,0.6)]" />
      </div>

      {/* Stage with shake */}
      <div key={shakeId} className={dive.shakeKey > 0 ? (dive.shakeHard ? "animate-shake-hard" : "animate-shake") : ""}>
        <div className="relative grid grid-cols-2 gap-4 p-6 md:p-10 min-h-[360px] md:min-h-[440px]">
          <CombatantSprite
            name={cat.name}
            sub={cat.catClass}
            poses={CAT_ART}
            activePose={dive.catPose}
            hp={dive.catHp}
            maxHp={dive.catMaxHp}
            side="left"
            flashKey={dive.catFlashKey}
            knockbackKey={dive.catKnockbackKey}
            fx={dive.fx.filter(f => f.target === "cat")}
            tone="primary"
            combo={dive.combo}
          />
          {enemy ? (
            <CombatantSprite
              key={`${enemy.id}-${dive.room}`}
              poses={getEnemyPoses(dive.currentKind)}
              activePose={dive.enemyPose === "knockback" ? "hurt" : dive.enemyPose}
              name={enemy.name}
              sub={dive.currentKind === "boss" ? "BOSS" : dive.currentKind === "miniboss" ? "MINI-BOSS" : "Trash Mob"}
              hp={enemy.hp}
              maxHp={enemy.maxHp}
              side="right"
              flashKey={dive.enemyFlashKey}
              knockbackKey={dive.knockbackKey}
              defeatKey={enemy.hp <= 0 ? dive.enemyDefeatKey : 0}
              fx={dive.fx.filter(f => f.target === "enemy")}
              tone={dive.currentKind === "boss" ? "boss" : "destructive"}
            />
          ) : (
            <NonCombatPanel kind={dive.currentKind} cleared={dive.roomCleared} />
          )}

          {(mangaFxArt || mangaWordArt) && (
            <MangaOverlay fxSrc={mangaFxArt} wordSrc={mangaWordArt} focus={dive.mangaFocus} />
          )}
          <PanelSplitOverlay k={dive.panelSplitKey} />
        </div>
      </div>

      {/* Room cleared banner */}
      {dive.roomCleared && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none bg-black/50 backdrop-blur-[1px]">
          <div className="animate-banner-slam chunky-panel bg-primary text-primary-foreground px-8 py-4 text-center">
            <div className="font-display text-4xl md:text-5xl tracking-widest leading-none">
              {dive.room >= dive.totalRooms ? "DUMPSTER CLEARED" : "ROOM CLEARED"}
            </div>
            {dive.roomEvent && (
              <div className="mt-2 font-bold text-sm uppercase tracking-wider">{dive.roomEvent}</div>
            )}
          </div>
          <NextRoomPreview />
        </div>
      )}
    </div>
  );
}

const CAT_ART = {
  idle: catIdle,
  scratch: catScratch,
  pounce: catPounce,
  item: catItem,
  hurt: catHurt,
  block: catBlock,
  ko: catKo,
  victory: catVictory,
  combo: catCombo,
  knockback: catKnockback,
} as const;

const FX_ART = { slash: fxSlash, impact: fxImpact, crit: fxCrit, heal: fxHeal, block: fxBlock, miss: fxMiss, combo: fxCombo } as const;
const WORD_ART = { bam: wordBam, pow: wordPow, slash: wordSlash, crit: wordCrit, combo: wordCombo } as const;

type EnemyPoseKey = "idle" | "attack" | "hurt" | "ko";
function getEnemyPoses(kind: RoomKind): Record<EnemyPoseKey, string> {
  if (kind === "boss") return { idle: bossIdle, attack: bossAttack, hurt: bossHurt, ko: bossKo };
  if (kind === "miniboss") return { idle: minibossIdle, attack: minibossAttack, hurt: minibossHurt, ko: minibossKo };
  return { idle: enemyIdle, attack: enemyAttack, hurt: enemyHurt, ko: enemyKo };
}

function MangaOverlay({ fxSrc, wordSrc, focus }: { fxSrc: string | null; wordSrc: string | null; focus: "cat" | "enemy" | "center" | null }) {
  const pos = focus === "cat" ? "left-[16%]" : focus === "enemy" ? "right-[12%]" : "left-1/2 -translate-x-1/2";
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {fxSrc && (
        <img
          src={fxSrc}
          alt=""
          aria-hidden="true"
          className={`absolute top-1/3 ${pos} manga-fx-pop w-40 md:w-52 ${focus === "enemy" ? "-scale-x-100" : ""}`}
        />
      )}
      {wordSrc && (
        <img
          src={wordSrc}
          alt=""
          aria-hidden="true"
          className={`absolute bottom-8 ${focus === "enemy" ? "right-8" : focus === "cat" ? "left-6" : "left-1/2 -translate-x-1/2"} manga-word-slam w-28 md:w-36`}
        />
      )}
    </div>
  );
}

function CombatantSprite({
  name, sub, poses, activePose, hp, maxHp, side, knockbackKey = 0, defeatKey = 0, fx, tone, combo = 0,
}: {
  name: string; sub: string;
  poses: Record<string, string>;
  activePose: string;
  hp: number; maxHp: number; side: "left" | "right";
  knockbackKey?: number; defeatKey?: number; fx: Fx[];
  tone: "primary" | "destructive" | "boss";
  combo?: number;
}) {
  const [kbId, setKbId] = useState(0);
  useEffect(() => { if (knockbackKey > 0) setKbId(k => k + 1); }, [knockbackKey]);
  const pct = (hp / maxHp) * 100;
  const low = pct > 0 && pct < 30;
  const dead = hp <= 0;
  const barColor = tone === "primary" ? "bg-primary" : tone === "boss" ? "bg-secondary" : "bg-destructive";
  const align = side === "left" ? "items-start" : "items-end";
  const portraitSize = "w-40 h-40 md:w-52 md:h-52";
  const kbClass = kbId > 0 ? (side === "left" ? "animate-knockback-left" : "animate-knockback-right") : "";

  return (
    <div className={`relative flex flex-col ${align} justify-end gap-2`}>
      {/* Floating numbers anchor */}
      <div key={kbId} className={`relative ${kbClass}`}>
        <FloatingNumbers fx={fx} />
        {dead && defeatKey > 0 && <DefeatBurst k={defeatKey} />}
        <div className={`relative ${portraitSize} ${low ? "animate-pulse-glow" : "animate-floaty"} ${dead ? "opacity-30 grayscale !animate-none" : ""}`}>
          {Object.entries(poses).map(([key, src]) => (
            <img
              key={key}
              src={src}
              alt={key === activePose ? name : ""}
              aria-hidden={key !== activePose}
              draggable={false}
              decoding="sync"
              width={1024}
              height={1024}
              className={`absolute inset-0 size-full object-contain transition-opacity duration-200 ease-out ${side === "right" ? "-scale-x-100" : ""} ${key === activePose ? "opacity-100" : "opacity-0"}`}
            />
          ))}
          {/* hit flash — radial burst growing from character */}
          {flashId > 0 && (
            <div
              key={flashId}
              className="pointer-events-none absolute inset-0 animate-flash-hit rounded-full mix-blend-screen"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(239,68,68,0.85) 0%, rgba(239,68,68,0.5) 35%, rgba(239,68,68,0) 70%)",
              }}
            />
          )}
        </div>
        {/* platform + shadow */}
        <div className="relative mx-auto mt-2 flex flex-col items-center">
          <div className="h-2 w-28 rounded-full bg-black/80 blur-md" />
          <div className="-mt-1.5 h-1 w-24 rounded-full bg-toxic/40 blur-sm" />
        </div>
      </div>

      {/* HP block */}
      <div className={`w-full max-w-[260px] ${side === "right" ? "self-end text-right" : ""}`}>
        <div className="flex items-baseline justify-between gap-2">
          <div className="font-display text-lg uppercase leading-none truncate">{name}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{sub}</div>
        </div>
        <div className="mt-1 h-3 border-2 border-black bg-slate-900 grid grid-cols-10 gap-px overflow-hidden">
          {Array.from({ length: 10 }).map((_, i) => {
            const filled = (pct / 10) > i;
            return <div key={i} className={`${filled ? barColor : "bg-transparent"}`} />;
          })}
        </div>
        <div className="mt-0.5 font-mono text-[10px] font-bold">{hp}/{maxHp}</div>
        {combo > 0 && (
          <div className="mt-1">
            <div className="flex items-center justify-between text-[9px] uppercase tracking-widest">
              <span className="text-accent font-display">Combo x{combo}</span>
              {combo >= 3 && <span className="text-toxic font-display animate-pulse">FINISHER READY</span>}
            </div>
            <div className="mt-0.5 h-1.5 bg-slate-900 border border-black overflow-hidden">
              <div
                key={combo}
                className="h-full bg-gradient-to-r from-accent via-toxic to-accent animate-combo-meter"
                style={{ width: `${Math.min(100, combo * 25)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PanelSplitOverlay({ k }: { k: number }) {
  const [id, setId] = useState(0);
  useEffect(() => { if (k > 0) setId(n => n + 1); }, [k]);
  if (id === 0) return null;
  return (
      <div key={id} className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <div className="absolute inset-0 bg-black/60 manga-panel-flash" />
      <img
        src={panelSplit}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 size-full object-cover manga-panel-split"
      />
    </div>
  );
}

function FloatingNumbers({ fx }: { fx: Fx[] }) {
  const clearFx = useGame(s => s.clearFx);
  useEffect(() => {
    const timers = fx.map(f => setTimeout(() => clearFx(f.id), 900));
    return () => { timers.forEach(clearTimeout); };
  }, [fx, clearFx]);
  return (
    <div className="pointer-events-none absolute left-1/2 top-2 z-10">
      {fx.map(f => {
        const cls = f.kind === "crit" ? "text-accent text-4xl md:text-5xl"
          : f.kind === "heal" ? "text-primary text-2xl"
          : f.kind === "miss" ? "text-muted-foreground text-xl"
          : "text-destructive text-2xl";
        const label = f.kind === "heal" ? `+${f.amount}` : f.kind === "miss" ? "MISS" : `-${f.amount}`;
        const suffix = f.kind === "crit" ? "  CRIT!" : "";
        return (
          <span key={f.id} className={`absolute left-0 top-0 -translate-x-1/2 font-display font-black drop-shadow-[2px_2px_0_#000] animate-rise-fade ${cls}`}>
            {label}{suffix}
          </span>
        );
      })}
    </div>
  );
}

function DefeatBurst({ k }: { k: number }) {
  const parts = Array.from({ length: 8 });
  return (
    <div key={k} className="pointer-events-none absolute inset-0 z-10">
      {parts.map((_, i) => {
        const a = (i / parts.length) * Math.PI * 2;
        const r = 60;
        return (
          <span key={i}
            className="absolute left-1/2 top-1/2 text-2xl animate-burst"
            style={{
              ["--bx" as never]: `${Math.cos(a) * r}px`,
              ["--by" as never]: `${Math.sin(a) * r}px`,
              animationDelay: `${i * 20}ms`,
            }}>
            ✨
          </span>
        );
      })}
    </div>
  );
}

function NonCombatPanel({ kind, cleared }: { kind: RoomKind; cleared: boolean }) {
  const meta = {
    loot: { icon: roomLoot, title: "LOOT PILE", desc: "A shimmering mound of trash treasure." },
    hazard: { icon: roomHazard, title: "HAZARD", desc: "Glowing goo bubbling from a busted jar." },
    rest: { icon: roomRest, title: "SAFE NEST", desc: "Warm laundry. The cat can catch a breath." },
    enemy: { icon: "⚔️", title: "EMPTY", desc: "" },
    miniboss: { icon: "👹", title: "EMPTY", desc: "" },
    boss: { icon: "👑", title: "EMPTY", desc: "" },
  }[kind];
  const isArtRoom = kind === "loot" || kind === "hazard" || kind === "rest";
  return (
    <div className="relative flex flex-col items-end justify-end gap-2">
      <div className={`w-32 h-32 md:w-40 md:h-40 flex items-center justify-center ${cleared ? "opacity-40 grayscale" : "animate-floaty"}`}>
        {isArtRoom ? (
          <img src={meta.icon} alt={meta.title} className="size-full object-contain" loading="lazy" width={1024} height={1024} />
        ) : (
          <div className="text-7xl">{meta.icon}</div>
        )}
      </div>
      <div className="mx-auto mt-1 h-1.5 w-20 rounded-full bg-black/70 blur-sm" />
      <div className="w-full max-w-[260px] text-right">
        <div className="font-display text-lg uppercase leading-none">{meta.title}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{meta.desc}</div>
      </div>
    </div>
  );
}