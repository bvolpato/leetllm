import {
  ink,
  muted,
  brass,
  blue,
  teal,
  rust,
  paper,
  grid,
  num,
  vector,
  cue,
  text,
  mono,
  line,
  circle,
  arrow,
  title,
  rule,
  socket,
} from './instrument.mjs';
import {
  halfMax,
  sample,
  squarePath,
  inputs16,
  halfStep,
  stored16,
  ln,
  div,
  head,
  mean,
  variance,
  rootMeanSquare,
  normalizationTransfer,
} from './experiments.mjs';

export function precision(c, k) {
  const i = k.beat.beatIndex;
  if (i < 2) {
    const narrow = cue(k, 1, 'Squaring in half precision') > 0,
      wide = cue(k, 2, 'cast before squaring') > 0;
    title(
      c,
      'Which multiplication fits?',
      'Inputs [300, −300]    ·    largest finite FP16 value ' + halfMax.toLocaleString('en-US'),
    );
    for (const [j, show] of [narrow, wide].entries()) {
      const y = 405 + j * 315,
        col = j ? teal : rust;
      text(c, j ? 'Cast first' : 'Square first', 105, y - 74, 48, col, 'left', 'Serif');
      const xx = [248, 657, 1120, 1605];
      const names = j
        ? ['FP16', 'Widen to FP32', 'Square in FP32', 'Mean, then √']
        : ['FP16', 'Square in FP16', 'Widen to FP32', 'Mean, then √'];
      xx.forEach((v, h) => {
        if (h) arrow(c, xx[h - 1] + 133, y, v - 152, y, show ? col : grid, 4);
        socket(c, names[h], v, y, h === 3 ? 330 : h === 0 ? 134 : 268, h === 0 ? ink : show ? col : muted);
      });
      mono(c, '±' + sample, xx[0], y + 101, 44, ink, 'center');
      if (show) {
        const values = squarePath(Boolean(j));
        const value = values.value.toLocaleString('en-US'),
          result = values.rms.toLocaleString('en-US');
        [j ? '±' + sample : value, value, result].forEach((v, h) =>
          mono(c, v, xx[h + 1], y + 101, 48, col, 'center'),
        );
      }
    }
    if (narrow)
      mono(
        c,
        '300² = ' + (sample * sample).toLocaleString('en-US') + ' > ' + halfMax.toLocaleString('en-US'),
        106,
        973,
        36,
        rust,
      );
    return;
  }
  const landed = cue(k, 4, 'All four land') > 0,
    showOutputs = cue(k, 4, 'LayerNorm subtracts') > 0;
  title(
    c,
    'Where do four close readings go?',
    'FP16 storage near 10,000    ·    adjacent representable values differ by ' + halfStep,
  );
  const px = (n) => 980 + (n - 10000) * 80;
  for (const v of [9992, 10000, 10008]) {
    line(c, px(v), 288, px(v), 754, v === 10000 ? teal : grid, v === 10000 ? 4 : 3, [9, 7]);
    mono(c, v.toLocaleString('en-US'), px(v), 250, 37, v === 10000 ? teal : muted, 'center');
  }
  for (const [j, v] of inputs16.entries()) {
    const y = 370 + 105 * j;
    text(c, 'f' + (j + 1), 107, y, 36, muted);
    line(c, 290, y, 1660, y, grid, 2);
    circle(c, px(v), y, 15, paper, brass, 5);
    if (landed) {
      if (v !== stored16[j]) arrow(c, px(v), y, px(stored16[j]), y, teal, 5);
      circle(c, px(stored16[j]), y, 10, teal);
    }
    mono(c, String(v), px(v) + (v < 10000 ? -24 : 25), y - 30, 29, brass, v < 10000 ? 'right' : 'left');
  }
  if (showOutputs) {
    mono(c, 'LN(original)   ' + vector(ln(inputs16), 3), 100, 840, 38, brass);
    mono(c, 'LN(stored)     ' + vector(ln(stored16)), 100, 921, 38, teal);
    if (i === 4) text(c, 'FP32 kernel reference uses the stored row.', 1080, 924, 34, teal);
  } else
    text(
      c,
      landed ? 'All four FP16 values occupy the same tick.' : 'Choose the nearest tick for each brass ring.',
      106,
      904,
      46,
      ink,
      'left',
      'Serif',
    );
}

function headProgress(k, beat, phrase) {
  const index = k.beat.beatIndex + 1;
  if (index !== beat) return Number(index > beat);
  // Animate during the spoken clause and show the settled reading after it.
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart: phrase });
}

export function atHead(c, k) {
  const hasOriginalLogit = headProgress(k, 1, 'On the first vector the port reads two') === 1;
  const hasOriginalRef = headProgress(k, 2, 'The reference reads about minus one point three four') === 1;
  const addingOffset = headProgress(k, 2, 'Add five to every feature and run both again');
  const hasOffsetLogit = headProgress(k, 2, 'The port now reads seven') === 1;
  const hasOffsetRef = headProgress(k, 2, "The reference hasn't moved") === 1;
  const asksForRepair = headProgress(k, 2, 'Which operation belongs between the last addition and this head') > 0;
  const repair = headProgress(k, 3, "Restore the checkpoint's final LayerNorm") === 1;
  const hasMean = headProgress(k, 3, 'Take the mean of each row') === 1;
  const center = headProgress(k, 3, 'Two minus five and seven minus ten both give minus three');
  const hasVariance = headProgress(k, 3, 'Both rows have population variance five') === 1;
  const scale = headProgress(k, 3, 'Divide by the same scale and the two brass marks land at the same value');
  const route = headProgress(k, 3, 'Route that feature to the head');
  const confirmed = headProgress(k, 4, 'Both logits now match the reference') === 1;
  const tryRms = headProgress(k, 5, 'Try the same two inputs with RMSNorm instead') === 1;
  const rmsScale = headProgress(k, 5, 'It divides the positive first features by different uncentered scales');
  const rmsRoute = headProgress(k, 5, 'The scores stay positive and miss both reference values');
  const restored = headProgress(k, 5, 'Put LayerNorm back') === 1;
  const trial = tryRms && !restored;
  const mode = trial ? 'RMSNorm' : repair ? 'LayerNorm' : 'Direct wire';
  const { input, shifted } = normalizationTransfer();
  title(
    c,
    'What reaches the vocabulary head?',
    'Probe head    ·    logit = first feature    ·    unit gains, zero shifts, ε = 0.00001',
  );
  const trackX = 806;
  const trackW = 956;
  const project = rule(c, trackX, 268, trackW, -4, 8, 1);
  text(c, 'First feature on a shared scale', trackX, 223, 34, muted);
  text(c, mode, 106, 271, 49, mode === 'LayerNorm' ? teal : trial ? rust : blue, 'left', 'Serif');
  const offsetCopy = input.map((value, i) => value + (shifted[i] - value) * addingOffset);
  for (const [j, v] of [input, offsetCopy].entries()) {
    if (j === 1 && addingOffset === 0) continue;
    const top = 432 + j * 266;
    const bottom = top + 105;
    const raw = v[0];
    const m = mean(v);
    const divisor = trial ? rootMeanSquare(v) : div(v);
    const result = head(v, mode)[0];
    const reference = ln(v)[0];
    const dividing = trial ? rmsScale : scale;
    const sending = trial ? rmsRoute : route;
    const centering = repair && !trial ? center : 0;
    const scaling = repair ? dividing : 0;
    const working = (raw - m * centering) / (1 + (divisor - 1) * scaling);
    const changingInput = j === 1 && addingOffset < 1;
    const moving = changingInput || (centering > 0 && centering < 1) || (scaling > 0 && scaling < 1);
    const hasLogit = repair ? sending === 1 : j ? hasOffsetLogit : hasOriginalLogit;
    const hasReference = j ? hasOffsetRef : hasOriginalRef;
    let operation = changingInput ? 'Adding offset' : 'Raw feature';
    if (centering > 0) operation = centering < 1 ? 'Centering' : 'Centered';
    if (scaling > 0) operation = scaling < 1 ? 'Dividing' : 'Normalized';

    text(c, j ? 'Offset copy' : 'Original token', 106, top - 33, 40, ink);
    mono(c, vector(v, 1), 106, top + 27, 43, j ? brass : blue);
    let arithmetic = '';
    if (trial && dividing === 1)
      arithmetic = 'RMS ≈ ' + num(divisor, 3);
    else if (centering === 1)
      arithmetic = num(raw) + ' − ' + num(m) + ' = ' + num(raw - m);
    else if (repair && !trial && hasMean) arithmetic = 'Mean = ' + num(m);
    if (arithmetic) mono(c, arithmetic, 106, top + 92, 38, ink);

    for (const y of [top, bottom]) {
      line(c, trackX, y, trackX + trackW, y, grid, 4);
      for (let n = -4; n <= 8; n++) line(c, project(n), y - 7, project(n), y + 7, muted, 2);
    }
    line(c, project(0), top - 12, project(0), bottom + 12, muted, 2, [5, 7]);
    text(c, operation, trackX - 45, top - 33, 36, ink, 'right');
    text(c, 'Head logit', trackX - 45, bottom, 36, ink, 'right');
    if (hasReference) {
      circle(c, project(reference), bottom, 21, paper, teal, 6);
      mono(c, 'Ref ≈ ' + num(reference, 3), project(reference), bottom + 38, 30, teal, 'center');
    }

    const x = project(working);
    const followsRoute = repair && sending > 0;
    if (followsRoute || hasLogit) line(c, x, top + 10, x, bottom - 10, brass, 3, [7, 7]);
    circle(c, x, top, followsRoute ? 8 : 13, followsRoute ? paper : brass, brass, 3);
    if (!moving) {
      const normalized = scaling === 1;
      const label = (normalized ? '≈ ' : '') + num(normalized ? result : working, 3);
      mono(c, label, x, top - 35, 40, brass, 'center');
    }
    if (followsRoute && !hasLogit)
      circle(c, x, top + (bottom - top) * sending, 13, brass, paper, 2);
    if (hasLogit) {
      circle(c, project(result), bottom, 13, brass, ink, 2);
      mono(c, (repair ? '≈ ' : '') + num(result, 3), project(result) + 32, bottom - 28, 38, brass);
    }
  }
  if (k.beat.beatIndex === 1 && asksForRepair)
    text(
      c,
      'Which operation makes both logits hit their reference rings?',
      957,
      940,
      43,
      ink,
      'center',
      'Serif',
    );
  if (repair && !trial && hasVariance && !confirmed)
    mono(
      c,
      'Both rows have variance ' + num(variance(input)) + ' and divisor ≈ ' + num(div(input), 3),
      960,
      940,
      40,
      teal,
      'center',
    );
  if (repair && !trial && confirmed)
    mono(c, 'Matching head inputs  ≈  ' + vector(head(input, mode), 3), 960, 940, 41, teal, 'center');
  if (trial && rmsRoute === 1)
    text(c, 'Both logits stay positive and miss the reference.', 960, 940, 42, brass, 'center', 'Serif');
}
