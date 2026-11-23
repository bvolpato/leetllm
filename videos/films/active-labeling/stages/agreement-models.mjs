import { fleissFixture } from '../model.mjs';
import {
  cueComplete,
  cueVisible,
  detailArrow,
  detailEquation,
  detailFooter,
  detailHeading,
  detailLine,
  detailRectangle,
  detailRow,
  detailTarget,
  detailText,
} from '../defaults.mjs';
export function drawAgreementModels(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const { C: themeColors } = api;
  {
    if (currentBeat === 0) {
      detailHeading(ctx, api, 'Raw agreement must beat its category-mix baseline');
      const rate = cueComplete(ctx, api, 'base-rate'),
        result = cueComplete(ctx, api, 'small-kappa'),
        undef = cueVisible(ctx, api, 'undefined-kappa');
      if (!undef) {
        const x = 180,
          y = 390,
          w = 700,
          h = 420,
          wx = 0.92 * w,
          hy = 0.88 * h;
        detailRectangle(ctx, api, x, y, w, h, themeColors.muted);
        detailRectangle(ctx, api, x, y, wx, hy, themeColors.green, themeColors.green);
        detailRectangle(ctx, api, x + wx, y, w - wx, hy, themeColors.pink, themeColors.pink);
        detailRectangle(ctx, api, x, y + hy, wx, h - hy, themeColors.pink, themeColors.pink);
        detailRectangle(
          ctx,
          api,
          x + wx,
          y + hy,
          w - wx,
          h - hy,
          themeColors.green,
          themeColors.green,
        );
        detailText(
          ctx,
          api,
          'Rater 1: approve .92 / reject .08',
          530,
          345,
          29,
          themeColors.blue,
          'center',
        );
        detailText(
          ctx,
          api,
          'Rater 2: approve .88 / reject .12',
          530,
          875,
          29,
          themeColors.blue,
          'center',
        );
        detailTarget(ctx, api, 'base-rate', () => {
          if (rate) {
            detailEquation(
              ctx,
              api,
              'p_e=.92(.88)+.08(.12)=.8192',
              1360,
              485,
              38,
              themeColors.yellow,
            );
            detailText(
              ctx,
              api,
              'Independent-marginal comparison',
              1360,
              575,
              28,
              themeColors.muted,
              'center',
            );
          } else
            detailText(
              ctx,
              api,
              'Independent-marginal total pending',
              1360,
              485,
              27,
              themeColors.muted,
              'center',
            );
        });
        detailTarget(ctx, api, 'small-kappa', () => {
          if (result) {
            detailEquation(
              ctx,
              api,
              String.raw`\kappa=\frac{.84-.8192}{1-.8192}=.115044`,
              1360,
              730,
              42,
              themeColors.pink,
            );
          } else
            detailText(
              ctx,
              api,
              'Chance-corrected coefficient pending',
              1360,
              730,
              27,
              themeColors.muted,
              'center',
            );
        });
        detailText(
          ctx,
          api,
          'Area represents the stated independent-marginal model.',
          530,
          940,
          25,
          themeColors.muted,
          'center',
        );
      } else
        detailTarget(ctx, api, 'undefined-kappa', () => {
          detailText(
            ctx,
            api,
            'Both reviewers use only A',
            960,
            445,
            40,
            themeColors.green,
            'center',
          );
          detailRectangle(ctx, api, 260, 520, 1400, 90, themeColors.green, themeColors.green);
          detailEquation(
            ctx,
            api,
            String.raw`p_o=p_e=1\quad\Rightarrow\quad\kappa=\frac{0}{0}`,
            960,
            735,
            54,
            themeColors.pink,
          );
          detailText(
            ctx,
            api,
            'UNDEFINED · retain the category counts',
            960,
            890,
            36,
            themeColors.pink,
            'center',
          );
        });
      detailFooter(ctx, api, 'Chance correction measures consistency, not correctness.');
    } else if (currentBeat === 1) {
      detailHeading(ctx, api, 'Construct Fleiss agreement from the actual 12 ratings');
      const f = fleissFixture(),
        table = cueVisible(ctx, api, 'rating-table'),
        pairs = cueVisible(ctx, api, 'ordered-pairs'),
        answer = cueComplete(ctx, api, 'fleiss-result'),
        colors = [themeColors.blue, themeColors.cyan, themeColors.yellow];
      ['A better', 'B better', 'Tie'].forEach((s, i) =>
        detailText(ctx, api, s, 400 + i * 190, 350, 26, colors[i], 'center'),
      );
      detailTarget(ctx, api, 'rating-table', () => {
        if (table)
          f.rows.forEach((r, i) => {
            detailText(ctx, api, 'Item ' + (i + 1), 170, 440 + i * 115, 28, themeColors.muted);
            r.forEach((n, j) => {
              detailRectangle(ctx, api, 330 + j * 190, 390 + i * 115, 140, 80, colors[j]);
              detailText(
                ctx,
                api,
                String(n),
                400 + j * 190,
                445 + i * 115,
                36,
                colors[j],
                'center',
              );
            });
          });
      });
      detailTarget(ctx, api, 'ordered-pairs', () => {
        if (pairs)
          f.rows.forEach((r, i) => {
            detailText(
              ctx,
              api,
              '(' + r.map((n) => (n ? n + '×' + (n - 1) : '0')).join(' + ') + ') / 6',
              1210,
              435 + i * 115,
              28,
              themeColors.yellow,
              'center',
            );
            detailText(
              ctx,
              api,
              '= ' + (f.agreements[i] === 1 ? '1' : '1/3'),
              1640,
              435 + i * 115,
              32,
              themeColors.green,
              'center',
            );
          });
      });
      if (pairs) {
        detailText(
          ctx,
          api,
          'Pooled counts: 4 / 5 / 3 · 12 ratings',
          960,
          900,
          29,
          themeColors.cyan,
          'center',
        );
      }
      detailTarget(ctx, api, 'fleiss-result', () => {
        if (answer)
          detailEquation(
            ctx,
            api,
            String.raw`\bar P=\frac23,\quad P_e=\frac{50}{144},\quad\kappa=\frac{23}{47}=.489362`,
            960,
            970,
            39,
            themeColors.green,
          );
        else
          detailText(
            ctx,
            api,
            'Pooled chance and Fleiss coefficient pending',
            960,
            970,
            29,
            themeColors.muted,
            'center',
          );
      });
      detailFooter(
        ctx,
        api,
        'Each category contributes count × (count − 1) agreeing ordered pairs.',
      );
    } else {
      detailHeading(
        ctx,
        api,
        'The chance model and disagreement distance follow the review design',
      );
      const change = cueVisible(ctx, api, 'chance-models'),
        ordinal = cueVisible(ctx, api, 'ordinal-distance');
      detailTarget(ctx, api, 'chance-models', () => {
        detailRow(
          ctx,
          api,
          'Cohen: two named reviewers → separate marginals',
          150,
          375,
          1620,
          themeColors.blue,
        );
        if (change)
          detailRow(
            ctx,
            api,
            'Fleiss: fixed ratings per item → pooled category proportions',
            150,
            485,
            1620,
            themeColors.cyan,
          );
      });
      detailTarget(ctx, api, 'ordinal-distance', () => {
        if (ordinal) {
          detailText(ctx, api, 'Ordered ratings', 280, 655, 29, themeColors.muted);
          [1, 2, 3, 4, 5].forEach((n, i) => {
            const x = 600 + i * 220;
            detailLine(ctx, api, x, 710, x, 750, themeColors.blue, 4);
            detailText(ctx, api, String(n), x, 815, 34, themeColors.blue, 'center');
          });
          detailArrow(ctx, api, 600, 680, 820, 680, themeColors.green);
          detailText(ctx, api, 'near disagreement', 710, 640, 26, themeColors.green, 'center');
          detailArrow(ctx, api, 600, 900, 1480, 900, themeColors.pink);
          detailText(
            ctx,
            api,
            'larger ordinal disagreement',
            1040,
            960,
            28,
            themeColors.pink,
            'center',
          );
        }
      });
      detailFooter(
        ctx,
        api,
        'Weighted Cohen handles two-rater ordinal distances; alpha can handle missing ratings.',
      );
    }
  }
  return;
}
export default {
  id: 'agreement-models',
  draw: drawAgreementModels,
  cues: [
    'base-rate',
    'small-kappa',
    'undefined-kappa',
    'rating-table',
    'ordered-pairs',
    'fleiss-result',
    'chance-models',
    'ordinal-distance',
  ],
};
