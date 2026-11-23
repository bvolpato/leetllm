import { DASHBOARD, PATCH_SIZE } from '../fixtures.mjs';
import { originalKey } from '../chart-reading.mjs';
import { TRACKS, chartEvidence } from '../model.mjs';
import { drawOriginalCard, text as drawOriginalText } from '../defaults.mjs';
export function drawPatches(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0;
  const progress2 = api.clamp(state.beatP ?? 0);
  const show = (index, from = 0.1, to = 0.82) =>
    beat > index ? 1 : beat < index ? 0 : api.phase(progress2, from, to);
  const snapshot = TRACKS['patches'].sample({
    beat,
    beatP: progress2,
  }).snapshot;
  const lineSeries = DASHBOARD.series.map((series) => ({
    ...series,
    color: themeColors[series.tone],
  }));
  const evidence = chartEvidence();
  const points = (series) =>
    series.values.map((y, index) => ({
      x: DASHBOARD.hours[index],
      y,
    }));
  {
    const side = snapshot.side;
    const patchesPerSide = snapshot.perSide;
    const gridSize = 480,
      x = 160,
      y = 370;
    const cellLabel = Array.from(
      {
        length: patchesPerSide,
      },
      () =>
        Array.from(
          {
            length: patchesPerSide,
          },
          () => '',
        ),
    );
    drawOriginalText(
      ctx,
      api,
      'Same chart · trace crop',
      x + gridSize / 2,
      320,
      31,
      themeColors.ink,
      'center',
    );
    api.focus.target('patches-celllabel', () =>
      teaching.grid({
        x,
        y,
        width: gridSize,
        height: gridSize,
        rows: patchesPerSide,
        columns: patchesPerSide,
        labels: cellLabel,
        fill: 'transparent',
        stroke: '#38536b',
        lineWidth: 1,
        fontSize: 1,
        textColor: themeColors.muted,
      }),
    );
    const cropPoint = (point) => ({
      x:
        x +
        16 +
        ((point.x - DASHBOARD.hours[0]) / (DASHBOARD.hours.at(-1) - DASHBOARD.hours[0])) *
          (gridSize - 32),
      y: y + 16 + ((10 - point.y) / 10) * (gridSize - 32),
    });
    lineSeries.forEach((series) =>
      api.path(ctx, points(series).map(cropPoint), {
        color: series.color,
        width: 6,
      }),
    );
    const markerX = cropPoint(evidence.before).x;
    api.line(ctx, markerX, y + 16, markerX, y + gridSize - 16, themeColors.yellow, 2);
    drawOriginalCard(ctx, api, `${side} × ${side} image`, 740, 395, 400, 92, themeColors.blue, 32);
    drawOriginalCard(
      ctx,
      api,
      `${patchesPerSide} patches per side`,
      740,
      555,
      400,
      92,
      themeColors.yellow,
      30,
    );
    drawOriginalCard(
      ctx,
      api,
      `${snapshot.count} visual tokens`,
      740,
      715,
      400,
      92,
      themeColors.green,
      32,
      show(1, 0.12, 0.7),
    );
    drawOriginalText(
      ctx,
      api,
      'Chart key outside the crop',
      1500,
      365,
      29,
      themeColors.ink,
      'center',
    );
    lineSeries.forEach((series, index) =>
      drawOriginalText(ctx, api, originalKey[index], 1500, 445 + index * 80, 32, series.color, 'center'),
    );
    drawOriginalText(ctx, api, 'Time runs left → right', 1500, 705, 27, themeColors.ink, 'center');
    drawOriginalText(
      ctx,
      api,
      [DASHBOARD.hours[0], evidence.before.x, DASHBOARD.hours.at(-1)]
        .map((hour) => `${hour} pm`)
        .join('       '),
      1500,
      755,
      27,
      themeColors.yellow,
      'center',
    );
    drawOriginalText(ctx, api, 'Value range: 0 to 10', 1500, 815, 27, themeColors.muted, 'center');
    if (beat === 2) {
      const cell = gridSize / patchesPerSide;
      const selected = [evidence.points[0], evidence.points[1], evidence.points.at(-1)];
      selected.forEach((point, index) => {
        const pixel = cropPoint(point),
          column = Math.min(patchesPerSide - 1, Math.floor((pixel.x - x) / cell)),
          row = Math.min(patchesPerSide - 1, Math.floor((pixel.y - y) / cell)),
          source = {
            x: x + (column + 0.5) * cell,
            y: y + (row + 0.5) * cell,
          },
          target = {
            x: 1300 + index * 160,
            y: 872,
          },
          progress = api.clamp(((progress2 - 0.05) / 0.65) * 3 - index);
        api.rect(
          ctx,
          x + column * cell,
          y + row * cell,
          cell,
          cell,
          '#163d2b',
          themeColors.green,
          0,
        );
        const route = [
          source,
          {
            x: 105,
            y: source.y,
          },
          {
            x: 105,
            y: 840,
          },
          {
            x: target.x,
            y: 840,
          },
          {
            x: target.x,
            y: target.y - 31,
          },
        ];
        api.path(ctx, route, {
          color: themeColors.green,
          width: 1,
        });
        const moving = api.pointAlongPath(route, progress);
        api.circle(ctx, moving.x, moving.y, 6, themeColors.yellow);
        drawOriginalCard(
          ctx,
          api,
          `r${row} c${column}`,
          target.x - 73,
          target.y - 23,
          146,
          46,
          themeColors.green,
          24,
          progress >= 1 ? 1 : 0.3,
        );
      });
      drawOriginalText(
        ctx,
        api,
        'Same patch positions → sequence entries',
        1500,
        942,
        25,
        themeColors.green,
        'center',
      );
    }
    drawOriginalText(
      ctx,
      api,
      `Patch size ${PATCH_SIZE} × ${PATCH_SIZE} pixels`,
      960,
      925,
      31,
      themeColors.cyan,
      'center',
    );
    drawOriginalText(
      ctx,
      api,
      `${patchesPerSide} × ${patchesPerSide} = ${snapshot.count}`,
      960,
      985,
      34,
      themeColors.ink,
      'center',
    );
  }
}
export default {
  id: 'patches',
  draw: drawPatches,
  cues: [
    'patches-beat-1-focus-1',
    'patches-beat-1-focus-2',
    'patches-beat-2-focus-1',
    'patches-beat-2-focus-2',
    'patches-beat-3-focus-1',
    'patches-beat-3-focus-2',
  ],
};
