import Phaser from "phaser";
import {
  maps,
  near,
  tile,
  walkable,
  pathfind,
  approach,
  center,
  type Spot,
} from "./maps.ts";
import { story, type State } from "./core.ts";
export interface WorldHost {
  getState: () => State;
  isPaused: () => boolean;
  inspect: (s: Spot) => void;
  position: (x: number, y: number) => void;
  nearby: (s: Spot | null) => void;
}
export class Station extends Phaser.Scene {
  host: WorldHost;
  player!: Phaser.GameObjects.Sprite;
  decor!: Phaser.GameObjects.Container;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  path: { x: number; y: number }[] = [];
  pending: Spot | null = null;
  current = "";
  target = "";
  lastNear = "";
  dir = 0;
  lastPos = 0;
  constructor(host: WorldHost) {
    super("station");
    this.host = host;
  }
  preload() {
    for (const key of [
      "corridor-ground",
      "office-ground",
      "platform-ground",
      "dispenser",
      "cart",
      "panel",
      "console",
      "cabinet",
      "map",
      "lightbox",
    ])
      this.load.image(key, import.meta.env.BASE_URL + "art/" + key + ".png");
    this.load.spritesheet(
      "person",
      import.meta.env.BASE_URL + "art/lin-cheng.png",
      { frameWidth: 16, frameHeight: 24 },
    );
  }
  create() {
    this.cameras.main.setRoundPixels(true);
    for (let i = 0; i < 4; i++)
      this.anims.create({
        key: "walk" + i,
        frames: this.anims.generateFrameNumbers("person", {
          start: i * 4,
          end: i * 4 + 3,
        }),
        frameRate: 6,
        repeat: -1,
      });
    this.keys = this.input.keyboard!.addKeys(
      "W,A,S,D,UP,DOWN,LEFT,RIGHT,E",
    ) as typeof this.keys;
    this.input.keyboard!.on("keydown-E", () => {
      if (!this.host.isPaused()) {
        const s = this.closest();
        if (s) this.host.inspect(s);
      }
    });
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (this.host.isPaused()) return;
      this.pending = null;
      this.path = pathfind(
        this.host.getState().scene,
        { x: this.player.x, y: this.player.y },
        { x: p.x, y: p.y },
      );
    });
    this.redraw();
  }
  closest() {
    const state = this.host.getState();
    return (
      maps[state.scene].spots
        .filter((s) => near(state.scene, this.player, s))
        .sort(
          (a, b) =>
            Math.hypot(a.x - this.player.x, a.y - this.player.y) -
            Math.hypot(b.x - this.player.x, b.y - this.player.y),
        )[0] || null
    );
  }
  goto(s: Spot) {
    if (this.host.isPaused() || !this.player) return;
    const id = this.host.getState().scene;
    if (near(id, this.player, s)) {
      this.path = [];
      this.pending = null;
      this.host.inspect(s);
      return;
    }
    this.pending = s;
    this.path = pathfind(id, this.player, center(approach(s)), true);
  }
  redraw() {
    const s = this.host.getState();
    if (!this.textures?.exists("person")) return;
    this.children.removeAll(true);
    this.path = [];
    this.pending = null;
    this.current = s.scene;
    this.add.image(0, 7, s.scene + "-ground").setOrigin(0);
    const snap = story.snapshots[s.loop];
    for (const spot of maps[s.scene].spots)
      if (spot.art)
        this.add
          .image(spot.x, spot.y, spot.art)
          .setOrigin(0.5, 1)
          .setDepth(spot.y);
    const g = this.add.graphics().setDepth(82);
    g.fillStyle(0x14191f);
    g.fillRect(210, 42, 45, 19);
    g.lineStyle(1, 0x6e8f86);
    g.strokeRect(210, 42, 45, 19);
    if (s.scene === "corridor") {
      this.add
        .text(214, 45, snap.clock, {
          fontFamily: "Fusion",
          fontSize: "12px",
          color: "#E4E1D6",
        })
        .setDepth(85);
      g.fillStyle(0x263f3e);
      g.fillRect(294, 39, 72, 20);
      g.lineStyle(1, 0x9bb6aa);
      g.strokeRect(294, 39, 72, 20);
      this.add
        .text(300, 42, snap.arrow === "right" ? "第零層 →" : "← 第零層", {
          fontFamily: "Fusion",
          fontSize: "12px",
          color: "#E4E1D6",
        })
        .setDepth(85);
      g.fillStyle(0x202b32);
      g.fillPoints(
        snap.water === "A"
          ? [
              { x: 324, y: 157 },
              { x: 337, y: 151 },
              { x: 357, y: 155 },
              { x: 365, y: 161 },
              { x: 346, y: 165 },
            ]
          : [
              { x: 322, y: 160 },
              { x: 334, y: 150 },
              { x: 351, y: 149 },
              { x: 359, y: 157 },
              { x: 344, y: 162 },
            ],
        true,
      );
      g.lineStyle(1, 0x5c6c7a);
      g.lineBetween(333, 156, 348, 155);
      g.fillStyle(s.card ? 0x263f3e : 0x5c6c7a);
      g.fillRect(175, 100, 18, 7);
      g.fillStyle(s.card ? 0x6e8f86 : 0xe4e1d6);
      g.fillRect(181, 102, 6, 2);
    } else if (s.scene === "office") {
      this.add
        .text(218, 45, "01:17", {
          fontFamily: "Fusion",
          fontSize: "12px",
          color: "#E4E1D6",
        })
        .setDepth(85);
      this.add
        .text(196, 77, "━ ▪ ▪▪", {
          fontFamily: "Fusion",
          fontSize: "12px",
          color: "#E4E1D6",
        })
        .setDepth(95);
      g.fillStyle(s.power ? 0xf2a33a : 0x3f5b57);
      g.fillRect(367, 99, 3, 3);
    } else {
      g.fillStyle(s.battery === "device" ? 0xf2a33a : 0x3f5b57);
      for (const x of [180, 228, 276, 324, 372, 420]) g.fillRect(x, 176, 4, 3);
      this.add
        .text(65, 42, "末班列車已離站", {
          fontFamily: "Fusion",
          fontSize: "12px",
          color: "#8C9BA3",
        })
        .setDepth(85);
      g.fillStyle(s.door ? 0xf2a33a : 0x3f5b57);
      g.fillRect(428, 94, 6, 3);
    }
    const savedTile = tile(s.position.x, s.position.y);
    const point = walkable(s.scene, savedTile.x, savedTile.y)
      ? s.position
      : maps[s.scene].spawn;
    this.player = this.add
      .sprite(point.x, point.y, "person", 0)
      .setOrigin(0.5, 1)
      .setDepth(point.y + 1);
  }
  update(time: number, delta: number) {
    if (!this.player) return;
    const s = this.host.getState();
    if (this.current !== s.scene) this.redraw();
    if (this.host.isPaused()) {
      this.input.keyboard?.disableGlobalCapture();
      this.player.anims.stop();
      return;
    }
    this.input.keyboard?.enableGlobalCapture();
    let dx = 0,
      dy = 0;
    const k = this.keys;
    if (k.LEFT.isDown || k.A.isDown) dx = -1;
    else if (k.RIGHT.isDown || k.D.isDown) dx = 1;
    else if (k.UP.isDown || k.W.isDown) dy = -1;
    else if (k.DOWN.isDown || k.S.isDown) dy = 1;
    if (dx || dy) {
      this.path = [];
      this.pending = null;
    } else if (this.path.length) {
      const p = this.path[0],
        xx = p.x - this.player.x,
        yy = p.y - this.player.y;
      if (Math.abs(xx) < 1 && Math.abs(yy) < 1) {
        this.player.setPosition(p.x, p.y);
        this.path.shift();
      } else if (Math.abs(xx) >= 1) dx = Math.sign(xx);
      else dy = Math.sign(yy);
    }
    const speed = (48 * Math.min(delta, 40)) / 1000;
    if (dx || dy) {
      const nx = this.player.x + dx * speed,
        ny = this.player.y + dy * speed;
      const t = tile(nx, ny);
      if (
        [
          [-3, -5],
          [3, -5],
          [-3, -1],
          [3, -1],
        ].every(([xx, yy]) => {
          const c = tile(nx + xx, ny + yy);
          return walkable(s.scene, c.x, c.y);
        })
      ) {
        this.player.setPosition(nx, ny);
        this.player.setDepth(Math.round(ny) + 1);
      } else this.path = [];
      this.dir = dx < 0 ? 2 : dx > 0 ? 3 : dy < 0 ? 1 : 0;
      this.player.play("walk" + this.dir, true);
    } else {
      this.player.anims.stop();
      this.player.setFrame(this.dir * 4);
    }
    if (this.pending && !this.path.length) {
      const p = this.pending;
      this.pending = null;
      if (near(s.scene, this.player, p)) this.host.inspect(p);
    }
    const n = this.closest();
    if ((n?.id || "") !== this.lastNear) {
      this.lastNear = n?.id || "";
      this.host.nearby(n);
    }
    if (time - this.lastPos > 400) {
      this.lastPos = time;
      this.host.position(this.player.x, this.player.y);
    }
  }
}
