import { C, camera, cameraPrint, exposure } from './studio.mjs';
import {
  fixed,
  scoreRows,
  bundle,
  label,
  development,
  visionThreshold,
  thresholdAt,
  visionHead,
  visionMasked,
  visionSigmoid,
} from './records.mjs';

function cutoff(s) {
  const show = s.cue(2, 'first two cross');
  s.title('Accepted test views', 'Which parcel enters priority review?');
  const x = 480,
    w = 905,
    t = bundle.damage_threshold;
  s.line(x + t * w, 276, x + t * w, 807, C.red, 5);
  s.text('Frozen ' + fixed(t), x + t * w - 121, 251, 33, C.red, 'Mono');
  scoreRows.forEach((r, i) => {
    const y = 349 + i * 128;
    s.text(r.photo_id, 95, y + 16, 42, C.ink, 'Mono');
    s.line(x, y, x + w, y, C.line, 5);
    const xx = x + w * r.damage_probability;
    s.dot(xx, y, 18, C.sea);
    s.text(fixed(r.damage_probability), xx - 47, y + 58, 32, C.ink, 'Mono');
    if (show) s.text(label[r.action], 1473, y + 16, 40, C.ink, 'Serif', 355);
  });
  if (s.b === 3)
    s.text('Choose on validation cases. Freeze before the final holdout.', 93, 930, 39, C.sea);
}

function slots(s) {
  const threshold = thresholdAt(s);
  const stats = threshold === null ? null : visionThreshold(development, threshold);
  s.title('Development worksheet', 'Four inspections. Recover at least three damaged cases.');
  s.text('Specialist capacity', 82, 276, 31, C.muted);
  s.line(81, 308, 1225, 308, C.sea, 6);
  s.line(81, 308, 81, 340, C.sea, 6);
  s.line(1225, 308, 1225, 340, C.sea, 6);
  development.forEach(([score, gold], i) => {
    const chosen = stats && score >= threshold;
    const x = 88 + i * 294,
      y = chosen ? 370 : 545;
    const col = chosen ? (i < 4 ? C.sea : C.red) : C.muted;
    s.box(x, y, 252, 208, chosen ? (i < 4 ? C.mint : C.rose) : C.white, col, 3);
    s.text(fixed(score), x + 28, y + 94, 60, col, 'Mono');
    s.text(gold ? 'Damaged' : 'Clear', x + 28, y + 165, 38, C.ink, 'Serif');
    if (chosen && i >= 4) s.text('Over capacity', x, y - 21, 30, C.red);
  });
  if (stats) {
    s.text('Cutoff  ' + fixed(threshold), 90, 849, 43, C.ink, 'Mono');
    s.text(stats.slots + ' / 4 slots', 560, 849, 47, stats.slots > 4 ? C.red : C.sea, 'Serif');
    s.text('Recall  ' + stats.TP + ' / ' + (stats.TP + stats.FN), 1000, 849, 42, C.ink, 'Mono');
    s.text('Precision  ' + stats.TP + ' / ' + stats.slots, 1000, 927, 38, C.ink, 'Mono');
    if (s.b === 5) s.text('Freeze on validation', 90, 943, 38, C.sea);
  } else s.text('Six independent validation cases with specialist labels', 88, 891, 39, C.muted);
}

export function windowLeft(s) {
  return camera.center * s.cue(2, 'Move it to the center', 1.6);
}
function crops(s) {
  s.title('Classifier input', 'Follow the tear through the crop');
  const x = 80,
    y = 318,
    w = 945,
    h = w / 2,
    factor = w / 512,
    left = windowLeft(s),
    v = [left, camera.top, camera.size, camera.size];
  cameraPrint(s, x, y, w, h, 'mailer', 'Resized camera image   512 × 256');
  s.box(
    x + left * factor,
    y + camera.top * factor,
    camera.size * factor,
    camera.size * factor,
    null,
    C.gold,
    8,
  );
  cameraPrint(s, 1200, 289, 531, 531, 'mailer', 'Model input   224 × 224', { crop: v });
  s.line(x + w + 15, 552, 1160, 552, C.muted, 5);
  if (s.b === 3) s.text('Frozen features → trained head', 97, 951, 39, C.sea);
}

function transforms(s) {
  s.title('ResNet-18 input', 'Find the same tear in two inputs');
  const size = camera.size;
  const side = 480,
    y = 251,
    cropX = 145,
    fitX = 999;
  const fitScale = size / camera.width;
  const imageHeight = camera.height * fitScale;
  const padding = (size - imageHeight) / 2;
  const drawingScale = side / size;
  const [tearX, tearY] = camera.tear;
  s.box(cropX, y, side, side, C.night);
  exposure(s, cropX, y, side, side, 'mailer', {
    crop: [camera.center, camera.top, size, size],
  });
  s.text('Default center crop · ' + size + ' × ' + size, cropX, 786, 42, C.ink, 'Serif');

  if (s.cue(2, 'Try fitting the whole frame')) {
    s.box(fitX, y, side, side, C.night);
    exposure(s, fitX, y + padding * drawingScale, side, imageHeight * drawingScale, 'mailer');
    s.text('Fit + pad trial · ' + size + ' × ' + size, fitX, 786, 42, C.ink, 'Serif');

    const focus = s.after(2, 'The padding leaves the torn corner in view', 0.3);
    if (focus > 0) {
      const croppedY = y + (tearY - camera.top) * drawingScale;
      const fittedX = fitX + tearX * fitScale * drawingScale;
      const fittedY = y + (padding + tearY * fitScale) * drawingScale;
      s.path(
        [[cropX - 5, croppedY - 16], [cropX - 27, croppedY], [cropX - 5, croppedY + 16]],
        null,
        C.red,
        6,
      );
      const { c } = s;
      c.beginPath();
      c.arc(fittedX, fittedY, 65 - 20 * focus, 0, 2 * Math.PI);
      c.strokeStyle = C.gold;
      c.lineWidth = 7;
      c.stroke();
      s.text('Tear x=' + tearX + ' · crop starts x=' + camera.center, cropX, 831, 31, C.red, 'Mono');
    }
    if (s.after(2, 'Look how much smaller the tear becomes')) {
      s.text(padding + ' px top pad', fitX + 26, y + 68, 31, C.white, 'Mono');
      s.text(padding + ' px bottom pad', fitX + 26, y + side - 43, 31, C.white, 'Mono');
      s.text(
        'Tear scale: ' + size + ' ÷ ' + camera.width + ' = ' + fixed(fitScale, 4) + '×',
        fitX, 831, 31, C.sea, 'Mono',
      );
    }
  } else if (s.b === 1) {
    s.note(850, 332, 'Short side after resize', camera.height + ' pixels', C.ink);
    if (s.cue(1, 'For each channel')) {
      s.text('For R, G, B in [0, 1]', 850, 585, 38, C.muted);
      s.text('(channel − mean) / std', 850, 673, 53, C.sea, 'Mono');
    }
  }
  if (s.b === 3)
    s.text(
      'Serving bundle    transform · weights · precision · guideline · thresholds · policy',
      90,
      877,
      34,
      C.muted,
      'Mono',
      1740,
    );
}

function representation(s) {
  if (s.b === 1) {
    s.title('Transfer learning', 'What learns from the parcel labels?');
    cameraPrint(s, 82, 338, 540, 270, 'mailer', 'Labeled parcel');
    s.line(645, 474, 735, 474, C.muted, 5);
    s.box(753, 336, 476, 270, C.sky);
    s.text('ResNet encoder', 778, 430, 46, C.ink, 'Serif');
    s.text(
      s.cue(1, 'fine tune the encoder') ? 'Fine-tune' : 'Frozen weights',
      780,
      527,
      40,
      C.blue,
    );
    s.line(1238, 474, 1330, 474, C.muted, 5);
    s.box(1344, 336, 490, 270, C.mint);
    s.text('Damage head', 1377, 430, 46, C.ink, 'Serif');
    s.text('Train on labels', 1377, 527, 40, C.sea);
    return;
  }
  if (s.b === 5) {
    s.title('Encoder comparison', 'Keep the parcel holdout and slot budget fixed');
    ['ResNet-18', 'ConvNeXt', 'Vision transformer'].forEach((name, i) => {
      const x = 94 + i * 593;
      s.text(name, x, 342, 51, C.ink, 'Serif', 553);
      cameraPrint(s, x, 424, 480, 240, 'mailer', null, { mark: true });
      s.text('Same torn seam', x, 746, 35, C.muted);
    });
    s.text(
      'Record small-tear recovery, device latency, resolution, precision and training budget.',
      93,
      936,
      37,
      C.sea,
      'Sans',
      1730,
    );
    return;
  }
  const vit = s.cue(2, 'vision transformer');
  if (!vit) {
    s.title('ConvNeXt', 'Filter each channel, then mix channels');
    for (let k = 0; k < 3; k++) {
      const x = 178 + 487 * k,
        y = 299,
        d = 52;
      for (let j = 0; j < 8; j++)
        for (let i = 0; i < 8; i++)
          s.box(x + i * d, y + j * d, d - 2, d - 2, (i + j + k) % 5 === 0 ? C.mist : C.sky);
      const offset = s.cue(2, 'slides a seven', 1.5) * d;
      s.box(x + offset, y + d, 7 * d, 7 * d, null, C.sea, 8);
      s.text('Channel ' + (k + 1), x, 820, 41, C.ink, 'Serif');
    }
    return;
  }
  s.title('ViT patch projection', 'Two pixel pairs with the same mean');
  [
    [0, 1],
    [1, 0],
  ].forEach(([a, b], j) => {
    const x = 185 + j * 878;
    [a, b].forEach((v, i) => {
      s.box(x + i * 240, 330, 236, 236, v ? '#fffdf5' : C.night, C.line);
      s.text(v, x + i * 240 + 87, 477, 83, v ? C.ink : C.white, 'Mono');
    });
    s.text('Mean 0.5', x, 653, 40, C.muted, 'Mono');
    if (j ? s.cue(3, 'Light to dark') : s.cue(3, 'Dark to light'))
      s.text('Right − left  =  ' + (b - a > 0 ? '+1' : '−1'), x, 783, 45, C.sea, 'Mono');
  });
  if (s.b === 4)
    s.text(
      'Patch projection + position embedding → self-attention across tokens',
      94,
      952,
      40,
      C.ink,
      'Sans',
      1750,
    );
}

const head = visionHead();
function forward(s) {
  s.title('Binary damage head', 'From two features to one damage score');
  const { features, weights, products, bias, logit, probability, loss } = head;
  s.table(
    90,
    294,
    [330, 290, 310, 345],
    ['Term', 'Feature', 'Weight', 'Product'],
    [
      [
        'First',
        features[0],
        fixed(weights[0]),
        s.cue(1, 'contribution is one half') ? fixed(products[0]) : '',
      ],
      [
        'Second',
        s.cue(1, 'next feature') ? features[1] : '',
        s.cue(1, 'next feature') ? fixed(weights[1]) : '',
        s.cue(1, 'contribution is minus') ? fixed(products[1]) : '',
      ],
    ],
    { step: 150, size: 49 },
  );
  s.line(1382, 254, 1382, 890, C.line);
  if (s.cue(2, 'Add the bias'))
    s.note(1420, 322, 'Bias ' + fixed(bias) + '  ·  logit', fixed(logit), C.ink, 465);
  if (s.cue(2, 'sigmoid gives'))
    s.note(1420, 543, 'Sigmoid probability', fixed(probability, 4), C.sea, 465);
  if (s.b === 3) {
    s.text('Known damage   y = 1', 90, 746, 44, C.muted, 'Mono');
    if (s.cue(3, 'Here the loss'))
      s.text('Loss = −ln(p) = ' + fixed(loss, 4), 90, 842, 51, C.ink, 'Mono');
  }
}

function update(s) {
  s.title('One SGD step · damaged target', 'Which weight moves down?');
  const { features, weights, bias, logitGradient, gradients, nextWeights, nextBias } = head;
  const showGrad = s.cue(2, 'Multiply that gradient');
  const updated = s.cue(3, 'second weight goes down');
  s.text(
    'p − y   =   ' + fixed(head.probability, 4) + ' − 1   =   ' + fixed(logitGradient, 4),
    94,
    275,
    43,
    C.ink,
    'Mono',
  );
  s.table(
    92,
    399,
    [306, 278, 296, 390, 474],
    ['Parameter', 'Before', 'Multiplier', 'Gradient', 'After  (η = 0.10)'],
    ['Weight 1', 'Weight 2', 'Bias'].map((n, i) => [
      n,
      fixed([...weights, bias][i]),
      [...features, 1][i],
      showGrad ? fixed([...gradients, logitGradient][i], 4) : '',
      updated ? fixed([...nextWeights, nextBias][i], 4) : '',
    ]),
    { step: 109, size: 45, colors: [C.ink, updated ? C.red : C.ink, C.ink] },
  );
  if (s.b >= 4) s.text('New logit  ' + fixed(head.nextLogit, 4), 93, 873, 45, C.ink, 'Mono');
  if (s.b === 5) {
    s.text('p  ' + fixed(head.nextProbability, 4), 740, 873, 45, C.sea, 'Mono');
    s.text('Loss  ' + fixed(head.nextLoss, 4), 1260, 873, 45, C.sea, 'Mono');
    s.text('Same features and target', 94, 957, 32, C.muted);
  }
}

function defects(s) {
  const m = visionMasked();
  s.title('Multi-label defect head', 'One sigmoid per defect');
  ['Torn seam', 'Crushed corner', 'Puncture'].forEach((name, i) => {
    const x = 89 + i * 595;
    if (i === 0) exposure(s, x, 259, 493, 231, 'mailer', { crop: [21, 25, 167, 78] });
    else if (i === 1) exposure(s, x, 259, 493, 231, 'mailer', { crop: [380, 143, 123, 58] });
    else {
      s.box(x, 259, 493, 231, C.sky);
      s.text('?', x + 214, 429, 128, C.muted, 'Serif');
    }
    s.text(name, x, 552, 45, C.ink, 'Serif');
    if (s.b >= 2)
      s.text(
        ['Present   y = 1', 'Absent    y = 0', 'Unassessed'][i],
        x,
        631,
        34,
        i === 2 ? C.muted : C.sea,
        'Mono',
      );
    if (s.b >= 3)
      s.text(
        'z = ' + m.logits[i] + (i < 2 ? '   Loss  ' + fixed(m.losses[i], 4) : '   Masked'),
        x,
        711,
        34,
        C.ink,
        'Mono',
      );
    if (s.b === 5)
      s.text(
        'Gradient  ' + fixed(m.gradients[i], 4),
        x,
        785,
        33,
        i === 2 ? C.muted : C.blue,
        'Mono',
      );
  });
  if (s.cue(4, 'divide by two'))
    s.text(
      'Observed mean   (' +
        fixed(m.losses[0], 4) +
        ' + ' +
        fixed(m.losses[1], 4) +
        ') / ' +
        m.observed +
        '  ≈  ' +
        fixed(m.mean),
      92,
      940,
      43,
      C.sea,
      'Mono',
    );
}

function calibration(s) {
  if (s.b <= 2) {
    s.title('Calibration on usable cases', 'What should a score near 0.80 mean?');
    const x = 140,
      y = 789,
      w = 494;
    s.line(x, y, x + w, y, C.muted);
    s.line(x, y, x, y - w, C.muted);
    s.line(x, y, x + w, y - w, C.sea, 5);
    s.dot(x + 0.8 * w, y - 0.8 * w, 16, C.red);
    s.text('0', x - 27, y + 42, 30, C.muted);
    s.text('1', x + w - 7, y + 42, 30, C.muted);
    s.text('1', x - 36, y - w + 10, 30, C.muted);
    s.text('Mean score in bin', x + 55, y + 105, 38, C.ink);
    s.text('Confirmed fraction', x - 36, y - w - 38, 36, C.ink);
    s.note(850, 326, 'If probabilities are well calibrated', 'About 8 in 10', C.sea);
    for (let i = 0; i < 10; i++) s.dot(875 + i * 83, 535, 25, i < 8 ? C.sea : C.line);
    s.text('Expected in a bin near 0.80', 850, 637, 39, C.muted);
    if (s.b === 2)
      s.text('Fit on validation. Evaluate on final test.', 850, 816, 41, C.ink, 'Sans', 970);
  } else if (s.b <= 4) {
    s.title('Temperature scaling · logit z = 2', 'The cutoff stays on the probability scale');
    const cutoff = s.b === 4 ? 0.8 : 0.5;
    const x = 202,
      w = 1450;
    [1, 2].forEach((T, i) => {
      const y = 455 + i * 240,
        p = visionSigmoid(2 / T);
      if (i === 1 && !s.cue(3, 'At temperature two')) return;
      s.text('T = ' + T + '    σ(2 / ' + T + ') = ' + fixed(p, 4), x, y - 70, 43, C.ink, 'Mono');
      s.line(x, y, x + w, y, C.line, 7);
      s.dot(x + w * p, y, 17, p >= cutoff ? C.sea : C.red);
      s.line(x + w * cutoff, y - 26, x + w * cutoff, y + 26, C.red, 5);
      s.text(
        p >= cutoff ? 'Qualifies' : 'Below cutoff',
        x + w * p - 97,
        y + 67,
        33,
        p >= cutoff ? C.sea : C.red,
      );
    });
    s.text('Operating cutoff   ' + fixed(cutoff), 205, 944, 42, C.ink, 'Mono');
  } else {
    s.title('End-to-end evaluation', 'Follow the cases rejected for quality');
    cameraPrint(s, 84, 303, 810, 405, 'dark', 'Rejected at quality gate');
    s.note(985, 365, 'Human usability', 'Audit rejected photos', C.red, 840);
    s.text('Rejection rate', 987, 573, 43, C.ink);
    s.text('Usable photos rejected', 987, 665, 43, C.ink);
    s.text('Damaged cases recovered', 987, 757, 43, C.ink);
  }
}
export const models = [
  cutoff,
  slots,
  crops,
  transforms,
  representation,
  forward,
  update,
  defects,
  calibration,
];
