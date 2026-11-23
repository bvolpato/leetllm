import { motion } from '../construction.mjs';
import { PACKED_TOKENS } from '../fixtures.mjs';
import { packingSnapshot } from '../model.mjs';
import { text, upgradeBox } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  const { C } = api;
  const travel = motion(state, 'packing-b1-1', 0, 0.27, 0.57);
  const x = (i) => 235 + 284 * i;
  api.focus.target('packed-conversations', () => {
    PACKED_TOKENS.forEach((word, i) => {
      const cx = i < 3 ? x(i) : x(i - 3) + 852 * Math.min(1, travel / 0.67);
      const y = i < 3 ? 345 : 555 - 210 * Math.max(0, (travel - 0.67) / 0.33);
      upgradeBox(ctx, api, word, cx - 120, y, 240, 92, i < 3 ? C.blue : C.cyan, 33);
    });
    if (state.beat === 0)
      text(
        ctx,
        api,
        travel === 1 ? 'One block   /   two independent incidents' : 'Two short training rows',
        960,
        879,
        44,
        C.ink,
        'center',
      );
  });
  if (state.beat === 0) return;
  if (state.beat === 1) {
    const { mask } = packingSnapshot(1, 1);
    api.focus.target('packed-mask', () => {
      text(ctx, api, 'Reads permitted at B:answer', 143, 570, 39, C.ink);
      mask[4].forEach((allowed, i) => {
        upgradeBox(
          ctx,
          api,
          allowed ? 'CAN READ' : '·',
          x(i) - 120,
          631,
          240,
          82,
          allowed ? C.cyan : C.muted,
          31,
        );
        text(ctx, api, 'pos ' + (i % 3), x(i), 803, 32, C.muted, 'center');
      });
      text(
        ctx,
        api,
        'Earlier or current position   +   same incident',
        960,
        929,
        41,
        C.ink,
        'center',
      );
    });
  } else {
    const cut = motion(state, 'packing-b3-2', 2, 0.42, 0.62) > 0;
    api.focus.target('cross-boundary-label', () => {
      api.line(ctx, (x(2) + x(3)) / 2, 455, (x(2) + x(3)) / 2, 802, C.yellow, 3);
      if (!cut) api.arrow(ctx, x(2), 455, x(3), 637, C.pink, 5);
      upgradeBox(
        ctx,
        api,
        cut ? '−100' : 'B:prompt',
        x(3) - 120,
        652,
        240,
        90,
        cut ? C.muted : C.pink,
        39,
      );
      text(ctx, api, 'First label of B', x(3), 817, 32, C.muted, 'center');
      text(
        ctx,
        api,
        cut ? 'No loss term across this join' : 'The global shift reaches into another incident',
        960,
        946,
        42,
        cut ? C.green : C.ink,
        'center',
      );
    });
  }
}

export default {
  id: 'packing',
  draw: draw,
  cues: ['packing-b1-1', 'packing-b2-1', 'packing-b2-2', 'packing-b3-1', 'packing-b3-2'],
};
