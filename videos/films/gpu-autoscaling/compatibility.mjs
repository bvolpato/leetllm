import { gaBound } from './arithmetic.mjs';
export function rejectUnknownScene(ctx, scene, state, api) {
  const { C, components: c } = api,
    b = state.beat ?? 0,
    p = gaBound(state.beatP ?? 0),
    id = scene.id;
  api.focus.target(id + '-mechanism', () => {
    const { C, components: c } = api,
      b = state.beat ?? 0,
      p = gaBound(state.beatP ?? 0),
      id = scene.id;
    throw Error('Missing GPU upgrade scene ' + id);
  });
}
