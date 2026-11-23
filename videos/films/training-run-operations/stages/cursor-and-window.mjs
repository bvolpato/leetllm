import { clamp, consumedCursorPlan } from '../arithmetic.mjs';
import { trainingRun, boundary } from '../boundaries.mjs';
import { trainingCue, trainingStarted } from '../construction.mjs';
import { drawBox, drawCell, drawFooter, drawLine, drawRow, drawText } from '../defaults.mjs';
export function drawCursorAndWindow(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const colors = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink];
  api.focus.target('cursor-and-window-mechanism', () => {
    if (beat === 0 || (beat === 1 && !trainingStarted(state, 'cursor-workers', progress > 0.4))) {
      const used = beat
        ? 8
        : Math.floor(8 * trainingCue(state, 'cursor-consumed', clamp(progress * 3)));
      const ahead = beat
        ? 4
        : Math.floor(4 * trainingCue(state, 'cursor-and-window-step-1', clamp(progress * 3 - 1)));
      const plan = consumedCursorPlan(used, used + ahead);
      drawText(ctx, api, 'Sample IDs in deterministic order', 155, 295, 40, themeColors.ink);
      for (let i = 0; i < 12; i++) {
        const x = 155 + i * 136;
        const color =
          i < used
            ? themeColors.cyan
            : i < plan.prefetched
              ? themeColors.yellow
              : themeColors.muted;
        drawCell(ctx, api, i, x, 420, 118, 112, color, 43);
        if (i < plan.prefetched)
          drawText(ctx, api, i < used ? 'used' : 'queued', x + 59, 606, 27, color, 'center');
      }
      const cut = 145 + 136 * used;
      drawLine(ctx, api, cut, 380, cut, 633, themeColors.cyan, 4);
      drawText(ctx, api, 'Consumed: ' + used, 390, 758, 44, themeColors.cyan, 'center');
      drawText(
        ctx,
        api,
        'Producer: ' + plan.prefetched,
        1450,
        758,
        44,
        themeColors.yellow,
        'center',
      );
      const ask = trainingStarted(state, 'cursor-prefetch', progress > 0.65);
      drawText(
        ctx,
        api,
        beat
          ? 'Resume at ID ' + plan.resume + ' to keep the four queued examples.'
          : ask
            ? 'Which IDs would resuming at the producer skip?'
            : 'The producer can fetch a sample before training needs it.',
        960,
        930,
        39,
        themeColors.ink,
        'center',
      );
    } else if (beat === 1) {
      drawText(
        ctx,
        api,
        'Worker state and distributed rank ownership are different axes',
        960,
        285,
        35,
        themeColors.blue,
        'center',
      );
      for (let rank = 0; rank < 2; rank++) {
        const x = 210 + rank * 840;
        drawBox(ctx, api, x, 350, 660, 430, colors[rank]);
        drawText(ctx, api, 'Rank ' + rank, x + 330, 405, 34, colors[rank], 'center');
        for (let worker = 0; worker < 2; worker++) {
          drawCell(
            ctx,
            api,
            'worker ' + worker,
            x + 50 + worker * 290,
            470,
            265,
            90,
            colors[rank],
            28,
          );
          drawRow(ctx, api, ['RNG', 'buffer'], x + 55 + worker * 290, 625, 110, colors[rank]);
        }
      }
      drawText(
        ctx,
        api,
        'Iterable worker-state restore: same worker count',
        960,
        875,
        36,
        themeColors.yellow,
        'center',
      );
      drawFooter(
        ctx,
        api,
        'TorchData aggregates worker state. Cross-rank data repartitioning needs its own tested policy.',
      );
    } else {
      drawText(
        ctx,
        api,
        'Saved update 1840 · unapplied accumulation window',
        960,
        285,
        35,
        themeColors.blue,
        'center',
      );
      const used = Math.floor(
        trainingRun.finished * trainingCue(state, 'cursor-pending', clamp(progress * 4)),
      );
      const { saved, perRound } = boundary(trainingRun);
      Array.from(
        {
          length: 8,
        },
        (_, i) => {
          drawCell(
            ctx,
            api,
            String.fromCharCode(65 + i),
            160 + i * 201,
            410,
            175,
            105,
            i < used ? themeColors.yellow : themeColors.muted,
            36,
          );
          drawText(
            ctx,
            api,
            i < used ? 'read' : 'pending',
            247 + i * 201,
            575,
            27,
            i < used ? themeColors.yellow : themeColors.muted,
            'center',
          );
        },
      );
      drawText(
        ctx,
        api,
        `${used * perRound} examples read since update 1840 · their gradients are still unapplied`,
        960,
        690,
        34,
        themeColors.yellow,
        'center',
      );
      drawText(ctx, api, 'Boundary-only cursor', 540, 805, 31, themeColors.cyan, 'center');
      drawText(
        ctx,
        api,
        saved.toLocaleString('en-US'),
        540,
        880,
        48,
        themeColors.cyan,
        'center',
        'mono',
      );
      const mid = trainingStarted(state, 'cursor-midwindow', progress > 0.45);
      drawText(
        ctx,
        api,
        mid ? 'Mid-window packet must also retain' : 'Unapplied work cannot advance old weights',
        1370,
        805,
        29,
        themeColors.pink,
        'center',
      );
      if (mid)
        drawText(
          ctx,
          api,
          'gradients + count + scale + RNG + data',
          1370,
          880,
          29,
          themeColors.yellow,
          'center',
        );
      drawFooter(
        ctx,
        api,
        'Keep numerical state and consumed progress at one boundary; some accumulated gradients may still be scaled.',
      );
    }
  });
}
export default {
  id: 'cursor-and-window',
  draw: drawCursorAndWindow,
  cues: [
    'cursor-and-window-step-1',
    'cursor-consumed',
    'cursor-prefetch',
    'cursor-and-window-step-2',
    'cursor-worker-restore',
    'cursor-workers',
    'cursor-and-window-step-3',
    'cursor-pending',
    'cursor-counter',
    'cursor-midwindow',
  ],
};
