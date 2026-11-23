import { fadeIn, fadeOut, Node, rect, text } from 'vizmatic/stage';
import { sceneHeading } from '../kit.mjs';

export const words = (value, size = 52, color = 'ink', font = 'text-serif') =>
  text(value, { size, color, font });

export const left = (node, x, y) => node.moveTo([0, y]).alignTo([x, 0], 'left');

export function tile(value, { w, h, color = 'dim', size = 48, solid = false }) {
  return new Node().add(
    rect(w, h, { radius: 10, fill: solid ? color : 'surface', stroke: color, width: 2 }),
    words(value, size, solid ? 'bg' : 'ink', 'mono').moveTo([0, 0]),
  );
}

// Retire the objects currently on screen, including the last version of a changing label.
export function picture(stage, narration, id) {
  const clock = narration.scene(id);
  sceneHeading(stage, clock, narration.title(id));
  const visible = new Set();
  let note;
  function show(nodes, duration = 0.28, animation = {}) {
    const list = [nodes].flat();
    list.forEach(node => visible.add(node));
    if (duration === 0) stage.add(...list);
    else stage.play(fadeIn(list, animation), { duration });
  }
  function hide(nodes, duration = 0.14) {
    const list = [nodes].flat().filter(node => visible.delete(node));
    if (list.length) stage.play(fadeOut(list), { duration });
  }
  function caption(value, color = 'ink') {
    hide(note, 0.1);
    note = left(words(value, 52, color), -850, 420);
    show(note, 0.2);
  }
  return {
    clock, show, hide, caption,
    clear: () => hide([...visible]),
    finish: () => stage.at(clock.end - 0.45, () => hide([...visible], 0.38)),
  };
}
