import { newChapterModel } from '../model.mjs';
import {
  chapterArrow,
  chapterFooter,
  chapterGrid,
  chapterText,
  chapterTitle,
  chapterVector,
} from '../defaults.mjs';
export function drawStoredShapes(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = newChapterModel('stored-shapes', state),
    { b: currentBeat } = modelState;
  const cueProgress = () => api.focus.progress('mg-stored-shapes-b' + currentBeat, modelState.p),
    R = (id) => api.focus.progress('mg-' + id, state.cues ? 0 : modelState.p),
    done = (id) => R(id) >= 1;
  api.focus.target('mg-stored-shapes-mechanism', () => {
    chapterTitle(
      ctx,
      api,
      currentBeat
        ? 'Four computed partial vectors reconstruct the same output'
        : 'Mathematical columns become stored output-feature rows',
    );
    if (!currentBeat) {
      chapterGrid(
        ctx,
        api,
        Array.from(
          {
            length: 8,
          },
          (_, i) =>
            Array.from(
              {
                length: 16,
              },
              (_, j) => (j < Math.floor(cueProgress() * 17) ? 'S' + Math.floor(j / 4) : '·'),
            ),
        ),
        160,
        400,
        840,
        420,
        themeColors.blue,
        22,
      );
      chapterText(
        ctx,
        api,
        'Up [8,16] · 4 channel groups',
        580,
        895,
        29,
        themeColors.blue,
        'center',
      );
      chapterArrow(ctx, api, 1040, 620, 1180, 620);
      chapterGrid(
        ctx,
        api,
        Array.from(
          {
            length: 4,
          },
          (_, i) =>
            Array.from(
              {
                length: 8,
              },
              () => (done('storage-transpose') ? `c${i}` : '·'),
            ),
        ),
        1230,
        410,
        500,
        200,
        themeColors.cyan,
        23,
      );
      chapterText(ctx, api, 'shard 0: stored up [4,8]', 1480, 675, 26, themeColors.cyan, 'center');
      chapterGrid(
        ctx,
        api,
        Array.from(
          {
            length: 8,
          },
          () =>
            Array.from(
              {
                length: 4,
              },
              (_, j) => (done('storage-transpose') ? 'c' + j : '·'),
            ),
        ),
        1230,
        730,
        500,
        200,
        themeColors.pink,
        19,
      );
      chapterText(ctx, api, 'stored down [8,4]', 1480, 980, 26, themeColors.pink, 'center');
    } else {
      const m = modelState.mlp,
        n = Math.floor(cueProgress() * 4.99);
      m.partials.forEach((r, i) => {
        chapterText(
          ctx,
          api,
          'shard ' + i,
          140,
          425 + i * 105,
          27,
          [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][i],
        );
        chapterVector(
          ctx,
          api,
          r.map((v) => (i < n ? v.toFixed(3) : '…')),
          390,
          380 + i * 105,
          1350,
          [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][i],
        );
      });
      if (done('stored-output-match')) {
        chapterVector(
          ctx,
          api,
          m.output.map((v) => v.toFixed(4)),
          390,
          860,
          1350,
          themeColors.green,
        );
        chapterText(ctx, api, 'Σ shards', 140, 910, 28, themeColors.green);
        chapterFooter(
          ctx,
          api,
          'Actual CPU tanh-GeLU reference · max |difference| < 10⁻¹² · no fused GPU claim',
        );
      }
    }
  });
  return true;
}
export default {
  id: 'stored-shapes',
  draw: drawStoredShapes,
  cues: [
    'mg-stored-shapes-b0',
    'mg-storage-transpose',
    'mg-stored-shapes-b1',
    'mg-stored-output-match',
  ],
};
