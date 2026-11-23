import {
  C,
  at,
  base,
  box,
  line,
  dot,
  txt,
  mono,
  serif,
  note,
  shell,
  screw,
  form,
  pill,
  pathPoint,
} from './bench.mjs';
import {
  assets,
  report,
  reportDecision,
  routes,
  route,
  slots,
  readLocal,
  approvedLength,
  manifest,
  bundle,
  receipts,
  receiptReason,
  tokenChoices,
  topTwoMargin,
  auditAt,
  manuals,
} from './examples.mjs';
export function privacy(ctx, c) {
  const i = c.beat.id;
  const opened = i === 'payload' ? c.reveal('Open this crash report', 1.2) : 1;
  const tried = i === 'blocked' ? c.reveal('The gate blocks', 0.7) : 0;
  const blocked = tried === 1 && !reportDecision.allowed;
  base(ctx, 'Can this report leave the handheld?', 'DATA BOUNDARY');
  box(ctx, 34, 113, 664, 312, '#e1e8d7', 17, C.bezel, 2);
  txt(ctx, 'Handheld  /  crash reporter', 54, 137, 19, C.dark, { weight: 600 });
  const x = 74 + tried * 152,
    y = 261;
  box(ctx, x, y - 44, 340, 142, '#bd996d', 5, C.orange);
  for (let j = 0; j < 2; j++) {
    const asset = report[j],
      dy = opened * (95 - j * 56);
    form(ctx, x + 15, y - 16 - dy, 307, 63);
    txt(ctx, asset === 'metrics' ? 'Metrics' : 'Manual M7', x + 31, y + 7 - dy, 19);
    txt(ctx, assets[asset], x + 305, y + 7 - dy, 17, asset === 'manual' ? C.pink : C.green, {
      align: 'right',
    });
  }
  box(ctx, x, y, 340, 98, '#edc191', 6, C.orange);
  line(
    ctx,
    [
      [x + 4, y + 4],
      [x + 170, y + 57],
      [x + 336, y + 4],
    ],
    '#b57b4d',
    2,
  );
  box(ctx, x + 67, y + 53, 206, 30, C.paper, 3);
  txt(ctx, 'Caller label   public', x + 170, y + 69, 16, C.ink, { align: 'center' });
  line(
    ctx,
    [
      [x + 342, 315],
      [605, 315],
    ],
    C.muted,
    2,
  );
  box(ctx, 611, 219, 18, 184, C.bezel, 6);
  for (let j = 0; j < 5; j++) box(ctx, 609, 230 + j * 34, 22, 9, blocked ? C.pink : C.copper, 1);
  txt(ctx, 'Egress', 622, 195, 18, C.muted, { align: 'center' });
  txt(ctx, 'Upload service', 821, 261, 22, C.muted, { align: 'center' });
  box(ctx, 775, 295, 92, 59, '#dddccf', 5, C.metal);
  for (let j = 0; j < 3; j++)
    line(
      ctx,
      [
        [787, 309 + j * 14],
        [852, 309 + j * 14],
      ],
      C.metal,
      2,
    );
  if (blocked) pill(ctx, 'Blocked', 654, 365, 111, C.pink);
  note(
    ctx,
    blocked
      ? 'Restricted manual in the attachment   ·   zero bytes uploaded.'
      : 'The trusted policy covers the complete payload and its destination.',
  );
}
function margin(ctx, c) {
  base(ctx, 'Which word does the model favor?', 'ONE DRAFT  /  SENSOR A');
  txt(ctx, 'Next token at the same prefix', 49, 127, 22);
  const start = 220,
    width = 590;
  tokenChoices.forEach(({ word, p }, j) => {
    const y = 204 + 75 * j;
    txt(ctx, word, 54, y, 24);
    box(ctx, start, y - 13, width, 26, C.track, 3);
    box(ctx, start, y - 13, width * p, 26, j ? C.green : C.plum, 3);
    mono(ctx, p.toFixed(2), 876, y, 24, C.ink, 'right');
  });
  const computed = at(c, 'point eight nine');
  txt(ctx, 'Top-two margin', 53, 369, 23, C.muted);
  mono(
    ctx,
    tokenChoices.map((r) => r.p.toFixed(2)).join(' − ') +
      (computed ? ' = ' + topTwoMargin.toFixed(2) : ''),
    302,
    369,
    26,
  );
  note(
    ctx,
    at(c, 'page M seven')
      ? 'Sensor A / E2   ·   M7 says “' + manuals.M7.meaning + '.” The draft favors “lens.”'
      : 'The gap measures the model’s preference at this position.',
  );
}

function audit(ctx, c) {
  const replay = c.beat.id === 'recheck';
  const counted = replay || (c.beat.id === 'tally' && at(c, 'Eight drafts reach'));
  const audited = replay || (c.beat.id === 'tally' && at(c, 'wrong source on draft eight'));
  const rates = replay || (c.beat.id === 'tally' && at(c, 'one error in eight'));
  const cutoff = replay && at(c, 'raise the cutoff') ? 0.9 : 0.8;
  const { rows, retained, errors, total } = auditAt(cutoff);
  base(ctx, 'How often is a retained answer wrong?', 'HELD-OUT MANUAL AUDIT');
  txt(
    ctx,
    'Assumed margin cutoff ≥ ' +
      cutoff.toFixed(2) +
      '   ·   all ten drafts passed the quotation check',
    43,
    120,
    20,
  );
  txt(ctx, 'Draft', 47, 198, 16, C.muted);
  txt(ctx, 'Margin', 47, 236, 16, C.muted);
  txt(ctx, 'Audit', 47, 287, 16, C.muted);
  rows.forEach((r, j) => {
    const x = 141 + 79 * j;
    const color = counted ? (r.kept ? C.green : C.muted) : C.muted;
    const auditColor = r.correct ? C.green : C.pink;
    box(ctx, x - 34, 172, 69, 91, counted && r.kept ? '#dce9cc' : C.paper, 5, color);
    mono(ctx, r.number, x, 198, 18, color, 'center');
    mono(ctx, r.score.toFixed(2), x, 236, 19, C.ink, 'center');
    // The independent source labels are the evidence for the prediction.
    txt(ctx, r.correct ? 'Right' : 'Wrong', x, 287, 15, auditColor, { align: 'center' });
    if (counted) txt(ctx, r.kept ? 'Local' : 'Defer', x, 319, 16, color, { align: 'center' });
    if (audited && !r.correct)
      line(
        ctx,
        [
          [x - 24, 301],
          [x + 24, 301],
        ],
        C.pink,
        3,
      );
  });
  if (counted)
    txt(
      ctx,
      'Coverage    ' + retained + ' / ' + total + '  =  ' + (100 * retained) / total + '%',
      61,
      386,
      24,
      C.green,
    );
  if (rates)
    txt(
      ctx,
      'Error among local answers    ' +
        errors +
        ' / ' +
        retained +
        '  =  ' +
        (100 * errors) / retained +
        '%',
      421,
      386,
      23,
      C.pink,
    );
  note(
    ctx,
    cutoff === 0.9
      ? 'At 0.80, 8 were local and 1 was wrong. At 0.90, all 3 local drafts were right.'
      : rates
        ? 'Draft 8 quotes M8 for sensor A. Its source applies to sensor B.'
        : 'Compare each draft with its own sensor and cited manual.',
  );
}

export function hybrid(ctx, c) {
  if (c.beat.id === 'margin') return margin(ctx, c);
  if (['audit', 'tally', 'recheck'].includes(c.beat.id)) return audit(ctx, c);
  base(ctx, 'Which route may this product choose?', 'OPTIONAL HYBRID MODE');
  txt(
    ctx,
    'Assumed cutoff 0.80   ·   valid score ≥ cutoff and source support → local answer',
    44,
    123,
    20,
  );
  txt(
    ctx,
    'Invalid score → local review. Cloud requires public data, approval, review and a connection.',
    44,
    160,
    18,
    C.muted,
  );
  const xs = [51, 103, 226, 364, 505, 689];
  ['Case', 'Score', 'Support', 'Payload', 'Other gates¹', 'Decision'].forEach((v, j) =>
    txt(ctx, v, xs[j], 216, 17, C.muted),
  );
  const upto =
    c.beat.id === 'flags'
      ? 0
      : at(c, 'can request the cloud route')
        ? 3
        : at(c, 'it answers locally')
          ? 2
          : at(c, 'goes to local review')
            ? 1
            : 0;
  routes.forEach((r, j) => {
    const y = 266 + 64 * j;
    line(
      ctx,
      [
        [45, y - 28],
        [915, y - 28],
      ],
      C.grid,
      1,
    );
    const items = [
      String.fromCharCode(65 + j),
      typeof r.score === 'boolean' ? 'True' : r.score.toFixed(2),
      r.supported ? 'Yes' : 'No',
      r.data,
      r.online ? 'All true' : 'Offline',
    ];
    items.forEach((v, k) => txt(ctx, v, xs[k], y, 20));
    if (j < upto)
      txt(
        ctx,
        route(r) === 'cloud allowed' ? 'Cloud permitted' : route(r),
        xs[5],
        y,
        20,
        j === 2 ? C.plum : C.green,
        { weight: 600 },
      );
  });
  txt(ctx, '¹ Approval, redaction review and connection.', 50, 434, 16, C.muted);
  note(ctx, 'A permission decision sends no bytes.');
}
function bay(ctx, x, y, name, count, active, accepted, short, failed = false) {
  const w = 390,
    h = 91;
  box(ctx, x, y, w, h, active ? '#e3ecd7' : '#f0ebdc', 9, active ? C.green : C.metal, 2);
  box(ctx, x + 9, y + 12, 44, 66, active ? C.green : C.muted, 4);
  mono(ctx, name, x + 31, y + 45, 30, C.white, 'center');
  txt(ctx, name === 'A' ? 'Approved v1' : 'Candidate v2', x + 66, y + 23, 21);
  txt(
    ctx,
    failed
      ? 'HEALTH FAILED'
      : active
        ? 'SERVING'
        : name === 'A'
          ? 'RETAINED'
          : accepted
            ? 'VERIFIED'
            : short
              ? 'INTERRUPTED'
              : 'STAGING',
    x + w - 14,
    y + 23,
    13,
    failed ? C.pink : active ? C.green : short ? C.pink : C.muted,
    { align: 'right', weight: 700 },
  );
  const total = name === 'A' ? approvedLength : manifest.length;
  const cells = 53,
    step = 4.2;
  for (let j = 0; j < cells; j++)
    box(
      ctx,
      x + 66 + j * step,
      y + 48,
      3.5,
      16,
      j < count ? (name === 'A' ? C.green : C.plum) : '#cccabe',
      1,
    );
  mono(ctx, count + '/' + total, x + w - 11, y + 56, 16, C.ink, 'right');
}
export function updates(ctx, c) {
  const i = c.beat.id;
  const interrupted = i === 'read' || (i === 'stage' && at(c, 'The cable comes out'));
  const full = bundle.length,
    partial = full - 4;
  let bytes = full;
  if (i === 'stage')
    bytes = interrupted
      ? partial
      : Math.floor(34 * c.reveal('Watch the bytes', 2.8) + 14 * c.reveal('Slot A holds', 2.5));
  if (i === 'read') bytes = partial;
  if (i === 'retry') bytes = partial + Math.floor(4 * c.reveal('Reconnect the media', 2.1));
  const activate = i === 'health' || (i === 'retry' && at(c, 'Switch to B'));
  const failed = i === 'health' && at(c, 'probe fails');
  const restored = i === 'health' && at(c, 'Restore the compatible');
  const state = slots(bytes, activate, restored);
  const reading =
    i === 'read'
      ? c.reveal('Follow the read', 1.7)
      : i === 'health'
        ? c.reveal('Follow the next read', 1.7)
        : 0;
  const useRead = reading > 0,
    reply = reading === 1;
  const checked =
    (i === 'read' && at(c, 'B fails both')) ||
    (i === 'retry' && at(c, 'complete candidate passes')) ||
    i === 'health';
  base(ctx, 'Which bundle serves the next lookup?', 'DUAL-SLOT STORAGE');
  shell(ctx, 43, 148, 247, 230);
  box(ctx, 60, 166, 213, 191, C.screen, 7);
  txt(ctx, 'Local read', 77, 191, 18, C.muted);
  mono(ctx, 'A / E2', 76, 234, 33, C.ink);
  line(
    ctx,
    [
      [75, 263],
      [255, 263],
    ],
    C.metal,
    1,
  );
  if (reply) {
    const result = readLocal(state.active, 'A', 'E2');
    txt(ctx, result.citation + ' · ' + result.meaning, 76, 293, 20, C.green, { weight: 600 });
    txt(ctx, 'Read from slot ' + state.active, 76, 326, 16, C.muted);
  } else txt(ctx, 'Session ' + state.session, 76, 306, 20, C.muted);
  const ax = 503,
    upper = 143,
    lower = 279;
  const branch = (name) => [
    [290, 252],
    [375, 252],
    [375, name === 'A' ? upper + 44 : lower + 44],
    [ax, name === 'A' ? upper + 44 : lower + 44],
  ];
  for (const name of ['A', 'B'])
    line(
      ctx,
      branch(name),
      name === state.active ? C.green : C.grid,
      name === state.active ? 4 : 2,
    );
  dot(ctx, 375, 252, 7, C.bezel);
  const route = branch(state.active);
  if (useRead)
    dot(ctx, ...pathPoint(route, reading < 0.5 ? 2 * reading : 2 * (1 - reading)), 7, C.orange);
  bay(ctx, ax, upper, 'A', approvedLength, state.active === 'A', true, false);
  bay(
    ctx,
    ax,
    lower,
    'B',
    bytes,
    state.active === 'B',
    checked && state.checked.accepted,
    interrupted,
    failed,
  );
  txt(ctx, 'Approved media', 542, 407, 17, C.muted);
  line(
    ctx,
    [
      [693, 406],
      [750, 406],
      [750, 371],
    ],
    interrupted ? C.grid : C.plum,
    3,
  );
  if (interrupted) {
    box(ctx, 722, 395, 14, 20, C.linen);
    line(
      ctx,
      [
        [723, 411],
        [731, 399],
      ],
      C.pink,
      3,
    );
  }
  if (!interrupted && bytes < full) {
    const p = (c.elapsed * 1.1) % 1;
    dot(
      ctx,
      ...pathPoint(
        [
          [693, 406],
          [750, 406],
          [750, 371],
        ],
        p,
      ),
      5,
      C.plum,
    );
  }
  let status = 'Write only to the inactive slot. The serving pointer stays on A.';
  if (interrupted)
    status = 'Interrupted at ' + bytes + ' of ' + full + ' bytes. Which bundle is still complete?';
  if (i === 'read' && reply)
    status = checked
      ? 'A serves the lookup. B fails signed length and SHA-256 checks.'
      : 'Read from A / v1. The partial candidate cannot activate.';
  if (i === 'retry' && checked)
    status = activate
      ? 'Pointer → B / v2. Session 2 starts with an empty cache.'
      : 'Manifest signature, length, hash, version and compatibility pass.';
  if (i === 'health')
    status = restored
      ? 'Recovery → A / v1. Session 3 starts on the approved bundle.'
      : failed
        ? 'Health check failed on B. Restore the approved fallback.'
        : 'Serving B / v2. The approved A bundle is retained.';
  note(ctx, status);
}
export function receipt(ctx, c) {
  const ready = c.beat.id === 'eligible' && at(c, 'C survives');
  base(ctx, 'Which candidate could the crew stage?', 'SIGNED RECEIPTS');
  txt(ctx, 'All signatures and devices match. Minimum version 7. Check time 100.', 45, 122, 21);
  const xs = [64, 216, 356, 514, 703];
  ['Receipt', 'Version', 'Expiry', 'Bytes match?', 'Decision'].forEach((v, k) =>
    txt(ctx, v, xs[k], 181, 17, C.muted),
  );
  receipts.forEach((r, j) => {
    const y = 231 + j * 56;
    line(
      ctx,
      [
        [48, y - 27],
        [915, y - 27],
      ],
      C.grid,
      1,
    );
    [r[0], r[1], r[2], r[3] ? 'Yes' : 'No'].forEach((v, k) => mono(ctx, v, xs[k], y, 21));
    if (ready)
      txt(ctx, receiptReason(r), xs[4], y, 21, receiptReason(r) === 'Eligible' ? C.green : C.pink);
  });
  note(
    ctx,
    ready
      ? 'C clears these receipt checks. Health and recovery still need testing.'
      : 'Check version ≥ 7, expiry > 100 and bytes against the signed manifest.',
  );
}
