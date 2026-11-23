import {
  P,
  box,
  poly,
  line,
  dot,
  txt,
  mono,
  title,
  small,
  page,
  sheet,
  at,
  parcel,
  arrow,
  strip,
} from './art.mjs';

function specimen(c, id, x, y) {
  if (id === 0) {
    parcel(c, x + 28, y + 4, 107, '01');
    for (let i = 0; i < 22; i++) box(c, x + 165 + i * 3.5, y + 15, 1 + (i % 3 === 0), 41, P.ink);
    line(c, x + 159, y + 33, x + 248, y + 33, P.orange, 3);
  } else if (id === 1) {
    for (const [i, color] of [P.ocean, P.orange, P.teal].entries()) {
      box(c, x + 28 + 72 * i, y - 4, 58, 88, color, 4);
      box(c, x + 33 + 72 * i, y + 2, 9, 76, '#ffffff33');
      mono(c, String(i + 1), x + 57 + 72 * i, y + 45, 23, P.cream, 'center');
      line(c, x + 40 + 72 * i, y + 61, x + 70 + 72 * i, y + 61, P.cream);
    }
  } else if (id === 2) {
    const series = [24, 35, 29, 48, 40, 59, 53, 74];
    line(c, x + 17, y + 79, x + 240, y + 79, P.line);
    for (let i = 0; i < series.length; i++)
      box(c, x + 23 + i * 26, y + 79 - series[i], 17, series[i], i < 6 ? P.ocean : P.teal);
    line(c, x + 15, y + 21, x + 239, y + 21, P.orange, 2, [6, 4]);
  } else {
    box(c, x + 19, y - 15, 198, 111, P.black, 5);
    box(c, x + 25, y - 9, 186, 99, P.sky);
    parcel(c, x + 57, y + 20, 86, '04');
    poly(
      c,
      [
        [x + 119, y + 20],
        [x + 142, y + 20],
        [x + 141, y + 37],
      ],
      P.rust,
    );
    for (const [dx, dy, sx, sy] of [
      [42, 6, 1, 1],
      [188, 6, -1, 1],
      [42, 77, 1, -1],
      [188, 77, -1, -1],
    ]) {
      line(c, x + dx, y + dy, x + dx + sx * 14, y + dy, P.cream, 3);
      line(c, x + dx, y + dy, x + dx, y + dy + sy * 12, P.cream, 3);
    }
  }
}
export function products(c, k) {
  page(c, P.ivory);
  const b = k.beat.beatIndex + 1;
  if (b === 2 && at(k, 2, 'If a bad crop')) {
    const restored = at(k, 2, 'Restore its cropper');
    title(c, 'Replay the same return photo');
    small(c, 'ORIGINAL CAMERA FRAME', 63, 163);
    small(c, restored ? 'RETAINED CROP' : 'FAILED CROP', 636, 163);
    function photo(x, y) {
      c.save();
      c.beginPath();
      c.rect(x, y, 460, 271);
      c.clip();
      box(c, x, y, 460, 271, P.sky);
      box(c, x, y + 192, 460, 79, '#a7a897');
      parcel(c, x + 107, y + 97, 229, '04');
      poly(
        c,
        [
          [x + 306, y + 91],
          [x + 335, y + 96],
          [x + 335, y + 139],
          [x + 317, y + 124],
          [x + 320, y + 110],
        ],
        P.rust,
      );
      c.restore();
    }
    const sx = 64,
      sy = 192;
    photo(sx, sy);
    const crop = restored ? { x: 77, y: 27, w: 302, h: 229 } : { x: 77, y: 51, w: 165, h: 125 };
    const left = sx + crop.x,
      top = sy + crop.y;
    c.strokeStyle = P.cream;
    c.lineWidth = 5;
    c.strokeRect(left, top, crop.w, crop.h);
    arrow(c, 545, 327, 604, 327, P.ocean);
    c.save();
    c.beginPath();
    c.rect(632, sy, 360, 273);
    c.clip();
    c.translate(632, sy);
    c.scale(360 / crop.w, 273 / crop.h);
    photo(-crop.x, -crop.y);
    c.restore();
    txt(c, 'One damaged corner', 64, 510, 26, P.ink);
    txt(
      c,
      restored ? 'Corner visible to the model' : 'Corner outside model input',
      632,
      510,
      25,
      restored ? P.teal : P.rust,
    );
    strip(c, 600, 'Retained vision package', 'Cropper + weights + review threshold', P.ocean);
    return;
  }
  if (b <= 2) {
    title(c, 'Which signal arrives with the request?');
    const examples = [
      ['Delivery', 'Scan freshness', 'Cost of warnings and misses'],
      ['Ranking', 'Eligible candidate supply', 'Purchases and returns'],
      ['Forecast', 'Fresh counts', 'Forecast residual or alert cost'],
      ['Vision', 'Photo quality', 'Reviewer-confirmed damage'],
    ];
    const n = at(k, 2, 'Vision needs')
      ? 4
      : at(k, 1, 'Forecasting needs')
        ? 3
        : at(k, 1, 'Ranking needs')
          ? 2
          : 1;
    examples.slice(0, n).forEach(([label, now, later], i) => {
      const x = 54 + i * 278;
      small(c, label.toUpperCase(), x + 8, 166, P.ocean);
      specimen(c, i, x, 224);
      line(c, x + 8, 351, x + 253, 351, P.line);
      small(c, 'ON REQUEST', x + 8, 397);
      txt(c, now, x + 8, 436, 20);
      small(c, 'AFTER THE OUTCOME', x + 8, 498);
      const lines =
        later === 'Cost of warnings and misses'
          ? ['Cost of warnings', 'and misses']
          : later === 'Forecast residual or alert cost'
            ? ['Forecast residual', 'or alert cost']
            : later === 'Reviewer-confirmed damage'
              ? ['Reviewer-confirmed', 'damage']
              : [later];
      lines.forEach((s, j) => txt(c, s, x + 8, 537 + j * 29, 20, P.teal));
    });
    if (b === 2 && at(k, 2, 'Restore its cropper'))
      txt(
        c,
        'Vision replay   ·   same photo → retained cropper → weights → review threshold',
        62,
        631,
        23,
      );
  } else if (b === 3) {
    title(c, 'Did the warnings help customers?');
    small(c, 'CUSTOMER ASSIGNMENT', 69, 171);
    const assigned = at(k, 3, 'Randomly assign');
    const positions = [
      [161, 260],
      [256, 339],
      [135, 425],
      [275, 484],
      [340, 242],
      [375, 407],
    ];
    const groups = [0, 1, 1, 0, 0, 1];
    for (let i = 0; i < positions.length; i++) {
      const [x, y] = positions[i],
        target = groups[i] ? 447 : 259;
      if (assigned) line(c, x + 12, y, 672, target, groups[i] ? '#adbcc3' : '#aec8b4', 2);
    }
    for (let i = 0; i < positions.length; i++) {
      const [x, y] = positions[i];
      dot(c, x, y, 22, assigned ? (groups[i] ? P.ocean : P.teal) : P.mute);
      mono(c, 'C' + (i + 1), x, y + 6, 16, P.cream, 'center');
    }
    for (const [i, a] of ['A · v0', 'B · v1'].entries()) {
      const y = 196 + 188 * i;
      sheet(c, 684, y, 409, 131);
      title(c, a, 709, y + 54, 36, i ? P.ocean : P.teal);
      txt(c, 'Compare assigned customer outcomes', 709, y + 98, 20);
    }
    strip(c, 593, 'Canary limits exposure', 'Random assignment supports a lift estimate', P.ocean);
  } else {
    title(c, 'What does a training trigger authorize?');
    const labels = [
      ['Trigger', 'Schedule or drift'],
      ['Train', 'New candidate'],
      ['Evaluate', 'Gates and windows'],
      ['Promote', 'Current receipt'],
    ];
    labels.forEach(([name, s], i) => {
      const x = 62 + i * 284;
      dot(c, x + 92, 278, 45, i < 2 ? P.ocean : P.teal);
      if (i === 0) {
        line(c, x + 92, 278, x + 92, 250, P.cream, 4);
        line(c, x + 92, 278, x + 112, 283, P.cream, 4);
      } else mono(c, i === 1 ? 'v2' : i === 2 ? '?' : 'ID', x + 92, 289, 31, P.cream, 'center');
      if (i < 3) arrow(c, x + 145, 278, x + 264, 278);
      title(c, name, x, 406, 36);
      txt(c, s, x, 457, 21);
    });
    strip(c, 588, 'Until new evidence authorizes a move', 'Keep the selected release', P.ocean);
  }
}
