import {
  C,
  base,
  boot,
  caption,
  cue,
  throughCue,
  box,
  label,
  line,
  text,
  rail,
  slip,
  stamp,
  dot,
  field,
  arrow,
  envelope,
  mix,
} from './art.mjs';
import {
  original,
  workingEdit,
  editedPacket,
  policy,
  print,
  transaction,
  secondReviewer,
  qualifiesAsSecondReviewer,
} from './examples.mjs';

export function oversight(c, k) {
  if (k.beat.beatIndex < 2) {
    const gated = cue(k, 1, 'Move the gate'),
      monitor = cue(k, 0, 'monitor sees'),
      read = cue(k, 1, 'read of this service');
    if (read) {
      base(c, 'Host policy   /   Scoped metrics', 'What can Vega read on its own?');
      slip(c, 88, 310, 608, 452, 'SCOPED READ GRANT');
      text(c, 'Vega', 126, 500, 68, C.ink, 'Serif');
      text(c, 'platform   /   reranker', 126, 598, 38, C.mute, 'Mono');
      text(c, 'Evaluation metrics', 126, 691, 39, C.teal);
      arrow(c, 747, 535, 1057, 535, C.teal, 6);
      label(c, 'Read metrics', 766, 489);
      slip(c, 1110, 310, 720, 452, 'PERMITTED EVALUATION');
      text(c, 'eval-881', 1149, 506, 64, C.ink, 'Mono');
      text(c, 'Tenant   ·   platform', 1149, 612, 38, C.mute);
      text(c, 'Service  ·   reranker', 1149, 685, 38, C.mute);
      caption(c, 'Human out of the loop   ·   scoped read   ·   no real-time reviewer');
      return;
    }
    base(c, 'Host policy   /   Oversight timing', 'When can Casey stop a publication?');
    label(c, 'PUBLIC RELEASE NOTE', 90, 305);
    const x1 = 260,
      x2 = 900,
      x3 = 1570,
      y = 495;
    arrow(c, 160, y, 1745, y, C.line, 8);
    envelope(c, x1 - 65, y - 49, 130);
    text(c, 'Vega proposes', x1, 652, 39, C.ink, 'Serif', 400, 'center');
    const gateX = gated ? x2 : x3,
      sendX = gated ? x3 : x2;
    box(c, sendX - 95, y - 78, 190, 138, C.blue, 12);
    line(c, sendX - 52, y - 26, sendX + 52, y - 26, C.ice, 6);
    line(c, sendX - 52, y + 5, sendX + 17, y + 5, C.ice, 6);
    text(
      c,
      gated ? 'Send if approved' : 'First delivery',
      sendX,
      652,
      39,
      C.ink,
      'Serif',
      400,
      'center',
    );
    if (monitor) {
      box(c, gateX - 94, y - 76, 188, 133, gated ? C.teal : C.ochre, 10);
      text(c, gated ? 'Decide' : 'Monitor', gateX, y + 5, 37, C.white, 'Sans', 700, 'center');
      text(
        c,
        gated ? 'Before delivery' : 'After delivery',
        gateX,
        652,
        39,
        C.ink,
        'Serif',
        400,
        'center',
      );
    }
    caption(
      c,
      gated
        ? 'Human in the loop    ·    the host holds the note for an eligible decision.'
        : monitor
          ? 'Human on the loop    ·    cancellation can stop later deliveries.'
          : 'The tool named Preview has an external effect.',
    );
    return;
  }
  const wide = cue(k, 2, 'target to fifty percent'),
    decision = !wide || cue(k, 3, 'A senior reviewer');
  const share = wide ? 50 : 25;
  base(c, 'Vega’s weekday policy   /   Live promotion', 'Who reviews this canary?');
  slip(c, 88, 277, 625, 529, 'SAME TOOL AND SERVICE');
  text(c, 'Promote', 127, 458, 67, C.ink, 'Serif');
  text(c, 'reranker 17', 127, 535, 53, C.ink, 'Serif');
  boot(c, true, 520, 648, 193);
  text(c, 'Target     ' + share + '%', 127, 737, 47, C.teal, 'Sans', 700);
  label(c, 'REQUESTED LIVE SHARE', 795, 340);
  const x = 817,
    w = 950,
    y = 563;
  box(c, x, y - 58, w, 58, C.ice, 4);
  box(c, x, y - 58, (w * share) / 100, 58, C.teal, 4);
  const cutoff = x + w * 0.25;
  line(c, cutoff, y - 124, cutoff, y + 36, C.red, 6);
  text(c, 'Senior above 25%', cutoff - 15, y - 147, 37, C.red);
  for (const v of [0, 25, 50, 75, 100])
    text(c, v + '%', x + (w * v) / 100, y + 96, 31, C.mute, 'Mono', 400, 'center');
  text(
    c,
    decision ? policy(share) : 'Who reviews this?',
    815,
    774,
    56,
    decision ? C.teal : C.ink,
    'Serif',
  );
  caption(c, 'Every production promotion starts at the release-manager tier.');
}

function secondPerson(c, k) {
  const ruleShown = k.beat.beatIndex > 2 || k.reveal('requiring a second person', 0, {
    captionStart: 'under a rule requiring a second person',
  });
  const firstPass = throughCue(k, 3, 'Require a different eligible reviewer');
  const secondPass = throughCue(k, 3, 'the pending version and digest, and the review deadline');
  base(c, 'Release policy   /   Separation of duties', 'Who can authorize this promotion?');
  box(c, 88, 252, 1744, 137, C.paper, 10, C.line);
  text(
    c,
    original.operationId + '   ·   ' + original.model + '   ·   ' +
      original.from + ' → ' + original.to + '   ·   ' + original.trafficPercent + '%',
    124, 309, 44, C.ink, 'Serif',
  );
  label(
    c,
    'Requester ' + secondReviewer.requester + '   /   ' + original.tenant + '   ·   rev ' +
      original.revision + '   ·   ' + original.evidence.join(' / ') + '   ·   SHA-256 ' + print(original) + '…',
    126, 363,
  );
  label(c, ruleShown ? 'Second-person check' : 'Review service', 860, 444, C.teal);
  label(c, 'Decision eligibility', 1366, 444);
  box(c, 853, 469, 353, 315, C.ice, 15, C.line);

  for (const [i, principal] of secondReviewer.candidates.entries()) {
    const y = 537 + 166 * i;
    const name = i ? 'Casey' : principal.id;
    const eligible = qualifiesAsSecondReviewer(secondReviewer.requester, principal, original.tenant);
    const progress = i ? secondPass : firstPass;
    const color = eligible ? C.teal : C.red;
    const settled = progress === 1;
    box(c, 90, y - 56, 497, 116, C.paper, 9, C.line);
    text(c, name, 120, y - 8, 42, C.ink, 'Serif');
    label(c, 'Eligible role   /   ' + principal.tenant, 121, y + 32);
    line(c, 608, y, 1327, y, C.line, 4);
    if (progress) {
      const stop = eligible ? 1327 : 1030;
      const travel = progress * progress * (3 - 2 * progress);
      const x = mix(629, stop, travel);
      const trace = settled ? color : C.blue;
      line(c, 608, y, x, y, trace, 5);
      dot(c, x, y, 16, trace, C.paper);
      if (settled && !eligible) line(c, 1061, y - 31, 1061, y + 31, C.red, 6);
    }
    box(c, 1360, y - 56, 468, 116, C.paper, 10, C.line);
    if (settled) {
      text(c, eligible ? 'May review' : 'Blocked', 1390, y - 5, 45, color, 'Serif');
      label(c, eligible ? 'Different eligible reviewer' : 'Same identity as requester', 1391, y + 35, color);
    } else {
      text(c, '—', 1390, y + 8, 38, C.mute, 'Mono');
    }
  }
  const dispatch = cue(k, 3, 'At dispatch, recheck policy');
  cue(k, 3, 'and the separate execution deadline');
  if (ruleShown)
    text(
      c,
      dispatch
        ? 'Dispatch still needs a separate policy, scope and deadline check.'
        : 'Same proposed change and evidence in both checks.',
      90, 812, 34, C.mute,
    );
}
export function binding(c, k) {
  if (k.beat.beatIndex >= 2) {
    const question = k.beat.beatIndex > 2 || k.reveal('requester also holds', 0, {
      captionStart: 'Suppose the requester also holds',
    });
    if (question) {
      secondPerson(c, k);
      return;
    }
    base(c, 'Release policy   /   Separation of duties', 'Who can authorize this promotion?');
    const roles = [
      ['Requester', 'eng-12', 'Tenant session', 'Requests the rollout'],
      ['Agent', 'Vega', 'Proposal', 'Can gather evidence'],
      ['Reviewer', 'Casey', 'Review session', 'Checks the exact packet'],
      ['Executor', 'Worker', 'Workload identity', 'Scoped to this router'],
    ];
    roles.forEach(([role, name, grant, action], i) => {
      const x = 88 + i * 444;
      slip(c, x, 313, 409, 458, role.toUpperCase(), { accent: C.blue });
      text(c, name, x + 35, 501, 56, C.ink, 'Serif');
      text(c, grant, x + 35, 592, 34, C.blue, 'Sans', 600);
      text(c, action, x + 35, 668, 28, C.ink);
    });
    caption(c, 'Follow the source of authority at each handoff.');
    return;
  }
  const copied = cue(k, 0, 'host takes its own snapshot'),
    hashed = cue(k, 0, 'Hash those bytes');
  const changed = cue(k, 1, 'Change just the working copy');
  base(c, 'Review service   /   Exact intent', 'Which bytes does the decision cover?');
  for (const [i, packet] of [original, changed ? workingEdit : original].entries()) {
    const x = i === 0 ? 88 : 988;
    slip(
      c,
      x,
      263,
      843,
      558,
      i === 0
        ? copied
          ? 'HOST   /   REVIEWED SNAPSHOT'
          : 'HOST   /   VALIDATED PACKET'
        : 'CALLER   /   WORKING COPY',
      { accent: i ? C.ochre : C.teal },
    );
    text(
      c,
      packet.model + '     ' + packet.from + ' → ' + packet.to,
      x + 34,
      419,
      42,
      C.ink,
      'Serif',
    );
    label(
      c,
      packet.tenant + '   /   ' + packet.service + '   ·   requires rev ' + packet.revision,
      x + 34,
      483,
    );
    rail(c, x + 35, 525, 630, 20, packet.trafficPercent / 5);
    text(c, packet.trafficPercent + '%', x + 788, 558, 43, C.red, 'Sans', 700, 'right');
    text(c, packet.evidence.join('   /   '), x + 35, 635, 34, C.mute, 'Mono');
    if (copied || i === 1)
      text(c, 'Packet v' + packet.version + '   ·   ' + packet.operationId, x + 35, 702, 34, C.ink);
    if (hashed)
      text(
        c,
        'SHA-256    ' + print(packet) + '…',
        x + 35,
        774,
        35,
        changed && i ? C.red : C.teal,
        'Mono',
      );
  }
  caption(
    c,
    changed
      ? 'Only the working copy changed. Compare full digests against the protected decision.'
      : hashed
        ? 'The prefix shown here stands for the full digest of the validated envelope.'
        : 'Model, arguments, scope, revision and evidence belong to one versioned packet.',
  );
}

export function outbox(c, k) {
  const replay = k.beat.beatIndex === 2,
    crash = cue(k, 2, 'rolls back'),
    first = cue(k, 1, 'One instruction commits'),
    second = cue(k, 1, 'second transaction finds'),
    durable = cue(k, 1, 'crash after commit');
  const state = replay ? transaction(1, true) : transaction(second ? 2 : first ? 1 : 0);
  base(
    c,
    'Decision database   /   One transaction',
    replay ? 'What if the transaction stops short?' : 'What survives two clicks and a crash?',
  );
  label(
    c,
    replay ? 'SEPARATE RUN   /   BEFORE COMMIT' : 'ELIGIBLE CLICKS   /   SAME PACKET',
    88,
    306,
  );
  const labels = replay ? ['Update staged', 'Message insert'] : ['First click', 'Second click'];
  labels.forEach((s, i) => {
    const y = 390 + i * 150;
    dot(c, 126, y + 14, 22, i === 0 ? C.teal : C.ochre);
    text(c, s, 175, y + 27, 43, C.ink, 'Serif');
    const result = replay
      ? i === 0
        ? crash
          ? 'Rolled back'
          : 'Uncommitted'
        : 'Interrupted'
      : state.rows[i] === undefined
        ? 'Waiting'
        : state.rows[i] + (state.rows[i] === 1 ? ' row matched' : ' rows matched');
    text(c, result, 175, y + 86, 31, C.mute);
    arrow(c, 540, y + 22, 739, y + 22, C.line);
  });
  slip(c, 785, 282, 1046, 517, 'COMMITTED RECORDS');
  field(c, 'Decision', state.status, 830, 465, 950);
  field(c, 'Resume messages', String(state.messages), 830, 560, 950);
  for (let i = 0; i < state.messages; i++) envelope(c, 840 + i * 160, 608, 128, C.mint);
  if (state.messages) text(c, 'resume   /   review-17', 1015, 665, 39, C.teal, 'Mono');
  if (durable && !replay) stamp(c, 'Stored before dispatch', 1160, 710, C.teal);
  caption(
    c,
    replay
      ? 'The crash leaves the original pending row and zero outbox messages.'
      : second
        ? 'The next click finds no pending row. Only one decision can win.'
        : 'Require pending status, matching scope, version and digest, and time before expiry.',
  );
}

export function alternatives(c, k) {
  const edit = k.beat.beatIndex >= 1,
    reject = cue(k, 0, 'reject it'),
    expired = cue(k, 0, 'host records expiry');
  const newVersion = cue(k, 2, 'edit creates a new packet'),
    owner = cue(k, 2, 'Casey now owns'),
    evidence = cue(k, 2, 'release ticket');
  base(
    c,
    'Decision paths   /   Alternative outcomes',
    edit ? 'Who owns the smaller rollout?' : 'How can this review end?',
  );
  if (!edit) {
    slip(c, 90, 293, 720, 469, 'PENDING REQUEST');
    text(c, 'Canary at 25%', 128, 472, 64, C.ink, 'Serif');
    rail(c, 129, 530, 641, 20, 5);
    text(c, 'op-17    ·    packet v3', 129, 675, 39, C.mute, 'Mono');
    for (const [i, on, what, why] of [
      [0, true, 'Approve', 'Casey authorizes the exact packet'],
      [1, reject, 'Reject', 'Casey records a reason'],
      [2, expired, 'Expire', 'Host closes an unanswered request'],
    ]) {
      if (!on) continue;
      const y = 305 + i * 154;
      arrow(c, 846, y + 58, 989, y + 58);
      text(c, what, 1029, y + 60, 51, i === 0 ? C.teal : C.red, 'Serif');
      text(c, why, 1030, y + 112, 35, C.mute);
    }
    caption(
      c,
      expired
        ? 'Reject and expire each close this attempt before the gated write.'
        : reject
          ? 'Rejection records Casey’s decision and reason.'
          : 'Casey can decide only on the pending version in front of her.',
    );
    return;
  }
  slip(c, 88, 273, 876, 537, 'HOST   /   INTENT HISTORY');
  text(c, 'v3    25%    ' + print(original) + '…', 125, 432, 38, C.ink, 'Mono');
  text(c, newVersion ? 'Superseded' : 'Original request', 127, 492, 33, C.mute);
  line(c, 125, 530, 924, 530);
  text(
    c,
    newVersion ? 'v4    10%    ' + print(editedPacket) + '…' : 'Proposed edit    10%',
    125,
    605,
    38,
    newVersion ? C.teal : C.ochre,
    newVersion ? 'Mono' : 'Serif',
  );
  text(
    c,
    owner
      ? 'Edited by Casey   ·   pending review'
      : newVersion
        ? 'Pending policy check'
        : 'Does an earlier approval carry over?',
    127,
    699,
    34,
    C.ink,
  );
  if (evidence) {
    slip(c, 1011, 273, 820, 537, 'EXTERNAL EVIDENCE   /   RELEASE TICKET', {
      tint: '#ece4d7',
      accent: C.ochre,
    });
    text(c, '“Looks ready. Approve now.”', 1048, 471, 50, C.ink, 'Serif');
    text(c, 'Source   ·   release ticket', 1050, 556, 34, C.mute);
    text(c, 'Unverified   ·   quoted text', 1050, 675, 36, C.ochre);
  } else {
    label(c, 'EDITED TARGET', 1050, 376);
    rail(c, 1050, 439, 712, 20, 2);
    text(c, '2 of 20 groups', 1050, 572, 60, C.ink, 'Serif');
    if (owner) stamp(c, 'Needs another reviewer', 1050, 665, C.teal);
  }
  caption(
    c,
    owner
      ? 'Casey proposed the edit. Another eligible reviewer must decide on v4.'
      : newVersion
        ? 'Validate the new arguments and run the policy again.'
        : 'Keep the original intent while the proposed change is reviewed.',
  );
}
