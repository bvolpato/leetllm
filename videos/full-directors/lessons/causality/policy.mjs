import assert from 'node:assert/strict';
import {
  clickExposureFixture,
  policyValueFixture,
  replayReplacementFixture,
} from '../../../films/causality/model.mjs';
import {
  C,
  arrow,
  cue,
  dot,
  labelValue,
  line,
  num,
  pct,
  rect,
  rule,
  scale,
  sign,
  slug,
  stamp,
  stock,
  text,
  title,
} from './workshop.mjs';

const fits = {
  matched: policyValueFixture({ rewardShift: 0 }),
  shifted: policyValueFixture(),
  bothWrong: policyValueFixture({ estimatedPropensity: 0.4 }),
  rewardRight: policyValueFixture({ estimatedPropensity: 0.4, rewardShift: 0 }),
};
export function offPolicy(ctx, k) {
  const chosen = cue(k, 2, 'target that always selects assistant'),
    shown = cue(k, 2, 'seventy-percent resolution');
  title(ctx, 'Whose logged rewards count under the target?');
  const f = fits.matched;
  for (const [i, [arm, risk]] of [
    ['assistant', 'low'],
    ['assistant', 'high'],
    ['control', 'high'],
  ].entries()) {
    const row = f.rows.find((r) => r.arm === arm && r.risk === risk);
    const x = 40 + i * 301;
    stock(ctx, x, 133, 280, 236);
    stamp(ctx, row.id.toUpperCase(), x + 17, 164, i === 2 ? C.brassInk : C.blueInk);
    text(
      ctx,
      i === 2 ? 'Human workflow' : 'Assistant workflow',
      x + 18,
      207,
      22,
      C.ink,
      'left',
      'Serif',
    );
    const e = arm === 'assistant' ? row.propensity : 1 - row.propensity;
    text(ctx, 'Logged   ' + pct(e), x + 17, 249, 17, C.ink, 'left', 'Mono');
    text(ctx, 'Reward   ' + Number(row.resolved), x + 17, 279, 17, C.ink, 'left', 'Mono');
    if (chosen)
      text(
        ctx,
        'Ratio   ' + (risk === 'high' && arm === 'assistant' ? '1 / ' + num(e) : num(row.ratio)),
        x + 17,
        335,
        24,
        i === 2 ? C.brassInk : C.blueInk,
        'left',
        'Mono',
      );
  }
  text(
    ctx,
    chosen
      ? 'Always assistant    π(A | risk) = 1'
      : 'Each record keeps context, action, probability and reward.',
    45,
    422,
    21,
    C.cream,
  );
  const newAction = cue(k, 3, 'A new prompt');
  if (shown && !newAction)
    text(
      ctx,
      'Σ ratio × reward  /  200 tickets  =  ' + pct(f.ips),
      45,
      477,
      28,
      C.green,
      'left',
      'Mono',
    );
  if (newAction)
    text(
      ctx,
      'Changed prompt → new action version → no logged reward for that version',
      45,
      480,
      20,
      C.brass,
      'left',
      'Serif',
    );
}
function signedBar(ctx, x, y, amount, domain, width, height, color) {
  const end = x + (amount / domain) * width;
  rect(ctx, Math.min(x, end), y, Math.max(1, Math.abs(end - x)), height, color);
  return end;
}
export function residual(ctx, k) {
  const shifted = cue(k, 1, 'Move both assistant predictions');
  const wrongE = cue(k, 9, 'Set both assistant assignment probabilities');
  const repaired = cue(k, 10, 'restore the observed risk-specific');
  const f = fits[repaired ? 'rewardRight' : wrongE ? 'bothWrong' : shifted ? 'shifted' : 'matched'];
  const failed = f.rows.find((r) => r.arm === 'assistant' && r.risk === 'low' && !r.resolved);
  const mode = k.beat.beatIndex;
  const full = cue(k, 7, 'Bring in the hard tickets');
  title(
    ctx,
    mode < 2
      ? 'A baseline for the always-assistant policy'
      : full
        ? 'Add the corrections to the baseline'
        : 'Open the failed easy ticket',
  );
  if (mode < 2 || full) {
    stock(ctx, 43, 114, 327, 298);
    stamp(ctx, 'MODEL  /  ASSISTANT BY RISK', 63, 153, C.brassInk);
    for (const [i, risk] of ['low', 'high'].entries()) {
      const row = f.rows.find((t) => t.risk === risk && t.arm === 'assistant');
      labelValue(ctx, 62, 211 + i * 75, i ? 'Hard' : 'Easy', pct(row.q), 284);
      text(
        ctx,
        'P(assistant)   ' + pct(1 / row.ratio),
        62,
        237 + i * 75,
        15,
        C.blueInk,
        'left',
        'Mono',
      );
    }
    rule(ctx, 62, 334, 283, '#b7ac91');
    labelValue(ctx, 62, 378, 'Target baseline', pct(f.baseline), 284, C.greenInk);
    if (full) {
      text(ctx, 'Weighted residual sums', 413, 147, 23, C.cream, 'left', 'Serif');
      const origin = 691;
      for (const [i, amount] of f.groupCorrections.entries()) {
        const yy = 211 + i * 67;
        text(ctx, i ? 'Hard' : 'Easy', 413, yy + 10, 17, C.muted);
        line(ctx, origin, yy - 10, origin, yy + 19, C.cream, 2);
        signedBar(ctx, origin, yy - 7, amount, 16, 216, 21, amount < 0 ? C.red : C.green);
        text(ctx, sign(amount, 2), 890, yy + 11, 20, C.ivory, 'right', 'Mono');
      }
      text(ctx, 'Control action: target probability 0', 413, 336, 17, C.cream);
      if (cue(k, 8, 'Average the corrections')) {
        const sum = f.groupCorrections.reduce((a, b) => a + b, 0);
        text(
          ctx,
          pct(f.baseline) +
            '  ' +
            (sum < -0.000001 ? '−' : '+') +
            '  ' +
            num(Math.abs(sum)) +
            ' / 200',
          414,
          398,
          23,
          C.ivory,
          'left',
          'Mono',
        );
        text(ctx, 'Policy value   ' + pct(f.dr, 2), 414, 451, 28, C.green, 'left', 'Serif');
      }
    } else {
      text(ctx, 'Logged contexts', 438, 162, 26, C.ivory, 'left', 'Serif');
      rect(ctx, 438, 208, 224, 68, C.green);
      rect(ctx, 662, 208, 224, 68, C.brass);
      text(ctx, '100 easy', 550, 250, 20, C.ink, 'center');
      text(ctx, '100 hard', 774, 250, 20, C.ink, 'center');
      text(ctx, 'Each prediction gets one vote per ticket.', 438, 326, 19, C.cream);
    }
    return;
  }
  stock(ctx, 42, 110, 339, 242);
  stamp(ctx, failed.id.toUpperCase() + '  /  ASSISTANT', 63, 145, C.blueInk);
  labelValue(ctx, 62, 193, 'Observed reward', '0', 296);
  labelValue(ctx, 62, 239, 'Prediction', num(failed.q), 296);
  labelValue(ctx, 62, 284, 'Target ÷ logger', '1 / 0.1', 296);
  text(ctx, 'Ratio × (observed − predicted)', 418, 154, 22, C.ivory, 'left', 'Serif');
  text(ctx, '10 × (0 − ' + num(failed.q) + ')', 418, 206, 29, C.cream, 'left', 'Mono');
  const reveal = cue(k, 4, 'correction is minus');
  if (reveal) {
    const origin = 827;
    line(ctx, origin, 233, origin, 292, C.cream, 2);
    signedBar(ctx, origin, 248, failed.correction, 10, 363, 30, C.red);
    text(ctx, sign(failed.correction), 465, 313, 24, C.red, 'left', 'Mono');
    if (cue(k, 4, 'whole contribution'))
      text(
        ctx,
        'With baseline    ' + num(failed.q + failed.correction),
        418,
        356,
        23,
        C.ivory,
        'left',
        'Mono',
      );
  }
  if (cue(k, 6, 'Look at the nine')) {
    for (let i = 0; i < 9; i++) slug(ctx, 44 + i * 45, 392, 38, 34, C.green, '½');
    text(ctx, 'Nine successes   +4.5', 43, 460, 20, C.green, 'left', 'Mono');
    text(ctx, 'Easy total   ' + sign(f.groupCorrections[0]), 478, 458, 25, C.ivory, 'left', 'Mono');
  } else if (!reveal)
    text(
      ctx,
      'What signed correction does this ticket add?',
      480,
      442,
      26,
      C.brass,
      'center',
      'Serif',
    );
}
export function errorArea(ctx, k) {
  const rightE =
    cue(k, 2, 'logging probabilities are right') && !cue(k, 2, 'When both models miss');
  const rightQ = cue(k, 5, 'match the reward predictions');
  const row = fits[rightQ ? 'rewardRight' : rightE ? 'shifted' : 'bothWrong'].rows.find(
    (t) => t.risk === 'low' && t.arm === 'assistant',
  );
  const width = 1 - row.propensity * row.ratio,
    height = row.q - 0.9;
  title(ctx, 'Bias contribution for the easy assistant action');
  const x = 92,
    y = 382,
    w = (374 * width) / 0.75,
    h = (181 * height) / 0.05;
  arrow(ctx, x, y, x, 126, C.muted, 2);
  arrow(ctx, x, y, 527, y, C.muted, 2);
  if (w > 0 && h > 0) rect(ctx, x + 1, y - h, w, h, C.brass);
  line(ctx, x, y - h, x + w, y - h, C.brass, 3);
  line(ctx, x + w, y - h, x + w, y, C.brass, 3);
  text(ctx, 'Reward error', 48, 106, 18, C.cream);
  text(ctx, 'Weighting error', 267, 420, 18, C.cream);
  stock(ctx, 565, 136, 347, 247);
  stamp(ctx, 'EASY  /  LOGGING CHANCE 0.10', 584, 173, C.blueInk);
  labelValue(ctx, 583, 221, '1 − e / ê', num(width), 310);
  labelValue(ctx, 583, 267, 'Q̂ − Q', num(height), 310);
  labelValue(ctx, 583, 327, 'Signed product', num(width * height, 4), 310, C.brassInk);
  if (cue(k, 3, 'Fit on one sample'))
    text(
      ctx,
      'Fit on other tickets   →   evaluate on held-out outcomes',
      480,
      476,
      20,
      C.cream,
      'center',
    );
  if (cue(k, 6, 'always went to the assistant')) {
    rect(ctx, 29, 448, 902, 58, C.deep, 3);
    text(
      ctx,
      'Without control support, these models cannot identify the missing comparison.',
      480,
      482,
      18,
      C.brass,
      'center',
    );
  }
}
function trail(ctx, k) {
  const matched = cue(k, 3, 'Identical target and logging policies');
  const ratios = matched ? [1, 1] : [2, 0.5],
    product = ratios.reduce((v, r) => v * r, 1);
  const labels = ['Ticket arrives', 'Reply drafted', 'Escalated to staff'];
  title(ctx, 'Follow a single logged history');
  labels.forEach((name, i) => {
    const x = 41 + i * 311;
    stock(ctx, x, 190, 252, 122, i === 1 ? '#d3e3d5' : C.ivory);
    stamp(
      ctx,
      i === 0 ? 'CONTEXT' : i === 1 ? 'AFTER DRAFT' : 'AFTER ESCALATION',
      x + 16,
      220,
      C.blueInk,
    );
    text(ctx, name, x + 16, 270, 23, C.ink, 'left', 'Serif');
    if (i < 2) arrow(ctx, x + 255, 251, x + 305, 251);
  });
  for (let i = 0; i < 2; i++)
    text(ctx, '× ' + num(ratios[i]), 320 + i * 311, 165, 24, C.brass, 'center', 'Mono');
  if (cue(k, 2, 'Multiply the conditional ratios'))
    text(
      ctx,
      'Trajectory weight    ' + ratios.map((v) => num(v)).join(' × ') + ' = ' + product,
      480,
      404,
      27,
      C.ivory,
      'center',
      'Mono',
    );
  if (cue(k, 3, 'future value'))
    text(
      ctx,
      'Sequential DR also carries future value and per-step corrections.',
      480,
      467,
      19,
      C.cream,
      'center',
    );
}
function clicks(ctx, k) {
  const more = cue(k, 2, 'assume forty examinations');
  const f = clickExposureFixture(more ? 0.4 : 0.2);
  const showExam = cue(k, 1, 'twenty readers'),
    showClicks = cue(k, 1, 'twelve clicks');
  const examined = showExam ? Math.round(100 * f.usedExamination) : 0,
    clickCount = showClicks ? Math.round(100 * f.click) : 0;
  title(ctx, 'Who got a chance to click?');
  for (let i = 0; i < 100; i++) {
    const xx = 52 + (i % 10) * 40,
      yy = 111 + Math.floor(i / 10) * 32;
    slug(
      ctx,
      xx,
      yy,
      33,
      24,
      i < clickCount ? C.green : i < examined ? C.brass : C.edge,
      i < clickCount ? '✓' : '',
    );
  }
  text(ctx, '100 impressions of one result', 51, 464, 21, C.cream, 'left', 'Serif');
  stock(ctx, 505, 118, 402, 295);
  stamp(ctx, 'POSITION-BASED CLICK MODEL', 526, 154, C.brassInk);
  labelValue(ctx, 526, 211, 'Expected clicks', showClicks ? clickCount : '?', 357, C.greenInk);
  labelValue(ctx, 526, 257, 'Assumed examinations', showExam ? examined : '?', 357, C.brassInk);
  const known = more ? cue(k, 3, 'Thirty percent') : cue(k, 1, 'six in ten');
  if (known)
    labelValue(
      ctx,
      526,
      328,
      k.beat.beatIndex === 0 ? 'Assumed relevance' : 'Implied relevance',
      pct(f.corrected),
      357,
    );
  else if (more) text(ctx, 'Which relevance fits?', 526, 329, 25, C.ink, 'left', 'Serif');
  if (k.beat.beatIndex === 3)
    text(ctx, 'Rank can also change trust after examination.', 505, 466, 18, C.brass);
}
function replay(ctx, k) {
  const replaced = cue(k, 2, 'Replace the returned two'),
    computed = cue(k, 3, 'Recompute the double');
  const f = replayReplacementFixture(replaced ? 4 : 2);
  const pending = replaced && !computed;
  title(ctx, 'Replay from the saved tool boundary');
  const labels = ['Tool 2 returns', 'Step 4 doubles', 'Step 5 tests ≥ 6'];
  const vals = [
    String(f.returned),
    pending ? '?' : String(f.doubled),
    pending ? 'Pending' : f.success ? 'Success' : 'Failure',
  ];
  for (let i = 0; i < 3; i++) {
    const x = 46 + i * 308;
    stock(
      ctx,
      x,
      143,
      250,
      210,
      i === 2 && !pending ? (f.success ? '#c0ddbc' : '#e8c8b4') : C.ivory,
    );
    stamp(ctx, ['RETURN VALUE', 'DEPENDENT STATE', 'OUTCOME'][i], x + 17, 180, C.brassInk);
    text(ctx, labels[i], x + 16, 229, 21, C.ink, 'left', 'Serif');
    text(ctx, vals[i], x + 122, 314, i < 2 ? 54 : 32, C.ink, 'center', 'Mono');
    if (i < 2) arrow(ctx, x + 253, 249, x + 300, 249, pending ? C.muted : C.brass);
  }
  text(
    ctx,
    pending
      ? 'Downstream work awaits recomputation.'
      : computed
        ? 'Changed return in this replay environment'
        : 'Same snapshot  •  same randomness policy',
    480,
    423,
    22,
    C.cream,
    'center',
    'Serif',
  );
}
export const evaluation = {
  c20: offPolicy,
  c21: residual,
  c22: errorArea,
  c23: trail,
  c24: clicks,
  c25: replay,
};
export function checkEvaluation() {
  const f = fits.shifted,
    t = f.rows.find((r) => r.risk === 'low' && r.arm === 'assistant' && !r.resolved);
  assert.deepEqual(
    [t.ratio, t.q, t.correction, t.q + t.correction].map((v) => num(v)),
    ['10', '0.95', '-9.5', '-8.55'],
  );
  for (const [key, values] of Object.entries({
    shifted: [0.75, -0.05, 0.7],
    bothWrong: [0.75, -0.0625, 0.6875],
    rewardRight: [0.7, 0, 0.7],
  })) {
    const p = fits[key];
    assert.deepEqual(
      [p.baseline, p.correction, p.dr].map((v) => Number(v.toFixed(6)) || 0),
      values,
    );
  }
  assert.deepEqual(
    f.groupCorrections.map((v) => Math.round(v)),
    [-5, -5],
  );
  assert.equal(num(fits.matched.ips), '0.7');
  assert.deepEqual(
    [0.2, 0.4].map((v) => pct(clickExposureFixture(v).corrected)),
    ['60%', '30%'],
  );
  for (const [v, d, s] of [
    [2, 4, false],
    [4, 8, true],
  ]) {
    const r = replayReplacementFixture(v);
    assert.equal(r.doubled, d);
    assert.equal(r.success, s);
  }
}
