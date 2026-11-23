// The drawings come from the Decoding short. Both poses wear the same striped collar.
const ink = '#382f3a';
const orange = '#aa432a';

function stroke(ctx, points, color, width) {
  ctx.beginPath();
  for (const [i, [x, y]] of points.entries()) {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function ellipse(ctx, x, y, rx, ry, rotation, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

// The two poses share the long muzzle, saddle patch and striped collar.
export function runningHound(c, leap) {
  c.save();
  c.translate(4 + 5 * leap, -7 * leap);
  c.rotate(-0.025 * leap);
  c.fillStyle = '#4b3940';
  c.beginPath();
  c.moveTo(125, 92);
  c.bezierCurveTo(112, 114, 97, 131, 63, 141);
  c.lineTo(33, 142);
  c.quadraticCurveTo(24, 144, 28, 148);
  c.lineTo(61, 151);
  c.quadraticCurveTo(110, 148, 149, 111);
  c.moveTo(195, 92);
  c.quadraticCurveTo(215, 118, 259, 131);
  c.lineTo(275, 148);
  c.quadraticCurveTo(283, 156, 282, 143);
  c.lineTo(269, 123);
  c.lineTo(228, 98);
  c.lineTo(220, 83);
  c.fill();

  c.beginPath();
  c.moveTo(111, 77);
  c.bezierCurveTo(75, 82, 40, 74, 23, 49);
  c.bezierCurveTo(43, 95, 82, 101, 108, 95);
  c.bezierCurveTo(122, 113, 100, 130, 62, 160);
  c.lineTo(36, 169);
  c.quadraticCurveTo(30, 176, 41, 176);
  c.lineTo(67, 171);
  c.bezierCurveTo(102, 151, 128, 126, 153, 113);
  c.bezierCurveTo(177, 99, 178, 118, 200, 114);
  c.bezierCurveTo(219, 112, 230, 89, 236, 76);
  c.quadraticCurveTo(252, 69, 265, 65);
  c.lineTo(282, 67);
  c.quadraticCurveTo(305, 72, 309, 57);
  c.lineTo(309, 53);
  c.lineTo(279, 48);
  c.quadraticCurveTo(271, 29, 250, 36);
  c.quadraticCurveTo(240, 36, 231, 51);
  c.quadraticCurveTo(209, 70, 190, 75);
  c.bezierCurveTo(164, 73, 147, 61, 125, 69);
  c.closePath();
  c.fillStyle = '#fbdfae';
  c.fill();
  c.strokeStyle = '#7b5749';
  c.lineWidth = 2.2;
  c.stroke();
  c.save();
  c.clip();
  c.beginPath();
  c.moveTo(20, 43);
  c.lineTo(53, 75);
  c.lineTo(44, 93);
  c.lineTo(12, 73);
  c.fillStyle = '#655052';
  c.fill();
  ellipse(c, 144, 73, 43, 31, -0.2, '#58414a');
  ellipse(c, 253, 43, 15, 29, 0.7, '#5d4347');
  stroke(
    c,
    [
      [234, 50],
      [251, 77],
    ],
    orange,
    10,
  );
  stroke(
    c,
    [
      [235, 49],
      [252, 76],
    ],
    '#f8c783',
    2,
  );
  c.restore();

  c.beginPath();
  // The toe rolls forward as the wrist drops to the ground.
  const land = 1 - leap;
  const wristX = 270 - 19 * land;
  const wristY = 110 + 61 * land;
  const toeX = 291 - 22 * land;
  const toeY = 96 + 80 * land;
  c.moveTo(206, 96);
  c.quadraticCurveTo(230 - 7 * land, 114 + 20 * land, wristX, wristY);
  c.quadraticCurveTo(wristX + 7, wristY - 2, toeX - 3, toeY - 3);
  c.quadraticCurveTo(toeX + 6, toeY - 5, toeX + 2, toeY + 3);
  c.quadraticCurveTo(toeX - 2, toeY + 6, wristX + 2, wristY + 9);
  c.quadraticCurveTo(229 - 7 * land, 131 + 11 * land, 193, 110);
  c.fillStyle = '#efd4a5';
  c.fill();
  c.strokeStyle = '#816153';
  c.lineWidth = 1.4;
  c.stroke();
  c.beginPath();
  c.moveTo(252, 38);
  c.bezierCurveTo(237, 32, 228, 30, 216, 26);
  c.bezierCurveTo(221, 45, 232, 57, 249, 56);
  c.closePath();
  c.fillStyle = ink;
  c.fill();
  ellipse(c, 305, 55, 5.8, 3.6, -0.06, ink);
  ellipse(c, 270, 46, 2.7, 2.7, 0, ink);
  stroke(
    c,
    [
      [289, 65],
      [298, 66],
      [303, 64],
    ],
    ink,
    1.7,
  );
  c.restore();
}

export function sleepingHound(c, breath) {
  c.save();
  c.beginPath();
  c.moveTo(64, 125);
  c.bezierCurveTo(56, 86, 88, 61 - breath * 3, 134, 58 - breath * 3);
  c.bezierCurveTo(180, 54 - breath * 3, 202, 66, 216, 84);
  c.bezierCurveTo(239, 97, 246, 115, 260, 121);
  c.quadraticCurveTo(272, 129, 258, 138);
  c.bezierCurveTo(252, 141, 222, 140, 204, 137);
  c.bezierCurveTo(168, 148, 80, 152, 64, 125);
  c.closePath();
  c.fillStyle = '#f7dfb4';
  c.fill();
  c.strokeStyle = '#746251';
  c.lineWidth = 2.3;
  c.stroke();
  c.save();
  c.clip();
  ellipse(c, 123, 75 - breath * 2, 49, 29, -0.35, '#58414a');
  ellipse(c, 226, 98, 25, 34, -0.35, '#72564f');
  stroke(
    c,
    [
      [221, 82],
      [202, 115],
    ],
    orange,
    9,
  );
  stroke(
    c,
    [
      [221, 85],
      [204, 117],
    ],
    '#d6ceaf',
    2,
  );
  c.restore();
  c.beginPath();
  c.moveTo(76, 101);
  c.bezierCurveTo(47, 120, 64, 151, 107, 151);
  c.bezierCurveTo(145, 158, 170, 144, 194, 127);
  c.bezierCurveTo(156, 142, 117, 144, 104, 131);
  c.quadraticCurveTo(81, 113, 76, 101);
  c.closePath();
  c.fillStyle = '#655052';
  c.fill();
  c.beginPath();
  c.moveTo(216, 90);
  c.bezierCurveTo(202, 88, 185, 94, 187, 104);
  c.quadraticCurveTo(191, 126, 210, 127);
  c.quadraticCurveTo(224, 121, 216, 90);
  c.fillStyle = ink;
  c.fill();
  c.beginPath();
  c.moveTo(225, 114);
  c.quadraticCurveTo(230, 120, 236, 117);
  c.strokeStyle = ink;
  c.lineWidth = 2.5;
  c.stroke();
  ellipse(c, 261, 130, 6, 4, 0.22, ink);
  c.beginPath();
  c.moveTo(110, 115);
  c.bezierCurveTo(118, 96, 148, 97, 157, 108);
  c.moveTo(143, 131);
  c.bezierCurveTo(162, 121, 173, 128, 182, 131);
  c.moveTo(204, 137);
  c.quadraticCurveTo(213, 132, 226, 137);
  c.strokeStyle = '#a5997d';
  c.lineWidth = 1.5;
  c.stroke();
  c.restore();
}
