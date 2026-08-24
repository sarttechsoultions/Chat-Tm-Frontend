let audioCtx: AudioContext | null = null;

function context() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

function tone(frequency: number, duration: number, type: OscillatorType, volume: number, startAt = 0) {
  const ctx = context();
  if (!ctx) return;
  const now = ctx.currentTime + startAt;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

export function playLikeSound() {
  const ctx = context();
  if (!ctx) return;
  const now = ctx.currentTime;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2400, now);
  filter.frequency.exponentialRampToValueAtTime(900, now + 0.12);
  filter.connect(ctx.destination);

  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.045);
  osc.frequency.exponentialRampToValueAtTime(520, now + 0.16);
  oscGain.gain.setValueAtTime(0.0001, now);
  oscGain.gain.exponentialRampToValueAtTime(0.11, now + 0.012);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  osc.connect(oscGain);
  oscGain.connect(filter);
  osc.start(now);
  osc.stop(now + 0.2);

  const ping = ctx.createOscillator();
  const pingGain = ctx.createGain();
  ping.type = "triangle";
  ping.frequency.setValueAtTime(1320, now + 0.03);
  ping.frequency.exponentialRampToValueAtTime(990, now + 0.12);
  pingGain.gain.setValueAtTime(0.0001, now + 0.03);
  pingGain.gain.exponentialRampToValueAtTime(0.045, now + 0.04);
  pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
  ping.connect(pingGain);
  pingGain.connect(filter);
  ping.start(now + 0.03);
  ping.stop(now + 0.16);

  const noise = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  noise.buffer = buffer;
  noiseGain.gain.setValueAtTime(0.03, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  noise.connect(noiseGain);
  noiseGain.connect(filter);
  noise.start(now);
  noise.stop(now + 0.05);
}

export function playCommentSound() {
  tone(520, 0.08, "sine", 0.05);
}

export function playShareSound() {
  tone(360, 0.1, "triangle", 0.05);
  tone(480, 0.12, "sine", 0.04, 0.05);
}
