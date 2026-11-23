function gradient(ctx, x0, y0, x1, y1, stops) {
  const fill = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [at, color] of stops) fill.addColorStop(at, color);
  return fill;
}
function form(ctx, path, fill, edge, weight = 1) {
  ctx.beginPath();
  path(ctx);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = weight;
    ctx.stroke();
  }
}
function lines(ctx, points, color, width) {
  form(
    ctx,
    (p) => {
      p.moveTo(...points[0]);
      for (const point of points.slice(1)) p.lineTo(...point);
    },
    null,
    color,
    width,
  );
}
function oval(ctx, x, y, rx, ry, fill) {
  form(ctx, (p) => p.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2), fill);
}
function hanger(ctx) {
  const hook = (p) => {
    p.moveTo(-17, 94);
    p.bezierCurveTo(-18, 59, 29, 60, 26, 94);
    p.bezierCurveTo(25, 113, 1, 117, 1, 146);
    p.lineTo(1, 184);
  };
  form(ctx, hook, null, '#302e25', 12);
  form(ctx, hook, null, '#cab289', 6);
  form(
    ctx,
    (p) => {
      p.moveTo(-231, 279);
      p.quadraticCurveTo(-218, 249, -44, 182);
      p.quadraticCurveTo(0, 145, 44, 182);
      p.quadraticCurveTo(200, 238, 231, 276);
      p.lineTo(223, 293);
      p.quadraticCurveTo(65, 227, 0, 215);
      p.quadraticCurveTo(-75, 227, -221, 294);
      p.closePath();
    },
    gradient(ctx, -20, 175, 22, 287, [
      [0, '#e0a771'],
      [0.36, '#925f40'],
      [1, '#4a3029'],
    ]),
    '#382c25',
    3,
  );
}

function coatOutline(p) {
  p.moveTo(-66, 201);
  p.bezierCurveTo(-100, 224, -191, 243, -237, 275);
  p.bezierCurveTo(-281, 301, -289, 382, -305, 467);
  p.lineTo(-360, 799);
  p.quadraticCurveTo(-339, 829, -272, 828);
  p.lineTo(-210, 582);
  p.lineTo(-230, 905);
  p.quadraticCurveTo(-118, 945, -1, 922);
  p.quadraticCurveTo(115, 940, 232, 903);
  p.lineTo(216, 571);
  p.lineTo(274, 828);
  p.quadraticCurveTo(337, 832, 363, 803);
  p.bezierCurveTo(324, 607, 295, 348, 259, 296);
  p.quadraticCurveTo(232, 256, 98, 219);
  p.lineTo(68, 201);
  p.quadraticCurveTo(5, 236, -66, 201);
  p.closePath();
}
export function coat(ctx, item) {
  const [shade, wool, light] = item.wool;
  ctx.save();
  ctx.translate(item.x, 0);
  hanger(ctx);
  ctx.save();
  ctx.translate(12, 13);
  form(ctx, coatOutline, 'rgba(7,18,18,.35)');
  ctx.restore();
  form(
    ctx,
    coatOutline,
    gradient(ctx, -334, 520, 340, 425, [
      [0, shade],
      [0.11, light],
      [0.22, wool],
      [0.34, shade],
      [0.53, wool],
      [0.78, light],
      [0.87, shade],
      [1, wool],
    ]),
    shade,
    3,
  );
  ctx.save();
  ctx.clip();
  ctx.beginPath();
  for (let i = -1100; i < 950; i += 11) {
    ctx.moveTo(i, 170);
    ctx.lineTo(i + 440, 946);
  }
  ctx.strokeStyle = 'rgba(238,219,180,.078)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  for (let i = -500; i < 1250; i += 44) {
    ctx.moveTo(i, 170);
    ctx.lineTo(i - 415, 946);
    ctx.moveTo(i + 6, 170);
    ctx.lineTo(i - 409, 946);
  }
  ctx.strokeStyle = 'rgba(20,29,24,.15)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  for (const sign of [-1, 1]) {
    ctx.save();
    ctx.scale(sign, 1);
    form(
      ctx,
      (p) => {
        p.moveTo(7, 421);
        p.lineTo(119, 299);
        p.lineTo(94, 280);
        p.lineTo(139, 274);
        p.lineTo(87, 199);
        p.lineTo(60, 194);
        p.quadraticCurveTo(58, 257, 7, 421);
        p.closePath();
      },
      gradient(ctx, 2, 315, 109, 291, [
        [0, shade],
        [1, light],
      ]),
      shade,
      3,
    );
    lines(
      ctx,
      [
        [251, 326],
        [239, 379],
        [210, 559],
      ],
      shade,
      3,
    );
    lines(
      ctx,
      [
        [278, 803],
        [350, 787],
      ],
      shade,
      4,
    );
    lines(
      ctx,
      [
        [269, 742],
        [336, 724],
      ],
      'rgba(247,227,195,.16)',
      2,
    );
    lines(
      ctx,
      [
        [95, 737],
        [189, 707],
      ],
      shade,
      13,
    );
    lines(
      ctx,
      [
        [94, 733],
        [189, 703],
      ],
      light,
      3,
    );
    ctx.restore();
  }
  lines(
    ctx,
    [
      [0, 425],
      [-8, 895],
    ],
    shade,
    3,
  );
  for (let y = 457; y <= 858; y += 109) {
    oval(ctx, 7, y + 2, 11, 12, shade);
    oval(ctx, 6, y, 9, 10, '#343331');
    lines(
      ctx,
      [
        [3, y - 3],
        [8, y + 3],
      ],
      '#9a8a72',
      2,
    );
  }
  ctx.restore();
}
