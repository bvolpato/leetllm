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
  tag,
  strip,
} from './art.mjs';
import {
  train,
  z,
  bundle,
  cross,
  squares,
  trainingSum,
  fitted,
  scans,
  selected,
  gate,
  HAND_FAIL,
  frac,
  delta,
  probeRelease,
} from './lab.mjs';

export function opening(c, k) {
  const gateResult = gate(HAND_FAIL);
  page(c, P.ivory);
  for (const i of [0, 1]) {
    const x = i * 600;
    doorstep(c, x, 0, 600, 410, i + 1);
    const land = Math.min(1, k.elapsed / 1.05);
    const lift = k.beat.beatIndex === 0 ? 26 * (1 - land) ** 2 : 0;
    parcel(c, x + 88, 302 - lift, 107, '0' + (i + 1));
    const lit = i === 0 && at(k, 1, 'a warning came through');
    handset(c, x + 414, 143, 124, {
      lit,
      line1: 'Parcel post',
      line2: 'Delay alert',
      line3: 'Parcel 01',
    });
    tag(c, x + 39, 23, 200, 'CRITICAL  /  LATE', P.ink, P.cream);
    txt(
      c,
      'Delivery ' + (i + 1) + (i === 1 && at(k, 4, 'eight minutes') ? '  ·  8 min' : ''),
      x + 39,
      442,
      34,
      P.ink,
      { family: 'Serif' },
    );
    if (at(k, 1, i === 0 ? 'a warning came through' : 'stayed dark'))
      txt(c, i === 0 ? 'Warning received' : 'No warning', x + 360, 438, 21, lit ? P.teal : P.mute);
  }
  line(c, 600, 0, 600, 410, P.ink, 6);
  line(c, 38, 457.5, 1162, 457.5, P.line);
  if (at(k, 2, 'Across all four')) {
    small(c, 'TEST COST   /   TRIAL VS. BASELINE', 40, 480.75);
    mono(c, '4 × 24 = ' + gateResult.cost + '    /    4 × 25 = ' + gateResult.base, 40, 521.75, 25);
  } else {
    small(c, 'WARNING LOG  /  TWO LATE CRITICAL PARCELS', 40, 489.75);
  }
  if (at(k, 2, 'at least ninety percent')) {
    small(c, 'CANARY ENTRY', 678, 480.75);
    mono(c, 'Cost ≤ baseline   ·   Recall ≥ 90%', 678, 518.75, 22);
  }
  if (at(k, 3, 'Keep it offline')) {
    box(c, 0, 528.75, 1200, 70, P.deep);
    box(c, 0, 669, 1200, 6, P.deep);
    txt(c, 'Hold offline', 40, 569.75, 31, P.cream, { family: 'Serif' });
    txt(
      c,
      gateResult.hits +
        ' of ' +
        gateResult.positives +
        ' warned    ·    ' +
        frac(gateResult.recall) +
        ' recall',
      300,
      567.75,
      24,
      P.cream,
    );
    txt(c, delta(gateResult.delta) + ' cost', 980, 567.75, 23, P.mint);
  } else if (at(k, 2, 'Would you open')) title(c, 'Open the canary?', 40, 560.75, 37);
}
const minutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
export function clocks(c, k) {
  page(c);
  const b = k.beat.beatIndex + 1;
  if (b >= 6) {
    title(c, 'When may the answer key be opened?');
    const x = (d) => 125 + (d - 20) * 86;
    line(c, 125, 322, 1090, 322, P.slate, 4);
    for (const day of [20, 22, 25, 28, 30, 31]) {
      const xx = x(day);
      line(c, xx, 310, xx, 335, P.ink, 3);
      mono(c, 'May ' + day, xx, 370, 19, P.ink, 'center');
    }
    function event(day, y, first, second, col) {
      const xx = x(day);
      line(c, xx, y + 12, xx, 303, col, 2);
      dot(c, xx, 305, 6, col);
      txt(c, first, xx, y - 22, 22, col, { align: 'center', bold: true });
      txt(c, second, xx, y + 3, 17, P.mute, { align: 'center' });
    }
    event(20, 199, 'Training', 'requests', P.ocean);
    event(22, 249, 'Outcomes', 'available', P.teal);
    if (at(k, 6, 'cutoff')) {
      line(c, x(25), 148, x(25), 341, P.orange, 4, [7, 6]);
      txt(c, 'Fit cutoff', x(25), 128, 23, P.rust, { align: 'center' });
    }
    if (at(k, 6, 'May twenty-eight')) event(28, 193, 'Evaluation', 'requests', P.ocean);
    if (at(k, 6, 'May thirty-one')) {
      event(30, 250, 'Outcomes', 'available', P.teal);
      line(c, x(31), 148, x(31), 341, P.orange, 4, [7, 6]);
      txt(c, 'Snapshot', x(31), 128, 23, P.rust, { align: 'center' });
      sheet(c, 150, 436, 900, 118);
      small(c, 'MAY 28 REQUEST', 177, 475);
      mono(c, 'Input: 9 min from scan A', 175, 522, 24);
      line(c, 600, 454, 600, 533, P.line);
      small(c, 'EVALUATION ONLY', 635, 475);
      mono(c, 'May 30 carrier outcome', 635, 522, 24, P.teal);
    }
    return;
  }
  const early = b === 5;
  title(c, early ? 'Move the prediction to 09:00' : 'Which scan could the service read at noon?');
  small(c, 'DELIVERY 01   /   MAY 28   /   UTC', 65, 137);
  const X = (t) => (early ? 420 + (minutes(t) - 540) * 2.74 : 340 + (minutes(t) - 600) * 3.8);
  const cutoff = early ? '09:00' : '12:00';
  const cutoffX = X(cutoff);
  box(c, 319, 177, cutoffX - 319, 312, '#dce7ce');
  line(c, cutoffX, 169, cutoffX, 505, P.orange, 4, [8, 5]);
  mono(c, cutoff, cutoffX, 156, 20, P.rust, 'center');
  for (let i = 0; i < scans.length; i++) {
    const s = scans[i],
      y = 232 + i * 112;
    const chosen = at(k, 3, 'Use the nine minutes') && !early && s === selected;
    const col = chosen ? P.teal : P.slate;
    mono(c, 'SCAN ' + s.id, 64, y + 2, 25, col);
    txt(c, s.delay + ' min', 65, y + 34, 21, P.ink);
    const start = X(s.from),
      end = X(s.to);
    line(c, start, y, end, y + 38, col, 4);
    dot(c, start, y, 7, col);
    box(c, end - 7, y + 31, 14, 14, chosen ? P.teal : P.ocean);
    mono(c, s.from, start - 10, y - 13, 17, col, 'center');
    mono(c, s.to, end + 5, y + 70, 17, P.ocean, 'center');
  }
  if (b === 4) {
    strip(c, 597, 'Same parcel and instant', '10:00 UTC   =   06:00 UTC−04', P.ocean);
  } else if (b === 5) {
    strip(c, 597, 'No eligible scan', 'Missing delay   →   saved imputer', P.ocean);
  } else {
    small(c, '●  Carrier observed', 66, 578);
    small(c, '■  Service could read', 276, 578);
    if (at(k, 3, 'Use the nine minutes'))
      txt(c, 'Use A  ·  ' + selected.delay + ' minutes', 1129, 584, 29, P.teal, {
        align: 'right',
        bold: true,
      });
  }
}
export function fitScene(c, k) {
  page(c, P.ivory);
  const b = k.beat.beatIndex + 1;
  const zero = !!at(k, 6, 'Look at the zero-minute input');
  const solved = zero
    ? !!at(k, 7, 'negative point one')
    : !!at(k, 6, 'gives a score of point eight six');
  title(c, b < 5 ? 'Fit on six training deliveries' : 'Replay a scan on the fitted line');
  const X = (x) => 120 + x * 65,
    Y = (y) => 480 - y * 268;
  const py = (y) => Y(y);
  for (const n of [0, 0.5, 1]) {
    line(
      c,
      X(0),
      py(n),
      X(10),
      py(n),
      n === 0.5 && b >= 5 ? P.orange : P.line,
      2,
      n === 0.5 ? [6, 6] : [],
    );
    mono(c, n.toFixed(1), 88, py(n) + 7, 18, P.mute, 'right');
  }
  small(c, 'Late label / score', 63, 153);
  line(c, X(0), py(1.13), X(0), py(-0.23), P.slate);
  for (let i = 0; i <= 10; i += 2) {
    line(c, X(i), py(-0.14), X(i), py(-0.14) + 7, P.slate);
    mono(c, i, X(i), py(-0.14) + 32, 19, P.slate, 'center');
  }
  txt(c, 'Recorded delay (minutes)', X(5), 596, 23, P.ink, { align: 'center' });
  if (at(k, 4, 'slope of one point two')) {
    line(
      c,
      X(0),
      Y(probeRelease('v1', 0).score),
      X(10),
      Y(probeRelease('v1', 10).score),
      P.teal,
      4,
    );
  }
  for (const row of train) dot(c, X(row.x), Y(row.y), 9, '#697b77');
  if (b < 5 && at(k, 1, 'we get five')) {
    line(c, X(5), Y(-0.12), X(5), Y(1.07), P.ocean, 2, [5, 5]);
    mono(c, 'mean 5', X(5), Y(1.1) - 8, 19, P.ocean, 'center');
  } else if (b >= 5) {
    const input = zero ? 0 : 8,
      probe = probeRelease('v1', input);
    line(c, X(input), Y(-0.14), X(input), solved ? Y(probe.score) : Y(-0.03), P.orange, 3, [6, 4]);
    if (solved) {
      dot(c, X(input), Y(probe.score), 11, P.orange);
      mono(c, probe.score.toFixed(2), X(input) + 14, Y(probe.score) + 23, 23, P.rust);
    } else dot(c, X(input), Y(-0.14), 7, P.orange);
  }
  if (b === 3 && at(k, 3, 'transformed delays')) {
    for (const row of train) {
      mono(c, z(row.x).toFixed(1), X(row.x), Y(row.y) + (row.y ? -18 : -20), 17, P.ocean, 'center');
    }
    mono(c, 'z = (minutes − 5) / 10', 120, 638, 19, P.ocean);
  }
  sheet(c, 826, 158, 320, 385);
  small(c, b < 5 ? 'TRAINING WORKSHEET' : 'DELIVERY ' + (zero ? '04' : '02'), 853, 199);
  if (b < 5) {
    const rows = [
      ['Mean', trainingSum + ' / ' + train.length + ' = ' + bundle.center],
      ['Range', '10 − 0 = ' + bundle.scale],
      ['Cross-products', cross.toFixed(1)],
      ['Squared features', squares.toFixed(1)],
    ];
    const cues = [
      at(k, 1, 'Divide by six'),
      at(k, 2, 'ten minutes'),
      at(k, 3, 'one point two'),
      at(k, 3, 'squared features sum to one'),
    ];
    rows.forEach(([name, val], i) => {
      if (cues[i]) {
        small(c, name, 852, 242 + i * 70);
        mono(c, val, 851, 274 + i * 70, 25, P.ink);
      }
    });
    if (at(k, 4, 'slope of one point two')) mono(c, 'score = 0.5 + 1.2z', 825, 594, 22, P.teal);
  } else {
    const v = zero ? 0 : 8;
    txt(c, v + ' minutes', 850, 262, 36, P.ink, { family: 'Serif' });
    mono(c, 'z = (x − 5) / 10', 850, 320, 19);
    if (at(k, 6, 'gives point three')) mono(c, 'z = ' + z(v).toFixed(1), 850, 364, 26, P.teal);
    mono(c, 'score = 0.5 + 1.2z', 850, 400, 19);
    mono(c, 'Warn at score ≥ 0.50', 850, 436, 18);
    if (solved)
      txt(c, zero ? 'Silent' : 'Warn', 850, 491, 40, zero ? P.mute : P.teal, { bold: true });
    else txt(c, 'Warn?', 850, 491, 40, P.ocean, { family: 'Serif' });
  }
}
