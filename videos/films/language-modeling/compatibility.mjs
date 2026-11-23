export function rejectUnknownExtension(ctx, scene, state, api) {
  api.focus.target(scene.id + '-construction', () => {
    throw new Error('Missing language construction ' + scene.id);
  });
}
