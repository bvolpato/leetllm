import { gradientFixture } from '../arithmetic.mjs';
import { afterCue, sampleModel } from '../construction.mjs';
import {
  drawExtensionCell,
  drawExtensionFooter,
  drawExtensionL,
  drawExtensionRectangle,
  drawExtensionText,
} from '../defaults.mjs';
export function drawMeasurementProfile(ctx, scene, state, api) {
  return api.focus.target('fa-' + scene.id + '-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('measurement-profile', state),
      { b: currentBeat, p: progress } = modelState,
      teaching2 = gradientFixture();
    {
      if (currentBeat === 0) {
        const rows = ['prefill / decode', 'unequal lengths / GQA', 'width / masks / packed'];
        rows.forEach((n, i) => {
          const y = 350 + i * 200;
          drawExtensionText(ctx, api, n, 200, y + 50, 32, themeColors.blue);
          for (let col = 0; col < 7; col++) {
            drawExtensionRectangle(
              ctx,
              api,
              790 + col * 130,
              y,
              100,
              95,
              col + i < Math.ceil(progress * 10) ? themeColors.cyan : themeColors.muted,
            );
            if (col < 2)
              drawExtensionText(
                ctx,
                api,
                col ? 'warm' : 'compile',
                840 + col * 130,
                y + 58,
                19,
                themeColors.muted,
                'center',
              );
          }
        });
        drawExtensionFooter(
          ctx,
          api,
          'Identical inputs · discard compilation/first allocations · production fallback is a baseline',
        );
      } else if (currentBeat === 1) {
        const raw = [41, 39, 43, 40, 38, 42, 40, 44, 39],
          sorted = raw.toSorted((a, b) => a - b),
          ys = raw.map((v, i) => 350 + i * 68);
        drawExtensionText(
          ctx,
          api,
          'Illustrative repeated durations, ms',
          960,
          290,
          32,
          themeColors.yellow,
          'center',
        );
        const medianIndex = Math.floor(sorted.length / 2);
        const tailIndex = Math.ceil(0.9 * sorted.length) - 1;
        for (let i = 0; i < raw.length; i++) {
          const val = modelState.sorted ? sorted[i] : raw[i],
            y = ys[i];
          drawExtensionText(ctx, api, val, 300, y + 30, 26, themeColors.cyan);
          api.rect(ctx, 430, y, (1100 * val) / 50, 38, themeColors.cyan, undefined, 0);
          if (i === medianIndex && afterCue(state, 1, 'timing-median'))
            drawExtensionText(
              ctx,
              api,
              'Median · ' + val + ' ms',
              1440,
              y + 30,
              33,
              themeColors.yellow,
            );
          if (i === tailIndex && afterCue(state, 1, 'timing-tail'))
            drawExtensionText(
              ctx,
              api,
              'p90 · ' + val + ' ms',
              1440,
              y + 30,
              33,
              themeColors.yellow,
            );
        }
        drawExtensionText(
          ctx,
          api,
          modelState.sorted
            ? 'Nine warmed runs in ascending order  ·  nearest-rank percentile'
            : 'Nine warmed runs in collection order',
          960,
          1020,
          29,
          themeColors.yellow,
          'center',
        );
      } else {
        const lanes = [
          ['Nsight Systems', 'launch / transfer / stream gaps'],
          ['Nsight Compute', 'memory / arithmetic / roofline'],
          ['Interpretation', 'traffic / shared memory / registers / occupancy'],
        ];
        lanes.forEach(([n, v], i) => {
          drawExtensionCell(ctx, api, n, 180, 350 + i * 220, 500, 100, themeColors.blue);
          if (progress > i / 3)
            drawExtensionCell(ctx, api, v, 800, 350 + i * 220, 900, 100, themeColors.cyan);
          drawExtensionL(ctx, api, 680, 400 + i * 220, 800, 400 + i * 220);
        });
        drawExtensionFooter(
          ctx,
          api,
          'Representative workload required · no profiler or target-hardware benchmark executed here',
        );
      }
    }
  });
}
export default {
  id: 'measurement-profile',
  draw: drawMeasurementProfile,
  cues: [
    'fa-measurement-profile-0',
    'fa-measurement-profile-1',
    'fa-timing-sort',
    'timing-median',
    'timing-tail',
    'fa-measurement-profile-2',
  ],
};
