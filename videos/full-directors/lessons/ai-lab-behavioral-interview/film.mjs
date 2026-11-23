import { lensPortrait, portrait } from './cast.mjs';
import {
  check,
  fields,
  friday,
  passed,
  failed,
  packets,
  record,
  gate,
  limit,
  latency,
  headroom,
  headroomFraction,
  requests,
  routing,
  sample,
  rank,
  earlyReviews,
  dev,
  incidentWindows,
  supportPermissions,
} from './release.mjs';

const C = {
  ink: '#322438',
  muted: '#695a60',
  paper: '#fff5dd',
  tan: '#dec5ad',
  red: '#a63548',
  green: '#28674f',
  blue: '#415b84',
  plum: '#594565',
  mint: '#bad8c4',
  coral: '#e79680',
  lilac: '#ccc1d6',
  gold: '#f3c27e',
};
function at(k, beat, words, span = 0) {
  if (k.beat.beatIndex !== beat) return Number(k.beat.beatIndex > beat);
  return k.reveal(words, span);
}
function through(k, beat, phrase, captionStart = false) {
  if (k.beat.beatIndex !== beat) return Number(k.beat.beatIndex > beat);
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart });
}
function box(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
function label(
  c,
  words,
  x,
  y,
  size = 20,
  color = C.ink,
  family = 'Sans',
  weight = 500,
  align = 'left',
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(String(words), x, y);
}
function serif(c, s, x, y, size = 36, color = C.ink, align = 'left') {
  label(c, s, x, y, size, color, 'Serif', 400, align);
}
function mono(c, s, x, y, size = 15, color = C.muted, align = 'left') {
  label(c, s, x, y, size, color, 'Mono', 500, align);
}
function line(c, x, y, X, Y, color = C.muted, w = 2, dash = []) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = w;
  c.setLineDash(dash);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(X, Y);
  c.stroke();
  c.restore();
}
function path(c, points, fill, stroke, thickness = 2) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = thickness;
    c.stroke();
  }
}
function circle(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}
function layer(c, alpha, fn) {
  if (alpha <= 0) return;
  c.save();
  c.globalAlpha *= alpha;
  fn();
  c.restore();
}
function tick(c, x, y, size, color = C.green) {
  line(c, x - size * 0.5, y, x - size * 0.12, y + size * 0.4, color, 3);
  line(c, x - size * 0.12, y + size * 0.4, x + size * 0.6, y - size * 0.52, color, 3);
}
function wall(c, tone = C.lilac) {
  box(c, 0, 0, 960, 540, tone);
  path(
    c,
    [
      [0, 0],
      [445, 0],
      [0, 303],
    ],
    '#fff1d866',
  );
  path(
    c,
    [
      [0, 345],
      [519, 0],
      [562, 0],
      [0, 375],
    ],
    '#fff1d84a',
  );
}
function sheet(c, x, y, w, h, color = C.paper) {
  box(c, x + 5, y + 6, w, h, '#392b382f');
  box(c, x, y, w, h, color);
}
function title(c, kicker, headline) {
  mono(c, kicker, 43, 35, 16);
  serif(c, headline, 42, 84, 41);
}
function footer(c, s, color = C.ink) {
  box(c, 0, 466, 960, 74, color);
  label(c, s, 480, 501, 23, C.paper, 'Sans', 600, 'center');
}
function character(c, k, who, x, y, scale, dir = 1) {
  portrait(c, who, x, y, scale, dir, k.seconds, 0, 0);
}
function opening(c, k) {
  c.save();
  c.scale(0.5, 0.5);
  lensPortrait(c, friday, [at(k, 0, 'Refund pending', 0.32), at(k, 1, 'the citation', 0.42)]);
  c.restore();
  box(c, 0, 0, 960, 53, C.ink);
  mono(c, 'FRIDAY   09:12   /   B17', 26, 27, 19, C.paper);
  label(c, 'Offline reader  ·  access denied', 932, 27, 20, C.gold, 'Sans', 500, 'right');
  const asked = at(k, 1, 'five percent trial'),
    held = at(k, 2, 'Zero');
  if (asked) {
    box(c, 40, 404, 371, 61, C.paper);
    label(c, 'Product proposes', 59, 435, 18);
    serif(c, '5%', 376, 435, 36, C.blue, 'right');
    box(c, 549, 404, 371, 61, held ? C.green : C.ink);
    label(c, 'Nia recommends', 567, 435, 18, C.paper);
    serif(c, held ? gate(failed, true).share + '%' : '?', 892, 435, 36, C.paper, 'right');
  }
}
function envelope(c, x, y, name, fill, scale = 1) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  box(c, -18, -13, 36, 26, fill);
  line(c, -18, -13, 0, 0, C.ink, 1.5);
  line(c, 0, 0, 18, -13, C.ink, 1.5);
  label(c, name, 0, 5, 13, C.ink, 'Mono', 700, 'center');
  c.restore();
}
function tenants(c, k) {
  wall(c, '#d9cbb9');
  title(c, 'ROUTING EXERCISE   /   SEPARATE SAMPLE', 'Which requests went to the candidate?');
  sheet(c, 44, 140, 516, 280);
  sheet(c, 592, 140, 323, 280, '#d6e1dc');
  const travel = at(k, 1, 'Send A’s request', 1.05),
    share = at(k, 1, 'One out of twenty'),
    answer = at(k, 2, 'All of them');
  mono(c, travel === 1 ? 'Prior version' : 'Incoming requests', 66, 172, 19);
  mono(c, 'Candidate', 618, 172, 19);
  const { routed, all, inA, routedA } = routing();
  requests.forEach((n, i) => {
    const x = 96 + 96 * (i % 5),
      y = 220 + 52 * Math.floor(i / 5);
    envelope(
      c,
      i === 0 ? x + (742 - x) * travel : x,
      i === 0 ? y + (269 - y) * travel : y,
      n,
      i === 0 ? C.gold : '#aac1d6',
      1.2,
    );
  });
  if (share)
    mono(
      c,
      routed + ' / ' + all + ' overall = ' + (100 * routed) / all + '%',
      751,
      352,
      18,
      C.blue,
      'center',
    );
  footer(
    c,
    answer
      ? 'Tenant A   ' + routedA + ' / ' + inA + ' = ' + (100 * routedA) / inA + '% routed'
      : 'How many of tenant A’s requests reached the candidate?',
  );
}
function fixture(c, k) {
  wall(c, C.tan);
  const b = k.beat.beatIndex;
  if (b === 0) {
    title(c, 'NIA’S RELEASE CHECK   /   OFFLINE', 'What did the test reader receive?');
    fields.forEach((name, i) => {
      const x = 46 + 445 * i;
      sheet(c, x, 142, 419, 275);
      mono(c, 'B17  /  ' + name, x + 18, 174, 16);
      line(c, x + 18, 199, x + 399, 199);
      label(c, 'Reader denied access', x + 19, 233, 22);
      mono(c, 'Observed response', x + 19, 285, 16);
      serif(c, friday[i], x + 19, 336, 33, C.red);
    });
    footer(c, 'Expected for both fixtures   ·   restricted text withheld');
    return;
  }
  title(c, 'PRACTICE BUILD   /   OTHER GATES PASSED', 'What share does this packet support?');
  const extra = at(k, 1, 'A third key appears') && !at(k, 2, 'remove the extra key');
  const numeric = at(k, 2, 'the number one') && !at(k, 3, 'With exact names');
  const packet = extra ? packets[0] : numeric ? packets[1] : passed,
    verdict = gate(packet, true);
  sheet(c, 43, 140, 575, 282);
  mono(c, 'Received keys', 68, 170, 17);
  mono(c, 'Value', 506, 170, 17);
  Object.entries(packet).forEach(([key, value], i) => {
    const y = 223 + 62 * i;
    line(c, 67, y + 28, 593, y + 28, '#c3ac9e', 1);
    mono(c, key, 68, y, 21, key === 'extra' ? C.red : C.ink);
    mono(c, value === true ? 'True' : String(value), 506, y, 22, value !== true ? C.red : C.green);
  });
  const answer =
    (extra && at(k, 2, 'Zero')) ||
    (numeric && at(k, 3, 'Keep it at zero')) ||
    at(k, 3, 'five percent canary');
  mono(c, 'Recommendation', 650, 184, 18);
  serif(c, answer ? verdict.share + '%' : '?', 654, 266, 86, answer && verdict.share ? C.green : C.ink);
  label(c, answer ? verdict.reason : 'Awaiting your call', 650, 348, 20);
  footer(c, 'Required   ·   exactly the two named cases, each a Boolean True');
}
function owners(c, k) {
  const stage = [
    [0, 'marked the hold in the release record'],
    [1, 'in build B eighteen'],
    [2, 'check. Withheld'],
    [2, 'Withheld too'],
    [3, 'They pass'],
    [4, 'Priya approved five percent'],
  ].filter(([b, p]) => through(k, b, p) === 1).length;
  const r = record(stage);
  const eligible = r.recommendation > 0 && through(k, 3, 'supports a recommendation') === 1;
  const live = through(k, 4, 'opened the canary') === 1 ? r.traffic : 0;
  const predicting = stage === 4 && through(k, 3, 'It stays at zero') === 0;
  const currentOwner = [0, 0, 1, 0, 0, 2, 2][stage];
  wall(c, C.tan);
  mono(c, 'RETURNS-RERANK-V3   /   FRIDAY RELEASE RECORD', 42, 31, 16);
  mono(c, 'Build ' + r.build, 913, 31, 16, C.ink, 'right');
  const cast = [
    ['nia', 'Nia', 'Release check', C.coral],
    ['omar', 'Omar', 'Access path', C.mint],
    ['priya', 'Priya', 'Release approval', '#afc2db'],
  ];
  cast.forEach(([who, name, role, bg], i) => {
    const x = 41 + i * 297;
    sheet(c, x, 69, 278, 329);
    c.save();
    c.beginPath();
    c.rect(x, 69, 278, 165);
    c.clip();
    box(c, x, 69, 278, 165, bg);
    character(c, k, who, x + 134, 193, 0.59, i === 2 ? -1 : 1);
    c.restore();
    serif(c, name, x + 17, 257, 28);
    mono(c, role, x + 17, 285, 15);
    line(c, x + 16, 303, x + 260, 303, '#c1a99b', 1);
    if (i === currentOwner) box(c, x, 246, 4, 139, C.plum);
    if (i === 0) {
      label(
        c,
        stage >= 1 ? 'Hold recorded · B17' : 'Hold entry open',
        x + 17,
        324,
        18,
        stage >= 1 ? C.red : C.muted,
      );
      const marks = r.checked.map((v) => (v === true ? 'pass' : v === false ? 'fail' : 'open'));
      mono(c, r.build + '   Snippet  ' + marks[0], x + 17, 358, 16, C.ink);
      mono(c, '      Citation ' + marks[1], x + 17, 386, 16, C.ink);
    } else if (i === 1) {
      label(
        c,
        stage >= 2 ? 'Access path repaired' : 'Repair pending',
        x + 17,
        331,
        19,
        stage >= 2 ? C.green : C.muted,
      );
      mono(c, stage >= 2 ? 'New build   B18' : 'Test build   B17', x + 17, 372, 15);
    } else {
      label(
        c,
        r.other ? 'Other gates passed' : 'Other gates pending',
        x + 17,
        331,
        18,
        r.other ? C.green : C.muted,
      );
      if (r.approved) {
        serif(c, 'Priya', x + 20, 370, 27, C.blue);
        tick(c, x + 110, 369, 17, C.blue);
      } else {
        mono(c, 'Signature', x + 17, 370, 14);
        line(c, x + 114, 376, x + 252, 376, C.muted, 1);
      }
    }
  });
  box(c, 41, 410, 872, 33, C.paper);
  mono(c, 'Gate', 58, 427, 15);
  label(
    c,
    eligible ? '5% eligible' : predicting ? 'Can it open?' : 'Hold',
    112,
    427,
    18,
    eligible ? C.green : predicting ? C.muted : C.red,
  );
  line(c, 262, 417, 262, 437, '#c1a99b', 1);
  mono(c, 'Live routing', 280, 427, 15);
  label(c, 100 - live + '% prior', 425, 427, 18);
  box(c, 540, 422, 193, 10, C.blue);
  box(c, 733 - (193 * live) / 100, 422, (193 * live) / 100, 10, C.green);
  label(c, live + '% candidate', 751, 427, 18, live ? C.green : C.ink);
}
function disagreement(c, k) {
  wall(c, C.lilac);
  title(c, 'INTERVIEW FOLLOW-UP', '“Were you too cautious?”');
  character(c, k, 'nia', 139, 352, 0.84, 1);
  sheet(c, 291, 142, 616, 281);
  mono(c, 'Shared goal', 315, 171, 16);
  serif(c, 'Ready before returns peak', 315, 206, 30);
  line(c, 315, 234, 879, 234, '#c4a99e', 1);
  label(c, 'Product', 315, 271, 20, C.blue);
  label(c, 'Learn live performance in time.', 437, 271, 21);
  label(c, 'Nia', 315, 324, 20, C.red);
  const condition = at(k, 1, 'settle the access question');
  label(c, condition ? 'Test access offline first.' : 'A reader can see private text.', 437, 324, 21);
  if (condition) mono(c, 'Reopen after both cases + other gates pass.', 315, 367, 17, C.green);
  const open = at(k, 2, 'before Priya decided');
  if (open) {
    mono(c, 'Priya', 315, 401, 15);
    line(c, 375, 408, 543, 408, C.ink, 1);
    mono(c, 'Decision open', 559, 401, 15);
  }
  footer(
    c,
    at(k, 2, 'requested security review')
      ? 'Nia requested security review. Priya owns the decision.'
      : open
        ? 'What could Nia say if the meeting ended here?'
        : 'What evidence would let both people move forward?',
  );
}
function suite(c, k) {
  if (k.beat.beatIndex === 3) {
    wall(c, C.lilac);
    title(c, 'SEPARATE INCIDENT   /   SEARCH INDEX', 'What changed for support staff?');
    sheet(c, 45, 137, 869, 282);
    label(c, 'Customer impact', 71, 177, 19, C.muted);
    serif(c, 'Blank search results', 71, 220, 30);
    line(c, 71, 257, 877, 257, '#c5afa0', 1);
    label(c, 'Rollback', 71, 293, 19, C.muted);
    if (at(k, 3, 'Jo rolled')) label(c, 'Jo', 200, 293, 21);
    label(c, 'Repair', 71, 343, 19, C.muted);
    if (at(k, 3, 'restored the missing entries')) label(c, 'I restored missing entries.', 200, 343, 21);
    incidentWindows.forEach(({ weeks, alerts }, i) => {
      const visible = i === 0 ? at(k, 3, 'Four in the four weeks') : at(k, 3, 'one in the four weeks');
      if (!visible) return;
      const x = 522 + i * 189;
      mono(c, weeks + ' weeks ' + (i ? 'after' : 'before'), x, 289, 15);
      for (let n = 0; n < alerts; n++) circle(c, x + 10 + n * 21, 334, 8, i ? C.green : C.red);
      mono(c, alerts + (alerts === 1 ? ' alert' : ' alerts'), x, 376, 17);
    });
    footer(c, 'Compare repeat alerts from the same rule in equal windows.');
    return;
  }
  wall(c, '#c5d1c3');
  title(c, 'DEVELOPMENT SUITE   /   SEPARATE EVALUATION', 'Would you promote this build?');
  const rerun = at(k, 1, 'Both now pass'),
    opened = at(k, 2, 'open an untouched holdout', 0.7);
  sheet(c, 43, 123, 350, 319);
  dev.forEach((ok, i) => {
    const x = 76 + (i % 10) * 29,
      y = 152 + Math.floor(i / 10) * 27;
    box(c, x, y, 19, 19, ok ? C.green : C.red);
    if (!ok) {
      line(c, x + 4, y + 4, x + 15, y + 15, C.paper, 2);
      line(c, x + 15, y + 4, x + 4, y + 15, C.paper, 2);
    }
  });
  mono(c, 'Original · ' + dev.filter(Boolean).length + ' / ' + dev.length + ' pass', 460, 149, 19);
  serif(c, 'Two required failures', 461, 198, 30, C.red);
  if (at(k, 1, 'hold promotion')) mono(c, 'Promotion held', 461, 242, 17, C.red);
  if (rerun) label(c, 'Repair run   ·   both cases pass', 461, 284, 21, C.green);
  box(c, 462, 331, 396, 84, '#d7b082');
  const flap = 331 + (1 - opened) * 34;
  path(
    c,
    [
      [462, 331],
      [660, flap - opened * 25],
      [858, 331],
    ],
    '#ead1a4',
    C.muted,
    1.4,
  );
  label(
    c,
    opened ? 'Assess fresh cases' : 'Sealed holdout',
    660,
    384,
    23,
    C.ink,
    'Sans',
    600,
    'center',
  );
  footer(
    c,
    opened
      ? 'Report the holdout separately from the cases used for tuning.'
      : k.beat.beatIndex === 0
        ? 'Which evidence would you keep?'
        : 'Keep the failed cases with the original result.',
  );
}

function canary(c, k) {
  const end = at(k, 1, 'window closed'),
    measurement = at(k, 1, 'four hundred twenty milliseconds', 0.5);
  const cleared = at(k, 2, 'Latency passed'),
    approved = at(k, 2, 'Priya approved');
  const replay = at(k, 3, 'Replay the decision'),
    broken = at(k, 3, 'to False'),
    reply = at(k, 4, 'Withdraw');
  const checks = broken ? { ...passed, [fields[0]]: false } : passed;
  const next = gate(checks, true, { complete: Boolean(end), ms: measurement ? latency : null });
  const dark = '#293541',
    bright = '#9de1c5',
    second = '#cfdae4',
    warm = '#ffd59c';
  box(c, 0, 0, 960, 540, dark);
  mono(
    c,
    replay ? 'DECISION REPLAY   /   BEFORE EXPANSION' : 'CANARY OBSERVATION   /   B18',
    43,
    33,
    16,
    second,
  );
  serif(
    c,
    replay ? 'What share would you recommend now?' : 'What did the five percent window show?',
    43,
    85,
    38,
    C.paper,
  );
  const left = 119,
    right = 838,
    top = 144,
    bottom = 353,
    y = (ms) => bottom - (ms * (bottom - top)) / 600;
  for (const ms of [0, 250, limit]) {
    line(
      c,
      left,
      y(ms),
      right,
      y(ms),
      ms === limit ? warm : '#71858a',
      ms === limit ? 2 : 1,
      ms === limit ? [9, 6] : [],
    );
    mono(c, ms, 97, y(ms), 16, ms === limit ? warm : second, 'right');
  }
  mono(c, 'ms', 78, 145, 14, second, 'right');
  const limitLabel =
    !end && at(k, 0, 'withdraw the canary to zero')
      ? 'Full window · valid p95 ≥ ' + limit + ' ms → withdraw to 0%'
      : 'Strict limit  < ' + limit + ' ms';
  label(c, limitLabel, right, y(limit) - 21, 18, warm, 'Sans', 500, 'right');
  [left, right].forEach((x) => line(c, x, top, x, bottom + 6, '#92a6b0', 1, [3, 6]));
  mono(c, 'Window opens', left, bottom + 25, 17, second);
  mono(c, 'Window closes', right, bottom + 25, 17, second, 'right');
  layer(c, measurement, () => {
    line(c, left, y(latency), right, y(latency), bright, 4);
    circle(c, right, y(latency), 7, bright);
    label(c, 'Window p95   ' + latency + ' ms', left + 15, y(latency) + 28, 22, bright);
  });
  const strip = [
    'Snippet  ' + (checks[fields[0]] ? 'pass' : 'FAIL'),
    'Citation  pass',
    end ? 'Window  complete' : 'Window  open',
  ];
  strip.forEach((s, i) => label(c, s, 80 + 285 * i, 427, 21, i === 0 && broken ? warm : second));
  let caption = '5% canary   ·   waiting for the complete window';
  if (end) caption = 'Complete window   ·   awaiting the gate decision';
  if (cleared) caption = 'Latency passed for this window';
  if (approved) caption = 'Priya approved the next stage   ·   ' + next.share + '%';
  if (replay)
    caption = broken
      ? 'Only the snippet failed. What share do you recommend?'
      : 'Replay   ·   same build, complete window and latency';
  if (reply) caption = 'Recommendation   ·   withdraw to ' + next.share + '%';
  footer(c, caption, reply ? C.red : '#17232e');
}
function percentile(c, k) {
  wall(c, '#d8cfb9');
  title(c, 'SEPARATE SORTED SAMPLE   /   NEAREST RANK', 'Can one request exceed the limit?');
  const base = 384,
    h = 219,
    scale = h / sample.at(-1),
    x = (i) => 70 + i * 42.6;
  const chosen = at(k, 1, 'The nineteenth', 0.45),
    last = at(k, 2, 'nine hundred milliseconds', 0.45);
  line(c, 55, base, 912, base, C.ink, 2);
  line(c, 55, base - limit * scale, 912, base - limit * scale, C.red, 1.3, [5, 5]);
  mono(c, '500 ms limit', 62, base - limit * scale - 17, 16, C.red);
  sample.forEach((ms, i) => {
    const color = i === rank - 1 && chosen ? C.green : i === sample.length - 1 && last ? C.red : C.blue;
    const barTop = base - ms * scale;
    box(c, x(i), barTop, 22, base - barTop, color);
    if (i === 0 || (i + 1) % 5 === 0)
      mono(c, i + 1, x(i) + 11, base + 23, 16, C.ink, 'center');
  });
  layer(c, chosen, () => {
    const px = x(rank - 1) + 11,
      py = base - sample[rank - 1] * scale;
    mono(c, rank, px, base + 23, 16, C.ink, 'center');
    line(c, px, py - 3, px - 31, py - 68, C.green, 1.8);
    label(
      c,
      '#' +
        rank +
        (at(k, 1, 'four hundred twenty milliseconds') ? '   ' + sample[rank - 1] + ' ms' : ''),
      px - 38,
      py - 69,
      20,
      C.green,
      'Sans',
      700,
      'right',
    );
  });
  layer(c, last, () =>
    label(
      c,
      sample.at(-1) + ' ms',
      x(sample.length - 1) + 15,
      base - h - 18,
      19,
      C.red,
      'Sans',
      700,
      'right',
    ),
  );
  footer(
    c,
    chosen
      ? 'Read rank ' + rank + ' of ' + sample.length + '   ·   the slower tail stays in the sample'
      : 'Rank = round up(0.95 × ' + sample.length + ')   ·   count from one',
  );
}
function claim(c, k) {
  wall(c, C.coral);
  title(c, 'REHEARSAL   /   MARK UP THE DRAFT', 'Which words survive a fact check?');
  const gateCredit = through(k, 1, 'I wrote the release check') === 1;
  const repairCredit = through(k, 1, 'Omar repaired authorization') === 1;
  const subtract = through(k, 1, 'subtract four hundred twenty from the limit of five hundred');
  const gapCue = 'Eighty milliseconds is headroom';
  const percentCue = 'sixteen percent headroom';
  const showGap = through(k, 1, gapCue, gapCue) === 1;
  const showPercent = through(k, 1, percentCue, percentCue) === 1;
  const before = through(k, 1, 'a comparable measurement from before the change') === 1;
  const followUp = through(k, 2, 'no incident follow-up') === 1;

  sheet(c, 40, 131, 332, 296);
  mono(c, 'Draft answer', 62, 161, 17);
  const items = [
    ['I fixed security.', gateCredit ? 'I wrote the release check.' : ''],
    ['I cut latency by 16%.', showGap ? 'Our p95 met the limit.' : ''],
    ['I stopped incidents.', followUp ? 'No incident follow-up.' : ''],
  ];
  items.forEach(([draft, revised], i) => {
    const y = 196 + 86 * i;
    serif(c, draft, 62, y, 26);
    if (revised) {
      const width = c.measureText(draft).width;
      line(c, 62, y + 3, 62 + width, y - 1, C.red, 3);
      label(c, revised, 62, y + 27, 20, C.green);
    }
  });
  if (repairCredit) label(c, 'Omar repaired access.', 62, 249, 20, C.green);

  sheet(c, 393, 131, 520, 296);
  mono(c, 'Friday latency', 416, 161, 17);
  const zeroX = 424;
  const limitX = 879;
  const axisY = 259;
  const x = (ms) => zeroX + (limitX - zeroX) * (ms / limit);
  const p95X = x(latency);
  const limitColor = '#80521d';
  line(c, zeroX, axisY, limitX, axisY, C.tan, 3);
  line(c, zeroX, axisY - 7, zeroX, axisY + 7, C.muted, 2);
  mono(c, '0', zeroX, axisY + 22, 18, C.muted, 'center');
  if (subtract > 0) line(c, zeroX, axisY, x(latency * subtract), axisY, C.blue, 5);
  line(c, limitX, 210, limitX, axisY + 9, limitColor, 3);
  label(c, limit + ' ms limit', limitX, 194, 22, limitColor, 'Sans', 600, 'right');
  line(c, p95X, 224, p95X, axisY, C.blue, 2);
  circle(c, p95X, axisY, 6, C.blue);
  label(c, 'Window p95 · ' + latency + ' ms', p95X - 13, 224, 22, C.blue, 'Sans', 600, 'right');
  if (showGap) {
    const bracketY = axisY + 24;
    line(c, p95X, bracketY - 8, p95X, bracketY, C.green, 2.5);
    line(c, p95X, bracketY, limitX, bracketY, C.green, 2.5);
    line(c, limitX, bracketY, limitX, bracketY - 8, C.green, 2.5);
    label(c, headroom + ' ms headroom', limitX, 306, 22, C.green, 'Sans', 600, 'right');
  }
  if (showPercent) {
    const fraction = headroom + ' ÷ ' + limit + ' = ' + headroomFraction * 100 + '% of limit';
    label(c, fraction, 416, 306, 22, C.green, 'Sans', 600);
  }
  if (before) {
    line(c, 416, 342, limitX, 342, C.tan, 1);
    label(c, 'Before-change p95', 416, 380, 22);
    line(c, 643, 382, 735, 382, C.muted, 2, [5, 6]);
    label(c, 'Unrecorded', limitX, 380, 22, C.muted, 'Sans', 500, 'right');
  }

  let prompt = 'Which verb belongs to Nia? What would a speed claim need?';
  if (gateCredit) prompt = 'What comparison would a speed claim need?';
  if (before) prompt = 'A speed claim needs a matched before-change measurement.';
  if (at(k, 2, 'I put release and rollback criteria'))
    prompt = 'Next launch review   ·   write release and rollback criteria early.';
  footer(c, prompt);
}
function habit(c, k) {
  wall(c, '#cbbfcf');
  const b = k.beat.beatIndex;
  if (b === 0) {
    title(c, 'WEAKNESS QUESTION   /   MIGRATION', 'Who paid for the late feedback?');
    sheet(c, 48, 148, 403, 256);
    sheet(c, 493, 148, 415, 256);
    mono(c, 'First migration', 71, 183, 17);
    serif(c, 'Late proposal', 71, 240, 34, C.red);
    label(c, '3 days late', 71, 292, 24);
    label(c, 'Teammate redid integration.', 71, 350, 21);
    mono(c, 'Next migration', 519, 183, 17);
    if (at(k, 0, 'one-page proposal')) {
      serif(c, 'Early review', 519, 240, 34, C.green);
      label(c, 'One-page proposal', 519, 292, 23);
      label(c, 'Compatibility checklist', 519, 350, 21);
    }
    footer(c, 'A work habit, its cost, and one observed change');
    return;
  }
  title(c, 'THREE PRACTICE PROJECTS   /   REVIEW TIMING', 'When did review arrive?');
  sheet(c, 48, 131, 858, 294);
  const x0 = 545,
    step = 84;
  mono(c, 'Earlier', 298, 162, 17);
  mono(c, 'Later', 728, 162, 17);
  line(c, x0, 185, x0, 370, C.plum, 3);
  earlyReviews.forEach((v, i) => {
    const y = 214 + i * 61,
      x = x0 + step * v;
    label(c, 'Project ' + (i + 1), 75, y, 21);
    line(c, 260, y, 819, y, '#b2a39d', 2);
    path(
      c,
      [
        [x, y - 10],
        [x + 10, y],
        [x, y + 10],
        [x - 10, y],
      ],
      v < 0 ? C.green : C.red,
    );
  });
  mono(c, 'Coding starts', x0, 394, 17, C.ink, 'center');
  const delivery = at(k, 2, 'None of the records') ? 'delivery dates missing' : 'earlier delivery?';
  footer(
    c,
    at(k, 2, 'Two out of three')
      ? earlyReviews.filter((n) => n < 0).length +
          ' / ' +
          earlyReviews.length +
          ' reviewed early   ·   ' + delivery
      : 'Count the review diamonds to the left of coding.',
  );
}
function folded(c, x, y, w, h, fill) {
  path(
    c,
    [
      [x, y],
      [x + w - 26, y],
      [x + w, y + 26],
      [x + w, y + h],
      [x, y + h],
    ],
    fill,
    C.muted,
    1.4,
  );
  path(
    c,
    [
      [x + w - 26, y],
      [x + w - 26, y + 26],
      [x + w, y + 26],
    ],
    '#dbcbb8',
    C.muted,
    1.2,
  );
}
function practice(c, k) {
  const b = k.beat.beatIndex;
  wall(c, b < 2 ? '#e7c5b4' : '#c7c0d1');
  if (b < 2) {
    title(c, 'PRACTICE INTERVIEW', '“Which part was yours?”');
    character(c, k, 'nia', 152, 388, 0.99);
    folded(c, 324, 133, 584, 297, C.paper);
    mono(c, 'Nia’s answer', 348, 165, 17);
    const rows = [
      ['My action', 'I wrote the release check.', at(k, 0, 'My job')],
      ['Repair', 'Omar fixed access.', at(k, 1, 'Omar fixed access')],
      ['Approval', 'Priya approved 5%.', at(k, 1, 'Priya approved five percent')],
      ['Observed', 'Window p95  ' + latency + ' ms', at(k, 1, 'four hundred twenty milliseconds')],
    ];
    rows.forEach(([who, action, visible], i) => {
      const y = 216 + i * 55;
      mono(c, who, 349, y, 16);
      line(c, 482, y + 18, 874, y + 18, '#c5b1a0', 1);
      if (visible) label(c, action, 485, y, 23, i === 0 ? C.red : C.ink);
    });
    footer(c, 'Friday release   ·   two denied tests on B17');
    return;
  }
  if (b === 3) {
    title(c, 'MISSION QUESTION', '“Why this work?”');
    character(c, k, 'nia', 153, 390, 0.96);
    folded(c, 320, 138, 591, 280, C.paper);
    mono(c, 'Problem', 346, 181, 16);
    serif(c, 'Bound what a tool can do.', 346, 223, 29);
    mono(c, 'Nia’s evidence', 346, 275, 16);
    label(c, 'Two denied fixtures in my release check.', 346, 313, 23);
    if (at(k, 3, 'then ask')) {
      line(c, 346, 345, 878, 345, '#bea89e', 1);
      label(c, 'Which actions are hardest to evaluate?', 346, 379, 23, C.blue);
    }
    footer(c, 'Ask the recruiter what this role emphasizes.');
    return;
  }
  title(c, 'STORY BANK', 'Which piece of work fits the question?');
  const cards = [
    ['Launch judgment', 'Permission checks', 'Two denied outputs'],
    ['Migration', 'Compatibility', 'Old clients still work'],
    ['Incident', 'Customer impact', 'Who rolled back?'],
  ];
  cards.forEach(([name, topic, artifact], i) => {
    const x = 42 + i * 299,
      y = 156 + 16 * (i % 2);
    folded(c, x, y, 275, 221, i === 0 ? C.paper : '#eee7dc');
    mono(c, name, x + 18, y + 38, 15);
    serif(c, topic, x + 17, y + 100, 25);
    line(c, x + 18, y + 135, x + 250, y + 135, '#bea89e', 1);
    label(c, artifact, x + 18, y + 171, 18);
  });
  footer(c, 'A change-of-mind story needs a belief you actually revised.');
}
function scope(c, k) {
  const b = k.beat.beatIndex;
  wall(c, b < 2 ? '#c4d2c6' : '#d1c6d6');
  if (b < 2) {
    title(c, 'TOOL SAFETY   /   SUPPORT TRIAGE', 'Can the assistant export private cases?');
    const denied = !supportPermissions.bulkExport && at(k, 1, 'denies the export'),
      logged = at(k, 1, 'audit log records');
    folded(c, 51, 159, 241, 207, C.paper);
    mono(c, 'Assigned case', 68, 189, 17);
    for (let i = 0; i < 3; i++) line(c, 69, 231 + 25 * i, 243 - i * 19, 231 + 25 * i, '#a99e94', 4);
    if (supportPermissions.readAssignedCase) {
      tick(c, 82, 331, 16);
      label(c, 'Read allowed', 103, 332, 18, C.green);
    }
    line(c, 303, 256, 593, 256, C.blue, 3, [9, 6]);
    label(c, 'Bulk export', 326, 223, 24);
    box(c, 585, 154, 14, 209, C.plum);
    box(c, 572, 146, 40, 13, C.plum);
    if (denied) {
      circle(c, 592, 256, 23, C.red);
      line(c, 579, 256, 605, 256, C.paper, 5);
    }
    mono(c, 'Destination', 704, 193, 16);
    serif(c, denied ? '0 sent' : '?', 751, 257, 44, denied ? C.green : C.ink, 'center');
    if (logged) mono(c, 'Audit: export denied', 619, 351, 17);
    footer(
      c,
      denied
        ? 'Permission check blocked export before any records left.'
        : 'Which control must act before disclosure?',
    );
    return;
  }
  title(c, 'INTERVIEW TOOLS', 'Where does the permission apply?');
  sheet(c, 46, 142, 409, 260);
  sheet(c, 498, 142, 409, 260);
  mono(c, 'Permitted rehearsal', 69, 181, 18);
  serif(c, 'Sanitized packet', 68, 237, 31);
  label(c, 'Real role and evidence', 69, 294, 21);
  label(c, 'One skeptical question', 69, 346, 21);
  mono(c, 'New live invitation', 520, 181, 18);
  serif(c, 'Tool policy', 519, 237, 31);
  mono(c, 'Instructions silent', 520, 294, 18, C.red);
  if (at(k, 4, 'Clarify this format')) label(c, 'Ask the recruiter first.', 520, 346, 22, C.green);
  footer(
    c,
    b === 2
      ? 'Check the critique against the actual record.'
      : b === 3
        ? 'A previous employer allowed live AI. What about this invitation?'
        : 'Permission follows the employer and the assessment format.',
  );
}
function fresh(c, k) {
  if (at(k, 2, 'Now record')) {
    wall(c, C.lilac);
    title(c, 'TWO-MINUTE REHEARSAL', 'Tell the decision you can defend.');
    character(c, k, 'interviewer', 805, 382, 0.98, -1);
    folded(c, 48, 139, 552, 273, C.paper);
    mono(c, 'Your own project', 72, 174, 16);
    for (const [i, s] of ['I owned…', 'I observed…', 'I would reconsider if…'].entries()) {
      serif(c, s, 72, 232 + i * 68, 25);
      line(c, 72, 258 + i * 68, 568, 258 + i * 68, '#ba9e90', 1.5);
    }
    footer(c, 'Ask a partner for your contribution, one result and one unknown.');
    return;
  }
  wall(c, '#e8c7a9');
  title(c, 'YOUR RELEASE NOTE   /   FRESH CASE', 'What would you recommend?');
  const ms = [500, 480],
    window2 = at(k, 1, 'separate later canary'),
    announced = at(k, 1, 'four hundred eighty milliseconds');
  const answers = [at(k, 1, 'Withdraw to zero'), at(k, 2, 'twenty percent')];
  const ready = [at(k, 0, 'exactly five hundred milliseconds'), announced];
  if (!window2) character(c, k, 'interviewer', 749, 382, 0.98, -1);
  for (let i = 0; i < (window2 ? 2 : 1); i++) {
    const x = 46 + 445 * i;
    sheet(c, x, 133, 416, 289);
    mono(c, i ? 'Later approved canary' : 'First approved canary', x + 18, 168, 17);
    label(c, 'Both access checks + other gates pass', x + 18, 207, 17, C.green);
    label(c, 'Complete window   ·   p95 < ' + limit + ' ms required', x + 18, 243, 16);
    line(c, x + 18, 268, x + 397, 268, '#c0af9d', 1);
    serif(c, ready[i] ? ms[i] + ' ms' : 'Awaiting p95', x + 18, 304, 34);
    const result = gate(passed, true, { complete: true, ms: ms[i] });
    const verdict = result.share === 0 ? 'Withdraw to 0%' : 'Seek approval for ' + result.share + '%';
    label(
      c,
      answers[i] ? verdict : 'Recommendation?',
      x + 18,
      378,
      24,
      answers[i] ? (result.share === 0 ? C.red : C.green) : C.muted,
    );
  }
  const knownRoles = 'You wrote the gate. Morgan repaired access.';
  footer(
    c,
    at(k, 2, 'release-owner approval') ? knownRoles + ' The release owner can approve.' : knownRoles,
  );
}

const scenes = {
  'c01': opening,
  'c02': tenants,
  'c03': fixture,
  'c04': owners,
  'c05': disagreement,
  'c05-suite': suite,
  'c06': canary,
  'c06-rank': percentile,
  'c07': claim,
  'c07-habit': habit,
  'c08': practice,
  'c08-tool': scope,
  'c08-practice': fresh,
};
function draw(c, k) {
  c.save();
  c.scale(2, 2);
  c.lineJoin = 'round';
  c.lineCap = 'round';
  scenes[k.beat.chapterId](c, k);
  c.restore();
}
export default { title: 'Tell the Decision You Can Defend', draw, check };
