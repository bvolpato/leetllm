import {
  P,
  box,
  line,
  dot,
  arrow,
  txt,
  mono,
  cap,
  serif,
  stage,
  caption,
  cue,
  fade,
} from './paint.mjs';
import { replay, vectorState, countAt, history, noon } from './mechanics.mjs';

const pointText = (v) => '[' + v.map((n) => Number(n.toFixed(2))).join(', ') + ']';

function featureSheet(c) {
  box(c, 100, 350, 878, 476, P.dark);
  cap(c, 'release_pattern_embedding', 144, 405, P.ice);
  for (let i = 0; i <= 4; i++) {
    const x = 244 + i * 145;
    line(c, x, 450, x, 759, '#426067', 1);
    mono(c, i, x, 797, 26, P.ice, 'center');
  }
}
export function featureScene(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0 && !cue(k, 0, 'Open one request')) {
    stage(
      c,
      'DEPLOYMENT ESTIMATE',
      'When did the western deployment finish?',
      'DeployBuddy   /   us-west   /   request req_8a2',
    );
    const arrived = cue(k, 0, 'Wednesday at noon', 0.45);
    for (const [i, [day, tag, col, visible]] of [
      ['Tuesday', 'Predicted finish', P.blue, 1],
      ['Wednesday', 'Observed finish', P.amber, arrived],
    ].entries()) {
      const x = 248 + i * 860;
      line(c, x + 20, 412, x + 563, 412, P.ink, 3);
      box(c, x, 431, 585, 352, P.white);
      box(c, x, 431, 585, 70, col);
      txt(c, tag, x + 30, 479, 36, P.white);
      fade(c, visible, () => {
        serif(c, day, x + 29, 627, 77, col);
        mono(c, '12:00', x + 31, 723, 62);
      });
      for (let j = 0; j < 4; j++) line(c, x + 65 + 145 * j, 395, x + 65 + 145 * j, 452, P.dark, 10);
    }
    caption(
      c,
      arrived
        ? 'A full day separates the predicted finish from the observed finish.'
        : 'DeployBuddy passed the offline checks.',
    );
    return;
  }
  if (b === 3) {
    stage(
      c,
      'RESPONSE LINEAGE',
      'What would reproduce the estimate?',
      'Trace req_8a2   /   us-west',
    );
    const labels = [
      'Prompt / base / adapter',
      'Feature view',
      'Transform fingerprint',
      'Code revision',
    ];
    const rows = [
      ['support@2.8   ·   base@42   ·   lora@1.9', 'releases@4', 'ce667443…   /   L2', 'a7d812b'],
      ['support@2.8   ·   base@42   ·   lora@1.9', 'releases@5', '660645c4…   /   raw', '9f3c2a1'],
    ];
    cap(c, 'Known-good manifest', 600, 391, P.blue);
    cap(c, 'Served manifest  /  release-a91', 1230, 391, P.amber);
    labels.forEach((s, i) => {
      const y = 459 + i * 98;
      line(c, 100, y + 27, 1815, y + 27, P.line);
      txt(c, s, 105, y, 37);
      if (i === 0) {
        mono(c, rows[0][0], 600, y, 36, P.muted);
      } else
        for (let j = 0; j < 2; j++)
          mono(c, rows[j][i], j ? 1230 : 600, y, 36, j ? P.amber : P.blue);
    });
    caption(
      c,
      'Replay the recorded request with each transform. Compare the predicted finish times.',
    );
    return;
  }
  stage(
    c,
    'REQUEST REPLAY',
    'Which path produced the served input?',
    'req_8a2   /   us-west     ·     same prompt, base weights and adapter',
  );
  featureSheet(c);
  const slide = cue(k, 1, 'Lay the serving vector', 1.25);
  const rawShown = cue(k, 0, 'Open one request', 0.5);
  const offline = replay.normalized,
    raw = replay.raw;
  const sx = (v) => 244 + v * 145;
  ['x', 'y'].forEach((label, i) => {
    const y = 527 + 140 * i;
    mono(c, label, 158, y + 12, 38, P.ice);
    line(c, 244, y, sx(4) + 38, y, '#708186');
    box(c, 244, y - 18, offline[i] * 145, 36, '#83ded2');
    dot(c, sx(offline[i]), y, 13, '#83ded2');
    fade(c, rawShown, () => {
      const row = y - 62 * (1 - slide);
      line(c, 244, row, sx(raw[i]), row, '#f5b37d', 6);
      dot(c, sx(raw[i]), row, 10, '#f5b37d');
    });
  });
  const scoredOff = cue(k, 2, 'The offline score');
  const scoredRaw = cue(k, 2, 'The serving score');
  const chosen = cue(k, 2, 'Replay the raw path');
  cap(c, chosen ? 'Offline check   /   L2' : 'Offline check', 1064, 404, P.aqua);
  mono(c, pointText(offline), 1061, 483, 64, P.aqua);
  cap(c, chosen ? 'Serving trace   /   raw' : 'Serving trace', 1064, 586, P.amber);
  fade(c, rawShown, () => mono(c, pointText(raw), 1061, 665, 64, P.amber));
  if (chosen) {
    cap(c, 'Fixed scorer', 1478, 403);
    mono(c, '(x + y) / 2', 1478, 457, 35);
    if (scoredOff) mono(c, replay.offlineScore.toFixed(2), 1478, 526, 54, P.aqua);
    if (scoredRaw) mono(c, replay.onlineScore.toFixed(2), 1478, 667, 54, P.amber);
  } else {
    txt(c, 'Feature values in the golden set', 1066, 537, 31, P.muted);
    fade(c, rawShown, () => txt(c, 'Values recorded for req_8a2', 1066, 718, 31, P.muted));
  }
  caption(
    c,
    scoredRaw
      ? 'The fixed scorer received different numbers on the two paths.'
      : chosen
        ? 'Replay the raw serving path through the fixed scorer.'
        : 'Choose a replay for [3, 4]    ·    divide by length, or keep the raw coordinates?',
    chosen ? P.amber : P.aqua,
  );
}

export function vectorsScene(c, k) {
  const progress = cue(k, 2, 'Slide both tips', 2.4);
  const [a, b] = vectorState(progress);
  const projections = cue(k, 1, 'Drop the tips', 0.65);
  const rawWins = cue(k, 1, 'A wins');
  const unitWins = cue(k, 2, 'B wins');
  const cosine = k.beat.beatIndex === 3;
  stage(
    c,
    'RETRIEVAL REPLAY',
    'Which document reaches farther along the query?',
    cosine
      ? 'Cosine similarity   /   q = [1, 0]   /   read the horizontal coordinate of each unit vector'
      : 'Dot product   /   query q = [1, 0]   /   the horizontal coordinate is the score',
  );
  const ox = 282,
    oy = 766,
    scale = 97;
  for (let n = 0; n <= 5; n++) {
    const x = ox + scale * n;
    line(c, x, 356, x, oy, P.grid);
    mono(c, n, x, oy + 91, 25, P.muted, 'center');
    if (n < 5) {
      line(c, ox, oy - n * scale, ox + 5 * scale, oy - n * scale, P.grid);
      mono(c, n, ox - 28, oy - n * scale + 8, 25, P.muted, 'right');
    }
  }
  arrow(c, ox, oy, 852, oy, P.ink, 3);
  arrow(c, ox, oy, ox, 341, P.ink, 3);
  txt(c, 'q', 866, oy + 12, 36, P.ink, 'Serif');
  if (projections || progress) {
    c.save();
    c.beginPath();
    c.arc(ox, oy, scale, Math.PI * 1.5, 2 * Math.PI);
    c.strokeStyle = P.muted;
    c.setLineDash([5, 6]);
    c.lineWidth = 2;
    c.stroke();
    c.restore();
    fade(c, progress, () => {
      [
        [3, 4],
        [2, 0],
      ].forEach(([x, y]) => line(c, ox, oy, ox + scale * x, oy - scale * y, P.line, 4, [6, 8]));
    });
  }
  const vecs = [a, b];
  vecs.forEach(({ point: [x, y] }, i) => {
    const tx = ox + x * scale,
      ty = oy - y * scale,
      col = i ? P.amber : P.blue;
    if (!i && projections) fade(c, projections, () => line(c, tx, ty, tx, oy, col, 3, [7, 7]));
    arrow(c, ox, oy, tx, ty, col, 9, 22);
    if (i === 0) mono(c, 'A', tx - 16, ty - 16, 35, col, 'right');
    else mono(c, 'B', tx, ty + 43, 35, col, 'center');
  });
  cap(c, 'Document coordinates', 940, 379);
  for (let i = 0; i < 2; i++) {
    const v = vecs[i],
      y = 451 + i * 155,
      col = i ? P.amber : P.blue;
    mono(c, (i ? 'B  ' : 'A  ') + pointText(v.point), 940, y, 43, col);
    if (projections) {
      line(c, 945, y + 49, 945 + 3.25 * 205, y + 49, P.grid, 4);
      line(c, 945, y + 49, 945 + v.score * 205, y + 49, col, 14);
      mono(c, v.score.toFixed(2), 1770, y + 62, 42, col, 'right');
    }
  }
  txt(
    c,
    cosine
      ? 'Cosine scores for either copy'
      : progress === 1
        ? 'Both documents have length 1'
        : progress > 0
          ? 'Moving both tips along their original directions'
          : 'Same origin and query for both documents',
    944,
    777,
    35,
    P.muted,
  );
  if (cosine) mono(c, 'A  0.60       B  1.00', 944, 835, 37);
  caption(
    c,
    cosine
      ? 'Cosine already divides by length. A zero vector needs a fallback.'
      : unitWins
        ? 'B wins on direction alone.'
        : progress === 1
          ? 'Read the two new projections.'
          : progress > 0
            ? 'Each bar follows its own tip.'
            : rawWins
              ? 'A wins with the raw vectors. Predict the result at unit length.'
              : 'Compare the horizontal distances from zero.',
  );
}

const timecode = (h) => {
  const mins = Math.round(h * 60);
  return String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
};
export function historyScene(c, k) {
  const tight = cue(k, 2, 'one hour') > 0,
    age = tight ? 1 : 24;
  const decided = tight ? cue(k, 3, 'Neither reading survives') : cue(k, 2, 'It could use five');
  const showLate = cue(k, 0, 'A correction', 0.55);
  const eastSeen = cue(k, 0, 'western region');
  stage(
    c,
    'HISTORICAL FEATURE LOOKUP',
    'Which count can the noon request use?',
    'April 10    ·    query by region    ·    event age ≤ ' + age + ' h    ·    available by 12:00',
  );
  const x = (h) => 420 + 225 * (h - 8);
  box(c, x(tight ? 11 : 8), 383, x(12) - x(tight ? 11 : 8), 363, '#e3ece3');
  for (let h = 8; h <= 14; h++) {
    line(c, x(h), 378, x(h), 765, h === 12 ? P.ink : P.grid, h === 12 ? 4 : 2);
    mono(c, timecode(h), x(h), 805, 28, P.muted, 'center');
  }
  cap(c, 'Request', x(12) - 42, 359);
  if (tight) cap(c, 'Cutoff', x(11) - 42, 359, P.aqua);
  const rows = [...history[0], ...history[1]];
  rows.forEach((r, i) => {
    const alpha = [1, showLate, eastSeen][i];
    fade(c, alpha, () => {
      const y = 447 + i * 128;
      txt(c, ['West  /  initial', 'West  /  correction', 'East  /  initial'][i], 103, y + 9, 36);
      line(c, x(r.event), y, x(r.available), y, P.blue, 5);
      dot(c, x(r.event), y, 10, P.blue);
      box(c, x(r.available) - 8, y - 8, 16, 16, P.amber);
      mono(
        c,
        String(r.value) + ' at ' + timecode(r.event),
        x(r.event) - 16,
        y - 19,
        27,
        P.blue,
        'right',
      );
      mono(
        c,
        timecode(r.available),
        x(r.available) + (i === 2 ? -16 : 18),
        y + 34,
        27,
        P.amber,
        i === 2 ? 'right' : 'left',
      );
    });
  });
  const val = countAt(0, age),
    other = countAt(1, age);
  const word = val === null ? 'missing' : String(val);
  caption(
    c,
    decided
      ? 'West returns ' + word + '     ·     East returns ' + other
      : 'Event time (circle)     ·     Available to serving (square)     ·     Which western count qualifies?',
    decided ? P.aqua : P.blue,
  );
}
