import { C, short, pct, mix } from './drawing.mjs';
import * as E from './examples.mjs';
import { aliases } from './release.mjs';

export function risk(g) {
  const { head, beat, cue, txt, mono, seal, line, dot, paper, path } = g;
  head(
    'Risk after a clean window',
    beat <= 2 ? 'What warrants intervention?' : 'How often could a clean run happen?',
  );
  if (beat <= 2) {
    const rows = [
      ['500 requests / 100 reviews', '0 confirmed', 0, true],
      ['500 requests / 100 reviews', '1 confirmed', 1, true],
      ['Release C / wrong rollout', '1 claimed', 1, false],
    ];
    const visible = [true, cue(1, 'confirmed unsupported serve'), beat === 2];
    rows.forEach(([sample, outcome, unsafe, matches], i) => {
      const y = 164 + i * 106;
      paper(44, y - 29, 871, 81);
      txt(sample, 60, y + 17, 20);
      mono(outcome, 435, y + 17, 19);
      const decision = E.freshDecision({
        releaseMatches: true,
        attemptMatches: matches,
        requests: 500,
        reviewed: 100,
        unsafe,
        latencyComplete: false,
      });
      if (visible[i]) seal(decision, 745, y - 12, decision === 'ABORT' ? C.red : C.hold, 146);
    });
    if (beat === 2) mono('Escalate missing telemetry at the declared timeout.', 64, 468, 17, C.dim);
    return;
  }
  const n = 1200,
    alpha = 0.05,
    p = E.zeroFailureUpper(n, alpha);
  const x = (v) => 108 + (v / 0.005) * 478,
    y = (v) => 385 - v * 218;
  const pts = Array.from({ length: 121 }, (_, i) => {
    const v = (i * 0.005) / 120;
    return [x(v), y((1 - v) ** n)];
  });
  line(108, 163, 108, 386, C.ink, 2);
  line(107, 385, 601, 385, C.ink, 2);
  path(pts, C.stable, 4);
  mono('Pr(zero failures)', 50, 136, 17);
  [0, 0.5, 1].forEach((v) => mono(String(v), 63, y(v) + 5, 14, C.dim));
  [0, 0.001, 0.002, 0.003, 0.004, 0.005].forEach((v) => {
    line(x(v), 385, x(v), 392);
    mono(pct(v, 1, 1), x(v) - 13, 411, 13, C.dim);
  });
  mono('Assumed failure probability', 196, 442, 16);
  paper(627, 129, 287, 302);
  mono('FIXED SAMPLE', 645, 161, 15, C.stable);
  txt('n = 1,200', 645, 202, 30, C.ink, { face: 'Serif' });
  mono('Independent trials', 645, 245, 16);
  mono('Fixed failure rate', 645, 273, 16);
  mono('Correct labels', 645, 301, 16);
  if (beat >= 4) {
    line(x(0), y(alpha), x(0.005), y(alpha), C.candidate, 1.5);
    dot(x(p), y(alpha), 6, C.candidate);
    mono('α = 0.05', 645, 339, 20, C.candidate);
  }
  if (cue(4, 'Solve for the upper bound')) mono('1 − α^(1/n)', 645, 381, 22, C.ink);
  if (cue(5, 'upper bound is about'))
    seal('Upper bound   ' + pct(p, 1, 3), 301, 454, C.stable, 290);
  if (beat === 3) mono('Pr(0) = (1 − p)^n', 643, 382, 18, C.stable);
}

const abortHistory = E.aliasHistory('canary', E.CANDIDATE, [E.STABLE]);
const rollHistory = E.aliasHistory('production', E.STABLE);
export function recovery(g) {
  const { head, cue, beat } = g;
  const abort = beat === 1;
  const n = abort
    ? Number(!!cue(1, 'repoints canary to stable'))
    : cue(2, 'Return production to stable')
      ? 2
      : Number(!!cue(2, 'Promote the candidate'));
  head(
    'Recovery drill  /  ' + (abort ? 'canary only' : 'separate production run'),
    abort ? 'Remove the canary’s exposure' : 'Return the promoted alias',
  );
  const msg = abort
    ? n
      ? 'Canary abort    /    Production stayed on stable'
      : cue(1, 'Abort removes its exposure')
        ? 'Candidate exposure 0%    /    Failed assignments blocked'
        : 'Candidate selected only by canary'
    : n === 2
      ? 'Production rollback    /    Promotion retained in history'
      : n === 1
        ? 'Candidate promoted to production'
        : 'Production starts on stable';
  aliases(g, (abort ? abortHistory : rollHistory).states[n], { message: msg });
}

function meter(g, capacity, demand, maximum) {
  const x = 80,
    y = 259,
    w = 790;
  const { rect, line, txt, mono, dot } = g;
  const unit = w / maximum;
  const at = x + demand * unit;
  rect(x - 10, y - 16, w + 20, 74, '#bcc9ba', 6);
  rect(x, y, w, 40, C.ink, 4);
  rect(x, y, capacity * unit, 40, '#74b7a3', 4);
  line(x + capacity * unit, y - 2, x + capacity * unit, y + 42, C.stable, 3);
  for (let n = 0; n <= maximum; n += 10) {
    const xx = x + n * unit;
    line(xx, y + 43, xx, y + 50, n % 50 === 0 ? C.ink : C.rule, 1.5);
    if (n % 50 === 0) mono(n, xx - 8, y + 72, 14, C.dim);
  }
  line(at, y - 56, at, y + 52, C.candidate, 3);
  dot(at, y - 55, 5, C.candidate);
  txt('Demand  ' + demand + ' /s', at - 8, y - 69, 21, C.candidate, { align: 'right', bold: true });
  mono('Ready capacity   ' + capacity + ' requests/s', x, y + 116, 21);
}
export function capacity(g) {
  const { head, cue, beat, mono, txt, seal } = g;
  const next = cue(3, 'Twenty more requests a second');
  const rec = E.readiness[next ? 1 : 0];
  head('Stable worker pool  /  readiness receipts', 'Can stable take the load back?');
  mono(rec.id + '    ' + short(rec.release) + '    Healthy · compatible', 80, 138, 18, C.dim);
  meter(g, rec.capacity, rec.demand, 150);
  seal(
    Math.abs(rec.capacity - rec.demand) +
      (E.recoveryReady(rec) ? ' requests/s spare' : ' requests/s short'),
    590,
    342,
    E.recoveryReady(rec) ? C.stable : C.red,
    283,
  );
  if (beat === 2)
    mono(
      'Warm weights  /  compiled kernels  /  cache space  /  provider quota',
      80,
      451,
      16,
      C.dim,
    );
  if (cue(3, 'check the stable digest'))
    mono('Check the worker trace for stable digest ' + short(rec.release), 80, 451, 19, C.stable);
}

const observation = E.records.complete[271];
const reportDigest = E.sha(E.canonical(E.report));
export function lineage(g) {
  const { head, beat, cue, txt, mono, paper, seal, line, dot } = g;
  head(
    'Protected audit trail  /  rollout-052',
    beat <= 4 ? 'Who actually served request 272?' : 'Choose the next inspection',
  );
  if (beat > 4) {
    const rows = [
      ['Unparseable reply', 'Inspect schema and image'],
      ['Approval without a record', 'Replay with pinned evidence'],
      ['Supported but slow', 'Inspect capacity and decoding'],
      ['Telemetry missing', 'Hold and repair collection'],
    ];
    const seen = [
      cue(5, 'router can’t parse'),
      cue(5, 'If the answer parses'),
      cue(6, 'If a supported answer is slow'),
      cue(6, 'If measurements are missing'),
    ];
    rows.forEach(([a, b], i) => {
      const y = 147 + i * 87;
      txt(a, 60, y + 18, 23, C.ink, { face: 'Serif' });
      line(60, y + 40, 903, y + 40);
      if (seen[i]) mono(b, 503, y + 18, 19, C.stable);
    });
    return;
  }
  const missing = cue(3, 'trace loses its release ID');
  paper(48, 125, 390, 300);
  mono('WORKER OBSERVATION', 70, 161, 15, C.stable);
  txt('Request 272', 70, 230, 40, C.ink, { face: 'Serif' });
  mono(observation.id + '  /  rollout-052', 71, 277, 17);
  mono('Resolved release', 71, 334, 15, C.dim);
  mono(
    missing ? '— missing —' : short(observation.release),
    71,
    384,
    28,
    missing ? C.red : C.stable,
  );
  if (!missing) {
    line(440, 264, 541, 264, C.stable, 3);
    dot(543, 264, 6, C.stable);
    const rows = [
      ['Manifest', short(E.CANDIDATE)],
      ['Suite / evaluator', E.report.suite + ' / ' + E.report.evaluator],
      ['Report digest', short(reportDigest)],
      ['Canary transition', 'stable r1 → candidate r2'],
    ];
    rows.forEach(([a, b], i) => {
      const y = 141 + i * 81;
      mono(a.toUpperCase(), 566, y, 13, C.dim);
      mono(b, 566, y + 34, 19, C.ink, 343);
    });
    if (beat >= 2) mono('12:00 UTC    /    rollout controller', 566, 452, 16, C.stable);
  } else {
    g.path(
      [
        [452, 264],
        [491, 264],
      ],
      C.red,
      2,
      [5, 5],
    );
    txt('Current alias', 553, 217, 26, C.ink, { face: 'Serif' });
    mono('canary → candidate', 553, 267, 21);
    if (beat >= 4) seal('Past worker unknown', 546, 325, C.red, 334);
  }
}

export function owners(g) {
  const { head, paper, txt, mono, beat, cue, seal, line } = g;
  if (beat <= 2) {
    const selected = cue(1, 'M L flow aliases') ? 2 : cue(1, 'owned release registry') ? 1 : 0;
    head('Serving stack  /  release assembly', 'How much does a model alias select?');
    const x = 50;
    const pieces = [
      ['Prompt', short(E.candidate.prompt)],
      ['Image', short(E.candidate.runtime)],
      ['Model', 'teaching-pin'],
    ];
    pieces.forEach(([name, value], i) => {
      const y = 133 + i * 92;
      g.rect(x, y, 328, 65, C.ink, 5);
      g.rect(x + 10, y + 9, 276, 47, C.paper, 2);
      txt(name, x + 19, y + 39, 20, C.ink, { face: 'Serif' });
      mono(value, x + 101, y + 38, 17, C.stable, 176);
      for (let n = 0; n < 3; n++)
        line(x + 297, y + 18 + n * 11, x + 316, y + 18 + n * 11, C.rule, 2);
    });
    mono('Retained components', 51, 445, 18, C.dim);
    if (selected === 0) {
      g.path(
        [
          [385, 164],
          [473, 164],
          [509, 208],
          [603, 208],
        ],
        C.stable,
        4,
      );
      txt('Artifact store', 618, 217, 28, C.stable, { face: 'Serif' });
    }
    if (selected >= 1) {
      for (let i = 0; i < 3; i++) {
        line(382, 164 + i * 92, 435, 164 + i * 92, C.stable, 3);
      }
      line(435, 164, 435, 348, C.stable, 3);
      line(435, 255, 536, 255, C.stable, 3);
      paper(535, 191, 369, 115);
      txt('Release manifest', 552, 225, 24, C.ink, { face: 'Serif' });
      mono(short(E.CANDIDATE), 552, 266, 24, C.stable);
      mono('+ policy, index and evaluation pins', 539, 331, 16, C.dim, 360);
    }
    if (selected === 2) {
      g.path(
        [
          [382, 351],
          [402, 351],
          [484, 410],
          [535, 410],
        ],
        C.candidate,
        4,
      );
      seal('MLflow model alias', 536, 391, C.candidate, 344);
    }
    return;
  }
  const sections = [
    [
      ['Component bytes', 'OCI artifact store'],
      ['Prompt, index, policy, image', 'Release registry'],
      ['Model version alias', 'MLflow Model Registry'],
    ],
    [
      ['Frozen case results', 'CI + reviewed evaluator'],
      ['Pass / pause / abort', 'Argo Rollouts analysis'],
      ['Fine traffic weights', 'Compatible traffic router'],
      ['First-turn release', 'Application assignment store'],
    ],
    [
      ['Ready capacity', 'Workers + serving backend'],
      ['Observed release digest', 'Collector + protected store'],
      ['Feature-flag selection', 'Application resolves target'],
    ],
  ];
  const idx = beat < 3 ? 0 : beat < 5 ? 1 : 2,
    rows = sections[idx];
  head('Deployment stack  /  enforcement', 'Who can enforce this control?');
  const selected =
    idx === 0
      ? cue(1, 'M L flow aliases')
        ? 2
        : cue(1, 'owned release registry')
          ? 1
          : 0
      : idx === 1
        ? cue(4, 'application separately owns')
          ? 3
          : beat === 4
            ? 2
            : cue(3, 'Argo Rollouts')
              ? 1
              : 0
        : cue(5, 'Feature flags')
          ? 2
          : cue(5, 'Collectors')
            ? 1
            : 0;
  for (const [i, [a, b]] of rows.entries()) {
    const y = 143 + i * 77;
    const active = i === selected;
    g.rect(49, y, 399, 56, active ? C.ink : '#d2d9ca', 4);
    txt(a, 64, y + 36, 21, active ? C.white : C.ink, { face: 'Serif' });
    g.path(
      [
        [450, y + 27],
        [501, y + 27],
      ],
      active ? C.candidate : C.rule,
      active ? 6 : 2,
    );
    g.dot(503, y + 27, active ? 7 : 4, active ? C.candidate : C.rule);
    txt(b, 528, y + 36, 20, active ? C.stable : C.dim, { bold: active, w: 379 });
  }
  const clues = [
    [
      'Digest verifies bytes',
      'Manifest selects the whole bundle',
      'Model alias selects one component',
    ],
    [
      'Case outcomes + scorer provenance',
      'Failed background analysis → canary weight 0',
      'Replica ratio approximates traffic',
      'Durable store preserves an active thread',
    ],
    [
      'Healthy and compatible under demand',
      'Record the served release digest on each request',
      'Keep the served release digest after the flag moves',
    ],
  ];
  paper(52, 462, 856, 44);
  mono(clues[idx][selected], 67, 490, 17, C.stable, 826);
}

function practiceCounter(g) {
  const { beat, cue, head, txt, mono, paper, rail, rect, seal } = g;
  const old = cue(3, 'review from rollout seventy-two');
  const incoming = cue(4, 'a separate review arrives'),
    confirmed = cue(4, 'It confirms an unsupported approval');
  const arrivals = old ? [E.priorSlip] : [];
  if (confirmed) arrivals.push(E.currentSlip);
  const w = E.practiceWindow(arrivals),
    stop = cue(4, 'Stop candidate traffic'),
    moved = cue(4, 'move the canary pointer');
  head('Operator drill  /  rollout-073', 'Decide what to do with candidate traffic');
  paper(43, 125, 488, 309);
  mono('CANDIDATE   ' + short(E.CANDIDATE), 62, 161, 16, C.candidate);
  txt('Support reviews', 62, 211, 25, C.ink, { face: 'Serif' });
  mono(w.reviewed + ' / ' + w.requests, 307, 211, 24);
  rail(63, 231, 442, w.reviewed, w.requests, C.candidate);
  mono(w.requests - w.reviewed + ' pending', 64, 292, 18);
  mono(w.unsafe + ' confirmed unsafe', 64, 333, 19, w.unsafe ? C.red : C.stable);
  mono('Latency and transport within limits', 64, 393, 16, C.dim);
  mono('Production    STABLE', 563, 161, 18, C.stable);
  mono(
    'Canary        ' + (moved ? 'STABLE' : 'CANDIDATE'),
    563,
    204,
    18,
    moved ? C.stable : C.candidate,
  );
  if (old || incoming) {
    const s = incoming ? E.currentSlip : E.priorSlip;
    paper(556, 242, 350, 148);
    mono('Review  ' + s.id + '  /  R' + s.attempt, 574, 276, 18);
    txt(
      incoming && !confirmed ? 'Examining approval…' : 'Approval record empty',
      574,
      327,
      23,
      C.ink,
      { face: 'Serif' },
    );
    mono(
      incoming ? (confirmed ? 'Added to R73' : 'Pending review') : 'Filed with R72',
      574,
      365,
      17,
      incoming && confirmed ? C.red : C.dim,
    );
  }
  const decided = stop || (!confirmed && cue(3, 'Hold the exposure'));
  if (decided)
    seal(
      w.decision + (stop ? '  /  candidate exposure 0%' : '  /  collect reviews'),
      89,
      448,
      stop ? C.red : C.hold,
      390,
    );
}

function worker(g, status, light) {
  const { rect, polygon, mono, dot, line } = g;
  polygon(
    [
      [652, 173],
      [689, 135],
      [891, 135],
      [919, 164],
      [919, 358],
      [652, 358],
    ],
    '#77998d',
  );
  rect(649, 165, 270, 204, C.stable, 12);
  rect(662, 181, 244, 73, C.ink, 5);
  mono('STABLE WORKER', 677, 208, 14, C.brass);
  mono('accepts v1.ship', 677, 236, 22, C.white, 214);
  rect(665, 279, 234, 37, '#13363c', 7);
  rect(672, 285, 220, 6, '#92aca0', 2);
  dot(682, 341, 7, light);
  mono(status, 703, 348, 16, C.white, 186);
  for (let i = 0; i < 5; i++) line(870 + i * 6, 146, 878 + i * 6, 153, C.stable, 2);
}
export function practice(g) {
  if (g.beat <= 4) {
    practiceCounter(g);
    return;
  }
  const { head, beat, cue, after, txt, mono, seal, roller, packet, paper, rect, line, path } = g;
  const enough = after(6, 'ready capacity of one hundred sixty');
  const stableReceipt = E.receipt(160, E.repaired);
  const arrival = cue(6, 'Bring thread six', 1.45);
  const inspect = arrival > 0 || beat > 6;
  if (!inspect) {
    head('After the canary abort  /  both aliases on stable', 'Can the pool absorb the return?');
    const r = enough ? stableReceipt : E.receipt(134, E.saved);
    meter(g, r.capacity, r.demand, 180);
    if (after(6, 'Sixteen requests a second have nowhere to go') && !enough)
      seal(r.demand - r.capacity + ' requests/s short', 599, 344, C.red, 277);
    if (enough) seal(r.capacity - r.demand + ' requests/s spare', 599, 344, C.stable, 277);
    return;
  }
  const paused = cue(8, 'Pause thread six');
  const staging = cue(8, 'Here a reviewed migration', 0.75);
  const copying = cue(8, 'copies the shipment', 1.6);
  const written = copying === 1 && after(8, 'writes version one');
  const reading = written ? cue(8, 'Read it back', 0.9) : 0;
  const verified = reading === 1 && E.recoveryReady(stableReceipt);
  const resume = verified ? cue(9, 'Resume one request', 1.25) : 0;
  const served = resume === 1;
  const observed =
    served &&
    after(9, "The worker records stable's digest, thread six, and shipment forty-four twelve");
  const traceMatch = observed && after(9, 'Follow that value back to the saved conversation');
  head(
    `Return lane  /  stable  /  ${stableReceipt.capacity} ready for ${stableReceipt.demand} requests per second`,
    resume > 0
      ? 'The first resumed request'
      : staging
        ? 'Copy the shipment and verify the read'
        : 'Can stable read thread six?',
  );
  const savedX = mix(mix(45, 332, arrival), 52, staging);
  const targetX = mix(336, 423, resume);
  const w = 217;
  const y = 191;
  roller(47, 352, 610);
  const status = served
    ? 'SERVED'
    : resume > 0
      ? 'RESUMING'
      : verified
        ? 'READ VERIFIED'
        : paused
          ? 'PAUSED'
          : 'AWAITING READ';
  const light = verified ? '#b7deb0' : paused ? '#f7a58d' : C.brass;
  worker(g, status, light);
  packet(savedX, y, w, 150, E.saved.shipId, 'shipId', 'v' + E.saved.version);
  if (staging < 1) txt('thread-6', savedX + 10, y - 15, 22, C.ink, { face: 'Mono' });
  if (staging === 1) {
    const from = savedX + w / 2;
    const to = targetX + w / 2;
    if (resume === 0) {
      const transferY = 131;
      path(
        [[from, y], [from, transferY], [to, transferY], [to, y]],
        C.stable,
        copying > 0 ? 2 : 1,
        copying > 0 ? [] : [4, 6],
      );
      if (copying > 0 && copying < 1) {
        const x = mix(from, to, copying);
        rect(x - 68, transferY - 16, 136, 32, C.brass, 4);
        txt(E.saved.shipId, x, transferY + 6, 19, C.ink, { face: 'Mono', align: 'center' });
      }
    }
    packet(
      targetX,
      y,
      w,
      150,
      copying === 1 ? E.repaired.ship : '',
      'ship',
      written ? 'v' + E.repaired.version : '',
      '#c4d6ae',
    );
    mono('thread-6 saved', savedX + 13, 390, 17, C.dim);
    mono(written ? 'Migrated state' : 'Migration draft', targetX + 13, 390, 17, C.stable);
    if (reading > 0 && resume === 0) {
      const start = targetX + w + 8;
      const end = mix(start, 667, reading);
      line(start, 298, end, 298, C.stable, 4);
      g.dot(end, 298, 5, C.stable);
    }
  }
  if (paused && !written) seal('PAUSED   /   waiting for v1.ship', 51, 418, C.red, 345);
  if (verified && !observed) seal('v1.ship read back', 51, 418, C.stable, 345);
  if (observed) {
    paper(43, 402, 873, 37);
    mono('SERVING TRACE', 62, 428, 14, C.stable);
    mono(E.returned.thread, 211, 428, 22);
    const valueX = targetX + 22;
    if (traceMatch) {
      const stateEdge = targetX + 14;
      const connectorX = targetX - 12;
      path(
        [[stateEdge, y + 116], [connectorX, y + 116], [connectorX, 421], [valueX - 7, 421]],
        C.stable,
        2,
      );
      rect(valueX - 7, 408, 178, 26, '#c4d6ae', 3);
    }
    mono('ship = ' + E.returned.ship, valueX, 428, 19, C.ink, 188);
    mono('STABLE ' + short(E.returned.release), 653, 428, 22, C.stable, 245);
  }
}
