import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  Node,
  fadeIn,
  fadeOut as fadeAway,
  glyphPath,
  indicate,
  parseFont,
  pathBounds,
  rect,
  smoother,
  text,
  to,
  transformPath,
} from 'vizmatic/stage';
import { chip, row } from '../../stage-lessons/kit.mjs';
import { PIECES, SENTENCE } from './model.mjs';

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
    : brief(fadeAway(target, options), options.duration);
// Japanese and the sparkle are not in the bundled film fonts, so they use the book's fallback fonts.
const FONT_DIR = fileURLToPath(new URL('../../../web/tools/book/fonts/', import.meta.url));
const loadFont = (name) => {
  const bytes = readFileSync(FONT_DIR + name);
  return parseFont(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
};
const CJK_FONT = loadFont('BookFallbackCJK-Regular.ttf'),
  EMOJI_FONT = loadFont('BookFallbackEmoji-Regular.ttf');
/** A character the film fonts lack, drawn as its outline and centered on its origin. */
function glyphNode(ch, size, color = 'ink') {
  const font = /\p{Emoji_Presentation}|✨/u.test(ch) ? EMOJI_FONT : CJK_FONT;
  const glyph = font.glyphFor(ch.codePointAt(0));
  assert(glyph, `No outline for ${ch}`);
  const path = glyphPath(font, glyph, size),
    box = pathBounds(path);
  return new Node(
    transformPath(path, [1, 0, 0, 1, -box.x - box.width / 2, -box.y - box.height / 2]),
  ).fill(color);
}
/** Text with its left edge at x. It uses at(), so words in a line share a baseline. */
function leftText(content, x, y, options = {}) {
  const node = text(content, {
    size: 48,
    ...options,
  });
  return node.at(x + node.width / 2, y);
}
/** A chip sized to its label. */
function tile(
  content,
  {
    size = 60,
    font = 'mono',
    color = 'blue',
    pad = 44,
    h = size * 1.7,
    fill = 'surface',
    min = 0,
    width = 2.5,
  } = {},
) {
  const measured = text(content, {
    size,
    font,
  }).width;
  return chip(content, {
    w: Math.max(min, measured + pad),
    h,
    size,
    font,
    color,
    fill,
    width,
  });
}
/** A row of tiles, centered on x, sized to their labels. */
function tileRow(contents, y, { gap = 14, x = 0, color, ...options } = {}) {
  return row(
    contents.map((content, i) =>
      tile(content, {
        ...options,
        color: typeof color === 'function' ? color(content, i) : (color ?? 'blue'),
      }),
    ),
    y,
    gap,
    x,
  );
}
/** A tile whose box and label are separate, so tiles can glue without morphing their letters. */
function part(
  content,
  x,
  y,
  { size = 60, font = 'mono', color = 'blue', pad = 44, h = size * 1.7, min = 0 } = {},
) {
  const caption = text(content, {
    size,
    font,
    color,
  })
    .at(x, y)
    .zIndex(3);
  const box = rect(Math.max(min, caption.width + pad), h, {
    radius: 12,
    fill: 'surface',
    stroke: color,
    width: 2.5,
  }).at(x, y);
  return {
    caption,
    box,
    all: [box, caption],
  };
}
const LETTER = 88,
  TILE_PAD = 20,
  PIECE_GAP = 20;
/** Where each letter and piece of a word sits, given how its pieces are merged so far. */
function wordLayout(word, x, y) {
  let cursor = x;
  const letters = [],
    pieces = [];
  let index = 0;
  for (const piece of word.pieces) {
    const width = piece.length * LETTER + TILE_PAD * 2;
    pieces.push({
      x: cursor + width / 2,
      y,
      width,
      height: 124,
      from: index,
      to: index + piece.length - 1,
      text: piece,
    });
    for (let i = 0; i < piece.length; i++)
      letters.push({
        x: cursor + TILE_PAD + LETTER * (i + 0.5),
        y,
      });
    cursor += width + PIECE_GAP;
    index += piece.length;
  }
  return {
    letters,
    pieces,
  };
}
const pieceBox = (piece, color = 'blue') =>
  rect(piece.width, piece.height, {
    radius: 14,
    fill: 'surface',
    stroke: color,
    width: 3,
  }).at(piece.x, piece.y);

/** Per-build transitions and camera helpers, bound to this film's Stage. */
export function createDefaults(stage) {
  /** Fade a scene's pieces out as it ends, so the next scene starts clean. */
  const clearAtEnd = (scene, parts) =>
    stage.at(scene.end - 0.55, () =>
      stage.play(fadeOut(parts), {
        duration: 0.5,
      }),
    );
  // The camera frames what the scene has shown so far, under the heading. A pull ends just before
  // its cue, so what the cue reveals is never cut off by a moving frame. The heading is pinned.
  const HOME = {
      x: 0,
      y: 0,
      zoom: 1,
    },
    PULL = 1.1;
  const framing = (nodes, { max = 1.9 } = {}) => {
    if (nodes === HOME) return HOME;
    const boxes = [nodes].flat(Infinity).map((node) => (node.bounds ? node.bounds() : node));
    const x0 = Math.min(...boxes.map((box) => box.x)),
      y0 = Math.min(...boxes.map((box) => box.y));
    const x1 = Math.max(...boxes.map((box) => box.x + box.width)),
      y1 = Math.max(...boxes.map((box) => box.y + box.height));
    // The usable frame runs from y = -405, under the heading, to y = 480, with 110 units at each side.
    const zoom = Math.max(1, Math.min(max, 1700 / (x1 - x0), 885 / (y1 - y0)));
    return {
      x: (x0 + x1) / 2,
      y: (y0 + y1) / 2 - 37.5 / zoom,
      zoom,
    };
  };
  const look = (view) =>
    to(stage.camera, (camera) => camera.at(view.x, view.y).set('sx', view.zoom));
  /** Set the first view of a scene. The screen is empty at this moment, so nobody sees the jump. */
  const openOn = (scene, nodes, options) => {
    const view = framing(nodes, options);
    scene.at(0.01, () =>
      stage.play(look(view), {
        duration: 0.05,
      }),
    );
  };
  const pullTo = (scene, cue, nodes, options) => {
    const view = framing(nodes, options);
    scene.on(
      cue,
      () =>
        stage.play(look(view), {
          duration: PULL,
          ease: smoother,
        }),
      -PULL - 0.05,
    );
  };
  /** One picture hands over to the next. The overlap is short, so the frame never goes blank. */
  const handover = (from, ...into) =>
    stage.play(
      brief(fadeOut(from), 0.2, 0, LINEAR),
      ...into.map((anim) => brief(anim, anim.label === 'lagged' ? 0.9 : 0.4, 0.12)),
    );
  /** Swell a tile's label. The tile itself stays, so a filled box never hides its own text. */
  const flash = (chips, options = {}) =>
    indicate(
      [chips].flat().map((node) => node.data.caption),
      {
        color: 'yellow',
        scale: 1.14,
        ...options,
      },
    );
  /** The sentence fades, and each number rises from the piece it stands for, so nothing turns to mush. */
  const sentenceToIds = (sentence, ids, size, y) => {
    const measure = (content) =>
      content
        ? text(content, {
            font: 'text-serif',
            size,
          }).width
        : 0;
    const left = -measure(SENTENCE) / 2;
    let prefix = '';
    const centers = PIECES.map(([piece]) => {
      const next = prefix + piece.replaceAll('·', ' '),
        center = left + (measure(prefix) + measure(next)) / 2;
      prefix = next;
      return center;
    });
    return [
      brief(fadeOut(sentence), 0.2, 0, LINEAR),
      ...ids.map((node, i) =>
        brief(
          fadeIn(node, {
            shift: [centers[i] - node.get('x'), y - node.get('y')],
          }),
          0.6,
          0.1 + i * 0.06,
        ),
      ),
    ];
  };
  /** A new note takes an old note's place. The old one is fully gone first, so they never overlap. */
  const replaceNote = (from, ...into) =>
    stage.play(
      brief(fadeOut(from), 0.18, 0, LINEAR),
      ...into.map((anim) => brief(anim, 0.3, 0.18)),
    );
  const nudge = (node, dx, dy) =>
    to(node, (item) => item.at(item.get('x') + dx, item.get('y') + dy));
  return {
    clearAtEnd,
    HOME,
    openOn,
    pullTo,
    handover,
    flash,
    sentenceToIds,
    replaceNote,
    nudge,
  };
}
export {
  POP,
  LINEAR,
  brief,
  fadeOut,
  FONT_DIR,
  loadFont,
  CJK_FONT,
  EMOJI_FONT,
  glyphNode,
  leftText,
  tile,
  tileRow,
  part,
  LETTER,
  TILE_PAD,
  PIECE_GAP,
  wordLayout,
  pieceBox,
};
