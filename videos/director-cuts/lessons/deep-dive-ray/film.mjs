import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';

const title = 'Ray · The tile that came back first';
const beats = [
  {
    id: 'two-workers',
    say: 'West got a head start on this storm. Here comes east. Each tile has its own Ray worker.',
    hold: 0.5,
  },
  {
    id: 'submit-stitch',
    say: 'Before either worker finishes, the driver submits stitch. Each name in that call is an object reference. It identifies a result while the worker is still decoding the pixels.',
    hold: 0.65,
  },
  {
    id: 'east-arrives',
    say: 'Follow the edge on the right. All the way to the bottom. East went in second and finished first. Can stitch start yet?',
    hold: 1.05,
  },
  {
    id: 'one-missing-value',
    say: 'Look at west in the call. The dotted line marks the missing result. We passed the references as two separate arguments. Ray waits for a value for each one before it runs stitch.',
    hold: 0.75,
  },
  {
    id: 'meet-at-the-eye',
    say: 'Watch the last rows on the left. Now stitch gets two arrays of pixels. It places them in argument order. Look across the eye of the storm. East finished first and still belongs on the right.',
    hold: 2.4,
  },
];

// The fixture is a synthetic weather image. Its two inputs are independently
// run-length encoded, so the progress boundary always falls on a decoded row.
const tileWidth = 168;
const rows = 120;
const imageWidth = 2 * tileWidth;
const mix = (a, b, p) => a + (b - a) * p;
const clamp = (t) => Math.min(1, Math.max(0, t));
const smooth = (t) => clamp(t) ** 2 * (3 - 2 * clamp(t));

function hash(x, y) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function noise(x, y) {
  const i = Math.floor(x), j = Math.floor(y);
  const u = smooth(x - i), v = smooth(y - j);
  return mix(mix(hash(i, j), hash(i + 1, j), u),
    mix(hash(i, j + 1), hash(i + 1, j + 1), u), v);
}

function cloudPixel(x, y) {
  const dx = (x - 172) / 53;
  const dy = (y - 58 + dx * 5) / 47;
  const r = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const twist = angle + 3.1 * Math.log(1 + 1.8 * r);
  const u = r * Math.cos(twist);
  const v = r * Math.sin(twist);
  const rough = noise(4 * u - 13, 4 * v + 8);
  const detail = noise(15 * u, 15 * v) * 0.52 + noise(35 * u, 35 * v) * 0.28 + hash(x, y) * 0.2;
  const band = Math.max(0, Math.cos(3 * twist + 1.8 * (rough - 0.5) + 0.6 * Math.sin(twist)));
  const spiral = band ** 2.3 * Math.exp(-0.92 * r) * (0.8 + 0.9 * rough);
  const canopy = 0.75 * Math.exp(-1.55 * r * r) + 0.35 * Math.exp(-7 * (r - 0.37) ** 2);
  const wisps = 0.43 * noise(2 * u + 4, 4 * v + 9) + 0.32 * rough;
  const eye = smooth((r + 0.035 * (rough - 0.5) - 0.098) / 0.12);
  const density = (canopy + spiral + wisps - 0.39 + 0.28 * (detail - 0.55)) * eye;
  return Math.round(63 * clamp(0.055 + 0.72 * density + 0.045 * detail));
}

const original = Uint8Array.from({ length: imageWidth * rows }, (_, i) =>
  cloudPixel(i % imageWidth, Math.floor(i / imageWidth)));

function encodeTile(offset) {
  const packed = [];
  for (let y = 0; y < rows; y++) {
    const scan = [];
    for (let x = 0; x < tileWidth; x++) {
      const ink = original[y * imageWidth + offset + x];
      if (scan.length && scan.at(-1) === ink) scan[scan.length - 2]++;
      else scan.push(1, ink);
    }
    packed.push(scan);
  }
  return packed;
}

function decode(packed) {
  const data = new Uint8Array(rows * tileWidth);
  let pos = 0;
  for (const scan of packed) {
    for (let i = 0; i < scan.length; i += 2) {
      data.fill(scan[i + 1], pos, pos + scan[i]);
      pos += scan[i];
    }
  }
  return data;
}

function stitch(west, east) {
  const image = new Uint8Array(rows * imageWidth);
  for (let y = 0; y < rows; y++) {
    image.set(west.subarray(y * tileWidth, (y + 1) * tileWidth), y * imageWidth);
    image.set(east.subarray(y * tileWidth, (y + 1) * tileWidth), y * imageWidth + tileWidth);
  }
  return image;
}

// This is one possible execution with two available workers. Time here is
// trace time. The camera slows it down or holds it to follow the narration.
const jobs = [
  { ref: 'west', submit: 0, finish: 4, input: encodeTile(0) },
  { ref: 'east', submit: 1.48, finish: 2.65, input: encodeTile(tileWidth) },
];
const submission = 2.06;
const args = ['west', 'east'];
const decoded = new Map(jobs.map((job) => [job.ref, decode(job.input)]));
const joined = stitch(...args.map((ref) => decoded.get(ref)));

function snapshot(time) {
  const completed = new Map();
  const workers = jobs.map((job) => {
    const ready = time >= job.finish;
    if (ready) completed.set(job.ref, decoded.get(job.ref));
    return {
      ...job, ready, submitted: time >= job.submit,
      lines: Math.floor(rows * clamp((time - job.submit) / (job.finish - job.submit))),
    };
  });
  const missing = args.filter((ref) => !completed.has(ref));
  const submitted = time >= submission;
  const runnable = submitted && missing.length === 0;
  const start = Math.max(submission, ...jobs.map((job) => job.finish)) + 0.08;
  const assembly = runnable ? smooth((time - start) / 0.58) : 0;
  return { workers, completed, submitted, missing, runnable, assembly };
}

const paletteStops = [
  [0, [17, 24, 60]], [8, [34, 41, 89]], [16, [60, 82, 144]],
  [23, [135, 168, 195]], [29, [228, 200, 179]], [34, [237, 148, 107]],
  [41, [203, 87, 71]], [47, [253, 164, 106]], [54, [255, 220, 166]], [63, [255, 248, 229]],
];
const palette = Array.from({ length: 64 }, (_, k) => {
  const hi = paletteStops.findIndex(([stop]) => k <= stop);
  const [b, to] = paletteStops[hi];
  const [a, from] = paletteStops[Math.max(0, hi - 1)];
  return from.map((v, i) => Math.round(mix(v, to[i], (k - a) / (b - a || 1))));
});

function rasterize(data, w) {
  const canvas = createCanvas(w, rows), ctx = canvas.getContext('2d');
  const rgba = ctx.createImageData(w, rows);
  data.forEach((k, i) => rgba.data.set([...palette[k], 255], 4 * i));
  ctx.putImageData(rgba, 0, 0);
  return canvas;
}
const plates = jobs.map((job) => rasterize(decoded.get(job.ref), tileWidth));
const panorama = rasterize(joined, imageWidth);

const scale = 5;
const w = tileWidth * scale, h = rows * scale;
const y = 204;
const ink = '#242740', dim = '#535570', blue = '#344fb4';
const sans = 'Lesson Sans', mono = 'Lesson Mono';
function text(ctx, words, x, base, size, color = ink, family = sans, align = 'left') {
  ctx.font = (family === sans ? '600 ' : '') + size + 'px "' + family + '"';
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(words, x, base);
}
function line(ctx, x1, y1, x2, y2, color, width = 2) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
function traceTime(c) {
  const { index, progress, reveal } = c;
  switch (index) {
    case 0: return 0.99 + 0.39 * reveal('West got', 1.15) + 0.05 * progress + 0.57 * reveal('Here comes', 1.4);
    case 1: return 2 + 0.17 * progress + 0.16 * reveal('the driver submits', 0.4);
    case 2: return 2.33 + 0.41 * reveal('Follow the edge', 1.6) + 0.09 * progress;
    case 3: return mix(2.83, 3.79, progress);
    default: return 3.79 + 0.31 * reveal('Watch the last rows', 1) + 0.84 * reveal('Now stitch', 1.05);
  }
}

function background(ctx) {
  const daylight = ctx.createLinearGradient(0, 0, 1400, 1080);
  daylight.addColorStop(0, '#f4f1f1');
  daylight.addColorStop(0.55, '#e6e6f0');
  daylight.addColorStop(1, '#d6d9e7');
  ctx.fillStyle = daylight; ctx.fillRect(0, 0, 1920, 1080);
}

// The visible scan belongs to the worker. Only a complete tile changes the
// matching argument from a dotted underline to a solid one.
function drawWorker(ctx, worker, i, x, p) {
  const shown = worker.lines * scale;
  const active = worker.submitted && !worker.ready;
  ctx.fillStyle = '#c4c8db'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#a7afc7';
  for (let row = y + 12; row < y + h; row += 20) {
    if (row < y + shown) continue;
    for (let col = x + 12; col < x + w; col += 20) ctx.fillRect(col, row, 2, 2);
  }
  if (shown) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(plates[i], 0, 0, tileWidth, worker.lines, x, y, w, shown);
  }
  if (active) {
    line(ctx, x, y + shown, x + w, y + shown, '#f6f7fb', 4);
    ctx.beginPath(); ctx.moveTo(x, y + shown - 8);
    ctx.lineTo(x + 16, y + shown); ctx.lineTo(x, y + shown + 8);
    ctx.closePath(); ctx.fillStyle = '#2a369c'; ctx.fill();
  }
  ctx.save(); ctx.globalAlpha = 1 - smooth(p / 0.42);
  text(ctx, 'Worker ' + (i + 1), x, 89, 29, dim);
  text(ctx, worker.ref, x - 2, 165, 65, ink, mono);
  const status = worker.ready ? 'ready' : active ? 'decoding' : 'awaiting submission';
  text(ctx, status, x + w, 161, 34, worker.ready ? blue : dim, sans, 'right');
  // The outer margin marks scanlines in each of the two worker views.
  for (let row = 0; row <= rows; row += 10) {
    const edge = i === 0 ? x : x + w, dir = i === 0 ? -1 : 1;
    line(ctx, edge + dir * 4, y + row * scale, edge + dir * (row % 30 === 0 ? 23 : 12), y + row * scale, '#777f9a');
  }
  ctx.restore();
}

function call(ctx, state) {
  if (!state.submitted) {
    state.workers.forEach((worker, i) => {
      if (worker.submitted)
        text(ctx, worker.ref + ' = decode.remote(…)', i === 0 ? 78 : 1002, 921, 43, ink, mono);
    });
    return;
  }
  const startX = mix(80, 120, state.assembly), base = 921;
  let x = startX;
  const token = (str, color) => {
    text(ctx, str, x, base, 56, color, mono);
    x += ctx.measureText(str).width;
  };
  token('stitch.remote(', ink);
  args.forEach((ref, i) => {
    const from = x, ready = state.completed.has(ref);
    token(ref, ready ? blue : ink);
    ctx.save();
    if (!ready) { ctx.setLineDash([0.1, 14]); ctx.lineCap = 'round'; }
    line(ctx, from + 3, base + 14, x - 3, base + 14, ready ? blue : dim, 6);
    ctx.restore();
    if (i === 0) token(', ', ink);
  });
  token(')', ink);
  const status = state.assembly === 1 ? 'Image ready'
    : state.assembly > 0 ? 'Joining tiles'
    : state.runnable ? 'Ready to stitch'
    : state.missing.length === 1 ? 'Waiting for ' + state.missing[0] : 'Waiting for both tiles';
  text(ctx, status, 1920 - startX, base, 43, state.runnable ? blue : ink, sans, 'right');
}

function draw(ctx, clock) {
  const state = snapshot(traceTime(clock));
  const p = state.assembly;
  background(ctx);
  const gap = 84 * (1 - p), left = (1920 - 2 * w - gap) / 2;
  for (let i = 0; i < 2; i++)
    drawWorker(ctx, state.workers[i], i, left + i * (w + gap), p);
  if (p > 0) {
    ctx.save(); ctx.globalAlpha = smooth((p - 0.48) / 0.52);
    text(ctx, 'Stitched image', 120, 158, 60);
    text(ctx, imageWidth + ' × ' + rows + ' px', 1800, 158, 37, dim, mono, 'right');
    ctx.restore();
  }
  if (p === 1) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(panorama, left, y, 2 * w, h);
  }
  call(ctx, state);
}

function check() {
  const beforeEast = snapshot(0.12);
  assert.deepEqual(beforeEast.workers.map((w) => w.submitted), [true, false]);
  const wired = snapshot(submission);
  assert.ok(wired.submitted);
  assert.deepEqual(wired.missing, ['west', 'east']);
  const first = snapshot(jobs[1].finish);
  assert.deepEqual([...first.completed.keys()], ['east']);
  assert.deepEqual(first.missing, ['west']);
  assert.ok(!first.runnable && first.assembly === 0);
  assert.equal(first.workers[1].lines, rows);
  assert.ok(first.workers[0].lines > 0 && first.workers[0].lines < rows);
  assert.equal(snapshot(3.999).runnable, false);
  const last = snapshot(4);
  assert.ok(last.runnable && last.assembly === 0);
  assert.deepEqual(stitch(...args.map((ref) => last.completed.get(ref))), original);
  assert.notDeepEqual(stitch(decoded.get('east'), decoded.get('west')), original);
  assert.equal(snapshot(4.94).assembly, 1);
}

export default { title, beats, draw, check };
