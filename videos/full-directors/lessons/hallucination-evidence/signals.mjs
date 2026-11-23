import { P, lerp, stepText } from './press.mjs';
import {
  v1,
  eta,
  service,
  resolvedClaim,
  draftClaims,
  votes,
  editedVotes,
  etaForms,
  etaMeanings,
  semanticSampleStats,
  samplingRoute,
  terms,
  tokenEntropy,
  mass,
  selfCheck,
  nliScores,
  checkedIncidentClaim,
  tokens,
  final,
  prior,
  earlier,
  js,
  selected,
  dola,
  cad,
} from './edition-data.mjs';

export function token(d) {
  d.stage('LANGUAGE MODEL   /   NEXT TOKEN');
  if (d.b <= 2) {
    d.headline('After “fully”');
    d.txt('fully', 90, 388, 120, P.ink, 'Serif');
    d.rect(380, 258, 514, 168, P.deep, 8);
    d.alpha(d.cue(1, 'recovered with probability'), () =>
      d.txt('recovered', 402, 375, 91, P.white, 'Serif', { w: 468 }),
    );
    d.alpha(d.cue(1, 'recovered with probability'), () => {
      d.txt('0.98', 954, 374, 96, P.teal, 'Mono');
      d.label('NEXT-TOKEN PROBABILITY', 957, 424);
    });
    d.line(92, 493, 1349, 493, P.rule);
    if (d.b === 1) {
      d.field('INC-48291  /  STATUS IN v1', v1.status, 93, 557, 680);
    } else {
      d.label('RECOVERED  /  0.98', 95, 561);
      d.label('ALL OTHERS  /  0.02', 1045, 561);
      d.rect(95, 585, 1210, 31, P.rule);
      d.rect(95, 585, 1210 * 0.98, 31, P.teal);
      d.txt('How is the remaining mass divided among other words?', 95, 681, 35, P.ink, 'Serif');
    }
    return;
  }
  d.headline('Entropy over a complete toy vocabulary.');
  const sum = d.cue(3, 'Add the three contributions');
  let x = 90;
  mass.forEach((p, i) => {
    const w = 1260 * p,
      col = [P.teal, P.deep, P.steel][i];
    d.rect(x, 245, w - 3, 144, col, 4);
    d.label('TOKEN ' + String.fromCharCode(65 + i), x + 24, 282, P.white);
    d.txt(p.toFixed(2), x + 20, 365, 65, P.white, 'Mono');
    d.txt('−p ln p', x + 9, 447, 28, P.dim, 'Mono');
    d.txt('≈ ' + terms[i].toFixed(3), x + 9, 514, 49, P.ink, 'Mono');
    x += w;
  });
  d.line(94, 560, 1344, 560, P.rule);
  d.alpha(sum, () => {
    d.txt('H ≈ ' + tokenEntropy.toFixed(3) + ' nats', 92, 662, 76, P.teal, 'Serif');
    d.txt('Sum the terms before rounding.', 752, 650, 36, P.ink, 'Sans');
  });
  if (d.b === 4)
    d.label('Calibrate risk on development data. Evaluate on held-out cases.', 93, 721);
}
function clockFace(d, show) {
  const x = 1145,
    y = 404,
    r = 152;
  d.dot(x + 3, y + 6, r + 8, '#203c3924');
  d.dot(x, y, r + 8, P.ink);
  d.dot(x, y, r, P.white);
  for (let i = 0; i < 60; i++) {
    const ang = (i * Math.PI) / 30 - Math.PI / 2,
      major = i % 5 === 0;
    const a = r - (major ? 20 : 11),
      b = r - 5;
    d.line(
      x + a * Math.cos(ang),
      y + a * Math.sin(ang),
      x + b * Math.cos(ang),
      y + b * Math.sin(ang),
      major ? P.ink : P.rule,
      major ? 4 : 2,
    );
  }
  [
    [12, 0, -92],
    [3, 108, 10],
    [6, 0, 121],
    [9, -107, 10],
  ].forEach(([s, dx, dy]) => d.txt(s, x + dx, y + dy, 34, P.ink, 'Serif', { align: 'center' }));
  if (show) {
    const [hours, minutes] = etaMeanings[0].slice(0, 5).split(':').map(Number);
    for (const [fraction, length, width] of [
      [((hours % 12) + minutes / 60) / 12, 78, 9],
      [minutes / 60, 112, 6],
    ]) {
      const a = 2 * Math.PI * fraction - Math.PI / 2;
      d.line(x, y, x + length * Math.cos(a), y + length * Math.sin(a), P.red, width);
    }
    d.dot(x, y, 8, P.ink);
  } else d.txt('?', x, y + 18, 53, P.dim, 'Serif', { align: 'center' });
  d.label('UTC  /  AFTERNOON', x - 99, 610);
}
function pile(d, values, groups, phase, mode) {
  const order = [...new Set(groups)],
    width = 294;
  const top = 226,
    gap = 102,
    xs = order.length === 1 ? [607] : order.length === 2 ? [338, 653] : [486, 795, 1104];
  const seen = new Map();
  values.forEach((v, i) => {
    const group = groups[i],
      pos = order.indexOf(group),
      n = seen.get(group) ?? 0;
    seen.set(group, n + 1);
    const x = lerp(mode === 'estimate' ? 210 : 539, xs[pos], Math.min(1, 2 * phase)),
      y = lerp(top + i * gap, top + n * gap, Math.max(0, 2 * phase - 1));
    d.paper(x, y, width, 73, mode === 'estimate' ? '#ffe1cb' : P.white);
    d.dot(x + 21, y + 21, 7, mode === 'estimate' ? P.red : P.teal);
    d.txt(v, x + 37, y + 48, 31, mode === 'estimate' ? P.red : P.ink, 'Serif', { w: width - 50 });
  });
  if (phase === 1)
    order.forEach((key, i) =>
      d.label(seen.get(key) + ' / ' + values.length + ' samples', xs[i] + 5, top - 20, P.dim, 18),
    );
}
export function meaning(d) {
  d.stage('SAMPLE TRAY   /   FOUR COMPLETE ANSWERS');
  const time = d.b >= 3,
    split = d.b === 5 && !d.on(5, 'Merge the pairs again');
  const display = time ? etaForms : votes,
    labels = time ? (split ? etaForms : etaMeanings) : votes;
  d.headline(time ? 'How many distinct times did the model give?' : 'Sort the answers by meaning.');
  const group = time ? d.cue(4, 'All four mean', 0.9) : d.cue(1, 'Group them by meaning', 1.2);
  pile(d, display, labels, group, time ? 'estimate' : 'status');
  if (time) clockFace(d, group === 1);
  const stats = semanticSampleStats(labels);
  if (group === 1) {
    d.label(
      time ? (split ? 'EXACT SPELLING' : 'MEANING IN THIS QUESTION') : 'EMPIRICAL MASS',
      76,
      233,
    );
    if (!time) d.txt('½,  ¼,  ¼', 76, 318, 48, P.ink, 'Serif');
    else
      d.txt(split ? 'Two spellings' : 'One clock time', 76, 317, split ? 38 : 46, P.ink, 'Serif');
    if (d.b === 1 && d.on(1, 'Each contributes'))
      d.txt('−p ln p ≈ 0.347 each', 75, 402, 27, P.dim, 'Mono');
    if (d.b === 2 || (time && d.on(4, 'entropy is zero'))) {
      d.txt('H = ' + stats.entropy.toFixed(3) + ' nats', 75, 482, split ? 27 : 36, P.teal, 'Mono');
      if (d.b === 2 && d.on(2, 'Two out of four'))
        d.txt('Outside largest: 2 / 4', 75, 544, 28, P.dim, 'Mono');
    }
  }
  if (d.b === 5) {
    d.txt(etaForms[0], 76, 687, 43, P.ink, 'Mono');
    d.txt(etaForms[1], 500, 687, 43, P.ink, 'Mono');
    if (d.on(5, 'implies two thirty')) {
      d.line(333, 657, 460, 657, P.teal, 3);
      d.path(
        [
          [452, 649],
          [469, 657],
          [452, 665],
        ],
        P.teal,
      );
    }
    if (d.on(5, 'reverse holds')) {
      d.line(341, 681, 469, 681, P.teal, 3);
      d.path(
        [
          [344, 673],
          [327, 681],
          [344, 689],
        ],
        P.teal,
      );
    }
  }
  if (d.b === 6)
    d.txt('Four samples from one model. A fifth answer could differ.', 77, 688, 37, P.ink, 'Serif');
}
export function agreement(d) {
  d.stage('TRIAGE   /   FOUR SAMPLES FROM ONE MODEL', 'dark');
  const changed = d.on(3, 'Change only the third'),
    estimate = d.b >= 5;
  const samples = estimate ? etaMeanings : changed ? editedVotes : votes;
  const claims = estimate ? draftClaims : [{ ...resolvedClaim, value: v1.status }];
  const stats = semanticSampleStats(samples),
    route = samplingRoute(claims, samples);
  const reveal = estimate
    ? d.on(6, 'Shorten the draft')
    : changed
      ? d.on(4, 'this supported draft can go through') && d.b === 4
      : d.on(2, 'Send this draft to review') && d.b === 2;
  const measured = estimate
    ? d.on(6, 'Disagreement is zero')
    : changed
      ? d.on(4, 'One answer now')
      : d.on(2, 'Two answers fall outside');
  d.txt(
    estimate ? 'Can four votes supply the estimate?' : 'When does disagreement trigger review?',
    74,
    151,
    56,
    P.white,
    'Serif',
  );
  samples.forEach((v, i) => {
    const y = 207 + i * 104,
      c = estimate ? P.rose : i === 2 && changed ? P.gold : P.mint;
    d.label('0' + (i + 1), 79, y + 48, c);
    d.rect(137, y, 444, 72, '#274b55', 7);
    d.txt(v, 166, y + 49, 39, P.white, 'Serif');
  });
  d.paper(655, 207, 690, 442);
  d.label(
    estimate ? 'SELECTED DRAFT   /   EXTRA ESTIMATE' : 'SELECTED DRAFT   /   ' + claims[0].value,
    79,
    674,
    P.mint,
  );
  d.label('ADMITTED RECORD  /  v1', 694, 255);
  d.txt(estimate ? 'Recovery estimate' : 'Status   ' + v1.status, 694, 313, 40, P.ink, 'Serif');
  if (estimate) d.line(696, 353, 1278, 353, P.rule, 2, true);
  else d.txt('Review if disagreement > 0.25', 695, 385, 30, P.dim, 'Mono', { w: 598 });
  if (measured) {
    d.txt('D = ' + stats.disagreement.toFixed(2), 694, 467, 55, P.ink, 'Mono');
    if (changed && !estimate) d.label('H = ' + stats.entropy.toFixed(3) + ' nats', 1010, 461);
  }
  if (reveal)
    d.result(
      route === 'serve' ? 'Serve' : route === 'review' ? 'Review' : 'Shorten',
      695,
      578,
      route === 'serve',
      { w: 286 },
    );
  else d.label('Which route?', 696, 577, P.dim);
}
function extraction(d) {
  const two = d.on(2, 'Check that claim too');
  const extracted = two ? [service, eta] : d.on(1, 'picks up just the service') ? [service] : [];
  const hits = extracted.filter((c) => checkedIncidentClaim(c) === 'supported').length;
  d.headline('What did the extractor pick up?');
  d.label('DRAFT', 80, 222);
  d.label('VALUE FOUND IN RUNBOOK v1', 774, 222);
  [service, eta].forEach((c, i) => {
    const y = 265 + i * 132;
    d.paper(75, y, 502, 94);
    d.txt(c.value, 106, y + 64, 42, P.ink, 'Serif');
    const active = extracted.includes(c);
    if (active) {
      d.line(579, y + 46, 745, y + 46, v1[c.field] ? P.teal : P.ochre, 3, !v1[c.field]);
      d.cursor(736, y + 46, v1[c.field] ? P.teal : P.ochre);
    }
    d.field(i === 0 ? 'Service' : 'Recovery estimate', v1[c.field], 779, y + 3, 527, {
      size: 39,
      color: P.teal,
    });
  });
  if (d.on(1, 'One claim checked')) {
    d.txt(hits + ' / ' + extracted.length, 80, 637, 74, P.teal, 'Mono');
    d.label('SUPPORTED / EXTRACTED', 83, 682);
  }
  const source =
    d.b === 3
      ? 'Ragas   /   retrieved context'
      : d.on(2, 'FActScore')
        ? 'FActScore   /   knowledge source'
        : '';
  if (source) d.txt(source, 768, 657, 36, P.ink, 'Serif', { w: 557 });
}
export function methods(d) {
  d.stage('VERIFIER   /   INSPECT THE PREMISE');
  if (d.b <= 3) {
    extraction(d);
    return;
  }
  if (d.b <= 5) {
    d.headline('SelfCheckGPT samples two other passages.');
    const cols = [P.teal, P.red, P.steel];
    ['Entailment', 'Contradiction', 'Neutral'].forEach((n, i) => {
      d.dot(248 + i * 328, 220, 9, cols[i]);
      d.label(n, 268 + i * 328, 226);
    });
    selfCheck.forEach((row, i) => {
      const y = 277 + i * 134;
      d.label('PASSAGE ' + (i + 1), 70, y + 49);
      let x = 252;
      row.forEach((p, j) => {
        const w = p * 870;
        d.rect(x, y, w - 2, 78, cols[j]);
        d.txt(p.toFixed(1), x + w / 2, y + 54, 36, P.white, 'Mono', { align: 'center' });
        x += w;
      });
      if (d.b === 5) d.txt(nliScores[i].toFixed(2), 1161, y + 56, 44, P.red, 'Mono');
    });
    d.txt('Score = contradiction / (entailment + contradiction)', 74, 617, 32, P.ink, 'Mono');
    if (d.on(5, 'Their mean'))
      d.txt(
        'Mean = ' + ((nliScores[0] + nliScores[1]) / 2).toFixed(3),
        76,
        701,
        48,
        P.teal,
        'Serif',
      );
    return;
  }
  if (d.b === 6) {
    d.headline('Use the runbook as the premise.');
    const rows = [
      [v1.status, 'resolved', 'contradiction'],
      [v1.status, v1.status, 'entailment'],
      ['No estimate', eta.value, 'neutral'],
    ];
    const count = d.on(6, 'For a claim') ? 3 : d.on(6, 'A matching status') ? 2 : 1;
    ['SOURCE FIELD', 'CLAIM', 'EXPECTED LABEL'].forEach((s, i) => d.label(s, 86 + i * 453, 226));
    rows.slice(0, count).forEach(([a, b, c], i) => {
      const y = 330 + 126 * i;
      d.txt(a, 87, y, 45, P.teal, 'Serif');
      d.txt(b, 540, y, 45, P.ink, 'Serif');
      if (i || d.on(6, 'expected label')) d.txt(c, 993, y, 40, i === 0 ? P.red : P.teal, 'Mono');
      d.line(85, y + 33, 1330, y + 33, P.rule);
    });
    return;
  }
  d.headline('Where does the judge’s window end?');
  d.punchStrip(80, 272, 1280, 213);
  d.label('RUNBOOK EXCERPT', 152, 324);
  d.txt('Failover completed', 150, 419, 56, P.ink, 'Serif');
  d.txt('in the test region only.', 686, 419, 56, P.red, 'Serif', { w: 609 });
  const cut = d.cue(7, 'cut a qualifier', 0.85);
  d.rect(lerp(1334, 670, cut), 343, 5, 119, P.red);
  if (cut === 1) d.label('WINDOW ENDS HERE', 674, 541, P.red);
  d.txt('Review dates, entities, negation and window aggregation.', 81, 660, 35, P.dim, 'Serif');
}
export function decoding(d) {
  d.stage('NEXT TOKEN   /   THREE SUPPLIED PROBABILITIES', 'dark');
  const context = d.b >= 5,
    choose = !context && d.b <= 2;
  const masked = !context && d.after(3, 'The cutoff is point one four, so unknown drops out');
  const norm = context
    ? d.after(7, 'Investigating now gets about ninety-seven percent')
    : d.after(4, 'Investigating gets eighty-four percent and resolved gets sixteen percent');
  const firstWeight = context
    ? d.after(7, 'For investigating that gives four point nine')
    : d.after(4, 'Its weight is three and a half');
  const otherWeights = context ? firstWeight : d.after(4, 'Resolved gets two thirds');
  const sum = context && d.after(7, 'Divide each weight by the total, five point zero five');
  const use0 = d.b === 6 && d.after(6, 'At alpha zero you get ordinary contextual decoding');
  const out = context ? cad(use0 ? 0 : 1) : dola;
  const probabilityWidth = 142;
  d.txt(
    context ? 'Context-aware decoding' : 'DoLa   /   contrast two layers',
    73,
    146,
    59,
    P.white,
    'Serif',
  );
  const headers = choose
    ? ['Final', 'Earlier 1', 'Earlier 2']
    : context
      ? ['With record', 'Without', 'Weight', 'Output']
      : ['Final', 'Earlier ' + (selected + 1), 'Weight', 'Output'];
  const xs = choose ? [447, 762, 1077] : [423, 647, 895, 1155];
  d.label('TOKEN', 75, 235, P.mint);
  headers.forEach((h, i) => d.label(h, xs[i], 235, P.mint));
  d.line(73, 256, 1360, 256, P.steel);
  tokens.forEach((token, i) => {
    const y = 331 + i * 104;
    const excluded = masked && dola.weights[i] === 0;
    d.txt(token, 74, y, 42, excluded ? P.gold : P.white, 'Serif');
    const inputs = choose
      ? [final[i], earlier[0][i], earlier[1][i]]
      : [final[i], context ? prior[i] : earlier[selected][i]];
    inputs.forEach((p, j) => {
      const col = choose && j === selected + 1 && d.on(2, 'earlier layer two') ? P.gold : P.mint;
      d.txt(p.toFixed(2), xs[j], y, 41, col, 'Mono');
      d.line(xs[j], y + 19, xs[j] + probabilityWidth, y + 19, P.steel, 2);
      d.rect(xs[j], y + 14, p * probabilityWidth, 10, col);
      if (j === 0 && masked)
        d.line(
          xs[j] + dola.cutoff * probabilityWidth,
          y + 6,
          xs[j] + dola.cutoff * probabilityWidth,
          y + 32,
          P.gold,
          3,
        );
    });
    if (!choose && (excluded || (i === 0 ? firstWeight : otherWeights)))
      d.txt(
        excluded
          ? 'masked'
          : !context && i === 1
            ? '2/3'
            : String(+out.weights[i].toFixed(3)),
        xs[2],
        y,
        35,
        P.gold,
        'Mono',
      );
    if (!choose && (norm || use0)) {
      const p = out.probabilities[i];
      const x = xs[3];
      d.txt(p.toFixed(3), x, y, 36, P.white, 'Mono');
      d.line(x, y + 19, x + probabilityWidth, y + 19, P.steel, 2);
      d.rect(x, y + 14, p * probabilityWidth, 10, P.white);
    }
  });
  d.line(73, 590, 1360, 590, P.steel);
  let note;
  if (choose)
    note = d.on(2, 'largest Jensen-Shannon')
      ? 'Jensen–Shannon divergence   ' +
        js.map((v, i) => 'L' + (i + 1) + ' = ' + v.toFixed(3)).join('     ')
      : 'Compare each candidate with the same final distribution.';
  else if (!context)
    note = masked
      ? 'Keep p(final) ≥ ' + dola.cutoff.toFixed(2) + '     •     weights = p(final) / p(earlier)'
      : 'Cutoff = one fifth of the largest final probability';
  else if (d.b === 5)
    note = d.on(5, 'negative point six')
      ? 'Resolved: 0.20 − 0.80 = −0.60. A negative value cannot be sampled.'
      : 'Same model, question and prefix. Change only the supplied evidence.';
  else if (d.b === 6)
    note = use0
      ? 'α = 0     •     softmax(z with record)'
      : 'softmax((1 + α) z with record − α z without record),   α ≥ 0';
  else
    note =
      'α = 1     •     weight = p(with)² / p(without)' +
      (sum ? '     •     sum = ' + out.sum.toFixed(2) : '');
  d.txt(note, 75, 658, 31, P.mint, 'Sans', { w: 1285 });
  if (d.b === 8)
    d.txt('CAD can amplify an outdated status. Check the date on the record.', 75, 719, 33, P.gold, 'Serif');
}
