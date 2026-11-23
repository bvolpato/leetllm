import { bounded } from '../arithmetic.mjs';
import { pipelineSchedule, pipelineVisibleTicks } from '../model.mjs';
import {
  drawExpandedBar,
  drawExpandedLine,
  drawExpandedText,
  drawExpandedTitle,
} from '../defaults.mjs';
export function drawPipeline(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0),
    F = api.components.fade;
  const cueProgress = (a = 0.1, z = 0.85) => api.phase(progress, a, z);
  {
    const flush = pipelineSchedule(),
      gpipe = pipelineSchedule(4, 8, false);
    drawExpandedTitle(
      ctx,
      api,
      currentBeat < 2
        ? '4 stages · 8 microbatches · unit-duration F/B operations · transfers omitted'
        : '8 balanced stages · vary the microbatch count · transfers and optimizer time omitted',
    );
    const schedule = currentBeat === 0 && progress < 0.45 ? gpipe : flush,
      limit = pipelineVisibleTicks(cueProgress(), schedule.ticks),
      colors = [
        themeColors.blue,
        themeColors.cyan,
        themeColors.pink,
        themeColors.yellow,
        themeColors.green,
        themeColors.blue,
        themeColors.cyan,
        themeColors.pink,
      ];
    if (currentBeat < 2) {
      drawExpandedText(
        ctx,
        api,
        schedule === gpipe
          ? 'GPipe: all forwards before backwards'
          : 'Non-interleaved 1F1B flush: warmup, alternate, drain',
        960,
        325,
        31,
        themeColors.ink,
        'center',
      );
      for (let stage = 0; stage < 4; stage++) {
        const y = 420 + stage * 130;
        drawExpandedText(ctx, api, 'Stage ' + stage, 140, y + 35, 26, themeColors.muted);
        drawExpandedLine(ctx, api, 340, y + 92, 1730, y + 92, themeColors.muted, 1);
        schedule.events
          .filter((e) => e.stage === stage && e.tick < limit)
          .forEach((e) => {
            const x = 350 + e.tick * 61;
            api.rect(
              ctx,
              x,
              y,
              54,
              70,
              e.kind === 'F' ? colors[e.microbatch] : themeColors.panel,
              colors[e.microbatch],
              3,
            );
            drawExpandedText(
              ctx,
              api,
              e.kind + e.microbatch,
              x + 27,
              y + 43,
              20,
              e.kind === 'F' ? themeColors.bg : colors[e.microbatch],
              'center',
            );
          });
        const past = schedule.events.filter((e) => e.stage === stage && e.tick < limit);
        const live = past.length ? past.at(-1).live : 0;
        drawExpandedText(ctx, api, 'live ' + live, 1780, y + 40, 25, themeColors.yellow, 'center');
      }
      drawExpandedText(
        ctx,
        api,
        'Time slots: ' +
          limit +
          ' / ' +
          schedule.ticks +
          ' · each retained identity awaits its own backward',
        960,
        1000,
        28,
        themeColors.muted,
        'center',
      );
      if (currentBeat === 1 && progress > 0.8)
        drawExpandedText(
          ctx,
          api,
          'Max outstanding: 1F1B [4,3,2,1] · GPipe [8,8,8,8]',
          960,
          1040,
          27,
          themeColors.green,
          'center',
        );
    }
    if (currentBeat === 2) {
      const q = cueProgress(),
        m = 1 + Math.floor(q * 31),
        over = 7 / m,
        idle = 7 / (m + 7);
      drawExpandedText(
        ctx,
        api,
        '8 stages · ' + m + ' microbatches',
        960,
        370,
        37,
        themeColors.ink,
        'center',
      );
      [
        ['Useful work', m, themeColors.blue],
        ['Fill/drain', 7, themeColors.pink],
      ].forEach(([n, v, col], i) => {
        const y = 490 + i * 160;
        drawExpandedText(ctx, api, n, 200, y + 38, 31, col);
        drawExpandedBar(ctx, api, v, 610, y, 1000, 80, 39, col);
        drawExpandedText(ctx, api, v + ' × (tf + tb)', 1740, y + 45, 25, col, 'center');
      });
      drawExpandedText(
        ctx,
        api,
        'Overhead / useful = 7 / ' + m + ' = ' + (over * 100).toFixed(2) + '%',
        960,
        880,
        38,
        themeColors.pink,
        'center',
      );
      drawExpandedText(
        ctx,
        api,
        'Idle / elapsed = 7 / ' + (m + 7) + ' = ' + (idle * 100).toFixed(2) + '%',
        960,
        970,
        38,
        themeColors.yellow,
        'center',
      );
      drawExpandedText(
        ctx,
        api,
        'Same ideal bubble for GPipe and plain 1F1B; activation retention differs',
        960,
        1040,
        26,
        themeColors.muted,
        'center',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'pipeline',
  draw: drawPipeline,
  cues: [],
};
