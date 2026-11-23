import { skyChapterModel } from '../model.mjs';
import {
  drawSkyChapterBox,
  drawSkyChapterFoot,
  drawSkyChapterRow,
  drawSkyChapterTable,
  drawSkyChapterText,
  drawSkyChapterTitle,
} from '../defaults.mjs';
export function drawSourceDiagnosis(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress } = skyChapterModel('source-diagnosis', state),
    cueProgress = () => api.focus.progress(`sky-${'source-diagnosis'}-b${currentBeat}`, progress),
    R = (id) => api.focus.progress('sky-' + id, state.cues ? 0 : progress),
    done = (id) => R(id) >= 1;
  api.focus.target('sky-source-diagnosis-mechanism', () => {
    drawSkyChapterTitle(
      ctx,
      api,
      !currentBeat
        ? 'Keep the failing boundary attached to its evidence'
        : currentBeat === 1
          ? 'Introduce one new seam while preserving the reference'
          : 'Choose coordination for a research boundary you actually need',
    );
    if (!currentBeat) {
      const fixed = done('alignment-failure');
      drawSkyChapterTable(
        ctx,
        api,
        [
          ['retained query-42 evidence', 'failed boundary'],
          ['unknown SQL column', 'environment'],
          [
            'observation mask ' + (fixed ? '0' : '1'),
            fixed ? 'direct objective repaired' : 'alignment',
          ],
          ['sampler11; target12', 'control'],
          ['accepted + running = limit', 'admission'],
          ['name accepted; missing tensors', 'API / backend'],
        ],
        210,
        350,
        1500,
        500,
        29,
      );
    } else if (currentBeat === 1) {
      const n = Math.min(3, Math.floor(cueProgress() * 4)),
        stages = ['sync local environment', 'custom generator', 'bounded overlap'];
      stages.forEach((v, i) =>
        drawSkyChapterBox(
          ctx,
          api,
          v,
          175 + i * 550,
          405,
          480,
          110,
          i <= n ? themeColors.blue : themeColors.muted,
          30,
        ),
      );
      drawSkyChapterRow(ctx, api, ['frozen reward', 'same masks', 'held-out slice'], 660, {
        x: 210,
        width: 1500,
        color: themeColors.cyan,
      });
      drawSkyChapterText(
        ctx,
        api,
        'Measure useful outcomes, tool errors, queue age, inference and synchronization',
        960,
        930,
        30,
        themeColors.yellow,
        'center',
      );
    } else {
      drawSkyChapterBox(
        ctx,
        api,
        'Static supervised rows',
        180,
        410,
        690,
        115,
        themeColors.blue,
        37,
      );
      drawSkyChapterBox(
        ctx,
        api,
        'Tool-using changing policy',
        1040,
        410,
        700,
        115,
        themeColors.cyan,
        33,
      );
      drawSkyChapterRow(ctx, api, ['fixed labels', 'one fit loop'], 700, {
        x: 170,
        width: 720,
        color: themeColors.blue,
        size: 31,
      });
      drawSkyChapterRow(ctx, api, ['environment', 'sampling', 'control'], 700, {
        x: 1030,
        width: 720,
        color: themeColors.cyan,
        size: 27,
      });
    }
    drawSkyChapterFoot(ctx, api, 'Different failure evidence calls for a different intervention');
  });
}
export default {
  id: 'source-diagnosis',
  draw: drawSourceDiagnosis,
  cues: [
    'sky-source-diagnosis-b0',
    'sky-alignment-failure',
    'sky-source-diagnosis-b1',
    'sky-source-diagnosis-b2',
  ],
};
