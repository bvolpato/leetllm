import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { taskRows } from '../../../films/hypothesis-testing/fixtures.mjs';

const title = 'How often would a fair contest give B eight wins or more?';
const beats = [
  {
    id: 'the-last-result',
    say: 'Watch the permission test. B passed it. A failed it. These two coding assistants each got one try on the same forty tasks.',
    hold: 0.65,
  },
  {
    id: 'the-thirteen-winners',
    say: 'On twenty-seven tasks they tied. Both passed or both failed. That leaves these thirteen, where just one assistant passed. Five went to A. Eight went to B.',
    hold: 1,
  },
  {
    id: 'the-question',
    say: 'Before the tests, we chose to look for an improvement by B. If the assistants were evenly matched, how often would B win at least eight of these thirteen?',
    hold: 1.4,
  },
  {
    id: 'change-one-winner',
    say: 'Keep those thirteen task positions. Under our null hypothesis, either assistant has an equal chance to win each one, independently of the others. Change that last B to an A. This pattern is just as likely as the first.',
    hold: 0.85,
  },
  {
    id: 'the-contact-sheet',
    say: 'Each position doubles the possibilities. Thirteen positions give us eight thousand one hundred ninety-two equally likely patterns. Put each one on the glass, from the fewest B wins on the left to the most on the right.',
    hold: 1.15,
  },
  {
    id: 'light-the-tail',
    say: 'Find the patterns with exactly eight B wins. Now light up the nines, the tens, all the way to thirteen. Every lit pattern matches the lead we saw or gives B a bigger one.',
    hold: 1.15,
  },
  {
    id: 'read-the-exposure',
    say: 'Two thousand three hundred eighty patterns light up. That’s about twenty-nine percent. This share is our one-sided p-value. Evenly matched assistants could produce a lead like this for B quite often. I’d want more evidence before switching.',
    hold: 2.6,
  },
];

const orderedIds = [29, 36, 30, 31, 37, 32, 38, 33, 34, 39, 35, 40, 2];
const strips = orderedIds.map(n => taskRows.find(row => row.id === 'T' + String(n).padStart(2, '0')));
const bit = (mask, i) => (mask >> i) & 1;
const observed = strips.reduce((mask, row, i) => mask | (row.b << i), 0);
const changed = observed ^ (1 << (strips.length - 1));
const wins = mask => strips.reduce((n, _, i) => n + bit(mask, i), 0);
const threshold = wins(observed);
const patterns = Array.from({ length: 2 ** strips.length }, (_, mask) => ({ mask, wins: wins(mask) }));
patterns.sort((a, b) => a.wins - b.wins || a.mask - b.mask);
const boundary = n => n > strips.length ? patterns.length : patterns.findIndex(p => p.wins === n);
const tailStart = boundary(threshold);
const tailCount = patterns.length - tailStart;
const probability = tailCount / patterns.length;
const ties = taskRows.filter(row => row.a === row.b).length;
const number = n => n.toLocaleString('en-US');

function check() {
  assert.equal(taskRows.length, 40);
  assert.equal(ties, 27);
  assert.deepEqual(new Set(strips), new Set(taskRows.filter(row => row.a !== row.b)));
  assert.equal(strips.at(-1).task, 'permission');
  assert.deepEqual([threshold, wins(changed)], [8, 7]);
  assert.equal(new Set(patterns.map(p => p.mask)).size, 8192);
  assert.deepEqual([boundary(9) - tailStart, tailCount], [1287, 2380]);
  assert.equal(Math.round(probability * 1000), 291);
}

const P = {
  ink: '#223534', dark: '#192b2a', sage: '#b9c9bd', paper: '#f9ead1',
  honey: '#ffc36e', amber: '#eeb368', red: '#812e23', metal: '#a5afa1',
};
const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const crop = { x: 146, y: 258, w: 1628, h: 490 };
const columns = 64;
const rows = patterns.length / columns;
const tileW = crop.w / columns;
const tileH = crop.h / rows;
const macroW = 1518;
const macroZoom = macroW / tileW;
const center = { x: 960, y: crop.y + crop.h / 2 };
const sample = patterns.findIndex(p => p.mask === changed);

function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
function round(c, x, y, w, h, radius, color) {
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
  c.fillStyle = color;
  c.fill();
}
function text(c, value, x, y, size, color, options = {}) {
  c.fillStyle = color;
  c.font = (options.weight || 400) + ' ' + size + 'px "Lesson ' + (options.face || 'Sans') + '"';
  c.textAlign = options.align || 'left';
  c.textBaseline = 'middle';
  c.fillText(value, x, y);
}
function gradient(c, x, y, x2, y2, stops) {
  const fill = c.createLinearGradient(x, y, x2, y2);
  stops.forEach(([p, color]) => fill.addColorStop(p, color));
  return fill;
}
function screw(c, x, y, angle) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.beginPath();
  c.arc(0, 1, 9, 0, 2 * Math.PI);
  c.fillStyle = '#44514a';
  c.fill();
  c.beginPath();
  c.arc(-1, -1, 7.5, 0, 2 * Math.PI);
  c.fillStyle = '#bbc3b4';
  c.fill();
  rect(c, -5.5, -1.3, 11, 2.6, '#68736a');
  c.restore();
}

let cabinet;
function lightTable() {
  if (cabinet) return cabinet;
  cabinet = createCanvas(1920, 1080);
  const c = cabinet.getContext('2d');
  rect(c, 0, 0, 1920, 1080, gradient(c, 0, 0, 1920, 1080,
    [[0, '#493a30'], [0.45, '#302522'], [1, '#1a1818']]));
  // The contact printer has a sloped enamel lip around the ground glass.
  c.shadowColor = '#0f0909';
  c.shadowBlur = 30;
  c.shadowOffsetY = 20;
  round(c, 56, 70, 1808, 863, 43, '#46534b');
  c.shadowColor = 'transparent';
  c.shadowOffsetY = 0;
  round(c, 56, 70, 1808, 845, 43, gradient(c, 0, 65, 1600, 920,
    [[0, '#edf0da'], [0.4, '#d8dcca'], [1, '#a3afa2']]));
  round(c, 99, 216, 1722, 575, 17, '#f1edd6');
  round(c, 100, 212, 1720, 575, 17, gradient(c, 0, 212, 1200, 780,
    [[0, '#45564f'], [0.3, '#738277'], [0.85, '#849285'], [1, '#b8c4b4']]));
  round(c, 116, 228, 1688, 541, 8, '#1c302e');
  round(c, 123, 235, 1674, 527, 5, gradient(c, 123, 235, 1797, 762,
    [[0, '#c4d2c0'], [0.25, '#eaf0db'], [0.62, '#fcf4e0'], [1, '#d9e4d1']]));
  for (const [x, y, a] of [[84,102,-0.48],[1835,102,0.7],[84,878,0.4],[1835,878,-0.28]]) screw(c, x, y, a);
  const grain = createCanvas(141, 103);
  const g = grain.getContext('2d');
  const pixels = g.createImageData(grain.width, grain.height);
  let seed = 291;
  for (let i = 0; i < pixels.data.length; i += 4) {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    const shade = seed & 128 ? 255 : 8;
    pixels.data.set([shade, shade, shade, 3 + (seed >>> 28)], i);
  }
  g.putImageData(pixels, 0, 0);
  rect(c, 0, 0, 1920, 1080, c.createPattern(grain, 'repeat'));
  return cabinet;
}

// One film frame carries the winners in task order. The close-up uses the same
// bit pattern as the tiny frame at its exact place on the complete contact sheet.
function strip(c, mask, x, y, w, { drop = 1, choices = 0, swap = 0, ids = false } = {}) {
  const h = w * tileH / tileW;
  const scale = w / macroW;
  const ink = '#233937';
  rect(c, x, y, w, h, ink);
  rect(c, x + w * 0.004, y + h * 0.023, w * 0.992, h * 0.009, '#79907f');
  const pitch = w * 0.957 / strips.length;
  const left = x + w * 0.0215;
  for (let i = 0; i < strips.length; i++) {
    const mid = left + (i + 0.5) * pitch;
    const size = pitch * 0.86;
    const mark = bit(mask, i);
    for (const sy of [0.093, 0.906]) {
      round(c, mid - pitch * 0.16, y + h * sy - 3.8 * scale, pitch * 0.32, 7.6 * scale, 2 * scale, '#e6e7cb');
    }
    c.save();
    c.translate(mid, y + h * 0.475);
    round(c, -size / 2, -size / 2, size, size, 5 * scale, '#111f20');
    if (i === strips.length - 1 && drop < 1) {
      c.translate(-60 * scale * (1 - drop), -330 * scale * (1 - drop));
      c.rotate(-0.18 * (1 - drop));
    }
    const last = i === strips.length - 1;
    function printWinner(b, dy, alpha) {
      c.save();
      c.translate(0, dy);
      c.globalAlpha *= alpha;
      round(c, -size / 2, -size / 2, size, size, 5 * scale, b ? P.amber : P.sage);
      if (w > 210) {
        rect(c, -size * 0.46, -size * 0.46, size * 0.92, 1.8 * scale, b ? '#ffdfa1' : '#dfebd7');
        text(c, b ? 'B' : 'A', 0, 0, 71 * scale, '#273832', { face: 'Serif', align: 'center' });
      }
      c.restore();
    }
    if (last && choices > 0) {
      const offset = 136 * scale * choices;
      printWinner(mark, -offset - 32 * scale * swap, 1 - swap);
      printWinner(1 - mark, offset * (1 - swap), choices);
      c.globalAlpha *= choices * (1 - swap);
      for (const direction of [-1, 1]) {
        text(c, '½', size * 0.73, offset * direction, 48 * scale, P.ink, { face: 'Serif' });
      }
    } else {
      printWinner(mark, 0, 1);
    }
    c.restore();
    if (ids) text(c, strips[i].id, mid, y + h * 0.785, 22 * scale, '#d9e1cc', { face: 'Mono', align: 'center' });
  }
}

const framePx = 28, framePy = 7;
const atlases = new Map();
function atlas(lit) {
  if (atlases.has(lit)) return atlases.get(lit);
  const panel = createCanvas(columns * framePx, rows * framePy);
  const c = panel.getContext('2d');
  const img = c.createImageData(panel.width, panel.height);
  const stock = lit ? [234,169,82] : [63,86,82];
  const aperture = lit ? [255,217,140] : [111,134,121];
  const emulsion = lit ? [198,135,65] : [80,105,97];
  const gutter = lit ? [176,125,69] : [50,72,68];
  patterns.forEach(({mask}, i) => {
    const x = Math.floor(i / rows) * framePx;
    const y = (i % rows) * framePy;
    for (let dy = 0; dy < framePy; dy++) {
      for (let dx = 0; dx < framePx; dx++) {
        const inner = dx >= 1 && dx <= 26 && dy >= 2 && dy <= 4;
        const color = dx === 27 || dy === 6 ? gutter : inner ? (bit(mask, Math.floor((dx - 1) / 2)) ? aperture : emulsion) : stock;
        const p = 4 * ((y + dy) * panel.width + x + dx);
        img.data[p] = color[0]; img.data[p + 1] = color[1]; img.data[p + 2] = color[2]; img.data[p + 3] = 255;
      }
    }
  });
  c.putImageData(img, 0, 0);
  atlases.set(lit, panel);
  return panel;
}

// The lens pulls back from one actual seven-win pattern to its neighbors.
// Working in tile coordinates keeps the same frame under the lens throughout.
function sheet(c, pull, litEnd) {
  const z = macroZoom ** (1 - pull);
  const w = tileW * z, h = tileH * z;
  const pan = (1 / z - 1 / macroZoom) / (1 - 1 / macroZoom);
  const focusX = mix(Math.floor(sample / rows) + 0.5, columns / 2, pan);
  const focusY = mix(sample % rows + 0.5, rows / 2, pan);
  const x0 = center.x - focusX * w, y0 = center.y - focusY * h;
  const x1 = Math.max(0, (crop.x - x0) / w), x2 = Math.min(columns, (crop.x + crop.w - x0) / w);
  const y1 = Math.max(0, (crop.y - y0) / h), y2 = Math.min(rows, (crop.y + crop.h - y0) / h);
  function expose(lit) {
    c.drawImage(atlas(lit), x1 * framePx, y1 * framePy, (x2 - x1) * framePx, (y2 - y1) * framePy,
      x0 + x1 * w, y0 + y1 * h, (x2 - x1) * w, (y2 - y1) * h);
  }
  c.save();
  const opening = ease(pull * 4.2);
  const gateW = mix(macroW, crop.w, opening);
  const gateH = mix(macroW * tileH / tileW, crop.h, opening);
  c.beginPath(); c.rect(center.x - gateW / 2, center.y - gateH / 2, gateW, gateH); c.clip();
  if (z > 7) {
    for (let x = Math.floor(x1); x < Math.ceil(x2); x++) {
      for (let y = Math.floor(y1); y < Math.ceil(y2); y++) {
        strip(c, patterns[x * rows + y].mask, x0 + x * w, y0 + y * h, w, { ids: z > 26 });
        rect(c, x0 + x * w, y0 + (y + 1) * h - 0.6, w, 0.6, '#acb9a6');
      }
    }
  } else {
    expose(false);
  }
  if (litEnd > tailStart) {
    c.beginPath();
    // Each whole column holds 128 distinct outcomes. Keep both partial columns.
    for (let x = Math.floor(tailStart / rows); x < Math.ceil(litEnd / rows); x++) {
      const start = Math.max(0, tailStart - x * rows);
      const end = Math.min(rows, litEnd - x * rows);
      c.rect(x0 + x * w, y0 + start * h, w, (end - start) * h);
    }
    c.clip();
    expose(true);
  }
  c.restore();
}

function draw(c, clock) {
  const { index, elapsed, reveal } = clock;
  const wide = index === 0 ? ease(reveal('These two coding assistants', 2.4)) : 1;
  const drop = index === 0 ? ease((elapsed + 0.32) / 1.16) : 1;
  const choices = index === 3 ? ease(reveal('either assistant', 0.9)) : Number(index > 3);
  const swap = index === 3 ? ease(reveal('Change that last B', 0.76)) : Number(index > 3);
  const pull = index === 4 ? ease(reveal('Each position doubles the possibilities', 5.7)) : Number(index > 4);
  let litEnd = tailStart;
  if (index === 5) {
    const eights = ease(reveal('Find the patterns', 1.55));
    const more = ease(reveal('Now light up', 2.8));
    litEnd += Math.round((boundary(9) - tailStart) * eights + (patterns.length - boundary(9)) * more);
  } else if (index > 5) litEnd = patterns.length;

  c.drawImage(lightTable(), 0, 0);
  const top = index < 3 ? 'Paired coding tasks' : 'The equal-chance model';
  text(c, top, 143, 149, 61, P.ink, { face: 'Serif' });
  if (index > 1) {
    text(c, 'Observed', 1435, 132, 25, '#42574c');
    text(c, threshold + ' B wins in ' + strips.length, 1433, 170, 37, P.ink, { weight: 600 });
  } else {
    text(c, 'One try per assistant', 1772, 152, 39, P.ink, { align: 'right' });
  }

  c.save();
  c.beginPath(); c.rect(123,235,1674,527); c.clip();
  if (index < 4) {
    const w = mix(macroW * 1.95, macroW, wide);
    const lastCenter = 0.0215 + 12.5 * 0.957 / 13;
    const left = mix(1373 - w * lastCenter, center.x - w / 2, wide);
    const h = w * tileH / tileW;
    const y = center.y - h / 2;
    strip(c, observed, left, y, w, { ids: true, drop, swap, choices });
    if (index === 0 && wide < 1) {
      c.globalAlpha = 1 - wide;
      const mid = left + w * lastCenter;
      c.fillStyle = P.red;
      c.beginPath(); c.moveTo(mid - 12, y - 15); c.lineTo(mid + 12, y - 15); c.lineTo(mid, y - 1); c.fill();
      c.globalAlpha = 1;
    }
  } else {
    c.save();
    c.translate(0, center.y);
    c.scale(1, 1 - 0.20 * pull);
    c.translate(0, -center.y);
    sheet(c, pull, litEnd);
    c.restore();
  }
  c.restore();

  const base = 848;
  if (index === 0 && wide < 0.5) {
    text(c, 'Permission test', 145, base, 47, P.ink, { face: 'Serif' });
    if (drop === 1) text(c, 'B passed', 1770, base, 48, P.red, { align: 'right' });
  } else if (index === 2) {
    text(c, 'How often would B win eight or more?', 145, base, 52, P.ink, { face: 'Serif' });
  } else if (index < 2) {
    text(c, index === 0 ? '40 tasks' : ties + ' ties set aside', 145, base, 48, P.ink, { face: 'Serif' });
    const tally = index === 0 ? 0 : index === 1 ? ease(reveal('Five went to A', 0.5)) : 1;
    if (tally) {
      c.globalAlpha = tally;
      text(c, (strips.length - threshold) + ' A wins', 1215, base, 47, P.ink);
      c.globalAlpha = 1;
    }
    const showB = index === 1 ? ease(reveal('Eight went to B', 0.5)) : Number(index > 1);
    if (showB) {
      c.globalAlpha = showB;
      text(c, threshold + ' B wins', 1772, base, 47, P.red, { align: 'right', weight: 600 });
      c.globalAlpha = 1;
    }
  } else if (index === 3) {
    const open = choices > 0.1 && swap < 0.95;
    text(c, open ? 'Two possible winners on the same task' : 'One possible pattern', 145, base, 48, P.ink, { face: 'Serif' });
    if (!open) text(c, (swap < 0.5 ? threshold : wins(changed)) + ' B wins', 1772, base, 48, P.ink, { align: 'right' });
  } else {
    const full = ease((pull - 0.75) * 4);
    if (full > 0) {
      c.globalAlpha = full;
      text(c, 'B wins per pattern', crop.x, 265, 38, P.ink, { weight: 600 });
      for (const n of [0, 5, 6, 7, 8, 9, 13]) {
        const x = crop.x + crop.w * (boundary(n) + boundary(n + 1)) / (2 * patterns.length);
        text(c, String(n), x, 731, 38, P.ink, { face: 'Mono', align: 'center' });
      }
      if (litEnd > tailStart) {
        const x = crop.x + Math.floor(tailStart / rows) * tileW;
        const end = crop.x + Math.ceil(litEnd / rows) * tileW;
        const a = clamp((litEnd - tailStart) / 200);
        c.globalAlpha = a;
        c.strokeStyle = P.red;
        c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(x, 305); c.lineTo(x, 292); c.lineTo(end, 292); c.lineTo(end, 305); c.stroke();
        if (litEnd >= boundary(9)) {
          const label = litEnd === boundary(9) ? '8 B wins' : '8 or more B wins';
          text(c, label, (x + end) / 2, 265, 38, P.red, { align: 'center', weight: 600 });
        }
      }
      c.globalAlpha = 1;
    }
    if (index === 4 && pull < 0.75) {
      text(c, 'One space for every pattern', 145, base, 49, P.ink, { face: 'Serif' });
    } else if (index === 4) {
      text(c, number(patterns.length) + ' patterns', 145, base, 49, P.ink, { face: 'Serif' });
      text(c, 'Fewest to most B wins  →', 1772, base, 42, P.ink, { align: 'right' });
    } else if (index === 5) {
      text(c, 'At least ' + threshold + ' B wins', 145, base, 49, P.ink, { face: 'Serif' });
      text(c, number(litEnd - tailStart) + ' lit', 1772, base, 50, P.red, { align: 'right', face: 'Mono' });
    } else {
      text(c, number(tailCount) + ' of ' + number(patterns.length) + ' patterns', 145, base, 52, P.ink, { face: 'Serif' });
      const result = ease(reveal('about twenty-nine percent', 0.6));
      if (result) {
        c.globalAlpha = result;
        text(c, 'p ≈ ' + Math.round(100 * probability) + '%', 1772, base - 2, 64, P.red, { align: 'right', face: 'Serif' });
        c.globalAlpha = 1;
      }
    }
  }
}

export default { title, beats, draw, check };
