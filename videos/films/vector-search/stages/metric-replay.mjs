import { distance } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import { text } from '../defaults.mjs';

const query = { x: 1, y: 0.1 };
const records = [
  { id: 101, x: 10, y: 0 },
  { id: 202, x: 1, y: 1 },
];
const unit = (p) => ({ x: p.x / Math.hypot(p.x, p.y), y: p.y / Math.hypot(p.x, p.y) });
const unitQuery = unit(query);
const dot = (p, q) => p.x * q.x + p.y * q.y;

export function metricReplay(normalized, deleted = false) {
  return records.filter((r) => !(deleted && r.id === 101))
    .map((r) => ({ id: r.id, value: normalized ? dot(unit(r), unitQuery) : distance(r, query) }))
    .sort((a, b) => (normalized ? b.value - a.value : a.value - b.value) || a.id - b.id);
}

export default {
  id: 'metric-replay',
  cues: ['raw-distance', 'unit-vectors', 'unit-zoom', 'cosine-rank', 'remove-record'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const normalized = cueProgress(state, 'unit-vectors');
    const magnify = cueProgress(state, 'unit-zoom');
    const cos = cueProgress(state, 'cosine-rank') > 0;
    const deleted = cueProgress(state, 'remove-record') > 0;
    const scale = api.lerp(88, 615, magnify);
    const ox = 192, oy = 779;
    const project = (p) => {
      const u = unit(p);
      return { x: ox + scale * api.lerp(p.x, u.x, normalized), y: oy - scale * api.lerp(p.y, u.y, normalized) };
    };
    api.focus.target('metric-geometry', () => {
      api.line(ctx, ox, oy, 1150, oy, C.muted, 2);
      api.line(ctx, ox, oy, ox, 210, C.muted, 2);
      if (magnify > 0) {
        const arc = Array.from({ length: 33 }, (_, i) => {
          const angle = Math.PI * i / 80;
          return { x: ox + scale * Math.cos(angle), y: oy - scale * Math.sin(angle) };
        });
        api.path(ctx, arc, { color: C.muted, width: 2 });
      }
      const series = [
        { p: records[0], label: '101', color: C.pink, dx: 16, dy: 48 },
        { p: records[1], label: '202', color: C.blue, dx: 16, dy: -16 },
        { p: query, label: 'query', color: C.yellow, dx: 29, dy: -16 },
      ];
      for (const { p, label, color, dx, dy } of series) {
        if (deleted && p.id === 101) continue;
        const z = project(p);
        api.line(ctx, ox, oy, z.x, z.y, color, 4);
        api.circle(ctx, z.x, z.y, 9, color);
        text(ctx, api, label, z.x + dx, z.y + dy, 32, color);
      }
    });
    api.focus.target('metric-ranks', () => {
      text(ctx, api, deleted ? 'Eligible cosine results' : cos ? 'Cosine · higher wins' : normalized > 0 ? 'Normalize both sides' : 'Squared L2 · lower wins', 1220, 309, 38, C.ink);
      if (normalized > 0 && !cos) {
        text(ctx, api, 'Each arrow keeps its direction.', 1220, 482, 32, C.ink);
        text(ctx, api, 'Each length becomes one.', 1220, 564, 32, C.yellow);
      } else {
        const reveal = cos || cueProgress(state, 'raw-distance') > 0;
        const rows = reveal ? metricReplay(cos, deleted) : records;
        rows.forEach((r, i) => {
          const y = 469 + i * 142;
          text(ctx, api, 'ID ' + r.id, 1220, y, 44, r.id === 101 ? C.pink : C.blue);
          text(ctx, api, reveal ? r.value.toFixed(cos ? 3 : 2) : '?', 1740, y, 49, C.ink, 'right');
        });
        if (deleted) text(ctx, api, '−1     empty second slot', 1220, 611, 35, C.muted);
      }
    });
    text(ctx, api, deleted ? 'Check each replica against the revised eligible IDs.'
      : cos ? 'Retrain IVF centers and reassign the lists in the new geometry.'
      : normalized > 0 ? 'Use the inner product of unit vectors.'
      : 'Query (1, 0.1)       ID 101 (10, 0)       ID 202 (1, 1)', 960, 965, 37, C.ink, 'center');
  },
};
