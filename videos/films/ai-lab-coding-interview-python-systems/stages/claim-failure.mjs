import { ciDone, codingChapterState } from '../construction.mjs';
import {
  drawArrow,
  drawChapterCard,
  drawChapterText,
  drawFooter,
  drawHeading,
  drawLine,
  drawMovingCard,
  drawRow,
} from '../defaults.mjs';
export function drawClaimFailure(ctx, scene, state, api) {
  api.focus.target('ci-claim-failure-trace', () => {
    const { C: themeColors, teaching: teaching } = api,
      modelState = codingChapterState('claim-failure', state),
      currentBeat = modelState.beat,
      progress = modelState.p,
      q = modelState.q;
    {
      if (currentBeat === 0) {
        drawHeading(ctx, api, 'One supplied possible schedule after the two-thread barrier');
        drawLine(ctx, api, 660, 360, 660, 870, themeColors.yellow, 5);
        drawChapterText(ctx, api, 'barrier', 660, 335, 27, themeColors.yellow, 'center');
        ['A', 'B'].forEach((id, i) => {
          const y = 450 + i * 220;
          drawChapterCard(ctx, api, 'worker ' + id, 180, y, 290, 90, themeColors.blue);
          if (!ciDone(state, 'ci-claim-failure-winner'))
            drawMovingCard(
              ctx,
              api,
              '/docs',
              470,
              y + 110,
              960,
              y + 110,
              Math.min(1, q * 2),
              themeColors.cyan,
              180,
            );
        });
        drawChapterCard(
          ctx,
          api,
          q > 0.4 ? 'claim set: /docs' : 'claim set: empty',
          1000,
          425,
          650,
          100,
          themeColors.yellow,
          30,
        );
        if (ciDone(state, 'ci-claim-failure-winner')) {
          drawChapterCard(
            ctx,
            api,
            'A: True · one possible winner',
            1000,
            650,
            650,
            90,
            themeColors.green,
            28,
          );
          drawChapterCard(
            ctx,
            api,
            'B: False · duplicate skipped',
            1000,
            790,
            650,
            90,
            themeColors.muted,
            28,
          );
        }
        drawFooter(ctx, api, 'Exactly one owner; the test does not choose which thread wins');
      } else if (currentBeat === 1) {
        drawHeading(ctx, api, 'Completion order is not breadth-first output order');
        const time = 3 * q;
        teaching.timeline({
          x: 200,
          y: 350,
          width: 1520,
          height: 340,
          domain: [0, 3],
          time,
          lanes: [
            {
              id: 'guide',
              label: '/guide',
            },
            {
              id: 'api',
              label: '/api',
            },
          ],
          intervals: [
            {
              id: 'g',
              lane: 'guide',
              start: 0,
              end: 3,
              label: 'supplied 3 s wait',
              color: themeColors.blue,
            },
            {
              id: 'a',
              lane: 'api',
              start: 0,
              end: 1,
              label: '1 s',
              color: themeColors.cyan,
            },
          ],
          ticks: [0, 1, 2, 3],
          fontSize: 24,
        });
        drawChapterText(ctx, api, 'Unordered completion', 230, 790, 27, themeColors.pink);
        drawRow(
          ctx,
          api,
          q > 0.99 ? ['/api', '/guide'] : ['/api', 'pending'],
          620,
          750,
          1080,
          90,
          themeColors.pink,
        );
        drawChapterText(ctx, api, 'Parent-order merge', 230, 935, 27, themeColors.green);
        drawRow(
          ctx,
          api,
          q > 0.99 ? ['/guide', '/api'] : ['wait for frontier', 'pending'],
          620,
          895,
          1080,
          90,
          themeColors.green,
        );
        drawFooter(
          ctx,
          api,
          'Illustrative latencies; frontier-wide merge preserves the promised parent order',
        );
      } else {
        drawHeading(ctx, api, 'A failed attempt and a stopped publication retain different owners');
        const stopped = ciDone(state, 'ci-claim-failure-stop');
        drawChapterCard(
          ctx,
          api,
          '/docs remains claimed',
          180,
          395,
          650,
          110,
          themeColors.yellow,
          32,
        );
        drawChapterCard(ctx, api, 'fetch failed', 1080, 395, 650, 110, themeColors.pink, 32);
        drawArrow(ctx, api, 850, 450, 1050, 450, themeColors.pink);
        const labels = ['in flight', 'retry wait', 'success / terminal'];
        labels.forEach((v, i) =>
          drawChapterCard(
            ctx,
            api,
            v,
            190 + i * 530,
            650,
            450,
            90,
            i === 1 ? themeColors.yellow : themeColors.blue,
          ),
        );
        drawChapterCard(
          ctx,
          api,
          'stop Event: ' + (q > 0.5 ? 'SET' : 'clear'),
          210,
          850,
          550,
          90,
          q > 0.5 ? themeColors.pink : themeColors.cyan,
          29,
        );
        drawChapterCard(
          ctx,
          api,
          stopped ? 'children withheld' : 'publication check pending',
          1010,
          850,
          700,
          90,
          stopped ? themeColors.pink : themeColors.muted,
          29,
        );
        drawFooter(
          ctx,
          api,
          'An already running remote request can continue after cooperative stop',
        );
      }
    }
  });
}
export default {
  id: 'claim-failure',
  draw: drawClaimFailure,
  cues: [
    'ci-claim-failure-0-build',
    'ci-claim-failure-winner',
    'ci-claim-failure-1-build',
    'ci-claim-failure-2-build',
    'ci-claim-failure-stop',
  ],
};
