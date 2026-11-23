import assert from 'node:assert/strict';

// Pipeline stage zero of the lesson's TP=2, DP=2, PP=2 mesh.
const ranks = [0, 1, 2, 3].map((id) => ({
  id,
  tensor: id % 2,
  replica: Math.floor(id / 2),
}));
const anchor = ranks[3];
const tensorPair = ranks.filter((r) => r.replica === anchor.replica);
const dataPair = ranks.filter((r) => r.tensor === anchor.tensor);

// A row-parallel projection onto one output. Each local loss is its example's
// scalar output, so the unscaled weight gradients equal the input features.
const weights = [1, 1, 1, 2];
const examples = [
  [1, 2, 3, 4],
  [2, 1, 1, 2],
];
const dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);
function weightSlice(vector, rank) {
  return vector.slice(rank.tensor * 2, rank.tensor * 2 + 2);
}
const partials = tensorPair.map((r) =>
  dot(weightSlice(examples[r.replica], r), weightSlice(weights, r)),
);
const output = partials.reduce((a, b) => a + b);
const localGrad = dataPair.map((r) => weightSlice(examples[r.replica], r));
const ownedGrad = dataPair.map((owner, index) => ({
  rank: owner.id,
  index,
  value: localGrad.reduce((sum, g) => sum + g[index], 0) / dataPair.length,
}));

function check() {
  assert.deepEqual(
    tensorPair.map((r) => r.id),
    [2, 3],
  );
  assert.deepEqual(
    dataPair.map((r) => r.id),
    [1, 3],
  );
  assert.deepEqual(partials, [3, 5]);
  assert.equal(output, dot(examples[1], weights));
  assert.equal(output, 8);
  assert.deepEqual(ownedGrad, [
    { rank: 1, index: 0, value: 2 },
    { rank: 3, index: 1, value: 3 },
  ]);
  // Verify the scattered entries against the whole, equally weighted loss.
  const loss = (w) => examples.reduce((sum, x) => sum + dot(w, x), 0) / examples.length;
  for (const { index, value } of ownedGrad) {
    const perturbed = weights.slice();
    perturbed[anchor.tensor * 2 + index] += 1;
    assert.equal(loss(perturbed) - loss(weights), value);
  }
}

const beats = [
  {
    id: 'crossing',
    say: 'Watch rank three, on the lower right. The three coming across the row is the missing part of its output. Five travels the other way.',
    hold: 0.75,
  },
  {
    id: 'both-eights',
    say: 'Both ranks have eight. They worked on the same example, but each used a different slice of the layer’s weights. A tensor-parallel all-reduce adds the partial outputs and gives both ranks the sum.',
    hold: 0.8,
  },
  {
    id: 'stay-on-three',
    say: 'Stay on rank three. After the backward pass, it has a gradient for each of its two weights. Which other rank on this map used those same weights?',
    hold: 1.5,
  },
  {
    id: 'look-up',
    say: 'Straight up, on rank one. It has a copy of those weights, and it worked on example A. Both examples count equally here, so we want the mean gradient for each weight.',
    hold: 0.6,
  },
  {
    id: 'two-lanes',
    say: 'Follow the four down. It meets a two on rank three. Their mean is three. In the other lane, a one travels up to meet a three.',
    hold: 0.9,
  },
  {
    id: 'two-owners',
    say: 'The mean is two, and rank one keeps it. Rank three keeps the gradient for the second weight. That’s a data-parallel reduce-scatter. Each rank can now update the weight whose gradient it kept.',
    hold: 2.25,
  },
];

const ink = '#27203d';
const copper = '#a93e25';
const clamp = (t) => Math.max(0, Math.min(1, t));
const smooth = (t) => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;

function text(c, str, x, y, size, color = ink, align = 'left', family = 'Sans', weight = 400) {
  c.font = `${weight} ${size}px "Lesson ${family}"`;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillStyle = color;
  c.fillText(str, x, y);
}
function polygon(c, points, fill) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}
function line(c, points, color, width = 2) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
function fade(c, opacity, paint) {
  if (opacity <= 0) return;
  c.save();
  c.globalAlpha *= clamp(opacity);
  paint();
  c.restore();
}
function gradient(c, x, y, xx, yy, stops) {
  const g = c.createLinearGradient(x, y, xx, yy);
  stops.forEach(([u, color]) => g.addColorStop(u, color));
  return g;
}

// Fixed positions represent logical ownership. The two lanes carry tensor
// elements between participants, independently of the collective's transport.
const left = [318, 1040],
  top = [244, 580],
  width = 590,
  height = 244;
function position(r) {
  return { x: left[r.tensor], y: top[r.replica] };
}
function slot(r, index) {
  const { x, y } = position(r);
  return [x + (index === undefined ? 318 : [221, 435][index]), y + 132];
}

function substrate(c) {
  c.fillStyle = gradient(c, 0, 0, 1920, 1080, [
    [0, '#f4edea'],
    [0.45, '#f4f2ed'],
    [1, '#d8dbe7'],
  ]);
  c.fillRect(0, 0, 1920, 1080);
  const edge = [
    [269, 209],
    [1665, 209],
    [1704, 248],
    [1704, 831],
    [1673, 862],
    [269, 862],
    [246, 839],
    [246, 232],
  ];
  c.save();
  c.shadowColor = 'rgba(39,29,74,0.24)';
  c.shadowOffsetY = 13;
  c.shadowBlur = 23;
  polygon(c, edge, '#827d9c');
  c.restore();
  polygon(
    c,
    edge.map(([x, y]) => [x, y - 7]),
    gradient(c, 254, 844, 1667, 209, [
      [0, '#a9aece'],
      [0.24, '#e2d0c8'],
      [0.48, '#b8afd0'],
      [0.72, '#d0d9dd'],
      [1, '#b6aec9'],
    ]),
  );
  // Edge fingers, scribe lanes and alignment crosses stay in the same place
  // as the active region turns through ninety degrees.
  for (let i = 0; i < 66; i++) {
    const x = 319 + i * 19.9;
    c.fillStyle = i % 4 === 0 ? '#85859f' : '#a19ab0';
    c.fillRect(x, 211, 11, 9);
    c.fillRect(x, 836, 11, 9);
    c.fillStyle = '#f5e2cb';
    c.fillRect(x + 1, 211, 9, 2);
    c.fillRect(x + 1, 836, 9, 2);
  }
  for (const x of [278, 1665]) {
    for (const y of [255, 529, 808]) {
      line(
        c,
        [
          [x - 8, y],
          [x + 8, y],
        ],
        '#747287',
        2,
      );
      line(
        c,
        [
          [x, y - 8],
          [x, y + 8],
        ],
        '#747287',
        2,
      );
    }
  }
}

function memoryBank(c, rank, active) {
  const { x, y } = position(rank);
  const corners = [
    [x + 12, y],
    [x + width - 26, y],
    [x + width, y + 26],
    [x + width, y + height - 12],
    [x + width - 12, y + height],
    [x + 24, y + height],
    [x, y + height - 24],
    [x, y + 12],
  ];
  polygon(
    c,
    corners.map(([a, b]) => [a, b + 3]),
    '#8f8c9f',
  );
  polygon(
    c,
    corners,
    gradient(c, x, y + height, x + width, y, [
      [0, '#c8c3d5'],
      [0.37, '#e1dce0'],
      [0.7, '#d3cdd9'],
      [1, '#bbc3d0'],
    ]),
  );
  fade(c, active, () =>
    polygon(
      c,
      corners,
      gradient(c, x, y + height, x + width, y, [
        [0, '#403754'],
        [0.28, '#4b405e'],
        [0.7, '#36324c'],
        [1, '#414d66'],
      ]),
    ),
  );
  // Repeated metal fingers border the working area of each buffer.
  for (let i = 0; i < 20; i++) {
    const xx = x + 26 + i * 28;
    const long = i % 5 === 0 ? 19 : 11;
    line(
      c,
      [
        [xx, y + height - 7],
        [xx, y + height - long],
      ],
      '#aaa3b6',
      2,
    );
    line(
      c,
      [
        [xx + 2, y + height - 7],
        [xx + 2, y + height - long],
      ],
      '#eee4e6',
      1,
    );
  }
  for (let i = 0; i < 8; i++) {
    const yy = y + 82 + i * 14;
    line(
      c,
      [
        [x + 8, yy],
        [x + 36 + i * 2, yy],
        [x + 51 + i * 2, yy + 15],
        [x + 70 + i * 2, yy + 15],
      ],
      '#b0a7bb',
      1.5,
    );
    line(
      c,
      [
        [x + width - 8, yy],
        [x + width - 32 - i * 2, yy],
        [x + width - 48 - i * 2, yy - 16],
      ],
      '#ada8ba',
      1.5,
    );
  }
  if (rank.id === anchor.id) {
    polygon(
      c,
      [
        [x + 14, y + 10],
        [x + 47, y + 10],
        [x + 14, y + 43],
      ],
      '#ffba84',
    );
  }
  text(c, 'Rank ' + rank.id, x + 53, y + 40, 41, ink, 'left', 'Sans', 600);
  fade(c, active, () =>
    text(
      c,
      'Rank ' + rank.id,
      x + 53,
      y + 40,
      41,
      rank === anchor ? '#ffd4ac' : '#f6f0ef',
      'left',
      'Sans',
      600,
    ),
  );
}

const digits = {
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  5: ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
};
function word(c, point, value, lit = true) {
  const [x, y] = point,
    pitch = 15;
  const bits = digits[value];
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 5; col++) {
      const xx = x + (col - 2) * pitch - 6,
        yy = y + (row - 3) * pitch - 6;
      c.fillStyle = lit ? '#625b76' : '#bdb4c8';
      c.fillRect(xx, yy, 12, 12);
      c.fillStyle = lit ? '#504b60' : '#e8dfe5';
      c.fillRect(xx, yy + 11, 12, 2);
      if (bits?.[row][col] === '1') {
        c.fillStyle = '#fbecc0';
        c.fillRect(xx, yy, 12, 12);
        c.fillStyle = '#fff9e1';
        c.fillRect(xx + 1, yy, 10, 2);
      }
    }
  }
}

function route(c, points, intensity = 1) {
  fade(c, intensity, () => {
    line(c, points, '#948799', 7);
    line(c, points, '#f8ded0', 4);
    line(c, points, '#9b706f', 1.4);
  });
}
function packet(c, points, t, value) {
  if (t <= 0 || t >= 1) return;
  const lengths = points
    .slice(1)
    .map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let d = smooth(t) * lengths.reduce((a, b) => a + b, 0);
  let i = 0;
  while (i < lengths.length - 1 && d > lengths[i]) d -= lengths[i++];
  const u = d / lengths[i],
    x = lerp(points[i][0], points[i + 1][0], u),
    y = lerp(points[i][1], points[i + 1][1], u);
  polygon(
    c,
    [
      [x - 23, y - 23],
      [x + 15, y - 23],
      [x + 23, y - 15],
      [x + 23, y + 23],
      [x - 23, y + 23],
    ],
    copper,
  );
  text(c, String(value), x, y + 1, 36, '#fff9eb', 'center', 'Mono');
}
function forward(c, flight, opacity) {
  fade(c, opacity, () => {
    const [lx, y] = slot(tensorPair[0]),
      [rx] = slot(anchor);
    const go = [
      [lx + 51, y - 15],
      [lx + 92, y - 56],
      [rx - 99, y - 56],
      [rx - 58, y - 15],
    ];
    const back = [
      [rx - 51, y + 15],
      [rx - 92, y + 56],
      [lx + 99, y + 56],
      [lx + 58, y + 15],
    ];
    route(c, go);
    route(c, back);
    const outgoing = [clamp(flight * 1.3 + 0.04), clamp((flight - 0.26) / 0.74)];
    tensorPair.forEach((r, i) => {
      const showSum = outgoing[1 - i] >= 1;
      const p = slot(r);
      word(c, p, showSum ? output : partials[i]);
      text(c, showSum ? '3 + 5' : 'partial', p[0], p[1] + 81, 31, '#fff0e6', 'center', 'Mono');
    });
    packet(c, go, outgoing[0], partials[0]);
    packet(c, back, outgoing[1], partials[1]);
  });
}

function gradients(c, local, peer, down, up) {
  const flights = [up, down];
  for (const { rank: id, index, value } of ownedGrad) {
    const owner = ranks[id],
      from = dataPair.find((r) => r.id !== id);
    const a = slot(from, index),
      b = slot(owner, index);
    const dir = Math.sign(b[1] - a[1]);
    const path = [
      [a[0], a[1] + dir * 63],
      [b[0], b[1] - dir * 63],
    ];
    const t = flights[index];
    route(c, path, peer * 0.9);
    for (const r of dataPair) {
      const p = slot(r, index),
        visible = r.id === anchor.id ? local : peer;
      const finished = t >= 1,
        sent = r === from && t > 0.08;
      const display = finished && r === owner ? value : localGrad[r.replica][index];
      fade(c, visible, () => {
        word(c, p, sent ? null : display);
        const label = 'w' + (2 + index);
        // The labels sit alongside the words so that neither lane crosses type.
        text(c, label, p[0] + 53, p[1] + 18, 32, sent ? '#b2a9be' : '#ffefd8', 'left', 'Mono');
      });
    }
    packet(c, path, t, localGrad[from.replica][index]);
  }
}

function draw(c, clock) {
  const { index, elapsed, reveal } = clock;
  const flight = index === 0 ? clamp(elapsed / Math.max(2, clock.speechDuration - 0.85)) : 1;
  const local = index < 2 ? 0 : index === 2 ? smooth(reveal('After the backward pass', 0.8)) : 1;
  const peer = index < 3 ? 0 : index === 3 ? smooth(reveal('Straight up', 0.8)) : 1;
  const down = index < 4 ? 0 : index === 4 ? reveal('Follow the four', 1.55) : 1;
  const up = index < 4 ? 0 : index === 4 ? reveal('In the other lane', 1.65) : 1;
  const namedTensor =
    index > 1 || (index === 1 && reveal('A tensor-parallel all-reduce', 0.25) > 0.5);
  const namedData = index === 5 && reveal('a data-parallel reduce-scatter', 0.25) > 0.5;

  substrate(c);
  const heading =
    local > 0.45
      ? namedData
        ? 'Data-parallel reduce-scatter'
        : 'Weight gradients'
      : namedTensor
        ? 'Tensor-parallel all-reduce'
        : 'Layer output';
  text(c, heading, 115, 94, 69, ink, 'left', 'Serif');
  text(c, 'Megatron  /  Logical mesh', 1805, 93, 30, ink, 'right', 'Mono');
  for (let side = 0; side < 2; side++) {
    text(
      c,
      'Weights ' + side * 2 + ' and ' + (side * 2 + 1),
      left[side] + width / 2,
      167,
      36,
      ink,
      'center',
    );
  }
  for (let row = 0; row < 2; row++) {
    text(c, 'Example', 217, top[row] + 92, 31, ink, 'right');
    text(c, row === 0 ? 'A' : 'B', 200, top[row] + 149, 70, ink, 'right', 'Serif');
  }
  // Expose one continuous band of the mesh behind its active buffers.
  const band = '#62536e';
  fade(c, 1 - local, () =>
    polygon(
      c,
      [
        [306, 619],
        [1643, 619],
        [1643, 791],
        [306, 791],
      ],
      band,
    ),
  );
  fade(c, peer, () =>
    polygon(
      c,
      [
        [1151, 237],
        [1532, 237],
        [1532, 826],
        [1151, 826],
      ],
      band,
    ),
  );
  for (const r of ranks) {
    const lit = r === anchor ? 1 : r === tensorPair[0] ? 1 - local : r === dataPair[0] ? peer : 0;
    memoryBank(c, r, lit);
    if (r !== anchor && lit < 1) {
      fade(c, 0.66 * (1 - lit), () => {
        for (const i of [0, 1]) word(c, slot(r, i), null, false);
      });
    }
  }
  forward(c, flight, 1 - local);
  gradients(c, local, peer, down, up);
}
export default { title: 'Megatron through the eyes of rank three', beats, draw, check };
