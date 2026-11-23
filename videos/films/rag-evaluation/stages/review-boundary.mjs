import { completed, spoken } from '../construction.mjs';
import { policyFixture, policyVariants } from '../model.mjs';
import {
  drawPolicyChapterCard,
  drawPolicyChapterEquation,
  drawPolicyChapterFooter,
  drawPolicyChapterText,
} from '../defaults.mjs';
// The reader edition prints these three fixed examples. The full trace model
// checks the same support, attachment and coverage relationships for each one.
function drawReaderCase(ctx, state, api, cases) {
  const moved = completed(state, 'reader-miscite', 4);
  const filled = completed(state, 'reader-complete', 3);
  const name = moved ? 'miscited' : filled ? 'complete' : 'partial';
  const variant = cases[moved ? 2 : filled ? 0 : 5];
  const result = variant.result;
  const rows = [
    'The release-freeze rule applies.',
    'Incident-commander approval is required before deployment.',
    'A linked rollback plan is required before deployment.',
  ];
  const { C, text, line } = api;
  api.focus.target('reader-input', () => {
    text(ctx, 'Reader’s Python evaluator', 150, 270, 32, C.muted);
    text(ctx, 'evaluate(' + name + ')', 150, 355, 53, C.blue, 'left', 'mono');
    text(ctx, 'Claim', 150, 463, 31, C.muted);
    text(ctx, 'Attached source', 1360, 463, 31, C.muted);
    line(ctx, 150, 490, 1770, 490, C.muted, 2);
    rows.slice(0, variant.answer.length).forEach((row, i) => {
      const y = 569 + i * 88;
      text(ctx, row, 150, y, 36, C.ink);
      text(ctx, moved ? 'Rollback runbook' : 'DEPLOY-17', 1360, y, 33, C.cyan);
    });
  });
  api.focus.target('reader-output', () => {
    text(ctx, 'Returned string', 150, 846, 31, C.muted);
    const fields = [
      'faithfulness ' + result.faithfulness.toFixed(2),
      'citations ' + result.citationSupport.toFixed(2),
    ];
    if (result.citationSupport === 1) fields.push('completeness ' + result.completeness.toFixed(2));
    const returned = fields.join(', ') + (result.release ? ': pass' : ': stop');
    const pending = moved
      ? !completed(state, 'reader-stop', 5)
      : filled
        ? !completed(state, 'reader-complete-pass', 3)
        : !completed(state, 'reader-partial-stop', 3);
    text(
      ctx,
      pending ? (moved ? 'Which check stops here?' : 'Checking the answer…') : returned,
      150,
      933,
      40,
      pending ? C.ink : C.yellow,
      'left',
      'mono',
    );
  });
}

export function drawReviewBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (cue, beat = currentBeat) => spoken(state, cue, beat),
    resultComplete = (cue, beat = currentBeat) => completed(state, cue, beat),
    f = policyFixture(),
    cases = policyVariants();
  if (currentBeat >= 3) return drawReaderCase(ctx, state, api, cases);
  api.focus.target('review-boundary-mechanism', () => {
    if (currentBeat === 0) {
      drawPolicyChapterText(
        ctx,
        api,
        'Same claim ID · text still needs independent review',
        960,
        285,
        35,
        themeColors.ink,
        'center',
      );
      const spoof = cueProgress('id-spoof') > 0,
        values = [
          [
            spoof ? 'rollback-plan' : 'approval',
            'Incident commander approval is required before rollout.',
            'Known exact text',
            themeColors.green,
          ],
          [
            'approval',
            'Approval from the incident commander is mandatory.',
            'Review',
            themeColors.yellow,
          ],
          [
            'approval',
            'Incident commander approval is not required.',
            'Review',
            themeColors.yellow,
          ],
        ],
        count = 1 + Math.ceil(cueProgress('unknown-review') * 2);
      values.slice(0, count).forEach(([key, text, status, color], i) => {
        const y = 400 + i * 175;
        drawPolicyChapterCard(ctx, api, key, 150, y, 300, themeColors.blue, 110, 25);
        drawPolicyChapterCard(ctx, api, text, 520, y, 950, themeColors.blue, 110, 27);
        drawPolicyChapterText(ctx, api, status, 1630, y + 65, 29, color, 'center');
      });
      drawPolicyChapterFooter(
        ctx,
        api,
        spoof
          ? 'Changing the first ID leaves its reviewed point equal to approval · rollback remains uncovered'
          : 'Only reviewed wording gets a support label; unfamiliar text remains unresolved',
      );
    } else if (currentBeat === 1) {
      const blank = cueProgress('blank-citation') > 0;
      drawPolicyChapterText(
        ctx,
        api,
        'Correct text · ' + (blank ? 'blank attached source' : 'wrong attached source'),
        960,
        285,
        38,
        themeColors.ink,
        'center',
      );
      f.complete.forEach((v, i) => {
        const y = 390 + i * 155;
        drawPolicyChapterCard(ctx, api, v.text, 150, y, 1110, themeColors.green, 110, 27);
        drawPolicyChapterCard(
          ctx,
          api,
          blank && i === 0 ? '[ ]' : '[Rollback drill]',
          1370,
          y,
          390,
          themeColors.pink,
          110,
          27,
        );
      });
      if (resultComplete('miscited-score')) {
        drawPolicyChapterEquation(ctx, api, 'F=3/3=1', 510, 940, 45, themeColors.green);
        drawPolicyChapterEquation(
          ctx,
          api,
          String.raw`C_{\rm support}=0/3=0`,
          1390,
          940,
          45,
          themeColors.pink,
        );
      }
      drawPolicyChapterFooter(
        ctx,
        api,
        blank
          ? 'Citation coverage drops from 3/3 to 2/3 · support remains 0/3'
          : 'The prompt supplied the freeze policy. Each citation opens drill instructions.',
      );
    } else {
      const count = 1 + Math.ceil(cueProgress('unknown-coverage') * 2);
      drawPolicyChapterText(
        ctx,
        api,
        'Keep unknown claims inside the reported coverage',
        960,
        285,
        37,
        themeColors.ink,
        'center',
      );
      ['Known supported text', 'Unreviewed valid paraphrase', 'Unreviewed contradiction']
        .slice(0, count)
        .forEach((v, i) => {
          const y = 420 + i * 145;
          drawPolicyChapterCard(
            ctx,
            api,
            v,
            180,
            y,
            930,
            i ? themeColors.yellow : themeColors.green,
            105,
          );
          drawPolicyChapterCard(
            ctx,
            api,
            i ? 'REVIEW · unresolved' : 'Reviewed · supported',
            1230,
            y,
            530,
            i ? themeColors.yellow : themeColors.green,
            105,
            27,
          );
        });
      if (count === 3)
        drawPolicyChapterText(
          ctx,
          api,
          'Displayed wording: 1 reviewed / 3 total · 2 unresolved / 3 total',
          960,
          935,
          33,
          themeColors.yellow,
          'center',
        );
      drawPolicyChapterFooter(
        ctx,
        api,
        'An unknown verdict is neither a semantic contradiction nor a passing release gate',
      );
    }
  });
}
export default {
  id: 'review-boundary',
  draw: drawReviewBoundary,
  cues: [
    'review-boundary-1',
    'unknown-review',
    'id-spoof',
    'review-boundary-2',
    'miscited-score',
    'blank-citation',
    'review-boundary-3',
    'unknown-coverage',
    'reader-partial',
    'reader-partial-stop',
    'reader-complete',
    'reader-complete-pass',
    'reader-miscite',
    'reader-stop',
  ],
};
