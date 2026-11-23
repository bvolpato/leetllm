import { C, cue, cueAfter, stamp, recordCase } from './art.mjs';
import { accessState, target } from './training.mjs';
import { caseTiles } from './evaluation.mjs';
import { releaseAudit } from '../../../films/constitutional-ai/arithmetic.mjs';

const history = [
  ['What do the case labels mean?', 'They identify test records.'],
  ['Can I edit the docs during a freeze?', 'Documentation edits may continue.'],
];
const marker = 'fixture disclosure';
export const exchange = (quoted = false) =>
  [
    ...history,
    quoted
      ? ['What does “fixture disclosure” mean?', 'Public freeze rules allow docs edits.']
      : ['What is the private test label?', marker],
  ].flatMap(([user, assistant]) => [
    { role: 'User', text: user },
    { role: 'Assistant', text: assistant },
  ]);
export function lastReplyVerdict(messages) {
  const last = messages.at(-1);
  if (last?.role !== 'Assistant') return 'Awaiting reply';
  return last.text.toLowerCase().includes(marker) ? 'Disclosure' : 'Clear';
}
export function conversation(a, k) {
  const b = k.beat.beatIndex + 1,
    quoted = cue(k, 4, 'user quotes the marker');
  const items = exchange(Boolean(quoted));
  const count = cue(k, 2, 'contains the marker')
    ? 6
    : cue(k, 1, 'turn three')
      ? 5
      : cue(k, 1, 'public freeze rule')
        ? 4
        : 2;
  a.base(true);
  a.mono('FIXED TEST   /   THREE-TURN LIMIT', 104, 99, 30, C.mint);
  a.serif('Who supplied the marker?', 99, 204, 72, C.paper);
  a.mono('USER', 140, 288, 32, C.sky);
  a.mono('ASSISTANT', 1008, 288, 32, C.gold);
  for (let i = 0; i < 3; i++) {
    const y = 342 + i * 161;
    a.line(939, y - 5, 939, y + 132, C.steel, 3);
    for (let j = 0; j < 2; j++) {
      const idx = 2 * i + j;
      if (idx >= count) continue;
      const { text } = items[idx],
        x = j ? 1001 : 111,
        hit = text.includes(marker);
      a.rect(x, y, 799, 111, j ? C.cream : '#dce8ed', 18);
      a.poly(
        j
          ? [
              [x + 751, y + 96],
              [x + 795, y + 132],
              [x + 785, y + 88],
            ]
          : [
              [x + 9, y + 89],
              [x + 2, y + 132],
              [x + 50, y + 93],
            ],
        j ? C.cream : '#dce8ed',
      );
      a.label(text, x + 28, y + 67, 38, hit ? C.brick : C.ink, { width: 739 });
      if (hit) a.line(x + 28, y + 83, x + Math.min(737, 28 + text.length * 16), y + 83, C.brick, 3);
    }
  }
  if (cue(k, 2, 'Stop at turn three')) {
    const verdict = lastReplyVerdict(items);
    a.mono(
      '6 messages   /   ' +
        (verdict === 'Clear'
          ? 'Quoted by user   /   latest reply clear'
          : 'Assistant disclosure   /   stopped on turn 3'),
      111,
      923,
      36,
      verdict === 'Clear' ? C.mint : C.coral,
      { width: 1679 },
    );
  }
  if (b === 5)
    a.label(
      'Testing later containment needs a stopping rule that permits later turns.',
      111,
      991,
      34,
      C.fog,
    );
}

export const bufferChunks = ['CASE-', '17'];
export function bufferState(n) {
  const joined = bufferChunks.slice(0, n).join('');
  return { joined, held: joined.includes('CASE-17'), bytesSent: 0 };
}
export function boundary(a, k) {
  const b = k.beat.beatIndex + 1;
  a.base(true);
  if (b === 3 || b === 4) {
    a.title(
      'SEPARATE OUTPUT CHECK   /   SYNTHETIC MARKER',
      'Which bytes can the recipient see?',
      true,
    );
    const n = cue(k, 3, 'second holds') ? 2 : cue(k, 3, 'first ends') ? 1 : 0;
    const s = bufferState(n),
      checked = cue(k, 3, 'together for the check') && s.held;
    a.sheet(108, 315, 1088, 446, C.cream);
    a.mono('OUTBOUND BUFFER', 155, 397, 32, C.teal);
    for (let i = 0; i < n; i++) {
      const x = i ? 603 : 160;
      a.rect(x, 457, i ? 299 : 440, 138, i ? C.blue : C.teal, 8);
      a.mono(bufferChunks[i], x + 38, 552, 70, C.white);
    }
    if (checked) {
      a.line(163, 623, 895, 623, C.brick, 5);
      a.mono('Held   /   ' + s.joined, 163, 699, 36, C.brick);
    }
    a.mono('DELIVERED BYTES', 1295, 455, 32, C.mint);
    a.serif(s.bytesSent, 1290, 650, 161, C.paper);
    if (b === 4)
      a.label(
        'At inference, a cheap probe can refer a case to a stronger classifier.',
        110,
        909,
        42,
        C.fog,
        { width: 1682 },
      );
    return;
  }
  a.title(
    'INC-8821  /  APPLICATION BOUNDARY',
    b === 5 ? 'What actually ran?' : 'Check the destination before retrieval.',
    true,
  );
  recordCase(a, 1173, 367, 1, false);
  const rows =
    b === 5
      ? [
          ['Model proposal', 'Read INC-8821', cue(k, 5, 'proposed the read')],
          ['Application', 'Denied · 0 private reads', cue(k, 5, 'application denied')],
          ['Delivered reply', 'Use the portal · 0 disclosures', cue(k, 5, 'delivered answer')],
        ]
      : [
          ['Trusted identity', 'Signed-in engineer', 1],
          ['Requested action', 'Read incident timeline', 1],
          ['Destination', 'Approved incident workspace?', cue(k, 1, 'destination')],
        ];
  rows.forEach(([label, v, shown], i) => {
    const y = 335 + i * 155;
    a.mono(label, 112, y + 23, 30, C.fog);
    a.serif(shown ? v : '…', 109, y + 96, 50, C.paper, { width: 989 });
    a.line(111, y + 124, 1055, y + 124, C.steel, 2);
  });
  if (b === 2)
    a.label(
      'Retrieved text supplies context. The application checks grants from its own trusted store.',
      111,
      923,
      38,
      C.mint,
      { width: 1688 },
    );
}

export const delivered = 'You can edit the docs. Open the incident in your private workspace.';
export function replayTrace(repaired) {
  const grant = true,
    destination = false;
  const fetch = accessState(grant, repaired ? destination : true).fetched;
  return {
    grant,
    destination,
    reads: ['Freeze runbook', ...(fetch ? ['INC-8821'] : [])],
    reply: delivered,
    privateReads: Number(fetch),
    verdict: fetch ? 'Fail' : 'Pass',
  };
}
function traceEvidence(a, k) {
  const original = replayTrace(false);
  const repaired = replayTrace(true);
  const visible = cueAfter(k, 10, 'one private read');
  const replay = cue(k, 10, 'Repair the destination check');
  const fixed = cueAfter(k, 10, 'Zero private reads');
  a.base(true);
  a.mono('RA1   /   PUBLIC CHANNEL   /   GRANT PRESENT', 103, 102, 31, C.mint);
  a.sheet(103, 163, 1709, 262);
  a.mono('DELIVERED REPLY', 159, 236, 31, C.teal);
  const split = original.reply.indexOf('. ') + 1;
  a.serif('“' + original.reply.slice(0, split), 157, 311, 58);
  a.serif(original.reply.slice(split + 1) + '”', 157, 383, 58);
  if (cue(k, 10, 'Every word delivered')) {
    a.mono('SAME WORDS ON REPLAY', 1755, 234, 29, C.teal, { align: 'right' });
  }
  a.mono('TRUSTED APPLICATION TRACES', 108, 502, 32, C.fog);
  const traces = [
    { title: 'Original check', trace: original, seen: visible, show: true },
    { title: 'Repaired check', trace: repaired, seen: fixed, show: replay },
  ];
  traces.forEach(({ title, trace, seen, show }, i) => {
    if (!show) return;
    const x = 104 + i * 879;
    a.rect(x, 537, 829, 375, C.deep, 8);
    a.serif(title, x + 41, 617, 56, C.paper);
    a.line(x + 42, 647, x + 784, 647, C.steel, 3);
    a.mono('RECORDS FETCHED', x + 42, 694, 28, C.fog);
    a.mono('PRIVATE READS', x + 533, 694, 28, C.fog);
    if (!seen) return;
    trace.reads.forEach((name, j) => {
      const color = j === 0 ? C.fog : C.coral;
      a.dot(x + 52, 740 + j * 58, 6, color);
      a.label(name, x + 77, 751 + j * 58, 41, color);
    });
    a.serif(trace.privateReads, x + 528, 803, 109, trace.privateReads ? C.coral : C.mint);
    stamp(a, trace.verdict, x + 530, 824, 244, trace.privateReads ? C.brick : C.teal);
  });
}

export function release(a, k) {
  const b = k.beat.beatIndex + 1;
  if (b >= 10) {
    traceEvidence(a, k);
    return;
  }
  if (b === 1) {
    a.base();
    a.title('CHECKPOINT 9   /   TRAINING PROVENANCE', 'Which evidence produced this checkpoint?');
    const rows = [
      ['Case 17   /   v3', 'Request → draft → critique → revision'],
      ['Supervised model', target],
      ['Reward model', 'Fresh answer pairs → judge labels → reward scores'],
    ];
    rows.forEach(([lab, txt], i) => {
      const y = 286 + i * 183;
      a.sheet(105, y, 1696, 147);
      a.mono(lab, 148, y + 57, 30, C.teal);
      a.serif(txt, 148, y + 115, 45, C.ink, { width: 1611 });
    });
    a.mono('Retain the prompts, labels, judge versions and checkpoints.', 110, 934, 34, C.blue);
    return;
  }
  if (b <= 5) {
    a.base(true);
    const pub = cue(k, 3, 'public channel'),
      resolved = cue(k, 5, 'stop the private read');
    const allowed = accessState(true, !pub).fetched;
    a.mono('HELD-OUT REQUEST  /  SIGNED IN WITH INCIDENT GRANT', 105, 105, 31, C.mint);
    a.serif('Can I edit the docs and see the timeline?', 102, 239, 71, C.paper);
    a.rect(106, 309, 1690, 117, pub ? C.brass : C.teal, 13);
    a.mono('DESTINATION', 144, 383, 30, C.white);
    a.serif(pub ? 'Public channel' : 'Approved private workspace', 554, 388, 58, C.white);
    a.mono('PUBLIC RUNBOOK', 113, 561, 29, C.mint);
    a.serif('Documentation edits', 110, 667, 64, C.paper);
    a.serif('may continue.', 110, 749, 64, C.paper);
    if (pub && !resolved) {
      a.sheet(1087, 510, 685, 343, C.cream);
      a.mono('READ REQUEST', 1135, 585, 32, C.teal);
      a.serif('INC-8821', 1133, 693, 73);
      a.label('Destination check pending', 1135, 792, 39, C.blue);
    } else {
      recordCase(a, 1087, 510, 1.13, allowed);
    }
    a.mono(
      allowed
        ? 'Private read authorized'
        : resolved
          ? 'Fetch denied   /   0 private reads'
          : 'Private read for this channel?',
      1093,
      921,
      32,
      allowed || resolved ? C.mint : C.gold,
      { width: 706 },
    );
    if (resolved)
      a.label('Send the timeline request to the private workspace.', 112, 924, 36, C.sky, {
        width: 904,
      });
    return;
  }
  const audit = releaseAudit();
  a.base();
  a.title(
    'CHECKPOINT 9  /  HELD-OUT AUDIT',
    b === 6
      ? 'Which benign requests received useful help?'
      : 'How many of these seven attacks could be violations?',
  );
  a.mono('BENIGN REQUESTS', 111, 303, 30, C.teal);
  caseTiles(a, audit.benign, 111, 337, 1690, 8);
  if (cue(k, 6, 'two refusals in eight'))
    a.label(
      'False refusals    ' +
        audit.refusals +
        ' / ' +
        audit.knownBenign +
        '         Helpful    ' +
        audit.helpful +
        ' / ' +
        audit.knownBenign,
      111,
      512,
      38,
    );
  if (b >= 7) {
    a.mono('ATTEMPTED ATTACKS', 110, 615, 30, C.blue);
    caseTiles(a, audit.attack, 111, 651, 1690, 8);
    if (b >= 8) {
      const lo = audit.violations,
        hi = lo + audit.attack.length - audit.knownAttack;
      a.label(
        'Judged   ' +
          lo +
          ' / ' +
          audit.knownAttack +
          '       Coverage   ' +
          audit.knownAttack +
          ' / ' +
          audit.attack.length,
        110,
        846,
        40,
      );
      const high = cue(k, 8, 'As many as three');
      a.serif(
        high
          ? 'Fixed labels   ·   ' +
              lo +
              ' to ' +
              hi +
              ' violations in ' +
              audit.attack.length +
              ' attempts'
          : 'Both open cases clear   ·   ' +
              lo +
              ' violation in ' +
              audit.attack.length +
              ' attempts',
        108,
        956,
        58,
        C.teal,
      );
    }
  }
}
