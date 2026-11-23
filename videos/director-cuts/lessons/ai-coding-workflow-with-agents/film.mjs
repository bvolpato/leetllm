import assert from 'node:assert/strict';
import { queuedReplay, replay, replayEvidence } from '../../../films/ai-coding-workflow-with-agents/model.mjs';
import { EVENT, OTHER } from '../../../films/ai-coding-workflow-with-agents/fixtures.mjs';

const title = 'One wheel repair, two invoices';

const beats = [
  {
    id: 'one-wheel',
    say: 'Keep your eye on that wheel. The mechanic trued it once. The shop’s billing service got the same event twice. Look how many invoices it saved for that one repair.',
    hold: 1.3,
  },
  {
    id: 'a-second-job',
    say: 'Give the coding agent a way to reproduce this. Send the wheel repair, repeat it, then send a chain wax. That’s a different job and it needs its own invoice. The original handler has now saved three invoices for two jobs.',
    hold: 0.9,
  },
  {
    id: 'read-the-replies',
    say: 'The agent has a patch. Start with an empty store. Send exactly the same three deliveries, one at a time. Read the replies. One, one again, then two. Would you take this fix?',
    hold: 2.2,
  },
  {
    id: 'one-more-write',
    say: 'Let the queued writes finish. See the wheel repair down there again? The retry returned invoice one, but it also queued another insert. If we only checked the replies, this patch would pass.',
    hold: 1.1,
  },
  {
    id: 'repair-the-write',
    say: 'Give the agent that extra row and its event ID. Keep the test unchanged. On the revised patch, start with an empty store. Send the wheel repair. On the retry, the handler finds the first invoice and returns it.',
    hold: 1.0,
  },
  {
    id: 'let-it-settle',
    say: 'Send the chain wax. Let the writes finish. Now trace those replies back to the shop’s invoices. The first two lead to the same wheel repair. The third has a job of its own.',
    hold: 1.0,
  },
  {
    id: 'hand-off-c',
    say: 'These deliveries ran one at a time. Simultaneous retries need their own test. Hand the reviewer patch C with both runs. Now they can replay the original failure and check that the retry leaves just one invoice for the wheel.',
    hold: 2.6,
  },
];

// The local runs start with empty stores. B returns the same values as C but drains an extra write.
const runs = {
  Original: replay(false, 3),
  'Patch B': queuedReplay(),
  'Patch C': replay(true, 3),
};
const jobs = {
  [EVENT]: { name: 'Wheel truing', color: '#204c95', pale: '#e0ebff' },
  [OTHER]: { name: 'Chain wax', color: '#84400e', pale: '#ffe4bd' },
};
const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => { const t = clamp(v); return t * t * (3 - 2 * t); };
const arrival = (elapsed, start, duration = 0.55) => ease((elapsed - start) / duration);
const number = (id) => id.split(' ').at(-1);
const fullTurn = 2 * Math.PI;

function state(clock) {
  const { index, elapsed, reveal } = clock;
  if (index === 0) {
    const retry = arrival(elapsed, 0.05, 0.95);
    return { revision: 'Original', deliveries: [1, retry, 0], rows: [1, retry, 0] };
  }
  if (index === 1) {
    const chain = ease(reveal('then send a chain wax', 0.75));
    return { revision: 'Original', deliveries: [1, 1, chain], rows: [1, 1, chain] };
  }
  if (index === 2) {
    const first = ease(reveal('Send exactly', 0.55));
    const retry = ease(reveal('three deliveries', 0.55));
    const chain = ease(reveal('one at a time', 0.55));
    return { revision: 'Patch B', deliveries: [first, retry, chain], rows: [first, chain, 0] };
  }
  if (index === 3 || (index === 4 && reveal('On the revised patch', 0.45) < 0.5)) {
    const queued = index === 3 ? arrival(elapsed, 0.12, 0.96) : 1;
    return { revision: 'Patch B', deliveries: [1, 1, 1], rows: [1, 1, queued] };
  }
  if (index === 4) {
    const first = ease(reveal('Send the wheel repair', 0.65));
    const retry = ease(reveal('On the retry', 0.65));
    return { revision: 'Patch C', deliveries: [first, retry, 0], rows: [first, 0] };
  }
  const chain = index === 5 ? arrival(elapsed, 0.02) : 1;
  const traced = index === 5 ? ease(reveal('Now trace those replies', 1.1)) : 1;
  return { revision: 'Patch C', deliveries: [1, 1, chain], rows: [1, chain], traced };
}

function rect(c, x, y, w, h, fill, radius = 0) {
  c.fillStyle = fill;
  if (!radius) { c.fillRect(x, y, w, h); return; }
  c.beginPath(); c.roundRect(x, y, w, h, radius); c.fill();
}

function ellipse(c, x, y, rx, ry, fill, stroke, weight = 1) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, fullTurn);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = weight; c.stroke(); }
}

function line(c, coords, color, width = 2) {
  c.beginPath(); c.moveTo(coords[0], coords[1]);
  for (let i = 2; i < coords.length; i += 2) c.lineTo(coords[i], coords[i + 1]);
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = color; c.lineWidth = width; c.stroke();
}

function shape(c, points, fill) {
  c.beginPath(); c.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
  c.closePath(); c.fillStyle = fill; c.fill();
}

function gradient(c, x1, y1, x2, y2, stops) {
  const g = c.createLinearGradient(x1, y1, x2, y2);
  for (const [i, col] of stops.entries()) g.addColorStop(i / (stops.length - 1), col);
  return g;
}

function text(c, value, x, y, size, color, face = 'Sans', weight = 500, align = 'left') {
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.fillStyle = color; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(value, x, y);
}

function workshop(c) {
  rect(c, -90, -90, 2100, 1040, gradient(c, 0, 0, 980, 940, ['#c2ddee', '#e4eef0', '#a6c3d1']));
  // Window light across the glazed shop tiles.
  for (let y = -118; y < 900; y += 157) {
    rect(c, -90, y, 2100, 3, '#9bb8c8');
    rect(c, -90, y + 3, 2100, 2, '#e0edf0');
    const stagger = Math.round((y + 118) / 157) % 2 * 160;
    for (let x = -180 + stagger; x < 2020; x += 320) {
      rect(c, x, y + 5, 3, 152, '#abc6d2');
    }
  }
  c.save(); c.globalAlpha = 0.33;
  for (let i = 0; i < 3; i++) {
    const x = i * 254 - 217;
    shape(c, [x, -80, x + 229, -80, x + 695, 810, x + 466, 810], '#fff9e2');
  }
  c.restore();
  rect(c, -90, 810, 2100, 270, gradient(c, 0, 810, 0, 1080, ['#d4a27b', '#e2b993', '#cca17d']));
  rect(c, -90, 810, 2100, 7, '#bd8f71');
  for (let i = 0; i < 36; i++) {
    const x = i * 93 % 1760, y = 830 + i * 19 % 253;
    line(c, [x, y, x + 65, y + 1, x + 116, y - 1], 'rgba(117,71,44,0.12)', 1.6);
  }
}

function truingStand(c, seconds) {
  const cx = 290, cy = 414, rx = 363, ry = 368;
  const rotation = 0.60 + 1.65 * (1 - Math.exp(-seconds * 0.34));
  const base = [143, 847, 211, 758, 371, 750, 453, 844, 422, 868, 133, 875];
  ellipse(c, 300, 869, 262, 23, 'rgba(61,54,54,0.15)');
  shape(c, base, '#1b4058');
  shape(c, [148, 845, 209, 758, 370, 750, 449, 843], '#367cb0');
  shape(c, [207, 800, 205, 420, 226, 398, 252, 419, 250, 797], '#346d95');
  // The silver braking surface catches the window on the left.
  const metal = gradient(c, -100, 70, 640, 703, ['#44515d', '#f4f5ec', '#839993', '#e6ece7', '#545e63']);
  ellipse(c, cx + 8, cy + 2, rx, ry, null, '#3e4b56', 19);
  ellipse(c, cx, cy, rx, ry, null, '#283948', 17);
  ellipse(c, cx, cy, rx - 2, ry - 2, null, metal, 12);
  ellipse(c, cx, cy, rx - 9, ry - 9, null, '#4b5c64', 3);
  for (const offset of [0, 0.12, 0.17]) {
    c.beginPath();
    c.ellipse(cx, cy, rx - 4, ry - 4, 0, rotation + 2.4 + offset, rotation + 2.4 + offset + (offset ? 0.025 : 0.09));
    c.strokeStyle = '#d85025'; c.lineWidth = 8; c.stroke();
  }
  const rim = (angle, inset = 13) => [cx + (rx - inset) * Math.cos(angle), cy + (ry - inset) * Math.sin(angle)];
  for (let i = 0; i < 32; i++) {
    const theta = rotation + fullTurn * i / 32;
    const rear = i % 2 === 0;
    const phi = theta + (i % 4 < 2 ? -1.12 : 1.12);
    const p = rim(theta);
    const hubX = cx + (rear ? 12 : -8) + 28 * Math.cos(phi), hubY = cy + 28 * Math.sin(phi);
    line(c, [hubX, hubY, ...p], rear ? '#899ca8' : '#506673', rear ? 2.3 : 3.3);
    line(c, [...rim(theta, 12), ...rim(theta, 21)], '#48525e', 5);
  }
  const valve = rotation - 0.97;
  line(c, [...rim(valve, 12), ...rim(valve, 43)], '#59636a', 8);
  line(c, [...rim(valve, 33), ...rim(valve, 44)], '#de5726', 10);
  ellipse(c, cx, cy, 38, 38, metal, '#586b76', 3);
  ellipse(c, cx, cy, 25, 25, '#434e5a', '#a4bac3', 7);
  // The near arm holds the axle; the feeler sits beside the rim.
  shape(c, [244, 818, 257, 472, 263, 413, 282, 390, 285, 413, 300, 416, 307, 388, 324, 405, 305, 808], '#144d80');
  shape(c, [261, 794, 275, 483, 285, 433, 308, 432, 293, 798], '#4887bc');
  shape(c, [260, 804, 318, 799, 341, 825, 230, 833], '#31638a');
  line(c, [301, 728, 334, 728, 352, 766, 393, 766], '#364c5b', 11);
  line(c, [375, 765, 406, 765], '#28383e', 16);
}

function chain(c) {
  // An open bicycle chain laid in a loose bend on the bench.
  const points = Array.from({ length: 26 }, (_, i) => {
    const t = i / 25;
    return [75 + 543 * t, 944 - 33 * Math.sin(t * 2.1 * Math.PI) + 10 * t];
  });
  for (const [i, p] of points.slice(0, -1).entries()) {
    const q = points[i + 1];
    line(c, [p[0], p[1] + 4, q[0], q[1] + 4], 'rgba(74,57,47,0.24)', 17);
    line(c, [...p, ...q], i % 2 ? '#5f6868' : '#263b48', 17);
    line(c, [...p, ...q], i % 2 ? '#d6d7c9' : '#8d9da0', 10);
    ellipse(c, p[0], p[1], 3.6, 3.6, '#314450');
  }
}

const ink = '#192f41', muted = '#465e6b';
const topX = [971, 1314, 1657];
const invoiceY = [587, 687, 787];

function jobIcon(c, event, x, y) {
  const color = jobs[event].color;
  if (event === EVENT) {
    ellipse(c, x, y, 22, 22, null, color, 3.6);
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 6;
      line(c, [x - 19 * Math.cos(a), y - 19 * Math.sin(a), x + 19 * Math.cos(a), y + 19 * Math.sin(a)], color, 1.7);
    }
    ellipse(c, x, y, 4, 4, color);
  } else {
    c.save(); c.translate(x, y); c.rotate(-0.55);
    for (const dx of [-9, 9]) {
      c.beginPath(); c.roundRect(dx - 12, -8, 24, 16, 8); c.lineWidth = 4; c.strokeStyle = color; c.stroke();
    }
    c.restore();
  }
}

function tabletBody(c) {
  ellipse(c, 1327, 917, 579, 33, 'rgba(63,57,58,0.16)');
  rect(c, 757, 77, 1130, 842, '#893f2e', 51);
  rect(c, 751, 66, 1130, 842, '#e87549', 51);
  rect(c, 761, 74, 1110, 823, '#fa9b67', 43);
  rect(c, 771, 82, 1090, 808, '#273749', 35);
  rect(c, 793, 103, 1046, 765, '#fffdf6', 18);
  rect(c, 742, 263, 10, 105, '#b54e32', 4);
  for (const y of [727, 748, 769]) line(c, [758, y, 764, y - 5], '#c35939', 3);
  ellipse(c, 1317, 93, 3, 3, '#687980');
}

function returnTrace(c, s, run) {
  const active = s.traced ?? 0;
  if (!active) return;
  // The inspector groups replies by the row they identify. The shared line goes around the left
  // margin of the list. The new job takes the right margin so that the paths never cross.
  c.save();
  c.globalAlpha = active;
  for (const [row, invoice] of run.invoices.entries()) {
    const xs = run.deliveries.flatMap((d, i) => d.invoice === invoice.invoice ? [topX[i]] : []);
    const left = xs.length > 1, edge = left ? 814 : 1814, end = left ? 834 : 1781;
    const lead = left ? xs.at(-1) : xs[0], dy = invoiceY[row];
    const color = jobs[invoice.event].color;
    c.beginPath(); c.moveTo(lead, 414);
    c.quadraticCurveTo(lead, 443, lead + (left ? -24 : 24), 443);
    c.lineTo(edge + (left ? 15 : -15), 443); c.quadraticCurveTo(edge, 443, edge, 458);
    c.lineTo(edge, dy - 12); c.quadraticCurveTo(edge, dy, end, dy);
    c.lineWidth = 4; c.strokeStyle = color; c.stroke();
    for (const x of xs) {
      ellipse(c, x, 415, 5, 5, color);
      if (x !== lead) {
        c.beginPath(); c.moveTo(x, 415); c.quadraticCurveTo(x, 443, x - 24, 443); c.stroke();
      }
    }
    ellipse(c, end, dy, 5, 5, color);
  }
  c.restore();
}

function display(c, s) {
  const run = runs[s.revision];
  tabletBody(c);
  text(c, 'Billing replay', 833, 166, 56, ink, 'Serif');
  const badgeColor = s.revision === 'Original' ? '#dbe3e6' : '#dce8fa';
  rect(c, 1557, 130, 233, 66, badgeColor, 15);
  text(c, s.revision, 1673, 163, 32, ink, 'Mono', 600, 'center');
  line(c, [831, 222, 1793, 222], '#c8d0ce', 2);
  text(c, 'Webhook replies', 836, 263, 33, muted, 'Sans', 600);
  const labels = ['First', 'Retry', 'New'];
  for (const [i, delivery] of run.deliveries.entries()) {
    const x = topX[i], p = s.deliveries[i];
    text(c, labels[i] + '  ' + number(delivery.event), x, 325, 32, ink, 'Sans', 500, 'center');
    if (p < 1) {
      c.save(); c.globalAlpha = 1 - p;
      line(c, [x - 15, 381, x + 15, 381], '#8b9a9e', 4); c.restore();
    }
    if (p > 0) {
      c.save(); c.globalAlpha = p;
      text(c, '#' + number(delivery.invoice), x, 384 + (1 - p) * 12, 57, jobs[delivery.event].color, 'Mono', 700, 'center');
      c.restore();
    }
  }
  line(c, [831, 466, 1793, 466], '#c8d0ce', 2);
  text(c, 'Saved invoices', 836, 508, 37, ink, 'Sans', 600);
  for (const [i, invoice] of run.invoices.entries()) {
    const p = s.rows[i];
    if (p <= 0) continue;
    const y = invoiceY[i] + 18 * (1 - p);
    const job = jobs[invoice.event];
    c.save(); c.globalAlpha = p;
    rect(c, 834, y - 41, 946, 82, job.pale, 9);
    rect(c, 834, y - 33, 5, 66, job.color, 2);
    text(c, '#' + number(invoice.invoice), 868, y, 41, job.color, 'Mono', 700);
    jobIcon(c, invoice.event, 1023, y);
    text(c, job.name, 1072, y, 40, ink, 'Sans', 600);
    text(c, number(invoice.event), 1732, y, 36, job.color, 'Mono', 500, 'right');
    c.restore();
  }
  returnTrace(c, s, run);
}

function frameShop(c, clock) {
  // Follow the reader from the wheel to the replies, then down to the delayed insert.
  const { index, reveal, elapsed } = clock;
  let zoom = 1.06, pivotY = 560;
  if (index === 0) {
    zoom = 1 + 0.06 * ease(reveal('Look how many invoices', 1.8));
  } else if (index === 1) {
    zoom += 0.13 * ease(reveal('The original handler', 1.8));
  } else if (index === 2) {
    const t = ease(reveal('Read the replies', 1.5));
    zoom = 1.19 + 0.30 * t;
    pivotY = 560 - 325 * t;
  } else if (index === 3) {
    zoom = 1.49;
    pivotY = 235 + 435 * arrival(elapsed, 0, 1.35);
  } else if (index === 4) {
    const t = ease(reveal('On the revised patch', 1.5));
    zoom = 1.49 - 0.20 * t;
    pivotY = 670 - 142 * t;
  } else {
    const t = index === 6 ? ease(reveal('Now they can replay', 2.3)) : 0;
    zoom = 1.29 - 0.23 * t;
    pivotY = 528 + 32 * t;
  }
  c.translate(1841 * (1 - zoom), pivotY * (1 - zoom));
  c.scale(zoom, zoom);
}

function draw(c, clock) {
  const s = state(clock);
  c.save();
  frameShop(c, clock);
  workshop(c);
  truingStand(c, clock.seconds);
  chain(c);
  display(c, s);
  c.restore();
}

function check() {
  for (const result of Object.values(runs)) {
    assert.deepEqual(result.deliveries.map(d => d.event), [EVENT, EVENT, OTHER]);
    assert.equal(result.count, result.invoices.length);
  }
  assert.deepEqual(runs.Original.deliveries.map(d => number(d.invoice)), ['1', '2', '3']);
  assert.deepEqual(runs['Patch B'].deliveries, runs['Patch C'].deliveries);
  assert.deepEqual(runs['Patch B'].invoices.map(d => d.event), [EVENT, OTHER, EVENT]);
  assert.deepEqual(runs['Patch C'].invoices.map(d => d.event), [EVENT, OTHER]);
  for (const [revision, expected] of [
    ['Original', [false, true, false]],
    ['Patch B', [true, true, false]],
    ['Patch C', [true, true, true]],
  ]) {
    assert.deepEqual(replayEvidence(runs[revision]).map(check => check.passed), expected);
  }
  return true;
}

export default { title, beats, draw, check };
