import { EXAMPLE } from '../fixtures.mjs';
import { dpoExample } from '../model.mjs';
import { sigmoid } from '../arithmetic.mjs';
import { progress, heard } from '../clock.mjs';

const curve = Array.from({ length: 141 }, (_, i) => {
  const x = -3.5 + i / 20;
  return { x, y: sigmoid(x) };
});

export function drawProbability(ctx, scene, state, api) {
  const { C, teaching } = api;
  const margin =
    dpoExample().margin * progress(state, 'sig-worked', 1) + 4 * progress(state, 'sig-grow', 2);
  const z = EXAMPLE.beta * margin,
    p = sigmoid(z);
  api.focus.target('sig-plot', () => {
    const plot = teaching.axes({
      x: 235,
      y: 340,
      width: 875,
      height: 420,
      xDomain: [-3.5, 3.5],
      yDomain: [0, 1],
      xTicks: [-3, -2, -1, 0, 1, 2, 3],
      yTicks: [0, 0.5, 1],
      fontSize: 32,
    });
    teaching.curve({ plot, points: curve, color: C.blue, width: 5, progress: 1 });
    const origin = plot.point(z, 0),
      at = plot.point(z, p);
    api.line(ctx, origin.x, origin.y, at.x, at.y, C.yellow, 3);
    teaching.scatter({ plot, points: [{ x: z, y: p, radius: 13, color: C.yellow }] });
    api.text(ctx, 'Chance of A winning the vote', 215, 258, 36, C.ink);
    api.text(ctx, 'Scaled margin   βm', 650, 889, 35, C.ink, 'center');
  });
  api.focus.target('sig-two-probs', () => {
    api.text(ctx, 'A wins the comparison', 1220, 365, 34, C.blue);
    api.text(ctx, (p * 100).toFixed(1) + '%', 1220, 474, 80, C.yellow);
    api.text(ctx, 'βm = 0.5 × ' + margin.toFixed(1) + ' = ' + z.toFixed(2), 1220, 575, 36, C.ink);
    if (state.beat === 1 && heard(state, 'sig-generation', 1)) {
      api.text(ctx, 'Policy writes this exact reply', 1220, 725, 33, C.muted);
      api.text(
        ctx,
        'exp(−3.4) ≈ ' + (100 * Math.exp(EXAMPLE.chosen.policy)).toFixed(1) + '%',
        1220,
        817,
        46,
        C.ink,
      );
    }
  });
}

export default {
  id: 'probability',
  draw: drawProbability,
  cues: ['sig-even', 'sig-worked', 'sig-generation', 'sig-grow'],
};
