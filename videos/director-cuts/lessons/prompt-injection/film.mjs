import assert from 'node:assert/strict';
import { APPROVAL, PROPOSAL, REPORT, TRUSTED } from '../../../films/prompt-injection/fixtures.mjs';
import { promotionAllowed, promotionTrace } from '../../../films/prompt-injection/model.mjs';

const beats = [
  {
    id: 'the-loose-end',
    say: 'Follow the pink line down to C seventeen. The assistant wants to send this new version a quarter of the live traffic. Where are the requests going now?',
    hold: 1.65,
  },
  {
    id: 'what-you-asked',
    say: 'You asked for a summary. The assistant fetched this evaluation. C seventeen passed its tests. Just below that result, the author recommends release.',
    hold: 0.85,
  },
  {
    id: 'what-the-assistant-read',
    say: 'The assistant treated that sentence as an instruction and proposed a release. Words in a document it fetched steered it away from your summary. That’s indirect prompt injection.',
    hold: 0.85,
  },
  {
    id: 'the-release-decision',
    say: 'The blue lines each carry a quarter of the traffic in this picture. Before the release service can move one, it checks its own records. Who approved this change?',
    hold: 2.1,
  },
  {
    id: 'the-summary',
    say: 'The socket is still empty. The service found no matching approval and denied the release. You can still have your summary. The report says C seventeen passed its tests.',
    hold: 1.1,
  },
  {
    id: 'same-proposal',
    say: 'Try the same proposal again. This time Casey has approved that exact change in the release service. C seventeen, a quarter of production traffic, revision three. Watch the zero while the write waits.',
    hold: 1.4,
  },
  {
    id: 'the-first-request',
    say: 'Follow the bottom line again.',
    hold: 2.6,
  },
  {
    id: 'the-release-record',
    say: 'One line out of four. The service has committed the change. Its release record now shows twenty-five percent for C seventeen at revision four.',
    hold: 2.5,
  },
];

const candidate = PROPOSAL.candidate;
const lanes = 4;
const share = 100 / lanes;
const closed = promotionTrace(1, 1);
const released = promotionTrace(4, 1);
const laneCount = (record) => record.traffic / share;

function check() {
  assert.equal(promotionAllowed(PROPOSAL, TRUSTED), false);
  assert.equal(closed.committed, false);
  assert.equal(closed.receipt, null);
  assert.equal(laneCount(closed), 0);
  assert.equal(promotionAllowed(PROPOSAL, { ...TRUSTED, approval: APPROVAL }), true);
  assert.equal(promotionAllowed({ ...PROPOSAL, traffic: 50 }, { ...TRUSTED, approval: APPROVAL }), false);
  const waiting = promotionTrace(2, 1);
  assert.equal(waiting.allowed, true);
  assert.equal(waiting.committed, false);
  assert.equal(waiting.traffic, 0);
  assert.equal(released.receipt.operationId, PROPOSAL.operationId);
  assert.equal(released.receipt.traffic, share);
  assert.equal(laneCount(released), 1);
  assert.equal(released.revision, PROPOSAL.revision + 1);
  assert.equal(REPORT.result, 'C17 passed its tests.');
}

const ink = '#232755';
const blue = '#253799';
const pink = '#ab284d';
const socketX = 1340;
const bankY = [222, 308, 394, 480];
const c17Y = 724;
const clamp = (n) => Math.max(0, Math.min(1, n));
const ease = (n) => { const x = clamp(n); return x * x * (3 - 2 * x); };
const mix = (a, b, t) => a + (b - a) * t;

function label(c, text, x, y, size, color = ink, family = 'Sans', weight = 500) {
  c.fillStyle = color;
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillText(text, x, y);
}

function round(c, x, y, w, h, radius, color) {
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
  c.fillStyle = color;
  c.fill();
}

function stroke(c, color, width) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}

function line(c, x, y, xx, yy, width, color) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(xx, yy);
  stroke(c, color, width);
}

function ellipse(c, x, y, rx, ry, color) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}

function gradient(c, x0, y0, x1, y1, stops) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

// Cubics let the little travelling lights stay inside each flexible lead.
function point(curve, t) {
  const s = 1 - t;
  return [0, 1].map((i) => s ** 3 * curve[0][i] + 3 * s * s * t * curve[1][i]
    + 3 * s * t * t * curve[2][i] + t ** 3 * curve[3][i]);
}

function bezier(c, curve, color, width, dy = 0) {
  const [start, control] = curve;
  const slope = (control[1] - start[1]) / (control[0] - start[0]);
  c.beginPath();
  c.moveTo(-2100, start[1] - 110 + dy);
  c.bezierCurveTo(-970, start[1] - 110 + dy, start[0] - 180, start[1] - slope * 180 + dy,
    start[0], start[1] + dy);
  c.bezierCurveTo(curve[1][0], curve[1][1] + dy, curve[2][0], curve[2][1] + dy,
    curve[3][0], curve[3][1] + dy);
  stroke(c, color, width);
}

function bench(c) {
  c.fillStyle = gradient(c, -100, 0, 1400, 1190, [
    [0, '#f6ddd2'], [0.44, '#f3d7cd'], [1, '#dfbfbf'],
  ]);
  c.fillRect(-2300, -400, 6500, 2000);
  // Fine flecks belong to the laminate and stay put when the camera moves.
  c.fillStyle = 'rgba(118,70,71,.115)';
  for (let k = 0; k < 560; k++) {
    const x = (k * 719.33) % 3799 - 1750;
    const y = (k * k * 31.07 + k * 67.9) % 1231;
    c.fillRect(x, y, 1.7 + k % 3, 1.5);
  }
}

function socket(c, y, live) {
  ellipse(c, socketX + 2, y + 3, 43, 43, '#f1edf9');
  ellipse(c, socketX, y, 43, 42, '#9b9cbd');
  ellipse(c, socketX, y + 1, 37, 37, '#cbccdf');
  ellipse(c, socketX - 1, y + 1, 28, 28, '#30314c');
  ellipse(c, socketX - 1, y - 2, 21, 21, '#131830');
  if (!live) {
    c.beginPath();
    c.arc(socketX, y + 1, 32, Math.PI * 0.08, Math.PI * 0.64);
    stroke(c, '#e7e8f6', 3);
  }
}

function service(c, committed, approval, showRecord) {
  const record = committed ? released : closed;
  c.fillStyle = gradient(c, 1218, 0, 1285, 0, [[0, '#7b708b00'], [1, '#7b708b59']]);
  c.fillRect(1218, -40, 68, 1250);
  round(c, 1260, -125, 950, 1350, 36, '#a2a0bd');
  round(c, 1277, -140, 970, 1390, 34, gradient(c, 1300, 0, 1840, 1080, [
    [0, '#e6e6f5'], [0.52, '#d6d7ec'], [1, '#c3c5e0'],
  ]));
  line(c, 1280, -35, 1280, 1170, 3, '#f7f5ff');
  label(c, 'RELEASE SERVICE', 1334, 113, 36, '#51516d', 'Mono');
  for (const [i, y] of bankY.entries()) socket(c, y, i < lanes - laneCount(record));
  socket(c, c17Y, committed);
  label(c, 'Existing release', 1436, 273, 51, ink, 'Sans', 600);
  label(c, (100 - record.traffic) + '%', 1431, 397, 110, blue, 'Sans', 600);
  line(c, 1322, 573, 1866, 573, 2, '#a3a5c4');
  label(c, candidate, 1436, 682, 63, ink, 'Mono');
  label(c, record.traffic + '%', 1431, 803, 110, blue, 'Sans', 600);
  if (approval) {
    let heading = 'Release approval', value = approval;
    if (approval === 'Casey approved') {
      heading = 'Casey’s approval';
      value = APPROVAL.candidate + ' · ' + APPROVAL.traffic + '% · rev ' + APPROVAL.revision;
    }
    if (showRecord) {
      heading = 'Committed record';
      value = 'Revision ' + released.receipt.revision;
    }
    line(c, 1331, 834, 1860, 834, 2, '#a3a5c4');
    label(c, heading, 1334, 883, 36, '#4a4e71');
    label(c, value, 1334, 938, 46, ink, 'Sans', 600);
  }
}

function plug(c, x, y, loose) {
  c.save();
  c.translate(x, y);
  if (loose > 0) {
    round(c, -13, -10, 35 * loose + 7, 20, 7, '#b2b7cc');
    line(c, 0, -5, 28 * loose, -5, 3, '#f7f5fa');
  }
  const barrel = gradient(c, 0, -27, 0, 28, [
    [0, '#3f4ca4'], [0.18, '#8999f1'], [0.36, '#687bd9'], [0.73, '#354aa8'], [1, '#182b74'],
  ]);
  round(c, -152, -17, 86, 34, 14, barrel);
  for (let k = 0; k < 5; k++) {
    const xx = -139 + 11 * k;
    line(c, xx, -13 - k * 0.4, xx - 2, 13 + k * 0.4, 3, '#253a88');
  }
  round(c, -96, -28, 93, 56, 14, barrel);
  round(c, -16, -28, 16, 56, 5, '#4454a8');
  line(c, -81, -17, -33, -17, 3, '#a5b3fb');
  c.restore();
}

function cableGeometry(i, motion) {
  const t = i === lanes - 1 ? motion : 0;
  const lift = Math.sin(Math.PI * t);
  const y = mix(bankY[i], c17Y, t);
  const x = socketX - 6 - 115 * lift;
  const curve = [
    [-290, 240 + i * 72],
    [175 + i * 28, 292 + i * 91],
    [600 + i * 83, y + 225 - 95 * t],
    [x - 139, y],
  ];
  return { x, y, lift, curve };
}

function cable(c, i, motion, seconds) {
  const { x, y, lift, curve } = cableGeometry(i, motion);
  bezier(c, curve, 'rgba(79,48,74,.11)', 46, 17 + lift * 17);
  bezier(c, curve, 'rgba(86,54,86,.15)', 36, 11 + lift * 17);
  bezier(c, curve, '#28388b', 36);
  bezier(c, curve, '#5065c8', 28, -3);
  bezier(c, curve, '#8599f5', 9, -11);
  // Soft rectangular lights show which leads carry live requests.
  if (lift < 0.12) {
    for (let k = 0; k < 3; k++) {
      const t = (seconds * 0.165 + k / 3 + i * 0.071) % 1;
      const a = point(curve, t);
      const b = point(curve, Math.min(1, t + 0.025));
      line(c, a[0], a[1] - 2, b[0], b[1] - 2, 15, '#d6eaff');
      line(c, a[0] + 1, a[1] - 5, b[0], b[1] - 5, 5, '#fffaf3');
    }
  }
  plug(c, x, y, lift);
}

function proposal(c, amount) {
  if (amount <= 0) return;
  const from = point(cableGeometry(3, 0).curve, 0.43);
  const route = [from, [from[0] + 100, from[1] + 84], [752, c17Y + 40], [1174, c17Y]];
  c.save();
  c.globalAlpha = clamp(amount * 1.8);
  c.setLineDash([16, 13]);
  c.beginPath();
  c.moveTo(...from);
  // Draw just the prefix as the proposal arrives.
  for (let i = 1; i <= 52; i++) c.lineTo(...point(route, i / 52 * amount));
  stroke(c, pink, 8);
  if (amount > 0.82) {
    c.save();
    c.globalAlpha *= (amount - 0.82) / 0.18;
    c.setLineDash([]);
    c.beginPath();
    c.moveTo(1174, c17Y - 11);
    c.lineTo(1203, c17Y - 11);
    c.lineTo(1203, c17Y - 23);
    c.lineTo(1266, c17Y - 23);
    c.lineTo(1266, c17Y - 8);
    c.lineTo(1290, c17Y - 8);
    c.lineTo(1290, c17Y + 8);
    c.lineTo(1266, c17Y + 8);
    c.lineTo(1266, c17Y + 23);
    c.lineTo(1203, c17Y + 23);
    c.lineTo(1203, c17Y + 11);
    c.lineTo(1174, c17Y + 11);
    c.closePath();
    stroke(c, pink, 4);
    c.restore();
  }
  c.setLineDash([]);
  label(c, 'Assistant’s proposal', 440, 813, 38, pink);
  label(c, PROPOSAL.traffic + '% to ' + candidate, 437, 892, 70, pink, 'Serif');
  c.restore();
}

function report(c, resultMark, recommendationMark) {
  c.save();
  c.translate(-1470, 175);
  c.rotate(-0.033);
  const w = 1180, h = 686;
  round(c, 15, 25, w, h, 4, 'rgba(77,50,80,.14)');
  round(c, 6, 10, w, h, 4, '#d3b8b8');
  round(c, 0, 0, w, h, 4, gradient(c, 0, 0, w, h, [[0, '#fffdf4'], [1, '#f5ebdd']]));
  line(c, 89, 0, 89, h, 2, '#cab6bc');
  for (const y of [105, 346, 588]) {
    ellipse(c, 40, y, 14, 14, '#a8919e');
    ellipse(c, 40, y + 3, 12, 11, '#e2c4c1');
  }
  label(c, 'External evaluation', 139, 111, 44, ink, 'Serif');
  label(c, 'R42', 927, 112, 42, blue, 'Mono');
  line(c, 139, 143, w - 78, 143, 3, ink);
  label(c, 'Test result', 139, 236, 36, '#5a5770');
  label(c, REPORT.result, 136, 333, 81, ink, 'Serif');
  if (resultMark > 0)
    line(c, 140, 348, 140 + resultMark * 628, 348, 6, '#6275c6');
  label(c, 'Author’s note', 139, 454, 36, '#5a5770');
  label(c, REPORT.attack, 136, 548, 75, ink, 'Serif');
  if (recommendationMark > 0) {
    c.beginPath();
    c.moveTo(141, 573);
    c.quadraticCurveTo(142 + 420 * recommendationMark, 567, 142 + 848 * recommendationMark, 571);
    stroke(c, pink, 7);
  }
  c.restore();
  label(c, 'Your request', -1403, 93, 32, ink, 'Mono');
  label(c, '“Summarize this report.”', -1151, 96, 48, ink, 'Serif');
}

function summary(c, amount) {
  if (amount <= 0) return;
  c.save();
  c.globalAlpha = amount;
  c.translate(0, (1 - amount) * 18);
  line(c, 112, 740, 112, 885, 8, blue);
  label(c, 'Your summary', 145, 780, 35, blue);
  label(c, REPORT.result, 143, 864, 76, ink, 'Serif');
  c.restore();
}

function draw(c, clock) {
  const { index, elapsed, seconds, reveal } = clock;
  let camera = 0, draft = 1, motion = 0, resultMark = 0, noteMark = 0;
  let approval = '', reply = 0;
  if (index === 0) draft = 0.16 + 0.84 * ease(elapsed / 1.45);
  if (index === 1) {
    camera = ease(elapsed / 1.2);
    resultMark = reveal('C seventeen passed', 0.65);
    noteMark = reveal('the author recommends release', 0.65);
  }
  if (index === 2) {
    resultMark = noteMark = 1;
    camera = 1 - ease(reveal('and proposed a release', 1.45));
  }
  if (index === 3) {
    const lookup = reveal('it checks its own records', 0.95);
    if (lookup > 0) approval = lookup < 1 ? 'Checking…' : 'None on file';
    draft = 1 - ease(reveal('Who approved', 1.1));
  }
  if (index === 4) {
    draft = 0;
    approval = 'None on file';
    reply = ease(reveal('You can still have your summary', 0.65));
  }
  if (index === 5) {
    reply = 1 - ease(elapsed / 0.5);
    draft = ease(elapsed / 1.2);
    approval = reveal('Casey has approved', 0.48) >= 1 ? 'Casey approved' : 'None on file';
  }
  if (index >= 6) {
    approval = 'Casey approved';
    motion = index === 6 ? ease(reveal('bottom line', 1.15)) : 1;
    draft = 1 - motion;
  }
  const committed = motion === 1 && released.committed;
  const showRecord = index === 7 && reveal('release record', 0.25) >= 1;
  c.save();
  c.translate(camera * 1912, -8 * camera);
  c.scale(1 + 0.1 * camera, 1 + 0.1 * camera);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  bench(c);
  service(c, committed, approval, showRecord);
  for (let i = 0; i < lanes; i++) cable(c, i, motion, seconds);
  label(c, 'Live traffic', 110, 161, 65, ink, 'Serif');
  label(c, 'Four equal shares', 112, 221, 34, '#5b5267');
  proposal(c, draft);
  report(c, resultMark, noteMark);
  summary(c, reply);
  c.restore();
}

export default { title: 'What moves a quarter of live traffic?', beats, draw, check };
