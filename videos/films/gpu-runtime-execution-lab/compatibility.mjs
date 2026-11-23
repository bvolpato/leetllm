import { tracks, sampleModel } from './model.mjs';
import { sampleRuntimeChapter } from './construction.mjs';
export function drawUnknownRuntimeScene(ctx, scene, state, api) {
  if (tracks[scene.id]) {
    const { C, components: c, teaching: t } = api;
    sampleModel(scene.id, state);
  }
  return api.focus.target('gr-' + scene.id + '-mechanism', () =>
    sampleRuntimeChapter(scene.id, state),
  );
}
