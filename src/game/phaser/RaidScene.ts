// SSR-safe Phaser usage.
// `import type * as Phaser` is 100% erased at build time, so the "phaser" package
// never enters the server bundle (Phaser 4 touches browser globals at module-eval
// time and crashes TanStack Start SSR). All TYPE annotations below use this.
import type * as Phaser from "phaser";
// The RUNTIME value is injected client-only by PhaserBattle via setPhaser(),
// before this module is dynamically imported. Use `P.*` for any runtime
// constant/class (P.Scene, P.BlendModes, P.TintModes, P.Loader.Events, ...).
let P!: typeof import("phaser");
export function setPhaser(phaser: typeof import("phaser")) { P = phaser; }

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
  baseX: number;
  baseY: number;
  side: "party" | "enemy";
  alive: boolean;
  idleTween?: Phaser.Tweens.Tween;
  targetRing?: Phaser.GameObjects.Graphics;
  targetTween?: Phaser.Tweens.Tween;
  hitListener?: () => void;
}

const ELEMENT_COLOR: Record<string, number> = {
  claw: 0xffffff, fire: 0xff7a3a, ice: 0x8be9ff,
  shock: 0xffe14a, stink: 0xc7ff5b,
};

export class RaidScene extends P.Scene {
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

  constructor() { super({ key: RaidScene.KEY }); }

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
    this.events.on(P.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });
  }

  update() {
    const nextTargetMode = this.init_?.getTargetMode?.() ?? false;
    if (nextTargetMode !== this.targetMode) {
      this.targetMode = nextTargetMode;
      this.updateTargetRings();
    }
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
    const scale = Math.max(width / tex.width, height / tex.height);
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
    // Highlight active actor
    const active = state.activeUid;
    for (const [uid, v] of this.actors) {
      const isActive = uid === active;
      v.nameText.setBackgroundColor(isActive ? "#ffd54a" : "rgba(0,0,0,0.6)");
      v.nameText.setColor(isActive ? "#000" : "#fff");
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
        baseX: 0, baseY: 0, side, alive: a.alive, hitListener: onTap,
      };
      this.actors.set(a.uid, view);
      // Idle bob
      view.idleTween = this.tweens.add({
        targets: sprite, angle: { from: -1.2, to: 1.2 }, duration: 1400 + index * 120,
        ease: "Sine.InOut", yoyo: true, repeat: -1,
      });
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
        ease: "Back.In",
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
    // hp/mp/od bars stacked under the name
    let yOff = 14;
    drawBar(yOff, a.hp / a.maxHp, 0x3ddc84); yOff += H + gap;
    if (a.side === "party") {
      drawBar(yOff, a.mp / a.maxMp, 0x4fc3ff); yOff += H + gap;
    }
    drawBar(yOff, a.od / a.odMax, 0xffc14a);
    v.hpText.setText(`${Math.round(a.hp)}/${a.maxHp}`);
    v.hpText.setPosition(v.nameText.x, v.nameText.y + 4 + H);
  }

  private layoutActors() {
    const { width, height } = this.scale;
    const stageH = height - this.bottomPad - 70;
    const partyX = width * 0.22, enemyX = width * 0.78;
    const baseY = stageH;
    const party = (this.state?.party ?? []);
    const enemies = (this.state?.enemies ?? []);
    const place = (arr: Actor[], x: number) => {
      arr.forEach((a, i) => {
        const v = this.actors.get(a.uid);
        if (!v) return;
        const n = arr.length;
        const yFrac = n === 1 ? 0.5 : i / (n - 1);
        const y = stageH * (0.30 + yFrac * 0.62);
        v.baseX = x + (i % 2 === 0 ? -38 : 38);
        v.baseY = y;
        // Scale by frame size to fit a fixed target height
        const target = arr === party ? 130 : 140;
        const frameH = v.sprite.frame?.height ?? 0;
        const frameW = v.sprite.frame?.width ?? 0;
        if (frameH > 2 && frameW > 2) {
          const s = target / frameH;
          v.sprite.setDisplaySize(frameW * s, frameH * s);
        } else {
          v.sprite.setDisplaySize(target, target);
        }
        const dispH = v.sprite.displayHeight || target;
        const dispW = v.sprite.displayWidth || target;
        v.sprite.setPosition(v.baseX, v.baseY);
        const hitW = Math.max(110, dispW * 0.8);
        const hitH = Math.max(120, dispH * 0.85);
        v.hitZone.setPosition(v.baseX, v.baseY);
        v.hitZone.setSize(hitW, hitH);
        if (v.hitZone.input?.hitArea) {
          (v.hitZone.input.hitArea as Phaser.Geom.Rectangle).setTo(0, 0, hitW, hitH);
        }
        v.shadow.setPosition(v.baseX, v.baseY + dispH / 2 + 2);
        v.nameText.setPosition(v.baseX, v.baseY + dispH / 2 + 6);
        v.hpText.setPosition(v.baseX, v.baseY + dispH / 2 + 6);
        v.hpBar.setPosition(v.baseX, v.baseY + dispH / 2 + 6);
        this.drawHpBar(v, (v as any)._actor as Actor);
      });
    };
    place(party, partyX);
    place(enemies, enemyX);
    void baseY;
  }

  // ---- Turn queue strip --------------------------------------------------

  private layoutQueue() {
    this.queueGroup.removeAll(true);
    if (!this.state) return;
    const all = [...this.state.party, ...this.state.enemies];
    const q = previewQueue(all, 7);
    const { width } = this.scale;
    const tileW = 80, tileH = 28, gap = 6;
    const totalW = q.length * tileW + (q.length - 1) * gap;
    let x = (width - totalW) / 2 + tileW / 2;
    q.forEach((a, i) => {
      const c = this.add.container(x, 30);
      const bg = this.add.graphics();
      const isActive = i === 0 && a.uid === this.state?.activeUid;
      const fill = isActive ? 0xffd54a : a.side === "party" ? 0x1f2a3a : 0x4a1020;
      bg.fillStyle(fill, 0.92); bg.fillRoundedRect(-tileW/2, -tileH/2, tileW, tileH, 4);
      bg.lineStyle(1, 0x000000, 1); bg.strokeRoundedRect(-tileW/2, -tileH/2, tileW, tileH, 4);
      const num = this.add.text(-tileW/2 + 6, 0, String(i + 1), {
        fontFamily: "monospace", fontSize: "11px",
        color: isActive ? "#000" : "#ffd54a",
      }).setOrigin(0, 0.5);
      const name = this.add.text(-tileW/2 + 18, 0, a.name.slice(0, 10), {
        fontFamily: "monospace", fontSize: "10px",
        color: isActive ? "#000" : "#fff",
      }).setOrigin(0, 0.5);
      c.add([bg, num, name]);
      this.queueGroup.add(c);
      x += tileW + gap;
    });
    this.queueGroup.setDepth(20);
  }

  // ---- Floating damage numbers ------------------------------------------

  private processFloats(floats: FloatingNumber[]) {
    for (const f of floats) {
      if (this.floats.has(f.id)) continue;
      this.floats.add(f.id);
      const v = this.actors.get(f.uid);
      if (!v) continue;
      this.spawnFloat(v, f);
      // also play a hit effect for damage kinds
      if (f.kind !== "heal" && f.kind !== "null") {
        this.playHitEffect(v, f.element);
        // attacker lunges — find active actor
        const active = this.state?.activeUid;
        if (active && active !== f.uid) {
          const av = this.actors.get(active);
          if (av) this.lunge(av, v);
        }
      } else if (f.kind === "heal") {
        this.playHealEffect(v);
      }
    }
    // bound the set so it doesn't grow unbounded
    if (this.floats.size > 200) this.floats = new Set([...this.floats].slice(-100));
  }

  private spawnFloat(v: ActorView, f: FloatingNumber) {
    const colorMap = {
      dmg: "#fff", crit: "#ffd54a", heal: "#3ddc84",
      weak: "#ff8a8a", resist: "#8be9ff", null: "#999",
    } as const;
    const text = f.kind === "null" ? "—" : f.kind === "heal" ? `+${f.amount}` : `${f.amount}${f.kind === "weak" ? "!" : ""}${f.kind === "crit" ? " ★" : ""}`;
    const size = f.kind === "crit" ? "26px" : "20px";
    const t = this.add.text(v.baseX, v.baseY - 80, text, {
      fontFamily: "monospace, sans-serif",
      fontSize: size, color: colorMap[f.kind],
      stroke: "#000", strokeThickness: 4, fontStyle: "bold",
    }).setOrigin(0.5).setDepth(40);
    this.tweens.add({
      targets: t, y: t.y - 60, alpha: { from: 1, to: 0 },
      scale: { from: 0.7, to: 1.15 }, duration: 1000, ease: "Cubic.Out",
      onComplete: () => t.destroy(),
    });
  }

  // ---- Hit / heal particle bursts ---------------------------------------

  private ensureParticleTexture() {
    if (this.textures.exists("fx_dot")) return;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 1).fillCircle(6, 6, 6);
    g.generateTexture("fx_dot", 12, 12);
    g.destroy();
  }

  private playHitEffect(v: ActorView, element?: string) {
    this.ensureParticleTexture();
    const color = ELEMENT_COLOR[element ?? "claw"] ?? 0xffffff;
    const e = this.add.particles(v.baseX, v.baseY - 50, "fx_dot", {
      lifespan: 480,
      speed: { min: 80, max: 260 },
      scale: { start: 1.3, end: 0 },
      tint: color,
      blendMode: "ADD",
      quantity: 18,
      emitting: false,
    });
    e.explode(18);
    this.time.delayedCall(700, () => e.destroy());
    // Flash sprite white
    v.sprite.setTint(0xffffff).setTintMode(P.TintModes.FILL);
    this.time.delayedCall(80, () => v.sprite.clearTint().setTintMode(P.TintModes.MULTIPLY));
    // Quick recoil
    this.tweens.add({
      targets: v.sprite, x: v.baseX + (v.side === "party" ? -8 : 8),
      duration: 60, yoyo: true, ease: "Sine.Out",
    });
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

  private lunge(attacker: ActorView, target: ActorView) {
    const dx = (target.baseX - attacker.baseX) * 0.55;
    const dy = (target.baseY - attacker.baseY) * 0.3;
    this.tweens.add({
      targets: attacker.sprite,
      x: attacker.baseX + dx, y: attacker.baseY + dy,
      duration: 140, ease: "Cubic.Out", yoyo: true,
      onComplete: () => attacker.sprite.setPosition(attacker.baseX, attacker.baseY),
    });
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
      targets: this.overdriveCard, scale: 1, alpha: 1, duration: 280, ease: "Back.Out",
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
    this.tweens.add({ targets: this.banner, alpha: 1, scale: 1, duration: 280, ease: "Back.Out" });
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
