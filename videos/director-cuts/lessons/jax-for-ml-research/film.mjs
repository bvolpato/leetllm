import assert from 'node:assert/strict';

// Recorded on CPU with JAX 0.11.2. Each row is a slice of the same 2-D draw:
// a, b = random.split(random.key(7, impl="threefry2x32"))
// mask = lambda k: random.bernoulli(k, p=0.5, shape=(8, 8))
const captures = {
  a: {
    key: [0xd817648b, 0x74864d80],
    rows: ['00110111', '01100100', '01100010', '01100100', '11000001', '10001001', '11001111', '11011001'],
  },
  b: {
    key: [0x0ba028bf, 0xf22056bf],
    rows: ['00111000', '01101000', '01000000', '01100111', '11000110', '11001111', '01000100', '00001110'],
  },
};

function compare(left, right) {
  const first = captures[left].rows.join('');
  const second = captures[right].rows.join('');
  const pairs = Array.from(first, (bit, i) => bit + second[i]);
  return { pairs, matches: pairs.filter(pair => pair[0] === pair[1]).length };
}

const replay = compare('a', 'a');
const split = compare('a', 'b');

const beats = [
  { id: 'registration', say: 'Here comes the second dropout mask. Each colored square keeps an activation. A clear square drops it. Slide the pink mask onto the blue one.', hold: 1.5 },
  { id: 'replay', say: 'Every colored square turned purple. Even the gaps line up. Remember the clear square in the top left. If the calls used different keys, would that square have to change?', hold: 1.2 },
  { id: 'key-bits', say: 'These strips show the bits of each JAX key. Starting with seed seven, we split one key into two children, A and B. Both calls used key A. Sampling leaves the key unchanged, so repeating that call gives us the same mask.', hold: 1.0 },
  { id: 'replace-one-input', say: 'Keep the blue mask in place. For the pink one, pass in key B. Each position still has a fifty percent chance of staying. Slide it back. Where did a decision change?', hold: 1.8 },
  { id: 'single-ink', say: 'Look at the pink square in the top row. The first call dropped that activation. The second kept it. Just to its right, blue means the reverse.', hold: 0.9 },
  { id: 'clear-cell', say: 'Now look at the top left. Both calls dropped that activation, even with different keys. Two independent fifty-fifty decisions agree half the time on average. Here, thirty-eight of the sixty-four positions match.', hold: 1.0 },
  { id: 'call-sites', say: 'If you want independent masks, split the key and pass a different child to each call. You can check that in the arguments, even where the picture stays clear.', hold: 2.8 },
];

const W = 1920;
const H = 1080;
const N = 8;
const pitch = 70;
const side = N * pitch;
const plateX = 568;
const plateY = 535;
const tint = ['#40b7df', '#ed548e'];
const darkTint = ['#075f7a', '#9c244e'];
const ink = '#211f38';
const muted = '#555769';
const paper = '#f7f7f1';

const clamp = x => Math.max(0, Math.min(1, x));
function ease(t) {
  t = clamp(t);
  return t * t * (3 - 2 * t);
}
const mix = (a, b, p) => a + (b - a) * p;

function type(ctx, value, x, y, size, options = {}) {
  const { color = ink, family = 'Sans', weight = 400, align = 'left' } = options;
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(String(value), x, y);
}

function line(ctx, points, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  points.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
  ctx.stroke();
}

function fade(ctx, amount, painter) {
  if (amount <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(amount);
  painter();
  ctx.restore();
}

function table(ctx) {
  const light = ctx.createLinearGradient(0, H, W, 0);
  light.addColorStop(0, '#dde5e9');
  light.addColorStop(0.4, paper);
  light.addColorStop(0.74, '#fffaf4');
  light.addColorStop(1, '#eee8ed');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, W, H);
  // A low-contrast ground glass surface behind the clear sheets.
  ctx.fillStyle = 'rgba(76,72,89,.038)';
  for (let y = 13; y < H; y += 27) {
    for (let x = 9 + (y % 4) * 3; x < W; x += 29) ctx.fillRect(x, y, 1.5, 1.5);
  }
  type(ctx, 'Dropout masks', 108, 130, 82, { family: 'Serif' });
  type(ctx, 'random.bernoulli(k, 0.5, (8, 8))', 1808, 97, 40, { family: 'Mono', align: 'right' });
}

function plate(ctx, call, key, x, y, angle, lift, printAmount = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const edge = side / 2 + 26;
  const tabX = call ? edge - 185 : -edge;
  // The sheets have opposite tabs. The call labels remain visible in register.
  function outline() {
    ctx.beginPath();
    ctx.moveTo(-edge + 8, -edge);
    if (!call) {
      ctx.lineTo(-edge + 8, -edge - 55);
      ctx.lineTo(-edge + 177, -edge - 55);
      ctx.lineTo(-edge + 192, -edge);
    } else {
      ctx.lineTo(edge - 192, -edge);
      ctx.lineTo(edge - 178, -edge - 55);
      ctx.lineTo(edge - 8, -edge - 55);
      ctx.lineTo(edge - 8, -edge);
    }
    ctx.arcTo(edge, -edge, edge, -edge + 10, 8);
    ctx.arcTo(edge, edge, edge - 10, edge, 8);
    ctx.arcTo(-edge, edge, -edge, edge - 10, 8);
    ctx.arcTo(-edge, -edge, -edge + 10, -edge, 8);
    ctx.closePath();
  }
  ctx.save();
  ctx.translate(2 + lift * 4, 4 + lift * 14);
  outline();
  ctx.lineWidth = 4 + lift * 4;
  ctx.strokeStyle = 'rgba(56,57,80,.075)';
  ctx.stroke();
  ctx.restore();
  outline();
  const glass = ctx.createLinearGradient(-edge, -edge, edge, edge);
  glass.addColorStop(0, 'rgba(255,255,255,.10)');
  glass.addColorStop(0.68, 'rgba(180,192,209,.035)');
  glass.addColorStop(1, 'rgba(236,246,249,.14)');
  ctx.fillStyle = glass;
  ctx.fill();
  ctx.strokeStyle = 'rgba(54,67,92,.37)';
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.fillStyle = call ? '#fbe0e9' : '#d2f0f5';
  ctx.fillRect(tabX + 13, -edge - 48, 153, 40);
  type(ctx, 'Call ' + (call + 1), tabX + 90, -edge - 16, 35,
    { color: darkTint[call], family: 'Mono', weight: 600, align: 'center' });

  ctx.save();
  ctx.translate(-side / 2, -side / 2);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = tint[call];
  for (let row = 0; row < N; row++) {
    // Reveal the replacement mask one row at a time, in final tensor coordinates.
    const revealHeight = pitch * clamp(N * printAmount - row);
    if (!revealHeight) continue;
    for (let col = 0; col < N; col++) {
      if (captures[key].rows[row][col] === '1') ctx.fillRect(col * pitch, row * pitch, pitch, revealHeight);
    }
  }
  for (let i = 0; i <= N; i++) {
    line(ctx, [[i * pitch, 0], [i * pitch, side]], 'rgba(60,68,85,.23)', 2.4);
    line(ctx, [[0, i * pitch], [side, i * pitch]], 'rgba(60,68,85,.23)', 2.4);
  }
  ctx.restore();
  // Precision marks let a viewer judge when the cell boundaries coincide.
  for (const s of [-1, 1]) {
    const tx = s * (side / 2 + 13);
    const ty = -s * (side / 2 + 13);
    line(ctx, [[tx - 7, ty], [tx + 7, ty]], darkTint[call], 2);
    line(ctx, [[tx, ty - 7], [tx, ty + 7]], darkTint[call], 2);
  }
  ctx.restore();
}

function tally(ctx, count) {
  type(ctx, count + ' / 64', plateX - 27, 920, 61, { family: 'Mono', weight: 600, align: 'right' });
  type(ctx, 'cells match', plateX + 8, 914, 47, { family: 'Serif' });
}

// Both lines encode actual uint32 words, most significant bit first.
function keyBits(ctx, key, x, y, color) {
  for (const [row, word] of captures[key].key.entries()) {
    const bits = word.toString(2).padStart(32, '0');
    for (let i = 0; i < bits.length; i++) {
      ctx.fillStyle = bits[i] === '1' ? color : '#dedfe2';
      ctx.fillRect(x + i * 10 + 6 * Math.floor(i / 8), y + 22 * row, 8, 18);
    }
  }
}

function calls(ctx, key, splitVisibility, argVisibility) {
  const x = 986;
  fade(ctx, splitVisibility, () => {
    type(ctx, 'a, b = random.split(root)', x, 319, 44, { family: 'Mono' });
    type(ctx, 'seed 7', x, 369, 33, { color: muted });
  });
  fade(ctx, argVisibility, () => {
    type(ctx, 'Key bits', 1450, 449, 33, { color: muted });
    ['a', key].forEach((id, i) => {
      const y = 519 + 175 * i;
      type(ctx, 'Call ' + (i + 1), x, y - 42, 34, { color: darkTint[i] });
      type(ctx, 'mask(' + id + ')', x, y + 29, 66, { family: 'Mono', weight: 600 });
      keyBits(ctx, id, 1450, y - 18, darkTint[i]);
    });
  });
}

function focus(ctx, col, t) {
  const x = plateX - side / 2 + col * pitch;
  const y = plateY - side / 2;
  fade(ctx, t, () => {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(x + 4, y + 4, pitch - 8, pitch - 8);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 4, y + 4, pitch - 8, pitch - 8);
  });
}

function rowDetail(ctx, col, focusAmount, replaying = false) {
  const x = 988;
  const step = 92;
  type(ctx, 'Top row', x, 313, 58, { family: 'Serif' });
  ['a', replaying ? 'a' : 'b'].forEach((id, i) => {
    const y = 447 + i * 180;
    type(ctx, replaying ? 'Call ' + (i + 1) : 'mask(' + id + ')', x, y - 23, 45, { family: 'Mono', color: darkTint[i] });
    for (let j = 0; j < N; j++) {
      const filled = captures[id].rows[0][j] === '1';
      ctx.fillStyle = filled ? tint[i] : paper;
      ctx.fillRect(x + j * step, y, step, step);
      ctx.strokeStyle = '#9298a3';
      ctx.lineWidth = 2.7;
      ctx.strokeRect(x + j * step, y, step, step);
    }
    fade(ctx, focusAmount, () => {
      const bit = captures[id].rows[0][col];
      type(ctx, bit === '1' ? 'keep' : 'drop', x + 8 * step, y - 23, 39,
        { color: darkTint[i], align: 'right' });
      ctx.lineWidth = 10;
      ctx.strokeStyle = 'white';
      ctx.strokeRect(x + col * step + 5, y + 5, step - 10, step - 10);
      ctx.lineWidth = 4;
      ctx.strokeStyle = ink;
      ctx.strokeRect(x + col * step + 5, y + 5, step - 10, step - 10);
    });
  });
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  table(ctx);
  let x = plateX, y = plateY, angle = 0, lift = 0, printAmount = 1;
  let key = index >= 4 ? 'b' : 'a';
  let countOpacity = 1;
  if (index === 0) {
    const enter = ease(elapsed / 1.5);
    const align = ease(reveal('Slide the pink mask', 2.25));
    x = mix(mix(1545, 1354, enter), plateX, align);
    y = mix(mix(542, 530, enter), plateY, align);
    angle = mix(mix(-0.105, -0.047, enter), 0, align);
    lift = 1 - align;
    countOpacity = clamp((align - 0.98) * 50);
  }
  if (index === 3) {
    const up = ease(reveal('For the pink one', 1.15));
    const assign = reveal('pass in key B', 0.5);
    const back = ease(reveal('Slide it back', 1.6));
    lift = up * (1 - back);
    x += lift * 72;
    y -= lift * 34;
    angle = lift * 0.055;
    key = assign > 0 ? 'b' : 'a';
    printAmount = assign > 0 ? ease(reveal('pass in key B', 1.2)) : 1 - up;
    countOpacity = 1 - clamp(8 * up) + clamp((back - 0.985) / 0.015);
  }
  plate(ctx, 0, 'a', plateX, plateY, 0, 0);
  plate(ctx, 1, key, x, y, angle, lift, printAmount);
  fade(ctx, countOpacity, () => tally(ctx, key === 'a' ? replay.matches : split.matches));

  if (index === 1) {
    const corner = ease(reveal('Remember the clear square', 0.7));
    focus(ctx, 0, corner);
    fade(ctx, ease(elapsed / 0.6), () => rowDetail(ctx, 0, corner, true));
  }
  if (index === 2) {
    calls(ctx, 'a', ease(reveal('Starting with seed seven', 0.7)), ease(elapsed / 0.6));
  }
  if (index === 3 || index === 6) calls(ctx, key, 1, 1);
  if (index === 4 || index === 5) {
    const reverse = index === 4 ? reveal('Just to its right', 0.4) : 1;
    const corner = index === 5 ? reveal('the top left', 0.4) : 0;
    const col = corner > 0 ? 0 : reverse > 0 ? 5 : 4;
    const alpha = corner > 0 ? corner : reverse > 0 ? reverse : ease(elapsed / 0.45);
    focus(ctx, col, alpha);
    rowDetail(ctx, col, alpha);
  }
  if (index === 6) focus(ctx, 0, 1);
}

function check() {
  for (const { rows, key } of Object.values(captures)) {
    assert.equal(rows.length, N);
    assert(rows.every(row => /^[01]{8}$/.test(row)));
    assert.equal(key.length, 2);
  }
  assert.deepEqual(captures.a.key, [3625411723, 1954958720]);
  assert.deepEqual(captures.b.key, [195045567, 4062205631]);
  assert.equal(replay.matches, 64);
  assert.equal(split.matches, 38);
  assert.deepEqual(['00', '01', '10', '11'].map(
    pair => split.pairs.filter(cell => cell === pair).length), [22, 11, 15, 16]);
  assert.deepEqual([4, 5, 0].map(col => split.pairs[col]), ['01', '10', '00']);
  assert.equal(0.5 ** 2 + (1 - 0.5) ** 2, 0.5);
}

export default { title: 'Did both dropout calls use the same key?', beats, draw, check };
