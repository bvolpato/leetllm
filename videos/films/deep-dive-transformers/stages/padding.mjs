import { sampleModel } from '../model.mjs';
import { originalCard, originalText } from '../defaults.mjs';
export function drawPadding(ctx, scene, state, api) {
  return api.focus.target('hf-padding-mechanism', () => {
    {
      sampleModel('padding', state);
    }
    const { C: themeColors, teaching: teaching } = api,
      modelState = sampleModel('padding', state),
      currentBeat = modelState.b;
    {
      originalText(
        ctx,
        api,
        modelState.left
          ? 'Left padding · both final positions are prompt tokens'
          : 'Right padding · short-row final position is PAD',
        960,
        285,
        37,
        modelState.left ? themeColors.green : themeColors.pink,
        'center',
      );
      teaching.grid({
        x: 350,
        y: 370,
        width: 1200,
        height: 170,
        rows: 2,
        columns: 4,
        labels: modelState.rows,
        fontSize: 31,
        fill: themeColors.panel,
        stroke: themeColors.blue,
        textColor: themeColors.ink,
        cellFocusTarget: (r, col) => [
          'padding-words',
          ...(modelState.rows[r][col] === 'PAD'
            ? ['padding-pad-cells']
            : ['padding-content-cells']),
          ...(col === 3 ? ['padding-final-positions'] : []),
        ],
      });
      api.focus.target('padding-read-edge', () => {
        api.arrow(ctx, 1565, 412, 1630, 412, themeColors.yellow, 3);
        originalCard(ctx, api, 'Read: ' + modelState.read, 1645, 375, 220, themeColors.yellow, 75);
      });
      teaching.grid({
        x: 350,
        y: 610,
        width: 1200,
        height: 105,
        rows: 2,
        columns: 4,
        labels: modelState.masks,
        fontSize: 29,
        fill: themeColors.panel,
        stroke: themeColors.cyan,
        textColor: themeColors.ink,
        cellFocusTarget: (r, col) =>
          modelState.masks[r][col] ? 'padding-visible-mask' : 'padding-hidden-mask',
      });
      originalText(ctx, api, 'Words', 150, 455, 29, themeColors.blue);
      originalText(ctx, api, 'Attention', 150, 665, 29, themeColors.cyan);
      if (currentBeat === 2) {
        originalText(
          ctx,
          api,
          'Training example · EOS and PAD share ID 2',
          960,
          765,
          28,
          themeColors.yellow,
          'center',
        );
        teaching.grid({
          x: 350,
          y: 800,
          width: 1200,
          height: 180,
          rows: 3,
          columns: 4,
          labels: [
            modelState.trainingTokens,
            modelState.trainingAttention,
            modelState.trainingLabels,
          ],
          fontSize: 27,
          fill: themeColors.panel,
          stroke: themeColors.muted,
          textColor: themeColors.ink,
          cellFocusTarget: (r, col) => [
            'padding-training-example',
            ...(r === 1 ? ['padding-training-attention'] : []),
            ...(col === 0
              ? ['padding-ignored-training-pad']
              : col === 3
                ? ['padding-kept-eos']
                : ['padding-training-context']),
          ],
        });
        originalText(ctx, api, 'Input', 150, 840, 25, themeColors.blue);
        originalText(ctx, api, 'Attention', 150, 900, 25, themeColors.cyan);
        originalText(ctx, api, 'Targets', 150, 960, 25, themeColors.cyan);
        originalText(
          ctx,
          api,
          'PAD target ignored · real EOS target retained',
          960,
          1040,
          27,
          themeColors.muted,
          'center',
        );
      } else
        originalText(
          ctx,
          api,
          'Attention visibility and next-token read position are separate',
          960,
          950,
          32,
          themeColors.muted,
          'center',
        );
    }
  });
}
export default {
  id: 'padding',
  draw: drawPadding,
  cues: [
    'padding-beat-1-focus-1',
    'padding-beat-1-focus-2',
    'hf-padding-0',
    'padding-beat-2-focus-1',
    'padding-left-pad',
    'padding-beat-2-focus-2',
    'hf-padding-1',
    'padding-beat-3-focus-1',
    'padding-beat-3-focus-2',
    'hf-padding-2',
  ],
};
