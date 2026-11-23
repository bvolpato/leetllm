import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { probes } from '../../../films/benchmark-audits/fixtures.mjs';

const title = 'Two passes at the return desk';

const beats = [
  {
    id: 'wet-ink',
    say: 'That answer just earned a pass. Read it as a borrower. According to those words, could you bring the book back on Saturday?',
    hold: 1.25,
  },
  {
    id: 'due-slip',
    say: 'You could if you followed the answer. Now look at the due slip. By Saturday the book would already be late. The librarian marks this answer wrong.',
    hold: 0.6,
  },
  {
    id: 'two-matches',
    say: 'Here’s how this benchmark grades a reply. The checker looks for books and Friday, ignoring capitals. Both are on the page. The word after changes the deadline and the answer still gets credit.',
    hold: 0.6,
  },
  {
    id: 'short-friday',
    say: 'Try another answer. Return the books by Friday, with the day written the short way. The librarian accepts that deadline. How will the same checker grade it?',
    hold: 1.5,
  },
  {
    id: 'missing-letters',
    say: 'See where the ink landed? The checker found books. It needed three more letters to match Friday. This time it rejected an answer a borrower could safely follow.',
    hold: 0.6,
  },
  {
    id: 'control',
    say: 'For comparison, try the library’s own wording. Borrowed books are due on Friday. Both marks belong here. Count the passes in each column.',
    hold: 1.35,
  },
  {
    id: 'equal-counts',
    say: 'Two out of three, both ways. Trace those totals back to the answers. One mistaken pass canceled out one mistaken fail in the count. To audit a benchmark checker, compare each mark with an independent judgment on the same answer.',
    hold: 2.3,
  },
];

const terms = ['books', 'friday'];
const lineBreaks = {
  'changed-deadline': ['Books are due', 'after Friday.'],
  abbreviation: ['Return the books', 'by Fri.'],
  literal: ['Borrowed books are', 'due on Friday.'],
};
const answers = Object.keys(lineBreaks).map((id) => {
  const probe = probes.find((item) => item.id === id);
  const hits = terms.filter((term) => probe.answer.toLowerCase().includes(term));
  return { ...probe, hits, pass: hits.length === terms.length, lines: lineBreaks[id] };
});
const checkerTotal = answers.filter((answer) => answer.pass).length;
const librarianTotal = answers.filter((answer) => answer.reviewed).length;

function check() {
  assert.deepEqual(
    answers.map((a) => a.lines.join(' ')),
    answers.map((a) => a.answer),
  );
  assert.deepEqual(
    answers.map((a) => a.hits),
    [terms, ['books'], terms],
  );
  assert.deepEqual(
    answers.map((a) => [a.pass, a.reviewed]),
    [
      [true, false],
      [false, true],
      [true, true],
    ],
  );
  assert.equal(checkerTotal, 2);
  assert.equal(checkerTotal, librarianTotal);
  assert.equal(answers.filter((a) => a.pass !== a.reviewed).length, 2);
}

const ink = '#282a34';
const violet = '#564180';
const pencil = '#ad4232';
const clamp = (n) => Math.max(0, Math.min(1, n));
function ease(n) {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
}

function text(c, words, x, y, size, opts = {}) {
  c.fillStyle = opts.color ?? ink;
  c.font = (opts.style ?? 'normal') + ' ' + size + 'px "Lesson ' + (opts.face ?? 'Serif') + '"';
  c.textAlign = opts.align ?? 'left';
  c.fillText(words, x, y);
}

function line(c, x1, y1, x2, y2, color, width = 1) {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}

function box(c, x, y, w, h, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}

function ellipse(c, x, y, rx, ry, color) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}

function gradient(c, x1, y1, x2, y2, stops) {
  const g = c.createLinearGradient(x1, y1, x2, y2);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

// A two-ink linocut on the library's borrowing pocket.
function owl(c, x, y) {
  c.save();
  c.translate(x, y);
  const brown = '#654139';
  const buff = '#e2a67e';
  c.fillStyle = brown;
  c.beginPath();
  c.moveTo(-55, -69);
  c.quadraticCurveTo(-47, -63, -28, -56);
  c.quadraticCurveTo(-4, -68, 27, -57);
  c.lineTo(55, -72);
  c.quadraticCurveTo(49, -42, 49, -9);
  c.bezierCurveTo(66, 23, 51, 51, 22, 63);
  c.quadraticCurveTo(3, 70, -20, 61);
  c.bezierCurveTo(-54, 52, -61, 18, -49, -6);
  c.closePath();
  c.fill();
  for (const side of [-1, 1]) {
    c.save();
    c.scale(side, 1);
    ellipse(c, 21, -29, 21, 19, buff);
    ellipse(c, 20, -29, 12, 13, brown);
    ellipse(c, 17, -33, 3.5, 4, buff);
    line(c, 5, -54, 40, -41, brown, 6);
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.moveTo(41 - i * 2, 2 + i * 6);
      c.quadraticCurveTo(47 - i * 3, 20 + i * 4, 29 - i * 2, 43 + i * 2);
      c.strokeStyle = buff;
      c.lineWidth = 2.8;
      c.stroke();
    }
    c.restore();
  }
  c.fillStyle = buff;
  c.beginPath();
  c.moveTo(-7, -15);
  c.lineTo(7, -15);
  c.lineTo(0, -1);
  c.fill();
  for (let row = 0; row < 4; row++) {
    for (let k = -1; k <= 1; k++) {
      const px = k * 14 + (row % 2 ? 3 : -3),
        py = row * 10 + 4;
      line(c, px - 4, py, px, py + 5, buff, 2);
      line(c, px, py + 5, px + 4, py, buff, 2);
    }
  }
  for (const side of [-1, 1]) {
    c.save();
    c.scale(side, 1);
    c.fillStyle = brown;
    c.beginPath();
    c.moveTo(0, 73);
    c.bezierCurveTo(26, 54, 54, 65, 82, 54);
    c.lineTo(82, 70);
    c.bezierCurveTo(57, 80, 28, 68, 0, 83);
    c.fill();
    for (let i = 0; i < 3; i++) line(c, 11 + i * 5, 58, 9 + i * 5, 69, brown, 3);
    c.restore();
  }
  c.restore();
}

function flecks(c, x, y, w, h, count, color, seed = 7) {
  let value = seed;
  const random = () => (value = (Math.imul(value, 1664525) + 1013904223) >>> 0) / 4294967296;
  c.fillStyle = color;
  for (let i = 0; i < count; i++) {
    c.fillRect(x + random() * w, y + random() * h, 1 + random() * 3, 1 + random());
  }
}

function book(c) {
  c.save();
  c.translate(256, 524);
  c.rotate(-0.085);
  c.translate(-258, -385);
  c.shadowColor = '#32304e82';
  c.shadowBlur = 25;
  c.shadowOffsetX = 13;
  c.shadowOffsetY = 21;
  box(c, -250, -18, 829, 828, 18, '#783440');
  c.shadowColor = 'transparent';
  box(c, -250, -17, 825, 819, 13, '#984957');
  for (let i = 0; i < 136; i++) line(c, -210, i * 6 - 12, 570, i * 6 - 12, '#f2a79532', 1.4);
  for (let i = 0; i < 185; i++) line(c, -170 + i * 4, -12, -170 + i * 4, 794, '#441a3426');
  box(c, -242, -2, 800, 787, 9, '#a18c75');
  for (let i = 6; i >= 0; i--) {
    box(c, -245, -2 - i, 795 + i, 779 + i * 1.3, 7, i % 2 ? '#d6c7a9' : '#b9a990');
  }
  box(c, -245, -6, 800, 779, 7, '#e5d7b8');
  // Repeating leaf cuts on the endpaper and the shadow of the sewn hinge.
  c.save();
  c.beginPath();
  c.rect(-241, -5, 792, 773);
  c.clip();
  for (let j = 0; j < 22; j++) {
    for (let i = -8; i < 20; i++) {
      const x = i * 41 + (j % 2) * 20,
        y = j * 38;
      c.strokeStyle = '#948f7939';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(x - 9, y + 8);
      c.quadraticCurveTo(x - 9, y - 4, x + 10, y - 8);
      c.quadraticCurveTo(x + 7, y + 4, x - 9, y + 8);
      c.stroke();
    }
  }
  c.fillStyle = gradient(c, -80, 0, 35, 0, [
    [0, '#b9a987'],
    [0.45, '#bba98b'],
    [0.52, '#897760'],
    [0.56, '#cbbb9d'],
    [1, '#ecdfc300'],
  ]);
  c.fillRect(-80, -6, 115, 784);
  c.restore();

  // A real due slip is the fixed reference throughout the comparison.
  c.shadowColor = '#41302c51';
  c.shadowBlur = 10;
  c.shadowOffsetX = 3;
  c.shadowOffsetY = 7;
  box(c, 38, 86, 435, 573, 4, '#fbefd4');
  c.shadowColor = 'transparent';
  line(c, 64, 116, 448, 116, '#987960', 2);
  text(c, 'DATE DUE', 255, 172, 44, {
    face: 'Sans',
    style: '600',
    align: 'center',
    color: '#5f4c41',
  });
  line(c, 64, 194, 447, 194, '#987960', 2.5);
  for (let i = 0; i < 5; i++) line(c, 62, 298 + i * 62, 449, 298 + i * 62, '#bbaa97', 2);
  text(c, 'Friday', 254, 278, 90, { align: 'center', color: violet });
  flecks(c, 53, 94, 409, 397, 890, '#916c4915');

  c.shadowColor = '#412e343c';
  c.shadowBlur = 10;
  c.shadowOffsetX = 4;
  c.shadowOffsetY = 7;
  c.fillStyle = gradient(c, 26, 356, 530, 690, [
    [0, '#e9b491'],
    [0.55, '#e3a780'],
    [1, '#cd8a68'],
  ]);
  c.beginPath();
  c.moveTo(20, 353);
  c.lineTo(100, 353);
  c.bezierCurveTo(134, 353, 130, 395, 170, 395);
  c.lineTo(336, 395);
  c.bezierCurveTo(375, 395, 371, 353, 407, 353);
  c.lineTo(496, 353);
  c.lineTo(496, 724);
  c.lineTo(20, 724);
  c.closePath();
  c.fill();
  c.shadowColor = 'transparent';
  line(c, 32, 359, 32, 707, '#aa7359', 2);
  line(c, 484, 359, 484, 707, '#aa7359', 2);
  line(c, 32, 707, 484, 707, '#aa7359', 2);
  flecks(c, 35, 401, 446, 300, 950, '#6c43321f');
  owl(c, 257, 512);
  text(c, 'Public Library', 257, 652, 49, { color: '#603d35', align: 'center' });
  c.restore();
}

let background;
function desk() {
  if (background) return background;
  background = createCanvas(1920, 1080);
  const c = background.getContext('2d');
  c.fillStyle = gradient(c, 50, 0, 1820, 1030, [
    [0, '#c1cfdd'],
    [0.55, '#a9bbce'],
    [1, '#8296ac'],
  ]);
  c.fillRect(0, 0, 1920, 1080);
  flecks(c, 0, 0, 1920, 1080, 19000, '#3f506a15');
  flecks(c, 0, 0, 1920, 1080, 9000, '#ffffff36', 39);
  book(c);
  // Afternoon window light falls across the linoleum and the edge of the cover.
  const shade = gradient(c, 120, 110, 1050, 1030, [
    [0, '#3b41680e'],
    [0.44, '#41436200'],
    [0.78, '#41436200'],
    [0.84, '#424a6a15'],
    [0.86, '#424a6a20'],
    [0.88, '#424a6a10'],
    [1, '#424a6a10'],
  ]);
  c.fillStyle = shade;
  c.fillRect(0, 0, 1920, 1080);
  return background;
}

const W = 1190,
  H = 153,
  header = 185;
const replyX = 63,
  checkerX = 802,
  librarianX = 1041;
const perspective = -0.013;

function impression(c, x, y, pass, amount, angle) {
  if (amount <= 0) return;
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.globalAlpha *= clamp(amount * 4);
  const w = 163,
    h = 65;
  c.lineWidth = 4.5;
  c.strokeStyle = violet;
  c.beginPath();
  c.roundRect(-w / 2, -h / 2, w, h, 3);
  c.stroke();
  text(c, pass ? 'PASS' : 'FAIL', 0, 18, 51, {
    face: 'Mono',
    style: 'bold',
    align: 'center',
    color: violet,
  });
  flecks(c, -w / 2, -h / 2, w, h, 155, '#faf1dbb3', 605);
  c.restore();
}

function pencilPath(c, points, amount, color, width) {
  if (amount <= 0) return;
  const fraction = clamp(amount) * (points.length - 1);
  c.beginPath();
  c.moveTo(...points[0]);
  for (let i = 1; i < points.length; i++) {
    const portion = clamp(fraction - i + 1);
    if (!portion) break;
    const [sx, sy] = points[i - 1],
      [ex, ey] = points[i];
    c.lineTo(sx + (ex - sx) * portion, sy + (ey - sy) * portion);
  }
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.stroke();
}

function judgment(c, x, y, pass, p) {
  c.save();
  c.translate(x, y);
  if (pass) {
    pencilPath(
      c,
      [
        [-36, -2],
        [-25, 11],
        [-13, 24],
        [1, 3],
        [18, -18],
        [37, -34],
      ],
      p,
      pencil,
      9,
    );
  } else {
    pencilPath(
      c,
      [
        [-26, -22],
        [-4, -4],
        [25, 22],
      ],
      p * 1.8,
      pencil,
      8,
    );
    pencilPath(
      c,
      [
        [-27, 25],
        [-2, 1],
        [27, -23],
      ],
      (p - 0.43) * 1.75,
      pencil,
      8,
    );
  }
  c.restore();
}

// Sample the pencil stroke so the completed loop retains its overlapping ends.
function pencilOval(c, x, y, rx, ry, progress, tilt, color, width) {
  const points = Array.from({ length: 57 }, (_, i) => {
    const t = (i / 56) * 6.42 - 1.62;
    const dx = rx * Math.cos(t) + 1.2 * Math.sin(3 * t);
    const dy = ry * Math.sin(t) + 1.7 * Math.cos(2 * t);
    return [x + dx, y + dy + tilt * dx];
  });
  pencilPath(c, points, progress, color, width);
}

function drawReply(c, answer, matches, wordMark) {
  answer.lines.forEach((row, lineIndex) => {
    const y = lineIndex ? 123 : 58;
    text(c, row, replyX, y, 60);
    for (const term of answer.hits) {
      const pos = row.toLowerCase().indexOf(term);
      if (pos < 0) continue;
      const start = replyX + c.measureText(row.slice(0, pos)).width;
      const width = c.measureText(row.slice(pos, pos + term.length)).width;
      const p = matches[terms.indexOf(term)];
      if (p > 0) line(c, start, y + 8, start + width * p, y + 8, '#6752a8', 4);
    }
    if (lineIndex === 1 && wordMark && answer.id !== 'literal') {
      const token = answer.id === 'changed-deadline' ? 'after' : 'Fri.';
      const i = row.indexOf(token);
      const left = replyX + c.measureText(row.slice(0, i)).width;
      const width = c.measureText(token).width;
      pencilOval(c, left + width / 2, y - 19, width / 2 + 9, 33, wordMark, -0.05, pencil, 4);
    }
  });
}

function circledPair(c, x, y, p) {
  if (!p) return;
  pencilOval(c, x, y, 220, 55, p, -0.018, '#ae5141d9', 4);
}

function row(c, index, p, state) {
  if (p < 0.001) return;
  const answer = answers[index];
  c.save();
  c.scale(1, p);
  c.fillStyle = index % 2 ? '#f4ead4' : '#fbf2de';
  c.fillRect(0, 0, W, H);
  drawReply(c, answer, state.matches, state.wordMark);
  impression(c, checkerX, H / 2, answer.pass, state.checked, [-0.065, 0.035, -0.025][index]);
  judgment(c, librarianX, H / 2, answer.reviewed, state.review);
  if (answer.pass !== answer.reviewed)
    circledPair(c, (checkerX + librarianX) / 2 - 9, H / 2, state.compare);
  c.fillStyle = gradient(c, 0, 0, 0, H, [
    [0, '#80654925'],
    [0.12, '#80654900'],
    [0.85, '#ffffff00'],
    [1, '#fffdf960'],
  ]);
  c.fillRect(0, 0, W, H);
  if (p < 1) {
    c.fillStyle = 'rgba(102,81,60,' + (1 - p) * 0.48 + ')';
    c.fillRect(0, 0, W, H);
  }
  line(c, 0, H - 1, W, H - 1, '#a79779', 2);
  c.restore();
}

// The wooden hand stamp lifts off on contact. Its footprint is the purple mark.
function handStamp(c, x, y, time) {
  if (time >= 1.55) return;
  const t = clamp(time / 1.55);
  const lift = ease(t);
  c.save();
  c.translate(x + lift * 390, y - lift * 395);
  c.rotate(-0.065 + lift * 0.39);
  c.globalAlpha *= 1 - ease((t - 0.62) / 0.38);
  c.shadowColor = '#3c293850';
  c.shadowBlur = 8 + lift * 18;
  c.shadowOffsetX = 4 + lift * 20;
  c.shadowOffsetY = 8 + lift * 30;
  box(c, -99, -38, 198, 77, 9, '#48383f');
  c.shadowColor = 'transparent';
  box(
    c,
    -102,
    -58,
    204,
    79,
    12,
    gradient(c, -100, -30, 91, 4, [
      [0, '#a35532'],
      [0.45, '#d99c63'],
      [1, '#824526'],
    ]),
  );
  for (let j = 0; j < 3; j++) line(c, -91, -48 + j * 9, 93, -48 + j * 9, '#743e293a', 1.8);
  ellipse(c, 1, -26, 54, 28, '#6e402c');
  c.fillStyle = gradient(c, -37, 0, 33, 0, [
    [0, '#643722'],
    [0.48, '#b47546'],
    [1, '#78432c'],
  ]);
  c.beginPath();
  c.moveTo(-42, -24);
  c.bezierCurveTo(-31, -43, -25, -68, -43, -82);
  c.bezierCurveTo(-78, -108, -42, -144, -5, -145);
  c.bezierCurveTo(44, -146, 76, -113, 43, -84);
  c.bezierCurveTo(23, -66, 25, -43, 41, -24);
  c.quadraticCurveTo(0, -2, -42, -24);
  c.fill();
  ellipse(c, -5, -115, 36, 14, '#d39c6977');
  c.restore();
}

function draw(c, clock) {
  const { index, elapsed } = clock;
  function cue(beat, phrase, span = 0.55) {
    if (index !== beat) return Number(index > beat);
    return ease(clock.reveal(phrase, span));
  }
  const second = cue(3, 'Try another answer', 0.92);
  const third = cue(5, 'For comparison', 0.92);
  const totals = cue(6, 'Two out of three', 0.77);
  const firstError = cue(6, 'Trace those totals', 0.95);
  const secondError = cue(6, 'one mistaken fail', 0.95);
  const checkedFirst = clamp(clock.seconds / 0.07);
  const checkedSecond = index > 4 ? 1 : index === 4 ? clamp(elapsed / 0.07) : 0;
  const checkedThird = cue(5, 'on Friday', 0.21);
  const rows = [
    {
      checked: checkedFirst,
      review: cue(1, 'By Saturday', 0.38),
      matches: [cue(2, 'books'), cue(2, 'and Friday')],
      wordMark: cue(1, 'Now look', 0.8),
      compare: firstError,
    },
    {
      checked: checkedSecond,
      review: cue(3, 'written the short way', 0.43),
      matches: [checkedSecond, 0],
      wordMark: cue(4, 'three more letters', 0.58),
      compare: secondError,
    },
    {
      checked: checkedThird,
      review: cue(5, 'Both marks', 0.39),
      matches: [checkedThird, checkedThird],
      wordMark: 0,
      compare: 0,
    },
  ];
  c.drawImage(desk(), 0, 0);
  c.save();
  const top = 315 - 73 * second - 77 * third - 41 * totals;
  c.translate(656, top);
  c.rotate(perspective);
  const paperHeight = header + H * (1 + second + third) + 94 * totals;
  // The unused leaves sit folded beneath the last visible entry.
  c.shadowColor = '#3036425a';
  c.shadowBlur = 22;
  c.shadowOffsetX = 9;
  c.shadowOffsetY = 17;
  box(c, 0, 6, W, paperHeight + 12 - 9 * totals, 3, '#c0ac89');
  c.shadowColor = 'transparent';
  for (let i = 0; i < 3; i++) {
    line(
      c,
      3,
      paperHeight + 4 + i * (4 - 3 * totals),
      W - 3,
      paperHeight + 4 + i * (4 - 3 * totals),
      '#fff1d7',
      2,
    );
  }
  c.fillStyle = gradient(c, 0, 0, W, header, [
    [0, '#fff5df'],
    [1, '#ece0c4'],
  ]);
  c.fillRect(0, 0, W, header);
  text(c, 'When are my books due?', replyX, 92, 70);
  line(c, replyX, 112, W - 49, 112, '#6c655b', 2.2);
  text(c, 'Answer', replyX, 161, 43, { face: 'Sans' });
  text(c, 'Checker', checkerX, 161, 43, { face: 'Sans', align: 'center' });
  text(c, 'Librarian', librarianX, 161, 43, { face: 'Sans', align: 'center' });
  line(c, 0, header - 1, W, header - 1, '#aa9578', 2);
  c.save();
  c.translate(0, header);
  const folds = [1, second, third];
  for (let i = 0; i < answers.length; i++) {
    row(c, i, folds[i], rows[i]);
    c.translate(0, H * folds[i]);
  }
  if (totals > 0) {
    c.save();
    c.scale(1, totals);
    c.fillStyle = '#e8d7b8';
    c.fillRect(0, 0, W, 94);
    text(c, 'Passes', replyX, 64, 49, { style: 'italic' });
    for (const [x, n, color] of [
      [checkerX, checkerTotal, violet],
      [librarianX, librarianTotal, pencil],
    ]) {
      text(c, n + ' / ' + answers.length, x, 66, 55, { align: 'center', face: 'Mono', color });
    }
    c.restore();
  }
  c.restore();
  if (index === 0) handStamp(c, checkerX, header + H / 2, elapsed);
  if (index === 4) handStamp(c, checkerX, header + H * 1.5, elapsed);
  c.restore();
}

export default { title, beats, draw, check };
