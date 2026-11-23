import assert from 'node:assert/strict';
import { burst, outcomes } from '../../../films/gpu-autoscaling/arithmetic.mjs';
import { phases } from '../../../films/gpu-autoscaling/fixtures.mjs';

const title = 'How many GPUs need to be warm at nine?';
const deadline = 30;
const coldReady = phases.reduce((time, [, duration]) => time + duration, 0);
const runs = { one: burst(1, deadline), five: burst(5, deadline) };

const beats = [
  {
    id: 'nine-oclock',
    say: 'At nine, a hundred people ask for incident summaries at once. Follow the bottom line. That person was last in the queue.',
    hold: 0.65,
  },
  {
    id: 'five-slots',
    say: 'One GPU is ready. See the five blue lines at the top? This GPU can work on five summaries at a time. Each takes ten seconds in our example. Watch the next five take their places.',
    hold: 0.75,
  },
  {
    id: 'last-chance',
    say: 'The autoscaler has asked for nineteen more GPUs. Meanwhile, the one warm GPU keeps taking work. Watch the deadline. A request can still start at thirty seconds. Five more slip through right there. What happened to the bottom line?',
    hold: 0.9,
  },
  {
    id: 'pull-back',
    say: 'Our request expired with seventy-nine others. Pull back along the same clock. The new workers need GPU nodes, container images, model weights, and time to warm up. In this run they become ready at two hundred and seven seconds.',
    hold: 1,
  },
  {
    id: 'another-morning',
    say: 'Replay the same morning. This time, five GPUs are warm when the burst arrives. Look how far down the queue that first patch of blue reaches.',
    hold: 0.65,
  },
  {
    id: 'three-starts',
    say: 'Twenty-five start at once. Ten seconds later, the next twenty-five get those same slots. Then another twenty-five. Our request is still waiting. There is one chance left.',
    hold: 1.25,
  },
  {
    id: 'the-hundredth',
    say: 'Watch the tip of that bottom line. Right on thirty seconds, it turns blue. The deadline was for starting. The last summary can finish ten seconds later.',
    hold: 0.85,
  },
  {
    id: 'enough',
    say: 'Each warm GPU started twenty summaries in time. Five warm GPUs were just enough for all one hundred.',
    hold: 2.7,
  },
];

const ink = '#1f223a';
const muted = '#505771';
const waitInk = '#9a94b0';
const markedWait = '#514774';
const blue = '#224bdf';
const brightBlue = '#4168ef';
const darkBlue = '#133891';
const rust = '#bb3e29';
const clamp = (t) => Math.max(0, Math.min(1, t));
const ease = (t) => { const u = clamp(t); return u * u * (3 - 2 * u); };
const mix = (a, b, t) => a + (b - a) * t;

// The camera can change scale. Every time coordinate, including the startup
// strip underneath the requests, goes through the same projection.
function shot(clock) {
  const cue = (phrase, duration) => ease(clock.reveal(phrase, duration));
  const into = (duration) => ease(clock.elapsed / duration);
  let time, span = 42;
  switch (clock.beat.id) {
    case 'nine-oclock':
      span = 10;
      time = mix(0.05, 5, 1 - (1 - clamp(clock.elapsed / 4.6)) ** 2);
      break;
    case 'five-slots':
      span = mix(10, 42, cue('Each takes ten seconds', 1.4));
      time = 5 + 4.5 * into(7.2) + 3.5 * cue('Watch the next five', 1.45);
      break;
    case 'last-chance':
      time = 13 + 8 * into(3.3) + 11 * cue('Watch the deadline', 2.55);
      break;
    case 'pull-back':
      span = mix(42, 223, cue('Pull back', 2.2));
      time = 32 + (coldReady - 32) * cue('The new workers', 5.6);
      break;
    case 'another-morning':
      span = 10;
      time = mix(0.05, 5, into(1.8));
      break;
    case 'three-starts':
      span = mix(10, 42, cue('Ten seconds later', 1.35));
      time = 5 + 7 * cue('Ten seconds later', 1.55) + 10 * cue('Then another', 1.15) + 7 * cue('There is one chance left', 1.35);
      break;
    case 'the-hundredth':
      time = 29 + 4 * into(2.3) + 7 * cue('The last summary', 1.85);
      break;
    case 'enough':
      time = 40;
      break;
  }
  const warm = clock.index < 4 ? 1 : 5;
  const rows = warm === 1 ? runs.one : runs.five;
  return { warm, rows, time, span, counts: outcomes(rows, time) };
}

function line(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function poly(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fill();
}

function type(ctx, value, x, y, size, color, family = 'Sans', align = 'left', weight = 400) {
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function lastState(row, time) {
  if (row.expired && time > row.deadline) return ['Expired', rust];
  if (row.start === null || time < row.start) return ['Waiting', markedWait];
  if (time < row.end) return ['Running', blue];
  return ['Complete', darkBlue];
}

const top = 306;
const runWidth = 1400;
// Make the first five slots countable and leave one annotation line for R100.
const rowY = (i) => top + i * 3.56 + Math.min(i, 5) * 7.3 + Math.floor(i / 5) * 2.25 + Math.floor(i / 25) * 4 + (i === 99 ? 60 : 0);
const originX = (y) => 359 - (y - top) * 0.32;
const rowX = (i) => originX(rowY(i));
const bottom = rowY(99);
const front = rowX(99);
const traceX = (i, time, span) => rowX(i) + runWidth * time / span;

function header(ctx, s) {
  const [state, color] = lastState(s.rows.at(-1), s.time);
  type(ctx, '09:00   /   INCIDENT SUMMARIES', 82, 72, 34, muted, 'Mono');
  type(ctx, 'Request 100', 78, 169, 87, ink, 'Serif');
  const labelEnd = 78 + ctx.measureText('Request 100').width;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(labelEnd + 51, 140, 8, 0, Math.PI * 2);
  ctx.fill();
  type(ctx, state, labelEnd + 77, 160, 53, color);

  type(ctx, `${s.warm} ${s.warm === 1 ? 'GPU' : 'GPUs'} warm at arrival   /   20 desired`, 1833, 72, 36, muted, 'Sans', 'right');
  type(ctx, `${s.counts.admitted.length} of 100 started`, 1834, 159, 65, ink, 'Serif', 'right');
}

// A request occupies one horizontal thread. The shallow oblique projection
// separates the threads while keeping ten seconds the same width on every row.
function traceBed(ctx, s) {
  const rearY = top - 5, lip = bottom + 9, back = originX(rearY), edge = originX(lip);
  const bed = ctx.createLinearGradient(0, rearY, 0, lip);
  bed.addColorStop(0, '#e9ebf6');
  bed.addColorStop(0.7, '#f2f1f8');
  bed.addColorStop(1, '#ebeaf4');
  poly(ctx, [[back, rearY], [back + runWidth, rearY], [edge + runWidth, lip], [edge, lip]], bed);
  poly(ctx, [[edge, lip], [edge + runWidth, lip], [edge + runWidth, lip + 5], [edge, lip + 5]], '#cecfe0');
  const ticks = s.span < 18 ? [0, 5, 10] : s.span < 70 ? [0, 10, 20, 30, 40] : [0, 30, 100, 150, coldReady];
  for (const tick of ticks.filter((t) => t <= s.span)) {
    const offset = runWidth * tick / s.span;
    const xb = back + offset, xf = originX(lip + 12) + offset;
    line(ctx, xb, rearY, xf, lip + 12, tick === deadline ? '#d79985' : '#c2c4d8', tick === deadline ? 2.8 : 1.8);
    type(ctx, `${tick} s`, xf, lip + 51, 35, tick === deadline ? rust : muted, 'Mono', 'center');
  }
  for (const i of [0, 24, 49, 74, 99]) {
    const x = rowX(i), y = rowY(i);
    line(ctx, x - 14, y, x - 3, y, i === 99 ? markedWait : '#8c91aa', 2);
    type(ctx, `R${i + 1}`, x - 25, y + 8, i === 99 ? 35 : 29, i === 99 ? ink : muted, 'Mono', 'right');
  }
  if (s.span >= deadline + 1) {
    const x = traceX(0, deadline, s.span);
    line(ctx, x, rearY, x, rearY - 28, rust, 2);
    type(ctx, 'Start deadline', x + 3, rearY - 34, 39, rust, 'Sans', 'center');
  }
}

function traces(ctx, s) {
  for (const [i, row] of s.rows.entries()) {
    const x0 = rowX(i), y = rowY(i);
    const selected = i === 99;
    const expired = row.expired && s.time > row.deadline;
    const waitingUntil = row.start ?? row.deadline;
    const xWait = traceX(i, Math.min(s.time, waitingUntil), s.span);
    line(ctx, x0, y, xWait, y, selected ? markedWait : waitInk, selected ? 5 : 2.1);
    // Leave a small ink well at the precise arrival time.
    ctx.fillStyle = selected ? markedWait : '#76708e';
    ctx.fillRect(x0 - 2, y - 1.5, 3, 3);
    if (expired) {
      const r = selected ? 8 : 2.4;
      line(ctx, xWait - r, y - r, xWait + r, y + r, rust, selected ? 4.8 : 2.25);
      line(ctx, xWait + r, y - r, xWait - r, y + r, rust, selected ? 4.8 : 2.25);
    } else if (row.start !== null && s.time >= row.start) {
      const on = traceX(i, row.start, s.span);
      const off = traceX(i, Math.min(s.time, row.end), s.span);
      const thickness = selected ? 10 : 3.75;
      ctx.fillStyle = darkBlue;
      ctx.fillRect(on, y - thickness / 2, Math.max(2, off - on), thickness);
      ctx.fillStyle = i % 5 === 0 || selected ? brightBlue : blue;
      ctx.fillRect(on, y - thickness / 2, Math.max(2, off - on), thickness * 0.68);
      if (s.time >= row.end && selected) {
        ctx.fillStyle = blue;
        ctx.beginPath();
        ctx.arc(off, y, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (selected) {
      ctx.fillStyle = markedWait;
      ctx.beginPath();
      ctx.arc(xWait, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// The selected request keeps its own start and end marks even after the rest
// of its wave has finished. Their positions come from the admission record.
function markLast(ctx, s) {
  const row = s.rows.at(-1);
  if (row.start === null || s.time < row.start) {
    const expired = row.expired && s.time > row.deadline;
    const time = Math.min(s.time, row.deadline);
    const x = traceX(99, time, s.span);
    const color = expired ? rust : markedWait;
    const label = expired ? 'Queue expired' : `Waiting  ${Math.floor(time)} s`;
    line(ctx, x, bottom - 6, x + 10, bottom - 21, color, 3);
    type(ctx, label, x + 18, bottom - 18, 35, color);
    return;
  }
  const start = traceX(99, row.start, s.span);
  line(ctx, start, bottom - 5, start - 8, bottom - 22, blue, 3);
  type(ctx, `Start  ${row.start} s`, start - 17, bottom - 17, 36, blue, 'Sans', 'right', 600);
  if (s.time >= row.end) {
    const end = traceX(99, row.end, s.span);
    line(ctx, end, bottom - 5, end + 9, bottom - 22, darkBlue, 3);
    type(ctx, `Finish  ${row.end} s`, end + 19, bottom - 17, 36, darkBlue);
  }
}

function key(ctx) {
  const y = 220;
  line(ctx, 82, y - 10, 132, y - 10, waitInk, 3);
  type(ctx, 'Queued', 147, y, 32, muted);
  line(ctx, 306, y - 10, 356, y - 10, blue, 10);
  type(ctx, 'Running', 371, y, 32, darkBlue);
}

const startupColors = ['#7f819d', '#bcb8d0', '#666d91', '#a9a7bc'];
const phaseNames = ['GPU node', 'Image', 'Weights', 'Warmup'];
function startup(ctx, s) {
  const y = 930, h = 24;
  type(ctx, 'Cold start', front - 24, y + 23, 32, muted, 'Sans', 'right');
  line(ctx, front, y + h, front + runWidth, y + h, '#c7cad9', 1.5);
  let start = 0;
  for (const [i, [, duration]] of phases.entries()) {
    const end = start + duration;
    const visible = Math.min(s.time, s.span, end) - start;
    if (visible > 0) {
      const x = traceX(99, start, s.span);
      const width = runWidth * visible / s.span;
      ctx.fillStyle = startupColors[i];
      ctx.fillRect(x, y, Math.max(0, width - 2), h);
      if (width > (i === 3 ? 72 : 118)) {
        type(ctx, phaseNames[i], x + width / 2, y + h + 36, 29, muted, 'Sans', 'center');
      }
    }
    start = end;
  }
  if (s.time >= coldReady) {
    const x = traceX(99, coldReady, s.span);
    line(ctx, x, y + h, x, y - 20, darkBlue, 3.5);
    type(ctx, 'Ready', x + 12, y - 8, 34, darkBlue, 'Sans', 'left', 600);
  }
}

function draw(ctx, clock) {
  const s = shot(clock);
  const light = ctx.createLinearGradient(0, 0, 430, 1080);
  light.addColorStop(0, '#ffffff');
  light.addColorStop(0.62, '#f9f9fc');
  light.addColorStop(1, '#ebedf5');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 1920, 1080);
  header(ctx, s);
  key(ctx);
  traceBed(ctx, s);
  traces(ctx, s);
  markLast(ctx, s);
  startup(ctx, s);
}

function check() {
  assert.equal(coldReady, 207);
  assert.equal(runs.one.length, 100);
  assert.deepEqual(runs.one.map((r) => r.id), runs.five.map((r) => r.id));
  const baseline = outcomes(runs.one, 40);
  assert.deepEqual([baseline.complete.length, baseline.expired.length, baseline.cold.length], [20, 80, 0]);
  assert.equal(runs.one.at(-1).expired, true);
  // A fourth warm worker still leaves one group of twenty without a start.
  assert.equal(outcomes(burst(4, deadline), 40).admitted.length, 80);
  const last = runs.five.at(-1);
  assert.equal(last.id, 'R100');
  assert.deepEqual([last.start, last.end, last.cold], [30, 40, false]);
  for (const [time, n] of [[0, 25], [10, 50], [20, 75], [29.99, 75], [30, 100]]) {
    assert.equal(outcomes(runs.five, time).admitted.length, n);
  }
  assert.deepEqual([29.99, 30, 39.99, 40].map((t) => lastState(last, t)[0]), ['Waiting', 'Running', 'Running', 'Complete']);
  assert.equal(outcomes(runs.five, 40).complete.length, 100);
}

export default { title, beats, draw, check };
