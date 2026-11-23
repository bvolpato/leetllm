// What the scenes of `softmax` share: the running example as one board, and the job of each color.
//
// The board is the example that stays. Three words stand on a ruler of scores. A bar on each word
// is its share of the probability, and the unit strip under the ruler is the whole budget. Every
// part follows the same values, so a scene moves a score and the whole picture answers.
import { stableSoftmax } from 'vizmatic';
import {
  arrow,
  axes,
  beside,
  boxOf,
  dot,
  dynamic,
  fitted,
  grid,
  group,
  line,
  place,
  rect,
  row,
  tex,
  text,
} from 'vizmatic/stage';
import { LOGITS, TARGET, UPDATED, WORDS } from '../../films/softmax/fixtures.mjs';
import { area, heading, label, note } from '../kit-narrated.mjs';

export { WORDS };

/** One color has one job through the lesson. The three candidate words: ran, slept, ate. */
export const WORD_COLOR = ['blue', 'green', 'pink'];
/** The observed word of the dog example is `slept`, so green is also the color of the target. */
export const TARGET_COLOR = 'green';
/** Yellow marks what the voice points at now. Cyan is the second thing in a comparison. */
export const MARK_COLOR = 'yellow';
export const OTHER_COLOR = 'cyan';

/** The frame of the lesson: the board at the left, and what a scene adds at the right. */
export const [BOARD, SIDE] = area.columns([3, 2], 'loose');

/** The scores that the ruler shows, from its left end to its right end. */
const RULER = { min: -0.5, max: 3.5, ticks: [0, 1, 2, 3] };
const BAR_WIDTH = 100;
const STRIP_HEIGHT = 64;
/** The size of the numbers on the board. The words have the size of a label. */
const NUMBER_SIZE = 30;

/** A number of the ruler: whole when it is whole, and with one decimal while it moves. */
const tickText = (value) =>
  Math.abs(value) >= 100 || Math.abs(value - Math.round(value)) < 0.05
    ? String(Math.round(value))
    : value.toFixed(1);

/** What a bar shows over it: nothing, its weight, or its share. */
export const READ = { none: 0, weight: 1, share: 2 };

/**
 * The state of the board at the end of each scene. The next scene starts from it, so the board
 * goes from scene to scene with no fade. `on` names the parts that are on the screen.
 */
const BASE = {
  z: LOGITS,
  temperature: 1,
  offset: 0,
  shift: 0,
  grow: [0, 0, 0],
  solid: [0, 0, 0],
  fill: [0, 0, 0],
  read: [READ.none, READ.none, READ.none],
  seen: [1, 1, 1],
  target: TARGET,
  on: [],
};
const OUTLINED = { grow: [1, 1, 1] };
const SOLID = { ...OUTLINED, solid: [1, 1, 1] };
const WEIGHED = { ...SOLID, offset: 1000, shift: 1003 };
const all = (mode) => [mode, mode, mode];
const RULED = ['words', 'observed', 'bars', 'frame', 'unit', 'rule', 'ticks'];
export const STATE = {
  start: { ...BASE, seen: [0, 0, 0] },
  intro: { ...BASE, ...OUTLINED, on: ['words', 'observed', 'bars', 'frame', 'unit'] },
  scores: { ...BASE, ...OUTLINED, on: RULED },
  exponentials: { ...BASE, ...WEIGHED, read: all(READ.weight), on: [...RULED, 'readouts'] },
};
const SHARED = {
  ...BASE,
  ...SOLID,
  fill: [1, 1, 1],
  read: all(READ.share),
  on: [...RULED, 'readouts', 'strip'],
};
STATE.mass = SHARED;
STATE.loss = SHARED;
STATE['gradient-chain'] = SHARED;
STATE.gradient = { ...SHARED, on: [...SHARED.on, 'pushes'] };
STATE.update = { ...SHARED, z: UPDATED };
STATE.temperature = STATE.update;

/**
 * Build the board in the state `from`. It returns the values that a scene moves and the parts
 * that a scene shows: `rule`, `ticks`, `words`, `bars`, `readouts`, `observed`, `frame`, `strip`.
 */
export function board(s, from = BASE) {
  const z = WORDS.map((_, i) => s.value(LOGITS[i]));
  const temperature = s.value(1),
    offset = s.value(0),
    shift = s.value(0);
  const grow = WORDS.map(() => s.value(0)),
    solid = WORDS.map(() => s.value(0)),
    fill = WORDS.map(() => s.value(0)),
    read = WORDS.map(() => s.value(0)),
    seen = WORDS.map(() => s.value(1)),
    /** How far the name of a word is under its usual line, for two words that stand close. */
    drop = WORDS.map(() => s.value(0));
  const target = from.target;
  // Names wait while colored dots cross on the ruler.
  const namesOn = s.value(1),
    tagsOn = s.value(1);

  // The measures of the board, from its region: a line of text, the bars on the ruler, the strip.
  const [top, stand, foot] = BOARD.rows([1, 6, 2], 'normal');
  const ruleY = stand.top + stand.height * 0.7;
  /** The height of a bar that has all of the probability. */
  const tallest = ruleY - stand.top - 60;
  const x = (score) => BOARD.left + ((score - RULER.min) / (RULER.max - RULER.min)) * BOARD.width;
  const scores = () => z.map((value) => value.value);
  const shares = () => stableSoftmax(scores(), temperature.value);
  /** The weight of each word: e to its score as the ruler shows it. */
  const weights = () => scores().map((score) => Math.exp(score + offset.value - shift.value));
  const barTop = (i, share) => ruleY - 14 - tallest * share * grow[i].value;

  const rule = group(
    line([BOARD.left, ruleY], [BOARD.right, ruleY], { stroke: 'dim', width: 3 }),
    ...RULER.ticks.map((tick) =>
      line([x(tick), ruleY], [x(tick), ruleY + 14], { stroke: 'dim', width: 3 }),
    ),
  );
  const ticks = dynamic(() =>
    RULER.ticks.map((tick) =>
      text(tickText(tick + offset.value - shift.value), {
        font: 'mono',
        size: NUMBER_SIZE,
        color: 'dim',
      }).at(x(tick), ruleY + 42),
    ),
  );
  const words = dynamic(() =>
    scores().flatMap((score, i) => [
      dot(12, WORD_COLOR[i]).at(x(score), ruleY).opacity(seen[i].value),
      text(WORDS[i], { size: 46, color: WORD_COLOR[i] })
        .at(x(score), ruleY + 100 + drop[i].value)
        .opacity(seen[i].value * namesOn.value),
    ]),
  );
  // A bar is an outline while the lesson has not earned its number, and solid when it has.
  const bars = dynamic(() => {
    const share = shares();
    return scores().flatMap((score, i) => {
      const height = ruleY - 14 - barTop(i, share[i]);
      if (height < 0.5) return [];
      const at = [x(score), ruleY - 14 - height / 2];
      const outline = rect(BAR_WIDTH, height, {
        stroke: WORD_COLOR[i],
        width: 3,
        fill: null,
        radius: 6,
      }).at(...at);
      const body = rect(BAR_WIDTH, height, {
        fill: WORD_COLOR[i],
        stroke: null,
        radius: 6,
        opacity: 0.86 * solid[i].value,
      }).at(...at);
      return solid[i].value < 0.01 ? [outline] : [body, outline];
    });
  });
  const readouts = dynamic(() => {
    const share = shares(),
      weight = weights();
    return scores().flatMap((score, i) => {
      const mode = Math.round(read[i].value);
      if (mode === READ.none) return [];
      const words =
        mode === READ.weight
          ? weight[i] >= 10
            ? weight[i].toFixed(1)
            : weight[i].toFixed(3)
          : share[i] > 0 && share[i] < 0.005
            ? '<1%'
            : share[i] > 0.995 && share[i] < 1
              ? '>99%'
              : `≈${Math.round(share[i] * 100)}%`;
      return [
        text(words, { font: 'mono', size: NUMBER_SIZE, color: WORD_COLOR[i] }).at(
          x(score),
          barTop(i, share[i]) - 26,
        ),
      ];
    });
  });
  /** A word over the bar of one candidate, such as `observed`. It follows the bar. */
  const tag = (i, words, color) =>
    dynamic(() =>
      text(words, { size: NUMBER_SIZE, color })
        .at(x(z[i].value), barTop(i, shares()[i]) - 68)
        .opacity(tagsOn.value),
    );
  const observed = tag(target, 'observed', TARGET_COLOR);
  /** A bracket under two words with the gap between their scores. */
  const gap = (i, j, color = MARK_COLOR) =>
    dynamic(() => {
      const [a, b] = [z[i].value, z[j].value].sort((m, n) => m - n);
      const y = ruleY + 160;
      const end = (at) => line([x(at), y - 12], [x(at), y + 12], { stroke: color, width: 4 });
      return [
        line([x(a), y], [x(b), y], { stroke: color, width: 4 }),
        end(a),
        end(b),
        text(tickText(b - a), { font: 'mono', size: NUMBER_SIZE + 4, color }).at(
          x((a + b) / 2),
          y + 34,
        ),
      ];
    });

  /** An arrow under the ruler from one score to another: the correction that descent gives a word. */
  const push = (i, from, to) => {
    // The arrow of the middle word is one line lower, so two arrows that meet do not share a line.
    const y = ruleY + 160 + (i === 1 ? 30 : 0);
    return arrow([x(from), y], [x(to), y], { stroke: WORD_COLOR[i], width: 7, tip: 22 });
  };
  const pushes = group(...WORDS.map((_, i) => push(i, LOGITS[i], UPDATED[i])));

  // The unit strip: each word fills its part of one budget, from the left, in the order of the voice.
  const strip = { left: BOARD.left + 4, width: BOARD.width - 8, y: foot.cy };
  const frame = rect(strip.width + 8, STRIP_HEIGHT + 8, {
    stroke: 'dim',
    width: 2,
    fill: null,
    radius: 8,
  }).at(BOARD.cx, strip.y);
  const unit = text('one unit of probability', {
    size: NUMBER_SIZE,
    color: 'dim',
    anchor: 'left',
  }).at(strip.left, strip.y + STRIP_HEIGHT / 2 + 40);
  const filled = dynamic(() => {
    let left = strip.left;
    return shares().flatMap((share, i) => {
      const width = strip.width * share * fill[i].value;
      const segment = rect(width, STRIP_HEIGHT, {
        fill: WORD_COLOR[i],
        stroke: null,
        opacity: 0.86,
      }).at(left + width / 2, strip.y);
      left += width;
      return width < 0.5 ? [] : [segment];
    });
  });

  // Every part is in its place. Now the board takes the state of its scene.
  z.forEach((value, i) => value.set(from.z[i]));
  temperature.set(from.temperature);
  offset.set(from.offset);
  shift.set(from.shift);
  WORDS.forEach((_, i) => {
    grow[i].set(from.grow[i]);
    solid[i].set(from.solid[i]);
    fill[i].set(from.fill[i]);
    read[i].set(from.read[i]);
    seen[i].set(from.seen[i]);
  });

  const parts = {
    rule,
    ticks,
    words,
    bars,
    readouts,
    observed,
    frame,
    unit,
    strip: filled,
    pushes,
  };
  return {
    ...parts,
    z,
    temperature,
    offset,
    shift,
    grow,
    solid,
    fill,
    read,
    seen,
    drop,
    namesOn,
    tagsOn,
    tag,
    gap,
    push,
    x,
    ruleY,
    top,
    foot,
    shares,
    weights,
    /** The parts that are on the screen in a state, for `s.add`, `c.take` and `c.keep`. */
    standing: (state) => state.on.map((name) => parts[name]),
  };
}

/** The line over the board: the prefix, and the word that the sentence continues with. */
export function sentence(prefix, word, color) {
  return place(
    row([label(prefix, { size: 56 }), label(word, { size: 56, color })], { gap: 'tight' }),
    BOARD.rows([1, 6, 2], 'normal')[0],
    'left',
  );
}

/** The recipe of the lesson: one line for each step, in the order in which the scenes earn them. */
const RECIPE = [
  ['scores', 'z^{(0)} = [3,\\ 1,\\ 0]'],
  ['weights', 'w_i = e^{z_i}'],
  ['shares', 'p_i = \\frac{w_i}{\\sum_j w_j}'],
  ['loss', 'L = -\\ln p_{\\text{target}}'],
  ['gradient', '\\frac{\\partial L}{\\partial z_i} = p_i - y_i'],
  ['update', 'z_i \\leftarrow z_i - \\eta\\,(p_i - y_i)'],
];

/**
 * The first `count` lines of the recipe, at the top of the side. Every line has its place from the
 * whole recipe, so a line stays where it is when the next scene adds one. Each line is `[name, formula]`.
 */
export function recipe(count) {
  const lines = RECIPE.map(([name, formula]) => [note(name), tex(formula, { size: 44 })]);
  place(
    grid(lines.flat(), { columns: 2, gap: ['wide', 'normal'], align: 'left' }),
    SIDE,
    'top left',
  );
  return lines.slice(0, count);
}

/**
 * Start a scene of the dog example: the board in the state of the scene before it, the line over
 * the board, and the first `lines` lines of the recipe. All of them come from that scene with no
 * fade. `finish(state, lines)` hands them to the next scene.
 */
export function dogScene(s, c, from, lines, words = 'The dog slept') {
  const b = board(s, from);
  const said = place(label(words, { size: 56, color: TARGET_COLOR }), b.top, 'left');
  const stack = recipe(RECIPE.length);
  s.add(heading(c.title));
  c.take([said, ...stack.slice(0, lines).flat(), ...b.standing(from)]);
  return {
    b,
    said,
    stack,
    /** The part of the side under the first `count` lines of the recipe, for what a scene adds. */
    under: (count) => SIDE.beside(boxOf(stack.slice(0, count).flat()), 'under'),
    finish: (to, count = lines, sentence = said) =>
      c.keep([sentence, ...stack.slice(0, count).flat(), ...b.standing(to)]),
  };
}

/**
 * The loss curve, minus the log of a probability, with a point that follows `read`. It is as wide as
 * its region. `graph` is the axes with the curve, and `point` is the mark on the curve.
 */
export function lossCurve(region, read, xLabel = 'share of the observed word') {
  const graph = place(
    fitted(region, (width) =>
      axes({
        x: [0, 1],
        y: [0, 3],
        xStep: 0.25,
        yStep: 1,
        width,
        height: region.height * 0.5,
        labelSize: 28,
      }),
    ),
    region,
  );
  const names = [
    beside(note(xLabel), graph, 'under', 'tight'),
    beside(note('loss, in nats'), graph, 'above', 'tight', 'left'),
  ];
  graph.plot((p) => -Math.log(p), { stroke: 'ink', width: 5, from: 0.05, to: 1 });
  const point = dynamic(() => {
    const p = Math.max(0.05, read());
    return [dot(15, MARK_COLOR).at(...graph.world(p, -Math.log(p)))];
  });
  return { graph: [graph, ...names], point };
}

/** A number that follows the film, as text: `∞` when it has no end. It keeps its left edge. */
export function live(read, { digits = 3, size = 40, color = 'ink', prefix = '' } = {}) {
  return dynamic(() => {
    const value = read();
    const words = Number.isFinite(value) ? Number(value.toFixed(digits)).toFixed(digits) : '∞';
    return text(prefix + words, {
      font: 'mono',
      size,
      color: Number.isFinite(value) ? color : 'red',
      anchor: 'left',
    });
  });
}

/**
 * A slider: a knob on a line that follows `read`, between `min` and `max`. `log` gives each ratio
 * the same room. `at(value)` is the place of a value on the line, for a mark or a label.
 */
export function slider(region, read, { min, max, log = false }) {
  const part = (value) =>
    log ? Math.log(value / min) / Math.log(max / min) : (value - min) / (max - min);
  const at = (value) => [
    region.left + Math.max(0, Math.min(1, part(value))) * region.width,
    region.cy,
  ];
  const rail = line([region.left, region.cy], [region.right, region.cy], {
    stroke: 'dim',
    width: 6,
  });
  const knob = dynamic(() => [dot(18, MARK_COLOR).at(...at(read()))]);
  return { rail, knob, at };
}

/**
 * Two distributions over the same classes, in fixed columns: the prediction as solid bars, and
 * the target as dashed outlines. `q` and `p` are the values that a scene moves. `qOn` and `pOn`
 * bring each of them in, and `read` puts the share of the prediction over each column.
 */
export function pair(
  s,
  region,
  { names = WORDS, colors = WORD_COLOR, predict, targetPredict } = {},
) {
  const p = names.map(() => s.value(0)),
    q = names.map(() => s.value(0));
  /** The prediction now: the function of the scene, or the values `q`. */
  const shares = () => (predict ? predict() : q.map((value) => value.value));
  const pOn = s.value(0),
    qOn = s.value(0),
    read = s.value(0);
  const [plot, foot] = region.rows([6, 1], 'tight');
  const slots = plot.columns(names.length, 'wide');
  const tallest = plot.height - 70;
  const rule = line([plot.left, plot.bottom], [plot.right, plot.bottom], {
    stroke: 'dim',
    width: 3,
  });
  const labels = names.map((name, i) =>
    text(name, { size: 46, color: colors[i] }).at(slots[i].cx, foot.cy),
  );
  const chart = dynamic(() => {
    const now = shares();
    const targets = targetPredict ? targetPredict() : p.map((value) => value.value);
    return names.flatMap((_, i) => {
      const width = Math.min(170, slots[i].width * 0.62);
      const bar = (share, style) => {
        const height = Math.max(2, tallest * Math.min(1, share));
        return rect(width, height, style).at(slots[i].cx, plot.bottom - 4 - height / 2);
      };
      const nodes = [];
      if (qOn.value > 0.01 && now[i] > 0)
        nodes.push(
          bar(now[i], { fill: colors[i], stroke: null, radius: 6, opacity: 0.86 * qOn.value }),
        );
      if (pOn.value > 0.01)
        nodes.push(
          bar(targets[i], {
            stroke: 'ink',
            width: 4,
            fill: null,
            radius: 6,
            dash: [12, 9],
            opacity: pOn.value,
          }),
        );
      if (read.value > 0.5) {
        const top =
          plot.bottom -
          4 -
          tallest * Math.min(1, Math.max(now[i], pOn.value > 0.01 ? targets[i] : 0));
        const share = now[i] * 100;
        nodes.push(
          text(`${share >= 99.95 || share < 0.05 ? share.toFixed(2) : share.toFixed(1)}%`, {
            font: 'mono',
            size: NUMBER_SIZE + 4,
            color: colors[i],
          }).at(slots[i].cx, top - 30),
        );
      }
      return nodes;
    });
  });
  return {
    p,
    q,
    pOn,
    qOn,
    read,
    rule,
    labels,
    chart,
    slots,
    plot,
    foot,
    all: [rule, ...labels, chart],
  };
}

/** The columns of a batch table, with the title of each one. */
const BATCH_COLUMNS = {
  name: 'position',
  input: 'input',
  scores: 'scores',
  target: 'target',
  meter: 'share of the target',
  share: '',
  loss: 'loss',
};

/**
 * A batch as a table: one row for each position. A row is `{ name, input, scores, target, share,
 * loss, color }`, and `columns` names the cells that the table has. The share that the model gives
 * the target is a meter and a number. A row with no share is an ignored position. A scene shows the
 * cells on its cues: `rows[i].loss`, `titles.loss`.
 */
export function batch(
  entries,
  region,
  columns = ['name', 'scores', 'target', 'meter', 'share', 'loss'],
  headers = BATCH_COLUMNS,
) {
  // The table fills its region: the meter takes a quarter of the width.
  const METER = { width: region.width * 0.25, height: 44 };
  const plain = (words, options = {}) => text(words, { font: 'mono', size: 42, ...options });
  const rows = entries.map((entry) => {
    const color = entry.color ?? TARGET_COLOR;
    const width = Math.max(2, METER.width * (entry.share ?? 0));
    const frame = rect(METER.width, METER.height, {
      stroke: 'dim',
      width: 2,
      fill: null,
      radius: 6,
    });
    const fill = rect(width, METER.height, { fill: color, stroke: null, opacity: 0.86 }).at(
      (width - METER.width) / 2,
      0,
    );
    return {
      name: text(entry.name, { size: 42, color: 'dim' }),
      input: plain(entry.input ?? ''),
      scores: plain(entry.scores ?? ''),
      target: plain(entry.target ?? '', { color }),
      meter: entry.share === undefined ? group(frame) : group(frame, fill),
      share: plain(entry.share === undefined ? 'ignored' : entry.share.toFixed(3), {
        color: entry.share === undefined ? 'dim' : 'ink',
      }),
      loss: plain(entry.loss === undefined ? '0' : entry.loss.toFixed(3), {
        color: entry.loss === undefined ? 'dim' : MARK_COLOR,
      }),
    };
  });
  const titles = Object.fromEntries(columns.map((name) => [name, note(headers[name] || ' ')]));
  const table = grid(
    [
      ...columns.map((name) => titles[name]),
      ...rows.flatMap((cells) => columns.map((name) => cells[name])),
    ],
    {
      columns: columns.length,
      gap: [columns.length > 6 ? 'normal' : 'wide', 'loose'],
      align: 'left',
    },
  );
  place(table, region, 'left');
  return { rows, titles, table, of: (name) => rows.map((cells) => cells[name]) };
}
