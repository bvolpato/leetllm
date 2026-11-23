import { clamp } from './arithmetic.mjs';
export function mtEvent(scene, state, beat, sentence) {
  const name =
      'mt-' + scene + '-' + (sentence === undefined ? 'b' + beat : 's' + beat + '-' + sentence),
    cue = state.cues?.[name];
  if (cue) return cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : clamp(cue.progress ?? 0);
  if (state.cues && Object.keys(state.cues).length)
    throw Error('Undeclared construction cue ' + name);
  return (state.beat ?? 0) < beat
    ? 0
    : (state.beat ?? 0) > beat
      ? 1
      : clamp(((state.beatP ?? 0) - 0.08) / 0.8);
}
