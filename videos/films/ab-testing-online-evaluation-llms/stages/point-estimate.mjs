import { onlineCueProgress } from '../construction.mjs';
import { pointEstimate } from '../model.mjs';
import { line, text } from '../defaults.mjs';
import { latencyRuler, resolutionRows } from './prompt-readout.mjs';

const rates = pointEstimate();
const limits = [
  {
    label: 'Safety pass rate lost',
    measured: 0.1,
    limit: 0.05,
    format: (n) => n.toFixed(2) + ' pp',
  },
  { label: 'Added p95 response time', measured: 410, limit: 300, format: (n) => n + ' ms' },
  {
    label: 'Added mean session cost',
    measured: 0.018,
    limit: 0.01,
    format: (n) => '$' + n.toFixed(3),
  },
];

export function drawPointEstimate(ctx, scene, state, api) {
  const { C } = api;
  const p = (name, beat) => onlineCueProgress(state, 'point-' + name, beat);
  const beat = state.beat ?? 0;
  if (beat < 4) {
    api.focus.target('point-rates', () => {
      const visible = p('new-rates', 0) > 0;
      resolutionRows(ctx, api, {
        rates: [rates.a, rates.b],
        visible: [visible, visible],
        showRates: visible,
      });
      if (p('difference', 0) === 1) {
        text(
          ctx,
          api,
          '+' + rates.percentagePoints.toFixed(1) + ' percentage points',
          595,
          554,
          36,
          C.cyan,
        );
        if (p('relative', 1) === 1)
          text(
            ctx,
            api,
            '3.2 / 60.0 × 100 ≈ ' + rates.relativePercent.toFixed(2) + '% relative',
            1055,
            554,
            31,
            C.ink,
          );
      }
    });
    api.focus.target('point-time', () =>
      latencyRuler(ctx, api, {
        limit: limits[1].limit,
        change: limits[1].measured,
        progress: p('time', 2),
        compared: p('excess', 3) === 1,
      }),
    );
    if (beat < 2)
      text(ctx, api, 'Separate illustrative worksheet  ·  point estimates', 145, 978, 29, C.muted);
    if (beat === 2 && p('time', 2) === 1)
      text(ctx, api, 'How far past the time limit?', 145, 978, 38);
    return;
  }
  text(ctx, api, 'Change from A to B', 145, 262, 37);
  text(ctx, api, 'Allowed change', 1160, 262, 34, C.yellow, 'center');
  line(ctx, api, 1160, 300, 1160, 852, C.yellow, 4);
  limits.forEach(({ label, measured, limit, format }, i) => {
    const y = 405 + 180 * i;
    const id = ['safety', 'time', 'cost'][i];
    const progress = i === 1 ? 1 : p(id, 4);
    api.focus.target('point-' + id + '-row', () => {
      text(ctx, api, label, 145, y + 8, 34);
      const origin = 725;
      const unit = (1160 - origin) / limit;
      line(ctx, api, origin, y, 1670, y, C.border, 4);
      text(ctx, api, format(limit), 1135, y + 65, 31, C.yellow, 'right');
      if (progress > 0)
        line(ctx, api, origin, y, origin + measured * unit * progress, y, C.cyan, 11);
      if (progress === 1) {
        line(ctx, api, 1160, y, origin + measured * unit, y, C.pink, 11);
        text(ctx, api, format(measured), origin + measured * unit, y - 28, 35, C.pink, 'center');
      }
    });
  });
  if (p('verdict', 4) === 1)
    text(
      ctx,
      api,
      'Hold the citation prompt. Each measured change exceeds its limit.',
      145,
      963,
      37,
      C.pink,
    );
}
export default {
  id: 'point-estimate',
  draw: drawPointEstimate,
  cues: [
    'point-new-rates',
    'point-difference',
    'point-relative',
    'point-time',
    'point-excess',
    'point-safety',
    'point-cost',
    'point-verdict',
  ],
};
