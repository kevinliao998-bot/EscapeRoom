import Phaser from "phaser";
import { type State, roomNames } from "./model.ts";
import { spots } from "./world-data.ts";
export { spots } from "./world-data.ts";
export interface Host {
  state: () => State;
  paused: () => boolean;
  inspect: (id: string) => void;
  nearby: (label: string) => void;
}
export class Dungeon extends Phaser.Scene {
  player!: Phaser.GameObjects.Sprite;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  decor!: Phaser.GameObjects.Container;
  target: { x: number; y: number; id?: string } | null = null;
  current = "";
  dir = 0;
  near = "";
  constructor(private host: Host) {
    super("campaign");
  }
  preload() {
    for (const id of ["panel", "console", "cabinet", "map", "lightbox"])
      this.load.image(id, import.meta.env.BASE_URL + "art/" + id + ".png");
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
        key: "cwalk" + i,
        frames: this.anims.generateFrameNumbers("person", {
          start: i * 4,
          end: i * 4 + 3,
        }),
        frameRate: 6,
        repeat: -1,
      });
    this.keys = this.input.keyboard!.addKeys(
      "W,A,S,D,UP,DOWN,LEFT,RIGHT",
    ) as typeof this.keys;
    this.input.keyboard!.on("keydown-E", () => {
      if (!this.host.paused()) {
        const s = this.closest();
        if (s) this.host.inspect(s.id);
      }
    });
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (!this.host.paused())
        this.target = {
          x: Phaser.Math.Clamp(p.x, 80, 440),
          y: Phaser.Math.Clamp(p.y, 133, 213),
        };
    });
    this.refresh();
  }
  closest() {
    return (spots[this.current] || [])
      .filter((s) => Math.hypot(s.x - this.player.x, s.y - this.player.y) < 40)
      .sort(
        (a, b) =>
          Math.hypot(a.x - this.player.x, a.y - this.player.y) -
          Math.hypot(b.x - this.player.x, b.y - this.player.y),
      )[0];
  }
  goto(id: string) {
    if (this.host.paused()) return;
    const p = (spots[this.current] || []).find((s) => s.id === id);
    if (p) this.target = { x: p.x, y: 135, id };
  }
  refresh() {
    if (!this.textures?.exists("person")) return;
    const s = this.host.state(),
      room = s.room;
    if (this.current !== room) {
      this.children.removeAll(true);
      this.current = room;
      this.target = null;
      const g = this.add.graphics();
      // 原版地面 PNG 烘焙有站務桌；地下室另畫同色地塊，避免角色穿過桌體。
      g.fillStyle(0x2b3640);
      g.fillRect(64, 35, 384, 202);
      g.fillStyle(0x202b32);
      for (let y = 87; y < 237; y += 16) g.fillRect(64, y, 384, 1);
      g.fillStyle(0x45545f);
      for (let y = 87; y < 230; y += 16)
        for (let x = 80; x < 445; x += 16) {
          if ((x / 16 + Math.floor(y / 16)) % 7 === 0) g.fillRect(x, y, 4, 1);
        }
      g.fillStyle(0x756c52);
      g.fillRect(72, 211, 360, 1);
      g.fillStyle(0xa8996f);
      g.fillRect(72, 210, 360, 1);
      g.fillStyle(0x45545f);
      g.fillRect(64, 234, 384, 3);
      // 原版同一套 16px 地面、削頂牆、腳底排序；新增結構全部是整數像素幾何。
      g.fillStyle(0x202b32);
      g.fillRect(64, 35, 384, 45);
      g.fillStyle(0x45545f);
      g.fillRect(64, 76, 384, 4);
      g.fillStyle(0x263f3e);
      g.fillRect(66, 37, 380, 2);
      for (let x = 80; x < 445; x += 48) {
        g.fillStyle(0x8c9ba3);
        g.fillRect(x, 43, 28, 3);
        g.fillStyle(0xe4e1d6);
        g.fillRect(x + 2, 43, 24, 1);
        g.fillStyle(0x45545f);
        g.fillRect(x + 5, 47, 18, 1);
      }
      g.fillStyle(0x756c52);
      for (let y = 136; y < 215; y += 16) g.fillRect(444, y, 2, 10);
      if (room === "pump") {
        g.fillStyle(0x45545f);
        g.fillRect(110, 80, 4, 53);
        g.fillRect(110, 127, 232, 4);
        g.fillRect(334, 80, 4, 51);
        g.fillStyle(0x6e8f86);
        g.fillRect(111, 81, 1, 45);
      }
      if (room === "recording") {
        for (let x = 98; x < 440; x += 22) {
          g.fillStyle(0x2b3640);
          g.fillRect(x, 83, 12, 30);
          g.fillStyle(0x6e8f86);
          g.fillRect(x + 2, 84, 8, 2);
        }
      }
      if (room === "interlock") {
        g.fillStyle(0x14191f);
        g.fillRect(98, 81, 88, 42);
        g.lineStyle(1, 0x8c9ba3);
        g.strokeRect(98, 81, 88, 42);
        for (let y = 86; y < 121; y += 8) g.lineBetween(112, y, 172, y);
      }
      for (const p of spots[room]) {
        if (p.art)
          this.add.image(p.x, p.y, p.art).setOrigin(0.5, 1).setDepth(p.y);
      }
      this.add
        .text(68, 58, roomNames[room], {
          fontFamily: "Fusion",
          fontSize: "12px",
          color: "#E4E1D6",
        })
        .setDepth(85);
      this.add
        .text(384, 58, "01:17", {
          fontFamily: "Fusion",
          fontSize: "12px",
          color: "#E4E1D6",
        })
        .setDepth(85);
      this.player = this.add
        .sprite(232, 199, "person", 0)
        .setOrigin(0.5, 1)
        .setDepth(200);
      this.decor = this.add.container(0, 0).setDepth(115);
    }
    this.decor.removeAll(true);
    const g = this.add.graphics();
    this.decor.add(g);
    if (room === "pump" && s.b1.water === "high") {
      g.fillStyle(0x2b3640);
      g.fillRect(198, 153, 180, 27);
      g.lineStyle(1, 0x5c6c7a);
      for (let y = 155; y < 178; y += 8) g.lineBetween(212, y, 360, y);
    }
    const lit =
      s.floor === "B1"
        ? s.b1.power.light
        : s.floor === "B3"
          ? s.b3.power.A
          : true;
    g.fillStyle(lit ? 0xf2a33a : 0x3f5b57);
    for (const x of [180, 228, 276, 324, 372, 420]) g.fillRect(x, 226, 4, 2);
    if (room === "interlock")
      for (let i = 0; i < 4; i++) {
        g.fillStyle(s.b3.bolts & (1 << i) ? 0x8c9ba3 : 0x263f3e);
        g.fillRect(107 + i * 18, 91, 8, s.b3.bolts & (1 << i) ? 22 : 6);
      }
    if (room === "control") {
      g.fillStyle(s.b3.unlocked ? 0xf2a33a : 0x6e8f86);
      g.fillRect(419, 105, 7, 3);
    }
  }
  update(_time: number, delta: number) {
    if (!this.player) return;
    if (this.host.paused()) {
      this.input.keyboard?.disableGlobalCapture();
      this.player.anims.stop();
      return;
    }
    this.input.keyboard?.enableGlobalCapture();
    const k = this.keys;
    let dx =
      k.LEFT.isDown || k.A.isDown ? -1 : k.RIGHT.isDown || k.D.isDown ? 1 : 0;
    let dy = dx
      ? 0
      : k.UP.isDown || k.W.isDown
        ? -1
        : k.DOWN.isDown || k.S.isDown
          ? 1
          : 0;
    if (dx || dy) this.target = null;
    const speed = (48 * Math.min(delta, 40)) / 1000;
    if (this.target && !dx && !dy) {
      const t = this.target;
      if (Math.abs(t.x - this.player.x) > speed)
        dx = Math.sign(t.x - this.player.x);
      else if (Math.abs(t.y - this.player.y) > speed)
        dy = Math.sign(t.y - this.player.y);
      else {
        this.player.setPosition(t.x, t.y);
        this.target = null;
        if (t.id) this.host.inspect(t.id);
      }
    }
    if (dx || dy) {
      this.player.setPosition(
        Phaser.Math.Clamp(this.player.x + dx * speed, 80, 440),
        Phaser.Math.Clamp(this.player.y + dy * speed, 128, 220),
      );
      this.player.setDepth(this.player.y + 1);
      this.dir = dx < 0 ? 2 : dx > 0 ? 3 : dy < 0 ? 1 : 0;
      this.player.play("cwalk" + this.dir, true);
    } else {
      this.player.anims.stop();
      this.player.setFrame(this.dir * 4);
    }
    const n = this.closest()?.label || "";
    if (n !== this.near) {
      this.near = n;
      this.host.nearby(n);
    }
  }
}
