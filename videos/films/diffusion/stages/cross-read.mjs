import { completed, opProgress } from '../construction.mjs';
import { crossReadFixture } from '../model.mjs';
import { drawConstructionBox, drawConstructionGrid } from '../defaults.mjs';

export function drawCrossRead(ctx, scene, state, api) {
  const beat = state.beat;
  const move = beat === 2 ? opProgress(state, scene.id) : 0;
  const query = [0.25 + 0.2 * move, 0.1, 0.7 - 0.3 * move];
  const { keys, values, shares, output } = crossReadFixture(query);
  const showShares = beat === 2 || (beat === 1 && completed(state, 'cross-shares'));
  const showOutput = beat === 2 || (beat === 1 && completed(state, 'cross-output'));
  const vector = (v, digits) => '[' + v.map((x) => x.toFixed(digits)).join(', ') + ']';

  api.text(ctx, 'Image query    ' + vector(query, 2), 190, 285, 46, api.C.yellow);
  api.text(ctx, 'Score each key with query · key / √3', 1720, 285, 37, api.C.ink, 'right');
  api.focus.target('df-cross-shares', () =>
    drawConstructionGrid(
      ctx,
      api,
      [
        ['Word', 'Key', 'Value', 'Share'],
        ...['oak', 'dining', 'table'].map((word, i) => [
          word,
          vector(keys[i], 2),
          vector(values[i], 2),
          showShares ? (100 * shares[i]).toFixed(1) + '%' : '?',
        ]),
      ],
      175,
      360,
      1570,
      386,
      api.C.cyan,
      36,
    ),
  );
  api.focus.target('df-cross-output', () =>
    drawConstructionBox(
      ctx,
      api,
      'Weighted value    ' + (showOutput ? vector(output, 3) : '?'),
      480,
      835,
      960,
      showOutput ? api.C.green : api.C.yellow,
      115,
      44,
    ),
  );
}
export default {
  id: 'cross-read',
  draw: drawCrossRead,
  cues: [
    'df-cross-read-0',
    'df-cross-read-1',
    'df-cross-shares',
    'df-cross-output',
    'df-cross-read-2',
  ],
};
