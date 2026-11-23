import { decodeSoftmax } from '../arithmetic.mjs';
import { coreBox, coreFoot, coreText, coreTitle, coreVector } from '../defaults.mjs';
export function drawStableEligibility(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    operation = state.cues?.[`dec-stable-eligibility-${currentBeat + 1}`],
    u =
      operation?.phase === 'before'
        ? 0
        : operation?.phase === 'after'
          ? 1
          : (operation?.progress ?? progress2);
  const done = (id) => state.cues?.['dec-' + id]?.phase === 'after';
  api.focus.target('dec-stable-eligibility-mechanism', () => {
    coreTitle(
      ctx,
      api,
      currentBeat === 0
        ? 'Subtract the maximum before exponentiating'
        : 'Eligibility is checked before selection',
    );
    if (currentBeat === 0) {
      coreVector(ctx, api, [1000, 999], ['logit A', 'logit B'], 250, 390, 1420);
      api.arrow(ctx, 960, 505, 960, 595, themeColors.blue, 4);
      coreVector(ctx, api, [0, -1], ['centered A', 'centered B'], 250, 650, 1420);
      coreText(
        ctx,
        api,
        done('stable-probabilities')
          ? 'Normalized: ' +
              decodeSoftmax([1000, 999])
                .map((v) => v.toFixed(3))
                .join(' / ')
          : 'Subtract 1000; exponentiate, then normalize',
        960,
        935,
        36,
        themeColors.yellow,
      );
    } else {
      const inputs =
        currentBeat === 1
          ? [
              ['finite logits', 'eligible'],
              ['−Infinity', 'masked'],
              ['NaN / +Infinity', 'reject'],
              ['all −Infinity', 'reject'],
            ]
          : [
              ['hard constraints', 'eligible IDs'],
              ['T = 0', 'first eligible argmax'],
              ['T > 0', 'stable softmax'],
              ['all masked', 'explicit error'],
            ];
      inputs.forEach(([v, result], i) => {
        const y = 365 + i * 140;
        coreBox(ctx, api, v, 220, y, 570, 85, themeColors.blue);
        if (i < Math.floor(u * 4.999)) {
          api.arrow(ctx, 830, y + 42, 1040, y + 42, themeColors.cyan, 3);
          coreBox(
            ctx,
            api,
            result,
            1100,
            y,
            600,
            85,
            result === 'reject' || result === 'explicit error'
              ? themeColors.pink
              : themeColors.cyan,
          );
        }
      });
    }
    coreFoot(
      ctx,
      api,
      'A strict positive-temperature processor and a sampler with an explicit zero branch are separate contracts.',
    );
    return;
  });
}
export default {
  id: 'stable-eligibility',
  draw: drawStableEligibility,
  cues: [
    'dec-stable-eligibility-1',
    'dec-stable-probabilities',
    'dec-stable-eligibility-2',
    'dec-stable-eligibility-3',
  ],
};
