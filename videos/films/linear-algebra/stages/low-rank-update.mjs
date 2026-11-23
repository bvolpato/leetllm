import { clamp } from '../arithmetic.mjs';
import { event } from '../construction.mjs';
import { drawExtensionsEquation, drawExtensionsFocus, drawExtensionsText } from '../defaults.mjs';
import assert from 'node:assert/strict';
const width = 4096;
const rank = 8;
const trainableWeights = 2 * width * rank;

export function drawLowRankUpdate(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cueProgress = (id) => api.focus.progress(id, clamp((progress - 0.15) / 0.6));
  {
    if (currentBeat === 0) {
      const angle = cueProgress('low-rank-map') * Math.PI * 2,
        input = [Math.cos(angle), Math.sin(angle)],
        middle = input[0] + input[1],
        output = [middle, -middle];
      const plane = (x) =>
        teaching.axes({
          x,
          y: 400,
          width: 570,
          height: 400,
          xDomain: [-1.8, 1.8],
          yDomain: [-1.8, 1.8],
          xTicks: [-1, 0, 1],
          yTicks: [-1, 0, 1],
          xLabel: 'coordinate 1',
          yLabel: 'coordinate 2',
          fontSize: 26,
        });
      const left = plane(180),
        right = plane(1190),
        a = left.point(...input),
        z = right.point(...output),
        origin = left.point(0, 0),
        endOrigin = right.point(0, 0);
      teaching.curve({
        plot: left,
        points: Array.from(
          {
            length: 101,
          },
          (_, i) => ({
            x: Math.cos((i * Math.PI) / 50),
            y: Math.sin((i * Math.PI) / 50),
          }),
        ),
        color: themeColors.blue,
        width: 3,
      });
      const r0 = right.point(-1.5, 1.5),
        r1 = right.point(1.5, -1.5);
      api.line(ctx, r0.x, r0.y, r1.x, r1.y, themeColors.pink, 4);
      api.arrow(ctx, origin.x, origin.y, a.x, a.y, themeColors.green, 6);
      api.arrow(ctx, endOrigin.x, endOrigin.y, z.x, z.y, themeColors.green, 6);
      drawExtensionsText(ctx, api, 'input space', 465, 330, 36, themeColors.blue);
      drawExtensionsText(ctx, api, 'rank-one output space', 1475, 330, 36, themeColors.pink);
      drawExtensionsFocus(ctx, api, 'rank-one-latent', () => {
        api.line(ctx, 870, 425, 870, 780, themeColors.muted, 3);
        const yy = 600 - middle * 110;
        api.circle(ctx, 870, yy, 12, themeColors.green);
        drawExtensionsEquation(ctx, api, middle.toFixed(3), 980, yy + 10, 42, themeColors.green);
      });
      drawExtensionsEquation(ctx, api, 'A=[1,1]', 465, 940, 43, themeColors.blue);
      drawExtensionsEquation(ctx, api, 'B=[1,-1]^T', 1475, 940, 43, themeColors.pink);
      drawExtensionsText(
        ctx,
        api,
        '2D rank-one toy · the same learned factors map every input through one scalar',
        960,
        1030,
        28,
        themeColors.muted,
      );
    } else if (currentBeat === 1) {
      const d = width,
        r = rank,
        full = d * d,
        factors = trainableWeights;
      assert.equal(full, 16777216);
      assert.equal(factors, 65536);
      assert.equal(factors / full, 1 / 256);
      drawExtensionsText(
        ctx,
        api,
        'One 4096 × 4096 update · rank 8 factors',
        960,
        300,
        37,
        themeColors.muted,
      );
      const x = 240,
        y = 405,
        side = 460,
        thin = (side * r) / d;
      api.rect(ctx, x, y, side, side, themeColors.panel, themeColors.blue, 3);
      for (let i = 1; i < 16; i++) {
        api.line(ctx, x + (i * side) / 16, y, x + (i * side) / 16, y + side, '#8d9cb944', 1);
        api.line(ctx, x, y + (i * side) / 16, x + side, y + (i * side) / 16, '#8d9cb944', 1);
      }
      drawExtensionsText(ctx, api, '4096', x + side / 2, y - 30, 32, themeColors.blue);
      drawExtensionsText(ctx, api, '4096', x - 70, y + side / 2, 32, themeColors.blue);
      if (event(state, 1, 'full-update-count') > 0.7)
        drawExtensionsEquation(
          ctx,
          api,
          full.toLocaleString('en-US'),
          x + side / 2,
          950,
          50,
          themeColors.blue,
        );
      drawExtensionsFocus(ctx, api, 'factor-weights', () => {
        api.rect(ctx, 1030, 405, thin, side, themeColors.green);
        api.rect(ctx, 1160, 760, side, thin, themeColors.green);
        drawExtensionsText(ctx, api, '4096 × 8', 1120, 360, 32, themeColors.green);
        drawExtensionsText(ctx, api, '8 × 4096', 1440, 700, 32, themeColors.green);
        if (event(state, 1, 'factor-count') > 0.8)
          drawExtensionsEquation(
            ctx,
            api,
            `2\\times4096\\times8=${factors}`,
            1360,
            950,
            46,
            themeColors.green,
          );
      });
      if (event(state, 1, 'full-update-count') > 0.8)
        drawExtensionsText(
          ctx,
          api,
          'The two factors hold 1/256 of the full update’s weights.',
          960,
          1040,
          30,
          themeColors.yellow,
        );
    } else {
      const moments = event(state, 2, 'adam-moments', 0.29, 0.57);
      drawExtensionsText(ctx, api, 'One trainable weight in a LoRA factor', 960, 300, 42, themeColors.ink);
      const left = 278, top = 454, side = 50;
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 8; col++) {
          const selected = row === 2 && col === 7;
          api.rect(ctx, left + side * col, top + side * row, side - 4, side - 4,
            selected ? themeColors.green : themeColors.panel, themeColors.green, 1);
        }
      }
      drawExtensionsText(ctx, api, '6 of 4,096 rows shown', 478, 831, 28, themeColors.muted);
      drawExtensionsFocus(ctx, api, 'weight-state', () => {
        api.line(ctx, 676, 576, 829, 576, themeColors.green, 4);
        api.line(ctx, 829, 492, 829, 667, themeColors.muted, 3);
        ['Mean of gradients', 'Mean of squared gradients'].forEach((name, i) => {
          const y = 492 + 175 * i;
          const ready = moments >= (i + 1) / 2;
          api.line(ctx, 829, y, 930, y, themeColors.muted, 3);
          api.rect(ctx, 930, y - 55, 708, 110, themeColors.panel, ready ? themeColors.yellow : themeColors.muted, 3);
          drawExtensionsText(ctx, api, ready ? name : '?', 1284, y + 13, 37, ready ? themeColors.yellow : themeColors.muted);
        });
      });
      drawExtensionsText(ctx, api, moments === 1
        ? trainableWeights.toLocaleString('en-US') + ' weights × 2 = ' + (2 * trainableWeights).toLocaleString('en-US') + ' Adam moment values'
        : 'Adam keeps a pair of running estimates for each trainable weight.',
        960, 958, 36, themeColors.ink);
    }
    return;
  }
  return;
}
export default {
  id: 'low-rank-update',
  draw: drawLowRankUpdate,
  cues: ['low-rank-map', 'count-factors', 'factor-count', 'full-update-count', 'adam-moments'],
};
