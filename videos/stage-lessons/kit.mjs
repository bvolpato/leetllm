// Shared pieces for stage lessons, so every film has the same type, color, and pacing.
import { Node, concat, fade, fadeIn, group, rect, rectPath, text, write } from 'vizmatic/stage';

export const HEADING_LEFT = -850;
export const HEADING_Y = -462;

/** A labeled tile. The group's origin is its center. */
export function chip(
  label,
  {
    w = 120,
    h = 64,
    color = 'blue',
    size = 32,
    font = 'mono',
    fill = 'surface',
    width = 2.5,
    radius = 10,
    labelColor,
  } = {},
) {
  const box = rect(w, h, { radius, fill, stroke: color, width });
  const caption = text(label, { size, font, color: labelColor ?? color });
  const node = group(box, caption);
  node.data.box = box;
  node.data.caption = caption;
  return node;
}

/** One path holding an n by n grid of cells, centered on its origin, so it morphs as one shape. */
export function gridPath(n, size, gap = 0.14) {
  const cell = size / n,
    inner = cell * (1 - gap),
    rings = [];
  for (let row = 0; row < n; row++)
    for (let column = 0; column < n; column++) {
      rings.push(
        rectPath(
          -size / 2 + column * cell + (cell - inner) / 2,
          -size / 2 + row * cell + (cell - inner) / 2,
          inner,
          inner,
          Math.min(4, inner * 0.14),
        ),
      );
    }
  return concat(...rings);
}

export function gridNode(n, size, color = 'blue') {
  return new Node(gridPath(n, size)).fill(color, 0.42).stroke(color, n > 8 ? 1 : 2.5);
}

/** Lay nodes out in a row, centered on x, and return them. */
export function row(nodes, y, gap, x = 0) {
  const widths = nodes.map((node) => node.width);
  const total = widths.reduce((sum, width) => sum + width, 0) + gap * (nodes.length - 1);
  let cursor = x - total / 2;
  nodes.forEach((node, i) => {
    node.moveTo([cursor + widths[i] / 2, y]);
    cursor += widths[i] + gap;
  });
  return nodes;
}

/** Text placed by its left edge, which is how labels line up in a column. */
export function label(content, x, y, options = {}) {
  return text(content, { size: 30, color: 'dim', ...options })
    .moveTo([0, y])
    .alignTo([x, 0], 'left');
}

/** Write each scene's title as it begins, and clear it as it ends. */
export function sceneHeading(s, scene, title, { hold = 0.5 } = {}) {
  const heading = text(title, { font: 'text-serif', size: 58 })
    .moveTo([0, HEADING_Y])
    .alignTo([HEADING_LEFT, 0], 'left')
    .pin();
  scene.at(0.15, () => s.play(write(heading), { duration: 1 }));
  s.at(scene.end - hold - 0.05, () => s.play(fade(heading, 0, { duration: hold })));
  return heading;
}

/**
 * Move an axes object's numbers clear of its lines. Vizmatic places them at a fixed distance
 * whatever their size, so large numbers touch the axis. X numbers come first, then Y numbers.
 */
export function clearAxisNumbers(plane, { x = 14, y = 30 } = {}) {
  const numbers = plane.numbers.children,
    half = numbers.length / 2;
  numbers.forEach((node, i) => (i < half ? node.shift(0, x) : node.shift(-y, 0)));
  return plane;
}

/** Fade a list of nodes out together at a time. */
export function clear(s, time, nodes, duration = 0.45) {
  s.at(time, () => s.play(...nodes.map((node) => fade(node, 0, { duration }))));
}

export { fadeIn };
