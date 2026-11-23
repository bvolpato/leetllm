import { contextBudgetState } from '../construction.mjs';
import {
  drawCircle,
  drawConnection,
  drawEquation,
  drawLine,
  drawRectangle,
  drawText,
} from '../defaults.mjs';
export function drawBenchmark(ctx, scene, state, api) {
  const themeColors = api.C;
  const beat = state.beat ?? 0;
  const beatP = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0, end = 1) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(beatP, start, end);
  const fade = api.components.fade;
  ctx.save();
  (() => {
    if (beat >= 2) {
      const budget = contextBudgetState(state),
        start = 210,
        scale = 150;
      const prediction = budget.growth > 0 && budget.overflow === 0 && budget.restore === 0;
      api.focus.target('runtime-budget', () => {
        drawText(
          ctx,
          api,
          'CONSTRUCTED 7B-WEIGHT DEVICE BUDGET',
          960,
          285,
          34,
          themeColors.muted,
          'center',
        );
        drawText(
          ctx,
          api,
          '4-bit codes · one FP16 scale per 128 weights',
          210,
          355,
          27,
          themeColors.muted,
        );
        drawText(
          ctx,
          api,
          '8 GiB available',
          start + budget.capacity * scale,
          380,
          42,
          themeColors.yellow,
          'right',
        );
        let x = start;
        for (const [id, label, value, color] of [
          ['weights', 'weights + scales', budget.weights, themeColors.blue],
          ['other', 'other runtime', budget.other, themeColors.cyan],
          ['cache', 'attention cache', budget.cache, themeColors.pink],
        ]) {
          const paint = () => {
            drawRectangle(ctx, api, x, 465, value * scale, 150, color, themeColors.bg, 8);
            drawText(
              ctx,
              api,
              label,
              x + (value * scale) / 2,
              700,
              id === 'other' ? 25 : 32,
              color,
              'center',
            );
            drawText(
              ctx,
              api,
              value.toFixed(2) + ' GiB',
              x + (value * scale) / 2,
              755,
              30,
              color,
              'center',
              'mono',
            );
          };
          if (id === 'cache') api.focus.target('context-budget', paint);
          else paint();
          x += value * scale;
        }
        drawLine(
          ctx,
          api,
          start + budget.capacity * scale,
          405,
          start + budget.capacity * scale,
          640,
          themeColors.yellow,
          6,
        );
      });
      api.focus.target('context-budget', () => {
        const verdict = prediction
          ? 'Double the cache. Will it fit?'
          : budget.fits
            ? 'fits this budget'
            : 'over budget';
        drawText(
          ctx,
          api,
          verdict,
          960,
          865,
          48,
          prediction ? themeColors.ink : budget.fits ? themeColors.green : themeColors.red,
          'center',
        );
        const expression = prediction
          ? (budget.weights + budget.other).toFixed(2) + '+2\\times2.00=\\;?'
          : budget.total.toFixed(2) +
            '\\;\\mathrm{GiB}\\quad ' +
            (budget.fits ? '\\le' : ' > ') +
            '\\quad8\\;\\mathrm{GiB}';
        drawEquation(
          ctx,
          api,
          expression,
          960,
          955,
          50,
          prediction ? themeColors.pink : budget.fits ? themeColors.green : themeColors.red,
          'center',
        );
      });
      api.focus.target('budget-result', () => {
        if (budget.restore === 1)
          drawText(
            ctx,
            api,
            'fresh-task quality  ·  measured timing',
            960,
            1030,
            30,
            themeColors.ink,
            'center',
          );
      });
      return;
    }
    const reduce = api.focus.progress('decode-reads', stage(0, 0.04, 0.9));
    api.focus.target('benchmark-decode', () =>
      drawText(ctx, api, 'DECODE', 500, 270, 34, themeColors.blue, 'center'),
    );
    api.focus.target('benchmark-one-token-reads-weight-blocks', () =>
      drawText(
        ctx,
        api,
        'one token reads weight blocks',
        500,
        325,
        30,
        themeColors.muted,
        'center',
      ),
    );
    api.focus.target('benchmark-prefill', () =>
      drawText(ctx, api, 'PREFILL', 1395, 270, 34, themeColors.cyan, 'center'),
    );
    api.focus.target('benchmark-prompt-positions-reuse-weights', () =>
      drawText(
        ctx,
        api,
        'prompt positions reuse weights',
        1395,
        325,
        30,
        themeColors.muted,
        'center',
      ),
    );
    api.focus.target('benchmark-16-bit-weights', () =>
      drawText(ctx, api, '16-bit weights', 210, 410, 32, themeColors.blue),
    );
    api.focus.target('decode-weight-traffic', () =>
      drawRectangle(ctx, api, 210, 440, 600, 50, themeColors.blue, themeColors.bg, 9),
    );
    api.focus.target('benchmark-4-bit-codes', () =>
      drawText(ctx, api, '4-bit codes', 210, 550, 32, themeColors.cyan),
    );
    const codeWidth = api.lerp(600, 150, reduce);
    api.focus.target('decode-weight-traffic', () =>
      drawRectangle(ctx, api, 210, 580, codeWidth, 50, themeColors.cyan, themeColors.bg, 9),
    );
    for (let i = 1; i < 8; i += 1)
      drawLine(
        ctx,
        api,
        210 + (codeWidth * i) / 8,
        591,
        210 + (codeWidth * i) / 8,
        619,
        themeColors.bg,
        2,
      );
    const unpackP = state.cues
      ? api.focus.progress('unpack-scale', 0) > 0
        ? 1
        : 0
      : stage(0, 0.25, 0.96);
    fade(unpackP, () => {
      drawRectangle(ctx, api, 210, 685, 600, 70, themeColors.panel, themeColors.yellow, 12);
      api.focus.target('benchmark-unpack-codes-apply-scales', () =>
        drawText(
          ctx,
          api,
          'unpack codes + apply scales',
          510,
          732,
          32,
          themeColors.yellow,
          'center',
        ),
      );
      for (let i = 0; i < 4; i += 1) {
        const p = stage(0, 0.3 + i * 0.11, 0.56 + i * 0.11);
        if (p <= 0 || p >= 1) continue;
        const x = api.lerp(230 + (codeWidth * (i + 0.5)) / 4, 255 + i * 145, p);
        drawRectangle(ctx, api, x, api.lerp(640, 663, p), 15, 13, themeColors.cyan, undefined, 3);
      }
    });
    api.focus.reveal('prefill-reuse', () => {
      const weights = {
        x: 1170,
        y: 635,
        width: 450,
        height: 74,
      };
      for (let i = 0; i < 7; i += 1) {
        const token = {
          x: 1105 + i * 86,
          y: 410,
          width: 62,
          height: 64,
        };
        drawConnection(ctx, api, weights, token, themeColors.blue, 2);
        const p = stage(1, 0.17 + i * 0.055, 0.47 + i * 0.055);
        if (p > 0 && p < 1) {
          const from = api.anchor(weights, token, 15),
            to = api.anchor(token, weights, 15);
          drawCircle(
            ctx,
            api,
            api.lerp(from.x, to.x, p),
            api.lerp(from.y, to.y, p),
            7,
            themeColors.blue,
            themeColors.bg,
            2,
          );
        }
        Object.assign(
          token,
          api.focus.target('prefill-weight-reuse', () =>
            drawRectangle(
              ctx,
              api,
              token.x,
              token.y,
              token.width,
              token.height,
              themeColors.panel,
              themeColors.cyan,
              8,
            ),
          ),
        );
        api.focus.target('benchmark-readout', () =>
          drawEquation(
            ctx,
            api,
            `t_{${i + 1}}`,
            token.x + token.width / 2,
            token.y + 44,
            30,
            themeColors.cyan,
            'center',
          ),
        );
        if (p >= 1)
          drawLine(
            ctx,
            api,
            token.x + 11,
            token.y + 73,
            token.x + 51,
            token.y + 73,
            themeColors.green,
            4,
          );
      }
      Object.assign(
        weights,
        api.focus.target('prefill-weight-reuse', () =>
          drawRectangle(
            ctx,
            api,
            weights.x,
            weights.y,
            weights.width,
            weights.height,
            themeColors.panel,
            themeColors.blue,
            12,
          ),
        ),
      );
      api.focus.target('benchmark-shared-weight-blocks', () =>
        drawText(ctx, api, 'shared weight blocks', 1395, 684, 32, themeColors.blue, 'center'),
      );
    });
    api.focus.reveal('attention-memory', () => {
      drawRectangle(ctx, api, 210, 805, 1495, 70, themeColors.panel, themeColors.pink, 14);
      const cacheP = stage(2, 0.06, 0.9);
      for (let i = 0; i < 10; i += 1) {
        const p = api.phase(cacheP, i * 0.07, 0.37 + i * 0.07);
        fade(p, () =>
          drawRectangle(ctx, api, 1260 + i * 39, 823, 29, 34, themeColors.pink, undefined, 4),
        );
      }
      api.focus.target('benchmark-choose-kv-cache-precision-separately', () =>
        drawText(ctx, api, 'choose KV-cache precision separately', 300, 853, 32, themeColors.pink),
      );
    });
    api.focus.reveal('matched-models', () => {
      api.focus.target('benchmark-paired-source-and-reloaded-artifact-matched-prompts-an', () =>
        drawText(
          ctx,
          api,
          'paired source and reloaded artifact · matched prompts and decoding',
          960,
          940,
          30,
          themeColors.ink,
          'center',
        ),
      );
      api.focus.target('benchmark-mathrm-quality-quad-m-mathrm-peak-quad-mathrm-ttft-qua', () =>
        drawEquation(
          ctx,
          api,
          '\\mathrm{quality}\\quad M_{\\mathrm{peak}}\\quad\\mathrm{TTFT}\\quad\\mathrm{ITL}',
          960,
          1000,
          38,
          themeColors.cyan,
          'center',
        ),
      );
    });
    return;
  })();
  ctx.restore();
}
export default {
  id: 'benchmark',
  draw: drawBenchmark,
  cues: [
    'decode-reads',
    'unpack-scale',
    'prefill-reuse',
    'phase-balance',
    'attention-memory',
    'context-growth',
    'budget-overflow',
    'restore-context',
    'matched-models',
    'quality-time-memory',
  ],
};
