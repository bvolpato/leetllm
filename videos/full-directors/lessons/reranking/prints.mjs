function star(ctx, x, y, size, color) {
  shape(ctx, color, [
    [x, y - size],
    [x + size * 0.25, y - size * 0.26],
    [x + size, y],
    [x + size * 0.25, y + size * 0.25],
    [x, y + size],
    [x - size * 0.25, y + size * 0.25],
    [x - size, y],
    [x - size * 0.25, y - size * 0.26],
  ]);
}
function foxPrint(ctx) {
  const field = '#243e65',
    orange = '#e67d43',
    white = '#ffe5b7';
  rect(ctx, field, -230, -212, 460, 219);
  disc(ctx, '#f4c56f', -143, -148, 35);
  disc(ctx, field, -125, -161, 34);
  for (const [x, y, s] of [
    [-185, -64, 7],
    [90, -168, 9],
    [164, -109, 12],
    [191, -170, 5],
    [-73, -181, 6],
  ]) {
    star(ctx, x, y, s, white);
  }
  // Cut-paper fox, folded tail, then the open book in its lap.
  ctx.beginPath();
  ctx.moveTo(-86, -18);
  ctx.bezierCurveTo(-174, -6, -159, -65, -114, -91);
  ctx.bezierCurveTo(-98, -100, -95, -114, -95, -128);
  ctx.bezierCurveTo(-54, -94, -66, -49, -41, -36);
  ctx.fillStyle = orange;
  ctx.fill();
  shape(ctx, white, [
    [-114, -91],
    [-95, -128],
    [-87, -103],
    [-87, -90],
    [-96, -98],
    [-99, -88],
    [-102, -94],
  ]);
  shape(ctx, orange, [
    [-74, -36],
    [-43, -109],
    [48, -111],
    [79, -25],
  ]);
  shape(ctx, orange, [
    [-53, -152],
    [-65, -201],
    [-24, -176],
    [16, -174],
    [57, -203],
    [51, -151],
    [23, -118],
    [0, -108],
    [-31, -119],
  ]);
  shape(ctx, '#a74e39', [
    [-57, -190],
    [-36, -176],
    [-51, -170],
  ]);
  shape(ctx, '#a74e39', [
    [34, -175],
    [51, -191],
    [47, -167],
  ]);
  shape(ctx, white, [
    [-52, -152],
    [-26, -149],
    [0, -128],
    [26, -150],
    [52, -153],
    [32, -124],
    [0, -107],
    [-32, -126],
  ]);
  ink(ctx, field, 4, [
    [-39, -148],
    [-31, -144],
    [-23, -146],
  ]);
  ink(ctx, field, 4, [
    [24, -147],
    [31, -144],
    [40, -149],
  ]);
  shape(ctx, field, [
    [-7, -126],
    [7, -126],
    [0, -119],
  ]);
  shape(ctx, '#d6ab61', [
    [-101, -74],
    [-12, -57],
    [1, -49],
    [15, -55],
    [101, -70],
    [97, -16],
    [1, 0],
    [-94, -18],
  ]);
  shape(ctx, white, [
    [-97, -87],
    [-20, -77],
    [1, -63],
    [23, -75],
    [97, -83],
    [91, -28],
    [22, -17],
    [1, -10],
    [-25, -20],
    [-90, -29],
  ]);
  ink(ctx, '#a96e50', 3, [
    [1, -63],
    [1, -14],
  ]);
  for (let n = 0; n < 3; n++) {
    ink(ctx, '#bf9172', 2, [
      [-81, -71 + n * 10],
      [-20, -61 + n * 10],
    ]);
    ink(ctx, '#bf9172', 2, [
      [20, -61 + n * 10],
      [82, -69 + n * 10],
    ]);
  }
}
function holidayPrint(ctx) {
  const field = '#b7a6c4',
    plum = '#563b63',
    pale = '#ffe8c5';
  rect(ctx, field, -230, -212, 460, 219);
  disc(ctx, '#f1c58b', 105, -151, 39);
  const house = (x, base, w, h) => {
    rect(ctx, plum, x, base - h, w, h);
    shape(ctx, plum, [
      [x - 10, base - h],
      [x + w * 0.5, base - h - 48],
      [x + w + 10, base - h],
    ]);
    shape(ctx, pale, [
      [x - 14, base - h],
      [x + w * 0.5, base - h - 55],
      [x + w + 15, base - h],
      [x + w + 2, base - h - 2],
      [x + w * 0.5, base - h - 39],
      [x + 1, base - h + 3],
    ]);
    for (let j = 1; j <= 3; j++) {
      rect(ctx, '#e7bd98', x + (j * w) / 4 - 6, base - h + 16, 13, 18);
    }
  };
  shape(ctx, '#987e9c', [
    [-230, -47],
    [-154, -77],
    [-62, -33],
    [52, -91],
    [183, -69],
    [230, -45],
    [230, 6],
    [-230, 6],
  ]);
  house(-130, 6, 97, 63);
  house(13, 6, 120, 82);
  // Printed spruce branches hang across the little branch libraries.
  for (const [x, y, len] of [
    [-225, -174, 100],
    [-190, -180, 56],
    [215, -200, 83],
    [-202, -209, 106],
  ]) {
    const dir = x < 0 ? 1 : -1;
    ink(ctx, plum, 5, [
      [x, y],
      [x + dir * len, y + 30],
    ]);
    for (let j = 0; j < 7; j++) {
      const px = x + dir * ((len * j) / 7),
        py = y + (30 * j) / 7;
      ink(ctx, plum, 3, [
        [px + dir * 12, py - 12],
        [px, py],
        [px + dir * 1, py + 17],
      ]);
    }
  }
  star(ctx, -42, -137, 10, pale);
  star(ctx, -7, -182, 6, pale);
}
function hoursPrint(ctx) {
  const field = '#dc764e',
    burgundy = '#813c3e',
    pale = '#ffe5ad';
  rect(ctx, field, -230, -212, 460, 219);
  // A municipal clock tower with linocut rays and stepped masonry.
  for (let j = 0; j < 19; j++) {
    const a = Math.PI * (1 + j / 18);
    ink(ctx, '#edac70', 4, [
      [93 * Math.cos(a), -72 + 93 * Math.sin(a)],
      [285 * Math.cos(a), -72 + 285 * Math.sin(a)],
    ]);
  }
  shape(ctx, burgundy, [
    [-134, 7],
    [-134, -15],
    [-112, -15],
    [-112, -29],
    [-92, -29],
    [-92, -107],
    [-78, -107],
    [-78, -138],
    [-55, -161],
    [-20, -174],
    [0, -194],
    [20, -174],
    [55, -161],
    [78, -138],
    [78, -107],
    [92, -107],
    [92, -29],
    [112, -29],
    [112, -15],
    [134, -15],
    [134, 7],
  ]);
  for (const x of [-76, -65, 65, 76]) rect(ctx, '#ca8067', x, -100, 3, 96);
  disc(ctx, '#e8a974', 0, -98, 66);
  disc(ctx, pale, 0, -99, 57);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const r = i % 3 === 0 ? 39 : 45;
    ink(ctx, burgundy, i % 3 === 0 ? 4.5 : 2.5, [
      [r * Math.sin(a), -99 - r * Math.cos(a)],
      [50 * Math.sin(a), -99 - 50 * Math.cos(a)],
    ]);
  }
  ink(ctx, burgundy, 6, [
    [-23, -116],
    [0, -99],
    [28, -122],
  ]);
  disc(ctx, burgundy, 0, -99, 6);
  rect(ctx, '#e0a47c', -46, -23, 92, 4);
  rect(ctx, '#e0a47c', -54, -13, 108, 3);
}

// These three linocuts carry the same passage identities as the short edition.
function rect(c, color, x, y, w, h) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
function ink(c, color, width, points) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
function shape(c, color, points) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
function disc(c, color, x, y, r) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}
const prints = [foxPrint, holidayPrint, hoursPrint];
export function print(c, id, x, y, w, h) {
  c.save();
  c.translate(x, y);
  c.scale(w / 460, h / 219);
  c.translate(230, 212);
  c.beginPath();
  c.rect(-230, -212, 460, 219);
  c.clip();
  prints[id](c);
  c.restore();
}
