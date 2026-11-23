import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { CENTROIDS, POINTS, QUERY } from '../../../films/vector-search/fixtures.mjs';
import { distance } from '../../../films/vector-search/arithmetic.mjs';
import { exact, partition, postingList, rankCentroids } from '../../../films/vector-search/model.mjs';

const title = 'The neighbor across the seam';
const beats = [
  {
    id: 'the-rim',
    say: "Follow the circle out to C. That's the farther of the two passages returned for this rollback question. Look inside the circle. Can you spot a passage the search missed?",
    hold: 1.45,
  },
  {
    id: 'the-fold',
    say: "There's B, just across the seam. Pull back. This inverted file index stores each passage in the list for its nearest center. The seam is where the two centers are equally far away.",
    hold: 0.7,
  },
  {
    id: 'one-probe',
    say: "The query is a little closer to the left center. Give the search one probe and it reads the list for that center. Each score is the squared distance from the query to a stored passage. Smaller means closer.",
    hold: 0.65,
  },
  {
    id: 'the-blank',
    say: "A comes first and C takes second. Now look under B. Its coordinates are there. Its score is missing. How could sorting the left list again bring B back?",
    hold: 1.6,
  },
  {
    id: 'second-read',
    say: "Open the other list. Keep your eye on the rim. There's B at nine hundredths, just behind A at eight hundredths. C has dropped out.",
    hold: 1.05,
  },
  {
    id: 'both-lists',
    say: "Count the fresh scores on the right. That second probe cost three more passage comparisons. With all six scored, B keeps second place.",
    hold: 2.2,
  },
];

const W = 1920;
const H = 1080;
const paper = '#faf7ef';
const ink = '#1b1e3c';
const blue = '#2c41bc';
const coral = '#ff6848';
const field = ['#f0edfc', '#f5f1eb'];
const mute = '#54596f';
const tau = Math.PI * 2;
const seam = (CENTROIDS[0].x + CENTROIDS[1].x) / 2;
const seamX = 990;
const lists = CENTROIDS.map((_, i) => postingList(i));
const readOrder = rankCentroids().flatMap(({ index }) => lists[index]);
const score = point => distance(QUERY, point);
const passage = id => POINTS.find(p => p.id === id);
const resultAt = n => exact(readOrder.slice(0, n), 2);
const oneListRadius = Math.sqrt(score(resultAt(lists[0].length)[1]));
const allListsRadius = Math.sqrt(score(resultAt(POINTS.length)[1]));

const clamp = x => Math.max(0, Math.min(1, x));
const smooth = x => clamp(x) ** 2 * (3 - 2 * clamp(x));
const mix = (a, b, t) => a + (b - a) * t;

function state(clock) {
  const { index, elapsed } = clock;
  const cue = (i, phrase, span) => index === i ? smooth(clock.reveal(phrase, span)) : Number(index > i);
  const unfold = cue(1, 'Pull back', 1.85);
  const connections = cue(1, 'each passage', 1.25);
  const route = cue(2, 'The query is a little closer', 0.85);
  const backIn = cue(2, 'Give the search one probe', 1.75);
  const firstRead = cue(2, 'and it reads the list', 2.25);
  const openRight = cue(4, 'Open the other list', 0.85);
  const secondRead = cue(4, 'Keep your eye on the rim', 2.25);
  const settle = cue(5, 'With all six scored', 1.6);
  const highlightB = cue(1, "There's B", 0.5) * (1 - unfold);
  const blank = cue(3, 'Now look under B', 0.5) * (1 - secondRead);
  // The opening shows a returned search. Pulling back rewinds to the list addresses.
  const reading = unfold < 0.5 ? 3 : firstRead * lists[0].length + secondRead * lists[1].length;
  const completed = Math.min(readOrder.length, Math.floor(reading + 1e-6));
  const forming = index === 0 ? smooth(elapsed / 1.05) : 1;
  return {
    deck: unfold,
    scale: mix(mix(mix(532, 97, unfold), 472, backIn), 672, settle),
    overview: unfold * (1 - backIn),
    connections: connections * (1 - backIn),
    route: route * (1 - backIn),
    rim: forming * (1 - unfold) + smooth((firstRead * 3 - 2) / 1),
    radius: mix(oneListRadius, allListsRadius, smooth((secondRead * 3 - 1.12) / 1.18)),
    secondRead, reading, completed, highlightB, blank, settle,
    openRight: openRight > 0,
    openLeft: unfold < 0.5 || firstRead > 0,
    answer: unfold < 0.5 && forming < 0.6 ? [] : resultAt(completed),
  };
}

function line(ctx, x, y, u, v, color, weight = 2) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(u, v);
  ctx.lineWidth = weight;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function circle(ctx, x, y, r, fill, edge, weight = 2) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0, r), 0, tau);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (edge) { ctx.lineWidth = weight; ctx.strokeStyle = edge; ctx.stroke(); }
}

function label(ctx, words, x, y, size, color = ink, options = {}) {
  const { font = 'Sans', align = 'left', weight = 400, italic = false, halo } = options;
  ctx.font = (italic ? 'italic ' : '') + weight + ' ' + size + 'px "Lesson ' + font + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (halo) {
    ctx.strokeStyle = halo;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 7;
    ctx.strokeText(words, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(words, x, y);
}

// Two ink impressions, one solid and one screened, share the same circular die.
let screenTile;
let paperTile;
function tiles() {
  if (screenTile) return;
  screenTile = createCanvas(36, 36);
  const s = screenTile.getContext('2d');
  circle(s, 9, 9, 4.5, '#7280c0');
  circle(s, 27, 27, 4.5, '#7280c0');
  paperTile = createCanvas(187, 179);
  const p = paperTile.getContext('2d');
  let seed = 19;
  const rand = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 380; i++) {
    p.fillStyle = i % 3 ? 'rgba(52,42,79,0.048)' : 'rgba(255,255,255,0.22)';
    p.fillRect(rand() * 187, rand() * 179, 1 + rand() * 2.5, 0.8 + rand() * 1.3);
  }
}

function drawMap(ctx, s, top, bottom) {
  const mid = (top + bottom) / 2;
  const x = p => seamX + (p.x - seam) * s.scale;
  const y = p => mid + (QUERY.y - p.y) * s.scale;
  const qx = x(QUERY), qy = y(QUERY);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, top, W, bottom - top);
  ctx.clip();

  ctx.fillStyle = field[0];
  ctx.fillRect(0, top, seamX, bottom - top);
  ctx.fillStyle = field[1];
  ctx.fillRect(seamX, top, W - seamX, bottom - top);

  // Registration crosses mark equal distances along the two embedding coordinates.
  const step = Math.pow(2, Math.round(Math.log2(115 / s.scale)));
  for (let ix = Math.ceil(-seamX / (step * s.scale)); seamX + ix * step * s.scale < W; ix++) {
    const gx = seamX + ix * step * s.scale;
    for (let dy = 0; dy < (bottom - top) / 2; dy += step * s.scale) {
      for (const gy of dy ? [mid - dy, mid + dy] : [mid]) {
        line(ctx, gx - 4, gy, gx + 4, gy, '#c6c4d3', 1.8);
        line(ctx, gx, gy - 4, gx, gy + 4, '#c6c4d3', 1.8);
      }
    }
  }

  const radius = s.scale * s.radius * s.rim;
  if (radius > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(qx, qy, radius, 0, tau);
    ctx.clip();
    ctx.fillStyle = ctx.createPattern(screenTile, 'repeat');
    ctx.fillRect(qx - radius, qy - radius, radius * 2, radius * 2);
    ctx.fillStyle = blue;
    ctx.fillRect(0, top, seamX, bottom - top);
    ctx.globalAlpha = smooth(s.secondRead * 3);
    ctx.fillRect(seamX, top, W - seamX, bottom - top);
    ctx.restore();
    circle(ctx, qx, qy, radius, null, blue, 4);
  }

  const fold = ctx.createLinearGradient(seamX - 17, 0, seamX + 11, 0);
  fold.addColorStop(0, 'rgba(60,52,72,0)');
  fold.addColorStop(0.60, 'rgba(60,52,72,0.15)');
  fold.addColorStop(0.63, 'rgba(255,255,255,0.7)');
  fold.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = fold;
  ctx.fillRect(seamX - 17, top, 29, bottom - top);
  line(ctx, seamX, top, seamX, bottom, '#64647a', 2);

  if (s.connections) {
    ctx.save();
    ctx.globalAlpha = s.connections;
    ctx.setLineDash([6, 7]);
    for (const point of POINTS) {
      const c = CENTROIDS[partition(point)];
      line(ctx, x(point), y(point), mix(x(point), x(c), s.connections),
        mix(y(point), y(c), s.connections), '#898aa8', 2.6);
    }
    ctx.restore();
  }

  // Both center measurements share a scale. The shorter one chooses the first list.
  if (s.route) {
    ctx.save();
    ctx.globalAlpha = s.route;
    for (const [i, c] of CENTROIDS.entries()) {
      line(ctx, qx, qy, mix(qx, x(c), s.route), qy, i === 0 ? blue : mute, i === 0 ? 6 : 3);
      label(ctx, 'd² ' + score(c).toFixed(2), (qx + x(c)) / 2, qy + 106, 36,
        i === 0 ? blue : mute, { align: 'center', font: 'Mono', halo: field[i] });
    }
    ctx.restore();
  }

  if (s.secondRead > 0 && s.settle < 1 && radius < oneListRadius * s.scale - 1) {
    ctx.save();
    ctx.globalAlpha = 0.42 * (1 - s.settle);
    ctx.setLineDash([7, 12]);
    circle(ctx, qx, qy, oneListRadius * s.scale, null, blue, 3);
    ctx.restore();
  }
  if (radius > 2) {
    const target = s.secondRead >= 1 / 3 ? passage('B') : passage('C');
    const span = Math.min(1, radius / (s.scale * Math.sqrt(score(target))));
    ctx.save();
    ctx.setLineDash([12, 9]);
    line(ctx, qx, qy, mix(qx, x(target), span), mix(qy, y(target), span), '#f7d2b8', 3.5);
    ctx.restore();
  }

  for (const point of POINTS) {
    const px = x(point), py = y(point);
    if (py < top - 40 || py > bottom + 40 || px < -40 || px > W + 40) continue;
    const loaded = readOrder.slice(0, s.completed).some(entry => entry.id === point.id);
    const near = ['A', 'B', 'C'].includes(point.id);
    const detail = near ? 1 - smooth(s.overview) : 0;
    const r = mix(7, 32, detail);
    circle(ctx, px, py, r + 4, paper);
    circle(ctx, px, py, r, loaded ? ink : paper, ink, 3.5);
    if (detail > 0) {
      ctx.save();
      ctx.globalAlpha = detail;
      label(ctx, point.id, px, py + 1, 49 * detail + 1, loaded ? paper : ink,
        { font: 'Sans', align: 'center', weight: 600 });
      ctx.restore();
    } else if (!near) {
      label(ctx, point.id, px + 18, py, 39, ink, { font: 'Serif', halo: paper });
    }
    if (point.id === 'B' && s.highlightB > 0) {
      ctx.save();
      ctx.globalAlpha = s.highlightB;
      circle(ctx, px, py, r + 13, null, coral, 5);
      ctx.restore();
    }
  }

  if (s.overview > 0) {
    ctx.save();
    ctx.globalAlpha = smooth(s.overview);
    for (const [i, c] of CENTROIDS.entries()) {
      const cx = x(c), cy = y(c);
      circle(ctx, cx, cy, 19, paper, blue, 4);
      line(ctx, cx - 25, cy, cx + 25, cy, blue, 4);
      line(ctx, cx, cy - 25, cx, cy + 25, blue, 4);
      label(ctx, i ? 'Right center' : 'Left center', cx + (i ? 35 : -35), cy,
        40, ink, { font: 'Serif', align: i ? 'left' : 'right', halo: field[i] });
    }
    ctx.restore();
  }

  ctx.save();
  ctx.translate(qx, qy);
  ctx.rotate(Math.PI / 4);
  const side = mix(32, 19, s.overview);
  ctx.fillStyle = coral;
  ctx.fillRect(-side / 2, -side / 2, side, side);
  ctx.lineWidth = 4;
  ctx.strokeStyle = ink;
  ctx.strokeRect(-side / 2, -side / 2, side, side);
  ctx.restore();
  const queryOnInk = radius > 133;
  label(ctx, 'query', qx - 9, qy + mix(54, 52, s.overview), 41, queryOnInk ? paper : ink,
    { font: 'Serif', italic: true, align: 'right', halo: queryOnInk ? null : paper });

  ctx.restore();
}

function drawLists(ctx, s, top) {
  ctx.save();
  ctx.translate(0, top);
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, W, H - top);
  line(ctx, 0, 0, W, 0, ink, 3);
  line(ctx, seamX, 0, seamX, H - top, ink, 2);
  for (let i = 0; i < lists.length; i++) {
    const left = i === 0 ? 65 : seamX + 54;
    const right = i === 0 ? seamX - 50 : W - 60;
    const width = (right - left) / 3;
    const count = Math.max(0, Math.min(3, s.completed - i * 3));
    const open = i === 0 ? s.openLeft : s.openRight;
    label(ctx, i === 0 ? 'Left list' : 'Right list', left, 46, 43, ink, { font: 'Serif' });
    label(ctx, open ? count + ' scored' : 'Unread', right, 47, 32,
      open ? blue : mute, { align: 'right', weight: open ? 600 : 400 });
    for (const [j, row] of lists[i].entries()) {
      const x = left + width * j;
      let reading = clamp(s.reading - i * 3 - j);
      const loaded = j < count;
      if (!open) reading = 0;
      line(ctx, x, 87, x + width - 17, 87, '#c7c4cc', 3);
      if (reading > 0) line(ctx, x, 87, x + (width - 17) * reading, 87, blue, 7);
      label(ctx, row.id, x, 132, 53, ink, { font: 'Serif' });
      const coords = '(' + row.x.toFixed(1) + ', ' + row.y.toFixed(1) + ')';
      label(ctx, coords, x + 56, 134, 28, mute, { font: 'Mono' });
      if (s.blank && row.id === 'B') {
        ctx.save();
        ctx.globalAlpha = s.blank;
        ctx.fillStyle = '#ffcab7';
        ctx.fillRect(x - 5, 180, width - 17, 65);
        ctx.restore();
      }
      label(ctx, 'd²', x, 214, 31, mute, { font: 'Serif', italic: true });
      label(ctx, loaded ? score(row).toFixed(2) : '—', x + 54, 214, 43,
        loaded ? blue : mute, { font: 'Mono' });
    }
  }
  ctx.restore();
}

function draw(ctx, clock) {
  tiles();
  const s = state(clock);
  const mapTop = 121;
  const tableTop = mix(H + 8, 792, s.deck);
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, W, H);
  drawMap(ctx, s, mapTop, tableTop);
  if (tableTop < H) drawLists(ctx, s, tableTop);
  line(ctx, 0, mapTop, W, mapTop, ink, 2.5);
  label(ctx, 'Query', 64, 61, 33, mute);
  label(ctx, '“Undo the checkout deployment.”', 187, 59, 55, ink, { font: 'Serif' });
  label(ctx, 'Returned', 1510, 60, 35, mute);
  for (let i = 0; i < 2; i++) {
    const pos = 1728 + i * 90;
    label(ctx, s.answer[i]?.id ?? '·', pos, 57, 56, ink, { font: 'Serif', align: 'center' });
    line(ctx, pos - 27, 92, pos + 27, 92, blue, 3);
  }
  ctx.fillStyle = ctx.createPattern(paperTile, 'repeat');
  ctx.fillRect(0, 0, W, H);
}

function check() {
  assert.equal(CENTROIDS[0].y, CENTROIDS[1].y);
  assert.equal(seam, 5);
  assert.deepEqual(rankCentroids().map(c => c.d2.toFixed(2)), ['7.84', '10.24']);
  assert.deepEqual(lists.map(list => list.map(p => p.id)), [['A', 'C', 'E'], ['B', 'D', 'F']]);
  assert.deepEqual(resultAt(3).map(p => p.id), ['A', 'C']);
  assert.deepEqual(resultAt(4).map(p => p.id), ['A', 'B']);
  assert.deepEqual(resultAt(6).map(p => p.id), exact(POINTS, 2).map(p => p.id));
  assert.deepEqual(readOrder.map(p => score(p).toFixed(2)), ['0.08', '1.25', '20.56', '0.09', '9.25', '25.00']);
  assert.ok(Math.sqrt(score(passage('B'))) < oneListRadius);
  assert.ok(Math.abs(allListsRadius - 0.3) < 1e-9);
}

export default { title, beats, draw, check };
