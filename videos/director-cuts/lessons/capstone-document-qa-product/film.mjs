import assert from 'node:assert/strict';
import {
  SHIPPING_EXCEPTION,
  SHIPPING_PASSAGE,
  SHIPPING_QUESTION,
} from '../../../films/capstone-document-qa-product/fixtures.mjs';
import { freshShippingAnswer, sharedTerms } from '../../../films/capstone-document-qa-product/model.mjs';

const questions = [SHIPPING_QUESTION, SHIPPING_EXCEPTION];
const inquiries = questions.map((question, index) => {
  const reply = freshShippingAnswer(index === 1);
  const fingerprint = reply.checks.find(check => check.field === 'questionSha256');
  return { question, reply, fingerprint, hits: sharedTerms(question, SHIPPING_PASSAGE.text) };
});
const rows = [
  ['Is a specialist review', 'required before hazardous', 'parcels are dispatched?'],
  ['Can a temperature check', 'replace specialist review', 'before hazardous parcels', 'are dispatched?'],
];
const passageLines = ['Hazardous parcels', 'require a specialist review', 'before dispatch.'];

const beats = [
  {
    id: 'parcel',
    say: 'There’s a question tied to this parcel. Does a specialist have to review it before it goes out?',
    hold: 1,
  },
  {
    id: 'passage',
    say: 'The clerk searches the approved shipping handbook. Read the sentence that comes back. What has to happen before dispatch?',
    hold: 1.6,
  },
  {
    id: 'pink-copy',
    say: 'A specialist has to review the parcel. Now look under that sentence. A policy editor has checked that the passage answers this particular question. The pink slip records that judgment.',
    hold: 0.75,
  },
  {
    id: 'first-reply',
    say: 'Bring the pink copy up to the tag. Those marks are fingerprints of the question text. They match. The clerk gets the exact sentence the editor checked, with a citation back to this page.',
    hold: 1.15,
  },
  {
    id: 'new-tag',
    say: 'The clerk has a follow-up. Could a temperature check take the place of the specialist review? Watch the handbook. Both questions share the same four search terms with this sentence. The same page comes back first.',
    hold: 1,
  },
  {
    id: 'compare',
    say: 'Try the pink copy against this tag. Which question did the editor review? Read the two fingerprints. They differ. The editor checked the requirement for a specialist. This tag asks about a substitute.',
    hold: 1.35,
  },
  {
    id: 'no-citation',
    say: 'Here comes the reply. The service leaves the exception unanswered and sends no citation. It would need a passage that addresses the substitution, with a review for this question.',
    hold: 1.3,
  },
  {
    id: 'pair',
    say: 'Keep both tags. When you change the search, try these questions again. The first should still get the quoted policy. For the temperature check, the service should still abstain.',
    hold: 2.8,
  },
];

const ink = '#142952';
const blue = '#214b9d';
const red = '#9d392f';
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => { const t = clamp(x); return t * t * (3 - 2 * t); };

function polygon(c, vertices) {
  c.beginPath();
  c.moveTo(...vertices[0]);
  for (const point of vertices.slice(1)) c.lineTo(...point);
  c.closePath();
}

function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}

function line(c, x, y, x2, y2, color, width = 2) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x2, y2);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}

function type(c, words, x, y, size, family = 'Sans', color = ink, weight = 400) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillStyle = color;
  c.fillText(words, x, y);
}

function circle(c, x, y, radius, color) {
  c.beginPath();
  c.arc(x, y, radius, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}

function gradient(c, x, y, x2, y2, stops) {
  const paint = c.createLinearGradient(x, y, x2, y2);
  stops.forEach(([at, color]) => paint.addColorStop(at, color));
  return paint;
}

function lift(c, silhouette, color, blur, drop) {
  c.save();
  c.shadowColor = 'rgba(56,31,38,0.34)';
  c.shadowOffsetY = drop;
  c.shadowOffsetX = drop * 0.35;
  c.shadowBlur = blur;
  silhouette();
  c.fillStyle = color;
  c.fill();
  c.restore();
}

// Short fixed fibers give the cardboard a grain that stays put as the parcel moves.
function fibers(c, x, y, w, h, count, seed) {
  let n = seed;
  const next = () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
  c.beginPath();
  for (let i = 0; i < count; i++) {
    const xx = x + next() * w, yy = y + next() * h;
    c.moveTo(xx, yy);
    c.lineTo(xx + 3 + 15 * next(), yy - 1 + 2 * next());
  }
  c.strokeStyle = 'rgba(92,53,30,0.13)';
  c.lineWidth = 1.35;
  c.stroke();
}

function desk(c) {
  rect(c, -460, 0, 2380, 1080, gradient(c, 0, 0, 1900, 1050, [
    [0, '#efc7a5'], [0.48, '#df997c'], [1, '#cc786a'],
  ]));
  for (let y = -300; y < 1200; y += 308) {
    line(c, -460, y-36, 1920, y + 151, 'rgba(85,42,35,0.15)', 4);
    line(c, -460, y-32, 1920, y + 155, 'rgba(255,232,196,0.32)', 2);
  }
  // Light from a high window crosses the lip of the counter.
  polygon(c, [[1240,0],[1570,0],[620,1080],[280,1080]]);
  c.fillStyle = 'rgba(255,237,202,0.16)';
  c.fill();
}

function cord(c, build, width = 12) {
  build();
  c.save();
  c.strokeStyle = '#765038';
  c.lineWidth = width + 3;
  c.stroke();
  c.strokeStyle = '#f4d99e';
  c.lineWidth = width;
  c.stroke();
  c.setLineDash([2.8, 8]);
  c.strokeStyle = '#a77b4e';
  c.stroke();
  c.restore();
}

function parcel(c) {
  const box = [[-160,83],[887,57],[1004,149],[1008,872],[945,958],[-160,962]];
  lift(c, () => polygon(c, box), '#8e603a', 22, 19);
  polygon(c, [[-160,83],[887,57],[1004,149],[1008,872],[-160,907]]);
  c.fillStyle = gradient(c, 0, 0, 800, 960, [[0,'#dfb77c'],[0.7,'#cda16b'],[1,'#b48453']]);
  c.fill();
  polygon(c, [[887,57],[1004,149],[1008,872],[945,958],[945,155]]);
  c.fillStyle = '#b48454';
  c.fill();
  line(c, -20, 909, 947, 882, '#976e45', 3);
  c.save();
  polygon(c, box);
  c.clip();
  fibers(c, -160, 40, 1200, 935, 1300, 1277);
  // The center seam disappears under the gummed paper tape.
  c.translate(337, 0);
  c.rotate(-0.028);
  rect(c, -59, 47, 126, 922, 'rgba(142,90,44,0.30)');
  rect(c, -55, 47, 119, 922, 'rgba(238,204,140,0.68)');
  line(c, 4, 52, 5, 955, 'rgba(150,104,57,0.38)', 2);
  c.restore();
  cord(c, () => {
    c.beginPath();
    c.moveTo(158, 75);
    c.bezierCurveTo(135, 372, 118, 611, 96, 902);
    c.lineTo(90, 956);
  });
  cord(c, () => {
    c.beginPath();
    c.moveTo(-160, 518);
    c.bezierCurveTo(312, 503, 694, 484, 949, 473);
    c.lineTo(1006, 452);
  });
  c.save();
  c.translate(731, 115);
  c.rotate(-0.025);
  for (const x of [0, 57]) {
    polygon(c, [[x,32],[x+21,4],[x+42,32],[x+29,32],[x+29,75],[x+14,75],[x+14,32]]);
    c.fillStyle = '#805e3c';
    c.fill();
  }
  line(c,-1,83,99,83,'#805e3c',7);
  c.restore();
}

function fingerprint(c, digest, x, y, downward = false) {
  // Both pieces print the same prefix of the hash that the service checks in full.
  const prefix = digest.slice(0, 8);
  const bits = [...prefix].map(n => parseInt(n, 16).toString(2).padStart(4, '0')).join('');
  for (let i = 0; i < bits.length; i++) {
    const height = bits[i] === '1' ? 45 : 21;
    rect(c, x + i * 5.1, downward ? y : y - height, 3.4, height, ink);
  }
  type(c, prefix.slice(0,4) + ' ' + prefix.slice(4), x + 186, downward ? y + 36 : y, 38, 'Mono');
}

const tagShape = [[0,112],[96,0],[882,0],[882,574],[96,574],[0,462]];

function replyMark(c, inquiry, amount) {
  if (amount <= 0) return;
  const {reply} = inquiry;
  const n = reply.citations.length;
  const cited = n > 0, color = cited ? blue : red;
  c.save();
  c.beginPath();
  c.rect(128, 475, 730 * ease(amount), 90);
  c.clip();
  rect(c, 131, 479, 7, 71, color);
  type(c, cited ? 'Policy quoted' : 'Abstained', 160, 531, 43, 'Sans', color, 700);
  type(c, n + (n === 1 ? ' citation' : ' citations'), 550, 531, 38, 'Sans', color);
  c.restore();
}

function tag(c, index, angle, x, y, mark, showPrint, focusCondition) {
  const inquiry = inquiries[index];
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  lift(c, () => polygon(c, tagShape), '#faf2da', 13, 11);
  c.save();
  polygon(c, tagShape);
  c.clip();
  rect(c, 0, 0, 882, 574, gradient(c, 0, 15, 850, 570, [
    [0,'#fff8e4'],[0.78,'#f9efd5'],[1,'#f2dfb6'],
  ]));
  // The color runs off the cut edge of the tag.
  for (let y0 = -80; y0 < 650; y0 += 72) {
    polygon(c, [[851,y0],[882,y0-20],[882,y0+9],[851,y0+29]]);
    c.fillStyle = index ? '#c65742' : '#35568a';
    c.fill();
  }
  c.restore();
  circle(c, 57, 287, 34, '#c68d57');
  circle(c, 57, 287, 22, '#ebcc95');
  circle(c, 57, 287, 14, '#654831');
  cord(c, () => {
    c.beginPath();
    c.moveTo(56,288);
    c.bezierCurveTo(29,302,-14,309,-54,274);
    c.bezierCurveTo(-87,242,-48,216,-15,236);
    c.bezierCurveTo(18,254,20,270,53,284);
  }, 8);
  type(c, index ? 'FOLLOW-UP QUESTION' : 'SHIPPING QUESTION', 126, 70, 33, 'Sans', index ? red : blue, 700);
  line(c, 126, 95, 814, 95, '#b6aa91', 2);
  const lines = rows[index];
  const start = index ? 165 : 184;
  for (const [i, words] of lines.entries()) {
    const baseline = start + i * 57;
    type(c, words, 126, baseline, 52, 'Serif');
    if (index && i === 0 && focusCondition > 0) {
      const left = 126 + c.measureText('Can a ').width;
      const w = c.measureText('temperature check').width;
      line(c, left, baseline + 10, left + w * ease(focusCondition), baseline + 8, '#b34c37', 4);
    }
  }
  if (showPrint > 0) {
    c.save();
    c.globalAlpha *= ease(showPrint);
    fingerprint(c, inquiry.fingerprint.current, 128, 439);
    c.restore();
  }
  c.save();
  c.setLineDash([9,8]);
  line(c, 106, 465, 833, 465, '#a69170', 2);
  c.restore();
  replyMark(c, inquiry, mark);
  c.restore();
}

function drawCover(c) {
  rect(c, 0, 0, 794, 800, gradient(c, 0, 0, 750, 770, [
    [0, '#18386b'], [0.6, '#234c88'], [1,'#2c5796'],
  ]));
  // A printed parcel on the cloth cover uses the same folds as the box on the desk.
  const cream = '#ffe6b1';
  c.save();
  c.translate(102, 122);
  c.lineWidth = 9;
  c.lineJoin = 'round';
  c.strokeStyle = cream;
  polygon(c, [[0,117],[228,0],[456,117],[456,314],[229,430],[0,314]]);
  c.stroke();
  line(c, 0,117,229,232,cream,8);
  line(c, 229,232,456,117,cream,8);
  line(c, 229,232,229,430,cream,8);
  polygon(c, [[80,75],[128,51],[354,168],[354,235],[306,258],[306,192]]);
  c.fillStyle = '#ed986f';
  c.fill();
  c.restore();
  type(c, 'Shipping', 88, 645, 94, 'Serif', '#ffefc9');
  type(c, 'handbook', 88, 731, 94, 'Serif', '#ffefc9');
}

function policyText(c, highlight, cited) {
  const wordsToMark = new Set(inquiries[1].hits);
  const x = 62;
  type(c, 'Shipping policy', x, 149, 43, 'Sans', blue, 700);
  type(c, 'v1', 654, 149, 35, 'Mono', blue);
  line(c, x, 179, 733, 179, '#96a1a7');
  for (const [i, words] of passageLines.entries()) {
    const y = 269 + i * 70;
    type(c, words, x, y, 56, 'Serif');
    if (highlight > 0 && i < 2) {
      let prefix = '';
      for (const word of words.split(' ')) {
        if (wordsToMark.has(word.toLowerCase())) {
          const start = x + c.measureText(prefix).width;
          const width = c.measureText(word).width;
          line(c, start, y + 12, start + width * ease(highlight), y + 12, '#467397', 5);
        }
        prefix += word + ' ';
      }
    }
  }
  if (cited > 0) {
    c.save();
    c.globalAlpha *= ease(cited);
    const end = x + c.measureText(passageLines.at(-1)).width;
    type(c, '[1]', end + 10, 391, 32, 'Mono', blue);
    c.restore();
  }
}

function editorCopy(c, amount, compare, tagIndex) {
  if (amount <= 0) return;
  const homeAngle = 0.022;
  const tagAngle = tagIndex ? -0.031 : -0.034;
  // The tops of the two bar patterns meet at the cut edge of the pink sheet.
  // Each position is measured on the object that holds the paper at that end.
  const placed = (x, y, angle, dx, dy) => [
    x + dx * Math.cos(angle) - dy * Math.sin(angle),
    y + dx * Math.sin(angle) + dy * Math.cos(angle),
  ];
  const home = placed(1040, 118, homeAngle, 57, 458);
  const away = placed(tagIndex ? 49 : 52, tagIndex ? 221 : 224, tagAngle, 100, 442);
  const t = ease(compare);
  c.save();
  c.translate(home[0] + (away[0] - home[0]) * t, home[1] + (away[1] - home[1]) * t - 52 * Math.sin(t * Math.PI));
  c.rotate(homeAngle * (1-t) + tagAngle * t + 0.05 * Math.sin(t * Math.PI));
  if (amount < 1) {
    c.beginPath();
    c.rect(-8, -8, 700, 240);
    c.clip();
    c.translate(0, 240 * (1-ease(amount)));
  }
  lift(c, () => polygon(c, [[0,0],[669,0],[669,203],[645,226],[0,226]]), '#efb4a9', 8 + 12*Math.sin(t*Math.PI), 4 + 8*Math.sin(t*Math.PI));
  fingerprint(c, inquiries[0].fingerprint.receipt, 28, 6, true);
  line(c, 26, 78, 642, 78, '#bd8d83');
  type(c, 'Reviewed and supported', 25, 129, 36, 'Sans', ink, 600);
  type(c, 'Specialist required?', 24, 192, 52, 'Serif', ink);
  c.restore();
}

function handbook(c, opened, slip, highlights, cited) {
  c.save();
  c.translate(1040, 118);
  c.rotate(0.022);
  lift(c, () => { c.beginPath(); c.roundRect(-15, -5, 830, 836, 13); }, '#234478', 24, 20);
  rect(c, 3, 9, 805, 804, '#cabe9d');
  for (let i = 0; i < 5; i++) line(c, 8, 803+i*2, 804, 803+i*2, '#eee1c1', 1);
  rect(c, 0, 0, 794, 800, gradient(c, 0,0,755,800, [[0,'#fffbea'],[0.7,'#fff7dd'],[1,'#e8dbbc']]));
  policyText(c, highlights, cited);
  if (slip > 0) {
    line(c, 59, 697, 730, 697, '#a99b7c', 3);
    line(c, 61, 702, 729, 702, '#fffae5', 4);
  }
  // The top-bound cover foreshortens toward the rings, then folds behind the pages.
  if (opened < 1) {
    const scale = Math.cos(ease(opened) * Math.PI / 2);
    c.save();
    c.scale(1, Math.max(0.002, scale));
    drawCover(c);
    rect(c, 0, 0, 794, 800, 'rgba(10,24,42,' + ((1-scale)*0.14) + ')');
    c.restore();
  }
  for (const x of [96, 695]) {
    circle(c, x, 47, 16, '#292f3d');
    c.beginPath();
    c.moveTo(x, 46);
    c.bezierCurveTo(x-4, 6, x-5, -66, x+18, -58);
    c.bezierCurveTo(x+35, -51, x+27, -14, x+25, -4);
    c.lineCap = 'round';
    c.lineWidth = 12;
    c.strokeStyle = '#333b4b';
    c.stroke();
    c.translate(-2, 0);
    c.lineWidth = 4;
    c.strokeStyle = '#cfccd0';
    c.stroke();
    c.translate(2, 0);
  }
  c.restore();
}

function draw(c, clock) {
  const {index, elapsed} = clock;
  const cue = (beat, phrase, span) => index > beat ? 1 : index < beat ? 0 : clock.reveal(phrase, span);
  const open = cue(1, 'searches', 1.05);
  const slip = cue(2, 'look under', 1.1);
  const print = cue(2, 'look under', 0.65);
  const firstMark = cue(3, 'They match', 0.55);
  const revised = cue(4, 'The clerk', 1.12);
  const highlight = cue(4, 'Watch the handbook', 0.6);
  const underline = cue(4, 'Could a temperature check', 0.7);
  const secondMark = cue(6, 'Here comes', 0.65);
  const separate = ease(cue(7, 'Keep both tags', 1.2));
  const firstCompare = cue(3, 'Bring the pink copy', 1.25) * (1 - cue(3, 'They match', 1.15));
  const secondCompare = cue(5, 'Try the pink copy', 1.25) * (1 - cue(6, 'Here comes', 1.15));
  const compare = Math.max(firstCompare, secondCompare);

  // A move in over the desk lets the viewer read both impressions at the seam.
  c.save();
  const close = ease(compare);
  c.translate(399 * close, -341 * close);
  c.scale(1 + 0.5 * close, 1 + 0.5 * close);
  desk(c);
  // The tag swings around its cord as the parcel comes to rest.
  const time = index === 0 ? elapsed : 10;
  const slide = ease(time / 1.35);
  const swing = 0.085 * Math.exp(-1.55 * time) * Math.sin(6.5 * time);
  c.save();
  c.translate(-375 * (1-slide), -65 * (1-slide));
  parcel(c);
  tag(c, 0, -0.034 + swing + 0.015 * separate, 52, 224 + 100 * separate, firstMark, print, 0);
  if (revised > 0) {
    const r = ease(revised);
    tag(c, 1, -0.031 - 0.13 * (1-r), 49 - 980 * (1-r), 221 - 14 * separate - 110 * (1-r),
      secondMark, 1, underline);
  }
  c.restore();

  handbook(c, open, slip, highlight, firstMark * (1 - revised));
  editorCopy(c, slip, compare, revised === 1 ? 1 : 0);
  c.restore();
}

function check() {
  const [original, followup] = inquiries;
  for (const [i, inquiry] of inquiries.entries()) {
    assert.equal(rows[i].join(' '), inquiry.question);
    assert.deepEqual(inquiry.hits, ['specialist', 'review', 'hazardous', 'parcels']);
    assert.equal(inquiry.reply.protocolMatches, true);
    assert.equal(inquiry.fingerprint.receipt, original.fingerprint.current);
  }
  assert.equal(passageLines.join(' '), SHIPPING_PASSAGE.text);
  assert.equal(original.reply.decisionReason, 'bound_entailed_review');
  assert.equal(original.fingerprint.matches, true);
  const [start, end] = original.reply.citations[0].span;
  assert.equal(SHIPPING_PASSAGE.text.slice(start, end), original.reply.answer);
  assert.equal(original.reply.citations.length, 1);
  assert.equal(original.reply.citations[0].documentId, SHIPPING_PASSAGE.documentId);
  assert.equal(followup.reply.decisionReason, 'review_binding_rejected');
  assert.equal(followup.fingerprint.matches, false);
  assert.equal(followup.reply.expected.chunkTextSha256, original.reply.expected.chunkTextSha256);
  assert.deepEqual(followup.reply.citations, []);
  assert.notEqual(original.fingerprint.current.slice(0, 8), followup.fingerprint.current.slice(0, 8));
}

export default { title: 'Two questions on one parcel', beats, draw, check };
