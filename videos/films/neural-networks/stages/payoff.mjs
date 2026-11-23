import { differenceLamp, forward } from '../arithmetic.mjs';
import { CASES } from '../fixtures.mjs';
import { neuralFrame } from '../construction.mjs';
import { boardPoint, lampBoard } from '../lamp-board.mjs';
import { axes, curve, dot, focusTarget, line, text } from '../defaults.mjs';

const dimmers = [0.8, 0.5];

function sumResponse(ctx, api, f) {
  const { C } = api;
  const d = forward(dimmers);
  const reveal = f.completed('final-lamp-reveal', 1);
  const showHidden = reveal || f.completed('dimmer-hinges', 1);
  focusTarget(ctx, api, 'dimmer-controls', () => {
    for (const [i, max] of dimmers.entries()) {
      const left = 545 + i * 735;
      const value = max * f.progress(i ? 'second-dimmer' : 'final-lamp-probe', 0);
      text(ctx, api, i ? 'Dimmer B' : 'Dimmer A', left - 45, 252, 36, C.ink, 'right');
      line(ctx, api, left, 240, left + 245, 240, C.muted, 4);
      api.rect(ctx, left + 245 * value - 7, 218, 14, 44, C.cyan, null, 4);
      text(ctx, api, value.toFixed(1), left + 286, 252, 40, C.cyan);
    }
  });
  focusTarget(ctx, api, 'final-lamp-function', () => {
    const plot = axes(ctx, api, {
      x: 300,
      y: 380,
      width: 980,
      height: 420,
      xDomain: [-0.1, 2.1],
      yDomain: [-0.1, 1.2],
      xTicks: [0, 1, 2],
      yTicks: [0, 1],
      xLabel: 'sum of the dimmer settings',
      yLabel: 'brightness',
    });
    curve(ctx, api, plot, (s) => forward([s, 0]).y, 0, 2, C.muted);
    if (reveal) {
      const q = plot.point(d.sum, d.y);
      const a = plot.point(d.sum, 0);
      line(ctx, api, a.x, a.y, q.x, q.y, C.yellow, 3);
      dot(ctx, api, q.x, q.y, C.yellow, 15);
    }
  });
  focusTarget(ctx, api, 'final-hidden-values', () => {
    text(
      ctx,
      api,
      'h₁ = ' + (showHidden ? d.h[0].toFixed(1) : '?'),
      1520,
      460,
      49,
      C.cyan,
      'center',
    );
    text(
      ctx,
      api,
      'h₂ = ' + (showHidden ? d.h[1].toFixed(1) : '?'),
      1520,
      610,
      49,
      C.blue,
      'center',
    );
    text(ctx, api, 'lamp = ' + (reveal ? d.y.toFixed(1) : '?'), 1520, 760, 49, C.yellow, 'center');
    text(
      ctx,
      api,
      'Brightness = first hinge − twice the second hinge',
      960,
      970,
      37,
      C.ink,
      'center',
    );
  });
}

export function drawPayoff(ctx, scene, state, api) {
  const { C } = api;
  const f = neuralFrame(state);
  if (f.beat < 2) return sumResponse(ctx, api, f);

  const moved = f.progress('interior-setting', 2);
  const corner = CASES[Math.min(3, Math.floor(4 * f.progress('difference-circuit', 2)))];
  const pair = moved === 0 ? corner : dimmers.map((value) => 1 + (value - 1) * moved);
  const result = f.completed('difference-result', 3);
  focusTarget(ctx, api, 'lamp-cases', () => {
    lampBoard(
      ctx,
      api,
      CASES,
      () => {
        const point = boardPoint(pair);
        api.circle(ctx, point.x, point.y, 47, null, C.cyan, 5);
        const probe = f.progress('final-meaning', 4);
        if (probe > 0) {
          const x = point.x - 130 * (1 - probe);
          const y = point.y - 90 * (1 - probe);
          line(ctx, api, x - 92, y - 66, x - 32, y - 23, C.ink, 19);
          line(ctx, api, x - 32, y - 23, x, y, C.ink, 5);
          if (f.completed('final-meaning', 4))
            text(ctx, api, 'Measure here', x - 115, y - 110, 33, C.ink, 'center');
        }
      },
      'Dimmer',
    );
  });
  focusTarget(ctx, api, 'candidate-readings', () => {
    text(ctx, api, 'At (' + pair.map((v) => v.toFixed(1)).join(', ') + ')', 1110, 315, 42);
    const sum = forward(pair);
    const gap = differenceLamp(pair);
    const measuring = f.beat === 4;
    const readings = [
      [
        'Sum circuit',
        measuring ? sum.h[0].toFixed(1) + ' − 2 × ' + sum.h[1].toFixed(1) : 'h₁ − 2h₂',
        sum.y,
        moved === 0 || moved === 1,
        C.yellow,
      ],
      [
        'Difference circuit',
        measuring
          ? '|' + pair.map((v) => v.toFixed(1)).join(' − ') + '|'
          : 'ReLU(A − B) + ReLU(B − A)',
        gap.y,
        moved === 0 || result,
        C.blue,
      ],
    ];
    for (const [i, [name, formula, value, known, color]] of readings.entries()) {
      const y = 433 + 233 * i;
      text(ctx, api, name, 1110, y, 38, C.ink);
      text(ctx, api, formula, 1110, y + 56, 31, C.muted);
      line(ctx, api, 1110, y + 99, 1550, y + 99, C.muted, 3);
      if (known) {
        line(ctx, api, 1110, y + 99, 1110 + 440 * value, y + 99, color, 12);
        dot(ctx, api, 1110 + 440 * value, y + 99, color, 13);
      }
      text(ctx, api, known ? value.toFixed(1) : '?', 1600, y + 112, 45, known ? color : C.muted);
    }
    text(ctx, api, measuring ? 'New meter reading' : 'Measured lamp', 1110, 919, 35, C.ink);
    text(ctx, api, moved === 0 ? String(forward(corner).y) : '?', 1600, 919, 44, C.ink);
  });
}

export default {
  id: 'payoff',
  draw: drawPayoff,
  cues: [
    'final-lamp-probe',
    'second-dimmer',
    'dimmer-hinges',
    'final-lamp-reveal',
    'difference-circuit',
    'interior-setting',
    'difference-result',
    'final-meaning',
  ],
};
