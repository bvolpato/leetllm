import { equation, text } from '../defaults.mjs';
export function drawFloatingPointOrder(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.06, 0.94);
  {
    text(ctx, api, 'FP32 rounds each intermediate result', 960, 300, 35, themeColors.blue);
    api.focus.target('floating-point-order-math-10-20-10-20-3-14', () =>
      equation(ctx, api, '10^{20},\\quad -10^{20},\\quad 3.14', 960, 395, 49, themeColors.yellow),
    );
    const results =
      currentBeat < 1
        ? 0
        : currentBeat > 1
          ? 1
          : state.cues?.['floating-point-order-beat-2-focus-1']
            ? Number(state.cues['floating-point-order-beat-2-focus-1'].phase !== 'before')
            : phaseForBeat(1);
    const rightResult =
      currentBeat < 1
        ? 0
        : currentBeat > 1
          ? 1
          : state.cues?.['floating-next-addition-zero']
            ? Number(state.cues['floating-next-addition-zero'].phase !== 'before')
            : api.phase(progress, 0.65, 0.9);
    components.fade(results, () => {
      api.focus.target('floating-point-order-math-fl-32-fl-32-a-b-r', () =>
        equation(
          ctx,
          api,
          '\\operatorname{fl}_{32}(\\operatorname{fl}_{32}(a+b)+r)',
          560,
          585,
          39,
          themeColors.cyan,
        ),
      );
      api.focus.target('floating-point-order-math-0-3-14-3-14', () =>
        equation(ctx, api, '0+3.14\\approx 3.14', 560, 735, 44, themeColors.green),
      );
    });
    const rightVisible =
      currentBeat > 1
        ? 1
        : currentBeat < 1
          ? 0
          : state.cues?.['floating-residual-rounds-away']
            ? Number(state.cues['floating-residual-rounds-away'].phase !== 'before')
            : api.phase(progress, 0.35, 0.55);
    components.fade(rightVisible, () => {
      api.focus.target('floating-point-order-math-fl-32-a-fl-32-b-r', () =>
        equation(
          ctx,
          api,
          '\\operatorname{fl}_{32}(a+\\operatorname{fl}_{32}(b+r))',
          1390,
          585,
          39,
          themeColors.cyan,
        ),
      );
      api.focus.target('floating-point-order-math-10-20-10-20-0', () =>
        equation(
          ctx,
          api,
          rightResult ? '10^{20}+(-10^{20})=0' : '\\operatorname{fl}_{32}(b+r)=b',
          1390,
          735,
          42,
          themeColors.pink,
        ),
      );
    });
    text(
      ctx,
      api,
      'a = large positive · b = large negative · r = small residual',
      960,
      870,
      29,
      themeColors.muted,
    );
    components.fade(phaseForBeat(2), () =>
      text(
        ctx,
        api,
        'Race-free trees can still round to different answers.',
        960,
        950,
        32,
        themeColors.ink,
      ),
    );
  }
}
export default {
  id: 'floating-point-order',
  draw: drawFloatingPointOrder,
  cues: [
    'floating-point-order-beat-1-focus-1',
    'floating-point-order-beat-2-focus-1',
    'floating-residual-rounds-away',
    'floating-next-addition-zero',
    'floating-point-order-beat-3-focus-1',
  ],
};
