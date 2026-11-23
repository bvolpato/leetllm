import { capacityFixture } from '../arithmetic.mjs';
import { passage, spoken } from '../trace.mjs';

const bytes = capacityFixture().perToken;
const heads = 4;
const layers = 16;
const coordinates = 256;
const history = 4096;

export function drawCachePayload(ctx, scene, state, api) {
  const { C } = api;
  const pairs = passage(state, 0, 'stored-pair', 0.12, 0.36);
  const sharing = passage(state, 0, 'sharing', 0.6, 0.94);
  const stack = passage(state, 1, 'stack-layers', 0.18, 0.45);
  const layerCount = 1 + Math.floor((layers - 1) * stack);
  const headCount = 1 + Math.floor((heads - 1) * sharing);
  const tall = passage(state, 1, 'grow-history', 0.54, 0.73);
  const positions = 1 + Math.floor((history - 1) * tall);
  const priced = spoken(state, 1, 'price-slice', 0.53);
  const total = spoken(state, 1, 'quarter-gib', 0.82);
  const drop = passage(state, 2, 'drop-history', 0.47, 0.57);
  const rebuild = passage(state, 2, 'rebuild', 0.69, 0.84);
  const reuse = passage(state, 2, 'reuse-history', 0.86, 0.92) > 0;
  const stored = reuse ? history : Math.round(positions * (1 - drop) + history * rebuild);

  api.focus.target('cache-slice', () => {
    api.text(ctx, 'Layout of one KV position', 140, 267, 42, C.ink);
    api.text(ctx, 'Stored heads', 140, 348, 28, C.muted);
    const start = 353;
    const col = 153;
    for (let h = 0; h < headCount; h++) {
      const x = start + col * h;
      api.text(ctx, String(h + 1), x + 55, 348, 30, C.ink, 'center');
      for (let l = 0; l < layerCount; l++) {
        const y = 385 + 18 * l;
        api.rect(ctx, x, y, 51, 12, C.cyan, undefined, 2);
        if (pairs >= 0.5) api.rect(ctx, x + 58, y, 51, 12, C.pink, undefined, 2);
      }
    }
    api.text(ctx, layerCount + (layerCount === 1 ? ' layer' : ' layers'), 139, 430, 36, C.ink);
    api.text(ctx, 'K', start + 25, 716, 32, C.cyan, 'center');
    if (pairs >= 0.5) api.text(ctx, 'V', start + 83, 716, 32, C.pink, 'center');
    if (state.beat === 0) {
      if (headCount === heads)
        api.text(
          ctx,
          '24 query heads read 4 stored pairs per layer.',
          1220,
          760,
          33,
          C.ink,
          'center',
        );
      api.text(ctx, 'Query heads', 1325, 348, 32, C.muted, 'center');
      for (let g = 0; g < headCount; g++) {
        const y = 416 + 72 * g;
        api.text(ctx, 'KV ' + (g + 1), 1050, y + 11, 29, C.ink);
        for (let i = 0; i < 6; i++) api.circle(ctx, 1220 + i * 78, y, 15, C.blue);
      }
    } else {
      api.text(ctx, 'Full-attention history', 1115, 348, 36, C.ink);
      api.text(ctx, stored.toLocaleString('en-US') + ' cached positions', 1115, 449, 37, C.cyan);
      api.rect(ctx, 1115, 494, 630, 77, C.panel, C.muted, 2);
      if (stored > 0)
        api.rect(ctx, 1115, 494, Math.max(2, (630 * stored) / history), 77, C.cyan, undefined, 2);
      if (drop > 0) api.text(ctx, '4,096 positions in the prefix', 1115, 654, 39, C.ink);
      else if (total)
        api.text(ctx, (bytes * history) / 2 ** 30 + ' GiB of raw KV', 1115, 654, 43, C.yellow);
      if (drop === 0 && state.beat === 2 && passage(state, 2, 'other-state', 0.18, 0.4) > 0) {
        api.text(ctx, '48 recurrent layers budgeted separately', 1115, 743, 30, C.muted);
      }
    }
    if (drop > 0) {
      api.text(
        ctx,
        reuse ? 'Replay with retained KV' : 'Replay after cache deletion',
        960,
        858,
        39,
        C.ink,
        'center',
      );
      const rebuilt = reuse ? 0 : Math.round(history * rebuild);
      api.text(
        ctx,
        'Old positions reprojected this step   ·   ' + rebuilt.toLocaleString('en-US'),
        960,
        960,
        44,
        C.yellow,
        'center',
      );
    } else if (state.beat > 0) {
      api.text(
        ctx,
        'K and V  ×  ' +
          layerCount +
          ' layers  ×  4 heads  ×  ' +
          coordinates +
          ' values  ×  2 bytes',
        960,
        858,
        39,
        C.ink,
        'center',
      );
      if (priced)
        api.text(
          ctx,
          bytes.toLocaleString('en-US') + ' bytes per position  =  64 KiB',
          960,
          960,
          47,
          C.yellow,
          'center',
        );
    }
  });
}

export default {
  id: 'cache-payload',
  draw: drawCachePayload,
  cues: [
    'stored-pair',
    'sharing',
    'stack-layers',
    'price-slice',
    'grow-history',
    'quarter-gib',
    'other-state',
    'drop-history',
    'rebuild',
    'reuse-history',
  ],
};
