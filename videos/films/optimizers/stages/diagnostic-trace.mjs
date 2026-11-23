import { DIAGNOSTIC_RUNS, HELD_OUT_TRIALS } from '../fixtures.mjs';
import { fmt, loss } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';

function traceComparison(ctx, state, api) {
  const { C, teaching } = api;
  const q = (id, b, from, to) => cueProgress(state, id, b, from, to);
  const first = q('diagnostic-boundary', 0, 0.04, 0.33);
  const replay = q('diagnostic-compare', 0, 0.58, 0.86);
  const extension = q('diagnostic-record', 1, 0.12, 0.62);
  const extra = Math.floor(extension * 4);
  const counts = [
    Math.floor(first * 5) + Math.floor(replay * 3) + extra,
    Math.floor(replay * 8) + extra,
  ];
  const stops = [5, 8, 12];
  api.text(ctx, 'Training loss on the same quadratic', 180, 240, 37, C.ink);
  const plot = teaching.axes({
    x: 230,
    y: 350,
    width: 1050,
    height: 525,
    xDomain: [0, 12],
    yDomain: [0, 60],
    xTicks: [0, 4, 8, 12],
    yTicks: [0, 30, 60],
    xLabel: 'completed updates',
    yLabel: 'loss',
    fontSize: 29,
    color: C.muted,
  });
  api.focus.target('rate-probe', () => {
    const target = stops[extension > 0 ? 2 : replay > 0 ? 1 : 0];
    const at = plot.point(target, 0);
    api.line(ctx, at.x, at.y, at.x, plot.point(target, 60).y, C.muted, 2);
    for (const [i, run] of [DIAGNOSTIC_RUNS.high, DIAGNOSTIC_RUNS.lower].entries()) {
      if (i === 1 && replay === 0) continue;
      const color = i ? C.green : C.pink;
      const count = counts[i];
      const points = [
        { x: 0, y: loss(run.start) },
        ...run.records.slice(0, count).map((r) => ({ x: r.t, y: r.loss })),
      ];
      teaching.curve({ plot, points, color, width: 5 });
      const end = points.at(-1),
        p = plot.point(end.x, end.y);
      api.circle(ctx, p.x, p.y, 9, color);
      const y = 402 + i * 194;
      api.text(ctx, 'Peak rate   ' + fmt(run.records[4].eta), 1390, y, 33, color);
      api.text(ctx, 'At ' + count + '    L = ' + fmt(end.y, 3), 1390, y + 70, 37, color);
    }
  });
  api.focus.target('boundary-reading', () => {
    const r = DIAGNOSTIC_RUNS.high.records[4];
    if ((state.beat ?? 0) === 0)
      api.text(
        ctx,
        q('diagnostic-measure', 0, 0.33, 0.48) === 1
          ? 'At update 5    ·    peak rate ' +
              r.eta +
              '    ·    gradient norm ' +
              fmt(Math.hypot(...r.gradient), 3)
          : 'First peak rate at update 5',
        180,
        1005,
        34,
        C.ink,
      );
    else
      api.text(
        ctx,
        'Update 8    ·    loss ' +
          fmt(DIAGNOSTIC_RUNS.high.records[7].loss, 2) +
          ' vs ' +
          fmt(DIAGNOSTIC_RUNS.lower.records[7].loss, 2),
        180,
        1005,
        34,
        C.ink,
      );
  });
}

function heldOut(ctx, state, api) {
  const { C } = api;
  const train = cueProgress(state, 'trial-train', 2, 0.08, 0.34);
  const held = cueProgress(state, 'trial-held', 2, 0.52, 0.74);
  const x = (v) => 560 + 2880 * v;
  api.text(
    ctx,
    'Separate trials    ·    40 updates    ·    same data and held-out split',
    180,
    245,
    36,
    C.muted,
  );
  api.text(ctx, 'Loss', 1140, 356, 38, C.ink, 'center');
  for (const [i, trial] of HELD_OUT_TRIALS.entries()) {
    const y = 506 + i * 221;
    api.text(ctx, trial.name, 180, y - 4, 44, C.ink);
    api.text(ctx, 'rate ' + trial.rate, 180, y + 51, 31, C.muted);
    api.line(ctx, x(0), y, x(0.4), y, C.muted, 3);
    for (const tick of [0, 0.2, 0.4]) {
      api.line(ctx, x(tick), y - 8, x(tick), y + 8, C.muted, 3);
      api.text(ctx, fmt(tick), x(tick), y + 50, 28, C.muted, 'center');
    }
    for (const [kind, value, progress, color] of [
      ['Training', trial.train, train, C.cyan],
      ['Held-out', trial.held, held, C.yellow],
    ]) {
      api.focus.target(kind === 'Training' ? 'trial-train' : 'trial-held', () => {
        if (progress > 0) {
          const point = x(value);
          const rise = (1 - progress) * 36;
          api.circle(ctx, point, y - rise, 10, kind === 'Training' ? C.bg : color, color, 3);
          if (progress === 1)
            api.text(ctx, kind + '  ' + fmt(value), point, y - 41, 32, color, 'center');
        }
      });
    }
  }
  api.focus.target('diagnostic-validation', () =>
    api.text(
      ctx,
      held === 1
        ? 'Select by held-out loss at the agreed budget.'
        : 'Which recipe would you keep for new data?',
      960,
      968,
      43,
      C.ink,
      'center',
    ),
  );
}

export function drawDiagnosticTrace(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  if (beat < 2) return traceComparison(ctx, state, api);
  if (beat === 2) return heldOut(ctx, state, api);
  const { C } = api;
  api.text(ctx, 'Observation', 180, 282, 36, C.muted);
  api.text(ctx, 'What to measure next', 895, 282, 36, C.muted);
  for (const [i, [id, symptom, measurement]] of [
    ['diagnostic-data', 'A batch goes nonfinite', 'Batch contents, gradient norm, AMP scale'],
    ['diagnostic-groups', 'One group barely moves', 'Update norms and gradient scales by group'],
    ['diagnostic-frequency', 'Clipping fires on most updates', 'Pre-clipping norms across batches'],
    [
      'diagnostic-bytes',
      'Training runs out of memory',
      'Optimizer-state bytes and activation peaks',
    ],
  ].entries()) {
    const y = 424 + i * 151;
    api.focus.target(id, () => {
      api.text(ctx, symptom, 180, y, 38, C.ink);
      const p = cueProgress(state, id, 3, 0.02 + i * 0.24, 0.17 + i * 0.24);
      if (p > 0) api.arrow(ctx, 760, y - 13, 760 + 91 * p, y - 13, C.yellow, 4);
      if (p === 1) api.text(ctx, measurement, 895, y, 35, C.cyan);
    });
  }
}
export default {
  id: 'diagnostic-trace',
  draw: drawDiagnosticTrace,
  cues: [
    'diagnostic-boundary',
    'diagnostic-measure',
    'diagnostic-compare',
    'diagnostic-record',
    'trial-train',
    'trial-held',
    'diagnostic-validation',
    'diagnostic-data',
    'diagnostic-groups',
    'diagnostic-frequency',
    'diagnostic-bytes',
  ],
};
