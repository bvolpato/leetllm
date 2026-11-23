// Scene `evidence-loop`: the next patch responds to a real failure.
//
// The picture: the real XML of the report stays at the top, with a verdict beside each test case.
// The expected output is at the lower right. At the lower left, the contract gives place to the
// lookup that fails and its evidence, the lookup morphs into the repair, and the scan bar goes
// down the four cases. The back half puts eight edge cases through the same rule, one row each.
import {
  assertEqual,
  beside,
  codeBlock,
  column,
  delay,
  fade,
  fadeIn,
  grid,
  indicate,
  morphCode,
  pictogram,
  place,
  recolor,
  row,
} from 'vizmatic/stage';
import {
  evidenceSnapshot,
  parserIdentities,
  repairSceneSnapshot,
  repairTrace,
} from '../../../films/sandbox-execution/model.mjs';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { CASES, COLOR, REPORT_XML, reportPanel } from '../parts.mjs';

const ATTEMPT = 'if case.attrib["status"] == "failed":';
const REPAIR = 'if tags & {ns + "failure", ns + "error"}:';

/** One test case in a report of the namespace of the fixture, for an edge case of the contract. */
const one = (children, attributes = 'classname="A" name="x"') =>
  `<testsuite xmlns="urn:junit" xmlns:other="urn:other"><testcase ${attributes}>${children}</testcase></testsuite>`;
const rejected = (xml) => {
  try {
    parserIdentities(xml);
    return false;
  } catch {
    return true;
  }
};

export default function evidenceLoop(s, c) {
  const trace = repairTrace();
  const decisions = evidenceSnapshot(2, 1).decisions;
  // The edge cases of the back half, by the parser of the model.
  assertEqual(parserIdentities(one('<skipped/><error/>')), [], 'skipped wins over error');
  assertEqual(parserIdentities(one('<other:failure/>')), [], 'a foreign failure does not count');
  assertEqual(
    parserIdentities(one('<details><failure/></details>')),
    [],
    'a nested failure does not count',
  );
  assertEqual(
    parserIdentities(one('<failure/><error/>')),
    ['A::x'],
    'failure and error give one identity',
  );
  assertEqual(
    rejected(one('<failure/>', 'classname="A" name=" "')),
    true,
    'a blank name is rejected',
  );
  assertEqual(rejected('<testsuite>'), true, 'malformed XML is rejected');

  // The frame: the report at the top, the work of the loop at the lower left, the output at the lower right.
  const [top, bottom] = area.rows([3, 5], 'normal');
  const [work, output] = bottom.columns([3, 2], 'wide');
  const [lookupBand, body] = work.rows([1, 4], 'normal');

  // The report, and the verdict of the repaired parser beside each test case.
  const report = reportPanel(REPORT_XML, CASES);
  place(report.block, top, 'left');
  const kept = decisions.map((decision) => decision.decision.startsWith('retain'));
  const verdicts = decisions.map((decision, i) =>
    beside(
      label(decision.decision, { size: 32, color: kept[i] ? COLOR.pass : COLOR.quiet }),
      report.block,
      'right',
      'wide',
      report.line(i),
    ),
  );

  // The expected output: the rows of the contract, which the result must match.
  const expectedRows = ['ReportParser::rejectsFailure', 'ReportParser::handlesError'];
  assertEqual(parserIdentities(REPORT_XML), expectedRows, 'both fixture rows match in order');
  const expected = expectedRows.map((text, i) => ({
    number: mono(String(i + 1), { size: 30, color: COLOR.quiet }),
    identity: mono(text, { size: 30, color: COLOR.quiet }),
    check: pictogram('check', { size: 40, accent: COLOR.pass }),
  }));
  const outputTitle = note('expected output');
  const passed = label(`fixture ${repairSceneSnapshot(2).status}`, { size: 34, color: COLOR.pass });
  const narrow = note('other XML producers need their own cases');
  place(
    column(
      [
        outputTitle,
        grid(
          expected.flatMap((entry) => [entry.number, entry.identity, entry.check]),
          { columns: 3, gap: ['normal', 'normal'] },
        ),
        passed,
        narrow,
      ],
      { gap: 'normal' },
    ),
    output,
    'top left',
  );

  // Beat 0, at the lower left: the contract. Its four rules are quiet, and each lights with its clause.
  const contractTitle = note('the contract of this fixture');
  const className = mono('class::name', { color: COLOR.quiet });
  const rules = {
    failed: label('report failed or errored tests', { color: COLOR.quiet }),
    as: label('as', { color: COLOR.quiet }),
    order: label('in first-seen order', { color: COLOR.quiet }),
    dedupe: label('with no duplicate pair', { color: COLOR.quiet }),
  };
  const contract = place(
    column(
      [
        contractTitle,
        rules.failed,
        row([rules.as, className], { gap: 'tight' }),
        rules.order,
        rules.dedupe,
      ],
      { gap: 'normal' },
    ),
    work,
    'top left',
  );

  s.add(heading(c.title), report.block, contract, outputTitle);

  const tint = (glyphs, color) => glyphs.map((glyph) => recolor(glyph, color, { duration: 0.3 }));
  const light = (node, color = 'ink') => recolor(node, color, { duration: 0.3 });
  const failing = CASES.flatMap((test, i) =>
    kept[i] || test.children[0] === 'failure' ? [i] : [],
  );
  c.on('ev-fixture', () => s.play(light(rules.failed)));
  c.on('ev-failed', () =>
    s.play(
      ...failing.flatMap((i) => tint(report.children(i), COLOR.mark)),
      ...tint(report.children(3), COLOR.quiet),
    ),
  );
  c.show(
    'ev-identity',
    expected.map((entry) => entry.identity),
  );
  c.on('ev-identity', () =>
    s.play(
      light(rules.as),
      light(className, COLOR.evidence),
      ...CASES.flatMap((_, i) => tint(report.children(i), COLOR.evidence)),
      ...failing.flatMap((i) => tint(report.identity(i), COLOR.mark)),
    ),
  );
  c.show(
    'ev-order',
    expected.map((entry) => entry.number),
  );
  c.on('ev-order', () => s.play(light(rules.order)));
  // X2 has the identity of X1: it goes quiet.
  c.on('ev-dedupe', () =>
    s.play(light(rules.dedupe), fade(report.line(1), 0.35, { duration: 0.4 })),
  );

  // Beat 1: attempt 1 looks for `status` in X1 and finds none. The evidence packet fills.
  const attempt = place(codeBlock(ATTEMPT, { language: 'python', size: 32 }), lookupBand, 'left');
  const lookup = attempt.find('case.attrib["status"]', 0);
  const keyError = beside(
    mono(trace.first.error, { size: 30, color: COLOR.fail }),
    report.block,
    'right',
    'wide',
    report.line(0),
  );
  const fields = [
    ['ev-command', 'command', 'python parse.py report.xml'],
    ['ev-exit', 'exit code', '1'],
    ['ev-error', 'exception', trace.first.error],
    ['ev-excerpt', 'stderr tail', trace.first.error + ' ↵'],
  ].map(([cue, name, value]) => ({
    cue,
    name: note(name),
    value: mono(value, { size: 30, color: COLOR.evidence }),
  }));
  const packetTitle = note('the evidence for the next attempt, cut at a byte limit');
  const packet = place(
    column(
      [
        packetTitle,
        grid(
          fields.flatMap((field) => [field.name, field.value]),
          { columns: 2, gap: ['wide', 'tight'] },
        ),
      ],
      { gap: 'normal' },
    ),
    body,
    'top left',
  );
  c.swap(1, contract, attempt);
  c.onBeat(1, () =>
    s.play(
      ...failing.flatMap((i) => tint(report.identity(i), COLOR.evidence)),
      fade(report.line(1), 1, { duration: 0.4 }),
    ),
  );
  c.on('ev-asks', () =>
    s.play(report.focus(0, { color: COLOR.mark, duration: 0.4 }), ...tint(lookup, COLOR.mark)),
  );
  c.after('ev-missing', () =>
    s.play(report.focus(0, { color: COLOR.fail, duration: 0.3 }), ...tint(lookup, COLOR.fail)),
  );
  c.show('ev-missing', keyError, { after: true });
  c.show('ev-command', [packetTitle, fields[0].name, fields[0].value]);
  fields.slice(1).forEach((field) => c.show(field.cue, [field.name, field.value]));

  // Beat 2: the lookup morphs into the repair, and the scan bar goes down the four cases.
  const repair = place(codeBlock(REPAIR, { language: 'python', size: 32 }), lookupBand, 'left');
  c.hide('ev-repair', keyError);
  c.on('ev-repair', () =>
    s.play(
      morphCode(attempt, repair, { duration: 0.9 }),
      report.unfocus({ duration: 0.3 }),
      fade(packet, 0.4, { duration: 0.4 }),
    ),
  );
  CASES.forEach((_, i) =>
    c.on(`ev-row-${i}`, () => {
      const row = kept[i] ? expected[kept.slice(0, i).filter(Boolean).length] : null;
      s.play(
        report.focus(i, { color: COLOR.mark, duration: 0.3 }),
        ...tint(report.children(i), kept[i] ? COLOR.mark : COLOR.quiet),
        delay(fadeIn(verdicts[i], { duration: 0.3 }), 0.35),
        ...(row
          ? [
              delay(recolor(row.identity, COLOR.evidence, { duration: 0.3 }), 0.5),
              delay(fadeIn(row.check, { duration: 0.3 }), 0.6),
            ]
          : []),
      );
    }),
  );
  c.on('ev-namespace', () =>
    s.play(indicate(report.namespace, { color: COLOR.mark, duration: 1 })),
  );
  c.after('ev-check', () => s.play(report.unfocus({ duration: 0.4 })));
  c.show('ev-check', passed, { after: true });
  c.show('ev-broader', narrow);

  // Beat 3: eight edge cases go through the same rule. The verdict of each waits for its clause.
  const cases = [
    {
      children: '<skipped/><error/>',
      verdict: 'not reported',
      color: 'ink',
      at: 'ev-skip',
      result: 'ev-skip-wins',
    },
    {
      children: '<other:failure/>',
      verdict: 'does not count',
      color: 'ink',
      at: 'ev-foreign',
      result: 'ev-nocount',
    },
    {
      children: '<details><failure/></details>',
      verdict: 'does not count',
      color: 'ink',
      at: 'ev-nested',
      result: 'ev-nocount',
    },
    {
      children: '<failure/><error/>',
      verdict: 'one identity',
      color: COLOR.pass,
      at: 'ev-both',
      result: 'ev-one',
    },
    {
      children: 'name=" "',
      verdict: 'rejected',
      color: COLOR.fail,
      at: 'ev-blank',
      result: 'ev-blank',
    },
    {
      children: '<testsuite>',
      verdict: 'rejected',
      color: COLOR.fail,
      at: 'ev-malformed',
      result: 'ev-malformed',
    },
    {
      children: 'if case.find(tag):',
      verdict: 'False',
      color: COLOR.fail,
      at: 'ev-truthy',
      result: 'ev-false',
    },
    {
      children: 'case.find(tag) is not None',
      verdict: 'True',
      color: COLOR.pass,
      at: 'ev-exists',
      result: 'ev-exists',
    },
  ].map((entry) => ({
    ...entry,
    snippet: mono(entry.children, { size: 30, color: COLOR.evidence }),
    answer: label(entry.verdict, { size: 34, color: entry.color }),
  }));
  const heads = [note('one test case, or one check'), note('result')];
  place(
    grid([...heads, ...cases.flatMap((entry) => [entry.snippet, entry.answer])], {
      columns: 2,
      gap: ['loose', 'tight'],
    }),
    work,
    'top left',
  );
  c.swap('ev-edge', [repair, packet], heads);
  c.on('ev-edge', () => s.play(indicate(report.namespace, { color: COLOR.mark, duration: 1 })));
  for (const entry of cases) {
    c.show(entry.at, entry.snippet);
    c.show(entry.result, entry.answer, { after: true });
  }
  // The first occurrence stays: X1 and X2 share one identity.
  c.on('ev-first', () =>
    s.play(
      ...[0, 1].flatMap((i) =>
        report.identity(i).map((glyph) => indicate(glyph, { color: COLOR.mark, duration: 1.2 })),
      ),
      indicate(verdicts[1], { color: COLOR.mark, duration: 1.2 }),
    ),
  );
}
