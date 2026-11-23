import { rows, wrongRow } from '../fixtures.mjs';
import { scoreFrame } from '../model.mjs';
import { caption, mark, panel, text } from '../defaults.mjs';
export function drawScore(ctx, scene, state, api) {
  const modelState = scoreFrame(state),
    all = [...rows, wrongRow];
  text(
    ctx,
    api,
    'Committed fixture · expected versus saved prediction',
    740,
    300,
    33,
    api.C.muted,
    'center',
  );
  mark(api, 'comparison-rows', () => {
    text(ctx, api, 'request', 190, 360, 28, api.C.muted);
    text(ctx, api, 'expected', 620, 360, 28, api.C.muted);
    text(ctx, api, 'prediction', 960, 360, 28, api.C.muted);
    all.forEach((row, i) => {
      if (i === 3 && modelState.fourth === 0) return;
      const y = 395 + i * 120,
        p = modelState.parts[i],
        match = row.expected === row.prediction,
        color = p === 1 ? (match ? api.C.green : api.C.pink) : api.C.muted;
      panel(ctx, api, 170, y, 1070, 105, color);
      text(ctx, api, 'Access request ' + (101 + i), 190, y + 42, 29, api.C.ink);
      text(ctx, api, 'status?', 190, y + 80, 25, api.C.muted);
      text(ctx, api, row.expected, 620, y + 64, 34);
      text(ctx, api, row.prediction, 960, y + 64, 34, color);
    });
  });
  text(ctx, api, 'matches', 1485, 390, 31, api.C.green, 'center');
  text(ctx, api, 'rows compared', 1485, 630, 30, api.C.cyan, 'center');
  for (let i = 0; i < 4; i++) {
    const q = modelState.parts[i],
      x = 1350 + i * 75;
    if (q > 0) api.rect(ctx, x, 665, 54, 85 * q, api.C.cyan);
    if (q > 0 && all[i].expected === all[i].prediction)
      api.rect(ctx, x, 420, 54, 85 * q, api.C.green);
  }
  text(ctx, api, modelState.result.correct, 1485, 570, 57, api.C.green, 'center');
  text(ctx, api, modelState.compared, 1485, 810, 57, api.C.cyan, 'center');
  mark(api, 'count-gate', () => {
    const complete = modelState.compared >= 3,
      showGate = modelState.gate === 1,
      fail = modelState.failure === 1;
    const label =
      (state.beat ?? 0) >= 2 && modelState.fourth < 1
        ? 'Fourth row comparison pending · gate pending'
        : !complete
          ? 'Compare the rows before judging the fixture'
          : showGate
            ? `${modelState.result.correct} × 3 ${modelState.result.passes ? '≥' : '<'} ${modelState.result.total} × 2${fail ? '   ·   exit 1' : modelState.result.total === 3 ? '   ·   exit 0' : ''}`
            : `2 / 3 ≈ ${(2 / 3).toFixed(3)}`;
    text(ctx, api, label, 960, 925, 44, fail ? api.C.pink : api.C.yellow, 'center');
  });
  caption(
    ctx,
    api,
    (state.beat ?? 0) === 1
      ? 'One more wrong row: does the count gate still pass?'
      : modelState.failure === 1
        ? 'Gate failed: score regressed below 2/3'
        : 'Every completed row increases the denominator',
  );
}
export default {
  id: 'score',
  draw: drawScore,
  cues: [
    'compare-first',
    'compare-second',
    'compare-third',
    'integer-gate',
    'append-wrong',
    'failed-gate',
  ],
};
