import { serialize } from '../model.mjs';
import { completed, movement } from '../replay.mjs';
import { slot } from '../strips.mjs';

function comparison(ctx, state, api) {
  const { C } = api;
  const fixedA = completed(state, 1, 'drift-repair-a');
  const showB = movement(state, 1, 'drift-b') > 0;
  const beamsVisible = completed(state, 1, 'drift-beams');
  const fixedB = completed(state, 1, 'drift-repair-b');
  const expected = serialize(0);
  const a = fixedA ? expected : serialize(1);
  api.text(ctx, 'Bird question   /   same class, weight file and precision', 100, 260, 42, C.ink);
  const columns = [490, 1000, 1500];
  for (const [i, label] of ['Input IDs from position 6', 'Full-forward scores', 'Beams'].entries())
    api.text(ctx, label, columns[i], 381, 30, C.muted);
  const cells = [
    ['Approved', expected, 'Reference', '1'],
    ['Client A', a, fixedA ? 'Compare next' : 'Waiting for IDs', ''],
    ...(showB
      ? [['Client B', expected, 'Within tolerance', beamsVisible ? (fixedB ? '1' : '3') : '…']]
      : []),
  ];
  cells.forEach(([label, input, scores, beams], i) => {
    const y = 412 + i * 170;
    const color = [C.blue, C.cyan, C.pink][i];
    api.text(ctx, label, 100, y + 75, 49, color);
    for (let j = 0; j < 3; j++)
      slot(ctx, api, { x: columns[0] + j * 120, y, width: 120, word: input.ids[6 + j], color });
    api.text(ctx, scores, columns[1], y + 70, 39, C.ink);
    api.text(ctx, beams, columns[2], y + 75, 54, i === 2 && !fixedB ? C.pink : color);
  });
  const footer = fixedB
    ? 'Replay the chosen IDs and stopping point with one beam and sampling off.'
    : showB
      ? 'Client B has already matched the input and full-forward scores.'
      : fixedA
        ? 'Client A now has the approved input.'
        : 'Which setting would you restore in client A?';
  api.text(ctx, footer, 100, 1005, 37, fixedB || fixedA ? C.cyan : C.yellow);
}

export function drawDriftTests(ctx, scene, state, api) {
  return api.focus.target('drift-receipt', () => {
    if (state.beat < 2) return comparison(ctx, state, api);
    const { C } = api;
    const rows = [
      ['First cached mismatch', 'Replay its prefix, mask and positions.', 'drift-step'],
      ['Missing keys', 'Check tensor names, conversion and dtype.', 'drift-keys'],
      ['Memory or latency', 'Measure live slots, active batch and transfers.', 'drift-budget'],
    ];
    api.text(ctx, 'What evidence would isolate the change?', 100, 287, 54, C.ink);
    rows.forEach(([symptom, action, cue], i) => {
      const y = 450 + i * 191;
      if (i > 0 && movement(state, 2, cue) === 0) return;
      api.text(ctx, symptom, 100, y, 40, C.blue);
      if (movement(state, 2, cue) > 0) api.text(ctx, action, 743, y, 40, C.ink);
      api.line(ctx, 100, y + 52, 1800, y + 52, C.muted, 2);
    });
  });
}
export default {
  id: 'drift-tests',
  draw: drawDriftTests,
  cues: [
    'drift-a',
    'drift-predict',
    'drift-repair-a',
    'drift-b',
    'drift-beams',
    'drift-repair-b',
    'drift-step',
    'drift-keys',
    'drift-budget',
  ],
};
