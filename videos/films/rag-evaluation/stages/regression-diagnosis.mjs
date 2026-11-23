import { completed, spoken } from '../construction.mjs';
import { policyEvaluation, policyFixture, policyVariants } from '../model.mjs';
import {
  drawPolicyChapterCard,
  drawPolicyChapterFooter,
  drawPolicyChapterText,
} from '../defaults.mjs';
export function drawRegressionDiagnosis(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (cue, beat = currentBeat) => spoken(state, cue, beat),
    resultComplete = (cue, beat = currentBeat) => completed(state, cue, beat),
    f = policyFixture(),
    cases = policyVariants();
  api.focus.target('regression-diagnosis-mechanism', () => {
    if (currentBeat === 2) {
      const mixed = policyEvaluation(cases[6].trace, cases[1].answer, f),
        count = Math.ceil(cueProgress('diagnostic-order') * 8);
      drawPolicyChapterText(
        ctx,
        api,
        'One mixed defect · missing candidate plus invented bypass',
        960,
        285,
        34,
        themeColors.ink,
        'center',
      );
      cases[1].answer.forEach((v, i) =>
        drawPolicyChapterCard(ctx, api, v.text, 150, 390 + i * 145, 850, themeColors.pink, 110, 28),
      );
      drawPolicyChapterText(
        ctx,
        api,
        'First failed release gate: candidate retrieval',
        575,
        700,
        29,
        themeColors.pink,
        'center',
      );
      drawPolicyChapterText(
        ctx,
        api,
        'Independent diagnostic support: 0 / 2 claims',
        575,
        790,
        28,
        themeColors.yellow,
        'center',
      );
      mixed.stages.slice(0, count).forEach((v, i) => {
        const y = 380 + i * 68;
        drawPolicyChapterCard(
          ctx,
          api,
          v.name + ' · ' + v.status,
          1110,
          y,
          650,
          v.status === 'fail'
            ? themeColors.pink
            : v.status === 'unscored'
              ? themeColors.muted
              : themeColors.green,
          54,
          24,
        );
      });
      drawPolicyChapterFooter(
        ctx,
        api,
        'Later release checks remain unscored; the same recorded context still supports separate diagnosis',
      );
    } else {
      const ordered =
          currentBeat === 0
            ? [cases[0], cases[6], cases[4], cases[1], cases[2], cases[5], cases[3]]
            : cases.slice(0, 6),
        count = currentBeat === 0 ? 1 + Math.ceil(cueProgress('regression-damage') * 6) : 6,
        reveal = currentBeat === 0 || resultComplete('regression-results', 1);
      drawPolicyChapterText(
        ctx,
        api,
        'Controlled trace/answer damage · original case identities retained',
        960,
        285,
        33,
        themeColors.ink,
        'center',
      );
      ordered.slice(0, count).forEach((v, i) => {
        const x = 150 + (i % 2) * 890,
          y = 380 + Math.floor(i / 2) * 145;
        drawPolicyChapterCard(
          ctx,
          api,
          v.name,
          x,
          y,
          790,
          reveal ? (v.result.release ? themeColors.green : themeColors.blue) : themeColors.blue,
          90,
        );
        if (reveal)
          drawPolicyChapterText(
            ctx,
            api,
            v.result.firstFailure,
            x + 395,
            y + 123,
            25,
            v.result.release ? themeColors.green : themeColors.pink,
            'center',
          );
      });
      drawPolicyChapterFooter(
        ctx,
        api,
        currentBeat === 1
          ? reveal
            ? 'Six specified decisions: one release and five blocks · not a production success rate'
            : 'Predict the six release decisions before the spoken result'
          : 'Controlled damage identifies an observed boundary; it does not establish a root cause',
      );
    }
  });
}
export default {
  id: 'regression-diagnosis',
  draw: drawRegressionDiagnosis,
  cues: [
    'regression-diagnosis-1',
    'regression-damage',
    'regression-diagnosis-2',
    'regression-results',
    'regression-diagnosis-3',
    'diagnostic-order',
  ],
};
