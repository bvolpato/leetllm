import assert from 'node:assert/strict';
import { labels, secondContext, vocabulary } from '../../../films/gpt-to-modern-llms/fixtures.mjs';
import { outputProjection, projectContext } from '../../../films/gpt-to-modern-llms/model.mjs';
import { checkReply } from '../../../films/gpt-to-modern-llms/workload.mjs';

const first = outputProjection();
const second = projectContext(secondContext);
const word = first.selected;
const extra = second.selected;
const fullReply = word + extra;

// A stop action is separate from the tokens that print text.
function nextMoves(prefix) {
  return {
    finish: labels.includes(prefix),
    tokens: vocabulary.filter(token => labels.some(name => name.startsWith(prefix + token))),
  };
}

const beats = [
  {
    id: 'returned',
    say: 'Watch this note about a stale guide. The middle folder looks like a good fit. Why did the note bounce?',
    hold: 1.25,
  },
  {
    id: 'last-mark',
    say: 'Follow the letters on the note and on the folder. Both spell Docs. The red square after the s is a period, and the tracker compares the whole reply.',
    hold: 0.85,
  },
  {
    id: 'blank-label',
    say: 'Go back to the empty label. A GPT-style model can classify the note by continuing the text after Label. Here our toy decoder scores four possible next tokens.',
    hold: 0.65,
  },
  {
    id: 'one-token',
    say: 'Which token has the highest score? Greedy decoding takes that one. Docs goes onto the note in one piece.',
    hold: 0.85,
  },
  {
    id: 'another-turn',
    say: 'Let it write two tokens in all. For the second prediction, the model also reads Docs. The weights stay the same. Look which score comes out on top this time. There’s our period.',
    hold: 1.05,
  },
  {
    id: 'allowed-replies',
    say: 'Back up to Docs. This time, use constrained decoding. Each token we add must still let us finish with one of the three folder names. Could we add that period?',
    hold: 1.35,
  },
  {
    id: 'filed',
    say: 'Docs is already a complete name. Any more text would take it off the list. The decoder can end the reply right here.',
    hold: 2.8,
  },
];

const ink = '#25244f';
const blue = '#3045a1';
const paper = '#fffae9';
const chalk = '#eef0ff';
const alert = '#b63729';
const ok = '#21655c';
const folders = labels.map((name, index) => ({ name, x: 366 + 594 * index }));

const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => { const u = clamp(n); return u * u * (3 - 2 * u); };
const mix = (a, b, t) => a + (b - a) * t;
const step = (n, a, b) => ease((n - a) / (b - a));

function box(c, x, y, w, h, fill) {
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
}

function shape(c, points, fill) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}

function text(c, value, x, y, size, color = ink, family = 'Lesson Sans', weight = 400, align = 'left') {
  c.font = `${weight} ${size}px "${family}"`;
  c.fillStyle = color;
  c.textBaseline = 'alphabetic';
  c.textAlign = align;
  c.fillText(value, x, y);
}

// These are the actual bitmap letters on the desktop's file and folder icons.
const glyphs = {
  D: ['11110','11011','11001','11001','11001','11011','11110'],
  o: ['00000','00000','01110','11011','11011','11011','01110'],
  c: ['00000','00000','01111','11000','11000','11000','01111'],
  s: ['00000','00000','01111','11000','01110','00011','11110'],
  B: ['11110','11011','11011','11110','11011','11011','11110'],
  u: ['00000','00000','11011','11011','11011','11011','01111'],
  g: ['00000','00000','01111','11011','11011','01111','00011','11110'],
  S: ['01111','11000','11000','01110','00011','00011','11110'],
  e: ['00000','00000','01110','11011','11111','11000','01111'],
  r: ['00000','00000','11011','11110','11000','11000','11000'],
  i: ['11','00','11','11','11','11','11'],
  t: ['0100','1100','1111','1100','1100','1100','0111'],
  y: ['00000','00000','11011','11011','11011','01111','00011','11110'],
  '.': ['00','00','00','00','00','11','11'],
};

function bitmapWidth(value, pixel) {
  return value ? [...value].reduce((n, letter) => n + glyphs[letter][0].length + 1, -1) * pixel : 0;
}

function bitmap(c, value, x, y, pixel, color, suffixColor = color) {
  let left = x;
  for (const letter of value) {
    const rows = glyphs[letter];
    for (const [row, bits] of rows.entries()) {
      for (let col = 0; col < bits.length; col++) {
        if (bits[col] === '1') box(c, left + col * pixel, y + row * pixel, pixel, pixel, letter === '.' ? suffixColor : color);
      }
    }
    left += (rows[0].length + 1) * pixel;
  }
}

const desktopIcon = [
  '000011111000','000110001100','001100000110','011111111110',
  '010000000010','111111111111','100000000001','101111111101',
  '101000000101','100000000001','111111111111',
];

function sprite(c, rows, x, y, p, fill) {
  for (const [i, row] of rows.entries()) {
    for (let j = 0; j < row.length; j++) {
      if (row[j] === '1') box(c, x + j * p, y + i * p, p, p, fill);
    }
  }
}

function desktop(c) {
  const sky = c.createLinearGradient(0, 0, 1350, 1080);
  sky.addColorStop(0, '#d2d3fa');
  sky.addColorStop(0.55, '#b6bced');
  sky.addColorStop(1, '#9ca8e5');
  box(c, 0, 0, 1920, 1080, sky);
  // The stationary halftone is visible in the empty desktop between the icons.
  c.fillStyle = '#8e99d2';
  for (let row = 0; row < 44; row++) {
    for (let col = 0; col < 73; col++) {
      c.fillRect(col * 28 + (row % 2) * 14, 86 + row * 23, 3, 3);
    }
  }
}

function menuBar(c, filed) {
  box(c, 0, 0, 1920, 72, '#eeedfc');
  box(c, 0, 68, 1920, 5, ink);
  sprite(c, desktopIcon, 66, 12, 4, ink);
  text(c, 'Issue tracker', 134, 49, 38, ink, 'Lesson Sans', 700);
  text(c, filed ? '1 filed' : '1 unfiled', 1854, 47, 32, filed ? ok : ink, 'Lesson Mono', 400, 'right');
}

function folderBack(c, x, active) {
  c.save();
  c.translate(x, 642);
  shape(c, [[-192,-17],[-184,-17],[-184,-29],[-89,-29],[-89,-21],[-81,-21],[-81,-12],[159,-12],[159,-4],[170,-4],[170,178],[-192,178]], ink);
  shape(c, [[-183,-11],[-175,-11],[-175,-20],[-98,-20],[-98,-12],[-90,-12],[-90,-3],[151,-3],[151,4],[161,4],[161,166],[-183,166]], active ? '#ffd184' : '#bdbbdc');
  box(c, -182, 9, 340, 19, active ? '#94602e' : '#77789e');
  box(c, -173, 13, 322, 15, active ? '#77452e' : '#686988');
  c.restore();
}

function folderFront(c, folder, state) {
  const active = folder.name === word;
  c.save();
  c.translate(folder.x, 642);
  const nudge = active ? state.impact * 12 : 0;
  c.translate(0, nudge);
  const edge = [[-195,18],[-143,18],[-143,10],[-133,10],[-133,3],[-29,3],[-29,11],[-17,11],[-17,19],[195,19],[195,51],[189,51],[189,91],[183,91],[183,130],[177,130],[177,172],[171,172],[171,204],[-164,204],[-164,195],[-172,195],[-172,153],[-178,153],[-178,112],[-184,112],[-184,70],[-190,70],[-190,38],[-195,38]];
  c.save();
  c.translate(13, 15);
  shape(c, edge, '#777eae');
  c.restore();
  shape(c, edge, ink);
  const face = [[-184,28],[-134,28],[-134,20],[-124,20],[-124,13],[-39,13],[-39,21],[-26,21],[-26,29],[184,29],[184,44],[178,44],[178,84],[172,84],[172,124],[166,124],[166,165],[160,165],[160,194],[-155,194],[-155,185],[-162,185],[-162,145],[-168,145],[-168,105],[-174,105],[-174,64],[-180,64],[-180,35],[-184,35]];
  shape(c, face, active ? '#ffc264' : '#d2d2ec');
  box(c, -168, 35, 343, 6, active ? '#ffe8b2' : '#f0effb');
  box(c, -148, 182, 298, 4, active ? '#d89948' : '#adaecf');
  const p = folder.name === 'Security' ? 6 : 9;
  const w = bitmapWidth(folder.name, p);
  bitmap(c, folder.name, -w / 2, 100 - 3.5 * p, p, ink);
  if (active && state.compare > 0) box(c, -w / 2, 145, w * state.compare, 7, blue);
  c.restore();
}

const pageEdge = [[-344,0],[256,0],[256,12],[272,12],[272,26],[288,26],[288,40],[304,40],[304,54],[320,54],[320,68],[336,68],[336,82],[346,82],[346,366],[338,366],[338,375],[-344,375],[-344,366],[-352,366],[-352,9],[-344,9]];

function note(c, s) {
  c.save();
  c.translate(s.x, s.y);
  c.scale(s.scale, s.scale);
  c.save();
  c.translate(14, 16);
  shape(c, pageEdge, '#767baa');
  c.restore();
  shape(c, pageEdge, ink);
  c.save();
  c.clip();
  box(c, -343, 9, 680, 357, paper);
  box(c, 246, 5, 10, 88, ink);
  box(c, 247, 84, 95, 9, ink);
  box(c, 256, 0, 92, 84, '#aebaf4');
  for (let i = 0; i < 6; i++) {
    box(c, 250 + 16 * i, 8 + 14 * i, 22, 6, ink);
    box(c, 266 + 16 * i, 8 + 14 * i, 6, 17, ink);
  }
  text(c, 'Review note', -292, 65, 34, '#585774', 'Lesson Sans', 600);
  text(c, 'Stale guide', -294, 139, 70, ink, 'Lesson Serif');
  box(c, -292, 157, 573, 4, '#beb8b2');
  text(c, 'Label', -292, 204, 34, '#585774', 'Lesson Sans', 600);
  const p = 16, x = -290, y = 221;
  bitmap(c, s.reply, x, y, p, ink, s.error ? alert : ink);
  const width = bitmapWidth(word, p);
  if (s.compare > 0) box(c, x, 343, width * s.compare, 7, blue);
  if (s.errorMark > 0 && s.reply === fullReply) {
    const dotLeft = x + width + p;
    c.save();
    c.globalAlpha *= s.errorMark;
    box(c, dotLeft - 5, 343, 2 * p + 10, 7, alert);
    c.restore();
  }
  if (s.caret) box(c, x + bitmapWidth(s.reply, p) + (s.reply ? p : 0), y, 9, 7 * p, blue);
  c.restore();
  if (s.returned > 0) {
    c.globalAlpha *= s.returned;
    c.translate(263, 281);
    shape(c, [[0,9],[9,9],[9,0],[77,0],[77,9],[86,9],[86,76],[77,76],[77,85],[9,85],[9,76],[0,76]], alert);
    sprite(c, ['1100011','0110110','0011100','0011100','0110110','1100011'], 19, 22, 7, paper);
  }
  c.restore();
}

function pointerWindow(c, left, top, w, h) {
  const outline = [[0,0],[w,0],[w,h],[0,h],[0,h-56],[-14,h-56],[-14,h-69],[-28,h-69],[-28,h-81],[-42,h-81],[-42,h-94],[0,h-94]];
  c.save();
  c.translate(left + 10, top + 12);
  shape(c, outline, '#777eae');
  c.restore();
  c.save();
  c.translate(left, top);
  shape(c, outline, ink);
  box(c, 6, 6, w - 12, h - 12, chalk);
  c.restore();
}

function tick(c, x, y, color) {
  sprite(c, ['0000011','0000110','1001100','1111000','0110000'], x, y, 5, color);
}
function cross(c, x, y) {
  sprite(c, ['1100011','0110110','0011100','0011100','0110110','1100011'], x, y, 5, alert);
}

function scores(c, s) {
  const x = 1060, y = 133, w = 620, h = 374;
  c.save();
  c.globalAlpha *= s.menu;
  c.translate(0, (1 - s.menu) * 14);
  pointerWindow(c, x, y, w, h);
  text(c, 'Next token', x + 34, y + 57, 38, ink, 'Lesson Sans', 700);
  text(c, 'Score', x + w - 32, y + 56, 34, ink, 'Lesson Sans', 600, 'right');
  box(c, x + 16, y + 76, w - 32, 4, ink);
  for (const [i, token] of vocabulary.entries()) {
    const row = y + 87 + 67 * i;
    const picked = token === s.pass.selected && s.select;
    if (picked) box(c, x + 15, row, w - 30, 62, blue);
    const color = picked ? '#ffffff' : ink;
    text(c, token === '.' ? '.  (period)' : token, x + 35, row + 46, 42, color, 'Lesson Mono');
    text(c, s.pass.logits[i].toFixed(2), x + w - 36, row + 46, 43, color, 'Lesson Mono', 400, 'right');
  }
  c.restore();
}

function constraint(c, s) {
  const moves = nextMoves(word);
  const x = 1060, y = 170, w = 570, h = 315;
  c.save();
  c.globalAlpha *= s.menu;
  pointerWindow(c, x, y, w, h);
  text(c, 'After ' + word, x + 36, y + 62, 44, ink, 'Lesson Sans', 700);
  box(c, x + 17, y + 83, w - 34, 4, ink);
  text(c, 'Append period', x + 35, y + 157, 38, ink, 'Lesson Mono');
  if (s.mask && !moves.tokens.includes(extra)) {
    cross(c, x + w - 83, y + 127);
    box(c, x + 34, y + 173, 293, 4, alert);
  }
  if (s.finish && moves.finish) box(c, x + 14, y + 192, w - 28, 91, '#cee9d9');
  text(c, 'Finish reply', x + 35, y + 250, 38, ink, 'Lesson Mono');
  if (s.finish && moves.finish) tick(c, x + w - 83, y + 219, ok);
  c.restore();
}

function state(clock) {
  const { index, elapsed: t, reveal } = clock;
  const s = {
    x: 960, y: 142, scale: 1, zoom: 1, pan: 0, impact: 0, compare: 0,
    reply: fullReply, error: true, errorMark: 0, returned: 0, caret: false, menu: 0,
    pass: first, select: false, rule: false, mask: false, finish: false, filed: false,
  };
  if (index === 0) {
    const approach = step(t, -0.22, 1.12);
    const rebound = step(t, 1.12, 2.12);
    s.x = mix(745, 960, approach);
    s.y = mix(139, 431, approach) - 289 * rebound;
    s.scale = 1 - 0.36 * approach + 0.36 * rebound;
    s.impact = Math.sin(Math.PI * step(t, 1, 1.53));
    s.errorMark = rebound;
    s.returned = rebound;
  } else if (index === 1) {
    s.compare = reveal('Follow the letters', 2.25);
    s.errorMark = 1;
    s.returned = 1;
  } else if (index === 2) {
    const rewind = step(t, 0, 1.0);
    s.x = mix(960, 652, rewind);
    s.y = mix(142, 133, rewind);
    s.compare = 1 - rewind;
    s.returned = 1 - rewind;
    s.reply = rewind < 0.2 ? fullReply : rewind < 0.64 ? word : '';
    s.caret = rewind >= 0.64;
    s.menu = reveal('continuing the text', 0.4);
  } else if (index === 3 || index === 4) {
    s.x = 652;
    s.y = 133;
    s.menu = 1;
    s.caret = true;
    if (index === 3) {
      s.select = reveal('Greedy decoding', 0.2) > 0;
      s.reply = reveal('that one', 0.22) >= 1 ? word : '';
    } else {
      const scored = reveal('also reads Docs', 0.5) >= 1;
      s.pass = scored ? second : first;
      s.select = true;
      s.reply = reveal('comes out on top', 0.3) >= 1 ? fullReply : word;
      s.error = false;
    }
  } else {
    s.rule = true;
    s.menu = 1;
    s.x = 652;
    s.y = 133;
    s.reply = word;
    if (index === 5) {
      const rewind = step(t, 0, 0.6);
      s.reply = rewind < 0.5 ? fullReply : word;
      s.caret = true;
      s.rule = rewind >= 0.5;
      s.pass = second;
      s.select = true;
      s.mask = reveal('Could we add', 0.32) > 0;
    } else {
      s.mask = true;
      s.finish = reveal('already a complete name', 0.25) > 0;
      const enter = ease(reveal('The decoder can', 1.15));
      s.menu = 1 - step(enter, 0, 0.42);
      s.x = mix(652, 960, enter);
      s.y = mix(133, 568, enter) - 60 * Math.sin(Math.PI * enter);
      s.scale = mix(1, 0.54, enter);
      s.caret = !s.finish;
      s.pan = ease(reveal('end the reply', 1.65));
      s.zoom = 1 + 1.5 * s.pan;
      s.filed = enter >= 0.98;
    }
  }
  return s;
}

function draw(c, clock) {
  const s = state(clock);
  desktop(c);
  c.save();
  c.translate(960, 735 - 132 * s.pan);
  c.scale(s.zoom, s.zoom);
  c.translate(-960, -735);
  for (const folder of folders) folderBack(c, folder.x, folder.name === word);
  note(c, s);
  for (const folder of folders) folderFront(c, folder, s);
  if (s.menu > 0) {
    if (s.rule) constraint(c, s);
    else scores(c, s);
  }
  c.restore();
  menuBar(c, s.filed);
}

function check() {
  assert.equal(word, 'Docs');
  assert.equal(extra, '.');
  assert.deepEqual(first.logits.map(v => v.toFixed(2)), ['0.90', '0.52', '0.06', '-0.36']);
  assert.deepEqual(second.logits.map(v => v.toFixed(2)), ['0.60', '0.88', '-0.36', '0.06']);
  assert.deepEqual(nextMoves(''), { finish: false, tokens: ['Docs', 'Bug', 'Security'] });
  assert.deepEqual(nextMoves(word), { finish: true, tokens: [] });
  assert.deepEqual(checkReply(fullReply), { allowed: false, correct: false });
  assert.deepEqual(checkReply(word), { allowed: true, correct: true });
}

export default { title: 'The period after Docs', beats, draw, check };
