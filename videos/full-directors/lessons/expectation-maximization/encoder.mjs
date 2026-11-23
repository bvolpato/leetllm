import { C, cue, mix, fmt, pct, line, path, dot, text, head, graph, split } from './drawing.mjs';
import { klExample, normal, membershipAt, reconstructionTrace, vaeFits } from './experiments.mjs';

function winding(ctx, x, y, w, h, color) {
  // Both encoder outputs pass through this same set of learned weights.
  path(
    ctx,
    [
      [x, y + 12],
      [x + w * 0.18, y],
      [x + w, y],
      [x + w, y + h - 12],
      [x + w * 0.82, y + h],
      [x, y + h],
    ],
    C.grid,
    1.8,
    C.metal,
  );
  for (let i = 0; i < 4; i++) {
    const xx = x + 17 + (i * (w - 34)) / 3;
    line(ctx, xx, y + 12, xx, y + h - 13, color, 2.4);
    dot(ctx, xx, y + 18 + ((i * 13) % (h - 30)), 4.5, color);
  }
}
export function routes(ctx, clock) {
  const b = clock.beat.beatIndex + 1;
  head(ctx, 'Two ways to infer a hidden value');
  text(ctx, 'Gaussian mixture', 74, 131, 25, C.ink, 'left', 'Serif');
  const r = membershipAt(50, [30, 90], 20, 0.5).responsibilities;
  text(ctx, '50 ms', 74, 194, 21, C.gold, 'left', 'Mono');
  line(ctx, 169, 193, 236, 193, C.grid, 3);
  split(ctx, 238, 179, 255, 26, r[0]);
  text(
    ctx,
    pct(r[0], 1) + ' fast   ' + pct(r[1], 1) + ' slow',
    238,
    235,
    18,
    C.fast,
    'left',
    'Mono',
  );
  line(ctx, 500, 193, 575, 193, C.grid, 3);
  text(ctx, 'Weighted Gaussian fit', 594, 194, 23, C.ink, 'left', 'Serif');
  if (b === 1) return;
  line(ctx, 73, 263, 884, 263, C.grid);
  text(ctx, 'Variational autoencoder', 74, 288, 25, C.ink, 'left', 'Serif');
  winding(ctx, 80, 316, 86, 50, C.gold);
  line(ctx, 166, 340, 242, 340, C.gold);
  const pts = Array.from({ length: 150 }, (_, i) => [
    245 + i,
    363 - 57 * Math.exp(-0.5 * ((i - 68) / 25) ** 2),
  ]);
  path(ctx, pts, C.gold, 3);
  line(ctx, 245, 365, 394, 365, C.grid);
  line(ctx, 394, 342, 490, 342, C.grid, 2);
  winding(ctx, 495, 316, 86, 50, C.sum);
  text(ctx, 'Encoder', 122, 384, 17, C.gold, 'center');
  text(ctx, 'Continuous z', 320, 384, 17, C.gold, 'center');
  text(ctx, 'Decoder', 538, 384, 17, C.sum, 'center');
  text(ctx, 'Joint gradient update', 619, 342, 23, C.ink, 'left', 'Serif');
  if (b === 3) {
    const progress = cue(clock, 3, 'both take gradient steps', 1.2);
    if (progress) {
      const route = [
        [710, 363],
        [710, 412],
        [122, 412],
        [122, 399],
      ];
      path(ctx, route, C.sum, 1.7);
      line(ctx, 538, 412, 538, 399, C.sum, 1.7);
      for (const xx of [122, 538]) {
        const tip = mix(710, xx, progress);
        dot(ctx, tip, 412, 4, C.sum);
        if (progress === 1)
          path(
            ctx,
            [
              [xx - 5, 405],
              [xx, 398],
              [xx + 5, 405],
            ],
            C.sum,
            2,
          );
      }
    }
  }
}
function sharedEncoder(ctx, clock) {
  const b = clock.beat.beatIndex + 1;
  head(ctx, 'One encoder serves three observations');
  const input = [-1, 0, 1.5],
    means = input.map((x) => 0.8 * x + 0.1);
  const active =
    b === 1 ? Math.min(2, Math.floor(3 * cue(clock, 1, 'three different inputs', 2.1))) : 2;
  input.forEach((v, i) => {
    const y = 167 + 92 * i,
      col = i === active ? C.gold : C.soft;
    text(ctx, 'x = ' + v, 96, y, 21, col, 'left', 'Mono');
    line(ctx, 199, y, 317, 260, col, i === active ? 2.4 : 1);
    line(ctx, 442, 260, 541, y, col, i === active ? 2.4 : 1);
    const pts = Array.from({ length: 155 }, (_, j) => {
      const z = -3 + (6 * j) / 154;
      return [555 + j * 1.65, y + 21 - 49 * Math.exp(-0.5 * ((z - means[i]) / 0.62) ** 2)];
    });
    path(ctx, pts, col, 2.7);
    line(ctx, 550, y + 21, 818, y + 21, C.grid, 1);
    text(ctx, 'z', 833, y + 21, 17, C.soft);
  });
  winding(ctx, 317, 222, 126, 77, C.gold);
  text(ctx, 'shared weights', 379, 334, 17, C.gold, 'center');
  text(
    ctx,
    b === 1
      ? 'One function returns a distribution for each x.'
      : 'A nonlinear decoder usually leaves an integral over continuous z.',
    480,
    414,
    21,
    C.ink,
    'center',
    'Serif',
  );
}
function terms(ctx, clock) {
  const b = clock.beat.beatIndex + 1;
  head(ctx, 'Which KL goes where?');
  const x = (v) => 100 + (v + 7) * 259;
  line(ctx, x(-7), 299, x(-4), 299, C.soft);
  for (let i = -7; i <= -4; i++) {
    line(ctx, x(i), 296, x(i), 308, C.soft);
    text(ctx, i, x(i), 336, 19, C.soft, 'center', 'Mono');
  }
  const { reconstruction, priorPenalty, bound: lower, gap, logEvidence } = klExample;
  const toBound = cue(clock, 3, 'Subtract a prior penalty', 1);
  dot(ctx, x(reconstruction), 299, 8, C.fast);
  text(ctx, 'Reconstruction', x(reconstruction), 203, 22, C.fast, 'center', 'Serif');
  text(ctx, fmt(reconstruction, 1), x(reconstruction), 241, 25, C.fast, 'center', 'Mono');
  if (toBound) {
    const bx = x(mix(reconstruction, lower, toBound));
    line(ctx, x(reconstruction), 285, bx, 285, C.gold, 4);
    dot(ctx, bx, 285, 6, C.gold);
    if (toBound === 1) {
      text(ctx, 'ELBO  ' + fmt(lower, 1), x(lower), 382, 22, C.gold, 'center', 'Mono');
      text(ctx, 'Prior penalty  ' + fmt(priorPenalty, 1), 480, 413, 20, C.gold, 'center');
    }
  }
  if (b === 4) {
    const end = cue(clock, 4, 'add that gap', 1.2);
    const to = x(lower + gap * end);
    line(ctx, x(lower), 265, to, 265, C.sum, 4);
    dot(ctx, to, 265, 6, C.sum);
    if (end === 1) {
      text(ctx, 'Log evidence', x(logEvidence), 155, 23, C.sum, 'center', 'Serif');
      text(ctx, fmt(logEvidence, 1), x(logEvidence), 196, 25, C.sum, 'center', 'Mono');
    }
    text(ctx, 'Posterior gap  ' + fmt(gap, 1), 705, 413, 20, C.sum, 'center');
  }
}
function drawSample(ctx, clock) {
  const b = clock.beat.beatIndex + 1;
  const nudgeMu = cue(clock, 8, 'Nudge the mean up', 0.8);
  const reset = cue(clock, 8, 'Reset the mean', 0.65);
  const nudgeSd = cue(clock, 8, 'nudge the standard deviation up', 0.8);
  const t = reconstructionTrace(1 + 0.1 * nudgeMu * (1 - reset), 2 + 0.1 * nudgeSd);
  head(ctx, 'Follow one noise draw through reconstruction');
  const g = graph(
    ctx,
    [77, 155, 389, 181],
    [-5, 7],
    [0, 0.23],
    [-4, -2, 0, 2, 4, 6],
    [0, 0.1, 0.2],
    'Latent value z',
    'Encoder density',
  );
  g.trace((z) => normal(z, t.mean, t.deviation ** 2), C.fast);
  const sample = cue(clock, 5, 'sample is two');
  if (sample) {
    line(ctx, g.X(t.z), g.b, g.X(t.z), g.Y(normal(t.z, t.mean, t.deviation ** 2)), C.gold, 2.4);
    dot(ctx, g.X(t.z), g.b, 6, C.gold);
  }
  text(ctx, 'Noise ε = 0.5', 510, 125, 19, C.soft, 'left', 'Mono');
  text(ctx, 'z = μ + σ × ε', 510, 177, 28, C.ink, 'left', 'Serif');
  text(
    ctx,
    fmt(t.mean) + ' + ' + fmt(t.deviation) + ' × 0.5',
    510,
    229,
    22,
    C.fast,
    'left',
    'Mono',
  );
  if (sample) text(ctx, 'z = ' + fmt(t.z), 510, 280, 30, C.gold, 'left', 'Mono');
  if (b >= 6) {
    text(ctx, 'Decoder   w = 1    x = 3', 510, 337, 19, C.sum, 'left', 'Mono');
    text(
      ctx,
      '½(' + fmt(t.prediction) + ' − 3)² = ' + fmt(t.loss, 3),
      510,
      390,
      22,
      C.sum,
      'left',
      'Mono',
    );
  }
  if (b === 7 || b === 8)
    text(
      ctx,
      '∂L/∂μ = ' +
        fmt(t.meanGradient, 2) +
        '      ∂L/∂σ = ' +
        fmt(t.deviationGradient, 2) +
        '      ∂L/∂w = ' +
        fmt(t.weightGradient, 2),
      480,
      415,
      21,
      C.ink,
      'center',
      'Mono',
    );
}
function movingGap(ctx, clock) {
  const answer = cue(clock, 10, 'At minus eight');
  head(ctx, 'Where will the log evidence land?');
  const X = (x) => 176 + (x + 11) * 126;
  for (const [i, { bound: lower, gap, logEvidence }] of vaeFits.entries()) {
    if (i === 1 && !cue(clock, 9, 'Now raise the bound')) continue;
    const y = 203 + 130 * i;
    text(ctx, i ? 'Next fit' : 'First fit', 61, y + 4, 22, C.ink, 'left', 'Serif');
    line(ctx, X(-11), y, X(-6), y, C.grid);
    const endX = X(logEvidence);
    const known = i === 0 || answer;
    dot(ctx, X(lower), y, 8, C.gold);
    text(ctx, 'bound ' + fmt(lower, 0), X(lower), y + 40, 19, C.gold, 'center', 'Mono');
    if (known) {
      line(ctx, X(lower), y, endX, y, C.sum, 4);
      dot(ctx, endX, y, 7, C.sum);
      text(ctx, 'gap +' + gap, (X(lower) + endX) / 2, y - 29, 18, C.soft, 'center', 'Mono');
      text(ctx, 'log evidence ' + fmt(logEvidence, 0), endX, y + 72, 18, C.sum, 'center', 'Mono');
    } else {
      text(ctx, 'gap +' + gap + '    log evidence ?', X(lower) + 42, y - 25, 19, C.soft, 'left', 'Mono');
    }
  }
}
export function latent(ctx, clock) {
  const b = clock.beat.beatIndex + 1;
  if (b <= 2) return sharedEncoder(ctx, clock);
  if (b <= 4) return terms(ctx, clock);
  if (b <= 8) return drawSample(ctx, clock);
  return movingGap(ctx, clock);
}
