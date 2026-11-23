import { clamp01 } from './arithmetic.mjs';

export function timedScene(id, counts, paint) {
  const cueId = (beat, index) => `tk-${id}-${beat}-${index}`;
  return {
    id,
    cues: counts.flatMap((count, beat) => Array.from({ length: count }, (_, i) => cueId(beat, i))),
    draw(ctx, scene, state, api) {
      function cue(beat, index) {
        if (state.cues) {
          const key = cueId(beat, index);
          if (!state.cues[key]) throw Error(`Missing narration cue ${key}`);
          return state.cues[key];
        }
        const current = state.beat ?? 0;
        const p = current === beat ? (state.beatP ?? 0) * counts[beat] - index : current - beat;
        return { progress: clamp01(p), phase: p < 0 ? 'before' : p >= 1 ? 'after' : 'during' };
      }
      const clock = {
        seconds: state.t ?? 0,
        beat: state.beat ?? 0,
        started: (b, i) => cue(b, i).phase !== 'before',
        done: (b, i) => cue(b, i).phase === 'after',
        progress: (b, i) => cue(b, i).progress,
      };
      return paint(ctx, api, clock);
    },
  };
}
