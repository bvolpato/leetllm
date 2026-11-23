import { P, box, line, poly, txt, mono, title, small, page, sheet, at, strip } from './art.mjs';
import {
  bundle,
  probeRelease,
  fitted,
  HAND_FAIL,
  gate,
  noCritical,
  noBase,
  frac,
  delta,
  files,
  chain,
  originalArtifact,
  repricedArtifact,
} from './lab.mjs';

function insert(c, x, y, w, id, main, sub, color) {
  sheet(c, x, y, w, 168);
  box(c, x, y, w, 12, color);
  small(c, id, x + 18, y + 50, color);
  title(c, main, x + 18, y + 101, 32);
  mono(c, sub, x + 18, y + 144, 17, P.mute);
}
function openCase(c, y) {
  poly(
    c,
    [
      [130, y],
      [1045, y],
      [1090, y + 78],
      [85, y + 78],
    ],
    '#819a87',
  );
  box(c, 102, y + 73, 976, 70, P.deep, 8);
  for (const x of [245, 935]) box(c, x, y + 79, 35, 21, P.gold, 3);
  box(c, 500, y + 97, 180, 16, P.black, 8);
}
export function packageScene(c, k) {
  const b = k.beat.beatIndex + 1;
  page(c);
  if (b >= 5 && at(k, 5, 'Now price')) {
    title(c, 'What do these four decisions cost?');
    const ready = at(k, 5, 'sends two warnings'),
      base = at(k, 6, 'fifty');
    const tot = gate(fitted);
    small(c, 'EVALUATION DELIVERY', 70, 172);
    small(c, 'FITTED PACKAGE', 455, 172);
    small(c, 'SILENT BASELINE', 853, 172);
    fitted.forEach((r, i) => {
      const y = 206 + i * 69;
      box(c, 63, y, 1074, 59, i % 2 ? P.paper : P.cream);
      mono(c, '0' + (i + 1), 78, y + 38, 22);
      txt(c, r.gold ? 'Late · critical' : 'On time', 142, y + 38, 22);
      if (ready)
        txt(
          c,
          (r.pred ? 'Warn' : 'Silent') + '   /   ' + r.cost + ' units',
          455,
          y + 39,
          23,
          r.pred ? P.teal : P.mute,
        );
      if (base)
        txt(
          c,
          (r.gold ? 'Miss' : 'Silent') + '   /   ' + r.baseline + ' units',
          853,
          y + 39,
          23,
          r.gold ? P.rust : P.mute,
        );
    });
    if (ready) txt(c, 'Fitted cost  ' + tot.cost, 450, 549, 36, P.teal, { family: 'Serif' });
    if (base) txt(c, 'Baseline  ' + tot.base, 853, 549, 36, P.rust, { family: 'Serif' });
    return;
  }
  title(
    c,
    b === 2
      ? 'What happens at equality?'
      : b === 3
        ? 'Check the input before scoring'
        : 'Inside the retained release',
  );
  if (b === 2 || b === 3) {
    const p = probeRelease('v1', null);
    const vals =
      b === 2
        ? [
            ['INPUT', 'Missing', 'delay_minutes'],
            ['IMPUTER', p.input + ' min', 'training mean'],
            ['SCORE', p.score.toFixed(2), 'threshold 0.50'],
          ]
        : [
            ['INPUT', '9 hours', 'delay_hours'],
            ['EXPECTED', 'Minutes', 'delay_minutes'],
            ['REQUEST CHECK', 'Reject', 'schema mismatch'],
          ];
    vals.forEach(([id, v, s], i) =>
      insert(c, 85 + i * 352, 236, 301, id, v, s, i === 2 && b === 3 ? P.rust : P.teal),
    );
    if (b === 2 && at(k, 2, 'rule sends a warning'))
      strip(c, 547, 'Action when score ≥ 0.50', '0.50 ≥ 0.50    ·    Warn');
    if (b === 3 && at(k, 3, 'before a customer'))
      strip(c, 547, 'Rejected request', 'Scoring stopped', P.rust);
    return;
  }
  if (b === 5) {
    openCase(c, 398);
    ['Retained cropper', 'Trained weights', 'Review threshold'].forEach((value, i) =>
      insert(
        c,
        151 + i * 304,
        228,
        270,
        ['INPUT PHOTO', 'VISION MODEL', 'ACTION'][i],
        value,
        ['crop policy', 'damage score', 'route to review'][i],
        [P.teal, P.ocean, P.orange][i],
      ),
    );
    strip(c, 591, 'Replay the same photo', 'Compare the complete decision', P.ocean);
    return;
  }
  const fields = [
    ['PREPROCESSING', 'Delay in minutes', 'impute 5  /  range 10'],
    ['MODEL', 'Linear score', '0.50 + 1.20z'],
    ['ACTION', 'Warn customer', 'score ≥ 0.50'],
  ];
  openCase(c, 398);
  fields.forEach(([label, a, v], i) => {
    const pos = at(k, 1, 'Put them in the same', 1.0);
    insert(c, 151 + i * 304, 184 + 47 * pos, 270, label, a, v, [P.teal, P.ocean, P.orange][i]);
  });
  if (b === 4) {
    small(c, 'RELEASE RECORD', 90, 574);
    txt(c, 'Snapshot · feature version · artifact · action policy · previous release', 90, 606, 22);
    if (at(k, 4, 'It also names the promotion policy')) {
      const limits = chain.limits;
      txt(c, 'Promotion policy limits', 90, 643, 20, P.ocean, { bold: true });
      mono(c, (100 * limits.errors) + '% errors · p95 ' + limits.latency + ' ms · ' + limits.cost + '% cost change', 321, 643, 17);
    }
    if (at(k, 4, 'add a monitor version')) {
      box(c, 822, 554, 304, 98, P.pale, 5);
      small(c, 'PROPOSED FOR PRODUCTION', 838, 583, P.ocean);
      txt(c, 'Add a monitor version', 838, 625, 23);
    }
  } else {
    small(c, 'TRAINING IDENTITY', 104, 582);
    mono(c, 'Six admitted rows  /  May 25 cutoff  /  builder digest', 104, 619, 22);
  }
}
export function loaderScene(c, k) {
  page(c, P.deep);
  const space = at(k, 2, 'Append one space') && !at(k, 2, 'Restore the original bytes');
  const scale = at(k, 2, 'with a scale of zero') && k.beat.beatIndex === 1;
  const file = files[space ? 'space' : scale ? 'scale' : 'good'];
  const b = k.beat.beatIndex + 1;
  const loading = b <= 2;
  small(c, loading ? 'REGISTRY   /   PACKAGE INSPECTION' : 'SERVING   /   LOADED PACKAGE', 65, 68, P.mint);
  title(
    c,
    loading ? 'Read the bytes before the model'
      : b === 3 ? 'Check each request before scoring' : 'Replay the retained computation',
    64,
    127,
    45,
    P.cream,
  );
  const last = file.bytes.slice(-8);
  small(c, 'END OF SERIALIZED FILE', 67, 198, P.mint);
  [...last].forEach((v, i) => {
    const x = 65 + 69 * i;
    box(c, x, 226, 60, 68, v === ' ' ? P.gold : P.cream, 4);
    mono(c, v === ' ' ? 'SP' : v, x + 30, 272, 29, P.ink, 'center');
    mono(c, v.charCodeAt(0).toString(16).toUpperCase(), x + 30, 319, 16, P.mint, 'center');
  });
  small(c, 'SHA-256 PREFIX', 67, 388, P.mint);
  for (const [i, name, value] of [
    [0, 'Registered', file.expected],
    [1, 'File now', file.actual],
  ]) {
    txt(c, name, 66, 435 + i * 53, 22, P.cream);
    mono(c, value.slice(0, 14), 233, 436 + i * 53, 27, i && space ? P.gold : P.cream);
  }
  sheet(c, 686, 187, 447, 340);
  const cardHeading = loading ? 'LOADER' : b === 3 ? 'REQUEST CHECK' : 'PREDICTION REPLAY';
  small(c, cardHeading, 715, 233);
  if (b === 1) {
    title(c, 'Training identity', 715, 292, 34);
    txt(c, 'Training hash: admitted rows', 715, 351, 23);
    txt(c, 'Fixture hash: includes later labels', 715, 398, 22);
    txt(c, 'Builder digest + Python version', 715, 445, 22);
  } else if (b === 2) {
    title(
      c,
      space ? 'Bytes changed' : scale ? 'Bytes match' : 'Digest matches',
      715,
      298,
      37,
      space ? P.rust : P.teal,
    );
    mono(
      c,
      space ? 'Space byte = 0x20' : scale ? 'scale = 0' : 'scale = ' + bundle.scale,
      715,
      366,
      26,
    );
    txt(
      c,
      file.valid
        ? 'Pass to schema check'
        : space
          ? 'Reject at byte check'
          : 'Reject at parameter check',
      715,
      446,
      25,
      file.valid ? P.teal : P.rust,
      { bold: true },
    );
  } else if (b === 3) {
    title(c, 'Serving input', 715, 292, 35);
    txt(c, 'Boolean / oversized number', 715, 350, 23);
    txt(c, 'Reject invalid input', 715, 388, 23, P.rust);
    if (at(k, 3, 'missing delay')) {
      line(c, 715, 411, 1095, 411, P.line);
      mono(c, 'null → 5 → score 0.50', 715, 464, 22, P.teal);
    }
  } else {
    title(c, 'Retained v1', 715, 293, 37);
    txt(c, 'Known request  ·  8 min', 715, 347, 23);
    const p = probeRelease('v1', 8);
    if (at(k, 4, 'Replaying a known request'))
      mono(c, p.score.toFixed(2) + '   /   Warn', 715, 446, 29, P.teal);
  }
  if (b === 4) {
    txt(
      c,
      'Python objects also need compatible dependencies and a trusted source.',
      68,
      598,
      25,
      P.cream,
    );
  }
}
function rowsTable(c, x, y, rows, { w = 620, highlight = '', label = 'Candidate' } = {}) {
  sheet(c, x, y, w, 286);
  const cols = [x + 20, x + w * 0.31, x + w * 0.49, x + w * 0.69, x + w * 0.86];
  ['ID', 'Late', 'Warn', label, 'Base'].forEach((h, i) =>
    txt(c, h, cols[i], y + 43, 17, P.mute, { bold: true }),
  );
  rows.forEach((r, i) => {
    const yy = y + 54 + i * 51;
    if (r.id === highlight) box(c, x + 6, yy, w - 12, 49, '#f5ddb1');
    else if (i % 2 === 0) box(c, x + 6, yy, w - 12, 49, P.paper);
    [r.id, r.gold ? 'Yes' : 'No', r.pred ? 'Yes' : 'No', r.cost, r.baseline].forEach((v, j) =>
      mono(c, v, cols[j], yy + 32, 20, j === 2 && r.gold && !r.pred ? P.rust : P.ink),
    );
  });
}
export function gatesScene(c, k) {
  page(c);
  const b = k.beat.beatIndex + 1;
  const source =
    b === 1
      ? HAND_FAIL
      : b === 4
        ? at(k, 4, 'With a zero baseline')
          ? noBase
          : noCritical
        : fitted;
  const overlap = b === 3 && at(k, 3, 'ID into training') && !at(k, 3, 'Restore the split');
  const m = gate(source, overlap ? ['eval-2'] : undefined);
  title(
    c,
    b === 1
      ? 'Price all four. Count the critical pair.'
      : b === 2
        ? 'Price the fitted model’s own decisions'
        : b === 3
          ? 'Does a training ID appear in evaluation?'
          : 'When a denominator disappears',
  );
  small(c, b === 1 ? 'HAND-ENTERED COSTS' : 'FITTED PACKAGE  /  EVALUATION', 66, 159);
  rowsTable(c, 63, 190, source, { highlight: overlap ? 'eval-2' : '' });
  txt(
    c,
    source === noCritical
      ? 'This trial has no critical cases.'
      : 'The two late parcels are the critical cases in this fixture.',
    66,
    520,
    19,
  );
  small(c, 'OFFLINE GATES', 747, 159);
  const group = [
    ['Critical recall', m.hits + ' / ' + m.positives + '   ' + frac(m.recall)],
    [
      'Relative cost change',
      m.base
        ? '(' + m.cost + ' / ' + m.base + ') − 1 = ' + delta(m.delta)
        : '4 / 0   →   undefined',
    ],
    ['Shared IDs', m.overlap.join(', ') || 'None'],
  ];
  group.forEach(([h, v], i) => {
    const y = 223 + i * 92;
    txt(c, h, 750, y, 19, P.mute);
    mono(
      c,
      v,
      750,
      y + 37,
      i === 1 ? 23 : 29,
      (i === 0 && !(m.recall >= 0.9)) || (i === 1 && m.delta == null) || (i === 2 && overlap)
        ? P.rust
        : P.ink,
    );
  });
  strip(
    c,
    598,
    'Required: recall ≥ 90%   ·   cost change ≤ 0%   ·   separate IDs',
    m.open ? 'Eligible for canary' : 'Hold offline',
    m.open ? P.teal : P.rust,
  );
}
export function bindingScene(c, k) {
  page(c, P.ivory);
  const b = k.beat.beatIndex + 1;
  const { evidence, admission } = chain;
  if (b === 4) {
    const alternate = at(k, 4, 'Try a different base');
    const base = alternate ? 'R4' : 'v0';
    const live = alternate ? 'R5' : admission.base.replace('delivery-risk-', '');
    const checked = base === live;
    const decided = alternate ? at(k, 4, 'R five keeps serving') : at(k, 4, 'Production stays');
    title(c, 'Does the named base still serve?');
    small(c, alternate ? 'SEPARATE CANDIDATE   /   ROW GATES PASS' : 'OPEN CANARY   /   ' + evidence.id + '   /   ROW GATES AND BINDINGS PASS', 82, 164, P.ocean);
    insert(c, 83, 195, 457, 'CANDIDATE RECORD', 'Previous release', base, P.ocean);
    insert(c, 661, 195, 457, 'LIVE PRODUCTION', 'Selected release', live, P.teal);
    mono(c, checked ? '=' : '≠', 600, 306, 46, checked ? P.teal : P.rust, 'center');
    if (decided) {
      small(c, 'ADMISSION RECEIPT', 85, 437);
      title(c, checked ? admission.id : 'Hold offline', 83, 497, 39, checked ? P.teal : P.rust);
      txt(c, checked ? 'Accepted · canary → v1' : 'Previous release mismatch', 83, 546, 24);
      mono(c, 'Production → ' + live, 665, 502, 28);
      txt(c, checked ? 'Only the canary moves.' : 'Candidate stays offline.', 666, 549, 23, P.mute);
    } else {
      txt(c, 'Admission pending', 84, 498, 33, P.mute, { family: 'Serif' });
    }
    return;
  }
  const edited = at(k, 5, 'Change just that row');
  const current = edited ? repricedArtifact : originalArtifact;
  const saved = originalArtifact.metrics;
  const filed = at(k, 2, 'as offline evidence three');
  title(c, b >= 5 ? 'Does the saved evidence still fit delivery two?' : 'From four delivery rows to offline evidence');
  small(c, (b >= 5 ? 'ARTIFACT UNDER CHECK' : 'REGISTERED ARTIFACT') + '   /   ' + evidence.artifactId, 65, 156);
  rowsTable(c, 64, 187, current.rows, { highlight: b >= 5 ? 'eval-2' : '' });
  mono(c, 'Total ' + current.metrics.cost + '   /   baseline ' + current.metrics.base, 69, 516, 23);
  small(c, 'EVALUATOR OUTPUT', 740, 156);
  sheet(c, 714, 187, 432, 332);
  if (filed) {
    title(c, 'Offline evidence', 737, 237, 34);
    mono(c, evidence.id, 738, 274, 23, P.ocean);
    mono(c, 'Recall  ' + saved.hits + ' / ' + saved.positives, 738, 327, 21);
    mono(c, 'Cost    ' + saved.cost + ' / ' + saved.base, 738, 362, 21);
    line(c, 738, 383, 1119, 383, P.line);
    small(c, 'SAVED ARTIFACT FINGERPRINT', 738, 417);
    mono(c, evidence.artifactFingerprint.slice(0, 12), 738, 452, 25, P.ocean);
    txt(c, 'Also binds the release and promotion policy', 738, 493, 17);
  } else {
    title(c, 'Checking the rows', 737, 245, 32);
    txt(c, 'Expected IDs and types', 738, 313, 23);
    txt(c, 'Training IDs kept separate', 738, 361, 23);
    txt(c, 'Critical recall and relative cost', 738, 409, 23);
  }
  if (b >= 5) {
    const matches = current.fingerprint === evidence.artifactFingerprint;
    small(c, 'CURRENT ARTIFACT FINGERPRINT', 69, 561);
    mono(c, current.fingerprint.slice(0, 12), 69, 598, 25, matches ? P.ocean : P.rust);
    if (matches || at(k, 5, 'even though')) {
      txt(c, matches ? 'Matches saved evidence' : 'Fingerprint mismatch · hold admission',
        1135, 596, 26, matches ? P.teal : P.rust, { align: 'right', bold: true });
    }
  } else if (b === 2 && at(k, 2, 'For critical recall')) {
    mono(c, '4 / 50 − 1 = ' + delta(saved.delta), 69, 584, 23, P.teal);
  } else if (b === 3 && at(k, 3, 'Pass the candidate')) {
    mono(c, 'open_canary("' + evidence.candidate + '", "' + evidence.id + '")', 66, 587, 24, P.ocean);
    txt(c, 'Production → v0', 68, 630, 22);
    txt(c, 'Canary → empty', 392, 630, 22);
  }
}
