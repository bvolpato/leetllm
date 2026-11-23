import { phraseEnded } from '../construction.mjs';
import { drawActionPositions } from '../action-positions.mjs';

export function drawTokenBoundary(ctx, scene, state, api) {
  const { C } = api;
  const end = (id, beat, at) => phraseEnded(state, api, id, beat, at);
  if (state.beat < 2) {
    const changed = end('boundary-new-action', 1, 0.62);
    const result = changed ? end('boundary-half', 1, 0.9) : end('boundary-four', 1, 0.32);
    drawActionPositions(ctx, api, {
      ids: [31, 91, 32, 33, 92, 34],
      names: ['call', 'error', 'retry', 'query', 'rows', 'reply'],
      mask: [1, 0, 1, 1, 0, 1],
      scores: [-0.1, NaN, -0.3, -0.4, Infinity, changed ? -1.2 : -0.8],
      result,
      showSum: result,
    });
    return;
  }
  const merged = end('boundary-merge', 2, 0.7);
  api.focus.target('boundary-ids', () => {
    api.text(ctx, 'Toy vocabulary', 130, 282, 40, C.ink, 'left', 'serif');
    api.text(ctx, 'Append sampled IDs', 190, 485, 39, C.blue);
    api.text(ctx, 'Encode the text together', 190, 755, 39, C.yellow);
    for (const [x, v, id] of [
      [800, 'A', 7],
      [1230, 'B', 8],
    ]) {
      api.rect(ctx, x, 365, 330, 164, C.panel, C.blue, 12);
      api.text(ctx, v, x + 165, 440, 53, C.ink, 'center');
      api.text(ctx, 'ID ' + id, x + 165, 501, 34, C.blue, 'center');
    }
    api.rect(ctx, 800, 644, 760, 164, C.panel, C.yellow, 12);
    api.text(ctx, 'AB', 1180, 718, 53, C.ink, 'center');
    api.text(ctx, merged ? 'ID 9' : 'ID ?', 1180, 778, 34, C.yellow, 'center');
  });
  api.text(
    ctx,
    'Keep sampled IDs aligned with their original scores and masks.',
    960,
    972,
    38,
    C.ink,
    'center',
  );
}
export default {
  id: 'token-boundary',
  draw: drawTokenBoundary,
  cues: [
    'boundary-context',
    'boundary-four',
    'boundary-new-action',
    'boundary-half',
    'boundary-merge',
  ],
};
