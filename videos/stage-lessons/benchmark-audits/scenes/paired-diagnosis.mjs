import { boxOf, dot, indicate, line, place, rect, recolor, to } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { CASES, caseBoard, MAIN, FOOT, exactPairedP, binomialChoose } from '../parts.mjs';

export default function paired(s, c) {
  const board = caseBoard();
  const headingNode = heading('Which paired answers changed?');
  const [assumptions, buckets] = MAIN.rows([1, 6], 'normal');
  const classify = (r) => (r.A ? (r.B ? 0 : 1) : r.B ? 2 : 3);
  const names = ['Both pass', 'A only  ·  broke', 'B only  ·  fixed', 'Both fail'];
  const colors = ['dim', 'red', 'green', 'dim'];
  const groups = buckets
    .rows(2, 'wide')
    .flatMap((r) => r.columns(2, 'wide'))
    .map((slot, j) => {
      const rows = CASES.filter((r) => classify(r) === j);
      const [head, body] = slot.rows([1, 3], 'normal');
      const frame = place(
        rect(slot.width, slot.height, { fill: null, stroke: 'grid', width: 2 }),
        slot,
      );
      const title = place(label(names[j], { size: 35, color: colors[j] }), head);
      const count = place(
        label(names[j] + '    ' + rows.length, { size: 35, color: colors[j] }),
        head,
      );
      const spots = body
        .inset('tight')
        .rows(6, 'none')
        .flatMap((r) => r.columns(14, 'none'));
      return { rows, frame, title, count, spots };
    });
  const marks = CASES.map((r, i) => {
    const j = classify(r),
      group = groups[j];
    const mark = dot(7, colors[j]).moveTo(boxOf(board.grids.A.cells[i]).point('center'));
    return { mark, target: group.spots[group.rows.indexOf(r)].point('center'), j };
  });
  const example = place(label('Q93    A ×     B ✓     →     one fix', { size: 40 }), assumptions);
  const tie = place(mono('7 fixes − 7 breaks = 0 net passes', { size: 40 }), FOOT);
  const hypothesis = place(
    note('Independent pairs from one population    ·    equal marginal pass rates'),
    assumptions,
  );
  const coin = place(label('Given a disagreement, P(fix) = ½ under the null', { size: 36 }), FOOT);

  // Each bar counts the sequences with exactly j fixes among n fair directions.
  const [premise, chart, caption, answer] = area.rows([1, 4.7, 1, 1], 'normal');
  const plotTitle = heading('How often would a fair split be this uneven?');
  const axisLabel = place(
    note('Horizontal axis   number of fixes       Bar height   number of fair-coin sequences'),
    caption,
  );
  function distribution(fix, broken) {
    const total = fix + broken,
      possibilities = 2 ** total;
    const subtitle = place(
      label(
        `${total} disagreements     ·     ${fix} fixes, ${broken} ${broken === 1 ? 'break' : 'breaks'}`,
        { size: 48 },
      ),
      premise,
    );
    const [bars, ticks] = chart.inset('normal').rows([5.5, 1], 'tight');
    const mass = Array.from({ length: total + 1 }, (_, k) => binomialChoose(total, k));
    const peak = Math.max(...mass);
    const barNodes = mass.map((ways, j) => {
      const slot = bars.columns(mass.length, 'normal')[j];
      return place(
        rect(Math.min(slot.width * 0.72, 132), (bars.height * ways) / peak, {
          fill: 'dim',
          stroke: null,
        }),
        slot,
        'bottom',
      );
    });
    const tickNodes = mass.map((_, j) =>
      place(mono(String(j), { size: 34 }), ticks.columns(mass.length, 'normal')[j]),
    );
    const tails = barNodes.filter(
      (_, j) => j <= Math.min(fix, broken) || j >= Math.max(fix, broken),
    );
    const tailTicks = tickNodes.filter(
      (_, j) => j <= Math.min(fix, broken) || j >= Math.max(fix, broken),
    );
    const oneTail = mass.slice(0, Math.min(fix, broken) + 1).reduce((a, b) => a + b);
    const bottom = line(bars.point('bottom left'), bars.point('bottom right'), {
      stroke: 'grid',
      width: 2,
    });
    const value = place(
      mono(`2 × ${oneTail}/${possibilities} = ${exactPairedP(fix, broken).toFixed(4)}`, {
        color: 'yellow',
        size: 49,
      }),
      answer,
    );
    return {
      nodes: [subtitle, bottom, barNodes, tickNodes],
      tails,
      tailTicks,
      value,
      oneTail,
      possibilities,
    };
  }
  const nine = distribution(9, 1),
    three = distribution(3, 1),
    five = distribution(5, 0);
  const tailMass = place(mono(`One tail = (1 + 10) / ${nine.possibilities}`, { size: 47 }), answer);
  const ask = place(
    label('Five fixes, zero breaks. Does p fall below 0.05?', { color: 'yellow' }),
    answer,
  );
  const broken = groups[1].rows;
  const file = place(
    label(`Library regressions    ${broken[0].id} to ${broken.at(-1).id}`, {
      color: 'red',
      size: 46,
    }),
    FOOT,
  );
  const highlightTails = (cue, chart) =>
    c.on(cue, () =>
      s.play(
        ...chart.tails.map((bar) => recolor(bar, 'yellow', { duration: 0.4 })),
        indicate(chart.tailTicks, { color: 'yellow', scale: 1.1 }),
      ),
    );

  s.add(
    headingNode,
    groups.map((g) => [g.title, g.frame]),
  );
  s.add(board.nodes);
  c.show('one-fix', example);
  c.on('one-fix', () =>
    s.play(
      indicate([board.grids.A.cells[92], board.grids.B.cells[92]], {
        color: 'yellow',
        scale: 1.25,
      }),
    ),
  );
  c.show(
    'sort-pairs',
    marks.map((m) => m.mark),
  );
  c.on('sort-pairs', () =>
    s.play(...marks.map((m) => to(m.mark, (n) => n.moveTo(m.target), { duration: 1.35 }))),
  );
  c.on('shared-cases', () =>
    s.play(...marks.filter((m) => m.j === 0 || m.j === 3).map((m) => recolor(m.mark, 'grid'))),
  );
  c.swap(
    'library-tie',
    groups.map((g) => g.title),
    groups.map((g) => g.count),
    { after: true },
  );
  c.show('library-tie', tie, { after: true });
  c.swap('paired-null', example, hypothesis);
  c.swap('coin-null', tie, coin, { after: true });
  c.swapAll('new-ten', [plotTitle, nine.nodes, axisLabel]);
  highlightTails('two-tails', nine);
  c.show('tail-count', tailMass, { after: true });
  c.swap('nine-one-result', tailMass, nine.value, { after: true });
  c.swap('new-four', [nine.nodes, nine.value], three.nodes);
  highlightTails('four-tails', three);
  c.show('three-one-result', three.value, { after: true });
  c.swap('new-five', [three.nodes, three.value], five.nodes);
  c.show('five-ask', ask);
  highlightTails('five-tails', five);
  c.swap('five-result', ask, five.value, { after: true });
  c.swapAll('broken-file', [
    headingNode,
    board.nodes,
    hypothesis,
    groups.map((g) => [g.frame, g.count]),
    marks.map((m) => m.mark),
    file,
  ]);
  c.keep(board.nodes);
}
