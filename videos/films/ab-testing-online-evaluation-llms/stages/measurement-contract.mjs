import { onlineCueProgress } from '../construction.mjs';
import { box, caption } from '../defaults.mjs';
export function drawMeasurementContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    B = state.beat ?? 0;
  const cueProgress = (suffix, beat, start = 0.1, end = 0.85) =>
      onlineCueProgress(state, `oa-${'measurement-contract'}-${suffix}`, beat, start, end),
    resultComplete = (suffix, beat) => cueProgress(suffix, beat) === 1;
  api.focus.target('oa-measurement-contract-mechanism', () => {
    box(
      ctx,
      api,
      ['Returned JSON', '{"limit": 200, "source": "v2"}'],
      165,
      320,
      740,
      145,
      themeColors.cyan,
      29,
    );
    box(
      ctx,
      api,
      ['Invented approved source v2', 'limit: 100 requests/min'],
      1010,
      320,
      740,
      145,
      themeColors.blue,
      30,
    );
    const parse = resultComplete('parse', 0),
      source = resultComplete('source', 0);
    box(
      ctx,
      api,
      parse ? 'Syntax + declared field types: pass' : 'Parsing and field checks pending',
      180,
      535,
      710,
      105,
      parse ? themeColors.green : themeColors.muted,
      29,
    );
    box(
      ctx,
      api,
      source ? 'Claim 200 ≠ source 100' : 'Factual comparison pending',
      1020,
      535,
      710,
      105,
      source ? themeColors.pink : themeColors.muted,
      30,
    );
    if (B === 1) {
      const modes = [
        ['Lexical', 'BLEU / ROUGE'],
        ['Contextual', 'BERTScore / cosine'],
        ['Contract', 'schema / format'],
      ];
      modes.forEach((r, i) =>
        box(
          ctx,
          api,
          r,
          180 + i * 545,
          745,
          500,
          110,
          resultComplete(i === 0 ? 'overlap' : 'embedding', 1)
            ? themeColors.yellow
            : themeColors.muted,
          27,
        ),
      );
    }
    if (B === 2) {
      box(
        ctx,
        api,
        ['Question + candidates + approved evidence', 'clarity / accuracy / citation rubric'],
        300,
        730,
        1320,
        125,
        resultComplete('rubric', 2) ? themeColors.cyan : themeColors.muted,
        30,
      );
    }
    caption(
      ctx,
      api,
      B < 2
        ? 'Check the number against the cited passage'
        : 'Run generated code in a constrained sandbox',
    );
  });
}
export default {
  id: 'measurement-contract',
  draw: drawMeasurementContract,
  cues: [
    'oa-measurement-contract-0',
    'oa-measurement-contract-parse',
    'oa-measurement-contract-source',
    'oa-measurement-contract-1',
    'oa-measurement-contract-overlap',
    'oa-measurement-contract-embedding',
    'oa-measurement-contract-2',
    'oa-measurement-contract-rubric',
  ],
};
