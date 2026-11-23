import { runtimeSentenceWeights } from './fixtures.mjs';
import { clamp, runtimeFreshState, sum } from './arithmetic.mjs';
export function runtimeSentenceProgress(id, state, beat, sentence) {
  const weights = runtimeSentenceWeights[id]?.[beat];
  if (weights?.[sentence] === undefined)
    throw new RangeError(`Unknown runtime sentence ${id}/${beat}/${sentence}`);
  if (state.beat > beat) return 1;
  if (state.beat < beat) return 0;
  const cue = state.cues?.[`gr-${id}-b${beat}-s${sentence}`];
  if (cue) return cue.phase === 'after' ? 1 : cue.phase === 'before' ? 0 : clamp(cue.progress ?? 0);
  if (state.cues) return 0;
  return clamp(
    ((state.beatP ?? 0) * sum(weights) - sum(weights.slice(0, sentence))) / weights[sentence],
  );
}
export function sampleRuntimeChapter(id, state) {
  if (!runtimeSentenceWeights[id]) throw new RangeError(`Unknown runtime chapter ${id}`);
  const b = state.beat ?? 0,
    g = (beat, sentence) => runtimeSentenceProgress(id, state, beat, sentence),
    done = (beat, sentence) => g(beat, sentence) >= 1,
    base = {
      id,
      b,
      g,
      done,
    };
  if (id === 'fresh-four-slot') {
    const copy = done(1, 1),
      mask = done(2, 0);
    return {
      ...base,
      ...runtimeFreshState({
        copy,
        mask,
      }),
      copyProgress: g(1, 1),
      maskProgress: g(2, 0),
      staleReady: done(1, 0),
      paddedReady: done(1, 2),
      maskedReady: done(2, 1),
      consumed: done(3, 0),
    };
  }
  return base;
}
