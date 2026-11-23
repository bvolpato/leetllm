import { contextLedger } from '../arithmetic.mjs';
import { cueAmount, cueDone } from '../defaults.mjs';

const base = 2000;
const added = 1500;
const calls = 10;
const bounded = contextLedger(base, added, calls, 2);
const full = contextLedger(base, added, calls);
const format = (n) => n.toLocaleString('en-US');

export function drawCacheAndContext(ctx, scene, state, api) {
  const { C } = api;
  const reuse = cueAmount(state, 'context-restore') > 0;
  const firstCall = cueAmount(state, 'context-base') > 0;
  const secondCall = cueAmount(state, 'context-base-read') > 0;
  const scale = 0.027;
  const floor = 820;

  api.focus.target('aa-cache-and-context-mechanism', () => {
    api.text(
      ctx,
      reuse
        ? 'Full history · every matching prefix stays cached'
        : 'Keep the last two blocks from prior calls',
      960,
      270,
      37,
      C.ink,
      'center',
    );
    if (reuse) {
      api.text(ctx, 'Read from cache', 740, 350, 32, C.cyan, 'center');
      api.text(ctx, 'Write to cache', 1180, 350, 32, C.yellow, 'center');
    }

    for (let i = 0; i < calls; i++) {
      const x = 210 + i * 150;
      const baseColor = reuse ? (i === 0 ? C.yellow : C.cyan) : C.blue;
      api.rect(ctx, x, floor - base * scale, 95, base * scale, baseColor, undefined, 2);
      const firstBlock = reuse ? 0 : Math.max(0, i - 2);
      for (let j = firstBlock; j < i; j++) {
        const y = floor - (base + (j - firstBlock + 1) * added) * scale;
        const color = reuse && j === i - 1 ? C.yellow : C.cyan;
        api.rect(ctx, x, y, 95, added * scale - 2, color, undefined, 2);
        api.text(ctx, String(j + 1), x + 47, y + 29, 24, C.bg, 'center');
      }
      if ((i === 0 && firstCall) || (i === 1 && secondCall)) {
        api.rect(ctx, x - 5, floor - base * scale - 5, 105, base * scale + 10, null, C.ink, 5);
      }
      api.text(ctx, String(i + 1), x + 47, floor + 49, 27, C.muted, 'center');
    }

    api.text(ctx, 'Call', 145, floor + 49, 27, C.muted);
    if (!reuse && cueDone(state, 'context-bounded')) {
      api.text(
        ctx,
        format(bounded.total) + ' input tokens across ten calls',
        960,
        958,
        40,
        C.ink,
        'center',
      );
    }
    if (reuse && cueDone(state, 'context-cached')) {
      api.text(ctx, format(full.read) + ' cached reads', 610, 958, 40, C.cyan, 'center');
    }
    if (reuse && cueDone(state, 'context-written')) {
      api.text(ctx, format(full.written) + ' new writes', 1320, 958, 40, C.yellow, 'center');
    }
  });
}

export default {
  id: 'cache-and-context',
  draw: drawCacheAndContext,
  cues: [
    'aa-cache-and-context-0',
    'aa-cache-and-context-1',
    'context-bounded',
    'context-restore',
    'context-cached',
    'context-written',
    'context-base',
    'context-base-read',
  ],
};
