// The guide and the migration planner share a view. The selected span changes first.
const policy = {
  id: 'policy@2',
  text: 'Parser-v2 SDK migrations must start within 30 days after the deprecation notice.',
};
const exception = {
  id: 'exception@1',
  text: 'Service-account SDK migrations may start within 60 days after the notice only with security approval.',
};
const proposedDay = 45;
const cut = exception.text.indexOf(' only');
const daysIn = (passage) => Number(passage.text.match(/within (\d+) days/u)[1]);
const ordinaryDays = daysIn(policy);
const extendedDays = daysIn(exception);

function quote(source, end = source.text.length) {
  return { id: source.id, start: 0, end, text: source.text.slice(0, end) };
}

// This small publisher quotes whole passages from the current, permitted guide.
function decide(pack, approved, day = proposedDay) {
  const complete = [policy, exception].every((source) =>
    pack.some((part) => part.id === source.id && part.start === 0 &&
      part.end === source.text.length && part.text === source.text));
  if (!complete) return { held: true, limit: null, fits: null };
  const limit = approved ? extendedDays : ordinaryDays;
  return { held: false, limit, fits: day <= limit };
}

const beats = [
  {
    id: 'the-proposed-start',
    say: 'Day forty-five. That’s when our developer wants to start a service-account migration. She asks the search assistant if she can wait that long. Look at the quote it found.',
    hold: 0.8,
  },
  {
    id: 'where-the-quote-stops',
    say: 'Follow the blue selection. It reaches sixty days and goes all the way to “after the notice.” Every word matches the current guide. Where did the quote stop?',
    hold: 1.1,
  },
  {
    id: 'four-more-words',
    say: 'Read one line further. Only with security approval. If the assistant tells her yes from the blue words alone, it gives her extra time before anyone has approved it.',
    hold: 0.8,
  },
  {
    id: 'the-two-passages',
    say: 'There’s a general rule in the guide, too. Migrations must start within thirty days of the notice. To answer this question, our search assistant requires a complete quote from each of these two short passages.',
    hold: 0.65,
  },
  {
    id: 'take-the-condition',
    say: 'Keep the general rule. Pull the end of the exception down through the period. Now the model gets the words that put a condition on those sixty days.',
    hold: 0.9,
  },
  {
    id: 'pending-approval',
    say: 'Look at the planned date again. Security approval is still pending. The ordinary window ends here, on day thirty. Starting on day forty-five would be too late.',
    hold: 1.15,
  },
  {
    id: 'the-same-date',
    say: 'Keep your eye on forty-five. Her approval just came through. The exception gives her account sixty days. She can keep her start date.',
    hold: 2.6,
  },
];

const sourceLines = [
  'Service-account SDK migrations',
  'may start within 60 days',
  'after the notice',
  'only with security approval.',
];
const policyLines = [
  'Parser-v2 SDK migrations must start',
  'within 30 days after the deprecation notice.',
];
const clamp = (v) => Math.max(0, Math.min(1, v));
function ease(v) {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
}
const mix = (a, b, t) => a + (b - a) * t;

function type(ctx, value, x, y, size, color, face = 'Sans', weight = 400, align = 'left') {
  ctx.font = `${weight} ${size}px "Lesson ${face}"`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
}
function box(ctx, x, y, w, h, radius, fill) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
}
function line(ctx, x, y, u, v, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(u, v);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

const ink = '#201e46';
const blue = '#354ac2';
const gold = '#fff29a';
const digitRows = {
  4: ['00011', '00111', '01111', '11011', '11111', '00011', '00011'],
  5: ['11111', '11000', '11000', '11110', '00011', '00011', '11110'],
};

// The large date and the outlined calendar cell stay fixed through both decisions.
function datePixels(ctx) {
  const digits = String(proposedDay);
  const pitch = 29;
  const x0 = 367 - ((digits.length * 6 - 1) * pitch) / 2;
  for (let pos = 0; pos < digits.length; pos++) {
    digitRows[digits[pos]].forEach((row, y) => {
      Array.from(row).forEach((lit, x) => {
        const left = x0 + (pos * 6 + x) * pitch;
        const top = 223 + y * pitch;
        box(ctx, left, top + 3, 26, 25, 3, lit === '1' ? '#211879' : '#3e3aac');
        box(ctx, left, top, 26, 23, 3, lit === '1' ? gold : '#4544b4');
        if (lit === '1') line(ctx, left + 3, top + 1, left + 23, top + 1, '#fffbd6', 2);
      });
    });
  }
}

function planner(ctx, clock, decision, approval, focus) {
  const width = mix(738, 1920, focus);
  const wash = ctx.createLinearGradient(0, 50, 720, 980);
  wash.addColorStop(0, '#383cae');
  wash.addColorStop(0.56, '#3d39ae');
  wash.addColorStop(1, '#29247f');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, 1080);
  line(ctx, 70, 130, width - 78, 130, '#7679db');
  type(ctx, 'Service-account migration', 70, 101, 42, '#fbfaff', 'Sans', 600);
  type(ctx, 'Proposed start', 367, mix(191, 241, focus), 35 + 8 * focus, '#f0ebff', 'Sans', 400, 'center');
  ctx.save();
  ctx.translate(367, 300 + 102 * focus);
  ctx.scale(1 + 0.36 * focus, 1 + 0.36 * focus);
  ctx.translate(-367, -300);
  datePixels(ctx);
  ctx.restore();
  type(ctx, 'days after notice', 367, mix(478, 644, focus), 41 + 12 * focus, '#ffffff', 'Serif', 400, 'center');

  const columns = 10;
  const cellW = 57;
  const cellH = 49;
  const scan = clock.index === 5 ? ordinaryDays * ease((clock.elapsed - 0.9) / 0.95)
    : clock.index > 5 ? mix(ordinaryDays, extendedDays, approval) : 0;
  if (focus > 0.7) {
    ctx.save();
    ctx.globalAlpha = (focus - 0.7) / 0.3;
    type(ctx, `Start within ${decision.limit} days`, 820, 230, 56, '#fffef6', 'Serif');
    ctx.restore();
  }
  ctx.save();
  ctx.translate(mix(83, 820, focus), mix(530, 278, focus));
  ctx.scale(1 + 0.74 * focus, 1 + 0.74 * focus);
  for (let day = 1; day <= extendedDays; day++) {
    const x = ((day - 1) % columns) * cellW;
    const y = Math.floor((day - 1) / columns) * cellH;
    const inWindow = decision.limit !== null && day <= decision.limit && day <= Math.round(scan);
    const fill = inWindow ? (day <= ordinaryDays ? '#dbdafa' : gold) : '#353096';
    box(ctx, x, y, cellW - 4, cellH - 4, 4, fill);
    type(ctx, String(day), x + (cellW - 4) / 2, y + 33, 27,
      inWindow ? '#211e58' : '#b8b8ed', 'Mono', 400, 'center');
    if (day === proposedDay) {
      ctx.beginPath();
      ctx.ellipse(x + (cellW - 4) / 2, y + (cellH - 4) / 2, 24, 19, -0.12, 0, Math.PI * 2);
      ctx.strokeStyle = inWindow ? '#292080' : gold;
      ctx.lineWidth = 3.5;
      ctx.stroke();
    }
  }
  ctx.restore();
  let status = 'Checking the quote';
  if (clock.index === 2 || clock.index === 3 || (clock.index === 4 && decision.held))
    status = 'Answer on hold';
  if (!decision.held) status = 'Both passages complete';
  if (clock.index >= 5) status = decision.fits ? 'Security approved' : 'Approval pending';
  const live = clock.index >= 5 && decision.fits;
  ctx.save();
  ctx.translate(0, -90 * focus);
  if (live) {
    ctx.strokeStyle = gold;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(86, 881);
    ctx.lineTo(94, 890);
    ctx.lineTo(113, 868);
    ctx.stroke();
  } else {
    ctx.strokeStyle = '#d2cef6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(99, 879, 12, 0, 2 * Math.PI);
    ctx.stroke();
    line(ctx, 99, 870, 99, 880, '#e7e5ff', 2);
    line(ctx, 99, 880, 107, 883, '#e7e5ff', 2);
  }
  type(ctx, status, 133, 893, 36, live ? gold : '#f9f7ff', 'Sans', 600);
  ctx.restore();
  if (focus > 0.75) {
    ctx.save();
    ctx.globalAlpha = (focus - 0.75) / 0.25;
    type(ctx, '“' + exception.text.slice(cut).trim() + '”', 84, 873, 42, '#faf5cd', 'Serif');
    ctx.restore();
  }
}

// Draw a closing quotation mark into the selection handle itself.
function handle(ctx, x, baseline) {
  const y = baseline - 53;
  line(ctx, x, y - 3, x, baseline + 15, '#2332a6', 5);
  ctx.save();
  ctx.translate(x, baseline + 2);
  ctx.fillStyle = '#272294';
  ctx.beginPath();
  ctx.moveTo(0, 7);
  ctx.lineTo(0, -29);
  ctx.quadraticCurveTo(0, -37, 8, -37);
  ctx.lineTo(48, -37);
  ctx.quadraticCurveTo(57, -37, 57, -28);
  ctx.lineTo(57, -10);
  ctx.quadraticCurveTo(57, -1, 48, -1);
  ctx.lineTo(10, -1);
  ctx.closePath();
  ctx.fill();
  type(ctx, '”', 26, 7, 54, '#ffffff', 'Serif', 400, 'center');
  ctx.restore();
}

const textX = 828;
const firstBaseline = 331;
const linePitch = 81;
function drawException(ctx, end, attention) {
  type(ctx, 'Service-account exception', textX, 211, 45, ink, 'Sans', 600);
  type(ctx, 'rev 1', 1810, 209, 31, '#625d77', 'Mono', 400, 'right');
  const size = 59;
  let start = 0;
  let tip = null;
  sourceLines.forEach((row, i) => {
    const y = firstBaseline + i * linePitch;
    ctx.font = `400 ${size}px "Lesson Serif"`;
    const prefix = row.slice(0, Math.max(0, end - start));
    const w = ctx.measureText(prefix).width;
    const full = ctx.measureText(row).width;
    if (prefix.length) {
      const grad = ctx.createLinearGradient(textX, y, textX + full, y);
      grad.addColorStop(0, '#3046aa');
      grad.addColorStop(1, '#4055bf');
      ctx.fillStyle = grad;
      ctx.fillRect(textX - 7, y - 57, w + 14, 74);
    }
    type(ctx, row, textX, y, size, ink, 'Serif');
    if (prefix.length) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(textX - 9, y - 64, w + 10, 88);
      ctx.clip();
      type(ctx, row, textX, y, size, '#fffef5', 'Serif');
      ctx.restore();
    }
    if (i === 3 && attention > 0) {
      line(ctx, textX, y + 23, textX + full * attention, y + 23, '#b75a38', 5);
    }
    if (end >= start && end <= start + row.length)
      tip = { x: textX + w + 7, y };
    start += row.length + 1;
  });
  if (tip) handle(ctx, tip.x, tip.y);
}

function drawPolicy(ctx, amount) {
  if (!amount) return;
  ctx.save();
  ctx.globalAlpha = amount;
  ctx.translate(0, (1 - amount) * 28);
  line(ctx, textX, 674, 1810, 674, '#bdb9ce');
  type(ctx, 'General policy', textX, 733, 42, ink, 'Sans', 600);
  type(ctx, 'rev 2', 1810, 733, 31, '#625d77', 'Mono', 400, 'right');
  for (const [i, row] of policyLines.entries())
    type(ctx, row, textX, 808 + 58 * i, 46, ink, 'Serif');
  ctx.restore();
}

function draw(ctx, clock) {
  const { index, elapsed } = clock;
  const extend = index === 4 ? ease(clock.reveal('Pull the end', 1.45)) : Number(index > 4);
  const openingEnd = exception.text.indexOf('60 days');
  const clippedEnd = Math.round(mix(openingEnd, cut, ease(elapsed / 1.35)));
  const end = index === 0 ? clippedEnd : Math.round(mix(cut, exception.text.length, extend));
  const showRule = index === 3 ? ease(clock.reveal('a general rule', 0.65)) : Number(index > 3);
  const approval = index === 6 ? ease(clock.reveal('Keep your eye', 1.5)) : 0;
  const pack = [quote(exception, end)];
  if (showRule === 1) pack.push(quote(policy));
  const decision = decide(pack, approval > 0);
  const closer = index === 1 ? ease(clock.reveal('Follow the blue selection', 1.25))
    : index === 2 ? 1 : index === 3 ? 1 - ease(elapsed / 1.1) : 0;
  const zoom = mix(1, 1.64, closer);
  const attention = index === 1 ? ease(clock.reveal('Where did the quote stop', 0.85))
    : index === 2 || index === 3 ? 1 : index === 4 ? 1 - extend : 0;
  ctx.save();
  ctx.scale(zoom, zoom);
  ctx.translate(-752 * closer, -134 * closer);
  const light = ctx.createLinearGradient(750, 16, 1800, 1060);
  light.addColorStop(0, '#e8e5f3');
  light.addColorStop(0.38, '#faf8f4');
  light.addColorStop(1, '#efecf2');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 1930, 1090);
  const plannerFocus = index === 5 ? ease(clock.reveal('Look at the planned date', 1.3)) : Number(index > 5);
  planner(ctx, clock, decision, approval, plannerFocus);
  ctx.translate((1920 - 738) * plannerFocus, 0);
  const seam = ctx.createLinearGradient(738, 0, 765, 0);
  seam.addColorStop(0, '#26214844');
  seam.addColorStop(1, '#26214800');
  ctx.fillStyle = seam;
  ctx.fillRect(738, 0, 27, 1080);
  type(ctx, 'Parser-v2 migration guide', textX, 100, 40, '#494364', 'Serif');
  line(ctx, textX, 130, 1810, 130, '#ada8bf');
  drawException(ctx, end, attention);
  drawPolicy(ctx, showRule);
  ctx.restore();
}

function check() {
  function requireState(condition, message) {
    if (!condition) throw new Error(message);
  }
  requireState(sourceLines.join(' ') === exception.text && policyLines.join(' ') === policy.text,
    'The displayed words must reproduce the original passages.');
  const clipped = quote(exception, cut);
  requireState(clipped.end === 72 && exception.text.length === 101 &&
    clipped.text === exception.text.slice(0, 72) && exception.text.slice(cut).trim() === sourceLines[3],
    'The early selection must stop exactly before the approval condition.');
  requireState(decide([quote(policy), clipped], true).held &&
    decide([quote(exception)], false).held, 'Both complete passages are required.');
  const complete = [quote(policy), quote(exception)];
  const pending = decide(complete, false);
  const approved = decide(complete, true);
  requireState(pending.limit === 30 && pending.fits === false &&
    approved.limit === 60 && approved.fits === true, 'Approval changes whether day 45 fits.');
  requireState(decide(complete, false, 30).fits && decide(complete, true, 60).fits &&
    !decide(complete, true, 61).fits, 'The last day of each window is inclusive.');
  return true;
}

export default { title: 'Can We Start on Day 45?', beats, draw, check };
