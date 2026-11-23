import {
  drawCircle,
  drawConnection,
  drawEquation,
  drawLine,
  drawRectangle,
  drawText,
  withLabelBounds,
} from '../defaults.mjs';
export function drawGguf(ctx, scene, state, api) {
  const themeColors = api.C;
  const beat = state.beat ?? 0;
  const beatP = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0, end = 1) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(beatP, start, end);
  const fade = api.components.fade;
  ctx.save();
  (() => {
    const methodP = api.focus.progress('choose-method', stage(0, 0.04, 0.88)),
      fileP = api.focus.progress('stored-artifact', stage(0, 0.4, 0.9));
    api.focus.target('gguf-choose-weights', () =>
      drawText(ctx, api, 'CHOOSE WEIGHTS', 435, 260, 30, themeColors.muted, 'center'),
    );
    api.focus.target('gguf-store-an-artifact', () =>
      drawText(ctx, api, 'STORE AN ARTIFACT', 1180, 260, 30, themeColors.muted, 'center'),
    );
    const methods = [
      {
        x: 145,
        y: 325,
        width: 240,
        height: 100,
        label: 'GPTQ',
        color: themeColors.blue,
      },
      {
        x: 475,
        y: 325,
        width: 240,
        height: 100,
        label: 'AWQ',
        color: themeColors.cyan,
      },
    ];
    const weights = {
      x: 195,
      y: 580,
      width: 470,
      height: 170,
    };
    if (fileP > 0 && fileP < 1) {
      for (let i = 0; i < 7; i += 1) {
        const p = api.phase(fileP, i * 0.045, 0.53 + i * 0.045);
        if (p <= 0 || p >= 1) continue;
        const x = api.lerp(253 + i * 52, 822, p);
        const y = api.lerp(655, 625, p);
        drawRectangle(
          ctx,
          api,
          x,
          y,
          24,
          25,
          i === 6 ? themeColors.yellow : themeColors.cyan,
          themeColors.bg,
          5,
        );
      }
    }
    fade(methodP, () => {
      for (const method of methods) {
        Object.assign(
          method,
          drawRectangle(
            ctx,
            api,
            method.x,
            method.y,
            method.width,
            method.height,
            themeColors.panel,
            method.color,
            16,
          ),
        );
        api.focus.target('gguf-readout', () =>
          drawText(
            ctx,
            api,
            method.label,
            method.x + method.width / 2,
            method.y + 63,
            40,
            method.color,
            'center',
          ),
        );
        drawConnection(ctx, api, method, weights, method.color);
      }
      Object.assign(
        weights,
        drawRectangle(
          ctx,
          api,
          weights.x,
          weights.y,
          weights.width,
          weights.height,
          themeColors.panel,
          themeColors.cyan,
          14,
        ),
      );
      api.focus.target('gguf-quantized-weights', () =>
        drawText(ctx, api, 'quantized weights', 430, 630, 32, themeColors.ink, 'center'),
      );
      for (let i = 0; i < 7; i += 1)
        drawRectangle(
          ctx,
          api,
          253 + i * 52,
          655,
          39,
          32,
          i === 6 ? themeColors.yellow : themeColors.cyan,
          themeColors.bg,
          6,
        );
      api.focus.target('gguf-codes-scales', () =>
        drawText(ctx, api, 'codes + scales', 430, 725, 30, themeColors.cyan, 'center', 'mono'),
      );
    });
    const file = {
      x: 860,
      y: 325,
      width: 640,
      height: 400,
    };
    fade(fileP, () => {
      Object.assign(
        file,
        api.focus.target('gguf-artifact', () =>
          drawRectangle(
            ctx,
            api,
            file.x,
            file.y,
            file.width,
            file.height,
            themeColors.panel,
            themeColors.yellow,
            20,
          ),
        ),
      );
      api.focus.target('gguf-gguf', () =>
        drawText(ctx, api, 'GGUF', 1180, 395, 42, themeColors.yellow, 'center', 'mono'),
      );
      api.focus.target('gguf-metadata-tokenizer', () =>
        drawText(ctx, api, 'metadata · tokenizer', 1180, 450, 32, themeColors.ink, 'center'),
      );
      drawLine(ctx, api, 900, 480, 1460, 480, themeColors.yellow, 2);
      api.focus.target('gguf-typed-tensor-payloads', () =>
        drawText(ctx, api, 'typed tensor payloads', 1180, 525, 30, themeColors.muted, 'center'),
      );
      const labels = ['BF16', 'Q4_K', 'mixed'],
        colors = [themeColors.blue, themeColors.cyan, themeColors.yellow];
      for (let i = 0; i < labels.length; i += 1) {
        const x = 900 + i * 190;
        const p = stage(1, 0.1 + i * 0.12, 0.56 + i * 0.12);
        drawRectangle(ctx, api, x, 565, 180, 64, themeColors.bg, colors[i], 10);
        fade(p, () => {
          drawRectangle(ctx, api, x, 565, 180 * p, 64, colors[i], undefined, 10);
        });
        fade(api.phase(p, 0.75, 1), () =>
          api.focus.target('gguf-readout-2', () =>
            drawText(ctx, api, labels[i], x + 90, 608, 32, themeColors.bg, 'center', 'mono'),
          ),
        );
      }
      api.focus.target('gguf-q4-k-m-can-mix-tensor-types', () =>
        drawText(
          ctx,
          api,
          'Q4_K_M can mix tensor types',
          1180,
          683,
          29,
          themeColors.muted,
          'center',
          'mono',
        ),
      );
    });
    const runtimeP = api.focus.progress('compatible-runtime', stage(2, 0.04, 0.9));
    fade(runtimeP, () => {
      const runtime = {
        x: 1600,
        y: 435,
        width: 220,
        height: 180,
      };
      drawConnection(ctx, api, file, runtime, themeColors.yellow);
      const p = runtimeP;
      if (p > 0 && p < 1) {
        const from = api.anchor(file, runtime, 18),
          to = api.anchor(runtime, file, 18);
        drawCircle(
          ctx,
          api,
          api.lerp(from.x, to.x, p),
          api.lerp(from.y, to.y, p),
          7,
          themeColors.yellow,
          themeColors.bg,
          2,
        );
      }
      Object.assign(
        runtime,
        drawRectangle(
          ctx,
          api,
          runtime.x,
          runtime.y,
          runtime.width,
          runtime.height,
          themeColors.panel,
          themeColors.pink,
          16,
        ),
      );
      withLabelBounds(ctx, api, runtime, () => {
        api.focus.target('gguf-compatible', () =>
          drawText(ctx, api, 'compatible', 1710, 483, 30, themeColors.pink, 'center'),
        );
        api.focus.target('gguf-runtime', () =>
          drawText(ctx, api, 'runtime', 1710, 530, 34, themeColors.ink, 'center'),
        );
        api.focus.target('gguf-llama-cpp', () =>
          drawText(ctx, api, 'llama.cpp', 1710, 578, 30, themeColors.muted, 'center'),
        );
      });
    });
    fade(beat < 3 ? 1 : 0, () => {
      const blockP = api.focus.progress('typed-encodings', stage(1, 0.05, 0.55)),
        countP = api.focus.progress('metadata-bits', stage(1, 0.55, 0.9));
      fade(blockP, () => {
        drawText(
          ctx,
          api,
          'ONE Q4_K BLOCK · 256 WEIGHTS',
          1180,
          770,
          28,
          themeColors.muted,
          'center',
          'mono',
        );
        let x = 860;
        for (const [index, [bytes, color]] of [
          [128, themeColors.cyan],
          [12, themeColors.yellow],
          [4, themeColors.pink],
        ].entries()) {
          const width = (bytes / 144) * 640,
            p = api.phase(blockP, index * 0.25, 0.5 + index * 0.25);
          drawRectangle(ctx, api, x, 800, width * p, 52, color, themeColors.bg, 3);
          x += width;
        }
        drawText(ctx, api, 'codes', 990, 890, 25, themeColors.cyan, 'center');
        drawText(ctx, api, 'local scales/mins', 1230, 890, 25, themeColors.yellow, 'center');
        drawText(ctx, api, 'shared factors', 1480, 890, 25, themeColors.pink, 'center');
        api.focus.target('q4-block-accounting', () =>
          drawText(
            ctx,
            api,
            '128 + 12 + 4 = 144 bytes',
            1180,
            945,
            28,
            themeColors.ink,
            'center',
            'mono',
          ),
        );
      });
      fade(countP, () =>
        api.focus.target('gguf-frac-144-times8-256-4-5-mathrm-bits-weight', () =>
          drawEquation(
            ctx,
            api,
            '\\frac{144\\times8}{256}=4.5\\,\\mathrm{bits/weight}',
            1180,
            1020,
            36,
            themeColors.ink,
            'center',
          ),
        ),
      );
    });
    if (state.cues || beat > 3 || (beat === 3 && state.beatP >= 0.18))
      api.focus.reveal('layer-placement', () => {
        for (let i = 0; i < 6; i += 1) {
          const p = stage(3, 0.18 + i * 0.045, 0.64 + i * 0.045);
          const x = 850 + i * 115,
            gpu = i >= 3,
            y = api.lerp(750, 850, p);
          api.focus.target('layer-placement', () =>
            drawRectangle(
              ctx,
              api,
              x,
              y,
              96,
              66,
              gpu ? themeColors.blue : themeColors.cyan,
              themeColors.bg,
              8,
            ),
          );
          api.focus.target('gguf-readout-3', () =>
            drawText(ctx, api, `L${i + 1}`, x + 48, y + 44, 30, themeColors.bg, 'center', 'mono'),
          );
        }
        fade(stage(3, 0.87, 0.98), () =>
          api.focus.target('gguf-one-file-several-placement-choices', () =>
            drawText(
              ctx,
              api,
              'one file · several placement choices',
              1180,
              810,
              30,
              themeColors.muted,
              'center',
            ),
          ),
        );
        api.focus.target('gguf-cpu', () =>
          drawText(ctx, api, 'CPU', 1013, 975, 32, themeColors.cyan, 'center'),
        );
        api.focus.target('gguf-gpu', () =>
          drawText(ctx, api, 'GPU', 1358, 975, 32, themeColors.blue, 'center'),
        );
      });
    api.focus.target('gguf-method-and-container', () =>
      drawText(ctx, api, 'method and container', 430, 865, 30, themeColors.muted, 'center'),
    );
    api.focus.target('gguf-are-independent-choices', () =>
      drawText(ctx, api, 'are independent choices', 430, 915, 30, themeColors.muted, 'center'),
    );
    return;
  })();
  ctx.restore();
}
export default {
  id: 'gguf',
  draw: drawGguf,
  cues: [
    'choose-method',
    'stored-artifact',
    'typed-encodings',
    'metadata-bits',
    'mixed-encodings',
    'compatible-runtime',
    'layer-placement',
    'cpu-gpu',
  ],
};
