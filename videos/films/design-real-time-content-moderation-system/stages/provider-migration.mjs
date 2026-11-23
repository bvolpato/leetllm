import {
  cueProgress,
  cueSeen,
  moderationArrow,
  moderationBox,
  moderationLine,
  moderationNote,
  moderationText,
} from '../defaults.mjs';
export function drawProviderMigration(ctx, scene, state, api) {
  return api.focus.target('provider-migration-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    {
      if (currentBeat === 0) {
        const fields = ['category', 'score', 'provider', 'model_version', 'evaluated_at'];
        moderationText(ctx, api, 'A versioned adapter preserves evidence identity', 150, 270, 34);
        fields.forEach((name, i) => {
          if (cueProgress(ctx, api, 'migration-schema') > i / 5)
            moderationBox(ctx, api, name, 150 + i * 340, 375, 300, 80, themeColors.blue, 25);
        });
        moderationBox(ctx, api, 'Old provider: TOXICITY', 170, 620, 540, 85, themeColors.yellow);
        if (cueSeen(ctx, api, 'migration-map'))
          ['harassment', 'threats', 'identity attacks'].forEach((name, i) => {
            moderationBox(
              ctx,
              api,
              name + ' · evaluate separately',
              1030,
              550 + i * 125,
              730,
              80,
              themeColors.cyan,
              26,
            );
            moderationArrow(ctx, api, 750, 663, 990, 590 + i * 125, themeColors.cyan);
          });
        moderationNote(
          ctx,
          api,
          'Label mapping does not transfer thresholds or calibration automatically.',
        );
      } else if (currentBeat === 1) {
        const names = ['ACTIVE', 'SHADOW', 'CANARY', 'DRAIN', 'RETIRED'];
        names.forEach((name, i) => {
          moderationBox(
            ctx,
            api,
            name,
            120 + i * 360,
            410,
            300,
            90,
            i === 4 ? themeColors.muted : i === 1 ? themeColors.yellow : themeColors.blue,
          );
          if (i < 4)
            moderationArrow(ctx, api, 435 + i * 360, 455, 465 + i * 360, 455, themeColors.muted);
        });
        if (cueSeen(ctx, api, 'migration-shadow')) {
          moderationBox(ctx, api, 'Copied event P17', 410, 660, 560, 80, themeColors.yellow);
          moderationBox(ctx, api, 'No enforcement authority', 1090, 660, 670, 80, themeColors.pink);
          moderationArrow(ctx, api, 990, 700, 1060, 700, themeColors.pink);
        }
        if (cueSeen(ctx, api, 'migration-retire')) {
          moderationLine(ctx, api, 1580, 550, 1840, 550, themeColors.pink, 5);
          moderationText(
            ctx,
            api,
            'Old calls blocked; credentials removed',
            960,
            900,
            33,
            themeColors.pink,
            'center',
          );
        }
        moderationNote(
          ctx,
          api,
          'Approved slice and rollback gates precede any candidate enforcement.',
        );
      } else {
        moderationText(
          ctx,
          api,
          'Official Perspective lifecycle · checked 2026-11-06',
          150,
          285,
          33,
        );
        moderationLine(ctx, api, 230, 540, 1700, 540, themeColors.muted, 3);
        [
          ['After Feb 2026', 230],
          ['Nov 6 check', 1110],
          ['Dec 31 sunset', 1700],
        ].forEach(([label, x]) => {
          moderationLine(ctx, api, x, 525, x, 555, themeColors.yellow, 3);
          moderationText(
            ctx,
            api,
            label,
            x,
            615,
            27,
            themeColors.yellow,
            x === 230 ? 'left' : x === 1700 ? 'right' : 'center',
          );
        });
        if (cueSeen(ctx, api, 'migration-date'))
          moderationText(
            ctx,
            api,
            'Service active through Dec 31 · no direct migration support',
            960,
            755,
            34,
            themeColors.blue,
            'center',
          );
        if (cueSeen(ctx, api, 'migration-copy'))
          moderationBox(
            ctx,
            api,
            'Shadow copies still need access / retention / provider review',
            230,
            880,
            1460,
            80,
            themeColors.pink,
            30,
          );
        moderationNote(
          ctx,
          api,
          'New usage and increased-quota requests had closed after February.',
        );
      }
    }
  });
}
export default {
  id: 'provider-migration',
  draw: drawProviderMigration,
  cues: [
    'migration-schema',
    'migration-map',
    'migration-shadow',
    'migration-retire',
    'migration-date',
    'migration-copy',
  ],
};
