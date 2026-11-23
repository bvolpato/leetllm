import { CPU_LOOP_TRACE } from '../fixtures.mjs';
import { fmt, pair } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import { drawTrainingAndMemoryTarget, drawTrainingAndMemoryText } from '../defaults.mjs';
export function drawTorchLoop(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api,
    currentBeat = state.beat ?? 0;
  const phase = (id, b) => cueProgress(state, id, b);
  {
    if (currentBeat === 0) {
      drawTrainingAndMemoryText(
        ctx,
        api,
        themeColors,
        'Actual CPU reference · AdamW · first update · θ begins at (1, 1)',
        170,
        245,
        31,
        themeColors.muted,
      );
      const lines = [
        ['loop-clear', 'optimizer.zero_grad()'],
        ['loop-backward', 'loss.backward()'],
        ['loop-clip', 'clip_grad_norm_(…, 20)'],
        ['loop-rate', 'lr = current_rate'],
        ['loop-step', 'optimizer.step()'],
        ['loop-scheduler', 'scheduler.step()  # alternative cadence'],
      ];
      lines.forEach(([id, label], i) =>
        drawTrainingAndMemoryTarget(ctx, api, id, () => {
          const p = phase(id, 0),
            y = 365 + i * 105;
          api.circle(
            ctx,
            230,
            y - 10,
            11,
            p === 1 ? themeColors.green : themeColors.bg,
            p > 0 ? themeColors.yellow : themeColors.muted,
            2,
          );
          api.text(
            ctx,
            label,
            270,
            y,
            29,
            p > 0 ? themeColors.ink : themeColors.muted,
            'left',
            'mono',
          );
        }),
      );
      const first = CPU_LOOP_TRACE[0],
        backward = phase('loop-backward', 0),
        clipped = phase('loop-clip', 0),
        stepped = phase('loop-step', 0);
      drawTrainingAndMemoryText(
        ctx,
        api,
        themeColors,
        backward === 1 ? 'Raw gradient: (100, 1)' : 'Raw gradient: pending backward',
        1060,
        375,
        32,
        themeColors.cyan,
      );
      drawTrainingAndMemoryText(
        ctx,
        api,
        themeColors,
        clipped === 1 ? 'Preclip norm ≈ 100.005' : 'Preclip norm = ?',
        1060,
        460,
        33,
        themeColors.yellow,
      );
      drawTrainingAndMemoryText(
        ctx,
        api,
        themeColors,
        clipped === 1 ? 'Used gradient ≈ ' + pair(first.usedGradient) : 'Used gradient = ?',
        1060,
        545,
        32,
        themeColors.green,
      );
      drawTrainingAndMemoryText(
        ctx,
        api,
        themeColors,
        phase('loop-rate', 0) === 1 ? 'This rate = 0.08' : 'This rate = ?',
        1060,
        630,
        32,
        themeColors.ink,
      );
      const plot = teaching.axes({
        x: 1120,
        y: 730,
        width: 520,
        height: 190,
        xDomain: [0.9, 1.01],
        yDomain: [0.9, 1.01],
        equalUnits: true,
        xTicks: [0.92, 1],
        yTicks: [0.92, 1],
        fontSize: 23,
        color: themeColors.muted,
      });
      const a = plot.point(1, 1),
        z = plot.point(1 + (first.after[0] - 1) * stepped, 1 + (first.after[1] - 1) * stepped);
      api.circle(ctx, a.x, a.y, 6, themeColors.ink);
      if (stepped > 0) api.arrow(ctx, a.x, a.y, z.x, z.y, themeColors.green, 6);
      drawTrainingAndMemoryText(
        ctx,
        api,
        themeColors,
        'Completed update: ' + (stepped === 1 ? 1 : 0),
        1060,
        990,
        32,
        themeColors.green,
      );
      drawTrainingAndMemoryText(
        ctx,
        api,
        themeColors,
        stepped === 1 ? 'θ ≈ ' + pair(first.after, 4) : 'Next θ = ?',
        1060,
        1050,
        32,
        themeColors.green,
      );
    } else if (currentBeat === 1) {
      const count = Math.floor(phase('cpu-result', 1) * CPU_LOOP_TRACE.length),
        records = CPU_LOOP_TRACE.slice(0, count),
        last = records.at(-1);
      drawTrainingAndMemoryTarget(ctx, api, 'cpu-run', () => {
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          '60 actual CPU updates · cosine peak 0.08 · decay 0.01 · clip threshold 20',
          170,
          245,
          29,
          themeColors.muted,
        );
        const lossPlot = teaching.axes({
          x: 270,
          y: 370,
          width: 1180,
          height: 290,
          xDomain: [0, 60],
          yDomain: [0, 51],
          xTicks: [0, 20, 40, 60],
          yTicks: [0, 25, 50],
          xLabel: 'completed update',
          yLabel: 'loss',
          fontSize: 24,
          color: themeColors.muted,
        });
        teaching.curve({
          plot: lossPlot,
          points: [
            {
              x: 0,
              y: 50.5,
            },
            ...records.map((r) => ({
              x: r.step,
              y: r.loss,
            })),
          ],
          color: themeColors.green,
          width: 5,
        });
        const normPlot = teaching.axes({
          x: 270,
          y: 780,
          width: 1180,
          height: 160,
          xDomain: [0, 60],
          yDomain: [0, 110],
          xTicks: [0, 20, 40, 60],
          yTicks: [0, 20, 100],
          xLabel: 'completed update',
          yLabel: 'preclip norm',
          fontSize: 23,
          color: themeColors.muted,
        });
        teaching.curve({
          plot: normPlot,
          points: records.map((r) => ({
            x: r.step,
            y: r.preclipNorm,
          })),
          color: themeColors.cyan,
          width: 3,
        });
        const threshold = normPlot.point(0, 20),
          end = normPlot.point(60, 20);
        api.line(ctx, threshold.x, threshold.y, end.x, end.y, themeColors.yellow, 2);
        for (const r of records.filter((r) => r.preclipNorm > 20)) {
          const p = normPlot.point(r.step, r.preclipNorm);
          api.circle(ctx, p.x, p.y, 4, themeColors.pink);
        }
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          'Completed ' + count + ' / 60',
          1510,
          390,
          31,
          themeColors.ink,
        );
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          'Current L ≈ ' + fmt(last?.loss ?? 50.5, 6),
          1510,
          470,
          28,
          themeColors.green,
        );
      });
      drawTrainingAndMemoryTarget(ctx, api, 'cpu-result', () =>
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          phase('cpu-result', 1) === 1
            ? 'Final θ ≈ ' + pair(last.after, 5) + ' · L ≈ ' + fmt(last.loss, 6)
            : 'Final weight  ?',
          960,
          1050,
          32,
          themeColors.green,
          'center',
        ),
      );
      drawTrainingAndMemoryTarget(ctx, api, 'cpu-norm', () =>
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          phase('cpu-norm', 1) === 1 ? 'Max norm ≈ 100.005' : 'Max norm = ?',
          1510,
          610,
          27,
          themeColors.cyan,
        ),
      );
      drawTrainingAndMemoryTarget(ctx, api, 'cpu-count', () =>
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          phase('cpu-count', 1) === 1 ? '11 clipped updates' : 'Clipped count = ?',
          1510,
          720,
          29,
          themeColors.pink,
        ),
      );
    } else {
      drawTrainingAndMemoryText(
        ctx,
        api,
        themeColors,
        'Supplied AMP arithmetic · real gradient (3, 4) · scale 8 · clip threshold 5',
        170,
        245,
        30,
        themeColors.muted,
      );
      drawTrainingAndMemoryTarget(ctx, api, 'amp-unscale', () => {
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          'Clip scaled → unscale',
          230,
          360,
          34,
          themeColors.pink,
        );
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          '(24, 32) → (3, 4) → (0.375, 0.5)',
          230,
          425,
          31,
          themeColors.pink,
        );
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          'Unscale → clip',
          230,
          535,
          34,
          themeColors.green,
        );
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          '(24, 32) → (3, 4) → (3, 4)',
          230,
          600,
          31,
          themeColors.green,
        );
        const plot = teaching.axes({
          x: 250,
          y: 725,
          width: 630,
          height: 240,
          xDomain: [0, 6],
          yDomain: [0, 6],
          equalUnits: true,
          xTicks: [0, 3],
          yTicks: [0, 4],
          fontSize: 22,
          color: themeColors.muted,
        });
        const zero = plot.point(0, 0),
          p = phase('amp-unscale', 2);
        for (const [values, color] of [
          [[0.375, 0.5], themeColors.pink],
          [[3 * p, 4 * p], themeColors.green],
        ]) {
          const end = plot.point(...values);
          api.arrow(ctx, zero.x, zero.y, end.x, end.y, color, 5);
        }
      });
      drawTrainingAndMemoryTarget(ctx, api, 'amp-skip', () =>
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          phase('amp-skip', 2) > 0
            ? 'Nonfinite case: optimizer update skipped'
            : 'Nonfinite case = ?',
          1080,
          360,
          32,
          themeColors.pink,
        ),
      );
      drawTrainingAndMemoryTarget(ctx, api, 'amp-clock', () => {
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          'Completed optimizer clock: 0',
          1080,
          465,
          30,
          themeColors.muted,
        );
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          'Per-update schedule clock: 0',
          1080,
          535,
          30,
          themeColors.muted,
        );
      });
      drawTrainingAndMemoryTarget(ctx, api, 'zero-rate-clock', () => {
        if (phase('zero-rate-clock', 2) > 0) {
          drawTrainingAndMemoryText(
            ctx,
            api,
            themeColors,
            'Separate zero-rate step with g present',
            1080,
            680,
            30,
            themeColors.yellow,
          );
          drawTrainingAndMemoryText(
            ctx,
            api,
            themeColors,
            'θ holds · moments advance · t becomes 1',
            1080,
            750,
            30,
            themeColors.yellow,
          );
        } else
          drawTrainingAndMemoryText(
            ctx,
            api,
            themeColors,
            'Zero rate and skipped step are distinct.',
            1080,
            720,
            30,
            themeColors.muted,
          );
      });
      drawTrainingAndMemoryTarget(ctx, api, 'amp-scale-update', () =>
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          phase('amp-scale-update', 2) === 1
            ? 'Scaler update: once after the complete window'
            : 'Scaler update = ?',
          960,
          1050,
          32,
          themeColors.green,
          'center',
        ),
      );
    }
  }
}
export default {
  id: 'torch-loop',
  draw: drawTorchLoop,
  cues: [
    'loop-clear',
    'loop-backward',
    'loop-clip',
    'loop-rate',
    'loop-step',
    'loop-scheduler',
    'cpu-run',
    'cpu-result',
    'cpu-norm',
    'cpu-count',
    'amp-unscale',
    'amp-skip',
    'amp-clock',
    'zero-rate-clock',
    'amp-scale-update',
  ],
};
