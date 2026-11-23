// The kit of a rebuilt lesson: the frame and the text of the course, on the kit of Vizmatic.
// Every rebuilt lesson imports its labels, its boxes and its area from here, so all the films
// have one type and one frame. See REBUILD.md for the rules.
//
// A scene types no x and no y. It makes a text with no place, and the layout places it:
//   place(column([label('scores'), chip('logits')]), area, 'top left')
import { par, recolor, sceneKit, to } from 'vizmatic/stage';

/** The least size of a text on screen, in pixels of a 1080p frame. */
export const MIN_TEXT_SIZE = 26;

/** The size of a label. The other sizes follow it: display 71, heading 58, box 36, chip 31, note 29. */
export const LABEL_SIZE = 40;

// The course has no source line under the picture, so the area goes down to y 500.
const kit = sceneKit({ size: LABEL_SIZE, area: { bottom: 500 } });

export const {
  /** The area for the picture of a scene, as a region of the layout: x -900 to 900, y -400 to 500. */
  area,
  /** The heading of a scene, at its place: `s.add(heading(c.title))`. */
  heading,
  /** A label, 40 px: `label('slept', { color: 'green' })`. */
  label,
  /** A block of text that wraps at a width, 36 px: `para(words, side.width)`. */
  para,
  /** A small dim note, 29 px. */
  note,
  /** The one large line of a picture, 71 px. */
  display,
  card,
  textWidth,
  fitSize,
} = kit;

/** A number or a name of the code, in the mono type of the course: `mono('0.114', { color: 'green' })`. */
export const mono = (content, options = {}) => label(content, { font: 'mono', ...options });

/** The dashes of a border that is `dash: true`: a thing that is absent, or only planned. */
const DASH = [10, 8];
// LIBRARY: `dash: true` on a chip and a named box. The library takes a list of lengths only.
const dashed = (options = {}) => (options.dash === true ? { ...options, dash: DASH } : options);

/** A short label in a box that fits it, 31 px: `chip('virtio')`, `chip('planned', { dash: true })`. */
export const chip = (content, options) => kit.chip(content, dashed(options));
export const chipRow = (items, options) => kit.chipRow(items, dashed(options));
/** A box of a given size with a name that fits it: `namedBox('host', { width: 320, height: 96 })`. */
export const namedBox = (name, options) => kit.namedBox(name, dashed(options));

/**
 * Give a chip or a named box another color: its border and its words, and not its fill. It is one
 * animation: `s.play(tint(box, 'red'))`, or `c.show(cue, tint(box, 'red'))`. Another node takes the
 * color as `recolor` gives it.
 */
// LIBRARY: `recolor` of a chip or a named box paints its fill too, and the words are lost on it.
export function tint(node, color, options = { duration: 0.4 }) {
  const words = [node.text, node.name, node.sub].filter(Boolean);
  if (!node.frame || !words.length) return recolor(node, color, options);
  return par(
    ...words.map((part) => recolor(part, color, options)),
    to(node.frame, (frame) => frame.stroke(color), options),
  );
}
