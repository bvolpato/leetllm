import {
  cueProgress,
  drawBatchingUpgradeBox,
  drawBatchingUpgradeFoot,
  drawBatchingUpgradeText,
} from '../defaults.mjs';
export function drawSpeculativeWork(ctx, scene, state, api) {
  api.focus.target(scene.id + '-mechanism', () => {
    const currentBeat = state.beat ?? 0;
    const { C: themeColors } = api;
    {
      const budget = 12;
      const verify = 4;
      const decode = 2;
      const prefill = budget - verify - decode;
      const values = [
        ...Array(verify).fill('verify'),
        ...Array(decode).fill('decode'),
        ...Array(prefill).fill('prefill'),
      ];
      drawBatchingUpgradeText(
        ctx,
        api,
        'Twelve scheduled input positions · one mixed pass',
        960,
        290,
        34,
        themeColors.cyan,
        'center',
      );
      values.forEach((v, i) =>
        drawBatchingUpgradeBox(
          ctx,
          api,
          v,
          175 + i * 132,
          440,
          120,
          95,
          v === 'verify'
            ? themeColors.yellow
            : v === 'decode'
              ? themeColors.cyan
              : themeColors.blue,
          23,
        ),
      );
      drawBatchingUpgradeText(
        ctx,
        api,
        `${verify} verification + ${decode} ordinary decode + ${prefill} prefill = ${values.length} inputs`,
        960,
        700,
        38,
        themeColors.yellow,
        'center',
      );
      const rejected = currentBeat > 1 || (currentBeat === 1 && cueProgress(state, 'spec-reject', 0.43, 0.50) > 0);
      const emitted = currentBeat > 1 || (currentBeat === 1 && cueProgress(state, 'spec-correction', 0.60, 0.67) > 0);
      if (rejected)
        drawBatchingUpgradeText(
          ctx,
          api,
          'First proposal rejected  ·  0 draft tokens accepted',
          685,
          850,
          34,
          themeColors.pink,
          'center',
        );
      if (emitted)
        drawBatchingUpgradeBox(ctx, api, '1 correction to this stream', 1160, 790, 480, 90, themeColors.green, 29);
      drawBatchingUpgradeFoot(
        ctx,
        api,
        currentBeat === 0
          ? 'A fully accepted draft of width k can emit k + 1 outputs, including a bonus token'
          : currentBeat === 1 ? 'The verification strip keeps all four scheduled positions'
            : 'Measure the token gaps for this stream and its neighbors',
      );
    }
    return;
  });
}
export default {
  id: 'speculative-work',
  draw: drawSpeculativeWork,
  cues: ['speculative-work-b1', 'speculative-work-b2', 'spec-reject', 'spec-correction', 'speculative-work-b3'],
};
