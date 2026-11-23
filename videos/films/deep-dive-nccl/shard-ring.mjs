import { inputs, reduced } from './fixtures.mjs';
import { heard, sampleModel } from './construction.mjs';

const stations = [
  [395, 363],
  [1525, 363],
  [1525, 821],
  [395, 821],
];
const slot = 2;

export function drawShardRing(ctx, scene, state, api) {
  const { C, focus } = api;
  const gathering = scene.id === 'gather';
  const m = sampleModel(scene.id, state);
  const [x0, y0] = stations[m.source];
  const [x1, y1] = stations[m.target];
  const x = x0 + (x1 - x0) * m.flight;
  const y = y0 + (y1 - y0) * m.flight;
  const value = gathering ? m.value : m.addition === 1 ? m.value : m.before.value;

  function packet(px, py, amount) {
    focus.target('ring-add', () => {
      api.rect(ctx, px - 104, py - 45, 208, 90, C.panel, C.yellow, 12);
      api.text(ctx, String(amount), px, py + 16, 48, C.yellow, 'center', 'mono');
    });
  }

  focus.target('ring-rail', () => {
    stations.forEach(([px, py], r) => {
      const [nx, ny] = stations[(r + 1) % stations.length];
      api.line(ctx, px, py, nx, ny, C.muted, 3);
    });
    api.line(ctx, x0, y0, x, y, C.cyan, 6);
    stations.forEach(([px, py], rank) => {
      api.circle(ctx, px, py, 13, C.bg, C.muted, 3);
      const label = gathering ? 'Rank ' + rank : 'Rank ' + rank + '    + ' + inputs[rank][slot];
      api.text(ctx, label, px, py === 363 ? 269 : 943, 39, C.ink, 'center');
      if (gathering && m.known.includes(rank) && !(rank === m.target && m.flight === 1))
        packet(px, py, reduced[slot]);
    });
    if (!gathering || m.flight === 1) packet(x, y, value);
    else if (m.flight > 0) {
      const horizontal = y0 === y1;
      const departure = horizontal ? 104 : 45;
      const bounds = 2 * departure + 8;
      const distance = Math.hypot(x - x0, y - y0);
      if (distance > bounds) packet(x, y, value);
      else if (distance > departure + 12) api.circle(ctx, x, y, 10, C.yellow);
    }
  });

  focus.target('ring-add', () => {
    if (gathering) {
      const count = m.known.length;
      api.text(ctx, 'Ranks holding slot 2', 960, 512, 35, C.muted, 'center');
      api.text(ctx, count + ' of 4', 960, 605, 78, C.yellow, 'center');
      const vector = heard(state, 2, 'gather-vector');
      api.text(
        ctx,
        vector ? '[' + reduced.join(', ') + ']' : 'Value per copy   ' + reduced[slot],
        960,
        693,
        vector ? 44 : 35,
        C.ink,
        'center',
      );
    } else {
      const added = m.addition === 1;
      const arrived = m.flight === 1;
      const next = inputs[m.target][slot];
      const location =
        m.flight === 0
          ? 'At rank ' + m.source
          : arrived
            ? 'At rank ' + m.target
            : 'Slot 2 in transit';
      api.text(ctx, location, 960, 501, 35, C.muted, 'center');
      const expression = arrived
        ? m.before.value + ' + ' + next + ' = ' + (added ? m.value : '?')
        : String(value);
      api.text(ctx, expression, 960, 602, 62, added ? C.yellow : C.ink, 'center', 'mono');
      api.text(ctx, 'Already counted', 960, 669, 29, C.muted, 'center');
      [3, 0, 1, 2].forEach((rank, i) => {
        const counted = m.ranks.includes(rank);
        const px = 752 + i * 139;
        api.rect(ctx, px - 54, 693, 108, 54, C.panel, counted ? C.cyan : C.muted, 6);
        api.text(ctx, 'R' + rank, px, 730, 31, counted ? C.cyan : C.muted, 'center', 'mono');
      });
    }
  });
}
