import { cosine, completed, mix } from '../arithmetic.mjs';
import { directed } from '../construction.mjs';
import { semanticCandidates } from '../model.mjs';
import { drawSqlText } from '../defaults.mjs';

function drawDistanceExpression(ctx, api, expression, y, color) {
  // Paint the operator's three ASCII characters separately so the font preserves the SQL spelling.
  const [prefix, suffix] = expression.split('<=>');
  ctx.save();
  ctx.font = '500 29px "Lesson Mono"';
  const cell = ctx.measureText('0').width;
  ctx.restore();
  let x = 920;
  for (const part of [prefix, '<', '=', '>', suffix]) {
    api.text(ctx, part, x, y, 29, color, 'left', 'mono');
    x += cell * part.length;
  }
}

function drawTurn(ctx, api, state, rows) {
  const { C } = api;
  const row = rows.find((r) => r.chunk === 'c7e');
  const turn = directed(state, 'turn-query', 0);
  const q = [mix(1, 0, turn), mix(0, 2, turn)];
  const x = 485,
    y = 735,
    scale = 110;
  const [vx, vy] = row.vector;
  const dot = q[0] * vx + q[1] * vy;
  const score = cosine(q, row.vector);
  api.focus.target('query-axes', () => {
    drawSqlText(ctx, api, 'Same chunk  /  new query', 155, 285, 33, C.ink);
    api.line(ctx, 200, y, 800, y, C.muted, 2);
    api.line(ctx, x, 330, x, 835, C.muted, 2);
    for (const tick of [1, 2, 3])
      api.line(ctx, x - 8, y - tick * scale, x + 8, y - tick * scale, C.muted, 2);
    api.arrow(ctx, x, y, x + vx * scale, y - vy * scale, C.cyan, 6);
    drawSqlText(
      ctx,
      api,
      row.chunk + '  (−1, 3)',
      x + vx * scale - 15,
      y - vy * scale - 25,
      30,
      C.cyan,
      'center',
    );
    api.arrow(ctx, x, y, x + q[0] * scale, y - q[1] * scale, C.yellow, 6);
    drawSqlText(
      ctx,
      api,
      turn === 1 ? 'q  (0, 2)' : turn === 0 ? 'q  (1, 0)' : 'q',
      x + q[0] * scale + 30,
      y - q[1] * scale - 18,
      30,
      C.yellow,
    );
  });
  api.focus.target('cosine-operands', () => {
    drawSqlText(ctx, api, 'Harbor   /   clothing tags   /   Bob granted', 920, 375, 31, C.cyan);
    drawSqlText(ctx, api, 'Previous query', 920, 492, 28, C.muted);
    drawSqlText(ctx, api, 'cosine  ' + row.score.toFixed(3), 1280, 492, 36, C.ink);
    if (state.beat === 0) return;
    drawSqlText(ctx, api, 'New query', 920, 588, 28, C.muted);
    drawSqlText(ctx, api, '0 × (−1)  +  2 × 3  =  ' + dot, 1140, 588, 34, C.ink);
    drawSqlText(ctx, api, 'Lengths', 920, 682, 28, C.muted);
    drawSqlText(ctx, api, '2  ×  √10', 1140, 682, 34, C.ink);
    if (directed(state, 'new-vector-score', 1) === 1)
      drawSqlText(ctx, api, 'Cosine similarity   ' + score.toFixed(3), 920, 760, 34, C.yellow);
    const distance = 1 - score;
    if (directed(state, 'read-distance', 1, 0.72, 0.82) === 1) {
      drawDistanceExpression(ctx, api, 'embedding <=> query', 848, C.blue);
      drawSqlText(ctx, api, distance.toFixed(3) + '  distance', 1495, 848, 30, C.blue);
    }
    if (directed(state, 'recover-similarity', 1, 0.86, 0.96) === 1) {
      drawDistanceExpression(ctx, api, '1 - (embedding <=> query)', 926, C.yellow);
      drawSqlText(ctx, api, (1 - distance).toFixed(3) + '  similarity', 1495, 926, 30, C.yellow);
    }
  });
}

function drawEmbedding(ctx, api, rows) {
  const { C } = api;
  const row = rows.find((r) => r.chunk === 'c7e');
  api.focus.target('embedding-row', () => {
    drawSqlText(ctx, api, 'Stored embedding', 170, 365, 38, C.ink);
    const fields = [
      ['Embedding ID', row.id],
      ['Chunk', row.chunk],
      ['Model', row.model],
      ['Created', 'Aug 12'],
      ['Coordinates', row.vector.join(', ')],
    ];
    api.line(ctx, 170, 404, 1750, 404, C.cyan, 3);
    fields.forEach(([label, value], i) => {
      const x = 170 + i * 325;
      drawSqlText(ctx, api, label, x, 477, 28, C.muted);
      drawSqlText(ctx, api, value, x, 564, 39, C.ink);
    });
  });
  api.focus.target('query-model', () => {
    drawSqlText(ctx, api, 'Query input   →   query encoder', 170, 765, 32, C.yellow);
    drawSqlText(ctx, api, 'Document input   →   document encoder', 170, 857, 32, C.cyan);
    drawSqlText(ctx, api, 'Comparable coordinates in E1’s space', 955, 804, 34, C.ink);
    drawSqlText(ctx, api, 'Hand-chosen coordinates for the calculation', 170, 955, 28, C.muted);
  });
}

function drawScan(ctx, api, state, ranked) {
  const { C } = api;
  const exact = ranked.filter((r) => r.allowed).slice(0, 2);
  // A supplied graph-search trace makes the skipped exact neighbor inspectable.
  const example = ['c99', 'c7-old', 'c9a', 'c7d', 'c7e'].map((id) =>
    ranked.find((r) => r.chunk === id),
  );
  const prefix = directed(state, 'scan-prefix', 3, 0.08, 0.32);
  const extra = directed(state, 'continue-scan', 4, 0.12, 0.42);
  const seen = example.slice(0, completed(prefix, 3) + completed(extra, 2));
  const returned = seen.filter((r) => r.allowed).slice(0, 2);
  drawSqlText(
    ctx,
    api,
    'Original query (1, 0)   ·   Harbor   ·   Bob   ·   3 eligible chunks   ·   2 requested',
    145,
    270,
    31,
    C.ink,
  );
  api.focus.target('scan-visits', () => {
    drawSqlText(ctx, api, 'All six chunks in exact distance order', 145, 379, 32, C.ink);
    drawSqlText(ctx, api, 'Example HNSW visits', 145, 570, 30, C.muted);
    ranked.forEach((r, i) => {
      const x = 145 + i * 280;
      const visited = seen.some((v) => v.id === r.id);
      drawSqlText(ctx, api, r.chunk, x, 459, 33, C.cyan);
      drawSqlText(ctx, api, 'd = ' + (1 - r.score).toFixed(3), x, 505, 26, C.muted);
      api.line(ctx, x, 608, x + 170, 608, visited ? C.yellow : C.muted, visited ? 6 : 2);
      if (visited)
        drawSqlText(
          ctx,
          api,
          r.allowed ? 'eligible' : r.reason,
          x,
          675,
          27,
          r.allowed ? C.green : C.pink,
        );
    });
  });
  api.focus.target('neighbor-lists', () => {
    const names = { c7c: 'deadline', c7d: 'receipt', c7e: 'tags' };
    const list = (rows) => rows.map((r) => r.chunk + ' ' + names[r.chunk]).join('   /   ');
    drawSqlText(ctx, api, 'Exact allowed', 145, 808, 32, C.muted);
    drawSqlText(ctx, api, list(exact), 505, 808, 34, C.cyan);
    drawSqlText(ctx, api, 'Found and allowed', 145, 906, 32, C.muted);
    drawSqlText(ctx, api, list(returned) || '…', 505, 906, 34, C.green);
    if (directed(state, 'compare-neighbors', 4, 0.8, 0.96) === 1) {
      const common = exact.filter((r) => returned.some((v) => v.id === r.id)).length;
      drawSqlText(ctx, api, 'Recall@2   ' + common + ' / ' + exact.length, 1150, 905, 43, C.yellow);
    }
  });
}

export function drawVectorContract(ctx, scene, state, api) {
  const ranked = semanticCandidates();
  if (state.beat < 2) drawTurn(ctx, api, state, ranked);
  else if (state.beat === 2) drawEmbedding(ctx, api, ranked);
  else drawScan(ctx, api, state, ranked);
}

export default {
  id: 'vector-contract',
  draw: drawVectorContract,
  cues: [
    'turn-query',
    'new-vector-score',
    'read-distance',
    'recover-similarity',
    'match-encoder',
    'scan-prefix',
    'continue-scan',
    'compare-neighbors',
  ],
};
