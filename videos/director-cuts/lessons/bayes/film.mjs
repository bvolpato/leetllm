import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';

const title = 'Bayes through two shutters';
const beats = [
  {
    id: 'the-first-result',
    say: "There's the first result from our coding agent. A pass. Which of these two pass rates does that favor?",
    hold: 0.8,
  },
  {
    id: 'equal-light',
    say: 'Suppose the pass rate is either fifty or eighty percent. Give each an even chance to start. Each plate has a hundred equally likely holes. Pick a column for the first task and, independently, a row for the second.',
    hold: 0.6,
  },
  {
    id: 'across',
    say: 'Read across for the first task. A pass leaves five of the ten columns open on the left. Over on the right, eight columns stay lit. So far, the higher rate fits better.',
    hold: 1.0,
  },
  {
    id: 'another-result',
    say: 'Here comes the second result from the same mix of tasks. A failure. Which plate do you think will have more light left?',
    hold: 1.8,
  },
  {
    id: 'down',
    say: 'This time, read down. A failure fits five rows on the left. Look what happens on the right. At the higher pass rate, a failure fits just two rows. Which patch of light is bigger now?',
    hold: 1.0,
  },
  {
    id: 'the-overlap',
    say: 'Look at the square on the left. Five times five leaves twenty-five holes. The long strip on the right has eight times two, or sixteen. That one failure put the lower rate ahead.',
    hold: 0.7,
  },
  {
    id: 'the-share',
    say: "Bring the lit holes together. Bayes' rule gives each rate its share of the forty-one holes that fit both results. Twenty-five belong to the left plate. That gives the fifty percent rate about a sixty-one percent chance.",
    hold: 2.4,
  },
];

const divisions = 10;
const plates = [
  { center: 567, passColumns: 5 },
  { center: 1353, passColumns: 8 },
];
const pitch = 48;
const side = divisions * pitch;
const top = 324;
const clamp = (n) => Math.min(1, Math.max(0, n));
const ease = (n) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};

// The first independent draw selects a column. The second selects a row.
function opening(passColumns, first, second) {
  const cols = divisions - (divisions - passColumns) * first;
  const rows = divisions - passColumns * second;
  const lit = Math.floor(cols + 0.5) * Math.floor(rows + 0.5);
  return { cols, rows, lit };
}

function check() {
  const counts = (first, second) => plates.map((p) => opening(p.passColumns, first, second).lit);
  assert.deepEqual(counts(0, 0), [100, 100]);
  assert.deepEqual(counts(1, 0), [50, 80]);
  const matches = counts(1, 1);
  assert.deepEqual(matches, [25, 16]);
  const total = matches[0] + matches[1];
  const jointWeights = plates.map(({ passColumns }) => {
    const rate = passColumns / divisions;
    return 0.5 * rate * (1 - rate);
  });
  for (const [i, match] of matches.entries()) {
    const posterior = jointWeights[i] / (jointWeights[0] + jointWeights[1]);
    assert.ok(Math.abs(match / total - posterior) < 1e-12);
  }
  assert.deepEqual(
    matches.map((n) => Math.round((100 * n) / total)),
    [61, 39],
  );
}

function rect(c, x, y, w, h, color, radius = 0) {
  c.fillStyle = color;
  if (!radius) {
    c.fillRect(x, y, w, h);
    return;
  }
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
  c.fill();
}
function line(c, x, y, x2, y2, color, width = 1) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x2, y2);
  c.stroke();
}
function disc(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}
function grad(c, x, y, x2, y2, stops) {
  const g = c.createLinearGradient(x, y, x2, y2);
  for (const [position, color] of stops) g.addColorStop(position, color);
  return g;
}
function type(c, words, x, baseline, size, family, color, align = 'center', weight = 400) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.fillText(words, x, baseline);
}
function screw(c, x, y, angle) {
  disc(c, x, y + 2, 9, '#0b1111');
  disc(
    c,
    x,
    y,
    8,
    grad(c, x, y - 8, x, y + 8, [
      [0, '#d2ad83'],
      [0.43, '#736451'],
      [1, '#343732'],
    ]),
  );
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  line(c, -5, 0, 5, 0, '#232724', 2.5);
  c.restore();
}

function chassis() {
  const surface = createCanvas(1920, 1080);
  const c = surface.getContext('2d');
  rect(c, 0, 0, 1920, 1080, '#101918');
  const pool = c.createRadialGradient(640, 420, 80, 740, 450, 1190);
  pool.addColorStop(0, '#57574a');
  pool.addColorStop(0.65, '#343b32');
  pool.addColorStop(1, '#131d1b');
  rect(c, 0, 0, 1920, 1080, pool);
  rect(c, 124, 69, 1672, 926, '#101818', 48);
  rect(c, 122, 59, 1676, 923, '#758075', 45);
  rect(
    c,
    125,
    62,
    1670,
    915,
    grad(c, 200, 80, 1660, 987, [
      [0, '#42544b'],
      [0.42, '#283b36'],
      [1, '#172724'],
    ]),
    44,
  );
  c.save();
  c.beginPath();
  c.roundRect(128, 65, 1664, 908, 42);
  c.clip();
  // Fine flecks stay attached to the enamel during the pullback.
  let seed = 451;
  function next() {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  for (let i = 0; i < 20500; i++) {
    c.fillStyle = i % 2 ? 'rgba(205,220,190,.07)' : 'rgba(4,12,8,.12)';
    c.fillRect(125 + next() * 1670, 62 + next() * 915, 1 + 2 * next(), 1.5);
  }
  c.restore();
  for (const x of [165, 1755]) {
    screw(c, x, 99, 0.55);
    screw(c, x, 938, -0.34);
  }

  // Both viewing wells share the same lamp and the same physical scale.
  for (const { center, passColumns } of plates) {
    const x = center - side / 2;
    type(c, passColumns * 10 + '% pass rate', center, 289, 61, 'Serif', '#f2e6c9');
    rect(c, x - 28, top - 20, side + 56, side + 53, '#13201d', 15);
    rect(
      c,
      x - 26,
      top - 22,
      side + 52,
      side + 49,
      grad(c, x, top, x + side, top + side, [
        [0, '#a49c83'],
        [0.03, '#626a5e'],
        [0.45, '#373e35'],
        [1, '#8b8773'],
      ]),
      14,
    );
    rect(c, x - 9, top - 8, side + 18, side + 17, '#121b18', 5);
    for (let j = 0; j <= divisions; j++) {
      const mark = j % 5 === 0 ? 12 : 6;
      line(c, x + j * pitch, top + side + 10, x + j * pitch, top + side + 10 + mark, '#c6bea4', 2);
      line(c, x - 11, top + j * pitch, x - 11 - mark, top + j * pitch, '#c6bea4', 2);
    }
  }
  return surface;
}

function pinholes(lit) {
  const surface = createCanvas(side, side);
  const c = surface.getContext('2d');
  const tint = lit ? ['#5f4f33', '#393d32'] : ['#353e37', '#252e29'];
  rect(
    c,
    0,
    0,
    side,
    side,
    grad(c, 0, 0, side, side, [
      [0, tint[0]],
      [1, tint[1]],
    ]),
  );
  for (let i = 0; i < divisions; i++) {
    for (let j = 0; j < divisions; j++) {
      const x = (i + 0.5) * pitch,
        y = (j + 0.5) * pitch;
      if (lit) {
        const glow = c.createRadialGradient(x, y, 10, x, y, 27);
        glow.addColorStop(0, 'rgba(255,203,110,.30)');
        glow.addColorStop(1, 'rgba(255,198,102,0)');
        rect(c, x - 27, y - 27, 54, 54, glow);
      }
      disc(c, x, y + 1, 16.8, lit ? '#b7a17a' : '#586052');
      disc(c, x, y - 0.4, 16.3, '#202823');
      disc(
        c,
        x,
        y,
        13.8,
        lit
          ? grad(c, x, y - 14, x + 3, y + 14, [
              [0, '#ffedb9'],
              [0.58, '#ffda86'],
              [1, '#dba65c'],
            ])
          : '#151e1b',
      );
    }
  }
  return surface;
}

let art;
function artwork() {
  if (!art) art = { case: chassis(), dark: pinholes(false), light: pinholes(true) };
  return art;
}

function resultStrip(c, firstFeed, nextFeed) {
  const start = 470,
    end = 1230,
    y = 95,
    h = 104;
  rect(c, start - 14, y - 11, end - start + 28, h + 24, '#16221e', 14);
  rect(c, start - 8, y - 8, end - start + 16, h + 16, '#807d66', 9);
  c.save();
  c.beginPath();
  c.rect(start, y, end - start, h);
  c.clip();
  rect(
    c,
    start,
    y,
    end - start,
    h,
    grad(c, 0, y, 0, y + h, [
      [0, '#977341'],
      [0.14, '#dbb476'],
      [0.49, '#f1d59b'],
      [0.85, '#dbb77c'],
      [1, '#8d7045'],
    ]),
  );
  const position = 1336 - 327 * firstFeed - 357 * nextFeed;
  for (let j = -38; j < 20; j++) {
    const x = position + j * 30;
    for (const row of [y + 7, y + h - 17]) rect(c, x, row, 13, 10, '#283027', 2.5);
  }
  for (const [i, word] of ['PASS', 'FAIL'].entries()) {
    const x = position + i * 357;
    type(c, '0' + (i + 1), x - 82, y + 65, 33, 'Mono', '#5f4b30');
    type(c, word, x + 32, y + 72, 58, 'Mono', i ? '#7d3525' : '#253c32', 'center', 700);
    line(c, x - 130, y + 27, x - 130, y + h - 25, '#96733f', 1.7);
  }
  rect(
    c,
    start,
    y,
    60,
    h,
    grad(c, start, 0, start + 60, 0, [
      [0, '#29271d99'],
      [1, '#29271d00'],
    ]),
  );
  rect(
    c,
    end - 65,
    y,
    65,
    h,
    grad(c, end - 65, 0, end, 0, [
      [0, '#29271d00'],
      [1, '#29271d99'],
    ]),
  );
  c.restore();
  type(c, 'Coding agent', 1260, 157, 39, 'Sans', '#e8dec6', 'left');
  const axleX = 1656,
    axleY = 147;
  disc(c, axleX, axleY, 51, '#10201a');
  disc(
    c,
    axleX,
    axleY - 2,
    47,
    grad(c, axleX, axleY - 50, axleX, axleY + 50, [
      [0, '#ab997a'],
      [0.32, '#82765e'],
      [1, '#504b3d'],
    ]),
  );
  c.save();
  c.translate(axleX, axleY - 2);
  c.rotate(-1.7 * firstFeed - 2.1 * nextFeed);
  for (let i = 0; i < 6; i++) {
    c.rotate(Math.PI / 3);
    disc(c, 0, -27, 7, '#2b342b');
  }
  disc(c, 0, 0, 8, '#384238');
  c.restore();
}

function plateWindow(c, pictures, plate, state) {
  const x = plate.center - side / 2;
  const w = state.cols * pitch,
    h = state.rows * pitch;
  c.drawImage(pictures.dark, x, top);
  c.save();
  c.beginPath();
  c.rect(x, top, w, h);
  c.clip();
  c.drawImage(pictures.light, x, top);
  c.restore();

  // The blade edges remain visible against the covered portions of the plate.
  if (w < side - 0.2) {
    rect(c, x + w, top, Math.min(6, side - w), side, '#c8ba8a');
    rect(c, x + w + 1, top + side + 6, 3, 18, '#e9dab0');
  }
  if (h < side - 0.2) {
    rect(c, x, top + h, side, Math.min(6, side - h), '#c19779');
    rect(c, x - 23, top + h + 1, 15, 3, '#dfb49a');
  }
}

function traceDraw(c, center, col, row, opacity) {
  const left = center - side / 2;
  const x = left + 2 * pitch,
    y = top + 3 * pitch;
  c.save();
  c.strokeStyle = '#fff3d4';
  c.lineWidth = 3;
  c.globalAlpha = opacity;
  c.strokeRect(x + 2, top + 2, pitch - 4, (side - 4) * col);
  if (row > 0) {
    c.strokeRect(left + 2, y + 2, (side - 4) * row, pitch - 4);
    if (row > 0.27) {
      c.beginPath();
      c.arc(x + pitch / 2, y + pitch / 2, 18, 0, Math.PI * 2);
      c.stroke();
    }
  }
  c.restore();
}

function contactPrint(c, openings, travel, label) {
  const total = openings.reduce((sum, s) => sum + s.lit, 0);
  const spacing = 32,
    seam = 16;
  const left = (1920 - total * spacing - seam) / 2;
  const y = 863;
  c.save();
  c.globalAlpha = clamp(travel * 6);
  rect(c, left - 18, y - 20, total * spacing + seam + 36, 41, '#0e1915', 8);
  rect(c, left - 14, y + 18, total * spacing + seam + 28, 2, '#697367');
  const split = left + openings[0].lit * spacing + seam / 2;
  line(c, split, y - 17, split, y + 17, '#849083', 2.5);
  c.restore();
  let printed = 0;
  for (const [i, s] of openings.entries()) {
    const start = left + printed * spacing + (i ? seam : 0);
    const plateX = plates[i].center - side / 2;
    for (let row = 0; row < s.rows; row++) {
      for (let col = 0; col < s.cols; col++) {
        const k = row * s.cols + col;
        const u = ease(travel * 1.5 - (k / (s.lit - 1)) * 0.5);
        if (!u) continue;
        const x0 = plateX + (col + 0.5) * pitch,
          y0 = top + (row + 0.5) * pitch;
        const x1 = start + (k + 0.5) * spacing;
        const x = x0 + (x1 - x0) * u;
        const cy = y0 + (y - y0) * u;
        disc(c, x, cy, 14 - 3 * u, '#ffdf94');
      }
    }
    if (label > 0) {
      c.save();
      c.globalAlpha = label;
      const share = Math.round((100 * s.lit) / total);
      type(
        c,
        s.lit + ' / ' + total + '  ≈  ' + share + '%',
        start + (s.lit * spacing) / 2,
        944,
        51,
        'Mono',
        '#ffe2a1',
      );
      c.restore();
    }
    printed += s.lit;
  }
}

function draw(c, clock) {
  const pictures = artwork();
  const { index, elapsed, reveal } = clock;
  const firstFeed = index === 0 ? ease(elapsed / 1.2) : 1;
  const nextFeed = index < 3 ? 0 : index === 3 ? ease(elapsed / 1.1) : 1;
  const print = index === 6 ? reveal('Bring the lit holes together', 2.8) : 0;
  const normalized = index === 6 ? ease(reveal('its share', 0.8)) : 0;
  const colGuide = index === 1 ? ease(reveal('Pick a column', 0.9)) : 0;
  const rowGuide = index === 1 ? ease(reveal('a row', 0.85)) : 0;
  const openings = plates.map((p, i) => {
    const first =
      index < 2 ? 0 : index === 2 ? ease(reveal(i ? 'Over on the right' : 'Read across', 1.45)) : 1;
    const second =
      index < 4 ? 0 : index === 4 ? ease(reveal(i ? 'Look what happens' : 'This time', 1.4)) : 1;
    return opening(p.passColumns, first, second);
  });
  // Start close enough to read the film as it catches. Settle on both plates.
  const zoom = index === 0 ? 1 + 0.54 * (1 - ease((elapsed - 0.8) / 3)) : 1;
  c.save();
  c.translate(960, 145);
  c.scale(zoom, zoom);
  c.translate(-960, -145);
  c.drawImage(pictures.case, 0, 0);
  resultStrip(c, firstFeed, nextFeed);
  for (const [i, plate] of plates.entries()) {
    const state = openings[i];
    plateWindow(c, pictures, plate, state);
    if (colGuide > 0) {
      const fade = 1 - ease((elapsed - clock.speechDuration) / clock.beat.hold);
      traceDraw(c, plate.center, colGuide, rowGuide, fade);
    }
    c.save();
    c.globalAlpha = 1 - clamp(print * 8);
    type(c, state.lit + ' lit', plate.center, 905, 51, 'Mono', '#efdfb8');
    c.restore();
  }
  if (print > 0) contactPrint(c, openings, print, normalized);
  c.restore();
}

export default { title, beats, draw, check };
