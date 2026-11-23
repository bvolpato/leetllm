import { detailText } from '../defaults.mjs';
export function drawScaleBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (i) =>
    currentBeat < i
      ? 0
      : currentBeat > i
        ? 1
        : api.focus.progress('scale-budget-b' + (i + 1), api.phase(progress, 0.08, 0.7));
  const target = 'scale-budget-mechanism';
  api.focus.target(target, () => {
    if (currentBeat === 0) {
      detailText(ctx, api, '100 million vectors', 960, 280, 42, themeColors.blue, 'center');
      for (let i = 0; i < 100; i++) {
        const x = 190 + (i % 20) * 77,
          y = 360 + Math.floor(i / 20) * 77;
        api.rect(
          ctx,
          x,
          y,
          62,
          50,
          themeColors.panel,
          i / 100 < cue(0) ? themeColors.cyan : themeColors.muted,
          2,
          5,
        );
      }
      detailText(
        ctx,
        api,
        'Each tile = 1 million vectors × 1,536 coordinates × 4 bytes',
        960,
        830,
        35,
        themeColors.ink,
        'center',
      );
      detailText(
        ctx,
        api,
        ((100e6 * 1536) / 1e9).toFixed(1) + ' billion components',
        550,
        950,
        44,
        themeColors.yellow,
        'center',
      );
      detailText(
        ctx,
        api,
        ((100e6 * 1536 * 4) / 1024 ** 3).toFixed(1) + ' GiB raw',
        1450,
        950,
        44,
        themeColors.green,
        'center',
      );
    } else if (currentBeat === 1) {
      const probes = api.focus.progress('raise-probes', 0) > 0 ? 20 : 5,
        work = (probes * 1e6) / 1024;
      detailText(
        ctx,
        api,
        '1,024 balanced lists · 1 million vectors',
        960,
        300,
        38,
        themeColors.ink,
        'center',
      );
      for (let i = 0; i < 20; i++) {
        const x = 210 + (i % 10) * 150,
          y = 420 + Math.floor(i / 10) * 145;
        api.rect(
          ctx,
          x,
          y,
          120,
          100,
          themeColors.panel,
          i < probes ? themeColors.pink : themeColors.muted,
          3,
          10,
        );
        detailText(
          ctx,
          api,
          'list ' + i,
          x + 60,
          y + 65,
          27,
          i < probes ? themeColors.pink : themeColors.muted,
          'center',
        );
      }
      detailText(ctx, api, probes.toFixed(0) + ' probes', 550, 820, 42, themeColors.pink, 'center');
      detailText(
        ctx,
        api,
        '≈ ' + Math.round(work).toLocaleString('en-US') + ' list vectors scored',
        1350,
        820,
        38,
        themeColors.green,
        'center',
      );
      detailText(
        ctx,
        api,
        'Coarse centroid scores stay 1,024 · work is not elapsed time',
        960,
        970,
        33,
        themeColors.muted,
        'center',
      );
    } else {
      const data = [
        {
          x: 4,
          y: 0.4,
        },
        {
          x: 7,
          y: 0.75,
        },
        {
          x: 12,
          y: 0.85,
        },
        {
          x: 20,
          y: 0.91,
        },
        {
          x: 12,
          y: 0.7,
        },
      ];
      const X = (x) => 260 + x * 60,
        Y = (y) => 875 - y * 550;
      api.line(ctx, 250, 875, 1610, 875, themeColors.muted, 3);
      api.line(ctx, 250, 875, 250, 330, themeColors.muted, 3);
      detailText(ctx, api, 'illustrative latency →', 1020, 970, 32, themeColors.muted, 'center');
      detailText(ctx, api, 'recall', 155, 310, 31, themeColors.muted);
      data.forEach((d, i) => {
        api.circle(ctx, X(d.x), Y(d.y), 15, i === 4 ? themeColors.red : themeColors.green);
        detailText(
          ctx,
          api,
          i === 4 ? 'dominated' : 'setting ' + (i + 1),
          X(d.x) + 25,
          Y(d.y) - 25,
          28,
          i === 4 ? themeColors.red : themeColors.green,
        );
      });
      detailText(
        ctx,
        api,
        'Supplied operating points · compare the joint frontier',
        960,
        255,
        34,
        themeColors.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'scale-budget',
  draw: drawScaleBudget,
  cues: ['scale-budget-b1', 'scale-budget-b2', 'raise-probes', 'scale-budget-b3'],
};
