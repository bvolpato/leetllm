import { ids } from './fixtures.mjs';
import { sampleModel } from './construction.mjs';
import { gradientFixture } from './arithmetic.mjs';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  return api.focus.target('fa-' + scene.id + '-mechanism', () => {
    ids.includes(scene.id);
    const { C, teaching: t } = api,
      s = sampleModel(scene.id, state),
      { b, p } = s,
      id = scene.id,
      g = gradientFixture();
    throw Error('Unknown FlashAttention chapter ' + id);
  });
}
