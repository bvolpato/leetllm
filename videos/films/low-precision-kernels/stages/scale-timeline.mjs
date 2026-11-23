import { roundTrip } from '../encoding.mjs';
import { cueDone, sampleModel } from '../construction.mjs';
import { dot, labelText, line, vector } from '../defaults.mjs';
export function drawScaleTimeline(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('scale-timeline', state),
    currentBeat = modelState.step,
    progress2 = modelState.q;
  const ready = (name) => cueDone(state, 'lp-scale-timeline-' + name);
  api.focus.target('lp-scale-timeline-trace', () => {
    const start = 300,
      w = 1360,
      cell = w / 8;
    labelText(
      ctx,
      api,
      'Supplied tensor · same values in both dependency recipes',
      960,
      300,
      32,
      themeColors.muted,
      'center',
    );
    if (currentBeat < 2)
      vector(ctx, api, [4, 16, 64, 700, -2, -8, -32, -250], start, 355, w, 80, [3]);
    if (currentBeat === 0) {
      const count = Math.floor(progress2 * 16);
      for (let pass = 0; pass < 2; pass++) {
        const y = 575 + pass * 190;
        labelText(
          ctx,
          api,
          pass ? 'read 2: scale + cast' : 'read 1: find amax',
          150,
          y,
          27,
          pass ? themeColors.cyan : themeColors.blue,
        );
        for (let i = 0; i < 8; i++)
          api.rect(
            ctx,
            start + i * cell,
            y + 35,
            cell - 4,
            48,
            count > pass * 8 + i ? (pass ? themeColors.cyan : themeColors.blue) : themeColors.panel,
            themeColors.muted,
            0,
          );
        if (count > pass * 8 && count < (pass + 1) * 8)
          dot(ctx, api, start + (count - pass * 8 + 0.5) * cell, y + 125, themeColors.yellow, 9);
      }
      labelText(
        ctx,
        api,
        ready('second')
          ? 'Scale depends on completed current amax'
          : 'Current amax → scale → second read',
        960,
        1000,
        30,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      const old = [10, 8, 6],
        newHistory = modelState.history,
        updated = modelState.complete && ready('history');
      labelText(ctx, api, 'Previous history owns today’s scale', 150, 535, 31, themeColors.blue);
      vector(ctx, api, old, 250, 590, 650, 85);
      labelText(ctx, api, 'max = 10 · S = 10/448', 1350, 640, 33, themeColors.yellow, 'center');
      const count = modelState.count;
      for (let i = 0; i < 8; i++)
        api.rect(
          ctx,
          start + i * cell,
          760,
          cell - 4,
          58,
          i < count ? themeColors.cyan : themeColors.panel,
          themeColors.muted,
          0,
        );
      labelText(
        ctx,
        api,
        modelState.complete
          ? 'Current amax = 700 · pass complete'
          : 'Recorded amax so far: ' + (modelState.observedMax ?? 'pending'),
        960,
        885,
        29,
        themeColors.cyan,
        'center',
      );
      if (updated) {
        vector(ctx, api, newHistory, 700, 940, 550, 65);
        labelText(ctx, api, 'future history', 520, 984, 25, themeColors.green);
      }
    } else {
      labelText(
        ctx,
        api,
        'History [500, 10, 8] · current typical value 0.001',
        960,
        415,
        34,
        themeColors.blue,
        'center',
      );
      const scale = 500 / 448,
        z = roundTrip(0.001, scale);
      line(ctx, api, 320, 590, 1610, 590);
      labelText(ctx, api, 'history maximum 500', 320, 535, 28, themeColors.pink);
      labelText(ctx, api, 'S = 500/448', 960, 535, 31, themeColors.yellow, 'center');
      labelText(
        ctx,
        api,
        'x / S ≈ ' + z.scaled.toFixed(6),
        960,
        720,
        34,
        themeColors.blue,
        'center',
      );
      labelText(
        ctx,
        api,
        'Tiny reconstruction: ' + z.reconstructed,
        960,
        860,
        39,
        themeColors.pink,
        'center',
      );
      labelText(
        ctx,
        api,
        'A historical outlier keeps today’s grid too coarse',
        960,
        1010,
        28,
        themeColors.muted,
        'center',
      );
    }
  });
}
export default {
  id: 'scale-timeline',
  draw: drawScaleTimeline,
  cues: [
    'lp-scale-timeline-build-0',
    'lp-scale-timeline-second',
    'lp-scale-timeline-build-1',
    'lp-scale-timeline-history',
    'lp-scale-timeline-build-2',
  ],
};
