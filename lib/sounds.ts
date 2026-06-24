"use client";

export type SoundName = "card" | "toep" | "applause";

let audioContext: AudioContext | null = null;

function context() {
  audioContext ??= new AudioContext();
  return audioContext;
}

function tone(frequency: number, start: number, duration: number, volume: number, type: OscillatorType = "sine") {
  const ctx = context();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

export function playSound(name: SoundName, volume: number) {
  if (volume <= 0 || typeof window === "undefined") return;
  const ctx = context();
  if (ctx.state === "suspended") void ctx.resume();
  const now = ctx.currentTime;
  const level = Math.min(1, Math.max(0, volume));

  if (name === "card") {
    tone(210, now, 0.07, level * 0.16, "triangle");
    tone(115, now + 0.035, 0.06, level * 0.10, "sine");
    return;
  }

  if (name === "toep") {
    tone(420, now, 0.22, level * 0.17, "sawtooth");
    tone(620, now + 0.12, 0.22, level * 0.14, "sawtooth");
    tone(360, now + 0.27, 0.18, level * 0.12, "square");
    return;
  }

  [520, 660, 780, 910, 700, 840].forEach((frequency, index) => {
    tone(frequency, now + index * 0.055, 0.16, level * 0.09, index % 2 ? "triangle" : "sine");
  });
}
