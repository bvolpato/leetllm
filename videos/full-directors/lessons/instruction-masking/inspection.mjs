import assert from 'node:assert/strict';
import {
  C,
  rect,
  txt,
  line,
  circle,
  arrow,
  top,
  micro,
  note,
  tape,
  table,
  bracket,
  tag,
  cue,
  gauge,
} from './studio.mjs';

const spelling = '<end>';
const ordinary = Array.from(spelling, (c) => 1000 + c.codePointAt(0));
function owners(g, k) {
  const b = k.beat.beatIndex;
  top(
    g,
    k,
    'SERIALIZATION  /  OWNERSHIP',
    b === 2 || b === 3
      ? 'Two sources produce the same four pieces'
      : 'Who supplied these characters?',
  );
  if (b < 2) {
    const split = cue(k, 1, 'one ordinary ID');
    for (let r = 0; r < 2; r++) {
      const y = 225 + r * 172;
      micro(g, r ? 'QUOTED IN A MANUAL' : 'TEMPLATE ENDING', 62, y);
      txt(g, spelling, 60, y + 53, 54, C.ink, 'left', 'Mono');
      arrow(g, 280, y + 54, 427, y + 54, C.dim);
      if (!r || split)
        tape(g, r ? Array.from(spelling) : ['end'], y + 12, {
          x: 462,
          w: r ? 655 : 169,
          ids: r ? ordinary : [2],
          number: false,
          fill: () => (r ? C.white : C.sea),
        });
      else txt(g, '?', 490, y + 56, 44, C.dim);
    }
    note(g, 'Toy encoder with typed input pieces', 590);
    return;
  }
  if (b < 4) {
    const matches = ['piece 1', 'piece 2', 'piece 3', 'piece 4'];
    for (const [i, who, pos] of [
      [0, 'Manual quotation', 6],
      [1, 'Template boundary', 11],
    ]) {
      const y = 235 + i * 165;
      txt(g, who, 60, y + 40, 32, C.ink, 'left', 'Serif');
      tape(g, matches, y, { x: 411, w: 714, start: pos, fill: () => (i ? C.sea : C.white) });
    }
    note(
      g,
      b === 2
        ? 'What evidence would establish who supplied each match?'
        : 'Compare each match with the span of its source message.',
      598,
    );
    return;
  }
  table(
    g,
    ['Text owner', 'Default encoding', 'Split across transcript'],
    [
      ['Manual quotation', 'end ID', 'ordinary pieces'],
      ['Template ending', 'end ID', 'ordinary pieces'],
    ],
    {
      y: 235,
      rowH: 99,
      fractions: [0.3, 0.3, 0.4],
      colors: (r, c) => (r === 1 && c === 2 ? C.red : C.ink),
    },
  );
  note(
    g,
    b === 4
      ? 'The global edit also changes the genuine ending.'
      : 'Check user content, then verify the serialized boundary.',
    562,
  );
}
const studyCounts = [0, 24, 25];
const sentences = 5;
const trialsPerSentence = 5;
const repliesPerCondition = sentences * trialsPerSentence;
function observations(g, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    top(g, k, 'EVIDENCE  /  TRANSLATION STUDY', 'How often did the whole reply match the test word?');
    const shown = [
      cue(k, 1, 'The marker condition', 0),
      cue(k, 1, 'The third condition', 0),
      cue(k, 1, 'Each dot', 0),
    ];
    const counted = cue(k, 0, 'per condition', 0);
    txt(g, 'Same translation task and competing request for a fixed-word reply', 63, 165, 27);
    for (let r = 0; r < 3; r++) {
      const x = 65 + 370 * r;
      micro(g, ['PLAIN TEXT', 'MARKER PRESENT', 'MARKER AND ENDING'][r], x, 221);
      for (let n = 0; n < repliesPerCondition; n++)
        circle(
          g,
          x + 18 + (n % trialsPerSentence) * 41,
          265 + Math.floor(n / trialsPerSentence) * 42,
          14,
          shown[r] && n < studyCounts[r] ? C.teal : C.fade,
          C.rule,
        );
      if (counted)
        txt(
          g,
          (shown[r] ? studyCounts[r] : '?') + ' / ' + repliesPerCondition,
          x,
          503,
          38,
          C.ink,
          'left',
          'Mono',
        );
    }
    micro(g, 'NORMALIZED WHOLE-REPLY MATCH', 63, 558);
    note(g, 'Ignore case and remove surrounding spaces and periods before comparing.', 599);
    return;
  }
  const hosted = b === 4;
  top(
    g,
    k,
    hosted ? 'EVIDENCE  /  HOSTED SERVICE' : 'EVIDENCE  /  DEPLOYMENT CHECKS',
    'Which observation supports the claim?',
  );
  const rows = hosted
    ? [
        ['Request body', 'messages, tools, controls'],
        ['Reported usage', 'input token count'],
        ['Held-out replies', 'behavior on the hosted path'],
      ]
    : [
        ['Rendered text', 'what the serializer emitted'],
        ['Token IDs + spans', 'what was encoded and who supplied it'],
        ['Held-out replies', 'how the deployed assistant responded'],
      ];
  table(g, ['Evidence', 'Question it can answer'], rows, {
    y: 219,
    rowH: 82,
    fractions: [0.34, 0.66],
    colors: (r, c) => (c === 0 && r === b - 2 ? C.teal : C.ink),
  });
  note(
    g,
    hosted
      ? 'Keep access to request traces restricted.'
      : 'Evaluate behavior on the path people actually use.',
    565,
  );
}
const expected = 'Open<end>',
  loose = '\nOpen   <end>\n';
const normalize = (s) => s.trim().replaceAll(' ', '');
const parityCases = [
  ['Golden', expected, [1, 8, 2]],
  ['Normalize gap', 'Open <end>', [1, 8, 2]],
  ['Add BOS again', expected, [1, 1, 8, 2]],
];
function whitespace(g, k) {
  const b = k.beat.beatIndex;
  top(
    g,
    k,
    'SERIALIZATION  /  WHITESPACE',
    b === 0
      ? 'Which spaces survive a trim?'
      : b === 1
        ? 'Compare bytes and IDs separately'
        : 'Keep a resolved template fixture',
  );
  if (!b) {
    const trim = cue(k, 0, 'Trimming only the outside');
    const visible = (trim ? loose.trim() : loose).replaceAll('\n', '\\n').replaceAll(' ', '·');
    micro(g, trim ? 'AFTER OUTER TRIM' : 'LOOSE RENDER', 63, 225);
    txt(g, visible, 62, 300, 61, C.red, 'left', 'Mono', 500);
    line(g, 60, 367, 1135, 367);
    micro(g, 'EXPECTED RENDER', 63, 410);
    txt(g, expected, 62, 481, 61, C.ink, 'left', 'Mono');
    note(g, 'Each dot is one internal space.', 580);
    return;
  }
  if (b === 1) {
    const extra = cue(k, 1, 'second case');
    table(
      g,
      ['Toy path', 'Rendered bytes', 'IDs'],
      parityCases
        .slice(0, extra ? 3 : 2)
        .map(([name, bytes, ids]) => [name, bytes.replaceAll(' ', '·'), ids.join('   ')]),
      {
        y: 208,
        rowH: 80,
        fractions: [0.31, 0.37, 0.32],
        colors: (r, c) => ((r === 1 && c === 1) || (r === 2 && c === 2) ? C.red : C.ink),
      },
    );
    note(g, 'Compare each column with its own golden value.', 555);
    return;
  }
  table(
    g,
    ['Golden case', 'Inspect'],
    [
      ['Multi-turn and prefill', 'role order and the open tail'],
      ['Unicode and indentation', 'exact bytes and IDs'],
      ['Quoted and empty content', 'ownership and supported schema'],
      ['Revision and clock', 'resolved digest and frozen time'],
    ],
    { y: 202, rowH: 71, fractions: [0.45, 0.55] },
  );
  note(g, 'Pin special-token settings and the truncation policy with the fixture.', 584);
}
function validRoles(roles, fresh = false) {
  const turns = roles[0] === 'S' ? roles.slice(1) : roles;
  return (
    turns.length > 0 &&
    turns.every((r, i) => r === (i % 2 ? 'A' : 'U')) &&
    turns.at(-1) === (fresh ? 'U' : 'A')
  );
}
function schemas(g, k) {
  const b = k.beat.beatIndex;
  top(
    g,
    k,
    'ROW VALIDATION',
    b === 2 ? 'Does a valid role order support the answer?' : 'Which rows are complete?',
  );
  if (b === 2) {
    table(
      g,
      ['Row 005', 'Evidence'],
      [
        ['Role order', 'system → user → assistant'],
        ['Policy P-14', 'Age > 14 days requires a rotation ticket before further use.'],
        ['Assistant answer', '“' + rows[4][2] + '”'],
      ],
      { y: 212, rowH: 86, fractions: [0.27, 0.73] },
    );
    if (cue(k, 2, 'It reverses the rule', 0))
      note(g, 'The roles are valid. The answer waives the ticket that P-14 requires.', 566, C.red);
    return;
  }
  const fresh = b === 1;
  micro(
    g,
    fresh
      ? 'FRESH GENERATION  /  LAST TURN MUST BE USER'
      : 'COMPLETED SFT  /  LAST TURN MUST BE ASSISTANT',
    60,
    193,
  );
  const sets = [['S', 'U', 'A', 'U', 'A'], ['U'], ['U', 'U', 'A'], ['S'], ['U', 'S', 'A'], []];
  sets.forEach((roles, i) => {
    const x = 58 + (i % 2) * 570,
      y = 233 + Math.floor(i / 2) * 108;
    if (roles.length)
      tape(g, roles, y, {
        x,
        w: roles.length * 57,
        h: 61,
        number: false,
        fill: (j) => (roles[j] === 'A' ? C.sea : C.white),
      });
    else txt(g, 'empty row', x, y + 29, 24, C.dim);
    tag(
      g,
      validRoles(roles, fresh) ? 'accept' : 'reject',
      x + 328,
      y + 14,
      120,
      validRoles(roles, fresh) ? C.teal : C.red,
    );
  });
  note(g, 'S = system     U = user     A = assistant', 600);
}
function generation(g, k) {
  const b = k.beat.beatIndex;
  top(
    g,
    k,
    'DEMONSTRATION WORKSHOP',
    b < 2
      ? 'What does the similarity screen measure?'
      : b === 2
        ? 'Vary a question and check its answer'
        : 'Test a generated example',
  );
  if (b < 2) {
    tag(g, 'Human seed tasks', 59, 222, 224, C.dark);
    txt(g, '175', 64, 312, 70, C.ink, 'left', 'Serif');
    arrow(g, 245, 307, 357, 307);
    txt(g, 'Generated tasks', 389, 268, 31, C.ink, 'left', 'Serif');
    txt(g, '“What if the key is 18 days old?”', 388, 324, 22);
    line(g, 60, 390, 1138, 390);
    micro(g, 'SELF-INSTRUCT  /  HISTORICAL SCREEN', 60, 432);
    txt(g, 'ROUGE-L', 61, 494, 36, C.ink, 'left', 'Serif');
    gauge(g, 338, 480, 515, 0.7, C.gold);
    txt(g, '0.7 threshold', 885, 495, 26, C.ink, 'left', 'Mono');
    note(
      g,
      b
        ? 'Near duplicates can go. Policy support still needs review.'
        : 'Check similarity to previously accepted tasks.',
      590,
    );
    return;
  }
  if (b === 2) {
    const follow = cue(k, 2, 'follow-up') > 0;
    micro(g, 'P-14   /   TICKET IF AGE > 14 DAYS', 60, 196);
    const age = follow ? 18 : 14,
      at = (n) => 84 + n * 47;
    line(g, at(0), 352, at(22), 352, C.rule, 6);
    line(g, at(14), 352, at(22), 352, C.red, 6);
    circle(g, at(14), 352, 8, C.paper, C.red, 3);
    for (const n of [0, 7, 14, 18, 22]) txt(g, n, at(n), 392, 25, C.dim, 'center', 'Mono');
    txt(
      g,
      follow
        ? 'Follow-up: a second key is 18 days old.'
        : 'Variation: this key is exactly 14 days old.',
      58,
      258,
      39,
      C.ink,
      'left',
      'Serif',
    );
    circle(g, at(age), 322, 9, C.ink);
    line(g, at(age), 326, at(age), 347, C.ink, 3);
    txt(g, age + ' days', at(age), 292, 21, C.ink, 'center', 'Mono');
    const verdict = !follow || cue(k, 2, 'That key needs', 0);
    txt(
      g,
      verdict
        ? age > 14
          ? 'Ticket required before use'
          : 'The age clause does not trigger'
        : 'What action does P-14 require for the second key?',
      60,
      494,
      36,
      verdict ? (age > 14 ? C.red : C.teal) : C.ink,
      'left',
      'Serif',
    );
    return;
  }
  table(
    g,
    ['Isolated run', 'Review decision'],
    [
      ['Pass / fail', 'inspect the tested behavior'],
      ['Timeout / inconsistent', 'hold the row for review'],
      ['Judge disagreement', 'compare the answer with the source'],
    ],
    { y: 210, rowH: 82, fractions: [0.4, 0.6] },
  );
  note(g, 'Keep the evidence, prompt, test result and accepted row together.', 565);
}
const rows = [
  [
    '001',
    'stale key',
    'Open a rotation ticket before further use because the key is older than 14 days.',
    true,
  ],
  ['002', 'stale key', 'Keep using the key and rotate it within 30 days.', false],
  ['003', 'admin', 'Escalate temporary admin access for reviewer approval under policy P-7.', true],
  ['004', 'stale key', 'Keys older than 14 days need a rotation ticket before further use.', true],
  ['005', 'stale key', 'Even after 14 days, no rotation ticket is required.', false],
];
function passes([, kind, answer]) {
  const text = answer.toLowerCase();
  const req =
    kind === 'admin' ? ['reviewer approval', 'policy p-7'] : ['14 days', 'rotation ticket'];
  return (
    req.every((s) => text.includes(s)) &&
    !text.includes(kind === 'admin' ? 'auto-approve' : '30 days')
  );
}
const acceptedRows = rows.filter((row) => passes(row) && row[3]);
const coverageRows = [
  ['stale key', 'Stale key (P-14)'],
  ['admin', 'Temporary admin (P-7)'],
  ['source citation', 'source citation'],
].map(([kind, label]) => {
  const ids = acceptedRows.filter((row) => row[1] === kind).map((row) => row[0]);
  return [label, ids.join('   ') || 'none', ids.length];
});
function review(g, k) {
  const b = k.beat.beatIndex;
  if (b < 3) {
    top(g, k, 'SOURCE REVIEW  /  P-14', 'Can a false answer pass the word screen?');
    micro(g, 'POLICY CLAUSE', 60, 204);
    txt(
      g,
      'Older than 14 days → rotation ticket before further use',
      60,
      249,
      34,
      C.teal,
      'left',
      'Serif',
    );
    rect(g, 60, 308, 1080, 142, C.white, C.rule);
    micro(g, 'CANDIDATE 005', 82, 340);
    const answer = rows[4][2];
    g.font = '400 34px "Lesson Serif"';
    const mark = (word, color) => {
      const start = answer.indexOf(word);
      const left = 81 + g.measureText(answer.slice(0, start)).width;
      rect(g, left - 2, 379, g.measureText(word).width + 4, 44, color);
    };
    if (b > 0) {
      mark('14 days', C.sea);
      mark('rotation ticket', C.sea);
    }
    if (b === 2 && cue(k, 2, 'word no')) mark('no', C.rose);
    txt(g, answer, 81, 401, 34, C.ink, 'left', 'Serif');
    if (cue(k, 1, 'screen passes it', 0))
      tag(g, passes(rows[4]) ? 'Word screen   PASS' : 'Word screen   FAIL', 60, 498, 244);
    if (b === 2 && cue(k, 2, 'reviewer rejects')) {
      tag(g, 'Source review   REJECT', 334, 498, 280, C.red);
      note(g, '“No” reverses the required action.', 600, C.red);
    } else
      note(
        g,
        b
          ? 'Both required strings occur in this answer.'
          : 'Requires “14 days” and “rotation ticket”. Excludes “30 days”.',
        595,
      );
    return;
  }
  top(g, k, 'SOURCE REVIEW  /  ACCEPTED ROWS', 'Which behavior is missing?');
  table(g, ['Behavior', 'Accepted rows', 'Count'], coverageRows, {
    y: 220,
    rowH: 83,
    fractions: [0.4, 0.4, 0.2],
  });
  note(g, 'Another stale-key example would leave source citation empty.', 570);
}
export const inspection = [owners, observations, whitespace, schemas, generation, review];
export function checkInspection() {
  assert.equal(ordinary.length, 5);
  assert.equal(ordinary[0], 1060);
  assert.deepEqual(studyCounts, [0, 24, 25]);
  assert.equal(repliesPerCondition, 25);
  assert.notEqual(loose.trim(), expected);
  assert.equal(normalize(loose), expected);
  assert.notEqual(parityCases[0][1], parityCases[1][1]);
  assert.equal(normalize(parityCases[1][1]), parityCases[0][1]);
  assert.deepEqual(parityCases[0][2], parityCases[1][2]);
  assert.equal(parityCases[0][1], parityCases[2][1]);
  assert.notDeepEqual(parityCases[0][2], parityCases[2][2]);
  assert.equal(validRoles(['S', 'U', 'A', 'U', 'A']), true);
  for (const r of [[], ['S'], ['U'], ['U', 'S', 'A'], ['U', 'U', 'A']])
    assert.equal(validRoles(r), false);
  assert.equal(validRoles(['U'], true), true);
  assert.deepEqual(rows.map(passes), [true, false, true, true, true]);
  assert.deepEqual(coverageRows, [
    ['Stale key (P-14)', '001   004', 2],
    ['Temporary admin (P-7)', '003', 1],
    ['source citation', 'none', 0],
  ]);
}
