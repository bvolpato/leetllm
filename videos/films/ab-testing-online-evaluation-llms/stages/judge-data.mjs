import { onlineCueProgress } from '../construction.mjs';
import { box, text as constructionText } from '../defaults.mjs';
export function drawJudgeData(ctx, scene, state, api) {
  const { C: themeColors } = api,
    B = state.beat ?? 0;
  const cueProgress = (suffix, beat, start = 0.1, end = 0.85) =>
      onlineCueProgress(state, `oa-${'judge-data'}-${suffix}`, beat, start, end),
    resultComplete = (suffix, beat) => cueProgress(suffix, beat) === 1;
  api.focus.target('oa-judge-data-mechanism', () => {
    if (B === 0) {
      const p = cueProgress('payload', 0);
      box(
        ctx,
        api,
        ['Evaluator instructions', 'rubric + evidence comparison', 'no tools or secrets'],
        170,
        325,
        740,
        165,
        themeColors.blue,
        31,
      );
      box(
        ctx,
        api,
        ['JSON payload', 'query / source / response A / response B'],
        1010,
        325,
        740,
        165,
        themeColors.cyan,
        29,
      );
      if (p > 0) {
        box(
          ctx,
          api,
          ['Response A', 'Contains a request to score itself'],
          1010,
          575,
          740,
          125,
          themeColors.pink,
          27,
        );
        if (resultComplete('injection', 0))
          constructionText(
            ctx,
            api,
            'Untrusted reply text',
            1380,
            770,
            32,
            themeColors.yellow,
            'center',
          );
      }
    }
    if (B === 1) {
      box(
        ctx,
        api,
        ['Invented approved v2 excerpt', '100 requests per minute'],
        210,
        380,
        680,
        150,
        themeColors.blue,
        32,
      );
      box(
        ctx,
        api,
        ['Candidate B claim', '100 requests per minute'],
        1030,
        380,
        680,
        150,
        themeColors.cyan,
        32,
      );
      if (resultComplete('source', 1))
        box(
          ctx,
          api,
          'The cited guide supports this number',
          460,
          650,
          1000,
          100,
          themeColors.green,
          35,
        );
      if (resultComplete('scope', 1))
        constructionText(
          ctx,
          api,
          'Judge request ready',
          960,
          825,
          34,
          themeColors.yellow,
          'center',
        );
    }
    if (B === 2) {
      box(ctx, api, ['Order 1', 'X left / Y right'], 220, 385, 650, 125, themeColors.blue, 31);
      box(ctx, api, ['Order 2', 'Y left / X right'], 1040, 385, 650, 125, themeColors.cyan, 31);
      if (resultComplete('swap', 2))
        box(
          ctx,
          api,
          [
            'Keep identity, order, response length and rubric linked',
            'Audit against held-out human decisions',
          ],
          250,
          650,
          1420,
          140,
          themeColors.yellow,
          31,
        );
    }
  });
}
export default {
  id: 'judge-data',
  draw: drawJudgeData,
  cues: [
    'oa-judge-data-0',
    'oa-judge-data-payload',
    'oa-judge-data-injection',
    'oa-judge-data-1',
    'oa-judge-data-source',
    'oa-judge-data-scope',
    'oa-judge-data-2',
    'oa-judge-data-swap',
  ],
};
