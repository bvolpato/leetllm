export function drawUnknownPromptScene(ctx, scene, state, api) {
  const { C, components: c } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0, 0, 1);
  throw new Error('Unknown prompt injection scene ' + scene.id);
}
