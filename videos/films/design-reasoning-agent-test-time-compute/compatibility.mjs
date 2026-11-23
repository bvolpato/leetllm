import { constructionModel } from './model.mjs';
import { sentence } from './construction.mjs';
export function drawUnknownConstruction(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    id = scene.id,
    b = state.beat ?? 0,
    s = constructionModel(id, state),
    p = (beat, n) => sentence(state, id, beat, n),
    done = (beat, n) => p(beat, n) === 1;
  throw Error('Unknown reasoning construction ' + id);
}
