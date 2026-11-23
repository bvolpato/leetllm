import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';

const title = 'The fern from plot 15';
const beats = [
  {
    id: 'the-missing-print',
    say: 'Try plot fifteen. There’s the fern we’re looking for. You can read the plot number at the foot of the print. Why did the catalog miss it?',
    hold: 1.2,
  },
  {
    id: 'what-the-catalog-read',
    say: 'Open the text saved from the scan. Optical character recognition turned the marks on the paper into searchable text. Look at the last character it saved. That’s a letter S. An exact search for fifteen skips this print.',
    hold: 0.8,
  },
  {
    id: 'under-the-glass',
    say: 'Come back to the scan. Follow the flat top of that last mark, then the short stroke down its left side. That’s how we can tell it’s a five.',
    hold: 1.4,
  },
  {
    id: 'the-correction',
    say: 'Keep the original reading. Save fifteen in a separate field for the reviewed plot number. Link that correction to the label on sheet seven so someone else can check it.',
    hold: 0.9,
  },
  {
    id: 'find-the-fern',
    say: 'Use the reviewed number in the search index. Try plot fifteen again. There’s our fern. Follow the result back to the mark we checked.',
    hold: 2.6,
  },
];

// The OCR candidate is a worked example. The field search and its source locator are live.
const source = Object.freeze({
  book: 'Field prints',
  edition: 1,
  sheet: 7,
  subject: 'Fern study',
  plot: '15',
  label: Object.freeze({ x: 46, y: 648, w: 287, h: 85 }),
});
const ocr = Object.freeze({ plot: '1S', source });
const correction = Object.freeze({ plot: source.plot, source, region: source.label });
const query = '15';

function plotIndex(pages) {
  const index = new Map();
  for (const page of pages) {
    const value = page.review?.plot ?? page.ocr.plot;
    const hits = index.get(value) ?? [];
    hits.push(page);
    index.set(value, hits);
  }
  return index;
}
const draftPage = { ocr };
const reviewedPage = { ocr, review: correction };
const draft = plotIndex([draftPage]);
const indexed = plotIndex([reviewedPage]);
const find = (index, value) => index.get(value) ?? [];

function check() {
  assert.deepEqual(find(draft, query), []);
  assert.deepEqual(find(draft, '1S'), [draftPage]);
  const results = find(indexed, query);
  assert.equal(results.length, 1);
  const hit = results[0];
  assert.equal(hit.review.source.subject, 'Fern study');
  assert.equal(hit.review.source.sheet, 7);
  assert.equal(hit.review.source.edition, 1);
  assert.equal(hit.review.source.plot, query);
  assert.equal(hit.review.region, source.label);
  assert.equal(hit.ocr.plot, '1S');
  assert.equal(hit.ocr.source, hit.review.source);
  assert.deepEqual(find(indexed, '1S'), []);
  return true;
}

const indigo = '#16396b';
const ink = '#192f4a';
const muted = '#435d76';
const vermilion = '#b53f2d';
const light = '#f7f3e7';
const clamp = (x) => Math.min(1, Math.max(0, x));
const ease = (x) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;
function seeded(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function type(g, str, x, y, size, family = 'Sans', color = ink, style = '400') {
  g.fillStyle = color;
  g.font = style + ' ' + size + 'px "Lesson ' + family + '"';
  g.fillText(str, x, y);
}
function line(g, x1, y1, x2, y2, color, width = 2) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}
function layer(g, alpha, paint) {
  if (alpha <= 0) return;
  g.save();
  g.globalAlpha *= clamp(alpha);
  paint();
  g.restore();
}

// Each frond has a curved midrib. Pairs of pinnae follow its tangent,
// and the small leaflets turn toward the tip of their own pinna.
function fern(g, base, bend, tip, widest, pairs, rand, color) {
  const spine = (t) => ({
    x: (1 - t) ** 2 * base.x + 2 * t * (1 - t) * bend.x + t * t * tip.x,
    y: (1 - t) ** 2 * base.y + 2 * t * (1 - t) * bend.y + t * t * tip.y,
  });
  g.lineCap = 'round';
  g.strokeStyle = color;
  g.fillStyle = color;
  for (let i = 1; i <= 60; i++) {
    const a = spine((i - 1) / 60),
      b = spine(i / 60);
    line(g, a.x, a.y, b.x, b.y, color, 0.65 + 4 * (1 - i / 60));
  }
  for (let i = 0; i < pairs; i++) {
    for (const side of [-1, 1]) {
      const t = 0.13 + (0.855 * (i + (side === 1 ? 0.27 : 0))) / pairs;
      const a = spine(t),
        b = spine(t + 0.01);
      const scale = Math.hypot(b.x - a.x, b.y - a.y);
      const dx = (b.x - a.x) / scale,
        dy = (b.y - a.y) / scale;
      const nx = -dy * side,
        ny = dx * side;
      const length =
        widest *
        Math.sin(Math.PI * (0.13 + 0.86 * t)) ** 1.2 *
        (1 - 0.62 * t) *
        (0.9 + 0.2 * rand());
      const axis = (u) => ({
        x: a.x + length * (nx * u + dx * (0.25 * u + 0.34 * u * u)),
        y: a.y + length * (ny * u + dy * (0.25 * u + 0.34 * u * u)),
      });
      const last = axis(1);
      const mid = axis(0.5);
      g.lineWidth = 1.1 + (1 - t);
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.quadraticCurveTo(
        2 * mid.x - (a.x + last.x) / 2,
        2 * mid.y - (a.y + last.y) / 2,
        last.x,
        last.y,
      );
      g.stroke();
      const lobes = Math.max(3, Math.round(length / 7));
      for (let j = 0; j < lobes; j++) {
        for (const flank of [-1, 1]) {
          const u = (j + (flank === 1 ? 0.36 : 0.1)) / lobes;
          const p = axis(u),
            q = axis(Math.min(1, u + 0.07));
          const d = Math.hypot(q.x - p.x, q.y - p.y);
          const vx = (q.x - p.x) / d,
            vy = (q.y - p.y) / d;
          const sx = -vy * flank,
            sy = vx * flank;
          const size =
            (4 + 0.136 * length) *
            (0.31 + 0.7 * Math.sin(Math.PI * (0.25 + 0.75 * u))) *
            (0.89 + 0.17 * rand());
          const px = p.x + size * (sx + vx * 0.49),
            py = p.y + size * (sy + vy * 0.49);
          g.beginPath();
          g.moveTo(p.x - vx * 2, p.y - vy * 2);
          g.bezierCurveTo(
            p.x + size * sx * 0.5 - vx * 2,
            p.y + size * sy * 0.5 - vy * 2,
            px - vx * 3,
            py - vy * 3,
            px,
            py,
          );
          g.quadraticCurveTo(
            p.x + size * sx * 0.66 + vx * 4,
            p.y + size * sy * 0.66 + vy * 4,
            p.x + vx * 2,
            p.y + vy * 2,
          );
          g.fill();
        }
      }
    }
  }
}

let plate;
function scan() {
  if (plate) return plate;
  const c = createCanvas(700, 760),
    g = c.getContext('2d');
  const rand = seeded(1517);
  g.fillStyle = '#f7f2e5';
  g.fillRect(0, 0, c.width, c.height);
  const emulsion = g.createLinearGradient(0, 64, 665, 530);
  emulsion.addColorStop(0, '#1b4778');
  emulsion.addColorStop(0.37, '#0b3c71');
  emulsion.addColorStop(0.68, '#21588b');
  emulsion.addColorStop(1, '#376990');
  // Uneven ends and dry bristles leave the edge of the brushed emulsion visible.
  for (let y = 70; y < 551; y++) {
    const left = 36 + 3 * Math.sin(y * 0.027) + 2 * Math.sin(y * 0.43) + rand() * 8;
    const right = 663 + 2 * Math.cos(y * 0.029) - rand() * 9;
    g.fillStyle = emulsion;
    g.fillRect(left, y, right - left, 1);
  }
  g.save();
  g.beginPath();
  g.rect(46, 78, 607, 462);
  g.clip();
  fern(g, { x: 359, y: 557 }, { x: 518, y: 442 }, { x: 592, y: 239 }, 94, 12, rand, '#b3cbd0');
  fern(g, { x: 169, y: 569 }, { x: 210, y: 297 }, { x: 430, y: 87 }, 142, 13, rand, '#f2ebcf');
  g.restore();
  type(g, source.book, 44, 50, 29, 'Serif', indigo, 'italic');
  type(g, 'Sheet ' + source.sheet, 536, 50, 25, 'Mono', indigo);
  type(g, source.subject, 47, 626, 51, 'Serif', indigo, 'italic');
  line(g, 47, 646, 650, 646, '#858c91', 1.3);
  type(g, 'Plot', 49, 716, 54, 'Serif', ink);
  type(g, source.plot, 226, 718, 76, 'Mono', ink, 'bold');
  // Fix the grain to the paper, including the ink at the source of the OCR error.
  const scanPixels = g.getImageData(0, 0, c.width, c.height);
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const k = (y * c.width + x) * 4,
        d = scanPixels.data;
      const wash = Math.sin(x / 64 + Math.sin(y / 48)) * 2.8 + Math.cos(y / 27 + x / 62) * 1.4;
      const noise = (rand() - 0.5) * 12 + wash + (rand() > 0.996 ? 26 : 0);
      d[k] += noise;
      d[k + 1] += noise;
      d[k + 2] += noise;
    }
  }
  g.putImageData(scanPixels, 0, 0);
  plate = c;
  return c;
}

function bracket(g, box, amount) {
  layer(g, amount, () => {
    const { x, y, w, h } = box;
    g.strokeStyle = vermilion;
    g.lineWidth = 3;
    for (const [px, py, sx, sy] of [
      [x, y, 1, 1],
      [x + w, y, -1, 1],
      [x, y + h, 1, -1],
      [x + w, y + h, -1, -1],
    ]) {
      g.beginPath();
      g.moveTo(px + sx * 18, py);
      g.lineTo(px, py);
      g.lineTo(px, py + sy * 15);
      g.stroke();
    }
  });
}

function glass(g, x, y, alpha) {
  layer(g, alpha, () => {
    const radius = 91;
    g.save();
    g.shadowColor = '#142a5144';
    g.shadowBlur = 9;
    g.shadowOffsetY = 6;
    g.beginPath();
    g.arc(x, y, radius, 0, 2 * Math.PI);
    g.fillStyle = light;
    g.fill();
    g.restore();
    g.save();
    g.beginPath();
    g.arc(x, y, radius - 2, 0, 2 * Math.PI);
    g.clip();
    g.imageSmoothingEnabled = false;
    g.translate(x, y);
    g.scale(2.68, 2.68);
    g.drawImage(scan(), -x, -y);
    g.restore();
    g.strokeStyle = '#283f5b';
    g.lineWidth = 5;
    g.beginPath();
    g.arc(x, y, radius, 0, 2 * Math.PI);
    g.stroke();
    g.strokeStyle = '#f9e9d5';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(x, y, radius - 4, 3.4, 5.65);
    g.stroke();
  });
}

function fieldPrint(g, settle, inspect, glassTravel, glassAlpha, locate) {
  g.save();
  const scale = 1.15 + 0.12 * (1 - settle) + 0.05 * inspect;
  g.translate(543 - 15 * inspect, 533 - 26 * inspect);
  g.rotate(-0.046 + 0.033 * inspect);
  g.scale(scale, scale);
  g.translate(-350, -380);
  g.save();
  g.shadowColor = '#18344860';
  g.shadowBlur = 17;
  g.shadowOffsetX = 3;
  g.shadowOffsetY = 9;
  g.fillStyle = light;
  g.fillRect(0, 0, 700, 760);
  g.restore();
  g.drawImage(scan(), 0, 0);
  bracket(g, source.label, locate);
  glass(g, mix(418, 293, glassTravel), mix(457, 689, glassTravel), glassAlpha);
  g.restore();
}

function magnifier(g, x, y) {
  g.strokeStyle = indigo;
  g.lineWidth = 5;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(x, y, 15, 0, 2 * Math.PI);
  g.stroke();
  line(g, x + 11, y + 11, x + 26, y + 26, indigo, 5);
}
function lookup(g, digits, hits, resultAlpha, locate) {
  const x = 1090;
  type(g, 'Field catalog', x, 258, 78, 'Serif', indigo);
  type(g, 'Exact plot search', x, 362, 40, 'Sans', muted);
  magnifier(g, x + 24, 437);
  type(g, digits, x + 86, 464, 82, 'Mono', ink);
  line(g, x, 499, 1775, 499, indigo, 2);
  layer(g, resultAlpha, () => {
    type(g, String(hits.length), x, 610, 104, 'Mono', indigo);
    type(
      g,
      'matching ' + (hits.length === 1 ? 'print' : 'prints'),
      x + 85,
      601,
      49,
      'Serif',
      indigo,
    );
    const result = hits[0];
    if (result) {
      const origin = result.review.source;
      g.drawImage(scan(), 37, 71, 621, 478, x, 642, 205, 158);
      type(g, origin.subject, x + 241, 702, 50, 'Serif', indigo, 'italic');
      type(g, 'Sheet ' + origin.sheet, x + 243, 767, 38, 'Sans', muted);
      line(g, x + 243, 783, x + 243 + 134 * locate, 783, vermilion, 3);
    }
  });
}

function reading(g, developed, corrected, locator, point) {
  const x = 1090;
  type(g, 'Catalog record', x, 258, 78, 'Serif', indigo);
  const rawSize = mix(164, 78, corrected);
  layer(g, 1 - developed, () => type(g, 'Label pixels', x, 365, 42, 'Sans', muted));
  layer(g, developed, () => {
    type(g, 'Original OCR', x, 365, 42, 'Sans', muted);
    type(g, ocr.plot, x, mix(550, 463, corrected), rawSize, 'Mono', ink);
    layer(g, point * (1 - corrected), () =>
      line(g, x + 104, 578, x + 104 + 84 * point, 578, vermilion, 5),
    );
  });
  layer(g, corrected, () => {
    line(g, x, 499, 1775, 499, '#8394a5', 1.6);
    type(g, 'Reviewed plot', x, 586, 42, 'Sans', indigo);
    type(g, correction.plot, x, 740, 147, 'Mono', indigo);
    layer(g, locator, () => {
      type(g, source.book + '  /  Sheet ' + source.sheet, x, 826, 40, 'Serif', indigo);
      line(g, x, 842, x + 324, 842, vermilion, 3);
    });
  });
}

// Lift a crop from the retained scan, then dissolve it into the OCR candidate.
// At the start its transform is the transform of the paper itself.
function liftLabel(g, travel, opacity) {
  if (opacity <= 0) return;
  const sx = 216,
    sy = 647,
    sw = 108,
    sh = 82;
  const u = sx + sw / 2 - 350,
    v = sy + sh / 2 - 380,
    angle = -0.046;
  const startX = 543 + 1.15 * (u * Math.cos(angle) - v * Math.sin(angle));
  const startY = 533 + 1.15 * (u * Math.sin(angle) + v * Math.cos(angle));
  layer(g, opacity, () => {
    g.translate(
      mix(startX, 1185, travel),
      mix(startY, 485, travel) - 70 * Math.sin(travel * Math.PI),
    );
    g.rotate(angle * (1 - travel));
    const scale = mix(1.15, 2.16, travel);
    g.scale(scale, scale);
    g.imageSmoothingEnabled = false;
    g.drawImage(scan(), sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
    bracket(g, { x: -sw / 2, y: -sh / 2, w: sw, h: sh }, travel);
  });
}

let background;
function surface() {
  if (background) return background;
  const b = createCanvas(960, 540),
    g = b.getContext('2d');
  const tone = g.createLinearGradient(0, 0, 960, 370);
  tone.addColorStop(0, '#a6bbcd');
  tone.addColorStop(0.52, '#d9e1e5');
  tone.addColorStop(1, '#eef0eb');
  g.fillStyle = tone;
  g.fillRect(0, 0, 960, 540);
  background = b;
  return b;
}

function draw(g, clock) {
  const { index, elapsed, reveal } = clock;
  const cue = (phrase, span) => ease(reveal(phrase, span));
  const open = index === 0 ? ease(elapsed / 1.5) : 1;
  const readingIn = index === 0 ? 0 : index === 1 ? cue('Open the text', 0.8) : 1;
  const lifted = index === 1 ? cue('Open the text', 1.6) : 1;
  const developed = index === 1 ? cue('into searchable text', 0.85) : 1;
  const point = index === 1 ? cue('Look at the last character', 0.55) : 1;
  const lookupAgain = index === 4 ? cue('Try plot fifteen again', 0.8) : 0;
  const inspect =
    index < 2
      ? 0
      : index === 2
        ? cue('Come back to the scan', 1.8)
        : index === 4
          ? 1 - lookupAgain
          : 1;
  const putAway = index < 3 ? 0 : index === 3 ? cue('Keep the original reading', 1.15) : 1;
  const corrected = index < 3 ? 0 : index === 3 ? cue('Save fifteen', 1.1) : 1;
  const locator = index < 3 ? 0 : index === 3 ? cue('Link that correction', 0.8) : 1;
  const follow = index === 4 ? cue('Follow the result', 0.8) : 0;
  const mark = index === 4 ? 1 - lookupAgain + follow : locator;

  g.save();
  g.drawImage(surface(), 0, 0, 1920, 1080);
  fieldPrint(g, open, inspect, inspect, inspect * (1 - putAway), mark);
  layer(g, 1 - readingIn, () => {
    const digits = elapsed < 0.2 ? '' : elapsed < 0.48 ? query[0] : query;
    lookup(
      g,
      index ? query : digits,
      find(draft, query),
      index ? 1 : ease((elapsed - 0.58) / 0.5),
      0,
    );
  });
  layer(g, readingIn * (1 - lookupAgain), () => reading(g, developed, corrected, locator, point));
  if (index === 1) liftLabel(g, lifted, 1 - developed);
  layer(g, lookupAgain, () =>
    lookup(g, query, find(indexed, query), ease((lookupAgain - 0.55) / 0.45), follow),
  );
  g.restore();
}

export default { title, beats, draw, check };
