import { C, names, wordings, mix, ease } from './counter.mjs';
import {
  baseline,
  p4,
  id,
  dec,
  served,
  toy,
  THRESHOLD,
  candidate,
  releaseRows,
  stripState,
  fixtureResult,
} from './audit.mjs';

function policy(g, t) {
  g.ground();
  const server = t.at(4, 'At fulfillment'),
    change = t.at(4, 'A new cutoff'),
    rewrite = t.at(4, 'Check any rewrite');
  g.head(
    'PROPOSED INTERVENTIONS',
    server ? 'Before issuing the replacement' : 'What changed in the pipeline?',
  );
  if (server) {
    g.blender(130, 361, 0.87);
    g.receipt(64, 495, 268);
    const facts = ['Ownership', 'Defect eligibility', 'Current policy', 'Fulfillment details'];
    g.paper(483, 175, 649, 395);
    g.mono('TRUSTED SERVER RECORDS', 514, 220, 17);
    facts.forEach((f, i) => {
      const y = 284 + i * 67;
      g.type(f, 516, y, 26);
      g.mono('verify', 1096, y, 19, C.sub, 'right');
      g.line(514, y + 13, 1095, y + 13);
    });
    return;
  }
  const cases = [
    ['Training examples', 'Review each wording and its label.'],
    ['Preference training', 'Check which response the signal rewards.'],
    ['Rewriting', 'Compare meaning before and after.'],
    ['Routing cutoff', 'Review service and safety limits.'],
  ];
  cases.forEach(([title, desc], i) => {
    const y = 177 + i * 98,
      active = i < 2 || (i === 2 ? rewrite : change);
    g.rect(62, y, 1075, 79, active ? C.cream : '#e3e4d4', 3);
    g.type(title, 86, y + 49, 25, active ? C.ink : C.sub);
    if (active) g.type(desc, 478, y + 49, 23, C.ink);
  });
}
export function intervention(g, t) {
  if (t.b === 4) return policy(g, t);
  g.ground();
  const real = t.b === 1;
  const deduct = t.at(2, 'The score becomes') && !t.at(3, 'The conversational score returns');
  const penalty = deduct ? 0.11 : 0;
  const data = real
    ? wordings.map((key) => ({ key, score: p4[key], auto: served(p4[key]) }))
    : toy(penalty);
  g.head(
    real ? 'BASELINE   /   TRACE P4' : 'TOY JUDGE   /   CONTROLLED REPLAY',
    real ? 'Where do the traces first differ?' : 'Hold the evidence fixed',
  );
  const { rect, line, type, mono, serif, paper, slip } = g;
  paper(58, 187, 263, 319);
  mono('SHARED INPUT', 80, 226, 16);
  g.blender(130, 326, 0.41);
  type('Receipt · day 12', 80, 434, 24);
  type('Policy · 30 days', 80, 473, 23);
  const x = 411;
  for (const [j, row] of data.entries()) {
    const y = 240 + j * 167;
    line(322, 346, 365, 346, C.rule, 2);
    line(365, 346, 365, y + 41, C.rule, 2);
    line(365, y + 41, x, y + 41, C.rule, 2);
    slip(x, y, 187, 80, row.key, names[row.key], 19);
    if (!real || t.at(1, 'The scores first differ')) {
      line(598, y + 41, 651, y + 41, C.rule, 2);
      serif(dec(row.score), 678, y + 55, 41, C[row.key]);
      line(792, y + 41, 842, y + 41, C.rule, 2);
      type(row.auto ? 'Automatic' : 'Review', 862, y + 50, 31);
    }
  }
  mono('Judge output', 655, 185, 17);
  mono('Route at 0.70', 856, 185, 17);
  if (!real)
    type(
      'Conversational score    ' +
        dec(p4.formal) +
        '  −  ' +
        dec(penalty) +
        '  =  ' +
        dec(data[1].score),
      69,
      576,
      28,
      C.ink,
    );
  if (real) type('Inspect retrieval, judge inputs, rubric, parser and routing rule.', 63, 593, 25);
  if (t.at(3, 'To test that idea'))
    type(
      'Real test    ·    Revise the rubric, then evaluate held-out claims.',
      70,
      623,
      23,
      C.green,
    );
}

const probes = [
  ['BBQ', 'Ambiguous / disambiguated QA', 'Answers'],
  ['StereoSet', 'Sentence alternatives', 'Preferences + LM ability'],
  ['CrowS-Pairs', 'Masked sentence pairs', 'Relative preference'],
  ['BOLD', 'Generation prompt', 'Scored response'],
  ['RealToxicityPrompts', 'Web text prefix', 'Response toxicity'],
  ['WEAT / SEAT', 'Words or sentences', 'Embedding associations'],
];
export function scope(g, t) {
  g.ground(true);
  const { paper, type, mono, serif, line, rect } = g;
  if (t.b < 3) {
    g.head('DIAGNOSTIC PROTOCOLS', 'What did the test actually run?', true);
    mono('PROBE', 66, 201, 18, C.yellow);
    mono('INPUT', 386, 201, 18, C.yellow);
    mono('READOUT', 830, 201, 18, C.yellow);
    const first = t.b === 1 ? 0 : 3;
    const count =
      t.b === 1
        ? 1 + t.at(1, 'StereoSet probes') + t.at(1, 'CrowS-Pairs compares')
        : 2 + t.at(2, 'Embedding tests');
    for (let i = 0; i < count; i++) {
      const [name, input, out] = probes[first + i],
        y = 235 + i * 86;
      rect(56, y, 1087, 70, '#275457', 3);
      type(name, 73, y + 46, 24, C.white);
      type(input, 385, y + 46, 22, C.white);
      type(out, 830, y + 46, 22, C.white);
    }
    if (t.b === 1 && t.at(1, 'Using it with a generator'))
      type('A generator changes the CrowS-Pairs protocol.', 60, 581, 25, C.yellow);
    if (t.b === 2 && t.at(2, 'Record the dataset'))
      type(
        'Record dataset, model revision, prompts, scorer and exclusions.',
        60,
        581,
        25,
        C.yellow,
      );
    return;
  }
  g.head('PRODUCT REGRESSION   /   P4', 'Run the request through the router', true);
  const nodes = [
    ['Conversation', ['Replacement', 'requested'], 1],
    ['Retrieval', ['Receipt · day 12', 'Policy · 30 days'], t.at(3, 'retrieve its receipt')],
    [
      'Judge',
      ['Formal  ' + dec(p4.formal), 'Convers.  ' + dec(p4.conversational)],
      t.at(3, 'score the evidence'),
    ],
    ['Router', ['Automatic', 'Review'], t.at(3, 'run the router')],
  ];
  for (const [i, [label, vals, live]] of nodes.entries()) {
    const x = 56 + i * 279;
    mono(label.toUpperCase(), x + 8, 246, 17, live ? C.yellow : '#b2c6bd');
    if (i) line(x - 35, 357, x, 357, '#79978c', 3);
    if (!live) {
      g.rect(x, 276, 244, 163, '#245052', 4);
      continue;
    }
    paper(x, 276, 245, 163);
    vals.forEach((str, j) => type(str, x + 21, 333 + j * 63, 24, i >= 2 ? C[wordings[j]] : C.ink));
  }
  if (t.at(3, 'The two product routes'))
    type('One claim     ·     Two wordings     ·     Two observed routes', 60, 544, 28, C.white);
  if (t.at(3, 'Record the later outcome'))
    type('Follow the claim into the service records.', 61, 605, 23, C.yellow);
}

const holeX = (i) => 348 + i * 143;
function strip(g, state, key, y, apart) {
  const { ctx, type, mono } = g,
    isFormal = key === 'formal',
    x = 58,
    w = 1084,
    h = 98;
  function path(dy) {
    ctx.beginPath();
    ctx.moveTo(x + 12, y + dy);
    ctx.lineTo(x + w - 14, y + dy);
    ctx.lineTo(x + w, y + dy + 14);
    ctx.lineTo(x + w, y + dy + h);
    ctx.lineTo(x, y + dy + h);
    ctx.lineTo(x, y + dy + 12);
    ctx.closePath();
    for (const [i, hole] of state[key].entries()) {
      if (!hole) continue;
      ctx.moveTo(holeX(i) + 29, y + dy + h / 2);
      ctx.arc(holeX(i), y + dy + h / 2, 29, 0, Math.PI * 2);
    }
  }
  path(4);
  ctx.fillStyle = isFormal ? '#6c352c' : '#15384d';
  ctx.fill('evenodd');
  path(0);
  ctx.fillStyle = C[key];
  ctx.fill('evenodd');
  if (!apart) return;
  type(names[key], x + 18, y + 57, 22, C.white);
  state[key].forEach((hole, i) => {
    if (!hole) {
      ctx.beginPath();
      ctx.arc(holeX(i), y + h / 2, 29, 0, 2 * Math.PI);
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = '#fff4da80';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
      mono('review', holeX(i), y + h / 2 + 5, 15, C.white, 'center');
    }
  });
}
function lightBox(g, t) {
  const rows = releaseRows(t),
    state = stripState(rows),
    isSecond = t.b === 2 || t.b === 3;
  const together =
    t.b === 3
      ? ease(t.at(3, 'Slide the strips together', 1.3)) *
        (1 - ease(t.at(3, 'Separate them again', 1.2)))
      : 0;
  g.ground(true);
  const { rect, mono, type, line } = g;
  g.head(
    'DETERMINISTIC PAIR CHECK   /   CUTOFF ' + dec(THRESHOLD),
    isSecond ? 'Second run' : 'First candidate',
    true,
  );
  rect(43, 153, 1114, 353, '#b48b63', 16);
  rect(49, 148, 1102, 349, '#faf4d8', 13);
  mono('Ready claims', 75, 187, 17);
  state.ready.forEach((r, i) => mono(id(r), holeX(i), 188, 23, C.ink, 'center'));
  strip(g, state, 'formal', 212, together === 0);
  strip(g, state, 'conversational', mix(340, 212, together), together === 0);
  if (t.b === 2) {
    mono('Conversational score', 75, 476, 19, C.conversational);
    state.ready.forEach((row, i) => {
      if (row.id === 'p1' || row.id === 'p6')
        mono(dec(row.conversational), holeX(i), 477, 24, C.conversational, 'center');
    });
    return;
  }
  if (t.b === 3) {
    const shared = t.after(3, 'Light gets through four columns'),
      loss = t.after(3, 'P one loses the fast path when it is worded conversationally'),
      gain = t.after(3, 'P six gains it');
    if (together === 1) {
      type('Strips aligned', 75, 385, 26);
      if (shared) type(state.shared.length + ' holes line up', 75, 435, 31);
    }
    if (together === 0) {
      for (const change of state.changes) {
        if (!(change.delta < 0 ? loss : gain)) continue;
        const x = holeX(state.ready.findIndex((row) => row.id === change.id));
        for (const edge of [x - 42, x + 42]) line(edge, 224, edge, 431, C.yellow, 3);
        const delta = (change.delta < 0 ? '−' : '+') + Math.abs(change.delta);
        mono(delta + ' served', x, 477, 23, C.ink, 'center');
      }
    }
  }
  const full = fixtureResult(rows);
  const showTotals = t.b === 1 || t.after(3, 'Five ready claims still get service in each wording');
  if (showTotals) {
    type('Ready claims served', 60, 531, 26, C.white);
    wordings.forEach((key, i) => {
      const { tp, ready } = full[key];
      type(names[key] + '  ' + tp + ' / ' + ready, 410 + i * 300, 531, 26, C.white);
    });
  }
  if (t.b === 1) {
    type('Unclear claims served', 60, 570, 24, C.white);
    wordings.forEach((key, i) => {
      const { fp, unclear } = full[key];
      type(names[key] + '  ' + fp + ' / ' + unclear, 410 + i * 300, 570, 24, C.white);
    });
  }
  if (t.b === 3 && t.after(3, 'The two flips cancel in the rate')) {
    const lost = state.changes.filter(({ delta }) => delta < 0).length;
    const gained = state.changes.length - lost;
    type(
      'Net change   −' + lost + ' + ' + gained + ' = ' + (gained - lost) + ' served',
      60,
      570,
      26,
      C.white,
    );
  }
  if (t.b === 3 && t.after(3, 'They count separately in the pair check'))
    type(state.flips.length + ' paired flips', 710, 570, 26, C.yellow);
  if (t.b === 3 && t.after(3, 'Block this run'))
    type(full.passed ? 'Pass' : 'Block run', 1129, 570, 26, C.yellow, 'right');
}
function outcome(g, t) {
  const { type, mono, line, paper, serif } = g;
  g.ground();
  g.head('CANDIDATE   /   P4', 'What happened after routing?');
  g.blender(120, 344, 0.77);
  g.receipt(62, 495, 252);
  paper(453, 162, 687, 425);
  mono('SERVICE FOLLOW-UP', 480, 207, 18);
  const unmeasured = t.at(6, 'To measure it');
  const scored = candidate.find((r) => r.id === 'p4');
  const record = [
    ['Formal  ·  ' + dec(scored.formal), served(scored.formal) ? 'Automatic' : 'Review'],
    [
      'Conversational  ·  ' + dec(scored.conversational),
      served(scored.conversational) ? 'Automatic' : 'Review',
    ],
    ['Wait to first service', unmeasured ? 'Unmeasured' : '?'],
    ['Replacement arrived', unmeasured ? 'Unverified' : '?'],
  ];
  record.forEach(([label, val], i) => {
    const y = 269 + 72 * i;
    type(label, 480, y, 23);
    type(val, 1112, y, 25, i > 1 ? C.brick : C.ink, 'right');
    line(478, y + 19, 1111, y + 19);
  });
  if (t.at(6, 'Next, check'))
    type('“Your replacement shipped.”    Check the shipment record.', 456, 626, 23);
}
export function release(g, t) {
  if (t.b <= 3) return lightBox(g, t);
  if (t.b === 6 || t.at(5, 'Back to the blender claim')) return outcome(g, t);
  g.ground();
  g.head('RESTORED FIRST CANDIDATE', 'What would clear the release?');
  const result = fixtureResult(releaseRows(t));
  g.paper(56, 168, 457, 400);
  g.mono('HAND-WRITTEN FIXTURE', 84, 215, 16);
  g.serif(result.passed ? 'Pass' : 'Block', 82, 309, 67, result.passed ? C.green : C.brick);
  g.type(result.pairFlips.length + ' pair flips', 84, 378, 28);
  g.type(result.formal.tp + ' / 6 ready served per wording', 84, 450, 22);
  g.type(result.formal.fp + ' / 4 unclear served per wording', 84, 501, 22);
  g.mono('OPEN PRODUCTION EVIDENCE', 557, 205, 18, C.brick);
  [
    'Representative model evaluation',
    'Coverage of every required slice',
    'Independent case counts meet each minimum',
    'Reviewed interval on the paired gap',
    'Privacy and group-definition review',
    'Owner for outcome monitoring',
  ].forEach((str, i) => {
    const y = 261 + i * 52;
    g.rect(557, y - 19, 16, 16, C.sub, 1);
    g.rect(560, y - 16, 10, 10, C.paper, 1);
    g.type(str, 591, y, 22);
  });
  g.type('Release on hold', 558, 618, 30, C.brick);
}
