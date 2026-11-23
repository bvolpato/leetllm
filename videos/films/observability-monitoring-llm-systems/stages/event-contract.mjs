import { observationCue } from '../construction.mjs';
import {
  drawCells,
  drawChapterCard,
  drawChapterText,
  drawHeading,
  drawLine,
  drawRectangle,
  drawTable,
  withTarget,
} from '../defaults.mjs';
export function drawEventContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (beat, n) => observationCue(state, 'event-contract', beat, n),
    resultComplete = (beat, n) => progress(beat, n) === 1;
  {
    if (currentBeat === 0) {
      drawHeading(ctx, api, 'Request X1');
      withTarget(ctx, api, 'payload', () => {
        drawChapterCard(
          ctx,
          api,
          'Serving decision',
          'route: abstain',
          140,
          355,
          650,
          themeColors.yellow,
        );
        drawChapterCard(
          ctx,
          api,
          'Operator boundary',
          progress(0, 3) > 0 ? '“Deployment approved.”' : 'No observed payload yet',
          1060,
          355,
          700,
          progress(0, 3) > 0 ? themeColors.pink : themeColors.muted,
        );
        if (progress(0, 3) > 0) {
          drawLine(ctx, api, 820, 430, 1020, 430, themeColors.cyan);
          const x = 820 + 200 * progress(0, 3);
          drawRectangle(ctx, api, x - 9, 421, 18, 18, themeColors.cyan, null);
        }
        drawChapterCard(
          ctx,
          api,
          'Supporting approval record',
          'No approval on file',
          140,
          625,
          650,
          themeColors.yellow,
          160,
        );
        drawChapterCard(
          ctx,
          api,
          'Final delivery event',
          ['request ID: X1', resultComplete(0, 4) ? 'served: true' : 'served: pending observation'],
          1060,
          625,
          700,
          resultComplete(0, 4) ? themeColors.pink : themeColors.blue,
          160,
        );
        if (resultComplete(0, 5))
          drawChapterText(
            ctx,
            api,
            'The gate chose abstain. The engineer received an approval.',
            140,
            925,
            32,
            themeColors.yellow,
          );
      });
    } else if (currentBeat === 1) {
      drawHeading(ctx, api, 'Delivery and independent review use separate fields');
      withTarget(ctx, api, 'typed-fields', () => {
        drawChapterCard(
          ctx,
          api,
          'Known delivery',
          ['served: true', 'unsafe: absent · review pending'],
          140,
          350,
          760,
          themeColors.blue,
          175,
        );
        if (resultComplete(1, 3))
          drawChapterCard(
            ctx,
            api,
            'Separate reviewed case',
            ['served: true', 'unsafe: false · reviewed safe'],
            1000,
            350,
            760,
            themeColors.green,
            175,
          );
        if (progress(1, 4) > 0)
          drawTable(
            ctx,
            api,
            ['Rejected input', 'Conflict'],
            [
              ['unsafe:true / served:false', 'no substantive delivery'],
              ['route:"magic" / id:""', 'invalid route or identity'],
              ['served:"true"', 'string is not a Boolean'],
            ],
            140,
            590,
            [800, 820],
            85,
          );
      });
    } else {
      drawHeading(ctx, api, 'One final event per request · independent ingress count');
      withTarget(ctx, api, 'ingress-ledger', () => {
        const n = resultComplete(2, 3) ? 8 : 7;
        drawCells(
          ctx,
          api,
          Array.from(
            {
              length: n,
            },
            (_, i) => `R${i + 1}`,
          ),
          140,
          370,
          1620,
          95,
          Array.from(
            {
              length: n,
            },
            (_, i) => (i === 7 ? themeColors.pink : themeColors.blue),
          ),
        );
        drawChapterText(ctx, api, 'Final events: 7', 140, 565, 36, themeColors.blue);
        if (progress(2, 2) > 0) {
          drawChapterCard(
            ctx,
            api,
            'Separate message objects',
            ['R3 final event replay', 'R3 independent review receipt'],
            140,
            665,
            760,
            themeColors.yellow,
            170,
          );
          drawChapterCard(
            ctx,
            api,
            'Request ledger',
            'R3 remains one row',
            1000,
            665,
            760,
            themeColors.cyan,
            170,
          );
        }
        if (resultComplete(2, 3)) {
          drawChapterText(
            ctx,
            api,
            'Ingress: 8 · final events: 7 · missing final event: 1',
            140,
            915,
            35,
            themeColors.pink,
          );
          drawChapterText(
            ctx,
            api,
            'R8: delivery, latency, cost and reviewed safety remain unknown',
            140,
            978,
            28,
            themeColors.muted,
          );
        }
      });
    }
  }
  return true;
}
export default {
  id: 'event-contract',
  draw: drawEventContract,
  cues: [
    'ob-event-contract-1-1',
    'ob-event-contract-1-2',
    'ob-event-contract-1-3',
    'ob-event-contract-1-4',
    'ob-event-contract-1-5',
    'ob-event-contract-2-1',
    'ob-event-contract-2-2',
    'ob-event-contract-2-3',
    'ob-event-contract-2-4',
    'ob-event-contract-3-1',
    'ob-event-contract-3-2',
    'ob-event-contract-3-3',
    'ob-event-contract-3-4',
  ],
};
