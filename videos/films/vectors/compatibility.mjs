import { extendedFrame } from './model.mjs';

export function rejectUnknownOriginalScene(ctx, scene, state, api) {
  // Retain the original API/state reads before its unknown-scene error.
  const { C } = api,
    beat = state.beat ?? 0;
  throw new Error('Unknown vectors scene ' + scene.id);
}

export function rejectUnknownExtendedScene(ctx, scene, state, api) {
  const { C } = api,
    beat = state.beat ?? 0;
  extendedFrame(scene.id, state);
}
