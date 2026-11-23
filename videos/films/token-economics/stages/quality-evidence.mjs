import {
  drawChapterBar,
  drawChapterFooter,
  drawChapterLine,
  drawChapterRows,
  drawChapterText,
} from '../defaults.mjs';
import {
  citedAnswersPassed,
  qualityRate,
  reviewedAnswers,
  reviewedHits,
  unsafeHits,
} from '../fixtures.mjs';
export function drawQualityEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = api.clamp(state.beatP ?? 0),
    cue = state.cues?.['te-quality-evidence-' + currentBeat],
    u = cue ? api.clamp(cue.progress) : api.clamp(q / 0.82),
    done = u >= 1;
  api.focus.target('te-quality-evidence-mechanism', () => {
    if (currentBeat < 2) {
      const unsafe = currentBeat === 1 && u >= 1 ? 1 : unsafeHits;
      drawChapterRows(
        ctx,
        api,
        [
          {
            label: 'Cited answers',
            value:
              citedAnswersPassed.toLocaleString('en-US') +
              ' / ' +
              reviewedAnswers.toLocaleString('en-US') +
              ' · ' +
              (100 * qualityRate).toFixed(1) +
              '%',
            color: themeColors.green,
          },
          {
            label: 'Reviewed stored-answer hits',
            value: reviewedHits.toLocaleString('en-US') + ' ≥ minimum 1,000',
            color: themeColors.cyan,
          },
          {
            label: 'Observed unsafe hits',
            value: unsafe + ' / ' + reviewedHits.toLocaleString('en-US'),
            color: unsafe ? themeColors.pink : themeColors.green,
          },
        ],
        410,
        165,
      );
      drawChapterBar(ctx, api, 310, 480, 1300, 40, qualityRate, themeColors.green);
      drawChapterText(
        ctx,
        api,
        unsafe
          ? 'One unsafe hit → HOLD despite the mean'
          : 'Current release + schema + complete evidence + age ≤ 1 hour',
        960,
        920,
        31,
        unsafe ? themeColors.pink : themeColors.yellow,
      );
    } else {
      const n = Math.round(100 + 1100 * u),
        upper = 1 - Math.pow(0.05, 1 / n),
        x = 280,
        y = 835,
        w = 1330,
        h = 390;
      drawChapterLine(ctx, api, x, y, x + w, y, themeColors.muted);
      drawChapterLine(ctx, api, x, y, x, y - h, themeColors.muted);
      const ps = Array.from(
        {
          length: 61,
        },
        (_, i) => {
          const size = 100 + (i / 60) * 1100;
          return {
            x: x + ((size - 100) / 1100) * w,
            y: y - ((1 - Math.pow(0.05, 1 / size)) / 0.03) * h,
          };
        },
      );
      api.path(ctx, ps, {
        color: themeColors.cyan,
        width: 4,
      });
      const cx = x + ((n - 100) / 1100) * w,
        cy = y - (upper / 0.03) * h;
      api.circle(ctx, cx, cy, 10, themeColors.yellow);
      drawChapterText(
        ctx,
        api,
        'Zero-failure worksheet · hypothetical n = ' + n,
        960,
        330,
        35,
        themeColors.ink,
      );
      drawChapterText(
        ctx,
        api,
        'Exact one-sided 95% upper rate: ' + (upper * 100).toFixed(3) + '%',
        960,
        935,
        34,
        themeColors.yellow,
      );
      if (done)
        drawChapterText(
          ctx,
          api,
          '3 / 1,200 ≈ 0.25% · about 8 EXPECTED in 3,200',
          960,
          395,
          31,
          themeColors.yellow,
        );
      drawChapterText(ctx, api, '100', x, 890, 25, themeColors.muted);
      drawChapterText(ctx, api, '1,200', x + w, 890, 25, themeColors.muted);
    }
    if (currentBeat === 2)
      drawChapterFooter(ctx, api, 'The curve assumes independent, representative reviews.');
  });
}
export default {
  id: 'quality-evidence',
  draw: drawQualityEvidence,
  cues: ['te-quality-evidence-0', 'te-quality-evidence-1', 'te-quality-evidence-2'],
};
