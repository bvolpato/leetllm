import { EVENTS } from '../fixtures.mjs';
import { observationCue } from '../construction.mjs';
import {
  drawCells,
  drawChapterCard,
  drawChapterText,
  drawHeading,
  drawLine,
  drawRectangle,
  withTarget,
} from '../defaults.mjs';
export function drawReviewAsof(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (beat, n) => observationCue(state, 'review-asof', beat, n),
    resultComplete = (beat, n) => progress(beat, n) === 1;
  {
    if (currentBeat === 0) {
      drawHeading(ctx, api, 'Illustrative as-of clock · evaluator E1 · fixed cohort');
      withTarget(ctx, api, 'snapshot-clock', () => {
        const x = (t) => 200 + 23 * t;
        drawLine(ctx, api, x(0), 540, x(65), 540, themeColors.muted);
        for (const [t, label, color] of [
          [10, 'Request 205 finishes', themeColors.blue],
          [30, 'Snapshot cutoff', themeColors.yellow],
          [60, 'Review available', themeColors.pink],
        ]) {
          drawLine(ctx, api, x(t), 510, x(t), 570, color);
          drawChapterText(ctx, api, t + 's', x(t), 610, 28, color, 'center');
          drawChapterText(ctx, api, label, x(t), t === 30 ? 420 : 710, 27, color, 'center');
        }
        if (resultComplete(0, 3)) {
          drawRectangle(
            ctx,
            api,
            x(30),
            470,
            x(60) - x(30),
            40,
            themeColors.panel,
            themeColors.pink,
          );
          drawChapterText(
            ctx,
            api,
            'Review excluded from the earlier snapshot',
            140,
            850,
            33,
            themeColors.pink,
          );
        }
        if (resultComplete(0, 4))
          drawChapterText(
            ctx,
            api,
            'At cutoff 30: unsafe verdict omitted · pending',
            140,
            955,
            32,
            themeColors.yellow,
          );
      });
    } else if (currentBeat === 1) {
      drawHeading(ctx, api, 'Receipt updates its existing request row');
      withTarget(ctx, api, 'receipt-upsert', () => {
        const q = progress(1, 1);
        EVENTS.forEach((e, i) => {
          const x = 140 + (i % 3) * 550,
            y = 355 + Math.floor(i / 3) * 180;
          drawChapterCard(
            ctx,
            api,
            'request ' + e.id,
            e.id === '205' && resultComplete(1, 1) ? 'unsafe: true' : 'same final event',
            x,
            y,
            500,
            e.id === '205' ? themeColors.pink : themeColors.blue,
            125,
          );
        });
        drawChapterCard(
          ctx,
          api,
          'Review receipt 205',
          resultComplete(1, 2) ? 'Exact receipt replay' : 'unsafe: true · evaluator E1',
          140 + 770 * q,
          780,
          750,
          themeColors.cyan,
          125,
        );
        drawChapterText(ctx, api, 'Final request rows: 6', 140, 980, 35, themeColors.green);
        if (resultComplete(1, 2))
          drawChapterText(
            ctx,
            api,
            'Second receipt arrival · same row, no appended request',
            140,
            930,
            29,
            themeColors.yellow,
          );
      });
    } else {
      drawHeading(ctx, api, 'Three rates preserve three populations');
      const ready = resultComplete(2, 4);
      withTarget(ctx, api, 'review-coverage', () =>
        drawChapterCard(
          ctx,
          api,
          'Review coverage',
          ready ? '8 / 10 = 80%' : 'reviewed / ingress',
          140,
          385,
          510,
          themeColors.blue,
          180,
          30,
        ),
      );
      withTarget(ctx, api, 'review-risk', () =>
        drawChapterCard(
          ctx,
          api,
          'Reviewed unsafe rate',
          ready ? '1 / 8 = 12.5%' : 'unsafe / reviewed',
          705,
          385,
          510,
          themeColors.pink,
          180,
          30,
        ),
      );
      withTarget(ctx, api, 'conditional-risk', () => {
        drawChapterCard(
          ctx,
          api,
          'Conditional answer risk',
          ready ? '1 / 5 = 20%' : 'unsafe / reviewed delivery',
          1270,
          385,
          510,
          themeColors.yellow,
          180,
          28,
        );
        if (progress(2, 4) > 0) {
          drawCells(
            ctx,
            api,
            Array.from(
              {
                length: 10,
              },
              (_, i) => (i < 8 ? 'reviewed' : 'pending'),
            ),
            140,
            705,
            1640,
            95,
            Array.from(
              {
                length: 10,
              },
              (_, i) =>
                i < 5
                  ? i === 0
                    ? themeColors.pink
                    : themeColors.blue
                  : i < 8
                    ? themeColors.green
                    : themeColors.muted,
            ),
          );
          drawChapterText(
            ctx,
            api,
            '10 ingress · 8 reviewed · 5 reviewed deliveries · 1 unsafe',
            140,
            925,
            31,
            themeColors.cyan,
          );
        }
      });
    }
  }
  return true;
}
export default {
  id: 'review-asof',
  draw: drawReviewAsof,
  cues: [
    'ob-review-asof-1-1',
    'ob-review-asof-1-2',
    'ob-review-asof-1-3',
    'ob-review-asof-1-4',
    'ob-review-asof-2-1',
    'ob-review-asof-2-2',
    'ob-review-asof-2-3',
    'ob-review-asof-2-4',
    'ob-review-asof-3-1',
    'ob-review-asof-3-2',
    'ob-review-asof-3-3',
    'ob-review-asof-3-4',
  ],
};
