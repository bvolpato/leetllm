import assert from 'node:assert/strict';

// From make_tape(14) and train() in the article's reward_shaping_study.py,
// with NumPy 2.2.6. Trip and move numbers on the strips start at one.
const tape = [
  [
    0.6239477334128671, 0.01081444973594159, 0.9082906574805232, 0.8690208527434555,
    0.18525219872790888, 0.24860051767216307, 0.3122583028600062, 0.8126413541148547,
    0.3735792108595949, 0.5530355703676127, 0.01626785443876666, 0.878558728280295,
  ],
  [
    0.693614460821732, 0.06595301522970409, 0.7651927071674294, 0.2593961964496204,
    0.7712413615616261, 0.8123812445323089, 0.12049308205955922, 0.11931416176325138,
    0.6400444306785437, 0.5336755862167378, 0.8547405828864857, 0.8336135920385995,
  ],
];
const numbers = tape.flat();
const movesPerTrip = tape[0].length;
const goal = 6;
const slipThreshold = 0.15;
const arms = [
  {
    name: 'Goal only',
    ink: '#50358b',
    enamel: '#8163bd',
    glint: '#d4c4f3',
    actions: [1, -1, -1, -1, -1, 1, -1, -1, 1, 1, 1, 1],
    nextChoice: -1,
  },
  {
    name: 'Shaped reward',
    ink: '#ac3e1c',
    enamel: '#ed7539',
    glint: '#ffd49c',
    actions: [1, 1, 1, 1, 1, 1, -1, 1, 1, 1],
    nextChoice: 1,
  },
];

function step(position, choice, draw) {
  const travel = draw < slipThreshold ? -choice : choice;
  return Math.max(0, Math.min(goal, position + travel));
}

function tripPositions(arm) {
  const positions = [0];
  for (const [i, choice] of arm.actions.entries()) {
    positions.push(step(positions.at(-1), choice, tape[0][i]));
  }
  return positions;
}
const paths = arms.map(tripPositions);
const nextUnread = arms.map((arm) => arm.actions.length);
const firstOfNextTrip = movesPerTrip;

const beats = [
  {
    id: 'the-flag',
    say: 'Orange reaches the flag on move ten. It gets extra feedback from changes in its distance to the goal. Purple learns from the goal reward alone. Watch it use the last two moves.',
    hold: 1.0,
  },
  {
    id: 'the-spool',
    say: 'Both mice in this simulation get a copy of the same slip tape. Here’s the number they both used on move ten. Any draw below point one five reverses the chosen direction.',
    hold: 0.65,
  },
  {
    id: 'the-leftover',
    say: 'Back to zero for trip three. Which number comes next? Advance each tape to its next unused number. Orange stops here. Purple used two more. Watch its tape cross the fold.',
    hold: 0.95,
  },
  {
    id: 'at-the-wall',
    say: 'Orange chooses right. Try the number under its pointer. Watch the wheel turn back against the wall. Point zero one six sent orange left. Its first move took it nowhere.',
    hold: 1.05,
  },
  {
    id: 'the-fold',
    say: 'The study gives each trip its own row of twelve numbers. Follow the fold at the start of trip three. Orange skips the two numbers it left behind. Where will its first move take it now?',
    hold: 1.25,
  },
  {
    id: 'same-draw',
    say: 'Try that move again. Both pointers read point six nine four, above the slip threshold. Purple chose left at the wall. Orange chose right and rolled forward. You can replay those different moves with exactly the same slip draw.',
    hold: 2.8,
  },
];

const W = 1920;
const H = 1080;
const ink = '#32293e';
const faint = '#67596d';
const clamp = (u) => Math.max(0, Math.min(1, u));
const ease = (u) => {
  u = clamp(u);
  return u * u * (3 - 2 * u);
};
const mix = (a, b, t) => a + (b - a) * t;
const tau = Math.PI * 2;

function label(c, words, x, y, size, color = ink, family = 'Sans', weight = 500, align = 'left') {
  c.fillStyle = color;
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(words, x, y);
}

function polygon(c, points, fill) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}

function oval(c, x, y, rx, ry, fill, angle = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, angle, 0, tau);
  c.fillStyle = fill;
  c.fill();
}

function line(c, x1, y1, x2, y2, color, width) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
}

function studio(c) {
  const daylight = c.createLinearGradient(300, 40, 1490, H);
  daylight.addColorStop(0, '#f7ede4');
  daylight.addColorStop(0.48, '#eee4e9');
  daylight.addColorStop(1, '#d1c4da');
  c.fillStyle = daylight;
  c.fillRect(0, 0, W, H);
  for (let i = 0; i < 3; i++) {
    const x = 1300 + i * 260;
    polygon(
      c,
      [
        [x, 0],
        [x + 116, 0],
        [x - 560, H],
        [x - 710, H],
      ],
      '#fff9ea31',
    );
  }
}

// The profile stays recognizable in either direction. A turning key and eccentric
// wheels make a blocked move visible even when the mouse cannot change square.
function mouse(c, x, y, scale, facing, spin, lift, arm, curled = 0) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  oval(c, 0, 3, 91 - 0.35 * lift, 10, '#3b294b21');
  c.translate(0, -lift);
  c.scale(facing, 1);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-50, -39);
  c.bezierCurveTo(
    mix(-99, -87, curled),
    -18,
    mix(-123, -90, curled),
    -66 - 5 * Math.sin(spin),
    mix(-149, -81, curled),
    mix(-39, -75, curled),
  );
  c.bezierCurveTo(
    mix(-159, -68, curled),
    mix(-30, -95, curled),
    mix(-173, -56, curled),
    mix(-37, -77, curled),
    mix(-170, -65, curled),
    mix(-45, -75, curled),
  );
  c.strokeStyle = arm.ink;
  c.lineWidth = 5;
  c.stroke();

  const keyWidth = 8 + 12 * (0.5 + 0.5 * Math.cos(spin));
  line(c, -23, -73, -34, -117, '#645661', 7);
  c.save();
  c.translate(-34, -114);
  c.rotate(-0.22);
  for (const sign of [-1, 1]) {
    const keyX = sign * keyWidth;
    oval(c, keyX, 0, keyWidth + 1, 13, '#736373');
    oval(c, keyX, -1, keyWidth * 0.56, 7, '#e8dce1');
  }
  c.restore();

  for (const wx of [-45, 42]) {
    oval(c, wx, -14, 20, 20, '#443849');
    oval(c, wx, -14, 13, 13, '#f1e3cb');
    line(
      c,
      wx - 9 * Math.cos(spin),
      -14 - 9 * Math.sin(spin),
      wx + 9 * Math.cos(spin),
      -14 + 9 * Math.sin(spin),
      '#806e79',
      3,
    );
  }

  const paint = c.createLinearGradient(0, -97, 20, -17);
  paint.addColorStop(0, arm.glint);
  paint.addColorStop(0.4, arm.enamel);
  paint.addColorStop(1, arm.ink);
  c.beginPath();
  c.moveTo(-76, -36);
  c.bezierCurveTo(-81, -83, -46, -104, -9, -94);
  c.bezierCurveTo(28, -93, 55, -71, 96, -44);
  c.bezierCurveTo(87, -25, 22, -18, -45, -21);
  c.quadraticCurveTo(-71, -22, -76, -36);
  c.fillStyle = paint;
  c.fill();
  c.lineWidth = 2.4;
  c.strokeStyle = arm.ink;
  c.stroke();
  c.beginPath();
  c.moveTo(-66, -42);
  c.bezierCurveTo(-23, -28, 31, -29, 74, -43);
  c.strokeStyle = arm.glint;
  c.lineWidth = 5;
  c.stroke();
  oval(c, 15, -86, 18, 25, arm.ink, -0.42);
  oval(c, 16, -86, 12, 18, arm.glint, -0.42);
  oval(c, 56, -59, 5, 5, '#2e2331');
  oval(c, 94, -43, 6, 5, '#302536');
  for (let i = -1; i <= 1; i++) line(c, 77, -42, 107, -42 + i * 8, '#6b4d58', 1.8);
  c.restore();
}

// The two lanes share a cutaway view, so the numbers stay attached to the wood.
function board(c, y, start, spacing, last, cropped = false) {
  const left = start - spacing * 0.5;
  const right = start + (last + 0.5) * spacing;
  const front = y + 9;
  const top = y - 40;
  c.save();
  c.shadowColor = '#66516b49';
  c.shadowBlur = 22;
  c.shadowOffsetY = 22;
  polygon(
    c,
    [
      [left, front],
      [right, front],
      [right, front + 44],
      [left, front + 44],
    ],
    '#bea18f',
  );
  c.restore();
  const wood = c.createLinearGradient(0, top, 0, front);
  wood.addColorStop(0, '#ebc7a5');
  wood.addColorStop(1, '#fae3c8');
  polygon(
    c,
    [
      [left, front],
      [left + 20, top],
      [right + 20, top],
      [right, front],
    ],
    wood,
  );
  line(c, left, front, right, front, '#f8e9da', 4);
  for (let i = 0; i <= last; i++) {
    const cx = start + i * spacing;
    if (i > 0) {
      const edge = cx - spacing * 0.5;
      line(c, edge, front, edge + 20, top, '#c9aa92', 2);
      line(c, edge, front + 2, edge, front + 41, '#aa8e83', 1.5);
    }
    label(c, String(i), cx, front + 24, 32, '#513941', 'Mono', 600, 'center');
  }
  if (cropped) {
    polygon(
      c,
      [
        [left - 9, top - 56],
        [left + 9, top - 73],
        [left + 9, top + 10],
        [left - 9, front + 5],
      ],
      '#bc9a85',
    );
    polygon(
      c,
      [
        [left - 21, top - 59],
        [left - 9, top - 56],
        [left - 9, front + 5],
        [left - 21, front + 3],
      ],
      '#926f65',
    );
  }
}

function flag(c, x, y, landed, arm) {
  line(c, x, y - 30, x, y - 154, '#5e4952', 5);
  oval(c, x, y - 158, 6, 6, '#5e4952');
  const tipY = -134 + 9 * landed;
  polygon(
    c,
    [
      [x, -153 + y],
      [x + 69, y + tipY],
      [x, y - 99],
    ],
    arm.ink,
  );
  polygon(
    c,
    [
      [x + 4, -147 + y],
      [x + 29, y - 139],
      [x + 4, y - 123],
    ],
    arm.glint,
  );
}

function opening(c, clock) {
  const first = ease((clock.elapsed + 0.07) / 1.15);
  const extra = clock.reveal('Watch it use', 2.1) * 2;
  label(c, 'Trip 2', 92, 104, 87, ink, 'Serif');
  label(c, 'Seed 14', 1824, 105, 43, faint, 'Mono', 500, 'right');
  for (const [i, arm] of arms.entries()) {
    const floor = 403 + 328 * i;
    const x0 = 248,
      pitch = 220;
    let t = 9 + first;
    if (i === 0) t += extra;
    const move = Math.min(arm.actions.length, Math.floor(t));
    const fraction = ease(t - move);
    const from = paths[i][move];
    const to = paths[i][Math.min(move + 1, arm.actions.length)];
    const x = x0 + pitch * mix(from, to, fraction);
    board(c, floor, x0, pitch, goal);
    label(c, arm.name, 96, floor - 170, 42, arm.ink, 'Sans', 600);
    label(c, 'Move ' + Math.ceil(t) + ' / 12', 1810, floor - 205, 42, faint, 'Mono', 500, 'right');
    flag(c, x0 + goal * pitch + 90, floor, +(from === goal), arm);
    mouse(c, x, floor, 1.13, 1, x / 52, Math.sin(fraction * Math.PI) * 12, arm);
  }
}

const readX = 1370;
const cellWidth = 310;
function tapeStrip(c, y, cursor, arm) {
  const left = 820;
  c.save();
  c.beginPath();
  c.rect(left, y - 137, W - left, 301);
  c.clip();
  // The loop of fanfold paper throws one continuous shadow across the worktop.
  c.shadowColor = '#49395244';
  c.shadowBlur = 13;
  c.shadowOffsetY = 12;
  c.fillStyle = '#cfbdac';
  c.fillRect(left + 7, y - 111, W - left, 228);
  c.shadowBlur = 0;
  c.shadowOffsetY = 0;
  c.shadowColor = 'transparent';
  for (
    let idx = Math.max(0, Math.floor(cursor) - 3);
    idx < Math.min(numbers.length, Math.ceil(cursor) + 4);
    idx++
  ) {
    const mid = readX + (idx - cursor) * cellWidth;
    const x = mid - cellWidth / 2;
    const row = Math.floor(idx / movesPerTrip);
    const slot = idx % movesPerTrip;
    c.fillStyle = row ? '#f5d68b' : '#f9eff9';
    c.fillRect(x - 0.6, y - 112, cellWidth + 1.2, 222);
    line(c, x, y - 83, x, y + 78, '#b9a88d', 1.4);
    if (slot === 0) {
      const fold = c.createLinearGradient(x - 3, y, x + 35, y);
      fold.addColorStop(0, '#7f5b5090');
      fold.addColorStop(0.22, '#fff8df');
      fold.addColorStop(1, '#f5d68b00');
      c.fillStyle = fold;
      c.fillRect(x - 3, y - 112, 38, 222);
      c.setLineDash([7, 6]);
      line(c, x + 1, y - 111, x + 1, y + 110, '#806451', 3);
      c.setLineDash([]);
    }
    for (let h = 0; h < 4; h++) {
      const hx = x + ((h + 0.5) * cellWidth) / 4;
      for (const hy of [y - 92, y + 90]) {
        oval(c, hx, hy, 8, 7, '#988785');
        oval(c, hx, hy + 1.5, 7.8, 5.8, '#d6c8d4');
      }
    }
    const focus = ease(1 - clamp(Math.abs(idx - cursor)));
    c.save();
    c.globalAlpha *= 0.48 + 0.52 * focus;
    label(
      c,
      numbers[idx].toFixed(3),
      mid,
      y - 16 - 24 * focus,
      42 + 31 * focus,
      ink,
      'Mono',
      600,
      'center',
    );
    if (focus > 0) {
      c.globalAlpha *= focus;
      label(c, 'Trip ' + (row + 2), mid, y + 15, 41, ink, 'Sans', 600, 'center');
      label(c, 'Move ' + (slot + 1), mid, y + 60, 37, ink, 'Mono', 500, 'center');
    } else {
      label(c, String(slot + 1), mid, y + 44, 32, faint, 'Mono', 500, 'center');
    }
    c.restore();
  }
  const fade = c.createLinearGradient(left, 0, left + 100, 0);
  fade.addColorStop(0, '#6956704a');
  fade.addColorStop(1, '#69567000');
  c.fillStyle = fade;
  c.fillRect(left, y - 112, 100, 222);
  c.restore();

  const bracket = cellWidth / 2 - 4;
  for (const s of [-1, 1]) {
    const bx = readX + s * bracket;
    line(c, bx, y - 117, bx, y - 67, arm.ink, 6);
    line(c, bx, y - 117, bx - s * 30, y - 117, arm.ink, 6);
    line(c, bx, y + 114, bx, y + 74, arm.ink, 6);
    line(c, bx, y + 114, bx - s * 30, y + 114, arm.ink, 6);
  }
  polygon(
    c,
    [
      [readX - 19, y - 137],
      [readX + 19, y - 137],
      [readX, y - 113],
    ],
    arm.ink,
  );
}

function actionArrow(c, x, y, direction, arm, opacity) {
  if (opacity <= 0) return;
  c.save();
  c.globalAlpha *= opacity;
  c.translate(x, y);
  c.scale(direction, 1);
  polygon(
    c,
    [
      [-47, -6],
      [14, -6],
      [14, -20],
      [50, 0],
      [14, 20],
      [14, 6],
      [-47, 6],
    ],
    arm.ink,
  );
  c.restore();
}

function replay(c, clock) {
  const { index, reveal } = clock;
  const repairing = index >= 4;
  const feed = index === 4 ? ease(reveal('Follow the fold', 1.9)) : Number(index > 4);
  const choose = index === 3 ? reveal('Orange chooses right', 0.36) : 0;
  const bump = index === 3 ? ease(reveal('Try the number', 1.6)) : 0;
  const retry = index === 5 ? ease(reveal('Try that move again', 1.5)) : 0;
  const openTape = index === 1 ? ease((clock.elapsed + 0.03) / 1.25) : 1;
  const lastShared = Math.min(...nextUnread) - 1;
  const firstAdvance = index === 2 ? ease(reveal('Advance each tape', 1.15)) : Number(index > 2);
  const lastAdvance = index === 2 ? ease(reveal('Purple used two more', 1.65)) : Number(index > 2);
  label(c, index === 1 ? 'The slip tapes' : 'Trip 3, move 1', 92, 104, 87, ink, 'Serif');
  label(c, 'Slip below ' + slipThreshold.toFixed(2), 1820, 105, 43, ink, 'Mono', 500, 'right');

  for (const [i, arm] of arms.entries()) {
    const floor = 393 + i * 328;
    const y = floor - 46;
    const start = 235,
      pitch = 206;
    const action = i === 1 ? Math.max(bump, retry) : retry;
    const draw = numbers[repairing ? firstOfNextTrip : nextUnread[i]];
    const position = step(0, arm.nextChoice, draw) * action;
    const unread = lastShared + firstAdvance + (nextUnread[i] - lastShared - 1) * lastAdvance;
    const cursor = mix(unread, firstOfNextTrip, feed);
    label(c, arm.name, 96, floor - 166, 42, arm.ink, 'Sans', 600);
    c.save();
    c.beginPath();
    c.rect(55, floor - 151, 674, 245);
    c.clip();
    if (index > 1) board(c, floor, start, pitch, 3, true);
    const facing = arm.nextChoice;
    const recoil = position === 0 ? 19 * Math.sin(Math.PI * action) : 0;
    const rocking = Math.sin(action * Math.PI) * 7;
    const spin = index === 3 ? -14 * bump : retry * 9;
    if (index === 1) mouse(c, 365, floor, 1.18, 1, 0, 0, arm);
    else
      mouse(
        c,
        start + pitch * position - recoil,
        floor,
        1.08,
        facing,
        spin,
        rocking,
        arm,
        i * (1 - position),
      );
    c.restore();

    if (index === 3 && i === 1) {
      actionArrow(c, start + 160, floor - 72, 1, arm, choose * (1 - bump));
      actionArrow(c, start + 160, floor - 72, -1, arm, bump);
    }
    if (index === 5)
      actionArrow(c, start + pitch * position + 155, floor - 72, arm.nextChoice, arm, retry);
    c.save();
    c.translate((1 - openTape) * (W - 820), 0);
    tapeStrip(c, y, cursor, arm);
    c.restore();
  }
  let mode = 'Read the next unused number';
  if (index === 1) mode = 'Last draw both used on trip 2';
  if (repairing) mode = 'Read by trip and move';
  label(c, mode, readX, 867, 44, ink, 'Serif', 500, 'center');
  // The rest of the worktop is free for the runner's phrase captions.
}

function draw(c, clock) {
  c.save();
  studio(c);
  if (clock.index === 0) opening(c, clock);
  else replay(c, clock);
  c.restore();
}

function check() {
  assert.deepEqual(paths[0], [0, 1, 2, 1, 0, 0, 1, 0, 0, 1, 2, 1, 2]);
  assert.deepEqual(paths[1], [0, 1, 0, 1, 2, 3, 4, 3, 4, 5, 6]);
  assert.deepEqual(nextUnread, [12, 10]);
  assert.deepEqual(
    nextUnread.map((i) => numbers[i].toFixed(3)),
    ['0.694', '0.016'],
  );
  assert.equal(nextUnread[1] + 2, firstOfNextTrip);
  assert.deepEqual(
    arms.map((arm, i) => step(0, arm.nextChoice, numbers[nextUnread[i]])),
    [0, 0],
  );
  assert.deepEqual(
    arms.map((arm) => step(0, arm.nextChoice, numbers[firstOfNextTrip])),
    [0, 1],
  );
  assert.equal(new Set(beats.map((beat) => beat.id)).size, beats.length);
}

export default { title: 'Which draw starts the next trip?', beats, draw, check };
