import assert from 'node:assert/strict';
import { tokenTimes } from '../../../films/serving-benchmarks/fixtures.mjs';

const beats = [
  {
    id: 'pixels',
    say: 'Watch the space after the word “is.” Forty-two and its period arrive together. Could you tell from this screen when the server produced the first token?',
    hold: 1.0,
  },
  {
    id: 'deliveries',
    say: 'Replay the request in slow motion, starting when the client sends it. Three words arrive together at three hundred twenty milliseconds. The client waits another hundred sixty milliseconds for the rest of the text.',
    hold: 0.9,
  },
  {
    id: 'behind-the-screen',
    say: 'This time, watch the token trace from inside the server. There’s “The,” at two hundred forty milliseconds. The screen is still empty. Two more tokens follow, and now the client gets all three in one chunk.',
    hold: 1.1,
  },
  {
    id: 'other-history',
    say: 'Keep both deliveries in place. Suppose the server had produced that first token earlier. Would either delivery have to move with it?',
    hold: 1.5,
  },
  {
    id: 'same-pixels',
    say: 'Here, the first token moves back to a hundred sixty milliseconds. The first chunk still arrives at three hundred twenty. Either history fits the pixels you saw.',
    hold: 0.95,
  },
  {
    id: 'which-clock',
    say: 'Stop the replay where the first words appear. To benchmark the wait for text, time that first chunk from the moment the client sent the request. To time the first token, record when the server produces it.',
    hold: 2.4,
  },
];

const pieces = ['The', ' answer', ' is', ' 42', '.'];
const alternateFirst = 160;
const firstChunkEnd = 2;
const alternate = [alternateFirst, ...tokenTimes.slice(1)];

// In this fixture each chunk arrives when its last token is ready.
function deliveries(times) {
  return [
    { ms: times[firstChunkEnd], text: pieces.slice(0, firstChunkEnd + 1).join('') },
    { ms: times.at(-1), text: pieces.slice(firstChunkEnd + 1).join('') },
  ];
}

const chunks = deliveries(tokenTimes);
const first = chunks[0].ms;
const second = chunks[1].ms;
const gap = second - first;

function visibleReply(ms, events = chunks) {
  return events.filter((event) => event.ms <= ms).map((event) => event.text).join('');
}

function check() {
  assert.deepEqual(tokenTimes, [240, 280, 320, 440, 480]);
  assert.deepEqual(chunks, [{ ms: 320, text: 'The answer is' }, { ms: 480, text: ' 42.' }]);
  assert.equal(gap, 160);
  assert.equal(visibleReply(tokenTimes[0]), '');
  assert.equal(visibleReply(first), 'The answer is');
  assert.equal(visibleReply(second - 1), 'The answer is');
  assert.equal(visibleReply(second), 'The answer is 42.');
  assert.equal(tokenTimes[0] - alternate[0], 80);
  assert.ok(alternate.every((ms, i) => i === 0 || ms > alternate[i - 1]));
  assert.deepEqual(deliveries(alternate), chunks);
  for (const t of [...tokenTimes, ...alternate, 0, first - 1, second - 1]) {
    assert.equal(visibleReply(t, deliveries(alternate)), visibleReply(t));
  }
}

const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => clamp(x) ** 2 * (3 - 2 * clamp(x));
const mix = (a, b, u) => a + (b - a) * u;
const violet = '#413287';
const ink = '#242138';
const coral = '#a13526';
const lcdInk = '#142c54';
const font = { sans: '"Lesson Sans"', mono: '"Lesson Mono"' };

function rect(c, x, y, w, h, radius, fill) {
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
  c.fillStyle = fill;
  c.fill();
}

function line(c, points, stroke, width = 2) {
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.lineWidth = width;
  c.strokeStyle = stroke;
  c.stroke();
}

function label(c, str, x, y, size, color, options = {}) {
  c.font = (options.bold ? 'bold ' : '') + size + 'px ' + (options.mono ? font.mono : font.sans);
  c.fillStyle = color;
  c.textAlign = options.align ?? 'left';
  c.textBaseline = 'alphabetic';
  c.fillText(str, x, y);
}

function gradient(c, x0, y0, x1, y1, stops) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  for (const [offset, color] of stops) g.addColorStop(offset, color);
  return g;
}

// The client is a single pixel plane. Every glyph in a delivered chunk changes on the same frame.
const glyphs = {
  T: ['11111','00100','00100','00100','00100','00100','00100'],
  h: ['10000','10000','10110','11001','10001','10001','10001'],
  e: ['00000','00000','01110','10001','11111','10000','01111'],
  a: ['00000','00000','01110','00001','01111','10001','01111'],
  n: ['00000','00000','10110','11001','10001','10001','10001'],
  s: ['00000','00000','01111','10000','01110','00001','11110'],
  w: ['00000','00000','10001','10001','10101','10101','01010'],
  r: ['00000','00000','10110','11001','10000','10000','10000'],
  i: ['00100','00000','01100','00100','00100','00100','01110'],
  '4': ['00010','00110','01010','10010','11111','00010','00010'],
  '2': ['01110','10001','00001','00010','00100','01000','11111'],
  '.': ['00000','00000','00000','00000','00000','00110','00110'],
  ' ': ['00000','00000','00000','00000','00000','00000','00000'],
};

function pixels(c, reply) {
  const pitch = 13;
  const x = 258, y = 242;
  const count = 17 * 6 - 1;
  c.beginPath();
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < count; col++) {
      if (col % 6 === 5) continue;
      c.rect(x + col * pitch, y + row * pitch, 11.9, 11.9);
    }
  }
  c.fillStyle = 'rgba(56,76,115,0.077)';
  c.fill();
  c.beginPath();
  [...reply].forEach((letter, i) => {
    glyphs[letter].forEach((row, j) => {
      for (let k = 0; k < row.length; k++)
        if (row[k] === '1') c.rect(x + (6 * i + k) * pitch, y + j * pitch, 11.9, 11.9);
    });
  });
  c.fillStyle = lcdInk;
  c.fill();
  if (!reply.length) {
    c.fillRect(x, y + 7*pitch, 5*pitch-1, 7);
  }
}

function table(c) {
  c.fillStyle = gradient(c, 150, 0, 1690, 1080, [[0,'#faf8fa'],[0.55,'#eae6f1'],[1,'#d6d0e7']]);
  c.fillRect(0, 0, 1920, 1080);
  // Indirect daylight on the bench.
  c.fillStyle = gradient(c, 960, 0, 1590, 570, [[0,'#ffffff00'],[0.32,'#ffffff33'],[0.57,'#ffffff03'],[1,'#ffffff00']]);
  c.fillRect(0, 0, 1920, 1080);
}

function receiver(c, time, closeUp) {
  c.save();
  c.translate(960, 260);
  c.rotate(-0.027 * closeUp);
  const scale = 1 + 0.10 * closeUp;
  c.scale(scale, scale);
  c.translate(-960, -260 + closeUp * 247);
  // A short data lead disappears past the edge of the shot.
  c.beginPath();
  c.moveTo(1770, 264);
  c.bezierCurveTo(1850, 264, 1880, 244, 1940, 195);
  c.lineWidth = 24;
  c.strokeStyle = '#766c95';
  c.stroke();
  c.lineWidth = 6;
  c.strokeStyle = '#a99dbf';
  c.stroke();
  rect(c, 1744, 239, 77, 50, 8, '#55476f');
  for (let i = 0; i < 4; i++) rect(c, 1782 + 8*i, 244, 3, 40, 1, '#776989');
  // Two moulded layers with a narrow edge visible at the bottom.
  c.shadowColor = 'rgba(49,31,79,0.29)';
  c.shadowOffsetX = 8;
  c.shadowOffsetY = 18;
  c.shadowBlur = 24;
  rect(c, 130, 99, 1644, 342, 62, '#65597f');
  c.shadowColor = 'transparent';
  rect(c, 128, 79, 1648, 344, 61, gradient(c, 250, 80, 1360, 538,
    [[0,'#d9cef3'],[0.2,'#afa2d7'],[0.58,'#8d80b7'],[1,'#a799d2']]));
  rect(c, 134, 84, 1635, 328, 57, gradient(c, 300, 82, 360, 414,
    [[0,'#ede4fe'],[0.035,'#c7b9e5'],[0.35,'#bbaddb'],[0.97,'#bbaddb'],[1,'#cebee8']]));
  // The smoked acrylic edge shows a row of ribs near the plug.
  for (let i = 0; i < 7; i++) {
    rect(c, 1719, 177 + i * 20, 26, 6, 3, '#a497c3');
    rect(c, 1720, 178 + i * 20, 24, 2, 1, '#d7c9e9');
  }
  rect(c, 191, 123, 1510, 249, 27, '#86799f');
  rect(c, 195, 126, 1503, 243, 24, '#e4dbf1');
  rect(c, 199, 130, 1495, 235, 21, '#434560');
  rect(c, 205, 137, 1482, 221, 16, gradient(c, 800, 137, 800, 358,
    [[0,'#a9bfdc'],[0.10,'#c4daed'],[0.78,'#d9e9f3'],[1,'#ccdff0']]));
  c.fillStyle = gradient(c, 524, 137, 840, 355,
    [[0,'#ffffff00'],[0.13,'#ffffff33'],[0.6,'#ffffff14'],[1,'#ffffff00']]);
  c.fillRect(230, 143, 1425, 206);
  label(c, 'Client reply', 257, 205, 43, lcdInk, { bold: true });
  label(c, Math.floor(time) + ' ms since send', 1632, 205, 39, lcdInk, { align: 'right', mono: true });
  pixels(c, visibleReply(time));
  c.restore();
}

// The final replay stops on the first delivery. Magnify just that part of the same trace.
function traceScale(focus) {
  return (ms) => 475 + (ms - 120) * mix(3.25, 5.6, focus);
}

function rowName(c, text, y) {
  label(c, text, 135, y + 13, 43, ink, { bold: true });
}

function clientRow(c, time, gapOpacity, guideBottom, plotX) {
  const y = 565;
  rowName(c, 'Client chunks', y);
  line(c, [[plotX(120),y],[1710,y]], '#a39bae', 4);
  for (const { ms } of chunks) {
    if (time < ms) continue;
    const x = plotX(ms);
    if (guideBottom > y) {
      c.save();
      c.setLineDash([5, 9]);
      line(c, [[x, y+10],[x, guideBottom]], '#9790aa', 3);
      c.restore();
    }
    c.fillStyle = violet;
    c.beginPath();
    c.moveTo(x - 12,y - 8);
    c.lineTo(x + 12,y - 8);
    c.lineTo(x, y + 8);
    c.closePath();
    c.fill();
    label(c, ms + ' ms', x, y - 24, 45, violet, { align:'center', bold:true, mono:true });
  }
  if (gapOpacity > 0 && time >= second) {
    c.save();
    c.globalAlpha *= gapOpacity;
    const a = plotX(first), b = plotX(second), mid = (a+b)/2;
    line(c, [[a+22,y],[b-22,y]], violet, 3);
    label(c, gap + ' ms apart', mid, y + 52, 39, violet, { align:'center' });
    c.restore();
  }
}

function serverRow(c, name, times, time, y, plotX, fade = 1) {
  c.save();
  c.globalAlpha *= fade;
  rowName(c, name, y);
  const points = [[plotX(120),y]];
  times.forEach((at, idx) => {
    if (at > time) return;
    const x = plotX(at);
    points.push([x-9,y],[x-9,y-16],[x+9,y-16],[x+9,y]);
    label(c, pieces[idx].trim(), x, y-29, 39, idx === 0 ? coral : ink, { align:'center', bold:true });
  });
  points.push([1710,y]);
  line(c, points, '#615971', 4);
  if (time >= times[0]) {
    const x = plotX(times[0]);
    rect(c, x-10, y-18, 20, 19, 2, coral);
    label(c, Math.round(times[0]) + ' ms', x, y+48, 41, coral, { align:'center', mono:true, bold:true });
  }
  c.restore();
}

function draw(c, clock) {
  const { index, elapsed, reveal } = clock;
  const lift = index === 0 ? 0 : index === 1 ? ease(elapsed / 1.25) : 1;
  let time = second;
  let showGap = 0;
  let showTrace = 0;
  let other = 0;
  let shift = 0;
  let focus = 0;
  if (index === 0) {
    // Land on the leading edge of the first group of pixels after the course mark.
    time = mix(first - 3, first, clamp(elapsed / 0.16));
    time += gap * ease(reveal('the word', 0.9));
  } else if (index === 1) {
    time = first * ease(reveal('starting when', 1.75));
    time += gap * ease(reveal('another hundred', 1.35));
    showGap = reveal('for the rest', 0.35);
  } else if (index === 2) {
    showTrace = ease(elapsed / 0.55);
    time = tokenTimes[0] * ease(reveal('watch the token trace', 1.6));
    time += (first - tokenTimes[0]) * ease(reveal('Two more tokens follow', 1.2));
  } else if (index === 3) {
    showTrace = 1;
    time = first + gap * ease(elapsed / 0.65);
    other = ease(reveal('Suppose', 0.55));
  } else {
    showTrace = 1;
    other = 1;
    shift = index === 4 ? ease(reveal('the first token moves', 1.0)) : 1;
    if (index === 5) {
      time = mix(second, first, ease(elapsed / 0.75));
      focus = ease(reveal('where the first words appear', 1.1));
    }
  }

  table(c);
  if (lift > 0) {
    c.save();
    c.globalAlpha = lift;
    c.translate(0, (1-lift)*80);
    const plotX = traceScale(focus);
    clientRow(c, time, showGap, mix(575, mix(697, 831, other), showTrace), plotX);
    if (showTrace > 0) serverRow(c, 'Server trace', tokenTimes, time, 707, plotX, showTrace);
    if (other > 0) {
      const possible = [mix(tokenTimes[0], alternateFirst, shift), ...tokenTimes.slice(1)];
      serverRow(c, 'Possible trace', possible, time, 843, plotX, other);
    }
    c.restore();
  }
  receiver(c, time, 1-lift);
}

export default { title: 'When Did the First Token Appear?', beats, draw, check };
