export function rankOneConstruction(beat, progress) {
  const seconds = Math.max(0, Math.min(1, progress)) * 12.13;
  const points = [
    [0, 1.8],
    [1.575, 1.8],
    [2.6125, 2.1],
    [3.375, 2.1],
    [4.125, 0.8],
    [4.55, 0.8],
    [4.8375, 0.2],
    [6.8125, 0.2],
    [8.3375, 1.8],
    [12.13, 1.8],
  ];
  const right = points.findIndex(([time]) => time > seconds);
  const to = points[right < 0 ? points.length - 1 : right];
  const from = points[Math.max(0, (right < 0 ? points.length - 1 : right) - 1)];
  const q = to[0] === from[0] ? 1 : (seconds - from[0]) / (to[0] - from[0]);
  const first = beat === 1 ? from[1] + (to[1] - from[1]) * q : 1.8;
  const x = [Number(first.toFixed(2)), 1, 0.4],
    a = [1, -1, 0.5];
  const coefficient = a.reduce((value, weight, i) => value + weight * x[i], 0);
  return {
    x,
    a,
    coefficient: Math.abs(coefficient) < 1e-12 ? 0 : coefficient,
    changing: beat === 1 && from[1] !== to[1],
    seconds,
  };
}
export function cueMotion(state, id, beat, start, end) {
  const cue = state.cues?.[id];
  if (cue) return cue.progress;
  if (state.beat !== beat) return Number(state.beat > beat);
  return Math.max(0, Math.min(1, ((state.beatP ?? 0) - start) / (end - start)));
}
export function resultAfter(state, id, beat, storyboardEnd = 1) {
  const currentBeat = state.beat ?? 0;
  if (currentBeat !== beat) return currentBeat > beat;
  const cue = state.cues?.[id];
  return cue ? cue.phase === 'after' : !state.cues && (state.beatP ?? 0) >= storyboardEnd;
}
