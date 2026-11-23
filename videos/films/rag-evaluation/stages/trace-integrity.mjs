import { POLICY_ID } from '../fixtures.mjs';
import { completed, spoken } from '../construction.mjs';
import { admissiblePolicy, policyFixture, recordDigest } from '../model.mjs';
import {
  drawPolicyChapterCard,
  drawPolicyChapterFooter,
  drawPolicyChapterText,
} from '../defaults.mjs';
export function drawTraceIntegrity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (cue, beat = currentBeat) => spoken(state, cue, beat),
    resultComplete = (cue, beat = currentBeat) => completed(state, cue, beat),
    f = policyFixture();
  api.focus.target('trace-integrity-mechanism', () => {
    if (currentBeat === 0) {
      drawPolicyChapterText(
        ctx,
        api,
        'Returned candidates cross this caller’s authorization boundary',
        960,
        290,
        32,
        themeColors.ink,
        'center',
      );
      drawPolicyChapterCard(
        ctx,
        api,
        'Restricted break-glass note',
        180,
        430,
        700,
        themeColors.pink,
        110,
      );
      api.line(ctx, 980, 370, 980, 810, themeColors.yellow, 7);
      drawPolicyChapterCard(
        ctx,
        api,
        'Trusted permission: FALSE',
        1110,
        430,
        650,
        themeColors.yellow,
        110,
      );
      if (cueProgress('restricted-return')) {
        api.arrow(ctx, 900, 485, 955, 485, themeColors.pink, 5);
        drawPolicyChapterCard(
          ctx,
          api,
          'Admissibility FAIL before selection',
          520,
          740,
          1000,
          themeColors.pink,
          110,
        );
      }
      drawPolicyChapterFooter(
        ctx,
        api,
        'This boundary is not an inventory of every internal index scan',
      );
    } else if (currentBeat === 1) {
      drawPolicyChapterText(
        ctx,
        api,
        'Bind actual receipt fields before scoring',
        960,
        290,
        35,
        themeColors.ink,
        'center',
      );
      const rows = [
          ['Case', 'payment-freeze-deploy-001'],
          ['Question', 'Payment service · production · freeze'],
          ['Candidate IDs', 'Rollback drill / Frontend docs / DEPLOY-17'],
          ['Rerank input', 'Subset of returned unique IDs'],
          ['Reranked IDs', 'Same reranker inputs, reordered'],
          ['Selected receipt', 'DEPLOY-17 / deploy-policy/2026-06-01'],
        ],
        count = Math.ceil(cueProgress('receipt-fields') * 6);
      rows.forEach(([a, z], i) => {
        const y = 390 + i * 82;
        drawPolicyChapterText(ctx, api, a, 170, y + 35, 28, themeColors.muted);
        drawPolicyChapterCard(
          ctx,
          api,
          i < count ? z : 'Awaiting receipt',
          600,
          y,
          1150,
          i < count ? themeColors.blue : themeColors.muted,
          68,
          27,
        );
      });
      drawPolicyChapterFooter(
        ctx,
        api,
        'Required component versions, access and freshness remain trusted external receipts',
      );
    } else {
      const original = f.snapshot[POLICY_ID];
      const returned = f.records[POLICY_ID];
      const changed = cueProgress('integrity-edit', 2) > 0;
      if (changed)
        returned.text = original.text.replace(
          'and a linked rollback plan',
          'or a linked rollback plan',
        );
      const reveal = resultComplete('integrity-answer', 3);
      drawPolicyChapterText(
        ctx,
        api,
        changed ? 'Same ID + version · changed source payload' : 'One recorded ID and revision',
        150,
        283,
        35,
      );
      [original, returned].forEach((record, i) => {
        const x = 150 + i * 853;
        const color = i && changed ? themeColors.yellow : themeColors.cyan;
        drawPolicyChapterText(
          ctx,
          api,
          i ? 'Returned to evaluator' : 'Trusted snapshot',
          x,
          403,
          38,
          themeColors.blue,
        );
        drawPolicyChapterText(ctx, api, record.id, x, 471, 30);
        drawPolicyChapterText(ctx, api, record.version, x, 522, 30);
        const clause = record.text.slice(record.text.indexOf('require incident'));
        const split = clause.indexOf('approval') + 'approval'.length;
        drawPolicyChapterText(ctx, api, clause.slice(0, split), x, 643, 35);
        drawPolicyChapterText(ctx, api, clause.slice(split).trim(), x, 696, 35, color);
        drawPolicyChapterText(
          ctx,
          api,
          'SHA-256   ' + recordDigest(record).slice(0, 12) + '…',
          x,
          790,
          28,
          themeColors.muted,
        );
      });
      const accepted = admissiblePolicy(f.trace, f);
      const decision = reveal
        ? accepted
          ? 'Record matches'
          : 'Full record mismatch → admissibility FAIL'
        : 'May this record be used to grade the answer?';
      drawPolicyChapterText(
        ctx,
        api,
        decision,
        960,
        928,
        40,
        reveal ? themeColors.pink : themeColors.ink,
        'center',
      );
    }
  });
}
export default {
  id: 'trace-integrity',
  draw: drawTraceIntegrity,
  cues: [
    'trace-integrity-1',
    'restricted-return',
    'trace-integrity-2',
    'receipt-fields',
    'trace-integrity-3',
    'integrity-edit',
    'integrity-answer',
  ],
};
