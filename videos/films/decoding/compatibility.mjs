export function rejectUnknownScene(ctx, scene, state, api) {
  throw new Error('Unknown decoding scene ' + scene.id);
}
