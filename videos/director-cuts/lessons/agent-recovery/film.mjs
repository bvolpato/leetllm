import assert from 'node:assert/strict';
import { dispatchOperation } from '../../../films/agent-recovery/model.mjs';

const title = 'The soda dropped. The reply didn’t.';
const beats = [
  {
    id: 'the-tray',
    say: "Watch the tray. One orange soda, just as ordered. Now look at the agent's screen.",
    hold: 0.9,
  },
  {
    id: 'the-missing-reply',
    say: 'Timed out. To the agent, a lost request and a lost reply look the same. Would sending this order again drop a second can?',
    hold: 0.9,
  },
  {
    id: 'what-both-sides-kept',
    say: 'Before sending, the agent saved a key with the order. Eight four two, one orange soda. The machine stored that pair and the job it created in one transaction.',
    hold: 1,
  },
  {
    id: 'the-second-send',
    say: "The order is still approved, and there's time for one retry. The agent sends the same key and the same order again. Watch the can above the tray.",
    hold: 1.5,
  },
  {
    id: 'the-can-that-stayed',
    say: "It stays put. The machine still has the matching entry. It returns the job number from the first attempt. Two sends, one job. That's an idempotent retry.",
    hold: 1,
  },
  {
    id: 'check-the-drop',
    say: 'A job number tells the agent the machine accepted the order. Did the soda actually drop? The agent asks the machine for the chute sensor record for that job.',
    hold: 0.8,
  },
  {
    id: 'at-the-tray',
    say: 'One drop. See the break in the beam? Now the agent can tell the customer their soda reached the tray.',
    hold: 2.4,
  },
];

const order = { drink: 'orange', quantity: 1 };
const key = '842';
const newDatabase = () => ({ jobs: new Map(), operations: new Map() });

const chuteReading = {
  job: 'job-1',
  blocked: [false, false, true, true, true, false, false],
  sampleTimes: [-0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
};

// Count completed beam interruptions in a sensor capture that starts clear.
function countDrops(blocked) {
  return blocked.filter((value, i) => !value && blocked[i - 1]).length;
}

// Saving an order starts a job. A separate sensor at the chute supplies the
// evidence that a can passed through it.
function runDispenser(reading = chuteReading) {
  const db = newDatabase();
  const lost = dispatchOperation(db, key, order, 'after-commit');
  const entry = db.operations.get(key);
  const motorStarts = [];
  function runQueue() {
    for (const [job, work] of db.jobs) {
      if (work.state !== 'queued') continue;
      motorStarts.push(job);
      work.state = 'dispensing';
    }
  }
  runQueue();
  const seenJob = db.jobs.get(reading.job);
  const drops = countDrops(reading.blocked);
  const observed =
    seenJob?.state === 'dispensing' && drops === seenJob.payload.quantity
      ? { source: 'chute sensor', job: reading.job, key: seenJob.operationKey, drops }
      : null;
  if (observed) seenJob.state = 'completed';
  const replay = dispatchOperation(db, key, { ...order }, 'normal');
  runQueue();
  return { db, entry, lost, replay, observed, motorStarts };
}

const trace = runDispenser();
const { entry, replay, observed } = trace;
const jobLabel = (id) => id.replace('job-', 'Job ');
const itemLabel = (payload) => `${payload.quantity} × ${payload.drink}`;

function check() {
  const { db, entry, lost, replay, observed, motorStarts } = runDispenser();
  assert.deepEqual(lost, { reply: 'lost', job: null });
  assert.deepEqual([entry.key, entry.payload, entry.job], [key, order, 'job-1']);
  assert.deepEqual(replay, { reply: 'replayed', job: entry.job });
  assert.deepEqual(observed, { source: 'chute sensor', job: 'job-1', key, drops: 1 });
  assert.deepEqual(motorStarts, ['job-1']);
  assert.equal(runDispenser({ job: 'job-1', blocked: [false, true, true] }).observed, null);
  assert.equal(runDispenser({ ...chuteReading, job: 'job-2' }).observed, null);
  assert.equal(db.jobs.size, 1);
  assert.equal(db.operations.size, 1);
  assert.equal(dispatchOperation(db, key, { ...order, quantity: 2 }, 'normal').reply, 'conflict');
  assert.equal(db.jobs.size, 1);
  const missed = newDatabase();
  dispatchOperation(missed, key, order, 'before-commit');
  assert.equal(missed.jobs.size, 0);
}

const clamp = (n) => Math.min(1, Math.max(0, n));
const ease = (n) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

function gradient(ctx, x1, y1, x2, y2, stops) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [at, colour] of stops) g.addColorStop(at, colour);
  return g;
}
function box(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}
function oval(ctx, x, y, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
  ctx.fillStyle = fill;
  ctx.fill();
}
function poly(ctx, points, fill) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}
function stroke(ctx, points, width, colour) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}
function type(ctx, value, x, baseline, size, colour, weight = 500, family = 'Sans') {
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.fillStyle = colour;
  ctx.fillText(value, x, baseline);
}

function shop(ctx) {
  ctx.fillStyle = gradient(ctx, 0, 0, 1400, 940, [
    [0, '#d4e8ec'],
    [0.53, '#f4ead6'],
    [1, '#c6a79a'],
  ]);
  ctx.fillRect(-1200, -900, 4300, 3000);
  // The slanted strip of window light continues down the wall to the counter.
  poly(
    ctx,
    [
      [-270, -100],
      [370, -100],
      [910, 876],
      [275, 876],
    ],
    '#ffffff38',
  );
  poly(
    ctx,
    [
      [466, -100],
      [534, -100],
      [1085, 876],
      [1016, 876],
    ],
    '#ffffef65',
  );
  box(
    ctx,
    -400,
    822,
    2800,
    258,
    0,
    gradient(ctx, 0, 822, 0, 1080, [
      [0, '#c9a18c'],
      [0.12, '#e8bda1'],
      [1, '#edcdb3'],
    ]),
  );
  ctx.save();
  ctx.globalAlpha = 0.31;
  for (let i = 0; i < 290; i++) {
    const v = (i * 7411 + 945) % 1009;
    const x = (i * 421 + v * 17) % 1922;
    const y = 825 + ((i * 139 + v) % 260);
    const s = 1.5 + (v % 4);
    poly(
      ctx,
      [
        [x, y],
        [x + s * 1.8, y - 1],
        [x + s, y + s * 0.55],
        [x - 1, y + 2],
      ],
      i % 3 ? '#b98877' : '#fffce1',
    );
  }
  ctx.restore();
  oval(ctx, 1289, 859, 560, 24, '#7c565636');
}

// A cut orange, printed on each can and on the enamel machine fascia.
function citrus(ctx, x, y, r, flesh = '#f78124', rind = '#ffe9a9') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.19);
  oval(ctx, 0, 0, r, r, rind);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a + 0.39) * r * 0.12, Math.sin(a + 0.39) * r * 0.12);
    ctx.arc(0, 0, r * 0.87, a + 0.055, a + Math.PI / 4 - 0.055);
    ctx.closePath();
    ctx.fillStyle = flesh;
    ctx.fill();
  }
  ctx.restore();
}

function can(ctx, x, y, scale, tilt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(scale, scale);
  const silver = gradient(ctx, -54, 0, 56, 0, [
    [0, '#747c80'],
    [0.13, '#f4e9d3'],
    [0.48, '#a9b2ad'],
    [0.72, '#fff8dd'],
    [1, '#717f83'],
  ]);
  box(ctx, -55, -88, 110, 175, 15, silver);
  box(
    ctx,
    -58,
    -81,
    116,
    161,
    11,
    gradient(ctx, -58, 0, 58, 0, [
      [0, '#b73f2e'],
      [0.17, '#fb7234'],
      [0.44, '#ff9248'],
      [0.8, '#ed6932'],
      [1, '#ab3c2e'],
    ]),
  );
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(-58, -81, 116, 161, 11);
  ctx.clip();
  poly(
    ctx,
    [
      [-63, -20],
      [63, -65],
      [63, 22],
      [-63, 67],
    ],
    '#fbeabf',
  );
  citrus(ctx, -2, -1, 43, '#e85d29', '#fff2c8');
  type(ctx, 'SODA', -27, -50, 20, '#fff1d0', 700);
  for (const [dx, dy, r] of [
    [34, -70, 3],
    [39, -58, 2],
    [-38, 41, 3],
    [-35, 53, 2],
    [26, 54, 3],
  ]) {
    oval(ctx, dx + 0.7, dy + 1, r, r * 1.4, '#a34a3450');
    oval(ctx, dx, dy, r * 0.54, r * 0.68, '#fff9d3c7');
  }
  ctx.fillStyle = '#ffedcd35';
  ctx.fillRect(-46, -84, 5, 168);
  ctx.fillStyle = '#8f2d2522';
  ctx.fillRect(39, -80, 14, 160);
  ctx.restore();
  oval(ctx, 0, -84, 55, 10, '#7e8685');
  oval(ctx, 0, -86, 54, 8, '#f3e7cc');
  oval(ctx, 0, -86, 47, 5, '#a1a7a0');
  oval(ctx, 0, -86, 14, 3, '#dce0d1');
  oval(ctx, 4, -86, 6, 1.8, '#777f80');
  stroke(
    ctx,
    [
      [-48, 81],
      [-30, 84],
      [28, 84],
      [48, 81],
    ],
    4,
    '#fff3d5',
  );
  ctx.restore();
}

function canMotion(time) {
  // The can is already over the stock gate on the first body frame.
  if (time < 0.76) {
    const p = clamp(time / 0.76);
    return [1516 - 46 * p, 463 + 132 * p * p, -0.16 - 1.35 * p];
  }
  const p = ease((time - 0.76) / 0.92);
  const bounce = 18 * Math.abs(Math.sin(Math.PI * 2 * p)) * (1 - p);
  return [mix(1470, 1190, p), mix(595, 647, p) - bounce, mix(-1.51, -1.58, p)];
}

function machineCase(ctx) {
  poly(
    ctx,
    [
      [1743, -46],
      [1812, 0],
      [1812, 807],
      [1755, 859],
      [1719, 836],
    ],
    '#387393',
  );
  poly(
    ctx,
    [
      [1779, -10],
      [1812, 0],
      [1812, 807],
      [1779, 838],
    ],
    '#2f6383',
  );
  box(ctx, 777, -49, 999, 908, 48, '#40718b');
  box(
    ctx,
    778,
    -60,
    986,
    903,
    41,
    gradient(ctx, 805, 89, 1780, 842, [
      [0, '#e0eff0'],
      [0.3, '#bddde3'],
      [0.8, '#83bbcf'],
      [1, '#71a8c1'],
    ]),
  );
  box(ctx, 793, -30, 11, 809, 6, '#ffffff5a');
  // A sign painter's band under the canopy.
  box(ctx, 801, -48, 943, 221, 22, '#fff0d3');
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(801, -48, 943, 221, 22);
  ctx.clip();
  citrus(ctx, 1711, -27, 187, '#e67443', '#f9d3a1');
  citrus(ctx, 1697, -37, 125, '#ff9651', '#fff0cb');
  ctx.restore();
  ctx.save();
  ctx.translate(851, 113);
  ctx.transform(1, 0, -0.15, 1, 0, 0);
  type(ctx, 'Orange', 0, 0, 128, '#9c392f', 700, 'Serif');
  ctx.restore();
  box(ctx, 816, 168, 908, 5, 2, '#7599a2');
  // The pickup well and its sloping floor.
  box(ctx, 849, 480, 838, 293, 39, '#e5eef0');
  box(ctx, 857, 486, 825, 277, 35, '#56798d');
  box(
    ctx,
    868,
    497,
    802,
    252,
    28,
    gradient(ctx, 0, 495, 0, 750, [
      [0, '#182d42'],
      [0.62, '#374253'],
      [1, '#755257'],
    ]),
  );
  poly(
    ctx,
    [
      [886, 673],
      [1120, 704],
      [1260, 704],
      [1644, 620],
      [1658, 633],
      [1658, 720],
      [900, 746],
    ],
    '#956854',
  );
  poly(
    ctx,
    [
      [886, 673],
      [1120, 704],
      [1260, 704],
      [1644, 620],
      [1653, 625],
      [1262, 712],
      [1118, 712],
      [893, 680],
    ],
    '#d9a37c',
  );
  // The upper window is open to the mouth of the delivery chute.
  box(ctx, 1373, 191, 298, 355, 26, '#f0f3e9');
  box(ctx, 1381, 197, 282, 350, 20, '#52798c');
  box(
    ctx,
    1390,
    205,
    264,
    343,
    15,
    gradient(ctx, 1386, 223, 1656, 520, [
      [0, '#182e41'],
      [0.43, '#45616d'],
      [1, '#243748'],
    ]),
  );
}

function sensor(ctx, time) {
  const sample = chuteReading.sampleTimes.findLastIndex((t) => time >= t);
  const broken = chuteReading.blocked[sample];
  const ink = broken ? '#ffdd82' : '#6dbabc';
  if (broken) {
    oval(ctx, 1417, 520, 19, 13, '#ffd87835');
    oval(ctx, 1629, 520, 19, 13, '#ffd87835');
  }
  box(ctx, 1394, 510, 23, 21, 6, '#142f43');
  box(ctx, 1412, 514, 8, 12, 3, ink);
  box(ctx, 1627, 510, 22, 21, 6, '#142f43');
  box(ctx, 1625, 514, 7, 12, 3, ink);
}

function stockAndTray(ctx, time) {
  const [x, y, tilt] = canMotion(time);
  const stockY = mix(279, 413, ease((time - 0.74) / 0.62));
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(1390, 205, 264, 340, 15);
  ctx.clip();
  can(ctx, 1516, stockY - 179, 0.97, 0);
  can(ctx, 1516, stockY, 0.97, 0);
  poly(
    ctx,
    [
      [1395, 202],
      [1450, 202],
      [1395, 354],
    ],
    '#f0ffff25',
  );
  poly(
    ctx,
    [
      [1484, 202],
      [1501, 202],
      [1395, 466],
      [1395, 438],
    ],
    '#f0ffff12',
  );
  ctx.restore();
  const reopen = 1 - ease(time / 0.6) + ease((time - 0.6) / 0.34);
  stroke(
    ctx,
    [
      [1598, 499],
      [1598 - 113 * reopen, 499 + 27 * (1 - reopen)],
    ],
    10,
    '#90a4ac',
  );
  sensor(ctx, time);
  const roll = ease((time - 0.76) / 0.92);
  oval(ctx, x + 4, mix(662, 707, roll), 74, 4 + 3 * ease(time), '#1d263c4d');
  can(ctx, x, y, 1, tilt);
  box(ctx, 877, 746, 778, 9, 4, '#d6e7e4');
}

function display(ctx, s) {
  box(ctx, 846, 213, 492, 245, 18, '#ddebed');
  box(ctx, 850, 217, 485, 236, 15, '#5a8191');
  box(ctx, 856, 221, 473, 224, 12, '#203e51');
  const x = 878;
  type(ctx, s.sensorRead ? 'Chute sensor' : 'Machine memory', x, 263, 34, '#c8dadd', 500);
  box(ctx, x, 278, 421, 2, 1, '#7596a3');
  if (s.sensorRead) {
    type(ctx, jobLabel(observed.job), x, 331, 43, '#b7d6dd', 500, 'Mono');
    type(ctx, `${observed.drops} drop`, x, 404, 65, '#ffe6a7', 700);
    const samples = chuteReading.blocked;
    const line = [[x + 222, 306]];
    for (let i = 1; i < samples.length; i++) {
      const px = x + 222 + i * 31;
      line.push([px, samples[i - 1] ? 336 : 306], [px, samples[i] ? 336 : 306]);
    }
    stroke(ctx, line, 5, '#ffd482');
    return;
  }
  if (s.pairFocus || s.match) {
    box(ctx, x - 6, 292, 431, 67, 7, s.match ? '#436a64' : '#375564');
  }
  type(ctx, `Key ${entry.key}`, x, 339, 38, '#fff1c5', 500, 'Mono');
  type(ctx, itemLabel(entry.payload), x + 195, 338, 37, '#f8ebe2', 600);
  type(ctx, jobLabel(entry.job), x, 411, 54, '#fff1c5', 700);
  if (s.match) type(ctx, 'Matched', x + 195, 408, 39, '#bde6ce', 600);
}

function handset(ctx, s) {
  oval(ctx, 415, 875, 267, 20, '#654c4e32');
  ctx.save();
  ctx.translate(175, 186);
  ctx.rotate(-0.034);
  box(ctx, -5, 16, 497, 674, 44, '#736662');
  box(ctx, -4, 6, 491, 676, 44, '#9eaaa7');
  box(ctx, 0, 0, 480, 673, 42, '#254459');
  box(ctx, 10, 11, 460, 650, 34, '#102c41');
  box(ctx, 19, 23, 442, 626, 26, '#f7f3e8');
  box(ctx, 189, 15, 105, 17, 9, '#102c41');
  const x = 46;
  const blue = '#26475d';
  type(ctx, 'Order agent', x, 100, 55, blue, 700);
  stroke(
    ctx,
    [
      [x, 122],
      [433, 122],
    ],
    2,
    '#bac9c6',
  );
  type(ctx, itemLabel(order), x, 188, 48, '#65382d', 600);
  type(ctx, `Key ${key}`, x, 247, 41, blue, 500, 'Mono');
  if (s.pairFocus)
    stroke(
      ctx,
      [
        [x, 267],
        [276, 267],
      ],
      5,
      '#cb873f',
    );
  if (s.send === 2) {
    stroke(
      ctx,
      [
        [x, 269],
        [431, 269],
      ],
      2,
      '#bac9c6',
    );
    type(ctx, 'Send 1', x, 313, 29, '#53666c');
    type(ctx, 'Timed out', x + 162, 313, 31, '#8d5042');
  }
  const step = s.reading ? 'Status lookup' : `Send ${s.send}`;
  type(ctx, step, x, 367, 32, '#4b6570', 500);
  const status = s.verified
    ? 'Reached tray'
    : s.reading
      ? 'Checking…'
      : s.gotJob
        ? jobLabel(replay.job)
        : s.send === 2
          ? 'Retrying…'
          : s.timeout
            ? 'Timed out'
            : 'Waiting…';
  const colour =
    s.verified || (s.gotJob && !s.reading)
      ? '#116152'
      : s.timeout && s.send === 1
        ? '#a44232'
        : blue;
  type(ctx, status, x, 445, 54, colour, 700);
  if (s.verified) {
    type(ctx, `${jobLabel(observed.job)} · ${observed.drops} drop`, x, 511, 34, blue, 500);
  } else if (s.reading) {
    type(ctx, jobLabel(replay.job), x, 511, 34, blue, 500);
  }
  box(ctx, 192, 622, 93, 7, 4, '#b1bab4');
  ctx.restore();
}

function direction(clock) {
  const { index, elapsed, reveal } = clock;
  const after = (i, phrase, span) => (index > i ? 1 : index === i ? reveal(phrase, span) : 0);
  const sending = after(3, 'The agent sends', 0.72);
  const gotJob = after(4, 'It returns', 0.46) === 1;
  const reading = after(5, 'The agent asks', 0.42) === 1;
  return {
    time: index === 0 ? elapsed : 3,
    timeout: index > 0 || reveal('Now look', 1.25) > 0.68,
    pairFocus: index === 2 && reveal('saved a key', 0.45) > 0.35,
    send: sending > 0.08 ? 2 : 1,
    match: sending === 1 && !reading,
    gotJob,
    reading,
    sensorRead: after(5, 'chute sensor record', 0.5) === 1,
    verified: after(6, 'One drop', 0.52) === 1,
  };
}

// Each move follows the evidence: from the drop to the sender, from the saved
// key to the controller's copy, and finally back from the sensor to the agent.
const trayShot = [1.67, 1320, 515];
const bothSides = [1.02, 955, 484];
const orderShot = [1.5, 731, 507];
const memoryShot = [1.66, 1310, 513];
function camera(clock) {
  const { index, reveal } = clock;
  const move = (from, to, p) => from.map((v, i) => mix(v, to[i], ease(p)));
  switch (index) {
    case 0:
      return move(trayShot, bothSides, reveal('Now look', 1.25));
    case 1:
      return bothSides;
    case 2: {
      const phone = move(bothSides, orderShot, reveal('Before sending', 1.25));
      return move(phone, memoryShot, reveal('The machine stored', 1.55));
    }
    case 3:
      return memoryShot;
    case 4:
      return move(memoryShot, bothSides, reveal('It returns', 1.3));
    case 5:
      return move(bothSides, memoryShot, reveal('The agent asks', 1.3));
    default:
      return move(memoryShot, bothSides, reveal('Now the agent', 1.5));
  }
}

function draw(ctx, clock) {
  const s = direction(clock);
  const [zoom, x, y] = camera(clock);
  ctx.save();
  ctx.translate(960, 540);
  ctx.scale(zoom, zoom);
  ctx.translate(-x, -y);
  shop(ctx);
  machineCase(ctx);
  display(ctx, s);
  stockAndTray(ctx, s.time);
  handset(ctx, s);
  ctx.restore();
}

export default { title, beats, draw, check };
