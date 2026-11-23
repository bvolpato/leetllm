import { phase } from '../arithmetic.mjs';
import { TRACKS, thresholdSnapshot } from '../construction.mjs';
import { focusScope, legacyText, recordCard } from '../defaults.mjs';
export function drawThreshold(ctx, scene, state, api) {
  const { C: themeColors, components, teaching } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const snapshot = TRACKS['threshold'].sample({
    beat,
    beatP: progress,
  }).snapshot;
  {
    const current = thresholdSnapshot(beat, progress);
    legacyText(ctx, api, current.mode, 960, 265, 34, themeColors.ink, 'center');
    legacyText(
      ctx,
      api,
      `Current cutoff ≈ ${current.threshold > 1 ? '> 1' : current.threshold.toFixed(5)} · alert when score ≥ cutoff`,
      960,
      325,
      29,
      themeColors.yellow,
      'center',
    );
    const plot = teaching.axes({
      x: 260,
      y: 425,
      width: 1030,
      height: 335,
      xDomain: [0, 1],
      yDomain: [0, 32],
      xTicks: [0, 0.25, 0.5, 0.75, 1],
      yTicks: [0, 10, 20, 30],
      xLabel: 'April model score · 20 equal-width bins',
      yLabel: 'jobs',
      fontSize: 24,
    });
    legacyText(
      ctx,
      api,
      'Pink: actual miss · blue: on time · bright: changed · outline: alerted',
      790,
      390,
      24,
      themeColors.ink,
      'center',
    );
    focusScope(ctx, api, 'threshold-simulation-45', () =>
      current.histogram.forEach((bin) => {
        const rows = current.outcomes.filter(
            (r) => Math.min(19, Math.floor(r.score * 20)) === bin.bin,
          ),
          left = plot.point((bin.bin + 0.08) / 20, 0).x,
          right = plot.point((bin.bin + 0.92) / 20, 0).x;
        rows.forEach((row, index) => {
          const top = plot.point(0, index + 1).y,
            bottom = plot.point(0, index).y,
            changed = current.changedIds.includes(row.id);
          components.fade(changed ? 1 : 0.4, () =>
            api.rect(
              ctx,
              left,
              top + 1,
              right - left,
              Math.max(2, bottom - top - 2),
              row.label ? themeColors.pink : themeColors.blue,
              row.alert ? themeColors.yellow : themeColors.muted,
              1,
            ),
          );
        });
      }),
    );
    if (current.threshold <= 1) {
      const markerX = plot.point(current.threshold, 0).x;
      api.path(
        ctx,
        [
          {
            x: markerX,
            y: 425,
          },
          {
            x: markerX,
            y: 760,
          },
        ],
        {
          color: themeColors.yellow,
          width: 4,
        },
      );
      api.circle(ctx, markerX, 415, 8, themeColors.yellow);
    }
    focusScope(ctx, api, 'threshold-simulation-50', () =>
      [
        ['Caught actual misses', current.tp, themeColors.green],
        ['False alarms', current.fp, themeColors.blue],
        ['Uncaught actual misses', current.fn, current.fn ? themeColors.pink : themeColors.green],
        ['On-time, no alert', current.tn, themeColors.cyan],
      ].forEach(([label, value, color], index) => {
        recordCard(
          ctx,
          api,
          'threshold',
          `${label}: ${value}`,
          1370,
          425 + index * 100,
          390,
          76,
          color,
          1,
          26,
        );
      }),
    );
    if (current.costDelta !== 0) {
      const q = phase((progress * 5) % 1, 0.05, 0.85),
        x = 690 + 470 * q;
      legacyText(ctx, api, 'reference ' + current.referenceCost, 280, 885, 27, themeColors.muted);
      if (x - 108 > 650) api.line(ctx, 650, 862, x - 108, 862, themeColors.muted, 2);
      if (x + 108 < 1330) api.arrow(ctx, x + 108, 862, 1330, 862, themeColors.muted, 2);
      api.rect(ctx, x - 90, 838, 180, 64, themeColors.panel);
      legacyText(
        ctx,
        api,
        (current.costDelta > 0 ? '+' : '') + current.costDelta,
        x,
        885,
        31,
        current.costDelta < 0 ? themeColors.green : themeColors.pink,
        'center',
      );
      legacyText(ctx, api, 'current ' + current.cost, 1450, 885, 27, themeColors.yellow);
    } else
      legacyText(
        ctx,
        api,
        'Every decision uses its unrounded row score.',
        960,
        885,
        27,
        themeColors.muted,
        'center',
      );
    legacyText(
      ctx,
      api,
      `Current cost: ${current.fp} × 8 + ${current.standardMisses} × 60 + ${current.priorityMisses} × 150 = ${current.cost}`,
      960,
      950,
      32,
      themeColors.yellow,
      'center',
    );
    const footer =
      beat === 0
        ? `${current.searchLabel} · best evaluated cost ${current.bestEvaluated.cost}`
        : beat === 1
          ? '140 supplied April jobs · seed 11 · selected 50-tree model · 58 actual misses caught, 0 uncaught'
          : current.searchLabel;
    legacyText(
      ctx,
      api,
      footer,
      960,
      990,
      25,
      beat === 1 ? themeColors.green : themeColors.ink,
      'center',
    );
  }
}
export default {
  id: 'threshold',
  draw: drawThreshold,
  cues: [
    'threshold-beat-1-focus-1',
    'threshold-beat-1-focus-2',
    'threshold-beat-2-focus-1',
    'threshold-beat-2-focus-2',
    'threshold-beat-3-focus-1',
  ],
};
