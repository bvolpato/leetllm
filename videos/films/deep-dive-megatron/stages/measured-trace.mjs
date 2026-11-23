import { newChapterModel } from '../model.mjs';
import {
  chapterArrow,
  chapterFooter,
  chapterLine,
  chapterTag,
  chapterText,
  chapterTitle,
} from '../defaults.mjs';
export function drawMeasuredTrace(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = newChapterModel('measured-trace', state),
    { b: currentBeat } = modelState;
  const cueProgress = () => api.focus.progress('mg-measured-trace-b' + currentBeat, modelState.p),
    R = (id) => api.focus.progress('mg-' + id, state.cues ? 0 : modelState.p),
    done = (id) => R(id) >= 1;
  api.focus.target('mg-measured-trace-mechanism', () => {
    chapterTitle(
      ctx,
      api,
      currentBeat === 0
        ? 'A submission timer can stop before device work'
        : currentBeat === 1
          ? 'Inspect the layer that owns the wait'
          : 'Change only the link placement in the matched workload',
    );
    if (currentBeat < 2) {
      const lanes =
        currentBeat === 0
          ? [
              ['host enqueue', 0, 2, themeColors.yellow],
              ['device work', 0, 10, themeColors.blue],
            ]
          : [
              ['host gap', 0, 2, themeColors.yellow],
              ['GEMM', 2, 6, themeColors.blue],
              ['communication', 4, 10, themeColors.pink],
            ];
      lanes.forEach(([name, start, end, color], i) => {
        chapterText(ctx, api, name, 180, 460 + i * 190, 30, color);
        chapterLine(ctx, api, 500, 440 + i * 190, 1700, 440 + i * 190);
        api.rect(
          ctx,
          500 + start * 100,
          400 + i * 190,
          Math.max(0, Math.min(end - start, cueProgress() * 10 - start)) * 100,
          80,
          color,
        );
      });
      if (currentBeat === 0 && done('completed-work'))
        chapterFooter(
          ctx,
          api,
          'Toy interval: enqueue 2 units; completion 10 units · time the declared boundary',
          themeColors.green,
        );
      else
        chapterFooter(
          ctx,
          api,
          'Systems: stream / launch / gap · Compute: selected kernel · NCCL: operation and byte denominator',
        );
    } else {
      for (let node = 0; node < 2; node++) {
        chapterText(
          ctx,
          api,
          'node ' + node,
          530 + node * 850,
          380,
          32,
          themeColors.blue,
          'center',
        );
        for (let rank = 0; rank < 4; rank++)
          chapterTag(
            ctx,
            api,
            'rank ' + (node * 4 + rank),
            200 + node * 850 + (rank % 2) * 360,
            470 + Math.floor(rank / 2) * 200,
            300,
            themeColors.blue,
          );
      }
      if (done('slow-link')) {
        chapterArrow(ctx, api, 900, 615, 1060, 615, themeColors.pink);
        chapterText(
          ctx,
          api,
          'TP collective crosses slow link',
          960,
          930,
          35,
          themeColors.pink,
          'center',
        );
      }
      chapterFooter(
        ctx,
        api,
        'Pipeline bubbles, context exchange and expert tails point to different blocked edges',
      );
    }
  });
  return true;
}
export default {
  id: 'measured-trace',
  draw: drawMeasuredTrace,
  cues: [
    'mg-measured-trace-b0',
    'mg-completed-work',
    'mg-measured-trace-b1',
    'mg-measured-trace-b2',
    'mg-slow-link',
  ],
};
