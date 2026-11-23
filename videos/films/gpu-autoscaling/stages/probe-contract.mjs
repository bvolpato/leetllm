import { gaBound, gaComplete, gaProgress } from '../arithmetic.mjs';
import {
  drawGpuUpgradeBox,
  drawGpuUpgradeFoot,
  drawGpuUpgradeHead,
  drawGpuUpgradeText,
} from '../defaults.mjs';
export function drawProbeContract(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  const q = (name, fallback = progress) => gaProgress(state, 'ga-' + name, fallback),
    done = (name, fallback = progress > 0.7) => gaComplete(state, 'ga-' + name, fallback);
  api.focus.target('probe-contract-mechanism', () => {
    const { C: delegatedColors, components: delegatedComponents } = api,
      delegatedBeat = state.beat ?? 0,
      delegatedProgress = gaBound(state.beatP ?? 0);
    {
      const stages = ['not loaded', 'loaded / not warm', 'ready', 'duplicate ID', 'capacity full'],
        step = delegatedBeat
          ? 4
          : done('probe-full')
            ? 4
            : done('probe-duplicate')
              ? 3
              : done('probe-ready')
                ? 2
                : Math.min(1, Math.floor(q('probe-contract-b0') * 2));
      drawGpuUpgradeHead(
        ctx,
        api,
        upgradeColors,
        'Same two local request slots · actual worker contract',
      );
      drawGpuUpgradeText(
        ctx,
        api,
        upgradeColors,
        stages[step],
        960,
        375,
        36,
        step < 2 ? delegatedColors.yellow : delegatedColors.cyan,
        'center',
      );
      for (let i = 0; i < 2; i++) {
        const active = step >= 2;
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          active ? 'R' + (i + 1) + ' · active' : 'empty slot',
          420 + i * 660,
          500,
          520,
          145,
          active ? delegatedColors.cyan : delegatedColors.muted,
          33,
        );
      }
      drawGpuUpgradeText(
        ctx,
        api,
        upgradeColors,
        step < 2
          ? 'admission → 503'
          : step === 2
            ? 'R1 / R2 → 200'
            : step === 3
              ? 'same R1 → 409'
              : 'new R3 → 429; engine stays healthy',
        960,
        820,
        35,
        step < 2 ? delegatedColors.yellow : delegatedColors.pink,
        'center',
      );
      if (delegatedBeat)
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'Drain closes intake; R1 and R2 retain their state',
          960,
          930,
          31,
          delegatedColors.yellow,
          'center',
        );
      drawGpuUpgradeFoot(
        ctx,
        api,
        upgradeColors,
        'Worker admission  ·  two slots shared by all arrivals',
      );
    }
  });
}
export default {
  id: 'probe-contract',
  draw: drawProbeContract,
  cues: [
    'ga-probe-contract-b0',
    'ga-probe-ready',
    'ga-probe-duplicate',
    'ga-probe-full',
    'ga-probe-contract-b1',
  ],
};
