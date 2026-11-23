import { accEvent } from '../construction.mjs';
import {
  drawArrow,
  drawCard,
  drawCenteredText,
  drawFooter,
  drawLine,
  drawPanel,
  drawText,
} from '../defaults.mjs';
export function drawProgrammingDepth(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => accEvent(scene, state, name, beat),
    resultComplete = (name, beat) => ev(name, beat) === 1,
    B = (name, beat) => ev(name, beat) > 0;
  api.focus.target('programming-depth-mechanism', () => {
    if (currentBeat === 0) {
      drawCenteredText(
        ctx,
        api,
        'Same verified matrix product · change the control surface',
        960,
        285,
        32,
        themeColors.yellow,
      );
      const levels = [
        ['Graph / library', 'capture · specialization', 'configuration'],
        ['Compiler', 'layout · fusion', 'configuration'],
        ['Portable tile code', 'grid · block mapping', 'dsl'],
        ['Hardware code', 'memory · synchronization', 'hardware'],
      ];
      const selected = B('hardware', 0)
        ? 3
        : B('dsl', 0)
          ? 2
          : B('configuration', 0)
            ? Math.min(1, Math.floor(ev('configuration', 0) * 2))
            : -1;
      levels.forEach(([name, choice], i) => {
        const y = 360 + i * 145,
          col = i === selected ? themeColors.yellow : themeColors.muted;
        drawCard(ctx, api, name, 130, y, 600, 105, col, 31);
        if (i === selected) {
          drawArrow(ctx, api, 760, y + 52, 780, y + 52, themeColors.yellow);
          drawText(ctx, api, choice, 800, y + 62, 25, themeColors.yellow);
        }
      });
      drawPanel(ctx, api, 1370, 420, 390, 380, themeColors.cyan);
      drawCenteredText(ctx, api, 'Required Y', 1565, 475, 32, themeColors.cyan);
      [
        ['19', '22'],
        ['43', '50'],
      ].forEach((row, i) =>
        row.forEach((v, k) =>
          drawCard(ctx, api, v, 1400 + k * 170, 535 + i * 110, 150, 90, themeColors.cyan, 34),
        ),
      );
      drawCenteredText(ctx, api, 'Retain output checks', 1565, 875, 27, themeColors.cyan);
    } else if (currentBeat === 1) {
      drawCenteredText(
        ctx,
        api,
        'Same program + same required output · new backend needs new evidence',
        960,
        285,
        30,
        themeColors.yellow,
      );
      drawCard(
        ctx,
        api,
        'Existing local toy calculation',
        150,
        390,
        700,
        125,
        themeColors.blue,
        32,
      );
      drawCard(
        ctx,
        api,
        B('platform', 1) ? 'Proposed backend · not executed' : 'Proposed backend',
        1070,
        390,
        700,
        125,
        themeColors.yellow,
        32,
      );
      drawCard(ctx, api, 'Y = [[19,22],[43,50]]', 150, 620, 700, 125, themeColors.cyan, 35);
      drawCard(
        ctx,
        api,
        'Operation / shape / memory checks pending',
        1070,
        620,
        700,
        125,
        themeColors.pink,
        31,
      );
      if (B('platform', 1))
        drawCenteredText(
          ctx,
          api,
          'Similar grid vocabulary cannot establish a compatible physical mapping',
          960,
          900,
          31,
          themeColors.pink,
        );
    } else if (currentBeat === 2) {
      drawCenteredText(
        ctx,
        api,
        'Concrete diagnosed failure · same 64 owned values',
        960,
        285,
        34,
        themeColors.yellow,
      );
      const repaired = resultComplete('repair', 2),
        included = repaired ? 64 : 32,
        result = (included * (included + 1)) / 2;
      teaching.grid({
        x: 160,
        y: 380,
        width: 1600,
        height: 270,
        rows: 4,
        columns: 16,
        labels: Array.from(
          {
            length: 4,
          },
          (_, r) =>
            Array.from(
              {
                length: 16,
              },
              (_, k) => r * 16 + k + 1,
            ),
        ),
        fill: themeColors.panel,
        stroke: themeColors.muted,
        fontSize: 26,
        highlights: Array.from(
          {
            length: 64,
          },
          (_, i) => ({
            row: Math.floor(i / 16),
            column: i % 16,
            fill: i < included ? '#79aaff22' : '#ef9ac822',
            stroke: i < included ? themeColors.blue : themeColors.pink,
          }),
        ),
      });
      drawCenteredText(
        ctx,
        api,
        repaired
          ? 'Ownership repaired · 64 inputs → ' + result
          : 'Old 32-lane mask → ' + result + ' partial; required 2,080',
        960,
        750,
        35,
        repaired ? themeColors.green : themeColors.pink,
      );
      const rows = [
        ['rejected block', 'legal shape + mask'],
        ['extra HBM traffic', 'tile / lifetime test'],
        ['CPU fallback', 'operation trace'],
        ['collective startup', 'physical rank route'],
      ];
      rows.forEach(([a, z], i) =>
        drawCard(ctx, api, a + '\n' + z, 150 + i * 435, 850, 405, 120, themeColors.cyan, 25),
      );
    } else if (currentBeat === 3) {
      const ref = 19,
        tolerance = 0.01 + 0.002 * Math.abs(ref);
      const position = (error) => 355 + (error + 0.09) * 7900;
      const y = 590;
      drawText(ctx, api, 'Reference Y₀₀ = 19', 145, 300, 45);
      drawText(
        ctx,
        api,
        'Allowed error   0.01 + 0.002 × |19| = ' + tolerance.toFixed(3),
        145,
        402,
        39,
        themeColors.cyan,
      );
      api.rect(
        ctx,
        position(-tolerance),
        y - 22,
        position(tolerance) - position(-tolerance),
        44,
        '#194238',
        undefined,
        0,
      );
      drawLine(ctx, api, position(-0.09), y, position(0.09), y, themeColors.muted, 3);
      for (const error of [-tolerance, 0, tolerance]) {
        const px = position(error);
        drawLine(ctx, api, px, y - 34, px, y + 35, themeColors.cyan, 4);
        drawCenteredText(ctx, api, (ref + error).toFixed(3), px, y + 94, 31, themeColors.cyan);
      }
      const within = B('within', 3),
        beyond = B('beyond', 3);
      if (within || beyond) {
        const value = beyond ? 19.08 : 19.04;
        const error = Math.abs(value - ref);
        const accepted = error <= tolerance;
        const col = accepted ? themeColors.green : themeColors.pink;
        const px = position(value - ref);
        api.circle(ctx, px, y, 18, col);
        drawCenteredText(ctx, api, String(value), px, y - 59, 40, col);
        drawCenteredText(
          ctx,
          api,
          'Error ' +
            error.toFixed(3) +
            (accepted ? '   ·   within tolerance' : '   ·   outside tolerance'),
          960,
          856,
          44,
          col,
        );
      }
    } else {
      const workspace = 3 + 2 * ev('burst', 4),
        used = 16 + 4 + workspace;
      const x = 155,
        scale = 60,
        limit = x + 24 * scale;
      drawText(ctx, api, 'One device   ·   24 GB available', 145, 306, 44);
      let left = x;
      for (const [label, gb, col] of [
        ['Weights', 16, themeColors.blue],
        ['KV pool', 4, themeColors.cyan],
        ['Workspace', workspace, themeColors.yellow],
      ]) {
        api.rect(ctx, left, 500, gb * scale, 106, col, undefined, 0);
        drawCenteredText(
          ctx,
          api,
          gb.toFixed(Number.isInteger(gb) ? 0 : 1) + ' GB',
          left + (gb * scale) / 2,
          568,
          35,
          themeColors.bg,
        );
        drawCenteredText(ctx, api, label, left + (gb * scale) / 2, 697, 32, col);
        left += gb * scale;
      }
      drawLine(ctx, api, limit, 427, limit, 632, themeColors.pink, 5);
      drawCenteredText(ctx, api, '24 GB limit', limit, 399, 31, themeColors.pink);
      drawCenteredText(
        ctx,
        api,
        used.toFixed(Number.isInteger(used) ? 0 : 1) +
          ' GB allocated' +
          (used > 24 ? '   ·   exceeds capacity' : ''),
        960,
        863,
        48,
        used > 24 ? themeColors.pink : themeColors.green,
      );
    }
    if (currentBeat < 3)
      drawFooter(
        ctx,
        api,
        'Schematic control choices; preserve the actual workload, output checks and one changed variable',
      );
  });
}
export default {
  id: 'programming-depth',
  draw: drawProgrammingDepth,
  cues: [
    'ag-programming-depth-configuration',
    'ag-programming-depth-dsl',
    'ag-programming-depth-hardware',
    'ag-programming-depth-platform',
    'ag-programming-depth-repair',
    'ag-programming-depth-controlled',
    'ag-programming-depth-within',
    'ag-programming-depth-beyond',
    'ag-programming-depth-burst',
  ],
};
