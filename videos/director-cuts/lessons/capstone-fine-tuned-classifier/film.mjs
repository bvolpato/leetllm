import assert from 'node:assert/strict';
import { ACTUAL_COMPARISON } from '../../../films/capstone-fine-tuned-classifier/fixtures/actual-models.mjs';
import { GATE_CASES } from '../../../films/capstone-fine-tuned-classifier/fixtures.mjs';

const names = ['After hours', 'Freeze', 'Recovery', 'Guide', 'Policy', 'Status'];
const tickets = GATE_CASES.map((ticket, index) => ({ ...ticket, name: names[index] }));
const models = ACTUAL_COMPARISON.map((model) => {
  const scores = new Map(model.rows.map((row) => [row.fixture_id, row.score]));
  const lines = tickets.map((ticket) => {
    const score = scores.get(ticket.id);
    assert.ok(Number.isFinite(score));
    return { score, rings: score >= model.threshold };
  });
  return { ...model, lines };
});

const beats = [
  {
    id: 'incoming',
    say: 'Watch the desk light up. Each lit line is an access ticket the classifier would send to a person. What might a quieter desk miss?',
    hold: 1.1,
  },
  {
    id: 'required-lines',
    say: 'Read the top row. An after-hours exception. A request to restore a key during a freeze. Someone trying to recover their account. All three need a person.',
    hold: 0.8,
  },
  {
    id: 'one-spare-review',
    say: 'The bottom row is routine. The team can spare one human review for those three questions. This baseline uses weighted counts of words and phrases. How many routine tickets did it send?',
    hold: 2.2,
  },
  {
    id: 'read-the-cutoff',
    say: 'All three. Even the request for a guide rang through. Keep your eye on the freeze request up here. Its review score is about point six one. A score of point three five or higher lights the line.',
    hold: 0.9,
  },
  {
    id: 'switch-models',
    say: 'Try the tiny encoder. We trained it from scratch on six other tickets. Give it these same requests and keep the cutoff fixed. Which of the three required lines still lights up?',
    hold: 2,
  },
  {
    id: 'dead-lines',
    say: 'Only recovery. Look at the score on the freeze request now. About point zero five. It would go to the guarded agent. So would the after-hours exception.',
    hold: 1.3,
  },
  {
    id: 'hold-both',
    say: 'Would you put either model on this desk? The word model overfilled the review queue. The encoder would leave these two calls unanswered by a person. Hold both models.',
    hold: 3.2,
  },
];

const limit = (value) => Math.max(0, Math.min(1, value));
const ease = (value) => {
  const p = limit(value);
  return p * p * (3 - 2 * p);
};
const blend = (a, b, t) => a + (b - a) * t;
const column = (i) => 797 + (i % 3) * 321;
const row = (i) => (i < 3 ? 346 : 612);

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

function cartridge(ctx, switching) {
  rounded(ctx, 625, 135, 673, 105, 19, '#fffae5');
  rounded(ctx, 625, 131, 673, 104, 19, '#888b7d');
  rounded(ctx, 632, 138, 659, 89, 13, '#222f34');
  ctx.save();
  ctx.beginPath();
  ctx.rect(644, 145, 635, 73);
  ctx.clip();
  for (const [i, name] of ['TF-IDF baseline', 'Tiny encoder'].entries()) {
    const y = 145 + (i - switching) * 77;
    ctx.fillStyle = gradient(ctx, 0, y, 0, y + 76, [
      [0, '#254554'],
      [0.4, '#375c69'],
      [1, '#234755'],
    ]);
    ctx.fillRect(643, y, 638, 75);
    label(ctx, name, 676, y + 37, 49, '#fff7dd');
  }
  ctx.restore();
  label(ctx, 'Review cutoff', 1357, 161, 32, '#3e514e');
  label(ctx, models[0].threshold.toFixed(2), 1353, 214, 51, '#243f43', { family: 'Mono', weight: 400 });
}

function bank(ctx, y, title, rule) {
  label(ctx, title, 631, y - 30, 44, '#273f43');
  label(ctx, rule, 1579, y - 29, 34, '#455755', { align: 'right' });
  rounded(ctx, 624, y + 6, 967, 169, 20, '#fdf9df');
  rounded(
    ctx,
    622,
    y,
    969,
    168,
    19,
    gradient(ctx, 640, y, 640, y + 169, [
      [0, '#828b7c'],
      [0.08, '#bcc0ad'],
      [0.77, '#c8cab6'],
      [1, '#a6b09f'],
    ]),
  );
  ctx.fillStyle = '#8f998a';
  ctx.fillRect(957, y + 17, 2, 133);
  ctx.fillRect(1279, y + 17, 2, 133);
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

function keycap(ctx, ticket, i, light, score, showScore) {
  const x = column(i),
    y = row(i);
  lamp(ctx, x, y + 42, light);
  rounded(ctx, x - 139, y + 84, 278, 70, 10, '#7f897d');
  rounded(
    ctx,
    x - 137,
    y + 81,
    274,
    66,
    9,
    gradient(ctx, x, y + 80, x, y + 148, [
      [0, '#fbf7e9'],
      [0.13, '#f7f2df'],
      [0.84, '#eae5d2'],
      [1, '#d1cdbb'],
    ]),
  );
  label(ctx, ticket.name, x - showScore * 65, y + 113, 41, '#283e40', { align: 'center', weight: 600 });
  if (showScore > 0) {
    ctx.save();
    ctx.globalAlpha = showScore;
    label(ctx, score.toFixed(3), x + 66, y + 113, 34, '#215971', {
      align: 'center',
      family: 'Mono',
      weight: 400,
    });
    ctx.restore();
  }
}

function ovalPoint(i, progress) {
  const a = -1.18 + 6.55 * progress;
  const dx = (97 + 2 * Math.cos(3 * a)) * Math.cos(a);
  return { x: column(i) + dx, y: row(i) + 41 + 42 * Math.sin(a) - dx * 0.065 };
}

function pencilOval(ctx, i, progress) {
  if (progress <= 0) return;
  ctx.strokeStyle = '#b53f32';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const length = Math.ceil(90 * progress);
  for (let j = 0; j <= length; j++) {
    const point = ovalPoint(i, Math.min(j / 90, progress));
    if (j === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
}

function pencil(ctx, tip) {
  ctx.save();
  ctx.translate(tip.x, tip.y);
  ctx.rotate(-0.98);
  ctx.shadowColor = '#49372c60';
  ctx.shadowOffsetX = 9;
  ctx.shadowOffsetY = 13;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(43, -10);
  ctx.lineTo(371, -10);
  ctx.lineTo(371, 10);
  ctx.lineTo(43, 10);
  ctx.closePath();
  ctx.fillStyle = '#c39970';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = gradient(ctx, 0, -10, 0, 10, [
    [0, '#743326'],
    [0.17, '#e17653'],
    [0.41, '#c6593e'],
    [0.87, '#973c2d'],
    [1, '#712c25'],
  ]);
  ctx.fillRect(43, -10, 328, 20);
  ctx.fillStyle = '#ac3024';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(13, -3.4);
  ctx.lineTo(14, 3.4);
  ctx.fill();
  ctx.restore();
}

function movePoint(a, b, p) {
  return { x: blend(a.x, b.x, p), y: blend(a.y, b.y, p) };
}

function frameDesk(ctx, clock) {
  const wide = [960, 540, 1],
    top = [1100, 422, 1.47],
    bottom = [1092, 646, 1.43];
  const freeze = [1109, 462, 1.65],
    comparison = [1083, 460, 1.35];
  const moves = [
    [wide, wide],
    [wide, top],
    [top, bottom],
    [bottom, freeze],
    [freeze, comparison],
    [comparison, comparison],
    [comparison, wide],
  ];
  const [from, to] = moves[clock.index];
  let travel = ease(clock.elapsed / 1.45);
  if (clock.index === 3) travel = ease(clock.reveal('Keep your eye', 1.35));
  if (clock.index === 4) travel = ease(clock.reveal('Which of the three', 1.45));
  if (clock.index === 6) travel = ease(clock.reveal('Hold both models', 2.15));
  const [x, y, z] = from.map((v, i) => blend(v, to[i], travel));
  ctx.translate(960, 540);
  ctx.scale(z, z);
  ctx.translate(-x, -y);
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  const switching = index < 4 ? 0 : index === 4 ? ease(reveal('Give it these same requests', 0.72)) : 1;
  const freezeScore = index === 3 ? ease(reveal('freeze request up here', 0.6)) : Number(index >= 4);
  const marks = [
    index === 5 ? ease(reveal('So would the after-hours exception', 0.7)) : Number(index > 5),
    index === 5 ? ease(reveal('Look at the score', 0.7)) : Number(index > 5),
  ];

  ctx.save();
  frameDesk(ctx, clock);
  desk(ctx);
  cord(ctx);
  housing(ctx);
  cartridge(ctx, switching);
  bank(ctx, 346, 'Person required', 'All 3 must ring');
  bank(ctx, 612, 'Routine questions', 'At most 1 may ring');

  const selected = models[Number(switching >= 0.5)];
  tickets.forEach((ticket, i) => {
    const landed = index === 0 ? ease((elapsed + 0.12 - i * 0.32) / 0.22) : 1;
    const light =
      landed * blend(Number(models[0].lines[i].rings), Number(models[1].lines[i].rings), switching);
    keycap(ctx, ticket, i, light, selected.lines[i].score, i === 1 ? freezeScore : 0);
  });
  pencilOval(ctx, 0, marks[0]);
  pencilOval(ctx, 1, marks[1]);
  const shake = index === 0 ? Math.sin(elapsed * 28) * 0.014 * (1 - ease(elapsed / 2)) : 0;
  handset(ctx, shake);
  if (index === 5) {
    // The pencil follows the wet ends of the marks and lifts to cross between lines.
    const parked = { x: 1480, y: -200 };
    let tip = movePoint(parked, ovalPoint(1, marks[1]), ease(elapsed / 0.63));
    tip = movePoint(tip, ovalPoint(0, marks[0]), ease(reveal('the guarded agent', 0.95)));
    tip = movePoint(tip, parked, ease((elapsed - clock.speechDuration) / 0.83));
    pencil(ctx, tip);
  }
  ctx.restore();
}

function check() {
  assert.deepEqual(
    tickets.map((t) => t.id),
    [
      'after_hours_access_override',
      'freeze_window_ticket',
      'takeover_recovery_request',
      'routine_rotation_followup',
      'routine_access_question',
      'routine_status_request',
    ],
  );
  assert.deepEqual(
    tickets.map((t) => t.gold),
    [1, 1, 1, 0, 0, 0],
  );
  assert.deepEqual(
    models.map((m) => m.threshold),
    [0.35, 0.35],
  );
  assert.deepEqual(
    models.map((m) => m.lines.map((l) => Number(l.rings))),
    [
      [1, 1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0, 0],
    ],
  );
  assert.deepEqual(
    models.map((m) => m.lines[1].score.toFixed(3)),
    ['0.606', '0.051'],
  );
  for (const model of models) {
    const misses = tickets.filter((t, i) => t.gold && !model.lines[i].rings).length;
    const extras = tickets.filter((t, i) => !t.gold && model.lines[i].rings).length;
    assert.equal(misses, model.fn);
    assert.equal(extras, model.fp);
    assert.equal(misses > 0 || extras > 1, true);
    assert.equal(model.decision, 'hold');
  }
}

export default { title: 'Six Lines at the Access Desk', beats, draw, check };
