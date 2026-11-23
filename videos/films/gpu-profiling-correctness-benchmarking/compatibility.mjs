import { sampleModel } from './model.mjs';
export function originalUnknownScene(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    s = sampleModel(scene.id, state),
    b = s.step;
}
export function currentUnknownScene(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    id = scene.id,
    b = state.beat ?? 0;
  api.focus.target(id + '-mechanism', () => {});
}
