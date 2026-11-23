import assert from 'node:assert/strict';
import { MESSAGES, QUERY } from '../../../films/ai-data-structures/fixtures.mjs';
import { buildIndex, terms } from '../../../films/ai-data-structures/arithmetic.mjs';

const title = 'Two Words on a Light Table';
const beats = [
  {
    id: 'first-cut',
    say: 'A disc drops out. That hole records the word “twice” in note M zero. Read to the end of the note. There’s the word again.',
    hold: 0.7,
  },
  {
    id: 'second-stroke',
    say: 'Watch where the punch lands this time. Straight through the same hole. The word occurs twice, but M zero takes just one place on this plate.',
    hold: 0.8,
  },
  {
    id: 'another-note',
    say: 'Here comes the note about changing plans. It also says “twice.” Now the punch has to move. The new hole belongs to M two.',
    hold: 0.9,
  },
  {
    id: 'turn-the-lookup-around',
    say: 'Lift that plate. You can start with a word and find every note that contains it. This is an inverted index. Each word has its own set of note IDs.',
    hold: 0.7,
  },
  {
    id: 'third-light',
    say: 'A customer asks, “Why was my card charged twice?” The plate for “charged” lights up three places. Look at the last one. M three says the account was charged once.',
    hold: 1,
  },
  {
    id: 'line-up',
    say: 'Which of those notes also says “twice”? Watch that last light as the plate slides back into place.',
    hold: 1.35,
  },
  {
    id: 'through-both',
    say: 'Light comes through at M zero and M two. Those IDs belong to both sets. The assistant can pull up the two matching notes.',
    hold: 2.4,
  },
];

const index = buildIndex(MESSAGES);
const [charged, twice] = terms(QUERY);
const fullPlate = index.get(twice);
const chargedPlate = index.get(charged);
const matches = [...chargedPlate].filter(id => fullPlate.has(id));
const firstNote = MESSAGES[0].text.match(/[^.]+\./g).map(s => s.trim());
function wrapAt(text, phrase) {
  const split = text.indexOf(phrase);
  assert.ok(split > 0, 'Missing line break in the support note.');
  return [text.slice(0, split).trim(), text.slice(split)];
}
const planNote = wrapAt(MESSAGES[2].text, 'after');
const onceNote = wrapAt(MESSAGES[3].text, 'charged');
const excerpts = new Map([[0, wrapAt(firstNote[0], 'charged')], [2, planNote]]);
const xFor = id => 445 + id * 344;
const lensY = 618;
const radius = 65;
const clamp = n => Math.max(0, Math.min(1, n));
const ease = t => clamp(t) ** 2 * (3 - 2 * clamp(t));
const lerp = (a, b, t) => a + (b - a) * t;

// A second strike at an existing aperture cuts no new disc.
const strikes = MESSAGES.flatMap(note =>
  [...note.text.toLowerCase().matchAll(/[a-z]+/g)]
    .filter(([word]) => word === twice)
    .map(() => note.id),
);
function cutPlate(count) {
  return new Set(strikes.slice(0, count));
}

function grad(g, x1, y1, x2, y2, stops) {
  const paint = g.createLinearGradient(x1, y1, x2, y2);
  for (const [at, color] of stops) paint.addColorStop(at, color);
  return paint;
}
function box(g, x, y, w, h, r, color) {
  g.fillStyle = color;
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}
function circle(g, x, y, r, color) {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}
function ring(g, x, y, r, color, width) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
}
function line(g, x, y, toX, toY, color, width = 2) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(toX, toY);
  g.stroke();
}
function type(g, text, x, y, size, color, family = 'Sans', align = 'left', weight = 400) {
  g.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  g.textAlign = align;
  g.fillStyle = color;
  g.fillText(text, x, y);
}
function screw(g, x, y, a) {
  circle(g, x, y + 2, 11, '#121817');
  circle(g, x, y, 9, '#a3997e');
  line(g, x - 6 * Math.cos(a), y - 6 * Math.sin(a), x + 6 * Math.cos(a), y + 6 * Math.sin(a), '#3d3931', 2.8);
}

function bench(g) {
  g.fillStyle = grad(g, 0, 0, 1700, 1100, [[0, '#68443f'], [0.5, '#3c252a'], [1, '#211b20']]);
  g.fillRect(-2400, -1200, 6900, 4000);
  // The cloth stays fixed under the moving camera and both plates.
  for (let y = -20; y < 1200; y += 9) line(g, -400, y, 2400, y + 80, '#f4bb8b09', 1);
  for (let x = -280; x < 2300; x += 12) line(g, x, -200, x - 110, 1300, '#1e10131a', 1.4);
  box(g, 91, 415, 1754, 485, 47, '#1c141898');
  box(g, 90, 399, 1740, 480, 45, '#101b1c');
  box(g, 90, 385, 1740, 474, 44, grad(g, 0, 385, 0, 860, [[0, '#a3a499'], [0.014, '#586166'], [0.038, '#4a5659'], [0.88, '#283a3e'], [1, '#223237']]));
  box(g, 169, 502, 1582, 235, 24, '#192b30');
  box(g, 184, 517, 1552, 203, 18, '#35454a');
  for (const [i, note] of MESSAGES.entries()) {
    const x = xFor(note.id);
    circle(g, x, lensY + 5, radius + 14, '#17282b');
    const lamp = g.createRadialGradient(x - 17, lensY - 18, 3, x, lensY, radius + 9);
    lamp.addColorStop(0, '#fffef0');
    lamp.addColorStop(0.65, '#fff6cb');
    lamp.addColorStop(1, '#efb777');
    circle(g, x, lensY, radius + 8, lamp);
    line(g, x, 734, x, 752, '#b9c1b6', 3);
    type(g, 'M' + note.id, x, 810, 54, '#eceadd', 'Mono', 'center');
    if (i < MESSAGES.length - 1) line(g, x + 172, 765, x + 172, 805, '#78878866');
  }
  for (const [x, y, a] of [[133, 433, 0.5], [1787, 433, -0.6], [133, 817, -0.9], [1787, 817, 0.8]]) screw(g, x, y, a);
}

// Both sheets are opaque. Only the actual holes let the lower image through.
function plate(g, word, ids, dy) {
  const top = word === twice;
  const tabX = top ? 642 : 1290;
  const tabW = top ? 272 : 364;
  const right = top ? 1718 : 1732;
  const left = top ? 202 : 189;
  const bottom = top ? 710 : 724;
  g.save();
  g.translate(0, dy);
  const outline = () => {
    g.beginPath();
    g.moveTo(left + 18, 523);
    g.lineTo(tabX - 18, 523);
    g.quadraticCurveTo(tabX - 8, 523, tabX - 6, 510);
    g.lineTo(tabX + 2, 468);
    g.quadraticCurveTo(tabX + 4, 458, tabX + 17, 458);
    g.lineTo(tabX + tabW - 17, 458);
    g.quadraticCurveTo(tabX + tabW - 4, 458, tabX + tabW - 2, 468);
    g.lineTo(tabX + tabW + 6, 510);
    g.quadraticCurveTo(tabX + tabW + 8, 523, tabX + tabW + 18, 523);
    g.lineTo(right - 18, 523);
    g.quadraticCurveTo(right, 523, right, 541);
    g.lineTo(right, bottom - 22);
    g.lineTo(right - 22, bottom);
    g.lineTo(left + 16, bottom);
    g.quadraticCurveTo(left, bottom, left, bottom - 16);
    g.lineTo(left, 541);
    g.quadraticCurveTo(left, 523, left + 18, 523);
    g.closePath();
    for (const id of ids) {
      g.moveTo(xFor(id) + radius, lensY);
      g.arc(xFor(id), lensY, radius, 0, Math.PI * 2);
      g.closePath();
    }
  };
  g.save();
  g.translate(0, 7);
  outline();
  g.fillStyle = top ? '#3a514a' : '#713d30';
  g.fill('evenodd');
  g.restore();

  outline();
  g.fillStyle = top
    ? grad(g, 300, 460, 1150, 880, [[0, '#729386'], [0.48, '#628578'], [1, '#45675e']])
    : grad(g, 200, 490, 1560, 710, [[0, '#cd9374'], [0.5, '#b47459'], [1, '#9a604b']]);
  g.fill('evenodd');
  g.save();
  g.clip('evenodd');
  g.strokeStyle = '#fff1ce59';
  g.lineWidth = 2.6;
  g.stroke();
  // Short fibers are tied to the sheet, including at the lip of a cut.
  for (let n = 0; n < 315; n++) {
    const x = left + ((n * 277) % 1522);
    const y = 463 + ((n * 179 + (n % 11) * 63) % 249);
    line(g, x, y, x + 4 + (n % 12), y + (n % 3) - 1, n % 2 ? '#f7ecbe22' : '#18352622', 1.3);
  }
  for (const { id } of MESSAGES) {
    const x = xFor(id);
    if (ids.has(id)) {
      ring(g, x, lensY, radius + 1.4, top ? '#304f47' : '#734330', 3.3);
    } else {
      line(g, x - 10, lensY, x + 10, lensY, '#192a253e');
      line(g, x, lensY - 10, x, lensY + 10, '#192a253e');
    }
  }
  g.restore();
  type(g, word, tabX + tabW / 2, 510, 50, '#122623', 'Serif', 'center');
  g.restore();
}

function noteText(g, text, x, y, size, marks) {
  g.textAlign = 'left';
  g.font = size + 'px "Lesson Serif"';
  for (const piece of text.split(/(\b[a-z]+\b)/i)) {
    const w = g.measureText(piece).width;
    if (marks.includes(piece.toLowerCase())) {
      box(g, x - 1, y - size * 0.72, w + 2, size * 0.91, 2, '#e9b889');
      line(g, x, y + 7, x + w, y + 7, '#915035', 2);
    }
    g.fillStyle = '#312f2c';
    g.fillText(piece, x, y);
    x += w;
  }
}

function note(g, id, x, y, w, lines, marksByLine, size = 44) {
  const h = 178;
  box(g, x + 7, y + 10, w, h, 5, '#1b10144a');
  box(g, x, y, w, h, 5, grad(g, x, y, x + w, y + h, [[0, '#f3e9d3'], [0.48, '#e7dac0'], [1, '#d5c3a6']]));
  line(g, x + 107, y + 11, x + 107, y + h - 11, '#a0826c', 1.8);
  type(g, 'M' + id, x + 54, y + 102, 43, '#463e3b', 'Mono', 'center');
  for (let n = 0; n < 6; n++) {
    circle(g, x + 16, y + 18 + n * 27, 4.5, '#6c5551');
  }
  const firstY = y + (lines.length > 1 ? 72 : 107);
  lines.forEach((s, i) => noteText(g, s, x + 137, firstY + i * 58, size, marksByLine[i]));
}

function punch(g, x, depth) {
  const y = 482 + (lensY - 482) * depth;
  const metal = grad(g, x - 63, 0, x + 62, 0, [[0, '#383a38'], [0.11, '#77746a'], [0.28, '#bfb8a2'], [0.51, '#949483'], [0.9, '#73776b'], [1, '#494b43']]);
  box(g, x - 48, 405, 96, y - 397, 18, metal);
  circle(g, x + 3, y + 8, radius + 9, '#14212364');
  circle(g, x, y, radius + 8, '#3c423b');
  circle(g, x, y - 4, radius + 3, metal);
  circle(g, x, y - 5, 49, '#52605a');
  ring(g, x, y - 5, 49, '#c6c6b0', 2.2);
  box(g, x - 26, y - 57, 52, 57, 12, '#51564e');
  screw(g, x, y - 18, 0.6);
  box(g, x - 65, 385, 130, 58, 8, '#303d3c');
  box(g, x - 64, 381, 128, 52, 8, metal);
  for (let j = -4; j <= 4; j++) line(g, x + j * 10, 389, x + j * 10, 424, '#465049', 2.3);
}

function chip(g, id, flight) {
  if (flight <= 0 || flight >= 1) return;
  const p = clamp(flight);
  const x = xFor(id) + 130 * ease(p);
  const y = lensY + 570 * p - 180 * Math.sin(Math.PI * p);
  g.save();
  g.translate(x, y);
  g.rotate(p * 0.52);
  g.scale(1, 0.24 + 0.76 * Math.abs(Math.cos(p * Math.PI * 1.9)));
  circle(g, 3, 5, radius, '#1c17193d');
  circle(g, 0, 2, radius, '#385348');
  circle(g, 0, 0, radius, '#759185');
  line(g, -8, 0, 8, 0, '#354b3f66', 2);
  line(g, 0, -8, 0, 8, '#354b3f66', 2);
  g.restore();
}

function draw(g, clock) {
  const { index: beat, elapsed, reveal } = clock;
  const cue = (i, phrase, span) => beat < i ? 0 : beat > i ? 1 : ease(reveal(phrase, span));
  const repeatedWord = cue(0, 'Read to the end', 0.65);
  const wide = cue(2, 'Here comes', 1.6);
  const shift = cue(2, 'Now the punch', 1.05);
  const lift = cue(3, 'Lift that plate', 1.45);
  const lastNote = cue(4, 'Look at the last one', 0.82);
  const align = cue(5, 'as the plate', 1.48);
  const answer = cue(6, 'can pull up', 1.4);
  const zoom = lerp(1.47, 1, wide);
  const cameraX = lerp(626, 960, wide);
  const cameraY = lerp(506, 540, wide);

  // Each strike gets one downstroke and one withdrawal. The opening is already in motion.
  const stroke = t => Math.sin(Math.PI * clamp(t)) ** 2;
  const opening = beat === 0 ? clamp(0.29 + elapsed / 0.95) : 1;
  const repeat = beat === 1 ? reveal('where the punch lands', 1.12) : 0;
  const third = beat === 2 ? reveal('The new hole', 1.1) : beat > 2 ? 1 : 0;
  const cuts = Number(opening >= 0.5) + Number(beat > 1 || repeat >= 0.5) + Number(third >= 0.5);
  const pressX = lerp(xFor(strikes[0]), xFor(strikes[2]), shift);
  const pressOff = beat < 3 ? 0 : beat > 3 ? 1 : ease(clamp(elapsed / 0.85));
  const pressDepth = stroke(opening) + stroke(repeat) + stroke(third);

  g.save();
  g.translate(960, 540);
  g.scale(zoom, zoom);
  g.translate(-cameraX, -cameraY);
  bench(g);
  if (wide < 1) note(g, strikes[0], 155 - 1350 * wide, 158, 1085, firstNote, [[twice], repeatedWord > 0.5 ? [twice] : []]);
  if (wide > 0 && lift < 1) note(g, strikes[2], 286 + 1770 * (1 - wide) - 1650 * lift, 158, 1075, planNote, [[twice], []], 51);
  if (lastNote > 0 && answer < 1) {
    note(g, 3, 1070 + 999 * (1 - lastNote + answer), 40, 660, onceNote, [[], ['once']], 51);
  }

  plate(g, charged, chargedPlate, 0);
  plate(g, twice, cutPlate(cuts), -291 * (lift - align));
  if (beat === 0) chip(g, strikes[0], (elapsed - 0.2) / 1.05);
  if (beat === 2) chip(g, strikes[2], clamp((reveal('The new hole', 1.65) - 1 / 3) * 1.5));
  if (pressOff < 1) punch(g, pressX + 1600 * pressOff, pressDepth);

  if (answer > 0) {
    const dy = -410 * (1 - answer);
    for (const [i, id] of matches.entries()) {
      note(g, id, 112 + i * 859, 168 + dy, 833, excerpts.get(id), [[charged, twice], [charged, twice]], 51);
    }
  }
  g.restore();
}

function check() {
  assert.deepEqual(strikes, [0, 0, 2]);
  assert.deepEqual([...cutPlate(1)], [0]);
  assert.deepEqual(cutPlate(2), cutPlate(1));
  assert.deepEqual(cutPlate(3), fullPlate);
  assert.deepEqual([...chargedPlate], [0, 2, 3]);
  assert.deepEqual(matches, [0, 2]);
  assert.deepEqual(matches, MESSAGES.filter(note => terms(QUERY).every(term => terms(note.text).includes(term))).map(note => note.id));
  return true;
}

export default { title, beats, draw, check };
