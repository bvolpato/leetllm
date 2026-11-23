export function rejectUnknownConstruction(ctx, scene, state, api) {
  return api.focus.target(scene.id + '-construction', () => {
    throw new Error('Unknown clustering/PCA construction: ' + scene.id);
  });
}
