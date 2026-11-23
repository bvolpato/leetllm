import { mix } from '../arithmetic.mjs';
import { chunks } from '../fixtures.mjs';
import { directed, sampleModel } from '../construction.mjs';
import { drawSqlText } from '../defaults.mjs';

const row = chunks.find((c) => c.id === 'c7a');
function record(ctx, api, x, y, color) {
  const { C } = api;
  const offsets = [22, 140, 337];
  api.rect(ctx, x, y, 765, 142, C.panel, color, 2, 7);
  for (const [i, k] of ['id', 'document_id', 'chunk_text'].entries())
    drawSqlText(ctx, api, k, x + offsets[i], y + 40, 24, C.muted);
  api.line(ctx, x + 16, y + 55, x + 747, y + 55, color, 2);
  drawSqlText(ctx, api, row.id, x + offsets[0], y + 107, 32, C.ink);
  drawSqlText(ctx, api, row.document, x + offsets[1], y + 107, 32, C.ink);
  drawSqlText(ctx, api, row.text, x + offsets[2], y + 103, 24, C.ink);
}

export function drawDurability(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat === 2) {
    const reopen = directed(state, 'reopen-acme-file', 2);
    drawSqlText(
      ctx,
      api,
      'Acme SQLite lab  /  same file, same authorized search',
      135,
      310,
      33,
      C.ink,
    );
    drawSqlText(ctx, api, 'Before closing', 135, 480, 31, C.blue);
    drawSqlText(ctx, api, 'c7a   ·   c7b', 135, 602, 48, C.cyan);
    api.focus.target('acme-reread', () => {
      drawSqlText(ctx, api, 'New connection', 990, 480, 31, C.blue);
      api.line(ctx, 990, 515, 1755, 515, C.blue, 3);
      if (reopen === 1) drawSqlText(ctx, api, 'c7a   ·   c7b', 990, 602, 48, C.cyan);
    });
    drawSqlText(
      ctx,
      api,
      'w01   /   agent:u3   /   August 12   /   search: key',
      135,
      822,
      30,
      C.muted,
    );
    return;
  }
  const { store, recover } = sampleModel('durability', state);
  const saving = (state.beat ?? 0) === 0;
  drawSqlText(
    ctx,
    api,
    saving ? 'Harbor support  /  save the paragraph' : 'Harbor support  /  new process',
    135,
    310,
    33,
    C.blue,
  );
  drawSqlText(ctx, api, 'support.sqlite  /  chunks', 990, 310, 33, C.cyan);
  api.line(ctx, 135, 340, 898, 340, C.blue, 3);
  api.line(ctx, 990, 340, 1755, 340, C.cyan, 3);
  if (saving) {
    api.focus.target('stored-row', () => {
      record(ctx, api, mix(135, 990, store), 467, store === 1 ? C.cyan : C.blue);
    });
    if (store === 1) drawSqlText(ctx, api, 'COMMIT', 990, 704, 33, C.cyan);
  } else {
    record(ctx, api, 990, 467, C.cyan);
    api.focus.target('recovered-row', () => {
      drawSqlText(ctx, api, "SELECT … WHERE id = 'c7a'", 135, 421, 29, C.blue);
      if (recover > 0) record(ctx, api, 135, mix(675, 467, recover), C.blue);
    });
    if (recover === 1) drawSqlText(ctx, api, 'Read from the existing file', 135, 704, 31, C.blue);
  }
}

export default {
  id: 'durability',
  draw: drawDurability,
  cues: ['store-row', 'recover-row', 'reopen-acme-file'],
};
