import { drawExtendedBox, drawExtendedText, drawExtendedTitle } from '../defaults.mjs';
export function drawObjectiveBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.1, z = 0.85) => api.phase(progress, a, z),
    cue = (id) => api.focus.progress(id, cueProgress());
  {
    if (currentBeat === 0) {
      drawExtendedTitle(ctx, api, 'Same observed target “sat” · different information available');
      ['Causal next token', 'Masked token'].forEach((name, row) => {
        const y = 430 + row * 280;
        drawExtendedText(
          ctx,
          api,
          name,
          220,
          y + 45,
          31,
          row ? themeColors.pink : themeColors.blue,
        );
        ['The', 'cat', row ? '[MASK]' : 'sat', 'on', 'mat'].forEach((v, i) => {
          const x = 640 + i * 220,
            visible = i < 2 || (i > 2 && row && cue('masked-context') > 0.4),
            col =
              i === 2
                ? themeColors.yellow
                : visible
                  ? row
                    ? themeColors.pink
                    : themeColors.blue
                  : themeColors.muted;
          drawExtendedBox(ctx, api, i > 2 && !visible ? 'future' : v, x, y, 190, 85, col);
        });
      });
      api.focus.target('masked-right', () =>
        drawExtendedText(
          ctx,
          api,
          cue('masked-context') > 0.4
            ? 'Right context joins the masked score; causal conditioning stays left-only'
            : 'Read the same target under two conditioning rules',
          960,
          1030,
          32,
          themeColors.yellow,
          'center',
        ),
      );
    } else if (currentBeat === 1) {
      drawExtendedTitle(
        ctx,
        api,
        'Response-only chat contract · context read versus targets scored',
      );
      const names = ['system', 'user', 'assistant 1', 'assistant 2', 'padding'];
      names.forEach((v, i) => {
        const x = 220 + i * 310,
          col = i === 2 || i === 3 ? themeColors.green : themeColors.blue;
        drawExtendedBox(ctx, api, v, x, 450, 270, 100, col);
        drawExtendedText(
          ctx,
          api,
          i === 4 ? 'attention masked' : 'read context',
          x + 135,
          660,
          26,
          i === 4 ? themeColors.muted : themeColors.blue,
          'center',
        );
        api.focus.target('response-mask', () =>
          drawExtendedText(
            ctx,
            api,
            cue('response-mask') > 0.4
              ? i === 2 || i === 3
                ? 'LOSS +1'
                : 'ignored target'
              : 'target ?',
            x + 135,
            820,
            28,
            i === 2 || i === 3 ? themeColors.green : themeColors.muted,
            'center',
          ),
        );
      });
      drawExtendedText(
        ctx,
        api,
        'The exact template and scored spans determine which prediction events count',
        960,
        1030,
        29,
        themeColors.yellow,
        'center',
      );
    } else {
      drawExtendedTitle(
        ctx,
        api,
        'A generated path does not supply likelihoods for an unobserved path',
      );
      drawExtendedBox(
        ctx,
        api,
        'Supplied prefix: “The cat sat”',
        250,
        420,
        660,
        90,
        themeColors.blue,
      );
      api.arrow(ctx, 950, 465, 1170, 465, themeColors.muted, 3);
      drawExtendedBox(ctx, api, 'Generated: “on” · p known', 1210, 420, 520, 90, themeColors.green);
      api.arrow(ctx, 950, 465, 1170, 760, themeColors.muted, 3);
      api.focus.target('fixed-target', () =>
        drawExtendedBox(
          ctx,
          api,
          cue('target-access') > 0.4
            ? 'Test target: “under” · p still unknown'
            : 'Test target: “under”',
          1210,
          715,
          520,
          90,
          themeColors.pink,
        ),
      );
      drawExtendedText(
        ctx,
        api,
        'Request likelihoods for the actual supplied targets, or use task evaluation',
        960,
        1030,
        31,
        themeColors.yellow,
        'center',
      );
    }
    return;
  }
}
export default {
  id: 'objective-boundary',
  draw: drawObjectiveBoundary,
  cues: ['masked-context', 'response-mask', 'target-access'],
};
