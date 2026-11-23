import { IMAGE, KERNEL } from '../fixtures.mjs';
import { patchSnapshot } from '../construction.mjs';
import { MAP } from '../model.mjs';
import {
  cellOutline,
  cueProgress,
  equation,
  featureGrid,
  formatValue,
  imageGrid,
  kernelGrid,
  sharedKernel,
  text,
  unknownFeatureMap,
} from '../defaults.mjs';
export function drawPatch(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  const stage = (beat, start = 0.08, end = 0.88) =>
    currentBeat < beat ? 0 : currentBeat > beat ? 1 : api.phase(progress2, start, end);
  const fade = components.fade;
  ctx.save();
  {
    if (currentBeat === 0) {
      const progress = cueProgress(ctx, api, 'patch-accumulate', stage(0)),
        current = patchSnapshot(0, progress);
      const source = api.focus.target('selected-patch', () =>
        imageGrid(ctx, api, IMAGE, 160, 330, 100, {
          selected: [0, 0],
        }),
      );
      const weights = kernelGrid(ctx, api, KERNEL, 900, 400, 100),
        products = api.focus.target('patch-products', () =>
          featureGrid(ctx, api, current.products, 1370, 400, 100, {
            visible: Math.min(9, current.count + (progress > 0 ? 1 : 0)),
          }),
        );
      if (progress > 0 && progress < 1) {
        const i = Math.min(8, current.count),
          r = Math.floor(i / 3),
          col = i % 3;
        [source[r * 5 + col], weights[i], products[i]].forEach((cell) =>
          cellOutline(ctx, api, cell),
        );
      }
      const sum = components.card({
        label: 'sum ' + current.subtotal,
        x: 830,
        y: 820,
        width: 290,
        height: 110,
        fontSize: 43,
        fill: themeColors.panel,
        stroke: themeColors.green,
        textColor: themeColors.green,
      });
      if (progress > 0 && progress < 1) {
        const i = Math.min(8, current.count),
          a = products[i],
          t = (progress * 9) % 1,
          points = [
            {
              x: a.x + a.width,
              y: a.y + a.height / 2,
            },
            {
              x: a.x + a.width + 3.5,
              y: a.y + a.height / 2,
            },
            {
              x: a.x + a.width + 3.5,
              y: 770,
            },
            {
              x: 1133,
              y: 770,
            },
            {
              x: 1133,
              y: 875,
            },
            {
              x: 1120,
              y: 875,
            },
          ],
          lengths = points.slice(1).map((v, j) => Math.hypot(v.x - points[j].x, v.y - points[j].y));
        let left = t * lengths.reduce((a, b) => a + b, 0),
          tip = points[0];
        for (let j = 0; j < lengths.length; j++) {
          const start = points[j],
            end = points[j + 1];
          api.line(ctx, start.x, start.y, end.x, end.y, themeColors.muted, 1);
          if (left > 0) {
            const f = Math.min(1, left / (lengths[j] || 1));
            tip = {
              x: api.lerp(start.x, end.x, f),
              y: api.lerp(start.y, end.y, f),
            };
            api.line(ctx, start.x, start.y, tip.x, tip.y, themeColors.green, 3);
            left -= lengths[j];
          }
        }
        api.circle(ctx, tip.x, tip.y, 3, themeColors.green);
        if (tip.y > 735 && tip.x < 1250)
          text(
            ctx,
            api,
            formatValue(current.products.flat()[i]),
            tip.x + 35,
            tip.y + 45,
            30,
            themeColors.green,
          );
      }
      text(
        ctx,
        api,
        current.count + ' of 9 products arrived',
        960,
        1005,
        30,
        themeColors.muted,
        'center',
      );
    } else {
      const question = currentBeat === 2,
        travel = question ? 1 : cueProgress(ctx, api, 'patch-deposit', stage(1));
      api.focus.target('sliding-window', () =>
        imageGrid(ctx, api, IMAGE, 230, 350, 100, {
          selected: [0, question ? 2 : 0],
        }),
      );
      sharedKernel(ctx, api);
      const values = unknownFeatureMap(ctx, api);
      const response = MAP[0][0];
      values[0][0] = travel >= 1 ? response : '';
      api.focus.target('patch-sum', () => {
        const [firstCell] = featureGrid(ctx, api, values, 1250, 430, 110);
        if (!question) {
          const centerX = firstCell.x + firstCell.width / 2;
          text(ctx, api, 'completed response', centerX, 220, 28, themeColors.green, 'center');
          const completed = components.card({
            label: String(response),
            x: centerX - 90,
            y: 245,
            width: 180,
            height: 80,
            fontSize: 50,
            fill: themeColors.panel,
            stroke: themeColors.green,
            textColor: themeColors.green,
          });
          // Leave room for the traveling digit at both ends of the arrow.
          const digitClearance = 26;
          const startY = completed.y + completed.height + digitClearance;
          const endY = firstCell.y - digitClearance;
          api.line(ctx, centerX, startY, centerX, endY, themeColors.muted, 2);
          const tipY = api.lerp(startY, endY, travel);
          api.arrow(ctx, centerX, startY, centerX, tipY, themeColors.green, 4);
          if (travel > 0 && travel < 1)
            text(
              ctx,
              api,
              formatValue(response),
              centerX + 40,
              tipY + 12,
              32,
              themeColors.green,
              'center',
            );
          equation(
            ctx,
            api,
            travel < 1 ? 'Y_{0,0}=\\;?' : `Y_{0,0}=${response}`,
            960,
            940,
            46,
            themeColors.green,
          );
        } else text(ctx, api, 'Which map cell gets the zero?', 960, 940, 44, themeColors.yellow, 'center');
      });
    }
  }
  ctx.restore();
}
export default {
  id: 'patch',
  draw: drawPatch,
  cues: ['patch-accumulate', 'patch-deposit', 'uniform-question'],
};
