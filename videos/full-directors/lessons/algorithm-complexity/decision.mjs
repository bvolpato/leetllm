import { C, count, cue, fmt, letter, names } from './press.mjs';
import { DOCS, TERMS } from '../../../films/algorithm-complexity/fixtures.mjs';
import { budgetFor, rank } from '../../../films/algorithm-complexity/arithmetic.mjs';
import { shortlist } from '../../../films/algorithm-complexity/model.mjs';

export const access = [
  ['Login fixture', 'auth', 'u3'],
  ['Runner clock', 'auth', 'u3'],
  [names[2], 'auth', 'u3'],
  ['Private note', 'auth', 'u1'],
  ['Billing note', 'billing', 'u3'],
];
export const eligible = (r) => r[1] === 'auth' && r[2] === 'u3';
export const tinyPlan = budgetFor(access.filter(eligible).length, 3, 2, 8);
export const plans = [budgetFor(2500, 384, 2), budgetFor(4000, 384, 2), budgetFor(4000, 384, 1)];
export const readings = [2, 3, 4].map((n) => shortlist(n));
export const offlineOrder = rank(DOCS, 'refine');
const idx = (d) => DOCS.findIndex((note) => note.id === d.id);
export const timedRequest = { tokens: 200, observed: 5 };
export const estimate = (rate) => (rate * timedRequest.tokens) / 100;
export function guard(p, t) {
  const b = t.beat.beatIndex + 1;
  if (b <= 3) {
    const checked =
      count(3, cue(t, 1, 'Check both on each row', 1.25)) +
      count(1, cue(t, 2, 'skip it for user three', 0.5)) +
      count(1, cue(t, 2, 'wrong project', 0.5));
    const rows = access.slice(0, checked).filter(eligible).length;
    p.title('Which rows can this reader score?');
    p.label('Request   /   auth project   ·   reader u3', 64, 185);
    ['Note', 'Project', 'Reader', 'Decision'].forEach((v, i) =>
      p.label(v, [66, 370, 528, 664][i], 245),
    );
    access.forEach((r, i) => {
      const y = 275 + i * 72;
      p.rect(63, y, 765, 61, i < checked ? (eligible(r) ? C.mint : C.rose) : C.light);
      r.forEach((s, j) => p.text(s, [78, 370, 535][j], y + 31, 25, C.ink));
      p.mono(i < checked ? (eligible(r) ? 'allow' : 'skip') : '·', 667, y + 31, 23, C.ink);
    });
    p.label('Eligible vectors', 918, 246);
    for (let r = 0; r < rows; r++)
      for (let j = 0; j < tinyPlan.d; j++) p.rect(920 + j * 75, 284 + r * 66, 67, 55, C.mint);
    p.mono(rows + ' × ' + tinyPlan.d + ' = ' + rows * tinyPlan.d, 917, 536, 41, p.fg);
    if (b === 3 && cue(t, 3, 'stop the score pass', 0.65) === 1)
      p.mono('budget 8  /  stop', 917, 610, 25, p.hot);
    p.foot('Checking the project and principal comes before vector scoring.');
    return;
  }
  const drop = cue(t, 7, 'Shrink the winner storage', 0.7) === 1;
  const plan = b <= 5 ? plans[0] : plans[drop ? 2 : 1];
  const resolved =
    b === 4
      ? 0
      : b === 5
        ? cue(t, 5, 'We can release', 0.85)
        : b === 6
          ? cue(t, 6, 'count the score products again', 1.9, {
            captionStart: "Let's count the score products again",
          })
          : 1;
  const { n, d, k, products, budget, within } = plan;
  p.title('Does the score rectangle fit?');
  p.label('Eligible rows × coordinates', 67, 183);
  p.label('Requested work', 884, 189);
  const left = 141,
    bottom = 614,
    height = 330,
    topRow = 4300,
    areaH = (n / topRow) * height,
    budgetY = bottom - (budget / d / topRow) * height;
  const filled = areaH * resolved,
    permitted = bottom - budgetY;
  p.line(left, bottom, left, bottom - height, p.grid, 2);
  p.line(left, bottom, left + 574, bottom, p.grid, 2);
  p.rect(left, bottom - Math.min(filled, permitted), 574, Math.min(filled, permitted), C.pale);
  if (filled > permitted) p.rect(left, bottom - filled, 574, filled - permitted, C.rose);
  p.line(left - 22, budgetY, 789, budgetY, p.hot, 4);
  p.mono('1M cap', 786, budgetY - 22, 21, p.hot, { align: 'right' });
  if (resolved === 1) p.mono(fmt(n), left - 29, bottom - areaH - 15, 22, p.fg, { align: 'right' });
  p.mono(d + ' coordinates', left + 280, 628, 24, p.fg, { align: 'center' });
  p.mono(fmt(n) + ' × ' + d, 885, 255, 38, p.fg);
  p.value(resolved === 1 ? fmt(products) : '?', 'planned multiplications', 880, 362);
  p.label('Citation slots', 887, 504);
  for (let i = 0; i < k; i++) p.tag(i + 1, 888 + i * 106, 541, 88, 68, C.light, C.ink, 28);
  let note = 'Predict the cost of scoring every eligible row.';
  if (resolved === 1)
    note = within
      ? '40,000 products remain. Release the exact scan.'
      : b === 6
        ? 'Would returning one citation move the budget line?'
        : '536,000 over budget. Narrow eligible rows or evaluate an approximate index.';
  p.foot(
    note,
    resolved === 1 ? (within ? 'within budget' : 'reroute before scoring') : 'budget = 1,000,000',
    { raised: true },
  );
}

function latency(p, t) {
  const rateCue = 'At two point six seconds per hundred tokens';
  const answer =
    t.beat.beatIndex === 10
      ? t.reveal(rateCue, t.wordCue('five point two').end - t.wordCue(rateCue).start, {
          captionStart: false,
        })
      : 0;
  const rate = 3 - 0.4 * answer,
    observed = timedRequest.observed;
  const moving = answer > 0 && answer < 1;
  p.title('Which way should the rate move?');
  p.label('One measured request   /   200 tokens', 65, 186);
  const left = 154,
    scale = 159,
    measuredX = left + observed * scale,
    predictedX = left + estimate(rate) * scale;
  p.shape(
    [
      [72, 314],
      [98, 287],
      [1349, 287],
      [1377, 314],
      [1377, 485],
      [1352, 508],
      [72, 508],
    ],
    C.iron,
    C.ink,
    3,
  );
  p.rect(102, 317, 1242, 164, C.light, C.brass, 3);
  p.line(left, 397, left + 7 * scale, 397, C.ink, 3);
  for (let tick = 0; tick <= 35; tick++) {
    const x = left + (scale * tick) / 5,
      isSecond = tick % 5 === 0;
    p.line(x, 397, x, 397 + (isSecond ? 24 : 13), C.ink, isSecond ? 3 : 1.5);
    if (isSecond) p.mono(tick / 5 + ' s', x, 447, 22, C.ink, { align: 'center' });
  }
  p.shape(
    [
      [measuredX - 11, 328],
      [measuredX + 11, 328],
      [measuredX, 393],
    ],
    C.blue,
  );
  p.shape(
    [
      [predictedX - 11, 328],
      [predictedX + 11, 328],
      [predictedX, 393],
    ],
    C.copper,
  );
  p.mono('Measured  ' + observed + ' s', measuredX - 14, 254, 26, p.fg, { align: 'right' });
  p.line(measuredX - 7, 272, measuredX, 323, C.blue, 3);
  const prediction = moving ? 'Prediction' : 'Predicted  ' + Number(estimate(rate).toFixed(2)) + ' s';
  p.mono(prediction, predictedX + 15, 252, 26, p.hot);
  p.line(predictedX + 9, 271, predictedX, 323, C.copper, 3);
  p.mono(moving ? 'Adjusting seconds per 100 tokens' : rate + ' seconds per 100 tokens', 76, 601, 31, p.fg);
  p.text(
    moving
      ? 'Lowering the rate moves the prediction toward the measurement.'
      : answer === 1
        ? 'The prediction error shrinks from 1 second to 0.2 seconds.'
        : 'At the current rate, the prediction is high. Which way would you adjust it?',
    76,
    546,
    31,
    p.fg,
  );
}
function offlinePass(p, t) {
  const live = readings[0];
  const ranked = cue(t, 3, 'C ranks first', 0);
  const second = cue(t, 3, 'A comes second', 0);
  const overlap = cue(t, 3, 'Only A appears', 0);
  const rows = ranked ? offlineOrder : DOCS;
  p.title('Which two notes belong in the reference?');
  p.label('Live citations', 66, 188);
  live.winners.forEach((doc, i) => {
    const y = 235 + i * 92;
    const matches = overlap && live.reference.includes(doc);
    p.card(idx(doc), 66, y, 410, 72, '', matches ? C.mint : C.light);
    p.mono(doc.refine.toFixed(2), 564, y + 38, 32, p.fg, { align: 'right' });
  });
  p.mono(live.refineReads + ' live context reads', 66, 457, 26, p.mid);
  p.line(635, 176, 635, 640, p.grid);
  p.label('Offline pass   /   all four assigned scores', 709, 188);
  rows.forEach((doc, i) => {
    const y = 235 + i * 91;
    const winner = (ranked && i === 0) || (second && i === 1);
    const matched = overlap && live.winners.includes(doc) && winner;
    p.card(idx(doc), 710, y, 365, 69, '', matched ? C.mint : winner ? C.pale : C.light);
    p.mono(doc.refine.toFixed(2), 1187, y + 36, 34, p.fg, { align: 'right' });
    if (winner) p.mono('#' + (i + 1), 1271, y + 36, 34, p.hot);
  });
  if (overlap)
    p.value(live.hits + ' / ' + live.reference.length, 'reference notes recovered', 66, 551);
  p.foot(
    overlap
      ? 'A appears in both answers. C was outside the live shortlist.'
      : second
        ? 'Compare C and A with the two live citations.'
        : 'Which two offline scores are highest?',
  );
}

export function payoff(p, t) {
  const b = t.beat.beatIndex + 1;
  if (b === 3) return offlinePass(p, t);
  if (b >= 10) return latency(p, t);
  const width =
    b < 6
      ? 2
      : b === 6
        ? cue(t, 6, 'Let one more candidate through', 0.85) === 1
          ? 3
          : 2
        : b < 8
          ? 3
          : cue(t, 8, 'Read the release list', 0.75) === 1
            ? 4
            : 3;
  const read = readings[width - 2];
  const online = b >= 2 || cue(t, 1, 'Pass only the two largest', 1.4) === 1;
  const reference = b >= 4;
  const result = online && b >= 2;
  const thirdReadCommitted = cue(t, 6, 'with the login fixture second', 0.55) === 1;
  const committed =
    b === 6 && !thirdReadCommitted
      ? readings[0]
      : b === 8 && cue(t, 8, 'We paid for a fourth read', 0) < 1
        ? readings[1]
        : read;
  p.title(b === 4 ? 'Why did the word count miss card C?' : 'Which extra read earns its cost?');
  if (b === 4) {
    p.strip(72, 208, 708, 420, C.light);
    p.text('C', 109, 299, 88, C.copper, { face: 'Serif' });
    p.text('Issuer config', 210, 298, 54, C.ink, { face: 'Serif' });
    p.line(106, 363, 743, 363, C.rule);
    p.mono('Provider sends', 110, 431, 26, C.muted);
    p.mono('NEW issuer', 451, 431, 30, C.ink);
    p.mono('Verifier expects', 110, 510, 26, C.muted);
    p.mono('OLD issuer', 451, 510, 30, C.ink);
    p.label('Word hits', 891, 242);
    p.value(0, 'login   /   test   /   fail', 887, 336);
    p.label('Assigned context score', 891, 492);
    p.mono(DOCS[2].refine.toFixed(2), 890, 554, 48, p.good);
    p.foot('A verifier mismatch is a lead. Check the failed run’s rejection reason.');
    return;
  }
  p.label('Cheap word counts', 64, 181);
  p.label('Context reads', 626, 181);
  p.label('Live citations', 980, 181);
  DOCS.forEach((doc, i) => {
    const y = 218 + i * 92,
      live = online && read.selected.includes(doc);
    p.card(i, 64, y, 370, 73);
    const hits = TERMS.filter((term) => doc.words.includes(term)).length;
    p.mono(hits, 396, y + 39, 32, C.ink, { align: 'right' });
    p.line(442, y + 38, 553, y + 38, p.grid, 2);
    if (live) {
      p.arrow(555, y + 38, 617, y + 38, p.good);
      p.tag(letter(i) + '     ' + doc.refine.toFixed(2), 633, y + 4, 224, 64, C.mint, C.ink, 28);
    } else {
      p.line(553, y + 26, 553, y + 50, p.hot, 5);
    }
  });
  if (online) {
    p.line(530, 229, 530, 218 + (width - 1) * 92 + 63, p.good, 5);
    p.line(511, 229, 530, 229, p.good, 5);
    p.line(511, 218 + (width - 1) * 92 + 63, 530, 218 + (width - 1) * 92 + 63, p.good, 5);
  }
  if (result) committed.winners.forEach((doc, i) => p.card(idx(doc), 979, 218 + i * 84, 387, 70));
  else for (let i = 0; i < 2; i++) p.rect(979, 218 + i * 84, 387, 70, null, p.grid);
  if (reference) {
    p.label('Offline reference', 980, 429);
    read.reference.forEach((doc, i) => p.card(idx(doc), 979, 460 + i * 79, 387, 65));
  }
  p.mono('4 cheap reads', 65, 640, 23, p.mid);
  p.mono((online ? width : 0) + ' context reads', 628, 640, 23, p.mid);
  if (result && reference) p.mono('Recall@2   ' + committed.hits + ' / 2', 980, 636, 29, p.good);
  const captions = [
    'The cheap reader scores all four allowed notes. The answer has two slots.',
    'How could we check whether the two live reads were enough?',
    'Score all four offline under the same context rule.',
    '',
    'C and D tie on zero word hits. Input order puts C first. Try one more read.',
    thirdReadCommitted
      ? 'Three context reads recover both reference notes in two citations.'
      : 'Widen the shortlist. Keep the answer at two citations.',
    'One note remains outside. Would a fourth read improve recall here?',
    cue(t, 8, 'We paid for a fourth read', 0)
      ? 'The fourth context read buys no extra reference hit on this question.'
      : 'Read D and compare it with the two current citations.',
    'Compare read cost and recall across real questions before choosing a service width.',
  ];
  if (b === 9) p.text(captions[b - 1], 65, 595, 26, p.fg, { max: 879 });
  else p.foot(captions[b - 1]);
}
