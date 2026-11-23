import {
  C,
  colors,
  cue,
  mix,
  fmt,
  pct,
  total,
  rect,
  line,
  path,
  ellipse,
  dot,
  text,
  head,
  readout,
  graph,
  band,
  pin,
  split,
  specimen,
} from './drawing.mjs';
import {
  data,
  cohortSizes,
  hitRate,
  normal,
  twoPeaks,
  pooled,
  jars,
  stripes,
  bandMass,
  oddsState,
  nearLimit,
  membershipAt,
} from './experiments.mjs';

function marble(ctx, x, y, r, striped) {
  const glaze = ctx.createRadialGradient(
    x - r * 0.35,
    y - r * 0.4,
    1,
    x + 0.12 * r,
    y + 0.1 * r,
    r * 1.15,
  );
  glaze.addColorStop(0, '#fff7d8');
  glaze.addColorStop(0.65, '#ddce9f');
  glaze.addColorStop(1, '#866b50');
  dot(ctx, x, y, r, glaze);
  if (striped) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.clip();
    ctx.translate(x, y);
    ctx.rotate(-0.45);
    for (const h of [-0.55, 0, 0.55]) {
      ctx.beginPath();
      ctx.moveTo(-r, h * r + 6);
      ctx.quadraticCurveTo(0, h * r - 10, r, h * r + 6);
      ctx.lineWidth = r * 0.19;
      ctx.strokeStyle = '#394750';
      ctx.stroke();
    }
    ctx.restore();
  }
  ellipse(ctx, x - r * 0.32, y - r * 0.49, r * 0.17, r * 0.08, '#fff9e1a8');
}
function jar(ctx, x, k, inspect) {
  const color = colors[k];
  ctx.save();
  ctx.translate(x, 65);
  const glass = ctx.createLinearGradient(-101, 0, 101, 0);
  glass.addColorStop(0, '#7a9ca7');
  glass.addColorStop(0.09, '#3d5662');
  glass.addColorStop(0.38, '#1c323e');
  glass.addColorStop(0.89, '#25404b');
  glass.addColorStop(1, '#66828b');
  ctx.beginPath();
  ctx.moveTo(-71, 57);
  ctx.lineTo(-71, 76);
  ctx.bezierCurveTo(-71, 94, -98, 91, -98, 125);
  ctx.lineTo(-98, 259);
  ctx.quadraticCurveTo(-98, 276, -76, 277);
  ctx.lineTo(76, 277);
  ctx.quadraticCurveTo(98, 277, 98, 259);
  ctx.lineTo(98, 125);
  ctx.bezierCurveTo(98, 91, 71, 94, 71, 76);
  ctx.lineTo(71, 57);
  ctx.closePath();
  ctx.fillStyle = glass;
  ctx.fill();
  ctx.strokeStyle = '#b1c7c7';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  rect(ctx, -77, 45, 154, 21, '#a58f68', 4);
  for (let i = -72; i < 76; i += 8) line(ctx, i, 48, i, 62, '#73674f', 2);
  rect(ctx, -43, 39, 86, 35, color, 3);
  text(ctx, 'Jar ' + (k ? 'B' : 'A'), 0, 57, 22, C.deep, 'center', 'Serif', 600);
  jars[k].forEach((striped, i) => {
    const cx = i % 2 ? 38 : -36,
      cy = i < 2 ? 151 : 224;
    marble(ctx, cx, cy, 34, striped);
    if (inspect && striped) ellipse(ctx, cx, cy, 36.5, 36.5, null, color, 3);
  });
  line(ctx, -87, 128, -87, 244, '#e7f5e256', 2.5);
  ctx.restore();
}

export function opening(ctx, clock) {
  const b = clock.beat.beatIndex + 1;
  if (b > 2) return gapStudy(ctx, clock, true);
  // A single outlet conceals the chosen route. Jar contents show the inventory before the draw.
  const revealJars = cue(clock, 1, 'what each jar held before the draw', 0.45);
  const settled = cue(clock, 1, 'came down the covered chute', 0.85);
  const gy = mix(224, 274, settled);
  ellipse(ctx, 480, 228, 139, 138, '#0c1720', '#b5a278', 5);
  ellipse(ctx, 480, 228, 130, 129, '#223745', '#415561', 2);
  rect(ctx, 443, 98, 74, 56, '#46565b', 5);
  ellipse(ctx, 480, 152, 37, 9, '#101c23', '#929688', 2);
  ellipse(ctx, 480, 322, 78, 13, '#c1a573');
  ellipse(ctx, 480, 319, 68, 9, '#655c4a');
  marble(ctx, 480, gy, 43, true);
  text(ctx, 'Observed draw', 480, 391, 24, C.ink, 'center', 'Serif');
  if (revealJars) {
    ctx.save();
    ctx.globalAlpha = revealJars;
    jar(ctx, 197, 0, b === 2);
    jar(ctx, 763, 1, b === 2);
    ctx.restore();
    text(ctx, 'Before draw  ·  P(A) = ½', 197, 376, 16, C.soft, 'center');
    text(ctx, 'Before draw  ·  P(B) = ½', 763, 376, 16, C.soft, 'center');
  }
  const counts = cue(clock, 2, 'three come from jar A');
  if (counts) {
    stripes.forEach((n, k) => {
      const x = k ? 763 : 197;
      for (let i = 0; i < n; i++) {
        const mx = x + (i - (n - 1) / 2) * 39;
        dot(ctx, mx, 435, 18, colors[k]);
        marble(ctx, mx, 435, 14, true);
      }
      if (cue(clock, 2, 'give A three quarters'))
        text(ctx, n + ' / ' + total(stripes), x, 485, 27, colors[k], 'center', 'Mono');
    });
  }
}
export function gapStudy(ctx, clock, opening = false) {
  const one = opening
    ? cue(clock, 4, 'Fit one bell curve')
    : cue(clock, 2, 'Trace the single bell curve');
  const two = opening ? cue(clock, 4, 'Fit a mixture') : cue(clock, 3, 'Trace the green curve');
  head(ctx, opening ? 'Six recorded request times' : 'What lands between the peaks?');
  const g = graph(
    ctx,
    [72, 142, 624, 182],
    [10, 110],
    [0, 0.13],
    [10, 30, 50, 70, 90, 110],
    [0, 0.05, 0.1],
    'Request time (ms)',
    'Density per ms',
  );
  band(ctx, g, 50, 70);
  text(ctx, '50–70 ms', g.X(60), g.t + 19, 17, C.gold, 'center', 'Mono');
  if (!opening && one) g.trace(pooled, null, 0, 50, 70, '#83c9ff78');
  if (!opening && two) g.trace(twoPeaks, null, 0, 50, 70, '#92e1be99');
  if (!opening || one) g.trace(pooled, C.fast, 3);
  if (!opening || two) g.trace(twoPeaks, C.sum, 3);
  text(ctx, 'Measured', 57, 385, 16, C.soft);
  line(ctx, g.X(21), 385, g.X(100), 385, C.grid, 1.5);
  for (const [i, x] of data.entries()) {
    const px = g.X(x),
      offset = [-26, 0, 26][i % 3];
    const labelY = i % 3 === 1 ? 413 : 401;
    dot(ctx, px, 385, 3.5, C.gold);
    line(ctx, px, 391, px + offset, labelY - 7, C.gold, 1);
    text(ctx, x, px + offset, labelY, 17, C.gold, 'center', 'Mono');
  }
  readout(ctx, 'Sample mean', '60 ms', 742, 132, C.ink, 30);
  const counted = !opening || cue(clock, 4, 'Zero');
  readout(ctx, 'Observed in band', counted ? '0 of 6' : '?', 742, 211, C.gold, 30);
  if (opening) {
    if (one) text(ctx, 'Single Gaussian', 742, 351, 19, C.fast);
    if (two) text(ctx, 'Mixture', 742, 390, 19, C.sum);
  } else {
    const s = cue(clock, 2, 'About twenty-six percent'),
      m = cue(clock, 3, 'Fewer than one in a million');
    readout(ctx, 'Single Gaussian', s ? pct(bandMass[0], 1) : '?', 742, 285, C.fast, 27);
    readout(ctx, 'Two components', m ? '< 1 in 1M' : '?', 742, 367, C.sum, 25);
  }
}
function cohort(ctx, x, y, observed, hit, caption) {
  text(ctx, caption, x + 99, y - 28, 24, C.ink, 'center', 'Serif');
  for (let i = 0; i < 100; i++) {
    const px = x + (i % 10) * 21,
      py = y + Math.floor(i / 10) * 21;
    rect(ctx, px, py, 16, 16, i < observed ? (i < hit ? C.sum : C.gold) : C.metal, 3);
    if (i < hit) line(ctx, px + 4, py + 8, px + 12, py + 8, C.deep, 2);
  }
  text(
    ctx,
    observed === null ? '100 requests' : observed + ' with x',
    x + 102,
    y + 230,
    19,
    C.gold,
    'center',
    'Mono',
  );
  if (hit !== null) text(ctx, hit + ' hits with x', x + 102, y + 263, 20, C.sum, 'center', 'Mono');
}
export function classifier(ctx, clock) {
  const b = clock.beat.beatIndex + 1;
  if (b <= 3) {
    head(ctx, 'Two populations, 100 requests each');
    const n1 = cue(clock, 1, 'twenty-five have that input') ? cohortSizes[0] : null;
    const n2 = cue(clock, 2, 'seventy-five do') ? cohortSizes[1] : null;
    const hit = cue(clock, 2, 'fifteen hits');
    cohort(ctx, 113, 126, n1, hit ? hitRate * n1 : null, 'Population A');
    const secondHit = cue(clock, 2, 'forty-five in the second');
    cohort(ctx, 638, 126, n2, secondHit ? hitRate * n2 : null, 'Population B');
    text(ctx, 'Hits among x', 480, 202, 20, C.soft, 'center');
    text(ctx, '60%', 480, 254, 43, C.sum, 'center', 'Mono');
    if (b === 3) text(ctx, 'P(x, hit) = P(x) × P(hit | x)', 480, 412, 24, C.ink, 'center', 'Mono');
  } else if (b === 4) {
    head(ctx, 'Two ways to read the same joint');
    const steps = [
      ['Class frequency', 'P(hit)'],
      ['Inputs among hits', 'P(x | hit)'],
      ['Joint frequency', 'P(x, hit)'],
    ];
    steps.forEach(([s, v], i) => {
      const x = 70 + i * 303;
      specimen(ctx, x, 206, 220, s, v, i === 2 ? C.sum : C.fast);
      if (i < 2) text(ctx, i ? '=' : '×', x + 259, 239, 34, C.gold, 'center');
    });
    text(ctx, 'P(hit | x) = P(x, hit) / P(x)', 480, 360, 26, C.ink, 'center', 'Mono');
    text(
      ctx,
      'P(x) adds the joint contributions from hits and misses.',
      480,
      408,
      19,
      C.soft,
      'center',
    );
  } else if (b === 5) {
    head(ctx, 'Density has units. Area is probability.');
    const g = graph(
      ctx,
      [96, 142, 555, 260],
      [29.2, 30.8],
      [0, 2.1],
      [29.5, 30, 30.5],
      [0, 1, 2],
      'Request time (ms)',
      'Density per ms',
    );
    const fn = (x) => normal(x, 30, 0.04);
    g.trace(fn, C.fast, 3);
    if (cue(clock, 5, 'Shade an interval')) {
      g.trace(fn, C.fast, 3, 29.8, 30.2, '#80c9ff62');
      readout(ctx, 'In 29.8–30.2 ms', '68.3%', 701, 277, C.fast, 29);
    }
    readout(ctx, 'Peak density', fmt(fn(30)) + ' / ms', 701, 160, C.ink, 26);
  } else {
    head(ctx, b === 6 ? 'Requests from one queue' : 'Sampling with a prompt');
    if (b === 6) {
      text(ctx, 'Arrival time', 76, 139, 19, C.soft);
      line(ctx, 80, 265, 880, 265, C.grid, 4);
      [108, 221, 355, 374, 393, 412, 584, 755, 819].forEach((x, i) => {
        const burst = i >= 2 && i <= 5;
        line(ctx, x, 264, x, burst ? 190 : 221, burst ? C.gold : C.fast, 4);
        dot(ctx, x, burst ? 190 : 221, 6, burst ? C.gold : C.fast);
      });
      text(ctx, 'one tenant bursts', 384, 160, 20, C.gold, 'center');
      text(
        ctx,
        'Adjacent observations can depend on the same queue.',
        480,
        392,
        24,
        C.ink,
        'center',
        'Serif',
      );
    } else {
      text(ctx, 'Given prompt', 80, 145, 18, C.soft);
      text(ctx, '“The request took”', 80, 219, 36, C.ink, 'left', 'Serif');
      for (const [i, w] of ['ten', 'fifty', 'ninety'].entries()) {
        line(ctx, 424, 230, 588, 148 + i * 83, C.grid, 2);
        text(ctx, w, 603, 148 + i * 83, 27, i === 1 ? C.gold : C.soft, 'left', 'Serif');
      }
      text(ctx, 'sample one continuation', 603, 411, 20, C.gold);
    }
  }
}
export function mixture(ctx, clock) {
  const b = clock.beat.beatIndex + 1;
  const mean = mix(30, 44, cue(clock, 3, 'Slide the fast mean', 2));
  const m = membershipAt(50, [mean, 90], 20, 0.5);
  head(
    ctx,
    b === 1 ? 'Choose a component, then draw a time' : 'Sum the two contributions at the probe',
  );
  const g = graph(
    ctx,
    [75, 145, 550, 217],
    [0, 120],
    [0, 0.021],
    [0, 30, 60, 90, 120],
    [0, 0.01, 0.02],
    'Request time (ms)',
    b === 1 ? 'Component density per ms' : 'Weighted density per ms',
  );
  const factor = b === 1 ? 1 : 0.5;
  for (const [k, mu] of m.means.entries()) g.trace((x) => factor * normal(x, mu, 400), colors[k]);
  if (b === 1) {
    readout(ctx, 'Fast component', '½  ·  30 ms', 666, 151, C.fast, 25);
    readout(ctx, 'Slow component', '½  ·  90 ms', 666, 260, C.slow, 25);
    text(ctx, 'Both spreads are 20 ms.', 666, 384, 20, C.soft);
  } else {
    g.trace((x) => total(m.means.map((mu) => 0.5 * normal(x, mu, 400))), C.sum);
    pin(ctx, g, 50, '50 ms');
    m.contributions.forEach((n, k) => {
      dot(ctx, g.X(50), g.Y(n), 5, colors[k]);
      readout(
        ctx,
        k ? 'Slow contribution' : 'Fast contribution',
        fmt(n, 5),
        666,
        116 + k * 92,
        colors[k],
        29,
      );
    });
    readout(ctx, 'Total density', fmt(m.total, 5), 666, 301, C.sum, 29);
    text(ctx, 'Log likelihood across requests', 666, 371, 17, C.soft);
    text(ctx, 'Σ log(fast + slow)', 666, 399, 21, C.ink, 'left', 'Mono');
  }
}
function traceRecord(ctx, s) {
  rect(ctx, 76, 75, 804, 31, C.deep, 5, C.grid, 1.5);
  text(ctx, 'Request trace', 95, 90, 20, C.ink, 'left', 'Serif');
  text(ctx, s.model.x + ' ms', 318, 90, 19, C.gold, 'left', 'Mono');
  text(ctx, 'cache.status', 568, 90, 18, C.soft, 'left', 'Mono');
  text(
    ctx,
    s.trace === null ? 'sealed' : 'HIT',
    859,
    90,
    23,
    s.trace === null ? C.soft : C.sum,
    'right',
    'Mono',
    600,
  );
}
export function comparison(ctx, clock, transfer = false) {
  const s = oddsState(clock, transfer),
    m = s.model;
  head(ctx, transfer ? 'A new request at 45 ms' : 'One request at 50 ms');
  const g = graph(
    ctx,
    [76, 155, 448, 212],
    [0, 120],
    [0, transfer ? 0.03 : 0.022],
    [0, 30, 60, 90, 120],
    transfer ? [0, 0.015, 0.03] : [0, 0.01, 0.02],
    'Request time (ms)',
    'Unweighted density per ms',
  );
  for (const [k, mu] of m.means.entries()) {
    g.trace((x) => normal(x, mu, m.deviation ** 2), colors[k]);
    dot(ctx, g.X(m.x), g.Y(m.densities[k]), 5.2, colors[k]);
  }
  pin(ctx, g, m.x, m.x + ' ms');
  const x = 570,
    w = 310,
    u = 32;
  text(
    ctx,
    s.showOdds ? 'Compare prior-weighted evidence' : 'Read density in slow-height units',
    x,
    122,
    19,
    C.ink,
    'left',
    'Serif',
  );
  const showRatio = transfer
    ? cue(clock, 1, 'fast density is about')
    : cue(clock, 2, 'fast height stretches');
  text(ctx, 'Fast', x, 162, 16, C.fast);
  if (showRatio) rect(ctx, x, 181, s.ratio * u, 17, C.fast, 2);
  if (showRatio) text(ctx, fmt(s.ratio), x + s.ratio * u + 9, 190, 16, C.fast, 'left', 'Mono');
  text(ctx, 'Slow', x, 223, 16, C.slow);
  const count = s.showOdds ? s.odds : 1;
  rect(ctx, x, 242, count * u, 17, C.slow, 2);
  for (let i = 1; i < count; i++) line(ctx, x + i * u, 242, x + i * u, 259, C.deep, 1.3);
  text(
    ctx,
    s.showOdds ? 'Prior odds   1 fast : ' + s.odds + ' slow' : 'One slow height = one unit',
    x,
    288,
    18,
    C.soft,
  );
  if (s.showOdds) {
    text(ctx, 'Share of this request', x, 352, 19, C.ink, 'left', 'Serif');
    if (s.result) {
      split(ctx, x, 380, w, 24, m.responsibilities[0]);
      text(ctx, 'Fast ' + pct(m.responsibilities[0], 1), x, 415, 20, C.fast);
      text(ctx, 'Slow ' + pct(m.responsibilities[1], 1), x + w, 415, 20, C.slow, 'right');
    } else {
      rect(ctx, x, 380, w, 24, null, 2, C.grid);
      text(ctx, '?', x + w / 2, 392, 18, C.gold, 'center');
    }
  }
  if (s.traceOpen) traceRecord(ctx, s);
}
export function narrowing(ctx, clock) {
  const s = nearLimit(clock);
  head(ctx, s.tie ? 'A request midway between two Gaussian means' : 'A uniquely closer center');
  const g = graph(
    ctx,
    [78, 151, 542, 215],
    [0, 120],
    [0, 0.21],
    [0, 30, 60, 90, 120],
    [0, 0.1, 0.2],
    'Request time (ms)',
    'Unweighted density per ms',
  );
  for (const [k, mu] of s.params.means.entries())
    g.trace((x) => normal(x, mu, s.width ** 2), colors[k], 3);
  pin(ctx, g, s.x, s.x + ' ms');
  readout(ctx, 'Shared deviation', fmt(s.width, 1) + ' ms', 663, 130, C.ink, 28);
  readout(
    ctx,
    'Fast / slow prior',
    s.params.weights.map((w) => pct(w)).join(' / '),
    663,
    235,
    C.soft,
    25,
  );
  text(ctx, 'Membership', 663, 343, 18, C.ink);
  split(ctx, 663, 368, 230, 22, s.r);
  text(ctx, (s.r > 0.999 ? '>99.9%' : pct(s.r, 1)) + ' fast', 663, 411, 23, C.fast, 'left', 'Mono');
}
