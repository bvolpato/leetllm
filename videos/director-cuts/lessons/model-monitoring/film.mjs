import assert from 'node:assert/strict';

const title = 'The closed balcony';
const beats = [
  {
    id: 'matinee',
    say: 'Watch the red seats. Twenty people have already bought their tickets when the box office closes the balcony for the matinee.',
    hold: 1.0,
  },
  {
    id: 'count-the-house',
    say: 'The model uses the share of seats sold to forecast sellouts. With only the main floor on sale, what share should it see?',
    hold: 2.2,
  },
  {
    id: 'same-booking',
    say: 'Take this one booking record and run it through both calculations. Look at the input the training code produces. Then look at what the live model gets.',
    hold: 1.4,
  },
  {
    id: 'divisor',
    say: 'Forty percent and twenty percent. Follow the twenty tickets into each calculation. Training divides by the fifty seats on sale. The live service always divides by a hundred. It still counts the closed balcony.',
    hold: 0.8,
  },
  {
    id: 'full-house-test',
    say: 'Try a copy of the booking with the balcony open. Now there really are a hundred seats on sale. A test that used only this record would pass.',
    hold: 1.0,
  },
  {
    id: 'repeat',
    say: 'Bring back the matinee. There’s the split again. That’s training-serving skew. The same raw record becomes two different inputs before the model even runs.',
    hold: 1.1,
  },
  {
    id: 'share-the-field',
    say: 'Give the live service the same calculation as training. Replay the matinee and follow the seat count back to the booking.',
    hold: 1.3,
  },
  {
    id: 'keep-the-matinee',
    say: 'Both paths give forty percent. Keep this closed-balcony booking as a test. If the fixed hundred slips back in, this is the show that will catch it.',
    hold: 2.6,
  },
];

// Each digit is one seat. The groups of adjacent sales stay put throughout the replay.
const mainRows = ['0111000110', '1100001110', '0001100100', '1010000011', '0000011100'];
const balconyRows = Array.from({ length: 5 }, () => '0000000000');
const mainCapacity = mainRows.join('').length;
const balconyCapacity = balconyRows.join('').length;
const ticketsSold = [...mainRows.join('')].filter(seat => seat === '1').length;

function booking(balconyOpen) {
  return { sold: ticketsSold, onSale: mainCapacity + (balconyOpen ? balconyCapacity : 0) };
}
const fixedDivisor = 100;
function saleShare(record, divisor = record.onSale) {
  return record.sold / divisor;
}
function replay(record, repaired) {
  const liveDivisor = repaired ? record.onSale : fixedDivisor;
  return { training: saleShare(record), live: saleShare(record, liveDivisor), liveDivisor };
}
function check() {
  const matinee = booking(false);
  assert.deepEqual(matinee, { sold: 20, onSale: 50 });
  const full = booking(true);
  assert.deepEqual(full, { sold: 20, onSale: 100 });
  assert.equal(replay(full, false).live, replay(full, false).training);
  assert.deepEqual(replay(matinee, false), { training: 0.4, live: 0.2, liveDivisor: 100 });
  for (const record of [matinee, full, { sold: 20, onSale: 80 }]) {
    const result = replay(record, true);
    assert.equal(result.liveDivisor, record.onSale);
    assert.equal(result.live, record.sold / record.onSale);
    assert.equal(result.training, result.live);
  }
}

const ink = '#372e3b';
const red = '#9c293f';
const blue = '#254567';
const ivory = '#fff0ce';
const paper = '#f8e8ca';
const fine = '#b5a185';
const W = 858;
const H = 890;
const RIGHT = 788;
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => { const v = clamp(x); return v * v * (3 - 2 * v); };

function label(c, text, x, y, size, color = ink, family = 'Lesson Sans', align = 'left', style = '') {
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.font = (style ? style + ' ' : '') + size + 'px "' + family + '"';
  c.fillStyle = color;
  c.fillText(String(text), x, y);
}
function stroke(c, points, color, width) {
  c.beginPath();
  for (const [i, [x, y]] of points.entries()) {
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
function gradient(c, x1, y1, x2, y2, stops) {
  const g = c.createLinearGradient(x1, y1, x2, y2);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}
function backdrop(c) {
  c.fillStyle = gradient(c, 80, 0, 1600, 1080, [[0, '#742f48'], [.4, '#50233b'], [1, '#241c31']]);
  c.fillRect(0, 0, 1920, 1080);
  // Broad folds of box-office baize continue beyond the edges of the folio.
  c.save();
  c.transform(1, 0, -.29, 1, 0, 0);
  for (let i = -1; i < 17; i++) {
    const x = i * 161;
    c.fillStyle = gradient(c, x, 0, x + 161, 0, [[0, '#150e211e'], [.34, '#ef95820b'], [.65, '#180e271c'], [.86, '#140b2529'], [1, '#150e211e']]);
    c.fillRect(x, 0, 162, 1080);
  }
  c.restore();
}
function sheet(c, x, width) {
  c.fillStyle = '#21142655';
  c.fillRect(x + 9, 14, width + 3, H + 4);
  c.fillStyle = '#8b5556';
  c.fillRect(x - 2, 3, width + 4, H + 5);
  c.fillStyle = gradient(c, x, 0, x + width, H, [[0, '#fff2d9'], [.47, paper], [1, '#e7ceb1']]);
  c.fillRect(x, 0, width, H);
  // Fibres in the uncoated stock. The marks are anchored to the sheet.
  c.lineWidth = 1;
  c.strokeStyle = '#75574a16';
  c.beginPath();
  for (let i = 0; i < 360; i++) {
    const px = x + 6 + ((i * 89.37 + i * i * .771) % (width - 16));
    const py = 5 + ((i * 127.55 + i * i * .391) % (H - 12));
    c.moveTo(px, py);
    c.lineTo(px + 1 + i % 6, py + .6);
  }
  c.stroke();
}
function fan(c, x, y, r, color) {
  c.save();
  c.translate(x, y);
  c.lineWidth = 1.7;
  for (let i = -3; i <= 3; i++) {
    const a = i * .23;
    stroke(c, [[0, 0], [Math.sin(a) * r, -Math.cos(a) * r]], color, 1.7);
  }
  c.restore();
}
function chair(c, x, y, angle, sold) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  // The curved back and the two arms make each mark a particular place in the house.
  c.fillStyle = sold ? red : '#ead9bb';
  c.strokeStyle = sold ? '#76203b' : '#7d6e64';
  c.lineWidth = 1.9;
  c.beginPath();
  c.moveTo(-18, -9);
  c.quadraticCurveTo(0, -15, 18, -9);
  c.lineTo(17, 7);
  c.quadraticCurveTo(0, 13, -17, 7);
  c.closePath();
  c.fill();
  c.stroke();
  c.beginPath();
  c.moveTo(-17, 3);
  c.quadraticCurveTo(0, 9, 17, 3);
  c.strokeStyle = sold ? '#ed9a8e' : '#9a8774';
  c.stroke();
  stroke(c, [[-21, -5], [-21, 5]], sold ? red : '#8d7c69', 3);
  stroke(c, [[21, -5], [21, 5]], sold ? red : '#8d7c69', 3);
  c.restore();
}
function houseRows(c, rows, startY, spread) {
  rows.forEach((row, r) => {
    [...row].forEach((seat, j) => {
      const col = j - 4.5;
      const x = W / 2 + col * (spread + r * 1.2) + Math.sign(col) * 18;
      const bow = 19 * (1 - Math.pow(col / 4.5, 2));
      chair(c, x, startY + r * 34 + bow, -.026 * col, seat === '1');
    });
  });
}
function arch(c, y, bend, from, to, color, width) {
  c.beginPath();
  c.moveTo(from, y);
  c.quadraticCurveTo((from + to) / 2, y + bend, to, y);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
function shutter(c, closed) {
  if (closed <= 0) return;
  const height = 239;
  c.save();
  c.beginPath();
  c.rect(46, 503, W - 92, height);
  c.clip();
  c.translate(0, (1 - closed) * height);
  c.fillStyle = '#38243944';
  c.fillRect(53, 497, W - 101, height + 5);
  c.fillStyle = gradient(c, 46, 503, W - 46, 740, [[0, '#345a78'], [.6, blue], [1, '#172f4b']]);
  c.fillRect(46, 503, W - 92, height);
  // A silk balcony closure slip. Paired curtain swags leave the lettering clear.
  for (const mirror of [false, true]) {
    c.save();
    if (mirror) { c.translate(W, 0); c.scale(-1, 1); }
    for (let i = 0; i < 7; i++) {
      c.beginPath();
      c.moveTo(54 + i * 22, 511);
      c.quadraticCurveTo(73 + i * 20, 563 + i * 5, 62, 637 + i * 2);
      c.quadraticCurveTo(85 + i * 5, 669 + i * 2, 86 + i * 7, 731);
      c.strokeStyle = '#a2b5b19c';
      c.lineWidth = 1.9;
      c.stroke();
    }
    c.restore();
  }
  arch(c, 523, 21, 205, W - 205, '#e0c5a6', 1.8);
  fan(c, W / 2, 584, 34, '#ebd5b3');
  label(c, 'Balcony closed', W / 2, 654, 62, ivory, 'Lesson Serif', 'center', 'italic');
  stroke(c, [[W / 2 - 68, 682], [W / 2 + 68, 682]], '#e0c5a6', 2);
  c.restore();
}
function plan(c, record, closed) {
  sheet(c, 0, W);
  const center = W / 2;
  for (const offset of [18, 23]) {
    c.strokeStyle = offset === 18 ? red : '#a97a72';
    c.lineWidth = offset === 18 ? 2.3 : 1;
    c.strokeRect(offset, offset, W - offset * 2, H - offset * 2);
  }
  label(c, 'Matinee', center, 114, 90, red, 'Lesson Serif', 'center', 'italic');
  for (const left of [false, true]) {
    c.save();
    if (!left) { c.translate(W, 0); c.scale(-1, 1); }
    for (let k = 0; k < 3; k++) {
      stroke(c, [[63 + k * 8, 83 - k * 8], [166 - k * 8, 83 - k * 8], [194 - k * 8, 100 - k * 8], [229, 100 - k * 8]], '#a86966', 1.8);
    }
    c.restore();
  }
  c.fillStyle = '#d7bdab';
  c.beginPath();
  c.moveTo(197, 153);
  c.quadraticCurveTo(center, 123, W - 197, 153);
  c.lineTo(W - 193, 170);
  c.quadraticCurveTo(center, 199, 193, 170);
  c.closePath(); c.fill();
  label(c, 'Stage', center, 170, 31, ink, 'Lesson Serif', 'center');
  houseRows(c, mainRows, 225, 61);
  arch(c, 394, 49, 83, W - 83, '#9a816d', 2);
  label(c, 'Main floor', center, 466, 40, ink, 'Lesson Serif', 'center');
  houseRows(c, balconyRows, 537, 65);
  label(c, 'Balcony', center, 739, 36, ink, 'Lesson Serif', 'center');
  shutter(c, closed);
  stroke(c, [[45, 745], [W - 45, 745]], '#917967', 3);
  c.beginPath();
  c.arc(117, 811, 11, 0, Math.PI * 2);
  c.fillStyle = red; c.fill();
  label(c, record.sold + ' sold', 148, 825, 48, red, 'Lesson Sans', 'left', '600');
  label(c, record.onSale + ' on sale', W - 85, 825, 48, ink, 'Lesson Sans', 'right', '600');
}
function reading(c, { y, name, fraction, divisor, fixed, formula, alpha, repaired }) {
  if (alpha <= 0) return;
  c.save();
  c.globalAlpha *= alpha;
  const end = RIGHT - 64;
  label(c, name, 64, y, 50, ink, 'Lesson Serif');
  label(c, Math.round(fraction * 100) + '%', end, y + 110, 111, repaired ? blue : ink, 'Lesson Serif', 'right');
  if (formula > 0) {
    c.globalAlpha *= formula;
    label(c, ticketsSold + ' sold', 210, y + 69, 45, red, 'Lesson Sans', 'center');
    stroke(c, [[70, y + 84], [350, y + 84]], ink, 2.8);
    label(c, divisor + (fixed ? ' fixed' : ' on sale'), 210, y + 136, 45, fixed ? ink : blue, 'Lesson Sans', 'center');
  }
  c.restore();
}
function analysisPage(c, state, record) {
  const result = replay(record, state.repaired);
  sheet(c, 0, RIGHT);
  label(c, 'Share sold', 61, 128, 84, red, 'Lesson Serif', 'left', 'italic');
  label(c, 'Input to the sellout forecast', 65, 184, 36, ink);
  stroke(c, [[64, 215], [RIGHT - 64, 215]], fine, 2);
  reading(c, { y: 307, name: 'Training', fraction: result.training, divisor: record.onSale,
    fixed: false, formula: state.formula, alpha: state.training, repaired: false });
  stroke(c, [[64, 499], [RIGHT - 64, 499]], fine, 1.5);
  reading(c, { y: 583, name: 'Live service', fraction: result.live, divisor: result.liveDivisor,
    fixed: !state.repaired, formula: state.formula, alpha: state.live, repaired: state.repaired });
  if (state.link > 0) {
    // The corrected divisor takes its value from the booking field across the fold.
    c.save();
    c.strokeStyle = blue;
    c.lineWidth = 4;
    c.lineCap = 'round';
    c.setLineDash([403, 410]);
    c.lineDashOffset = (1 - state.link) * 403;
    c.beginPath();
    c.moveTo(-152, 842);
    c.bezierCurveTo(40, 878, 14, 741, 183, 737);
    c.stroke();
    c.setLineDash([]);
    if (state.link > .96) {
      stroke(c, [[169, 730], [183, 737], [169, 746]], blue, 3);
    }
    c.restore();
  }
}
function stateAt(t) {
  const { index, elapsed } = t;
  const rise = (stage, phrase, duration) =>
    index < stage ? 0 : index > stage ? 1 : ease(t.reveal(phrase, duration));
  const close = ease((elapsed + .04) / 1.55);
  const openCopy = rise(4, 'Try a copy', 1.35);
  const restore = rise(5, 'Bring back the matinee', 1.35);
  const closed = index === 0 ? close : 1 - openCopy + restore;
  const link = rise(6, 'Replay the matinee', 1.1);
  return {
    closed,
    // Closing a section changes availability in one transaction. The slip shows it moving.
    balconyOpen: closed < .5,
    unfold: rise(2, 'Take this one booking record', 1.65),
    training: rise(2, 'run it through both calculations', .45),
    live: rise(2, 'Look at the input', .45),
    formula: rise(3, 'Follow the twenty tickets', .55),
    link,
    repaired: link >= .96,
  };
}
function draw(c, t) {
  const state = stateAt(t);
  const record = booking(state.balconyOpen);
  backdrop(c);
  c.save();
  // The closed playbill fills the opening shot. Its facing leaf opens for the replay.
  const scale = 1.09 - .09 * state.unfold;
  const pageWidth = W + RIGHT * state.unfold;
  c.translate(960, 525);
  c.rotate((-.024 + .017 * state.unfold));
  c.scale(scale, scale);
  c.translate(-pageWidth / 2, -H / 2);
  plan(c, record, state.closed);
  if (state.unfold > .001) {
    c.save();
    c.translate(W, 0);
    c.scale(state.unfold, 1);
    analysisPage(c, state, record);
    c.fillStyle = gradient(c, 0, 0, 42, 0, [[0, '#40293d3e'], [.25, '#69444a1d'], [1, '#69444a00']]);
    c.fillRect(0, 0, 42, H);
    if (state.unfold < 1) {
      c.fillStyle = 'rgba(89,55,63,' + (.28 * (1 - state.unfold)) + ')';
      c.fillRect(0, 0, RIGHT, H);
    }
    c.restore();
  }
  c.restore();
}
export default { title, beats, draw, check };
