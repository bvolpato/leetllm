// The side profiles share a ground line so a change of rank reads on a moving shelf.
import { createCanvas, Path2D } from '@napi-rs/canvas';

const shoes = new Map();
const W = 362;
const H = 244;

function shade(c, x1, y1, x2, y2, stops) {
  const g = c.createLinearGradient(x1, y1, x2, y2);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  return g;
}

function shape(c, d, fill, edge, width = 1) {
  const path = new Path2D(d);
  if (fill) {
    c.fillStyle = fill;
    c.fill(path);
  }
  if (edge) {
    c.strokeStyle = edge;
    c.lineWidth = width;
    c.stroke(path);
  }
  return path;
}

function seam(c, d, color, width = 1.5) {
  c.save();
  c.setLineDash([2.1, 2.5]);
  shape(c, d, null, color, width);
  c.restore();
}

function leather(c, outline, dark, light, count) {
  let state = 17651;
  function pick() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  }
  c.save();
  c.clip(outline);
  for (let i = 0; i < count; i++) {
    const x = pick() * W,
      y = pick() * H;
    c.fillStyle = i % 3 ? dark : light;
    c.fillRect(x, y, 0.3 + pick() * 1.4, 0.3 + pick() * 0.7);
  }
  c.restore();
}

function lugSole(c, red) {
  const outsole =
    'M26 187 Q68 194 107 184 Q130 186 156 196 Q235 220 328 188 Q342 184 340 196 Q339 208 326 214 L320 225 L306 229 L303 224 L292 227 L287 234 L271 236 L268 231 L255 232 L250 238 L234 239 L231 233 L217 233 L213 238 L195 236 L193 230 L180 228 L173 232 L155 227 Q129 213 113 213 L99 225 L80 226 L77 220 L66 222 L63 228 L44 229 L40 223 L28 223 Q22 222 22 215 Z';
  shape(
    c,
    outsole,
    shade(c, 0, 183, 0, 236, [
      [0, '#51474a'],
      [0.55, '#373237'],
      [1, '#242127'],
    ]),
    '#393036',
    1,
  );
  shape(
    c,
    'M25 187 Q73 190 107 182 Q121 183 155 195 C218 212 282 207 335 185 L340 196 Q290 215 244 217 Q192 220 149 204 Q126 195 108 193 Q65 203 24 198 Z',
    red ? '#d9a168' : '#aa835b',
  );
  shape(
    c,
    'M29 190 Q76 195 107 186 Q124 187 154 198 Q232 222 334 191',
    null,
    red ? '#f5c997' : '#d1ae76',
    1.7,
  );
  seam(c, 'M29 195 Q71 200 106 191 Q119 190 149 202 Q230 226 336 196', '#714f39', 1);
  for (const [x, y] of [
    [36, 210],
    [58, 212],
    [83, 210],
    [158, 214],
    [183, 219],
    [208, 223],
    [233, 224],
    [261, 222],
    [288, 216],
    [315, 210],
  ]) {
    shape(c, 'M' + x + ' ' + y + ' l9 -2 l-4 7 l-9 2 Z', '#222126');
  }
}

function hiker(c) {
  const vamp =
    'M31 77 Q32 65 39 61 L93 40 Q116 25 134 36 Q146 52 150 70 L161 90 Q170 102 182 109 L200 133 Q216 151 244 155 Q263 156 285 159 Q315 160 328 172 Q336 177 337 189 C303 207 225 217 166 201 Q128 192 107 187 Q67 199 25 190 Q19 174 27 149 Q33 123 31 77 Z';
  shape(c, 'M41 67 Q29 46 22 36 Q19 29 26 25 L35 20 Q42 21 44 30 L55 61 Z', '#6c312a');
  seam(c, 'M30 28 L46 57', '#f7b869', 2);
  const outline = shape(
    c,
    vamp,
    shade(c, 20, 61, 285, 206, [
      [0, '#993126'],
      [0.4, '#d44730'],
      [0.73, '#e75d3d'],
      [1, '#9c352c'],
    ]),
    '#772b26',
    1.5,
  );
  shape(
    c,
    'M33 76 Q34 58 54 53 L98 37 Q123 20 133 33 Q136 44 126 52 L95 64 Q64 79 40 81 Z',
    '#683832',
  );
  shape(c, 'M39 64 Q62 59 97 42 Q122 27 130 34 Q126 42 109 48 L67 66 Q40 75 36 71 Z', '#392d31');
  shape(c, 'M42 61 Q68 55 95 41 Q119 27 129 31', null, '#e0a06c', 4);
  shape(
    c,
    'M111 53 Q113 24 129 19 Q138 17 143 29 L160 78 L177 106 L161 117 L133 91 Z',
    '#86352d',
    '#723225',
    1.5,
  );
  shape(c, 'M126 26 Q133 14 141 25 L150 53 L134 57 Z', '#d4a24b');
  shape(
    c,
    'M35 82 Q66 81 95 63 L127 52 Q144 80 158 101 L183 131 L169 141 Q145 119 133 111 Q111 104 85 114 Q64 120 50 138 L28 146 Z',
    '#b93b2c',
  );
  seam(c, 'M39 87 Q66 84 97 68 L124 58 Q140 82 153 103 L177 131', '#ee9b73');
  shape(
    c,
    'M27 134 L46 123 Q66 108 93 113 Q102 116 108 136 L124 175 L106 184 Q70 193 26 187 Q17 164 27 134 Z',
    '#a13c2d',
  );
  seam(c, 'M29 139 Q67 111 91 119 Q97 122 103 139 L115 171', '#db8d69');
  shape(
    c,
    'M112 78 L128 63 Q137 66 146 86 Q162 109 189 130 L207 143 L195 154 Q163 144 138 122 Q121 107 110 91 Z',
    '#842e28',
  );
  seam(c, 'M114 89 Q146 132 195 149', '#dfa37b', 1.2);
  // A padded tongue, metal hooks and a mustard cord identify the hiker at a glance.
  for (const [i, [x, y]] of [
    [121, 70],
    [132, 88],
    [148, 106],
    [167, 123],
    [187, 136],
  ].entries()) {
    const endX = x + 19 - i * 0.5,
      endY = y - 8;
    c.fillStyle = '#473536';
    c.beginPath();
    c.ellipse(x, y, 5, 4, -0.6, 0, 2 * Math.PI);
    c.fill();
    c.strokeStyle = '#c5ad83';
    c.lineWidth = 1.6;
    c.stroke();
    const cord = 'M' + x + ' ' + y + ' Q' + (x + 6) + ' ' + (y - 8) + ' ' + endX + ' ' + endY;
    shape(c, cord, null, '#51312c', 5);
    shape(c, cord, null, '#e7bd69', 3.5);
    seam(c, cord, '#9c642c', 1);
  }
  shape(
    c,
    'M145 87 Q156 71 174 67 Q184 66 178 73 Q166 82 146 86 M145 87 Q164 75 176 84 Q179 94 158 92 Z M146 86 Q161 101 185 99',
    null,
    '#dfb566',
    3,
  );
  shape(c, 'M96 146 Q117 135 129 126 Q138 132 149 143 Q131 146 112 155 L105 158 Z', '#e7ad73');
  shape(
    c,
    'M23 161 Q46 157 61 168 L80 181 Q99 179 110 172 Q130 178 161 190 Q222 207 265 193 Q278 173 299 166 Q322 165 332 179 Q340 185 336 191 Q248 224 166 203 L108 187 Q65 198 24 189 Z',
    '#583c37',
  );
  seam(c, 'M26 166 Q48 164 59 172 L76 185 M269 193 Q278 176 301 170', '#b88566', 1.2);
  leather(c, outline, '#702d251c', '#ffe3aa3d', 10500);
  lugSole(c, true);
}

function chelsea(c) {
  const vamp =
    'M31 67 Q40 61 91 65 L120 62 Q131 64 132 80 L136 117 Q145 141 179 149 L226 160 Q247 164 281 161 Q318 158 333 178 L337 189 Q278 213 211 207 Q161 204 110 186 Q66 201 27 191 Q19 181 24 161 Q33 127 31 67 Z';
  shape(c, 'M38 75 L30 42 Q30 37 36 37 L44 37 Q49 38 48 45 L49 72 Z', '#664c37');
  seam(c, 'M37 40 L42 65', '#ceb790', 1.4);
  const outline = shape(
    c,
    vamp,
    shade(c, 24, 65, 228, 220, [
      [0, '#aa7b48'],
      [0.4, '#c4965d'],
      [0.74, '#d2ac76'],
      [1, '#976e47'],
    ]),
    '#85603e',
    1.3,
  );
  shape(c, 'M32 66 Q49 60 93 64 L119 61 Q125 62 126 68 Q78 78 34 73 Z', '#584233');
  shape(c, 'M34 65 Q64 61 93 65 L120 62', null, '#e2bf92', 2);
  const elastic = shape(
    c,
    'M52 76 Q78 75 110 72 L112 94 Q115 124 95 142 Q83 152 72 137 Q57 119 52 76 Z',
    '#674b39',
  );
  c.save();
  c.clip(elastic);
  for (let x = 45; x < 130; x += 3.8) shape(c, 'M' + x + ' 68 l15 85', null, '#957454', 1.3);
  c.restore();
  seam(c, 'M47 77 Q55 127 70 142 Q89 165 108 138 Q128 113 116 74', '#efd3a3');
  shape(c, 'M26 152 Q46 135 63 140 Q82 146 93 181 L77 187 L28 189 Q23 176 26 152 Z', '#a37c50');
  seam(c, 'M29 155 Q53 137 67 149 Q76 156 87 180', '#e0bd8a');
  shape(
    c,
    'M129 117 Q139 142 163 150 M158 157 Q183 159 200 170 M163 162 Q181 163 189 169',
    null,
    '#aa8057',
    1.3,
  );
  shape(c, 'M217 164 Q249 170 284 166 Q307 164 318 171', null, '#ead0a34d', 3);
  leather(c, outline, '#46322126', '#faefc640', 13000);
  lugSole(c, false);
}

export function drawBoot(c, red, x, ground, width) {
  const small = width < 230;
  const id = (red ? 'hiker' : 'chelsea') + (small ? '-shelf' : '-hero');
  if (!shoes.has(id)) {
    const scale = small ? 0.58 : 2.25;
    const sprite = createCanvas(Math.ceil(W * scale), Math.ceil(H * scale));
    const g = sprite.getContext('2d');
    g.scale(scale, scale);
    g.lineJoin = 'round';
    g.lineCap = 'round';
    (red ? hiker : chelsea)(g);
    shoes.set(id, sprite);
  }
  const h = (width * H) / W;
  c.drawImage(shoes.get(id), x - width / 2, ground - h, width, h);
}
