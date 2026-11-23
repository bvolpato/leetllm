import { phase } from './arithmetic.mjs';
import { ids } from './fixtures.mjs';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  ids.includes(scene.id);
  const { C, teaching: t } = api,
    b = state.beat,
    q = phase(state.beatP),
    id = scene.id;
  api.focus.target(id + '-mechanism', () => {
    throw new Error('Missing topic-specific drawing ' + id);
  });
}
