import { cueVisible, panel, text, withFocus } from '../defaults.mjs';
export function drawSwapContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 0) {
      withFocus(ctx, api, 'same-case-contract', () => {
        text(
          ctx,
          api,
          'call 1: DEP27-pair · rubric-v1 / judge-fixture · [compact, stepwise]',
          130,
          300,
          29,
          themeColors.blue,
        );
        text(
          ctx,
          api,
          'call 2: DEP27-pair · rubric-v1 / judge-fixture · [stepwise, compact]',
          130,
          370,
          29,
          themeColors.blue,
        );
        text(
          ctx,
          api,
          'Same order / different case / different config → reject combination',
          960,
          470,
          31,
          themeColors.pink,
          'center',
        );
      });
      if (cueVisible(ctx, api, 'mixed-swap'))
        panel(
          ctx,
          api,
          'mixed-swap',
          'A → compact  /  tie',
          'Winner + tie → unresolved',
          140,
          590,
          500,
          220,
          themeColors.yellow,
        );
      if (cueVisible(ctx, api, 'stable-tie'))
        panel(
          ctx,
          api,
          'stable-tie',
          'tie  /  tie',
          'Two explicit ties → stable tie',
          710,
          590,
          500,
          220,
          themeColors.green,
        );
      if (cueVisible(ctx, api, 'review-outcome'))
        panel(
          ctx,
          api,
          'review-outcome',
          'B → stepwise  /  review',
          'Either review → review',
          1280,
          590,
          500,
          220,
          themeColors.pink,
        );
    } else {
      panel(
        ctx,
        api,
        'stable-mistake',
        'SAME WINNER IN BOTH ORDERS',
        '“Commander approval is optional.”',
        140,
        340,
        770,
        230,
        themeColors.green,
      );
      panel(
        ctx,
        api,
        'stable-mistake',
        'AUTHORITATIVE POLICY',
        '“Commander approval is required.”',
        1030,
        340,
        750,
        230,
        themeColors.blue,
      );
      if (cueVisible(ctx, api, 'stable-mistake'))
        text(
          ctx,
          api,
          'Both orders picked a reply that contradicts the policy.',
          960,
          715,
          38,
          themeColors.pink,
          'center',
        );
      if (cueVisible(ctx, api, 'version-reconciliation'))
        withFocus(ctx, api, 'version-reconciliation', () => {
          text(
            ctx,
            api,
            'case slice + repeated calls + human labels',
            960,
            845,
            33,
            themeColors.cyan,
            'center',
          );
          text(
            ctx,
            api,
            'Save the rule for combining votes with the judge version.',
            960,
            955,
            31,
            themeColors.yellow,
            'center',
          );
        });
    }
  }
}
export default {
  id: 'swap-contract',
  draw: drawSwapContract,
  cues: [
    'same-case-contract',
    'mixed-swap',
    'stable-tie',
    'review-outcome',
    'stable-mistake',
    'version-reconciliation',
  ],
};
