import { sampleDeepGemmVisual } from '../construction.mjs';
import { drawOriginalEquation, drawOriginalText } from '../defaults.mjs';
export function drawDot(ctx, scene, state, api) {
  return api.focus.target('dot-construction', () => {
    const { C: themeColors, teaching: teaching } = api,
      modelState = sampleDeepGemmVisual('dot', state),
      currentBeat = modelState.b;
    {
      if (currentBeat === 2) {
        const { a, z, result, completed, i, j, coordinates, partial } = modelState.tile;
        drawOriginalText(
          ctx,
          api,
          'One staged operand tile → four row pairings',
          960,
          285,
          37,
          themeColors.blue,
          'center',
        );
        const grid = (values, x, color, highlights = []) =>
          teaching.grid({
            x,
            y: 420,
            width: 420,
            height: 240,
            rows: 2,
            columns: 2,
            labels: values,
            fontSize: 40,
            fill: themeColors.panel,
            stroke: color,
            textColor: themeColors.ink,
            highlights,
          });
        api.focus.target(
          'dot-grid-a-180-c-blue-0-1-map-column-row-i-column-fill-c-panel-stroke-c',
          () =>
            grid(
              a,
              180,
              themeColors.blue,
              [0, 1].map((column) => ({
                row: i,
                column,
                fill: themeColors.panel,
                stroke: themeColors.yellow,
              })),
            ),
        );
        grid(
          z,
          750,
          themeColors.pink,
          [0, 1].map((column) => ({
            row: j,
            column,
            fill: themeColors.panel,
            stroke: themeColors.yellow,
          })),
        );
        grid(
          result.map((row, r) => row.map((value, c) => (r * 2 + c < completed ? value : '·'))),
          1320,
          themeColors.green,
        );
        drawOriginalText(ctx, api, 'A · activation rows', 390, 370, 29, themeColors.blue, 'center');
        drawOriginalText(
          ctx,
          api,
          'B · stored weight rows',
          960,
          370,
          29,
          themeColors.pink,
          'center',
        );
        drawOriginalText(ctx, api, 'D = A Bᵀ', 1530, 370, 29, themeColors.green, 'center');
        drawOriginalText(
          ctx,
          api,
          'Reuse staged row ' + i + ' with weight row ' + j,
          960,
          790,
          34,
          themeColors.yellow,
          'center',
        );
        drawOriginalEquation(
          ctx,
          api,
          'S_{' +
            i +
            ',' +
            j +
            '}^{(' +
            coordinates +
            ')}=' +
            (coordinates
              ? a[i]
                  .slice(0, coordinates)
                  .map((v, k) => '(' + v + ')(' + z[j][k] + ')')
                  .join('+')
              : '0') +
            '=' +
            partial,
          960,
          890,
          45,
        );
        drawOriginalText(
          ctx,
          api,
          completed +
            ' / 4 outputs complete · current pair ' +
            coordinates +
            ' / 2 coordinates included',
          960,
          990,
          28,
          themeColors.muted,
          'center',
        );
        return;
      }
      drawOriginalText(
        ctx,
        api,
        'One activation row × one stored weight row',
        960,
        285,
        37,
        themeColors.blue,
        'center',
      );
      api.focus.target('dot-s-a', () =>
        teaching.grid({
          x: 320,
          y: 390,
          width: 480,
          height: 130,
          rows: 1,
          columns: 2,
          labels: [modelState.a],
          fontSize: 45,
          fill: themeColors.panel,
          stroke: themeColors.blue,
          textColor: themeColors.ink,
        }),
      );
      teaching.grid({
        x: 1120,
        y: 390,
        width: 480,
        height: 130,
        rows: 1,
        columns: 2,
        labels: [modelState.z],
        fontSize: 45,
        fill: themeColors.panel,
        stroke: themeColors.pink,
        textColor: themeColors.ink,
      });
      modelState.products.forEach((v, i) => {
        drawOriginalText(
          ctx,
          api,
          i < modelState.count
            ? `${modelState.a[i]} × ${modelState.z[i]} = ${v}`
            : 'matching coordinate',
          560 + i * 800,
          670,
          37,
          i < modelState.count ? themeColors.cyan : themeColors.muted,
          'center',
        );
      });
      drawOriginalEquation(
        ctx,
        api,
        modelState.count === 2
          ? String.raw`D_{ij}=\sum_{k=0}^{1} A_{ik}B_{jk}=${modelState.total}`
          : String.raw`S_{${modelState.count}}=\sum_{k=0}^{${modelState.count}-1} A_{ik}B_{jk}=${modelState.total}`,
        960,
        845,
        55,
      );
      drawOriginalText(
        ctx,
        api,
        modelState.count === 2
          ? 'Complete dot product · both coordinates included'
          : `Running partial sum · ${modelState.count} of 2 coordinates included`,
        960,
        920,
        29,
        themeColors.cyan,
        'center',
      );
    }
  });
}
export default {
  id: 'dot',
  draw: drawDot,
  cues: [
    'dot-beat-1-focus-1',
    'dg-dot-0-0',
    'dg-dot-0-1',
    'dg-dot-0-2',
    'dg-dot-0-3',
    'dot-beat-2-focus-1',
    'dg-dot-1-0',
    'dg-dot-1-1',
    'dg-dot-1-2',
    'dot-beat-3-focus-1',
    'dot-beat-3-focus-2',
    'dg-dot-2-0',
    'dg-dot-2-1',
    'dg-dot-2-2',
    'dg-dot-2-3',
  ],
};
