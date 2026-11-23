import assert from 'node:assert/strict';
import { hidden, routes, source } from '../../../films/deep-dive-deepep/fixtures.mjs';
import { ledger, combine } from '../../../films/deep-dive-deepep/model.mjs';

const title = 'DeepEP follows a token home';
const beats = [
  {
    id: 'one-crossing',
    say: 'Watch row a. Two experts on the other GPU need this same pair of numbers. How many copies have to cross the gap?',
    hold: 0.9,
  },
  {
    id: 'two-slots',
    say: 'One row landed up here. Follow it down to expert two and expert three. The receiver made a slot for each expert.',
    hold: 1,
  },
  {
    id: 'change-the-route',
    say: 'Try the same input with a new router choice. Keep expert three, but give the other job to expert zero. Where does that copy go?',
    hold: 1.25,
  },
  {
    id: 'two-owners',
    say: 'It stays on rank zero. Only the other copy crosses the link. DeepEP dispatches one row to each GPU that owns a selected expert.',
    hold: 0.8,
  },
  {
    id: 'expert-work',
    say: 'Now let the experts work. In this example, expert zero copies its input. Expert three multiplies both numbers by four. Look at the first number in each slot.',
    hold: 0.8,
  },
  {
    id: 'weight',
    say: 'The router gave expert zero a weight of seven tenths and expert three a weight of three tenths. The caller multiplies each output by its weight before handing it back.',
    hold: 1,
  },
  {
    id: 'return',
    say: 'Watch the return trip. The distant result arrives first. The saved map sends it to row a in the output. The local slot points to that same row.',
    hold: 0.8,
  },
  {
    id: 'home',
    say: 'DeepEP adds the two contributions there. One point two plus seven tenths gives one point nine. Same row position where the token started.',
    hold: 2.3,
  },
];

const split = ledger(routes).slots.filter(row => row.token === 'a');
const shared = ledger({ ...routes, a: [[2, routes.a[0][1]], routes.a[1]] }).slots
  .filter(row => row.token === 'a');
const savedSource = new Map(split.map(row => [row.key, row.token]));
const weighted = split.map(row => ({
  key: row.key,
  value: row.raw.map(v => v * row.weight),
}));
const returnOrder = [...weighted].reverse();
const output = combine(returnOrder, savedSource);
const homeRow = savedSource.get(returnOrder[0].key);
const input = hidden[homeRow];

function check() {
  assert.equal(source[homeRow], 0);
  assert.deepEqual([...new Set(shared.map(row => row.rank))], [1]);
  assert.deepEqual(shared.map(row => row.expert), [2, 3]);
  assert.deepEqual(split.map(row => [row.expert, row.rank, row.remote]), [[0, 0, false], [3, 1, true]]);
  assert.deepEqual(returnOrder.map(row => savedSource.get(row.key)), ['a', 'a']);
  assert.deepEqual(returnOrder.map(row => row.value), [[1.2, 0], [0.7, 0]]);
  assert.deepEqual(output.a, [1.9, 0]);
  assert.deepEqual(output, combine(weighted, savedSource));
}

const ink = '#202137';
const warm = '#fbdf6c';
const cool = '#a9f5ef';
const pale = '#f3eddb';
const home = [332, 361];
const received = [1398, 361];
const slots = { 0: [691, 685], 2: [1228, 685], 3: [1640, 685] };
const across = [home, received];
const localPath = [home, [635, 361], [691, 417], slots[0]];
const fan = {
  2: [received, [1398, 447], [1228, 542], slots[2]],
  3: [received, [1398, 447], [1640, 556], slots[3]],
};
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => clamp(x) ** 2 * (3 - 2 * clamp(x));
const mix = (a, b, t) => a + (b - a) * t;

function polygon(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const p of points.slice(1)) ctx.lineTo(...p);
  ctx.closePath();
}
function clippedRect(ctx, x, y, w, h, trim) {
  polygon(ctx, [[x + trim, y], [x + w, y], [x + w, y + h - trim],
    [x + w - trim, y + h], [x, y + h], [x, y + trim]]);
}
function line(ctx, points, color, width) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const p of points.slice(1)) ctx.lineTo(...p);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}
function text(ctx, value, x, y, size, color, opts = {}) {
  ctx.font = `${opts.weight ?? 500} ${size}px "Lesson ${opts.face ?? 'Sans'}"`;
  ctx.fillStyle = color;
  ctx.textAlign = opts.align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), x, y);
}
function opacity(ctx, alpha, draw) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  draw();
  ctx.restore();
}
function pathPoint(points, t) {
  const segments = points.slice(1).map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let left = clamp(t) * segments.reduce((sum, v) => sum + v, 0);
  for (const [i, length] of segments.entries()) {
    if (left <= length) {
      return [mix(points[i][0], points[i + 1][0], left / length),
        mix(points[i][1], points[i + 1][1], left / length)];
    }
    left -= length;
  }
  return points.at(-1);
}

// These repeated memory banks sit under the live rows on the two silicon surfaces.
function bank(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  for (let col = 0; col < w - 22; col += 32) {
    for (let row = 0; row < h - 6; row += 10) ctx.fillRect(x + col, y + row, 24, 5);
  }
  ctx.restore();
}
function die(ctx, rank) {
  const x = rank === 0 ? 46 : 1006, y = 140, w = 868, h = 716;
  const stripe = rank === 0 ? '#9c5861' : '#7279ad';
  ctx.save();
  ctx.shadowColor = '#05081a99';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 17;
  clippedRect(ctx, x, y + 15, w, h, 26);
  ctx.fillStyle = rank === 0 ? '#88545b' : '#545676';
  ctx.fill();
  ctx.restore();
  clippedRect(ctx, x, y, w, h, 26);
  const metal = ctx.createLinearGradient(x, y, x + w, y + h);
  const colors = rank === 0 ? ['#efc5af', '#f7dfc9', '#daaab1', '#efcbb7'] :
    ['#c9c4e0', '#e3d8f0', '#b6b9de', '#dbd2e4'];
  colors.forEach((color, i) => metal.addColorStop([0, 0.33, 0.7, 1][i], color));
  ctx.fillStyle = metal;
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let i = 0; i < 21; i++) {
    const d = 7 * i;
    line(ctx, [[x + 12 + d, y], [x + 12 + d, y + 18], [x + 38 + d, y + 44]],
      '#ffffff2b', 2);
  }
  bank(ctx, x + w - 289, y + 30, 262, 88, '#34325830');
  bank(ctx, x + 33, y + h - 181, rank === 0 ? 392 : 48, 128, '#38334c1d');
  line(ctx, [[x + 22, y + 124], [x + w - 22, y + 124]], '#3a34432e', 2);
  for (let i = 0; i < 6; i++) {
    const d = i * 8;
    line(ctx, [[x, y + h - 32 + d], [x + w - 56 + d, y + h - 32 + d],
      [x + w, y + h - 88 + 2 * d]], '#ffffff32', 2);
  }
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = stripe;
    ctx.fillRect(x + (rank === 0 ? w - 17 : 0), 333 + 17 * i, 17, 7);
  }
  text(ctx, 'Rank ' + rank, x + 56, y + 76, 64, ink, { weight: 700 });
  ctx.restore();
}

function etch(ctx, points) {
  for (const offset of [-6, 0, 6]) {
    line(ctx, points.map(([x, y]) => [x + (points.length > 2 ? offset / 2 : 0), y + offset]),
      '#35304750', 2.3);
  }
}

// The slit always separates two coordinates. Only the first coordinate has nonzero magnitude here.
function row(ctx, point, values, color, { decimal = false, empty = false, magnitude = false } = {}) {
  const [x, y] = point, w = 238, h = 80;
  ctx.save();
  clippedRect(ctx, x - w / 2, y - h / 2 + 5, w, h, 9);
  ctx.fillStyle = empty ? '#3d37452a' : '#342e43ac';
  ctx.fill();
  clippedRect(ctx, x - w / 2, y - h / 2, w, h, 9);
  ctx.fillStyle = empty ? '#c7bfc5' : color;
  ctx.fill();
  ctx.strokeStyle = empty ? '#50475680' : ink;
  ctx.lineWidth = empty ? 2 : 3;
  ctx.stroke();
  line(ctx, [[x + 31, y - 37], [x + 31, y + 37]], '#53496063', 2);
  if (!empty) {
    const first = decimal ? values[0].toFixed(2) : String(values[0]);
    text(ctx, first, x - 43, y - 1, first.length > 2 ? 43 : 52, ink, { face: 'Mono', align: 'center' });
    text(ctx, values[1], x + 74, y - 1, 48, ink, { face: 'Mono', align: 'center' });
    if (magnitude) {
      ctx.fillStyle = ink;
      ctx.fillRect(x - 104, y + 28, 29 * values[0], 5);
    }
  }
  ctx.restore();
}
function expert(ctx, id, active) {
  const [x, y] = slots[id], w = 342, h = 145;
  const top = y - 69;
  clippedRect(ctx, x - w / 2, top, w, h, 18);
  ctx.fillStyle = active ? '#4b445d' : '#68627736';
  ctx.fill();
  ctx.save();
  ctx.clip();
  bank(ctx, x - w / 2 + 9, top + 8, w - 6, h - 6, active ? '#e7e2e739' : '#58516626');
  ctx.restore();
  row(ctx, slots[id], null, null, { empty: true });
  text(ctx, 'Expert ' + id, x, y + 108, 44, active ? ink : '#605b70', { align: 'center', weight: active ? 700 : 500 });
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  const cue = (i, phrase, duration) => index === i ? ease(reveal(phrase, duration)) : Number(index > i);
  const firstSend = ease((elapsed + 0.22) / 2.8);
  const fork = cue(1, 'One row landed', 2.1);
  const reset = cue(2, 'Try the same input', 0.85);
  const choose = cue(2, 'give the other job', 0.6);
  const remoteJourney = cue(2, 'Keep expert three', 3);
  const secondSend = ease(remoteJourney / 0.57);
  const secondFan = ease((remoteJourney - 0.57) / 0.43);
  const local = cue(2, 'Where does that copy go', 1.7);
  const compute = cue(4, 'In this example', 1.15);
  const gate = cue(5, 'The caller multiplies', 1);
  const remoteBack = cue(6, 'Watch the return trip', 2.6);
  const localBack = cue(6, 'The local slot', 2.1);
  const add = cue(7, 'DeepEP adds', 1.1);
  const close = cue(7, 'One point two', 3.0);
  const fresh = index >= 2;
  const returning = index >= 6;
  const first = returnOrder[0].value;

  ctx.fillStyle = '#272639';
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.save();
  const zoom = mix(1, 2.28, close);
  ctx.translate(960, 500);
  ctx.scale(zoom, zoom);
  ctx.translate(-mix(960, 415, close), -mix(500, 319, close));
  // The bundle in the gap marks the only inter-GPU link in this view.
  for (let i = 0; i < 4; i++) {
    line(ctx, [[898, 333 + i * 17], [1022, 333 + i * 17]], '#7f8097', 6);
  }
  die(ctx, 0);
  die(ctx, 1);
  etch(ctx, across);
  etch(ctx, localPath);
  etch(ctx, fan[2]);
  etch(ctx, fan[3]);

  const active = fresh && choose > 0.5 ? split : shared;
  for (const id of [0, 2, 3]) expert(ctx, id, active.some(row => row.expert === id));
  text(ctx, returning ? 'Output rows' : 'Input rows', 119, 295, 31, ink, { weight: 600 });
  text(ctx, homeRow, 157, home[1], 58, ink, { face: 'Serif', align: 'center' });
  text(ctx, 'b', 157, 458, 49, '#665b6a', { face: 'Serif', align: 'center' });
  row(ctx, [home[0], 458], null, null, { empty: true });
  bank(ctx, 233, 439, 186, 46, '#5a526326');
  text(ctx, 'Receive row', received[0], 295, 31, ink, { weight: 600, align: 'center' });
  row(ctx, received, null, null, { empty: true });

  if (returning) {
    const homeValue = add >= 0.55 ? output[homeRow] : first;
    row(ctx, home, homeValue, cool, { empty: remoteBack < 1, decimal: true, magnitude: true });
  } else {
    row(ctx, home, input, warm);
  }
  if (!fresh || reset < 1) {
    const travel = index === 0 ? firstSend : 1;
    opacity(ctx, 1 - reset, () => {
      row(ctx, pathPoint(across, travel), input, warm);
      if (fork > 0) {
        for (const entry of shared) row(ctx, pathPoint(fan[entry.expert], fork), input, warm);
      }
    });
  }
  if (fresh && secondSend > 0 && !returning) {
    opacity(ctx, 1 - compute, () => row(ctx, pathPoint(across, secondSend), input, warm));
  }
  if (fresh) {
    for (const [i, job] of split.entries()) {
      const travel = job.remote ? secondFan : local;
      if (travel === 0) continue;
      const route = job.remote ? fan[job.expert] : localPath;
      const back = job.remote ? remoteBack : localBack;
      const weightedValue = weighted[i].value;
      if ((job.remote && back === 1) || (!job.remote && add === 1)) continue;
      if (returning) {
        const waiting = [home[0] + 311, home[1]];
        const path = job.remote
          ? [...fan[job.expert]].reverse().concat([home])
          : [...localPath.slice(1)].reverse().concat([waiting]);
        const p = pathPoint(path, back);
        opacity(ctx, job.remote ? 1 : 1 - add, () => {
          row(ctx, p, weightedValue, cool, { decimal: true, magnitude: true });
          if (!job.remote && back === 1) {
            text(ctx, '+', (home[0] + waiting[0]) / 2, home[1], 47, ink, { align: 'center' });
          }
        });
      } else {
        const p = pathPoint(route, travel);
        row(ctx, p, input, warm);
        opacity(ctx, compute, () => row(ctx, p, job.raw, pale, { magnitude: true }));
        opacity(ctx, gate, () => row(ctx, p, weightedValue, cool, { decimal: true, magnitude: true }));
      }
    }
  }
  if (index >= 4 && index <= 6) {
    for (const job of split) {
      const [x, y] = slots[job.expert];
      const label = index === 4 ? '× ' + (job.expert + 1) :
        index === 5 ? 'gate × ' + job.weight.toFixed(1) : '→ row ' + savedSource.get(job.key);
      ctx.fillStyle = job.remote ? '#d9cfe6' : '#ecc5bd';
      const width = 25 * label.length + 28;
      ctx.fillRect(x - width / 2, y - 138, width, 54);
      text(ctx, label, x, y - 109, 40, ink, { align: 'center', face: 'Mono' });
    }
  }
  ctx.restore();

  const stage = ['Dispatch', 'Dispatch', 'New route', 'Dispatch', 'Expert outputs', 'Gate weights', 'Combine', 'Combine'][index];
  ctx.fillStyle = '#272639';
  ctx.fillRect(0, 0, 1920, 98);
  text(ctx, 'DeepEP', 91, 57, 44, '#fff6e9', { weight: 700 });
  text(ctx, '/', 263, 57, 37, '#a8a3b9');
  text(ctx, stage, 305, 57, 38, '#e6dfea');
}

export default { title, beats, draw, check };
