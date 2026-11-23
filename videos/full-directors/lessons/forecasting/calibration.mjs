import { C, mean, mix, signed, sum } from './instrument.mjs';
import {
  forecast,
  actual,
  errors,
  counts,
  earlier,
  sorted,
  extendedRack,
  baseline,
  observed,
  width,
  normalRMS,
  covered,
  patchContract,
  chronosBlocks,
  conformalRank,
  alphaUpdate,
  pinball,
  mornings,
  schoolOrder,
  rail,
  mae,
} from './observatory.mjs';

export function patches(p) {
  const s = patchContract(),
    maps = p.at(2, null);
  p.title(
    maps ? 'Count the map entries for one channel' : 'Cutting a lookback into overlapping patches',
    'One channel   /   336 time steps   /   length 16   /   stride 8',
  );
  if (!maps) {
    const endPad = p.at(2, 'Comparing three');
    const left = 107,
      step = 3.12,
      base = 321;
    p.graph(88, 211, 1098, 193);
    for (let i = 0; i < s.lookback; i++) {
      const h = 33 + 17 * Math.cos(i * 0.08) + 11 * Math.sin(i * 0.24);
      p.line(left + i * step, base, left + i * step, base - h, C.teal, 2);
    }
    const i = endPad
      ? s.unpadded
      : Math.floor((s.unpadded - 1) * p.move(1, 'subtracting patch length', 3.5));
    const xx = left + i * s.stride * step;
    if (endPad) {
      p.rect(left + s.lookback * step, base - 67, 8 * step, 67, C.blush);
      p.text('8 padded steps', 1176, 189, 19, C.red, 'right');
    }
    p.rect(xx, base + 13, 16 * step, 18, C.blue);
    p.bracket(xx, xx + 16 * step, 369, '16', C.blue);
    p.mono('floor((336 − 16) / 8) + 1', 107, 507, 31, C.ink);
    if (p.at(2, 'End padding gives'))
      p.mono('= ' + s.unpadded + ' full patches', 680, 507, 29, C.blue);
    if (endPad) p.mono('+ 1 padded = ' + s.tokens, 677, 571, 27, C.teal);
    p.text('The next start moves eight observations.', 107, 609, 25, C.muted);
  } else {
    const x = 216,
      y = 178,
      size = 375,
      unit = size / (s.lookback / s.tokens);
    p.rect(x, y, size, size, C.fog);
    for (let i = 0; i <= 8; i++) {
      p.line(x + i * unit, y, x + i * unit, y + size, C.teal, 2);
      p.line(x, y + i * unit, x + size, y + i * unit, C.teal, 2);
    }
    p.rect(x, y, unit, unit, C.blue);
    p.mono(s.lookback + ' steps', x + size / 2, y + size + 36, 24, C.ink, 'center');
    p.text('One padded map', 735, 227, 33, C.ink, 'left', 'Serif');
    p.mono(s.tokens + ' × ' + s.tokens, 735, 283, 38, C.blue);
    p.text('Raw map', 735, 378, 28, C.ink, 'left', 'Serif');
    p.mono(s.lookback + ' × ' + s.lookback, 735, 426, 30, C.teal);
    if (p.at(2, null)) p.text(s.mapRatio + ' times as many entries', 735, 515, 31, C.ink);
    if (p.beat === 4)
      p.text('Benchmark the whole model on the same hardware.', 160, 644, 25, C.muted);
  }
}
export function generations(p) {
  const idx = Math.min(p.beat, 2),
    names = ['Chronos  ·  2024', 'Chronos-2  ·  October 2025', 'TimesFM-3  ·  August 2026'];
  p.title(
    names[idx],
    [
      'Mean scaling and uniform-width bins',
      'Daily cluster history   /   January 5–12   /   two-day patches for this example',
      'Masked future patches, filled in one forward pass',
    ][idx],
  );
  if (idx === 0) {
    const vs = counts.slice(0, 7),
      m = mean(vs),
      x = (i) => 134 + i * 110,
      y = (v) => 461 - (v - 0.6) * 284;
    p.graph(96, 210, 767, 300, 40);
    for (let i = 0; i < 5; i++) {
      const v = 0.6 + i * 0.2;
      p.line(96, y(v), 863, y(v), C.edge, 2, [7, 4]);
      p.mono(v.toFixed(1), 84, y(v), 17, C.muted, 'right');
    }
    vs.forEach((v, i) => {
      if (i) p.line(x(i - 1), y(vs[i - 1] / m), x(i), y(v / m), C.teal, 4);
      p.dot(x(i), y(v / m), 6, C.teal);
      p.mono((v / m).toFixed(2), x(i), 545, 21, C.ink, 'center');
    });
    p.text('Token', 924, 292, 43, C.ink, 'left', 'Serif');
    p.text('sampling', 924, 350, 36, C.blue, 'left', 'Serif');
    p.text(
      'Equal numerical widths can contain different numbers of observations.',
      98,
      636,
      24,
      C.muted,
    );
  } else if (idx === 1) {
    chronosTwo(p);
  } else {
    p.text('Time', 104, 207, 22, C.muted);
    for (let row = 0; row < 3; row++)
      for (let i = 0; i < 9; i++) {
        const x = 116 + i * 116,
          y = 236 + row * 70,
          h = 30 + 8 * Math.sin(row * 4 + i * 2);
        p.rect(x, y, 98, 51, i < 6 ? C.fog : C.band);
        if (i < 6) {
          p.line(x + 9, y + 35, x + 42, y + h - 12, C.teal, 3);
          p.line(x + 42, y + h - 12, x + 83, y + 22, C.teal, 3);
        } else
          p.text(
            p.at(2, 'Its reported quantiles') ? 'ŷ' : '?',
            x + 49,
            y + 25,
            26,
            C.blue,
            'center',
          );
      }
    const x = (q) => 130 + q * 10.3;
    p.line(x(10), 517, x(90), 517, C.blue, 7);
    p.line(x(90), 517, x(99), 517, C.edge, 2, [5, 5]);
    [10, 50, 90, 99].forEach((q) => {
      p.dot(x(q), 517, 8, q === 99 ? C.red : C.blue, q === 99);
      p.mono('P' + q, x(q), 556, 23, q === 99 ? C.red : C.ink, 'center');
    });
    if (p.beat >= 3)
      p.text(
        'Reported outputs stop at P90. P99 needs another estimate.',
        97,
        639,
        27,
        C.ink,
        'left',
        'Serif',
      );
  }
}

function chronosTwo(p) {
  const scaled = p.at(1, 'inverse hyperbolic sine');
  const patched = p.at(1, 'disjoint time blocks');
  const embedded = p.at(1, 'Time attention');
  const group = p.at(1, 'Group attention');
  const centerX = (i) => 352 + i * 238;

  p.text('January', 72, 183, 22, C.muted);
  p.text('Raw jobs', 72, 232, 28, C.ink, 'left', 'Serif');
  if (scaled) p.mono('asinh(z)', 72, 301, 24, C.blue);
  chronosBlocks.forEach((block, i) => {
    const cx = centerX(i);
    if (patched) {
      p.rect(cx - 109, 274, 218, 58, i % 2 ? C.band : C.fog);
      p.bracket(cx - 109, cx + 109, 345, 'Patch ' + (i + 1), C.teal);
    }
    block.forEach(({ date, volume, transformed }, j) => {
      const x = cx + (j ? 57 : -57);
      p.mono(Number(date.slice(-2)), x, 183, 21, C.muted, 'center');
      p.mono(volume, x, 232, 31, C.ink, 'center');
      if (scaled) p.mono(transformed.toFixed(2).replace('-', '−'), x, 302, 25, C.blue, 'center');
    });
  });
  if (scaled)
    p.text(
      'z = (count − mean) / standard deviation, using this series’ eight observed days.',
      74,
      419,
      22,
      C.muted,
    );
  if (!embedded) return;

  p.text(
    group ? 'Group attention at patch 3' : 'Time attention within the jobs series',
    72,
    476,
    29,
    C.ink,
    'left',
    'Serif',
  );
  p.text('Jobs', 72, 536, 24, C.ink);
  if (!group) p.line(centerX(0), 536, centerX(3), 536, C.teal, 4);
  if (group) {
    p.text('Launch flag', 72, 616, 24, C.ink);
    p.line(centerX(2), 536, centerX(2), 616, C.gold, 5);
  }
  chronosBlocks.forEach((_, i) => {
    const x = centerX(i);
    const fill = group && i === 2 ? C.gold : C.teal;
    for (const y of group ? [536, 616] : [536]) {
      p.rect(x - 63, y - 19, 126, 38, fill);
      p.mono('Token ' + (i + 1), x, y, 19, C.light, 'center');
    }
  });
  if (p.at(1, 'predicts quantiles'))
    p.text('Forecast head   →   quantiles', 1190, 681, 24, C.blue, 'right');
}
export function errorLedger(p) {
  const abs = p.at(1, 'Now fold'),
    scale = 7.2;
  p.title(
    abs ? 'Fold each signed error about zero' : 'Subtract the issued forecast from the outcome',
    'Daily one-step forecasts and observations   /   Jan 26 to Feb 1   /   jobs',
  );
  const x = (i) => 285 + i * 137,
    ys = 419;
  [
    ['Day', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']],
    ['Forecast', forecast],
    ['Observed', actual],
  ].forEach(([name, vs], j) => {
    const y = 164 + j * 38;
    p.text(name, 78, y, 20, C.muted);
    vs.forEach((v, i) => p.mono(v, x(i), y, 21, j === 2 ? C.teal : C.ink, 'center'));
  });
  p.line(160, ys, 1201, ys, C.edge, 2);
  p.mono('0', 130, ys, 21, C.muted);
  errors.forEach((e, i) => {
    const v = abs ? Math.abs(e) : e;
    // Allocate a separate plot region below the inputs. Friday uses a labeled broken stem.
    const h = Math.sign(v) * Math.min(Math.abs(v), 13) * scale;
    p.line(x(i), ys, x(i), ys - h, i === 4 ? C.red : C.teal, 12);
    if (Math.abs(v) > 13) {
      p.line(x(i) - 10, ys - 51, x(i) + 10, ys - 58, C.paper, 5);
    }
    p.mono(
      abs ? v : signed(v),
      x(i),
      ys - h + (v >= 0 ? -23 : 26),
      24,
      i === 4 ? C.red : C.teal,
      'center',
    );
  });
  if (p.at(1, 'Now fold'))
    p.text(
      'Signed mean   ' + sum(errors) + ' / 7 = ' + mean(errors).toFixed(1),
      90,
      552,
      29,
      C.muted,
      'left',
      'Serif',
    );
  if (p.at(1, null))
    p.text(
      'MAE   ' + sum(errors.map(Math.abs)) + ' / 7 = ' + mae(errors).toFixed(1) + ' jobs',
      90,
      615,
      35,
      C.ink,
      'left',
      'Serif',
    );
  if (p.beat === 2) p.text('Scored after issuance', 1200, 615, 24, C.teal, 'right');
}
export function tariff(p) {
  const q = 0.9,
    f = 100,
    high = p.at(1, 'Now suppose'),
    low = p.at(2, 'How many loss'),
    actual = low ? 90 : 110;
  const solved = low ? p.at(3, 'Those two slopes') : p.at(2, 'Now run');
  const x = (v) => 153 + (v - 85) * 32,
    y = (n) => 484 - n * 24;
  p.title(
    'A different price on each side of capacity',
    'Illustrative P90 forecast score   /   pinball loss',
  );
  p.graph(137, 175, 1017, 325, 32);
  p.line(x(85), y(0), x(115), y(0), C.ink, 2);
  p.line(x(f), y(0), x(f), 177, C.edge, 2, [6, 4]);
  p.line(x(85), y(pinball(85, f, q)), x(f), y(0), C.blue, 5);
  p.line(x(f), y(0), x(114), y(pinball(114, f, q)), C.red, 5);
  p.text('Loss units', 140, 153, 20, C.muted);
  for (const v of [0, 3, 6, 9, 12]) p.mono(v, 124, y(v), 18, C.muted, 'right');
  [90, 100, 110].forEach((v) => p.mono(v, x(v), 523, 25, C.ink, 'center'));
  p.text('Observed demand (jobs)', x(f), 564, 23, C.muted, 'center');
  if (p.beat >= 1) {
    p.text('0.10 per spare place', 173, 382, 22, C.blue);
    p.text('0.90 per missing place', 722, 201, 22, C.red);
  }
  if (high) {
    const loss = pinball(actual, f, q);
    p.dot(x(actual), y(0), 8, C.gold);
    if (solved) {
      p.line(x(actual), y(0), x(actual), y(loss), C.gold, 3, [6, 5]);
      p.dot(x(actual), y(loss), 9, C.gold, true);
    }
    if (low && p.beat === 2)
      p.text('Previous outcome   110 jobs → 9 loss units', 1180, 158, 20, C.muted, 'right');
    p.text(
      (low ? '10 spare × 0.10' : '10 missing × 0.90') +
        '  =  ' +
        (solved
          ? Number(loss.toFixed(2)) + (Math.abs(loss - 1) < 1e-6 ? ' loss unit' : ' loss units')
          : '?'),
      640,
      635,
      35,
      low ? C.blue : C.red,
      'center',
      'Serif',
    );
  } else p.text('Plan for 100 jobs', 640, 635, 36, C.ink, 'center', 'Serif');
}
function pile(p, x, count, railY, changed) {
  const bottom = 467,
    w = 77,
    dx = 12,
    dy = 9,
    h = count * 2.56,
    top = bottom - h;
  p.poly(
    [
      [x, bottom],
      [x + w, bottom],
      [x + w + dx, bottom - dy],
      [x + dx, bottom - dy],
    ],
    '#819382',
  );
  p.rect(x, top, w, h, '#edebd7');
  p.poly(
    [
      [x + w, top],
      [x + w + dx, top - dy],
      [x + w + dx, bottom - dy],
      [x + w, bottom],
    ],
    '#a5b09e',
  );
  for (let i = 1; i < count; i++) p.line(x, top + i * 2.56, x + w, top + i * 2.56, '#b4b7a1', 0.65);
  p.poly(
    [
      [x, top],
      [x + dx, top - dy],
      [x + w + dx, top - dy],
      [x + w, top],
    ],
    railY !== null && count <= railY ? C.mint : changed ? '#e9a06f' : '#fff8d5',
  );
  p.line(x + 14, top - 3, x + 39, top - 3, C.muted, 1);
}
export function printshop(p) {
  const school = p.at(6, 'Eight stacks'),
    outcomes = school ? schoolOrder : mornings;
  const point =
    p.beat <= 2
      ? 10
      : p.beat === 3
        ? mix(10, 19, p.move(3, 'Slide the mark', 1.1))
        : p.beat === 4
          ? mix(19, 100, p.move(4, 'Keep sliding', 2))
          : p.beat === 5
            ? p.at(5, 'That’s the P ninety')
              ? 10
              : 100
            : p.beat === 6
              ? 10
              : p.at(7, 'Write forty')
                ? 40
                : p.at(7, 'The last poster')
                  ? 39
                  : 10;
  const cap = Math.round(point),
    s = rail(outcomes, cap);
  const showRail = p.beat > 0;
  p.rect(0, 0, 1280, 720, '#1c3735');
  p.text(
    school ? 'A new school order' : 'Ten mornings at the print shop',
    80,
    74,
    48,
    C.light,
    'left',
    'Serif',
  );
  p.text('One sheet per job   /   equally likely mornings', 82, 124, 23, '#c2d7cd');
  p.rect(55, 459, 1171, 20, '#526e60');
  p.rect(55, 479, 1171, 17, '#304f46');
  outcomes.forEach((n, i) => pile(p, 155 + i * 101, n, showRail ? cap : null, school && i === 8));
  p.text(school ? 'Eight mornings at 10 jobs' : 'Nine mornings at 10 jobs', 172, 171, 22, C.light);
  p.mono(outcomes[9], 1105, 165, 24, C.light, 'center');
  if (school) p.mono(outcomes[8], 1003, 322, 23, C.light, 'center');
  if (showRail) {
    const yy = 467 - cap * 2.56;
    p.line(91, yy, 1190, yy, C.amber, 3);
    p.rect(47, yy - 17, 97, 33, '#30413a');
    p.mono(cap + ' jobs', 96, yy, 19, C.amber, 'center');
  }
  if (!p.beat) p.text('Mean   ' + mean(outcomes) + ' jobs', 95, 575, 37, C.light, 'left', 'Serif');
  else if (p.beat < 6) {
    if (p.beat === 2 || (p.beat === 3 && !p.at(3, 'Slide the mark'))) {
      p.text(
        'Move 10 → 19 jobs. Does average loss change?',
        640,
        610,
        34,
        C.light,
        'center',
        'Serif',
      );
      return;
    }
    if (p.beat === 1 && !p.at(1, 'Divide by ten')) {
      p.text('One tall morning is 90 jobs above the rail.', 94, 570, 28, C.light);
      return;
    }
    p.text('Nine short mornings', 94, 539, 23, C.mint);
    p.text('One tall morning', 1156, 539, 23, C.amber, 'right');
    const w = 1056,
      xx = 96,
      y = 572;
    p.rect(xx, y, (w * s.small) / 81, 29, C.mint);
    p.rect(xx + (w * s.small) / 81, y, (w * s.large) / 81, 29, C.amber);
    p.mono(
      s.small.toFixed(1) +
        ' + ' +
        s.large.toFixed(1) +
        ' = ' +
        (s.small + s.large).toFixed(0) +
        ' total loss',
      96,
      634,
      24,
      C.light,
    );
    p.text(
      p.beat === 5 && cap === 10
        ? 'P90   ·   first to cover 9/10'
        : p.beat === 1 && !p.at(1, null)
          ? 'Average loss   ?'
          : 'Average loss   ' + s.average.toFixed(1),
      1158,
      634,
      26,
      C.light,
      'right',
      'Serif',
    );
  } else {
    const close = p.beat === 7 && cap >= 39;
    p.text(s.fit + ' / 10 mornings fit', 91, 569, 37, C.mint, 'left', 'Serif');
    if (close) {
      p.text('Poster stack edge', 704, 525, 21, C.light);
      for (let i = 0; i < 4; i++) {
        p.rect(704, 552 + i * 12, 197, 11, i === 0 ? (cap >= 40 ? C.mint : '#df8e60') : '#eee4c7');
      }
      const railTop = 552 + (40 - cap) * 12;
      p.line(691, railTop, 944, railTop, C.amber, 4);
      p.mono(cap + ' jobs', 959, railTop, 20, C.amber);
    }
    if (cap === 40)
      p.text('08:00 shift ticket   ·   reserve 40 jobs', 92, 643, 30, C.light, 'left', 'Serif');
  }
}
function scoreRack(p, values, selected, { ghost = false, x = 105, y = 352, w = 1070 } = {}) {
  const cells = values.length + Number(ghost),
    step = Math.min(73, w / cells);
  for (let i = 0; i < cells; i++) {
    const xx = x + i * step,
      hot = selected === i + 1,
      empty = i >= values.length;
    p.rect(xx, y - 44, step - 4, 79, hot ? (empty ? C.blush : C.band) : empty ? C.fog : '#fffbea');
    p.line(xx, y + 35, xx + step - 4, y + 35, hot ? C.gold : C.edge, hot ? 5 : 2);
    p.mono(empty ? '·' : values[i], xx + step / 2 - 2, y - 6, 29, empty ? C.red : C.ink, 'center');
    p.mono(i + 1, xx + step / 2 - 2, y + 66, 18, hot ? C.gold : C.muted, 'center');
    if (hot)
      p.poly(
        [
          [xx + step / 2 - 9, y - 62],
          [xx + step / 2 + 9, y - 62],
          [xx + step / 2, y - 48],
        ],
        C.gold,
      );
  }
}
export function empirical(p) {
  const absolute = p.at(0, 'Take each error'),
    order = p.at(0, 'Which error'),
    sel = p.at(1, 'The interval'),
    later = p.beat >= 2;
  p.title(
    later ? 'Try the earlier band on the next week' : 'Fourteen errors before Friday',
    later
      ? 'Holdout forecast errors   /   Jan 26–Feb 1'
      : 'Earlier one-day forecasts   /   Jan 12–25',
  );
  if (!later) {
    p.text(
      order
        ? 'Sorted by distance from zero'
        : absolute
          ? 'Distances from zero, in date order'
          : 'Earlier errors in date order',
      105,
      227,
      31,
      C.ink,
      'left',
      'Serif',
    );
    scoreRack(
      p,
      order ? sorted : absolute ? earlier.map(Math.abs) : earlier,
      sel ? sorted.length : null,
    );
    p.text(
      sel ? 'Rank 14 sets a three-job half-width.' : 'Each mark occupies one observation.',
      106,
      505,
      28,
      sel ? C.gold : C.muted,
    );
    if (p.at(1, null))
      p.mono(
        baseline + ' ± ' + width + '     [' + (baseline - width) + ', ' + (baseline + width) + ']',
        106,
        611,
        39,
        C.blue,
      );
  } else {
    weekBand(p, width);
    p.text('Earlier   ' + covered(width, earlier) + '/14', 103, 636, 29, C.muted);
    p.text('Later   ' + covered(width) + '/7 within band', 1178, 636, 31, C.teal, 'right', 'Serif');
  }
}
export function weekBand(p, half) {
  const y = (v) => 442 - v * 6.9,
    x = (i) => 161 + i * 158;
  p.graph(107, 204, 1072, 322, 34);
  p.rect(107, y(half), 1072, half * 13.8, C.band);
  for (const v of [-half, 0, half])
    p.line(107, y(v), 1179, y(v), v === 0 ? C.edge : C.blue, v === 0 ? 1 : 2);
  p.mono('+' + half, 97, y(half), 17, C.blue, 'right');
  p.mono('−' + half, 97, y(-half), 17, C.blue, 'right');
  errors.forEach((v, i) => {
    const xx = x(i),
      clr = Math.abs(v) > half ? C.red : C.teal;
    p.line(xx, y(0), xx, y(v), clr, 4);
    p.dot(xx, y(v), 8, clr);
    p.mono(signed(v), xx, y(v) + (v < 0 ? 26 : -25), 22, clr, 'center');
    p.text(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i], xx, 561, 23, C.ink, 'center');
  });
}
export function gaussian(p) {
  const sq = p.beat >= 1,
    squares = earlier.map((e) => e * e);
  p.title('Estimate scale from forecast misses', 'Fourteen earlier one-day errors   /   jobs');
  const x = (i) => 132 + i * 77;
  p.line(90, 281, 1194, 281, C.edge, 2);
  earlier.forEach((e, i) => {
    const xx = x(i);
    p.line(xx, 281, xx, 281 - e * 23, C.teal, 13);
    p.mono(signed(e), xx, 378, 22, C.ink, 'center');
    if (sq) {
      const side = Math.abs(e) * 16;
      p.rect(xx - side / 2, 467 - side, side, side, C.gold);
      p.mono(squares[i], xx, 494, 21, C.gold, 'center');
    }
  });
  if (sq) p.text('Mean error   ' + mean(earlier).toFixed(1) + ' jobs', 96, 555, 26, C.teal);
  if (p.at(1, 'It measures deviation'))
    p.mono('RMS = √(' + sum(squares) + '/14) ≈ ' + normalRMS.toFixed(2), 598, 555, 27, C.gold);
  if (p.at(2, 'Both bands flag')) {
    p.text('For roughly Gaussian, zero-mean errors with stable scale', 96, 607, 22, C.muted);
    p.text(
      'Approximate half-width   1.96 × RMS ≈ ' + (1.96 * normalRMS).toFixed(1) + ' jobs',
      96,
      653,
      33,
      C.ink,
      'left',
      'Serif',
    );
  }
}
function addCalibrationScores(p) {
  const spread = p.move(3, 'add these five', 0.85);
  const drop = p.move(3, 'including a four', 1.35);
  const combined = drop === 1;
  const rank = conformalRank(extendedRack.length).rank;
  const selected = p.at(4, 'Twenty times');
  const showWidth = p.at(4, null);
  const left = 105, step = 1070 / extendedRack.length;
  p.text(sorted.length + ' retained scores', left, 194, 35, C.ink, 'left', 'Serif');
  if (spread > 0)
    p.text('+ ' + (extendedRack.length - sorted.length) + ' added scores', 552, 194, 35, C.blue, 'left', 'Serif');

  p.text('Jobs', left - 14, 346, 23, C.ink, 'right');
  if (combined) p.text('Rank', left - 14, 418, 23, C.muted, 'right');
  extendedRack.forEach(({ value, originalIndex }, i) => {
    const added = originalIndex === null;
    if (added && spread === 0) return;
    const targetX = left + i * step;
    const x = added ? targetX : mix(left + originalIndex * 73, targetX, spread);
    const y = added ? mix(252, 346, drop) : 346;
    const w = (added ? step : mix(73, step, spread)) - 4;
    const hot = selected && i + 1 === rank;
    p.rect(x, y - 36, w, 72, added ? C.blue : '#fffbea');
    p.mono(value, x + w / 2, y, 36, added ? C.light : C.ink, 'center');
    p.line(x, y + 36, x + w, y + 36, hot ? C.gold : C.edge, hot ? 7 : 2);
    if (combined && (i === 0 || (i + 1) % 5 === 0 || i === extendedRack.length - 1))
      p.mono(i + 1, x + w / 2, 418, 25, hot ? C.gold : C.muted, 'center');
    if (hot)
      p.poly([[x + w / 2 - 13, 276], [x + w / 2 + 13, 276], [x + w / 2, 299]], C.gold);
  });
  if (combined) {
    p.mono('ceil((' + extendedRack.length + ' + 1) × 0.95) = ' + (selected ? rank : '?'), left, 499, 36, C.ink);
    if (showWidth)
      p.text('Half-width   ' + extendedRack[rank - 1].value + ' jobs', left, 565, 39, C.teal, 'left', 'Serif');
  }
}
export function finite(p) {
  const split = p.beat >= 1,
    k = split ? conformalRank(sorted.length).rank : Math.ceil(sorted.length * 0.95);
  p.title(
    split ? 'Leave room for one new score' : 'Select the empirical rank',
    split
      ? '95% marginal coverage   /   fixed predictor independent of calibration   /   exchangeable scores'
      : 'Ordered absolute errors   /   target coverage 95%',
  );
  if (p.at(3, 'Keep those fourteen errors')) {
    addCalibrationScores(p);
    return;
  }
  const reveal = split ? p.at(2, 'Run your finger') : p.at(0, null);
  p.text(sorted.length + ' calibration scores', 104, 213, 35, C.ink, 'left', 'Serif');
  scoreRack(p, sorted, reveal ? k : null, { ghost: split && reveal });
  p.mono(
    split ? 'ceil((' + sorted.length + ' + 1) × 0.95)' : 'ceil(14 × 0.95)',
    104,
    510,
    31,
    C.blue,
  );
  if (reveal) p.mono('Rank ' + k, 803, 510, 31, C.gold);
  const showWidth = split ? p.at(2, 'Using the maximum') : reveal;
  if (showWidth)
    p.text(
      k > sorted.length
        ? 'Empty rank   ·   half-width ∞'
        : 'Selected half-width   ' + sorted[k - 1] + ' jobs',
      104,
      614,
      37,
      k > sorted.length ? C.red : C.teal,
      'left',
      'Serif',
    );
}
export function adaptive(p) {
  const continued = p.beat === 5;
  const arrived = continued ? p.at(5, 'Its indicator') : p.at(2, 'The new working level'),
    first = p.at(2, 'A smaller working'),
    second = p.at(5, 'Carry the updated');
  const a0 = 0.1,
    a1 = alphaUpdate(a0, 0.1, 0.05, 1),
    a2 = alphaUpdate(a1, 0.1, 0.05, 0);
  const rolling = p.beat === 0 && !p.at(0, 'Adaptive conformal inference');
  p.title(
    rolling ? 'Move the calibration window' : 'Which interval can still change?',
    rolling
      ? 'One score enters when its outcome arrives'
      : 'Adaptive conformal inference   /   target miss rate 0.10',
  );
  if (rolling) {
    const shift = p.at(0, 'A short window');
    const es = earlier.slice(0, 6),
      start = shift ? 1 : 0;
    p.text('Recent absolute errors', 99, 228, 33, C.ink, 'left', 'Serif');
    es.forEach((e, i) => {
      const x = 110 + i * 166,
        on = i >= start && i < start + 5;
      p.rect(x, 289, 135, 95, on ? C.band : C.fog);
      p.mono(
        i === 5 && !shift ? '?' : Math.abs(e),
        x + 68,
        338,
        35,
        on ? C.teal : C.muted,
        'center',
      );
    });
    p.bracket(110 + start * 166, 110 + (start + 4) * 166 + 135, 442, 'Five available errors');
    p.text(
      shift ? 'An observed score replaces the oldest score.' : 'The next score is still unknown.',
      112,
      584,
      27,
      C.muted,
    );
    return;
  }
  const xx = [93, 472, 856],
    labels = ['Already issued', 'Outcome arrives', 'Next eligible issue'];
  xx.forEach((x, i) => {
    p.ticket(x, 228, 309, 242);
    p.text(labels[i], x + 45, 276, 24, C.muted);
  });
  p.mono(continued ? 'α = ' + a1.toFixed(3) : 'α = 0.10', xx[0] + 45, 345, 32, C.blue);
  p.text('Locked at issue', xx[0] + 45, 408, 21, C.muted);
  p.text(
    arrived ? (continued ? 'Covered' : 'Miss') : 'Waiting',
    xx[1] + 45,
    344,
    37,
    continued ? C.teal : arrived ? C.red : C.muted,
    'left',
    'Serif',
  );
  if (arrived) p.mono('indicator = ' + Number(!continued), xx[1] + 45, 407, 22, C.ink);
  const ready = continued ? second : first;
  p.mono(
    ready ? 'α = ' + (continued ? a2 : a1).toFixed(3) : 'α = ?',
    xx[2] + 45,
    345,
    31,
    ready ? C.teal : C.muted,
  );
  if (ready) p.mono('1−α = ' + (1 - (continued ? a2 : a1)).toFixed(3), xx[2] + 45, 407, 21, C.teal);
  p.arrow(406, 350, 456, 350);
  p.arrow(789, 350, 840, 350);
  if (p.beat >= 1)
    p.mono(
      arrived
        ? continued
          ? '0.055 + 0.05 × (0.10 − 0)'
          : '0.10 + 0.05 × (0.10 − 1)'
        : 'α next = α now + γ × (target α − miss)',
      113,
      562,
      31,
      C.ink,
    );
  if (p.beat === 4)
    p.text('Audit coverage and width under the deployed update policy.', 112, 630, 23, C.muted);
}
