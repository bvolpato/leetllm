import assert from 'node:assert/strict';
import { decoderMiniature } from '../../../films/build-gpt-from-scratch-lab/arithmetic.mjs';

const title = 'Can a Tiny GPT Read Past the Comma?';
const beats = [
  {
    id: 'change-the-last-piece',
    say: 'Watch the comma. I changed the last token from a line break to the word sir. Why did the score back at the comma move?',
    hold: 1.1,
  },
  {
    id: 'read-the-line',
    say: 'Put the line break back. The script reads “Good sir,” and then a new line begins. The comma has to predict that break. We keep that target fixed for both runs.',
    hold: 0.7,
  },
  {
    id: 'light-on-four',
    say: 'In this little attention head, each lit token gets equal weight. The numbers on the floor are the first coordinates of their values. The score for a line break is their average. Zero, one, two and five give two.',
    hold: 1,
  },
  {
    id: 'turn-the-flat',
    say: 'Try sir again. Only the fourth value changes. Three takes the place of five, and the average falls to one and a half. The comma has been reading ahead.',
    hold: 1.2,
  },
  {
    id: 'cut-the-light',
    say: 'Watch the edge of the light. It stops at the comma. A causal mask gives later tokens zero attention weight. Now the head averages just zero, one and two.',
    hold: 1.1,
  },
  {
    id: 'play-both-endings',
    say: 'Try the line break. Now try sir. Both give one. Before training, put your GPT in evaluation mode. Change a later input and compare every score up through the comma. They should all stay put.',
    hold: 2.5,
  },
];

const original = '↵';
const edit = '·sir';

function run(fourth, causal) {
  const head = decoderMiniature({ fourth, causal });
  const query = head.rows[head.positionIndex];
  return {
    head,
    score: query.logits[head.outputPieces.indexOf(head.target)],
    coordinates: head.inputs.map((vector) => vector[0]),
  };
}

const cases = [false, true].map((masked) => [run(original, masked), run(edit, masked)]);

function check() {
  for (const [i, pair] of cases.entries()) {
    const [source, copy] = pair;
    const pos = source.head.positionIndex;
    assert.equal(source.head.tokens[pos], ',');
    assert.equal(source.head.tokens[pos + 1], source.head.target);
    assert.equal(copy.head.target, source.head.target);
    assert.deepEqual(copy.head.tokens.slice(0, pos + 1), source.head.tokens.slice(0, pos + 1));
    assert.notEqual(copy.head.tokens[pos + 1], source.head.tokens[pos + 1]);
    assert.deepEqual(source.coordinates, [0, 1, 2, 5]);
    assert.deepEqual(copy.coordinates, [0, 1, 2, 3]);
    for (const result of pair) {
      const weights = result.head.rows[pos].weights;
      const mean = result.coordinates.reduce((sum, value, j) => sum + value * weights[j], 0);
      assert.equal(result.score, mean);
      assert.equal(weights[3], i ? 0 : 0.25);
    }
    const prefixScores = (result) => result.head.rows.slice(0, pos + 1).map((row) => row.logits);
    if (i === 1) assert.deepEqual(prefixScores(source), prefixScores(copy));
    else assert.notDeepEqual(prefixScores(source), prefixScores(copy));
  }
  assert.deepEqual(cases.map((pair) => pair.map((r) => r.score)), [[2, 1.5], [1, 1]]);
  return true;
}

const W = 1920;
const H = 1080;
const tokenX = [456, 842, 1104, 1460];

function ease(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

function pose(clock) {
  const cue = (phrase, span) => ease(clock.reveal(phrase, span));
  let turn = 1;
  if (clock.index === 0) turn = ease(clock.elapsed / 2.9);
  if (clock.index === 1) turn = 1 - cue('Put the line break back', 1.25);
  if (clock.index === 2) turn = 0;
  if (clock.index === 3) turn = cue('Try sir again', 1.3);
  if (clock.index === 5) {
    turn = 1 - cue('Try the line break', 1) + cue('Now try sir', 1);
  }
  const shutter = clock.index < 4 ? 0 : clock.index === 4 ? cue('Watch the edge', 2.3) : 1;
  // The shutter is scenic motion. The underlying model switches between two binary masks.
  const edge = 1760 - 533 * shutter;
  const masked = edge <= tokenX[3];
  const edited = turn > 0.5;
  const pair = cases[Number(masked)];
  const numbers = clock.index < 2 ? 0 : clock.index === 2 ? cue('The numbers on the floor', 0.8) : 1;
  const fraction = clock.index < 2 ? 0 : clock.index === 2 ? cue('is their average', 0.75) : 1;
  return { turn, shutter, edge, masked, numbers, fraction, source: pair[0], copy: pair[Number(edited)] };
}

function path(ctx, points, fill, stroke, width = 1) {
  ctx.beginPath();
  for (const [i, [x, y]] of points.entries()) {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
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

function gradient(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function type(ctx, words, x, y, size, family, fill, align = 'center', style = '') {
  ctx.font = (style && style + ' ') + size + 'px "Lesson ' + family + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = fill;
  ctx.fillText(words, x, y);
}

function cyclorama(ctx) {
  rect(ctx, 0, 0, W, 605, gradient(ctx, 0, 0, 0, 605, [
    [0, '#343953'], [0.52, '#788196'], [1, '#b2a9b5'],
  ]));
  rect(ctx, 0, 558, W, 167, gradient(ctx, 0, 558, 0, 725, [
    [0, '#7d737f'], [1, '#45475d'],
  ]));
}

function light(ctx, edge) {
  // The two edges meet at the wall/floor seam, as on an actual stage.
  const wallEdge = edge - 16;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(wallEdge - 142, 0);
  ctx.lineTo(wallEdge, 558);
  ctx.lineTo(edge + 58, 725);
  ctx.lineTo(0, 725);
  ctx.closePath();
  ctx.clip();
  rect(ctx, 0, 0, W, 558, gradient(ctx, 0, 50, 0, 558, [
    [0, '#f2ba87'], [0.63, '#ffe4ad'], [1, '#f6cc92'],
  ]));
  rect(ctx, 0, 558, W, 167, gradient(ctx, 0, 558, 0, 725, [
    [0, '#e6b478'], [0.45, '#efc88d'], [1, '#c78c64'],
  ]));
  ctx.restore();
}

function floor(ctx) {
  // The floorboards recede toward one vanishing point behind the scenery.
  for (let i = -5; i <= 5; i++) {
    path(ctx, [[960 + i * 156, 558], [960 + i * 289, 725]], null, '#51374439', 2);
  }
  for (const y of [570, 595, 638, 703]) rect(ctx, 0, y, W, 2, '#53374934');
  rect(ctx, 0, 555, W, 4, '#673d4a32');
}

function curtain(ctx, mirrored) {
  ctx.save();
  if (mirrored) {
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
  }
  ctx.beginPath();
  ctx.moveTo(-10, -10);
  ctx.lineTo(593, -10);
  ctx.bezierCurveTo(504, 117, 341, 183, 167, 257);
  ctx.bezierCurveTo(147, 271, 130, 307, 125, 329);
  ctx.bezierCurveTo(133, 403, 203, 564, 185, 696);
  ctx.bezierCurveTo(131, 711, 69, 674, -10, 708);
  ctx.closePath();
  ctx.fillStyle = '#72273c';
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Folds draw together at the tie, then open at the hem.
  for (let i = 0; i < 14; i++) {
    const top = i * 47 - 40;
    const waist = 14 + i * 9;
    const bottom = i * 18 - 36;
    ctx.beginPath();
    ctx.moveTo(top, -20);
    ctx.bezierCurveTo(top - 15, 72, waist - 7, 280, waist, 325);
    ctx.bezierCurveTo(waist - 4, 417, bottom + 14, 603, bottom, 720);
    ctx.lineTo(bottom + 25, 720);
    ctx.bezierCurveTo(bottom + 23, 568, waist + 8, 405, waist + 5, 325);
    ctx.bezierCurveTo(waist + 14, 233, top + 30, 78, top + 24, -20);
    ctx.fillStyle = i % 2 ? '#4a2034' : '#913c4c';
    ctx.fill();
  }
  ctx.restore();
  const cord = [[-8, 297], [49, 310], [93, 315], [135, 310]];
  path(ctx, cord, null, '#57263a', 14);
  path(ctx, cord.map(([x, y]) => [x, y - 3]), null, '#de997c', 7);
  path(ctx, [[127, 312], [152, 332], [150, 373]], null, '#ce886d', 4);
  path(ctx, [[150, 361], [140, 386], [158, 390]], '#cb876d');
  ctx.restore();
}

function apron(ctx) {
  rect(ctx, 0, 714, W, 366, gradient(ctx, 0, 714, 0, H, [
    [0, '#542b3e'], [0.32, '#402239'], [1, '#291a2c'],
  ]));
  rect(ctx, 0, 713, W, 6, '#e0ae84');
  rect(ctx, 0, 720, W, 11, '#895561');
  rect(ctx, 0, 731, W, 7, '#311b30');
  // Thin inlaid lines follow the curve of the stage front.
  for (const y of [943, 952]) {
    ctx.beginPath();
    ctx.moveTo(-30, y - 16);
    ctx.bezierCurveTo(380, y + 22, 1480, y + 22, 1950, y - 16);
    ctx.strokeStyle = '#875363';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function standingType(ctx, word, x, size, color, depth) {
  // Offset ink layers give the flat-cut letters their visible wood edge.
  for (let d = 10; d >= 1; d -= 3) {
    type(ctx, word, x + d, 529 - d * 0.22, size, 'Serif', depth);
  }
  type(ctx, word, x, 529, size, 'Serif', color);
}

function fourthFlat(ctx, state) {
  const x = tokenX[3];
  const lit = !state.masked;
  const scaleX = Math.cos(Math.PI * state.turn);
  const w = 318;
  const y = 282;
  const h = 260;
  const edgeWidth = Math.abs(Math.sin(Math.PI * state.turn)) * 18;
  path(ctx, [[x, 17], [x, y]], null, '#5e45546a', 4);
  ellipse(ctx, x, 558, 127 * Math.abs(scaleX) + 15, 9, '#33203e46');
  ctx.save();
  ctx.translate(x, y);
  const projected = w * Math.abs(scaleX);
  rect(ctx, -projected / 2 - edgeWidth, 0, projected + edgeWidth, h + 6, lit ? '#774e46' : '#3b354b');
  ctx.scale(Math.max(0.002, Math.abs(scaleX)), 1);
  rect(ctx, -w / 2, 0, w, h, lit ? '#f7dfb0' : '#8a97ae');
  ctx.strokeStyle = lit ? '#ac8065' : '#5c647a';
  ctx.lineWidth = 3;
  ctx.strokeRect(-w / 2 + 11, 11, w - 22, h - 22);
  const token = state.copy.head.tokens[3];
  const color = lit ? '#862c42' : '#292f47';
  if (token === original) {
    // Draw a return sign with an unambiguous left-pointing head.
    path(ctx, [[61, 63], [61, 128], [-52, 128]], null, color, 15);
    path(ctx, [[-23, 94], [-60, 128], [-23, 162]], null, color, 15);
    type(ctx, 'line break', 0, 216, 41, 'Sans', color);
  } else {
    type(ctx, ' sir', 0, 187, 145, 'Serif', color);
  }
  ctx.restore();
}

function drawCoordinates(ctx, state) {
  ctx.save();
  ctx.globalAlpha = state.numbers;
  const weights = state.copy.head.attention;
  const count = weights.filter((weight) => weight > 0).length;
  state.copy.coordinates.forEach((n, i) => {
    const x = tokenX[i];
    type(ctx, String(n), x, 627, 61, 'Mono', weights[i] ? '#422b37' : '#d7d9e6');
  });
  ctx.globalAlpha *= state.fraction;
  for (let i = 1; i < count; i++) {
    type(ctx, '+', (tokenX[i - 1] + tokenX[i]) / 2, 623, 44, 'Mono', '#533540');
  }
  const left = tokenX[0] - 55;
  const right = tokenX[count - 1] + 55;
  path(ctx, [[left, 642], [right, 642]], null, '#623d40', 5);
  type(ctx, String(count), (left + right) / 2, 697, 56, 'Mono', '#422b37');
  ctx.restore();
}

function maskLabel(ctx, state) {
  if (!state.shutter) return;
  ctx.save();
  ctx.globalAlpha = state.shutter;
  const x = state.edge - 16 - 142 * (1 - 351 / 558);
  type(ctx, 'Causal mask', x - 42, 336, 44, 'Sans', '#5a3240', 'right');
  path(ctx, [[x - 34, 326], [x - 13, 326], [x, 351]], null, '#814d50', 3);
  ellipse(ctx, x, 351, 5, 5, '#814d50');
  ctx.restore();
}

function scriptPage(ctx, mark) {
  const sheet = [[480, 32], [952, 37], [951, 264], [931, 285], [476, 277]];
  path(ctx, sheet.map(([x, y]) => [x + 4, y + 8]), '#733f4d29');
  path(ctx, sheet, gradient(ctx, 500, 32, 931, 285, [[0, '#fff0ce'], [1, '#f4d5a5']]));
  path(ctx, [[931, 285], [931, 263], [951, 264]], '#ceaa83');
  rect(ctx, 488, 45, 3, 219, '#ca939145');
  type(ctx, 'Original script', 524, 89, 36, 'Sans', '#694553', 'left');
  type(ctx, 'Good sir,', 520, 166, 73, 'Serif', '#553446', 'left', 'italic');
  type(ctx, 'Speak plain.', 520, 247, 73, 'Serif', '#553446', 'left', 'italic');
  if (mark > 0) {
    ctx.save();
    ctx.globalAlpha = mark;
    path(ctx, [[845, 121], [845, 150], [803, 150]], null, '#a13c40', 6);
    path(ctx, [[818, 135], [803, 150], [818, 165]], null, '#a13c40', 6);
    ctx.restore();
  }
}

function score(ctx, value, label, x, color) {
  type(ctx, label, x, 785, 36, 'Sans', '#ecd3c1');
  type(ctx, value.toFixed(2), x, 885, 96, 'Mono', color);
}

function draw(ctx, clock) {
  const state = pose(clock);
  ctx.save();
  rect(ctx, 0, 0, W, H, '#2d2031');
  let returnMark = 0;
  if (clock.index === 1) {
    const push = ease(clock.reveal('The script reads', 1.6));
    const pull = ease(clock.reveal('We keep that target fixed', 1.35));
    const zoom = 1 + 1.85 * (push - pull);
    ctx.translate(548, 0);
    ctx.scale(zoom, zoom);
    ctx.translate(-548, 0);
    returnMark = ease(clock.reveal('and then a new line begins', 0.5)) * (1 - pull);
  }
  cyclorama(ctx);
  light(ctx, state.edge);
  floor(ctx);

  // The backcloth carries the unchanged source, just as a rehearsal script does.
  scriptPage(ctx, returnMark);

  for (let i = 0; i < 3; i++) {
    const x = tokenX[i];
    const sizes = [178, 166, 279];
    const shadowWidth = [210, 126, 49];
    ellipse(ctx, x + 17, 559, shadowWidth[i], 9, '#773f4840');
    const piece = state.copy.head.tokens[i].replace('·', ' ');
    standingType(ctx, piece, x, sizes[i], i === 2 ? '#a13c40' : '#3a273b', '#865d51');
  }
  fourthFlat(ctx, state);
  drawCoordinates(ctx, state);
  maskLabel(ctx, state);
  apron(ctx);
  curtain(ctx, false);
  curtain(ctx, true);
  type(ctx, 'Line-break score', 270, 833, 68, 'Serif', '#fff0d6', 'left');
  type(ctx, 'at the comma', 274, 887, 44, 'Sans', '#efb8af', 'left');
  score(ctx, state.source.score, 'Original', 1095, '#ffdda9');
  score(ctx, state.copy.score, 'Test copy', 1492, '#ffdda9');
  ctx.restore();
}

export default { title, beats, draw, check };
