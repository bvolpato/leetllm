import assert from 'node:assert/strict';
import { drawFieldPlate } from './field-plate.mjs';

const title = 'The sparrow the bird feature missed';
const beats = [
  {
    id: 'turn-the-leaf',
    say: 'Watch the feature labeled bird as we turn from robin to sparrow. Both words name birds. Why does the second page get a zero?',
    hold: 1.0,
  },
  {
    id: 'the-two-coordinates',
    say: 'Here is the activation we gave the word sparrow in our toy model. The first coordinate records bird. The second records sparrow. Both are one.',
    hold: 0.8,
  },
  {
    id: 'the-empty-feature',
    say: 'Our encoder reads both numbers. For the bird feature it subtracts the second from the first and clips the result at zero. On the robin page that gave us one. On this page, one minus one gives us zero.',
    hold: 0.85,
  },
  {
    id: 'two-blocks',
    say: 'A sparse autoencoder learns to rebuild an activation with a few weighted directions. Think of each contribution as a printing block. With separate directions for bird and sparrow, one block prints here and the other prints here.',
    hold: 1.1,
  },
  {
    id: 'one-block',
    say: 'Now try the dictionary that gave our sparrow a zero. Leave the bird block aside. The sparrow block has two faces. Watch the paper as it lifts.',
    hold: 1.35,
  },
  {
    id: 'the-left-impression',
    say: 'Look under bird. The sparrow feature wrote a one there too. Both coordinates match the original, with a single active feature. This is feature absorption.',
    hold: 1.05,
  },
  {
    id: 'missing-from-the-index',
    say: 'If you collected just the words that light up the bird feature, you would find the robin. You would miss this sparrow, even though its bird coordinate came back exactly.',
    hold: 2.3,
  },
];

const rows = { robin: [1, 0], sparrow: [1, 1] };
const unit = Math.SQRT1_2;
const separateDictionary = [[1, 0], [0, 1]];
const sharedDictionary = [[1, 0], [unit, unit]];

// The word is represented by two chosen coordinates. The plate illustrates its referent.
function encode([bird, sparrow]) {
  return [Math.max(0, bird - sparrow), Math.SQRT2 * Math.max(0, sparrow)];
}

function decode(dictionary, coefficients) {
  const writes = dictionary.map((column, i) => column.map(value => coefficients[i] * value));
  return {
    writes,
    output: [0, 1].map(j => writes.reduce((sum, row) => sum + row[j], 0)),
    active: coefficients.filter(value => value > 0).length,
  };
}

const separate = decode(separateDictionary, rows.sparrow);
const absorbed = decode(sharedDictionary, encode(rows.sparrow));
const ink = '#273638';
const red = '#943f2e';
const blue = '#254f63';
const muted = '#5c6867';
const paper = '#f6f1e3';
const col = [1380, 1680];

function check() {
  const near = (x, y) => assert.ok(Math.abs(x - y) < 1e-10, `${x} != ${y}`);
  for (const input of Object.values(rows)) {
    const recovered = decode(sharedDictionary, encode(input));
    input.forEach((value, j) => near(recovered.output[j], value));
  }
  assert.deepEqual(encode(rows.robin), [1, 0]);
  near(encode(rows.sparrow)[0], 0);
  near(encode(rows.sparrow)[1], Math.SQRT2);
  near(Math.hypot(...sharedDictionary[1]), 1);
  assert.deepEqual(separate.writes, [[1, 0], [0, 1]]);
  assert.deepEqual(absorbed.writes[0], [0, 0]);
  absorbed.writes[1].forEach(value => near(value, 1));
  near(separate.active, 2);
  near(absorbed.active, 1);
  assert.deepEqual(Object.keys(rows).filter(word => encode(rows[word])[0] > 0), ['robin']);
}

const clamp = t => Math.max(0, Math.min(1, t));
function ease(t) {
  t = clamp(t);
  return t * t * (3 - 2 * t);
}
const mix = (a, b, t) => a + (b - a) * t;
const fmt = value => String(Math.round(value * 100) / 100);

function text(c, value, x, y, size, options = {}) {
  const { color = ink, align = 'left', face = 'Sans', style = '' } = options;
  c.fillStyle = color;
  c.font = `${style} ${size}px "Lesson ${face}"`.trim();
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(value, x, y);
}

function line(c, x1, y1, x2, y2, color, width = 2) {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}

function polygon(c, points, color) {
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  c.fillStyle = color;
  c.fill();
}

function layer(c, alpha, paint) {
  if (alpha <= 0) return;
  c.save();
  c.globalAlpha *= clamp(alpha);
  paint();
  c.restore();
}

// Keep the fiber marks fixed to the sheet when its edge lifts.
function stock(c, sparrow) {
  c.fillStyle = paper;
  c.fillRect(0, 0, 1920, 1080);
  const wash = c.createLinearGradient(0, 50, 820, 940);
  wash.addColorStop(0, sparrow ? '#c4d9da' : '#dfd6bc');
  wash.addColorStop(0.7, sparrow ? '#d8e6e0' : '#e9dfc8');
  wash.addColorStop(1, sparrow ? '#b1cacc' : '#d4c8a9');
  polygon(c, [[0, 0], [843, 0], [840, 120], [843, 239], [839, 343], [843, 461],
    [838, 566], [840, 699], [837, 784], [841, 906], [839, 1080], [0, 1080]], wash);
  const fold = c.createLinearGradient(837, 0, 874, 0);
  fold.addColorStop(0, '#2c3f3a22');
  fold.addColorStop(0.3, '#63736c0f');
  fold.addColorStop(1, '#63736c00');
  c.fillStyle = fold;
  c.fillRect(842, 0, 32, 1080);
  // Fine flecks of two inks give the stock a stable print grain.
  for (let i = 1; i <= 640; i++) {
    const x = (i * 421 + i * i * 13) % 1920;
    const y = (i * 127 + i * i * 17) % 1080;
    c.fillStyle = i % 3 ? '#5c5a4510' : '#fffffa80';
    c.fillRect(x + Math.sin(i) * 8, y, 1 + i % 5, 1.4);
  }
}

function plate(c, word) {
  const sparrow = word === 'sparrow';
  stock(c, sparrow);
  text(c, 'Input token', 84, 135, 38, { color: '#374f50' });
  text(c, word, 77, 259, 120, { face: 'Serif', style: 'italic' });
  c.save();
  c.beginPath();
  c.rect(0, 267, 838, 640);
  c.clip();
  c.translate(-16, 246);
  c.scale(1.48, 1.48);
  drawFieldPlate(c, sparrow);
  c.restore();
}

// The large readout moves to the margin when the two coordinates appear.
function readout(c, word, tuck) {
  const x = mix(1370, 368, tuck);
  const labelY = mix(318, 886, tuck);
  const valueY = mix(743, 892, tuck);
  text(c, '“Bird” feature', x, labelY, mix(82, 42, tuck), { face: 'Serif', align: 'center' });
  text(c, fmt(encode(rows[word])[0]), mix(1370, 572, tuck), valueY, mix(454, 68, tuck),
    { face: 'Serif', color: red, align: 'center' });
}

function openPage(c, word) {
  plate(c, word);
  readout(c, word, 0);
}

function pageTurn(c, t) {
  if (t === 0 || t === 1) {
    openPage(c, t === 0 ? 'robin' : 'sparrow');
    return;
  }
  openPage(c, 'sparrow');
  const edge = mix(2040, -150, t);
  const slant = 45 * Math.sin(Math.PI * t);
  c.save();
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(edge, 0);
  c.lineTo(edge + slant, 1080);
  c.lineTo(0, 1080);
  c.closePath();
  c.clip();
  c.translate(-95 * t, 0);
  openPage(c, 'robin');
  c.restore();
  c.save();
  c.transform(1, 0, slant / 1080, 1, edge, 0);
  const curl = c.createLinearGradient(-86, 0, 30, 0);
  curl.addColorStop(0, '#efefdd00');
  curl.addColorStop(0.42, '#fcf8ea');
  curl.addColorStop(0.72, '#dedbc9');
  curl.addColorStop(0.74, '#666c6355');
  curl.addColorStop(1, '#a7aa9500');
  c.fillStyle = curl;
  c.fillRect(-86, 0, 116, 1080);
  c.restore();
}

function numeral(c, value, x, y, color) {
  text(c, fmt(value), x, y, 118, { face: 'Serif', align: 'center', color });
}

function original(c, showBird, showSparrow, title) {
  text(c, title, 936, 151, 64, { face: 'Serif' });
  line(c, 936, 183, 1812, 183, '#a8a99d');
  ['Bird', 'Sparrow'].forEach((label, j) => {
    layer(c, j ? showSparrow : showBird, () => {
      text(c, label, col[j], 267, 58, { face: 'Serif', align: 'center' });
      numeral(c, rows.sparrow[j], col[j], 409, ink);
    });
  });
  text(c, 'Original', 937, 382, 42);
  line(c, 936, 448, 1812, 448, '#a8a99d');
}

function equation(c, clock) {
  const subtraction = ease(clock.reveal('subtracts the second', 0.6));
  const robin = ease(clock.reveal('On the robin page', 0.45));
  const sparrow = ease(clock.reveal('On this page', 0.55));
  text(c, 'Bird feature', 937, 558, 43, { color: red });
  layer(c, subtraction, () => {
    text(c, 'max(0, bird − sparrow)', 938, 639, 56, { face: 'Serif', color: red });
  });
  layer(c, robin, () => {
    text(c, 'robin', 940, 743, 43, { face: 'Serif', style: 'italic' });
    text(c, `${rows.robin[0]} − ${rows.robin[1]} = ${encode(rows.robin)[0]}`, 1236, 747, 57, { face: 'Mono' });
  });
  layer(c, sparrow, () => {
    text(c, 'sparrow', 940, 837, 43, { face: 'Serif', style: 'italic' });
    text(c, `${rows.sparrow[0]} − ${rows.sparrow[1]} = ${encode(rows.sparrow)[0]}`, 1236, 841, 57, { face: 'Mono', color: red });
  });
}

function block(c, xs, name, y, color) {
  const middle = (xs[0] + xs.at(-1)) / 2;
  const half = xs.length === 2 ? 260 : 120;
  const l = middle - half;
  const r = middle + half;
  // Two separate inked feet belong to the same upper block for a combined direction.
  for (const x of xs) {
    polygon(c, [[x - 48, y - 7], [x + 48, y - 7], [x + 48, y + 16], [x - 48, y + 16]], '#392f2a');
    polygon(c, [[x - 48, y + 16], [x + 48, y + 16], [x + 44, y + 24], [x - 52, y + 24]], color);
  }
  const side = c.createLinearGradient(0, y - 62, 0, y);
  side.addColorStop(0, '#bc9262');
  side.addColorStop(1, '#a98159');
  polygon(c, [[l, y - 62], [r, y - 62], [r, y], [l, y]], side);
  polygon(c, [[l, y - 62], [l + 24, y - 91], [r + 24, y - 91], [r, y - 62]], '#dec49d');
  polygon(c, [[r, y - 62], [r + 24, y - 91], [r + 24, y - 22], [r, y]], '#8a694c');
  line(c, l + 2, y - 59, r - 1, y - 59, '#e2c699', 2);
  for (let i = 0; i < 7; i++) {
    const a = l + 35 + i * 4;
    const b = r - 7 + i;
    const h = y - 66 - i * 3.3;
    c.beginPath();
    c.moveTo(a, h);
    c.bezierCurveTo(middle - 12, h + 6, middle + 39, h - 6, b, h);
    c.strokeStyle = '#ad89654f';
    c.lineWidth = 1.8;
    c.stroke();
  }
  text(c, name, middle, y - 14, 49, { face: 'Serif', align: 'center', color: '#302820' });
}

function printing(c, state) {
  const { blocks, engraved, alpha, active, label } = state;
  layer(c, alpha, () => {
    text(c, 'Rebuilt', 938, 762, 44);
    for (let j = 0; j < col.length; j++) {
      const x = col[j];
      line(c, x - 54, 791, x + 54, 791, '#a5a49b', 2);
      const mark = engraved[j];
      if (mark) layer(c, mark.opacity, () => numeral(c, mark.value, x, 780, mark.color));
    }
    for (const item of blocks) {
      const { xs, lift, opacity, name, color } = item;
      layer(c, opacity, () => {
        const mid = (xs[0] + xs.at(-1)) / 2;
        c.beginPath();
        c.ellipse(mid + lift * 24, 765 + lift * 9, xs.length === 2 ? 247 : 107, 12 + lift * 5, 0, 0, 2 * Math.PI);
        c.fillStyle = `rgba(70,55,35,${0.16 - lift * 0.11})`;
        c.fill();
        block(c, xs, name, 752 - lift * 167, color);
      });
    }
    layer(c, active, () => {
      text(c, label, 1528, 887, 42, { align: 'center', color: muted });
    });
  });
}

function contact(stroke) {
  const down = ease(stroke / 0.37);
  const up = ease((stroke - 0.53) / 0.47);
  return { lift: 1 - down + up, imprint: ease((stroke - 0.46) / 0.13) };
}

function twoBlocks(c, show, first, second, opacity = 1) {
  const presses = [contact(first), contact(second)];
  const colors = [blue, red];
  printing(c, {
    blocks: ['Bird', 'Sparrow'].map((name, j) => ({
      name, xs: [col[j]], lift: presses[j].lift, color: colors[j], opacity: 1,
    })),
    engraved: presses.map((press, j) => ({ opacity: press.imprint, value: separate.writes[j][j], color: colors[j] })),
    active: presses[1].imprint,
    label: `${separate.active} active features`,
    alpha: show * opacity,
  });
}

function oneBlock(c, show, stroke) {
  const { lift, imprint } = contact(stroke);
  printing(c, {
    blocks: [{ name: 'Sparrow', xs: col, lift, color: red, opacity: 1 }],
    engraved: absorbed.writes[1].map(value => ({ opacity: imprint, value, color: red })),
    active: imprint, label: `${absorbed.active} active feature`, alpha: show,
  });
}

function circleImpression(c, t) {
  if (t <= 0) return;
  c.beginPath();
  c.ellipse(col[0], 739, 66, 64, -0.16, Math.PI * 1.3, Math.PI * (1.3 + 1.94 * t));
  c.strokeStyle = red;
  c.lineCap = 'round';
  c.lineWidth = 4;
  c.stroke();
}

function indexLeaf(c, clock) {
  const turn = ease(clock.reveal('If you collected', 0.85));
  const choose = ease(clock.reveal('You would miss', 1.1));
  c.save();
  c.beginPath();
  c.rect(0, 0, 841, 1080);
  c.clip();
  c.translate(0, (1 - turn) * 1080);
  c.fillStyle = '#d4e2dd';
  c.fillRect(0, 0, 843, 1080);
  text(c, 'Bird feature index', 63, 159, 68, { face: 'Serif' });
  text(c, 'Keep values above zero', 67, 231, 42, { color: muted });
  for (const [i, word] of ['robin', 'sparrow'].entries()) {
    const value = encode(rows[word])[0];
    const x = 51 + i * 380;
    const slide = value > 0 ? 0 : choose;
    c.save();
    c.translate(x, 337 + 790 * slide);
    c.rotate((i ? 0.022 : -0.018) + slide * 0.16);
    c.fillStyle = '#52625223';
    c.fillRect(6, 10, 350, 449);
    c.fillStyle = word === 'robin' ? '#ede6d4' : '#f6f3e9';
    c.fillRect(0, 0, 350, 449);
    text(c, word, 26, 78, 66, { face: 'Serif', style: 'italic' });
    c.save();
    c.beginPath();
    c.rect(0, 88, 350, 274);
    c.clip();
    c.translate(0, 82);
    c.scale(0.62, 0.62);
    drawFieldPlate(c, word === 'sparrow');
    c.restore();
    line(c, 26, 362, 324, 362, '#b5b1a4');
    text(c, 'Value', 26, 421, 37);
    text(c, fmt(value), 316, 424, 61, { face: 'Serif', color: red, align: 'right' });
    c.restore();
  }
  c.restore();
}

function draw(c, clock) {
  c.save();
  if (clock.index === 0) {
    pageTurn(c, ease((clock.elapsed - 0.18) / 2.55));
  } else {
    plate(c, 'sparrow');
    const tuck = clock.index === 1 ? ease(clock.elapsed / 0.95) : 1;
    let showReadout = 1;
    if (clock.index === 3) showReadout = 1 - ease(clock.elapsed / 0.5);
    if (clock.index === 4) showReadout = ease(clock.reveal('gave our sparrow', 0.5));
    layer(c, showReadout, () => readout(c, 'sparrow', tuck));
    const bird = clock.index === 1 ? ease(clock.reveal('The first coordinate', 0.55)) : 1;
    const sparrow = clock.index === 1 ? ease(clock.reveal('The second', 0.55)) : 1;
    layer(c, tuck, () => original(c, bird, sparrow, clock.index === 6 ? 'Sparrow activation' : 'Toy activation'));
    switch (clock.index) {
      case 2:
        equation(c, clock);
        break;
      case 3:
        twoBlocks(c, ease(clock.reveal('a few weighted directions', 0.7)),
          clock.reveal('one block prints here', 1.65), clock.reveal('the other prints here', 1.65));
        break;
      case 4: {
        const clear = ease(clock.reveal('try the dictionary', 0.85));
        twoBlocks(c, 1, 1, 1, 1 - clear);
        oneBlock(c, ease(clock.reveal('The sparrow block', 0.75)), clock.reveal('Watch the paper', 2.15));
        break;
      }
      case 5:
      case 6:
        oneBlock(c, 1, 1);
        circleImpression(c, clock.index === 5 ? ease(clock.reveal('Look under bird', 1.1)) : 1);
        if (clock.index === 6) indexLeaf(c, clock);
        break;
    }
  }
  c.restore();
}

export default { title, beats, draw, check };
