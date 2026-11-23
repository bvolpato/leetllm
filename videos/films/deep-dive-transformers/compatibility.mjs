import { sampleModel } from './model.mjs';
export function rejectUnknownScene(ctx, scene, state, api) {
  return api.focus.target('hf-' + scene.id + '-mechanism', () => {
    const { C, components: c, teaching: t } = api;
    sampleModel(scene.id, state);
    throw Error('Unimplemented Transformers scene ' + scene.id);
  });
}
