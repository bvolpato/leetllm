import { clamp } from '../arithmetic.mjs';
import { fusionScoreFixture } from '../model.mjs';
import {
  drawFusionConstructionRectangle,
  centeredText as drawFusionConstructionText,
  drawFusionConstructionToken,
} from '../defaults.mjs';
export function drawRoutes(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  ['Late fusion', 'Early fusion', 'Cross-attention'].forEach((name, i) => {
    const x = 185 + i * 580;
    if (i > currentBeat) return;
    const u = state.cues ? api.focus.progress('routes-read-' + i, 0) : progress;
    api.focus.target('routes-mechanism-' + i, () => {
      drawFusionConstructionText(
        ctx,
        api,
        name,
        x + 180,
        295,
        34,
        [themeColors.blue, themeColors.green, themeColors.yellow][i],
      );
      if (i === 0) {
        drawFusionConstructionToken(ctx, api, 'I₁', x + 25, 385, themeColors.blue);
        drawFusionConstructionToken(ctx, api, 'I₂', x + 135, 385, themeColors.blue);
        drawFusionConstructionToken(ctx, api, 'T₁', x + 245, 385, themeColors.green);
        api.line(ctx, x + 65, 480, x + 120, 580, themeColors.blue, 3);
        api.line(ctx, x + 175, 480, x + 120, 580, themeColors.blue, 3);
        api.line(ctx, x + 285, 480, x + 285, 580, themeColors.green, 3);
        drawFusionConstructionText(ctx, api, 'pool image', x + 120, 625, 26, themeColors.blue);
        drawFusionConstructionText(ctx, api, 'text pool', x + 285, 625, 26, themeColors.green);
        const ox = x + 190,
          oy = 800;
        api.line(ctx, ox - 110, oy, ox + 110, oy, themeColors.muted, 2);
        api.line(ctx, ox, oy - 125, ox, oy + 70, themeColors.muted, 2);
        api.line(ctx, ox, oy, ox + 90 * u * 0.6, oy - 90 * u * 0.8, themeColors.blue, 5);
        api.line(ctx, ox, oy, ox + 90 * u, oy, themeColors.green, 5);
        if (u >= 1)
          drawFusionConstructionText(
            ctx,
            api,
            'unit-vector score ' + fusionScoreFixture().score.toFixed(1),
            x + 180,
            940,
            29,
            themeColors.blue,
          );
      } else if (i === 1) {
        const yy = 385 + 230 * u;
        drawFusionConstructionToken(ctx, api, 'I₁', x + 20, yy, themeColors.blue);
        drawFusionConstructionToken(ctx, api, 'I₂', x + 130, yy, themeColors.blue);
        drawFusionConstructionToken(ctx, api, 'T₁', x + 240, yy, themeColors.green);
        drawFusionConstructionText(
          ctx,
          api,
          'one shared prefix',
          x + 180,
          770,
          28,
          themeColors.green,
        );
        for (let r = 0; r < 3; r++)
          for (let c = 0; c < 3; c++)
            drawFusionConstructionRectangle(
              ctx,
              api,
              x + 115 + c * 44,
              820 + r * 44,
              35,
              35,
              c <= r ? themeColors.green : themeColors.muted,
              c <= r ? themeColors.green : themeColors.panel,
            );
        drawFusionConstructionText(
          ctx,
          api,
          'toy causal mask',
          x + 180,
          1010,
          25,
          themeColors.muted,
        );
      } else {
        drawFusionConstructionToken(ctx, api, 'I₁', x + 40, 385, themeColors.blue);
        drawFusionConstructionToken(ctx, api, 'I₂', x + 160, 385, themeColors.blue);
        drawFusionConstructionText(
          ctx,
          api,
          'separate visual bank',
          x + 150,
          340,
          27,
          themeColors.blue,
        );
        drawFusionConstructionToken(ctx, api, 'T₁', x + 200, 740, themeColors.green);
        api.path(
          ctx,
          [
            {
              x: x + 239,
              y: 700,
            },
            {
              x: x + 239,
              y: 600,
            },
            {
              x: x + 79,
              y: 600,
            },
            {
              x: x + 79,
              y: 470,
            },
          ],
          {
            color: themeColors.yellow,
            width: 4,
          },
        );
        api.path(
          ctx,
          [
            {
              x: x + 239,
              y: 700,
            },
            {
              x: x + 239,
              y: 570,
            },
            {
              x: x + 199,
              y: 570,
            },
            {
              x: x + 199,
              y: 470,
            },
          ],
          {
            color: themeColors.yellow,
            width: 4,
          },
        );
        api.circle(ctx, x + 239, 700 - 120 * u, 10, themeColors.yellow);
        drawFusionConstructionRectangle(ctx, api, x + 65, 875, 70, 70, themeColors.yellow);
        drawFusionConstructionRectangle(ctx, api, x + 155, 875, 70, 70, themeColors.yellow);
        drawFusionConstructionText(
          ctx,
          api,
          '1 text query × 2 image keys',
          x + 180,
          1010,
          25,
          themeColors.yellow,
        );
      }
    });
  });
}
export default {
  id: 'routes',
  draw: drawRoutes,
  cues: ['routes-read-0', 'routes-read-1', 'routes-read-2'],
};
