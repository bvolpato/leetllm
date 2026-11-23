import assert from 'node:assert/strict';
import { BRANCHES } from '../../../films/decoding/fixtures.mjs';

// Keep the source vocabulary order for ties. Place each branch's strongest
// continuation against the same left edge so widths can be compared by eye.
const ranked = (items, score) => [...items].sort((a, b) => score(b) - score(a));
const branches = BRANCHES.map(({ word, p, next }) => ({
  word,
  p,
  children: ranked(
    next.map(([token, conditional]) => ({
      token,
      conditional,
      joint: p * conditional,
    })),
    (child) => child.conditional,
  ),
}));

function decode(width) {
  const first = ranked(branches, (branch) => branch.p).slice(0, width);
  const pairs = first.flatMap((branch) =>
    branch.children.map((child) => ({
      words: [branch.word, child.token],
      joint: child.joint,
    })),
  );
  return ranked(pairs, (pair) => pair.joint).slice(0, width);
}

const [greedy] = decode(1);
const [best] = decode(2);
const pct = (p) => Math.round(100 * p) + '%';

const beats = [
  {
    id: 'one-word-in-ink',
    say: 'Watch that first blank. Ran just landed in it. For the prompt “The dog,” our little model gives ran sixty percent and slept forty. We’ll add exactly two words, one token each.',
    hold: 0.75,
  },
  {
    id: 'open-the-orange-strip',
    say: 'Greedy decoding keeps the most likely token at each step. Look at the endings it can still reach. After ran, home and outside tie at thirty-five percent apiece. Our tie rule puts home first.',
    hold: 0.85,
  },
  {
    id: 'a-share-of-a-share',
    say: 'Trace the orange piece back to its left edge. Home took thirty-five percent of the sixty percent that went to ran. So the pair ran home gets twenty-one percent overall.',
    hold: 1.1,
  },
  {
    id: 'another-place',
    say: 'Turn back to the first blank. Give the decoder two places for unfinished text. This is beam search with width two. Both first words fit, so we can look one token further on both.',
    hold: 0.8,
  },
  {
    id: 'the-blue-piece',
    say: 'Same model, same strips. On the blue one, soundly takes nine tenths of the space after slept. Look where that piece ends. Which pair would you keep?',
    hold: 1.85,
  },
  {
    id: 'read-the-line',
    say: 'Nine tenths of forty percent is thirty-six percent. Slept soundly reaches past every orange piece. Greedy lost that pair when it wrote ran. Keep the two likeliest pairs. The higher one gives us our line. The dog slept soundly.',
    hold: 3.1,
  },
];

const paper = '#f9efd8';
const ink = '#302c3b';
const orange = '#aa432a';
const blue = '#274f8c';
const sand = '#baaa8d';
const left = 585;
const unit = 1920;

const clamp = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

function label(
  ctx,
  value,
  x,
  baseline,
  size,
  color,
  face = 'Lesson Sans',
  style = '400',
  align = 'left',
) {
  ctx.fillStyle = color;
  ctx.font = `${style} ${size}px "${face}"`;
  ctx.textAlign = align;
  ctx.fillText(value, x, baseline);
}

function stroke(ctx, points, color, width) {
  ctx.beginPath();
  for (const [i, [x, y]] of points.entries()) {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function ellipse(ctx, x, y, rx, ry, rotation, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

// The two poses share the long muzzle, saddle patch and striped collar.
function runningHound(c, leap) {
  c.save();
  c.translate(6 + 12 * leap, -10 * leap);
  c.rotate(-0.025 * leap);
  c.fillStyle = '#4b3940';
  c.beginPath();
  c.moveTo(125, 92);
  c.bezierCurveTo(112, 114, 97, 131, 63, 141);
  c.lineTo(33, 142);
  c.quadraticCurveTo(24, 144, 28, 148);
  c.lineTo(61, 151);
  c.quadraticCurveTo(110, 148, 149, 111);
  c.moveTo(195, 92);
  c.quadraticCurveTo(215, 118, 259, 131);
  c.lineTo(275, 148);
  c.quadraticCurveTo(283, 156, 282, 143);
  c.lineTo(269, 123);
  c.lineTo(228, 98);
  c.lineTo(220, 83);
  c.fill();

  c.beginPath();
  c.moveTo(111, 77);
  c.bezierCurveTo(75, 82, 43, 74, 23, 49);
  c.bezierCurveTo(43, 95, 82, 101, 108, 95);
  c.bezierCurveTo(122, 113, 100, 130, 62, 160);
  c.lineTo(36, 169);
  c.quadraticCurveTo(30, 176, 41, 176);
  c.lineTo(67, 171);
  c.bezierCurveTo(102, 151, 128, 126, 153, 113);
  c.bezierCurveTo(177, 99, 178, 118, 200, 114);
  c.bezierCurveTo(219, 112, 230, 89, 236, 76);
  c.quadraticCurveTo(252, 69, 265, 65);
  c.lineTo(282, 67);
  c.quadraticCurveTo(305, 72, 309, 57);
  c.lineTo(309, 53);
  c.lineTo(279, 48);
  c.quadraticCurveTo(271, 29, 250, 36);
  c.quadraticCurveTo(240, 36, 231, 51);
  c.quadraticCurveTo(209, 70, 190, 75);
  c.bezierCurveTo(164, 73, 147, 61, 125, 69);
  c.closePath();
  c.fillStyle = '#fbdfae';
  c.fill();
  c.strokeStyle = '#7b5749';
  c.lineWidth = 2.2;
  c.stroke();
  c.save();
  c.clip();
  ellipse(c, 144, 73, 43, 31, -0.2, '#58414a');
  ellipse(c, 253, 43, 15, 29, 0.7, '#5d4347');
  stroke(
    c,
    [
      [234, 50],
      [251, 77],
    ],
    orange,
    10,
  );
  stroke(
    c,
    [
      [235, 49],
      [252, 76],
    ],
    '#f8c783',
    2,
  );
  c.restore();

  c.beginPath();
  c.moveTo(201, 101);
  c.quadraticCurveTo(234, 113, 269, 108);
  c.lineTo(289, 94);
  c.quadraticCurveTo(297, 89, 292, 98);
  c.lineTo(274, 119);
  c.quadraticCurveTo(232, 131, 194, 111);
  c.closePath();
  c.fillStyle = '#efd4a5';
  c.fill();
  c.strokeStyle = '#816153';
  c.lineWidth = 1.4;
  c.stroke();
  c.beginPath();
  c.moveTo(252, 38);
  c.bezierCurveTo(237, 32, 228, 30, 216, 26);
  c.bezierCurveTo(221, 45, 232, 57, 249, 56);
  c.closePath();
  c.fillStyle = ink;
  c.fill();
  ellipse(c, 305, 55, 5.8, 3.6, -0.06, ink);
  ellipse(c, 270, 46, 2.7, 2.7, 0, ink);
  stroke(
    c,
    [
      [289, 65],
      [298, 66],
      [303, 64],
    ],
    ink,
    1.7,
  );
  c.restore();
}

function sleepingHound(c, breath) {
  c.save();
  c.translate(0, 140);
  c.scale(1, 1 + breath * 0.012);
  c.translate(0, -140);
  c.beginPath();
  c.moveTo(64, 125);
  c.bezierCurveTo(56, 86, 88, 61, 134, 58);
  c.bezierCurveTo(180, 54, 202, 66, 216, 84);
  c.bezierCurveTo(239, 97, 246, 115, 260, 121);
  c.quadraticCurveTo(272, 129, 258, 138);
  c.bezierCurveTo(252, 141, 222, 140, 204, 137);
  c.bezierCurveTo(168, 148, 80, 152, 64, 125);
  c.closePath();
  c.fillStyle = '#f7dfb4';
  c.fill();
  c.strokeStyle = '#746251';
  c.lineWidth = 2.3;
  c.stroke();
  c.save();
  c.clip();
  ellipse(c, 123, 75, 49, 29, -0.35, '#55434b');
  ellipse(c, 226, 98, 25, 34, -0.35, '#72564f');
  stroke(
    c,
    [
      [221, 82],
      [202, 115],
    ],
    blue,
    9,
  );
  stroke(
    c,
    [
      [221, 85],
      [204, 117],
    ],
    '#d6ceaf',
    2,
  );
  c.restore();
  c.beginPath();
  c.moveTo(76, 101);
  c.bezierCurveTo(47, 120, 64, 151, 107, 151);
  c.bezierCurveTo(145, 158, 170, 144, 194, 127);
  c.bezierCurveTo(156, 142, 117, 144, 104, 131);
  c.quadraticCurveTo(81, 113, 76, 101);
  c.closePath();
  c.fillStyle = '#655052';
  c.fill();
  c.beginPath();
  c.moveTo(216, 90);
  c.bezierCurveTo(202, 88, 185, 94, 187, 104);
  c.quadraticCurveTo(191, 126, 210, 127);
  c.quadraticCurveTo(224, 121, 216, 90);
  c.fillStyle = ink;
  c.fill();
  c.beginPath();
  c.moveTo(225, 114);
  c.quadraticCurveTo(230, 120, 236, 117);
  c.strokeStyle = ink;
  c.lineWidth = 2.5;
  c.stroke();
  ellipse(c, 261, 130, 6, 4, 0.22, ink);
  c.beginPath();
  c.moveTo(110, 115);
  c.bezierCurveTo(118, 96, 148, 97, 157, 108);
  c.moveTo(143, 131);
  c.bezierCurveTo(162, 121, 173, 128, 182, 131);
  c.moveTo(204, 137);
  c.quadraticCurveTo(213, 132, 226, 137);
  c.strokeStyle = '#a5997d';
  c.lineWidth = 1.5;
  c.stroke();
  c.restore();
}

function vignette(c, row, seconds, leap, rest, finish = 0) {
  c.save();
  if (row === 0) c.globalAlpha *= 1 - finish;
  c.translate(mix(80, 95, finish), row === 0 ? 282 : mix(583, 309, finish));
  const magnification = row === 0 ? 1.42 : mix(1.42, 2.9, finish);
  c.scale(magnification, magnification);
  if (row === 0) {
    ellipse(c, 147, 91, 115, 65, -0.1, '#f3c391');
    ellipse(c, 196, 44, 24, 24, 0, '#e78448');
    for (const [x, y, n] of [
      [29, 88, 37],
      [9, 102, 47],
      [26, 116, 25],
    ]) {
      stroke(
        c,
        [
          [x, y],
          [x + n, y - 4],
        ],
        orange,
        2,
      );
    }
    ellipse(c, 158, 168, 71 - 15 * leap, 4, 0, '#d4b695');
    runningHound(c, leap);
  } else {
    ellipse(c, 153, 88, 116, 69, 0.08, '#c8d7df');
    c.save();
    c.beginPath();
    c.arc(126, 55, 20, 0, 2 * Math.PI);
    c.clip();
    c.fillStyle = blue;
    c.fillRect(105, 34, 42, 42);
    ellipse(c, 135, 47, 19, 19, 0, '#c8d7df');
    c.restore();
    for (const [x, y, r] of [
      [167, 44, 2.1],
      [185, 57, 1.7],
      [92, 48, 1.6],
    ])
      ellipse(c, x, y, r, r, 0, blue);
    ellipse(c, 157, 149, 116, 13, 0, '#8198a7');
    ellipse(c, 157, 146, 111, 10, 0, '#9db1b9');
    sleepingHound(c, Math.sin(seconds * 1.5) * rest);
  }
  c.restore();
}

function paperGround(c) {
  c.fillStyle = paper;
  c.fillRect(0, 0, 1920, 1080);
  c.fillStyle = '#e9dfc8';
  c.fillRect(0, 0, 25, 1080);
  const fold = c.createLinearGradient(22, 0, 75, 0);
  fold.addColorStop(0, '#b8a88e');
  fold.addColorStop(0.12, '#d3c2a5');
  fold.addColorStop(0.52, '#eee2c7');
  fold.addColorStop(1, paper);
  c.fillStyle = fold;
  c.fillRect(22, 0, 54, 1080);
  // Small, fixed flecks keep the print grain still when the letters move.
  c.fillStyle = 'rgba(94,66,35,0.065)';
  let seed = 193;
  for (let i = 0; i < 1850; i++) {
    seed = (1664525 * seed + 1013904223) >>> 0;
    const x = seed % 1920;
    seed = (1664525 * seed + 1013904223) >>> 0;
    c.fillRect(x, seed % 1080, 1 + (i % 4), 1);
  }
}

function shot(clock) {
  const { index, elapsed, reveal } = clock;
  const cue = (i, phrase, span) => (index > i ? 1 : index < i ? 0 : smooth(reveal(phrase, span)));
  const turn = index === 3 ? smooth(elapsed / 0.9) : Number(index > 3);
  const rebuilt = cue(4, 'Same model', 1.35);
  return {
    land: smooth(clock.seconds / 0.95),
    prune: cue(0, 'For the prompt', 0.8) * (1 - turn),
    splitRun: cue(1, 'Look at the endings', 1.0) * (1 - turn) + rebuilt,
    home: cue(1, 'Our tie rule', 0.8) * (1 - turn),
    firstPairScore: cue(2, 'Trace the orange piece', 0.7) * (1 - turn),
    turn,
    splitSleep: cue(4, 'On the blue one', 1.35),
    compare: cue(4, 'Look where', 0.8),
    bothScores: cue(5, 'Nine tenths', 0.65),
    finish: cue(5, 'Keep the two', 1.6),
    writeFinal: cue(5, 'The higher one', 1.15),
  };
}

const colors = [
  ['#aa432a', '#c86842', '#e7a274'],
  ['#274f8c', '#7193b6'],
];

function strip(c, index, y, split, back, score, compare) {
  const branch = branches[index];
  const width = unit * branch.p;
  const color = colors[index][0];
  const h = 120;
  label(c, branch.word, left, y - 24, 66, color, 'Lesson Serif', 'italic');
  const wordWidth = c.measureText(branch.word).width;
  label(c, pct(branch.p), left + wordWidth + 25, y - 25, 45, ink, 'Lesson Mono');
  c.save();
  c.beginPath();
  c.rect(left, y, width, h);
  c.clip();
  c.fillStyle = color;
  c.fillRect(left, y, width, h);
  let x = left;
  for (const [i, child] of branch.children.entries()) {
    const w = unit * child.joint;
    c.save();
    c.globalAlpha *= split;
    c.fillStyle = colors[index][i];
    c.fillRect(x, y, w + 0.2, h);
    if (i)
      stroke(
        c,
        [
          [x, y],
          [x, y + h],
        ],
        paper,
        6,
      );
    const outside = w < 140;
    if (!outside) {
      const textColor = index === 0 && i > 0 ? '#2d2023' : '#fff8e6';
      const centerX = x + w / 2;
      label(
        c,
        child.token,
        centerX,
        y + mix(76, 52, score),
        49,
        textColor,
        'Lesson Serif',
        '400',
        'center',
      );
      if (score) {
        c.globalAlpha *= score;
        label(c, pct(child.joint), centerX, y + 98, 40, textColor, 'Lesson Mono', '400', 'center');
      }
    }
    c.restore();
    x += w;
  }
  // Fine interval marks carry through each split, preserving the original scale.
  for (let i = 1; i < branch.p * 100; i++) {
    const tick = left + (unit * i) / 100;
    stroke(
      c,
      [
        [tick, y + h - 1],
        [tick, y + h - (i % 5 === 0 ? 12 : 5)],
      ],
      'rgba(255,247,225,.52)',
      2,
    );
  }
  if (back > 0) {
    c.save();
    c.globalAlpha *= back;
    c.fillStyle = '#d7d3c5';
    c.fillRect(left, y, width, h);
    for (let dx = -h; dx < width; dx += 17)
      stroke(
        c,
        [
          [left + dx, y + h],
          [left + dx + h, y],
        ],
        '#c5c3b6',
        2,
      );
    c.fillStyle = '#d7d3c5';
    c.fillRect(left + 26, y + 23, 225, 61);
    label(c, 'set aside', left + 40, y + 67, 39, '#514f57', 'Lesson Sans');
    c.restore();
  }
  c.restore();
  if (index === 1 && split > 0) {
    c.save();
    c.globalAlpha *= split;
    const mid = left + width - (unit * branch.children[1].joint) / 2;
    stroke(
      c,
      [
        [mid, y + 31],
        [mid + 34, y + 13],
        [left + width + 47, y + 13],
      ],
      blue,
      2.5,
    );
    label(c, 'outside', left + width + 61, y + 26, 37, blue, 'Lesson Serif');
    if (score) {
      c.globalAlpha *= score;
      label(c, pct(branch.children[1].joint), left + width + 61, y + 71, 34, blue, 'Lesson Mono');
    }
    c.restore();
  }
  if (compare > 0) {
    const end = left + unit * branch.children[0].joint;
    c.save();
    c.globalAlpha *= compare;
    stroke(
      c,
      [
        [left, y + h + 10],
        [end, y + h + 10],
      ],
      color,
      5,
    );
    stroke(
      c,
      [
        [end, y + h + 3],
        [end, y + h + 18],
      ],
      color,
      5,
    );
    c.restore();
  }
}

function sentence(c, state) {
  const y = 224,
    size = 120,
    prefixX = 130;
  label(c, 'The dog', prefixX, y, size, ink, 'Lesson Serif');
  const first = prefixX + c.measureText('The dog ').width;
  c.font = `italic ${size}px "Lesson Serif"`;
  const writtenWidth = c.measureText(greedy.words[0] + ' ').width;
  const lastWidth = c.measureText(best.words[0] + ' ').width;
  const next =
    first + mix(mix(275, writtenWidth, state.land * (1 - state.turn)), lastWidth, state.writeFinal);
  const write = (word, x, amount, color, travel = false) => {
    if (amount <= 0) return;
    c.save();
    c.globalAlpha *= clamp(amount * 2);
    const rise = Math.sin(amount * Math.PI);
    const dx = travel ? mix(left - x, 0, amount) : 0;
    const dy = travel ? mix(137, 0, amount) - rise * 70 : (1 - amount) * 20;
    c.translate(x + dx, y + dy);
    c.rotate(travel ? -rise * 0.07 : 0);
    label(c, word, 0, 0, size, color, 'Lesson Serif', 'italic');
    c.restore();
  };
  const orangeFirst = state.land * (1 - state.turn);
  const final = state.writeFinal;
  const blank = (x, w, opacity) => {
    c.save();
    c.globalAlpha *= clamp(opacity);
    stroke(
      c,
      [
        [x, y + 8],
        [x + w, y + 8],
      ],
      sand,
      4,
    );
    c.restore();
  };
  blank(first, 238, 1 - Math.max(orangeFirst, final));
  blank(next, 380, 1 - Math.max(state.home, final));
  if (state.turn < 1) {
    c.save();
    c.globalAlpha *= 1 - state.turn;
    write(greedy.words[0], first, state.land, orange, true);
    write(greedy.words[1], next, state.home, orange);
    c.restore();
  }
  if (final > 0) {
    write(best.words[0], first, clamp(final * 1.65), blue);
    write(best.words[1], next, clamp((final - 0.23) / 0.77), blue);
  }
}

function equation(c, branch, opacity) {
  if (opacity === 0) return;
  const child = branch.children[0];
  c.save();
  c.globalAlpha *= opacity;
  const expression = `${pct(branch.p)} × ${pct(child.conditional)} = ${pct(child.joint)}`;
  label(c, expression, left, 934, 51, ink, 'Lesson Mono');
  c.restore();
}

function draw(c, clock) {
  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  paperGround(c);
  const s = shot(clock);
  const labelText = s.turn < 0.5 ? 'Greedy decoding' : 'Beam search  /  width 2';
  label(c, labelText, 132, 82, 40, ink, 'Lesson Sans', '600');
  sentence(c, s);
  const leap = Math.sin(Math.PI * clamp(clock.seconds / 1.08));
  vignette(c, 0, clock.seconds, leap, 0);
  vignette(c, 1, clock.seconds, 0, 1 - s.prune);
  strip(
    c,
    0,
    428,
    s.splitRun,
    0,
    Math.max(s.firstPairScore, s.bothScores),
    Math.max(s.firstPairScore, s.compare),
  );
  strip(c, 1, 728, s.splitSleep, s.prune, s.bothScores, s.compare);
  if (s.compare > 0) {
    const x = left + unit * greedy.joint;
    c.save();
    c.globalAlpha *= s.compare;
    c.setLineDash([5, 12]);
    stroke(
      c,
      [
        [x, 570],
        [x, 714],
      ],
      '#927c6d',
      3.4,
    );
    c.restore();
  }
  equation(c, branches[0], s.firstPairScore);
  equation(c, branches[1], s.bothScores);
  if (s.finish > 0) {
    // Turn to the printed ending. The two surviving strips keep their widths.
    const edge = mix(2010, -100, s.finish);
    c.save();
    c.beginPath();
    c.moveTo(edge + 50, 0);
    c.lineTo(2100, 0);
    c.lineTo(2100, 1080);
    c.lineTo(edge - 50, 1080);
    c.closePath();
    c.clip();
    paperGround(c);
    label(c, labelText, 132, 82, 40, ink, 'Lesson Sans', '600');
    sentence(c, s);
    vignette(c, 1, clock.seconds, 0, 1, 1);
    for (const [i, pair] of [greedy, best].entries()) {
      const x = 1015,
        y = i === 0 ? 470 : 676;
      const w = unit * pair.joint;
      const color = i === 0 ? orange : blue;
      label(c, pair.words.join(' '), x, y - 24, 56, color, 'Lesson Serif', 'italic');
      c.fillStyle = color;
      c.fillRect(x, y, w, 68);
      label(c, pct(pair.joint), x + w - 19, y + 49, 43, '#fff8e6', 'Lesson Mono', '400', 'right');
    }
    c.restore();
    if (s.finish < 1) {
      c.save();
      c.transform(1, 0, -100 / 1080, 1, edge + 50, 0);
      const curl = c.createLinearGradient(-60, 0, 20, 0);
      curl.addColorStop(0, 'rgba(80,58,47,0)');
      curl.addColorStop(0.56, 'rgba(80,58,47,.22)');
      curl.addColorStop(0.6, '#e2cfad');
      curl.addColorStop(0.78, '#fff8e9');
      curl.addColorStop(1, 'rgba(249,239,216,0)');
      c.fillStyle = curl;
      c.fillRect(-60, 0, 80, 1080);
      c.restore();
    }
  }
  c.restore();
}

function check() {
  assert.equal(
    branches.reduce((sum, b) => sum + b.p, 0),
    1,
  );
  for (const b of branches) {
    assert.ok(Math.abs(b.children.reduce((sum, ch) => sum + ch.conditional, 0) - 1) < 1e-12);
    assert.ok(Math.abs(b.children.reduce((sum, ch) => sum + ch.joint, 0) - b.p) < 1e-12);
  }
  assert.deepEqual(greedy.words, ['ran', 'home']);
  assert.equal(branches[0].children[0].conditional, branches[0].children[1].conditional);
  assert.deepEqual(
    decode(2).map((p) => p.words),
    [
      ['slept', 'soundly'],
      ['ran', 'home'],
    ],
  );
  assert.deepEqual(
    branches.map((b) => b.children.map((ch) => pct(ch.joint))),
    [
      ['21%', '21%', '18%'],
      ['36%', '4%'],
    ],
  );
  assert.ok(best.joint > greedy.joint);
  return true;
}

export default { title: 'The dog’s next two words', beats, draw, check };
