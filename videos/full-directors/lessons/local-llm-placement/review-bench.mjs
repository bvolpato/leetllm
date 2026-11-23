import assert from 'node:assert/strict';
import { firstFrameAt, fps } from '../../../director-cuts/lesson-runtime/timeline.mjs';
import {
  rates,
  evaluate,
  admission,
  memory,
  releaseCases,
} from '../../../films/local-llm-placement/model.mjs';
import { receipt, outputs } from '../../../films/local-llm-placement/fixtures.mjs';
import {
  ink,
  paper,
  teal,
  blue,
  mint,
  fog,
  gold,
  red,
  white,
  dark,
  pale,
  mono,
  serif,
  sans,
  rect,
  line,
  label,
  dot,
  plate,
  hatch,
  header,
  foot,
  chip,
  trace,
  strip,
  clamp,
  cue,
} from './art.mjs';
const qualified = [
  { name: 'Two replicas', ttft: 760, rate: 195 },
  { name: 'Tensor parallel', ttft: 910, rate: 255 },
];
const meets = (r) => r.ttft <= 800 && r.rate >= 180;
function afterCue(c, beatIndex, phrase, { caption = false, seconds = 0 } = {}) {
  if (c.beat.beatIndex !== beatIndex) return Number(c.beat.beatIndex > beatIndex);
  if (caption) c.reveal(phrase, 0, { captionStart: phrase });
  const end = c.wordCue(phrase).end;
  if (c.elapsed >= firstFrameAt(end + seconds) / fps) return 1;
  if (c.elapsed < firstFrameAt(end) / fps) return 0;
  return clamp((c.elapsed - end) / seconds);
}

function timingState(c) {
  const absentOut = cue(c, 2, 'Remove the output duration'),
    absentCache = cue(c, 2, 'omit the cached count');
  const actual = { ...receipt };
  if (absentCache) delete actual.cached;
  else if (absentOut) delete actual.outputNs;
  return {
    actual,
    read: rates(actual),
    suffix: cue(c, 1, 'Time the uncached suffix', 0.75),
    showOutput: cue(c, 1, 'Output has its own clock'),
  };
}
function clockReceipt(g, c) {
  const s = timingState(c),
    a = s.actual,
    r = s.read,
    b = c.beat.beatIndex;
  header(
    g,
    'COMPLETED SERVER RECEIPT',
    'Which tokens belong on this clock?',
    'Supplied response  /  1,000 prompt tokens  /  separate prompt and generation timers',
  );
  rect(g, 104, 330, 1712, 489, '#fffcf2', '#a3b6a5', 2, 12);
  for (let x = 132; x <= 1788; x += 42) dot(g, x, 352, 5, pale);
  const x = 411,
    w = 1240,
    y = 440,
    cached = a.cached !== undefined,
    n = a.prompt;
  const showUncached = afterCue(c, 1, 'Four hundred tokens', { caption: true });
  const prefillReady = afterCue(c, 1, 'two thousand prompt tokens per second', { caption: true });
  const outputReady = afterCue(c, 1, 'forty per second', { caption: true });
  const promptSeconds = a.promptNs / 1e9;
  label(g, 'Prompt', 149, y + 38, 40, ink, serif, 600);
  for (let i = 0; i < 10; i++) {
    const px = x + (i * w) / 10,
      col = cached ? (i * 100 < a.cached ? '#aac0b5' : blue) : '#c5ccc3';
    rect(g, px, y, w / 10 - 4, 70, col);
    if (cached && i * 100 < a.cached) hatch(g, px, y, w / 10 - 4, 70, '#68897b', 18);
  }
  label(g, cached ? a.cached + ' reused' : 'Cached count unknown', x, 403, 30, ink, mono, 600);
  const right = x + w - 4;
  const suffixStart = x + (w * (a.cached ?? 0)) / n;
  const left = right - (right - suffixStart) * s.suffix;
  if (cached && s.suffix > 0)
    line(
      g,
      [
        [left, y + 80],
        [left, y + 103],
        [right, y + 103],
        [right, y + 80],
      ],
      teal,
      4,
    );
  if (cached && showUncached)
    label(
      g,
      r.uncached + ' tokens',
      (suffixStart + right) / 2,
      y + 130,
      28,
      teal,
      mono,
      600,
      'center',
    );
  const promptText = !cached
    ? 'Uncached count unknown  /  rate unavailable'
    : showUncached
      ? '(' +
        n.toLocaleString('en-US') +
        ' − ' +
        a.cached +
        ') ÷ ' +
        promptSeconds +
        ' s' +
        (prefillReady ? ' = ' + r.prefill.toLocaleString('en-US') + ' tok/s' : '')
      : 'Which span did the ' + promptSeconds + ' s timer measure?';
  label(g, promptText, x, 615, 36, cached ? teal : red, mono, 600);
  line(
    g,
    [
      [146, 656],
      [1770, 656],
    ],
    '#a9bdaf',
    2,
    [8, 8],
  );
  label(g, 'Output', 149, 735, 40, ink, serif, 600);
  label(
    g,
    a.outputNs === undefined
      ? a.output + ' tokens   /   duration missing   /   rate unavailable'
      : s.showOutput
        ? a.output +
          ' ÷ ' +
          a.outputNs / 1e9 +
          ' s' +
          (outputReady ? ' = ' + r.output + ' tok/s' : '')
        : a.output + ' generated tokens   /   ' + (a.outputNs / 1e9).toFixed(1) + ' s',
    x,
    735,
    36,
    ink,
    mono,
    600,
  );
  foot(
    g,
    b < 2
      ? 'Prompt count and duration must describe the same work.'
      : !cached
        ? 'Second copy  /  output duration restored  /  cached input count missing'
        : a.outputNs === undefined
          ? 'First copy  /  cached input count retained  /  output duration missing'
          : 'Start with the completed response.',
  );
}
function service(g, c) {
  const b = c.beat.beatIndex,
    replay = cue(c, 3, 'Compare these two-GPU replays'),
    verdict = cue(c, 4, 'Choose the replicas');
  if (!replay) {
    header(
      g,
      'CLIENT ARRIVAL TRACE',
      'When does the engineer see a token?',
      'Example stream  /  client timestamps since submission',
    );
    const x = 180,
      w = 1500;
    line(
      g,
      [
        [x, 527],
        [x + w, 527],
      ],
      ink,
      5,
    );
    for (const [t, name, up] of [
      [0, 'Submit', true],
      [0.64, 'First chunk', false],
      [0.76, 'First visible token', true],
      [2.3, 'Complete', true],
    ]) {
      const xx = x + (w * t) / 2.3;
      dot(g, xx, 527, 12, teal);
      line(
        g,
        [
          [xx, 527],
          [xx, up ? 427 : 622],
        ],
        teal,
        3,
      );
      label(g, name, xx, up ? 390 : 663, 32, ink, sans, 600, 'center');
      label(g, t.toFixed(2) + ' s', xx, up ? 586 : 480, 28, teal, mono, 500, 'center');
    }
    foot(g, 'Define the visible event, then measure it from client submission.');
    return;
  }
  header(
    g,
    'TWO-GPU SERVING REPLAY',
    'Which arrangement meets both goals?',
    'Same quality, prompts and arrivals  /  supplied replay measurements',
  );
  const xx = [560, 1215],
    ww = 485;
  label(g, 'p95 first visible token', xx[0], 363, 32, ink, sans, 600);
  label(g, 'Aggregate output', xx[1], 363, 32, ink, sans, 600);
  label(g, '≤ 800 ms', xx[0], 424, 34, teal, mono, 600);
  label(g, '≥ 180 tok/s', xx[1], 424, 34, teal, mono, 600);
  for (const [i, row] of qualified.entries()) {
    const y = 509 + i * 151;
    label(g, row.name, 92, y + 41, 36, ink, serif, 600);
    for (const [j, value, max, limit] of [
      [0, row.ttft, 1000, 800],
      [1, row.rate, 300, 180],
    ]) {
      const col = verdict && j === 0 && row.ttft > 800 ? '#c4755f' : j === 0 ? blue : mint;
      rect(g, xx[j], y, ww, 56, pale);
      rect(g, xx[j], y, (ww * value) / max, 56, col);
      line(
        g,
        [
          [xx[j] + (ww * limit) / max, y - 16],
          [xx[j] + (ww * limit) / max, y + 68],
        ],
        ink,
        4,
      );
      label(g, value + (j ? ' tok/s' : ' ms'), xx[j], y + 96, 29, ink, mono, 600);
    }
  }
  foot(
    g,
    verdict
      ? 'Use ' +
          qualified.find(meets).name.toLowerCase() +
          ' here. The 910 ms replay exceeds the 800 ms cap.'
      : 'Apply each goal independently to both replays.',
  );
}
function runner(g, c) {
  const mlx = cue(c, 5, 'On Apple hardware'),
    paged = cue(c, 5, 'A paged scheduler');
  header(
    g,
    'RUNNER AND PACKAGING',
    'What does the runner actually consume?',
    'Check model, backend, cache dtype, template and client fields together.',
  );
  const rows = [
    ['GGUF', 'Tensors + metadata', 'llama.cpp loader'],
    ['Modelfile', 'Points to supported weights', 'Ollama server'],
  ];
  if (mlx) rows.push(['MLX arrays', 'Shared CPU / GPU storage', 'MLX-LM']);
  for (const [i, row] of rows.entries()) {
    const y = 355 + i * 105;
    rect(g, 103, y - 21, 354, 62, i ? mint : blue, null, 0, 5);
    label(g, row[0], 130, y + 10, 34, ink, mono, 600);
    label(g, row[1], 526, y + 8, 34, ink);
    line(
      g,
      [
        [1040, y + 8],
        [1114, y + 8],
      ],
      teal,
      4,
    );
    label(g, row[2], 1154, y + 8, 35, ink, serif, 600);
  }
  if (paged) {
    label(g, 'Logical blocks', 109, 735, 33, ink);
    label(g, 'Physical KV pool', 109, 829, 33, ink);
    const slots = [3, 0, 5];
    for (let i = 0; i < 6; i++) {
      rect(g, 546 + i * 181, 808, 148, 48, slots.includes(i) ? mint : pale);
      label(g, 'Slot ' + i, 620 + i * 181, 832, 24, ink, mono, 500, 'center');
    }
    for (let i = 0; i < slots.length; i++) {
      const x = 620 + i * 362;
      label(g, 'Block ' + i, x, 726, 27, ink, mono, 600, 'center');
      line(
        g,
        [
          [x, 751],
          [620 + slots[i] * 181, 801],
        ],
        teal,
        3,
      );
    }
  }
  foot(
    g,
    paged
      ? 'The scheduler maps token blocks to cache slots. These are runtime allocations.'
      : 'Runner configuration and the tensor artifact have different jobs.',
  );
}
function timing(g, c) {
  const b = c.beat.beatIndex;
  if (b <= 2) clockReceipt(g, c);
  else if (b <= 4) service(g, c);
  else runner(g, c);
}
const base = evaluate(outputs.baseline),
  small = evaluate(outputs.candidate);
const held = small.rows.some((row, i) => row.critical && base.rows[i].pass && !row.pass);
function quality(g, c) {
  const open = cue(c, 1, 'Open the paired outputs'),
    diff = cue(c, 1, 'In this harness'),
    grade = cue(c, 1, 'Both artifacts ask');
  const abstain = cue(c, 2, 'Look at the unknown runbook'),
    hold = cue(c, 2, 'Hold the smaller artifact');
  header(
    g,
    'PAIRED OUTPUT REVIEW',
    'Would you release the smaller model?',
    'Same four invented cases  /  preserve the rollback check',
  );
  if (!open) {
    for (const [i, [name, run]] of [
      ['Baseline', base],
      ['Smaller model', small],
    ].entries()) {
      const x = 108 + i * 877;
      plate(g, x, 344, 829, 443);
      label(g, name, x + 55, 411, 42, white, sans, 600);
      label(g, run.score + ' / ' + run.rows.length, x + 414, 556, 113, white, serif, 600, 'center');
      strip(g, x + 64, 674, 700, 42, [[run.score, mint]], run.rows.length, '#476268');
    }
    foot(g, 'The totals tie. Which individual draft decides the protected check?');
    return;
  }
  const x = 545,
    y = 376,
    charWidth = 36,
    wordAt = outputs.candidate[0].length;
  const pairs = [
    ['Baseline', outputs.baseline[0]],
    ['Smaller', outputs.candidate[0]],
  ];
  plate(g, 92, 305, 1738, 319);
  for (const [i, [name, cmd]] of pairs.entries()) {
    label(g, name + '  ' + [base, small][i].score + '/4', 138, y + i * 120, 38, white, sans, 600);
    for (const [j, ch] of [...cmd].entries())
      label(
        g,
        ch,
        x + j * charWidth,
        y + i * 120,
        44,
        diff && j >= wordAt ? gold : white,
        mono,
        600,
        'center',
      );
  }
  if (diff) {
    const xx = x + wordAt * charWidth + charWidth * 0.5,
      width = (outputs.baseline[0].length - wordAt - 1) * charWidth;
    rect(g, xx, y + 87, width, 65, null, gold, 3, 7);
    label(g, 'missing suffix', xx + width / 2, y + 120, 25, gold, mono, 500, 'center');
  }
  const caseNames = ['Rollback', 'Missing node', 'Severity', 'Unknown runbook'];
  if (abstain) {
    label(g, 'Unknown runbook', 119, 688, 34, ink, serif, 600);
    label(g, 'Baseline', 119, 754, 28, red, mono, 600);
    label(g, outputs.baseline[3], 390, 754, 30, ink, mono);
    label(g, 'Smaller', 119, 821, 28, teal, mono, 600);
    label(g, outputs.candidate[3], 390, 821, 30, ink, mono);
  } else if (grade)
    for (let i = 0; i < 4; i++) {
      const xx = 119 + i * 437;
      label(g, caseNames[i], xx, 697, 31, ink, sans, 600);
      const ready = i !== 3;
      if (ready) {
        label(
          g,
          'Baseline   ' + (base.rows[i].pass ? 'pass' : 'fail'),
          xx,
          758,
          26,
          base.rows[i].pass ? teal : red,
          mono,
          500,
        );
        label(
          g,
          'Smaller    ' + (small.rows[i].pass ? 'pass' : 'fail'),
          xx,
          810,
          26,
          small.rows[i].pass ? teal : red,
          mono,
          500,
        );
      } else label(g, 'Compare next', xx, 758, 26, ink, mono);
    }
  else
    label(g, 'Protected case  /  the rollback command must end with --confirm.', 119, 735, 38, ink);
  foot(
    g,
    hold && held
      ? 'Hold the candidate. It gained abstention and lost the required rollback flag.'
      : abstain
        ? 'Unknown runbook  /  baseline invents Z9  /  candidate asks for human review.'
        : 'Both pass 3/4. Compare the two strings at the same character position.',
  );
}
function records(g, c) {
  const live = cue(c, 0, 'The running-model record'),
    cli = cue(c, 0, 'For a placement summary'),
    probe = cue(c, 0, 'Send a controlled inference request'),
    failed = cue(c, 0, 'Its request ID links');
  header(
    g,
    'DEPLOYMENT RECEIPT',
    'Can the loaded worker answer?',
    'Illustrated readiness probe  /  request 041  /  local runbook worker',
  );
  const events = [
    ['/api/tags', 'Available', ['runbook-assistant']],
    ['/api/ps', 'Loaded', ['digest, context_length', 'size_vram  (bytes)']],
    [
      'Inference 041',
      failed ? 'Worker error' : 'Request sent',
      failed ? ['prefill allocation failed'] : ['Awaiting response'],
    ],
  ];
  for (const [i, [src, name, body]] of events.entries()) {
    const x = 108 + i * 575,
      on = i === 0 || (i === 1 && live) || (i === 2 && probe);
    if (i > 0)
      line(
        g,
        [
          [x - 73, 550],
          [x - 9, 550],
        ],
        on ? teal : '#9caea3',
        4,
      );
    rect(g, x, 375, 498, 385, on ? '#fffbee' : '#e8e9db', '#a5b5ab', 2, 10);
    label(g, src, x + 33, 447, 32, ink, mono, 600);
    line(
      g,
      [
        [x + 30, 482],
        [x + 463, 482],
      ],
      '#bdcabf',
      2,
    );
    label(
      g,
      on ? name : 'Awaiting check',
      x + 32,
      557,
      49,
      failed && i === 2 ? red : teal,
      serif,
      600,
    );
    if (on)
      body.forEach((value, j) =>
        label(g, value, x + 33, 650 + 44 * j, 29, ink, mono, 500, 'left', 431),
      );
  }
  if (cli)
    label(g, 'ollama ps     PROCESSOR     CPU/GPU placement summary', 141, 824, 31, ink, mono, 600);
  foot(
    g,
    failed
      ? 'Request 041 joins the failed probe to its worker and phase.'
      : probe
        ? 'The loaded worker is processing request 041.'
        : live
          ? 'The running-model record identifies the loaded model.'
          : 'The inventory lists available model artifacts.',
  );
}
function boundary(g, c) {
  const scoped = cue(c, 1, "Check the caller's permission"),
    relay = cue(c, 1, 'An approved internal relay'),
    deny = cue(c, 1, 'Enforce the complete route');
  header(
    g,
    'PRIVATE INCIDENT ROUTE',
    'Which two boundaries need a check?',
    'Internal-only runbooks  /  a local caller and an internal relay',
  );
  rect(g, 84, 325, 1308, 495, null, teal, 4, 20);
  label(g, 'Approved network', 124, 377, 35, teal, sans, 600);
  function endpoint(x, y, w, title, sub, col) {
    rect(g, x, y, w, 132, '#fffbef', col, 3, 9);
    label(g, title, x + 24, y + 47, 34, ink, serif, 600);
    label(g, sub, x + 24, y + 96, 24, ink, mono, 500, 'left', w - 43);
  }
  endpoint(128, 455, 270, 'Caller', 'Team A', ink);
  endpoint(
    517,
    455,
    344,
    'Retrieval',
    scoped ? 'Team A docs only' : 'Team B document?',
    scoped ? teal : red,
  );
  endpoint(1016, 455, 314, 'Relay', 'Internal peer', ink);
  endpoint(1507, 455, 314, 'External', 'Outside policy', red);
  for (const [a, b, on] of [
    [398, 517, true],
    [861, 1016, relay],
    [1330, 1507, relay],
  ])
    if (on)
      line(
        g,
        [
          [a, 522],
          [b, 522],
        ],
        a === 1330 ? red : teal,
        4,
      );
  if (deny) {
    rect(g, 1394, 465, 40, 115, red);
    label(g, '×', 1414, 521, 40, white, sans, 700, 'center');
  }
  label(
    g,
    scoped
      ? 'Retrieval checks the document against the caller’s scope.'
      : 'A local process can ask for a restricted document.',
    128,
    681,
    32,
    ink,
  );
  if (relay)
    label(
      g,
      deny ? 'Deny the relay’s outbound route.' : 'Follow the relay’s next hop.',
      128,
      743,
      32,
      deny ? teal : red,
    );
  foot(g, 'Review the full path, including retrieval, tools, monitoring, logs and backups.');
}
const empty = admission(0),
  eight = admission(8),
  seven = admission(7),
  one = admission(1),
  { weights, workspace } = memory(32768, true),
  practice = releaseCases();
function lastDecision(g, c) {
  const inspected = cue(c, 4, 'Inspect that draft'),
    graded = cue(c, 5, 'Mark the rollback case'),
    held = cue(c, 5, 'Hold the candidate') && !practice.promote;
  const down = cue(c, 5, 'When the approved model is unavailable');
  const fallback = cue(c, 5, 'hand the incident'),
    offline = cue(c, 5, 'open the runbook offline');
  header(
    g,
    'LOCAL WORKER  /  RELEASE REPLAY',
    'Can this candidate serve the seven logs?',
    'Seven admitted at ' +
      seven.total.toFixed(3) +
      ' GB  /  log 08 queued  /  floor: four of five with no protected loss',
    true,
  );
  const baseline = practice.rows.filter((row) => row.before).length;
  label(g, 'Paired cases', 112, 361, 34, white, serif, 600);
  label(g, 'Baseline   ' + baseline + '/5', 112, 431, 32, white, mono, 600);
  label(g, 'Smaller    ' + practice.passes + '/5', 112, 506, 32, white, mono, 600);
  for (const [i, row] of practice.rows.entries()) {
    const x = 621 + i * 248;
    label(
      g,
      row.id + (row.protected ? ' *' : ''),
      x,
      358,
      30,
      row.protected ? gold : white,
      sans,
      600,
      'center',
    );
    for (const [j, pass] of [row.before, row.after].entries()) {
      const y = 430 + j * 75,
        known = !j || graded || (!row.protected && row.id !== 'Service');
      rect(
        g,
        x - 97,
        y - 24,
        194,
        48,
        known ? (pass ? '#235a56' : '#673f36') : '#304b50',
        null,
        0,
        5,
      );
      label(
        g,
        known ? (pass ? 'pass' : 'fail') : '?',
        x,
        y,
        27,
        known ? (pass ? mint : '#ffc0a3') : fog,
        mono,
        600,
        'center',
      );
    }
  }
  label(
    g,
    down
      ? 'Candidate held   /   ' + outputs.candidate[0] + ' lacks --confirm'
      : '* Required rollback flag    --confirm',
    112,
    587,
    31,
    gold,
    mono,
    600,
    'left',
    1690,
  );
  if (down) {
    rect(g, 98, 650, 1724, 200, null, '#76a599', 3, 14);
    label(g, 'Approved network', 125, 680, 25, mint, mono, 600);
    label(g, 'Worker offline', 145, 770, 40, white, serif, 600);
    if (fallback) {
      line(
        g,
        [
          [460, 772],
          [660, 772],
          [704, 729],
          [854, 729],
        ],
        gold,
        4,
      );
      line(
        g,
        [
          [660, 772],
          [704, 808],
          [854, 808],
        ],
        gold,
        4,
      );
      label(
        g,
        offline ? 'Local runbook opened offline' : 'Approved local runbook',
        894,
        729,
        34,
        white,
        sans,
        600,
      );
      label(g, 'Human engineer', 894, 808, 34, white, sans, 600);
    }
  } else {
    plate(g, 101, 677, 1718, 160);
    if (inspected) {
      label(g, 'Candidate draft', 150, 757, 34, fog, sans, 600);
      label(g, outputs.candidate[0], 501, 757, 46, white, mono, 600);
      if (graded) label(g, 'Missing --confirm', 1200, 757, 35, gold, mono, 600);
    } else
      label(
        g,
        'The reviewer requests the candidate’s rollback draft.',
        150,
        757,
        46,
        white,
        serif,
        600,
      );
  }
  foot(
    g,
    offline
      ? 'Field replay  /  power, warm latency and an offline runbook.'
      : fallback
        ? 'The local fallback keeps the incident inside the approved network.'
        : held
          ? 'Hold the candidate. The protected-case rule applies even at the score floor.'
          : graded
            ? 'The candidate lost a case the baseline passed. Apply the release rule.'
            : inspected
              ? 'Does the draft contain the required flag?'
              : 'Inspect the protected case alongside the total.',
    true,
  );
}
function finalPractice(g, c) {
  const b = c.beat.beatIndex;
  if (b >= 4) {
    lastDecision(g, c);
    return;
  }
  const fill = cue(c, 3, 'Try all eight', 1.25);
  const lastStrip = cue(c, 3, 'The eighth cache strip', 0.8);
  const overflow = afterCue(c, 3, 'crosses the planning line', { seconds: 0.45 });
  const headroomKnown = afterCue(c, 3, 'Six point four gigabytes are available for cache');
  const divide = cue(c, 3, 'Divide by the cache per log');
  const admitted = afterCue(c, 3, 'Admit seven, queue the eighth', { caption: true });
  const queue = afterCue(c, 3, 'Admit seven, queue the eighth', { seconds: 0.75 });
  const peakKnown = afterCue(c, 3, 'Seven use about fifteen point seven gigabytes', { caption: true });
  const firstSeven = seven.sessions * (lastStrip > 0 ? 1 : fill);
  header(
    g,
    'ADMISSION PRACTICE',
    'Who gets the last slot?',
    '32,768 tokens per log  /  capped K and V  /  16 GB planning limit',
    true,
  );
  const sx = 114,
    gap = 209;
  for (let i = 0; i < eight.sessions; i++) {
    const last = i === seven.sessions,
      wait = last && queue > 0,
      x = sx + i * gap,
      y = 340 + (last ? queue * 60 : 0),
      hasStrip = !last && firstSeven >= i + 1;
    rect(g, x + 5, y + 8, 172, 109, '#11292d', null, 0, 6);
    rect(
      g,
      x,
      y,
      172,
      109,
      wait ? gold : hasStrip ? mint : '#3b6261',
      wait ? gold : '#90b4a1',
      2,
      6,
    );
    label(
      g,
      'LOG ' + String(i + 1).padStart(2, '0'),
      x + 86,
      y + 38,
      29,
      hasStrip || wait ? ink : white,
      mono,
      600,
      'center',
    );
    if (queue === 1 && wait) {
      label(g, 'Queued', x + 86, y + 79, 27, ink, sans, 600, 'center');
    } else {
      for (let j = 0; j < 3; j++)
        line(
          g,
          [
            [x + 23, y + 66 + j * 9],
            [x + 135 - (j % 2) * 42, y + 66 + j * 9],
          ],
          hasStrip ? '#527e70' : '#8aa59b',
          2,
        );
    }
  }
  const x = 117,
    w = 1652,
    max = 18,
    y = 613,
    h = 70,
    gb = (amount) => (w * amount) / max,
    lim = x + gb(empty.limit),
    lastStart = x + gb(seven.total);
  label(
    g,
    weights + ' GB weights + ' + workspace + ' GB workspace',
    x,
    560,
    32,
    white,
    mono,
    500,
  );
  label(
    g,
    'Cache per log ≈ ' + one.kv.toFixed(4) + ' GB',
    x + w,
    560,
    32,
    white,
    mono,
    500,
    'right',
  );
  strip(
    g,
    x,
    y,
    w,
    h,
    [
      [weights, blue],
      [workspace, gold],
      ...Array.from({ length: seven.sessions }, (_, i) => [one.kv * clamp(firstSeven - i), mint]),
    ],
    max,
    '#375559',
  );
  if (lastStrip > 0 && queue < 1) {
    const room = lim - lastStart;
    const span = (room * lastStrip + (gb(one.kv) - room) * overflow) * (1 - queue);
    hatch(g, lastStart, y, span, h, fog, 13);
    rect(g, lastStart, y, span, h, null, fog, 3);
    rect(g, lim, y, span - room, h, '#995b4c');
  }
  line(
    g,
    [
      [lim, 589],
      [lim, 704],
    ],
    '#ffac8b',
    5,
  );
  label(g, empty.limit + ' GB planning limit', lim, 737, 28, '#ffb99f', mono, 600, 'center');
  const available = (empty.limit - empty.total).toFixed(1) + ' GB';
  const sum = peakKnown
    ? seven.total.toFixed(3) + ' GB with seven logs'
    : headroomKnown
      ? available + ' available for cache'
      : overflow === 1 && lastStrip === 1
        ? eight.total.toFixed(3) + ' GB with all eight'
        : '';
  label(g, sum, x, 746, 38, white, serif, 600);
  if (divide)
    label(
      g,
      available +
        ' ÷ ' +
        one.kv.toFixed(4) +
        ' GB/log' +
        (admitted ? '   →   ' + seven.sessions + ' whole logs' : ''),
      x,
      837,
      32,
      gold,
      mono,
      600,
    );
  foot(
    g,
    peakKnown
      ? 'Seven admitted, one waiting. Validate the modeled peak and latency under this workload.'
      : overflow > 0
        ? 'Subtract shared weights and workspace before counting whole logs.'
        : fill > 0
          ? 'Add one cache strip per log on the same scale.'
          : 'How many whole logs fit under the planning line?',
    true,
  );
}
function close(g, c) {
  if (c.beat.beatIndex === 0) records(g, c);
  else if (c.beat.beatIndex === 1) boundary(g, c);
  else finalPractice(g, c);
}
export const benchPainters = [timing, quality, close];
export function checkBench(clock) {
  assert.deepEqual(rates(receipt), { uncached: 400, prefill: 2000, output: 40 });
  const omitted = timingState({
    beat: { beatIndex: 2 },
    reveal: (p) => (p === 'Remove the output duration' ? 1 : 0),
  });
  assert.deepEqual(omitted.read, { uncached: 400, prefill: 2000, output: null });
  const second = timingState(clock(2, 1));
  assert.deepEqual(second.read, { uncached: null, prefill: null, output: 40 });
  assert.deepEqual(qualified.map(meets), [true, false]);
  assert.deepEqual([base.score, small.score, held], [3, 3, true]);
  assert.equal(outputs.baseline[0].slice(outputs.candidate[0].length), ' --confirm');
  assert.deepEqual(
    base.rows.map((r) => r.pass),
    [true, true, true, false],
  );
  assert.deepEqual(
    small.rows.map((r) => r.pass),
    [false, true, true, true],
  );
  assert.equal(weights + workspace, empty.total);
  assert.equal(Math.floor((empty.limit - empty.total) / one.kv), seven.sessions);
  assert.equal((empty.limit - empty.total).toFixed(1), '6.4');
  assert.deepEqual(
    [seven.total.toFixed(3), eight.total.toFixed(3), seven.fits, eight.fits],
    ['15.707', '16.579', true, false],
  );
  assert.deepEqual([practice.passes, practice.lost.id, practice.promote], [4, 'Rollback', false]);
}
