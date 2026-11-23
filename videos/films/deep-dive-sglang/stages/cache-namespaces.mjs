import { motion, settled } from '../construction.mjs';
import { prefixReuse } from '../model.mjs';
import { line, slot, text } from '../defaults.mjs';

const tokens = ['A', 'B', 'C', 'D', 'E'];
const page = 4;
const firstLocation = 12;

export function drawCacheNamespaces(ctx, scene, state, api) {
  const { C } = api;
  const switched = settled(state, 'key-switch', 1, 0.45);
  const result = prefixReuse(tokens, tokens, 'A', switched ? 'B' : 'A', page);
  const scanned = Math.floor(tokens.length * motion(state, 'key-compare', 0, 0.15, 0.45));
  const firstHit = settled(state, 'key-page', 0, 0.73);
  const secondHit = settled(state, 'key-zero', 2, 0.13);
  const start = 580,
    pitch = 218,
    width = 186;
  api.focus.target('key-stored', () => {
    text(ctx, api, 'Stored path', 155, 352, 39, C.ink);
    text(ctx, api, 'Namespace A', 155, 408, 29, C.muted);
    tokens.forEach((v, i) => slot(ctx, api, v, start + pitch * i, 315, width, 96, C.blue, 48));
  });
  api.focus.target('key-request', () => {
    text(ctx, api, 'Request', 155, 570, 39, C.ink);
    text(
      ctx,
      api,
      'Namespace ' + (switched ? 'B' : 'A'),
      155,
      626,
      33,
      switched ? C.yellow : C.blue,
    );
    tokens.forEach((v, i) => {
      const x = start + pitch * i;
      slot(ctx, api, v, x, 530, width, 96, i < scanned ? C.blue : C.muted, 48);
      if (i < scanned) text(ctx, api, '=', x + width / 2, 488, 38, C.muted, 'center');
    });
  });
  api.focus.target('key-page', () => {
    const end = start + pitch * (page - 1) + width;
    line(ctx, api, start, 657, start, 679, C.cyan);
    line(ctx, api, start, 679, end, 679, C.cyan);
    line(ctx, api, end, 657, end, 679, C.cyan);
    text(ctx, api, 'One page · 4 positions', (start + end) / 2, 735, 32, C.cyan, 'center');
    text(ctx, api, 'Next page', start + pitch * page + width / 2, 735, 30, C.muted, 'center');
  });
  api.focus.target('key-addresses', () => {
    text(ctx, api, 'A’s stored KV page', 155, 843, 34, C.ink);
    for (let i = 0; i < page; i++) {
      const linked = firstHit && !switched && i < result.reusable;
      slot(
        ctx,
        api,
        firstHit ? String(firstLocation + i) : '',
        start + pitch * i,
        774,
        width,
        92,
        linked ? C.green : C.muted,
      );
    }
    if (switched)
      text(
        ctx,
        api,
        secondHit ? result.reusable + ' returned' : '? returned',
        1570,
        835,
        34,
        secondHit ? C.pink : C.yellow,
        'center',
      );
  });
  const note =
    state.beat === 1 && switched
      ? 'How many of A’s locations can B use?'
      : state.beat === 2 && settled(state, 'key-class', 2, 0.64)
        ? 'Article lookup helper → 0     ·     Direct incompatible RadixKey.match → ValueError'
        : 'Letters stand for token IDs. The attention kernel reads the KV at the returned locations.';
  text(ctx, api, note, 960, 965, 32, switched && !secondHit ? C.yellow : C.ink, 'center');
}

export default {
  id: 'cache-namespaces',
  draw: drawCacheNamespaces,
  cues: ['key-compare', 'key-page', 'key-switch', 'key-question', 'key-zero', 'key-class'],
};
