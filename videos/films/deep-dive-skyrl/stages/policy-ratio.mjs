import { ppoReceipt } from '../arithmetic.mjs';
import { skyChapterModel } from '../model.mjs';
import {
  drawSkyChapterBox,
  drawSkyChapterFoot,
  drawSkyChapterL,
  drawSkyChapterText,
  drawSkyChapterTitle,
} from '../defaults.mjs';
export function drawPolicyRatio(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress } = skyChapterModel('policy-ratio', state),
    cueProgress = () => api.focus.progress(`sky-${'policy-ratio'}-b${currentBeat}`, progress),
    R = (id) => api.focus.progress('sky-' + id, state.cues ? 0 : progress),
    done = (id) => R(id) >= 1;
  api.focus.target('sky-policy-ratio-mechanism', () => {
    drawSkyChapterTitle(
      ctx,
      api,
      !currentBeat
        ? 'A local policy incentive uses only sampled action terms'
        : 'The same advantage multiplies both candidate ratios',
    );
    const positive = currentBeat < 2 || R('ratio-negative') === 0,
      advantage = positive ? 0.5 : -0.5,
      ratio = currentBeat === 2 ? (positive ? 1.5 : 0.5) : 0.5 + cueProgress(),
      receipt = ppoReceipt(ratio, advantage),
      X = (r) => 220 + r * 480,
      Y = (v) => 680 - v * 220;
    drawSkyChapterL(ctx, api, 210, 680, 1200, 680, themeColors.muted, 3);
    drawSkyChapterL(ctx, api, 220, 390, 220, 930, themeColors.muted, 3);
    if (!currentBeat) {
      drawSkyChapterText(ctx, api, 'action probability', 700, 970, 28, themeColors.muted, 'center');
      drawSkyChapterText(ctx, api, '−A log p', 215, 350, 31, themeColors.cyan);
      for (const [A0, col] of [
        [0.5, themeColors.green],
        [-0.5, themeColors.pink],
      ])
        for (let i = 1; i < Math.floor(cueProgress() * 80); i++) {
          const a = 0.1 + (i - 1) * 0.01,
            z = 0.1 + i * 0.01;
          drawSkyChapterL(
            ctx,
            api,
            X(a * 2),
            Y(-A0 * Math.log(a)),
            X(z * 2),
            Y(-A0 * Math.log(z)),
            col,
            5,
          );
        }
      drawSkyChapterBox(
        ctx,
        api,
        'A = +0.5\nencourage this action locally',
        1280,
        415,
        490,
        155,
        themeColors.green,
        27,
      );
      drawSkyChapterBox(
        ctx,
        api,
        'A = −0.5\ndiscourage this action locally',
        1280,
        695,
        490,
        155,
        themeColors.pink,
        27,
      );
      drawSkyChapterFoot(
        ctx,
        api,
        'Shared parameters and the complete objective can couple those local incentives',
      );
    } else {
      for (const r of [0, 0.5, 0.8, 1, 1.2, 1.5, 2]) {
        drawSkyChapterL(ctx, api, X(r), 930, X(r), 950, themeColors.muted, 2);
        drawSkyChapterText(ctx, api, r.toFixed(1), X(r), 980, 27, themeColors.muted, 'center');
      }
      for (let i = 1; i <= Math.floor(cueProgress() * 80); i++) {
        const a = (i - 1) / 40,
          z = i / 40;
        drawSkyChapterL(
          ctx,
          api,
          X(a),
          Y(a * advantage),
          X(z),
          Y(z * advantage),
          themeColors.blue,
          4,
        );
        drawSkyChapterL(
          ctx,
          api,
          X(a),
          Y(Math.max(0.8, Math.min(1.2, a)) * advantage),
          X(z),
          Y(Math.max(0.8, Math.min(1.2, z)) * advantage),
          themeColors.cyan,
          5,
        );
      }
      drawSkyChapterL(ctx, api, X(0.8), 400, X(0.8), 910, themeColors.yellow, 2);
      drawSkyChapterL(ctx, api, X(1.2), 400, X(1.2), 910, themeColors.yellow, 2);
      drawSkyChapterBox(ctx, api, 'behavior p = 0.2', 1260, 365, 510, 85, themeColors.blue, 32);
      drawSkyChapterBox(
        ctx,
        api,
        'current p = ' + (0.2 * ratio).toFixed(2),
        1260,
        475,
        510,
        85,
        themeColors.cyan,
        32,
      );
      drawSkyChapterBox(
        ctx,
        api,
        'ratio = ' + ratio.toFixed(2) + '; A = ' + advantage.toFixed(1),
        1260,
        585,
        510,
        85,
        themeColors.yellow,
        31,
      );
      const reveal =
        currentBeat === 2
          ? positive
            ? done('ratio-positive')
            : done('ratio-negative')
          : done('ratio-min');
      if (reveal) {
        drawSkyChapterBox(
          ctx,
          api,
          'products ' + receipt.raw.toFixed(2) + ' / ' + receipt.bounded.toFixed(2),
          1260,
          725,
          510,
          90,
          themeColors.cyan,
          30,
        );
        drawSkyChapterBox(
          ctx,
          api,
          'min = ' + receipt.surrogate.toFixed(2),
          1260,
          840,
          510,
          90,
          themeColors.green,
          37,
        );
        api.circle(ctx, X(ratio), Y(receipt.surrogate), 12, themeColors.green);
      } else
        drawSkyChapterBox(
          ctx,
          api,
          'surrogate: pending',
          1260,
          790,
          510,
          100,
          themeColors.muted,
          33,
        );
      drawSkyChapterFoot(
        ctx,
        api,
        'Blue: ratio × A · cyan: clipped ratio × A · choose min before negating',
      );
    }
  });
}
export default {
  id: 'policy-ratio',
  draw: drawPolicyRatio,
  cues: [
    'sky-policy-ratio-b0',
    'sky-policy-ratio-b1',
    'sky-ratio-current',
    'sky-ratio-min',
    'sky-policy-ratio-b2',
    'sky-ratio-positive',
    'sky-ratio-negative',
  ],
};
