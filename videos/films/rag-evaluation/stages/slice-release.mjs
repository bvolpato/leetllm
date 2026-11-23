import { completed } from '../construction.mjs';
import { policyFixture, policyVariants, sliceGate } from '../model.mjs';
import {
  drawPolicyChapterCard,
  drawPolicyChapterEquation,
  drawPolicyChapterFooter,
  drawPolicyChapterText,
} from '../defaults.mjs';
export function drawSliceRelease(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    resultComplete = (cue, beat = currentBeat) => completed(state, cue, beat),
    f = policyFixture(),
    cases = policyVariants();
  api.focus.target('slice-release-mechanism', () => {
    const report = sliceGate();
    drawPolicyChapterText(
      ctx,
      api,
      'Five synthetic case decisions · same IDs before and after grouping',
      960,
      285,
      33,
      themeColors.ink,
      'center',
    );
    report.slices.forEach((v, i) => {
      const x = 160 + i * 570;
      drawPolicyChapterText(ctx, api, v.name, x + 250, 410, 33, themeColors.blue, 'center');
      v.cases.forEach((row, j) =>
        drawPolicyChapterCard(
          ctx,
          api,
          row.id + ' · ' + (row.correct ? 'correct' : 'incorrect'),
          x,
          490 + j * 125,
          500,
          row.correct ? themeColors.green : themeColors.pink,
          95,
        ),
      );
      if (
        currentBeat > 0 ||
        resultComplete(
          ['rageval-freeze-count', 'rageval-hotfix-count', 'rageval-migration-count'][i],
          0,
        )
      )
        drawPolicyChapterText(
          ctx,
          api,
          v.k + '/' + v.n + ' = ' + Math.round((100 * v.k) / v.n) + '%',
          x + 250,
          825,
          37,
          v.pass ? themeColors.green : themeColors.pink,
          'center',
        );
    });
    if (currentBeat === 0 && resultComplete('slice-overall'))
      drawPolicyChapterText(
        ctx,
        api,
        'Overall 3/5 = 60%',
        960,
        950,
        37,
        themeColors.yellow,
        'center',
      );
    if (currentBeat > 0) {
      drawPolicyChapterEquation(
        ctx,
        api,
        String.raw`100k\ge95n,\quad n>0`,
        960,
        945,
        39,
        themeColors.yellow,
      );
      if (resultComplete('slice-block', 1))
        drawPolicyChapterText(ctx, api, 'BLOCK RELEASE', 1560, 945, 35, themeColors.pink, 'center');
    }
    drawPolicyChapterFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'Local count thresholds do not establish population rates; retain paired case/family evidence'
        : 'Every required workflow must be present, nonempty and meet the local count rule',
    );
  });
}
export default {
  id: 'slice-release',
  draw: drawSliceRelease,
  cues: [
    'slice-release-1',
    'slice-counts',
    'slice-overall',
    'rageval-freeze-count',
    'rageval-hotfix-count',
    'rageval-migration-count',
    'slice-release-2',
    'slice-block',
    'slice-release-3',
    'paired-cases',
  ],
};
