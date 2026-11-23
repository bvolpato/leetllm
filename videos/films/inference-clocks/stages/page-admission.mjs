import { capacityFixture } from '../arithmetic.mjs';
import { bracket, passage, spoken } from '../trace.mjs';

const f = capacityFixture();
const gb = (bytes) => (bytes / 1e9).toFixed(2) + ' GB';

function pageSlots(ctx, api, count, pages) {
  const { C } = api;
  for (let page = 0; page < pages; page++) {
    const x = 170 + (page % 4) * 407;
    const y = 364 + Math.floor(page / 4) * 201;
    api.rect(ctx, x, y, 355, 133, C.panel, C.muted, 7);
    for (let slot = 0; slot < 16; slot++) {
      api.rect(
        ctx,
        x + 13 + (slot % 8) * 42,
        y + 14 + Math.floor(slot / 8) * 54,
        33,
        48,
        page * 16 + slot < count ? C.cyan : C.bg,
        undefined,
        2,
      );
    }
  }
}

export function drawPageAdmission(ctx, scene, state, api) {
  const { C } = api;
  const paragraph = (s, y, size, color = C.ink) => api.text(ctx, s, 960, y, size, color, 'center');
  api.focus.target('admission', () => {
    if (
      state.beat === 0 ||
      (state.beat === 1 && passage(state, 1, 'pool-only', 0.77, 0.95) === 0)
    ) {
      const one = state.beat === 1;
      const count = one ? 1 : Math.floor(120 * passage(state, 0, 'fill-pages', 0.42, 0.76));
      paragraph(
        one ? 'One position in a 16-position page' : '120 positions   ·   16 slots per page',
        281,
        40,
      );
      pageSlots(ctx, api, count, one ? 1 : 8);
      if (one) paragraph('1 used   ·   15 empty', 851, 48, C.yellow);
      else if (count === 120)
        paragraph('8 pages × 16 slots  =  128 reserved   ·   8 empty  (6.25%)', 852, 43, C.yellow);
      else paragraph(count + ' positions placed', 852, 43, C.cyan);
      if (!one)
        paragraph('A 4,096-position reservation would leave 3,976 slots empty.', 960, 31, C.muted);
      return;
    }
    const x = (v) => 170 + (1510 * v) / 16e9;
    const live = f.existing * passage(state, 2, 'live-total', 0.18, 0.38);
    const big = passage(state, 2, 'big-request', 0.79, 0.98) > 0 || state.beat === 3;
    const small = passage(state, 2, 'small-request', 0.38, 0.6);
    // The challenger starts again at the same live boundary. Only its reservation changes.
    const requested = big ? f.large - f.existing : f.small - f.existing;
    const add = requested * (big ? passage(state, 3, 'over-limit', 0.04, 0.31) : small);
    const fits = !big && spoken(state, 2, 'fits', 0.76);
    const declined = spoken(state, 3, 'queue-request', 0.63);
    paragraph('Dedicated KV pool   ·   weights and other state already reserved', 276, 35);
    api.rect(ctx, x(0), 490, x(f.pool) - x(0), 115, C.panel, C.muted, 2);
    if (live > 0) api.rect(ctx, x(0), 490, x(live) - x(0), 115, C.blue, undefined, 2);
    if (add > 0) {
      const inside = Math.min(live + add, f.pool);
      api.rect(ctx, x(live), 490, x(inside) - x(live), 115, C.cyan, undefined, 2);
      if (live + add > f.pool)
        api.rect(
          ctx,
          x(f.pool) + 3,
          490,
          Math.max(1, x(live + add) - x(f.pool) - 3),
          115,
          C.bg,
          C.yellow,
          2,
        );
    }
    api.line(ctx, x(f.pool), 440, x(f.pool), 652, C.yellow, 5);
    api.text(ctx, '12 GB limit', x(f.pool), 401, 37, C.yellow, 'center');
    if (live === f.existing)
      bracket(ctx, api, x(0), x(live), 663, C.blue, '40 live requests   ·   ' + gb(live));
    if (state.beat >= 2 && small > 0) {
      paragraph(
        'Newcomer   ·   ' +
          (requested / f.perToken).toLocaleString('en-US') +
          ' positions × 64 KiB',
        831,
        40,
      );
      const total = live + add;
      if (fits || declined)
        paragraph(
          gb(total) + (declined ? '   →   queue or reject' : '   →   admit'),
          949,
          48,
          declined ? C.yellow : C.green,
        );
      else if (big) paragraph('Will this reservation fit?', 949, 46, C.ink);
    }
  });
}

export default {
  id: 'page-admission',
  draw: drawPageAdmission,
  cues: [
    'fill-pages',
    'one-slot',
    'pool-only',
    'live-total',
    'small-request',
    'fits',
    'big-request',
    'over-limit',
    'queue-request',
  ],
};
