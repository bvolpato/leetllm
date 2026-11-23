import assert from 'node:assert/strict';

// The four comparisons and value vectors come from the lesson's two-tile example.
const keys = [
  { score: 1, value: [10, 0] },
  { score: 2, value: [0, 10] },
  { score: 3, value: [5, 5] },
  { score: 0, value: [9, 1] },
];
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const mix = (a, b, t) => a + (b - a) * t;
const unit = (t) => Math.max(0, Math.min(1, t));
const ease = (t) => t * t * (3 - 2 * t);
const dec = (n) => n.toFixed(3);
const span = sum(keys[0].value);

function summarise(rows) {
  const max = Math.max(...rows.map((row) => row.score));
  const weights = rows.map((row) => Math.exp(row.score - max));
  const mass = sum(weights);
  const numerator = [0, 1].map((d) => sum(rows.map((row, i) => row.value[d] * weights[i])));
  return { max, weights, mass, numerator };
}

const first = summarise(keys.slice(0, 2));
const last = summarise(keys.slice(2));
const max = Math.max(first.max, last.max);
const oldScale = Math.exp(first.max - max);
const incomingScale = Math.exp(last.max - max);
const mass = oldScale * first.mass + incomingScale * last.mass;
const numerator = first.numerator.map((v, d) => v * oldScale + last.numerator[d] * incomingScale);
const output = numerator.map((v) => v / mass);

// A separate all-at-once calculation supplies the comparison mark in the last shot.
const exps = keys.map(({ score }) => Math.exp(score));
const probabilities = exps.map((w) => w / sum(exps));
const dense = [0, 1].map((d) => sum(keys.map(({ value }, j) => probabilities[j] * value[d])));

const beats = [
  {
    id: 'two-slots',
    say: 'Two keys arrive together. The query at the left scores them one and two. The next pair needs those same slots. What should we keep before we clear them?',
    hold: 1.0,
  },
  {
    id: 'make-weights',
    say: 'Each key brings a value with two coordinates. The first is all blue, the second all orange. To get their weights, subtract the largest score from each score and exponentiate. Two gets a weight of one. One gets about a third.',
    hold: 0.55,
  },
  {
    id: 'keep-the-areas',
    say: 'Stack the colors. Each layer is as tall as its weight. A colored width times that height gives the weighted contribution of one coordinate. Watch the seam straighten. The height still gives us the total weight. Each color keeps its area, the sum of its weighted contributions.',
    hold: 0.65,
  },
  {
    id: 'clear-the-slots',
    say: 'Let the first pair go. Its scores disappear. The maximum, the height, and both colored areas stay beside the query. Here comes the second pair. Look at its top score.',
    hold: 1.0,
  },
  {
    id: 'change-of-scale',
    say: 'Three. The blue and orange still carry the first pair. Watch them get shorter. Moving the maximum from two to three subtracts one more from each old exponent. That multiplies the old weight sum and both weighted value sums by the same factor.',
    hold: 0.75,
  },
  {
    id: 'add-the-second-pair',
    say: 'Add the new values on that scale. The key that scored three adds a full layer, half blue and half orange. The zero adds just a sliver. Pool the layers again. All four keys have contributed.',
    hold: 0.75,
  },
  {
    id: 'read-the-widths',
    say: 'Clear the slots. To read out the answer, divide each colored area by the common height. That gives you its width. Blue spans four point three eight units and orange spans five point six two.',
    hold: 0.7,
  },
  {
    id: 'same-seam',
    say: 'Slide the result from all four scores underneath. See where the seams meet? Both answers agree to three decimal places. FlashAttention writes that vector back to memory. Each pair of scores can disappear as soon as its tile has contributed.',
    hold: 2.2,
  },
];

const ink = '#2e2146';
const muted = '#5b4a65';
const pale = '#fffaef';
const plot = { x: 1028, w: 615, base: 728, unitHeight: 181 };

function type(ctx, s, x, y, size, color = ink, family = 'Sans', align = 'left', weight = 500) {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(String(s), x, y);
}

function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

function path(ctx, points, fill, stroke, width = 1) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const pt of points.slice(1)) ctx.lineTo(...pt);
  if (fill) {
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function gradient(ctx, x, y, xx, yy, stops) {
  const g = ctx.createLinearGradient(x, y, xx, yy);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

function plate(ctx, x, y, w, h, chamfer, fill, edge) {
  const c = chamfer;
  path(ctx, [[x + c, y], [x + w, y], [x + w, y + h - c], [x + w - c, y + h],
    [x, y + h], [x, y + c]], fill, edge);
}

function wafer(ctx) {
  const bed = gradient(ctx, 0, -150, 1480, 1310, [
    [0, '#b3a4da'], [0.29, '#e8daed'], [0.52, '#f4e8db'], [0.81, '#d5bccc'], [1, '#b09abe'],
  ]);
  rect(ctx, -1400, -900, 4800, 3000, bed);

  // Cropped combs and parallel metal runs give the fixed aperture its die-scale setting.
  for (const y of [-46, 966]) {
    for (let x = -400; x < 2300; x += 187) {
      plate(ctx, x, y, 172, 127, 16, '#b7a5c3', '#917eaa');
      for (let finger = 0; finger < 14; finger++) {
        const dx = x + 12 + finger * 10.5;
        rect(ctx, dx, y + 12 + (finger % 2) * 13, 6.4, 90, '#8e7d9f');
        rect(ctx, dx + 1.2, y + 14 + (finger % 2) * 13, 2, 87, '#dac9df');
      }
    }
  }
  for (let i = 0; i < 10; i++) {
    const y = 70 + i * 5;
    const turn = 535 + i * 8;
    path(ctx, [[-500, y], [turn, y], [turn + 42, y + 42], [2000, y + 42]], null, '#aa97b6', 2);
    path(ctx, [[-500, y + 1.6], [turn, y + 1.6], [turn + 42, y + 43.6], [2000, y + 43.6]], null, '#f8e9f0', 1.5);
    path(ctx, [[-500, 918 + i * 4.5], [1185 + i * 6, 918 + i * 4.5],
      [1222 + i * 6, 955 + i * 4.5], [2200, 955 + i * 4.5]], null, '#b19bb4', 2);
  }
  for (let i = 0; i < 19; i++) {
    const y = 218 + i * 33;
    rect(ctx, 28, y, 18, 14, '#b9a7bd');
    rect(ctx, 30, y + 2, 7, 7, '#f8e7e8');
    rect(ctx, 1886, y, 18, 14, '#b9a7bd');
    rect(ctx, 1888, y + 2, 7, 7, '#f8e7e8');
  }
}

// Each rectangle is ten units wide. Its two areas encode the numerator coordinates.
function bands(ctx, x, bottom, width, height, split) {
  if (height < 0.01) return;
  const top = bottom - height;
  const seam = x + width * split;
  const xFill = gradient(ctx, x, top, x + width * 0.15, bottom, [[0, '#46b5dc'], [0.65, '#218cbf'], [1, '#1678ab']]);
  const yFill = gradient(ctx, x, top, x + width * 0.15, bottom, [[0, '#ffa46c'], [0.65, '#ed8357'], [1, '#de6949']]);
  rect(ctx, x, top, seam - x, height, xFill);
  rect(ctx, seam, top, x + width - seam, height, yFill);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, top, seam - x, height);
  ctx.clip();
  for (let pos = x + 5; pos < seam; pos += 13) {
    rect(ctx, pos, top, 1.4, height, 'rgba(234,255,255,0.23)');
  }
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.rect(seam, top, x + width - seam, height);
  ctx.clip();
  for (let pos = seam - height; pos < x + width; pos += 15) {
    path(ctx, [[pos, bottom], [pos + height, top]], null, 'rgba(255,237,211,0.2)', 1.6);
  }
  ctx.restore();
  if (split > 0 && split < 1) rect(ctx, seam - 1.5, top, 3, height, '#3d3652');
  rect(ctx, x, top, width, Math.min(2, height), '#ffffff91');
}

const gates = (clock) => (index, phrase, duration) => {
  if (clock.index !== index) return Number(clock.index > index);
  return ease(clock.reveal(phrase, duration));
};

function sample(clock) {
  const cue = gates(clock);
  const firstEntry = mix(0.28, 1, cue(0, 'Two keys arrive', 1.65));
  const firstExit = cue(3, 'Let the first pair go', 1.05);
  const secondEntry = cue(3, 'Here comes the second pair', 1.15);
  const secondExit = cue(6, 'Clear the slots', 0.95);
  const rescale = cue(4, 'Watch them get shorter', 1.25);
  const layers = [
    { height: first.weights[0] * cue(2, 'Stack the colors', 0.75), width: keys[0].value[0] },
    { height: first.weights[1] * cue(2, 'Each layer', 0.9), width: keys[1].value[0] },
  ];
  const mergeFirst = cue(2, 'Watch the seam straighten', 1.3);
  const factor = mix(1, oldScale, rescale);
  const firstWidth = first.numerator[0] / first.mass;
  for (const layer of layers) {
    layer.width = mix(layer.width, firstWidth, mergeFirst);
    layer.height *= factor;
  }
  if (mergeFirst === 1) layers.splice(0, 2, { height: first.mass * factor, width: firstWidth });
  const third = cue(5, 'The key that scored three', 1.05);
  const fourth = cue(5, 'The zero adds', 0.75);
  layers.push(
    { height: third * last.weights[0] * incomingScale, width: keys[2].value[0] },
    { height: fourth * last.weights[1] * incomingScale, width: keys[3].value[0] },
  );
  const mergeSecond = cue(5, 'Pool the layers', 1.4);
  for (const layer of layers) layer.width = mix(layer.width, output[0], mergeSecond);
  if (mergeSecond === 1) layers.splice(0, layers.length, { height: mass, width: output[0] });

  return {
    firstEntry, firstExit, secondEntry, secondExit, layers, rescale,
    firstScored: cue(0, 'The query at the left', 0.65),
    secondScored: cue(3, 'Look at its top score', 0.6),
    showWeights: cue(1, 'subtract the largest score', 0.6),
    open: cue(2, 'Stack the colors', 1.30),
    areaLabels: cue(2, 'Each layer', 0.6),
    inspectScale: cue(4, 'Three', 1.55) * (1 - cue(5, 'Add the new values', 1.4)),
    ghost: rescale * (1 - third),
    normalize: cue(6, 'divide each colored area', 1.4),
    readWidths: cue(6, 'That gives you its width', 0.55),
    compare: cue(7, 'Slide the result', 1.3),
  };
}

function windowSlot(ctx, s) {
  type(ctx, 'On-chip window', 99, 267, 69, ink, 'Serif');
  type(ctx, 'Key / value', 320, 353, 36);
  type(ctx, 'Score', 796, 353, 36, ink, 'Sans', 'center');

  const x = 307, y = 382, w = 360, h = 297;
  plate(ctx, x - 9, y - 9, w + 18, h + 18, 14, '#9581a2', '#8b7795');
  rect(ctx, x, y, w, h, '#51455e');
  for (let i = 0; i < 16; i++) {
    rect(ctx, x + 10 + 22 * i, y, 2.5, h, '#6c5e76');
    rect(ctx, x + 13 + 22 * i, y, 1, h, '#312b41');
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  function tile(start, position) {
    const top = y + position * (h + 16);
    if (top >= y + h || top + h <= y) return;
    plate(ctx, x + 3, top, w - 6, h, 15, '#3b304c', '#20192f');
    keys.slice(start, start + 2).forEach(({ value }, i) => {
      const row = top + 5 + i * 146;
      const sheen = gradient(ctx, x, row, x + w, row + 148,
        [[0, '#f1e5f2'], [0.35, '#e5d8e8'], [0.78, '#f7e8df'], [1, '#d4c6d9']]);
      plate(ctx, x + 7, row, w - 14, 141, 10, sheen, '#b9a3b7');
      type(ctx, 'K' + (start + i), x + 23, row + 59, 46, ink, 'Mono');
      type(ctx, '[' + value.join(', ') + ']', x + w - 27, row + 59, 39, ink, 'Mono', 'right');
      bands(ctx, x + 24, row + 119, w - 48, 36, value[0] / span);
    });
  }
  tile(0, s.firstEntry - 1 + s.firstExit);
  tile(2, s.secondEntry - 1 + s.secondExit);
  ctx.restore();

  // The query contact stays fixed as both loads cross its fork.
  for (const cy of [453, 606]) {
    path(ctx, [[242, 529], [263, 529], [288, cy], [304, cy]], null, '#b4a0b8', 12);
    path(ctx, [[242, 526], [261, 526], [286, cy - 3], [304, cy - 3]], null, '#f1d6aa', 5);
  }
  const gold = gradient(ctx, 98, 450, 256, 601, [[0, '#fff5c8'], [0.56, '#eac789'], [1, '#c79572']]);
  plate(ctx, 94, 449, 159, 168, 22, '#aa8b91', '#917588');
  plate(ctx, 91, 442, 159, 165, 22, gold, '#ac9081');
  type(ctx, 'q', 169, 527, 83, ink, 'Serif', 'center');
  type(ctx, 'query', 169, 582, 34, ink, 'Sans', 'center');

  const inSecond = s.secondEntry > 0;
  const rows = inSecond ? keys.slice(2) : keys.slice(0, 2);
  const visible = inSecond ? s.secondScored * (1 - s.secondExit) : s.firstScored * (1 - s.firstExit);
  rows.forEach(({ score }, i) => {
    const sy = y + i * 149;
    path(ctx, [[x + w + 9, sy + 72], [703, sy + 72]], null, '#bca8bb', 7);
    plate(ctx, 708, sy, 173, 144, 11, '#483c57', '#7c698d');
    plate(ctx, 715, sy + 7, 159, 130, 7, '#3a304a');
    if (visible > 0) {
      ctx.save();
      ctx.globalAlpha *= visible;
      type(ctx, score, 793, sy + 83, 72, pale, 'Mono', 'center');
      if (s.showWeights && (!inSecond || s.rescale === 1)) {
        ctx.globalAlpha *= s.showWeights;
        const w = Math.exp(score - (inSecond ? max : first.max));
        type(ctx, 'w ' + dec(w), 794, sy + 125, 27, '#e7d7f1', 'Mono', 'center');
      }
      ctx.restore();
    }
  });
  const formulaAlpha = inSecond ? s.rescale * (1 - s.secondExit) : s.showWeights * (1 - s.firstExit);
  if (formulaAlpha > 0) {
    ctx.save();
    ctx.globalAlpha *= formulaAlpha;
    type(ctx, 'w = exp(score − ' + (inSecond ? max : first.max) + ')', 308, 755, 39, muted, 'Mono');
    ctx.restore();
  }
}

function drawSummary(ctx, s) {
  const { x, w, unitHeight } = plot;
  const weight = sum(s.layers.map((layer) => layer.height));
  const sums = [0, 1].map((d) => sum(s.layers.map(({ height, width }) => height * (d ? span - width : width))));
  const n = s.normalize;
  const base = plot.base - n * 24;
  const renderedHeight = mix(unitHeight, unitHeight / mass, n);
  const top = base - weight * renderedHeight;
  ctx.save();
  ctx.globalAlpha *= Math.abs(2 * n - 1);
  type(ctx, n < 0.5 ? 'Row summary' : 'Output row', x, mix(267, 395, n), 70, ink, 'Serif');
  ctx.restore();

  if (n < 1) {
    ctx.save();
    ctx.globalAlpha *= 1 - n;
    type(ctx, 'Maximum', x, 356, 37);
    const m = s.rescale > 0 ? max : first.max;
    type(ctx, s.showWeights ? m : '·', x + 211, 360, 58, ink, 'Mono');
    if (s.ghost > 0) {
      const oldTop = base - first.mass * unitHeight;
      ctx.save();
      ctx.globalAlpha *= s.ghost;
      ctx.setLineDash([9, 8]);
      ctx.strokeStyle = '#857089';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, oldTop, w, first.mass * unitHeight);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha *= s.ghost;
      const scaleLabel = 'exp(' + first.max + ' − ' + max + ') ≈ ' + dec(oldScale);
      type(ctx, scaleLabel, x + w / 2, oldTop - 18, 37, ink, 'Mono', 'center');
      ctx.restore();
    }
    ctx.restore();
  }
  if (n > 0) {
    ctx.save();
    ctx.globalAlpha *= n;
    type(ctx, '[' + numerator.map(dec).join(', ') + '] ÷ ' + dec(mass), x, 460, 42, ink, 'Mono');
    ctx.restore();
  }

  let cursor = base;
  for (const layer of s.layers) {
    const h = layer.height * renderedHeight;
    bands(ctx, x, cursor, w, h, layer.width / span);
    cursor -= h;
  }
  rect(ctx, x - 8, base, w + 16, 5, '#55475e');
  rect(ctx, x - 8, base + 5, w + 16, 2, '#fbf1ea');

  if (weight > 0 && n < 1) {
    ctx.save();
    ctx.globalAlpha *= (1 - n) * s.areaLabels;
    const bx = x + w + 14;
    path(ctx, [[bx, top], [bx + 13, top], [bx + 13, base], [bx, base]], null, muted, 3);
    const mid = Math.min(base - 26, (top + base) / 2);
    type(ctx, 'weight', bx + 30, mid - 4, 32, muted);
    type(ctx, dec(weight), bx + 30, mid + 42, 40, ink, 'Mono');
    type(ctx, 'Weighted sum', x, 812, 35);
    type(ctx, '[' + sums.map(dec).join(', ') + ']', x + 282, 812, 39, ink, 'Mono');
    ctx.restore();
  }
  if (s.readWidths > 0) {
    ctx.save();
    ctx.globalAlpha *= s.readWidths;
    const seam = x + w * output[0] / span;
    const labelY = (top + base) / 2 + 17;
    type(ctx, dec(output[0]), (x + seam) / 2, labelY, 48, pale, 'Mono', 'center', 600);
    type(ctx, dec(output[1]), (seam + x + w) / 2, labelY, 48, ink, 'Mono', 'center', 600);
    type(ctx, 'Two tiles', x, top - 20, 34, ink);
    if (s.compare > 0) {
      const by = base + mix(90, 33, s.compare);
      ctx.globalAlpha *= s.compare;
      bands(ctx, x, by + 14, w, 22, dense[0] / span);
      path(ctx, [[seam, base + 1], [seam, by + 24]], null, ink, 3);
      type(ctx, 'All four scores at once', x, by + 64, 34, ink);
    }
    ctx.restore();
  }
}

function draw(ctx, clock) {
  const s = sample(clock);
  // Pull out when the accumulated areas need the frame. Move in to compare the final seams.
  const zoom = mix(1.78, 1, s.open) + 0.65 * s.inspectScale + 1.10 * s.normalize;
  const focusX = mix(490, 960, s.open) + 517 * s.inspectScale + 400 * s.normalize;
  const focusY = mix(484, 528, s.open) + 55 * s.normalize;
  ctx.save();
  ctx.translate(960, 540);
  ctx.scale(zoom, zoom);
  ctx.translate(-focusX, -focusY);
  wafer(ctx);
  windowSlot(ctx, s);
  if (s.open > 0) {
    ctx.save();
    ctx.globalAlpha *= s.open;
    drawSummary(ctx, s);
    ctx.restore();
  }
  ctx.restore();
}

function check() {
  const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-11, actual + ' != ' + expected);
  keys.forEach(({ value }) => close(sum(value), span));
  assert.deepEqual([first.max, max], [2, 3]);
  close(oldScale, 1 / Math.E);
  close(oldScale * first.mass, Math.exp(1 - max) + Math.exp(2 - max));
  for (const d of [0, 1]) {
    close(output[d], dense[d]);
    close(numerator[d], sum(keys.map(({ score, value }) => Math.exp(score - max) * value[d])));
  }
  assert.deepEqual(output.map(dec), ['4.380', '5.620']);
  // Straightening a seam and discarding a tile must conserve each color's area.
  const state = (index, reveal) => sample({ index, reveal });
  function checkAreas(s, expectedMass, expectedAreas) {
    close(sum(s.layers.map((l) => l.height)), expectedMass);
    close(sum(s.layers.map((l) => l.height * l.width)), expectedAreas[0]);
    close(sum(s.layers.map((l) => l.height * (span - l.width))), expectedAreas[1]);
  }
  for (const progress of [0, 0.37, 1]) {
    checkAreas(state(2, (phrase) => phrase === 'Watch the seam straighten' ? progress : 1), first.mass, first.numerator);
    checkAreas(state(5, (phrase) => phrase === 'Pool the layers' ? progress : 1), mass, numerator);
  }
  checkAreas(state(3, () => 1), first.mass, first.numerator);
  checkAreas(state(4, () => 1), first.mass * oldScale, first.numerator.map((v) => v * oldScale));
}

export default { title: 'FlashAttention Through the Memory Window', beats, draw, check };
