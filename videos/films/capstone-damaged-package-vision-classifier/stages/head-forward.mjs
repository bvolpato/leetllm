import { visionSigmoid } from '../arithmetic.mjs';
import { visionFrame } from '../model.mjs';
import {
  visionArrow,
  visionCard,
  visionLine,
  visionNote,
  visionText,
  visionValue,
} from '../defaults.mjs';
export function drawHeadForward(ctx, scene, state, api) {
  const frameState = visionFrame('head-forward', state);
  return api.focus.target('dv-head-forward-mechanism', () => {
    const { C: themeColors } = api;
    const currentBeat = frameState.beat,
      resultComplete = frameState.after,
      h = frameState.head;
    {
      visionText(ctx, api, 'Supplied features', 190, 315, 29, themeColors.blue);
      visionText(ctx, api, 'Trainable weights', 720, 315, 29, themeColors.yellow);
      h.features.forEach((v, i) => {
        const a = visionCard(
            ctx,
            api,
            v.toFixed(2),
            190,
            380 + i * 160,
            260,
            100,
            themeColors.blue,
          ),
          z = visionCard(
            ctx,
            api,
            '× ' + h.weights[i].toFixed(2),
            720,
            380 + i * 160,
            260,
            100,
            themeColors.yellow,
          );
        visionArrow(ctx, api, a, z);
        if (resultComplete('head-logit', 0))
          visionText(
            ctx,
            api,
            '= ' + h.products[i].toFixed(2),
            1120,
            442 + i * 160,
            37,
            themeColors.ink,
          );
      });
      visionValue(ctx, api, 'Bias', h.bias.toFixed(2), 1440, 380, true, themeColors.yellow);
      visionValue(
        ctx,
        api,
        'Logit z',
        h.logit.toFixed(2),
        1440,
        590,
        resultComplete('head-logit', 0),
        themeColors.cyan,
      );
      if (currentBeat === 1) {
        const plot = api.teaching.axes({
          x: 210,
          y: 790,
          width: 620,
          height: 130,
          xDomain: [-4, 4],
          yDomain: [0, 1],
          xTicks: [-4, 0, 4],
          yTicks: [0, 1],
          fontSize: 24,
        });
        let prior;
        for (let i = 0; i <= 60; i++) {
          const z = -4 + (i * 8) / 60,
            at = plot.point(z, visionSigmoid(z));
          if (prior) visionLine(ctx, api, prior.x, prior.y, at.x, at.y, themeColors.cyan, 3);
          prior = at;
        }
        if (resultComplete('head-probability', 1)) {
          const at = plot.point(h.logit, h.probability);
          api.circle(ctx, at.x, at.y, 9, themeColors.yellow);
        }
        visionValue(
          ctx,
          api,
          'Sigmoid probability',
          h.probability.toFixed(4),
          940,
          800,
          resultComplete('head-probability', 1),
          themeColors.cyan,
        );
        visionValue(
          ctx,
          api,
          'BCE · target 1',
          h.loss.toFixed(4),
          1460,
          800,
          resultComplete('head-loss', 1),
          themeColors.pink,
        );
      } else
        visionText(
          ctx,
          api,
          currentBeat === 2
            ? 'Frozen features stay fixed; fine-tuning also changes the encoder'
            : 'Coordinate products + bias → one logit',
          960,
          880,
          33,
          themeColors.ink,
          'center',
        );
      visionNote(
        ctx,
        api,
        'Separate two-feature arithmetic toy. No image encoder runs in this calculation.',
      );
    }
  });
}
export default {
  id: 'head-forward',
  draw: drawHeadForward,
  cues: [
    'dv-head-forward-0',
    'dv-head-forward-operation-0',
    'dv-head-logit',
    'dv-head-forward-1',
    'dv-head-forward-operation-1',
    'dv-head-probability',
    'dv-head-loss',
    'dv-head-forward-2',
    'dv-head-forward-operation-2',
  ],
};
