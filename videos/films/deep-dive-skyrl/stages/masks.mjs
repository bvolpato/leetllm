import { labels, mask, tokens } from '../fixtures.mjs';
import { phraseEnded } from '../construction.mjs';
import { drawActionPositions } from '../action-positions.mjs';

export function drawMasks(ctx, scene, state, api) {
  const end = (id, beat, at) => phraseEnded(state, api, id, beat, at);
  const observation = end('masks-score-error', 1, 0.3);
  const action = end('masks-score-repair', 2, 0.35);
  const result = action ? end('masks-six', 2, 0.8) : end('masks-half', 0, 0.73);
  api.text(
    ctx,
    'query-42_0    /    five response positions',
    110,
    246,
    35,
    api.C.ink,
    'left',
    'mono',
  );
  drawActionPositions(ctx, api, {
    ids: tokens,
    names: labels,
    mask,
    scores: [-0.2, -0.4, observation ? -9 : 0, -0.6, action ? -1.2 : -0.8],
    result,
  });
  api.text(
    ctx,
    'Mean negative log probability    /    alignment check',
    960,
    1018,
    30,
    api.C.muted,
    'center',
  );
}
export default {
  id: 'masks',
  draw: drawMasks,
  cues: ['masks-half', 'masks-score-error', 'masks-still-half', 'masks-score-repair', 'masks-six'],
};
