import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';

const beats = [
  {
    id: 'two-extra-strokes',
    say: 'Watch the left edge. Two extra strokes turned a three into an eight. Both runs used the same inputs and the same weights. Where did that pixel come from?',
    hold: 1.1,
  },
  {
    id: 'two-input-channels',
    say: 'Follow that spot back into the layer. On one GPU, a one-by-one convolution mixes two input channels at each pixel. ReLU acts on the result. Now give each GPU one channel and its weight.',
    hold: 0.8,
  },
  {
    id: 'signed-contributions',
    say: 'GPU zero reads three. Its weight is plus one. GPU one reads four. Its weight is minus one. Three and minus four are contributions to the very same pixel.',
    hold: 1,
  },
  {
    id: 'erase-the-negatives',
    say: 'Watch the orange pixels. ReLU turns negative values into zero. If each GPU applies it to its own contribution, what happens to the minus four?',
    hold: 1.1,
  },
  {
    id: 'a-pixel-that-survives',
    say: 'GPU zero sends its values across. GPU one can now add the two contributions. Three plus zero lights the pixel. The same thing happens along both extra strokes.',
    hold: 1.1,
  },
  {
    id: 'keep-the-sign',
    say: 'Back up and keep the signs this time. Send the same three across. It meets the minus four on GPU one. Their sum is minus one.',
    hold: 1.2,
  },
  {
    id: 'rectify-the-sum',
    say: 'Now apply ReLU. The left edge goes dark. Look across that same row. On the right edge, three and minus one made two. That pixel stays lit.',
    hold: 1.1,
  },
  {
    id: 'the-same-image',
    say: 'Bring back the single-GPU image. Every pixel matches, right down to its brightness. In this tensor-parallel layer, each GPU holds part of a sum. ReLU needs the whole sum.',
    hold: 2.7,
  },
];

// Two input feature planes on the same pixel grid. L marks a site with a
// stronger signal in the second channel. Both weights are shared across sites.
const stencil = [
  '.............',
  '...#######...',
  '..#########..',
  '.LL.......##.',
  '.LL.......##.',
  '.LL.......##.',
  '.LL.......##.',
  '..L.......#..',
  '...#######...',
  '..#########..',
  '.LL.......##.',
  '.LL.......##.',
  '.LL.......##.',
  '.LL.......##.',
  '..L.......#..',
  '..#########..',
  '...#######...',
  '.............',
];
const cols = stencil[0].length;
const rows = stencil.length;
const sites = [...stencil.join('')];
const channels = [
  sites.map(site => site === '.' ? 0 : 3),
  sites.map(site => ({ '.': 0, '#': 1, L: 4 })[site]),
];
const weights = [1, -1];
const relu = value => Math.max(value, 0);
const parts = channels.map((plane, rank) => plane.map(value => value * weights[rank]));
const activatedParts = parts.map(plane => plane.map(relu));
const add = (a, b) => a.map((value, i) => value + b[i]);
const signedSum = add(parts[0], parts[1]);
const earlyImage = add(...activatedParts);
const lateImage = signedSum.map(relu);
const singleImage = sites.map((_, i) =>
  relu(weights.reduce((acc, weight, channel) => acc + weight * channels[channel][i], 0)),
);
const empty = sites.map(() => 0);
const leftPixel = { col: 2, row: 5 };
const rightPixel = { col: 10, row: 5 };
const at = (plane, { col, row }) => plane[row * cols + col];
const numeral = value => String(value).replace('-', '−');
const leftValues = parts.map(plane => at(plane, leftPixel));
const rightValues = parts.map(plane => at(plane, rightPixel));
function sumText([a, b]) {
  return `${a} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${numeral(a + b)}`;
}

function check() {
  assert.ok(stencil.every(row => row.length === cols));
  assert.deepEqual(parts.map(plane => at(plane, leftPixel)), [3, -4]);
  assert.deepEqual([signedSum, lateImage, earlyImage].map(plane => at(plane, leftPixel)), [-1, 0, 3]);
  assert.deepEqual(parts.map(plane => at(plane, rightPixel)), [3, -1]);
  assert.deepEqual(lateImage, singleImage);
  assert.deepEqual(singleImage, sites.map(site => site === '#' ? 2 : 0));
  assert.deepEqual(earlyImage, sites.map(site => site === '.' ? 0 : 3));
  assert.equal(sites.filter((_, i) => earlyImage[i] > 0 && singleImage[i] === 0).length, 18);
}

const ink = '#241a38';
const secondary = '#554b66';
const pitch = 36;
const margin = 17;
const width = cols * pitch + 2 * margin;
const height = rows * pitch + 2 * margin;
const midY = 487;
const centers = [339, 881, 1531];
const comparison = [516, 1404];
const bodyScale = 0.80;
const largeScale = 0.91;
const clamp = n => Math.max(0, Math.min(1, n));
const smooth = n => clamp(n) ** 2 * (3 - 2 * clamp(n));
const mix = (a, b, t) => a + (b - a) * t;

function lettering(ctx, value, x, y, size, { color = ink, mono = false, weight = 500 } = {}) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Lesson ${mono ? 'Mono' : 'Sans'}"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function bevel(ctx, x, y, w, h, cut, color) {
  ctx.beginPath();
  ctx.moveTo(x + cut, y);
  ctx.lineTo(x + w - cut, y);
  ctx.lineTo(x + w, y + cut);
  ctx.lineTo(x + w, y + h - cut);
  ctx.lineTo(x + w - cut, y + h);
  ctx.lineTo(x + cut, y + h);
  ctx.lineTo(x, y + h - cut);
  ctx.lineTo(x, y + cut);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function localPixel({ col, row }) {
  return { x: margin + (col + 0.5) * pitch, y: margin + (row + 0.5) * pitch };
}

// The wells and the emitted light have separate rasters. A transfer can carry
// just the values across to the other GPU while both arrays stay in place.
const faceCache = new Map();
function raster(plane, lightOnly = false) {
  const cache = faceCache.get(plane) ?? new Map();
  faceCache.set(plane, cache);
  if (cache.has(lightOnly)) return cache.get(lightOnly);
  const face = createCanvas(width, height);
  const c = face.getContext('2d');
  if (!lightOnly) {
    const glass = c.createLinearGradient(0, 0, width, height);
    glass.addColorStop(0, '#31283f');
    glass.addColorStop(0.4, '#251e33');
    glass.addColorStop(0.72, '#1d172a');
    glass.addColorStop(1, '#292037');
    bevel(c, 0, 0, width, height, 16, '#847a91');
    bevel(c, 2, 2, width - 4, height - 5, 15, glass);
    for (let row = 0; row < rows; row++) {
      c.fillStyle = 'rgba(209,193,232,0.065)';
      c.fillRect(9, margin + row * pitch + 0.5, width - 18, 1.4);
    }
  }
  plane.forEach((value, i) => {
    const { x, y } = localPixel({ col: i % cols, row: Math.floor(i / cols) });
    if (!lightOnly) {
      bevel(c, x - 14.7, y - 14.7, 29.4, 30.2, 4, '#42394c');
      bevel(c, x - 14.7, y - 14.7, 29.4, 28.7, 4, '#171221');
      bevel(c, x - 12, y - 12, 24, 24, 3, '#2f273b');
    }
    if (!value) return;
    const tones = {
      '-4': ['#d8602b', '#ffb078'], '-1': ['#9d4b34', '#e59873'],
      1: ['#5a419e', '#8e7dca'], 2: ['#7550c2', '#b39aef'],
      3: ['#9762ef', '#dfc4ff'], 4: ['#b484ff', '#faeaff'],
    }[value];
    bevel(c, x - 12.2, y - 12.2, 24.4, 24.4, 3, tones[0]);
    bevel(c, x - 11.4, y - 11.5, 22.8, 21.8, 3, tones[1]);
    if (value < 0) {
      c.fillStyle = '#693825';
      c.fillRect(x - 6.8, y - 1.7, 13.6, 3.4);
    }
  });
  cache.set(lightOnly, face);
  return face;
}

function background(ctx) {
  const light = ctx.createLinearGradient(85, 70, 1630, 1220);
  light.addColorStop(0, '#f6f4fa');
  light.addColorStop(0.52, '#e5dfed');
  light.addColorStop(1, '#c7c1d4');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 1920, 1080);
}

// A row wipe is a way to read the arrays. It does not stand for a GPU schedule.
function plate(ctx, cx, scale, from, to = from, wipe = 1, cy = midY) {
  ctx.save();
  ctx.translate(cx - width * scale / 2, cy - height * scale / 2);
  ctx.scale(scale, scale);
  ctx.shadowColor = '#4b39594d';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 9;
  ctx.shadowOffsetY = 19;
  bevel(ctx, -6, -5, width + 12, height + 19, 20, '#81778b');
  ctx.shadowColor = 'transparent';
  const rim = ctx.createLinearGradient(0, 0, width, height);
  rim.addColorStop(0, '#ffffff');
  rim.addColorStop(0.56, '#ede6ee');
  rim.addColorStop(1, '#9d94aa');
  bevel(ctx, -6, -6, width + 12, height + 15, 20, rim);
  ctx.drawImage(raster(wipe >= 1 ? to : from), 0, 0);
  if (wipe > 0 && wipe < 1 && from !== to) {
    const edge = Math.max(1, height * wipe);
    ctx.drawImage(raster(to), 0, 0, width, edge, 0, 0, width, edge);
    ctx.fillStyle = '#fff4ff75';
    ctx.fillRect(2, edge, width - 4, 1.6);
  }
  ctx.restore();
}

function locator(ctx, cx, scale, pixel, opacity = 1, cy = midY) {
  if (opacity <= 0) return;
  const p = localPixel(pixel);
  const x = cx + (p.x - width / 2) * scale;
  const y = cy + (p.y - height / 2) * scale;
  const tip = cx - width * scale / 2 - 14;
  ctx.save();
  ctx.globalAlpha *= opacity;
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#ffec9a';
  ctx.beginPath();
  ctx.moveTo(tip + 8, y);
  ctx.lineTo(x - 19 * scale, y);
  ctx.stroke();
  ctx.strokeRect(x - 17 * scale, y - 17 * scale, 34 * scale, 34 * scale);
  ctx.fillStyle = '#553754';
  ctx.beginPath();
  ctx.moveTo(tip, y - 7);
  ctx.lineTo(tip + 9, y);
  ctx.lineTo(tip, y + 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function header(ctx, name, subtitle, x) {
  lettering(ctx, name, x, 101, 56, { weight: 600 });
  lettering(ctx, subtitle, x, 163, 38, { color: secondary });
}

function transfer(ctx, travel) {
  if (travel <= 0 || travel >= 1) return;
  const cx = mix(centers[0], centers[1], smooth(travel));
  ctx.save();
  ctx.globalAlpha = 0.80 * Math.min(1, travel * 7, (1 - travel) * 7);
  ctx.drawImage(raster(parts[0], true), cx - width * bodyScale / 2,
    midY - height * bodyScale / 2, width * bodyScale, height * bodyScale);
  ctx.restore();
}

function compare(ctx, clock, ending) {
  const marked = ending ? smooth(clock.reveal('Every pixel matches', 0.7))
    : smooth(clock.reveal('Where did that pixel', 0.55));
  const cy = 534;
  header(ctx, 'One GPU', 'Unsplit layer', comparison[0]);
  header(ctx, 'Two GPUs', ending ? 'Sum before ReLU' : 'Split by input channel', comparison[1]);
  plate(ctx, comparison[0], largeScale, singleImage, singleImage, 1, cy);
  plate(ctx, comparison[1], largeScale, ending ? lateImage : singleImage,
    ending ? lateImage : earlyImage, ending ? 1 : clamp(0.12 + clock.elapsed / 1.38), cy);
  comparison.forEach((x, i) => {
    locator(ctx, x, largeScale, leftPixel, marked, cy);
    ctx.save();
    ctx.globalAlpha = marked;
    const value = at(i === 0 ? singleImage : ending ? lateImage : earlyImage, leftPixel);
    lettering(ctx, `Pixel value  ${value}`, x, 922, 43, { mono: true });
    ctx.restore();
  });
}

function workspace(ctx, clock) {
  const { index, reveal, elapsed } = clock;
  let zoom = 0;
  if (index === 2) zoom = smooth(elapsed / 1.3);
  if (index === 3) zoom = 1;
  if (index === 4) zoom = 1 - smooth(elapsed / 0.8);
  const first = mix(centers[0], 483, zoom);
  const second = mix(centers[1], 1437, zoom);
  const output = centers[2];
  const scale = mix(bodyScale, 1.57, zoom);
  const cy = midY + (height / 2 - localPixel(leftPixel).y) * scale * zoom;
  const selectedRow = localPixel(leftPixel).y / height;
  header(ctx, 'GPU 0', 'Weight +1', first);
  header(ctx, 'GPU 1', 'Weight −1', second);
  let secondFrom = channels[1], secondTo = secondFrom, secondWipe = 1;
  let outputFrom = earlyImage, outputTo = outputFrom, outputWipe = 1;
  let travel = 0, switchPixel = 0;
  const raw = channels.map(plane => at(plane, leftPixel));
  let readouts = [...raw, at(earlyImage, leftPixel)];
  let description = 'Same pixel in both channels';

  if (index === 2) {
    secondTo = parts[1];
    secondWipe = reveal('Its weight is minus one', 0.85);
    outputTo = empty;
    outputWipe = clamp(elapsed / 0.7);
    readouts = [
      `${raw[0]} × ${weights[0]} = ${leftValues[0]}`,
      secondWipe > selectedRow ? `${raw[1]} × (${numeral(weights[1])}) = ${numeral(leftValues[1])}` : raw[1],
      '',
    ];
    description = 'Local products';
  } else if (index === 3) {
    secondFrom = parts[1];
    secondTo = activatedParts[1];
    secondWipe = reveal('orange pixels', 1.25);
    outputFrom = outputTo = empty;
    readouts = [leftValues[0], secondWipe > selectedRow ? relu(leftValues[1]) : numeral(leftValues[1]), ''];
    description = 'ReLU on each GPU';
  } else if (index === 4) {
    secondFrom = secondTo = activatedParts[1];
    travel = reveal('sends its values across', 1.35);
    outputFrom = empty;
    outputTo = earlyImage;
    outputWipe = reveal('GPU one can now add', 0.95);
    const local = leftValues.map(relu);
    readouts = [...local, outputWipe > selectedRow ? sumText(local) : ''];
    description = 'Add after local ReLU';
  } else if (index === 5) {
    secondFrom = activatedParts[1];
    secondTo = parts[1];
    secondWipe = clamp(elapsed / 1.15);
    travel = reveal('Send the same three across', 1.35);
    const sum = reveal('It meets the minus four', 0.95);
    if (sum > 0) {
      outputFrom = empty;
      outputTo = signedSum;
      outputWipe = sum;
    } else {
      outputFrom = earlyImage;
      outputTo = empty;
      outputWipe = secondWipe;
    }
    readouts = [leftValues[0], secondWipe > selectedRow ? numeral(leftValues[1]) : relu(leftValues[1]),
      sum > selectedRow ? sumText(leftValues) : ''];
    description = 'Add the signed contributions';
  } else if (index === 6) {
    secondFrom = secondTo = parts[1];
    outputFrom = signedSum;
    outputTo = lateImage;
    outputWipe = reveal('Now apply ReLU', 0.95);
    switchPixel = smooth(reveal('Look across that same row', 0.9));
    if (switchPixel === 1) readouts = [...rightValues.map(numeral), sumText(rightValues)];
    else if (switchPixel > 0) readouts = ['', '', ''];
    else readouts = [...leftValues.map(numeral), numeral(at(outputWipe > selectedRow ? lateImage : signedSum, leftPixel))];
    description = 'ReLU on the sum';
  }

  const cursor = { col: mix(leftPixel.col, rightPixel.col, switchPixel), row: leftPixel.row };
  // Pull the same row out of both plates. The yellow probe stays on its site
  // while the other rows and the output fall out of the crop.
  ctx.save();
  ctx.globalAlpha = 1 - smooth(zoom * 3);
  let resultLabel = 'Output';
  if (index === 1) resultLabel = 'Earlier output';
  if (index === 5 && outputTo === signedSum) resultLabel = 'Signed sum';
  header(ctx, resultLabel, 'On GPU 1', output);
  plate(ctx, output, bodyScale, outputFrom, outputTo, outputWipe);
  if (readouts[2] !== '' || switchPixel > 0) locator(ctx, output, bodyScale, cursor);
  lettering(ctx, readouts[2], output, 836, 58, { mono: true });
  ctx.restore();

  ctx.save();
  const cropTop = mix(180, 284, zoom);
  const cropBottom = mix(805, 686, zoom);
  ctx.beginPath();
  ctx.rect(0, cropTop, 1920, cropBottom - cropTop);
  ctx.clip();
  plate(ctx, first, scale, parts[0], parts[0], 1, cy);
  plate(ctx, second, scale, secondFrom, secondTo, secondWipe, cy);
  locator(ctx, first, scale, cursor, 1, cy);
  locator(ctx, second, scale, cursor, 1, cy);
  ctx.restore();
  transfer(ctx, travel);
  [first, second].forEach((x, i) =>
    lettering(ctx, readouts[i], x, mix(836, 790, zoom), mix(58, 70, zoom), { mono: true }),
  );
  lettering(ctx, description, 960, mix(910, 897, zoom), 43, { color: secondary });
}

function draw(ctx, clock) {
  background(ctx);
  const { index, elapsed } = clock;
  if (index === 0) {
    compare(ctx, clock, false);
  } else if (index === beats.length - 1) {
    compare(ctx, clock, true);
  } else {
    workspace(ctx, clock);
  }
  // A brief change of exposure marks the two cuts between wide and work views.
  if ((index === 1 || index === beats.length - 1) && elapsed < 0.25) {
    ctx.fillStyle = `rgba(242,238,248,${0.38 * (1 - elapsed / 0.25)})`;
    ctx.fillRect(0, 0, 1920, 1080);
  }
}

export default { title: 'Why the split layer drew an eight', beats, draw, check };
