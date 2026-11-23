import { tracks } from './fixtures.mjs';
import { sampleSlimeChapter } from './construction.mjs';
import { drawRecovery } from './stages/recovery.mjs';
export function drawUnknownSlimeScene(ctx, scene, state, api) {
  if (tracks[scene.id]) return drawRecovery(ctx, scene, state, api);
  return api.focus.target('sl-' + scene.id + '-mechanism', () =>
    sampleSlimeChapter(scene.id, state),
  );
}
