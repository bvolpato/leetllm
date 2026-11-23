import * as M from './model.mjs';
import {
  P,
  traceColors,
  mark,
  fill,
  box,
  line,
  mono,
  label,
  serif,
  opacity,
  clip,
  corner,
  page,
  footer,
  caption,
  cue,
  resolved,
  viewport,
  plot,
  tileGrid,
  arrow,
} from './art.mjs';
const fmt = M.format;
export function opening(c, k) {
  const b = k.beat.beatIndex,
    covering = b === 2 ? cue(k, 2, 'Cover the legend again', 1) : 0,
    hiddenAgain = covering === 1,
    open = cue(k, 1, 'Slide the cover', 1.35) * (1 - covering),
    hasRead = resolved(k, 2, 'Checkout'),
    answer = hasRead && covering === 0;
  page(c, 'Which service slowed after three?', 'Dashboard export   /   image + text');
  viewport(c, 80, 260, 1.15, () =>
    plot(c, { open, highlight: cue(k, 0, 'Follow its markers', 2), answer, readout: hasRead }),
  );
  mono(c, 'POSSIBLE SERVICES', 1320, 379, 27, P.teal);
  ['Search', 'Checkout', 'Login'].forEach((name, i) => {
    const y = 482 + i * 93,
      chosen = answer && i === M.riseIndex;
    if (chosen) box(c, 1306, y - 33, 495, 67, '#d8e6d6');
    label(c, name, 1394, y, 41, chosen ? P.teal : P.ink);
    if (chosen) mark(c, 1, 1354, y, 11, P.teal);
    else line(c, 1338, y, 1369, y, P.rule, 2);
  });
  if (b === 3)
    footer(
      c,
      'Pixels → visual features → connector → language model',
      'The fusion strategy determines where the reader can use the evidence.',
    );
  else if (covering > 0)
    footer(
      c,
      'The green trace still rises from 5.2 to 9.0 ms.',
      hiddenAgain ? 'With the legend covered, the image no longer identifies the service.' : '',
    );
  else if (answer)
    footer(
      c,
      M.names[M.riseIndex] +
        ' rose from ' +
        M.readings[0] +
        ' to ' +
        M.readings[1].toFixed(1) +
        ' ms.',
      'Read the time axis, the trace and its own legend together.',
    );
  else
    footer(
      c,
      b === 0
        ? 'The three candidates share one plot.'
        : 'Match the marker on the rising trace to the marker beside a name.',
    );
}
export function patches(c, k) {
  const b = k.beat.beatIndex,
    large = resolved(k, 2, 'three hundred thirty-six pixels'),
    px = large ? 336 : 224,
    n = M.side(px);
  const shown = large ? resolved(k, 3, 'Twenty-four squared') : resolved(k, 1, 'Sixteen across');
  page(c, 'How many positions come from the pixels?', 'Vision encoder   /   decoded square view');
  const x = 145,
    y = 256,
    w = 565,
    cell = w / n;
  box(c, x, y, w, w, P.panel, null, 0);
  clip(c, x, y, w, w, () => {
    viewport(c, x, y + (w - w * 0.48) / 2, w / 1000, () => plot(c));
  });
  const grid = cue(k, 0, 'Lay a grid', 1.2);
  opacity(c, grid, () => {
    for (let i = 0; i <= n; i++) {
      line(c, x + i * cell, y, x + i * cell, y + w, '#93a8b4', 1.6);
      line(c, x, y + i * cell, x + w, y + i * cell, '#93a8b4', 1.6);
    }
  });
  corner(c, x + 8 * cell, y + 5 * cell, cell, cell, P.gold, 7, 3);
  mono(c, px + ' px', x + w / 2, y - 32, 29, P.muted, 'center');
  caption(c, 'Decoded input', px + ' × ' + px + ' pixels', 850, 294);
  caption(c, 'Patch footprint', '14 × 14 pixels', 850, 465);
  line(c, 850, 588, 1760, 588, P.rule, 2);
  mono(c, 'PATCH POSITIONS  ·  NO CLASS TOKEN', 850, 642, 26, P.teal);
  serif(c, shown ? n + ' × ' + n + ' = ' + M.patchCount(px) : 'Across × down = ?', 850, 735, 73);
  footer(
    c,
    b === 3
      ? 'Count positions after resize, crop and frame selection.'
      : 'Each cell contributes one position to the encoder.',
    b === 3
      ? 'Compressed upload bytes and the decoded pixel grid have separate limits.'
      : 'Position information preserves each patch’s place in this view.',
  );
}
export function connector(c, k) {
  const b = k.beat.beatIndex;
  if (b >= 3) {
    page(c, 'Does a per-view limit bound a whole clip?', 'Query bridge   /   ten-frame clip');
    mono(c, '3 VIEWS PER FRAME', 108, 292);
    const done = resolved(k, 4, 'Nine hundred sixty');
    for (let j = 0; j < 10; j++) {
      const x = 114 + j * 170;
      for (let v = 0; v < 3; v++) {
        const y = 420 + v * 90;
        box(c, x, y, 139, 65, P.panel, null, 6);
        tileGrid(c, x + 13, y + 10, 8, 4, 12, traceColors[v], 3);
      }
      mono(c, String(j + 1), x + 68, 728, 26, P.muted, 'center');
    }
    label(c, 'Frame', 110, 788, 29, P.muted);
    footer(
      c,
      done
        ? '3 × 32 × 10 = ' + fmt(M.clipStates) + ' visual states'
        : '32 queries per view. How many states does the clip produce?',
      done
        ? 'A fixed bank per crop still grows with the number of crops and frames.'
        : 'Each small square represents one query output.',
    );
    return;
  }
  if (b === 2) {
    page(c, 'What survived the smaller bank?', 'Evidence probe   /   reduced view');
    viewport(c, 85, 295, 1.11, () => plot(c, { open: 0, showBadge: false, readout: true }));
    mono(c, 'RECOVERED IN THIS TRIAL', 1310, 356, 25, P.teal);
    ['Time axis', 'Rising trace', 'Service name'].forEach((n, i) => {
      label(c, n, 1310, 448 + i * 87, 37);
      if (i === 2) mono(c, '?', 1770, 448 + i * 87, 37, P.red, 'right');
      else {
        line(c, 1740, 447 + i * 87, 1749, 456 + i * 87, P.teal, 4);
        line(c, 1749, 456 + i * 87, 1767, 434 + i * 87, P.teal, 4);
      }
    });
    const crop = resolved(k, 2, 'read a verified legend crop');
    if (crop) {
      clip(c, 1307, 695, 235, 73, () => viewport(c, 955, 309, 0.96, () => plot(c)));
      corner(c, 1307, 695, 235, 73, P.teal, 12, 3);
      mono(c, 'Original crop', 1310, 806, 26, P.teal);
    }
    footer(
      c,
      crop
        ? 'The original legend supplies the missing service name.'
        : 'A green trace rose. Which service?',
      crop
        ? 'Compare the verified legend crop with the trace in the reduced read.'
        : 'The reduced representation retained the trace and axis in this trial.',
    );
    return;
  }
  const queryMode = b === 1 && resolved(k, 1, 'Give the bridge');
  page(
    c,
    queryMode
      ? 'What does each learned query return?'
      : 'What changes when a projector widens a feature?',
    'Connector   /   one high-resolution view',
  );
  mono(c, 'INPUT PATCH POSITIONS', 120, 295);
  tileGrid(c, 120, 360, 24, 24, 17, P.panel2, 2);
  mono(c, '24 × 24 = ' + M.vision, 120, 807);
  const active = cue(k, 0, 'Follow one patch', 1.3);
  corner(c, 120 + 9 * 17, 360 + 11 * 17, 17, 17, P.gold, 6, 4);
  if (queryMode) {
    const trace = cue(k, 1, 'Follow the first query', 1.0);
    const one = resolved(k, 1, 'One query returns one state');
    const all = resolved(k, 1, 'Across all thirty-two queries');
    const qx = 772,
      ox = 1402,
      top = 468,
      step = 44,
      size = 36;
    mono(c, M.queries + ' LEARNED QUERIES', qx, 341, 29, P.teal);
    mono(c, 'OUTPUT BANK', ox, 341, 29, P.teal);
    opacity(c, trace, () => {
      for (const [i, j] of [
        [1, 1],
        [15, 4],
        [9, 11],
        [17, 21],
        [6, 19],
      ]) {
        const x = 120 + (i + 0.5) * 17,
          y = 360 + (j + 0.5) * 17;
        line(c, x, y, qx, top + size / 2, P.teal, 3);
        mark(c, 2, x, y, 5, P.gold);
      }
    });
    for (const slot of M.bridgeSlots) {
      const dx = ((slot - 1) % 8) * step,
        dy = Math.floor((slot - 1) / 8) * step;
      const first = slot === 1;
      fill(c, qx + dx, top + dy, size, size, first && trace ? P.gold : P.panel2);
      if ((first && one) || all) fill(c, ox + dx, top + dy, size, size, first ? P.gold : P.teal);
    }
    if (trace > 0) mono(c, '1', qx + size / 2, top + size / 2, 24, P.ink, 'center');
    if (one) {
      const from = qx + size / 2,
        to = ox + size / 2;
      line(c, from, top - 4, from, top - 62, P.teal, 4);
      line(c, from, top - 62, to, top - 62, P.teal, 4);
      arrow(c, to, top - 62, to, top - 4);
      mono(c, '1', to, top + size / 2, 24, P.ink, 'center');
      label(c, all ? M.queries + ' mixed states' : 'State 1', ox, 694, 37);
    } else label(c, 'What comes back?', ox, 691, 36, P.muted);
    footer(
      c,
      all
        ? '32 learned queries return 32 states for this view.'
        : one
          ? 'The first query returns the first mixed state.'
          : 'Follow one query as it reads the patch bank.',
      trace > 0
        ? 'Lines show a few of the 576 patches each query can read.'
        : 'The bridge receives the same 576 patch features.',
    );
  } else {
    mono(c, 'ONE INPUT ROW', 680, 370, 27);
    for (let i = 0; i < M.projectionWidths[0]; i++)
      fill(c, 680 + i * 65, 439, 55, 72, [P.teal, P.panel2, '#6a9690', '#86a89c'][i]);
    arrow(c, 973, 475, 1120, 475);
    mono(c, 'ONE PROJECTED ROW', 1170, 370, 27);
    opacity(c, active, () => {
      for (let i = 0; i < M.projectionWidths[1]; i++)
        fill(
          c,
          1170 + i * 65,
          439,
          55,
          72,
          ['#54738e', '#658ba1', P.panel2, '#a5b4bd', '#62898b', '#3b6972'][i],
        );
    });
    label(c, '4 input coordinates', 680, 578, 32);
    label(c, M.projectionWidths[1] + ' output coordinates', 1170, 578, 32);
    footer(
      c,
      'A learned map changes the width of each row.',
      'This illustrative projection keeps all 576 positions.',
    );
  }
}
function bus(c, x, y) {
  box(c, x, y, 315, 162, '#ac4745', null, 22);
  for (let i = 0; i < 4; i++) box(c, x + 18 + i * 74, y + 15, 61, 75, '#d0e4dd', null, 7);
  fill(c, x + 10, y + 111, 293, 9, '#f2c895');
  for (const ax of [57, 258]) {
    c.fillStyle = P.panel;
    c.beginPath();
    c.arc(x + ax, y + 158, 29, 0, 2 * Math.PI);
    c.fill();
    mark(c, 2, x + ax, y + 158, 11, P.dim);
  }
}
export function training(c, k) {
  const b = k.beat.beatIndex,
    cut = b === 1 || (b === 2 && !resolved(k, 2, 'Restore the activation gradient')),
    later = b === 2 && resolved(k, 2, 'In the later instruction stage'),
    joint = b >= 3;
  if (joint && resolved(k, 3, 'Score the starting checkpoint')) {
    const visualScore = resolved(k, 3, 'it reads seventeen labels');
    const textScore = resolved(k, 4, 'fifteen right');
    const chartBaseline = resolved(k, 3, 'thirteen labels');
    const textBaseline = resolved(k, 3, 'eighteen passage questions');
    const compareMixture = resolved(k, 4, 'To test the training mixture');
    const preference = resolved(k, 4, 'Preference tuning');
    page(
      c,
      'Which checkpoint would you keep?',
      'Joint training   /   illustrative held-out results',
    );
    mono(c, 'HELD-OUT TASK', 134, 324, 28, P.teal);
    mono(c, 'BEFORE JOINT TUNING', 908, 324, 28, P.teal);
    mono(c, 'AFTER JOINT TUNING', 1420, 324, 28, P.teal);
    M.checkpointTasks.forEach(({ task, cases, before, after }, i) => {
      const y = 466 + 192 * i,
        show = i === 0 ? visualScore : textScore;
      const baseline = i === 0 ? chartBaseline : textBaseline;
      line(c, 120, y - 72, 1795, y - 72, P.rule, 2);
      label(c, task, 134, y, 45);
      mono(c, baseline ? before + ' / ' + cases : '?', 908, y, 46, P.ink);
      mono(
        c,
        show ? after + ' / ' + cases : '?',
        1420,
        y,
        46,
        show ? (after >= before ? P.teal : P.red) : P.muted,
      );
      for (const [x, correct] of [
        [908, baseline ? before : null],
        [1420, show ? after : null],
      ])
        if (correct !== null) {
          fill(c, x, y + 46, cases * 16, 14, '#d4dbd3');
          fill(c, x, y + 46, correct * 16, 14, P.panel2);
        }
    });
    footer(
      c,
      preference
        ? 'Reward answers that cite a readable label or abstain when it is missing.'
        : compareMixture
          ? 'Change the training mixture and score both held-out sets again.'
          : textScore
            ? 'Four more chart labels read correctly. Three fewer correct text-only answers.'
            : 'What else do you need to know before selecting the new checkpoint?',
      compareMixture
        ? 'Keep the starting checkpoint, learning rates, training token count and evaluation cases fixed.'
        : 'Use the same twenty chart labels and the same twenty passage questions for both checkpoints.',
    );
    return;
  }
  page(
    c,
    joint ? 'Which weights can joint training change?' : 'Can a frozen decoder teach the bridge?',
    'Training   /   ' +
      (joint ? 'joint tuning' : later ? 'instruction tuning' : 'image–caption alignment'),
  );
  bus(c, 112, 385);
  label(c, later || joint ? '“What color?”' : '“a red ___”', 115, 645, 48);
  const blocks = ['Encoder', 'Projector', 'Decoder'];
  const centers = [690, 1080, 1470],
    trainable = joint ? M.jointTraining : later ? M.instruction : M.alignment;
  for (let i = 0; i < 3; i++) {
    const x = centers[i];
    box(c, x - 143, 418, 286, 140, P.panel);
    label(c, blocks[i], x, 465, 40, P.light, { align: 'center' });
    mono(
      c,
      trainable[i] ? 'TRAINABLE' : 'FROZEN',
      x,
      521,
      23,
      trainable[i] ? P.green : P.dim,
      'center',
    );
    if (i < 2) arrow(c, x + 150, 487, centers[i + 1] - 152, 487);
  }
  mono(c, later || joint ? 'ANSWER TARGET' : 'CAPTION TARGET', 1732, 398, 20, P.teal, 'center');
  serif(c, later || joint ? 'red' : 'bus', 1732, 478, 61);
  mono(c, 'Loss', 1732, 600, 27, P.muted, 'center');
  if (b >= 1) {
    const color = cut ? P.red : P.teal;
    arrow(c, 1690, 600, 1520, 555, color);
    if (cut) {
      line(c, 1540, 574, 1550, 536, P.red, 6);
      label(c, 'Graph cut', 1475, 642, 32, P.red, { align: 'center' });
    } else {
      line(c, 1440, 560, 1440, 677, P.teal, 4);
      line(c, 1440, 677, 1080, 677, P.teal, 4);
      arrow(c, 1080, 677, 1080, 564);
      label(c, later || joint ? 'Answer gradient' : 'Caption gradient', 1270, 742, 31, P.teal, {
        align: 'center',
      });
      if (joint) {
        line(c, 1048, 560, 1048, 677, P.teal, 4);
        line(c, 1048, 677, 690, 677, P.teal, 4);
        arrow(c, 690, 677, 690, 564);
      }
    }
  }
  const line1 = joint
    ? 'Joint training can update encoder, projector and decoder.'
    : later
      ? 'Instruction tuning also updates the language model.'
      : cut
        ? b === 1
          ? 'Can the caption loss teach the projector across this cut?'
          : 'The cut prevents the caption gradient from reaching the projector.'
        : b === 2
          ? 'The frozen decoder carries an activation gradient back to the projector.'
          : 'Alignment stage: use the next-word loss to train the projector.';
  footer(
    c,
    line1,
    joint
      ? 'Test retained detail independently of fluency and abstention.'
      : 'Weight updates and activation backpropagation are separate decisions.',
  );
}
export function routes(c, k) {
  const b = k.beat.beatIndex;
  page(
    c,
    [
      'What can a pooled score return?',
      'Where do the visual positions enter?',
      'What stays beside the text stream?',
      'How many pairs can one fusion head score?',
    ][b],
    'Fusion strategy   /   ' +
      ['late fusion', 'early fusion', 'cross-attention', 'dense score shapes'][b],
  );
  if (b === 0) {
    viewport(c, 106, 348, 0.79, () => plot(c));
    label(c, '“A rising service latency chart”', 106, 802, 38);
    mono(c, 'TOY UNIT VECTORS', 1005, 331, 27, P.teal);
    label(c, 'Text query   [1, 0]', 1005, 405, 42);
    const show = resolved(k, 0, 'A similarity score');
    M.candidates.forEach(({ name, vector }, i) => {
      const y = 543 + i * 135;
      label(c, name, 1005, y, 36);
      mono(c, '[' + vector.join(', ') + ']', 1005, y + 49, 28);
      if (show) {
        const score = M.similarity(vector);
        fill(c, 1450, y - 10, 240 * score, 23, i ? P.rule : P.teal);
        mono(c, score.toFixed(2), 1765, y, 33, P.ink, 'right');
      }
    });
    footer(
      c,
      'Compare pooled image and text vectors to rank candidate screenshots.',
      'For unit vectors the dot product gives cosine similarity. The score contains no chart coordinates.',
    );
  } else if (b === 1 || b === 2) {
    const cross = b === 2;
    mono(c, cross ? 'SIDE MEMORY' : 'IMAGE PREFIX', 139, 310);
    for (let i = 0; i < 7; i++) box(c, 140 + i * 84, 381, 68, 84, P.teal, null, 7);
    const tx = cross ? 905 : 750;
    mono(c, 'TEXT STATES', tx, 310);
    for (let i = 0; i < 9; i++) box(c, tx + i * 84, 381, 68, 84, P.panel2, null, 7);
    const begin = cross ? tx : 140,
      end = tx + 8 * 84 + 68;
    for (let i = 0; i < 3; i++) {
      const yy = 550 + i * 86;
      box(c, begin, yy, end - begin, 62, i === 1 && cross ? '#496f70' : P.panel, null, 8);
      label(
        c,
        cross && i === 1 ? 'Text self-attention + visual read' : 'Decoder self-attention',
        begin + (end - begin) / 2,
        yy + 31,
        29,
        P.light,
        { align: 'center' },
      );
    }
    if (cross) {
      line(c, 455, 475, 455, 668, P.teal, 4);
      arrow(c, 455, 668, tx - 10, 668);
      mono(c, 'VISUAL K, V', 470, 626, 24, P.teal);
    }
    footer(
      c,
      cross
        ? 'Selected decoder layers query a separate visual bank.'
        : 'Visual and text positions share the decoder sequence.',
      cross
        ? 'The language backbone still runs its own text self-attention.'
        : 'The full mixed prefix contributes to the self-attention and cache budget.',
    );
  } else {
    const w = 480,
      ext = (w * M.reduced.visual) / M.textCount,
      x = 140,
      y = 315;
    fill(c, x, y, w, w, P.panel);
    mono(c, 'TEXT × TEXT', x + w / 2, y + w / 2, 31, P.light, 'center');
    const cross = cue(k, 3, 'a fusion layer adds', 1.2);
    opacity(c, cross, () => {
      fill(c, x + w + 22, y, ext, w, P.teal);
      mono(c, '+', x + w + 11, y + w / 2, 24, P.ink, 'center');
    });
    mono(c, '2,200 queries', 145, 840);
    mono(c, '160 visual keys', 690, 350, 25, P.teal);
    caption(c, 'Text self-attention', '2,200 × 2,200 = ' + fmt(M.textSquare), 955, 342);
    caption(
      c,
      'Additional cross-attention',
      resolved(k, 3, 'three hundred fifty-two thousand')
        ? '2,200 × 160 = ' + fmt(M.extraScores)
        : '2,200 × 160',
      955,
      523,
    );
    caption(c, 'Early-fusion alternative', '2,360 × 2,360 = ' + fmt(M.mixedSquare), 955, 704);
    footer(
      c,
      'Dense position pairs per head in one applicable layer.',
      'Masks and implementation determine realized work, allocation and latency.',
    );
  }
}
