import {
  C,
  box,
  line,
  dot,
  tx,
  label,
  serif,
  opacity,
  frame,
  foot,
  cue,
  paper,
  mark,
} from './instrument.mjs';
import { scored, release, releaseGate, canaryPacket, windows, canary, practice } from './examples.mjs';

function specimen(g, x, y, n, min, kind, tone) {
  label(g, kind.toUpperCase(), x, y);
  const step = 12;
  for (let i = 0; i < 100; i++) {
    const px = x + (i % 20) * step,
      py = y + 18 + Math.floor(i / 20) * step;
    box(
      g,
      px,
      py,
      8.5,
      8.5,
      i < n ? tone : i < min ? C.peach : C.grid,
      i >= n && i < min ? C.rust : null,
      1,
    );
  }
  tx(g, n + ' / 100', x + 263, y + 51, 26, tone, 'Mono', 600);
  tx(g, 'Requires ' + min, x + 263, y + 76, 16, C.muted);
}
export function evaluation(g, k) {
  const b = k.beat.beatIndex,
    score = cue(k, 0, 'ninety-four of a hundred'),
    passed = cue(k, 0, 'Recall passes'),
    book = cue(k, 0, 'Open the retrieved runbook'),
    claim = cue(k, 1, 'It says the job resumes'),
    cit = cue(k, 2, 'ninety-three support'),
    deficit = cue(k, 2, 'Two more'),
    leaks = cue(k, 2, 'zero permission leaks'),
    hold = cue(k, 3, 'Hold the candidate');
  frame(g, k, 'Release · candidate C2',
    b === 0 ? 'Did retrieval find enough relevant documents?' : 'Does the citation support the answer?');
  paper(g, 40, 127, 421, 265, '#ecf1dd');
  label(g, 'RETRIEVED   /   RUNBOOK · §4', 61, 164);
  opacity(g, Math.max(0, 1 - 2 * book), () => {
    box(g, 77, 191, 148, 165, '#d4dfce', C.teal, 4);
    box(g, 72, 186, 148, 165, '#376f63', null, 4);
    box(g, 82, 186, 6, 165, '#20534c');
    line(g, 103, 239, 199, 239, C.mint, 2);
    tx(g, 'Operations', 103, 221, 18, C.white, 'Serif');
    tx(g, 'Runbook', 103, 269, 23, C.white, 'Serif');
    tx(g, '§4', 103, 323, 20, C.mint, 'Mono');
    tx(g, 'Queue recovery', 250, 254, 22, C.ink, 'Serif');
    label(g, 'INDEX HIT', 251, 280);
  });
  opacity(g, Math.max(0, 2 * book - 1), () => {
    serif(g, 'Resuming a job', 60, 203, 27);
    tx(g, '“Ask an owner before', 61, 240, 22);
    tx(g, 'resuming the job.”', 61, 266, 22);
  });
  if (b >= 1) {
    line(g, 61, 286, 439, 286, C.rule);
    label(g, 'CANDIDATE ANSWER   /   CITES §4', 61, 314);
    opacity(g, claim, () =>
      tx(g, '“The job resumes automatically.”', 61, 352, 21, C.ink, 'Serif', 500),
    );
  }
  opacity(g, score, () =>
    specimen(g, 498, 152, scored.recall, scored.recallMinimum, 'Relevant documents found', C.teal),
  );
  opacity(g, passed, () => mark(g, 505, 253, 'Recall clears the host minimum', C.teal));
  opacity(g, cit, () =>
    specimen(
      g,
      498,
      293,
      scored.faithfulness,
      scored.faithfulnessMinimum,
      'Citations supporting their claim',
      C.rust,
    ),
  );
  const gate = release();
  foot(
    g,
    hold
      ? 'RELEASE RECEIPT   /   C2   ·   ' +
          (gate.launchAllowed ? 'PASS' : 'HOLD') +
          '   /   0 OBSERVED LEAKS'
      : leaks
        ? 'PERMISSION LEAKS OBSERVED IN THIS SAMPLE   /   0'
        : b >= 2
          ? 'TWO INDEPENDENT SAMPLES OF 100'
          : b === 1
            ? 'READ THE SOURCE BESIDE THE CLAIM'
            : 'LABELED RETRIEVAL SAMPLE   /   100 RELEVANT DOCUMENTS',
    hold
      ? 'Hold for citation faithfulness · inspect the unsupported claims.'
      : deficit
        ? '93 supported citations, 95 required. Which decision follows?'
        : b === 1 && claim
          ? 'Does section 4 support automatic resumption?'
          : 'What can we establish from this evidence?',
  );
}

export function rollout(g, k) {
  if (!cue(k, 2, 'For the original passing packet')) {
    const hasFalse = cue(k, 0, 'Would Boolean false') > 0,
      zero = cue(k, 1, 'Require an integer zero') > 0,
      copy = cue(k, 1, 'Copy the packet') > 0,
      changedEcho = cue(k, 1, "Change the evaluator's recall minimum") > 0,
      decide = cue(k, 2, 'Hold the copy') > 0;
    const packet = canaryPacket(zero ? 0 : hasFalse ? false : null, changedEcho);
    const gate = releaseGate(packet);
    frame(g, k, copy ? 'Release · C3 packet copy' : 'Release · candidate C3',
      copy ? 'Does this packet use the host policy?' : 'What counts as measured evidence?');
    paper(g, 43, 126, 874, 269);
    label(g, 'PACKET FIELD', 64, 166);
    label(g, 'OBSERVATION', 314, 166);
    label(g, 'ECHOED MINIMUM', 545, 166);
    label(g, 'HOST POLICY', 735, 166);
    for (const [i, [metric, name]] of [['recall', 'Retrieval recall'], ['faithfulness', 'Citation faithfulness']].entries()) {
      const y = 215 + i * 70, echo = packet[metric + 'Minimum'];
      line(g, 63, y + 16, 894, y + 16, C.rule);
      tx(g, name, 64, y, 20);
      tx(g, packet[metric].toFixed(2), 314, y, 21, C.teal, 'Mono', 600);
      tx(g, echo.toFixed(2), 545, y, 21, decide && echo !== gate.minima[metric] ? C.rust : C.ink, 'Mono', 600);
      tx(g, '≥ ' + gate.minima[metric].toFixed(2), 735, y, 20, C.ink, 'Mono');
    }
    tx(g, 'Permission leaks', 64, 355, 20);
    const count = packet.leaks === 0 ? '0  (integer)' : packet.leaks === false ? 'False  (Boolean)' : 'Missing';
    tx(g, count, 314, 355, 20, zero ? C.teal : C.ink, 'Mono', 600);
    tx(g, 'Integer 0', 735, 355, 20, C.ink, 'Mono');
    let receipt = hasFalse ? 'Does False say how many leaks were measured?' : 'The leak count is still missing.';
    if (gate.launchAllowed) receipt = 'Local checks pass · eligible for a small canary.';
    if (copy) receipt = changedEcho
      ? 'What should the host do with this copy?'
      : 'The copy starts with the same measurements and policy.';
    if (decide && gate.failures.includes('recall')) receipt = 'Hold the copy · its recall minimum differs from host policy.';
    foot(
      g,
      copy ? 'C3   /   ORIGINAL PACKET ELIGIBLE   /   INDEPENDENT COPY' : 'HOST CHECKS OBSERVATIONS, POLICY AND LEAK COUNT',
      receipt,
    );
    return;
  }
  frame(g, k, 'Canary · independent windows', 'Which window can expand?');
  label(g, 'WINDOW', 53, 168);
  label(g, 'ERROR RATE', 205, 168);
  label(g, 'P95 LATENCY', 399, 168);
  label(g, 'LEAKS', 596, 168);
  label(g, 'DECISION', 741, 168);
  const resultCues = ['Expand the first', 'Hold the second', 'Roll back the third'];
  windows.forEach(([error, ms, leaks], i) => {
    const y = 226 + i * 72,
      action = canary(error, ms, leaks);
    line(g, 50, y + 18, 910, y + 18, C.rule);
    tx(g, 'ABC'[i], 53, y, 25, C.ink, 'Mono', 600);
    tx(g, error === null ? 'Missing' : +(error * 100).toFixed(1) + '%', 205, y, 22, C.ink, 'Mono');
    tx(g, ms === null ? 'Missing' : ms + ' ms', 399, y, 22, C.ink, 'Mono');
    tx(g, leaks, 596, y, 22, leaks ? C.rust : C.ink, 'Mono', 600);
    opacity(g, cue(k, 3, resultCues[i]), () =>
      tx(g, action, 741, y, 24, action === 'Expand' ? C.teal : C.rust, 'Sans', 600),
    );
  });
  foot(
    g,
    'FRESH WINDOWS · ADEQUATE SAMPLE   /   ERROR ≤ 1%   /   P95 ≤ 900 ms',
    !cue(k, 3, 'Roll back the third')
      ? 'Choose a decision for each window.'
      : 'A confirmed leak triggers rollback and containment.',
  );
}

export function rehearsal(g, k) {
  const b = k.beat.beatIndex,
    seen = cue(k, 1, 'Capacity accepts') > 0,
    ageRead = cue(k, 1, 'Retrieval holds') > 0,
    releaseRead = cue(k, 1, 'Release holds') > 0,
    ageNew = cue(k, 2, 'Refresh the snapshot') > 0,
    countNew = cue(k, 2, 'recover a measured integer zero') > 0,
    doc = cue(k, 2, 'One last decision') > 0,
    ex = cue(k, 3, 'Exclude the finance plan') > 0,
    route = cue(k, 3, 'If route B later promises') > 0;
  const cap = practice(false).cap,
    snapshot = practice(ageNew),
    packet = practice(countNew);
  frame(
    g,
    k,
    'Interview rehearsal · R-205',
    route ? 'When would you move the queue?' : 'What can each owner authorize?',
  );
  if (route) {
    const split = cue(k, 3, 'give it its own queue budget') > 0;
    label(g, 'ADMISSION', 62, 166);
    label(g, 'WAIT BUDGET', 427, 166);
    label(g, 'MODEL ADAPTER', 757, 166);
    const originY = 274;
    box(g, 58, originY - 24, 132, 48, C.dark, null, 4);
    tx(
      g,
      split ? 'Route select' : 'Shared queue',
      124,
      originY + 8,
      18,
      C.white,
      'Sans',
      600,
      'center',
    );
    line(g, 190, originY, 255, originY, C.muted, 2);
    line(g, 255, 218, 255, 330, C.muted, 2);
    for (const [i, t] of [250, 100].entries()) {
      const y = 218 + i * 112,
        color = i ? C.rust : C.teal;
      line(g, 255, y, 730, y, C.muted, 2);
      line(g, 720, y - 6, 730, y, C.muted, 2);
      line(g, 720, y + 6, 730, y, C.muted, 2);
      if (split) {
        for (let j = 0; j < 3; j++) box(g, 273 + j * 20, y - 12, 17, 24, C.white, color, 2);
        tx(g, 'Queue ' + (i ? 'B' : 'A'), 272, y + 39, 16, color, 'Sans', 600);
      }
      box(g, 419, y - 8, t * 0.8, 16, color);
      tx(g, t + ' ms', 425, y - 21, 18, color, 'Mono', 600);
      box(g, 747, y - 23, 137, 46, C.white, C.rule, 3);
      tx(g, 'Route ' + (i ? 'B' : 'A'), 814, y + 8, 20, C.ink, 'Sans', 600, 'center');
    }
    foot(
      g,
      'DESIGN LOG   /   ROUTE B NOW HAS A TIGHTER PROMISE',
      split
        ? 'Route-specific queues let admission enforce each wait budget.'
        : 'Does one shared waiting line still fit both promises?',
    );
    return;
  }
  label(g, 'DECISION OWNER', 54, 148);
  label(g, 'CURRENT EVIDENCE', 293, 148);
  label(g, 'DECISION', 748, 148);
  const lines = [
    [
      'Scheduler',
      '25,000 tokens ÷ 125,000 tokens/s',
      '1 free slot · 16 blocks free / 16 needed',
      seen && cap.admitted ? 'Accept · 200 ms' : 'Decide…',
    ],
    [
      'Retrieval',
      'Snapshot age  ' + snapshot.age + ' s   /   limit  60 s',
      'Current document grant still required',
      ageRead ? (snapshot.fresh ? 'Usable' : 'Stale · hold') : 'Decide…',
    ],
    [
      'Release',
      'Recall  .96 / .92    Citations  .97 / .95',
      'Observed leaks  ' + (packet.leaks === 0 ? '0 (integer)' : 'missing'),
      releaseRead ? (packet.gate.launchAllowed ? 'Canary eligible' : 'Hold') : 'Decide…',
    ],
  ];
  lines.forEach(([who, a, d, res], i) => {
    const y = 190 + i * 80;
    line(g, 52, y + 42, 910, y + 42, C.rule);
    tx(g, who, 54, y + 9, 23, C.ink, 'Serif');
    tx(g, a, 293, y, 17);
    tx(g, d, 293, y + 27, 15, C.muted);
    tx(
      g,
      res,
      748,
      y + 11,
      19,
      res === 'Decide…' ? C.muted : /hold/i.test(res) ? C.rust : C.teal,
      'Sans',
      600,
    );
  });
  foot(
    g,
    doc
      ? 'R-205   /   CALLER GROUP = EMPLOYEES   /   DOCUMENT = FINANCE-PLAN'
      : 'INDEPENDENT CHECKS   /   TEAM UNDER QUOTA   /   WAIT BUDGET 250 ms',
    ex && !packet.finance
      ? 'Finance plan excluded · current finance grant missing.'
      : doc
        ? 'Can this employee cite the finance plan?'
        : b === 2
          ? 'Refresh the two pieces of evidence that changed.'
          : 'Trace the limit, owner and decision for each boundary.',
  );
}
