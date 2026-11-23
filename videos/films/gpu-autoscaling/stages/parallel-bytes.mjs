import { gaBound, gaComplete } from '../arithmetic.mjs';
import {
  drawGpuUpgradeArrow,
  drawGpuUpgradeBox,
  drawGpuUpgradeFoot,
  drawGpuUpgradeHead,
  drawGpuUpgradeText,
} from '../defaults.mjs';
export function drawParallelBytes(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  const done = (name, fallback = progress > 0.7) => gaComplete(state, 'ga-' + name, fallback);
  api.focus.target('parallel-bytes-mechanism', () => {
    const { C: delegatedColors, components: delegatedComponents } = api,
      delegatedBeat = state.beat ?? 0,
      delegatedProgress = gaBound(state.beatP ?? 0);
    {
      drawGpuUpgradeHead(
        ctx,
        api,
        upgradeColors,
        'Same four devices · different ownership of an eighty-layer computation',
      );
      for (let j = 0; j < 4; j++) {
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          'GPU ' + j,
          220 + j * 420,
          365,
          350,
          80,
          delegatedColors.blue,
        );
        for (let k = 0; k < 4; k++)
          api.rect(
            ctx,
            250 + j * 420,
            500 + k * 55,
            290,
            30,
            delegatedBeat === 0 ? delegatedColors.cyan : delegatedColors.blue,
          );
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          delegatedBeat === 0 ? 'matrix shard' : 'layers ' + (j * 20 + 1) + '–' + (j + 1) * 20,
          395 + j * 420,
          825,
          27,
          delegatedColors.cyan,
          'center',
        );
        if (j < 3)
          drawGpuUpgradeArrow(
            ctx,
            api,
            upgradeColors,
            580 + j * 420,
            700,
            620 + j * 420,
            700,
            delegatedColors.pink,
          );
      }
      if (delegatedBeat > 0 && done('tp-events', delegatedBeat > 1))
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'TP: 80 layers × 2 × 32 = 5,120 collective events',
          960,
          910,
          31,
          delegatedColors.cyan,
          'center',
        );
      if (delegatedBeat > 0 && done('pp-events', delegatedBeat > 1))
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'PP: 3 stage boundaries × 32 = 96 transfers',
          960,
          970,
          30,
          delegatedColors.pink,
          'center',
        );
      drawGpuUpgradeFoot(
        ctx,
        api,
        upgradeColors,
        delegatedBeat === 2
          ? 'Event count does not establish bytes, overlap, topology cost or lower service latency'
          : 'Schematic tensor or layer ownership; exact collectives depend on the runtime',
      );
    }
  });
}
export default {
  id: 'parallel-bytes',
  draw: drawParallelBytes,
  cues: [
    'ga-parallel-bytes-b0',
    'ga-parallel-bytes-b1',
    'ga-tp-events',
    'ga-pp-events',
    'ga-parallel-bytes-b2',
  ],
};
