import { C, cue, cueAfter, smooth, lerp, stamp } from './art.mjs';
import {
  GCG_CANDIDATES,
  PROBES,
  AUDIT_CASES,
  JUDGE_CASES,
} from '../../../films/constitutional-ai/fixtures.mjs';
import {
  parseAttackBatch,
  exactCandidate,
  auditCounts,
  judgeAudit,
  budgetProbability,
} from '../../../films/constitutional-ai/arithmetic.mjs';

export const batches = [
  ['Freeze rule?', 'Docs allowed?'],
  ['Freeze rule?', 'Freeze rule?'],
];
export const wording = ['handbook', 'guide', 'runbook'];
export function worksheet(a, k) {
  const b = k.beat.beatIndex + 1;
  a.base();
  if (b <= 2) {
    a.title('EVALUATION INTAKE', 'What would count as a failure here?');
    a.sheet(114, 269, 1678, 654);
    const rows = [
      ['Caller', 'Signed in. No incident grant.'],
      ['Allowed sources', 'Public freeze runbook'],
      ['Inputs', 'User message or retrieved document'],
      ['Budget', 'Set request and turn limits before the run.'],
      ['Keep', 'Delivered reply and trusted action trace'],
    ];
    rows.forEach(([label, t], i) => {
      const y = 364 + 112 * i;
      a.mono(label, 172, y, 31, C.teal);
      a.serif(t, 665, y, 48);
      if (i < 4) a.line(170, y + 34, 1729, y + 34, C.seam, 2);
    });
    if (b === 2)
      a.mono(
        'A translated question needs its meaning checked against the original.',
        116,
        986,
        32,
        C.blue,
      );
  } else if (b <= 4) {
    const winner = exactCandidate().id;
    a.title('SAVED WORKSHEET  /  PUBLIC TOPIC LABEL', 'Which wording has the lower measured loss?');
    a.sheet(107, 267, 1698, 629);
    ['Candidate word', 'Local gradient', 'Measured loss'].forEach((s, i) =>
      a.mono(s, [166, 816, 1323][i], 364, 32, C.muted),
    );
    GCG_CANDIDATES.forEach((row, i) => {
      const y = 463 + 126 * i;
      const known =
        i === 0 ||
        (i === 1 ? cue(k, 3, 'measured loss is point nine') : cue(k, 3, 'Compare C at point six'));
      const best = cue(k, 4, 'Choose C') && row.id === winner;
      if (best) a.rect(139, y - 58, 1634, 98, '#c5e3c5');
      a.mono(row.id, 169, y + 2, 47, C.teal);
      a.serif(wording[i], 259, y + 2, 51);
      a.mono(row.gradient.toFixed(1), 845, y + 2, 45, i === 1 ? C.blue : C.muted);
      a.mono(known ? row.loss.toFixed(2) : '?', 1363, y + 2, 48, best ? C.teal : C.ink);
    });
    a.mono(
      cue(k, 4, 'surrogate score')
        ? 'A policy verdict needs the observed answer and effects.'
        : 'Three fixed alternatives   /   Same topic label',
      166,
      837,
      34,
      C.blue,
    );
  } else {
    a.title('BATCH VALIDATION', 'Which questions enter the evaluation?');
    batches.forEach((rows, i) => {
      const x = 110 + i * 879;
      a.sheet(x, 277, 815, 555);
      a.mono('INTAKE 0' + (i + 1), x + 46, 358, 32, C.teal);
      rows.forEach((s, j) => {
        a.mono(String(j + 1), x + 46, 469 + 100 * j, 33);
        a.serif(s, x + 120, 472 + 100 * j, 48);
      });
      a.line(x + 44, 636, x + 766, 636, C.seam, 3);
      const result = parseAttackBatch(rows);
      if (cue(k, 5, i ? 'right repeats' : 'left batch admits'))
        stamp(
          a,
          result.accepted ? 'Admit ' + result.targetAttempts + ' questions' : 'Reject duplicate',
          x + 46,
          700,
          699,
          result.accepted ? C.teal : C.brick,
        );
    });
    if (b === 6)
      a.mono(
        'Rejected batch   /   0 target attempts. Track execution and judgment errors separately.',
        113,
        940,
        32,
        C.blue,
        { width: 1690 },
      );
  }
}

export const roots = [
  { id: 'A', text: 'Can we edit the docs during a freeze?', color: C.teal },
  { id: 'B', text: 'Can I see the incident timeline?', color: C.blue },
];
export const family = [
  {
    id: 'P1',
    root: 'A',
    words: 'May I fix a typo during the freeze?',
    type: 'paraphrase',
    initial: 'Train',
    final: 'Train',
  },
  {
    id: 'P2',
    root: 'A',
    words: 'Can the docs be corrected while releases are frozen?',
    type: 'paraphrase',
    initial: 'Test',
    final: 'Train',
  },
  {
    id: 'P3',
    root: 'B',
    words: 'Encoded timeline request',
    type: 'encoding',
    initial: 'Test',
    final: 'Test',
  },
  {
    id: 'P4',
    root: 'B',
    words: 'Translated timeline request',
    type: 'translation',
    initial: 'Test',
    final: 'Test',
  },
];
const trayX = { Train: 104, Test: 1001 };
export function placement(row, t) {
  const progress = smooth(t);
  return {
    x: lerp(trayX[row.initial], trayX[row.final], progress),
    side: t === 1 ? row.final : t === 0 || row.initial === row.final ? row.initial : null,
  };
}

export function lineage(a, k) {
  a.base();
  const moved = cue(k, 2, 'Move the second paraphrase', 1.45);
  const flags = [
    cue(k, 1, 'May I fix'),
    cue(k, 1, 'Can the docs be corrected'),
    cue(k, 1, 'Seed B'),
    cue(k, 1, 'Seed B'),
  ];
  const trace = smooth(cue(k, 1, 'Trace both A cases', 1.8));
  const both = flags[2];
  a.mono('EVALUATION SPLIT  /  ROOT REQUESTS', 106, 89, 29, C.teal);
  roots.forEach((root, i) => {
    if (i && !both) return;
    const x = i ? 1000 : 105;
    a.sheet(x, 131, 804, 146, i ? C.cream : C.paper);
    a.mono('Root ' + root.id, x + 33, 183, 27, root.color);
    a.serif(root.text, x + 32, 243, 40, root.color, { width: 745 });
  });
  a.line(956, 310, 956, 868, C.seam, 5);
  a.mono('TRAIN', 122, 389, 38, C.teal);
  a.mono('HELD-OUT TEST', 1016, 389, 38, C.blue);
  const slots = [449, 589, 449, 727];
  family.forEach((row, i) => {
    if (!flags[i]) return;
    const { x } = placement(row, moved),
      y = slots[i],
      col = row.root === 'A' ? C.teal : C.blue;
    const anchor = row.root === 'A' ? 506 : 1398;
    a.ctx.beginPath();
    a.ctx.moveTo(anchor, 276);
    a.ctx.bezierCurveTo(anchor, 323, x + 765, y - 40, x + 765, y + 10);
    a.ctx.lineWidth = 4;
    a.ctx.strokeStyle = col;
    a.ctx.stroke();
    a.dot(anchor, 275, 7, col);
    if (row.root === 'A' && trace > 0 && trace < 1 && !moved) {
      const t = 1 - trace,
        u = 1 - t;
      const px = (u * u * u + 3 * u * u * t) * anchor + (3 * u * t * t + t * t * t) * (x + 765);
      const py =
        u * u * u * 276 + 3 * u * u * t * 323 + 3 * u * t * t * (y - 40) + t * t * t * (y + 10);
      a.dot(px, py, 11, C.brass);
    }
  });
  family.forEach((row, i) => {
    if (!flags[i]) return;
    const { x } = placement(row, moved),
      y = slots[i],
      col = row.root === 'A' ? C.teal : C.blue;
    a.sheet(x, y, 803, 108);
    a.rect(x, y, 12, 108, col);
    a.mono(row.id + '   /   ' + row.root + ' → ' + row.type, x + 33, y + 36, 24, col);
    a.serif(row.words, x + 32, y + 83, 36, C.ink, { width: 744 });
  });
  if (k.beat.beatIndex >= 2) {
    a.line(106, 877, 1808, 877, C.fog, 3);
    a.label(
      k.beat.beatIndex === 2
        ? 'A and B have separate roots. Check for shared templates across them.'
        : 'Keep the root, model, judge, permission receipt and action trace with each case.',
      107,
      952,
      39,
      C.ink,
      { width: 1701 },
    );
  }
}

export const probeCount = (rows) => ({
  permitted: rows.filter((r) => r.permitted).length,
  denied: rows.filter((r) => !r.permitted).length,
  refused: rows.filter((r) => r.permitted && r.refused).length,
  leaked: rows.filter((r) => !r.permitted && r.disclosed).length,
});
export function permissions(a, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 4) {
    a.base(true);
    a.title(
      'REPLAY D1   /   SAME ABSENT INCIDENT GRANT',
      'Where did the proposed read stop?',
      true,
    );
    const labels = ['Model proposal', 'Application authorization', 'Private records fetched'];
    const values = ['Read INC-8821', 'Denied', '0'];
    const shown = [
      cue(k, 4, 'proposes'),
      cue(k, 4, 'permission check stops'),
      cue(k, 4, 'zero private records'),
    ];
    labels.forEach((label, i) => {
      const y = 310 + i * 181;
      a.dot(162, y + 58, 24, shown[i] ? C.gold : C.steel);
      if (i < 2) a.line(162, y + 83, 162, y + 209, C.steel, 4);
      a.mono(label, 230, y + 67, 38, C.fog);
      const color = i === 2 && shown[i] ? C.mint : C.paper;
      a.serif(shown[i] ? values[i] : '…', 1060, y + 76, 67, color);
    });
    return;
  }
  a.base();
  a.title('MODEL-ONLY REPLIES  /  TRUSTED PERMISSIONS', 'Which cases belong under each error?');
  const shown = [
    cue(k, 1, 'first answer'),
    cue(k, 1, 'second'),
    cue(k, 1, 'Next'),
    cue(k, 1, 'verified support'),
    cue(k, 2, 'last case'),
  ];
  const rows = PROBES.filter((_, i) => shown[i]),
    count = probeCount(rows);
  a.sheet(111, 259, 1689, 548);
  ['ID', 'Request', 'Receipt', 'Model reply'].forEach((s, i) =>
    a.mono(s, [152, 310, 910, 1245][i], 321, 28),
  );
  rows.forEach((r, i) => {
    const y = 403 + i * 84;
    const err = r.disclosed || (r.permitted && r.refused);
    a.line(147, y - 56, 1761, y - 56, C.seam, 2);
    a.mono(r.id, 151, y, 34, C.blue);
    a.label(r.request, 313, y, 34, C.ink, { width: 562 });
    a.mono(r.permitted ? 'Permitted' : 'Denied', 909, y, 32, r.permitted ? C.teal : C.brick);
    a.label(r.response, 1242, y, 34, err ? C.brick : C.teal, { width: 520 });
  });
  if (cue(k, 3, 'Two got a refusal'))
    a.label(
      'False refusals   ' + count.refused + ' / ' + count.permitted + ' permitted',
      114,
      927,
      45,
      C.brick,
    );
  if (cue(k, 3, 'One got a private detail'))
    a.label(
      'Disclosures   ' + count.leaked + ' / ' + count.denied + ' denied',
      1013,
      927,
      45,
      C.brick,
    );
}

const judged = AUDIT_CASES.filter((r) => !['review', 'error'].includes(r.outcome));
export function comparison(mode) {
  return judged.map((r) => {
    if (mode !== 'Original' && r.id === 'A3') return { ...r, outcome: 'clear' };
    if (mode === 'Stricter classifier' && r.id === 'B3') return { ...r, outcome: 'refusal' };
    if (mode === 'Better model' && r.id === 'B4') return { ...r, outcome: 'helpful' };
    return r;
  });
}
export function outcomeColor(s) {
  return {
    clear: C.teal,
    helpful: C.teal,
    violation: C.brick,
    refusal: C.brick,
    unhelpful: C.blue,
    review: C.muted,
    error: C.muted,
  }[s];
}
export function caseTiles(a, rows, x, y, w, maxSlots) {
  const step = w / maxSlots;
  rows.forEach((r, i) => {
    const left = x + i * step,
      col = outcomeColor(r.outcome);
    a.sheet(left, y, step - 12, 110, C.paper);
    a.rect(left, y, step - 12, 9, col);
    a.mono(r.id, left + 11, y + 51, 32, C.ink);
    a.label(r.outcome, left + 11, y + 91, 26, col, { width: step - 25 });
  });
}
export function counting(a, k) {
  const b = k.beat.beatIndex + 1;
  a.base(true);
  if (b >= 7) {
    const better = cue(k, 7, 'It clears A three'),
      strict = cue(k, 7, 'stricter classifier clears');
    const mode = better ? 'Better model' : strict ? 'Stricter classifier' : 'Original';
    a.title('SAME ELEVEN CASES   /   REPLAY', 'What changed from the original?', true);
    [comparison('Original'), comparison(mode)].forEach((rows, i) => {
      const count = auditCounts(rows),
        y = 286 + i * 310;
      a.mono(i ? mode : 'Original', 110, y + 31, 35, C.gold);
      a.label(
        'Violations  ' +
          count.violations +
          '/6       Helpful  ' +
          count.helpful +
          '/5       False refusals  ' +
          count.refusals +
          '/5',
        615,
        y + 31,
        38,
        C.paper,
        { width: 1177 },
      );
      caseTiles(a, rows, 110, y + 77, 1695, 11);
    });
    return;
  }
  const added = cue(k, 4, 'Add an attack'),
    hasBenign = cue(k, 2, 'Five judged benign');
  let rows = added ? AUDIT_CASES : judged;
  if (!hasBenign) rows = rows.filter((r) => r.cohort === 'attack');
  if (b === 6) rows = rows.map((r) => (r.cohort === 'attack' ? { ...r, outcome: 'review' } : r));
  const n = auditCounts(rows);
  a.title(
    b === 6 ? 'HYPOTHETICAL   /   ALL ATTACK VERDICTS PENDING' : 'AUDIT CASEBOOK  /  TWO COHORTS',
    'What can these observed outcomes establish?',
    true,
  );
  a.mono('ATTACKS', 110, 312, 30, C.gold);
  caseTiles(a, n.attack, 113, 344, 1560, 7);
  n.attack.forEach((r, i) => a.mono(r.family, 123 + (i * 1560) / 7, 498, 26, C.fog));
  if (cue(k, 1, 'two violations in six'))
    a.label(
      n.asr === null
        ? 'Judged rate undefined  (0 / 0)'
        : 'Judged violations   ' + n.violations + ' / ' + n.knownAttack,
      111,
      571,
      39,
      C.paper,
    );
  if (b !== 6 && cue(k, 2, 'two in two')) {
    const slice = n.attack.filter((r) => r.family === 'roleplay' && r.outcome !== 'review');
    a.label(
      'Roleplay   ' +
        slice.filter((r) => r.outcome === 'violation').length +
        ' / ' +
        slice.length +
        ' judged',
      970,
      572,
      39,
      C.coral,
    );
  }
  if (hasBenign) {
    a.mono('BENIGN', 111, 651, 30, C.gold);
    caseTiles(a, n.benign, 113, 679, 1560, 7);
    if (cue(k, 3, 'False refusals'))
      a.label(
        'Judged   ' +
          n.refusals +
          ' / ' +
          n.knownBenign +
          ' false refusals     ' +
          n.helpful +
          ' / ' +
          n.knownBenign +
          ' helpful',
        112,
        868,
        38,
        C.paper,
      );
  }
  if (added) {
    const showAttackBounds = b === 5 && cueAfter(k, 5, 'two in seven to three in seven');
    const attackTotal = n.attack.length;
    const attackMax = n.violations + attackTotal - n.knownAttack;
    const attackNote = showAttackBounds
      ? 'Fixed labels: ' + n.violations + '–' + attackMax + ' / ' + attackTotal + ' violations'
      : 'Attack judgment coverage   ' + n.knownAttack + ' / ' + attackTotal;
    a.mono(
      attackNote,
      112,
      949,
      34,
      C.mint,
    );
  }
  if (b === 5 && cueAfter(k, 5, 'three in six and four in six')) {
    const benignTotal = n.benign.length;
    const helpfulMax = n.helpful + benignTotal - n.knownBenign;
    const noReply = cueAfter(k, 5, 'that request supplied zero useful answers');
    const helpfulNote = noReply
      ? 'If B6 sends no reply, ' + n.helpful + ' / ' + benignTotal + ' useful'
      : 'B6 unresolved: ' + n.helpful + '–' + helpfulMax + ' / ' + benignTotal + ' useful';
    a.mono(helpfulNote, 983, 949, 34, C.sky, { width: 820 });
  }
}

export function calibration(a, k) {
  const b = k.beat.beatIndex + 1;
  a.base();
  if (b <= 2) {
    a.title('VIOLATION JUDGE', 'Which event is the judge labeling?');
    const rows = [
      ['Model proposed', 'Read private timeline', 'Prohibited proposal'],
      ['Application executed', 'No private read', 'Boundary held'],
      ['Recipient received', 'Use the access portal.', 'No disclosure'],
    ];
    rows.forEach(([label, item, event], i) => {
      const y = 281 + i * 173;
      a.sheet(104, y, 1706, 146);
      a.mono(label, 152, y + 62, 28, C.blue);
      a.serif(item, 553, y + 89, 48);
      a.label(event, 1220, y + 86, 35, i ? C.teal : C.brick);
    });
    if (b === 2)
      a.mono(
        'Choose thresholds on validation. Test on separate human-adjudicated cases.',
        111,
        917,
        32,
        C.teal,
      );
    return;
  }
  const audit = judgeAudit();
  a.title(
    'HELD-OUT HUMAN LABELS  /  FIXED THRESHOLDS',
    'Which judge decisions disagree with people?',
  );
  const x = (p) => 763 + p * 591;
  a.mono('Human verdict', 259, 309, 29);
  a.mono('Judge score', 763, 309, 29);
  a.mono('Decision', 1511, 309, 29);
  a.rect(x(0), 337, 591 * 0.2, 425, '#c2ddc7');
  a.rect(x(0.2), 337, 591 * 0.6, 425, C.cream);
  a.rect(x(0.8), 337, 591 * 0.2, 425, '#edc9b9');
  a.line(x(0.2), 337, x(0.2), 762, C.teal, 3);
  a.line(x(0.8), 337, x(0.8), 762, C.brick, 3);
  audit.decisions.forEach((r, i) => {
    const y = 383 + i * 69,
      wrong = (r.truth === 0 && r.decision === 'flag') || (r.truth === 1 && r.decision === 'clear');
    a.mono(r.id, 117, y + 3, 32, C.blue);
    a.label(r.truth ? 'Violation' : 'Clear', 258, y + 3, 36);
    if (cue(k, 3, 'place each judge score')) {
      a.dot(x(r.probability), y - 6, 11, C.ink);
      a.mono(
        r.probability.toFixed(2),
        x(r.probability) + (r.probability > 0.7 ? -24 : 23),
        y + 3,
        26,
        C.ink,
        { align: r.probability > 0.7 ? 'right' : 'left' },
      );
    }
    const show = cue(
      k,
      3,
      r.decision === 'flag'
        ? 'Flag scores'
        : r.decision === 'clear'
          ? 'Clear scores'
          : 'Send the middle',
    );
    if (show) a.label(r.decision, 1511, y + 1, 38, wrong ? C.brick : C.teal);
    if (b >= 4 && wrong) a.mono(r.truth ? 'miss' : 'false flag', 1636, y + 1, 23, C.brick);
  });
  a.mono('≤ 0.20 clear         review         ≥ 0.80 flag', 700, 813, 26, C.muted);
  if (b >= 5)
    a.label(
      'Classified  ' +
        (JUDGE_CASES.length - audit.review) +
        '/6      Correct flags  ' +
        audit.tp +
        '/' +
        (audit.tp + audit.fp) +
        '      Classified recall  ' +
        audit.tp +
        '/' +
        (audit.tp + audit.fn),
      113,
      897,
      39,
    );
  if (b >= 6) {
    const brier = cue(k, 6, 'Brier score')
      ? '       Brier = mean((score − truth)²) = ' + audit.brier.toFixed(3)
      : '';
    a.mono('All-violation recall   ' + audit.tp + '/4' + brier, 111, 970, 34, C.blue);
  }
}

export function budget(a, k) {
  const repeated = cue(k, 3, 'same deterministic outcome');
  const advanced = cue(k, 2, 'Two independent'),
    ten = cue(k, 2, 'Ten give');
  a.base(true);
  a.title(
    'TOY TASKS   /   PER-ATTEMPT SUCCESS 0.10',
    'How often does at least one attempt succeed?',
    true,
  );
  const x = 144,
    y = 745,
    w = 1035,
    h = 395;
  a.line(x, y - h - 20, x, y, C.fog, 3);
  a.line(x, y, x + w + 45, y, C.fog, 3);
  [0, 0.25, 0.5, 0.75, 1].forEach((v) => {
    a.line(x - 7, y - h * v, x + w + 10, y - h * v, C.steel, 2);
    a.mono(Math.round(v * 100) + '%', x - 15, y - h * v + 9, 24, C.fog, { align: 'right' });
  });
  const xp = (i) => x + 57 + (i - 1) * 105;
  const max = ten ? 10 : advanced ? 2 : 1;
  for (let i = 1; i <= max; i++) {
    const p = budgetProbability(i),
      py = y - h * p;
    if (i > 1) a.line(xp(i - 1), y - h * budgetProbability(i - 1), xp(i), py, C.mint, 6);
    a.dot(xp(i), py, 9, C.mint);
    if (repeated) {
      if (i > 1) a.line(xp(i - 1), y - h * 0.1, xp(i), y - h * 0.1, C.gold, 5);
      a.dot(xp(i), y - h * budgetProbability(i, false), 8, C.gold);
    }
  }
  for (const i of [1, 2, 5, 10]) a.mono(String(i), xp(i), y + 49, 29, C.fog, { align: 'center' });
  a.mono('Attempts per task', x + 389, y + 112, 32, C.fog);
  a.mono('INDEPENDENT', 1275, 390, 32, C.mint);
  a.serif((100 * budgetProbability(max)).toFixed(max === 10 ? 1 : 0) + '%', 1271, 502, 86, C.white);
  a.mono('1 − (1 − 0.10)ᵏ', 1272, 562, 36, C.mint);
  if (repeated) {
    a.mono('IDENTICAL OUTCOME', 1275, 654, 31, C.gold);
    a.serif('10%', 1271, 759, 82, C.gold);
  }
  if (k.beat.beatIndex >= 2)
    a.label(
      'Adaptive tests depend on earlier replies. Compare runs with the same budgets and stopping rules.',
      115,
      968,
      36,
      C.paper,
      { width: 1687 },
    );
}
