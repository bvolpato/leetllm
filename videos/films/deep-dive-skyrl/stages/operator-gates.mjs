import { skyChapterModel } from '../model.mjs';
import {
  drawSkyChapterBox,
  drawSkyChapterFoot,
  drawSkyChapterTable,
  drawSkyChapterText,
  drawSkyChapterTitle,
} from '../defaults.mjs';
export function drawOperatorGates(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress } = skyChapterModel('operator-gates', state),
    cueProgress = () => api.focus.progress(`sky-${'operator-gates'}-b${currentBeat}`, progress),
    R = (id) => api.focus.progress('sky-' + id, state.cues ? 0 : progress),
    done = (id) => R(id) >= 1;
  api.focus.target('sky-operator-gates-mechanism', () => {
    drawSkyChapterTitle(
      ctx,
      api,
      !currentBeat
        ? 'Build one run packet from four distinct evidence gates'
        : 'Join every required field to the same trajectory and environment',
    );
    if (!currentBeat) {
      const n = Math.min(4, Math.floor(cueProgress() * 5)),
        names = ['reward trace', 'weight ownership', 'async budget', 'restore + held-out'];
      names.forEach((v, i) => {
        drawSkyChapterBox(
          ctx,
          api,
          v,
          170 + i * 440,
          390,
          380,
          105,
          i < n ? themeColors.cyan : themeColors.muted,
          30,
        );
        drawSkyChapterBox(
          ctx,
          api,
          i < n ? 'receipt attached' : 'pending',
          170 + i * 440,
          655,
          380,
          100,
          i < n ? themeColors.green : themeColors.muted,
          29,
        );
      });
      drawSkyChapterText(
        ctx,
        api,
        'query-42 / sample 0 · environment revision E3',
        960,
        925,
        34,
        themeColors.yellow,
        'center',
      );
    } else {
      drawSkyChapterTable(
        ctx,
        api,
        [
          ['same trajectory packet', 'record'],
          ['IDs / masks / rewards / stop', 'query-42 / sample 0'],
          ['schedule / consumption / behavior', 'historical action evidence'],
          ['environment / tokenizer / config', 'revision-bound'],
          [
            'sampler0 / sampler1 / sampler2',
            done('missing-sampler') ? '19 / 19 / MISSING' : 'receipts pending',
          ],
        ],
        170,
        360,
        1580,
        440,
        29,
      );
      if (done('missing-sampler'))
        drawSkyChapterText(
          ctx,
          api,
          'Hold admission: the absent sampler receipt remains absent',
          960,
          940,
          34,
          themeColors.pink,
          'center',
        );
    }
    drawSkyChapterFoot(
      ctx,
      api,
      'A reward graph or a local counter cannot replace missing ownership or completion evidence',
    );
  });
}
export default {
  id: 'operator-gates',
  draw: drawOperatorGates,
  cues: ['sky-operator-gates-b0', 'sky-operator-gates-b1', 'sky-missing-sampler'],
};
