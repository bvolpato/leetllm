import {
  C,
  stage,
  heading,
  txt,
  serif,
  mono,
  center,
  box,
  line,
  dot,
  chip,
  plate,
  slot,
  chassis,
  arrow,
  file,
  mix,
  smooth,
  cue,
  windowText,
  poly,
  dial,
} from './bench.mjs';
import {
  reports,
  refusalCount,
  runs,
  prefix,
  suiteSha,
  workers,
  sha,
  bill,
  exactResult,
  strictStates,
} from './experiment.mjs';

export function platforms(c, k) {
  const b = k.beat.beatIndex + 1,
    failed = reports[1].rows[2];
  stage(c);
  heading(
    c,
    'Run 2  /  MLflow Tracking and W&B Models',
    b < 3 ? 'Open the file behind the metric' : 'Recover the exact input',
  );
  if (b < 3) {
    for (const [i, tool] of ['MLflow', 'Weights & Biases'].entries()) {
      const x = 50 + 459 * i;
      chassis(c, x, 133, 400, 140);
      txt(c, tool, x + 21, 163, 24, C.light, { bold: true });
      mono(c, i ? 'run.config' : 'log_param', x + 21, 199, 17, C.mint);
      txt(c, 'release record only', x + 177, 199, 16, C.light);
      mono(c, i ? 'run.log' : 'log_metric', x + 21, 237, 17, C.mint);
      txt(c, refusalCount(reports[1]), x + 177, 237, 16, C.light);
    }
    if (b === 2) {
      file(
        c,
        146,
        311,
        665,
        139,
        'Redacted case report',
        [
          'case_id      expected_route       predicted_route',
          failed.caseId + '      ' + failed.expected + '                ' + failed.predicted,
        ],
        C.light,
      );
    }
  } else {
    file(
      c,
      52,
      159,
      281,
      209,
      'Frozen suite',
      ['4 canonical cases', 'SHA-256 prefix', prefix(suiteSha)],
      C.light,
    );
    arrow(c, 355, 259, 447, 259);
    txt(c, 'MLflow', 479, 168, 24, C.ink, { bold: true });
    mono(c, 'log_input(dataset)', 479, 208, 20, C.blue);
    txt(c, 'Archive the rows or pin their immutable source.', 479, 250, 18, C.mid, { max: 420 });
    line(c, 479, 285, 904, 285);
    txt(c, 'W&B online', 479, 322, 24, C.ink, { bold: true });
    mono(c, 'run.use_artifact("suite:v1")', 479, 363, 19, C.blue);
    txt(c, 'Input version consumed by this run', 479, 403, 18, C.mid);
  }
}
export function registry(c, k) {
  const b = k.beat.beatIndex + 1;
  stage(c);
  heading(
    c,
    'MLflow  /  register the evaluated object',
    b === 1
      ? 'A change to the instructions'
      : b === 2
        ? 'A change to the serving code'
        : 'Which version did registration create?',
  );
  if (b === 1) {
    file(
      c,
      58,
      149,
      507,
      237,
      'Evaluated prompt',
      ['Use {{evidence}} to choose a route.', 'String template or chat messages'],
      C.light,
    );
    arrow(c, 590, 263, 652, 263);
    chip(c, 682, 214, 227, 100, 'Prompt Registry', C.ice, 'template + config');
  } else if (b === 2) {
    const items = ['Serving wrapper', 'Python function', 'Weights, if needed'];
    items.forEach((v, i) =>
      chip(c, 65 + 12 * i, 310 - 68 * i, 316, 58, v, i === 2 ? C.paper : C.ice),
    );
    arrow(c, 427, 254, 568, 254);
    chassis(c, 595, 166, 308, 201);
    txt(c, 'Model Registry', 619, 205, 26, C.light, { bold: true });
    mono(c, 'MLflow model', 619, 267, 21, C.mint);
    txt(c, 'Source lineage', 619, 324, 18, C.light);
  } else {
    plate(c, 48, 145, 863, 270);
    mono(c, 'name = "deploy-answerer"', 79, 178, 22, C.ink);
    mono(c, 'prompt = mlflow.genai.register_prompt(name, evaluated_text)', 79, 217, 21, C.blue);
    line(c, 80, 246, 878, 246);
    const returned = cue(k, 3, 'Use that version') ? 4 : null;
    for (let i = 1; i <= (returned ?? 3); i++)
      chip(c, 80 + (i - 1) * 201, 268, 151, 70, 'v' + i, i === returned ? C.mint : C.deck);
    if (returned) mono(c, 'prompt.version → ' + returned, 759, 373, 19, C.green, { align: 'center' });
    if (cue(k, 3, 'A separate operation'))
      mono(c, 'Alias assignment is a separate operation.', 56, 463, 18, C.mid);
  }
}
export function version(c, k) {
  stage(c);
  heading(c, 'Prompt Registry  /  version 4', 'Same text, two copies of the settings');
  const changed = cue(k, 2, 'point seven');
  const settings = [0, changed ? 0.7 : 0];
  const fingerprints = settings.map((temperature) => prefix(sha(JSON.stringify({ temperature }))));
  // In the retained second take, "got a new fingerprint" ends at 10.085 seconds.
  const comparing = changed && k.elapsed < 10.085;
  file(
    c,
    53,
    141,
    384,
    232,
    'Prompt v4',
    ['Use {{evidence}}', 'to choose a route.', 'Text fixed within v4'],
    C.light,
  );
  for (let i = 0; i < 2; i++) {
    const x = 574 + 223 * i,
      v = settings[i];
    dial(c, x, 242, 62, v, i ? 'Registry now' : 'Saved with run');
    if (!comparing)
      mono(c, fingerprints[i], x, 361, 21, i && changed ? C.red : C.green, { align: 'center' });
  }
  if (comparing) {
    center(c, 'Which copy keeps this fingerprint?', 685, 361, 23, C.ink, { bold: true });
    mono(c, 'Before the edit  ' + fingerprints[0], 685, 401, 18, C.mid, { align: 'center' });
  } else {
    mono(c, 'Configuration SHA-256 prefixes', 671, 401, 15, C.mid, { align: 'center' });
  }
  if (cue(k, 2, 'Keep the evaluated template'))
    txt(c, 'Compare the retained settings with each worker’s loaded copy.', 52, 465, 22, C.ink);
}
function processor(c, x, y, name, version, active, desc) {
  chassis(c, x, y, 307, 125, active ? C.panel : '#465b5d');
  txt(c, 'Worker ' + name, x + 22, y + 31, 22, C.light, { bold: true });
  mono(c, 'MEMORY', x + 22, y + 62, 13, C.metal);
  txt(c, desc, x + 22, y + 96, 15, C.light, { max: 159 });
  slot(c, x + 186, y + 35, 96, 60);
  if (version) chip(c, x + 187, y + 28, 94, 62, 'v' + version, version === 2 ? C.ice : C.amber);
}
const reloadRoute = [[196, 391], [196, 420], [898, 420], [898, 346], [861, 346]];
const reloadDistances = reloadRoute.slice(1).map(([x, y], i) =>
  Math.hypot(x - reloadRoute[i][0], y - reloadRoute[i][1]),
);
const reloadDistance = reloadDistances.reduce((total, length) => total + length, 0);
function carryPinnedCopy(c, progress) {
  let remaining = reloadDistance * progress;
  let tip = reloadRoute[0];
  for (const [i, length] of reloadDistances.entries()) {
    const [x, y] = reloadRoute[i];
    const [xx, yy] = reloadRoute[i + 1];
    line(c, x, y, xx, yy, C.line, 3);
    if (remaining <= 0) continue;
    const step = Math.min(remaining / length, 1);
    tip = [mix(x, xx, step), mix(y, yy, step)];
    line(c, x, y, ...tip, C.blue, 3);
    remaining -= length;
  }
  if (progress < 1) dot(c, ...tip, 7, C.ice, C.blue, 2);
}
export function alias(c, k) {
  const s = workers(k),
    b = k.beat.beatIndex + 1;
  const reloadPhrase = 'Reload B from';
  const reload = b === 5
    ? k.reveal(reloadPhrase, k.wordCue('then read back').start - k.wordCue(reloadPhrase).start, {
        captionStart: reloadPhrase,
      })
    : 0;
  stage(c);
  heading(c, 'MLflow 3.16.1  /  Prompt Registry', 'Which object is in memory?');
  chassis(c, 51, 139, 467, 272, C.panel);
  center(c, '@champion', 284, 172, 25, C.light, { face: 'Mono' });
  const px = 284,
    py = 220;
  const a = mix(Math.atan2(99, -88), Math.atan2(99, 89), s.travel);
  const radius = mix(Math.hypot(88, 99), Math.hypot(89, 99), s.travel);
  const ex = px + radius * Math.cos(a),
    ey = py + radius * Math.sin(a);
  for (const [i, x] of [196, 373].entries()) {
    dot(c, x, 319, 17, '#102e38', C.metal, 3);
    chip(c, x - 49, 347, 98, 43, 'v' + (i + 2), i ? C.amber : C.ice);
  }
  line(c, px, py, ex, ey, '#142f37', 16);
  line(c, px, py, ex, ey, C.amber, 10);
  dot(c, px, py, 17, C.metal, C.ink);
  dot(c, ex, ey, 8, C.amber);
  processor(c, 578, 135, 'A', s.a, true, 'Loaded before move');
  processor(
    c,
    578,
    285,
    'B',
    s.b,
    s.started,
    s.b === 2
      ? 'Reloaded from v2'
      : reload > 0
        ? 'Loading pinned v2'
        : s.b === 3
          ? 'Resolved champion'
          : s.started
            ? 'Resolving alias'
            : 'Stopped',
  );
  if (b === 4)
    mono(c, 'Default cache  /  alias 60 s  ·  explicit version has no expiry', 55, 438, 17, C.blue);
  if (b === 5) {
    if (reload) carryPinnedCopy(c, reload);
    const note = s.b === 2
      ? 'Pinned v2 + saved settings loaded into B'
      : reload > 0
        ? 'Carry pinned v2 + saved settings to B'
        : s.target === 2
          ? '@champion points to v2. B still holds v3.'
          : 'Repoint the alias, then reload the worker.';
    mono(c, note, 55, 438, 17, C.blue);
  }
  if (b === 6) mono(c, 'Readback  /  A = v' + s.a + '    B = v' + s.b, 55, 438, 20, C.green);
}
export function sdk(c, k) {
  const b = k.beat.beatIndex + 1;
  stage(c);
  heading(
    c,
    b <= 2 ? 'MLflow  /  local SDK readback' : 'Weights & Biases  /  local recording',
    b <= 2 ? 'Open the finished run' : 'Look for a file on disk',
  );
  if (b <= 2) {
    chassis(c, 49, 149, 361, 250);
    txt(c, 'tracking.db', 75, 195, 29, C.light, { face: 'Mono' });
    mono(c, 'SQLite · run metadata', 75, 239, 17, C.mint);
    windowText(c, 76, 286, 305, 67, 'FINISHED', C.mint);
    file(c, 457, 153, 447, 236, 'Local artifacts', [
      'inputs/eval-suite.json',
      'candidate manifest',
      'redacted report',
    ]);
    if (cue(k, 1, 'reads all four'))
      txt(c, 'Read back ' + reports[2].count + ' report rows', 472, 348, 22, C.green, {
        bold: true,
      });
    if (b === 2)
      mono(
        c,
        'Alias readback → older version   ·   same-version temperature 0.7',
        52,
        462,
        17,
        C.mid,
      );
  } else {
    for (const [i, mode] of ['offline', 'disabled'].entries()) {
      const x = 48 + i * 454;
      chassis(c, x, 152, 404, 254);
      txt(c, mode, x + 25, 188, 27, C.light, { face: 'Mono' });
      slot(c, x + 27, 236, 350, 108);
      if (!i && cue(k, 3, 'A run file lands'))
        file(c, x + 55, 225, 294, 111, 'run.wandb', ['Available for later sync'], C.paper);
      if (i && cue(k, 3, 'writes nothing')) center(c, 'No file', x + 201, 285, 26, C.metal);
    }
    if (cue(k, 3, 'For an online evaluation'))
      mono(c, 'Online  /  use_artifact links the consumed input version.', 57, 465, 19, C.blue);
  }
}
function span(c, x, y, w, name, fill) {
  box(c, x, y, w, 44, fill, 5);
  txt(c, name, x + 12, y + 23, 18, C.ink, { bold: true, max: w - 22 });
}
export function weave(c, k) {
  const b = k.beat.beatIndex + 1;
  stage(c);
  heading(
    c,
    b <= 2 ? 'W&B Weave  /  one tracked request' : 'Weave scorer  /  Run 2, first repair',
    b <= 2 ? 'Open retrieval inside the request' : 'Score a returned route',
  );
  if (b <= 2) {
    span(c, 51, 147, 854, 'Request', C.ice);
    span(c, 65, 220, 372, 'Retrieval', C.mint);
    span(c, 444, 220, 312, 'Generation', C.paper);
    span(c, 764, 220, 130, 'Guardrail', C.paper);
    line(c, 64, 195, 64, 212, C.mid);
    if (b === 2) {
      for (const [i, v] of ['Embed', 'Search', 'Rerank'].entries())
        span(c, 68 + i * 124, 294, 119, v, C.light);
      line(c, 72, 268, 72, 285, C.mid);
    }
    mono(c, 'Parent call → instrumented children in execution order', 54, 410, 18);
    if (b === 2) txt(c, 'Uninstrumented work can be absent from the trace.', 54, 455, 20, C.mid);
  } else {
    const row = reports[1].rows[b === 3 ? 0 : 2],
      score = exactResult(row);
    chip(c, 52, 167, 227, 75, row.caseId, C.ice, 'dataset row');
    mono(c, 'expected_route', 321, 174, 16);
    mono(c, row.expected, 320, 216, 25, C.green);
    mono(c, 'output', 645, 174, 16);
    mono(c, row.predicted, 643, 216, 25, C.ink);
    chassis(c, 52, 278, 848, 110);
    const reveal = b === 3 ? cue(k, 3, 'returns true') : cue(k, 4, 'returns false');
    mono(
      c,
      reveal
        ? '{"exact_route": ' + (score.exact_route ? 'True' : 'False') + '}'
        : 'expected_route == output',
      79,
      331,
      28,
      reveal && !score.exact_route ? C.pink : C.mint,
    );
    if (b === 5) mono(c, 'Notebook  /  await evaluation.evaluate(candidate)', 53, 451, 21, C.blue);
  }
}
export function tokenCost(c, k) {
  const b = k.beat.beatIndex + 1;
  stage(c);
  heading(
    c,
    'Instrumented request  /  illustrative measurements',
    b <= 2 ? 'Follow elapsed time' : 'Price each token once',
  );
  if (b <= 2) {
    const spans = [420, 1850],
      sum = spans.reduce((a, b) => a + b);
    let x = 55;
    spans.forEach((n, i) => {
      const w = (846 * n) / sum;
      box(c, x, 206, w, 76, i ? C.ice : C.mint, 3, C.mid);
      center(c, i ? 'Generation' : 'Retrieval', x + w / 2, 232, 19, C.ink);
      center(c, n + ' ms', x + w / 2, 261, 18, C.ink, { face: 'Mono' });
      x += w;
    });
    line(c, 55, 311, 901, 311, C.mid);
    line(c, 55, 301, 55, 320, C.mid);
    line(c, 901, 301, 901, 320, C.mid);
    center(c, 'Sequential child spans  ·  ' + sum.toLocaleString('en-US') + ' ms', 478, 344, 22);
    if (b === 2)
      mono(
        c,
        'First visible chunk  /  measure from client send to first display',
        55,
        438,
        17,
        C.blue,
      );
  } else {
    const shifted = !!cue(k, 5, 'All two thousand input tokens');
    const m = bill(shifted ? 0 : 1200);
    const known = shifted ? cue(k, 5, 'estimate rises') : cue(k, 4, 'The total is');
    mono(c, 'Input mix  /  2,000 tokens', 53, 135, 16);
    const w = (850 * m.counts[0]) / 2000;
    box(c, 55, 156, w, 27, C.blue, 2);
    box(c, 55 + w, 156, 850 - w, 27, C.metal, 2);
    center(c, m.counts[0] + ' uncached', 55 + w / 2, 170, 16, C.light);
    if (m.counts[1]) center(c, m.counts[1] + ' cached', 55 + w + (850 - w) / 2, 170, 16, C.ink);
    const heads = ['Bucket', 'Tokens', '$/million', 'Dollars'];
    const xx = [55, 408, 590, 778];
    heads.forEach((v, i) => mono(c, v, xx[i], 224, 16));
    m.counts.forEach((n, i) => {
      const y = 268 + i * 48;
      line(c, 53, y + 25, 904, y + 25, C.line, 1);
      txt(c, ['Uncached input', 'Cached input', 'Billed output'][i], 55, y, 23, C.ink);
      mono(c, String(n), 408, y, 21, C.ink);
      mono(c, '$' + m.rates[i].toFixed(2), 590, y, 20, C.mid);
      mono(c, '$' + m.dollars[i].toFixed(5), 778, y, 20, C.ink);
    });
    chassis(c, 52, 416, 852, 65);
    txt(c, 'Estimated token cost', 73, 448, 23, C.light);
    mono(c, known ? '$' + m.total.toFixed(5) : 'sum of buckets', 878, 448, 24, C.amber, {
      align: 'right',
    });
    if (b >= 4) mono(c, 'Each dollar amount = tokens × rate / 1,000,000', 55, 503, 16, C.mid);
  }
}
export function types(c, k) {
  const b = k.beat.beatIndex + 1;
  stage(c);
  heading(c, 'Run 3  /  read saved values', 'Can the verifier accept these types?');
  const badCount = !!cue(k, 2, 'The verifier rejects') && !cue(k, 2, 'The original record passes');
  const badFlag = !!cue(k, 3, 'The file contains');
  const s = strictStates[badFlag ? 'manifest' : badCount ? 'metric' : 'intact'];
  for (const [i, [field, value, type]] of [
    ['Case count', s.count, 'Finite number'],
    ['Simulation flag', s.flag, 'Boolean'],
  ].entries()) {
    const x = 56 + 454 * i;
    plate(c, x, 151, 395, 194);
    txt(c, field, x + 23, 185, 24, C.ink, { bold: true });
    mono(c, 'Requires  ' + type, x + 23, 227, 17, C.mid);
    mono(c, JSON.stringify(value), x + 23, 294, 34, (i ? badFlag : badCount) ? C.red : C.green);
  }
  windowText(
    c,
    58,
    388,
    847,
    78,
    s.valid ? 'Verifier passes' : 'Verifier rejects the record',
    s.valid ? C.mint : C.pink,
    26,
  );
  if (b >= 3) mono(c, 'Manifest SHA  ' + s.checksum, 57, 492, 15, C.mid);
}
