import assert from 'node:assert/strict';
import { dot, softmax } from '../../../films/grouped-query-attention/arithmetic.mjs';
import { HEADS, KV_KEYS, KV_VALUES, QUERY_VECTORS } from '../../../films/grouped-query-attention/fixtures.mjs';
import { cacheBytes, kvGroupForQuery } from '../../../films/grouped-query-attention/model.mjs';

const beats = [
  {
    id: 'first-pull',
    say: "Watch head zero read two rows from the cache. A wide strip of blue reaches its output with a sliver of coral. The head below reads the very same rows. What comes through there?",
    hold: 0.9,
  },
  {
    id: 'two-values',
    say: "Trace the blue back to its row. Its value is one, zero. Coral carries zero, one. When you mix those two vectors, blue supplies the first coordinate and coral supplies the second.",
    hold: 0.6,
  },
  {
    id: 'weight-of-a-read',
    say: "Head zero compares its query with both keys. Two, zero lines up with the blue key. The dot products are two and zero. Divide by the square root of the key width, then apply softmax. That's why blue gets about eighty percent.",
    hold: 0.9,
  },
  {
    id: 'second-query',
    say: "Now look at head one's query. Zero, two. Keep your eye on the keys. Which band should come through wider this time?",
    hold: 1.7,
  },
  {
    id: 'second-pull',
    say: "There goes the coral. It gets about eighty percent of this head's weight. Trace both coral bands back to the cache. Each head gives a different weight to the very same value.",
    hold: 1.4,
  },
  {
    id: 'whole-layer',
    say: "Here's the rest of the layer. Heads zero through three share the history we just read. The other four share a second history. When the next token arrives, how many new key and value pairs will the cache need?",
    hold: 1.4,
  },
  {
    id: 'append',
    say: "One pair lands in each group. Two pairs for eight query heads. At this width and sequence length, grouped-query attention uses a quarter of the raw cache you'd need with a separate pair for every head.",
    hold: 2.3,
  },
];

const heads = QUERY_VECTORS.map((query, index) => {
  const group = kvGroupForQuery(index);
  const dots = KV_KEYS[group].map(key => dot(query, key));
  const scores = dots.map(score => score / Math.sqrt(query.length));
  const weights = softmax(scores);
  const output = KV_VALUES[group][0].map((_, coordinate) =>
    weights.reduce((sum, weight, token) => sum + weight * KV_VALUES[group][token][coordinate], 0));
  return { index, query, group, dots, scores, weights, output };
});

const groups = KV_KEYS.map((_, g) => heads.filter(head => head.group === g));
const vector = (v, places = 0) => '[' + v.map(x => x.toFixed(places)).join(', ') + ']';
const rawBytes = (tokens, kvHeads) => cacheBytes({
  layers: 1, batch: 1, tokens, kvHeads, width: KV_KEYS[0][0].length, bytes: 2,
});
const savingFactor = rawBytes(3, HEADS.mhaKV) / rawBytes(3, groups.length);
const ink = '#262438';
const graphite = '#5b5869';
const paper = '#f4f1f3';
const colors = [
  { mid: '#3856c0', light: '#6b87dd', shade: '#253c91', edge: '#1e2f71' },
  { mid: '#de6a4c', light: '#f79a78', shade: '#ba4d38', edge: '#883629' },
  { mid: '#e5b74e', light: '#fad783', shade: '#cca047', edge: '#8c6c2c' },
];

const clamp = x => Math.min(1, Math.max(0, x));
const ease = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

function text(ctx, value, x, y, size, family = 'Sans', color = ink, weight = 400, align = 'left') {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
}

function polygon(ctx, coords, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(...coords[0]);
  for (const point of coords.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fill();
}

function line(ctx, x, y, endX, endY, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

function backdrop(ctx) {
  const light = ctx.createLinearGradient(80, 16, 1600, 1330);
  light.addColorStop(0, '#faf9f5');
  light.addColorStop(0.6, paper);
  light.addColorStop(1, '#e6e4ee');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 1920, 1080);
}

function slab(ctx, x, y, w, h, palette, depth = 14) {
  polygon(ctx, [[x, y + h], [x + w, y + h], [x + w + depth, y + h + depth],
    [x + depth, y + h + depth]], palette.edge);
  polygon(ctx, [[x + w, y], [x + w + depth, y + depth], [x + w + depth, y + h + depth],
    [x + w, y + h]], palette.shade);
  const sheen = ctx.createLinearGradient(x, y, x + w, y + h);
  sheen.addColorStop(0, palette.light);
  sheen.addColorStop(0.32, palette.mid);
  sheen.addColorStop(1, palette.mid);
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, w, h);
}

const bandHeight = 142;
const rowY = [326, 640];
const ribbonStart = 485;
const ribbonEnd = 1780;

// The two flows for a given output occupy adjacent intervals of its unit-height strip.
function ribbonEdges(headIndex, token, t) {
  const weight = heads[headIndex].weights[token];
  const sourceOffset = headIndex === 0 ? 0 : heads[0].weights[token];
  const destinationOffset = token === 0 ? 0 : heads[headIndex].weights[0];
  const from = rowY[token] + sourceOffset * bandHeight;
  const to = rowY[headIndex] + destinationOffset * bandHeight;
  const bend = ease((t - 0.07) / 0.7);
  const lift = -62 * Math.sin(bend * Math.PI);
  const top = mix(from, to, bend) + lift;
  return [top, top + weight * bandHeight];
}

function trace(ctx, head, token, extent) {
  if (extent <= 0) return;
  const palette = colors[token];
  const far = clamp(extent);
  const slices = Math.ceil(far * 70);
  const upper = [], lower = [];
  for (let i = 0; i <= slices; i++) {
    const t = far * i / slices;
    const [top, bottom] = ribbonEdges(head, token, t);
    const x = mix(ribbonStart, ribbonEnd, t);
    upper.push([x, top]);
    lower.push([x, bottom]);
  }
  const outline = [...upper, ...lower.reverse()];
  ctx.save();
  ctx.shadowColor = 'rgba(33,25,57,0.20)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 8;
  const sheen = ctx.createLinearGradient(ribbonStart, 0, ribbonEnd, 0);
  for (const [stop, color] of [[0, palette.shade], [0.18, palette.mid], [0.37, palette.light],
    [0.58, palette.mid], [0.7, palette.shade], [0.84, palette.mid], [1, palette.mid]]) {
    sheen.addColorStop(stop, color);
  }
  polygon(ctx, outline, sheen);
  ctx.restore();

  // The longitudinal ribs remain attached to their value as it crosses the other strip.
  const ribs = Math.max(1, Math.round(12 * heads[head].weights[token]));
  for (let r = 0; r < ribs; r++) {
    const fraction = (r + 0.5) / ribs;
    ctx.beginPath();
    for (let i = 0; i <= slices; i++) {
      const t = far * i / slices;
      const [top, bottom] = ribbonEdges(head, token, t);
      const x = mix(ribbonStart, ribbonEnd, t);
      const y = mix(top, bottom, fraction);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineWidth = token === 0 ? 1.8 : 2.3;
    ctx.strokeStyle = token === 0 ? 'rgba(227,237,255,0.35)' : 'rgba(255,236,212,0.50)';
    ctx.stroke();
  }
}

function cacheRow(ctx, token, emphasizeValue, emphasizeKey) {
  const y = rowY[token], x = 104, width = 390;
  text(ctx, 'Token ' + (token + 1), x, y - 25, 43, 'Serif');
  slab(ctx, x, y, width, bandHeight, colors[token]);
  const cols = [x + 19, x + 215];
  line(ctx, x + 195, y + 14, x + 195, y + bandHeight - 14, '#ffffff70');
  for (const [col, name, arr, accent] of [
    [cols[0], 'Key', KV_KEYS[0][token], emphasizeKey],
    [cols[1], 'Value', KV_VALUES[0][token], emphasizeValue],
  ]) {
    text(ctx, name, col, y + 46, 31, 'Sans', '#ffffff');
    text(ctx, vector(arr), col, y + 107, 37, 'Mono', '#ffffff');
    if (accent > 0) {
      ctx.save();
      ctx.globalAlpha *= accent;
      line(ctx, col, y + 121, col + 134, y + 121, '#fff8e6', 5);
      ctx.restore();
    }
  }
}

function headLabel(ctx, i, showQuery, fill) {
  const y = rowY[i], x = 1377;
  text(ctx, 'Head ' + i, x, y - 27, 47, 'Serif');
  if (showQuery) text(ctx, 'q ' + vector(heads[i].query), 1812, y - 27, 34, 'Mono', ink, 400, 'right');
  if (fill < 0.99) return;
  const dominant = heads[i].weights[i];
  const top = i === 0 ? y : y + bandHeight * heads[i].weights[0];
  ctx.fillStyle = colors[i].shade;
  ctx.fillRect(1570, top + (dominant * bandHeight - 60) / 2, 183, 60);
  text(ctx, Math.round(100 * dominant) + '%', 1661, top + dominant * bandHeight / 2 + 16,
    46, 'Mono', '#ffffff', 500, 'center');
  text(ctx, vector(heads[i].output, 3), 1783, y + bandHeight + 61, 38, 'Mono', ink, 400, 'right');
}

function detail(ctx, clock) {
  const { index, elapsed } = clock;
  const a = index === 0 ? ease((elapsed + 0.23) / 2.25) : 1;
  const b = index < 4 ? 0 : index === 4 ? ease((elapsed + 0.05) / 1.85) : 1;
  // Cut in on the stored operands. The right edge of the shot follows each value
  // into its strip, leaving the query registers out of the close-up.
  ctx.save();
  if (index === 1) {
    ctx.translate(-66, -250);
    ctx.scale(1.54, 1.54);
  } else {
    text(ctx, 'KV group 0', 100, 153, 75, 'Serif');
    text(ctx, 'Query heads', 1374, 153, 62, 'Serif');
  }
  for (const i of [0, 1]) {
    const y = rowY[i];
    ctx.fillStyle = '#e5e2e8';
    ctx.fillRect(1374, y, ribbonEnd - 1374, bandHeight);
    line(ctx, ribbonEnd + 3, y - 5, ribbonEnd + 3, y + bandHeight + 5, '#aaa6b1', 3);
  }
  trace(ctx, 0, 1, a);
  trace(ctx, 1, 0, b);
  trace(ctx, 0, 0, a);
  trace(ctx, 1, 1, b);

  const hiKey = index === 2 ? clock.reveal('both keys') : index === 3 ? clock.reveal('keys') : 0;
  for (const token of [0, 1]) {
    const hiVal = index === 1 ? clock.reveal(token === 0 ? 'Its value' : 'Coral carries') : 0;
    cacheRow(ctx, token, hiVal, hiKey);
  }
  headLabel(ctx, 0, index >= 2, a);
  headLabel(ctx, 1, index >= 3, b);

  if (index === 2 && clock.reveal('dot products') > 0) {
    const scaled = clock.reveal('Divide by the square root');
    const scores = scaled > 0.5 ? heads[0].scores : heads[0].dots;
    text(ctx, scaled > 0.5 ? 'After division by √2' : 'Dot products', 710, 733, 36, 'Sans', graphite);
    text(ctx, scores[0].toFixed(scaled > 0.5 ? 3 : 0), 710, 805, 52, 'Mono', colors[0].shade);
    text(ctx, scores[1].toFixed(0), 948, 805, 52, 'Mono', colors[1].edge);
  }
  ctx.restore();
}

function groupThreads(ctx, group, y) {
  const headY = y + 74;
  const neutral = { light: '#aca5bc', mid: '#77728c', shade: '#534e6a', edge: '#434052' };
  // The common edge stays connected while the third token's space fills.
  const bed = ctx.createLinearGradient(0, y + 130, 0, y + 157);
  bed.addColorStop(0, '#a7a2b5');
  bed.addColorStop(1, '#cdc9d6');
  polygon(ctx, [[310, y + 128], [1060, y + 128], [1087, y + 143], [1063, y + 157],
    [330, y + 157]], bed);
  for (const [i] of groups[group].entries()) {
    const x = 1255 + i * 135, w = 108, top = headY - 54;
    ctx.beginPath();
    const outlet = y + 132 + i * 6;
    ctx.moveTo(1060, outlet);
    ctx.bezierCurveTo(1140, outlet, x + w / 2, outlet + 64 * i / 3, x + w / 2, top + 96);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#878198';
    ctx.stroke();
  }
  groups[group].forEach((head, i) => {
    const x = 1255 + i * 135, w = 108, top = headY - 54;
    slab(ctx, x, top, w, 98, neutral, 8);
    text(ctx, 'Q' + head.index, x + w / 2, top + 65, 43, 'Mono', '#fff', 500, 'center');
  });
}

function cachePair(ctx, x, y, token, active) {
  const width = 225, height = 131;
  ctx.save();
  if (active < 1) {
    ctx.strokeStyle = '#a7a1af';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
    ctx.setLineDash([]);
  }
  if (active > 0) {
    ctx.globalAlpha *= clamp(active * 2.2);
    ctx.translate(0, -58 * (1 - active));
    slab(ctx, x, y, width, height, colors[token], 12);
    const color = token === 2 ? '#4a3410' : '#fff';
    line(ctx, x + width / 2, y + 14, x + width / 2, y + height - 14,
      token === 2 ? '#4a341065' : '#ffffff88');
    text(ctx, 'K', x + width / 4, y + 84, 52, 'Mono', color, 400, 'center');
    text(ctx, 'V', x + width * 0.75, y + 84, 52, 'Mono', color, 400, 'center');
  }
  ctx.restore();
}

function layer(ctx, clock) {
  const { index, elapsed } = clock;
  const pending = index === 6 || clock.reveal('next token arrives') > 0;
  const arriving = index === 6 ? ease((elapsed + 0.08) / 1.2) : 0;
  text(ctx, 'KV cache', 100, 153, 75, 'Serif');
  text(ctx, 'Query heads', 1250, 153, 62, 'Serif');
  const xs = [316, 572, 828];
  xs.forEach((x, t) => {
    if (t < 2 || pending) text(ctx, 'Token ' + (t + 1), x + 112, 265, 40, 'Serif', ink, 400, 'center');
  });
  groups.forEach((_, g) => {
    const y = 321 + g * 270;
    groupThreads(ctx, g, y);
    text(ctx, 'Group ' + g, 101, y + 78, 44, 'Serif');
    xs.forEach((x, t) => {
      if (t < 2 || pending) cachePair(ctx, x, y, t, t < 2 ? 1 : arriving);
    });
  });
  if (index === 6 && clock.reveal('At this width') > 0) {
    text(ctx, 'Raw KV cache', 103, 908, 38, 'Sans', graphite);
    const unit = 68;
    for (let i = 0; i < HEADS.mhaKV; i++) {
      ctx.fillStyle = i < groups.length ? '#47435e' : '#d3cfd9';
      ctx.fillRect(421 + unit * i, 864, unit - 5, 53);
    }
    text(ctx, '1/' + savingFactor + ' of multi-head', 1008, 909, 43, 'Mono');
  }
}

function draw(ctx, clock) {
  backdrop(ctx);
  if (clock.index < 5) detail(ctx, clock);
  else layer(ctx, clock);
}

function check() {
  assert.deepEqual(groups.map(group => group.map(head => head.index)), [[0, 1, 2, 3], [4, 5, 6, 7]]);
  assert.deepEqual(heads.slice(0, 2).map(head => head.dots), [[2, 0], [0, 2]]);
  assert.ok(Math.abs(heads[0].scores[0] - Math.SQRT2) < 1e-12);
  assert.deepEqual(heads.slice(0, 2).map(h => vector(h.output, 3)), ['[0.804, 0.196]', '[0.196, 0.804]']);
  for (const i of [0, 1]) {
    const weights = heads[i].weights;
    assert.ok(Math.abs(weights[0] + weights[1] - 1) < 1e-12);
    assert.ok(Math.abs(heads[0].weights[i] + heads[1].weights[i] - 1) < 1e-12);
    const [top, split] = ribbonEdges(i, 0, 1);
    const [next, bottom] = ribbonEdges(i, 1, 1);
    assert.ok(Math.abs(split - next) < 1e-10 && Math.abs(bottom - top - bandHeight) < 1e-10);
  }
  assert.equal(rawBytes(3, groups.length) - rawBytes(2, groups.length), 16);
  assert.equal(rawBytes(3, HEADS.mhaKV) - rawBytes(2, HEADS.mhaKV), 64);
  assert.equal(savingFactor, 4);
}

export default { title: 'Two reads of the same cache', beats, draw, check };
