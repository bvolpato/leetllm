import assert from 'node:assert/strict';
import {
  branchFixture, checkExpression, initialItems, stateKey, successorStates, valueLabel,
} from '../../../films/reasoning-search/arithmetic.mjs';

const deal = [6, 4, 5, 7];
const goal = 24;
const { branchA, branchB } = branchFixture();
const moves = (op, left, right) => ({ op, left, right });
const leaf = (value) => ({ leaf: value });
const sixFour = moves('×', leaf(6), leaf(4));
const fiveSeven = moves('+', leaf(5), leaf(7));
const difference = moves('-', leaf(6), leaf(4));
const finish = moves('×', difference, fiveSeven);

const playedValue = tree => Number(checkExpression(tree, deal).result);
const pairA = playedValue(sixFour);
const pairB = playedValue(fiveSeven);
const pairDifference = playedValue(difference);
const finalValue = playedValue(finish);
const examples = ['+', '÷'].map(op => ({
  op,
  result: playedValue(moves(op, sixFour, fiveSeven)),
}));

// Enumerate values after both remaining moves, including fractional intermediates.
const finalValues = new Set();
for (const pair of successorStates(branchA.items)) {
  for (const [last] of successorStates(pair)) finalValues.add(valueLabel(last.value));
}
const wins = Number(finalValues.has(String(goal)));
const candidates = [branchA, branchB].sort((a, b) => b.heuristic - a.heuristic);
function check() {
  assert.deepEqual(candidates.map(b => b.heuristic), [0.95, 0.4]);
  assert.equal(stateKey(branchA.items), stateKey(initialItems([pairA, 5, 7])));
  assert.equal(stateKey(branchB.items), stateKey(initialItems([pairB, 6, 4])));
  assert.equal(candidates.slice(0, 1).some(b => b.completion === 'solved'), false);
  assert.equal(candidates.slice(0, 2).some(b => b.completion === 'solved'), true);
  assert.equal(finalValues.size, 66);
  assert.equal(wins, 0);
  assert.deepEqual(examples.map(row => row.result), [36, 2]);
  for (const row of examples) assert(finalValues.has(String(row.result)));
  assert.equal(checkExpression(sixFour, deal).allInputsUsed, false);
  assert.equal(checkExpression(finish, deal).valid, true);
  assert.deepEqual([pairA, pairB, pairDifference, finalValue], [24, 12, 2, 24]);
}

const beats = [
  { id: 'two-loose-cards', say: 'Watch the first pair come together. Six times four makes twenty-four. But look at the five and the seven. How do you finish with just one twenty-four, using every card?', hold: 1.2 },
  { id: 'two-proposals', say: 'Each move turns two numbers into one. Suppose a model proposes these two first moves. On the left, we have the multiplication. On the right, five and seven make twelve. Which hand would you keep?', hold: 1.6 },
  { id: 'one-place', say: 'Our example scorer likes seeing the target early. It ranks the hand with twenty-four first. Give the search room to keep just one proposal.', hold: 1.0 },
  { id: 'discard', say: 'There goes the twelve. A beam width of one means only the highest-ranked move gets another turn. Let’s play out the hand we kept.', hold: 0.55 },
  { id: 'play-it-out', say: 'Five plus seven makes twelve. Add it to twenty-four and you get thirty-six. Divide twenty-four by twelve and you get two. Now try every legal way to combine those three numbers.', hold: 1.2 },
  { id: 'empty-hand', say: 'Sixty-six different final values. Every one misses. That settles this hand. What about the opening move we threw away?', hold: 1.3 },
  { id: 'second-deal', say: 'Deal the same four cards again. This time, keep both first moves. Follow the twelve. Which two cards are still free?', hold: 1.6 },
  { id: 'two-piles', say: 'Six minus four gives us two. You have a two and a twelve. How would you combine them?', hold: 1.8 },
  { id: 'all-four', say: 'Bring the piles together. Two times twelve makes twenty-four. Look under this one. Each card appears once. That was the hand the narrower search threw away.', hold: 3.0 },
];

const ink = '#222145';
const red = '#aa352c';
const ivory = '#fff2cc';
const cream = '#fff7e3';
const loop = Math.PI * 2;
const clamp = x => Math.min(1, Math.max(0, x));
const mix = (a, b, t) => a + (b - a) * t;
function ease(x) {
  const p = clamp(x);
  return p * p * (3 - 2 * p);
}
const portion = (p, a, b) => ease((p - a) / (b - a));

function rect(ctx, x, y, w, h, r, color, border, width = 1) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (color) { ctx.fillStyle = color; ctx.fill(); }
  if (border) { ctx.strokeStyle = border; ctx.lineWidth = width; ctx.stroke(); }
}
function line(ctx, x1, y1, x2, y2, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
function lettering(ctx, text, x, y, size, color = ink, face = 'Sans', align = 'center', weight = 'normal') {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(String(text), x, y);
}
function disk(ctx, x, y, r, color) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, loop); ctx.fillStyle = color; ctx.fill();
}
function pip(ctx, suit, x, y, size, color, inverted = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, inverted ? -size : size);
  ctx.fillStyle = color;
  ctx.beginPath();
  if (suit === 'diamond') {
    ctx.moveTo(0, -1); ctx.lineTo(.76, 0); ctx.lineTo(0, 1); ctx.lineTo(-.76, 0);
  } else if (suit === 'club') {
    for (const [cx, cy] of [[0, -.45], [-.45, .04], [.45, .04]]) {
      ctx.moveTo(cx + .52, cy); ctx.arc(cx, cy, .52, 0, loop);
    }
    ctx.moveTo(-.09, .17); ctx.quadraticCurveTo(-.10, .79, -.43, .96);
    ctx.lineTo(.43, .96); ctx.quadraticCurveTo(.10, .79, .09, .17);
  } else {
    if (suit === 'spade') ctx.scale(1, -1);
    ctx.moveTo(0, .88); ctx.bezierCurveTo(-.2, .53, -1.16, -.05, -.83, -.65);
    ctx.bezierCurveTo(-.63, -1.04, -.19, -.93, 0, -.61);
    ctx.bezierCurveTo(.24, -.98, .66, -1.01, .84, -.65);
    ctx.bezierCurveTo(1.13, -.07, .24, .54, 0, .88);
    if (suit === 'spade') {
      ctx.moveTo(-.09, -.31); ctx.quadraticCurveTo(-.09, -.78, -.41, -1);
      ctx.lineTo(.41, -1); ctx.quadraticCurveTo(.09, -.78, .09, -.31);
    }
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

const suits = { 6: 'diamond', 4: 'club', 5: 'heart', 7: 'spade' };
function card(ctx, number, x, y, angle, turnover) {
  const flip = Math.cos(Math.PI * turnover);
  ctx.save();
  ctx.translate(x, y - Math.sin(turnover * Math.PI) * 35);
  ctx.rotate(angle * Math.PI / 180);
  ctx.scale(Math.max(.018, Math.abs(flip)), 1);
  const left = -116, top = -168, w = 232, h = 336;
  ctx.save();
  ctx.shadowColor = '#17133588'; ctx.shadowOffsetX = 7; ctx.shadowOffsetY = 10; ctx.shadowBlur = 12;
  rect(ctx, left, top, w, h, 15, '#d3c2a4');
  ctx.restore();
  rect(ctx, left, top - 3, w, h, 15, cream, '#c3b599', 1.5);
  if (flip < 0) {
    rect(ctx, -105, -160, 210, 315, 9, '#a44e4a');
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    for (let k = -470; k < 360; k += 22) {
      ctx.moveTo(k, -160); ctx.lineTo(k + 215, 158);
      ctx.moveTo(k, -160); ctx.lineTo(k - 215, 158);
    }
    ctx.lineWidth = 2; ctx.strokeStyle = '#f5c797'; ctx.stroke();
    ctx.restore();
    for (const cy of [-53, 51]) {
      disk(ctx, 0, cy, 49, '#a44e4a');
      pip(ctx, 'spade', 0, cy, 33, ivory, cy > 0);
    }
  } else {
    const suit = suits[number];
    const color = ['heart', 'diamond'].includes(suit) ? red : ink;
    for (const turn of [0, Math.PI]) {
      ctx.save(); ctx.rotate(turn);
      lettering(ctx, number, -88, -131, 58, color, 'Serif');
      pip(ctx, suit, -88, -92, 11, color);
      ctx.restore();
    }
    const rows = number >= 6 ? [-86, 0, 86] : [-74, 74];
    for (const cy of rows) {
      for (const cx of [-43, 43]) pip(ctx, suit, cx, cy, 27, color, cy > 0);
    }
    if (number === 5 || number === 7) pip(ctx, suit, 0, number === 5 ? 0 : -46, 26, color);
  }
  ctx.restore();
}

function counter(ctx, x, y, value, visibility) {
  if (visibility <= 0) return;
  ctx.save();
  const fall = 1 - visibility;
  ctx.globalAlpha *= visibility;
  ctx.translate(x, y - 64 * fall);
  ctx.rotate(-fall * .18);
  ctx.scale(1 + .1 * fall, 1 + .1 * fall);
  ctx.save();
  ctx.shadowColor = '#28223f77'; ctx.shadowOffsetX = 4 + fall * 8;
  ctx.shadowOffsetY = 8 + fall * 16; ctx.shadowBlur = 8 + fall * 10;
  disk(ctx, 0, 4, 84, '#a96224');
  ctx.restore();
  disk(ctx, 0, 0, 84, '#ecaa48');
  for (let n = 0; n < 12; n++) {
    ctx.save(); ctx.rotate(n * loop / 12 + .08);
    ctx.beginPath(); ctx.arc(0, 0, 77, -.095, .095);
    ctx.lineWidth = 10; ctx.strokeStyle = ivory; ctx.stroke(); ctx.restore();
  }
  disk(ctx, 0, 0, 66, '#ffe3a4');
  ctx.beginPath(); ctx.arc(0, 0, 64, 0, loop); ctx.lineWidth = 2; ctx.strokeStyle = '#98703c'; ctx.stroke();
  lettering(ctx, value, 0, -1, 96, ink, 'Serif');
  ctx.restore();
}

function felt(ctx) {
  const light = ctx.createLinearGradient(80, 0, 1600, 1110);
  light.addColorStop(0, '#6566a0'); light.addColorStop(.47, '#51588e'); light.addColorStop(1, '#363f70');
  ctx.fillStyle = light; ctx.fillRect(0, 0, 1920, 1080);
  // The two directions of the weave stay fixed to the table.
  ctx.beginPath();
  for (let i = -1100; i < 1925; i += 9) { ctx.moveTo(i, 0); ctx.lineTo(i + 1080, 1080); }
  ctx.lineWidth = 1.3; ctx.strokeStyle = '#eee6ff0c'; ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 3008; i += 13) { ctx.moveTo(i, 0); ctx.lineTo(i - 1080, 1080); }
  ctx.lineWidth = 1; ctx.strokeStyle = '#211d4b18'; ctx.stroke();
  // The embroidered selvage matches the diamond pattern on the card backs.
  rect(ctx, -68, 31, 2056, 1018, 160, null, '#d8cccd64', 3);
  for (const y of [51, 1028]) {
    ctx.beginPath();
    for (let x = 48; x < 1890; x += 26) {
      ctx.moveTo(x, y); ctx.lineTo(x + 6, y - 4); ctx.lineTo(x + 12, y); ctx.lineTo(x + 6, y + 4); ctx.closePath();
    }
    ctx.fillStyle = '#e2d6e34f'; ctx.fill();
  }

  lettering(ctx, 'Make 24', 109, 145, 93, ivory, 'Serif', 'left');
  lettering(ctx, 'Use every card once', 1810, 128, 41, cream, 'Sans', 'right');
  lettering(ctx, '+    −    ×    ÷', 1810, 180, 34, '#f0d8b5', 'Mono', 'right');
}

const worldGap = 1300;
const loose = [-464, -154, 154, 464];
const angles = [-7, 4, -4, 7];
const finalFan = [-144, -50, 50, 144];
function hand(ctx, side, state) {
  const { leftPile, rightPile, joined, spread, turn, score, looseLift } = state;
  const x = loose.map((v, i) => {
    const paired = i < 2 ? leftPile : rightPile;
    return mix(mix(v, [-359, -246, 245, 358][i], paired), finalFan[i] * (1 + .48 * spread), joined);
  });
  const tilt = [-13, -4, 4, 13];
  for (let i = 0; i < 4; i++) {
    const paired = i < 2 ? leftPile : rightPile;
    const lift = Math.sin(paired * Math.PI) * (i % 2 === 0 ? 40 : 13);
    const cy = mix([4, -5, 0, 8][i], i === 1 || i === 2 ? -17 : 8, joined);
    card(ctx, deal[i], x[i], cy - lift - (i > 1 ? looseLift : 0), mix(angles[i], tilt[i], Math.max(joined, paired)), turn);
  }
  const showFace = 1 - portion(turn, 0, .43);
  const piles = [
    { x: -301, value: side === 'left' ? pairA : pairDifference, label: side === 'left' ? '6 × 4' : '6 − 4', progress: leftPile },
    { x: 301, value: pairB, label: '5 + 7', progress: rightPile },
  ];
  for (const pile of piles) {
    const visible = portion(pile.progress, .49, 1) * (1 - portion(joined, 0, .46)) * showFace;
    counter(ctx, mix(pile.x, 0, joined), 48, pile.value, visible);
    ctx.save(); ctx.globalAlpha *= visible;
    lettering(ctx, pile.label, pile.x, 244, 55, cream, 'Mono');
    ctx.restore();
  }
  counter(ctx, 0, 50, finalValue, portion(joined, .48, 1));
  if (joined > .6) {
    ctx.save(); ctx.globalAlpha *= portion(joined, .6, 1);
    lettering(ctx, '(6 − 4) × (5 + 7)', 0, 245, 56, ivory, 'Mono');
    ctx.restore();
  }
  if (score > 0) {
    ctx.save(); ctx.globalAlpha *= score;
    const value = side === 'left' ? branchA.heuristic : branchB.heuristic;
    lettering(ctx, 'Score  ' + value.toFixed(2), 0, -271, 61, cream, 'Sans');
    ctx.restore();
  }
}

function scoreSheet(ctx, show, addition, division, sweep) {
  if (!show) return;
  ctx.save();
  ctx.translate(1396 + 950 * (1 - show), 566);
  ctx.rotate(.019 + .09 * (1 - show));
  const width = 670, height = 488;
  ctx.save(); ctx.shadowColor = '#15133075'; ctx.shadowOffsetX = 7; ctx.shadowOffsetY = 9; ctx.shadowBlur = 13;
  rect(ctx, -width / 2, -height / 2, width, height, 4, '#decfab'); ctx.restore();
  rect(ctx, -337, -248, width, height, 4, '#f6edce');
  for (let y = -115; y < 170; y += 75) line(ctx, -335, y, 333, y, '#a6aec184', 2);
  line(ctx, -289, -247, -289, 239, '#cf8d7e99', 2);
  lettering(ctx, 'From 24, 5, 7', -251, -171, 59, ink, 'Serif', 'left');
  for (const [i, p] of [addition, division].entries()) {
    ctx.save(); ctx.globalAlpha *= p;
    const { op, result } = examples[i];
    lettering(ctx, '24 ' + op + ' (5 + 7)', -250, -75 + i * 75, 40, ink, 'Mono', 'left');
    lettering(ctx, '= ' + result, 270, -75 + i * 75, 42, red, 'Mono', 'right');
    ctx.restore();
  }
  if (sweep > 0) {
    ctx.save(); ctx.globalAlpha *= portion(sweep, 0, .12);
    const count = Math.max(2, Math.floor(finalValues.size * sweep));
    lettering(ctx, count + ' distinct final values', -252, 90, 40, ink, 'Sans', 'left');
    ctx.globalAlpha *= portion(sweep, .88, 1);
    lettering(ctx, wins + ' wins', -251, 168, 60, red, 'Serif', 'left');
    ctx.restore();
  }
  ctx.restore();
}

function draw(ctx, clock) {
  const { index, elapsed } = clock;
  // Completed cues stay at their end state on each succeeding beat.
  const cue = (beat, phrase, span) =>
    index < beat ? 0 : index > beat ? 1 : ease(clock.reveal(phrase, span));
  const opening = index ? 1 : ease(elapsed / 1.16);
  const split = cue(1, 'Suppose a model', 1.65);
  const alternate = cue(1, 'On the right', 1.05);
  const scores = cue(2, 'Our example scorer', .75);
  const discard = cue(2, 'just one proposal', 1.18);
  const paper = cue(3, 'play out the hand', 1.05);
  const add = cue(4, 'Add it', .65);
  const divide = cue(4, 'Divide twenty-four', .65);
  const sweep = cue(4, 'Now try every legal way', 2.6);
  const redeal = cue(6, 'Deal the same four', 1.65);
  const both = cue(6, 'This time', 1.1);
  const follow = cue(6, 'Follow the twelve', 1.7);
  const subtract = cue(7, 'Six minus four', .95);
  const gather = cue(8, 'Bring the piles together', 1.3);
  const spread = cue(8, 'Look under this one', 1.2);
  const wide = split * (1 - follow);
  const zoom = mix(1.25, .72, wide) + .27 * gather;
  const camera = worldGap * (.5 * split + .5 * follow);

  felt(ctx);
  if (wide > 0) {
    // The crease between the two copies of the deal gives each score a side.
    const seam = 960 + (worldGap / 2 - camera) * zoom;
    ctx.save(); ctx.globalAlpha *= wide;
    line(ctx, seam, 292, seam, 816, '#24274980', 4);
    line(ctx, seam + 4, 292, seam + 4, 816, '#eee5ff36', 2);
    ctx.restore();
    ctx.save(); ctx.globalAlpha *= wide * portion(scores, .05, .85);
    const two = both > .5;
    lettering(ctx, two ? 'Beam width 2' : 'Beam width 1', 960, 147, 54, ivory, 'Serif');
    ctx.restore();
  }
  for (const [i, side] of ['left', 'right'].entries()) {
    if (i === 1 && !split) continue;
    if (i === 0 && follow === 1) continue;
    ctx.save();
    ctx.translate(960 + (i * worldGap - camera) * zoom, 553);
    ctx.scale(zoom, zoom);
    if (i === 1) ctx.globalAlpha *= split;
    else ctx.globalAlpha *= 1 - portion(follow, .4, .95);
    const firstMove = clamp(1 - redeal + both);
    const turn = i ? discard * (1 - redeal) : 0;
    const gone = i ? portion(paper, 0, 1) * (1 - redeal) : 0;
    ctx.translate(gone * 1760, 0);
    const looseLift = index === 0 ? 14 * Math.sin(Math.PI * cue(0, 'five and the seven', 1.25)) : 0;
    hand(ctx, side, {
      leftPile: i ? subtract : opening * firstMove,
      rightPile: i ? alternate * firstMove : 0,
      joined: i ? gather : 0, spread,
      turn, looseLift, score: scores * (1 - follow) * (1 - turn) * (1 - paper + both),
    });
    ctx.restore();
  }
  scoreSheet(ctx, paper * (1 - redeal), add, divide, sweep);
}

export default { title: 'The Other Hand', beats, draw, check };
