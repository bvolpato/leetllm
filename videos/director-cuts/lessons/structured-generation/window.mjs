// The window is drawn in the photograph's own 800 by 500 coordinate system.
const ink = '#243153';
const mint = '#b6d7c3';
const rose = '#df675a';
const cream = '#fff1cc';

function shape(c, d, fill, stroke, width = 1) {
  c.beginPath();
  d(c);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}

function polygon(c, points, fill) {
  shape(c, p => {
    p.moveTo(...points[0]);
    for (const point of points.slice(1)) p.lineTo(...point);
    p.closePath();
  }, fill);
}

function oval(c, x, y, rx, ry, color, angle = 0) {
  shape(c, p => p.ellipse(x, y, rx, ry, angle, 0, 2 * Math.PI), color);
}

function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}

function leaf(c, x, y, length, angle, color) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  shape(c, p => {
    p.moveTo(0, 0);
    p.quadraticCurveTo(length * 0.35, -length * 0.35, length, 0);
    p.quadraticCurveTo(length * 0.43, length * 0.19, 0, 0);
  }, color);
  c.restore();
}

function aster(c, x, y, r, color, twist) {
  for (let i = 0; i < 13; i++) {
    const a = i * Math.PI * 2 / 13 + twist;
    oval(c, x + Math.cos(a) * r * 0.54, y + Math.sin(a) * r * 0.54,
      r * (0.45 + 0.045 * Math.sin(i * 4)), r * 0.13, color, a);
  }
  oval(c, x, y, r * 0.25, r * 0.24, '#d29937');
  oval(c, x - 1.6, y - 1.8, r * 0.13, r * 0.10, '#f4c76a');
}

function bouquet(c, base, baseY, flowers, colors) {
  for (const [i, f] of flowers.entries()) {
    const [x, y, radius] = f;
    shape(c, p => {
      p.moveTo(base + (i % 4) * 2, baseY);
      p.quadraticCurveTo(base + (x - base) * 0.34, y + 26, x, y);
    }, null, i % 2 ? '#486761' : '#385854', 3.2);
    const lx = base + (x - base) * 0.64;
    const ly = baseY + (y - baseY) * 0.68;
    leaf(c, lx, ly, 43, i % 2 ? -0.65 : -2.4, i % 3 ? '#567a65' : '#78977a');
    leaf(c, lx + 1, ly + 18, 35, i % 2 ? -2.45 : -0.54, '#44665c');
    aster(c, x, y, radius, colors[i % colors.length], i * 0.38);
  }
  polygon(c, [[base - 39, baseY - 17], [base + 39, baseY - 17],
    [base + 27, baseY + 50], [base - 29, baseY + 50]], '#546b75');
  rect(c, base - 40, baseY - 18, 80, 6, '#90a7a4');
  polygon(c, [[base - 28, baseY - 10], [base - 18, baseY - 10],
    [base - 12, baseY + 45], [base - 19, baseY + 45]], '#758c8d');
}

function hangingSign(c, turn) {
  const swing = Math.sin(turn * Math.PI * 2) * (1 - turn);
  const axis = Math.cos(turn * Math.PI);
  c.save();
  c.translate(407, 120);
  c.rotate(0.032 * swing - 0.017);
  // The card turns about its vertical axis. Both ends of the cord follow it.
  shape(c, p => {
    p.moveTo(-147 * axis, 86); p.lineTo(0, 0); p.lineTo(147 * axis, 86);
  }, null, '#546761', 3.5);
  oval(c, 0, 0, 5.1, 5.1, ink);
  c.translate(0, 152);
  c.scale(Math.max(0.018, Math.abs(axis)), 1);
  const closed = axis < 0;
  function plaque(offset, fill, stroke, width) {
    shape(c, p => {
      const w = 184 - offset, h = 72 - offset, a = 20, b = 12;
      p.moveTo(-w + a, -h); p.lineTo(w - a, -h);
      p.quadraticCurveTo(w - a + 1, -h + b, w, -h + a);
      p.lineTo(w, h - a); p.quadraticCurveTo(w - a + 2, h - b, w - a, h);
      p.lineTo(-w + a, h); p.quadraticCurveTo(-w + a - 2, h - b, -w, h - a);
      p.lineTo(-w, -h + a); p.quadraticCurveTo(-w + a, -h + b, -w + a, -h); p.closePath();
    }, fill, stroke, width);
  }
  c.save();
  c.translate(4, 6);
  plaque(0, '#484353');
  c.restore();
  plaque(0, closed ? '#ad493f' : '#324d57', '#563a3c', 2);
  plaque(6, null, closed ? '#fbcc9a' : mint, 1.8);
  plaque(10, null, closed ? '#d78e6b' : '#78998f', 0.8);
  oval(c, -147, -65, 3.7, 3, '#473637');
  oval(c, 147, -65, 3.7, 3, '#473637');
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = cream; c.font = 'italic 18px "Lesson Serif"';
  c.fillText("We're", 0, -37);
  c.font = 'bold 74px "Lesson Sans"';
  c.fillText(closed ? 'CLOSED' : 'OPEN', 0, 10);
  shape(c, p => { p.moveTo(-42, 50); p.lineTo(42, 50); }, null, '#edc59d', 1.5);
  c.restore();
}

export function drawWindow(c, turn) {
  c.save();
  c.beginPath(); c.rect(0, 0, 800, 500); c.clip();
  const glass = c.createLinearGradient(0, 0, 680, 505);
  glass.addColorStop(0, '#819b9d'); glass.addColorStop(0.58, '#c3d1bc'); glass.addColorStop(1, '#e7d9b1');
  rect(c, 0, 0, 800, 500, glass);
  // A reflection of the buildings across the street, seen behind the lettering.
  polygon(c, [[0, 80], [210, 120], [252, 113], [440, 164], [440, 447], [0, 447]], '#97aaa3');
  for (let i = 0; i < 8; i++) {
    const x = 16 + i * 50, y = 139 + i * 8;
    rect(c, x, y, 19, 42, '#8da29d'); rect(c, x, y + 72, 19, 37, '#91a49d');
  }
  polygon(c, [[580, 0], [655, 0], [426, 500], [343, 500]], '#ffffff19');
  polygon(c, [[671, 0], [685, 0], [472, 500], [454, 500]], '#ffffff24');
  // Painted door stiles and the neighboring display windows.
  for (const x of [194, 612]) {
    rect(c, x - 6, 0, 28, 500, '#536a68');
    rect(c, x - 4, 0, 17, 500, '#879e91'); rect(c, x - 4, 0, 3, 500, '#c3cbaf');
  }
  rect(c, 0, 425, 800, 75, '#68847a'); rect(c, 0, 428, 800, 7, '#9eb19c');
  rect(c, 216, 425, 388, 75, '#829c88'); rect(c, 238, 447, 343, 3, '#638375');
  rect(c, 239, 450, 3, 50, '#738c7e');
  const handle = c.createLinearGradient(0, 0, 16, 0);
  handle.addColorStop(0, '#7d7d65'); handle.addColorStop(0.48, '#e0ca93'); handle.addColorStop(1, '#889180');
  c.save(); c.translate(581, 331);
  oval(c, 3, 9, 8, 9, '#788d7e'); oval(c, 3, 61, 8, 9, '#788d7e');
  shape(c, p => p.roundRect(0, 2, 12, 64, 5), handle);
  c.restore();
  bouquet(c, 104, 410, [[22,308,22],[53,255,27],[87,297,31],[138,263,25],[160,323,30],[69,342,23],[126,353,23]],
    ['#f6d894', '#f0ccbf', '#e4968e']);
  bouquet(c, 705, 401, [[642,297,24],[660,249,22],[708,264,32],[775,224,27],[749,306,29],[789,343,27],[690,334,23]],
    ['#f0d7ba', '#b2a7cb', '#f6d58e']);
  // A striped canvas awning. The small seams make the scallops legible in the wide shot.
  rect(c, 0, 0, 800, 47, '#334c5829');
  for (let i = -1; i < 12; i++) {
    const x = i * 76 - 19;
    shape(c, p => {
      p.moveTo(x + 16, -20); p.lineTo(x + 92, -20); p.lineTo(x + 76, 42);
      p.quadraticCurveTo(x + 39, 65, x, 42); p.closePath();
    }, i % 2 ? '#e6b8a0' : rose);
    shape(c, p => { p.moveTo(x + 2, 38); p.quadraticCurveTo(x + 38, 59, x + 74, 38); },
      null, i % 2 ? '#cf9d87' : '#c9554e', 1.6);
  }
  c.fillStyle = '#fff0c8'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = 'italic 32px "Lesson Serif"'; c.fillText('Aster Flowers', 405, 88);
  hangingSign(c, turn);
  rect(c, 0, 490, 800, 10, '#465f5c');
  c.restore();
}
