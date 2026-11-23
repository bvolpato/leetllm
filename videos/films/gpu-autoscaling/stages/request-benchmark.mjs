import { gaBound } from '../arithmetic.mjs';
import { drawGpuUpgradeFoot, drawGpuUpgradeHead, drawGpuUpgradeText } from '../defaults.mjs';
export function drawRequestBenchmark(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  api.focus.target('request-benchmark-mechanism', () => {
    const { C: delegatedColors, components: delegatedComponents } = api,
      delegatedBeat = state.beat ?? 0,
      delegatedProgress = gaBound(state.beatP ?? 0);
    {
      drawGpuUpgradeHead(
        ctx,
        api,
        upgradeColors,
        'Freeze the request population before changing the serving configuration',
      );
      const groups = [
        ['interactive', 60, delegatedColors.cyan],
        ['long review', 25, delegatedColors.blue],
        ['background', 15, delegatedColors.pink],
      ];
      let x = 220;
      for (const [name, n, col] of groups) {
        api.rect(ctx, x, 390, n * 14, 100, col);
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          name + ' ' + n + '%',
          x + n * 7,
          555,
          30,
          col,
          'center',
        );
        x += n * 14;
      }
      const fields = [
        'arrival / send lag',
        'prompt / output lengths',
        'prefix / tenant / priority',
        'stream / stop / quality',
      ];
      fields.forEach((s, i) =>
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          s,
          260 + (i % 2) * 900,
          700 + Math.floor(i / 2) * 130,
          30,
          delegatedColors.ink,
        ),
      );
      drawGpuUpgradeFoot(
        ctx,
        api,
        upgradeColors,
        delegatedBeat === 1
          ? 'Bound offered load and the client queue; keep rejects, cancellations and timeouts'
          : 'Same release, hardware, topology, tuning effort and correctness gate throughout the sweep',
      );
    }
  });
}
export default {
  id: 'request-benchmark',
  draw: drawRequestBenchmark,
  cues: ['ga-request-benchmark-b0', 'ga-request-benchmark-b1', 'ga-request-benchmark-b2'],
};
