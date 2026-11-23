import { completeTraceQuantiles } from '../arithmetic.mjs';
import { phaseDurations } from '../fixtures.mjs';
import { completionCue } from '../construction.mjs';
import {
  completionBox,
  completionFooter,
  completionHeading,
  completionText,
} from '../defaults.mjs';
export function drawTraceQuantiles(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    done = (id) => completionCue(state, id) >= 1;
  const drawMechanism = () => {
    const f = completeTraceQuantiles();
    completionHeading(
      ctx,
      api,
      currentBeat
        ? 'Preserve complete request rows before taking rank 19'
        : 'Exact serial stage allocations on the edit-to-paint clock',
    );
    if (currentBeat === 0) {
      let x = 220;
      const colors = [
        themeColors.blue,
        themeColors.cyan,
        themeColors.green,
        themeColors.pink,
        themeColors.yellow,
      ];
      phaseDurations.forEach((v, i) => {
        const w = v * 7;
        api.rect(ctx, x, 500, w, 160, themeColors.panel, colors[i], 2, 4);
        completionText(ctx, api, v + ' ms', x + w / 2, 450, 29, colors[i], 'center');
        x += w;
      });
      if (done('cc-total183'))
        completionText(
          ctx,
          api,
          '12 + 55 + 28 + 78 + 10 = 183 ms',
          960,
          800,
          41,
          themeColors.green,
          'center',
        );
      if (done('cc-total333'))
        completionText(
          ctx,
          api,
          '150 ms debounce + 183 = 333 ms',
          960,
          920,
          37,
          themeColors.pink,
          'center',
        );
    } else {
      f.rows.forEach((r, i) => {
        const x = 160 + (i % 5) * 340,
          y = 385 + Math.floor(i / 5) * 110;
        completionBox(
          ctx,
          api,
          `R${r.id}: ${r.a} + ${r.b} = ${r.total}`,
          x,
          y,
          300,
          70,
          i < 2 ? themeColors.yellow : themeColors.blue,
        );
      });
      if (done('cc-complete101')) {
        completionText(
          ctx,
          api,
          'Complete sums p95 = 101',
          600,
          925,
          36,
          themeColors.green,
          'center',
        );
        completionText(
          ctx,
          api,
          'Stage p95 sum = 1 + 1 = 2',
          1410,
          925,
          34,
          themeColors.pink,
          'center',
        );
      }
      completionFooter(
        ctx,
        api,
        'Nearest rank: ceil(0.95 × 20) = 19 · slow stages belong to different requests',
      );
    }
  };
  api.focus.target('cc-trace-quantiles-mechanism', drawMechanism);
  return;
}
export default {
  id: 'trace-quantiles',
  draw: drawTraceQuantiles,
  cues: [
    'cc-trace-quantiles-0',
    'cc-total183',
    'cc-total333',
    'cc-trace-quantiles-1',
    'cc-rank19',
    'cc-complete101',
  ],
};
