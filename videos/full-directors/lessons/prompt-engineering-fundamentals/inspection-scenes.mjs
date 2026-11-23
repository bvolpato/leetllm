import { readFileSync } from 'node:fs';
import {
  C,
  title,
  rect,
  line,
  txt,
  label,
  result,
  sheet,
  cue,
  arrow,
  codeReply,
  circle,
} from './art.mjs';
import { facts, good } from '../../../films/prompt-engineering-fundamentals/fixtures.mjs';
import {
  expectedFields,
  responseChecks,
} from '../../../films/prompt-engineering-fundamentals/model.mjs';
import { maskedProbabilities } from '../../../films/prompt-engineering-fundamentals/arithmetic.mjs';
import { offeredDeadline } from './clock-scenes.mjs';

export const calls = JSON.parse(readFileSync(new URL('./validator-calls.json', import.meta.url)));
export function replyState(k) {
  const i = k.beat.beatIndex;
  const changed = cue(k, 2, 'to ninety') > 0;
  const fields = { ...good, deadline_minutes: changed ? offeredDeadline : good.deadline_minutes };
  const lines =
    1 +
    [
      'Print the action',
      'then the deadline',
      'the overdue flag',
      'and the source line',
      'The closing brace',
    ].filter((s) => cue(k, 0, s) > 0).length;
  const raw = JSON.stringify(fields);
  const checks = responseChecks(lines === 6 ? raw : raw.slice(0, -1));
  const count =
    i === 0
      ? 0
      : i === 1
        ? ['Parse the text', 'Check the four fields', 'Compare each field'].filter(
            (s) => cue(k, 1, s) > 0,
          ).length
        : changed && !cue(k, 2, 'This is the first check')
          ? 2
          : 3;
  return { fields, lines, checks, count, changed };
}
export function reply(c, k) {
  title(c, 'Where does the reply first disagree?');
  const r = replyState(k);
  sheet(c, 95, 245, 1006, 579);
  label(c, 'ASSISTANT REPLY    /    I-12', 150, 325, C.blue);
  codeReply(c, r.fields, 150, 401, {
    size: 39,
    lines: r.lines,
    hot: r.changed ? 'deadline_minutes' : '',
    hotColor: r.count === 3 ? C.red : C.blue,
  });
  sheet(c, 1195, 245, 621, 579);
  label(c, 'AUTHENTICATED RUNBOOK', 1238, 325, C.green);
  txt(c, facts.sourceId, 1238, 432, 71, C.green, 'Serif');
  txt(c, 'First page within', 1238, 508, 48, C.ink, 'Serif');
  txt(c, facts.deadline + ' minutes of', 1238, 578, 54, C.green, 'Serif');
  txt(c, 'P1 declaration.', 1238, 641, 48, C.ink, 'Serif');
  line(c, 1238, 693, 1750, 693, C.hair, 2);
  txt(c, '12 min   /   unpaged', 1238, 762, 35, C.muted, 'Mono');
  if (r.changed && cue(k, 2, 'Follow that field')) {
    const y = 401 + 2 * 59;
    const color = r.count === 3 ? C.red : C.blue;
    line(c, 766, y - 10, 1136, y - 10, color, 4);
    line(c, 1136, y - 10, 1136, 560, color, 4);
    arrow(c, 1136, 560, 1224, 560, color, 4);
  }
  const verdicts = [r.checks.parse, r.checks.schema, r.checks.policy];
  ['Parse', 'Schema', 'Trusted policy'].forEach((s, j) => {
    const x = 117 + 590 * j,
      done = r.count > j;
    circle(c, x + 15, 857, 14, done ? (verdicts[j] ? C.green : C.red) : C.hair);
    txt(c, s, x + 46, 871, 42, C.ink, 'Serif');
    if (done)
      txt(
        c,
        verdicts[j] ? 'PASS' : 'FAIL',
        x + 430,
        871,
        33,
        verdicts[j] ? C.green : C.red,
        'Mono',
        'right',
      );
  });
}

export const grammars = [
  { names: ['{', '[', '`', 'H'], logits: [2, 1, 0, -0.5], legal: [true, false, false, false] },
  { names: ['A', 'B', 'X'], logits: [1, 0, 2], legal: [true, true, false] },
];
export function distribution(g) {
  const base = maskedProbabilities(
    g.logits,
    g.logits.map(() => true),
  );
  const after = maskedProbabilities(g.logits, g.legal);
  const peak = Math.max(...g.logits.filter((_, j) => g.legal[j]));
  const retained = base.map((p, j) => (g.legal[j] ? p : 0));
  const centered = g.logits.map((v, j) => (g.legal[j] ? v - peak : -Infinity));
  const weights = centered.map(Math.exp);
  return { base, after, retained, centered, weights };
}
export function grammar(c, k) {
  const i = k.beat.beatIndex;
  if (i < 2) {
    title(c, 'What can the output format enforce?');
    const show = [true, cue(k, 0, 'JSON mode'), cue(k, 0, 'A strict schema')];
    const field = '{"deadline_minutes":';
    const rows = [
      ['Prompt only', 'Within ninety minutes.'],
      ['JSON syntax', '{"deadline_minutes":"soon"}'],
      ['Integer field', field + offeredDeadline + '}'],
    ];
    rows.forEach(([s, v], j) => {
      if (!show[j]) return;
      const y = 267 + j * 165;
      label(c, s.toUpperCase(), 130, y + 51, C.blue);
      rect(c, 565, y - 8, 1190, 104, C.white, 5);
      txt(c, v, 611, y + 61, 48, C.ink, 'Mono');
    });
    if (i === 1 && k.reveal('Ninety fits that field', 0)) {
      // Measure the digits in the JSON row with the same font that drew it.
      const left = 611 + c.measureText(field).width;
      const width = c.measureText(String(offeredDeadline)).width;
      const center = left + width / 2;
      line(c, left, 673, left + width, 673, C.blue, 7);
      txt(c, 'Fits integer type', 1714, 658, 40, C.blue, 'Serif', 'right');
      if (k.reveal('Compare it with the runbook', 0)) {
        line(c, center, 679, center, 732, C.blue, 4);
        label(c, 'RUNBOOK', 130, 806, C.green);
        rect(c, 565, 742, 1190, 92, C.white, 5);
        txt(c, facts.sourceId + ' deadline (min)', 611, 807, 46, C.ink, 'Serif');
        const named = k.reveal('thirty', 0, { captionStart: false });
        txt(c, named ? facts.deadline : '?', center, 807, 52, C.green, 'Mono', 'center');
        if (named && offeredDeadline !== facts.deadline)
          txt(c, 'Mismatch', 1714, 807, 42, C.red, 'Serif', 'right');
      }
      if (k.reveal('Route refusals', 0))
        txt(c, 'Refused or incomplete → review', 565, 917, 46, C.ink, 'Serif');
    }
    return;
  }
  if (i <= 5) {
    const object = i <= 3,
      g = grammars[object ? 0 : 1],
      { base, after, retained, centered, weights } = distribution(g);
    const mask = object ? cue(k, 2, 'Keep the opening brace', 1) : cue(k, 4, 'Mask X', 1);
    const shifted = !object && cue(k, 4, 'Subtract the largest legal logit');
    const intermediate = object ? retained : weights;
    const showIntermediate = object ? mask : cue(k, 4, 'Exponentiate');
    const sum = intermediate.reduce((a, b) => a + b, 0);
    const normalized = object
      ? i === 3 && k.reveal('one. Stop right there', 0, { captionStart: false })
      : cue(k, 5, 'This calculation');
    const dividing = object && cue(k, 3, 'Divide that probability');
    title(
      c,
      object ? 'Which character can start this object?' : 'How do A and B share the next token?',
      true,
    );
    const xs = [135, 349, 714, 1040, 1538];
    [
      'Token',
      shifted ? 'Centered logit' : 'Logit',
      'P before',
      object ? 'Retained P' : 'Unnormalized weight',
      'P after',
    ].forEach((s, j) => label(c, s, xs[j], 290, C.mint, 30));
    g.names.forEach((name, j) => {
      const y = 403 + j * 121,
        dead = mask && !g.legal[j];
      line(c, 130, y + 43, 1790, y + 43, '#496068', 2);
      txt(c, name, xs[0], y, 61, C.light, 'Mono');
      txt(
        c,
        dead ? '−∞' : shifted ? centered[j] : g.logits[j],
        xs[1],
        y,
        47,
        dead ? C.peach : C.light,
        'Mono',
      );
      txt(c, base[j].toFixed(3), xs[2], y, 46, C.sky, 'Mono');
      rect(c, xs[2], y + 15, 200 * base[j], 11, C.sky, 3);
      if (showIntermediate)
        txt(c, intermediate[j].toFixed(3), xs[3], y, 46, dead ? C.peach : C.mint, 'Mono');
      const rowReady =
        normalized ||
        (!object && ((j === 0 && cue(k, 5, 'B gets')) || (j === 1 && cue(k, 5, 'X gets zero'))));
      if (rowReady) {
        txt(c, after[j].toFixed(3), xs[4], y, 46, dead ? C.peach : C.mint, 'Mono');
        rect(c, xs[4], y + 15, 211 * after[j], 11, C.mint, 3);
      }
    });
    if (object && showIntermediate) {
      const part = retained[0].toFixed(3);
      const note = dividing
        ? part + ' / ' + sum.toFixed(3) + (normalized ? ' = 1' : ' = ?')
        : 'Total retained probability   ' + sum.toFixed(3);
      txt(c, note, 130, 913, 43, C.light, 'Mono');
      if (cue(k, 3, 'Stop right there'))
        txt(c, 'Prefix {   /   incomplete object', 1789, 913, 38, C.brass, 'Mono', 'right');
    }
    if (!object && cue(k, 4, 'Divide each weight'))
      txt(c, 'Sum of weights ≈ ' + sum.toFixed(3), 130, 873, 44, C.light, 'Mono');
    return;
  }
  title(c, 'One token can close two structures', true);
  const replay = i === 7;
  const pushedObject = replay ? cue(k, 7, 'the object opens') : 1;
  const pushedArray = replay ? cue(k, 7, 'then the array') : 1;
  const first = replay ? cue(k, 7, 'its closer arrives') : cue(k, 6, 'closes the array first');
  const second = replay
    ? cue(k, 7, 'then pop the object')
    : cue(k, 6, 'then the surrounding object');
  const prefix = '{"a":[';
  label(c, 'DECODED PREFIX', 128, 329, C.mint);
  txt(
    c,
    (pushedArray ? prefix : pushedObject ? '{' : '') + (first ? ']' : '') + (second ? '}' : ''),
    128,
    495,
    101,
    C.light,
    'Mono',
  );
  label(c, 'CLOSING TOKEN', 128, 682, C.mint);
  txt(c, ']}', 128, 819, 85, C.brass, 'Mono');
  label(c, 'NESTING STACK', 1040, 329, C.mint);
  const states = [
    ['object', '}', second],
    ['array', ']', first],
  ];
  states.forEach(([s, closer, pop], j) => {
    if (!(j ? pushedArray : pushedObject)) return;
    const y = 621 - j * 132;
    rect(c, 1036 + 100 * pop, y, 565, 99, pop ? C.night : C.sky, 5);
    txt(
      c,
      pop ? s + ' closed' : s + '  →  ' + closer,
      1081 + 100 * pop,
      y + 69,
      44,
      pop ? C.mint : C.ink,
      'Mono',
    );
  });
  txt(
    c,
    'Open structures   ' +
      (Number(Boolean(pushedObject)) +
        Number(Boolean(pushedArray)) -
        Number(Boolean(first)) -
        Number(Boolean(second))),
    1040,
    854,
    40,
    C.light,
    'Mono',
  );
}
export function strict(c, k) {
  const i = k.beat.beatIndex;
  if (i < 3) {
    title(
      c,
      [
        'What did the sender actually supply?',
        'Does true fit the deadline field?',
        'Which fields can the validator accept?',
      ][i],
    );
    sheet(c, 122, 239, 1670, 634);
    label(c, 'PAGING VALIDATOR    /    PYTHON', 182, 322, C.blue);
    if (i === 0) {
      const sample = calls[0],
        pairs = [...sample.raw.matchAll(/"deadline_minutes": (\d+)/g)];
      pairs.forEach(([s], j) =>
        txt(c, s + (j === 0 ? ',' : ''), 183, 454 + j * 98, 55, j ? C.red : C.ink, 'Mono'),
      );
      if (cue(k, 0, 'rejects every duplicate')) result(c, sample.verdict, 183, 737, C.red, 61);
      if (cue(k, 0, 'nonstandard constants'))
        txt(c, 'NaN → invalid_json', 1023, 737, 40, C.red, 'Mono');
    } else if (i === 1) {
      txt(
        c,
        '"deadline_minutes": ' + JSON.parse(calls[1].raw).deadline_minutes,
        182,
        465,
        60,
        C.ink,
        'Mono',
      );
      txt(c, 'type(True) = bool', 182, 597, 46, C.red, 'Mono');
      if (cue(k, 1, 'Test the actual type')) result(c, calls[1].verdict, 182, 751, C.red, 60);
    } else {
      const schema = [
        ['action', 'page_on_call | needs_review'],
        ['deadline_minutes', 'nonnegative integer | null'],
        ['overdue', 'boolean | null'],
        ['source_line_ids', 'array of strings'],
      ];
      schema.forEach(([s, v], j) => {
        txt(c, s, 184, 441 + j * 107, 43, C.blue, 'Mono');
        txt(c, v, 867, 441 + j * 107, 42, C.ink, 'Mono');
      });
    }
    return;
  }
  if (i <= 4) {
    const missing = cue(k, 3, 'Take away the rule');
    const f = { ...facts, ruleAvailable: !missing };
    title(c, 'When does the contract hand back the case?');
    label(c, 'REFERENCE FACTS', 135, 299);
    [
      'Severity   P1',
      'Elapsed    12 min',
      'Page sent  false',
      missing ? 'Runbook    missing' : 'Runbook    IR-7',
    ].forEach((s, j) =>
      txt(c, s, 135, 415 + j * 99, 42, j === 3 ? (missing ? C.red : C.green) : C.ink, 'Mono'),
    );
    arrow(c, 742, 530, 908, 530, C.muted);
    sheet(c, 953, 240, 822, 607);
    codeReply(c, expectedFields(f), 991, 372, { size: 35 });
    if (i === 4) result(c, 'Test the fallback against the trusted snapshot.', 136, 820, C.ink, 50);
    return;
  }
  const at31 = cue(k, 5, 'Now call it with thirty-one');
  const correct = cue(k, 6, 'Correct it');
  const row = correct ? calls[4] : at31 ? calls[3] : calls[2];
  const expectedKnown = at31
    ? cue(k, 6, 'At thirty-one minutes')
    : cue(k, 5, 'It accepts the reply');
  const failed = i === 6 && k.elapsed >= k.wordCue('The second call reports a contradiction').end;
  const answered = correct ? cue(k, 6, 'These calls test code') : at31 ? failed : expectedKnown;
  title(c, 'Run the same reply across the boundary');
  sheet(c, 108, 244, 991, 610);
  label(c, 'SUPPLIED REPLY', 159, 328);
  codeReply(c, JSON.parse(row.raw), 157, 426, { size: 37, hot: 'overdue', hotColor: C.blue });
  label(c, 'TRUSTED SNAPSHOT    /    IR-7', 1160, 332, C.green);
  txt(c, row.elapsed + ' > ' + facts.deadline, 1160, 468, 79, C.ink, 'Mono');
  txt(
    c,
    expectedKnown ? 'expected ' + (row.elapsed > facts.deadline) : 'expected ?',
    1160,
    575,
    47,
    expectedKnown ? C.green : C.ink,
    'Mono',
  );
  line(c, 1160, 645, 1809, 645, C.hair);
  result(
    c,
    answered
      ? row.verdict
      : correct
        ? 'Checking true…'
        : at31
          ? 'Will false pass?'
          : 'Checking false…',
    1160,
    755,
    !answered ? C.ink : row.verdict === 'accepted' ? C.green : C.red,
    47,
  );
  if (i === 7) {
    txt(c, 'These calls test the validator.', 1160, 793, 38, C.ink, 'Serif');
    txt(c, 'Evaluate model replies separately.', 1160, 832, 38, C.ink, 'Serif');
  }
}
