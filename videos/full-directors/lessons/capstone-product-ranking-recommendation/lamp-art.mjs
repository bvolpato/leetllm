import { Path2D } from '@napi-rs/canvas';
function ramp(c, x1, y1, x2, y2, stops) {
  const paint = c.createLinearGradient(x1, y1, x2, y2);
  for (const [at, color] of stops) paint.addColorStop(at, color);
  return paint;
}
function glow(c, x, y, r, stops) {
  const paint = c.createRadialGradient(x, y, 0, x, y, r);
  for (const [at, color] of stops) paint.addColorStop(at, color);
  return paint;
}
function rect(c, x, y, w, h, fill) {
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
}
function oval(c, x, y, rx, ry, fill) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
}
const paths = new Map();
function path(d) {
  if (!paths.has(d)) paths.set(d, new Path2D(d));
  return paths.get(d);
}
function fill(c, d, paint) {
  c.fillStyle = paint;
  c.fill(path(d));
}
function stroke(c, d, paint, width) {
  c.strokeStyle = paint;
  c.lineWidth = width;
  c.stroke(path(d));
}
function opalGlobe(c) {
  // Opal glass on a fluted stone foot. The counterweight is visible under the glass.
  const stone = ramp(c, -66, 0, 66, 4, [
    [0, '#704d58'],
    [0.17, '#e5bcb0'],
    [0.53, '#c18f8c'],
    [0.93, '#966671'],
    [1, '#81545e'],
  ]);
  fill(c, 'M -69,-121 Q 0,-144 69,-121 L 69,-11 C 63,4 -62,6 -69,-11 Z', stone);
  for (let i = -6; i <= 6; i++) {
    const x = Math.sin(i / 4.4) * 65;
    const y = -11 + Math.sqrt(Math.max(0, 1 - (x / 69) ** 2)) * 10;
    rect(c, x, -117, 2.6, 117 + y, 'rgba(85,46,59,.28)');
    rect(c, x + 3, -117, 1.8, 117 + y, 'rgba(255,234,210,.38)');
  }
  oval(c, 0, -121, 69, 12, '#845b61');
  oval(c, 0, -124, 53, 8, '#b48779');
  const glass = c.createRadialGradient(-40, -270, 4, 5, -226, 124);
  for (const [t, color] of [
    [0, '#fffff5'],
    [0.5, '#fff8d2'],
    [0.79, '#f4e9c6'],
    [0.94, '#cfbeb1'],
    [1, '#a58e91'],
  ])
    glass.addColorStop(t, color);
  oval(c, 0, -231, 116, 115, glass);
  oval(c, -44, -282, 15, 7, 'rgba(255,255,252,.62)');
}

function mushroom(c, lit) {
  const shell = ramp(c, -57, 0, 59, 0, [
    [0, '#933b26'],
    [0.2, '#f57440'],
    [0.42, '#ff965f'],
    [0.67, '#e5693f'],
    [1, '#9f3f30'],
  ]);
  fill(
    c,
    'M -30,-159 C -26,-106 -32,-57 -69,-21 C -85,3 81,5 69,-21 C 34,-63 28,-111 29,-159 Z',
    shell,
  );
  oval(c, 0, -7, 67, 8, '#a24532');
  fill(
    c,
    'M -33,-121 C -12,-109 15,-109 33,-120 L 32,-104 Q -2,-90 -32,-105 Z',
    'rgba(100,33,30,.17)',
  );
  const inner = ramp(c, 0, -161, 0, -112, [
    [0, '#ad4f34'],
    [0.55, lit ? '#ffdd96' : '#b76c50'],
    [1, lit ? '#ffd27f' : '#b16b50'],
  ]);
  oval(c, 0, -154, 157, 25, inner);
  const cap =
    'M -158,-155 C -151,-208 -114,-285 -38,-300 C 47,-322 133,-262 159,-157 C 155,-138 63,-129 0,-129 C -72,-129 -148,-140 -158,-155 Z';
  const lacquer = c.createRadialGradient(-66, -259, 2, -14, -227, 175);
  for (const [t, color] of [
    [0, '#ffac77'],
    [0.38, '#fc8253'],
    [0.72, '#ec5c39'],
    [1, '#9f382e'],
  ])
    lacquer.addColorStop(t, color);
  fill(c, cap, lacquer);
  c.save();
  c.clip(path(cap));
  stroke(c, 'M -121,-204 Q -102,-250 -59,-266', 'rgba(255,203,159,.57)', 8);
  stroke(c, 'M 59,-294 Q 126,-241 128,-147', 'rgba(150,54,38,.17)', 13);
  if (!lit) rect(c, -165, -325, 330, 215, 'rgba(83,43,52,.32)');
  c.restore();
  stroke(c, 'M -157,-154 C -128,-124 122,-118 158,-156', '#8d392b', 4);
}

function blueLantern(c) {
  // An open carry handle makes the third silhouette readable even without color.
  c.lineCap = 'round';
  const handle = 'M -75,-153 L -75,-243 C -76,-345 77,-348 77,-243 L 77,-153';
  stroke(c, handle, '#293953', 29);
  stroke(
    c,
    handle,
    ramp(c, -90, 0, 90, 0, [
      [0, '#3d6296'],
      [0.25, '#7c9fc1'],
      [0.53, '#4c79a8'],
      [1, '#294361'],
    ]),
    20,
  );
  const enamel = ramp(c, -100, 0, 94, 0, [
    [0, '#344d6c'],
    [0.19, '#668cad'],
    [0.44, '#4a769b'],
    [0.79, '#355d82'],
    [1, '#273e61'],
  ]);
  fill(
    c,
    'M -86,-135 Q 0,-174 86,-135 L 78,-43 Q 1,-18 -78,-43 Z',
    ramp(c, -90, 0, 88, 0, [
      [0, '#cec7ac'],
      [0.21, '#fff5cb'],
      [0.55, '#fff6d7'],
      [1, '#cbbfa4'],
    ]),
  );
  for (let i = -7; i <= 7; i++) {
    const x = i * 10.1;
    c.beginPath();
    c.moveTo(x, -125);
    c.lineTo(x * 0.94, -49);
    c.strokeStyle = 'rgba(158,150,126,.28)';
    c.lineWidth = 2;
    c.stroke();
  }
  fill(
    c,
    'M -94,-146 Q -94,-163 0,-166 Q 93,-165 94,-146 L 94,-128 C 74,-106 -74,-110 -94,-128 Z',
    enamel,
  );
  oval(c, 0, -146, 94, 16, '#7c97af');
  oval(c, 0, -147, 67, 8, '#6585a2');
  fill(c, 'M -85,-51 Q 0,-32 85,-51 L 91,-18 C 91,5 -87,5 -91,-18 Z', enamel);
  stroke(c, 'M -89,-17 Q 0,7 89,-18', '#263f5b', 5);
}

function foldedShade(c) {
  const wood = ramp(c, -16, 0, 18, 0, [
    [0, '#714b38'],
    [0.3, '#c99261'],
    [0.6, '#cf9d68'],
    [1, '#79523b'],
  ]);
  fill(
    c,
    'M -79,-19 C -72,-33 -31,-38 -17,-52 L -13,-185 L 14,-185 L 17,-52 C 31,-38 71,-33 79,-19 L 79,-10 C 68,6 -69,6 -79,-10 Z',
    wood,
  );
  oval(c, 0, -10, 79, 10, '#986842');
  oval(c, -1, -15, 77, 9, '#bb895a');
  // Each fold has a bright and a shaded face. The fold pitch shrinks near the edges.
  const facets = 17;
  const point = (i, top) => {
    const angle = (Math.PI * i) / (2 * facets);
    const ridge = i % 2 === 0 ? 1 : 0.92;
    const radius = (top ? 59 : 147) * ridge;
    return [
      -Math.cos(angle) * radius,
      (top ? -310 : -141) + Math.sin(angle) * (top ? 7 : 22) + (top ? 0 : (1 - ridge) * -69),
    ];
  };
  for (let i = 0; i < 2 * facets; i++) {
    const a = point(i, true),
      b = point(i + 1, true);
    const d = point(i, false),
      e = point(i + 1, false);
    const bright = i % 2 === 0;
    const paper = ramp(c, 0, -310, 0, -117, [
      [0, bright ? '#fff7b5' : '#ead990'],
      [0.54, bright ? '#fff195' : '#d5b75e'],
      [1, bright ? '#fbe482' : '#b59c53'],
    ]);
    c.beginPath();
    c.moveTo(...a);
    c.lineTo(...b);
    c.lineTo(...e);
    c.lineTo(...d);
    c.closePath();
    c.fillStyle = paper;
    c.fill();
    c.lineWidth = 0.75;
    c.strokeStyle = paper;
    c.stroke();
  }
  oval(c, 0, -310, 58.5, 6.5, '#c9ac62');
  oval(c, 0, -311, 51, 4.7, '#8b7852');
}

export function light(c, x, y, scale, lit, lamp) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  if (lit > 0) {
    c.globalAlpha = lit;
    oval(
      c,
      0,
      -184,
      194,
      194,
      glow(c, 0, -184, 194, [
        [0, 'rgba(255,237,160,.48)'],
        [0.6, 'rgba(255,235,166,.19)'],
        [1, 'rgba(255,235,166,0)'],
      ]),
    );
    c.globalAlpha = 1;
  }
  switch (lamp.shape) {
    case 'globe':
      opalGlobe(c);
      break;
    case 'mushroom':
      mushroom(c, lit > 0.1);
      break;
    case 'lantern':
      blueLantern(c);
      break;
    case 'pleats':
      foldedShade(c);
      break;
  }
  c.restore();
}
