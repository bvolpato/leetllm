import { MESSAGES, QUERY } from '../fixtures.mjs';
import { clamp, search, terms } from '../arithmetic.mjs';
import { q } from '../construction.mjs';
import { drawCard, drawText, withFocus } from '../defaults.mjs';
import { drawDeskNote } from '../reader-desk.mjs';

const queryWords = terms(QUERY);
const winners = search();

function drawStatement(ctx, api, underline) {
  const { C } = api;
  const edge = Array.from({ length: 25 }, (_, i) => ({
    x: 1784 - i * 24,
    y: 669 + (i % 2) * 12,
  }));
  api.path(ctx, [{ x: 1208, y: 220 }, { x: 1784, y: 220 }, ...edge], {
    fill: C.ink,
    closed: true,
    width: 0,
  });
  api.rect(ctx, 1254, 265, 65, 43, C.panel, undefined, 6);
  api.line(ctx, 1261, 278, 1312, 278, C.ink, 5);
  drawText(ctx, api, 'Card statement', 1340, 302, 39, C.bg, 'left', 'serif');
  api.line(ctx, 1254, 349, 1738, 349, C.panel, 2);
  for (const baseline of [445, 571]) {
    drawText(ctx, api, 'Plan payment', 1254, baseline, 33, C.bg);
    drawText(ctx, api, '$12.00', 1738, baseline, 48, C.bg, 'right', 'mono');
    if (underline > 0)
      api.line(ctx, 1561, baseline + 17, 1561 + 177 * underline, baseline + 17, C.bg, 4);
  }
}

export function drawOpening(ctx, scene, state, api) {
  const { C } = api;
  const question = q(state, 'opening-question', 0);
  const words = q(state, 'opening-terms', 0, 0.56, 0.82);
  const named = [q(state, 'opening-first', 3, 0, 0.15), q(state, 'opening-second', 3, 0.35, 0.5)];
  withFocus(ctx, api, 'opening-customer', () => drawStatement(ctx, api, words));
  drawText(ctx, api, 'Search for', 126, 274, 36, C.ink);
  queryWords.forEach((word, i) => {
    withFocus(ctx, api, 'opening-query-' + word, () =>
      drawCard(
        ctx,
        api,
        word,
        330 + i * 245,
        216,
        222,
        80,
        words * 2 >= i + 1 ? C.cyan : C.muted,
        1,
        39,
      ),
    );
  });
  withFocus(ctx, api, 'opening-desk', () => {
    MESSAGES.forEach((row, i) => {
      const arrival = clamp(question * 4 - i);
      const revealWords = named[row.id === winners[1] ? 1 : 0] > 0;
      withFocus(ctx, api, 'opening-note-' + row.id, () =>
        drawDeskNote(ctx, api, row, {
          offset: 22 * (1 - arrival),
          opacity: 0.8 + 0.2 * arrival,
          highlights: { charged: revealWords, twice: revealWords },
          target: (id, word) => 'opening-match-' + id + '-' + word,
        }),
      );
    });
  });
  drawText(ctx, api, 'Send to the assistant', 1208, 784, 37, C.ink);
  winners.forEach((id, i) => {
    const x = 1208 + i * 284;
    withFocus(ctx, api, i === 0 ? 'opening-first-slot' : 'opening-second-slot', () => {
      api.line(ctx, x, 903, x + 250, 903, named[i] > 0 ? C.green : C.muted, 3);
      if (named[i] > 0) drawText(ctx, api, 'M' + id, x + 125, 880, 57, C.green, 'center', 'mono');
    });
  });
}

export default {
  id: 'opening',
  draw: drawOpening,
  cues: [
    'opening-question',
    'opening-records',
    'opening-terms',
    'opening-predict',
    'opening-first',
    'opening-second',
  ],
};
