import assert from 'node:assert/strict';
import { Path2D } from '@napi-rs/canvas';
import { FFN, FFN_CUT } from '../../../films/deep-dive-light-peft/fixtures.mjs';
import { keepAbove } from '../../../films/deep-dive-light-peft/arithmetic.mjs';
import { ffnPathFixture } from '../../../films/deep-dive-light-peft/model.mjs';

const full = ffnPathFixture(false);
const loose = ffnPathFixture(true, false);
const paired = ffnPathFixture();
const selection = keepAbove(FFN.map(unit => unit.score), FFN_CUT);
const layer = FFN.filter(unit => unit.layer === 0);
const keep = layer.filter(unit => unit.score > selection.threshold);
const removed = layer.findIndex(unit => !keep.includes(unit));
const ids = full.ids;
const products = full.activation.map((value, i) => value * full.down[i]);

const beats = [
  {
    id: 'round-the-bend',
    say: 'Follow the two around the bend. The first row supplies that activation for this token. The first column reads it. Those are the two ends of one feed-forward coordinate.',
    hold: 0.65,
  },
  {
    id: 'one-output',
    say: 'Read the top row on the right. Its first weight is one, so the red path adds two. The next path adds six. The last adds one. Together they give us nine.',
    hold: 0.9,
  },
  {
    id: 'the-gate',
    say: 'Early in training, Light-PEFT learns a gate for each feed-forward coordinate. The score for this red one falls below the cutoff computed across both layers in our example. That selects it for pruning.',
    hold: 0.6,
  },
  {
    id: 'loose-row',
    say: 'Lift just the red row. Two activations remain. The down projection still expects three. Which column belongs with the piece we lifted?',
    hold: 1.9,
  },
  {
    id: 'matching-column',
    say: 'There it goes. Both weights in the first column leave with the row that supplied their input. Watch the two blue paths slide over. Each activation still reaches its own column.',
    hold: 0.85,
  },
  {
    id: 'same-token',
    say: 'Send the same token through again. Three times two gives six. Negative one times negative one gives one. The output is seven. The red pieces still show where the other two came from.',
    hold: 2.8,
  },
];

function check() {
  assert(Math.abs(selection.threshold - 0.246) < 1e-10);
  assert.deepEqual(keep.map(unit => unit.id), ['L0-n2', 'L0-n3']);
  assert.equal(layer[removed].id, 'L0-n1');
  assert.deepEqual(ids, layer.map(unit => unit.id.split('-')[1]));
  assert.deepEqual(products, [2, 6, 1]);
  assert.deepEqual([full.activation.length, full.down.length, full.output], [3, 3, 9]);
  assert.deepEqual([loose.activation.length, loose.down.length, loose.valid, loose.output], [2, 3, false, null]);
  assert.deepEqual(paired.ids, keep.map(unit => unit.id.split('-')[1]));
  assert.deepEqual(paired.activation, [3, -1]);
  assert.deepEqual(paired.down, [2, -1]);
  assert.equal(paired.activation.reduce((sum, value, i) => sum + value * paired.down[i], 0), paired.output);
  assert.equal(full.output - products[removed], paired.output);
  assert.equal(paired.output, 7);
}

const ink = '#1c2845';
const muted = '#495773';
const colors = [
  { dark: '#983527', main: '#c95039', light: '#e77b5c' },
  { dark: '#223f78', main: '#3f65a6', light: '#7498cb' },
  { dark: '#303c80', main: '#565fb0', light: '#929ada' },
];
const upX = 221;
const bendX = 873;
const bendY = 343;
const firstRadius = 165;
const pitch = 118;
const join = 752;
const downTop = 147;
const downEnd = 329;
const sourceNumber = 619;
const upEnd = upX + 2 * 132;
const radius = i => firstRadius + pitch * i;
const clamp = t => Math.max(0, Math.min(1, t));
function smooth(t) {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
}
const mix = (a, b, t) => a + (b - a) * t;
const number = value => String(value).replace('-', '−');

function type(ctx, text, x, y, size, color = ink, align = 'left', face = 'Sans', weight = 500) {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(String(text), x, y);
}

function polyline(ctx, points, color, width) {
  ctx.beginPath();
  for (const [i, [x, y]] of points.entries()) {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function page(ctx) {
  const daylight = ctx.createLinearGradient(90, 25, 1680, 1080);
  daylight.addColorStop(0, '#fbf8f0');
  daylight.addColorStop(0.49, '#f3f2f4');
  daylight.addColorStop(1, '#e0e5f2');
  ctx.fillStyle = daylight;
  ctx.fillRect(0, 0, 1920, 1080);
}

function tile(ctx, x, y, w, h, palette, value) {
  ctx.fillStyle = palette.dark;
  ctx.fillRect(x, y + 6, w, h);
  const surface = ctx.createLinearGradient(x, y, x + w * 0.55, y + h);
  surface.addColorStop(0, palette.light);
  surface.addColorStop(0.15, palette.main);
  surface.addColorStop(1, palette.dark);
  ctx.fillStyle = surface;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.fillRect(x + 2, y + 2, w - 4, 2);
  if (value !== undefined) {
    type(ctx, number(value), x + w / 2, y + h / 2, 54, '#fffaf0', 'center', 'Mono');
    return;
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 6, y + 6, w - 12, h - 12);
  ctx.clip();
  ctx.beginPath();
  for (let d = -h; d < w; d += 12) {
    ctx.moveTo(x + d, y + h);
    ctx.lineTo(x + d + h, y);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.20)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function strip(ctx, path, palette) {
  ctx.save();
  ctx.translate(1.5, 7);
  ctx.strokeStyle = 'rgba(37,46,82,0.14)';
  ctx.lineWidth = 58;
  ctx.stroke(path);
  ctx.restore();

  // The turn shares a center with its neighbors. Each band keeps its own radius.
  const folded = ctx.createLinearGradient(join, 510, bendX + 295, 255);
  folded.addColorStop(0, palette.main);
  folded.addColorStop(0.32, palette.light);
  folded.addColorStop(0.58, palette.main);
  folded.addColorStop(1, palette.dark);
  ctx.lineCap = 'butt';
  ctx.lineWidth = 58;
  ctx.strokeStyle = folded;
  ctx.stroke(path);
  ctx.save();
  ctx.setLineDash([4, 10]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.34)';
  ctx.stroke(path);
  ctx.restore();
}

function parked(ctx, amount) {
  // Scale about the lifted row so the two detached pieces meet in the inset.
  ctx.translate(mix(upX, 185, amount), mix(bendY + firstRadius, 321, amount));
  const s = mix(1, 0.71, amount);
  ctx.scale(s, s);
  ctx.translate(-upX, -(bendY + firstRadius));
}

function upPiece(ctx, i, r) {
  const palette = colors[i];
  const y = bendY + r;
  const path = new Path2D();
  path.moveTo(upEnd - 3, y);
  path.lineTo(join + 0.4, y);
  strip(ctx, path, palette);
  for (let col = 0; col < 2; col++) tile(ctx, upX + 132 * col, y - 48, 128, 96, palette);
  type(ctx, ids[i], upX - 28, y, 42, palette.dark, 'right', 'Mono');
  ctx.fillStyle = palette.main;
  ctx.fillRect(sourceNumber - 49, y - 27, 98, 54);
  type(ctx, number(full.activation[i]), sourceNumber, y - 1, 52, '#fffaf0', 'center', 'Mono', 600);
}

function downPiece(ctx, i, r) {
  const palette = colors[i];
  const x = bendX + r;
  const path = new Path2D();
  path.moveTo(join, bendY + r);
  path.lineTo(bendX, bendY + r);
  path.arc(bendX, bendY, r, Math.PI / 2, 0, true);
  path.lineTo(x, downEnd - 5);
  strip(ctx, path, palette);
  tile(ctx, x - 54, downTop, 108, 84, palette, full.down[i]);
  tile(ctx, x - 54, downTop + 92, 108, 86, palette);
  type(ctx, ids[i], x, downTop - 27, 38, palette.dark, 'center', 'Mono');
}

function packet(ctx, i, r, progress) {
  if (progress <= 0 || progress >= 1) return;
  const y = bendY + r;
  const straight = bendX - sourceNumber;
  const turn = Math.PI * r / 2;
  const lift = bendY - downEnd + 13;
  const d = (straight + turn + lift) * progress;
  let x, atY;
  if (d < straight) {
    x = sourceNumber + d;
    atY = y;
  } else if (d < straight + turn) {
    const angle = Math.PI / 2 - (d - straight) / r;
    x = bendX + Math.cos(angle) * r;
    atY = bendY + Math.sin(angle) * r;
  } else {
    x = bendX + r;
    atY = bendY - (d - straight - turn);
  }
  ctx.save();
  ctx.globalAlpha = clamp(progress * 14) * clamp((1 - progress) * 13);
  ctx.beginPath();
  ctx.arc(x, atY - 2, 43, 0, 2 * Math.PI);
  ctx.fillStyle = '#fffcf5';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = colors[i].dark;
  ctx.stroke();
  type(ctx, number(full.activation[i]), x, atY - 3, 49, colors[i].dark, 'center', 'Mono', 600);
  ctx.restore();
}

function score(ctx, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  const red = colors[removed].dark;
  type(ctx, 'n1 gate', 151, 212, 39, red, 'left', 'Mono');
  type(ctx, layer[removed].score.toFixed(2), 151, 293, 76, red, 'left', 'Serif');
  type(ctx, 'Global cutoff', 432, 212, 39, muted);
  type(ctx, selection.threshold.toFixed(3), 432, 293, 76, ink, 'left', 'Serif');
  polyline(ctx, [[183, 349], [183, 415], [245, 449]], red, 3);
  ctx.restore();
}

function output(ctx, value, shown, packed, mismatch) {
  const x = 1483;
  const rightEdge = bendX + radius(2) - packed * pitch + 56;
  const y = downTop + 42;
  polyline(ctx, [[rightEdge + 8, y], [x - 34, y]], '#8c96ae', 3);
  polyline(ctx, [[x - 47, y - 9], [x - 33, y], [x - 47, y + 9]], '#8c96ae', 3);
  type(ctx, 'First output', x, 91, 47, muted);
  if (value !== null) type(ctx, value, x - 5, y + 1, 145, ink, 'left', 'Serif');
  else polyline(ctx, [[x, y + 40], [x + 76, y + 40]], '#8c96ae', 4);
  if (mismatch) {
    type(ctx, '2 activations', x, 326, 40, ink);
    type(ctx, '3 input columns', x, 381, 40, colors[removed].dark);
    return;
  }
  let row = 0;
  for (let i = 0; i < ids.length; i++) {
    if (shown[i] <= 0) continue;
    ctx.save();
    ctx.globalAlpha = shown[i];
    const term = number(full.activation[i]) + ' × ' + number(full.down[i]) + ' = ' + products[i];
    type(ctx, term, x, 332 + row * 62, 45, colors[i].dark, 'left', 'Mono');
    ctx.restore();
    row++;
  }
}

function draw(ctx, clock) {
  const { index, elapsed } = clock;
  const cue = (phrase, span = 0.55) => smooth(clock.reveal(phrase, span));
  const rowLift = index < 3 ? 0 : index > 3 ? 1 : smooth(elapsed / 1.45);
  const columnLift = index < 4 ? 0 : index > 4 ? 1 : smooth(elapsed / 1.8);
  const packed = index < 4 ? 0 : index > 4 ? 1 : cue('Watch the two blue paths', 1.45);
  const gateAlpha = index === 2 ? cue('a gate for each') : index === 3 ? 1 - smooth(elapsed / 0.4) : 0;

  page(ctx);
  type(ctx, 'Layer 0', 145, 77, 61, ink, 'left', 'Serif');
  type(ctx, 'One token', 148, 137, 39, muted);
  score(ctx, gateAlpha);

  for (let i = ids.length - 1; i >= 0; i--) {
    const r = radius(i) - (i === removed ? 0 : packed * pitch);
    ctx.save();
    if (i === removed) parked(ctx, rowLift);
    upPiece(ctx, i, r);
    ctx.restore();
    ctx.save();
    if (i === removed) parked(ctx, columnLift);
    downPiece(ctx, i, r);
    ctx.restore();
  }

  const bottomLabel = bendY + radius(2) - packed * pitch + 112;
  type(ctx, 'Up projection', upX - 11, bottomLabel, 45, ink);
  type(ctx, (rowLift < 0.5 ? full.activation.length : loose.activation.length) + ' × 2',
    upX - 9, bottomLabel + 54, 44, muted, 'left', 'Mono');
  type(ctx, 'Activation', sourceNumber, bottomLabel, 42, muted, 'center');
  const downCenter = bendX + (firstRadius + radius(2)) / 2 + columnLift * pitch / 2 - packed * pitch;
  type(ctx, 'Down projection', downCenter - 48, 57, 44, ink, 'center');
  type(ctx, '2 × ' + (columnLift < 0.5 ? full.down.length : paired.down.length),
    downCenter + 204, 57, 42, muted, 'center', 'Mono');

  if (rowLift > 0.55) {
    ctx.save();
    ctx.globalAlpha = clamp((rowLift - 0.55) / 0.45);
    type(ctx, columnLift === 1 ? 'Removed coordinate' : 'Removed row',
      175, 408, 36, colors[removed].dark);
    ctx.restore();
  }

  let values = [0, 0, 0];
  let result = null;
  if (index === 0) {
    packet(ctx, removed, firstRadius, smooth((elapsed + 0.35) / 3.2));
  } else if (index === 1) {
    values = [cue('its first weight'), cue('the next path'), cue('the last adds')];
    if (cue('Together they give') > 0.5) result = full.output;
  } else if (index === 2) {
    values = [1, 1, 1];
    result = full.output;
  } else if (index === 5) {
    const two = clock.reveal('through again', 2.6);
    const three = clock.reveal('Three times two', 2.9);
    packet(ctx, 1, radius(1) - pitch, smooth(two));
    packet(ctx, 2, radius(2) - pitch, smooth(three));
    values = [0, cue('gives six'), cue('gives one')];
    if (values[2] === 1) result = paired.output;
  }
  if (index > 0) output(ctx, result, values, packed, index === 3 && rowLift > 0.7);
}

export default { title: 'Light-PEFT and the missing column', beats, draw, check };
