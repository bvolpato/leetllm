import { caption, codeText, coreText, cueVisible, focusTargets, rectangle } from '../defaults.mjs';
export function drawTraceAndReject(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    focusTargets(
      ctx,
      api,
      [
        'trace-input',
        'trace-output',
        'trace-spans',
        'reject-text',
        'reject-admin',
        'reject-bool',
        'offline-gates',
        'offline-labels',
        'live-trace',
        'privacy-limit',
      ],
      () => {
        coreText(
          ctx,
          api,
          'One actual three-candidate scoring invocation',
          150,
          305,
          34,
          themeColors.ink,
        );
        const rows = [
          [
            'input',
            'api-token-troubleshooting-v1 / api-password-reset-v1 / api-token-legacy-v2-rule',
          ],
          [
            'reordered',
            'api-token-legacy-v2-rule / api-password-reset-v1 / api-token-troubleshooting-v1',
          ],
          ['selected', 'api-token-legacy-v2-rule · parent api-auth-v2 · api-auth/2026-04-01'],
          ['packed', 'exact AUTH-14 source span'],
        ];
        rows.forEach(([name, value], i) => {
          const y = 405 + i * 130,
            visible =
              currentBeat > 0 ||
              (i === 0 && cueVisible(ctx, api, 'trace-input')) ||
              (i > 0 && i < 3 && cueVisible(ctx, api, 'trace-output')) ||
              (i === 3 && cueVisible(ctx, api, 'trace-spans'));
          coreText(ctx, api, name, 160, y + 25, 29, themeColors.muted);
          rectangle(ctx, api, 470, y - 25, 1280, 90, i >= 2 ? themeColors.green : themeColors.blue);
          if (visible)
            codeText(
              ctx,
              api,
              value,
              500,
              y + 32,
              i < 3 ? 23 : 28,
              i >= 2 ? themeColors.green : themeColors.blue,
            );
        });
        if (currentBeat === 1) {
          let message = cueVisible(ctx, api, 'reject-bool')
            ? 'Boolean score/budget is not the numeric contract'
            : cueVisible(ctx, api, 'reject-admin')
              ? 'admin-only replacement + score 999 → reject'
              : cueVisible(ctx, api, 'reject-text')
                ? 'same ID/version + changed text → reject'
                : null;
          if (message) coreText(ctx, api, message, 960, 970, 33, themeColors.pink, 'center');
          if (cueVisible(ctx, api, 'offline-gates'))
            coreText(ctx, api, '4 offline gates pass', 1570, 330, 29, themeColors.green, 'center');
        }
        if (currentBeat === 2) {
          coreText(
            ctx,
            api,
            cueVisible(ctx, api, 'offline-labels')
              ? 'Gold target / ordering lift → labeled offline suite'
              : '',
            960,
            940,
            31,
            themeColors.yellow,
            'center',
          );
          if (cueVisible(ctx, api, 'privacy-limit'))
            coreText(
              ctx,
              api,
              'Check logs for exposed fragments as well as complete passages.',
              960,
              995,
              30,
              themeColors.pink,
              'center',
            );
        }
      },
    );
    caption(
      ctx,
      api,
      'Keep the actual input subset and every surviving identity bound to the receipt.',
    );
  }
}
export default {
  id: 'trace-and-reject',
  draw: drawTraceAndReject,
  cues: [
    'trace-input',
    'trace-output',
    'trace-spans',
    'reject-text',
    'reject-admin',
    'reject-bool',
    'offline-gates',
    'offline-labels',
    'live-trace',
    'privacy-limit',
  ],
};
