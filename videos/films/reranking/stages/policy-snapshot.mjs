import {
  arrow,
  caption,
  codeText,
  coreText,
  cueVisible,
  focusTargets,
  line,
  rectangle,
} from '../defaults.mjs';
export function drawPolicySnapshot(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    focusTargets(
      ctx,
      api,
      [
        'auth-request',
        'auth-rule',
        'four-records',
        'exclude-records',
        'snapshot-compare',
        'mutate-text',
        'source-binding',
        'recheck-access',
        'disclosure-check',
      ],
      () => {
        coreText(
          ctx,
          api,
          'AUTH-14 · service account · day 10 · audit active',
          150,
          300,
          33,
          themeColors.yellow,
        );
        if (currentBeat === 0) {
          if (cueVisible(ctx, api, 'auth-rule'))
            coreText(
              ctx,
              api,
              'Allow within days 0…14 when audit logging is active.',
              150,
              375,
              32,
              themeColors.green,
            );
          const names = ['troubleshooting', 'password reset', 'governing rule', 'audit export'];
          names.forEach((name, i) => {
            const y = 475 + i * 105;
            coreText(ctx, api, String(i + 1), 170, y, 29, themeColors.muted);
            rectangle(
              ctx,
              api,
              230,
              y - 45,
              1000,
              75,
              i === 2 ? themeColors.green : themeColors.blue,
            );
            coreText(
              ctx,
              api,
              name,
              255,
              y + 3,
              31,
              i === 2 ? themeColors.green : themeColors.blue,
            );
            if (cueVisible(ctx, api, 'four-records'))
              coreText(ctx, api, 'current · permitted', 1310, y + 3, 28, themeColors.green);
          });
          if (cueVisible(ctx, api, 'exclude-records')) {
            coreText(ctx, api, 'admin-only', 230, 975, 30, themeColors.pink);
            coreText(ctx, api, 'superseded revision', 700, 975, 30, themeColors.pink);
            coreText(ctx, api, 'outside scoring', 1310, 975, 30, themeColors.pink);
          }
        } else if (currentBeat === 1) {
          const fields = ['chunk_id', 'revision', 'parent_id', 'text'];
          coreText(ctx, api, 'First-stage snapshot', 460, 400, 32, themeColors.blue, 'center');
          coreText(
            ctx,
            api,
            'Scorer-returned candidate',
            1340,
            400,
            32,
            themeColors.cyan,
            'center',
          );
          fields.forEach((name, i) => {
            const y = 490 + i * 110,
              changed = name === 'text' && cueVisible(ctx, api, 'mutate-text');
            codeText(ctx, api, name, 180, y, 28, themeColors.muted);
            codeText(
              ctx,
              api,
              name === 'text'
                ? 'complete AUTH-14 clause'
                : name === 'parent_id'
                  ? 'api-auth-v2'
                  : name === 'revision'
                    ? 'api-auth/2026-04-01'
                    : 'api-token-legacy-v2-rule',
              450,
              y,
              29,
              themeColors.green,
            );
            codeText(
              ctx,
              api,
              changed
                ? 'replacement clause'
                : name === 'text'
                  ? 'complete AUTH-14 clause'
                  : name === 'parent_id'
                    ? 'api-auth-v2'
                    : name === 'revision'
                      ? 'api-auth/2026-04-01'
                      : 'api-token-legacy-v2-rule',
              1180,
              y,
              29,
              changed ? themeColors.pink : themeColors.green,
            );
            line(
              ctx,
              api,
              970,
              y - 25,
              1090,
              y - 25,
              changed ? themeColors.pink : themeColors.green,
              3,
            );
          });
          if (cueVisible(ctx, api, 'source-binding'))
            coreText(
              ctx,
              api,
              'Changed record → retrieve the current revision',
              960,
              980,
              34,
              themeColors.pink,
              'center',
            );
        } else {
          const stages = ['retrieval snapshot', 'remote scoring', 'packed context'];
          stages.forEach((name, i) => {
            const x = 150 + i * 590;
            rectangle(ctx, api, x, 430, 500, 130, themeColors.blue);
            coreText(ctx, api, name, x + 250, 505, 31, themeColors.blue, 'center');
            if (i < 2)
              arrow(
                ctx,
                api,
                {
                  x: x + 510,
                  y: 495,
                },
                {
                  x: x + 565,
                  y: 495,
                },
                themeColors.muted,
              );
          });
          ['api-token-legacy-v2-rule', 'same authorized source'].forEach((v, i) =>
            coreText(ctx, api, v, 400 + i * 590, 605, 24, themeColors.green, 'center'),
          );
          if (cueVisible(ctx, api, 'recheck-access')) {
            coreText(ctx, api, 'grant rev 7', 400, 360, 29, themeColors.green, 'center');
            coreText(ctx, api, 'revoked before pack', 1580, 360, 29, themeColors.pink, 'center');
            line(ctx, api, 1330, 600, 1830, 600, themeColors.pink, 4);
            coreText(
              ctx,
              api,
              'Remove the revoked source',
              1580,
              680,
              31,
              themeColors.pink,
              'center',
            );
            coreText(ctx, api, 'blocked before context', 1580, 790, 29, themeColors.pink, 'center');
          }
          if (cueVisible(ctx, api, 'disclosure-check')) {
            rectangle(ctx, api, 700, 785, 520, 110, themeColors.yellow);
            coreText(
              ctx,
              api,
              'Processor policy before disclosure',
              960,
              850,
              29,
              themeColors.yellow,
              'center',
            );
          }
        }
      },
    );
    caption(
      ctx,
      api,
      'The application supplies the current access decision for each passage.',
    );
  }
}
export default {
  id: 'policy-snapshot',
  draw: drawPolicySnapshot,
  cues: [
    'auth-request',
    'auth-rule',
    'four-records',
    'exclude-records',
    'snapshot-compare',
    'mutate-text',
    'source-binding',
    'recheck-access',
    'disclosure-check',
  ],
};
