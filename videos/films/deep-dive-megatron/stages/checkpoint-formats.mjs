import { newChapterModel } from '../model.mjs';
import {
  chapterArrow,
  chapterFooter,
  chapterGrid,
  chapterTag,
  chapterText,
  chapterTitle,
} from '../defaults.mjs';
export function drawCheckpointFormats(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = newChapterModel('checkpoint-formats', state),
    { b: currentBeat } = modelState;
  const R = (id) => api.focus.progress('mg-' + id, state.cues ? 0 : modelState.p),
    done = (id) => R(id) >= 1;
  api.focus.target('mg-checkpoint-formats-mechanism', () => {
    chapterTitle(
      ctx,
      api,
      currentBeat === 0
        ? 'The format declares which migration it supports'
        : currentBeat === 1
          ? 'Context peers share the pure-data stream identity'
          : 'A save completes after the required pieces arrive',
    );
    if (currentBeat === 0) {
      chapterGrid(
        ctx,
        api,
        [
          ['representation', 'DP reshard', 'TP change'],
          ['buffer based', done('format-dp') ? 'documented' : '?', 'not granted by name'],
          ['parameter shaped', 'documented scope', 'check model / format'],
        ],
        170,
        420,
        1580,
        330,
        themeColors.blue,
        27,
      );
      chapterFooter(
        ctx,
        api,
        'Global tensor layout, optimizer representation and stream state are separate',
      );
    } else if (currentBeat === 1) {
      chapterTag(ctx, api, 'DP rank 2', 180, 390, 390, themeColors.yellow);
      chapterTag(ctx, api, 'CP peer 0', 760, 350, 400, themeColors.blue);
      chapterTag(ctx, api, 'CP peer 1', 1260, 350, 400, themeColors.pink);
      chapterArrow(ctx, api, 960, 450, 780, 650);
      chapterArrow(ctx, api, 1450, 450, 970, 650, themeColors.pink);
      chapterTag(ctx, api, 'data-state/rank-2', 600, 680, 720, themeColors.cyan, 95);
      chapterText(
        ctx,
        api,
        done('missing-cursor')
          ? 'Directory present + file absent → raise'
          : 'Selected rank file: pending check',
        960,
        880,
        32,
        themeColors.pink,
        'center',
      );
      if (done('absent-cursor'))
        chapterFooter(ctx, api, 'Completely absent state root → documented restart from beginning');
    } else {
      const complete = done('save-complete');
      for (let i = 0; i < 4; i++)
        chapterTag(
          ctx,
          api,
          'shard ' + i,
          180 + i * 430,
          450,
          350,
          complete || i < 3 ? themeColors.blue : themeColors.pink,
        );
      chapterText(
        ctx,
        api,
        complete
          ? 'All required pieces + metadata complete'
          : 'Save requested · one required piece pending',
        960,
        750,
        38,
        complete ? themeColors.green : themeColors.yellow,
        'center',
      );
      chapterFooter(
        ctx,
        api,
        'Check file integrity, verify the new layout and restore the saved training state',
      );
    }
  });
  return true;
}
export default {
  id: 'checkpoint-formats',
  draw: drawCheckpointFormats,
  cues: [
    'mg-checkpoint-formats-b0',
    'mg-format-dp',
    'mg-checkpoint-formats-b1',
    'mg-missing-cursor',
    'mg-absent-cursor',
    'mg-checkpoint-formats-b2',
    'mg-save-complete',
  ],
};
