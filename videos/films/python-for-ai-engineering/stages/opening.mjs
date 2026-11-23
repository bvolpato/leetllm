import { cueProgress } from '../construction.mjs';
import { exactMatch, ramp, score } from '../arithmetic.mjs';
import { examples } from '../fixtures.mjs';
import { perfectRuns } from '../model.mjs';
import { box, mark, text } from '../defaults.mjs';

const originalScore = score(examples);

export function drawOpening(ctx, scene, state, api) {
  if ((state.beat ?? 0) === 0) {
    const drop = cueProgress(state, 'drop-middle', 0, 0.25, 0.52);
    const shortened = perfectRuns[1];
    const fade = ramp(drop, 0.24, 0.65);
    const result = fade === 1 ? shortened.result : originalScore;
    const c = api.C;
    mark(api, 'scored-rows', () => {
      text(ctx, api, 'Request', 175, 344, 35, c.muted);
      text(ctx, api, 'Expected', 405, 344, 35, c.muted);
      text(ctx, api, 'Model prediction', 780, 344, 35, c.muted);
      examples.forEach((row, i) => {
        const removed = !shortened.rows.includes(row);
        if (removed && fade === 1) return;
        const y = 390 + 158 * (i - (i === 2 ? ramp(drop, 0.65, 1) : 0));
        const color = exactMatch(row.expected, row.prediction) ? c.green : c.pink;
        ctx.save();
        if (removed) ctx.globalAlpha *= 1 - fade;
        box(ctx, api, 145, y, 1095, 122, color);
        text(ctx, api, row.prompt.match(/\d+/)[0], 175, y + 78, 45, c.ink, 'left', true);
        text(ctx, api, JSON.stringify(row.expected), 405, y + 78, 43, c.ink, 'left', true);
        text(ctx, api, JSON.stringify(row.prediction), 780, y + 78, 43, color, 'left', true);
        if (removed && drop > 0)
          api.line(ctx, 158, y + 100, 158 + 1065 * ramp(drop, 0, 0.24), y + 100, c.pink, 4);
        ctx.restore();
      });
    });
    mark(api, 'accuracy', () => {
      text(ctx, api, 'Exact-match accuracy', 1540, 345, 38, c.ink, 'center');
      text(ctx, api, result.fraction.toFixed(3), 1540, 544, 112, c.cyan, 'center', true);
      text(ctx, api, result.matches + ' matches', 1540, 665, 46, c.ink, 'center');
      api.line(ctx, 1390, 694, 1690, 694, c.muted, 3);
      text(ctx, api, result.total + ' requests', 1540, 771, 46, c.ink, 'center');
    });
    return;
  }

  const row = examples[1];
  const expected = cueProgress(state, 'expected-field', 1, 0.09, 0.19) > 0;
  const saved = cueProgress(state, 'saved-field', 1, 0.2, 0.39) > 0;
  const asking = cueProgress(state, 'opening-predict', 1, 0.76, 0.91) > 0;
  text(
    ctx,
    api,
    'eval/access_requests.jsonl   /   line 2',
    185,
    275,
    32,
    api.C.muted,
    'left',
    true,
  );
  mark(api, 'row-comparison', () => {
    text(ctx, api, row.prompt, 185, 385, 52, api.C.ink);
    const fields = [
      { name: 'expected', value: row.expected, visible: expected, color: api.C.blue },
      { name: 'prediction', value: row.prediction, visible: saved, color: api.C.cyan },
    ];
    fields.forEach((field, i) => {
      const x = 185 + 800 * i;
      box(ctx, api, x, 470, 745, 215, field.color);
      text(ctx, api, field.name, x + 40, 538, 35, field.color, 'left', true);
      text(
        ctx,
        api,
        field.visible ? JSON.stringify(field.value) : '…',
        x + 40,
        632,
        59,
        api.C.ink,
        'left',
        true,
      );
    });
    if (asking) {
      for (const x of [557, 1357]) {
        api.line(ctx, x, 686, x, 752, api.C.muted, 3);
        api.line(ctx, x, 752, 960, 752, api.C.muted, 3);
      }
      api.line(ctx, 960, 752, 960, 790, api.C.muted, 3);
      text(ctx, api, 'row result = ?', 960, 878, 55, api.C.yellow, 'center', true);
    }
  });
}

export default {
  id: 'opening',
  draw: drawOpening,
  cues: ['drop-middle', 'expected-field', 'saved-field', 'opening-predict'],
};
