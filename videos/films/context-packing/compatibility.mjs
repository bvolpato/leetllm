import { sampleModel } from './construction.mjs';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api;
  const s = sampleModel(scene.id, state),
    b = s.step;
}
