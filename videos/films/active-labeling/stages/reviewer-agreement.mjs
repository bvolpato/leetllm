import { reviewMatrix } from '../fixtures.mjs';
import { agreementConstruction, phase, sampleModel } from '../construction.mjs';
import { equation, text } from '../defaults.mjs';
export function drawReviewerAgreement(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    beat = state.beat,
    progress = state.beatP,
    q = phase(progress),
    modelState = sampleModel('reviewer-agreement', state);
  {
    const frame = agreementConstruction(state),
      categories = ['A better', 'B better', 'Tie'];
    text(ctx, api, 'Reviewer 2 categories', 660, 245, 29, themeColors.muted, 'center');
    categories.forEach((label, i) => {
      text(ctx, api, label, 420 + i * 240, 310, 25, themeColors.muted, 'center');
      text(ctx, api, label, 170, 425 + i * 120, 25, themeColors.muted, 'center');
    });
    api.focus.target('review-table', () =>
      teaching.grid({
        x: 300,
        y: 350,
        width: 720,
        height: 360,
        rows: 3,
        columns: 3,
        labels: reviewMatrix.map((row) => row.map(String)),
        fill: themeColors.panel,
        stroke: themeColors.blue,
        fontSize: 38,
        textColor: themeColors.ink,
        highlights: reviewMatrix.flatMap((row, i) =>
          row.map((_, j) => ({
            row: i,
            column: j,
            fill: i === j ? themeColors.green : themeColors.pink,
            opacity: i === j && i < frame.diagonal ? 0.26 : beat === 2 && i !== j ? 0.24 : 0,
          })),
        ),
      }),
    );
    text(ctx, api, `${frame.total} paired reviews`, 1510, 300, 30, themeColors.ink, 'center');
    text(
      ctx,
      api,
      frame.diagonal === 3 ? 'Matching decisions' : 'Partial diagonal sum',
      1510,
      385,
      28,
      themeColors.green,
      'center',
    );
    api.focus.target('matched-count', () =>
      teaching.changeCue(
        {
          x: 1260,
          y: 410,
          width: 500,
          height: 70,
          from: 0,
          to: frame.matched,
          progress: 1,
          color: themeColors.green,
          emphasis: beat === 0 && progress >= 0.74 && progress < 0.94 ? 0.75 : 0,
        },
        (value) =>
          text(ctx, api, `${value.value} / ${frame.total}`, 1510, 460, 36, value.color, 'center'),
      ),
    );
    if (beat > 0) {
      text(ctx, api, 'Row count', 1100, 310, 25, themeColors.muted, 'center');
      text(ctx, api, 'Column', 170, 750, 24, themeColors.muted, 'center');
      text(ctx, api, 'count', 170, 785, 24, themeColors.muted, 'center');
      frame.rows.forEach((n, i) =>
        api.focus.target('review-marginals', () =>
          text(
            ctx,
            api,
            String(n),
            1100,
            425 + i * 120,
            28,
            beat === 1 && progress < 0.4 && i === frame.terms - 1
              ? themeColors.yellow
              : themeColors.muted,
            'center',
          ),
        ),
      );
      frame.cols.forEach((n, i) =>
        api.focus.target('review-marginals', () =>
          text(
            ctx,
            api,
            String(n),
            420 + i * 240,
            780,
            28,
            beat === 1 && progress < 0.4 && i === frame.terms - 1
              ? themeColors.yellow
              : themeColors.muted,
            'center',
          ),
        ),
      );
      text(
        ctx,
        api,
        `Observed agreement: ${frame.observed.toFixed(3)}`,
        1510,
        535,
        28,
        themeColors.green,
        'center',
      );
      const current = Math.max(0, frame.terms - 1);
      if (frame.terms > 0)
        api.focus.target('chance-agreement', () =>
          equation(
            ctx,
            api,
            frame.terms === 3
              ? String.raw`p_e=\frac{46\cdot48+44\cdot42+30\cdot30}{120^2}`
              : String.raw`\frac{${frame.rows[current]}}{120}\cdot\frac{${frame.cols[current]}}{120}=${frame.contributions[current].toFixed(3)}`,
            1510,
            635,
            32,
            themeColors.yellow,
          ),
        );
      text(
        ctx,
        api,
        frame.terms === 3 ? 'Chance agreement' : 'Chance partial sum',
        1510,
        710,
        28,
        themeColors.yellow,
        'center',
      );
      api.focus.target('chance-agreement', () =>
        teaching.changeCue(
          {
            x: 1260,
            y: 735,
            width: 500,
            height: 65,
            from: 0,
            to: frame.partialChance,
            progress: 1,
            color: themeColors.yellow,
            emphasis: beat === 1 && progress >= 0.16 && progress < 0.36 ? 0.75 : 0,
          },
          (value) => text(ctx, api, value.value.toFixed(3), 1510, 780, 36, value.color, 'center'),
        ),
      );
      api.focus.target('kappa', () => {
        if (
          state.cues?.['kappa-result']
            ? api.focus.progress('kappa-result', 0) === 1
            : frame.kappaReady
        )
          equation(
            ctx,
            api,
            String.raw`\kappa=\frac{p_o-p_e}{1-p_e}=${frame.kappa.toFixed(3)}`,
            1510,
            895,
            35,
            themeColors.green,
          );
        else
          text(ctx, api, 'Kappa calculation pending', 1510, 895, 27, themeColors.muted, 'center');
      });
    }
    text(
      ctx,
      api,
      beat === 2
        ? `${frame.disagreements} off-diagonal cases need inspection`
        : 'Sum the diagonal for agreement; pair the marginals for chance agreement.',
      960,
      1010,
      28,
      themeColors.ink,
      'center',
    );
  }
}
export default {
  id: 'reviewer-agreement',
  draw: drawReviewerAgreement,
  cues: [
    'review-table',
    'matching-diagonal',
    'chance-proportions',
    'kappa-result',
    'inspect-disagreement',
    'exact-counts',
    'chance-counts',
  ],
};
