import { hash, clamp } from '../arithmetic.mjs';
import { arrow, drawText, footer, mark, pill } from '../defaults.mjs';
export function drawRenderedIdentity(ctx, scene, state, api) {
  return api.focus.target('rendered-identity-geometry', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueProgress = (id) =>
      state.cues ? api.focus.progress(id, 0) : clamp(((state.beatP ?? 0) - 0.15) / 0.65);
    const cueVisible = (id) => (state.cues ? api.focus.visible(id) : (state.beatP ?? 0) > 0.32);
    {
      drawText(
        ctx,
        api,
        'One guide · follow the actual bytes and their role boundary',
        150,
        270,
        31,
      );
      const edited = currentBeat === 1 && cueVisible('render-edit') && !cueVisible('render-repair');
      const values = [
        'Guide v7',
        edited ? 'line ending: CR LF' : 'line ending: LF',
        'developer wrapper',
        'final token sequence',
      ];
      values.forEach((value, i) => {
        pill(
          ctx,
          api,
          value,
          150 + i * 440,
          400,
          350,
          i === 1 && edited ? themeColors.pink : themeColors.blue,
          26,
        );
        if (i < 3)
          arrow(
            ctx,
            api,
            500 + i * 440,
            433,
            570 + i * 440,
            433,
            i === 1 && edited ? themeColors.pink : themeColors.blue,
            currentBeat === 0 ? cueProgress('render-pipeline') : 1,
          );
      });
      const digest = hash(values);
      mark(
        ctx,
        api,
        currentBeat === 0 ? 'render-pipeline' : currentBeat === 1 ? 'render-edit' : 'render-array',
        () =>
          drawText(
            ctx,
            api,
            'Rendered fixture SHA ' + digest.slice(0, 16),
            180,
            615,
            31,
            edited ? themeColors.pink : themeColors.blue,
          ),
      );
      if (currentBeat === 1) {
        mark(ctx, api, 'render-repair', () =>
          drawText(
            ctx,
            api,
            edited
              ? 'One changed byte boundary creates a new branch'
              : 'Restore LF → the compatible original branch is eligible',
            960,
            790,
            30,
            edited ? themeColors.pink : themeColors.green,
            'center',
          ),
        );
        drawText(
          ctx,
          api,
          edited ? '[LF] ≠ [CR, LF]' : '[LF] = [LF]',
          960,
          705,
          36,
          edited ? themeColors.pink : themeColors.green,
          'center',
        );
      } else if (currentBeat === 2) {
        mark(ctx, api, 'render-array', () => {
          pill(ctx, api, '[ tool A, tool B ]', 230, 740, 560, themeColors.blue);
          pill(ctx, api, '[ tool B, tool A ]', 1130, 740, 560, themeColors.pink);
          drawText(ctx, api, '≠', 960, 785, 42, themeColors.pink, 'center');
        });
        mark(ctx, api, 'render-image', () => {
          if (cueVisible('render-image'))
            drawText(
              ctx,
              api,
              'Same image placeholder + different image identity → different state',
              960,
              920,
              28,
              themeColors.yellow,
              'center',
            );
        });
      }
      footer(ctx, api, 'These are byte/rendering fixtures, not a tokenizer measurement.');
    }
  });
}
export default {
  id: 'rendered-identity',
  draw: drawRenderedIdentity,
  cues: ['render-pipeline', 'render-edit', 'render-repair', 'render-array', 'render-image'],
};
