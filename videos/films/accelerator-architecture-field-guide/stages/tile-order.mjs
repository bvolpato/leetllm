import { traversal } from '../arithmetic.mjs';
import { accEvent } from '../construction.mjs';
import { drawOriginalEquation, drawOriginalText } from '../defaults.mjs';

function drawRouteCost(ctx, api, x, route, activationKiB, weightKiB) {
  const { C, rect, text } = api;
  const left = x + 45;
  const scale = 16;
  const activationWidth = route.xLoads * activationKiB * scale;
  const weightWidth = route.wLoads * weightKiB * scale;
  text(ctx, route.xLoads + ' activation loads × ' + activationKiB + ' KiB', left, 659, 38, C.cyan);
  text(ctx, route.wLoads + ' weight loads × ' + weightKiB + ' KiB', left, 724, 38, C.pink);
  rect(ctx, left, 767, activationWidth, 45, C.cyan, undefined, 0);
  rect(ctx, left + activationWidth, 767, weightWidth, 45, C.pink, undefined, 0);
  text(ctx, route.kib + ' KiB', left, 921, 82, C.ink);
}

export function drawTileOrder(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    walks = ['columns', 'rows'].map(
      (name) => 2 * accEvent(scene, state, name, 1) + 2 * accEvent(scene, state, name + '-end', 1),
    );
  const compareSizes = state.beat === 2;
  const activationKiB =
    accEvent(scene, state, 'compare', 2) === 1
      ? 8
      : accEvent(scene, state, 'equal', 2) === 1
        ? 4
        : 1;
  const weightKiB = 4;
  api.focus.target('tile-visits', () => {
    const sub = ['₀', '₁'];
    walks.forEach((walk, i) => {
      const row = traversal(i, Math.floor(walk), activationKiB, weightKiB);
      const x = 150 + i * 880,
        color = i ? themeColors.cyan : themeColors.blue;
      const tiles = [];
      drawOriginalText(
        ctx,
        api,
        i ? 'Down the rows' : 'Across the columns',
        x + 365,
        285,
        30,
        color,
        'center',
      );
      row.route.forEach(([r, col], visit) => {
        const painted = visit < row.count,
          active = visit === row.count - 1;
        tiles.push(
          api.focus.target('tile-order-visit-1-y-sub-r-sub-col', () =>
            components.card({
              x: x + 120 + col * 270,
              y: 335 + r * 135,
              width: 230,
              height: 110,
              label: visit + 1 + ' · Y' + sub[r] + sub[col],
              fontSize: 36,
              fill: painted ? (active ? '#f4d47722' : '#79aaff18') : themeColors.panel,
              stroke: active ? themeColors.yellow : painted ? color : themeColors.muted,
              textColor: painted ? themeColors.ink : themeColors.muted,
              padding: 12,
            }),
          ),
        );
      });
      if (compareSizes) {
        drawRouteCost(ctx, api, x, row, activationKiB, weightKiB);
        return;
      }
      if (row.count < 2)
        drawOriginalText(
          ctx,
          api,
          'Visit numbers preserve each route',
          x + 365,
          625,
          26,
          themeColors.muted,
          'center',
        );
      if (row.current) {
        const e = row.current;
        api.focus.target('tile-order-math-y-x-w', () =>
          drawOriginalEquation(
            ctx,
            api,
            String.raw`Y_{${e.i},${e.j}}=X_{${e.i}}W_{${e.j}}`,
            x + 365,
            685,
            41,
          ),
        );
        drawOriginalText(
          ctx,
          api,
          'X' +
            sub[e.i] +
            ': ' +
            (e.xLoad ? 'load 1 KiB' : 'reuse resident') +
            ' · W' +
            sub[e.j] +
            ': ' +
            (e.wLoad ? 'load 4 KiB' : 'reuse resident'),
          x + 365,
          740,
          25,
          themeColors.ink,
          'center',
        );
        if (row.count < 4 && walk > row.count) {
          const route = api.connect(ctx, tiles[row.count - 1], tiles[row.count], {
            color: themeColors.yellow,
            width: 3,
            gap: 8,
          });
          const travel = walk - row.count;
          if (travel > 0 && travel < 1) {
            const px = route.from.x + (route.to.x - route.from.x) * travel,
              py = route.from.y + (route.to.y - route.from.y) * travel;
            api.circle(ctx, px, py, 7, themeColors.yellow, themeColors.bg, 2);
          }
        }
        if (row.count > 1) {
          drawOriginalText(
            ctx,
            api,
            !e.wLoad
              ? 'W' + sub[e.j] + ' stays resident'
              : !e.xLoad
                ? 'X' + sub[e.i] + ' stays resident'
                : 'Both operands reload',
            x + 365,
            625,
            26,
            themeColors.yellow,
            'center',
          );
        }
      } else
        drawOriginalText(
          ctx,
          api,
          'Resident operands are initially empty',
          x + 365,
          700,
          29,
          themeColors.muted,
          'center',
        );
      drawOriginalText(
        ctx,
        api,
        'X loads ' + row.xLoads + ' · W loads ' + row.wLoads + ' · ' + row.kib + ' KiB',
        x + 365,
        795,
        34,
        themeColors.yellow,
        'center',
      );
      row.route.forEach(([r, col], visit) => {
        const event = row.events[visit],
          sx = x + 10 + visit * 182;
        api.focus.target('tile-order-visit-1-x-sub-r-w-sub-col', () =>
          components.card({
            x: sx,
            y: 835,
            width: 166,
            height: 62,
            label: visit + 1 + ': X' + sub[r] + ' W' + sub[col],
            fontSize: 25,
            fill: themeColors.panel,
            stroke: event ? color : themeColors.muted,
            textColor: event ? themeColors.ink : themeColors.muted,
            padding: 8,
          }),
        );
        drawOriginalText(
          ctx,
          api,
          event ? '+' + event.addedKiB + ' KiB' : 'planned',
          sx + 83,
          935,
          26,
          event ? color : themeColors.muted,
          'center',
        );
      });
    });
    drawOriginalText(
      ctx,
      api,
      'One tile of each kind fits locally   ·   Activation ' +
        activationKiB +
        ' KiB   ·   Weight ' +
        weightKiB +
        ' KiB',
      960,
      1005,
      27,
      themeColors.muted,
      'center',
    );
  });
}
export default {
  id: 'tile-order',
  draw: drawTileOrder,
  cues: [
    'ag-tile-order-sizes',
    'ag-tile-order-columns',
    'ag-tile-order-columns-end',
    'ag-tile-order-rows',
    'ag-tile-order-rows-end',
    'ag-tile-order-equal',
    'ag-tile-order-compare',
  ],
};
