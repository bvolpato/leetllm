import { drawEquation, drawLine, drawRectangle, drawText } from '../defaults.mjs';
export function drawOutput(ctx, scene, state, api) {
  const themeColors = api.C;
  const beat = state.beat ?? 0;
  const beatP = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0, end = 1) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(beatP, start, end);
  const fade = api.components.fade;
  ctx.save();
  (() => {
    api.focus.target('output-y-wx', () =>
      drawEquation(ctx, api, 'Y=WX', 960, 280, 62, themeColors.ink, 'center'),
    );
    const lanes = [
      {
        x: 200,
        title: 'quiet input',
        input: 0.1,
        weightError: 0.05,
        color: themeColors.cyan,
      },
      {
        x: 1070,
        title: 'active input',
        input: 2,
        weightError: 0.05,
        color: themeColors.yellow,
      },
    ];
    for (const [index, item] of lanes.entries()) {
      const cx = item.x + 325;
      api.focus.target('output-readout', () =>
        drawText(ctx, api, item.title, cx, 365, 36, item.color, 'center'),
      );
      api.focus.target('output-w-hat-w-0-05', () =>
        drawEquation(ctx, api, '|w-\\hat{w}|=0.05', cx, 435, 42, themeColors.ink, 'center'),
      );
      const actP = api.focus.progress(
          index ? 'active-input' : 'quiet-input',
          stage(index + 1, 0.05, 0.5),
        ),
        outputP = api.focus.progress(
          index ? 'large-output' : 'quiet-output',
          stage(index + 1, 0.55, 0.88),
        ),
        baseY = 685,
        barHeight = (item.input / 2) * 185;
      const displayedInput = Number((item.input * actP).toFixed(2));
      const displayedInputHundredths = Math.round(displayedInput * 100);
      const displayedWeightHundredths = Math.round(item.weightError * 100);
      // Round the exact product of the displayed hundredths to thousandths.
      const outputChange =
        Math.round((displayedWeightHundredths * displayedInputHundredths) / 10) / 1000;
      drawLine(ctx, api, item.x + 60, baseY, item.x + 590, baseY, themeColors.muted, 3);
      api.focus.target('input-' + index, () => {
        drawLine(ctx, api, item.x + 60, baseY, item.x + 590, baseY, themeColors.muted, 3);
        drawRectangle(
          ctx,
          api,
          cx - 48,
          baseY - barHeight * actP,
          96,
          barHeight * actP,
          item.color,
          themeColors.bg,
          9,
        );
      });
      api.focus.target('input-' + index, () =>
        drawEquation(ctx, api, `x=${displayedInput.toFixed(2)}`, cx, 745, 38, item.color, 'center'),
      );
      fade(outputP, () => {
        api.focus.target('layer-output-' + index, () =>
          drawRectangle(
            ctx,
            api,
            item.x + 75,
            815,
            (outputChange / 0.1) * 500,
            32,
            item.color,
            themeColors.bg,
            8,
          ),
        );
        api.focus.target('layer-output-' + index, () =>
          drawText(
            ctx,
            api,
            `output change = ${outputChange.toFixed(3)}`,
            cx,
            903,
            34,
            item.color,
            'center',
          ),
        );
      });
    }
    api.focus.target('output-delta-y-j-w-j-hat-w-j-x-j', () =>
      drawEquation(
        ctx,
        api,
        '|\\Delta y_j|=|w_j-\\hat{w}_j|\\,|x_j|',
        960,
        985,
        46,
        themeColors.ink,
        'center',
      ),
    );
    return;
  })();
  ctx.restore();
}
export default {
  id: 'output',
  draw: drawOutput,
  cues: [
    'linear-product',
    'input-error',
    'quiet-input',
    'quiet-output',
    'active-input',
    'large-output',
  ],
};
