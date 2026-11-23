import { CENTROIDS, POINTS, QUERY } from './fixtures.mjs';
import { distance } from './arithmetic.mjs';
import { partition, postingList } from './model.mjs';
import { text } from './defaults.mjs';

export const score = (point, query = QUERY) => distance(point, query).toFixed(2);
export const passage = (id) => POINTS.find((point) => point.id === id);

function markQuery(ctx, api, x, y) {
  api.path(ctx, [{ x, y: y - 14 }, { x: x + 14, y }, { x, y: y + 14 }, { x: x - 14, y }], {
    closed: true, fill: api.C.yellow, color: api.C.yellow, width: 2,
  });
}

// The close view uses equal units and crops out D, E and F.
const x = (v) => 190 + (v - 3.5) * 495;
const y = (v) => 577 - (v - 5) * 495;
export const mapPosition = (point) => ({ x: x(point.x), y: y(point.y) });

export function neighborhood(ctx, api, { links = [], boundary = false, selected = [], guides = false, axes = true } = {}) {
  const { C } = api;
  const qx = x(QUERY.x), qy = y(QUERY.y);
  text(ctx, api, axes ? 'Three passages near the query' : 'Passages in embedding space', 140, 275, 36, C.ink);
  if (axes) {
    api.line(ctx, x(3.45), y(4.55), x(5.5), y(4.55), C.muted, 2);
    api.line(ctx, x(3.45), y(4.55), x(3.45), y(5.5), C.muted, 2);
    for (const tick of [3.5, 4, 4.5, 5, 5.5]) {
      api.line(ctx, x(tick), y(4.55), x(tick), y(4.55) + 10, C.muted, 2);
      text(ctx, api, String(tick), x(tick), y(4.55) + 48, 28, C.muted, 'center');
    }
    for (const tick of [4.6, 5, 5.4]) {
      api.line(ctx, x(3.45) - 9, y(tick), x(3.45), y(tick), C.muted, 2);
      text(ctx, api, String(tick), x(3.45) - 18, y(tick) + 10, 27, C.muted, 'right');
    }
  }
  if (boundary) {
    api.line(ctx, x(5), y(4.56), x(5), y(5.48), C.muted, 3);
    text(ctx, api, 'Left list', x(5) - 24, 366, 29, C.blue, 'right');
    text(ctx, api, 'Right list', x(5) + 24, 366, 29, C.pink);
  }
  for (const [id, progress] of links) {
    const p = passage(id);
    api.line(ctx, qx, qy, api.lerp(qx, x(p.x), progress), api.lerp(qy, y(p.y), progress), C.cyan, 5);
  }
  if (guides) {
    const a = passage('A');
    api.line(ctx, qx, qy, x(a.x), qy, C.muted, 2);
    api.line(ctx, x(a.x), qy, x(a.x), y(a.y), C.muted, 2);
  }
  for (const id of ['C', 'A', 'B']) {
    const p = passage(id);
    const color = boundary ? (partition(p) ? C.pink : C.blue) : C.ink;
    api.circle(ctx, x(p.x), y(p.y), 12, color);
    if (selected.includes(id)) api.circle(ctx, x(p.x), y(p.y), 21, null, C.green, 4);
    text(ctx, api, id, x(p.x), y(p.y) - 29, 42, color, 'center');
  }
  markQuery(ctx, api, qx, qy);
  text(ctx, api, 'query', qx, qy + 56, 30, C.yellow, 'center');
}

export function corpus(ctx, api, { query = QUERY, lists = false, border = lists, scanned = [], identified = [], route = [] } = {}) {
  const { C } = api;
  const project = (p) => ({ x: 165 + 105 * p.x, y: 1100 - 105 * p.y });
  // Use a larger window for all six stored vectors.
  if (border) {
    api.line(ctx, project({ x: 5, y: 0 }).x, 260, project({ x: 5, y: 0 }).x, 854, C.muted, 3);
    text(ctx, api, 'x = 5', 690, 899, 27, C.muted, 'center');
  }
  if (lists) CENTROIDS.forEach((p, i) => {
    const z = project(p);
    api.rect(ctx, z.x - 12, z.y - 12, 24, 24, C.bg, i ? C.pink : C.blue, 0);
    if (i) text(ctx, api, 'Right center', z.x, z.y + 65, 27, C.pink, 'center');
    else text(ctx, api, 'Left center', z.x - 25, z.y - 28, 27, C.blue, 'right');
  });
  for (const [from, to, progress] of route) {
    const a = project(from), b = project(to);
    api.line(ctx, a.x, a.y, api.lerp(a.x, b.x, progress), api.lerp(a.y, b.y, progress), C.cyan, 5);
  }
  POINTS.forEach((p) => {
    const z = project(p);
    const color = lists ? (partition(p) ? C.pink : C.blue) : C.ink;
    api.circle(ctx, z.x, z.y, 8, color);
    if (scanned.includes(p.id)) api.circle(ctx, z.x, z.y, 14, null, C.green, 3);
    const dy = p.id === 'B' || p.id === 'C' ? 47 : -23;
    if (p.id === 'E') text(ctx, api, p.id, z.x - 30, z.y + 10, 31, color, 'right');
    else text(ctx, api, p.id, z.x, z.y + dy, 31, color, 'center');
  });
  const q = project(query);
  markQuery(ctx, api, q.x, q.y);
  if (query === QUERY) {
    text(ctx, api, 'query', q.x - 50, q.y + 86, 29, C.yellow, 'center');
  } else {
    markQuery(ctx, api, 160, 287);
    text(ctx, api, 'Query   (' + query.x.toFixed(1) + ', ' + query.y.toFixed(1) + ')', 192, 300, 34, C.yellow);
  }
  if (identified.length) {
    text(ctx, api, 'Exact reference', 145, 944, 30, C.muted);
    text(ctx, api, identified.join('  ·  '), 435, 944, 39, C.green);
  }
}

export function listDrawer(ctx, api, index, y, { assigned, scored = [], open = false } = {}) {
  const { C } = api;
  const color = index ? C.pink : C.blue;
  const rows = postingList(index);
  text(ctx, api, index ? 'Right list' : 'Left list', 1250, y, 34, color);
  if (assigned === undefined)
    text(ctx, api, open ? 'open' : 'closed', 1780, y, 29, open ? C.ink : C.muted, 'right');
  for (const [i, p] of rows.entries()) {
    const x = 1310 + i * 190;
    const visible = assigned === undefined || assigned.includes(p.id);
    if (visible) text(ctx, api, p.id, x, y + 72, 50, color, 'center');
    api.line(ctx, x - 61, y + 88, x + 61, y + 88, color, scored.includes(p.id) ? 5 : 2);
    if (scored.includes(p.id)) text(ctx, api, score(p), x, y + 133, 31, C.ink, 'center');
  }
}

export function resultPair(ctx, api, x, y, label, ids, color = api.C.ink, emptySlot = '?') {
  text(ctx, api, label, x, y, 33, api.C.muted);
  for (let i = 0; i < 2; i++) {
    const center = x + 70 + i * 215;
    text(ctx, api, ids[i] ?? emptySlot, center, y + 105, 70, ids[i] ? color : api.C.muted, 'center');
    api.line(ctx, center - 65, y + 125, center + 65, y + 125, api.C.muted, 2);
  }
}
