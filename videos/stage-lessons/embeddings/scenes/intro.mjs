import {
  boxOf,
  dot,
  draw,
  dynamic,
  fadeIn,
  group,
  indicate,
  line,
  linear,
  place,
  polygon,
  rect,
  row,
} from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { charge, firstGuide, guideScores, tickets } from '../charge.mjs';
import { vec } from '../parts.mjs';

function receipt() {
  const edge = Array.from({ length: 19 }, (_, i) => [180 - 20 * i, 147 + 13 * (i % 2)]);
  const amount = mono('$12.00', { size: 70, color: 'bg' }).at(0, 72);
  const { left, right, bottom } = boxOf(amount);
  const underline = line([left, bottom + 12], [right, bottom + 12], { stroke: 'bg', width: 5 });
  const paper = group(
    polygon([[-180, -158], [180, -158], ...edge], { fill: 'ink', stroke: null }),
    label('INVOICE', { size: 40, color: 'bg' }).at(0, -102),
    line([-140, -55], [140, -55], { stroke: 'bg', width: 3 }),
    label('Charge', { size: 38, color: 'bg' }).at(0, -8),
    amount,
    underline,
  );
  return { paper, underline };
}

function phone() {
  return group(
    rect(210, 332, { radius: 28, fill: 'surface', stroke: 'green', width: 6 }),
    rect(60, 9, { radius: 4, fill: 'dim', stroke: null }).at(0, -138),
    rect(102, 50, { radius: 6, stroke: 'dim', width: 4 }).at(-3, -32),
    rect(8, 20, { radius: 2, fill: 'dim', stroke: null }).at(54, -32),
    rect(4, 36, { fill: 'red', stroke: null }).at(-47, -32),
    mono('2%', { size: 68, color: 'ink' }).at(0, 51),
    rect(72, 6, { radius: 3, fill: 'dim', stroke: null }).at(0, 140),
  );
}

export default function intro(s, c) {
  const [objects, messages, inputs, results, foot] = area.rows([4.5, 1, 1, 1, 1], 'normal');
  const columns = (region) => region.columns([1, 0.52, 1], 'normal');
  const [billArea, tableArea, deviceArea] = columns(objects);
  const objectScale = 1.2;
  const { paper, underline } = receipt();
  const bill = place(paper.scale(objectScale), billArea);
  const device = place(phone().scale(objectScale), deviceArea);
  const bolt = polygon(
    [
      [-1, -17],
      [-11, 3],
      [-2, 3],
      [-5, 17],
      [11, -6],
      [2, -6],
    ],
    {
      fill: 'green',
      stroke: null,
    },
  )
    .scale(objectScale)
    .moveTo([deviceArea.cx, deviceArea.cy - 32 * objectScale]);
  const word = () => label('charge', { size: 57, color: 'blue' });
  const phrases = tickets.map((ticket, i) => {
    const clue = label(ticket.excerpt.slice(7), { size: 57 });
    const phrase = place(row([word(), clue], { gap: 'tight' }), columns(messages)[i * 2]);
    return { phrase, clue };
  });
  const title = heading(c.title);
  const opening = [title, bill, device, ...phrases.flatMap((p) => p.phrase.nodes)];
  s.add(opening);
  s.play(fadeIn(opening, { duration: 0 }));
  s.play(draw(underline, { duration: 0.9, ease: linear }));
  c.show('phone', bolt);

  const id = label('charge  ·  ID 0', { color: 'blue', size: 43 }).at(
    tableArea.cx,
    tableArea.cy - 44,
  );
  const values = mono(vec(charge), { size: 41, color: 'blue' }).at(tableArea.cx, tableArea.cy + 22);
  c.show('lookup', [id, values]);
  const copies = tickets.map((_, i) =>
    place(mono(vec(charge), { size: 44, color: 'blue' }), columns(inputs)[i * 2]),
  );
  const progress = s.value(0);
  const fork = [tableArea.cx, inputs.cy];
  const start = [tableArea.cx, boxOf(values).bottom + 16];
  const ends = [boxOf(copies[0]).right + 20, boxOf(copies[1]).left - 20];
  const wires = dynamic(() => {
    const stem = Math.min(1, progress.value * 2);
    const branch = Math.max(0, progress.value * 2 - 1);
    const y = start[1] + stem * (fork[1] - start[1]);
    const lines = [line(start, [fork[0], y], { stroke: 'blue', width: 3 })];
    if (branch === 0) return [...lines, dot(6, 'blue').at(fork[0], y)];
    return lines.concat(
      ends.flatMap((end) => {
        const x = fork[0] + branch * (end - fork[0]);
        return [
          line(fork, [x, fork[1]], { stroke: 'blue', width: 3 }),
          dot(6, 'blue').at(x, fork[1]),
        ];
      }),
    );
  });
  const send = c.cue('send');
  c.show('send', wires);
  c.on('send', () => s.play(progress.to(1, { duration: send.end - send.start })));
  c.show('send', copies, { after: true, lead: 0 });

  const guide = firstGuide(guideScores(charge));
  const outcome = (name, color, i) =>
    place(label('First guide  ·  ' + name, { size: 43, color }), columns(results)[i * 2]);
  const covers = tickets.map((_, i) => outcome('?', 'yellow', i));
  const answers = tickets.map((_, i) => outcome(guide, 'green', i));
  const question = place(
    label('Can the two searches return different guides?', { size: 47, color: 'yellow' }),
    foot,
  );
  c.show('predict', [question, covers]);
  c.swap('rank', [question, covers], answers, { after: true });
  c.on('clues', () =>
    s.play(
      indicate(
        phrases.map((p) => p.clue),
        { color: 'yellow', scale: 1 },
      ),
    ),
  );
}
