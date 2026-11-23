// What the scenes of `sparse-autoencoders` share: the plane of activation space, the code strip,
// and the job of each color.
//
// The plane is the example that stays. An activation is a dot. A feature writes an arrow, and
// arrows add tip to tail. A readout is a shadow: the foot of the perpendicular from the dot on a
// line through the origin. Every mark follows live values, so a scene changes one number and the
// picture answers.
import { arrow, axes, circle, dot, dynamic, line, place, rect, text } from 'vizmatic/stage';
import { code, dictionary, target } from '../../films/sparse-autoencoders/fixtures.mjs';
import { area } from '../kit-narrated.mjs';

export { code, dictionary, target };

/** One color has one job through the lesson. See PLAN.md. */
export const COLOR = {
  activation: 'ink',
  first: 'blue',
  second: 'pink',
  other: 'cyan',
  residual: 'green',
  mark: 'yellow',
  wrong: 'red',
  quiet: 'dim',
};
/** The color of each slot of the code: the two features of the example, then the other columns. */
export const SLOT_COLOR = [COLOR.first, COLOR.second, COLOR.other, COLOR.other, COLOR.other];
/** The slots of the first example: its two features, and three columns that it does not use. */
export const EXAMPLE_SLOTS = [COLOR.first, COLOR.second, COLOR.quiet, COLOR.quiet, COLOR.quiet];

/** The frame of the lesson: the plane at the left, and the code strip and what a scene adds at the right. */
export const [BOARD, SIDE] = area.columns([8, 5], 'wide');

/** The part of activation space that the plane shows. Every activation of the lesson is inside it. */
const RANGE = { x: [-1.3, 2.9], y: [-1.5, 1.9] };
/** The size of a number on the plane and on the strip. */
export const NUMBER_SIZE = 34;

const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const scale = (v, k) => [v[0] * k, v[1] * k];
const dotOf2 = (a, b) => a[0] * b[0] + a[1] * b[1];
export const vec = { add, scale, dot: dotOf2, length: (v) => Math.hypot(v[0], v[1]) };

/** A value or a function that gives one, as a function. */
const live = (value) => (typeof value === 'function' ? value : () => value);

/**
 * Build the plane. It returns the axes, `P` from a point of the plane to a point of the stage, and
 * the makers of marks that follow live values. A point is `[x, y]` or a function that returns one.
 */
export function board({ x = RANGE.x, y = RANGE.y, xStep = 1, yStep = 1 } = {}) {
  const spanX = x[1] - x[0],
    spanY = y[1] - y[0];
  /** The pixels of one unit: the same on both axes, so an angle on the plane is a true angle. */
  const unit = Math.min(BOARD.width / spanX, BOARD.height / spanY);
  const plane = place(
    axes({
      x,
      y,
      width: unit * spanX,
      height: unit * spanY,
      xStep,
      yStep,
      grid: true,
      labelSize: 30,
      tips: false,
    }),
    BOARD,
    'left',
  );
  const P = (v) => plane.world(v[0], v[1]);

  /** An arrow between two live points. It is not drawn while it is shorter than a few pixels. */
  const arrowOf = (from, to, color, style = {}) => {
    const a = live(from),
      b = live(to),
      c = live(color);
    return dynamic(() => {
      const p = P(a()),
        q = P(b());
      const length = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (length < 4) return null;
      const width = style.width ?? 8;
      return arrow(p, q, {
        stroke: c(),
        width,
        tip: Math.min(width * 3.4, length * 0.6),
        ...style,
      });
    });
  };
  /** A filled dot at a live point. */
  const dotOf = (at, color, radius = 13) => {
    const a = live(at),
      c = live(color);
    return dynamic(() => dot(radius, c()).at(...P(a())));
  };
  /** A ring at a live point: a point that the autoencoder made. */
  const ringOf = (at, color, radius = 20) => {
    const a = live(at),
      c = live(color);
    return dynamic(() => circle(radius, { stroke: c(), width: 5, fill: null }).at(...P(a())));
  };
  /** A straight segment between two live points. `lift` moves it by pixels, for a lane under an axis. */
  const segmentOf = (from, to, color, style = {}) => {
    const a = live(from),
      b = live(to),
      c = live(color);
    const { lift = [0, 0], ...rest } = style;
    return dynamic(() => {
      const p = add(P(a()), lift),
        q = add(P(b()), lift);
      if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 2) return null;
      return line(p, q, { stroke: c(), width: 6, ...rest });
    });
  };
  /** The foot of the perpendicular from a point on the line through the origin along a direction. */
  const foot = (point, direction) => {
    const n = vec.length(direction);
    const u = scale(direction, 1 / n);
    return scale(u, dotOf2(point, u));
  };
  /** The shadow of a live point on a ruler: a dashed drop line and a mark at its foot. */
  const shadowOf = (at, direction, color, radius = 9) => {
    const a = live(at),
      d = live(direction),
      c = live(color);
    return dynamic(() => {
      const point = a(),
        f = foot(point, d());
      const p = P(point),
        q = P(f);
      const mark = dot(radius, c()).at(...q);
      if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 3) return [mark];
      return [line(p, q, { stroke: c(), width: 3, dash: [10, 9] }), mark];
    });
  };
  /** A ruler: the line through the origin along a direction, between two distances. */
  const rulerOf = (direction, color, from, to, style = {}) => {
    const u = scale(direction, 1 / vec.length(direction));
    return line(P(scale(u, from)), P(scale(u, to)), { stroke: color, width: 3, ...style });
  };
  /** A text at a live point, moved by pixels so that it stands beside its mark. */
  const tagOf = (at, words, color, lift = [0, 0], options = {}) => {
    const a = live(at),
      w = live(words),
      c = live(color);
    return dynamic(() =>
      text(w(), { size: NUMBER_SIZE, font: 'mono', color: c(), ...options }).at(
        ...add(P(a()), lift),
      ),
    );
  };

  return { plane, P, unit, foot, arrowOf, dotOf, ringOf, segmentOf, shadowOf, rulerOf, tagOf };
}

/**
 * The code strip: one bar for each column of the dictionary, in a region. `z` holds the live
 * values. Under each bar, a small arrow points as its column does, so a bar and an arrow of the
 * plane are one feature. `max` is the value that fills the height of the strip. `read(i)` gives
 * the value of a slot that follows another value of the scene. `numbersOnTop` puts the numbers in
 * one line over the bars, for a scene that draws a threshold across the bars.
 * `readKeep(i)` computes support from the live candidates and the current rule.
 */
export function strip(
  s,
  region,
  {
    max = 2,
    colors = SLOT_COLOR,
    start = [0, 0, 0, 0, 0],
    read,
    digits = 1,
    numbersOnTop = false,
    readKeep,
  } = {},
) {
  const z = dictionary.map((_, i) => s.value(start[i]));
  /** The share of each bar that the rule of a scene keeps: 1 is kept, and 0 is cut. A cut bar leaves its outline. */
  const keep = dictionary.map(() => s.value(1));
  /** The value of a slot: what `read` gives for it, or its own live value. */
  const valueOf = (i) => read?.(i) ?? z[i].value;
  const keptOf = (i) => readKeep?.(i) ?? keep[i].value;
  const threshold = s.value(0);
  /** The room under the bars for the direction glyphs, and over them for a number. */
  const GLYPH = 64,
    HEAD = 48;
  const slot = region.width / dictionary.length;
  const barWidth = slot * 0.56;
  const base = region.bottom - GLYPH;
  const perUnit = (base - region.top - HEAD) / max;
  const x = (i) => region.left + slot * (i + 0.5);
  const color = (i) => (typeof colors === 'function' ? colors(i) : colors[i]);

  const rail = line([region.left, base], [region.right, base], { stroke: 'dim', width: 3 });
  /** The glyph of a slot: its column as a small arrow. */
  const glyphs = dictionary.map((d, i) => {
    const reach = 22;
    const cx = x(i),
      cy = base + GLYPH / 2 + 4;
    return arrow([cx - d[0] * reach, cy + d[1] * reach], [cx + d[0] * reach, cy - d[1] * reach], {
      stroke: color(i),
      width: 5,
      tip: 16,
    });
  });
  const bars = dynamic(() =>
    z.flatMap((_, i) => {
      const height = Math.max(0, valueOf(i)) * perUnit;
      if (height < 1) return [];
      const at = [x(i), base - height / 2];
      const outline = rect(barWidth, height, {
        fill: null,
        stroke: 'faint',
        width: 3,
        radius: 6,
      }).at(...at);
      if (keptOf(i) < 0.01) return [outline];
      const fill = rect(barWidth, height, {
        fill: color(i),
        stroke: null,
        radius: 6,
        opacity: 0.9 * keptOf(i),
      }).at(...at);
      return keptOf(i) > 0.99 ? [fill] : [outline, fill];
    }),
  );
  /** The value over each bar that is not zero. */
  const numbers = dynamic(() =>
    z.flatMap((_, i) => {
      const value = valueOf(i);
      if (Number(value.toFixed(digits)) === 0) return [];
      return [
        text(value.toFixed(digits), {
          size: NUMBER_SIZE,
          font: 'mono',
          color: keptOf(i) > 0.5 ? color(i) : 'faint',
        }).at(x(i), numbersOnTop ? region.top + NUMBER_SIZE / 2 : base - value * perUnit - 26),
      ];
    }),
  );
  /** A threshold across the strip, at the height of the live value `threshold`. */
  const cut = dynamic(() => {
    const y = base - threshold.value * perUnit;
    return line([region.left, y], [region.right, y], {
      stroke: COLOR.mark,
      width: 4,
      dash: [14, 10],
    });
  });
  return {
    z,
    keep,
    threshold,
    rail,
    glyphs,
    bars,
    numbers,
    cut,
    x,
    base,
    perUnit,
    barWidth,
    slot,
    region,
    valueOf,
  };
}

/**
 * A slider: a knob on a rail that follows a live value between two ends. It is in a region, at
 * its middle height. A scene adds `rail` and `knob`, and a readout of its own beside them.
 */
export function slider(region, value, { min = 0, max = 1, color = COLOR.mark } = {}) {
  const at = (v) => region.left + ((v - min) / (max - min)) * region.width;
  const rail = line([region.left, region.cy], [region.right, region.cy], {
    stroke: 'dim',
    width: 6,
  });
  const knob = dynamic(() => dot(17, color).at(at(value.value), region.cy));
  return { rail, knob, at };
}

/** The width of the activation, D, and the count of latent slots, M. */
export const WIDTH = target.length;
export const SLOTS = dictionary.length;

/** The point that a code rebuilds: the sum of its coefficients times the columns. */
export const decode = (z) =>
  z.reduce((sum, value, i) => add(sum, scale(dictionary[i], value)), [0, 0]);

/**
 * The two terms of the objective for a code, with the averages that the voice states: the squared
 * error of the activation divided by D, and the L1 size of the code divided by M, times lambda.
 */
export function objectiveTerms(z, lambda) {
  const rebuilt = decode(z);
  const error = ((target[0] - rebuilt[0]) ** 2 + (target[1] - rebuilt[1]) ** 2) / WIDTH;
  const penalty = z.map((value) => (lambda * Math.abs(value)) / SLOTS);
  return { error, penalty, total: error + penalty.reduce((sum, value) => sum + value, 0) };
}

/**
 * The first example as a rebuild: the dot of the activation, the two arrows of a live code, the
 * rebuilt point as a ring, and the error as a green segment from the ring to the dot. `read`
 * gives the two coefficients.
 */
export function rebuild(b, read) {
  const first = () => scale(dictionary[0], read()[0]);
  const tip = () => add(first(), scale(dictionary[1], read()[1]));
  return {
    first,
    tip,
    blue: b.arrowOf([0, 0], first, COLOR.first),
    pink: b.arrowOf(first, tip, COLOR.second),
    point: b.dotOf(target, COLOR.activation),
    rebuilt: b.ringOf(tip, COLOR.activation, 24),
    error: b.segmentOf(tip, target, COLOR.residual, { width: 7 }),
  };
}

/**
 * Bars of live readouts in a region, one under the other, to one scale: a name, a bar and its
 * value. `items` are `{ name, color, read }`, and `max` is the value that fills the width.
 */
export function readoutBars(region, items, max) {
  const rows = region.rows(items.length, 'tight');
  /** The room at the right of the longest bar for its value. */
  const perUnit = (region.width - 110) / max;
  const names = items.map((item, i) =>
    text(item.name, { size: 34, color: item.color, anchor: 'left' }).at(
      region.left,
      rows[i].top + 20,
    ),
  );
  const bars = dynamic(() =>
    items.flatMap((item, i) => {
      const value = item.read();
      const width = Math.max(0, value) * perUnit;
      const y = rows[i].top + 78;
      const number = text(value.toFixed(2), {
        size: NUMBER_SIZE,
        font: 'mono',
        color: item.color,
        anchor: 'left',
      }).at(region.left + width + 16, y);
      if (width < 1) return [number];
      return [
        rect(width, 40, { fill: item.color, stroke: null, radius: 5, opacity: 0.9 }).at(
          region.left + width / 2,
          y,
        ),
        number,
      ];
    }),
  );
  return { names, bars };
}

/**
 * The ruler of losses, which `coverage` and `training-evidence` share. Three losses stand on one
 * line: the clean model, the model with the rebuilt activation, and the ablation baseline. The
 * damage of the rebuild is the red part, and it keeps its length. The share that counts as
 * recovered is the green part of the way from the baseline back to the clean loss. `baseline` is
 * the live value of the ablation loss.
 */
export function lossRuler(s, region, { clean, rebuilt, ablated, max }) {
  const baseline = s.value(ablated);
  /** How many of the three losses show their number: the scene that says them one by one starts at 0. */
  const numbered = s.value(3);
  const perUnit = region.width / max;
  const x = (loss) => region.left + loss * perUnit;
  const y = region.cy;
  const recovered = () => 1 - (rebuilt - clean) / (baseline.value - clean);
  const mark = (loss, height) =>
    line([x(loss), y], [x(loss), y - height], { stroke: 'dim', width: 3 });
  const base = line([x(0), y], [x(max), y], { stroke: 'dim', width: 3 });
  const cleanMark = [
    mark(clean, 30),
    dynamic(() =>
      text(numbered.value > 0.5 ? `clean ${clean}` : 'clean', { size: 30, anchor: 'right' }).at(
        x(clean) + 8,
        y - 58,
      ),
    ),
  ];
  const rebuiltMark = [
    mark(rebuilt, 82),
    dynamic(() =>
      text(numbered.value > 1.5 ? `rebuilt ${rebuilt}` : 'rebuilt', {
        size: 30,
        anchor: 'left',
        color: COLOR.wrong,
      }).at(x(rebuilt) - 8, y - 110),
    ),
    line([x(clean), y], [x(rebuilt), y], { stroke: COLOR.wrong, width: 18 }),
  ];
  const whole = (value) => Math.abs(value - Math.round(value)) < 0.05;
  const baselineMark = dynamic(() => [
    line([x(rebuilt), y], [x(Math.max(rebuilt, baseline.value)), y], {
      stroke: COLOR.residual,
      width: 18,
    }),
    line([x(baseline.value), y + 16], [x(baseline.value), y - 30], {
      stroke: COLOR.mark,
      width: 5,
    }),
    text(
      numbered.value > 2.5
        ? `ablated ${baseline.value.toFixed(whole(baseline.value) ? 0 : 1)}`
        : 'ablated',
      { size: 30, color: COLOR.mark },
    ).at(
      // The name stays clear of the names of the two other losses when the baseline comes near them.
      Math.max(x(baseline.value), x(rebuilt) + 150),
      y - 60,
    ),
  ]);
  // The scale of the line: a tick for each five units of loss.
  const ticks = [0, 5, 10]
    .filter((loss) => loss <= max)
    .flatMap((loss) => [
      line([x(loss), y], [x(loss), y + 14], { stroke: 'dim', width: 3 }),
      text(String(loss), { size: 28, font: 'mono', color: 'dim' }).at(x(loss), y + 44),
    ]);
  const axis = [base, ...ticks, ...cleanMark, ...rebuiltMark];
  const parts = baselineMark;
  /** The share as words: a percentage, or the word for a baseline that is at the clean loss. */
  const shareWords = () =>
    Math.abs(baseline.value - clean) < 0.03 ? 'undefined' : `${Math.round(recovered() * 100)}%`;
  const share = dynamic(() =>
    text(`loss recovered: ${shareWords()}`, {
      size: 44,
      color: recovered() >= 0 && recovered() <= 1 ? COLOR.residual : COLOR.wrong,
    }).at(region.cx, y + 150),
  );
  const damage = text(`damage ${(rebuilt - clean).toFixed(1)}`, {
    size: 30,
    color: COLOR.wrong,
    anchor: 'left',
  }).at(x(clean) - 20, y + 84);
  return {
    baseline,
    numbered,
    recovered,
    base,
    cleanMark,
    rebuiltMark,
    baselineMark,
    axis,
    parts,
    share,
    damage,
    x,
    y,
  };
}
