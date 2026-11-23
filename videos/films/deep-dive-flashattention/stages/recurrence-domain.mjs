import { afterCue, cueMotion, sampleModel } from '../construction.mjs';
import { values } from '../fixtures.mjs';

export function drawRecurrenceDomain(ctx, scene, state, api) {
  const { C, focus } = api;
  const label = (v, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, v, x, y, size, color, align);
  if (state.beat === 0) {
    focus.target('recurrence-rule', () => {
      label('Start each query', 160, 290, 38, C.yellow);
      api.math(ctx, String.raw`m=-\infty,\quad \ell=0,\quad u=[0,0]`, 160, 382, 50, C.ink, 'left');
      const steps = [
        ['New maximum', String.raw`m'=\max(m,\max_j s_j)`],
        ['Old scale and new weights', String.raw`\alpha=e^{m-m'},\quad w_j=e^{s_j-m'}`],
        ['Weight sum', String.raw`\ell'=\alpha\ell+\sum_j w_j`],
        ['Value sum', String.raw`u'=\alpha u+\sum_j w_j V_j`],
      ];
      const p = cueMotion(state, 0, 'recurrence-steps');
      steps.forEach(([name, equation], i) => {
        const color = i <= p * 3 ? C.cyan : C.muted;
        const y = 518 + i * 129;
        label(name, 160, y, 37, color);
        api.math(ctx, equation, 812, y, 46, color, 'left');
      });
    });
    return;
  }
  if (state.beat === 3) {
    focus.target('recurrence-empty', () => {
      label('Allowed keys per tile', 155, 315, 38);
      const examples = [
        [0, 2],
        [0, 0],
      ];
      examples.forEach((counts, i) => {
        const y = 430 + i * 235;
        label('Row ' + i, 155, y + 70, 41);
        counts.forEach((n, j) => {
          const x = 505 + j * 300;
          api.rect(ctx, x, y, 232, 113, C.panel, n ? C.cyan : C.muted, 5);
          label(n + ' keys', x + 116, y + 72, 38, n ? C.cyan : C.muted, 'center');
        });
        const message =
          i === 0 ? 'Skip first tile. Use the second.' : 'Both tiles empty. Return zero.';
        const ready = afterCue(state, 3, i ? 'recurrence-zero' : 'recurrence-skip');
        label(ready ? message : 'Output?', 1130, y + 70, 38, ready ? C.green : C.yellow);
      });
    });
    return;
  }
  const { exact, wrong, ready } = sampleModel(scene.id, state);
  const repair = cueMotion(state, 2, 'recurrence-fix');
  const observed = afterCue(state, 2, 'recurrence-wrong');
  const point = wrong.map((v, d) => v + repair * (exact.output[d] - v));
  const left = 237,
    bottom = 870,
    scale = 52;
  const px = (v) => left + v * scale;
  const py = (v) => bottom - v * scale;
  focus.target('recurrence-plane', () => {
    api.line(ctx, left, py(11), left, bottom, C.muted, 3);
    api.line(ctx, left, bottom, px(11), bottom, C.muted, 3);
    label('y', left - 52, py(10.7), 35, C.muted);
    label('x', px(11.4), bottom + 13, 35, C.muted);
    for (const n of [0, 5, 10]) {
      label(n, px(n), bottom + 51, 31, C.muted, 'center');
      if (n) label(n, left - 26, py(n) + 11, 31, C.muted, 'right');
    }
    api.line(ctx, px(0), py(10), px(10), py(0), C.blue, 4);
    values.forEach(([x, y]) => api.circle(ctx, px(x), py(y), 9, C.blue));
    if (observed) {
      api.circle(ctx, px(wrong[0]), py(wrong[1]), 14, 'transparent', C.pink, 3);
      api.circle(ctx, px(point[0]), py(point[1]), 11, repair === 1 ? C.green : C.pink);
    }
  });
  focus.target('recurrence-readout', () => {
    label('Each input value', 1030, 340, 37, C.blue);
    label('x + y = 10', 1030, 448, 73);
    label('Same denominator   ℓ ≈ ' + exact.l.toFixed(4), 1030, 588, 37);
    if (observed) {
      label('Old numerator left unscaled', 1030, 684, 33, C.pink);
      label('[' + wrong.map((v) => v.toFixed(3)).join(', ') + ']', 1030, 757, 48, C.pink);
    }
    if (ready) {
      label('Both sums rescaled', 1030, 859, 33, C.green);
      label('[' + exact.output.map((v) => v.toFixed(3)).join(', ') + ']', 1030, 936, 48, C.green);
    }
  });
}

export default {
  id: 'recurrence-domain',
  draw: drawRecurrenceDomain,
  cues: [
    'recurrence-steps',
    'recurrence-line',
    'recurrence-wrong',
    'recurrence-fix',
    'recurrence-result',
    'recurrence-skip',
    'recurrence-zero',
  ],
};
