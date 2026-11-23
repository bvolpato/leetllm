import { sampleModel } from '../model.mjs';
import { auditFocusApi, equation, text, visualFocus } from '../defaults.mjs';
export function drawUncertainty(ctx, scene, state, api) {
  api = auditFocusApi(api, scene);
  const { C: themeColors, teaching: teaching } = api;
  const modelState = sampleModel('uncertainty', state),
    currentBeat = modelState.step,
    progress = modelState.p;
  {
    const axes = teaching.axes({
      x: 200,
      y: 350,
      width: 920,
      height: 420,
      xDomain: [0, 1],
      yDomain: [0, 1],
      xTicks: [0, 0.4, 0.8, 1],
      yTicks: [0, 0.5, 1],
      xLabel: 'assumed case success probability',
      yLabel: 'chance of a perfect sample',
      fontSize: 27,
    });
    const curve = (n) =>
      Array.from(
        {
          length: 201,
        },
        (_, i) => ({
          x: i / 200,
          y: (i / 200) ** n,
        }),
      );
    if (currentBeat > 0)
      teaching.curve({
        plot: axes,
        points: curve(3),
        color: '#8d9cb966',
        width: 3,
      });
    teaching.curve({
      plot: axes,
      points: curve(modelState.n),
      color: currentBeat === 0 ? themeColors.cyan : themeColors.pink,
      width: 5,
      progress: currentBeat > 1 ? 1 : progress,
    });
    const point = axes.point(modelState.trueRate, modelState.allPass);
    api.line(ctx, point.x, 350, point.x, 770, themeColors.yellow, 2);
    visualFocus(ctx, api, 'uncertainty-object-point-x-point-y-9-c-yellow-32', () =>
      api.circle(ctx, point.x, point.y, 9, themeColors.yellow),
    );
    text(ctx, api, 'Assumed rate stays at 80%', 660, 940, 30, themeColors.yellow, 'center');
    text(ctx, api, `${modelState.n} independent cases`, 1500, 350, 34, themeColors.ink, 'center');
    teaching.grid({
      x: 1260,
      y: 430,
      width: 480,
      height: modelState.n === 3 ? 110 : 220,
      rows: modelState.n === 3 ? 1 : 3,
      columns: modelState.n === 3 ? 3 : 10,
      fill: '#8cdeb538',
      stroke: themeColors.green,
      lineWidth: 2,
    });
    visualFocus(ctx, api, 'uncertainty-equation-string-raw-p-text-all-pass-0-8-s-n-35', () =>
      equation(
        ctx,
        api,
        String.raw`P(\text{all pass})=0.8^{${modelState.n}}`,
        1500,
        750,
        37,
        themeColors.green,
      ),
    );
    text(
      ctx,
      api,
      `${(modelState.allPass * 100).toFixed(modelState.n === 3 ? 1 : 3)}%`,
      1500,
      860,
      62,
      themeColors.green,
      'center',
    );
  }
}
export default {
  id: 'uncertainty',
  draw: drawUncertainty,
  cues: [
    'uncertainty-beat-1-focus-1',
    'uncertainty-beat-1-focus-2',
    'uncertainty-beat-2-focus-1',
    'uncertainty-beat-3-focus-1',
  ],
};
