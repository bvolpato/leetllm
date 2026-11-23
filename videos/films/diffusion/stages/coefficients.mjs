import { opProgress } from '../construction.mjs';
import {
  drawOriginalArrow,
  drawOriginalCircle,
  drawOriginalLine,
  drawOriginalMath,
  drawOriginalSpoken,
  drawOriginalTarget,
  drawOriginalText,
} from '../defaults.mjs';
function paintCoefficients(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const stage = (index, start = 0.05, end = 0.9) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  const fade = api.components.fade;
  ctx.save();
  {
    const alpha = api.lerp(0.97, 0.5, stage(0)),
      a = Math.sqrt(alpha),
      b = Math.sqrt(1 - alpha);
    const cx = 335,
      cy = 695,
      radius = 300,
      theta = Math.acos(a);
    const arc = Array.from(
      {
        length: 91,
      },
      (_, i) => ({
        x: cx + radius * Math.cos(((i / 90) * Math.PI) / 2),
        y: cy - radius * Math.sin(((i / 90) * Math.PI) / 2),
      }),
    );
    api.path(ctx, arc, {
      color: '#8d9cb966',
      width: 3,
    });
    drawOriginalLine(ctx, api, cx, cy, cx + radius + 20, cy, themeColors.muted, 2);
    drawOriginalLine(ctx, api, cx, cy, cx, cy - radius - 20, themeColors.muted, 2);
    drawOriginalTarget(ctx, api, 'coefficients-amplitudes', () => {
      drawOriginalLine(ctx, api, cx, cy, cx + radius * a, cy, themeColors.cyan, 7);
      drawOriginalLine(
        ctx,
        api,
        cx + radius * a,
        cy,
        cx + radius * a,
        cy - radius * b,
        themeColors.yellow,
        7,
      );
    });
    drawOriginalLine(
      ctx,
      api,
      cx,
      cy,
      cx + radius * Math.cos(theta),
      cy - radius * Math.sin(theta),
      themeColors.ink,
      3,
    );
    drawOriginalCircle(ctx, api, cx + radius * a, cy - radius * b, 10, themeColors.ink);
    drawOriginalText(ctx, api, 'signal amplitude', 470, 770, 29, themeColors.cyan, 'center');
    drawOriginalText(ctx, api, 'noise amplitude', 335, 335, 29, themeColors.yellow, 'center');
    api.focus.target('coefficients-math-a-2-b-2-1', () =>
      drawOriginalMath(ctx, api, String.raw`a^2+b^2=1`, 460, 870, 43),
    );
    drawOriginalTarget(ctx, api, 'coefficients-mixture', () =>
      drawOriginalMath(
        ctx,
        api,
        String.raw`x_t=\sqrt{\bar\alpha_t}\,x_0+\sqrt{1-\bar\alpha_t}\,\epsilon`,
        1255,
        350,
        46,
      ),
    );
    drawOriginalMath(
      ctx,
      api,
      String.raw`x_0=1,\qquad\epsilon=-0.4`,
      1255,
      440,
      40,
      themeColors.muted,
    );
    const X = (v) => 850 + ((v + 0.5) / 1.5) * 830,
      yy = 640;
    drawOriginalLine(ctx, api, X(-0.5), yy, X(1), yy, themeColors.muted, 3);
    for (const v of [-0.5, 0, 0.5, 1]) {
      drawOriginalLine(ctx, api, X(v), yy - 10, X(v), yy + 12, themeColors.muted, 2);
      drawOriginalText(ctx, api, v.toFixed(1), X(v), yy + 55, 27, themeColors.muted, 'center');
    }
    const sumP = drawOriginalSpoken(ctx, api, 'coefficients-cancellation', stage(1)),
      signal = a,
      total = a - 0.4 * b * sumP;
    drawOriginalTarget(ctx, api, 'coefficients-number-line', () => {
      drawOriginalArrow(ctx, api, X(0), yy - 110, X(signal), yy - 110, themeColors.cyan, 7);
      if (sumP > 0)
        drawOriginalArrow(ctx, api, X(signal), yy - 65, X(total), yy - 65, themeColors.yellow, 7);
      drawOriginalCircle(ctx, api, X(total), yy, 13, themeColors.ink, themeColors.bg, 3);
      drawOriginalText(
        ctx,
        api,
        `signal  ${a.toFixed(3)}`,
        1090,
        790,
        32,
        themeColors.cyan,
        'center',
      );
      drawOriginalText(
        ctx,
        api,
        `noise  ${(-0.4 * b * sumP).toFixed(3)}`,
        1480,
        790,
        32,
        themeColors.yellow,
        'center',
      );
      drawOriginalMath(
        ctx,
        api,
        (sumP < 1 ? String.raw`\mathrm{partial}=` : String.raw`x_t\approx`) + total.toFixed(3),
        1260,
        870,
        49,
      );
    });
    drawOriginalTarget(ctx, api, 'coefficients-snr', () =>
      drawOriginalMath(
        ctx,
        api,
        String.raw`\mathrm{SNR}(t)=\frac{\bar\alpha_t}{1-\bar\alpha_t}=` +
          (alpha / (1 - alpha)).toFixed(2),
        1260,
        970,
        40,
        themeColors.muted,
      ),
    );
  }
  ctx.restore();
}
export function drawCoefficients(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    id = scene.id,
    b = state.beat ?? 0,
    p = opProgress(state, id);
  paintCoefficients(
    ctx,
    scene,
    {
      ...state,
      beatP: p,
    },
    api,
  );
}
export default {
  id: 'coefficients',
  draw: drawCoefficients,
  cues: [
    'coefficients-mixture',
    'coefficients-amplitude',
    'df-coefficients-0',
    'coefficients-halfway',
    'coefficients-cancellation',
    'df-coefficients-1',
    'coefficients-unit-variance',
    'coefficients-snr',
    'df-coefficients-2',
  ],
};
