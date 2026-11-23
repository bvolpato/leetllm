export function rejectUnknownConstruction(ctx, scene, state, api) {
  return api.focus.target(scene.id + '-mechanism', () => {
    throw new Error('Unknown contrastive scene ' + scene.id);
  });
}
