import {
  boxOf,
  column,
  delay,
  dot,
  fitted,
  grid,
  indicate,
  numberLine,
  place,
  rect,
  row,
  seq,
  to,
} from 'vizmatic/stage';
import { chip, label, mono, note } from '../../kit-narrated.mjs';
import { pool } from '../../../films/active-labeling/fixtures.mjs';
import { footer, open, picture } from '../parts.mjs';
export default function uncertaintySelection(s, c) {
  open(s, c);
  const [left, right] = picture.columns([6, 3], 'loose');
  const [lineArea, tableArea] = left.rows([1, 1], 'wide');
  const axis = place(
    fitted(lineArea.inset('normal'), (length) =>
      numberLine({
        range: [0, 1],
        length,
        ticks: [0, 0.5, 1],
        size: 34,
        labelSize: 34,
        levels: 4,
        points: pool.map((p) => ({
          name: p.id,
          value: p.probability,
          label: p.id + ' · ' + p.probability.toFixed(2),
          color: 'blue',
        })),
        thresholds: [{ at: 0.5, label: 'uncertain', readout: false, color: 'yellow' }],
      }),
    ),
    lineArea,
  );
  const table = place(
    grid(
      [
        note('case'),
        note('feedback question'),
        note('uncertainty'),
        ...pool.flatMap((p) => [
          label(p.id, { color: 'blue' }),
          note(p.label),
          mono(p.uncertainty.toFixed(2), { size: 34, color: 'blue' }),
        ]),
      ],
      { columns: 3, gap: ['wide', 'tight'] },
    ),
    tableArea,
  );
  const slots = right.rows([1, 2, 2, 2], 'normal');
  const title = place(label('Review queue'), slots[0]);
  const frames = slots
    .slice(1, 3)
    .map((r) =>
      place(rect(r.width - 8, r.height - 8, { stroke: 'dim', width: 4, radius: 12 }), r).zIndex(-1),
    );
  const chosen = [...pool].sort((a, b) => b.uncertainty - a.uncertainty).slice(0, 2);
  const queued = chosen.map((p, i) =>
    place(chip(p.id + ' · review?', { color: 'yellow' }), slots[i + 1]),
  );
  const ends = queued.map((q) => boxOf(q).point('center'));
  const transfers = chosen.map((p) => dot(14, 'yellow').moveTo(axis.world(p.probability)));
  const audit = place(
    column([chip('Random audit', { color: 'cyan' }), note('Check blind spots')]),
    slots[3],
  );
  const noteText = place(
    note('The probability marks stay fixed. Only queue membership changes.'),
    footer,
  );
  s.add(axis, table, title, frames, noteText);
  c.on('fixed-uncertainty', () =>
    s.play(indicate(axis.threshold(), { color: 'yellow', scale: 1 })),
  );
  c.show('select-queue', transfers);
  c.on(
    'select-queue',
    () =>
      s.play(
        ...transfers.map((mark, i) =>
          delay(
            seq(
              to(
                mark,
                (n) => n.moveTo([boxOf(lineArea).right + 18, axis.world(chosen[i].probability)[1]]),
                { duration: 0.65 },
              ),
              to(mark, (n) => n.moveTo(ends[i]), { duration: 0.45 }),
            ),
            i * 0.5,
          ),
        ),
      ),
    0.4,
  );
  c.hide('select-queue', transfers, { after: true, lead: -1.1 });
  c.show('select-queue', queued, { after: true, lead: -1.4, stagger: true });
  c.show('review-questions', audit);
}
