import { openingCrawlerTrace, sampleOriginalModel } from '../construction.mjs';
import { drawCard, drawText } from '../defaults.mjs';
export function drawOpening(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleOriginalModel('opening', state);
  {
    const trace = openingCrawlerTrace(state),
      color = trace.safe ? themeColors.green : themeColors.pink;
    drawText(
      ctx,
      api,
      'Shared logical step ' + trace.events.length + ' / ' + (trace.safe ? 3 : 6),
      1260,
      910,
      25,
      themeColors.muted,
      'center',
    );
    api.focus.target('opening-first-queue', () =>
      drawCard(ctx, api, 'First queue: /start', 140, 320, 440, themeColors.blue, 90, 29),
    );
    api.focus.target('opening-baseline', () => {
      drawCard(
        ctx,
        api,
        trace.safe ? 'Previous unsafe run' : 'Single-worker test',
        140,
        500,
        440,
        trace.safe ? themeColors.pink : themeColors.green,
        100,
        29,
      );
      drawCard(
        ctx,
        api,
        trace.safe ? 'Same page: 2 fetches' : 'Worker A: 1 fetch',
        140,
        655,
        440,
        trace.safe ? themeColors.pink : themeColors.green,
        95,
        29,
      );
    });
    drawText(
      ctx,
      api,
      trace.safe ? 'Atomic claim before fetch' : 'Unsafe check, then write',
      1260,
      265,
      32,
      color,
      'center',
    );
    api.focus.target('opening-worker-race', () => {
      const seen = drawCard(
        ctx,
        api,
        'Seen /guide: ' + (trace.stored ? 'present' : 'absent'),
        1000,
        325,
        500,
        trace.stored ? themeColors.yellow : themeColors.blue,
        90,
        29,
      );
      trace.workers.forEach((row, i) => {
        const x = 750 + i * 530,
          status = row.skipped
            ? 'duplicate skipped'
            : row.claimed && trace.safe
              ? 'claim won'
              : row.read
                ? 'observed absent'
                : 'check pending';
        const worker = drawCard(
          ctx,
          api,
          'Worker ' + row.worker + ' · /guide\n' + status,
          x,
          510,
          440,
          row.skipped ? themeColors.muted : row.read ? themeColors.yellow : themeColors.blue,
          150,
          27,
        );
        if (row.read)
          api.connect(ctx, seen, worker, {
            color: row.skipped ? themeColors.muted : themeColors.yellow,
            gap: 14,
            width: 3,
          });
        drawText(
          ctx,
          api,
          'PC: ' +
            (row.fetched || row.skipped
              ? 'done'
              : row.claimed
                ? 'fetch'
                : row.read
                  ? 'insert'
                  : 'check'),
          x + 20,
          685,
          22,
          themeColors.muted,
        );
        const result = drawCard(
          ctx,
          api,
          row.fetched
            ? 'Fetch ' + (i + 1) + ' · /guide'
            : row.skipped
              ? 'No second fetch'
              : 'Fetch pending',
          x,
          700,
          440,
          row.fetched ? color : row.skipped ? themeColors.green : themeColors.muted,
          95,
          29,
        );
        if (row.fetched)
          api.connect(ctx, worker, result, {
            color,
            gap: 14,
            width: 4,
          });
      });
      drawText(
        ctx,
        api,
        'Fetch count: ' + trace.fetches + ' · claim owners: ' + trace.owners,
        1260,
        850,
        32,
        color,
        'center',
      );
    });
    if (trace.safe) {
      api.focus.reveal('opening-expiration-deadline', () =>
        api.focus.target('opening-deadline', () =>
          drawCard(ctx, api, 'Expires: 15.000 s', 140, 925, 500, themeColors.cyan, 82, 28),
        ),
      );
      api.focus.reveal('opening-attempt-budget', () =>
        api.focus.target('opening-attempt-count', () =>
          drawCard(ctx, api, 'Test: attempt 1 of 2', 705, 925, 500, themeColors.yellow, 82, 28),
        ),
      );
      api.focus.reveal('opening-beat-2-focus-2', () =>
        api.focus.target('opening-request-key', () =>
          drawCard(ctx, api, 'Key: deposit-1', 1270, 925, 500, themeColors.green, 82, 28),
        ),
      );
    } else
      drawText(
        ctx,
        api,
        'Schedule: both checks precede either insert',
        1260,
        955,
        28,
        themeColors.muted,
        'center',
      );
  }
}
export default {
  id: 'opening',
  draw: drawOpening,
  cues: [
    'opening-first-test',
    'opening-beat-1-focus-1',
    'opening-beat-1-focus-2',
    'opening-claim-once',
    'opening-beat-2-focus-1',
    'opening-expiration-deadline',
    'opening-attempt-budget',
    'opening-beat-2-focus-2',
  ],
};
