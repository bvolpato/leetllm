import { freshServingState, cueProgress } from '../construction.mjs';
import { servingRequestMetrics } from '../model.mjs';
import { drawReceiptClock } from '../receipt-clock.mjs';
import { text } from '../defaults.mjs';

function magnifySend(ctx, api, row, verdict) {
  const { C } = api;
  const m = servingRequestMetrics(row);
  const x = (ms) => 415 + (ms - row.scheduled) * 8.1;
  const y = 895;
  text(ctx, api, row.id, 130, y + 12, 38, C.ink, 'left');
  text(ctx, api, 'ms', 130, y + 62, 28, C.muted, 'left');
  api.line(ctx, x(row.scheduled), y, x(row.tokens[0]), y, C.muted, 2);
  api.line(ctx, x(row.scheduled), y - 15, x(row.scheduled), y + 15, C.yellow, 4);
  const lastAllowed = row.scheduled + 20;
  api.line(ctx, x(lastAllowed), y, x(lastAllowed), y + 24, C.yellow, 3);
  text(ctx, api, 'Send limit ' + lastAllowed, x(lastAllowed), y + 119, 28, C.yellow);
  text(ctx, api, 'Due ' + row.scheduled, x(row.scheduled), y + 64, 30, C.yellow);
  api.circle(ctx, x(row.sent), y, 10, C.cyan);
  text(ctx, api, 'Sent ' + row.sent, x(row.sent), y - 35, 30, C.cyan);
  api.circle(ctx, x(row.tokens[0]), y, 11, C.ink);
  text(ctx, api, 'First token ' + row.tokens[0], x(row.tokens[0]), y - 35, 30, C.ink);
  text(ctx, api, 'Wait ' + m.ttft + ' ms', x(row.tokens[0]), y + 64, 30, C.ink);
  text(ctx, api, 'Lag ' + m.lag + ' ms', 1450, y - 35, 33, C.ink, 'left');
  if (verdict !== null)
    text(
      ctx,
      api,
      'Scorer exit ' + verdict,
      1450,
      y + 52,
      35,
      verdict === 2 ? C.red : C.green,
      'left',
    );
}

export function drawFreshReceipt(ctx, scene, state, api) {
  const { C, focus } = api;
  const beat = state.beat ?? 0,
    p = state.beatP ?? 0;
  const v = freshServingState(beat, p, state.cues),
    r = v.receipt;
  const windowEnd = 2500;
  if (beat < 3) text(ctx, api, 'Promise   ≥ 95% qualified', 1780, 145, 33, C.yellow, 'right');
  const drain = cueProgress(state.cues, 'fresh-window', beat > 0 ? 1 : api.phase(p, 0.18, 0.58));
  focus.target('fresh-ledger', () =>
    drawReceiptClock(ctx, api, v.rows, {
      windowEnd,
      horizon: r.horizon,
      until: windowEnd + drain * (r.horizon - windowEnd),
    }),
  );
  if (beat < 2) {
    const metrics = [
      [
        'Attainment',
        v.showAttainment,
        r.qualified + ' / ' + r.offered + ' = ' + r.attainment * 100 + '%',
      ],
      [
        'Qualified per second',
        v.showQualified,
        r.qualified + ' / ' + r.horizon / 1000 + ' = ' + r.qualifiedRps,
      ],
      [
        'Successful per second',
        v.showSuccess,
        r.success + ' / ' + r.horizon / 1000 + ' = ' + r.successRps,
      ],
      [
        'Offered per second',
        v.showOffered,
        r.offered + ' / ' + windowEnd / 1000 + ' = ' + r.offeredRps,
      ],
    ];
    metrics.forEach(([name, show, value], i) => {
      const xx = 315 + 430 * i;
      text(ctx, api, name, xx, 866, 32, C.muted);
      text(ctx, api, show ? value : '?', xx, 945, 42, show ? C.ink : C.muted);
    });
  } else if (beat === 2) {
    const after = (id, threshold) =>
      state.cues?.[id] ? state.cues[id].phase === 'after' : p >= threshold;
    const exit =
      !r.scheduleValid && after('fresh-invalid', 0.55) ? 2 : after('fresh-valid', 0.9) ? 0 : null;
    focus.target('fresh-clock', () => magnifySend(ctx, api, v.rows[1], exit));
  } else {
    const x = 325,
      w = 1110,
      y = 895,
      floor = 0.95;
    focus.target('fresh-gate', () => {
      api.line(ctx, x, y, x + w, y, C.muted, 3);
      api.line(ctx, x, y, x + w * r.attainment, y, C.cyan, 12);
      text(ctx, api, r.attainment * 100 + '% attained', x + w * r.attainment, y + 66, 35, C.cyan);
      api.line(ctx, x + w * floor, y - 22, x + w * floor, y + 22, C.yellow, 5);
      text(ctx, api, floor * 100 + '% promised', x + w * floor, y - 53, 34, C.yellow);
      if (v.promise) {
        text(ctx, api, 'Hold rollout', 1660, y + 15, 44, C.red);
        text(ctx, api, 'Capacity: unmeasured', 1660, y + 67, 28, C.muted);
      }
    });
  }
}
export default {
  id: 'fresh-receipt',
  draw: drawFreshReceipt,
  cues: [
    'fresh-window',
    'fresh-attainment',
    'fresh-qualified',
    'fresh-success',
    'fresh-offered',
    'fresh-delay',
    'fresh-invalid',
    'fresh-restore',
    'fresh-valid',
    'fresh-promise',
  ],
};
