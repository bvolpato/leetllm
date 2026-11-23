import assert from 'node:assert/strict';
import { PAIRS, QUERY, SLOTS, TABLE, attend, storage } from '../../../films/kv-cache/model.mjs';

const beats = [
  {
    id: 'one-step-too-far',
    say: 'Keep your eye on the cursor. Six tokens went into this test. Where did all those nines come from?',
    hold: 1.25,
  },
  {
    id: 'the-fingerprint',
    say: 'V is the value row. We put those nines there on purpose, so we could spot a stray read. The slot just to the left holds the newest token.',
    hold: 0.75,
  },
  {
    id: 'two-blocks',
    say: 'Pull back. At this head, each new token adds one key and one value to the cache. The first four tokens filled block seven. The allocator found room across memory in block two. The earlier pairs stayed put.',
    hold: 0.8,
  },
  {
    id: 'the-sixth-pair',
    say: 'The attention kernel follows this block table. Start in seven. Zero, one, two, three. Now jump to block two for position four. One slot farther brings us to five, the sixth token.',
    hold: 1.1,
  },
  {
    id: 'six-shares',
    say: 'The newest token brings its own query. It scores all six keys, including its own. Those scores set the weights you see above. Each value contributes that share to the output.',
    hold: 0.8,
  },
  {
    id: 'the-extra-share',
    say: 'Let the read take one more step. Look at the weights. Our test key scores so high that the spare slot takes practically the whole strip. Both output numbers come from its value.',
    hold: 1.15,
  },
  {
    id: 'end-of-history',
    say: 'Give the kernel the valid length for this request. Six. The history ends here, just after position five. The request owns the striped slots, but neither one gets a share.',
    hold: 1.0,
  },
  {
    id: 'same-pairs',
    say: 'Lay the same six pairs side by side and you get these same two numbers. The block table tells attention where to look. The length tells it where to stop.',
    hold: 2.6,
  },
];

const length = PAIRS.length;
const capacity = TABLE.length * SLOTS;
function address(position) {
  const logical = Math.floor(position / SLOTS);
  return { block: TABLE[logical], slot: position % SLOTS };
}
function read(count) {
  const pairs = Array.from({ length: count }, (_, p) => {
    const { block, slot } = address(p);
    return storage.get(block)[slot];
  });
  const scores = pairs.map(
    ([k]) => k.reduce((s, v, i) => s + v * QUERY[i], 0) / Math.sqrt(QUERY.length),
  );
  const largest = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - largest));
  const sum = exps.reduce((s, x) => s + x, 0);
  return { pairs, weights: exps.map((e) => e / sum), output: attend(QUERY, pairs) };
}
const good = read(length);
const stray = read(length + 1);
const contiguous = attend(QUERY, PAIRS);
const formatPair = (v) => '(' + v.map((n) => Number(n.toFixed(2)).toString()).join(', ') + ')';

function check() {
  assert.deepEqual(TABLE, [7, 2]);
  assert.equal(capacity, 8);
  assert.equal(length, 6);
  assert.deepEqual(address(length - 1), { block: 2, slot: 1 });
  assert.deepEqual(address(length), { block: 2, slot: 2 });
  assert.deepEqual(good.pairs, PAIRS);
  assert.deepEqual(good.output, contiguous);
  assert.equal(formatPair(good.output), '(1.91, 1.53)');
  assert.deepEqual(stray.pairs.at(-1), [
    [1000, 1000],
    [999, 999],
  ]);
  assert.ok(stray.weights.at(-1) > 0.99999);
  assert.equal(formatPair(stray.output), '(999, 999)');
  for (const run of [good, stray]) {
    const reconstructed = QUERY.map((_, axis) =>
      run.pairs.reduce((s, [, v], p) => s + v[axis] * run.weights[p], 0),
    );
    reconstructed.forEach((v, i) => assert.ok(Math.abs(v - run.output[i]) < 1e-9));
  }
}

const ink = '#1c1945',
  violet = '#352695',
  indigo = '#2e24a4';
const pink = '#a42053',
  pale = '#fffafd';
const W = 696,
  H = 194,
  margin = 12,
  pitch = (W - 2 * margin) / SLOTS;
const blockOrigin = new Map([
  [7, [1088, 308]],
  [2, [160, 551]],
]);
const clip = (n) => Math.max(0, Math.min(1, n));
const smooth = (n) => {
  const t = clip(n);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;
const slotLeft = (slot) => margin + slot * pitch;

function polygon(g, points, fill, stroke, width = 1) {
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = width;
    g.stroke();
  }
}
function line(g, x, y, u, v, color, width = 2) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(u, v);
  g.lineWidth = width;
  g.strokeStyle = color;
  g.stroke();
}
function print(g, value, x, y, size, color = ink, options = {}) {
  const { family = 'Sans', weight = 500, align = 'left' } = options;
  g.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillStyle = color;
  g.fillText(String(value), x, y);
}
const center = { align: 'center' };
const mono = { family: 'Mono' };
function gradient(g, x1, y1, x2, y2, stops) {
  const gr = g.createLinearGradient(x1, y1, x2, y2);
  for (const [at, color] of stops) gr.addColorStop(at, color);
  return gr;
}

// A fixed view of two physical blocks. The close-up is cropped from this same layout.
function state(clock) {
  const { index, elapsed, reveal } = clock;
  let near = 1,
    cursor = 5,
    boundary = 0,
    table = 0,
    weights = 0,
    reference = 0;
  let showCursor = 1,
    rowFocus = 0,
    walk = false,
    sweep = 0,
    firstBlock = 0,
    nextBlock = 0;
  if (index === 0) {
    cursor += smooth(elapsed / 1.25);
  } else if (index === 1) {
    cursor = 6;
    rowFocus = reveal('value row') * (1 - reveal('just to the left'));
    showCursor = 1 - reveal('just to the left');
  } else if (index === 2) {
    cursor = 6;
    near = 1 - smooth(elapsed / 2.3);
    showCursor = 0;
    table = smooth(elapsed / 2.3);
    firstBlock = reveal('first four tokens');
    nextBlock = reveal('across memory');
  } else if (index === 3) {
    near = 0;
    table = 1;
    walk = true;
    // Each spoken coordinate selects the corresponding stored pair.
    const second = reveal('one, two', 0.3);
    const third = reveal('two, three', 0.3);
    const fourth = reveal('three', 0.3);
    const jump = smooth(reveal('jump to block two', 1.15));
    cursor = second + third + fourth + jump + reveal('brings us to five', 0.5);
    sweep = jump;
    showCursor = reveal('Start in seven');
    firstBlock = 1;
    nextBlock = 1;
  } else if (index === 4) {
    near = smooth(reveal('Each value contributes', 2.2));
    table = 1 - smooth(elapsed / 1.3);
    weights = reveal('scores all six keys', 0.8);
    firstBlock = 1;
    nextBlock = 1;
  } else if (index === 5) {
    weights = 1;
    cursor += smooth(reveal('one more step', 0.9));
  } else {
    weights = 1;
    boundary = index === 6 ? smooth(reveal('valid length', 0.95)) : 1;
    cursor = 6 - boundary;
    if (index === 7) reference = reveal('side by side', 0.65);
  }
  const extra = !walk && cursor >= 5.9;
  return {
    near,
    cursor,
    boundary,
    table,
    weights,
    reference,
    showCursor,
    rowFocus,
    walk,
    sweep,
    firstBlock,
    nextBlock,
    extra,
    index,
  };
}

function ground(g) {
  g.fillStyle = gradient(g, 150, 0, 1690, 1080, [
    [0, '#fdfafb'],
    [0.38, '#f4eff9'],
    [0.74, '#e7e1f4'],
    [1, '#dcd9f1'],
  ]);
  g.fillRect(0, 0, 1920, 1080);
}

// The cell pattern surrounds the two enlarged block faces, like the streets between dies.
function substrate(g) {
  g.save();
  g.transform(1, 0, -0.19, 1, 90, 0);
  g.strokeStyle = '#77729c19';
  g.lineWidth = 1.6;
  g.beginPath();
  for (let row = -1; row < 7; row++) {
    for (let col = -2; col < 11; col++) {
      const x = col * 224,
        y = row * 164;
      g.rect(x + 5, y + 5, 214, 154);
      for (let n = 0; n < 6; n++) {
        const a = x + 14 + 31 * n;
        g.moveTo(a, y + 19);
        g.lineTo(a, y + 29);
        g.moveTo(a, y + 136);
        g.lineTo(a, y + 146);
      }
    }
  }
  g.stroke();
  g.restore();
}

function face(g, block, slot, s) {
  const x = slotLeft(slot),
    w = pitch - 6;
  const p = TABLE.indexOf(block) * SLOTS + slot;
  const spare = p >= length;
  const [k, v] = storage.get(block)[slot];
  const lit = s.walk && s.showCursor > 0 && p <= s.cursor + 0.015;
  const base = spare
    ? [
        [0, '#fac8d8'],
        [0.52, '#eeb6d1'],
        [1, '#c69ad0'],
      ]
    : [
        [0, '#e7f5ff'],
        [0.46, '#c6d7ff'],
        [0.72, '#a9c5fc'],
        [1, '#92b8ef'],
      ];
  g.fillStyle = gradient(g, x, 5, x + w, H, base);
  g.fillRect(x, 9, w, H - 17);
  g.save();
  g.beginPath();
  g.rect(x, 9, w, H - 17);
  g.clip();
  if (spare) {
    for (let i = -H; i < w + H; i += 19) {
      line(g, x + i, H, x + i + H * 0.66, 0, '#8d427850', 5);
    }
  } else {
    // Parallel diffusion fingers give the key and value bands their silicon texture.
    for (let i = 7; i < w; i += 8) {
      line(g, x + i, 10, x + i, 29, '#4549ab60', 2);
      line(g, x + i, H - 20, x + i, H - 8, '#3a4fa252', 2);
    }
  }
  g.restore();
  const fg = spare ? '#702244' : '#25245b';
  // Center upright lettering on the tilted surface. The numbers stay readable as we pull back.
  function inscribe(text, y, size, options) {
    g.save();
    g.translate(x + w / 2, y);
    g.transform(1, 0, 40 / H, 1, 0, 0);
    print(g, text, 0, 0, size, fg, { align: 'center', ...options });
    g.restore();
  }
  inscribe(spare ? 'test' : 'pos ' + p, 66, 35, { weight: 700 });
  const pairLine = (label, vector, baseline, focused) => {
    const font = vector.some((n) => n >= 100) ? 21 : 23;
    g.fillStyle = spare ? '#f5d6e4' : '#dbebffc9';
    g.fillRect(x + 2, baseline - 26, w - 4, 31);
    if (focused > 0) {
      g.save();
      g.globalAlpha *= focused;
      g.fillStyle = '#ffeaea';
      g.fillRect(x + 2, baseline - 25, w - 4, 32);
      g.restore();
    }
    // At the wide scale show the two components as etched bars. Resolve their
    // actual numbers when the camera reaches the last block.
    const detail = smooth((s.near - 0.12) / 0.65);
    if (detail < 1) {
      g.save();
      g.globalAlpha *= 1 - detail;
      print(g, label, x + 11, baseline - 1, 22, fg, mono);
      for (const [axis, n] of vector.entries()) {
        const start = x + 43 + axis * 56;
        line(g, start, baseline - 9, start + 46, baseline - 9, '#a8acc4', 7);
        line(
          g,
          start,
          baseline - 9,
          start + 46 * Math.min(1, n / (label === 'K' ? 1 : 4)),
          baseline - 9,
          fg,
          8,
        );
      }
      g.restore();
    }
    if (detail > 0) {
      g.save();
      g.globalAlpha *= detail;
      inscribe(label + ' ' + vector.join(' '), baseline, font, { family: 'Mono' });
      g.restore();
    }
  };
  line(g, x + 12, 82, x + w - 12, 82, spare ? '#a96687' : '#7c88bd', 1.4);
  pairLine('K', k, 114, 0);
  pairLine('V', v, 151, p === length ? s.rowFocus : 0);
  if (lit) {
    g.fillStyle = '#4c3dc4';
    g.fillRect(x + 2, H - 15, w - 4, 7);
  }
}

function blockFace(g, block, s) {
  const [x, y] = blockOrigin.get(block),
    skew = 40,
    depth = 42;
  const hi = block === TABLE[0] ? s.firstBlock : s.nextBlock;
  g.save();
  g.translate(x, y);
  // The top and side stay attached during the camera move.
  g.save();
  g.shadowColor = '#3a286366';
  g.shadowBlur = 28;
  g.shadowOffsetY = 15;
  polygon(
    g,
    [
      [0, H],
      [skew, 10],
      [W + skew, 10],
      [W + skew, depth],
      [W, H + depth],
      [0, H + depth],
    ],
    '#847da3',
  );
  g.restore();
  polygon(
    g,
    [
      [W, H],
      [W + skew, 0],
      [W + skew, depth],
      [W, H + depth],
    ],
    '#55518c',
  );
  g.fillStyle = gradient(g, 0, H, W * 0.6, H + depth, [
    [0, '#36348a'],
    [0.5, '#4a449d'],
    [1, '#31336e'],
  ]);
  g.fillRect(0, H, W, depth);
  line(g, 0, H + depth - 3, W, H + depth - 3, '#979aca', 2);
  for (let slot = 0; slot < SLOTS; slot++) {
    print(g, 'slot ' + slot, slotLeft(slot) + pitch / 2 - 3, H + 29, 22, '#f3f1ff', {
      family: 'Mono',
      align: 'center',
    });
  }
  print(g, 'Block ' + block, skew + 3, -16, 40, ink, { weight: 600 });
  g.save();
  g.transform(1, 0, -skew / H, 1, skew, 0);
  g.fillStyle = '#6268a3';
  g.fillRect(0, 0, W, H);
  for (let slot = 0; slot < SLOTS; slot++) face(g, block, slot, s);
  line(g, 0, 1, W, 1, '#ffffff', 3);
  if (hi && s.index === 2) {
    g.save();
    g.globalAlpha *= hi;
    const count = block === TABLE[0] ? SLOTS : length % SLOTS;
    line(g, margin, H - 5, margin + pitch * count - 6, H - 5, indigo, 7);
    g.restore();
  }
  if (s.showCursor > 0) {
    const a = address(Math.floor(s.cursor));
    const b = address(Math.ceil(s.cursor));
    // Across a block boundary the read head changes address. It never inspects the gap.
    const at = a.block === b.block ? a.block : s.sweep < 0.5 ? a.block : b.block;
    const local = a.block === b.block ? s.cursor % SLOTS : s.sweep < 0.5 ? a.slot : b.slot;
    if (block === at) {
      const cx = slotLeft(local),
        glow = s.extra ? pink : indigo;
      g.save();
      g.globalAlpha *= s.showCursor;
      g.strokeStyle = pale;
      g.lineWidth = 13;
      g.strokeRect(cx + 1, 7, pitch - 8, H - 15);
      g.strokeStyle = glow;
      g.lineWidth = 6;
      g.strokeRect(cx + 1, 7, pitch - 8, H - 15);
      polygon(
        g,
        [
          [cx + pitch * 0.5 - 8, -10],
          [cx + pitch * 0.5 + 8, -10],
          [cx + pitch * 0.5, 0],
        ],
        glow,
      );
      g.restore();
    }
  }
  if (s.boundary > 0 && block === TABLE.at(-1)) {
    const bx = slotLeft(length % SLOTS) - 3;
    g.save();
    g.globalAlpha *= s.boundary;
    line(g, bx, -16, bx, H + 4, pale, 13);
    line(g, bx, -16, bx, H + 4, '#281d72', 6);
    line(g, bx - 9, -16, bx + 9, -16, '#281d72', 5);
    g.restore();
  }
  g.restore();
  if (s.boundary > 0 && block === TABLE.at(-1)) {
    g.save();
    g.globalAlpha *= s.boundary;
    print(g, 'Length ' + length, skew + slotLeft(length % SLOTS) - 3, -28, 26, '#39227d', {
      weight: 700,
      align: 'center',
    });
    g.restore();
  }
  g.restore();
}

function blockTable(g, s) {
  g.save();
  g.globalAlpha *= smooth((s.table - 0.5) * 2);
  print(g, 'Block table for this request', 130, 110, 43, ink);
  const positions = [160, 375];
  for (const [i, block] of TABLE.entries()) {
    const active = s.walk
      ? address(Math.round(s.cursor)).block === block
      : i === 0
        ? s.firstBlock > 0
        : s.nextBlock > 0;
    print(g, block, positions[i], 238, 112, active ? indigo : '#655c81', mono);
  }
  line(g, 260, 198, 344, 198, ink, 4);
  polygon(
    g,
    [
      [341, 187],
      [358, 198],
      [341, 209],
    ],
    ink,
  );
  if (s.walk && s.showCursor) {
    const p = Math.round(s.cursor);
    const i = TABLE.indexOf(address(p).block);
    g.save();
    g.globalAlpha *= s.showCursor;
    line(g, positions[i] - 1, 255, positions[i] + 68, 255, indigo, 7);
    print(g, 'Position ' + p + '  →  slot ' + address(p).slot, 131, 340, 46, violet);
    g.restore();
  }
  g.restore();
}
function output(g, s) {
  const run = s.extra ? stray : good;
  g.save();
  g.globalAlpha *= smooth((0.5 - s.table) * 2);
  print(g, 'Attention output', 126, 109, 43, ink);
  print(g, formatPair(run.output), 118, 229, 98, s.extra ? pink : ink, mono);
  if (s.weights) {
    const x = 1066,
      y = 169,
      w = 705,
      h = 61;
    g.save();
    g.globalAlpha *= s.weights * (1 - smooth(2 * s.reference));
    print(g, 'Weight by position', x, y - 20, 36, ink);
    let l = x;
    run.weights.forEach((weight, i) => {
      const width = weight * w;
      if (width > 0.5) {
        g.fillStyle = i === length ? pink : i % 2 ? '#5149ac' : '#38308c';
        g.fillRect(l, y, width, h);
        line(g, l, y, l, y + h, pale, 3);
        print(g, i === length ? 'test slot' : i, l + width / 2, y + 44, 37, pale, center);
      }
      l += width;
    });
    g.restore();
  }
  if (s.reference > 0.5) {
    const appear = smooth(2 * s.reference - 1);
    g.save();
    g.globalAlpha *= appear;
    const x = 1080,
      width = 62;
    print(g, 'Contiguous reference', x, 122, 40, ink);
    good.pairs.forEach((_, p) => {
      const cx = x + p * width + (p < SLOTS ? 0 : (1 - appear) * 60);
      g.fillStyle = indigo;
      g.fillRect(cx, 143, width - 2, 49);
      print(g, p, cx + width / 2, 178, 30, pale, center);
    });
    print(g, formatPair(contiguous), x - 4, 261, 62, violet, mono);
    g.restore();
  }
  g.restore();
}

function draw(g, clock) {
  const s = state(clock);
  ground(g);
  g.save();
  const zoom = mix(1, 1.9, s.near);
  // Keep the partial block's center stationary relative to its close-up target.
  const [x, y] = blockOrigin.get(TABLE.at(-1));
  const anchorX = x + W / 2 + 20,
    anchorY = y + (H + 42) / 2;
  g.translate(mix(anchorX, 960, s.near), mix(anchorY, 640, s.near));
  g.scale(zoom, zoom);
  g.translate(-anchorX, -anchorY);
  substrate(g);
  for (const block of TABLE) blockFace(g, block, s);
  g.restore();
  // Soften the substrate above the faces while keeping all live memory in full contrast.
  g.fillStyle = gradient(g, 0, 0, 0, 318, [
    [0, '#fbf9fc'],
    [0.65, '#fbf9fcdb'],
    [1, '#fbf9fc00'],
  ]);
  g.fillRect(0, 0, 1920, 318);
  if (s.table) blockTable(g, s);
  if (s.table < 1) output(g, s);
  if (s.index < 4) {
    print(g, 'One head  /  six-token test', 1780, 76, 36, '#524962', { align: 'right' });
  } else if (s.index < 7) {
    print(g, 'Query ' + formatPair(QUERY), 1780, 76, 36, '#524962', { align: 'right' });
  }
}

export default { title: 'The Seventh Read', beats, draw, check };
