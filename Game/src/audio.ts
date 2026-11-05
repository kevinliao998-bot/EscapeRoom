export interface Settings {
  large: boolean;
  reduced: boolean;
  subtitles: boolean;
  mute: boolean;
  master: number;
  ambient: number;
  effects: number;
  voice: number;
}
export const defaults: Settings = {
  large: false,
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  subtitles: true,
  mute: false,
  master: 0.45,
  ambient: 0.2,
  effects: 0.35,
  voice: 0.4,
};
export class Sound {
  ctx: AudioContext | null = null;
  settings = defaults;
  play(kind = "paper") {
    if (this.settings.mute) return;
    try {
      this.ctx ??= new AudioContext();
      void this.ctx.resume();
      const c = this.ctx,
        t = c.currentTime + 0.01,
        g = c.createGain();
      const volume =
        this.settings.master *
        (kind === "voice"
          ? this.settings.voice
          : kind === "ambient"
            ? this.settings.ambient
            : this.settings.effects) *
        0.12;
      g.connect(c.destination);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(volume, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      if (kind === "paper") {
        const b = c.createBuffer(1, c.sampleRate * 0.24, c.sampleRate),
          d = b.getChannelData(0);
        let seed = 71;
        for (let i = 0; i < d.length; i++) {
          seed = (seed * 16807) % 2147483647;
          d[i] = ((seed / 2147483647) * 2 - 1) * 0.3;
        }
        const n = c.createBufferSource();
        n.buffer = b;
        const f = c.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = 1200;
        n.connect(f);
        f.connect(g);
        n.start(t);
        n.stop(t + 0.25);
      } else {
        const o = c.createOscillator();
        o.type = kind === "metal" ? "triangle" : "sine";
        o.frequency.setValueAtTime(
          kind === "water"
            ? 660
            : kind === "voice"
              ? 440
              : kind === "ambient"
                ? 90
                : 140,
          t,
        );
        o.frequency.exponentialRampToValueAtTime(
          kind === "water" ? 330 : 80,
          t + 0.22,
        );
        o.connect(g);
        o.start(t);
        o.stop(t + 0.26);
      }
    } catch {
      /* 不支援音訊時保留所有字幕及操作。 */
    }
  }
  marker() {
    for (let i = 0; i < 3; i++) setTimeout(() => this.play("voice"), i * 360);
  }
}
