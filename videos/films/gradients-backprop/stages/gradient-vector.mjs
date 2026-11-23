import { latencyExample } from '../arithmetic.mjs';
import { drawOriginalEquation, drawOriginalText, drawShortArrow } from '../defaults.mjs';
export function drawGradientVector(ctx, scene, state, api) {
  const { C: themeColors, line, circle } = api;
  const progress2 = api.clamp(state.p ?? 0);
  const beat = state.beat ?? 0;
  const beatP = api.clamp(state.beatP ?? progress2);
  const { ink, muted, cyan, blue, yellow, pink, green, red, panel } = themeColors;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  (() => {
    if (beat < 2) {
      const prompt = beat === 0,
        color = prompt ? blue : cyan;
      const probe = api.focus.progress(
        prompt ? 'prompt-probe' : 'queue-probe',
        api.phase(beatP, 0.1, 0.6),
      );
      const weights = prompt ? [2 + 0.01 * probe, 2] : [2, 2 + 0.01 * probe];
      const receipt = latencyExample(weights);
      drawOriginalEquation(ctx, api, String.raw`\hat y=2w_p+w_q`, 960, 285, 54, ink, 'center');
      drawOriginalText(
        ctx,
        api,
        prompt ? 'hold queue weight at 2' : 'hold prompt weight at 2',
        960,
        370,
        36,
        muted,
        'center',
      );
      line(ctx, 350, 540, 1570, 540, muted, 4);
      circle(ctx, 550, 540, 15, pink);
      api.focus.target('coordinate-probe', () => {
        drawShortArrow(ctx, api, ctx, 550, 540, 550 + probe * 800, 540, color, 7);
        drawOriginalEquation(
          ctx,
          api,
          `${prompt ? 'w_p' : 'w_q'}=${weights[prompt ? 0 : 1].toFixed(3)}`,
          1350,
          470,
          48,
          color,
          'center',
        );
      });
      drawOriginalEquation(ctx, api, '2.000', 550, 610, 40, pink, 'center');
      drawOriginalText(ctx, api, 'magnified nudge · h = 0.01', 960, 700, 32, muted, 'center');
      drawOriginalEquation(
        ctx,
        api,
        String.raw`L:1\longrightarrow ${receipt.loss.toFixed(4)}`,
        960,
        795,
        52,
        color,
        'center',
      );
      api.focus.target(prompt ? 'prompt-partial' : 'queue-partial', () =>
        drawOriginalEquation(
          ctx,
          api,
          probe < 1
            ? String.raw`\frac{\partial L}{\partial ${prompt ? 'w_p' : 'w_q'}}=\;?`
            : prompt
              ? String.raw`\frac{\Delta L}{h}=4.04\longrightarrow\frac{\partial L}{\partial w_p}=4`
              : String.raw`\frac{\Delta L}{h}=2.01\longrightarrow\frac{\partial L}{\partial w_q}=2`,
          960,
          930,
          43,
          color,
          'center',
        ),
      );
      return;
    }
    const left = 350,
      right = 1150,
      top = 370,
      bottom = 820;
    drawShortArrow(ctx, api, ctx, left, bottom, right, bottom, muted, 3);
    drawShortArrow(ctx, api, ctx, left, bottom, left, top, muted, 3);
    api.focus.target('prompt-axis', () =>
      drawOriginalEquation(ctx, api, String.raw`w_p`, right + 20, bottom + 50, 33, blue),
    );
    api.focus.target('queue-axis', () =>
      drawOriginalEquation(ctx, api, String.raw`w_q`, left + 12, top + 32, 33, cyan),
    );
    const unit = 100;
    for (let k = 0; k <= 8; k += 1) {
      const x = left + k * unit;
      line(ctx, x, bottom - 7, x, bottom + 7, muted, 2);
      if (k <= 4) {
        const y = bottom - k * unit;
        line(ctx, left - 7, y, left + 7, y, muted, 2);
        drawOriginalText(ctx, api, String(k), left - 34, y + 10, 30, muted, 'right');
      }
      drawOriginalText(ctx, api, String(k), x, bottom + 38, 30, muted, 'center');
    }
    api.focus.target('latency-rule', () =>
      drawOriginalEquation(
        ctx,
        api,
        String.raw`\hat{y}=w_p x_p+w_q x_q`,
        960,
        265,
        43,
        ink,
        'center',
      ),
    );
    drawOriginalEquation(ctx, api, String.raw`(x_p,x_q)=(2,1)`, 960, 315, 32, muted, 'center');
    const origin = {
      x: left + 2 * unit,
      y: bottom - 2 * unit,
    };
    const horizontalP =
      beat === 2 ? api.focus.progress('prompt-slope', api.phase(beatP, 0.04, 0.3)) : 0;
    const verticalP =
      beat === 2 ? api.focus.progress('queue-slope', api.phase(beatP, 0.3, 0.53)) : 0;
    const diagonalP =
      beat === 2 ? api.focus.progress('combine-gradient', api.phase(beatP, 0.53, 0.74)) : 0;
    const horizontal = {
      x: origin.x + unit * 4 * horizontalP,
      y: origin.y,
    };
    const endpoint = {
      x: horizontal.x,
      y: origin.y - unit * 2 * verticalP,
    };
    const growingArrow = (from, to, color, width) => {
      const length = Math.hypot(to.x - from.x, to.y - from.y);
      if (length > 8) drawShortArrow(ctx, api, ctx, from.x, from.y, to.x, to.y, color, width);
      else if (length > 0) line(ctx, from.x, from.y, to.x, to.y, color, width);
    };
    circle(ctx, origin.x, origin.y, 12, pink);
    api.focus.target('prompt-component', () => growingArrow(origin, horizontal, blue, 5));
    api.focus.target('queue-component', () => growingArrow(horizontal, endpoint, cyan, 5));
    api.focus.target('combined-gradient', () =>
      growingArrow(
        origin,
        {
          x: api.lerp(origin.x, endpoint.x, diagonalP),
          y: api.lerp(origin.y, endpoint.y, diagonalP),
        },
        yellow,
        7,
      ),
    );
    if (beat === 2)
      api.focus.reveal('combine-gradient', () =>
        api.focus.target('combined-gradient', () =>
          drawOriginalEquation(
            ctx,
            api,
            String.raw`\nabla L=(4,2)`,
            1480,
            730,
            43,
            yellow,
            'center',
          ),
        ),
      );
    api.focus.target('prompt-partial', () =>
      drawOriginalEquation(
        ctx,
        api,
        beat === 2 && horizontalP > 0
          ? String.raw`\frac{\partial L}{\partial w_p}=4`
          : String.raw`\frac{\partial L}{\partial w_p}`,
        1480,
        430,
        38,
        blue,
        'center',
      ),
    );
    if (beat > 0)
      api.focus.target('queue-partial', () =>
        drawOriginalEquation(
          ctx,
          api,
          beat === 2 && verticalP > 0
            ? String.raw`\frac{\partial L}{\partial w_q}=2`
            : String.raw`\frac{\partial L}{\partial w_q}`,
          1480,
          550,
          38,
          cyan,
          'center',
        ),
      );
    drawOriginalEquation(
      ctx,
      api,
      String.raw`(2,2)`,
      origin.x - 20,
      origin.y + 50,
      31,
      pink,
      'right',
    );
    drawOriginalText(
      ctx,
      api,
      'sensitivity components anchored at the current setting',
      960,
      965,
      30,
      muted,
      'center',
    );
    return;
  })();
  ctx.restore();
}
export default {
  id: 'gradient-vector',
  draw: drawGradientVector,
  cues: [
    'prompt-probe',
    'partial-sensitivity',
    'queue-probe',
    'queue-partial-cue',
    'prompt-slope',
    'queue-slope',
    'combine-gradient',
  ],
};
