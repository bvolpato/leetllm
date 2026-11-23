import assert from 'node:assert/strict';
import { executionAt } from '../../../films/cuda-execution/arithmetic.mjs';
import { ticketClock, tokenValues } from '../../../films/cuda-execution/fixtures.mjs';

const beats = [
  {
    id: 'the-catch',
    say: 'Watch the short hand catch. Two milliseconds after Python asks for the mean of these eight GPU values, the call returns. What came back?',
    hold: 1.25,
  },
  {
    id: 'ask-for-the-value',
    say: 'A CUDA tensor. We could queue more work on the same stream. Call item right away instead. Watch the long hand pull away. Python is waiting for the number.',
    hold: 0.65,
  },
  {
    id: 'between-events',
    say: 'Follow the blue arc. We put one timing event before the mean and another after it, on the same CUDA stream. Watch the tip reach that second mark.',
    hold: 1.25,
  },
  {
    id: 'the-last-tick',
    say: 'Forty milliseconds between the events. The mean is ready on the GPU. How much longer until Python can print it? Keep your eye on the glass.',
    hold: 1.4,
  },
  {
    id: 'the-number',
    say: 'Two point six two five. The long hand stopped when item returned that number. From the original call to a value Python could print, this run took forty-two milliseconds.',
    hold: 2.25,
  },
];

const clamp = (t) => Math.max(0, Math.min(1, t));
const mix = (from, to, t) => from + (to - from) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const tau = 2 * Math.PI;
const face = { x: 526, y: 498, radius: 352 };
const sweepAngle = (ms) => (144 + 252 * ms / 50) * Math.PI / 180;

function instrument(clock) {
  const { index, elapsed, progress, reveal } = clock;
  let time;
  let reading = false;
  let eventFocus = 0;
  let glassFocus = 0;
  let flagDrop = 1;
  switch (index) {
    case 0:
      time = ticketClock.hostReturn * smooth(clamp(elapsed / 0.92));
      flagDrop = clamp((elapsed - 0.92) / 0.28);
      break;
    case 1: {
      const request = reveal('Call item right away', 0.32);
      reading = request > 0;
      flagDrop = reading ? request : 1;
      time = mix(ticketClock.hostReturn, 19, smooth(reveal('Call item right away', 4.5)));
      break;
    }
    case 2:
      reading = true;
      eventFocus = smooth(reveal('Follow the blue arc', 1.2));
      time = mix(19, ticketClock.eventEnd, smooth(clamp(progress / 0.86)));
      break;
    case 3: {
      reading = true;
      const lastTick = smooth(reveal('Keep your eye', 1.05));
      time = mix(ticketClock.eventEnd, ticketClock.scalarAt, lastTick);
      eventFocus = 1 - lastTick;
      glassFocus = lastTick;
      break;
    }
    default:
      reading = true;
      time = ticketClock.scalarAt;
      glassFocus = 1;
  }
  return { time, reading, flagDrop, eventFocus, glassFocus, run: executionAt(time, ticketClock, tokenValues) };
}

function gradient(ctx, x1, y1, x2, y2, stops) {
  const fill = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [position, color] of stops) fill.addColorStop(position, color);
  return fill;
}

function box(ctx, x, y, width, height, radius, color) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fillStyle = color;
  ctx.fill();
}

function disk(ctx, x, y, radius, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, tau);
  ctx.fillStyle = color;
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, color, width) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function label(ctx, value, x, y, size, color, { align = 'center', font = 'Sans', weight = 500 } = {}) {
  ctx.font = `${weight} ${size}px "Lesson ${font}"`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function screw(ctx, x, y, angle) {
  disk(ctx, x, y + 2, 9, '#232921');
  disk(ctx, x, y, 7, gradient(ctx, x - 5, y - 5, x + 4, y + 4, [[0, '#dad1b4'], [0.47, '#929182'], [1, '#4d5149']]));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  line(ctx, -5, 0, 5, 0, '#363a32', 2);
  ctx.restore();
}

function enclosure(ctx) {
  const wall = ctx.createRadialGradient(900, 370, 160, 940, 360, 1180);
  wall.addColorStop(0, '#394749');
  wall.addColorStop(1, '#101c22');
  ctx.fillStyle = wall;
  ctx.fillRect(-240, -180, 2440, 1450);
  const bench = gradient(ctx, 0, 770, 0, 1080, [[0, '#19282a'], [0.38, '#2e3a38'], [1, '#192523']]);
  ctx.fillStyle = bench;
  ctx.fillRect(-220, 770, 2400, 500);
  ctx.save();
  ctx.scale(1, 0.085);
  const shadow = ctx.createRadialGradient(975, 10830, 200, 975, 10830, 990);
  shadow.addColorStop(0, '#080c0cd9');
  shadow.addColorStop(1, '#080c0c00');
  disk(ctx, 975, 10830, 990, shadow);
  ctx.restore();

  for (const x of [215, 1570]) {
    box(ctx, x, 844, 134, 75, 16, '#1a211e');
    box(ctx, x + 6, 878, 122, 19, 5, '#303832');
  }
  box(ctx, 74, 100, 1772, 790, 64, '#182321');
  box(ctx, 80, 94, 1760, 778, 58, gradient(ctx, 85, 95, 440, 925,
    [[0, '#dbe0c9'], [0.13, '#8f9c8e'], [0.55, '#78887d'], [0.95, '#4b5e54'], [1, '#33443b']]));
  box(ctx, 97, 111, 1726, 737, 46, gradient(ctx, 170, 112, 1580, 920,
    [[0, '#b1bcac'], [0.43, '#92a399'], [1, '#73877d']]));
  for (const [x, y, angle] of [[127, 143, 0.8], [1791, 143, 2.7], [127, 817, 2.5], [1791, 817, 0.3]])
    screw(ctx, x, y, angle);
}

function arc(ctx, radius, from, to, color, width) {
  if (to <= from) return;
  ctx.beginPath();
  ctx.arc(0, 0, radius, sweepAngle(from), sweepAngle(to));
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function needle(ctx, time, length, width, color, edge) {
  ctx.save();
  ctx.rotate(sweepAngle(time));
  ctx.fillStyle = '#060d0a55';
  ctx.beginPath();
  ctx.moveTo(-35, 7 - width / 2);
  ctx.lineTo(length, 7);
  ctx.lineTo(-35, 7 + width / 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-36, -width / 2);
  ctx.lineTo(length * 0.72, -width * 0.32);
  ctx.lineTo(length, -2.3);
  ctx.lineTo(length, 2.3);
  ctx.lineTo(length * 0.72, width * 0.32);
  ctx.lineTo(-36, width / 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  line(ctx, -16, -width / 3, length * 0.75, -width * 0.17, edge, 2.2);
  ctx.restore();
}

function dial(ctx, state) {
  const { time, run, eventFocus, glassFocus } = state;
  const { x, y, radius } = face;
  ctx.save();
  ctx.translate(x, y);
  disk(ctx, 2, 11, radius + 6, '#29342f70');
  disk(ctx, 0, 0, radius + 3, '#364139');
  disk(ctx, 0, 0, radius, gradient(ctx, -330, -330, 300, 330,
    [[0, '#faf3cf'], [0.2, '#9c9e89'], [0.41, '#e8e3c7'], [0.55, '#5e695c'], [0.78, '#9d9e87'], [1, '#46574c']]));
  disk(ctx, 0, 0, radius - 10, '#35423c');
  disk(ctx, 0, 0, radius - 15, gradient(ctx, -220, -340, 200, 320,
    [[0, '#aeb89e'], [0.05, '#dedfc7'], [0.5, '#f2ead4'], [1, '#d4ceb5']]));

  arc(ctx, 311, 0, 50, '#b8b9a3', 2);
  for (let t = 0; t <= 50; t++) {
    ctx.save();
    ctx.rotate(sweepAngle(t));
    line(ctx, t % 5 ? 299 : 287, 0, 311, 0, '#3a483f', t % 5 ? 2.5 : 4.5);
    ctx.restore();
    if (t % 5 === 0) {
      const angle = sweepAngle(t);
      label(ctx, String(t), Math.cos(angle) * 257, Math.sin(angle) * 257, 36, '#35453c', { font: 'Mono' });
    }
  }

  if (time >= ticketClock.eventStart) {
    const blue = '#216f88';
    const end = Math.min(time, ticketClock.eventEnd);
    arc(ctx, 322, ticketClock.eventStart, end, blue, 12);
    for (const mark of [ticketClock.eventStart, end]) {
      const angle = sweepAngle(mark);
      disk(ctx, 322 * Math.cos(angle), 322 * Math.sin(angle), 7, blue);
    }
  }
  const arcLabel = eventFocus + glassFocus;
  if (arcLabel > 0) {
    ctx.save();
    ctx.globalAlpha *= arcLabel;
    for (const t of [ticketClock.eventStart, ticketClock.eventEnd]) {
      ctx.save();
      ctx.rotate(sweepAngle(t));
      line(ctx, 311, 0, 333, 0, '#173c45', 6);
      line(ctx, 312, -2, 332, -2, '#75a5af', 2);
      ctx.restore();
    }
    label(ctx, run.deviceComplete ? `GPU  ${run.eventInterval} ms` : 'GPU stream', 0, 228, 35, '#196a79', { weight: 600 });
    ctx.restore();
  }
  label(ctx, 'Caller', 0, 100, 36, '#4f5c4f');
  label(ctx, `${Math.floor(time + 1e-8)} ms`, 0, 154, 64, '#27382e', { font: 'Mono' });

  needle(ctx, time, 303, 17, '#24372e', '#748276');
  needle(ctx, Math.min(time, ticketClock.hostReturn), 224, 14, '#b8452e', '#e88f6c');
  disk(ctx, 0, 0, 27, '#343c31');
  disk(ctx, 0, -1, 22, gradient(ctx, -16, -20, 18, 19, [[0, '#d4bb85'], [0.47, '#958051'], [1, '#685936']]));
  disk(ctx, 0, 0, 8, '#584e37');
  ctx.restore();
}

// The cathodes use one continuous bent wire per digit.
function cathode(ctx, digit) {
  ctx.beginPath();
  if (digit === '2') {
    ctx.moveTo(-31, -34);
    ctx.bezierCurveTo(-29, -67, 36, -73, 34, -25);
    ctx.bezierCurveTo(32, 1, -12, 16, -31, 53);
    ctx.lineTo(34, 53);
  } else if (digit === '6') {
    ctx.moveTo(24, -55);
    ctx.bezierCurveTo(-10, -70, -38, -31, -37, 15);
    ctx.bezierCurveTo(-37, 66, 32, 70, 34, 21);
    ctx.bezierCurveTo(35, -12, -9, -22, -32, 8);
  } else {
    assert.equal(digit, '5');
    ctx.moveTo(30, -55);
    ctx.lineTo(-26, -55);
    ctx.lineTo(-31, -4);
    ctx.bezierCurveTo(-1, -23, 36, -8, 34, 24);
    ctx.bezierCurveTo(31, 63, -10, 69, -36, 44);
  }
}

function tube(ctx, x, digit, decimal) {
  ctx.save();
  ctx.translate(x, 404);
  const glass = gradient(ctx, -75, 0, 75, 0, [[0, '#87948d'], [0.035, '#384b47'], [0.12, '#79867a'],
    [0.17, '#485850'], [0.4, '#283b35'], [0.7, '#2d3e37'], [0.92, '#49564a'], [1, '#9ca594']]);
  ctx.beginPath();
  ctx.moveTo(-72, 112);
  ctx.bezierCurveTo(-77, 76, -77, -54, -70, -88);
  ctx.bezierCurveTo(-63, -126, -27, -125, -9, -137);
  ctx.quadraticCurveTo(-8, -146, -2, -147);
  ctx.quadraticCurveTo(5, -148, 7, -136);
  ctx.bezierCurveTo(40, -125, 61, -122, 70, -88);
  ctx.bezierCurveTo(78, -47, 76, 74, 72, 112);
  ctx.closePath();
  ctx.fillStyle = glass;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#9aab9e';
  ctx.stroke();
  for (const side of [-1, 1]) {
    line(ctx, side * 51, -65, side * 51, 104, '#192b25', 5);
    line(ctx, side * 51 - 1, -65, side * 51 - 1, 104, '#6d7666', 1.3);
  }
  line(ctx, -51, -70, 51, -70, '#7c8270', 3);
  line(ctx, -51, 78, 51, 78, '#7c8270', 3);
  for (let i = -4; i <= 4; i++)
    line(ctx, i * 10, -66, i * 10, 75, '#c0c3a91d', 1.3);

  if (digit !== null) {
    const glow = ctx.createRadialGradient(0, 1, 6, 0, 1, 84);
    glow.addColorStop(0, '#f395453d');
    glow.addColorStop(1, '#e7853800');
    disk(ctx, 0, 1, 84, glow);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    cathode(ctx, digit);
    for (const [color, width] of [['#ff78362d', 22], ['#ff863e8f', 12], ['#ffa353', 6.8], ['#ffe0a7', 3.2]]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    }
    if (decimal) {
      disk(ctx, 52, 55, 11, '#ff863e7d');
      disk(ctx, 52, 55, 7, '#ffcf8a');
    }
  }
  ctx.beginPath();
  ctx.moveTo(-62, -45);
  ctx.bezierCurveTo(-62, -88, -58, -103, -37, -113);
  ctx.strokeStyle = '#e0e7cf77';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.stroke();
  box(ctx, -73, 99, 146, 16, 5, '#7e8272');
  box(ctx, -80, 109, 160, 32, 9, gradient(ctx, -79, 0, 80, 0,
    [[0, '#1b231f'], [0.12, '#414740'], [0.3, '#565b4f'], [0.8, '#313831'], [1, '#1d2520']]));
  box(ctx, -82, 134, 164, 10, 4, '#171e1b');
  ctx.restore();
}

function outputBay(ctx, state) {
  const { run, reading, flagDrop } = state;
  label(ctx, 'Python number', 1357, 194, 55, '#23382e', { font: 'Serif' });
  box(ctx, 929, 235, 850, 345, 24, '#b6c3b4');
  box(ctx, 929, 230, 850, 344, 24, '#4b5c50');
  box(ctx, 936, 237, 836, 331, 20, gradient(ctx, 0, 235, 0, 570,
    [[0, '#14231f'], [0.6, '#293d33'], [0.93, '#435443'], [1, '#1f2f26']]));
  const digits = run.reported ? run.scalar.toFixed(3).replace('.', '') : null;
  for (let i = 0; i < 4; i++) tube(ctx, 1058 + 197 * i, digits ? digits[i] : null, i === 0);

  const code = reading ? 'm.item()' : 'm = x.mean()';
  label(ctx, code, 958, 647, 42, '#1e3229', { font: 'Mono', align: 'left' });

  // The flag drops into the window when the call changes state.
  const flag = reading ? (run.reported ? 'returned' : 'waiting') : (run.returned ? 'CUDA tensor' : '');
  box(ctx, 1304, 608, 447, 78, 8, '#b6c3b4');
  box(ctx, 1304, 604, 447, 77, 8, '#34483b');
  ctx.save();
  ctx.beginPath();
  ctx.rect(1310, 610, 435, 64);
  ctx.clip();
  box(ctx, 1310, 610, 435, 64, 1, '#23312a');
  const flagY = 610 - (1 - smooth(flagDrop)) * 66;
  const paper = reading && run.reported ? '#f5ca87' : '#e4debf';
  box(ctx, 1310, flagY, 435, 64, 1, gradient(ctx, 0, flagY, 0, flagY + 64,
    [[0, '#8e9175'], [0.2, paper], [0.88, paper], [1, '#aaa990']]));
  label(ctx, flag, 1528, flagY + 33, 40, '#303b2e', { font: 'Mono' });
  ctx.restore();

  line(ctx, 959, 731, 1749, 731, '#5c7063', 2);
  label(ctx, 'GPU input', 960, 778, 34, '#324a3d', { align: 'left' });
  label(ctx, tokenValues.join('  '), 1748, 778, 38, '#20382c', { font: 'Mono', align: 'right' });
}

function draw(ctx, clock) {
  const state = instrument(clock);
  ctx.save();
  const zoom = 1 + 0.047 * state.eventFocus + 0.035 * state.glassFocus;
  const anchorX = state.glassFocus > 0 ? mix(face.x, 1460, state.glassFocus) : face.x;
  ctx.translate(anchorX, 480);
  ctx.scale(zoom, zoom);
  ctx.translate(-anchorX, -480);
  enclosure(ctx);
  dial(ctx, state);
  outputBay(ctx, state);
  ctx.restore();
}

function check() {
  const at = (ms) => executionAt(ms, ticketClock, tokenValues);
  assert.equal(tokenValues.reduce((total, n) => total + n, 0), 21);
  assert.equal(at(1.99).returned, false);
  const caught = at(2);
  assert.equal(caught.returned, true);
  assert.equal(caught.deviceComplete, false);
  assert.equal(caught.scalar, null);
  assert.equal(at(40.99).eventInterval, null);
  assert.equal(at(41).eventInterval, 40);
  assert.equal(at(41).scalar, null);
  assert.equal(at(41.99).reported, false);
  const arrival = at(42);
  assert.equal(arrival.scalar, 2.625);
  assert.equal(arrival.hostInterval, 42);
  assert(sweepAngle(ticketClock.hostReturn) < sweepAngle(ticketClock.scalarAt));
}

export default { title: 'When can Python read the mean?', beats, draw, check };
