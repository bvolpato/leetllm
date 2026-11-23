import { skyChapterModel } from '../model.mjs';
import {
  drawSkyChapterBox,
  drawSkyChapterFoot,
  drawSkyChapterTable,
  drawSkyChapterText,
  drawSkyChapterTitle,
} from '../defaults.mjs';
export function drawEpochExhaustion(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress } = skyChapterModel('epoch-exhaustion', state),
    R = (id) => api.focus.progress('sky-' + id, state.cues ? 0 : progress),
    done = (id) => R(id) >= 1;
  api.focus.target('sky-epoch-exhaustion-mechanism', () => {
    drawSkyChapterTitle(
      ctx,
      api,
      !currentBeat
        ? 'A partial useful mini-batch is not an optimizer update'
        : 'Finished IDs and in-flight work have different resume meanings',
    );
    if (!currentBeat) {
      drawSkyChapterBox(
        ctx,
        api,
        'Mini-batch requires 2 groups',
        480,
        370,
        960,
        105,
        themeColors.yellow,
        38,
      );
      drawSkyChapterBox(
        ctx,
        api,
        'query-42',
        420,
        610,
        440,
        110,
        done('partial-discard') ? themeColors.muted : themeColors.blue,
        37,
      );
      drawSkyChapterBox(ctx, api, 'no remaining prompt', 1050, 610, 500, 110, themeColors.pink, 31);
      drawSkyChapterText(
        ctx,
        api,
        done('partial-discard')
          ? 'Discard remainder · optimizer updates unchanged'
          : '1 useful group / 2 required',
        960,
        925,
        37,
        done('partial-discard') ? themeColors.pink : themeColors.yellow,
        'center',
      );
    } else {
      const drained = done('epoch-drain');
      drawSkyChapterTable(
        ctx,
        api,
        [
          ['identity', 'finished ledger', 'running'],
          ['trained Q40', 'saved', 'no'],
          ['filtered Q41', 'saved', 'no'],
          ['remainder Q42', done('resume-ids') ? 'saved, skip on resume' : 'pending', 'no'],
          ['Q43', 'not finished', drained ? '0' : '1'],
        ],
        230,
        365,
        1460,
        440,
        30,
      );
      drawSkyChapterText(
        ctx,
        api,
        drained
          ? 'Drain completed; submitted = accepted + filtered'
          : 'Do not persist in-flight work as a completed training row',
        960,
        940,
        31,
        drained ? themeColors.green : themeColors.yellow,
        'center',
      );
    }
    drawSkyChapterFoot(
      ctx,
      api,
      'The nominal update count is an upper bound under this selected filtering path',
    );
  });
}
export default {
  id: 'epoch-exhaustion',
  draw: drawEpochExhaustion,
  cues: [
    'sky-epoch-exhaustion-b0',
    'sky-partial-discard',
    'sky-epoch-exhaustion-b1',
    'sky-resume-ids',
    'sky-epoch-drain',
  ],
};
