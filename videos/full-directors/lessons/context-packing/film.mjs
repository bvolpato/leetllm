import assert from 'node:assert/strict';
import {
  approval,
  exchanges,
  limit,
  mandatory,
  output,
  records,
} from '../../../films/context-packing/fixtures.mjs';
import { aggregate, pack, placeNeedle, verifyNote } from '../../../films/context-packing/model.mjs';
import {
  C,
  alpha,
  box,
  circle,
  cue,
  foot,
  layout,
  lerp,
  line,
  mono,
  paper,
  rail,
  serif,
  smooth,
  stamp,
  txt,
} from './drawing.mjs';
import { longScenes, checkLong } from './long-context.mjs';

const [latest, middle, archive] = exchanges;
const ledger = {
  ...approval,
  version: 3,
  requester: 'Engineer',
  reason: 'Canary callback returned HTTP 500.',
};
const source = ledger.source + ' / v' + ledger.version;
const byline = ledger.actor[0].toUpperCase() + ledger.actor.slice(1);
const decision = ledger.approved ? 'Rollback approved' : 'Rollback declined';
const draft = { approved: ledger.approved, source: ledger.source, version: ledger.version };
const signed = { ...draft, actor: ledger.actor };
const note = { id: 'D1 note', units: 4, fields: signed };
const recent = pack(exchanges);
const revised = pack([note, ...exchanges]);
const label = 'Who approved the rollback?';
const formatted = (entry) => entry.source + ' / v' + entry.version;
function noteOK(entry) {
  return verifyNote(entry) && entry.version === ledger.version;
}
const required = [
  { start: 0, n: 4, label: 'Rules  4', fill: C.pale },
  { start: 4, n: 4, label: 'Ask  4', fill: C.pale },
];
const reply = {
  start: limit - output,
  n: output,
  label: 'Reply  ' + output,
  fill: C.pale,
  stripe: true,
};
function parts(items = []) {
  let start = mandatory;
  return [
    ...required,
    ...items.map((item) => {
      const p = {
        start,
        n: item.units,
        label: (item === note ? 'D1' : item === latest ? 'Latest' : 'Middle') + '  ' + item.units,
        fill: item === note ? C.ochre : C.mint,
      };
      start += item.units;
      return p;
    }),
    reply,
  ];
}
function rightTag(g, v) {
  mono(g, v, 1825, 82, 29, { align: 'right', color: C.mute });
}
function cardTop(g, name, x, y, w) {
  mono(g, name, x + 36, y + 49, 29, { color: C.mute, weight: 600, max: w - 72 });
  line(g, x + 36, y + 70, x + w - 36, y + 70, C.line);
}
function opening(g, k) {
  layout(g, 'INCIDENT LOG', label);
  const history = cue(k, 1, 'history', 0.95);
  const lift = cue(k, 0, 'Read the decision', 0.95);
  const pageY = 300 - 13 * lift,
    pageH = 465 - 116 * history;
  paper(g, 120, 314, 1075, 463, C.ochre);
  alpha(g, history, () => {
    box(g, 121, 629, 1073, 148, C.ochre);
    mono(g, 'Latest   “Errors now?”', 150, 694, 33);
    mono(g, 'Middle   “Which build?”', 150, 751, 33);
  });
  paper(g, 105, pageY, 1080, pageH);
  cardTop(g, 'DECISION EXCERPT     ' + source, 105, pageY, 1080);
  serif(g, decision, 148, pageY + 199 - 29 * history, 86);
  const byY = pageY + 312 - 66 * history;
  line(g, 149, byY, 596, byY, C.ink, 3);
  mono(g, 'Approved by', 150, byY + 50, 29, { color: C.mute });
  paper(g, 1285, 297, 495, 485, C.pale);
  cardTop(g, 'REPLY RESERVATION', 1285, 297, 495);
  for (let i = 0; i < output; i++) {
    const x = 1320 + (i % 4) * 104,
      y = 421 + Math.floor(i / 4) * 115;
    box(g, x, y, 89, 90, null, C.blue, 2);
    for (let j = 0; j < 3; j++)
      line(g, x + 18 + j * 18, y + 56, x + 30 + j * 18, y + 32, C.blue, 3);
  }
  mono(g, output + ' example units', 1323, 717, 32);
  const desc = [
    'Which words belong on the empty line?',
    'One request shares its window with the reply.',
    'Find the source line that answers the question.',
  ];
  foot(g, desc[k.beat.beatIndex]);
}
function budget(g, k) {
  layout(g, 'REQUEST COMPOSITION', 'How much room is left for history?');
  const haveReply = cue(k, 0, 'Reserve eight', 0.7),
    req = cue(k, 1, 'Each costs four', 0.55);
  const done = cue(k, 2, 'Sixteen units remain', 0);
  rightTag(g, 'Illustrative packet costs');
  const unit = 50,
    x = 120,
    y = 566;
  const chosen = [...(req > 0 ? required : []), ...(haveReply > 0 ? [reply] : [])];
  rail(g, chosen, { x, y, unit });
  mono(g, '0', x, y + 162);
  mono(g, limit, x + limit * unit, y + 162, 30, { align: 'right' });
  if (haveReply > 0) {
    line(g, x + 24 * unit, y - 26, x + 32 * unit, y - 26, C.blue, 4);
    mono(g, 'Reserved for generation', x + 28 * unit, y - 55, 28, {
      align: 'center',
      color: C.blue,
    });
  }
  if (req > 0) {
    line(g, x + 8 * unit, y - 26, x + 24 * unit, y - 26, C.green, 4);
    serif(
      g,
      done > 0 ? limit - output - mandatory + ' optional units' : 'Optional history?',
      x + 16 * unit,
      y - 57,
      52,
      { align: 'center', color: C.green },
    );
  }
  serif(g, 'Window of ' + limit + ' units', 120, 391, 66);
  foot(
    g,
    cue(k, 2, 'In production', 0) > 0
      ? 'Count the serialized input, then add the reserved reply budget.'
      : done > 0
        ? 'The gap between the question and the reply is available for history.'
        : 'Instructions, the question and the reply each need space.',
  );
}
const dialogues = [
  { packet: latest, name: 'Latest exchange', q: 'Errors now?', a: 'None.' },
  { packet: middle, name: 'Middle exchange', q: 'Which build?', a: 'Build 42.' },
  {
    packet: archive,
    name: 'Archived exchange',
    q: 'Roll back?',
    a: 'Decision in ' + ledger.source + '.',
  },
];
function bundles(g, k) {
  layout(g, 'REQUEST COMPOSITION', 'Which exchanges can travel together?');
  const first = cue(k, 0, 'Admit it', 0.85),
    second = cue(k, 1, 'Its eight units', 0.85);
  const probe = cue(k, 2, 'The archived exchange', 0.8),
    refused = cue(k, 3, 'Leave that complete packet', 0.6);
  const admitted = recent.kept.slice(0, second === 1 ? 2 : first === 1 ? 1 : 0);
  dialogues.forEach(({ packet, name, q, a }, i) => {
    if (i === 2 && probe <= 0) return;
    const x = 110 + i * 583;
    paper(g, x, 303, 531, 240, admitted.includes(packet) ? C.mint : C.white);
    mono(g, name, x + 28, 353, 29);
    serif(g, q, x + 28, 425, 51);
    line(g, x + 39, 445, x + 39, 479, C.green, 4);
    line(g, x + 39, 479, x + 67, 479, C.green, 4);
    txt(g, a, x + 80, 493, 42);
    mono(g, '' + packet.units, x + 493, 352, 32, { align: 'right', weight: 600 });
    const p = i === 0 ? first : i === 1 ? second : refused;
    line(g, x + 1, 543, x + 1 + 529 * p, 543, i === 2 ? C.red : C.green, 9);
  });
  rail(g, parts(admitted), { y: 665 });
  for (const [i, travel] of [first, second].entries()) {
    if (travel <= 0 || travel >= 1) continue;
    const item = dialogues[i].packet,
      start = i === 0 ? mandatory : mandatory + latest.units;
    const target = 120 + 50 * start;
    const xx = lerp(110 + 583 * i, target, travel),
      yy = lerp(553, 569, travel);
    box(g, xx, yy, item.units * 50 - 2, 80, C.mint, C.ink, 2);
    mono(g, dialogues[i].name + '   ' + item.units, xx + item.units * 25, yy + 52, 29, {
      align: 'center',
      max: item.units * 50 - 20,
    });
  }
  const state = pack(admitted);
  foot(
    g,
    refused > 0
      ? 'Keep the two recent pairs. The older exchange stays in the archive.'
      : probe > 0
        ? 'Compare the archive’s ' +
          archive.units +
          ' units with the ' +
          state.remaining +
          ' units still free.'
        : 'Each bracket keeps an answer with its question.',
    'Input ' +
      state.input +
      '  +  reply ' +
      state.output +
      '  =  ' +
      state.total +
      ' / ' +
      limit +
      '     ·     ' +
      state.remaining +
      ' free',
  );
}
const overflow = { instructions: 14, question: 12, reserve: 8, cap: 32 };
const requiredTotal = overflow.instructions + overflow.question + overflow.reserve;
function overflowScene(g, k) {
  layout(g, 'REQUEST COMPOSITION', 'Will the required request fit?');
  const o = overflow,
    done = cue(k, 1, 'The packer rejects', 0.45);
  const reveal = cue(k, 1, 'Two extend past', 0.8);
  const size = 48,
    x = 118,
    y = 573;
  const rows = [
    { start: 0, n: o.instructions, label: 'Instructions  ' + o.instructions, fill: C.pale },
    { start: o.instructions, n: o.question, label: 'Question  ' + o.question, fill: C.mint },
  ];
  rail(g, rows, { x, y, unit: size, capacity: o.cap });
  const start = o.instructions + o.question;
  const startX = lerp(x + 125, x + size * start, reveal);
  const ry = lerp(338, y, reveal);
  box(g, startX, ry, o.reserve * size, 100, C.ochre, C.ink, 2);
  txt(g, 'Reply  ' + o.reserve, startX + (o.reserve * size) / 2, ry + 62, 36, { align: 'center' });
  for (let i = 0; i < o.reserve; i++)
    line(g, startX + (i + 0.5) * size, ry + 81, startX + (i + 0.5) * size, ry + 98, C.ink, 2);
  const capX = x + size * o.cap;
  line(g, capX, 487, capX, 716, C.red, 5);
  mono(g, limit + '-unit limit', capX, 772, 32, { align: 'center', color: C.red });
  if (done > 0) stamp(g, 'REQUEST REJECTED', 119, 342, 420, C.red);
  foot(
    g,
    done > 0
      ? 'Required packets exceed the window by ' + (requiredTotal - o.cap) + ' units.'
      : 'Can removing history help this request?',
    done > 0
      ? '14 + 12 + 8 = ' + requiredTotal + ' required'
      : 'Optional history admitted   0 units',
  );
}
function entry(g, x, y, w, { heading, actor = '', fill = C.white, ref = source, body = decision }) {
  paper(g, x, y, w, 327, fill);
  cardTop(g, heading, x, y, w);
  serif(g, body, x + 35, y + 155, 62, { max: w - 70 });
  if (actor) txt(g, actor, x + 35, y + 220, 44, { weight: 600, color: C.green });
  line(g, x + 35, y + 237, x + w - 35, y + 237, C.line);
  mono(g, ref, x + 35, y + 291, 34, { color: C.mute });
}
function packingPiece(g, part, start, y, opacity = 1) {
  const x = 120 + start * 50,
    width = part.n * 50;
  alpha(g, opacity, () => {
    box(g, x + 1, y + 1, width - 2, 72, part.fill, C.ink, 2);
    for (let step = 0; step < part.n; step++) {
      const tick = x + (step + 0.5) * 50;
      line(g, tick, y + 60, tick, y + 71, C.ink, 2);
    }
    txt(g, part.label, x + width / 2, y + 46, 34, {
      align: 'center', weight: 600, max: width - 18,
    });
  });
}
function notePacking(g, priority, filed, ready, archived) {
  const [, , originalLatest, originalMiddle] = parts(recent.kept);
  const [, , checkedNote, nextLatest] = parts(revised.kept);
  const y = 749;
  rail(g, [...required, reply], { y, height: 74 });
  if (priority < 1) {
    packingPiece(g, originalMiddle, originalMiddle.start, y + 25 * priority, 1 - priority);
  }
  const shift = smooth(Math.min(1, filed * 2));
  const descend = smooth(Math.max(0, filed * 2 - 1));
  packingPiece(g, originalLatest, lerp(originalLatest.start, nextLatest.start, shift), y);
  if (descend > 0) packingPiece(g, checkedNote, checkedNote.start, lerp(685, y, descend), descend);
  const state = ready ? revised : priority === 0 ? recent : null;
  mono(g,
    state
      ? state.input + ' input + ' + state.output + ' reserved = ' + state.total + ' / ' +
        limit + '  ·  ' + state.remaining + ' free'
      : 'Same window and reply reservation',
    120, 862, 34, { color: C.mute },
  );
  if (archived) mono(g, 'Original stays in the archive', 1720, 862, 34, {
    align: 'right', color: C.mute,
  });
}
function compareNote(g, k) {
  layout(g, 'SOURCE CHECK', label);
  const lift = cue(k, 2, 'Bring that byline across', 1.15);
  const register = cue(k, 0, 'Compare its fields', 1.1);
  const priority = k.beat.beatIndex === 3
    ? smooth(k.reveal('priority over the optional middle exchange', 0.85, { captionStart: false }))
    : 0;
  const filed = cue(k, 3, 'Keep the latest exchange', 0.85);
  const ready = cue(k, 3, 'Six units stay free', 0) === 1;
  const archived = cue(k, 3, 'Preserve the original archive', 0.3) > 0;
  const checked = lift === 1 && noteOK(signed);
  entry(g, 100, 355, 762, { heading: 'ORIGINAL DECISION', actor: byline });
  entry(g, 1042, 355 + 74 * (1 - register), 762, {
    heading: checked ? 'CHECKED NOTE   /   4 UNITS' : 'DRAFT NOTE   /   4 UNITS',
    fill: checked ? C.mint : C.white,
    actor: checked ? byline : '',
  });
  mono(g, 'Requested by ' + ledger.requester, 137, 320, 30, { color: C.mute });
  if (lift > 0 && lift < 1) {
    const x = lerp(135, 1077, lift),
      y = 575;
    box(g, x - 7, y - 46, 310, 59, C.ochre);
    txt(g, byline, x, y, 44, { weight: 600 });
  }
  if (k.beat.beatIndex === 3) notePacking(g, priority, filed, ready, archived);
  else if (checked) stamp(g, 'SOURCE AND BYLINE MATCH', 1050, 740, 600);
  else mono(g, 'Compare the signature and source on both lines.', 105, 777, 33);
}
function scan(g, k) {
  layout(g, 'POSITION TEST', 'Where can each reader find the pair?');
  const move = cue(k, 1, 'Move the same fact', 1.2);
  const tail = cue(k, 3, 'At the tail', 1.2);
  const from = tail > 0 ? 0.5 : 0,
    to = tail > 0 ? 1 : 0.5,
    p = tail > 0 ? tail : move;
  const pos = Math.round(lerp(from * 16, to * 16, p));
  const test = placeNeedle(pos / 16);
  let fullResult, edgeResult;
  if (tail > 0) {
    fullResult = edgeResult = cue(k, 3, 'find it again', 0.3);
  } else if (move > 0) {
    fullResult = cue(k, 2, 'finds the pair', 0.3);
    edgeResult = cue(k, 2, 'misses it', 0.3);
  } else {
    edgeResult = cue(k, 0, 'Both tokens match', 0.3);
    fullResult = cue(k, 0, 'finds them too', 0.3);
  }
  const x = 113,
    w = 92,
    y = 488;
  mono(g, 'Known pair    ' + test.needle.join('  '), x, 332, 37, { color: C.gold });
  mono(g, 'Document   ' + test.document.length + ' positions', x + w * 18, 332, 30, {
    align: 'right',
  });
  test.document.forEach((v, i) => {
    const left = x + i * w,
      edge = i < 4 || i >= 14;
    box(g, left, y, w - 4, 102, v ? C.ochre : edge ? C.mint : C.white, C.ink, 2);
    mono(g, v || '·', left + w * 0.5 - 2, y + 66, v ? 43 : 35, { align: 'center' });
    if (v && test.edge) {
      const read =
        move === 0
          ? cue(k, 0, i === test.index ? 'reads ninety-nine' : 'then ninety-eight', 0.3)
          : edgeResult;
      alpha(g, read, () => line(g, left + 9, y + 88, left + w - 13, y + 88, C.green, 10));
    }
  });
  for (const start of [0, 14]) {
    line(g, x + w * start, y + 132, x + w * (start + 4) - 4, y + 132, C.green, 5);
    mono(g, 'edge scan', x + (start + 2) * w, y + 185, 31, { align: 'center', color: C.green });
  }
  alpha(g, fullResult, () =>
    stamp(g, 'FULL SCAN   ' + (test.full ? 'FOUND' : 'MISSED'), 340, 751, 460),
  );
  alpha(g, edgeResult, () =>
    stamp(
      g,
      'EDGE SCAN   ' + (test.edge ? 'FOUND' : 'MISSED'),
      1010,
      751,
      460,
      test.edge ? C.green : C.red,
    ),
  );
  foot(
    g,
    `${test.input - test.document.length} instruction + ${test.document.length} document + ${test.output} reserved = ${test.limit} tokens`,
    'Filler tokens before the pair   ' +
      test.index +
      ' / ' +
      (test.document.length - test.needle.length),
  );
}
const matches = records.filter((r) => r.month === 'Mar' && r.type === 'timeout');
const top = matches.toSorted((a, b) => b.score - a.score).slice(0, 2);
const totalMarch = aggregate(matches);
function march(g, k) {
  layout(g, 'TRACE ARCHIVE', 'Which service had the most March timeouts?');
  const scan = cue(k, 1, 'Uncover the rest', 1.6),
    declared = cue(k, 2, 'Send the model', 0.35);
  const rest = records.filter((row) => !top.includes(row));
  const seen = [...top, ...rest.slice(0, Math.floor(rest.length * scan))];
  const selected = seen.filter((r) => matches.includes(r)),
    tally = aggregate(selected);
  const x = 108,
    y = 361,
    w = 1032,
    h = 63;
  mono(g, 'Event', x + 30, 327, 29);
  mono(g, 'Month', x + 184, 327, 29);
  mono(g, 'Service', x + 352, 327, 29);
  mono(g, 'Type', x + 538, 327, 29);
  mono(g, 'Score', x + 830, 327, 29);
  records.forEach((row, i) => {
    const yy = y + i * h;
    if (!seen.includes(row)) {
      box(g, x, yy, w, h - 4, C.empty);
      line(g, x + 15, yy + h / 2, x + w - 15, yy + h / 2, '#cdcdc1', 2);
      return;
    }
    const ok = selected.includes(row);
    box(g, x, yy, w, h - 4, ok ? C.white : C.empty);
    for (const [v, dx] of [
      [row.id, 30],
      [row.month, 184],
      [row.service, 352],
      [row.type, 538],
      [row.score.toFixed(2), 830],
    ])
      mono(g, v, x + dx, yy + 42, 30, { color: ok ? C.ink : C.mute });
    box(g, x, yy, 9, h - 4, ok ? C.green : C.red);
    if (!ok)
      line(
        g,
        x + (row.month === 'Feb' ? 178 : 534),
        yy + 30,
        x + (row.month === 'Feb' ? 249 : 680),
        yy + 30,
        C.red,
        3,
      );
  });
  const cx = 1254;
  for (const [j, service] of ['A', 'B'].entries()) {
    const xx = cx + j * 258;
    const counted = selected.filter((r) => r.service === service);
    for (const [i, r] of counted.entries()) {
      const yy = 722 - i * 91;
      box(g, xx, yy - 83, 202, 79, service === 'A' ? C.pale : C.mint, C.ink, 2);
      mono(g, r.id, xx + 101, yy - 31, 39, { align: 'center' });
    }
    line(g, xx - 8, 728, xx + 211, 728, C.ink, 4);
    mono(g, service + '   ' + tally.counts[service], xx + 101, 786, 38, { align: 'center' });
  }
  mono(g, scan === 0 ? 'Highest-ranked matches' : 'Population scan', cx, 327, 31);
  foot(
    g,
    declared > 0
      ? 'Service ' + tally.winner + ' leads in the complete March timeout population.'
      : scan > 0
        ? 'Include March timeouts once each. Exclude other dates and event types.'
        : 'Two matches have been retrieved. Is the population complete?',
    declared > 0 ? 'Source events   ' + tally.sources.join('  ') : '',
  );
}
function route(g, k) {
  layout(g, 'EVIDENCE SELECTION', 'Which records must the model read together?');
  const retrieve = cue(k, 1, 'retrieve the relevant passage', 0.7),
    both = cue(k, 1, 'For a question linking', 0.8);
  const items = [
    ['C1', 'Canary callback returned 500.'],
    [source, 'Approved by the incident lead.'],
    ['E2', 'Which build?  Build 42.'],
    ['E3', 'Errors now?  None.'],
  ];
  items.forEach(([id, text], i) => {
    const y = 361 + i * 103,
      pick = retrieve <= 0 || id === source || (id === 'C1' && both > 0);
    box(g, 122, y, 902, 84, pick ? C.white : C.empty, C.line);
    mono(g, id, 151, y + 53, 33, { color: C.green });
    serif(g, text, 365, y + 56, 42, { max: 636 });
    if (pick) {
      line(g, 1025, y + 42, 1171, y + 42, C.green, 3);
      circle(g, 1175, y + 42, 7, C.green);
    }
  });
  paper(g, 1198, 349, 564, 425);
  cardTop(g, 'EVIDENCE IN REQUEST', 1198, 349, 564);
  const selected = retrieve <= 0 ? 'C1   D1   E2   E3' : both > 0 ? 'C1 + ' + source : source;
  mono(g, selected, 1232, 555, 44, { max: 485, weight: 600 });
  txt(
    g,
    retrieve <= 0
      ? 'Bounded incident packet'
      : both > 0
        ? 'Two linked sources'
        : 'Verified signature',
    1232,
    654,
    37,
    { max: 485 },
  );
  foot(
    g,
    retrieve <= 0
      ? 'Preserve event order when the question depends on a sequence.'
      : both > 0
        ? 'Check the relationship and the coverage of both sources.'
        : 'Keep the source ID and version with a retrieved excerpt.',
  );
}
const exercise = {
  capacity: 40,
  reserve: 12,
  rules: 6,
  ask: 2,
  oldNote: 6,
  recent: 8,
  extra: 9,
  reason: 7,
};
const exNote = { id: 'approval', units: exercise.oldNote };
const exRecent = { id: 'recent', units: exercise.recent };
const attempt = { id: 'extra', units: exercise.extra };
const reasonNote = {
  id: 'reason',
  units: exercise.reason,
  source: ledger.source,
  version: ledger.version,
  reason: ledger.reason,
  actor: ledger.actor,
};
const practice = (extra) =>
  pack(extra, exercise.rules + exercise.ask, exercise.reserve, exercise.capacity);
const exerciseRail = { x: 120, y: 657, unit: 42, capacity: exercise.capacity };
const exerciseX = (units) => exerciseRail.x + units * exerciseRail.unit;

function secondsAfterPhrase(clock, beat, phrase) {
  if (clock.beat.beatIndex < beat) return -Infinity;
  if (clock.beat.beatIndex > beat) return Infinity;
  clock.reveal(phrase, 0, { captionStart: phrase });
  return clock.elapsed - clock.wordCue(phrase).end;
}

function compareExtra(g, k, request) {
  const { x, y, unit } = exerciseRail;
  const inputEnd = exerciseX(request.input);
  const replyStart = exerciseX(exercise.capacity - request.output);
  const trialTotal = request.total + attempt.units;
  const excess = trialTotal - exercise.capacity;
  const shift = secondsAfterPhrase(k, 2, 'forty-three');
  const travel = smooth(Math.min(1, Math.max(0, shift / 0.65)));
  const rejected = secondsAfterPhrase(k, 2, 'Leave that exchange out') >= 0;
  const counted = secondsAfterPhrase(k, 2, 'Only six remain') >= 0;

  serif(g, exercise.capacity + '-unit window', x, 367, 66);
  txt(g, 'Checked note and recent exchange', x, 440, 43);
  mono(g, 'PACKED REQUEST', x, y - 39, 30, { color: C.mute });
  if (counted) {
    line(g, inputEnd, y - 29, replyStart, y - 29, C.green, 4);
    mono(g, request.remaining + ' free', (inputEnd + replyStart) / 2, y - 44, 34, {
      align: 'center',
      color: C.green,
    });
  }
  const width = attempt.units * unit;
  const left = lerp(exerciseX(exercise.capacity) - width, inputEnd, travel);
  const top = lerp(427, 508, travel);
  const height = 73;
  box(g, left, top, width, height, C.white, C.ink);
  if (travel === 1) {
    box(g, replyStart, top + 2, excess * unit - 2, height - 4, C.rose);
    line(g, inputEnd, top + height, inputEnd, y - 11, C.mute, 2, [5, 6]);
    line(g, replyStart, top, replyStart, y - 11, C.red, 3, [5, 6]);
    mono(g, excess + ' into reply', left + width + 17, top + 46, 30, { color: C.red });
  }
  for (let i = 1; i < attempt.units; i++) {
    line(g, left + i * unit, top + height - 13, left + i * unit, top + height, C.mute, 2);
  }
  mono(g, rejected ? 'EXCHANGE STAYS OUT' : 'EXTRA EXCHANGE', left, top - 16, 31, {
    color: rejected ? C.red : C.mute,
  });
  mono(g, attempt.units + ' units', left + 21, top + 46, 35);
  foot(
    g,
    rejected
      ? 'Keep the full reply reserve. Leave the complete exchange outside.'
      : travel === 1
        ? 'The exchange extends into the reply reserve.'
        : 'Can this whole exchange fit before the reply?',
    travel === 1
      ? request.total + ' + ' + attempt.units + ' = ' + trialTotal + ' > ' + exercise.capacity
      : '',
  );
}

function finish(g, k) {
  const b = k.beat.beatIndex,
    ex = exercise;
  if (b === 0) {
    layout(g, 'FINAL PRACTICE', 'What can this request answer?');
    entry(g, 105, 303, 790, {
      heading: 'CHECKED NOTE    /    4 UNITS',
      actor: byline,
      fill: C.mint,
    });
    serif(g, label, 998, 455, 55, { max: 803 });
    mono(g, 'Source   ' + source, 1001, 535, 35);
    rail(g, parts(revised.kept), { y: 730, height: 78 });
    foot(g, 'The note supplies the approver. The reply still has its eight units.');
    return;
  }
  const why = cue(k, 2, 'Now the question changes', 0.6) > 0;
  const open = cue(k, 3, 'Open the same version', 0.8);
  const reasonRead = secondsAfterPhrase(k, 3, 'the canary callback returned HTTP five hundred') >= 0;
  const copied = secondsAfterPhrase(k, 3, 'Copy the stated reason, signer and source') >= 0;
  const recounted = secondsAfterPhrase(k, 4, 'The replacement costs seven units') >= 0;
  const inputCounted = secondsAfterPhrase(k, 4, 'twenty-three units') >= 0;
  const confirmed = secondsAfterPhrase(k, 4, 'Thirty-five units fit inside forty') >= 0;
  const activeNote = recounted ? reasonNote : exNote;
  const request = practice([activeNote, exRecent]);
  layout(
    g,
    'FINAL PRACTICE',
    why ? 'Why did the lead approve the rollback?' : 'Can the nine-unit exchange fit?',
  );
  if (why) {
    paper(g, 120, 296, 790, 274, open > 0 ? C.white : C.ochre);
    cardTop(g, 'ARCHIVE   /   ' + source, 120, 296, 790);
    if (reasonRead) drawReason(g, 155, ledger);
    else {
      serif(g, open > 0 ? 'Recorded reason for rollback' : 'Original incident log', 155, 441, 53);
      if (open === 0) txt(g, 'Follow the citation from the note.', 155, 519, 39);
    }
    paper(g, 1000, 296, 810, 274, copied ? C.mint : C.white);
    cardTop(
      g,
      recounted
        ? 'PACKED REASON   /   ' + formatted(reasonNote)
        : copied
          ? 'REPLACEMENT DRAFT   /   ' + formatted(reasonNote)
          : 'PACKED APPROVAL   /   ' + source,
      1000,
      296,
      810,
    );
    if (copied) drawReason(g, 1035, reasonNote);
    else {
      txt(g, decision, 1035, 437, 43);
      txt(g, byline, 1035, 514, 36);
    }
  }
  const allocations = [
    { n: ex.rules, label: 'Rules  ' + ex.rules, fill: C.pale },
    { n: ex.ask, label: 'Q ' + ex.ask, fill: C.pale },
    {
      n: activeNote.units,
      label: (recounted ? 'Reason  ' : 'Approval  ') + activeNote.units,
      fill: C.ochre,
    },
    { n: exRecent.units, label: 'Recent  ' + exRecent.units, fill: C.mint },
  ];
  let offset = 0;
  for (const p of allocations) {
    p.start = offset;
    offset += p.n;
  }
  allocations.push({
    start: ex.capacity - ex.reserve,
    n: ex.reserve,
    label: 'Reply  ' + ex.reserve,
    fill: C.pale,
    stripe: true,
  });
  rail(g, allocations, exerciseRail);
  if (!why) {
    compareExtra(g, k, request);
    return;
  }
  if (recounted) {
    const added = reasonNote.units - exNote.units;
    const right = exerciseX(ex.rules + ex.ask + reasonNote.units);
    const left = right - added * exerciseRail.unit;
    const y = exerciseRail.y - 25;
    line(g, left, y, right, y, C.gold, 4);
    mono(g, '+' + added + ' unit for the reason', left, y - 16, 32, { color: C.gold });
  }
  foot(
    g,
    confirmed
      ? 'The signed reason explains the decision. Investigate the callback failure separately.'
      : copied
        ? 'Recount the request with the signed reason in place.'
        : 'Which source records the lead’s reason?',
    confirmed
      ? 'Input ' +
        request.input +
        ' + reply ' +
        request.output +
        ' = ' +
        request.total +
        ' / ' +
        ex.capacity +
        '    ·    ' +
        request.remaining +
        ' free'
      : inputCounted
        ? 'Input ' + request.input + '    ·    Reply reservation ' + request.output
        : '',
  );
}
function drawReason(g, x, record) {
  mono(g, 'RECORDED REASON FOR ROLLBACK', x, 412, 29, { color: C.green, weight: 600 });
  serif(g, record.reason, x, 480, 47, { max: 716 });
  txt(g, 'Signed by the ' + record.actor, x, 538, 35);
}
const scenes = {
  c01: opening,
  c02: budget,
  c03: bundles,
  c04: overflowScene,
  c05: compareNote,
  c06: scan,
  c07: march,
  route,
  ...longScenes,
  c08: finish,
};
function check() {
  assert.equal(limit - mandatory - output, 16);
  assert.deepEqual(recent.kept, [latest, middle]);
  assert.deepEqual(recent.dropped, [archive]);
  assert.equal(recent.remaining, 2);
  assert.throws(
    () => pack([], overflow.instructions + overflow.question, overflow.reserve, overflow.cap),
    /exceed/,
  );
  assert.equal(requiredTotal - overflow.cap, 2);
  assert.equal(noteOK(draft), false);
  assert.equal(noteOK(signed), true);
  for (const wrong of [{ actor: 'engineer' }, { source: 'D2' }, { version: 2 }])
    assert.equal(noteOK({ ...signed, ...wrong }), false);
  assert.deepEqual(revised.kept, [note, latest]);
  assert.equal(revised.total, 26);
  assert.equal(revised.remaining, 6);
  assert.deepEqual(
    parts(revised.kept).map((p) => [p.start, p.n]),
    [
      [0, 4],
      [4, 4],
      [8, 4],
      [12, 6],
      [24, 8],
    ],
  );
  for (let i = 0; i <= 16; i++) {
    const t = placeNeedle(i / 16);
    assert.equal(t.index, i);
    assert.deepEqual(t.document.slice(i, i + 2), [99, 98]);
    assert.equal(t.document.filter((token) => token === 0).length, 16);
    assert.equal(t.input, 20);
    assert.equal(t.output, 4);
    assert.ok(t.full);
    assert.equal(t.edge, i <= 2 || i >= 14);
    assert.equal(t.input + t.output, t.limit);
  }
  assert.deepEqual(
    top.map((r) => r.id),
    ['r1', 'r2'],
  );
  assert.deepEqual(aggregate(top).counts, { A: 2, B: 0 });
  assert.deepEqual(totalMarch, {
    counts: { A: 2, B: 3 },
    winner: 'B',
    sources: ['r1', 'r2', 'r3', 'r4', 'r5'],
  });
  const trial = practice([exNote, exRecent, attempt]);
  assert.deepEqual(trial.dropped, [attempt]);
  assert.equal(trial.total + attempt.units, 43);
  assert.equal(trial.remaining, 6);
  assert.equal(attempt.units - trial.remaining, 3);
  assert.equal(reasonNote.reason, ledger.reason);
  assert.equal(reasonNote.actor, ledger.actor);
  assert.equal(formatted(reasonNote), source);
  const finalRequest = practice([reasonNote, exRecent]);
  assert.deepEqual(
    [finalRequest.input, finalRequest.output, finalRequest.total, finalRequest.remaining],
    [23, 12, 35, 5],
  );
  checkLong();
}
export default {
  title: 'Choosing What Fits in a Context Window',
  draw(g, k) {
    scenes[k.beat.chapterId](g, k);
  },
  check,
};
