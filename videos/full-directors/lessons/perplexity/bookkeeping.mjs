import {
  ink,
  red,
  teal,
  gold,
  dim,
  cream,
  blue,
  mint,
  ochre,
  light,
  mix,
  fix,
  sum,
  surprise,
  cue,
  center,
} from './studio.mjs';

const words = ['The', 'little', 'cat', 'slept', 'by', 'the', 'warm', 'fire', 'all', 'evening'];
export const windows = [
  [0, 5, 1, 5],
  [3, 8, 5, 8],
  [5, 10, 8, 10],
];
export const targetPositions = (w) => Array.from({ length: w[3] - w[2] }, (_, i) => w[2] + i);
export function contextWindow(p, c) {
  const b = c.beat.beatIndex;
  p.ground();
  p.heading('Move the frame. Leave the ink.');
  const first = cue(c, 0, 'Score the next four', 1.9);
  const second = cue(c, 1, 'Slide the frame to slept', 1.5),
    third = cue(c, 2, 'Slide again', 1.6);
  const stamp = [first, cue(c, 1, 'Stamp only the three', 1.6), cue(c, 2, 'Only all and evening', 1.1)];
  const left = 103,
    step = 171,
    top = 374,
    h = 151;
  const pos = mix(mix(windows[0][0], windows[1][0], second), windows[2][0], third);
  const frameX = left + pos * step,
    frameWidth = step * 5;
  p.stock(88, 320, 1744, 384);
  p.rect(frameX, top, frameWidth, h, '#deead2');
  words.forEach((word, i) => {
    const x = left + (i + 0.5) * step;
    p.impression(word, x, top + 104, 61, ink, { ...center, max: step - 10 });
    p.mono(String(i), x, top + 209, 32, dim, center);
  });
  // The brass edges leave the overlapping type exposed.
  p.rect(frameX, top - 4, frameWidth, 10, gold);
  p.rect(frameX, top + h - 4, frameWidth, 10, gold);
  for (const x of [frameX, frameX + frameWidth - 9]) {
    p.rect(x, top - 3, 9, h + 7, gold);
    p.circle(x + 4, top + 4, 4, '#e5d4a9');
  }
  let count = 0;
  windows.forEach((w, pass) => {
    const targets = targetPositions(w),
      n = Math.round(stamp[pass] * targets.length);
    targets.slice(0, n).forEach((i) => {
      const x = left + (i + 0.5) * step;
      p.circle(x, 630, 16, [blue, red, teal][pass]);
      p.line(x - 5, 630, x - 1, 635, cream, 3);
      p.line(x - 1, 635, x + 8, 624, cream, 3);
    });
    count += n;
  });
  p.text('One mark per scored position', left, 780, 41, dim);
  p.mono(count + ' marks', 1771, 805, 74, ink, { align: 'right' });
  if (b === 3) {
    p.fade(cue(c, 3, 'The logits at all'), () =>
      p.serif('Logits at “all” predict “evening”.', left, 896, 61, teal),
    );
  } else {
    const pass = third > 0 ? 2 : second > 0 ? 1 : 0;
    const moving = (second > 0 && second < 1) || (third > 0 && third < 1);
    p.text(
      moving
        ? 'Moving to the next five words'
        : 'Pass ' +
            (pass + 1) +
            ' reads positions ' +
            windows[pass][0] +
            ' through ' +
            (windows[pass][1] - 1),
      left,
      867,
      44,
      [blue, red, teal][pass],
    );
  }
}

export const padded = [
  [-100, 1, 2],
  [-100, -100, 3],
];
export const shifted = (rows) => rows.map((row) => row.slice(1));
export const validCount = (rows) => sum(shifted(rows).map((r) => r.filter((v) => v !== -100).length));
const rowLosses = [[0.2, 0.2], [2]];
export { rowLosses };
export function batch(p, c) {
  const b = c.beat.beatIndex;
  p.ground(true);
  if (b <= 1) {
    p.heading('Line up each logit with the next label', true);
    const move = cue(c, 0, 'Read the next label', 1.8),
      reveal = cue(c, 1, 'Counting three valid', 0.7);
    const x = 506,
      step = 427;
    padded.forEach((row, r) => {
      const y = 305 + r * 269;
      p.text('Row ' + (r + 1), 138, y + 85, 54, light);
      row.forEach((v, i) => {
        const xx = x + (i - move) * step;
        p.fade(i === 0 ? 1 - move : 1, () => {
          p.stock(xx, y, 272, 119, v === -100 ? '#d8d1bd' : cream);
          p.mono(String(v).replace('-', '−'), xx + 136, y + 83, 66, v === -100 ? dim : teal, center);
        });
      });
      for (let i = 0; i < 2; i++) {
        p.line(x + (i + 1 - move) * step + 136, y + 125, x + i * step + 136, y + 153, ochre, 3);
        p.mono('logits[' + i + ']', x + i * step + 136, y + 196, 37, ochre, center);
      }
    });
    p.text('−100 = ignore', 144, 894, 38, light);
    p.fade(reveal, () =>
      p.serif('2 + 1 = ' + validCount(padded) + ' valid targets', 1739, 885, 70, mint, { align: 'right' }),
    );
  } else {
    p.heading('Recover the token mean from a padded batch', true);
    const rows = shifted(padded);
    rows.forEach((row, r) => {
      const y = 306 + r * 212;
      p.text('Row ' + (r + 1), 137, y + 64, 47, light);
      let j = 0;
      row.forEach((v, i) => {
        const x = 435 + i * 352;
        p.stock(x, y, 316, 109, v === -100 ? '#779097' : cream);
        const nll = v === -100 ? null : rowLosses[r][j++];
        p.mono(
          nll === null ? 'ignored' : fix(nll, 1) + ' nats',
          x + 158,
          y + 74,
          45,
          nll === null ? ink : teal,
          center,
        );
      });
      p.mono('sum ' + fix(sum(rowLosses[r]), 1) + ' / ' + rowLosses[r].length, 1260, y + 75, 57, cream);
    });
    const total = sum(rowLosses.flat()),
      n = validCount(padded);
    p.line(139, 727, 1774, 727, '#899e99', 3);
    p.fade(cue(c, 2, 'Their token mean'), () =>
      p.serif(fix(total, 1) + ' / ' + n + ' = ' + fix(total / n, 1) + ' nats per target', 137, 852, 78, mint),
    );
    if (b === 3) p.text('All ignored: 0 nats added, 0 targets added.', 138, 932, 39, light);
  }
}

export const checkpoints = [
  { id: '0400', probs: [0.31, 0.44, 0.18, 0.52, 0.24] },
  { id: '0800', probs: [0.42, 0.59, 0.29, 0.61, 0.35] },
];
export const checkpointPPL = (run) => Math.exp(sum(run.probs.map(surprise)) / run.probs.length);
export const clueShares = [0.8, 0.2];
export function protocol(p, c) {
  p.ground();
  const b = c.beat.beatIndex;
  if (b < 2) {
    p.heading('What changed between the two runs?');
    p.text('Same five held-out targets', 126, 265, 43, dim);
    if (b === 1) p.text('Token PPL', 1740, 271, 36, dim, { align: 'right' });
    checkpoints.forEach((run, r) => {
      const y = 321 + r * 204;
      p.serif(run.id, 127, y + 90, 81);
      run.probs.forEach((prob, i) => {
        const x = 479 + 221 * i;
        p.mono(fix(prob, 2), x + 77, y + 64, 43, ink, center);
        p.rect(x, y + 90, 155, 15, '#c7c6b5');
        p.rect(x, y + 90, prob * 155, 15, r ? teal : blue);
      });
      if (b === 1) p.mono(fix(checkpointPPL(run), 2), 1740, y + 81, 61, r ? teal : blue, { align: 'right' });
    });
    p.line(125, 720, 1762, 720, dim, 2);
    p.text('Same tokenizer, context, stride, boundaries and scored spans', 128, 798, 43, ink);
    p.text('Causal objective   ·   Dropout off   ·   Unmodified logits', 128, 869, 38, dim);
    return;
  }
  p.heading('Can the model still read the clue?');
  const cut = cue(c, 2, 'Now slide the context boundary', 1.8),
    x = mix(154, 917, cut);
  p.stock(123, 308, 1698, 249);
  p.serif('Amber means queued.', 173, 452, 72);
  p.serif('Status of amber?', 987, 452, 77);
  p.fade(cut, () => {
    p.rect(146, 342, 747, 155, '#ebe5d6dc');
    p.serif('Amber means queued.', 173, 452, 72, '#84867b');
  });
  p.line(x, 339, x, 511, teal, 8);
  p.bracket(x, 583, 1733 - x, 'History in view', teal);
  const covered = cut > 0 && cut < 1;
  const share = cut === 1 ? clueShares[1] : clueShares[0];
  p.text('p(queued)', 142, 755, 52);
  p.rect(605, 704, 807, 61, '#cabfa6');
  if (!covered) {
    p.rect(605, 704, 807 * share, 61, teal);
    p.mono(Math.round(share * 100) + '%', 1500, 758, 67, teal);
  }
  p.fade(cue(c, 3, 'Give both checkpoints'), () =>
    p.mono('Extra loss = ln(0.80 / 0.20) ≈ ' + fix(surprise(0.2) - surprise(0.8)) + ' nats', 145, 882, 49),
  );
}

const ticketText = 'Print queue paused';
export const training = [{ id: 101 }, { id: 102 }, { id: 103, text: ticketText }],
  held = [{ id: 103, text: ticketText }, { id: 201 }, { id: 202 }];
export const renamed = { id: 701, text: ticketText };
function ticket(p, x, y, id, body, accent = ink) {
  p.stock(x, y, 715, 138);
  p.mono('#' + id, x + 28, y + 86, 56, accent);
  p.text(body, x + 236, y + 80, 39, ink, { max: 445 });
}
export function provenance(p, c) {
  p.ground();
  const b = c.beat.beatIndex;
  if (b === 2) {
    p.heading('A private core and a fresh challenge');
    p.text('Run', 137, 289, 38, dim);
    p.text('Stable private tickets', 407, 289, 38, dim);
    p.text('Fresh source', 1203, 289, 38, teal);
    for (let r = 0; r < 3; r++) {
      const y = 351 + r * 156;
      p.mono(String(r + 1), 155, y + 70, 54);
      for (const [i, id] of [201, 202, 301 + r].entries()) {
        const x = 380 + i * 398;
        p.stock(x, y, 340, 105, i === 2 ? '#d6e8cf' : cream);
        p.mono('#' + id, x + 170, y + 71, 54, i === 2 ? teal : ink, center);
      }
    }
    p.text('Keep the source, revision and release date with each challenge.', 142, 901, 42, dim);
  } else {
    p.heading(b ? 'What survives a manifest edit?' : 'Find the copy in the holdout');
    const nameChange = cue(c, 0, 'Now give the copy', 0.8),
      deleted = cue(c, 1, 'Deleting the training', 1.3);
    const copy = nameChange > 0.5 ? renamed : held[0];
    p.text('Training manifest', 155, 300, 45, dim);
    p.text('Validation record', 1043, 300, 45, dim);
    p.fade(1 - deleted, () => ticket(p, 148, 356, training[2].id, training[2].text, red));
    if (deleted > 0.6) p.text('Row removed', 196, 449, 49, dim);
    ticket(p, 1033, 356, copy.id, copy.text, nameChange > 0 ? ink : red);
    if (b === 0) {
      const xx = nameChange > 0.5 ? 1268 : 1062;
      p.line(xx, 468, xx + (nameChange > 0.5 ? 381 : 144), 468, red, 6);
      p.line(nameChange > 0.5 ? 384 : 178, 468, nameChange > 0.5 ? 769 : 322, 468, red, 6);
      p.serif(
        nameChange > 0.5 ? 'Same wording under a new ID.' : 'The same ID appears on both records.',
        150,
        734,
        70,
      );
    } else {
      p.rect(152, 590, 1595, 219, '#314d53');
      p.text('Frozen checkpoint', 196, 676, 45, light);
      p.serif('Trained on #103', 197, 765, 69, ochre);
      p.fade(cue(c, 1, 'A new evaluation claim'), () =>
        p.text('Test a fresh independent source.', 937, 748, 46, cream),
      );
    }
  }
}
