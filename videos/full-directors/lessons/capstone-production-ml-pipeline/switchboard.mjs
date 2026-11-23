import {
  P,
  box,
  line,
  dot,
  txt,
  mono,
  title,
  small,
  page,
  sheet,
  at,
  parcel,
  handset,
  doorstep,
  strip,
  arrow,
} from './art.mjs';
import { bundle, chain, originalArtifact, probeRelease, receiptState, OFFLINE_CASES, gate, HAND_FAIL, fitted } from './lab.mjs';

function switchTrack(c, x, y, release) {
  const a = x + 75,
    b = x + 222,
    dy = 51;
  line(c, x, y, a, y, P.ink, 5);
  for (const [rel, yy] of [
    ['v0', y - dy],
    ['v1', y + dy],
  ]) {
    const active = rel === release;
    line(c, a, y, b, yy, active ? P.teal : P.line, active ? 7 : 3);
    dot(c, b, yy, 8, active ? P.teal : P.line);
    box(c, b + 13, yy - 24, 100, 47, active ? P.teal : P.pale, 6);
    mono(c, rel, b + 63, yy + 9, 23, active ? P.cream : P.mute, 'center');
  }
  dot(c, a, y, 12, P.ink);
  dot(c, a, y, 5, P.gold);
}
function linkedReceipt(c, x, y, w, id, main, sub, active) {
  sheet(c, x, y, w, 179, active ? P.cream : P.pale);
  box(c, x, y, 9, 179, active ? P.teal : P.line);
  small(c, id, x + 22, y + 39);
  title(c, main, x + 22, y + 95, 31);
  txt(c, sub, x + 22, y + 142, 19, active ? P.teal : P.mute);
}
export function promotion(c, k) {
  page(c, P.ivory);
  const b = k.beat.beatIndex + 1;
  const moved = !!at(k, 2, 'moves production to version one');
  const release = moved ? receiptState(3, 3, 250).production : 'v0';
  const scored = !!at(k, 3, 'score is point nine eight');
  const metrics = originalArtifact.metrics;
  title(c, 'Which records support this move?');
  linkedReceipt(c, 63, 145, 312, chain.ready.id, 'Ready', 'Day 0 + day 7 · base v0', true);
  arrow(c, 379, 229, 425, 229, P.slate);
  linkedReceipt(
    c,
    430,
    145,
    312,
    chain.ready.admissionId,
    'Accepted',
    'Canary admitted · base v0',
    !!at(k, 1, 'offline receipt two'),
  );
  arrow(c, 748, 229, 792, 229, P.slate);
  linkedReceipt(
    c,
    801,
    145,
    335,
    chain.admission.evidenceId,
    'Offline evidence',
    metrics.hits + ' / ' + metrics.positives + ' critical · cost ' + metrics.cost + ' / ' + metrics.base,
    !!at(k, 1, 'offline evidence three'),
  );
  if (at(k, 1, 'registered artifact')) {
    line(c, 811, 325, 811, 346, P.ocean, 2);
    line(c, 811, 346, 825, 346, P.ocean, 2);
    mono(c, chain.evidence.artifactId + ' · ' + originalArtifact.fingerprint.slice(0, 12), 834, 352, 16, P.ocean);
  }
  line(c, 66, 374, 1136, 374, P.line);
  small(c, 'LOCAL PRODUCTION', 67, 408);
  switchTrack(c, 75, 503, release);
  txt(c, 'Canary', 446, 458, 21, P.mute);
  mono(c, moved ? 'empty' : 'v1', 445, 498, 26);
  if (moved) {
    txt(c, 'Audit', 447, 550, 21, P.mute);
    mono(c, '3 · v0 → v1', 445, 590, 22);
  }
  if (scored) {
    const p = probeRelease(release, 9);
    title(c, '9 min → ' + p.score.toFixed(2), 734, 450, 37);
    txt(c, 'Warning threshold 0.50', 734, 497, 21, P.mute);
    txt(c, p.warning ? 'Warn' : 'Silent', 734, 547, 29, P.teal, { bold: true });
  } else {
    txt(c, moved ? 'Local switch committed' : 'Expected base v0', 735, 475, 28, P.ocean);
    if (b === 2 && !moved) txt(c, 'Check live base before commit.', 735, 524, 20);
  }
}
function dial(c, x, y, value, label, col) {
  box(c, x + 5, y + 7, 191, 151, '#192e2e38', 10);
  box(c, x, y, 191, 151, col, 10);
  mono(c, value, x + 96, y + 101, 66, P.cream, 'center');
  line(c, x + 2, y + 74, x + 189, y + 74, '#142e3335', 3);
  small(c, label, x, y + 187);
}
export function generation(c, k) {
  page(c);
  const b = k.beat.beatIndex + 1;
  if (b === 4) {
    title(c, 'Which worker answered the request?');
    const stages = [
      ['Load', 'package v1'],
      ['Ready', 'features compatible'],
      ['Route', 'served revision'],
    ];
    for (const [i, [a, s]] of stages.entries()) {
      const x = 90 + i * 366;
      box(c, x, 208, 272, 184, P.deep, 7);
      for (let row = 0; row < 3; row++) {
        box(c, x + 21, 224 + row * 50, 230, 38, '#426664', 3);
        for (let u = 0; u < 6; u++) box(c, x + 43 + u * 15, 236 + row * 50, 8, 12, '#294a49');
        dot(c, x + 223, 243 + row * 50, 6, P.mint);
      }
      if (i < 2) arrow(c, x + 275, 305, x + 349, 305);
      title(c, a, x, 457, 35);
      txt(c, s, x, 497, 21);
    }
    strip(c, 591, 'Recovery interval', 'Load → readiness → routed response', P.ocean);
    return;
  }
  title(c, 'A release name can come back');
  small(c, 'WRITER ACQUIRED', 68, 169);
  dial(c, 70, 200, 'v0', 'Expected release', P.ocean);
  dial(c, 277, 200, '41', 'Expected generation', P.ocean);
  const at42 = at(k, 2, 'selects version two'),
    at43 = at(k, 2, 'returns to version zero');
  const version = at43 ? 'v0' : at42 ? 'v2' : 'v0',
    counter = at43 ? 43 : at42 ? 42 : 41;
  small(c, 'LIVE PRODUCTION', 669, 169);
  dial(c, 670, 200, version, 'Selected release', P.teal);
  dial(c, 877, 200, counter, 'Alias generation', P.teal);
  mono(c, '→', 569, 287, 41, P.slate, 'center');
  if (b === 1) {
    strip(c, 548, 'Atomic commit', 'Match release + generation, commit pointer + audit', P.ocean);
  } else if (b === 2) {
    txt(c, 'Observed sequence', 69, 486, 21, P.mute);
    mono(
      c,
      'v0 @ 41' + (at42 ? '   →   v2 @ 42' : '') + (at43 ? '   →   v0 @ 43' : ''),
      68,
      545,
      33,
    );
  } else {
    strip(c, 544, 'Release matches  ·  generation 41 ≠ 43', 'Reject stale write', P.rust);
  }
}
export function compareModels(c, k) {
  page(c, P.ivory);
  const a = HAND_FAIL[1],
    f = fitted[1],
    b = k.beat.beatIndex + 1;
  title(c, 'One scan, two offline evaluations');
  parcel(c, 78, 250, 210, '02');
  small(c, 'DELIVERY 02', 68, 486);
  mono(c, a.x + ' min', 67, 540, 39);
  txt(c, 'Late · critical', 69, 580, 23, P.rust);
  const cards = [
    { x: 353, t: 'Hand-entered', row: a, gate: gate(HAND_FAIL), shown: true },
    { x: 763, t: 'Fitted package', row: f, gate: gate(fitted), shown: b >= 2 },
  ];
  for (const { x, t, row, gate: m, shown } of cards) {
    if (!shown) continue;
    sheet(c, x, 173, 368, 375);
    small(c, 'OFFLINE EVALUATION', x + 23, 213);
    title(c, t, x + 22, 266, 34);
    mono(c, row.id + '   /   ' + row.x + ' min', x + 23, 308, 20);
    line(c, x + 22, 327, x + 344, 327, P.line);
    const showAction =
      row === a ? at(k, 1, 'got no warning') : at(k, 2, 'score at point eight six');
    if (showAction) {
      txt(c, row.pred ? '0.86 · Warn' : 'No warning', x + 23, 373, 30, row.pred ? P.teal : P.rust, {
        bold: true,
      });
      txt(c, 'Row cost   ' + row.cost + ' units', x + 23, 420, 22);
    }
    if (b >= 3) {
      line(c, x + 24, 446, x + 342, 446, P.line);
      mono(c, m.hits + '/' + m.positives + ' warned', x + 24, 482, 22);
      mono(c, 'Cost   ' + m.cost + ' / ' + m.base, x + 24, 521, 22);
    }
  }
  if (b === 4) title(c, 'Which package is serving?', 353, 618, 36);
}
export function finale(c, k) {
  const b = k.beat.beatIndex + 1;
  const has3 = at(k, 2, 'Receipt three'),
    has4 = at(k, 2, 'receipt four'),
    has5 = at(k, 5, 'issues receipt five');
  const tried = at(k, 3, 'Hold promotion'),
    restored = at(k, 3, 'Restore just the original latency limit');
  const retryHeld = at(k, 4, 'latest receipt is still four');
  const raised = at(k, 2, 'three hundred milliseconds') && !restored;
  const limit = raised ? 300 : 250;
  const current = has5 ? 5 : has4 ? 4 : 3;
  const selection = at(k, 6, 'selects version one')
    ? receiptState(5, current, limit).production
    : 'v0';
  const same = OFFLINE_CASES[1];
  const result = probeRelease(selection, same.x);
  const scoreBeat = selection === 'v1' ? 6 : 1;
  const scorePhrase = selection === 'v1' ? 'scores point eight six' : 'scores zero';
  const scored = b > scoreBeat || (b === scoreBeat && k.elapsed + 1e-9 >= k.wordCue(scorePhrase).end);
  const lit = !!(scored && result.warning && at(k, 6, 'warning reaches'));
  const quiet = !!(scored && !result.warning && at(k, 1, 'No warning reaches this phone'));
  page(c, P.ivory);
  // The same tall window, door plate and taped carton belong to doorstep two in chapter one.
  c.save();
  c.beginPath();
  c.rect(743, 0, 457, 506);
  c.clip();
  doorstep(c, 743, 0, 457, 506, 2);
  parcel(c, 799, 380, 111, '02');
  c.restore();
  handset(c, 1013, 225, 138, {
    lit,
    line1: 'Parcel post',
    line2: 'Delay alert',
    line3: 'Parcel 02',
  });
  title(c, 'Who answers delivery two?', 53, 72.25, 44);
  small(c, 'LOCAL RELEASE LAB', 55, 110);
  box(c, 54, 123.5, 639, 175, '#dbe5d6', 6);
  small(c, 'REQUESTED', 72, 159.5);
  small(c, 'CURRENT', 285, 159.5);
  small(c, 'p95 LIMIT', 492, 159.5);
  mono(c, has5 && b >= 6 ? '5 · Ready' : has3 ? '3 · Ready' : '—', 73, 203.5, 22);
  mono(c, has5 ? '5 · Ready' : has4 ? '4 · Hold' : has3 ? '3 · Ready' : '—', 285, 203.5, 22);
  mono(c, limit + ' ms', 491, 203.5, 23, raised ? P.rust : P.ink);
  line(c, 71, 227.5, 673, 227.5, P.line);
  let status = 'Production selects v0';
  if (tried && !has5) {
    const move = receiptState(3, current, limit);
    status =
      move.reasons.length === 2
        ? 'Hold · superseded receipt and changed policy'
        : retryHeld
          ? 'Hold · receipt 4 supersedes receipt 3'
          : 'Policy restored · retry receipt 3?';
  } else if (has5)
    status =
      selection === 'v1' ? 'Promoted with receipt 5' : 'Ready receipt filed · production still v0';
  txt(c, status, 72, 270.5, 21, tried && !has5 ? P.rust : P.deep, { bold: true });
  small(c, 'DELIVERY 02  /  SAME SCAN', 55, 346);
  title(c, same.x + ' min', 54, 420, 49);
  switchTrack(c, 207, 397, selection);
  const travel =
    selection === 'v1'
      ? at(k, 6, 'Replay the same eight-minute scan', 1.35)
      : at(k, 1, 'Replay delivery two', 1.35);
  if (travel > 0 && travel < 1) {
    const along = travel * (75 + Math.hypot(147, 51));
    const branch = Math.max(0, (along - 75) / Math.hypot(147, 51));
    const x = 207 + Math.min(along, 75) + 147 * branch,
      y = 397 + (selection === 'v1' ? 51 : -51) * branch;
    dot(c, x, y, 10, P.gold);
    dot(c, x, y, 5, P.ink);
  }
  small(c, 'PRODUCTION', 270, 494);
  const scoreX = (value) => 55 + value * 403;
  const scoreY = 514;
  const threshold = bundle.threshold;
  const gateX = scoreX(threshold);
  line(c, 55, scoreY, 458, scoreY, P.line, 5);
  line(c, gateX, scoreY - 13, gateX, scoreY + 9, P.orange, 3);
  mono(c, '0', scoreX(0), 539, 15, P.mute, 'center');
  mono(c, threshold.toFixed(2) + ' threshold', gateX, 539, 17, P.rust, 'center');
  mono(c, '1', scoreX(1), 539, 15, P.mute, 'center');
  if (scored) {
    const pos = scoreX(Math.min(1, Math.max(0, result.score)));
    dot(c, pos, scoreY, 9, result.warning ? P.teal : P.ocean);
    mono(
      c,
      selection + ' score  ' + result.score.toFixed(2),
      504,
      525,
      26,
      result.warning ? P.teal : P.ocean,
    );
    if (lit || quiet)
      txt(c, lit ? 'Warning received' : 'No warning', 1140, 525, 27, lit ? P.teal : P.ink, {
        bold: true,
        align: 'right',
      });
  } else txt(c, 'Awaiting replay', 504, 525, 25, P.mute);
}
