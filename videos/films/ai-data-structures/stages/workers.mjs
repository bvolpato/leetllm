import { capacityState, clamp, mix } from '../arithmetic.mjs';
import { q } from '../construction.mjs';
import {
  drawCaption,
  drawCard,
  drawReference,
  drawText,
  drawTransfer,
  withFocus,
} from '../defaults.mjs';
export function drawWorkers(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (id, beat = 0, start, end) => q(state, id, beat, start, end);
  {
    if (currentBeat === 0)
      withFocus(ctx, api, 'worker-lanes', () => {
        const claim = progress('worker-second-claim', 0),
          doneB = progress('worker-second-done', 0, 0.45, 0.65),
          doneA = progress('worker-first-done', 0, 0.78, 0.95);
        drawCard(ctx, api, 'Worker A', 180, 350, 650, 80, themeColors.blue, 1, 34);
        drawText(
          ctx,
          api,
          doneA >= 0.98 ? 'M0 result received second' : 'M0 still running',
          220,
          735,
          28,
          themeColors.muted,
        );
        drawCard(ctx, api, 'Worker B', 1090, 350, 650, 80, themeColors.cyan, 1, 34);
        drawText(
          ctx,
          api,
          doneB >= 0.98 ? 'M2 result received first' : 'M2 not yet complete',
          1130,
          735,
          28,
          themeColors.muted,
        );
        drawReference(
          ctx,
          api,
          0,
          380,
          mix(490, 620, doneA),
          doneA >= 0.98 ? themeColors.green : themeColors.yellow,
        );
        drawReference(
          ctx,
          api,
          2,
          mix(840, 1280, clamp((claim - 0.4) / 0.6)),
          mix(260, 490, clamp(claim / 0.4)) + 130 * doneB,
          doneB >= 0.98 ? themeColors.green : themeColors.yellow,
        );
        drawCaption(
          ctx,
          api,
          'Claim order: M0 → M2 · completion carries its own ID',
          themeColors.cyan,
        );
      });
    else if (currentBeat === 1)
      withFocus(ctx, api, 'capacity-queue', () => {
        const wait = progress('capacity-wait', 1),
          claim = progress('capacity-claim', 1, 0.4, 0.6),
          admit = progress('capacity-admit', 1, 0.68, 0.9),
          current = capacityState(claim >= 0.98, admit >= 0.98);
        drawText(ctx, api, 'Two-slot ring buffer · waiting jobs', 180, 300, 34, themeColors.ink);
        drawText(
          ctx,
          api,
          'Earlier completion: M2 before M0',
          960,
          240,
          24,
          themeColors.yellow,
          'center',
        );
        drawCard(ctx, api, 'physical slot 0', 350, 380, 430, 80, themeColors.muted);
        drawCard(ctx, api, 'physical slot 1', 1030, 380, 430, 80, themeColors.muted);
        drawReference(ctx, api, 3, mix(450, 180, claim), mix(490, 730, claim), themeColors.yellow);
        drawReference(ctx, api, 4, 1130, 490, themeColors.cyan);
        if (wait > 0)
          drawReference(
            ctx,
            api,
            5,
            mix(800, 450, admit),
            mix(750, 490, admit),
            admit >= 0.98 ? themeColors.green : themeColors.yellow,
          );
        drawText(ctx, api, 'head', current.head ? 1245 : 565, 350, 28, themeColors.cyan, 'center');
        if (claim >= 0.98) drawText(ctx, api, 'Worker owns M3', 180, 860, 28, themeColors.yellow);
        drawText(
          ctx,
          api,
          'FIFO order: ' + current.logicalOrder.map((id) => 'M' + id).join(' → '),
          960,
          900,
          32,
          themeColors.green,
          'center',
        );
        if (!admit)
          drawText(
            ctx,
            api,
            'M5 remains producer-owned until admission',
            960,
            995,
            29,
            themeColors.yellow,
            'center',
          );
      });
    else
      withFocus(ctx, api, 'claim-contract', () => {
        drawText(
          ctx,
          api,
          'Separate synchronized queue',
          960,
          240,
          32,
          themeColors.ink,
          'center',
        );
        const take = progress('worker-claim-contract', 2, 0.16, 0.33),
          empty = take === 1 ? progress('worker-claim-empty', 2, 0.33, 0.53) : 0,
          stale = progress('worker-claim-earlier-check', 2, 0.61, 0.69),
          reserve = progress('worker-claim-no-reservation', 2, 0.69, 0.73);
        const queue = drawCard(
          ctx,
          api,
          'Pending queue',
          150,
          310,
          490,
          72,
          themeColors.cyan,
          1,
          30,
        );
        const workerB = drawCard(ctx, api, 'Worker B', 710, 310, 490, 72, themeColors.green, 1, 30);
        drawCard(ctx, api, 'Worker A', 1280, 310, 490, 72, themeColors.yellow, 1, 30);
        api.line(ctx, 675, 310, 675, 780, themeColors.muted, 2);
        api.line(ctx, 1245, 310, 1245, 780, themeColors.muted, 2);
        drawCard(
          ctx,
          api,
          take === 1 ? 'Queue empty' : take > 0 ? 'Claim in progress' : 'One job waiting',
          150,
          690,
          490,
          72,
          themeColors.muted,
          1,
          28,
        );
        drawCard(
          ctx,
          api,
          take === 1 ? 'Claimed with get_nowait()' : 'Ready to call get_nowait()',
          710,
          690,
          490,
          72,
          themeColors.muted,
          1,
          27,
        );
        drawCard(
          ctx,
          api,
          'Earlier check: nonempty',
          1320,
          390,
          420,
          76,
          stale > 0 ? themeColors.pink : themeColors.yellow,
          1,
          27,
        );
        if (reserve > 0)
          drawText(
            ctx,
            api,
            'Snapshot · no job reserved',
            1530,
            495,
            25,
            themeColors.pink,
            'center',
          );
        if (empty > 0 && empty < 1)
          drawCard(ctx, api, 'get_nowait() attempt', 1320, 535, 420, 76, themeColors.blue, 1, 27);
        if (empty === 1) {
          drawCard(ctx, api, 'Empty', 1320, 535, 420, 76, themeColors.pink, 1, 29);
          drawText(ctx, api, 'except queue.Empty:', 1530, 685, 30, themeColors.ink, 'center', 'mono');
        }
        drawTransfer(ctx, api, queue, workerB, themeColors.green, take);
        const x = mix(275, 845, take),
          y = 475;
        drawReference(ctx, api, 3, x, y, take >= 0.98 ? themeColors.green : themeColors.yellow);
        drawCaption(
          ctx,
          api,
          empty === 1 ? 'Only Worker B can return a result for M3' : 'Watch the owner of M3',
          themeColors.cyan,
          930,
        );
      });
  }
}
export default {
  id: 'workers',
  draw: drawWorkers,
  cues: [
    'worker-second-claim',
    'worker-second-done',
    'worker-first-done',
    'capacity-wait',
    'capacity-claim',
    'capacity-admit',
    'worker-claim-contract',
    'worker-claim-empty',
    'worker-claim-earlier-check',
    'worker-claim-no-reservation',
  ],
};
