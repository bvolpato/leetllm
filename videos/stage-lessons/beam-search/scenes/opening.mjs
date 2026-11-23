import { arrow, assertEqual, boxOf, column, place } from 'vizmatic/stage';
import { area, heading, label, mono, namedBox, note, tint } from '../../kit-narrated.mjs';
import { WIDTH_TWO } from '../../../films/beam-search/arithmetic.mjs';
import { miaLattice } from '../parts.mjs';

// The second column shows only the strongest child of each retained opening.
const openings = [
  { word: 'create', p: 0.4, child: '.', conditional: 0.2 },
  { word: 'first', p: 0.35, child: 'create', conditional: 0.7 },
  { word: 'revoke', p: 0.25 },
];

export default function opening(s, c) {
  const [legend, body, footer] = area.inset('normal').rows([1, 5, 1.25], 'wide');
  const [rootCol, parentCol, childCol, productCol] = body.columns([1, 1.2, 1.2, 1.35], 'wide');
  const headerCols = legend.columns([1, 1.2, 1.2, 1.35], 'wide');
  const headers = ['Prompt', 'First token', 'Strongest next token', 'Path probability'].map(
    (words, i) => place(note(words), headerCols[i]),
  );
  const root = place(namedBox('You should', { width: 250, height: 88 }), rootCol);
  const children = childCol.rows(3, 'normal');
  const products = productCol.rows(3, 'normal');
  const parents = openings.map(({ word, p }, i) =>
    place(
      namedBox(word, { width: 280, height: 110, sub: p.toFixed(2), subSize: 34 }),
      parentCol.rows(3, 'normal')[i],
    ),
  );
  const tails = openings
    .slice(0, 2)
    .map(({ child, conditional }, i) =>
      place(
        namedBox(child === '.' ? 'period (.)' : child, {
          width: 265,
          height: 110,
          sub: conditional.toFixed(2),
          subSize: 34,
        }),
        children[i],
      ),
    );
  const connect = (a, b) =>
    arrow(boxOf(a).point('right'), boxOf(b).point('left'), { stroke: 'dim', width: 4, pad: 10 });
  const forks = parents.map((parent) => connect(root, parent));
  const steps = tails.map((tail, i) => connect(parents[i], tail));
  const scores = tails.map((_, i) => {
    const { p, conditional } = openings[i];
    return place(
      column(
        [
          mono(`${p.toFixed(2)} × ${conditional.toFixed(2)}`, { size: 32 }),
          label((p * conditional).toFixed(3), { size: 60, color: i ? 'yellow' : 'cyan' }),
        ],
        { align: 'center' },
      ),
      products[i],
    );
  });
  assertEqual(
    openings
      .slice(0, 2)
      .map((x) => (x.p * x.conditional).toFixed(3))
      .join('/'),
    '0.080/0.245',
    'article paths',
  );
  const which = place(label('One opening to keep. Which one?', { size: 42 }), footer);
  const one = place(note('Keep one opening'), footer);
  const two = place(label('Keep two openings. Which path takes the lead?', { size: 42 }), footer);
  const best = place(label('You should first create', { color: 'yellow' }), footer);
  const lattice = miaLattice(WIDTH_TWO);
  const rules = place(
    note('Prompt: Mia     •     4 generated tokens     •     EOS counts'),
    lattice.footer,
  );
  const title = heading(c.title);
  s.add(title, headers, root, forks);
  c.show('opening-row', [parents, which]);
  c.swap('one-kept', which, one, { after: true });
  c.after('one-kept', () => s.play(tint(parents[0], 'cyan')));
  c.show('one-child', [steps[0], tails[0]], { after: true });
  c.show('one-product', scores[0], { after: true });
  c.after('two-kept', () => s.play(tint(parents[1], 'blue'), tint(parents[2], 'dim')));
  c.swap('two-kept', one, two, { after: true });
  c.show('two-child', [steps[1], tails[1]], { after: true });
  c.swap('two-winner', two, best, { after: true });
  c.show('two-product', scores[1], { after: true });
  c.swapAll(
    'mia-rules',
    [lattice.headings, lattice.skeleton, lattice.columns[0].map((e) => e.words), rules],
    { keep: [title] },
  );
  c.keep(lattice.skeleton);
}
