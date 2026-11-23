import { shaping } from '../arithmetic.mjs';
import { sampleModel, shapingSnapshot } from '../model.mjs';
import { drawOriginalResearchCorridor, drawOriginalResearchText } from '../defaults.mjs';
export function drawShaping(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel(state);
  {
    const current = shapingSnapshot(state.beat ?? 0, state.beatP ?? 0);
    api.focus.target('shaping-agent', () =>
      drawOriginalResearchCorridor(ctx, api, 355, current.position, themeColors.cyan),
    );
    drawOriginalResearchText(ctx, api, current.label, 960, 305, 31, themeColors.cyan, 'center');
    const values = [shaping(0, 1), shaping(1, 0), shaping(0, 0)].slice(0, current.completed);
    const plot = teaching.axes({
      x: 360,
      y: 580,
      width: 1180,
      height: 180,
      xDomain: [-0.2, 2.2],
      yDomain: [-0.15, 0.25],
      xTicks: [0, 1, 2],
      yTicks: [-0.1, 0, 0.2],
      xLabel: 'Forward · reverse · stationary transition',
      yLabel: 'shaping signal',
      fontSize: 26,
    });
    api.focus.target('transition-shaping-signals', () =>
      teaching.scatter({
        plot,
        points: values.map((y, x) => ({
          x,
          y,
          color: y < 0 ? themeColors.pink : themeColors.green,
          radius: 13,
        })),
      }),
    );
    api.focus.target('potential-difference-rule', () =>
      api.math(
        ctx,
        String.raw`F(s,s')=\gamma\Phi(s')-\Phi(s)\qquad\Phi(s)=-\frac{6-s}{6}`,
        960,
        950,
        41,
        themeColors.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'shaping',
  draw: drawShaping,
  cues: ['shaping-potential-difference-rule-b1-1', 'shaping-transition-shaping-signals-b2-1'],
};
