import { arrow, assertEqual, boxOf, place } from 'vizmatic/stage';
import { area, heading, label, mono, namedBox, note, tint } from '../../kit-narrated.mjs';
import {
  WIDTH_TWO,
  WIDTH_THREE,
  beamSearch,
  rawWinner,
} from '../../../films/beam-search/arithmetic.mjs';

export default function width(s, c) {
  const [header, body, footer] = area.inset('normal').rows([1, 5.8, 1.2], 'normal');
  const sides = body.columns(2, 'loose');
  const title = heading(c.title);
  const step = WIDTH_TWO.history[1];
  const edge = (source, target) =>
    arrow(boxOf(source).point('right'), boxOf(target).point('left'), {
      stroke: 'dim',
      width: 3,
      pad: 9,
    });
  const groups = WIDTH_TWO.history[0].active.map((parent, i) => {
    const [origin, pool] = sides[i].columns([0.9, 1.2], 'wide');
    const root = place(
      namedBox('Mia ' + parent.text, { width: 270, height: 92, size: 35 }),
      origin,
    );
    const entries = step.expansions.filter((x) => x.parent === parent.text);
    const cells = pool.rows(entries.length, 'normal');
    const leaves = entries.map((x, k) =>
      place(
        namedBox(x.token, {
          width: 272,
          height: 108,
          sub: 'joint ' + x.probability.toFixed(4),
          subSize: 29,
        }),
        cells[k],
      ),
    );
    return { root, leaves, entries, edges: leaves.map((leaf) => edge(root, leaf)) };
  });
  const active = groups.flatMap((g) => g.leaves.filter((_, j) => g.entries[j].status === 'active'));
  const finished = groups.flatMap((g) => g.leaves.filter((_, j) => g.entries[j].completed));
  const input = place(label('Second position     •     width 2'), header);
  const question = place(label('How many extensions will the search score here?'), footer);
  const scored = place(
    label(`${step.expansions.length} extensions scored`, { color: 'cyan' }),
    footer,
  );
  const count = place(
    label(
      `${step.expansions.length} scored     •     ${active.length} unfinished paths retained     •     ${finished.length} completed`,
      { size: 40 },
    ),
    footer,
  );
  const cacheHead = place(label('Same two prefixes     •     same six extensions'), header);
  const diagrams = ['Copied prompt state', 'Shared prompt state'].map((name, i) => {
    const [nameRow, diagram] = sides[i].rows([1, 4], 'normal');
    const [left, right] = diagram.columns(2, 'wide');
    const leftCells = i === 0 ? left.rows(2, 'wide') : [left];
    const copies = leftCells.map((cell) =>
      place(namedBox('Mia', { width: 230, height: 82, color: 'cyan' }), cell),
    );
    const suffix = WIDTH_TWO.history[0].active.map((x, k) =>
      place(namedBox(x.token, { width: 235, height: 82 }), right.rows(2, 'wide')[k]),
    );
    return [
      place(label(name, { size: 38 }), nameRow),
      ...copies,
      ...suffix,
      ...suffix.map((n, j) => edge(copies[i === 0 ? j : 0], n)),
    ];
  });
  const tableHead = place(label('Candidate extensions scored at each generated position'), header);
  const columns = body
    .columns([1, 1, 1, 1, 1, 1, 1.75], 'normal')
    .map((region) => region.rows(4, 'normal'));
  const tableLabels = ['Beam', 'Step 1', 'Step 2', 'Step 3', 'Step 4', 'Total', 'Raw winner'].map(
    (name, j) => place(note(name), columns[j][0]),
  );
  const runs = [beamSearch(1), WIDTH_TWO, WIDTH_THREE];
  const table = runs.map((run, i) => {
    const costs = run.history.map((h) => h.expansions.length);
    return {
      counts: [
        place(label('Width ' + run.width, { size: 38 }), columns[0][i + 1]),
        ...costs.map((n, j) => place(mono(String(n), { size: 44 }), columns[j + 1][i + 1])),
      ],
      total: place(
        mono(String(costs.reduce((a, b) => a + b, 0)), { size: 46, color: 'yellow' }),
        columns[5][i + 1],
      ),
      winner: place(label(rawWinner(run).text, { size: 36 }), columns[6][i + 1]),
    };
  });
  assertEqual(active.length + finished.length, 4, 'two retained unfinished plus two completed');
  s.add(
    title,
    input,
    groups.map((g) => g.root),
  );
  c.show('width-children', [groups.map((g) => [g.edges, g.leaves]), question]);
  c.swap('six-scored', question, scored, { after: true });
  c.after('two-carried', () => s.play(...active.map((node) => tint(node, 'yellow'))));
  c.after('file-eos', () => s.play(...finished.map((node) => tint(node, 'cyan'))));
  c.swap('file-eos', scored, count, { after: true });
  c.swapAll('copied-prompt', [cacheHead, diagrams[0]], { keep: [title, count] });
  c.show('shared-prompt', diagrams[1]);
  c.swapAll('count-horizon', [tableHead, tableLabels, table.map((r) => r.counts)], {
    keep: [title],
  });
  c.show(
    'all-counts',
    table.map((r) => r.total),
    { after: true },
  );
  c.show(
    'width-winner',
    table.map((r) => r.winner),
    { after: true },
  );
}
