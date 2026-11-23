import { sampleModel } from './model.mjs';
export function rejectUnknownScene(ctx, scene, state, api) {
  const { components: c, teaching: t } = api,
    C = {
      ...api.C,
      purple: '#b7a2f7',
    };
  sampleModel(scene.id, state);
}
