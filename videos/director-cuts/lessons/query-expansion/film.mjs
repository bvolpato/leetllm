import assert from 'node:assert/strict';
import { CORPUS, REQUIRED_RUNBOOKS } from '../../../films/query-expansion/fixtures.mjs';
import {
  expandQueries,
  reciprocalRankFusion,
  runbookCoverage,
  search,
  terms,
} from '../../../films/query-expansion/model.mjs';

const title = 'Query expansion: The missing runbook page';
const beats = [
  {
    id: 'first-leaf',
    say: "Watch where that page lands. We're expecting a rush. How much can we burst? What if the waiting line fills up?",
    hold: 1.1,
  },
  {
    id: 'one-word',
    say: "See the word burst? This search looks for words in common. There's burst again at the foot of the policy page. Eight extra requests. What does that tell us about a full queue?",
    hold: 1.5,
  },
  {
    id: 'same-folio',
    say: "Let's give search another wording. Burst quota limit. Three words match this time. Look at the page number. We've fetched page twelve twice.",
    hold: 1.25,
  },
  {
    id: 'turn-the-other-leaf',
    say: "Try the other half of the question. A runbook might call a waiting line a queue. Its term for pushing back on callers might be backpressure. Search those two words together.",
    hold: 1.6,
  },
  {
    id: 'next-arrival',
    say: "Page thirty-one. There's the instruction we needed. When this service's queue fills, the next request gets turned away.",
    hold: 1.05,
  },
  {
    id: 'file-the-pair',
    say: "That's query expansion. We kept our first search and tried two more wordings against the same index. File each page once. Now each half of the question has a source.",
    hold: 2.65,
  },
];

// Search the course fixture's indexed terms. The leaves supply sample prose and folio numbers.
const queries = expandQueries('How much can we burst? What if the line fills up?', [
  'burst quota limit',
  'queue backpressure',
]);
const pages = CORPUS.filter((page) => page.tenant === 'support' && page.authorized);
const lookups = queries.map((query) => search(query, pages));
const leaves = {
  'burst-policy': { folio: 12, extra: 8, words: ['burst', 'quota', 'limit'] },
  'queue-guide': { folio: 31, onFull: 'Reject arrivals', words: ['queue', 'backpressure', 'overload'] },
};
const rankings = lookups.map((hits) => hits.map((hit) => hit.document.id));

function check() {
  assert.deepEqual(rankings, [['burst-policy'], ['burst-policy'], ['queue-guide']]);
  assert.deepEqual(lookups.map(([hit]) => hit.score), [1, 3, 2]);
  assert.deepEqual(rankings.flat().map((id) => leaves[id].folio), [12, 12, 31]);
  for (const n of [1, 2, 3]) {
    const merged = reciprocalRankFusion(rankings.slice(0, n)).map((row) => row.id);
    assert.deepEqual(merged, n < 3 ? ['burst-policy'] : REQUIRED_RUNBOOKS);
    assert.equal(runbookCoverage(merged).recall, n < 3 ? 0.5 : 1);
  }
  for (const { id, text } of pages.filter((page) => leaves[page.id])) {
    assert.ok(leaves[id].words.every((word) => terms(text).has(word)));
  }
}

const ink = '#222741';
const blue = '#233caa';
const blueInk = '#284cb7';
const vermilion = '#c14322';
const sheetW = 800;
const sheetH = 495;
const hingeY = 363;
const xLeft = 147;
const xRight = 973;
const clamp = (n) => Math.max(0, Math.min(1, n));
const smooth = (n) => { const t = clamp(n); return t * t * (3 - 2 * t); };

function lettering(ctx, value, x, y, size, family = 'Sans', color = ink, weight = 400) {
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.fillStyle = color;
  ctx.fillText(String(value), x, y);
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function rounded(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

// A ticket represents one request on both leaves.
function ticket(ctx, x, y, color, angle = 0, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(-42, -26);
  ctx.lineTo(42, -26);
  ctx.lineTo(42, -7);
  ctx.bezierCurveTo(33, -7, 33, 7, 42, 7);
  ctx.lineTo(42, 26);
  ctx.lineTo(-42, 26);
  ctx.lineTo(-42, 7);
  ctx.bezierCurveTo(-33, 7, -33, -7, -42, -7);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  line(ctx, -16, -5, 14, -5, '#fff3dc', 4);
  line(ctx, -16, 5, 2, 5, '#fff3dc', 4);
  ctx.restore();
}

function desk(ctx) {
  const light = ctx.createLinearGradient(80, 20, 1720, 1080);
  light.addColorStop(0, '#eee4dc');
  light.addColorStop(0.65, '#ded0c8');
  light.addColorStop(1, '#d1bcb6');
  rect(ctx, -160, -160, 2240, 1400, light);
}

function binder(ctx) {
  ctx.save();
  ctx.shadowColor = 'rgba(42,30,53,.32)';
  ctx.shadowBlur = 33;
  ctx.shadowOffsetX = 8;
  ctx.shadowOffsetY = 23;
  rounded(ctx, 104, 233, 1712, 660, 19, '#1c255a');
  ctx.restore();
  rounded(ctx, 104, 227, 1712, 660, 19, blue);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(104, 227, 1712, 660, 19);
  ctx.clip();
  for (let x = -600; x < 1850; x += 8) line(ctx, x, 227, x + 670, 887, '#ffffff0a', 1.3);
  for (let y = 233; y < 887; y += 7) line(ctx, 104, y, 1816, y, '#0a123a16', 1);
  ctx.restore();
  lettering(ctx, 'Burst allowance', xLeft + 36, 313, 53, 'Serif', '#fff5dd');
  lettering(ctx, 'When the line fills', xRight + 36, 313, 53, 'Serif', '#fff5dd');
  for (const x of [xLeft, xRight]) {
    for (let i = 4; i >= 0; i--) {
      rounded(ctx, x + i * 0.8, hingeY + i * 2.6, sheetW, sheetH, 4, i % 2 ? '#c8baaf' : '#f9f1dd');
    }
    rect(ctx, x + 14, hingeY + 12, sheetW - 28, sheetH - 28, '#e7e2dc');
    for (let cy = 55; cy < sheetH - 21; cy += 27) {
      for (let cx = 32; cx < sheetW - 20; cx += 27) rect(ctx, x + cx, hingeY + cy, 2.1, 2.1, '#a5a2b4');
    }
    ctx.save();
    ctx.textAlign = 'center';
    lettering(ctx, '?', x + sheetW / 2, hingeY + 274, 130, 'Serif', '#918e9e');
    lettering(ctx, 'Awaiting source', x + sheetW / 2, hingeY + 343, 39, 'Sans', '#64617a');
    ctx.restore();
  }
}

function rings(ctx, x) {
  for (let i = 0; i < 12; i++) {
    const px = x + 38 + i * 65.5;
    ellipse(ctx, px + 5, hingeY + 23, 8.5, 5, '#56515c');
    ellipse(ctx, px - 8, hingeY - 20, 7.5, 4, '#17256a');
    ctx.beginPath();
    ctx.moveTo(px - 8, hingeY - 21);
    ctx.bezierCurveTo(px - 27, hingeY - 34, px - 19, hingeY + 15, px + 5, hingeY + 22);
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1d2331';
    ctx.lineWidth = 6.5;
    ctx.stroke();
    ctx.strokeStyle = '#b8bdce';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function keywords(ctx, words, matched, accent, emphasis) {
  lettering(ctx, 'Index', 41, 453, 30, 'Sans', '#625f61');
  let x = 147;
  for (const word of words) {
    const active = matched.has(word);
    ctx.font = '36px "Lesson Mono"';
    const w = ctx.measureText(word).width;
    if (active && emphasis > 0) {
      ctx.save();
      ctx.globalAlpha = emphasis;
      rect(ctx, x - 7, 418, w + 14, 47, '#ffd58d');
      ctx.restore();
    }
    lettering(ctx, word, x, 455, 36, 'Mono', active ? accent : '#696663');
    if (active) line(ctx, x, 465, x + w, 465, accent, 4);
    x += w + 30;
  }
}

function burstDrawing(ctx, leaf) {
  // Keep two groups of four far enough apart to count in the printed figure.
  for (let i = 0; i < leaf.extra; i++) {
    const cx = 95 + (i % 4) * 130 + Math.floor(i / 4) * 55;
    const cy = 269 + Math.floor(i / 4) * 64;
    ticket(ctx, cx, cy, vermilion, -0.075);
  }
}

function queueDrawing(ctx, returnTrip) {
  const seats = [115, 218, 321, 424];
  line(ctx, 47, 250, 489, 250, '#898daa', 3);
  line(ctx, 47, 327, 489, 327, '#898daa', 3);
  for (const cx of seats) ticket(ctx, cx, 289, blueInk);
  const t = smooth(returnTrip);
  // The arrow starts at the queue entrance and returns to the arriving caller.
  const left = 501;
  ctx.beginPath();
  ctx.moveTo(674, 286);
  ctx.lineTo(left + 30, 286);
  ctx.bezierCurveTo(left - 18, 286, left - 17, 361, left + 36, 361);
  ctx.lineTo(703, 361);
  ctx.strokeStyle = '#85544c';
  ctx.lineWidth = 6;
  ctx.stroke();
  line(ctx, 703, 361, 685, 350, '#85544c', 6);
  line(ctx, 703, 361, 685, 372, '#85544c', 6);
  const swing = Math.PI * t;
  const x = 655 - 129 * Math.sin(swing);
  const y = 286 + 75 * (1 - Math.cos(swing)) / 2;
  ticket(ctx, x, y, vermilion, 0.075 * Math.sin(swing), 0.9);
}

function leaf(ctx, id, x, travel, matched, returnTrip = 0, emphasis = 0) {
  if (travel <= 0) return;
  const angle = smooth(travel) * Math.PI / 2;
  const opening = Math.sin(angle);
  const lift = Math.cos(angle);
  const data = leaves[id];
  const isBurst = id === 'burst-policy';
  const accent = isBurst ? vermilion : blueInk;
  ctx.save();
  ctx.translate(x, hingeY);
  ctx.transform(1, 0, -0.048 * lift, opening, 0, 0);
  ctx.shadowBlur = 2 + 17 * lift;
  ctx.shadowColor = 'rgba(30,25,41,.21)';
  ctx.shadowOffsetY = 4 + lift * 30;
  rounded(ctx, 0, 0, sheetW, sheetH, 4, '#fff8e9');
  ctx.shadowColor = 'transparent';
  rect(ctx, 0, 40, 11, 158, accent);
  lettering(ctx, id, 42, 90, 36, 'Mono', accent);
  lettering(ctx, data.folio, 660, 109, 77, 'Serif', accent);
  line(ctx, 41, 116, sheetW - 42, 116, '#cdbfac');
  if (isBurst) {
    lettering(ctx, data.extra + ' extra requests', 41, 202, 78, 'Serif');
    burstDrawing(ctx, data);
  } else {
    lettering(ctx, data.onFull, 41, 202, 78, 'Serif');
    queueDrawing(ctx, returnTrip);
  }
  line(ctx, 41, 405, sheetW - 42, 405, '#cdbfac');
  keywords(ctx, data.words, matched, accent, emphasis);
  const curl = ctx.createLinearGradient(0, 0, 0, sheetH);
  curl.addColorStop(0, '#4c393f20');
  curl.addColorStop(0.1, '#b6967c06');
  curl.addColorStop(0.65, 'rgba(255,255,255,' + (0.03 + lift * 0.24) + ')');
  curl.addColorStop(1, 'rgba(75,53,78,' + (0.025 + lift * 0.15) + ')');
  rect(ctx, 0, 0, sheetW, sheetH, curl);
  ctx.restore();
}

function pageReturns(ctx, delivered, filed) {
  if (!delivered) return;
  const ids = rankings.slice(0, delivered).flat();
  const unique = [...new Set(ids)];
  const right = 1798;
  const pitch = 100;
  const labelX = right - pitch * (ids.length - filed * (ids.length - unique.length)) - 22;
  ctx.save();
  ctx.textAlign = 'right';
  lettering(ctx, filed > 0.5 ? 'Filed' : 'Returned', labelX, 78, 36, 'Sans');
  ctx.restore();
  for (const [i, id] of ids.entries()) {
    const xStart = right - pitch * (ids.length - i);
    const xEnd = right - pitch * (unique.length - unique.indexOf(id));
    const x = xStart + filed * (xEnd - xStart);
    const y = 40 - (i === 1 ? Math.sin(Math.PI * filed) * 17 : 0);
    const accent = id === 'burst-policy' ? vermilion : blueInk;
    ctx.save();
    ctx.shadowBlur = 2;
    ctx.shadowOffsetY = 3;
    ctx.shadowColor = '#2a183540';
    rounded(ctx, x, y, 86, 50, 4, '#fff8e9');
    ctx.restore();
    rect(ctx, x, y + 4, 5, 42, accent);
    lettering(ctx, leaves[id].folio, x + 17, y + 39, 36, 'Mono', accent);
  }
}

function searchHeader(ctx, lookup, delivered, query, filed) {
  const hitWords = terms(lookups[lookup][0].document.text);
  const label = filed > 0.5 ? 'Original question' : 'Runbook search  /  ' + (lookup + 1);
  lettering(ctx, label, 132, 75, 38, 'Sans', ink, 600);
  pageReturns(ctx, delivered, filed);
  if (filed > 0) {
    ctx.save();
    ctx.globalAlpha = filed;
    const [first, last] = queries[0].split('? ');
    lettering(ctx, first + '?', xLeft + 28, 166, 61, 'Serif');
    lettering(ctx, last, xRight + 28, 166, 61, 'Serif');
    ctx.restore();
  }
  ctx.save();
  ctx.globalAlpha = 1 - filed;
  let x = 132;
  const accent = lookup === 2 ? blueInk : vermilion;
  for (const word of query.split(' ')) {
    const [token] = terms(word);
    const found = delivered > lookup && hitWords.has(token);
    lettering(ctx, word, x, 166, 61, 'Serif', found ? accent : ink);
    const w = ctx.measureText(word).width;
    if (found) line(ctx, x, 178, x + w, 178, accent, 3.5);
    x += w + ctx.measureText(' ').width;
  }
  ctx.restore();
}

function draw(ctx, clock) {
  const { index, elapsed, speechDuration, reveal } = clock;
  const first = index === 0 ? clamp(0.25 + elapsed / 2.35) : 1;
  const repeat = index < 2 ? 0 : index === 2 ? reveal('Burst quota limit', 1.25) : 1;
  const secondLeaf = index < 3 ? 0 : index === 3 ? reveal('Search those two words together', 1.15) : 1;
  const returning = index < 4 ? 0 : index === 4 ? reveal("There's the instruction", 2.25) : 1;
  const firstTerm = index === 3 && reveal('a queue') > 0;
  const secondTerm = index === 3 && reveal('backpressure') > 0;
  const lookup = firstTerm || secondLeaf > 0 ? 2 : repeat > 0 ? 1 : 0;
  const query = firstTerm && !secondTerm ? 'queue' : queries[lookup];
  const emphasis = index === 1 ? reveal('See the word burst', 0.7) * (1 - reveal('Eight extra requests', 0.8)) : 0;
  const filed = index === 5 ? smooth(reveal('File each page once', 1.6)) : 0;
  const delivered = Number(first > 0.75) + Number(repeat > 0.75) + Number(secondLeaf > 0.75);
  // Follow the last request to the entrance, then pull back to compare both sources.
  const close = index === 4
    ? smooth(elapsed / 1.55) * (1 - smooth((elapsed - speechDuration + 0.75) / 1.65))
    : 0;
  ctx.save();
  ctx.translate(960, 540);
  ctx.scale(1 + 0.68 * close, 1 + 0.68 * close);
  ctx.translate(-960 - 412 * close, -540 - 40 * close);
  desk(ctx);
  searchHeader(ctx, lookup, delivered, query, filed);
  binder(ctx);
  leaf(ctx, rankings[0][0], xLeft, first, terms(queries[0]), 0, emphasis);
  leaf(ctx, rankings[1][0], xLeft, repeat, terms(queries[1]));
  leaf(ctx, rankings[2][0], xRight, secondLeaf, terms(queries[2]), returning);
  rings(ctx, xLeft);
  rings(ctx, xRight);
  ctx.restore();
}

export default { title, beats, draw, check };
