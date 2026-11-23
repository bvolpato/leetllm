import { roundedFormat } from '../arithmetic.mjs';
import { directed, mix } from '../construction.mjs';
import { drawAddedText as text } from '../defaults.mjs';

const formats = [
  { name: 'FP32', exponent: 8, fraction: 23, min: -126, max: 127 },
  { name: 'FP16', exponent: 5, fraction: 10, min: -14, max: 15 },
  { name: 'BF16', exponent: 8, fraction: 7, min: -126, max: 127 },
];
const start = 1;
const intended = start - 0.0001;
const previousHalf = start - 2 ** -11;
const stored = (format, value) => roundedFormat(value, format.fraction, format.min, format.max);

function weightRuler(ctx, state, api) {
  const { C, focus } = api;
  const x = (value) => 435 + ((value - 0.99944) / 0.00062) * 1240;
  const change = directed(state, 'precision-small-update', 0);
  const write = directed(state, 'precision-write', 1);
  const neighbors = directed(state, 'precision-spacing', 2);
  text(ctx, api, 'Two copies of one weight', 155, 282, 41, C.ink);
  focus.target('candidate', () => {
    text(ctx, api, 'Candidate', 150, 435, 35, C.yellow);
    api.line(ctx, x(0.99944), 420, x(1.00006), 420, C.muted, 2);
    api.line(ctx, x(start), 420, x(mix(start, intended, change)), 420, C.yellow, 6);
    api.circle(ctx, x(mix(start, intended, change)), 420, 14, C.yellow);
    if (change === 1) text(ctx, api, '0.9999', x(intended), 376, 35, C.yellow, 'center', true);
  });
  focus.target('stored-weights', () => {
    formats.slice(0, 2).forEach((format, index) => {
      const y = 565 + 145 * index;
      const color = index === 0 ? C.cyan : C.blue;
      const saved = stored(format, intended);
      text(ctx, api, format.name, 150, y + 10, 38, color);
      api.line(ctx, x(0.99944), y, x(1.00006), y, C.muted, 2);
      api.line(ctx, x(start), y - 30, x(start), y + 30, C.ink, 3);
      api.circle(ctx, x(mix(start, saved, write)), y, 16, color);
      if (write === 1)
        text(ctx, api, index === 0 ? '≈ ' + saved.toFixed(8) : String(saved),
          x(saved), y - 42, 35, color, 'center', true);
    });
  });
  focus.target('half-neighbors', () => {
    api.line(ctx, x(start), 740, x(start), 780, C.blue, 3);
    text(ctx, api, '1', x(start), 825, 35, C.blue, 'center', true);
    if (neighbors > 0) {
      const end = x(mix(start, previousHalf, neighbors));
      api.line(ctx, end, 763, x(start), 763, C.blue, 3);
      if (neighbors === 1) {
        api.line(ctx, end, 678, end, 781, C.blue, 4);
        text(ctx, api, String(previousHalf), end, 825, 33, C.blue, 'center', true);
        const mid = x((start + previousHalf) / 2);
        api.line(ctx, mid, 738, mid, 779, C.muted, 3);
        text(ctx, api, 'halfway', mid, 825, 30, C.muted, 'center');
      }
    }
  });
  if (state.beat === 0 && change === 1)
    text(ctx, api, 'Which stored weight will move?', 960, 945, 41, C.ink, 'center');
  if (state.beat === 2 && neighbors === 1)
    text(ctx, api, 'Nearest FP16 values below and at one', 960, 945, 35, C.ink, 'center');
}

function overflowRuler(ctx, state, api) {
  const { C, focus } = api;
  const x = value => 230 + (value - 65500) * 36;
  const maximum = 65504;
  const inside = directed(state, 'precision-last-finite', 4, 0.2, 0.45);
  const across = directed(state, 'precision-overflow-tie', 4, 0.58, 0.77);
  const value = maximum + 15 * inside + across;
  text(ctx, api, 'FP16   /   round to nearest, ties to even', 155, 282, 39, C.ink);
  focus.target('range-probe', () => {
    api.line(ctx, x(65500), 565, x(65539), 565, C.muted, 3);
    for (let v = maximum; v <= 65536; v++)
      api.line(ctx, x(v), 565, x(v), v % 4 === 0 ? 592 : 579, C.muted, 2);
    api.line(ctx, x(maximum), 528, x(maximum), 601, C.blue, 4);
    text(ctx, api, '65,504', x(maximum), 659, 39, C.blue, 'center', true);
    text(ctx, api, 'largest finite FP16', x(maximum), 717, 30, C.blue, 'center');
    api.line(ctx, x(65536), 528, x(65536), 601, C.muted, 3);
    text(ctx, api, '65,536', x(65536), 659, 39, C.muted, 'center', true);
    text(ctx, api, 'needs exponent 16', x(65536), 717, 30, C.muted, 'center');
    api.line(ctx, x(value), 463, x(value), 541, C.yellow, 5);
    api.circle(ctx, x(value), 558, 11, C.yellow);
    text(ctx, api, 'input  ' + Math.round(value).toLocaleString('en'), x(value), 426, 40,
      C.yellow, 'center', true);
    if (across === 1) {
      text(ctx, api, '65,520', x(value), 659, 39, C.pink, 'center', true);
      text(ctx, api, 'overflow threshold', x(value), 717, 30, C.pink, 'center');
    }
    const completed = inside === 1 && (across === 0 || across === 1);
    const result = stored(formats[1], value);
    const output = !completed ? '·' : Number.isFinite(result) ? result.toLocaleString('en') : '∞';
    text(ctx, api, 'Stored FP16', 550, 900, 39, C.muted);
    text(ctx, api, output, 1100, 908, 66, Number.isFinite(result) ? C.blue : C.pink, 'center', true);
  });
}

function formatRows(ctx, state, api) {
  const { C, focus } = api;
  const bits = directed(state, 'precision-bits', 3);
  text(ctx, api, 'One square per stored bit', 155, 280, 36, C.ink);
  text(ctx, api, 'sign', 350, 385, 30, C.pink);
  text(ctx, api, 'exponent', 525, 385, 30, C.yellow);
  text(ctx, api, 'fraction', 775, 385, 30, C.cyan);
  focus.target('bit-layout', () => {
    formats.forEach((format, i) => {
      const y = 452 + i * 150;
      text(ctx, api, format.name, 150, y + 46, 39, C.ink);
      const count = 1 + format.exponent + format.fraction;
      for (let bit = 0; bit < count; bit++) {
        const color = bit === 0 ? C.pink : bit <= format.exponent ? C.yellow : C.cyan;
        api.rect(ctx, 350 + bit * 28, y, 24, 55, bit < Math.ceil(bits * 32) ? color : C.panel, color, 1);
      }
      text(ctx, api, '1 + ' + format.exponent + ' + ' + format.fraction + ' bits',
        350, y + 103, 28, C.muted, 'left', true);
    });
  });
  focus.target('format-results', () => {
    text(ctx, api, 'Gap above 1', 1515, 385, 35, C.ink, 'center');
    formats.forEach((format, i) => {
      const gap = (2 ** -format.fraction).toPrecision(3);
      text(ctx, api, bits === 1 ? gap : '?', 1515, 498 + i * 150, 40, C.ink, 'center', true);
    });
  });
}

function compareStoredValues(ctx, state, api) {
  const { C, focus } = api;
  const range = directed(state, 'precision-range', 5, 0, 0.2);
  const update = directed(state, 'precision-compare-update', 5, 0.5, 0.7);
  const rowY = i => 460 + i * 175;
  formats.forEach((format, i) => {
    text(ctx, api, format.name, 230, rowY(i), 53, C.ink);
  });
  focus.target('format-results', () => {
    text(ctx, api, 'Store 70,000', 835, 300, 46, C.yellow, 'center');
    formats.forEach((format, i) => {
      const result = stored(format, 70000);
      const value = Number.isFinite(result) ? result.toLocaleString('en') : '∞';
      text(ctx, api, range === 1 ? value : '?', 835, rowY(i), 60,
        range === 1 && !Number.isFinite(result) ? C.pink : C.ink, 'center', true);
    });
  });
  focus.target('update-results', () => {
    text(ctx, api, 'Store 1 − 0.0001', 1460, 300, 46, C.cyan, 'center');
    formats.forEach((format, i) => {
      const result = stored(format, intended);
      const value = result === start ? String(start) : '≈ ' + result.toFixed(8);
      text(ctx, api, update === 1 ? value : '?', 1460, rowY(i), 48,
        update === 1 && result !== start ? C.cyan : C.ink, 'center', true);
    });
  });
}

export function drawPrecisionSlots(ctx, scene, state, api) {
  if (state.beat < 3) weightRuler(ctx, state, api);
  else if (state.beat === 3) formatRows(ctx, state, api);
  else if (state.beat === 4) overflowRuler(ctx, state, api);
  else compareStoredValues(ctx, state, api);
}

export default {
  id: 'precision-slots',
  draw: drawPrecisionSlots,
  cues: ['precision-small-update', 'precision-write', 'precision-spacing', 'precision-bits',
    'precision-last-finite', 'precision-overflow-tie', 'precision-range', 'precision-compare-update'],
};
