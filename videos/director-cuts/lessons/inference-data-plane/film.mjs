import assert from 'node:assert/strict';

// The article's 8,192-token example, with an even split across two KV-head shards.
const bytesPerToken = 2 * 80 * 8 * 128 * 2;
const cacheBytes = bytesPerToken * 8192;
const bytesPerShard = cacheBytes / 2;
const linkBytesPerMs = 25e9 / 1000;
const sameInstant = bytesPerShard / linkBytesPerMs;
const sharedFinish = cacheBytes / linkBytesPerMs;
const clamp = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => clamp(x) ** 2 * (3 - 2 * clamp(x));
const mix = (a, b, t) => a + (b - a) * t;
const gib = (bytes) => bytes / 1024 ** 3;

// Alternating equal transfer quanta on one link, or simultaneous sends on two.
// Time measures payload serialization. Propagation and setup costs are excluded.
const chunksPerShard = 16;
const chunkMs = sameInstant / chunksPerShard;
function delivered(ms, separate) {
  const quanta = Math.max(0, ms) / chunkMs;
  if (separate) return [0, 1].map(() => clamp(quanta / chunksPerShard));
  const pairs = Math.floor(quanta / 2);
  return [0, 1].map((i) => clamp((pairs + clamp(quanta - 2 * pairs - i)) / chunksPerShard));
}

function check() {
  assert.equal(gib(cacheBytes), 2.5);
  assert.equal(gib(bytesPerShard), 1.25);
  assert.equal(sameInstant.toFixed(1), '53.7');
  assert.equal(sharedFinish.toFixed(1), '107.4');
  assert.deepEqual(delivered(chunkMs, false), [1 / 16, 0]);
  assert.deepEqual(delivered(sameInstant, false), [0.5, 0.5]);
  assert.deepEqual(delivered(sameInstant, true), [1, 1]);
  assert.deepEqual(delivered(sharedFinish, false), [1, 1]);
  for (const separate of [false, true]) {
    for (const ms of [0, 13, sameInstant, 86, sharedFinish, 120]) {
      const [a, b] = delivered(ms, separate);
      const total = (a + b) * bytesPerShard;
      assert.ok(
        Math.abs(total - Math.min(cacheBytes, ms * linkBytesPerMs * (separate ? 2 : 1))) < 0.001,
      );
    }
  }
}

const beats = [
  {
    id: 'through-the-plug',
    say: 'Follow the orange pulse through the plug. A blue one slips in behind it. When the clock stops, look at how much has reached the other end.',
    hold: 0.9,
  },
  {
    id: 'the-source',
    say: 'The prefill worker has read a prompt and saved its keys and values. The decoder will use them to generate more tokens. Each color holds half of that cache.',
    hold: 0.6,
  },
  {
    id: 'at-the-notch',
    say: 'Trace the two colors through the same plug. The shards take turns on a link carrying twenty-five gigabytes a second. See where each color stops on the right? Halfway.',
    hold: 0.9,
  },
  {
    id: 'the-rest',
    say: 'Let the clock run. The second half takes just as long as the first. All two and a half gibibytes have crossed in about one hundred seven milliseconds.',
    hold: 1.05,
  },
  {
    id: 'another-socket',
    say: 'Send the same cache again. Give the blue shard its own independent link, just as fast as the first. How much will reach the decoder by that same instant?',
    hold: 1.25,
  },
  {
    id: 'both-at-once',
    say: 'Watch the two plugs on the right. Orange can keep arriving while blue comes in through the other plug.',
    hold: 0.85,
  },
  {
    id: 'under-the-mark',
    say: 'The notches show where each color stopped on the shared link. With a full link for each shard, the whole prompt cache crossed in the same fifty-four milliseconds.',
    hold: 2.45,
  },
];

const ink = '#202c4e';
const metalInk = '#465574';
const dye = [
  { hot: '#ff783c', light: '#ffc084' },
  { hot: '#3578fc', light: '#a0dbff' },
];
const dieY = [503, 682];
const leftEdge = 552;
const rightEdge = 1368;

function gradient(c, x1, y1, x2, y2, stops) {
  const g = c.createLinearGradient(x1, y1, x2, y2);
  for (const [pos, color] of stops) g.addColorStop(pos, color);
  return g;
}
function box(c, x, y, w, h, r, fill) {
  c.fillStyle = fill;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
function track(c, points, color, width) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.lineWidth = width;
  c.strokeStyle = color;
  c.stroke();
}
function type(c, s, x, y, size, color = ink, family = 'Sans', weight = 400, align = 'left') {
  c.font = `${weight} ${size}px "Lesson ${family}"`;
  c.fillStyle = color;
  c.textAlign = align;
  c.fillText(s, x, y);
}

function deck(c) {
  c.fillStyle = gradient(c, 90, 0, 1450, 1280, [
    [0, '#fafaff'],
    [0.52, '#e2e7f5'],
    [1, '#bcc9e1'],
  ]);
  c.fillRect(0, 0, 1920, 1080);
  // The soft contact shadow puts the two cutaway packages on the same surface.
  c.save();
  c.scale(1, 0.19);
  const shade = c.createRadialGradient(960, 3975, 50, 960, 3975, 1120);
  shade.addColorStop(0, 'rgba(88,101,145,.15)');
  shade.addColorStop(1, 'rgba(88,101,145,0)');
  c.fillStyle = shade;
  c.fillRect(-200, 2700, 2300, 2550);
  c.restore();
}

function packageBase(c, left) {
  const x = left ? -75 : rightEdge;
  const w = 627;
  const face = gradient(c, 0, 305, 200, 860, [
    [0, '#fcfdff'],
    [0.46, '#e4ebf7'],
    [1, '#c1d0e8'],
  ]);
  for (let i = 4; i > 0; i--) {
    box(c, x - 3 * i, 313 + i * 6, w + 6 * i, 495 + i, 34, `rgba(52,66,111,${0.016 * (5 - i)})`);
  }
  box(c, x, 315, w, 498, 34, '#596b90');
  box(c, x, 313, w, 495, 34, '#94a6c8');
  box(c, x, 305, w, 495, 34, '#ffffff');
  box(c, x + 2, 308, w - 4, 489, 32, face);
  const tx = left ? 84 : 1509;
  type(c, left ? 'Prefill' : 'Decode', tx, 386, 59, ink, 'Sans', 600);
  type(c, left ? 'Prompt cache' : 'Cache received', tx + 1, 427, 33, metalInk);
  // Fine edge contacts stop at the optical connector, away from the memory banks.
  for (let i = 0; i < 21; i++) {
    const pinX = left ? 22 + 16 * i : 1552 + 16 * i;
    box(c, pinX, 792, 9, 13, 2, '#8698bb');
    box(c, pinX, 793, 9, 5, 1, '#b3c0d7');
  }
}

function memoryDie(c, x, cy, color, fraction) {
  const w = 307,
    h = 91,
    y = cy - h / 2;
  const tint = dye[color];
  box(c, x - 9, y - 6, w + 18, h + 16, 9, '#9fabc2');
  box(c, x - 6, y - 7, w + 12, h + 12, 6, '#f4f8ff');
  box(c, x - 3, y - 4, w + 6, h + 7, 5, '#2e3b58');
  box(c, x, y, w, h, 3, '#202e49');
  c.save();
  c.beginPath();
  c.rect(x, y, w * fraction, h);
  c.clip();
  c.fillStyle = gradient(c, x, y, x + w, y + h, [
    [0, tint.hot],
    [0.53, tint.light],
    [1, tint.hot],
  ]);
  c.fillRect(x, y, w, h);
  c.restore();
  // Twin arrays and their etched word lines give each slice a visible address.
  for (let col = 0; col < 16; col++) {
    const cellX = x + (col * w) / 16;
    track(
      c,
      [
        [cellX, y],
        [cellX, y + h],
      ],
      'rgba(29,43,69,.65)',
      col % 4 === 0 ? 4.5 : 2,
    );
    for (let row = 0; row < 2; row++) {
      const top = y + 4 + row * 47;
      c.fillStyle = 'rgba(234,243,255,.2)';
      c.fillRect(cellX + 4, top + 3, 10, 2.2);
      for (let k = 0; k < 4; k++) {
        c.fillStyle = 'rgba(28,43,77,.22)';
        c.fillRect(cellX + 4, top + 10 + 5 * k, 11 - ((col + k + row) % 3), 1.8);
      }
    }
  }
  box(c, x, cy - 3, w, 6, 0, 'rgba(37,50,75,.60)');
}

function boardTraces(c, left, split) {
  c.save();
  if (!left) {
    c.translate(1920, 0);
    c.scale(-1, 1);
  }
  const first = dieY[0],
    second = dieY[1];
  for (let i = -2; i <= 2; i++) {
    const d = i * 4;
    track(
      c,
      [
        [387, first + d],
        [556, first + d],
      ],
      '#adb9ce',
      2,
    );
    const bend = 444 + d;
    c.save();
    c.globalAlpha *= 1 - split;
    track(
      c,
      [
        [387, second + d],
        [bend - 27, second + d],
        [bend, second - 27 + d],
        [bend, first + 45 + d],
        [bend + 35, first + 10 + d],
        [556, first + 10 + d],
      ],
      '#637da5',
      2.6,
    );
    c.restore();
    c.save();
    c.globalAlpha *= split;
    track(
      c,
      [
        [387, second + d],
        [556, second + d],
      ],
      '#6386c5',
      2.6,
    );
    c.restore();
  }
  for (const cy of dieY) {
    box(c, 508, cy - 36, 50, 75, 7, '#798ca9');
    box(c, 510, cy - 36, 45, 69, 6, '#ecf1fa');
    box(c, 522, cy - 28, 38, 55, 4, '#344768');
    box(c, 528, cy - 18, 32, 35, 3, '#152744');
  }
  c.restore();
}

function plug(c, x, y, direction, colors) {
  c.save();
  c.translate(x, y);
  c.scale(direction, 1);
  box(c, -22, -21, 31, 45, 3, '#566987');
  box(c, -21, -20, 29, 9, 2, '#dae3f0');
  const collar = gradient(c, 0, -35, 0, 33, [
    [0, '#b8d0f4'],
    [0.18, '#7498d0'],
    [0.54, '#4a6b9b'],
    [0.74, '#365782'],
    [1, '#243c65'],
  ]);
  box(c, 0, -31, 79, 65, 9, collar);
  for (let i = 0; i < colors.length; i++) box(c, 10 + 12 * i, -26, 9, 55, 3, colors[i].hot);
  box(c, 8, -42, 49, 11, 3, '#9bb7d9');
  box(c, 13, -46, 44, 6, 3, '#d4e1ef');
  const boot = gradient(c, 0, -22, 0, 22, [
    [0, '#abc0df'],
    [0.35, '#829abd'],
    [1, '#415b83'],
  ]);
  box(c, 72, -23, 49, 47, 13, boot);
  for (let i = 0; i < 5; i++) {
    const hh = 24 - i * 1.8;
    box(c, 74 + i * 9, -hh, 5, 2 * hh, 2, '#627a9d');
  }
  c.restore();
}

// A transparent jacket runs between the two cutaway packages. Pulses inside it
// represent equal amounts of payload. A clock pause freezes the pulses as well.
function cord(c, row, split, ms, installation, clear) {
  if (installation <= 0) return;
  const length = rightEdge - leftEdge;
  const drop = (1 - installation) * 265;
  const cy = dieY[row] + drop;
  const inset = (1 - installation) * 80;
  const x = leftEdge + inset;
  const w = length - inset * 2;
  const sag = row ? 112 : 104;
  const at = (u) => [x + w * u, cy + sag * Math.sin(Math.PI * u) ** 2];
  c.save();
  c.globalAlpha *= installation;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const shape = Array.from({ length: 81 }, (_, i) => at(i / 80));
  c.save();
  c.translate(0, 15);
  track(c, shape, 'rgba(59,75,119,.09)', 46);
  c.translate(0, -4);
  track(c, shape, 'rgba(59,75,119,.12)', 38);
  c.restore();
  track(c, shape, '#5c749e', 48);
  track(c, shape, '#abc0df', 44);
  c.save();
  c.translate(0, -3);
  track(c, shape, '#dce8fc', 33);
  c.restore();
  track(c, shape, '#51647f', 26);
  track(c, shape, '#283953', 19);

  // Draw successive portions of the signal in cable coordinates so the light
  // bends with the jacket. The imaginary microscope slows the link clock.
  const slots = 8;
  const phase = ms / chunkMs;
  const arrivalSlot = Math.floor(phase);
  const totalSlots = chunksPerShard * (split ? 1 : 2);
  // The clock starts on the leading arrival at decode. Look upstream from that
  // boundary to see the following payload already in flight at the first cut.
  for (let i = arrivalSlot; i <= arrivalSlot + slots && i < totalSlots; i++) {
    const center = 1 + (phase - i - 0.5) / slots;
    const start = Math.max(0, center - 0.047),
      end = Math.min(1, center + 0.047);
    if (start >= end || clear >= 1) continue;
    const color = dye[split ? row : i % 2];
    const points = [];
    for (let k = 0; k <= 6; k++) points.push(at(mix(start, end, k / 6)));
    c.save();
    c.globalAlpha *= 1 - clear;
    track(c, points, color.hot, 15);
    c.translate(0, -2);
    track(c, points, color.light, 5);
    c.restore();
  }
  // A narrow rim leaves the payload visible through the polished sheath.
  c.save();
  c.translate(0, -18);
  track(c, shape, 'rgba(255,255,255,.75)', 3);
  c.restore();
  const colors = split ? [dye[row]] : dye;
  plug(c, x, cy, 1, colors);
  plug(c, x + w, cy, -1, colors);
  c.restore();
}

function shot(clock) {
  const { index, elapsed, reveal } = clock;
  const run = (d) => clamp(elapsed / d);
  let ms = sameInstant,
    split = 0,
    zoom = 1,
    centerX = 960,
    centerY = 540,
    witness = 0,
    clear = 0;
  let again = false;
  if (index === 0) {
    ms = sameInstant * run(5.8);
    // Start inside the cable, then cut wide to the destination at the pause.
    if (reveal('When the clock stops', 0) === 0) {
      zoom = 2.5;
      centerX = mix(916, 1065, smooth(elapsed / 4.6));
      centerY = 566;
    }
  } else if (index === 1) {
    zoom = 1.53;
    centerX = mix(545, 500, smooth(run(3)));
    centerY = 537;
  } else if (index === 2) {
    witness = smooth(reveal('See where each color stops', 0.65));
  } else if (index === 3) {
    ms = sameInstant + sameInstant * run(5.8);
    witness = 1 - smooth(run(1.4));
    clear = smooth((elapsed - 5.8) / 0.55);
  } else if (index === 4) {
    const reset = reveal('again', 0.42);
    again = reset > 0;
    ms = again ? 0 : sharedFinish;
    split = smooth(reveal('Give the blue shard', 1.8));
    clear = 1;
  } else {
    again = true;
    split = 1;
    ms = index === 5 ? sameInstant * run(5.8) : sameInstant;
    clear = index === 5 ? smooth((elapsed - 5.8) / 0.55) : 1;
    witness = index === 5 ? smooth((elapsed - 4.65) / 0.8) : 1;
  }
  return { ms, split, zoom, centerX, centerY, witness, clear, again };
}

function draw(c, clock) {
  const s = shot(clock);
  const fraction = delivered(s.ms, s.split === 1);
  deck(c);
  c.save();
  c.translate(960, 540);
  c.scale(s.zoom, s.zoom);
  c.translate(-s.centerX, -s.centerY);
  packageBase(c, true);
  packageBase(c, false);
  boardTraces(c, true, s.split);
  boardTraces(c, false, s.split);
  for (let i = 0; i < dieY.length; i++) {
    memoryDie(c, 82, dieY[i], i, 1);
    memoryDie(c, 1531, dieY[i], i, fraction[i]);
  }
  type(c, `${gib(bytesPerShard)} GiB each`, 83, 774, 38, metalInk, 'Mono');
  cord(c, 1, true, s.ms, s.split, s.clear);
  cord(c, 0, s.split === 1, s.ms, 1, s.clear);
  if (s.witness > 0) {
    c.save();
    c.globalAlpha *= s.witness;
    const mid = 1531 + 307 / 2;
    for (const y of dieY) {
      c.fillStyle = '#182a4c';
      c.beginPath();
      c.moveTo(mid, y - 45);
      c.lineTo(mid - 17, y - 68);
      c.lineTo(mid + 17, y - 68);
      c.closePath();
      c.fill();
      track(
        c,
        [
          [mid, y - 44],
          [mid, y + 44],
        ],
        '#fcfcff',
        5,
      );
    }
    type(c, `1 link at ${sameInstant.toFixed(1)} ms`, mid, 773, 36, ink, 'Sans', 600, 'center');
    c.restore();
  }
  c.restore();

  const mode =
    s.again && s.split < 0.01
      ? 'Same cache, second run'
      : s.split > 0.01
        ? 'Two independent links'
        : 'One shared link';
  if (clock.index !== 1) {
    type(c, mode, 82, 145, 77, ink, 'Serif');
    type(c, `Ideal transfer  ·  ${linkBytesPerMs / 1e6} GB/s per link`, 87, 207, 37, metalInk);
    type(c, 'Transfer time', 1836, 102, 33, metalInk, 'Sans', 400, 'right');
    type(c, `${s.ms.toFixed(1)} ms`, 1840, 194, 79, ink, 'Mono', 400, 'right');
  }
}

export default { title: 'Two shards through one link', beats, draw, check };
