// Synthesised sound: no audio files, everything is WebAudio oscillators and noise,
// so the game stays offline and self-contained. A low war-drum pulse under play,
// blade swishes, Ravager roars, wall booms and a victory fanfare.
export function createAudio() {
  let ctx = null;
  let master = null;
  let musicTimer = null;
  let muted = false;
  let beat = 0;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.4;
      master.connect(ctx.destination);
    } catch {
      return false;
    }
    return true;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (!ctx || muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), ctx.currentTime + dur);
    gain.gain.setValueAtTime(vol || 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  function noise(dur, vol, lowpass) {
    if (!ctx || muted) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass || 3000;
    const gain = ctx.createGain();
    gain.gain.value = vol || 0.25;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start();
  }

  // War-drum pulse + low bass line, D minor, a marching dread.
  const BASS = [73.42, 73.42, 87.31, 65.41, 73.42, 98.0, 87.31, 65.41];
  function musicStep() {
    if (!ctx || muted) return;
    const note = BASS[beat % BASS.length];
    tone(note, 0.5, 'triangle', 0.12);
    if (beat % 2 === 0) tone(36.71, 0.4, 'sine', 0.3, 30);
    if (beat % 8 === 4) noise(0.08, 0.06, 800);
    beat += 1;
  }

  return {
    /** Call from the first user gesture. */
    unlock() {
      if (ensure() && ctx.state === 'suspended') ctx.resume();
      if (ctx && !musicTimer) musicTimer = window.setInterval(musicStep, 300);
    },
    toggleMute() { muted = !muted; return muted; },
    slash() { noise(0.14, 0.3, 5000); tone(900, 0.12, 'sawtooth', 0.08, 300); },
    spark() { tone(2200, 0.06, 'square', 0.08, 1400); },
    kill() {
      noise(0.25, 0.35, 900);
      tone(180, 0.35, 'sine', 0.35, 40);
      tone(523, 0.2, 'triangle', 0.12);
      tone(784, 0.3, 'triangle', 0.12);
    },
    roar() { tone(90, 0.9, 'sawtooth', 0.3, 45); noise(0.7, 0.15, 500); },
    wallHit() { tone(60, 0.5, 'sine', 0.4, 28); noise(0.3, 0.25, 400); },
    grab() { tone(140, 0.4, 'sawtooth', 0.25, 60); },
    waveClear() { [523, 659, 784, 1047].forEach((f, i) => window.setTimeout(() => tone(f, 0.25, 'triangle', 0.15), i * 110)); },
    victory() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => window.setTimeout(() => tone(f, 0.4, 'triangle', 0.18), i * 140)); },
    gameOver() { [392, 370, 349, 311].forEach((f, i) => window.setTimeout(() => tone(f, 0.5, 'triangle', 0.16), i * 200)); },
    click() { tone(700, 0.06, 'square', 0.08); },
  };
}
