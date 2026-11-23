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
import {
  queuePlan,
  mm1Means,
  tokenProbabilities,
  ksGeometry,
  normalCdf,
} from '../../../films/sampling/arithmetic.mjs';
import { durationFromRank, durationCdf, durationDensity } from '../../../films/sampling/model.mjs';
import { cohort, targetRank } from '../../../films/sampling/cohort.mjs';
import { samplingFilmData as data } from '../../../films/sampling/fixtures.mjs';
import { expensive } from './draws.mjs';

export const firstBurst = queuePlan([0, 10, 20], [50, 50, 50]);
export const pool = (n) => queuePlan([0, 5, 10, 15], [20, 20, 20, 20], n);
export function queue(p, fresh) {
  const old = fresh ? pool(1) : firstBurst;
  const moved = fresh ? p.cue(4, 'Follow the blue bars', 2) : 0,
    result = fresh ? pool(2) : firstBurst;
  const x = p.axis(
    173,
    353,
    680,
    0,
    fresh ? 85 : 160,
    fresh ? [0, 10, 20, 30, 40, 50, 60, 70, 80] : [0, 25, 50, 75, 100, 125, 150],
    'shared clock (milliseconds)',
  );
  const draw = fresh
    ? p.cue(1, 'Run the worker', 1.8)
    : p.cue(1, 'Slide the other two blocks', 1.8);
  old.forEach((r, i) => {
    const y = 151 + i * (fresh ? 47 : 75),
      finishBy = r.arrival + 40,
      col = blue;
    p.label('R' + r.id, 64, y + 9, 21, ink, 'left', 'Mono');
    p.dot(x(r.arrival), y, 4, ink);
    p.rule(x(r.arrival), y, x(fresh ? finishBy : 160), y, line);
    if (fresh) {
      p.rule(x(finishBy), y - 18, x(finishBy), y + 18, red, 2);
    }
    const visible = fresh ? draw : !i ? 1 : draw;
    if (visible === 0) return;
    const start = mix(r.start, result[i].start, moved),
      finish = start + r.service;
    if (moved > 0) p.rect(x(r.start), y - 9, x(r.finish) - x(r.start), 18, null, dim);
    p.rule(x(r.arrival), y, x(start), y, gold, 4);
    p.rect(x(start), y - 8, (x(finish) - x(start)) * visible, 16, col);
    if (visible === 1) {
      p.dot(x(finish), y, 4, ink);
    }
    if (fresh && visible === 1 && (moved === 0 || moved === 1)) {
      p.num(Math.round(start) + ' → ' + Math.round(finish), x(start) + 4, y + 5, 12, '#fff6df');
    }
    if (!fresh && visible === 1) {
      p.label(
        'wait ' + r.wait + '  +  work ' + r.service + '  =  ' + r.total + ' ms',
        x(r.arrival),
        y + 31,
        15,
        dim,
      );
    }
  });
  p.label(
    fresh ? 'Red tick = arrival + 40 ms' : 'Blue block = 50 ms of service',
    173,
    121,
    17,
    fresh ? red : blue,
  );
  if (fresh && p.b >= 4) {
    p.rule(456, 115, 485, 115, gold, 4);
    p.label('Waiting', 495, 121, 17, dim);
    p.rect(626, 108, 27, 14, null, dim);
    p.label('Previous service', 664, 121, 17, dim);
  }
  let title = 'Where can the next block fit?';
  if (!fresh && draw === 1) title = 'R3 waits 80 ms before its 50 ms of service.';
  if (fresh)
    title =
      p.b < 2
        ? 'Which replies miss their own forty-millisecond timer?'
        : p.spoken(5, "That's four of four on time", false) === 1
          ? 'Two workers finish all four on time.'
          : moved === 1
            ? 'Two workers. Same arrivals and service times.'
            : p.b >= 3
              ? 'Add a worker. Keep the four arrivals and service times.'
              : 'One worker finishes two of four on time.';
  p.footer(
    title,
    fresh && p.b >= 4
      ? ''
      : fresh
        ? 'A thin lead shows waiting.'
        : 'Measure each total from that request’s own arrival mark.',
  );
}

export function stationary(p) {
  const rate = mix(15, 19, p.cue(5, 'Raise arrivals', 2));
  const stable = mm1Means(rate, 20),
    g = p.plot({
      xmax: 20,
      ymax: 1.1,
      xt: [0, 5, 10, 15, 20],
      yt: [0, 0.5, 1],
      unit: 'arrivals / second',
      measure: 'mean time (seconds)',
    });
  g.curve((x) => mm1Means(x, 20).total, blue, 0, 19.08);
  g.curve((x) => mm1Means(x, 20).queue, teal, 0, 19.08);
  p.rule(g.X(20), g.Y(0), g.X(20), g.Y(1.08), red, 2);
  p.dot(g.X(rate), g.Y(stable.total), 7, blue);
  p.label('One worker · service rate 20/s', 648, 148, 17, dim);
  if (p.b < 4) {
    p.readout('Little’s Law', 'L = λW', 648, 194);
    p.label('Stable M/M/1', 648, 295, 20, ink);
    p.num('λ < μ', 648, 331, 24, teal);
  } else {
    p.readout('Utilization', pct(stable.utilization, 0), 648, 188);
    p.readout('Wait + service', (stable.queue * 1000).toFixed(0) + ' + 50 ms', 648, 281);
  }
  p.footer(
    p.b < 3
      ? 'What changes as arrivals approach service capacity?'
      : 'Mean total time = 1 / (μ − λ).',
    p.b >= 5
      ? 'At 20 arrivals/s this model loses its finite steady-state mean.'
      : 'Blue = total.  Teal = queue.  Poisson arrivals, exponential service, first come first served.',
  );
}

export const tokens = ['blue', 'clear', 'cloudy', 'green'],
  logits = [2.2, 1.5, 0.2, -1.5],
  rank = 0.6229016948897019;
const enamel = ['#6195be', '#94c6b4', '#afa4ba', '#abb97c'];
export function keepNucleus(shares, threshold) {
  const order = shares.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
  const kept = shares.map(() => 0);
  let total = 0;
  for (const { v, i } of order) {
    kept[i] = v;
    total += v;
    if (total >= threshold) break;
  }
  return kept.map((v) => v / total);
}
export function choose(probs, u) {
  let total = 0;
  for (let i = 0; i < probs.length; i++) if (u < (total += probs[i])) return i;
  return probs.length - 1;
}
function dial(p, probs, showNeedle) {
  const { c } = p,
    cx = 280,
    cy = 259,
    r = 122,
    turn = Math.PI * 2,
    angle = (u) => (u - rank) * turn;
  p.dot(cx, cy, r + 14, '#a38c5d', ink);
  p.dot(cx, cy, r + 9, '#19383a');
  let a = 0;
  probs.forEach((v, i) => {
    if (!v) return;
    c.beginPath();
    c.moveTo(cx, cy);
    c.arc(cx, cy, r, angle(a), angle(a + v));
    c.closePath();
    c.fillStyle = enamel[i];
    c.fill();
    const m = angle(a + v / 2);
    if (v > 0.075 && Math.abs(Math.sin(m)) > 0.13)
      p.label(
        tokens[i],
        cx + Math.cos(m) * r * 0.66,
        cy + Math.sin(m) * r * 0.66 + 4,
        16,
        ink,
        'center',
        'Serif',
      );
    a += v;
  });
  for (let i = 0; i < 100; i++) {
    const t = angle(i / 100);
    p.rule(
      cx + Math.cos(t) * (r + 2),
      cy + Math.sin(t) * (r + 2),
      cx + Math.cos(t) * (r + (i % 10 ? 4 : 8)),
      cy + Math.sin(t) * (r + (i % 10 ? 4 : 8)),
      '#ead8ac',
      0.9,
    );
  }
  if (showNeedle > 0) {
    const t = angle(rank * showNeedle);
    p.path(
      [
        [cx - 5 * Math.sin(t), cy + 5 * Math.cos(t)],
        [cx + (r + 2) * Math.cos(t), cy + (r + 2) * Math.sin(t)],
        [cx + 5 * Math.sin(t), cy - 5 * Math.cos(t)],
      ],
      ink,
      1,
      '#ebd6a7',
    );
  }
  p.dot(cx, cy, 10, '#be9b62', ink);
  p.dot(cx, cy, 4, ink);
}
export function wheel(p, temperatureChapter) {
  let temp = 1;
  if (temperatureChapter)
    temp += -0.7 * p.cue(1, 'Cool the wheel', 1.6) + 1.7 * p.cue(2, 'Warm the wheel', 1.7);
  const full = tokenProbabilities(temp);
  const excluded = temperatureChapter && p.spoken(3, 'Green drops out', false) === 1;
  const division = excluded ? p.cue(3, 'Divide the remaining shares', 1) : 0;
  const normalized = excluded && division === 1;
  const retained = excluded ? keepNucleus(full, 0.9) : full;
  const probs = excluded
    ? retained.map((v, i) => (v ? mix(full[i], v, division) : 0))
    : full;
  const visible = temperatureChapter || p.b > 0;
  if (visible) dial(p, probs, temperatureChapter ? 1 : p.cue(2, 'Follow the recorded draw', 2.1));
  else {
    p.label('Subtract the largest score', 74, 169, 23, ink, 'left', 'Serif');
    logits.forEach((v, i) => {
      const y = 224 + i * 40;
      p.num(v.toFixed(1) + ' − 2.2', 77, y, 18, dim);
      p.rule(203, y - 6, 222, y - 6, line);
      p.num((v - 2.2).toFixed(1), 241, y, 22, colors[i]);
    });
  }
  const known = temperatureChapter
    ? !excluded || (normalized && p.spoken(3, 'draw from those three words', false) === 1)
    : p.cue(3, 'Our draw landed', 0.2) === 1;
  p.label(
    'The sky is ' + (known ? tokens[choose(probs, rank)] + '.' : '…'),
    466,
    149,
    31,
    ink,
    'left',
    'Serif',
  );
  p.label('Word', 465, 191, 16, dim);
  p.label('Logit', 675, 191, 16, dim, 'right');
  const massLabel = normalized ? 'New share' : division > 0 ? 'Rescaling' : excluded ? 'Retained mass' : 'Mass';
  p.label(visible ? massLabel : 'Weight', 858, 191, 16, dim, 'right');
  tokens.forEach((w, i) => {
    const y = 230 + 36 * i;
    p.dot(474, y - 6, 6, enamel[i], dim);
    p.label(w, 494, y, 20, ink);
    p.num(logits[i].toFixed(1), 678, y, 19, dim, 'right');
    p.num(
      visible
        ? probs[i] > 0 && probs[i] < 0.0005
          ? '<0.05%'
          : pct(probs[i], 1)
        : Math.exp(logits[i] - 2.2).toFixed(3),
      859,
      y,
      20,
      ink,
      'right',
    );
  });
  if (visible)
    p.num(
      'T = ' + temp.toFixed(2) + (temperatureChapter || p.b >= 2 ? '     u = 0.623' : ''),
      466,
      392,
      20,
      teal,
    );
  p.footer(
    excluded
      ? 'Keep the smallest ranked prefix that covers 90%.'
      : temperatureChapter
        ? 'The edge moves under a fixed needle.'
        : 'Each word owns its share of one turn.',
    excluded
      ? division === 0
        ? 'Green is excluded. The three retained shares still have their original sizes.'
        : 'Divide each retained share by their sum before drawing.'
      : temperatureChapter
        ? 'Changing temperature changes the odds while preserving the order of the scores.'
        : 'Subtract the largest score, exponentiate, then normalize the four weights.',
  );
}

export const offsets = [0.77, 2.25, -0.2, -0.8],
  perturbed = logits.map((v, i) => v + offsets[i]);
export function gumbel(p) {
  if (p.b >= 4) {
    const winners = perturbed.map((v) => Math.exp(-v)),
      best = Math.min(...winners);
    p.label('Same inspected offsets', 74, 138, 18, dim);
    p.label('Score + noise', 365, 138, 18, dim);
    p.label('Race time = exp(−score − noise)', 566, 138, 18, dim);
    winners.forEach((v, i) => {
      const y = 192 + i * 53;
      p.dot(86, y - 7, 7, enamel[i], dim);
      p.label(tokens[i], 112, y, 22, ink, 'left', 'Serif');
      p.num(perturbed[i].toFixed(2), 391, y, 23, ink);
      p.rule(520, y - 7, 561, y - 7, line, 2);
      p.num(v.toFixed(3), 591, y, 23, v === best ? teal : dim);
      if (v === best) p.label('earliest finish', 720, y, 20, teal);
    });
    p.footer(
      'Largest perturbed score, smallest race time.',
      p.b === 4
        ? 'Exponentiating the negative score reverses the order. The fastest candidate is clear.'
        : 'Different samplers can have the same odds while using a seed differently. Benchmark the complete draw.',
    );
    return;
  }
  const x = p.axis(193, 352, 596, -3, 4, [-3, -2, -1, 0, 1, 2, 3, 4], 'score at temperature one');
  const t = p.cue(2, 'Add point seven seven', 2.4),
    known = p.cue(2, 'so clear wins', 1.1) === 1;
  logits.forEach((v, i) => {
    const y = 149 + i * 52,
      now = v + offsets[i] * t;
    p.label(tokens[i], 76, y + 7, 22, ink, 'left', 'Serif');
    p.rule(x(-3), y, x(4), y, line);
    p.dot(x(v), y, 6, paper, dim);
    p.rule(x(v), y, x(now), y, colors[i], 4);
    p.dot(x(now), y, 7, colors[i]);
    p.num(now.toFixed(2), 877, y + 7, 22, known && i === 1 ? teal : ink, 'right');
  });
  if (p.b < 3) {
    p.num('g = −log(−log(u))', 193, 113, 19, teal);
    p.num('Largest logit / T + g wins', 510, 113, 19, dim);
  }
  p.footer(
    known
      ? 'Clear wins this draw. Blue still has the highest raw score.'
      : 'Can the second-ranked word win after the offsets?',
    p.b < 3
      ? 'Draw an independent offset for each word.'
      : p.b === 3
        ? 'Hard argmax yields one token. The smooth Gumbel-Softmax relaxation permits differentiation.'
        : 'Time random generation and selection together when benchmarking a sampler.',
  );
}

export function launch(p) {
  const v = data.launch;
  if (p.b >= 5) {
    const rows = [
      ['Resolution', 'p = 0.78', 'Estimate from reviewed traffic', 'Ask for representative'],
      ['Routes', 'CI · rollback · access', 'Add log triage', 'Restore log triage'],
      ['Tool calls', 'Poisson(2)', 'Compare variance, mean and costly tail', 'For cost'],
      [
        'Duration',
        'Normal(7 s, 8 s SD)',
        'Check positive support, median and p95',
        'Try a positive model',
      ],
    ];
    p.label('Proposed simulator', 69, 138, 23, ink, 'left', 'Serif');
    p.label('Launch review', 546, 138, 23, ink, 'left', 'Serif');
    rows.forEach(([name, model, action, phrase], i) => {
      const y = 188 + 61 * i;
      p.rule(71, y + 18, 873, y + 18, line);
      p.label(name, 71, y, 18, dim);
      p.num(model, 214, y, 17, ink);
      p.label(p.cue(6, phrase, 0.7) === 1 ? action : '?', 545, y, 16, teal);
    });
    p.footer(
      'Which assumptions would you challenge before launch?',
      p.b === 6
        ? 'Use representative logs to choose a model and test its deadlines.'
        : 'A proposed simulator for the same four request fields.',
    );
    return;
  }
  p.label('SIMULATED REQUEST COHORT', 71, 137, 14, teal, 'left', 'Mono', 600);
  p.num('5,000', 65, 213, 58, ink);
  const rows = [
    ['Resolved', pct(v.resolution_rate)],
    ['Rollback', pct(v.rollback_share)],
    ['Calls per request', v.mean_tool_calls.toFixed(2)],
    ['Above five calls', pct(v.share_over_5_tools)],
  ];
  if (p.b >= 2)
    rows.splice(
      0,
      rows.length,
      ['Nonpositive durations', String(v.nonpositive_times)],
      ['Median finish', v.median_seconds.toFixed(2) + ' s'],
      ['Sample p95', v.p95_seconds.toFixed(2) + ' s'],
      ['Model p95', durationFromRank(0.95).toFixed(2) + ' s'],
    );
  rows.forEach(([name, value], i) => {
    const y = 151 + i * 62;
    p.rule(396, y + 14, 871, y + 14, line);
    p.label(name, 404, y, 21, dim);
    p.num(value, 864, y, 28, i === 3 ? teal : ink, 'right');
  });
  p.label(
    p.b >= 2 ? 'Positive duration model' : 'One draw per field',
    69,
    259,
    21,
    ink,
    'left',
    'Serif',
  );
  if (p.b >= 3) {
    p.label('Arrivals → queue → service', 67, 313, 20, blue);
    p.label('Capacity needs a schedule.', 67, 344, 17, dim);
  }
  p.footer(
    p.b === 4
      ? 'Compare this simulated cohort to a separate log.'
      : p.b < 2
        ? 'How often does the tool bill cross its threshold?'
        : 'Which percentile describes the run?',
    p.b < 2
      ? 'One-rate Poisson prediction: ' + pct(expensive) + '. The sample fraction can differ.'
      : 'This baseline draws the four fields independently. It cannot establish within-route dependence.',
  );
}

export const toolCounts = [1, 1, 6, 6],
  durations = [2, 2, 20, 20],
  pairs = [
    [0, 1, 2, 3],
    [3, 2, 1, 0],
    [0, 3, 2, 1],
  ];
export const costlySlow = (indices) =>
  indices.map((j, i) => toolCounts[i] > 5 && durations[j] > 15);
export function joints(p) {
  const flip = p.cue(1, 'Now reverse', 1.8),
    restart = p.cue(3, 'Start again', 1.1),
    swap = p.cue(3, 'exchange the durations', 1.8);
  const phase = swap > 0 ? 2 : restart > 0 ? 0 : flip > 0 ? 1 : 0;
  const perm = pairs[phase],
    old = pairs[swap > 0 ? 0 : restart > 0 ? 1 : 0],
    t = swap > 0 ? swap : restart > 0 ? restart : flip > 0 ? flip : 1;
  const known =
    (p.b === 1 && flip === 0) ||
    (p.b === 2 && p.cue(2, 'The joint share becomes zero', 1.2) === 1) ||
    p.cue(4, 'One of four', 1.1) === 1;
  const ys = [183, 238, 293, 348],
    flags = costlySlow(perm);
  p.label('Tools', 259, 138, 24, ink, 'center', 'Serif');
  p.label('Seconds', 683, 138, 24, ink, 'center', 'Serif');
  perm.forEach((j, i) => {
    const end = mix(ys[old[i]], ys[j], t),
      color = known && flags[i] ? red : '#738e8b';
    const paired = p.cue(0, 'Pair the large counts', 1.3);
    if (paired > 0)
      p.path(
        [
          [288, ys[i]],
          [342, ys[i]],
          [mix(342, 601, paired), mix(ys[i], end, paired)],
          [mix(342, 651, paired), mix(ys[i], end, paired)],
        ],
        color,
        known && flags[i] ? 4 : 2,
      );
  });
  ys.forEach((y, i) => {
    p.num('R' + (i + 1), 112, y + 7, 19, dim);
    p.dot(259, y, 20, toolCounts[i] > 5 ? red : teal);
    p.num(toolCounts[i], 259, y + 7, 20, paper, 'center');
    p.dot(683, y, 20, durations[i] > 15 ? red : teal);
    p.num(durations[i], 683, y + 7, 20, paper, 'center');
  });
  p.footer(
    known
      ? 'Both alarms fired on ' + sum(flags.map(Number)) + ' of four requests.'
      : 'Follow each request from count to duration.',
    'Expensive means more than five tools. Slow means more than fifteen seconds.',
  );
}

const complete = [2, 3, 4, 5],
  uniform = (t) => Math.min(1, Math.max(0, t / 5));
export const toyKs = ksGeometry(complete, uniform);
const mean = 6 * Math.exp(0.55 ** 2 / 2),
  sd = mean * Math.sqrt(Math.expm1(0.55 ** 2));
export const candidates = [(t) => normalCdf((t - mean) / sd), (t) => durationCdf(t)];
export const distances = candidates.map((f) =>
  Math.max(...ksGeometry(data.ks, f).map((k) => k.gap)),
);
export function ks(p) {
  const large = p.b >= 3,
    r = large ? data.ks : complete;
  const g = p.plot({
    xmax: large ? 32 : 5.4,
    xt: large ? [0, 8, 16, 24, 32] : [0, 1, 2, 3, 4, 5],
    yt: [0, 0.5, 1],
    unit: 'seconds',
    measure: 'fraction finished',
  });
  const pts = [[g.X(0), g.Y(0)]];
  r.forEach((t, i) => pts.push([g.X(t), g.Y(i / r.length)], [g.X(t), g.Y((i + 1) / r.length)]));
  pts.push([g.X(large ? 32 : 5.4), g.Y(1)]);
  p.path(pts, teal, 2.7);
  g.curve(large ? candidates[0] : uniform, gold);
  const compare = p.cue(3, 'Compare the lognormal curve', 1) === 1;
  if (large && compare) g.curve(candidates[1], blue);
  if (!large) {
    if (p.b > 0) {
      p.dot(g.X(2), g.Y(0), 6, paper, teal);
      p.dot(g.X(2), g.Y(0.25), 6, teal);
    }
    const leftKnown = p.cue(2, 'forty percentage points', 0) === 1;
    const rightKnown = p.cue(2, 'fifteen points', 0) === 1;
    if (leftKnown) {
      p.rule(g.X(2) - 3, g.Y(0), g.X(2) - 3, g.Y(0.4), red, 4);
    }
    if (rightKnown) p.rule(g.X(2) + 4, g.Y(0.25), g.X(2) + 4, g.Y(0.4), purple, 3);
    p.readout('Model at 2 s', '0.40');
    p.readout(
      rightKnown ? 'Left gap / right gap' : leftKnown ? 'Gap before the jump' : 'Bigger gap?',
      rightKnown
        ? [toyKs[0].before, toyKs[0].after]
            .map((v) => Math.abs(toyKs[0].cdf - v).toFixed(2))
            .join(' / ')
        : leftKnown
          ? toyKs[0].gap.toFixed(2)
          : 'Left or right',
      655,
      286,
    );
  } else {
    p.readout('Normal distance', distances[0].toFixed(3), 655, 184, gold);
    p.readout('Lognormal distance', compare ? distances[1].toFixed(3) : '?', 655, 286, blue);
    if (p.b === 5) {
      p.label('Fit on these same rows?', 655, 365, 17, dim);
      p.label('Refit each bootstrap replicate.', 655, 391, 17, teal);
    }
  }
  p.footer(
    large
      ? 'Compare the same 200 complete durations to both candidates.'
      : 'Check both sides of every jump.',
    p.b === 6
      ? 'Censored rows need a method that retains their observed waiting time.'
      : p.b >= 5
        ? 'Fitting a CDF on the same rows changes test calibration.'
        : large
          ? 'These two candidate distributions were fixed before seeing the rows. Inspect deadlines and tails too.'
          : p.cue(2, 'largest absolute vertical gap', 0) === 1
            ? 'The largest gap over all four finishes is 0.40, just before the first jump.'
            : 'A gap is a vertical distance between accumulated fractions.',
  );
}

export function tail(p) {
  const s = mix(0.25, 0.8, p.cue(0, 'increase the log-space spread', 2.2)),
    late = 1 - durationCdf(10, s);
  const g = p.plot({
    xmax: 30,
    ymax: 0.29,
    xt: [0, 6, 10, 15, 22, 30],
    yt: [0, 0.14, 0.28],
    measure: 'density per second',
    unit: 'duration (seconds)',
  });
  const show = p.cue(1, 'That late area grows', 1.5);
  if (show > 0) g.fill((t) => durationDensity(t, s), 10, 10 + 20 * show, '#e1aa91');
  g.curve((t) => durationDensity(t, 0.25), '#9ea79b');
  g.curve((t) => durationDensity(t, s), blue);
  const q = durationFromRank(0.95, s);
  [6, q].forEach((t, i) => {
    p.rule(g.X(t), g.Y(0), g.X(t), g.Y(durationDensity(t, s)), i ? red : gold, 2);
    p.dot(g.X(t), g.Y(0), 5, i ? red : gold);
  });
  p.readout('Median', '6.00 s');
  p.readout('Same 95% rank', q.toFixed(2) + ' s', 655, 286, red);
  if (show === 1) {
    p.label('Late share', 653, 369, 15, dim);
    p.num(pct(1 - durationCdf(10, 0.25)) + ' → ' + pct(late), 653, 398, 21, red);
  }
  p.footer(
    show === 1
      ? pct(late) + ' of this model lies beyond ten seconds.'
      : 'Keep the median fixed while the spread changes.',
    'Gray is the starting curve. Blue uses log-space spread ' + s.toFixed(2) + '.',
  );
}

export function cohortDecision(p, final) {
  const { byTen, byFifteen, size } = cohort;
  const counts = [byTen, byFifteen - byTen, size - byFifteen];
  const include = final ? 1 : p.b === 1 ? 0 : p.b >= 2 ? p.cue(2, 'Bring back the fifty', 1.5) : 1;
  const counting = final ? p.spoken(2, 'Two hundred finished by fifteen seconds') : 0;
  const known = byTen + Math.floor(counts[1] * counting);
  const reveal = final
    ? p.spoken(2, 'The target is thirty-eight finishes out of reach') === 1 && counting === 1
    : p.cue(2, 'Only sixty-four percent', 1.2) === 1;
  const visible = final
    ? size
    : byTen * p.cue(0, 'One hundred sixty finish', 1.1) +
      counts[1] * p.cue(0, 'Forty finish later', 1) +
      counts[2] * p.cue(0, 'Fifty are still', 1.3);
  const columns = 25,
    x0 = 86,
    dx = 18,
    top = 162,
    dy = 17;
  p.label('One punch per arrival', 76, 132, 20, ink, 'left', 'Serif');
  for (let i = 0; i < size; i++) {
    const x = x0 + (i % columns) * dx,
      y = top + Math.floor(i / columns) * dy;
    const isOpen = i >= byFifteen,
      col = i < known ? teal : isOpen ? red : blue;
    if (i >= visible) {
      p.dot(x, y, 3, paper, line);
      continue;
    }
    if (isOpen) {
      const cy = y + 11 * (1 - include);
      p.dot(x, cy, 4.7, paper, include > 0.5 ? red : dim);
      p.path(
        [
          [x, cy - 3],
          [x, cy],
          [x + 2, cy + 1],
        ],
        include > 0.5 ? red : dim,
        0.9,
      );
    } else p.dot(x, y, 4.6, col);
  }
  const lastFinishedRow = Math.floor((byFifteen - 1) / columns);
  const lastArrivalRow = Math.floor((size - 1) / columns);
  const bottom = top + dy * mix(lastFinishedRow, lastArrivalRow, include) + 8;
  p.path(
    [
      [74, top - 9],
      [66, top - 9],
      [66, bottom],
      [74, bottom],
    ],
    ink,
    2,
  );
  if (final) {
    const shortfall = targetRank - byFifteen;
    const rankKnown = p.spoken(1, 'at least two hundred thirty-eight finishes') === 1;
    const checkingFifteen = p.cue(2, 'Move the deadline', 0) === 1;
    const openKnown = p.spoken(2, 'The other fifty still have open clocks') === 1;
    const x = p.axis(86, 376, 432, 0, size, [0, 100, byFifteen, size]);
    p.rule(x(0), 376, x(known), 376, teal, 6);
    if (openKnown) {
      const openTop = top + (lastFinishedRow + 1) * dy - 8;
      const openRight = x0 + (columns - 1) * dx + 12;
      p.path(
        [[openRight, openTop], [openRight + 8, openTop], [openRight + 8, bottom], [openRight, bottom]],
        red,
        2,
      );
      p.num(counts[2], openRight + 17, (openTop + bottom) / 2 + 7, 22, red);
    }
    if (rankKnown) {
      const xr = x(targetRank);
      p.rule(xr, 353, xr, 379, red, 3);
      p.num(targetRank, xr, 348, 16, red, 'center');
      if (reveal) {
        const finished = x(byFifteen);
        p.rule(finished, 368, finished, 380, red, 2);
        p.rule(finished, 376, xr, 376, red, 3);
        p.num(shortfall, (finished + xr) / 2, 368, 20, red, 'center');
      }
    }
    p.readout(
      counting === 1
        ? 'Finishes by 15 s'
        : checkingFifteen
          ? 'Counting finishes by 15 s'
          : 'Finishes by 10 s',
      String(known),
      613,
      176,
    );
    p.readout('Needed for 95%', rankKnown ? String(targetRank) : '?', 613, 273, red);
    if (reveal) {
      const beyondLog =
        p.spoken(3, 'The two hundred thirty-eighth finish lies beyond fifteen seconds') === 1;
      const follow = p.spoken(3, 'follow those open requests to completion') === 1;
      p.rect(608, 341, 270, 53, '#e9d2ba');
      p.label(
        beyondLog ? 'Cohort p95 > 15 s' : 'Short by ' + shortfall + ' finishes',
        622,
        follow ? 363 : 374,
        22,
        red,
        'left',
        'Serif',
      );
      if (follow) p.label('Follow ' + counts[2] + ' open requests', 622, 385, 17, red);
    }
    p.footer(
      reveal
        ? byFifteen + ' of ' + size + ' replied by 15 seconds.'
        : 'Would fifteen seconds cover nineteen out of twenty?',
      reveal
        ? 'The open clocks show who was still waiting at 15 seconds.'
        : 'The deadline moves. The ' + size + ' arrivals stay on the strip.',
    );
  } else {
    p.readout(
      p.b < 2 ? 'By ten seconds' : 'Same timely replies',
      Math.floor(Math.min(visible, byTen)) + '',
      613,
      176,
    );
    const den = p.b === 1 ? byFifteen : size;
    p.readout(
      p.b === 1 ? 'Among recorded finishes' : 'Among all arrivals',
      p.b === 0 ? '250 arrivals' : reveal || p.b === 1 ? byTen + ' / ' + den : '?',
      613,
      273,
    );
    if (reveal) {
      p.label('Observed / modeled', 613, 347, 17, dim);
      p.num(pct(byTen / size, 0) + ' / 82%', 613, 386, 30, teal);
    }
    p.footer(
      p.b === 1
        ? 'The bracket stops after 200 completed requests.'
        : reveal
          ? '160 of 250 arrivals received a reply by ten seconds.'
          : 'Keep all the people who started together.',
      p.b === 1
        ? '160 / 200 = 80% of recorded finishes.'
        : reveal
          ? ''
          : 'Teal finished by ten. Blue finished later. Open rings were still waiting at fifteen.',
    );
  }
}
