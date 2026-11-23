import { sampleModel } from './construction.mjs';
export function drawUnmatchedSqlOriginal(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    m = sampleModel(scene.id, state);
}
export function drawUnmatchedSqlExtended(ctx, scene, state, api) {
  const { C } = api,
    id = scene.id,
    b = state.beat ?? 0;
  api.focus.target(id + '-construction', () => {});
}
