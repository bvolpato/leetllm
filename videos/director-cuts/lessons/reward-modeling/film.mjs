import assert from 'node:assert/strict';
import { rewardHeadFit } from '../../../films/reward-modeling/arithmetic.mjs';
import { TRAINING_PAIRS } from '../../../films/reward-modeling/fixtures.mjs';

const beats = [
  {
    id: 'the-extra-sentence',
    say: 'Watch the second reply. Access needs approval, and this ticket is still pending. Four more words, and the reward model changes its pick. What did those words buy?',
    hold: 1.7,
  },
  {
    id: 'read-the-promise',
    say: 'Read the last word. Afterward. The reply says access is already enabled. Promising to ask later leaves the approval rule broken. Why does this answer get the higher score?',
    hold: 1.3,
  },
  {
    id: 'two-human-choices',
    say: 'These two comparisons trained our little scorer. A reviewer chose the reply that waits in each pair. Look at the word counts. Both times, the winner is also two words longer.',
    hold: 1.4,
  },
  {
    id: 'what-earned-the-points',
    say: 'The scorer fits one set of weights to put each preferred reply ahead of its partner. Waiting for approval counts as one. Every two words above three count as one unit of length. In both pairs the winner gains one of each. Fit the weights, and both features earn the same credit.',
    hold: 1.4,
  },
  {
    id: 'fold-one-winner',
    say: 'Keep the reviewer’s choices. Shorten the second winner by four words. It still waits. Now one winner is two words longer and the other is two words shorter. Start the fit again from zero. The opposite pulls on length cancel.',
    hold: 1.6,
  },
  {
    id: 'score-the-same-replies',
    say: 'Try the new weights on our pending ticket. Here are the same two replies, with the promise still unfolded. Which one gets the higher score now?',
    hold: 2.3,
  },
  {
    id: 'the-pick',
    say: 'Follow the scores. The extra words earn zero. Waiting for approval earns two point six seven. One shorter winner in training was enough to reverse the ranking on this ticket.',
    hold: 3.2,
  },
];

// One length unit is two words above the three-word baseline. The training
// pairs reproduce the two-feature differences of the lesson's reward-head fit.
const reply = (text, waits) => ({ text, waits });
const ticket = {
  id: 'P7-42',
  question: 'May I have admin access?',
  status: 'Approval pending',
  review: reply('Wait for approval.', true),
  early: reply('Admin enabled now.', false),
  promise: 'I’ll request approval afterward.',
};
const picks = [reply('I’ll wait for your approval.', true), reply('I’ll await approval.', true)];
const extra = 'Access will stay blocked.';
const others = [reply('Access is enabled.', false), reply('I’ve already enabled admin access.', false)];
const append = (answer, suffix) => reply(`${answer.text} ${suffix}`, answer.waits);
const words = (answer) => answer.text.split(/\s+/u).length;
const features = (answer) => [Number(answer.waits), (words(answer) - 3) / 2];
const promised = append(ticket.early, ticket.promise);
const longPick = append(picks[1], extra);
const pairs = (shorter) => [[picks[0], others[0]], [shorter ? picks[1] : longPick, others[1]]];
function fit(shorter) {
  return rewardHeadFit(pairs(shorter).map(([chosen, other]) => {
    const rejected = features(other);
    return features(chosen).map((value, i) => value - rejected[i]);
  }));
}
const original = fit(false);
const revised = fit(true);
function score(answer, weights) {
  const [rule, length] = features(answer);
  return rule * weights[0] + length * weights[1];
}
function check() {
  for (const [shorter, key, fitted] of [[false, 'confounded', original], [true, 'balanced', revised]]) {
    assert.deepEqual(pairs(shorter).map(pair => pair.map(features)), TRAINING_PAIRS[key]);
    assert(pairs(shorter).every(([chosen, other]) => score(chosen, fitted.weights) > score(other, fitted.weights)));
    assert.deepEqual(fitted.trajectory[0], [0, 0]);
  }
  assert.equal(words(promised) - words(ticket.early), 4);
  assert.deepEqual(features(ticket.early), [0, 0]);
  assert.deepEqual(features(promised), [0, 2]);
  assert.equal(score(ticket.review, original.weights).toFixed(2), '1.63');
  assert.equal(score(promised, original.weights).toFixed(2), '3.26');
  assert.equal(score(ticket.review, revised.weights).toFixed(2), '2.67');
  assert.equal(score(promised, revised.weights), 0);
  assert(revised.trajectory.every(weights => weights[1] === 0));
}

const ink = '#25223c';
const boardLight = '#6c68c5';
const boardDark = '#35337d';
const cream = '#fff6dc';
const lemon = '#eafe7f';
const pink = '#ffc5ba';
const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };

function type(ctx, value, x, y, size, { family = 'Sans', weight = 400, color = ink, align = 'left' } = {}) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
}
function shape(ctx, points, color) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const p of points.slice(1)) ctx.lineTo(...p);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
function stroke(ctx, a, b, color, width) {
  ctx.beginPath();
  ctx.moveTo(...a);
  ctx.lineTo(...b);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
function board(ctx) {
  const light = ctx.createLinearGradient(120, 0, 1600, 1200);
  light.addColorStop(0, boardLight);
  light.addColorStop(0.49, '#5755a7');
  light.addColorStop(1, boardDark);
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 1920, 1080);
  // The short fibers stay fixed when an answer changes length.
  for (let i = 1; i <= 520; i++) {
    const x = (i * 2371 + (i * i) % 677) % 1920;
    const y = (i * 3011 + (i * i) % 277) % 1080;
    stroke(ctx, [x, y], [x + 3 + i % 9, y - 1], i % 3 ? '#ffffff0d' : '#1c174011', 1.7);
  }
}

// Each reply is a cut-paper speech balloon. A crease stays at a fixed x
// while two joined leaves swing open. Text is printed across the leaves.
function balloon(ctx, x, y, width, height, render, tail = true) {
  ctx.save();
  ctx.translate(x, y);
  const path = [[0, 7], [13, 0], [width, 0], [width, height - 2], [width - 8, height], [125, height]];
  if (tail) path.push([70, height + 31], [78, height]);
  path.push([3, height]);
  ctx.shadowColor = '#21194b59';
  ctx.shadowOffsetY = 10;
  ctx.shadowOffsetX = 3;
  ctx.shadowBlur = 13;
  shape(ctx, path, cream);
  ctx.shadowColor = 'transparent';
  const tint = ctx.createLinearGradient(0, 0, width, height * 3);
  tint.addColorStop(0, '#fff9e7');
  tint.addColorStop(0.76, cream);
  tint.addColorStop(1, '#ecddbd');
  shape(ctx, path, tint);
  stroke(ctx, [14, 2], [width - 2, 2], '#fffdf1', 3);
  render();
  ctx.restore();
}
function foldout(ctx, x, y, leaf, height, opening, print) {
  const angle = 1.535 - 1.36 * opening;
  const span = leaf * Math.cos(angle);
  const lift = Math.sin(angle) * 40;
  ctx.save();
  ctx.translate(x, y);
  shape(ctx, [[0, height], [span, height - lift], [2 * span, height], [2 * span + 6, height + 10], [span + 20, height + 13], [0, height + 3]], '#251b4a45');
  for (let i = 0; i < 2; i++) {
    ctx.save();
    ctx.transform(span / leaf, (i === 0 ? -lift : lift) / leaf, 0, 1, i * span, i === 0 ? 0 : -lift);
    ctx.beginPath();
    ctx.rect(0, 0, leaf + 0.3, height);
    ctx.clip();
    const gradient = ctx.createLinearGradient(0, 0, leaf, 0);
    gradient.addColorStop(0, i ? '#f9e6be' : '#decca8');
    gradient.addColorStop(0.09, i ? '#fff2d3' : '#f2e3c4');
    gradient.addColorStop(1, i ? '#e9d9b6' : '#fff4d8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, leaf + 1, height);
    ctx.translate(-i * leaf, 0);
    print();
    ctx.fillStyle = `rgba(57,37,64,${(1 - opening) * (i ? 0.20 : 0.10)})`;
    ctx.fillRect(i * leaf, 0, leaf, height);
    ctx.restore();
  }
  ctx.restore();
}
function pencilUnderline(ctx, x, y, length, amount) {
  if (amount <= 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + length * amount * 0.64, y - 5, x + length * amount, y - 2);
  ctx.lineCap = 'round';
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#ac3746';
  ctx.stroke();
  ctx.restore();
}
function ticketHeader(ctx) {
  type(ctx, 'ACCESS REQUEST', 130, 117, 32, { family: 'Mono', color: cream });
  type(ctx, ticket.question, 125, 218, 81, { family: 'Serif', color: cream });
  // The status slip stays pinned throughout both passes over the held-out pair.
  ctx.save();
  ctx.translate(1548, 153);
  ctx.rotate(0.037);
  const points = [[-230, -76], [249, -76], [249, 73], [-216, 73], [-231, 60]];
  ctx.shadowColor = '#251b494a';
  ctx.shadowOffsetY = 8;
  ctx.shadowBlur = 10;
  shape(ctx, points, pink);
  ctx.shadowColor = 'transparent';
  stroke(ctx, [-172, -74], [-172, 71], '#985d636e', 2);
  ctx.beginPath();
  ctx.arc(-200, -1, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#59569f';
  ctx.fill();
  type(ctx, 'TICKET ' + ticket.id, -147, -15, 29, { family: 'Mono' });
  type(ctx, ticket.status, -148, 40, 43, { weight: 700 });
  ctx.restore();
}
function pickMark(ctx, x, y, settled) {
  shape(ctx, [[x - 111, y - 80], [x + 108, y - 85], [x + 100, y + 9], [x - 119, y + 16]], lemon);
  if (settled) type(ctx, 'MODEL PICK', x, y + 63, 36, { family: 'Mono', align: 'center', color: lemon });
}
function testPair(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  ticketHeader(ctx);
  const unfoldTime = 3.15;
  const opening = index === 0 ? smooth(elapsed / unfoldTime) : 1;
  const refit = index >= 5;
  const weights = refit ? revised.weights : original.weights;
  const visible = index !== 5 && (index !== 6 || elapsed >= 0.35);
  const complete = opening === 1;
  const grant = complete ? promised : ticket.early;
  const grantWins = score(grant, weights) > score(ticket.review, weights);
  const pickRow = index === 0 ? smooth((elapsed - unfoldTime) / 0.46) : Number(grantWins);
  type(ctx, 'Reward score', 1643, 318, 36, { color: cream, align: 'center' });
  if (visible) pickMark(ctx, 1643, 450 + 275 * pickRow, pickRow === 0 || pickRow === 1);
  const paperX = 135, sheetWidth = 615, sheetHeight = 152;
  for (const [row, answer] of [ticket.review, ticket.early].entries()) {
    const y = 353 + row * 275;
    balloon(ctx, paperX, y, sheetWidth, sheetHeight, () => {
      type(ctx, answer.text, 38, 99, 58, { family: 'Serif' });
    });
    if (row === 1) {
      foldout(ctx, paperX + sheetWidth, y, 288, sheetHeight - 2, opening, () => {
        type(ctx, 'I’ll request approval', 35, 68, 51, { family: 'Serif' });
        type(ctx, 'afterward.', 35, 126, 51, { family: 'Serif' });
        const mark = index === 1 ? smooth(reveal('Read the last word', 0.75)) : Number(index >= 5);
        pencilUnderline(ctx, 35, 137, 214, mark);
      });
    }
    const rescoring = index === 0 && row === 1 && opening > 0.1 && !complete;
    const showValue = visible && !rescoring;
    const value = showValue ? score(row ? grant : answer, weights).toFixed(2) : '· · ·';
    type(ctx, value, 1643, y + 97, showValue ? 76 : 56, {
      family: 'Mono', weight: 600, align: 'center',
      color: visible && Math.abs(pickRow - row) < 0.17 ? ink : cream,
    });
  }
}
function wordCount(ctx, n, x, y) {
  type(ctx, `${n} words`, x, y, 40, { weight: 600, family: 'Mono', color: '#514158' });
}
function training(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  const fold = index === 4 ? smooth(reveal('Shorten the second winner', 1.6)) : 0;
  const opening = 1 - fold;
  type(ctx, 'Two training comparisons', 124, 198, 81, { family: 'Serif', color: cream });
  ctx.lineCap = 'round';
  stroke(ctx, [137, 283], [153, 299], lemon, 8);
  stroke(ctx, [153, 299], [182, 262], lemon, 8);
  type(ctx, 'Preferred reply', 213, 297, 41, { color: lemon });
  type(ctx, 'Other reply', 1175, 297, 41, { color: cream });
  for (let i = 0; i < 2; i++) {
    const y = 342 + 217 * i;
    const base = i === 0 ? 700 : 457;
    const winner = i === 0 ? picks[0] : fold === 1 ? picks[1] : longPick;
    const deltaWords = words(winner) - words(others[i]);
    const showDifference = index === 2 ? reveal('Both times', 0.45) : 1;
    balloon(ctx, 130, y, base, 140, () => {
      wordCount(ctx, words(winner), 30, 48);
      if (i === 0 || fold === 0 || fold === 1) {
        ctx.save();
        ctx.globalAlpha = showDifference;
        const comparison = `${Math.abs(deltaWords)} ${deltaWords > 0 ? 'longer' : 'shorter'}`;
        type(ctx, comparison, 227, 48, 36, { color: '#803346' });
        ctx.restore();
      }
      type(ctx, picks[i].text, 29, 111, 43, { family: 'Serif' });
    });
    if (i === 1) {
      foldout(ctx, 130 + base, y, 249, 139, opening, () => {
        type(ctx, extra, 24, 108, 39, { family: 'Serif' });
      });
    }
    balloon(ctx, 1175, y, i === 0 ? 462 : 685, 140, () => {
      wordCount(ctx, words(others[i]), 30, 48);
      type(ctx, others[i].text, 29, 111, 42, { family: 'Serif' });
    });
  }
  if (index < 3) return;
  let weights;
  if (index === 3) {
    const t = smooth(reveal('Fit the weights', 1.25));
    weights = original.trajectory[Math.round(300 * t)];
  } else {
    const t = smooth(reveal('Start the fit again', 1.6));
    weights = t > 0 ? revised.trajectory[Math.round(300 * t)] : original.weights;
  }
  const amount = index === 3 ? smooth(elapsed / 0.55) : 1;
  ctx.save();
  ctx.globalAlpha = amount;
  type(ctx, 'Weight per unit', 130, 851, 39, { color: cream });
  type(ctx, 'Waits', 557, 851, 39, { color: cream });
  type(ctx, weights[0].toFixed(2), 690, 856, 52, { family: 'Mono', color: lemon });
  type(ctx, 'Length', 1175, 851, 39, { color: cream });
  type(ctx, weights[1].toFixed(2), 1349, 856, 52, { family: 'Mono', color: lemon });
  ctx.restore();
}
function draw(ctx, clock) {
  ctx.save();
  board(ctx);
  if (clock.index < 2 || clock.index >= 5) testPair(ctx, clock);
  else training(ctx, clock);
  ctx.restore();
}

export default { title: 'What did four extra words buy?', beats, draw, check };
