import { QUERY, UPDATED_MESSAGES } from '../fixtures.mjs';
import { buildIndex, clamp, search, terms } from '../arithmetic.mjs';
import { q } from '../construction.mjs';
import { drawCard, drawText, withFocus } from '../defaults.mjs';
import { drawDeskNote, drawReaderSlip, drawReaderSlots } from '../reader-desk.mjs';

const words = terms(QUERY);
const index = buildIndex(UPDATED_MESSAGES);
const postings = words.map((word) => [...index.get(word)]);
const winners = search(UPDATED_MESSAGES);

export function drawAnswer(ctx, scene, state, api) {
  const { C } = api;
  const lookup = q(state, 'answer-query', 0, 0.2, 0.4);
  const score = [
    q(state, 'answer-score', 0, 0.41, 0.65),
    q(state, 'answer-score-twice', 0, 0.66, 0.8),
  ];
  const send = q(state, 'answer-output', 0, 0.81, 0.93);
  const visited = postings.flatMap((ids, i) => ids.slice(0, Math.floor(score[i] * ids.length)));
  withFocus(ctx, api, 'answer-route', () => {
    drawText(ctx, api, 'v8 index', 126, 244, 34, C.ink);
    words.forEach((word, i) => {
      const x = 314 + i * 430;
      drawCard(ctx, api, word, x, 192, 193, 76, C.cyan, 1, 36);
      if (lookup * words.length >= i + 1)
        drawText(ctx, api, postings[i].map((id) => 'M' + id).join('  '), x + 211, 243, 33, C.ink);
    });
    const pair = winners.map((id) => 'M' + id).join(' + ');
    drawText(
      ctx,
      api,
      send === 1
        ? 'Assistant reads current winners · ' + pair + ' · corpus v8'
        : 'Current support notes',
      126,
      311,
      27,
      send === 1 ? C.green : C.muted,
    );
    for (const row of UPDATED_MESSAGES) {
      const highlights = Object.fromEntries(
        words.map((word, i) => [
          word,
          lookup * words.length >= i + 1 && postings[i].includes(row.id),
        ]),
      );
      const points = visited.filter((id) => id === row.id).length;
      drawDeskNote(ctx, api, row, {
        highlights,
        score: points || undefined,
        selected: send === 1 && winners.includes(row.id),
      });
    }
  });

  withFocus(ctx, api, 'answer-results', () => {
    drawText(ctx, api, 'All four notes in scope', 1320, 240, 29, C.muted);
    drawReaderSlots(ctx, api, 'Send with the reply');
    winners.forEach((id, slot) => {
      const row = UPDATED_MESSAGES.find((note) => note.id === id);
      drawReaderSlip(ctx, api, row, slot, clamp(2 * send - slot));
    });
  });
}

export default {
  id: 'answer',
  draw: drawAnswer,
  cues: ['answer-query', 'answer-score', 'answer-score-twice', 'answer-output'],
};
