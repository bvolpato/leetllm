export const clamp = (p) => Math.max(0, Math.min(1, p));
export const motion = (p) => {
  const q = clamp((p - 0.08) / 0.68);
  return q * q * (3 - 2 * q);
};
export const mix = (a, b, p) => a + (b - a) * p;
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export function tailAllocation(state, step) {
  // Measured beat2: spare-space starts at3.0875s; tightening runs9.05–10.175s.
  const spare = state.cues?.['tail-beat-2-focus-1'];
  const seconds =
    spare && Number.isFinite(state.t)
      ? state.t - spare.start + 3.0875
      : (state.beatP ?? 0) * 21.818;
  const tightening = step === 0 ? 0 : step > 1 ? 1 : clamp((seconds - 9.05) / 1.125);
  return 8 - Math.min(3, Math.floor(3 * tightening + 1e-9));
}
export const spoken = (state, id, beat) => {
  const b = state.beat ?? 0,
    c = state.cues?.[id];
  return b < beat
    ? 0
    : b > beat
      ? 1
      : c
        ? c.phase === 'before'
          ? 0
          : c.phase === 'after'
            ? 1
            : clamp(c.progress)
        : clamp(((state.beatP ?? 0) - 0.12) / 0.72);
};
export const ended = (state, id, beat) => spoken(state, id, beat) === 1;
