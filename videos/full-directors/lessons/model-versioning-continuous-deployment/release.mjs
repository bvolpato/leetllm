import { C, short, pct } from './drawing.mjs';
import * as E from './examples.mjs';

const histories = E.aliasHistory();
export function identity(g) {
  const { head, paper, rect, txt, mono, line, cue, beat } = g;
  const edited = cue(2, 'Change just the sentence'),
    originalAgain = cue(3, 'keep the original candidate');
  const view = originalAgain ? 1 : edited ? 2 : 1;
  const indices = beat === 1 ? [0, 1] : [1, view];
  const records = indices.map(E.bundle);
  head(
    'Release archive  /  retained bytes',
    beat === 1 ? 'What belongs to a release?' : 'One sentence changes the seal',
  );
  records.forEach((m, i) => {
    const x = 42 + i * 455;
    paper(x, 116, 417, 347);
    rect(x, 116, 417, 49, i === 0 ? C.stable : C.candidate);
    txt(
      (beat === 1
        ? ['Stable', 'Candidate']
        : ['Retained candidate', view === 2 ? 'Edited copy' : 'Candidate'])[i],
      x + 17,
      150,
      25,
      C.white,
      { face: 'Serif' },
    );
    mono('COMPILED PROMPT', x + 19, 196, 12, C.dim);
    const words = E.promptBytes[indices[i]].split(' ');
    const mid = Math.ceil(words.length / 2);
    txt(words.slice(0, mid).join(' '), x + 19, 228, 22, C.ink, { face: 'Serif', w: 380 });
    txt(words.slice(mid).join(' '), x + 19, 254, 22, C.ink, { face: 'Serif', w: 380 });
    line(x + 18, 270, x + 399, 270);
    const visible = cue(1, 'hash those retained bytes');
    const rows = [
      ['model', m.model],
      ['prompt', visible ? short(m.prompt) : '…'],
      ['image', visible ? short(m.runtime) : '…'],
    ];
    rows.forEach(([a, b], n) => {
      mono(a, x + 19, 299 + n * 28, 15, C.dim);
      mono(
        b,
        x + 111,
        299 + n * 28,
        17,
        n === 1 && i === 1 && view === 2 ? C.candidate : C.ink,
        291,
      );
    });
    rect(x, 389, 417, 74, '#d2dfcc');
    mono('MANIFEST  /  SHA-256', x + 20, 414, 13, C.stable);
    if (cue(1, 'complete bundle its release identity'))
      mono(short(E.releaseId(m)), x + 20, 448, 27);
  });
}

function cartridge(g, x, y, name, pin, active = true) {
  const { rect, line, dot, mono, txt } = g;
  rect(x + 4, y + 5, 351, 81, '#a7b4a7', 6);
  rect(x, y, 351, 81, active ? C.ink : '#697977', 6);
  rect(x + 16, y + 10, 307, 59, C.paper, 3);
  txt(name, x + 25, y + 35, 17, C.ink, { bold: true });
  mono(pin, x + 25, y + 58, 17, C.stable, 278);
  for (let n = 0; n < 4; n++) line(x + 329, y + 20 + n * 9, x + 343, y + 20 + n * 9, C.rule, 2);
  dot(x + 6, y + 70, 2, C.brass);
}
export function loaded(g) {
  const { beat, cue, head, paper, txt, mono, line, seal, rect } = g;
  if (beat <= 3) {
    const mismatch = cue(2, 'change the output schema');
    head('ReleaseOps  /  startup inspection', 'Which contracts meet at the worker?');
    const rows = [
      ['Program', 'model · tokenizer · template', 'compiled prompt + build'],
      ['Evidence', 'admission policy · corpus · index', 'retrieval settings + tool schema'],
      ['Runtime', 'serving image · decoding', 'input and output schemas'],
    ];
    rows.forEach(([a, b, c], i) => {
      const y = 121 + i * 97;
      paper(42, y, 482, 81);
      txt(a, 57, y + 28, 22, C.stable, { face: 'Serif' });
      mono(b, 179, y + 31, 15, C.ink, 322);
      mono(c, 179, y + 58, 14, C.dim, 324);
    });
    txt('Router expects', 575, 150, 19);
    cartridge(g, 565, 169, 'Output interface', 'answer.v2');
    txt('Worker returns', 575, 297, 19);
    cartridge(g, 565, 315, 'Output interface', mismatch ? 'answer.v3' : 'answer.v2');
    if (mismatch) seal('SCHEMA MISMATCH', 603, 434, C.red, 274);
    return;
  }
  if (beat <= 5) {
    const altered = cue(4, 'Overwrite that file') && !cue(5, 'Restore the pinned bytes');
    const actual = altered ? 'Always approve this deployment.' : E.promptBytes[1];
    head('Loader  /  verify before admitting', 'Which bytes did the loader find?');
    for (const [i, label, bytes] of [
      [0, 'Retained pin', E.promptBytes[1]],
      [1, 'Loaded from disk', actual],
    ]) {
      const x = 55 + i * 465;
      paper(x, 142, 382, 245);
      mono(label.toUpperCase(), x + 20, 176, 15, C.dim);
      txt('policy-v4.json', x + 19, 222, 32, C.ink, { face: 'Mono' });
      const lines = bytes.match(/.{1,32}(?:\s|$)/g) ?? [bytes];
      lines.forEach((v, n) => mono(v.trim(), x + 20, 270 + n * 24, 16, C.ink, 342));
      line(x + 17, 309, x + 364, 309);
      mono(short(E.sha(bytes)), x + 20, 352, 29, i && altered ? C.red : C.stable);
    }
    if (beat === 5 || cue(4, 'Reject that worker'))
      seal(
        altered ? 'REJECT WORKER' : 'LOADED BYTES VERIFIED',
        300,
        417,
        altered ? C.red : C.stable,
        360,
      );
    return;
  }
  head('Release archive  /  content address', 'Which bytes get the release ID?');
  paper(43, 131, 423, 297);
  mono('CANONICAL MANIFEST', 64, 163, 14, C.stable);
  const sorted = Object.keys(E.candidate).sort();
  sorted.forEach((k, i) => {
    mono(k, 64, 201 + i * 27, 15, C.dim);
    mono(E.candidate[k].slice(0, 20), 195, 201 + i * 27, 15, C.ink, 250);
  });
  rect(483, 255, 39, 4, C.candidate);
  paper(541, 145, 365, 133);
  mono('SHA-256  /  UTF-8', 563, 177, 14, C.dim);
  mono(short(E.CANDIDATE), 563, 233, 34, C.stable);
  if (cue(6, 'Store the evaluation report separately')) {
    paper(541, 308, 365, 129);
    txt('Separate evaluation report', 562, 344, 22, C.ink, { face: 'Serif' });
    mono('release   ' + short(E.report.release), 562, 380, 16);
    mono('report    ' + short(E.sha(E.canonical(E.report))), 562, 408, 16);
  }
}

export function aliases(g, state, opts = {}) {
  const { rect, dot, txt, mono, path } = g;
  const x = 155,
    dest = 683;
  const ys = [224, 362];
  for (const [i, name] of ['production', 'canary'].entries()) {
    const rec = state[name],
      to = rec.target === E.STABLE ? 0 : 1;
    const col = i ? C.candidate : C.stable;
    const a = ys[i],
      b = ys[to] + (i ? 12 : -12);
    path(
      [
        [x + 132, a],
        [x + 191, a],
        [dest - 153, b],
        [dest - 16, b],
      ],
      col,
      7,
    );
  }
  [E.STABLE, E.CANDIDATE].forEach((val, i) => {
    const y = ys[i];
    rect(dest - 20, y - 43, 238, 86, C.ink, 6);
    txt(E.nameOf(val), dest + 10, y - 7, 23, C.white, { bold: true });
    mono(short(val), dest + 11, y + 24, 16, C.brass);
  });
  ['production', 'canary'].forEach((name, i) => {
    const y = ys[i];
    rect(44, y - 36, 243, 72, i ? C.candidate : C.stable, 5);
    txt(name, 65, y + 8, 25, C.white, { face: 'Serif' });
    mono('r' + state[name].revision, 232, y + 8, 19, C.white);
    dot(284, y, 6, C.brass);
  });
  if (opts.message) g.seal(opts.message, 156, 434, opts.color || C.stable, 648);
}
export function provider(g) {
  const { beat, cue, head, paper, txt, mono, seal, line } = g;
  if (beat >= 4) {
    head('Release registry  /  pointer history', 'Two visits to the same target');
    const r = cue(4, 'and back') ? 2 : cue(4, 'from stable to candidate') ? 1 : 0;
    aliases(g, histories.states[r], {
      message: cue(5, 'compare the target and revision')
        ? 'Compare target + revision in one authorized write'
        : '',
    });
    return;
  }
  head('Hosted model  /  endpoint directory', 'What will this name resolve to?');
  if (beat === 1) {
    const tuesday = cue(1, 'On Tuesday');
    paper(46, 131, 320, 275);
    txt(tuesday ? 'Tuesday' : 'Monday', 70, 197, 46, C.ink, { face: 'Serif' });
    mono('Application release R1', 70, 255, 19, C.stable);
    mono('alias   model-family', 70, 302, 18);
    line(369, 267, 531, 267, C.candidate, 5);
    g.dot(535, 267, 8, C.candidate);
    cartridge(g, 551, 221, 'Provider-resolved version', tuesday ? 'snapshot B' : 'snapshot A');
    return;
  }
  paper(44, 126, 455, 316);
  mono('SAVED INPUT  /  TEMPERATURE 0', 66, 163, 16, C.dim);
  ['A', 'B', 'A'].forEach((out, i) => {
    mono('request 205', 67, 219 + i * 72, 19);
    line(226, 211 + i * 72, 272, 211 + i * 72);
    mono(cue(2, 'Two replies match') ? 'reply ' + out : '…', 297, 219 + i * 72, 21);
  });
  cartridge(g, 555, 184, 'Stable endpoint', 'snapshot A');
  if (beat === 3)
    seal(
      cue(3, 'provider has retired it') ? 'RETIRED  /  UNAVAILABLE' : 'Checking availability',
      560,
      306,
      cue(3, 'provider has retired it') ? C.red : C.hold,
      344,
    );
}

export function registry(g) {
  const { head, cue, beat } = g;
  const n = cue(2, 'then returns to stable') ? 2 : cue(2, 'Production moves to candidate') ? 1 : 0;
  head(
    'Release registry  /  immutable records',
    beat === 1 ? 'Register the bundles' : 'Compare the delayed write',
  );
  const stale = cue(2, 'Its update is rejected');
  aliases(g, histories.states[n], {
    message: stale
      ? 'REJECTED    expected stable r1    ·    found stable r3'
      : beat === 2
        ? 'Delayed writer holds (stable, r1)'
        : '',
    color: stale ? C.red : C.hold,
  });
}

export function worksheet(g) {
  const { head, paper, txt, mono, beat, cue, rect, line, seal } = g;
  const score = E.routeF1(90, 5, 10);
  head(
    'Offline evaluation  /  routing worksheet',
    beat < 5 ? 'Which routing errors enter F1?' : 'The frozen offline contract',
  );
  if (beat >= 5) {
    const pairs = [
      ['Overall route F1', '≥ 0.92'],
      ['Rollback slice F1', '≥ 0.90'],
      ['Unsupported serves', '= 0'],
      ['Distinct cases', '200, fully reviewed'],
      ['Report age', '0–24 hours'],
      ['p95 latency', '≤ 500 ms'],
    ];
    paper(103, 119, 754, 342);
    pairs.forEach(([a, b], i) => {
      const y = 162 + i * 51;
      txt(a, 133, y, 20);
      mono(b, 540, y, 20, C.stable);
      line(124, y + 15, 833, y + 15);
    });
    if (beat === 6) mono('Latency population includes terminal errors and timeouts.', 131, 491, 17);
    return;
  }
  const rows = [
    ['TP', 'Supported', 'Serve', 90],
    ['FP', 'Unsupported', 'Serve', 5],
    ['FN', 'Supported', 'Abstain', 10],
  ];
  paper(46, 122, 488, 279);
  rows.forEach(([sym, truth, out, n], i) => {
    const y = 185 + i * 82;
    rect(60, y - 34, 53, 47, i === 1 ? C.candidate : C.stable, 3);
    mono(sym, 73, y, 19, C.white);
    txt(truth, 131, y, 20);
    txt(out, 293, y, 20);
    if (beat >= 3) mono(n, 455, y, 22);
    line(61, y + 20, 516, y + 20);
  });
  if (beat >= 2) {
    mono('ROUTE F1', 588, 151, 15, C.stable);
    const values = cue(3, 'Double ninety');
    txt(values ? score.numerator : '2 × TP', 731, 229, 37, C.ink, {
      align: 'center',
      face: 'Serif',
    });
    line(559, 248, 907, 248, C.ink, 2);
    txt(values ? '180 + 5 + 10' : '2 × TP + FP + FN', 731, 298, 30, C.ink, {
      align: 'center',
      face: 'Serif',
    });
    if (cue(3, 'twelve thirteenths')) mono('= ' + score.f1.toFixed(3), 619, 376, 34, C.stable);
  }
  if (beat === 4)
    seal(
      'Average clears 0.92     /     5 unsupported serves violate the zero rule',
      89,
      431,
      C.red,
      782,
    );
}

export function replay(g) {
  const { beat, cue, head, paper, mono, txt, line, seal } = g;
  head(
    'Retained trace  /  request 205',
    beat <= 4 ? 'Did the incident reproduce?' : 'May this tool result be reused?',
  );
  if (beat <= 4) {
    paper(42, 122, 401, 308);
    mono('SHIP-4412    /    payment-tests', 61, 162, 16, C.dim);
    txt('Approved to ship?', 61, 234, 37, C.ink, { face: 'Serif' });
    line(61, 263, 418, 263);
    mono('Approval record', 62, 307, 15, C.dim);
    txt('Empty', 61, 362, 34, C.candidate, { face: 'Serif' });
    ['historical', 'stable', 'candidate'].forEach((p, i) => {
      const visible = [
        cue(1, 'It serves the approval'),
        cue(3, 'Stable withholds'),
        cue(3, 'It withholds too'),
      ][i];
      const y = 175 + i * 98;
      txt(p, 488, y, 24, C.ink, { face: 'Serif' });
      line(489, y + 14, 902, y + 14);
      if (visible) seal(E.approvalRoute(p, false), 704, y - 29, i ? C.stable : C.red, 188);
    });
    return;
  }
  const version = cue(6, 'version to eight') ? 8 : 7;
  const match = E.replayRecordedTool(E.toolRecord, { name: E.toolRecord.name, args: { version } });
  [
    [43, 'Candidate invocation', version],
    [515, 'Recorded invocation', 7],
  ].forEach(([x, title, v]) => {
    paper(x, 137, 400, 221);
    mono(title.toUpperCase(), x + 21, 176, 14, C.dim);
    txt('read_policy', x + 20, 239, 35, C.ink, { face: 'Mono' });
    mono('version = ' + v, x + 21, 298, 25, C.ink);
  });
  if (match.matched && cue(5, 'give it the saved result'))
    seal('Saved result   /   ' + match.result, 190, 401, C.stable, 580);
  if (!match.matched && beat >= 7)
    seal('STOP    /    No matching recorded invocation', 172, 401, C.red, 615);
}

export function report(g) {
  const { head, paper, mono, txt, beat, cue, seal, line } = g;
  const changed = cue(2, 'Change only the evaluator');
  const r = { ...E.report, evaluator: changed ? 'claim-eval-v3' : E.report.evaluator };
  const gate = E.offlineGate(r);
  head('Review intake  /  exact release', 'Whose evaluation is this?');
  paper(42, 115, 530, 358);
  mono('RETAINED REPORT', 64, 146, 14, C.stable);
  [
    ['Release', short(r.release)],
    ['Suite / schema', r.suite + ' / ' + r.schema],
    ['Evaluator', r.evaluator],
    ['Support / latency', r.supportChecked + ' / ' + r.latencyChecked + ' of ' + r.cases],
    ['Age', r.ageHours + ' h'],
  ].forEach(([a, b], i) => {
    const y = 189 + i * 46;
    txt(a, 65, y, 18);
    mono(b, 287, y, 18, i === 2 && changed ? C.red : C.ink, 265);
    line(64, y + 13, 551, y + 13);
  });
  mono('Expected   ' + E.candidate.evaluator, 64, 443, 17, C.stable);
  txt('Offline measurements', 604, 162, 25, C.ink, { face: 'Serif' });
  [
    ['Route F1', r.f1],
    ['Rollback F1', r.rollbackF1],
    ['Unsupported', r.unsupported],
    ['p95 latency', r.p95 + ' ms'],
  ].forEach(([a, b], i) => {
    txt(a, 605, 222 + i * 46, 19);
    mono(b, 804, 222 + i * 46, 20);
  });
  if (changed ? cue(3, 'Reject the report') : cue(1, 'This report clears'))
    seal(
      gate.allowed ? 'OFFLINE ELIGIBLE' : 'REJECT  /  EVALUATOR',
      598,
      411,
      gate.allowed ? C.stable : C.red,
      316,
    );
}

export function inventory(g) {
  const { beat, cue, head, rect, mono, txt, paper, line, seal } = g;
  head(
    'Case inventory  /  evidence intake',
    beat <= 2
      ? 'Match each result to one expected case'
      : beat === 3
        ? 'Can the gate read this value?'
        : 'What did this event authorize?',
  );
  if (beat <= 2) {
    const reveal = cue(2, 'Case three is missing');
    mono('EXPECTED CASE', 43, 164, 14, C.dim);
    mono('RESULT SLIPS', 43, 321, 14, C.dim);
    for (let i = 0; i < 5; i++) {
      const x = 206 + i * 145;
      const slot = i + 1,
        actual = E.caseIds[i];
      rect(x, 124, 119, 76, '#c6d1c2', 4);
      mono('00' + slot, x + 27, 173, 30);
      line(x + 59, 202, x + 59, 254, C.rule, 2);
      const sort = cue(2, 'Case two was counted twice', 0.85);
      const slipX = x + (actual - slot) * 145 * sort,
        slipY = 271 + (i === 1 ? -30 : actual !== slot ? 49 : 0) * sort;
      paper(slipX, slipY, 119, 97);
      mono('00' + actual, slipX + 20, slipY + 60, 32, reveal && actual !== slot ? C.red : C.ink);
    }
    if (reveal)
      seal('Missing case 00' + E.missingCase + '    /    Check distinct IDs', 185, 431, C.red, 620);
    return;
  }
  if (beat === 3) {
    const examples = [
      ['Missing', undefined],
      ['Boolean', true],
      ['Numeric string', '0.93'],
      ['Negative', -1],
      ['NaN', NaN],
      ['Overflow', Infinity],
    ];
    examples.forEach(([a, v], i) => {
      const x = 48 + (i % 3) * 299,
        y = 143 + Math.floor(i / 3) * 149;
      paper(x, y, 266, 115);
      txt(a, x + 17, y + 36, 22, C.ink, { face: 'Serif' });
      mono(String(v), x + 17, y + 68, 18);
      if (cue(3, 'Reject booleans'))
        mono(E.validMetric(v) ? 'VALID' : 'REJECT', x + 143, y + 92, 16, C.red);
    });
    return;
  }
  const stages = [
    ['Registered', 'Digest is addressable'],
    ['Offline eligible', 'Next experiment'],
    ['Canary alias', 'Target selected'],
    ['Router admits', 'Request routed to candidate'],
  ];
  stages.forEach(([a, b], i) => {
    const y = 155 + i * 81;
    const show = [
      1,
      cue(4, 'Passing this offline gate'),
      cue(4, 'Moving a canary alias'),
      cue(4, 'actually admit traffic'),
    ][i];
    g.dot(114, y, 10, show ? C.stable : C.rule);
    if (i < 3) line(114, y + 13, 114, y + 66);
    txt(a, 152, y + 8, 26, show ? C.ink : C.dim, { face: 'Serif' });
    if (show) mono(b, 475, y + 8, 22, C.stable);
  });
}
