import {
  C,
  arrow,
  box,
  clamp,
  cue,
  dot,
  f,
  graph,
  head,
  line,
  mix,
  mono,
  steps,
  txt,
} from './drawing.mjs';
import {
  microbatchGradients,
  tokenMeanTrace,
  updateOnce,
} from '../../../films/training-backpropagation-gradient-descent/model.mjs';

export function momentumStep(grad, weight = 1, momentum = 2, rate = 0.1, decay = 0.9) {
  return grad === null ? weight : weight - rate * (momentum * decay + grad);
}
export const evalInputs = [1, 2, 3];
export const evalWeight = 2, evalBias = 1;
export const evalOutputs = evalInputs.map((x) => evalWeight * x + evalBias);
function loop(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    head(
      c,
      'Watch a parameter through one batch',
      'Affine predictor    /    starting weight 1    /    learning rate 0.1',
    );
    const ready =
      [
        cue(k, 0, 'Clear it'),
        cue(k, 0, 'Run a forward'),
        cue(k, 0, 'compute the scalar'),
        cue(k, 0, 'then run backward'),
        cue(k, 1, 'Now step'),
      ].filter((v) => v === 1).length - 1;
    const fresh = cue(k, 1, 'Run a fresh forward', 1) === 1;
    steps(c, ['clear', 'forward', 'loss', 'backward', 'step', 'fresh forward'], fresh ? 5 : ready);
    const fields = [
      ['weight', ready >= 4 ? '1.8' : '1'],
      [
        'saved tensors',
        fresh ? 'x (new pass)' : ready === 1 ? 'x' : ready === 2 ? 'x, residual' : ready >= 3 ? 'released' : 'empty',
      ],
      ['leaf .grad', ready < 0 ? 'previous' : ready < 3 ? 'None' : '−8'],
    ];
    fields.forEach(([key, v], i) => {
      const x = 80 + i * 294;
      box(c, x, 252, 218, 117, i === 2 ? C.dark : C.light, null, 7);
      txt(c, key, x + 16, 279, 18, i === 2 ? C.white : C.muted);
      mono(c, v, x + 16, 332, 23, i === 2 ? C.mint : C.ink);
    });
    if (fresh)
      mono(c, 'new forward    1.8 × 2 + 0.4 = 4 ms', 480, 407, 23, C.blue, 'center');
  } else if (b < 4) {
    head(
      c,
      'Replay an unused parameter',
      'Same weight 1    /    old momentum 2    /    momentum coefficient 0.9',
    );
    const go = cue(k, 3, 'At a learning rate', 1.25);
    for (let i = 0; i < 2; i++) {
      const y = 220 + i * 119;
      const g = i ? 0 : null,
        updated = momentumStep(g);
      mono(c, i ? 'grad = 0' : 'grad = None', 68, y, 24, i ? C.hot : C.muted);
      const X = (v) => 372 + (v - 0.75) * 1300;
      line(c, X(0.75), y, X(1.08), y, C.rule, 4);
      dot(c, X(1), y, 8, C.paper, C.muted);
      if (i && go) arrow(c, X(1), y, X(mix(1, updated, go)), y, C.hot, 3);
      dot(c, X(mix(1, updated, go)), y, 8, i ? C.hot : C.blue);
      mono(
        c,
        f(mix(1, updated, go)),
        X(mix(1, updated, go)),
        y - 27,
        22,
        i ? C.hot : C.blue,
        'center',
      );
      txt(
        c,
        i
          ? go === 1
            ? 'Momentum advances the weight'
            : 'zero tensor in buffer'
          : 'Optimizer skips this weight',
        65,
        y + 38,
        17,
        C.muted,
      );
    }
    if (go === 1) mono(c, '1 − 0.1 × (0.9 × 2 + 0) = 0.82', 480, 444, 23, C.hot, 'center');
  } else {
    const replay = cue(k, 5, 'inside no grad', 0) === 1;
    const exited = cue(k, 5, 'resume recording', 0) === 1;
    const train = cue(k, 5, 'for the next batch', 0) === 1;
    const affineStarted = cue(k, 4, 'Now send the dropout outputs', 0) === 1;
    const computed = replay
      ? cue(k, 5, 'This pass records', 0) === 1
      : cue(k, 4, 'With recording on', 0) === 1;
    head(c, 'Evaluation has two controls', 'Dropout followed by a trainable affine layer');
    txt(c, 'Input', 83, 168, 19, C.muted, 'center');
    txt(c, 'Dropout', 212, 168, 19, C.muted, 'center');
    txt(c, 'w × x + b', 369, 168, 20, C.muted, 'center');
    txt(c, 'Output', 503, 168, 19, C.muted, 'center');
    evalInputs.forEach((x, i) => {
      const y = 219 + i * 69;
      mono(c, train ? '·' : x, 83, y, 23, C.blue, 'center');
      if (train) return;
      line(c, 103, y, 199, y, C.rule, 3);
      dot(c, 211, y, 9, C.green);
      arrow(c, 220, y, 289, y, C.blue);
      if (affineStarted) {
        mono(c, evalWeight + ' × ' + x + ' + ' + evalBias, 369, y, 20, C.ink, 'center');
        arrow(c, 435, y, 472, y, C.muted);
        mono(c, computed ? evalOutputs[i] : '?', 503, y, 24, C.blue, 'center');
      }
    });
    mono(c, train ? 'model.train()' : 'model.eval()', 73, 427, 20, C.blue);
    if (train) txt(c, 'Ready for the next batch', 265, 427, 18, C.muted);
    const recording = !replay || exited;
    txt(c, 'Reverse-mode recording', 577, 168, 25, C.ink, 'left', 'Serif');
    box(c, 571, 198, 323, 177, C.night, null, 9);
    mono(c, recording ? 'on' : 'off', 733, 231, 31, C.mint, 'center');
    if (exited) {
      txt(c, 'Ready to record the next pass', 733, 310, 19, C.white, 'center');
    } else if (replay) {
      txt(c, 'New backward operations', 733, 285, 19, C.white, 'center');
      mono(c, '0', 733, 331, 27, C.white, 'center');
    } else if (computed) {
      txt(c, 'Input saved for ∂L/∂w', 733, 285, 20, C.white, 'center');
      mono(c, '[' + evalInputs.join(', ') + ']', 733, 331, 25, C.white, 'center');
    } else {
      txt(c, 'Dropout returns its input', 733, 308, 19, C.white, 'center');
    }
    mono(c, recording ? 'grad mode enabled' : 'with torch.no_grad()', 733, 427, 19, C.muted, 'center');
  }
}
export const batch = microbatchGradients(),
  tokens = tokenMeanTrace();
export const signedInput = { x: -2, weight: -1, bias: 0, target: 6 };
export const signedStep = updateOnce(0.1, signedInput);
function batches(c, k) {
  const b = k.beat.beatIndex;
  if (b <= 3) {
    head(c, 'Whose gradient fills the buffer?', 'Three requests start at w = 0 and b = 0');
    const wrong = cue(k, 1, 'half the strip', 1.2),
      repair = cue(k, 2, 'give the pair', 1.1);
    const skew = wrong * (1 - repair);
    const shares = [1 / 3 - skew / 12, 1 / 3 - skew / 12, 1 / 3 + skew / 6];
    const colors = ['#adcacd', '#b3d4bd', '#efbd88'];
    let x = 81;
    shares.forEach((s, i) => {
      const width = 798 * s;
      box(c, x, 200, width - 2, 118, colors[i]);
      mono(c, 'ABC'[i], x + width / 2, 222, 21, C.ink, 'center');
      const [input, target] = batch.rows[i];
      txt(c, 'input ' + input + '    target ' + target, x + width / 2, 255, 18, C.ink, 'center');
      if (cue(k, 0, 'Multiply each residual') > 0)
        mono(
          c,
          f(-target) + ' × ' + f(input) + ' = ' + f(batch.rowGradients[i].weight),
          x + width / 2,
          292,
          20,
          C.ink,
          'center',
        );
      const label = skew === 1 ? (i === 2 ? '1/2' : '1/4') : skew === 0 ? '1/3' : f(s, 2);
      mono(c, label, x + width / 2, 343, 22, i === 2 ? C.hot : C.ink, 'center');
      x += width;
    });
    if (b > 0) {
      const edge = 81 + 798 * (1 - shares[2]);
      line(c, 82, 183, edge - 3, 183, C.blue, 3);
      line(c, edge + 3, 183, 878, 183, C.hot, 3);
      txt(c, 'chunk A + B', (83 + edge) / 2, 159, 17, C.blue, 'center');
      txt(c, 'chunk C', (878 + edge) / 2, 159, 17, C.hot, 'center');
    }
    const gradient = shares.reduce((sum, v, i) => sum + v * batch.rowGradients[i].weight, 0);
    mono(
      c,
      skew === 0
        ? cue(k, 0, 'The full mean gradient') > 0
          ? 'mean weight gradient  =  ' + f(batch.full.weight * 3) + ' / 3'
          : 'weight gradient = residual × input'
        : 'combined weight gradient  =  ' + f(gradient, 2),
      480,
      410,
      25,
      C.ink,
      'center',
    );
    if (b === 3)
      txt(
        c,
        'Both backward calls finish before one optimizer step.',
        480,
        452,
        18,
        C.muted,
        'center',
      );
  } else if (b <= 7) {
    head(
      c,
      'Count the targets that enter the loss',
      'Each cell holds one token loss. Hatched cells are padding.',
    );
    const counted = cue(k, 5, 'Each one gets', 0) === 1;
    const rowReady = [
      cue(k, 5, 'The second row', 0) === 1,
      cue(k, 5, 'Multiply each mean', 0) === 1,
    ];
    const combined = cue(k, 6, 'Each valid token', 0) === 1;
    tokens.chunks.forEach((chunk, r) => {
      const y = 171 + r * 111;
      txt(c, 'row ' + (r + 1), 72, y + 36, 20, C.ink);
      for (let i = 0; i < 7; i++) {
        const x = 173 + i * 75;
        const pad = i >= chunk.length;
        box(c, x, y, 65, 70, pad ? C.light : r ? '#c3d8bf' : '#acd0d6', C.rule, 2);
        if (pad) {
          for (let j = 0; j < 4; j++)
            line(c, x + 6 + j * 13, y + 49, x + 15 + j * 13, y + 24, C.rule, 1.5);
        } else mono(c, chunk[i], x + 32, y + 34, 25, C.ink, 'center');
      }
      mono(
        c,
        rowReady[r] ? chunk.length + ' / ' + tokens.total : chunk.length + ' valid',
        770,
        y + 34,
        20,
        C.blue,
      );
    });
    if (counted) {
      const terms = tokens.means.map((v, i) => '(' + tokens.counts[i] + '/' + tokens.total + ') × ' + v);
      const expression = rowReady[1] ? terms.join(' + ') + ' = ' + (combined ? f(tokens.mean) : '?')
        : rowReady[0] ? terms[0] + ' + …' : tokens.total + ' valid targets   ·   weight per token 1/' + tokens.total;
      mono(c, expression, 480, 416, 24, C.green, 'center');
    }
    if (b === 7)
      txt(c, 'BatchNorm can change the losses inside the cells.', 480, 458, 17, C.muted, 'center');
  } else {
    head(c, 'When does the optimizer step?', 'Six requests per pass    /    ten passes');
    const n =
      cue(k, 8, 'Full-batch descent', 1) +
      cue(k, 8, 'A mini-batch', 1) +
      cue(k, 8, 'Online descent', 1);
    [6, 2, 1].forEach((size, i) => {
      const y = 169 + i * 93;
      txt(c, ['full batch', 'pairs', 'online'][i], 80, y + 25, 21, C.ink);
      for (let j = 0; j < 6; j++) {
        const x = 270 + j * 65;
        dot(c, x, y + 18, 15, '#c0d2bb');
        mono(c, j + 1, x, y + 19, 16, C.ink, 'center');
        if (n > i && j % size === 0) {
          line(c, x - 20, y + 44, x + (size - 1) * 65 + 20, y + 44, C.green, 3);
        }
      }
      if (n > i) mono(c, (10 * 6) / size + ' steps', 742, y + 22, 22, C.green);
    });
    if (b >= 9)
      txt(
        c,
        'Independent samples: covariance of the mean = covariance / batch size.',
        480,
        451,
        19,
        C.muted,
        'center',
      );
  }
}
function rate(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    head(c, 'Start from the measured miss', 'w = 1    /    b = 0    /    x = 2');
    const X = (v) => 98 + 95 * v;
    line(c, X(0), 264, X(8), 264, C.muted, 2);
    for (let t = 0; t <= 8; t++) {
      line(c, X(t), 258, X(t), 272, C.muted);
      mono(c, t, X(t), 298, 17, C.muted, 'center');
    }
    dot(c, X(2), 264, 8, C.blue);
    dot(c, X(6), 264, 8, C.hot);
    txt(c, 'model', X(2), 228, 21, C.blue, 'center');
    txt(c, 'server', X(6), 228, 21, C.hot, 'center');
    if (cue(k, 0, 'The dot starts') > 0) {
      arrow(c, X(6), 341, X(2), 341, C.hot, 3);
      mono(c, 'e = −4 ms', X(4), 383, 24, C.hot, 'center');
    }
  } else if (b <= 2) {
    head(
      c,
      'Two paths set the step size',
      'One request    /    half-squared loss    /    update weight and bias together',
    );
    const parts = [
      ['weight path', 'e × x', '−η e x', '−η e x²'],
      ['bias path', 'e', '−η e', '−η e'],
    ];
    ['gradient', 'parameter change', 'prediction change'].forEach((s, i) =>
      txt(c, s, 358 + i * 220, 158, 16, C.muted, 'center'),
    );
    parts.forEach(([s, ...items], r) => {
      const y = 233 + r * 102;
      txt(c, s, 70, y, 23, C.ink, 'left', 'Serif');
      items.forEach((v, i) => {
        if (i < 2) arrow(c, 418 + i * 220, y, 495 + i * 220, y, C.rule);
        mono(c, v, 354 + i * 220, y, 24, r ? C.green : C.blue, 'center');
      });
    });
    if (cue(k, 2, 'residual is multiplied') > 0)
      mono(c, 'next e  =  e × [1 − η(x² + 1)]', 480, 438, 29, C.hot, 'center');
  } else if (b <= 6) {
    head(
      c,
      'Follow the residual after each step',
      'Each trajectory starts at the same miss of −4 ms',
    );
    const rates = [0.1, 0.2, 0.4, 0.5];
    const reveal = [
      cue(k, 3, 'Try a rate', 1.5),
      cue(k, 3, 'At one fifth', 1.5),
      cue(k, 4, 'At point four', 1.5),
      cue(k, 4, 'At one half', 1.5),
    ];
    const colors = [C.blue, C.green, '#a97919', C.hot],
      X = (i) => 110 + i * 140,
      Y = (v) => 281 - 10 * v;
    for (const v of [-10, 0, 10]) {
      line(c, 91, Y(v), 600, Y(v), v === 0 ? C.ink : C.rule, v === 0 ? 2 : 1);
      mono(c, f(v), 74, Y(v), 14, C.muted, 'right');
    }
    for (let j = 0; j <= 3; j++) mono(c, j, X(j), 446, 15, C.muted, 'center');
    rates.forEach((r, i) => {
      if (!reveal[i]) return;
      const m = updateOnce(r).multiplier;
      const v = Array.from({ length: 4 }, (_, j) => -4 * Math.pow(m, j));
      for (let j = 0; j < 3; j++) {
        const t = clamp(reveal[i] * 3 - j);
        if (t > 0) {
          const x = mix(X(j), X(j + 1), t),
            y = mix(Y(v[j]), Y(v[j + 1]), t);
          line(c, X(j), Y(v[j]), x, y, colors[i], 2.8);
          dot(c, x, y, 4.2, colors[i]);
        }
      }
      mono(c, 'η ' + f(r) + '   × ' + f(m), 646, 191 + i * 53, 20, colors[i]);
    });
    if (b === 6) mono(c, 'shrinks:   0 < η < 0.4', 625, 424, 18, C.green);
    txt(c, 'optimizer step', 318, 472, 16, C.muted, 'center');
  } else {
    head(
      c,
      'Reverse the input and keep the miss',
      'Starting w = −1    /    x = −2    /    b = 0    /    target 6 ms',
    );
    const n = signedStep;
    const t = cue(k, 8, 'Subtract eight tenths', 1.3);
    const val = mix(-1, n.weight, t),
      bias = mix(0, n.bias, t);
    const scale = (v) => 104 + (v + 2) * 240;
    line(c, 94, 240, 621, 240, C.muted, 2);
    for (let i = -2; i <= 0; i++) {
      mono(c, f(i), scale(i), 274, 17, C.muted, 'center');
      line(c, scale(i), 231, scale(i), 248, C.muted);
    }
    dot(c, scale(-1), 240, 8, C.paper, C.blue);
    dot(c, scale(val), 240, 9, C.blue);
    mono(c, 'w ' + f(val, 2), scale(val), 205, 21, C.blue, 'center');
    mono(c, 'b ' + f(bias, 2), 724, 237, 23, C.green);
    const fresh = cue(k, 8, 'Run the model again', 0) === 1;
    const result = cue(k, 8, 'Subtract six', 0) === 1;
    txt(c, fresh ? 'Fresh forward pass' : 'Previous forward pass', 480, 334, 20, C.muted, 'center');
    const w = fresh ? n.weight : signedInput.weight, intercept = fresh ? n.bias : signedInput.bias;
    const prediction = fresh ? (result ? f(n.nextPrediction) : '?') : f(n.prediction);
    mono(c, '(' + f(w) + ') × (' + f(signedInput.x) + ') + ' + f(intercept) + ' = ' + prediction + ' ms',
      480, 385, 28, C.ink, 'center');
    if (!fresh && cue(k, 8, 'Subtract eight tenths', 0) === 1) {
      mono(c, 'Previous gradients    ∂L/∂w = +' + f(n.gradWeight) + '    ∂L/∂b = ' + f(n.gradBias), 480, 449, 19, C.hot, 'center');
    } else if (fresh && cue(k, 8, 'For the next step', 0) === 1) {
      const residual = n.nextPrediction - signedInput.target;
      const grads = k.elapsed >= k.speechDuration
        ? '     ∂L/∂w = +' + f(residual * signedInput.x) + '    ∂L/∂b = ' + f(residual) : '';
      mono(c, 'Fresh residual ' + f(residual) + grads, 480, 449, 19, C.green, 'center');
    }
  }
}
export const trainingScenes = [loop, batches, rate];
