// What the scenes of `estimation` share: the frame, the job of each color, the rate axis with the
// 20% staffing line, the marks of a tray of labels, and the queue of the week.
//
// The example that stays: a sample of 100 messages has 16 that need a specialist. The tray at the
// left holds one dot for each label. The axis at the right is the share that needs a specialist.
// A scene changes the tray, and the axis answers.
import { circle, dot, dynamic, line, rect, seededRandom, text } from 'vizmatic/stage';
import { positiveIndex, weeklyQueue, weeklySample } from '../../films/estimation/fixtures.mjs';
import { area } from '../kit-narrated.mjs';

/** One color has one job through the lesson. */
export const COLOR = {
  /** A message that needs a specialist, and the true share of a queue. */
  specialist: 'pink',
  /** The sample of 100 labels: a sampled message, its estimate, its cloud, its Wald bar. */
  sample: 'blue',
  /** The larger sample of 400 labels. */
  larger: 'cyan',
  /** Rates that the data accept: a Wilson interval, an interval that covers, a choice that passes. */
  accepted: 'green',
  /** A failure: a collapsed interval, an interval that misses, a biased estimate. */
  failure: 'red',
  /** What the voice points at now. */
  mark: 'yellow',
};

/** The staffing line: above this share of specialist cases, the team books an extra shift. */
export const THRESHOLD = 0.2;
/** The right end of the axis at rest. The 20% line is then at its middle. */
const TOP_RATE = 0.4;

/** The frame of the lesson: the tray at the left, and the plot with the rate axis at the right. */
export const [TRAY, PLOT] = area.columns([2, 5], 'wide');
/** The tray column: a title, the grid of labels, and the count under it. */
export const [TRAY_HEAD, TRAY_GRID, READOUT] = TRAY.rows([1, 6, 4], 'none');
/** The plot: a line of names, the field over the axis, and the numbers of the axis. */
export const [HEAD, FIELD, RULE] = PLOT.inset('normal', 'none').rows([1, 8, 2], 'none');
/** The field in two bands: the room for a second picture, and the rows of dots and bars on the axis. */
export const [PANELS, ROWS] = FIELD.rows([5, 2], 'none');
/** The two panels over the axis: left and right of the 20% line. */
export const [LEFT_PANEL, RIGHT_PANEL] = PANELS.columns(2, 'wide');
/** The room for a name on each side of the name of the staffing line, which is 200 wide with its margin. */
export const [HEAD_LEFT, HEAD_RIGHT] = HEAD.columns(2, 200);

/** The size of the numbers of the axis. */
const TICK_SIZE = 30;
/** The radius of an estimate on the axis. */
export const POINT = 15;

/** The first 100 messages of the weekly sample: the tray of the lesson. 16 of them need a specialist. */
export const SAMPLE = weeklySample.slice(0, 100);
/** A distinct constructed held-out tray keeps its identity through both calibration scenes. */
const heldRandom = seededRandom(203);
const heldOrder = Array.from({ length: SAMPLE.length }, (_, index) => index);
for (let index = heldOrder.length - 1; index > 0; index--) {
  const other = Math.floor(heldRandom() * (index + 1));
  [heldOrder[index], heldOrder[other]] = [heldOrder[other], heldOrder[index]];
}
const heldPositive = new Set(
  heldOrder.slice(0, SAMPLE.filter((message) => message.specialist).length),
);
export const HELD_OUT = heldOrder.map((_, index) => ({
  id: 'H' + String(index + 1).padStart(3, '0'),
  specialist: heldPositive.has(index),
}));
/** The index of the one message that the film follows by its ID. It needs a specialist. */
export const TAGGED = positiveIndex;

/** A share as a whole percentage: 0.16 gives "16%". */
export const percent = (rate, digits = 0) => `${(rate * 100).toFixed(digits)}%`;

/**
 * The rate axis: the share that needs a specialist, with the 20% staffing line. `min` and `max` are
 * the two ends, so a scene can zoom. Every part follows them.
 */
export function rateAxis(s) {
  const min = s.value(0),
    max = s.value(TOP_RATE);
  const staffing = s.value(1);
  const y = FIELD.bottom;
  const span = () => max.value - min.value;
  /** The x of a rate now. */
  const x = (rate) => FIELD.left + ((rate - min.value) / span()) * FIELD.width;
  /** The x of a rate, held inside the two ends of the axis. */
  const held = (rate) => Math.min(FIELD.right, Math.max(FIELD.left, x(rate)));
  const inside = (rate) => rate >= min.value - 1e-6 && rate <= max.value + 1e-6;
  /** The y of a row of dots and bars over the axis. Row 0 is the nearest one. */
  const rowY = (row) => y - 50 - row * 62;

  // Keep each tick's glyphs stable when the ruler passes between scenes.
  const tickLabels = Array.from({ length: 101 }, (_, points) =>
    text(`${points}%`, {
      font: 'mono',
      size: TICK_SIZE,
      color: points === THRESHOLD * 100 ? 'ink' : 'dim',
    }),
  );
  const rule = dynamic(() => {
    // The points between two ticks: 10 at rest, and fewer when the axis shows a few points only.
    const step = span() > 0.25 ? 10 : span() > 0.09 ? 5 : 1;
    const nodes = [line([FIELD.left, y], [FIELD.right, y], { stroke: 'dim', width: 3 })];
    const first = Math.ceil((min.value * 100 - 1e-6) / step) * step;
    for (let points = first; points <= max.value * 100 + 1e-6; points += step) {
      const at = x(points / 100);
      nodes.push(line([at, y], [at, y + 14], { stroke: 'dim', width: 3 }));
      nodes.push(tickLabels[points].at(at, y + 48));
    }
    return nodes;
  });
  const title = text('share that needs a specialist', { size: 29, color: 'dim' }).at(
    FIELD.cx,
    RULE.bottom - 30,
  );
  const threshold = dynamic(() => {
    if (!inside(THRESHOLD)) return [];
    const at = x(THRESHOLD);
    return [
      line([at, HEAD.bottom], [at, y], {
        stroke: 'ink',
        width: 3,
        dash: [12, 10],
        opacity: 0.3 + 0.45 * staffing.value,
      }),
      ...(staffing.value > 0.02
        ? [
            text('staffing line', { size: 29, color: 'ink', opacity: staffing.value }).at(
              at,
              HEAD.cy,
            ),
          ]
        : []),
    ];
  });

  /**
   * An interval on a row over the axis. `read` gives `{ low, high }` now, or null for no bar. The
   * bar stays inside the axis, and an end that is outside has no cap.
   */
  const bar = (read, { row = 0, color = COLOR.accepted, weight = 10, opacity = 1 } = {}) =>
    dynamic(() => {
      const range = read();
      if (!range || range.high < min.value || range.low > max.value) return [];
      const at = typeof row === 'function' ? row() : rowY(row);
      const cap = (rate) =>
        inside(rate) &&
        line([x(rate), at - 16], [x(rate), at + 16], { stroke: color, width: 4, opacity });
      return [
        line([held(range.low), at], [held(range.high), at], {
          stroke: color,
          width: weight,
          opacity,
        }),
        cap(range.low),
        cap(range.high),
      ].filter(Boolean);
    });
  /**
   * An estimate on a row over the axis. `read` gives the rate now, or null for no dot. With `stem`,
   * a thin line goes down to the axis, so the place of a dot with no bar is plain.
   */
  const point = (read, { row = 0, color = COLOR.sample, radius = POINT, stem = false } = {}) =>
    dynamic(() => {
      const rate = read();
      if (rate === null || !inside(rate)) return [];
      const at = typeof row === 'function' ? row() : rowY(row);
      const marks = [dot(radius, color).at(x(rate), at)];
      if (stem)
        marks.unshift(line([x(rate), at], [x(rate), y], { stroke: color, width: 3, opacity: 0.5 }));
      return marks;
    });
  /** A line over the whole field at one rate: the true share of a queue, a forecast. */
  const upright = (read, { color = COLOR.specialist, weight = 4, top = FIELD.top } = {}) =>
    dynamic(() => {
      const rate = read();
      if (rate === null || !inside(rate)) return [];
      return line([x(rate), top], [x(rate), y], { stroke: color, width: weight });
    });

  return {
    min,
    max,
    staffing,
    x,
    y,
    rowY,
    inside,
    rule,
    title,
    threshold,
    bar,
    point,
    upright,
    /** Support-queue scenes share these parts. The signup counterexample hands over only the ruler. */
    standing: [rule, title, threshold],
  };
}

/** The room of the tray grid: a square as wide as the tray column, less a margin. */
const GRID = TRAY_GRID.inset(10, 'none');

/**
 * The middles of `count` marks in a grid of `columns` columns that fills the width of the tray, row
 * by row from its top. Another region gives the places of another grid.
 */
export function slots(count, columns, region = GRID) {
  const pitch = region.width / columns;
  return Array.from({ length: count }, (_, index) => [
    region.left + pitch * ((index % columns) + 0.5),
    region.top + pitch * (Math.floor(index / columns) + 0.5),
  ]);
}

/** The radius of a mark in a grid of `columns` columns. */
export const radiusOf = (columns, region = GRID) => (region.width / columns) * 0.36;

/**
 * One label of a tray. `specialist` and `regular` are reviewed labels. `selected` is a message that
 * is in the sample and has no label yet. `unknown` is a label that did not resolve, and `slot` is an
 * empty place.
 */
export function mark(kind, radius, opacity = 1) {
  if (kind === 'specialist') return dot(radius, COLOR.specialist, { opacity });
  if (kind === 'regular') return dot(radius, COLOR.sample, { opacity });
  const width = Math.max(2, radius * 0.22);
  const stroke = kind === 'selected' ? COLOR.sample : kind === 'unknown' ? 'dim' : 'faint';
  return circle(radius - width / 2, { stroke, width, fill: null, opacity });
}

/** The mark of a reviewed message. */
export const labelOf = (row) => (row.specialist ? 'specialist' : 'regular');

/**
 * The queue of one week, as a field of cells in the left panel. It starts covered. `uncovered` goes
 * from 0 to 1 and shows the outcome of each cell, row by row. `sorted` goes from 0 to 1 and moves
 * the specialist cells to the top. The share of specialist cells is the share of the model.
 */
export function weekQueue(s, { region = LEFT_PANEL, lit = () => false } = {}) {
  const columns = 25,
    rows = 20,
    count = columns * rows;
  const pitch = Math.min(region.width / columns, region.height / rows);
  const left = region.cx - (pitch * columns) / 2,
    top = region.cy - (pitch * rows) / 2;
  const place = (slot) => [
    left + pitch * ((slot % columns) + 0.5),
    top + pitch * (Math.floor(slot / columns) + 0.5),
  ];
  // The specialist cells: the share of the week, at mixed places.
  const random = seededRandom(18);
  const order = Array.from({ length: count }, (_, index) => index);
  for (let index = count - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [order[index], order[other]] = [order[other], order[index]];
  }
  const specialists = Math.round((count * weeklyQueue.specialist) / weeklyQueue.size);
  const specialist = new Set(order.slice(0, specialists));
  // The place of each cell when the week is sorted: the specialist cells first.
  const sortedSlot = new Array(count);
  let nextSpecialist = 0,
    nextRegular = specialists;
  for (let cell = 0; cell < count; cell++)
    sortedSlot[cell] = specialist.has(cell) ? nextSpecialist++ : nextRegular++;

  const uncovered = s.value(0),
    sorted = s.value(0);
  const side = pitch - 5;
  const cells = dynamic(() => {
    const open = uncovered.value * count,
      move = sorted.value;
    return Array.from({ length: count }, (_, cell) => {
      const from = place(cell),
        to = place(sortedSlot[cell]);
      const known = cell < open;
      const fill = known ? (specialist.has(cell) ? COLOR.specialist : COLOR.sample) : 'dim';
      return rect(side, side, {
        fill,
        stroke: !known && lit(cell) ? COLOR.sample : null,
        width: 3,
        radius: 3,
        opacity: known ? (specialist.has(cell) ? 0.95 : 0.4) : lit(cell) ? 0.9 : 0.34,
      }).at(from[0] + (to[0] - from[0]) * move, from[1] + (to[1] - from[1]) * move);
    });
  });
  /** The room of the first `share` of the sorted cells, in whole rows: the capacity of the team. */
  const block = (share) => {
    const height = (Math.round(share * count) / columns) * pitch;
    return { left, top, right: left + pitch * columns, bottom: top + height };
  };
  return {
    cells,
    uncovered,
    sorted,
    place,
    block,
    left,
    top,
    right: left + pitch * columns,
    bottom: top + pitch * rows,
    /** The cell of a message, by its ID: the queue is in the order of the IDs. */
    cellOf: (id) => Math.floor((Number(id.slice(1)) / weeklyQueue.size) * count),
  };
}
