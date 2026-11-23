// Cambridge bridge engraving and airmail stationery from the approved short.
const W = 840;
const ink = '#182f4d';
const paper = '#f7ecce';

function polygon(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
}

function rect(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function line(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function circle(ctx, x, y, radius, color, stroke = 0) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  if (stroke) {
    ctx.lineWidth = stroke;
    ctx.strokeStyle = color;
    ctx.stroke();
  } else {
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function type(ctx, text, x, y, size, family = 'Sans', color = ink, align = 'left', weight = 400) {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.fillText(text, x, y);
}

// A two-ink landscape, cut into the silhouette of a postage stamp.
function postage(ctx) {
  ctx.save();
  ctx.translate(563, 31);
  ctx.fillStyle = '#fff6dd';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let x = 0; x < 216; x += 12) {
    ctx.lineTo(x + 2, 0);
    ctx.quadraticCurveTo(x + 6, 8, x + 10, 0);
  }
  ctx.lineTo(216, 0);
  for (let y = 0; y < 228; y += 12) {
    ctx.lineTo(216, y + 2);
    ctx.quadraticCurveTo(208, y + 6, 216, y + 10);
  }
  ctx.lineTo(216, 228);
  for (let x = 216; x > 0; x -= 12) {
    ctx.lineTo(x - 2, 228);
    ctx.quadraticCurveTo(x - 6, 220, x - 10, 228);
  }
  ctx.lineTo(0, 228);
  for (let y = 228; y > 0; y -= 12) {
    ctx.lineTo(0, y - 2);
    ctx.quadraticCurveTo(8, y - 6, 0, y - 10);
  }
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.rect(12, 12, 192, 204);
  ctx.clip();
  const sky = '#c3d8d4';
  const dark = '#244d68';
  rect(ctx, 12, 12, 192, 204, sky);
  circle(ctx, 143, 68, 38, '#ce5c43');
  for (let i = 0; i < 14; i++) {
    const h = 12 + ((i * 13) % 22);
    rect(ctx, i * 17, 122 - h, 16, h, '#829f9e');
  }
  rect(ctx, 12, 119, 192, 97, '#89b5bc');
  for (let i = 0; i < 28; i++) {
    const x = (i * 79) % 200;
    line(ctx, x, 146 + i * 2.6, x + 15 + (i % 18), 146 + i * 2.6, '#e6e8cb', 1.6);
  }
  // The arch cutouts leave the river visible underneath the deck.
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(-19, 112);
  ctx.lineTo(237, 112);
  ctx.lineTo(237, 153);
  for (let x = 237; x > -19; x -= 64) {
    ctx.lineTo(x - 6, 153);
    ctx.bezierCurveTo(x - 6, 119, x - 56, 119, x - 56, 153);
    ctx.lineTo(x - 64, 153);
  }
  ctx.closePath();
  ctx.fill();
  for (let x = 17; x < 210; x += 12) line(ctx, x, 103, x, 113, dark, 2);
  line(ctx, 10, 102, 206, 102, dark, 3);
  line(ctx, 10, 116, 206, 116, '#e6d9af', 2);
  ctx.restore();
  ctx.restore();
}

export function envelope(ctx, letter) {
  ctx.save();
  ctx.shadowColor = '#20344855';
  ctx.shadowBlur = 11;
  ctx.shadowOffsetY = 9;
  rect(ctx, 0, 0, W, 293, paper);
  ctx.shadowColor = 'transparent';
  const shade = ctx.createLinearGradient(0, 180, W, 0);
  shade.addColorStop(0, '#dfd0b6');
  shade.addColorStop(0.42, '#f4e6c9');
  shade.addColorStop(1, '#fff2d9');
  rect(ctx, 0, 0, W, 293, shade);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, 9);
  ctx.clip();
  for (let x = -28; x < W; x += 70) {
    polygon(
      ctx,
      [
        [x, 9],
        [x + 19, 9],
        [x + 29, 0],
        [x + 10, 0],
      ],
      '#ae4743',
    );
    polygon(
      ctx,
      [
        [x + 35, 9],
        [x + 54, 9],
        [x + 64, 0],
        [x + 45, 0],
      ],
      '#3a6484',
    );
  }
  ctx.restore();
  postage(ctx);
  // Cancellation waves extend past the etched image and onto the envelope.
  ctx.strokeStyle = '#39495880';
  ctx.lineWidth = 2.4;
  for (let n = 0; n < 4; n++) {
    const y = 63 + n * 7;
    ctx.beginPath();
    ctx.moveTo(500, y);
    ctx.bezierCurveTo(519, y - 12, 532, y + 11, 553, y);
    ctx.bezierCurveTo(568, y - 9, 584, y + 7, 605, y);
    ctx.stroke();
  }
  type(ctx, letter.city, 109, 125, 50, 'Serif');
  line(ctx, 108, 143, 482, 143, '#aa9c82', 1.5);
  for (let i = 0; i < 5; i++) {
    const x = 145 + i * 68;
    type(ctx, letter.zip[i], x, 249, 91, 'Mono', ink, 'center');
    line(ctx, x - 28, 261, x + 28, 261, '#9e8e74', 2);
  }
  ctx.restore();
}
