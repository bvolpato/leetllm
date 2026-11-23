import {
  Node,
  fade as fadeTo,
  fadeIn,
  fadeOut as fadeAway,
  group,
  rect,
  text,
  tex,
} from 'vizmatic/stage';

// s.play with its own duration stretches every animation to fill it. brief() keeps a stated length,
// so an old picture is gone before the new one is readable.
const POP = (t) => 1 - (1 - t) ** 3,
  LINEAR = (t) => t;
const brief = (anim, seconds, wait = 0, ease = POP) => ({
  ...anim,
  duration: wait + seconds,
  schedule: (ctx) =>
    anim.schedule({
      ...ctx,
      t0: ctx.t0 + wait,
      t1: ctx.t0 + wait + seconds,
      ease,
    }),
});
const fadeOut = (target, options = {}) =>
  options.duration === undefined
    ? fadeAway(target, options)
    : brief(fadeAway(target, options), options.duration, 0, LINEAR);
const fade = (target, value, options = {}) =>
  options.duration === undefined
    ? fadeTo(target, value, options)
    : brief(fadeTo(target, value, options), options.duration, 0, LINEAR);
/** New content waits until the old content has nearly gone, so the two do not read as one picture. */
const arrive = (anim, wait = 0.08, seconds = 0.2) => brief(anim, seconds, wait, LINEAR);
const WORDS = ['Birds', 'in', 'the', 'garden', 'sing', 'softly', 'at', 'dawn'];
const f2 = (value) => value.toFixed(2);
const num = (value) => String(+value.toFixed(2));
const pct = (value) => `${Math.round(value * 100)}%`;
const bmatrix = (rows) =>
  `\\begin{bmatrix} ${rows.map((row) => row.join(' & ')).join(' \\\\ ')} \\end{bmatrix}`;
const LEFT = -860;
/** Running text placed by its left edge. */
const prose = (content, x, y, size = 60, color = 'ink', extra = {}) =>
  text(content, {
    font: 'text-serif',
    size,
    color,
    ...extra,
  })
    .moveTo([0, y])
    .alignTo([x, 0], 'left');
const midProse = (content, x, y, size = 60, color = 'ink', extra = {}) =>
  text(content, {
    font: 'text-serif',
    size,
    color,
    ...extra,
  }).moveTo([x, y]);
/** Words that share a line: placed by baseline, so descenders don't shift them. */
const lineProse = (content, x, y, size = 60, color = 'ink') =>
  text(content, {
    font: 'text-serif',
    size,
    color,
  }).at(x, y);
const mono = (content, x, y, size = 56, color = 'ink') =>
  text(content, {
    font: 'mono',
    size,
    color,
  })
    .moveTo([0, y])
    .alignTo([x, 0], 'left');
const midMono = (content, x, y, size = 56, color = 'ink') =>
  text(content, {
    font: 'mono',
    size,
    color,
  }).moveTo([x, y]);
const math = (content, x, y, size = 70, color = 'ink') =>
  tex(content, {
    size,
    color,
  })
    .moveTo([0, y])
    .alignTo([x, 0], 'left');
const midMath = (content, x, y, size = 70, color = 'ink') =>
  tex(content, {
    size,
    color,
  }).moveTo([x, y]);
/** A tensor drawn as a grid of cells, so its shape can be read at a glance. */
const block = (rows, columns, color, x, y, cell = 68) => {
  const node = new Node();
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < columns; c++)
      node.add(
        rect(cell - 5, cell - 5, {
          radius: 5,
          fill: color,
          stroke: null,
        })
          .at((c - (columns - 1) / 2) * cell, (r - (rows - 1) / 2) * cell)
          .opacity(0.8),
      );
  return node.at(x, y);
};
/** A grid of allowed and blocked reads. `allowed(row, column)` decides each cell. */
const maskCells = (rows, columns, x, y, cell, allowed, color = 'yellow') => {
  const node = new Node();
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < columns; c++) {
      if (allowed(r, c))
        node.add(
          rect(cell - 8, cell - 8, {
            radius: 6,
            fill: color,
            stroke: null,
          })
            .at((c - (columns - 1) / 2) * cell, (r - (rows - 1) / 2) * cell)
            .opacity(0.78),
        );
    }
  return node.at(x, y);
};
const maskFrame = (rows, columns, x, y, cell) => {
  const node = new Node();
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < columns; c++)
      node.add(
        rect(cell - 8, cell - 8, {
          radius: 6,
          fill: 'surface',
          stroke: 'gridStrong',
          width: 1.5,
        }).at((c - (columns - 1) / 2) * cell, (r - (rows - 1) / 2) * cell),
      );
  return node.at(x, y);
};
/** One bar split between two shares, drawn from the current values. */
const shareBar = (
  shares,
  x,
  y,
  width,
  height,
  [colorA, colorB],
  size = 64,
  { names, percent = true } = {},
) => {
  const [a, b] = shares,
    gap = 6,
    left = x - width / 2,
    widthA = Math.max(4, width * a - gap / 2),
    widthB = Math.max(4, width * b - gap / 2);
  const tag = (i) => [names?.[i], percent ? pct(shares[i]) : null].filter(Boolean).join(' ');
  const out = [
    rect(widthA, height, {
      radius: 6,
      fill: colorA,
      stroke: null,
    }).at(left + widthA / 2, y),
    rect(widthB, height, {
      radius: 6,
      fill: colorB,
      stroke: null,
    }).at(left + width - widthB / 2, y),
  ];
  if (widthA > size * 2.6)
    out.push(
      text(tag(0), {
        font: 'mono',
        size,
        color: 'bg',
      }).moveTo([left + widthA / 2, y]),
    );
  if (widthB > size * 2.6)
    out.push(
      text(tag(1), {
        font: 'mono',
        size,
        color: 'bg',
      }).moveTo([left + width - widthB / 2, y]),
    );
  return out;
};
const chipNode = (content, x, y, color = 'blue', { w, h = 96, size = 48 } = {}) => {
  const caption = text(content, {
    font: 'text-serif',
    size,
    color,
  });
  const box = rect(w ?? caption.width + 60, h, {
    radius: 12,
    fill: 'surface',
    stroke: color,
    width: 3,
  });
  return group(box, caption).at(x, y);
};
/** A part of the picture can wait dim on screen, then light up when the voice reaches it. */
const waiting = (nodes) => nodes.forEach((node) => node.opacity(0));
const dimIn = (nodes) => nodes.map((node) => fade(node, 0.28));
const lit = (nodes) => nodes.map((node) => fade(node, 1));
/** Opacity that keeps quiet text at about 3.3:1 on the film's background, #0b0c10, so it steps back and stays readable. */
const QUIET = {
  ink: 0.39,
  dim: 0.57,
  yellow: 0.43,
  green: 0.46,
  orange: 0.53,
  red: 0.63,
};

/** Per-build transitions and camera helpers, bound to this film's Stage. */
export function createDefaults(stage) {
  const show = (scene, cue, nodes, duration = 0.6) =>
    scene.on(cue, () =>
      stage.play(
        fadeIn(nodes, {
          shift: [0, 10],
        }),
        {
          duration,
        },
      ),
    );
  const leave = (scene, nodes) =>
    stage.at(scene.end - 0.5, () =>
      stage.play(fadeOut(nodes), {
        duration: 0.45,
      }),
    );
  // A fading cover shows what it hides, so covered cells leave first, while the cover still hides them.
  const dropCovered = (scene, nodes) =>
    stage.at(scene.end - 0.55, () =>
      stage.play(fadeOut(nodes), {
        duration: 0.02,
      }),
    );
  /** Hand one picture to the next. The new one starts late in the old one's fade, so the two cross at low opacity: the frame is never empty, and they don't read as one picture. */
  const handOver = (scene, cue, old, arrive, fadeTime = 0.22, delay = fadeTime * 0.36) => {
    scene.on(cue, () =>
      stage.play(fadeOut(old), {
        duration: fadeTime,
      }),
    );
    scene.on(cue, arrive, delay);
  };
  return {
    show,
    leave,
    dropCovered,
    handOver,
  };
}
export {
  POP,
  LINEAR,
  brief,
  fadeOut,
  fade,
  arrive,
  WORDS,
  f2,
  num,
  pct,
  bmatrix,
  LEFT,
  prose,
  midProse,
  lineProse,
  mono,
  midMono,
  math,
  midMath,
  block,
  maskCells,
  maskFrame,
  shareBar,
  chipNode,
  waiting,
  dimIn,
  lit,
  QUIET,
};
