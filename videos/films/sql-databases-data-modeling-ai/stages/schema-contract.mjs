import { directed } from '../construction.mjs';
import { drawSqlText } from '../defaults.mjs';

export function drawSchemaContract(ctx, scene, state, api) {
  const { C } = api;
  const phase = (id, beat) => directed(state, id, beat);
  if (state.beat === 0) {
    drawSqlText(ctx, api, 'Acme’s API policy  /  the same schema as Harbor', 135, 295, 33, C.ink);
    const tables = [
      ['Chunk permission', 'chunk + principal', 'c7a  ·  agent:u3'],
      ['Chunk', 'id  /  document', 'c7a  /  d7'],
      ['Document', 'id  /  workspace', 'd7  /  w01'],
      ['Workspace', 'id  /  name', 'w01  /  Acme Cloud'],
    ];
    api.focus.target('schema-links', () => {
      const trace = phase('follow-schema-links', 0) * 3;
      tables.forEach(([name, fields, values], i) => {
        const x = 135 + 433 * i;
        drawSqlText(ctx, api, name, x, 443, 32, C.cyan);
        api.rect(ctx, x, 491, 350, 157, C.panel, C.blue, 2, 5);
        drawSqlText(ctx, api, fields, x + 16, 540, 25, C.muted);
        drawSqlText(ctx, api, values, x + 16, 603, 29, C.ink);
        if (trace > i && i < 3)
          api.arrow(ctx, x + 357, 567, x + 357 + 65 * Math.min(1, trace - i), 567, C.cyan, 4);
      });
    });
    drawSqlText(
      ctx,
      api,
      'documents  /  source key, title, valid from, valid to',
      135,
      825,
      31,
      C.muted,
    );
  } else if (state.beat === 1) {
    const attempted = phase('try-declarations', 1);
    drawSqlText(
      ctx,
      api,
      'Independent inserts  /  d7 and d7-old already exist',
      135,
      290,
      33,
      C.ink,
    );
    api.focus.target('schema-inserts', () => {
      const labels = ['Chunk ID', 'Document ID', 'Paragraph text', 'Result'];
      const x = [135, 500, 850, 1420];
      labels.forEach((label, i) => drawSqlText(ctx, api, label, x[i], 426, 28, C.muted));
      api.line(ctx, 135, 460, 1775, 460, C.muted, 2);
      const tries = [
        ['NULL', 'd7', 'New text', 'ID required'],
        ['fresh ID', 'missing', 'New text', 'No parent'],
        ['fresh ID', 'd7-old', 'Same text as c7a', 'Inserted'],
      ];
      tries.forEach((r, i) =>
        r.forEach((v, j) => {
          if (j < 3 || attempted * tries.length >= i + 1)
            drawSqlText(
              ctx,
              api,
              v,
              x[j],
              551 + i * 110,
              32,
              j < 3 ? C.ink : i < 2 ? C.pink : C.green,
            );
        }),
      );
    });
    drawSqlText(ctx, api, 'UNIQUE (document_id, chunk_text)', 135, 942, 31, C.blue);
  } else {
    const evaluated = phase('read-check-results', 3) === 1;
    const required = phase('require-score', 3) === 1;
    api.focus.target('score-constraint', () => {
      drawSqlText(ctx, api, 'Separate score table', 135, 300, 33, C.ink);
      drawSqlText(
        ctx,
        api,
        'score INTEGER  ' + (required ? 'NOT NULL  ' : '') + 'CHECK (score > 0)',
        135,
        414,
        38,
        C.blue,
      );
      const rows = [
        ['0', 'false', 'Rejected'],
        ['NULL', 'unknown', required ? 'Rejected' : 'Inserted'],
        ['2', 'true', 'Inserted'],
      ];
      ['Score', 'score > 0', 'Insert'].forEach((s, i) =>
        drawSqlText(ctx, api, s, 170 + i * 528, 543, 29, C.muted),
      );
      api.line(ctx, 145, 572, 1765, 572, C.muted, 2);
      rows.forEach(([v, check, result], i) => {
        const y = 641 + i * 98;
        drawSqlText(ctx, api, v, 170, y, 37, C.ink);
        if (evaluated) {
          drawSqlText(ctx, api, check, 698, y, 34, C.ink);
          drawSqlText(ctx, api, result, 1226, y, 34, result === 'Inserted' ? C.green : C.pink);
        }
      });
    });
  }
}

export default {
  id: 'schema-contract',
  draw: drawSchemaContract,
  cues: ['follow-schema-links', 'try-declarations', 'read-check-results', 'require-score'],
};
