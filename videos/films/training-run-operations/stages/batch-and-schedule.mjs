import { adamScaleProposal, clamp, motion } from '../arithmetic.mjs';
import { trainingCue, trainingStarted } from '../construction.mjs';
import { drawBox, drawCell, drawFooter, drawLine, drawText } from '../defaults.mjs';
export function drawBatchAndSchedule(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    q = motion(progress);
  api.focus.target('batch-and-schedule-mechanism', () => {
    if (beat === 0) {
      drawText(
        ctx,
        api,
        'Supplied regular mesh · 64 GPUs / (TP2 × PP2 × CP2)',
        960,
        285,
        36,
        themeColors.blue,
        'center',
      );
      for (let group = 0; group < 8; group++) {
        const x = 175 + (group % 4) * 430,
          y = 365 + Math.floor(group / 4) * 270;
        drawText(ctx, api, 'DP replica ' + group, x + 150, y - 15, 27, themeColors.cyan, 'center');
        for (let z = 0; z < 2; z++) {
          drawText(ctx, api, 'CP ' + z, x + z * 180 + 75, y + 25, 24, themeColors.yellow, 'center');
          for (let yy = 0; yy < 2; yy++)
            for (let xx = 0; xx < 2; xx++) {
              const rx = x + xx * 80 + z * 180,
                ry = y + 50 + yy * 75;
              drawBox(ctx, api, rx, ry, 70, 55, z ? themeColors.yellow : themeColors.blue);
              drawText(
                ctx,
                api,
                'GPU',
                rx + 35,
                ry + 36,
                19,
                z ? themeColors.yellow : themeColors.blue,
                'center',
              );
            }
        }
      }
      drawText(
        ctx,
        api,
        '8 independent replicas × 2 sequences × 4 microbatches = 64',
        960,
        960,
        35,
        themeColors.yellow,
        'center',
      );
      drawFooter(ctx, api, 'Each replica has two TP columns, two PP rows and two CP grids.');
    } else if (beat === 1) {
      drawText(ctx, api, 'Warmup measured in examples', 960, 285, 39, themeColors.yellow, 'center');
      for (const [i, batch] of [64, 128].entries()) {
        const y = 380 + i * 280,
          width = 1450,
          limit = 12800;
        drawText(
          ctx,
          api,
          batch + ' examples / update',
          960,
          y - 15,
          32,
          themeColors.blue,
          'center',
        );
        drawBox(ctx, api, 230, y + 35, width, 95, themeColors.muted);
        const toBudget =
          i === 1 ? trainingCue(state, 'schedule-remap', clamp((progress - 0.7) * 8)) : 0;
        const growth = trainingCue(
          state,
          i ? 'schedule-128' : 'schedule-64',
          clamp((progress - i * 0.3) * 5),
        );
        const updates = Math.round((100 - 50 * toBudget) * growth);
        const examples = updates * batch;
        api.rect(
          ctx,
          234,
          y + 39,
          ((width - 8) * examples) / limit,
          87,
          i ? themeColors.pink : themeColors.cyan,
          undefined,
          0,
        );
        drawText(
          ctx,
          api,
          updates + ' updates → ' + examples.toLocaleString('en-US') + ' examples',
          960,
          y + 190,
          35,
          i ? themeColors.pink : themeColors.cyan,
          'center',
        );
        drawLine(
          ctx,
          api,
          230 + (width * 6400) / limit,
          y + 15,
          230 + (width * 6400) / limit,
          y + 150,
          themeColors.yellow,
          4,
        );
      }
      if (trainingCue(state, 'schedule-remap', progress > 0.82 ? 1 : 0) === 1)
        drawText(
          ctx,
          api,
          'Preserve budget at batch 128: ' + (100 * 64) / 128 + ' successful updates',
          960,
          1000,
          31,
          themeColors.green,
          'center',
        );
    } else {
      drawText(
        ctx,
        api,
        'Supplied Adam scaling proposal · κ = 2',
        960,
        285,
        38,
        themeColors.blue,
        'center',
      );
      const initial = {
          rate: 0.001,
          beta1: 0.9,
          beta2: 0.999,
          epsilon: 1e-8,
        },
        scaled = adamScaleProposal(initial, 2);
      const f = [
        ['learning rate', initial.rate.toFixed(3), scaled.rate.toFixed(6)],
        ['β₁', initial.beta1.toFixed(3), scaled.beta1.toFixed(3)],
        ['β₂', initial.beta2.toFixed(3), scaled.beta2.toFixed(3)],
        [
          'epsilon',
          initial.epsilon.toExponential(3).replace('-', '−'),
          scaled.epsilon.toExponential(3),
        ],
      ];
      f.forEach(([name, from, to], i) => {
        const y = 365 + i * 140;
        drawText(ctx, api, name, 220, y + 45, 32, themeColors.muted);
        drawCell(ctx, api, from, 650, y, 370, 85, themeColors.blue, 35);
        drawCell(
          ctx,
          api,
          trainingStarted(
            state,
            [
              'schedule-scaling',
              'batch-and-schedule-step-3',
              'batch-and-schedule-step-3',
              'schedule-epsilon',
            ][i],
            progress > 0.3,
          )
            ? to
            : '…',
          1240,
          y,
          370,
          85,
          themeColors.cyan,
          35,
        );
        drawLine(ctx, api, 1055, y + 42, 1195, y + 42, themeColors.muted, 4);
      });
      drawFooter(
        ctx,
        api,
        'Coupled conditional approximation · valid coefficients and controlled empirical comparison are still required.',
      );
    }
  });
}
export default {
  id: 'batch-and-schedule',
  draw: drawBatchAndSchedule,
  cues: [
    'batch-and-schedule-step-1',
    'schedule-replicas',
    'batch-and-schedule-step-2',
    'schedule-64',
    'schedule-128',
    'schedule-remap',
    'batch-and-schedule-step-3',
    'schedule-scaling',
    'schedule-epsilon',
  ],
};
