(function (root) {
  'use strict';

  const cues = Object.freeze([
    Object.freeze({ id: 'paper', label: '柔和紙張翻動', duration: 0.34, type: 'noise', gain: 0.018 }),
    Object.freeze({ id: 'metal', label: '低音量金屬卡榫', duration: 0.22, type: 'tone', frequency: 220, gain: 0.022 }),
    Object.freeze({ id: 'water', label: '輕柔水滴', duration: 0.38, type: 'tone', frequency: 660, gain: 0.015 }),
    Object.freeze({ id: 'power', label: '柔和電力啟動', duration: 0.48, type: 'tone', frequency: 330, gain: 0.024 })
  ]);

  const maxGain = 0.035;

  function play(context, destination, id) {
    const cue = cues.find((item) => item.id === id);
    if (!cue || !context || typeof context.createGain !== 'function') return false;

    const now = context.currentTime;
    const output = context.createGain();
    const peak = Math.min(cue.gain, maxGain);
    output.gain.setValueAtTime(0.0001, now);
    output.gain.exponentialRampToValueAtTime(peak, now + 0.018);
    output.gain.exponentialRampToValueAtTime(0.0001, now + cue.duration);
    output.connect(destination || context.destination);

    if (cue.type === 'noise') {
      const frames = Math.max(1, Math.floor(context.sampleRate * cue.duration));
      const buffer = context.createBuffer(1, frames, context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < frames; i += 1) {
        const fade = 1 - i / frames;
        samples[i] = (Math.random() * 2 - 1) * fade;
      }
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, now);
      source.buffer = buffer;
      source.connect(filter);
      filter.connect(output);
      source.start(now);
      source.stop(now + cue.duration);
      return true;
    }

    const oscillator = context.createOscillator();
    oscillator.type = cue.id === 'metal' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(cue.frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(cue.frequency * 0.72, now + cue.duration);
    oscillator.connect(output);
    oscillator.start(now);
    oscillator.stop(now + cue.duration);
    return true;
  }

  const api = Object.freeze({
    cues,
    defaultEnabled: false,
    maxGain,
    play
  });

  root.YellowEffects = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
