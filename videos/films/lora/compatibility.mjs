export function drawUnknownScene(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0, 0, 1);
  ctx.save();
  throw new Error(`Unknown LoRA scene ${scene.id}`);
}
