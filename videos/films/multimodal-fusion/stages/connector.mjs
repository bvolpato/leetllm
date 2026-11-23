import { clamp, cue } from '../arithmetic.mjs';
import { legendCrop, originalKey, risingRow, trendPlot } from '../chart-reading.mjs';
import { VISUAL_KEYS, VISUAL_VALUES } from '../fixtures.mjs';
import {
  drawConnectorConstructionRectangle,
  centeredText as drawConnectorConstructionText,
} from '../defaults.mjs';
import { dotProduct, stableSoftmax } from 'vizmatic';
export function drawConnector(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cueProgress = (id, f = progress) => (state.cues ? api.focus.progress(id, f) : f);
  if (currentBeat >= 3) {
    api.focus.target('connector-trace-readback', () => trendPlot(ctx, api, {
      readings: true, title: 'Service response time (ms)',
    }));
    const restored = cue(state, 'connector-check-source', 4, 0.3, 0.67);
    const named = cue(state, 'connector-name', 4, 0.67, 0.78) === 1;
    api.focus.target('connector-key-readback', () => {
      if (restored > 0) {
        legendCrop(ctx, api, { reveal: restored, title: 'Verified crop from the original' });
      } else {
        api.text(ctx, 'Illustrative readback · 32 states', 1145, 326, 34, themeColors.ink);
        api.text(ctx, 'Rising stroke', 1150, 450, 32, themeColors.muted);
        api.line(ctx, 1155, 510, 1320, 510, themeColors.green, 9);
        api.text(ctx, '5.2 to 9.0', 1370, 525, 48, themeColors.green);
        api.text(ctx, 'Series name', 1150, 654, 32, themeColors.muted);
        api.text(ctx, 'Unreadable', 1150, 729, 47, themeColors.yellow);
      }
    });
    const question = currentBeat === 3 ? 'What can the reader report from this view?' : 'The green trace rises from 5.2 to 9.0.';
    api.text(ctx, named ? `The legend identifies ${originalKey[risingRow]}.` : question, 960, 913, 48,
      currentBeat === 3 ? themeColors.yellow : themeColors.green, 'center');
    return;
  }
  if (currentBeat === 0) {
    const u = cueProgress('connector-project-width'),
      F = [1, 2, 3],
      W = [
        [1, 0],
        [0, 1],
        [1, -1],
      ],
      out = [0, 1].map((j) => F.reduce((a, v, i) => a + v * W[i][j], 0));
    drawConnectorConstructionText(
      ctx,
      api,
      'One projection per feature',
      960,
      280,
      33,
      themeColors.ink,
    );
    api.focus.target('connector-feature-bank', () => {
      drawConnectorConstructionText(
        ctx,
        api,
        '576 × 3 toy feature matrix',
        405,
        350,
        29,
        themeColors.blue,
      );
      [0, 1, 2, 3, 4, 575].forEach((row, i) => {
        const y = 405 + i * 70;
        drawConnectorConstructionText(
          ctx,
          api,
          row === 575 ? '… 575' : 'row ' + row,
          170,
          y + 32,
          24,
          themeColors.muted,
        );
        F.forEach((v, j) => {
          drawConnectorConstructionRectangle(ctx, api, 245 + j * 107, y, 94, 52, themeColors.blue);
          drawConnectorConstructionText(ctx, api, v, 292 + j * 107, y + 36, 27, themeColors.blue);
        });
      });
    });
    api.focus.target('connector-width-projection', () => {
      drawConnectorConstructionText(ctx, api, 'Authored W: 3 × 2', 950, 350, 29, themeColors.cyan);
      W.forEach((row, i) =>
        row.forEach((v, j) => {
          drawConnectorConstructionRectangle(
            ctx,
            api,
            835 + j * 125,
            430 + i * 100,
            105,
            74,
            themeColors.cyan,
          );
          drawConnectorConstructionText(
            ctx,
            api,
            v,
            887 + j * 125,
            478 + i * 100,
            31,
            themeColors.cyan,
          );
        }),
      );
      api.line(ctx, 590, 620, 785, 620, themeColors.cyan, 4);
      api.circle(ctx, 590 + 195 * u, 620, 10, themeColors.yellow);
    });
    api.focus.target('connector-preserved-positions', () => {
      drawConnectorConstructionText(
        ctx,
        api,
        '576 × 2 output matrix',
        1480,
        350,
        29,
        themeColors.green,
      );
      [0, 1, 2, 3, 4, 575].forEach((row, i) => {
        const y = 405 + i * 70;
        drawConnectorConstructionText(
          ctx,
          api,
          row === 575 ? '… 575' : 'row ' + row,
          1255,
          y + 32,
          24,
          themeColors.muted,
        );
        out.forEach((v, j) => {
          drawConnectorConstructionRectangle(
            ctx,
            api,
            1330 + j * 120,
            y,
            105,
            52,
            themeColors.green,
          );
          if (u >= 1)
            drawConnectorConstructionText(
              ctx,
              api,
              v,
              1382 + j * 120,
              y + 36,
              27,
              themeColors.green,
            );
        });
      });
      api.line(ctx, 1090, 620, 1280, 620, themeColors.green, 4);
    });
    drawConnectorConstructionText(
      ctx,
      api,
      u >= 1 ? '[1, 2, 3] W = [4, −1]' : 'Compute one feature row through the same map',
      960,
      930,
      36,
      u >= 1 ? themeColors.green : themeColors.yellow,
    );
    drawConnectorConstructionText(
      ctx,
      api,
      'Supplied feature-width worksheet; values are not trained image embeddings.',
      960,
      1010,
      28,
      themeColors.muted,
    );
  } else {
    const n = currentBeat === 1 ? 32 : 64,
      cols = 8,
      rows = n / cols,
      u =
        currentBeat === 1
          ? cueProgress('connector-read-queries')
          : cueProgress('connector-configured-resampler'),
      count = Math.min(n, Math.floor(u * (n + 0.999))),
      active = Math.min(n - 1, count),
      q = [Math.cos(active * 0.37), Math.sin(active * 0.37), 0.7],
      scores = VISUAL_KEYS.map((k) => dotProduct(q, k) / Math.sqrt(3)),
      weights = stableSoftmax(scores),
      mixed = VISUAL_VALUES[0].map((_, j) =>
        weights.reduce((a, w, i) => a + w * VISUAL_VALUES[i][j], 0),
      );
    drawConnectorConstructionText(
      ctx,
      api,
      currentBeat === 1
        ? '32 learned queries read a 576-feature bank'
        : 'Separate configured Perceiver example · 64 latent slots',
      960,
      280,
      33,
      themeColors.ink,
    );
    const gx = 160,
      gy = 395,
      size = 17;
    api.focus.target('connector-feature-bank', () => {
      drawConnectorConstructionText(ctx, api, '576 input features', 365, 350, 29, themeColors.blue);
      for (let r = 0; r < 24; r++)
        for (let c = 0; c < 24; c++)
          drawConnectorConstructionRectangle(
            ctx,
            api,
            gx + c * size,
            gy + r * size,
            size - 1,
            size - 1,
            themeColors.blue,
            themeColors.blue,
          );
    });
    const sourceIds = [17, 183, 425],
      tones = [themeColors.blue, themeColors.green, themeColors.pink];
    sourceIds.forEach((id, i) => {
      const x = gx + (id % 24) * size,
        y = gy + Math.floor(id / 24) * size;
      drawConnectorConstructionRectangle(
        ctx,
        api,
        x,
        y,
        size - 1,
        size - 1,
        themeColors.yellow,
        themeColors.yellow,
      );
      api.focus.target('connector-feature-reader', () => {
        const qx = 760 + (active % cols) * 55 + 23,
          qy = 420 + Math.floor(active / cols) * 55 + 23;
        api.path(
          ctx,
          [
            {
              x: x + size,
              y: y + 8,
            },
            {
              x: 635,
              y: y + 8,
            },
            {
              x: 635,
              y: qy - 28,
            },
            {
              x: qx,
              y: qy - 28,
            },
            {
              x: qx,
              y: qy - 24,
            },
          ],
          {
            color: tones[i],
            width: 2 + weights[i] * 5,
          },
        );
      });
    });
    api.focus.target('connector-query-slots', () => {
      drawConnectorConstructionText(
        ctx,
        api,
        n + ' configured query slots',
        960,
        350,
        29,
        themeColors.yellow,
      );
      for (let i = 0; i < n; i++) {
        const x = 760 + (i % cols) * 55,
          y = 420 + Math.floor(i / cols) * 55;
        drawConnectorConstructionRectangle(
          ctx,
          api,
          x,
          y,
          46,
          46,
          i === active ? themeColors.yellow : themeColors.muted,
          i === active ? themeColors.yellow : themeColors.panel,
        );
      }
      drawConnectorConstructionText(
        ctx,
        api,
        'active q' + (active + 1),
        960,
        rows === 4 ? 720 : 910,
        29,
        themeColors.yellow,
      );
    });
    api.focus.target('connector-output-states', () => {
      drawConnectorConstructionText(
        ctx,
        api,
        'Bounded output states',
        1510,
        350,
        29,
        themeColors.green,
      );
      for (let i = 0; i < n; i++) {
        const x = 1340 + (i % 8) * 48,
          y = 420 + Math.floor(i / 8) * 55;
        drawConnectorConstructionRectangle(
          ctx,
          api,
          x,
          y,
          39,
          46,
          i < count ? themeColors.green : themeColors.muted,
          i < count ? themeColors.green : themeColors.panel,
        );
      }
      drawConnectorConstructionText(
        ctx,
        api,
        count + ' / ' + n + ' constructed',
        1510,
        rows === 4 ? 720 : 910,
        29,
        themeColors.green,
      );
    });
    if (currentBeat === 1) {
      api.focus.target('connector-feature-reader', () => {
        drawConnectorConstructionText(
          ctx,
          api,
          'One active query mixes all three abstract values',
          960,
          850,
          30,
          themeColors.ink,
        );
        drawConnectorConstructionText(
          ctx,
          api,
          'weights ' + weights.map((v) => v.toFixed(3)).join(' / '),
          960,
          920,
          30,
          themeColors.cyan,
        );
        drawConnectorConstructionText(
          ctx,
          api,
          'read [' + mixed.map((v) => v.toFixed(3)).join(', ') + ']',
          960,
          980,
          31,
          themeColors.green,
        );
      });
    } else
      drawConnectorConstructionText(
        ctx,
        api,
        'The encoder still supplies all 576 input features.',
        960,
        1010,
        27,
        themeColors.muted,
      );
  }
}
export default {
  id: 'connector',
  draw: drawConnector,
  cues: [
    'connector-project-width',
    'connector-preserve-positions',
    'connector-read-queries',
    'connector-configured-resampler',
    'connector-probe-trace',
    'connector-probe-key',
    'connector-check-source',
    'connector-name',
  ],
};
