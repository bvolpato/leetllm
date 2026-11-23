import {
  arrow,
  centeredText,
  clauseComplete,
  clauseProgress,
  filledRectangle,
  tag,
} from '../defaults.mjs';
export function drawExecutionBoundaries(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('execution-boundaries-mechanism', () => {
    if (currentBeat === 0) {
      const rows = [
        ['scope-schema', 'schema', 'required fields / types'],
        ['scope-static', 'static', 'syntax / selected code properties'],
        ['scope-runtime', 'runtime', 'configured input → observed behavior'],
        ['scope-symbolic', 'symbolic', 'property under formal assumptions'],
      ];
      rows.forEach(([id, name, value], i) => {
        if (clauseProgress(ctx, api, id)) {
          const y = 370 + i * 145;
          filledRectangle(ctx, api, 180, y - 45, 350, 90, themeColors.panel);
          centeredText(ctx, api, name, 355, y + 12, 35, themeColors.blue);
          arrow(ctx, api, 570, y, 720, y);
          centeredText(ctx, api, value, 1260, y + 12, 34, themeColors.cyan);
        }
      });
    } else if (currentBeat === 1) {
      tag(ctx, api, 'Same candidate request: limit 10,000', 960, 305, themeColors.pink, 1450);
      centeredText(ctx, api, 'Generator-edited test', 500, 475, 35, themeColors.yellow);
      centeredText(ctx, api, 'Trusted independent contract', 1420, 475, 35, themeColors.blue);
      if (clauseProgress(ctx, api, 'edited-test')) {
        tag(
          ctx,
          api,
          clauseComplete(ctx, api, 'edited-test-result')
            ? '10,000 ≤ 10,000 → pass'
            : '10,000 ≤ 10,000 · result pending',
          500,
          640,
          themeColors.yellow,
          740,
        );
        tag(
          ctx,
          api,
          clauseComplete(ctx, api, 'trusted-failure')
            ? '10,000 ≤ 100 → fail'
            : '10,000 ≤ 100 · check pending',
          1420,
          640,
          clauseComplete(ctx, api, 'trusted-failure') ? themeColors.pink : themeColors.blue,
          740,
        );
      }
      if (clauseComplete(ctx, api, 'trusted-failure'))
        centeredText(
          ctx,
          api,
          'Withhold candidate · restore and rerun trusted checks',
          960,
          820,
          37,
          themeColors.pink,
        );
      if (clauseComplete(ctx, api, 'llama-historical'))
        centeredText(
          ctx,
          api,
          'Llama 3: ~1M execution-feedback dialogues · ~20% self-corrected',
          960,
          935,
          31,
          themeColors.muted,
        );
    } else {
      centeredText(
        ctx,
        api,
        'Phi-1 historical dataset inventory · separate token counts',
        960,
        295,
        35,
        themeColors.blue,
      );
      if (clauseProgress(ctx, api, 'phi-recipe')) {
        for (const [i, value, label, col] of [
          [0, 6, 'Filtered code: ~6B', themeColors.blue],
          [1, 1, 'Textbook: <1B (width is upper bound)', themeColors.cyan],
          [2, 0.18, 'Exercises: ~0.18B', themeColors.yellow],
        ]) {
          const y = 395 + i * 145;
          centeredText(ctx, api, label, 540, y + 43, 28, col);
          filledRectangle(ctx, api, 940, y, value * 120, 70, col);
        }
      }
      if (clauseComplete(ctx, api, 'phi-score'))
        centeredText(
          ctx,
          api,
          '1.3B parameters · HumanEval pass@1 50.6%',
          960,
          840,
          37,
          themeColors.green,
        );
      if (clauseComplete(ctx, api, 'orca-scope'))
        centeredText(
          ctx,
          api,
          'Orca: explanation traces evaluated by task outcomes',
          960,
          935,
          31,
          themeColors.cyan,
        );
    }
  });
}
export default {
  id: 'execution-boundaries',
  draw: drawExecutionBoundaries,
  cues: [
    'verifier-scopes',
    'scope-schema',
    'scope-static',
    'scope-runtime',
    'scope-symbolic',
    'independent-test',
    'edited-test',
    'edited-test-result',
    'trusted-failure',
    'llama-historical',
    'historical-outcomes',
    'phi-recipe',
    'phi-score',
    'orca-scope',
  ],
};
