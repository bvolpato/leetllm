import { sequence0 } from '../fixtures.mjs';
import { complete, event } from '../construction.mjs';
import { headFrame } from '../model.mjs';
import { numberGrid, target, text, wordTable } from '../defaults.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const requestedPair = sequence0[1].slice(0, 2);
  const { directPair } = headFrame(state);
  const request = event(state, 0, 'request-first-pair');
  const trace = event(state, 1, 'locate-returned-pair');
  const found = complete(trace);
  target(ctx, api, 'intro-features', () => {
    const pairs = [{ row: 1, first: 0, color: C.cyan }];
    if (found) pairs.push({ row: 0, first: sequence0[0].indexOf(directPair[0]), color: C.yellow });
    wordTable(ctx, api, 0, sequence0, { pairs });
    if (request > 0) api.line(ctx, 310, 619, 310 + 250 * request, 619, C.cyan, 5);
    if (trace > 0) {
      const tip = api.trace(ctx, [
        { x: 1179, y: 660 }, { x: 965, y: 660 },
        { x: 965, y: 460 }, { x: 831, y: 460 },
      ], trace, C.yellow, 5);
      if (tip) api.circle(ctx, tip.x, tip.y, 7, C.yellow);
    }
  });
  target(ctx, api, 'intro-request', () => {
    text(ctx, api, 'Requested from migrate', 1400, 310, 37, C.cyan, 'center');
    numberGrid(ctx, api, [requestedPair], 1190, 342, 420, 110, C.cyan, 'requested-pair', {
      fontSize: 55,
    });
    if (request > 0) api.line(ctx, 1195, 446, 1195 + 410 * request, 446, C.cyan, 5);
  });
  target(ctx, api, 'intro-readout', () => {
    text(ctx, api, 'Code returned', 1400, 563, 37, C.yellow, 'center');
    numberGrid(
      ctx,
      api,
      [directPair],
      1190,
      605,
      420,
      110,
      C.yellow,
      'returned-pair',
      { fontSize: 55 },
    );
    if (found) {
      text(ctx, api, 'Birds  ·  features 2 and 3', 1400, 802, 32, C.yellow, 'center');
    }
  });
  target(ctx, api, 'opening-question', () => {
    text(
      ctx,
      api,
      event(state, 1, 'opening-owner-question') > 0
        ? 'How did Birds’ features end up under migrate?'
        : '',
      960,
      900,
      43,
      C.ink,
      'center',
    );
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'request-first-pair',
    'open-readout',
    'locate-returned-pair',
    'opening-owner-question',
  ],
};
