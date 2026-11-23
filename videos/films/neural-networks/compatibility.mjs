import { neuralFrame } from './construction.mjs';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  const { C } = api,
    f = neuralFrame(state),
    b = f.beat,
    P = f.progress,
    S = f.shown,
    D = f.completed;
  api.focus.target(scene.id + '-mechanism', () => {
    const unmatched = scene.id;
    throw Error('Unknown neural scene ' + scene.id);
  });
}
