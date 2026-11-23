import {
  box,
  constructionCode,
  constructionFooter,
  constructionText,
  focusProgress,
  label,
} from '../defaults.mjs';
export function drawQualityMeasure(ctx, scene, state, api) {
  const { C, components: c, teaching: t, phase } = api,
    beat = state.beat ?? 0,
    p = state.beatP ?? 0,
    q = phase(p, 0.05, 0.88);
  {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const done = (id) => focusProgress(ctx, api, id) >= 1;
    api.focus.target('sg-quality-measure-mechanism', () => {
      if (currentBeat === 0) {
        const compile = focusProgress(ctx, api, 'sg-cost-compile'),
          mask = focusProgress(ctx, api, 'sg-cost-mask'),
          input = done('sg-cost-input');
        label(
          ctx,
          api,
          'Work categories · schematic widths, no timing measurement',
          960,
          280,
          themeColors.muted,
          28,
        );
        const lane = (name, y, parts) => {
          constructionText(ctx, api, name, 180, y + 45, 29, themeColors.ink);
          let x = 510;
          for (const [labelText, width, color, visible] of parts) {
            if (visible) {
              api.rect(ctx, x, y, width, 76, themeColors.panel, color, 8);
              label(ctx, api, labelText, x + width / 2, y + 48, color, 28);
            }
            x += width + 35;
          }
        };
        lane('Cold TTFT', 380, [
          ['compile', 350, themeColors.yellow, compile > 0],
          ['prefill', 650, themeColors.blue, true],
        ]);
        lane('Warm model', 570, [['model work', 720, themeColors.blue, true]]);
        if (mask > 0) {
          constructionText(ctx, api, 'Warm mask', 180, 745, 29, themeColors.ink);
          api.rect(ctx, 510, 700, 280, 76, themeColors.panel, themeColors.yellow, 8);
          label(ctx, api, 'mask', 650, 748, themeColors.yellow, 28);
          label(
            ctx,
            api,
            'same start · exposed wait depends on the join',
            1200,
            745,
            themeColors.yellow,
            28,
          );
        }
        if (input)
          constructionCode(
            ctx,
            api,
            'schema / descriptions → count actual input tokens',
            960,
            865,
            29,
            themeColors.cyan,
            'center',
          );
      } else if (currentBeat === 1) {
        box(
          ctx,
          api,
          'Historical report',
          ['November 2024 XGrammar', 'mask time < 40 µs', 'tested grammar-engine setup'],
          180,
          330,
          720,
          235,
          themeColors.blue,
        );
        box(
          ctx,
          api,
          'Constructed arithmetic',
          ['100 tokens / second', '10,000 µs / output token'],
          1040,
          330,
          700,
          235,
          themeColors.yellow,
        );
        if (done('sg-mask-cost'))
          constructionCode(
            ctx,
            api,
            '40 / 10,000 × 100 = 0.4%',
            960,
            790,
            45,
            themeColors.green,
            'center',
          );
      } else {
        const metrics = ['completion', 'schema', 'source truth', 'permission'];
        metrics.forEach((v, i) => {
          api.rect(
            ctx,
            250 + i * 380,
            375,
            290,
            320,
            themeColors.panel,
            i < 2 ? themeColors.blue : themeColors.yellow,
            12,
          );
          label(ctx, api, v, 395 + i * 380, 445, i < 2 ? themeColors.blue : themeColors.yellow, 29);
          label(ctx, api, 'measure', 395 + i * 380, 590, themeColors.muted, 28);
        });
        label(
          ctx,
          api,
          'No current pass rates were measured here',
          960,
          805,
          themeColors.muted,
          30,
        );
        label(
          ctx,
          api,
          '2024 format study ≠ current strict-schema validation',
          960,
          890,
          themeColors.yellow,
          30,
        );
      }
      constructionFooter(
        ctx,
        api,
        'Historical mask time and local comparison do not establish end-to-end task quality.',
      );
    });
  }
}
export default {
  id: 'quality-measure',
  draw: drawQualityMeasure,
  cues: [
    'sg-quality-measure-0',
    'sg-cost-compile',
    'sg-cost-mask',
    'sg-cost-input',
    'sg-quality-measure-1',
    'sg-mask-cost',
    'sg-quality-measure-2',
  ],
};
