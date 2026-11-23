import assert from 'node:assert/strict';
import { C } from './studio.mjs';
import {
  BUS_ROUTE,
  LATER_BUS_ROUTE,
  VISIT_HOURS,
} from '../../../films/agent-architectures/fixtures.mjs';
import { ready, visitSchedule, nextAction } from '../../../films/agent-architectures/model.mjs';

const time = (minutes) =>
  (Math.floor(minutes / 60) % 12) + ':' + String(Math.round(minutes % 60)).padStart(2, '0');
const hours = { ...VISIT_HOURS, status: 'open' };
const train = (venue, feasible = true) => ({ day: hours.day, venue, feasible });
const joins = (venue, feasible = true) => ready({ hours, journey: train(venue, feasible) });
const openMove = nextAction([{ kind: 'hours', status: 'open' }]);
const shutMove = nextAction([{ kind: 'hours', status: 'closed' }]);
const moveLabel = {
  'check-journey': 'Find a journey to History',
  'find-alternative': 'Look for another venue',
};
const entranceNotice = { gallery: 'closed', entrance: 'East entrance' };
function fallback(entranceFirst) {
  return entranceFirst && entranceNotice.entrance ? entranceNotice.entrance : 'History Museum';
}

// The profile of the heron is adapted from the approved short's painted study.
function heron(g, x, y, w, h) {
  const c = g.ctx;
  c.save();
  c.translate(x, y);
  c.scale(w / 575, h / 281);
  g.rect(0, 0, 575, 281, '#91bed0');
  g.circle(425, 69, 48, '#ffb789');
  g.path(
    [
      [0, 214],
      [70, 202],
      [195, 222],
      [352, 172],
      [460, 184],
      [575, 153],
      [575, 281],
      [0, 281],
    ],
    '#527e99',
  );
  g.path(
    [
      [0, 244],
      [157, 217],
      [341, 241],
      [424, 208],
      [575, 225],
      [575, 281],
      [0, 281],
    ],
    '#325f77',
  );
  c.beginPath();
  c.moveTo(110, 175);
  c.bezierCurveTo(156, 177, 196, 146, 216, 134);
  c.bezierCurveTo(189, 93, 149, 83, 127, 37);
  c.bezierCurveTo(193, 86, 216, 49, 283, 136);
  c.bezierCurveTo(312, 142, 308, 103, 333, 99);
  c.bezierCurveTo(348, 96, 354, 106, 362, 108);
  c.lineTo(412, 116);
  c.lineTo(352, 118);
  c.bezierCurveTo(329, 119, 344, 161, 298, 174);
  c.bezierCurveTo(246, 182, 229, 160, 203, 174);
  c.lineTo(117, 198);
  c.lineTo(184, 169);
  c.closePath();
  c.fillStyle = '#1e395a';
  c.fill();
  c.beginPath();
  c.moveTo(267, 153);
  c.bezierCurveTo(188, 152, 120, 111, 49, 61);
  c.bezierCurveTo(149, 102, 169, 52, 267, 153);
  c.fillStyle = '#fff0c8';
  c.fill();
  g.circle(346, 105, 2.7, '#ffcd79');
  c.restore();
}
function carriage(g, x, y, bus = false, scale = 1) {
  const c = g.ctx;
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  if (!bus) {
    g.path(
      [
        [23, -38],
        [41, -49],
        [55, -38],
      ],
      C.ink,
      2.4,
    );
    g.line(32, -50, 53, -50, C.ink, 2.4);
    g.rect(-65, -35, 60, 33, C.blue);
    g.rect(-5, -17, 7, 5, C.ink);
    for (let i = 0; i < 3; i++) g.rect(-59 + i * 17, -30, 12, 13, C.white);
    g.rect(-62, -10, 54, 3, C.mint);
    g.circle(-51, 0, 6, C.ink);
    g.circle(-19, 0, 6, C.ink);
  }
  g.circle(15, 0, 8, C.ink);
  g.circle(71, 0, 8, C.ink);
  g.rect(1, -37, 85, 34, bus ? C.gold : C.blue);
  g.path(
    [
      [75, -37],
      [87, -30],
      [92, -10],
      [85, -3],
      [73, -3],
    ],
    bus ? C.gold : C.blue,
  );
  for (let i = 0; i < 4; i++) g.rect(7 + 18 * i, -31, 14, 14, C.white);
  g.rect(4, -11, 80, 3, C.mint);
  g.circle(87, -12, 2, C.white);
  g.circle(15, 0, 3, C.sand);
  g.circle(71, 0, 3, C.sand);
  c.restore();
}
function facade(g, drop, east = false) {
  g.rect(0, 0, 960, 540, '#bbd7d8');
  for (let i = 0; i < 5; i++) {
    g.path(
      [
        [i * 216 - 40, 107],
        [i * 216 + 143, 41],
        [i * 216 + 168, 52],
        [i * 216 + 168, 109],
      ],
      '#c48664',
    );
    g.path(
      [
        [i * 216 - 40, 105],
        [i * 216 + 143, 41],
        [i * 216 + 143, 103],
      ],
      '#f8e4b8',
    );
    g.path(
      [
        [i * 216 + 10, 99],
        [i * 216 + 132, 55],
        [i * 216 + 132, 97],
      ],
      '#acc9c8',
    );
  }
  g.rect(0, 106, 960, 257, '#e9ba91');
  g.rect(0, 106, 960, 5, '#fff1c9');
  g.text('Art Museum', 38, 157, 37, C.ink, 'Serif');
  g.rect(38, 177, 518, 158, '#78554c');
  g.rect(45, 183, 504, 146, '#c89473');
  g.rect(119, 190, 345, 133, '#f8d8ac');
  heron(g, 125, 195, 333, 121);
  const c = g.ctx;
  c.save();
  c.beginPath();
  c.rect(40, 177, 515, 157 * drop);
  c.clip();
  g.rect(40, 177, 515, 157, '#3b5055');
  for (let i = 0; i <= 160; i += 13)
    g.line(40, 178 + i + 157 * (drop - 1), 554, 178 + i + 157 * (drop - 1), '#53666a');
  const offset = 157 * (drop - 1);
  g.text('Main gallery closed', 64, 242 + offset, 35, C.white, 'Serif');
  g.text(
    east ? 'Other galleries open at east entrance →' : 'Heron gallery • repairs today',
    65,
    289 + offset,
    21,
    '#ffda96',
  );
  c.restore();
  g.rect(0, 337, 960, 26, '#dba67e');
  g.rect(0, 337, 960, 6, '#fff0cc');
  if (east) {
    g.text('East entrance', 619, 158, 31, C.ink, 'Serif');
    g.rect(610, 178, 292, 158, '#916759');
    g.rect(621, 185, 266, 143, '#f6cf95');
    g.path(
      [
        [621, 327],
        [698, 280],
        [887, 280],
        [887, 327],
      ],
      '#e4b27d',
    );
    g.rect(730, 291, 67, 36, '#fff0c5');
    c.save();
    c.translate(763, 245);
    c.rotate(-0.35);
    c.beginPath();
    c.ellipse(0, 0, 27, 57, 0, 0, 7);
    c.ellipse(2, -7, 12, 34, 0, 0, 7);
    c.fillStyle = C.red;
    c.fill('evenodd');
    c.restore();
  }
}
function opening(g, k, q) {
  const drop = q(1, 'the shutter comes down', 1.7);
  facade(g, drop);
  g.rect(588, 149, 332, 173, C.dark);
  g.label('VISITOR REQUEST', 609, 178, 294, C.sky);
  g.text('History Museum?', 607, 219, 31, C.white, 'Serif');
  g.text('90 min inside', 609, 259, 24, C.white);
  g.text('Finish by 5:00', 609, 295, 24, '#f1c772');
  g.rect(0, 363, 960, 177, C.paper);
  g.rect(31, 361, 898, 8, '#996b50');
  g.line(0, 399, 960, 399, C.ink, 3);
  for (let i = 0; i < 960; i += 19) g.rect(i, 401, 11, 5, C.rule);
  const x = ((k.seconds * 31 + 120) % 1080) - 100;
  carriage(g, x, 394, false, 0.86);
  g.text('Train to Art', 42, 449, 25, C.ink, 'Serif');
  const picked = q(3, "Check History's hours");
  g.text(
    picked ? 'Check History’s hours first' : 'Hours at History   /   Train to History?',
    340,
    449,
    27,
    picked ? C.teal : C.ink,
    'Serif',
    566,
  );
  if (picked) g.text('If open today, check the journey.', 342, 480, 17, C.muted);
}
function requests(g, b, q) {
  g.heading('History Museum   /   today', 'Who chooses and who sends?');
  g.plate(46, 168, 282, 135, 'POLICY PROPOSAL', 'Opening hours', 'History Museum • today', C.blue);
  const checked = q(2, 'checks the venue'),
    sent = q(2, 'sends the request'),
    saved = q(4, 'returned result');
  g.arrow(330, 229, 371, 229, checked ? C.teal : C.rule);
  g.plate(
    376,
    168,
    246,
    135,
    'APPLICATION HOST',
    checked ? 'Read allowed' : 'Awaiting check',
    checked ? 'Venue + date + scope' : 'Validate the request',
    checked ? C.teal : C.muted,
  );
  g.arrow(624, 229, 673, 229, sent ? C.teal : C.rule);
  g.plate(
    678,
    168,
    237,
    135,
    'HOURS SERVICE',
    sent ? 'Request received' : 'Waiting',
    '',
    sent ? C.blue : C.muted,
  );
  const requestX = sent ? 678 : checked ? 376 : 46;
  g.rect(requestX, 132, 132, 36, C.blue);
  g.text(hours.id, requestX + 66, 157, 22, C.white, 'Mono', 120, 'center', 600);
  if (b >= 3) {
    g.label('ROUTE OWNER', 46, 361);
    if (q(3, 'your code picked it')) g.text('Coded fallback → workflow', 46, 398, 23, C.blue);
    if (q(3, 'the model choose')) g.text('Model picks the lookup → agent', 510, 398, 23, C.teal);
  }
  g.note(
    saved
      ? 'Task state keeps the sent request beside its returned result.'
      : sent
        ? 'The host dispatches the validated request.'
        : checked
          ? 'The host has checked the proposal. Dispatch is next.'
          : 'The proposed lookup is still with the policy.',
  );
}
function record(g, b, q) {
  const back = q(2, 'History is open'),
    saved = q(2, 'host saves');
  g.heading('Today’s visit   /   hours service', 'What came back from History?');
  g.plate(
    46,
    161,
    390,
    162,
    'OUTBOUND    HOURS-24',
    'History Museum',
    'Opening hours • today',
    C.blue,
  );
  g.arrow(443, 227, 498, 227);
  g.plate(
    507,
    161,
    408,
    162,
    'RETURN    HOURS-24',
    back ? '1:00 pm to 6:00 pm' : 'Awaiting reply',
    back ? 'History Museum • today' : '',
    back ? C.teal : C.muted,
  );
  if (saved) g.label('Received at 1:55 pm', 529, 300, 355);
  g.text('Visitor’s deadline', 48, 378, 22, C.muted);
  g.text('5:00 pm', 291, 378, 32, C.goldInk, 'Serif');
  if (back) {
    g.text('Museum closes', 509, 378, 22, C.muted);
    g.text('6:00 pm', 775, 378, 32, C.teal, 'Serif');
  }
  g.note(
    b === 3
      ? 'The visitor and the museum supplied different limits.'
      : 'Match the reply to its request by call ID.',
  );
}
function loop(g, b, q) {
  const second = q(2, 'same hours request'),
    closed = q(2, 'closed all day'),
    choose = q(3, 'Look for another venue');
  g.heading('ReAct   /   two runs of the same policy', 'What changes the next lookup?');
  const next = q(1, 'asks for a journey');
  const rows = [['Run A', 'History hours', 'Open 1–6', next ? moveLabel[openMove] : 'Choosing…']];
  if (second)
    rows.push([
      'Run B',
      'History hours',
      closed ? 'Closed all day' : 'Awaiting reply',
      choose ? moveLabel[shutMove] : '?',
    ]);
  g.table(['RUN', 'REQUEST', 'OBSERVATION', 'NEXT MOVE'], rows, [96, 185, 205, 386], 46, 181, 85);
  g.note(
    choose
      ? 'The hours request stayed fixed. Only the observation changed.'
      : 'Follow each returned observation into the next decision.',
  );
}
function readers(g, b, q) {
  facade(g, 1, true);
  g.rect(0, 362, 960, 178, C.paper);
  const model = q(3, 'check today'),
    edit = q(4, 'Both requests now');
  g.label(edit ? 'WORKFLOW • ENTRANCE RULE' : 'WORKFLOW • CLOSURE RULE', 43, 399, 398, C.blue);
  g.label('AGENT • MODEL CHOICE', 507, 399, 408, C.teal);
  g.line(478, 381, 478, 473, C.rule);
  g.text(fallback(edit) + ' hours', 43, 447, 28, C.ink, 'Serif', 416);
  g.text(
    model ? 'East entrance hours' : 'Which hours?',
    507,
    447,
    28,
    model ? C.teal : C.muted,
    'Serif',
    410,
  );
  if (b >= 2) g.line(65, 298, 480, 298, '#f1c15f', 3);
}
function journey(g, b, q, replan) {
  const mismatch = !replan && !q(3, 'returns a feasible journey'),
    cancel = replan && q(2, 'has been cancelled'),
    bus = replan && q(4, 'comes back with a bus');
  const result = replan ? !cancel || bus : !mismatch;
  const endpoint = mismatch ? 'Art' : 'History',
    transport = bus ? 'Bus' : 'Train';
  g.heading(
    'Visit plan   /   History Museum',
    replan ? 'Which part of the plan broke?' : 'Do these results describe one visit?',
  );
  g.plate(45, 150, 286, 158, 'MUSEUM   HOURS-24', 'History Museum', 'Today • 1:00–6:00 pm', C.teal);
  g.label('STATION', 382, 283);
  g.label('ART MUSEUM', 754, 172);
  g.label('HISTORY MUSEUM', 754, 312);
  const origin = [414, 247],
    a = [741, 190],
    h = [741, 327],
    end = mismatch ? a : h;
  g.path([origin, [516, 247], [597, 190], a], mismatch ? C.blue : C.rule, mismatch ? 5 : 2);
  g.path(
    [origin, [512, 247], [604, 327], h],
    mismatch ? C.rule : cancel && !bus ? C.red : C.teal,
    mismatch ? 2 : 5,
  );
  for (const at of [origin, a, h]) g.socket(...at, C.ink, 6);
  carriage(g, 632, end[1] - 5, bus, 0.62);
  if (cancel && !bus) {
    g.line(615, 306, 636, 332, C.red, 5);
    g.line(636, 306, 615, 332, C.red, 5);
  }
  g.text(
    transport + ' to ' + endpoint + (cancel && !bus ? ' • cancelled' : ''),
    46,
    378,
    27,
    cancel && !bus ? C.red : C.ink,
    'Serif',
  );
  const known = replan ? !cancel || q(3, 'Ask for a journey') : q(3, 'The destinations differ');
  g.note(
    !known
      ? 'Can these two results support the visit?'
      : result && joins(endpoint)
        ? 'Matching venue and day. The visit check can run.'
        : cancel
          ? 'Keep the hours. Reopen the journey and its dependent recommendation.'
          : 'Keep the hours. A train to Art cannot supply a History journey.',
    result ? C.teal : C.ink,
  );
}
function inside(g, k, q, later) {
  const b = k.beat.beatIndex + 1,
    route = later ? LATER_BUS_ROUTE : BUS_ROUTE;
  const shortened = later ? q(3, 'Slide the end', 1.3) : 0;
  const duration = 90 - Math.round(20 * shortened),
    schedule = visitSchedule(hours, route, duration);
  const arrival = later ? q(2, 'You arrive') : q(2, 'you arrive');
  const end = later ? q(2, 'takes you to five fifteen') : q(3, 'At four oh five');
  const decision = later
    ? b < 3
      ? q(2, 'miss your deadline')
      : q(3, 'Both time limits pass')
    : q(3, 'That leaves');
  const target = later && q(3, 'seventy minutes') ? 70 : 90;
  g.heading(
    'History Museum  /  today',
    later ? 'Would you take the later bus?' : 'How much time does this bus leave?',
  );
  g.label('MUSEUM HOURS  •  HOURS-24', 45, 146);
  g.text('1:00 to 6:00 pm', 45, 178, 26, C.ink, 'Serif');
  g.label('TRANSIT  •  ' + route.id.toUpperCase(), 367, 146);
  g.text(time(route.depart) + ' pm  +  25 min', 367, 178, 26, C.ink, 'Serif');
  g.label('VISITOR REQUEST', 703, 146);
  g.text(target + ' min by 5:00', 703, 178, 26, C.goldInk, 'Serif');
  if (later) {
    const earlier = visitSchedule(hours, BUS_ROUTE, 90);
    g.label(
      'MISSED ' + time(BUS_ROUTE.depart) + ' BUS  /  FINISH ' + time(earlier.finish),
      45,
      211,
      470,
    );
  }
  const x = (t) => 64 + ((t - 780) / 300) * 827;
  for (let t = 780; t <= 1080; t += 15) {
    const xx = x(t);
    g.line(xx, 314, xx, 314 + (t % 60 === 0 ? 14 : 7), C.muted);
    if (t % 60 === 0) g.text(time(t), xx, 352, 16, C.ink, 'Mono', 70, 'center');
  }
  g.line(64, 314, 891, 314, C.ink, 2);
  const dep = x(route.depart),
    a = x(schedule.arrival),
    f = x(schedule.finish),
    deadline = x(schedule.deadline);
  g.line(deadline, 214, deadline, 330, C.goldInk, 2);
  g.label('Deadline', deadline - 73, 207, 90, C.goldInk);
  g.line(891, 214, 891, 330, C.muted);
  g.label('Close', 891 - 11, 207, 72);
  carriage(g, dep - 12, 299, true, 0.52);
  if (arrival) {
    g.rect(dep, 303, a - dep, 10, C.blue);
    g.socket(a, 308, C.blue, 5);
    g.text(time(schedule.arrival) + ' in', a, 380, 19, C.blue, 'Mono', 140, 'center');
  }
  if (end) {
    g.rect(a, 269, f - a, 28, C.teal);
    g.text(duration + ' min', a + (f - a) / 2, 289, 17, C.white, 'Mono', f - a - 6, 'center');
    g.line(f, 253, f, 313, C.ink, 2);
    const beforeDeadline = schedule.finish <= schedule.deadline;
    g.text(
      time(schedule.finish) + ' out',
      f + (beforeDeadline ? -5 : 5),
      244,
      20,
      C.ink,
      'Mono',
      110,
      beforeDeadline ? 'right' : 'left',
    );
    if (decision || (later && b === 3)) {
      const margin = schedule.deadline - schedule.finish,
        m = (f + deadline) / 2;
      g.line(f, 384, deadline, 384, schedule.feasible ? C.teal : C.red, 2);
      for (const xx of [f, deadline]) g.line(xx, 378, xx, 390, C.ink);
      g.text(
        margin === 0 ? 'At deadline' : Math.abs(margin) + ' min ' + (margin > 0 ? 'early' : 'late'),
        m,
        416,
        22,
        margin >= 0 ? C.teal : C.red,
        'Sans',
        190,
        'center',
      );
    }
  } else if (b === 1 || arrival)
    g.text('Where will the visit end?', 453, 244, 24, C.muted, 'Serif', 324, 'center');
  g.note(
    decision
      ? schedule.feasible
        ? 'Take the ' + time(route.depart) + ' bus. The visit fits both limits.'
        : 'The doors are open at the finish. The visitor’s deadline has passed.'
      : later && b === 3
        ? 'Keep the same bus and arrival as the visitor changes the requested stay.'
        : 'Use the arrival time to place the visit on the timetable.',
  );
}
export function museum(g, k, q, n) {
  const b = k.beat.beatIndex + 1;
  switch (n) {
    case 1:
      return opening(g, k, q);
    case 2:
      return requests(g, b, q);
    case 3:
      return record(g, b, q);
    case 4:
      return loop(g, b, q);
    case 8:
      return readers(g, b, q);
    case 15:
    case 18:
      return journey(g, b, q, n === 18);
    case 33:
    case 34:
      return inside(g, k, q, n === 34);
  }
}
export function checkMuseum() {
  assert.equal(openMove, 'check-journey');
  assert.equal(shutMove, 'find-alternative');
  assert.equal(fallback(true), 'East entrance');
  assert.equal(joins('Art'), false);
  assert.equal(joins('History'), true);
  assert.equal(joins('History', false), false);
  for (const [route, minutes, arrival, end, margin] of [
    [BUS_ROUTE, 90, 875, 965, 55],
    [LATER_BUS_ROUTE, 90, 945, 1035, -15],
    [LATER_BUS_ROUTE, 70, 945, 1015, 5],
  ]) {
    const visit = visitSchedule(hours, route, minutes);
    assert.deepEqual(
      [visit.arrival, visit.finish, visit.deadline - visit.finish, visit.feasible],
      [arrival, end, margin, margin >= 0],
    );
  }
}
