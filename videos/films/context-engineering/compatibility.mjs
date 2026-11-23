import { sampleModel } from './model.mjs';
export function drawUnknownContextScene(ctx, scene, state, api) {
  const { C, components: c } = api;
  const s = sampleModel(scene.id, state),
    b = s.step;
}
