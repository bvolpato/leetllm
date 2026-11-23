import { clamp } from './arithmetic.mjs';
import { sentenceCounts } from './fixtures.mjs';
export const motion = (p) => {
  const q = clamp((p - 0.08) / 0.5);
  return q * q * (3 - 2 * q);
};
export function clause(state, id, beat, sentence, api) {
  if (sentence < 0 || sentence >= sentenceCounts[id][beat])
    throw Error('Invalid tracking clause ' + id + '/' + beat + '/' + sentence);
  if (state.beat > beat) return 1;
  if (state.beat < beat) return 0;
  const cue = `tr-${id}-${beat}-${sentence}`;
  return state.cues
    ? api
      ? api.focus.progress(cue, 0)
      : (state.cues[cue]?.progress ?? 0)
    : clamp((state.beatP ?? 0) * sentenceCounts[id][beat] - sentence);
}
