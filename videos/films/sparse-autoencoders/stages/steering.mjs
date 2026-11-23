import { steeringBaseline } from '../fixtures.mjs';
import { steeringState } from '../construction.mjs';
import {
  box,
  equation,
  foot,
  head,
  retainedDrawEquation,
  retainedDrawText,
  textLabel,
} from '../defaults.mjs';
function retainedDraw(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  {
    const { alpha, activation: v, readouts } = steeringState(state),
      q = teaching.axes({
        x: 260,
        y: 390,
        width: 820,
        height: 400,
        xDomain: [-0.5, 1],
        yDomain: [-1.2, 2.4],
        equalUnits: true,
        xTicks: [0, 1],
        yTicks: [-1, 0, 1, 2],
        xLabel: 'orthogonal coordinate',
        yLabel: 'candidate coordinate',
        fontSize: 34,
      });
    teaching.curve({
      plot: q,
      points: [
        {
          x: 0.2,
          y: -0.9,
        },
        {
          x: 0.2,
          y: 2.1,
        },
      ],
      color: themeColors.muted,
      width: 3,
    });
    const baseline = q.point(...steeringBaseline);
    retainedDrawText(
      ctx,
      api,
      'Steering miniature · fixed base + edit along [0, 1]',
      960,
      245,
      27,
      themeColors.muted,
      'center',
    );
    api.circle(ctx, baseline.x, baseline.y, 8, themeColors.blue);
    retainedDrawText(ctx, api, 'α = 0', baseline.x + 30, baseline.y + 10, 26, themeColors.blue);
    const at = q.point(...v);
    api.focus.target('steering-point', () => api.circle(ctx, at.x, at.y, 14, themeColors.yellow));
    retainedDrawText(
      ctx,
      api,
      `current edit α = ${alpha.toFixed(2)}`,
      960,
      300,
      34,
      themeColors.yellow,
      'center',
    );
    api.focus.target('candidate-readout', () =>
      retainedDrawText(
        ctx,
        api,
        `candidate ${readouts[0].toFixed(2)}`,
        1460,
        390,
        40,
        themeColors.yellow,
        'center',
      ),
    );
    api.focus.target('orthogonal-readout', () =>
      retainedDrawText(
        ctx,
        api,
        `orthogonal ${readouts[1].toFixed(2)}`,
        1460,
        565,
        40,
        themeColors.blue,
        'center',
      ),
    );
    api.focus.target('overlap-readout', () =>
      retainedDrawText(
        ctx,
        api,
        `overlapping ${readouts[2].toFixed(2)}`,
        1460,
        740,
        40,
        themeColors.pink,
        'center',
      ),
    );
    retainedDrawText(
      ctx,
      api,
      'α = 0 reference: candidate 0.10 · orthogonal 0.20 · overlap 0.20',
      960,
      900,
      28,
      themeColors.muted,
      'center',
    );
    api.focus.target('steering-equation', () =>
      retainedDrawEquation(
        ctx,
        api,
        String.raw`x'=x+\alpha d_f`,
        960,
        955,
        52,
        themeColors.ink,
        'center',
      ),
    );
  }
}
export function drawSteering(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    { C: themeColors } = api;
  const custom = currentBeat === 2;
  if (!custom) {
    retainedDraw(ctx, scene, state, api);
    return;
  }
  api.focus.target('steering-construction', () => {
    head(ctx, api, 'Cached coefficient edit is not an encoder fixed point');
    equation(ctx, api, String.raw`x'=x+(c-z_f)d_f`, 960, 420, 58);
    box(ctx, api, 'cached decomposition', 180, 600, 650, themeColors.blue);
    box(ctx, api, 'newly re-encoded coefficient', 1090, 600, 650, themeColors.pink);
    textLabel(
      ctx,
      api,
      'Encoder and decoder directions can differ',
      960,
      850,
      35,
      themeColors.yellow,
      'center',
    );
    foot(
      ctx,
      api,
      'Specify the changed activation and measurement; the next chapter computes this mismatch',
    );
  });
}
export default {
  id: 'steering',
  draw: drawSteering,
  cues: ['steering-b1-1', 'steering-b1-2', 'steering-b2-1', 'steering-b3-1'],
};
