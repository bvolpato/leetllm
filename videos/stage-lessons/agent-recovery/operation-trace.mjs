import { appear, arrow, beside, dot, draw, line, place, seq, vanish } from 'vizmatic/stage';
import { area, label, mono } from '../kit-narrated.mjs';
import { COLOR, cross, token, travel } from './parts.mjs';

// One row per event, in time order. Only a message that arrives reaches the far rail.
export function operationTrace(reference, count) {
  const [head, body, foot] = area.rows([1, 6, 1], 'normal');
  const [left, middle, right] = head.columns([2, 5, 2], 'normal');
  const agent = place(label('Agent', { color: COLOR.attempt }), left);
  const controller = place(label('Controller', { color: COLOR.controller }), right);
  const scope = place(mono(reference, { color: COLOR.op, size: 39 }), middle);
  const ax = left.cx;
  const cx = right.cx;
  const rails = [ax, cx].map((x) =>
    line([x, body.top], [x, body.bottom], { stroke: 'faint', width: 3 }),
  );
  const rows = body.rows(count, 'normal');
  const annotation = (index, words, color) =>
    beside(mono(words, { size: 40, color }), [middle.cx, rows[index].cy + 20], 'above', 'tight');
  function message(index, words, { back = false, color = COLOR.attempt, lost = false } = {}) {
    const y = rows[index].cy + 20;
    const from = [back ? cx : ax, y];
    const to = [lost ? (ax + cx) / 2 : back ? ax : cx, y];
    const wire = arrow(from, to, { stroke: color, width: 4, pad: 8 });
    const name = beside(
      mono(words, { size: 40, color }),
      [(from[0] + to[0]) / 2, y],
      'above',
      'tight',
    );
    const packet = dot(13, color).moveTo(from);
    const end = lost ? cross(32).moveTo(to) : dot(9, color).moveTo(to);
    return {
      name,
      end,
      send(s) {
        s.play(
          draw(wire, { duration: 0.7 }),
          seq(
            travel(packet, to, { duration: 0.7 }),
            vanish(packet),
            ...(lost ? [] : [appear(end)]),
          ),
        );
      },
    };
  }
  const marker = (index, words, side, color) =>
    token(words, color, { size: 35 }).moveTo([side ? cx : ax, rows[index].cy + 20]);
  const caption = (words, color = 'ink') => place(label(words, { color, size: 45 }), foot);
  return { base: [agent, controller, scope, ...rails], message, marker, caption, annotation };
}
