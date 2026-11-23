export function drawUnknownRotaryScene(ctx, scene, state, api) {
  return api.focus.target(scene.id + '-construction', () => {
    const { C, teaching: g } = api,
      b = state.beat ?? 0;
    {
      const { C, teaching: g } = api,
        b = state.beat ?? 0;
      throw Error('Unknown rotary teaching construction: ' + scene.id);
    }
  });
}
