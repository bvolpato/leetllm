import { box, cueVisible, footer, miniSlate, rankingText } from '../defaults.mjs';
export function drawPropensityContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('propensity-contract-mechanism', () => {
    if (currentBeat === 0) {
      rankingText(ctx, api, 'Assignment ≠ action choice ≠ examination', 150, 270, 35);
      [
        ['Arm assignment', 'shopper → A or B'],
        ['Action selection', 'chosen product/slate'],
        ['Examination', 'looking after display'],
      ].forEach(([a, z], i) => {
        box(ctx, api, a, 170 + i * 560, 405, 500, 95, themeColors.blue, 31);
        rankingText(ctx, api, z, 420 + i * 560, 610, 27, themeColors.muted, 'center');
      });
      if (cueVisible(ctx, api, 'propensity-zero')) {
        box(
          ctx,
          api,
          'Product Z · exposure probability0',
          400,
          760,
          1120,
          90,
          themeColors.pink,
          32,
        );
        rankingText(
          ctx,
          api,
          'No finite weight creates a missing outcome',
          960,
          940,
          34,
          themeColors.pink,
          'center',
        );
      }
    } else if (currentBeat === 1) {
      rankingText(ctx, api, 'Identifiable position variation under a declared model', 150, 270, 33);
      [
        ['historic rankerA', ['P5', 'P6']],
        ['historic rankerB', ['P6', 'P5']],
      ].forEach(([name, ids], i) => {
        const x = 230 + i * 850;
        rankingText(ctx, api, name, x, 370, 31, themeColors.blue);
        miniSlate(
          ctx,
          api,
          ids.map((id) => ({
            id,
          })),
          x,
          455,
          600,
        );
      });
      if (cueVisible(ctx, api, 'propensity-relative'))
        rankingText(
          ctx,
          api,
          'Relative propensities require assignment / support assumptions',
          960,
          855,
          32,
          themeColors.yellow,
          'center',
        );
      footer(ctx, api, 'No propensity estimation study is run here; do not assume1/position.');
    } else {
      rankingText(
        ctx,
        api,
        'Rescaling the data loss changes its regularizer tradeoff',
        150,
        270,
        33,
      );
      rankingText(ctx, api, 'L(w) + λR(w)', 250, 445, 42, themeColors.blue);
      if (cueVisible(ctx, api, 'propensity-scale'))
        rankingText(ctx, api, 'cL(w) + λR(w)', 1120, 445, 42, themeColors.cyan);
      if (cueVisible(ctx, api, 'propensity-fixed')) {
        rankingText(ctx, api, 'Divide by positive c:', 250, 650, 33, themeColors.muted);
        rankingText(ctx, api, 'L(w) + (λ/c)R(w)', 1120, 650, 42, themeColors.pink);
      }
      if (cueVisible(ctx, api, 'propensity-unset'))
        box(
          ctx,
          api,
          'position_propensity = None · training_use = evaluation_only',
          180,
          850,
          1550,
          85,
          themeColors.yellow,
          27,
        );
      footer(
        ctx,
        api,
        'Relative weights do not identify absolute relevance; names and tags need evidence and enforced controls.',
      );
    }
  });
}
export default {
  id: 'propensity-contract',
  draw: drawPropensityContract,
  cues: [
    'propensity-types',
    'propensity-zero',
    'propensity-relative',
    'propensity-scale',
    'propensity-fixed',
    'propensity-unset',
  ],
};
