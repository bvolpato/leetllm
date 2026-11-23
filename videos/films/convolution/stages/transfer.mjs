import { correlate } from '../arithmetic.mjs';
import { IMAGE, KERNEL } from '../fixtures.mjs';
import { MAP } from '../model.mjs';
import {
  cueProgress,
  equation,
  featureGrid,
  imageGrid,
  kernelGrid,
  text,
  unknownFeatureMap,
} from '../defaults.mjs';
export function drawTransfer(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const stage = (beat, start = 0.08, end = 0.88) =>
    currentBeat < beat ? 0 : currentBeat > beat ? 1 : api.phase(progress, start, end);
  const fade = components.fade;
  ctx.save();
  {
    const reverse = currentBeat === 0 ? 0 : cueProgress(ctx, api, 'reverse-edge', stage(1)),
      im = IMAGE.map((row) => row.map((v) => v + (1 - 2 * v) * reverse)),
      raw = correlate(im, KERNEL);
    api.focus.target('recap-image', () => imageGrid(ctx, api, im, 180, 350, 95));
    text(ctx, api, 'fixed signed kernel', 855, 330, 25, themeColors.muted, 'center');
    kernelGrid(ctx, api, KERNEL, 760, 380, 58);
    if (currentBeat === 0) {
      api.focus.target('signed-response', () => featureGrid(ctx, api, MAP, 1250, 430, 110));
      text(ctx, api, 'current feature map', 1410, 350, 31, themeColors.green, 'center');
      api.focus.target('reversed-prediction', () =>
        components.card({
          label: 'Reversed response: ?',
          x: 1110,
          y: 820,
          width: 640,
          height: 110,
          fontSize: 40,
          fill: themeColors.panel,
          stroke: themeColors.yellow,
          textColor: themeColors.yellow,
        }),
      );
    } else {
      api.focus.target('signed-response', () =>
        featureGrid(
          ctx,
          api,
          currentBeat > 1 || cueProgress(ctx, api, 'reverse-result', 0) === 1
            ? raw
            : unknownFeatureMap(ctx, api),
          1030,
          410,
          95,
        ),
      );
      text(ctx, api, 'signed response', 1170, 330, 31, themeColors.cyan, 'center');
      if (currentBeat === 2) {
        const relu = cueProgress(ctx, api, 'apply-relu', stage(2)),
          count = Math.floor(relu * 9);
        api.focus.target('rectified-response', () =>
          featureGrid(
            ctx,
            api,
            raw.map((row, r) => row.map((v, col) => (r * 3 + col < count ? Math.max(0, v) : '?'))),
            1450,
            410,
            95,
          ),
        );
        text(
          ctx,
          api,
          count === 9 ? 'after ReLU' : 'apply ReLU',
          1590,
          330,
          31,
          themeColors.green,
          'center',
        );
        equation(ctx, api, '\\operatorname{ReLU}(Y)=\\max(0,Y)', 960, 950, 49, themeColors.green);
      }
    }
  }
  ctx.restore();
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: ['reverse-prediction', 'reverse-edge', 'reverse-result', 'apply-relu'],
};
