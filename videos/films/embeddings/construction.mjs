import { cosine, maskedMean, rotateEmbedding } from './arithmetic.mjs';
import { CONTEXT_EVENTS, CONTEXT_WORDS, CORPUS, LIMITS_CUES, V } from './fixtures.mjs';
import { negativeSamplingState } from './model.mjs';
import { dotProduct, normalizeVector, lerpArray, smoothstep } from 'vizmatic';
export function limitsState(beat, beatP) {
  const phase = (start, end) => smoothstep((beatP - start) / (end - start));
  const shifted = Object.values(V).map((vector) => vector.map((value) => value + 3));
  const mean = [0, 1].map(
    (j) => shifted.reduce((sum, vector) => sum + vector[j], 0) / shifted.length,
  );
  const centered = shifted.map((vector) => vector.map((value, j) => value - mean[j]));
  return {
    values: [
      cosine(V.river, V.money),
      cosine(shifted[1], shifted[3]),
      cosine(centered[1], centered[3]),
    ],
    opacity: [
      1,
      beat === 0 ? phase(LIMITS_CUES.shiftStart, LIMITS_CUES.shiftEnd) : 1,
      beat === 0 ? 0 : beat === 1 ? phase(LIMITS_CUES.centerStart, LIMITS_CUES.centerEnd) : 1,
    ],
  };
}
export function contextCountTrace(beat, progress) {
  const clock =
    beat === 0
      ? Math.max(0, Math.min(1, (progress - 0.15) / 0.7))
      : beat === 1
        ? 1 + 5 * Math.max(0, Math.min(1, (progress - 0.08) / 0.8))
        : 6;
  const completed = Math.floor(clock + 1e-9),
    event = CONTEXT_EVENTS[Math.min(5, completed)];
  const counts = CONTEXT_WORDS.map(
    (_, column) => CONTEXT_EVENTS.slice(0, completed).filter((e) => e.column === column).length,
  );
  return {
    event,
    counts,
    completed,
    flight: clock - completed,
    words: CORPUS[event.sentenceIndex].split(/\s+/),
  };
}
export function limitsGeometry(beat, progress) {
  const { opacity } = limitsState(beat, progress),
    shift = opacity[1],
    center = opacity[2];
  const translated = Object.values(V).map((v) => v.map((x) => x + 3 * shift));
  const mean = [0, 1].map((j) => translated.reduce((sum, v) => sum + v[j], 0) / translated.length);
  const current = translated.map((v) => v.map((x, j) => x - center * mean[j]));
  return {
    current,
    translated,
    mean,
    shift,
    center,
    cosine: cosine(current[1], current[3]),
    distance: Math.hypot(...current[1].map((x, j) => x - current[3][j])),
  };
}
export function poolingState(beat, beatP) {
  // Measured "Watch ... enter the display" occupies +0.1 through +1.875 s.
  const seconds = beatP * 16.272;
  const entry = beat === 0 ? 0 : beat === 1 ? smoothstep((seconds - 0.1) / 1.775) : 1;
  const values = [V.bank, V.river, V.water, ...(entry > 0 ? [[1, 1]] : [])];
  const mask = values.map((_, i) => Number(i < 3));
  return {
    entry,
    values,
    mask,
    count: mask.reduce((sum, value) => sum + value, 0),
    sum: values[0].map((_, i) => values.reduce((sum, row, j) => sum + mask[j] * row[i], 0)),
    mean: maskedMean(values, mask),
  };
}
export function substitutionState(beat, beatP) {
  // Keep the original through "before calculating it"; compute at "Then inspect".
  const seconds = beatP * 15.792;
  const amount = beat === 0 ? 0 : beat === 1 ? smoothstep((seconds - 8.55) / 0.625) : 1;
  const clue = lerpArray(V.river, V.money, amount);
  const current = V.bank.map((value, i) => 0.5 * value + 0.4 * clue[i] + 0.1 * V.water[i]);
  return {
    amount,
    clue,
    current,
    normalized: normalizeVector(current),
    pooled: maskedMean([V.bank, current, V.water], [1, 1, 1]),
    showNormalization: beat > 1 || (beat === 1 && seconds >= 9.375),
    showPooling: beat > 1 || (beat === 1 && seconds >= 10.5625),
  };
}
export const clamp = (p) => Math.max(0, Math.min(1, p));
export function event(state, name, beat) {
  const cue = state.cues?.['emb-' + name];
  if (cue) return cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : clamp(cue.progress ?? 0);
  const b = state.beat ?? 0;
  return b < beat ? 0 : b > beat ? 1 : smoothstep(clamp(((state.beatP ?? 0) - 0.08) / 0.8));
}
export function completed(state, name, beat) {
  return event(state, name, beat) >= 1;
}
export function extendedEmbeddingState(id, state) {
  const b = state.beat ?? 0;
  if (id === 'negative-step')
    return {
      b,
      ...negativeSamplingState(event(state, 'negative-move', 2)),
      gradientProgress: event(state, 'negative-gradient', 1),
      reveal: completed(state, 'negative-loss', 2),
    };
  if (id === 'space-contract') {
    const together = b === 0 ? event(state, 'rotate-together', 0) : 0,
      documents = b === 0 ? together : b === 1 ? event(state, 'rotate-docs', 1) : 1,
      query = b === 0 ? together : b === 1 ? event(state, 'rotate-repair', 1) : 1;
    const q = rotateEmbedding([1, 0], (query * Math.PI) / 2),
      docs = [
        [1, 0],
        [0, -1],
      ].map((v) => rotateEmbedding(v, (documents * Math.PI) / 2));
    return {
      b,
      query: q,
      docs,
      scores: docs.map((v) => dotProduct(q, v)),
      wrong: completed(state, 'rotate-wrong', 1) && !event(state, 'rotate-repair', 1),
      repaired: completed(state, 'rotate-repair', 1),
    };
  }
  if (id === 'fresh-representation') {
    const d = event(state, 'fresh-docs', 0),
      q = event(state, 'fresh-query', 1),
      query = rotateEmbedding([0, 1], q * Math.PI),
      docs = [
        [1, 0],
        [0, 1],
      ].map((v) => rotateEmbedding(v, d * Math.PI));
    return {
      b,
      query,
      docs,
      scores: docs.map((v) => dotProduct(query, v)),
      scoresVisible: completed(state, 'fresh-scores', 1),
      wrong: completed(state, 'fresh-wrong', 1) && !q,
      repaired: completed(state, 'fresh-repaired', 1),
    };
  }
  return {
    b,
  };
}
