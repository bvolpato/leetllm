import { LEAK_ROWS } from '../fixtures.mjs';
import { openingRule } from '../model.mjs';

export function drawTargetLeak(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const predictions = LEAK_ROWS.map(openingRule);
  const active = beat === 2 ? 6 : beat === 3 || beat === 4 ? 7 : null;
  // A pending prediction stays empty while the viewer works the row.
  const count = [0, 6, 7, 7, 8, 8][beat] ?? 8;
  const atOpening = beat > 0;
  const columns = [185, 382, 568, 765, 950];
  api.text(ctx, 'Eight audit outcomes', 125, 255, 36, C.ink);
  ['Request', 'Ambiguity', 'Support', 'Predict', 'Audit'].forEach((name, i) =>
    api.text(ctx, name, columns[i], 335, 28, C.muted, 'center'),
  );
  api.line(ctx, 112, 356, 1035, 356, C.muted, 2);
  for (const [i, row] of LEAK_ROWS.entries()) {
    const y = 423 + i * 71;
    if (i === active) api.rect(ctx, 112, y - 48, 923, 64, C.panel, C.yellow, 8);
    const pred = atOpening ? predictions[i].prediction : row.y;
    const filled = !atOpening || i < count;
    const ink = filled && pred !== row.y ? C.pink : C.blue;
    const values = [row.id, row.ambiguity.toFixed(1), row.policy, filled ? pred : '?', row.y];
    values.forEach((v, j) =>
      api.text(ctx, v, columns[j], y, 36, j === 3 ? ink : j === 4 ? C.ink : C.muted, 'center'),
    );
  }

  api.line(ctx, 1095, 240, 1095, 950, C.muted, 2);
  const left = 1170;
  api.text(ctx, atOpening ? 'At request opening' : 'After the audit', left, 306, 39, C.ink);
  api.text(
    ctx,
    atOpening ? 'Ambiguity − 0.9 × support' : 'Prediction ← audit label',
    left,
    402,
    40,
    C.blue,
  );
  if (atOpening) api.text(ctx, 'Review if the result is above zero.', left, 467, 32, C.muted);
  if (active !== null) {
    const row = LEAK_ROWS[active];
    const result = predictions[active];
    const evaluated = active < count;
    api.text(
      ctx,
      row.id + '   ' + row.ambiguity.toFixed(1) + ' − 0.9 × ' + row.policy,
      left,
      595,
      44,
      C.ink,
    );
    api.text(
      ctx,
      evaluated ? '= ' + result.margin.toFixed(1).replace('-', '−') : '= ?',
      left,
      685,
      59,
      C.yellow,
    );
    api.text(
      ctx,
      evaluated ? (result.prediction ? 'False alarm' : 'Missed review') : 'Send for review?',
      left,
      795,
      42,
      evaluated ? C.pink : C.yellow,
    );
  }
  if (!atOpening || count === LEAK_ROWS.length) {
    const matches = atOpening
      ? LEAK_ROWS.filter((row, i) => predictions[i].prediction === row.y).length
      : LEAK_ROWS.length;
    api.text(
      ctx,
      matches +
        ' / ' +
        LEAK_ROWS.length +
        '  =  ' +
        Math.round((100 * matches) / LEAK_ROWS.length) +
        '%',
      left,
      915,
      67,
      C.yellow,
    );
    api.text(ctx, 'predictions matched the audit', left, 972, 32, C.ink);
  } else if (beat === 1) {
    api.text(ctx, 'First six predictions match.', left, 672, 39, C.blue);
  }
}

export default { id: 'target-leak', draw: drawTargetLeak };
