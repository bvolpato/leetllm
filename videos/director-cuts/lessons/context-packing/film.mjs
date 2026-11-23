import assert from 'node:assert/strict';
import {
  approval,
  exchanges,
  limit,
  mandatory,
  output,
} from '../../../films/context-packing/fixtures.mjs';
import { pack, verifyNote } from '../../../films/context-packing/model.mjs';

const [newest, middle, oldest] = exchanges;
const decision = approval.approved ? 'Rollback approved.' : 'Rollback declined.';
const byline = approval.actor[0].toUpperCase() + approval.actor.slice(1);
const draft = { approved: approval.approved, source: approval.source };
const checked = { ...draft, actor: approval.actor };
const excerpt = { id: approval.source, units: 4, fields: checked };
const recent = pack(exchanges);
const revised = pack([excerpt, ...exchanges]);
const historySpace = limit - mandatory - output;
const historyCost = (p) => p.input - mandatory;
const question = 'Who approved the rollback?';

const beats = [
  {
    id: 'past-the-cut',
    say: 'Who approved the rollback? Watch the request fill with the most recent messages. Where did the approval go?',
    hold: 1.25,
  },
  {
    id: 'the-two-copies',
    say: 'There it is in the incident log. On the right, the two newest exchanges made the cut. Each answer stays with its question.',
    hold: 0.75,
  },
  {
    id: 'space-for-a-reply',
    say: 'A packer counts the formatted messages in tokens. Here we give each part a size in a thirty-two-unit window. The instructions and current question take eight. Save eight for the reply. That leaves sixteen for history.',
    hold: 0.8,
  },
  {
    id: 'two-left',
    say: 'The two recent exchanges use fourteen between them. See the gap? Two units. The exchange with the approval would need twelve. What part of it does our question actually need?',
    hold: 1.2,
  },
  {
    id: 'lift-the-line',
    say: 'Take a copy of the decision and keep its source, D one. Read the copy on its own. You can tell what happened. Who signed off?',
    hold: 1.35,
  },
  {
    id: 'the-byline',
    say: 'Look one line higher in the log. The incident lead wrote those words. Bring the name across too. Check the name and the decision against the original entry.',
    hold: 1.0,
  },
  {
    id: 'pack-the-excerpt',
    say: 'Give the checked note its four units first. The newest exchange still fits beside it. The middle exchange needs eight, and only six are free.',
    hold: 0.85,
  },
  {
    id: 'ready-to-send',
    say: 'Read the request on its own. The incident lead approved the rollback. If we need the full exchange, we can look up D one in the log.',
    hold: 2.65,
  },
];

function check() {
  assert.deepEqual(recent.kept, [newest, middle]);
  assert.deepEqual(recent.dropped, [oldest]);
  assert.equal(historySpace, 16);
  assert.equal(historyCost(recent), 14);
  assert.equal(recent.remaining, 2);
  assert.equal(oldest.units, 12);
  assert.equal(verifyNote(draft), false);
  assert.equal(verifyNote(checked), true);
  assert.equal(verifyNote({ ...checked, actor: 'engineer' }), false);
  assert.equal(verifyNote({ ...checked, source: 'D2' }), false);
  assert.deepEqual(revised.kept, [excerpt, newest]);
  assert.equal(revised.total, 26);
  assert.equal(revised.remaining, 6);
  assert.ok(middle.units > revised.remaining);
  assert.equal(revised.output, 8);
}

const ink = '#222942';
const blue = '#263f83';
const slate = '#52617d';
const red = '#9d361f';
const coral = '#ff9d78';
const chalk = '#fffdf7';
const desk = '#bac8e1';
const unit = 54;
const ledgerX = (n) => (1920 - unit * limit) / 2 + unit * n;
const clamp = (n) => Math.max(0, Math.min(1, n));
function ease(n) {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
}
const mix = (a, b, t) => a + (b - a) * t;
function label(ctx, str, x, y, size, options = {}) {
  const { color = ink, face = 'Sans', weight = 400, align = 'left' } = options;
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}
function line(ctx, x, y, x2, y2, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function dot(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function upper(ctx, str, x, y, color = slate) {
  label(ctx, str, x, y, 27, { face: 'Mono', color });
}
function stage(ctx) {
  const wash = ctx.createLinearGradient(150, 0, 1560, 1080);
  wash.addColorStop(0, '#dbe2f0');
  wash.addColorStop(0.54, '#c2cee4');
  wash.addColorStop(1, '#acbbd6');
  rect(ctx, 0, 0, 1920, 1080, wash);
}
function archive(ctx, selectLine, selectActor) {
  ctx.save();
  ctx.translate(106, 125);
  ctx.rotate(-0.028);
  const w = 665;
  const h = 619;
  // The archive is a retained fanfold log. A copy can leave this page.
  for (let i = 3; i > 0; i--) {
    rect(ctx, -i * 3, i * 5, w, h, i % 2 ? '#c7bcb7' : '#e3dcd5');
  }
  ctx.shadowColor = '#26395738';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 10;
  rect(ctx, 0, 0, w, h, '#fff4e6');
  ctx.shadowColor = 'transparent';
  const wash = ctx.createLinearGradient(0, 0, w, h);
  wash.addColorStop(0, '#fff9ec');
  wash.addColorStop(0.67, '#f6e6d8');
  wash.addColorStop(1, '#fff6e9');
  rect(ctx, 0, 0, w, h, wash);
  line(ctx, 43, 0, 43, h, '#ccbeb5');
  for (let y = 21; y < h; y += 47) {
    dot(ctx, 20, y, 8, '#b4b5c2');
    dot(ctx, 20, y + 1.5, 6, desk);
  }
  upper(ctx, 'ARCHIVED EXCHANGE', 72, 64);
  label(ctx, 'Incident log', 70, 143, 76, { face: 'Serif' });
  rect(ctx, w - 99, 0, 99, 83, coral);
  label(ctx, approval.source, w - 50, 55, 38, { face: 'Mono', color: ink, align: 'center' });
  line(ctx, 72, 174, w - 42, 174, '#b3a79e');
  label(ctx, 'Engineer', 74, 247, 33, { weight: 600, color: slate });
  label(ctx, 'Roll back the release?', 74, 310, 51, { face: 'Serif' });
  line(ctx, 72, 351, w - 42, 351, '#d1c4b9');
  highlight(ctx, 68, 376, 274, 54, selectActor);
  label(ctx, byline, 74, 417, 38, { weight: 600, color: red });
  highlight(ctx, 68, 449, 498, 70, selectLine);
  label(ctx, decision, 74, 505, 57, { face: 'Serif' });
  ctx.setLineDash([9, 9]);
  line(ctx, 1, 547, w - 1, 547, '#c8bbb6');
  ctx.setLineDash([]);
  label(ctx, 'Full exchange  /  ' + oldest.units + ' units', 73, 592, 30, {
    face: 'Mono',
    color: slate,
  });
  ctx.restore();
}
function highlight(ctx, x, y, w, h, progress) {
  if (progress <= 0) return;
  ctx.fillStyle = '#ffb68b';
  ctx.beginPath();
  const end = x + w * progress;
  ctx.moveTo(x + 3, y + 3);
  ctx.lineTo(end, y);
  ctx.lineTo(end - 3, y + h - 3);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
}

const requestX = 843,
  requestY = 78,
  requestW = 974,
  requestH = 680;
const left = requestX + 60;
const right = requestX + requestW - 60;
function requestPage(ctx) {
  ctx.shadowColor = '#14244235';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 12;
  rect(ctx, requestX, requestY, requestW, requestH, chalk);
  ctx.shadowColor = 'transparent';
  rect(ctx, requestX, requestY, requestW, 10, blue);
  upper(ctx, 'NEXT MODEL REQUEST', left, 146, blue);
  label(ctx, question, left, 244, 61, { face: 'Serif' });
  line(ctx, left, 293, right, 293, '#bfc4c8');
}
const middleText = ['Which build?', 'Build 42.'];
const newestText = ['Errors now?', 'None.'];
function exchangeRow(ctx, y, id, words, units, color = blue, bracketFocus = 0) {
  upper(ctx, id, left, y, color);
  label(ctx, units + ' units', right, y, 27, { face: 'Mono', color: slate, align: 'right' });
  // A single elbow joins the answer to its question.
  label(ctx, words[0], left, y + 57, 46, { face: 'Serif' });
  const bracket = bracketFocus > 0 ? blue : '#8c9ab0';
  line(ctx, left + 8, y + 76, left + 8, y + 103, bracket, 3 + 4 * bracketFocus);
  line(ctx, left + 8, y + 103, left + 34, y + 103, bracket, 3 + 4 * bracketFocus);
  label(ctx, words[1], left + 49, y + 115, 39, { face: 'Sans' });
}
function transcript(ctx, removal, middleExit = 0, bracketFocus = 0) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(left - 12, 319, right - left + 24, 402);
  ctx.clip();
  const peel = ease((removal - 0.13) / 0.49);
  const rise = 199 * ease((removal - 0.55) / 0.45);
  if (peel < 1) {
    ctx.save();
    ctx.translate(-900 * peel, -8 * Math.sin(Math.PI * peel));
    rect(ctx, left - 8, 321, right - left + 16, 177, '#ffdbc4');
    exchangeRow(
      ctx,
      363,
      'OLDEST  /  ' + approval.source,
      ['Roll back the release?', byline + ': ' + decision],
      oldest.units,
      red,
    );
    const corner = mix(14, 53, ease(removal * 4));
    ctx.fillStyle = '#eda27b';
    ctx.beginPath();
    ctx.moveTo(right + 8, 498 - corner);
    ctx.lineTo(right + 8, 498);
    ctx.lineTo(right + 8 - corner, 498);
    ctx.fill();
    ctx.restore();
  }
  ctx.save();
  ctx.globalAlpha *= 1 - middleExit;
  ctx.translate(90 * middleExit, 0);
  if (middleExit < 1)
    exchangeRow(ctx, 562 - rise, 'MIDDLE', middleText, middle.units, blue, bracketFocus);
  ctx.restore();
  line(ctx, left, 713 - rise, right, 713 - rise, '#d3d7da');
  exchangeRow(ctx, 761 - rise, 'NEWEST', newestText, newest.units, blue, bracketFocus);
  ctx.restore();
}
function noteBody(ctx, x, y, scale, actor, heading, opacity = 1) {
  ctx.save();
  ctx.globalAlpha *= opacity;
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  rect(ctx, 0, 0, 800, 217, '#ffdbc4');
  rect(ctx, 0, 0, 10, 217, '#c95835');
  upper(ctx, heading, 30, 44, red);
  label(ctx, approval.source, 762, 44, 33, { face: 'Mono', align: 'right', color: red });
  line(ctx, 30, 60, 769, 60, '#dba791');
  line(ctx, 32, 127, 299, 127, '#b7816c', 2);
  if (actor > 0) {
    ctx.save();
    ctx.globalAlpha *= actor;
    label(ctx, byline, 32, 118, 38, { weight: 600, color: ink });
    ctx.restore();
  }
  label(ctx, decision, 30, 190, 57, { face: 'Serif' });
  ctx.restore();
}
function drawCells(ctx, start, count, fill, opacity = 1) {
  ctx.save();
  ctx.globalAlpha *= opacity;
  for (let i = 0; i < count; i++) {
    const x = ledgerX(start + i);
    rect(ctx, x + 2, 853, unit - 4, 33, fill);
  }
  ctx.restore();
}
function ledger(ctx, clock, phase, visibility) {
  const { index, elapsed, reveal } = clock;
  const appear = index === 2 ? ease(elapsed / 0.65) : 1;
  if (index < 2 || visibility <= 0) return;
  ctx.save();
  ctx.globalAlpha *= appear * visibility;
  const group = index === 2 ? ease(reveal('The instructions', 0.55)) : 1;
  const reserve = index === 2 ? ease(reveal('Save eight', 0.55)) : 1;
  const history = index === 2 ? ease(reveal('That leaves', 0.6)) : 1;
  const packed = index >= 4 ? 1 : index === 3 ? ease(elapsed / 0.9) : 0;
  const mid = 1 - phase;
  const outStart = limit - output;
  drawCells(ctx, 0, limit, '#e2e7ef');
  drawCells(ctx, 0, mandatory, blue, group);
  drawCells(ctx, outStart, output, '#7383a0', reserve);
  drawCells(ctx, mandatory, newest.units, '#43819a', packed);
  drawCells(ctx, mandatory + newest.units, middle.units, '#606fa0', packed * mid);
  drawCells(ctx, mandatory + newest.units, excerpt.units, coral, phase);
  // Hatching identifies reserved output even while the input selection changes.
  ctx.save();
  ctx.globalAlpha *= reserve;
  for (let i = outStart; i < limit; i++) {
    for (let j = 0; j < 3; j++)
      line(ctx, ledgerX(i) + 5 + j * 13, 879, ledgerX(i) + 18 + j * 13, 858, '#c5d0de', 2);
  }
  ctx.restore();
  label(ctx, 'Example window  /  ' + limit + ' units', ledgerX(0), 824, 34, {
    face: 'Mono',
    color: ink,
  });
  const histLabel =
    packed > 0.99 && (phase === 0 || phase === 1)
      ? 'History  ' + historyCost(phase === 1 ? revised : recent) + ' / ' + historySpace
      : 'History  ' + historySpace;
  const foot = (str, from, to, alpha) => {
    ctx.save();
    ctx.globalAlpha *= alpha;
    label(ctx, str, (ledgerX(from) + ledgerX(to)) / 2, 938, 32, { weight: 600, align: 'center' });
    ctx.restore();
  };
  foot('Instructions + question', 0, mandatory, group);
  foot(histLabel, mandatory, outStart, history);
  foot('Reply reserve  ' + output, outStart, limit, reserve);
  for (const x of [mandatory, outStart]) line(ctx, ledgerX(x), 846, ledgerX(x), 894, ink, 2);
  if (index >= 3 && (phase === 0 || phase === 1)) {
    const p = phase === 1 ? revised : recent;
    const freeX = (ledgerX(outStart - p.remaining) + ledgerX(outStart)) / 2;
    const showFree = index === 3 ? ease(reveal('See the gap', 0.4)) : 1;
    ctx.save();
    ctx.globalAlpha *= showFree;
    label(ctx, p.remaining + ' free', freeX, 880, 26, {
      face: 'Mono',
      color: ink,
      align: 'center',
    });
    ctx.restore();
  }

  if (index === 3) {
    const probe = ease(reveal('The exchange with the approval', 0.75));
    ctx.globalAlpha *= probe;
    const a = ledgerX(outStart - oldest.units),
      b = ledgerX(outStart);
    line(ctx, a, 831, b, 831, red, 4);
    line(ctx, a, 831, a, 843, red, 4);
    line(ctx, b, 831, b, 843, red, 4);
    label(ctx, 'D1 needs ' + oldest.units, (a + b) / 2, 815, 32, {
      face: 'Mono',
      color: red,
      align: 'center',
    });
  }
  ctx.restore();
}
function frameDesk(ctx, zoom, x, y) {
  ctx.translate(960, 540);
  ctx.scale(zoom, zoom);
  ctx.translate(-x, -y);
}
function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  stage(ctx);
  ctx.save();
  const closeRequest =
    index === 0 ? 1 : index === 1 ? 1 - ease(elapsed / 1.4) : index === 7 ? ease(elapsed / 1.7) : 0;
  const closeExcerpt =
    index === 4
      ? ease(elapsed / 1.3)
      : index === 5
        ? 1
        : index === 6
          ? 1 - ease(elapsed / 1.35)
          : 0;
  frameDesk(
    ctx,
    1 + 0.62 * closeRequest + 0.19 * closeExcerpt,
    960 + 419 * closeRequest - 32 * closeExcerpt,
    540 - 130 * closeRequest - 91 * closeExcerpt,
  );
  const lifted = index < 4 ? 0 : index === 4 ? ease(elapsed / 0.65) : 1;
  const pull = index < 4 ? 0 : index === 4 ? ease(reveal('a copy', 1.25)) : 1;
  const actorMark = index < 5 ? 0 : index === 5 ? ease(elapsed / 0.65) : 1;
  const actorPull = index < 5 ? 0 : index === 5 ? ease(reveal('Bring the name', 1.15)) : 1;
  const send = index < 6 ? 0 : index === 6 ? ease(reveal('Give the checked note', 0.95)) : 1;
  archive(ctx, lifted, actorMark);
  requestPage(ctx);
  const removal = index === 0 ? ease(elapsed / 5.3) : 1;
  const pairs = index === 1 ? ease(reveal('Each answer', 0.65)) : 0;
  // The loose copy is a draft. The history behind it is unchanged until repacking.
  transcript(ctx, removal, index >= 6 ? 1 : 0, pairs);
  if (index >= 4) {
    const focus = index === 4 ? ease(elapsed / 0.5) : 1;
    ctx.save();
    ctx.globalAlpha *= focus * (1 - send);
    rect(ctx, left - 8, 313, right - left + 16, 416, chalk);
    ctx.globalAlpha *= 1 - ease(send * 3);
    upper(ctx, 'COMPACTION DRAFT', left, 367);
    ctx.restore();
    if (pull > 0) {
      const x = mix(211, left + 14, pull) - 12 * send;
      const y = mix(471, 423, pull) - 63 * Math.sin(Math.PI * pull) - 106 * send;
      const heading =
        index >= 6 ? 'CHECKED NOTE  /  ' + excerpt.units + ' UNITS' : 'SOURCE EXCERPT';
      noteBody(ctx, x, y, mix(0.59, 1, pull) - 0.1 * send, actorPull >= 1 ? 1 : 0, heading, pull);
    }
    if (actorPull > 0 && actorPull < 1) {
      const x = mix(190, left + 46, actorPull);
      const y = mix(536, 541, actorPull) - 126 * Math.sin(Math.PI * actorPull);
      ctx.save();
      ctx.shadowColor = '#45303926';
      ctx.shadowBlur = 12;
      rect(ctx, x - 6, y - 42, 280, 54, '#ffc59f');
      ctx.shadowColor = 'transparent';
      label(ctx, byline, x, y, 38, { weight: 600 });
      ctx.restore();
    }
  }
  ledger(ctx, clock, send, 1 - Math.max(closeRequest, closeExcerpt));
  ctx.restore();
}

export default { title: 'Who approved the rollback?', beats, draw, check };
