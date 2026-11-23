import {
  C,
  base,
  big,
  bidx,
  bracket,
  clamp,
  cue,
  ease,
  fmt,
  foot,
  hatch,
  kv,
  label,
  line,
  mark,
  mid,
  mono,
  rect,
  txt,
  weight,
} from './art.mjs';
import {
  architecture,
  bytesPerToken,
  GiB,
  growth,
  hardware,
  ids,
  longGeometry,
  opening,
  pages,
  poolGiB,
  prefixPageState,
  referencePoolBytes,
  runtime,
  size,
  weights,
} from './model.mjs';

function contacts(c, x, y, w) {
  for (let i = 12; i < w - 8; i += 18) rect(c, x + i, y, 8, 12, '#ad9b72');
}
export function intro(c, k) {
  const b = bidx(k),
    grown = cue(k, 0, 'all three strips grow'),
    release = cue(k, 2, 'Now the neighbor finishes');
  const travel = ease(cue(k, 2, 'Move the patch', 0.85)),
    admitted = travel === 1;
  const s = opening(!!grown, !!release, admitted);
  base(c, k, 'Replica cross section', 'Can the next patch start?');
  const x = 100,
    y = 310,
    w = 1648,
    h = 106,
    unit = w / 32,
    poolX = x + (weights + runtime) * unit;
  rect(c, x - 12, y - 14, w + 24, h + 31, '#d3d8cb', C.ink, 3);
  contacts(c, x, y + h + 17, w);
  weight(c, x, y, weights * unit, h);
  hatch(c, x + weights * unit, y, runtime * unit, h, C.light, '#899180');
  rect(c, poolX, y, poolGiB * unit, h, C.white);
  txt(c, 'Shared weights', x, 277, 37, C.blue);
  txt(c, 'Runtime', x + weights * unit, 277, 33, C.dim);
  txt(c, 'Private histories', poolX, 277, 37, C.sea);
  let px = poolX;
  for (let j = 0; j < (release ? 2 : 3); j++) {
    const width = ((s.tokens[j] * bytesPerToken) / GiB) * unit;
    kv(c, px, y, width, h, j);
    line(c, px, y, px, y + h, C.paper, 4);
    if (width > 100) mid(c, 'Thread ' + ids[j], px + width / 2, y + 45, 33, C.white);
    px += width;
  }
  if (admitted) {
    kv(c, px, y, 0.5 * unit, h, 3);
    hatch(c, px + 0.5 * unit, y, (s.patch - 0.5) * unit, h, '#f1cf9f', C.amber, 6);
  }
  mono(c, '12 GiB', x + 25, y + 67, 40, C.white);
  if (b === 0) {
    label(c, 'Magnified ends of the three histories', 100, 510);
    const move = ease(cue(k, 0, 'When the GPU processes', 0.85));
    for (let j = 0; j < 3; j++) {
      const dx = 110 + j * 565;
      mono(c, 'Thread ' + ids[j], dx, 585, 34);
      for (let t = 0; t < 8; t++) {
        const present = t < 7 || grown;
        if (present) kv(c, dx + t * 51, 612, 46, 77, j);
        else rect(c, dx + t * 51, 612, 46, 77, C.white, C.rule);
      }
      if (!grown && move) mark(c, dx + 7 * 51 + 23, 600 - 22 * (1 - move), 16, C.amber);
      mono(c, fmt(s.tokens[j]) + ' positions', dx, 753, 33, C.sea);
    }
    foot(c, 'One weight allocation serves all three conversations.');
    return;
  }
  const zoomX = 410,
    zy = 660,
    scale = 1200,
    edge = zoomX + scale;
  line(c, x + w - unit, 432, zoomX, 550, C.rule, 2);
  line(c, x + w, 432, edge, 550, C.rule, 2);
  label(c, 'Last 1 GiB of the pool', 100, 505);
  rect(c, zoomX, zy, scale, 80, C.white, C.ink, 3);
  if (!release) {
    kv(c, zoomX, zy, 0.5 * scale, 80, 2);
    mid(c, 'C', zoomX + 0.25 * scale, zy + 42, 32, C.white);
  }
  const showExtra = cue(k, 1, 'It also needs');
  const startX = zoomX + 0.5 * (1 - travel) * scale;
  const startY = zy - (1 - travel) * 125;
  const arrived = ease(cue(k, 1, 'A new patch', 0.7));
  if (arrived > 0) {
    const xx = startX + (1 - arrived) * 65;
    kv(c, xx, startY, scale * 0.5, 56, 3);
    mid(c, 'Patch prompt  ·  ½ GiB', xx + scale * 0.25, startY + 38, 31, C.white);
    if (showExtra) {
      hatch(c, xx + scale * 0.5, startY, scale * (s.patch - 0.5), 56, '#f6d4a4', C.amber);
      mid(c, '⅛ GiB', xx + scale * 0.5625, startY + 40, 34);
    }
  }
  mark(c, edge, zy - 18, 114);
  mono(c, 'Pool edge', edge, 795, 26, C.orange, 'center');
  mono(c, 'Free  ' + fmt(s.remaining) + ' GiB', 100, 789, 31, C.sea);
  const fitWord = admitted
    ? 'Admit the patch. Its prompt and reply allowance both fit.'
    : release
      ? 'C released its half gibibyte.'
      : b === 2 && cue(k, 2, 'It has to wait')
        ? 'Wait. The reservation extends beyond the pool edge.'
        : showExtra
          ? 'Will the prompt and its reply allowance fit together?'
          : 'Compare the waiting patch with the free space.';
  foot(c, fitWord);
}
function stack(c, layers) {
  const x = 130,
    y = 377,
    w = 619,
    h = 252;
  for (let i = layers - 1; i >= 0; i--) {
    const d = 1.52 * i;
    rect(c, x + d, y - d, w, h, i ? '#c8d3c6' : C.white, i ? '#718980' : C.ink, i ? 0.65 : 3);
  }
  rect(c, x, y - 38, w, 39, C.blue);
  txt(c, 'Keys', x + 12, y - 9, 28, C.white);
  txt(c, 'Values', x + w / 2 + 10, y - 9, 28, C.white);
  for (let head = 0; head < architecture.kvHeads; head++) {
    for (let side = 0; side < 2; side++) {
      const dx = x + 6 + (side * w) / 2,
        dy = y + 6 + head * 30;
      rect(c, dx, dy, w / 2 - 14, 25, side ? '#468575' : '#3d6176');
      const pitch = (w / 2 - 14) / architecture.headWidth;
      for (let tap = 0; tap < architecture.headWidth; tap++) {
        const shade = (head * 17 + tap * 11 + side * 7) % 13;
        rect(
          c,
          dx + tap * pitch,
          dy + 3,
          pitch,
          19,
          side
            ? ['#bad9b8', '#88b19b', '#468575'][shade % 3]
            : ['#90b7bf', '#7695a6', '#355773'][shade % 3],
        );
      }
    }
  }
  bracket(c, x, x + w / 2 - 6, y + h + 22, '128 elements');
  bracket(c, x + w / 2 + 6, x + w, y + h + 22, '128 elements');
  mono(c, layers + ' layers  ·  8 KV heads  ·  2 B/element', x, 761, 30);
}
export function geometry(c, k) {
  const b = bidx(k),
    large = cue(k, 2, 'With eighty layers'),
    g = large ? longGeometry : architecture;
  if (b === 3) {
    base(c, k, 'Sequence sharding', 'What if one history is too large?');
    const total = size(longGeometry, 1e6) / GiB;
    label(c, 'Hypothetical 1,000,000-position history  ·  70B geometry', 110, 307);
    const split = ease(cue(k, 3, 'Divide the sequence', 0.95));
    for (let j = 0; j < 4; j++) {
      const x = 125 + j * 398 + (j - 1.5) * 42 * split,
        y = 404 + (j % 2 ? 33 : -12) * split;
      kv(c, x, y, 394, 145, j);
      if (split === 1) {
        mid(c, 'Device ' + (j + 1), x + 197, y - 22, 34);
        mono(c, (total / 4).toFixed(1) + ' GiB', x + 197, y + 90, 44, C.white, 'center');
      }
    }
    bracket(c, 116, 1765, 640, total.toFixed(1) + ' GiB of KV across the sequence');
    foot(c, 'Weights, buffers and cross-device attention still need a budget.');
    return;
  }
  base(c, k, 'Cache geometry', 'What does one retained position weigh?');
  stack(c, g.layers);
  txt(c, large ? '70B architecture' : '8B architecture', 944, 333, 41, C.sea, 'Sans', 'left', 600);
  mono(c, '2 × ' + g.layers + ' × 8 × 128 × 2 B', 944, 426, 44);
  const reveal = large || cue(k, 1, "That's one hundred");
  big(c, reveal ? fmt(size(g, 1) / 1024) + ' KiB' : '?', 941, 570, 110, C.blue);
  label(c, 'per consumed position', 947, 633);
  if (large && cue(k, 2, 'At eight thousand'))
    mono(c, '8,192 positions  →  ' + fmt(size(g, 8192) / GiB) + ' GiB', 947, 727, 33);
  else if (!large && cue(k, 1, 'At four thousand'))
    mono(c, '4,096 positions  →  ' + fmt(size(g, 4096) / GiB) + ' GiB', 947, 727, 33);
  foot(
    c,
    large && cue(k, 2, 'Sixty-four such')
      ? '64 independent histories × 2.5 GiB = ' + fmt((64 * size(g, 8192)) / GiB) + ' GiB of KV'
      : 'The checkpoint sets the geometry. The cache format sets bytes per element.',
  );
}
export function partition(c, k) {
  const b = bidx(k),
    ref = b === 3;
  const total = ref ? 80e9 / GiB : hardware.total / GiB,
    wg = ref ? 16e9 / GiB : weights,
    rg = ref ? 8 : runtime;
  const knownWeight = ref || cue(k, 0, 'Loading its weight'),
    knownRuntime = ref || cue(k, 1, 'Set aside'),
    knownPool = ref || cue(k, 2, 'Sixteen gibibytes');
  const x = 100,
    y = 399,
    w = 1716,
    h = 144;
  const scale = w / total,
    fx = x + (wg + rg) * scale;
  const phase = cue(k, 2, 'Release an owner');
  base(
    c,
    k,
    ref ? 'Decimal byte budget' : 'Device memory',
    'Which bytes can the allocator promise?',
  );
  label(
    c,
    ref ? 'Separate fixture  ·  80,000,000,000 bytes' : 'One replica  ·  32 GiB device budget',
    100,
    307,
  );
  rect(c, x - 7, y - 7, w + 14, h + 14, C.light, C.ink, 3);
  contacts(c, x, y + h + 8, w);
  rect(c, x, y, w, h, C.white);
  if (knownWeight) {
    weight(c, x, y, wg * scale, h);
    mid(c, 'Weights', x + (wg * scale) / 2, y + 61, 37, C.white);
    mono(c, fmt(+wg.toFixed(2)) + ' GiB', x + (wg * scale) / 2, y + 109, 33, C.white, 'center');
  }
  if (knownRuntime) {
    hatch(c, x + wg * scale, y, rg * scale, h, C.light, '#a7b19e', 22);
    mid(c, 'Runtime', x + (wg + rg / 2) * scale, y + 60, 33);
    mono(c, rg + ' GiB', x + (wg + rg / 2) * scale, y + 108, 33, C.ink, 'center');
  }
  const avail = total - wg - rg;
  if (knownPool) {
    if (ref) {
      kv(c, fx, y, avail * scale, h);
      mid(c, 'KV pool', fx + (avail * scale) / 2, y + 60, 38, C.white);
      mono(c, avail.toFixed(2) + ' GiB', fx + (avail * scale) / 2, y + 106, 36, C.white, 'center');
    } else {
      for (let j = 0; j < 8; j++) {
        const dx = fx + (j * avail * scale) / 8;
        if (j < (phase ? 2 : 3)) kv(c, dx, y, (avail * scale) / 8 - 4, h, j);
        else rect(c, dx, y, (avail * scale) / 8 - 4, h, C.bare, C.rule);
      }
      bracket(c, fx, fx + avail * scale, y + h + 44, '16 GiB resident');
    }
  }
  if (ref) {
    mono(c, '(80 − 16) × 10⁹ bytes ÷ 2³⁰  −  8 GiB  ≈  ' + avail.toFixed(2) + ' GiB', 100, 668, 36);
    const growthSet = cue(k, 3, 'Give each five hundred');
    if (cue(k, 3, 'That holds')) {
      const each = ((growthSet ? 4608 : 4096) * bytesPerToken) / GiB;
      txt(
        c,
        fmt(each) +
          ' GiB per history     →     ' +
          Math.floor(referencePoolBytes / (each * GiB)) +
          ' whole requests',
        100,
        756,
        46,
        C.sea,
      );
    }
  } else if (knownPool) {
    mono(
      c,
      (phase ? 2 : 3) + ' owned regions  ·  ' + (phase ? 6 : 5) + ' reusable regions',
      100,
      735,
      36,
    );
  } else {
    txt(
      c,
      knownRuntime
        ? 'How much of the device can hold request state?'
        : 'One shared allocation for the whole batch',
      100,
      690,
      45,
      C.blue,
      'Serif',
    );
  }
  foot(
    c,
    ref
      ? '1 GB = 1,000,000,000 bytes     ·     1 GiB = 1,073,741,824 bytes'
      : 'Measure peak workspace for the shapes and kernels you serve.',
  );
}
export function reserve(c, k) {
  const b = bidx(k);
  const promptCue = 'Give every patch a longer prompt';
  const promptSpan = b === 2
    ? k.wordCue('sixteen thousand three hundred eighty-four positions').end - k.wordCue(promptCue).start
    : 0;
  const trial = cue(k, 2, promptCue, promptSpan),
    selected = trial > 0 ? 2 : cue(k, 1, 'reserve another') ? 1 : 0;
  const r = growth[selected],
    prompt = selected === 2 ? Math.round(growth[1].p + (r.p - growth[1].p) * ease(trial)) : r.p,
    promptGiB = (prompt * bytesPerToken) / GiB,
    outputGiB = (r.o * bytesPerToken) / GiB,
    requestGiB = promptGiB + outputGiB,
    reveal =
      selected === 0 ||
      (selected === 1 && cue(k, 1, 'twenty-five fit')) ||
      (selected === 2 && cue(k, 3, 'Seven'));
  base(c, k, 'Admission ruler', 'How many answers can keep growing?');
  const x = 108,
    y = 580,
    w = 1584,
    unit = w / poolGiB;
  label(c, 'One request', x, 306);
  kv(c, x, 345, unit * promptGiB, 72);
  if (r.o)
    hatch(
      c,
      x + unit * promptGiB,
      345,
      unit * outputGiB,
      72,
      '#edc699',
      C.amber,
      6,
    );
  mono(c, fmt(prompt) + ' prompt  +  ' + fmt(r.o) + ' output', 453, 366, 41);
  txt(c, fmt(+requestGiB.toFixed(3)) + ' GiB per complete reservation', 453, 426, 37, C.dim);
  label(c, 'Equal, private reservations in a 16 GiB pool', x, 531);
  rect(c, x, y, w, 106, C.white, C.rule);
  const fill = selected === 2 ? ease(cue(k, 3, 'Seven', 0.9)) : Number(reveal);
  const copies = 1 + (r.count - 1) * fill;
  for (let i = 0; i < copies; i++) {
    const xx = x + i * requestGiB * unit;
    const partial = copies - i < 1;
    if (partial) {
      c.save();
      c.beginPath();
      c.rect(xx, y, requestGiB * unit * (copies - i), 106);
      c.clip();
    }
    kv(c, xx, y, promptGiB * unit, 106, i);
    if (r.o)
      hatch(c, xx + promptGiB * unit, y, outputGiB * unit, 106, '#edc699', C.amber, 8);
    line(c, xx, y, xx, y + 106, C.paper, 3);
    if (partial) c.restore();
  }
  mark(c, x + w, y - 19, 148);
  mono(c, '16 GiB', x + w, y + 160, 28, C.orange, 'center');
  const eighth = ease(cue(k, 3, 'The eighth would cross', 0.75));
  if (eighth > 0) {
    const xx = x + r.occupied * unit;
    c.save();
    c.setLineDash([10, 8]);
    rect(c, xx, y + 4, eighth * r.gib * unit, 98, null, C.orange, 4);
    c.restore();
    if (eighth === 1) {
      const attempted = r.count + 1;
      mono(c, '8th', xx + 16, y + 67, 32, C.orange);
      mono(c, attempted + ' × ' + fmt(r.gib) + ' = ' + fmt(attempted * r.gib) + ' GiB',
        1128, 759, 33, C.orange);
    }
  }
  if (fill === 1) {
    mono(c, r.count + ' requests    ·    ' + fmt(r.free) + ' GiB free', x, 759, 36, C.sea);
  } else {
    mono(c, fill > 0 ? 'Packing whole reservations' : 'How many complete copies?', x, 759, 36, C.dim);
  }
  foot(
    c,
    trial
      ? 'Same pool and answer limit. Each longer prompt costs more.'
      : 'Charge current history and future output to the same pool.',
  );
}
export function blockTails(c, k) {
  const showB = cue(k, 1, 'B brings'),
    askC = cue(k, 1, 'C brings'),
    showC = cue(k, 2, 'Sixteen');
  base(c, k, 'Private allocation', 'Who owns the empty positions?');
  label(c, 'Prompt + reply positions', 100, 303);
  label(c, 'Final block  ·  color = promised, stripes = padding', 780, 303);
  for (let j = 0; j < (askC ? 3 : showB ? 2 : 1); j++) {
    const r = pages[j],
      y = 367 + j * 145,
      staged = j === 2 && !showC;
    big(c, r.owner, 99, y + 56, 69, C.blue);
    txt(c, fmt(r.prompt) + ' + ' + fmt(r.output) + ' = ' + fmt(r.logical), 184, y + 35, 39);
    mono(
      c,
      staged ? 'How many slots?' : fmt(r.blocks) + ' blocks  ·  ' + fmt(r.slots) + ' slots',
      184,
      y + 83,
      29,
      C.dim,
    );
    if (staged) {
      for (let i = 0; i < 4; i++) kv(c, 786 + i * 51, y + 7, 45, 59, 2);
      txt(c, '4 positions beyond B’s boundary', 1020, y + 53, 33, C.orange);
      continue;
    }
    for (let i = 0; i < 16; i++) {
      const xx = 780 + i * 49;
      if (i < r.lastUsed) kv(c, xx, y, 46, 65, j);
      else hatch(c, xx, y, 46, 65, '#e5d2b4', '#a78050', 10);
    }
    bracket(c, 780, 780 + 16 * 49 - 3, y + 76, '');
    txt(
      c,
      r.tail ? r.tail + ' owned, unused' : 'Exact fit',
      1594,
      y + 45,
      32,
      r.tail ? C.orange : C.sea,
    );
  }
  foot(
    c,
    showC && cue(k, 2, 'All eighteen')
      ? '6 + 0 + 12 = ' +
          pages.reduce((s, r) => s + r.tail, 0) +
          ' unused slots. Each belongs to its request.'
      : askC && !showC
        ? 'C needs four positions beyond B. How much more memory must C reserve?'
        : 'Round each request up to whole blocks before adding the bytes.',
  );
}
export function sharing(c, k) {
  const copied = cue(k, 1, 'Copy the three'),
    redirect = cue(k, 1, 'Redirect B'),
    append = cue(k, 1, 'A can append'),
    released = cue(k, 2, 'When A finishes');
  const stage = append ? 3 : redirect ? 2 : copied ? 1 : 0,
    m = prefixPageState(stage);
  base(c, k, 'Prefix ownership', 'Can two continuations write here?');
  const lanes = [390, 640],
    cx = 876;
  for (let j = 0; j < 2; j++) {
    const y = lanes[j],
      own = !(released && j === 0),
      addr = j ? m.B : m.A;
    mono(c, 'Request ' + ids[j], 108, y + 14, 43, own ? C.ink : C.dim);
    if (!own) {
      txt(c, 'finished', 400, y + 14, 36, C.dim);
      continue;
    }
    const target = addr === 7 ? lanes[0] : lanes[1];
    line(c, 384, y, 494, y, C.sea, 4);
    line(c, 494, y, 700, target, C.sea, 4);
    line(c, 700, target, 841, target, C.sea, 4);
    circleEnd(c, 841, target);
  }
  for (let j = 0; j < m.pages.length; j++) {
    const page = m.pages[j],
      y = lanes[j],
      free = released && j === 0;
    label(
      c,
      'Page ' +
        page.id +
        '   ·   ' +
        (free ? 'free' : page.references + ' reference' + (page.references === 1 ? '' : 's')),
      cx,
      y - 67,
    );
    const cell = 138;
    for (let i = 0; i < 4; i++) {
      const val = free ? null : page.values[i],
        x = cx + i * cell;
      rect(c, x, y - 42, cell - 4, 89, val ? (i === 3 ? '#e8b37e' : C.mint) : C.white, C.rule);
      if (val) big(c, val, x + (cell - 4) / 2, y + 22, 59, C.ink, 'center');
    }
  }
  foot(
    c,
    released
      ? 'Page 12 still belongs to B. Its prefix and continuation stay readable.'
      : stage === 0
        ? 'Two logical histories currently share one physical page.'
        : stage === 1
          ? 'Copy valid positions before redirecting the writer.'
          : 'Each writer now owns a private page with the same prefix.',
  );
}
function circleEnd(c, x, y) {
  c.beginPath();
  c.moveTo(x, y - 8);
  c.lineTo(x + 18, y);
  c.lineTo(x, y + 8);
  c.fillStyle = C.sea;
  c.fill();
}
