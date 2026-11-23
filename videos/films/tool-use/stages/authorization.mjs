import { cueBegun } from '../arithmetic.mjs';
import { authorize } from '../model.mjs';
import { card, foot, text, visualFocus } from '../defaults.mjs';
export function drawAuthorization(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching, phase } = api,
    beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.05, 0.88);
  {
    const privateRead = beat === 1,
      allowed = authorize(
        {
          reader: 'lena',
        },
        privateRead ? 'history' : 'lookup',
        privateRead ? 'other-reader' : 'B7',
      ),
      checked =
        beat === 0
          ? cueBegun(state.cues, 'authorization-check-action', true)
          : beat === 1
            ? cueBegun(state.cues, 'authorization-private-history', true)
            : cueBegun(state.cues, 'authorization-beat-3-focus-1', true);
    visualFocus(ctx, api, 'authorization-session', () =>
      card(
        ctx,
        api,
        'Trusted session: Lena · lookup grant for book B7',
        260,
        290,
        1400,
        themeColors.yellow,
        95,
        32,
      ),
    );
    teaching.flowGraph({
      nodes: [
        {
          focusTarget: 'authorization-node-req',
          id: 'req',
          label: privateRead ? 'Other reader history' : 'Public availability B7',
          x: 170,
          y: 500,
          width: 480,
          height: 115,
          color: themeColors.blue,
        },
        {
          focusTarget: 'authorization-policy',
          id: 'gate',
          label: privateRead ? 'Account mismatch' : 'Lena + lookup + B7',
          x: 825,
          y: 500,
          width: 390,
          height: 115,
          color: themeColors.yellow,
        },
        {
          focusTarget: 'authorization-outcome',
          id: 'out',
          label: !checked ? 'Policy checking' : allowed ? 'Allowed read' : 'Denied',
          x: 1390,
          y: 500,
          width: 350,
          height: 115,
          color: !checked ? themeColors.yellow : allowed ? themeColors.green : themeColors.pink,
        },
      ],
      edges: [
        {
          from: 'req',
          to: 'gate',
          progress: 1,
        },
        {
          from: 'gate',
          to: 'out',
          color: allowed ? themeColors.green : themeColors.pink,
          progress: checked ? 1 : 0,
        },
      ],
    });
    text(
      ctx,
      api,
      'Principal + action + resolved resource',
      960,
      850,
      36,
      themeColors.ink,
      'center',
    );
    foot(ctx, api, 'The authenticated session supplies the principal and grant');
  }
}
export default {
  id: 'authorization',
  draw: drawAuthorization,
  cues: [
    'authorization-beat-1-focus-1',
    'authorization-check-action',
    'authorization-beat-2-focus-1',
    'authorization-private-history',
    'authorization-beat-3-focus-1',
  ],
};
