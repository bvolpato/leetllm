import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { rows } from '../../../films/git-shell-linux-reproducible-ai/fixtures.mjs';
import { score } from '../../../films/git-shell-linux-reproducible-ai/arithmetic.mjs';

// Each exposure uses the three records in the lesson fixture. The score reads the
// saved predictions, just as the evaluation in the lesson does.
const freezeFile = (records) => records.map((row) => ({ ...row }));
const staged = freezeFile(rows);
const laterRun = rows.map((row, i) => i === 1 ? { ...row, prediction: 'blocked' } : { ...row });
const committed = freezeFile(staged);
const checkout = freezeFile(committed);
const laptopScore = score(laterRun);
const cloneScore = score(checkout);

const beats = [
  {
    id: 'the-exposure',
    say: 'Catch the middle line as it comes through the roller. The saved prediction for request one oh two is escalated.',
    hold: 0.85,
  },
  {
    id: 'the-staged-file',
    say: 'Here’s the file on my laptop. I just ran git add. The strip in the staging area holds all three predictions from that instant.',
    hold: 0.65,
  },
  {
    id: 'another-run',
    say: 'Another run writes to the same file on my laptop. Look at those two middle lines now. My file says blocked. The staged copy still says escalated.',
    hold: 1.1,
  },
  {
    id: 'which-run-travels',
    say: 'Blocked is the expected answer. The other two already matched, so my laptop scores three out of three. Suppose I commit now, without running git add again. Which word will you get?',
    hold: 1.65,
  },
  {
    id: 'into-the-commit',
    say: 'Follow the frame from the staging area. Git records those contents in the commit. Open that commit in a fresh clone on your machine.',
    hold: 0.75,
  },
  {
    id: 'score-the-clone',
    say: 'Line up the saved predictions with the answers. The first and last match. Your clone reads escalated where we expected blocked. Two out of three. That was the file I staged.',
    hold: 2.5,
  },
];

const clamp = (n) => Math.max(0, Math.min(1, n));
const ease = (n) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const mix = (a, b, n) => a + (b - a) * n;

function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}

function path(c, points, fill) {
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}

function rule(c, x1, y1, x2, y2, color, width = 2) {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}

function rounded(c, x, y, w, h, radius, color) {
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
  c.fillStyle = color;
  c.fill();
}

function label(c, str, x, y, size, color, family = 'Sans', weight = 400) {
  c.fillStyle = color;
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillText(str, x, y);
}

function gradient(c, x0, y0, x1, y1, colors) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  for (const [pos, color] of colors) g.addColorStop(pos, color);
  return g;
}

// A fixed grain stays attached to the material during a take.
let grain;
function surface(c, x, y, w, h, opacity) {
  if (!grain) {
    grain = createCanvas(164, 128);
    const ink = grain.getContext('2d');
    let seed = 77;
    function random() {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    for (let i = 0; i < 2100; i++) {
      rect(ink, Math.floor(random() * 164), Math.floor(random() * 128), 1 + random() * 3, 1,
        i % 2 ? '#bac0af' : '#4a5048');
    }
  }
  c.save();
  c.globalAlpha *= opacity;
  rect(c, x, y, w, h, c.createPattern(grain, 'repeat'));
  c.restore();
}

function screw(c, x, y, r, angle = -0.7) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.beginPath();
  c.arc(0, 0, r, 0, 2 * Math.PI);
  c.fillStyle = gradient(c, 0, -r, 0, r, [[0, '#e0d6b8'], [.47, '#9f9d89'], [1, '#535d56']]);
  c.fill();
  rule(c, -r * .74, 0, r * .74, 0, '#39413b', 3);
  c.restore();
}

const rowY = [164, 264, 364];
function records(c, file, negative, edited = 0) {
  const ink = negative ? '#ffda9c' : '#23332f';
  const pale = negative ? '#d5b37e' : '#46594d';
  const stripe = negative ? '#4a301c' : '#c9d5bd';
  const marker = negative ? '#ffcf76' : '#42694a';
  label(c, 'Request', 12, 62, 31, pale);
  label(c, 'Prediction', 229, 62, 31, pale);
  rule(c, 10, 81, 596, 81, pale);
  rounded(c, 0, 191, 610, 92, 3, stripe);
  rect(c, 0, 191, 6, 92, marker);
  file.forEach((row, i) => {
    const id = row.prompt.match(/\d+/)[0];
    label(c, id, 14, rowY[i], 49, ink, 'Mono');
    if (i === 1 && edited > 0 && edited < 1) {
      // A scan line rewrites the working prediction. The surrounding rows keep their registration.
      const cut = 218 + 385 * edited;
      for (const [word, left, right] of [[laterRun[i].prediction, 218, cut], [row.prediction, cut, 615]]) {
        c.save();
        c.beginPath();
        c.rect(left, 193, right - left, 91);
        c.clip();
        label(c, word, 224, rowY[i], 58, ink, 'Serif');
        c.restore();
      }
      rect(c, cut - 3, 195, 6, 86, '#eff2bc');
    } else {
      label(c, i === 1 && edited === 1 ? laterRun[i].prediction : row.prediction,
        224, rowY[i], i === 1 ? 58 : 53, ink, 'Serif');
    }
  });
}

function workingPaper(c, edit, matches) {
  c.save();
  c.translate(117, 188);
  c.rotate(-0.021);
  rect(c, 10, 19, 749, 595, '#14231ec9');
  rect(c, 6, 8, 749, 597, '#b7b59b');
  rect(c, 0, 0, 749, 598, gradient(c, 0, 0, 749, 598,
    [[0, '#fff6da'], [.53, '#f1ebce'], [1, '#d8d8b9']]));
  surface(c, 0, 0, 749, 598, .12);
  label(c, 'access_requests.jsonl', 59, 75, 37, '#44554b', 'Mono');
  c.save();
  c.translate(58, 107);
  records(c, rows, false, edit);
  c.restore();
  rule(c, 62, 512, 676, 512, '#a1a58f');
  if (matches > 0) {
    c.save();
    c.globalAlpha *= matches;
    label(c, laptopScore.correct + ' / ' + laptopScore.total, 61, 574, 53, '#294f3d', 'Mono');
    label(c, 'matches', 251, 573, 40, '#294f3d');
    c.restore();
  }
  c.restore();
}

// An amber microfilm strip. The same negative stays in registration as a mount
// closes around its copy and carries that copy up to the reader.
const stripW = 738;
const stripH = 510;
function negative(c, file) {
  rect(c, 0, 0, stripW, stripH, gradient(c, 0, 0, stripW, stripH,
    [[0, '#b27a42'], [.11, '#8b552d'], [.63, '#7e502f'], [1, '#ae7a44']]));
  for (const x of [14, stripW - 36]) {
    for (let y = 20; y < stripH - 10; y += 47) rounded(c, x, y, 22, 25, 4, '#17211e');
  }
  rect(c, 48, 18, stripW - 96, stripH - 36, '#251e17');
  rect(c, 51, 20, stripW - 102, stripH - 42, gradient(c, 0, 0, 730, 510,
    [[0, '#30271c'], [.47, '#211b15'], [1, '#322519']]));
  c.save();
  c.translate(66, 38);
  records(c, file, true);
  c.restore();
  path(c, [[636,460],[655,448],[655,472]], '#e5ba73');
  rule(c, 79, 455, 615, 455, '#876a42');
  surface(c, 0, 0, stripW, stripH, .055);
}

function roller(c, y) {
  rect(c, 1016, y, 804, 54, '#0c1513');
  rounded(c, 1027, y + 8, 784, 41, 13, gradient(c, 0, y, 0, y + 52,
    [[0, '#34433d'], [.27, '#8f9d8d'], [.46, '#d7d8c0'], [.69, '#6a786d'], [1, '#222c27']]));
  for (let x = 1048; x < 1798; x += 10) rule(c, x, y + 12, x, y + 42, '#17201a44', 2);
  rect(c, 1035, y + 49, 774, 8, '#080f0e');
}

function bench(c, feed, edit, matches, mount) {
  rect(c, 0, 0, 1920, 1080, gradient(c, 0, 0, 1840, 1090,
    [[0, '#486458'], [.44, '#314f45'], [1, '#1c302b']]));
  surface(c, 0, 0, 1920, 1080, .12);
  path(c, [[0, 824], [924, 785], [1104, 1080], [0, 1080]], '#142a251c');
  label(c, 'Working file', 115, 111, 64, '#f5edd0', 'Serif');
  workingPaper(c, edit, matches);

  rounded(c, 969, -54, 910, 1020, 68, '#13241fd9');
  rounded(c, 952, -88, 913, 1029, 69, '#87978a');
  rounded(c, 955, -87, 907, 1021, 66, gradient(c, 965, -83, 1862, 934,
    [[0, '#435047'], [.47, '#303e36'], [1, '#28332c']]));
  surface(c, 985, 0, 841, 895, .09);
  label(c, 'Staging area', 1070, 108, 64, '#f6e8ca', 'Serif');
  screw(c, 1810, 73, 11);
  rounded(c, 1006, 188, 828, 580, 18, '#1b2721');
  rounded(c, 1015, 194, 809, 570, 14, '#101b17');
  // The moving leading edge is visible immediately below the slot at the cut from the chime.
  c.save();
  c.beginPath();
  c.rect(1019, 216, 804, 547);
  c.clip();
  c.translate(1049, mix(-245, 239, feed));
  negative(c, staged);
  c.restore();
  roller(c, 171);
  const action = mount > 0 ? 'git commit' : 'git add';
  label(c, action, 1114, 857, 44, '#eee7d0', 'Mono');
  c.beginPath();
  c.arc(1061, 842, 12, 0, Math.PI * 2);
  c.fillStyle = mount > 0 ? '#f5c773' : '#c1dcc0';
  c.fill();
  screw(c, 1810, 850, 11, .6);
}

function mountedFrame(c, x, y, scale, closure) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  negative(c, committed);
  const open = 79 * (1 - closure);
  const rim = '#cec7aa';
  c.globalAlpha *= closure;
  path(c, [[-12-open,-23-open],[695,-23-open],[750,29-open],[750,0-open],[0,0-open],[0,512],[-12-open,523]], rim);
  path(c, [[-12,510+open],[738+open,510+open],[738+open,-6],[750+open,4],[750+open,529+open],[-12,529+open]], '#a39e88');
  c.restore();
}

function reader(c) {
  rect(c, 0, 0, 1920, 1080, gradient(c, 0, 0, 1920, 1080,
    [[0, '#232e29'], [.51, '#182921'], [1, '#0c1713']]));
  c.save();
  c.translate(908, 484);
  c.scale(1.85, 1);
  const glow = c.createRadialGradient(0, 0, 20, 0, 0, 575);
  glow.addColorStop(0, '#adb3894d');
  glow.addColorStop(.78, '#a5b48616');
  glow.addColorStop(1, '#aab78b00');
  rect(c, -625, -625, 1250, 1250, glow);
  c.restore();
  surface(c, 0, 0, 1920, 1080, .1);
  label(c, 'Fresh clone', 133, 119, 73, '#f5ecd4', 'Serif');
}

// The answer key slides down against the same three lines as the projected file.
function answerKey(c, amount, fraction) {
  if (amount <= 0) return;
  c.save();
  c.globalAlpha *= amount;
  c.translate(0, -140 * (1 - amount));
  const x = 1011, y = 226;
  const w = 730, h = 577;
  rect(c, x + 10, y + 14, w, h, '#10181199');
  rect(c, x, y, w, h, gradient(c, x, y, x+w, y+h,
    [[0, '#dbe3c8'], [.6, '#e8e7c8'], [1, '#c7d2b5']]));
  surface(c, x, y, w, h, .09);
  const s = 1.16;
  const origin = y + 38 * s;
  label(c, 'Expected', x + 65, origin + 62 * s, 36, '#324c3e');
  rule(c, x + 55, origin + 81 * s, x + w - 52, origin + 81 * s, '#647763');
  checkout.forEach((row, i) => {
    const baseline = origin + rowY[i] * s;
    const pass = row.prediction === row.expected;
    if (i === 1) rect(c, x + 37, origin + 191*s, w - 73, 92*s, '#d9c9a7');
    label(c, row.expected, x + 65, baseline, i === 1 ? 67 : 61, '#23382b', 'Serif');
    const gx = x + w - 106, gy = baseline - 24;
    c.lineCap = 'round';
    if (pass) {
      rule(c, gx - 17, gy - 2, gx - 5, gy + 11, '#486645', 7);
      rule(c, gx - 5, gy + 11, gx + 20, gy - 17, '#486645', 7);
    } else {
      rule(c, gx - 14, gy - 14, gx + 14, gy + 14, '#894932', 8);
      rule(c, gx + 14, gy - 14, gx - 14, gy + 14, '#894932', 8);
    }
  });
  screw(c, x+w-24, y+24, 8);
  if (fraction > 0) {
    c.globalAlpha *= fraction;
    label(c, cloneScore.correct + ' / ' + cloneScore.total, x + 62, y + h - 23, 57, '#294537', 'Mono');
    label(c, 'matches', x + 268, y + h - 24, 42, '#294537');
  }
  c.restore();
}

function draw(c, clock) {
  const { index, elapsed, reveal } = clock;
  const feed = index === 0 ? ease(elapsed / 1.8) : 1;
  const wide = index === 0 ? 0 : index === 1 ? ease(reveal('Here’s the file', 2.25)) : 1;
  const edit = index < 2 ? 0 : index === 2 ? ease(reveal('Another run', 1.35)) : 1;
  const matches = index < 3 ? 0 : index === 3 ? ease(reveal('Blocked is the expected answer', .65)) : 1;
  const close = index < 4 ? 0 : index === 4 ? ease(reveal('Follow the frame', .95)) : 1;
  const lift = index < 4 ? 0 : index === 4 ? ease(reveal('from the staging area', 1.55)) : 1;
  const travel = index < 4 ? 0 : index === 4 ? ease(reveal('Open that commit', 2.15)) : 1;
  c.save();
  const zoom = mix(1.87, 1, wide);
  c.scale(zoom, zoom);
  c.translate(-884 * (1 - wide), -159 * (1 - wide));
  bench(c, feed, edit, matches, close);
  c.restore();
  if (travel > 0) {
    c.save();
    c.globalAlpha = travel;
    reader(c);
    c.restore();
  }
  if (close > 0) {
    const x = mix(1049 - lift * 136, 136, travel);
    const y = mix(239 - lift * 55, 226, travel);
    const scale = mix(1 + .05 * lift, 1.16, travel);
    c.save();
    c.globalAlpha = close;
    c.shadowColor = '#03100acc';
    c.shadowBlur = 22 * lift;
    c.shadowOffsetY = 14 * lift;
    rect(c, x, y, stripW * scale, stripH * scale, '#181f17');
    c.shadowColor = 'transparent';
    mountedFrame(c, x, y, scale, close);
    c.restore();
  }
  if (index === 5) {
    answerKey(c, ease(reveal('Line up', 1.3)), ease(reveal('your clone reads', .7)));
  }
}

function check() {
  assert.deepEqual(staged.map(r => r.prediction), ['approved', 'escalated', 'restored']);
  assert.deepEqual(laterRun.map(r => r.prediction), ['approved', 'blocked', 'restored']);
  assert.equal(laterRun[1].expected, 'blocked');
  assert.deepEqual(checkout, staged);
  assert.notEqual(checkout[1], staged[1]);
  assert.equal(laptopScore.correct, 3);
  assert.equal(cloneScore.correct, 2);
  assert.equal(laptopScore.total, cloneScore.total);
  assert.equal(cloneScore.total, 3);
  return true;
}

export default { title: 'Which prediction makes the commit?', beats, draw, check };
