import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

// Page P1 and record C use the two code lines in the original extraction fixture.
const page = {
  id: 'P1',
  navigation: ['Home', 'About', 'Subscribe'],
  code: 'def add(a, b):\n    return a + b',
};
const [header, body] = page.code.split('\n');
const trimmed = page.code.split('\n').map(line => line.trimStart()).join('\n');
const indent = body.length - body.trimStart().length;
const dice = [2, 3];
const call = `add(${dice.join(', ')})`;
const sum = dice[0] + dice[1];

const beats = [
  {
    id: 'the-copy',
    say: 'Follow the word return into the training record below. Every letter made it across. What happened at the start of the line?',
    hold: 1.3,
  },
  {
    id: 'load-the-record',
    say: 'Try loading that copy in Python. It stops on line two. The colon at the end of the first line tells Python to expect an indented body.',
    hold: 0.85,
  },
  {
    id: 'read-the-gap',
    say: 'Look at the same line on the web page. Count from the margin to the r. Four spaces put return inside the function. Our extractor trimmed the start of every line.',
    hold: 1,
  },
  {
    id: 'copy-the-block',
    say: 'We kept the original page, so we can make a fresh training record. Take just the code block. This time, copy its text exactly. Watch where the two return statements line up.',
    hold: 1,
  },
  {
    id: 'run-the-copy',
    say: "Try the two numbers on the page. Add two and three. There's our five. The record we send to the tokenizer now contains a working Python example.",
    hold: 2.5,
  },
];

const paper = '#fff2d6';
const ink = '#262146';
const blue = '#264aba';
const orange = '#db5035';
const light = '#fff4de';
const lilac = '#c9c6ff';
const coral = '#ffa58f';
const mint = '#a9eed7';
const margin = 854;
const codeSize = 73;
const topLine = 251;
const linePitch = 106;
const lowerLine = 635;
const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => { const t = clamp(n); return t * t * (3 - 2 * t); };

function label(ctx, text, x, y, size, family, color, weight = 400) {
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function rule(ctx, x, y, endX, endY, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function box(ctx, x, y, w, h, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}

function dot(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

// The two printed faces are also the operands used to test the extracted text.
function die(ctx, x, y, angle, value, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  box(ctx, -68, -59, 150, 149, 21, '#d1bca5');
  box(ctx, -72, -65, 150, 148, 21, ink);
  box(ctx, -75, -75, 150, 148, 21, color);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(-75, -75, 150, 148, 21);
  ctx.clip();
  // A small patch of half-tone ink shades the paper illustration.
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 28; col++) {
      dot(ctx, -76 + 6 * col + row % 2 * 3, 40 + row * 6, 0.6 + row * 0.25, '#221c4b54');
    }
  }
  ctx.restore();
  const offsets = value === 2 ? [-36, 36] : [-36, 0, 36];
  for (const p of offsets) {
    dot(ctx, p + 1.7, p + 2.3, 14.5, '#221c4b66');
    dot(ctx, p, p, 14.5, paper);
  }
  ctx.restore();
}

function surfaces(ctx) {
  const field = ctx.createLinearGradient(0, 470, 1550, 1080);
  field.addColorStop(0, '#3e3586');
  field.addColorStop(0.66, '#302965');
  field.addColorStop(1, '#26224e');
  ctx.fillStyle = field;
  ctx.fillRect(0, 0, 1920, 1080);
  const shadow = ctx.createLinearGradient(0, 465, 0, 496);
  shadow.addColorStop(0, '#18102d55');
  shadow.addColorStop(1, '#18102d00');
  ctx.fillStyle = shadow;
  ctx.fillRect(0, 465, 1920, 32);
  const stock = ctx.createLinearGradient(0, 0, 1900, 465);
  stock.addColorStop(0, '#f8e5c0');
  stock.addColorStop(0.45, paper);
  stock.addColorStop(1, '#fff8e6');
  ctx.fillStyle = stock;
  ctx.fillRect(0, 0, 1920, 465);
  ctx.fillStyle = orange;
  ctx.fillRect(0, 0, 1920, 14);
  rule(ctx, 98, 106, 1822, 106, '#59487159', 2);
  label(ctx, `Web page ${page.id}`, 104, 80, 39, 'Sans', ink, 600);
  ctx.save();
  ctx.textAlign = 'right';
  label(ctx, page.navigation.join('     '), 1815, 77, 31, 'Sans', '#655a70');
  ctx.restore();

  label(ctx, 'Add two numbers', 98, 216, 75, 'Serif', ink);
  die(ctx, 230, 329, -0.16, dice[0], blue);
  rule(ctx, 374, 332, 419, 332, ink, 7);
  rule(ctx, 396.5, 310, 396.5, 354, ink, 7);
  die(ctx, 544, 329, 0.105, dice[1], orange);

  label(ctx, 'Extracted training text', 105, 564, 34, 'Sans', lilac);
  label(ctx, 'Record C', 98, 660, 91, 'Serif', light);
}

function codeLine(ctx, line, x, baseline, onPage, size = codeSize) {
  const keyword = line.split(' ')[0];
  const rest = line.slice(keyword.length);
  const color = onPage ? blue : lilac;
  label(ctx, keyword, x, baseline, size, 'Mono', color);
  const keywordWidth = ctx.measureText(keyword).width;
  label(ctx, rest, x + keywordWidth, baseline, size, 'Mono', onPage ? ink : light);
}

function leftEdge(ctx, base, onPage) {
  const faint = onPage ? '#b9ab9b' : '#9590c1';
  const guide = onPage ? '#c0af9e' : '#736da6';
  rule(ctx, margin - 12, base - 66, margin - 12, base + linePitch + 11, guide, 2);
  ctx.save();
  ctx.textAlign = 'right';
  for (let row = 0; row < 2; row++) {
    label(ctx, String(row + 1), margin - 43, base - 8 + row * linePitch, 32, 'Mono', faint);
  }
  ctx.restore();
}

function spaces(ctx, base, cell, amount, onPage, start = margin, scale = 1) {
  for (let i = 0; i < indent; i++) {
    const visibility = ease(indent * amount - i);
    if (!visibility) continue;
    ctx.save();
    ctx.globalAlpha *= visibility;
    const left = start + cell * i;
    const color = onPage ? '#a64727' : mint;
    ctx.translate(left, base);
    ctx.scale(scale, scale);
    const width = cell / scale;
    box(ctx, 2, -58, width - 4, 67, 5, onPage ? '#eeb78366' : '#a9eed721');
    rule(ctx, 8, -15, 8, -8, color, 3);
    rule(ctx, 8, -8, width - 8, -8, color, 3);
    rule(ctx, width - 8, -8, width - 8, -15, color, 3);
    ctx.restore();
  }
}

function timing(clock) {
  const { index, elapsed, reveal } = clock;
  const trim = index === 0 ? ease(elapsed / 2.05) : 1;
  const diagnose = index > 0 ? (index === 1 ? reveal('loading that copy', 0.6) : 1) : 0;
  const count = index >= 2 ? (index === 2 ? reveal('Count from the margin', 1.5) : 1) : 0;
  const copy = index >= 3 ? (index === 3 ? reveal('copy its text exactly', 1.5) : 1) : 0;
  const test = index === 4 ? reveal('Try the two numbers', 0.65) : 0;
  const result = index === 4 ? reveal('Add two and three', 0.75) : 0;
  return { trim, diagnose, count, copy: ease(copy), test, result };
}

function detail(ctx, s) {
  // Match the page and file colors across the cut, then enlarge only line two.
  const start = 200;
  const size = 153;
  const scale = size / codeSize;
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, 1920, 465);
  ctx.fillStyle = orange;
  ctx.fillRect(0, 0, 1920, 14);
  ctx.fillStyle = '#342c72';
  ctx.fillRect(0, 465, 1920, 615);
  label(ctx, `Web page ${page.id}   /   line 2`, 120, 106, 43, 'Sans', ink, 600);
  label(ctx, 'Record C   /   line 2', 120, 580, 43, 'Sans', light, 600);
  ctx.font = `${size}px "Lesson Mono"`;
  const cell = ctx.measureText(' ').width;
  const gap = cell * indent;
  const top = 313;
  const bottom = 783;
  rule(ctx, start - 12, top - 135, start - 12, top + 16, '#ae9783', 4);
  rule(ctx, start - 12, bottom - 135, start - 12, bottom + 16, lilac, 4);
  codeLine(ctx, body.trimStart(), start + gap, top, true, size);
  spaces(ctx, top, cell, s.count, true, start, scale);
  ctx.save();
  ctx.globalAlpha = ease(s.count * 4 - 3);
  label(ctx, `${indent} spaces`, start, 410, 46, 'Sans', '#944328', 600);
  ctx.restore();
  // Reveal only whitespace that fits entirely to the left of the moving word.
  ctx.save();
  ctx.beginPath();
  ctx.rect(start, bottom - 140, gap * s.copy, 180);
  ctx.clip();
  spaces(ctx, bottom, cell, 1, false, start, scale);
  ctx.restore();
  codeLine(ctx, body.trimStart(), start + gap * s.copy, bottom, false, size);
  ctx.save();
  ctx.globalAlpha = s.count * (1 - s.copy);
  label(ctx, 'Line starts trimmed', start, 886, 46, 'Sans', coral, 500);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = s.copy;
  label(ctx, `${indent} spaces`, start, 886, 46, 'Sans', mint, 600);
  ctx.restore();
}

function draw(ctx, clock) {
  const s = timing(clock);
  if (clock.index === 2 || clock.index === 3) {
    detail(ctx, s);
    return;
  }
  surfaces(ctx);
  ctx.font = `${codeSize}px "Lesson Mono"`;
  const cell = ctx.measureText(' ').width;
  const fullIndent = indent * cell;
  leftEdge(ctx, topLine, true);
  leftEdge(ctx, lowerLine, false);
  codeLine(ctx, header, margin, topLine, true);
  codeLine(ctx, body.trimStart(), margin + fullIndent, topLine + linePitch, true);
  spaces(ctx, topLine + linePitch, cell, s.count, true);

  ctx.save();
  ctx.globalAlpha = ease(s.count * 4 - 3);
  label(ctx, `${indent} spaces`, margin, 419, 32, 'Sans', '#944328', 600);
  ctx.restore();

  // A fixed type grid makes the four-column displacement visible at either scale.
  codeLine(ctx, header, margin, lowerLine, false);
  const offset = fullIndent * (1 - s.trim + s.copy);
  codeLine(ctx, body.trimStart(), margin + offset, lowerLine + linePitch, false);
  spaces(ctx, lowerLine + linePitch, cell, s.copy, false);

  const error = s.diagnose * (1 - s.copy);
  ctx.save();
  ctx.globalAlpha = error;
  rule(ctx, margin - 12, lowerLine + linePitch - 64, margin - 12, lowerLine + linePitch + 10, coral, 7);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = s.copy;
  label(ctx, 'Keep code spacing', 106, 747, 39, 'Sans', mint, 500);
  ctx.restore();

  const response = Math.max(error, s.test);
  ctx.save();
  ctx.globalAlpha = response;
  rule(ctx, margin - 12, 802, 1812, 802, '#b0a9df69', 2);
  label(ctx, 'Python', margin - 9, 864, 32, 'Sans', lilac);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = error;
  label(ctx, 'IndentationError', margin + 139, 869, 53, 'Mono', coral);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = s.test;
  label(ctx, call, margin + 139, 869, 53, 'Mono', light);
  const arrowX = margin + 139 + ctx.measureText(call).width + 44;
  ctx.globalAlpha = s.result;
  rule(ctx, arrowX, 850, arrowX + 48, 850, mint, 4);
  rule(ctx, arrowX + 31, 837, arrowX + 48, 850, mint, 4);
  rule(ctx, arrowX + 31, 863, arrowX + 48, 850, mint, 4);
  label(ctx, String(sum), arrowX + 75, 877, 77, 'Mono', mint, 600);
  ctx.restore();
}

function check() {
  assert.equal(indent, 4);
  assert.equal(trimmed, 'def add(a, b):\nreturn a + b');
  assert.deepEqual(dice, [2, 3]);
  const probe = spawnSync('python3', ['-I', '-S', '-c', [
    'import json, sys',
    'flat, intact, args = json.load(sys.stdin)',
    'try:',
    '    compile(flat, "record-C.py", "exec")',
    'except IndentationError as exc:',
    '    failure = [type(exc).__name__, exc.lineno]',
    'else:',
    '    failure = None',
    'scope = {}',
    'exec(compile(intact, "record-C.py", "exec"), scope)',
    'print(json.dumps([failure, scope["add"](*args)]))',
  ].join('\n')], {
    encoding: 'utf8',
    input: JSON.stringify([trimmed, page.code, dice]),
    timeout: 5000,
  });
  if (probe.error) throw probe.error;
  assert.equal(probe.status, 0, probe.stderr);
  assert.deepEqual(JSON.parse(probe.stdout), [['IndentationError', 2], sum]);
}

export default { title: 'The four spaces before return', beats, draw, check };
