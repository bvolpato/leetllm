import { coarseCenters, indexedPassages, listOwner } from './vector-search.mjs';

export const names = {
  generic_api: 'Generic API',
  key_rotation: 'Key rotation',
  quota_page: 'Quota',
};
const rotation = indexedPassages.find((d) => d.id === 'key_rotation');
const boundary = (coarseCenters[0] + coarseCenters[1]) / 2;
const fullX = (value) => 210 + 150 * value;

export function drawProbeMap(p, { query, route, showCenters, showPassages, budget, assign = 1 }) {
  const { C, label, rule, dot, target } = p;
  const lists = route?.lists ?? [];
  target('probe-map', () => {
    label('2 lists', 150, 247, 37, C.ink);
    if (budget) label('Probe budget   ' + budget, 1765, 247, 37, C.yellow, 'right');
    coarseCenters.forEach((c, i) => {
      const x = fullX(c),
        open = lists.includes(i);
      const color = open ? C.cyan : C.muted;
      label('Center ' + c, x, 334, 41, C.ink, 'center');
      if (showCenters)
        label(Math.abs(query - c).toFixed(1) + ' away', x, 388, 32, C.yellow, 'center');
      const a = i === 0 ? c : boundary,
        b = i === 0 ? boundary : c;
      rule(fullX(a), 448, fullX(b), 448, color, open ? 9 : 4);
      label(
        'List ' + i + (open ? ' open' : lists.length ? ' closed' : ''),
        (fullX(a) + fullX(b)) / 2,
        413,
        34,
        color,
        'center',
      );
      dot(x, 448, 10, C.ink);
    });
    rule(fullX(boundary), 418, fullX(boundary), 466, C.muted, 3);
    for (const doc of indexedPassages) {
      const x = fullX(doc.value);
      const scanned = lists.includes(listOwner(doc.value));
      const tone = scanned ? C.cyan : C.ink;
      const y = 469 + (1 - assign) * 28;
      dot(x, y, 9, tone);
      label(names[doc.id] + '  ' + doc.value, x, y + 60, 36, tone, 'center');
      if (showPassages && scanned)
        label(
          'distance  ' + Math.abs(query - doc.value).toFixed(1),
          x,
          y + 106,
          30,
          C.green,
          'center',
        );
    }
    if (query !== null) {
      const x = fullX(query);
      label('Query  ' + Number(query.toFixed(2)), x, 338, 44, C.yellow, 'center');
      rule(x, 355, x, 438, C.yellow, 3);
      dot(x, 449, 11, C.yellow);
    }
  });
}

export function drawBoundaryDetail(p, query, showGap) {
  const { C, label, rule, dot, target } = p;
  const x = (val) => 725 + (val - 4.7) * 1600;
  const y = 764;
  target('probe-inset', () => {
    label('Boundary detail', 150, 725, 41);
    label('4.7 to 5.3', 150, 789, 33, C.muted);
    rule(x(4.7), y, x(5.3), y, C.muted, 3);
    for (const value of [4.7, 5.0, 5.3]) {
      rule(x(value), y - 9, x(value), y + 12, C.muted);
      label(value === 5 ? 'Boundary 5' : value, x(value), y + 57, 29, C.muted, 'center');
    }
    if (query !== null) {
      const qx = x(query);
      dot(qx, y, 12, C.yellow);
      label('Query  ' + Number(query.toFixed(2)), qx, y - 65, 35, C.yellow, 'center');
      rule(qx, y - 48, qx, y - 18, C.yellow, 3);
    }
    const rx = x(rotation.value);
    dot(rx, y, 9, C.green);
    rule(rx, y + 16, rx, y + 69, C.green, 2);
    label('Key rotation  ' + rotation.value, rx, y + 113, 35, C.green, 'center');
    if (showGap) {
      const a = x(query),
        b = rx;
      rule(a, y - 25, b, y - 25, C.green, 4);
      label('Gap  ' + Math.abs(query - rotation.value).toFixed(1), 150, 864, 35, C.green);
    }
  });
}

export function drawCheckCounts(p, rows) {
  const { C, label, rule, target } = p;
  target('probe-cost', () => {
    label('Distance checks', 150, 674, 40);
    ['Centers', 'Passages', 'Total'].forEach((heading, i) =>
      label(heading, 913 + 327 * i, 673, 30, C.muted, 'center'),
    );
    rows.forEach(([name, centers, docs], i) => {
      const y = 743 + 69 * i;
      rule(150, y - 45, 1755, y - 45, C.panel, 2);
      label(name, 150, y, 34);
      [centers, docs, centers + docs].forEach((n, j) =>
        label(n, 913 + 327 * j, y, 37, j === 2 ? C.yellow : C.ink, 'center'),
      );
    });
  });
}
