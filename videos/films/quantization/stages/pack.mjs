import {
  drawCircle,
  drawConnection,
  drawEquation,
  drawLine,
  drawRectangle,
  drawText,
  withLabelBounds,
} from '../defaults.mjs';
export function drawPack(ctx, scene, state, api) {
  const themeColors = api.C;
  const beat = state.beat ?? 0;
  const beatP = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0, end = 1) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(beatP, start, end);
  const fade = api.components.fade;
  ctx.save();
  (() => {
    const weights = ['0.15', '−1.22', '2.40', '−0.45', '0.73'];
    const codes = ['0', '−4', '7', '−1', '2'];
    const binary = ['0000', '1100', '0111', '1111', '0010'];
    const sourceX = [310, 635, 960, 1285, 1610],
      byteX = [410, 800, 1190];
    const targets = [620, 480, 1010, 870, 1400];
    const codeP = api.focus.progress('preserve-code', stage(0, 0.05, 0.8)),
      packP = api.focus.progress('pair-nibbles', stage(1, 0.08, 0.85));
    const codeTiles = codes.map((_, i) => ({
      x: api.lerp(sourceX[i], targets[i], packP) - 44,
      y: api.lerp(548, 779, packP) + (i % 2 === 0 ? -1 : 1) * 55 * Math.sin(Math.PI * packP) - 33,
      width: 88,
      height: 66,
    }));
    api.focus.target('pack-float-weights', () =>
      drawText(ctx, api, 'FLOAT WEIGHTS', 180, 270, 30, themeColors.muted),
    );
    fade(codeP * (1 - api.phase(packP, 0, 0.12)), () =>
      api.focus.target('pack-five-signed-4-bit-codes', () =>
        drawText(ctx, api, 'five signed 4-bit codes', 960, 645, 32, themeColors.cyan, 'center'),
      ),
    );
    for (let i = 0; i < weights.length; i += 1) {
      const source = {
        x: sourceX[i] - 100,
        y: 310,
        width: 200,
        height: 82,
      };
      Object.assign(
        source,
        drawRectangle(
          ctx,
          api,
          source.x,
          source.y,
          source.width,
          source.height,
          themeColors.panel,
          themeColors.blue,
          12,
        ),
      );
      withLabelBounds(ctx, api, source, () =>
        api.focus.target('pack-readout', () =>
          drawText(ctx, api, weights[i], sourceX[i], 364, 36, themeColors.blue, 'center', 'mono'),
        ),
      );
      fade(codeP * (1 - api.phase(packP, 0, 0.15)), () =>
        drawConnection(ctx, api, source, codeTiles[i], themeColors.muted, 3),
      );
    }
    fade(packP, () => {
      for (let i = 0; i < byteX.length; i += 1) {
        api.focus.target('packed-bytes', () => {
          drawLine(ctx, api, byteX[i], 836, byteX[i] + 280, 836, themeColors.blue, 2);
          return api.components.fade(api.phase(packP, 0.98, 1), () =>
            drawRectangle(
              ctx,
              api,
              byteX[i],
              730,
              280,
              98,
              themeColors.panel,
              themeColors.blue,
              12,
            ),
          );
        });
        fade(api.phase(packP, 0.9, 1), () =>
          drawLine(ctx, api, byteX[i] + 140, 735, byteX[i] + 140, 823, themeColors.blue, 2),
        );
        fade(api.phase(packP, 0.84, 1) * (1 - stage(2, 0.02, 0.16)), () => {
          api.focus.target('pack-readout-2', () =>
            drawText(
              ctx,
              api,
              i === 2 ? 'pad' : 'high',
              byteX[i] + 70,
              700,
              30,
              themeColors.muted,
              'center',
            ),
          );
          api.focus.target('pack-low', () =>
            drawText(ctx, api, 'low', byteX[i] + 210, 700, 30, themeColors.muted, 'center'),
          );
          api.focus.target('pack-readout-3', () =>
            drawText(
              ctx,
              api,
              ['0xC0', '0xF7', '0x02'][i],
              byteX[i] + 140,
              885,
              38,
              themeColors.ink,
              'center',
              'mono',
            ),
          );
        });
      }
      api.focus.target('padding-nibble', () =>
        drawRectangle(ctx, api, 1216, 746, 88, 66, themeColors.muted, themeColors.bg, 9),
      );
      api.focus.target('pack-0', () =>
        drawText(ctx, api, '0', 1260, 791, 36, themeColors.bg, 'center', 'mono'),
      );
    });
    for (let i = 0; i < codes.length; i += 1) {
      const tile = codeTiles[i],
        x = tile.x + 44,
        y = tile.y + 33;
      fade(codeP, () => {
        Object.assign(
          tile,
          api.focus.target('packing-codes', () =>
            drawRectangle(
              ctx,
              api,
              tile.x,
              tile.y,
              tile.width,
              tile.height,
              themeColors.cyan,
              themeColors.bg,
              9,
            ),
          ),
        );
        withLabelBounds(ctx, api, tile, () => {
          const room = api.phase(packP, 0, 0.15);
          api.focus.target('pack-readout-4', () =>
            drawText(
              ctx,
              api,
              codes[i],
              x,
              api.lerp(y + 13, y + 1, room),
              api.lerp(36, 30, room),
              themeColors.bg,
              'center',
              'mono',
            ),
          );
          fade(api.phase(packP, 0.18, 0.6), () =>
            api.focus.target('pack-readout-5', () =>
              drawText(ctx, api, binary[i], x, y + 24, 18, themeColors.bg, 'center', 'mono'),
            ),
          );
        });
      });
    }
    const decodeP = api.focus.progress('decode-codes', stage(2, 0.16, 0.9));
    fade(stage(2, 0.18, 0.36), () =>
      api.focus.target('pack-recover-with-the-shared-scale', () =>
        drawText(
          ctx,
          api,
          'RECOVER WITH THE SHARED SCALE',
          960,
          470,
          28,
          themeColors.muted,
          'center',
        ),
      ),
    );
    if (decodeP > 0) {
      const reconstructed = [0, -4, 7, -1, 2].map((code) => (code * 2.4) / 7);
      for (let i = 0; i < codes.length; i += 1) {
        const p = api.phase(decodeP, i * 0.045, 0.68 + i * 0.045);
        const points = [
          {
            x: targets[i],
            y: 715,
          },
          {
            x: api.lerp(targets[i], sourceX[i], 0.5),
            y: 645,
          },
          {
            x: sourceX[i],
            y: 598,
          },
        ];
        if (p > 0 && p < 1) {
          const end = api.trace(ctx, points, p, themeColors.blue, 2);
          if (end) drawCircle(ctx, api, end.x, end.y, 5, themeColors.blue, themeColors.bg, 2);
        }
        fade(api.phase(p, 0.7, 1), () => {
          api.focus.target('reconstructed-weights', () =>
            drawRectangle(
              ctx,
              api,
              sourceX[i] - 90,
              510,
              180,
              76,
              themeColors.panel,
              themeColors.blue,
              12,
            ),
          );
          api.focus.target('pack-readout-6', () =>
            drawText(
              ctx,
              api,
              reconstructed[i].toFixed(3),
              sourceX[i],
              560,
              32,
              themeColors.blue,
              'center',
              'mono',
            ),
          );
        });
      }
    }
    fade(stage(0, 0.5, 0.94), () =>
      api.focus.target('pack-2-times4-mathrm-bits-1-mathrm-byte', () =>
        drawEquation(
          ctx,
          api,
          '2\\times4\\,\\mathrm{bits}=1\\,\\mathrm{byte}',
          570,
          978,
          42,
          themeColors.ink,
          'center',
        ),
      ),
    );
    fade(stage(2, 0.02, 0.3), () =>
      api.focus.target('pack-s-frac-2-4-7-quad-n-5', () =>
        drawEquation(
          ctx,
          api,
          'S=\\frac{2.4}{7},\\quad N=5',
          1390,
          978,
          40,
          themeColors.yellow,
          'center',
        ),
      ),
    );
    return;
  })();
  ctx.restore();
}
export default {
  id: 'pack',
  draw: drawPack,
  cues: [
    'preserve-code',
    'code-packing',
    'pair-nibbles',
    'padding-nibble',
    'decode-codes',
    'shared-metadata',
  ],
};
