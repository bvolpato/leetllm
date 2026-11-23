import { clamp, complete } from '../arithmetic.mjs';
import { A } from '../fixtures.mjs';
import { event } from '../construction.mjs';
import { strengthFrame } from '../model.mjs';
import { caption, equation, ring, target, text } from '../defaults.mjs';
export function drawCommonOutput(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const colors = [themeColors.blue, themeColors.pink, themeColors.green];
  const f = (v, n = 2) => (Math.abs(v) < 0.5 * 10 ** -n ? 0 : v).toFixed(n);
  const matrix = (values, x, y, cell = 88, color = themeColors.cyan) =>
    api.components.matrix({
      values,
      x,
      y,
      cellSize: cell,
      gap: 8,
      format: (v) => (typeof v === 'number' ? Number(f(v, 3)).toString() : v),
      style: {
        fill: themeColors.panel,
        stroke: color,
        textColor: color,
        fontSize: 34,
        padding: 8,
      },
    });
  {
    const selected = 0,
      cueId = selected ? 'contrast-scores' : 'common-scores',
      p = selected
        ? (2 * event(state, 0, cueId) + event(state, 0, 'contrast-joint')) / 3
        : event(state, 0, cueId),
      jointReady = !selected || complete(event(state, 0, 'contrast-joint')),
      model = strengthFrame({
        beat: selected,
        cues: {
          [cueId]: {
            phase: p === 1 ? 'after' : 'during',
            progress: p,
          },
        },
      }),
      count = Math.min(3, Math.floor(3 * p)),
      active = Math.min(2, count),
      color = selected ? themeColors.pink : themeColors.cyan;
    text(ctx, api, 'the original table', 360, 290, 30, themeColors.muted, 'center');
    matrix(A, 250, 345, 88, themeColors.blue);
    const q = api.teaching.axes({
      x: 700,
      y: 350,
      width: 1050,
      height: 400,
      xDomain: [-0.5, 2.5],
      yDomain: [-1.1, 1.7],
      xTicks: [0, 1, 2],
      yTicks: [-1, 0, 1],
      xLabel: '',
      yLabel: 'signed score',
      fontSize: 28,
    });
    target(ctx, api, cueId, () =>
      model.scores[selected].forEach((v, i) => {
        const a = q.point(i, 0),
          z = q.point(i, v * clamp(3 * p - i));
        if (i !== 2 || jointReady) api.line(ctx, a.x, a.y, z.x, z.y, colors[i], 15);
        if (p > i / 3 && (i !== 2 || jointReady)) {
          ring(ctx, api, z, colors[i], 8);
          text(
            ctx,
            api,
            f(v * clamp(3 * p - i), 3),
            z.x,
            Math.min(a.y, z.y) - 25,
            35,
            colors[i],
            'center',
          );
        } else text(ctx, api, '?', z.x, z.y - 30, 36, colors[i], 'center');
      }),
    );
    const unit = selected
      ? ['-\\frac1{\\sqrt2}', '\\frac1{\\sqrt2}']
      : ['\\frac1{\\sqrt2}', '\\frac1{\\sqrt2}'];
    const energy = event(state, 0, selected ? 'contrast-length' : 'common-energy');
    if (!selected && energy > 0) {
      api.line(ctx, 440, 887, 1430, 887, themeColors.muted, 3);
      api.line(ctx, 440, 812, 440, 897, themeColors.muted, 3);
    }
    if (energy === 0)
      equation(
        ctx,
        api,
        't_' +
          active +
          ':\\quad' +
          A[active].map((v, j) => `${v}\\times${unit[j]}`).join('+') +
          '=' +
          (count > active ? f(model.scores[selected][active], 3) : '?'),
        960,
        855,
        46,
        color,
      );
    target(ctx, api, selected ? 'contrast-strength' : 'common-strength', () => {
      if (energy > 0) {
        let x = 440;
        model.squaredTerms[selected].forEach((value, i) => {
          const width = value * 330,
            built = width * clamp(3 * energy - i);
          if (built > 0) api.rect(ctx, x, 820, built, 65, colors[i], colors[i], 1, 0);
          if (complete(clamp(3 * energy - i)) && value > 0)
            text(
              ctx,
              api,
              i === 2 ? '2' : '½',
              x + width / 2,
              865,
              31,
              themeColors.panel,
              'center',
            );
          x += width;
        });
        if (complete(energy))
          equation(
            ctx,
            api,
            selected
              ? '\\lVert Av_2\\rVert^2=1,\\quad\\sigma_2=1'
              : '\\lVert Av_1\\rVert^2=3,\\quad\\sigma_1=\\sqrt3',
            960,
            945,
            44,
            color,
          );
      } else
        text(
          ctx,
          api,
          'one unit input → three ticket scores',
          960,
          945,
          32,
          themeColors.muted,
          'center',
        );
    });
    caption(
      ctx,
      api,
      selected
        ? jointReady
          ? 'The joint row cancels · output length is the square root of squared length'
          : 'Use the two single-issue scores to predict the joint row'
        : 'The joint row reinforces both signals',
    );
  }
}
export default {
  id: 'common-output',
  draw: drawCommonOutput,
  cues: ['common-scores', 'common-energy'],
};
