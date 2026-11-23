import { teachingScoreKey } from '../model.mjs';
import { arrow, codeText, coreText, cueVisible, focusTargets, rectangle } from '../defaults.mjs';
export function drawCacheInputIdentity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    focusTargets(
      ctx,
      api,
      [
        'cache-operands',
        'cache-settings',
        'nonfinite-reject',
        'text-key-change',
        'tenant-key-change',
        'list-key-change',
        'pair-not-list',
        'hash-not-access',
        'cache-access-recheck',
        'revoke-hit',
      ],
      () => {
        const lines = [
          'rendered input: ' +
            (cueVisible(ctx, api, 'text-key-change') ? 'text revision B' : 'text revision A'),
          'model + tokenizer: immutable revisions',
          'template + truncation + aggregation',
          'tenant: ' + (cueVisible(ctx, api, 'tenant-key-change') ? 'beta' : 'alpha'),
          'stored scope + grant revision: permitted 7',
        ];
        coreText(ctx, api, 'Inputs to the cache key', 150, 305, 41, themeColors.ink);
        lines.forEach((v, i) => {
          const changed =
              (i === 0 && cueVisible(ctx, api, 'text-key-change')) ||
              (i === 3 && cueVisible(ctx, api, 'tenant-key-change')),
            y = 400 + i * 105;
          rectangle(ctx, api, 150, y, 1080, 75, changed ? themeColors.pink : themeColors.blue);
          codeText(ctx, api, v, 175, y + 49, 28, changed ? themeColors.pink : themeColors.blue);
        });
        const swap = api.focus.progress('list-key-change', 0);
        const reversed = swap === 1;
        const keyChanged =
            cueVisible(ctx, api, 'text-key-change') ||
            cueVisible(ctx, api, 'tenant-key-change') ||
            reversed,
          digest = teachingScoreKey({
            textRevision: cueVisible(ctx, api, 'text-key-change') ? 'B' : 'A',
            tenant: cueVisible(ctx, api, 'tenant-key-change') ? 'beta' : 'alpha',
            list: reversed ? ['R', 'Q', 'P'] : ['P', 'Q', 'R'],
          });
        arrow(
          ctx,
          api,
          {
            x: 1270,
            y: 600,
          },
          {
            x: 1380,
            y: 600,
          },
          themeColors.cyan,
        );
        coreText(
          ctx,
          api,
          swap > 0 && swap < 1 ? 'Key for the previous order' : 'Cache key · SHA-256',
          1600,
          570,
          27,
          keyChanged ? themeColors.pink : themeColors.cyan,
          'center',
        );
        codeText(
          ctx,
          api,
          digest.slice(0, 12),
          1600,
          650,
          28,
          keyChanged ? themeColors.pink : themeColors.cyan,
          'center',
        );
        if (currentBeat === 1) {
          coreText(ctx, api, 'Order sent to the scorer', 150, 988, 33, themeColors.yellow);
          ['P', 'Q', 'R'].forEach((name, i) => {
            const direction = 1 - i;
            const x = 811 + (i + 2 * direction * swap) * 206;
            const y = 988 + direction * 48 * Math.sin(Math.PI * swap);
            coreText(
              ctx,
              api,
              name,
              x,
              y,
              44,
              i === 1 ? themeColors.yellow : themeColors.ink,
              'center',
            );
          });
        }
        if (currentBeat === 2) {
          const revoked = api.focus.progress('revoke-hit', 0) === 1;
          if (cueVisible(ctx, api, 'cache-access-recheck'))
            coreText(
              ctx,
              api,
              revoked
                ? 'Access revoked · withhold the cached result'
                : 'Checking the current grant…',
              960,
              945,
              32,
              revoked ? themeColors.pink : themeColors.yellow,
              'center',
            );
          if (revoked)
            coreText(
              ctx,
              api,
              'Current grant 8: revoked',
              1580,
              780,
              30,
              themeColors.pink,
              'center',
            );
        }
      },
    );
  }
}
export default {
  id: 'cache-input-identity',
  draw: drawCacheInputIdentity,
  cues: [
    'cache-operands',
    'cache-settings',
    'nonfinite-reject',
    'text-key-change',
    'tenant-key-change',
    'list-key-change',
    'pair-not-list',
    'hash-not-access',
    'cache-access-recheck',
    'revoke-hit',
  ],
};
