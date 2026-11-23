import { codeBlock, place, table } from 'vizmatic/stage';
import { note } from '../../kit-narrated.mjs';
import { BOARD, FOOT, context } from '../parts.mjs';

export default function scene(s, c) {
  context(s, c);
  const [codeArea, resultsArea] = BOARD.rows([1, 2], 'normal');
  const test = place(
    codeBlock('assert calls.count("/guide") == 1', {
      language: 'python',
      size: 54,
      panel: true,
    }),
    codeArea,
  );
  const cases = place(
    table(
      [
        { key: 'case', label: 'workers', sample: '2, both checked' },
        { key: 'seen', label: 'final set', sample: '{"/guide"}' },
        { key: 'log', label: 'calls', sample: '["/guide", "/guide"]' },
        { key: 'result', label: 'assertion', sample: 'FAIL' },
      ],
      [
        { id: 'one', case: '1', seen: null, log: null, result: null },
        { id: 'two', case: '2, both checked', seen: null, log: null, result: null },
      ],
      { width: resultsArea.width * 0.94, size: 40, leading: 2.2, maxRows: 2 },
    ),
    resultsArea,
  );
  const fixture = place(note('Local fetch stub  •  no network'), FOOT);
  s.add(test, cases, fixture);
  c.after('contract-single', () =>
    s.play(cases.setCell('one', 'seen', '{"/guide"}'), cases.setCell('one', 'log', '["/guide"]')),
  );
  c.after('contract-pass', () => s.play(cases.setCell('one', 'result', 'PASS')));
  c.after('contract-race', () => s.play(cases.setCell('two', 'seen', '{"/guide"}')));
  c.after('contract-double', () => s.play(cases.setCell('two', 'log', '["/guide", "/guide"]')));
  c.after('contract-fail', () => s.play(cases.setCell('two', 'result', 'FAIL')));
  c.after('contract-isolate', () => s.play(cases.light('two', 'log', { duration: 0.3 })));
}
