import assert from 'node:assert/strict';
import { dot, rotatePair } from '../../../films/rope/arithmetic.mjs';

// One projected coordinate pair from the original film's cache exercise.
const unit = [1, 0];
const frequency = 0.4;
const keyPosition = 18;
const queryPosition = 21;
const keyTurn = keyPosition * frequency;
const queryTurn = queryPosition * frequency;
const stored = rotatePair(unit, keyTurn);
const query = rotatePair(unit, queryTurn);
const reference = dot(query, stored);

const beats = [
  {
    id: 'move-the-pair',
    say: 'Follow those two numbers. The key for token eighteen just moved from slot two to slot zero. When attention reads it here, does it need another turn?',
    hold: 1.6,
  },
  {
    id: 'before-storage',
    say: 'Let’s see where those numbers came from. Pick one pair of coordinates in an attention head. In this example the key and the query both start at one, zero. Both point to the right.',
    hold: 0.7,
  },
  {
    id: 'write-the-key',
    say: 'Rotary position embedding gives each pair a rate of turn. This pair turns four tenths of a radian per position. Take the key through eighteen steps. The tip lands here. Its horizontal and vertical coordinates are the two numbers in the cache.',
    hold: 0.9,
  },
  {
    id: 'full-pass',
    say: 'Turn the query through twenty-one steps at the same rate. See the three steps between the tips? Together they span one point two radians. For two unit vectors, the cosine of that angle is their dot product. The full pass gives us about point three six two.',
    hold: 1.2,
  },
  {
    id: 'one-turn-too-many',
    say: 'Try an extra turn on a copy from slot zero. Give it the turn for position eighteen again. Look how close the key lands to the query. Their dot product jumps to almost one.',
    hold: 1.4,
  },
  {
    id: 'read-the-stored-pair',
    say: 'Read the stored pair straight from slot zero. There’s the three-step gap again, and the dot product matches the full pass. The key carried its position with it when those two numbers moved.',
    hold: 2.6,
  },
];

const tau = Math.PI * 2;
const paper = '#f4eff5';
const ink = '#251d42';
const blue = '#3647b8';
const orange = '#bb3e21';
const tile = '#ffd0aa';
const slotX = [380, 960, 1540];
const clamp = (n) => Math.max(0, Math.min(1, n));
const mix = (a, b, t) => a + (b - a) * t;
const ease = (n) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};

function label(c, value, x, y, size, color = ink, family = 'Sans', align = 'left', weight = 400) {
  c.fillStyle = color;
  c.font = `${weight} ${size}px "Lesson ${family}"`;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(value, x, y);
}

function polygon(c, points, fill) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}

function line(c, x, y, x2, y2, color, width = 2) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x2, y2);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}

function disk(c, x, y, radius, fill) {
  c.beginPath();
  c.arc(x, y, radius, 0, tau);
  c.fillStyle = fill;
  c.fill();
}

// The corner cut follows the key as it travels. Each recess has the same profile.
function profile(c, x, y, w, h, cut, color) {
  polygon(
    c,
    [
      [x + cut, y],
      [x + w, y],
      [x + w, y + h - cut],
      [x + w - cut, y + h],
      [x, y + h],
      [x, y + cut],
    ],
    color,
  );
}

function vector(c, x, y, angle, length, color, thickness = 1) {
  c.save();
  c.translate(x, y);
  c.rotate(-angle);
  const t = thickness;
  polygon(
    c,
    [
      [0, -4 * t],
      [length - 36 * t, -5 * t],
      [length - 44 * t, -15 * t],
      [length, 0],
      [length - 44 * t, 15 * t],
      [length - 36 * t, 5 * t],
      [0, 4 * t],
    ],
    color,
  );
  c.restore();
}

function keyWord(c, x, y) {
  const w = 454,
    h = 162;
  profile(c, x - w / 2, y - h / 2 + 12, w, h, 21, '#9c3f38');
  profile(c, x - w / 2, y - h / 2, w, h, 21, tile);
  line(c, x - 92, y - 61, x - 92, y + 61, '#ba846b');
  const gx = x - 159;
  line(c, gx - 48, y, gx + 49, y, '#c4896c');
  line(c, gx, y + 49, gx, y - 49, '#c4896c');
  vector(c, gx, y, Math.atan2(stored[1], stored[0]), 59, orange, 0.65);
  disk(c, gx, y, 4.5, orange);
  label(c, 'Key · position 18', x - 72, y - 51, 35, ink, 'Sans', 'left', 600);
  for (const [i, axis] of ['x', 'y'].entries()) {
    const row = y + 1 + 48 * i;
    label(c, axis, x - 67, row, 33, '#804c42', 'Mono');
    label(c, stored[i].toFixed(3), x - 11, row, 46, ink, 'Mono');
  }
}

function memory(c, travel, wide) {
  const scale = mix(1.4, 0.84, wide);
  const x = mix(slotX[2], slotX[0], travel);
  const framing = mix(1390, 575, travel) - (x - 960) * scale;
  // In the close shot the foreground lip fills the lower third. The pullback
  // keeps the cache in view while opening space to inspect a coordinate pair.
  label(c, 'Key cache', mix(105, 238, wide), mix(220, 652, wide), mix(89, 44, wide), ink, 'Serif');
  c.save();
  c.translate(mix(framing, 960, wide), mix(583, 819, wide));
  c.scale(scale, scale);
  c.translate(-960, 0);
  const face = c.createLinearGradient(0, -151, 0, 186);
  face.addColorStop(0, '#c1ade7');
  face.addColorStop(0.62, '#ad97d4');
  face.addColorStop(1, '#9682be');
  const outer = [
    [54, -151],
    [1810, -151],
    [1888, -94],
    [1888, 146],
    [1842, 177],
    [107, 177],
    [32, 120],
    [32, -132],
  ];
  polygon(
    c,
    outer.map(([x, y]) => [x + 10, y + 34]),
    'rgba(53,31,77,0.10)',
  );
  polygon(
    c,
    outer.map(([x, y]) => [x, y + 19]),
    '#64527f',
  );
  polygon(c, outer, face);
  line(c, 111, 175, 1842, 175, '#d9c6e7', 3);
  for (const [i, x] of slotX.entries()) {
    profile(c, x - 239, -99, 478, 188, 24, '#decee9');
    profile(c, x - 239, -103, 478, 188, 24, '#493958');
    profile(c, x - 233, -93, 466, 176, 21, '#756285');
    // Perforations show the exposed floor of an empty cell.
    c.fillStyle = '#63516f';
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 16; col++) c.fillRect(x - 199 + 26 * col, -60 + 34 * row, 6, 5);
    }
    label(c, 'slot ' + i, x, 124, 43, '#352b4e', 'Mono', 'center');
  }
  const lift = Math.sin(travel * Math.PI);
  const y = -12 - 128 * lift;
  profile(c, x - 222 + 17 * lift, -86, 449, 163, 21, `rgba(38,20,47,${0.22 - 0.09 * lift})`);
  keyWord(c, x, y);
  c.restore();
}

const centerX = 541,
  centerY = 335,
  radius = 282;
function coordinatePaper(c) {
  // A printed square spans both units of the coordinate plane.
  const h = radius;
  for (let i = -4; i <= 4; i++) {
    const d = (h * i) / 4;
    const color = i === 0 ? '#b5a3bb' : '#e3d7e5';
    line(c, centerX + d, centerY - h, centerX + d, centerY + h, color);
    line(c, centerX - h, centerY + d, centerX + h, centerY + d, color);
  }
}

function wedge(c, kAngle, qAngle) {
  const gap = Math.atan2(Math.sin(qAngle - kAngle), Math.cos(qAngle - kAngle));
  if (Math.abs(gap) < 0.01) return;
  const r = radius * 0.83;
  c.save();
  c.translate(centerX, centerY);
  c.beginPath();
  c.moveTo(0, 0);
  c.arc(0, 0, r, -kAngle, -(kAngle + gap), gap > 0);
  c.closePath();
  c.fillStyle = '#f8c6b3';
  c.fill();
  c.beginPath();
  c.arc(0, 0, r, -kAngle, -(kAngle + gap), gap > 0);
  c.strokeStyle = '#ce7968';
  c.lineWidth = 4;
  c.stroke();
  // Split the sweep at whole position steps. The arc length of each full
  // segment is r * frequency, independent of its starting angle.
  for (let step = 0; step < Math.abs(gap) - 0.001; step += frequency) {
    const end = Math.min(step + frequency, Math.abs(gap));
    const sign = Math.sign(gap);
    c.beginPath();
    c.arc(0, 0, r, -kAngle - sign * (step + 0.012), -kAngle - sign * (end - 0.012), gap > 0);
    c.strokeStyle = '#bb624f';
    c.lineWidth = 12;
    if (end - step > 0.024) c.stroke();
    if (step > 0) {
      const a = kAngle + sign * step;
      line(c, 0, 0, r * Math.cos(a), -r * Math.sin(a), '#fff5ea', 3);
    }
  }
  c.restore();
}

function tipLabel(c, text, angle, color, side) {
  const x = centerX + radius * Math.cos(angle),
    y = centerY - radius * Math.sin(angle);
  label(c, text, x + 14 * side, y - 19, 36, color, 'Sans', side === 1 ? 'left' : 'right', 600);
}

function angles(clock) {
  const { index, reveal } = clock;
  if (index < 2) return [0, 0];
  if (index === 2) return [keyTurn * ease(reveal('Take the key', 3.0)), 0];
  if (index === 3) return [keyTurn, queryTurn * ease(reveal('Turn the query', 3.0))];
  if (index === 4) return [keyTurn * (1 + ease(reveal('Give it the turn', 2.6))), queryTurn];
  // Reading the stored pair replaces the trial value. No inverse RoPE is performed.
  return [keyTurn, queryTurn];
}

function modelView(c, clock) {
  const { index, reveal } = clock;
  const [ka, qa] = angles(clock);
  const read = index === 5 ? ease(reveal('Read the stored pair', 1.6)) : 1;
  coordinatePaper(c);
  const compared =
    (index > 3 && read === 1) || (index === 3 && reveal('Turn the query', 3.0) === 1);
  if (compared) wedge(c, ka, qa);

  // A fine print of the full-pass key stays underneath the trial key.
  if (index === 4) {
    c.save();
    c.setLineDash([8, 9]);
    line(
      c,
      centerX,
      centerY,
      centerX + radius * stored[0],
      centerY - radius * stored[1],
      '#bd8875',
      4,
    );
    c.restore();
  }
  vector(c, centerX, centerY, qa, radius, blue, 1.35);
  // The read lifts an exact copy out of the left slot. Its angle is constant.
  const fromX = 960 + 0.84 * (slotX[0] - 159 - 960);
  const fromY = 819 - 0.84 * 12;
  vector(
    c,
    mix(fromX, centerX, read),
    mix(fromY, centerY, read),
    ka,
    mix(0.84 * 59, radius, read),
    orange,
    Math.abs(qa - ka) < 0.005 ? 0.6 : 1,
  );
  disk(c, centerX, centerY, 7.5, ink);
  if (index === 2 && reveal('Take the key', 3.0) === 1) tipLabel(c, 'Key', ka, orange, 1);
  if (compared) {
    tipLabel(c, 'Query · 21', qa, blue, -1);
    if (index !== 4 || reveal('Give it the turn', 2.6) === 1)
      tipLabel(c, 'Key · 18', ka, orange, 1);
  }

  const x = 1030;
  if (index === 1) {
    label(c, 'Before RoPE', x, 205, 63, ink, 'Serif');
    label(c, 'Query', x, 326, 45, blue, 'Sans', 'left', 600);
    label(c, '=  [1, 0]', x + 180, 326, 48, ink, 'Mono');
    label(c, 'Key', x, 419, 45, orange, 'Sans', 'left', 600);
    label(c, '=  [1, 0]', x + 180, 419, 48, ink, 'Mono');
  } else if (index === 2) {
    label(c, 'Key at position 18', x, 186, 61, ink, 'Serif');
    label(c, '0.4 rad / position', x, 279, 41, '#635271', 'Mono');
    const pair = rotatePair(unit, ka);
    label(c, 'x', x, 374, 35, orange, 'Mono');
    label(c, 'y', x + 305, 374, 35, orange, 'Mono');
    pair.forEach((n, i) =>
      label(c, n.toFixed(3).replace('-', '−'), x + i * 305, 442, 68, ink, 'Mono'),
    );
  } else {
    const comparingTrial = index === 4 && reveal('Give it the turn', 2.6) > 0;
    const title =
      index === 3 ? 'Full pass' : comparingTrial ? 'Extra turn on read' : 'Read from slot 0';
    label(c, title, x, 187, 63, ink, 'Serif');
    label(c, 'Pair dot product', x, 284, 38, '#615368');
    const score = dot(rotatePair(unit, qa), rotatePair(unit, ka));
    const show = read === 1 && (index !== 3 || compared);
    if (show) {
      label(
        c,
        score.toFixed(3).replace('-', '−'),
        x - 6,
        392,
        116,
        comparingTrial ? '#a64330' : ink,
        'Mono',
      );
      if (index > 3) label(c, 'Full pass   ' + reference.toFixed(3), x, 501, 42, '#64566c', 'Mono');
      else label(c, 'cos(3 × 0.4 rad)', x, 501, 42, '#64566c', 'Mono');
    }
  }
}

function draw(c, clock) {
  const backdrop = c.createLinearGradient(0, 0, 1920, 1080);
  backdrop.addColorStop(0, '#fff8ee');
  backdrop.addColorStop(0.58, paper);
  backdrop.addColorStop(1, '#e1d6ed');
  c.fillStyle = backdrop;
  c.fillRect(0, 0, 1920, 1080);
  const travel = clock.index === 0 ? ease(clock.elapsed / 2.3) : 1;
  const wide = clock.index === 0 ? 0 : clock.index === 1 ? ease(clock.elapsed / 1.3) : 1;
  memory(c, travel, wide);
  if (clock.index > 0 && wide > 0) {
    c.save();
    c.globalAlpha = wide;
    c.translate(0, (1 - wide) * -40);
    modelView(c, clock);
    c.restore();
  }
}

function check() {
  const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `Expected ${a} to equal ${b}`);
  const slots = [null, null, [...stored]];
  slots[0] = slots[2].slice();
  slots[2] = null;
  assert.equal(slots[2], null);
  assert.deepEqual(
    slots[0].map((x) => x.toFixed(3)),
    ['0.608', '0.794'],
  );
  near(Math.hypot(...slots[0]), 1);
  near(Math.hypot(...query), 1);
  near(reference, Math.cos((queryPosition - keyPosition) * frequency));
  near(dot(query, slots[0]), reference);
  assert.equal(reference.toFixed(3), '0.362');
  assert.equal(dot(query, rotatePair(slots[0], keyTurn)).toFixed(3), '0.960');
}

export default { title: 'Does a cached key need another turn?', beats, draw, check };
