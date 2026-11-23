import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';

const title = 'Which window goes to the glazier?';
const beats = [
  {
    id: 'the-last-pane',
    say: 'Watch the red pane settle. See the little square of sky below it? A reasoning agent has arranged eight pieces of glass. They have to fill this opening exactly.',
    hold: 1.0,
  },
  {
    id: 'another-layout',
    say: 'Give the model a second try with the same pieces. Look at the red pane in its new drawing. This time it stands on end.',
    hold: 1.2,
  },
  {
    id: 'the-favorite',
    say: 'Suppose we ask a model to score both layouts. In this example it prefers the first. If the agent takes the higher score, which window will the glazier get?',
    hold: 1.5,
  },
  {
    id: 'count-the-glass',
    say: 'Follow the light across the first drawing. The checker counts the layers at each square. Red lies over blue here. That makes two layers. Down here the count is zero.',
    hold: 1.0,
  },
  {
    id: 'the-fit',
    say: 'Now check the second drawing. Each square needs exactly one layer. All sixteen have one. The agent can discard any layout that fails, then rank the ones that fit.',
    hold: 0.9,
  },
  {
    id: 'the-window',
    say: 'That second model call was test-time compute. It gave the agent another layout to choose from. Checking the fit put the lower-scoring window in the wall.',
    hold: 2.4,
  },
];

// Both layouts use the same eight dominoes. Coordinates are (column, row) from the top left.
const pieces = [
  { col: 0, row: 0, vertical: false, colors: ['#d9a125', '#ffdb65', '#edaa32'] },
  { col: 2, row: 0, vertical: true, colors: ['#286eac', '#81ceea', '#559bd4'] },
  { col: 3, row: 0, vertical: true, colors: ['#dbb841', '#fff3ae', '#f0dc7e'] },
  { col: 0, row: 1, vertical: true, colors: ['#1e8d91', '#7ce1c2', '#45b2ad'] },
  { col: 2, row: 2, vertical: false, colors: ['#377e9f', '#74d5d5', '#58babe'] },
  { col: 0, row: 3, vertical: false, colors: ['#367dae', '#88c7e3', '#60b1ca'] },
  { col: 2, row: 3, vertical: false, colors: ['#6658a0', '#c4a2d2', '#a08ebd'] },
  { col: 1, row: 1, vertical: false, colors: ['#c52d3d', '#ff8464', '#ec504c'] },
];

const candidates = [
  { name: 'A', score: 0.96, panes: pieces },
  { name: 'B', score: 0.82, panes: pieces.map((p, i) => i === 7 ? { ...p, vertical: true } : p) },
];

function cells(pane) {
  return [[pane.col, pane.row], [pane.col + Number(!pane.vertical), pane.row + Number(pane.vertical)]];
}

function inspect(layout) {
  const layers = Array.from({ length: 4 }, () => Array(4).fill(0));
  let inside = true;
  for (const pane of layout.panes) {
    for (const [col, row] of cells(pane)) {
      if (col < 0 || col >= 4 || row < 0 || row >= 4) inside = false;
      else layers[row][col]++;
    }
  }
  const single = layers.flat().filter(n => n === 1).length;
  return { layers, single, fits: inside && single === 16 };
}

function select(layouts) {
  return layouts.filter(p => inspect(p).fits).sort((a, b) => b.score - a.score)[0];
}

const checks = candidates.map(inspect);
const winner = select(candidates);
const favoriteByScore = candidates.reduce((best, next) => best.score >= next.score ? best : next);
const cell = 119;
const gridTop = -148;
const spacing = 800;
const clamp = x => Math.max(0, Math.min(1, x));
const smooth = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const tau = Math.PI * 2;

function random(seed) {
  let state = seed >>> 0;
  return () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
}

function gradient(ctx, x, y, xx, yy, stops) {
  const g = ctx.createLinearGradient(x, y, xx, yy);
  for (const [offset, color] of stops) g.addColorStop(offset, color);
  return g;
}

function polygon(ctx, points, fill, stroke, width = 1) {
  ctx.beginPath();
  for (const [i, [x, y]] of points.entries()) i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

// Each piece keeps its own drawn striae and bubbles when it turns in the other window.
const glass = [];
function glassTexture(i) {
  if (glass[i]) return glass[i];
  const w = 2 * cell, h = cell, scale = 2;
  const canvas = createCanvas(w * scale, h * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  const [dark, light, mid] = pieces[i].colors;
  ctx.fillStyle = gradient(ctx, 0, h, w, 0, [[0, dark], [0.3, mid], [0.55, light], [0.75, mid], [1, dark]]);
  ctx.fillRect(0, 0, w, h);
  const rnd = random(3189 + i * 57);
  const phase = rnd() * 6, slope = 0.14 + rnd() * 0.22;
  for (let n = -23; n < 42; n++) {
    const y = n * 4.8 + rnd() * 2;
    ctx.beginPath();
    for (let x = -4; x <= w + 4; x += 4) {
      const ripple = Math.sin(x / 64 + phase + y / 110) * 12 + Math.sin(x / 28 - y / 85) * 4;
      const yy = y + x * slope + ripple;
      if (x === -4) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.strokeStyle = n % 3 ? 'rgba(255,248,216,0.17)' : 'rgba(34,42,74,0.12)';
    ctx.lineWidth = 0.7 + rnd() * 3.2;
    ctx.stroke();
  }
  for (let n = 0; n < 90; n++) {
    const x = rnd() * w, y = rnd() * h, r = 0.35 + rnd() ** 3 * 2.8;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.4, r, 0.4, 0, tau);
    ctx.strokeStyle = 'rgba(53,42,67,0.20)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,242,.32)'; ctx.fillRect(x - r / 2, y - r / 2, r, 0.8);
  }
  ctx.strokeStyle = '#38383c'; ctx.lineWidth = 6; ctx.strokeRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,248,219,.64)'; ctx.lineWidth = 1.8; ctx.strokeRect(4, 4, w - 8, h - 8);
  glass[i] = canvas;
  return canvas;
}

function arch(ctx, x, y, r, bottom) {
  ctx.beginPath();
  ctx.moveTo(x - r, bottom);
  ctx.lineTo(x - r, y);
  ctx.arc(x, y, r, Math.PI, 2 * Math.PI);
  ctx.lineTo(x + r, bottom);
  ctx.closePath();
}

function makeBay() {
  const canvas = createCanvas(1360, 1620);
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2); ctx.translate(340, 450);
  const r = 271, spring = -120, bottom = gridTop + cell * 4 + 15;
  // The plaster reveal, the metal sash and the fixed fanlight surround the square design opening.
  for (const [extra, color] of [[23, '#b09378'], [19, '#f3d7ab'], [14, '#c6a37f'], [9, '#937a66'], [4, '#5f5a53'], [0, '#324b55']]) {
    arch(ctx, 0, spring, r + extra, bottom + extra * 0.4);
    ctx.fillStyle = color; ctx.fill();
  }
  ctx.save();
  arch(ctx, 0, spring, r - 7, bottom - 7); ctx.clip();
  ctx.fillStyle = gradient(ctx, -260, -400, 220, 300, [[0, '#89b8be'], [0.4, '#b1ebdf'], [0.65, '#fce6a4'], [1, '#83acae']]);
  ctx.fillRect(-r, -410, r * 2, 800);

  // Amber sunburst above the working area; the other colored panes are fixed in the sash.
  const rayCenter = [0, gridTop + 34];
  const colors = ['#e0bb66','#8ac4c8','#f2d493','#f6dfa3','#c4d8ce','#f8d380','#fbe7a5','#99c6c2','#eac57d'];
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + i * Math.PI / 9, b = a + Math.PI / 9;
    const pt = t => [460 * Math.cos(t), rayCenter[1] + 460 * Math.sin(t)];
    polygon(ctx, [rayCenter, pt(a), pt(b)], colors[i], '#53615c', 5);
  }
  for (const [offset, line, lw] of [[29, '#5a645b', 5], [43,'#f6e4b3',3],[100,'#74694f',6],[105,'#f8dd89',3]]) {
    ctx.beginPath(); ctx.arc(0, spring, r - offset, Math.PI, tau); ctx.strokeStyle = line; ctx.lineWidth = lw; ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(0, rayCenter[1], 95, Math.PI, tau);
  ctx.fillStyle = '#f5bb4d'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#776849'; ctx.stroke();

  for (const s of [-1,1]) {
    const x = s * (2 * cell + 14);
    ctx.fillStyle = gradient(ctx, x - 12, -180, x + 8, 300, [[0, '#76a6af'], [0.46, '#badbd4'], [1, '#e1ca8e']]);
    ctx.fillRect(x - 13, gridTop, 26, cell * 4);
    for (let k = 0; k < 4; k++) {
      const y = gridTop + (k + 0.5) * cell;
      polygon(ctx, [[x, y - 29], [x + 11, y], [x, y + 29], [x - 11, y]], '#e5b45b', '#526361', 2.8);
    }
  }
  const rnd = random(885);
  for (let i = 0; i < 900; i++) {
    const x = -265 + rnd() * 530, y = -400 + rnd() * 744;
    ctx.fillStyle = rnd() < 0.6 ? '#ffffff26' : '#403f4b15';
    ctx.fillRect(x, y, 1 + rnd() * 2, 0.8 + rnd() * 1.3);
  }
  ctx.fillStyle = '#5d625a'; ctx.fillRect(-2*cell - 5, gridTop - 5, 4*cell + 10, 4*cell + 10);
  ctx.fillStyle = gradient(ctx, -230, -148, 120, 327, [[0,'#dff1ed'],[0.58,'#fffef0'],[1,'#f4edcb']]);
  ctx.fillRect(-2*cell, gridTop, 4*cell, 4*cell);
  ctx.strokeStyle = '#c8d4cb'; ctx.lineWidth = 1.6;
  for (let k = 1; k < 4; k++) {
    ctx.beginPath(); ctx.moveTo((k-2)*cell, gridTop); ctx.lineTo((k-2)*cell, gridTop + 4*cell);
    ctx.moveTo(-2*cell, gridTop + k*cell); ctx.lineTo(2*cell, gridTop + k*cell); ctx.stroke();
  }
  ctx.restore();
  return canvas;
}

let bay;
let plaster;
function wallTexture() {
  if (plaster) return plaster;
  const canvas = createCanvas(384, 384), ctx = canvas.getContext('2d'), rnd = random(4711);
  for (let k = 0; k < 7800; k++) {
    ctx.fillStyle = k % 3 ? 'rgba(117,75,68,.09)' : 'rgba(255,249,214,.26)';
    ctx.fillRect(rnd() * 384, rnd() * 384, 0.8 + rnd() * 2.4, 1 + rnd());
  }
  plaster = canvas;
  return canvas;
}

function paintRoom(ctx) {
  ctx.fillStyle = gradient(ctx, -700, -500, 1300, 540, [[0,'#ffebc8'],[.48,'#e8ccad'],[.75,'#f5dfb9'],[1,'#cda98e']]);
  ctx.fillRect(-1600, -950, 4000, 2100);
  polygon(ctx, [[-1100,-680],[-610,-680],[1060,680],[500,680]], '#fff2cd45');
  polygon(ctx, [[480,-680],[815,-680],[2170,680],[1780,680]], '#fff2d350');
  ctx.fillStyle = ctx.createPattern(wallTexture(), 'repeat');
  ctx.fillRect(-1600, -950, 4000, 2100);
  for (const x of [-400, 400, 1200]) {
    ctx.fillStyle = gradient(ctx, x-39, 0, x+51, 0, [[0,'#bca48b00'],[.21,'#bf9f85'],[.24,'#f2dcbc'],[.76,'#ead1b1'],[.77,'#c9ae92'],[1,'#c9ae9200']]);
    ctx.fillRect(x-39,-940,90,1310);
    for (let i=-1; i<=1; i++) {
      ctx.fillStyle = '#c5aa915e'; ctx.fillRect(x+i*10-1,-940,2,1310);
    }
  }
  ctx.fillStyle = gradient(ctx, 0, 354, 0, 374, [[0,'#d8bea3'],[0.16,'#fff1d2'],[0.54,'#ebd4b5'],[0.64,'#9e8b7a'],[1,'#d6bda2']]);
  ctx.fillRect(-1600, 354, 4000, 20);
}

function putPane(ctx, pane, i, lift) {
  const x = (pane.col - 2 + 0.5) * cell, y = gridTop + (pane.row + 0.5) * cell;
  ctx.save();
  ctx.translate(x - lift * 64, y - lift * 104);
  ctx.rotate((pane.vertical ? Math.PI / 2 : 0) - lift * 0.21);
  if (lift > 0.01) {
    ctx.fillStyle = 'rgba(77,50,64,.18)'; ctx.fillRect(-cell/2 + lift*19, -cell/2 + lift*26, 2*cell, cell);
  }
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(glassTexture(i), -cell/2, -cell/2, 2*cell, cell);
  ctx.restore();
}

function label(ctx, text, x, y, size, color = '#38352f', family = 'Lesson Sans', weight = 500) {
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = weight + ' ' + size + 'px "' + family + '"';
  ctx.fillText(text, x, y);
}

function layerCheck(ctx, result, progress, highlight) {
  if (progress <= 0) return;
  const scanX = -2 * cell + progress * (cell * 4 + 38);
  if (progress < 1) {
    const w = 38;
    ctx.fillStyle = gradient(ctx, scanX - w, 0, scanX, 0, [[0,'#fff8d900'],[0.94,'#ffffdb97'],[1,'#fff9cf']]);
    ctx.fillRect(Math.max(scanX-w, -2*cell), gridTop, Math.max(0,Math.min(scanX,2*cell)-Math.max(scanX-w,-2*cell)), 4*cell);
  }
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const count = result.layers[row][col];
      const x = (col - 1.5) * cell, y = gridTop + (row + 0.5) * cell;
      if (scanX < x) continue;
      if (count !== 1) {
        ctx.beginPath(); ctx.arc(x, y, 35, 0, tau);
        ctx.fillStyle = '#352e3b'; ctx.fill();
        label(ctx, String(count), x, y, 49, '#fff4d9', 'Lesson Mono', 600);
        const emphasis = highlight[count];
        if (emphasis > 0) {
          ctx.save();
          ctx.globalAlpha = emphasis;
          ctx.strokeStyle = count === 0 ? '#9a4b3b' : '#ffe7ad';
          ctx.lineWidth = 3.5;
          ctx.strokeRect(x - cell / 2 + 6, y - cell / 2 + 6, cell - 12, cell - 12);
          ctx.restore();
        }
      } else {
        ctx.strokeStyle = '#fff6d7d9'; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(x-8, y); ctx.lineTo(x-2,y+6); ctx.lineTo(x+10,y-8); ctx.stroke();
      }
    }
  }
}

let sunPatch;
function transmittedLight() {
  if (sunPatch) return sunPatch;
  const canvas = createCanvas(680, 810), ctx = canvas.getContext('2d');
  ctx.translate(340, 450);
  arch(ctx, 0, -120, 271, 343);
  ctx.clip();
  ctx.fillStyle = '#583e44'; ctx.fillRect(-280, -400, 560, 760);
  const colors = ['#f5c97d', '#a6e5dd', '#ffe39a', '#ffecb3', '#e1eacb'];
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + i * Math.PI / 9, b = a + Math.PI / 9;
    const end = t => [460 * Math.cos(t), gridTop + 34 + 460 * Math.sin(t)];
    polygon(ctx, [[0, gridTop + 34], end(a), end(b)], colors[i % colors.length], '#bba876', 4);
  }
  ctx.fillStyle = '#fed88c'; ctx.fillRect(-260, gridTop, 520, 4 * cell);
  for (const [i, pane] of winner.panes.entries()) {
    const x = (pane.col - 2) * cell, y = gridTop + pane.row * cell;
    const w = (pane.vertical ? 1 : 2) * cell, h = (pane.vertical ? 2 : 1) * cell;
    ctx.fillStyle = gradient(ctx, x, y, x + w, y + h, [[0, pieces[i].colors[1]], [1, pieces[i].colors[2]]]);
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  }
  sunPatch = canvas;
  return canvas;
}

function installedWindow(ctx, clock) {
  const light = smooth(clock.elapsed / 1.8);
  ctx.fillStyle = gradient(ctx, 0, 30, 1920, 950, [[0,'#b18977'],[0.47,'#cbb09a'],[0.5,'#efd7b6'],[1,'#f1dbb6']]);
  ctx.fillRect(0, 0, 1920, 1080);
  polygon(ctx, [[0,0],[945,0],[945,849],[0,1010]], gradient(ctx,0,0,945,810,[[0,'#bda58f'],[.8,'#d0b69e'],[1,'#ad9182']]));
  ctx.save();
  ctx.transform(0.83, -0.15, 0.49, 0.74, 470, 538);
  ctx.globalAlpha = 0.64 + 0.22 * light;
  ctx.filter = 'blur(9px)';
  ctx.drawImage(transmittedLight(), -340, -450);
  ctx.restore();
  ctx.fillStyle = ctx.createPattern(wallTexture(), 'repeat');
  ctx.fillRect(0, 0, 1920, 1080);
  polygon(ctx, [[0,1010],[945,849],[1920,984],[1920,1080],[0,1080]], '#d5b592');
  polygon(ctx, [[0,1000],[945,839],[1920,974],[1920,984],[945,849],[0,1010]], '#998373');
  ctx.save();
  ctx.transform(1.03, 0.12, 0, 1.06, 1390, 457);
  bay ??= makeBay();
  ctx.drawImage(bay, -340, -450, 680, 810);
  for (const [i, pane] of winner.panes.entries()) putPane(ctx, pane, i, 0);
  label(ctx, 'Layout ' + winner.name + '   ·   Score ' + winner.score.toFixed(2), 0, 385, 40, '#433931', 'Lesson Serif');
  ctx.restore();
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  if (index === 5) { installedWindow(ctx, clock); return; }
  const pullBack = index === 0 ? 0 : index === 1 ? smooth(reveal('Give the model', 2.1)) : 1;
  const studyFirst = index === 3 ? smooth(elapsed / 1.5) : index === 4 ? 1 - smooth(elapsed / 1.45) : 0;
  const cameraX = mix(mix(0, spacing / 2, pullBack), 108, studyFirst);
  const scale = mix(mix(1.53, 1.16, pullBack), 1.36, studyFirst);
  const yAt = mix(mix(480, 447, pullBack), 397, studyFirst);
  const scoreAlpha = index < 2 ? 0 : index === 2 ? smooth(reveal('score both layouts', 0.5)) : 1;
  const firstScan = index < 3 ? 0 : index === 3 ? smooth(reveal('Follow the light', 2.7)) : 1;
  const secondScan = index < 4 ? 0 : index === 4 ? smooth(reveal('Now check', 2.6)) : 1;
  const makeSecond = index < 1 ? 0 : index === 1 ? smooth(reveal('a second try', 2.0)) : 1;
  const turnRed = index === 1 ? smooth(reveal('Look at the red pane', 1.15)) : Number(index > 1);
  const favorite = index === 2 ? smooth(reveal('it prefers the first', 0.55)) : index === 3 ? 1 - smooth(elapsed / 0.6) : 0;
  const openSquare = index === 3 ? smooth(reveal('Down here', 0.35)) : 0;
  const doubleSquare = index === 3 ? smooth(reveal('Red lies over blue', 0.35)) * (1 - openSquare) : 0;
  ctx.save();
  ctx.translate(960, yAt);
  ctx.scale(scale, scale);
  ctx.translate(-cameraX, 0);
  paintRoom(ctx);
  bay ??= makeBay();
  for (const [j, candidate] of candidates.entries()) {
    ctx.save(); ctx.translate(j * spacing, 0);
    ctx.drawImage(bay, -340, -450, 680, 810);
    for (const [i, pane] of candidate.panes.entries()) {
      if (j === 1 && i === 7 && turnRed === 0) continue;
      const enter = j === 0 ? 1 : i === 7 ? turnRed : smooth(makeSecond * 2.4 - i * 0.17);
      if (enter <= 0) continue;
      ctx.save(); ctx.globalAlpha = enter;
      const lift = j === 0 && i === 7 && index === 0 ? 1 - smooth(elapsed / 1.65) : 1 - enter;
      putPane(ctx, pane, i, lift);
      ctx.restore();
    }
    const scan = j === 0 ? firstScan : secondScan;
    layerCheck(ctx, checks[j], scan, { 0: openSquare, 2: doubleSquare });
    ctx.save();
    ctx.globalAlpha = j === 0 ? pullBack : makeSecond * (1 - smooth(studyFirst * 2.5));
    if (scoreAlpha < 1) {
      ctx.save(); ctx.globalAlpha *= 1 - scoreAlpha;
      label(ctx, 'Layout ' + candidate.name, 0, 414, 43, '#4b3e38', 'Lesson Serif');
      ctx.restore();
    }
    if (scoreAlpha > 0) {
      ctx.save(); ctx.globalAlpha *= scoreAlpha;
      label(ctx, candidate.name + '   ·   Score ' + candidate.score.toFixed(2), 0, 407, 47);
      if (candidate === favoriteByScore && favorite > 0) {
        ctx.strokeStyle = '#965d41'; ctx.lineWidth = 3.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(72,433); ctx.lineTo(72 + 86 * favorite,431); ctx.stroke();
      }
      if (scan >= 1) label(ctx, checks[j].single + ' of 16 with one layer', 0, 450, 35);
      ctx.restore();
    }
    ctx.restore();
    ctx.restore();
  }
  ctx.restore();
}

function check() {
  for (const candidate of candidates) {
    assert.equal(candidate.panes.length, 8);
    assert.equal(inspect(candidate).layers.flat().reduce((a,b) => a+b, 0), 16);
  }
  assert.equal(checks[0].layers[1][2], 2);
  assert.equal(checks[0].layers[2][1], 0);
  assert.equal(checks[0].single, 14);
  assert.equal(checks[1].single, 16);
  assert.ok(candidates[0].score > candidates[1].score);
  assert.equal(winner, candidates[1]);
  assert.equal(select(candidates.slice(0, 1)), undefined);
}

export default { title, beats, draw, check };
