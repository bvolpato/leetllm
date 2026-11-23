import { CLAIMS } from '../fixtures.mjs';
import { clamp, spoken } from '../construction.mjs';
import { card, foot, text } from '../defaults.mjs';
export function drawAtomicClaims(ctx, scene, state, api) {
  const { C: themeColors, phase } = api,
    beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.05, 0.88);
  {
    if (beat === 1) {
      text(ctx, api, 'Original answer', 960, 290, 30, themeColors.blue, 'center');
      ['A receipt', 'arrives', 'immediately.'].forEach((word, i) =>
        api.focus.target(i === 2 ? 'original-qualifier' : 'original-assertion', () =>
          card(ctx, api, word, 250 + i * 500, 350, 420, themeColors.blue, 95),
        ),
      );
      text(ctx, api, 'Extracted claim', 720, 550, 30, themeColors.yellow, 'center');
      ['A receipt', 'arrives'].forEach((word, i) =>
        api.focus.target('extracted-assertion', () =>
          card(ctx, api, word, 250 + i * 500, 600, 420, themeColors.yellow, 95),
        ),
      );
      const drop = api.focus.progress('drop-qualifier', q);
      card(
        ctx,
        api,
        'immediately.',
        1250 + 100 * drop,
        600 + 145 * drop,
        420,
        drop > 0 ? themeColors.pink : themeColors.yellow,
        95,
      );
      if (drop === 1)
        text(ctx, api, 'Qualifier removed', 1560, 880, 26, themeColors.pink, 'center');
      card(ctx, api, 'Source B: receipt next day', 250, 820, 920, themeColors.cyan, 100);
    } else {
      text(ctx, api, 'Original paragraph', 465, 290, 30, themeColors.muted, 'center');
      text(ctx, api, 'Atomic claims · same words', 1445, 290, 30, themeColors.muted, 'center');
      const extract = beat > 0 ? 1 : spoken(state, 'extract-claims', 0);
      api.focus.target('answer-paragraph', () =>
        api.path(
          ctx,
          [
            {
              x: 780,
              y: 330,
            },
            {
              x: 150,
              y: 330,
            },
            {
              x: 150,
              y: 895,
            },
            {
              x: 780,
              y: 895,
            },
          ],
          {
            color: themeColors.blue,
            width: 3,
          },
        ),
      );
      CLAIMS.slice(0, 3).forEach((a, i) => {
        const progress = clamp(extract * 1.6 - i * 0.3),
          x = 190 + 960 * progress,
          y = 350 + i * 175,
          color = [themeColors.blue, themeColors.cyan, themeColors.pink][i];
        if (progress === 1) text(ctx, api, a.text, 180, y + 65, 28, themeColors.muted);
        api.focus.target('emitted-claims', () => card(ctx, api, a.text, x, y, 590, color, 110));
      });
      foot(ctx, api, 'The literal spans move; conditions and timing stay attached to their words');
    }
  }
}
export default {
  id: 'atomic-claims',
  draw: drawAtomicClaims,
  cues: ['extract-claims', 'drop-qualifier', 'changed-assertion', 'reviewed-labels'],
};
