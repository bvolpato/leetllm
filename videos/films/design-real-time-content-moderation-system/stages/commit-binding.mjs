import { boundDecision } from '../model.mjs';
import {
  cueProgress,
  cueSeen,
  moderationArrow,
  moderationBox,
  moderationNote,
  moderationText,
} from '../defaults.mjs';
export function drawCommitBinding(ctx, scene, state, api) {
  return api.focus.target('commit-binding-mechanism', () => {
    const currentBeat = state.beat ?? 0;
    {
      const { C, teaching: t } = api,
        b = state.beat ?? 0;
      {
        const original = {
          revision: 8,
          scope: 'profile-eu',
          policy: 'v44',
          state: 'PENDING',
          applied: {},
        };
        const receipt = {
          id: 'D1',
          revision: 8,
          scope: 'profile-eu',
          policy: 'v44',
          action: 'BLOCK',
        };
        const applied = boundDecision(original, receipt);
        moderationText(
          ctx,
          api,
          [
            'Stored receipt',
            'Compare each receipt with the current item',
            'Commit a current decision',
          ][b],
          150,
          270,
          33,
        );
        if (b === 0) {
          moderationBox(
            ctx,
            api,
            'D1 / rev8 / profile-eu / v44 / BLOCK',
            190,
            390,
            1520,
            90,
            C.blue,
            30,
          );
          if (cueSeen(ctx, api, 'commit-bind')) {
            moderationBox(ctx, api, 'First → APPLIED', 170, 650, 500, 85, C.green);
            moderationBox(ctx, api, 'Exact replay → DUPLICATE', 710, 650, 560, 85, C.blue, 27);
          }
          if (cueSeen(ctx, api, 'commit-repeat'))
            moderationBox(ctx, api, 'Same D1 + ALLOW → CONFLICT', 430, 850, 1060, 85, C.pink, 32);
          moderationNote(ctx, api, 'The stored action is part of the receipt.');
        } else if (b === 1) {
          const current = {
            ...applied.item,
            revision: 9,
            state: 'PENDING',
          };
          moderationBox(
            ctx,
            api,
            'Current item: rev9 / profile-eu / v44 / PENDING',
            190,
            375,
            1520,
            90,
            C.blue,
            30,
          );
          const rows = [
            ['D1 · stored rev8 BLOCK', boundDecision(current, receipt).status],
            [
              'D2 · unseen rev8 BLOCK',
              boundDecision(current, {
                ...receipt,
                id: 'D2',
              }).status,
            ],
          ];
          rows.forEach(([label, status], i) => {
            const y = 580 + i * 180;
            moderationBox(ctx, api, label, 170, y, 760, 90, C.yellow, 29);
            moderationArrow(ctx, api, 970, y + 45, 1110, y + 45, C.muted);
            if (cueProgress(ctx, api, i ? 'commit-stale' : 'commit-old') === 1)
              moderationBox(ctx, api, status, 1150, y, 550, 90, i ? C.pink : C.blue, 32);
          });
          moderationNote(
            ctx,
            api,
            cueProgress(ctx, api, 'commit-stale') === 1
              ? 'Revision 9 stays pending.'
              : 'Both receipts name revision 8.',
          );
        } else {
          api.rect(ctx, 230, 355, 1460, 470, C.panel, C.blue, 0);
          moderationText(ctx, api, 'One conditional transaction', 960, 425, 35, C.blue, 'center');
          ['Current preconditions', 'Durable decision D-new', 'Outbox event E-new'].forEach(
            (label, i) => {
              if (cueProgress(ctx, api, 'commit-atomic') > i / 3)
                moderationBox(
                  ctx,
                  api,
                  label,
                  390,
                  500 + i * 95,
                  1140,
                  70,
                  i ? C.green : C.yellow,
                  29,
                );
            },
          );
          if (cueSeen(ctx, api, 'commit-limits'))
            moderationText(
              ctx,
              api,
              'Failed transaction: decision and event roll back together',
              960,
              945,
              29,
              C.muted,
              'center',
            );
          moderationNote(ctx, api, 'On redelivery, the same decision has one effect.');
        }
      }
    }
  });
}
export default {
  id: 'commit-binding',
  draw: drawCommitBinding,
  cues: [
    'commit-bind',
    'commit-repeat',
    'commit-stale',
    'commit-old',
    'commit-atomic',
    'commit-limits',
  ],
};
