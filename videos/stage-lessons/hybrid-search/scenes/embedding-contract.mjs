import {
  arrow,
  axes,
  column,
  dynamic,
  fade,
  par,
  group,
  indicate,
  place,
  table,
  tokens,
} from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { frame } from '../parts.mjs';
import { coordinateGeneration } from '../../../films/hybrid-search/model.mjs';
export default function contract(s, c) {
  const f = frame(c);
  const [left, right] = f.body.columns([1, 1.5], 'loose');
  const manifest = place(
    table(
      [
        { key: 'field' },
        { key: 'query', sample: '256 wordpieces' },
        { key: 'passage', sample: '256 wordpieces' },
      ],
      [
        { id: 'encoder', field: 'checkpoint', query: 'paired', passage: 'paired' },
        { id: 'pool', field: 'pooling', query: 'CLS', passage: 'CLS' },
        { id: 'dim', field: 'width', query: 768, passage: 768 },
        { id: 'score', field: 'score', query: 'inner product', passage: 'inner product' },
        { id: 'limit', field: 'input limit', query: 'configured', passage: 'configured' },
        { id: 'generation', field: 'generation', query: 'v1', passage: 'v1' },
      ],
      { width: right.width, size: 34, leading: 1.65 },
    ),
    right,
  );
  const vectors = place(
    column(
      [
        tokens(['query', 'encoder'], { size: 34 }),
        tokens(['passage', 'encoder'], { size: 34 }),
        note('offline passages · live query'),
      ],
      { gap: 'loose' },
    ),
    left,
  );
  const metric = place(label('Dot product also changes with length', { color: 'yellow' }), f.foot);
  const [queryRegion, returnsRegion] = left.rows([1.4, 4.2], 'normal');
  const miniQuery = place(
    column(
      [
        note('MiniLM fixture · paraphrase'),
        label('refresh expired machine', { size: 34 }),
        label('credential', { size: 34 }),
      ],
      { gap: 'tight' },
    ),
    queryRegion,
  );
  const codeQuery = place(
    column([note('MiniLM fixture · bare code'), mono('KROT-14', { color: 'pink' })], {
      gap: 'tight',
    }),
    queryRegion,
  );
  // These are the supplied article fixture's reported scores, not a new model run.
  const ids = ['key', 'session', 'audit', 'cert', 'retire', 'schedule'];
  const names = [
    'Key rule · KROT-14',
    'Session rule',
    'Audit note',
    'CERT-14',
    'KROT-41',
    'KROT-13',
  ];
  const paraphraseScores = [0.43, 0.33, 0.27, 0.55, 0.52, 0.31];
  const codeScores = [0.36, -0.03, 0.03, 0.14, 0.25, 0.39];
  const returned = place(
    table(
      [
        { key: 'record', label: 'Fixture records' },
        { key: 'score', label: 'cosine' },
      ],
      ids.map((id, i) => ({
        id,
        record: names[i],
        score: i < 3 ? paraphraseScores[i].toFixed(2) : '?',
      })),
      { width: left.width, size: 34, leading: 1.55 },
    ),
    returnsRegion,
  );
  ids.slice(3).forEach((id) => returned.row(id).opacity(0));
  const [prefixRegion, storedRegion] = left.rows([1.5, 2], 'loose');
  const prefix = place(
    column(
      [note('Token limit: 256 wordpieces'), tokens(['prefix', '|', 'risk', '≤48h'], { size: 34 })],
      { gap: 'normal' },
    ),
    prefixRegion,
  );
  const prefixTokens = prefix.nodes[1];
  const stored = place(
    table(
      ['record', 'vector', 'generation'],
      [
        { id: 'key', record: 'Key rule', vector: 'stored v1', generation: 'v1' },
        { id: 'session', record: 'Session', vector: 'stored v1', generation: 'v1' },
      ],
      { width: left.width, size: 34, leading: 2 },
    ),
    storedRegion,
  );
  const truncation = place(
    label('Only the retained prefix affects the vector', { color: 'red' }),
    f.foot,
  );
  const rotationUnit = Math.min((left.width - 100) / 2.4, (f.body.height - 120) / 1.4);
  const ax = place(
    axes({
      x: [-1.2, 1.2],
      y: [-0.2, 1.2],
      width: rotationUnit * 2.4,
      height: rotationUnit * 1.4,
      xTicks: [-1, 0, 1],
      yTicks: [0, 1],
      labelSize: 34,
      xStep: 1,
      yStep: 1,
      grid: true,
    }),
    left,
  );
  const q = s.value(0),
    p = s.value(0),
    known = s.value(0);
  const drawing = dynamic(() => {
    const m = coordinateGeneration(q.value, p.value);
    return group(
      arrow(ax.world(0, 0), ax.world(...m.passages[0]), { stroke: 'green', width: 10, pad: 0 }),
      arrow(ax.world(0, 0), ax.world(...m.passages[1]), { stroke: 'blue', width: 8, pad: 0 }),
      arrow(ax.world(0, 0), ax.world(...m.query), { stroke: 'pink', width: 4, pad: 0 }),
    );
  });
  const scores = dynamic(() => {
    const m = coordinateGeneration(q.value, p.value);
    const block = place(
      column(
        [
          label('Supplied unit-vector worksheet'),
          label('Key rule', { color: 'green' }),
          mono(known.value > 0.5 ? m.scores[0].toFixed(0) : '?'),
          label('Session rule', { color: 'blue' }),
          mono(known.value > 0.5 ? m.scores[1].toFixed(0) : '?'),
          note(
            Math.abs(q.value - p.value) < 0.001
              ? 'pink: query · matched generations'
              : 'pink: query · mismatched generations',
            { color: Math.abs(q.value - p.value) < 0.001 ? 'dim' : 'red' },
          ),
        ],
        { gap: 'normal' },
      ),
      right,
    );
    return group(...block.nodes);
  });
  s.add(f.title, manifest, vectors);
  c.take(f.shelf.nodes);
  c.show('dense-metric', metric);
  c.swap(1, vectors, [miniQuery, returned]);
  c.hide(1, metric);
  c.onBeat(1, () =>
    s.play(
      manifest.setCell('encoder', 'query', 'MiniLM'),
      manifest.setCell('encoder', 'passage', 'MiniLM'),
      manifest.setCell('dim', 'query', 384),
      manifest.setCell('dim', 'passage', 384),
      manifest.setCell('pool', 'query', 'mean'),
      manifest.setCell('pool', 'passage', 'mean'),
      manifest.setCell('score', 'query', 'unit dot'),
      manifest.setCell('score', 'passage', 'unit dot'),
    ),
  );
  c.after('mini-input-limit', () =>
    s.play(
      manifest.setCell('limit', 'query', '256 wordpieces'),
      manifest.setCell('limit', 'passage', '256 wordpieces'),
    ),
  );
  c.on('mini-competitors', () =>
    s.play(...ids.slice(3).map((id) => fade(returned.row(id), 1, { duration: 0.3 }))),
  );
  c.after('mini-competitors', () =>
    s.play(
      ...ids.map((id, i) => returned.setCell(id, 'score', paraphraseScores[i].toFixed(2))),
      returned.sort(
        (a, b) => paraphraseScores[ids.indexOf(b.id)] - paraphraseScores[ids.indexOf(a.id)],
        { duration: 1.1 },
      ),
    ),
  );
  c.swap('mini-change-query', miniQuery, codeQuery);
  c.on('mini-change-query', () => s.play(...ids.map((id) => returned.setCell(id, 'score', '?'))));
  c.after('mini-code-rank', () =>
    s.play(
      ...ids.map((id, i) => returned.setCell(id, 'score', codeScores[i].toFixed(2))),
      returned.sort((a, b) => codeScores[ids.indexOf(b.id)] - codeScores[ids.indexOf(a.id)], {
        duration: 1.1,
      }),
    ),
  );
  c.swap('paired-generation', [codeQuery, returned], [prefix, stored, truncation]);
  c.on('paired-generation', () => s.play(prefixTokens.mark([2, 3], 'masked')), 0.5);
  c.on('reembed-generation', () =>
    s.play(
      ...['key', 'session'].flatMap((id) => [
        stored.setCell(id, 'vector', 'fresh v2'),
        stored.setCell(id, 'generation', 'v2'),
      ]),
      manifest.setCell('generation', 'query', 'v2'),
      manifest.setCell('generation', 'passage', 'v2'),
      manifest.light('generation'),
    ),
  );
  c.swapAll('version-worksheet', [ax, drawing, scores], { keep: [f.title, f.shelf.nodes] });
  c.on('version-query-rotate', () =>
    s.play(known.to(0, { duration: 0.1 }), q.to(90, { duration: 1.4 })),
  );
  c.after('version-wrong-rank', () => s.play(known.to(1, { duration: 0.1 })));
  c.after('version-passages-rotate', () =>
    s.play(known.to(0, { duration: 0.1 }), p.to(90, { duration: 1.4 })),
  );
  c.after('version-fixed-rank', () => s.play(known.to(1, { duration: 0.1 })));
}
