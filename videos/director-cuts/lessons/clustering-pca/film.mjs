import assert from 'node:assert/strict';
import { pca2 } from '../../../films/clustering-pca/arithmetic.mjs';
import { transferDocuments, transferQuery } from '../../../films/clustering-pca/fixtures.mjs';

// A contact print of the original five-page collection. A key's eye locates the page.
const pages = transferDocuments.map((page, i) => ({
  ...page,
  label: ['Billing policy', 'Billing help', 'Sign-in help', 'Release policy', 'Runbook'][i],
}));
const fit = pca2(pages.map(page => page.point));
function score(point) {
  return point.reduce((sum, v, j) => sum + (v - fit.mean[j]) * fit.vector[j], 0);
}
function search(dimensions) {
  const rows = pages.map(page => ({
    page,
    distance: dimensions === 1 ? Math.abs(score(page.point) - score(transferQuery))
      : Math.hypot(...page.point.map((v, j) => v - transferQuery[j])),
  }));
  const minimum = Math.min(...rows.map(row => row.distance));
  return rows.filter(row => Math.abs(row.distance - minimum) < 1e-10);
}
const full = search(2);
const onStrip = search(1);
const scores = [...new Set(pages.map(page => score(page.point)))];
const retained = (fit.varianceKept * 100).toFixed(1);

const beats = [
  { id: 'finder', say: '“My sign-in code keeps failing.” Follow the brass finder. Each key marks a help page on this map. The hole in the sign-in key sits closest to the query.', hold: 0.8 },
  { id: 'five-keys', say: 'Pull back to all five pages. See how far apart the two policy pages sit? PCA looks for the direction with the greatest variance across the pages. Here that first principal component runs left to right.', hold: 0.7 },
  { id: 'contact-print', say: 'Left to right accounts for nearly ninety-eight percent of the variance. Suppose we keep just that coordinate for search. Watch the holes print onto the strip below.', hold: 1.55 },
  { id: 'register', say: 'Five pages left just three marks. Project the query the same way. Look at the middle mark. Which of those keys would you pick?', hold: 1.7 },
  { id: 'first-match', say: 'Billing help, sign-in help, and the runbook all tie at distance zero. If we take the first stored match, we send someone with a sign-in problem to billing help.', hold: 1.0 },
  { id: 'height', say: 'Bring back the height from the original map. Look at that little gap. Sign-in help is just two tenths of a unit from the query. That sliver of vertical spread lets us pick the right page.', hold: 2.5 },
];

const cream = '#f6ecca';
const gold = '#ffcc69';
const ink = '#16364c';
const clip = v => Math.max(0, Math.min(1, v));
const ease = v => { const n = clip(v); return n * n * (3 - 2 * n); };
const lerp = (a, b, n) => a + (b - a) * n;
const dot = (ctx, x, y, r, color) => {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
};
function line(ctx, points, color, width = 2) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(...points[0]);
  for (const p of points.slice(1)) ctx.lineTo(...p);
  ctx.stroke();
}
function type(ctx, value, x, y, size, color, options = {}) {
  ctx.font = `${options.italic ? 'italic ' : ''}${options.weight || '400'} ${size}px "Lesson ${options.family || 'Sans'}"`;
  ctx.fillStyle = color; ctx.textAlign = options.align || 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
}
function gradient(ctx, x1, y1, x2, y2, stops) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [p, color] of stops) g.addColorStop(p, color);
  return g;
}
function polygon(ctx, points, color) {
  ctx.beginPath(); ctx.moveTo(...points[0]);
  for (const p of points.slice(1)) ctx.lineTo(...p);
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}

// Fixed grain and brush edges stay registered to the physical sheet at every frame.
let seed = 47;
function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
const grain = Array.from({ length: 1650 }, () => [random() * 1920, random() * 950, 0.5 + random() * 2.3]);
const edges = Array.from({ length: 215 }, (_, i) => [78 + i * 8.25, 4 * random() + Math.sin(i / 13) * 2.4]);
function board(ctx) {
  ctx.fillStyle = gradient(ctx, 0, 0, 540, 1080, [[0, '#403832'], [0.7, '#26282a'], [1, '#1a2024']]);
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.save(); ctx.shadowColor = '#101216b8'; ctx.shadowBlur = 23; ctx.shadowOffsetY = 13;
  polygon(ctx, [[45, 39], [1870, 47], [1875, 891], [52, 903]], '#dfd8bd'); ctx.restore();
  ctx.fillStyle = gradient(ctx, 34, 0, 1840, 910, [[0, '#fff3d8'], [0.55, '#f1e7ca'], [1, '#dcd2b2']]);
  ctx.fillRect(55, 42, 1811, 850);
  const blue = ctx.createRadialGradient(870, 345, 50, 1030, 435, 1080);
  blue.addColorStop(0, '#296a8d'); blue.addColorStop(0.52, '#174d78'); blue.addColorStop(1, '#102f51');
  polygon(ctx, [...edges.map(([x, n]) => [x, 144 + n]), ...edges.toReversed().map(([x, n]) => [x, 841 - n])], blue);
  for (let i = 0; i < grain.length; i++) {
    const [x, y, r] = grain[i];
    ctx.fillStyle = i % 3 === 0 ? '#f6f0ce19' : '#0a253b19';
    ctx.fillRect(x, y, r * 2.1, r);
  }
  for (let i = 0; i < 12; i++) {
    const x = 82 + (i * 317) % 1240;
    line(ctx, [[x, 145 + i % 4], [x + 155 + (i * 79) % 409, 146 + i % 4]], '#6085a480', 2);
  }
  type(ctx, '“My sign-in code keeps failing.”', 111, 113, 49, ink, { family: 'Serif' });
}

// Bow, shank and bitting remain different on each photogram, even when the holes share x.
function key(ctx, x, y, scale, index, left, selected) {
  ctx.save(); ctx.translate(x, y); ctx.scale(left ? -scale : scale, scale);
  const impression = selected ? gradient(ctx, 0, -22, 3, 28, [[0, '#fff0b2'], [0.58, '#fed27c'], [1, '#cf9749']])
    : gradient(ctx, 0, -30, 9, 32, [[0, '#fff5cd'], [0.72, '#e9e1bd'], [1, '#c5cebb']]);
  ctx.fillStyle = impression;
  const stems = [84, 75, 91, 81, 103];
  const length = stems[index];
  const teeth = [[12, 20, 10], [21, 10, 16], [12, 24, 19], [20, 14, 24], [20, 10, 25]][index];
  const outline = [[6, -5], [length, -5], [length + 4, -2], [length + 4, teeth[0]], [length - 4, teeth[0]], [length - 4, 7], [length - 9, 7], [length - 9, teeth[1]], [length - 18, teeth[1]], [length - 18, teeth[2]], [length - 25, teeth[2]], [length - 25, 4], [6, 4]];
  polygon(ctx, outline, impression);
  ctx.beginPath();
  if (index === 2) {
    ctx.moveTo(23, 0); ctx.bezierCurveTo(23, -13, 11, -18, 3, -17);
    ctx.bezierCurveTo(-2, -30, -25, -22, -22, -8); ctx.bezierCurveTo(-36, -1, -28, 18, -15, 16);
    ctx.bezierCurveTo(-7, 29, 11, 20, 12, 13); ctx.bezierCurveTo(19, 12, 23, 7, 23, 0);
  } else if (index === 1) {
    ctx.roundRect(-22, -18, 44, 36, 7);
  } else if (index === 4) {
    ctx.moveTo(-24, 0); ctx.lineTo(-4, -22); ctx.lineTo(22, -7); ctx.lineTo(22, 7); ctx.lineTo(-4, 22);
  } else ctx.ellipse(0, 0, 25, 19 + index, 0, 0, Math.PI * 2);
  ctx.closePath(); ctx.fillStyle = impression; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, 12.2, 0.15, Math.PI * 1.9); ctx.strokeStyle = '#969e91a6'; ctx.lineWidth = 0.9; ctx.stroke();
  dot(ctx, 0, 0, 8.5, '#174e70');
  for (const dx of [24, 28]) {
    ctx.fillStyle = impression; ctx.fillRect(dx, -6.3, 2.4, 12.4);
    line(ctx, [[dx + 2.4, -5.8], [dx + 2.4, 5.3]], '#7d979c83', 0.8);
  }
  line(ctx, [[25, -2.2], [length - 4, -2.2]], '#9dbcc08c', 1.8);
  ctx.restore();
}

function state(clock) {
  const { index, elapsed, reveal } = clock;
  const cue = (i, phrase, seconds) => index < i ? 0 : index > i ? 1 : ease(reveal(phrase, seconds));
  const wide = cue(1, 'Pull back', 2.8);
  const strip = cue(2, 'Suppose we keep', 1.2);
  const print = cue(2, 'Watch the holes', 3.15);
  const queryPrint = cue(3, 'Project the query', 1.6);
  const tie = cue(4, 'If we take', 1.4);
  const restore = cue(5, 'Bring back', 2.8);
  const near = cue(5, 'Look at that little gap', 1.9);
  const open = cue(0, 'Each key marks', 2.9);
  const middle = cue(3, 'Look at the middle mark', 2.0);
  const overview = lerp(lerp(380, 78, open), 34, wide);
  const units = lerp(lerp(overview, 60, middle), 475, restore);
  const startY = lerp(476 + 3 * 380, 513, open);
  const origin = lerp(lerp(lerp(startY, 450, wide), 435, middle), 470 + 3 * 475, restore);
  return { wide, open, middle, strip: strip * (1 - restore), print: print * (1 - restore),
    queryPrint: queryPrint * (1 - restore), tie: tie * (1 - restore), restore, near,
    retained: cue(2, 'Left to right', 0.7) * (1 - middle),
    intro: index === 0 ? 1 - ease(elapsed / 1.85) : 0,
    units, origin, point: ([x, y]) => [960 + units * x, origin - units * y] };
}

function stripPaper(ctx, s) {
  const y = 834 - s.strip * 146;
  if (s.strip <= 0) return y;
  ctx.save(); ctx.beginPath(); ctx.rect(78, 148, 1764, 688); ctx.clip();
  ctx.shadowColor = '#0c263caa'; ctx.shadowOffsetY = -4; ctx.shadowBlur = 10;
  ctx.fillStyle = gradient(ctx, 0, y, 0, y + 145, [[0,'#c2b89b'],[0.05,'#fff2c9'],[0.6,'#f0dfb6'],[1,'#d7c8a4']]);
  ctx.fillRect(86, y, 1748, 161); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  for (let x = 106; x < 1830; x += 49) {
    ctx.fillStyle = '#566d73'; ctx.beginPath(); ctx.roundRect(x, y + 125, 21, 10, 2); ctx.fill();
  }
  type(ctx, 'PC1', 120, y + 65, 29, ink, { family: 'Mono' });
  ctx.restore(); return y;
}
function exposure(ctx, x, from, target, progress, color, width) {
  if (progress <= 0) return;
  const y = lerp(from, target, progress);
  line(ctx, [[x, from], [x, y]], color, width);
  if (progress < 1) {
    dot(ctx, x, y, 13, cream);
    dot(ctx, x, y, 7, ink);
  }
}

function draw(ctx, clock) {
  const s = state(clock);
  board(ctx);
  const [qx, qy] = s.point(transferQuery);
  const mode = s.restore > 0.5 || s.strip < 0.42 ? 'Original map' : 'One-coordinate copy';
  type(ctx, mode, 1797, 111, 33, ink, { family: 'Serif', italic: true, align: 'right' });
  ctx.save(); ctx.beginPath(); ctx.rect(79, 148, 1761, 687); ctx.clip();
  const filmY = stripPaper(ctx, s);
  const center = filmY + 51;
  const size = lerp(lerp(lerp(lerp(3.25, 1.55, s.open), 1.13, s.wide), 1.55, s.middle), 3.65, s.restore);
  if (s.strip > 0.01) {
    ctx.save(); ctx.globalAlpha = s.strip;
    // The three central exposures reach the strip in succession at exactly the same score.
    const development = new Map();
    for (const [i, p] of pages.entries()) {
      const [x, y] = s.point(p.point);
      const delay = [0, 0.18, 0.37, 0.1, 0][i];
      const travel = ease((s.print - delay) / 0.63);
      exposure(ctx, x, y, center, travel, '#c9f1eb9c', 3.4);
      const scoreX = score(p.point);
      development.set(scoreX, (development.get(scoreX) ?? 0) + clip((travel - 0.93) / 0.07));
    }
    for (const v of scores) {
      const x = 960 + v * s.units;
      const density = development.get(v);
      if (density > 0) {
        ctx.save(); ctx.globalAlpha *= Math.min(density, 1);
        const r = 15 + 4 * s.middle;
        dot(ctx, x, center, r + 4, '#23465547'); dot(ctx, x, center, r, ink);
        const label = v === 0 && s.middle > 0.85 ? `${onStrip.length} pages at 0` : String(v).replace('-', '−');
        type(ctx, label, x, center + 54, 36, ink, { family: 'Mono', align: 'center' }); ctx.restore();
      }
    }
    ctx.restore();
  }
  for (const [i, p] of pages.entries()) {
    const [x, y] = s.point(p.point);
    const left = p.id === 'D';
    if (x < 48 || x > 1860 || y < 90 || y > 900) continue;
    key(ctx, x, y, size, i, left, s.tie > 0.88 && p.id === onStrip[0].page.id);
    const end = p.id === 'P' || p.id === 'D';
    if (end) type(ctx, p.label, x + (left ? -22 : 22), y + 69, 38, cream, { family: 'Serif', align: 'center' });
    else type(ctx, p.label, x + (i === 4 ? 121 : 110) * size, y + 13, lerp(lerp(63, 44, s.open), 73, s.restore), cream, { family: 'Serif' });
  }
  // A brass optical sight glides over the unmoving query pin and seats on its center.
  const qColor = gold;
  const radius = lerp(lerp(lerp(45, 11, s.open), 10, s.wide), 30, s.restore);
  const fx = qx - 470 * s.intro;
  const fy = qy - 112 * s.intro;
  ctx.save(); ctx.translate(fx, fy); ctx.rotate(-0.28 * s.intro);
  const brass = gradient(ctx, -radius, -radius, radius, radius, [[0,'#926837'],[0.21,'#ffdfa1'],[0.45,'#e5b35c'],[0.77,'#f5d898'],[1,'#966a35']]);
  const rim = (a, b, width, color) => {
    ctx.beginPath(); ctx.arc(0, 0, radius, a, b); ctx.lineWidth = width; ctx.strokeStyle = color; ctx.stroke();
  };
  const weight = Math.max(3, radius * 0.18);
  rim(0.24 * Math.PI, 0.76 * Math.PI, weight, brass);
  rim(0.85 * Math.PI, 2.15 * Math.PI, weight, brass);
  for (const [dx, dy] of [[-1,0],[0,-1],[1,0]]) {
    line(ctx, [[dx * radius * 0.42, dy * radius * 0.42], [dx * radius * 1.32, dy * radius * 1.32]], brass, Math.max(2, weight / 2));
  }
  ctx.restore();
  dot(ctx, qx, qy, 4.5, qColor);
  const labelY = qy - (45 + radius * 0.45);
  ctx.save(); ctx.globalAlpha = 1 - clip(s.intro * 5);
  line(ctx, [[qx - radius - 8, qy - 5], [qx - radius - 58, labelY - 4], [qx - radius - 82, labelY - 4]], qColor, 2.6);
  type(ctx, 'Query', qx - radius - 93, labelY + 6, 41, qColor, { align: 'right', family: 'Serif', italic: true });
  ctx.restore();
  if (s.retained > 0) {
    ctx.save(); ctx.globalAlpha = s.retained;
    type(ctx, `${retained}%`, 1784, 245, 71, cream, { align: 'right', family: 'Serif' });
    type(ctx, 'variance on PC1', 1784, 284, 29, cream, { align: 'right' }); ctx.restore();
  }
  if (s.queryPrint > 0) {
    ctx.save(); ctx.globalAlpha = s.strip;
    const end = center - 17;
    const y = lerp(qy, end, s.queryPrint);
    line(ctx, [[qx, qy + 5], [qx, y]], '#f4c97da8', 2);
    polygon(ctx, [[qx - 12, y - 18], [qx + 12, y - 18], [qx, y]], gold);
    if (s.queryPrint > 0.95) {
      ctx.globalAlpha *= clip((s.queryPrint - 0.95) / 0.05);
      type(ctx, 'Query', qx - 25, center - 16, 33, ink, { align: 'right', family: 'Serif', italic: true });
    }
    ctx.restore();
  }
  if (s.tie > 0) {
    const [x, y] = s.point(onStrip[0].page.point);
    ctx.save(); ctx.globalAlpha = s.tie;
    line(ctx, [[x - 15, y], [x - 97, y], [x - 122, y - 20]], gold, 3);
    type(ctx, 'First stored match', x - 135, y - 15, 34, gold, { align: 'right' });
    ctx.restore();
  }
  if (s.near > 0) {
    const [x, y] = s.point(full[0].page.point);
    const m = x - 150;
    ctx.save(); ctx.globalAlpha = s.near;
    ctx.save(); ctx.setLineDash([5, 8]);
    line(ctx, [[m, qy], [qx - 39, qy]], '#f4d999a8', 2);
    line(ctx, [[m, y], [x - 32, y]], '#f4d999a8', 2); ctx.restore();
    line(ctx, [[m - 9, qy], [m + 9, qy]], gold, 3);
    line(ctx, [[m, qy], [m, y]], gold, 3);
    line(ctx, [[m - 9, y], [m + 9, y]], gold, 3);
    type(ctx, `${full[0].distance.toFixed(1)} units`, m - 22, (y + qy) / 2 + 13, 48, cream, { align: 'right', family: 'Mono' });
    ctx.restore();
  }
  ctx.restore();
}

function check() {
  assert.deepEqual(fit.mean, [0, 0]);
  assert.deepEqual(fit.vector, [1, 0]);
  assert.deepEqual(pages.map(p => score(p.point)), [-20, 0, 0, 20, 0]);
  assert.equal(score(transferQuery), 0);
  assert.equal(retained, '97.8');
  assert.deepEqual(onStrip.map(row => row.page.id), ['B', 'L', 'R']);
  assert(onStrip.every(row => row.distance === 0));
  assert.equal(scores.length, 3);
  assert.deepEqual(full.map(row => row.page.id), ['L']);
  assert(Math.abs(full[0].distance - 0.2) < 1e-12);
  return true;
}

export default { title: 'Three replies on one mark', beats, draw, check };
