import { column, place, table } from 'vizmatic/stage';
import { area, heading, label, note } from '../../kit-narrated.mjs';
import { keyPage } from '../parts.mjs';

export default function eligible(s, c) {
  const [desk, bottom] = area.rows([5, 1], 'wide');
  const [records, source] = desk.columns([1, 1.1], 'wide');
  const page = keyPage(source);
  const list = place(
    table(
      [
        { key: 'name', label: 'Stored passage' },
        { key: 'status', label: 'For Luna', sample: 'superseded' },
      ],
      [
        { id: 'key', name: 'Key v2', status: 'current' },
        { id: 'session', name: 'Session', status: 'current' },
        { id: 'audit', name: 'Audit', status: 'current' },
        { id: 'old', name: 'Key v1', status: '?' },
        { id: 'admin', name: 'Admin', status: '?' },
      ],
      { width: records.width, size: 36, leading: 2.05 },
    ),
    records,
  );
  const lanes = place(
    column(
      [
        note('IDs released to the rankers'),
        label('Lexical     Key · Session · Audit', { color: 'cyan' }),
        label('Dense       Key · Session · Audit', { color: 'pink' }),
      ],
      { gap: 'wide', align: 'left' },
    ),
    source,
  );
  const date = place(label('EU support grant    ·    27 May 2026', { color: 'dim' }), bottom);
  const fetch = place(
    label('Fetch the passage with the caller’s current grant', { color: 'yellow' }),
    bottom,
  );
  s.add(heading(c.title), list, date, page);
  c.after('old-revision', () => s.play(list.setCell('old', 'status', 'superseded')));
  c.after('restricted-rule', () => s.play(list.setCell('admin', 'status', 'denied')));
  c.swap('shared-corpus', page, lanes);
  c.swap('recheck-access', date, fetch);
}
