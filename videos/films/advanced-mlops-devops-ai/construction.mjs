import { mix } from './arithmetic.mjs';
import { normalizeReleaseVector, temporalReleaseJoin } from './features.mjs';

export const eastRequest = {
  hour: 14,
  maxAge: 3,
  readings: [
    { event: 12, available: 12 + 5 / 60, vector: [-3, 4] },
    { event: 13.5, available: 14 + 10 / 60, vector: [8, 6] },
  ],
};
export function releaseSentenceProgress(state, scene, beat, index) {
  const id = scene + '-s' + beat + '-' + index;
  if (state.cues) {
    const cue = state.cues[id];
    if (!cue) throw new Error('Unknown release sentence ' + id);
    return cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : Math.max(0, Math.min(1, cue.progress));
  }
  const b = state.beat ?? 0;
  return b < beat
    ? 0
    : b > beat
      ? 1
      : Math.max(0, Math.min(1, ((state.beatP ?? 0) - index * 0.2) / 0.2));
}
export function freshReleaseState(state) {
  const P = (b, i) => releaseSentenceProgress(state, 'fresh-request', b, i),
    reveal = P(1, 1) >= 1,
    unit = P(1, 4) >= 1,
    repair = P(2, 0),
    eligible = temporalReleaseJoin(eastRequest.readings, eastRequest.hour, eastRequest.maxAge),
    raw = eligible.vector,
    normalized = normalizeReleaseVector(raw),
    online = raw.map((v, i) => mix(v, normalized[i], repair)),
    score = (v) => v.reduce((n, x) => n + 0.5 * x, 0);
  return {
    reveal,
    unit,
    offlineReady: P(1, 5) >= 1,
    onlineReady: P(1, 6) >= 1,
    decisionReady: P(1, 7) >= 1,
    repairReady: P(2, 1) >= 1,
    repair,
    raw,
    normalized,
    online,
    offlineScore: score(normalized),
    onlineScore: score(online),
    parity: online.every(
      (value, i) =>
        Math.abs(value - normalized[i]) <=
        Math.max(1e-12, 1e-9 * Math.max(Math.abs(value), Math.abs(normalized[i]))),
    ),
    eligible,
  };
}
