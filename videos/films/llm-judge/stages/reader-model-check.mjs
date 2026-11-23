import { cueVisible, footer, text, withFocus } from '../defaults.mjs';
export function drawReaderModelCheck(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    text(
      ctx,
      api,
      'Documented Qwen3-1.7B article snapshot · sampling off · thinking disabled',
      130,
      265,
      28,
      themeColors.blue,
    );
    withFocus(ctx, api, 'reader-snapshot', () =>
      text(
        ctx,
        api,
        'Source: incident-commander approval and a linked rollback plan are required before deployment.',
        130,
        325,
        28,
        themeColors.blue,
      ),
    );
    const claims = [
      'Commander permission required',
      'Rollback plan must be linked',
      'Deploy without linked plan',
      'Commander approval optional',
      'Security review required',
      'On-call approval required',
      'Candidate asks for a support verdict',
    ];
    const gold = [
      'supported',
      'supported',
      'contradicted',
      'contradicted',
      'review',
      'review',
      'review',
    ];
    const predicted = [
      'supported',
      'supported',
      'contradicted',
      'supported',
      'supported',
      'supported',
      'review',
    ];
    text(ctx, api, 'supplied policy claim', 150, 395, 28, themeColors.muted);
    text(ctx, api, 'reference', 1160, 395, 28, themeColors.muted);
    text(ctx, api, 'documented output', 1510, 395, 28, themeColors.muted);
    claims.forEach((claim, i) =>
      withFocus(ctx, api, i >= 3 && i <= 5 ? 'semantic-miss' : 'reader-labels', () => {
        const y = 455 + i * 65,
          miss = i >= 3 && i <= 5,
          show = miss
            ? cueVisible(ctx, api, 'semantic-miss')
            : cueVisible(ctx, api, 'reader-labels');
        text(
          ctx,
          api,
          String(i + 1) + '. ' + claim,
          150,
          y,
          30,
          miss && show ? themeColors.pink : themeColors.ink,
        );
        if (cueVisible(ctx, api, 'reader-labels'))
          text(ctx, api, gold[i], 1160, y, 28, miss ? themeColors.yellow : themeColors.cyan);
        if (show)
          text(ctx, api, predicted[i], 1510, y, 28, miss ? themeColors.pink : themeColors.green);
      }),
    );
    if (cueVisible(ctx, api, 'semantic-miss'))
      withFocus(ctx, api, 'semantic-miss', () =>
        text(
          ctx,
          api,
          'Its explanation says approval is required, contradicting the “optional” claim.',
          960,
          905,
          29,
          themeColors.pink,
          'center',
        ),
      );
    if (cueVisible(ctx, api, 'reader-snapshot'))
      withFocus(ctx, api, 'reader-snapshot', () =>
        text(
          ctx,
          api,
          '2 supported · 2 contradicted · 3 review reference labels',
          960,
          950,
          29,
          themeColors.blue,
          'center',
        ),
      );
    if (cueVisible(ctx, api, 'valid-json-misses'))
      withFocus(ctx, api, 'valid-json-misses', () =>
        text(
          ctx,
          api,
          'All three misses parse. The 0.6B snapshot supported all seven.',
          960,
          985,
          30,
          themeColors.pink,
          'center',
        ),
      );
    footer(ctx, api, 'Saved article output, not a fresh model run or population benchmark.');
  }
}
export default {
  id: 'reader-model-check',
  draw: drawReaderModelCheck,
  cues: ['reader-snapshot', 'reader-labels', 'semantic-miss', 'valid-json-misses'],
};
