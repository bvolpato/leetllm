import { C, clamp, mix, smooth } from './drawing.mjs';
import {
  MODULE_SCORES,
  RANK_SCORES,
  moduleRecord,
  rankRecord,
  baseVector,
  changeVector,
  ratio,
  history,
  late,
  sanitized,
  rankFactors,
  scoreToken,
  outputGradient,
  products,
  signedSums,
  signedMeans,
  otherRanks,
  pooledRanks,
  paperScore,
  codeScore,
  fmt,
  A,
  B,
  x,
  hidden,
  retained,
  maskedHidden,
  maskedProduct,
  slicedTerms,
  unscaled,
  scaled,
  rebuilt,
  rebuiltScale,
  scale,
  alpha,
  sum,
} from './examples.mjs';
const vec = (v) => '[' + v.map(fmt).join(', ') + ']';
const rankName = (id) => 'r' + (id + 1);

export function adapters(p) {
  const { b, cue, header, foot, label, mono, line, box, dot } = p;
  if (b === 0) {
    header('Adapter module  /  one observed token', 'How far did the adapter move the output?');
    const origin = [157, 473],
      d = 60;
    line(
      [
        [93, 473],
        [480, 473],
      ],
      C.fine,
    );
    line(
      [
        [157, 500],
        [157, 169],
      ],
      C.fine,
    );
    function vector(v, ink) {
      const xy = [origin[0] + v[0] * d, origin[1] - v[1] * d];
      line([origin, xy], ink, 6);
      dot(...xy, 8, ink);
    }
    vector(baseVector, C.blue);
    mono(vec(baseVector), 369, 226, 23, C.blue);
    const show = cue(0, 'The change');
    if (show) {
      vector(changeVector, C.teal);
      mono(vec(changeVector), 218, 426, 21, C.teal);
    }
    label('Baseline length', 603, 205, 20, C.blue);
    mono('√(3² + 4²) = ' + Math.hypot(...baseVector), 604, 256, 29);
    if (show) {
      label('Change length', 603, 329, 20, C.teal);
      mono('√(' + changeVector.map((v) => fmt(v) + '²').join(' + ') + ') = ' +
        fmt(Math.hypot(...changeVector)), 604, 380, 29);
    }
    if (cue(0, 'The ratio is three tenths'))
      mono(fmt(Math.hypot(...changeVector)) + ' ÷ ' + fmt(Math.hypot(...baseVector)) +
        ' = ' + fmt(ratio(baseVector, changeVector)), 604, 471, 36, C.teal);
    foot('The trainer averages per-token norm ratios over non-padding positions.');
    return;
  }
  if (b === 1) {
    header('Adapter module  /  score history', 'What does a recorded zero mean?');
    label('Observations over training', 72, 195, 23, C.ink, { bold: true });
    const clean = cue(1, 'Keep the invalid count');
    history.forEach((v, i) => {
      const x = 87 + i * 178,
        isLate = i >= 3,
        invalid = !Number.isFinite(v),
        s = invalid ? (clean ? '0' : '∞') : fmt(v);
      p.plate(
        x,
        265,
        136,
        87,
        isLate ? (invalid ? C.peach : C.mint) : C.faint,
        isLate ? (invalid ? C.rust : C.teal) : C.fine,
        s,
        32,
      );
      mono('t' + (i + 1), x + 68, 385, 17, C.dim, 'center');
    });
    line(
      [
        [620, 410],
        [620, 427],
        [1113, 427],
        [1113, 410],
      ],
      C.teal,
      2,
    );
    label('Later half of history', 870, 460, 22, C.teal, { align: 'center' });
    if (clean)
      mono('mean = ' + fmt(sum(sanitized) / late.length) + '     invalid = 1', 74, 477, 24, C.rust);
    foot(
      'The denominator was zero. Inspect the original observation before ranking modules.',
      C.rust,
    );
    return;
  }
  if (b === 2) {
    if (cue(2, 'The paper pools')) {
      header('Rank selection  /  both surviving modules', 'What changes with one pooled cutoff?');
      label('Local M2 example kept r2 and r4 at q = ' + fmt(rankRecord.threshold),
        65, 173, 21, C.dim);
      const revealed = cue(2, 'The pooled median');
      [RANK_SCORES, otherRanks].forEach((scores, k) => {
        const y = 253 + k * 129;
        label('M' + (k + 2), 68, y + 33, 26, C.blue, {bold: true});
        scores.forEach((v, i) => {
          const x = 236 + i * 204;
          const keep = pooledRanks.kept.includes(k * RANK_SCORES.length + i);
          mono('r' + (i + 1), x + 66, y - 19, 17, C.dim, 'center');
          p.plate(x, y, 132, 61, revealed ? (keep ? C.mint : C.faint) : C.white,
            revealed && keep ? C.teal : C.fine, fmt(v), 24);
          if (revealed && keep) label('kept', x + 66, y + 80, 15, C.teal, {align: 'center'});
        });
      });
      foot(revealed ? 'One pooled median = ' + fmt(pooledRanks.threshold) +
        '    •    keep scores above it across both modules.' :
        'Reported method    •    pool ranks across surviving modules    •    example budget 50%');
      return;
    }
    header('Insertion first  /  internal rank second', 'What survives at each scale?');
    const mods = cue(2, 'The first insertion goes'),
      ranks = cue(2, 'Keep the second and fourth directions');
    [
      [MODULE_SCORES, moduleRecord, 'Module', 'M', mods],
      [RANK_SCORES, rankRecord, 'M2 local ranks', 'r', ranks],
    ].forEach(([vs, sel, name, prefix, reveal], k) => {
      const y = 250 + k * 161;
      const visible = k === 0 || cue(2, 'Inside a surviving module');
      if (!visible) return;
      label(name, 63, y + 30, 24, C.ink, { bold: true });
      vs.forEach((v, i) => {
        const ok = sel.kept.includes(i),
          x = 267 + 188 * i;
        mono(prefix + (i + 1), x + 64, y - 25, 19, C.dim, 'center');
        p.plate(
          x,
          y,
          127,
          65,
          reveal ? (ok ? C.mint : C.peach) : C.white,
          reveal ? (ok ? C.teal : C.rust) : C.fine,
          fmt(v),
          25,
        );
      });
      if (reveal) mono('q = ' + fmt(sel.threshold), 63, y + 77, 17, C.dim);
    });
    foot(
      mods ? 'Module cut 33%    •    local demonstration uses a median inside M2' :
        'Module cut 33%    •    keep insertion scores above the cutoff',
    );
    return;
  }
  if (b === 3) {
    const zero = cue(3, 'Set one weight'), taylor = cue(3, 'At first order'),
      example = cue(3, 'For a weight of two'), signedChange = cue(3, 'the estimated loss change');
    if (!cue(3, 'Now score the whole rank')) {
      header('One rank  /  first-order loss estimate', 'What happens to the loss when a weight goes to zero?');
      const {weight, gradient} = rankFactors[0][0];
      if (zero) mono('Δw = 0 − w = −w', 72, 179, 23, C.blue);
      if (taylor) mono('ΔL ≈ (−w) × ∂L/∂w', 554, 179, 23, C.teal);
      if (example) {
        label('One weight', 73, 228, 18, C.dim);
        mono('w = ' + weight + '     ∂L/∂w = ' + gradient, 230, 228, 20);
        if (signedChange) mono('ΔL ≈ ' + fmt(-weight) + ' × ' + gradient + ' = ' +
          fmt(-weight * gradient), 696, 228, 22, C.rust);
      }
      label('Weight in the A row', 74, 324, 23, C.dim);
      label('Weight after deletion', 555, 324, 23, C.dim);
      p.plate(74, 371, 125, 66, C.ice, C.blue, example ? weight : 'w', 29);
      line([[201, 404], [545, 404]], C.fine, 3);
      p.plate(555, 371, 125, 66, zero ? C.peach : C.white, zero ? C.rust : C.fine,
        zero ? '0' : '?', 29);
      foot('Rank scoring estimates how much the task loss responds to deleting weights.');
      return;
    }
    header('One token  /  one LoRA rank', 'Why do the two rules give different rank scores?');
    mono('Scale = 1      Input = ' + vec(scoreToken) + '      Output gradient = ' +
      vec(outputGradient), 76, 172, 21, C.dim);
    const showSums = cue(3, 'Both signed sums'), showMeans = cue(3, 'Each mean is one');
    ['Stored A row', 'Matching B column'].forEach((name, i) => {
      const x = 76 + i * 557;
      label(name + '  ·  weight × gradient', x, 234, 22, C.blue, { bold: true });
      rankFactors[i].forEach(({weight, gradient}, j) => {
        const left = x + j * 120, value = products[i][j];
        mono(fmt(weight) + ' × ' + fmt(gradient), left + 50, 280, 19, C.dim, 'center');
        p.plate(left, 305, 100, 52, C.ice, C.blue, (value > 0 ? '+' : '') + fmt(value), 26);
      });
      if (showSums) mono('sum = ' + fmt(signedSums[i]), x + 254, 306, 23, C.teal);
      if (showMeans) mono('mean = ' + fmt(signedMeans[i]), x + 254, 344, 23, C.teal);
    });
    if (cue(3, 'The paper adds')) {
      label('Paper', 76, 413, 23, C.blue, { bold: true });
      mono(products.flat().map(Math.abs).join(' + ') +
        (cue(3, 'sum to fourteen') ? ' = ' + paperScore : ''), 364, 413, 30);
    }
    if (cue(3, 'The pinned trainer')) {
      label('Pinned trainer', 76, 492, 23, C.teal, { bold: true });
      const means = products.map(([a, b]) => '|(' + a + ' − ' + Math.abs(b) + ')/2|');
      mono(means.join(' + ') +
        (cue(3, 'The trainer score is two') ? ' = ' + codeScore : ''), 364, 492, 28);
    }
    foot(cue(3, 'Scaling either factor')
      ? 'Scaling either factor scales this rank’s contribution by the same amount.'
      : 'Each tile shows one weight times its task-loss gradient.');
    return;
  }
  rankReplay(p);
}

function updateLengths(p, savedProgress, rebuiltProgress) {
  const { label, mono, line, box } = p;
  const left = 229, width = 410, bound = Math.max(...rebuilt);
  const locate = (value) => left + width * value / bound;
  label('Update components on one scale', 64, 398, 23, C.ink, { bold: true });
  for (const [i, value] of scaled.entries()) {
    const y = 442 + i * 53;
    label('Component ' + (i + 1), 64, y, 19, C.dim);
    line([[left, y], [left + width, y]], C.fine, 3);
    if (savedProgress > 0) {
      const edge = locate(value * savedProgress);
      box(left, y - 7, edge - left, 14, C.teal, null, 3);
      if (savedProgress === 1) mono(fmt(value), edge, y - 19, 17, C.teal, 'center');
    }
    if (rebuiltProgress > 0) {
      const edge = locate(value + (rebuilt[i] - value) * rebuiltProgress);
      box(locate(value), y - 7, edge - locate(value), 14, C.rust, null, 3);
      if (rebuiltProgress === 1) mono(fmt(rebuilt[i]), edge, y - 19, 17, C.rust, 'center');
    }
  }
}
function rankReplay(p) {
  const { b, clock, cue, header, foot, label, mono, line, box } = p;
  const after = (beat, phrase) =>
    b > beat || (b === beat && clock.elapsed + 1e-9 >= clock.wordCue(phrase).end);
  const compare = b === 4;
  const compact = cue(5, 'Keep those columns', 2);
  const fade = smooth(clamp(2 * compact));
  const slide = smooth(clamp(2 * compact - 1));
  const activationsReady = after(4, 'produce eight and nine');
  const termProgress = compare ? cue(4, 'Multiply those activations', 2) : 1;
  const termsShown = termProgress === 0 ? 0 : termProgress < 0.55 ? 1 : retained.length;
  const unscaledReady = after(4, 'The unscaled update is fifty-two, thirty-five');
  const masking = after(4, 'zeroing the removed activations');
  const match = after(4, 'Both components must match');
  header(
    'Local M2 example  /  paired rank slice  /  PyTorch weight orientation',
    compare
      ? 'Does the sliced product match the masked product?'
      : 'What multiplier belongs on reload?',
  );
  const aX = 108, bX = 382, top = 263, divider = 700;
  label(
    compact === 1 ? 'Sliced A  ·  ' + retained.length + ' × ' + A[0].length : 'Stored A rows',
    64, 177, 21, C.teal, { bold: true },
  );
  mono('x = ' + vec(x), 64, 213, 19, C.dim);
  label(
    compact === 1 ? 'Sliced B  ·  ' + B.length + ' × ' + retained.length : 'Matching B columns',
    bX, 177, 21, C.teal, { bold: true },
  );
  if (activationsReady)
    label(masking && compact < 1 ? 'Masked A x' : 'A x', 269, 240, 18, C.dim);
  A.forEach((row, id) => {
    const slot = retained.indexOf(id);
    const keep = slot >= 0;
    if (!keep && fade === 1) return;
    const position = keep ? mix(id, slot, slide) : id;
    const y = top + position * 61;
    const col = bX + position * 74;
    const active = compare && !unscaledReady && keep && slot === termsShown - 1;
    const fill = keep ? C.mint : C.faint;
    const ink = keep ? C.teal : C.dim;
    p.ctx.save();
    p.ctx.globalAlpha = keep ? 1 : 1 - fade;
    mono(rankName(id), 63, y + 22, 18, ink);
    if (active) {
      box(aX - 5, y - 4, row.length * 47 + 8, 52, null, C.teal, 4);
      box(col - 5, top - 4, 67, B.length * 53 + 6, null, C.teal, 4);
    }
    row.forEach((v, j) => {
      box(aX + j * 47, y, 45, 44, fill);
      mono(fmt(v), aX + 22 + j * 47, y + 22, 21, C.ink, 'center');
    });
    if (activationsReady) {
      const muted = masking && !keep;
      if (muted) box(269, y + 5, 73, 34, C.peach, null, 4);
      mono('→ ' + fmt(masking ? maskedHidden[id] : hidden[id]), 279, y + 22, 20, muted ? C.rust : ink);
    }
    mono(rankName(id), col + 29, top - 23, 18, ink, 'center');
    B.forEach((row, j) => {
      box(col, top + 53 * j, 57, 51, fill);
      mono(fmt(row[id]), col + 29, top + 25 + 53 * j, 24, C.ink, 'center');
    });
    p.ctx.restore();
  });
  const workX = 732, outputX = 957, resultY = 327;
  line([[divider, 169], [divider, 520]], C.fine);
  line([[workX, 302], [1136, 302]], C.fine);
  if (unscaledReady) {
    label('Unscaled update', workX, resultY, 22, C.teal, { bold: true });
    mono(vec(unscaled), outputX, resultY, 27, C.teal);
  }
  if (compare) {
    label('Sliced product', workX, 177, 23, C.ink, { bold: true });
    retained.slice(0, termsShown).forEach((id, i) => {
      const y = 226 + i * 46;
      const column = B.map((row) => row[id]);
      mono(rankName(id), workX, y, 19, C.teal);
      mono(fmt(hidden[id]) + ' × ' + vec(column) + ' = ' + vec(slicedTerms[i]), 778, y, 22);
    });
    if (masking) {
      line([[workX, 367], [1136, 367]], C.fine);
      label('Full-width product', workX, 395, 22, C.ink, { bold: true });
      mono('B × ' + vec(maskedHidden), workX, 438, 23);
      if (match) {
        label('Masked update', workX, 491, 22, C.teal, { bold: true });
        mono(vec(maskedProduct), outputX, 491, 27, C.teal);
      }
    }
    foot(
      masking
        ? 'The full-width product keeps every B column. The removed activations are zero.'
        : 'Each activation multiplies the B column with the same rank ID.',
      C.teal,
    );
    return;
  }
  label('Saved configuration', workX, 177, 23, C.ink, { bold: true });
  mono('α = ' + alpha, workX, 223, 23);
  mono('Original rank  ' + A.length, workX, 270, 21);
  mono('Sliced rank  ' + retained.length, outputX, 270, 21);
  if (after(6, 'Keep the original scale of four')) {
    label('Saved scale', workX, 381, 21, C.teal);
    mono(alpha + ' ÷ ' + A.length + ' = ' + scale, outputX, 381, 22, C.teal);
  }
  const savedPhrase = 'The update is two hundred eight, one hundred forty';
  const doublePhrase = 'would double both components';
  if (after(6, savedPhrase)) {
    label('Saved update', workX, 420, 21, C.teal);
    mono(vec(scaled), outputX, 420, 26, C.teal);
  }
  if (after(6, doublePhrase)) {
    label('Rebuilt scale', workX, 467, 21, C.rust);
    mono(alpha + ' ÷ ' + retained.length + ' = ' + rebuiltScale, outputX, 467, 22, C.rust);
    label('Rebuilt update', workX, 505, 21, C.rust);
    mono(vec(rebuilt), outputX, 505, 26, C.rust);
  }
  const travel = (phrase) =>
    after(6, phrase) ? smooth(clamp((clock.elapsed - clock.wordCue(phrase).end) / 0.65)) : 0;
  if (compact === 1) updateLengths(p, travel(savedPhrase), travel(doublePhrase));
  mono('Fixed token and paired directions: ' + retained.map(rankName).join(', '),
    64, 533, 18, C.teal);
}
