import * as A from './press.mjs';
import * as M from './evidence.mjs';
const {
  ink,
  teal,
  green,
  red,
  navy,
  muted,
  white,
  paper,
  pale,
  pink,
  yellow,
  blue,
  light,
  base,
  rect,
  line,
  dot,
  txt,
  para,
  mono,
  heading,
  label,
  leaf,
  folio,
  book,
  hashMark,
  stamp,
  fold,
  bracket,
  link,
  band,
} = A;
export function regions(c, { b, cue }) {
  base(c, 'green');
  book(c, 55, 78, 1090, 460);
  M.regional.forEach((s, i) => {
    const x = 92 + 545 * i;
    label(c, 'RETAINED SOURCE', x, 117, teal);
    txt(c, i ? 'EU policy' : 'US policy', x, 177, 46, navy, 'Serif');
    mono(c, s.id, x, 220, 21, muted);
    line(c, x, 242, x + 447, 242, teal, 2);
    if (cue(2, 'Both policies')) rect(c, x - 3, 266, 448, i ? 127 : 84, pale);
    para(c, i ? s.text : s.text.split('. ')[0] + '.', x + 6, 305, 433, 31, 38);
    if (!i) {
      if (cue(2, 'The US passage also')) rect(c, x - 3, 357, 448, 129, yellow);
      para(c, s.text.split('. ')[1], x + 6, 394, 432, 28, 34);
    } else if (cue(2, 'leaves that question open'))
      label(c, 'Manager approval   /   unspecified', x + 7, 435, red);
  });
  if (b === 3)
    txt(
      c,
      'Report sections: shared requirements, regional differences, unresolved conflicts',
      69,
      599,
      25,
      white,
      'Sans',
      400,
      1075,
    );
}
export function budget(c, { b, cue }) {
  base(c, 'clay');
  if (b <= 2) {
    folio(c, 59, 38, 1081, 570, white, navy);
    heading(
      c,
      'RESEARCH REQUEST   /   ACCESS-POLICY-COMPARISON-17',
      'Dispatch allowance',
      95,
      83,
      987,
    );
    txt(c, 'US v3  +  EU v2', 95, 191, 31, ink, 'Serif');
    label(c, 'ALLOWED POLICY SNAPSHOTS', 96, 221);
    label(c, 'MAXIMUM SOURCES', 565, 175);
    mono(c, '12', 564, 224, 43, teal);
    label(c, 'DEADLINE', 844, 175);
    mono(c, '300 s', 844, 224, 43, teal);
    const showUsed = cue(1, 'five steps have been used'),
      spent = Boolean(cue(2, 'Admit one search'));
    const used = spent ? 6 : 5;
    if (showUsed) {
      label(c, 'SEARCH STEPS', 95, 296);
      A.steps(c, used, 6, 95, 311, 675);
      mono(c, used + ' / 6 used', 810, 344, 32, ink);
      const initial = M.dispatch(5, 8, 60),
        next = M.dispatch(used, 8, 60);
      const asked = cue(1, 'Two more searches');
      if (asked) {
        fold(c, 95, 383, 394, 104, spent ? pale : paper);
        label(c, 'FIRST PROPOSAL', 112, 412);
        txt(c, spent && initial ? 'Dispatched' : 'Search A', 111, 459, 28, ink, 'Serif');
        fold(c, 539, 383, 394, 104, spent ? pink : paper);
        label(c, 'SECOND PROPOSAL', 558, 412);
        txt(c, !next ? 'Stopped at limit' : 'Search B', 556, 459, 28, spent ? red : ink, 'Serif');
      }
    } else {
      label(c, 'REQUIRED SECTIONS', 95, 324);
      para(
        c,
        'Shared requirements · regional differences · unresolved conflicts',
        96,
        389,
        942,
        32,
        40,
      );
    }
    if (cue(2, 'Refuse a thirteenth source'))
      label(c, 'At 12 sources: refuse another. At 300 seconds: stop new work.', 96, 560, red);
  } else {
    book(c, 59, 65, 1079, 483);
    heading(c, 'LOOKUP ORDER', 'First supported hit', 92, 114, 455);
    para(
      c,
      'The first readable passage with an entailed review can leave the lookup.',
      94,
      247,
      453,
      33,
      41,
    );
    if (b === 4) band(c, 'Fetch, cache and delivery', 94, 432, 449);
    heading(c, 'RESEARCH CONFLICT', 'Which rule applies?', 631, 114, 465);
    ['Jurisdiction', 'Version and effective date', 'Precedence between policies'].forEach(
      (s, i) => {
        const y = 253 + i * 69;
        txt(c, s, 634, y, 28, ink, 'Serif');
        line(c, 632, y + 16, 1080, y + 16, '#b5ae95');
      },
    );
    label(
      c,
      b === 4
        ? 'Host enforces source and tool permissions.'
        : 'Resolve applicability or report the conflict.',
      631,
      484,
      red,
      470,
    );
  }
}
function token(c, x, y, n, active = false) {
  const color = active ? teal : navy;
  const pts = [
    [x, y],
    [x + 270, y],
    [x + 290, y + 18],
    [x + 290, y + 58],
  ];
  for (let i = 4; i >= 0; i--) {
    const xx = x + 74 + 37 * i,
      deep = n & (1 << i) ? 17 : 0;
    pts.push(
      [xx + 29, y + 58],
      [xx + 29, y + 58 + deep],
      [xx + 6, y + 58 + deep],
      [xx + 6, y + 58],
    );
  }
  pts.push([x, y + 58]);
  A.path(c, pts, color, 1, true);
  dot(c, x + 26, y + 27, 10, paper);
  mono(c, 'token ' + n, x + 53, y + 39, 27, white);
}
export function checkpoints(c, { b, cue }) {
  base(c, 'blue');
  if (b < 3 || b === 5) {
    const cancelled = b === 5 || cue(1, 'record cancellation');
    const researching = cue(1, 'researching'),
      planning = cue(1, 'planning');
    const phase = cancelled
      ? 'cancelled'
      : researching
        ? 'researching'
        : planning
          ? 'planning'
          : 'queued';
    const record =
      phase === 'researching' && cue(1, 'reconstruct it') ? M.restoredJob : M.phases[phase];
    folio(c, 65, 57, 1067, 505, white, navy);
    heading(c, 'MINI-LAB   /   IN-MEMORY JSON', 'Recover the job record', 98, 98, 970);
    mono(c, 'phase', 102, 231, 22, muted);
    txt(c, phase, 436, 231, 36, cancelled ? red : teal, 'Serif');
    mono(c, 'checkpoint', 102, 300, 22, muted);
    mono(c, record.checkpoint, 436, 299, 30, ink);
    mono(c, 'steps used', 102, 372, 22, muted);
    A.steps(c, record.steps, 6, 436, 341, 540);
    if (cue(1, 'reconstruct it') && !cancelled)
      stamp(c, 'Round-trip restored', 101, 432, 385, teal);
    if (cancelled) stamp(c, 'Terminal   /   resume rejected', 101, 427, 536, red);
    if (b === 5) label(c, 'A server-side cancel record survives a client disconnect.', 102, 521);
  } else {
    folio(c, 54, 50, 1092, 541, white, navy);
    heading(
      c,
      'DURABLE STORAGE   /   SEPARATE LIVE JOB',
      'Who may advance the checkpoint?',
      88,
      97,
      983,
    );
    const taken = Boolean(cue(3, 'B now owns')),
      cur = taken ? M.owner.token : 7;
    const results = M.proposals.map((p) => M.commitCheckpoint({ ...M.owner, token: cur }, p));
    const reject = Boolean(cue(4, 'Reject A')),
      commit = Boolean(cue(4, 'accept B'));
    const stored = commit ? results[1].state : M.owner;
    label(c, 'PROPOSED WRITES', 92, 205);
    ['Worker A', 'Worker B'].forEach((name, i) => {
      if (i === 1 && !taken) return;
      const yy = 243 + i * 128;
      txt(c, name, 92, yy + 34, 27, ink, 'Serif');
      token(c, 250, yy, M.proposals[i].token, taken ? i === 1 : i === 0);
      if ((i === 0 && reject) || (i === 1 && commit))
        label(
          c,
          results[i].accepted ? 'COMMITTED' : 'REJECTED',
          260,
          yy + 98,
          results[i].accepted ? teal : red,
        );
    });
    rect(c, 622, 207, 448, 257, paper);
    label(c, 'TRANSACTION REQUIRES', 646, 244);
    mono(c, 'current token = ' + cur, 645, 307, 31, navy, 395);
    line(c, 646, 330, 1038, 330, muted);
    label(c, 'STORED CHECKPOINT', 646, 369);
    mono(c, stored.checkpoint, 646, 415, 28, teal, 393);
    if (cue(4, 'An in-flight operation'))
      label(c, 'Reconcile an in-flight call before retrying it.', 91, 546, red);
  }
}
function spans(c, b, cue) {
  if (b === 2 && !cue(2, 'Apply that order')) {
    folio(c, 70, 66, 1061, 467, white, navy);
    heading(c, 'PYTHON STRING OFFSETS', 'Slice, then encode', 106, 113, 950);
    const s = M.span('café', 3, 4);
    [...'café'].forEach((ch, i) => {
      const x = 109 + i * 130;
      mono(c, i, x + 12, 240, 22, muted);
      rect(c, x, 260, 105, 97, i === 3 ? pale : paper);
      txt(c, ch, x + 26, 331, 57, ink, 'Serif');
    });
    bracket(c, 499, 604, 252, teal);
    mono(c, '[3, 4)', 688, 252, 34, navy);
    if (cue(2, 'That selects')) txt(c, s.slice, 692, 338, 61, teal, 'Serif');
    if (cue(2, 'two bytes'))
      mono(c, 'UTF-8   C3 A9   /   ' + s.bytes + ' bytes', 108, 446, 30, navy);
    return;
  }
  book(c, 52, 64, 1097, 475);
  M.regional.forEach((s, i) => {
    const x = 86 + i * 548,
      sp = M.span(s.text);
    label(c, 'ADMITTED SOURCE', x, 112, teal);
    mono(c, s.id, x, 164, 30);
    para(c, s.text, x, 225, 465, 31, 39);
    mono(c, '[' + sp.start + ', ' + sp.end + ')', x, 389, 31, teal);
    hashMark(c, sp.hash, x, 458, 388);
  });
  if (b >= 2)
    txt(
      c,
      b === 2
        ? 'Identity check: US + EU.     Manager approval: US only.'
        : 'Review binding: claim ID, exact claim, source snapshots, spans and review path.',
      70,
      600,
      27,
      white,
      'Sans',
      400,
      1057,
    );
}
export function adjudication(c, { b, cue }) {
  base(c, 'green');
  if (b <= 3) {
    spans(c, b, cue);
    return;
  }
  const privateNote = b === 6 || (b === 5 && cue(5, 'The last claim')),
    unknown = b === 5 && cue(5, 'Try a claim') && !privateNote;
  const idx = privateNote ? 4 : unknown ? 3 : 2,
    claim = M.reports[idx];
  const changed = b >= 7 && cue(7, 'Change just the declared judgment');
  const receipt = { ...M.claimReceipts[idx], ...(changed ? { label: 'entailed' } : {}) };
  const gate = M.inspectClaim(claim, receipt);
  folio(c, 52, 48, 1097, 550, white, navy);
  label(
    c,
    privateNote ? 'UNADMITTED WORKSPACE SOURCE' : 'ADMITTED US SOURCE   /   ' + M.regional[0].id,
    87,
    89,
    privateNote ? red : teal,
  );
  para(
    c,
    privateNote ? claim.sources[0].text : M.regional[0].text.split('. ')[1],
    87,
    146,
    1015,
    35,
    42,
  );
  line(c, 88, 218, 1106, 218, teal, 2);
  label(c, 'PROPOSED REPORT CLAIM', 87, 259, red);
  para(c, claim.text, 87, 309, 1009, 34, 41);
  if (!privateNote && !unknown) {
    A.font(c, 34, 'Serif');
    const x = 87 + c.measureText('Manager approval is ').width;
    line(c, x, 320, x + c.measureText('not').width, 320, red, 4);
  }
  const seen = b > 4 || cue(4, 'The word check passes');
  if (!privateNote && seen) {
    label(c, 'LONG-WORD CHECK', 89, 417);
    txt(c, gate.wordMatch ? 'pass' : 'fail', 89, 469, 36, ink, 'Serif');
  }
  const reviewed =
    b >= 5 && (!unknown || cue(5, 'leaves that unknown')) && (!privateNote || b === 6);
  if (reviewed) {
    label(c, 'SUPPLIED JUDGMENT', 421, 417);
    txt(c, receipt.label, 420, 468, 35, navy, 'Serif');
    label(c, 'CONSISTENCY GATE', 785, 417);
    stamp(
      c,
      gate.passes ? 'Pass' : gate.admitted ? 'Blocked' : 'Source excluded',
      785,
      433,
      308,
      gate.passes ? teal : red,
      26,
    );
  }
  if (b >= 7) {
    line(c, 89, 508, 1104, 508, muted, 1);
    label(c, 'SOURCE DIGEST', 89, 551);
    hashMark(c, M.sha(claim.sources[0].text), 251, 551, 298, teal);
    label(c, 'CLAIM DIGEST', 615, 551);
    hashMark(c, M.sha(claim.text), 763, 551, 299, red);
  }
}
function strip(c, x, y, w, h) {
  leaf(c, x, y, w, h, white);
  for (let yy = y + 18; yy < y + h - 4; yy += 28) {
    dot(c, x + 11, yy, 4, '#829390');
    dot(c, x + w - 11, yy, 4, '#829390');
  }
}
export function lifecycle(c, { b, cue }) {
  base(c, 'blue');
  if (b <= 2) {
    strip(c, 86, 47, 1028, 535);
    heading(c, 'PROPOSED RESEARCH API', 'Regional comparison request', 124, 93, 904);
    const calls = [
      ['POST /research-jobs', '202 Accepted • job ID + status URL', cue(1, 'two oh two Accepted')],
      ['GET /research-jobs/17', 'phase • budget use • checkpoint', cue(1, 'Poll for the phase')],
      [
        'POST /research-jobs/17/cancel',
        'server-side cancellation receipt',
        cue(1, 'Cancelling creates'),
      ],
      ['GET /research-jobs/17/report', 'verified report or explicit partial result', b === 2],
    ];
    calls.forEach(([url, result, on], i) => {
      if (!on && i > 0) return;
      const y = 223 + i * 82;
      mono(c, url, 125, y, 23, ink, 443);
      if (on) txt(c, result, 605, y, 24, teal, 'Serif', 400, 466);
      line(c, 122, y + 23, 1072, y + 23, '#c4c1aa', 1);
    });
  } else if (b <= 4) {
    book(c, 61, 80, 1078, 450);
    heading(c, 'GOOGLE DEEP RESEARCH', 'October 2026 preview', 91, 120, 464);
    mono(c, 'Interactions API', 94, 247, 29, teal);
    mono(c, 'background = True', 94, 310, 25, ink);
    txt(c, 'Poll or stream the response.', 94, 399, 26, ink, 'Serif');
    heading(c, 'STREAM RECONNECTION', 'Resume delivery', 632, 121, 465);
    if (cue(3, 'To reconnect')) {
      band(c, 'interaction ID', 632, 215, 451);
      band(c, 'last event ID', 632, 280, 451);
      link(c, 856, 326, 856, 358, teal);
      txt(c, 'Next delivered event', 665, 404, 28, ink, 'Serif');
    }
    if (b === 4)
      label(c, 'Provider checkpoints and ownership are unspecified.', 632, 488, red, 464);
  } else {
    folio(c, 54, 50, 1090, 535, white, teal);
    heading(c, 'RELEASE EXERCISE', 'Break one boundary at a time', 89, 94, 1000);
    const groups = [
      ['Execution', 'Restart after a phase', 'Cancel during a call'],
      ['Ownership and limits', 'Reject a stale writer', 'Stop at the budget'],
      ['Evidence', 'Detect changed text', 'Resolve each citation'],
    ];
    groups.forEach(([name, a, d], i) => {
      const x = 93 + i * 343;
      label(c, name.toUpperCase(), x, 219, teal, 314);
      line(c, x, 235, x + 301, 235, teal);
      para(c, a, x, 284, 290, 27, 33);
      para(c, d, x, 371, 291, 27, 33);
    });
    band(
      c,
      b === 6
        ? 'Completion requires a separate approved review for each factual claim.'
        : 'Also exercise conflicting sources and the unadmitted private note.',
      91,
      480,
      1003,
      b === 6 ? teal : navy,
      b === 6 ? pale : blue,
    );
  }
}
function parcel(c) {
  A.path(
    c,
    [
      [26, 112],
      [100, 69],
      [571, 102],
      [588, 473],
      [527, 533],
      [31, 500],
    ],
    '#ae7849',
    1,
    true,
  );
  A.path(
    c,
    [
      [26, 112],
      [100, 69],
      [571, 102],
      [509, 149],
    ],
    '#d8b280',
    1,
    true,
  );
  A.path(
    c,
    [
      [26, 112],
      [509, 149],
      [527, 533],
      [31, 500],
    ],
    '#c99c68',
    1,
    true,
  );
  A.path(
    c,
    [
      [220, 88],
      [274, 92],
      [209, 128],
      [211, 514],
      [160, 509],
      [163, 121],
    ],
    '#e4c493',
    1,
    true,
  );
  line(c, 83, 78, 554, 116, '#9a744e');
  line(c, 521, 153, 538, 505, '#8f6847', 2);
}

function shippingReplay(c) {
  folio(c, 65, 51, 1070, 169, white, navy);
  label(c, 'SHARED PASSAGE   /   ' + M.SHIPPING_PASSAGE.corpusVersion, 97, 89, teal);
  para(c, M.SHIPPING_PASSAGE.text, 97, 143, 1000, 34, 42);
  for (const [i, row] of M.shipping.entries()) {
    const x = 65 + 550 * i;
    const grounded = row.reply.status === 'ANSWER';
    const color = grounded ? teal : red;
    const citations = row.reply.citations.length;
    const outcome = grounded ? 'Grounded' : 'Abstain';
    const summary = outcome + '   /   ' + citations + (citations === 1 ? ' citation' : ' citations');
    folio(c, x, 255, 520, 297, white, navy);
    label(c, grounded ? 'ORIGINAL QUESTION' : 'FOLLOW-UP QUESTION', x + 27, 292, navy);
    para(c, row.q, x + 27, 335, 466, 26, 34);
    hashMark(c, row.match.current, x + 27, 435, 459);
    band(c, summary, x + 26, 455, 468, color, grounded ? pale : pink);
    mono(c, row.reply.supportReceiptId ?? 'no bound review', x + 27, 529, 22, ink, 466);
  }
}

export function shippingDesk(c, { b, cue, after }) {
  base(c, 'clay');
  if (b >= 5) {
    shippingReplay(c);
    return;
  }
  parcel(c);
  const flipped = Boolean(cue(2, 'changes the question')),
    current = M.shipping[Number(flipped)],
    slip = M.shipping[0].match;
  const reply = flipped
    ? after(3, 'Abstain on the revised question')
    : after(1, 'can cite the whole sentence');
  const comparing =
    flipped && after(2, 'Compare the new question fingerprint with the review on file');
  const mismatch = comparing && !current.match.matches && after(3, 'Only the first one matches');
  const questionColor = mismatch ? red : flipped ? navy : teal;
  const x = 79 - A.ease(1 - cue(1, 'At a shipping desk', 0.8)) * 65;
  if (flipped) {
    fold(c, x + 7, 193, 470, 317, white);
    mono(c, M.shipping[0].match.current.slice(0, 10) + '   1 citation', x + 32, 497, 21, teal);
  }
  fold(c, x, 152, 476, 319, mismatch ? pink : white);
  dot(c, x + 18, 176, 6, '#9c825a');
  A.path(
    c,
    [
      [18, 113],
      [43, 136],
      [x + 18, 176],
    ],
    '#83674b',
    4,
  );
  dot(c, x + 18, 176, 3, '#765740');
  label(c, flipped ? 'CLERK’S FOLLOW-UP' : 'SHIPPING QUESTION', x + 39, 196, navy);
  para(c, current.q, x + 27, 250, 414, 29, 37);
  hashMark(c, current.match.current, x + 25, 412, 354, questionColor);
  if (reply)
    label(
      c,
      current.reply.citations.length
        ? 'Cite [' + current.reply.citations[0].span.join(', ') + ')   /   1 citation'
        : 'Abstain   /   0 citations',
      x + 26,
      451,
      flipped ? red : teal,
    );
  folio(c, 622, 62, 514, 444, white, navy);
  label(c, 'SHIPPING HANDBOOK   /   V1', 658, 111, teal);
  para(c, M.SHIPPING_PASSAGE.text, 656, 181, 445, 39, 49);
  if (cue(1, 'Its question fingerprint')) {
    leaf(c, 650, 332, 453, 143, pale);
    label(c, 'EDITOR’S COPY   /   REVIEWED QUESTION', 670, 365, teal);
    hashMark(c, slip.receipt, 671, 409, 349);
    txt(c, 'Specialist review required?', 670, 449, 26, ink, 'Serif');
  }
  if (comparing) link(c, x + 479, 405, 646, 405, questionColor);
  if (cue(1, 'The first question'))
    label(c, 'Rank 1   /   ' + current.hits.length + ' shared terms', 654, 302, teal);
  if (b === 4) band(c, current.reply.answer, 95, 550, 1005, red, pink);
}
