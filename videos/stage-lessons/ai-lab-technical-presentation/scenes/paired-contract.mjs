import {
  PAIRED,
  addTitle,
  work,
  caption,
  ledger,
  pairedBench,
  readout,
} from '../parts.mjs';
import { place, unitChart, recolor, rect } from 'vizmatic/stage';

export default function pairedContract(s, c) {
  addTitle(s, c);
  const [rank, proof] = work.rows([1.1, 2.3]);
  const [row, name] = rank.columns([2, 1]);
  const results = place(
    unitChart([{ count: 5, color: 'gridStrong' }], {
      columns: 5,
      cell: 85,
      gap: 20,
      shape: 'square',
    }),
    row,
  );
  const outside = place(
    rect(85, 85, { stroke: 'green', fill: null, width: 5, radius: 12 }),
    row,
    'right',
  );

  const top = caption(name, 'Top five results', 'dim');
  const data = ledger(
    proof,
    ['Input or outcome', 'What stays paired'],
    [
      {
        id: 'q',
        'Input or outcome': 'Query and labels',
        'What stays paired': 'Text and relevant runbooks',
      },
      {
        id: 'corpus',
        'Input or outcome': 'Corpus and tenant',
        'What stays paired': 'Revision and permissions',
      },
      {
        id: 'build',
        'Input or outcome': 'Retriever and index',
        'What stays paired': 'Record every build',
      },
    ],
  );
  const hit = caption(name, 'Hit = 1', 'green');
  const one = caption(name, 'Recall = 1 / 1', 'green');
  const two = caption(name, 'Recall = 1 / 2', 'yellow');
  const [field, foot] = work.rows([4, 1]);
  const paired = pairedBench(field);
  const counts = paired.labels.map((_, k) => paired.counted(k));
  const focus = paired.cells.map((cell) =>
    place(
      rect(cell.width, cell.height, { fill: null, stroke: 'yellow', width: 5, radius: 16 }),
      cell,
    ),
  );
  const [oldSlot, newSlot] = paired.input.rows(2, 'normal');
  const baseline = readout(oldSlot, String(PAIRED.baselineHits), 'baseline hits', 'blue');
  const candidate = readout(newSlot, String(PAIRED.candidateHits), 'candidate hits', 'cyan');
  const oldSum = caption(foot, 'Baseline hits    =    both hit    +    lost hit', 'yellow');
  const newSum = caption(foot, 'Candidate hits    =    both hit    +    new hit', 'yellow');
  const losses = caption(foot, 'Inspect the eight queries that lost their runbook.', 'pink');
  s.add(results, top, data);
  c.after('top', () => s.play(recolor(results.marks[4], 'green')));
  c.swap('top', top, hit, { after: true });
  c.swap('recall', hit, one);
  c.show('many', outside, { after: true });
  c.swap('many', one, two, { after: true });
  const oneAgain = caption(name, 'One label per query', 'dim', 35);
  c.swap(1, [two, outside], oneAgain);
  c.on('freeze', () => s.play(data.light('q')));
  c.on('index', () => s.play(data.light('build')));
  c.on('system', () => s.play(data.setCell('build', 'What stays paired', 'Combined comparison')));
  c.swap('table', [data, results, oneAgain], [paired.frames, paired.marks, counts]);
  c.show('old', [focus[0], focus[1], oldSum]);
  c.show('old', baseline, { after: true });
  c.swap('new', [focus[1], oldSum], [focus[2], newSum]);
  c.show('new', candidate, { after: true });
  c.swap('lost', [focus[0], focus[2], newSum], [focus[1], losses]);
}
