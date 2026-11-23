import { after, pathScreen, samples, started } from '../decisions.mjs';

export function drawPath(ctx, scene, state, api) {
  const { C } = api;
  const label = (v, x, y, size, color, align = 'left') =>
    api.text(ctx, v, x, y, size, color, align);
  const x = (alpha) => 245 + 930 * alpha;
  const y = (loss) => 785 - loss * 680;
  const lower = started(state, 'low-path');
  const quarter = started(state, 'quarter-position') && !lower;
  const probeIndex = quarter ? (started(state, 'three-quarter') ? 3 : 1) : 2;
  const probe = samples[probeIndex];
  const shown = [
    true,
    after(state, 'quarter-data'),
    after(state, 'midpoint-data'),
    after(state, 'three-quarter'),
    true,
  ];
  const lowerReady = after(state, 'low-midpoint');
  const tested = lower ? lowerReady : shown[probeIndex];
  const revealed = shown.every(Boolean);
  label('Held-out loss', 175, 282, 36, C.ink);
  api.line(ctx, x(0), y(0), x(1), y(0), C.muted, 3);
  api.line(ctx, x(0), y(0), x(0), y(0.7), C.muted, 3);
  for (const value of [0, 0.3, 0.6])
    label(value.toFixed(1), x(0) - 25, y(value) + 10, 29, C.muted, 'right');
  api.focus.target('rule', () => {
    api.line(ctx, x(0), y(pathScreen.maxLoss), x(1), y(pathScreen.maxLoss), C.yellow, 3);
    label('Loss ≤ 0.30     Accuracy ≥ 84%', 175, 988, 36, C.yellow);
  });
  const chord = (alpha) => samples[0].loss * (1 - alpha) + samples[4].loss * alpha;
  for (let i = 0; i < 31; i++) {
    const a = i / 31,
      b = (i + 0.42) / 31;
    api.line(ctx, x(a), y(chord(a)), x(b), y(chord(b)), C.muted, 2);
  }
  samples.forEach(({ alpha }, i) => {
    api.line(ctx, x(alpha), y(0), x(alpha), y(0) + 12, C.muted, 2);
    label(['Code', '25%', '50%', '75%', 'Math'][i], x(alpha), 848, 33, C.muted, 'center');
  });
  label('Share of Math weights', 710, 913, 32, C.muted, 'center');
  api.focus.target('path-samples', () => {
    for (const [i, p] of samples.entries()) {
      if (revealed && i)
        api.line(
          ctx,
          x(samples[i - 1].alpha),
          y(samples[i - 1].loss),
          x(p.alpha),
          y(p.loss),
          C.pink,
          3,
        );
      if (shown[i]) api.circle(ctx, x(p.alpha), y(p.loss), 12, C.pink);
      if (lowerReady) {
        if (i)
          api.line(
            ctx,
            x(samples[i - 1].alpha),
            y(samples[i - 1].low),
            x(p.alpha),
            y(p.low),
            C.cyan,
            4,
          );
        api.circle(ctx, x(p.alpha), y(p.low), 7, C.cyan);
      }
    }
  });
  if (state.beat === 0) {
    label('0.18  ·  88%', x(0) + 20, y(0.18) - 28, 31, C.pink);
    label('0.19  ·  89%', x(1) - 12, y(0.19) - 28, 31, C.pink, 'right');
  }
  api.focus.target('sample', () => {
    const alpha = probe.alpha;
    api.circle(ctx, x(alpha), y(0), 9, C.yellow);
    label(
      (lower ? 'Second path' : 'Checkpoint') + ' at ' + alpha * 100 + '%',
      1290,
      330,
      40,
      C.ink,
    );
    label('Loss', 1290, 455, 33, C.muted);
    label(
      tested ? (lower ? probe.low : probe.loss).toFixed(2) : '?',
      1690,
      462,
      55,
      lower ? C.cyan : C.pink,
      'right',
    );
    label('Accuracy', 1290, 555, 33, C.muted);
    label(
      lower ? 'untested' : tested ? probe.score + '%' : '?',
      1690,
      563,
      lower ? 34 : 55,
      C.ink,
      'right',
    );
    if (
      !lower &&
      tested &&
      (quarter ? after(state, 'quarter-call') : after(state, 'midpoint-data'))
    ) {
      label(
        probe.pass ? 'Keep for testing' : 'Fails both limits',
        1290,
        676,
        40,
        probe.pass ? C.green : C.red,
      );
    }
    if (lowerReady) label('Same endpoints', 1290, 676, 36, C.cyan);
  });
  api.focus.target('barrier', () => {
    if (started(state, 'midpoint-barrier') && !quarter && !lower) {
      const mid = samples[2];
      api.line(ctx, x(mid.alpha), y(mid.chord), x(mid.alpha), y(mid.loss), C.muted, 3);
      label(mid.loss.toFixed(3) + ' − ' + mid.chord.toFixed(3), 1290, 790, 34, C.muted);
      if (after(state, 'midpoint-barrier'))
        label('= ' + mid.barrier.toFixed(3) + ' above chord', 1290, 853, 34, C.ink);
    }
  });
}
export default {
  id: 'path',
  draw: drawPath,
  cues: [
    'path-rule',
    'path-half',
    'midpoint-data',
    'midpoint-barrier',
    'quarter-position',
    'quarter-data',
    'quarter-call',
    'three-quarter',
    'low-path',
    'low-midpoint',
  ],
};
