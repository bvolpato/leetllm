export const C = {
  paper: '#f3ecd9',
  white: '#fffbef',
  ink: '#192b31',
  muted: '#52646a',
  hair: '#b7bba9',
  green: '#076e59',
  mint: '#b2e0bd',
  blue: '#285992',
  sky: '#c9dae8',
  red: '#ac4235',
  peach: '#f7d1b4',
  brass: '#daaf56',
  dark: '#162b32',
  night: '#203a42',
  light: '#f3efde',
};
export const clamp = (x) => Math.max(0, Math.min(1, x));
export function cue(k, beat, phrase, seconds = 0.6) {
  const i = k.beat.beatIndex;
  if (i !== beat) return Number(i > beat);
  const t = k.reveal(phrase, seconds);
  return t * t * (3 - 2 * t);
}
export function rect(c, x, y, w, h, color, r = 0, edge = null) {
  if (w <= 0 || h <= 0) return;
  c.beginPath();
  c.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
  c.fillStyle = color;
  c.fill();
  if (edge) {
    c.strokeStyle = edge;
    c.lineWidth = 2;
    c.stroke();
  }
}
export function line(c, x, y, u, v, color = C.ink, width = 3) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(u, v);
  c.lineWidth = width;
  c.strokeStyle = color;
  c.stroke();
}
export function circle(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}
export function poly(c, pts, color) {
  c.beginPath();
  c.moveTo(...pts[0]);
  for (const p of pts.slice(1)) c.lineTo(...p);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
export function txt(
  c,
  s,
  x,
  y,
  size = 40,
  color = C.ink,
  face = 'Sans',
  align = 'left',
  weight = 400,
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(String(s), x, y);
}
export function label(c, s, x, y, color = C.muted, size = 28) {
  txt(c, s, x, y, size, color, 'Mono');
}
export function title(c, s, dark = false) {
  const ink = dark ? C.light : C.ink;
  rect(c, 0, 0, 1920, 1080, dark ? C.dark : C.paper);
  txt(c, s, 95, 129, 72, ink, 'Serif');
  line(c, 98, 171, 1820, 171, dark ? '#556c70' : C.hair, 2);
}
export function sheet(c, x, y, w, h, fill = C.white) {
  rect(c, x + 6, y + 10, w, h, '#192b311c', 5);
  rect(c, x, y, w, h, fill, 5);
  for (let i = 0; i < Math.floor((w - 60) / 47); i++)
    circle(c, x + 34 + i * 47, y + 16, 3.7, '#a9aa97');
}
export function result(c, s, x, y, color = C.green, size = 48) {
  txt(c, s, x, y, size, color, 'Serif');
}
const angle = (m, max) => Math.PI * (0.75 + (1.5 * m) / max);
export function sweep(c, cx, cy, r, from, to, max, color, width) {
  if (to <= from) return;
  c.beginPath();
  c.arc(cx, cy, r, angle(from, max), angle(to, max));
  c.lineWidth = width;
  c.strokeStyle = color;
  c.stroke();
}
export function dial(
  c,
  {
    x = 506,
    y = 577,
    r = 328,
    max = 90,
    hand = 0,
    limit = null,
    limitArrival = 1,
    span,
    handLabel = 'ELAPSED',
    digits = String(Math.round(hand)),
    innerSpan = null,
  },
) {
  circle(c, x + 4, y + 11, r + 12, '#17272a25');
  circle(c, x, y, r + 12, C.ink);
  circle(c, x, y, r + 5, '#b2b9a8');
  circle(c, x, y, r - 2, C.white);
  const point = (v, rr) => [x + rr * Math.cos(angle(v, max)), y + rr * Math.sin(angle(v, max))];
  for (let i = 0; i <= max; i++) {
    const major = i % (max === 90 ? 10 : 5) === 0;
    line(
      c,
      ...point(i, r - 18),
      ...point(i, r - (major ? 43 : 29)),
      major ? C.ink : C.hair,
      major ? 4 : 2,
    );
    if (major) {
      const [u, v] = point(i, r - 73);
      txt(c, i, u, v + 11, 32, C.ink, 'Mono', 'center');
    }
  }
  if (span) sweep(c, x, y, r - 100, span[0], span[1], max, span[2], 16);
  if (innerSpan) sweep(c, x, y, r - 130, innerSpan[0], innerSpan[1], max, innerSpan[2], 12);
  if (limit !== null) {
    const [u, v] = point(limit, r - 7 + 68 * (1 - limitArrival));
    c.save();
    c.translate(u, v);
    c.rotate(angle(limit, max));
    poly(
      c,
      [
        [-23, 0],
        [13, -12],
        [13, 12],
      ],
      C.green,
    );
    c.restore();
  }
  const a = angle(hand, max);
  c.save();
  c.translate(x, y);
  c.rotate(a);
  poly(
    c,
    [
      [-33, -11],
      [r - 114, -4],
      [r - 91, 0],
      [r - 114, 4],
      [-33, 11],
    ],
    C.blue,
  );
  c.restore();
  circle(c, x, y, 17, C.ink);
  circle(c, x, y, 7, C.brass);
  c.save();
  c.translate(x, y);
  c.scale(r / 328, r / 328);
  rect(c, -104, 117, 208, 82, '#e0e5d8', 10);
  txt(c, digits + ' min', 0, 172, 44, C.ink, 'Mono', 'center');
  txt(c, handLabel, 0, 239, 26, C.muted, 'Mono', 'center');
  c.restore();
}
export function codeReply(
  c,
  fields,
  x,
  y,
  { size = 34, lines = 6, hot = '', hotColor = C.red } = {},
) {
  const entries = Object.entries(fields);
  const rows = [
    '{',
    ...entries.map(
      ([key, val], i) =>
        '  "' + key + '": ' + JSON.stringify(val) + (i === entries.length - 1 ? '' : ','),
    ),
    '}',
  ];
  rows.slice(0, lines).forEach((s, i) => {
    const active = entries[i - 1]?.[0] === hot;
    if (active)
      rect(
        c,
        x - 9,
        y + i * 59 - size - 5,
        Math.min(880, s.length * size * 0.61 + 22),
        size + 18,
        '#f1debc',
        4,
      );
    txt(c, s, x, y + i * 59, size, active ? hotColor : C.ink, 'Mono');
  });
}
export function arrow(c, x, y, u, v, color, width = 5) {
  line(c, x, y, u, v, color, width);
  const a = Math.atan2(v - y, u - x);
  c.save();
  c.translate(u, v);
  c.rotate(a);
  poly(
    c,
    [
      [0, 0],
      [-20, -10],
      [-20, 10],
    ],
    color,
  );
  c.restore();
}
