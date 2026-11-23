import { visionFrame } from '../model.mjs';
import { visionMatrix, visionNote, visionProgress, visionText, visionValue } from '../defaults.mjs';
export function drawFocusStencil(ctx, scene, state, api) {
  const frameState = visionFrame('focus-stencil', state);
  return api.focus.target('dv-focus-stencil-mechanism', () => {
    const { C: themeColors } = api;
    const currentBeat = frameState.beat,
      resultComplete = frameState.after;
    {
      visionText(ctx, api, 'Actual 5 × 5 intensity grid', 420, 300, 31, themeColors.blue, 'center');
      const input = visionMatrix(ctx, api, frameState.pixels, 235, 350, 76, (v) =>
        v === 1 ? themeColors.muted : themeColors.panel,
      );
      const selected = Math.min(8, Math.max(0, frameState.visited - 1)),
        r = Math.floor(selected / 3) + 1,
        col = (selected % 3) + 1;
      api.rect(
        ctx,
        input.x + (col - 1) * 76,
        input.y + (r - 1) * 76,
        223,
        223,
        'rgba(0,0,0,0)',
        themeColors.yellow,
        4,
      );
      visionText(ctx, api, 'N + S + E + W − 4 × center', 1010, 345, 33, themeColors.ink, 'center');
      visionMatrix(
        ctx,
        api,
        [
          [0, 1, 0],
          [1, -4, 1],
          [0, 1, 0],
        ],
        850,
        400,
        78,
      );
      visionText(ctx, api, 'Signed responses', 1450, 335, 31, themeColors.cyan, 'center');
      const responses = Array.from(
        {
          length: 3,
        },
        (_, y) =>
          Array.from(
            {
              length: 3,
            },
            (_, x) => (frameState.showResponses ? frameState.responses[y * 3 + x] : '·'),
          ),
      );
      visionMatrix(ctx, api, responses, 1320, 400, 90);
      visionValue(
        ctx,
        api,
        'Retained pixels',
        '9',
        900,
        745,
        resultComplete('response-nine', 1),
        themeColors.cyan,
      );
      visionValue(
        ctx,
        api,
        'Mean',
        frameState.mean,
        1220,
        745,
        frameState.showResponses,
        themeColors.blue,
      );
      visionValue(
        ctx,
        api,
        'Population variance',
        '2 / 3',
        1530,
        745,
        frameState.showVariance,
        themeColors.green,
      );
      visionProgress(
        ctx,
        api,
        currentBeat === 0 ? frameState.op : frameState.showResponses ? 1 : frameState.op,
        235,
        820,
        375,
        themeColors.yellow,
      );
      visionText(
        ctx,
        api,
        currentBeat === 0
          ? 'Inspect the current 3 × 3 window'
          : 'No padding · nine interior positions',
        425,
        900,
        26,
        themeColors.muted,
        'center',
      );
      visionNote(
        ctx,
        api,
        'Responses stay signed. Squared deviations use the population denominator N = 9.',
      );
    }
  });
}
export default {
  id: 'focus-stencil',
  draw: drawFocusStencil,
  cues: [
    'dv-focus-stencil-0',
    'dv-focus-stencil-operation-0',
    'dv-stencil-operation',
    'dv-focus-stencil-1',
    'dv-focus-stencil-operation-1',
    'dv-response-nine',
    'dv-response-mean',
    'dv-response-variance',
    'dv-focus-stencil-2',
    'dv-focus-stencil-operation-2',
  ],
};
