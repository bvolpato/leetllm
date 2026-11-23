import {
  ink,
  dim,
  paper,
  line,
  blue,
  red,
  teal,
  gold,
  purple,
  colors,
  seq,
  sum,
  mix,
  pct,
} from './recorder.mjs';
import { requests, latePrefixes, lateProbability } from '../../../films/sampling/model.mjs';
import { rareEventBudget, metropolisAcceptance } from '../../../films/sampling/arithmetic.mjs';
import { samplingFilmData as data } from '../../../films/sampling/fixtures.mjs';

export function impossible(p) {
  const pdf = (t) => Math.exp(-0.5 * ((t - 8) / 6) ** 2) / (6 * Math.sqrt(2 * Math.PI));
  if (p.b === 2) {
    const x = p.axis(119, 300, 690, 0, 420, [0, 100, 200, 300, 400], 'median in seconds');
    const centers = [Math.log(6), 6];
    centers.forEach((v, i) => {
      const y = 178 + 65 * i,
        t = Math.exp(v);
      p.rule(x(0), y, x(t), y, colors[i], 3);
      p.dot(x(t), y, 7, colors[i]);
      p.label(
        (i ? 'μ = 6' : 'μ = log(6)') + '     median ' + t.toFixed(1) + ' s',
        i ? x(t) - 12 : x(t) + 12,
        y - 10,
        19,
        colors[i],
        i ? 'right' : 'left',
      );
    });
    p.num('Median = exp(μ)', 119, 127, 22, blue);
    p.num('Mean = exp(μ + σ² / 2)', 465, 127, 22, teal);
    p.footer('The center is in log seconds.');
    return;
  }
  const g = p.plot({
    xmin: -16,
    xmax: 32,
    xt: [-16, -8, 0, 8, 16, 24, 32],
    ymax: 0.075,
    yt: [0, 0.03, 0.06],
    unit: 'proposed seconds',
    measure: 'normal density',
  });
  g.fill(pdf, -16, 0, '#daa28a');
  g.curve(pdf, blue);
  p.rule(g.X(0), g.Y(0), g.X(0), g.Y(0.071), red, 1.5);
  const clip = p.cue(1, 'Clipping negatives', 1.5);
  if (clip > 0) {
    for (let i = 0; i < 10; i++) {
      p.dot(g.X(mix(-9 + i * 0.72, 0, clip)), g.Y(0) - 5 - i * 5.5 * clip, 3.5, red);
    }
  }
  p.readout(p.b ? 'Original sample below zero' : 'Sample below zero', '≈ 9.5%', 655, 187, red);
  p.readout(
    p.b ? 'Clipped values' : 'Lowest draw',
    p.b ? (clip === 1 ? 'pile at 0' : '→ 0 s') : '−15.7 s',
    655,
    286,
  );
  p.footer(
    'A duration cannot finish before its request arrives.',
    '5,000 normal draws, mean parameter 8 s, standard deviation 6 s.',
  );
}

export const survive = (ms) => Math.exp((-20 * ms) / 1000);
export function service(p) {
  const g = p.plot({
    xmax: 200,
    xt: [0, 50, 100, 150, 200],
    yt: [0, 0.5, 1],
    unit: 'time in service (ms)',
    measure: 'fraction still in service',
  });
  g.curve(survive, blue);
  const start = 50 * p.cue(1, 'still busy after fifty', 1.4),
    end = start + 100;
  [start, end].forEach((t) => {
    p.rule(g.X(t), g.Y(0), g.X(t), g.Y(survive(t)), teal, 2);
    p.dot(g.X(t), g.Y(survive(t)), 6, teal);
  });
  p.rule(g.X(start), g.Y(0.18), g.X(end), g.Y(0.18), gold, 2);
  p.readout('Already in service', Math.round(start) + ' ms');
  const known = p.b !== 1 && p.cue(0, 'about thirteen and a half percent', 1) === 1;
  p.readout('Chance of 100 ms more', known ? pct(survive(end) / survive(start)) : '?', 655, 286);
  p.footer(
    p.b >= 3
      ? '20 completions/s corresponds to 0.05 s per service.'
      : 'Slide a 100 ms interval along the survival curve.',
    p.b === 4
      ? 'Seeded run: mean 0.049 s and 13.2% above 0.1 s.'
      : p.b === 3
        ? 'Python takes the rate. NumPy takes the mean time as its scale.'
        : 'Condition on the requests that are still busy at the start of the interval.',
  );
}

export function sample(p) {
  const n = Math.floor(
    5 * p.cue(0, 'Watch the first five', 2) + 15 * p.cue(1, 'Continue the same stream', 2.4),
  );
  const x = p.axis(79, 343, 550, 0, 22, [0, 5, 10, 15, 20], 'duration (seconds)');
  p.rule(x(10), 137, x(10), 343, red, 2);
  p.label('10 s', x(10), 125, 17, red, 'center');
  const seen = requests.slice(0, n);
  seen.forEach((r) => {
    const px = x(r.bin * 2 + 1),
      py = 325 - 27 * r.stack;
    p.dot(px, py, 12, r.late ? red : blue);
    p.num(r.id, px, py + 4, 11, '#fff9e8', 'center');
  });
  const late = seen.filter((r) => r.late).length;
  p.readout('Late / drawn', late + ' / ' + n);
  p.readout('Sample late rate', n ? pct(late / n) : '…', 655, 286);
  if (p.b === 2) {
    p.label('Miss all of the upper 5%', 655, 365, 17, dim);
    p.num(pct(0.95 ** 20), 655, 394, 28, gold);
  }
  p.footer(
    'Each request keeps its number as the sample grows.',
    p.b === 2 ? 'The tail-miss chance is for 20 independent draws.' :
      'Two-second bins. Red marks identify replies later than ten seconds.',
  );
}

export function monte(p) {
  const g = p.plot({
    xmin: 0,
    xmax: 33,
    ymin: 0.04,
    ymax: 0.32,
    xt: [1, 8, 16, 24, 32],
    yt: [0.1, 0.2, 0.3],
    unit: 'experiment number',
    measure: 'fraction missing ten seconds',
  });
  const n = Math.round(100 * Math.pow(100, p.cue(1, 'append new draws', 3)));
  const count = Math.round(32 * p.cue(0, 'each dot', 1.8));
  g.curve(() => lateProbability, gold);
  latePrefixes.slice(0, count).forEach((prefix, i) => {
    let x = g.X(i + 1);
    if (n > 100) {
      p.rule(x, g.Y(prefix[100] / 100), x, g.Y(prefix[n] / n), '#94b0ae', 1);
      p.dot(x, g.Y(prefix[100] / 100), 2, paper, dim);
    }
    p.dot(x, g.Y(prefix[n] / n), 4, teal);
  });
  p.readout('Draws per experiment', n.toLocaleString('en-US'));
  p.readout(
    'Standard error',
    pct(Math.sqrt((lateProbability * (1 - lateProbability)) / n), 2),
    655,
    286,
  );
  if (p.b === 3) {
    p.rect(643, 348, 239, 43, '#e1e1cb');
    p.num('A01  ·  seed 20261029', 652, 375, 16, ink);
  }
  p.footer(
    p.b
      ? 'Keep the first hundred. Add draws to each stream.'
      : 'One dot, one hundred-request experiment.',
    p.b === 3
      ? 'Replay also needs the generator, version, code and draw order.'
      : p.b === 2
        ? '100 times as many independent draws reduces the standard error by a factor of 10.'
        : 'The gold line is the model probability. It stays fixed.',
  );
}

export const failure = 0.0001,
  budget = rareEventBudget(failure),
  empty = (n) => Math.exp(n * Math.log1p(-failure));
export function detection(p) {
  const g = p.plot({
    xmax: 32000,
    xt: [0, 10000, 20000, 30000],
    yt: [0, 0.5, 1],
    unit: 'independent requests',
    measure: 'chance of an empty run',
  });
  const n = Math.round(mix(5000, budget, p.cue(4, 'round up to a whole request', 2)));
  const know = p.cue(2, 'It comes to about', 0.75) === 1;
  if (know) g.curve(empty, teal, 0, n);
  if (p.b >= 3) g.curve(() => 0.05, red);
  if (know) p.dot(g.X(n), g.Y(empty(n)), 7, teal);
  p.readout('Draw budget', n.toLocaleString('en-US'));
  p.readout(
    p.b === 5 ? 'Relative standard error' : 'Chance of no failures',
    p.b === 5 ? pct(Math.sqrt((1 - failure) / (n * failure)), 0) : know ? pct(empty(n)) : '?',
    655,
    286,
  );
  if (p.b >= 4) {
    p.label('Expected failures', 655, 365, 17, dim);
    p.num((n * failure).toFixed(2), 655, 394, 28, gold);
  }
  p.footer(
    p.b >= 4
      ? 'Detection and precision require different budgets.'
      : 'How often would 5,000 requests include zero failures?',
    p.b >= 4
      ? ''
      : 'Each request avoids the failure with probability 0.9999.',
  );
}

export function replay(p) {
  const rows = [data.replicaCounts[0], data.replicaCounts[0], data.replicaCounts[1]];
  const count = [
    Math.floor(4 * p.cue(0, 'Sample four batches', 1.7)),
    Math.floor(3 * p.cue(1, 'Watch the first three', 1.3)) +
      Number(p.cue(2, 'Twelve comes back', 0) === 1),
    Math.floor(4 * p.cue(3, 'Start B', 1.4)),
  ];
  const skipped = p.b === 0 && p.cue(0, 'one extra batch', 0) === 1;
  const firstLogged = skipped && p.cue(0, 'Fourteen, from the second batch', 0) === 1;
  rows.forEach((v, i) => {
    if (i > p.b || (i === 2 && p.b < 3)) return;
    const y = 145 + i * 91,
      col = i === 2 ? purple : teal;
    p.rect(185, y - 17, 635, 57, '#d5d2bd');
    p.rect(183, y - 20, 635, 57, '#fffae9', line);
    for (const edge of [193, 808]) {
      for (const off of [-9, 6, 21]) p.dot(edge, y + off, 2.5, '#c8cbb7');
    }
    p.label(['Stream A', 'Replay A', 'Stream B'][i], 61, y + 15, 23, col, 'left', 'Serif');
    v.forEach((n, j) => {
      const x = 259 + 155 * j;
      p.rule(x - 62, y + 26, x + 62, y + 26, line);
      const consumed = skipped && i === 0 && j === 0;
      p.num(j < count[i] ? n : '?', x, y + 15, 32, consumed || j >= count[i] ? dim : col, 'center');
      if (consumed) {
        p.rule(x - 27, y + 9, x + 26, y - 3, red, 2.5);
        p.label('Consumed', x, y + 65, 18, red, 'center');
      }
      if (firstLogged && i === 0 && j === 1) {
        p.path(
          [
            [x - 5, y + 49],
            [x, y + 40],
            [x + 5, y + 49],
          ],
          teal,
          2,
          teal,
        );
        p.label('First logged', x, y + 75, 18, teal, 'center');
      }
    });
    if (i === 1 && count[1] === 4) {
      p.label('copy', 858, y + 13, 17, dim, 'center');
    }
  });
  p.footer(
    p.b === 0
      ? firstLogged
        ? 'Logging starts at the second batch.'
        : skipped
          ? 'Which count will be written first?'
          : 'Read the four batches in draw order.'
      : count[1] < 3
        ? 'Rewind A and repeat the original calls.'
        : count[1] < 4
          ? 'Which count prints in the fourth replay position?'
          : p.b === 2
            ? 'A replay reproduces all four positions.'
            : p.cue(3, 'Count A once and B once', 0) === 1
              ? 'Average A once and B once.'
              : 'Run B with its own recorded stream.',
    p.b >= 3
      ? 'Keep stream IDs, seeds, generator and library versions, code and draw order.'
      : 'Each number is the resolved count in one batch of twenty requests.',
  );
}

const low = 0.5,
  high = 0.6;
const observations = [8, 2];
export const prior = [2, 2],
  posterior = prior.map((n, i) => n + observations[i]);
export function betaDensity(x, [a, b]) {
  // For integer parameters, 1/B(a,b) = (a+b-1) × binomial(a+b-2, a-1).
  let scale = a + b - 1;
  for (let i = 1; i < a; i++) scale *= (b + i - 1) / i;
  return scale * x ** (a - 1) * (1 - x) ** (b - 1);
}
export const mh = [
  metropolisAcceptance(low, high),
  metropolisAcceptance(high, low),
  metropolisAcceptance(high, low, 0.5),
];
export function recordMove(from, to, draw, probability) {
  return draw <= probability ? to : from;
}
export function metropolis(p) {
  const reverse = p.b >= 3,
    corrected = p.cue(5, 'Multiply the target ratio', 0) === 1,
    a = mh[corrected ? 2 : reverse ? 1 : 0],
    u = corrected ? 0.25 : 0.4;
  const updated = p.cue(0, 'That gives', 0) === 1;
  const params = updated ? posterior : prior;
  const started = p.cue(1, 'Start the chain at one half', 0) === 1;
  const g = p.plot({
    x: 73,
    y: 144,
    w: 314,
    h: 135,
    xmax: 1,
    ymax: 4,
    xt: [0, 0.5, 1],
    yt: [],
    unit: 'resolution probability',
    measure: updated ? 'posterior density' : 'prior density',
  });
  const weight = (x) => betaDensity(x, params);
  if (updated && p.b < 2) {
    g.curve((x) => betaDensity(x, prior), '#9ba8a2');
    p.label('Prior', g.X(0.27), g.Y(betaDensity(0.27, prior)) - 8, 15, dim, 'center');
  }
  g.curve(weight, blue);
  if (p.b === 1 && p.cue(1, 'Its mean is ten fourteenths', 0) === 1) {
    const mean = posterior[0] / sum(posterior);
    p.rule(g.X(mean), g.Y(0), g.X(mean), g.Y(weight(mean)), gold, 2);
    p.label('Target mean   10 / 14 ≈ ' + mean.toFixed(3), 453, 326, 17, gold);
  }
  const moved = p.cue(2, 'Move the dot', 0.9);
  const cur = mix(low, high, moved);
  if (p.b >= 2) {
    const proposal = reverse ? low : high;
    p.dot(g.X(proposal), g.Y(weight(proposal)), 6, paper, gold);
  }
  if (started) p.dot(g.X(cur), g.Y(weight(cur)), 7, teal);
  const windowReady = reverse
    ? p.cue(3, 'target ratio is now', 0) === 1
    : p.cue(2, 'acceptance is one', 0) === 1;
  if (p.b < 2) {
    p.label('Eight resolutions in ten requests', 453, 162, 23, ink, 'left', 'Serif');
    seq(sum(observations), (i) =>
      p.dot(
        472 + i * 40,
        202,
        10,
        i < observations[0] ? teal : paper,
        i < observations[0] ? teal : red,
      ),
    );
    p.num(
      (updated ? 'Posterior' : 'Prior') + '   Beta(' + params.join(', ') + ')',
      451,
      258,
      23,
      ink,
    );
    if (p.cue(0, 'Add eight resolutions', 0) === 1)
      p.num('2 + 8 resolutions    2 + 2 escalations', 453, 296, 16, dim);
  } else {
    const x = 462,
      w = 406;
    p.label(reverse ? 'Proposal   0.60 → 0.50' : 'Proposal   0.50 → 0.60', x, 151, 21, ink);
    p.num(
      windowReady ? 'α = ' + a.toFixed(3) + (corrected ? '   (factor ½)' : '') : 'α = ?',
      x,
      193,
      21,
      teal,
    );
    p.rect(x, 216, w, 28, '#d7cfbd');
    if (windowReady) p.rect(x, 216, w * a, 28, teal);
    const showDraw =
      p.b >= 5
        ? p.cue(5, 'draw is one quarter', 0) === 1
        : p.cue(3, 'lands at point four', 0) === 1;
    if (reverse && showDraw) {
      p.path(
        [
          [x + w * u, 244],
          [x + w * u - 7, 257],
          [x + w * u + 7, 257],
        ],
        null,
        0,
        red,
      );
      p.num('draw ' + u.toFixed(2), x + w * u, 283, 18, red, 'center');
    }
  }
  const next = recordMove(high, low, 0.4, mh[1]),
    last = recordMove(next, low, 0.25, mh[2]);
  const values = [low, high, next, last],
    shown = [
      true,
      moved === 1,
      p.cue(4, 'Write point six again', 1.2) === 1,
      p.cue(6, 'Record point six once more', 1.45) === 1,
    ];
  if (started) p.label('Chain', 73, 381, 23, ink, 'left', 'Serif');
  values.forEach((v, i) => {
    if (!started || (i > 0 && p.b < [0, 2, 3, 5][i])) return;
    const x = 208 + 166 * i;
    p.rect(x, 341, 123, 56, '#fff8e5', line);
    p.num(shown[i] ? v.toFixed(2) : '?', x + 61, 378, 28, shown[i] ? ink : dim, 'center');
  });
  p.footer(
    p.b === 0
      ? updated
        ? 'Eight resolutions shift the peak toward higher rates.'
        : 'Start with a symmetric prior over resolution rates.'
      : p.b === 1
        ? 'The posterior is the distribution the chain should explore.'
        : !reverse
          ? windowReady
            ? 'A move to higher density is accepted for this symmetric proposal.'
            : 'Compare the proposed height with the current height.'
          : corrected
            ? 'Apply the reverse / forward proposal-density ratio.'
            : 'Compare the new uniform draw to the acceptance window.',
    p.b < 2
      ? updated
        ? 'Blue is the target after observing the ten requests. Gray shows the prior on the same scale.'
        : 'Each filled mark is a resolution. Each open mark is an escalation.'
      : p.b >= 4
        ? 'Each decision uses one slot. Rejection prints the current probability again.'
        : 'The common normalizing constant cancels in the target ratio.',
  );
}

export function chains(p) {
  const many = p.b >= 3,
    n = many ? 240 : p.b === 0 ? 1 : 6;
  const g = p.plot({
    xmax: n === 1 ? 6 : n,
    xmin: 1,
    xt: many ? [1, 80, 160, 240] : [1, 2, 3, 4, 5, 6],
    ymin: 0,
    ymax: 1,
    yt: [0, 0.5, 1],
    measure: 'retained resolution probability',
    unit: 'iteration after warmup',
  });
  if (p.b === 5) {
    p.rect(g.x, g.Y(1), g.w, g.Y(0.85) - g.Y(1), '#dcdcc5');
    g.curve(() => 0.85, gold);
  }
  data.chains.slice(0, many ? 4 : 1).forEach((chain, k) => {
    const pts = chain.first240.slice(0, n).map((v, i) => [g.X(i + 1), g.Y(v)]);
    p.path(pts, colors[k], many ? 1 : 3);
    if (!many) pts.forEach(([x, y], i) => p.dot(x, y, 6, i === 2 && p.b >= 2 ? red : teal));
  });
  if (many) {
    p.label(
      p.b === 5
        ? 'Above 0.85 in excerpt'
        : p.b === 4
          ? 'Lag-one correlation'
          : 'Mean of 10,000 states',
      649,
      151,
      18,
      dim,
    );
    data.chains.forEach((v, i) => {
      p.dot(662, 189 + i * 44, 6, colors[i]);
      p.num(
        p.b === 5
          ? v.first240.filter((x) => x > 0.85).length + ' / 240'
          : (p.b === 4 ? v.lag1 : v.mean).toFixed(3),
        686,
        196 + i * 44,
        24,
        ink,
      );
    });
  } else {
    p.readout('Kept per chain', '10,000');
    p.readout(
      p.b === 2 ? 'Second and third' : 'Warmup discarded',
      p.b === 2 ? data.chains[0].first240[1].toFixed(3) : '2,000',
      655,
      286,
    );
  }
  p.footer(
    p.b === 5
      ? 'Do all four excerpts reach the shaded tail?'
      : many
        ? 'Inspect the trace as well as its mean.'
        : p.b === 0
          ? 'The first mark is the first state kept after warmup.'
          : p.b === 1
            ? 'What happened between the second and third iterations?'
            : 'A rejected step still occupies an iteration.',
    many
      ? 'Four starts, 240 shown per chain. Target mean = 10 / 14.'
      : 'Proposal noise has standard deviation 0.15.',
  );
}

export const gibbs = [
  [2, -2],
  [-1.6, -2],
  [-1.6, -1.28],
];
export const tailThreshold = 0.85;
export const tailWindows = [15, 89].map((first) => ({
  first,
  states: data.chains[0].first240.slice(first - 1, first + 15),
}));

function tailVisits(p) {
  const compare = p.cue(1, 'Compare another sixteen', 0) === 1;
  const labelVisits = p.cue(1, 'Three in a row', 0) === 1;
  const secondCount = p.cue(1, 'Three are high again', 0) === 1;
  p.label('One chain  ·  start 0.10  ·  retained steps after warmup', 71, 131, 17, dim);
  tailWindows.slice(0, compare ? 2 : 1).forEach(({ first, states }, panel) => {
    const x0 = 82 + panel * 437;
    const xs = (i) => x0 + 22 * i;
    const ys = (v) => 285 - 110 * v;
    p.label(
      'Steps ' + first + '–' + (first + states.length - 1),
      x0,
      168,
      24,
      ink,
      'left',
      'Serif',
    );
    p.rect(x0 - 7, ys(1), 344, ys(tailThreshold) - ys(1), '#e6d5b0');
    p.rule(x0 - 7, ys(tailThreshold), xs(15) + 7, ys(tailThreshold), gold, 1.4);
    p.label('0.85', xs(15) + 11, ys(tailThreshold) + 5, 14, gold);
    p.path(
      states.map((v, i) => [xs(i), ys(v)]),
      blue,
      2.2,
    );
    states.forEach((v, i) => {
      const high = v > tailThreshold;
      p.dot(xs(i), ys(v), high ? 4.5 : 3, high ? gold : blue);
      p.rect(xs(i) - 8, 290, 16, 24, high ? gold : '#e0e1cf');
      p.num(high ? '1' : '0', xs(i), 308, 15, high ? paper : dim, 'center');
    });
    const hits = states.flatMap((v, i) => (v > tailThreshold ? [first + i] : []));
    if (panel ? secondCount : labelVisits) {
      p.label('Above 0.85 at steps ' + hits.join(', '), x0, 353, 18, ink);
      const stays = hits.filter((step, i) => step !== hits[i - 1] + 1).length;
      p.label(
        stays === 1 ? '1 continuous stay' : stays + ' separate stays',
        x0,
        384,
        20,
        gold,
        'left',
        'Serif',
      );
    }
  });
  const full = p.cue(1, 'On the full chains', 0) === 1;
  p.footer(
    full
      ? 'Use the full chains to estimate effective sample size.'
      : 'Each 1 marks a kept state above 0.85.',
    full
      ? 'Use bulk ESS for the center. For a high percentile, inspect tail ESS and the error of that percentile.'
      : compare
        ? 'Both strips show sixteen steps. Read the spacing between the high states.'
        : 'These sixteen consecutive steps illustrate how neighboring draws can share information.',
  );
}

export function diagnostics(p) {
  if (p.b === 0) {
    data.chains.forEach((ch, i) => {
      const top = 134 + i * 62;
      p.label('Start ' + ch.start.toFixed(2), 65, top + 18, 16, colors[i]);
      const pts = ch.first240.map((v, k) => [184 + 2.7 * k, top + 38 - 48 * v]);
      p.path(pts, colors[i], 1.5);
      if (p.cue(0, 'Split each trace', 0) === 1) p.rule(508, top - 10, 508, top + 33, gold, 2);
    });
    if (p.cue(0, 'Split each trace', 0) === 1)
      p.label('Split each trace', 508, 400, 16, gold, 'center');
    p.footer(
      'Compare the first and second halves of each chain.',
      'Each strip shows 240 retained states. Compute split R-hat on the full chains.',
    );
  } else if (p.b === 1) {
    tailVisits(p);
  } else {
    const g = p.plot({
      x: 99,
      y: 132,
      w: 415,
      h: 224,
      xmin: -3,
      xmax: 3,
      ymin: -3,
      ymax: 3,
      xt: [-3, 0, 3],
      yt: [-3, 0, 3],
      unit: 'x',
      measure: 'y',
    });
    for (const radius of [0.65, 1.3, 2.05]) {
      const pts = seq(121, (i) => {
        let a = (i * Math.PI) / 60,
          x = radius * Math.cos(a),
          y = 0.8 * x + 0.6 * radius * Math.sin(a);
        return [g.X(x), g.Y(y)];
      });
      p.path(pts, line, 1.6);
    }
    const a = p.cue(4, 'puts x at negative one point six', 1.6),
      z = p.cue(5, 'puts y at negative one point two eight', 1.7);
    const x = mix(gibbs[0][0], gibbs[1][0], a),
      y = mix(gibbs[0][1], gibbs[2][1], z);
    p.path(
      [
        [g.X(2), g.Y(-2)],
        [g.X(x), g.Y(-2)],
        [g.X(x), g.Y(y)],
      ],
      red,
      3,
    );
    p.dot(g.X(x), g.Y(y), 6, red);
    p.readout('Current (x, y)', '(' + x.toFixed(2) + ', ' + y.toFixed(2) + ')', 571, 185);
    p.readout('Conditional spread', '0.60', 571, 281);
    p.footer(
      'One coordinate moves while the other stays fixed.',
      'The red path visits conditional medians. A Gibbs draw adds fresh conditional noise at each step.',
    );
  }
}
