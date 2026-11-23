// A two-note test signal and its delayed return share one sample clock.
const sampleRate = 24000;
export const delay = 0.3;
export const duration = 0.8;
export const onset = 0.08;
export const notes = [
  [onset, 0.065, 540],
  [0.195, 0.085, 810],
];
const samples = new Float32Array(sampleRate * duration);
for (const [start, length, hz] of notes) {
  const first = Math.round(start * sampleRate);
  const count = Math.round(length * sampleRate);
  for (let i = 0; i < count; i++) {
    const window = Math.sin((Math.PI * i) / (count - 1)) ** 2;
    samples[first + i] = 0.85 * window * Math.sin((2 * Math.PI * hz * i) / sampleRate);
  }
}
export const speaker = { sampleRate, samples };
export const microphone = {
  sampleRate,
  samples: Float32Array.from(
    samples,
    (_, i) => 0.5 * (samples[i - Math.round(delay * sampleRate)] ?? 0),
  ),
};
export const holdSounds = {
  'echo-test': {
    sampleRate,
    samples: Float32Array.from(samples, (sample, i) => 0.22 * (sample + microphone.samples[i])),
  },
};
