import { graph, indicate, pipeline, place, seq, table, zone } from 'vizmatic/stage';
import { heading, label } from '../../kit-narrated.mjs';
import { carryIdentity, evidenceFrame } from '../parts.mjs';
import { filteredRecallFixture } from '../../../films/production-retrieval/model.mjs';

export default function filteringContract(s, c) {
  const f = evidenceFrame(c, { page: false });
  const [rankRoom, boundaryRoom] = f.body.columns([3, 2], 'loose');
  const data = filteredRecallFixture();
  const ranking = place(
    table(
      [
        'passage',
        'distance',
        'scope',
        { key: 'global', label: 'Global cut', marks: true, sample: 'removed' },
        { key: 'allowed', label: 'Allowed cut', marks: true, sample: 'selected' },
      ],
      data.records.map((r) => ({
        id: r.id,
        passage: r.id,
        distance: r.distance.toFixed(1),
        scope: r.allowed ? 'permitted' : 'restricted',
        global: '·',
        allowed: '·',
      })),
      { width: rankRoom.width, size: 35, leading: 1.65 },
    ),
    rankRoom,
  );
  const neighbors = graph(
    [
      { id: 'entry', label: 'Q', note: 'entry', color: 'blue', radius: 44 },
      { id: 'R1', label: 'R1', note: 'restricted', color: 'red', radius: 44 },
      { id: 'P1', label: 'P1', note: 'permitted', color: 'green', radius: 44 },
    ],
    [
      { from: 'entry', to: 'R1' },
      { from: 'R1', to: 'P1' },
    ],
    {
      direction: 'LR',
      width: boundaryRoom.width - 130,
      fit: true,
      labelSize: 37,
      valueSize: 36,
      token: 'entry',
      tokenColor: 'yellow',
    },
  );
  const trusted = place(
    zone(neighbors, {
      title: 'HNSW · inside trusted search',
      titleSize: 36,
      padding: 24,
      color: 'dim',
      borderWidth: 3,
    }),
    boundaryRoom,
  );
  const payload = place(
    pipeline(['Index', 'Scope', 'Reranker'], {
      width: boundaryRoom.width - 30,
      size: 34,
      lanes: 2,
      gates: true,
    }),
    boundaryRoom,
  );
  const count = (words) => place(label(words, { color: 'yellow' }), f.foot);
  const one = count('Global cut   ·   ' + data.redacted.length + ' permitted passage');
  const three = count(
    'Global cut   ·   ' +
      data.redacted.length +
      '      /      Allowed cut   ·   ' +
      data.allowed.length,
  );
  const set = (record, col, value, state) =>
    ranking.setCell(record.id, col, state ? { value, state } : value, { duration: 0.4 });
  const restricted = data.global.filter((record) => !record.allowed);

  s.add(heading(c.title), f.nodes, ranking, trusted);
  carryIdentity(c, f);
  c.on('pr-graph', () => s.play(indicate(trusted.frame, { scale: 1, color: 'cyan' })));
  c.on('pr-traverse', () =>
    s.play(seq(neighbors.go('R1', { duration: 0.9 }), neighbors.go('P1', { duration: 0.9 }))),
  );
  c.on('pr-globalcut', () => s.play(...data.global.map((r) => set(r, 'global', 'selected'))));
  c.on('pr-trim', () =>
    s.play(
      ...restricted.map((r) => set(r, 'global', 'removed', 'fail')),
      ...data.redacted.map((r) => set(r, 'global', 'selected', 'pass')),
    ),
  );
  c.show('pr-trim', one, { after: true });
  c.on('pr-allowedcut', () =>
    s.play(
      ...restricted.map((r) => set(r, 'allowed', 'excluded', 'fail')),
      seq(...data.allowed.map((r) => set(r, 'allowed', 'selected', 'pass'))),
    ),
  );
  c.swap('pr-allowedcut', one, three, { after: true });
  c.hide('pr-scope', three);
  c.swap('pr-scope', trusted, payload);
  c.on('pr-restricted', () =>
    s.play(
      seq(
        payload.put({ id: 'R1', lane: 0, color: 'red' }, { duration: 0.25 }),
        payload.move('R1', 'Scope', { duration: 0.55 }),
        payload.stop('R1', { duration: 0.3 }),
      ),
    ),
  );
  c.on('pr-permitted', () =>
    s.play(
      seq(
        payload.put({ id: 'P1', lane: 1, color: 'green' }, { duration: 0.25 }),
        payload.move('P1', 'Scope', { duration: 0.45 }),
        payload.pass('P1', { duration: 0.3 }),
        payload.move('P1', 'Reranker', { duration: 0.6 }),
      ),
    ),
  );
  c.clear(payload.items, 0.8, 0.01);
  c.clear(payload.rails, 0.7, 0.2);
}
