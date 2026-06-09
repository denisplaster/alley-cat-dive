// SSR-safe Phaser usage.
// `import type * as Phaser` is 100% erased at build time, so the "phaser" package
// never enters the server bundle (Phaser 4 touches browser globals at module-eval
// time and crashes TanStack Start SSR). All TYPE annotations below use this.
import type * as Phaser from "phaser";
// The RUNTIME value is injected client-only by PhaserBattle via setPhaser(),
// before this module is dynamically imported. Use `P.*` for any runtime
// constant/class (P.Scene, P.BlendModes, P.TintModes, P.Loader.Events, ...).
let P!: typeof import("phaser");
export function setPhaser(phaser: typeof import("phaser")) {
  P = phaser;
  if (!RaidSceneClass) RaidSceneClass = createRaidSceneClass();
}

// Lazily-built scene class. Built after setPhaser() is called so that
// `extends P.Scene` doesn't evaluate before Phaser is available.
let RaidSceneClass: any = null;
export function getRaidSceneClass(): any {
  if (!RaidSceneClass) RaidSceneClass = createRaidSceneClass();
  return RaidSceneClass;
}

import type { Actor, FloatingNumber, RaidState } from "@/lib/game/raidTypes";
import { previewQueue } from "@/lib/game/raidEngine";

export interface RaidSceneInit {
  bgUrl: string;
  /** key -> url for every actor sprite we might draw. */
  sprites: Record<string, string>;
  onActorClick: (uid: string) => void;
  /** Selection mode: when true, enemies highlight as targets. */
  getTargetMode: () => boolean;
}

/** Coordinates for up to 3 slots per side. */
const SLOTS = [0.25, 0.50, 0.75]; // vertical fractions within battle area

interface ActorView {
  uid: string;
  sprite: Phaser.GameObjects.Image;
  hitZone: Phaser.GameObjects.Zone;
  shadow: Phaser.GameObjects.Ellipse;
  nameText: Phaser.GameObjects.Text;
  hpBar: Phaser.GameObjects.Graphics;
  hpText: Phaser.GameObjects.Text;
  baseX: number;       // current "home" anchor X (where idle plays)
  baseY: number;       // current "home" anchor Y
  homeX: number;       // line position X (returns here after stepping up)
  homeY: number;       // line position Y
  depthScale: number;  // size/z multiplier from depth in the formation
  stepped: boolean;    // currently stepped forward (active turn)?
  idlePhase: number;   // per-actor phase offset so motion isn't synchronized
  side: "party" | "enemy";
  alive: boolean;
  baseScaleX: number;  // raw sprite scale from last setDisplaySize (idle multiplies this)
  baseScaleY: number;
  idleTween?: Phaser.Tweens.Tween;
  targetRing?: Phaser.GameObjects.Graphics;
  targetTween?: Phaser.Tweens.Tween;
  hitListener?: () => void;
}

const ELEMENT_COLOR: Record<string, number> = {
  claw: 0xffffff, fire: 0xff7a3a, ice: 0x8be9ff,
  shock: 0xffe14a, stink: 0xc7ff5b,
};

// Public handle used by callers: `RaidScene.KEY` for the scene key, and
// `new RaidScene()` / passing as a class is proxied to the real lazy class.
export const RaidScene: any = new Proxy(function RaidSceneStub() {} as any, {
  construct(_t, args) {
    const C = getRaidSceneClass();
    return Reflect.construct(C, args);
  },
  get(_t, prop) {
    if (prop === "KEY") return "RaidScene";
    const C = RaidSceneClass;
    return C ? (C as any)[prop] : undefined;
  },
});

function createRaidSceneClass() {
  class RaidScene extends P.Scene {
  static KEY = "RaidScene";

  private init_!: RaidSceneInit;
  private bg!: Phaser.GameObjects.Image;
  private vignette!: Phaser.GameObjects.Graphics;
  private actors = new Map<string, ActorView>();
  private floats = new Set<number>();
  private queueGroup!: Phaser.GameObjects.Container;
  private banner!: Phaser.GameObjects.Container;
  private overdriveCard!: Phaser.GameObjects.Container;
  private lastShakeKey = 0;
  private lastFlash: Record<string, number> = {};
  private lastODKey = 0;
  private targetMode = false;
  private state: RaidState | null = null;
  private loadingSprites = new Set<string>();
  // Bottom 90px reserved for the React action bar.
  private bottomPad = 96;
  private _animTimer?: Phaser.Time.TimerEvent;

  constructor() { super({ key: "RaidScene" }); }

  init(data: RaidSceneInit) {
    this.init_ = data;
  }

  preload() {
    this.load.image("bg", this.init_.bgUrl);
    for (const [k, url] of Object.entries(this.init_.sprites)) {
      this.load.image(this.textureKey(k), url);
    }
  }

  private textureKey(raw: string) {
    return raw === "__fallback" ? raw : `raid_${raw.replace(/[^a-z0-9_-]/gi, "_")}`;
  }

  create() {
    const { width, height } = this.scale;
    // Background
    this.bg = this.add.image(width / 2, height / 2, "bg");
    this.fitBackground();
    // Vignette
    this.vignette = this.add.graphics();
    this.drawVignette();
    // Floor shadow strip
    const floor = this.add.graphics();
    floor.fillStyle(0x000000, 0.45);
    floor.fillRect(0, height - this.bottomPad - 70, width, 70);
    // Turn queue container (top)
    this.queueGroup = this.add.container(0, 0);
    // Centre banner container (room cleared / victory / defeat)
    this.banner = this.add.container(width / 2, height * 0.42).setDepth(50).setVisible(false);
    this.overdriveCard = this.add.container(width / 2, height / 2).setDepth(60).setVisible(false);

    this.scale.on("resize", this.handleResize, this);
    // Phaser's per-frame Scene.update() is not reliably bound for this scene
    // (it is registered through a Proxy class), so drive all per-frame motion
    // from a repeating timer that runs off the global game clock instead.
    this._animTimer = this.time.addEvent({
      delay: 16, loop: true, callback: () => this.tick(),
    });
    this.events.on(P.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
      this._animTimer?.remove();
    });
  }

  /** Per-frame motion, driven by the repeating timer started in create(). */
  private tick() {
    const time = this.time.now;
    const nextTargetMode = this.init_?.getTargetMode?.() ?? false;
    if (nextTargetMode !== this.targetMode) {
      this.targetMode = nextTargetMode;
      this.updateTargetRings();
    }
    this.animateIdle(time);
    this.driftCamera(time);
  }

  // (Phaser may also call this if the hook is bound; harmless either way.)
  update() { /* motion runs from tick() via timer — see create() */ }

  /** Procedural "living" idle: breathing scale, vertical bob, gentle sway.
   *  Skipped for an actor while it is mid-strike (busy flag) so tweens win. */
  private animateIdle(time: number) {
    const tt = time * 0.001;
    for (const v of this.actors.values()) {
      if (!v.alive || (v as any)._busy) continue;
      const ph = v.idlePhase;
      const stepped = v.stepped;
      // Breathing squash & stretch (±6% on Y, opposite on X) multiplied
      // against the raw scale chosen by setDisplaySize in layoutActors.
      const breathe = Math.sin(tt * 2.2 + ph);
      const step = stepped ? 1.12 : 1;
      const sx = v.baseScaleX * (1 - breathe * 0.04) * step;
      const sy = v.baseScaleY * (1 + breathe * 0.06) * step;
      v.sprite.setScale(sx, sy);

      // Vertical bob (bigger) + horizontal sway + gentle rotation "tail sway".
      const bobAmp = stepped ? 12 : 7;
      const bobY = Math.sin(tt * 2.2 + ph) * bobAmp;
      const swayX = Math.cos(tt * 1.1 + ph) * (stepped ? 7 : 4);
      const rot = Math.sin(tt * 0.9 + ph) * (stepped ? 0.05 : 0.03); // radians
      v.sprite.setPosition(v.baseX + swayX, v.baseY + bobY);
      v.sprite.setRotation(rot);

      // shadow/labels stay glued to the anchor, not the bob
      this.positionLabels(v);
    }
  }

  /** Slow Ken-Burns drift so the locked wide shot never feels frozen. */
  private driftCamera(time: number) {
    if ((this as any)._camBusy) return;          // don't fight punch-in pans
    const cam = this.cameras.main;
    const tt = time * 0.001;
    // Visible Ken-Burns: gentle zoom breath (1.00 .. 1.035) + slow parallax drift.
    const zoom = 1.018 + Math.sin(tt * 0.25) * 0.018;
    cam.setZoom(zoom);
    const ox = Math.sin(tt * 0.20) * 16;
    const oy = Math.cos(tt * 0.15) * 9;
    cam.setScroll(ox, oy);
  }

  private handleResize = () => {
    this.fitBackground();
    this.drawVignette();
    this.layoutActors();
    this.updateTargetRings();
    this.layoutQueue();
    if (this.banner.visible) this.banner.setPosition(this.scale.width / 2, this.scale.height * 0.42);
    this.overdriveCard.setPosition(this.scale.width / 2, this.scale.height / 2);
  };

  private fitBackground() {
    const { width, height } = this.scale;
    if (!this.bg) return;
    const tex = this.bg.texture.getSourceImage() as HTMLImageElement;
    // Overscale ~6% so the Ken-Burns camera drift never reveals black edges.
    const scale = Math.max(width / tex.width, height / tex.height) * 1.06;
    this.bg.setPosition(width / 2, height / 2).setScale(scale);
  }

  private drawVignette() {
    const { width, height } = this.scale;
    this.vignette.clear();
    // Darken edges with a layered alpha box
    this.vignette.fillStyle(0x000000, 0.55);
    this.vignette.fillRect(0, 0, width, height);
    // Soft cut-out
    this.vignette.fillStyle(0x000000, 0.0);
    this.vignette.fillCircle(width / 2, height / 2, Math.min(width, height) * 0.45);
    // Top + bottom gradients via rects with alpha
    this.vignette.fillStyle(0x000000, 0.7);
    this.vignette.fillRect(0, 0, width, 64);
    this.vignette.fillRect(0, height - this.bottomPad, width, this.bottomPad);
    this.vignette.setBlendMode(P.BlendModes.MULTIPLY);
  }

  /** Called by the React wrapper whenever zustand raid state changes. */
  syncState(state: RaidState) {
    const first = this.state === null;
    this.state = state;
    this.syncActors(state);
    this.layoutQueue();
    this.processFloats(state.floats);
    this.processFlashes(state.flash);
    this.processShake(state.shakeKey);
    this.processOverdrive(state.overdriveOverlay);
    this.targetMode = this.init_.getTargetMode();
    this.updateTargetRings();
    this.processBanner(state);
    if (first) this.cameras.main.fadeIn(450, 0, 0, 0);
  }

  // ---- Actors -----------------------------------------------------------

  private syncActors(state: RaidState) {
    const seen = new Set<string>();
    state.party.forEach((a, i) => { seen.add(a.uid); this.upsertActor(a, "party", i, state.party.length); });
    state.enemies.forEach((a, i) => { seen.add(a.uid); this.upsertActor(a, "enemy", i, state.enemies.length); });
    // Remove vanished
    for (const uid of [...this.actors.keys()]) {
      if (!seen.has(uid)) {
        const v = this.actors.get(uid)!;
        v.sprite.destroy(); v.hitZone.destroy(); v.shadow.destroy(); v.nameText.destroy();
        v.hpBar.destroy(); v.hpText.destroy(); v.targetRing?.destroy();
        v.targetTween?.stop();
        v.idleTween?.stop();
        this.actors.delete(uid);
      }
    }
    this.layoutActors();
    // Highlight active actor + make it step forward out of the line.
    const active = state.activeUid;
    for (const [uid, v] of this.actors) {
      const isActive = uid === active;
      v.nameText.setBackgroundColor(isActive ? "#ffd54a" : "rgba(0,0,0,0.6)");
      v.nameText.setColor(isActive ? "#000" : "#fff");
      if (isActive && !v.stepped && v.alive) this.stepForward(v);
      else if (!isActive && v.stepped) this.stepBack(v);
    }
  }

  private upsertActor(a: Actor, side: "party"|"enemy", index: number, count: number) {
    let view = this.actors.get(a.uid);
    if (!view) {
      const key = this.spriteKey(a);
      const useKey = this.ensureActorTexture(key, side);
      if (useKey === "__fallback" && !this.textures.exists("__fallback")) {
        const g = this.make.graphics({ x: 0, y: 0 });
        g.fillStyle(side === "party" ? 0x4fc3ff : 0xff5050, 1).fillCircle(40, 40, 40);
        g.generateTexture("__fallback", 80, 80);
        g.destroy();
      }
      const sprite = this.add.image(0, 0, useKey)
        .setOrigin(0.5, 0.5);
      if (side === "enemy") sprite.setFlipX(true);
      // Click handler for target selection
      const onTap = () => {
        const current = this.actors.get(a.uid);
        if (side === "enemy" && current?.alive && this.init_.getTargetMode()) this.init_.onActorClick(a.uid);
      };
      const hitZone = this.add.zone(0, 0, 180, 240)
        .setOrigin(0.5, 0.5)
        .setDepth(6)
        .setInteractive({ useHandCursor: true });
      hitZone.on("pointerdown", onTap);

      const shadow = this.add.ellipse(0, 0, 90, 18, 0x000000, 0.55);
      shadow.setDepth(0);
      sprite.setDepth(1);

      const nameText = this.add.text(0, 0, a.name, {
        fontFamily: "monospace, sans-serif",
        fontSize: "11px",
        color: "#fff",
        backgroundColor: "rgba(0,0,0,0.6)",
        padding: { left: 4, right: 4, top: 1, bottom: 1 },
      }).setOrigin(0.5, 0).setDepth(3);

      const hpBar = this.add.graphics().setDepth(3);
      const hpText = this.add.text(0, 0, "", {
        fontFamily: "monospace, sans-serif",
        fontSize: "9px",
        color: "#fff",
      }).setOrigin(0.5, 0).setDepth(4);

      view = {
        uid: a.uid, sprite, hitZone, shadow, nameText, hpBar, hpText,
        baseX: 0, baseY: 0, homeX: 0, homeY: 0, depthScale: 1, stepped: false,
        idlePhase: Math.random() * Math.PI * 2,
        side, alive: a.alive, hitListener: onTap,
        baseScaleX: 1, baseScaleY: 1,
      };
      this.actors.set(a.uid, view);
      // Idle motion is driven procedurally in update() (see animateIdle()).
    }
    // Death handling — once
    if (view.alive && !a.alive) {
      view.alive = false;
      view.idleTween?.stop();
      this.tweens.add({
        targets: view.sprite,
        angle: side === "party" ? 90 : -90,
        alpha: 0.35,
        duration: 480,
        ease: "Back.easeIn",
      });
      view.shadow.setAlpha(0.2);
    } else if (!view.alive && a.alive) {
      // revive (Nine Lives)
      view.alive = true;
      view.sprite.setAlpha(1).setAngle(0);
      view.shadow.setAlpha(0.55);
      view.idleTween?.resume();
    }
    // Update HP bar
    this.drawHpBar(view, a);
    // Store reference values
    (view as any)._actor = a;
  }

  private spriteKey(a: Actor) {
    // uid formats:
    //   party:  p${idx}-${catId}        →  cat:<catId>
    //   enemy:  e${room}-${i}-${enId}   →  enemy:<enId>
    if (a.side === "party") {
      const m = /^p\d+-(.+)$/.exec(a.uid);
      return m ? `cat:${m[1]}` : "__fallback";
    }
    const m = /^e\d+-\d+-(.+)$/.exec(a.uid);
    return m ? `enemy:${m[1]}` : "__fallback";
  }

  private ensureActorTexture(rawKey: string, side: "party" | "enemy") {
    const phaserKey = this.textureKey(rawKey);
    if (this.textures.exists(phaserKey)) return phaserKey;

    const url = this.init_.sprites[rawKey];
    if (url && !this.loadingSprites.has(rawKey)) {
      this.loadingSprites.add(rawKey);
      this.load.image(phaserKey, url);
      this.load.once(P.Loader.Events.COMPLETE, () => {
        this.loadingSprites.delete(rawKey);
        for (const v of this.actors.values()) {
          const actor = (v as any)._actor as Actor | undefined;
          if (actor && this.spriteKey(actor) === rawKey && this.textures.exists(phaserKey)) {
            v.sprite.setTexture(phaserKey).setAlpha(v.alive ? 1 : 0.35);
            if (v.side === "enemy") v.sprite.setFlipX(true);
          }
        }
        this.layoutActors();
      });
      if (!this.load.isLoading()) this.load.start();
    }

    if (!this.textures.exists("__fallback")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(side === "party" ? 0x4fc3ff : 0xff5050, 1).fillCircle(40, 40, 40);
      g.generateTexture("__fallback", 80, 80);
      g.destroy();
    }
    return "__fallback";
  }

  private drawHpBar(v: ActorView, a: Actor) {
    const W = 110, H = 6, gap = 2;
    v.hpBar.clear();
    const drawBar = (yOff: number, frac: number, color: number) => {
      v.hpBar.fillStyle(0x000000, 0.7); v.hpBar.fillRect(-W/2, yOff, W, H);
      v.hpBar.fillStyle(color, 1); v.hpBar.fillRect(-W/2 + 1, yOff + 1, (W - 2) * Math.max(0, Math.min(1, frac)), H - 2);
      v.hpBar.lineStyle(1, 0x000000, 1); v.hpBar.strokeRect(-W/2, yOff, W, H);
    };
    // hp/mp/od bars stacked under the name (hpBar's y is already set to start
    // BELOW the name text in positionLabels — so offsets are relative to that)
    let yOff = 0;
    drawBar(yOff, a.hp / a.maxHp, 0x3ddc84); yOff += H + gap;
    if (a.side === "party") {
      drawBar(yOff, a.mp / a.maxMp, 0x4fc3ff); yOff += H + gap;
    }
    drawBar(yOff, a.od / a.odMax, 0xffc14a); yOff += H + gap;
    v.hpText.setText(`${Math.round(a.hp)}/${a.maxHp}`);
    v.hpText.setPosition(v.hpBar.x, v.hpBar.y + yOff);
  }

  private layoutActors() {
    const { width, height } = this.scale;
    const stageH = height - this.bottomPad - 70;
    const party = (this.state?.party ?? []);
    const enemies = (this.state?.enemies ?? []);

    // Formation: each side fans along a diagonal so members sit at different
    // depths. Front members are lower on screen (closer => bigger), back members
    // are higher and pushed toward the centre line. This reads as a 3D space.
    const place = (arr: Actor[], side: "party" | "enemy") => {
      const n = arr.length;
      const dir = side === "party" ? 1 : -1;             // party faces right, enemies left
      const frontX = side === "party" ? width * 0.20 : width * 0.80;
      const topY = stageH * 0.34, botY = stageH * 0.92;
      arr.forEach((a, i) => {
        const v = this.actors.get(a.uid);
        if (!v) return;
        // t: 0 = front/bottom, 1 = back/top
        const t = n === 1 ? 0.5 : i / (n - 1);
        const y = botY + (topY - botY) * t;
        // back ranks step inward (toward centre) and shrink — fake perspective
        const inset = t * width * 0.10 * dir;
        const x = frontX + inset;
        const depthScale = 1.12 - t * 0.34;              // front 1.12 -> back 0.78

        v.homeX = x; v.homeY = y; v.depthScale = depthScale;
        if (!v.stepped) { v.baseX = x; v.baseY = y; }

        // size scaled by depth
        const target = (side === "party" ? 128 : 138) * depthScale;
        const frameH = v.sprite.frame?.height ?? 0;
        const frameW = v.sprite.frame?.width ?? 0;
        if (frameH > 2 && frameW > 2) {
          const sc = target / frameH;
          v.sprite.setDisplaySize(frameW * sc, frameH * sc);
        } else {
          v.sprite.setDisplaySize(target, target);
        }
        v.baseScaleX = v.sprite.scaleX;
        v.baseScaleY = v.sprite.scaleY;
        const dispH = v.sprite.displayHeight || target;
        const dispW = v.sprite.displayWidth || target;

        if (!v.stepped) v.sprite.setPosition(v.baseX, v.baseY);
        // depth z-order: closer (front) draws on top
        v.sprite.setDepth(2 + (1 - t) * 4);
        v.shadow.setDepth(1);
        v.shadow.setScale(depthScale);

        const hitW = Math.max(100, dispW * 0.8);
        const hitH = Math.max(110, dispH * 0.85);
        v.hitZone.setPosition(v.baseX, v.baseY);
        v.hitZone.setSize(hitW, hitH);
        if (v.hitZone.input?.hitArea) {
          (v.hitZone.input.hitArea as Phaser.Geom.Rectangle).setTo(0, 0, hitW, hitH);
        }
        v.shadow.setPosition(v.baseX, v.baseY + dispH / 2 + 2);
        this.positionLabels(v, dispH);
        this.drawHpBar(v, (v as any)._actor as Actor);
      });
    };
    place(party, "party");
    place(enemies, "enemy");
  }

  /** Keep name/hp UI glued under a sprite at its current position. */
  private positionLabels(v: ActorView, dispH?: number) {
    const h = dispH ?? v.sprite.displayHeight ?? 120;
    const yo = v.baseY + h / 2 + 6;
    v.nameText.setPosition(v.baseX, yo);
    // Stack bars below the name plate (~16px tall), then hp text under bars.
    const barsY = yo + 16;
    v.hpBar.setPosition(v.baseX, barsY);
    // hpText position is finalized inside drawHpBar once bar count is known.
    v.hpText.setPosition(v.baseX, barsY);
    v.shadow.setPosition(v.baseX, v.baseY + h / 2 + 2);
  }

  /** Active actor steps forward toward the centre line. */
  private stepForward(v: ActorView) {
    v.stepped = true;
    const dir = v.side === "party" ? 1 : -1;
    v.baseX = v.homeX + dir * 70;
    v.baseY = v.homeY - 8;
    (v as any)._busy = true;
    this.tweens.add({
      targets: v.sprite, x: v.baseX, y: v.baseY, duration: 260, ease: "Quad.easeOut",
      onComplete: () => { (v as any)._busy = false; },
    });
    v.sprite.setDepth(7);
  }

  /** Return to the formation line when the turn ends. */
  private stepBack(v: ActorView) {
    v.stepped = false;
    v.baseX = v.homeX;
    v.baseY = v.homeY;
    (v as any)._busy = true;
    this.tweens.add({
      targets: v.sprite, x: v.baseX, y: v.baseY, duration: 280, ease: "Quad.easeInOut",
      onComplete: () => { (v as any)._busy = false; },
    });
  }

  // ---- Turn queue strip  // ---- Turn queue strip --------------------------------------------------

  private layoutQueue() {
    this.queueGroup.removeAll(true);
    if (!this.state) return;
    const all = [...this.state.party, ...this.state.enemies];
    const q = previewQueue(all, 7);
    const { width } = this.scale;
    const tileW = 86, tileH = 30, gap = 6;
    const totalW = q.length * tileW + (q.length - 1) * gap;
    let x = (width - totalW) / 2 + tileW / 2;
    q.forEach((a, i) => {
      const isActive = i === 0;                       // first in queue = acting now
      const isParty = a.side === "party";
      const c = this.add.container(x, isActive ? 34 : 30);
      const bg = this.add.graphics();
      // Color by side; the active tile is gold and larger.
      const fill = isActive ? 0xffd54a : isParty ? 0x1f3350 : 0x4a1224;
      const w = isActive ? tileW + 8 : tileW;
      const h = isActive ? tileH + 6 : tileH;
      bg.fillStyle(fill, isActive ? 1 : 0.85);
      bg.fillRoundedRect(-w/2, -h/2, w, h, 5);
      bg.lineStyle(isActive ? 2 : 1, isActive ? 0xffffff : 0x000000, 1);
      bg.strokeRoundedRect(-w/2, -h/2, w, h, 5);
      // small side pip so party/enemy read at a glance
      const pip = this.add.graphics();
      pip.fillStyle(isParty ? 0x4fc3ff : 0xff6b6b, 1);
      pip.fillRoundedRect(-w/2 + 3, -h/2 + 3, 4, h - 6, 2);
      const label = isActive ? "▶ " + a.name.slice(0, 9) : a.name.slice(0, 10);
      const name = this.add.text(-w/2 + 12, isActive ? -3 : 0, label, {
        fontFamily: "monospace", fontSize: isActive ? "11px" : "10px",
        color: isActive ? "#000" : "#fff", fontStyle: isActive ? "bold" : "normal",
      }).setOrigin(0, 0.5);
      c.add([bg, pip, name]);
      if (isActive) {
        const now = this.add.text(-w/2 + 12, 8, "NOW", {
          fontFamily: "monospace", fontSize: "8px", color: "#7a3b00", fontStyle: "bold",
        }).setOrigin(0, 0.5);
        c.add(now);
        // gentle pulse to draw the eye
        this.tweens.add({ targets: c, scale: { from: 1, to: 1.06 }, duration: 520, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      }
      this.queueGroup.add(c);
      x += tileW + gap;
    });
    // "NEXT UP" caption under the strip
    const cap = this.add.text(width / 2, 52, "TURN ORDER", {
      fontFamily: "monospace", fontSize: "8px", color: "#8aa0c0",
    }).setOrigin(0.5, 0).setAlpha(0.7);
    this.queueGroup.add(cap);
    this.queueGroup.setDepth(20);
  }

  // ---- Floating damage numbers  // ---- Floating damage numbers ------------------------------------------

  private processFloats(floats: FloatingNumber[]) {
    for (const f of floats) {
      if (this.floats.has(f.id)) continue;
      this.floats.add(f.id);
      const v = this.actors.get(f.uid);
      if (!v) continue;

      if (f.kind === "heal") { this.playHealEffect(v); this.spawnFloat(v, f); continue; }
      if (f.kind === "null") { this.spawnFloat(v, f); continue; }

      const big = f.kind === "crit" || f.kind === "weak" || f.amount >= 40;
      const attackerUid = this.state?.activeUid;
      const av = attackerUid && attackerUid !== f.uid ? this.actors.get(attackerUid) : undefined;

      if (av) {
        // Sequenced: anticipation -> lunge -> IMPACT (at apex) -> recover.
        this.cinematicStrike(av, v, f, big);
      } else {
        // No attacker (e.g. hazard/dot) — just resolve the impact.
        this.impact(v, f, big);
      }
    }
    if (this.floats.size > 200) this.floats = new Set([...this.floats].slice(-100));
  }

  /** FF-style staged melee: wind-up, dash to the target, land the blow at the apex. */
  private cinematicStrike(att: ActorView, tgt: ActorView, f: FloatingNumber, big: boolean) {
    (att as any)._busy = true;                 // idle hands off to the strike
    const dir = att.side === "party" ? 1 : -1;
    // Land just SHORT of the target on its near side (real travel, full distance).
    const stopX = tgt.baseX - dir * (tgt.sprite.displayWidth * 0.5 + 24);
    const stopY = tgt.baseY;
    const homeX = att.baseX, homeY = att.baseY;
    att.sprite.setDepth(9);                     // over everyone mid-strike

    // 1) Anticipation — crouch back away from the target.
    this.tweens.add({
      targets: att.sprite,
      x: homeX - dir * 22, y: homeY + 4,
      duration: 150, ease: "Quad.easeOut",
      onComplete: () => {
        // 2) Dash the full distance to the target.
        this.tweens.add({
          targets: att.sprite,
          x: stopX, y: stopY,
          duration: big ? 200 : 165, ease: "Quint.easeIn",
          onComplete: () => {
            // 3) IMPACT.
            this.impact(tgt, f, big);
            // brief overshoot lunge into the target for contact feel
            this.tweens.add({
              targets: att.sprite, x: stopX + dir * 14, duration: 70, yoyo: true, ease: "Sine.easeOut",
            });
            // 4) Travel back home.
            this.tweens.add({
              targets: att.sprite,
              x: homeX, y: homeY,
              duration: 320, ease: "Cubic.easeInOut", delay: big ? 150 : 90,
              onComplete: () => {
                att.sprite.setPosition(homeX, homeY);
                att.sprite.setDepth(att.stepped ? 7 : 4);
                (att as any)._busy = false;
              },
            });
          },
        });
      },
    });
  }

  /** The moment of contact: hitstop, shake, burst, recoil, number pop, optional camera punch. */
  private impact(tgt: ActorView, f: FloatingNumber, big: boolean) {
    const cam = this.cameras.main;
    // Hitstop — briefly slow time so the blow reads as weighty.
    const freeze = f.kind === "crit" ? 0.18 : big ? 0.32 : 0.6;
    this.time.timeScale = freeze;
    this.tweens.timeScale = freeze;
    this.time.delayedCall((f.kind === "crit" ? 90 : big ? 70 : 45) * freeze, () => {
      this.time.timeScale = 1; this.tweens.timeScale = 1;
    });

    // Camera punch-in on big/crit hits. Pause the idle drift so they don't fight,
    // then hand control back to drift afterward.
    if (big) {
      (this as any)._camBusy = true;
      const z = f.kind === "crit" ? 1.12 : 1.06;
      cam.zoomTo(z, 110, "Quad.easeOut");
      // nudge the focal point toward the target via the zoom origin
      cam.pan(tgt.baseX, tgt.baseY - 20, 110, "Quad.easeOut");
      this.time.delayedCall(260, () => {
        cam.zoomTo(1, 260, "Quad.easeInOut");
        cam.pan(this.scale.width / 2, this.scale.height / 2, 260, "Quad.easeInOut");
        this.time.delayedCall(280, () => { (this as any)._camBusy = false; });
      });
    }

    // Shake scaled to severity.
    const intensity = f.kind === "crit" ? 0.018 : big ? 0.013 : 0.006;
    cam.shake(big ? 260 : 150, intensity);

    this.playHitEffect(tgt, f.element, big, f.kind === "crit");
    this.spawnFloat(tgt, f);
  }

  private spawnFloat(v: ActorView, f: FloatingNumber) {
    const colorMap = {
      dmg: "#ffffff", crit: "#ffd54a", heal: "#3ddc84",
      weak: "#ff8a8a", resist: "#8be9ff", null: "#999999",
    } as const;
    const crit = f.kind === "crit";
    const text = f.kind === "null" ? "MISS"
      : f.kind === "heal" ? `+${f.amount}`
      : `${f.amount}${f.kind === "weak" ? " WEAK!" : ""}${crit ? "" : ""}`;
    const size = crit ? 40 : f.kind === "weak" ? 28 : f.amount >= 40 ? 30 : 22;
    const startX = v.baseX + P.Math.Between(-10, 10);
    const t = this.add.text(startX, v.baseY - 70, text, {
      fontFamily: "Impact, monospace, sans-serif",
      fontSize: `${size}px`, color: colorMap[f.kind],
      stroke: "#000", strokeThickness: crit ? 7 : 5, fontStyle: "bold",
    }).setOrigin(0.5).setDepth(40).setScale(0.2);

    if (crit) {
      // "CRITICAL!" tag above the number.
      const tag = this.add.text(startX, v.baseY - 104, "CRITICAL!", {
        fontFamily: "Impact, monospace", fontSize: "16px", color: "#ffec8a",
        stroke: "#000", strokeThickness: 4, fontStyle: "bold",
      }).setOrigin(0.5).setDepth(41).setScale(0.4).setAlpha(0);
      this.tweens.add({ targets: tag, alpha: 1, scale: 1, y: tag.y - 8, duration: 200, ease: "Back.easeOut",
        onComplete: () => this.tweens.add({ targets: tag, alpha: 0, y: tag.y - 26, delay: 500, duration: 350, onComplete: () => tag.destroy() }) });
    }

    // Pop in big, settle, then float up & fade.
    this.tweens.add({ targets: t, scale: crit ? 1.35 : 1.1, duration: 150, ease: "Back.easeOut",
      onComplete: () => {
        this.tweens.add({ targets: t, y: t.y - 64, alpha: { from: 1, to: 0 }, scale: t.scale * 0.85,
          duration: 760, delay: crit ? 220 : 90, ease: "Quad.easeIn", onComplete: () => t.destroy() });
      },
    });
  }

  // ---- Hit / heal particle bursts  // ---- Hit / heal particle bursts ---------------------------------------

  private ensureParticleTexture() {
    if (this.textures.exists("fx_dot")) return;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 1).fillCircle(6, 6, 6);
    g.generateTexture("fx_dot", 12, 12);
    g.destroy();
  }

  private playHitEffect(v: ActorView, element?: string, big = false, crit = false) {
    this.ensureParticleTexture();
    const color = ELEMENT_COLOR[element ?? "claw"] ?? 0xffffff;
    const cx = v.baseX, cy = v.baseY - 50;

    // Layer 1 — expanding shock ring.
    const ring = this.add.circle(cx, cy, 8, color, 0).setStrokeStyle(crit ? 5 : 3, color, 0.9).setDepth(38);
    this.tweens.add({ targets: ring, radius: crit ? 86 : big ? 64 : 44, alpha: { from: 0.9, to: 0 },
      duration: crit ? 380 : 280, ease: "Cubic.easeOut", onComplete: () => ring.destroy() });

    // Layer 2 — white flash sprite (the "pop").
    const flash = this.add.circle(cx, cy, crit ? 46 : 30, 0xffffff, 0.85).setDepth(37).setBlendMode("ADD");
    this.tweens.add({ targets: flash, scale: 1.8, alpha: 0, duration: 180, ease: "Quad.easeOut", onComplete: () => flash.destroy() });

    // Layer 3 — directional spark spray + element-tinted dots.
    const qty = crit ? 34 : big ? 24 : 16;
    const e = this.add.particles(cx, cy, "fx_dot", {
      lifespan: crit ? 620 : 460,
      speed: { min: 90, max: crit ? 420 : 280 },
      angle: { min: 0, max: 360 },
      scale: { start: crit ? 1.8 : 1.3, end: 0 },
      tint: [color, 0xffffff],
      blendMode: "ADD",
      quantity: qty, emitting: false,
    });
    e.explode(qty);
    this.time.delayedCall(800, () => e.destroy());

    // Sprite hit: white fill flash + a stronger directional recoil.
    v.sprite.setTint(0xffffff).setTintMode(P.TintModes.FILL);
    this.time.delayedCall(crit ? 110 : 70, () => v.sprite.clearTint().setTintMode(P.TintModes.MULTIPLY));
    const push = (crit ? 26 : big ? 18 : 11) * (v.side === "party" ? -1 : 1);
    this.tweens.add({ targets: v.sprite, x: v.baseX + push, angle: v.side === "party" ? -6 : 6,
      duration: 70, yoyo: true, ease: "Sine.easeOut",
      onComplete: () => v.sprite.setPosition(v.baseX, v.baseY).setAngle(0) });
  }

  private playHealEffect(v: ActorView) {
    this.ensureParticleTexture();
    const e = this.add.particles(v.baseX, v.baseY - 20, "fx_dot", {
      lifespan: 700,
      speedY: { min: -80, max: -160 },
      speedX: { min: -30, max: 30 },
      scale: { start: 0.9, end: 0 },
      tint: 0x3ddc84,
      blendMode: "ADD",
      quantity: 14,
      emitting: false,
    });
    e.explode(14);
    this.time.delayedCall(900, () => e.destroy());
  }

  // ---- Flash / shake / banners ------------------------------------------

  private processFlashes(flash: Record<string, number>) {
    for (const [uid, key] of Object.entries(flash)) {
      if (this.lastFlash[uid] === key) continue;
      this.lastFlash[uid] = key;
      const v = this.actors.get(uid); if (!v) continue;
      v.sprite.setTint(0xff5050).setTintMode(P.TintModes.FILL);
      this.time.delayedCall(110, () => v.sprite.clearTint().setTintMode(P.TintModes.MULTIPLY));
    }
  }

  private processShake(key: number) {
    if (key === this.lastShakeKey) return;
    this.lastShakeKey = key;
    this.cameras.main.shake(280, 0.012);
  }

  private processOverdrive(o: RaidState["overdriveOverlay"]) {
    if (!o || o.key === this.lastODKey) return;
    this.lastODKey = o.key;
    this.overdriveCard.removeAll(true);
    this.overdriveCard.setVisible(true);
    const w = 420, h = 110;
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.85); bg.fillRoundedRect(-w/2, -h/2, w, h, 8);
    bg.lineStyle(2, 0xffd54a, 1); bg.strokeRoundedRect(-w/2, -h/2, w, h, 8);
    const tag = this.add.text(0, -28, "OVERDRIVE", {
      fontFamily: "monospace", fontSize: "14px", color: "#ffd54a", fontStyle: "bold",
    }).setOrigin(0.5);
    const name = this.add.text(0, 6, o.def.name.toUpperCase(), {
      fontFamily: "monospace", fontSize: "32px", color: "#fff", fontStyle: "bold",
      stroke: "#000", strokeThickness: 4,
    }).setOrigin(0.5);
    this.overdriveCard.add([bg, tag, name]);
    this.overdriveCard.setScale(0.3).setAlpha(0);
    this.tweens.add({
      targets: this.overdriveCard, scale: 1, alpha: 1, duration: 280, ease: "Back.easeOut",
    });
    // Radial flash
    this.ensureParticleTexture();
    const center = { x: this.scale.width / 2, y: this.scale.height / 2 };
    const tint = (ELEMENT_COLOR[o.def.element] ?? 0xffffff);
    const ring = this.add.particles(center.x, center.y, "fx_dot", {
      lifespan: 700, speed: { min: 200, max: 600 },
      scale: { start: 2.0, end: 0 }, tint, blendMode: "ADD",
      quantity: 50, emitting: false,
    });
    ring.explode(50);
    this.time.delayedCall(900, () => ring.destroy());
    this.cameras.main.flash(220, 255, 230, 120);
    this.cameras.main.shake(420, 0.018);
    // Hide after a beat
    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: this.overdriveCard, alpha: 0, scale: 1.2, duration: 240,
        onComplete: () => this.overdriveCard.setVisible(false),
      });
    });
  }

  private processBanner(state: RaidState) {
    const livingFoes = state.enemies.filter(e => e.alive).length;
    const wantBanner = state.ended || (livingFoes === 0);
    if (!wantBanner) {
      this.banner.setVisible(false);
      return;
    }
    this.banner.removeAll(true);
    const w = 380, h = 96;
    const bg = this.add.graphics();
    const color = state.ended
      ? (state.victory ? 0x1f6c3a : 0x6b1f1f)
      : 0x1f4a6c;
    bg.fillStyle(color, 0.92); bg.fillRoundedRect(-w/2, -h/2, w, h, 8);
    bg.lineStyle(2, 0xffd54a, 1); bg.strokeRoundedRect(-w/2, -h/2, w, h, 8);
    const label = state.ended
      ? (state.victory ? "VICTORY" : "DEFEATED")
      : "ROOM CLEARED";
    const t = this.add.text(0, -8, label, {
      fontFamily: "monospace", fontSize: "36px", color: "#fff",
      fontStyle: "bold", stroke: "#000", strokeThickness: 5,
    }).setOrigin(0.5);
    const sub = this.add.text(0, 30, state.ended
        ? (state.victory ? `+${state.rewards?.spheres ?? 0} spheres` : "Better luck next dive.")
        : "Use Advance ↓ to continue",
      { fontFamily: "monospace", fontSize: "13px", color: "#ffd54a" })
      .setOrigin(0.5);
    this.banner.add([bg, t, sub]);
    this.banner.setVisible(true).setAlpha(0).setScale(0.7);
    this.tweens.add({ targets: this.banner, alpha: 1, scale: 1, duration: 280, ease: "Back.easeOut" });
  }

  // ---- Target-mode rings -------------------------------------------------

  private updateTargetRings() {
    const want = this.targetMode;
    for (const [uid, v] of this.actors) {
      const eligible = want && v.side === "enemy" && v.alive;
      if (eligible && !v.targetRing) {
        const g = this.add.graphics().setDepth(2);
        v.targetRing = g;
      }
      if (v.targetRing) {
        v.targetRing.clear();
        if (eligible) {
          v.targetRing.lineStyle(3, 0xffd54a, 1);
          v.targetRing.strokeCircle(0, 0, 48);
          v.targetRing.setPosition(v.baseX, v.baseY - 70);
          // Pulse
          v.targetRing.setAlpha(0.9);
          if (!v.targetTween) {
            v.targetTween = this.tweens.add({ targets: v.targetRing, alpha: 0.4, duration: 380, yoyo: true, repeat: -1 });
          }
        } else {
          v.targetTween?.stop();
          v.targetTween = undefined;
          v.targetRing.destroy();
          v.targetRing = undefined;
        }
      }
    }
  }
}
  return RaidScene;
}
