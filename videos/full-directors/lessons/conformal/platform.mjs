import {
  C,
  rect,
  text,
  line,
  ring,
  dot,
  poly,
  bracket,
  measure,
  head,
  backdrop,
  ease,
} from './drawing.mjs';
import { band } from './model.mjs';
const angle = (m) => (m / 60) * 2 * Math.PI - Math.PI / 2;
function dial(c, x, y, r, minute) {
  rect(c, x - 9, 0, 18, y, '#334743');
  rect(c, x - 21, y - r - 13, 42, 28, '#947b51', 6);
  dot(c, x + 3, y + 5, r + 6, '#614c3e');
  dot(c, x, y, r + 6, '#b6935f');
  dot(c, x, y, r, '#283d3d');
  dot(c, x, y, r - 8, '#f4ead1');
  for (let i = 0; i < 60; i++) {
    const a = angle(i),
      v = i % 5 === 0 ? 13 : 6;
    line(
      c,
      x + (r - 14) * Math.cos(a),
      y + (r - 14) * Math.sin(a),
      x + (r - 14 - v) * Math.cos(a),
      y + (r - 14 - v) * Math.sin(a),
      '#40504b',
      i % 5 === 0 ? 3 : 1,
    );
  }
  for (let i = 1; i <= 12; i++) {
    const a = angle(i * 5);
    text(
      c,
      i,
      x + (r - 45) * Math.cos(a),
      y + (r - 45) * Math.sin(a),
      22,
      C.ink,
      'center',
      'Serif',
      600,
    );
  }
  c.beginPath();
  c.arc(x, y, r - 11, angle(38), angle(42));
  c.lineWidth = 9;
  c.strokeStyle = '#c08326';
  c.stroke();
  const hand = (m, len, col, w) =>
    line(c, x, y, x + Math.cos(angle(m)) * len, y + Math.sin(angle(m)) * len, col, w);
  hand(5 * (8 + minute / 60), r * 0.47, '#3e504a', 8);
  hand(minute, r - 14, '#aa4638', 4);
  dot(c, x, y, 8, '#334743');
  dot(c, x, y, 3, '#d9af73');
}
function train(c, x) {
  c.save();
  c.translate(x, 344);
  for (const wx of [30, 52, 179, 201, 268, 290, 414, 436]) {
    dot(c, wx, 57, 11, '#263b39');
    dot(c, wx, 57, 5, '#758580');
  }
  for (const start of [0, 235]) {
    rect(c, start, 0, 227, 51, '#3a655e', 9);
    rect(c, start + 1, 4, 225, 32, '#f4d392', 7);
    rect(c, start + 3, 36, 222, 6, '#cb654c');
    for (let i = 0; i < 7; i++) {
      const xx = start + 10 + i * 30;
      rect(c, xx, 10, 24, 19, '#344e4f', 3);
      poly(
        c,
        [
          [xx + 2, 12],
          [xx + 19, 12],
          [xx + 7, 26],
          [xx + 2, 26],
        ],
        '#547478',
      );
    }
    rect(c, start + 78, 7, 29, 44, '#e6bc80', 2);
    rect(c, start + 81, 11, 22, 18, '#3e5d58', 2);
    line(c, start + 92, 9, start + 92, 49, '#7d704f', 1);
    rect(c, start + 6, -3, 213, 5, '#415955', 3);
  }
  line(c, 226, 43, 235, 43, '#243b39', 5);
  dot(c, 458, 38, 3, '#ffe6a1');
  c.restore();
}
export function station(c, t) {
  if (t.b === 3) {
    backdrop(c);
    head(c, 'LATENCY  /  EXAMPLE REQUEST', 'How much time should the window allow?');
    measure(c, band(40, 0, null), { showBand: false });
    text(c, 'radius  ?', 725, 185, 27, C.gold, 'center', 'Mono');
    return;
  }
  const sky = c.createLinearGradient(0, 0, 0, 410);
  sky.addColorStop(0, '#e1b28c');
  sky.addColorStop(1, '#f5deb3');
  rect(c, 0, 0, 960, 540, sky);
  dot(c, 842, 212, 47, '#f8ddaa');
  poly(
    c,
    [
      [0, 311],
      [92, 242],
      [155, 281],
      [235, 217],
      [351, 277],
      [434, 238],
      [554, 297],
      [693, 234],
      [822, 287],
      [930, 240],
      [960, 254],
      [960, 386],
      [0, 386],
    ],
    '#aa9c86',
  );
  for (let i = 0; i < 20; i++) {
    const h = 21 + ((i * 17) % 45);
    rect(c, i * 54, 339 - h, 45, h, '#827e6b');
    poly(
      c,
      [
        [i * 54 - 2, 340 - h],
        [i * 54 + 19, 325 - h],
        [i * 54 + 48, 340 - h],
      ],
      '#737562',
    );
  }
  rect(c, 0, 405, 960, 135, '#797563');
  rect(c, 0, 410, 960, 10, '#394d47');
  rect(c, 0, 427, 960, 6, '#514f42');
  for (let i = 0; i < 18; i++) {
    poly(
      c,
      [
        [i * 65, 420],
        [i * 65 + 9, 420],
        [i * 65 - 5, 431],
        [i * 65 - 15, 431],
      ],
      '#3f4841',
    );
  }
  rect(c, 0, 439, 960, 101, '#283d3b');
  rect(c, 0, 440, 960, 5, '#d6ad65');
  const approach = ease(t.amount(1, 'Watch the minute hand', 1.4));
  const replay = ease(t.amount(2, 'The hand passes', 1.15));
  const replaying = t.on(2, 'Replay the approach');
  const minute = replaying ? 40 + 3 * replay : 40 + 2 * approach;
  const arrival = band(40, 2, minute);
  const distanceToPlatform = 600 * (1 - t.amount(1, '', 10.5)) ** 1.5;
  train(c, 206 + 226 * (replaying ? replay : approach) - distanceToPlatform);
  dial(c, 228, 176, 133, minute);
  rect(c, 478, 0, 6, 49, '#53625b');
  rect(c, 853, 0, 6, 49, '#53625b');
  rect(c, 431, 48, 468, 178, '#8d7554', 9);
  rect(c, 435, 52, 460, 170, '#234440', 7);
  const minuteX = (m) => 498 + (m - arrival.lo) * 65;
  const stamp = (m) => '8:' + Math.floor(m);
  if (t.on(1, 'The brass arc')) {
    text(c, 'PREDICTED ARRIVAL WINDOW', 460, 80, 18, '#c7d9c4', 'left', 'Mono');
  } else {
    text(c, 'Would 8:42 count?', 460, 80, 27, C.text, 'left', 'Serif');
  }
  line(c, minuteX(arrival.lo), 149, minuteX(arrival.hi + 1), 149, '#748a7d', 2);
  for (let m = arrival.lo; m <= arrival.hi + 1; m++)
    line(c, minuteX(m), 144, minuteX(m), 154, '#b5c2ad', 2);
  bracket(c, minuteX(arrival.lo), minuteX(arrival.hi), 149, C.gold, 6);
  for (const m of [arrival.lo, arrival.center, arrival.hi]) {
    const forecast = m === arrival.center;
    text(c, stamp(m), minuteX(m), 118, forecast ? 22 : 31, forecast ? C.blue : C.text, 'center', 'Mono');
  }
  dot(c, minuteX(arrival.center), 149, 5, C.blue);
  const clockX = minuteX(minute);
  poly(c, [[clockX, 155], [clockX - 9, 174], [clockX + 9, 174]], C.paper);
  const pastEndpoint = minute > arrival.hi && minute < arrival.hi + 1;
  const clockLabel = (pastEndpoint ? 'Clock > ' : 'Clock ') + stamp(minute);
  c.save();
  c.font = '400 22px "Lesson Mono"';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = C.paper;
  const labelX = Math.min(clockX, 883 - c.measureText(clockLabel).width / 2);
  c.fillText(clockLabel, labelX, 194);
  c.restore();
  if (t.on(2, 'Both endpoints') && (!t.on(2, 'Replay the approach') || t.on(2, 'This window'))) {
    text(
      c,
      arrival.hit ? 'Covered' : 'Outside',
      460,
      194,
      25,
      arrival.hit ? C.teal : C.red,
      'left',
      'Serif',
    );
  }
}
