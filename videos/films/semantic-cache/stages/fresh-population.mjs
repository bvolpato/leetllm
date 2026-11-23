import { freshCacheFrame } from '../model.mjs';
import { cueProgress, servingWindow } from '../arithmetic.mjs';
import { drawDeskHeadings } from '../policy-desk.mjs';

const baseline = servingWindow(10, 6);

function twoPartQuestion(ctx, state, api) {
  const { C, focus } = api;
  const txt = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const readSecond = cueProgress(state, 2, 'second-part', 0.28, 0.5) > 0;
  const inspected = cueProgress(state, 3, 'try-duration', 0, 0.23);
  const fresh = cueProgress(state, 3, 'fresh-policy-read', 0.57, 0.77) > 0;
  drawDeskHeadings(ctx, api);
  txt('Revoked API keys remain visible\nin audit logs for', 112, 345, 45);
  txt('30 days', 112, 578, 82, C.blue);
  focus.target('two-part-request', () => {
    txt('How long is a revoked key logged', 1055, 345, 43);
    if (readSecond) txt('and can it be restored?', 1055, 417, 43, C.yellow);
    else txt('…', 1055, 417, 43, C.muted);
  });
  txt('Facts needed for a complete reply', 1055, 514, 30, C.muted);
  focus.target('required-fields', () => {
    txt('Audit duration', 1055, 608, 38);
    txt(inspected ? '30 days' : '?', 1784, 610, 47, inspected ? C.blue : C.muted, 'right');
    api.line(ctx, 1055, 638, 1808, 638, C.panel, 3);
    if (readSecond) {
      txt('Restoration rule', 1055, 724, 38);
      txt('?', 1784, 725, 50, C.yellow, 'right');
      api.line(ctx, 1055, 755, 1808, 755, C.panel, 3);
    }
  });
  focus.target('final-route', () => {
    if (fresh) {
      api.arrow(ctx, 114, 892, 250, 892, C.cyan, 5);
      txt('Fetch the current restoration policy', 289, 908, 55);
      txt('Keep this pair in shadow review.', 290, 989, 34, C.muted);
    } else txt('Can the stored answer cover the whole request?', 960, 942, 45, C.yellow, 'center');
  });
}

export function drawFreshPopulation(ctx, scene, state, api) {
  if (state.beat >= 2) return twoPartQuestion(ctx, state, api);
  const { C, focus } = api;
  const f = freshCacheFrame(state);
  const climb = cueProgress(state, 1, 'sc-fresh-five', 0.02, 0.21);
  const txt = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const x = (i) => 268 + i * 153,
    y = (ms) => 680 - ms * 0.315;
  txt('Duration per request', 110, 250, 35, C.muted);
  focus.target('release-pair', () =>
    txt(
      'R6    Stored R7    /    Active ' + (f.changed ? 'R8' : 'R7'),
      1808,
      250,
      40,
      f.changed ? C.yellow : C.blue,
      'right',
    ),
  );
  for (const ms of [20, 1020]) {
    txt(ms.toLocaleString('en-US') + ' ms', 190, y(ms) + 10, 30, C.muted, 'right');
    api.line(ctx, 211, y(ms), 1795, y(ms), C.panel, 2);
  }
  focus.target('request-times', () => {
    for (const [i, row] of f.rows.entries()) {
      const pending = row.outcome === 'pending' && climb === 0;
      const heightMs =
        i === 5 && f.changed ? 20 + 1000 * climb : row.outcome === 'reuse' ? 20 : 1020;
      const col = i === 5 ? C.yellow : row.outcome === 'reuse' ? C.blue : C.muted;
      if (pending) txt('?', x(i), y(475), 66, C.yellow, 'center');
      else api.rect(ctx, x(i) - 34, y(heightMs), 68, 680 - y(heightMs), col, undefined, 2);
      txt(row.id, x(i), 742, 34, col, 'center');
    }
  });
  const w = f.result;
  focus.target('window-totals', () => {
    if (!(f.resolved || f.meanVisible || f.tailVisible || f.costVisible || f.savingVisible)) {
      txt('Starting window', 110, 840, 32, C.muted);
      txt('6 hits    ·    4 generation calls    ·    420 ms mean', 110, 910, 44);
      if (f.changed) txt('Which duration belongs above R6?', 1805, 989, 37, C.yellow, 'right');
    } else {
      txt(w.hits + ' hits    ·    ' + w.generations + ' generation calls', 110, 830, 42, C.ink);
      if (f.tailVisible)
        txt(
          'p95   Rank ' + w.rank + ' of 10   ·   ' + w.p95.toLocaleString('en-US') + ' ms',
          1800,
          830,
          35,
          C.yellow,
          'right',
        );
      if (f.meanVisible)
        txt(
          'Mean    ' + baseline.mean + ' + (1,000 ÷ 10) = ' + w.mean + ' ms',
          110,
          908,
          42,
          C.cyan,
        );
      if (f.costVisible) txt('10 × $0.00008 + 5 × $0.004 = $' + w.cost.toFixed(4), 110, 990, 35);
      if (f.savingVisible)
        txt('Forecast saving    $' + w.saving.toFixed(4), 1800, 990, 35, C.green, 'right');
    }
  });
}
export default {
  id: 'fresh-population',
  draw: drawFreshPopulation,
  cues: [
    'sc-fresh-release-change',
    'sc-fresh-five',
    'sc-fresh-mean',
    'sc-fresh-tail',
    'sc-fresh-cost',
    'sc-fresh-saving',
    'second-part',
    'try-duration',
    'fresh-policy-read',
  ],
};
