import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';

const title = 'The second handoff';
const beats = [
  {
    id: 'overtake',
    say: "Watch the split run go past the CPU's finishing time. The neural processor gets two of the three operations, and both runs give us two. Where did the extra time go?",
    hold: 1.2,
  },
  {
    id: 'projection',
    say: "Let's replay the split run. Start with the pair on the right. The projection takes just one millisecond on the neural processor. But this backend needs the CPU for the next operation.",
    hold: 0.6,
  },
  {
    id: 'first-handoff',
    say: 'Follow those two values across. The runtime has to synchronize the processors and convert the layout so the CPU can use them. That orange stretch is eight milliseconds in our example.',
    hold: 0.7,
  },
  {
    id: 'activation',
    say: 'The activation replaces negative values with zero. Both values here are positive, so the CPU leaves them alone. Look where the final sum runs. Which way does the pair have to go?',
    hold: 1.6,
  },
  {
    id: 'return',
    say: "Back across. The neural processor halves the first value and adds the second. There's our two again. Five milliseconds went into the operations. The two handoffs took sixteen.",
    hold: 1.25,
  },
  {
    id: 'one-backend',
    say: 'Try a backend that supports the activation on the neural processor too. Watch the pair through the middle operation this time. It can stay right there for the final sum.',
    hold: 0.65,
  },
  {
    id: 'read-the-trace',
    say: 'Same answer in two and a half milliseconds. On the handheld, profile the whole step. Time the handoffs as well as the operations.',
    hold: 2.6,
  },
];

// The three ordered operations and their illustrative costs come from the lesson's export fixture.
const input = [2, 1];
const operations = [
  { name: 'Projection', cpu: 5, npu: 1, apply: ([a, b]) => [a - b, (a + b) / 2] },
  { name: 'Activation', cpu: 3, npu: 0.5, apply: (pair) => pair.map((x) => Math.max(0, x)) },
  { name: 'Final sum', cpu: 5, npu: 1, apply: ([a, b]) => [a / 2 + b] },
];
const boundaryMs = 8;

function run(placement, initial = input) {
  let end = 0;
  let values = initial;
  const spans = [];
  for (const [i, op] of operations.entries()) {
    const device = placement[i];
    const previous = placement[i - 1];
    if (previous && previous !== device) {
      spans.push({
        kind: 'handoff',
        from: previous,
        to: device,
        start: end,
        end: end + boundaryMs,
        values,
      });
      end += boundaryMs;
    }
    const output = op.apply(values);
    spans.push({
      kind: 'op',
      device,
      name: op.name,
      start: end,
      end: end + op[device],
      values,
      output,
    });
    end += op[device];
    values = output;
  }
  return { spans, total: end, output: values };
}

const cpu = run(['cpu', 'cpu', 'cpu']);
const split = run(['npu', 'cpu', 'npu']);
const whole = run(['npu', 'npu', 'npu']);
const rows = [
  { name: 'CPU only', run: cpu },
  { name: 'Split run', run: split },
  { name: 'NPU only', run: whole },
];
const clamp = (v) => Math.max(0, Math.min(1, v));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const pen = '#201a35';
const colors = { cpu: '#42519d', npu: '#843e8e', handoff: '#d46d30' };
const xChip = { cpu: 435, npu: 1485 };

// Stop exactly at span boundaries so the value changes only when its producer completes.
function stateAt(graph, ms) {
  const span = graph.spans.find((item) => ms < item.end);
  if (!span) {
    const device = graph.spans.at(-1).device;
    return {
      device,
      x: xChip[device],
      layout: Number(device === 'npu'),
      values: graph.output,
      label: 'Output',
    };
  }
  if (span.kind === 'op') {
    return {
      device: span.device,
      x: xChip[span.device],
      layout: Number(span.device === 'npu'),
      values: span.values,
      label: span.name,
    };
  }
  const p = smooth(clamp((ms - span.start) / (span.end - span.start)));
  const layout = span.to === 'npu' ? p : 1 - p;
  return {
    device: 'handoff',
    x: mix(xChip.cpu, xChip.npu, layout),
    layout,
    values: span.values,
    label: 'Handoff',
  };
}

function frameTime(c) {
  switch (c.index) {
    case 0:
      return { row: 1, ms: mix(11.35, split.total, clamp(c.elapsed / 6.7)) };
    case 1:
      return { row: 1, ms: c.reveal('Start with the pair', 2.5) };
    case 2:
      return { row: 1, ms: 1 + 8 * clamp(c.elapsed / 5.75) };
    case 3:
      return { row: 1, ms: 9 + 3 * c.reveal('The activation', 3.4) };
    case 4:
      return {
        row: 1,
        ms: 12 + 8 * clamp(c.elapsed / 2.5) + c.reveal('halves the first value', 1.3),
      };
    case 5:
      return {
        row: 2,
        ms:
          c.reveal('Try a backend', 1.5) +
          0.5 * c.reveal('Watch the pair', 1.6) +
          c.reveal('It can stay', 2.3),
      };
    default:
      return { row: 2, ms: whole.total };
  }
}

function box(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function path(ctx, points, color, width = 1) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const p of points.slice(1)) ctx.lineTo(...p);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}
function label(
  ctx,
  s,
  x,
  y,
  size,
  color = pen,
  family = 'Lesson Sans',
  weight = 500,
  align = 'left',
) {
  ctx.font = `${weight} ${size}px "${family}"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}
function wash(ctx, x, y, w, h, stops) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  stops.forEach(([offset, color]) => g.addColorStop(offset, color));
  box(ctx, x, y, w, h, g);
}

// A logic core has irregular banks and routes. The accelerator repeats a MAC array.
// These are illustrative die regions; elapsed time is encoded only in the trace below.
function logicCore(ctx, x, y, w, h, variant) {
  box(ctx, x, y, w, h, '#555e93');
  box(ctx, x + 3, y + 3, w - 6, h - 6, '#adb9dd');
  for (let j = 0; j < 5; j++) {
    const by = y + 8 + (j * (h - 14)) / 5;
    const bw = w * (j % 2 ? 0.36 : 0.54);
    box(ctx, x + 7, by, bw, 11, j === variant ? '#425786' : '#747eb3');
    for (let k = 0; k < 5; k++) box(ctx, x + 9 + (k * bw) / 5, by + 1, 1.5, 9, '#d1daed');
    path(
      ctx,
      [
        [x + bw + 10, by + 4],
        [x + w - 20, by + 4],
        [x + w - 15, by + 9],
        [x + w - 4, by + 9],
      ],
      '#737eab',
      2,
    );
  }
}
function macArray(ctx, x, y) {
  box(ctx, x, y, 83, 68, '#53355f');
  box(ctx, x + 2, y + 2, 79, 64, '#b584b4');
  for (let j = 0; j < 5; j++) {
    for (let i = 0; i < 6; i++) {
      box(ctx, x + 6 + 12 * i, y + 6 + 11 * j, 9, 8, (i + j) % 3 ? '#81618f' : '#d1a7c6');
    }
  }
  box(ctx, x + 7, y + 61, 69, 2, '#e5c6d1');
}
function drawSilicon(ctx) {
  ctx.save();
  ctx.shadowColor = 'rgba(49,34,65,.2)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 9;
  box(ctx, 83, 131, 1754, 417, '#777087');
  ctx.restore();
  wash(ctx, 84, 127, 1752, 416, [
    [0, '#4a485f'],
    [0.17, '#dad3d8'],
    [0.44, '#76748c'],
    [0.7, '#dbcfdf'],
    [1, '#5c566d'],
  ]);
  wash(ctx, 100, 144, 1720, 379, [
    [0, '#d5d4de'],
    [0.5, '#e9deda'],
    [1, '#a899b1'],
  ]);
  for (let i = 0; i < 104; i++) {
    const x = 109 + i * 16.45;
    box(ctx, x, 134, 9, 7, '#e9dacf');
    box(ctx, x, 525, 10, 7, '#d0bcbd');
  }
  // Fan the interconnect out from the narrower channel between the compute regions.
  for (let i = 0; i < 30; i++) {
    const y = 177 + i * 11;
    const mid = 259 + i * 5.3;
    const d = Math.abs(y - mid);
    const pts = [
      [742, y],
      [788, y],
      [788 + d, mid],
      [1132 - d, mid],
      [1132, y],
      [1170, y],
    ];
    path(ctx, pts, i % 4 === 0 ? '#92798a' : '#ad99a4', 2.5);
  }
  box(ctx, 120, 155, 628, 353, '#5d628d');
  box(ctx, 125, 160, 618, 343, '#8791bd');
  box(ctx, 1169, 155, 629, 353, '#5a3f70');
  box(ctx, 1174, 160, 619, 343, '#a27ea3');
  for (let j = 0; j < 3; j++) {
    for (let i = 0; i < 4; i++) logicCore(ctx, 137 + 151 * i, 172 + 107 * j, 139, 89, (j + i) % 5);
  }
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 4; j++) macArray(ctx, 1181 + 87 * i, 173 + 80 * j);
  }
  for (let j = 0; j < 3; j++) {
    const y = 266 + 108 * j;
    path(
      ctx,
      [
        [128, y],
        [730, y],
      ],
      '#d8dfed',
      2,
    );
  }
  for (let i = 0; i < 25; i++) {
    box(ctx, 752, 170 + i * 13.1, 18, 6, '#d8c5b2');
    box(ctx, 1147, 170 + i * 13.1, 17, 6, '#d8c5b2');
  }
  box(ctx, 134, 169, 128, 63, '#333c67');
  label(ctx, 'CPU', 153, 202, 41, '#f8f6ff', 'Lesson Sans', 700);
  box(ctx, 1184, 169, 128, 63, '#57355d');
  label(ctx, 'NPU', 1202, 202, 41, '#fff5fb', 'Lesson Sans', 700);
}
let plate;
function siliconPlate() {
  if (!plate) {
    plate = createCanvas(1920, 580);
    drawSilicon(plate.getContext('2d'));
  }
  return plate;
}
function tile(ctx, x, y, v) {
  const w = 145,
    h = 85;
  ctx.save();
  ctx.shadowColor = 'rgba(47,33,47,.36)';
  ctx.shadowOffsetY = 6;
  ctx.shadowBlur = 11;
  box(ctx, x - w / 2, y - h / 2, w, h, '#29253d');
  ctx.restore();
  box(ctx, x - w / 2 + 4, y - h / 2 + 4, w - 8, h - 8, '#fff6cf');
  path(
    ctx,
    [
      [x - w / 2 + 10, y - h / 2 + 11],
      [x - w / 2 + 21, y - h / 2 + 11],
    ],
    '#ac985a',
    2,
  );
  label(ctx, String(v), x, y + 2, 60, '#252135', 'Lesson Mono', 600, 'center');
}
function placeValues(ctx, state) {
  const cy = 337;
  const halfX = 78 * (1 - smooth(clamp(2 * state.layout - 1)));
  const halfY = 47 * smooth(clamp(2 * state.layout));
  if (state.values.length === 1) {
    tile(ctx, state.x, cy, state.values[0]);
  } else {
    tile(ctx, state.x - halfX, cy - halfY, state.values[0]);
    tile(ctx, state.x + halfX, cy + halfY, state.values[1]);
  }
}
function chipLabel(ctx, s, x, color) {
  ctx.font = '600 33px "Lesson Sans"';
  const w = ctx.measureText(s).width + 44;
  box(ctx, x - w / 2, 438, w, 53, color);
  label(ctx, s, x, 465, 33, '#fff8f5', 'Lesson Sans', 600, 'center');
}
const rulerLeft = 324,
  unit = 55;
const xTime = (t) => rulerLeft + unit * t;
function drawTrace(ctx, row, index, ms, focusHandoffs) {
  const y = 727 + 90 * index;
  label(ctx, row.name, 96, y + 22, 40, pen, 'Lesson Sans', 600);
  path(
    ctx,
    [
      [rulerLeft, y + 22],
      [xTime(21.15), y + 22],
    ],
    '#d6cfd5',
    2,
  );
  for (const s of row.run.spans) {
    const end = Math.min(s.end, ms);
    if (end <= s.start) continue;
    const x = xTime(s.start),
      w = xTime(end) - x;
    const handoff = s.kind === 'handoff';
    box(ctx, x, y, w, 44, handoff ? colors.handoff : colors[s.device]);
    if (handoff) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, 44);
      ctx.clip();
      for (let j = 0; j < w + 44; j += 20) {
        path(
          ctx,
          [
            [x + j - 44, y + 44],
            [x + j, y],
          ],
          '#f3ac73',
          2.5,
        );
      }
      ctx.restore();
    }
    if (s.start && w > 2) box(ctx, x, y, 2.5, 44, '#faf3ef');
    if (end === s.end && w >= 52 && w <= 126) {
      label(
        ctx,
        String(s.end - s.start),
        x + w / 2,
        y + 23,
        31,
        '#fffaff',
        'Lesson Sans',
        700,
        'center',
      );
    }
    if (end === s.end && w > 126) {
      const caption = handoff
        ? focusHandoffs
          ? 'Handoff  ·  8 ms'
          : '8 ms'
        : s.end - s.start + ' ms';
      if (handoff) {
        ctx.font = '700 32px "Lesson Sans"';
        const backing = ctx.measureText(caption).width + 22;
        box(ctx, x + (w - backing) / 2, y + 3, backing, 38, '#e99457');
      }
      label(
        ctx,
        caption,
        x + w / 2,
        y + 23,
        32,
        handoff ? '#321c25' : '#fffaff',
        'Lesson Sans',
        700,
        'center',
      );
    }
  }
  if (ms === row.run.total) {
    box(ctx, 1773, y - 1, 73, 48, '#504a5a');
    box(ctx, 1776, y + 2, 67, 42, '#fff6cf');
    label(ctx, String(row.run.output[0]), 1809, y + 24, 37, pen, 'Lesson Mono', 600, 'center');
  }
  if (ms > 0) {
    const end = xTime(ms);
    path(
      ctx,
      [
        [end, y - 4],
        [end, y + 48],
      ],
      pen,
      3,
    );
    const completed = ms === row.run.total;
    const reading = completed ? String(ms) : (Math.floor(ms * 10) / 10).toFixed(1);
    label(ctx, reading + ' ms', end + 14, y + 23, completed ? 41 : 32, pen, 'Lesson Mono', 600);
  }
}

function draw(ctx, clock) {
  const { row, ms } = frameTime(clock);
  const state = stateAt(rows[row].run, ms);
  wash(ctx, 0, 0, 1920, 1080, [
    [0, '#eeeaf0'],
    [0.45, '#f7f2ec'],
    [1, '#e6e1e7'],
  ]);
  label(ctx, 'One step on a handheld', 88, 68, 53, pen, 'Lesson Serif', 500);
  ctx.drawImage(siliconPlate(), 0, 0);
  // Let the inactive side recede as the pair changes owner.
  box(ctx, 125, 160, 618, 343, `rgba(227,228,241,${0.1 + 0.3 * state.layout})`);
  box(ctx, 1174, 160, 619, 343, `rgba(237,220,233,${0.1 + 0.3 * (1 - state.layout)})`);
  if (clock.index === 3 && clock.reveal('Look where the final sum') > 0)
    chipLabel(ctx, 'Next: final sum', xChip.npu, '#5b3e5e');
  if (state.device === 'handoff') {
    if (clock.index === 3) chipLabel(ctx, 'Activation', xChip.cpu, '#333c67');
    if (clock.index === 1) chipLabel(ctx, 'Projection', xChip.npu, '#57355d');
    if (clock.index === 2 || clock.index === 4) chipLabel(ctx, 'Handoff', 960, '#89431f');
  } else {
    chipLabel(ctx, state.label, state.x, state.device === 'cpu' ? '#333c67' : '#57355d');
  }
  placeValues(ctx, state);
  label(ctx, 'Execution time', 94, 618, 45, pen, 'Lesson Serif', 500);
  label(
    ctx,
    'Example timings in milliseconds',
    1824,
    618,
    31,
    '#655f70',
    'Lesson Sans',
    500,
    'right',
  );
  path(
    ctx,
    [
      [rulerLeft, 701],
      [xTime(21.15), 701],
    ],
    '#7c7889',
    1.8,
  );
  for (let t = 0; t <= 21; t++) {
    const major = t % 5 === 0;
    path(
      ctx,
      [
        [xTime(t), 701],
        [xTime(t), major ? 686 : 694],
      ],
      '#7c7889',
      major ? 2.3 : 1.5,
    );
    if (major) label(ctx, String(t), xTime(t), 668, 30, '#554e60', 'Lesson Mono', 500, 'center');
  }
  label(ctx, 'Output', 1809, 673, 34, '#554e60', 'Lesson Sans', 600, 'center');
  for (let i = 0; i <= row; i++)
    drawTrace(ctx, rows[i], i, i === row ? ms : rows[i].run.total, clock.index >= 2);
}

function check() {
  assert.deepEqual([cpu.total, split.total, whole.total], [13, 21, 2.5]);
  for (const g of [cpu, split, whole]) assert.deepEqual(g.output, [2]);
  const crossings = split.spans.filter((s) => s.kind === 'handoff');
  assert.deepEqual(
    crossings.map((s) => [s.start, s.end, s.from, s.to]),
    [
      [1, 9, 'npu', 'cpu'],
      [12, 20, 'cpu', 'npu'],
    ],
  );
  assert.equal(
    crossings.reduce((t, s) => t + s.end - s.start, 0),
    16,
  );
  assert.deepEqual(stateAt(split, 0).values, [2, 1]);
  for (const ms of [1, 5, 9, 12, 13, 19, 20]) assert.deepEqual(stateAt(split, ms).values, [1, 1.5]);
  assert.equal(stateAt(split, 5).x, stateAt(split, 16).x);
  assert.equal(stateAt(split, 13).device, 'handoff');
  assert.deepEqual(stateAt(split, 21).values, [2]);
  assert.equal(
    whole.spans.some((s) => s.kind === 'handoff'),
    false,
  );
  assert.deepEqual(run(['npu', 'cpu', 'npu'], [1, 3]).spans[3].values, [0, 2]);
  return true;
}

export default { title, beats, draw, check };
