import {
  arrow,
  assertEqual,
  column,
  dot,
  dynamic,
  group,
  line,
  place,
  rect,
  row,
} from 'vizmatic/stage';
import { area, heading, label, mono, note, para } from '../kit-narrated.mjs';
import { HEADS } from '../../films/grouped-query-attention/fixtures.mjs';
import { cacheBytes, kvGroupForQuery } from '../../films/grouped-query-attention/model.mjs';
export { HEADS, cacheBytes, kvGroupForQuery };
export { ATTENTION, chapterModel } from '../../films/grouped-query-attention/construction.mjs';
export { assertEqual, place, row, column };
export { label, mono, note, para };
export const C = {
  query: 'cyan',
  key: 'blue',
  value: 'green',
  position: 'pink',
  result: 'yellow',
  failure: 'red',
};
export const range = (n) => Array.from({ length: n }, (_, i) => i);
// One reference call keeps the compact arrays live while it materializes the repeated heads.
export const referenceCall = { layers: 1, batch: 2, tokens: 1024, width: 64, bytes: 2 };
export const compactMiB = cacheBytes({ ...referenceCall, kvHeads: HEADS.gqaKV }) / 2 ** 20;
export const repeatedMiB = cacheBytes({ ...referenceCall, kvHeads: HEADS.queries }) / 2 ** 20;
export const point = (r, x, y) => [r.left + r.width * x, r.top + r.height * y];
export const block = (w, h, x, y, fill, opts = {}) =>
  rect(w, h, { fill, stroke: null, ...opts }).at(x, y);
export const [body, foot] = area.rows([9, 1], 'normal');
export const [left, right] = body.columns([1, 1], 'loose');
export const start = (s, title) => s.add(heading(title));
export const caption = (words, color = 'ink') => place(label(words, { size: 36, color }), foot);

// Each slot holds one measurement or one expression. Fit every replacement before scheduling it.
export function readout(
  s,
  c,
  region,
  entries,
  { size = 41, align = 'left', font = 'text-serif' } = {},
) {
  const items = entries.map(([cue, words, color = 'ink']) =>
    place(label(words, { size, font, color }), region, align),
  );
  entries.forEach(([cue, , , after], i) => {
    if (cue == null) s.add(items[i]);
    else if (i === 0) c.show(cue, items[i], { after: !!after });
    else c.swap(cue, items[i - 1], items[i], { after: !!after, fade: 0.18 });
  });
}

// Draw one horizontal scale. Its track reserves precisely the domain used by its moving fill.
export function measure(s, region, { max, initial = 0, color = C.result, height = 23 }) {
  const v = s.value(initial);
  const track = block(region.width, height, ...region.point('center'), 'grid');
  const fill = dynamic(() => {
    const width = Math.max(0.01, (region.width * v.value) / max);
    return block(width, height, region.left + width / 2, region.point('center')[1], color);
  });
  s.add(track, fill);
  return v;
}
export function change(s, c, cue, signal, target, after = false, duration = 0.85) {
  c[after ? 'after' : 'on'](cue, () => s.play(signal.to(target, { duration })));
}

// The eight wires start at fixed query ports. The endpoints move with the K/V rows.
// Mode 0 has eight histories, mode 1 has two, and mode 2 has one.
// Each row records the settled routing mode, retained positions and selected query.
export const STATE = {
  opening: [1, 2, 0, 1],
  attention: [1, 2, 1, 1],
  map: [1, 2, 5],
  architectures: [1, 2, 5],
  tensors: [1, 3, 7],
  budget: [1, 4, 7],
  'kernel-route': [1, 1, 7],
  'cache-step': [1, 2, 0],
  synthesis: [1, 3, 5],
};
const preceding = {
  attention: 'opening',
  map: 'attention',
  architectures: 'map',
  tensors: 'architectures',
  budget: 'tensors',
  'cache-step': 'kernel-route',
};
export function wall(
  s,
  c,
  {
    initial = STATE[preceding[c.id]] ?? (c.id === 'kernel-route' ? [1, 1, -1] : [0, 1, -1]),
    region = left,
  } = {},
) {
  const [header, grid, legend] = region.rows([1, 8, 1], 'normal');
  const [qa, ka] = header.columns([1, 2], 'normal');
  const headA = place(note('Query heads', { color: C.query }), qa, 'left');
  const headB = place(
    note(c.id === 'budget' ? 'GQA · stored positions' : 'Stored token positions'),
    ka,
  );
  const keys = place(
    row([note('Keys', { color: C.key }), note('Values', { color: C.value })], { gap: 'wide' }),
    legend,
  );
  const mode = s.value(initial[0]),
    tokens = s.value(initial[1]),
    lit = s.value(initial[2] ?? -1),
    cursor = s.value(initial[3] ?? -1);
  const heads = HEADS.queries,
    slots = HEADS.tokens + 1;
  const labels = range(heads).map((i) =>
    mono('Q' + i, { size: 35, color: C.query }).moveTo(point(grid, 0.068, (i + 0.5) / heads)),
  );
  const xStart = point(grid, 0.16, 0)[0],
    xEnd = point(grid, 0.45, 0)[0];
  const spacing = grid.height / heads;
  const top = grid.top,
    pitch = (grid.right - xEnd) / slots,
    cellW = pitch * 0.84;
  const columnName = (words, t) =>
    mono(words, { size: 29, color: 'ink' }).moveTo([xEnd + (t + 0.5) * pitch, grid.top - 13]);
  const names = range(slots).map((t) => {
    const named = ['opening', 'attention', 'map', 'architectures', 'tensors', 'budget'].includes(
      c.id,
    );
    return columnName(named && t < 2 ? ['Rain', 'fell'][t] : String(t), t);
  });
  s.add(names);
  const draw = dynamic(() => {
    const m = mode.value;
    const cellH = spacing * (0.53 + 0.56 * Math.min(m, 1));
    const ys = range(heads).map((i) => {
      const g = kvGroupForQuery(i);
      const mid = ((g + 0.5) * heads) / HEADS.gqaKV;
      const r = m <= 1 ? (i + 0.5) * (1 - m) + mid * m : mid * (2 - m) + (heads / 2) * (m - 1);
      return top + r * spacing;
    });
    const marks = [];
    for (let i = 0; i < heads; i++) {
      const y = top + (i + 0.5) * spacing;
      const color = Math.round(lit.value) === i ? C.result : C.query;
      marks.push(
        line([xStart, y], [xEnd, ys[i]], { stroke: color, width: 3 }),
        dot(6, color).at(xStart, y),
        dot(7, color).at(xEnd, ys[i]),
      );
    }
    for (const y of new Set(ys)) {
      for (let t = 0; t < slots; t++) {
        const x = xEnd + (t + 0.5) * pitch,
          frac = Math.max(0, Math.min(1, tokens.value - t));
        marks.push(
          block(cellW, cellH, x, y, 'surface', { stroke: 'faint', width: 1.6, radius: 3 }),
        );
        if (frac > 0) {
          const w = cellW * frac;
          for (const [sign, color] of [
            [-1, C.key],
            [1, C.value],
          ]) {
            marks.push(
              block(w, cellH * 0.36, x - cellW / 2 + w / 2, y + sign * cellH * 0.24, color),
            );
          }
        }
      }
    }
    if (cursor.value >= 0) {
      const x = xEnd + (Math.round(cursor.value) + 0.5) * pitch;
      const topRow = Math.min(...ys) - cellH * 0.85;
      const bottomRow = Math.max(...ys) + cellH * 0.85;
      marks.push(
        rect(pitch * 0.94, bottomRow - topRow, {
          fill: null,
          stroke: C.result,
          width: 3,
          radius: 6,
        }).at(x, (topRow + bottomRow) / 2),
      );
    }
    return group(...marks);
  });
  const rack = [headA, headB, ...keys.nodes, ...labels, draw];
  const take = ['map', 'architectures', 'tensors', 'budget'].includes(c.id);
  const keep = ['attention', 'map', 'architectures', 'tensors'].includes(c.id);
  if (take) c.take(rack);
  else s.add(rack);
  if (keep) c.keep(rack);
  return { mode, tokens, lit, cursor, labels, draw };
}

// The horizontal and vertical vectors share one scale. The axes carry no computed answer.
export function vectorPlane(s, region, { extent = 2, origin = [0.2, 0.82] } = {}) {
  const zero = point(region, ...origin);
  const unit = (Math.min(region.width, region.height) * 0.31) / extent;
  const xy = (v) => [zero[0] + v[0] * unit, zero[1] - v[1] * unit];
  s.add(
    line([region.left, zero[1]], [region.right, zero[1]], { stroke: 'dim', width: 2 }),
    line([zero[0], region.bottom], [zero[0], region.top], { stroke: 'dim', width: 2 }),
  );
  return {
    vector: (v, color, width = 7) => arrow(zero, xy(v), { stroke: color, width, tip: 17 }),
    xy,
    zero,
    unit,
  };
}

// Each column is a logical identity. Copies fan out within that column to their physical ranks.
export function rankCopies(s, region, count, { replicas = 1 } = {}) {
  const [logicalTitle, identity, branches, tiles, physicalTitle] = region.rows(
    [1, 1, 3, 1, 1],
    'normal',
  );
  s.add(
    place(note('Logical K/V identity'), logicalTitle, 'left'),
    place(note('Physical K/V copies across ranks'), physicalTitle, 'left'),
  );
  const cols = identity.columns(count, 'none');
  const copies = s.value(replicas),
    active = s.value(-1);
  s.add(cols.map((col, i) => place(mono(String(i), { color: C.key, size: 36 }), col)));
  s.add(
    dynamic(() => {
      const marks = [],
        pitch = branches.width / count;
      for (let i = 0; i < count; i++) {
        const x = point(branches, (i + 0.5) / count, 0)[0],
          hi = branches.top,
          lo = tiles.top;
        const split = Math.max(0, Math.min(1, copies.value - 1));
        const color = i === Math.round(active.value) ? C.result : 'dim';
        if (copies.value <= 0) {
          marks.push(
            dot(8, color).at(x, hi),
            block(pitch * 0.45, 19, x, hi + tiles.height * 0.55, C.key),
            block(pitch * 0.45, 19, x, hi + tiles.height * 0.82, C.value),
          );
          for (const sign of [-1, 1])
            marks.push(
              block(
                pitch * 0.36,
                tiles.height * 0.55,
                x + sign * pitch * 0.24,
                tiles.point('center')[1],
                'surface',
                { stroke: 'faint', width: 2, dash: [7, 5] },
              ),
            );
          continue;
        }
        for (const sign of split > 0 ? [-1, 1] : [0]) {
          const end = x + sign * pitch * 0.24 * split;
          marks.push(
            line([x, hi], [end, lo], { stroke: color, width: 3 }),
            dot(5, color).at(x, hi),
          );
          for (const [j, fill] of [
            [0, C.key],
            [1, C.value],
          ])
            marks.push(
              block(
                pitch * 0.37,
                tiles.height * 0.25,
                end,
                lo + tiles.height * (0.29 + j * 0.29),
                fill,
              ),
            );
        }
      }
      return group(...marks);
    }),
  );
  return { copies, active };
}

export function stripCells(region, count, { color = 'grid', height = 0.55 } = {}) {
  const step = region.width / count;
  return range(count).map((i) =>
    block(step * 0.85, region.height * height, ...point(region, (i + 0.5) / count, 0.5), color, {
      radius: 3,
    }),
  );
}
