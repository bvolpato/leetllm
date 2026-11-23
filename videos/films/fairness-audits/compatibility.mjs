export function rejectUnknownScene(ctx, scene, state, api) {
  const b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    { C } = api;
  const body = () => {
    throw new Error('Unknown fairness scene ' + scene.id);
  };
  if (api.focus) api.focus.target(scene.id + '-construction', body);
  else body();
}
