import { cue } from './drawing.mjs';
import {
  rolls,
  pitches as pitchCount,
  rollInputs,
  rollTraces,
  flagged,
  fillerEnd,
} from './examples.mjs';

// Paper, windings and punches from the approved short. The full lesson adds a classifier.
const start = 349;
const measure = 448;
const paperHeight = 216;
const tops = [219, 647];
const edge = (count) => start + count * measure;
const center = (column) => edge(column + 0.5);
const laneY = (top, lane) => top + 38 + lane * 35;
const ink = '#182a56';
const red = '#952a29';
const ground = '#a6bbe8';

function line(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function text(
  ctx,
  value,
  x,
  y,
  size,
  color = ink,
  family = 'Lesson Sans',
  align = 'left',
  weight = 400,
) {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.font = `${weight} ${size}px "${family}"`;
  ctx.fillText(value, x, y);
}

function polygon(ctx, points, fill) {
  ctx.beginPath();
  for (const [i, [x, y]] of points.entries()) {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

// Fixed flecks give the work surface and the roll stock different grains.
let seed = 139;
function random() {
  seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
  return seed / 4294967296;
}
const fibers = Array.from({ length: 220 }, () => [random(), random(), random()]);

function workSurface(ctx) {
  const light = ctx.createLinearGradient(0, 30, 1800, 1090);
  light.addColorStop(0, '#c1cff0');
  light.addColorStop(0.57, ground);
  light.addColorStop(1, '#8da6d6');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 1920, 1080);
  for (const [u, v, d] of fibers) {
    line(ctx, u * 1920, v * 1080, u * 1920 + 3 + d * 14, v * 1080 - d, '#36406116', 1.3);
  }
}

function paper(ctx, left, right, top) {
  const bottom = top + paperHeight;
  ctx.save();
  ctx.shadowColor = '#27345657';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 12;
  const sheet = ctx.createLinearGradient(left, top, right, bottom + 240);
  sheet.addColorStop(0, '#eccc95');
  sheet.addColorStop(0.27, '#ffe4ad');
  sheet.addColorStop(0.76, '#ffe6b7');
  sheet.addColorStop(1, '#f4d59b');
  ctx.fillStyle = sheet;
  ctx.fillRect(left, top, right - left, paperHeight);
  ctx.restore();
  line(ctx, left, top + 1, right, top + 1, '#fff3d1', 3);
  line(ctx, left, bottom - 1, right, bottom - 1, '#ba965b', 2);
  for (const [u, v, d] of fibers) {
    const x = left + u * (right - left);
    const y = top + 3 + v * (paperHeight - 6);
    line(ctx, x, y, Math.min(right, x + d * 13), y + 0.5, '#75512120', 1);
  }
  for (let lane = 0; lane < pitchCount; lane++) {
    const y = laneY(top, lane);
    line(ctx, left, y, right, y, '#946e413d', 2);
  }
  for (let n = 0; n <= 3; n++) {
    const x = edge(n);
    if (x > left && x < right) {
      line(ctx, x, top + 4, x, top + 21, '#b18d57', 3);
      line(ctx, x, bottom - 22, x, bottom - 5, '#b18d57', 3);
    }
  }
}

function winding(ctx, top, run) {
  const x = 196,
    rx = 72,
    ry = 25,
    bottom = top + paperHeight;
  // The oval end exposes the wound layers. The leader leaves underneath the roll.
  const under = ctx.createLinearGradient(x + 50, 0, x + 133, 0);
  under.addColorStop(0, '#634c3477');
  under.addColorStop(1, '#705b3a00');
  ctx.fillStyle = under;
  ctx.fillRect(x + 50, top, 84, paperHeight);
  const cylinder = ctx.createLinearGradient(x - rx, 0, x + rx, 0);
  for (const [at, color] of [
    [0, '#b2905d'],
    [0.21, '#f0d39e'],
    [0.56, '#ffe9bc'],
    [0.77, '#f2d399'],
    [1, '#a58050'],
  ]) {
    cylinder.addColorStop(at, color);
  }
  ctx.fillStyle = cylinder;
  ctx.beginPath();
  ctx.moveTo(x - rx, top);
  ctx.lineTo(x - rx, bottom);
  ctx.ellipse(x, bottom, rx, ry, 0, Math.PI, 0, true);
  ctx.lineTo(x + rx, top);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, top, rx, ry, 0, 0, 2 * Math.PI);
  ctx.fillStyle = '#efcd94';
  ctx.fill();
  for (let radius = rx - 2; radius > 19; radius -= 5) {
    ctx.beginPath();
    ctx.ellipse(x, top, radius, (radius * ry) / rx, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = '#977244a8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(x, top, 18, 7, 0, 0, 2 * Math.PI);
  ctx.fillStyle = '#574636';
  ctx.fill();
  text(ctx, run, x, top + 137, 69, '#695235', 'Lesson Serif', 'center');
}

function punch(ctx, x, y) {
  // A beveled cut shows the blue surface and a narrow shadow below the paper.
  const w = 102,
    h = 24,
    left = x - w / 2,
    top = y - h / 2;
  const cut = ctx.createLinearGradient(0, top, 0, top + h);
  cut.addColorStop(0, '#324268');
  cut.addColorStop(0.28, '#5f739c');
  cut.addColorStop(0.55, '#94abd6');
  cut.addColorStop(1, ground);
  polygon(
    ctx,
    [
      [left + 4, top],
      [left + w, top],
      [left + w, top + h - 3],
      [left + w - 4, top + h],
      [left, top + h],
      [left, top + 3],
    ],
    cut,
  );
  line(ctx, left + 1, top + h + 1, left + w - 4, top + h + 1, '#fff3cf', 2.5);
}

function musicRoll(ctx, index) {
  const top = tops[index],
    roll = rolls[index];
  paper(ctx, 196, edge(roll.length), top);
  roll.forEach((holes, col) => {
    for (const lane of holes) punch(ctx, center(col), laneY(top, lane));
  });
  winding(ctx, top, index === 0 ? 'A' : 'B');
}

function filler(ctx, alpha, value) {
  if (alpha === 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  const x = edge(2) + 18,
    y = tops[1] + 6,
    w = measure - 18,
    h = paperHeight - 12;
  ctx.strokeStyle = '#4c6388';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([11, 10]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.rect(x + 3, y + 3, w - 6, h - 6);
  ctx.clip();
  for (let d = -h; d < w; d += 24) {
    line(ctx, x + d, y + h, x + d + h, y, '#32446921', 2);
  }
  text(ctx, value, x + w / 2, y + 98, 62, ink, 'Lesson Mono', 'center');
  text(ctx, 'padding', x + w / 2, y + 153, 39, ink, 'Lesson Sans', 'center', 600);
  ctx.restore();
}

function reader(ctx, row, position, faulty) {
  const x = edge(position),
    y = tops[row],
    color = faulty ? '#853830' : red;
  line(ctx, x, y - 8, x, y + paperHeight + 13, '#fff3ce', 10);
  line(ctx, x, y - 8, x, y + paperHeight + 13, color, 5);
  polygon(
    ctx,
    [
      [x - 14, y - 23],
      [x + 14, y - 23],
      [x, y - 4],
    ],
    color,
  );
  polygon(
    ctx,
    [
      [x - 11, y + paperHeight + 28],
      [x + 11, y + paperHeight + 28],
      [x, y + paperHeight + 14],
    ],
    color,
  );
}
function gauge(ctx, row, state, final, faulty, position) {
  const y = tops[row] + 29,
    x = 1655,
    h = 211,
    cut = y + h / 2;
  ctx.fillStyle = '#d6e1f4';
  ctx.fillRect(x, y, 65, h);
  ctx.fillStyle = faulty ? '#9d5548' : '#315a76';
  ctx.fillRect(x, y + h * (1 - state), 65, h * state);
  ctx.save();
  ctx.setLineDash([7, 6]);
  line(ctx, x - 38, cut, x + 85, cut, ink, 3);
  ctx.restore();
  text(ctx, '0.5', x + 92, cut + 9, 28, ink, 'Lesson Mono');
  const landed = Number.isInteger(position);
  const label = (landed ? '' : 'last ') + state.toFixed(3);
  text(ctx, label, x + 26, y - 27, landed ? 46 : 34, ink, 'Lesson Mono', 'center');
  if (final && landed)
    text(
      ctx,
      flagged(state) ? 'flag' : 'clear',
      x + 26,
      y + h + 62,
      43,
      flagged(state) ? '#662629' : '#263e62',
      'Lesson Serif',
      'center',
      600,
    );
}
export function ending(ctx, k) {
  const b = k.beat.beatIndex;
  workSurface(ctx);
  const bad = cue(k, 4, 'run the extra zero', 1.4),
    change = cue(k, 4, 'Change just the filler', 1.3);
  const first = cue(k, 1, 'One hole gives', 1.3),
    second = cue(k, 1, 'Four give', 1.3);
  const shared = cue(k, 1, 'Read the single note', 1.0) + cue(k, 1, 'then read the chord', 1.2);
  const third = cue(k, 3, 'Advance A over the rest', 1.5);
  const badReader = b === 3 && bad > 0,
    xA = shared + third;
  const xB = b === 4 ? 2 * cue(k, 5, 'Read the note and chord', 1.7) : shared + (b === 3 ? bad : 0);
  let fill = change === 1 ? 0.9 : 0;
  if (b === 4) fill = cue(k, 5, 'Change the filler beyond the cut', 0.5) === 1 ? 0.9 : 0;
  const stateAt = (trace, pos) => trace[Math.min(trace.length - 1, Math.floor(pos))];
  const aState = stateAt(rollTraces[0], xA);
  const bState = xB >= 3 ? fillerEnd(fill) : stateAt(rollTraces[1], xB);
  text(
    ctx,
    b === 3 ? 'What goes wrong if B reads past its cut?' : 'Which zero is an observation?',
    102,
    110,
    68,
    ink,
    'Lesson Serif',
  );
  ctx.save();
  ctx.translate(0, 50);
  ctx.scale(0.86, 0.86);
  musicRoll(ctx, 0);
  musicRoll(ctx, 1);
  if (b >= 1) filler(ctx, 1, String(fill));
  [first, second, b >= 1 ? 1 : 0].forEach((p, i) => {
    if (!p) return;
    const label =
      i === 2 ? '0 holes · rest' : rolls[0][i].length + '/5 = ' + rollInputs[0][i].toFixed(1);
    text(ctx, label, center(i), tops[0] - 34, 41, ink, 'Lesson Mono', 'center');
  });
  reader(ctx, 0, xA, false);
  reader(ctx, 1, xB, badReader);
  if (b >= 1)
    text(
      ctx,
      'valid end',
      edge(2),
      tops[1] + paperHeight + 78,
      41,
      '#683624',
      'Lesson Serif',
      'center',
    );
  ctx.restore();
  gauge(ctx, 0, aState, third === 1, false, xA);
  gauge(
    ctx,
    1,
    bState,
    b === 4 ? xB === 2 : cue(k, 3, 'Only B gets flagged', 0.5) === 1,
    badReader,
    xB,
  );
  text(
    ctx,
    badReader ? 'B processes the filler after detach.' : 'h = tanh(0.8 × input + 0.5 × previous h)',
    952,
    539,
    43,
    ink,
    badReader ? 'Lesson Sans' : 'Lesson Mono',
    'center',
  );
}
