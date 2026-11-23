import { place, column, assertEqual } from 'vizmatic/stage';
import { heading, label } from '../../kit-narrated.mjs';
import { ruleBoard } from '../parts.mjs';
import { exactRoute } from '../../../films/bitter-lesson-compute-over-heuristics/model.mjs';
import {
  expandedRules,
  newPhrases,
} from '../../../films/bitter-lesson-compute-over-heuristics/fixtures.mjs';

export default function growth(s, c) {
  const board = ruleBoard(true);
  const original = ['timeout', 'citation', 'password'];
  const patches = expandedRules.filter((word) => !original.includes(word));
  const ordered = [...original, ...patches];
  const list = ordered.map((word, i) => label(word, { size: 37, color: i < 3 ? 'dim' : 'yellow' }));
  place(column(list, { gap: 'normal' }), board.ports);
  const output = (words, color) => place(label(words, { size: 43, color }), board.foot);
  const score = (rules) =>
    board.data.filter((r) => exactRoute(r.text, rules) === r.expected).length;
  let tally = output('3 / 6 reviewed reports correct', 'yellow');
  s.add(heading(c.title), board.ledger, list.slice(0, 3), tally);
  for (const [i, patch] of patches.entries()) {
    const rules = ordered.slice(0, 4 + i);
    const changed = board.data.findIndex(
      (r) => exactRoute(r.text, rules) !== exactRoute(r.text, rules.slice(0, -1)),
    );
    const count = score(rules);
    assertEqual(count, [4, 5, 5, 6][i], 'reviewed reports after adding ' + patch);
    const cue = 'patch-' + ['tokens', 'cites', 'source', 'authenticate'][i];
    c.show(cue, list[i + 3]);
    const next = output(count + ' / 6 reviewed reports correct', count === 6 ? 'green' : 'yellow');
    if (changed >= 0) {
      const row = board.data[changed];
      c.after(cue, () =>
        s.play(
          board.ledger.light('R' + changed, null, { duration: 0.45 }),
          board.ledger.setCell(
            'R' + changed,
            'route',
            { value: exactRoute(row.text, rules), state: 'pass' },
            { duration: 0.45 },
          ),
        ),
      );
      c.swap(cue, tally, next, { after: true });
      tally = next;
    } else {
      const alreadyRouted = board.data.findIndex((r) => r.text.includes(patch));
      c.on(cue, () => s.play(board.ledger.light('R' + alreadyRouted, null, { duration: 0.55 })));
    }
  }
  const question = output('Which fresh reports contain a listed key?', 'yellow');
  const freshRows = newPhrases.map((r, i) => ({
    id: 'F' + i,
    report: r.text,
    expected: r.expected,
    route: { value: '', state: 'pending' },
  }));
  c.swap('fresh-set', tally, question);
  c.on('fresh-set', () => {
    s.play(
      board.ledger.remove(
        board.data.map((_, i) => 'R' + i),
        { duration: 0.4 },
      ),
    );
    s.play(board.ledger.append(freshRows, { duration: 0.6 }));
  });
  const correct = newPhrases.filter((r) => exactRoute(r.text, expandedRules) === r.expected).length;
  assertEqual(correct, 0, 'fresh examples');
  const result = output(correct + ' / ' + newPhrases.length + ' fresh reports correct', 'yellow');
  c.after('fresh-result', () =>
    s.play(
      ...newPhrases.map((r, i) =>
        board.ledger.setCell(
          'F' + i,
          'route',
          { value: exactRoute(r.text, expandedRules).replace('_', ' '), state: 'fail' },
          { duration: 0.55 },
        ),
      ),
    ),
  );
  c.swap('fresh-result', question, result, { after: true });
}
