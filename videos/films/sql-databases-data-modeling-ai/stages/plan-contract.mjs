import { lessonFont } from '../../../lib/fonts.mjs';
import { directed } from '../construction.mjs';
import { chunks, documents, permissions } from '../fixtures.mjs';
import { authorizedMatches } from '../model.mjs';
import { drawSqlText } from '../defaults.mjs';

const grants = permissions.filter(([, reader]) => reader === 'Bob');
const allowed = authorizedMatches();
const chunk = chunks.find((row) => row.id === allowed[0]);
const document = documents.find((row) => row.id === chunk.document);

function drawLookups(ctx, api, state) {
  const { C } = api;
  const chunkLookup = directed(state, 'lookup-chunk', 0, 0.42, 0.53);
  const docLookup = directed(state, 'lookup-document', 0, 0.54, 0.75);
  const sort = directed(state, 'sort-results', 0, 0.78, 0.93);
  const lines = [
    [
      'SEARCH p USING COVERING INDEX permission_principal_idx (principal=?)',
      'Bob  →  ' + chunk.id,
      C.yellow,
      true,
    ],
    [
      'SEARCH c USING INDEX sqlite_autoindex_chunks_1 (id=?)',
      chunk.id + '  →  ' + document.id,
      C.cyan,
      chunkLookup > 0,
    ],
    [
      'SEARCH d USING INDEX sqlite_autoindex_documents_1 (id=?)',
      document.id + '  →  ' + document.title,
      C.blue,
      docLookup > 0,
    ],
    ['USE TEMP B-TREE FOR ORDER BY', 'Sorted result rows', C.green, sort > 0],
  ];
  drawSqlText(ctx, api, 'SQLite query plan', 135, 298, 40, C.ink);
  drawSqlText(ctx, api, 'One matching paragraph', 1250, 298, 40, C.ink);
  lines.forEach(([plan, result, color, visible], i) => {
    const y = 422 + 146 * i;
    api.focus.target(
      ['principal-index', 'chunk-lookup', 'document-lookup', 'ordered-rows'][i],
      () => {
        api.text(ctx, plan, 135, y, 26, visible ? color : C.muted, 'left', 'mono');
        if (visible) drawSqlText(ctx, api, result, 1250, y, 41, color);
      },
    );
  });
}

function drawCandidates(ctx, api, state) {
  const { C } = api;
  const filtered = directed(state, 'filter-grants', 1, 0.2, 0.46);
  const fragment = directed(state, 'inside-word', 1, 0.48, 0.7);
  api.focus.target('reader-entries', () => {
    drawSqlText(ctx, api, 'Permission table', 140, 303, 36, C.muted);
    api.text(ctx, String(permissions.length), 140, 457, 144, C.ink, 'left', 'serif');
    drawSqlText(ctx, api, 'grants', 245, 451, 42, C.ink);
    drawSqlText(ctx, api, 'Index entries for Bob', 640, 303, 36, C.yellow);
    drawSqlText(ctx, api, grants.map(([id]) => id).join('   '), 640, 435, 38, C.yellow);
  });
  api.focus.target('current-paragraphs', () => {
    drawSqlText(ctx, api, 'Current at Harbor', 1390, 303, 36, C.cyan);
    if (filtered >= 1) drawSqlText(ctx, api, allowed.join('   '), 1390, 435, 45, C.cyan);
  });
  api.focus.target('substring', () => {
    const x = 140;
    drawSqlText(ctx, api, 'Substring search', x, 636, 36, C.muted);
    api.text(ctx, 'LIKE', x, 751, 50, C.muted, 'left', 'mono');
    api.text(ctx, "'%turn%'", x + 170, 751, 50, C.ink, 'left', 'mono');
    const term = 'turn',
      size = 48;
    const start = 800;
    api.text(ctx, chunk.text, start, 751, size, C.ink, 'left', 'mono');
    if (fragment > 0) {
      ctx.save();
      ctx.font = lessonFont(size, 'mono');
      const matchX = start + ctx.measureText(chunk.text.slice(0, chunk.text.indexOf(term))).width;
      const end = matchX + ctx.measureText(term).width * fragment;
      ctx.restore();
      api.line(ctx, matchX, 776, end, 776, C.yellow, 6);
    }
  });
}

function drawRollback(ctx, api, state) {
  const { C } = api;
  const renamed = directed(state, 'execute-rename', 2, 0.33, 0.53) === 1;
  const delivered = directed(state, 'deliver-email', 2, 0.51, 0.66) === 1;
  const rolledBack = directed(state, 'undo-title', 2, 0.69, 0.86) === 1;
  api.focus.target('plan-mode', () => {
    drawSqlText(
      ctx,
      api,
      'PostgreSQL    /    rename a policy in a transaction',
      140,
      295,
      36,
      C.muted,
    );
    api.text(ctx, 'EXPLAIN', 140, 408, 52, C.blue, 'left', 'mono');
    drawSqlText(ctx, api, 'Planned operations and estimated rows', 140, 477, 32, C.ink);
    api.text(ctx, 'EXPLAIN ANALYZE', 980, 408, 52, C.yellow, 'left', 'mono');
    drawSqlText(ctx, api, 'Execute and measure', 980, 477, 32, C.ink);
  });
  api.focus.target('stored-title', () => {
    api.line(ctx, 140, 590, 860, 590, C.cyan, 3);
    drawSqlText(ctx, api, 'Policy title', 140, 663, 38, C.cyan);
    api.text(
      ctx,
      renamed && !rolledBack ? 'Coat Returns' : 'Return Policy',
      140,
      785,
      75,
      C.ink,
      'left',
      'serif',
    );
    if (rolledBack) api.text(ctx, 'ROLLBACK', 140, 883, 34, C.cyan, 'left', 'mono');
  });
  api.focus.target('inbox', () => {
    api.line(ctx, 980, 590, 1765, 590, C.yellow, 3);
    drawSqlText(ctx, api, 'Recipient’s inbox', 980, 663, 38, C.yellow);
    if (delivered) {
      api.rect(ctx, 982, 716, 102, 72, C.panel, C.yellow, 4, 4);
      api.path(
        ctx,
        [
          { x: 983, y: 720 },
          { x: 1033, y: 754 },
          { x: 1082, y: 720 },
        ],
        { color: C.yellow, width: 4 },
      );
      drawSqlText(ctx, api, 'Policy renamed', 1125, 777, 51, C.ink);
    } else drawSqlText(ctx, api, 'Empty', 980, 777, 51, C.muted);
  });
}

export function drawPlanContract(ctx, scene, state, api) {
  const paintBeat = [drawLookups, drawCandidates, drawRollback][state.beat ?? 0];
  paintBeat(ctx, api, state);
}

export default {
  id: 'plan-contract',
  draw: drawPlanContract,
  cues: [
    'find-grant',
    'lookup-chunk',
    'lookup-document',
    'sort-results',
    'scan-search',
    'filter-grants',
    'inside-word',
    'compare-plans',
    'execute-rename',
    'deliver-email',
    'undo-title',
    'keep-message',
  ],
};
