import assert from 'node:assert/strict';
import {
  freshQuantizationBudget,
  quantizationMemory,
  trailingPlacement,
} from '../../../films/quantization/arithmetic.mjs';
import {
  requestedDock,
  routeReplies,
  routingTrial,
} from '../../../films/quantization/routing-example.mjs';
import {
  night,
  day,
  base,
  txt,
  num,
  serif,
  box,
  line,
  dot,
  arrow,
  span,
  alpha,
  cue,
  spoken,
  fmt,
  tuple,
  smooth,
  mix,
  clamp,
  result,
  stripe,
} from './paint.mjs';

const qblock = { groups: 8, perGroup: 32, bits: 4, coeffBits: 12, sharedBytes: 4 };
const qcount = qblock.groups * qblock.perGroup,
  codes = (qcount * qblock.bits) / 8,
  coeff = (qblock.coeffBits * qblock.groups) / 8;
const blockBytes = codes + coeff + qblock.sharedBytes,
  bpw = (blockBytes * 8) / qcount;
const codeExample = { code: 5, scale: 3, d: 0.1, min: 2, dmin: 0.2 };
const rebuilt =
  codeExample.d * codeExample.scale * codeExample.code - codeExample.dmin * codeExample.min;
function ggufFile(ctx, P) {
  const x = 101,
    y = 365;
  box(ctx, x, y, 570, 393, P.soft, P.rule);
  num(ctx, 'GGUF', x + 26, y + 62, 56, P.ink);
  line(ctx, x, y + 114, x + 570, y + 114, P.rule, 3);
  txt(ctx, 'Architecture and tokenizer', x + 26, y + 158, 37, P.ink);
  line(ctx, x, y + 199, x + 570, y + 199, P.rule, 3);
  txt(ctx, 'Tensor types and offsets', x + 26, y + 244, 37, P.ink);
  box(ctx, x + 16, y + 300, 340, 69, P.mint);
  box(ctx, x + 365, y + 300, 188, 69, P.blue);
  num(ctx, 'Q4_K', x + 187, y + 336, 34, P.bg, 'center');
  num(ctx, 'BF16', x + 460, y + 336, 34, P.bg, 'center');
}
export function container(ctx, c) {
  const P = night,
    b = c.beat.beatIndex;
  base(ctx, P, 'Saved artifact  /  typed tensors', c.beat.chapterTitle);
  const example = b === 2 && cue(c, 2, 'Follow one code', 0);
  if (!example) ggufFile(ctx, P);
  txt(ctx, 'One Q4_K superblock', 820, 312, 46, P.ink);
  txt(ctx, '8 groups × 32 weights', 820, 391, 40, P.muted);
  const p0 = cue(c, 1, 'Its two hundred', 0.7),
    p1 = cue(c, 1, 'That makes twelve', 0.5),
    p2 = cue(c, 1, 'plus four bytes', 0.5);
  const colors = [P.mint, P.gold, P.blue];
  const sizes = [codes, coeff, qblock.sharedBytes],
    bars = [p0, p1, p2];
  let x = 823;
  for (let i = 0; i < 3; i++) {
    const w = sizes[i] * 6.3;
    alpha(ctx, bars[i], () => {
      box(ctx, x, 484, w, 104, colors[i]);
      if (i === 0)
        for (let g = 1; g < qblock.groups; g++)
          line(ctx, x + (g * w) / qblock.groups, 484, x + (g * w) / qblock.groups, 588, P.bg, 3);
    });
    x += w;
    const ly = 666 + i * 62;
    alpha(ctx, bars[i], () => {
      dot(ctx, 835, ly, 11, colors[i]);
      txt(
        ctx,
        ['Packed codes', 'Local scale and minimum coefficients', 'Two FP16 super-scales'][i],
        865,
        ly,
        33,
        P.ink,
      );
      num(ctx, sizes[i] + ' B', 1826, ly, 39, colors[i], 'right');
    });
  }
  if (b === 2) {
    const rule = cue(c, 2, 'Follow one code', 0.4);
    alpha(ctx, rule, () => result(ctx, P, '256 weights in 144 bytes', fmt(bpw) + ' bits / weight'));
    if (example) {
      txt(ctx, 'Code ' + codeExample.code, 104, 390, 48, P.mint);
      txt(ctx, 'Local scale 3   ·   shared 0.1', 105, 494, 36, P.muted);
      num(ctx, '5 × 3 × 0.1 = 1.5', 104, 568, 42, P.ink);
      alpha(ctx, cue(c, 2, 'Then subtract', 0.4), () =>
        num(ctx, '− 2 × 0.2', 104, 676, 42, P.gold),
      );
      if (spoken(c, 2)) num(ctx, '= ' + fmt(rebuilt), 105, 768, 53, P.mint);
    }
  }
  if (b === 3) result(ctx, P, 'Q4_K tensor   ·   256 weights per block', '144 B / Q4_K block');
}
const placed = trailingPlacement(12, 5);
export function placement(ctx, c) {
  const P = day,
    b = c.beat.beatIndex;
  base(ctx, P, 'Loading  /  a trailing placement rule', c.beat.chapterTitle);
  if (!b) {
    const stages = ['Map the file', 'Read a page', 'Copy GPU tensors'],
      names = ['File offset', 'Resident page', 'Device memory'];
    const ps = [1, cue(c, 0, 'become resident', 0.65), cue(c, 0, 'on the device', 0.65)];
    stages.forEach((s, i) => {
      const x = 120 + i * 592,
        col = [P.blue, P.gold, P.mint][i];
      txt(ctx, s, x, 340, 48, P.ink);
      for (let j = 2; j >= 0; j--) {
        const dx = j * 15,
          dy = -j * 14;
        box(ctx, x + dx, 467 + dy, 332, 180, P.bg, P.rule);
      }
      alpha(ctx, ps[i], () => {
        for (let j = 0; j < 12; j++)
          box(ctx, x + 24 + (j % 6) * 47, 503 + Math.floor(j / 6) * 63, 37, 43, col);
        txt(ctx, names[i], x, 738, 38, col);
      });
      if (i < 2) alpha(ctx, ps[i + 1], () => arrow(ctx, x + 385, 550, x + 503, 550, P.muted));
    });
    return;
  }
  const settled = cue(c, 2, 'Block eight is the first', 0);
  txt(ctx, '12 repeating blocks  ·  input stays on CPU', 100, 321, 46, P.ink);
  txt(ctx, '5 GPU slots, counting output', 1825, 393, 40, P.muted, 'right');
  const left = 105,
    step = 122;
  for (let i = -1; i <= 12; i++) {
    const x = left + (i + 1) * step,
      y = 519;
    const gpu = placed.gpuBlocks.includes(i) || i === 12;
    box(ctx, x, y, 110, 127, settled ? (gpu ? P.mint : P.blue) : P.soft, P.rule, 2);
    num(
      ctx,
      i === -1 ? 'IN' : i === 12 ? 'OUT' : i,
      x + 55,
      y + 64,
      40,
      settled ? P.bg : P.ink,
      'center',
    );
  }
  if (settled) {
    const cut = left + (placed.start + 1) * step - 6;
    line(ctx, cut, 472, cut, 710, P.gold, 6);
    span(ctx, left, cut - 14, 705, P.blue);
    span(ctx, cut + 14, left + 13 * step + 110, 705, P.mint);
    txt(ctx, 'CPU', left, 766, 40, P.blue);
    txt(ctx, 'GPU', cut + 18, 766, 40, P.mint);
    result(ctx, P, 'Transfer the activation', 'block 7 → block 8');
  }
}
const traffic = { compact: 2, matrix: 8 };
const hardware = { bandwidth: 100, computePeak: 300 };
function weightWork(uses) {
  const bytes = 2, flops = 2 * uses;
  const intensity = flops / bytes;
  const memoryRate = hardware.bandwidth * intensity;
  return { uses, bytes, flops, intensity, memoryRate, ceiling: Math.min(memoryRate, hardware.computePeak) };
}
function roofline(ctx, c, P) {
  const { bandwidth, computePeak } = hardware;
  base(ctx, P, 'Ideal roofline  /  hypothetical device  /  weight traffic only', 'Which rate sets the ceiling?');
  txt(ctx, 'Bandwidth', 108, 315, 41, P.muted);
  num(ctx, bandwidth + ' GB/s', 342, 315, 47, P.ink);
  txt(ctx, 'Compute peak', 919, 315, 41, P.muted);
  num(ctx, computePeak + ' GFLOP/s', 1244, 315, 47, P.gold);
  num(ctx, 'Ideal bound = min(bandwidth × intensity, compute peak)', 106, 417, 44, P.ink);
  const left = 452, unit = 2.7, cap = left + computePeak * unit;
  [1, 4].forEach((uses, i) => {
    const { intensity, memoryRate, ceiling } = weightWork(uses);
    const y = 555 + i * 195;
    const show = i ? cue(c, 5, 'Compute sets the ceiling', 0) : cue(c, 4, 'For one use', 0);
    const col = i ? P.mint : P.blue;
    txt(ctx, i ? 'Four uses' : 'One use', 109, y, 45, P.ink);
    num(ctx, intensity + ' FLOP/B', 109, y + 65, 38, col);
    line(ctx, left, y + 8, left + 400 * unit, y + 8, P.rule, 3);
    if (show) {
      box(ctx, left, y - 14, ceiling * unit, 44, col);
      if (memoryRate > ceiling) {
        ctx.save();
        ctx.setLineDash([10, 8]);
        line(ctx, cap, y + 8, left + memoryRate * unit, y + 8, col, 5);
        ctx.restore();
        dot(ctx, left + memoryRate * unit, y + 8, 8, col);
      }
      num(ctx, 'min(' + bandwidth + ' × ' + intensity + ', ' + computePeak + ') = ' + ceiling + ' GFLOP/s',
        left, y + 84, 39, col);
    } else if (i && cue(c, 4, 'With four uses', 0)) {
      num(ctx, 'min(' + bandwidth + ' × ' + intensity + ', ' + computePeak + ') = ?', left, y + 84, 39, P.ink);
    }
    line(ctx, cap, y - 32, cap, y + 46, P.gold, 4);
  });
  if (c.beat.beatIndex === 5 && cue(c, 5, 'The compute peak caps', 0)) {
    txt(ctx, 'Memory could supply', 105, 942, 39, P.muted);
    num(ctx, weightWork(4).memoryRate + ' GFLOP/s', 515, 942, 43, P.mint);
    txt(ctx, 'Compute caps the rate at', 925, 942, 39, P.muted);
    num(ctx, computePeak + ' GFLOP/s', 1815, 942, 43, P.gold, 'right');
  }
}
export function bus(ctx, c) {
  const P = night,
    b = c.beat.beatIndex;
  if (b >= 4) return roofline(ctx, c, P);
  base(
    ctx,
    P,
    b === 3 ? 'Prefill  /  weight reuse' : 'W4A16  /  weight traffic only',
    c.beat.chapterTitle,
  );
  if (b === 3) {
    txt(ctx, 'One BF16 weight', 120, 327, 48, P.ink);
    box(ctx, 150, 485, 312, 143, P.mint);
    num(ctx, '2 bytes', 306, 557, 47, P.bg, 'center');
    const work = weightWork(cue(c, 3, 'reuse that same weight', 0) ? 4 : 1);
    line(ctx, 463, 556, 703, 556, P.mint, 6);
    for (let i = 0; i < work.uses; i++) {
      const y = 350 + i * 140;
      line(ctx, 703, 556, 850, y, P.mint, 5);
      arrow(ctx, 850, y, 1020, y, P.mint);
      box(ctx, 1050, y - 41, 613, 82, P.soft, P.rule);
      txt(ctx, 'Prompt position ' + (i + 1), 1080, y, 39, P.ink);
    }
    result(
      ctx,
      P,
      'One weight read  ·  ' + work.uses + (work.uses === 1 ? ' use' : ' uses'),
      work.flops + ' FLOPs / ' + work.bytes + ' B = ' + work.intensity + ' FLOP/B',
    );
    return;
  }
  const x = 515,
    unit = 66;
  txt(ctx, 'Device-memory transfers', 103, 319, 45, P.muted);
  const compact = cue(c, 0, 'reads compact codes', 0.5);
  const events = [
    cue(c, 1, 'compact read', 0.55),
    cue(c, 1, 'writes eight', 0.55),
    cue(c, 1, 'read them back', 0.55),
  ];
  for (let i = 0; i < 2; i++) {
    const y = i ? 668 : 452;
    txt(ctx, i ? 'Standalone' : 'Fused', 105, y + 31, 54, P.ink);
    if (i && b === 0) continue;
    let pos = x;
    const sizes = i ? [traffic.compact, traffic.matrix, traffic.matrix] : [traffic.compact];
    sizes.forEach((v, j) => {
      const a = i ? events[j] : compact,
        col = [P.mint, P.gold, P.blue][j];
      alpha(ctx, a, () => {
        box(ctx, pos, y, v * unit - 3, 77, col);
        num(ctx, b === 0 ? 'codes' : v + ' MB', pos + (v * unit) / 2, y + 39, 31, P.bg, 'center');
        txt(
          ctx,
          ['Read', 'Write FP16 weights', 'Reread FP16 weights'][j],
          pos,
          y + 120,
          29,
          P.muted,
        );
      });
      pos += v * unit;
    });
    line(ctx, x, y - 18, 1750, y - 18, P.rule, 2);
  }
  if (b === 2)
    alpha(ctx, cue(c, 2, 'Count the compact read', 0.5), () =>
      result(
        ctx,
        P,
        'Standalone weight traffic',
        '2 + 8 + 8 = ' + (traffic.compact + 2 * traffic.matrix) + ' MB',
      ),
    );
}
function memoryBar(ctx, P, x, y, segments, unit, height) {
  let left = x;
  segments.forEach(([v, col]) => {
    if (v > 0) box(ctx, left, y, v * unit, height, col);
    left += v * unit;
  });
}
const pool = (w) => ({ gb: 40 - 4 - w, users: Math.floor((40 - 4 - w) / 0.5) });
export function room(ctx, c) {
  const P = day,
    b = c.beat.beatIndex;
  base(ctx, P, 'Loaded memory  /  workload budget', c.beat.chapterTitle);
  if (b < 3) {
    const doubled = cue(c, 2, 'The longer context crosses', 0),
      restored = cue(c, 2, 'Now restore', 0);
    const mem = quantizationMemory(doubled && !restored ? 4 : 2),
      x = 157,
      y = 471,
      u = 181;
    txt(ctx, '7B weights with group scales', 109, 315, 47, P.ink);
    line(ctx, x + mem.capacity * u, 400, x + mem.capacity * u, 666, P.red, 6);
    num(ctx, '8 GiB', x + mem.capacity * u, 363, 46, P.red, 'center');
    memoryBar(
      ctx,
      P,
      x,
      y,
      [
        [mem.weights, P.blue],
        [mem.other, P.gold],
        [mem.cache, P.mint],
      ],
      u,
      116,
    );
    const labels = [
      ['Weights + scales', mem.weights, P.blue],
      ['Other', mem.other, P.gold],
      ['KV cache', mem.cache, P.mint],
    ];
    labels.forEach(([s, v, color], i) => {
      const xx = 133 + i * 591;
      dot(ctx, xx, 727, 12, color);
      txt(ctx, s, xx + 30, 727, 37, P.ink);
      num(ctx, fmt(v, 2) + ' GiB', xx + 30, 797, 39, color);
    });
    if (b === 1 || (b === 2 && !doubled)) result(ctx, P, 'Proposed longer context', '2 → 4 GiB cache', P.ink);
    else
      result(
        ctx,
        P,
        mem.fits ? 'Fits the device' : 'Over the limit',
        fmt(mem.total, 2) + ' GiB',
        mem.fits ? P.mint : P.red,
      );
    return;
  }
  const solved = cue(c, 4, 'Sixty-four users fit', 0);
  txt(ctx, '40 GB device  ·  4 GB reserve  ·  0.5 GB per user', 106, 314, 45, P.ink);
  for (let i = 0; i < 2; i++) {
    const weights = i ? 4 : 16,
      data = pool(weights),
      y = 449 + i * 209,
      col = i ? P.mint : P.blue,
      x = 595,
      u = 27;
    txt(ctx, weights + ' GB weights', 108, y + 33, 48, P.ink);
    const show = !i || solved > 0;
    if (!show) box(ctx, x, y, 40 * u, 81, P.soft, P.rule);
    memoryBar(
      ctx,
      P,
      x,
      y,
      [[4, P.gold], [weights, P.blue], ...(show ? [[data.gb, P.mint]] : [])],
      u,
      81,
    );
    if (show) {
      num(
        ctx,
        data.gb + ' GB pool',
        x + (4 + weights + data.gb / 2) * u,
        y + 40,
        35,
        P.bg,
        'center',
      );
      txt(ctx, data.users + ' users', 1670, y + 124, 42, col, 'right');
    }
  }
  if (b === 4 && solved) result(ctx, P, 'Memory-only capacity', '32 GB / 0.5 GB = 64');
}
const trial = routingTrial,
  records = [trial.source, trial.fileA];
function parcel(ctx, x, y, scale, P) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const pts = [
    [0, 28],
    [83, 0],
    [164, 31],
    [80, 62],
  ];
  function face(points, col) {
    ctx.beginPath();
    points.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = P.bg;
    ctx.stroke();
  }
  face(pts, '#e4bd7c');
  face(
    [
      [0, 28],
      [80, 62],
      [80, 146],
      [0, 112],
    ],
    '#b88046',
  );
  face(
    [
      [80, 62],
      [164, 31],
      [164, 113],
      [80, 146],
    ],
    '#d29e61',
  );
  face(
    [
      [28, 19],
      [51, 12],
      [134, 42],
      [110, 51],
    ],
    '#f5dfac',
  );
  face(
    [
      [110, 51],
      [134, 42],
      [134, 74],
      [110, 84],
    ],
    '#ecce92',
  );
  ctx.restore();
}
export function routes(ctx, c) {
  const P = night,
    b = c.beat.beatIndex;
  base(ctx, P, 'Worked example  /  supplied parcel replies and counts', c.beat.chapterTitle);
  if (b < 2) {
    txt(ctx, 'Requested destination', 97, 325, 42, P.muted);
    parcel(ctx, 130, 437, 1.65, P);
    serif(ctx, 'Dock ' + requestedDock, 98, 769, 72, P.gold);
    routeReplies.forEach((r, i) => {
      const x = 681 + i * 592;
      txt(ctx, i ? 'File A' : 'Source', x, 340, 49, P.ink);
      const v = cue(c, 0, 'Both replies parse', 0.45);
      alpha(ctx, v, () => {
        num(ctx, r.json, x, 452, 48, P.ink);
        txt(ctx, 'Valid JSON', x, 542, 38, P.muted);
      });
      const exposed = cue(c, 1, i ? 'File A sends' : 'Only the source', 0.4);
      alpha(ctx, exposed, () => {
        const col = r.correct ? P.mint : P.red;
        box(ctx, x, 646, 390, 112, P.soft, col, 4);
        num(ctx, 'Dock ' + r.dock, x + 195, 703, 53, col, 'center');
      });
    });
    return;
  }
  const score = cue(c, 3, 'It fell from', 0.55);
  records.forEach((r, i) => {
    const x = 129 + i * 900,
      y = 435,
      col = i ? P.blue : P.mint;
    txt(ctx, i ? 'File A' : 'Source', x, 318, 48, P.ink);
    const parse = cue(c, 2, i ? 'File A gives ninety-five' : 'The source gives ninety', 0),
      correct = cue(c, 2, i ? 'Of those eighty reach' : 'Of those eighty-five reach', 0);
    const side = 35,
      pitch = 40;
    for (let k = 0; k < trial.requests; k++) {
      let color = P.rule;
      if (parse && k < r.parsed) color = P.gold;
      if (correct && k < r.correct) color = col;
      box(ctx, x + (k % 20) * pitch, y + Math.floor(k / 20) * pitch, side, side, color);
    }
    if (parse) txt(ctx, 'Parse-valid   ' + r.parsed + ' / ' + trial.requests, x, 691, 37, P.gold);
    if (correct) txt(ctx, 'Correct       ' + r.correct + ' / ' + trial.requests, x, 758, 41, col);
  });
  alpha(ctx, score, () => result(ctx, P, 'Correct routes / all requests', '85% → 80%', P.red));
}
const required = 4,
  reduced = 3.875;
export function practice(ctx, c) {
  const P = night,
    b = c.beat.beatIndex;
  base(ctx, P, 'Worked parcel example  /  6B weights  /  decimal GB', c.beat.chapterTitle);
  const showA = cue(c, 1, 'A fits', 0),
    showB = cue(c, 1, 'B uses three', 0);
  const reduce = cue(c, 2, 'At three point', 0),
    back = cue(c, 3, 'Restore the required cache', 0);
  const m = freshQuantizationBudget(required),
    mb = freshQuantizationBudget(reduce && !back ? reduced : required);
  const x = 601,
    u = 141,
    cut = x + m.capacity * u;
  num(ctx, 'Capacity  8 GB', cut, 323, 48, P.gold, 'right');
  txt(ctx, 'Cache required  4 GB    ·    Other  0.75 GB', 99, 323, 39, P.muted);
  line(ctx, cut, 367, cut, 418, P.gold, 5);
  for (let i = 0; i < 2; i++) {
    const active = i ? mb : m,
      show = i ? showB : showA,
      total = i ? active.totalB : active.totalA,
      y = 433 + i * 210;
    txt(ctx, i ? 'File B' : 'File A', 99, y + 19, 51, P.ink);
    txt(ctx, i ? 'Q4_K blocks' : '4-bit codes + scales', 100, y + 89, 34, P.muted);
    const seg = [
      [active.other, P.gold],
      [active.cache, P.blue],
    ];
    if (show) {
      if (i) seg.push([active.blockWeights, P.mint]);
      else seg.push([active.codes, P.mint], [active.scales, '#c1cfa8']);
    }
    box(ctx, x, y, m.capacity * u, 88, P.soft);
    memoryBar(ctx, P, x, y, seg, u, 88);
    line(ctx, cut, y - 13, cut, y + 97, P.gold, 4);
    num(
      ctx,
      fmt(active.cache) + ' cache',
      x + (active.other + active.cache / 2) * u,
      y + 44,
      32,
      P.bg,
      'center',
    );
    if (show) {
      num(
        ctx,
        (i ? 'blocks ' : 'weights ') +
          fmt(i ? active.blockWeights : active.codes + active.scales, 4),
        x +
          (active.other +
            active.cache +
            (i ? active.blockWeights : active.codes + active.scales) / 2) *
            u,
        y + 44,
        32,
        P.bg,
        'center',
      );
      const slack = (active.capacity - total) * 1000;
      const msg =
        fmt(total, 4) +
        ' GB     ' +
        (slack < 0
          ? fmt(-slack) + ' MB over'
          : slack === 0
            ? 'zero headroom'
            : fmt(slack) + ' MB free');
      num(ctx, msg, 1800, y + 132, 37, slack < 0 ? P.red : P.ink, 'right');
    } else
      num(
        ctx,
        i ? '4.5 bits / weight' : '2 B scale / 64 weights',
        x + 800,
        y + 131,
        34,
        P.muted,
        'center',
      );
  }
  if (b === 0)
    result(ctx, P, 'Count weights, scales, other allocations and cache', 'Which fits?', P.ink);
  if (b === 1)
    alpha(ctx, showB, () => result(ctx, P, 'A weight inventory', '3 GB codes + 0.1875 GB scales'));
  if (b === 2)
    alpha(ctx, reduce, () => result(ctx, P, 'B cache trial', '3.875 GB  <  4 GB required', P.gold));
  if (b === 3 && back)
    result(ctx, P, 'Required ≥ 85 correct routes / 100', 'A 80/100    B untested', P.ink);
  if (b === 4) {
    const resolved = cue(c, 4, 'Hold both files', 0);
    result(
      ctx,
      P,
      resolved ? 'Hold both files' : 'Required ≥ 85 correct routes / 100',
      resolved ? 'A needs 5 more correct    B needs 125 MB' : 'A 80/100    B untested',
      resolved ? P.red : P.ink,
    );
  }
}
export function checkDeployment() {
  assert(Math.abs(rebuilt - 1.1) < 1e-12);
  assert.equal(blockBytes, 144);
  assert.equal(bpw, 4.5);
  assert.equal(2 * blockBytes, 288);
  assert.deepEqual(placed.gpuBlocks, [8, 9, 10, 11]);
  assert.equal(placed.outputGPU, true);
  assert.equal(placed.input, 'CPU');
  assert.equal(traffic.compact + 2 * traffic.matrix, 18);
  assert.deepEqual([1, 4].map(weightWork), [
    { uses: 1, bytes: 2, flops: 2, intensity: 1, memoryRate: 100, ceiling: 100 },
    { uses: 4, bytes: 2, flops: 8, intensity: 4, memoryRate: 400, ceiling: 300 },
  ]);
  assert(quantizationMemory(2).fits);
  assert(!quantizationMemory(4).fits);
  assert.deepEqual([pool(16).users, pool(4).users], [40, 64]);
  assert.deepEqual(
    routeReplies.map((r) => r.correct),
    [true, false],
  );
  assert.equal(records[1].correct / trial.requests, 0.8);
  assert.equal(records[1].parsed - records[1].correct, 15);
  const a = freshQuantizationBudget(required),
    b = freshQuantizationBudget(reduced);
  assert.equal(a.totalA, 7.9375);
  assert.equal(a.totalB, 8.125);
  assert.equal(b.totalB, 8);
  assert.equal(trial.minimumCorrect - trial.fileA.correct, 5);
}
