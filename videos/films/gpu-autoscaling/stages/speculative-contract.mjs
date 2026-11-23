import { gaBound, gaComplete, greedyPrefixExample } from '../arithmetic.mjs';
import {
  drawGpuUpgradeArrow,
  drawGpuUpgradeBox,
  drawGpuUpgradeFoot,
  drawGpuUpgradeHead,
  drawGpuUpgradeText,
} from '../defaults.mjs';
export function drawSpeculativeContract(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  const done = (name, fallback = progress > 0.7) => gaComplete(state, 'ga-' + name, fallback);
  api.focus.target('speculative-contract-mechanism', () => {
    const { C: delegatedColors, components: delegatedComponents } = api,
      delegatedBeat = state.beat ?? 0,
      delegatedProgress = gaBound(state.beatP ?? 0);
    {
      const draft = ['The', 'deploy', 'is', 'safe'],
        target = ['The', 'deploy', 'was', 'blocked'],
        result = greedyPrefixExample(draft, target),
        verified = done('greedy-mismatch', delegatedBeat > 0);
      drawGpuUpgradeHead(
        ctx,
        api,
        upgradeColors,
        'R21 · illustrative draft proposal and supplied target choices',
      );
      drawGpuUpgradeText(
        ctx,
        api,
        upgradeColors,
        'provisional draft',
        960,
        380,
        28,
        delegatedColors.blue,
        'center',
      );
      drawGpuUpgradeText(
        ctx,
        api,
        upgradeColors,
        verified ? 'committed prefix + first correction' : 'target choices; verification pending',
        960,
        610,
        28,
        delegatedColors.cyan,
        'center',
      );
      for (let i = 0; i < 4; i++) {
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          draft[i],
          210 + i * 410,
          420,
          350,
          85,
          delegatedColors.blue,
          31,
        );
        const value = i < 3 ? target[i] : verified ? 'not committed' : 'not evaluated',
          col = !verified
            ? delegatedColors.muted
            : i < result.accepted
              ? delegatedColors.green
              : i === result.accepted
                ? delegatedColors.yellow
                : delegatedColors.muted;
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          value,
          210 + i * 410,
          650,
          350,
          85,
          col,
          31,
        );
        if (verified && i < result.accepted)
          drawGpuUpgradeArrow(
            ctx,
            api,
            upgradeColors,
            385 + i * 410,
            540,
            385 + i * 410,
            570,
            delegatedColors.green,
          );
      }
      if (verified) {
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'matching prefix',
          600,
          850,
          30,
          delegatedColors.green,
        );
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'first correction · KV pending',
          1310,
          850,
          30,
          delegatedColors.yellow,
          'center',
        );
      }
      drawGpuUpgradeFoot(
        ctx,
        api,
        upgradeColors,
        delegatedBeat
          ? 'Whole-cycle draft, rejected work, grammar and memory costs remain; compatibility is method-specific'
          : 'Greedy toy; sampled distribution preservation additionally needs probability-ratio acceptance and corrected rejection',
      );
    }
  });
}
export default {
  id: 'speculative-contract',
  draw: drawSpeculativeContract,
  cues: ['ga-speculative-contract-b0', 'ga-greedy-mismatch', 'ga-speculative-contract-b1'],
};
