import { assertEqual, line, place, to } from 'vizmatic/stage';
import { area, heading, label, mono, namedBox, note, tint } from '../../kit-narrated.mjs';
import { widerBeamTrace } from '../../../films/beam-search/arithmetic.mjs';

export default function widerCounterexample(s, c) {
  const [top, work, foot] = area.inset('normal').rows([0.9, 5.8, 1.45], 'normal');
  const runs = [widerBeamTrace(2), widerBeamTrace(3)];
  const wide = runs[1];
  const colors = {
    A: 'cyan',
    A1: 'cyan',
    A2: 'yellow',
    B: 'dim',
    C: 'green',
    C1: 'green',
    C2: 'green',
  };
  const score = (p) => p.toFixed(2);
  const card = (name, p, region) =>
    place(
      namedBox(`${name}    ${score(p)}`, { width: 284, height: 83, size: 38, color: colors[name] }),
      region,
    );
  const firstMass = place(note('First token     A  0.50      B  0.30      C  0.20'), top);
  const aRow = place(
    mono('After A     .80 / .18 / .02          After B     10 × .10', { size: 36 }),
    top,
  );
  const cRow = place(mono('After C     2 equal branches       .20 × .50 each', { size: 36 }), top);
  const lastRow = place(
    label('Last token     •     follow one continuation of each surviving prefix', { size: 37 }),
    top,
  );
  const lanes = work.columns(2, 'loose');
  const boards = runs.map((run, i) => {
    const [header, ranks] = lanes[i].rows([1, 5], 'normal');
    const [rank, extra] = ranks.columns([1.3, 1], 'tight');
    const slots = rank.rows(4, 'normal');
    const side = extra.rows(4, 'normal');
    const bottom = (slots[run.width - 1].bottom + slots[run.width].top) / 2;
    const cutoff = line([rank.left, bottom], [rank.right, bottom], {
      stroke: 'dim',
      width: 3,
      dash: [10, 9],
    });
    const initial = run.history[0].expanded.map((entry, k) =>
      card(entry.tokens[0], entry.probability, slots[k]),
    );
    const child = (name) => run.history[1].expanded.find((item) => item.tokens.join('') === name);
    const candidates = ['A1', 'A2'].map((name, k) => card(name, child(name).probability, slots[k]));
    const formula = ['A1', 'A2'].map((name, k) =>
      place(
        mono(`.50 × ${score(child(name).conditional)}`, { size: 31, color: colors[name] }),
        side[k],
      ),
    );
    const factors = run.history[1].active.map((item, k) => {
      const parent = item.tokens.join('');
      const { conditional } = run.history[2].expanded.find((x) => x.parent === parent);
      return place(mono(`× ${score(conditional)}`, { size: 36, color: colors[parent] }), side[k]);
    });
    return {
      title: place(label(`Width ${run.width}`), header),
      initial,
      cutoff,
      candidates,
      formula,
      factors,
      slots,
      side,
    };
  });
  const [left, right] = boards;
  const cIndices = ['C1', 'C2'];
  const challengers = cIndices.map((name, i) => {
    const entry = wide.history[1].expanded.find((item) => item.tokens.join('') === name);
    return card(name, entry.probability, right.side[i + 1]);
  });
  const pending = place(note('From C'), right.side[0]);
  const premise = place(note('The dashed line marks the last place in each beam.'), foot);
  const scraps = place(note('Other children      A3 = .01      Each B child = .03'), foot);
  const question = place(
    label('Will A2 fit above the line on the right?', { color: 'yellow' }),
    foot,
  );
  const discarded = place(note('pruned'), right.side[3]);
  const predict = place(label('Which beam finishes with the higher probability?'), foot);
  const results = runs.map((run, i) => {
    const name = run.winner.parent;
    const parent = run.history[1].active.find((item) => item.tokens.join('') === name);
    return place(
      mono(
        `${name}: ${score(parent.probability)} × ${score(run.winner.conditional)} = ${score(run.winner.probability)}`,
        { color: colors[name], size: 36 },
      ),
      foot.columns(2, 'loose')[i],
    );
  });
  assertEqual(
    runs.map((r) => score(r.winner.probability)).join('/'),
    '0.09/0.04',
    'best three-token paths',
  );
  s.add(
    heading(c.title),
    firstMass,
    boards.map((b) => [b.title, b.initial]),
    premise,
  );
  c.show(
    'width-slots',
    boards.map((b) => b.cutoff),
  );
  c.after('width-slots', () => s.play(tint(left.initial[2], 'dim')));
  c.swap('a-children', firstMass, aRow);
  c.swap(
    'a-rank',
    boards.flatMap((b) => b.initial),
    boards.map((b) => [b.candidates, b.formula]),
    { after: true },
  );
  c.swap('a-rank', premise, scraps, { after: true });
  c.swap('c-fork', aRow, cRow);
  c.hide(
    'c-fork',
    boards.map((b) => b.formula),
  );
  c.show('c-fork', pending);
  c.show('c-halves', challengers, { after: true });
  c.swap('c-halves', scraps, question, { after: true });
  c.hide('drop-a-two', [pending, question], { after: true });
  c.after('drop-a-two', () =>
    s.play(
      to(right.candidates[1], (n) => n.moveTo(right.slots[3].point('center'))),
      ...challengers.map((node, k) =>
        to(node, (n) => n.moveTo(right.slots[k + 1].point('center'))),
      ),
      { duration: 0.85 },
    ),
  );
  c.after('drop-a-two', () => s.play(tint(right.candidates[1], 'dim')), 0.9);
  c.show('drop-a-two', discarded, { after: true, lead: -0.9 });
  c.swap('final-factors', cRow, lastRow);
  c.show(
    'final-factors',
    boards.map((b) => b.factors),
  );
  c.show('final-factors', predict);
  c.hide('two-final', predict, { after: true });
  c.show('two-final', results[0], { after: true });
  c.show('three-final', results[1], { after: true });
}
