import { gaBound } from '../arithmetic.mjs';
import {
  drawGpuUpgradeBox,
  drawGpuUpgradeFoot,
  drawGpuUpgradeHead,
  drawGpuUpgradeText,
} from '../defaults.mjs';
export function drawEngineContract(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  api.focus.target('engine-contract-mechanism', () => {
    const { C: delegatedColors, components: delegatedComponents } = api,
      delegatedBeat = state.beat ?? 0,
      delegatedProgress = gaBound(state.beatP ?? 0);
    {
      drawGpuUpgradeHead(
        ctx,
        api,
        upgradeColors,
        'Same incident request, correctness contract and measured service curve',
      );
      const engines = ['vLLM', 'SGLang', 'llama.cpp', 'TensorRT-LLM', 'TGI'],
        mechanisms = [
          'paged scheduling / reuse',
          'radix reuse / scheduler',
          'GGUF / hardware paths',
          'current PyTorch backend',
          'maintenance mode',
        ];
      for (let i = 0; i < 5; i++) {
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          engines[i],
          200,
          390 + i * 100,
          31,
          delegatedColors.blue,
        );
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          mechanisms[i],
          700,
          390 + i * 100,
          30,
          i > 2 ? delegatedColors.yellow : delegatedColors.cyan,
        );
      }
      if (delegatedBeat > 1) {
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          'context cap 8,192',
          230,
          910,
          430,
          65,
          delegatedColors.blue,
          28,
        );
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          'batch inputs 16,384',
          730,
          910,
          510,
          65,
          delegatedColors.cyan,
          28,
        );
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          'TP = 1',
          1310,
          910,
          350,
          65,
          delegatedColors.yellow,
          28,
        );
      }
      drawGpuUpgradeFoot(
        ctx,
        api,
        upgradeColors,
        'Compare latency and answer quality on the same request trace',
      );
    }
  });
}
export default {
  id: 'engine-contract',
  draw: drawEngineContract,
  cues: ['ga-engine-contract-b0', 'ga-engine-contract-b1', 'ga-engine-contract-b2'],
};
