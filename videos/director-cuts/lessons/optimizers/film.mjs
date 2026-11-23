import assert from 'node:assert/strict';
import { SETTINGS, simulate } from '../../../films/optimizers/arithmetic.mjs';

// Take a section through the course quadratic at b = 0. All of its motion is in a.
const rate = SETTINGS.momentum;
const run = simulate('momentum', { start: [1, 0], steps: 8, rate });
const positions = run.points.map(point => point.x);
const losses = [50, ...run.records.map(record => record.loss)];
const fifth = run.records[4];
const previousStep = run.records[3].update[0];
const plainStep = -rate * fifth.gradient[0];
const collarFraction = 1 - SETTINGS.beta1;
const mix = (a, b, t) => a + (b - a) * t;
const collarStep = mix(previousStep, plainStep, collarFraction);

const beats = [
  {
    id: 'four-impressions',
    say: 'Follow the punch. Each nick marks the value of one model weight after a training step. The height of the nick tells you the loss.',
    hold: 0.6,
  },
  {
    id: 'over-the-bottom',
    say: "We've crossed the bottom. From the fourth nick, the curve runs downhill to the right. Where do you think the fifth nick will land?",
    hold: 2.4,
  },
  {
    id: 'the-fifth-nick',
    say: "There. Look at the height of the fifth nick. The loss just went up. What carried the weight to the left again?",
    hold: 1.15,
  },
  {
    id: 'pin-the-last-step',
    say: "Let's open up that fifth step. The top pin holds the previous move, about a third of a unit to the left. The center line means no movement.",
    hold: 0.8,
  },
  {
    id: 'set-the-gradient',
    say: "Watch the lower pin. A plain gradient step subtracts the slope times the learning rate from the weight. At the fourth nick the slope was negative, so this pin lands on the right.",
    hold: 0.9,
  },
  {
    id: 'read-the-collar',
    say: "Find the brass collar. It sits one tenth of the way down the bar. It reads a blend of nine tenths of the previous step and one tenth of the fresh gradient step. Which side of zero is it on?",
    hold: 1.9,
  },
  {
    id: 'stamp-the-average',
    say: "Left. That's the step with momentum. Take it from the fourth nick and the punch lands uphill, just where we saw it.",
    hold: 0.95,
  },
  {
    id: 'return',
    say: "That blended step becomes the one we remember. Each new slope on this wall pulls the blend to the right. Watch the last two marks. On step eight, the punch finally heads downhill again.",
    hold: 3,
  },
];

const ink = '#f7f1dd';
const dim = '#b5c6bd';
const gold = '#ffd584';
const mint = '#96edce';
const ease = t => t * t * (3 - 2 * t);
const signed = value => (value < 0 ? '−' : '+') + Math.abs(value).toFixed(3);

function line(ctx, x1, y1, x2, y2, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function polygon(ctx, vertices, fill) {
  ctx.beginPath();
  for (const [i, [x, y]] of vertices.entries()) {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function circle(ctx, x, y, radius, fill) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = fill;
  ctx.fill();
}

function gradient(ctx, x, y, dx, dy, stops) {
  const paint = ctx.createLinearGradient(x, y, x + dx, y + dy);
  for (const [at, color] of stops) paint.addColorStop(at, color);
  return paint;
}

function type(ctx, text, x, y, size, color = ink, family = 'Sans', align = 'left') {
  ctx.font = `400 ${size}px "Lesson ${family}"`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function bench(ctx) {
  const light = ctx.createRadialGradient(640, 145, 30, 850, 425, 1250);
  light.addColorStop(0, '#284139');
  light.addColorStop(0.55, '#192d28');
  light.addColorStop(1, '#0b1615');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 1920, 1080);
}

const profileX = a => 960 + 750 * a;
const profileY = a => 770 - 475 * a * a;
const edge = 1.12;

function profilePath(ctx, offsetX, offsetY) {
  ctx.beginPath();
  ctx.moveTo(profileX(-edge) + offsetX, profileY(-edge) + offsetY);
  ctx.quadraticCurveTo(960 + offsetX, 770 + 475 * edge ** 2 + offsetY,
    profileX(edge) + offsetX, profileY(edge) + offsetY);
}

function plate(ctx) {
  const left = profileX(-edge);
  const right = profileX(edge);
  const top = profileY(edge);
  // A cut face and its back lip share the same parabolic section.
  profilePath(ctx, 16, -18);
  ctx.lineTo(right, top);
  ctx.quadraticCurveTo(960, 770 + 475 * edge ** 2, left, top);
  ctx.closePath();
  ctx.fillStyle = gradient(ctx, left, top, right - left, 25,
    [[0, '#603d33'], [0.35, '#bf7b54'], [0.65, '#e6b781'], [1, '#915a40']]);
  ctx.fill();

  ctx.save();
  profilePath(ctx, 0, 0);
  ctx.lineTo(right, 870);
  ctx.lineTo(left, 870);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = gradient(ctx, 0, 180, 150, 730,
    [[0, '#aa6952'], [0.5, '#764537'], [0.89, '#583830'], [1, '#372b28']]);
  ctx.fillRect(left, top - 2, right - left, 920);
  // Thin laminations expose height differences from nick to nick.
  for (let level = 0; level <= 60; level += 2.5) {
    const y = 770 - 9.5 * level;
    line(ctx, left, y, right, y, level % 10 === 0 ? '#dbac814f' : '#e0ad7a20', 2);
    line(ctx, left, y + 3, right, y + 3, '#38252048', 2);
  }
  for (let i = 0; i < 105; i++) {
    const x = left + ((i * 193) % 1640);
    const y = 230 + (i * 131) % 630;
    line(ctx, x, y, x + 19 + i % 23, y - 0.7, '#f9c4a212', 1.5);
  }
  ctx.restore();
  profilePath(ctx, 0, 0);
  ctx.strokeStyle = '#ffcf94';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = gradient(ctx, 0, 871, 0, 65,
    [[0, '#5a6760'], [0.07, '#283d36'], [0.88, '#1c302b'], [1, '#0a1514']]);
  ctx.fillRect(left - 14, 870, right - left + 28, 66);
  for (let i = -10; i <= 10; i++) {
    const x = profileX(i / 10);
    line(ctx, x, 872, x, i % 5 ? 882 : 893, '#a2ada0', 2);
  }
  type(ctx, '−1', profileX(-1), 925, 31, dim, 'Mono', 'center');
  type(ctx, '−0.5', profileX(-0.5), 925, 31, dim, 'Mono', 'center');
  type(ctx, '0', profileX(0), 925, 31, ink, 'Mono', 'center');
  type(ctx, '+0.5', profileX(0.5), 925, 31, dim, 'Mono', 'center');
  type(ctx, '+1', profileX(1), 925, 31, dim, 'Mono', 'center');
  type(ctx, 'weight', 1153, 925, 32, ink, 'Serif', 'center');
  line(ctx, 960, 783, 960, 866, '#eacfa485', 2);
}

function nick(ctx, a, hot) {
  const x = profileX(a), y = profileY(a);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan(-950 * a / 750));
  polygon(ctx, [[-16,-4],[15,-4],[3,21]], '#251c16');
  polygon(ctx, [[2,21],[8,0],[16,-4],[7,17]], hot ? '#fff0b3' : '#efd2a0');
  line(ctx, -15, -4, 1, 18, hot ? '#f4bf76' : '#a06d4c', 3.5);
  ctx.restore();
}

function punch(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  const brass = gradient(ctx, -27, 0, 54, 1,
    [[0, '#69513a'], [0.19, '#b58b55'], [0.35, '#f5d697'], [0.55, '#d8af72'], [0.82, '#926e49'], [1, '#594b38']]);
  polygon(ctx, [[-21,-207],[-29,-196],[-29,-73],[-18,-63],[17,-63],[29,-75],[29,-197],[19,-207]], brass);
  for (let i = 0; i < 9; i++) {
    const y = -183 + i * 8;
    line(ctx, -26, y + 2, 26, y - 2, '#58433084', 2);
  }
  ctx.fillStyle = '#22332f';
  ctx.fillRect(-29, -101, 58, 24);
  line(ctx, -25, -76, 23, -76, '#e4d3a8', 3);
  polygon(ctx, [[-15,-64],[16,-64],[12,-25],[0,1],[-11,-24]], '#9da8a2');
  polygon(ctx, [[-15,-64],[-3,-64],[-4,-25],[0,1],[-11,-24]], '#e4eadc');
  polygon(ctx, [[7,-64],[16,-64],[12,-25],[0,1],[4,-24]], '#606f69');
  ctx.restore();
}

// Between updates the punch lifts. Only contact leaves a mark or changes a reading.
function cutState(clock) {
  const move = (phrase, seconds) => clock.reveal(phrase, seconds);
  switch (clock.beat.id) {
    case 'four-impressions':
      return move('Follow the punch', 1.0) + move('Each nick', 1.0)
        + move('one model weight', 1.0) + move('The height', 1.05);
    case 'over-the-bottom': return 4;
    case 'the-fifth-nick': return 4 + move('There', 0.9);
    case 'stamp-the-average': return 4 + move('Take it', 1.25);
    case 'return':
      return 5 + move('That blended step', 1.3) + move('Each new slope', 1.15)
        + move('Watch the last two marks', 1.15);
  }
}

function numberMark(ctx, n, dx, dy) {
  const x = profileX(positions[n]);
  const y = profileY(positions[n]);
  line(ctx, x, y + 20, x + dx, y + dy - 36, '#f8d9af', 2);
  type(ctx, String(n), x + dx, y + dy, 37, ink, 'Mono', 'center');
}

function profileShot(ctx, clock) {
  const step = cutState(clock);
  const completed = Math.floor(step);
  const t = step - completed;
  const next = Math.min(8, completed + 1);
  const a = mix(positions[completed], positions[next], ease(t));
  const focus = clock.beat.id === 'four-impressions' ? 0
    : clock.beat.id === 'over-the-bottom' ? ease(clock.reveal("We've crossed", 1.8)) : 1;
  const zoom = 1 + 0.45 * focus;
  ctx.save();
  ctx.translate(455, 782);
  ctx.scale(zoom, zoom);
  ctx.translate(-455, -782);
  plate(ctx);
  for (let i = 1; i <= completed; i++) nick(ctx, positions[i], i === completed);
  const x = profileX(a);
  const lift = Math.min(65, 13 + Math.abs(positions[next] - positions[completed]) * 165);
  punch(ctx, x, profileY(a) - lift * Math.sin(Math.PI * t));

  if (completed >= 4 && completed <= 5) {
    numberMark(ctx, 4, 3, 73);
    if (completed === 5) numberMark(ctx, 5, -5, 75);
  }
  if (completed >= 7) numberMark(ctx, 7, -29, 76);
  if (completed === 8) numberMark(ctx, 8, 17, 82);
  if (clock.beat.id === 'over-the-bottom') {
    const opacity = ease(clock.reveal('the bottom', 0.65));
    ctx.save();
    ctx.globalAlpha = opacity;
    type(ctx, 'minimum', 981, 846, 38, ink, 'Serif');
    ctx.restore();
  }
  ctx.restore();
  type(ctx, 'Update ' + completed, 240, 89, 66, ink, 'Serif');
  type(ctx, 'Loss  ' + losses[completed].toFixed(1), 1652, 88, 42, ink, 'Mono', 'right');
}

function bolt(ctx, x, y, r, color) {
  circle(ctx, x + 1, y + 3, r + 2, '#0c1918');
  circle(ctx, x, y, r, color);
  circle(ctx, x, y - 1, r * 0.68, '#4c5851');
  line(ctx, x - r * 0.42, y + 3, x + r * 0.42, y - 3, '#202e2b', 3);
}

const driveX = value => 962 + value * 1280;
const topRail = 280, bottomRail = 744;
const collarY = mix(topRail, bottomRail, collarFraction);

function runner(ctx, y) {
  line(ctx, 164, y - 11, 1756, y - 11, '#75847b', 3);
  line(ctx, 164, y - 2, 1756, y - 2, '#0c1c18', 16);
  line(ctx, 164, y + 9, 1756, y + 9, '#495e53', 4);
}

function linkBar(ctx, top, lower) {
  ctx.save();
  ctx.translate(top, topRail);
  ctx.rotate(-Math.atan2(lower - top, bottomRail - topRail));
  const length = Math.hypot(bottomRail - topRail, lower - top);
  ctx.lineCap = 'round';
  line(ctx, 8, 2, 8, length, '#0717148c', 57);
  line(ctx, 0, 0, 0, length, '#b7b8a2', 55);
  line(ctx, 0, 0, 0, length, '#6d8176', 48);
  line(ctx, 0, 0, 0, length, '#23342e', 14);
  ctx.lineCap = 'butt';
  for (let tick = 1; tick < 10; tick++) {
    const y = length * tick / 10;
    line(ctx, -24, y, -11, y, '#e2e2c9', 3);
    line(ctx, 12, y, 23, y, '#acb6a6', 2);
  }
  ctx.restore();
}

function driveShot(ctx, clock) {
  const seat = clock.beat.id === 'pin-the-last-step'
    ? ease(clock.reveal("Let's open up", 1.7)) : 1;
  const upper = driveX(previousStep * seat);
  const set = clock.beat.id === 'set-the-gradient'
    ? ease(clock.reveal('A plain gradient step', 2.8))
    : Number(clock.beat.id === 'read-the-collar');
  const lower = mix(upper, driveX(plainStep), set);
  const collar = mix(upper, lower, collarFraction);
  const read = clock.beat.id === 'read-the-collar' ? clock.reveal('Find the brass collar', 0.7) : 0;
  const face = gradient(ctx, 155, 155, 1400, 730,
    [[0, '#3d5047'], [0.44, '#32473e'], [1, '#23372f']]);
  ctx.fillStyle = '#101d19';
  ctx.fillRect(95, 152, 1730, 745);
  ctx.fillStyle = face;
  ctx.fillRect(90, 144, 1730, 744);
  line(ctx, 91, 145, 1818, 145, '#8a9681', 3);
  for (const x of [122, 1788])
    for (const y of [177, 855]) bolt(ctx, x, y, 10, '#849080');
  type(ctx, 'Inside update 5', 240, 89, 66, ink, 'Serif');
  for (const y of [topRail, bottomRail]) runner(ctx, y);
  const zero = driveX(0);
  line(ctx, zero, 212, zero, 785, '#d4d5ba', 3);
  type(ctx, '0', zero, 186, 36, ink, 'Mono', 'center');
  if (set > 0) line(ctx, zero, bottomRail + 1, lower, bottomRail + 1, mint, 5);
  line(ctx, upper, topRail, zero, topRail, '#d5d7bd', 5);
  linkBar(ctx, upper, lower);
  bolt(ctx, upper, topRail, 21, '#c2c9bc');
  bolt(ctx, lower, bottomRail, 21, mint);
  circle(ctx, collar + 1, collarY + 3, 23, '#3f3a25');
  circle(ctx, collar, collarY, 23, '#c19753');
  circle(ctx, collar, collarY, 16, '#ffe4a3');
  circle(ctx, collar, collarY, 6, '#72592e');
  const previousValue = seat === 1 ? '  ' + signed(previousStep) : '';
  type(ctx, 'Previous step' + previousValue, upper, topRail - 49, 42, ink, 'Sans', 'center');
  const lowerLabel = set === 1 ? 'Gradient step  ' + signed(plainStep) : 'Lower pin';
  type(ctx, lowerLabel, lower, bottomRail + 68, 42, mint, 'Sans', 'center');
  if (set === 1) {
    const slope = Math.abs(fifth.gradient[0]).toFixed(3);
    type(ctx, '−' + rate + ' × (−' + slope + ')', lower, bottomRail + 113, 33, ink, 'Mono', 'center');
  }
  if (read > 0) {
    ctx.save();
    ctx.globalAlpha = read;
    line(ctx, collar + 30, collarY, zero - 3, collarY, gold, 4);
    line(ctx, collar - 9, collarY + 24, collar - 61, collarY + 110, gold, 3);
    line(ctx, collar - 61, collarY + 110, 226, collarY + 110, gold, 3);
    type(ctx, 'Momentum step', 221, collarY + 169, 46, ink, 'Serif');
    type(ctx, signed(collarStep), 219, collarY + 232, 57, gold, 'Mono');
    ctx.restore();
  }
}

function draw(ctx, clock) {
  bench(ctx);
  if (['pin-the-last-step', 'set-the-gradient', 'read-the-collar'].includes(clock.beat.id)) {
    driveShot(ctx, clock);
  } else {
    profileShot(ctx, clock);
  }
}

function check() {
  const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9);
  assert(positions[3] > 0 && positions[4] < 0);
  close(fifth.gradient[0], -21.875264);
  close(previousStep, -0.35864064);
  close(plainStep, 0.393754752);
  close(collarStep, fifth.update[0]);
  close(positions[4] + collarStep, positions[5]);
  close(mix(driveX(previousStep), driveX(plainStep), collarFraction), driveX(collarStep));
  for (const [i, record] of run.records.entries()) {
    const previous = i === 0 ? 0 : run.records[i - 1].update[0];
    close(record.update[0], mix(previous, -rate * record.gradient[0], collarFraction));
    close(record.loss, 50 * positions[i + 1] ** 2);
  }
  assert(plainStep > 0 && collarStep < 0 && losses[5] > losses[4]);
  assert(run.records.slice(4, 7).every(step => step.gradient[0] < 0 && step.update[0] < 0));
  assert(run.records[7].update[0] > 0 && losses[8] < losses[7]);
  return true;
}

export default { title: 'Why momentum carries a weight uphill', beats, draw, check };
