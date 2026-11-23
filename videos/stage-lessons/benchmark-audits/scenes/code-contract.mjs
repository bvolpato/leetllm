import { assertEqual, column, place, codeBlock, morphCode } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';

// Generate the pictured Python and its results from the same branch values.
const oldRule = { item: 'textbook', days: 28, other: 21 };
const patch = { item: 'new', days: 7, other: 21 };
const cases = [
  { item: 'new', expected: 7 },
  { item: 'book', expected: 21 },
  { item: 'textbook', expected: 28 },
];
export const pythonRule = (rule) =>
  `def days(item):\n    if item == "${rule.item}":\n        return ${rule.days}\n    return ${rule.other}`;
export const assertion = (test) => `assert days("${test.item}") == ${test.expected}`;
export const loanExample = { oldRule, patch, cases };

export default function code(s, c) {
  const [context, body, foot] = area.rows([1, 5, 1], 'normal');
  const [source, checks] = body.columns([1, 1.24], 'loose');
  const [first, second] = body.columns(2, 'wide');
  const intro = heading('What does a coding benchmark score?');
  const functions = place(
    column([label('HumanEval', { size: 56 }), note('164 Python functions')], { gap: 'wide' }),
    first,
  );
  const repos = place(
    column([label('SWE-bench', { size: 56 }), note('2,294 original issues in 12 repositories')], {
      gap: 'wide',
    }),
    second,
  );
  const title = heading('Which tests did the library patch pass?');
  const oldLabel = place(
    label('Loan period in days    ·    original function', { color: 'cyan' }),
    context,
  );
  const patchLabel = place(
    label('Loan period in days    ·    proposed patch', { color: 'blue' }),
    context,
  );
  const renderRule = (rule) =>
    place(codeBlock(pythonRule(rule), { language: 'python', size: 39, panel: true }), source);
  const before = renderRule(oldRule),
    changed = renderRule(patch);
  const tests = cases.map((test, i) => {
    const [kind, expr, value] = checks.rows(3, 'wide')[i].rows([0.7, 1, 0.8], 'none');
    const name = place(
      note(['Selected repair test', 'Selected regression test', 'Outside the selected harness'][i]),
      kind,
      'left',
    );
    const predicate = place(mono(assertion(test), { size: 37 }), expr, 'left');
    const outcome = (rule) => {
      const actual = test.item === rule.item ? rule.days : rule.other;
      return place(
        mono(`returned ${actual}   ${actual === test.expected ? 'PASS' : 'FAIL'}`, {
          size: 32,
          color: actual === test.expected ? 'green' : 'red',
        }),
        value,
        'left',
      );
    };
    return { test: [name, predicate], old: outcome(oldRule), patched: outcome(patch) };
  });
  assertEqual(
    cases.map((t) => (t.item === patch.item ? patch.days : patch.other) === t.expected).join(','),
    'true,true,false',
    'selected and omitted assertions',
  );
  const resolved = place(
    label('Selected checks   2/2    ·    resolved', { color: 'green', size: 44 }),
    foot,
  );
  const ask = place(
    label('How many days does the patch give a textbook?', { color: 'yellow', size: 42 }),
    foot,
  );
  const keep = place(
    label('Resolved on the two selected checks    ·    textbook regression retained', { size: 38 }),
    foot,
  );
  const attempts = place(
    note('Record the selected patch, tests, tool calls, timeouts and cost'),
    foot,
  );
  s.add(intro, functions);
  c.show('harnesses', repos);
  c.swap(
    'loan-code',
    [intro, functions, repos],
    [title, oldLabel, before, tests[0].test, tests[1].test],
  );
  c.show('old-new', tests[0].old, { after: true });
  c.show('old-book', tests[1].old, { after: true });
  c.swap('loan-patch', oldLabel, patchLabel);
  c.hide('loan-patch', [tests[0].old, tests[1].old]);
  c.on('loan-patch', () => s.play(morphCode(before, changed, { duration: 0.9 })));
  c.show('selected-tests', [tests[0].patched, tests[1].patched], { after: true });
  c.show('harness-resolved', resolved, { after: true });
  c.show('omitted-test', tests[2].test);
  c.swap('omitted-ask', resolved, ask);
  c.show('omitted-fail', tests[2].patched, { after: true });
  c.swap('omitted-fail', ask, keep, { after: true });
  c.swap('record-budget', keep, attempts);
}
