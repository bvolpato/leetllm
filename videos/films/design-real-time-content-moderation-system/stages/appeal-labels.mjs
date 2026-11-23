import {
  cueSeen,
  moderationArrow,
  moderationBox,
  moderationNote,
  moderationText,
} from '../defaults.mjs';
export function drawAppealLabels(ctx, scene, state, api) {
  return api.focus.target('appeal-labels-mechanism', () => {
    const currentBeat = state.beat ?? 0;
    {
      const { C, teaching: t } = api,
        b = state.beat ?? 0;
      {
        moderationText(
          ctx,
          api,
          'Preserve the original event and the reason for correction',
          150,
          270,
          33,
        );
        moderationBox(ctx, api, 'Original D8 · rev8 · v44 · BLOCK', 200, 365, 1520, 90, C.blue, 31);
        if (b === 0) {
          moderationBox(ctx, api, 'Original policy review', 190, 610, 650, 90, C.blue, 29);
          moderationBox(ctx, api, 'Requested policy v45', 1080, 610, 650, 90, C.yellow, 29);
          if (cueSeen(ctx, api, 'appeal-original'))
            moderationArrow(ctx, api, 960, 475, 515, 580, C.blue);
          if (cueSeen(ctx, api, 'appeal-policy')) {
            moderationArrow(ctx, api, 960, 475, 1405, 580, C.yellow);
            moderationText(
              ctx,
              api,
              'Log the intentional policy change',
              1405,
              800,
              30,
              C.yellow,
              'center',
            );
          }
          moderationNote(
            ctx,
            api,
            'Restricted safety cases remain inside their separately authorized workflow.',
          );
        } else if (b === 1) {
          const ready = cueSeen(ctx, api, 'appeal-link');
          moderationBox(
            ctx,
            api,
            ready ? 'Correction C8 → D8' : 'Correction pending',
            510,
            595,
            900,
            90,
            ready ? C.green : C.muted,
            32,
          );
          if (ready) moderationArrow(ctx, api, 960, 480, 960, 565, C.green);
          if (cueSeen(ctx, api, 'appeal-reasons'))
            ['same-policy error', 'changed policy', 'new evidence', 'procedure'].forEach(
              (label, i) =>
                moderationBox(ctx, api, label, 150 + i * 430, 825, 380, 75, C.yellow, 25),
            );
          moderationNote(
            ctx,
            api,
            'Authorized remedies propagate to restrictions, caches, penalties, indexes and notices where applicable.',
          );
        } else {
          const hard = cueSeen(ctx, api, 'appeal-hard');
          moderationBox(
            ctx,
            api,
            'Adjudicated same-v44 wrongful block',
            170,
            580,
            760,
            90,
            C.pink,
            28,
          );
          moderationBox(
            ctx,
            api,
            'v44 correct; allowed under v45',
            1010,
            580,
            760,
            90,
            C.yellow,
            28,
          );
          if (hard) {
            moderationBox(
              ctx,
              api,
              'Governed hard-negative candidate',
              170,
              780,
              760,
              80,
              C.green,
              28,
            );
            moderationBox(
              ctx,
              api,
              'Policy-change outcome ≠ old error',
              1010,
              780,
              760,
              80,
              C.muted,
              27,
            );
          }
          if (cueSeen(ctx, api, 'appeal-sample'))
            moderationNote(
              ctx,
              api,
              'Appeals are selected; sample allowed/blocked items, group related cases, and hold out time.',
            );
        }
      }
    }
  });
}
export default {
  id: 'appeal-labels',
  draw: drawAppealLabels,
  cues: [
    'appeal-original',
    'appeal-policy',
    'appeal-link',
    'appeal-reasons',
    'appeal-hard',
    'appeal-sample',
  ],
};
