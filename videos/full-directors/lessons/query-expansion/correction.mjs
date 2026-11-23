import { C, mix } from './ink.mjs';
import {
  HYDE_PROXIES,
  mean,
  unitMean,
  driftRuns,
  CRITIQUE_BRANCHES,
  CRITIQUE_WEIGHTS,
  supportMass,
  familyMass,
  support,
  credits,
  correctionPath,
  passages,
  kept,
  stripThreshold,
  contexts,
  historyDigest,
  cacheHit,
  permitsEgress,
  terms,
} from './evidence.mjs';
import { PROXY_CORPUS } from '../../../films/query-expansion/fixtures.mjs';

export function vectors(p) {
  const { at, base, mono, serif, text, line, circle, rect, band, tag } = p;
  const encoded = at(1, 'Encode each passage');
  const averaged = at(3, 'The mean is');
  const normalized = at(4, 'normalize the nonzero mean');
  base('HyDE   /   ILLUSTRATIVE PASSAGE ENCODER', 'Where do two imagined passages send search?');
  mono('LAUNCH WEEK THROUGHPUT', 39, 143, 15);
  [
    ['A', 'Request a temporary quota increase.', C.blue],
    ['B', 'Schedule offline jobs in batches.', C.rust],
  ].forEach(([id, s, color], i) => {
    const y = 169 + i * 55;
    rect(38, y - 1, 36, 37, color, 5);
    text(id, 56, y + 26, 22, C.white, 'Mono', 26, 'center');
    serif(s, 88, y + 26, 25, C.ink, 810);
  });
  [0, 1, 2].forEach((j) => {
    const x = 38 + j * 300,
      w = 273;
    mono('Coordinate ' + (j + 1), x, 299);
    line(x + 16, 352, x + w - 15, 352, C.soft, 2);
    const pos = (v) => x + 16 + v * (w - 31);
    if (encoded)
      HYDE_PROXIES.forEach((v, i) => {
        const u = pos(v[j]),
          cy = i ? 366 : 338,
          col = i ? C.rust : C.blue;
        line(u, 352, u, cy, col, 2);
        circle(u, cy, 5, col);
        mono(v[j].toFixed(1), u, i ? 391 : 326, 17, col, 58, 'center');
      });
    if (averaged) {
      circle(pos(mean[j]), 352, 8, C.jade);
      mono('mean ' + mean[j].toFixed(1), x, 426, 18, C.jade);
    }
  });
  const vector = (v) => '[' + v.map((x) => x.toFixed(2)).join(',  ') + ']';
  band(
    normalized
      ? 'Unit-length index   →   normalize mean   →   ' + vector(unitMean)
      : averaged
        ? 'Corpus search   ←   mean of A and B    ' + vector(mean)
        : 'Generated passages guide the search. A retrieved source must support the answer.',
  );
}

export function drift(p) {
  const { at, base, film, mono, text, serif, rect, line, tag, band, words } = p;
  const changed = at(2, 'enable automatic replica scaling');
  const ranked = changed
    ? at(3, 'The quota policy falls out')
    : at(1, 'Both policies make the cut');
  const current = driftRuns[changed ? 1 : 0];
  base(
    'HyDE DRIFT   /   WORD-OVERLAP DEMONSTRATION',
    'Which policy drops out of the two-page window?',
  );
  film(38, 119, 884, 81);
  mono('GENERATED PROXY', 58, 149, 14, C.amber);
  text(current.proxy, 57, 179, 24, C.white, 'Serif', 838);
  mono('Indexed text', 38, 232);
  mono('Matches', 527, 232);
  mono('First run', 664, 232);
  if (changed) mono('Replay', 793, 232);
  PROXY_CORPUS.forEach((doc, i) => {
    const y = 247 + i * 57;
    rect(38, y, 883, 49, i % 2 ? C.white : '#e1e3d6', 2);
    const matches = [...terms(doc.text)].filter((word) => terms(current.proxy).has(word));
    words(doc.text, 49, y + 32, ranked || changed ? matches : [], 475, 19);
    mono(ranked || changed ? matches.length : '?', 550, y + 32, 20, C.blue);
    const prev = driftRuns[0].hits.findIndex((h) => h.document.id === doc.id) + 1;
    const rank = current.hits.findIndex((h) => h.document.id === doc.id) + 1;
    const showOld = changed || ranked;
    mono(showOld ? (prev ? '#' + prev : 'out') : '?', 674, y + 32, 18, C.soft);
    if (changed)
      tag(
        ranked ? (rank ? '#' + rank + '  in' : 'out') : '?',
        789,
        y + 10,
        105,
        ranked && rank ? C.mint : C.shade,
        ranked && rank ? C.jade : C.soft,
      );
  });
  band(
    ranked
      ? changed
        ? '2 matches keep Batch. 3 scaling matches bring Overview into first place.'
        : 'Required sources in the top two    ' + current.recovered + ' / 2'
      : 'Required pages    Quota policy + Batch policy   ·   Keep the same corpus and k = 2.',
  );
}

export function reflection(p) {
  const { at, base, mono, text, rect, serif, tag, band, slip, line } = p;
  const fetch = at(1, 'it requests a passage');
  const relevant = at(2, 'marks the passage relevant');
  const write = at(2, 'then writes');
  const supported = at(2, 'fully supported');
  const rated = at(2, 'four out of five');
  base('SELF-RAG   /   ONE DECODED SEGMENT', 'What supports the next sentence?');
  mono('Launch question', 40, 142);
  serif('Can we increase throughput for launch week?', 217, 145, 25);
  ['Yes • fetch', 'No • skip', 'Continue • reuse'].forEach((label, i) => {
    const x = 38 + 300 * i;
    rect(x, 164, 285, 42, fetch && i === 0 ? C.jade : C.shade, 3);
    text(label, x + 14, 192, 22, fetch && i === 0 ? C.white : C.soft);
  });
  slip(38, 228, 884, 82);
  mono('SOURCE E1', 59, 253);
  text(
    fetch ? passages[0].text : 'Awaiting retrieval decision',
    59,
    288,
    25,
    fetch ? C.ink : C.soft,
    'Serif',
    650,
  );
  if (relevant) tag('ISREL  Relevant', 715, 262, 181);
  slip(38, 327, 884, 96);
  mono('NEXT SENTENCE', 59, 353);
  text(
    write ? 'Request approval for a temporary increase.' : '…',
    59,
    398,
    25,
    C.blue,
    'Serif',
    635,
  );
  if (supported) tag('ISSUP  Full support', 698, 337, 203);
  if (rated) tag('ISUSE  4 / 5', 698, 378, 203, C.sky, C.blue);
  band(
    at(4, 'A training critic')
      ? 'Offline critic labels training data. The generator emits tokens during decoding.'
      : supported
        ? 'Verify the predicted support against “require approval” in E1.'
        : 'The generator predicts a retrieval action before writing a segment.',
  );
}

export function critique(p) {
  const { at, base, mono, text, rect, line, serif, band, tag, beat, circle } = p;
  if (beat <= 3) {
    base('SELF-RAG   /   SUPPORT TOKEN FAMILY', 'How much support credit does this sentence earn?');
    mono('A', 38, 149, 18, C.blue);
    serif('Request approval for a temporary increase.', 78, 150, 27);
    const groups = [...supportMass, 1 - familyMass],
      cols = [C.jade, C.rust, C.blue, '#97a59b'];
    ['Full', 'Partial', 'None', 'Other tokens'].forEach((s, i) => {
      const x = 38 + i * 223;
      rect(x, 178, 12, 27, cols[i]);
      text(s + '   ' + groups[i].toFixed(2), x + 19, 200, 22);
    });
    const x = 38,
      dx = 8.82;
    const normalized = at(2, 'Normalize within');
    for (let i = 0; i < 100; i++) {
      const k = i < 47 ? 0 : i < 49 ? 1 : i < 50 ? 2 : 3;
      rect(x + i * dx, 233, 7.3, 76, normalized && k === 3 ? C.shade : cols[k], 1);
    }
    if (normalized) {
      const end = x + dx * 100 * familyMass;
      line(x, 318, x, 330, C.jade, 2);
      line(x, 330, end, 330, C.jade, 2);
      line(end, 330, end, 318, C.jade, 2);
      mono('Family probability    ' + familyMass.toFixed(2), x, 363, 20, C.jade);
    }
    const value = at(3, 'That gives point nine six');
    if (beat === 3)
      text(
        '(0.47 × 1 + 0.02 × ½ + 0.01 × 0) / 0.50   =   ' + (value ? support.toFixed(2) : '?'),
        38,
        415,
        28,
        C.ink,
        'Mono',
        875,
      );
    band(
      normalized
        ? 'Divide by the probability within the support family.'
        : 'Full earns 1   ·   Partial earns ½   ·   None earns 0',
    );
    return;
  }
  if (beat === 4) {
    base('SELF-RAG   /   UTILITY TOKEN FAMILY', 'What credit does each utility rating earn?');
    line(93, 278, 866, 278, C.ink, 3);
    credits.forEach((credit, i) => {
      const x = 93 + i * 193;
      text('Rating ' + (i + 1), x, 215, 23, C.soft, 'Sans', 128, 'center');
      circle(x, 278, 16, credit < 0 ? C.rust : credit > 0 ? C.jade : C.soft);
      text(credit > 0 ? '+' + credit : credit, x, 352, 42, C.ink, 'Mono', 146, 'center');
    });
    band('Utility score    =    sum of credits weighted by their within-family probabilities.');
    return;
  }
  const multiply = at(6, 'Multiply each score');
  const a = at(6, 'approval sentence scores');
  const b = at(6, 'unlimited claim scores');
  const winner = at(6, 'approval sentence wins');
  base(
    'SELF-RAG   /   EQUAL GENERATION LIKELIHOOD',
    'Which continuation survives the weighted comparison?',
  );
  mono('E1    “Temporary quota increases require approval.”', 39, 141, 17, C.jade);
  mono('Candidate', 39, 191);
  ['Relevance', 'Support', 'Utility'].forEach((s, j) => {
    const x = 408 + j * 128;
    mono(s, x, 185, 14, C.soft, 119, 'center');
    mono('× ' + CRITIQUE_WEIGHTS[j], x, 208, 16, C.soft, 118, 'center');
  });
  mono('TOTAL', 829, 191);
  CRITIQUE_BRANCHES.forEach((branch, i) => {
    const y = 226 + i * 102;
    rect(38, y, 884, 90, winner && !i ? C.mint : C.white, 3);
    mono(branch.id, 51, y + 29, 17, C.blue);
    serif(i ? 'Unlimited traffic' : 'Request approval', 83, y + 44, 24, C.ink, 244);
    branch.scores.forEach((s, j) => {
      const x = 408 + j * 128;
      text(s.toFixed(2), x, y + 35, 25, C.ink, 'Mono', 111, 'center');
      if (multiply)
        mono('+' + branch.contributions[j].toFixed(3), x, y + 68, 17, C.soft, 113, 'center');
    });
    text(
      (i ? b : a) ? branch.total.toFixed(3) : '?',
      849,
      y + 50,
      27,
      winner && !i ? C.jade : C.ink,
      'Mono',
      115,
      'center',
    );
  });
  band(
    winner
      ? beat === 8
        ? 'Retained branches need further decoding at each segment.'
        : 'E1 requires approval. The higher support score favors A.'
      : 'Support carries three times the weight of either other family.',
  );
}

export function router(p) {
  const { at, base, mono, text, rect, line, serif, tag, circle, band } = p;
  const grades = [0.81, 0.45, 0.17];
  const high = at(1, 'point eight one');
  const mid = at(3, 'point four five');
  const low = at(4, 'point one seven');
  const best = Math.max(grades[low ? 2 : mid ? 1 : 0], 0.12);
  const path = correctionPath(best);
  const decided = low
    ? at(4, 'Discard these internal hits')
    : mid
      ? at(3, 'combine internal and approved external evidence')
      : at(2, 'use the internal passages');
  const denied = at(5, 'Keep the private question inside');
  base(
    'CORRECTIVE RAG   /   TRAINED RETRIEVAL EVALUATOR',
    'Where does the best document score send this set?',
  );
  mono('ILLUSTRATIVE SCALE', 39, 143);
  text(
    'E1    ' + (high ? best.toFixed(2) : '?') + '                 E2    0.12',
    39,
    188,
    27,
    C.ink,
    'Mono',
  );
  const x0 = 70,
    w = 810,
    px = (v) => x0 + w * v;
  const zones = [
    ['external', 0, 0.2, C.amber],
    ['combined', 0.2, 0.7, C.sky],
    ['internal', 0.7, 1, C.mint],
  ];
  zones.forEach(([, lo, hi, color]) => rect(px(lo), 254, (hi - lo) * w, 43, color));
  [0, 0.2, 0.7, 1].forEach((v) => {
    line(px(v), 247, px(v), 305, C.ink, 2);
    mono(v.toFixed(1), px(v), 332, 16, C.ink, 66, 'center');
  });
  if (high) {
    circle(px(best), 273, 9, C.dark);
    line(px(best), 240, px(best), 261, C.dark, 2);
    mono('max ' + best.toFixed(2), px(best), 232, 17, C.ink, 140, 'center');
  }
  const labels = {
    external: denied ? 'External • dispatch blocked' : 'Seek external evidence',
    combined: 'Refine and combine',
    internal: 'Refine internal evidence',
  };
  zones.forEach(([id, lo, hi], i) => {
    const x = 38 + i * 300,
      hot = decided && id === path;
    rect(x, 356, 284, 61, hot ? (denied ? C.rust : C.dark) : C.shade, 4);
    mono(
      ['best < 0.2', '0.2 ≤ best ≤ 0.7', 'best > 0.7'][i],
      x + 13,
      377,
      13,
      hot ? C.amber : C.soft,
    );
    text(labels[id], x + 13, 402, 18, hot ? C.white : C.ink);
  });
  const directions = {
    external: 'Incorrect   ·   Discard the weak internal hits. External lookup requires permission.',
    combined: 'Ambiguous   ·   Refine both sources, subject to permission for external search.',
    internal: 'Correct   ·   Refine the internal passages before generation.',
  };
  band(
    denied
      ? 'Private policy question   ·   External dispatch denied. Seek an approved internal source.'
      : decided ? directions[path] : 'Compare the maximum with both marks.',
  );
}

export function refine(p) {
  const { at, base, mono, text, rect, line, slip, band, tag } = p;
  const split = at(1, 'Split the page', 0.6);
  const graded = at(2, 'point six in this example');
  const filtered = at(2, 'clear it');
  const transfer = at(2, 'Copy them into the answer context', 0.85);
  base('KNOWLEDGE REFINEMENT   /   SOURCE E1', 'Which strips answer the launch question?');
  mono('ORIGINAL PAGE', 39, 143);
  mono('ANSWER CONTEXT', 536, 143);
  line(500, 156, 500, 423, C.edge, 2);
  passages.forEach((row, i) => {
    const y = 162 + i * (55 + 8 * split);
    slip(38, y, 433, 53);
    mono(split ? row.id : 'E1', 53, y + 18, 13, C.jade);
    text(row.text, 52, y + 42, 19, C.ink, 'Sans', 405);
    if (graded)
      mono(
        row.score.toFixed(2),
        451,
        y + 18,
        14,
        filtered ? (row.score >= stripThreshold ? C.jade : C.rust) : C.soft,
        65,
        'right',
      );
  });
  if (transfer)
    kept.forEach((row, i) => {
      const x = 531,
        y = mix(162 + passages.indexOf(row) * 63, 172 + 99 * i, transfer);
      p.c.save();
      p.c.beginPath();
      p.c.rect(x, y, 394 * transfer, 78);
      p.c.clip();
      slip(x, y, 390, 72, C.mint);
      mono(row.id, x + 17, y + 21, 14, C.jade);
      text(row.text, x + 17, y + 53, 19, C.ink, 'Sans', 355);
      p.c.restore();
    });
  band(
    transfer === 1
      ? 'Citations keep their original positions    ' + kept.map((r) => r.id).join('  →  ')
      : graded
        ? 'Keep strips scoring at least ' + stripThreshold.toFixed(2) + '.'
        : 'Launch question    /    Which quota and retry advice applies?',
  );
}

export function boundaries(p) {
  const { at, base, mono, text, rect, line, film, tag, slip, serif, band, beat, arrow } = p;
  if (beat === 1) {
    base(
      'FALLBACK POLICY   /   RETRIEVAL QUALITY AND ACCESS',
      'Which question can leave the private index?',
    );
    const rows = [
      ['private', 'Internal quota exception', false],
      ['public', 'Published API limits', true],
    ];
    rows.forEach(([scope, label, approved], i) => {
      const y = 155 + i * 142;
      slip(38, y, 365, 103);
      mono(scope.toUpperCase() + ' QUESTION', 57, y + 26);
      serif(label, 57, y + 72, 27);
      const allowed = permitsEgress(scope, approved);
      const resolve = !allowed || at(1, 'For an approved public question');
      const gateColor = resolve ? (allowed ? C.jade : C.rust) : C.soft;
      arrow(414, y + 50, 461, y + 50, gateColor);
      line(479, y, 479, y + 99, gateColor, 5);
      text(
        resolve ? (allowed ? 'Approved public query' : 'Keep inside') : 'Awaiting permission',
        508,
        y + 41,
        28,
        resolve ? (allowed ? C.jade : C.rust) : C.soft,
      );
      if (resolve)
        text(
          allowed
            ? 'Check source, redirect and resolved address.'
            : 'Use authorized internal sources or abstain.',
          508,
          y + 79,
          20,
          C.soft,
          'Sans',
          400,
        );
    });
    band('Treat fetched text as untrusted. Enforce destination checks on every hop.');
    return;
  }
  base('REWRITE CACHE   /   SAME FOLLOW-UP', 'Which cached rewrite belongs to this caller?');
  serif('“' + contexts[0].query + '”', 39, 156, 32);
  const written = at(2, 'different rewrites');
  contexts.forEach((context, i) => {
    const x = 38 + i * 451;
    film(x, 186, 432, 222);
    mono('TENANT ' + context.tenant + '   /   ' + context.grant, x + 17, 226, 16, C.amber);
    text(context.history, x + 17, 266, 24, C.white, 'Serif', 397);
    line(x + 17, 282, x + 412, 282, C.soft, 1);
    mono(
      'policy ' + context.policy + '  ·  history ' + historyDigest(context).slice(0, 8),
      x + 17,
      308,
      15,
      C.mint,
    );
    mono(
      context.technique + '  ·  ' + context.generator + '  ·  prompt ' + context.prompt,
      x + 17,
      333,
      15,
      C.mint,
    );
    const revoked = i === 1 && at(3, 'billing grant was revoked');
    const value = cacheHit(context, revoked ? [] : [context.grant]);
    if (written)
      text(
        value ?? 'Grant revoked • entry withheld',
        x + 17,
        374,
        22,
        revoked ? C.amber : C.light,
        'Sans',
        395,
      );
  });
  band(
    beat === 3
      ? 'Vector cache   +   encoder version   ·   Recheck current grants on every hit.'
      : 'Key the entry by scope, policy, history, query, technique and generator / prompt version.',
  );
}
