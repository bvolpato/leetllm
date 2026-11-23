import { column, dot, line, place } from 'vizmatic/stage';
import { area, heading, mono } from '../../kit-narrated.mjs';
import { caption } from '../inspection.mjs';
import { visionRows } from '../parts.mjs';

export default function scene(s, c) {
  const [head, body, subtotal, foot] = area.rows([1, 4, 1, 1], 'wide');
  const lanes = body.columns(3, 'wide'),
    labels = head.columns(3, 'wide'),
    counts = subtotal.columns(3, 'wide');
  const bands = ['train', 'validation', 'test'].map((split, i) => {
    const rows = visionRows.filter((row) => row.photo.split === split);
    const cases = [...new Set(rows.map((row) => row.photo.case_id))];
    const ids = cases.map((id) =>
      rows
        .filter((r) => r.photo.case_id === id)
        .map((r) => r.photo.photo_id)
        .join('   '),
    );
    return {
      label: caption(labels[i], ['Train', 'Validation', 'Test'][i], 'cyan'),
      cases: place(
        column(
          ids.map((id) => mono(id, { size: 34 })),
          { gap: 'tight' },
        ),
        lanes[i],
      ),
      count: caption(
        counts[i],
        rows.length + ' photos  /  ' + cases.length + (cases.length === 1 ? ' case' : ' cases'),
        'yellow',
        37,
      ),
    };
  });
  const fileTotal = caption(foot, '11 photo IDs     •     9 physical parcels', 'dim', 38);
  s.add(
    heading(c.title),
    bands.map((b) => [b.label, b.cases]),
  );
  c.show(
    'counts',
    bands.map((b) => b.count),
    { after: true },
  );
  c.show('total', fileTotal, { after: true });

  const track = body.inset('loose');
  const x = (day) => track.left + ((day - 7) / (15 - 7)) * track.width;
  const y = track.cy;
  const dayLabel = (day) => mono('Day ' + day, { size: 36 }).moveTo([x(day), y + 54]);
  const ticks = [8, 10, 13, 14].map((day) => dayLabel(day));
  const events = [
    mono('View A', { size: 36, color: 'cyan' }).moveTo([x(8), y - 67]),
    mono('View B', { size: 36, color: 'cyan' }).moveTo([x(13), y - 67]),
  ];
  const cutoff = line([x(10), track.top], [x(10), y + 10], { stroke: 'yellow', width: 5 });
  const mark = (day, color) => dot(16, color).moveTo([x(day), y]);
  const futureLabel = mono('Label', { size: 36, color: 'pink' }).moveTo([x(14), y - 67]);
  const policy = caption(
    head,
    'One new parcel    •    Split boundary and training cutoff on day 10',
    'ink',
    40,
  );
  const ask = caption(
    subtotal,
    'Where do the views belong? Can training use the day-14 label?',
    'yellow',
    40,
  );
  const quarantine = caption(subtotal, 'Quarantine both views of the parcel.', 'yellow', 40);
  c.swap(
    'fresh',
    [bands.map((b) => [b.label, b.cases, b.count]), fileTotal],
    [
      policy,
      line([x(7), y], [x(15), y], { stroke: 'grid', width: 5 }),
      cutoff,
      ticks,
      events,
      mark(8, 'cyan'),
      mark(13, 'cyan'),
    ],
  );
  c.show('late', [futureLabel, mark(14, 'pink'), ask]);
  c.swap('quarantine', ask, quarantine, { after: true });
  c.show('exclude', caption(foot, 'Use only labels available by day 10.', 'pink', 40), {
    after: true,
  });
}
