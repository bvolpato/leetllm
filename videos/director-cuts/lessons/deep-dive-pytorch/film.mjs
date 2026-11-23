import assert from 'node:assert/strict';

const title = 'PyTorch: Where did the three go?';

const beats = [
  {
    id: 'turn',
    say: 'Keep your eye on the red three. When I transpose this tensor, where does the three go?',
    hold: 0.9,
  },
  {
    id: 'address',
    say: 'It started the second row. Now it ends the top row. Follow the line down. Both coordinates reach the same eight bytes, starting at byte twenty-four. PyTorch exchanged the row and column strides.',
    hold: 0.8,
  },
  {
    id: 'across',
    say: 'Read the top row. Start at zero. Its neighbor in this view is three. How far apart are they in storage?',
    hold: 1.1,
  },
  {
    id: 'back',
    say: 'Three slots to the right. Now start the next row. To get to one, you go two slots left. A flat view needs one fixed stride. Could the same stride take both steps?',
    hold: 1.2,
  },
  {
    id: 'copy',
    say: 'Watch what reshape does here. It puts zero in fresh storage, then copies three right beside it. The rest follow in row order. Now every step is one slot.',
    hold: 0.9,
  },
  {
    id: 'write',
    say: 'Now write thirty where the three was in the transposed view. Which three in storage will change?',
    hold: 1.8,
  },
  {
    id: 'two-reads',
    say: 'The original tensor reads thirty from that same address. Look one row lower. The copy has its own three.',
    hold: 2.5,
  },
];

// Strides and storage offsets count elements. Only the byte labels use byte offsets.
const storage = BigInt64Array.from([0n, 1n, 2n, 3n, 4n, 5n]);
const x = { storage, shape: [2, 3], stride: [3, 1] };
const y = { storage: x.storage, shape: [...x.shape].reverse(), stride: [...x.stride].reverse() };
const address = (view, row, col) => row * view.stride[0] + col * view.stride[1];
const order = Array.from({ length: storage.length }, (_, i) =>
  address(y, Math.floor(i / y.shape[1]), i % y.shape[1]),
);
const flat = BigInt64Array.from(order, (slot) => storage[slot]);
const marked = address(y, 0, 1);
const destination = order.indexOf(marked);
const elementBytes = storage.BYTES_PER_ELEMENT;
// Keep the earlier image so that draw() can seek to either side of the write.
const beforeWrite = storage.slice();
y.storage[marked] = 30n;

function check() {
  assert.strictEqual(y.storage, x.storage);
  assert.deepEqual(y.shape, [3, 2]);
  assert.deepEqual(y.stride, [1, 3]);
  assert.equal(address(x, 1, 0), marked);
  assert.equal(marked * elementBytes, 24);
  assert.equal(storage.byteLength, 48);
  assert.deepEqual(order, [0, 3, 1, 4, 2, 5]);
  assert.deepEqual(
    order.slice(1).map((slot, i) => slot - order[i]),
    [3, -2, 3, -2, 3],
  );
  assert.notStrictEqual(flat.buffer, storage.buffer);
  assert.deepEqual([...flat], [0n, 3n, 1n, 4n, 2n, 5n]);
  assert.equal(destination, 1);
  assert.equal(beforeWrite[marked], 3n);
  assert.equal(x.storage[address(x, 1, 0)], 30n);
  assert.equal(y.storage[address(y, 0, 1)], 30n);
  assert.equal(flat[destination], 3n);
}

const c = {
  ink: '#172546',
  muted: '#495777',
  red: '#c9372f',
  coral: '#ff8f76',
  seam: '#8e9fc4',
  lower: '#172e76',
  white: '#fffdf9',
};
const mono = 'Lesson Mono';
const sans = 'Lesson Sans';
const minmax = (t) => Math.max(0, Math.min(1, t));
const smooth = (t) => {
  t = minmax(t);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;
const cell = 145;
const bankX = 353;
const slotW = 235;
const center = (i) => bankX + (i + 0.5) * slotW;
const topA = 675;
const topB = 841;
const face = 89;

function text(ctx, str, px, py, size, color = c.ink, family = sans, weight = 500, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "' + family + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(String(str), px, py);
}

function line(ctx, ax, ay, bx, by, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function shape(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const p of points.slice(1)) ctx.lineTo(...p);
  ctx.closePath();
}

function dot(ctx, px, py, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(px, py, radius, 0, Math.PI * 2);
  ctx.fill();
}

// Rotate the drawing plane about its diagonal. At the two ends this maps
// (column, row) to (column, row) and (row, column), respectively.
function projection(turn) {
  const angle = turn * Math.PI;
  const a = (1 + Math.cos(angle)) / 2;
  const b = 1 - a;
  const lift = 0.16 * Math.sin(angle);
  return (col, row) => [
    288 + cell * (a * col + b * row + lift * (col - row)),
    90 + cell * (b * col + a * row - lift * (col - row)),
  ];
}

function background(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 1350, 600);
  sky.addColorStop(0, '#cfdaef');
  sky.addColorStop(0.5, '#eef2fb');
  sky.addColorStop(1, '#faf8f3');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1920, 1080);
  // A sparse coordinate field is visible through the lifted plane.
  ctx.fillStyle = 'rgba(93, 113, 155, 0.21)';
  for (let px = 28; px < 1920; px += 48) {
    for (let py = 21; py < 558; py += 48) ctx.fillRect(px, py, 2.5, 2.5);
  }
  const section = ctx.createLinearGradient(0, 555, 1790, 1010);
  section.addColorStop(0, '#244591');
  section.addColorStop(0.57, c.lower);
  section.addColorStop(1, '#172458');
  ctx.fillStyle = section;
  ctx.fillRect(0, 557, 1920, 523);
  line(ctx, 0, 558, 1920, 558, '#8192b7', 2);
}

function drawView(ctx, project, turn, active, values) {
  const corners = [project(0, 0), project(3, 0), project(3, 2), project(0, 2)];
  const lift = Math.sin(turn * Math.PI);
  ctx.save();
  ctx.shadowColor = 'rgba(23,42,84,.27)';
  ctx.shadowBlur = 22 + 20 * lift;
  ctx.shadowOffsetX = 10 + 18 * lift;
  ctx.shadowOffsetY = 18 + 14 * lift;
  shape(
    ctx,
    corners.map(([px, py]) => [px, py + 6]),
  );
  ctx.fillStyle = '#8192b9';
  ctx.fill();
  ctx.restore();

  const pane = ctx.createLinearGradient(230, 85, 740, 520);
  pane.addColorStop(0, '#ffffff');
  pane.addColorStop(0.54, '#f6f9ff');
  pane.addColorStop(1, '#cddef2');
  shape(ctx, corners);
  ctx.fillStyle = pane;
  ctx.fill();
  const ink = Math.min(1, Math.abs(Math.cos(turn * Math.PI)) * 2);
  for (let row = 0; row < x.shape[0]; row++) {
    for (let col = 0; col < x.shape[1]; col++) {
      const slot = address(x, row, col);
      shape(ctx, [
        project(col, row),
        project(col + 1, row),
        project(col + 1, row + 1),
        project(col, row + 1),
      ]);
      if (slot === marked) {
        ctx.fillStyle = c.red;
        ctx.fill();
      }
      ctx.strokeStyle = c.seam;
      ctx.lineWidth = 2;
      ctx.stroke();
      const [px, py] = project(col + 0.5, row + 0.5);
      ctx.save();
      ctx.globalAlpha *= ink;
      ctx.translate(px, py);
      ctx.scale(0.68 + 0.32 * ink, 0.7 + 0.3 * ink);
      text(ctx, values[slot], 0, 3, 93, slot === marked ? c.white : c.ink, mono, 600, 'center');
      ctx.restore();
      if (slot === active) {
        line(ctx, px - 28, py + 49, px + 28, py + 49, slot === marked ? c.white : c.ink, 7);
      }
    }
  }
  shape(ctx, corners);
  ctx.strokeStyle = '#8192b5';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function tether(ctx, project, turn, alpha, trace) {
  if (!alpha) return;
  // The lower edge of x[1,0] becomes the right edge of y[0,1].
  const [px, py] = project(0.5, 2);
  const end = center(marked);
  const side = smooth(turn);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.bezierCurveTo(
    px + 160 * side,
    py + 155 * (1 - side),
    mix(600, 750, side),
    521,
    mix(725, 825, side),
    535,
  );
  ctx.bezierCurveTo(955, 565, end, 573, end, topA - 8);
  ctx.strokeStyle = c.red;
  ctx.lineWidth = 5;
  ctx.stroke();
  if (trace > 0 && trace < 1) {
    const length = 1050;
    ctx.strokeStyle = '#ffad83';
    ctx.lineWidth = 9;
    ctx.setLineDash([65, length]);
    ctx.lineDashOffset = 65 - trace * length;
    ctx.stroke();
    ctx.setLineDash([]);
  }
  dot(ctx, px, py, 6, c.red);
  dot(ctx, end, topA - 8, 7, c.coral);
  ctx.restore();
}

function bank(ctx, top, values, shown, isCopy, reading) {
  text(ctx, isCopy ? 'Storage B' : 'Storage A', 85, top + 24, 43, c.white, sans, 600);
  text(ctx, isCopy ? 'flat' : 'int64', 88, top + 73, 34, '#c5d6f5', mono);
  for (let i = 0; i < values.length; i++) {
    const left = bankX + slotW * i;
    const isMark = i === (isCopy ? destination : marked);
    const exists = i < shown;
    const hot = exists && isMark;
    const color = hot ? (isCopy ? '#ffd5c8' : '#ff987f') : isCopy ? '#d6e6f7' : '#d7e1f3';
    ctx.fillStyle = exists ? color : '#293f7a';
    ctx.fillRect(left + 2, top, slotW - 4, face);
    // Each int64 occupies the eight byte-wide divisions on the cut face.
    ctx.fillStyle = exists ? (hot ? '#d07c70' : '#9cb4d5') : '#25396c';
    ctx.fillRect(left + 2, top + face, slotW - 4, 16);
    for (let byte = 1; byte < elementBytes; byte++) {
      const bx = left + (slotW * byte) / elementBytes;
      line(ctx, bx, top + face + 1, bx, top + face + 15, '#37548b', 2);
    }
    if (exists) text(ctx, values[i], center(i), top + face / 2 + 2, 71, c.ink, mono, 600, 'center');
    if (reading === i) line(ctx, left + 11, top + 3, left + slotW - 11, top + 3, c.white, 8);
  }
}

function arcPoint(from, to, height, t) {
  return [mix(center(from), center(to), t), topA - 7 - height * Math.sin(Math.PI * t)];
}

function hop(ctx, from, to, height, fraction, color) {
  if (fraction <= 0) return;
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const p = arcPoint(from, to, height, (fraction * i) / 40);
    if (i === 0) ctx.moveTo(...p);
    else ctx.lineTo(...p);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.stroke();
  const [px, py] = arcPoint(from, to, height, fraction);
  const [prevX, prevY] = arcPoint(from, to, height, Math.max(0, fraction - 0.035));
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(Math.atan2(py - prevY, px - prevX));
  shape(ctx, [
    [5, 0],
    [-17, -9],
    [-17, 9],
  ]);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function copyInFlight(ctx, count) {
  const i = Math.floor(count);
  if (i >= order.length) return;
  const t = count - i;
  const from = order[i];
  const pos = smooth(t);
  const px = mix(center(from), center(i), pos);
  const py = mix(topA + face, topB + 5, pos) - 14 * Math.sin(t * Math.PI);
  ctx.fillStyle = from === marked ? c.coral : c.white;
  ctx.beginPath();
  ctx.roundRect(px - 33, py - 24, 66, 48, 9);
  ctx.fill();
  text(ctx, flat[i], px, py + 1, 37, c.ink, mono, 600, 'center');
}

function draw(ctx, clock) {
  const { index, elapsed, speechDuration } = clock;
  const turn = index === 0 ? smooth(elapsed / 2.9) : 1;
  const project = projection(turn);
  const firstHop = index === 2 ? smooth(clock.reveal('Its neighbor', 1.25)) : Number(index > 2);
  const nextHop = index === 3 ? smooth(clock.reveal('Now start', 1.12)) : Number(index > 3);
  let count = index > 4 ? order.length : 0;
  if (index === 4) {
    count =
      clock.reveal('It puts zero', 0.9) +
      clock.reveal('then copies three', 1.2) +
      (order.length - 2) * clock.reveal('The rest follow', 2.6);
  }
  const copying = index === 4 && !Number.isInteger(count);
  const active =
    index === 2
      ? firstHop < 0.6
        ? order[0]
        : order[1]
      : index === 3
        ? nextHop < 0.6
          ? order[1]
          : order[2]
        : copying
          ? order[Math.floor(count)]
          : -1;
  const written = index > 5 || (index === 5 && elapsed >= speechDuration + 1.05);
  const showB = count > 0 || index > 4;

  background(ctx);
  const tetherOpacity = index < 2 || index > 4 ? 1 : 0;
  const trace = index === 1 ? clock.reveal('Follow the line', 1.6) : 0;
  tether(ctx, project, turn, tetherOpacity, trace);
  const displayedStorage = written ? x.storage : beforeWrite;
  drawView(ctx, project, turn, active, displayedStorage);

  const view = turn < 0.5 ? x : y;
  text(ctx, view === x ? 'x' : 'y', 188, 132, 85, c.muted, mono, 500, 'center');
  const codeX = 894;
  if (index < 2) {
    text(ctx, 'y = x.T', codeX, 138, 83, c.ink, mono, 600);
    text(ctx, 'shape', codeX + 3, 269, 40, c.muted);
    text(ctx, view.shape.join(' × '), codeX + 202, 269, 49, c.ink, mono);
    text(ctx, 'stride', codeX + 3, 342, 40, c.muted);
    text(ctx, '(' + view.stride.join(', ') + ')', codeX + 202, 342, 49, c.ink, mono);
    text(ctx, view === x ? 'x[1, 0]' : 'y[0, 1]', codeX + 3, 455, 49, c.red, mono, 600);
  } else if (index === 2 || index === 3) {
    text(ctx, 'Read by row', codeX, 144, 76, c.ink, sans, 600);
    const cursor = order.indexOf(active);
    const row = Math.floor(cursor / y.shape[1]);
    const col = cursor % y.shape[1];
    text(
      ctx,
      'y[' + row + ', ' + col + ']',
      codeX + 2,
      287,
      59,
      active === marked ? c.red : c.ink,
      mono,
    );
    if (firstHop >= 0.98) {
      const forward = order[1] - order[0];
      text(ctx, 'Storage steps', codeX + 2, 405, 39, c.muted);
      text(ctx, '+' + forward, codeX + 300, 405, 57, c.ink, mono, 600);
      if (nextHop >= 0.98) {
        text(ctx, '−' + (order[1] - order[2]), codeX + 448, 405, 57, c.red, mono, 600);
      }
    }
    hop(ctx, order[0], order[1], 79, firstHop, c.white);
    hop(ctx, order[1], order[2], 33, nextHop, c.coral);
  } else if (index === 4) {
    text(ctx, 'flat = y.reshape(-1)', codeX, 155, 68, c.ink, mono, 500);
    const read = Math.min(order.length - 1, Math.floor(count));
    if (copying) {
      text(
        ctx,
        'y[' + Math.floor(read / y.shape[1]) + ', ' + (read % y.shape[1]) + ']',
        codeX + 2,
        293,
        56,
        c.muted,
        mono,
      );
    }
    if (count >= order.length)
      text(ctx, 'flat[1]  →  ' + flat[destination], codeX + 2, 293, 56, c.ink, mono);
  } else {
    text(ctx, 'y[0, 1] = 30', codeX, 155, 73, c.ink, mono, 600);
    if (written) {
      text(ctx, 'x[1, 0]', codeX + 2, 294, 46, c.muted, mono);
      text(ctx, x.storage[address(x, 1, 0)], codeX + 304, 294, 62, c.red, mono, 600);
      text(ctx, 'flat[1]', codeX + 2, 395, 46, c.muted, mono);
      text(ctx, flat[destination], codeX + 304, 395, 62, c.ink, mono, 600);
    }
  }

  bank(ctx, topA, displayedStorage, displayedStorage.length, false, active);
  if (index < 2 || index > 4) {
    text(ctx, 'byte offset', 88, topA - 42, 32, '#d5e1fa', sans);
    for (let i = 0; i < storage.length; i++) {
      const startX = bankX + i * slotW + 2;
      line(ctx, startX, topA - 19, startX, topA - 4, '#9bb3d9');
      text(
        ctx,
        i * elementBytes,
        startX,
        topA - 38,
        34,
        i === marked ? c.coral : '#d5e1fa',
        mono,
        i === marked ? 700 : 400,
      );
    }
  }
  if (showB) bank(ctx, topB, flat, Math.floor(count), true, -1);
  if (copying) copyInFlight(ctx, count);
}

export default { title, beats, draw, check };
