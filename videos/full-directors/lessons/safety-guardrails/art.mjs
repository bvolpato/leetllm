export const C = {
  ink: '#15363d',
  deep: '#0e3039',
  frame: '#234b50',
  sea: '#28777b',
  mint: '#9bd7bf',
  paper: '#f5f0dc',
  white: '#fffbed',
  edge: '#d4cbb4',
  grey: '#526a66',
  red: '#a44330',
  blush: '#f4d7bc',
  gold: '#f0bd69',
  blue: '#b4d2c4',
  teal: '#11655f',
};
export function box(c, x, y, w, h, color, r = 0) {
  c.fillStyle = color;
  if (r) {
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    c.fill();
  } else c.fillRect(x, y, w, h);
}
export function line(c, x, y, u, v, color = C.ink, width = 1) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(u, v);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
export function poly(c, points, color) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
export function dot(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}
export function type(c, s, x, y, size = 20, color = C.ink, family = 'Sans', weight = 400, align = 'left') {
  c.fillStyle = color;
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(String(s), x, y);
}
export function micro(c, s, x, y, color = C.grey, align = 'left') {
  type(c, s, x, y, 15, color, 'Mono', 500, align);
}
export function rivet(c, x, y) {
  dot(c, x + 0.5, y + 1, 3, '#112e35');
  dot(c, x, y, 2.6, '#abb9a8');
  line(c, x - 1.3, y + 1, x + 1.3, y - 1, C.grey, 1);
}
export function tag(c, s, x, y, color = C.ink, fill = C.paper, size = 17) {
  c.font = '600 ' + size + 'px "Lesson Sans"';
  const w = c.measureText(s).width + 22;
  box(c, x, y - 23, w, 30, fill, 3);
  type(c, s, x + 11, y, size, color, 'Sans', 600);
  return w;
}
export function paper(c, x, y, w, h, fill = C.white) {
  box(c, x + 4, y + 6, w, h, '#c5bea7', 2);
  box(c, x, y, w, h, fill, 2);
}
export function ticket(c, x, y, w, h, fill = C.white) {
  paper(c, x, y, w, h, fill);
  for (let i = 0; i < w - 8; i += 14)
    poly(
      c,
      [
        [x + i, y + h],
        [x + i + 7, y + h - 5],
        [x + i + 14, y + h],
      ],
      C.paper,
    );
}
export function tide(c, x, y, s = 1, color = C.teal) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  poly(
    c,
    [
      [0, 0],
      [34, 0],
      [29, 8],
      [8, 8],
    ],
    color,
  );
  box(c, 7, -7, 20, 6, color);
  box(c, 14, -11, 7, 4, color);
  line(c, 0, 12, 32, 12, color, 2);
  c.restore();
}
export function page(c, label, headline) {
  box(c, 0, 0, 960, 540, C.paper);
  box(c, 0, 0, 960, 76, C.deep);
  box(c, 14, 15, 216, 40, C.paper);
  tide(c, 26, 26, 0.79);
  micro(c, 'EAST QUAY  /', 64, 31);
  micro(c, label.toUpperCase(), 26, 50);
  type(c, headline, 30, 112, 42, C.ink, 'Serif', 500);
  line(c, 30, 451, 930, 451, C.edge, 1);
  box(c, 0, 516, 960, 17, C.deep);
  box(c, 0, 533, 960, 7, C.sea);
}
export function strip(c, s, sub = '', accent = C.teal) {
  box(c, 236, 23, 4, 42, accent === C.red ? C.gold : C.mint);
  type(c, s, 253, sub ? 37 : 50, 23, C.white, 'Sans', 600);
  if (sub) type(c, sub, 253, 66, 17, '#becec3');
}
export function cue(clock, beat, phrase, seconds = 0) {
  const i = clock.beat.beatIndex;
  if (i !== beat) return Number(i > beat);
  return clock.reveal(phrase, seconds);
}
export function alpha(c, t, draw) {
  if (t <= 0) return;
  c.save();
  c.globalAlpha *= t;
  draw();
  c.restore();
}
export const lerp = (a, b, t) => a + (b - a) * t;
export function horizon(c, x, y, w, h) {
  c.save();
  c.translate(x, y);
  c.scale(w / 400, h / 250);
  box(c, 0, 0, 400, 250, '#d9ddc7');
  dot(c, 315, 62, 29, '#fce7b4');
  poly(
    c,
    [
      [0, 106],
      [25, 95],
      [65, 100],
      [98, 86],
      [180, 105],
      [225, 90],
      [279, 87],
      [316, 73],
      [400, 93],
      [400, 150],
      [0, 150],
    ],
    '#9cbaab',
  );
  box(c, 0, 124, 400, 126, '#71aaa2');
  for (let i = 0; i < 23; i++) {
    const xx = (i * 79) % 375,
      yy = 133 + ((i * 37) % 107);
    line(c, xx, yy, xx + 8 + (i % 20), yy, '#add0b9', 1.6);
  }
  poly(
    c,
    [
      [170, 166],
      [325, 166],
      [309, 181],
      [189, 181],
    ],
    '#23454b',
  );
  poly(
    c,
    [
      [190, 160],
      [311, 160],
      [325, 166],
      [180, 166],
    ],
    '#d68a53',
  );
  box(c, 195, 142, 109, 18, C.paper);
  box(c, 211, 133, 71, 12, '#d9e2cf');
  box(c, 260, 124, 9, 10, '#bb6744');
  for (let k = 0; k < 9; k++) box(c, 201 + k * 11, 147, 7, 6, '#416d70', 1);
  line(c, 187, 183, 327, 183, '#c0d4ba', 2);
  line(c, 181, 187, 312, 187, '#c0d4ba');
  poly(
    c,
    [
      [0, 208],
      [125, 188],
      [187, 201],
      [0, 232],
    ],
    '#4a6159',
  );
  for (let i = 0; i < 3; i++) {
    box(c, 10 + i * 46, 202 - i * 7, 6, 36, '#51655a');
  }
  c.restore();
}
export function reader(c, x, y, build, scale = 1) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  box(c, 86, 210, 18, 55, '#445a58');
  box(c, 37, 259, 114, 7, '#52665b', 3);
  poly(
    c,
    [
      [13, 31],
      [27, 11],
      [160, 11],
      [178, 33],
      [178, 200],
      [164, 218],
      [20, 218],
      [13, 207],
    ],
    '#25454a',
  );
  box(c, 14, 20, 151, 189, '#31565a', 12);
  box(c, 25, 33, 130, 44, '#dae0c5', 3);
  type(c, 'EAST QUAY', 90, 61, 19, C.deep, 'Mono', 600, 'center');
  box(c, 27, 88, 125, 71, '#0c3337', 5);
  micro(c, 'LIVE BUILD', 89, 112, C.mint, 'center');
  type(c, build, 88, 149, 35, C.white, 'Mono', 600, 'center');
  box(c, 47, 177, 82, 7, '#153940', 3);
  line(c, 50, 184, 125, 184, '#698582', 1);
  rivet(c, 24, 198);
  rivet(c, 153, 198);
  c.restore();
}
export function monitor(c, x, y, w, h, title) {
  box(c, x + 4, y + 6, w, h, '#99a899', 10);
  box(c, x, y, w, h, C.frame, 10);
  box(c, x + 8, y + 8, w - 16, h - 16, C.deep, 5);
  micro(c, title, x + 24, y + 35, C.mint);
  line(c, x + 23, y + 48, x + w - 23, y + 48, '#54776f');
}
export function stamp(c, s, x, y, color = C.teal, w = 174) {
  c.save();
  c.translate(x, y);
  c.rotate(-0.025);
  c.strokeStyle = color;
  c.lineWidth = 2;
  c.strokeRect(0, 0, w, 35);
  type(c, s, w / 2, 24, 18, color, 'Mono', 600, 'center');
  c.restore();
}
