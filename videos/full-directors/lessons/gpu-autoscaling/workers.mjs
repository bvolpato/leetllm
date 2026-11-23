import {
  P,
  frame,
  label,
  rect,
  line,
  dot,
  faceplate,
  footer,
  mono,
  center,
  ruler,
  phase,
} from './art.mjs';
import { admission, adapter, demand, quiet, streams, shutdown, drainActions } from './examples.mjs';

function statusLight(c, x, y, on, text) {
  dot(c, x, y, 14, on ? P.pale : P.gold);
  label(c, text, x + 33, y, 32, P.light);
}
export function entry(c, k) {
  if (k.beat.beatIndex >= 4) return tenant(c, k);
  const steps = [
    phase(k, 1, 'Finish loading'),
    phase(k, 1, 'When that pass succeeds'),
    phase(k, 2, 'Admit C'),
    phase(k, 2, 'then D'),
    phase(k, 3, 'The duplicate gets a conflict'),
    phase(k, 3, 'gets an overload response'),
  ];
  const stage = steps.reduce((s, n) => s + Number(n > 0), 0),
    state = admission(stage);
  frame(
    c,
    'Engine admission   /   Two-slot worker',
    'Can this worker take the request?',
    'Model server   /   GPU 01',
  );
  faceplate(c, 100, 311, 905, 496);
  statusLight(c, 166, 380, state.loaded, 'Weights ' + (state.loaded ? 'loaded' : 'loading'));
  statusLight(c, 166, 445, state.warm, 'Warmup ' + (state.warm ? 'passed' : 'pending'));
  statusLight(c, 166, 510, true, 'Engine healthy');
  label(c, 'LOCAL SLOTS', 149, 601, 25, P.pale, mono);
  for (let i = 0; i < 2; i++) {
    const id = state.active[i];
    rect(c, 149 + 398 * i, 637, 370, 105, id ? P.pale : P.metal, 8);
    label(c, id ? 'Owner  ' + id : 'Empty', 333 + i * 398, 689, 42, id ? P.ink : P.white, center);
  }
  label(c, 'Worker response', 1107, 351, 43, P.ink, { font: 'Serif' });
  const labels = { 503: 'unavailable', 409: 'duplicate', 429: 'full', 200: 'admitted' };
  for (const [i, [id, code]] of state.log.entries()) {
    const y = 423 + i * 91;
    line(c, 1107, y + 41, 1784, y + 41, P.grid);
    label(c, id, 1110, y, 38, P.ink, mono);
    label(c, code, 1264, y, 38, code === 200 ? P.run : P.fail, mono);
    label(c, labels[code], 1396, y, 36);
  }
  if (!state.log.length) label(c, 'Ready for new arrivals', 1107, 441, 35, P.run);
  footer(
    c,
    stage >= 6
      ? 'C and D keep streaming. The overload response preserves both owners.'
      : stage >= 4
        ? 'C and D occupy both slots. Watch which check runs first.'
        : state.ready
          ? 'Loaded, warmed and healthy. The engine can admit compatible work.'
          : 'The router waits for the engine to pass readiness.',
  );
}
function tenant(c, k) {
  const selected = phase(k, 4, 'That combination selects');
  const revoked = phase(k, 4, 'Now revoke her membership');
  const decision = phase(k, 5, 'The verified identity');
  const state = adapter(!revoked);
  frame(
    c,
    'Engine admission   /   Tenant adapter',
    'Which adapter may Cora use?',
    'Loaded base   /   v7',
  );
  const x = 135,
    ys = [360, 482, 604];
  const entries = [
    ['Authenticated principal', state.principal, true],
    ['Current tenant C membership', state.member ? 'Valid' : 'Revoked', state.member],
    ['Approved tenant C adapter', 'Compatible with v7', true],
  ];
  entries.forEach(([name, value, ok], i) => {
    rect(c, x, ys[i], 967, 99, ok ? P.quiet : P.blush, 7);
    dot(c, x + 48, ys[i] + 50, 14, ok ? P.run : P.fail);
    label(c, name, x + 88, ys[i] + 49, 36);
    label(c, value, x + 925, ys[i] + 49, 30, ok ? P.run : P.fail, { align: 'right' });
  });
  faceplate(c, 1189, 360, 586, 343);
  label(c, 'ADAPTER SELECTION', 1241, 417, 27, P.pale, mono);
  const output = decision
    ? 'Denied'
    : revoked
      ? 'Checking…'
      : selected
        ? state.selected
        : 'Checking…';
  label(c, output, 1241, 523, 59, P.white, { font: 'Serif' });
  label(
    c,
    decision
      ? 'No adapter selected'
      : revoked
        ? 'Caller header: tenant B'
        : 'Tenant-scoped request',
    1241,
    624,
    32,
    P.light,
  );
  footer(
    c,
    decision
      ? 'A compatible artifact cannot grant revoked membership.'
      : revoked
        ? 'Cora is still authenticated. Can a caller-supplied header grant tenant B access?'
        : 'Identity, membership and artifact compatibility each have a separate check.',
  );
}

function blade(c, x, y, index, ready, caption) {
  rect(c, x, y, 133, 148, ready ? P.pale : P.gold, 9, ready ? P.run : P.wait, 3);
  rect(c, x + 11, y + 13, 112, 36, ready ? P.run : P.wait, 4);
  label(c, 'W' + String(index + 1).padStart(2, '0'), x + 66, y + 30, 25, P.white, {
    font: 'Mono',
    align: 'center',
  });
  if (caption) {
    const words = caption.split(' ');
    label(c, words[0], x + 66, y + 78, 27, P.ink, center);
    label(c, words[1], x + 66, y + 111, 27, P.ink, center);
    return;
  }
  for (let i = 0; i < 5; i++)
    line(c, x + 22, y + 65 + 12 * i, x + 93, y + 65 + 12 * i, ready ? P.run : P.wait, 3);
  dot(c, x + 109, y + 118, 6, ready ? P.run : P.wait);
}
export function controller(c, k) {
  if (k.beat.beatIndex >= 5) return quietWindow(c, k);
  const ordered = phase(k, 1, 'Ten in total'),
    second = phase(k, 2, 'Poll again'),
    settled = phase(k, 3, 'Keep ten desired'),
    gap = phase(k, 4, 'Remove the demand sample');
  const stage = gap ? 4 : settled ? 3 : second ? 2 : ordered ? 1 : 0,
    s = demand(stage);
  frame(
    c,
    'Replica controller   /   Absolute order',
    gap ? 'What does a missing poll tell us?' : 'How many workers belong in this order?',
    gap ? 'Sample unavailable' : second ? 'Fresh poll 02' : 'Fresh poll 01',
  );
  label(
    c,
    s.sample
      ? s.sample.waiting + ' waiting + ' + s.sample.running + ' running'
      : 'Waiting  ?     Running  ?',
    105,
    324,
    48,
    P.ink,
    { font: 'Serif' },
  );
  label(c, s.slots + ' slots per worker   /   target cap 20', 1815, 323, 30, P.sub, { align: 'right' });
  line(c, 103, 372, 1817, 372);
  const readyY = 632,
    pendingY = 440;
  label(c, 'Ready', 100, readyY + 62, 34, P.run, { bold: true });
  label(c, 'Pending', 100, pendingY + 62, 34, P.wait, { bold: true });
  line(c, 266, pendingY + 148, 1810, pendingY + 148, P.grid, 2, [6, 8]);
  for (let i = 0; i < s.desired; i++) {
    const ready = i < s.ready;
    blade(c, 270 + i * 153, ready ? readyY : pendingY, i, ready, ready ? undefined : s.pendingStates[i - s.ready]);
  }
  label(c, 'SLOTS ON READY WORKERS', 927, readyY + 41, 25, P.sub, mono);
  label(c, s.sample ? s.sample.running + ' busy   /   ' + s.open + ' free' : 'Occupancy unknown',
    927, readyY + 103, 46, P.ink, { font: 'Serif' });
  label(
    c,
    s.ready + ' ready    +    ' + s.pending + ' pending    =    ' + s.desired + ' desired',
    966,
    828,
    39,
    P.ink,
    center,
  );
  footer(
    c,
    gap
      ? 'Hold 10 and alert. Missing or stale demand cannot authorize a downscale.'
      : settled
        ? 'Poll 02   ·   target ' + s.target + '    /    change +' + s.delta
        : second
          ? 'Poll 02 sees the same demand and the six workers already requested.'
          : ordered
            ? 'Poll 01   ·   ceiling of 50 ÷ 5 = ' +
              s.target +
              ' desired    /    change +' +
              s.delta
            : 'Four workers are full. What absolute target covers the waiting and running work?',
  );
}
function quietWindow(c, k) {
  const end = phase(k, 6, 'Select one worker');
  const checked = phase(k, 6, 'Keep seven');
  const now = end ? 320 : 319,
    s = quiet(now);
  frame(
    c,
    'Replica controller   /   Scale down',
    'Has the quiet window elapsed?',
    'Seven ready at the start',
  );
  label(
    c,
    'Fresh low demand since 20 s  ·  all requested capacity had arrived',
    103,
    332,
    37,
    P.sub,
  );
  const x = (t) => 221 + 4.53 * (t - 20);
  line(c, x(20), 469, x(320), 469, P.grid, 18);
  line(c, x(20), 469, x(now), 469, P.run, 13);
  dot(c, x(now), 469, 17, P.ink);
  label(c, '20 s', x(20), 524, 33, P.ink, center);
  label(c, 'Poll at ' + now + ' s', x(now), 414, 37, P.ink, center);
  label(c, 'Boundary 320 s', x(320), 525, 32, P.sub, center);
  for (let i = 0; i < 7; i++) blade(c, 263 + i * 204, 609, i, i < s.desired);
  if (end) label(c, 'Draining', 263 + 6 * 204 + 66, 794, 28, P.wait, center);
  footer(
    c,
    end
      ? '300 s elapsed   ·   select one for drain   ·   6 desired'
      : checked
        ? '299 s elapsed   ·   keep 7 desired'
        : 'Wait for 300 s of uninterrupted low demand. Does this poll qualify?',
  );
}

export function drain(c, k) {
  if (k.beat.beatIndex >= 4) return deadline(c, k);
  const closed = phase(k, 1, 'Close local admission') > 0;
  const rejected = phase(k, 1, 'gets service unavailable');
  const cCount =
    1 +
    Math.floor(phase(k, 0, 'Both callers', 1.8)) +
    Math.floor(phase(k, 1, 'Close local admission', 1.4)) +
    Math.floor(phase(k, 1, 'Both original replies', 2.2)) +
    Math.floor(phase(k, 2, "Release C's slot"));
  const dCount =
    1 +
    Math.floor(phase(k, 0, 'Both callers', 2.4)) +
    Math.floor(phase(k, 1, 'Close local admission', 1.6)) +
    Math.floor(2 * phase(k, 1, 'Both original replies', 2.5)) +
    Math.floor(phase(k, 2, 'C finishes', 1.4)) +
    Math.floor(3 * phase(k, 2, 'D still owns', 3)) +
    Math.floor(phase(k, 3, "Release D's slot"));
  const s = streams(closed, cCount, dCount);
  frame(
    c,
    'Worker retirement   /   Stream ownership',
    'Which replies still need this worker?',
    s.closed ? 'Readiness withdrawn' : 'Readiness passed',
  );
  faceplate(c, 99, 321, 445, 474);
  label(c, 'LOCAL INTAKE', 143, 381, 30, P.pale, mono);
  rect(c, 148, 448, 347, 120, P.metal, 8);
  if (closed) {
    for (let i = 0; i < 6; i++) rect(c, 154, 454 + 18 * i, 335, 14, P.gold, 3);
  } else {
    line(c, 188, 510, 445, 510, P.pale, 7);
    line(c, 417, 486, 447, 510, P.pale, 7);
    line(c, 417, 534, 447, 510, P.pale, 7);
  }
  label(c, closed ? 'Closed' : 'Open', 319, 630, 54, P.white, { font: 'Serif', align: 'center' });
  if (rejected)
    label(c, 'F → HTTP ' + s.newStatus, 319, 719, 29, P.gold, { font: 'Mono', align: 'center' });
  else if (!closed)
    label(c, s.owners.length + ' of 2 slots busy', 319, 719, 29, P.pale, center);
  for (const [i, r] of s.replies.entries()) {
    const y = 321 + i * 246;
    rect(c, 610, y, 1205, 222, P.light, 12, P.grid);
    label(
      c,
      'Slot ' + (i + 1) + '   /   ' + (r.done ? 'Released' : 'Owned by ' + r.id),
      652,
      y + 46,
      29,
      r.done ? P.sub : P.run,
      mono,
    );
    label(c, r.text, 652, y + 123, 42, P.ink, { font: 'Serif' });
    if (!r.done) rect(c, 659 + c.measureText(r.text).width, y + 101, 5, 42, P.run);
    label(c, r.done ? 'Reply complete' : 'Streaming', 652, y + 184, 26, r.done ? P.sub : P.run);
  }
  footer(
    c,
    s.safe
      ? 'Both replies reached their own end. The worker can terminate.'
      : s.owners.length +
          ' active   ·   ' +
          s.owners.join(' and ') +
          ' still ' +
          (s.owners.length === 1 ? 'owns a slot.' : 'own their slots.'),
  );
}
function deadline(c, k) {
  const decided = phase(k, 5, 'The third runs');
  frame(
    c,
    'Spot drain   /   Remaining work',
    'Which replies can finish by the cleanup boundary?',
    '70 s to earliest shutdown',
  );
  const x = (t) => 378 + t * 19;
  rect(c, x(shutdown.budget), 341, 19 * shutdown.cleanup, 437, P.blush, 4);
  label(c, 'Cleanup', x(62.5), 376, 33, P.fail, center);
  line(c, x(shutdown.budget), 347, x(shutdown.budget), 785, P.fail, 4, [7, 7]);
  shutdown.estimates.forEach((t, i) => {
    const y = 454 + 113 * i;
    label(c, 'Reply ' + (i + 1), 111, y + 23, 34);
    rect(c, x(0), y, 19 * t, 45, decided ? (t <= shutdown.budget ? P.run : P.fail) : P.metal, 5);
    label(c, t + ' s', x(t) - 14, y + 22, 30, P.white, { align: 'right' });
    if (decided) label(c, drainActions[i], x(0), y + 74, 28, t <= shutdown.budget ? P.run : P.fail);
  });
  ruler(c, x(0), x(70), 802, 0, 70, [0, 30, 55, 70], (t) => t + ' s');
  footer(
    c,
    decided
      ? '30 s and 55 s fit. The 56 s stream needs an explicit interruption.'
      : 'Keep every reply that fits, including a finish at 55 s. Reply 3 has streamed output.',
  );
}
