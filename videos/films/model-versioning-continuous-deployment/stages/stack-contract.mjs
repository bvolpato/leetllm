import { clamp } from '../arithmetic.mjs';
import { arrow, chapterText, footer, pill, rectangle } from '../defaults.mjs';
export function drawStackContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cue = (k) => state.cues?.['mv-stack-contract-' + k],
    B = (k) => !!cue(k) && cue(k).phase !== 'before';
  api.focus.target('stack-contract-mechanism', () => {
    const rows =
      currentBeat === 0
        ? [
            ['artifact bytes', 'artifact store / OCI', 'bytes'],
            ['whole manifest + CAS', 'owned release registry', 'registry'],
            ['model version only', 'MLflow alias', 'model'],
            ['prompt / corpus / runtime', 'surrounding manifest', 'whole'],
          ]
        : currentBeat === 1
          ? [
              ['case outcomes + scorer', 'CI / reviewed evaluator', 'evaluator'],
              ['pause / abort analysis', 'Argo Rollouts', 'rollout'],
              ['fine traffic weights', 'compatible traffic router', 'router'],
              ['conversation assignment', 'application store', 'assignment'],
            ]
          : [
              ['capacity + compatibility', 'workers / backend', 'workers'],
              ['served identity + outcome', 'collectors / evidence store', 'observed'],
              ['flag resolved at request', 'inference trace', 'observed'],
            ];
    chapterText(
      ctx,
      api,
      'Place each retained object at its enforcing boundary',
      960,
      295,
      34,
      themeColors.yellow,
    );
    rows.forEach(([object, owner, key], i) => {
      const y = 425 + i * 145;
      pill(ctx, api, object, 525, y, 730, themeColors.blue, 85, 29);
      rectangle(
        ctx,
        api,
        1030,
        y - 48,
        710,
        96,
        themeColors.panel,
        B(key) ? themeColors.cyan : themeColors.border,
      );
      if (B(key)) chapterText(ctx, api, owner, 1385, y + 10, 29, themeColors.cyan);
      arrow(ctx, api, 915, y, 1000, y, B(key) ? themeColors.cyan : themeColors.border);
    });
    if (currentBeat === 0 && B('whole'))
      chapterText(
        ctx,
        api,
        'Component alias leaves application dependencies outside its scope',
        960,
        965,
        30,
        themeColors.yellow,
      );
    footer(
      ctx,
      api,
      currentBeat === 0
        ? 'MLflow fixed stages are deprecated'
        : currentBeat === 1
          ? 'Replica weights approximate traffic; task support and persistent turns remain application-owned'
          : 'Read the resolved release from the request trace',
    );
  });
}
export default {
  id: 'stack-contract',
  draw: drawStackContract,
  cues: [
    'mv-stack-contract-bytes',
    'mv-stack-contract-registry',
    'mv-stack-contract-model',
    'mv-stack-contract-whole',
    'mv-stack-contract-evaluator',
    'mv-stack-contract-rollout',
    'mv-stack-contract-router',
    'mv-stack-contract-assignment',
    'mv-stack-contract-workers',
    'mv-stack-contract-observed',
  ],
};
