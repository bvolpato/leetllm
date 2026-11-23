import { sampleModel } from '../construction.mjs';
import { card, text as originalText } from '../defaults.mjs';
export function drawUncertainty(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('uncertainty', state),
    currentBeat = modelState.step;
  {
    originalText(
      ctx,
      api,
      'Observed control 1,181 / 1,943 · treatment 1,325 / 2,057',
      960,
      280,
      33,
      themeColors.ink,
      'center',
    );
    originalText(ctx, api, 'One example user key', 375, 355, 28, themeColors.blue, 'center');
    for (let i = 0; i < modelState.copies; i++)
      api.focus.target('uncertainty-outcome', () =>
        card(
          ctx,
          api,
          `${modelState.example.id} · outcome ${modelState.example.y}`,
          180,
          405 + i * 125,
          390,
          i ? themeColors.pink : themeColors.blue,
          90,
          28,
        ),
      );
    originalText(
      ctx,
      api,
      `Unique users: ${modelState.correct.uniqueUsers.toLocaleString()}`,
      375,
      825,
      30,
      themeColors.green,
      'center',
    );
    originalText(
      ctx,
      api,
      `Telemetry rows: ${modelState.naive.rows.toLocaleString()}`,
      375,
      885,
      29,
      modelState.copies > 1 ? themeColors.pink : themeColors.ink,
      'center',
    );
    const plot = api.focus.target('uncertainty-difference-in-resolution-probability', () =>
      teaching.axes({
        x: 760,
        y: 450,
        width: 930,
        height: 295,
        xDomain: [0, 0.08],
        yDomain: [0, 2.5],
        xTicks: [0, 0.02, 0.04, 0.06, 0.08],
        yTicks: [],
        xLabel: 'difference in resolution probability',
        fontSize: 25,
      }),
    );
    originalText(ctx, api, 'Independent-user analysis', 1225, 410, 29, themeColors.green, 'center');
    const drawInterval = (row, y, color) => {
      const lo = plot.point(row.low, y),
        hi = plot.point(row.high, y),
        mid = plot.point(row.d, y);
      api.line(ctx, lo.x, lo.y, hi.x, hi.y, color, 7);
      for (const point of [lo, hi])
        api.line(ctx, point.x, point.y - 14, point.x, point.y + 14, color, 3);
      api.circle(ctx, mid.x, mid.y, 10, color);
    };
    api.focus.target('uncertainty-user-interval', () =>
      drawInterval(modelState.correct, 1.8, themeColors.green),
    );
    if (currentBeat) {
      api.focus.target('uncertainty-row-interval', () =>
        drawInterval(modelState.naive, 0.55, themeColors.pink),
      );
      originalText(
        ctx,
        api,
        `Incorrect independent-row calculation · ${modelState.copies}× copies`,
        1225,
        865,
        27,
        themeColors.pink,
        'center',
      );
      originalText(
        ctx,
        api,
        `False width ratio ${(modelState.naive.se / modelState.correct.se).toFixed(3)} · point estimate unchanged`,
        1225,
        925,
        27,
        themeColors.yellow,
        'center',
      );
    }
    originalText(
      ctx,
      api,
      modelState.copies === 1
        ? 'One independent outcome per assigned user'
        : `Same keys repeated ${modelState.copies} times · independent-user interval remains fixed`,
      960,
      995,
      29,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'uncertainty',
  draw: drawUncertainty,
  cues: ['uncertainty-beat-1-focus-1', 'uncertainty-beat-2-focus-1'],
};
