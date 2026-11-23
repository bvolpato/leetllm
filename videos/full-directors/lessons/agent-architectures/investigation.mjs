import assert from 'node:assert/strict';
import { C } from './studio.mjs';

const migration = [
  ['CI', 'Migration failed'],
  ['Migration', 'team_id lacks a guard'],
  ['Replay', 'Duplicate column'],
];
const outage = [['CI', 'Runner unavailable']];
function supports(receipts, required) {
  return required.every(([name]) => receipts.some(([seen]) => name === seen));
}
function runline(g, y, name, positions, values) {
  g.text(name, 44, y + 5, 23, C.ink, 'Serif', 180);
  g.line(226, y, 879, y, C.rule, 2);
  positions.forEach((x, i) => {
    const v = values[i];
    g.socket(x, y, v ? v[2] || C.teal : C.rule, 8);
    if (v) {
      g.text(v[0], x, y - 22, 19, C.ink, 'Sans', 152, 'center', 600);
      g.text(v[1], x, y + 38, 16, v[2] || C.muted, 'Sans', 153, 'center');
    }
  });
}
function ci(g, b, q) {
  const alternate = q(2, 'runner unavailable'),
    timeout = q(2, 'CI read times out'),
    repeat = b >= 3;
  const first = q(1, 'lookup succeeds'),
    second = q(1, 'reads the authorized migration file');
  const retried = Number(q(3, 'gets one receipt')) + Number(q(3, 'gets a second copy'));
  const blocked = q(3, 'blocks the third dispatch');
  const cases = repeat
    ? [
        ['CI', 'Duplicate column'],
        ['CI', 'Same result'],
      ].slice(0, retried)
    : timeout
      ? [['CI', 'Timeout • error']]
      : alternate
        ? [['CI', 'Runner unavailable']]
        : migration.slice(0, second ? 2 : Number(first));
  g.heading('Local fixture   /   read-only investigation', 'What did the lookup establish?');
  if (b === 4) {
    g.paper(47, 145, 866, 273);
    g.label('RECEIPT  •  CALL-1', 69, 181);
    g.text('CI returned a duplicate-column error.', 69, 235, 32, C.ink, 'Serif');
    g.line(68, 258, 892, 258, C.rule);
    g.text('Request     get_ci_failure(R1842)', 69, 300, 21, C.ink, 'Mono');
    g.text('Repository  release-demo   /   revision c1842', 69, 341, 21, C.ink, 'Mono');
    g.text('Retrieved   today at 13:55', 69, 382, 21, C.ink, 'Mono');
    g.note('The result stays tied to the request, repository, revision and retrieval time.');
    return;
  }
  runline(
    g,
    230,
    'Host trace',
    [310, 551, 796],
    [
      ...cases.map(([name, v]) => [name, v]),
      ...(blocked ? [['Third dispatch', 'Blocked', C.red]] : []),
    ],
  );
  g.plate(
    47,
    315,
    868,
    105,
    'HOST LOG',
    blocked
      ? 'Two attempts used. A final answer is still allowed.'
      : repeat
        ? retried + ' of 2 attempts used.'
        : timeout
          ? 'The host stores the error receipt and defers.'
          : alternate
            ? 'Evidence stops at the runner. Defer the migration diagnosis.'
            : second
              ? 'Review migration semantics. No write performed.'
              : first
                ? 'Successful read. The build it describes failed.'
                : 'The CI job result has been requested.',
    '',
    C.blue,
  );
  g.note(
    b === 4
      ? 'A bounded result retains its request, repository, revision and retrieval time.'
      : 'A tool’s completion status and the build’s status answer different questions.',
  );
}
function completion(g, b, q) {
  const pos = [287, 468, 649, 832];
  g.heading(
    'Release investigation   /   claim-specific evidence',
    'Has this answer earned its evidence?',
  );
  if (b === 3 || b === 4) {
    const actual = [],
      accepted = supports(actual, migration);
    g.table(
      ['EVIDENCE', 'CI', 'MIGRATION', 'REPLAY'],
      [
        ['Cited by policy', 'CI', 'Migration', 'Replay'],
        ['Host observed', 'Empty', 'Empty', 'Empty'],
      ],
      [200, 216, 221, 235],
      45,
      182,
      78,
    );
    g.note(
      b === 3
        ? 'The policy cites three tools on turn one. Can the host accept its claim?'
        : accepted
          ? 'Evidence complete.'
          : 'Reject the schema claim. The host has zero observed results.',
      b === 3 ? C.ink : C.red,
    );
    return;
  }
  const limited = b === 5 && q(5, 'only two turns'),
    reads =
      b === 5
        ? migration.slice(0, limited ? 2 : 3)
        : migration.slice(
            0,
            Number(q(1, 'migration failed')) +
              Number(q(1, 'Read the migration')) +
              Number(q(1, 'run the replay')),
          );
  const answer = !limited && supports(reads, migration) && (b < 5 || q(5, 'fourth returns'));
  runline(g, 220, 'R1842', pos, [...reads, ...(answer ? [['Answer', 'Schema diagnosis']] : [])]);
  if (b >= 2 && b !== 5) {
    const seen = q(2, 'runner was unavailable');
    runline(g, 344, 'R1843', pos, seen ? [...outage, ['Answer', 'Runner outage']] : []);
  }
  if (b === 5)
    g.text(limited ? '2 turns available' : '4 decision turns', 49, 346, 29, C.goldInk, 'Serif');
  g.note(
    limited
      ? 'Two reads used both turns. The replay and final answer still need turns.'
      : b === 5
        ? 'Three tool reads plus one answer consume four turns.'
        : 'Check the reads required for this specific claim.',
  );
}
const patch = {
  tool: 'open_patch',
  path: 'db/migrations/add_team_id.sql',
  change: 'guard team_id',
};
function admitDraft(request, allowed) {
  const fields = ['tool', 'path', 'change'];
  if (Object.keys(request).sort().join() !== fields.sort().join() || !request.change)
    return 'Malformed';
  if (!allowed || fields.some((k) => request[k] !== patch[k])) return 'Approval missing';
  return 'Draft created';
}
function authorization(g, b, q) {
  const approved = q(2, 'trusted event records'),
    created = q(2, 'creates draft one'),
    malformed = q(3, 'extra field');
  const request = malformed ? { ...patch, extra: true } : patch,
    verdict = admitDraft(request, approved);
  g.heading('Host registry   /   draft service', 'Can this request create a patch draft?');
  g.paper(43, 147, 492, 256);
  g.label('PROPOSED REQUEST', 63, 176);
  for (const [i, [k, v]] of Object.entries(request).entries()) {
    const y = 218 + i * 42;
    g.text(k, 64, y, 17, C.muted, 'Mono', 114);
    g.text(v, 171, y, 20, k === 'extra' ? C.red : C.ink, 'Mono', 348);
    g.line(63, y + 10, 512, y + 10, C.sand);
  }
  g.arrow(539, 270, 575, 270);
  g.label('HOST CHECK', 588, 172);
  g.text('read_ci   →   read', 588, 209, 21, C.blue, 'Mono', 307);
  g.text('open_patch   →   write', 588, 245, 21, C.goldInk, 'Mono', 307);
  g.text(
    malformed
      ? 'Extra field rejected'
      : approved
        ? 'Exact change approved'
        : 'Exact approval absent',
    588,
    303,
    23,
    malformed ? C.red : approved ? C.teal : C.muted,
    'Serif',
    316,
  );
  g.text('Drafts   ' + Number(created), 588, 364, 32, C.ink, 'Serif');
  g.note(
    b === 1
      ? 'A CI log supplies evidence. Trusted host state supplies authority.'
      : malformed
        ? verdict + ' request. The one existing draft remains.'
        : created
          ? verdict + '. The migration file is still unchanged.'
          : approved
            ? 'The grant matches this payload. Awaiting dispatch.'
            : 'Approval missing. The service has created zero drafts.',
  );
}
function majority(list) {
  const count = list.filter((x) => x === 'Patch').length;
  if (count > list.length / 2) return 'Patch';
  if (list.length - count > list.length / 2) return 'Roll back';
  return 'Needs review';
}
function votes(g, b, q) {
  const tie = b === 1 && q(1, 'Take away'),
    shared = q(3, 'same stale log'),
    list = shared
      ? ['Patch', 'Patch', 'Patch']
      : tie
        ? ['Patch', 'Roll back']
        : ['Patch', 'Roll back', 'Patch'];
  const run = shared ? 'Shared stale log'
    : tie ? 'Two remaining votes'
    : b >= 2 ? 'Original three votes'
    : 'Recommendations';
  g.heading('Self-consistency   /   ' + run, 'What survives the vote?');
  const result = majority(list);
  for (let i = 0; i < 3; i++) {
    const x = 48 + 298 * i;
    g.paper(x, 170, 262, 158, i < list.length ? C.white : C.sand);
    g.label('CANDIDATE ' + (i + 1), x + 16, 196);
    g.text(list[i] || 'Withdrawn', x + 16, 253, 32, i < list.length ? C.ink : C.muted, 'Serif');
    if (i < list.length)
      g.text(
        shared ? 'Same stale log' : 'Read-only evidence',
        x + 16,
        292,
        18,
        shared ? C.red : C.muted,
      );
  }
  g.text(
    q(1, 'strict majority') ? 'Vote   ' + result : 'Count the three recommendations.',
    51,
    394,
    30,
    result === 'Needs review' ? C.goldInk : C.ink,
    'Serif',
  );
  g.note(
    shared
      ? 'A unanimous vote can inherit the same stale evidence.'
      : b === 2
        ? q(2, 'The host checks')
          ? 'The host checks authorization for the selected patch.'
          : 'Two of the original three candidates proposed the patch.'
        : 'The candidates propose actions. No candidate applies a change.',
  );
}
function reflection(g, b, q) {
  const current = q(3, 'Selecting the current run'),
    correct = q(2, 'revision-aware evaluator'),
    exists = q(2, 'first evaluator passes');
  const target = 'c1842',
    actual = current ? 'c1842' : 'c1841',
    ok = actual === target;
  g.heading('Reflexion   /   same policy and weights', 'What does the evaluator reward?');
  g.plate(44, 155, 282, 148, 'TASK REVISION', target, 'Choose a run for this revision.', C.blue);
  g.plate(
    348,
    155,
    275,
    148,
    'SELECTED RUN',
    b === 1 ? 'Awaiting trial' : current ? 'current-run' : 'old-run',
    b === 1 ? '' : actual,
    C.teal,
  );
  g.plate(
    646,
    155,
    270,
    148,
    'EVALUATOR',
    correct ? (ok ? 'Pass' : 'Fail') : exists ? 'Pass' : 'Awaiting check',
    correct ? 'Match revision' : exists ? 'Existence only' : 'Check the run',
    correct && !ok ? C.red : C.muted,
  );
  if (b === 4) {
    const fetched = q(4, 'Retrieve the note');
    g.rect(48, 334, 390, 74, C.white);
    g.label('STORED NOTE', 62, 359);
    g.text('Match the requested revision.', 62, 391, 20, C.ink);
    g.arrow(448, 372, 499, 372, fetched ? C.teal : C.rule);
    g.rect(514, 334, 399, 74, fetched ? C.mint : C.white);
    g.label('NEXT ACTOR INPUT', 530, 359);
    g.text(fetched ? 'Task + revision note' : 'Task alone', 530, 391, 22, C.ink);
  } else if (correct) {
    g.label('FAILURE NOTE  •  1 STORED', 50, 351);
    g.text('Select a run bound to the requested revision.', 49, 387, 23, C.ink, 'Serif');
  }
  const fetched = q(4, 'Retrieve the note');
  g.note(
    b === 4
      ? fetched
        ? 'Retrieved into the next actor input. Weights and grants stay fixed.'
        : 'Stored in memory. The actor’s input still omits the note.'
      : current
        ? 'The current run matches. No second failure note is added.'
        : correct
          ? 'The mismatch creates feedback for the retry.'
          : exists
            ? 'Existence alone would stop the trial on the wrong revision.'
            : 'The actor tries, the evaluator checks, and feedback can inform another trial.',
  );
}
function evaluation(g, b, q) {
  const runOutage = q(2, 'switch to the runner outage'),
    seen = q(2, 'Both policies receive'),
    finish = q(3, 'early exit reports'),
    denied = q(3, 'host rejects');
  const pos = [278, 462, 646, 830];
  g.heading(
    'Policy comparison   /   same host and four turns',
    runOutage
      ? 'Which policy can finish on the outage?'
      : 'How do the policies handle the migration?',
  );
  const full = q(2, 'both do three reads') ? [...migration, ['Answer', 'Schema diagnosis']] : [];
  const first = runOutage
    ? seen
      ? [...outage, ...(denied ? [['Migration', 'Scope denied', C.red]] : [])]
      : []
    : full;
  const second = runOutage
    ? seen
      ? [...outage, ...(finish ? [['Answer', 'Runner outage']] : [])]
      : []
    : full;
  if (b === 1) {
    g.plate(
      48,
      163,
      408,
      181,
      'FIXED CHECKLIST',
      'CI → migration → replay',
      'Always asks for all three reads.',
      C.blue,
    );
    g.plate(
      503,
      163,
      408,
      181,
      'EARLY EXIT',
      'CI → inspect the result',
      'Can answer when the runner is down.',
      C.teal,
    );
    g.note('Both policies use the same host and four decision turns.');
    return;
  }
  if (b >= 4) {
    const patterns = b === 5;
    g.heading(
      patterns
        ? 'Architecture choice   /   held-out tasks'
        : 'Evaluation   /   controlled comparison',
      patterns ? 'What decision does the task require?' : 'What would a fair comparison measure?',
    );
    if (patterns) {
      g.table(
        ['TASK REQUIRES', 'PATTERN TO TEST'],
        [
          ['Known intent categories', 'Router'],
          ['Results joined through dependencies', 'Explicit plan'],
          ['Evaluator feedback for the next trial', 'Reflexion'],
          ['Several recoverable alternatives', 'Sandboxed search'],
        ],
        [494, 378],
        45,
        164,
        56,
      );
    } else {
      g.table(
        ['KEEP FIXED', 'RECORD FOR BOTH POLICIES'],
        [
          ['Tasks and expected claims', 'Supported vs. unsupported answers'],
          ['Tools and permissions', 'Completed reads and attempted effects'],
          ['Model settings and budget', 'Failure recovery, time and total cost'],
        ],
        [407, 465],
        45,
        176,
        67,
      );
    }
    g.note(
      patterns
        ? 'Compare each added mechanism against the simpler policy on the same tasks.'
        : 'Keep expected answers out of the prompt. Test denied effects and stuck loops.',
    );
    return;
  }
  runline(g, 218, 'Checklist', pos, first);
  runline(g, 352, 'Early exit', pos, second);
  g.note(
    runOutage
      ? denied
        ? 'One completed read each. Only the early exit returned a supported answer.'
        : 'R1843 permits the CI read alone. Which rule can use that result?'
      : 'R1842 allows the CI, migration and replay reads. The fourth turn can answer.',
  );
}
export function investigation(g, k, q, n) {
  const b = k.beat.beatIndex + 1;
  switch (n) {
    case 6:
      return ci(g, b, q);
    case 7:
      return completion(g, b, q);
    case 11:
      return authorization(g, b, q);
    case 12:
      return votes(g, b, q);
    case 13:
      return reflection(g, b, q);
    case 32:
      return evaluation(g, b, q);
  }
}
export function checkInvestigation() {
  assert(!supports([], migration));
  assert(supports(migration, migration));
  assert(!supports(migration.slice(0, 2), migration));
  assert(supports(outage, outage));
  assert.equal(admitDraft(patch, false), 'Approval missing');
  assert.equal(admitDraft(patch, true), 'Draft created');
  assert.equal(admitDraft({ ...patch, extra: true }, true), 'Malformed');
  assert.equal(admitDraft({ ...patch, change: 'different' }, true), 'Approval missing');
  assert.equal(majority(['Patch', 'Roll back', 'Patch']), 'Patch');
  assert.equal(majority(['Patch', 'Roll back']), 'Needs review');
}
