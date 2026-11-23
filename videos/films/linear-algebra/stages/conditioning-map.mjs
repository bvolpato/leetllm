import { complete } from '../arithmetic.mjs';
import { event } from '../construction.mjs';
import { caption, curve, equation, plane, target } from '../defaults.mjs';
export function drawConditioningMap(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const circle = (plot, scale, color, width = 3) =>
    curve(
      ctx,
      api,
      plot,
      Array.from(
        {
          length: 121,
        },
        (_, i) => {
          const a = (i / 120) * Math.PI * 2;
          return [Math.cos(a) * scale[0], Math.sin(a) * scale[1]];
        },
      ),
      color,
      width,
    );
  {
    const p = event(state, 0, 'condition-map'),
      scale = 1 - 0.99 * p,
      q = plane(ctx, api, [-2.5, 2.5, -1.4, 1.4], 180, 315, 1560, 535, '', '');
    circle(q, [1, 1], '#8d9cb955', 2);
    target(ctx, api, 'condition-map', () => circle(q, [1, scale], themeColors.cyan, 6));
    equation(ctx, api, 'C=\\operatorname{diag}(1,0.01)', 960, 265, 43, themeColors.ink);
    target(ctx, api, 'condition-number', () =>
      equation(
        ctx,
        api,
        complete(p)
          ? '\\kappa_2(C)=\\frac{1}{0.01}=100'
          : '\\kappa_2(C)=\\sigma_{max}/\\sigma_{min}',
        960,
        950,
        46,
        themeColors.cyan,
      ),
    );
    caption(ctx, api, 'Keep the map fixed after compression · the next step reverses it');
  }
}
export default {
  id: 'conditioning-map',
  draw: drawConditioningMap,
  cues: ['condition-map', 'condition-number'],
};
