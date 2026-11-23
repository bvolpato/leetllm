import { ARTICLE_CROP, KERNEL, RIDGE } from '../fixtures.mjs';
import { correlate } from '../arithmetic.mjs';
import { cropForward } from '../model.mjs';
import { formatChapterValue as fmt, text, valueGrid } from '../defaults.mjs';
import { cueClock, footprint } from '../footprint.mjs';

const original = cropForward();
const pitch = 121;
const top = 330;
const starts = [0, 1, 3, 2];

export function drawArticleCrop(ctx, scene, state, api) {
  const cue = cueClock(scene, state, api);
  const { C } = api;
  const edited = cue('crop-weight-edit') === 1 && cue('crop-restore') < 1;
  const weights = RIDGE.map((row) => [...row]);
  if (edited) weights[0][0] = 0;
  const atMap = state.beat === 3;
  const visited = 1 + Math.min(3, Math.floor(3 * cue('crop-map')));
  const index = starts[visited - 1];
  const row = index >> 1,
    col = index % 2;
  const rowCues = ['crop-top', 'crop-middle', 'crop-bottom'];
  const amounts = weights.map((line, r) =>
    line.reduce((sum, w, c) => sum + w * ARTICLE_CROP[row + r][col + c], 0),
  );
  const latestRow = rowCues.findLastIndex((id) => cue(id) > 0);
  const weightTest = state.beat === 2;
  api.focus.target('crop-image', () => {
    text(ctx, api, 'Panel crop', 390, 267, 37, C.ink, 'center');
    valueGrid(ctx, api, ARTICLE_CROP, 150, top, pitch, { kind: 'image', font: 36 });
    footprint(ctx, api, 150, top, pitch, row, col, 3, 3);
    if (state.beat === 1 && latestRow >= 0 && cue('crop-sum') === 0)
      footprint(ctx, api, 150, top, pitch, latestRow, 0, 1, 3, latestRow === 1 ? C.green : C.pink);
    if (weightTest) footprint(ctx, api, 150, top, pitch, 0, 0, 1, 1, C.cyan);
  });
  api.focus.target('crop-kernel', () => {
    text(ctx, api, 'Ridge filter', 920, 267, 37, C.cyan, 'center');
    valueGrid(ctx, api, weights, 740, top, pitch, {
      kind: 'kernel',
      font: 37,
      show: state.beat === 0 ? Math.ceil(cue('crop-weights') * 9) : 9,
    });
    if (weightTest) footprint(ctx, api, 740, top, pitch, 0, 0, 1, 1, C.cyan);
    if (cue('crop-orientation') > 0) {
      const stored = KERNEL[0];
      text(ctx, api, 'Asymmetric row', 930, 789, 29, C.muted, 'center');
      valueGrid(ctx, api, [stored], 625, 842, 84, { font: 32, kind: 'kernel' });
      api.arrow(ctx, 902, 879, 958, 879, C.muted, 3);
      valueGrid(ctx, api, [[...stored].reverse()], 987, 842, 84, { font: 32, kind: 'kernel' });
    }
  });
  api.focus.target('crop-terms', () => {
    if (atMap || state.beat === 0) {
      text(ctx, api, 'Response map', 1505, 267, 37, C.ink, 'center');
      const values = original.raw.map((line, r) =>
        line.map((v, c) =>
          atMap && !edited && starts.slice(0, visited).includes(2 * r + c) ? v : '?',
        ),
      );
      valueGrid(ctx, api, values, 1340, 364, 166, { font: 42 });
      if (atMap && cue('crop-max') === 1) {
        const winner = original.pool.owners[0].input;
        footprint(ctx, api, 1340, 364, 166, ...winner, 1, 1, C.green);
      }
      return;
    }
    text(ctx, api, 'Each row contributes', 1505, 267, 37, C.ink, 'center');
    for (const [r, amount] of amounts.entries()) {
      if (cue(rowCues[r]) === 0) continue;
      const rowSum = ARTICLE_CROP[r].slice(0, 3).reduce((total, v) => total + v, 0);
      const expression =
        edited && r === 0 ? '(0.08 + 0.06) × −0.6' : fmt(rowSum) + ' × ' + fmt(RIDGE[r][0]);
      const y = top + pitch * r + 70;
      text(ctx, api, expression, 1250, y, 29, C.muted);
      text(
        ctx,
        api,
        (amount > 0 ? '+' : '') + fmt(amount),
        1740,
        y,
        43,
        amount > 0 ? C.green : C.pink,
        'right',
      );
    }
    api.line(ctx, 1245, 717, 1750, 717, C.muted, 2);
    if (cue('crop-sum') === 1) {
      const sum = edited ? correlate(ARTICLE_CROP, weights)[0][0] : original.raw[0][0];
      text(ctx, api, 'Window sum', 1250, 800, 32, C.ink);
      text(
        ctx,
        api,
        edited && cue('crop-weight-delta') < 1 ? '?' : fmt(sum),
        1740,
        800,
        54,
        C.green,
        'right',
      );
    }
    if (weightTest && cue('crop-weight-delta') === 1)
      text(ctx, api, '0.05 × (0 − (−0.6)) = +0.030', 1460, 945, 36, C.cyan, 'center');
  });
}
export default {
  id: 'article-crop',
  draw: drawArticleCrop,
  cues: [
    'crop-weights',
    'crop-shape',
    'crop-start',
    'crop-top',
    'crop-middle',
    'crop-bottom',
    'crop-sum',
    'crop-weight-edit',
    'crop-weight-delta',
    'crop-restore',
    'crop-map',
    'crop-max',
    'crop-orientation',
  ],
};
