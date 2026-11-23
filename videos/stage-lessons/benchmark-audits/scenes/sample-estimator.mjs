import { assertEqual, grid, indicate, place, rect, tex } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { binomialChoose, subsetCoverage } from '../parts.mjs';

export default function estimator(s, c) {
  const [top, main, foot] = area.rows([1, 4.5, 1], 'wide');
  const [left, right] = main.columns([1, 1.2], 'loose');
  const [lhs, rhs] = top.columns(2, 'wide');
  const [expression, product, estimate] = right.rows([1.4, 1, 1], 'wide');
  const heading1 = heading('One problem at a time');
  const population = place(label('Two independent tries at the same problem'), top);
  const pairRows = left.rows(5, 'normal').map((row) => row.columns(2, 'normal'));
  const headers = ['First try', 'Second try'].map((v, i) => place(note(v), pairRows[0][i]));
  const outcomes = [true, false].flatMap((first) => [true, false].map((second) => [first, second]));
  const withPass = outcomes.filter((pair) => pair.some(Boolean)).length;
  const pairs = outcomes.map((pair, i) =>
    pair.map((pass, j) =>
      place(
        label(pass ? 'Pass' : 'Miss', { size: 47, color: pass ? 'green' : 'dim' }),
        pairRows[i + 1][j],
      ),
    ),
  );
  const half = place(label('Each try passes half the time', { size: 40, color: 'cyan' }), product);
  const miss = place(
    label(`Both miss    ${outcomes.length - withPass}/${outcomes.length}`, { size: 44 }),
    expression,
  );
  const hit = place(
    label(`At least one pass    ${withPass}/${outcomes.length}`, { size: 45, color: 'green' }),
    estimate,
  );
  const p = place(label('p = pass probability on each try', { color: 'cyan', size: 39 }), product);
  const general = place(label('Independent tries with the same pass probability'), top);
  const worked = place(note('Four outcomes at left    ·    p = ½, k = 2'), foot);
  const failurePower = place(tex('(1-p)^k', { size: 70 }), expression);
  const trueFormula = place(tex('1-(1-p)^k', { size: 70 }), expression);
  const n = 100,
    passed = 20,
    k = 10;
  const marks = Array.from({ length: n }, (_, i) =>
    rect(44, 44, { fill: i < passed ? 'green' : 'dim', stroke: null }),
  );
  place(grid(marks, { columns: 10, gap: 8 }), left);
  const poolName = place(
    label(`Original pool    c = ${passed} passes    n = ${n}`, { color: 'cyan', size: 37 }),
    lhs,
  );
  const ten = place(label(`Draw k = ${k} indices`), rhs);
  const plugin = place(mono('1 − (1 − 20/100)¹⁰', { size: 48 }), product);
  const biased = place(
    label(`Plug-in   ${(1 - (1 - passed / n) ** k).toFixed(4)}`, { color: 'yellow' }),
    estimate,
  );
  const subset = place(tex('1-\\frac{\\binom{n-c}{k}}{\\binom{n}{k}}', { size: 52 }), expression);
  const firstFactor = place(mono('P(all fail) = 80/100 × …', { size: 36 }), product);
  const secondFactor = place(mono('80/100 × 79/99 × …', { size: 38 }), product);
  const factors = place(mono('80/100 × 79/99 × … × 71/91', { size: 38 }), product);
  const firstMiss = place(note('After one miss    ·    79 failures among 99 remaining'), foot);
  const nineMisses = place(note('After nine misses    ·    71 failures among 91 remaining'), foot);
  const corrected = place(
    label(`Subset estimate   ${subsetCoverage(n, passed, k).toFixed(4)}`, { color: 'green' }),
    estimate,
  );
  const [xPool, yPool] = main.rows(2, 'wide');
  const smallPool = (region, name, pass) => {
    const [title, ids] = region.rows([1, 2], 'tight');
    return [
      place(label('Problem ' + name, { size: 42 }), title),
      ...ids.columns(4, 'wide').map((slot, i) =>
        place(
          mono(name + (i + 1) + (pass ? ' ✓' : ' ×'), {
            size: 44,
            color: pass ? 'green' : 'red',
          }),
          slot,
        ),
      ),
    ];
  };
  const groups = [smallPool(xPool, 'X', true), smallPool(yPool, 'Y', false)];
  const ask = place(
    label('Can an X solution count on a request for Y?', { color: 'yellow' }),
    foot,
  );
  const each = place(label('X   6/6 pairs contain a pass      Y   0/6'), top);
  const average = place(mono('Mean = (1 + 0) / 2 = 0.500', { color: 'green' }), foot);
  const mixed = Array.from({ length: 16 }, (_, i) =>
    mono('X' + (1 + Math.floor(i / 4)) + ' · Y' + (1 + (i % 4)), { size: 35, color: 'red' }),
  );
  place(grid(mixed, { columns: 4, gap: 'wide' }), left);
  const impossible = place(label('Cross-problem pairs', { color: 'red' }), lhs);
  const six = binomialChoose(4, 2),
    all = binomialChoose(8, 2);
  assertEqual(six * 2 + mixed.length, all, 'pairs in pooled example');
  const wrong = place(
    mono(`(${six} + ${mixed.length}) / ${all} = ${subsetCoverage(8, 4, 2).toFixed(3)}`, {
      color: 'red',
    }),
    right,
  );
  s.add(heading1, population, headers);
  c.show('two-tries', [pairs, half]);
  c.on('both-miss', () => s.play(indicate(pairs.at(-1), { scale: 1, color: 'yellow' })));
  c.show('both-miss', miss, { after: true });
  c.show('three-pass', hit, { after: true });
  c.swap('true-rate', [population, half], [general, p, worked]);
  c.swap('all-fail', miss, failurePower);
  c.swap('at-least-one', failurePower, trueFormula);
  c.swap(
    'observed-pool',
    [general, p, hit, worked, headers, pairs],
    [poolName, ten, marks, plugin],
  );
  c.show('plug-estimate', biased, { after: true });
  c.swap('without-replacement', [trueFormula, plugin, biased], [subset, firstFactor]);
  c.hide('second-draw', marks.at(-1));
  c.swap('second-draw', firstFactor, [secondFactor, firstMiss]);
  c.hide('last-draw', marks.slice(n - k + 1, -1));
  c.swap('last-draw', [secondFactor, firstMiss], [factors, nineMisses]);
  c.show('subset-estimate', corrected, { after: true });
  c.swapAll('two-problems', groups, { keep: [heading1] });
  c.show('mix-ask', ask);
  c.hide('own-pairs', ask);
  c.show('own-pairs', each, { after: true });
  c.show('mean-score', average, { after: true });
  c.swap('pooled-pairs', [groups, each], [mixed, impossible]);
  c.show('bad-pool', wrong, { after: true });
}
