import { cueSeen, moderationBox, moderationNote, moderationText } from '../defaults.mjs';
export function drawRegionalAuthority(ctx, scene, state, api) {
  return api.focus.target('regional-authority-mechanism', () => {
    const currentBeat = state.beat ?? 0;
    {
      const { C, teaching: t } = api,
        b = state.beat ?? 0;
      {
        moderationText(ctx, api, 'Approved jurisdiction and surface resolution', 150, 270, 34);
        ['US VPN hint', 'India account market', 'EU content availability'].forEach((value, i) =>
          moderationBox(
            ctx,
            api,
            value,
            150 + i * 570,
            365,
            520,
            90,
            [C.muted, C.blue, C.cyan][i],
            28,
          ),
        );
        moderationBox(
          ctx,
          api,
          'Authorized resolver · approved record lookup',
          430,
          590,
          1060,
          90,
          C.blue,
          31,
        );
        if (b === 0) {
          if (cueSeen(ctx, api, 'scope-signals'))
            moderationText(
              ctx,
              api,
              'No single hint chooses all duties',
              960,
              535,
              32,
              C.yellow,
              'center',
            );
          if (cueSeen(ctx, api, 'scope-unknown'))
            moderationBox(
              ctx,
              api,
              'Unknown record → HOLD_FOR_SCOPE_REVIEW',
              330,
              830,
              1260,
              85,
              C.pink,
              31,
            );
        }
        if (b === 1) {
          if (cueSeen(ctx, api, 'scope-bind'))
            ['tenant', 'revision', 'surface', 'action', 'scope version'].forEach((label, i) =>
              moderationBox(ctx, api, label, 145 + i * 345, 805, 305, 75, C.cyan, 26),
            );
          if (cueSeen(ctx, api, 'scope-placement'))
            moderationNote(
              ctx,
              api,
              'Model placement and legal scope are separate; evaluate regional quality,residency and deadlines.',
            );
        }
        if (b === 2) {
          if (cueSeen(ctx, api, 'scope-dsa')) {
            moderationText(
              ctx,
              api,
              'DSA Article 20 · complaint opportunity ≥6 months',
              960,
              785,
              32,
              C.yellow,
              'center',
            );
            moderationText(
              ctx,
              api,
              'Qualified staff supervision · applicability / Article 19 exemptions',
              960,
              860,
              29,
              C.blue,
              'center',
            );
          }
          if (cueSeen(ctx, api, 'scope-current'))
            moderationNote(
              ctx,
              api,
              'DSA reasons,US restricted reporting and India rules need separately approved current duties.',
            );
        }
      }
    }
  });
}
export default {
  id: 'regional-authority',
  draw: drawRegionalAuthority,
  cues: [
    'scope-signals',
    'scope-unknown',
    'scope-bind',
    'scope-placement',
    'scope-dsa',
    'scope-current',
  ],
};
