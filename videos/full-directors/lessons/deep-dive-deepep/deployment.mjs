import assert from 'node:assert/strict';
import {
  communicationBudget,
  redundantGradient,
} from '../../../films/deep-dive-deepep/arithmetic.mjs';
import {
  C,
  cue,
  alpha,
  text,
  mono,
  rect,
  path,
  dot,
  card,
  chip,
  board,
  row,
  linePoint,
  scene,
  note,
  vector,
} from './bench.mjs';

export function backend(g, c) {
  const registered = cue(c, 4, 'registers symmetric memory', 0.65);
  const launched = cue(c, 4, 'to its kernels', 1.3);
  scene(g, 'NCCL Gin', 'What must stay registered while a kernel runs?');
  board(g, 128, 338, 740, 386, 'Application process group');
  board(g, 1030, 338, 740, 386, 'GPU kernel');
  chip(g, 203, 476, 577, 118, 'NCCL communicator');
  const from = [777, 533],
    to = [1425, 642];
  path(g, [from, [943, 533], [1052, 642], to], '#ada585', 7);
  if (registered)
    alpha(g, registered, () => chip(g, 1128, 447, 530, 96, 'Registered window', C.sky));
  if (launched) {
    const p = linePoint([from, [943, 533], [1052, 642], to], launched);
    row(g, ...p, 'device comm', C.gold, 320);
  }
  note(
    g,
    launched === 1
      ? 'Run the final hook and drain GPU work and readers before unregistering the window.'
      : 'The group supplies rank identity. Gin supplies device-side network operations.',
  );
}

const table = [
  { sms: 24, rate: 643 },
  { sms: 64, rate: 726 },
];
export function historic(g, c) {
  const first = cue(c, 3, 'At sixty-four', 0),
    second = cue(c, 3, 'The table leaves', 0);
  scene(g, 'Historical V2 benchmark', 'Can the dispatch table choose a layer setting?');
  text(
    g,
    '8 × SM100 on NVLink     /     8K tokens     /     H = 7,168     /     top-8',
    127,
    315,
    39,
  );
  [first, second].forEach((seen, i) => {
    const { sms, rate } = table[i],
      y = 442 + i * 181;
    text(g, sms + ' SMs', 120, y + 36, 39);
    path(
      g,
      [
        [401, y + 78],
        [1660, y + 78],
      ],
      C.line,
      3,
    );
    if (seen) {
      rect(g, 401, y, rate * 1.55, 76, i ? C.blue : C.teal);
      mono(g, rate + ' GB/s', 427, y + 38, 37, C.white, 'left');
    }
  });
  note(
    g,
    second
      ? 'Reported logical dispatch rates. Expert latency and complete-layer time still need a measurement.'
      : 'FP8 dispatch     /     BF16 combine     /     logical gigabytes per second',
  );
}

const original = [2, 4],
  extra = [1, 3],
  ranks = [0, 1, 2, 3];
const reduced = redundantGradient(original, extra, ranks, ranks);
const peers = [
  { id: 0, index: 2, entry: 'C' },
  { id: 1, index: 5, entry: 'F' },
];
function lookupState(c) {
  const replay = c.beat.beatIndex === 3;
  const issued = cue(c, 3, 'issue one final unaggregated get', 0);
  const flushed = issued && cue(c, 3, 'record an asynchronous flush', 0);
  const arrival = replay
    ? flushed && cue(c, 3, 'After completion', 1.2)
    : cue(c, 2, 'Fetch the entry data', 1.2);
  return { replay, issued, flushed, arrival };
}
export function shared(g, c) {
  const b = c.beat.beatIndex;
  if (b < 2) {
    const join = cue(c, 0, 'Every rank in the collective', 1);
    const grad = cue(c, 1, 'A replica supplies', 0);
    const sum = cue(c, 1, 'Moving these gradients', 0);
    scene(g, 'Redundant experts', 'Who participates when only two ranks hold weights?');
    const x = [325, 747, 1169, 1591];
    path(
      g,
      [
        [x[0], 526],
        [x[3], 526],
      ],
      C.line,
      8,
    );
    x.forEach((v, i) => {
      const owner = i === 0,
        replica = i === 2;
      if (join && !owner && !replica) dot(g, v, 526, 49, C.pale, C.teal);
      else dot(g, v, 526, 48, C.white, C.ink);
      mono(g, 'R' + i, v, 526, 36);
      text(g, owner ? 'Original' : replica ? 'Replica' : 'No replica', v, 401, 39, C.ink, 'center');
      if (owner || replica) {
        chip(
          g,
          v - 134,
          623,
          268,
          76,
          b === 0
            ? 'weights'
            : owner
              ? vector(sum ? reduced : original)
              : grad
                ? vector(extra)
                : 'grad',
          owner ? C.pale : C.sky,
        );
      } else if (join) text(g, 'joins', v, 662, 34, C.teal, 'center');
    });
    note(
      g,
      b === 0
        ? 'V2.5   /   NVLink collective   /   all ranks share the replication map'
        : sum
          ? 'FP32 gradient at original owner     [2, 4] + [1, 3] = [3, 7]'
          : 'The original owner already holds its local gradient.',
    );
    return;
  }
  if (b === 2 && !cue(c, 2, 'An experimental Engram lookup', 0)) {
    const context = cue(c, 2, 'A context copy', 0);
    const moved = context
      ? cue(c, 2, 'moves a slice of the sequence', 1.35)
      : cue(c, 2, 'moves an activation', 1.35);
    scene(
      g,
      context ? 'Context parallelism' : 'Pipeline parallelism',
      context ? 'Which part of the sequence moves?' : 'What does the next stage receive?',
    );
    board(g, 113, 333, 680, 400, context ? 'Context partition 0' : 'Pipeline stage 2');
    board(g, 1127, 333, 680, 400, context ? 'Context partition 1' : 'Pipeline stage 3');
    if (context) {
      text(g, 'Token positions', 173, 470, 34, C.white);
      for (let i = 0; i < 4; i++)
        chip(g, 178 + 135 * i, 532, 108, 85, String(i), i >= 2 ? C.sky : C.white);
    } else {
      chip(g, 218, 518, 471, 103, 'activation h', C.gold);
    }
    const start = [context ? 566 : 525, 568],
      finish = [1465, 568];
    path(
      g,
      [
        [795, 569],
        [1125, 569],
      ],
      C.line,
      7,
    );
    if (moved)
      row(
        g,
        ...linePoint([start, finish], moved),
        context ? '[2, 3]' : 'h',
        context ? C.sky : C.gold,
        204,
      );
    if (moved === 1)
      text(g, context ? 'copied positions' : 'input activation', 1465, 663, 34, C.white, 'center');
    note(
      g,
      context
        ? 'Only positions 2 and 3 are copied. The application defines the attention computation.'
        : 'The stage sends its activation. The application schedules the next stage.',
    );
    return;
  }
  const { replay, issued, flushed, arrival } = lookupState(c);
  scene(g, 'Experimental Engram', 'Which entries have reached the requester?');
  board(g, 112, 310, 820, 458, 'Local requester');
  board(g, 1170, 310, 636, 458, 'Remote data owners');
  text(g, 'Request', 182, 419, 31, C.white);
  text(g, 'Result cells', 709, 419, 31, C.white, 'center');
  peers.forEach((p, i) => {
    const y = 503 + i * 148;
    chip(g, 163, y - 36, 167, 72, 'idx ' + p.index, C.white);
    if (replay)
      text(g, issued ? 'submitted' : 'queued', 443, y, 32, issued ? C.pale : C.gold, 'center');
    rect(g, 615, y - 41, 201, 82, C.white, C.ink, 2, 7);
    path(
      g,
      [
        [824, y],
        [1342, y],
      ],
      C.line,
      4,
      [7, 8],
    );
    text(g, 'Peer ' + p.id, 1260, y - 43, 30, C.white, 'center');
    chip(g, 1361, y - 41, 360, 82, '[' + p.index + '] = ' + p.entry, C.sky);
    if (arrival)
      row(
        g,
        ...linePoint(
          [
            [1520, y],
            [716, y],
          ],
          arrival,
        ),
        p.entry,
        C.gold,
        118,
      );
  });
  if (flushed) text(g, 'flush recorded for each peer', 171, 731, 30, C.pale);
  note(
    g,
    arrival === 1
      ? 'Requester received index 2 → C and index 5 → F. Matching scales are local.'
      : flushed
        ? 'The requester recorded both flushes. The result cells are still empty.'
        : issued
          ? 'The requester submitted one final get for each used peer.'
          : replay
            ? 'Fresh lookup. Both final gets are queued on the requester.'
            : 'The requester holds the indices and scales. Each owner holds the selected entry.',
  );
}

const overlap = communicationBudget(15.2),
  standalone = communicationBudget(15.2, { preferOverlap: false });
export function sms(g, c) {
  const rounded = cue(c, 4, 'The overlap preference', 0),
    floor = cue(c, 4, 'Both choices', 0);
  scene(g, 'Historical V2 sizing', 'How many SMs remain for expert computation?');
  text(g, 'Raw estimate 15.2    × 1.25 = 19    →    round up to an even count', 127, 313, 39);
  const x = 194,
    w = 1510,
    device = overlap.deviceSMs;
  [
    [overlap, 'Prefer overlap', rounded],
    [standalone, 'Standalone floor', floor],
  ].forEach(([d, t, show], i) => {
    const y = 447 + i * 209;
    text(g, t, x, y - 45, 38);
    rect(g, x, y, w, 81, C.white, C.ink, 2);
    if (show) {
      rect(g, x, y, (w * d.sms) / device, 81, C.blue);
      mono(g, d.sms, x + (w * d.sms) / device / 2, y + 41, 36, C.white);
      mono(g, device - d.sms + ' left', x + w * 0.75, y + 41, 36, C.teal);
    }
  });
  note(g, '132 SM device in this example. Both minimums are capped at the device count.');
}

const target = '2.30.4',
  different = '2.30.5';
export function loaded(g, c) {
  const repair = cue(c, 4, 'Match the loaded library', 0.9);
  scene(g, 'Historical V2 startup', 'Do these NCCL versions satisfy the header contract?');
  [
    [285, 'Build headers', target],
    [1090, 'Loaded library', repair === 1 ? target : different],
  ].forEach(([x, n, v]) => {
    card(g, x, 363, 560, 312, C.white);
    text(g, n, x + 280, 424, 39, C.muted, 'center');
    mono(g, v, x + 280, 554, 73, C.ink);
  });
  mono(g, repair === 1 ? '=' : '≠', 974, 549, 72, repair === 1 ? C.teal : C.rust);
  note(
    g,
    repair === 1
      ? 'Worker runtime now matches the headers. Check Gin capability and the fabric next.'
      : 'Historical V2 with headers older than NCCL 2.31 requires an exact runtime match.',
  );
}
export function training(g, c) {
  const separate = cue(c, 3, 'A separate trainer', 0),
    colocated = cue(c, 3, 'Colocated rollout', 0);
  const compare = cue(c, 3, 'Compare the source rows', 0.6);
  scene(g, 'Post-training', 'Which inputs make the communication comparison fair?');
  const fields = [
    ['Policy checkpoint', 'same revision'],
    ['Prompts and router choices', 'same batch'],
    ['Activation precision', 'same scales and dtype'],
  ];
  fields.forEach(([label, v], i) => {
    const y = 338 + i * 124;
    text(g, label, 149, y + 35, 39);
    rect(g, 800, y - 9, 810, 88, C.pale, C.teal, 2, 8);
    mono(g, v, 1208, y + 36, 38);
  });
  if (separate)
    text(
      g,
      colocated
        ? 'Shared GPU   /   wait for prior readers before reuse'
        : 'Separate clusters   /   one group for rollout, one for training',
      155,
      763,
      41,
      C.blue,
    );
  note(
    g,
    compare
      ? 'Compare the numerical reference and full-layer timing for the controlled batch.'
      : 'Vary one communication setting. Keep the model, data and route fixed.',
  );
}
export function checkDeployment() {
  const tail = (...cues) =>
    lookupState({ beat: { beatIndex: 3 }, reveal: (p) => Number(cues.includes(p)) });
  const issue = 'issue one final unaggregated get',
    flush = 'record an asynchronous flush';
  assert.equal(tail('After completion').arrival, 0);
  assert.deepEqual(tail(issue, flush), { replay: true, issued: 1, flushed: 1, arrival: 0 });
  assert.equal(tail(issue, flush, 'After completion').arrival, 1);
  assert.deepEqual(reduced, [3, 7]);
  assert.throws(() => redundantGradient(original, extra, [0, 2], ranks));
  assert.deepEqual(
    peers.map((p) => String.fromCharCode(65 + p.index)),
    peers.map((p) => p.entry),
  );
  assert.deepEqual([overlap.margin, overlap.sms, standalone.sms], [19, 20, 64]);
  assert.deepEqual(
    table.map((r) => [r.sms, r.rate]),
    [
      [24, 643],
      [64, 726],
    ],
  );
}
