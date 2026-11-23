import { spoken } from '../construction.mjs';
import { abstentionOutcome, policyFixture, policyVariants } from '../model.mjs';
import {
  drawPolicyChapterCard,
  drawPolicyChapterFooter,
  drawPolicyChapterText,
} from '../defaults.mjs';
export function drawAbstentionMatrix(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (cue, beat = currentBeat) => spoken(state, cue, beat),
    f = policyFixture(),
    cases = policyVariants();
  api.focus.target('abstention-matrix-mechanism', () => {
    const rows = [
      ['Complete answer', true, true, 'complete-supported'],
      ['Corpus has no answer', false, false, 'bounded-abstention'],
      ['Rule missed by selection', true, false, 'bounded-abstention'],
      ['Rule present · refusal', true, true, 'bounded-abstention'],
    ];
    if (currentBeat === 0) {
      drawPolicyChapterText(
        ctx,
        api,
        'Waiver question · no established exception in this permitted corpus',
        960,
        285,
        32,
        themeColors.ink,
        'center',
      );
      drawPolicyChapterCard(
        ctx,
        api,
        'The available policy lists no waiver. Ask the policy owner.',
        180,
        430,
        1540,
        themeColors.green,
        130,
        33,
      );
      drawPolicyChapterText(
        ctx,
        api,
        'Bounded to available evidence',
        960,
        625,
        32,
        themeColors.green,
        'center',
      );
      if (cueProgress('universal-claim')) {
        drawPolicyChapterCard(
          ctx,
          api,
          'No waiver exists anywhere.',
          180,
          725,
          1540,
          themeColors.pink,
          110,
          34,
        );
        drawPolicyChapterText(
          ctx,
          api,
          'Unsupported universal claim',
          960,
          910,
          32,
          themeColors.pink,
          'center',
        );
      }
      drawPolicyChapterFooter(
        ctx,
        api,
        'Corpus answerability and selected-context sufficiency are trusted labels for this caller',
      );
    } else if (currentBeat === 1) {
      drawPolicyChapterText(
        ctx,
        api,
        'Four reviewed cases · same evidence labels, separate outcomes',
        960,
        285,
        33,
        themeColors.ink,
        'center',
      );
      ['Case', 'Corpus', 'Context', 'Safe*', 'Evidence', 'Task'].forEach((v, i) =>
        drawPolicyChapterText(
          ctx,
          api,
          v,
          [300, 750, 930, 1130, 1390, 1640][i],
          380,
          28,
          themeColors.muted,
          'center',
        ),
      );
      const count = Math.ceil(cueProgress('abstention-cases') * 4);
      rows.slice(0, count).forEach(([name, corpus, context, response], i) => {
        const y = 500 + i * 115,
          result = abstentionOutcome(corpus, context, response);
        drawPolicyChapterText(ctx, api, name, 160, y, 27, themeColors.ink);
        [corpus, context, result.safe, result.evidencePath, result.taskSuccess].forEach((v, j) =>
          drawPolicyChapterText(
            ctx,
            api,
            v ? 'YES' : 'NO',
            [750, 930, 1130, 1390, 1640][j],
            y,
            28,
            v ? themeColors.green : themeColors.pink,
            'center',
          ),
        );
      });
      drawPolicyChapterFooter(
        ctx,
        api,
        '* Safe here means avoidance of unsupported policy claims in this reviewed fixture',
      );
    } else {
      drawPolicyChapterText(
        ctx,
        api,
        'No emitted claims → support ratio 0/0 is undefined',
        960,
        450,
        37,
        themeColors.yellow,
        'center',
      );
      if (cueProgress('empty-conventions')) {
        drawPolicyChapterCard(
          ctx,
          api,
          'Reference harness: conventional 0',
          170,
          615,
          740,
          themeColors.blue,
          125,
        );
        drawPolicyChapterCard(
          ctx,
          api,
          'Reader scorer: abstention state',
          1010,
          615,
          740,
          themeColors.cyan,
          125,
        );
        drawPolicyChapterText(
          ctx,
          api,
          'Answerable-case claim-presence gate still fails',
          960,
          855,
          36,
          themeColors.pink,
          'center',
        );
      }
      drawPolicyChapterFooter(
        ctx,
        api,
        'A convention is explicit bookkeeping; inspect the actual response and evidence state',
      );
    }
  });
}
export default {
  id: 'abstention-matrix',
  draw: drawAbstentionMatrix,
  cues: [
    'abstention-matrix-1',
    'universal-claim',
    'abstention-matrix-2',
    'abstention-cases',
    'abstention-matrix-3',
    'empty-conventions',
  ],
};
