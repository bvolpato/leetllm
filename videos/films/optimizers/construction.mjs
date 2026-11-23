import { RUNS } from './fixtures.mjs';
import { clamp, loss, optimizerFirstStep, point, vector } from './arithmetic.mjs';
export function cueProgress(state, id, beat, from = 0.12, to = 0.8) {
  const b = state.beat ?? 0;
  if (b < beat) return 0;
  if (b > beat) return 1;
  const c = state.cues?.[id];
  return c
    ? c.phase === 'before'
      ? 0
      : c.phase === 'after'
        ? 1
        : Math.min(1 - Number.EPSILON, clamp(c.progress))
    : clamp(((state.beatP ?? 0) - from) / (to - from));
}
export function traceState(run, progress, from = 0, to = run.records.length) {
  const position = from + clamp(progress) * (to - from),
    completed = Math.min(to, Math.floor(position + 1e-9));
  const fraction = completed === to ? 0 : position - completed;
  const current = vector(run.points[completed]);
  return {
    completed,
    fraction,
    current,
    currentLoss: loss(current),
    pending: completed < to ? run.records[completed] : null,
  };
}
export function momentumFrame(beat, progress, cues = {}) {
  const s = {
    beat,
    beatP: progress,
    cues,
  };
  const q =
    beat === 0
      ? cueProgress(s, 'momentum-first-four', 0, 0.55, 0.93)
      : beat === 1
        ? cueProgress(s, 'momentum-fifth', 1, 0.76, 0.92)
        : cueProgress(s, 'momentum-return', 2, 0.05, 0.5);
  const f = traceState(
    RUNS.momentum,
    q,
    beat === 0 ? 0 : beat === 1 ? 4 : 5,
    beat === 0 ? 4 : beat === 1 ? 5 : 8,
  );
  const record = RUNS.momentum.records[Math.min(f.completed, 39)];
  return {
    ...f,
    index: f.completed,
    current: point(record.before),
    next: point(record.next),
    gradient: record.gradient,
    update: record.update,
    momentum: record.mean,
    gradientStep: record.gradient.map((x) => -0.018 * x),
  };
}
export function transferState(state) {
  return Object.fromEntries(
    ['sgd', 'momentum', 'adam'].map((kind, i) => {
      const q = cueProgress(state, 'transfer-' + kind, 1, i / 3, (i + 1) / 3);
      return [
        kind,
        {
          ...optimizerFirstStep(kind, [-0.5, 0.5]),
          progress: q,
          revealed: q === 1,
        },
      ];
    }),
  );
}
export function adamWReveal(beat, progress, cues = {}) {
  const s = {
      beat,
      beatP: progress,
      cues,
    },
    first = cueProgress(s, 'decay-data', 0, 0.35, 0.55);
  return {
    first,
    second: first === 1 ? cueProgress(s, 'decay-shrink', 0, 0.55, 0.72) : 0,
  };
}
