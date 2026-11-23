// What the scenes of `inference-data-plane` share: the running example as one board, the one
// drawing of a slot and of a block, and the job of each color.
//
// The example is request R4219. Prefill makes its prompt KV state, 48 blocks in 6 segments. The
// state moves to a decode worker that has 64 slots. A block that moves is one block: it leaves its
// cell, runs on the rail of its segment and lands in its slot. Every part follows a few values, so
// a scene moves a value and the board answers.
import {
  boxOf,
  clamp,
  column,
  commas,
  dynamic,
  grid,
  group,
  lerp,
  line,
  place,
  polyline,
  rect,
  smoothstep,
  text,
} from 'vizmatic/stage';
import {
  compatible,
  expectedBlockIds,
  expiredAttempt,
} from '../../films/inference-data-plane/fixtures.mjs';
import { lifecycleSnapshot } from '../../films/inference-data-plane/construction.mjs';
import { area, label, note, textWidth } from '../kit-narrated.mjs';

/** One color has one job through the lesson. */
export const COLOR = {
  /** The KV state of R4219: a block of its bytes, and the work that makes it or moves it. */
  state: 'blue',
  /** Valid for decode: a committed block, a field that matches, an output token. */
  valid: 'green',
  /** The control plane: a reservation and its lease, the owner, a receipt. */
  control: 'cyan',
  /** The other party: request R4220, rank 1 beside rank 0, a queue, the traffic of other requests. */
  other: 'pink',
  /** What the voice points at now, and the one result that matters. */
  mark: 'yellow',
  /** A failure: a mismatch, a timeout, a wrong sum, a late writer, a duplicate. */
  fail: 'red',
  /** A free slot, and a part that is done. */
  quiet: 'dim',
};

const receipt = lifecycleSnapshot(0, 0);
/** The names and the counts of the example. They come from the model of the lesson. */
export const FIXTURE = {
  request: receipt.request,
  operation: receipt.operation,
  generation: expiredAttempt.generation,
  /** The lease of the reservation, as `validation.mjs` names it. */
  lease: 'lease-12',
  model: `${compatible.source.model} r${compatible.source.revision}`,
  layout: compatible.source.layout,
  dtype: compatible.source.dtype,
  blockKind: compatible.source.blocks,
  segments: expectedBlockIds.length,
  blocks: expiredAttempt.chargedBlocks,
  /** The blocks of one segment. */
  segmentBlocks: expiredAttempt.chargedBlocks / expectedBlockIds.length,
  /** The slots of the decode worker of the board: `allocate(64, [48, 24])` in the model. */
  slots: 64,
};

/** The frame of a scene that shows the board: the board over a band for what the scene adds. */
// The board needs 552 pixels: the name of a pool, and the 8 rows of the decode worker.
export const [BOARD, FOOT] = area.rows([552, 324], 'normal');

/** The measures of a cell, in pixels: the distance from one cell to the next, its side, its corner. */
export const PITCH = 60;
export const CELL = 50;
const CORNER = 7;

/** The outline of a free slot and of a panel: quiet, and still clear on a small screen. */
const FREE = 'gridStrong';

const range = (count) => Array.from({ length: count }, (_, index) => index);

/**
 * The grid of cells of one worker, with the panel behind it. Lay the panel out, and then `p(i)`
 * gives the middle of cell `i` on the stage. The cells are numbered row by row from the top left.
 */
export function pool(count, { columns = 8, pitch = PITCH, cell = CELL * (pitch / PITCH) } = {}) {
  const rows = Math.ceil(count / columns);
  const margin = pitch - cell;
  const panel = rect(columns * pitch + margin, rows * pitch + margin, {
    radius: 14,
    fill: 'surface',
    stroke: FREE,
    width: 2,
  });
  let origin = null;
  const p = (index) => {
    if (!origin) {
      const box = boxOf(panel);
      origin = [box.cx - ((columns - 1) / 2) * pitch, box.cy - ((rows - 1) / 2) * pitch];
    }
    return [origin[0] + (index % columns) * pitch, origin[1] + Math.floor(index / columns) * pitch];
  };
  return { panel, count, columns, rows, pitch, cell, p };
}

/** A block of KV state: a filled cell. This is the one drawing of a block in the lesson. */
export const block = ([x, y], color = COLOR.state, { size = CELL, opacity = 1 } = {}) =>
  rect(size, size, { fill: color, stroke: null, radius: CORNER * (size / CELL), opacity }).at(x, y);

/** A slot with no bytes: an outline. A reserved slot has the color of the control plane. */
export const slot = ([x, y], color = FREE, { size = CELL, opacity = 1, dash = null } = {}) =>
  rect(size, size, {
    fill: null,
    stroke: color,
    width: 2,
    radius: CORNER * (size / CELL),
    opacity,
    ...(dash ? { dash } : {}),
  }).at(x, y);

/** The outline of a reserved slot: dashes, because the slot holds a promise and no bytes. */
export const RESERVED_DASH = [7, 6];

/** The lag between two blocks of one segment, as a share of the move of the segment. */
const TRAIN = 0.07;

/**
 * The board: the pool of the prefill worker at the left, the pool of the decode worker at the
 * right, and the rails of the link between them. `from` is the state at the start of a scene.
 *
 * The values that a scene moves:
 * - `made`: the blocks that prefill has made, 0 to 48.
 * - `reserved`: the slots that the decode worker has reserved, 0 to 64.
 * - `sent`: the blocks that left for the decode worker, 0 to 48. One segment moves at a time.
 * - `valid`: 0 to 1. At 1 the blocks that arrived are committed, and they are green.
 * - `gone`: 0 to 1. At 1 the blocks that arrived are released.
 * - `kept`: 0 to 1. At 1 the prefill worker shows the copy that it keeps of a block that left.
 *
 * `order` lists the segments in the order in which they leave. A segment that is not in the list
 * never leaves. `slotOf(i)` is the slot of block `i`. `hide` lists blocks that a scene draws itself.
 */
export function handoff(s, from = {}) {
  const { segments, segmentBlocks, blocks, slots } = FIXTURE;
  const source = pool(blocks),
    dest = pool(slots);
  const names = { source: label('prefill worker'), dest: label('decode worker') };
  place(column([names.source, source.panel], { gap: 'tight' }), BOARD, 'top left');
  place(column([names.dest, dest.panel], { gap: 'tight' }), BOARD, 'top right');

  const order = from.order ?? range(segments);
  const hidden = new Set(from.hide ?? []);
  const slotOf = from.slotOf ?? ((index) => index);
  const made = s.value(from.made ?? 0),
    reserved = s.value(from.reserved ?? 0),
    sent = s.value(from.sent ?? 0),
    valid = s.value(from.valid ?? 0),
    gone = s.value(from.gone ?? 0),
    kept = s.value(from.kept ?? 0);

  /** How far block `index` is on its way: 0 in its cell, 1 in its slot. */
  const travel = (index) => {
    const turn = order.indexOf(Math.floor(index / segmentBlocks));
    if (turn < 0) return 0;
    const moved = clamp(sent.value / segmentBlocks - turn, 0, 1);
    // The block at the right end of a segment leaves first, so no block passes over another.
    const wait = (segmentBlocks - 1 - (index % segmentBlocks)) * TRAIN;
    return smoothstep(clamp((moved - wait) / (1 - (segmentBlocks - 1) * TRAIN), 0, 1));
  };
  const placeOf = (index) => {
    const a = source.p(index),
      b = dest.p(slotOf(index)),
      t = travel(index);
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  };

  // The rails of the link: one for each segment, from panel to panel.
  const rails = group(
    ...range(segments).map((segment) => {
      const y = source.p(segment * segmentBlocks)[1];
      return line([boxOf(source.panel).right, y], [boxOf(dest.panel).left, y], {
        stroke: 'grid',
        width: 2,
      });
    }),
  );

  /** The block that lands in each slot, or -1. A slot that holds a block shows no outline of its own. */
  const tenant = range(slots).map(
    (index) => range(blocks).find((id) => slotOf(id) === index) ?? -1,
  );
  const cells = dynamic(() => [
    ...range(blocks).map((index) => slot(source.p(index))),
    ...range(slots).flatMap((index) => {
      const full = tenant[index] >= 0 && made.value > tenant[index] && travel(tenant[index]) >= 1;
      const held = full && gone.value < 1 ? 0 : clamp(reserved.value - index, 0, 1);
      return [
        held < 1 && slot(dest.p(index), FREE, { opacity: 1 - held }),
        held > 0 && slot(dest.p(index), COLOR.control, { opacity: held, dash: RESERVED_DASH }),
      ].filter(Boolean);
    }),
  ]);

  const state = dynamic(() =>
    range(blocks).flatMap((index) => {
      const shown = hidden.has(index) ? 0 : clamp(made.value - index, 0, 1);
      if (shown <= 0) return [];
      const t = travel(index);
      const there = t >= 1 ? 1 - gone.value : 1;
      return [
        t > 0 &&
          kept.value > 0 &&
          block(source.p(index), COLOR.state, { opacity: 0.3 * kept.value }),
        there > 0 && block(placeOf(index), COLOR.state, { opacity: shown * there }),
        t >= 1 &&
          valid.value > 0 &&
          block(placeOf(index), COLOR.valid, { opacity: valid.value * there }),
      ].filter(Boolean);
    }),
  );

  /** The room between the two pools, for what a scene puts on the link. */
  const between = {
    left: boxOf(source.panel).right,
    right: boxOf(dest.panel).left,
    top: boxOf(dest.panel).top,
    bottom: boxOf(dest.panel).bottom,
  };

  return {
    source,
    dest,
    names,
    rails,
    cells,
    state,
    /** The parts that stand for the whole scene, for `s.add`. */
    standing: [names.source, names.dest, source.panel, dest.panel, rails, cells, state],
    made,
    reserved,
    sent,
    valid,
    gone,
    kept,
    travel,
    placeOf,
    between,
  };
}

/**
 * A row of cells that a count fills from the left, such as the output tokens of the decode worker
 * or the prompt that prefill reads. Lay `bed` out, and add `marks`. `read()` gives the count now.
 * A cell that is not full is an outline, or a fill in the color `rest`.
 */
export function cellRow(
  count,
  read,
  { width, height = CELL, color = COLOR.valid, gap = 10, rest = null } = {},
) {
  const bed = rect(width, height, { fill: null, stroke: null });
  const side = (width - gap * (count - 1)) / count;
  const marks = dynamic(() => {
    const box = boxOf(bed);
    return range(count).flatMap((index) => {
      const x = box.left + side / 2 + index * (side + gap);
      const full = clamp(read() - index, 0, 1);
      const corner = Math.min(CORNER, side / 3);
      return [
        full < 1 &&
          rect(side, height, {
            fill: rest,
            stroke: rest ? null : FREE,
            width: 2,
            radius: corner,
            opacity: 1 - full,
          }).at(x, box.cy),
        full > 0 &&
          rect(side, height, { fill: color, stroke: null, radius: corner, opacity: full }).at(
            x,
            box.cy,
          ),
      ].filter(Boolean);
    });
  });
  return { bed, marks, x: (index) => boxOf(bed).left + side / 2 + index * (side + gap) };
}

/** The sides of the payload slab, in the order of the size formula of the lesson. */
export const SIDE = { tensors: 0, layers: 1, tokens: 2, heads: 3, width: 4, bytes: 5 };

/**
 * The look of the slab for a shape of the cache. The slab is a picture and not a scale drawing:
 * a side is longer when its factor is larger, and the numbers are in the row of factors.
 */
export const SLAB = {
  toy: { w: 380, band: 150, bands: 2, depth: 3, off: 18 },
  production: { w: 560, band: 44, bands: 8, depth: 9, off: 10 },
};

/**
 * The payload as a slab: the tensors K and V side by side, each a stack of layers. One sheet is
 * as wide as the tokens of the prompt and as high as the KV heads. Each factor of the size formula
 * has a mark on its side, and `lit` names the side that is yellow now.
 *
 * The values that a scene moves: `w` (the width of a sheet), `band` (the height of one head),
 * `bands` (the heads), `depth` (the sheets behind the front one), `off` (the step of the stack),
 * `cut` (0 to 1: the heads split into two rank shards), `pad` (0 to 1: padding to a whole block),
 * `blocks` (0 to 1: the cuts between blocks of tokens), `meta` (0 to 1: a bar of metadata) and
 * `buffer` (0 to 1: the outline of the buffer that must hold all of it).
 */
export function slab(s, region, from = SLAB.toy) {
  const v = {
    w: s.value(from.w),
    band: s.value(from.band),
    bands: s.value(from.bands),
    depth: s.value(from.depth),
    off: s.value(from.off),
    cut: s.value(0),
    pad: s.value(0),
    blocks: s.value(0),
    meta: s.value(0),
    buffer: s.value(0),
    lit: s.value(-1),
  };
  /** The room between the two halves of a sheet when the heads are in two shards. */
  const SHARD_GAP = 40;
  /** The room between the stack of K and the sheet of V. */
  const BETWEEN = 80;
  const TAB = { width: 60, height: 52 };

  /** The places of the slab for a state, or now: the front sheets of K and V, and the rise of a stack. */
  const measure = (state = null) => {
    const read = (name) => (state ? (state[name] ?? 0) : v[name].value);
    const w = read('w'),
      split = SHARD_GAP * read('cut'),
      h = read('band') * read('bands') + split,
      rise = read('depth') * read('off');
    const total = 2 * w + BETWEEN + 2 * rise;
    const left = region.cx - total / 2,
      top = region.cy - (h + rise) / 2 + rise;
    return {
      w,
      h,
      rise,
      split,
      top,
      bottom: top + h,
      k: left,
      v: left + w + rise + BETWEEN,
      right: left + total,
    };
  };

  /** The middle of the name tab of a tensor: in the last corner of its front sheet. */
  const tabAt = (m, x) => [x + m.w - TAB.width / 2 - 14, m.bottom - TAB.height / 2 - 12];
  /** True when a point is behind a tab, with a margin. A line of a sheet stops there. */
  const behindTab = (m, x, [px, py]) => {
    const [tx, ty] = tabAt(m, x);
    return Math.abs(px - tx) < TAB.width / 2 + 6 && Math.abs(py - ty) < TAB.height / 2 + 6;
  };

  const mark = (from, to, index) => {
    const lit = Math.round(v.lit.value) === index;
    const dx = to[0] - from[0],
      dy = to[1] - from[1],
      length = Math.hypot(dx, dy) || 1;
    // A short tick at each end, across the line.
    const tick = [(-dy / length) * 8, (dx / length) * 8];
    const style = { stroke: lit ? COLOR.mark : 'dim', width: lit ? 5 : 2 };
    return [
      line(from, to, style),
      line([from[0] - tick[0], from[1] - tick[1]], [from[0] + tick[0], from[1] + tick[1]], style),
      line([to[0] - tick[0], to[1] - tick[1]], [to[0] + tick[0], to[1] + tick[1]], style),
    ];
  };

  const sheets = dynamic(() => {
    const m = measure();
    const nodes = [];
    const half = (m.h - m.split) / 2;
    const height = m.split > 0.5 ? half : m.h;
    /** The tops of the shards of a sheet whose top is at `y`: one, or two when the heads are split. */
    const shards = (y) => (m.split > 0.5 ? [y, y + half + m.split] : [y]);
    /** The front sheet: a plate with an outline, for each shard. */
    const front = (x) => {
      for (const top of shards(m.top))
        nodes.push(
          rect(m.w, height, { fill: 'surface', stroke: null }).at(x + m.w / 2, top + height / 2),
          rect(m.w, height, { fill: COLOR.state, stroke: null, opacity: 0.2 }).at(
            x + m.w / 2,
            top + height / 2,
          ),
          rect(m.w, height, { fill: null, stroke: COLOR.state, width: 3 }).at(
            x + m.w / 2,
            top + height / 2,
          ),
        );
    };
    /** A sheet behind the front one: only the part of its outline that the sheet before it leaves free. */
    const behind = (x, layer, step, opacity) => {
      for (const top of shards(m.top)) {
        const left = x + layer * step,
          right = left + m.w,
          up = top - layer * step,
          down = up + height;
        nodes.push(
          polyline(
            [
              [left, up + step],
              [left, up],
              [right, up],
              [right, down],
              [right - step, down],
            ],
            { stroke: COLOR.state, width: 2, opacity, fill: null },
          ),
        );
      }
    };
    const depth = v.depth.value,
      off = v.off.value;
    for (const x of [m.k, m.v]) {
      // The stack of layers, from the back to the front.
      for (let layer = Math.ceil(depth); layer >= 1; layer--) {
        const here = clamp(depth - layer + 1, 0, 1);
        if (here > 0) behind(x, layer, off, 0.55 * here);
      }
      front(x);
      // The heads: one band for each, with a line between two bands.
      const bands = v.bands.value;
      for (let band = 1; band < bands; band++) {
        const below = band >= bands / 2 ? m.split : 0;
        if (m.split > 0.5 && Math.abs(band - bands / 2) < 0.01) continue;
        const y = m.top + band * v.band.value + below;
        const end = behindTab(m, x, [tabAt(m, x)[0], y])
          ? tabAt(m, x)[0] - TAB.width / 2 - 6
          : x + m.w;
        nodes.push(line([x, y], [end, y], { stroke: COLOR.state, width: 2, opacity: 0.45 }));
      }
      // The blocks of tokens: a cut after each 16 tokens.
      if (v.blocks.value > 0)
        for (let cut = 1; cut < 8; cut++) {
          const at = x + (cut / 8) * m.w;
          for (const top of m.split > 0.5 ? [m.top, m.top + half + m.split] : [m.top]) {
            const bottom = top + (m.split > 0.5 ? half : m.h);
            const end = behindTab(m, x, [at, bottom - 20])
              ? tabAt(m, x)[1] - TAB.height / 2 - 6
              : bottom;
            nodes.push(
              line([at, top], [at, end], {
                stroke: 'ink',
                width: 2,
                opacity: 0.5 * v.blocks.value,
              }),
            );
          }
        }
      // The padding to a whole block, at the end of the tokens.
      if (v.pad.value > 0)
        nodes.push(
          rect(m.w / 16, m.h, {
            fill: null,
            stroke: COLOR.state,
            width: 2,
            dash: RESERVED_DASH,
            opacity: v.pad.value,
          }).at(x + m.w + m.w / 32 + 4, m.top + m.h / 2),
        );
      // The metadata: a bar under the sheet.
      if (v.meta.value > 0)
        nodes.push(
          rect(m.w * 0.3, 14, {
            fill: COLOR.control,
            stroke: null,
            radius: 4,
            opacity: v.meta.value,
          }).at(x + m.w * 0.15, m.bottom + 16),
        );
    }
    // The mark of each side.
    const outer = m.top - m.rise - 30;
    nodes.push(
      ...mark([m.k, outer], [m.v + m.w + m.rise, outer], SIDE.tensors),
      ...mark(
        [m.v + m.w + 22, m.top + 6],
        [m.v + m.w + m.rise + 22, m.top - m.rise + 6],
        SIDE.layers,
      ),
      ...mark([m.k, m.bottom + 44], [m.k + m.w, m.bottom + 44], SIDE.tokens),
      ...mark([m.k - 24, m.top], [m.k - 24, m.bottom], SIDE.heads),
      ...mark([m.k - 50, m.top], [m.k - 50, m.top + v.band.value], SIDE.width),
    );
    // One element, as its two bytes, in the first corner of K.
    const lit = Math.round(v.lit.value) === SIDE.bytes;
    for (const byte of [0, 1])
      nodes.push(
        rect(13, 22, { fill: lit ? COLOR.mark : 'dim', stroke: null, radius: 2 }).at(
          m.k + 16 + byte * 15,
          m.top + 20,
        ),
      );
    // The buffer that must hold all of it.
    if (v.buffer.value > 0) {
      const box = {
        left: m.k - 70,
        right: m.v + m.w + m.rise + 60,
        top: outer - 20,
        bottom: m.bottom + 66,
      };
      nodes.push(
        rect(box.right - box.left, box.bottom - box.top, {
          fill: null,
          stroke: COLOR.mark,
          width: 3,
          radius: 16,
          dash: [16, 12],
          opacity: v.buffer.value,
        }).at((box.left + box.right) / 2, (box.top + box.bottom) / 2),
      );
    }
    return nodes;
  });

  // The names of the two tensors: a tab on the top edge of each front sheet.
  const tabs = dynamic(() => {
    const m = measure();
    return ['K', 'V'].flatMap((name, index) => {
      const [x, y] = tabAt(m, index ? m.v : m.k);
      return [
        rect(TAB.width, TAB.height, {
          fill: 'surface',
          stroke: COLOR.state,
          width: 2,
          radius: 8,
        }).at(x, y),
        text(name, { size: 40, color: COLOR.state }).at(x, y),
      ];
    });
  });

  return { ...v, sheets, tabs, measure };
}

/**
 * The size formula as a row: one column for each factor, with its number over its name. Lay out
 * `block`, and add `names` and `numbers`. A number follows `factor.read()`, and it is yellow when
 * `lit()` gives its index. `shown()` gives how many columns have their number, from the left.
 */
export function factorRow(factors, { lit, shown = () => factors.length, size = 52 }) {
  const beds = factors.map((factor) =>
    rect(Math.max(110, textWidth(factor.widest ?? String(factor.read()), size) + 24), size * 1.2, {
      fill: null,
      stroke: null,
    }),
  );
  const names = factors.map((factor) => note(factor.name));
  const times = factors.slice(1).map(() => label('×', { color: 'dim' }));
  const cells = factors.flatMap((_, index) =>
    index ? [times[index - 1], beds[index]] : [beds[index]],
  );
  const under = factors.flatMap((_, index) => (index ? [null, names[index]] : [names[index]]));
  const block = grid([...cells, ...under], {
    columns: cells.length,
    gap: ['normal', 'tight'],
    align: 'center',
  });
  const numbers = dynamic(() =>
    factors.flatMap((factor, index) => {
      const here = clamp(shown() - index, 0, 1);
      if (here <= 0) return [];
      const box = boxOf(beds[index]);
      const value = factor.read();
      return [
        text(commas(Math.round(value)), {
          font: 'mono',
          size,
          color: Math.round(lit()) === index ? COLOR.mark : 'ink',
        })
          .at(box.cx, box.cy)
          .opacity(here),
      ];
    }),
  );
  return { block, beds, names, times, numbers };
}

/**
 * Bars on one axis that follow values: the spans of a request on a clock, or two rates on one
 * scale. A row is `{ name, color, start(), end(), shown(), readout() }`. `start` and `end` are in
 * the units of the axis, `shown` is 0 to 1, and `readout` is the text at the end of the bar.
 * Add `axis`, `names` and `marks`. `x(value)` and `y(row)` give a place on the chart. With a
 * `readoutWidth`, the readouts are a column between the names and the bars, so that they stay
 * where they are while the bars move.
 */
export function spans(
  region,
  rows,
  { domain, ticks, format = String, nameWidth = 300, barHeight = 44, size = 34, readoutWidth = 0 },
) {
  const plot = {
    left: region.left + nameWidth,
    right: region.right - 190,
    top: region.top,
    bottom: region.bottom - 64,
  };
  const x = (value) =>
    plot.left + ((value - domain[0]) / (domain[1] - domain[0])) * (plot.right - plot.left);
  const pitch = (plot.bottom - plot.top) / rows.length;
  const y = (index) => plot.top + pitch * (index + 0.5);
  const axis = group(
    line([plot.left, plot.bottom], [plot.right, plot.bottom], { stroke: 'dim', width: 2 }),
    ...ticks.flatMap((tick) => [
      line([x(tick), plot.bottom], [x(tick), plot.bottom + 10], { stroke: 'dim', width: 2 }),
      text(format(tick), { font: 'mono', size: 30, color: 'dim' }).at(x(tick), plot.bottom + 38),
    ]),
  );
  const names = rows.map((entry, index) =>
    text(entry.name, { size, color: entry.nameColor ?? 'ink', anchor: 'right' }).at(
      plot.left - 24 - readoutWidth,
      y(index),
    ),
  );
  const marks = dynamic(() =>
    rows.flatMap((entry, index) => {
      const shown = entry.shown ? entry.shown() : 1;
      if (shown <= 0) return [];
      const from = x(entry.start()),
        to = x(entry.end());
      const nodes = [];
      if (to - from > 1)
        nodes.push(
          rect(to - from, barHeight, {
            fill: entry.color,
            stroke: null,
            radius: 6,
            opacity: 0.9 * shown,
          }).at((from + to) / 2, y(index)),
        );
      const words = entry.readout ? entry.readout() : null;
      if (words)
        nodes.push(
          text(words, {
            font: 'mono',
            size,
            color: entry.color,
            anchor: readoutWidth ? 'right' : 'left',
          })
            .at(readoutWidth ? plot.left - 24 : to + 16, y(index))
            .opacity(shown),
        );
      return nodes;
    }),
  );
  return { axis, names, marks, x, y, plot, pitch };
}
