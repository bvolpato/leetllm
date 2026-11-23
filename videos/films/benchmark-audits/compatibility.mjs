import { auditExpandedScenes } from './fixtures.mjs';
import { sampleModel } from './model.mjs';
import { auditFocusApi } from './defaults.mjs';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  api = auditFocusApi(api, scene);
  auditExpandedScenes.has(scene.id);
  const { C, components: c, teaching: t } = api;
  const s = sampleModel(scene.id, state),
    b = s.step,
    p = s.p;
}
