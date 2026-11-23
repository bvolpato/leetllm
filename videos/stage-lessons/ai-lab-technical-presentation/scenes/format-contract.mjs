import { addTitle, work, route, ledger } from '../parts.mjs';
import { assertEqual } from 'vizmatic/stage';

export default function formatContract(s, c) {
  addTitle(s, c);
  const [flow, record] = work.rows([1, 1.5]);
  const study = { baseline: 24, candidate: 22, queries: 40 };
  const points = (100 * (study.candidate - study.baseline)) / study.queries;
  assertEqual(points, -5, 'matched research example');
  const path = route(flow, ['Project files', 'Role prompt', 'Disclosure', 'Talk'], { lanes: 2 });
  const fields = ledger(
    record,
    ['Artifact', 'Content', 'Use'],
    [
      {
        id: 'public',
        Artifact: 'Public experiment',
        Content: 'Matched baseline',
        Use: 'Check the prompt',
      },
      {
        id: 'private',
        Artifact: 'Deployment trace',
        Content: 'Tenant identifier',
        Use: 'Check disclosure',
      },
    ],
  );
  s.add(path, fields);
  c.on('prompt', () => s.play(path.put({ id: 'Study', lane: 0, color: 'blue' })));
  c.on('materials', () => s.play(path.move('Study', 'Role prompt')));
  c.on('method', () =>
    s.play(
      fields.light('public'),
      fields.setCell(
        'public',
        'Content',
        study.baseline + '/' + study.queries + ' → ' + study.candidate + '/' + study.queries,
      ),
    ),
  );
  c.after('negative', () =>
    s.play(
      fields.setCell('public', 'Use', points + ' percentage points'),
      path.move('Study', 'Disclosure'),
    ),
  );
  c.on('project', () =>
    s.play(path.move('Study', 'Talk'), fields.setCell('public', 'Artifact', 'Research talk')),
  );
  c.on('private', () =>
    s.play(
      path.put({ id: 'Trace', lane: 1, color: 'cyan', at: 'Disclosure' }),
      fields.light('private'),
    ),
  );
  c.after('redact', () => s.play(fields.setCell('private', 'Content', 'Identifier removed')));
  c.after('upload', () =>
    s.play(path.stop('Trace'), fields.setCell('private', 'Use', 'Upload unapproved')),
  );
  c.clear(path.laneNodes, 0.7, 0.16);
  c.on('policy', () => s.play(fields.light('private', 'Use')));
}
