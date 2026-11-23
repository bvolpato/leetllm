import assert from 'node:assert/strict';
import { C, fmt } from './studio.mjs';
import { AGENT_DAG } from '../../../films/agent-architectures/fixtures.mjs';
import { dependencyState } from '../../../films/agent-architectures/protocols.mjs';

function validate(dag) {
  const ids = Object.keys(dag),
    finished = new Set();
  if (ids.some((id) => !id || dag[id].some((p) => !Object.hasOwn(dag, p)))) return false;
  for (let pass = 0; pass < ids.length; pass++)
    for (const id of ids) if (dag[id].every((p) => finished.has(p))) finished.add(id);
  return finished.size === ids.length;
}
const base = Object.fromEntries(
  ['ci', 'diff', 'health', 'decision'].map((id) => [
    id,
    { revision: 'c1842', until: id === 'health' ? 1100 : 1200, version: 1 },
  ]),
);
base.decision.consumed = { ci: 1, diff: 1, health: 1 };
const returnEdge = { from: 'decision', to: 'ci' };
function snapshot(refresh, decided, revision = 'c1842', now = 1100) {
  const receipts = { ...base };
  if (refresh) receipts.health = { ...base.health, version: 2, until: 1200 };
  if (decided)
    receipts.decision = { ...base.decision, version: 2, consumed: { ci: 1, diff: 1, health: 2 } };
  return { receipts, ...dependencyState(receipts, revision, now) };
}
function graph(g, b, q) {
  const start = q(2, 'Initially all three reads'),
    done = q(2, 'results come back'),
    fail = q(2, 'If diff fails'),
    cycle = q(4, 'arrow from decision'),
    reset = q(4, 'Remove the return edge');
  const records = done
    ? { ci: base.ci, health: base.health, ...(!fail ? { diff: base.diff } : {}) }
    : {};
  const valid = dependencyState(records, 'c1842', 1099);
  const bad = cycle && !reset;
  g.heading(
    'R1842   /   dependencies',
    bad ? 'Which steps form the cycle?' : 'Which steps are ready to run?',
  );
  const readNodes = [
    ['ci', 176],
    ['diff', 266],
    ['health', 356],
  ];
  for (const [id, y] of readNodes) {
    let status = 'read', color = C.blue;
    if (bad) {
      [status, color] = id === returnEdge.to ? ['cycle', C.red] : ['input', C.muted];
    } else if (valid.valid[id]) {
      [status, color] = ['done', C.teal];
    } else if (fail && id === 'diff') {
      [status, color] = ['failed', C.red];
    } else if (start) {
      status = 'ready';
    }
    g.path(
      [
        [275, y],
        [343, y],
        [414, 266],
        [471, 266],
      ],
      color,
      3,
    );
    g.rect(54, y - 29, 218, 56, C.white);
    g.rect(54, y - 29, 5, 56, color);
    g.text(id.toUpperCase(), 69, y + 6, 22, C.ink, 'Mono');
    g.text(status, 253, y + 6, 18, color, 'Sans', 90, 'right');
    g.socket(275, y, color, 6);
  }
  const decisionReady = valid.ready.includes('decision') && !bad;
  if (bad) g.line(414, 266, 471, 266, C.red, 3);
  g.arrow(470, 266, 508, 266, bad ? C.red : C.ink);
  g.plate(
    512,
    205,
    202,
    123,
    'DECISION',
    bad ? 'Cycle' : decisionReady ? 'Ready' : 'Waiting',
    'Needs all three',
    bad ? C.red : decisionReady ? C.teal : C.muted,
  );
  g.arrow(718, 266, 754, 266, C.rule);
  g.text('Effect', 768, 257, 28, C.ink, 'Serif');
  g.text('Wait for decision', 768, 286, 17, C.muted, 'Sans', 150);
  if (bad) {
    g.path(
      [
        [610, 200],
        [610, 134],
        [166, 134],
        [166, 145],
      ],
      C.red,
      3,
    );
    g.arrow(166, 141, 166, 148, C.red);
  }
  g.note(
    bad
      ? 'Reject this graph. CI waits for a decision that already waits for CI.'
      : reset
        ? 'Return edge removed. The plan is valid. The decision still needs the diff result.'
        : b >= 4
          ? 'Check unique nonempty IDs, known dependencies and an acyclic plan.'
          : decisionReady
            ? 'The reads have returned. Only the decision is ready.'
            : fail
              ? 'Diff has no usable result. The decision still waits.'
              : 'The graph declares prerequisites. The scheduler supplies workers.',
  );
}
function expiry(g, clock, b) {
  const after = (beat, phrase) =>
    b > beat || (b === beat && clock.elapsed + 1e-9 >= clock.wordCue(phrase).end);
  const cutoff = base.health.until;
  const crossed = after(2, 'forward one second'),
    refresh = after(4, 'A fresh health result arrives'),
    recompute = after(4, 'compute a new one from these three reads'),
    other = after(5, 'different revision');
  const now = crossed ? cutoff : cutoff - 1,
    revision = other ? 'c1843' : 'c1842';
  const state = snapshot(refresh, recompute, revision, now);
  const reusable = after(1, 'all four results are usable');
  const followCutoff = 'Follow that cutoff down to the decision';
  const showReads = crossed ? after(3, 'Rerun health') : reusable;
  const showDecision = crossed ? after(3, "its own later timestamp can't keep it alive") : reusable;
  const showEffect = showDecision && (!crossed || after(3, 'The effect must wait'));
  let trace = Number(showDecision);
  if (b === 3) {
    const { start, end } = clock.wordCue(followCutoff);
    trace = clock.reveal(followCutoff, end - start, { captionStart: false });
  }

  g.heading('Release plan   /   stored results', 'Which results still belong in the plan?');
  g.text('Clock ' + fmt(now) + ' s', 46, 153, 26, C.ink, 'Mono');
  g.text('Reuse requires clock < expiry', 480, 153, 20, C.muted, 'Mono', 382, 'center');
  g.text('Request ' + revision, 914, 153, 26, C.ink, 'Mono', 285, 'right');
  g.label('STORED RESULTS  •  ' + state.receipts.ci.revision, 47, 181);

  const decision = state.receipts.decision;
  const decisionX = 318,
    decisionY = 344,
    decisionW = 324;
  for (const [i, id] of AGENT_DAG.decision.entries()) {
    const x = 46 + i * 300,
      w = 268,
      y = 195;
    const read = state.receipts[id];
    const valid = state.valid[id];
    const color = showReads ? (valid ? C.teal : C.red) : C.muted;
    const status = !showReads ? '?' : valid ? 'Reusable' : other ? 'Wrong revision' : 'Expired';
    g.rect(x, y, w, 76, C.white);
    g.rect(x, y, 5, 76, color);
    const name = id === 'health' ? 'Health' : id.toUpperCase();
    g.text(name + ' v' + read.version, x + 14, y + 31, 25, C.ink, 'Serif', 120);
    g.text(status, x + w - 14, y + 31, 18, color, 'Sans', 116, 'right', 600);
    const expiryColor = showReads && now >= read.until ? C.red : C.muted;
    g.text('Expires ' + fmt(read.until) + ' s', x + 14, y + 60, 20, expiryColor, 'Mono', w - 28);

    const fromX = x + w / 2,
      fromY = y + 80,
      toX = decisionX + 82 + i * 80,
      toY = decisionY - 5;
    const linkColor = !showReads
      ? C.rule
      : valid && read.version === decision.consumed[id]
        ? C.teal
        : C.red;
    if (id === 'health' && linkColor === C.red && trace < 1) {
      g.arrow(fromX, fromY, toX, toY, C.rule);
      if (trace > 0) {
        const tipX = fromX + (toX - fromX) * trace;
        const tipY = fromY + (toY - fromY) * trace;
        g.line(fromX, fromY, tipX, tipY, C.red, 4);
      }
    } else {
      g.arrow(fromX, fromY, toX, toY, linkColor);
    }
  }

  const decisionValid = state.valid.decision;
  const verdict = !showDecision
    ? '?'
    : decisionValid
      ? 'Reusable'
      : state.ready.includes('decision')
        ? 'Recompute'
        : other
          ? 'Wait for reads'
          : 'Wait for health';
  const decisionColor = showDecision ? (decisionValid ? C.teal : C.red) : C.muted;
  g.rect(decisionX, decisionY, decisionW, 76, C.white);
  g.rect(decisionX, decisionY, 5, 76, decisionColor);
  g.text('Decision v' + decision.version, decisionX + 14, decisionY + 31, 25, C.ink, 'Serif', 157);
  const right = decisionX + decisionW - 14;
  g.text(verdict, right, decisionY + 31, 19, decisionColor, 'Sans', 131, 'right', 600);
  g.text(
    'Expires ' + fmt(decision.until) + ' s',
    decisionX + 14, decisionY + 60, 20, C.muted, 'Mono', 164,
  );
  g.text(
    'Uses health v' + decision.consumed.health,
    right, decisionY + 60, 17, C.muted, 'Sans', 122, 'right',
  );
  g.arrow(decisionX + decisionW + 5, 382, 738, 382, showEffect ? decisionColor : C.rule);
  g.text('Effect', 755, 378, 25, C.ink, 'Serif');
  const effect = !showEffect ? 'Needs decision' : decisionValid ? 'Check permission' : 'Waiting';
  g.text(effect, 755, 405, 18, C.muted, 'Sans', 157);

  g.note(
    crossed && !showReads
      ? 'Which read would you run now? Can you still use the old decision?'
      : other
        ? 'Read CI, diff and health for the requested revision.'
        : recompute
          ? 'Keep the same CI and diff results for the new decision.'
          : refresh
            ? 'The old decision still uses health v1.'
            : crossed
              ? showDecision
                ? 'The decision loses a required input before its own expiry.'
                : 'The clock has reached the health expiry.'
              : 'Check each expiry and follow the inputs to the decision.',
  );
}
function versions(g, b, q) {
  const fresh = q(1, 'Replace health'),
    remove = q(3, 'Remove its step');
  const state = snapshot(fresh, false);
  g.heading(
    'Release c1842   /   input lineage',
    b < 3 ? 'Which health version did the decision use?' : 'What survives removal from the plan?',
  );
  if (b < 3) {
    g.plate(
      50,
      171,
      352,
      164,
      'CURRENT HEALTH',
      'Health v' + state.receipts.health.version,
      fresh ? 'Fresh replacement' : 'Exclusive expiry at 1,100 s',
      fresh ? C.teal : C.goldInk,
    );
    g.arrow(407, 250, 543, 250, fresh ? C.red : C.muted);
    g.plate(
      549,
      171,
      362,
      164,
      'STORED DECISION',
      'Consumed health v1',
      'Inputs also include CI v1 and diff v1',
      C.blue,
    );
    g.text(
      fresh ? 'v2 ≠ v1' : 'v1 = v1',
      475,
      292,
      17,
      fresh ? C.red : C.ink,
      'Mono',
      126,
      'center',
    );
    g.note(
      fresh
        ? 'The new health is usable. The old decision still points to v1.'
        : 'A matching name alone cannot establish freshness.',
    );
  } else {
    g.plate(
      48,
      171,
      370,
      173,
      'REVISED PLAN',
      remove ? 'Step removed' : 'Create proposal',
      'Plan can change',
      C.blue,
    );
    g.plate(
      542,
      171,
      370,
      173,
      'PROPOSAL SERVICE',
      'RB2041 exists',
      'Accepted with operation-17',
      C.teal,
    );
    g.text('≠', 480, 269, 42, C.ink, 'Serif', 80, 'center');
    g.note(
      remove
        ? 'The service ledger still holds RB2041. Reconcile operation-17 before retrying.'
        : 'Validate replacement steps and check for shared resources beyond plan edges.',
    );
  }
}
const categories = [
  ['Build', ['ci', 'build']],
  ['Migration', ['schema', 'migration']],
  ['Documentation', ['handbook', 'documentation']],
];
function matches(text) {
  const words = text.toLowerCase().match(/[a-z]+/g) || [];
  return categories
    .filter(([, keys]) => keys.some((key) => words.includes(key)))
    .map(([name]) => name);
}
function router(g, b, q) {
  const doc = q(2, 'Read the documentation'),
    request = b === 1 ? '' : doc ? 'Read the documentation' : 'CI failed during a schema migration';
  const selected = matches(request),
    accepted = selected.length === 1;
  g.heading('Host router   /   registered handlers', 'Where should this request go?');
  g.paper(44, 162, 368, 180);
  g.label('INCOMING TEXT', 64, 194);
  g.text(request || 'Classify the request', 64, 244, 27, C.ink, 'Serif', 329);
  if (request)
    g.text(
      selected.length + ' matching ' + (accepted ? 'category' : 'categories'),
      64,
      305,
      20,
      C.muted,
    );
  categories.forEach(([name, keys], i) => {
    const y = 180 + i * 76,
      hit = selected.includes(name);
    g.path(
      [
        [417, 247],
        [481, 247],
        [542, y],
        [589, y],
      ],
      hit ? C.teal : C.rule,
      hit ? 4 : 2,
    );
    g.socket(591, y, hit ? C.teal : C.rule, 6);
    g.text(name, 615, y + 4, 25, C.ink, 'Serif');
    g.text(keys.join(' / '), 615, y + 27, 15, C.muted, 'Mono');
  });
  g.note(
    !request
      ? 'Dispatch one accepted category. Send zero or multiple matches to review.'
      : accepted
        ? 'One match. The host dispatches to its read-only documentation handler.'
        : 'Two matches. The host sends this request to review.',
  );
}
function tree(g, b, q) {
  const sim = q(1, 'A simulation'),
    backup = q(2, 'return travels'),
    isolate = q(4, 'own snapshot');
  g.heading(
    'Language Agent Tree Search   /   release R1842',
    'Which state will the next trial inherit?',
  );
  g.text('R1842 sandbox', 480, 170, 29, C.ink, 'Serif', 420, 'center');
  g.socket(480, 196, C.blue, 9);
  const paths = [
    ['Simulate rollback', 'Snapshot A'],
    ['Inspect diff', 'Read-only evidence'],
    ['Simulate retry', 'Snapshot C'],
  ];
  paths.forEach(([name, scope], i) => {
    const x = 175 + 305 * i,
      active = i === 2 && sim;
    g.line(480, 203, x, 298, active ? C.teal : C.rule, active ? 5 : 2);
    g.socket(x, 299, active ? C.teal : C.blue);
    g.text(name, x, 341, 24, C.ink, 'Serif', 260, 'center');
    g.text(
      isolate ? scope : active ? 'Trial outcome' : 'Available branch',
      x,
      373,
      17,
      active ? C.teal : C.muted,
      'Mono',
      260,
      'center',
    );
  });
  if (backup) {
    g.arrow(737, 280, 543, 219, C.gold, 4);
    g.text('Return', 635, 235, 17, C.goldInk);
  }
  g.note(
    isolate
      ? 'Restore the files and tool state before a second trial on that branch.'
      : backup
        ? 'Back up the simulated return along the selected path. Other branches remain available.'
        : 'Expand alternatives, evaluate observations and simulate within the sandbox.',
  );
}
export function dependency(g, k, q, n) {
  const b = k.beat.beatIndex + 1;
  switch (n) {
    case 16:
      return graph(g, b, q);
    case 19:
      return expiry(g, k, b);
    case 20:
      return versions(g, b, q);
    case 21:
      return router(g, b, q);
    case 22:
      return tree(g, b, q);
  }
}
export function checkDependency() {
  assert(validate(AGENT_DAG));
  assert(AGENT_DAG[returnEdge.from].includes(returnEdge.to));
  assert(!validate({ ...AGENT_DAG, [returnEdge.to]: [returnEdge.from] }));
  assert(!validate({ ci: ['unknown'] }));
  assert(!validate({ '': [] }));
  assert(snapshot(false, false, 'c1842', base.health.until - 1).valid.decision);
  assert.deepEqual(snapshot(false, false).ready, ['health']);
  assert.deepEqual(snapshot(true, false).ready, ['decision']);
  assert.deepEqual(snapshot(true, true).ready, ['effect']);
  assert.deepEqual(snapshot(true, true, 'c1843').ready, ['ci', 'diff', 'health']);
  assert.deepEqual(matches('CI failed during a schema migration'), ['Build', 'Migration']);
  assert.deepEqual(matches('Read the documentation'), ['Documentation']);
  assert.deepEqual(matches('unknown'), []);
}
