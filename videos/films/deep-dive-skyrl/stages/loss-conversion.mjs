import { criticPairGate, normalizedClip } from '../arithmetic.mjs';
import { skyChapterModel } from '../model.mjs';
import {
  drawSkyChapterArrow,
  drawSkyChapterBox,
  drawSkyChapterRow,
  drawSkyChapterTable,
  drawSkyChapterText,
  drawSkyChapterTitle,
} from '../defaults.mjs';
export function drawLossConversion(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress } = skyChapterModel('loss-conversion', state),
    R = (id) => api.focus.progress('sky-' + id, state.cues ? 0 : progress),
    done = (id) => R(id) >= 1;
  api.focus.target('sky-loss-conversion-mechanism', () => {
    drawSkyChapterTitle(
      ctx,
      api,
      !currentBeat
        ? 'Follow the actual batch fields through the pinned converter'
        : currentBeat === 1
          ? 'Accepted name, implemented branch and validated recipe differ'
          : 'Values and returns must form an aligned critic pair',
    );
    if (!currentBeat) {
      const fields = done('converted-fields'),
        eps = normalizedClip(0.8, 1.2);
      drawSkyChapterTable(
        ctx,
        api,
        [
          ['retained response row', 'weights', 'advantages', 'sampling logprobs'],
          [
            'query-42 / 0',
            '[1,1]',
            fields ? '[.5,−.5]' : 'pending',
            fields ? '[−.2,−.4]' : 'pending',
          ],
        ],
        170,
        375,
        1580,
        230,
        29,
      );
      drawSkyChapterBox(
        ctx,
        api,
        'public PPO clip thresholds\nlow .8 · high 1.2',
        250,
        720,
        620,
        135,
        themeColors.blue,
        31,
      );
      drawSkyChapterArrow(ctx, api, 900, 785, 1010, 785);
      drawSkyChapterBox(
        ctx,
        api,
        done('converted-epsilon')
          ? 'backend epsilons\nlow ' +
              eps.eps_clip_low.toFixed(1) +
              ' · high ' +
              eps.eps_clip_high.toFixed(1)
          : 'backend settings pending',
        1050,
        720,
        620,
        135,
        done('converted-epsilon') ? themeColors.green : themeColors.muted,
        31,
      );
    } else if (currentBeat === 1) {
      drawSkyChapterTable(
        ctx,
        api,
        [
          ['loss name', 'API acceptance', 'backend branch', 'end-to-end receipt'],
          ['cross entropy', 'named', 'implemented', 'separate evidence'],
          ['importance sampling', 'named', 'implemented', 'separate evidence'],
          ['PPO / CISPO', 'inspect selected API', 'JAX branches', 'separate evidence'],
        ],
        170,
        380,
        1580,
        400,
        29,
      );
      drawSkyChapterText(
        ctx,
        api,
        'Inspect converted tensors and the chosen implementation',
        960,
        935,
        34,
        themeColors.yellow,
        'center',
      );
    } else {
      const repaired = done('critic-repair'),
        rejected = done('critic-missing'),
        values = [0.2, 0.4],
        returns = repaired ? [0.7, 0.1] : null;
      drawSkyChapterRow(ctx, api, ['position 0', 'position 1'], 370, {
        x: 480,
        width: 1170,
        color: themeColors.muted,
      });
      drawSkyChapterText(ctx, api, 'response weights', 150, 545, 27, themeColors.blue);
      drawSkyChapterRow(ctx, api, [1, 1], 490, {
        x: 480,
        width: 1170,
      });
      drawSkyChapterText(ctx, api, 'critic values', 150, 675, 28, themeColors.cyan);
      drawSkyChapterRow(ctx, api, values, 620, {
        x: 480,
        width: 1170,
        color: themeColors.cyan,
      });
      drawSkyChapterText(ctx, api, 'critic returns', 150, 805, 28, themeColors.yellow);
      drawSkyChapterRow(ctx, api, returns ?? ['MISSING', 'MISSING'], 750, {
        x: 480,
        width: 1170,
        color: repaired ? themeColors.green : rejected ? themeColors.pink : themeColors.muted,
        size: 31,
      });
      if (rejected || repaired)
        drawSkyChapterText(
          ctx,
          api,
          criticPairGate(values, returns, [1, 1])
            ? 'PAIR / LENGTH GATE PASSES'
            : 'REJECT: values without returns',
          960,
          945,
          37,
          repaired ? themeColors.green : themeColors.pink,
          'center',
        );
    }
  });
}
export default {
  id: 'loss-conversion',
  draw: drawLossConversion,
  cues: [
    'sky-loss-conversion-b0',
    'sky-converted-fields',
    'sky-converted-epsilon',
    'sky-loss-conversion-b1',
    'sky-loss-conversion-b2',
    'sky-critic-missing',
    'sky-critic-repair',
  ],
};
