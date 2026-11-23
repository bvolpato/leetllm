import {
  PersistedExperiment,
  draftConstruction,
  draftClicks,
  adjustedFamily,
  plannedLooks,
  assignmentResidual,
} from '../../../films/ab-testing-online-evaluation-llms/model.mjs';
import { outcomes } from '../../../films/ab-testing-online-evaluation-llms/fixtures.mjs';
import {
  ink,
  paper,
  white,
  mute,
  aInk,
  bInk,
  warn,
  gold,
  pale,
  aPale,
  bPale,
  redPale,
  text,
  rect,
  line,
  dot,
  arrow,
  label,
  note,
  sheet,
  browser,
  person,
  table,
  ruler,
  pct,
  nfmt,
} from './studio.mjs';

export const assignedRows = outcomes.map((r) => ({ ...r, arm: r.assigned === 'C' ? 'A' : 'B' }));
function assigned(c, s) {
  const seen = s.on(1),
    done = s.on(2);
  const rows = assignedRows.map((r) => [
    r.id,
    r.arm,
    seen ? { C: 'A', T: 'B', timeout: 'Timed out' }[r.served] : 'Pending',
    seen ? (r.y ? 'Resolved' : 'Failed') : 'Pending',
  ]);
  table(c, {
    widths: [280, 420, 475, 520],
    heads: ['User', 'Assigned prompt', 'Actually served', 'Mature outcome'],
    rows,
    step: 77,
    highlights: rows.map((r, i) => (i === 4 || i === 5 ? (seen ? redPale : bPale) : '')),
  });
  if (done) {
    const treated = assignedRows.filter((r) => r.arm === 'B'),
      served = treated.filter((r) => r.served === 'T');
    text(
      c,
      'Assigned B   ' + treated.filter((r) => r.y).length + ' / ' + treated.length,
      120,
      823,
      43,
      bInk,
    );
    text(
      c,
      'Served B only   ' + served.filter((r) => r.y).length + ' / ' + served.length,
      965,
      823,
      43,
      warn,
    );
  }
  note(
    c,
    done
      ? 'The served-only filter drops the fallback and the timeout.'
      : 'Follow the assigned user through each turn, fallback and outcome.',
  );
}
function pointer(c, x, y, col) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + 11, y + 42);
  c.lineTo(x + 19, y + 27);
  c.lineTo(x + 37, y + 25);
  c.closePath();
  c.fillStyle = col;
  c.fill();
  c.strokeStyle = white;
  c.lineWidth = 3;
  c.stroke();
}
function poolPoster(c, x, y, w, h, title, author) {
  rect(c, x, y, w, h, '#203856', 5);
  dot(c, x + w * 0.88, y + h * 0.24, h * 0.12, '#f3d7a2');
  rect(c, x, y + h * 0.56, w, h * 0.44, '#42959a');
  for (let i = 0; i < 7; i++)
    line(c, x + 28 + i * 93, y + h * 0.76, x + 75 + i * 93, y + h * 0.76, '#a7d5bc', 4);
  text(c, title, x + 25, y + 68, 46, white, { family: 'Serif', width: w - 115 });
  if (author) text(c, author, x + 25, y + h - 20, 27, white, { weight: 600 });
}
function spillover(c, s) {
  const club = s.b >= 2;
  const edit = s.on(0);
  const names = club
    ? ['East Pool  /  club assigned A', 'West Pool  /  club assigned B']
    : ['Jo  /  assigned A', 'Mara  /  assigned B'];
  names.forEach((v, i) => {
    let x = 105 + 878 * i;
    browser(c, x, 240, 820, 485, v);
    poolPoster(
      c,
      x + 36,
      349,
      748,
      241,
      club ? ['Morning Dip', 'Moon Pool'][i] : edit ? 'Night Swim' : 'Swimming after sundown',
      club ? '' : edit ? 'Edited by Mara' : 'North Pool',
    );
    if (!club) pointer(c, x + (i ? 430 + 100 * s.p(0) : 559), i ? 485 : 540, i ? bInk : aInk);
    text(
      c,
      club
        ? i
          ? 'Independent workspace'
          : s.b > 2 || s.ramp('and again at thirty-two', 0.65) === 1
            ? 'Exports   18 min  •  32 min'
            : s.ramp('East Pool exports', 0.65) === 1
              ? 'Exports   18 min'
              : 'Waiting for exports'
        : i
          ? 'Edit suggestion'
          : s.on(1)
            ? 'Export recorded for Jo in A'
            : 'Jo’s pointer is idle',
      x + 37,
      663,
      34,
      i ? bInk : aInk,
    );
  });
  if (club && (s.b > 2 || s.ramp('that counts as one success', 1.4) === 1))
    label(c, 'East Pool meets the one-hour deadline once.', 125, 814, bInk);
  note(
    c,
    club
      ? 'Count the assigned clubs. Weight and analyze outcomes at the planned unit.'
      : s.on(1)
        ? 'Jo’s export counts in A. The new headline came from B.'
        : 'If Jo exports this poster, which arm records the outcome?',
  );
}
const route = new PersistedExperiment();
export const first = route.assign('docs-prompt-v1', 'thread-7', 0.1);
export const returns = Array.from({ length: 3 }, () =>
  route.assign('docs-prompt-v1', 'thread-7', 0.5),
);
function router(c, s) {
  label(c, 'New-thread threshold     /     docs-prompt-v1', 115, 254);
  const at = ruler(c, 170, 435, 1510, 0, 1, [0, 0.1, 0.25, 0.5, 0.75, 1], (v) => pct(v, 0));
  const t = 0.1 + 0.4 * s.p(1);
  rect(c, at(0), 368, at(t) - at(0), 42, bPale, 3);
  rect(c, at(t), 368, at(1) - at(t), 42, aPale, 3);
  line(c, at(t), 330, at(t), 435, ink, 4);
  dot(c, at(first.fraction), 386, 15, ink);
  text(c, 'thread-7   ' + first.fraction.toFixed(6), at(first.fraction), 308, 34, ink, {
    family: 'Mono',
  });
  sheet(c, 140, 562, 1580, 231, 'Persisted assignment   /   docs-prompt-v1 + thread-7', aInk);
  text(c, 'Turn 1   ' + (first.assigned === 'C' ? 'A' : 'B'), 200, 732, 43, aInk);
  if (s.on(2))
    returns.forEach((v, i) =>
      text(
        c,
        'Turn ' + (i + 2) + '   ' + (v.assigned === 'C' ? 'A' : 'B'),
        552 + i * 362,
        732,
        42,
        aInk,
      ),
    );
  note(
    c,
    s.on(2)
      ? 'The stored key wins on every return. Log actual service separately.'
      : 'A threshold change applies to new assignments.',
  );
}
function shadow(c, s) {
  const canary = s.b >= 2,
    readOnly = s.on(1);
  const x = 162,
    split = 565,
    y = 542;
  person(c, x, y, ink, canary ? '↕' : '?');
  label(c, canary ? 'Eligible users' : 'Live request', x - 76, y + 100);
  line(c, x + 50, y, split, y, ink, 5);
  for (const [i, cy] of [368, 684].entries()) {
    line(c, split, y, split, cy, ink, 4);
    arrow(c, split, cy, 805, cy, i ? bInk : aInk);
    rect(c, 820, cy - 55, 283, 110, i ? bPale : aPale, 16);
    text(c, i ? 'Candidate B' : 'Control A', 961, cy + 16, 37, i ? bInk : aInk, {
      align: 'center',
    });
    arrow(c, 1120, cy, 1300, cy, i ? bInk : aInk);
    text(
      c,
      i ? (canary ? 'Canary users' : 'Shadow record') : canary ? 'Other users' : 'User’s reply',
      1340,
      cy + 15,
      43,
      ink,
    );
    if (i && !canary && readOnly) {
      line(c, 960, cy + 65, 960, cy + 123, warn, 4);
      line(c, 942, cy + 123, 978, cy + 123, warn, 7);
      label(c, 'Write blocked', 835, cy + 167, warn);
    }
    if (i && readOnly)
      label(
        c,
        canary ? 'Declared eligible subset' : 'Read-only  •  separate budget',
        1190,
        cy + 106,
      );
  }
  label(
    c,
    canary ? 'Exposure step   /   canary' : 'Mirrored traffic   /   control serves the user',
    112,
    248,
  );
  note(
    c,
    canary
      ? 'Compare warm and cold service. Shared queues can still couple both arms.'
      : readOnly
        ? 'A shadow response can be hidden while its side effects still reach users.'
        : 'The same request travels down two paths. Only one returns to the user.',
  );
}
export const lists = [
  ['Retry', 'Rate limit', 'Idempotency', 'Backoff', 'Gateway'],
  ['Rate limit', 'Retry', 'Timeout', 'Backoff', 'Auth'],
];
export const ranking = draftConstruction(...lists),
  clicks = ['Retry', 'Idempotency', 'Timeout'],
  votes = draftClicks(ranking, clicks);
const exhausted = draftConstruction(['Shared'], ['Shared', 'B only 1', 'B only 2'], 3, ['A']);
function rankingScene(c, s) {
  const second = s.b === 3 && s.ramp('separate exhaustion case', 0.4) === 1;
  const d = second ? exhausted : ranking;
  const inputs = second ? [['Shared'], ['Shared', 'B only 1', 'B only 2']] : lists;
  [0, 1].forEach((i) => {
    const x = i ? 1370 : 102;
    label(c, 'Ranker ' + (i ? 'B' : 'A'), x, 280, i ? bInk : aInk);
    inputs[i].forEach((v, j) => {
      text(c, v, x, 390 + j * 78, 32, ink, { width: 380 });
      line(c, x, 408 + j * 78, x + 360, 408 + j * 78, pale, 3);
    });
  });
  sheet(c, 567, 228, 690, 587, second ? 'One list after exhaustion' : 'One displayed list', ink);
  const n = second
    ? d.rows.length
    : s.b === 0
      ? 0
      : s.b === 1
        ? Math.min(5, 1 + Math.floor(4 * s.ramp('A takes retry', 2.5)))
        : 5;
  d.rows.slice(0, n).forEach((r, i) => {
    const col = r.owner === 'A' ? aInk : r.owner === 'B' ? bInk : mute,
      y = 362 + i * 87;
    rect(c, 610, y - 38, 105, 57, r.owner === 'A' ? aPale : r.owner === 'B' ? bPale : pale, 6);
    text(c, r.owner ?? 'Neutral', 662, y + 3, 31, col, { align: 'center', width: 94 });
    text(c, r.id, 753, y + 2, 36);
    if (!second && s.b >= 2 && clicks.includes(r.id)) dot(c, 1198, y - 10, 12, gold);
  });
  note(
    c,
    second
      ? 'Shared-prefix clicks are neutral. Continuing B alone changes exposure.'
      : s.on(3)
        ? 'Owned clicks: A ' + votes.A + '  •  B ' + votes.B + '  →  one query win for A.'
        : s.b >= 2
          ? 'Gold dots mark clicks. Trace each dot to its contributing ranker.'
          : 'Skip seen document IDs. Keep the owner on the displayed item.',
  );
}
export const family = adjustedFamily([0.001, 0.02, 0.12, 0.42]);
function familyScene(c, s) {
  if (s.b === 0) {
    label(c, 'Twenty independent true nulls   /   5% per test', 120, 266);
    for (let i = 0; i < 20; i++) {
      const x = 140 + (i % 10) * 164,
        y = 366 + Math.floor(i / 10) * 145;
      rect(c, x, y, 127, 84, aPale, 7);
      rect(c, x + 120, y, 7, 84, warn);
      text(c, String(i + 1), x + 64, y + 58, 38, aInk, { align: 'center' });
    }
    if (s.on(0))
      text(c, '1 − 0.95²⁰ = ' + pct(1 - 0.95 ** 20, 1), 130, 762, 54, ink, { family: 'Serif' });
  } else {
    const scanned = s.b > 2 ? 4 : s.b === 2 ? Math.floor(4 * s.ramp('Work backward', 1.8)) : 0;
    table(c, {
      widths: [340, 260, 340, 355, 400],
      heads: ['Metric', 'Raw p', 'Bonferroni', '4p / rank', 'BH reverse min'],
      rows: family.sorted.map((r, i) => [
        ['Source compliance', 'Resolution rate', 'p95 latency', 'Session cost'][r.id],
        r.p.toFixed(3),
        s.on(1) ? family.bonferroni[r.id].toFixed(3) : '…',
        s.b >= 2 ? r.rankScaled.toFixed(3) : '…',
        i >= family.sorted.length - scanned ? r.adjusted.toFixed(3) : '…',
      ]),
      highlights: s.on(3) ? ['', bPale] : [],
      step: 105,
    });
  }
  note(
    c,
    s.on(3)
      ? 'Resolution clears the .05 false-discovery criterion. Its familywise adjustment is .080.'
      : s.b
        ? 'Keep the same four metric identities and the same family level of .05.'
        : 'Chance of at least one false alarm across all twenty tests.',
  );
}
export const lookPlan = plannedLooks([0.23, 0.036, 0.008, 0.02]);
function looks(c, s) {
  label(c, 'Family budget   α = .05       /       4 registered looks', 110, 250);
  const look2 = s.on(1),
    look3 = s.b >= 2 && (s.b > 2 || s.ramp('third look yields', 1.5) === 1);
  const show = [s.b >= 1, look2, look3, false];
  lookPlan.values.forEach((v, i) => {
    const x = 118 + i * 440;
    sheet(c, x, 360, 385, 330, 'Look ' + (i + 1), show[i] ? aInk : mute);
    text(
      c,
      show[i] ? v.toFixed(3) : s.on(3) && i === 3 ? 'Unobserved' : 'Pending',
      x + 30,
      546,
      show[i] ? 65 : 41,
      show[i] ? ink : mute,
      { family: 'Serif' },
    );
    text(c, 'α / 4  =  ' + lookPlan.threshold.toFixed(4), x + 30, 640, 30, mute);
  });
  note(
    c,
    s.on(3)
      ? 'Stop at look 3. Check direction, effect size and guardrails.'
      : look3
        ? 'Does .008 clear the same .0125 boundary?'
        : look2
          ? 'Would .036 justify stopping here?'
          : 'Allocate the budget before observing the results.',
  );
}
function divisor(c, s) {
  if (s.b === 3) {
    label(c, 'Register the allowed analysis times before enrollment', 116, 252);
    ['One fixed horizon', 'Scheduled interim looks', 'Always-valid monitoring'].forEach((v, i) => {
      const y = 401 + i * 163;
      text(c, v, 115, y, 44);
      line(c, 800, y - 13, 1710, y - 13, pale, 7);
      if (i < 2) {
        for (const t of i ? [0.25, 0.5, 0.75, 1] : [1]) dot(c, 800 + 910 * t, y - 13, 14, aInk);
      } else if (s.ramp('Always-valid inference', 0.4) === 1)
        line(c, 800, y - 13, 1710, y - 13, bInk, 9);
    });
    note(c, 'A fixed horizon, a spending plan and continuous monitoring use different boundaries.');
    return;
  }
  const at = ruler(c, 225, 577, 1430, 0, 0.03, [0, 0.005, 0.01, 0.015, 0.02, 0.025, 0.03], (v) =>
    v.toFixed(3),
  );
  const plan = lookPlan.threshold,
    observed = 0.016;
  label(c, 'Interim look 2 of 4    /    observed p-value remains fixed', 117, 253);
  dot(c, at(observed), 577, 18, ink);
  text(c, '.016', at(observed), 677, 39, ink, { align: 'center' });
  line(c, at(plan), 358, at(plan), 565, bInk, 6);
  text(c, 'Planned   .05 / 4', at(plan) - 24, 323, 36, bInk, { align: 'right' });
  text(c, plan.toFixed(4), at(plan) - 20, 439, 37, bInk, { align: 'right' });
  if (s.b >= 1) {
    const x = at(plan + (0.025 - plan) * s.p(1));
    line(c, x, 443, x, 565, warn, 5);
    if (s.on(1)) text(c, 'Proposed   .05 / 2 = .025', x, 408, 32, warn, { align: 'center' });
  }
  note(
    c,
    s.on(2)
      ? 'Keep collecting. The registered boundary is .0125.'
      : 'At look two, does .016 justify stopping under the registered plan?',
  );
}
export function splitAt(t) {
  const a = 5040 + Math.round(210 * t);
  return assignmentResidual(a, 10000 - a);
}
function split(c, s) {
  const d = splitAt(s.p(1));
  label(c, '10,000 unique assignments    /    50% planned in each arm', 118, 249);
  const at = ruler(c, 260, 709, 1340, 4000, 6000, [4000, 4500, 5000, 5500, 6000], nfmt);
  line(c, at(5000), 316, at(5000), 699, ink, 3);
  label(c, 'Expected 5,000', at(5000) + 15, 312);
  d.observed.forEach((v, i) => {
    const y = 430 + i * 161;
    label(c, i ? 'B' : 'A', 147, y + 12, i ? bInk : aInk);
    line(c, at(4000), y, at(v), y, i ? bInk : aInk, 35);
    rect(c, at(v) - 65, y - 67, 130, 42, paper, 4);
    text(c, nfmt(v), at(v), y - 32, 36, ink, { align: 'center' });
  });
  if (s.on(2))
    label(c, 'χ² = ' + d.chi.toFixed(2) + '   •   diagnostic threshold 10.83', 155, 829, warn);
  note(
    c,
    s.on(2)
      ? 'Investigate the count discrepancy before interpreting an effect.'
      : 'Compare assignment counts with the planned split. Follow-up turns have a different unit.',
  );
}
export const srm = assignmentResidual(5250, 4750);
function residual(c, s) {
  const d = srm;
  table(c, {
    widths: [225, 330, 360, 345, 440],
    heads: ['Arm', 'Observed', 'Expected', 'Difference', 'Difference² / expected'],
    rows: d.observed.map((v, i) => [
      i ? 'B' : 'A',
      nfmt(v),
      nfmt(d.expected[i]),
      (d.residuals[i] > 0 ? '+' : '') + d.residuals[i],
      s.on(1) ? d.contributions[i].toFixed(1) : '…',
    ]),
    step: 117,
  });
  if (s.on(1)) text(c, 'χ² = 12.5 + 12.5 = ' + d.chi, 138, 682, 63, ink, { family: 'Serif' });
  if (s.on(2))
    text(
      c,
      '1 degree of freedom     p = erfc(√(χ²/2)) ≈ ' +
        d.pApprox.toExponential(2) +
        '     <     .001',
      138,
      801,
      38,
      warn,
    );
  note(c, 'Large expected counts  ·  two arms  ·  registered diagnostic  ·  check unique users');
}
export const assignment = [
  assigned,
  spillover,
  router,
  shadow,
  rankingScene,
  familyScene,
  looks,
  divisor,
  split,
  residual,
];
