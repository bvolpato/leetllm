const ink = '#1c3041';
function shape(ctx, pts, fill, stroke, width = 1) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}
function line(ctx, pts, color, width = 2) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
function box(ctx, x, y, w, h, r, color) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}
function ellipse(ctx, x, y, rx, ry, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}
function drawBlender(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ellipse(ctx, 82, 150, 169, 15, '#45556d1c');
  ctx.beginPath();
  ctx.moveTo(142, 112);
  ctx.bezierCurveTo(242, 137, 199, 182, 269, 153);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.save();
  ctx.translate(273, 150);
  ctx.rotate(-0.48);
  box(ctx, -3, -11, 32, 23, 5, ink);
  line(
    ctx,
    [
      [26, -5],
      [47, -5],
    ],
    ink,
    4,
  );
  line(
    ctx,
    [
      [26, 5],
      [47, 5],
    ],
    ink,
    4,
  );
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(121, -120);
  ctx.bezierCurveTo(230, -132, 228, -36, 135, -8);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 28;
  ctx.stroke();
  ctx.strokeStyle = '#d6e3df';
  ctx.lineWidth = 17;
  ctx.stroke();
  shape(
    ctx,
    [
      [-58, -148],
      [154, -148],
      [131, -28],
      [103, 3],
      [-21, 3],
      [-44, -36],
    ],
    '#c1d8d5',
    ink,
    6,
  );
  shape(
    ctx,
    [
      [-55, -143],
      [-8, -139],
      [10, -11],
      [-18, -10],
      [-38, -40],
    ],
    '#e9f1e2',
  );
  line(
    ctx,
    [
      [115, -140],
      [97, -31],
      [85, -10],
    ],
    '#edf5e8',
    9,
  );
  for (let i = 0; i < 4; i++)
    line(
      ctx,
      [
        [2, -111 + i * 23],
        [i % 2 ? 19 : 28, -111 + i * 23],
      ],
      '#5e8181',
      3,
    );
  line(
    ctx,
    [
      [70, -142],
      [52, -107],
      [70, -91],
      [45, -66],
      [58, -48],
    ],
    ink,
    5,
  );
  line(
    ctx,
    [
      [70, -91],
      [91, -96],
      [96, -110],
    ],
    ink,
    3,
  );
  box(ctx, -64, -159, 226, 19, 7, ink);
  box(ctx, 14, -174, 70, 16, 6, '#526271');
  box(ctx, -24, 1, 132, 21, 3, ink);
  shape(
    ctx,
    [
      [-34, 21],
      [116, 21],
      [143, 45],
      [159, 130],
      [-73, 130],
      [-59, 48],
    ],
    '#df7f54',
    ink,
    6,
  );
  shape(
    ctx,
    [
      [115, 25],
      [138, 49],
      [153, 124],
      [125, 124],
      [109, 50],
    ],
    '#be5d44',
  );
  box(ctx, -72, 125, 232, 16, 4, ink);
  ellipse(ctx, 41, 78, 34, 34, '#32465a');
  ellipse(ctx, 41, 76, 26, 26, '#e8cda1');
  line(
    ctx,
    [
      [42, 75],
      [52, 55],
    ],
    ink,
    5,
  );
  for (let i = 0; i < 3; i++)
    line(
      ctx,
      [
        [-44, 72 + i * 9],
        [-11, 72 + i * 9],
      ],
      '#875041',
      3,
    );
  ctx.restore();
}
export { drawBlender };
