import { skyChapterModel } from '../model.mjs';
import {
  drawSkyChapterBox,
  drawSkyChapterFoot,
  drawSkyChapterTable,
  drawSkyChapterText,
  drawSkyChapterTitle,
} from '../defaults.mjs';
export function drawConfigContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress } = skyChapterModel('config-contract', state),
    R = (id) => api.focus.progress('sky-' + id, state.cues ? 0 : progress),
    done = (id) => R(id) >= 1;
  api.focus.target('sky-config-contract-mechanism', () => {
    drawSkyChapterTitle(
      ctx,
      api,
      !currentBeat
        ? 'Repair the exact conflicting configuration field'
        : currentBeat === 1
          ? 'Count workers and preserve the rollout loss anchor'
          : 'A chat response does not establish the control contract',
    );
    if (!currentBeat) {
      const nullOk = done('config-null'),
        filterOk = done('config-filter');
      drawSkyChapterTable(
        ctx,
        api,
        [
          ['field', 'supplied value', 'contract'],
          ['train batch / policy mini', '2 / 2', 'equal'],
          ['batched generation / colocate', 'false / false', 'disabled'],
          [
            'dynamic sampling',
            nullOk ? 'null' : '"none"',
            nullOk ? 'correct type' : 'wrong string',
          ],
          [
            'sample-full / zero filter',
            'true / ' + filterOk,
            filterOk ? 'compatible' : 'filter missing',
          ],
        ],
        190,
        355,
        1540,
        465,
        28,
      );
      drawSkyChapterText(
        ctx,
        api,
        nullOk && filterOk
          ? 'Selected fields satisfy this pinned configuration screen'
          : 'Only the conflicting field changes at each repair',
        960,
        930,
        32,
        nullOk && filterOk ? themeColors.green : themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      const workers = done('worker-bounds') ? 4 : 5,
        anchor = done('rollout-anchor') ? 'rollout' : 'current';
      drawSkyChapterBox(ctx, api, 'B=2 · S=1', 220, 385, 620, 95, themeColors.yellow, 36);
      drawSkyChapterBox(
        ctx,
        api,
        'workers ' + workers + '; required [2,4]',
        220,
        585,
        620,
        110,
        workers <= 4 ? themeColors.green : themeColors.pink,
        31,
      );
      drawSkyChapterBox(
        ctx,
        api,
        'CISPO sampling anchor',
        1040,
        385,
        680,
        95,
        themeColors.cyan,
        32,
      );
      drawSkyChapterBox(
        ctx,
        api,
        anchor,
        1040,
        585,
        680,
        110,
        anchor === 'rollout' ? themeColors.green : themeColors.pink,
        40,
      );
      drawSkyChapterText(
        ctx,
        api,
        'Admission range and objective provenance are independent checks',
        960,
        930,
        32,
        themeColors.yellow,
        'center',
      );
    } else {
      drawSkyChapterBox(ctx, api, 'chat completion', 240, 405, 600, 100, themeColors.green, 38);
      drawSkyChapterBox(ctx, api, 'HTTP 200', 240, 650, 600, 100, themeColors.green, 39);
      drawSkyChapterBox(
        ctx,
        api,
        'pause / continue / update',
        1040,
        405,
        680,
        100,
        themeColors.yellow,
        31,
      );
      drawSkyChapterBox(
        ctx,
        api,
        done('http-insufficient') ? 'NO RECEIPT' : 'pending',
        1040,
        650,
        680,
        100,
        done('http-insufficient') ? themeColors.pink : themeColors.muted,
        37,
      );
      drawSkyChapterText(
        ctx,
        api,
        'Match the actual historical client and server control capability',
        960,
        930,
        32,
        themeColors.cyan,
        'center',
      );
    }
    drawSkyChapterFoot(
      ctx,
      api,
      'A pinned configuration check is separate from a running Ray or inference service',
    );
  });
}
export default {
  id: 'config-contract',
  draw: drawConfigContract,
  cues: [
    'sky-config-contract-b0',
    'sky-config-null',
    'sky-config-filter',
    'sky-config-contract-b1',
    'sky-worker-bounds',
    'sky-rollout-anchor',
    'sky-config-contract-b2',
    'sky-http-insufficient',
  ],
};
