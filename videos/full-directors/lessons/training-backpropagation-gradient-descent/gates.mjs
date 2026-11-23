import { C, arrow, box, cue, dot, f, head, line, mix, mono, recorder, txt } from './drawing.mjs';
import { nonlinearTrace } from '../../../films/training-backpropagation-gradient-descent/model.mjs';

export const networks = [
  nonlinearTrace(),
  nonlinearTrace(3, 7, 0.025),
  nonlinearTrace(-2, 7, 0.025),
];

// The dark shutter stays across the signal rail until a positive preactivation lifts it.
function shutter(c, x, y, open, lit = true) {
  box(c, x - 23, y - 33, 46, 66, '#244047', null, 5);
  line(c, x - 17, y + 21, x + 17, y + 21, '#607874', 2);
  if (open && lit) {
    box(c, x - 14, y - 27, 28, 13, '#99bdab', null, 2);
    line(c, x - 22, y, x + 22, y, C.mint, 4);
  } else {
    box(c, x - 13, y - 24, 26, 46, '#526467', null, 2);
    for (let i = -12; i <= 12; i += 8) line(c, x - 8, y + i, x + 8, y + i, '#34484c', 2);
  }
}
function localRules(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    head(
      c,
      'Dense backward',
      'Pair each component of the incoming gradient with every saved input',
    );
    const d = [-4, 0],
      inp = [2, 1];
    const grow = cue(k, 0, 'Pair every', 1.6);
    txt(c, 'saved input x', 367, 151, 19, C.blue, 'center');
    txt(c, 'incoming δ', 103, 204, 18, C.hot);
    inp.forEach((v, i) => mono(c, v, 314 + i * 104, 190, 22, C.blue, 'center'));
    d.forEach((v, r) => {
      mono(c, f(v), 217, 248 + r * 82, 24, C.hot, 'center');
      inp.forEach((value, i) => {
        const x = 269 + 104 * i,
          y = 214 + r * 82;
        box(c, x, y, 90, 68, r ? C.light : '#a9c8b7', C.rule, 3);
        if (grow * 4 > r * 2 + i) mono(c, f(v * value), x + 45, y + 34, 26, C.ink, 'center');
      });
    });
    txt(c, 'Weight gradients', 365, 409, 20, C.ink, 'center');
    mono(c, '∂L/∂W = outer(δ, x)', 526, 228, 24, C.ink);
    if (cue(k, 0, 'The bias receives') > 0) {
      mono(c, '∂L/∂b = δ', 554, 290, 24, C.hot);
      mono(c, '∂L/∂x = W^T δ', 554, 348, 24, C.blue);
    }
  } else if (b === 3) {
    head(c, 'Return to the saved winner', 'Max pooling    /    one 2 × 2 window');
    const xs = [174, 504],
      y0 = 196,
      values = [2, 2, -1, 0],
      winner = values.indexOf(Math.max(...values)),
      up = -4;
    const assigned = cue(k, 3, 'The other cells') > 0;
    for (let view = 0; view < 2; view++) {
      txt(
        c,
        view ? 'backward' : 'forward',
        xs[view] + 90,
        158,
        22,
        view ? C.hot : C.blue,
        'center',
      );
      values.forEach((v, i) => {
        const x = xs[view] + (i % 2) * 92,
          y = y0 + Math.floor(i / 2) * 83;
        const selected = i === winner && cue(k, 3, 'saves the upper left') > 0;
        box(c, x, y, 86, 78, selected ? '#c2d7b9' : C.light, selected ? C.green : C.rule, 3);
        mono(
          c,
          view ? (assigned ? f(i === winner ? up : 0) : '·') : f(v),
          x + 43,
          y + 39,
          28,
          selected ? C.green : C.ink,
          'center',
        );
      });
    }
    arrow(c, 382, 277, 479, 277, C.hot, 3);
    mono(c, 'incoming −4', 433, 398, 23, C.hot, 'center');
  } else {
    head(
      c,
      'Which gates pass the derivative?',
      'This gate uses the preactivation it saved during the forward pass',
    );
    [2, -1, 0].forEach((z, i) => {
      const x = 205 + i * 273,
        y = 274;
      const t = cue(
        k,
        1,
        i === 0 ? 'Follow minus four' : i === 1 ? 'A negative input' : 'At exactly zero',
        1.1,
      );
      mono(c, 'z = ' + f(z), x, 174, 24, C.blue, 'center');
      line(c, x - 87, y, x + 88, y, C.muted, 3);
      shutter(c, x, y, z > 0);
      if (t) {
        const dx = mix(x + 85, z > 0 ? x - 80 : x + 25, t);
        dot(c, dx, y, 6, C.hot);
      }
      if (t === 1)
        mono(c, z > 0 ? 'passes −4' : 'returns 0', x, 363, 22, z > 0 ? C.hot : C.muted, 'center');
      if (i === 2 && b === 2) txt(c, 'zero by convention', x, 401, 17, C.muted, 'center');
    });
  }
}
function paintBoard(c, m, view) {
  const { back, grads, updated, hiddenReady, calcReady, forward, oldPrediction } = view;
  const { weights, biases, outWeights, z, hidden } = m;
  const live = z.findIndex((v) => v > 0);
  box(c, 49, 140, 862, 235, C.dark, null, 12);
  txt(c, 'input', 95, 166, 15, C.white, 'center');
  txt(c, 'hidden weight × input + bias', 290, 166, 15, C.white, 'center');
  txt(c, 'ReLU', 490, 166, 15, C.white, 'center');
  txt(c, 'output weight × activation', 694, 166, 15, C.white, 'center');
  for (let i = 0; i < 2; i++) {
    const y = 223 + 96 * i,
      active = i === live;
    const color = active && forward ? C.mint : '#9eafab';
    const rail = active && forward ? '#8bb4a6' : '#55696b';
    const w = updated ? m.nextWeights[i] : weights[i],
      b = updated ? m.nextBiases[i] : biases[i],
      v = updated ? m.nextOut[i] : outWeights[i];
    line(c, 116, 272, 155, 272, C.wire, 2.4);
    line(c, 155, 272, 181, y, rail, 2.4);
    line(c, 181, y, 461, y, rail, 2.4);
    line(c, 519, y, 785, y, rail, 2.4);
    line(c, 785, y, 840, 273, rail, 2.4);
    mono(c, f(w) + ' × ' + f(m.x) + ' + ' + f(b), 307, y - 17, 19, color, 'center');
    shutter(c, 490, y, active, forward >= 0.52);
    const activation = updated ? m.nextHidden[i] : hidden[i];
    const available = updated ? hiddenReady : forward === 1;
    mono(c, f(v) + ' × ' + (available ? f(activation) : '?'), 694, y - 18, 20, color, 'center');
    if (available)
      mono(
        c,
        f(updated ? m.nextZ[i] : z[i]) + ' → ' + f(activation),
        491,
        y + 43,
        15,
        color,
        'center',
      );
    if (back > 0 && !updated) {
      const start = 781,
        gate = 520,
        end = active ? 193 : gate;
      const endX =
        back < 0.52 ? mix(start, gate, back / 0.52) : mix(gate, end, (back - 0.52) / 0.48);
      arrow(c, start, y + 7, endX, y + 7, active ? C.amber : '#8c9992', 3);
      if (active) dot(c, endX, y + 7, 5, C.amber);
      if (grads) {
        mono(
          c,
          'grad w ' + f(m.gradWeights[i]),
          290,
          y + 26,
          17,
          active ? C.amber : '#b0bcb7',
          'center',
        );
        mono(
          c,
          'grad v ' + f(m.gradOut[i]),
          695,
          y + 26,
          17,
          active ? C.amber : '#b0bcb7',
          'center',
        );
      }
    } else if (forward > 0 && forward < 1) {
      const endX = mix(180, active ? 780 : 463, forward);
      dot(c, endX, y, 4.5, C.sky);
    }
  }
  dot(c, 91, 272, 25, C.night, C.wire);
  mono(c, f(m.x), 91, 272, 20, C.sky, 'center');
  dot(c, 845, 273, 23, C.night, C.wire);
  mono(c, 'Σ', 845, 273, 25, C.white, 'center');
  const bias = updated ? m.nextOutBias : 0;
  mono(c, '+ ' + f(bias), 846, 325, 16, C.white, 'center');
  if (calcReady || oldPrediction)
    mono(
      c,
      calcReady ? 'ŷ = ' + f(m.nextPrediction) + ' ms' : 'ŷ = ' + f(m.prediction) + ' ms',
      85,
      407,
      25,
      C.blue,
    );
}
function positiveNetwork(c, k, m, transfer) {
  head(
    c,
    transfer ? 'Replay with a larger input' : 'One request through two hidden units',
    'Complexity ' + m.x + '    /    server ' + m.target + ' ms    /    learning rate ' + f(m.rate),
  );
  const forward = cue(k, 0, transfer ? 'This request' : 'Read the upper', 1.7);
  const back = transfer
    ? 0.52 * cue(k, 1, 'Trace the error', 1.3) + 0.48 * cue(k, 1, 'The closed gate stops it', 0.85)
    : 0.52 * cue(k, 2, 'Now send minus four', 1.2) + 0.48 * cue(k, 3, 'Only the upper gate', 1.1);
  const grads = transfer
    ? cue(k, 1, 'Each active bias') > 0
    : cue(k, 3, 'Both lower gradients') > 0;
  const updated = transfer ? cue(k, 2, 'Run the upper') > 0 : cue(k, 4, 'Now run forward') > 0;
  const hiddenReady = transfer
    ? cue(k, 2, 'Multiply that four') > 0
    : cue(k, 5, 'Its output weight') > 0;
  const calcReady = transfer
    ? cue(k, 3, 'The server still takes', 0) === 1
    : cue(k, 5, 'Subtract the target', 0) === 1;
  const residualReady = transfer
    ? cue(k, 3, 'Half its square', 0) === 1
    : cue(k, 5, 'Square that residual', 0) === 1;
  const lossReady = transfer
    ? cue(k, 4, 'The smaller miss', 0) === 1
    : cue(k, 6, 'Compare that with eight', 0) === 1;
  const oldPrediction =
    !updated &&
    (transfer ? cue(k, 0, 'The server measures') > 0 : cue(k, 1, 'The server measured') > 0);
  paintBoard(c, m, { back, grads, updated, hiddenReady, calcReady, forward, oldPrediction });
  let note = '';
  if (residualReady) {
    const residual = f(m.nextPrediction - m.target);
    note = 'e = ' + residual + ' ms     L = ½ × (' + residual + ')² = ' +
      (lossReady ? f(m.nextLoss, 3) + ' ms²' : '?');
  } else if (calcReady) note = 'e = ' + f(m.nextPrediction) + ' − ' + f(m.target) + ' ms';
  else if (updated && hiddenReady)
    note = f(m.nextOut[0]) + ' × ' + f(m.nextHidden[0]) + ' + ' + f(m.nextOutBias) + ' = ?';
  else if (updated) note = 'fresh forward pass';
  else if (grads) note = 'bias gradients   hidden [−4, 0]    output −4';
  else if (back) note = 'residual −4     return toward the saved gates';
  else if (oldPrediction) {
    const settled = transfer
      ? cue(k, 0, 'which hidden weight', 0) === 1
      : cue(k, 1, 'How far back', 0) === 1;
    note = settled ? 'residual ' + f(m.residual) + ' ms     loss ' + f(m.loss) + ' ms²'
      : 'e = ' + f(m.prediction) + ' − ' + f(m.target) + ' ms';
  }
  if (note) mono(c, note, 880, 406, 19, calcReady ? C.green : C.ink, 'right');
}

function afterPhrase(k, beat, phrase) {
  if (k.beat.beatIndex !== beat) return k.beat.beatIndex > beat;
  return k.elapsed + 1e-9 >= k.wordCue(phrase).end;
}

function signedProduct(c, k, m, i) {
  head(c, 'Follow the lower weight', 'The saved input stays at ' + f(m.x) + ' throughout this step');
  const startWeight = m.weights[i];
  const nextWeight = m.nextWeights[i];
  const startProduct = startWeight * m.x;
  const startBias = m.biases[i];
  const nextBias = m.nextBiases[i];
  const movingBeat = k.beat.beatIndex === 3;
  let slide = 1;
  if (movingBeat) {
    const move = 'slide the lower weight';
    const duration = k.wordCue('Watch its product move right').end - k.wordCue(move).start;
    slide = k.reveal(move, duration, { captionStart: false });
  }
  const weight = mix(startWeight, nextWeight, slide);
  const product = weight * m.x;
  const origin = 480;
  const tickWidth = 76;
  const tickValue = 0.1;
  const position = (value, start) => origin + ((value - start) / tickValue) * tickWidth;
  const weightY = 206;
  const productY = 329;
  const productReady = afterPhrase(k, 3, 'That product is two');
  const weightResult = afterPhrase(k, 3, 'The weight is now minus one point two');
  const productResult = afterPhrase(k, 3, 'Its product is two point four');

  // Both rows use the same scale and align at their starting values.
  line(c, origin, weightY + 9, origin, productY - 9, C.rule, 2, [5, 6]);
  mono(c, '× (' + f(m.x) + ')', 100, 251, 24, C.ink);
  if (productReady && slide > 0) {
    line(
      c,
      position(weight, startWeight),
      weightY + 9,
      position(product, startProduct),
      productY - 9,
      C.wire,
      2,
      [5, 6],
    );
  }
  const rulers = [
    {
      title: 'Hidden weight w',
      start: startWeight,
      value: weight,
      y: weightY,
      color: C.blue,
      ready: true,
      delta: weightResult ? 'Δw = ' + f(weight - startWeight) : null,
    },
    {
      title: 'Product wx',
      start: startProduct,
      value: product,
      y: productY,
      color: C.hot,
      ready: productReady,
      delta: productResult ? 'Δ(wx) = +' + f(product - startProduct) : null,
    },
  ];
  rulers.forEach(({ title, start, value, y, color, ready, delta }, row) => {
    const above = row === 0;
    const titleY = above ? 139 : 283;
    txt(c, title, 100, titleY, 22, color);
    if (delta) mono(c, delta, 860, titleY, 23, color, 'right');
    line(c, origin - 5 * tickWidth - 8, y, origin + 5 * tickWidth + 8, y, C.muted, 2);
    for (let j = -5; j <= 5; j++) {
      const x = origin + j * tickWidth;
      line(c, x, y - 6, x, y + 6, C.muted);
      mono(c, f(start + j * tickValue, 1), x, y + (above ? -23 : 24), 20, C.muted, 'center');
    }
    if (!ready) return;
    const tip = position(value, start);
    line(c, origin, y, tip, y, color, 4);
    dot(c, origin, y, 6, C.paper, color);
    dot(c, tip, y, 8, color);
  });

  if (afterPhrase(k, 4, 'it gives three and a half')) {
    mono(c, f(product) + ' + ' + f(nextBias) + ' = ' + f(m.nextHidden[i]), 100, 421, 24, C.blue);
  } else if (afterPhrase(k, 3, 'Its bias rises to one point one')) {
    mono(c, 'Hidden bias   ' + f(startBias) + ' → ' + f(nextBias), 100, 421, 21, C.blue);
  }
  if (afterPhrase(k, 4, 'Add the output bias of a tenth')) {
    mono(
      c,
      f(m.nextOut[i]) + ' × ' + f(m.nextHidden[i]) + ' + ' + f(m.nextOutBias) + ' = ?',
      860,
      421,
      24,
      C.hot,
      'right',
    );
  }
}

function signed(c, k) {
  const b = k.beat.beatIndex,
    m = networks[2],
    i = 1;
  if (b <= 2) {
    head(
      c,
      'Which hidden weight should move?',
      'Fresh request    /    complexity −2    /    server 7 ms',
    );
    const back =
      0.52 * cue(k, 2, 'minus four reaches both gates', 1.1) +
      0.48 * cue(k, 2, 'Only the lower', 1.1);
    const grads = afterPhrase(k, 2, 'That gives positive eight');
    paintBoard(c, m, {
      back,
      grads,
      updated: false,
      hiddenReady: false,
      calcReady: false,
      forward: cue(k, 0, 'Put minus two', 1.5),
      oldPrediction: cue(k, 1, 'The server measured') > 0,
    });
    if (grads)
      mono(
        c,
        'lower grad w  =  (' + f(m.gradZ[i]) + ') × (' + f(m.x) + ')  =  +' + f(m.gradWeights[i]),
        871,
        407,
        22,
        C.hot,
        'right',
      );
    else if (afterPhrase(k, 1, 'The error is minus four'))
      mono(
        c,
        'residual    ' + f(m.prediction) + ' − ' + f(m.target) + ' = ' + f(m.residual) + ' ms',
        870,
        407,
        20,
        C.hot,
        'right',
      );
  } else if (b === 3 || b === 4) {
    signedProduct(c, k, m, i);
  } else {
    head(c, 'Run the clock again', 'Same request    /    updated weights');
    const answer = 'It lands at four point six five milliseconds';
    k.reveal(answer, 0, { captionStart: answer });
    const result = afterPhrase(k, 5, answer);
    const arrival = 'Seven milliseconds';
    const arrived = afterPhrase(k, 5, arrival);
    const run = 'Let the server clock finish';
    const duration = k.wordCue(arrival).end - k.wordCue(run).start;
    const scan = k.reveal(run, duration, { captionStart: false });
    recorder(c, {
      previous: m.prediction,
      predicted: m.nextPrediction,
      revealPrediction: result,
      target: m.target,
      scan: arrived ? m.target : Math.min(m.target - 0.01, m.target * scan),
      arrived,
      miss:
        arrived && afterPhrase(k, 5, 'The miss shrank from four milliseconds to two point three five'),
    });
    if (afterPhrase(k, 5, 'Loss fell from eight to about two point seven six square milliseconds'))
      mono(
        c,
        'Loss    ' + f(m.loss) + ' ms² → ≈' + f(m.nextLoss, 2) + ' ms²',
        864,
        103,
        21,
        C.green,
        'right',
      );
  }
}
export const routeScenes = {
  localRules,
  network: (c, k) => positiveNetwork(c, k, networks[0], false),
  transfer: (c, k) => positiveNetwork(c, k, networks[1], true),
  signed,
};
