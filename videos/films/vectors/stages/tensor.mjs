import { H } from '../fixtures.mjs';
import { done, tensorFrame } from '../model.mjs';
import { drawEquation, drawMatrix, drawOwnedMatrix, drawTarget, drawText } from '../defaults.mjs';
export function drawTensor(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  {
    const f = tensorFrame(state),
      output = beat === 2,
      values = output ? f.output : H;
    drawTarget(ctx, api, 'message-a', () =>
      drawOwnedMatrix(ctx, api, 0, values[0], 455, 370, {
        id: 'message-a-row',
        visible: output ? (t) => t < f.completed : undefined,
      }),
    );
    drawTarget(ctx, api, 'message-b', () =>
      drawOwnedMatrix(ctx, api, 1, values[1], 1260, 370, {
        id: 'message-b-row',
        visible: output ? (t) => 3 + t < f.completed : undefined,
      }),
    );
    if (beat === 1) {
      if (f.message > 0 && f.word === 0)
        api.rect(ctx, 1060, 340, 500, 385, 'transparent', themeColors.yellow, 8, 8);
      if (f.word > 0 && f.feature === 0)
        api.rect(ctx, 1252, 586, 224, 112, 'transparent', themeColors.yellow, 7, 7);
      drawTarget(ctx, api, 'address-feature', () => {
        if (f.feature > 0 && f.slice === 0)
          api.rect(ctx, 1252, 586, 112, 112, 'transparent', themeColors.yellow, 7, 7);
      });
      drawTarget(ctx, api, 'tensor-index', () => {
        if (f.slice > 0)
          drawTarget(ctx, api, 'tensor-feature-slice', () => {
            for (const x of [455, 1260])
              for (let r = 0; r < 3; r++)
                api.rect(
                  ctx,
                  x - 6,
                  364 + r * 112,
                  112,
                  112,
                  'transparent',
                  themeColors.green,
                  3,
                  5,
                );
            drawText(
              ctx,
              api,
              'feature 0 across both messages',
              960,
              730,
              27,
              themeColors.green,
              'center',
            );
            drawMatrix(
              ctx,
              api,
              H.map((message) => message.map((row) => row[0])),
              827,
              752,
              themeColors.green,
              86,
            );
            drawText(ctx, api, 'A', 790, 807, 26, themeColors.muted);
            drawText(ctx, api, 'B', 790, 901, 26, themeColors.muted);
          });
        else drawTarget(ctx, api, 'tensor-feature-slice', () => {});
        if (f.slice === 0)
          drawEquation(
            ctx,
            api,
            done(f.feature)
              ? 'H_{1,2,0}=1'
              : f.word > 0
                ? 'H_{1,2,:}\\quad[2]'
                : 'H_{1,:,:}\\quad[3,2]',
            960,
            880,
            50,
            themeColors.yellow,
          );
      });
    } else
      drawText(
        ctx,
        api,
        output
          ? 'same map at six separate word positions'
          : 'B: message     T: word position     D: feature',
        960,
        820,
        31,
        themeColors.muted,
        'center',
      );
    drawTarget(ctx, api, 'tensor-shape', () =>
      drawEquation(
        ctx,
        api,
        output
          ? done(f.batch)
            ? '[2,3,2]\\;@\\;[2,3]\\longrightarrow[2,3,3]'
            : '[2,3,2]\\;@\\;[2,3]\\longrightarrow[\\,?,\\,?,\\,?\\,]'
          : beat === 1 && f.slice > 0
            ? 'H_{:,:,0}\\quad[2,3]'
            : '[B,T,D]=[2,3,2]',
        960,
        990,
        46,
        output && done(f.batch) ? themeColors.green : themeColors.cyan,
      ),
    );
  }
}
export default {
  id: 'tensor',
  draw: drawTensor,
  cues: [
    'add-message-axis',
    'select-message',
    'select-word',
    'select-feature',
    'tensor-slice-columns',
    'project-batch',
  ],
};
