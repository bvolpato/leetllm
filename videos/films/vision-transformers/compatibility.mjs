import { visionBound } from './construction.mjs';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  api.focus.target(scene.id + '-mechanism', () => {
    const { C, components: c } = api,
      b = state.beat ?? 0,
      p = visionBound(state.beatP ?? 0),
      id = scene.id;
    throw Error('Unknown vision construction ' + id);
  });
}
