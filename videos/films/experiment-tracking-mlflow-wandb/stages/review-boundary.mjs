import { clause } from '../construction.mjs';
import { canaryAction, runs, verifyRun } from '../model.mjs';
import { drawCoreCell, drawCoreNote, drawCoreText } from '../defaults.mjs';
export function drawReviewBoundary(ctx, scene, state, api) {
  api.focus.target('tr-review-boundary-trace', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat,
      op = (beat, n) => clause(state, 'review-boundary', beat, n, api),
      done = (beat, n) => op(beat, n) >= 1;
    {
      if (currentBeat === 0) {
        const decisions = runs.map(verifyRun);
        drawCoreText(
          ctx,
          api,
          'Nomination is separate from production activation',
          150,
          285,
          34,
          themeColors.cyan,
        );
        decisions.forEach((r, i) => {
          const y = 400 + i * 150;
          drawCoreCell(ctx, api, 'run-' + (i + 1), 150, y, 380, 90, themeColors.blue);
          drawCoreText(
            ctx,
            api,
            r.unsafe
              ? 'unsafe routing'
              : r.unnecessary
                ? 'unnecessary abstention'
                : 'development counters clear',
            700,
            y + 55,
            32,
            r.unsafe || r.unnecessary ? themeColors.pink : themeColors.green,
          );
        });
        drawCoreNote(ctx, api, 'Zero or multiple qualifying records make the fixture helper raise');
      } else {
        drawCoreText(
          ctx,
          api,
          'Future canary rule · reviewed claim outcomes',
          150,
          285,
          34,
          themeColors.cyan,
        );
        const rows = [
          {
            unsafe: 1,
            complete: false,
            at: 1,
          },
          {
            unsafe: 0,
            complete: false,
            at: 2,
          },
          {
            unsafe: 0,
            complete: true,
            at: 3,
          },
        ];
        rows.forEach((r, i) => {
          const y = 405 + i * 160;
          drawCoreCell(
            ctx,
            api,
            'Unsafe ' + r.unsafe + ' · review ' + (r.complete ? 'complete' : 'incomplete'),
            150,
            y,
            940,
            95,
            themeColors.blue,
          );
          if (done(1, r.at))
            drawCoreText(
              ctx,
              api,
              canaryAction(r.unsafe, r.complete),
              1230,
              y + 59,
              30,
              r.unsafe ? themeColors.pink : r.complete ? themeColors.green : themeColors.yellow,
            );
        });
        drawCoreNote(
          ctx,
          api,
          'Production stays on known-good; canary abort prevents a production move',
        );
      }
    }
  });
}
export default {
  id: 'review-boundary',
  draw: drawReviewBoundary,
  cues: [
    'tr-review-boundary-0-0',
    'tr-review-boundary-0-1',
    'tr-review-boundary-0-2',
    'tr-review-boundary-0-3',
    'tr-review-boundary-0-4',
    'tr-review-boundary-1-0',
    'tr-review-boundary-1-1',
    'tr-review-boundary-1-2',
    'tr-review-boundary-1-3',
    'tr-review-boundary-1-4',
    'tr-review-boundary-1-5',
  ],
};
