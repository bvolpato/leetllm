import {
  drawSupportArrow,
  drawSupportFooter,
  drawSupportHeading,
  drawSupportLine,
  drawSupportRectangle,
  drawSupportRow,
  drawSupportText,
  supportCueProgress,
  supportCueVisible,
  withSupportFocus,
} from '../defaults.mjs';
export function drawChannelsAndFences(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const { C: themeColors } = api;
  {
    if (currentBeat === 0) {
      drawSupportHeading(ctx, api, 'Two directions have different transports');
      const client = drawSupportRectangle(ctx, api, 130, 365, 390, 410, themeColors.blue),
        host = drawSupportRectangle(ctx, api, 1170, 365, 620, 410, themeColors.cyan);
      drawSupportText(ctx, api, 'Authenticated client', 325, 420, 30, themeColors.blue, 'center');
      drawSupportText(
        ctx,
        api,
        'Case supervisor · tenant T7',
        1480,
        420,
        30,
        themeColors.cyan,
        'center',
      );
      withSupportFocus(ctx, api, 'incoming-turn', () => {
        drawSupportText(
          ctx,
          api,
          'POST /cases/48291/turns',
          845,
          470,
          28,
          themeColors.blue,
          'center',
        );
        drawSupportArrow(ctx, api, 545, 510, 1145, 510, themeColors.blue);
        const x = 550 + 540 * supportCueProgress(ctx, api, 'incoming-turn');
        drawSupportRectangle(ctx, api, x, 485, 48, 48, themeColors.blue, themeColors.blue);
      });
      withSupportFocus(ctx, api, 'outgoing-sse', () => {
        drawSupportText(
          ctx,
          api,
          'SSE · case-status updates',
          845,
          610,
          28,
          themeColors.cyan,
          'center',
        );
        drawSupportArrow(ctx, api, 1145, 650, 545, 650, themeColors.cyan);
        const x = 1090 - 540 * supportCueProgress(ctx, api, 'outgoing-sse');
        drawSupportRectangle(ctx, api, x, 625, 48, 48, themeColors.cyan, themeColors.cyan);
      });
      withSupportFocus(ctx, api, 'dedup-event', () => {
        const v = supportCueVisible(ctx, api, 'dedup-event');
        drawSupportRow(ctx, api, 'Webhook event E204', 1230, 485, 500, themeColors.blue);
        drawSupportRow(
          ctx,
          api,
          v ? 'E204 replay → no new turn' : 'Event-ID admission pending',
          1230,
          585,
          500,
          v ? themeColors.yellow : themeColors.muted,
        );
        drawSupportText(ctx, api, 'Accepted turns', 325, 540, 27, themeColors.muted, 'center');
        drawSupportText(
          ctx,
          api,
          v ? '1' : '0',
          325,
          615,
          54,
          v ? themeColors.green : themeColors.muted,
          'center',
        );
      });
      drawSupportFooter(
        ctx,
        api,
        'Transport direction, event deduplication and intent each have a distinct contract.',
      );
      void client;
      void host;
    } else if (currentBeat === 1) {
      drawSupportHeading(ctx, api, 'An expired lease does not stop the old process');
      const expired = supportCueVisible(ctx, api, 'lease-expiry'),
        fenced = supportCueVisible(ctx, api, 'fencing-token'),
        rejected = supportCueVisible(ctx, api, 'reject-fence');
      drawSupportText(ctx, api, 'Ownership epochs', 160, 350, 28, themeColors.muted);
      drawSupportLine(ctx, api, 260, 510, 1650, 510, themeColors.muted, 4);
      drawSupportRectangle(
        ctx,
        api,
        270,
        390,
        500,
        80,
        expired ? themeColors.pink : themeColors.blue,
      );
      drawSupportRectangle(
        ctx,
        api,
        790,
        390,
        600,
        80,
        fenced ? themeColors.green : themeColors.muted,
      );
      drawSupportText(
        ctx,
        api,
        'Worker A · lease 17',
        520,
        440,
        30,
        expired ? themeColors.pink : themeColors.blue,
        'center',
      );
      drawSupportText(
        ctx,
        api,
        fenced ? 'Worker B · lease 18' : 'New owner arrives',
        1090,
        440,
        30,
        fenced ? themeColors.green : themeColors.muted,
        'center',
      );
      if (expired) {
        drawSupportLine(ctx, api, 770, 365, 770, 500, themeColors.pink, 4);
        drawSupportText(ctx, api, 'Lease expires', 770, 550, 28, themeColors.pink, 'center');
      }
      const resource = drawSupportRectangle(ctx, api, 1130, 640, 650, 210, themeColors.yellow);
      drawSupportText(
        ctx,
        api,
        'Protected database write',
        1455,
        690,
        31,
        themeColors.yellow,
        'center',
      );
      drawSupportText(
        ctx,
        api,
        fenced ? 'Highest accepted fence: 18' : 'Resource must check epoch',
        1455,
        755,
        29,
        themeColors.ink,
        'center',
      );
      withSupportFocus(ctx, api, 'lease-expiry', () => {
        drawSupportRow(
          ctx,
          api,
          'A is still running',
          170,
          640,
          590,
          expired ? themeColors.pink : themeColors.muted,
        );
        if (expired) drawSupportArrow(ctx, api, 785, 672, 1105, 720, themeColors.pink);
      });
      withSupportFocus(ctx, api, 'fencing-token', () => {
        if (fenced) {
          drawSupportRow(ctx, api, 'B writes with token 18', 170, 755, 590, themeColors.green);
          drawSupportArrow(ctx, api, 785, 790, 1105, 790, themeColors.green);
        }
      });
      withSupportFocus(ctx, api, 'reject-fence', () => {
        if (rejected)
          drawSupportText(
            ctx,
            api,
            '17 < 18 · stale write rejected',
            960,
            930,
            35,
            themeColors.pink,
            'center',
          );
      });
      drawSupportFooter(
        ctx,
        api,
        'Financial uniqueness lives in shared storage; short transactions protect state changes.',
      );
      void resource;
    } else {
      drawSupportHeading(ctx, api, 'One writer owns the case; workers return scoped observations');
      const jobs = supportCueVisible(ctx, api, 'scoped-jobs'),
        merged = supportCueVisible(ctx, api, 'merge-jobs'),
        sup = drawSupportRectangle(ctx, api, 130, 420, 480, 380, themeColors.yellow);
      drawSupportText(
        ctx,
        api,
        'CASE 48291 · revision 4',
        370,
        475,
        29,
        themeColors.yellow,
        'center',
      );
      drawSupportRow(ctx, api, 'Accepted state writer', 160, 535, 420, themeColors.yellow);
      drawSupportRow(
        ctx,
        api,
        merged ? '2 matching observations' : 'Awaiting validated receipts',
        160,
        660,
        420,
        merged ? themeColors.green : themeColors.muted,
      );
      ['Policy / US-v3', 'Invoice / A10234'].forEach((name, i) => {
        const y = 390 + i * 260;
        const w = drawSupportRectangle(
          ctx,
          api,
          1120,
          y,
          650,
          180,
          i ? themeColors.cyan : themeColors.blue,
        );
        drawSupportText(
          ctx,
          api,
          name,
          1445,
          y + 55,
          31,
          i ? themeColors.cyan : themeColors.blue,
          'center',
        );
        withSupportFocus(ctx, api, 'scoped-jobs', () => {
          if (jobs) {
            drawSupportText(
              ctx,
              api,
              'Read-only credential · deadline · typed output',
              1445,
              y + 115,
              25,
              themeColors.muted,
              'center',
            );
            api.connect(ctx, sup, w, {
              color: i ? themeColors.cyan : themeColors.blue,
              gap: 20,
            });
          }
        });
        withSupportFocus(ctx, api, 'merge-jobs', () => {
          if (merged) {
            drawSupportText(
              ctx,
              api,
              'case / revision / source / success: MATCH',
              1445,
              y + 155,
              23,
              themeColors.green,
              'center',
            );
            drawSupportArrow(ctx, api, 1095, y + 150, 640, 735, themeColors.green);
          }
        });
      });
      drawSupportFooter(
        ctx,
        api,
        'Separate context windows do not grant access; queues and extra workers consume budget.',
      );
    }
  }
}
export default {
  id: 'channels-and-fences',
  draw: drawChannelsAndFences,
  cues: [
    'incoming-turn',
    'outgoing-sse',
    'dedup-event',
    'lease-expiry',
    'fencing-token',
    'reject-fence',
    'scoped-jobs',
    'merge-jobs',
  ],
};
