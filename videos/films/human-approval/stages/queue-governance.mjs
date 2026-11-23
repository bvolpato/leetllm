import { reviewExercise } from '../construction.mjs';
import {
  approvalProgress,
  contractRectangle,
  contractTag,
  contractText,
} from '../defaults.mjs';
export function drawQueueGovernance(ctx, scene, state, api) {
  const { C: themeColors } = api,
    rawBeat = state.beat ?? 0,
    currentBeat = rawBeat,
    resultComplete = (id) => approvalProgress(ctx, api, id) === 1;
  api.focus.target('queue-governance-mechanism', () => {
    if (currentBeat === 0) {
      const e = reviewExercise();
      const automaticReads = 4;
      const corrections = e.decisions.filter((p) => ['reject', 'edit'].includes(p.decision));
      const clean = e.decisions.filter((p) => !p.seeded);
      contractText(
        ctx,
        api,
        'Four automatic reads and six review tasks',
        960,
        285,
        35,
        themeColors.yellow,
      );
      [
        [
          'Completed without review / all tasks',
          'queue-cohort',
          automaticReads + ' / ' + (automaticReads + e.rows.length),
        ],
        [
          'Rejected or edited / reviewed packets',
          'queue-correction',
          corrections.length + ' / ' + e.reviewed.length,
        ],
        [
          'False alarms / clean packets decided',
          'queue-defects',
          clean.filter((p) => p.decision === 'reject').length + ' / ' + clean.length,
        ],
      ].forEach(([v, cue, value], i) => {
        const y = 430 + i * 200;
        contractTag(
          ctx,
          api,
          v,
          780,
          y,
          [themeColors.cyan, themeColors.yellow, themeColors.pink][i],
          1300,
        );
        if (resultComplete(cue))
          contractText(
            ctx,
            api,
            value,
            1630,
            y + 12,
            29,
            [themeColors.cyan, themeColors.yellow, themeColors.pink][i],
          );
      });
    } else if (currentBeat === 1) {
      contractText(ctx, api, 'Age of seven pending requests', 960, 285, 35, themeColors.muted);
      const ages = [2, 3, 4, 5, 6, 7, 60];
      ages.forEach((v, i) => {
        const x = 280 + i * 225;
        contractRectangle(
          ctx,
          api,
          x,
          800 - v * 6,
          110,
          v * 6,
          i === 6 && approvalProgress(ctx, api, 'queue-tail') ? themeColors.pink : themeColors.blue,
        );
        contractText(
          ctx,
          api,
          v + ' min',
          x + 55,
          860,
          28,
          i === 6 ? themeColors.pink : themeColors.muted,
        );
      });
      contractText(
        ctx,
        api,
        'Median: ' + ages[Math.floor(ages.length / 2)] + ' min',
        960,
        417,
        36,
        themeColors.yellow,
      );
      if (resultComplete('queue-floor'))
        contractText(
          ctx,
          api,
          'Triage can move a packet up the queue. This promotion still needs review.',
          960,
          955,
          34,
          themeColors.yellow,
        );
    } else {
      contractText(
        ctx,
        api,
        'Responsibilities need implementation evidence',
        960,
        290,
        37,
        themeColors.yellow,
      );
      contractTag(ctx, api, 'NIST AI RMF 1.0 · voluntary', 960, 455, themeColors.blue, 1450);
      contractTag(
        ctx,
        api,
        'Article 14 · applicable high-risk systems',
        960,
        635,
        themeColors.cyan,
        1450,
      );
      if (resultComplete('queue-governance'))
        contractTag(
          ctx,
          api,
          'who · which version · effect · actual result',
          960,
          830,
          themeColors.green,
          1450,
        );
    }
  });
  return;
}
export default {
  id: 'queue-governance',
  draw: drawQueueGovernance,
  cues: [
    'queue-cohort',
    'queue-correction',
    'queue-defects',
    'queue-tail',
    'queue-floor',
    'queue-governance',
  ],
};
