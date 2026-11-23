import { addTitle, work, route, ledger } from '../parts.mjs';

export default function roleBridge(s, c) {
  addTitle(s, c);
  const [main, lower] = work.rows([1, 1.5]);
  const path = route(main, ['Model proposal', 'Tenant check', 'Connector', 'Store']);
  const t = ledger(
    lower,
    ['Artifact', 'Question', 'Evidence'],
    [
      {
        id: 'live',
        Artifact: 'Tool call',
        Question: 'May this tenant read?',
        Evidence: 'Check at runtime',
      },
      {
        id: 'test',
        Artifact: 'Evaluation',
        Question: 'Was access denied?',
        Evidence: 'Inspect test result',
      },
      {
        id: 'policy',
        Artifact: 'Interview tool',
        Question: 'May I use it here?',
        Evidence: 'Check the format',
      },
    ],
  );
  s.add(path, t);
  c.on('model', () => s.play(path.put({ id: 'Call' })));
  c.on('auth', () => s.play(path.move('Call', 'Tenant check'), t.light('live')));
  c.on('deny', () =>
    s.play(path.stop('Call'), t.setCell('live', 'Evidence', 'Denied at boundary')),
  );
  c.on('tests', () => s.play(t.light('test')));
  c.on('retrieval', () =>
    s.play(
      t.setCell('test', 'Artifact', 'Retrieval slice'),
      t.setCell('test', 'Question', 'Which tenants regress?'),
      t.setCell('test', 'Evidence', 'Paired query IDs'),
    ),
  );
  c.on('research', () =>
    s.play(
      t.setCell('test', 'Artifact', 'Controlled trial'),
      t.setCell('test', 'Question', 'Which input changed?'),
      t.setCell('test', 'Evidence', 'Frozen inputs'),
    ),
  );
  c.on('policy', () => s.play(t.light('policy')));
  c.after('upload', () => s.play(t.setCell('policy', 'Evidence', 'Permission required')));
  c.clear(path.laneNodes, 0.7, 0.16);
}
