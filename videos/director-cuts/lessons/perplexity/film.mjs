import assert from 'node:assert/strict';

// The large type is the held-out text. Each small piece of type is 1%
// of the next-token distribution at that position.
const designs = {
  A: [
    '.....##......',
    '....#####....',
    '....#####....',
    '...###.###...',
    '...###.###...',
    '...###.###...',
    '..###...###..',
    '..###...###..',
    '.###########.',
    '.###########.',
    '.###.....###.',
    '.###.....###.',
    '####.....####',
    '####.....####',
    '####.....####',
  ],
  B: [
    '#########....',
    '##########...',
    '###.....###..',
    '###......##..',
    '###......##..',
    '###.....###..',
    '#########....',
    '#########....',
    '###.....###..',
    '###......##..',
    '###......##..',
    '###.....###..',
    '##########...',
    '#########....',
  ],
};

function makeLetter(token, center, focusColumn, focusRow) {
  const rows = designs[token];
  const cells = [];
  for (const [row, line] of rows.entries()) {
    for (const [column, mark] of [...line].entries()) {
      if (mark !== '#') continue;
      cells.push({
        x: center + (column - (token === 'A' ? 6 : 5)) * 42,
        y: 209 + row * 453 / (rows.length - 1),
        distance: (column - focusColumn) ** 2 + (row - focusRow) ** 2,
      });
    }
  }
  cells.sort((a, b) => a.distance - b.distance || a.y - b.y || a.x - b.x);
  return { token, other: token === 'A' ? 'B' : 'A', center, cells };
}

const first = makeLetter('A', 565, 6, 9);
const second = makeLetter('B', 1355, 9, 4);
const originalMatches = 25;
const revisedMatches = 1;

function distribution(letter, matches) {
  return letter.cells.map((_, i) => i < matches ? letter.token : letter.other);
}

function score(matchesOnB) {
  const probabilities = [first, second].map((letter, i) => {
    const type = distribution(letter, i === 0 ? 1 : matchesOnB);
    return type.filter(mark => mark === letter.token).length / type.length;
  });
  const meanSurprise = probabilities.reduce((sum, p) => sum - Math.log(p), 0) / probabilities.length;
  return { probabilities, perplexity: Math.exp(meanSurprise) };
}

const beats = [
  {
    id: 'read-the-impression',
    say: "Step back a little. See the big A? That's the first letter on our test page. This language model has just two tokens, A and B.",
    hold: 1,
  },
  {
    id: 'read-the-ink',
    say: "Look at the ink. Each little letter carries one percent of the model's prediction before it saw the A. Can you find the share that counts? There's one little A in the whole impression.",
    hold: 1.1,
  },
  {
    id: 'unfold',
    say: 'After reading A, the model predicts the next letter. Unfold the page. We got a B. This time twenty-five of the hundred marks match the printed letter. One chance in four.',
    hold: 0.9,
  },
  {
    id: 'read-the-pair',
    say: 'One chance in a hundred, then one in four. Perplexity uses the reciprocal of each chance. We multiply a hundred by four and take the square root. That gives us the geometric mean for our two letters. Twenty.',
    hold: 1.2,
  },
  {
    id: 'change-the-ink',
    say: 'Keep the page open. Watch what happens if the model puts more of its second prediction on A. How many little B’s can you still find?',
    hold: 1.8,
  },
  {
    id: 'same-page',
    say: 'Just one. Now each printed letter got one chance in a hundred. Each was as surprising as one choice out of a hundred equally likely options. The perplexity is a hundred. You can still see the whole alphabet on the page.',
    hold: 3.3,
  },
];

const ink = '#282d69';
const vermilion = '#bb3529';
const paper = '#ffe9cc';
const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => clamp(n) ** 2 * (3 - 2 * clamp(n));
const mix = (a, b, t) => a + (b - a) * t;

function text(ctx, value, x, y, size, color, family = 'Sans', weight = 400, align = 'left') {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
}

function line(ctx, x, y, endX, endY, color, width) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

// Fixed fibres stay attached to the stock during the camera move.
const fibres = [];
let seed = 714;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
for (let i = 0; i < 1100; i++) {
  fibres.push([random() * 880, random() * 930, 0.45 + random() * 2.8, 0.35 + random()]);
}

function leaf(ctx, left, right, isRight) {
  const top = 57, bottom = 987;
  ctx.beginPath();
  ctx.moveTo(left, top);
  for (let x = left + 12; x < right; x += 12) ctx.lineTo(x, top + Math.sin(x * 9) * 0.9);
  ctx.lineTo(right, top);
  ctx.lineTo(right, bottom);
  for (let x = right - 12; x > left; x -= 12) ctx.lineTo(x, bottom + Math.sin(x * 5) * 1.2);
  ctx.lineTo(left, bottom);
  ctx.closePath();
  ctx.shadowColor = '#2e142c59';
  ctx.shadowBlur = 13;
  ctx.shadowOffsetY = 9;
  ctx.fillStyle = paper;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  const shade = ctx.createLinearGradient(left, 0, right, 0);
  if (isRight) {
    shade.addColorStop(0, '#97653c45');
    shade.addColorStop(0.035, '#ac7b4814');
    shade.addColorStop(0.16, '#fff4cf17');
    shade.addColorStop(1, '#fff8dc22');
  } else {
    shade.addColorStop(0, '#fff6dc30');
    shade.addColorStop(0.85, '#fff0cc11');
    shade.addColorStop(0.99, '#b8946e1c');
    shade.addColorStop(1, '#fff5dba6');
  }
  ctx.fillStyle = shade;
  ctx.fillRect(left, top + 1, right - left, bottom - top - 2);
  ctx.fillStyle = '#81522d27';
  for (const [x, y, w, h] of fibres) ctx.fillRect(left + x, top + y, w, h);
}

function printMarks(ctx, letter, matches) {
  const type = distribution(letter, matches);
  ctx.font = '700 41px "Lesson Sans"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (const [i, cell] of letter.cells.entries()) {
    const matching = type[i] === letter.token;
    ctx.fillStyle = matching ? vermilion : ink;
    ctx.fillText(type[i], cell.x, cell.y + 15);
  }
}

function loop(ctx, cell, fraction) {
  if (!fraction) return;
  ctx.beginPath();
  ctx.ellipse(cell.x, cell.y, 25, 22, -0.37, -1.9, -1.9 + fraction * Math.PI * 2.11);
  ctx.strokeStyle = vermilion;
  ctx.lineWidth = 2.6;
  ctx.stroke();
}

function loupe(ctx, letter, matches, amount, home, offset = 0) {
  if (amount <= 0) return;
  const cell = letter.cells[0];
  const x = mix(home, cell.x + offset, amount);
  const y = cell.y + (1 - amount) * 160;
  const r = 96;
  ctx.save();
  ctx.globalAlpha *= clamp(amount * 3);
  ctx.beginPath();
  ctx.arc(x + 6, y + 9, r, 0, 2 * Math.PI);
  ctx.fillStyle = '#37283e33';
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r - 5, 0, 2 * Math.PI);
  ctx.clip();
  ctx.fillStyle = '#fff0d7';
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.translate(x, y);
  ctx.scale(2.5, 2.5);
  ctx.translate(-x, -y);
  printMarks(ctx, letter, matches);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#453c59';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI * 1.04, Math.PI * 1.56);
  ctx.strokeStyle = '#bfb4b7';
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.restore();
}

function tint(ctx, opacity, paint) {
  if (!opacity) return;
  ctx.save();
  ctx.globalAlpha *= opacity;
  paint();
  ctx.restore();
}

function shareLabel(ctx, letter, matches, ratio) {
  const annotate = value => text(ctx, value, letter.center, 742, 54, vermilion, 'Serif', 400, 'center');
  tint(ctx, clamp(1 - 2 * ratio), () => annotate(matches + '% on ' + letter.token));
  tint(ctx, clamp(2 * ratio - 1), () => annotate('1 in ' + letter.cells.length / matches));
}

function formula(ctx, count, showRadical, showResult) {
  const { probabilities, perplexity } = score(count);
  const denominators = probabilities.map(p => Math.round(1 / p));
  line(ctx, 231, 782, 1693, 782, '#65587966', 2);
  text(ctx, 'Perplexity', 292, 879, 62, ink, 'Serif');
  tint(ctx, showRadical, () => {
    const y = 866;
    const terms = denominators.join(' × ');
    ctx.font = '400 55px "Lesson Mono"';
    const length = ctx.measureText(terms).width;
    const x = 764;
    ctx.beginPath();
    ctx.moveTo(x - 38, y - 17);
    ctx.lineTo(x - 29, y - 22);
    ctx.lineTo(x - 17, y + 6);
    ctx.lineTo(x - 5, y - 57);
    ctx.lineTo(x + length + 8, y - 57);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 4;
    ctx.stroke();
    text(ctx, terms, x + 3, y, 55, ink, 'Mono');
  });
  tint(ctx, showResult, () => {
    text(ctx, '=', 1205, 873, 63, ink, 'Serif');
    text(ctx, String(Math.round(perplexity)), 1312, 893, 131, vermilion, 'Serif');
  });
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  const cue = (n, phrase, duration) => index < n ? 0 : index > n ? 1 : ease(reveal(phrase, duration));
  const pull = ease(elapsed / 3.6);
  const unfold = cue(2, 'Unfold the page', 1.7);
  const withdraw = unfold;
  const lensA = cue(1, 'Look at the ink', 1.2);
  const locateA = cue(1, 'Can you find', 1.25);
  const change = cue(4, 'if the model puts', 2.7);
  const locateB = cue(4, 'Keep the page open', 1.2);
  const settle = cue(5, 'Now each printed letter', 1.6);
  const ratios = Math.max(settle, cue(3, 'One chance', 0.55) * (1 - locateB));
  const matches = Math.round(mix(originalMatches, revisedMatches, change));

  const camX = index === 0 ? mix(first.cells[0].x + 26, 536, pull) : mix(536, 960, withdraw);
  const camY = index === 0 ? mix(first.cells[0].y, 439, pull) : mix(439, 510, withdraw);
  const zoom = index === 0 ? 1.52 + 5 * (1 - pull) ** 2 : mix(1.52, 1, withdraw);
  const tilt = mix(-0.012, -0.006, withdraw);
  ctx.fillStyle = '#b76253';
  ctx.fillRect(0, 0, 1920, 1080);
  const light = ctx.createLinearGradient(0, 0, 1920, 1080);
  light.addColorStop(0, '#df9281');
  light.addColorStop(1, '#984d51');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.save();
  ctx.translate(960, 540);
  ctx.scale(zoom, zoom);
  ctx.rotate(tilt);
  ctx.translate(-camX, -camY);

  leaf(ctx, 80, 960, false);
  text(ctx, 'Test page', 168, 145, 46, ink, 'Serif');
  printMarks(ctx, first, 1);
  const readA = cue(1, "There's one little A", 0.65);
  tint(ctx, readA, () => shareLabel(ctx, first, 1, ratios));
  loop(ctx, first.cells[0], readA * withdraw);
  loupe(ctx, first, 1, lensA * (1 - withdraw), first.center + 240, (1 - locateA) * 85);

  if (unfold > 0) {
    ctx.save();
    ctx.translate(960, 0);
    ctx.transform(unfold, -0.09 * Math.sin(Math.PI * unfold), 0, 1, 0, 0);
    ctx.translate(-960, 0);
    leaf(ctx, 960, 1840, true);
    printMarks(ctx, second, matches);
    const readB = cue(2, 'This time', 0.6);
    tint(ctx, readB, () => shareLabel(ctx, second, matches, ratios));
    loop(ctx, second.cells[0], settle);
    loupe(ctx, second, matches, locateB * (1 - settle), second.center + 325);
    ctx.restore();
  }

  const readPair = cue(3, 'Perplexity uses', 0.6);
  const restart = cue(4, 'Watch what happens', 0.45);
  const newAnswer = cue(5, 'Now each printed letter', 0.8);
  const firstEquation = readPair * (1 - restart);
  const equation = Math.max(firstEquation, newAnswer);
  tint(ctx, equation, () => formula(ctx, newAnswer ? revisedMatches : originalMatches,
    Math.max(cue(3, 'We multiply', 0.65) * (1 - restart), newAnswer),
    Math.max(cue(3, 'take the square root', 0.55) * (1 - restart), newAnswer)));
  ctx.restore();
}

function check() {
  for (const letter of [first, second]) assert.equal(letter.cells.length, 100);
  assert.deepEqual([first.token, second.token], ['A', 'B']);
  for (const [matches, expected] of [[25, 20], [4, 50], [1, 100]]) {
    const { probabilities, perplexity } = score(matches);
    assert.deepEqual(probabilities, [0.01, matches / 100]);
    assert.ok(Math.abs(perplexity - expected) < 1e-10);
    assert.ok(Math.abs(1 / Math.sqrt(probabilities[0] * probabilities[1]) - perplexity) < 1e-10);
  }
}

export default { title: 'How can two letters score a hundred?', beats, draw, check };
