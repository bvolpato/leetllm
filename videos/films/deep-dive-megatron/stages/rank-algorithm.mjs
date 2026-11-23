import { group, newChapterModel } from '../model.mjs';
import {
  chapterEquation,
  chapterFooter,
  chapterGrid,
  chapterText,
  chapterTitle,
  chapterVector,
} from '../defaults.mjs';
export function drawRankAlgorithm(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = newChapterModel('rank-algorithm', state),
    { b: currentBeat } = modelState;
  const cueProgress = () => api.focus.progress('mg-rank-algorithm-b' + currentBeat, modelState.p),
    R = (id) => api.focus.progress('mg-' + id, state.cues ? 0 : modelState.p),
    done = (id) => R(id) >= 1;
  api.focus.target('mg-rank-algorithm-mechanism', () => {
    chapterTitle(
      ctx,
      api,
      currentBeat
        ? 'Vary only the selected group coordinate'
        : 'Decode rank 27 by quotient and remainder',
    );
    if (!currentBeat) {
      const rows = [
          ['TP', '27 mod 4', '3', '27 // 4 = 6'],
          ['CP', '6 mod 2', '0', '6 // 2 = 3'],
          ['DP', '3 mod 4', '3', '3 // 4 = 0'],
          ['PP', '0 mod 2', '0', '0 // 2 = 0'],
        ],
        n = Math.min(4, Math.floor(cueProgress() * 4.8));
      chapterGrid(
        ctx,
        api,
        [
          ['axis', 'remainder', 'coordinate', 'next quotient'],
          ...rows.map((r, i) => r.map((v, j) => (i < n || j === 0 ? v : '…'))),
        ],
        200,
        365,
        1520,
        450,
        themeColors.blue,
        29,
      );
      if (done('rank-rebuild')) chapterEquation(ctx, api, '3+4(0)+8(3)+32(0)=27', 960, 940, 44);
    } else {
      const sets = [
        ['Tensor', group(27, 'tp'), 'rank-tp-group'],
        ['Data', group(27, 'dp'), 'rank-dp-group'],
        ['Pipeline', group(27, 'pp'), 'rank-pp-group'],
      ];
      sets.forEach(([name, values, cue], i) => {
        chapterText(ctx, api, name, 200, 435 + i * 180, 32, themeColors.yellow);
        chapterVector(
          ctx,
          api,
          done(cue) ? values : values.map(() => '?'),
          500,
          385 + i * 180,
          1180,
          [themeColors.blue, themeColors.cyan, themeColors.pink][i],
        );
      });
      chapterFooter(
        ctx,
        api,
        'World divisibility and valid shapes are checked before a group becomes usable',
      );
    }
  });
  return true;
}
export default {
  id: 'rank-algorithm',
  draw: drawRankAlgorithm,
  cues: [
    'mg-rank-algorithm-b0',
    'mg-rank-rebuild',
    'mg-rank-algorithm-b1',
    'mg-rank-tp-group',
    'mg-rank-dp-group',
    'mg-rank-pp-group',
  ],
};
