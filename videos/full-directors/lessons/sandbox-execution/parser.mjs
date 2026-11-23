import assert from 'node:assert/strict';
import { parseReport } from '../../../films/sandbox-execution/arithmetic.mjs';
import { REPORT_XML, FRESH_REPORT_XML } from '../../../films/sandbox-execution/fixtures.mjs';
import { initialParser } from '../../../films/sandbox-execution/model.mjs';
import { C, rect, line, label, mono, cap, panel, page, frame, tag, result, cue, arrow } from './art.mjs';

export const cases = parseReport(REPORT_XML);
export const fresh = parseReport(FRESH_REPORT_XML);
export const expected = Object.freeze(['ReportParser::rejectsFailure', 'ReportParser::handlesError']);
const failure = initialParser(cases);
const stderr = Buffer.from('Reading report.xml\n' + REPORT_XML.split('\n')[1].trim() + '\n' + failure.error);
const firstLineBytes = Buffer.byteLength('Reading report.xml\n');
const lastLineBytes = Buffer.byteLength(failure.error);
const excerpt = {
  head: stderr.subarray(0, firstLineBytes).toString().trimEnd(),
  omitted: stderr.length - firstLineBytes - lastLineBytes,
  tail: stderr.subarray(-lastLineBytes).toString(),
};
export function scan(tests) {
  const rows = [],
    actions = [],
    seen = new Set();
  for (const test of tests) {
    const tags = test.children
      .filter((child) => (child.namespace ?? '') === test.namespace)
      .map((child) => child.tag);
    let action;
    if (tags.includes('skipped')) action = 'Skipped';
    else if (!tags.some((tag) => tag === 'failure' || tag === 'error')) action = 'No direct status';
    else {
      if (!test.className?.trim() || !test.name?.trim()) throw Error('Missing class or name');
      const key = JSON.stringify([test.className, test.name]);
      if (seen.has(key)) action = 'Already kept';
      else {
        seen.add(key);
        rows.push(test.className + '::' + test.name);
        action = 'Keep row ' + rows.length;
      }
    }
    actions.push(action);
  }
  return { rows, actions };
}
export const repaired = scan(cases).rows;
function resultLines(c, rows, x, y, w) {
  if (!rows.length) {
    mono(c, '[ ]', x, y + 50, 68);
    return;
  }
  rows.forEach((row, i) => {
    const [klass, name] = row.split('::');
    cap(c, klass + ' ::', x, y + i * 101);
    mono(c, name, x, y + 50 + i * 101, 49, { color: C.teal, max: w });
  });
}
function xmlCase(c, test, x, y, w, h, focus) {
  page(c, x, y, w, h);
  cap(c, 'report.xml   /   first testcase', x + 38, y + 62);
  line(c, x + 38, y + 91, x + w - 50, y + 91);
  const code = [
    '<testcase',
    '  classname="' + test.className + '"',
    '  name="' + test.name + '">',
    '    <' + test.children[0].tag + '/>',
    '</testcase>',
  ];
  code.forEach((row, i) => {
    const yy = y + 166 + i * 69;
    if (focus === 'child' && i === 3) rect(c, x + 25, yy - 44, w - 55, 63, C.pale);
    if (focus === 'attributes' && (i === 1 || i === 2)) rect(c, x + 25, yy - 44, w - 55, 63, '#f5ecd1');
    mono(c, row, x + 38, yy, 43, { max: w - 75, color: focus === 'child' && i === 3 ? C.teal : C.ink });
  });
}
export function opening(c, clock) {
  const b = clock.beat.beatIndex;
  const broken = cue(clock, 0, 'KeyError');
  const selected = cue(clock, 2, 'Inside the case');
  frame(
    c,
    'Parser trace   /   run 01',
    b === 3 ? 'What may the repair run touch?' : 'Where did the parser stop?',
  );
  xmlCase(
    c,
    cases[0],
    75,
    265,
    865,
    504,
    selected ? 'child' : cue(clock, 0, 'looks up status') ? 'attributes' : null,
  );
  const x = 987;
  if (b < 3) {
    panel(c, x, 265, 855, 504, C.navy, C.navy);
    cap(c, 'GENERATED PARSER', x + 40, 332, { color: '#a4c6c3' });
    mono(c, 'case.attrib["status"]', x + 40, 441, 54, { color: C.white, max: 768 });
    line(c, x + 40, 494, x + 810, 494, '#60767b');
    if (broken) {
      mono(c, failure.error, x + 40, 595, 53, { color: '#ffb492', max: 768 });
      label(
        c,
        b === 1
          ? 'Which part of the case would you inspect?'
          : selected
            ? 'Check the direct child tag.'
            : 'Stopped at the first lookup.',
        x + 40,
        690,
        36,
        { color: C.white, max: 756 },
      );
    } else label(c, 'Reading the first case…', x + 40, 608, 37, { color: '#d4e8dd' });
    if (b === 1) result(c, 'Find the outcome in the input.', 'same file   /   same case');
    if (selected) result(c, 'Change the lookup. Keep this report.', 'candidate revision 02');
  } else {
    panel(c, x, 265, 855, 504, C.navy, C.navy);
    cap(c, 'SUPERVISOR GRANTS', x + 45, 331, { color: '#a4c6c3' });
    [
      ['Report', 'read only'],
      ['Scratch', 'read + write'],
      ['Outbound network', 'closed'],
    ].forEach(([a, v], i) => {
      label(c, a, x + 45, 424 + i * 107, 43, { color: C.white });
      mono(c, v, x + 805, 424 + i * 107, 37, { color: '#a5dfc4', align: 'right' });
      line(c, x + 45, 453 + i * 107, x + 805, 453 + i * 107, '#586d73', 2);
    });
    result(c, 'Return bounded evidence to the repair loop.', 'worker scope   /   enforced outside');
  }
}
const scanCues = ['Keep the first failure', 'Drop its duplicate', 'Keep the error', 'Skip the last case'];
export function scannedCount(clock) {
  return scanCues.filter((word) => cue(clock, 2, word)).length;
}
export function scanPage(c, tests, n, { freshCase = false } = {}) {
  const state = scan(tests.slice(0, n));
  page(c, 75, 266, 1070, 507);
  cap(c, 'REPORT ORDER   /   ' + tests[0].className, 114, 327);
  cap(c, 'DIRECT CHILDREN', 561, 327);
  cap(c, 'DECISION', 894, 327);
  tests.forEach((t, i) => {
    const yy = 405 + i * 96;
    if (i < n) rect(c, 91, yy - 46, 1039, 69, i === n - 1 ? C.pale : '#ebeee4');
    mono(c, t.name, 111, yy, 38, { max: 390 });
    const tags = t.children.map((ch) => ch.tag).join(' + ');
    mono(c, tags, 561, yy, 33, { max: 305 });
    if (i < n)
      label(c, state.actions[i], 894, yy, 30, {
        max: 232,
        color: state.actions[i].startsWith('Keep') ? C.teal : C.muted,
      });
    if (freshCase && t.children.some((ch) => ch.tag === 'details'))
      mono(c, '↳ failure', 604, yy + 36, 24, { color: C.muted });
  });
  panel(c, 1190, 266, 651, 507);
  cap(c, 'RETURNED ROWS', 1229, 329);
  if (!n) label(c, '?', 1512, 556, 132, { face: 'Serif', align: 'center', color: C.ochre });
  else resultLines(c, state.rows, 1231, 428, 569);
  return state;
}
export function feedback(c, clock) {
  const b = clock.beat.beatIndex;
  frame(
    c,
    'Repair loop   /   same report',
    b === 1
      ? 'What evidence reaches the agent?'
      : b === 4
        ? 'Which inputs must the parser reject?'
        : 'Which cases earn an output row?',
  );
  if (b === 1) {
    page(c, 75, 263, 1031, 524);
    cap(c, 'SUPERVISOR   /   CAPTURED RUN', 115, 328);
    [
      ['Entry point', 'parser report.xml'],
      ['Exit code', '1'],
      ['Exception', failure.error],
    ].forEach(([a, v], i) => {
      const yy = 431 + i * 123;
      label(c, a, 115, yy, 38);
      mono(c, v, 421, yy, 42, { max: 626, color: i ? C.red : C.ink });
      line(c, 115, yy + 29, 1055, yy + 29);
    });
    cap(c, 'BYTE-BOUNDED STREAM', 1173, 332);
    const vals = [excerpt.head, excerpt.omitted + ' bytes omitted', excerpt.tail];
    vals.forEach((v, i) => {
      panel(c, 1170, 375 + i * 115, 667, 85, i === 1 ? C.wall : C.paper);
      mono(c, v, 1203, 432 + i * 115, 40);
    });
    result(c, 'Keep the exception and the fixture.', 'bounded bytes   /   bounded retries');
  } else if (b === 4) {
    const failClass = cue(clock, 4, 'blank class or name'),
      failDoc = cue(clock, 4, 'malformed XML');
    [
      [75, 'Selected failure', 'classname=" "   name="retry"', 'Validate identity', failClass],
      [990, 'Incomplete report', '<testsuite>', 'Parse document', failDoc],
    ].forEach(([x, t, row, op, reject]) => {
      page(c, x, 270, 850, 490);
      cap(c, op.toUpperCase(), x + 36, 338);
      label(c, t, x + 36, 430, 58, { face: 'Serif' });
      mono(c, row, x + 36, 532, 42, { max: 770 });
      if (reject) tag(c, 'Reject input', x + 36, 626, 380, C.red, C.blush);
    });
    result(c, 'Bound the input and the parser.', 'size   /   time   /   memory');
  } else {
    const count = scannedCount(clock),
      state = scanPage(c, cases, count);
    if (b === 0)
      result(c, 'Keep the first occurrence of each failing identity.', 'namespace   /   urn:junit');
    else
      result(
        c,
        b === 3 ? 'Empty <failure/> still counts.' : 'Read direct children in the root namespace.',
        state.rows.length + ' returned   /   ' + count + ' examined',
      );
  }
}
const manifest = Object.freeze({
  Job: 'J24',
  Base: 'R7',
  Files: 'P2',
  Image: 'I7',
  Dependencies: 'D3',
  Grader: 'G1',
});
const submission = { ...manifest, Image: 'I8' };
function matches(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
function validFor(record, inputs) {
  return Object.keys(record).every((k) => record[k] === inputs[k]);
}
export function comparison(clock) {
  const fixed = cue(clock, 3, 'Here come the two repaired rows');
  const empty = cue(clock, 1, 'returns an empty list');
  const send = fixed
    ? cue(clock, 3, 'Here come the two repaired rows', 1.05)
    : cue(clock, 1, 'Follow that answer', 1.05);
  const returned = fixed ? repaired : empty ? [] : null;
  const judged = fixed ? cue(clock, 3, 'They match') : cue(clock, 2, 'They differ');
  return {
    returned,
    send,
    verdict: judged && returned !== null ? (matches(returned, expected) ? 'Pass' : 'Reject') : null,
  };
}
export function authority(c, clock) {
  const b = clock.beat.beatIndex;
  if (b >= 4) {
    const changed = cue(clock, 4, 'I eight'),
      checked = cue(clock, 5, 'Retest on I eight');
    const now = changed ? submission : manifest;
    frame(c, 'Protected receipt   /   acceptance', 'Does the receipt cover this submission?');
    panel(c, 75, 267, 1768, 494);
    const fields = Object.keys(manifest);
    cap(c, 'INPUT', 115, 352);
    cap(c, 'TESTED', 115, 491);
    cap(c, 'AT ACCEPTANCE', 115, 636);
    fields.forEach((field, i) => {
      const x = 426 + i * 230;
      if (changed && now[field] !== manifest[field]) rect(c, x - 19, 379, 198, 317, C.blush);
      label(c, field, x, 352, 33, { max: 207 });
      mono(c, manifest[field], x, 506, 60);
      mono(c, now[field], x, 651, 60, { color: now[field] !== manifest[field] ? C.red : C.ink });
    });
    line(c, 112, 551, 1799, 551);
    result(
      c,
      checked && !validFor(manifest, now)
        ? 'Retest in the submitted environment.'
        : 'Protected passing record',
      checked ? 'I7 verified   /   I8 untested' : 'test outcome   /   pass',
    );
    return;
  }
  const state = comparison(clock);
  frame(c, 'Grading authority   /   same fixture', 'Who decides whether the answer passes?');
  panel(c, 75, 265, 779, 508, '#f5eadd');
  panel(c, 1063, 265, 780, 508, '#e1efe5');
  cap(c, 'UNTRUSTED WORKER', 111, 332, { color: C.ochre });
  cap(c, 'PROTECTED VALIDATOR', 1103, 332, { color: C.teal });
  label(c, 'Returned answer', 111, 411, 53, { face: 'Serif' });
  label(c, 'Expected answer', 1103, 411, 53, { face: 'Serif' });
  if (state.returned === null) label(c, 'Awaiting output', 111, 557, 41, { color: C.muted });
  else resultLines(c, state.returned, 113, 503, 689);
  resultLines(c, expected, 1104, 503, 692);
  line(c, 958, 251, 958, 788, C.muted, 3);
  arrow(c, 867, 518, 1053, C.ink);
  if (state.returned !== null) {
    const xx = 113 + 987 * state.send;
    rect(c, xx, 682, 699, 83, C.navy);
    const payload = state.returned.length ? state.returned : ['[ ]'];
    payload.forEach((row, i) => mono(c, row, xx + 18, 716 + 33 * i, 28, { color: C.white, max: 662 }));
    rect(c, 898, 552, 120, 46, C.wall);
    mono(c, 'return', 958, 583, 27, { align: 'center', color: C.muted });
  }
  if (state.verdict)
    result(
      c,
      state.verdict === 'Pass' ? 'Pass. Both rows match in order.' : 'Reject. The expected rows are missing.',
      state.verdict === 'Pass' ? 'protected verdict   /   P2' : 'worker exit   /   0',
      state.verdict === 'Pass' ? C.teal : C.red,
    );
  else
    result(
      c,
      b === 0 ? 'Keep grading authority outside the worker.' : 'Compare the returned values and their order.',
      b === 0 ? 'supervisor owns setup and deadline' : cue(clock, 1, 'exits zero') ? 'worker exit   /   0' : 'worker running',
    );
}

export function checkParser() {
  assert(excerpt.omitted > 0);
  assert.equal(excerpt.tail, failure.error);
  assert.equal(failure.error, "KeyError: 'status'");
  assert(!('status' in cases[0].attributes));
  assert.deepEqual(repaired, expected);
  assert.deepEqual(scan(cases).actions, ['Keep row 1', 'Already kept', 'Keep row 2', 'Skipped']);
  assert.deepEqual(scan(fresh), {
    rows: ['payments::retry'],
    actions: ['Keep row 1', 'Skipped', 'No direct status', 'Already kept'],
  });
  assert.deepEqual(
    scan(
      parseReport(
        '<suite xmlns="x"><testcase classname="a" name="b"><failure xmlns="y"/></testcase></suite>',
      ),
    ).rows,
    [],
  );
  assert.throws(
    () => scan(parseReport('<suite><testcase classname=" " name="x"><failure/></testcase></suite>')),
    /Missing/,
  );
  assert.throws(() => parseReport('<testsuite>'));
  assert(!matches([], expected));
  assert(matches(repaired, expected));
  assert(!matches([...repaired].reverse(), expected));
  assert(validFor(manifest, { ...manifest }));
  assert(!validFor(manifest, submission));
}
