import { boxOf, column, group, line, place, rect, row, table } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../kit-narrated.mjs';

export function libraryBook(name, color, { width = 330, height = 140, code } = {}) {
  const frame = rect(width, height, { fill: 'surface', stroke: color, width: 3, radius: 8 });
  const inside = place(
    column([label(name, { color }), note(code)], { gap: 'tight' }),
    boxOf(frame),
  );
  const b = boxOf(frame);
  const x = b.left + 16;
  const spine = line([x, b.top + 16], [x, b.bottom - 16], { stroke: color, width: 3 });
  return group(frame, spine, ...inside.nodes);
}

export function frame(c, { shelfVisible = true } = {}) {
  const [head, body, foot] = area.rows(shelfVisible ? [1.5, 6, 0.6] : [0.6, 6.9, 0.6], 'normal');
  const books = shelfVisible && [
    libraryBook('Key rule', 'green', { code: 'KROT-14 · current' }),
    libraryBook('Session rule', 'blue', { code: 'current · permitted' }),
    libraryBook('Audit note', 'blue', { code: 'current · permitted' }),
  ];
  const shelf = books ? { nodes: place(row(books, { gap: 'loose' }), head) } : null;
  return { title: heading(c.title), shelf, head, body, foot };
}

// The same excerpt opens and closes Luna's search. Keep its conditions with their units.
export function keyPage(region) {
  const page = rect(region.width - 20, 482, {
    fill: 'surface',
    stroke: 'green',
    width: 3,
    radius: 12,
  });
  place(page, region);
  const inside = boxOf(page).inset(42);
  const [header, id, excerpt] = inside.rows([0.75, 1.15, 2.7], 'tight');
  const name = place(
    note('EU support    /    current key rule', { size: 33, color: 'green' }),
    header,
    'left',
  );
  const code = place(mono('KROT-14', { size: 72 }), id, 'left');
  const lines = place(
    column(
      [
        label('Stale service-account keys', { size: 43 }),
        label('Automated rotation up to 14 days', { size: 37 }),
        label('Risk signal at most 48 hours old', { size: 37 }),
      ],
      { gap: 'normal', align: 'left' },
    ),
    excerpt,
    'left',
  );
  return group(page, name, code, ...lines.nodes);
}

export function postingIndex(region) {
  return place(
    table(
      [
        { key: 'term', label: 'Indexed term' },
        { key: 'records', label: 'Posting list' },
      ],
      [
        { id: 'code', term: 'krot-14', records: 'Key' },
        { id: 'idle', term: 'idle', records: 'Session' },
        { id: 'audit', term: 'audit-log', records: 'Audit' },
        { id: 'rule', term: 'rule', records: 'Key, Audit' },
      ],
      { width: region.width, size: 36, leading: 2.3 },
    ),
    region,
  );
}
