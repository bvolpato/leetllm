import { clamp, mix } from '../arithmetic.mjs';
import { q } from '../construction.mjs';
import { drawCard, drawText, withFocus } from '../defaults.mjs';

const least = 394;
const most = 694;
const lane = 745;
const cardWidth = 405;

function drawRecencyOrder(ctx, state, api) {
  const { C } = api;
  const hit = q(state, 'cache-lru-hit', 0, 0.28, 0.58);
  const request = q(state, 'cache-sign-request', 0, 0.66, 0.8);
  const insert = q(state, 'ds-cache-recency-1', 1, 0.04, 0.42);
  const out = clamp(insert / 0.34);
  const up = clamp((insert - 0.34) / 0.3);
  const incoming = clamp((insert - 0.64) / 0.36);
  drawText(ctx, api, 'Two cached searches   /   v8   /   all four notes', 144, 267, 37, C.ink);
  drawText(ctx, api, 'Least recent', 144, least - 19, 30, C.muted);
  drawText(ctx, api, 'Most recent', 144, most - 19, 30, C.muted);
  for (const y of [least, most])
    api.line(ctx, lane - 18, y + 106, lane + cardWidth + 18, y + 106, C.muted, 3);

  // A hit takes the two entries around opposite sides of the same two places.
  const swing = Math.sin(Math.PI * hit);
  const chargedX = lane + 438 * swing;
  const chargedY = mix(mix(least, most, hit), least, up);
  const twiceX = lane - 438 * swing - out * 460;
  const twiceY = mix(most, least, hit);
  drawCard(ctx, api, 'charged', chargedX, chargedY, cardWidth, 90, C.cyan, 1, 37);
  if (out < 1)
    drawCard(ctx, api, 'twice', twiceX, twiceY, cardWidth, 90, out > 0 ? C.pink : C.cyan, 1, 37);
  if (request > 0) {
    const sourceX = 1405;
    if (incoming < 1) drawText(ctx, api, 'Incoming lookup', sourceX, most - 25, 29, C.yellow);
    drawCard(
      ctx,
      api,
      'sign · includes M2',
      mix(sourceX, lane, incoming),
      most,
      cardWidth,
      90,
      incoming === 1 ? C.green : C.yellow,
      1,
      33,
    );
  }
  if (out === 1) drawText(ctx, api, 'Evicted: twice', 152, 952, 31, C.pink);
}

export function drawCacheRecency(ctx, scene, state, api) {
  const { C } = api;
  withFocus(ctx, api, 'ds-cache-recency-mechanism', () => {
    if (state.beat < 2) {
      drawRecencyOrder(ctx, state, api);
      return;
    }
    if (state.beat === 2) {
      const publish = q(state, 'ds-cache-recency-0', 2);
      drawText(ctx, api, 'Request  /  charged twice  /  all four notes', 170, 301, 37, C.ink);
      drawText(ctx, api, 'Notes', 280, 426, 31, C.muted);
      drawText(ctx, api, 'Postings read on a miss', 773, 426, 31, C.muted);
      drawText(ctx, api, 'Cache key', 1435, 426, 31, C.muted);
      drawCard(ctx, api, 'v8   edited M2', 160, 472, 420, 105, C.cyan, 1, 32);
      drawCard(
        ctx,
        api,
        publish === 1 ? 'v8   charged: M0, M3' : 'v7   charged: M0, M2, M3',
        630,
        472,
        651,
        105,
        publish === 1 ? C.cyan : C.pink,
        1,
        32,
      );
      drawCard(ctx, api, 'v8', 1340, 472, 365, 105, C.cyan, 1, 32);
      if (publish === 1)
        api.path(
          ctx,
          [
            { x: 180, y: 625 },
            { x: 180, y: 665 },
            { x: 1690, y: 665 },
            { x: 1690, y: 625 },
          ],
          { color: C.green, width: 5 },
        );
      drawText(
        ctx,
        api,
        publish === 1
          ? 'One published snapshot'
          : 'M2 still matches charged in the index being read',
        960,
        805,
        37,
        publish === 1 ? C.green : C.pink,
        'center',
      );
      return;
    }
    const edit = q(state, 'ds-cache-recency-2', 3);
    drawText(ctx, api, 'Two tuples, one document', 170, 300, 39, C.ink);
    [410, 690].forEach((y, i) => {
      drawCard(ctx, api, (i ? 'B' : 'A') + '   (reference to M2,)', 170, y, 565, 97, C.cyan, 1, 31);
      api.path(
        ctx,
        [
          { x: 749, y: y + 48 },
          { x: 870, y: y + 48 },
          { x: 870, y: i ? 660 : 550 },
          { x: 1025, y: i ? 660 : 550 },
        ],
        { color: C.cyan, width: 4 },
      );
    });
    drawCard(
      ctx,
      api,
      edit === 1 ? 'M2   ·   edited text' : 'M2   ·   sign-in text',
      1040,
      479,
      650,
      242,
      edit === 1 ? C.yellow : C.cyan,
      1,
      37,
    );
  });
}

export default {
  id: 'cache-recency',
  draw: drawCacheRecency,
  cues: [
    'ds-cache-recency-0',
    'cache-lru-hit',
    'cache-sign-request',
    'ds-cache-recency-1',
    'ds-cache-recency-2',
  ],
};
