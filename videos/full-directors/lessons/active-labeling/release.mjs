import {
  C,
  word,
  mono,
  title,
  heading,
  rect,
  dot,
  line,
  arrow,
  ticket,
  stack,
  band,
  ease,
  f,
} from './studio.mjs';
import {
  ballots,
  judge,
  copies,
  normalize,
  fingerprints,
  oldAudit,
  waitingAudit,
  rebuiltAudit,
  absentAudit,
  freshRows,
  cleanFresh,
  oldId,
  newId,
  checkpoint,
  freshFrozen,
  freshStats,
  finalMatrix,
  freshLog,
  threshold,
} from './cases.mjs';
import { matrix } from './selection.mjs';

const identity = (letter) => (letter === 'A' ? 'X' : 'Y');
function answerSeat(g, x, y, w, letter, answer, chosen) {
  rect(
    g,
    x,
    y,
    w,
    45,
    answer === 'X' ? C.blueWash : C.greenWash,
    chosen ? C.ink : null,
    5,
    chosen ? 2 : 1,
  );
  mono(g, letter, x + 11, y + 23, 15, C.muted);
  word(g, answer, x + w / 2 + 5, y + 23, 25, answer === 'X' ? C.blue : C.green, {
    align: 'center',
    weight: 600,
  });
}
export function boundary(g, { b, cue }) {
  if (b < 3) {
    heading(g, 'A new name can hide a reserved parent', 'SOURCE FAMILIES  /  SPLIT BEFORE SELECTION');
    const positions = [53, 365, 675],
      names = ['Training pool', 'Development', 'Private test'];
    positions.forEach((x, i) => {
      stack(g, x, 162, 231, 154, i === 2 ? C.blueWash : C.white);
      mono(g, names[i], x + 15, 191, 16, i === 2 ? C.blue : C.muted);
      title(g, ['attack-014-copy', 'Tune selector', 'attack-014'][i], x + 13, 245, 22);
      word(g, ['Candidate row', 'Choose weights', 'Frozen family'][i], x + 15, 287, 16);
    });
    if (cue(2, 'Follow the training copy')) {
      line(g, 166, 324, 166, 375, C.red, 2);
      line(g, 166, 375, 790, 375, C.red, 2);
      arrow(g, 790, 375, 790, 324, C.red, 2);
      mono(g, 'parent ID', 479, 400, 17, C.red, 'center');
    }
    return;
  }
  if (b === 5) {
    heading(g, 'What supplied the feedback?', 'CONSTITUTIONAL AI');
    const stages = [
      ['Human principles', 'Guide the critique'],
      ['Revised answer', 'Supervised learning'],
      ['AI preference', 'Reinforcement learning'],
    ];
    stages.forEach(([name, use], i) => {
      const x = 53 + i * 301;
      ticket(g, x, 173, 244, 132, i === 0 ? C.blueWash : C.white);
      title(g, name, x + 13, 207, 23);
      word(g, use, x + 13, 265, 17);
      if (i < 2) arrow(g, x + 251, 238, x + 292, 238, C.ink, 2);
    });
    if (cue(5, 'Here the human labels'))
      band(
        g,
        'In this task, human votes check the judge against the local rubric.',
        53,
        365,
        807,
        C.green,
        C.greenWash,
        48,
      );
    return;
  }
  const swapped = cue(3, 'Swap the answers'),
    mapped = cue(3, 'Map each new');
  heading(g, 'Which answer did the judge pick?', 'BALANCED DISPLAY ORDER  /  THREE HUMAN LABELS');
  mono(g, 'Pair', 49, 132, 15);
  mono(g, 'Human', 229, 132, 15);
  mono(g, 'Original display', 355, 132, 15);
  if (swapped) mono(g, 'Swapped display', 622, 132, 15);
  if (mapped) mono(g, 'Identity', 866, 132, 14);
  judge.rows.forEach((r, i) => {
    const y = 160 + i * 70;
    word(g, r.id, 49, y + 23, 19);
    mono(g, identity(r.human), 258, y + 23, 23, C.ink, 'center');
    answerSeat(g, 345, y, 83, 'A', 'X', r.original === 'A');
    answerSeat(g, 433, y, 83, 'B', 'Y', r.original === 'B');
    if (swapped) {
      arrow(g, 536, y + 22, 580, y + 22, C.muted);
      answerSeat(g, 598, y, 83, 'A', 'Y', r.swapped === 'A');
      answerSeat(g, 686, y, 83, 'B', 'X', r.swapped === 'B');
      if (mapped) {
        const flip = r.mapped !== r.original;
        word(
          g,
          identity(r.original) + ' → ' + identity(r.mapped),
          806,
          y + 22,
          22,
          flip ? C.red : C.green,
        );
      }
    }
  });
  word(g, 'Outlined position  =  judge’s vote', 48, 407, 19);
  if (b >= 4)
    band(g, '2 of 3 identities changed   ·   advisory only', 471, 383, 439, C.red, C.redWash, 45);
  if (b === 4)
    word(
      g,
      'Repeat the balanced displays to separate a position effect from sampling noise.',
      49,
      466,
      18,
    );
}

export function lineage(g, { b, cue }) {
  if (b <= 2) {
    heading(g, 'What survives a fingerprint check?', 'NORMALIZED TEXT  /  SHA-256 PREFIX');
    const normal = cue(1, 'The two normalized rows match'),
      third = cue(1, 'A third row');
    copies.forEach((s, i) => {
      if (i === 2 && !third) return;
      const y = 125 + i * 109;
      ticket(g, 50, y, 542, 79);
      mono(g, ['Original', 'Case and whitespace', 'Paraphrase'][i], 67, y + 17, 12, C.muted);
      word(g, normal && i !== 2 ? normalize(s) : s, 67, y + 50, 23);
      if (normal) {
        arrow(g, 603, y + 38, 657, y + 38, i === 2 ? C.red : C.green, 2);
        mono(g, fingerprints[i], 677, y + 37, 24, i === 2 ? C.red : C.green);
      }
    });
    if (b === 2)
      word(
        g,
        'Choose the normalization for the task. Identifiers in code can be case-sensitive.',
        52,
        468,
        19,
      );
    return;
  }
  heading(g, 'Follow the incident through its rewrites', 'LINEAGE  /  CLAIM ABOUT UNSEEN INCIDENTS');
  const nodes = [
    ['Frozen incident', 'attack-014'],
    ['Copy', 'copy-014'],
    ['Rewrite', 'rewrite-014'],
  ];
  const linked = cue(4, 'Follow the marker'),
    second = cue(4, 'second parent link');
  nodes.forEach(([label, id], i) => {
    const x = 51 + i * 302;
    ticket(g, x, 164, 230, 124, i === 0 ? C.blueWash : C.white);
    mono(g, label, x + 15, 189, 15);
    word(g, id, x + 15, 242, 25);
    if (i && (i === 2 ? linked : second)) arrow(g, x - 4, 227, x - 66, 227, C.red, 3);
    if (b >= 5) mono(g, 'family  attack-014', x + 5, 317, 15, C.green);
  });
  if (b === 3) {
    word(g, 'Group by the unit your claim calls new.', 53, 352, 23);
    word(g, 'Incident   ·   user   ·   document', 53, 399, 21, C.blue);
    if (cue(3, 'three-word sequences'))
      word(g, 'Three-word overlap at 0.5 flags candidates for inspection.', 54, 448, 17);
  }
  if (b === 4) word(g, 'Each arrow follows one recorded parent.', 53, 368, 23);
  if (b === 5) {
    line(g, 74, 354, 857, 354, C.green, 3);
    word(g, 'One source family belongs in one split.', 53, 405, 26, C.green);
  }
}

function gateLatch(g, x, y, open) {
  const ink = open ? C.green : C.red;
  line(g, x - 48, y + 27, x + 60, y + 27, C.line, 2);
  rect(g, x - 47, y - 18, 14, 47, C.ink, null, 3);
  rect(g, x + 48, y - 18, 14, 47, C.ink, null, 3);
  const xx = open ? x - 27 : x + 54,
    yy = open ? y - 94 : y - 8;
  line(g, x - 40, y - 8, xx, yy, ink, 8);
  dot(g, x - 40, y - 8, 6, C.ink);
  word(g, open ? 'Admitted' : 'Held', x + 6, y + 62, 21, ink, { align: 'center', weight: 600 });
}
export function release(g, { b, cue }) {
  let a = oldAudit,
    status = 'Review in progress';
  const removal = cue(2, 'Remove the two related rows', 0.8);
  const rebuilt = removal === 1;
  if (b >= 4) {
    a = absentAudit;
    status = cue(4, 'audit is missing') ? 'Report absent' : 'Awaiting report';
  } else if (cue(3, 'the gate opens')) {
    a = rebuiltAudit;
    status = 'Completed · current rows';
  } else if (rebuilt) {
    a = waitingAudit;
    status = 'New report pending';
  } else if (b >= 2) {
    status = 'Overlap found';
  }
  const open = a.open;
  heading(
    g,
    b === 6 ? 'The checkpoint keeps its training history' : 'Does the report cover these rows?',
    'RELEASE MANIFEST  /  ' + a.manifest.dataset,
  );
  if (b === 6) {
    stack(g, 63, 175, 262, 143);
    mono(g, 'EXPOSED CHECKPOINT', 78, 205, 15, C.red);
    word(g, 'Trained on frozen family', 78, 259, 19);
    arrow(g, 342, 236, 466, 168, C.green, 2);
    arrow(g, 342, 244, 466, 339, C.blue, 2);
    band(g, 'Clean checkpoint + audited clean rows', 487, 136, 411, C.green, C.greenWash, 51);
    word(g, 'Retrain, then use the original holdout.', 495, 219, 20);
    band(g, 'Existing checkpoint + independent test', 487, 307, 411, C.blue, C.blueWash, 51);
    word(g, 'Measure on a fresh family.', 495, 386, 20);
    return;
  }
  const y = 120;
  stack(g, 46, y, 367, 307);
  mono(g, a.manifest.evaluation + ' held out', 63, y + 23, 14, C.blue);
  word(g, 'Training snapshot', 62, y + 60, 23);
  a.rows.forEach((r, i) => {
    const bad = r.family === 'attack-014',
      yy = y + 91 + i * 38;
    mono(g, r.id, 67 + (bad && !rebuilt ? removal * 60 : 0), yy, 17, bad && b >= 2 ? C.red : C.ink);
    line(g, 62, yy + 19, 396, yy + 19, C.line);
  });
  mono(g, a.rows.length + ' rows   #' + a.digest.slice(0, 9), 64, y + 276, 17, C.blue);
  mono(g, 'Source   2026-09   ·   hybrid-v1', 48, 458, 14);
  mono(g, 'Rubric v4   ·   redactor v2', 48, 482, 14);
  const rx = 465;
  title(g, 'Audit report', rx, 140, 26);
  word(g, status, rx, 182, 20, open ? C.green : C.muted);
  if (b === 1) {
    [
      'Redaction and permissions',
      'Agreement and safe targets',
      'Resolved decisions and provenance',
    ].forEach((v, i) => word(g, v, rx, 234 + i * 38, 17));
  } else if (b <= 3) {
    [
      ['Agreement', f(ballots(120).kappa, 3) + ' ≥ 0.65'],
      ['Family overlap', open ? 'clear' : rebuilt ? 'pending' : '2 related rows'],
      ['Snapshot', open ? 'matched' : rebuilt ? 'pending' : 'matched'],
    ].forEach(([k, v], i) => {
      const yy = 245 + i * 48;
      mono(g, k, rx, yy, 13);
      word(g, v, rx + 135, yy, 17, v === 'pending' ? C.muted : v === '2 related rows' ? C.red : C.green);
    });
    if (open) mono(g, '#' + a.digest.slice(0, 9), rx, 399, 18, C.green);
  } else {
    word(g, 'Previous release admitted', rx, 238, 18, C.green);
    word(g, 'New release requires its own audit.', rx, 279, 17);
    if (b === 5) {
      word(g, 'Undefined κ, invalid counts, unsafe pairs', rx, 329, 16, C.red);
      word(g, 'Each can block admission.', rx, 360, 17);
    }
  }
  gateLatch(g, 840, 307, open);
}

function familyPremise(g, s) {
  const { b, cue } = s,
    linked = cue(2, 'Follow the parent links');
  mono(g, 'CANDIDATE SNAPSHOT', 482, 120, 14, C.blue);
  const x = 489,
    w = 263,
    ys = [152, 232, 312];
  freshRows.forEach((r, i) => {
    ticket(g, x, ys[i], w, 55, C.white);
    mono(g, r.id, x + 12, ys[i] + 29, 17, C.ink);
  });
  rect(g, 650, 410, 255, 48, C.blueWash, C.blue, 4);
  mono(g, 'Frozen  ·  incident-seven', 777, 433, 14, C.blue, 'center');
  if (linked) {
    const color = b >= 4 ? C.red : C.muted;
    arrow(g, 620, 311, 620, 289, color, 2);
    line(g, 753, 260, 825, 260, color, 2);
    arrow(g, 825, 260, 825, 408, color, 2);
    mono(g, 'parent', 764, 242, 12, color);
    mono(g, 'parent', 638, 300, 12, color);
  }
}
function repairSnapshot(g, s) {
  const t = ease(s.cue(4, 'Lift both rows', 0.85)),
    done = t === 1;
  const id = done ? newId : oldId;
  heading(g, 'Lift the entire frozen family out', 'NEW BATCH  /  BEFORE TRAINING');
  stack(g, 53, 137, 391, 275);
  mono(g, 'Training snapshot', 72, 165, 17, C.blue);
  mono(
    g,
    (done ? cleanFresh.length + ' row' : freshRows.length + ' rows') + '  #' + id,
    70,
    387,
    16,
    C.blue,
  );
  rect(g, 535, 137, 372, 275, C.redWash, C.line, 6);
  mono(g, 'Excluded   ·   incident-seven', 554, 166, 15, C.red);
  freshRows.forEach((r, i) => {
    const x = 72 + (i ? 480 * t : 0),
      y = 193 + i * 54 - (i ? 18 * Math.sin(Math.PI * t) : 0);
    ticket(g, x, y, 338, 42, i && done ? C.white : C.paper);
    mono(g, r.id, x + 12, y + 22, 17, i && done ? C.red : C.ink);
  });
  mono(g, 'Completed report   #' + oldId, 69, 455, 18, C.muted);
  if (done)
    word(
      g,
      s.b === 5 ? 'Recheck rows and agreement' : 'Report covers the earlier rows',
      552,
      455,
      20,
      C.red,
    );
}
function checkpointHistory(g, s) {
  const removed = s.cue(6, 'Now remove'),
    reply = s.cue(7, 'No');
  heading(g, 'Which snapshot trained this checkpoint?', 'SAME CASE  /  AFTER TRAINING');
  stack(g, 53, 127, 355, 115);
  mono(g, 'Original   #' + oldId, 73, 152, 17, C.blue);
  word(g, '3 rows  ·  includes incident seven', 72, 198, 19);
  if (removed) {
    stack(g, 53, 304, 355, 116);
    mono(g, 'Rebuilt    #' + newId, 73, 330, 17, C.green);
    word(g, '1 permitted row', 72, 378, 23, C.green);
  }
  ticket(g, 533, 127, 361, 115);
  mono(g, 'Existing checkpoint', 551, 151, 17);
  word(g, 'Trained on   #' + checkpoint.trainedOn, 551, 197, 19);
  arrow(g, 530, 184, 419, 184, C.blue, 3);
  if (reply) {
    band(g, 'Incident seven was seen in training', 520, 289, 376, C.red, C.redWash, 45);
    if (s.cue(7, 'start from a clean checkpoint'))
      word(g, 'Clean restart → retrain → frozen test', 523, 364, 18, C.green);
    if (s.cue(7, 'fresh independent test'))
      word(g, 'Existing checkpoint → fresh test', 523, 408, 18, C.blue);
  }
}
function eventLog(g, { b, cue }) {
  heading(g, 'Did the canary wait for sign-off?', 'INDEPENDENT FAMILY  /  SIMULATED ACTION LOG');
  const X = (m) => 273 + 175 * m;
  [0, 1, 2, 3].forEach((m) => {
    line(g, X(m), 149, X(m), 352, C.line, 1, [3, 4]);
    mono(g, '10:0' + m, X(m), 383, 16, C.muted, 'center');
  });
  const events = [
    ['Traffic changed', freshLog.changed, C.red, 'Traffic changed at'],
    ['Sign-off arrived', freshLog.approved, C.green, 'Sign-off arrived'],
  ];
  events.forEach(([label, m, color, phrase], i) => {
    const y = 198 + i * 93;
    word(g, label, 44, y, 21);
    line(g, 248, y, 849, y, C.line, 1.4);
    if (cue(8, phrase)) {
      const ink = b === 9 ? color : C.blue;
      dot(g, X(m), y, 10, ink);
      mono(g, '10:0' + m, X(m) + 18, y - 21, 17, ink);
    }
  });
  if (b === 9) {
    const y = 433;
    line(g, X(freshLog.changed), y, X(freshLog.approved), y, C.red, 3);
    mono(
      g,
      freshLog.approved - freshLog.changed + ' min early',
      (X(1) + X(2)) / 2,
      y + 24,
      17,
      C.red,
      'center',
    );
    if (cue(9, 'failed approval check'))
      band(g, 'Approval check failed', 660, 410, 249, C.red, C.redWash, 46);
  }
}
export function practice(g, s) {
  const { b, cue } = s;
  if (b >= 8) return eventLog(g, s);
  if (b >= 6) return checkpointHistory(g, s);
  if (b === 5 || cue(4, 'Lift both rows')) return repairSnapshot(g, s);
  heading(g, 'Can this batch go to training?', 'NEW BATCH  /  80 INDEPENDENT PAIRS');
  mono(g, 'Reviewer 1', 50, 151, 14, C.muted);
  matrix(g, finalMatrix, 139, 182, 78, ['A', 'B'], null, !!cue(3, 'count the diagonal'));
  word(g, 'Required   κ ≥ ' + f(threshold), 54, 393, 22);
  if (b >= 3) {
    if (cue(3, 'Sixty-four of eighty')) mono(g, '64/80 = .80', 56, 435, 18, C.blue);
    if (cue(3, 'one half')) mono(g, 'chance .50', 238, 435, 18, C.blue);
    if (cue(3, 'kappa of point six'))
      band(
        g,
        'κ = ' + f(freshStats.kappa) + '   ·   reopen ' + freshStats.disagreements + ' disagreements',
        52,
        462,
        392,
        C.red,
        C.redWash,
        38,
      );
  }
  familyPremise(g, s);
}
