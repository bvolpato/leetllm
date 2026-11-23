// The red receiver comes from the directed Voice Agents short.
const darkRed = '#731f24';
function oval(g, x, y, rx, ry, angle, color) {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, rx, ry, angle, 0, 2 * Math.PI);
  g.fill();
}
function linear(g, x, y, a, b, stops) {
  const fill = g.createLinearGradient(x, y, a, b);
  for (const [at, color] of stops) fill.addColorStop(at, color);
  return fill;
}

function curl(g) {
  g.beginPath();
  g.moveTo(46, 291);
  g.bezierCurveTo(66, 348, 44, 357, 38, 381);
  for (let i = 0; i < 18; i++) {
    const cy = 381 + i * 13;
    const cx = 38 - 0.00128 * (i * 13) ** 2;
    g.bezierCurveTo(cx - 23, cy - 17, cx - 30, cy + 7, cx - 5, cy + 12);
    g.bezierCurveTo(cx + 27, cy + 21, cx + 29, cy - 1, cx, cy + 13);
  }
  for (const [w, c] of [[8, darkRed], [3, '#d8583c']]) {
    g.lineWidth = w;
    g.strokeStyle = c;
    g.stroke();
  }
}

// Each bell is viewed obliquely. The rows of holes follow the plane of the cap.
function bell(g, x, y, tilt) {
  g.save();
  g.translate(x, y);
  g.rotate(tilt);
  const bellFill = linear(g, 0, -99, 0, 105, [[0, '#ff9171'], [0.15, '#e94f32'], [0.62, '#bf3223'], [1, '#7c2030']]);
  g.fillStyle = bellFill;
  g.beginPath();
  g.moveTo(-103, -43);
  g.bezierCurveTo(-81, -56, -54, -69, -33, -83);
  g.bezierCurveTo(-13, -99, 2, -103, 20, -98);
  g.lineTo(33, 95);
  g.bezierCurveTo(4, 104, -11, 94, -34, 75);
  g.bezierCurveTo(-57, 55, -87, 49, -101, 46);
  g.bezierCurveTo(-111, 24, -113, -13, -103, -43);
  g.fill();
  oval(g, 20, 0, 69, 102, 0, darkRed);
  oval(g, 24, -2, 67, 101, 0, '#f16e4a');
  oval(g, 29, -1, 64, 97, 0, '#962e28');
  oval(g, 32, -2, 61, 94, 0, bellFill);
  for (let r = -4; r <= 4; r++) {
    for (let c = -3; c <= 3; c++) {
      const px = c * 12 + (Math.abs(r) % 2) * 6;
      const py = r * 16;
      if ((px / 44) ** 2 + (py / 71) ** 2 > 1) continue;
      oval(g, px + 32, py, 3.8, 5.8, 0, '#ff9570');
      oval(g, px + 32, py - 1.6, 3.6, 5.4, 0, '#52202a');
    }
  }
  g.restore();
}

export function handset(g) {
  g.save();
  g.translate(235, 492);
  g.rotate(-0.25);
  g.scale(1.18, 1.18);
  g.lineCap = 'round';
  curl(g);
  function handlePath() {
    g.beginPath();
    g.moveTo(33, -300);
    g.bezierCurveTo(-45, -326, -111, -300, -132, -243);
    g.bezierCurveTo(-188, -90, -171, 108, -101, 234);
    g.bezierCurveTo(-71, 290, -4, 312, 48, 288);
    g.lineTo(46, 211);
    g.bezierCurveTo(-4, 224, -42, 177, -59, 113);
    g.bezierCurveTo(-86, 20, -87, -107, -43, -187);
    g.bezierCurveTo(-23, -222, 2, -222, 41, -222);
    g.closePath();
  }
  g.save();
  g.translate(19, 23);
  g.shadowBlur = 22;
  g.shadowColor = '#70567565';
  handlePath();
  g.fillStyle = '#745b792d';
  g.fill();
  g.restore();
  handlePath();
  g.fillStyle = linear(g, -167, -15, -54, -22, [[0, '#a22d32'], [0.2, '#e34b32'], [0.46, '#fa7550'], [0.72, '#e24931'], [1, '#a12a27']]);
  g.fill();
  g.strokeStyle = '#9c302a';
  g.lineWidth = 2.5;
  g.stroke();
  g.beginPath();
  g.moveTo(-109, -223);
  g.bezierCurveTo(-150, -117, -153, 31, -125, 120);
  g.strokeStyle = '#ffad89';
  g.lineWidth = 6;
  g.stroke();
  bell(g, 0, -249, 0.21);
  bell(g, 33, 249, -0.32);
  g.restore();
}

