import { phase } from './encoding.mjs';
import { extendedIds } from './fixtures.mjs';
import { sampleOriginalModel } from './construction.mjs';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  extendedIds.includes(scene.id);
  {
    const { C, components: c, teaching: t } = api,
      s = sampleOriginalModel(scene.id, state),
      b = s.step;
  }
  {
    const { C, teaching: t } = api,
      b = state.beat,
      p = phase(state.beatP);
  }
}
