import assert from 'node:assert/strict';
import { normalize } from '../../../films/data-quality/fixtures.mjs';
import { leakageComparison } from '../../../films/data-quality/model.mjs';

const withCopy = leakageComparison(true);
const withoutCopy = leakageComparison(false);
const [build, deploy] = withCopy.training;
const [test] = withCopy.answers;
const title = 'The tear through conversation 51';

const beats = [
  {
    id: 'perforation',
    say: 'Follow the red seal. One ticket lands in training and one in the test pile. The ticket numbers are different. Both carry the same conversation number.',
    hold: 0.7,
  },
  {
    id: 'read-the-type',
    say: 'The support team marked the first ticket for escalation. The router has to supply the answer on the right. It trims the spaces and reads both messages in lowercase.',
    hold: 0.8,
  },
  {
    id: 'carbon',
    say: 'This router looks up the whole message in training. If it finds a match, it copies the label. If it comes up empty, it answers standard. Watch the blank on the right.',
    hold: 1.5,
  },
  {
    id: 'three-marks',
    say: 'It got the build ticket right. Across three test tickets, that gives it two correct. Where did that first check mark come from?',
    hold: 0.8,
  },
  {
    id: 'withdraw',
    say: 'Slip the build ticket out of training. That leaves a question about deploy policy. Keep the three test tickets in place. What happens when we run them again?',
    hold: 1.4,
  },
  {
    id: 'rescore',
    say: 'There goes the first check. With the match gone, the router answers standard. The reviewer wanted escalate. Only one of the three answers is right now.',
    hold: 1.3,
  },
  {
    id: 'whole-thread',
    say: 'That extra point came from seeing another turn of the same conversation. To measure how the router handles a new conversation, file the whole thread together when you split the data.',
    hold: 2.8,
  },
];

const W = 722;
const H = 384;
const colors = {
  ink: '#222635', rule: '#8c8790', blue: '#313b93', gold: '#e3a643',
  red: '#bd3d35', paper: '#fff5db', green: '#1a624f',
};
const mix = (a, b, p) => a + (b - a) * p;
function ease(p) {
  const t = Math.max(0, Math.min(1, p));
  return t * t * (3 - 2 * t);
}
function cue(clock, index, phrase, seconds) {
  if (clock.index < index) return 0;
  if (clock.index > index) return 1;
  return ease(clock.reveal(phrase, seconds));
}
function type(ctx, text, x, y, size, family = 'Sans', color = colors.ink, weight = 400, align = 'left') {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.fillText(text, x, y);
}
function stroke(ctx, color, width, x, y, endX, endY) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}
function depth(ctx, blur, dx, dy, alpha) {
  ctx.shadowColor = 'rgba(38,33,54,' + alpha + ')';
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = dx;
  ctx.shadowOffsetY = dy;
}
function wash(ctx, x0, y0, x1, y1, ...stops) {
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([at, value]) => gradient.addColorStop(at, value));
  return gradient;
}

// The two file jackets have folded sides and a scooped front lip. Their backs
// and fronts draw separately so a ticket can actually disappear into a pocket.
const jackets = [
  { x: 56, width: 852, name: 'Training', light: '#5661ad', dark: '#252f76', print: '#fff4dc' },
  { x: 1006, width: 854, name: 'Test', light: '#f1c76d', dark: '#bd8036', print: '#382f2a' },
];
function folderBack(ctx, jacket) {
  const { x, width, name, light, dark, print } = jacket;
  ctx.save();
  ctx.translate(x, 0);
  ctx.beginPath();
  ctx.moveTo(0, 245);
  ctx.quadraticCurveTo(0, 230, 15, 230);
  ctx.lineTo(31, 230);
  ctx.lineTo(51, 175);
  ctx.quadraticCurveTo(54, 165, 68, 165);
  ctx.lineTo(320, 165);
  ctx.quadraticCurveTo(332, 165, 337, 175);
  ctx.lineTo(368, 229);
  ctx.lineTo(width - 14, 229);
  ctx.quadraticCurveTo(width, 229, width, 245);
  ctx.lineTo(width, 863);
  ctx.lineTo(0, 863);
  ctx.closePath();
  depth(ctx, 20, 8, 11, 0.28);
  ctx.fillStyle = wash(ctx, 0, 150, width, 865, [0, light], [1, dark]);
  ctx.fill();
  depth(ctx, 0, 0, 0, 0);
  type(ctx, name, 80, 222, 49, 'Sans', print, 700);
  stroke(ctx, '#ffffff4a', 2, 12, 244, width - 15, 244);
  // Scored creases in the folded stock catch the same light as the tab.
  for (const dx of [17, 23]) {
    stroke(ctx, '#29243535', 2, dx, 266, dx, 839);
    stroke(ctx, '#ffedda47', 2, width - dx, 266, width - dx, 839);
  }
  ctx.restore();
}
function folderFront(ctx, jacket, top) {
  const { x, width, light, dark } = jacket;
  ctx.save();
  ctx.translate(x, 0);
  ctx.beginPath();
  ctx.moveTo(0, top);
  ctx.lineTo(width * 0.38, top);
  ctx.bezierCurveTo(width * 0.42, top, width * 0.42, top + 21, width * 0.46, top + 21);
  ctx.lineTo(width * 0.54, top + 21);
  ctx.bezierCurveTo(width * 0.58, top + 21, width * 0.58, top, width * 0.62, top);
  ctx.lineTo(width, top);
  ctx.lineTo(width - 6, 850);
  ctx.quadraticCurveTo(width - 6, 864, width - 20, 864);
  ctx.lineTo(21, 864);
  ctx.quadraticCurveTo(7, 864, 6, 850);
  ctx.closePath();
  depth(ctx, 11, 0, -3, 0.2);
  ctx.fillStyle = wash(ctx, 0, top, width * 0.6, 870, [0, light], [1, dark]);
  ctx.fill();
  depth(ctx, 0, 0, 0, 0);
  ctx.strokeStyle = '#ffffff50';
  ctx.lineWidth = 2;
  ctx.stroke();
  stroke(ctx, '#3a2a381b', 2, 14, top + 25, 17, 842);
  stroke(ctx, '#3a2a381b', 2, width - 14, top + 25, width - 17, 842);
  ctx.restore();
}

// The same profile forms both edges of the tear. When the stubs meet again,
// the printed cancellation mark and every notch register across the join.
function edge(y) {
  return (y <= 0 || y >= H) ? 0 : ((Math.round(y / 8) % 2) ? 4.2 : -2.3);
}
function outline(ctx, isRight, seam) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, 0);
  if (!isRight && seam) {
    for (let y = 8; y < H; y += 8) ctx.lineTo(W + edge(y), y);
  }
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  if (isRight && seam) {
    for (let y = H - 8; y > 0; y -= 8) ctx.lineTo(edge(y), y);
  }
  ctx.closePath();
  // Die-cut holes run along the outer feed strips of the transcript.
  const holeX = isRight ? W - 19 : 19;
  for (let y = 24; y < H; y += 42) {
    ctx.moveTo(holeX + 6.5, y);
    ctx.arc(holeX, y, 6.5, 0, Math.PI * 2);
  }
}
function seal(ctx, x) {
  ctx.save();
  ctx.translate(x, 190);
  ctx.rotate(-0.14);
  ctx.strokeStyle = colors.red;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(0, 0, 95, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, 84, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 48; i++) {
    const a = i * Math.PI / 24;
    stroke(ctx, colors.red, 2, 68 * Math.cos(a), 68 * Math.sin(a), 75 * Math.cos(a), 75 * Math.sin(a));
  }
  type(ctx, build.conversation.split('-')[1], 0, 29, 88, 'Serif', colors.red, 400, 'center');
  ctx.restore();
}
function stamp(ctx, x, y, label, opacity = 1) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha *= opacity;
  ctx.translate(x, y);
  ctx.rotate(-0.021);
  const ink = label === 'escalate' ? colors.red : colors.blue;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(0, -40, 238, 52);
  type(ctx, label.toUpperCase(), 119, 1, 42, 'Mono', ink, 400, 'center');
  ctx.restore();
}
function ticket(ctx, row, pose, { isRight = false, clean = 0, label, opacity = 1, grade = 0, filing = 0, seam = true } = {}) {
  const { x, y, scale = 1, angle = 0 } = pose;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(angle);
  ctx.translate(-W / 2, -H / 2);
  outline(ctx, isRight, seam);
  depth(ctx, 13, 4, 9, 0.28);
  ctx.fillStyle = wash(ctx, 0, 0, W, H, [0, '#fffbe9'], [0.48, colors.paper], [1, '#ede1c5']);
  ctx.fill('evenodd');
  depth(ctx, 0, 0, 0, 0);
  ctx.clip('evenodd');
  const feed = isRight ? W - 39 : 39;
  ctx.setLineDash([5, 7]);
  stroke(ctx, '#9f9794', 1.5, feed, 0, feed, H);
  ctx.setLineDash([]);
  if (seam) seal(ctx, isRight ? 0 : W);
  const left = isRight ? 110 : 67;
  const right = isRight ? W - 59 : W - 56;
  type(ctx, '#' + row.id, left, 64, 49, 'Mono');
  type(ctx, 'Thread ' + row.conversation, right, 60, 37, 'Sans', colors.ink, 600, 'right');
  stroke(ctx, colors.rule, 1.8, left, 85, right, 85);

  const words = row.text.trim().split(/\s+/);
  const cut = words.length - (row.id === deploy.id ? 2 : 1);
  const lines = [words.slice(0, cut).join(' '), words.slice(cut).join(' ')];
  for (const [i, line] of lines.entries()) {
    const yy = 171 + i * 74;
    const indent = row.text.startsWith(' ') && i === 0 ? 32 * (1 - clean) : 0;
    const cleaned = normalize(line);
    if (line !== cleaned && clean < 1) {
      ctx.save();
      ctx.globalAlpha *= 1 - clean;
      type(ctx, line, left + indent, yy, 69, 'Serif');
      ctx.restore();
    }
    if (line === cleaned || clean > 0) {
      ctx.save();
      ctx.globalAlpha *= line === cleaned ? 1 : clean;
      type(ctx, cleaned, left + indent, yy, 69, 'Serif');
      ctx.restore();
    }
  }
  ctx.save();
  ctx.globalAlpha *= 1 - filing;
  stroke(ctx, colors.rule, 1.8, left, 262, right, 262);
  type(ctx, isRight ? 'Prediction' : 'Reviewed', left, 302, 34);
  stroke(ctx, '#8b8179', 1.5, left, 369, left + 238, 369);
  if (label) stamp(ctx, left, 353, label, opacity);
  if (grade > 0) {
    ctx.globalAlpha *= grade;
    type(ctx, 'Reviewed', left + 288, 302, 34);
    stamp(ctx, left + 288, 353, row.label);
  }
  ctx.restore();
  ctx.restore();
}

function scoreStrip(ctx, result, appear, retire) {
  if (appear <= 0 || retire >= 1) return;
  ctx.save();
  ctx.globalAlpha = appear * (1 - retire);
  ctx.translate(1044, 705 + (1 - appear) * 24 + retire * 20);
  ctx.fillStyle = '#fff2d4';
  depth(ctx, 5, 2, 4, 0.22);
  ctx.fillRect(0, 0, 776, 129);
  depth(ctx, 0, 0, 0, 0);
  type(ctx, 'Correct', 26, 43, 33, 'Sans');
  type(ctx, result.correct + ' / ' + result.total, 26, 110, 68, 'Serif');
  stroke(ctx, '#b6a68b', 1.5, 196, 15, 196, 113);
  result.answers.forEach((row, i) => {
    const x = 296 + i * 184;
    type(ctx, '#' + row.id, x, 45, 35, 'Mono', colors.ink, 400, 'center');
    ctx.save();
    ctx.lineCap = 'round';
    if (row.correct) {
      stroke(ctx, colors.green, 10, x - 24, 83, x - 7, 98);
      stroke(ctx, colors.green, 10, x - 7, 98, x + 27, 64);
    } else {
      stroke(ctx, colors.red, 9, x - 16, 66, x + 16, 99);
      stroke(ctx, colors.red, 9, x + 16, 66, x - 16, 99);
    }
    ctx.restore();
  });
  ctx.restore();
}

function draw(ctx, clock) {
  const { index, elapsed } = clock;
  const separate = index === 0 ? ease(elapsed / 2.1) : 1;
  const clean = cue(clock, 1, 'It trims the spaces', 1.3);
  const copy = cue(clock, 2, 'Watch the blank', 1.4);
  const showScore = cue(clock, 3, 'Across three test tickets', 0.55);
  const pull = cue(clock, 4, 'Slip the build ticket', 1.15);
  const rerun = index > 5 || (index === 5 && elapsed >= 0.24);
  const result = rerun ? withoutCopy : withCopy;
  const regroup = cue(clock, 6, 'To measure', 2.15);
  const retire = cue(clock, 6, 'To measure', 0.65);
  const inspectGrade = cue(clock, 5, 'With the match gone', 1.4);
  const zoom = mix(1 + 0.17 * (1 - separate) + 0.85 * inspectGrade, 1.93, regroup);

  ctx.save();
  ctx.fillStyle = wash(ctx, 0, 0, 1920, 1080, [0, '#dbe5e5'], [0.52, '#bccfd4'], [1, '#98afb9']);
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.translate(960, 540);
  ctx.scale(zoom, zoom);
  ctx.translate(-mix(960, 1432, inspectGrade), -mix(mix(493, 630, inspectGrade), 424, regroup));

  jackets.forEach(jacket => folderBack(ctx, jacket));

  const l = mix(960 - W / 2, 482, separate);
  const r = mix(960 + W / 2, 1433, separate);
  const y = mix(422, 457, separate);
  // A second training ticket becomes readable when the build slip is pulled.
  if (pull > 0) ticket(ctx, deploy, { x: 482, y: 461, angle: -0.012 }, { label: deploy.label, seam: false });
  const finalScale = 0.55;
  const gap = Math.sin(regroup * Math.PI);
  const lx = mix(l - pull * 1050, 1433 - W * finalScale / 2, regroup);
  const ly = mix(y - pull * 170, 438, regroup) - 115 * gap;
  ticket(ctx, build, {
    x: lx, y: ly, scale: mix(1, finalScale, regroup),
    angle: mix(-0.018 * separate - 0.07 * pull, 0, regroup) - 0.035 * Math.sin(separate * Math.PI),
  }, { clean: clean * (1 - regroup), label: build.label, filing: retire });

  const rightAngle = 0.016 * separate + 0.045 * Math.sin(separate * Math.PI);
  ticket(ctx, test, {
    x: mix(r, 1433 + W * finalScale / 2, regroup),
    y: mix(y, 438, regroup), scale: mix(1, finalScale, regroup),
    angle: rightAngle * (1 - regroup),
  }, {
    isRight: true, clean: clean * (1 - regroup), label: result.answers[0].prediction,
    opacity: copy > 0.86 ? (copy - 0.86) / 0.14 : 0, filing: retire, grade: showScore,
  });

  // One moving ink impression carries the result from the lookup to its blank.
  if (copy > 0 && copy < 1) {
    const from = l - W / 2 + 67;
    const to = r - W / 2 + 110;
    stamp(ctx, mix(from, to, copy), y - H / 2 + 353 - 96 * Math.sin(copy * Math.PI),
      withCopy.answers[0].prediction, Math.min(1, (1 - copy) / 0.14));
  }
  folderFront(ctx, jackets[0], 651);
  folderFront(ctx, jackets[1], mix(651, 518, regroup));
  scoreStrip(ctx, result, showScore, retire);
  ctx.restore();
}

function check() {
  assert.equal(build.conversation, test.conversation);
  assert.notEqual(build.id, test.id);
  assert.notEqual(build.text, test.text);
  assert.equal(normalize(build.text), normalize(test.text));
  assert.deepEqual(withCopy.training.map(row => row.id), [101, 103]);
  assert.deepEqual(withoutCopy.training.map(row => row.id), [103]);
  assert.deepEqual(withCopy.answers.map(row => row.id), [102, 107, 301]);
  assert.deepEqual(withCopy.answers.map(row => row.matchedId), [101, null, null]);
  assert.deepEqual(withoutCopy.answers.map(row => row.matchedId), [null, null, null]);
  assert.equal(withCopy.answers[0].prediction, 'escalate');
  assert.equal(withoutCopy.answers[0].prediction, 'standard');
  assert.ok(withoutCopy.training.every(row => row.conversation !== test.conversation));
  assert.deepEqual(withCopy.answers.map(row => row.correct), [true, true, false]);
  assert.deepEqual(withoutCopy.answers.map(row => row.correct), [false, true, false]);
  assert.equal(withCopy.correct, 2);
  assert.equal(withoutCopy.correct, 1);
  assert.equal(withCopy.total, withoutCopy.total);
  assert.deepEqual(withCopy.answers.map(row => [row.id, row.label]), withoutCopy.answers.map(row => [row.id, row.label]));
}

export default { title, beats, draw, check };
