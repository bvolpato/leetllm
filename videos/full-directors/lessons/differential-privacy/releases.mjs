import {
  P,
  neat,
  pair,
  cue,
  type,
  line,
  rect,
  dot,
  arrow,
  background,
  heading,
  bracket,
  plate,
  graph,
  readout,
  lerpPoint,
} from './instruments.mjs';
import {
  raw,
  record,
  records,
  other,
  withRecord,
  drawNoise,
  noisy,
  scores,
  selected,
  cap,
  budget,
  gaussianReleaseLedger,
} from './examples.mjs';

function casefile(c, x, y, w, h, word, color = P.blue, fill = P.light) {
  rect(c, x + 6, y + 10, w, h, '#152f3820', null, 8);
  rect(c, x, y + 7, w, h - 7, fill, color, 8, 3);
  rect(c, x + 12, y - 10, w * 0.47, 22, fill, color, 6, 2);
  type(c, word, x + w / 2, y + h * 0.56, Math.min(37, w * 0.17), color, 'center', 'Serif', 600);
}
export function checkpoint(c, k) {
  background(c);
  const b = k.beat.beatIndex + 1;
  if (b <= 2) {
    heading(c, 'Rebuild the update', 'Record 4  ·  clip bound C = 1');
    const z = 132,
      pt = graph(c, { x: 443, y: 802, scale: z, xmin: -1.38, xmax: 4.2, ymin: -1.15, ymax: 4.26 });
    dot(c, ...pt([0, 0]), z, null, P.brass, 4);
    line(c, ...pt([0, 0]), ...pt(raw), P.line, 3, [8, 10]);
    const p = cue(k, 2, 'Scale both coordinates', 1);
    arrow(c, pt([0, 0]), pt(lerpPoint(raw, record, p)), P.blue, 10);
    readout(c, 1080, 367, 'Unclipped record', pair(raw), P.blue);
    readout(
      c,
      1080,
      573,
      'Clipped contribution',
      cue(k, 2, 'We can carry') ? pair(record) : '(? , ?)',
      P.teal,
    );
    return;
  }
  if (b <= 4) {
    heading(c, 'Rebuild the sum', 'Each arrow starts where the previous one ends.');
    const pt = graph(c, {
      x: 210,
      y: 860,
      scale: 284,
      xmin: -0.25,
      xmax: 2.7,
      ymin: -0.12,
      ymax: 2.19,
      step: 0.5,
    });
    const names = ['R1', 'R2', 'R4'],
      segments = [records[0], other, withRecord],
      colors = [P.blue, P.teal, '#795e32'];
    let prev = [0, 0],
      ended = 0;
    for (let j = 0; j < 3; j++) {
      const p = cue(k, 3, ['R1 adds', 'R2 adds', 'clipped R4 adds'][j], 0.8);
      if (p) {
        arrow(c, pt(prev), pt(lerpPoint(prev, segments[j], p)), colors[j], 10);
        type(
          c,
          names[j] + '    ' + pair(records[j]),
          1104,
          331 + j * 82,
          40,
          colors[j],
          'left',
          'Mono',
        );
      }
      if (p === 1) ended++;
      prev = segments[j];
    }
    if (ended) type(c, 'Sum   ' + pair(segments[ended - 1]), 1104, 633, 46, P.ink, 'left', 'Mono');
    const p = cue(k, 4, 'Follow the pink arrow', 0.7);
    if (cue(k, 4, 'For this noise draw'))
      type(c, 'Draw  ' + pair(drawNoise), 1104, 730, 39, P.plum, 'left', 'Mono');
    if (p) {
      arrow(c, pt(withRecord), pt(lerpPoint(withRecord, noisy, p)), P.plum, 10);
      if (p === 1) type(c, 'Noisy sum  ' + pair(noisy), 1104, 845, 43, P.plum, 'left', 'Serif');
    }
    return;
  }
  const choose = cue(k, 5, 'The published choice'),
    entered = cue(k, 5, 'Give training'),
    combined = cue(k, 6, 'That gives a basic composition');
  heading(
    c,
    'Checkpoint selection',
    'One record added or removed  ·  same neighbor rule throughout',
  );
  for (let i = 0; i < 4; i++) {
    const x = 134 + (i % 2) * 334,
      y = 312 + Math.floor(i / 2) * 231,
      chosen = i === 2 && choose;
    casefile(
      c,
      x,
      y,
      259,
      160,
      'Checkpoint ' + (i + 5),
      chosen ? P.teal : P.muted,
      chosen ? P.jade : P.light,
    );
  }
  type(
    c,
    choose ? 'Private validation selected C7' : 'Private validation',
    119,
    834,
    41,
    P.ink,
    'left',
    'Serif',
  );
  if (entered) {
    readout(c, 985, 315, 'Training release', '(ε₁, δ₁)', P.blue);
    readout(c, 985, 492, 'Private selection given training', '(ε₂, δ₂)', P.teal);
  }
  if (combined) type(c, 'Joint bound   (ε₁ + ε₂, δ₁ + δ₂)', 983, 734, 40, P.ink);
  if (b === 7) type(c, 'Raw ticket read  →  check permission', 983, 858, 35, P.plum);
}

function ledgerTable(c, k) {
  const b = k.beat.beatIndex + 1,
    second = !!cue(k, 3, 'Add a second measurement');
  const rows = gaussianReleaseLedger(second ? [4, 4] : [4]).rows;
  const charge = cue(k, 2, 'For this Gaussian mechanism'),
    convert = cue(k, 4, 'You pay that conversion once');
  const best = cue(k, 5, 'Our cap is two');
  heading(
    c,
    'Gaussian release ledger',
    'Whole customers    ·    add/remove    ·    no sampling    ·    SD = 4C',
  );
  const xs = [230, 554, 804, 1129, 1529],
    y = 340;
  ['Order α', 'Charge 1', 'Charge 2', 'Conversion', 'ε bound'].forEach((s, i) =>
    type(c, s, xs[i], y, 35, P.muted, 'center'),
  );
  rows.forEach((r, i) => {
    const yy = y + 101 + i * 99,
      focus = r.alpha === 16 && !!charge;
    if (focus) rect(c, 122, yy - 40, 1665, 80, best ? P.jade : '#e2e9da', null, 7);
    else line(c, 128, yy + 46, 1778, yy + 46, P.line, 1.5);
    const values = [
      r.alpha,
      charge ? neat(r.charges[0], 4) : '·',
      second ? neat(r.charges[1], 4) : '·',
      convert ? r.conversion.toFixed(3) : '·',
      convert ? r.epsilon.toFixed(3) : '·',
    ];
    values.forEach((v, j) =>
      type(c, v, xs[j], yy, 41, j === 4 && best && focus ? P.teal : P.ink, 'center', 'Mono'),
    );
  });
  const formula =
    b < 4
      ? 'Charge per measurement = α / (2σ²)'
      : 'Convert once at δ = 0.00001:   add ln(1/δ) / (α − 1)';
  type(
    c,
    best ? 'Lowest of four bounds:   ε ≈ ' + rows[3].epsilon.toFixed(3) + '   <   cap 2' : formula,
    127,
    891,
    41,
    P.ink,
    'left',
    'Serif',
  );
}

export function accounting(c, k) {
  background(c);
  const b = k.beat.beatIndex + 1;
  if (b <= 5) {
    ledgerTable(c, k);
    return;
  }
  if (b === 6 || !cue(k, 7, 'Separate runs')) {
    const transcript = b === 7;
    heading(
      c,
      transcript ? 'Checkpoints from one training transcript' : 'What feeds the checkpoint choice?',
      transcript
        ? 'Both checkpoints use only the jointly accounted noisy updates.'
        : 'The source of the score determines what the accountant covers.',
    );
    for (const [i, label] of (transcript
      ? ['Earlier updates', 'Later updates']
      : ['Saved noisy score 1', 'Saved noisy score 2']
    ).entries()) {
      const y = 338 + i * 223;
      casefile(c, 174, y, 430, 135, label, P.teal, '#dce9dc');
      arrow(c, [631, y + 75], [1004, 532], P.teal, 6);
    }
    casefile(
      c,
      1040,
      452,
      538,
      168,
      transcript ? 'Derived checkpoints' : 'Checkpoint choice',
      P.ink,
    );
    type(
      c,
      transcript ? 'Updates covered jointly' : 'Both scores covered jointly',
      156,
      846,
      38,
      P.teal,
    );
    if (!transcript && cue(k, 6, 'A fresh lookup'))
      type(c, 'Fresh private scores need analysis', 1001, 846, 38, P.plum);
  } else {
    const disjoint = cue(k, 7, 'For fixed disjoint customer groups');
    heading(
      c,
      disjoint ? 'Disjoint customer groups' : 'Separate runs on overlapping customers',
      disjoint ? 'Fixed partition by customer' : 'Check who contributes to each run.',
    );
    const groups = disjoint
      ? [
          ['Alice', 'Bao'],
          ['Cai', 'Dev'],
        ]
      : [
          ['Alice', 'Bao'],
          ['Bao', 'Cai'],
        ];
    groups.forEach((names, i) => {
      const x = 197 + i * 837;
      plate(c, x, 352, 651, 350);
      type(c, 'Run ' + (i + 1), x + 55, 420, 42, P.ink, 'left', 'Serif');
      names.forEach((n, j) => {
        const xx = x + 52 + j * 285;
        rect(c, xx, 525, 252, 83, n === 'Bao' ? P.jade : P.sky, null, 14);
        type(c, n, xx + 126, 568, 37, P.ink, 'center');
      });
    });
    type(
      c,
      disjoint
        ? 'Parallel composition: take the largest group bound.'
        : 'Bao occurs in both runs. Compose their conditional bounds.',
      130,
      857,
      45,
      P.ink,
      'left',
      'Serif',
    );
  }
}

export function planState(k) {
  return {
    b: k.beat.beatIndex + 1,
    charged4: cue(k, 4, 'charge is a half', 0.8),
    charged8: cue(k, 4, 'Place it beside', 0.8),
    convert8: cue(k, 5, 'Add the same conversion', 0.8),
    lowerVerdict: !!cue(k, 5, 'That puts the eight C plan'),
    upperVerdict: !!cue(k, 4, 'Even the smallest bound'),
  };
}
function budgetBlock(c, x, y, width, fill, ink, label, value) {
  rect(c, x + 1, y, width - 2, 86, fill, ink, 6);
  type(c, label, x + width / 2, y + 21, 27, ink, 'center');
  type(c, value, x + width / 2, y + 60, 38, ink, 'center', 'Mono', 600);
}

function plans(c, k) {
  const s = planState(k),
    base = budget(),
    delta = base.ledger.delta;
  heading(
    c,
    'One fresh checkpoint score',
    'Same customers    ·    sensitivity C    ·    no sampling    ·    δ = ' + delta,
  );
  const x = 472,
    u = 535,
    yy = [427, 705],
    baseline = base.row.epsilon;
  const xx = (v) => x + v * u,
    limit = xx(cap);
  line(c, limit, 320, limit, yy[0] + 94, P.plum, 4, [8, 9]);
  line(c, limit, yy[0] + 179, limit, yy[1] + 94, P.plum, 4, [8, 9]);
  type(c, 'Cap 2', limit, 268, 41, P.plum, 'center', 'Serif');
  for (let i = 0; i < 2; i++) {
    const mult = i ? 8 : 4,
      active = i ? s.charged8 : s.charged4,
      verdict = i ? s.lowerVerdict : s.upperVerdict,
      ledger = budget(mult);
    const y = yy[i],
      part = ledger.row.charges[2];
    type(
      c,
      s.b === 1 ? 'Saved pair' : 'New SD ' + mult + 'C',
      115,
      y + 42,
      40,
      P.ink,
      'left',
      'Serif',
    );
    // Both saved charges stay fixed while the new charge goes in before conversion.
    let saved = 0;
    for (const [j, charge] of base.row.charges.entries()) {
      budgetBlock(c, xx(saved), y, u * charge, P.sky, P.blue, 'Charge ' + (j + 1), neat(charge));
      saved += charge;
    }
    if (active) {
      rect(
        c,
        xx(base.row.rdp),
        y,
        u * part * active,
        86,
        verdict ? (i ? P.jade : P.rose) : P.soft,
        verdict ? (i ? P.teal : P.plum) : P.muted,
        6,
      );
    }
    const lift = i ? active * (1 - s.convert8) : 0;
    budgetBlock(
      c,
      xx(base.row.rdp + part * active),
      y - 111 * lift,
      u * base.row.conversion,
      '#e6d2aa',
      '#6e542d',
      'Conversion',
      base.row.conversion.toFixed(3),
    );
    if (active === 1) {
      const labX = xx(base.row.rdp + part * 0.5);
      line(c, labX, y + 88, labX, y + 106, P.muted, 3);
      type(c, 'New  ' + neat(part), labX, y + 135, 32, P.ink, 'center');
      if (i && !s.convert8)
        type(c, 'RDP subtotal  ' + neat(ledger.row.rdp), x, y + 135, 36, P.ink, 'left', 'Mono');
      else if (verdict)
        type(
          c,
          '≈ ' + ledger.ledger.best.epsilon.toFixed(3) + (ledger.fits ? '   fits' : '   over cap'),
          x,
          y + 135,
          38,
          ledger.fits ? P.teal : P.plum,
          'left',
          'Mono',
        );
    }
  }
  if (s.b === 3) {
    type(c, 'At order 16, which new score fits?', 120, 884, 49, P.ink, 'left', 'Serif');
    type(c, 'New charge = 16C² / (2σ²)', 1790, 884, 35, P.muted, 'right', 'Mono');
  } else if (s.b === 4 || s.b === 5)
    type(
      c,
      'Order 16 charge for the new score = 16C² / (2σ²)',
      120,
      884,
      41,
      P.muted,
      'left',
      'Serif',
    );
  else
    type(c, 'Saved pair at order 16   ·   ε bound ≈ ' + baseline.toFixed(3), 120, 884, 39, P.muted);
}
function access(c, k) {
  const b = k.beat.beatIndex + 1,
    rawRequest = cue(k, 6, 'Now the copilot requests');
  if (b === 6 && !cue(k, 6, 'Once training and selection')) {
    const show = cue(k, 6, 'Take the largest'),
      choose = cue(k, 6, 'Comparing saved scores');
    heading(
      c,
      'Choose among three protected scores',
      'Illustrative noisy validation scores   ·   larger is better',
    );
    scores.forEach((s, i) => {
      const x = 140 + 579 * i,
        winner = choose && s === selected;
      casefile(
        c,
        x,
        340,
        485,
        168,
        'Checkpoint ' + s.checkpoint,
        winner ? P.teal : P.blue,
        winner ? P.jade : P.light,
      );
      if (show) {
        type(c, s.value.toFixed(2), x + 238, 625, 65, winner ? P.teal : P.ink, 'center', 'Mono');
        rect(c, x + 35, 694, 416 * s.value, 28, winner ? P.teal : P.blue, null, 4);
      }
    });
    if (choose)
      type(
        c,
        'Checkpoint ' +
          selected.checkpoint +
          ' has the highest score. The score ledger stays at ε ≈ ' +
          budget(8).ledger.best.epsilon.toFixed(3) +
          '.',
        130,
        865,
        40,
        P.teal,
        'left',
        'Serif',
      );
    return;
  }
  heading(
    c,
    'What does the released model read?',
    'Three jointly accounted scores   ·   score ledger ε bound ≈ ' +
      budget(8).ledger.best.epsilon.toFixed(3),
  );
  const y = 337;
  casefile(c, 130, y, 337, 130, 'Public prompt', P.blue, P.sky);
  arrow(c, [505, y + 70], [727, y + 70], P.teal, 7);
  rect(c, 756, y - 9, 450, 157, '#d6e6d9', P.teal, 43, 4);
  type(c, 'Released model', 981, y + 70, 44, P.teal, 'center', 'Serif');
  arrow(c, [1245, y + 70], [1464, y + 70], P.teal, 7);
  type(c, 'Reply', 1592, y + 70, 51, P.teal, 'center', 'Serif');
  if (rawRequest) {
    casefile(c, 130, 642, 419, 179, 'Alice’s original ticket', P.plum, '#f2d2c6');
    if (b === 7) {
      const branches = cue(k, 7, 'The next lesson') ? 2 : 1;
      for (let i = 0; i < branches; i++) {
        const yy = 660 + i * 166;
        line(c, 583, 743, 680, 743, P.plum, 5);
        line(c, 680, 743, 680, yy, P.plum, 5);
        line(c, 680, yy, 1012, yy, P.plum, 5);
        for (const x of [1030, 1052]) line(c, x, yy - 34, x, yy + 34, P.brass, 8);
        type(
          c,
          i ? 'Label reviewer’s read permission' : 'Copilot’s read permission',
          1103,
          yy,
          41,
          P.plum,
          'left',
          'Serif',
        );
      }
    } else type(c, 'Requested raw source', 686, 729, 41, P.plum, 'left', 'Serif');
  } else
    type(
      c,
      'Post-processing of the protected scores and model',
      130,
      711,
      42,
      P.teal,
      'left',
      'Serif',
    );
}
export function practice(c, k) {
  background(c);
  if (k.beat.beatIndex < 5) plans(c, k);
  else access(c, k);
}
