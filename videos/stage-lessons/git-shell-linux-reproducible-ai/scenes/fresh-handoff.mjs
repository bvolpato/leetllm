import { assertEqual, numberLine, place, table } from 'vizmatic/stage';
import { label, mono } from '../../kit-narrated.mjs';
import { freshRows, freshWrong, repositoryContext, score } from '../parts.mjs';
import { copyStrip, readStrip, requestStrip } from '../request-strips.mjs';

export default function freshHandoff(s, c) {
  const { main } = repositoryContext(s, c);
  const eight = [...freshRows, freshWrong];
  const sevenRun = score(freshRows),
    eightRun = score(eight);
  const earned = sevenRun.correct * 3;
  const needed = sevenRun.total * 2,
    neededWithTrial = eightRun.total * 2;
  assertEqual(eightRun.correct * 3, earned, 'Appending a miss keeps the earned count fixed');
  const [top, a, b, d, comparison, foot] = main.rows([1, 1.6, 1.6, 1.6, 2.6, 1], 'normal');
  const working = requestStrip(a, 'Working tree', eight);
  const index = requestStrip(b, 'Index', eight);
  const candidate = requestStrip(d, 'Fresh clone', eight);
  const rebuilt = requestStrip(d, 'Fresh clone', freshRows, eight.length);
  const [pairsBand, promptBand] = main.rows([8.4, 1], 'normal');
  const comparisons = place(table([
    { key: 'id', label: 'request', mono: true },
    { key: 'expected', label: 'expected', mono: true },
    { key: 'prediction', label: 'saved prediction', sample: '" APPROVED "', mono: true },
  ], freshRows.map(record => ({
    id: record.prompt.match(/\d+/)[0],
    expected: JSON.stringify(record.expected),
    prediction: '',
  })), { size: 41, width: pairsBand.width * 0.86, leading: 1.85 }), pairsBand);
  const predict = place(label('Does this file clear two thirds?', { size: 42, color: 'yellow' }), promptBand);
  const rule = place(mono('3 × matches ≥ 2 × requests', { color: 'ink' }), top);
  const local = place(
    mono('working tree    ' + sevenRun.correct + '/' + sevenRun.total + '    exit 0', {
      color: 'green',
    }),
    top,
  );
  const stagedDiff = place(mono('git diff --cached    − request 208', { color: 'yellow' }), top);
  const untested = place(
    label('Will the fresh clone pass? Which request tells you?', { color: 'yellow' }),
    foot,
  );
  const [axisLabel, ruler] = comparison.columns([1, 5], 'wide');
  const localAxis = place(label('Local run', { size: 36 }), axisLabel, 'left');
  const cloneAxis = place(label('Clone run', { size: 36 }), axisLabel, 'left');
  const newCommit = place(mono('new commit    •    request 208 removed', { color: 'ink' }), top);
  const axis = place(
    numberLine({
      range: [needed - 1, neededWithTrial + 1],
      step: 1,
      length: ruler.width * 0.82,
      size: 31,
      labelSize: 34,
      format: String,
      tips: false,
      thresholds: [{ at: needed, label: '2 × requests', readout: false, color: 'yellow' }],
    }),
    ruler,
  );
  const dot = { name: '3 × matches', value: earned, color: 'cyan' };
  const pass = place(mono('PASS    ' + earned + ' ≥ ' + needed, { color: 'green' }), foot);
  const rounded = place(
    mono(sevenRun.fraction.toFixed(3) + '    (' + sevenRun.correct + '/' + sevenRun.total + ')', {
      color: 'green',
    }),
    foot,
  );
  const failure = place(
    mono(eightRun.fraction.toFixed(3) + '    ' + earned + ' < ' + neededWithTrial + '    exit 1', {
      color: 'red',
    }),
    foot,
  );
  const final = place(
    mono(
      sevenRun.fraction.toFixed(3) +
        ' (' +
        sevenRun.correct +
        '/' +
        sevenRun.total +
        ')    status clean    exit 0',
      { color: 'green' },
    ),
    foot,
  );
  const strips = [rule, working.heading, index.heading, candidate.heading,
    working.cards.slice(0, sevenRun.total), index.cards.slice(0, sevenRun.total)];
  s.add(comparisons);
  c.on('raw-predictions', () => s.play(...freshRows.map(record =>
    comparisons.setCell(record.prompt.match(/\d+/)[0], 'prediction', JSON.stringify(record.prediction)),
  )));
  c.show('fresh-gate-question', predict);
  c.on('last-two', () => s.play(comparisons.light('206'), { duration: 0.35 }));
  c.after('last-two', () => s.play(comparisons.light('207'), { duration: 0.4 }));
  c.hide('fresh-integer-right', [comparisons, predict], { fade: 0.15 });
  c.show('fresh-integer-right', [strips, axis, localAxis], { lead: -0.25 });
  c.on('fresh-integer-left', () => s.play(axis.insert(dot, { duration: 0.55 })));
  c.show('fresh-gate-pass', pass);
  c.swap('fresh-rounded-rate', pass, rounded);
  c.hide('fresh-append-eight', rounded);
  c.show('fresh-append-eight', working.cards.at(-1));
  copyStrip(s, c, 'fresh-stage-eight', working, index, 1, sevenRun.total);
  c.hide('fresh-working-repair', working.cards.at(-1));
  c.swap('fresh-working-pass', rule, local);
  c.show('fresh-clone-question', untested);
  c.hide('fresh-clone-input', untested);
  copyStrip(s, c, 'fresh-clone-input', index, candidate, eightRun.total);
  c.swap('fresh-eight-gate', localAxis, cloneAxis);
  c.on('fresh-eight-gate', () => s.play(axis.moveThreshold(neededWithTrial, { duration: 1.15 })));
  c.show('fresh-clone-fails', failure);
  c.hide('fresh-repair', index.cards.at(-1));
  c.swap('fresh-repair', local, stagedDiff);
  c.swap('fresh-reclone', stagedDiff, newCommit);
  c.hide('fresh-reclone', [candidate.cards, failure], { fade: 0.25 });
  copyStrip(s, c, 'fresh-rerun', index, rebuilt, sevenRun.total);
  readStrip(s, c, 'fresh-score-again', rebuilt, sevenRun.total);
  c.after('fresh-score-again', () => s.play(axis.moveThreshold(needed, { duration: 1 })));
  c.show('fresh-final-receipt', final);
}
