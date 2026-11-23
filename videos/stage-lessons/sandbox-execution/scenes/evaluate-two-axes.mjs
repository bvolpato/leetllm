// Scene `evaluate-two-axes`: what pass-at-2 says, and what it does not say.
//
// The picture: the five candidates stand on the two sides of a grid, and a cell is a draw of two.
// The ten cells over the diagonal are the pairs: seven have a candidate that passes. At the right
// are the containment probes, which this number does not measure. The back half gives the formula
// its numbers from the grid, then opens the grid to all 25 ordered draws, which is the experiment
// with replacement: 16 of 25.
import {
  assertEqual,
  column,
  grid,
  indicate,
  pictogram,
  place,
  recolor,
  rect,
  row,
  tex,
} from 'vizmatic/stage';
import { passAtK } from '../../../films/sandbox-execution/arithmetic.mjs';
import { CANDIDATE_PAIRS, CANDIDATE_POOL } from '../../../films/sandbox-execution/construction.mjs';
import { runtimeProbe } from '../../../films/sandbox-execution/model.mjs';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, wall } from '../parts.mjs';

export default function evaluateTwoAxes(s, c) {
  const pool = CANDIDATE_POOL;
  const size = pool.length;
  const passes = pool.filter((candidate) => candidate.passed).length;
  const good = CANDIDATE_PAIRS.filter((pair) => pair.successful).length;
  assertEqual(
    [good, CANDIDATE_PAIRS.length],
    [7, 10],
    'seven of ten pairs have a candidate that passes',
  );
  assertEqual(Math.round(passAtK(size, passes, 2) * 100), 70, 'pass-at-2 of the pool');
  // With replacement: an ordered draw fails when both of its two draws fail.
  const draws = pool.flatMap((a) => pool.map((b) => a.passed || b.passed));
  const goodDraws = draws.filter(Boolean).length;
  assertEqual([goodDraws, draws.length], [16, 25], 'sixteen of 25 ordered draws have a pass');
  assertEqual(
    goodDraws / draws.length,
    1 - ((size - passes) / size) ** 2,
    'one minus three-fifths squared',
  );

  // The frame: the grid of draws at the left, the second axis at the right, and the results under them.
  const [upper, lower] = area.rows([7, 2], 'normal');
  const [gridSide, probeSide] = upper.columns([9, 10], 'wide');
  const paint = (name, color, options = {}) => chip(name, { color, stroke: color, ...options });

  // The grid: a candidate for each row and each column. A cell is the two candidates of one draw.
  const [gridTitleBand, gridBody] = gridSide.rows([1, 9], 'tight');
  const gridTitle = place(
    label('functional tests', { size: 36, color: COLOR.pass }),
    gridTitleBand,
    'left',
  );
  const square = Math.min(gridBody.width, gridBody.height);
  const lines = gridBody
    .columns([square, Math.max(1, gridBody.width - square)], 'none')[0]
    .rows(size + 1, 'none');
  const slot = (r, col) => lines[r].columns(size + 1, 'none')[col];
  const names = (make) =>
    pool.map((candidate, i) =>
      place(mono(candidate.id, { size: 34, color: COLOR.quiet }), make(i)),
    );
  const across = names((i) => slot(0, i + 1));
  const down = names((i) => slot(i + 1, 0));
  const cells = pool.flatMap((a, i) =>
    pool.map((b, j) => {
      const box = slot(i + 1, j + 1).inset(6, 6);
      const ok = a.passed || b.passed;
      return {
        i,
        j,
        ok,
        outline: rect(box.width, box.height, {
          radius: 10,
          stroke: COLOR.quiet,
          fill: null,
          width: 2,
        }).at(box.cx, box.cy),
        fill: rect(box.width - 8, box.height - 8, {
          radius: 8,
          stroke: null,
          fill: ok ? COLOR.pass : COLOR.fail,
          opacity: 0.8,
        }).at(box.cx, box.cy),
      };
    }),
  );
  const pairs = cells.filter((cell) => cell.i < cell.j);
  const rest = cells.filter((cell) => cell.i >= cell.j);

  // The second axis: the probes of the runtime. This scene measures none of them.
  const probeTitle = label('containment probes', { size: 36, color: COLOR.host });
  const probes = runtimeProbe().map((probe) => ({
    name: label(probe.attempt, { size: 32 }),
    mark: pictogram('question', { size: 40, color: COLOR.quiet, accent: COLOR.quiet }),
  }));
  place(
    column(
      [
        probeTitle,
        grid(
          probes.flatMap((probe) => [probe.mark, probe.name]),
          { columns: 2, gap: ['normal', 'normal'], even: true },
        ),
      ],
      {
        gap: 'normal',
      },
    ),
    probeSide,
    'top left',
  );
  const notMeasured = note('not measured by pass-at-2', { color: COLOR.mark });
  place(notMeasured, probeSide, 'bottom left');

  // The results, under the grid: one line for each experiment.
  const [resultBox, reportBox] = lower.columns([9, 10], 'wide');
  const without = {
    name: note('2 of 5, without replacement'),
    value: mono(`${good} / ${CANDIDATE_PAIRS.length} = 70%`, { size: 40, color: COLOR.mark }),
  };
  const withIt = {
    name: note('2 draws, with replacement'),
    value: mono(`${goodDraws} / ${draws.length} = 64%`, { size: 40 }),
  };
  place(
    grid([without.name, without.value, withIt.name, withIt.value], {
      columns: 2,
      gap: ['normal', 'tight'],
    }),
    resultBox,
    'left',
  );
  const fixed = paint('artifact and environment: fixed', COLOR.host);
  const reports = ['correctness', 'containment', 'timeouts', 'cleanup'].map((name) =>
    paint(name, COLOR.host),
  );
  place(column([fixed, row(reports, { gap: 'tight' })], { gap: 'tight' }), reportBox, 'left');

  s.add(
    heading(c.title),
    gridTitle,
    ...across,
    ...down,
    probeTitle,
    ...probes.flatMap((probe) => [probe.mark, probe.name]),
  );

  // Beat 0: two questions, two sides of the frame.
  c.on('ev2-functional', () =>
    s.play(indicate(gridTitle, { color: COLOR.mark, scale: 1, duration: 1.2 })),
  );
  c.on('ev2-containment', () =>
    s.play(indicate(probeTitle, { color: COLOR.mark, scale: 1, duration: 1.2 })),
  );

  // Beat 1: five candidates, two pass, and the ten pairs.
  const tint = (i, color) =>
    [across[i], down[i]].map((name) => recolor(name, color, { duration: 0.3 }));
  c.on('ev2-pool', () => s.play(...pool.flatMap((_, i) => tint(i, 'ink'))));
  c.on('ev2-two', () =>
    s.play(...pool.flatMap((candidate, i) => tint(i, candidate.passed ? COLOR.pass : COLOR.fail))),
  );
  const passingIds = pool.filter((candidate) => candidate.passed).map((candidate) => candidate.id);
  const failingIds = pool.filter((candidate) => !candidate.passed).map((candidate) => candidate.id);
  const poolKey = place(
    label(`Pass: ${passingIds.join(', ')}     Fail: ${failingIds.join(', ')}`, { size: 34 }),
    gridTitleBand,
    'left',
  );
  c.swap('ev2-two', gridTitle, poolKey, { after: true });
  c.show(
    'ev2-choose',
    pairs.map((cell) => cell.outline),
    { stagger: true },
  );
  const predict = place(
    label('How many pairs have two failures?', { size: 37, color: COLOR.mark }),
    resultBox,
    'left',
  );
  c.show('ev2-ask', predict);
  c.hide('ev2-ten', predict);
  c.show(
    'ev2-seven',
    pairs.filter((cell) => cell.ok).map((cell) => cell.fill),
    { stagger: true, after: true },
  );
  c.show(
    'ev2-ten',
    pairs.filter((cell) => !cell.ok).map((cell) => cell.fill),
    { after: true },
  );
  c.show('ev2-result', [without.name, without.value], { after: true });

  // Beat 2: the number says nothing about the second axis.
  c.show('ev2-nothing', notMeasured);
  c.on('ev2-nothing', () =>
    s.play(
      ...probes
        .slice(0, 2)
        .map((probe) => indicate(probe.name, { color: COLOR.mark, scale: 1, duration: 1.6 })),
    ),
  );
  c.show('ev2-fixed', fixed);
  c.show('ev2-report', reports, { stagger: true });

  // Beat 3: the formula takes its numbers from the grid. Then the grid opens to every ordered draw.
  const second = [probeTitle, ...probes.flatMap((probe) => [probe.mark, probe.name]), notMeasured];
  const [formulaBand, replaceBand, sampleBand, frozenBand] = probeSide.rows([3, 2, 3, 2], 'normal');
  const formula = tex('1 - \\dfrac{C(n-c,\\,k)}{C(n,\\,k)}', { size: 44 });
  const values = tex('= 1 - \\dfrac{3}{10} = 0.7', { size: 44, color: COLOR.mark });
  const formulaName = label('pass-at-k', { size: 36 });
  const equals = tex('=', { size: 44 });
  place(
    row([formulaName, equals, formula, values], { gap: 'tight', align: 'center' }),
    formulaBand,
    'left',
  );
  const squared = tex('1 - \\left(\\dfrac{3}{5}\\right)^{2} = \\dfrac{16}{25}', { size: 40 });
  const other = note('another experiment');
  place(row([squared, other], { gap: 'wide', align: 'center' }), replaceBand, 'left');
  const unbiased = note('unbiased under IID sampling', { color: COLOR.pass });
  const plugged = note('plug-in estimate can be biased');
  const sameCode = note('one code can sit at two indices');
  const trajectory = wall(
    sampleBand.columns([3, 2], 'wide')[1].inset('none', 'tight'),
    'one sample',
    { color: COLOR.host },
  );
  const attempts = ['patch 1', 'patch 2', 'patch 3'].map((name) =>
    note(name, { color: COLOR.candidate }),
  );
  place(
    column([unbiased, plugged, sameCode], { gap: 'tight' }),
    sampleBand.columns([3, 2], 'wide')[0],
    'left',
  );
  place(
    column(attempts, { gap: 'tight' }),
    sampleBand.columns([3, 2], 'wide')[1].inset('normal', 'normal'),
    'left',
  );
  const frozen = ['tasks', 'environment', 'tool budgets', 'grading'].map((name) =>
    paint(name, COLOR.host),
  );
  const apart = ['infrastructure failures', 'incomplete runs'].map((name) =>
    paint(name, COLOR.quiet, { dash: [8, 6] }),
  );
  place(row(frozen, { gap: 'tight' }), frozenBand, 'top left');
  place(row(apart, { gap: 'tight' }), reportBox, 'right');
  c.swap('ev2-formula', second, [formulaName, equals, formula]);
  // The two counts of the formula are in the grid: the pairs with no pass, and all the pairs.
  c.on('ev2-fails', () =>
    s.play(
      ...pairs
        .filter((cell) => !cell.ok)
        .map((cell) => indicate(cell.fill, { color: COLOR.mark, duration: 1.6 })),
    ),
  );
  c.on('ev2-all', () =>
    s.play(...pairs.map((cell) => indicate(cell.outline, { color: COLOR.mark, duration: 1.4 }))),
  );
  c.show('ev2-all', values, { after: true });
  c.show(
    'ev2-replacement',
    rest.flatMap((cell) => [cell.outline, cell.fill]),
    { stagger: true },
  );
  c.show('ev2-squared', squared);
  c.show('ev2-sixtyfour', [withIt.name, withIt.value, other], { after: true });
  c.show('ev2-unbiased', unbiased);
  c.show('ev2-plugin', plugged);
  c.show('ev2-identical', sameCode);
  c.on('ev2-identical', () =>
    s.play(
      ...[1, 3].flatMap((i) =>
        [across[i], down[i]].map((name) => indicate(name, { color: COLOR.mark, duration: 1.6 })),
      ),
    ),
  );
  c.show('ev2-trajectories', [trajectory, ...attempts]);
  c.hide('ev2-freeze', [fixed, ...reports]);
  c.show('ev2-freeze', frozen, { stagger: true });
  c.show('ev2-infra', apart);
}
