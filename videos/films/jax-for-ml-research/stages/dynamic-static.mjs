import { projectionFixture } from '../arithmetic.mjs';
import {
  drawArrow,
  drawBox,
  drawLeftText,
  drawLine,
  drawMatrix,
  drawText,
  footer,
  mark,
} from '../defaults.mjs';
export function drawDynamicStatic(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1,
    U = cueProgress('jx-dynamic-static-b' + currentBeat),
    mix = (a, z, u) => a + (z - a) * u;
  const paint = () => {
    if (currentBeat === 0) {
      drawBox(ctx, api, 'root', 800, 300, 300, 80, themeColors.yellow);
      drawLine(ctx, api, 950, 385, 480, 470, themeColors.blue);
      drawLine(ctx, api, 950, 385, 1450, 470, themeColors.pink);
      drawBox(ctx, api, 'weight · [2] · float32', 200, 490, 600, 100, themeColors.blue);
      drawBox(ctx, api, 'bias · () · float32', 1140, 490, 600, 100, themeColors.pink);
      drawBox(ctx, api, 'registered custom node', 160, 760, 620, 100, themeColors.green);
      drawBox(ctx, api, 'opaque unsupported leaf', 1100, 760, 640, 100, themeColors.muted);
      drawText(
        ctx,
        api,
        'Named paths + tree definition + exact shape + dtype',
        960,
        930,
        31,
        themeColors.yellow,
      );
    } else {
      const f = projectionFixture(),
        u = cueProgress('static-transpose'),
        flipped = resultComplete('static-transpose');
      drawText(
        ctx,
        api,
        'Separate square-projection illustration · row vector x @ W',
        960,
        280,
        31,
        themeColors.yellow,
      );
      drawMatrix(ctx, api, f.x, 190, 450, {
        cw: 100,
        ch: 90,
        label: 'x · [2]',
      });
      drawLeftText(
        ctx,
        api,
        u === 0 ? 'W · [2,2]' : flipped ? 'Wᵀ · same [2,2]' : 'W → Wᵀ',
        680,
        350,
        28,
        themeColors.blue,
      );
      if (u > 0 && u < 1)
        api.rect(ctx, 680, 385, 235, 215, themeColors.panel, themeColors.blue, 2, 5);
      else
        for (let i = 0; i < 2; i++)
          for (let j = 0; j < 2; j++)
            api.rect(
              ctx,
              680 + j * 120,
              385 + i * 110,
              115,
              105,
              themeColors.panel,
              themeColors.blue,
              2,
              5,
            );
      drawText(ctx, api, 1, 737.5, 454.3, 29, themeColors.blue);
      drawText(ctx, api, 4, 857.5, 564.3, 29, themeColors.blue);
      const arc = Math.sin(u * Math.PI) * 65;
      drawText(
        ctx,
        api,
        2,
        mix(857.5, 737.5, u) + arc,
        mix(454.3, 564.3, u),
        29,
        themeColors.yellow,
      );
      drawText(ctx, api, 3, mix(737.5, 857.5, u) - arc, mix(564.3, 454.3, u), 29, themeColors.pink);
      drawArrow(ctx, api, 1050, 500, 1250, 500);
      drawMatrix(ctx, api, flipped ? f.transposed : f.output, 1350, 450, {
        cw: 150,
        ch: 90,
        color: flipped ? themeColors.pink : themeColors.green,
        known: u === 0 || flipped,
        label: 'computed output',
      });
      if (u > 0) drawText(ctx, api, 'Original x @ W = [7,10]', 1480, 660, 29, themeColors.muted);
      drawBox(ctx, api, 'array values: dynamic', 220, 770, 650, 90, themeColors.blue);
      drawBox(ctx, api, 'activation mode: static', 1050, 770, 650, 90, themeColors.yellow);
      drawText(
        ctx,
        api,
        flipped
          ? 'Same shape, different axis meaning and output'
          : 'Values can change within a compatible abstract contract',
        960,
        935,
        32,
        flipped ? themeColors.pink : themeColors.muted,
      );
    }
    footer(ctx, api, 'Equal element counts do not identify a checkpoint’s semantic layout');
  };
  mark(ctx, api, 'jx-dynamic-static-mechanism', paint);
}
export default {
  id: 'dynamic-static',
  draw: drawDynamicStatic,
  cues: ['jx-dynamic-static-b0', 'jx-dynamic-static-b1', 'static-transpose'],
};
