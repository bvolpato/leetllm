import { ANGLES, TAU } from '../fixtures.mjs';
import { evaluate, formatValue, steps, vector } from '../arithmetic.mjs';
import { drawNote, drawPill, drawRectangle, drawText } from '../defaults.mjs';
export function drawTransfer(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-transfer-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after';
  api.focus.target('transfer-mechanism', () => {
    const relabel = currentBeat > 1 || (currentBeat === 1 && resultComplete('label')),
      a = steps().at(-1),
      r = evaluate(a),
      mass = r.probs[0] + r.probs[1],
      repaired = relabel && resultComplete('repair'),
      grad = repaired ? (r.probs[1] - r.probs[1] / mass) / TAU : r.probs[1] / TAU,
      plot = teaching.axes({
        x: 260,
        y: 365,
        width: 600,
        height: 500,
        xDomain: [-1.25, 1.25],
        yDomain: [-1.25, 1.25],
        xTicks: [-1, 0, 1],
        yTicks: [-1, 0, 1],
        equalUnits: true,
        fontSize: 25,
      }),
      o = plot.point(0, 0);
    drawText(
      ctx,
      api,
      'Keep every vector fixed · change the verified label',
      960,
      290,
      34,
      themeColors.yellow,
    );
    teaching.curve({
      plot,
      points: Array.from(
        {
          length: 81,
        },
        (_, i) => ({
          x: Math.cos((i / 80) * Math.PI * 2),
          y: Math.sin((i / 80) * Math.PI * 2),
        }),
      ),
      color: themeColors.border,
      width: 2,
    });
    [...ANGLES, a].forEach((angle, i) => {
      const xy = plot.point(...vector(angle)),
        col =
          i === 3
            ? themeColors.yellow
            : i === 0 || (i === 1 && relabel)
              ? themeColors.green
              : i === 1
                ? themeColors.pink
                : themeColors.blue;
      api.focus.target('candidate-vector-' + i, () =>
        api.arrow(ctx, o.x, o.y, xy.x, xy.y, col, i === 3 ? 5 : 3),
      );
    });
    ['a puppy runs', relabel ? 'a dog is running' : 'a dog sleeps', 'the sky is blue'].forEach(
      (v, i) =>
        api.focus.target('relevance-label-' + i, () =>
          drawPill(
            ctx,
            api,
            v,
            1400,
            430 + i * 155,
            680,
            i === 0 || (i === 1 && relabel)
              ? themeColors.green
              : i === 1
                ? themeColors.pink
                : themeColors.blue,
          ),
        ),
    );
    api.focus.target('old-negative-gradient', () =>
      drawRectangle(ctx, api, 1070, 830, 660, 100, themeColors.panel),
    );
    if (relabel) {
      drawText(
        ctx,
        api,
        'Second-score gradient ' +
          (grad >= 0 ? '+' : '') +
          (grad < 0 && Math.abs(grad) < 0.00005 ? grad.toExponential(2) : formatValue(grad, 4)),
        1400,
        895,
        32,
        grad > 0 ? themeColors.pink : themeColors.green,
      );
      drawText(
        ctx,
        api,
        repaired ? 'Repair respects both verified labels' : 'Old labels lower a verified match',
        960,
        970,
        32,
        grad > 0 ? themeColors.pink : themeColors.green,
      );
    }
    drawNote(ctx, api, 'Controlled label intervention · fixed vectors,no new encoder training');
  });
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'transfer-candidate-vector-1-b1-1',
    'transfer-relevance-label-1-b2-1',
    'transfer-old-negative-gradient-b2-2',
    'cl-transfer-label',
    'cl-transfer-repair',
    'transfer-candidate-vector-3-b3-1',
  ],
};
