import { branch } from '../model.mjs';
import { direction } from '../fixtures.mjs';
import { motion } from '../timing.mjs';
import { equation, text } from '../defaults.mjs';
export function drawGradients(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.1, 0.9),
    fade = components.fade;
  {
    const a = motion(state, 'gradients-branch-gradient-vector-b2-1', 1, 0.5, 0.72),
      q = teaching.axes({
        x: 270,
        y: 445,
        width: 900,
        height: 420,
        xDomain: [-3, 3],
        yDomain: [-3, 3],
        equalUnits: true,
        xTicks: [-2, 0, 2],
        yTicks: [-2, 0, 2],
        xLabel: 'probe component 1',
        yLabel: 'probe component 2',
        fontSize: 34,
      }),
      o = q.point(0, 0),
      end = q.point(direction[0] + a * branch[0], direction[1] + a * branch[1]);
    text(ctx, api, 'Example branch   F(z) = −s₀z', 960, 280, 35, themeColors.ink, 'center');
    text(ctx, api, 'Fixed s₀ = √(2.5 + ε) at input [1, −1, 2, −2]', 960, 339, 32, themeColors.muted, 'center');
    api.focus.target('identity-gradient-vector', () =>
      api.arrow(ctx, o.x, o.y, q.point(2, -2).x, q.point(2, -2).y, themeColors.blue, 11),
    );
    if (a > 0)
      api.focus.target('branch-gradient-vector', () =>
        api.arrow(ctx, q.point(2, -2).x, q.point(2, -2).y, end.x, end.y, themeColors.pink, 4),
      );
    api.focus.target('summed-gradient-point', () =>
      api.circle(ctx, end.x, end.y, 12, themeColors.yellow),
    );
    api.focus.target('pre-ln-jacobian', () =>
      equation(
        ctx,
        api,
        String.raw`J_{\rm pre}=I+J_FJ_{\rm LN}`,
        1500,
        430,
        48,
        themeColors.ink,
        'center',
      ),
    );
    equation(ctx, api, String.raw`J_{\rm post}=J_{\rm LN}(I+J_F)`, 1500, 607, 45, themeColors.ink, 'center');
    text(ctx, api, 'Probe   [2, −2, −1, 1]', 1450, 785, 34, themeColors.blue, 'center');
    if (a > 0) text(ctx, api, 'Branch   [−2, 2, 1, −1]', 1450, 852, 34, themeColors.pink, 'center');
    if (a === 1) text(ctx, api, 'Total   [0, 0, 0, 0]', 1450, 919, 38, themeColors.yellow, 'center');
  }
}
export default {
  id: 'gradients',
  draw: drawGradients,
  cues: [
    'gradients-identity-gradient-vector-b1-1',
    'gradients-branch-gradient-vector-b2-1',
  ],
};
