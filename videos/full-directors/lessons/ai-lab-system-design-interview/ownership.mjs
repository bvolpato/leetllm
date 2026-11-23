import {
  C,
  mix,
  box,
  line,
  dot,
  tx,
  label,
  serif,
  opacity,
  frame,
  foot,
  chip,
  cue,
  arrow,
  paper,
  mark,
} from './instrument.mjs';
import {
  DOCS,
  eligibleDocuments,
  freshness,
  cached,
  reuse,
  claimEdge,
  retryMode,
} from './examples.mjs';

function leaf(g, x, y, w, h, name, sub, edge, fill = C.white) {
  const fold = 15;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + w - fold, y);
  g.lineTo(x + w, y + fold);
  g.lineTo(x + w, y + h);
  g.lineTo(x, y + h);
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = edge;
  g.lineWidth = 1.4;
  g.stroke();
  line(g, x + w - fold, y, x + w - fold, y + fold, edge);
  line(g, x + w - fold, y + fold, x + w, y + fold, edge);
  tx(g, name, x + 13, y + 31, 18, C.ink, 'Sans', 600);
  tx(g, sub, x + 13, y + h - 13, 15, edge, 'Mono');
}

export function permissions(g, k) {
  const b = k.beat.beatIndex;
  if (b === 2) {
    const stale = cue(k, 2, 'At eighty seconds') > 0,
      age = stale ? 80 : 5,
      limit = 45;
    frame(g, k, 'Private retrieval', 'Which permission check stopped this lookup?');
    label(g, 'SNAPSHOT AGE', 63, 164);
    label(g, 'CURRENT AUTHORITY', 590, 164);
    const x = (t) => 67 + t * 4.8;
    line(g, x(0), 253, x(90), 253, C.muted, 2);
    line(g, x(limit), 209, x(limit), 276, C.rust, 2, true);
    tx(g, '45 s maximum', x(limit), 198, 18, C.rust, 'Sans', 600, 'center');
    dot(g, x(age), 253, 9, stale ? C.rust : C.teal);
    tx(g, age + ' s', x(age), 302, 25, stale ? C.rust : C.teal, 'Mono', 600, 'center');
    leaf(
      g,
      582,
      193,
      304,
      109,
      'finance-plan',
      stale ? 'Check withheld' : 'Grant revoked 1 s ago',
      C.rust,
    );
    const denied = cue(k, 2, 'Deny access') > 0;
    foot(
      g,
      'SENSITIVE SOURCE   /   FRESHNESS AND CURRENT GRANT',
      !freshness(age, limit)
        ? 'Stale snapshot · refresh before sensitive lookup.'
        : denied
          ? 'Fresh snapshot · authoritative revocation denies finance.'
          : 'A fresh timestamp establishes when the snapshot was taken.',
    );
    return;
  }
  const moved = cue(k, 1, 'Send the public access policy', 0.85),
    eligible = eligibleDocuments();
  frame(g, k, 'Trusted index · employees group', 'Which source can cross to the reranker?');
  label(g, 'TRUSTED SEARCH INDEX', 51, 151);
  label(g, 'EXTERNAL RERANKER', 619, 151);
  line(g, 550, 160, 550, 398, C.rust, 2, true);
  const choices = [...DOCS].sort((a, b) => b.score - a.score);
  choices.forEach((d, i) => {
    const y = 166 + i * 79,
      ok = eligible.includes(d),
      x = ok ? mix(53, 609, moved) : 53;
    const desc = d.deleted ? 'Deleted version' : 'Needs ' + d.groups[0];
    if (ok && moved > 0) {
      line(g, 64, y + 37, 606, y + 37, C.teal, 2, true);
    }
    leaf(g, x, y, 254, 65, d.id, d.score.toFixed(2) + '   ' + desc, ok && moved ? C.teal : C.muted);
    if (!ok)
      opacity(g, moved, () =>
        tx(
          g,
          d.deleted ? '×  Tombstone' : '×  No finance grant',
          329,
          y + 41,
          17,
          C.rust,
          'Sans',
          600,
        ),
      );
  });
  foot(
    g,
    'CALLER / EMPLOYEES   ·   EXTERNAL SERVICE RECEIVES ELIGIBLE CONTENT',
    moved
      ? 'Trace the citation to public-access-policy and its version.'
      : 'Both the current grant and the live document version matter.',
  );
}

export function cache(g, k) {
  const b = k.beat.beatIndex,
    shift = cue(k, 0, 'Shift the positions') > 0,
    restore = cue(k, 1, 'Restore the original positions') > 0,
    revoked = cue(k, 1, 'has revoked the grant') > 0,
    third = cue(k, 2, 'Only the case') > 0;
  const changed = shift && !restore,
    request = { ...cached, positions: changed ? '1 2 3' : cached.positions },
    grant = !revoked || third,
    ok = reuse(request, grant);
  frame(g, k, 'Prefix cache · private D9', 'Can this reader reuse the cached prefix?');
  label(g, 'STORED ENTRY  /  T4', 64, 158);
  label(g, 'INCOMING REQUEST  /  T4', 507, 158);
  function strip(x, version) {
    for (let i = 0; i < 3; i++) {
      const val = version.tokens.split(' ')[i],
        pos = version.positions.split(' ')[i];
      box(g, x + i * 116, 186, 102, 86, C.white, C.rule, 4);
      tx(g, val, x + 51 + i * 116, 232, 31, C.ink, 'Mono', 600, 'center');
      tx(
        g,
        'pos ' + pos,
        x + 51 + i * 116,
        257,
        16,
        version.positions !== cached.positions ? C.rust : C.teal,
        'Mono',
        500,
        'center',
      );
    }
    tx(g, 'M7  /  L2  /  C3', x, 314, 20, C.blue, 'Mono', 600);
    label(g, 'MODEL · ADAPTER · CACHE CONFIG', x, 343);
  }
  strip(64, cached);
  strip(507, request);
  line(g, 465, 149, 465, 363, C.rule);
  mark(g, 69, 390, 'Document D9', C.muted);
  mark(
    g,
    511,
    390,
    grant ? 'Current grant present' : 'Current grant revoked',
    grant ? C.teal : C.rust,
  );
  const predict = (b === 0 && !changed) || (b === 1 && !third);
  foot(
    g,
    third
      ? 'INDEPENDENT CASE C   /   MATCH AND CURRENT GRANT'
      : changed
        ? 'CASE A   /   POSITION SHIFT'
        : restore
          ? 'CASE B   /   MATCHING POSITIONS'
          : 'CACHE IDENTITY',
    predict
      ? 'Check both the computation and the current grant.'
      : ok
        ? 'Full identity match + current grant · reuse permitted.'
        : changed
          ? 'Different positions · recompute the prefix.'
          : 'Private prefix excluded · current grant missing.',
  );
}

export function agent(g, k) {
  const b = k.beat.beatIndex,
    sent = cue(k, 0, 'before sending') > 0,
    written = cue(k, 0, 'accepts one commit') > 0,
    lost = cue(k, 0, 'worker restarts') > 0,
    linked = cue(k, 1, 'Attach the receipt') > 0,
    cancel = cue(k, 2, 'Persist cancel intent') > 0,
    exit = cue(k, 2, 'Once it confirms exit') > 0;
  frame(g, k, 'Task 47 · attempt W1', b === 2 ? 'When can W1 be marked canceled?' : 'Did the write survive the worker?');
  paper(g, 43, 129, 423, 267);
  paper(g, 491, 129, 425, 267, '#e6eddd');
  label(g, 'TASK JOURNAL', 65, 165);
  label(g, 'REPOSITORY', 513, 165);
  for (const y of [203, 245, 287, 329, 371]) {
    line(g, 61, y + 11, 451, y + 11, C.grid);
    line(g, 510, y + 11, 899, y + 11, C.rule);
  }
  tx(g, 'W1   ·   scoped checkout', 65, 205, 19);
  if (sent) tx(g, 'E7   ·   commit intent', 65, 247, 19);
  if (lost)
    tx(
      g,
      linked ? 'E7   ·   receipt C42' : 'E7   ·   reply missing',
      65,
      289,
      19,
      linked ? C.teal : C.rust,
      'Mono',
      600,
    );
  if (cancel)
    tx(
      g,
      exit ? 'Sandbox exited · canceled' : 'Cancel requested · still running',
      65,
      331,
      17,
      exit ? C.teal : C.rust,
      'Sans',
      600,
    );
  if (exit) tx(g, 'Partial logs retained', 65, 373, 17, C.muted);
  line(g, 550, 207, 550, written ? 312 : 219, C.teal, 3);
  dot(g, 550, 207, 7, C.blue);
  tx(g, 'Parent commit', 571, 212, 20);
  if (written) {
    dot(g, 550, 295, 10, C.teal);
    tx(g, 'C42', 574, 300, 27, C.teal, 'Mono', 600);
    tx(g, 'One commit for W1 / E7', 573, 345, 17);
  }
  if (linked) {
    line(g, 489, 288, 449, 288, C.teal, 2);
    line(g, 457, 282, 449, 288, C.teal, 2);
    line(g, 457, 294, 449, 288, C.teal, 2);
  }
  foot(
    g,
    'TASK, ATTEMPT AND TOOL EVENT STAY LINKED',
    exit
      ? 'Cancellation ends execution. C42 remains in the repository.'
      : cancel
        ? 'Stop new tool calls and wait for the sandbox exit.'
        : linked
          ? 'Reconciliation attaches the existing commit to W1.'
          : b === 0
            ? 'Which durable record can tell you what E7 did?'
            : 'Look up the original attempt at the receiver.',
  );
}

export function claims(g, k) {
  const b = k.beat.beatIndex;
  if (b === 2) {
    frame(
      g,
      k,
      'Recovery · authorized transient failures',
      'Which actions can replay automatically?',
    );
    label(g, 'ACTION', 50, 163);
    label(g, 'RECEIVER ENFORCEMENT', 355, 163);
    label(g, 'RECOVERY', 662, 163);
    const rows = [
      ['repo_read', false, 'A repository read'],
      ['sandbox_provision', true, 'Boolean true'],
      ['create_commit', 'True', 'A string spelling true'],
    ];
    rows.forEach(([action, flag, phrase], i) => {
      const y = 219 + i * 77;
      line(g, 49, y + 21, 915, y + 21, C.rule);
      tx(g, action, 51, y, 19, C.ink, 'Mono', 500);
      tx(
        g,
        typeof flag === 'string' ? '"True" (string)' : flag ? 'True (Boolean)' : 'False (Boolean)',
        357,
        y,
        18,
        C.ink,
        'Mono',
      );
      opacity(g, cue(k, 2, phrase), () => {
        const mode = retryMode(action, flag);
        tx(
          g,
          mode === 'automatic-with-idempotency'
            ? 'Same key + payload'
            : mode === 'automatic'
              ? 'Retry read'
              : 'Reconcile / review',
          662,
          y,
          19,
          mode === 'reconcile-or-review' ? C.rust : C.teal,
          'Sans',
          600,
        );
      });
    });
    foot(
      g,
      'PRECONDITION   /   TRANSIENT ERROR, AUTHORIZATION AND RETRY BUDGET',
      'The receiver must retain its deduplication record through the retry window.',
    );
    return;
  }
  const result = cue(k, 1, 'Only complete') > 0;
  if (cue(k, 1, 'Complete, failed and canceled', 0)) {
    const later = cue(k, 1, 'Start later work', 0);
    frame(g, k, 'Durable state · terminal attempt', 'Which ID belongs to later work?');
    paper(g, 69, 177, 346, 156);
    label(g, 'ATTEMPT JOURNAL', 92, 212);
    tx(g, 'R12', 92, 265, 33, C.ink, 'Mono', 600);
    chip(g, 'Complete', 226, 235, C.teal);
    tx(g, 'Final state recorded', 92, 310, 18, C.muted);
    if (later) {
      paper(g, 540, 177, 346, 156);
      label(g, 'NEW ATTEMPT JOURNAL', 563, 212);
      tx(g, 'R13', 563, 265, 33, C.ink, 'Mono', 600);
      chip(g, 'Queued', 697, 235, C.blue);
      tx(g, 'New work on the same task', 563, 310, 18, C.muted);
    }
    foot(g, 'TERMINAL STATES   /   COMPLETE, FAILED AND CANCELED',
      later ? 'R13 has its own history. R12 keeps its final receipt.' : 'R12 has reached a terminal state.');
    return;
  }
  frame(g, k, 'Attempt R12 · independent claims', 'Which transition can leave review?');
  label(g, 'STORED STATE', 86, 177);
  box(g, 82, 224, 192, 66, C.dark, null, 5);
  tx(g, 'review', 178, 268, 27, C.white, 'Mono', 600, 'center');
  line(g, 274, 256, 359, 256, C.muted, 2);
  line(g, 359, 210, 359, 314, C.muted, 2);
  for (const [i, next] of ['complete', 'failed'].entries()) {
    const y = 210 + i * 104,
      ok = claimEdge('review', 'review', next),
      color = result ? (ok ? C.teal : C.rust) : C.muted;
    arrow(g, 359, y, 479, color);
    box(g, 491, y - 29, 183, 60, C.white, color, 4);
    tx(g, next, 581, y + 9, 23, color, 'Mono', 600, 'center');
    if (result) tx(g, ok ? 'Legal edge' : 'Illegal edge', 699, y + 8, 22, color, 'Sans', 600);
  }
  tx(g, 'Both workers expect review.', 82, 379, 19, C.muted);
  foot(
    g,
    'LEGAL FROM REVIEW   /   RUNNING, COMPLETE OR CANCELED',
    result
      ? 'Both workers expected review. Only the edge to complete is legal.'
      : 'Check the expected state and the requested edge together.',
  );
}
