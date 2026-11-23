import { mix, pct, smooth } from '../arithmetic.mjs';
import { CASES } from '../fixtures.mjs';
import { sampleModel } from '../model.mjs';
import { auditFocusApi, caseGrid, text, visualFocus } from '../defaults.mjs';
export function drawIntro(ctx, scene, state, api) {
  api = auditFocusApi(api, scene);
  const { C: themeColors, components: components } = api;
  const modelState = sampleModel('intro', state),
    currentBeat = modelState.step,
    progress = modelState.p;
  {
    modelState.scores.forEach((row, i) => {
      const x = 165 + i * 870;
      const opening = currentBeat === 0;
      const lift = opening ? smooth(progress / 0.25) : 1;
      const reveal = opening ? smooth((progress - 0.25) / 0.75) : 1;
      visualFocus(ctx, api, `benchmark-score-${row.model.toLowerCase()}`, () =>
        text(
          ctx,
          api,
          lift < 1
            ? `${row.model} · ${pct(row.rate)}`
            : `Assistant ${row.model} · ${row.correct}/${row.total}`,
          x + 320,
          mix(480, 300, lift),
          mix(72, 35, lift),
          i ? themeColors.cyan : themeColors.blue,
          'center',
        ),
      );
      const peel = 0;
      components.fade(1 - peel, () => {
        components.fade(reveal, () => {
          visualFocus(ctx, api, 'benchmark-case-results', () =>
            caseGrid(ctx, api, row.model, x, 365, 640, 370, Math.floor(100 * reveal)),
          );
          api.line(ctx, x + 576, 365, x + 576, 735, themeColors.yellow, 3);
          visualFocus(ctx, api, 'intro-object-90-ordinary-1', () =>
            text(ctx, api, '90 ordinary', x + 260, 795, 28, themeColors.muted, 'center'),
          );
          text(ctx, api, '10 renewals', x + 600, 845, 26, themeColors.yellow, 'center');
        });
      });
    });
    {
      text(
        ctx,
        api,
        'Same overall score · different questions failed',
        960,
        925,
        32,
        themeColors.yellow,
        'center',
      );
      text(
        ctx,
        api,
        'Keep IDs Q91 · Q92 · Q99 attached to the renewal cases',
        960,
        985,
        26,
        themeColors.yellow,
        'center',
      );
      if (currentBeat > 0) {
        for (const [i, index] of [90, 91, 98].entries()) {
          const row = CASES[index];
          text(
            ctx,
            api,
            `${row.id}: A ${row.A ? 'pass' : 'fail'} / B ${row.B ? 'pass' : 'fail'}`,
            400 + i * 565,
            885,
            25,
            themeColors.muted,
            'center',
          );
        }
      }
    }
  }
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-beat-1-focus-1', 'intro-beat-2-focus-1', 'intro-beat-3-focus-1'],
};
