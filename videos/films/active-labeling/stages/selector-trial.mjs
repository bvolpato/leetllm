import {
  cueComplete,
  cueVisible,
  detailFooter,
  detailHeading,
  detailLine,
  detailRectangle,
  detailRow,
  detailTarget,
  detailText,
} from '../defaults.mjs';
export function drawSelectorTrial(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const { C: themeColors } = api;
  {
    if (currentBeat === 0) {
      detailHeading(ctx, api, 'Run comparable training branches before claiming label efficiency');
      const paired = cueVisible(ctx, api, 'paired-experiment'),
        seeds = cueVisible(ctx, api, 'seed-differences');
      const root = detailRectangle(ctx, api, 700, 360, 520, 110, themeColors.yellow);
      detailText(
        ctx,
        api,
        'Same starting checkpoint θ₀',
        960,
        430,
        32,
        themeColors.yellow,
        'center',
      );
      ['Random training batch', 'Selected training batch'].forEach((s, i) => {
        const x = 170 + i * 900;
        const a = detailRectangle(
          ctx,
          api,
          x,
          610,
          680,
          180,
          i ? themeColors.cyan : themeColors.blue,
        );
        detailText(
          ctx,
          api,
          s,
          x + 340,
          680,
          31,
          i ? themeColors.cyan : themeColors.blue,
          'center',
        );
        if (paired) {
          api.connect(ctx, root, a, {
            color: i ? themeColors.cyan : themeColors.blue,
            gap: 18,
          });
          detailText(
            ctx,
            api,
            '400 accepted labels · same rubric / reviewers',
            x + 340,
            745,
            25,
            themeColors.muted,
            'center',
          );
        }
      });
      detailTarget(ctx, api, 'paired-experiment', () => {
        if (paired)
          detailText(
            ctx,
            api,
            'Matched training settings → same independent evaluation',
            960,
            895,
            31,
            themeColors.green,
            'center',
          );
      });
      detailTarget(ctx, api, 'seed-differences', () => {
        if (seeds)
          detailText(
            ctx,
            api,
            'Repeat seeds; report paired gain differences and their spread',
            960,
            975,
            29,
            themeColors.yellow,
            'center',
          );
      });
      detailFooter(ctx, api, 'Named category coverage remains a proxy until behavior is measured.');
    } else if (currentBeat === 1) {
      detailHeading(
        ctx,
        api,
        'Compute the supplied score illustration, then include its full cost',
      );
      const gain = cueComplete(ctx, api, 'score-gain'),
        eff = cueComplete(ctx, api, 'label-efficiency'),
        cost = cueVisible(ctx, api, 'full-cost');
      detailText(
        ctx,
        api,
        'Validation score · 61% starting point',
        960,
        345,
        29,
        themeColors.muted,
        'center',
      );
      const x = (v) => 500 + (v - 61) * 135;
      detailLine(ctx, api, 500, 780, 1715, 780, themeColors.muted, 3);
      [61, 64, 68, 70].forEach((v) => {
        detailLine(ctx, api, x(v), 760, x(v), 800, themeColors.muted, 3);
        detailText(ctx, api, v + '%', x(v), 850, 27, themeColors.muted, 'center');
      });
      [
        ['Random', 64, themeColors.blue],
        ['Hybrid', 68, themeColors.cyan],
      ].forEach(([name, v, col], i) => {
        detailText(ctx, api, name, 180, 470 + i * 180, 33, col);
        detailTarget(ctx, api, 'score-gain', () => {
          if (gain) {
            detailRectangle(ctx, api, 500, 425 + i * 180, x(v) - 500, 70, col, col);
            detailText(
              ctx,
              api,
              '+' + (v - 61) + ' pp',
              x(v) + 80,
              478 + i * 180,
              31,
              col,
              'center',
            );
          } else
            detailText(
              ctx,
              api,
              'Gain pending',
              1050,
              478 + i * 180,
              29,
              themeColors.muted,
              'center',
            );
        });
      });
      detailTarget(ctx, api, 'label-efficiency', () => {
        if (eff) {
          detailText(
            ctx,
            api,
            '400 / 3 = 133.3 labels / pp',
            530,
            930,
            29,
            themeColors.blue,
            'center',
          );
          detailText(
            ctx,
            api,
            '400 / 7 = 57.1 labels / pp',
            1390,
            930,
            29,
            themeColors.cyan,
            'center',
          );
        } else
          detailText(
            ctx,
            api,
            'Paired label efficiencies pending',
            960,
            930,
            29,
            themeColors.muted,
            'center',
          );
      });
      detailTarget(ctx, api, 'full-cost', () => {
        if (cost)
          detailFooter(
            ctx,
            api,
            'Add rejected attempts, triage, adjudication, review time and compute.',
          );
      });
    } else {
      detailHeading(ctx, api, 'Repeated private-test tuning adapts to the answer key');
      const adapted = cueVisible(ctx, api, 'test-adaptation'),
        sampling = cueVisible(ctx, api, 'sampling-record');
      const dev = detailRectangle(ctx, api, 140, 390, 680, 300, themeColors.blue),
        test = detailRectangle(
          ctx,
          api,
          1100,
          390,
          680,
          300,
          adapted ? themeColors.pink : themeColors.yellow,
        );
      detailText(ctx, api, 'VALIDATION', 480, 455, 35, themeColors.blue, 'center');
      detailText(ctx, api, 'Tune λ and checkpoints', 480, 550, 32, themeColors.blue, 'center');
      detailText(
        ctx,
        api,
        'PRIVATE TEST',
        1440,
        455,
        35,
        adapted ? themeColors.pink : themeColors.yellow,
        'center',
      );
      detailText(
        ctx,
        api,
        adapted ? 'Results reused to tune λ' : 'Reserved independent assessment',
        1440,
        550,
        30,
        adapted ? themeColors.pink : themeColors.muted,
        'center',
      );
      detailTarget(ctx, api, 'test-adaptation', () => {
        if (adapted) {
          api.connect(ctx, test, dev, {
            color: themeColors.pink,
            gap: 22,
          });
          detailText(
            ctx,
            api,
            'No copied test row is required for this adaptive overfit.',
            960,
            790,
            32,
            themeColors.pink,
            'center',
          );
        }
      });
      detailTarget(ctx, api, 'sampling-record', () => {
        if (sampling)
          detailRow(
            ctx,
            api,
            'Retain selector / inclusion policy / split / model and rubric versions',
            150,
            885,
            1620,
            themeColors.cyan,
          );
      });
      detailFooter(ctx, api, 'Use a fresh independent test for the final tuned-selector claim.');
    }
  }
  return;
}
export default {
  id: 'selector-trial',
  draw: drawSelectorTrial,
  cues: [
    'paired-experiment',
    'seed-differences',
    'score-gain',
    'label-efficiency',
    'full-cost',
    'test-adaptation',
    'sampling-record',
  ],
};
