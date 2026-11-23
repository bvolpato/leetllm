import { boxOf, column, place, row, terminal, to } from 'vizmatic/stage';
import { area, chip, label, mono, note } from '../../kit-narrated.mjs';
import { fixturePath, fixtureTable, repositoryContext, rows } from '../parts.mjs';

export default function findFile(s, c) {
  const { main } = repositoryContext(s, c);
  const panes = main.rows([1, 1], 'wide');
  const status = place(terminal([
    { text: 'git status --short -uall', kind: 'command' },
    { text: '?? ' + fixturePath, color: 'yellow' },
  ], { title: 'Original checkout', columns: 61, size: 36, shown: false }), panes[0]);
  const tree = place(terminal([
    { text: 'git ls-tree HEAD -- ' + fixturePath, kind: 'command' },
    { text: '', kind: 'command' },
  ], { title: 'Root of teammate’s clone', columns: 61, size: 36, shown: false }), panes[1]);
  const [records, localBand] = main.rows([5, 3], 'wide');
  const file = place(fixtureTable(rows, records.width), records);
  file.body.opacity(0);
  const [localArea, trackArea] = localBand.columns([1, 1], 'wide');
  const keepLocal = place(
    column(
      [
        label('Keep local', { color: 'pink' }),
        row(
          ['.env', '.venv/', 'cache/'].map((word) => chip(word, { color: 'pink' })),
          { gap: 'normal' },
        ),
      ],
      { gap: 'normal' },
    ),
    localArea,
  );
  const track = place(
    column(
      [
        label('Track', { color: 'green' }),
        chip('fixture + .env.example', { color: 'green' }),
        note('names, empty values'),
      ],
      { gap: 'normal' },
    ),
    trackArea,
  );
  const [jsonHead, jsonArea] = area.rows([1, 5], 'normal');
  const jsonTitle = place(mono('access_requests.jsonl', { size: 34, color: 'cyan' }), jsonHead);
  const jsonRegions = jsonArea.rows(rows.length, 'wide');
  const pieces = rows.map((r, i) => {
    const values = [
      '{"prompt":"',
      r.prompt,
      '","expected":"',
      r.expected,
      '","prediction":"',
      r.prediction,
      '"}',
    ].map((word, j) => mono(word, { size: 26, color: j % 2 ? 'cyan' : 'dim' }).zIndex(2));
    place(row(values, { gap: 'none' }), jsonRegions[i], 'left');
    return values;
  });
  const ids = rows.map((r, i) =>
    mono(r.prompt.match(/\d+/)[0], { size: 34, color: 'cyan' }).moveTo(
      boxOf(pieces[i][1]).point('center'),
    ),
  );
  s.add(status, tree);
  c.onBeat(0, () => s.play(status.type(0, { duration: 0.7 })));
  c.on('untracked-fixture', () => s.play(status.print({ from: 1, to: 1 })));
  c.on('check-head', () => s.play(tree.type(0, { duration: 0.9 })));
  c.on('missing-answer', () => s.play(tree.type(1, { duration: 0.2 })));
  c.hide('fixture-rows', [status, tree]);
  c.show('fixture-rows', [jsonTitle, pieces], { lead: -0.3 });
  c.show('fixture-fields', file, { lead: -1.2 });
  c.hide('fixture-fields', [jsonTitle, pieces.map((p) => [p[0], p[1], p[2], p[4], p[6]])]);
  c.show('fixture-fields', ids, { lead: -0.3 });
  c.on(
    'fixture-fields',
    () =>
      s.play(
        ...rows.flatMap((r, i) => [
          to(
            ids[i],
            (n) => n.moveTo(boxOf(file.cell(String(101 + i), 'id').words).point('center')),
            { duration: 0.8 },
          ),
          ...['expected', 'prediction'].map((key, j) =>
            to(
              pieces[i][3 + 2 * j],
              (n) =>
                n
                  .moveTo(boxOf(file.cell(String(101 + i), key).words).point('center'))
                  .scale(34 / 26),
              { duration: 0.8 },
            ),
          ),
        ]),
      ),
    0.35,
  );
  c.hide('track-fixture', [ids, pieces.map((p) => [p[3], p[5]])], { fade: 0.1 });
  c.on('track-fixture', () => s.play(to(file.body, (n) => n.opacity(1), { duration: 0.3 })));
  c.show('local-files', [keepLocal, track]);
}
