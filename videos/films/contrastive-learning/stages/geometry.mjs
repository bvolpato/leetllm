import { ANGLES, START } from '../fixtures.mjs';
import { evaluate, steps, vector } from '../arithmetic.mjs';
import { originalCircle, originalText } from '../defaults.mjs';
export function drawGeometry(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  evaluate();
  const colors = [themeColors.green, themeColors.pink, themeColors.blue];
  {
    const path = steps(),
      i = Math.min(29, Math.floor(((currentBeat + progress) / 3) * 30)),
      a = api.lerp(path[i], path[i + 1], ((currentBeat + progress) / 3) * 30 - i),
      v = evaluate(a);
    const plot = originalCircle(ctx, api, colors, a),
      origin = plot.point(0, 0),
      initial = plot.point(...vector(START));
    api.path(ctx, [origin, initial], {
      color: themeColors.muted,
      width: 2,
    });
    api.circle(ctx, initial.x, initial.y, 9, themeColors.bg, themeColors.muted, 2);
    originalText(ctx, api, 'initial anchor', initial.x + 35, initial.y - 25, 24, themeColors.muted);
    teaching.curve({
      plot,
      points: Array.from(
        {
          length: 61,
        },
        (_, j) => {
          const angle = START + ((a - START) * j) / 60;
          return {
            x: 1.09 * Math.cos(angle),
            y: 1.09 * Math.sin(angle),
          };
        },
      ),
      color: themeColors.yellow,
      width: 3,
    });
    ANGLES.forEach((angle, j) => {
      const at = plot.point(...vector(angle));
      const labelX = j === 0 ? 1000 : j === 1 ? at.x : 220;
      const labelY = j === 1 ? at.y - 40 : at.y + 8;
      originalText(
        ctx,
        api,
        j === 0 ? 'positive · puppy runs' : j === 1 ? 'dog sleeps' : 'sky is blue',
        labelX,
        labelY,
        23,
        colors[j],
        'center',
      );
    });
    const anchor = plot.point(...vector(a));
    if (Math.abs(v.gradient) > 0.01) {
      const sign = -Math.sign(v.gradient);
      api.arrow(
        ctx,
        anchor.x,
        anchor.y,
        anchor.x - Math.sin(a) * sign * 55,
        anchor.y - Math.cos(a) * sign * 55,
        themeColors.yellow,
        3,
      );
    }
    originalText(
      ctx,
      api,
      'Gradient steps on the unit circle',
      1410,
      350,
      34,
      themeColors.ink,
      'center',
    );
    api.focus.target('trained-positive-probability', () =>
      originalText(
        ctx,
        api,
        `positive probability: ${v.probs[0].toFixed(3)}`,
        1410,
        560,
        34,
        themeColors.green,
        'center',
      ),
    );
    api.focus.target('trained-contrastive-loss', () =>
      originalText(
        ctx,
        api,
        `loss: ${v.loss.toFixed(3)}`,
        1410,
        730,
        38,
        themeColors.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'geometry',
  draw: drawGeometry,
  cues: [
    'geometry-candidate-vector-3-b1-1',
    'geometry-trained-positive-probability-b2-1',
    'geometry-candidate-vector-0-b3-1',
  ],
};
