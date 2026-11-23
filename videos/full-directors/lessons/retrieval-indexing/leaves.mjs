// The menu, recipe and bean illustrations retain the original short’s engraved artwork.
import { createCanvas, Path2D } from '@napi-rs/canvas';
const typeset = {
  1: ['Soup recipe.', 'Make a pot with beans,', 'carrots, and onions.', 'Simmer until tender.'],
  2: ['Cook beans and', 'vegetables together', 'until soft.'],
  4: ['Soup lunch menu.', 'Tomato soup with bread', 'is served daily.'],
};

const leaf = { w: 823, h: 722 };
const green = '#213f34',
  tomato = '#a33020';
function rect(c, x, y, w, h, color, radius = 0) {
  c.fillStyle = color;
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
  c.fill();
}
function oval(c, x, y, rx, ry, color, angle = 0) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  c.fill();
}
function curve(c, d, color, stroke, width = 2) {
  const p = new Path2D(d);
  if (color) {
    c.fillStyle = color;
    c.fill(p);
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke(p);
  }
}
function line(c, x1, y1, x2, y2, color, width = 2) {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
function label(
  c,
  s,
  x,
  y,
  px,
  color = green,
  family = 'Lesson Serif',
  weight = 400,
  align = 'left',
) {
  c.font = weight + ' ' + px + 'px "' + family + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.fillText(s, x, y);
}
function random(seed) {
  let v = seed;
  return () => {
    v = (Math.imul(v, 1664525) + 1013904223) >>> 0;
    return v / 4294967296;
  };
}
function flecks(c, w, h, count, seed, light, dark) {
  const rng = random(seed);
  for (let i = 0; i < count; i++) {
    c.fillStyle = i % 3 ? dark : light;
    c.fillRect(rng() * w, rng() * h, 0.7 + 3 * rng(), 0.75 + 1.6 * rng());
  }
}

function basil(c, x, y, scale, angle) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(scale, scale);
  curve(c, 'M0 0 Q-47 -44 -2 -87 Q35 -55 0 0Z', '#385e44');
  curve(c, 'M0 -3 Q-8 -44 -2 -78 M-5 -35 L-20 -52 M-6 -49 L9 -63', null, '#a5ad6d', 3);
  c.restore();
}
function roll(c) {
  c.save();
  c.translate(254, 115);
  c.rotate(-0.3);
  curve(
    c,
    'M-94 -12 C-86 -62 -16 -78 59 -56 Q117 -40 106 3 Q98 40 26 47 Q-85 67 -94 -12Z',
    '#a45530',
    green,
    4,
  );
  curve(
    c,
    'M-90 -20 C-61 -67 37 -72 86 -43 Q113 -25 84 -5 Q22 33 -58 23 Q-89 18 -90 -20Z',
    '#dca55c',
  );
  for (let i = 0; i < 3; i++) {
    const x = -56 + i * 47;
    c.save();
    c.translate(x, 0);
    curve(c, 'M0 -46 Q29 -36 38 -16 Q14 -24 0 -46Z', '#efce8b');
    c.restore();
  }
  c.restore();
}
function bowl(c) {
  c.save();
  c.translate(375, 307);
  oval(c, 33, 93, 233, 20, '#806a3735');
  roll(c);
  curve(c, 'M-224 -22 C-210 51 -143 103 -37 108 C96 119 183 62 211 -24Z', '#42634f', green, 5);
  curve(c, 'M-196 8 Q-134 73 -9 79 Q105 83 177 34 Q98 101 -23 98 Q-137 93 -196 8Z', '#1e453d');
  for (let i = -7; i <= 6; i++) {
    const x = i * 25;
    c.beginPath();
    c.moveTo(x, 23 - Math.abs(i) * 1.7);
    c.quadraticCurveTo(x * 0.92, 51, x * 0.82, 64 - Math.abs(i) * 3.6);
    c.strokeStyle = '#c1bc86';
    c.lineWidth = 3;
    c.stroke();
  }
  oval(c, -6, -24, 220, 74, '#f6e6b9', -0.015);
  oval(c, -6, -22, 204, 59, '#9e3e24');
  oval(c, -7, -18, 195, 49, '#ce6037');
  const r = random(41);
  for (let i = 0; i < 38; i++) {
    const a = r() * Math.PI * 2,
      radius = Math.sqrt(r());
    oval(
      c,
      -7 + radius * 183 * Math.cos(a),
      -18 + radius * 43 * Math.sin(a),
      2 + r() * 4,
      1.4,
      i % 3 ? '#a94527' : '#e8a055',
      -0.2,
    );
  }
  basil(c, -11, -12, 0.55, -1.05);
  basil(c, -10, -14, 0.49, 0.85);
  c.restore();
}
function pot(c) {
  c.save();
  c.translate(387, 281);
  oval(c, 6, 107, 204, 18, '#756d3d30');
  curve(
    c,
    'M-155 -35 C-260 -77 -241 33 -151 18 M152 -37 C260 -81 247 28 151 16',
    null,
    '#31483b',
    19,
  );
  curve(c, 'M-171 -36 L-153 67 Q-143 102 -12 107 Q131 111 153 72 L172 -38Z', '#b75235', green, 5);
  curve(c, 'M-148 54 Q8 95 151 54 L146 73 Q18 130 -138 83Z', '#823c2c');
  oval(c, 0, -40, 175, 49, '#263f34');
  oval(c, 0, -37, 159, 34, '#d3964c');
  const r = random(91);
  for (let i = 0; i < 23; i++) {
    const a = r() * 6.28,
      z = Math.sqrt(r());
    oval(
      c,
      Math.cos(a) * 146 * z,
      -38 + Math.sin(a) * 26 * z,
      6 + r() * 9,
      4,
      i % 2 ? '#994730' : '#dbb66e',
      -0.25,
    );
  }
  curve(
    c,
    'M70 -39 L155 -148 Q161 -158 172 -152 Q180 -147 173 -137 L89 -35Z',
    '#8e623a',
    '#4c4932',
    3.5,
  );
  for (let i = 0; i < 4; i++) line(c, -130 + 9 * i, 2, -123 + 9 * i, 58, '#e4b276', 3);
  c.restore();
}
function bean(c, x, y, scale, angle, shade) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(scale, scale);
  curve(
    c,
    'M-71 -22 C-62 -61 -10 -68 30 -56 C84 -42 99 11 65 43 C42 66 14 56 6 29 Q0 11 -23 22 C-49 38 -81 17 -71 -22Z',
    shade,
    '#683c2d',
    4,
  );
  curve(
    c,
    'M-52 -24 Q-30 -61 23 -44 M-43 -25 Q-20 -49 5 -43 M24 15 Q26 39 47 40',
    null,
    '#e9ac78',
    4,
  );
  const r = random(101);
  for (let i = 0; i < 32; i++) {
    const px = -42 + r() * 102;
    const py = -35 + r() * 30;
    line(c, px, py, px + 3 + r() * 6, py - 2, '#813e2e84', 2);
  }
  c.restore();
}
function beanBranch(c) {
  c.save();
  c.translate(478, 525);
  curve(
    c,
    'M-249 89 Q-167 40 -102 -37 Q-58 -94 -4 -91 Q-53 -33 -95 1 Q-144 44 -249 89Z',
    '#64805b',
    green,
    4,
  );
  curve(c, 'M-238 82 Q-142 36 -83 -32 L-13 -84', null, '#f0d7a4', 3.5);
  bean(c, -102, 35, 0.86, -0.55, '#b86244');
  bean(c, 39, -10, 0.94, 0.43, '#a54c37');
  bean(c, 150, 72, 0.69, -0.31, '#bd6d4f');
  c.restore();
}
function paperNumber(c, page, ink) {
  const x = 739;
  c.strokeStyle = ink;
  c.lineWidth = 2.5;
  c.beginPath();
  c.arc(x, 83, 43, 0, Math.PI * 2);
  c.stroke();
  label(c, String(page), x, 104, 64, ink, 'Lesson Serif', 400, 'center');
}

function makePage(page) {
  const surface = createCanvas(leaf.w, leaf.h);
  const c = surface.getContext('2d');
  const pageTone = page === 4 ? '#f8dfac' : page === 2 ? '#e3e8c8' : '#f5e5bb';
  rect(c, 0, 0, leaf.w, leaf.h, pageTone, 3);
  if (page !== 0) {
    const copy = typeset[page];
    const ink = page === 4 ? tomato : green;
    paperNumber(c, page, ink);
    if (page === 2) {
      let y = 207;
      for (const row of copy) {
        label(c, row, 66, y, 76, green);
        y += 96;
      }
      beanBranch(c);
    } else {
      label(c, copy[0], 52, 155, 73, ink);
      line(c, 55, 180, 766, 180, ink, 2.5);
      if (page === 4) {
        bowl(c);
        label(c, copy[1], 60, 529, 54);
        label(c, copy[2], 60, 599, 54);
        line(c, 58, 655, 762, 655, tomato, 3);
        line(c, 58, 665, 762, 665, tomato, 1.5);
      } else {
        pot(c);
        for (let i = 1; i <= 3; i++) label(c, copy[i], 61, 481 + (i - 1) * 65, 53);
      }
    }
  }
  flecks(c, leaf.w, leaf.h, 4700, 80 + page, '#fff9d958', '#53462c18');
  const shade = c.createLinearGradient(0, 0, 0, 82);
  shade.addColorStop(0, '#8c73452f');
  shade.addColorStop(1, '#8c734500');
  rect(c, 0, 0, leaf.w, 82, shade);
  return surface;
}

const pages = new Map();
export function leafPage(ctx, id, x, y, scale) {
  const page = Number(id.slice(1));
  if (!pages.has(page)) pages.set(page, makePage(page));
  ctx.drawImage(pages.get(page), x, y, leaf.w * scale, leaf.h * scale);
}
export { typeset };
