import { inputs, reduced } from '../fixtures.mjs';
import { done, sentence } from '../construction.mjs';
import {
  chapterCard,
  chapterEquation,
  chapterGrid,
  chapterHeading,
  chapterNote,
  chapterText,
} from '../defaults.mjs';
export function drawOwnershipContract(ctx, scene, state, api) {
  return api.focus.target(`nc-${scene.id}-mechanism`, () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = (bi, si) => sentence(state, 'ownership-contract', bi, si),
      resultComplete = (bi, si) => done(state, 'ownership-contract', bi, si);
    const ranks = [0, 1, 2, 3],
      rankColors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow];
    {
      chapterHeading(
        ctx,
        api,
        currentBeat === 0
          ? 'Choose which rank receives each result'
          : 'Average the same sum exactly once',
      );
      if (currentBeat === 0) {
        const mode = resultComplete(0, 4)
          ? 'gather'
          : resultComplete(0, 3)
            ? 'scatter'
            : resultComplete(0, 2)
              ? 'broadcast'
              : progress(0, 2) > 0.25
                ? 'reduce'
                : resultComplete(0, 1)
                  ? 'allreduce'
                  : 'inputs';
        ranks.forEach((r) => {
          const y = 360 + r * 140;
          chapterText(ctx, api, 'Rank ' + r, 175, y + 53, 30, rankColors[r]);
          let labels = inputs[r].map(String);
          if (mode === 'allreduce' || mode === 'gather') labels = reduced.map(String);
          if (mode === 'reduce') labels = r === 2 ? reduced.map(String) : ['—', '—', '—', '—'];
          if (mode === 'broadcast') labels = inputs[2].map(String);
          if (mode === 'scatter') labels = reduced.map((v, j) => (j === r ? String(v) : '—'));
          chapterGrid(ctx, api, [labels], 430, y, 1090, 85, rankColors);
        });
        chapterText(
          ctx,
          api,
          {
            inputs: 'Original local inputs',
            allreduce: 'All-reduce · complete sum on every rank',
            reduce: 'Reduce · root R2 retains the sum',
            broadcast: 'Broadcast · copies R2 input',
            scatter: 'Reduce-scatter · rank-index result blocks',
            gather: 'All-gather · copies blocks in rank order',
          }[mode],
          960,
          970,
          31,
          themeColors.green,
          'center',
        );
      } else {
        const avg = resultComplete(1, 1),
          twice = resultComplete(1, 3);
        chapterCard(ctx, api, 'Chunk 2 · sum 3333', 180, 390, 510, 105, themeColors.blue);
        chapterCard(
          ctx,
          api,
          'Four equal rank contributions',
          1120,
          390,
          620,
          105,
          themeColors.cyan,
        );
        chapterEquation(
          ctx,
          api,
          '3333 / 4' + (avg ? ' = 833.25' : ' = ?'),
          960,
          650,
          53,
          avg ? themeColors.green : themeColors.yellow,
        );
        if (twice) {
          chapterEquation(ctx, api, '833.25 / 4 = 208.3125', 960, 855, 46, themeColors.pink);
          chapterText(
            ctx,
            api,
            'Second division changes the requested objective',
            960,
            950,
            31,
            themeColors.pink,
            'center',
          );
        }
      }
      chapterNote(ctx, api, 'Caller chooses the mathematical objective and output ownership');
    }
  });
}
export default {
  id: 'ownership-contract',
  draw: drawOwnershipContract,
  cues: [
    'nc-ownership-contract-b0-s0',
    'nc-ownership-contract-b0-s1',
    'nc-ownership-contract-b0-s2',
    'nc-ownership-contract-b0-s3',
    'nc-ownership-contract-b0-s4',
    'nc-ownership-contract-b0-s5',
    'nc-ownership-contract-b1-s0',
    'nc-ownership-contract-b1-s1',
    'nc-ownership-contract-b1-s2',
    'nc-ownership-contract-b1-s3',
    'nc-ownership-contract-b1-s4',
  ],
};
