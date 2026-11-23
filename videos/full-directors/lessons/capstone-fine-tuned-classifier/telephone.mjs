function gradient(ctx, x1, y1, x2, y2, stops) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [offset, color] of stops) g.addColorStop(offset, color);
  return g;
}

function rounded(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function label(ctx, value, x, y, size, color, options = {}) {
  ctx.fillStyle = color;
  ctx.font = (options.weight || 600) + ' ' + size + 'px "Lesson ' + (options.family || 'Sans') + '"';
  ctx.textAlign = options.align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function desk(ctx) {
  ctx.fillStyle = gradient(ctx, 0, 0, 1730, 1080, [
    [0, '#b9e6e5'],
    [0.5, '#8bcacb'],
    [1, '#68a9b3'],
  ]);
  ctx.fillRect(0, 0, 1920, 1080);
  // Fixed flecks sit in the laminate. Their positions stay put as the phone rings.
  let seed = 79;
  const random = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
  ctx.fillStyle = '#f5ffff40';
  for (let i = 0; i < 1150; i++) {
    const x = random() * 1920,
      y = random() * 1080;
    ctx.fillRect(x, y, 1.5 + random() * 5, 1.5);
  }
}

function cord(ctx) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // A single cord exits the receiver, turns, and stretches toward the edge of the desk.
  for (const [dx, dy, width, color] of [
    [6, 13, 13, '#38667255'],
    [0, 0, 14, '#582f28'],
    [-2, -2, 3, '#c57858'],
  ]) {
    ctx.save();
    ctx.translate(dx, dy);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(400, 823);
    ctx.bezierCurveTo(399, 872, 399, 883, 375, 897);
    for (let i = 0; i <= 660; i++) {
      const u = i / 660,
        a = u * Math.PI * 31;
      const x = 375 - u * 413 - Math.sin(a) * 10;
      const y = 897 + Math.sin(u * Math.PI * 0.92) * 90 + Math.sin(a / 2) ** 2 * 44;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function housing(ctx) {
  ctx.save();
  ctx.shadowColor = '#2a515c80';
  ctx.shadowBlur = 37;
  ctx.shadowOffsetX = 26;
  ctx.shadowOffsetY = 41;
  rounded(ctx, 224, 113, 1501, 766, 85, '#768580');
  ctx.restore();
  rounded(
    ctx,
    218,
    108,
    1510,
    772,
    85,
    gradient(ctx, 500, 760, 510, 884, [
      [0, '#c6c1a9'],
      [0.72, '#9a9e8e'],
      [0.91, '#767e76'],
      [1, '#596861'],
    ]),
  );
  rounded(
    ctx,
    213,
    95,
    1508,
    750,
    80,
    gradient(ctx, 320, 95, 590, 843, [
      [0, '#fff9dd'],
      [0.05, '#fbf2d5'],
      [0.65, '#e6dfc5'],
      [0.98, '#d4cfb7'],
      [1, '#c3c1ad'],
    ]),
  );
  ctx.beginPath();
  ctx.moveTo(279, 130);
  ctx.quadraticCurveTo(292, 115, 333, 115);
  ctx.lineTo(1633, 115);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fffdeb';
  ctx.stroke();
  // A deep saddle behind the receiver gives the handset somewhere to settle.
  rounded(
    ctx,
    287,
    148,
    236,
    630,
    78,
    gradient(ctx, 282, 184, 532, 737, [
      [0, '#b1b2a1'],
      [0.33, '#939c8e'],
      [0.82, '#c5c6b2'],
      [1, '#edefd3'],
    ]),
  );
}

function receiverOutline(ctx) {
  ctx.beginPath();
  ctx.moveTo(334, 98);
  ctx.bezierCurveTo(308, 97, 286, 109, 276, 134);
  ctx.bezierCurveTo(251, 191, 238, 267, 255, 312);
  ctx.bezierCurveTo(267, 344, 288, 352, 308, 364);
  ctx.bezierCurveTo(329, 378, 333, 397, 330, 430);
  ctx.lineTo(311, 556);
  ctx.bezierCurveTo(305, 596, 296, 615, 273, 627);
  ctx.bezierCurveTo(243, 642, 221, 650, 212, 681);
  ctx.bezierCurveTo(199, 729, 206, 796, 234, 821);
  ctx.bezierCurveTo(268, 849, 402, 868, 452, 848);
  ctx.bezierCurveTo(486, 833, 499, 795, 498, 748);
  ctx.bezierCurveTo(499, 699, 485, 674, 459, 654);
  ctx.bezierCurveTo(439, 637, 435, 617, 442, 569);
  ctx.lineTo(469, 415);
  ctx.bezierCurveTo(474, 381, 479, 363, 508, 353);
  ctx.bezierCurveTo(544, 340, 564, 326, 574, 284);
  ctx.bezierCurveTo(586, 241, 582, 177, 561, 150);
  ctx.bezierCurveTo(534, 118, 407, 97, 334, 98);
  ctx.closePath();
}

function handset(ctx, shake) {
  ctx.save();
  ctx.translate(401, 466);
  ctx.rotate(shake);
  ctx.translate(-401, -466);
  ctx.save();
  ctx.translate(11, 17);
  ctx.shadowOffsetX = 7;
  ctx.shadowOffsetY = 11;
  ctx.shadowBlur = 17;
  ctx.shadowColor = '#4a44367a';
  receiverOutline(ctx);
  ctx.fillStyle = '#8c3b28';
  ctx.fill();
  ctx.restore();
  receiverOutline(ctx);
  ctx.fillStyle = gradient(ctx, 255, 340, 507, 386, [
    [0, '#c24125'],
    [0.05, '#e55930'],
    [0.18, '#f57a45'],
    [0.33, '#ff925b'],
    [0.58, '#f87840'],
    [0.86, '#de542b'],
    [1, '#c74b2a'],
  ]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Mold seams and curved end caps follow the shell rather than sitting flat on it.
  for (const [offset, color, width] of [
    [4, '#f9986466', 3],
    [0, '#ae432d', 4],
  ]) {
    ctx.save();
    ctx.translate(0, offset);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(243, 271);
    ctx.bezierCurveTo(292, 317, 506, 354, 581, 295);
    ctx.moveTo(203, 684);
    ctx.bezierCurveTo(266, 644, 441, 662, 505, 721);
    ctx.stroke();
    ctx.restore();
  }
  ctx.strokeStyle = '#ffd2a780';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(278, 223);
  ctx.bezierCurveTo(289, 137, 305, 115, 343, 116);
  ctx.bezierCurveTo(384, 117, 442, 126, 467, 134);
  ctx.moveTo(238, 740);
  ctx.bezierCurveTo(238, 701, 249, 687, 271, 681);
  ctx.stroke();
  ctx.restore();
  ctx.translate(396, 493);
  ctx.rotate(-1.413);
  label(ctx, 'ACCESS DESK', 1, 2, 27, '#fda377', { align: 'center', weight: 700 });
  label(ctx, 'ACCESS DESK', 0, 0, 27, '#af432d', { align: 'center', weight: 700 });
  ctx.restore();
}

function lamp(ctx, x, y, light) {
  rounded(ctx, x - 71, y - 28, 142, 66, 13, '#e9e8cf');
  rounded(ctx, x - 72, y - 32, 144, 64, 13, '#646a5f');
  rounded(ctx, x - 66, y - 27, 132, 54, 9, '#533e32');
  rounded(
    ctx,
    x - 61,
    y - 23,
    122,
    46,
    7,
    gradient(ctx, x, y - 23, x, y + 24, [
      [0, '#6b5145'],
      [0.54, '#463c38'],
      [1, '#302e2d'],
    ]),
  );
  ctx.save();
  ctx.globalAlpha = light;
  ctx.shadowBlur = 16;
  ctx.shadowColor = '#ffb33c';
  rounded(
    ctx,
    x - 61,
    y - 23,
    122,
    46,
    7,
    gradient(ctx, x, y - 23, x, y + 23, [
      [0, '#ffcc5b'],
      [0.42, '#ffef91'],
      [0.72, '#ffe46c'],
      [1, '#ffa62c'],
    ]),
  );
  ctx.restore();
  for (let dx = -50; dx <= 50; dx += 10) {
    ctx.fillStyle = '#ffe7ae36';
    ctx.fillRect(x + dx, y - 17, 2, 32);
  }
  ctx.fillStyle = '#faf2cf59';
  ctx.fillRect(x - 52, y - 20, 103, 2);
}

export { desk, cord, housing, handset, lamp };
