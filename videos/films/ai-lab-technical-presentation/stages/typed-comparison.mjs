import { pairedEvidence } from '../arithmetic.mjs';
import { cueDone } from '../construction.mjs';
import { chapterText, focusTargets, footer, sheet } from '../defaults.mjs';
export function drawTypedComparison(ctx, scene, state, api) {
  const { C: theme } = api,
    themeColors = {
      ...theme,
      purple: '#b7a2f7',
    },
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    const ids = ['A', 'B'],
      baseline = {
        A: true,
        B: false,
      },
      candidate =
        currentBeat === 1 && cueDone(state, 'typed-reject', 1, 0.3)
          ? {
              A: 1,
              B: false,
            }
          : {
              B: false,
              A: true,
            };
    sheet(ctx, api, 170, 340, 670, 480, 'Baseline', themeColors.blue);
    sheet(
      ctx,
      api,
      1080,
      340,
      670,
      480,
      currentBeat === 1 && cueDone(state, 'typed-reject', 1, 0.3)
        ? 'Candidate · numeric type error'
        : 'Candidate · reversed iteration order',
      themeColors.purple,
    );
    chapterText(ctx, api, 'A : true', 230, 500, 36, themeColors.blue);
    chapterText(ctx, api, 'B : false', 230, 670, 36, themeColors.blue);
    focusTargets(ctx, api, ['typed-order', 'typed-reject'], () => {
      Object.entries(candidate).forEach(([id, value], i) =>
        chapterText(
          ctx,
          api,
          `${id} : ${String(value)}${typeof value === 'number' ? '  (number)' : ''}`,
          1140,
          500 + i * 170,
          36,
          typeof value === 'number' ? themeColors.pink : themeColors.purple,
        ),
      );
      if (currentBeat === 0)
        ids.forEach((id, i) => {
          const end = Object.keys(candidate).indexOf(id);
          api.line(ctx, 860, 485 + i * 170, 1060, 485 + end * 170, themeColors.cyan, 3);
        });
    });
    focusTargets(ctx, api, ['typed-conservation'], () => {
      let result;
      try {
        result = pairedEvidence(baseline, candidate);
      } catch {}
      chapterText(
        ctx,
        api,
        result
          ? `Same IDs · literal Booleans · ${Object.values(result.counts).reduce((a, v) => a + v, 0)} rows accounted for`
          : 'REJECT · numeric 1 is not a Boolean hit',
        960,
        910,
        34,
        result ? themeColors.green : themeColors.pink,
        'center',
      );
    });
    footer(
      ctx,
      api,
      currentBeat === 2
        ? 'Executed arithmetic and typed input contracts · empirical label quality remains unverified'
        : 'Join by the owned query ID · equal row counts alone do not establish identity',
    );
  }
}
export default {
  id: 'typed-comparison',
  draw: drawTypedComparison,
  cues: ['typed-order', 'typed-reject', 'typed-conservation'],
};
