import { clamp } from '../arithmetic.mjs';
import { q } from '../construction.mjs';
import { drawCard, drawText, withFocus } from '../defaults.mjs';

const docs = ['red bird sings', 'blue whale swims', 'red fox sleeps', 'red fox runs'];
const query = ['red', 'fox'];
const tokenize = (text) => new Set(text.toLowerCase().match(/\S+/g) ?? []);
function buildIndex(documents) {
  const index = new Map();
  documents.forEach((text, id) => {
    for (const word of tokenize(text)) {
      if (!index.has(word)) index.set(word, new Set());
      index.get(word).add(id);
    }
  });
  return index;
}
const original = buildIndex(docs.slice(0, 3));
const rebuilt = buildIndex(docs);
const events = query.flatMap((word) => [...original.get(word)]);
const rank = (hits) =>
  [...hits]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 2)
    .map(([id]) => id);
const idList = (ids) => '[' + ids.join(', ') + ']';

export function drawCodeContract(ctx, scene, state, api) {
  const { C } = api;
  withFocus(ctx, api, 'ds-code-contract-mechanism', () => {
    if (state.beat === 0) {
      const split = q(state, 'ds-code-contract-0', 0);
      drawText(ctx, api, 'Python example', 160, 301, 36, C.ink);
      docs.slice(0, 3).forEach((s, i) => {
        drawCard(ctx, api, 'D' + i, 170, 379 + i * 142, 145, 80, C.muted, 1, 33);
        drawText(ctx, api, s, 360, 432 + i * 142, 37, C.ink);
      });
      drawText(ctx, api, 'Query', 1080, 381, 31, C.muted);
      drawText(ctx, api, 'Red red fox', 1080, 475, 46, C.ink, 'left', 'mono');
      if (split > 0) {
        drawCard(ctx, api, 'red', 1080, 604, 210, 81, C.cyan, split, 36);
        drawCard(ctx, api, 'fox', 1330, 604, 210, 81, C.cyan, split, 36);
      }
      drawText(ctx, api, 'set(text.lower().split())', 1080, 830, 31, C.ink, 'left', 'mono');
    } else if (state.beat === 1) {
      const red = q(state, 'ds-code-contract-1', 1, 0.12, 0.36);
      const fox = q(state, 'code-fox', 1, 0.37, 0.55);
      const report = q(state, 'code-rank', 1, 0.67, 0.92);
      const seen = Math.floor(red * 2) + Math.floor(fox);
      const counts = new Map();
      for (const id of events.slice(0, seen)) counts.set(id, 1 + (counts.get(id) ?? 0));
      query.forEach((word, i) => {
        const y = 390 + i * 148;
        drawText(ctx, api, word, 170, y + 50, 43, C.ink);
        [...original.get(word)].forEach((id, pos) =>
          drawCard(
            ctx,
            api,
            'D' + id,
            390 + pos * 213,
            y,
            160,
            76,
            (i === 0 ? red * 2 : fox) >= pos + 1 ? C.cyan : C.muted,
            1,
            34,
          ),
        );
      });
      drawText(ctx, api, 'Matched document', 1060, 319, 29, C.muted);
      drawText(ctx, api, 'Score', 1490, 319, 29, C.muted);
      [...counts].forEach(([id, count], i) => {
        drawText(ctx, api, 'D' + id, 1070, 437 + i * 150, 39, C.ink);
        drawText(ctx, api, count, 1510, 437 + i * 150, 49, C.cyan);
      });
      if (seen === events.length) {
        drawText(ctx, api, 'Scan   (ID, score)', 170, 747, 30, C.muted);
        drawText(ctx, api, '[(0, 1), (2, 2)]', 170, 851, 44, C.ink, 'left', 'mono');
      }
      if (report === 1) {
        drawText(ctx, api, 'Ranked IDs', 1060, 747, 30, C.muted);
        drawText(ctx, api, idList(rank(counts)), 1060, 851, 44, C.green, 'left', 'mono');
      }
    } else if (state.beat === 2) {
      const create = q(state, 'ds-code-contract-2', 2);
      drawText(ctx, api, 'Missing word: otter', 160, 318, 39, C.ink);
      const cases = [
        ["index.get('otter', set())", original.size],
        ["index['otter']", original.size + Number(create === 1)],
      ];
      cases.forEach(([code, keys], i) => {
        const x = 160 + i * 860;
        drawText(ctx, api, i ? 'During construction' : 'During search', x, 450, 32, C.muted);
        drawText(ctx, api, code, x, 563, 39, C.ink, 'left', 'mono');
        drawText(
          ctx,
          api,
          keys + ' dictionary keys',
          x,
          728,
          35,
          i && create === 1 ? C.yellow : C.cyan,
        );
        if (!i || create === 1)
          drawText(
            ctx,
            api,
            i ? 'Stored a new empty set' : 'Returned an empty set',
            x,
            835,
            32,
            C.ink,
          );
      });
    } else {
      const add = q(state, 'code-rebuild', 3);
      const select = q(state, 'code-new-ranking', 4);
      const index = add === 1 ? rebuilt : original;
      const counts = new Map();
      drawText(ctx, api, 'D3   red fox runs', 160, 312, 43, C.ink);
      [...tokenize(docs[3])].forEach((word, i) => {
        if (!original.has(word) && add === 0) return;
        const y = 363 + i * 137;
        drawText(ctx, api, word, 170, y + 54, 42, C.ink);
        [...(index.get(word) ?? [])].forEach((id, slot) => {
          if (query.includes(word)) counts.set(id, (counts.get(id) ?? 0) + 1);
          drawCard(
            ctx,
            api,
            'D' + id,
            470 + slot * 275,
            y,
            190,
            85,
            id === 3 ? C.yellow : C.cyan,
            1,
            36,
          );
        });
        if (add > 0 && add < 1) {
          const x = 470 + (original.get(word)?.size ?? 0) * 275;
          drawCard(ctx, api, 'D3', x + 300 * (1 - add), y, 190, 85, C.yellow, clamp(add * 3), 36);
        }
      });
      drawText(ctx, api, 'Ranked IDs for red fox', 170, 868, 36, C.muted);
      if (select === 1)
        drawText(ctx, api, idList(rank(counts)), 625, 868, 46, C.green, 'left', 'mono');
    }
  });
}
export default {
  id: 'code-contract',
  draw: drawCodeContract,
  cues: [
    'ds-code-contract-0',
    'ds-code-contract-1',
    'code-fox',
    'code-rank',
    'ds-code-contract-2',
    'code-rebuild',
    'code-new-ranking',
  ],
};
