import { assertEqual, column, indicate, place } from 'vizmatic/stage';
import { chip, heading, label, mono, note, tint } from '../../kit-narrated.mjs';
import { reviewMatrix } from '../../../films/active-labeling/fixtures.mjs';
import { cohenKappa } from '../../../films/active-labeling/model.mjs';
import { footer, picture, reviewerMatrix, sourceBand } from '../parts.mjs';

export default function reviewerAgreement(s, c) {
  const names = ['A', 'B', 'Tie'];
  const stats = cohenKappa(reviewMatrix);
  // Reconstruct two illustrative ballots that are already in the aggregate.
  const initial = reviewMatrix.map((r) => r.slice());
  initial[0][0]--;
  initial[0][1]--;
  assertEqual(cohenKappa(initial).total, stats.total - 2, 'cases before the two ballots');
  const matches = reviewMatrix.map((r, i) => r[i]);
  const totalMatches = matches.reduce((a, b) => a + b, 0);
  const rows = reviewMatrix.map((r) => r.reduce((a, b) => a + b, 0));
  const cols = names.map((_, j) => reviewMatrix.reduce((a, r) => a + r[j], 0));
  const numerator = rows.reduce((a, n, i) => a + n * cols[i], 0);
  const denominator = stats.total ** 2;
  const [left, right] = picture.columns([1.1, 1], 'loose');
  const [axis, mainTable, bottomTotals] = left.rows([1, 5.7, 0.8], 'normal');
  const [matrixArea, rightTotals] = mainTable.columns([6, 1], 'normal');
  const prior = reviewerMatrix(matrixArea, initial, names);
  const full = reviewerMatrix(matrixArea, reviewMatrix, names);
  const rowSlots = rightTotals.rows(4, 'normal');
  const colSlots = bottomTotals.columns([6, 1], 'normal')[0].columns(4, 'normal');
  const marginals = [
    place(note('Total'), rowSlots[0]),
    place(note('Total'), colSlots[0]),
    ...rows.map((n, i) => place(mono(String(n), { size: 34, color: 'blue' }), rowSlots[i + 1])),
    ...cols.map((n, i) => place(mono(String(n), { size: 34, color: 'blue' }), colSlots[i + 1])),
  ];
  const diag = [full.cells[0][0], prior.cells[1][1], prior.cells[2][2]];
  const splits = prior.cells.flatMap((r, i) =>
    r.flatMap((v, j) => (i === j ? [] : [i === 0 && j === 1 ? full.cells[0][1] : v])),
  );
  const [pairRow, ballots, computed, result] = right.rows([1, 2, 2, 2], 'normal');
  const [one, two] = ballots.columns(2, 'wide');
  const ballot = (region, who, choice) =>
    place(
      column([note(who), chip(choice, { color: 'blue', size: 45 })], { gap: 'normal' }),
      region,
    );
  const caseName = (n) => place(label('Case ' + n), pairRow);
  const first = {
    id: caseName(stats.total - 1),
    one: ballot(one, 'Reviewer 1', 'A'),
    two: ballot(two, 'Reviewer 2', 'A'),
  };
  const last = {
    id: caseName(stats.total),
    one: ballot(one, 'Reviewer 1', 'A'),
    two: ballot(two, 'Reviewer 2', 'B'),
  };
  const countAt = (n) =>
    place(mono(n + ' cases counted', { size: 32, color: 'cyan' }), sourceBand, 'right');
  const count = [stats.total - 2, stats.total - 1, stats.total].map(countAt);
  const cellPrompt = place(label('Which cell gets case 120?', { color: 'yellow' }), computed);
  const diagonal = place(mono(matches.join(' + '), { size: 36, color: 'green' }), ballots);
  const obs = place(
    mono(matches.join(' + ') + ' = ' + totalMatches, { size: 36, color: 'green' }),
    ballots,
  );
  const observed = place(
    mono(totalMatches + ' / ' + stats.total + ' ≈ ' + stats.observed.toFixed(3), {
      size: 36,
      color: 'green',
    }),
    ballots,
  );
  const chanceHead = place(note('Chance agreement from each reviewer’s label counts'), pairRow);
  const productArea = ballots.rows(3, 'tight');
  const terms = names.map((n, i) =>
    place(mono(n + '   ' + rows[i] + ' × ' + cols[i], { size: 32, color: 'blue' }), productArea[i]),
  );
  const chance = place(
    mono(numerator + ' / ' + denominator + ' ≈ ' + stats.expected.toFixed(3), {
      size: 34,
      color: 'blue',
    }),
    computed,
  );
  const exact = place(
    column([note('Cohen’s kappa'), mono('(observed − chance) / (1 − chance)', { size: 30 })], {
      gap: 'tight',
    }),
    pairRow,
  );
  const obsTerm = place(
    mono('observed   ' + totalMatches + '/' + stats.total, { size: 36, color: 'green' }),
    ballots,
  );
  const kappa = place(mono('κ ≈ ' + stats.kappa.toFixed(3), { size: 52, color: 'yellow' }), result);
  const gate = place(note('Local agreement threshold   0.65'), footer);
  const queue = place(
    label(stats.disagreements + ' disagreements to inspect', { color: 'yellow' }),
    footer,
  );
  s.add(
    heading(c.title),
    place(note('Independent choices before discussion'), sourceBand, 'left'),
    place(note('Rows  ·  reviewer 1       Columns  ·  reviewer 2'), axis),
    prior.nodes,
    first.id,
    count[0],
  );
  c.show('ballot-one', first.one);
  c.show('ballot-two', first.two);
  c.swap('match-cell', [prior.cells[0][0], count[0]], [full.cells[0][0], count[1]], {
    after: true,
  });
  c.after('match-cell', () => s.play(tint(full.cells[0][0], 'green')), 0.4);
  c.swap('next-case', [first.id, first.one, first.two], last.id);
  c.show('different-one', last.one);
  c.show('different-two', last.two);
  c.show('ask-cell', cellPrompt);
  c.swap('split-cell', [prior.cells[0][1], count[1], cellPrompt], [full.cells[0][1], count[2]], {
    after: true,
  });
  c.after('split-cell', () => s.play(tint(full.cells[0][1], 'yellow')), 0.4);
  c.on('match-sum', () => s.play(...diag.map((n) => tint(n, 'green'))));
  c.swap('match-sum', [last.id, last.one, last.two], diagonal);
  c.swap('observed-count', diagonal, obs, { after: true });
  c.swap('observed-rate', obs, observed, { after: true });
  c.swap('marginals', observed, [chanceHead, marginals]);
  c.show('a-product', terms[0]);
  c.show('other-products', terms.slice(1));
  c.show('chance-result', chance, { after: true });
  c.swap('kappa-rule', [chanceHead, terms], [exact, obsTerm]);
  c.show('kappa-result', kappa, { after: true });
  c.show('local-gate', gate, { after: true });
  c.swap('triage', gate, queue, { after: true });
  c.after('triage', () => s.play(...splits.map((n) => tint(n, 'yellow'))));
  c.on('sample-matches', () => s.play(indicate(diag, { color: 'green', scale: 1 })));
}
