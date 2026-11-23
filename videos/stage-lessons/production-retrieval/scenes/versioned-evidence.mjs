import { column, dateLine, fade, indicate, passage, place, seq, table } from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { carryIdentity, CORPUS, EVAL_DATE, evidenceFrame, MOTION } from '../parts.mjs';
import { versionedBundle } from '../../../films/production-retrieval/model.mjs';
export default function versionedEvidence(s, c) {
  const f = evidenceFrame(c);
  const [recordsRoom, lineageRoom, clockRoom, digestRoom] = f.work.rows(
    [2.6, 1.7, 2.8, 1],
    'normal',
  );
  const revisions = CORPUS.filter((r) => r.documentId === 'eu-access');
  const ledger = place(
    table(
      [
        { key: 'record', label: 'source span' },
        { key: 'window', label: 'effective dates' },
        { key: 'route', label: 'request', sample: 'historical only' },
      ],
      revisions.map((r) => ({
        id: r.id,
        record: r.id,
        window: r.from + ' / ' + (r.to ?? 'current'),
        route: { value: 'unchecked', state: 'pending' },
      })),
      { width: f.work.width, size: 29, leading: 2 },
    ),
    recordsRoom,
    'top',
  );
  const lineage = place(
    note('document · parent · locator · version · EU · support:eu'),
    digestRoom,
    'left',
  );
  const historical = place(
    passage(revisions[1].text, {
      width: f.work.width,
      size: 34,
      leading: 1.3,
      title: 'v1 · previous key policy · expired ' + revisions[1].to,
      titleSize: 29,
      color: 'pink',
    }),
    lineageRoom,
    'top left',
  );
  const dates = place(
    dateLine(
      [
        { at: revisions[1].to, label: 'v1 ends', color: 'pink' },
        { at: revisions[0].from, label: 'v2 begins', color: 'cyan' },
        { at: EVAL_DATE, label: 'request', color: 'blue' },
      ],
      { width: f.work.inset('normal').width, scale: 'order', size: 34 },
    ),
    clockRoom,
  );
  const digest = place(
    note('SHA-256: ' + versionedBundle().sourceHash.slice(0, 20) + '…'),
    digestRoom,
    'left',
  );
  const result = place(label('Current request → eu-key-v2', { color: 'yellow' }), f.foot);
  s.add(heading(c.title), f.nodes, ledger, lineage, dates);
  carryIdentity(c, f);
  c.on('parse-spans', () => s.play(f.page.select('automated rotation up to 14 days', MOTION)));
  c.on('preserve-lineage', () => s.play(indicate(lineage, { scale: 1, color: 'yellow' })));
  c.on('current-rule', () => s.play(ledger.light('eu-key-v2'), f.page.select('48 hours', MOTION)));
  c.on('historical-rule', () => s.play(ledger.light('eu-key-v1')));
  c.show('historical-rule', historical);
  c.on('filter-current', () =>
    s.play(
      seq(dates.advance(EVAL_DATE, { duration: 1.2 }), fade(historical, 0.35, { duration: 0.4 })),
      ledger.setCell('eu-key-v2', 'route', { value: 'admitted', state: 'pass' }),
    ),
  );
  c.on('exclude-expired', () =>
    s.play(ledger.setCell('eu-key-v1', 'route', { value: 'historical only', state: 'fail' })),
  );
  c.show('exclude-expired', result, { after: true });
  c.swap('verify-bytes', lineage, digest);
}
