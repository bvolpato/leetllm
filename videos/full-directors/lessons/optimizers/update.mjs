import {
  ACCUMULATION,
  DECAY,
  COUPLED,
  ZERO_DECAY,
  CPU_LOOP_TRACE,
} from '../../../films/optimizers/fixtures.mjs';
import { scalarAdamWStep } from '../../../films/optimizers/arithmetic.mjs';
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
  poly,
  arrow,
  scaleBar,
  plot,
} from './instrument.mjs';

export function shares(c, window, portion, y = 258, gradient = true) {
  const { targets, gradients, counts } = window;
  const x = 89,
    w = 1022,
    h = 89;
  let left = x;
  for (let i = 0; i < targets.length; i++) {
    const first = i < counts[0],
      col = first ? C.blue : C.copper;
    const share = (first ? portion : 1 - portion) / counts[first ? 0 : 1],
      size = w * share;
    box(c, left + 1, y, size - 2, h, first ? '#d7e3db' : '#ebd5b5', C.steel);
    for (let px = left + 10; px < left + size - 6; px += 18) circle(c, px, y + 9, 2.5, C.paper);
    label(c, 'target ' + targets[i], left + size / 2, y + 42, 21, col, 'center');
    label(
      c,
      gradient ? 'g = ' + f(gradients[i]) : 'item ' + (i + 1),
      left + size / 2,
      y + 73,
      18,
      C.ink,
      'center',
      'Mono',
    );
    left += size;
  }
  const split = x + w * portion;
  line(c, split, y - 19, split, y + h + 18, C.ink, 4);
  poly(
    c,
    [
      [split - 8, y - 22],
      [split + 8, y - 22],
      [split, y - 10],
    ],
    C.ink,
  );
  label(
    c,
    'Batch 1   ·   ' + counts[0] + (counts[0] === 1 ? ' item' : ' items'),
    x,
    y - 37,
    21,
    C.blue,
  );
  label(c, 'Batch 2   ·   ' + counts[1] + ' items', x + w, y - 37, 21, C.copper, 'right');
}
export function accumulation(c, q) {
  const b = q.beat.beatIndex + 1,
    W = ACCUMULATION;
  if (b >= 7) {
    const ops = ['Accumulate', 'Unscale', 'Clip', 'Step', 'Schedule', 'Clear'];
    const finalActions = [
      'Take one optimizer step',
      'advance the per-update schedule if that step ran',
      'clear gradients for the next window',
    ];
    const tick =
      b === 7
        ? Math.round(2 * cue(q, 7, 'Finish all backward passes', 1.3))
        : 2 + finalActions.filter((phrase) => q.elapsed >= q.wordCue(phrase).end).length;
    face(
      c,
      'Count the whole accumulation window',
      'Equal microbatches   ·   four items per backward pass   ·   two processes',
    );
    for (let row = 0; row < 2; row++) {
      label(c, 'Process ' + (row + 1), 78, 209 + row * 96, 21, C.ink);
      for (let batch = 0; batch < 3; batch++) {
        const xx = 265 + batch * 278,
          yy = 168 + row * 96;
        box(c, xx, yy, 238, 58, C.pale, C.steel);
        for (let item = 0; item < 4; item++)
          circle(c, xx + 34 + 55 * item, yy + 30, 13, row ? C.green : C.blue);
      }
    }
    ops.forEach((s, j) => {
      const x = 79 + j * 181;
      box(c, x, 409, 153, 49, j <= tick ? C.case : C.pale);
      label(c, s, x + 76, 441, 18, j <= tick ? C.cream : C.soft, 'center');
    });
    note(
      c,
      '2 processes × 3 backward passes × 4 items = 24 items per optimizer update.',
      'Hold the AMP scale fixed across the window. Advance a per-update schedule when the optimizer step ran.',
    );
    return;
  }
  face(
    c,
    'Which items have the widest share?',
    'Mean squared error   ·   prediction fixed at 1 while gradients accumulate   ·   SGD rate 0.1',
  );
  const fraction =
    mix(1 / 3, 0.5, cue(q, 4, 'Slide the batch divider', 1.6)) +
    (1 / 3 - 0.5) * cue(q, 5, 'Give each item the same width', 1.6);
  head(c, 'Each section carries one item’s share of the loss', 88, 169);
  shares(c, W, fraction, 260, b >= 2);
  const g = W.means[0] * fraction + W.means[1] * (1 - fraction);
  number(
    c,
    b > 2
      ? 'Batch shares   ' + f(fraction, 3) + '  /  ' + f(1 - fraction, 3)
      : 'Full mean   (2 − 2 − 6) / 3',
    89,
    418,
    C.ink,
    23,
  );
  if (b >= 4) {
    const reduced = b === 4 ? cue(q, 4, 'At a rate', 0) : cue(q, 5, 'This time SGD', 0);
    const stepped = b > 5 || q.elapsed >= q.speechDuration;
    number(
      c,
      'g = ' + (reduced ? f(g) : '?') + '      w → ' + (stepped ? f(1 - 0.1 * g) : '?'),
      89,
      486,
      C.blue,
      30,
    );
  }
  note(
    c,
    b === 3
      ? 'What share will a single item get if the divider moves to halfway?'
      : b >= 5
        ? Math.abs(fraction - 1 / 3) < 1e-6
          ? 'Equal item widths recover the full-batch gradient.'
          : 'Move the divider until all three items have the same width.'
        : 'Holding the weight fixed keeps the three derivatives comparable.',
    b === 6
      ? 'Count valid loss-bearing tokens and the actual final window. Batch-dependent forward passes can differ.'
      : 'A one-item batch has mean +2. Its two-item neighbor has mean −4.',
  );
}
export function clip(g, limit) {
  const norm = Math.hypot(...g);
  if (!Number.isFinite(norm)) return { norm, valid: false };
  const factor = norm > limit ? limit / norm : 1;
  return { norm, valid: true, factor, used: g.map((n) => n * factor) };
}
function vector(c, x, y, s, g, col) {
  const dx = g[0] * s,
    dy = -g[1] * s;
  line(c, x, y, x + dx, y, C.steel);
  line(c, x + dx, y, x + dx, y + dy, C.steel);
  arrow(c, x, y, x + dx, y + dy, col, 6);
  circle(c, x, y, 4, C.ink);
}
export function clipping(c, q) {
  const b = q.beat.beatIndex + 1,
    ordinary = clip([3, 4], 5),
    big = clip([300, 400], 5);
  if (b <= 3) {
    const raw = b === 1 ? [3, 4] : [300, 400],
      fold = cue(q, 3, 'Pull the tip back', 1.6);
    face(
      c,
      'Bring the gradient tip to the norm limit',
      'Global L2 norm   ·   one multiplier for both coordinates   ·   limit 5',
    );
    const full = b === 1 ? 45 : 0.58;
    head(
      c,
      b === 1 ? 'Input   ·   1 unit per division' : 'Input   ·   100 units per division',
      85,
      169,
    );
    head(c, 'Detail   ·   1 unit per division', 655, 169);
    for (const [x, s] of [
      [111, b === 1 ? 45 : 58],
      [673, 45],
    ]) {
      for (let i = 0; i < 6; i++) {
        line(c, x + i * s, 464, x + i * s, 187, C.grid);
        line(c, x, 464 - i * s, x + 310, 464 - i * s, C.grid);
      }
      line(c, x, 464, x + 315, 464, C.soft);
      line(c, x, 464, x, 186, C.soft);
    }
    vector(c, 111, 464, full, raw, C.steel);
    if (fold > 0)
      vector(
        c,
        111,
        464,
        full,
        raw.map((v, i) => mix(v, big.used[i], fold)),
        C.blue,
      );
    c.beginPath();
    c.arc(673, 464, 225, -Math.PI / 2, 0);
    c.strokeStyle = C.gold;
    c.lineWidth = 5;
    c.stroke();
    if (b === 1 || fold === 1) vector(c, 673, 464, 45, ordinary.used, C.blue);
    label(c, 'length  ' + Math.hypot(...raw), 111, 508, 20, C.soft);
    label(
      c,
      fold === 1 ? 'g used = (3, 4)' : b === 1 ? 'on the stop' : 'limit = 5',
      673,
      508,
      20,
      C.blue,
    );
    note(
      c,
      b === 1
        ? 'The 3–4–5 arrow already fits.'
        : fold === 0
          ? cue(q, 2, 'one hundredth', 0)
            ? 'Multiply both components by 5 / 500 = 0.01.'
            : 'Length 500. Which single scale factor preserves the direction?'
          : fold < 1
            ? 'Apply the same multiplier to both components.'
            : 'Both components shrink by 5 / 500. The tip reaches (3, 4).',
      'A zero vector also passes through unchanged.',
    );
    return;
  }
  if (b <= 5) {
    face(
      c,
      'Send each input into fresh Adam buffers',
      'Same rate 0.01   ·   β₁ = 0.9, β₂ = 0.999   ·   compare coordinate one',
    );
    [
      [300, C.copper, 'Raw gradient'],
      [big.used[0], C.blue, 'Clipped gradient'],
    ].forEach(([g, col, s], j) => {
      const x = 90 + j * 543,
        r = scalarAdamWStep({ weight: 1, gradient: g, rate: 0.01, decay: 0 });
      head(c, s, x, 169, col);
      number(c, 'g = ' + g, x, 224, col, 33);
      scaleBar(c, x, 300, 450, r.mean / 30, col, 'Stored m = ' + f(r.mean));
      label(c, 'Stored v = ' + f(r.square), x, 375, 22);
      if (cue(q, 4, 'Now watch the update arrows') > 0) {
        scaleBar(c, x, 443, 450, r.dataStep / 0.0101, col);
        label(c, 'Subtracted step ≈ ' + f(r.dataStep), x, 429, 22, col);
      }
    });
    note(
      c,
      cue(q, 4, 'They nearly match', 0)
        ? 'Clipping changes the stored history even when the first displacements nearly match.'
        : 'Compare the moments each input leaves behind.',
      'AdamW applies decay separately to the old weight.',
    );
    return;
  }
  face(
    c,
    'Keep nonfinite gradients out of the buffers',
    'Pre-clipping norm log   ·   limit 5   ·   error_if_nonfinite = True',
  );
  [
    ['Input norm', 'Action', 'Optimizer input', 'Completed'],
    ['5', 'Pass', '(3, 4)', '1'],
    ['500', 'Scale × 0.01', '(3, 4)', '2'],
    ['NaN', 'Raise error', '—', '2'],
  ].forEach((row, j) => {
    const y = 185 + 82 * j;
    line(c, 80, y + 18, 1119, y + 18, C.grid);
    row.forEach((s, i) =>
      label(c, s, [83, 338, 633, 941][i], y, j ? 25 : 19, j === 3 ? C.copper : j ? C.ink : C.soft),
    );
  });
  note(
    c,
    'One of two completed updates needed clipping. The failed attempt leaves the counter at two.',
    'If the clipped fraction stays high, inspect the data, loss scaling and threshold.',
  );
}
export function decay(c, q) {
  const r = DECAY,
    l2 = COUPLED,
    p = cue(q, 1, 'Move the data carriage first', 1.4),
    oldWeight = cue(q, 2, 'Point zero eight times', 0),
    shrinkKnown = cue(q, 2, 'Subtract that from', 0),
    endpoint = cue(q, 2, 'Putting an L2 penalty', 0),
    penalty = cue(q, 2, 'That term enters', 0),
    coupled = q.beat.beatIndex === 1 && q.elapsed >= q.speechDuration;
  const data = r.before[0] + r.dataUpdate[0],
    shrink = -r.shrink[0],
    w = mix(r.before[0], data, p) - endpoint * shrink;
  face(
    c,
    'Two contributions to one AdamW update',
    'Steep coordinate a   ·   prior weight 1   ·   gradient 100   ·   η = 0.08   ·   λ = 0.1',
  );
  rail(c, {
    y: 249,
    lo: 0.9,
    hi: 1,
    from: 1,
    to: w,
    title: 'AdamW   ·   data travel, then separate shrink',
    read: 'w = ' + f(w),
    ticks: [0.9, 0.92, 0.96, 1],
    color: C.blue,
  });
  if (oldWeight) {
    circle(c, 1090, 240, 13, C.paper, C.gold, 3);
    circle(c, 1090, 240, 6, C.paper, C.blue, 2);
    label(c, 'Decay uses this starting weight', 1090, 324, 19, C.blue, 'right');
  }
  rail(c, {
    y: 415,
    lo: 0.9,
    hi: 1,
    from: 1,
    to: l2.next[0],
    p: coupled,
    title: penalty
      ? 'Coupled Adam   ·   100 + 0.1 enters both moments'
      : 'Coupled Adam   ·   same initial weight',
    read: 'w ≈ ' + f(mix(1, l2.next[0], coupled)),
    ticks: [0.9, 0.92, 0.96, 1],
    color: C.copper,
  });
  note(
    c,
    !oldWeight
      ? p === 1
        ? 'Which weight goes into the decay term, 1 or 0.92?'
        : 'Keep the starting ring in view while the data carriage moves.'
      : penalty
        ? 'In the coupled rule, the penalty enters the gradient before normalization.'
        : 'Shrink = 0.08 × 0.1 × ' + f(r.before[0]) + (shrinkKnown ? ' = ' + f(shrink) : ' = ?'),
    endpoint
      ? 'Data endpoint ≈ ' +
          f(data) +
          '    ·    decoupled shrink ' +
          f(shrink) +
          '    ·    AdamW endpoint ≈ ' +
          f(w)
      : shrinkKnown
        ? 'Subtract ' + f(shrink) + ' from the data endpoint ' + f(data) + '.'
        : 'The open ring marks the start. The solid pin tracks the weight.',
  );
}
export function zero(c, q) {
  const b = q.beat.beatIndex + 1,
    cold = ZERO_DECAY.cold,
    other = scalarAdamWStep({ weight: 10, gradient: 0.1, decay: 0 });
  face(
    c,
    b < 5 ? 'Isolate the shrink at weight ten' : 'Which gradient representation runs the update?',
    'Start at 10   ·   zero moments   ·   rate 0.1   ·   decay 0.01',
  );
  rail(c, {
    y: 242,
    lo: 9.89,
    hi: 10,
    from: 10,
    to: cold.weight,
    p: cue(q, 1, 'AdamW subtracts', 1.4),
    title: 'AdamW   ·   explicit zero tensor',
    read: 'm = 0, v = 0',
    ticks: [9.9, 9.95, 10],
    color: C.blue,
  });
  if (b < 5) {
    rail(c, {
      y: 413,
      lo: 9.89,
      hi: 10,
      from: 10,
      to: other.weight,
      p: cue(q, 4, 'adaptive normalization', 1.2),
      title: 'Coupled L2   ·   λw enters the gradient',
      read: b >= 3 ? 'g = 0.1' : 'empty moments',
      ticks: [9.9, 9.95, 10],
      color: C.copper,
    });
  } else {
    rail(c, {
      y: 413,
      lo: 9.89,
      hi: 10,
      from: 10,
      to: ZERO_DECAY.absent.weight,
      title: 'AdamW   ·   grad = None',
      read: 'step count = ' + ZERO_DECAY.absent.count,
      ticks: [9.9, 9.95, 10],
      color: C.soft,
    });
  }
  note(
    c,
    b >= 5
      ? 'The zero tensor finishes at 9.99. The absent gradient skips this parameter at 10.'
      : b === 4 && cue(q, 4, 'adaptive normalization', 1.2) === 1
        ? 'Coupled L2 moves about 0.1. Direct decay moves 0.01.'
        : 'A zero data gradient isolates direct decay when both moments start at zero.',
    b >= 5
      ? 'With retained moments, a zero data gradient can also produce a data step.'
      : 'Penalty gradient = λw when the loss includes ½λw².',
  );
}
export function loop(c, q) {
  const b = q.beat.beatIndex + 1;
  if (b === 3 || b === 4) {
    const n = b === 4 ? 60 : 1 + Math.floor(59 * cue(q, 3, 'Trace the loss', 4)),
      rr = CPU_LOOP_TRACE.slice(0, n),
      last = rr.at(-1);
    face(
      c,
      'Follow the measured CPU run',
      'PyTorch AdamW   ·   sixty updates   ·   cosine peak 0.08   ·   decay 0.01   ·   norm limit 20',
    );
    for (const [j, key, max, col] of [
      [0, 'loss', 45, C.green],
      [1, 'preclipNorm', 105, C.blue],
    ]) {
      const x = 110 + j * 548;
      head(c, j ? 'Norm before clipping' : 'Loss after update', x, 168, col);
      plot(c, {
        x,
        y: 206,
        w: 422,
        h: 208,
        xmax: 59,
        ymin: 0,
        ymax: max,
        ticks: j ? [0, 20, 100] : [0, 20, 40],
        series: [{ values: rr.map((r) => r[key]), color: col }],
        limit: j ? 20 : undefined,
      });
      label(c, 'Updates 1 to 60', x + 209, 464, 19, C.soft, 'center');
    }
    note(
      c,
      'Completed ' +
        n +
        '     ·     w = ' +
        pair(last.after, 5) +
        '     ·     clipped ' +
        rr.filter((r) => r.preclipNorm > 20).length +
        ' times',
      'The separate 80-update NumPy run has a different budget and clipping rule.',
    );
    return;
  }
  if (b <= 2) {
    const scheduler = b === 2;
    const steps = ['Clear', 'Forward', 'Backward', 'Clip', ...(scheduler ? ['Step', 'Schedule'] : ['Set rate', 'Step'])];
    const phases = [
      'Clear old gradients',
      'compute the loss',
      'call backward',
      'Measure and clip',
      'Assign this update',
      'before calling optimizer step',
    ];
    const active = scheduler
      ? (q.elapsed >= q.wordCue('call its step after optimizer step').end ? 5 : 4)
      : Math.max(0, ...phases.map((p, i) => (cue(q, 1, p) > 0.3 ? i : 0)));
    face(
      c,
      'Place the operation before its consumer',
      scheduler
        ? 'One PyTorch optimizer update   ·   built-in scheduler prepares the next rate'
        : 'One PyTorch optimizer update   ·   explicit learning rate',
    );
    steps.forEach((s, j) => {
      const x = 89 + 175 * j;
      box(c, x, 244, 146, 90, j === active ? C.case : C.pale, C.steel);
      circle(c, x + 17, 259, 4, C.gold);
      const color = j === active ? C.cream : C.ink;
      if (s === 'Schedule') {
        label(c, s, x + 73, 286, 20, color, 'center');
        label(c, 'next rate', x + 73, 313, 20, color, 'center');
      } else {
        label(c, s, x + 73, 301, 22, color, 'center');
      }
      if (j < 5) arrow(c, x + 146, 289, x + 173, 289, C.steel, 3);
    });
    head(c, b === 2 ? 'Built-in step scheduler' : 'New gradients', 90, 411);
    number(
      c,
      b === 2
        ? 'optimizer.step()   →   scheduler.step()'
        : 'backward()   →   clip_grad_norm_()   →   step()',
      90,
      468,
      C.blue,
      25,
    );
    note(
      c,
      b === 2
        ? 'Choose per-update or per-epoch cadence. A plateau scheduler reads a validation metric.'
        : 'The clipping helper returns the norm it measured before scaling.',
    );
    return;
  }
  face(
    c,
    'Which AMP attempts advance a per-update schedule?',
    'Mixed precision   ·   finish accumulation before unscaling and measuring',
  );
  const showSkipped = cue(q, 7, 'The completed zero-rate', 0);
  const showCompleted = cue(q, 7, 'because the optimizer ran', 0);
  const showScaler = cue(q, 7, 'update the AMP scaler', 0);
  const rows = [
    ['Attempt', 'Optimizer', 'Adam count', 'Schedule', 'Scaler'],
    ['Nonfinite', 'skipped', 'holds', showSkipped ? 'holds' : '?', showScaler ? 'update' : ''],
    [
      'Finite, η = 0',
      'runs',
      'advances',
      showCompleted ? 'advances' : '?',
      showScaler ? 'update' : '',
    ],
  ];
  rows.slice(0, b >= 6 ? 3 : 2).forEach((r, j) =>
    r.forEach((s, i) => {
      const xx = [83, 329, 559, 790, 991][i],
        yy = 210 + 96 * j;
      label(c, s, xx, yy, j ? 23 : 18, j ? (j === 1 ? C.copper : C.blue) : C.soft);
      line(c, xx, yy + 16, xx + 140, yy + 16, C.grid);
    }),
  );
  note(
    c,
    showScaler
      ? 'Unscale once → measure and clip → attempt step → update scaler.'
      : showCompleted
        ? 'One completed optimizer update earns one schedule tick.'
        : 'Which attempt earns a schedule tick?',
    showScaler
      ? 'Update the scaler once at the end of every completed accumulation window.'
      : 'The parameter can hold for two different reasons. Inspect whether the optimizer ran.',
  );
}
