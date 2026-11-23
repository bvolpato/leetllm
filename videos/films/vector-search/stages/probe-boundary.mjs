import { exact, probeBoundaryState } from '../model.mjs';
import { neighborhood, listDrawer } from '../neighborhood.mjs';
import { text } from '../defaults.mjs';

export default {
  id: 'probe-boundary',
  cues: ['probe-left', 'first-slot', 'show-left-pair', 'inspect-miss', 'open-right', 'replace-c', 'count-work'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const { left, right, first, pair, swap, scanned, ids } = probeBoundaryState(state);
    api.focus.target('partition-map', () => neighborhood(ctx, api, {
      boundary: true,
      links: pair ? [['A', 1], [swap ? 'B' : 'C', swap || 1]] : [],
      selected: swap === 1 ? ['A', 'B'] : [],
    }));
    api.focus.target('posting-lists', () => {
      text(ctx, api, 'Vector scores inside each list (d²)', 1240, 253, 30, C.muted);
      listDrawer(ctx, api, 0, 345, { open: left > 0, scored: scanned[0] });
      listDrawer(ctx, api, 1, 562, { open: right > 0, scored: scanned[1] });
      text(ctx, api, 'Passages scored    ' + (scanned[0].length + scanned[1].length) + ' / 6', 1250, 787, 33, C.ink);
    });
    api.focus.target('result-slots', () => {
      text(ctx, api, 'Returned', 120, 969, 36, C.muted);
      text(ctx, api, first ? ids[0] : '?', 365, 974, 56, first ? C.green : C.ink);
      if (swap > 0 && swap < 1) {
        ctx.save();
        ctx.globalAlpha *= 1 - swap;
        text(ctx, api, 'C', 500, 974 - 76 * swap, 56, C.ink);
        ctx.restore();
        ctx.save();
        ctx.globalAlpha *= swap;
        text(ctx, api, ids[1], 500, 974 + 57 * (1 - swap), 56, C.green);
        ctx.restore();
      } else text(ctx, api, pair ? ids[1] : '?', 500, 974, 56, swap ? C.green : C.ink);
      const reference = exact().map((p) => p.id).join(' and ');
      const note = !pair ? 'Left list only. Which ID fills slot two?' : swap > 0
        ? 'Exact pair recovered: ' + reference
        : 'Exact pair: ' + reference + '     •     B lives on the right';
      text(ctx, api, note, 1785, 969, 39, C.yellow, 'right');
    });
  },
};
