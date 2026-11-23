import { coreScenes } from './fixtures.mjs';
import { sampleModel } from './construction.mjs';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  coreScenes.has(scene.id);
  const { C, components: c, teaching: t } = api,
    s = sampleModel(scene.id, state),
    b = s.step;
}
