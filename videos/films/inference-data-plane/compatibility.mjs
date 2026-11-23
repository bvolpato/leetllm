export function drawUnrecognizedScene(ctx, scene, state, api) {
  const b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    { C } = api;
  const body = () => {};
  if (api.focus)
    api.focus.target(scene.id + '-construction', () => {
      if (scene.id === 'critical-path') api.focus.target('critical-path-readout-5', body);
      else body();
    });
  else body();
}
