import { pipelineSlots } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import { drawCard, drawFooter, drawText } from '../defaults.mjs';
import { cueFraction } from '../cues.mjs';

function forwardSlots(ctx, api, microbatches, top, filled) {
  const { C } = api;
  const { work, ticks, total, idle } = pipelineSlots(microbatches);
  const width = 1240 / ticks;
  drawText(ctx, api, microbatches + ' microbatches', 145, top - 40, 36, C.ink);
  for (const stage of [0, 1]) {
    const y = top + 96 * stage;
    const color = stage ? C.pink : C.blue;
    drawText(ctx, api, 'Stage ' + stage, 145, y + 55, 32, color);
    for (let tick = 0; tick < ticks; tick++) {
      const job = work.find((v) => v.stage === stage && v.start === tick);
      const label = job ? (tick < filled * ticks ? 'F' + (job.mb + 1) : '') : 'idle';
      drawCard(ctx, api, label, 355 + tick * width, y, width - 10, job ? color : C.muted, 80);
    }
  }
  drawText(ctx, api, idle + ' / ' + total + ' idle', 1740, top + 107, 33, C.yellow, 'center');
}

export function drawPipelineSchedule(ctx, scene, state, api) {
  return api.focus.target('pt-pipeline-schedule-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('pipeline-schedule', state),
      { b: currentBeat, p: progress } = modelState;
    {
      if (currentBeat === 2) {
        drawText(
          ctx,
          api,
          'Forward pass on two stages',
          960,
          262,
          37,
          themeColors.yellow,
          'center',
        );
        forwardSlots(ctx, api, 2, 380, 1);
        const four = cueFraction(state, 'four-batches', 2, 0.32, 0.56);
        if (four > 0) forwardSlots(ctx, api, 4, 729, four);
        return;
      }
      if (currentBeat === 1) {
        drawText(
          ctx,
          api,
          'Two stages and two microbatches',
          960,
          285,
          34,
          themeColors.yellow,
          'center',
        );
        for (const [ri, policy] of ['gpipe', '1f1b'].entries()) {
          const schedule = pipelineSlots(2, policy),
            x = 360,
            width = 1320 / schedule.ticks,
            y = 430 + ri * 350;
          drawText(
            ctx,
            api,
            policy === 'gpipe' ? 'GPipe fill-drain' : '1F1B',
            180,
            y - 45,
            29,
            themeColors.yellow,
          );
          for (let r = 0; r < 2; r++) {
            drawText(ctx, api, 'S' + r, 230, y + 49 + r * 105, 25, themeColors.blue);
            for (let k = 0; k < schedule.ticks; k++)
              drawCard(ctx, api, '', x + k * width, y + r * 105, width - 10, themeColors.muted, 75);
          }
          for (const job of schedule.work)
            drawCard(
              ctx,
              api,
              job.kind + (job.mb + 1),
              x + job.start * width,
              y + job.stage * 105,
              width - 10,
              job.kind === 'B' ? themeColors.pink : themeColors.cyan,
              75,
            );
          const tick = Math.min(schedule.ticks - 1, Math.floor(progress * schedule.ticks));
          api.line(
            ctx,
            x + tick * width,
            y - 13,
            x + (tick + 1) * width - 10,
            y - 13,
            themeColors.yellow,
            5,
          );
        }
        drawFooter(
          ctx,
          api,
          'A backward pass needs its forward result and the gradient from the next stage',
        );
        return;
      }
      drawText(
        ctx,
        api,
        'Follow each microbatch through both stages',
        960,
        285,
        33,
        themeColors.yellow,
        'center',
      );
      const x = 320,
        w = 1350 / modelState.ticks;
      for (let r = 0; r < 2; r++) {
        drawText(ctx, api, 'Stage ' + r, 120, 490 + r * 240, 29, themeColors.blue);
        for (let k = 0; k < modelState.ticks; k++)
          drawCard(ctx, api, '', x + k * w, 390 + r * 240, w - 12, themeColors.muted, 140);
      }
      const admitted = Math.floor(progress * modelState.work.length + 1e-8);
      for (const v of modelState.work.slice(0, admitted))
        drawCard(
          ctx,
          api,
          'F' + (v.mb + 1),
          x + v.start * w,
          390 + v.stage * 240,
          w - 12,
          v.stage ? themeColors.pink : themeColors.blue,
          140,
        );
      drawText(
        ctx,
        api,
        modelState.ticks +
          ' time slots   ·   ' +
          modelState.idle +
          ' of ' +
          modelState.total +
          ' stage slots idle',
        960,
        930,
        31,
        themeColors.cyan,
        'center',
      );
    }
  });
}
export default {
  id: 'pipeline-schedule',
  draw: drawPipelineSchedule,
  cues: [
    'pt-pipeline-schedule-0',
    'pt-pipeline-schedule-1',
    'pt-pipeline-schedule-2',
    'four-batches',
  ],
};
