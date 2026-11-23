import assert from 'node:assert/strict';
import { actual, baseline } from '../../../films/capstone-demand-forecasting-alerts/fixtures.mjs';

// February 6 is the first Friday in the lab's two-week evaluation window.
// Stage the article's example in which every request is logged and the crew works at capacity.
const crew = 150;
const requested = actual[4];
const shipped = Math.min(crew, requested);
const waiting = requested - shipped;
const pastFriday = { shipped, requested };
const pallets = [10, 10, waiting - 20];

function planFrom(log) {
  const forecast = pastFriday[log];
  return { forecast, warning: forecast > crew, excess: Math.max(0, forecast - crew) };
}

const beats = [
  {
    id: 'last-truck',
    say: 'There goes the last truck. Friday’s crew loaded a hundred and fifty parcels. Look at the floor behind it.',
    hold: 1.1,
  },
  {
    id: 'on-the-dock',
    say: 'Twenty-six parcels are still waiting for a ride. Somebody placed a request for each one. Which count would you use to plan next Friday’s shift?',
    hold: 1.8,
  },
  {
    id: 'sunday-desk',
    say: 'On Sunday the planner makes a simple forecast. She copies the most recent Friday with a final count. For next Friday she has the same crew, with room for a hundred and fifty parcels.',
    hold: 0.8,
  },
  {
    id: 'shipping-log',
    say: 'Try the shipping log. A hundred and fifty went out. Copy that across. Friday looks fully covered. The planner gets a warning only when the forecast is higher than the crew’s capacity.',
    hold: 1.1,
  },
  {
    id: 'request-log',
    say: 'Now follow the request log. It includes the load on the truck and those three stacks on the dock. What happens when you carry that count across?',
    hold: 1.5,
  },
  {
    id: 'raise-the-flag',
    say: 'A hundred and seventy-six. Now the planner expects twenty-six more parcels than the crew can handle. She can call the shift lead on Sunday, while there’s time to change Friday’s roster.',
    hold: 2.3,
  },
];

const ink = '#29394a';
const warmWhite = '#fff3d8';
const clamp = (n) => Math.max(0, Math.min(1, n));
const smooth = (n) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

function rect(g, x, y, w, h, color) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}

function poly(g, pts, color) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) g.lineTo(x, y);
  g.closePath();
  g.fillStyle = color;
  g.fill();
}

function line(g, pts, color, width = 1) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) g.lineTo(x, y);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
}

function ellipse(g, x, y, rx, ry, color) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = color;
  g.fill();
}

function type(g, str, x, y, size, color, weight = 600, family = 'Sans', align = 'left') {
  g.font = `${weight} ${size}px "Lesson ${family}"`;
  g.textAlign = align;
  g.fillStyle = color;
  g.fillText(String(str), x, y);
}

function gradient(g, x, y, w, h, from, to) {
  const paint = g.createLinearGradient(x, y, x + w, y + h);
  paint.addColorStop(0, from);
  paint.addColorStop(1, to);
  return paint;
}

function parcel(g, x, y, col, row, group) {
  const palette = ['#df9b62', '#e7b785', '#d59765', '#efb67b', '#ce936e'];
  const w = 40,
    h = 39;
  const shade = (col * 3 + row + 2 * group) % palette.length;
  rect(g, x, y, w, h, palette[shade]);
  poly(
    g,
    [
      [x, y],
      [x + 6, y - 5],
      [x + w + 6, y - 5],
      [x + w, y],
    ],
    '#f6cfa0',
  );
  poly(
    g,
    [
      [x + w, y],
      [x + w + 6, y - 5],
      [x + w + 6, y + h - 5],
      [x + w, y + h],
    ],
    '#9a654e',
  );
  rect(g, x + 16, y, 7, h, '#c78c60');
  poly(
    g,
    [
      [x + 16, y],
      [x + 22, y - 5],
      [x + 29, y - 5],
      [x + 23, y],
    ],
    '#e4b786',
  );
  rect(g, x + 4, y + 9 + (shade % 2) * 6, 13, 9, '#fff0d2');
  for (let n = 0; n < 4; n++)
    rect(g, x + 6 + n * 2.2, y + 12 + (shade % 2) * 6, n === 2 ? 1.5 : 0.8, 4, ink);
  line(
    g,
    [
      [x + 2, y + h - 1],
      [x + w - 2, y + h - 1],
    ],
    '#ac7856',
    1,
  );
}

function pallet(g, x, count, group) {
  const cols = Math.ceil(count / 2),
    w = cols * 42 + 12,
    y = 474;
  poly(
    g,
    [
      [x - 4, y + 19],
      [x + w, y + 19],
      [x + w + 46, y + 39],
      [x + 18, y + 38],
    ],
    '#526978',
  );
  rect(g, x - 4, y, w, 8, '#be9673');
  for (let j = 0; j < 3; j++) rect(g, x - 2 + (j * (w - 18)) / 2, y + 8, 15, 10, '#775c50');
  rect(g, x - 4, y + 15, w, 5, '#aa8169');
  for (let r = 1; r >= 0; r--) {
    for (let c = cols - 1; c >= 0; c--) {
      if (r * cols + c < count) parcel(g, x + 42 * c, y - 40 * (r + 1), c, r, group);
    }
  }
}

function dock(g, departure, annotation) {
  rect(g, 0, 0, 1200, 675, gradient(g, 0, 0, 0, 675, '#a8c9d8', '#e0e5d4'));
  // The sawtooth clerestory, loading apron and truck share a fixed side elevation.
  for (let i = -1; i < 4; i++) {
    const x = i * 325 + 32;
    poly(
      g,
      [
        [x, 110],
        [x + 237, 25],
        [x + 243, 29],
        [x + 243, 109],
      ],
      '#6c91aa',
    );
    poly(
      g,
      [
        [x + 12, 108],
        [x + 230, 35],
        [x + 230, 105],
      ],
      '#b7d6dc',
    );
    line(
      g,
      [
        [x + 114, 75],
        [x + 114, 107],
      ],
      '#789aab',
      4,
    );
    line(
      g,
      [
        [x + 174, 54],
        [x + 174, 106],
      ],
      '#789aab',
      4,
    );
    line(
      g,
      [
        [x - 5, 108],
        [x + 237, 24],
        [x + 246, 26],
      ],
      '#42576b',
      5,
    );
  }
  rect(g, 0, 103, 1200, 400, '#c7bbaa');
  rect(g, 0, 112, 1200, 371, gradient(g, 0, 110, 150, 370, '#f3e2c4', '#d2c4ae'));
  rect(g, 0, 104, 1200, 7, '#555d63');
  for (let i = 0; i < 11; i++) {
    rect(g, i * 124, 114, 2, 371, '#bcafa0');
    for (let j = 0; j < 3; j++) ellipse(g, i * 124 + 8, 141 + j * 132, 2, 2, '#b6aa99');
  }
  // Opening cut into the wall. Light reaches the parcel faces from the apron.
  rect(g, 282, 179, 721, 321, '#3c4c61');
  rect(g, 295, 189, 695, 295, gradient(g, 300, 190, 40, 306, '#36465a', '#78909b'));
  for (let j = 0; j < 5; j++) {
    rect(g, 301, 194 + j * 17, 684, 15, j % 2 ? '#788a97' : '#8194a1');
    rect(g, 301, 207 + j * 17, 684, 3, '#4b6071');
  }
  for (let i = 0; i < 3; i++) {
    rect(g, 323 + i * 225, 283, 6, 191, '#485f6e');
    rect(g, 330 + i * 225, 285, 3, 189, '#708795');
  }
  poly(
    g,
    [
      [300, 278],
      [432, 278],
      [687, 483],
      [441, 483],
    ],
    '#8ca0a6',
  );
  poly(
    g,
    [
      [433, 278],
      [459, 278],
      [714, 483],
      [689, 483],
    ],
    '#8ca0a6',
  );
  rect(g, 275, 162, 736, 16, '#67788a');
  poly(
    g,
    [
      [263, 149],
      [1003, 149],
      [1025, 164],
      [273, 164],
    ],
    '#536b81',
  );
  poly(
    g,
    [
      [273, 164],
      [1025, 164],
      [1014, 178],
      [279, 178],
    ],
    '#394e61',
  );
  rect(g, 282, 179, 12, 314, '#899ba1');
  rect(g, 986, 179, 14, 315, '#d0d1bf');

  type(g, 'FC-A', 48, 191, 47, ink, 700);
  type(g, 'PARCEL DEPOT', 49, 219, 20, ink, 700);
  line(
    g,
    [
      [49, 232],
      [239, 232],
    ],
    '#879398',
    2,
  );
  type(g, 'Fri 6 Feb', 49, 269, 28, ink, 500, 'Serif');

  // The shipping tally stays with the depot when the truck pulls away.
  rect(g, 40, 307, 199, 117, '#837f76');
  rect(g, 37, 302, 199, 117, '#f4ebd7');
  type(g, 'Shipped', 53, 339, 28, ink);
  rect(g, 51, 349, 168, 55, '#354b5b');
  type(g, shipped, 135, 394, 48, warmWhite, 600, 'Mono', 'center');

  rect(g, 0, 483, 1200, 192, gradient(g, 0, 488, 160, 180, '#b6bbc2', '#d0c9be'));
  rect(g, 0, 480, 1200, 11, '#75808b');
  rect(g, 0, 490, 1200, 13, '#9b9e9e');
  for (const x of [295, 970]) {
    rect(g, x, 466, 18, 42, '#485564');
    for (let j = 0; j < 5; j++) rect(g, x + 1, 469 + 7 * j, 15, 2, '#697684');
  }
  for (let i = 0; i < 8; i++)
    line(
      g,
      [
        [i * 227 - 270, 675],
        [i * 143 - 50, 505],
      ],
      '#a9adb0',
      1.2,
    );
  poly(
    g,
    [
      [0, 501],
      [248, 501],
      [330, 532],
      [0, 532],
    ],
    '#929da5',
  );
  for (let i = 0; i < 4; i++) {
    rect(g, 1021 + i * 42, 295, 28, 176, '#acafaa');
    rect(g, 1022 + i * 42, 304, 25, 150, '#a0a6a6');
  }
  [321, 563, 805].forEach((x, i) => pallet(g, x, pallets[i], i));

  if (annotation > 0) {
    g.save();
    g.globalAlpha = annotation;
    line(
      g,
      [
        [319, 502],
        [327, 515],
        [935, 515],
        [948, 501],
      ],
      '#fff6df',
      3,
    );
    rect(g, 517, 502, 237, 50, '#3e5667');
    type(g, `${waiting} waiting`, 635, 537, 34, '#fff6df', 600, 'Sans', 'center');
    g.restore();
  }
  if (departure < 1) truck(g, departure);
}

function wheel(g, x, y, turn) {
  ellipse(g, x, y, 42, 42, '#223445');
  ellipse(g, x, y, 33, 33, '#394754');
  ellipse(g, x, y, 23, 23, '#a3adb0');
  ellipse(g, x, y, 15, 15, '#516475');
  for (let i = 0; i < 6; i++) {
    const a = turn + (i * Math.PI) / 3;
    ellipse(g, x + 12 * Math.cos(a), y + 12 * Math.sin(a), 2.4, 2.4, '#d6d9cf');
  }
  ellipse(g, x, y, 7, 7, '#b7c0bd');
}

function truck(g, t) {
  const distance = 1160 * t;
  g.save();
  g.translate(distance, 0);
  ellipse(g, 618, 546, 465, 22, '#939ca2');
  rect(g, 194, 458, 795, 48, '#364453');
  rect(g, 203, 482, 218, 21, '#596676');
  poly(
    g,
    [
      [145, 271],
      [162, 259],
      [849, 259],
      [835, 271],
    ],
    '#fff0d2',
  );
  rect(g, 145, 271, 691, 206, gradient(g, 145, 271, 40, 206, '#e97a56', '#c54f3f'));
  poly(
    g,
    [
      [836, 271],
      [849, 259],
      [849, 462],
      [836, 477],
    ],
    '#9b463b',
  );
  rect(g, 153, 277, 674, 5, '#f89e74');
  poly(
    g,
    [
      [146, 405],
      [316, 405],
      [387, 356],
      [539, 356],
      [464, 419],
      [148, 419],
    ],
    '#ffdeb2',
  );
  poly(
    g,
    [
      [146, 428],
      [464, 428],
      [527, 374],
      [584, 374],
      [503, 445],
      [146, 445],
    ],
    '#f4b98c',
  );
  type(g, 'Parcel post', 562, 349, 56, '#fff1d6', 600, 'Serif');
  for (let x = 170; x < 833; x += 83) {
    line(
      g,
      [
        [x, 282],
        [x, 462],
      ],
      '#803e3624',
      1,
    );
    for (const y of [286, 456]) ellipse(g, x + 2, y, 1.6, 1.6, '#f4b091');
  }
  rect(g, 145, 466, 692, 10, '#e1c3a2');
  rect(g, 147, 477, 682, 6, '#554f52');
  for (let x = 174; x < 822; x += 109) rect(g, x, 469, 25, 4, '#a54841');
  poly(
    g,
    [
      [850, 463],
      [850, 345],
      [869, 318],
      [953, 318],
      [997, 385],
      [1027, 399],
      [1034, 463],
      [1022, 486],
      [854, 486],
    ],
    '#ce5744',
  );
  poly(
    g,
    [
      [860, 341],
      [874, 325],
      [948, 325],
      [982, 380],
      [859, 380],
    ],
    '#344c5d',
  );
  poly(
    g,
    [
      [872, 344],
      [880, 332],
      [910, 332],
      [912, 372],
      [868, 372],
    ],
    '#aed0d7',
  );
  poly(
    g,
    [
      [916, 332],
      [943, 332],
      [970, 372],
      [918, 372],
    ],
    '#a4c0c9',
  );
  poly(
    g,
    [
      [932, 332],
      [945, 332],
      [970, 372],
      [956, 372],
    ],
    '#d5e1d4',
  );
  line(
    g,
    [
      [916, 385],
      [922, 453],
      [867, 453],
      [865, 386],
    ],
    '#a3453b',
    2,
  );
  rect(g, 873, 389, 15, 5, '#344b59');
  rect(g, 1004, 408, 24, 11, '#fff0c3');
  rect(g, 977, 438, 53, 7, '#8a4241');
  rect(g, 1004, 459, 40, 15, '#c3c9c4');
  rect(g, 853, 463, 63, 13, '#71818a');
  rect(g, 134, 465, 15, 15, '#773d38');
  rect(g, 132, 479, 41, 13, '#657582');
  wheel(g, 271, 505, distance / 42);
  wheel(g, 956, 505, distance / 42);
  g.restore();
}

function desk(g) {
  rect(g, 0, 0, 1200, 675, gradient(g, 0, 0, 1200, 675, '#a6c3c4', '#799aab'));
  // A diagonal band of sun crosses the planner's counter.
  poly(
    g,
    [
      [0, 160],
      [228, 0],
      [819, 0],
      [0, 585],
    ],
    '#b6cbca',
  );
  poly(
    g,
    [
      [0, 602],
      [857, 0],
      [894, 0],
      [0, 628],
    ],
    '#b6cbca',
  );
  for (let i = 0; i < 45; i++) {
    const x = (i * 357 + 114) % 1200,
      y = (i * 191 + 38) % 675;
    line(
      g,
      [
        [x, y],
        [x + 6 + (i % 3) * 5, y + 1],
      ],
      '#53768432',
      1.3,
    );
  }
}

function photo(g, zoom, departure, annotation, choice) {
  const scale = mix(1, 0.505, zoom);
  g.save();
  g.translate(50 * zoom, 123 * zoom);
  g.rotate(-0.032 * zoom);
  g.scale(scale, scale);
  rect(g, -17, -16, 1248, 901, '#53737d71');
  rect(g, -23, -23, 1246, 901, '#fff3db');
  g.save();
  g.beginPath();
  g.rect(0, 0, 1200, 675);
  g.clip();
  dock(g, departure, annotation);
  g.restore();

  type(g, 'Shipped', 45, 749, 50, ink, 500, 'Serif');
  type(g, shipped, 50, 839, 89, ink, 600, 'Mono');
  type(g, 'Requested', 644, 749, 50, ink, 500, 'Serif');
  type(g, requested, 645, 839, 89, ink, 600, 'Mono');
  line(
    g,
    [
      [597, 715],
      [598, 841],
    ],
    '#bfb8a7',
    2,
  );
  if (choice) {
    const { pos, opacity } = choice;
    const x = mix(45, 644, pos);
    g.save();
    g.globalAlpha = opacity;
    line(
      g,
      [
        [x, 849],
        [x + 87, 846],
        [x + 170, 849],
      ],
      '#bd422e',
      8,
    );
    g.restore();
  }
  g.restore();
}

function shiftSheet(g, log, write, decision, erase) {
  g.save();
  g.translate(679, 83);
  g.rotate(0.014);
  rect(g, 3, 10, 467, 485, '#54747f65');
  rect(g, -4, 0, 468, 487, '#796856');
  rect(g, 2, 5, 456, 474, '#c4a37c');
  rect(g, 13, 14, 437, 456, '#ddceb0');
  rect(g, 9, 10, 438, 454, '#fff3da');
  rect(g, 137, 2, 175, 28, '#77746d');
  rect(g, 139, -3, 168, 23, gradient(g, 0, -3, 0, 24, '#e1e2d7', '#98a4a7'));
  rect(g, 173, -9, 100, 15, '#687a81');
  rect(g, 180, -6, 86, 7, '#b4c0bf');

  type(g, 'Staffing plan', 34, 77, 27, ink, 500);
  type(g, 'Friday 13 Feb', 32, 132, 48, ink, 600, 'Serif');
  line(
    g,
    [
      [33, 154],
      [423, 154],
    ],
    ink,
    2.5,
  );
  type(g, 'Crew capacity', 33, 208, 29, ink, 500);
  type(g, crew, 424, 209, 46, ink, 600, 'Mono', 'right');
  line(
    g,
    [
      [33, 231],
      [424, 231],
    ],
    '#b9b29e',
    1.5,
  );
  type(g, 'Forecast', 33, 288, 31, ink, 600);
  line(
    g,
    [
      [287, 300],
      [423, 300],
    ],
    '#9c9c92',
    1.5,
  );

  if (log) {
    const plan = planFrom(log);
    g.save();
    g.globalAlpha = 1 - erase;
    g.save();
    g.beginPath();
    g.rect(277, 239, 152 * write, 63);
    g.clip();
    type(g, plan.forecast, 424, 292, 53, ink, 600, 'Mono', 'right');
    g.restore();
    if (decision > 0) {
      g.save();
      g.globalAlpha = (1 - erase) * decision;
      g.translate(224, 379);
      g.rotate(plan.warning ? -0.061 : -0.018);
      const color = plan.warning ? '#a8392a' : '#586775';
      if (plan.warning) {
        g.strokeStyle = color;
        g.lineWidth = 4;
        g.strokeRect(-182, -30, 364, 61);
      }
      type(
        g,
        plan.warning ? 'Review staffing' : 'No warning',
        0,
        13,
        plan.warning ? 39 : 33,
        color,
        600,
        'Sans',
        'center',
      );
      g.restore();
    }
    g.restore();
  }
  g.restore();
}

// The pencil follows the chosen log entry onto the shift sheet.
function pencil(g, x, y) {
  g.save();
  g.translate(x, y);
  g.rotate(0.39);
  poly(
    g,
    [
      [1, 4],
      [26, -1],
      [174, -1],
      [175, 9],
      [27, 10],
    ],
    '#475d6855',
  );
  poly(
    g,
    [
      [0, 0],
      [23, -6],
      [173, -6],
      [173, 7],
      [23, 7],
    ],
    '#cb633f',
  );
  poly(
    g,
    [
      [23, -6],
      [173, -6],
      [173, -1],
      [23, -1],
    ],
    '#ec9366',
  );
  poly(
    g,
    [
      [24, 4],
      [173, 4],
      [173, 7],
      [24, 7],
    ],
    '#994b37',
  );
  poly(
    g,
    [
      [0, 0],
      [23, -6],
      [26, -2],
      [22, 1],
      [25, 4],
      [23, 7],
    ],
    '#ebc58c',
  );
  poly(
    g,
    [
      [0, 0],
      [7, -2],
      [7, 2],
    ],
    ink,
  );
  rect(g, 154, -6, 13, 13, '#9dabb0');
  rect(g, 155, -4, 11, 3, '#c1c9c8');
  rect(g, 168, -6, 8, 13, '#b07769');
  g.restore();
}

function draw(g, clock) {
  const { index, elapsed, reveal } = clock;
  const departure = index === 0 ? smooth((elapsed + 0.4) / 5.2) : 1;
  const annotation = index === 0 ? 0 : index === 1 ? smooth(elapsed / 0.6) : 1;
  const zoom = index < 2 ? 0 : index === 2 ? smooth(elapsed / 2.5) : 1;
  let choice = null,
    log = null,
    write = 0,
    decision = 0,
    erase = 0;
  let tipX = 958,
    tipY = 553;
  if (index === 3) {
    const select = smooth(reveal('Try the shipping log', 0.92));
    const move = smooth(reveal('Copy that across', 0.75));
    choice = { pos: 0, opacity: select };
    log = 'shipped';
    write = reveal('Friday looks fully covered', 0.48);
    decision = reveal('fully covered', 0.35);
    tipX = mix(mix(tipX, 168, select), 998, move) + 104 * write;
    tipY = mix(mix(tipY, 548, select), 387, move) - 48 * Math.sin(move * Math.PI);
  }
  if (index === 4) {
    const switchLog = smooth(elapsed / 1.2);
    choice = { pos: switchLog, opacity: 1 };
    const move = smooth(reveal('carry that count across', 0.85));
    tipX = mix(mix(1102, 469, switchLog), 998, move);
    tipY = mix(mix(387, 538, switchLog), 387, move) - 42 * Math.sin(move * Math.PI);
    if (switchLog < 1) {
      log = 'shipped';
      write = 1;
      decision = 1;
      erase = switchLog;
    } else {
      log = 'requested';
      write = smooth((elapsed - clock.speechDuration + 0.12) / 0.48);
      tipX += 104 * write;
      decision = smooth((elapsed - clock.speechDuration - 0.56) / 0.28);
    }
  }
  if (index >= 5) {
    choice = { pos: 1, opacity: 1 };
    log = 'requested';
    write = 1;
    decision = 1;
    const putDown = smooth(elapsed / 1.15);
    tipX = mix(1102, 958, putDown);
    tipY = mix(387, 553, putDown);
  }

  g.save();
  g.scale(1920 / 1200, 1080 / 675);
  if (zoom > 0) {
    desk(g);
    shiftSheet(g, log, write, decision, erase);
  }
  photo(g, zoom, departure, annotation, choice);
  if (zoom > 0.99) {
    g.save();
    g.globalAlpha = smooth((zoom - 0.99) / 0.01);
    pencil(g, tipX, tipY);
    g.restore();
  }
  g.restore();
}

function check() {
  assert.equal(requested, 176);
  assert.equal(shipped, 150);
  assert.equal(waiting, 26);
  assert(pallets.every((n) => n > 0 && n % 2 === 0));
  assert.equal(
    pallets.reduce((sum, n) => sum + n, 0),
    requested - shipped,
  );
  assert.deepEqual(planFrom('shipped'), { forecast: 150, warning: false, excess: 0 });
  assert.deepEqual(planFrom('requested'), { forecast: 176, warning: true, excess: 26 });
  assert.equal(planFrom('requested').forecast, baseline[11]);
  return true;
}

export default { title: 'What the Truck Left Behind', beats, draw, check };
