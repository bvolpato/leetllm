import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { sources } from '../../../films/context-engineering/fixtures.mjs';

const beats = [
  {
    id: 'advance',
    say: 'Watch the numbers as the strip moves. Both requests failed on the same callback. Stop on the four oh three. We’re going to save a note about this one.',
    hold: 1.2,
  },
  {
    id: 'narrow-crop',
    say: 'Here’s what goes into the next model call. Three words from the trace. The callback failed. The app keeps the original record in its archive.',
    hold: 0.85,
  },
  {
    id: 'which-status',
    say: 'Now someone wants the exact HTTP status. Which record should the app fetch? Either failure on that strip could have produced these three words.',
    hold: 1.45,
  },
  {
    id: 'edge',
    say: 'Go back to the trace we used. There’s writing just outside our crop. Each record in this archive has its own source ID.',
    hold: 0.8,
  },
  {
    id: 'wider-crop',
    say: 'Widen the crop a little. Keep that ID with the finding when you save it. The sentence reads exactly as it did before.',
    hold: 0.65,
  },
  {
    id: 'retrieve',
    say: 'Try the same question. Follow the ID on the note back to its twin on the strip. The app fetches that record and puts it in the next call.',
    hold: 1.55,
  },
  {
    id: 'read',
    say: 'Four oh three, on the callback. You can read it straight off the trace. The rest of the strip stays in the archive.',
    hold: 2.6,
  },
];

// The second archive entry is a comparison case. The selected trace comes from the lesson.
const archive = new Map([
  ['trace-17', sources['trace-17']],
  ['trace-18', { trace: 'R18', at: 101, status: 401, path: '/callback' }],
]);
const selectedId = 'trace-17';
const findingFor = record =>
  record.path === '/callback' && record.status >= 400 ? 'The callback failed.' : 'Request recorded.';
function makeNote(id, keepSource) {
  const finding = findingFor(archive.get(id));
  return keepSource ? { finding, source: id } : { finding };
}

function nextCall(storedNote) {
  const note = JSON.parse(storedNote);
  const trace = archive.get(note.source);
  return trace ? { note, trace } : { note };
}

const bare = nextCall(JSON.stringify(makeNote(selectedId, false)));
const linked = nextCall(JSON.stringify(makeNote(selectedId, true)));
const cases = [...archive.entries()];

function check() {
  assert.deepEqual(makeNote('trace-18', false), bare.note);
  assert.notEqual(archive.get('trace-18').status, archive.get(selectedId).status);
  assert.equal(bare.trace, undefined);
  assert.equal(linked.note.finding, bare.note.finding);
  assert.deepEqual(linked.trace, { trace: 'R17', at: 100, status: 403, path: '/callback' });
  assert.equal(nextCall(JSON.stringify(makeNote('trace-18', true))).trace.status, 401);
  assert.equal(nextCall(JSON.stringify({ ...bare.note, source: 'unfiled' })).trace, undefined);
}

const clamp = t => Math.min(1, Math.max(0, t));
function smooth(t) {
  const k = clamp(t);
  return k * k * (3 - 2 * k);
}
const mix = (a, b, t) => a + (b - a) * t;
const indigo = '#202742';
const cobalt = '#304a8b';
const amber = '#ffd08b';
const tilt = -0.069;
const pitch = 706;
const filmWidth = 676;
const filmHeight = 410;
const gate = { x: 753, y: 425 };
const noteAt = { x: 439, y: 1324 };
const mountAt = { x: 1344, y: 1320 };

function noise(i) {
  const n = Math.sin(3.57 + i * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

let grain;
function paperGrain(ctx) {
  if (!grain) {
    grain = createCanvas(172, 173);
    const g = grain.getContext('2d');
    const bits = g.createImageData(grain.width, grain.height);
    for (let i = 0; i < bits.data.length / 4; i++) {
      const light = noise(i) > 0.5;
      bits.data.set([light ? 255 : 31, light ? 252 : 17, light ? 247 : 45, 12 + 16 * noise(i + 1)], i * 4);
    }
    g.putImageData(bits, 0, 0);
  }
  return ctx.createPattern(grain, 'repeat');
}

function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}
function line(ctx, x1, y1, x2, y2, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function poly(ctx, points, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();
}
function gradient(ctx, x, y, x2, y2, stops) {
  const g = ctx.createLinearGradient(x, y, x2, y2);
  stops.forEach(([pos, color]) => g.addColorStop(pos, color));
  return g;
}
function type(ctx, value, x, y, size, family, color, weight = '400', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(String(value), x, y);
}
function corners(ctx, x, y, w, h, len, color, width) {
  for (const [hx, vy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const a = x + hx * w, b = y + vy * h;
    ctx.beginPath();
    ctx.moveTo(a + (hx ? -len : len), b);
    ctx.lineTo(a, b);
    ctx.lineTo(a, b + (vy ? -len : len));
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

// Each exposure has a status in its image, a finding, and a key printed in the rebate.
function paintExposure(ctx, id, record) {
  rect(ctx, -filmWidth / 2, -filmHeight / 2, filmWidth, filmHeight,
    gradient(ctx, -338, -204, 338, 204, [[0, '#513640'], [0.15, '#2d293b'], [0.63, '#212537'], [1, '#553640']]));
  const holes = 12;
  for (let i = 0; i < holes; i++) {
    const x = -315 + i * 55;
    for (const y of [-196, 176]) {
      ctx.beginPath();
      ctx.roundRect(x, y, 28, 20, 4);
      ctx.fillStyle = '#eadfce';
      ctx.fill();
    }
  }

  const imageTone = gradient(ctx, -300, 135, 320, -110, [
    [0, '#222743'], [.34, '#223862'], [.74, '#304e78'], [.92, '#535c7e'], [1, '#7c6880'],
  ]);
  rect(ctx, -319, -104, 638, 260, imageTone);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-319, -104, 638, 260);
  ctx.clip();
  // Fine longitudinal marks belong to the emulsion and travel with the exposure.
  for (let i = 0; i < 18; i++) {
    const x = -327 + noise(i + 5) * 660, y = -108 + noise(i + 60) * 270;
    line(ctx, x, y, x + noise(i + 93) * 65, y - 0.7, '#f4e8c217', 1.1);
  }
  const left = -288;
  type(ctx, findingFor(record), left, -42, 49, 'Serif', '#fff2db');
  line(ctx, left, -20, 282, -20, '#efe5d149', 1.8);
  ctx.save();
  ctx.translate(left + 19, 113);
  ctx.rotate(-Math.PI / 2);
  type(ctx, 'HTTP', 0, 0, 26, 'Mono', '#eee1ca');
  ctx.restore();
  type(ctx, record.status, left + 36, 124, 144, 'Sans', '#fff5db', '600');
  type(ctx, record.path, 273, 108, 41, 'Mono', '#fff2db', '400', 'right');
  ctx.restore();

  type(ctx, id, -288, -124, 38, 'Mono', amber, '600');
  rect(ctx, -338, -205, 676, 410, paperGrain(ctx));
}

const negatives = new Map();
function exposure(ctx, id, record) {
  if (!negatives.has(id)) {
    const scale = 1.25;
    const canvas = createCanvas(Math.ceil(filmWidth * scale), Math.ceil(filmHeight * scale));
    const g = canvas.getContext('2d');
    g.scale(canvas.width / filmWidth, canvas.height / filmHeight);
    g.translate(filmWidth / 2, filmHeight / 2);
    paintExposure(g, id, record);
    negatives.set(id, canvas);
  }
  ctx.drawImage(negatives.get(id), -filmWidth / 2, -filmHeight / 2, filmWidth, filmHeight);
}

function filmPoint(x, y) {
  return { x: gate.x + x * Math.cos(tilt) - y * Math.sin(tilt),
    y: gate.y + x * Math.sin(tilt) + y * Math.cos(tilt) };
}

function drawFilm(ctx, advance, cropOpacity, widened, match) {
  ctx.save();
  ctx.translate(gate.x, gate.y);
  ctx.rotate(tilt);
  const travel = -pitch * (1 - advance);
  ctx.save();
  ctx.translate(travel, 0);
  const start = -1570, totalWidth = 5030;
  rect(ctx, start, -202, totalWidth, 426,
    gradient(ctx, 0, -202, 0, 224, [[0, '#58506648'], [.92, '#67536258'], [1, '#5b496300']]));
  rect(ctx, start, -205, totalWidth, 410, '#3b3040');
  for (let i = -2; i <= 3; i++) {
    ctx.save();
    ctx.translate(pitch * i, 0);
    if (i === 0 || i === 1) {
      exposure(ctx, ...cases[i]);
    } else {
      for (let j = 0; j < 12; j++) {
        for (const y of [-196, 176]) {
          rect(ctx, -315 + j * 55, y, 28, 20, '#e7dac9');
        }
      }
      rect(ctx, -319, -104, 638, 260, '#413445');
    }
    ctx.restore();
  }
  ctx.restore();
  if (cropOpacity > 0) {
    ctx.globalAlpha = cropOpacity;
    const top = mix(-100, -170, widened);
    corners(ctx, -301, top, 551, -27 - top, 19, '#fff0b1', 5);
  }
  if (match > 0) {
    ctx.globalAlpha = match;
    ctx.strokeStyle = '#ffdb8f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(-196, -138, 117, 32, -0.03, -0.32, -0.32 + 2 * Math.PI * match);
    ctx.stroke();
  }
  ctx.restore();
}

function table(ctx) {
  rect(ctx, -1250, -1300, 4600, 4400,
    gradient(ctx, -120, 20, 1920, 1710, [[0, '#c0bfd4'], [.38, '#e2ced0'], [1, '#aaaac3']]));
  rect(ctx, -120, -190, 2170, 965, '#88879a');
  rect(ctx, -120, -190, 2170, 953, '#d1ccda');
  rect(ctx, -120, -190, 2170, 944,
    gradient(ctx, 0, 0, 1780, 815, [[0, '#faf2e9'], [.46, '#fff1d9'], [1, '#c6bfd2']]));
  line(ctx, -30, 754, 2030, 754, '#fbf9ef', 5);
  type(ctx, 'Trace archive', 217, 174, 68, 'Serif', indigo);
  // A fixed index on the glass marks the exposure used to make the note.
  const top = filmPoint(0, -222), bottom = filmPoint(0, 222);
  poly(ctx, [[top.x - 12, top.y - 19], [top.x + 12, top.y - 19], [top.x, top.y]], cobalt);
  poly(ctx, [[bottom.x - 12, bottom.y + 19], [bottom.x + 12, bottom.y + 19], [bottom.x, bottom.y]], cobalt);
}

// A translucent glassine sleeve keeps the strip in the same place during each trip to the page.
function sleeve(ctx) {
  ctx.save();
  ctx.translate(1773, 204);
  ctx.rotate(-0.074);
  const contour = [[0, 0], [614, 0], [614, 452], [0, 452], [0, 413], [14, 382], [14, 72], [0, 45]];
  ctx.shadowColor = '#34334c4a';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 8;
  poly(ctx, contour, '#f4e9d9da');
  ctx.shadowColor = 'transparent';
  poly(ctx, [[0, 0], [614, 0], [280, 229], [14, 67]], '#fff7ea55');
  line(ctx, 14, 67, 278, 232, '#a699987e', 2);
  line(ctx, 278, 232, 610, 0, '#faf6edb0', 3);
  line(ctx, 0, 431, 615, 431, '#f9f4ea', 4);
  rect(ctx, 34, 0, 8, 452, '#f6f0eb68');
  ctx.restore();
}

function paper(ctx) {
  ctx.save();
  ctx.fillStyle = '#f9f5ea';
  ctx.shadowColor = '#47405e46';
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 14;
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.moveTo(68, 838);
  ctx.lineTo(1843, 813);
  ctx.lineTo(1861, 1566);
  ctx.lineTo(80, 1594);
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = 'transparent';
  poly(ctx, [[68,838],[1843,813],[1861,1566],[80,1594]],
    gradient(ctx, 100, 880, 1855, 1560, [[0, '#fffdf3'], [.55, '#f8f4e9'], [1, '#e6e1de']]));
  type(ctx, 'Next model call', 146, 944, 43, 'Mono', cobalt);
  type(ctx, 'Which status came back?', 139, 1059, 88, 'Serif', indigo);
  line(ctx, 146, 1105, 1760, 1105, '#bcbac7', 2);
  ctx.restore();
}

function emptyMount(ctx, unknown) {
  ctx.save();
  ctx.translate(mountAt.x, mountAt.y);
  ctx.rotate(0.023);
  ctx.scale(0.95, 0.95);
  corners(ctx, -343, -201, 686, 402, 30, '#a8a8b9', 3);
  if (unknown > 0) {
    ctx.globalAlpha = unknown;
    type(ctx, 'HTTP', 0, -26, 37, 'Mono', '#6d6f82', '400', 'center');
    type(ctx, '?', 0, 92, 116, 'Serif', indigo, '400', 'center');
  }
  ctx.restore();
}

function print(ctx, p, keyed, opacity, missing, lift) {
  if (opacity <= 0) return;
  const from = filmPoint(-26, keyed ? -95 : -66);
  const x = mix(from.x, noteAt.x, p), y = mix(from.y, noteAt.y, p);
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(x, y - Math.sin(p * Math.PI) * 38);
  ctx.rotate(mix(tilt, -0.035, p));
  const w = mix(553, 585, p), h = keyed ? 184 : 119;
  ctx.shadowColor = '#3d32484a';
  ctx.shadowBlur = 7 + 24 * lift;
  ctx.shadowOffsetY = 5 + 15 * lift;
  rect(ctx, -w / 2, -h / 2, w, h, '#fff8dc');
  ctx.shadowColor = 'transparent';
  rect(ctx, -w / 2, -h / 2, w, h,
    gradient(ctx, -290, -100, 280, 110, [[0, '#fff6d9'], [.75, '#ffedca'], [1, '#f3deb8']]));
  if (keyed) {
    rect(ctx, -w / 2, -h / 2, w, 61, '#f4c476');
    type(ctx, linked.note.source, -w / 2 + 28, -h / 2 + 46, 39, 'Mono', '#382b35', '600');
  }
  type(ctx, bare.note.finding, -w / 2 + 28, keyed ? 51 : 20, 54, 'Serif', '#2b2c44');
  if (missing > 0) {
    ctx.globalAlpha = missing * opacity;
    type(ctx, 'Source ID missing', -w / 2 + 8, h / 2 + 66, 38, 'Mono', '#835851');
  }
  ctx.restore();
}

function returnRecord(ctx, t) {
  if (t <= 0 || !linked.trace) return;
  const p = smooth(t);
  ctx.save();
  ctx.globalAlpha = clamp(t * 8);
  ctx.translate(mix(gate.x, mountAt.x, p), mix(gate.y, mountAt.y, p) - 42 * Math.sin(p * Math.PI));
  ctx.rotate(mix(tilt, 0.023, p));
  const scale = mix(1, .95, p);
  ctx.scale(scale, scale);
  ctx.shadowColor = '#322c495c';
  ctx.shadowOffsetY = 6 + 17 * Math.sin(p * Math.PI);
  ctx.shadowBlur = 12 + 14 * Math.sin(p * Math.PI);
  rect(ctx, -338, -205, 676, 410, indigo);
  ctx.shadowColor = 'transparent';
  exposure(ctx, linked.note.source, linked.trace);
  ctx.restore();
}

function draw(ctx, clock) {
  const { index, reveal, elapsed } = clock;
  const cue = (beat, phrase, span) => index > beat ? 1 : index < beat ? 0 : smooth(reveal(phrase, span));
  const feed = index === 0 ? smooth((elapsed + 0.14) / 3.15) : 1;
  const narrow = cue(1, 'Here’s what', 0.62);
  const liftFirst = cue(1, 'Three words', 1.8);
  const missing = cue(2, 'Which record', 0.65);
  const back = cue(3, 'Go back', 1.8);
  const widen = cue(4, 'Widen the crop', 1.1);
  const liftSecond = cue(4, 'Keep that ID', 2);
  const follow = cue(5, 'Follow the ID', 1.5);
  const match = cue(5, 'its twin', 0.9);
  const retrieve = cue(5, 'fetches that record', 1.9);

  const pageView = liftFirst * (1 - back) + liftSecond * (1 - follow) + retrieve;
  const cameraDepth = clamp(pageView);
  const wide = follow * (1 - retrieve);
  const centerY = mix(408, 1106, cameraDepth) + 400 * wide;
  const scale = mix(1.12, 1, cameraDepth) - 0.42 * wide;
  ctx.save();
  rect(ctx, 0, 0, 1920, 1080, '#c3bdc9');
  ctx.translate(960, 540);
  ctx.scale(scale, scale);
  ctx.translate(-960, -centerY);
  table(ctx);
  const activeCrop = (narrow * (1 - liftFirst) + back * (1 - liftSecond));
  drawFilm(ctx, feed, activeCrop, widen, match * (1 - retrieve));
  sleeve(ctx);
  paper(ctx);
  emptyMount(ctx, (1 - clamp(retrieve * 3)) * liftFirst);
  print(ctx, liftFirst, false, (1 - back) * smooth(liftFirst * 4), missing, Math.sin(liftFirst * Math.PI));
  print(ctx, liftSecond, true, smooth(liftSecond * 4), 0, Math.sin(liftSecond * Math.PI));
  returnRecord(ctx, retrieve);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = .34;
  rect(ctx, 0, 0, 1920, 1080, paperGrain(ctx));
  ctx.restore();
}

export default { title: 'Which Trace Did That Note Come From?', beats, draw, check };
