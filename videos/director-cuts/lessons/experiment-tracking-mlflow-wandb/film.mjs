import assert from 'node:assert/strict';
import { CASES } from '../../../films/experiment-tracking-mlflow-wandb/fixtures.mjs';
import { comparable, runs, verifyRun } from '../../../films/experiment-tracking-mlflow-wandb/model.mjs';

// Each ink separation is a readback of one saved report. Case identity sets its position.
const pair = runs.slice(1, 3);
const reports = pair.map(run => new Map(
  JSON.parse(run.artifacts.report.bytes).map(row => [row.caseId, row]),
));
const names = {
  req_205: 'Deploy approval',
  reg_002: 'Freeze status',
  hold_001: 'Rollback steps',
  hold_002: 'Missing approval',
};
const xs = [505, 849, 1193, 1537];
const routeY = { SERVE: 441, ABSTAIN: 623 };
const scores = reports.map(report => CASES.filter(c => report.get(c.caseId).predicted === c.expected).length);
const changed = CASES.filter(c => reports[0].get(c.caseId).predicted !== reports[1].get(c.caseId).predicted);
const vermilion = '#b73520';
const cobalt = '#1546a9';
const ink = '#222843';
const title = 'Which request earned the fourth point?';

const beats = [
  {
    id: 'red-separation',
    say: 'Three out of four. Open the case report behind that score. Each red ring shows where a simulated deployment assistant sent one request.',
    hold: 0.7,
  },
  {
    id: 'empty-target',
    say: 'The striped disks mark the routes we wanted. Serve means send the request through for an answer. Abstain means hold it back. Can you find the empty disk?',
    hold: 1.8,
  },
  {
    id: 'rollback',
    say: 'Rollback steps. The case has a runbook with those instructions. The rule saved with run two accepts only a release record. So the ring sits down at abstain, and the target above it is empty.',
    hold: 0.8,
  },
  {
    id: 'second-pass',
    say: 'For run three, let the rule accept a rollback runbook as well. Keep the four cases, their expected routes, and the scoring rule fixed. Where would you put the blue dots?',
    hold: 1.45,
  },
  {
    id: 'register',
    say: 'Line up the reports by case ID. Three blue dots settle inside red rings. At rollback, the red ring still says abstain. The blue dot lands on serve.',
    hold: 1.0,
  },
  {
    id: 'fourth-point',
    say: 'That’s the fourth point. In MLflow or Weights and Biases, save the case report as an artifact with each run. If someone asks why the score went up, show them the rollback row in both reports.',
    hold: 2.5,
  },
];

function check() {
  assert(comparable(pair));
  pair.forEach(run => assert(verifyRun(run).valid));
  assert.deepEqual(scores, [3, 4]);
  assert.deepEqual(changed.map(c => c.caseId), ['hold_001']);
  assert.equal(changed[0].evidence, 'rollback runbook');
  assert.deepEqual(reports.map(r => r.get(changed[0].caseId).predicted), ['ABSTAIN', 'SERVE']);
  assert.equal(changed[0].expected, 'SERVE');
  assert.deepEqual(CASES.map(c => c.caseId), Object.keys(names));
}

function ease(p) {
  p = Math.max(0, Math.min(1, p));
  return p * p * (3 - 2 * p);
}
function label(c, words, x, y, size, color, options = {}) {
  c.font = (options.bold ? 'bold ' : '') + size + 'px "Lesson ' + (options.family || 'Sans') + '"';
  c.fillStyle = color;
  c.textAlign = options.align || 'left';
  c.textBaseline = 'middle';
  c.fillText(words, x, y);
}
function line(c, x, y, xx, yy, color, width) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(xx, yy);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
function circle(c, x, y, radius, fill, stroke, width = 1) {
  c.beginPath();
  c.arc(x, y, radius, 0, 2 * Math.PI);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.lineWidth = width;
    c.strokeStyle = stroke;
    c.stroke();
  }
}
function box(c, x, y, w, h, radius, fill) {
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
  c.fillStyle = fill;
  c.fill();
}
function desk(c) {
  const daylight = c.createLinearGradient(80, 0, 1720, 1080);
  daylight.addColorStop(0, '#c3bfde');
  daylight.addColorStop(0.55, '#9897c4');
  daylight.addColorStop(1, '#777aa6');
  c.fillStyle = daylight;
  c.fillRect(0, 0, 1920, 1080);
  // Oblique window light on the work surface, independent of the camera move.
  const light = c.createLinearGradient(30, 0, 1820, 610);
  for (const [at, alpha] of [[0,0], [0.15,0.2], [0.26,0.2], [0.29,0], [0.44,0], [0.48,0.18], [0.75,0.18], [0.79,0], [1,0]]) {
    light.addColorStop(at, 'rgba(246,244,255,' + alpha + ')');
  }
  c.fillStyle = light;
  c.fillRect(0, 0, 1920, 1080);
}
function backing(c) {
  c.save();
  c.shadowColor = 'rgba(31,23,61,.33)';
  c.shadowBlur = 28;
  c.shadowOffsetX = 5;
  c.shadowOffsetY = 19;
  box(c, 112, 210, 1683, 652, 9, '#c7bfaf');
  c.restore();
  for (let offset = 5; offset > 0; offset--) {
    box(c, 110 + offset, 205 + offset * 2, 1685, 650, 9, offset % 2 ? '#e0d9c7' : '#bfb8ac');
  }
  box(c, 110, 205, 1685, 650, 9, '#fff9e8');
}
function target(c, x, y, size) {
  c.save();
  c.beginPath();
  c.arc(x, y, size, 0, 2 * Math.PI);
  c.clip();
  c.fillStyle = '#fff4c8';
  c.fillRect(x-size, y-size, size*2, size*2);
  for (let i = -3*size; i < 2*size; i += size*0.31) {
    line(c, x+i, y+size, x+i+2*size, y-size, '#6e6547', size*0.088);
  }
  c.restore();
  circle(c, x, y, size, null, '#8d825d', 2);
}
function basePrint(c) {
  target(c, 221, 297, 21);
  label(c, 'Expected route', 259, 298, 40, ink, {family:'Serif'});
  for (const [route, y] of Object.entries(routeY)) {
    line(c, 385, y, 1694, y, '#c8c3ad', 2);
    label(c, route === 'SERVE' ? 'Serve' : 'Abstain', 197, y, 53, ink, {family:'Serif'});
  }
  for (const [i, row] of CASES.entries()) {
    const x = xs[i];
    const y = routeY[row.expected];
    target(c, x, y, 38);
    line(c, x, 681, x, 698, '#8d887b', 2);
    label(c, names[row.caseId], x, 746, 39, ink, {align:'center',bold:true});
    label(c, row.caseId, x, 800, 32, '#525369', {family:'Mono',align:'center'});
  }
}
function separationPath(c, n) {
  const inset = n ? 12 : 0;
  const x = n ? 953 : 228;
  c.beginPath();
  c.moveTo(137 + inset, 232 + inset);
  c.lineTo(x-40, 232 + inset);
  c.quadraticCurveTo(x-23, 232 + inset, x-16, 207);
  c.lineTo(x+5, 102);
  c.quadraticCurveTo(x+8, 83, x+34, 82);
  c.lineTo(x+631, 82);
  c.quadraticCurveTo(x+651, 82, x+656, 102);
  c.lineTo(x+684, 210);
  c.quadraticCurveTo(x+688, 232 + inset, x+712, 232 + inset);
  c.lineTo(1762-inset, 232 + inset);
  c.lineTo(1762-inset, 831-inset);
  c.lineTo(137+inset, 831-inset);
  c.closePath();
}
function plate(c, n, landing, section = 'whole', unfold = 1) {
  if (landing <= 0) return;
  const raised = 1 - landing;
  const color = n ? cobalt : vermilion;
  c.save();
  // Suspended acetate casts a broader shadow. Its ink and tab land together.
  c.translate(940, 470);
  c.translate(raised * (n ? 735 : -105), -raised * (n ? 472 : 176));
  c.rotate(raised * (n ? 0.19 : -0.075));
  c.translate(-940, -470);
  // The second sheet hooks onto the board by its tab, then swings down from that edge.
  if (section === 'leaf') {
    c.translate(0, 245);
    c.transform(1, 0, -0.16*(1-unfold), unfold, 0, 0);
    c.translate(0, -245);
  }
  if (section !== 'whole') {
    c.beginPath();
    c.rect(-600, section === 'leaf' ? 245 : -755, 4000, 1000);
    c.clip();
  }
  separationPath(c, n);
  c.save();
  c.shadowColor = 'rgba(18,31,69,' + (0.11 + raised*0.16) + ')';
  c.shadowOffsetY = 5 + raised * 38;
  c.shadowOffsetX = 2 + raised * 12;
  c.shadowBlur = 4 + raised * 32;
  c.fillStyle = n ? 'rgba(134,194,249,.1)' : 'rgba(255,177,139,.12)';
  c.fill();
  c.restore();
  const shine = c.createLinearGradient(180, 800, 1680, 130);
  shine.addColorStop(0, 'rgba(255,255,255,.02)');
  shine.addColorStop(0.28, 'rgba(255,255,255,.12)');
  shine.addColorStop(0.31, 'rgba(255,255,255,.02)');
  shine.addColorStop(0.86, 'rgba(255,255,255,.02)');
  shine.addColorStop(0.88, 'rgba(255,255,255,.18)');
  shine.addColorStop(1, 'rgba(255,255,255,.02)');
  c.fillStyle = shine;
  c.fill();
  c.lineWidth = 3;
  c.strokeStyle = n ? 'rgba(23,63,144,.42)' : 'rgba(156,78,65,.42)';
  c.stroke();
  // The colored binder tabs are opaque, so their identifying ink stays readable.
  const tabX = n ? 953 : 228;
  c.save();
  c.clip();
  c.fillStyle = n ? '#c5ddfe' : '#ffc6aa';
  c.fillRect(tabX-21, 80, 711, 150);
  c.restore();
  const markX = tabX + 64;
  circle(c, markX, 132, n ? 17 : 23, n ? color : null, n ? null : color, 8);
  label(c, 'Run ' + (n + 2), tabX+111, 133, 53, color, {bold:true});
  label(c, scores[n] + '/' + CASES.length, tabX+605, 137, 76, color, {family:'Serif',align:'right'});
  label(c, n ? 'Release record or rollback runbook' : 'Release record only', tabX+48, 200, 34, ink);
  for (const [i, row] of CASES.entries()) {
    const y = routeY[reports[n].get(row.caseId).predicted];
    // Each transparent report carries a registration tick for its case in the suite.
    const tickX = xs[i] + (n ? 7 : -7);
    line(c, tickX, 682, tickX, 697, color, 4);
    circle(c, xs[i], y, n ? 25 : 49, n ? color : null, n ? null : color, 13);
  }
  c.restore();
}
function pin(c, x) {
  circle(c, x+3, 259, 11, 'rgba(58,39,64,.26)');
  circle(c, x, 255, 10, '#d8d5d5', '#8f8c99', 2);
  circle(c, x-2, 252, 5, '#f3f5f5');
}
function runbook(c, show) {
  if (show <= 0) return;
  c.save();
  c.translate(1000, 116 - (1-show)*500);
  c.scale(1.42, 1.14);
  c.rotate(-0.048);
  // The field guide slides above the one request its evidence supports.
  c.shadowColor = 'rgba(39,28,54,.35)';
  c.shadowBlur = 16;
  c.shadowOffsetY = 10;
  box(c, 0, 6, 418, 243, 10, '#433b72');
  c.shadowColor = 'transparent';
  box(c, 8, 3, 407, 235, 8, '#fff4ce');
  for (let y=226; y<238; y+=3) line(c, 30, y, 402, y, '#baa68f', 1);
  box(c, 0, -7, 417, 235, 9, '#ffcf69');
  box(c, 0, -7, 24, 235, 7, '#83609a');
  for (let i=0; i<6; i++) line(c, 2+i*3, 4, 2+i*3, 223, '#a384b0', 1);
  label(c, 'Rollback', 52, 71, 51, ink, {family:'Serif'});
  label(c, 'runbook', 52, 135, 51, ink, {family:'Serif'});
  c.strokeStyle = ink;
  c.lineWidth = 9;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.translate(16, 0);
  c.beginPath();
  c.moveTo(353, 166);
  c.quadraticCurveTo(363, 78, 299, 78);
  c.lineTo(280, 78);
  c.moveTo(301, 56);
  c.lineTo(279, 78);
  c.lineTo(300, 99);
  c.stroke();
  c.translate(-16, 0);
  box(c, 49, 177, 159, 34, 3, '#ffe7b3');
  label(c, changed[0].caseId, 60, 195, 23, ink, {family:'Mono'});
  c.restore();
}
function draw(c, clock) {
  const { index, elapsed } = clock;
  const red = index === 0 ? 0.12 + 0.88*ease(elapsed / 1.45) : 1;
  const tab = index > 3 ? 1 : index === 3 ? ease(clock.reveal('let the rule accept', 1.3)) : 0;
  const unfolded = index > 4 ? 1 : index === 4 ? ease(elapsed / 1.65) : 0;
  const pencil = index === 5 ? ease(clock.reveal('the fourth point', 1.1)) : 0;
  const close = index === 2 ? ease(elapsed / 1.3) : index === 3 ? 1-ease(elapsed / 1.4) : 0;
  desk(c);
  c.save();
  c.translate(960, 540);
  c.scale(1+0.11*close, 1+0.11*close);
  c.rotate(-0.013 + 0.013*close);
  c.translate(-960-8*close, -540+21*close);
  backing(c);
  basePrint(c);
  plate(c, 0, red);
  if (unfolded === 1) {
    plate(c, 1, tab);
  } else {
    plate(c, 1, tab, 'tab');
    if (unfolded > 0) plate(c, 1, tab, 'leaf', unfolded);
  }
  pin(c, 168);
  pin(c, 1734);
  runbook(c, close);
  if (pencil > 0) {
    // Trace the blue score back to the specific decision in its report.
    const tip = {x: xs[CASES.indexOf(changed[0])], y: routeY[changed[0].expected]-56};
    c.save();
    c.strokeStyle = cobalt;
    c.lineWidth = 5;
    c.lineCap = 'round';
    c.setLineDash([690*pencil, 820]);
    c.beginPath();
    c.moveTo(1568, 167);
    c.bezierCurveTo(1651, 352, tip.x+3, 289, tip.x, tip.y);
    c.stroke();
    c.setLineDash([]);
    if (pencil > 0.92) {
      line(c, tip.x-10, tip.y-17, tip.x, tip.y, cobalt, 5);
      line(c, tip.x+12, tip.y-15, tip.x, tip.y, cobalt, 5);
    }
    const underline = index === 5 ? ease(clock.reveal('show them the rollback row', 0.6)) : 0;
    if (underline > 0) {
      const x = xs[CASES.indexOf(changed[0])];
      line(c, x-79, 822, x-79+158*underline, 820, cobalt, 4);
    }
    c.restore();
  }
  c.restore();
}

export default { title, beats, draw, check };
