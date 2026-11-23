import { prefBound } from './arithmetic.mjs';
import { ALIGNMENT_ORIGINAL } from './fixtures.mjs';
import { focusTarget } from './defaults.mjs';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  ALIGNMENT_ORIGINAL.has(scene.id);
  const { C, teaching: t } = api,
    b = state.beat ?? 0,
    p = prefBound(state.beatP ?? 0);
  const P = (id, beat = b) => {
    const cue = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared cue ' + scene.id + '/' + id);
    return cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : prefBound(cue.progress)
      : b < beat
        ? 0
        : b > beat
          ? 1
          : prefBound((p - 0.12) / 0.76);
  };
  const D = (id, beat = b) => P(id, beat) >= 1 - 1e-8;
  const construction = () => {
    throw Error('Unimplemented alignment construction ' + scene.id);
  };
  focusTarget(ctx, api, scene.id + '-construction', construction);
}
