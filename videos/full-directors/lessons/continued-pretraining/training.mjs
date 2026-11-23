import {
  learningRate,
  exactLearningRate,
  replayGradient,
  mixtureReduction,
} from '../../../films/continued-pretraining/model.mjs';
import { WINDOW_ORDER } from '../../../films/continued-pretraining/fixtures.mjs';
import {
  C,
  base,
  beat,
  cue,
  mix,
  ease,
  clamp,
  rect,
  line,
  circle,
  text,
  mono,
  serif,
  chip,
  heading,
  arrow,
  percent,
  share,
  rows,
  sheet,
} from './studio.mjs';
import { recipe } from './field.mjs';

export function firstStep(grad = -0.5, beta1 = 0.9, beta2 = 0.999, eps = 1e-8) {
  const m = (1 - beta1) * grad,
    v = (1 - beta2) * grad ** 2;
  const mhat = m / (1 - beta1),
    vhat = v / (1 - beta2);
  return { m, v, mhat, vhat, adam: -mhat / (Math.sqrt(vhat) + eps), sgd: -grad };
}
export function optimizer(g, k) {
  const b = beat(k),
    v = firstStep();
  base(g);
  if (b === 1) {
    heading(g, 'CHECKPOINT CONTENTS', 'What did we restore?');
    rows(
      g,
      ['Saved state', 'Weights-only restart', 'Full-state resume'],
      [
        ['Model weights', 'load θ', 'load θ'],
        ['Adam moments', 'start m, v at zero', 'restore m, v'],
        ['Learning-rate schedule', 'choose a schedule', 'restore the step'],
      ],
      { dy: 157 },
    );
    return;
  }
  heading(
    g,
    'FIRST STEP   /   g = −0.5   /   WEIGHT DECAY OFF',
    'Two optimizers see the same gradient',
  );
  const observed = cue(k, 3, 'After the first gradient'),
    corrected = cue(k, 3, 'bias correction');
  rows(
    g,
    ['Moment', 'Initial', 'After gradient', 'Bias-corrected'],
    [
      [
        'First moment  m',
        '0',
        observed ? v.m.toFixed(3) : '…',
        corrected ? v.mhat.toFixed(2) : '…',
      ],
      [
        'Second moment  v',
        '0',
        observed ? v.v.toFixed(6) : '…',
        corrected ? v.vhat.toFixed(2) : '…',
      ],
    ],
    { widths: [0.3, 0.14, 0.27, 0.29], dy: 93 },
  );
  if (b >= 4) {
    const moved = cue(k, 4, 'this first coordinate moves');
    const x = 488,
      w = 854;
    ['SGD', 'AdamW'].forEach((name, i) => {
      const y = 671 + 112 * i,
        val = i ? v.adam : v.sgd;
      text(g, name, 111, y + 15, 43);
      line(g, x, y, x + w, y, C.rule, 3);
      if (moved) {
        arrow(g, x, y, x + w * val, y, i ? C.clay : C.sea, 9);
        mono(g, i ? '≈ +1.0 η' : '+0.5 η', 1450, y + 15, 40);
      }
    });
    mono(g, 'm̂ / (√v̂ + ε)     β₁ = 0.9     β₂ = 0.999     ε = 10⁻⁸', 103, 955, 33, C.muted);
  } else mono(g, 'm ← 0.9m + 0.1g        v ← 0.999v + 0.001g²', 110, 796, 45, C.sea);
}
function plotSchedule(g, fn, end, current, max, ticks, unit) {
  const x = (i) => 202 + (1520 * i) / end,
    y = (r) => 748 - (409 * r) / max;
  text(g, unit, 115, 307, 32, C.sea);
  [0, max / 2, max].forEach((v) => {
    line(g, 202, y(v), 1722, y(v), C.rule, 2);
    mono(g, v, 163, y(v) + 10, 29, C.muted, 'right');
  });
  ticks.forEach((i) => {
    line(g, x(i), 752, x(i), 766, C.muted, 3);
    mono(g, i, x(i), 811, 28, C.muted, 'center');
  });
  g.beginPath();
  g.moveTo(x(0), y(fn(0)));
  for (let i = 1; i <= current; i++) g.lineTo(x(i), y(fn(i)));
  g.strokeStyle = C.sea;
  g.lineWidth = 7;
  g.stroke();
  circle(g, x(current), y(fn(current)), 15, C.clay);
  mono(g, 'step', 1793, 812, 28, C.muted);
}
export function schedule(g, k) {
  base(g);
  heading(g, 'RATE SWEEP   /   ILLUSTRATIVE DISPLAY UNITS', 'Warm up, then decay');
  const n = Math.round(11 * cue(k, 1, 'short warm-up', 4));
  plotSchedule(g, learningRate, 11, n, 3, [0, 1, 3, 5, 7, 9, 11], 'Learning rate');
  mono(g, 'Step ' + n + '     η = ' + learningRate(n).toFixed(2), 104, 932, 43, C.sea);
  if (beat(k) > 1)
    text(
      g,
      'Control the corpus and the evaluation protocol.',
      1814,
      936,
      39,
      C.muted,
      'Sans',
      'right',
    );
}
export function exact(g, k) {
  base(g);
  if (beat(k) >= 5) {
    heading(g, 'IBRAHIM ET AL.   /   405M PARAMETERS', 'What changed in each sweep?');
    const peak = cue(k, 5, 'In a separate sweep');
    const similar = cue(k, 5, 'saw similar validation losses');
    const tradeoff = cue(k, 5, 'higher peaks improved prediction');
    sheet(g, 110, 295, 1698, 264);
    text(g, 'Warmup duration', 150, 367, 39, C.sea);
    mono(g, '0%, 0.5%, 1%, 2%', 150, 470, 50);
    if (similar) {
      serif(g, 'Similar validation losses', 864, 412, 51);
      text(g, 'On old and new text after 50B tokens', 864, 491, 38, C.muted);
    }
    if (peak) {
      sheet(g, 110, 594, 1698, 264);
      text(g, 'Peak rate   /   warmup fixed at 1%', 150, 668, 39, C.sea);
      mono(g, '½×, 1×, 2× original peak', 150, 769, 43);
      if (tradeoff) {
        serif(g, 'At higher peaks', 864, 671, 51);
        text(g, 'New-text loss fell further.', 864, 740, 40, C.forest);
        text(g, 'Old-text loss rose further.', 864, 803, 40, C.clay);
      }
    }
    text(g, 'Learning-rate experiments, sections 6.1.1 and 6.1.2', 111, 965, 37, C.muted);
    return;
  }
  const wide = beat(k) >= 4;
  heading(
    g,
    'WORKED EXAMPLE   /   1,000 UPDATES   /   5% WARMUP',
    wide ? 'Follow the decay to its floor' : 'The first fifty warmup increments',
  );
  const n = wide
    ? 50 + Math.round(949 * cue(k, 4, 'Follow the curve', 3))
    : Math.round(
        9 * cue(k, 3, 'Step nine takes', 0.65) + 40 * cue(k, 3, 'By step forty-nine', 1.1),
      );
  const f = (i) => exactLearningRate(i) * 1e6;
  plotSchedule(
    g,
    f,
    wide ? 999 : 49,
    n,
    30,
    wide ? [0, 250, 500, 750, 999] : [0, 9, 19, 29, 39, 49],
    'η × 10⁶',
  );
  const formula = wide
    ? '50 ≤ s ≤ 999    3 + 13.5 × [1 + cos(π(s − 50)/949)]'
    : '0 ≤ s < 50    3 + 27 × (s + 1)/50';
  mono(g, formula, 112, 916, 38, C.ink);
  if (!wide && n > 9) mono(g, 'Step 9 used 8.40 millionths', 112, 987, 34, C.muted);
  mono(g, 's = ' + n + '    η × 10⁶ = ' + f(n).toFixed(2), 1812, 987, 40, C.sea, 'right');
}
export function scope(g, k) {
  base(g);
  const b = beat(k);
  if (b === 2) {
    heading(g, 'HELD-OUT INCIDENTS', 'Test both complete assistants');
    return recipe(g, 'Base', 'Base + DAPT');
  }
  if (b === 3) {
    heading(g, 'PAYMENTS ASSISTANT', 'Which experiment would you try?');
    rows(
      g,
      ['Observation', 'Experiment', 'Control'],
      [
        ['Says 8 retries. Limit is 4.', 'Retrieve current release note', 'Same base weights'],
        ['Action field missing', 'SFT on complete replies', 'Same field check'],
        ['Reviewers rank B above A', 'Train on ranked pairs', 'Same review criterion'],
      ],
      { dy: 148 },
    );
    return;
  }
  heading(g, 'DATA SCOPE', 'What does the unlabeled corpus contain?');
  sheet(g, 105, 292, 1700, 614);
  serif(g, 'Payment service documents', 162, 386, 62, C.sea);
  ['API reference', 'Retry runbook', 'Release notes'].forEach((s, i) =>
    chip(g, s, 159 + i * 546, 461, 495, 87, C.pale),
  );
  const task = cue(k, 1, 'Task-adaptive pretraining');
  rect(g, 157, 597, 1587, 250, task ? C.sun : '#e5e3d1', 7);
  text(
    g,
    task ? 'Task-adaptive corpus   /   incoming incident reports' : 'Incoming incident reports',
    192,
    662,
    36,
    C.muted,
  );
  serif(g, '“Token reissue timed out.”', 194, 775, 52);
  serif(g, '“The worker pool is full.”', 982, 775, 52);
}
export function mixture(g, k) {
  base(g);
  heading(g, 'ONE SHARED LOGIT   /   RESET TO ZERO', 'Two sources push in opposite directions');
  const a = 0.25 * cue(k, 2, 'At a quarter replay', 1.4),
    grad = replayGradient(a);
  const cx = 960,
    y = 598;
  share(g, 110, 324, 1700, 81, 1 - a);
  text(g, 'Domain   ' + percent(1 - a), 112, 471, 45, C.sea);
  text(g, 'Replay   ' + percent(a), 1807, 471, 45, C.clay, 'Sans', 'right');
  arrow(g, cx, y, cx - 1350 * (1 - a) * 0.5, y, C.sea, 14);
  if (a) arrow(g, cx, y + 49, cx + 1350 * a * 0.5, y + 49, C.clay, 14);
  circle(g, cx, y, 10, C.ink);
  mono(g, 'Domain  −0.5 × ' + (1 - a).toFixed(3), 112, 763, 38, C.sea);
  mono(g, 'Replay  +0.5 × ' + a.toFixed(3), 1807, 763, 38, C.clay, 'right');
  serif(g, 'Mean gradient   ' + grad.toFixed(3), 960, 929, 73, C.ink, 'center');
}
export const budgets = (a) => ({ domain: 2000000 * (1 - a), replay: 2000000 * a });
export function budget(g, k) {
  base(g);
  const b = beat(k);
  if (b <= 2) {
    heading(g, 'FIXED WINDOW   /   2,000,000 PROCESSED TOKENS', 'What does extra replay displace?');
    const a = 0.05 + 0.2 * cue(k, 2, 'Now half a million', 0.6),
      v = budgets(a);
    share(g, 105, 428, 1705, 170, 1 - a);
    serif(g, Math.round(v.domain).toLocaleString('en-US'), 107, 732, 90, C.sea);
    serif(g, Math.round(v.replay).toLocaleString('en-US'), 1807, 732, 90, C.clay, 'right');
    text(g, 'Domain tokens', 110, 812, 43, C.sea);
    text(g, 'Replay tokens', 1807, 812, 43, C.clay, 'Sans', 'right');
    return;
  }
  if (b === 6) {
    heading(g, 'BLOOMBERGGPT   /   TRAINED FROM SCRATCH', 'Assembled text and consumed tokens');
    share(g, 110, 394, 1695, 104, 0.51);
    text(g, 'Financial  ≈ 51%', 115, 567, 48, C.sea);
    text(g, 'Public  ≈ 49%', 1800, 567, 48, C.clay, 'Sans', 'right');
    serif(g, '709 billion assembled', 112, 731, 75);
    serif(g, '569 billion consumed', 112, 864, 75, C.sea);
    return;
  }
  const rounded = b >= 4,
    n = rounded ? 10 : 20;
  heading(
    g,
    'SOURCE SAMPLER   /   REQUESTED REPLAY 25%',
    rounded ? 'What happens to half a block?' : 'Shuffle a fixed window of twenty blocks',
  );
  const shuffle = cue(k, 3, 'Shuffle that window', 4.4);
  if (!rounded) {
    text(g, 'Source blocks', 115, 356, 35, C.muted);
    text(g, 'Seed 7', 115, 596, 35, C.muted);
    for (let i = 0; i < 20; i++) rect(g, 114 + 85 * i, 624, 78, 82, '#dfdece', 5);
  }
  for (let i = 0; i < n; i++) {
    const dest = rounded ? i : WINDOW_ORDER.indexOf(i);
    const q = clamp(shuffle * 20 - dest);
    const x = rounded ? 124 + i * 168 : 114 + 85 * mix(i, dest, clamp(3 * q - 1));
    const y = rounded ? 420 : 380 + 118 * clamp(3 * q) + 126 * clamp(3 * q - 2);
    const isReplay = i >= (rounded ? 8 : 15);
    chip(
      g,
      (isReplay ? 'R' : 'F') + (isReplay ? i - (rounded ? 7 : 14) : i + 1),
      x,
      y,
      rounded ? 142 : 78,
      rounded ? 99 : 82,
      isReplay ? C.rose : C.pale,
      C.ink,
      rounded ? 37 : 29,
    );
  }
  serif(
    g,
    rounded ? 'round(10 × 0.25) = 2 replay blocks' : '5 replay blocks / 20 = 25%',
    112,
    832,
    66,
  );
  text(
    g,
    rounded
      ? 'Python ties to even. Actual replay share is 20%.'
      : 'Equal scored counts per block preserve that share.',
    116,
    934,
    40,
    C.muted,
  );
}

function afterClause(k, n, phrase, duration = 0) {
  if (beat(k) !== n) return Number(beat(k) > n);
  const { start, end } = k.wordCue(phrase);
  const spoken = k.reveal(phrase, end - start, { captionStart: phrase }) === 1;
  if (!spoken) return 0;
  return duration ? clamp((k.elapsed - end) / duration) : 1;
}

const targetWindow = mixtureReduction();
export function targetMix(g, k) {
  base(g);
  heading(g, 'SAME TWENTY BLOCKS   /   SHARED LOGIT ZERO', 'How much weight does replay get?');
  const v = targetWindow;
  const mask = cue(k, 1, 'Now mask four targets', 1.3);
  const visibleReplayTargets =
    v.domainTargets - Math.floor(mask * (v.domainTargets - v.replayTargets));
  const fieldCount = afterClause(k, 2, 'The fifteen field blocks contain ninety targets');
  const replayCount = afterClause(k, 2, 'The five replay blocks have just ten between them');
  const pooled = afterClause(k, 2, 'That gives replay one tenth of the weight in the pooled mean');
  const contributions = afterClause(
    k,
    3,
    'At logit zero the field gradient is minus a half and replay’s is plus a half',
  );
  const pooledResult = afterClause(
    k,
    3,
    'Ninety votes one way and ten the other give a mean gradient of minus point four',
  );
  const reweight = afterClause(
    k,
    4,
    'then give replay a quarter and the field notes three quarters',
    0.9,
  );
  const sourceResult = afterClause(
    k,
    4,
    'Their influence changes, and the gradient returns to minus a quarter',
  );

  text(g, fieldCount ? `Field · ${v.nd} scored targets` : 'Field', 114, 279, 36, C.sea);
  const replayLabel = replayCount ? `Replay · ${v.nr} scored targets` : 'Replay';
  text(g, replayLabel, 1808, 279, 36, C.clay, 'Sans', 'right');
  WINDOW_ORDER.forEach((block, i) => {
    const replay = block >= v.domainBlocks;
    const name = replay ? `R${block - v.domainBlocks + 1}` : `F${block + 1}`;
    const x = 119 + i * 85;
    const color = replay ? C.clay : C.sea;
    mono(g, name, x + 34, 332, 28, color, 'center');
    for (let t = 0; t < v.domainTargets; t++) {
      const y = 348 + t * 42;
      if (replay && t >= visibleReplayTargets) line(g, x + 20, y + 16, x + 48, y + 16, C.rule, 4);
      else rect(g, x, y, 68, 32, color, 4);
    }
  });

  if (!pooled) {
    text(g, 'Pool the colored cells. What fraction comes from replay?', 112, 725, 53);
    return;
  }

  const chosenReplayWeight = 0.25;
  const weight = mix(v.targetShare, chosenReplayWeight, ease(reweight));
  const x = 525,
    w = 1015;
  const countedBoundary = x + w * (1 - v.targetShare);
  text(g, 'Share of scored targets', 112, 657, 36);
  share(g, x, 627, w, 38, 1 - v.targetShare);
  mono(g, percent(v.targetShare) + ' replay', 1808, 658, 40, C.clay, 'right');
  line(g, countedBoundary, 665, countedBoundary, 725, C.rule, 3);

  text(g, 'Share of loss weight', 112, 757, 36);
  text(g, reweight ? 'Weighted by source' : 'Equal weight per target', 112, 797, 30, C.muted);
  share(g, x, 725, w, 38, 1 - weight);
  const settled = reweight === 0 || reweight === 1;
  if (settled)
    mono(g, percent(weight) + ' replay', 1808, 757, 40, C.clay, 'right');

  if (contributions && settled) {
    const term = (share, gradient) => `${share.toFixed(2)} × (${gradient.toFixed(2).replace('-', '−')})`;
    const domain = term(1 - weight, replayGradient(0));
    const replay = term(weight, replayGradient(1));
    text(g, 'Mean gradient', 112, 896, 44);
    mono(g, domain, x, 896, 39, C.sea);
    mono(g, '+', 882, 896, 39);
    mono(g, replay, 929, 896, 39, C.clay);
    if (reweight ? sourceResult : pooledResult) {
      const mean = replayGradient(weight).toFixed(2).replace('-', '−');
      mono(g, '= ' + mean, 1292, 896, 39);
    }
  }
}
