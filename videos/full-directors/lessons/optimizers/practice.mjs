import {
  CPU_RESUME_TRACE as RESUME,
  DIAGNOSTIC_RUNS,
  HELD_OUT_TRIALS,
  EIGHTY,
  FRESH_RECIPE as W,
} from '../../../films/optimizers/fixtures.mjs';
import { optimizerFirstStep, loss } from '../../../films/optimizers/arithmetic.mjs';
import {
  C,
  f,
  pair,
  cue,
  mix,
  face,
  head,
  label,
  number,
  note,
  rail,
  line,
  box,
  circle,
  pin,
  poly,
  arrow,
  scaleBar,
  plot,
} from './instrument.mjs';
import { shares } from './update.mjs';

export function resume(c, q) {
  const b = q.beat.beatIndex + 1;
  if (b >= 4) {
    face(
      c,
      'Pack the checkpoint for its next batch',
      'The deterministic fixture needs weights, optimizer state, and StepLR state.',
    );
    const rows =
      b === 4
        ? [
            ['Data cursor', 'Next batch and sampler position'],
            ['Random generators', 'Draw the same random numbers'],
            ['GradScaler', 'Continue the same mixed-precision scale'],
            ['Update count', 'Resume the same training and schedule position'],
          ]
        : [
            ['Hidden 2D weights', 'Muon matrix update and its optimizer state'],
            ['Biases and embeddings', 'AdamW moments and step counts'],
            ['Parameter groups', 'Rebuild the same membership and order'],
            ['Scheduler', 'Restore the matching rate and schedule position'],
          ];
    rows.forEach(([a, s], j) => {
      const y = 154 + 89 * j;
      box(c, 83, y, 281, 54, j % 2 ? C.case : C.blue);
      label(c, a, 98, y + 34, 20, C.cream);
      arrow(c, 373, y + 28, 422, y + 28, C.steel, 3);
      label(c, s, 438, y + 35, 22);
    });
    note(
      c,
      b === 4
        ? 'For shuffled data, save enough state to reproduce the next gradient.'
        : 'Each optimizer needs the state belonging to its own parameter groups.',
    );
    return;
  }
  const n = Math.floor(3 * cue(q, 2, 'Advance the original', 2.7));
  face(
    c,
    'Fork the run at update three',
    'Deterministic CPU valley   ·   AdamW + StepLR   ·   identical weights at the fork',
  );
  const series = ['weightsOnly', 'original', 'complete'].map((key, i) => ({
    values: [RESUME.checkpointWeights[0], ...RESUME[key].slice(0, n).map((r) => r.weights[0])],
    color: [C.copper, C.blue, C.green][i],
    width: i === 1 ? 7 : 2.5,
    dash: i === 2 ? [6, 5] : [],
  }));
  plot(c, {
    x: 115,
    y: 190,
    w: 598,
    h: 251,
    xmax: 3,
    ymin: 0.945,
    ymax: 0.98,
    ticks: [0.95, 0.96, 0.97, 0.98],
    xticks: [0, 1, 2, 3],
    series,
  });
  label(c, 'New updates since save', 407, 502, 19, C.soft, 'center');
  head(c, 'Weight a', 781, 174);
  for (const [j, k, s, col] of [
    [0, 'original', 'Original', C.blue],
    [1, 'complete', 'Complete restore', C.green],
    [2, 'weightsOnly', 'Weights only', C.copper],
  ]) {
    label(c, s, 781, 222 + 95 * j, 21, col);
    number(
      c,
      f(n ? RESUME[k][n - 1].weights[0] : RESUME.checkpointWeights[0], 6),
      781,
      257 + 95 * j,
      col,
      25,
    );
    label(
      c,
      't = ' + (n ? RESUME[k][n - 1].step : k === 'weightsOnly' ? 0 : RESUME.checkpointCount),
      976,
      257 + 95 * j,
      20,
      col,
    );
  }
  note(
    c,
    n === 3
      ? 'The complete restore retraces the original. The fresh histories diverge.'
      : 'Deep-copy weights, both moments, the Adam count and the scheduler state.',
    b === 1
      ? 'Saved Adam counter 3    ·    current rate 0.005'
      : 'Build matching groups and scheduler first. In this fixture load scheduler state, then optimizer state.',
  );
}
export const momentBytes = (params, buffers = 2, bytes = 4) => params * buffers * bytes;
function module(c, x, y, w, h, chips, title) {
  box(c, x + 3, y + 4, w, h, '#c7bda4');
  box(c, x, y, w, h, '#315b52', C.caseDark);
  for (let i = 0; i < Math.floor((w - 30) / 11); i++)
    box(c, x + 13 + i * 11, y + h - 1, 7, 8, C.gold);
  label(c, title, x + 12, y + 28, 18, C.cream);
  chips.forEach((s, i) => {
    const xx = x + 13 + (i * (w - 23)) / 2;
    box(c, xx, y + 40, (w - 37) / 2, h - 50, s === 'm' ? C.blue : C.ink, C.pale);
    label(c, s, xx + (w - 37) / 4, y + h - 21, 19, C.cream, 'center', 'Mono');
  });
}
export function memory(c, q) {
  const b = q.beat.beatIndex + 1;
  face(
    c,
    b === 3
      ? 'Shard the two moment arrays'
      : b === 4
        ? 'Allocate slots only for trained weights'
        : 'Count the physical moment slots',
    'Float32   ·   4 bytes per value   ·   decimal gigabytes',
  );
  if (b <= 2) {
    [
      ['SGD', []],
      ['Momentum', ['m']],
      ['RMSProp', ['s']],
      ['AdamW', ['m', 'v']],
    ].forEach(([s, ch], j) => {
      const filled =
        j === 0 ||
        b === 2 ||
        cue(q, 1, ['Plain SGD', 'EMA momentum stores', 'basic RMSProp', 'AdamW two'][j]) > 0.45;
      const x = 80 + 267 * j;
      module(c, x, 193, 239, 118, filled ? ch : [], s);
      number(c, filled ? momentBytes(1, ch.length) + ' B' : '?', x + 119, 376, C.ink, 27, 'center');
    });
    if (b === 2) {
      const p = cue(q, 2, 'fifty-six billion bytes');
      number(
        c,
        '7 billion × 2 × 4 B = ' + (p > 0.7 ? momentBytes(7e9) / 1e9 + ' GB' : '?'),
        88,
        478,
        C.blue,
        32,
      );
    }
  } else if (b === 3) {
    head(c, 'One quarter of each array goes to each device', 83, 171);
    for (let i = 0; i < 4; i++) {
      const x = 80 + 267 * i;
      module(c, x, 225, 239, 126, ['m', 'v'], 'Device ' + (i + 1));
      label(c, '7 GB  +  7 GB', x + 118, 408, 21, C.ink, 'center');
    }
    number(c, 'Per device   ' + momentBytes(7e9) / 4e9 + ' GB', 82, 492, C.blue, 28);
  } else {
    for (let i = 0; i < 4; i++) {
      const x = 80 + 267 * i;
      module(c, x, 204, 239, 125, i < 2 ? ['m', 'v'] : [], 'Weight ' + (i + 1));
      label(
        c,
        i < 2 ? 'receives gradient' : 'frozen',
        x + 118,
        383,
        20,
        i < 2 ? C.blue : C.soft,
        'center',
      );
    }
    number(c, '2 trained weights × 2 slots × 4 B = ' + momentBytes(2) + ' B', 82, 476, C.blue, 25);
  }
  note(
    c,
    'This count covers the moment buffers.',
    'Budget separately for weights, gradients, live activations and any master copies.',
  );
}
export const squares = (() => {
  let s = 0,
    max = 0;
  return [4, 0, 3].map((g) => {
    s = 0.5 * s + 0.5 * g * g;
    max = Math.max(s, max);
    return { g, s, max };
  });
})();
export function budget(c, q) {
  const b = q.beat.beatIndex + 1;
  if (b >= 5) {
    const n = b === 5 ? 1 + Number(cue(q, 5, 'A zero gradient') > 0.5) : 3;
    face(
      c,
      'Watch a large square fade from memory',
      'Supplied gradients 4, 0, 3   ·   decay coefficient for this squared average = 0.5',
    );
    head(c, 'Square buffer', 88, 170, C.blue);
    plot(c, {
      x: 125,
      y: 199,
      w: 585,
      h: 225,
      xmax: 3,
      ymin: 0,
      ymax: 9,
      ticks: [0, 4, 8],
      xticks: [0, 1, 2, 3],
      series: [
        { values: [0, ...squares.slice(0, n).map((r) => r.s)], color: C.blue, dots: true },
        ...(b >= 6
          ? [
              {
                values: [0, ...squares.slice(0, n).map((r) => r.max)],
                color: C.copper,
                dash: [9, 5],
                dots: true,
              },
            ]
          : []),
      ],
    });
    head(c, 'Gradient ' + f(squares[n - 1].g), 795, 217);
    number(c, 'v = ' + f(squares[n - 1].s), 795, 292, C.blue, 33);
    if (b >= 6) number(c, 'max = ' + squares[n - 1].max, 795, 375, C.copper, 33);
    note(
      c,
      b === 5
        ? 'Each new square replaces half of the old buffer.'
        : 'AMSGrad retains the largest squared buffer seen so far.',
      'The original Adam update can fail to converge on some convex problems.',
    );
    return;
  }
  const n = Math.floor(80 * cue(q, 1, 'Follow the error bars', 5));
  // The error bars fit a shorter panel, leaving room for the three-line AdamW caption.
  const panelInset = 20;
  face(
    c,
    'Read both coordinates at update eighty',
    'Same starting errors and cosine budget   ·   different peak rates   ·   compare complete recipes',
    panelInset,
  );
  Object.entries(EIGHTY).forEach(([name, run], j) => {
    const x = 94 + j * 547,
      col = j ? C.green : C.blue,
      v = run.points[n];
    head(c, j ? 'AdamW   ·   peak 0.08' : 'SGD   ·   peak 0.018', x, 166, col);
    label(c, j ? 'Separate decay 0.01' : 'No weight decay', x, 204, 20);
    [
      [v.x, '|a|'],
      [v.y, '|b|'],
    ].forEach(([v, s], i) => {
      scaleBar(c, x, 280 + i * 93, 436, Math.abs(v), col, s + '   ' + f(Math.abs(v), 5));
    });
    number(c, 'L = ' + f(loss([v.x, v.y]), 6), x, 487, col, 24);
  });
  c.translate(0, -panelInset / 2);
  note(
    c,
    'Completed updates   ' + n + ' / 80',
    b >= 3
      ? 'The full track is the initial error magnitude of one. AdamW’s two remaining bars nearly coincide in length.'
      : 'Both methods evaluate the gradient at their own current point.',
  );
}
export function diagnostics(c, q) {
  const b = q.beat.beatIndex + 1;
  if (b <= 4) {
    const n =
      b === 1
        ? Math.floor(5 * cue(q, 1, 'Watch the higher', 3))
        : b === 2
          ? Math.floor(8 * cue(q, 2, 'Halve just the peak', 4))
          : 8 + Math.floor(4 * cue(q, 3, 'Follow the traces', 2.2));
    const r = DIAGNOSTIC_RUNS;
    face(
      c,
      'Freeze the budget before reading the winner',
      'Matched Adam warmup trials   ·   same start and data   ·   peak 0.8 versus 0.4',
    );
    const ss = [[r.high, C.copper], ...(b >= 2 ? [[r.lower, C.blue]] : [])].map(([r, col]) => ({
      values: [50.5, ...r.records.slice(0, n).map((v) => v.loss)],
      color: col,
      dots: true,
    }));
    plot(c, {
      x: 111,
      y: 176,
      w: 639,
      h: 274,
      xmax: 12,
      ymin: 0,
      ymax: 60,
      ticks: [0, 20, 40, 60],
      xticks: [0, 4, 8, 12],
      series: ss,
    });
    head(c, 'Update ' + n, 810, 185);
    [r.high, ...(b >= 2 ? [r.lower] : [])].forEach((run, j) => {
      const rec = run.records[n - 1],
        col = j ? C.blue : C.copper;
      label(c, 'Peak ' + (j ? '0.4' : '0.8'), 812, 235 + j * 108, 20, col);
      number(c, 'L ' + f(rec?.loss ?? 50.5, 3), 812, 274 + j * 108, col, 25);
    });
    const last = r.high.records[n - 1];
    note(
      c,
      n < 8
        ? 'At the first peak, inspect the rate and pre-update gradient norm.'
        : n === 8
          ? 'The lower peak is ahead at eight. Predict the ordering four updates later.'
          : n === 12 && cue(q, 3, 'Lowering the peak', 0)
            ? 'At twelve, the higher peak has the lower training loss.'
            : 'Read both losses at update ' + n + '.',
      last
        ? 'Higher-peak run at update ' +
            n +
            '   ·   η = ' +
            f(last.eta) +
            '   ·   ‖g‖ = ' +
            f(Math.hypot(...last.gradient), 3)
        : 'The trace starts at loss 50.5.',
    );
    return;
  }
  if (b <= 6) {
    const held = cue(q, 5, 'Now uncover', 1.3);
    face(
      c,
      'Select the recipe for unseen examples',
      'Two supplied trials   ·   fixed split   ·   40 updates each   ·   lower loss wins',
    );
    HELD_OUT_TRIALS.forEach((r, j) => {
      const x = 88 + j * 549,
        col = j ? C.copper : C.blue;
      head(c, r.name + '   ·   η = ' + r.rate, x, 171, col);
      scaleBar(c, x, 267, 445, r.train / 0.4, col, 'Training loss   ' + f(r.train));
      if (held > 0) {
        c.save();
        c.globalAlpha = held;
        scaleBar(
          c,
          x,
          393,
          445,
          r.held / 0.4,
          C.green,
          'Held-out loss   ' + (held === 1 ? f(r.held) : '…'),
        );
        c.restore();
      } else {
        box(c, x, 393, 445, 22, C.pale);
        label(c, 'Held-out loss   ?', x, 384, 19, C.soft);
      }
    });
    note(
      c,
      held === 1
        ? 'SGD wins on held-out loss, 0.28 versus 0.35, at this budget.'
        : 'AdamW has the lower training loss. Which score should decide?',
      'Keep the data split fixed when testing a decay sweep. Check for leakage if validation worsens.',
    );
    return;
  }
  const rows =
    b === 7
      ? [
          ['Nonfinite batch', 'Batch values, norm and AMP scale'],
          ['One group stalls', 'Per-group gradient and update norms'],
        ]
      : [
          ['Clipping almost every time', 'Distribution of pre-clipping norms'],
          ['Run exceeds memory', 'Moment bytes and activation peak'],
        ];
  face(
    c,
    'Choose the next measurement',
    'A trace supplies a symptom. Change one mechanism and replay the same data slice.',
  );
  rows.forEach(([s, v], i) => {
    const y = 238 + 155 * i;
    head(c, s, 90, y, C.copper);
    arrow(c, 494, y - 9, 585, y - 9, C.steel, 3);
    head(c, v, 619, y, C.blue);
    line(c, 89, y + 30, 1100, y + 30, C.grid);
  });
  note(c, 'Measure the quantity that can distinguish the candidate causes.');
}
export const TRANSFER = ['sgd', 'momentum', 'adam'].map((s) => optimizerFirstStep(s, [-0.5, 0.5]));
export function transfer(c, q) {
  const b = q.beat.beatIndex + 1;
  const travel = cue(q, 3, 'Release the three carriages', 1.4);
  const built = ['For plain descent', 'For momentum', 'For Adam'].map((phrase) =>
    cue(q, 2, phrase, 0),
  );
  const solved = [
    'giving nine tenths to the right',
    'giving nine hundredths',
    'The displacement is about eight hundredths to the right',
  ].map((phrase) =>
    b === 2 ? q.elapsed >= q.wordCue(phrase).end : b > 2,
  );
  const [sgd, momentum, adam] = TRANSFER;
  const operations = [
    '−' + sgd.eta + ' × (' + f(sgd.gradient[0]) + ')',
    cue(q, 2, 'Multiply minus point zero one eight by minus five', 0)
      ? '−' + momentum.eta + ' × (' + f(momentum.mean[0]) + ')'
      : 'm = 0.1 × (' + f(momentum.gradient[0]) + ')',
    cue(q, 2, 'Multiply minus point zero eight', 0)
      ? '−' +
        adam.eta +
        ' × (' +
        f(adam.correctedMean[0]) +
        ') / (√' +
        f(adam.correctedSquare[0]) +
        ' + ε)'
      : 'm̂ = ' + f(adam.correctedMean[0]) + '     v̂ = ' + f(adam.correctedSquare[0]),
  ];
  face(
    c,
    'Which carriage crosses from the negative side?',
    'Start (−0.5, +0.5)   ·   gradient (−50, +0.5)   ·   reset every buffer',
  );
  TRANSFER.forEach((r, j) => {
    let read = 'a = ' + f(r.before[0]);
    if (built[j])
      read = operations[j] + (solved[j] ? (j === 2 ? ' ≈ +' : ' = +') + f(r.update[0], 3) : '');
    if (travel > 0)
      read =
        travel === 1
          ? '(a, b) = ' + pair(r.next, 4)
          : 'a = ' + f(mix(r.before[0], r.next[0], travel));
    rail(c, {
      y: 211 + 121 * j,
      lo: -0.55,
      hi: 0.5,
      from: r.before[0],
      to: r.next[0],
      p: travel,
      title: ['SGD', 'EMA momentum', 'Adam'][j] + '   ·   η = ' + r.eta,
      read,
      color: [C.blue, C.copper, C.green][j],
      ticks: [-0.5, 0, 0.5],
    });
  });
  note(
    c,
    b === 1
      ? 'Predict the crossing before reading the displacements.'
      : b === 2
        ? built[2]
          ? 'Divide the corrected signed moment by the root of the corrected square plus ε.'
          : built[1]
            ? cue(q, 2, 'giving nine hundredths', 0)
              ? 'The fresh momentum buffer takes 0.1 × (−50) = −5.'
              : 'The empty momentum buffer takes one tenth of the gradient.'
            : 'Each calculation gives the distance and direction from −0.5.'
        : travel === 1
          ? 'All three move right. Only SGD passes zero.'
          : 'Read each moving tip against the zero mark.',
  );
}
function replay(c, q) {
  const replayBeat = q.beat.id === 'c23-b09';
  const untilSpoken = (operation, result) => {
    if (!replayBeat) return 1;
    const duration = q.wordCue(result).end - q.wordCue(operation).start;
    return q.reveal(operation, duration, { captionStart: result });
  };
  const fold = untilSpoken('Now apply the same limit to both', 'Both stop at minus three');
  const merge = fold === 1 ? cue(q, 9, 'Follow either run from there', 1.1) : 0;
  const startKnown = !replayBeat || q.elapsed >= q.wordCue('with empty moments').end;
  const settings = !replayBeat || q.elapsed >= q.wordCue('same decay').end;
  const travel = untilSpoken('Feed the shared input through AdamW', 'two point zero four eight');
  const saved = travel === 1;
  const inspect = cue(q, 10, 'Compare the marks upstream of the stop', 0);
  const log =
    q.beat.beatIndex >= 10 ||
    (q.beat.beatIndex === 9 && q.elapsed >= q.wordCue('Log the counts and the gradient before clipping').end);

  face(
    c,
    'Replay both reductions',
    'Same five items   ·   same scalar clip limit   ·   same AdamW settings',
  );
  const gradientX = (g) => 110 + (g + 4.25) * 300;
  const stop = gradientX(W.clipped);
  const junctionY = 320;
  const itemShares = W.counts.map((count) => count + '/' + W.targets.length).join(' and ');
  const denominator = W.counts[1];
  const meanOfBatchMeans = f(W.wrong * denominator) + '/' + denominator;
  box(c, stop - 3, 173, 6, 273, C.gold);
  label(c, 'Clip stop  ' + f(W.clipped), stop, 157, 24, C.ink, 'center');
  for (const [y, input, clippedInput, title, batchShares, col, read] of [
    [226, W.weighted, W.clipped, 'Weight by item', itemShares, C.blue, f(W.weighted)],
    [414, W.wrong, W.wrongClipped, 'Weight by batch', '1/2 and 1/2', C.copper, meanOfBatchMeans],
  ]) {
    head(c, title, 90, y - 32, col);
    label(c, batchShares, stop - 24, y - 32, 23, col, 'right', 'Mono');
    line(c, 90, y, stop, y, C.steel, 4);
    const start = gradientX(input);
    if (fold > 0) {
      const tip = gradientX(mix(input, clippedInput, fold));
      line(c, start, y, tip, y, col, 4);
      if (tip - start > 18) pin(c, tip, y, col, 8);
    }
    if (inspect) circle(c, start, y, 15, C.paper, C.gold, 2);
    circle(c, start, y, 9, C.paper, col, 3);
    number(c, read, start, y + 43, col, 30, 'center');
  }

  if (merge > 0) {
    const joining = Math.min(1, 2 * merge);
    const exit = Math.max(0, 2 * merge - 1);
    for (const [y, col] of [[226, C.blue], [414, C.copper]]) {
      line(c, stop, y, stop, mix(y, junctionY, joining), col, 5);
    }
    if (joining === 1) {
      pin(c, stop, junctionY, C.green, 9);
      arrow(c, stop + 13, junctionY, mix(stop + 13, 672, exit), junctionY, C.green, 5);
      label(c, 'Shared input', 568, 355, 21, C.green, 'center');
      number(c, f(W.clipped), 568, 389, C.green, 27, 'center');
    }
  }
  if (merge === 1) {
    head(c, 'Same AdamW step', 704, 219, C.green);
    if (startKnown) {
      label(c, 'Start at ' + W.start + ' · empty moments', 704, 266, 23);
      if (settings) label(c, 'η = ' + W.rate + '   λ = ' + W.decay + '   ε = ' + W.epsilon, 704, 301, 22);
      rail(c, {
        x: 718,
        y: 396,
        w: 366,
        lo: W.start - 0.005,
        hi: W.dataEndpoint + 0.005,
        from: W.start,
        to: W.update.weight,
        p: travel,
        color: C.green,
        ticks: saved ? [W.start, W.update.weight] : [W.start],
        title: 'Weight',
      });
      if (saved) number(c, 'Saved ' + f(W.update.weight, 4), 1084, 490, C.green, 35, 'right');
    }
  }
  note(
    c,
    saved
      ? 'The same clipped gradient and the same starting state give the same weight.'
      : fold === 1
        ? 'Both histories now have the same input to AdamW.'
        : 'The open marks show the gradients before clipping.',
    log ? 'Log the item counts and the gradient before clipping.' : '',
  );
}
export function finalPractice(c, q) {
  const b = q.beat.beatIndex + 1;
  if (b <= 3) {
    const half = cue(q, 3, 'Each batch mean gets', 0) && !cue(q, 3, 'Follow the item mean', 0);
    face(
      c,
      half ? 'Average the two batch means' : 'Recover the gradient of the five-item mean',
      'Squared error   ·   scalar prediction 2   ·   two microbatches   ·   one update',
    );
    const itemShare = W.counts[0] / W.targets.length;
    const answer = cue(q, 3, 'Each item has one fifth', 0);
    const alternative = cue(q, 3, 'Keep that alternative', 0);
    shares(c, W, half ? 0.5 : itemShare, 248, b >= 2);
    if (b === 3) {
      head(
        c,
        half ? 'Half the strip for each batch' : 'One fifth of the strip for each item',
        89,
        157,
      );
    }
    const statistic = half ? 'Mean' : 'Sum';
    head(c, statistic + ' of the first pair', 89, 404, C.blue);
    head(c, statistic + ' of the other three', 665, 404, C.copper);
    number(
      c,
      b === 1 ? '2 × (2 − target)' : half ? '(+2 − 2) / 2 = 0' : '+2 − 2 = 0',
      89,
      462,
      C.blue,
    );
    number(
      c,
      b === 1 ? 'Which way does it pull?' : half ? '(−4 − 8 − 8) / 3 = −20/3' : '−4 − 8 − 8 = −20',
      665,
      462,
      C.copper,
      26,
    );
    note(
      c,
      half
        ? 'Equal batch weights     (0 + (−20/3)) / 2 = ' + (alternative ? '−10/3' : '?')
        : answer
          ? 'Across all five items     (0 − 20) / 5 = ' + f(W.weighted)
          : b === 1
            ? 'Compare the target values with the prediction of 2.'
            : 'Two batches, five items. Which denominator belongs to the objective?',
      half
        ? 'The two items on the left now share one half. The other three share the other half.'
        : 'Each target keeps its own derivative. The prediction stays fixed until the optimizer step.',
    );
    return;
  }
  if (b >= 9) {
    replay(c, q);
    return;
  }
  const spoken = (beat, phrase) => Number(b === beat ? q.elapsed >= q.wordCue(phrase).end : b > beat);
  const momentsKnown = spoken(6, 'The corrected moments are minus three and nine'),
    ratioKnown = spoken(6, 'you get minus one'),
    data = spoken(6, 'two point zero five'),
    shrinkKnown = spoken(7, 'The shrink is two thousandths'),
    decay = spoken(7, 'The final parameter is two point zero four eight');
  const end = mix(W.start, W.dataEndpoint, data) - decay * W.update.shrink;
  face(
    c,
    b <= 5
      ? 'Where will the new weight land?'
      : decay === 1
        ? 'Account for the last two thousandths'
        : 'Rebuild the weight from both contributions',
    'Weight 2   ·   accumulated gradient −4   ·   clip at 3   ·   η = 0.05   ·   λ = 0.02   ·   ε = 0',
  );
  if (b <= 5) {
    const clipped = cue(q, 4, 'Start the moments', 0.6);
    rail(c, {
      y: 264,
      lo: -5,
      hi: 0,
      from: W.weighted,
      to: W.clipped,
      p: clipped,
      title: clipped === 1 ? 'Input delivered to both moments' : 'Clip the accumulated gradient',
      read: 'Cold buffers',
      ticks: [-5, -4, -3, -2, -1, 0],
    });
    head(c, 'Correct the moments, take the data step, then shrink from 2.', 91, 396);
    number(c, 'Final weight    ?', 91, 475, C.blue, 36);
  } else {
    head(
      c,
      momentsKnown ? 'Corrected moments   m̂ = −3,  v̂ = 9' : 'Cold AdamW   ·   input −3',
      89,
      175,
      C.blue,
    );
    if (ratioKnown) label(c, 'm̂ / √v̂ = −1', 1090, 175, 23, C.blue, 'right');
    rail(c, {
      y: 278,
      lo: 1.995,
      hi: 2.055,
      from: 2,
      to: end,
      title: 'Position after each contribution',
      read: 'w = ' + f(end, 4),
      ticks: [2, 2.025, 2.05],
      color: C.blue,
    });
    label(c, 'Data move', 89, 393, 20, C.soft);
    number(c, data === 1 ? '+0.05' : '?', 89, 448, C.blue, 32);
    label(c, 'Shrink from the prior weight', 572, 393, 20, C.soft);
    number(
      c,
      shrinkKnown ? '−' + f(W.update.shrink) : data ? '0.05 × 0.02 × 2' : '?',
      572,
      448,
      C.copper,
      30,
    );
  }
  note(
    c,
    b === 8
      ? 'A colleague saved exactly 2.048. Which log entry tells you how they weighted the batches?'
      : b >= 7
        ? 'Both contributions belong to one optimizer update.'
        : 'Carry each input through its own part of the update.',
    b === 8
      ? 'Rewind to the point where the two histories could still be distinguished.'
      : 'The signed data update and decay use different inputs.',
  );
}
