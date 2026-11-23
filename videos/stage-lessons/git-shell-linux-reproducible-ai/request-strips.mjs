import { delay, fade, place, rect, to } from 'vizmatic/stage';
import { label, namedBox } from '../kit-narrated.mjs';
import { score } from './parts.mjs';

// Each card represents one parsed record. Every reader sees the same ordering.
export function requestStrip(region, title, records, slots = records.length) {
  const [name, body] = region.columns([1, 5], 'wide');
  const heading = place(label(title, { size: 38 }), name, 'left');
  const cells = body.columns(slots, 'tight');
  const cards = records.map((record, i) => {
    const matches = score([record]).correct === 1;
    return place(
      namedBox(record.prompt.match(/\d+/)[0], {
        width: cells[i].width,
        height: 94,
        size: 36,
        font: 'mono',
        color: matches ? 'cyan' : 'pink',
        sub: matches ? 'match' : 'miss',
        subSize: 27,
      }),
      cells[i],
    );
  });
  const points = cells.map((cell) => cell.point('center'));
  return { heading, cards, cells, points };
}

// A plain commit and its checkout copy a file. Leave the selected original in place.
export function copyStrip(s, c, cue, from, into, count, first = 0) {
  const cards = into.cards.slice(first, first + count);
  for (const [i, card] of cards.entries()) card.moveTo(from.points[first + i]).opacity(0);
  c.on(cue, () =>
    s.play(
      ...cards.flatMap((card, i) => [
        to(card, (n) => n.moveTo(into.points[first + i]), { duration: 1 }),
        delay(fade(card, 1, { duration: 0.28 }), 0.59),
      ]),
    ),
  );
}

export function readStrip(s, c, cue, strip, count) {
  const line = rect(strip.cells[0].width * 0.78, 6, { fill: 'yellow', stroke: 'yellow' });
  line.moveTo([strip.points[0][0], strip.points[0][1] + 56]);
  c.show(cue, line, { fade: 0.08 });
  c.on(
    cue,
    () =>
      s.play(
        to(line, (n) => n.moveTo([strip.points[count - 1][0], strip.points[count - 1][1] + 56]), {
          duration: 0.95,
        }),
      ),
    0.1,
  );
  c.hide(cue, line, { lead: -1.25, fade: 0.15 });
}
