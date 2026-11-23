import { tokenValues, writeTimes } from '../fixtures.mjs';
import { clamp } from '../construction.mjs';
import { sampleModel } from '../model.mjs';
import {
  drawOriginalCard,
  drawOriginalEquation,
  drawOriginalFooter,
  drawOriginalMark,
  drawOriginalText,
  drawOriginalTransfer,
} from '../defaults.mjs';
export function drawBarrier(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    modelState = sampleModel('barrier', state);
  {
    if (currentBeat < 2) {
      drawOriginalText(
        ctx,
        api,
        currentBeat === 0 || modelState.early
          ? 'Block A   /   four writes to shared memory'
          : 'Replay the same writes with a block barrier',
        160,
        285,
        34,
        themeColors.cyan,
      );
      drawOriginalMark(ctx, api, 'shared-writes', () => {
        tokenValues.slice(0, 4).forEach((value, i) => {
          const x = 265 + i * 360;
          const source = drawOriginalCard(
            ctx,
            api,
            'T' + i + ' · ' + value,
            x,
            365,
            300,
            95,
            themeColors.blue,
            37,
          );
          const target = drawOriginalCard(
            ctx,
            api,
            modelState.slots[i] === null ? '?' : String(modelState.slots[i]),
            x,
            640,
            300,
            100,
            modelState.slots[i] === null ? themeColors.muted : themeColors.cyan,
            43,
          );
          drawOriginalText(
            ctx,
            api,
            'shared[' + i + ']',
            x + 150,
            790,
            25,
            themeColors.muted,
            'center',
            true,
          );
          const p = clamp(modelState.time / writeTimes[i]);
          drawOriginalTransfer(ctx, api, source, target, p, themeColors.blue);
        });
      });
      drawOriginalMark(ctx, api, 'reader-result', () => {
        const racing = currentBeat === 0 || modelState.early;
        if (racing) {
          const attempted = modelState.attempted;
          drawOriginalText(ctx, api, 'Thread 0', 150, 884, 32, themeColors.ink);
          const when = time => 392 + 300 * time;
          api.line(ctx, when(0), 870, when(2), 870, themeColors.muted, 3);
          writeTimes.forEach((time, thread) => {
            if (time <= modelState.time) {
              api.circle(ctx, when(time), 870, 7, themeColors.cyan);
              drawOriginalText(ctx, api, 'T' + thread, when(time), 849, 24,
                themeColors.cyan, 'center');
            }
          });
          if (attempted) {
            api.line(ctx, when(modelState.readAt), 861, when(modelState.readAt), 901, themeColors.pink, 5);
            drawOriginalText(ctx, api, 'read', when(modelState.readAt), 943, 29, themeColors.pink, 'center');
          }
          drawOriginalCard(ctx, api, attempted ? 'sum   ?' : 'read pending',
            1110, 818, 480, 100, attempted ? themeColors.pink : themeColors.muted, 40);
        } else {
          drawOriginalText(ctx, api, 'Reader', 105, 885, 30, themeColors.ink);
          for (let i = 0; i < 4; i++) {
            const color = modelState.ready ? themeColors.green : themeColors.muted;
            drawOriginalCard(ctx, api, modelState.ready ? String(modelState.readSlots[i]) : '·',
              335 + i * 360, 827, 160, 82, color, 37);
          }
        }
      });
      drawOriginalMark(ctx, api, 'barrier-arrivals', () =>
        drawOriginalText(ctx, api, (currentBeat === 0 || modelState.early ? 'Published' : 'At block barrier') +
          '   ' + modelState.arrivals + ' / 4', 265, 1004, 32, themeColors.blue));
      const report = modelState.result !== null ? 'Block A sum   ' + modelState.result
        : modelState.attempted ? 'Unordered read and writes' : 'Waiting to read';
      drawOriginalText(ctx, api, report, 1620, 1004, 32,
        modelState.result !== null ? themeColors.green : themeColors.muted, 'right');
    } else {
      drawOriginalText(
        ctx,
        api,
        'Two block sums feed the next kernel in this stream',
        160,
        285,
        31,
        themeColors.cyan,
      );
      const target = drawOriginalMark(ctx, api, 'device-pooled', () => {
        const shape = drawOriginalCard(
          ctx,
          api,
          modelState.pool === 1
            ? 'Device feature · 2.625'
            : modelState.join === 1
              ? 'Device sum · 21'
              : 'Later kernel · pending',
          625,
          740,
          670,
          115,
          modelState.pool === 1 ? themeColors.green : themeColors.yellow,
          39,
        );
        if (modelState.pool === 1)
          drawOriginalEquation(ctx, api, '\\frac{10+11}{8}=2.625', 960, 950, 54, themeColors.green);
        return shape;
      });
      drawOriginalMark(ctx, api, 'block-subtotals', () => {
        const a = drawOriginalCard(
          ctx,
          api,
          'Block A · 10',
          250,
          420,
          500,
          125,
          themeColors.cyan,
          43,
        );
        const z = drawOriginalCard(
          ctx,
          api,
          modelState.second === 1 ? 'Block B · 11' : 'Block B · pending',
          1170,
          420,
          500,
          125,
          themeColors.pink,
          43,
        );
        drawOriginalTransfer(ctx, api, a, target, modelState.join, themeColors.cyan);
        drawOriginalTransfer(ctx, api, z, target, modelState.join, themeColors.pink);
      });
      drawOriginalFooter(ctx, api, 'Ordinary block barriers have block scope.');
    }
  }
}
export default {
  id: 'barrier',
  draw: drawBarrier,
  cues: [
    'early-writes',
    'early-reader',
    'barrier-replay',
    'barrier-publish',
    'barrier-read',
    'second-subtotal',
    'join-subtotals',
    'pool-device',
  ],
};
