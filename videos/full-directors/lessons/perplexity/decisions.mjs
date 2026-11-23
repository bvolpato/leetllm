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
  loss,
  cat,
  rain,
  bytes,
  rate,
  cue,
  afterPhrase,
  center,
  typeRow,
} from './studio.mjs';

export const reportFor = (total, count) => {
  if (!Number.isSafeInteger(count) || count < 0) return 'invalid count';
  if (count === 0) return 'undefined mean';
  if (Number.isNaN(total) || total < 0) return 'invalid loss';
  if (total === Infinity) return 'infinite loss';
  const mean = total / count,
    ppl = Math.exp(mean);
  return { mean, ppl };
};
const archive = { A: ['Doc 1', 'Doc 2'], B: ['Doc 3'] };
const pairedLosses = { 'Doc 1': [2, 1.4, 2], 'Doc 2': [1, 1.2, 1], 'Doc 3': [1.6, 1.8, 2] };
export const resample = (ids) => ids.flatMap((id) => archive[id]);
export function pairedDraw(ids) {
  const docs = resample(ids).map((key) => pairedLosses[key]);
  const totals = [0, 1, 2].map((i) => sum(docs.map((d) => d[i])));
  return { totals, difference: (totals[1] - totals[0]) / totals[2] };
}
export function report(p, c) {
  const b = c.beat.beatIndex;
  p.ground();
  if (b <= 1) {
    p.heading('Rebuild a score from its run record');
    const total = loss(cat.probs),
      count = cat.probs.length,
      result = reportFor(total, count);
    p.stock(134, 225, 1640, 635);
    p.text('Held-out line', 192, 316, 37, dim);
    p.impression('The cat sat on the mat', 193, 422, 82);
    p.line(192, 466, 1708, 466, '#b9b3a0');
    p.mono('Σ loss ≈ ' + fix(total) + ' nats', 193, 565, 52);
    p.mono('N = ' + count, 978, 565, 52);
    p.text('on   /   the   /   mat', 1250, 562, 34, teal);
    p.fade(cue(c, 0, 'our two point nine two', 1.7), () =>
      p.serif('exp(total / N) ≈ ' + fix(result.ppl, 2), 193, 704, 71, teal),
    );
    if (b === 1)
      p.text(
        'Checkpoint revision   ·   Corpus revision   ·   Scoring settings   ·   Overlap audit',
        195,
        801,
        37,
        dim,
      );
  } else if (b <= 3) {
    p.heading('Read the failure before you publish');
    const rows =
      b === 2
        ? [
            ['Count', 'true, 1.5, −1', reportFor(2, -1)],
            ['Count', '0', reportFor(0, 0)],
            ['Loss', 'NaN', reportFor(NaN, 3)],
          ]
        : [
            ['Target share', '0', reportFor(Infinity, 1)],
            ['Mean loss', '1,000 nats', 'finite loss'],
            ['exp(1000)', 'out of range', 'keep 1,000 nats'],
          ];
    rows.forEach(([field, value, result], i) => {
      const y = 280 + i * 178;
      p.text(field, 138, y + 62, 43, dim);
      p.mono(value, 610, y + 67, 53, ink);
      p.line(1122, y + 43, 1193, y + 43, gold, 4);
      p.serif(result, 1230, y + 69, 55, i === 2 && b === 3 ? teal : red, { max: 540 });
      p.line(137, y + 111, 1770, y + 111, '#beb7a3', 2);
    });
  } else if (b === 4) {
    p.heading('Which observations travel together?');
    p.text('Each document carries both loss totals and its target count.', 142, 247, 41, dim);
    const ids = ['A', 'B'];
    ids.forEach((id, i) => {
      const x = 145 + i * 847;
      p.stock(x, 288, 750, 258);
      p.text('Source ' + id, x + 34, 353, 42, i ? blue : teal);
      p.text('NLL 1     NLL 2     Targets', x + 300, 353, 30, dim);
      archive[id].forEach((doc, k) => {
        const y = 428 + k * 71;
        p.mono(doc, x + 34, y, 42);
        pairedLosses[doc].forEach((v, j) =>
          p.mono(j === 2 ? v : fix(v, 1), x + 350 + 127 * j, y, 40, ink, center),
        );
      });
    });
    p.fade(cue(c, 4, 'Draw A twice', 1), () => {
      p.text('Draw A twice', 147, 614, 38, dim);
      resample(['A', 'A']).forEach((doc, i) => {
        const x = 154 + 405 * i;
        p.stock(x, 677, 363, 109, '#dce8d4');
        p.mono(doc, x + 181, 753, 49, teal, center);
      });
      p.bracket(154, 806, 766, '', teal);
      p.bracket(964, 806, 766, '', teal);
      const { totals, difference } = pairedDraw(['A', 'A']);
      p.fade(cue(c, 4, 'Pool each checkpoint'), () =>
        p.mono(
          'Mean loss difference = (' +
            fix(totals[1], 1) +
            ' − ' +
            fix(totals[0], 1) +
            ') / ' +
            totals[2] +
            ' ≈ ' +
            fix(difference) +
            ' nats',
          149,
          910,
          42,
          teal,
        ),
      );
    });
  } else {
    p.heading('Does the judge follow the evidence?');
    p.stock(129, 239, 1651, 152);
    p.text('Job record', 171, 333, 46, dim);
    p.serif('queued', 695, 342, 73);
    const swap = cue(c, 5, 'Now swap the answers', 1.5);
    const wordier = cue(c, 6, 'a wordier version', 0.7);
    const answers = [
      ['A', wordier > 0.5 ? 'This job is still waiting in the queue.' : 'It is waiting.'],
      ['B', 'It finished.'],
    ];
    answers.forEach(([id, body], i) => {
      const x = 147 + 835 * mix(i, 1 - i, swap),
        y = 495 + (i === 0 ? -44 : 44) * Math.sin(swap * Math.PI);
      p.stock(x, y, 771, 222);
      p.mono(id, x + 37, y + 66, 43, i ? red : teal);
      p.serif(body, x + 37, y + 158, 60, ink, { max: 697 });
    });
    p.text('Read the claim against the job record.', 152, 844, 49);
  }
}

export const policy = { status: 'blocked', source: 'policy 483', action: 'off' };
export const incidentAnswers = [
  { name: 'A', ppl: 8.9, status: 'blocked', source: 'runbook', action: 'on' },
  { name: 'B', ppl: 9.8, status: 'blocked', source: 'policy 483', action: 'off' },
];
export const job = { status: 'queued', source: 'job 612', action: 'off' };
export const jobAnswers = [
  { name: 'Cedar', ppl: 7.6, status: 'queued', source: 'job 611', action: 'on' },
  { name: 'Pine', ppl: 8.1, status: 'queued', source: 'job 612', action: 'off' },
];
const keys = ['status', 'source', 'action'];
export const matching = (answer, contract) => keys.map((k) => answer[k] === contract[k]);
function tick(p, x, y, pass) {
  const color = pass ? teal : red;
  p.circle(x, y, 22, null, color, 3);
  if (pass) {
    p.line(x - 11, y, x - 3, y + 7, color, 4);
    p.line(x - 3, y + 7, x + 11, y - 9, color, 4);
  } else {
    p.line(x - 8, y - 8, x + 8, y + 8, color, 4);
    p.line(x - 8, y + 8, x + 8, y - 8, color, 4);
  }
}

export function incident(p, c) {
  p.ground();
  p.heading('Which reply meets the incident policy?');
  p.stock(126, 224, 1668, 143, '#d7e7d1');
  p.text('Policy 483', 169, 312, 49, teal);
  p.serif('Blocked. Cite this policy. Rollback off.', 547, 319, 59, ink);
  const b = c.beat.beatIndex;
  incidentAnswers.forEach((answer, i) => {
    if (i === 1 && b === 0) return;
    const x = 144 + i * 842,
      y = 422,
      w = 784,
      checks = matching(answer, policy);
    p.stock(x, y, w, 410);
    p.serif('Reply ' + answer.name, x + 38, y + 85, 65);
    p.mono('PPL ' + fix(answer.ppl, 1), x + w - 33, y + 78, 39, dim, { align: 'right' });
    p.line(x + 36, y + 117, x + w - 34, y + 117, '#b8b7a8');
    keys.forEach((key, j) => {
      const yy = y + 185 + j * 79;
      p.text(['Status', 'Citation', 'Rollback'][j], x + 39, yy, 36, dim);
      p.mono(answer[key], x + 303, yy, 46);
      p.fade(cue(c, 2, 'It passes all three checks'), () => tick(p, x + w - 68, yy - 14, checks[j]));
    });
    if (b === 2 && cue(c, 2, 'A got the status right') > 0.4)
      p.text(
        checks.filter(Boolean).length + ' of 3 checks pass',
        x + 36,
        905,
        44,
        checks.every(Boolean) ? teal : red,
      );
  });
}
export function exportJob(p, c) {
  p.ground(true);
  p.heading('Export queue  /  job 612', true);
  p.text('Trusted record', 128, 294, 47, light);
  const cols = [
    ['Status', job.status],
    ['Source', job.source],
    ['Auto-delete', job.action],
  ];
  cols.forEach(([field, value], i) => {
    const x = 667 + i * 391;
    p.text(field, x, 249, 33, mint);
    p.mono(value, x, 329, 59, cream);
  });
  p.line(133, 385, 1781, 385, ochre, 5);
  jobAnswers.forEach((answer, r) => {
    const y = 465 + r * 216,
      checks = matching(answer, job);
    p.stock(131, y, 1650, 170);
    p.serif(answer.name, 174, y + 80, 67);
    p.text('Held-out PPL ' + fix(answer.ppl, 1), 177, y + 133, 34, dim);
    keys.forEach((key, i) => {
      const x = 667 + i * 391;
      p.mono(answer[key], x, y + 86, 52);
      const seen = r ? cue(c, 1, 'That qualifies Pine') : cue(c, 1, 'Pine cited');
      p.fade(seen, () => tick(p, x + 23, y + 131, checks[i]));
    });
  });
  p.fade(cue(c, 1, 'That qualifies Pine'), () =>
    p.text('Pine meets the three requirements for this job.', 137, 939, 44, mint),
  );
}
export function byteContest(p, c) {
  const b = c.beat.beatIndex;
  const len = bytes(rain.line);
  const start = 418;
  const cell = 91;
  const width = len * cell;
  const end = start + width;
  const useBytes = cue(c, 3, 'Use the same fourteen bytes');
  const showCount = afterPhrase(c, 3, 'Use the same fourteen bytes for both rows', false);
  const showBits = afterPhrase(c, 3, 'Divide each loss by the natural log of two to get bits');
  const divide = cue(c, 3, 'Now divide both');
  const showWinner = afterPhrase(
    c,
    4,
    'Across the same fourteen bytes, the subword model spent fewer bits on this line',
    'the subword model spent fewer bits',
  );
  const showLoss = [
    afterPhrase(c, 1, 'The subword model spent eight point four nats'),
    afterPhrase(c, 1, 'The character model spent nine'),
  ];
  const showPPL = [
    afterPhrase(c, 1, 'eight point one seven'),
    afterPhrase(c, 1, 'one point nine zero', 'and one point nine zero'),
  ];
  const showBPB = [
    afterPhrase(c, 3, 'about point eight six six bits per byte'),
    afterPhrase(c, 3, 'about point nine two seven'),
  ];
  p.ground();
  p.heading('Two ways to read “Rain falls now”');
  p.text('Beginning marker supplied   ·   Full prefix visible', 129, 244, 38, dim);
  const readings = rain.readings.map((run) => ({
    ...run,
    tokenPPL: Math.exp(run.nats / run.pieces.length),
    bpb: rate(run.nats, len),
  }));
  const lowerPPL = readings.reduce((a, b) => (a.tokenPPL <= b.tokenPPL ? a : b));
  const lowerBPB = readings.reduce((a, b) => (a.bpb <= b.bpb ? a : b));
  const bitsPerByteScale = Math.ceil(Math.max(...readings.map((run) => run.bpb)));
  for (const [i, run] of readings.entries()) {
    const y = 312 + i * 270;
    const color = i ? blue : teal;
    p.serif(run.name, 124, y + 59, 59);
    if (showLoss[i]) p.mono(fix(run.nats, 1) + ' nats', 128, y + 122, 40, dim);
    const cut = cue(c, 0, i ? 'The character tokenizer cuts' : 'The subword tokenizer makes', 1);
    typeRow(p, cut ? run.pieces : [rain.line], start, y, cell, {
      font: 61,
      height: 99,
      color,
    });
    if (b <= 2) {
      p.fade(cut, () => p.text(run.pieces.length + ' scored tokens', start, y + 165, 39, color));
      if (showPPL[i]) {
        p.mono('token PPL ' + fix(run.tokenPPL, 2), end, y + 175, 48, ink, { align: 'right' });
      }
      if (run === lowerPPL) {
        p.fade(cue(c, 1, 'Your colleague circles'), () => {
          p.ctx.beginPath();
          p.ctx.ellipse(end - 59, y + 159, 87, 42, -0.09, 0, Math.PI * 2);
          p.ctx.strokeStyle = red;
          p.ctx.lineWidth = 4;
          p.ctx.stroke();
        });
      }
    } else {
      p.fade(useBytes, () => {
        p.bracket(start, y + 124, width, '', dim);
        for (let j = 1; j < len; j++) {
          const x = start + j * cell;
          p.line(x, y + 113, x, y + 124, dim, 2);
        }
      });
      if (showCount) {
        const bits = '≈ ' + fix(run.nats / Math.LN2, 2) + ' bits';
        const calculation = divide ? bits + ' ÷ ' + len + ' bytes' : bits;
        p.mono(showBits ? calculation : len + ' UTF-8 bytes', start, y + 184, 43);
      }
      if (showBPB[i]) {
        const barY = y + 204;
        const barWidth = (run.bpb / bitsPerByteScale) * width;
        p.rect(start, barY, width, 13, '#cec9b6');
        p.rect(start, barY, barWidth, 13, color);
        p.line(start + barWidth, barY - 5, start + barWidth, barY + 18, color, 3);
        p.mono('≈ ' + fix(run.bpb) + ' bits / byte', end, y + 184, 48, color, { align: 'right' });
      }
    }
  }
  if (b === 2) p.serif('What if each model paid by the byte?', 125, 925, 65, red);
  if (showWinner)
    p.serif(lowerBPB.name + ' spent fewer bits across the same ' + len + ' bytes.', 125, 931, 62, teal);
}
