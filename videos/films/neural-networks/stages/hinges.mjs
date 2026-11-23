import { forward } from '../arithmetic.mjs';
import { lampState, neuralFrame } from '../construction.mjs';
import { axes, curve, dot, focusTarget, text } from '../defaults.mjs';

export function drawHinges(ctx, scene, state, api) {
  const { C } = api;
  const f = neuralFrame(state);
  const s = lampState(state);
  const halfway = f.beat >= 3;
  const total = halfway ? 1 : f.beat === 0 ? s.total : 2;
  const values = forward([total / 2, total / 2]);
  const subtract = 2 * s.combine;
  const guessing = halfway && !f.completed('halfway-answer', 4);
  const plot = axes(ctx, api, {
    x: 270,
    y: 395,
    width: 980,
    height: 425,
    xDomain: [-0.1, 2.12],
    yDomain: [-0.15, 2.16],
    xTicks: [0, 1, 2],
    yTicks: [0, 1, 2],
    xLabel: 'number of switches on, A + B',
    yLabel: 'response',
  });
  text(
    ctx,
    api,
    halfway ? 'Two dimmers, each set halfway' : 'Count how many switches are on',
    960,
    255,
    38,
    C.ink,
    'center',
  );

  focusTarget(ctx, api, 'count-hinge', () => {
    curve(ctx, api, plot, (x) => Math.max(0, x), 0, 2, C.cyan, f.beat === 0 ? total / 2 : 1);
    text(ctx, api, 'First hinge', 1390, 402, 33, C.cyan);
    text(ctx, api, 'ReLU(s)', 1390, 471, 47, C.cyan);
    if (f.beat === 0) {
      const q = plot.point(total, values.h[0]);
      dot(ctx, api, q.x, q.y, C.cyan, 13);
    }
  });
  focusTarget(ctx, api, 'threshold-hinge', () => {
    if (!f.shown('second-hinge', 1)) return;
    curve(ctx, api, plot, (x) => Math.max(0, x - 1), 0, 2, C.blue, s.second);
    text(ctx, api, 'Second hinge', 1390, 568, 33, C.blue);
    text(ctx, api, 'ReLU(s − 1)', 1390, 637, 47, C.blue);
  });
  focusTarget(ctx, api, 'lamp-combination', () => {
    if (f.beat < 2) return;
    const response = (x) => Math.max(0, x) - subtract * Math.max(0, x - 1);
    curve(ctx, api, plot, response, 0, 2, C.yellow);
    if (!guessing) {
      const q = plot.point(total, response(total));
      dot(ctx, api, q.x, q.y, C.yellow, 15);
    }
    text(ctx, api, 'Lamp', 1390, 734, 33, C.yellow);
    text(ctx, api, 'h₁ − ' + Number(subtract.toFixed(2)) + 'h₂', 1390, 806, 49, C.yellow);
  });
  focusTarget(ctx, api, 'halfway-result', () => {
    if (halfway) {
      text(
        ctx,
        api,
        guessing
          ? 'A = 0.5      B = 0.5      Lamp = ?'
          : 's = 1      h₁ = 1      h₂ = 0      Lamp = 1',
        960,
        970,
        42,
        guessing ? C.ink : C.yellow,
        'center',
      );
    } else if (f.beat === 2 && s.combine === 1) {
      text(ctx, api, 'Both on     •     2 − 2 × 1 = 0', 960, 970, 42, C.yellow, 'center');
    } else {
      text(
        ctx,
        api,
        'Both off: 0      Either alone: 1      Both on: 2',
        960,
        970,
        36,
        C.ink,
        'center',
      );
    }
  });
}

export default {
  id: 'hinges',
  draw: drawHinges,
  cues: ['lamp-sweep', 'second-hinge', 'lamp-subtract', 'halfway-answer'],
};
