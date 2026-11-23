import { sampleModel } from '../model.mjs';
import { equation, text } from '../defaults.mjs';
export function drawTolerance(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    modelState = sampleModel('tolerance', state),
    currentBeat = modelState.step;
  {
    api.focus.target('tolerance-math-y-r-leq-a-tol-r-tol-r', () =>
      equation(ctx, api, themeColors, String.raw`|y-r|\leq a_{tol}+r_{tol}|r|`, 960, 330, 62),
    );
    text(
      ctx,
      api,
      themeColors,
      'Absolute tolerance = 2 × 10⁻⁶ · relative tolerance = 2 × 10⁻⁵',
      960,
      395,
      28,
      themeColors.muted,
      'center',
    );
    const plot = api.focus.target('tolerance-absolute-error', () =>
      teaching.axes({
        x: 250,
        y: 460,
        width: 1350,
        height: 290,
        xDomain: [0, 6e-6],
        yDomain: [0, 1],
        xTicks: [0, 2e-6, 4e-6, 6e-6],
        yTicks: [],
        xLabel: 'absolute error',
        fontSize: 27,
      }),
    );
    const a = plot.point(modelState.allowed, 0),
      e = plot.point(modelState.error, 0.5);
    api.line(ctx, a.x, 430, a.x, 750, themeColors.yellow, 4);
    api.circle(ctx, e.x, e.y, 15, modelState.pass ? themeColors.green : themeColors.pink);
    api.focus.target('tolerance-reference-s-reference-tofixed-5', () =>
      text(
        ctx,
        api,
        themeColors,
        'Reference ' + modelState.reference.toFixed(5),
        250,
        860,
        34,
        themeColors.blue,
      ),
    );
    text(
      ctx,
      api,
      themeColors,
      modelState.pass ? 'ACCEPT WITHIN CONTRACT' : 'FAILS CONTRACT',
      1570,
      860,
      34,
      modelState.pass ? themeColors.green : themeColors.pink,
      'right',
    );
    api.focus.target(
      'tolerance-error-s-error-toexponential-2-allowance-s-allowed-toexponential-2',
      () =>
        text(
          ctx,
          api,
          themeColors,
          'Error ' +
            modelState.error.toExponential(2) +
            ' · allowance ' +
            modelState.allowed.toExponential(2),
          960,
          975,
          30,
          themeColors.muted,
          'center',
        ),
    );
  }
}
export default {
  id: 'tolerance',
  draw: drawTolerance,
  cues: [
    'tolerance-beat-1-focus-1',
    'tolerance-beat-1-focus-2',
    'tolerance-beat-2-focus-1',
    'tolerance-beat-2-focus-2',
  ],
};
