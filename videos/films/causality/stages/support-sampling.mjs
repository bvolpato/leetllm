import { box, code, focusProgress, footer, label } from '../defaults.mjs';
export function drawSupportSampling(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = (id) => focusProgress(ctx, api, 'cau-' + id),
    done = (id) => q(id) >= 1;
  api.focus.target('cau-support-sampling-mechanism', () => {
    const structural = currentBeat === 0 || currentBeat === 2;
    box(
      ctx,
      api,
      structural ? 'Target group · structural support' : 'New independent10-ticket batch',
      [
        structural ? 'P(assistant)=1' : 'P(assistant)=0.9',
        structural ? 'P(control)=0' : 'P(control)=0.1',
      ],
      180,
      330,
      750,
      220,
      themeColors.yellow,
    );
    box(ctx, api, 'Observed control cell', ['empty'], 1050, 330, 690, 220, themeColors.pink);
    if (!structural) {
      Array.from(
        {
          length: 10,
        },
        (_, i) => {
          api.rect(ctx, 230 + i * 145, 690, 95, 75, themeColors.panel, themeColors.cyan, 7);
          label(ctx, api, 'A', 277.5 + i * 145, 740, themeColors.cyan, 29);
        },
      );
      label(ctx, api, 'Possible event: all ten receive assistant', 960, 620, themeColors.cyan, 30);
      if (done('sampling-probability'))
        code(
          ctx,
          api,
          'P(all assistant) = 0.9^10 ≈ 34.9%',
          960,
          875,
          34,
          themeColors.green,
          'center',
        );
    } else
      label(
        ctx,
        api,
        'Weighting cannot create an unobserved control outcome',
        960,
        810,
        themeColors.pink,
        34,
      );
    footer(
      ctx,
      api,
      structural
        ? 'A true zero action probability differs from an empty finite sample.'
        : 'This sample can have no control even though control is possible under the policy.',
    );
  });
}
export default {
  id: 'support-sampling',
  draw: drawSupportSampling,
  cues: [
    'cau-support-sampling-0',
    'cau-structural-zero',
    'cau-support-sampling-1',
    'cau-sampling-probability',
    'cau-support-sampling-2',
  ],
};
