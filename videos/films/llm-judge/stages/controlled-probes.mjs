import { cueVisible, footer, panel, text, withFocus } from '../defaults.mjs';
export function drawControlledProbes(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 0) {
      panel(
        ctx,
        api,
        'padding-only',
        'FIXED FACTS',
        'Stop rollout, then run rollback.',
        130,
        310,
        790,
        180,
        themeColors.cyan,
      );
      panel(
        ctx,
        api,
        'padding-only',
        'REDUNDANT APPEND',
        'To repeat: stop, then roll back.',
        1030,
        310,
        760,
        180,
        themeColors.yellow,
        cueVisible(ctx, api, 'padding-only') ? 1 : 0,
      );
      if (cueVisible(ctx, api, 'useful-elaboration'))
        panel(
          ctx,
          api,
          'useful-elaboration',
          'USEFUL ORGANIZATION',
          '1. Stop rollout.\n2. Run rollback procedure.',
          130,
          600,
          790,
          200,
          themeColors.green,
        );
      if (cueVisible(ctx, api, 'length-model'))
        withFocus(ctx, api, 'length-model', () => {
          text(ctx, api, 'Logistic preference model', 1050, 625, 31, themeColors.cyan);
          text(ctx, api, 'Preference with observed lengths', 1050, 700, 31, themeColors.ink);
          text(ctx, api, 'Predict with length difference = 0', 1050, 790, 31, themeColors.yellow);
          text(ctx, api, 'Estimated win rate across replies', 1050, 870, 27, themeColors.muted);
        });
    } else if (currentBeat === 1) {
      panel(
        ctx,
        api,
        'brand-probe',
        'IDENTICAL WORDING',
        'Stop rollout, then run rollback.',
        140,
        340,
        1640,
        180,
        themeColors.cyan,
      );
      withFocus(ctx, api, 'brand-probe', () => {
        text(
          ctx,
          api,
          'Displayed author: ' + (cueVisible(ctx, api, 'brand-probe') ? 'Brand B' : 'Brand A'),
          175,
          470,
          30,
          themeColors.pink,
        );
        text(
          ctx,
          api,
          'Visible brand probe changes only this label.',
          960,
          600,
          33,
          themeColors.pink,
          'center',
        );
      });
      if (cueVisible(ctx, api, 'self-probe'))
        withFocus(ctx, api, 'self-probe', () => {
          ['Judge family 1', 'Judge family 2', 'Judge family 3'].forEach((name, i) => {
            text(ctx, api, name, 330 + i * 600, 750, 30, themeColors.cyan, 'center');
            text(
              ctx,
              api,
              'Anonymous matched outputs',
              330 + i * 600,
              815,
              27,
              themeColors.ink,
              'center',
            );
          });
          text(
            ctx,
            api,
            'Human reviewers match reply quality before the comparison.',
            960,
            930,
            31,
            themeColors.ink,
            'center',
          );
        });
      if (cueVisible(ctx, api, 'identity-scope'))
        withFocus(ctx, api, 'identity-scope', () =>
          footer(ctx, api, 'Can the judge recognize its own writing style?', themeColors.yellow),
        );
    } else {
      const { focus, C } = api;
      const count = Math.floor(3 * focus.progress('correlated-panel', 0));
      text(ctx, api, 'Claim', 150, 265, 34, C.muted);
      api.text(ctx, '“Commander approval is optional.”', 150, 365, 68, C.ink, 'left', 'serif');
      focus.target('correlated-panel', () => {
        for (let i = 0; i < 3; i++) {
          const x = 150 + i * 560;
          const voted = i < count;
          text(ctx, api, 'Judge ' + (i + 1), x, 490, 34, C.muted);
          api.line(ctx, x, 517, x + 478, 517, voted ? C.cyan : C.muted, 3);
          text(
            ctx,
            api,
            voted ? 'Supported' : 'Awaiting vote',
            x,
            594,
            46,
            voted ? C.cyan : C.muted,
          );
        }
      });
      if (focus.visible('open-policy'))
        focus.target('panel-policy', () => {
          text(ctx, api, 'Policy', 150, 723, 34, C.blue);
          if (focus.progress('open-policy', 0) === 1)
            api.text(
              ctx,
              '“Commander approval is required.”',
              150,
              812,
              64,
              C.ink,
              'left',
              'serif',
            );
        });
      if (focus.visible('independent-label'))
        focus.target('independent-label', () =>
          text(
            ctx,
            api,
            'Independent review: all three accepted a contradicted claim.',
            150,
            982,
            38,
            C.pink,
          ),
        );
      else if (focus.visible('ensemble-proxy'))
        focus.target('ensemble-proxy', () =>
          text(
            ctx,
            api,
            'Scored against the other two votes: each judge agrees.',
            150,
            982,
            38,
            C.yellow,
          ),
        );
    }
  }
}
export default {
  id: 'controlled-probes',
  draw: drawControlledProbes,
  cues: [
    'padding-only',
    'useful-elaboration',
    'length-model',
    'brand-probe',
    'self-probe',
    'identity-scope',
    'correlated-panel',
    'open-policy',
    'ensemble-proxy',
    'independent-label',
  ],
};
