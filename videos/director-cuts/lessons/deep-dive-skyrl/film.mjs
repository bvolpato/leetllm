import assert from 'node:assert/strict';
import { customers, queryLines } from '../../../films/deep-dive-skyrl/sql-repair.mjs';

const title = 'SkyRL and the echoed column name';
const beats = [
  {
    id: 'echo',
    say: "Watch that name come back. The model filled the blank in the query. The database echoed the missing column name in its error.",
    hold: 1.1,
  },
  {
    id: 'columns',
    say: "We want active customers with more than three open incidents. Look at the table. Which column would you try?",
    hold: 1.7,
  },
  {
    id: 'repair',
    say: "It tries open incidents. Ben has exactly three, and Cy is inactive. That leaves Ada. The model had already read the error when it made that repair.",
    hold: 1.1,
  },
  {
    id: 'twins',
    say: "Follow the piece that says count. In our toy vocabulary each name takes two tokens. Count shows up again in the error. Which copy did the model choose?",
    hold: 1.6,
  },
  {
    id: 'mask',
    say: "The first copy gets a one. Even the failed guess was a model action. SkyRL's generator gives the database tokens zeros. The repair gets ones. The trainer reads this loss mask alongside the tokens.",
    hold: 0.8,
  },
  {
    id: 'echo-cost',
    say: "Let's test the mask. Average the four sampled tokens' costs, using example negative log probabilities. Watch the average as we raise the cost on the database's copy to nine.",
    hold: 1.3,
  },
  {
    id: 'sampled-cost',
    say: "Still point five. Now add four tenths to the cost of the model's copy. Across four tokens, the average rises one tenth. The database reply stays where the model could read it before trying again.",
    hold: 3.0,
  },
];

// Only the column name is sampled in this exercise. The surrounding SQL is fixed.
const vocabulary = new Map([
  [11, 'unresolved'], [12, '_count'], [90, 'no such column: '],
  [21, 'open'], [22, '_incidents'],
]);
const fields = ['name', 'active', 'open_incidents'];
const turns = [
  { author: 'Model', ids: [11, 12] },
  { author: 'SQLite', ids: [90, 11, 12] },
  { author: 'Model', ids: [21, 22] },
];
const decode = ids => ids.map(id => vocabulary.get(id)).join('');
const positions = turns.flatMap(turn => turn.ids.map(id => ({
  id, bit: Number(turn.author === 'Model'),
})));
const wrong = decode(turns[0].ids);
const fixed = decode(turns[2].ids);
const sql = queryLines('column');
const where = sql[1] + sql[2].slice(1);
const costs = [0.2, 0.4, 0, 0, 0, 0.6, 0.8];

function executeField(field) {
  const col = fields.indexOf(field);
  if (col < 0) return { error: 'no such column: ' + field };
  return { names: customers.filter(row => row[1] === 1 && row[col] > 3).map(row => row[0]) };
}
const result = executeField(fixed);

function score(echoChange, actionChange) {
  const supplied = [...costs];
  supplied[4] += Math.round(90 * echoChange) / 10;
  supplied[1] += Math.round(4 * actionChange) / 10;
  const terms = supplied.filter((_, i) => positions[i].bit === 1);
  return { supplied, terms, mean: terms.reduce((a, b) => a + b, 0) / terms.length };
}

function check() {
  assert.equal(sql[0], 'SELECT name FROM customers');
  assert.equal(where, 'WHERE active = 1 AND column > 3;');
  assert.equal(executeField(wrong).error, decode(turns[1].ids));
  assert.deepEqual(result.names, ['Ada']);
  assert.equal(positions[1].id, positions[4].id);
  assert.deepEqual(positions.map(p => p.bit), [1, 1, 0, 0, 0, 1, 1]);
  assert.deepEqual(score(0, 0).terms, [0.2, 0.4, 0.6, 0.8]);
  assert.equal(score(0, 0).mean, 0.5);
  assert.equal(score(1, 0).supplied[4], 9);
  assert.equal(score(1, 0).mean, score(0, 0).mean);
  assert(Math.abs(score(1, 1).mean - 0.6) < 1e-12);
}

const C = {
  violet: '#4133ae', deep: '#2b2265', blue: '#4735bc', iris: '#6960a2',
  pale: '#f3f0ff', floor: '#e1def5', orange: '#a44425', peach: '#ffeddd',
  line: '#c7c1dc', white: '#fffefd', dim: '#655f7b', lilac: '#d9d2ff',
};
const clamp = x => Math.max(0, Math.min(1, x));
const ease = t => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;

function cue(clock, beat, phrase, duration) {
  if (clock.index < beat) return 0;
  if (clock.index > beat) return 1;
  return ease(clock.reveal(phrase, duration));
}
function font(c, size, family = 'Mono', weight = 400) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
}
function ink(c, words, x, y, color, size, family = 'Mono', weight = 400, align = 'left') {
  font(c, size, family, weight);
  c.fillStyle = color;
  c.textAlign = align;
  c.fillText(words, x, y);
  c.textAlign = 'left';
}
function line(c, x1, y1, x2, y2, color, width = 2) {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.lineWidth = width;
  c.strokeStyle = color;
  c.stroke();
}
function gradient(c, x, y, xx, yy, stops) {
  const paint = c.createLinearGradient(x, y, xx, yy);
  stops.forEach(([at, color]) => paint.addColorStop(at, color));
  return paint;
}
function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
function rounded(c, x, y, w, h, radius, color) {
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
  c.fillStyle = color;
  c.fill();
}

function query(c) {
  rect(c, 0, 0, 1920, 216, gradient(c, 0, 0, 1920, 216, [[0, C.deep], [0.55, '#433090'], [1, '#513b9e']]));
  // The fixed column slot links the query to the two model entries below.
  ink(c, 'SkyRL', 84, 99, C.white, 58, 'Sans', 700);
  ink(c, 'query-42_0', 87, 155, '#d7cdfc', 35);
  line(c, 393, 43, 393, 175, '#7362a8', 2);
  ink(c, sql[0], 454, 91, C.white, 41);
  const parts = where.split('column');
  ink(c, parts[0], 454, 156, C.white, 41);
  const slotX = 454 + c.measureText(parts[0]).width;
  rounded(c, slotX - 2, 112, 174, 58, 8, '#c8bef5');
  ink(c, 'column', slotX + 11, 155, C.deep, 41);
  ink(c, parts[1], slotX + 179, 156, C.white, 41);
  rect(c, 0, 216, 1920, 14, gradient(c, 0, 216, 0, 230, [[0, '#2a205620'], [1, '#2a205600']]));
}
function speaker(c, index, y) {
  const fromDb = index === 1;
  const color = fromDb ? C.orange : C.blue;
  c.save();
  c.strokeStyle = color;
  c.lineWidth = 8;
  c.lineCap = 'square';
  c.beginPath();
  if (fromDb) {
    c.moveTo(101, y - 24);
    c.lineTo(101, y - 11);
    c.quadraticCurveTo(101, y + 1, 88, y + 1);
    c.lineTo(68, y + 1);
    c.moveTo(79, y - 11);
    c.lineTo(67, y + 1);
    c.lineTo(79, y + 13);
  } else {
    c.moveTo(73, y - 20);
    c.lineTo(94, y);
    c.lineTo(73, y + 20);
  }
  c.stroke();
  c.restore();
  ink(c, turns[index].author, 134, y + 10, color, 38, 'Sans', 600);
}

function maskMark(c, left, right, y, bit, alpha, cost) {
  if (!alpha) return;
  c.save();
  c.globalAlpha *= alpha;
  const color = bit ? C.blue : C.orange;
  c.strokeStyle = color;
  c.lineWidth = bit ? 3.5 : 2.5;
  if (!bit) c.setLineDash([8, 6]);
  c.beginPath();
  c.moveTo(left + 2, y - 8);
  c.lineTo(left + 2, y);
  c.lineTo(right - 2, y);
  c.lineTo(right - 2, y - 8);
  c.stroke();
  c.setLineDash([]);
  const middle = (left + right) / 2;
  const maskX = cost === undefined ? middle : middle - 91;
  rounded(c, maskX - 27, y + 3, 54, 47, 5, bit ? C.violet : '#f8d9c1');
  ink(c, String(bit), maskX, y + 40, bit ? C.white : C.orange, 41, 'Mono', 400, 'center');
  if (cost !== undefined) {
    ink(c, 'cost ' + cost.toFixed(1), maskX + 39, y + 39, color, 36, 'Sans', 600);
  }
  c.restore();
}

function fieldName(c, row, s) {
  const { x, y, size, split, mark, focus, test, receipt } = s;
  const db = row === 1;
  const parts = turns[row].ids.slice(-2);
  const offset = [0, 3, 5][row];
  const color = db ? C.orange : C.blue;
  let left = x;
  for (let i = 0; i < parts.length; i++) {
    const word = vocabulary.get(parts[i]);
    font(c, size);
    const w = c.measureText(word).width;
    const twin = parts[i] === 12;
    if (focus && twin) {
      c.save();
      c.globalAlpha *= focus;
      rounded(c, left - 4, y - size * 0.88, w + 8, size * 1.13, 4, db ? '#ffd3ad' : '#d1c7ff');
      c.restore();
    }
    ink(c, word, left, y, color, size);
    const pos = offset + i;
    const cost = test > 0.5 && twin ? receipt.supplied[pos] : undefined;
    maskMark(c, left, left + w, y + size * 0.24 + 8, positions[pos].bit, mark, cost);
    left += w + split * 23;
  }
}

function customerTable(c, resultSeen) {
  ink(c, 'customers', 46, 373, C.deep, 52, 'Serif');
  const columnX = [50, 218, 390];
  fields.forEach((field, i) => ink(c, field, columnX[i], 452, C.dim, 36));
  line(c, 48, 477, 690, 477, C.deep);
  customers.forEach((row, i) => {
    const y = 545 + i * 80;
    if (resultSeen && result.names.includes(row[0])) {
      c.save();
      c.globalAlpha *= resultSeen;
      rect(c, 38, y - 52, 653, 69, '#dcd4ff');
      c.restore();
    }
    row.forEach((v, col) => ink(c, String(v), columnX[col], y, C.deep, 43));
    line(c, 48, y + 23, 690, y + 23, C.line);
  });
  if (resultSeen) {
    c.save();
    c.globalAlpha *= resultSeen;
    ink(c, 'Returned', 50, 830, C.dim, 34, 'Sans');
    ink(c, result.names.join(', '), 248, 834, C.blue, 59, 'Serif');
    c.restore();
  }
}

function costPlot(c, receipt) {
  ink(c, 'Mask check', 50, 341, C.deep, 53, 'Serif');
  ink(c, 'Mean sampled cost', 51, 404, C.dim, 36, 'Sans');
  const roundedMean = Math.round((receipt.mean + Number.EPSILON) * 100) / 100;
  ink(c, roundedMean.toFixed(2), 40, 560, C.blue, 154);
  const base = 814;
  const xx = [93, 224, 427, 558];
  receipt.terms.forEach((cost, i) => {
    const h = cost * 195;
    rect(c, xx[i], base - h, 75, h, i === 1 ? C.blue : '#9386d9');
    ink(c, cost.toFixed(1), xx[i] + 37.5, base - h - 16, C.deep, 38, 'Mono', 400, 'center');
  });
  for (const [start, name] of [[0, 'First try'], [2, 'Repair']]) {
    line(c, xx[start] - 10, base + 4, xx[start + 1] + 85, base + 4, C.iris);
    ink(c, name, (xx[start] + xx[start + 1] + 75) / 2, base + 55, C.dim, 31, 'Sans', 400, 'center');
  }
}

function draw(c, clock) {
  const echo = ease(clamp(0.08 + clock.seconds / 0.93));
  const showTable = cue(clock, 1, 'We want', 0.95);
  const leaveTable = cue(clock, 3, 'Follow the piece', 0.9);
  const table = showTable * (1 - leaveTable);
  const repair = cue(clock, 2, 'It tries', 0.68);
  const returned = cue(clock, 2, 'Ben has', 0.55);
  const split = cue(clock, 3, 'Follow the piece', 0.8);
  const mark = [
    cue(clock, 4, 'The first copy', 0.55),
    cue(clock, 4, 'gives the database tokens', 0.55),
    cue(clock, 4, 'The repair gets ones', 0.55),
  ];
  const test = cue(clock, 5, "Let's test", 0.88);
  const echoCost = cue(clock, 5, 'we raise the cost', 0.85);
  const modelCost = cue(clock, 6, 'Now add four tenths', 0.85);
  const readAgain = cue(clock, 6, 'The database reply stays', 1.15);
  const receipt = score(echoCost, modelCost);
  const side = Math.max(table, test);
  const x = mix(338, 310, side);
  const size = mix(123, 84, side) - split * 5;

  rect(c, 0, 0, 1920, 1080, gradient(c, 0, 240, 1640, 1140, [[0, '#fcfbff'], [0.65, C.pale], [1, C.floor]]));
  c.save();
  c.globalAlpha = echo;
  rect(c, 0, 443, 1920, 248, gradient(c, 0, 448, 1710, 680, [[0, C.peach], [1, '#fff6eb']]));
  line(c, 0, 444, 1920, 444, '#ead4c6');
  line(c, 0, 691, 1920, 691, '#ead4c6');
  c.restore();

  // The two occurrences share an x coordinate, even while the table slides out.
  speaker(c, 0, 333);
  fieldName(c, 0, { x, y: 355, size, split, mark: mark[0], focus: split, test, receipt });
  c.save();
  c.globalAlpha *= echo;
  speaker(c, 1, 559);
  const prefix = vocabulary.get(90).trimEnd();
  c.save();
  c.globalAlpha *= ease(clamp((clock.seconds - 0.91) / 0.25));
  ink(c, prefix, x, 500, C.orange, 34);
  c.restore();
  font(c, 34);
  if (mark[1]) {
    const end = x + c.measureText(prefix).width;
    c.save();
    c.globalAlpha *= mark[1];
    rounded(c, end + 19, 466, 42, 39, 5, '#f8d9c1');
    ink(c, String(positions[2].bit), end + 40, 496, C.orange, 30, 'Mono', 400, 'center');
    c.restore();
  }
  fieldName(c, 1, { x, y: mix(355, 600, echo), size, split, mark: mark[1], focus: split, test, receipt });
  c.restore();

  // The return opens a new model turn. Its input cursor waits through the schema inspection.
  const ready = ease(clamp((clock.seconds - 0.65) / 0.6));
  if (ready) {
    c.save();
    c.globalAlpha *= ready;
    speaker(c, 2, 786);
    font(c, size);
    const written = repair === 0 ? '' : repair < 0.62 ? vocabulary.get(21) : fixed;
    const cursorX = x + c.measureText(written).width;
    if (repair < 1) {
      c.save();
      c.globalAlpha *= (0.72 + 0.28 * Math.cos(clock.seconds * 3)) * (1 - repair);
      rect(c, cursorX + 2, 815 - size * 0.78, size * 0.41, size * 0.86, C.iris);
      c.restore();
      c.beginPath();
      c.rect(0, 698, cursorX, 245);
      c.clip();
    }
    fieldName(c, 2, { x, y: 815, size, split, mark: mark[2], focus: 0, test, receipt });
    c.restore();
  }

  if (readAgain) {
    // Trace the observation into the waiting model turn after the score settles.
    c.save();
    c.beginPath();
    c.rect(45, 596, 240, 155 * readAgain);
    c.clip();
    c.beginPath();
    c.moveTo(84, 596);
    c.lineTo(84, 726);
    c.quadraticCurveTo(84, 738, 96, 738);
    c.lineTo(121, 738);
    c.moveTo(110, 729);
    c.lineTo(121, 738);
    c.lineTo(110, 747);
    c.strokeStyle = C.orange;
    c.lineWidth = 4;
    c.stroke();
    ink(c, 'context', 137, 747, C.orange, 35, 'Sans');
    c.restore();
  }

  if (split) {
    c.save();
    c.globalAlpha *= split;
    const legend = mark[0] ? 'Loss mask' : 'Toy token boundaries';
    ink(c, legend, 85, 946, C.dim, 36, 'Sans');
    c.restore();
  }

  if (side) {
    c.save();
    c.translate(mix(1924, 1171, side), 0);
    rect(c, -22, 216, 22, 864, gradient(c, -22, 0, 0, 0, [[0, '#352c5e00'], [1, '#352c5e15']]));
    rect(c, 0, 216, 750, 864, gradient(c, 0, 216, 750, 1080, [[0, '#fffeff'], [1, '#eeebfc']]));
    line(c, 0, 216, 0, 1080, C.line);
    if (table) customerTable(c, returned);
    else costPlot(c, receipt);
    c.restore();
  }
  query(c);
}

export default { title, beats, draw, check };
