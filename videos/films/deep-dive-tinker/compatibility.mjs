import { tracks, sampleModel } from './model.mjs';
import { tinkerConstruction } from './construction.mjs';
export function drawUnknownTinkerScene(ctx, scene, state, api) {
  if (tracks[scene.id])
    return api.focus.target('tk-' + scene.id + '-trace', () => {
      const { C, components: c, teaching: t } = api;
      sampleModel(scene.id, state);
    });
  const { C, components: c, teaching: t, focus: f } = api,
    id = scene.id,
    s = tinkerConstruction(id, state),
    b = s.b;
  return f.target('tk-' + id + '-trace', () => {
    throw Error('Unimplemented Tinker construction: ' + id);
  });
}
