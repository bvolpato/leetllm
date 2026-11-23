import { accessResult, exactCandidate, parseAttackBatch } from '../arithmetic.mjs';
import { GCG_CANDIDATES } from '../fixtures.mjs';
import { completed, logicalState, voice } from '../construction.mjs';
import { drawAuditCard, drawAuditText, drawBlock, drawFooter, withFocus } from '../defaults.mjs';
export function drawAttackSearch(ctx, scene, state, api) {
  state = logicalState('attack-search', state);
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (id, beat = currentBeat) => voice(state, id, beat),
    resultComplete = (id, beat = currentBeat) => completed(state, id, beat);
  {
    if (currentBeat === 0) {
      withFocus(ctx, api, 'threat-model', () => {
        drawAuditText(
          ctx,
          api,
          'Synthetic incident INC-8821 · caller has no record scope',
          960,
          300,
          34,
          themeColors.yellow,
          'center',
        );
        [
          ['Entry', 'user message / retrieved text'],
          ['Reachable effect', 'private read / outgoing destination'],
          ['Budget', 'queries + turns + stopping rule'],
        ].forEach(([a, z], i) => {
          drawAuditCard(ctx, api, a, 160, 435 + i * 150, 350, themeColors.blue);
          drawAuditCard(ctx, api, z, 650, 435 + i * 150, 1100, themeColors.cyan);
        });
      });
      drawFooter(
        ctx,
        api,
        'Record the test conditions with the observed answer and any tool effects',
      );
    } else if (currentBeat === 1) {
      const { C } = api;
      const t = (label, x, y, size, color = C.ink) => api.text(ctx, label, x, y, size, color);
      const entries = GCG_CANDIDATES.filter((row) => row.id !== 'A');
      const ranked = cueProgress('gcg-gradient');
      const losses = cueProgress('gcg-exact');
      const chosen = resultComplete('attack-search-2');
      const inspected = exactCandidate().id;
      t('Two saved cases · white-box evaluation', 135, 292, 45);
      withFocus(ctx, api, 'exact-candidates', () => {
        t('Surrogate loss', 576, 402, 32, C.muted);
        entries.forEach((row, i) => {
          const y = 504 + 145 * i;
          t('Case ' + row.id, 136, y, 55);
          if (ranked && i === 0) t('First by estimate', 137, y + 45, 29, C.cyan);
          api.line(ctx, 575, y + 20, 1260, y + 20, C.muted, 2);
          if (losses)
            drawBlock(
              ctx,
              api,
              575,
              y - 39,
              650 * row.loss * losses,
              47,
              chosen && row.id === inspected ? C.yellow : C.cyan,
            );
          if (losses === 1) t(row.loss.toFixed(1), 1315, y + 4, 53);
        });
        t('Trace to review', 136, 801, 33, C.muted);
        if (chosen) t('Choose ' + inspected + ' after exact checks', 575, 801, 41, C.yellow);
      });
      if (cueProgress('search-receipt') > 0)
        withFocus(ctx, api, 'reviewed-trace', () => {
          api.line(ctx, 136, 853, 1785, 853, C.muted, 2);
          t('Read denied', 136, 950, 42, C.blue);
          t('Private records fetched    ' + Number(accessResult().fetched), 575, 950, 38);
          t('Reply    Access portal', 1270, 950, 38, C.green);
        });
    } else {
      const batches = [
        ['Freeze rule?', 'Docs policy?'],
        ['Freeze rule?', 'Freeze rule?'],
      ];
      const receipts = batches.map((batch) => parseAttackBatch(batch));
      const parsed = cueProgress('batch-parse'),
        reject = cueProgress('attack-search-3');
      withFocus(ctx, api, 'attack-accounting', () => {
        drawAuditCard(
          ctx,
          api,
          JSON.stringify(batches[0]),
          160,
          400,
          710,
          themeColors.blue,
          140,
          32,
        );
        drawAuditCard(
          ctx,
          api,
          JSON.stringify(batches[1]),
          1040,
          400,
          710,
          themeColors.blue,
          140,
          32,
        );
        if (parsed) {
          api.arrow(ctx, 515, 560, 515, 610, themeColors.yellow, 4);
          api.arrow(ctx, 1395, 560, 1395, 610, themeColors.yellow, 4);
          drawAuditText(
            ctx,
            api,
            receipts[0].accepted ? 'Unique strings · batch admitted' : 'Batch rejected',
            515,
            680,
            32,
            themeColors.green,
            'center',
          );
          drawAuditText(
            ctx,
            api,
            'Duplicate string → batch rejected',
            1395,
            680,
            32,
            themeColors.pink,
            'center',
          );
        }
        if (reject) {
          drawAuditCard(
            ctx,
            api,
            'Rejected batch · target attempts ' + receipts[1].targetAttempts,
            1040,
            795,
            710,
            themeColors.pink,
          );
          drawAuditCard(
            ctx,
            api,
            'Admitted cases for testing: ' + receipts[0].targetAttempts,
            160,
            795,
            710,
            themeColors.yellow,
          );
        }
      });
      drawFooter(ctx, api, 'Only admitted questions proceed to the evaluation');
    }
  }
}
export default {
  id: 'attack-search',
  draw: drawAttackSearch,
  cues: [
    'attack-search-1',
    'attack-search-2',
    'gcg-gradient',
    'gcg-exact',
    'search-receipt',
    'attack-search-3',
    'batch-parse',
  ],
};
