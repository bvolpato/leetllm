import { directed, extendedSqlState } from '../construction.mjs';
import { cosine } from '../arithmetic.mjs';
import { drawSqlText } from '../defaults.mjs';

const query = [1, 0];
const atRun = [
  { id: 'emb-17', chunk: 'c7c', model: 'coat-v1', vector: [1, 0] },
  { id: 'emb-12', chunk: 'c7d', model: 'coat-v1', vector: [3, 4] },
];
const later = { id: 'emb-18', chunk: 'c7c', model: 'coat-v2', vector: [0, 1] };

function drawVector(ctx, api, x, y, id, vector, color) {
  drawSqlText(ctx, api, id + '   [' + vector.join(', ') + ']', x, y, 30, color);
  const ox = x + 105,
    oy = y + 155;
  api.line(ctx, ox - 42, oy, ox + 140, oy, api.C.muted, 2);
  api.line(ctx, ox, oy + 18, ox, oy - 127, api.C.muted, 2);
  api.arrow(ctx, ox, oy, ox + vector[0] * 108, oy - vector[1] * 108, color, 6);
  api.arrow(ctx, ox, oy + 28, ox + 108, oy + 28, api.C.yellow, 4);
  drawSqlText(ctx, api, 'q', ox + 123, oy + 35, 24, api.C.yellow);
}

export function drawLineageVersion(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  drawSqlText(
    ctx,
    api,
    'Saved run R1   /   query (1, 0)   /   ' +
      atRun[0].id +
      ' ranked first   /   cosine ' +
      cosine(query, atRun[0].vector),
    145,
    282,
    32,
    C.blue,
  );
  if (beat === 0) {
    const m = extendedSqlState('lineage-version', state);
    const original = atRun[0];
    const overwritten = m.changed ? later.vector : original.vector;
    api.focus.target('overwritten-vector', () => {
      drawSqlText(ctx, api, 'Update the existing row', 150, 402, 34, C.ink);
      api.line(ctx, 150, 435, 850, 435, C.muted, 2);
      drawVector(ctx, api, 180, 530, original.id, overwritten, C.cyan);
      drawSqlText(ctx, api, original.chunk + '   /   ' + original.model, 180, 766, 27, C.muted);
      drawSqlText(ctx, api, 'R1 → emb-17', 148, 815, 32, C.blue);
      if (m.changed && directed(state, 'recompute-old-score', 0, 0.4, 0.5) === 1)
        drawSqlText(
          ctx,
          api,
          'Cosine on today’s row   ' + cosine(query, overwritten),
          148,
          895,
          33,
          C.yellow,
        );
    });
    api.focus.target('versioned-vectors', () => {
      drawSqlText(ctx, api, 'Start again from the original row', 1000, 402, 34, C.ink);
      api.line(ctx, 1000, 435, 1760, 435, C.muted, 2);
      if (m.repaired) {
        drawVector(ctx, api, 1015, 530, original.id, original.vector, C.cyan);
        drawVector(ctx, api, 1420, 530, later.id, later.vector, C.green);
        drawSqlText(ctx, api, original.chunk + '   /   ' + original.model, 1015, 766, 27, C.cyan);
        drawSqlText(ctx, api, later.chunk + '   /   ' + later.model, 1420, 766, 27, C.green);
        drawSqlText(ctx, api, 'R1 → emb-17', 1000, 815, 32, C.blue);
        drawSqlText(ctx, api, 'Score on retained row: ' + m.savedScore, 1000, 895, 33, C.cyan);
      }
    });
  } else if (beat === 1) {
    drawSqlText(
      ctx,
      api,
      'At the time of R1   /   dataset v1   /   query encoder coat-v1',
      145,
      396,
      33,
      C.ink,
    );
    api.focus.target('ranked-records', () => {
      api.line(ctx, 145, 495, 1770, 495, C.muted, 2);
      const columns = [160, 375, 640, 850, 1245, 1530];
      ['Run', 'Query', 'Rank', 'Embedding', 'Chunk', 'Cosine'].forEach((label, i) => {
        drawSqlText(ctx, api, label, columns[i], 468, 29, C.muted);
      });
      atRun.forEach((row, rank) => {
        const fields = [
          'R1',
          'coat',
          rank + 1,
          row.id,
          row.chunk,
          cosine(query, row.vector).toFixed(2),
        ];
        fields.forEach((value, i) =>
          drawSqlText(ctx, api, String(value), columns[i], 575 + 96 * rank, 37, C.ink),
        );
      });
      api.line(ctx, 145, 730, 1770, 730, C.muted, 2);
      drawSqlText(
        ctx,
        api,
        'Created after R1    ' + later.id + '   /   ' + later.chunk + '   /   ' + later.model,
        160,
        789,
        29,
        C.muted,
      );
      if (directed(state, 'protect-rank', 1) === 1)
        drawSqlText(
          ctx,
          api,
          'One row per (run, query, rank)     ·     rank > 0     ·     one copy of each embedding per query',
          145,
          866,
          28,
          C.blue,
        );
    });
  } else {
    const relabeled = directed(state, 'change-judgment', 2) === 1;
    const judged = directed(state, 'recompute-hit', 3) === 1;
    const result = atRun[0].chunk;
    drawSqlText(
      ctx,
      api,
      'Top result  /  emb-17  →  ' + result + '  /  Harbor deadline',
      145,
      405,
      37,
      C.ink,
    );
    api.focus.target('judged-reports', () => {
      const columns = [145, 650, 1195, 1490];
      const header = ['Report', 'Relevant chunk', 'Returned', 'Hit@1'];
      header.forEach((h, i) => drawSqlText(ctx, api, h, columns[i], 523, 27, C.muted));
      api.line(ctx, 145, 554, 1770, 554, C.muted, 2);
      const report = (y, version, relevant, showHit) => {
        const values = [
          version,
          relevant,
          result,
          showHit ? String(Number(relevant === result)) : '…',
        ];
        values.forEach((v, i) =>
          drawSqlText(ctx, api, v, columns[i], y, 36, i === 3 ? C.yellow : C.ink),
        );
      };
      report(650, 'Labels v1', 'c7c', directed(state, 'first-judgment', 2) === 1);
      if (relabeled) report(780, 'Labels v2', 'c7e', judged);
    });
    drawSqlText(ctx, api, 'Same saved ranking   ·   one evaluation query', 145, 915, 29, C.blue);
  }
}

export default {
  id: 'lineage-version',
  draw: drawLineageVersion,
  cues: [
    'lineage-version-step-0-1',
    'recompute-old-score',
    'lineage-version-step-0-5',
    'protect-rank',
    'first-judgment',
    'change-judgment',
    'recompute-hit',
  ],
};
