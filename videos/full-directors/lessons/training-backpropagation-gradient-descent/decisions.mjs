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
  txt,
} from './drawing.mjs';
import {
  classificationTrace,
  simulateStopping,
  updateOnce,
} from '../../../films/training-backpropagation-gradient-descent/model.mjs';

export function checkpointTrace(values, delta, patience) {
  let best = Infinity,
    bestEpoch = 0,
    reset = Infinity,
    used = 0;
  const trace = [];
  values.some((v, i) => {
    if (v < best) {
      best = v;
      bestEpoch = i + 1;
    }
    if (reset - v > delta) {
      used = 0;
      reset = v;
    } else used++;
    trace.push({ v, best, bestEpoch, used, reset, stopped: used >= patience });
    return used >= patience;
  });
  return trace;
}
const large = simulateStopping().values,
  small = [1, 0.995, 0.996];

function restoredOn(k, beat, number, nextSentence, answer, leadSeconds) {
  if (k.beat.beatIndex !== beat) return k.beat.beatIndex > beat;
  if (k.wordCue) return k.reveal(number, 0, { captionStart: nextSentence }) === 1;
  // The delivery clock measures the lead from the first word of the recorded answer.
  return k.reveal(answer, leadSeconds) === 1;
}

function diagnosis(c, k) {
  const b = k.beat.beatIndex;
  if (b <= 1) {
    head(c, 'Replay the failed step', 'Same batch • same initial weight • checked gradient −8');
    const attempts = [
      { r: 0.5, t: cue(k, 0, 'What would you change', 0.9) },
      { r: 0.1, t: cue(k, 1, 'Loss falls', 0.9) },
    ];
    attempts.forEach(({ r, t }, i) => {
      if (i > b) return;
      const m = updateOnce(r),
        y = 209 + i * 119;
      mono(c, 'η = ' + f(r), 85, y, 23, C.ink);
      const X = (v) => 283 + v * 25;
      line(c, X(0), y, X(19), y, C.rule, 3);
      dot(c, X(m.loss), y, 8, C.paper, C.muted);
      mono(c, 'old ' + f(m.loss), X(m.loss), y + 29, 18, C.muted, 'center');
      arrow(c, X(m.loss), y, X(mix(m.loss, m.nextLoss, t)), y, i ? C.green : C.hot);
      if (t === 1) {
        dot(c, X(m.nextLoss), y, 8, i ? C.green : C.hot);
        mono(c, 'L ' + f(m.nextLoss), X(m.nextLoss), y - 30, 22, i ? C.green : C.hot, 'center');
      }
    });
    txt(
      c,
      b ? 'Change only the rate and compare on the same data.' : 'What would you change first?',
      480,
      425,
      23,
      C.ink,
      'center',
      'Serif',
    );
  } else if (b <= 4) {
    if (b === 2 && cue(k, 2, 'If loss becomes') === 0) {
      head(c, 'Watch the buffer between backward calls', 'Identical data and unchanged weights');
      const t = cue(k, 2, 'It doubles', 1.3);
      for (let i = 0; i < 2; i++) {
        const y = 209 + i * 112;
        txt(c, 'backward ' + (i + 1), 78, y + 25, 22, C.ink);
        box(c, 270, y, 218, 49, C.blue);
        if (i && t) box(c, 488, y, 218 * t, 49, '#92b9c2');
        mono(c, i ? f(-8 * (1 + t), 1) : '−8', 769, y + 26, 25, C.blue);
      }
      txt(c, 'Which effective batch owns this gradient?', 480, 431, 23, C.ink, 'center', 'Serif');
    } else if (b <= 3) {
      head(c, 'Find the first invalid operation', 'Forward values on the same trace');
      const values = ['input   −1', 'real square root', 'loss'];
      values.forEach((s, i) => {
        const x = 80 + i * 299;
        box(c, x, 220, 213, 89, i === 1 ? '#ebc6af' : C.light, null, 5);
        txt(c, s, x + 106, 265, i === 1 ? 23 : 25, C.ink, 'center');
        if (i < 2) arrow(c, x + 221, 265, x + 287, 265, C.muted);
      });
      if (b === 3)
        mono(c, 'finite                NaN                 NaN', 480, 369, 25, C.hot, 'center');
    } else {
      head(c, 'Check the saved preactivation', 'Inspect one early unit across a small batch');
      const values = [-2, -1, -0.5, -3];
      values.forEach((v, i) => {
        const x = 154 + i * 209;
        mono(c, 'z = ' + f(v), x, 200, 23, C.blue, 'center');
        line(c, x, 227, x, 330, C.muted, 3);
        box(c, x - 32, 261, 64, 17, C.dark, null, 3);
        if (cue(k, 4, 'across a batch') > 0) mono(c, 'grad 0', x, 370, 21, C.hot, 'center');
      });
      txt(
        c,
        'Check the input distribution, initialization, and step size.',
        480,
        445,
        20,
        C.ink,
        'center',
      );
    }
  } else {
    const gap = b === 6 || cue(k, 5, 'Now follow') === 1;
    head(
      c,
      gap ? 'A gap opens on held-out requests' : 'Can the model fit a small clean batch?',
      'Compare losses under the same evaluation conditions',
    );
    const train = gap ? [4.6, 3.4, 2.4, 1.7, 1.1, 0.8] : [4.6, 4.4, 4.5, 4.4, 4.3, 4.3];
    const val = gap ? [4.8, 3.7, 3, 2.9, 3.4, 4.2] : [4.8, 4.6, 4.7, 4.8, 4.6, 4.8];
    const run = gap && b === 5 ? 0.16 : clamp(0.13 + k.progress * 1.7);
    const X = (i) => 114 + i * 118,
      Y = (v) => 411 - v * 44;
    for (const v of [0, 2, 4]) {
      line(c, 96, Y(v), 735, Y(v), C.rule);
      mono(c, v, 82, Y(v), 15, C.muted, 'right');
    }
    for (const [values, col, name] of [
      [train, C.blue, 'train'],
      [val, C.hot, 'validation'],
    ]) {
      for (let i = 0; i < 5; i++) {
        const t = clamp(run * 5 - i);
        if (t)
          line(
            c,
            X(i),
            Y(values[i]),
            mix(X(i), X(i + 1), t),
            mix(Y(values[i]), Y(values[i + 1]), t),
            col,
            3.4,
          );
      }
      if (run === 1) txt(c, name, X(5) + 18, Y(values[5]), 17, col);
    }
    txt(c, 'training step', 399, 450, 18, C.muted, 'center');
  }
}
function validation(c, k) {
  const b = k.beat.beatIndex;
  if (b <= 1) {
    head(
      c,
      'Which requests can guide each decision?',
      'A chronological holdout for future server traffic',
    );
    const blocks = [
      ['train', 'fit weights + preprocessing', '#a9c5cc'],
      ['validation', 'choose the checkpoint', '#b9cda7'],
      ['test', 'estimate final performance', '#eabd92'],
    ];
    let x = 82;
    blocks.forEach(([name, role, color], i) => {
      const w = [336, 214, 219][i];
      box(c, x, 218, w, 97, color);
      txt(c, name, x + w / 2, 258, 27, C.ink, 'center', 'Serif');
      for (let j = 0; j < (i === 0 ? 7 : 4); j++)
        line(c, x + 19 + j * 41, 287, x + 19 + j * 41, 301, C.muted, 2);
      txt(c, role, x + w / 2, 352, 16, C.ink, 'center');
      x += w + 12;
    });
    arrow(c, 82, 399, 873, 399, C.muted);
    txt(c, 'time of request', 480, 436, 18, C.muted, 'center');
    return;
  }
  const zoom = b >= 5,
    values = b >= 9 ? [small[0], small[1], 0.994] : zoom ? small : large,
    patience = zoom ? 2 : 3;
  head(
    c,
    b >= 9
      ? 'Replay the third validation check'
      : zoom
        ? 'Saving and resetting are different tests'
        : 'Which checkpoint survives the stop?',
    zoom
      ? 'Zoomed validation loss    /    min_delta 0.01    /    patience 2'
      : 'Validation loss    /    min_delta 0.0001    /    patience 3',
  );
  let n;
  if (b >= 9) {
    n = 2 + Number(cue(k, 9, 'It still falls short') > 0);
  } else if (zoom) {
    n =
      1 +
      Number(cue(k, 5, 'At the second check') === 1) +
      Number(cue(k, 7, 'Patience is gone') > 0);
  } else {
    n =
      1 +
      Math.floor(3 * cue(k, 2, 'The next three losses', 2.3)) +
      Math.floor(2 * cue(k, 3, 'Two later checks', 1.1)) +
      Number(cue(k, 3, 'The third spends') === 1);
  }
  const state = checkpointTrace(values.slice(0, n), zoom ? 0.01 : 0.0001, patience).at(-1);
  const restored = b >= 9
    ? restoredOn(k, 10, 'three. It set', 'It set a new minimum', 'Take epoch three', 0.475)
    : zoom
      ? restoredOn(k, 8, 'two survives', 'The save rule', 'Epoch two survives', 0.275)
      : restoredOn(k, 4, 'four. Save', 'Save a deep copy', 'Restore epoch four', 0.65);
  const pending = (state.stopped || b >= 9) && !restored;
  const X = (i) => 100 + i * (440 / (values.length - 1));
  const Y = zoom ? (v) => 177 + (1 - v) * 16000 : (v) => 383 - v * 42;
  for (const v of zoom ? [1, 0.995, 0.99] : [1, 2, 3, 4, 5]) {
    line(c, 78, Y(v), 574, Y(v), C.rule);
    mono(c, zoom ? v.toFixed(3) : v, 70, Y(v), 14, C.muted, 'right');
  }
  if (zoom) {
    line(c, 83, Y(0.99), 575, Y(0.99), C.hot, 1.7, [5, 5]);
    txt(c, 'reset below 0.990', 318, Y(0.99) + 25, 16, C.hot, 'center');
  }
  graph(
    c,
    values.slice(0, n).map((v, i) => [X(i), Y(v)]),
    C.muted,
  );
  values.slice(0, n).forEach((v, i) => {
    const selected = !pending && i + 1 === state.bestEpoch;
    dot(c, X(i), Y(v), selected ? 8 : 5, selected ? C.green : C.muted);
    if (zoom) mono(c, v.toFixed(3), X(i), Y(v) - 22, 16, C.muted, 'center');
    mono(c, i + 1, X(i), 384, 16, C.muted, 'center');
  });
  txt(c, 'epoch', 319, 411, 16, C.muted, 'center');
  box(c, 615, 176, 272, 139, C.dark, null, 7);
  txt(
    c,
    pending ? 'Which checkpoint?' : restored ? 'restored weights' : 'saved minimum',
    636,
    204,
    20,
    C.white,
  );
  mono(c, pending ? 'epoch ?' : 'epoch ' + state.bestEpoch, 635, 248, 30, C.mint);
  if (!pending) mono(c, 'loss ' + state.best.toFixed(zoom ? 3 : 2), 636, 289, 19, C.white);
  txt(c, 'Patience used', 617, 354, 17, C.muted);
  for (let i = 0; i < patience; i++)
    box(c, 619 + i * 67, 377, 55, 18, i < state.used ? C.hot : C.light, C.rule, 2);
  if (state.stopped) mono(c, 'stop', 822, 386, 20, C.hot);
}
const classes = ['bug', 'docs', 'security'];
export const classifier = classificationTrace();
const largest = Math.max(...classifier.logits);
export const shiftedLogits = classifier.logits.map((v) => v - largest);
const exponentials = shiftedLogits.map(Math.exp);
const expSum = exponentials.reduce((sum, x) => sum + x, 0);
const docs = classifier.target.indexOf(1);
export const shiftedLoss = Math.log(expSum) - shiftedLogits[docs];
function classification(c, k) {
  const b = k.beat.beatIndex,
    m = classifier;
  if (b === 4) {
    head(c, 'Evaluate cross-entropy in log space', 'Raw logits and the docs label enter the loss');
    const shifted = cue(k, 4, 'The largest becomes zero', 0) === 1;
    const exponentiated = cue(k, 4, 'The three exponentials', 0) === 1;
    ['class', 'raw logit', 'shifted logit', 'exp(shifted)'].forEach((s, i) =>
      txt(c, s, 90 + i * 215, 161, 17, C.muted),
    );
    classes.forEach((s, i) => {
      const y = 224 + 78 * i;
      txt(c, s, 90, y, 23, i === 1 ? C.green : C.ink);
      mono(c, f(m.logits[i], 3), 305, y, 23);
      if (shifted) mono(c, f(shiftedLogits[i], 3), 520, y, 23, C.blue);
      if (exponentiated) mono(c, f(exponentials[i], 2), 741, y, 23, C.green);
    });
    if (cue(k, 4, 'Take the natural log', 0) === 1) {
      const answer = cue(k, 4, 'Shifting all the scores', 0) === 1 ? f(shiftedLoss, 3) : '?';
      mono(c, 'L ≈ ln(' + f(expSum) + ') − (' + f(shiftedLogits[docs], 3) + ') ≈ ' + answer,
        480, 449, 23, C.ink, 'center');
    }
    return;
  }
  const x0 = 492,
    scale = 410,
    grad = cue(k, 2, 'subtract one from three tenths', 1.4);
  const labeled = grad === 1 && cue(k, 2, 'Gradient descent raises', 0) === 1;
  const subtitle = labeled ? 'Logit gradient    /    probability minus target'
    : grad > 0 ? 'Subtracting the target from each probability' : 'One issue    /    softmax probabilities';
  head(c, 'Which class score should rise?', subtitle);
  line(c, x0, 161, x0, 388, C.muted, 2);
  mono(c, '0', x0, 419, 17, C.muted, 'center');
  classes.forEach((s, i) => {
    const y = 198 + i * 78,
      p = m.probabilities[i],
      v = p - grad * m.target[i],
      end = x0 + v * scale;
    txt(c, s, 67, y, 24, i === 1 && b >= 1 ? C.green : C.ink);
    if (i === 1 && b >= 1) txt(c, 'target', 66, y + 26, 16, C.green);
    box(
      c,
      Math.min(x0, end),
      y - 10,
      Math.max(0.2, Math.abs(end - x0)),
      20,
      v < 0 ? C.hot : C.blue,
      null,
      2,
    );
    mono(
      c,
      f(v, 2),
      end + (v < 0 ? -12 : 12),
      y,
      21,
      v < 0 ? C.hot : C.blue,
      v < 0 ? 'right' : 'left',
    );
  });
  if (labeled && cue(k, 2, 'The other classes', 0) === 1)
    txt(
      c,
      'Negative docs gradient → the descent step raises its logit.',
      480,
      457,
      21,
      C.ink,
      'center',
    );
  else if (grad > 0 && !labeled)
    mono(c, 'docs:  ' + f(m.probabilities[docs]) + ' − ' + f(grad, 2) + ' = ' + f(m.probabilities[docs] - grad, 2), 480, 457, 20, C.hot, 'center');
  else if (b === 1) mono(c, 'loss = −log p(docs)', 480, 457, 21, C.green, 'center');
}
export const decisionScenes = [diagnosis, validation, classification];
