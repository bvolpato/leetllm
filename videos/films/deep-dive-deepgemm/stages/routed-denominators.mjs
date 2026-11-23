import { packing } from '../arithmetic.mjs';
import { sampleDeepGemmChapter } from '../construction.mjs';
import { drawText } from '../defaults.mjs';
import { sentenceCues } from '../fixtures.mjs';

const format = (value) => value.toLocaleString('en-US');

function drawAssignments(ctx, api, model) {
  const { C } = api;
  const { g, topk } = model;
  drawText(ctx, api, 'Source token', 365, 414, 40, C.ink, 'center');
  api.rect(ctx, 207, 458, 316, 126, C.yellow, undefined, 10);
  drawText(ctx, api, 'Token 7', 365, 542, 57, C.bg, 'center');
  drawText(ctx, api, 'Selected experts', 1215, 235, 39, C.ink, 'center');
  for (let i = 0; i < topk; i++) {
    const p = Math.min(1, Math.max(0, g(0, 1) * 2 - i / (topk - 1)));
    if (p === 0) continue;
    const y = 316 + i * 101;
    const points = [
      { x: 536, y: 521 },
      { x: 738, y: 521 },
      { x: 738, y },
      { x: 1006, y },
    ];
    api.path(ctx, points, { color: C.muted, width: 3 });
    api.rect(ctx, 1020, y - 40, 390, 80, C.panel, C.blue, 8);
    drawText(ctx, api, 'Expert ' + String.fromCharCode(65 + i), 1308, y + 13, 34, C.ink, 'center');
    if (p > 0 && p < 1)
      api.components.particle({ points, progress: p, radius: 10, fill: C.yellow });
    if (p >= 1) {
      api.rect(ctx, 1033, y - 30, 151, 60, C.yellow, undefined, 5);
      drawText(ctx, api, 't7', 1108, y + 13, 36, C.bg, 'center');
    }
  }
  if (g(0, 3) > 0)
    drawText(
      ctx,
      api,
      model.experts +
        ' experts ÷ ' +
        model.ranks +
        ' ranks' +
        (g(0, 4) > 0 ? ' = ' + model.localExperts + ' experts per rank' : ''),
      960,
      984,
      44,
      C.cyan,
      'center',
    );
}

function drawRankCounts(ctx, api, model) {
  const { C } = api;
  const { g, sourcePerRank, ranks, source, topk, assignments, balanced } = model;
  const labelX = 155,
    valueX = 685;
  drawText(ctx, api, 'Source tokens', labelX, 351, 47);
  drawText(
    ctx,
    api,
    format(sourcePerRank) + ' × ' + ranks + ' ranks' + (g(1, 0) >= 1 ? ' = ' + format(source) : ''),
    valueX,
    351,
    54,
    C.cyan,
  );
  if (g(1, 1) > 0) {
    drawText(ctx, api, 'Expert assignments', labelX, 507, 47);
    drawText(
      ctx,
      api,
      format(source) +
        ' × ' +
        topk +
        ' selections' +
        (g(1, 1) >= 1 ? ' = ' + format(assignments) : ''),
      valueX,
      507,
      54,
      C.yellow,
    );
  }
  if (g(1, 2) <= 0) return;
  api.line(ctx, labelX, 583, 1755, 583, C.muted, 2);
  drawText(ctx, api, 'If routing is even', labelX, 682, 40);
  drawText(
    ctx,
    api,
    format(assignments) + ' ÷ ' + ranks + ' = ' + format(balanced) + ' rows per rank',
    valueX,
    682,
    46,
    C.ink,
  );
  const move = g(1, 3);
  if (move <= 0) return;
  for (let i = 0; i < 2; i++) {
    const x = 412 + i * 674;
    api.rect(ctx, x, 774, 420, 128, C.panel, C.blue, 8);
    const rows = balanced + (move >= 1 ? (i === 0 ? -1 : 1) : 0);
    drawText(ctx, api, 'Rank ' + i + '    ' + format(rows), x + 210, 856, 46, C.ink, 'center');
  }
  api.arrow(ctx, 834, 838, 1073, 838, C.muted, 3);
  if (move < 1) api.circle(ctx, 846 + 211 * move, 838, 11, C.yellow);
}

function drawProjectionWork(ctx, api, model) {
  const { C } = api;
  const g = (line) => model.g(2, line);
  const work = packing(128);
  drawText(ctx, api, 'Four local experts', 155, 283, 43);
  drawText(ctx, api, 'H = 4,096     I = 2,048', 1740, 283, 38, C.muted, 'right');
  if (g(1) > 0) {
    const expression =
      g(2) > 0 ? '4 M H I   +   2 M H I   =   6 M H I' : 'Gate and up projections     4 M H I';
    drawText(ctx, api, expression, 960, 413, 49, C.ink, 'center');
  }
  for (const [i, [name, rows, flops, color]] of [
    ['Useful rows', work.useful, work.usefulFlops, C.cyan],
    ['Reserved rows', work.capacity, work.paddedFlops, C.yellow],
  ].entries()) {
    const y = 533 + 190 * i;
    drawText(ctx, api, name, 155, y + 53, 41, color);
    api.rect(ctx, 480, y, (rows / work.capacity) * 950, 76, color, undefined, 3);
    drawText(ctx, api, String(rows), 500, y + 54, 43, C.bg);
    if (g(3) >= 1)
      drawText(ctx, api, (flops / 1e9).toFixed(2) + ' GFLOPs', 1740, y + 53, 37, color, 'right');
  }
  if (g(3) > 0)
    drawText(
      ctx,
      api,
      'The longer bar counts both multiplies on every reserved row',
      960,
      971,
      32,
      C.muted,
      'center',
    );
}

export function drawRoutedDenominators(ctx, scene, state, api) {
  const model = sampleDeepGemmChapter(scene.id, state);
  api.focus.target('routed-denominators-construction', () => {
    if (model.b === 0) drawAssignments(ctx, api, model);
    else if (model.b === 1) drawRankCounts(ctx, api, model);
    else drawProjectionWork(ctx, api, model);
  });
}
export default {
  id: 'routed-denominators',
  draw: drawRoutedDenominators,
  cues: [
    ...sentenceCues('routed-denominators'),
    ...[0, 1, 2].map((i) => 'routed-denominators-b' + i),
  ],
};
