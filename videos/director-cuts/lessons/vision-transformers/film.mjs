// The elevator display and the two enlarged patches use the same binary bitmap.
const side = 8;
const asPixels = (rows) => rows.flatMap((row) => [...row].map(Number));
const seven = asPixels([
  '00000000', '01111110', '01111110', '00001100',
  '00011000', '00110000', '00110000', '00000000',
]);
const upRows = [
  '00011000', '00111100', '01111110', '11111111',
  '00011000', '00011000', '00011000', '00011000',
];
const up = asPixels(upRows);
const down = asPixels([...upRows].reverse());

const beats = [
  {
    id: 'landing',
    say: 'Watch the arrow above the elevator doors. Which way is the next car going?',
    hold: 1.1,
  },
  {
    id: 'camera-crop',
    say: "Down. Take just the display. Split the image into two square patches, eight pixels on a side. The seven stays put. Let's follow the arrow.",
    hold: 0.65,
  },
  {
    id: 'two-exposures',
    say: 'Bring back the earlier arrow. Each light is a one and each dark spot is a zero. Read each patch a row at a time. A vision transformer uses the same learned weights on every patch. Each weighted sum gives us one number in the patch token.',
    hold: 0.6,
  },
  {
    id: 'count-the-lights',
    say: 'Try a simple pair of measurements. First, count each lit pixel once. Watch how fast the up arrow pulls ahead. By the last row, the down arrow has caught up. Twenty-eight lights apiece.',
    hold: 0.8,
  },
  {
    id: 'split-the-columns',
    say: 'For the second number, give pixels on the right a weight of plus one, and pixels on the left minus one. Each arrow has fourteen lights on either side. What does that subtraction leave?',
    hold: 1.1,
  },
  {
    id: 'what-attention-gets',
    say: 'Cover the pixels. Which arrow did this token come from? Both read twenty-eight, zero. The seven stayed the same, too. Attention gets exactly the same sequence for both pictures.',
    hold: 1.15,
  },
  {
    id: 'turn-the-weights',
    say: "Keep the pixel count. Let's change the second measurement. Give the top half plus one, and the bottom half minus one. Look where the wide part of each arrow lands.",
    hold: 0.75,
  },
  {
    id: 'the-turn',
    say: 'On the left, twenty lights above and eight below. Plus twelve. On the right those counts trade places. Minus twelve. Now the second number tells us which way the arrow points.',
    hold: 2.5,
  },
];

const teal = '#183e43';
const ink = '#172f36';
const paper = '#edece2';
const amber = '#ffcf75';
const litBlue = '#a4dff5';
const off = '#34434a';
const lens = '#17292e';
const mono = 'Lesson Mono';
const sans = 'Lesson Sans';
const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => { const t = clamp(v); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const sum = (values) => values.reduce((a, b) => a + b, 0);

// The first projection column is all ones. The second gives opposite signs to
// the two halves. A turn of one means top minus bottom; zero means right minus left.
function signAt(i, turn) {
  const x = i % side - 3.5;
  const y = Math.floor(i / side) - 3.5;
  const angle = Math.PI * turn / 2;
  return x * Math.cos(angle) - y * Math.sin(angle) >= 0 ? 1 : -1;
}

function measure(pixels, turn) {
  const total = sum(pixels);
  const positive = sum(pixels.map((value, i) => signAt(i, turn) === 1 ? value : 0));
  const negative = total - positive;
  return { total, positive, negative, token: [total, positive - negative] };
}

function check() {
  function equal(actual, expected, label) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(label + ': ' + JSON.stringify(actual));
    }
  }
  const sequence = (arrow, turn) => [seven, arrow].map((patch) => measure(patch, turn).token);
  for (const patch of [seven, up, down]) {
    equal(patch.length, side ** 2, 'Patch area');
    equal(patch.every((pixel) => pixel === 0 || pixel === 1), true, 'Binary display');
  }
  equal(up.map((v, i) => v !== down[i]).filter(Boolean).length, 24, 'Pixels that change');
  equal(measure(seven, 0).token, [20, -2], 'Floor patch');
  equal(measure(up, 0).token, [28, 0], 'First projection');
  equal(sequence(up, 0), sequence(down, 0), 'Identical token sequences');
  equal(measure(up, 1), { total: 28, positive: 20, negative: 8, token: [28, 12] }, 'Up');
  equal(measure(down, 1), { total: 28, positive: 8, negative: 20, token: [28, -12] }, 'Down');
  equal(sequence(up, 1)[0], sequence(down, 1)[0], 'Same seven under the revised weights');
}

function rect(c, x, y, w, h, fill) {
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
}
function rounded(c, x, y, w, h, r, fill) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = fill;
  c.fill();
}
function disc(c, x, y, radius, fill) {
  c.beginPath();
  c.arc(x, y, radius, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
}
function polygon(c, points, fill) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}
function gradient(c, x1, y1, x2, y2, stops) {
  const g = c.createLinearGradient(x1, y1, x2, y2);
  for (const [offset, color] of stops) g.addColorStop(offset, color);
  return g;
}
function lettering(c, text, x, y, size, color, family = sans, weight = 500, align = 'center') {
  c.font = weight + ' ' + size + 'px "' + family + '", "Lesson Symbols", "Lesson Math"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(text, x, y);
}
function withOpacity(c, amount, paint) {
  if (amount <= 0) return;
  c.save();
  c.globalAlpha *= amount;
  paint();
  c.restore();
}

function pixel(c, x, y, pitch, on, cool = false, dimmed = false) {
  const radius = pitch * 0.37;
  disc(c, x, y + pitch * 0.025, radius + pitch * 0.036, '#0d1f24');
  if (on && !dimmed) {
    disc(c, x, y, radius, cool ? '#79b7cf' : '#ffa64d');
    disc(c, x - pitch * 0.012, y - pitch * 0.026, radius * 0.85, cool ? litBlue : amber);
  } else {
    disc(c, x, y, radius, on ? '#8d7958' : off);
  }
}

function bitmap(c, bits, x, y, pitch) {
  bits.forEach((bit, i) => pixel(c, x + (i % side + 0.5) * pitch,
    y + (Math.floor(i / side) + 0.5) * pitch, pitch, bit));
}

// Glazed tile, painted door returns and two stainless door leaves, all in elevation.
function landing(c, arrow) {
  rect(c, -1500, -1000, 5000, 3000, '#adbfba');
  const glazes = ['#a6c7c2', '#a4c5bf', '#abcac4', '#a9c9c4', '#a2c3bd'];
  for (let row = -1; row < 8; row++) {
    for (let col = -1; col < 11; col++) {
      const x = col * 223 - 47, y = row * 149 - 63;
      const k = ((row * 7 + col * 3) % glazes.length + glazes.length) % glazes.length;
      rect(c, x + 2, y + 2, 219, 145, glazes[k]);
      rect(c, x + 3, y + 3, 217, 2, '#c9ded5');
      rect(c, x + 220, y + 5, 2, 140, '#8ca8a2');
    }
  }
  polygon(c, [[-100, -200], [875, -200], [300, 1110], [-100, 1110]], '#fff2b82b');
  rect(c, 245, 560, 1430, 640, '#637e82');
  rect(c, 252, 544, 1416, 645, '#c5d0c5');
  rect(c, 272, 561, 1376, 600, '#567779');
  rect(c, 286, 576, 1348, 610, '#1d3a43');
  const doors = [[300, '#547480', '#9fb5b5', '#829eaa'], [964, '#a2b3b0', '#a5babe', '#658690']];
  doors.forEach(([x, a, b, d]) => {
    rect(c, x, 598, 656, 520, gradient(c, x, 620, x + 656, 880,
      [[0, a], [0.34, b], [0.69, d], [1, b]]));
    c.save();
    c.beginPath(); c.rect(x, 598, 656, 520); c.clip();
    polygon(c, [[x+350,598],[x+477,598],[x+255,1080],[x+128,1080]], '#fff7dd19');
    for (let j = 0; j < 90; j++) {
      const yy = 600 + ((j * 137) % 520);
      rect(c, x, yy, 656, 1, j % 2 ? '#eff5e711' : '#1132420b');
    }
    c.restore();
  });
  rect(c, 956, 598, 8, 520, '#203f49');
  rect(c, 300, 598, 1320, 17, gradient(c, 0, 598, 0, 615, [[0, '#163b4768'], [1,'#163b4700']]));
  rounded(c, 141, 757, 65, 148, 6, '#718f8e');
  rounded(c, 140, 750, 64, 149, 5, '#cbd6cb');
  for (const [y, direction] of [[790,-1],[859,1]]) {
    disc(c, 172, y, 21, '#698686');
    disc(c, 172, y - 1, 17, '#abbdb5');
    polygon(c, [[172, y+8*direction],[164, y-5*direction],[180,y-5*direction]], '#546f70');
  }

  rounded(c, 601, 142, 720, 380, 23, '#44616945');
  rounded(c, 600, 133, 720, 379, 21, gradient(c, 620, 133, 1110, 512,
    [[0, '#eef2dc'], [0.32, '#b3c5c1'], [0.68, '#d6ddd0'], [1, '#91a5a4']]));
  rounded(c, 614, 148, 692, 348, 14, '#385459');
  rounded(c, 621, 153, 678, 335, 11, lens);
  bitmap(c, seven, 680, 180, 35);
  bitmap(c, arrow, 960, 180, 35);
  polygon(c, [[628,159],[941,159],[809,482],[628,482]], '#e8ffe608');
}

const finalSize = 432;
const panelTop = 222;
const frameX = [318, 1170];
const photoCenters = frameX.map((x) => x + finalSize / 2);

// The zoom lands with the two source patches touching, exactly eight cells per side.
const zoom = finalSize / (side * 35);
function camera(c, arrow, travel) {
  const z = lerp(1, zoom, travel);
  c.save();
  c.translate(960, lerp(320, panelTop + finalSize / 2, travel));
  c.scale(z, z);
  c.translate(-960, -320);
  landing(c, arrow);
  c.restore();
}
function corners(c, x, y, w, color) {
  c.strokeStyle = color; c.lineWidth = 4;
  for (const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]]) {
    const a = x + dx * w, b = y + dy * w;
    const sx = 1 - 2 * dx, sy = 1 - 2 * dy;
    c.beginPath(); c.moveTo(a + sx * 29,b); c.lineTo(a,b); c.lineTo(a,b + sy * 29); c.stroke();
  }
}
function opening(c, clock) {
  const onLanding = clock.index === 0;
  const travel = onLanding ? 0 : ease(clock.reveal('Take just the display', 1.7));
  camera(c, onLanding && clock.elapsed < 1.35 ? up : down, travel);
  if (onLanding) return;
  const cut = ease(clock.reveal('two square patches', 0.5));
  const select = ease(clock.reveal("follow the arrow", 0.75));
  withOpacity(c, cut, () => {
    withOpacity(c, 1 - 0.68 * select, () => corners(c, 960-finalSize, panelTop, finalSize, '#dbe4e0'));
    corners(c, 960, panelTop, finalSize, '#fff3c6');
  });
  withOpacity(c, select * 0.66, () => rect(c, 960-finalSize, panelTop, finalSize, finalSize, lens));
}

function sheet(c) {
  rect(c, 0, 0, 1920, 1080, gradient(c, 0, 0, 1920, 1080,
    [[0, '#f4f2e7'], [0.64, paper], [1, '#d7e3dd']]));
}
function square(c, pixels, x, y, size, { turn = 0, weight = 0, rows = 8, scanning = false } = {}) {
  const pitch = size / side;
  rect(c, x - 5, y - 5, size + 10, size + 10, '#6b817f');
  rect(c, x - 2, y - 2, size + 4, size + 4, lens);
  if (weight > 0) {
    c.save();
    c.beginPath(); c.rect(x, y, size, size); c.clip();
    c.translate(x + size / 2, y + size / 2);
    c.rotate(-Math.PI * turn / 2);
    c.globalAlpha *= weight;
    rect(c, -size, -size, size, 2*size, '#2b4958');
    rect(c, 0, -size, size, 2*size, '#594632');
    rect(c, -2, -size, 4, 2*size, '#fcf2d7');
    c.restore();
  }
  for (const [i, bit] of pixels.entries()) {
    const row = Math.floor(i / side);
    pixel(c, x + (i % side + 0.5) * pitch, y + (row + 0.5) * pitch,
      pitch, bit, weight >= 0.5 && signAt(i, turn) < 0, scanning && row >= rows);
  }
  if (scanning && rows < 8) rect(c, x, y + rows * pitch - 2, size, 4, '#fff5ce');
}

// Preserve the eight row boundaries within the flattened sequence.
function rasterLine(c, pixels, cx, progress, countedRows = 8) {
  const pitch = 9.2;
  const groupGap = 4;
  const width = pitch * pixels.length + groupGap * (side - 1);
  const x = cx - width / 2;
  const rows = clamp(progress) * side;
  c.save();
  c.beginPath();
  c.rect(x - 2, 683, (width + 4) * clamp(progress), 31);
  c.clip();
  rect(c, x - 2, 685, width + 4, 26, lens);
  pixels.forEach((v, i) => {
    const row = Math.floor(i / side);
    if (row > rows) return;
    const light = row < countedRows ? amber : '#897957';
    rect(c, x + pitch * i + row * groupGap + 1, 691, pitch - 2, 14, v ? light : off);
  });
  c.restore();
}

function exposures(c, clock) {
  const travel = ease(clock.reveal('Bring back', 1.9));
  camera(c, down, 1);
  withOpacity(c, travel, () => sheet(c));
  const bits = [up, down];
  bits.forEach((patch, i) => {
    const x = lerp(960, frameX[i], travel);
    withOpacity(c, i === 0 ? travel : 1, () => square(c, patch, x, panelTop, finalSize));
    withOpacity(c, travel, () => lettering(c, i ? 'After' : 'Before', x + finalSize/2, 128, 52, ink));
  });
  // Tie the binary values to a lit and a dark dot on the earlier exposure.
  const light = ease(clock.reveal('a one', 0.3));
  const dark = ease(clock.reveal('a zero', 0.3));
  const cues = [
    [frameX[0] + 3.5 * 54, 1, light],
    [frameX[0] + 7.5 * 54, 0, dark],
  ];
  const flatten = ease(clock.reveal('Read each patch', 2.9));
  for (const [x, value, visible] of cues) {
    withOpacity(c, visible * (1 - clamp(flatten * 5)), () => {
      const y = panelTop + 7.5*54;
      c.strokeStyle = value ? '#fff4ca' : '#d5efeb'; c.lineWidth = 4;
      c.beginPath(); c.arc(x,y,24,0,2*Math.PI); c.stroke();
      rect(c, x-1.5, y+25, 3, 51, teal);
      lettering(c, String(value), x, y+103, 43, teal, mono);
    });
  }
  bits.forEach((patch, i) => rasterLine(c, patch, photoCenters[i], flatten));
  withOpacity(c, flatten, () => lettering(c, '64 pixels', 960, 698, 43, teal));
}
function signed(n) {
  return n < 0 ? '−' + Math.abs(n) : n > 0 ? '+' + n : '0';
}
function contrastLabel(c, cx, cy, sign, turn, opacity) {
  const theta = turn * Math.PI/2;
  const r = finalSize / (2 * Math.max(Math.cos(theta), Math.sin(theta))) + 49;
  const x = cx + Math.cos(theta) * r * sign;
  const y = cy - Math.sin(theta) * r * sign;
  const fill = sign > 0 ? '#6e4621' : '#235775';
  withOpacity(c, opacity, () => lettering(c, sign > 0 ? '+1' : '−1', x, y, 38, fill, mono, 400));
}
function token(c, cx, y, values, color = ink) {
  lettering(c, '[' + values.join(', ') + ']', cx, y, 68, color, mono, 400);
}

function sequence(c, cx, cy, expand, arrowToken) {
  const half = lerp(finalSize / 2, 366, expand);
  const height = lerp(finalSize, 156, expand);
  rect(c, cx - half, cy - height / 2, 2 * half, height, '#17363d');
  const arrowX = cx + expand * half / 2;
  token(c, arrowX, cy, arrowToken, '#f7e9c8');
  withOpacity(c, ease((expand - 0.72) / 0.28), () => {
    const floorToken = measure(seven, 0).token;
    token(c, cx - half / 2, cy, floorToken, '#c9dad6');
    rect(c, cx - 1, cy - height / 2 + 17, 2, height - 34, '#577473');
    lettering(c, 'Floor patch', cx - half/2, cy - height/2 - 42, 41, teal);
    lettering(c, 'Arrow patch', arrowX, cy - height/2 - 42, 41, teal);
  });
}

// Return to the two camera exposures. The enlarged arrows register with the
// same pixels in the display at the start of the pullback.
function returnToLanding(c, i, mix) {
  if (!mix) return;
  const cx = photoCenters[i];
  const z = lerp(zoom, 1, ease(mix));
  const arrowX = lerp(cx, 620 + i * 960, ease(mix));
  const arrowY = lerp(panelTop + finalSize / 2, 385, ease(mix));
  c.save();
  c.beginPath(); c.rect(48 + i * 960, 181, 864, 558); c.clip();
  c.globalAlpha *= mix;
  c.translate(arrowX, arrowY);
  c.scale(z, z);
  c.translate(-1100, -320);
  landing(c, i ? down : up);
  c.restore();
}

function inspection(c, clock) {
  sheet(c);
  const {index, elapsed} = clock;
  const counting = index === 3;
  const countingProgress = counting ? clock.reveal('Watch how fast', 4.2) : 1;
  const countingStarted = !counting || clock.reveal('count each lit pixel', 0.35);
  const rows = Math.min(8, Math.floor(countingProgress * 8));
  const mask = index === 4 ? ease(clock.reveal('give pixels on the right', 0.7)) : Number(index > 4);
  const blind = index === 5 ? ease(elapsed / 0.85)
    : index === 6 ? 1 - ease(elapsed / 0.85) : 0;
  const expand = index === 5 ? ease(clock.reveal('The seven stayed', 1.1))
    : index === 6 ? 1 - ease(elapsed / 0.85) : 0;
  const turn = index === 6 ? ease(clock.reveal("Let's change", 1.55)) : Number(index > 6);
  const landingMix = index === 7 ? ease(clock.reveal('Now the second number', 1.8)) : 0;
  const opacity = 1 - blind;
  const dividerVisible = mask * opacity * (1 - landingMix);
  const cy = panelTop + finalSize / 2;
  const showDelta = index > 4 || (index === 4 && clock.reveal('fourteen lights', 0.3) > 0);
  [up, down].forEach((bits, i) => {
    const cx = photoCenters[i], x = frameX[i];
    const labelX = lerp(cx, 480 + 960 * i, landingMix);
    const result = measure(bits, turn);
    lettering(c, i ? 'After' : 'Before', labelX, 128, 52, ink);
    withOpacity(c, 1 - expand, () => square(c,bits,x,panelTop,finalSize,{
      turn, weight: mask, rows, scanning: counting && countingStarted > 0,
    }));
    returnToLanding(c, i, landingMix);
    contrastLabel(c, cx, cy, 1, turn, dividerVisible);
    contrastLabel(c, cx, cy, -1, turn, dividerVisible);
    if (blind > 0) {
      const shutter = finalSize * blind;
      c.save();
      c.beginPath(); c.rect(cx - 370, panelTop - 100, 740, shutter + 100); c.clip();
      sequence(c, cx, cy, expand, result.token);
      c.restore();
    }
    if (counting) {
      rasterLine(c, bits, cx, 1, countingStarted ? rows : 8);
      if (countingStarted) {
        const runningCount = sum(bits.slice(0, rows * side));
        lettering(c, String(runningCount), cx, 815, 86, ink, mono, 400);
      }
    } else {
      withOpacity(c, dividerVisible, () => {
        lettering(c, result.positive + ' − ' + result.negative, cx, 752, 46, teal, mono, 500);
      });
      withOpacity(c, opacity, () => token(c, labelX, 860,
        [result.total, showDelta ? signed(result.token[1]) : '·']));
    }
  });
  if (counting) {
    withOpacity(c, countingStarted, () => lettering(c, 'Lit pixels', 960, 815, 43, teal));
  } else {
    withOpacity(c, opacity, () => lettering(c, 'Arrow token', 960, 860, 43, teal));
  }
}

function draw(c, clock) {
  if (clock.index < 2) opening(c, clock);
  else if (clock.index === 2) exposures(c, clock);
  else inspection(c, clock);
}

export default { title: 'The arrow above the elevator', beats, draw, check };
