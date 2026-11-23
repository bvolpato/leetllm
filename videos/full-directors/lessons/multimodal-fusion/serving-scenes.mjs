import * as M from './model.mjs';
import {
  P,
  fill,
  box,
  line,
  mono,
  label,
  serif,
  opacity,
  corner,
  page,
  footer,
  cue,
  resolved,
  viewport,
  plot,
  arrow,
  ruler,
} from './art.mjs';
const fmt = M.format;
const axisX = 110,
  factor = 0.304,
  pos = (n) => axisX + n * factor;
function tokenBand(c, start, n, y, h, col, tag = '') {
  fill(c, pos(start), y, n * factor, h, col);
  if (tag) mono(c, tag, pos(start + n / 2), y + h / 2, 25, P.light, 'center');
}
function viewIcon(c, x, y, i) {
  box(c, x, y, 126, 68, P.panel, null, 6);
  for (let j = 0; j < 4; j++)
    line(c, x + 11 + j * 32, y + 47 - j * 6, x + 36 + j * 26, y + 49 - j * 11, P.green, 3);
  if (i) corner(c, x + 12 + i * 11, y + 12, 35, 28, P.gold, 6, 2);
  mono(c, i ? 'Crop ' + i : 'Global', x + 63, y + 98, 23, P.muted, 'center');
}
export function budget(c, k) {
  const b = k.beat.beatIndex,
    top = 482,
    dem = 692,
    price = M.direct,
    small = M.reduced;
  const reply = cue(k, 1, 'Reserve the reply', 0.9);
  const laid = cue(k, 0, 'Lay the transcript', 1.5);
  const per = resolved(k, 4, 'It fits') ? M.queries : M.vision;
  const compact = per === M.queries;
  page(c, 'How many views fit beside the reply?', 'Prefix admission   /   4,096-token context');
  for (let i = 0; i < M.views; i++) viewIcon(c, 114 + i * 152, 247, i);
  mono(c, 'INPUT VIEWS', 930, 263);
  label(
    c,
    (compact
      ? 'Reduced: 32 states'
      : b === 3 || b === 4
        ? 'Try a reducer: 32 states'
        : 'Direct projection: 576 positions') + ' per view',
    930,
    324,
    35,
  );
  label(c, 'Transcript 2,000   +   template 100   +   question 100', 110, 418, 30, P.muted);
  box(c, pos(0), top, M.windowSize * factor, 74, '#dbdfd4', null, 0);
  tokenBand(c, 0, M.textCount, top, 74, P.panel2, 'Text  2,200');
  opacity(c, reply, () => {
    tokenBand(c, M.windowSize - M.reserve, M.reserve, top, 74, '#866223');
    mono(c, 'Reply 300', pos(M.windowSize) + 34, top + 38, 27, P.ink);
    line(
      c,
      pos(M.windowSize - M.reserve),
      top - 18,
      pos(M.windowSize - M.reserve),
      dem + 80,
      P.red,
      2,
      [7, 7],
    );
  });
  line(c, pos(M.windowSize), top - 14, pos(M.windowSize), top + 84, P.ink, 4);
  if (reply === 1)
    mono(
      c,
      fmt(M.windowSize - M.reserve),
      pos(M.windowSize - M.reserve) - 8,
      top - 27,
      24,
      P.red,
      'right',
    );
  mono(c, compact ? 'REDUCED PREFIX' : 'DIRECT PREFIX DEMAND', 110, 633, 25);
  tokenBand(c, 0, M.textCount, dem, 64, P.panel2, 'Text  2,200');
  const two = resolved(k, 2, 'Two full views fit'),
    three = resolved(k, 2, 'The third'),
    all = resolved(k, 2, 'Lay out all five');
  const fitted = compact ? M.views : two ? M.direct.slots : 0;
  const count = compact ? M.views : Math.ceil(laid * M.views);
  for (let i = 0; i < count; i++) {
    const start = M.textCount + i * per;
    const beyond = !compact && i >= price.slots;
    const examined = all || (three && i === 2);
    const col = compact ? P.teal : beyond && examined ? '#93534b' : ['#406a80', '#527c91'][i % 2];
    tokenBand(c, start, per, dem, 64, col, compact ? '' : i ? 'Crop ' + i : 'Global');
    line(c, pos(start), dem, pos(start), dem + 64, P.paper, 2);
    if (i < fitted && reply) {
      tokenBand(
        c,
        start,
        per,
        top,
        74,
        compact ? P.teal : '#406a80',
        compact ? '' : i ? 'Crop ' + i : 'Global',
      );
      line(c, pos(start), top, pos(start), top + 74, P.paper, 2);
    }
  }
  if (reply > 0)
    opacity(c, reply, () => {
      const boundary = pos(M.windowSize - M.reserve);
      for (const y of [dem - 9, dem + 64]) line(c, boundary, y, boundary, y + 9, P.red, 4);
      line(c, boundary, dem, boundary, dem + 64, P.gold, 3, [7, 5]);
    });
  ruler(c, pos(0), 795, factor * 5400, 5400, [0, 1000, 2200, 3000, 4096, 5080]);
  let main = 'Place the five views on the same token scale as the text.';
  let sub = 'Capacity allocation in tokens. The model template determines serialization order.';
  if (b === 1) {
    main = 'How many 576-position views fit before the reply?';
    sub = 'The window stays fixed while input demand grows.';
  }
  if (b === 2 && two) {
    main =
      'Two direct views fit in the ' +
      fmt(M.windowSize - M.reserve - M.textCount) +
      ' positions left for vision.';
  }
  if ((b === 2 && resolved(k, 2, 'That is')) || b >= 3) {
    main = 'All five direct views request ' + fmt(price.total) + ' positions including the reply.';
    sub =
      'Prefix ' +
      fmt(price.prefix) +
      '   +   reply ' +
      M.reserve +
      '   =   ' +
      fmt(price.total) +
      '     /     window ' +
      fmt(M.windowSize);
  }
  if (b === 3 || (b === 4 && !compact))
    sub = 'Keep all five views. Predict the reservation at 32 states per view.';
  if (compact) {
    main =
      'Reduced request: ' +
      fmt(small.t) +
      ' text + ' +
      small.visual +
      ' visual + ' +
      small.r +
      ' reply = ' +
      fmt(small.total) +
      '.';
    sub = fmt(small.free) + ' positions remain. Verify the legend separately.';
  }
  footer(c, main, sub);
}
export function crops(c, k) {
  const b = k.beat.beatIndex;
  if (b === 2) {
    page(c, 'How many states come from forty seconds?', 'Audio frontend   /   optional recording');
    mono(c, 'ORIGINAL SAMPLE TIME', 110, 307);
    const x = 110,
      y = 470,
      w = 1620;
    line(c, x, y, x + w, y, P.rule, 2);
    for (let i = 0; i < 360; i++) {
      const h =
        8 + 88 * Math.abs(Math.sin(i * 0.217) * Math.sin(i * 0.033) + 0.35 * Math.cos(i * 0.441));
      line(c, x + (i * w) / 360, y - h / 2, x + (i * w) / 360, y + h / 2, P.teal, 3);
    }
    [0, 10, 20, 30, 40].forEach((t) =>
      mono(c, t + ' s', x + (t / 40) * w, y + 105, 26, P.muted, 'center'),
    );
    const group = cue(k, 2, 'Group ten', 1);
    opacity(c, group, () => {
      for (let i = 0; i < 40; i++)
        fill(c, x + (i * w) / 40, 647, w / 40 - 3, 44, i % 2 ? P.panel2 : '#4f7d85');
    });
    label(c, '100 frontend steps / s', 110, 769, 35);
    const ready = resolved(k, 2, 'A transcript-only');
    footer(
      c,
      ready
        ? fmt(M.audioSteps) + ' steps ÷ 10 per group = ' + M.audioStates + ' audio states.'
        : 'Group ten consecutive steps and retain each source interval.',
      'Each drawn section of the lower strip represents one second, or ten grouped states.',
    );
    return;
  }
  const choose = resolved(k, 1, 'The axis wins');
  page(c, 'Which detail gets the last view?', 'Crop selection   /   two-view cap');
  mono(c, 'ORIGINAL SCREENSHOT', 95, 289, 25, P.teal);
  viewport(c, 95, 335, 0.93, () => plot(c, { showBadge: true }));
  mono(c, 'RESERVED', 1150, 305);
  label(c, 'Global thumbnail', 1150, 362, 41);
  line(c, 1150, 411, 1800, 411, P.rule, 2);
  mono(c, 'LOCAL REGION', 1150, 463);
  mono(c, 'SCORE', 1780, 463, 27, P.muted, 'right');
  M.localCrops.forEach(({ name, score }, i) => {
    const yy = 534 + i * 91;
    if (choose && M.selected.includes(name)) box(c, 1128, yy - 38, 680, 76, '#d5e4d4');
    label(c, name, 1150, yy, 36);
    mono(c, score.toFixed(2), 1775, yy, 36, P.ink, 'right');
  });
  if (choose) viewport(c, 95, 335, 0.93, () => corner(c, 64, 342, 904, 51, P.gold, 16, 5));
  footer(
    c,
    choose
      ? 'Thumbnail + time axis. The service name still needs a readable legend.'
      : 'Reserve the thumbnail, then rank the three local crops.',
    choose
      ? 'Request the original legend on a slower authorized route, or withhold the name.'
      : 'The tiny labels are unreadable at thumbnail resolution. The larger picture shows the original.',
  );
}
export function reuse(c, k) {
  const b = k.beat.beatIndex;
  if (b === 3) {
    page(
      c,
      'What does an admitted token cost in cache?',
      'Decoder cache   /   hypothetical logical reservation',
    );
    mono(c, 'PER TOKEN', 110, 299);
    const dims = [
      ['K + V', 2],
      ['Layers', M.kv.layers],
      ['KV heads', M.kv.heads],
      ['Head width', M.kv.width],
      ['Bytes', M.kv.bytes],
    ];
    dims.forEach(([name, n], i) => {
      const x = 114 + i * 341;
      box(c, x, 373, 267, 180, P.panel);
      mono(c, name, x + 133, 424, 26, P.dim, 'center');
      serif(c, n, x + 133, 497, 63, P.light, 'center');
      if (i < 4) label(c, '×', x + 305, 459, 40, P.muted, { align: 'center' });
    });
    const result = resolved(k, 3, 'Multiply by');
    serif(
      c,
      result ? fmt(M.tokenBytes) + ' bytes  =  128 KiB per position' : 'Bytes per cached token',
      112,
      677,
      61,
    );
    const total = resolved(k, 3, 'Weights');
    footer(
      c,
      total
        ? fmt(M.reduced.total) + ' positions × 128 KiB = ' + M.logicalMiB(M.reduced.total) + ' MiB.'
        : 'Count the keys and values at every decoder layer.',
      'Logical reservation includes possible reply tokens. Physical allocation depends on the runtime.',
    );
    return;
  }
  const hit =
    b === 0 && !resolved(k, 0, 'A hit on projected tokens')
      ? 'features'
      : b === 1 && resolved(k, 1, 'A compatible prefix')
        ? 'kv'
        : b === 2
          ? 'kv'
          : 'projected';
  const deny = b === 2 && resolved(k, 2, 'A second question');
  page(
    c,
    deny ? 'Can this caller read the saved evidence?' : 'What work does a cache hit save?',
    'Follow-up question   /   same screenshot',
  );
  const stages = M.cacheRun(hit);
  mono(c, 'COMPATIBLE ARTIFACT', 115, 338);
  serif(
    c,
    hit === 'kv'
      ? 'Decoder prefix KV'
      : hit === 'features'
        ? 'Vision encoder features'
        : 'Projected visual tokens',
    115,
    416,
    63,
  );
  const predict = b === 0;
  for (let i = 0; i < stages.length; i++) {
    const { label: name, run } = stages[i],
      x = 110 + i * 345;
    if (i < 4) arrow(c, x + 291, 607, x + 338, 607, P.rule);
    box(c, x, 540, 290, 137, deny ? '#d6d9d0' : run ? P.panel : P.teal);
    label(c, name, x + 145, 586, 31, deny ? P.muted : P.light, { align: 'center' });
    mono(
      c,
      deny ? 'BLOCKED' : !run ? 'REUSED' : predict ? '?' : 'RUN',
      x + 145,
      641,
      25,
      deny ? P.red : P.light,
      'center',
    );
  }
  if (deny) {
    corner(c, 102, 529, 1684, 158, P.red, 20, 4);
    footer(
      c,
      'Access revoked. Deny this read before returning any cached evidence.',
      'Retention policy governs the stored bytes separately.',
    );
  } else if (hit === 'kv')
    footer(
      c,
      'Compatible prefix KV covers ' + fmt(M.shared) + ' shared positions.',
      'New question prefill and answer decode still run.',
    );
  else if (predict)
    footer(
      c,
      'Which work remains downstream of this saved artifact?',
      'Reusing an artifact saves only stages represented by that artifact.',
    );
  else
    footer(
      c,
      'Run both prefills, then decode.',
      'Shared prefix = 100 template + 160 visual + 2,000 transcript positions.',
    );
}
