import assert from 'node:assert/strict';
import {
  execute,
  operation,
  operationBinding,
  packet,
  packetBinding,
  reviewed,
} from '../../../films/capstone-production-llm-agent/model.mjs';

const beats = [
  {
    id: 'the-interrupted-write',
    say: 'Watch the row forming for account A three hundred. In this lab, saving it would record a key restore. Just before commit, the executor hits an error.',
    hold: 0.75,
  },
  {
    id: 'after-rollback',
    say: 'SQLite rolls back the insert. What can a fresh connection see? The effects table is empty. Look one layer deeper.',
    hold: 1.25,
  },
  {
    id: 'the-saved-approval',
    say: 'That approval was saved earlier. The agent had drafted a policy reply. An operator separately requested the restore and a reviewer approved it. On retry, the executor checks the approved request, the current account, and the deadline. Then it inserts the row again.',
    hold: 0.65,
  },
  {
    id: 'the-commit',
    say: 'Follow the row down. This time the transaction commits. Another connection can read the account and scope. The little square beside them encodes the operation ID.',
    hold: 1.25,
  },
  {
    id: 'the-id-lookup',
    say: 'Here comes the same approved request a third time. Will it leave another row? Watch the squares line up. The executor finds that ID in the table and skips the insert.',
    hold: 1.35,
  },
  {
    id: 'one-local-row',
    say: 'Before retrying a remote restore, use a key the service honors or check its records. Here, three attempts left one row for A three hundred.',
    hold: 2.6,
  },
];

const effects = new Set();
const attempts = [true, false, false].map((fail, i) => {
  const outcome = execute({ effects, fail, now: 1001 + i });
  return { number: i + 1, outcome, rows: [...effects] };
});
const row = { id: operation, account: packet.account, scope: packet.scope };
const signature = [...row.id].flatMap((hex) => {
  const nibble = Number.parseInt(hex, 16);
  return [3, 2, 1, 0].map((shift) => (nibble >> shift) & 1);
});

const font5x7 = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
};
const accountPixels = [...row.account].flatMap((glyph, k) =>
  font5x7[glyph].flatMap((line, y) =>
    [...line].flatMap((bit, x) => (bit === '1' ? [{ x: k * 6 + x, y }] : [])),
  ),
);

function check() {
  assert.equal(packetBinding(packet), reviewed);
  assert.equal(operationBinding(packet), row.id);
  assert.deepEqual(
    attempts.map((a) => a.outcome),
    ['Transaction rolled back', 'Local effect committed', 'Duplicate ignored'],
  );
  assert.deepEqual(
    attempts.map((a) => a.rows),
    [[], [row.id], [row.id]],
  );
  assert.deepEqual([row.id.slice(0, 8), row.account, row.scope], ['6915f9a5', 'A300', 'prod-api']);
  const decoded = Array.from({ length: 64 }, (_, i) =>
    Number.parseInt(signature.slice(4 * i, 4 * i + 4).join(''), 2).toString(16),
  ).join('');
  assert.equal(decoded, row.id);
  assert.equal(
    execute({ effects: new Set(attempts[2].rows), now: packet.expiresAt }),
    'BLOCK: expired',
  );
  return true;
}

const clamp = (n) => Math.max(0, Math.min(1, n));
const ease = (n) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;
const ramp = (t, from, to) => ease((t - from) / (to - from));
const depth = 284;
const wide = 1290;
function projection(tilt) {
  const backX = mix(405, 320, tilt);
  const skew = mix(-0.56, -0.17, tilt);
  return { backX, frontX: backX + skew * depth, skew, slope: mix(0.76, 1.29, tilt) };
}
const raisedView = projection(0);
const baseY = 553;
const openY = 228;

function linear(ctx, x, y, x1, y1, stops) {
  const g = ctx.createLinearGradient(x, y, x1, y1);
  for (const [pos, color] of stops) g.addColorStop(pos, color);
  return g;
}

function poly(ctx, points, fill) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function label(ctx, value, x, y, size, color, options = {}) {
  ctx.font =
    (options.weight || 500) + ' ' + size + 'px "Lesson ' + (options.family || 'Sans') + '"';
  ctx.textAlign = options.align || 'left';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function line(ctx, x, y, endX, endY, color, width = 1) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawRoom(ctx) {
  ctx.fillStyle = linear(ctx, 100, 0, 1580, 1260, [
    [0, '#f9f5ed'],
    [0.42, '#ede5e9'],
    [0.76, '#d5d0e3'],
    [1, '#a9abc9'],
  ]);
  ctx.fillRect(0, 0, 1920, 1080);
  // Raking light makes the height between the two surfaces visible.
  const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  shadow.addColorStop(0, 'rgba(40,23,75,.44)');
  shadow.addColorStop(0.67, 'rgba(50,38,88,.16)');
  shadow.addColorStop(1, 'rgba(50,38,88,0)');
  ctx.save();
  ctx.translate(991, 840);
  ctx.transform(849, -8, -199, 141, 0, 0);
  ctx.fillStyle = shadow;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function drawHeader(ctx, attempt) {
  label(ctx, 'A local key restore', 110, 116, 75, '#241d36', { family: 'Serif' });
  label(ctx, 'Attempt ' + attempt.number, 1808, 99, 47, '#34283f', { align: 'right' });
}

function bitStamp(ctx, x, y, scale, ink, amount) {
  if (amount <= 0) return;
  ctx.fillStyle = ink;
  for (let i = 0; i < signature.length; i++) {
    if (!signature[i]) continue;
    const col = i % 16,
      r = Math.floor(i / 16);
    const growth = ramp(amount * 1.22, (col + r) / 38, (col + r) / 38 + 0.19);
    if (growth <= 0) continue;
    const w = (scale - 1) * growth;
    ctx.fillRect(x + (col + 0.5) * scale - w / 2, y + (r + 0.5) * scale - w / 2, w, w);
  }
}

function pixelName(ctx, x, y, ink, amount) {
  const pitch = 21;
  ctx.fillStyle = ink;
  for (const p of accountPixels) {
    const wave = (p.x + 0.4 * p.y) / 29;
    const g = ramp(amount * 1.2, wave, wave + 0.15);
    if (g <= 0) continue;
    const w = pitch * 0.86 * g;
    ctx.fillRect(x + (p.x + 0.5) * pitch - w / 2, y + (p.y + 0.5) * pitch - w / 2, w, w);
  }
}

function surfaceLabel(ctx, view, value, x, y, size, ink, options = {}) {
  ctx.save();
  ctx.translate(x, y);
  // Leave the type slightly inclined while preserving its height at phone size.
  ctx.transform(1, 0, (-view.skew * 0.85) / view.slope, 1 / view.slope, 0, 0);
  label(ctx, value, 0, 0, size, ink, options);
  ctx.restore();
}

function drawRow(ctx, view, amount, ink) {
  bitStamp(ctx, 73, 48, 10.5, ink, amount);
  pixelName(ctx, 355, 57, ink, amount);
  ctx.save();
  ctx.globalAlpha *= ramp(amount, 0.35, 0.86);
  surfaceLabel(ctx, view, 'Operation ID', 63, 262, 37, ink);
  surfaceLabel(ctx, view, 'Account', 357, 262, 37, ink);
  surfaceLabel(ctx, view, row.scope, 899, 158, 56, ink, { family: 'Mono' });
  surfaceLabel(ctx, view, 'Scope', 900, 262, 37, ink);
  ctx.restore();
}

function plane(ctx, y, { skew, slope, backX }) {
  ctx.transform(1, 0, skew, slope, backX, y);
}

function facets(ctx, { slope, frontX, backX }, y, width, thickness, side, face) {
  const fy = y + depth * slope;
  poly(
    ctx,
    [
      [backX + width, y],
      [backX + width, y + thickness],
      [frontX + width, fy + thickness],
      [frontX + width, fy],
    ],
    side,
  );
  ctx.fillStyle = face;
  ctx.fillRect(frontX, fy - 0.4, width, thickness + 0.4);
}

function base(ctx, y, state) {
  const { slope, frontX, backX } = state.view;
  const fy = y + depth * slope;
  if (state.review > 0) {
    // The separate approval table was committed before the executor began.
    // Pull the cutaway forward so the older decision can be inspected.
    ctx.save();
    const travel = state.review;
    ctx.translate(-31 * travel, -30 + 88 * travel);
    facets(
      ctx,
      state.view,
      y + 82,
      wide,
      67,
      '#998ca5',
      linear(ctx, 0, fy + 82, 0, fy + 149, [
        [0, '#f3e8fa'],
        [1, '#d2c4dd'],
      ]),
    );
    ctx.globalAlpha *= ramp(travel, 0.68, 0.96);
    label(ctx, 'Saved approval', frontX + 45, fy + 130, 40, '#44384f', { weight: 600 });
    label(ctx, 'manager-1', frontX + wide - 64, fy + 130, 39, '#43354f', {
      family: 'Mono',
      align: 'right',
    });
    const x = frontX + wide - 334;
    ctx.strokeStyle = '#634579';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, fy + 114);
    ctx.lineTo(x + 9, fy + 125);
    ctx.lineTo(x + 33, fy + 99);
    ctx.stroke();
    ctx.restore();
  }
  facets(ctx, state.view, y + 45, wide, 78, '#34314d', '#272537');
  for (let i = 0; i < 4; i++) {
    line(ctx, frontX, fy + 99 + i * 5, frontX + wide, fy + 99 + i * 5, '#5f5b72', 1.6);
    line(ctx, frontX + wide, fy + 99 + i * 5, backX + wide, y + 99 + i * 5, '#76718b', 1.4);
  }
  facets(
    ctx,
    state.view,
    y,
    wide,
    94,
    linear(ctx, 1540, fy, 1710, y, [
      [0, '#524483'],
      [1, '#8174ac'],
    ]),
    linear(ctx, 0, fy, 0, fy + 94, [
      [0, '#60548d'],
      [0.07, '#423663'],
      [1, '#322b4e'],
    ]),
  );
  ctx.save();
  plane(ctx, y, state.view);
  ctx.fillStyle = linear(ctx, 0, 0, wide, depth, [
    [0, '#24203d'],
    [0.5, '#3e3557'],
    [1, '#30283e'],
  ]);
  ctx.fillRect(0, 0, wide, depth);
  ctx.strokeStyle = '#9e95b9';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(2, 2, wide - 4, depth - 4);
  for (let x = 6; x < wide - 3; x += 14) {
    for (let v = 8; v < depth - 4; v += 14) {
      ctx.fillStyle = (Math.floor(x / 14) + Math.floor(v / 14)) % 5 === 0 ? '#635570' : '#52495f';
      ctx.fillRect(x, v, 1.8, 2.1);
    }
  }
  // The etched corners identify one record position even when its contents are empty.
  const reg = '#84778e';
  for (const [x, dir] of [
    [41, 1],
    [wide - 41, -1],
  ]) {
    for (const [v, down] of [
      [29, 1],
      [depth - 18, -1],
    ]) {
      line(ctx, x, v, x + dir * 18, v, reg, 2.6);
      line(ctx, x, v, x, v + down * 17, reg, 2.6);
    }
  }
  if (state.rows.includes(row.id)) drawRow(ctx, state.view, 1, '#ffdc9a');
  ctx.restore();
  label(ctx, 'Committed effects', frontX + 46, fy + 60, 45, '#faf5ff', { weight: 600 });
  const n = state.rows.length;
  label(
    ctx,
    n + (n === 1 ? ' row' : ' rows'),
    frontX + wide - 45,
    fy + 62,
    51,
    n ? '#ffe0a1' : '#ddd3e9',
    { align: 'right', family: 'Mono' },
  );
}

function pending(ctx, y, amount, alpha, pressed) {
  const { slope, frontX } = raisedView;
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const fy = y + depth * slope;
  const lip = 54 * (1 - pressed);
  facets(
    ctx,
    raisedView,
    y,
    wide,
    lip,
    '#a44c26',
    linear(ctx, frontX, fy, frontX + wide, fy + 54, [
      [0, '#f7c486'],
      [0.4, '#edac6f'],
      [1, '#c98a63'],
    ]),
  );
  ctx.save();
  plane(ctx, y, raisedView);
  ctx.fillStyle = linear(ctx, 0, 0, wide, depth, [
    [0, '#fff0c9'],
    [0.46, '#ffdfad'],
    [0.8, '#efbe98'],
    [1, '#efc69f'],
  ]);
  ctx.fillRect(0, 0, wide, depth);
  ctx.strokeStyle = '#fff7dd';
  ctx.lineWidth = 3;
  ctx.strokeRect(1, 1, wide - 2, depth - 2);
  for (let v = 8; v < depth - 6; v += 7) {
    line(ctx, 3, v, wide - 3, v, v % 3 === 0 ? 'rgba(157,83,61,.07)' : 'rgba(189,126,80,.06)', 1);
  }
  drawRow(ctx, raisedView, amount, '#703729');
  ctx.restore();
  ctx.globalAlpha *= 1 - ramp(pressed, 0, 0.6);
  label(ctx, 'Pending write', frontX + 46, fy + 40, 39, '#522f2c', { weight: 600 });
  line(ctx, frontX, fy + lip, frontX + wide, fy + lip, '#985f49', 2);
  ctx.restore();
}

function lookup(ctx, y, amount, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.save();
  plane(ctx, y, raisedView);
  // The small lookup mask carries only the ID. It can fit over the saved pattern.
  const x = 42,
    v = 17,
    w = 243,
    h = 255;
  ctx.fillStyle = 'rgba(224,213,255,.93)';
  ctx.fillRect(x, v, w, h);
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#8270ad';
  ctx.strokeRect(x, v, w, h);
  bitStamp(ctx, 73, 48, 10.5, '#51366c', amount);
  surfaceLabel(ctx, raisedView, 'ID lookup', 69, 260, 38, '#533b6c');
  ctx.restore();
  ctx.restore();
}

function picture(clock) {
  const { index, elapsed, reveal } = clock;
  const after = (i, phrase, span) => (index > i ? 1 : index === i ? ease(reveal(phrase, span)) : 0);
  const insertion = index === 0 ? ramp(elapsed, -0.52, 1.2) : 1;
  const approach = after(0, 'Just before commit', 1.05);
  const rollback = after(0, 'the executor hits an error', 0.6);
  const withdraw = after(0, 'the executor hits an error', 1);
  const second = after(2, 'On retry', 0.34);
  const retryInsert = after(2, 'Then it inserts the row again', 1.05);
  const pressed = after(3, 'Follow the row down', 1.64);
  const lower = after(3, 'This time', 1.3);
  const third = after(4, 'Here comes', 0.3);
  const match = after(4, 'Watch the squares line up', 1.35);
  const clear = after(4, 'finds that ID', 0.64);
  const review = after(1, 'The effects table is empty', 1.15) * (1 - after(2, 'the deadline', 1));
  const tilt = after(5, 'Here', 2.25);
  const view = projection(tilt);
  const attempt = attempts[third > 0 ? 2 : second > 0 ? 1 : 0];
  const rows = pressed === 1 ? attempt.rows : attempts[0].rows;
  return {
    attempt,
    rows,
    view,
    review,
    pressed,
    tableY: baseY - 160 * tilt,
    amount: (1 - rollback) * insertion + retryInsert,
    pendingY: mix(openY + 88 * approach * (1 - withdraw), baseY, pressed),
    opacity: 1 - lower * pressed,
    // Ease into a close view of the table after the pending layer clears it.
    lift: 94 * lower,
    zoom: 1 + 0.085 * lower,
    lookupY: mix(openY + 95, baseY - 2, match),
    lookupOpacity: third * (1 - clear),
    matched: clear,
  };
}

function draw(ctx, clock) {
  const s = picture(clock);
  drawRoom(ctx);
  drawHeader(ctx, s.attempt);
  ctx.save();
  ctx.translate(960, 620 - s.lift);
  ctx.scale(s.zoom, s.zoom);
  ctx.translate(-960, -620);
  base(ctx, s.tableY, s);
  pending(ctx, s.pendingY, s.amount, s.opacity, s.pressed);
  lookup(ctx, s.lookupY, 1, s.lookupOpacity);
  if (s.matched > 0) {
    ctx.save();
    ctx.globalAlpha *= s.matched;
    plane(ctx, s.tableY, s.view);
    ctx.lineWidth = 3.8;
    ctx.strokeStyle = '#ffd693';
    ctx.strokeRect(43, 17, 242, 255);
    ctx.restore();
  }
  ctx.restore();
}

export default { title: 'Three attempts to restore one key', beats, draw, check };
