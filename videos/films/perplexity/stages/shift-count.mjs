import { drawExtendedBox, drawExtendedText, drawExtendedTitle } from '../defaults.mjs';
export function drawShiftCount(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.1, z = 0.85) => api.phase(progress, a, z),
    cue = (id) => api.focus.progress(id, cueProgress());
  {
    if (currentBeat < 2) {
      drawExtendedTitle(
        ctx,
        api,
        'Separate padded fixture · ignore = −100 · causal target is the next label',
      );
      const rows = [
        [-100, 1, 2],
        [-100, -100, 3],
      ];
      rows.forEach((row, r) => {
        const y = 420 + r * 280;
        row.forEach((v, i) => {
          const x = 420 + i * 430,
            col = i && v !== -100 ? themeColors.green : themeColors.muted;
          drawExtendedBox(ctx, api, v === -100 ? 'ignore' : v, x, y, 260, 90, col);
          drawExtendedText(
            ctx,
            api,
            'label position ' + i,
            x + 130,
            y - 35,
            25,
            themeColors.muted,
            'center',
          );
          if (i > 0) {
            const from = x - 300;
            api.focus.target('shift-pairs', () => {
              api.arrow(ctx, from, y + 175, x + 130, y + 115, themeColors.blue, 3);
              drawExtendedText(
                ctx,
                api,
                'logits ' + (i - 1),
                from,
                y + 220,
                27,
                themeColors.blue,
                'center',
              );
            });
          }
        });
      });
      api.focus.target('shift-count-result', () =>
        drawExtendedText(
          ctx,
          api,
          currentBeat === 0
            ? cue('valid-count') > 0.4
              ? 'Surviving valid targets: 2 + 1 = 3'
              : 'Pair logits with the next nonignored labels'
            : 'Removed labels were already ignored: 3 − 2 = 1 is wrong',
          960,
          1030,
          36,
          currentBeat ? themeColors.pink : themeColors.green,
          'center',
        ),
      );
    } else {
      drawExtendedTitle(ctx, api, 'Uneven loss toy · two targets at 0.2, one target at 2.0');
      const q = cue('row-weight'),
        vals = [0.2, 0.2, 2].map((x) => x + (0.8 - x) * q);
      vals.forEach((v, i) => {
        const x = 420 + i * 480;
        api.rect(
          ctx,
          x,
          820 - v * 190,
          240,
          v * 190,
          i === 2 ? themeColors.pink : themeColors.blue,
        );
        drawExtendedText(
          ctx,
          api,
          'target ' + (i + 1),
          x + 120,
          910,
          30,
          themeColors.muted,
          'center',
        );
      });
      api.focus.target('mean-weight', () => {
        drawExtendedText(
          ctx,
          api,
          q > 0.8 ? 'Equal token mean = 0.8' : 'Losses 0.2 + 0.2 + 2.0 = 2.4',
          960,
          350,
          36,
          themeColors.yellow,
          'center',
        );
        drawExtendedText(
          ctx,
          api,
          'Mean of row means = (0.2 + 2.0)/2 = 1.1',
          960,
          990,
          31,
          themeColors.pink,
          'center',
        );
      });
      api.focus.target('ignored-state', () =>
        drawExtendedText(
          ctx,
          api,
          cue('empty-targets') > 0.3
            ? 'No valid targets: skip this batch; reject an empty evaluation'
            : 'Loss masks and attention masks serve different roles',
          960,
          1050,
          28,
          themeColors.muted,
          'center',
        ),
      );
    }
    return;
  }
}
export default {
  id: 'shift-count',
  draw: drawShiftCount,
  cues: ['causal-pairs', 'valid-count', 'wrong-counter', 'row-weight', 'empty-targets'],
};
