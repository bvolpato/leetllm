import { COLD, RUNS, SCHEDULED, PRESCRIBED } from '../../../films/optimizers/fixtures.mjs';
import { scalarAdamWStep, SETTINGS } from '../../../films/optimizers/arithmetic.mjs';
import {
  C,
  f,
  cue,
  mix,
  head,
  face,
  label,
  number,
  note,
  rail,
  line,
  box,
  scaleBar,
  plot,
} from './instrument.mjs';

export function buffers(c, q) {
  const b = q.beat.beatIndex + 1;
  const count =
    b === 1
      ? Number(cue(q, 1, 'Store a weighted gradient') > 0.4)
      : b === 2
        ? 1
        : Math.floor(3 * cue(q, 3, 'take three steps', 2.5));
  const r = COLD.records[count - 1],
    corrected = b === 3 || cue(q, 2, 'Divide the signed buffer') > 0.5;
  face(
    c,
    'How much history has entered the average?',
    'Steep coordinate a = 1   ·   gradient 100   ·   two zero-initialized moments',
  );
  [0, 1].forEach((j) => {
    const x = 91 + j * 550,
      col = j ? C.green : C.blue,
      beta = j ? 0.999 : 0.9;
    head(c, j ? 'Square register   v' : 'Signed register   m', x, 174, col);
    const raw = r ? (j ? r.square[0] : r.mean[0]) : 0,
      mass = 1 - beta ** count;
    number(c, 'raw  ' + f(raw), x, 242, col, 32);
    label(c, 'Weight on observed gradients', x, 297, 19);
    scaleBar(c, x, 316, 440, mass, col);
    number(c, '1 − ' + beta + '^' + count + ' = ' + f(mass, 6), x, 380, C.ink, 24);
    if (corrected && count) number(c, 'corrected  ' + f(raw / mass), x, 470, col, 28);
  });
  note(
    c,
    'Updates completed   ' +
      count +
      '     ·     ' +
      (b === 3 ? 'rate 0, weights (1, 1)' : 'both registers start from zero'),
    corrected
      ? 'Divide each raw moment by its own observed weight.'
      : 'm ← 0.9m + 0.1g      ·      v ← 0.999v + 0.001g²',
  );
}
export function displacement(c, q) {
  const r = RUNS.adam.records[0],
    p = cue(q, 2, 'Multiply both ratios', 1.2),
    den = cue(q, 2, 'Take the square root');
  face(
    c,
    'Give each coordinate its own divisor',
    'Cold Adam step   ·   learning rate 0.08   ·   corrected estimates   ·   ε = 1e-8',
  );
  [0, 1].forEach((j) => {
    const y = 190 + j * 185,
      col = j ? C.green : C.blue;
    head(c, j ? 'Shallow coordinate b' : 'Steep coordinate a', 82, y, col);
    number(
      c,
      den
        ? 'ratio   ' + f(r.correctedMean[j]) + ' / (' + f(r.scale[j]) + ' + ε)'
        : 'm̂ = ' + f(r.correctedMean[j]) + '     v̂ = ' + f(r.correctedSquare[j]),
      490,
      y,
      C.ink,
      22,
    );
    rail(c, {
      x: 100,
      w: 990,
      y: y + 96,
      lo: 0.89,
      hi: 1.01,
      from: 1,
      to: r.next[j],
      p,
      color: col,
      ticks: [0.9, 0.95, 1],
      read: 'w = ' + f(mix(1, r.next[j], p)),
    });
  });
  note(
    c,
    p === 0
      ? 'Which carriage travels farther on the first update?'
      : p < 1
        ? 'Multiply each normalized ratio by 0.08.'
        : 'Both arrive near 0.92. The larger numerator met a larger divisor.',
    'Adam subtracts η × m̂ / (√v̂ + ε). Tiny gradients make ε matter.',
  );
}
const repeatedGradient = 4;
export const firstMomentStep = scalarAdamWStep({
  weight: 1,
  gradient: repeatedGradient,
  rate: 0.01,
  decay: 0,
});
export const rawMomentStep =
  (0.01 * firstMomentStep.mean) / (Math.sqrt(firstMomentStep.square) + SETTINGS.epsilon);
export function history(c, q) {
  const b = q.beat.beatIndex + 1;
  if (b === 8) {
    face(
      c,
      'Replay just the first observation',
      'One gradient g = 4   ·   both buffers start at zero   ·   rate 0.01   ·   ε = 1e-8',
    );
    [SETTINGS.beta1, SETTINGS.beta2].forEach((beta, j) => {
      const y = 165 + 104 * j,
        col = j ? C.green : C.blue;
      const raw = j ? firstMomentStep.square : firstMomentStep.mean;
      head(c, (j ? 'Square   v = ' : 'Signed   m = ') + f(raw), 90, y, col);
      scaleBar(c, 420, y - 20, 418, 1 - beta, col);
      const mark = 420 + 418 * (1 - beta);
      line(c, mark, y - 25, mark, y + 7, col, 2);
      number(c, 'mass ' + f(1 - beta), 1108, y, col, 23, 'right');
      label(c, (j ? '0.001 × 4²' : '0.1 × 4') + ' from input 1', 90, y + 36, 18, C.soft);
    });
    if (cue(q, 8, 'Without correction', 0)) {
      number(c, 'Raw     0.01 × 0.4 / (√0.016 + ε)', 90, 386, C.copper, 23);
      if (cue(q, 8, 'With correction', 0))
        number(c, '≈ ' + f(rawMomentStep, 5), 1108, 386, C.copper, 25, 'right');
    }
    if (cue(q, 8, 'With correction', 0)) {
      number(c, 'Corrected     0.01 × 4 / (√16 + ε)', 90, 471, C.green, 23);
      if (cue(q, 8, 'The correction accounts', 0))
        number(c, '≈ ' + f(firstMomentStep.dataStep, 5), 1108, 471, C.green, 25, 'right');
    }
    note(
      c,
      'The first input carries a different weight in each buffer.',
      cue(q, 8, 'With correction', 0)
        ? 'm / 0.1 = 4      ·      v / 0.001 = 16'
        : 'One full strip represents one unit of weight.',
    );
    return;
  }
  if (b >= 6) {
    const n = b === 6 ? 1 + Number(cue(q, 6, 'After two updates') > 0.5) : 3;
    face(
      c,
      'Weigh the observations that actually arrived',
      'Repeated gradient g = 4   ·   signed memory β = 0.9   ·   rate 0.01',
    );
    head(c, 'One unit of possible weight', 90, 180);
    let x = 92;
    const colors = [C.green, C.blue, C.copper];
    box(c, x, 218, 990, 88, C.pale, C.steel);
    for (let i = 0; i < n; i++) {
      const w = 990 * 0.1 * 0.9 ** (n - 1 - i);
      box(c, x, 218, w, 88, colors[i]);
      label(c, 'g' + (i + 1), x + w / 2, 270, 21, C.cream, 'center');
      x += w;
    }
    label(c, 'zero-start share', x + (1082 - x) / 2, 269, 22, C.soft, 'center');
    number(c, 'observed weight = ' + f(1 - 0.9 ** n), 90, 375, C.ink);
    note(
      c,
      'After t steps the observations carry 1 − β^t of the total weight.',
      'Division corrects the zero start. Older observations still fade gradually.',
    );
    return;
  }
  if (b === 5) {
    face(c, 'A constant gradient still has a square', 'Three observations of g = 4');
    head(c, 'Observation', 89, 176);
    head(c, 'Squared deviation from mean 4', 376, 176, C.blue);
    head(c, 'Squared gradient', 860, 176, C.green);
    for (let i = 0; i < 3; ++i) {
      const y = 259 + 95 * i;
      number(c, 'g = 4', 89, y);
      number(c, '(4 − 4)² = 0', 376, y, C.blue);
      number(c, '4² = 16', 860, y, C.green);
    }
    note(
      c,
      'Adam stores an average of the squared gradients.',
      'This constant sequence has zero variance and mean square 16.',
    );
    return;
  }
  const second = cue(q, 2, 'minus eighty', 0),
    r = PRESCRIBED[b >= 4 ? 3 : second ? 1 : 0],
    fourth = b >= 4;
  face(
    c,
    fourth
      ? 'Compare two four-gradient histories'
      : second
        ? 'A negative slope enters two optimizers'
        : 'Initialize the two memories with +100',
    fourth
      ? 'Start with empty moments   ·   signed memory 0.9   ·   square memory 0.999   ·   rate 0.01   ·   ε = 1e-8'
      : 'Prescribed gradients for a   +100, −80, +70, −60   ·   learning rate 0.01',
  );
  if (b === 1 || b === 2) {
    head(c, 'Signed memory', 90, 183, C.blue);
    head(c, 'Squared memory', 657, 183, C.green);
    const loaded = cue(q, 1, 'After the first hundred', 0);
    const m = second && !cue(q, 2, 'leaves one', 0) ? r.oldMean[0] : loaded * r.mean[0],
      v =
        second && !cue(q, 2, 'sixteen point three nine', 0) ? r.oldSquare[0] : loaded * r.square[0];
    number(c, 'g   ' + f(r.gradient[0]), 90, 247, C.ink);
    number(c, 'g²   ' + f(r.gradient[0] ** 2), 657, 247, C.ink);
    scaleBar(c, 90, 316, 445, m / 10, C.blue, 'm ← 0.9m + 0.1g');
    scaleBar(c, 657, 316, 445, v / 20, C.green, 'v ← 0.999v + 0.001g²');
    number(c, 'm = ' + f(m), 90, 433, C.blue, 38);
    number(c, 'v = ' + f(v), 657, 433, C.green, 38);
  } else if (b === 3) {
    const rmsTravel = cue(q, 3, 'RMSProp moves right', 1.3),
      adamTravel = cue(q, 3, 'Adam moves', 1.3);
    [
      [r.rmsUpdate[0], 'RMSProp', C.copper],
      [r.adamUpdate[0], 'Adam', C.blue],
    ].forEach(([v, name, col], j) => {
      rail(c, {
        y: 249 + 167 * j,
        lo: -0.005,
        hi: 0.024,
        from: 0,
        to: -v,
        p: j ? adamTravel : rmsTravel,
        title: name + ' displacement',
        read: (j ? adamTravel : rmsTravel) ? f(-v * (j ? adamTravel : rmsTravel), 5) : '?',
        color: col,
        ticks: [0, 0.01, 0.02],
      });
    });
  } else {
    const ready = [cue(q, 4, 'For b, the inputs', 0), cue(q, 4, 'Divide the two step sizes', 0)];
    [0, 1].forEach((j) => {
      const col = j ? C.green : C.blue;
      const inputs = PRESCRIBED.map(
        ({ gradient }) => (gradient[j] > 0 ? '+' : '') + f(gradient[j]),
      );
      const y = 247 + j * 166;
      rail(c, {
        y,
        lo: 0,
        hi: 0.011,
        from: 0,
        to: r.adamUpdate[j],
        p: ready[j],
        title: (j ? 'b' : 'a') + '     ' + inputs.join('   '),
        read: ready[j] ? 'subtract  ' + f(r.adamUpdate[j], 5) : 'subtract  ?',
        color: col,
        ticks: [0, 0.005, 0.01],
      });
      if (cue(q, 4, j ? 'All four reinforce' : 'Divide the corrected average', 0)) {
        label(
          c,
          'Corrected mean ≈ ' +
            f(r.correctedMean[j], 5) +
            '      Root of corrected square ≈ ' +
            f(Math.sqrt(r.correctedSquare[j]), 5),
          90,
          y + 74,
          19,
          col,
        );
      }
    });
  }
  note(
    c,
    b === 1
      ? 'One gradient fills two different kinds of memory.'
      : b === 2
        ? cue(q, 2, 'Which way', 0)
          ? 'The signed buffer is still positive. Which way will Adam move?'
          : 'Update the signed memory with g and the square memory with g².'
        : b === 3
          ? cue(q, 3, 'Adam moves', 1.3) === 1
            ? 'The negative slope sends RMSProp right. The positive signed average sends Adam left.'
            : 'Use the same zero for both parameter moves.'
          : cue(q, 4, 'The two rulers', 0)
            ? 'The step for b is about ' +
              f(r.adamUpdate[1] / r.adamUpdate[0], 1) +
              ' times the step for a.'
            : cue(q, 4, 'Divide the two step sizes', 0)
              ? 'How many times larger is the subtraction on the lower ruler?'
              : 'Compare the four inputs to each signed average.',
    fourth
      ? 'Adam subtracts 0.01 × m̂ / (√v̂ + ε).'
      : 'RMSProp uses g in the numerator. Adam uses m̂.',
  );
}
export function scale(c, q) {
  const b = q.beat.beatIndex + 1;
  if (b <= 2) {
    face(
      c,
      'Change the scale of every gradient',
      'Each of three items contributes gradient 2   ·   compare the mean with the sum',
    );
    const k = b === 1 ? 1 : 3;
    head(c, 'Mean loss', 90, 178, C.blue);
    head(c, 'Summed loss', 660, 178, C.copper);
    [1, 3].forEach((v, j) => {
      const x = 90 + 570 * j,
        col = j ? C.copper : C.blue;
      number(c, 'g = ' + f(2 * v), x, 243, col, 35);
      scaleBar(c, x, 297, 420, v / 3, col, 'SGD distance at a fixed rate');
      if (k === 3) {
        number(c, 'm̂ = ' + 2 * v, x, 393, col, 25);
        number(c, '√v̂ = ' + 2 * v, x, 440, col, 25);
        label(c, 'Adam ratio = 1   (ε = 0)', x, 493, 22, C.ink);
      }
    });
    note(
      c,
      b === 1
        ? 'The SGD subtraction triples when the three gradients are summed.'
        : 'A fixed positive scale cancels from Adam’s ratio with ε = 0.',
      'For cancellation, apply the same scale to the entire history and use a nonzero divisor.',
    );
    return;
  }
  if (b <= 4) {
    const eps = 1e-8,
      g = b === 4 ? 1e-10 : mix(1, eps, cue(q, 3, 'When the gradient equals epsilon', 0.85));
    const share = g / (g + eps);
    face(
      c,
      'When the gradient approaches epsilon',
      'First corrected Adam step   ·   rate 0.01   ·   ε = 1e-8',
    );
    number(c, 'g = ' + g.toExponential(1), 90, 211, C.blue, 37);
    label(c, 'Fraction of the rate spent on this update', 90, 281, 25);
    scaleBar(c, 90, 312, 1000, share, C.blue);
    number(c, f(share * 100, 2) + ' %', 90, 424, C.blue, 45);
    note(
      c,
      'Update = 0.01 × g / (|g| + ε)',
      'Compare the gradient magnitude with the fixed epsilon in its divisor.',
    );
    return;
  }
  const starts = [100, 1000].map((g) => 0.9 * (0.1 * g)),
    travel = [cue(q, 5, 'Add minus eighty', 1.4), cue(q, 6, 'The same minus eighty', 1.4)],
    ready = [cue(q, 5, 'kept nine', 0), cue(q, 6, 'ninety', 0)];
  face(
    c,
    'Change the scale halfway through',
    'Same second gradient −800   ·   compare the old signed buffers before adding −80',
  );
  starts.forEach((start, j) => {
    const end = start + 0.1 * -800;
    rail(c, {
      y: j ? 420 : 253,
      lo: -90,
      hi: 100,
      from: ready[j] ? start : undefined,
      to: end,
      p: travel[j],
      color: j ? C.blue : C.copper,
      ticks: [-80, 0, 80],
      title:
        'First gradient +' + (j ? 1000 : 100) + (ready[j] ? '   ·   retained +' + f(start) : ''),
      read: ready[j]
        ? (travel[j] === 1 ? 'm = ' : 'pin = ') + f(mix(start, end, travel[j]))
        : 'retained  ?',
    });
  });
  note(
    c,
    !ready[1]
      ? 'Where does the lower subtraction start?'
      : travel[1] === 1
        ? 'Opposite buffer signs produce opposite parameter moves.'
        : 'Add the same −80 to the retained portion.',
    'The first gradient enters with weight 0.1. The second step retains 0.9 of that buffer.',
  );
}
export function comparison(c, q) {
  const n = Math.floor(40 * cue(q, 2, 'Advance each run', 5));
  face(
    c,
    'Spend forty gradient evaluations per recipe',
    'Identical objective and starting point   ·   each run measures its next gradient at its own position',
  );
  Object.entries(RUNS).forEach(([kind, run], j) => {
    const y = 173 + j * 115,
      col = [C.blue, C.copper, C.green][j],
      r = run.records[n - 1],
      p = run.points[n];
    head(c, kind === 'momentum' ? 'EMA momentum' : kind.toUpperCase(), 83, y, col);
    label(c, 'η = ' + run.records[0].eta, 83, y + 36, 19, C.soft);
    plot(c, {
      x: 342,
      y: y - 18,
      w: 388,
      h: 65,
      xmax: 40,
      ymin: -0.4,
      ymax: 1.1,
      series: [{ values: run.points.slice(0, n + 1).map((p) => p.y), color: col }],
      labels: false,
    });
    number(c, 'a ' + f(p.x, 4) + '     b ' + f(p.y, 4), 770, y, col, 21);
    label(c, 'loss  ' + f(r ? r.loss : 50.5, 4), 770, y + 37, 20);
  });
  note(
    c,
    n === 0
      ? 'Which shallow coordinate will finish closest to zero?'
      : 'Shallow-error histories after ' + n + ' updates.',
    'Each trace follows b. Read both errors and the loss before comparing recipes.',
  );
}
export function schedule(c, q) {
  const b = q.beat.beatIndex + 1;
  if (b === 4) {
    const count = Math.floor(5 * cue(q, 4, 'Compare the last five updates', 3));
    face(
      c,
      'Inspect the last five displacements',
      'Same Adam settings and 40-update budget   ·   only the rate schedule differs',
    );
    [SCHEDULED, RUNS.adam].forEach((run, j) => {
      const x = 90 + j * 548,
        col = j ? C.blue : C.copper,
        rr = run.records.slice(35, 35 + count);
      head(c, j ? 'Constant rate 0.08' : 'Warmup and cosine', x, 170, col);
      for (let i = 0; i < 5; i++) {
        const yy = 220 + 43 * i;
        label(c, '#' + (36 + i), x, yy + 15, 17, C.soft, 'left', 'Mono');
        scaleBar(c, x + 55, yy, 235, rr[i] ? Math.abs(rr[i].update[0]) / 0.02 : 0, col);
        if (rr[i]) number(c, f(Math.abs(rr[i].update[0]), 5), x + 314, yy + 18, col, 19);
      }
      if (count === 5) number(c, 'L = ' + f(run.records.at(-1).loss, 5), x, 488, col, 28);
    });
    note(
      c,
      'Steep-coordinate travel per update   ·   one full bar = 0.02 units.',
      count === 5
        ? 'The decayed run moves less late and finishes with the larger loss on this valley.'
        : 'Read displacement at the same update number in both columns.',
    );
    return;
  }
  const n =
    b === 1
      ? Number(cue(q, 1, 'The first update uses zero rate') > 0.5)
      : b === 2
        ? 1 + Math.floor(4 * cue(q, 2, 'next four updates', 3))
        : 5 + Math.floor(35 * cue(q, 3, 'Continue the same run', 5));
  const records = SCHEDULED.records.slice(0, n),
    r = records.at(-1);
  face(
    c,
    'The schedule drives the multiplier',
    'Adam   ·   budget of 40 updates   ·   warmup to 0.08, then cosine decay to zero',
  );
  head(c, 'Rate used', 93, 159);
  plot(c, {
    x: 117,
    y: 185,
    w: 550,
    h: 231,
    xmax: 39,
    ymin: 0,
    ymax: 0.087,
    ticks: [0, 0.04, 0.08],
    xticks: [0, 4, 20, 39],
    series: [{ values: records.map((v) => v.eta), color: C.copper }],
  });
  label(c, 'Zero-based update index', 389, 484, 19, C.soft, 'center');
  head(c, 'Steep-coordinate state', 733, 165);
  number(c, 'updates   ' + n, 733, 222, C.ink, 26);
  number(c, 'a       ' + f(r ? r.next[0] : 1, 5), 733, 276, C.blue, 26);
  number(c, 'm       ' + f(r?.mean[0] ?? 0), 733, 330, C.blue, 26);
  number(c, 'v       ' + f(r?.square[0] ?? 0), 733, 384, C.green, 26);

  note(
    c,
    n === 1
      ? 'At rate zero, the weight holds while m, v and the counter advance.'
      : 'The rate controls travel on each update.',
    'The first and last rates are zero. The moment updates still run.',
  );
}
