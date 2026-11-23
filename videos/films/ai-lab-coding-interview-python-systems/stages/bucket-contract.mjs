import { ciDone, codingChapterState } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterText,
  drawFooter,
  drawHeading,
  drawLine,
} from '../defaults.mjs';
export function drawBucketContract(ctx, scene, state, api) {
  api.focus.target('ci-bucket-contract-trace', () => {
    const { C: themeColors } = api,
      modelState = codingChapterState('bucket-contract', state),
      currentBeat = modelState.beat,
      progress = modelState.p,
      q = modelState.q;
    {
      if (currentBeat === 0) {
        drawHeading(ctx, api, 'The same refill amount survives a denied request');
        const left = 260,
          width = 1400;
        drawChapterText(
          ctx,
          api,
          'capacity 3 · rate 1 token/s · old 0 at t0 · cost 1',
          960,
          365,
          28,
          themeColors.cyan,
          'center',
        );
        api.rect(ctx, left, 470, width, 95, themeColors.panel, themeColors.muted, 2);
        if (modelState.tokens > 0)
          api.rect(
            ctx,
            left + 2,
            472,
            Math.max(1, (width * modelState.tokens) / 3 - 4),
            91,
            themeColors.cyan,
          );
        for (let i = 0; i <= 3; i++) {
          const x = left + (width * i) / 3;
          drawLine(ctx, api, x, 450, x, 590, themeColors.muted, 2);
          drawChapterText(ctx, api, i, x, 640, 28, themeColors.muted, 'center');
        }
        drawChapterText(
          ctx,
          api,
          'elapsed ' +
            modelState.elapsed.toFixed(3) +
            ' s → ' +
            modelState.tokens.toFixed(3) +
            ' tokens',
          960,
          745,
          32,
          themeColors.cyan,
          'center',
        );
        drawChapterCard(ctx, api, 'DENY · no debit', 260, 835, 610, 100, themeColors.pink, 31);
        drawChapterCard(
          ctx,
          api,
          ciDone(state, 'ci-bucket-contract-wait')
            ? 'retry-after: ' + modelState.wait.toFixed(3) + ' s'
            : 'missing / rate → wait',
          1060,
          835,
          610,
          100,
          themeColors.yellow,
          31,
        );
        drawFooter(ctx, api, 'The wait assumes no competing caller consumes the future refill');
      } else if (currentBeat === 1) {
        drawHeading(ctx, api, 'A request can exceed capacity even with unlimited waiting');
        const cost = 4,
          capacity = 3;
        api.rect(ctx, 250, 455, 1050, 100, themeColors.cyan);
        api.rect(ctx, 250, 665, 1400 * q, 100, themeColors.pink);
        drawChapterText(ctx, api, 'capacity 3', 250, 420, 31, themeColors.cyan);
        drawChapterText(ctx, api, 'requested cost 4', 250, 625, 31, themeColors.pink);
        drawLine(ctx, api, 1300, 400, 1300, 805, themeColors.yellow, 4);
        drawChapterText(
          ctx,
          api,
          q > 0.99 ? 'impossible → reject' : 'cost constructing',
          960,
          900,
          32,
          themeColors.pink,
          'center',
        );
        drawFooter(
          ctx,
          api,
          'A separate in-flight counter controls active requests, not this refill budget',
        );
      } else {
        drawHeading(ctx, api, 'Idle deletion must preserve the refilled state');
        const right = ciDone(state, 'ci-bucket-contract-eviction'),
          elapsed = right ? 3 : 0,
          actual = Math.min(3, elapsed);
        drawChapterText(
          ctx,
          api,
          'supplied idle elapsed: ' + elapsed + ' s',
          960,
          365,
          31,
          themeColors.yellow,
          'center',
        );
        drawChapterText(ctx, api, 'retain existing bucket', 250, 470, 28, themeColors.cyan);
        drawChapterText(ctx, api, 'delete and recreate full', 1120, 470, 28, themeColors.pink);
        [actual, 3].forEach((n, i) => {
          const x = 250 + i * 870;
          api.rect(ctx, x, 535, 550, 90, themeColors.panel, themeColors.muted, 2);
          if (n)
            api.rect(ctx, x + 3, 538, (n / 3) * 544, 84, i ? themeColors.pink : themeColors.cyan);
          drawChapterText(
            ctx,
            api,
            n + ' tokens',
            x + 275,
            720,
            33,
            i ? themeColors.pink : themeColors.cyan,
            'center',
          );
        });
        drawChapterCard(
          ctx,
          api,
          right ? '3 = 3 · equivalent at full refill' : '0 ≠ 3 · creates an extra burst',
          390,
          845,
          1140,
          110,
          right ? themeColors.green : themeColors.pink,
          36,
        );
        drawFooter(
          ctx,
          api,
          'Key count controls retained memory; safe eviction follows the actual refill contract',
        );
      }
    }
  });
}
export default {
  id: 'bucket-contract',
  draw: drawBucketContract,
  cues: [
    'ci-bucket-contract-0-build',
    'ci-bucket-contract-wait',
    'ci-bucket-contract-1-build',
    'ci-bucket-contract-2-build',
    'ci-bucket-contract-eviction',
  ],
};
