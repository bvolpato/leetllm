import { buildIndex, clamp, heapTrace, mix, terms } from '../arithmetic.mjs';
import { QUERY } from '../fixtures.mjs';
import { q } from '../construction.mjs';
import { drawCard, drawText, withFocus } from '../defaults.mjs';

const index = buildIndex();
const postings = terms(QUERY).map((word) => ({ word, ids: [...index.get(word)] }));
const candidates = [...new Set(postings.flatMap((row) => row.ids))];
const heap = heapTrace().at(-1).after;
const sourceX = (id) => 550 + 390 * candidates.indexOf(id);

export function drawOperationLedger(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat === 2) {
    drawText(ctx, api, 'Word', 170, 304, 34, C.muted);
    drawText(ctx, api, 'Matching note IDs', 648, 304, 34, C.muted);
    for (const [row, word] of ['once', 'charged'].entries()) {
      const progress = q(
        state,
        row === 0 ? 'ledger-rare' : 'ledger-common',
        2,
        row === 0 ? 0.08 : 0.46,
        row === 0 ? 0.23 : 0.62,
      );
      const ids = [...index.get(word)];
      const visited = Math.floor(progress * ids.length);
      const y = 377 + row * 240;
      withFocus(ctx, api, 'ledger-' + word, () => {
        drawText(ctx, api, word, 170, y + 71, 62, C.ink, 'left', 'serif');
        api.line(ctx, 472, y + 52, 594, y + 52, C.muted, 3);
        for (const [i, id] of ids.entries()) {
          const x = 648 + i * 250;
          drawCard(ctx, api, 'M' + id, x, y, 198, 100, i < visited ? C.cyan : C.muted, 1, 47);
          const read = clamp(progress * ids.length - i);
          if (read > 0) api.line(ctx, x, y + 112, x + 198 * read, y + 112, C.yellow, 5);
        }
        if (progress > 0) drawText(ctx, api, '1 lookup', 170, y + 142, 33, C.cyan);
        if (visited > 0)
          drawText(
            ctx,
            api,
            visited + (visited === 1 ? ' visit' : ' visits'),
            648,
            y + 158,
            43,
            C.yellow,
          );
      });
    }
    return;
  }
  const charged = q(state, 'ds-operation-ledger-0', 0, 0.12, 0.43);
  const twice = q(state, 'ledger-twice', 0, 0.48, 0.75);
  const keep = q(state, 'ds-operation-ledger-1', 1);
  const counts = new Map();
  withFocus(ctx, api, 'ds-operation-ledger-mechanism', () => {
    drawText(ctx, api, 'Support notes  /  v7', 155, 284, 32, C.muted);
    postings.forEach(({ word, ids }, row) => {
      const y = 354 + row * 137;
      drawText(ctx, api, word, 170, y + 54, 38, C.ink);
      const visits = (row === 0 ? charged : twice) * ids.length;
      ids.forEach((id, i) => {
        const p = clamp(visits - i);
        const x = sourceX(id);
        drawCard(ctx, api, 'M' + id, x, y, 180, 70, p === 1 ? C.cyan : C.muted, 1, 31);
        if (p === 1) counts.set(id, 1 + (counts.get(id) ?? 0));
        if (p > 0 && p < 1) {
          const route = api.pointAlongPath(
            [
              { x: x + 200, y },
              { x: x + 200, y: 604 },
              { x: x + 74, y: 604 },
            ],
            p,
          );
          drawText(ctx, api, '+1', route.x, route.y + 46, 34, C.yellow);
        }
      });
    });
    drawText(ctx, api, 'Score map', 170, 716, 38, C.ink);
    for (const [id, count] of counts) {
      drawCard(ctx, api, 'M' + id + '   ' + count, sourceX(id), 660, 180, 78, C.cyan, 1, 34);
    }
    const visits = [...counts.values()].reduce((total, count) => total + count, 0);
    drawText(
      ctx,
      api,
      visits + ' posting visits  /  ' + counts.size + ' counters',
      170,
      965,
      35,
      C.cyan,
    );
    if (state.beat === 1) {
      drawText(ctx, api, 'Winner heap', 170, 854, 38, C.ink);
      heap.forEach(({ id }, slot) => {
        const p = clamp(keep * heap.length - slot);
        const x = 550 + 390 * slot;
        api.rect(ctx, x, 805, 180, 70, C.panel, C.muted, 10);
        if (p > 0)
          drawCard(
            ctx,
            api,
            'M' + id,
            mix(sourceX(id), x, p),
            mix(738, 805, p),
            180,
            70,
            C.green,
            1,
            31,
          );
      });
      if (keep === 1) drawText(ctx, api, '2 extra winner slots', 1320, 965, 31, C.green);
    }
  });
}

export default {
  id: 'operation-ledger',
  draw: drawOperationLedger,
  cues: [
    'ds-operation-ledger-0',
    'ledger-twice',
    'ds-operation-ledger-1',
    'ledger-rare',
    'ledger-common',
  ],
};
