function drawUnrecognizedMonitoring(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  throw new Error(`Unknown monitoring scene: ${id}`);
}
export function drawUnrecognizedScene(ctx, scene, state, api) {
  return api.focus?.target
    ? api.focus.target(scene.id + '-mechanism', () =>
        drawUnrecognizedMonitoring(ctx, scene, state, api),
      )
    : drawUnrecognizedMonitoring(ctx, scene, state, api);
}
