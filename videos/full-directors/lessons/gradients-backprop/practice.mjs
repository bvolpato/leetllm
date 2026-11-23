import { C, clamp, fmt, mix, vec } from './instruments.mjs';
import {
  advance,
  copied,
  fresh,
  hiddenUnit,
  latencyExample,
  originalHidden,
  practiceRow,
} from './models.mjs';

function captionedCue(d, beat, phrase, seconds, captionStart) {
  if (d.b !== beat) return Number(d.b > beat);
  const progress = d.clock.reveal(phrase, seconds, { captionStart });
  return progress * progress * (3 - 2 * progress);
}

function bends(d) {
  const bias = 0.5 * d.cue(0, 'Add a bias', 1.25),
    gate = d.cue(1, 'Clip its negative part', 1.7),
    second = d.cue(1, 'Add a second unit', 1.7);
  const p = d.plot(
    121,
    176,
    615,
    319,
    [-2, 2],
    [-2, 4],
    [-2, -1, 0, 1, 2],
    [-2, 0, 2, 4],
    'input',
    'output',
  );
  const fn = (x) => mix(x + bias, Math.max(0, x + bias), gate) + second * Math.max(0, x - 0.5);
  p.curve(fn, -2, 2, C.blue, 4);
  if (gate > 0) p.point(-0.5, fn(-0.5), C.green);
  if (second > 0) p.point(0.5, fn(0.5), C.plum);
  d.metric('First two linear maps', '2x × ½', 800, 172);
  if (bias) d.metric('Bias', '+' + fmt(bias, 2), 800, 273, C.copper);
  if (gate === 1) d.metric('First bend', 'x = −0.5', 800, 374, C.green, 30);
  if (second === 1) {
    d.txt('Above x = 0.5, both units add slope 1.', 800, 488, 21, C.ink);
    d.txt('Their sum has slope 2.', 800, 520, 24, C.plum);
  }
}
function hidden(d) {
  d.title(d.b < 2 ? 'Build a bend from a straight line' : 'Trace a two-block request');
  if (d.b < 2) return bends(d);
  const s = originalHidden,
    xs = [112, 345, 580, 817, 1063],
    y = 300;
  const vals = [s.input, s.h, s.z, s.prediction, s.loss],
    labels = ['blocks (x)', '1.5x − 1', 'ReLU(h)', '2z + 0.5', '(ŷ − 5)²'];
  const ts = [
    1,
    d.cue(2, 'first weight', 1),
    d.cue(2, 'ReLU passes', 1),
    d.cue(2, 'Output weight', 1),
    d.cue(2, 'squared loss', 1),
  ];
  for (let i = 0; i < 4; i++)
    d.arrow(xs[i] + 47, y, xs[i + 1] - 48, y, ts[i + 1] ? C.blue : C.grid, 4);
  vals.forEach((v, i) =>
    d.node(xs[i], y, 44, labels[i], ts[i] ? fmt(v) : '?', i === 4 ? C.copper : C.blue),
  );
  if (d.b >= 3) {
    const travel = [
      d.cue(3, 'through the open gate', 1.1),
      d.cue(3, 'Carry the signal', 1.1),
      d.cue(3, 'Backward begins', 1.1),
    ];
    for (let i = 1; i < 4; i++) {
      const right = xs[i + 1] - 46,
        left = xs[i] + 47,
        t = travel[i - 1];
      if (t > 0) {
        d.arrow(right, y - 20, mix(right, left, t), y - 20, C.plum, 4);
      }
    }
  }
  if (d.b === 2) {
    d.txt('Observed 5 s', 817, 209, 21, C.green, 'center');
    return;
  }
  const branches = [
    { source: xs[1], x: 225, name: 'first weight', local: '× input (x = ' + fmt(s.input) + ')',
      travel: captionedCue(d, 4, 'input weight receives', 0.8, 'Its input weight'),
      stated: captionedCue(d, 4, 'and its hidden bias', 0, false) },
    { source: xs[1], x: 473, name: 'hidden bias', local: '× 1',
      travel: captionedCue(d, 4, 'hidden bias minus', 0.8, false),
      stated: d.cue(4, 'The first weight picks', 0) },
    { source: xs[3], x: 721, name: 'output weight', local: '× activation (z = ' + fmt(s.z) + ')',
      travel: captionedCue(d, 3, 'output weight receives', 0.8, 'The output weight receives'),
      stated: captionedCue(d, 3, 'and its bias minus', 0, false) },
    { source: xs[3], x: 969, name: 'output bias', local: '× 1',
      travel: captionedCue(d, 3, 'bias minus one', 0.8, false),
      stated: d.cue(3, 'Carry the signal', 0) },
  ];
  branches.forEach(({ source, x, name, local, travel, stated }, i) => {
    const side = Math.sign(x - source);
    const from = source + side * 34;
    if (travel > 0) {
      d.arrow(from, y + 30, mix(from, x, travel), mix(y + 30, 438, travel), C.plum, 3);
      const labelX = mix(from, x, 0.56) + side * 15;
      d.txt(local, labelX, 391, 19, C.plum, side < 0 ? 'right' : 'left');
    }
    d.txt(name, x, 463, 20, C.muted, 'center');
    d.txt(stated && travel === 1 ? fmt(s.gradient[i]) : '?', x, 507, 37, C.plum, 'center', 'Mono');
  });
  // Keep the caption anchors independent of the numeric reveals.
  d.cue(3, 'Start at the output end', 0);
  d.cue(4, 'Its input weight', 0);
  if (phraseComplete(d, 3, 'prediction sensitivity minus one'))
    d.txt('Output signal ' + fmt(s.signal), xs[3], y - 82, 23, C.plum, 'center');
  if (phraseComplete(d, 4, 'The hidden signal is minus two'))
    d.txt('Hidden signal ' + fmt(s.gradient[1]), xs[1], y - 82, 23, C.plum, 'center');
}
function predictionScale(
  d,
  { x = 236, y, w = 806, lo, hi, target, start, state, fraction, color, label, domainTicks },
) {
  const X = d.axis(x, y, w, lo, hi, domainTicks);
  d.line(X(target), y - 62, X(target), y + 1, C.green, 3);
  d.dot(X(start), y - 23, 7, C.white, C.muted);
  if (fraction > 0) {
    d.line(X(start), y - 23, X(state.prediction), y - 23, color, 4);
    d.dot(X(state.prediction), y - 23, 9, color, C.white);
  }
  d.txt(label, 78, y - 23, 21, color);
}
function update(d) {
  d.title('Try two rates from the same saved weights');
  const base = originalHidden;
  const large = d.cue(1, 'Recompute every stage', 2.5),
    small = d.cue(3, 'Follow the second dot', 2.5);
  const state = (rate, t) => hiddenUnit(advance(base.weights, base.gradient, rate * t));
  const big = state(0.05, large),
    little = state(0.025, small),
    live = d.b >= 3 ? little : big;
  d.txt('Gradient at starting weights', 94, 146, 22, C.muted);
  d.txt(vec(base.gradient), 426, 146, 27, C.plum, 'left', 'Mono');
  d.txt('Weights [w₁, b₁, w₂, b₂]', 94, 198, 22, C.muted);
  d.txt(vec(live.weights, 4), 426, 198, 27, C.blue, 'left', 'Mono');
  d.txt('Hidden activation   ' + fmt(live.z, 3), 94, 255, 23, C.muted);
  d.txt('x = 2     z = max(0, w₁x + b₁)     ŷ = w₂z + b₂', 426, 255, 21, C.ink, 'left', 'Mono');
  const args = {
    lo: 4.35,
    hi: 5.95,
    target: 5,
    start: base.prediction,
    domainTicks: [4.5, 5, 5.5, 5.8],
  };
  predictionScale(d, {
    ...args,
    y: 385,
    state: big,
    fraction: large,
    color: C.copper,
    label: 'Rate 0.05',
  });
  if (d.b >= 3)
    predictionScale(d, {
      ...args,
      y: 512,
      state: little,
      fraction: small,
      color: C.blue,
      label: 'Rate 0.025',
    });
  d.txt(
    'Observed 5 s',
    236 + (806 * (5 - args.lo)) / (args.hi - args.lo),
    298,
    19,
    C.green,
    'center',
  );
  if (d.b >= 2) {
    const color = d.b >= 3 ? C.blue : C.copper;
    d.txt('Prediction ' + fmt(live.prediction, 4) + ' s', 850, 146, 23, color);
    d.txt('Squared loss ' + fmt(live.loss, 8) + ' s²', 850, 198, 23, color);
  }
}
function fading(d) {
  const s = hiddenUnit([1.5, -4, 2, 0.5], 2, 5);
  if (d.b < 2) {
    d.title('Close the hidden gate');
    const labels = ['h', 'ReLU(h)', 'prediction', 'squared loss'],
      values = [s.h, s.z, s.prediction, s.loss];
    values.forEach((v, i) => {
      const x = 170 + i * 282;
      if (i < 3) d.arrow(x + 58, 293, x + 225, 293, C.grid, 4);
      d.node(x, 293, 53, labels[i], fmt(v), i === 1 ? C.copper : C.blue);
    });
    d.txt('Hidden bias = −4', 96, 150, 26, C.muted);
    if (d.b === 1 && d.cue(1, 'At the gate', 0))
      d.banner(
        d.clock.elapsed >= d.clock.speechDuration
          ? 'Gradient [w₁, b₁, w₂, b₂]    =    ' + vec(s.gradient)
          : 'Return to the output bias    ' + fmt(s.gradient[3]),
      );
    return;
  }
  if (d.b === 5) {
    d.title('Which values will backward need?');
    const nodes = ['input x', 'preactivation h', 'activation z', 'prediction'];
    const vals = [2, originalHidden.h, originalHidden.z, originalHidden.prediction];
    for (let i = 0; i < 4; i++) {
      const x = 150 + i * 296;
      if (i < 3) d.arrow(x + 53, 294, x + 239, 294, C.grid, 3);
      d.node(x, 294, 48, nodes[i], fmt(vals[i]), i === 2 ? C.copper : C.blue);
    }
    const again = d.cue(5, 'Recomputing them', 1.6);
    d.rect(505, 422, 310, 81, again ? C.apricot : C.sky);
    d.txt(
      again ? 'Replay h → z' : 'Saved z = 2',
      660,
      463,
      28,
      again ? C.copper : C.blue,
      'center',
      'Mono',
    );
    d.txt('Keep an activation in memory, or spend compute to produce it again.',
      600, 528, 29, C.ink, 'center', 'Serif');
    return;
  }
  if (d.b === 4) {
    d.title('Add the two returns at x');
    const branch = d.cue(4, 'adds to the one', 1.4);
    d.track(
      [
        [896, 319],
        [775, 319],
        [457, 319],
        [298, 319],
      ],
      d.cue(4, 'direct path', 1.4),
      C.green,
      1,
    );
    d.track(
      [
        [896, 331],
        [785, 581],
        [425, 581],
        [298, 331],
      ],
      branch,
      C.plum,
    );
    d.node(231, 325, 52, 'input', 'x');
    d.node(963, 325, 52, 'sum', '+', C.plum);
    d.txt('incoming signal 1', 963, 221, 22, C.muted, 'center');
    d.txt('identity  ×1', 596, 262, 28, C.green, 'center');
    d.txt('branch derivative', 595, 476, 23, C.plum, 'center');
    if (branch === 1) d.banner('Return at x   =   1 + branch derivative');
    return;
  }
  d.title('Follow a signal through ten multiplications');
  const n = Math.round(
    10 * (d.b === 2 ? d.cue(2, 'Multiply by one half', 2.3) : d.cue(3, 'each factor is two', 2.3)),
  );
  const rows =
    d.b === 2
      ? [[0.5, n, C.blue]]
      : [
          [0.5, 10, C.blue],
          [2, n, C.copper],
        ];
  for (const [i, [factor, count, col]] of rows.entries()) {
    const y = 246 + i * 171;
    d.txt('× ' + fmt(factor), 95, y, 29, col);
    for (let j = 0; j <= 10; j++) {
      const x = 226 + 75 * j;
      if (j) d.line(x - 75, y, x, y, j <= count ? col : C.grid, 3);
      d.dot(x, y, j <= count ? 7 : 4, j <= count ? col : C.grid);
    }
    d.txt(
      '1 × ' + fmt(factor) + '^' + count + '  =  ' + fmt(factor ** count, 10),
      595,
      y + 59,
      29,
      col,
      'center',
      'Mono',
    );
  }
}
function phraseComplete(d, beat, phrase) {
  if (d.b !== beat) return d.b > beat;
  return d.clock.elapsed >= d.clock.wordCue(phrase).end;
}
function exercise(d) {
  const unseen = d.b === 2,
    features = unseen ? [1, 2] : practiceRow.features,
    target = unseen ? 4 : practiceRow.target,
    start = practiceRow.start;
  const initial = latencyExample(start, practiceRow.features, practiceRow.target),
    updated = advance(start, initial.gradient, practiceRow.rate);
  const t = unseen ? 1 : Math.round(10 * d.cue(1, 'Apply it', 2)) / 10;
  const weights = start.map((v, i) => mix(v, updated[i], t)),
    s = latencyExample(weights, features, target);
  const predictionReady = unseen ? phraseComplete(d, 2, 'five point five') : phraseComplete(d, 1, 'The prediction is eight');
  const missReady = unseen ? phraseComplete(d, 2, 'one point five seconds') : phraseComplete(d, 1, 'the signed miss is one');
  const gradientReady = phraseComplete(d, 1, 'a gradient of six comma two');
  d.title(unseen ? 'Try the weights on an unseen request' : 'Your turn with a three-block request');
  d.metric('Blocks', features[0], 99, 167);
  d.metric('Queued seconds', features[1], 432, 167, C.plum);
  d.metric('Observed seconds', target, 839, 167, C.green);
  d.line(97, 267, 1106, 267, C.grid, 1);
  d.metric('Stored weights', vec(weights, 2), 99, 323, C.blue);
  d.metric('Prediction', predictionReady ? fmt(s.prediction, 2) + ' s' : '?', 520, 323, C.copper);
  d.metric('Signed miss', missReady ? fmt(s.error, 2) + ' s' : '?', 880, 323, C.copper);
  if (unseen) {
    if (missReady)
      d.banner('The training row fits. This held-out request misses by ' + fmt(s.error) + ' s.');
  } else if (gradientReady) {
    const landed = t === 1;
    const at = landed ? weights : start;
    const row = landed ? s : initial;
    const result = !landed || phraseComplete(d, 1, 'both entries of a fresh gradient are zero') ? vec(row.gradient) : '[?, ?]';
    d.txt(
      (landed ? 'Fresh gradient at ' : 'Gradient at ') +
        vec(at) +
        '     2 × ' +
        fmt(row.error) +
        ' × ' +
        vec(features) +
        ' = ' +
        result,
      600,
      465,
      28,
      landed ? C.green : C.plum,
      'center',
    );
  } else {
    d.txt('ŷ = w₁ × blocks + w₂ × queued seconds      loss = (ŷ − target)²',
      600, 465, 23, C.ink, 'center', 'Mono');
    d.banner('Gradient at ' + vec(start) + '     [?, ?]');
  }
}
function final(d) {
  const rateQuestion = d.cue(3, 'Try the rate', 0);
  d.title(rateQuestion ? 'Which gradient earns the smaller miss?' : 'Same error, different request');
  const old = originalHidden,
    newRow = fresh.before;
  if (!rateQuestion) {
    const xs = [526, 688, 862, 1030];
    d.txt('Input', 112, 151, 21, C.muted);
    d.txt('Saved z', 253, 151, 21, C.muted);
    ['∂w₁', '∂b₁', '∂w₂', '∂b₂'].forEach((v, i) => d.txt(v, xs[i], 151, 23, C.muted, 'center'));
    [old, newRow].forEach((r, j) => {
      const y = 228 + j * 130;
      d.rect(81, y - 40, 1032, 81, j ? C.sky : C.faint);
      d.txt(r.input, 137, y, 32, C.ink, 'center', 'Mono');
      d.txt(
        j && !phraseComplete(d, 2, 'ReLU output are one half') ? '?' : fmt(r.z),
        286,
        y,
        32,
        C.ink,
        'center',
        'Mono',
      );
      r.gradient.forEach((v, i) => {
        const bias = i === 1 || i === 3;
        const biasKnown = d.b > 2 || (d.b === 2 && d.clock.elapsed >= d.clock.speechDuration);
        const known =
          !j ||
          (bias ? biasKnown : phraseComplete(d, 3, i === 0 ? 'The first weight receives minus two' : 'The output weight receives minus one half'));
        d.txt(
          known ? fmt(v) : '?',
          xs[i],
          y,
          35,
          !known ? C.muted : j && v !== old.gradient[i] ? C.copper : C.blue,
          'center',
          'Mono',
        );
      });
    });
    d.txt('Prediction − target', 121, 464, 22, C.muted);
    d.txt(
      d.b === 0 ? '4.5 − 5 = −0.5' : '4.5 − 5  =  1.5 − 2  =  −0.5 s',
      475,
      464,
      28,
      C.ink,
      'left',
      'Mono',
    );
    if (d.b <= 1)
      d.txt(
        'h = 1.5x − 1       z = max(0, h)       ŷ = 2z + 0.5',
        600,
        528,
        22,
        C.ink,
        'center',
        'Mono',
      );
    if (d.b === 1) d.banner('Which entries will change when the input falls from 2 to 1?');
    if (d.cue(3, 'Read across', 0))
      d.banner('Input and activation changed. The bias derivatives retain their two values.');
    return;
  }
  const args = {
    lo: 1.42,
    hi: 2.32,
    target: newRow.target,
    start: newRow.prediction,
    domainTicks: [1.5, 1.75, 2, 2.25],
  };
  d.txt('x = ' + newRow.input + ' block     target = ' + newRow.target +
    ' s       z = max(0, w₁x + b₁)       ŷ = w₂z + b₂', 91, 127, 22, C.ink, 'left', 'Mono');
  const useCopied = d.cue(5, 'Suppose we had copied', 0);
  d.txt('Starting [w₁, b₁, w₂, b₂]', 92, 181, 21, C.muted);
  d.txt('Rate', 440, 181, 21, C.muted);
  d.txt(useCopied ? 'Copied gradient (two blocks)' : 'Fresh gradient (one block)',
    607, 181, 21, useCopied ? C.copper : C.blue);
  d.txt(vec(newRow.weights), 92, 221, 28, C.ink, 'left', 'Mono');
  d.txt('−', 398, 221, 28);
  d.txt(fmt(fresh.rate), 440, 221, 28, C.ink, 'left', 'Mono');
  d.txt('×', 548, 221, 28);
  d.txt(vec(useCopied ? old.gradient : newRow.gradient), 607, 221, 28,
    useCopied ? C.copper : C.blue, 'left', 'Mono');
  const greenX = 236 + (806 * (args.target - args.lo)) / (args.hi - args.lo);
  d.txt('target', greenX, 259, 18, C.green, 'center');
  function trial(label, after, y, color, weightsReady, activationReady, travel, lossReady) {
    const landed = travel === 1;
    const marker = { prediction: mix(args.start, after.prediction, travel) };
    predictionScale(d, { ...args, y, state: marker, fraction: travel, color, label });
    const weights = weightsReady ? vec(after.weights) : '[?, ?, ?, ?]';
    const z = activationReady ? fmt(after.z) : '?';
    const prediction = landed ? fmt(after.prediction) + ' s' : '?';
    const loss = landed && lossReady ? fmt(after.loss, 8) + ' s²' : '?';
    d.txt('Updated ' + weights + '    z = ' + z + '    ŷ = ' + prediction + '    loss = ' + loss,
      600, y + (label === 'Copied' ? 50 : 58), 20, weightsReady ? color : C.muted, 'center', 'Mono');
  }
  function travelDuring(beat, startPhrase, endPhrase) {
    if (d.b !== beat) return Number(d.b > beat);
    const start = d.clock.wordCue(startPhrase).start;
    const end = d.clock.wordCue(endPhrase).end;
    const progress = clamp((d.clock.elapsed - start) / (end - start));
    return progress * progress * (3 - 2 * progress);
  }
  const freshTravel = travelDuring(4, 'Follow this prediction', 'The prediction stops just short of two seconds');
  const freshActivationReady = d.b === 4
    ? d.clock.elapsed >= d.clock.wordCue('The hidden unit passes seven tenths').end
    : d.b > 4;
  trial('Fresh', fresh.after, 349, C.blue, d.cue(4, 'Follow this prediction', 0),
    freshActivationReady, freshTravel, phraseComplete(d, 5, 'about one thousandth'));
  if (useCopied) {
    const travel = travelDuring(6, 'Watch the copied dot', 'Two point two three seconds');
    trial('Copied', copied, 491, C.copper, d.cue(6, 'Watch the copied dot', 0),
      d.cue(6, 'Two point two three seconds', 0), travel, true);
  }
  if (d.b === 7)
    d.txt(
      'Fresh miss ' +
        fmt(Math.abs(fresh.after.error), 4) +
        ' s       •       Copied miss ' +
        fmt(Math.abs(copied.error), 4) +
        ' s',
      92, 274, 29, C.ink, 'left', 'Serif',
    );
}
export const practice = [hidden, update, fading, exercise, final];
