import { assertEqual, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { stateLedger } from '../../../films/deep-dive-deepspeed/arithmetic.mjs';

export default function intro(s, c) {
  const {
    parts: [weights, gradients, optimizer],
    total,
  } = stateLedger(0);
  const moment = optimizer / 3;
  const occupied = weights + gradients + moment;
  const capacity = 16;
  const free = capacity - occupied;
  assertEqual(occupied, 12, 'occupied GPU memory');
  assertEqual(moment - free, 2, 'unserved part of the first request');
  assertEqual(occupied + 2 * moment, total, 'complete Adam recipe');

  const field = area.inset('normal');
  const pitch = (field.width - 72) / total;
  const left = field.left + 36;
  const x = (n) => left + n * pitch;
  const boardWidth = capacity * pitch + 44;
  const boardX = x(capacity / 2);
  const rowY = field.cy - 95;
  const front = s.value(0);
  const compare = s.value(0);
  const focus = s.value(0);
  const phase = s.value(0);
  const families = [
    { name: 'Weights', size: weights, color: 'blue' },
    { name: 'Grads', size: gradients, color: 'cyan' },
    { name: 'Master copy', size: moment, color: 'pink' },
    { name: 'Free', size: free, color: 'dim' },
  ];

  const board = [
    rect(boardWidth, 330, { fill: 'surface', stroke: 'dim', width: 4, radius: 24 }).moveTo([
      boardX,
      rowY - 12,
    ]),
    label('GPU memory', { size: 57 }).moveTo([x(2.6), rowY - 112]),
    mono(capacity + ' GB', { size: 61, color: 'yellow' }).moveTo([x(capacity - 2), rowY - 112]),
  ];
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      board.push(
        dot(6, 'dim').moveTo([boardX + side * (boardWidth / 2 - 15), rowY - 12 + end * 148]),
      );
    }
  }
  for (let i = 0; i < 18; i++) {
    board.push(
      rect(15, 20, { fill: 'yellow', stroke: 'yellow' }).moveTo([x(1) + i * 25, rowY + 164]),
    );
  }

  let start = 0;
  families.forEach(({ name, size, color }, family) => {
    const middle = x(start + size / 2);
    for (let i = 0; i < size; i++) {
      board.push(
        rect(pitch - 6, pitch - 6, {
          fill: family === 3 ? 'surface' : color,
          stroke: color,
          width: 3,
          ...(family === 3 ? { dash: [7, 5] } : {}),
        }).moveTo([x(start + i + 0.5), rowY]),
      );
    }
    board.push(label(name, { size: 37, color }).moveTo([middle, rowY + 85]));
    board.push(
      dynamic(() =>
        focus.value === family + 1
          ? line(
              [middle - (size * pitch) / 2 + 5, rowY + 119],
              [middle + (size * pitch) / 2 - 5, rowY + 119],
              { stroke: color, width: 5 },
            )
          : [],
      ),
    );
    start += size;
  });

  const demand = dynamic(() => {
    const queuedX = x(4.5 + 7.3 * front.value);
    const mid = queuedX + (x(occupied + moment / 2) - queuedX) * compare.value;
    const y = rowY + 303;
    const strip = (cx, title, first) => [
      label(title, { size: 42, color: 'pink' }).moveTo([cx, y - 66]),
      ...Array.from({ length: moment }, (_, i) =>
        rect(pitch - 6, pitch - 6, {
          fill: 'surface',
          stroke: first && phase.value >= 1 && compare.value >= 1 && i >= free ? 'red' : 'pink',
          width: 4,
          dash: [9, 5],
        }).moveTo([cx + (i + 0.5 - moment / 2) * pitch, y]),
      ),
    ];
    const nodes = strip(mid, 'First moment · ' + moment + ' GB', true);
    if (phase.value >= 1) {
      const marker = { stroke: 'yellow', width: 3, dash: [8, 8] };
      nodes.push(
        line([x(capacity), rowY + 155], [x(capacity), y - 99], marker),
        line([x(capacity), y - pitch / 2], [x(capacity), y + pitch / 2 + 15], marker),
      );
    }
    if (phase.value >= 2)
      nodes.push(...strip(x(occupied + 1.5 * moment), 'Second moment · ' + moment + ' GB', false));
    return nodes;
  });
  const readout = dynamic(() => {
    const cx = (x(capacity) + field.right) / 2 + 10;
    const value = phase.value >= 3 ? total : occupied;
    return [
      mono(value + ' GB', { size: 93, color: phase.value >= 3 ? 'pink' : 'ink' }).moveTo([
        cx,
        rowY - 28,
      ]),
      label(phase.value >= 3 ? 'of training state' : 'in use', { size: 41 }).moveTo([
        cx,
        rowY + 72,
      ]),
    ];
  });
  const message = dynamic(() =>
    label(
      [
        'Each square holds 1 GB.',
        free + ' GB free. The request is ' + (moment - free) + ' GB too large.',
        'Both moments need space.',
        total + ' GB of state before activations and buffers.',
        'Which pink arrays could four GPUs share?',
        'ZeRO gives each rank a slice to update.',
      ][phase.value],
      { size: 49 },
    ).moveTo([field.cx, field.bottom - 30]),
  );

  const picture = group(heading(c.title), ...board, demand, readout, message);
  s.add(picture);
  // Keep the drawing opaque at the cut from the course mark.
  picture.opacity(1);
  s.play(front.to(1, { duration: 1.15, ease: (t) => 1 - (1 - t) ** 2 }));
  c.on('weights', () => focus.set(1));
  c.on('gradients', () => focus.set(2));
  c.on('master', () => focus.set(3));
  c.after('miss', () => {
    focus.set(4);
    phase.set(1);
    s.play(compare.to(1, { duration: 0.85 }));
  });
  c.after('second', () => phase.set(2));
  c.after('total', () => phase.set(3));
  c.on('owners', () => phase.set(4));
  c.after('split', () => phase.set(5));
}
