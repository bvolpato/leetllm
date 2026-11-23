import { cueClock } from '../cued-trace.mjs';

const failureTimes = [101, 103];
const cooldownEnd = failureTimes[1] + 10;
function token(ctx, api, x, y, name, color) {
  api.circle(ctx, x, y, 32, color);
  api.text(ctx, name, x, y + 11, 30, api.C.bg, 'center');
}

function dock(ctx, api, y, color) {
  api.line(ctx, 1305, y - 63, 1485, y - 63, color, 3);
  api.line(ctx, 1485, y - 63, 1485, y + 63, color, 3);
  api.line(ctx, 1305, y + 63, 1485, y + 63, color, 3);
}

function routePosition(points, progress) {
  const lengths = points
    .slice(1)
    .map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let distance = progress * lengths.reduce((sum, length) => sum + length, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const u = Math.min(1, distance / lengths[i]);
      const [x, y] = points[i];
      return [x + u * (points[i + 1][0] - x), y + u * (points[i + 1][1] - y)];
    }
    distance -= lengths[i];
  }
}

// Keep the line outside each token even when the scene or its focus target fades.
function wire(ctx, api, from, to, requests, width = 4) {
  const horizontal = from[1] === to[1];
  const axis = horizontal ? 0 : 1;
  const cross = 1 - axis;
  const start = Math.min(from[axis], to[axis]),
    end = Math.max(from[axis], to[axis]);
  const draw = (a, b) =>
    horizontal
      ? api.line(ctx, a, from[1], b, from[1], api.C.muted, width)
      : api.line(ctx, from[0], a, from[0], b, api.C.muted, width);
  let cursor = start;
  const centers = requests
    .filter((pt) => pt && Math.abs(pt[cross] - from[cross]) < 35)
    .map((pt) => pt[axis])
    .sort((a, b) => a - b);
  for (const center of centers) {
    if (center + 35 <= cursor || center - 35 >= end) continue;
    if (center - 35 > cursor) draw(cursor, center - 35);
    cursor = Math.min(end, center + 35);
  }
  if (cursor < end) draw(cursor, end);
}

function failures(ctx, api, clock) {
  const { C } = api;
  const x = (t) => 427 + (t - 100) * 96;
  api.text(ctx, 'Primary requests', 100, 392, 32, C.ink);
  api.text(ctx, 'Failure receipts', 100, 567, 32, C.ink);
  api.text(ctx, 'Fallback', 100, 739, 32, C.ink);
  api.focus.target('failure-marks', () => {
    const events = [
      { time: 100, y: 382, id: '1', color: C.blue },
      { time: failureTimes[0], y: 557, id: '1', color: C.pink, cue: 'gate-first' },
      { time: 102, y: 382, id: '2', color: C.blue, cue: 'gate-request-two' },
      { time: failureTimes[1], y: 557, id: '2', color: C.pink, cue: 'gate-second' },
      { time: 104, y: 729, id: '3', color: C.cyan, cue: 'gate-fallback' },
    ].filter(({ cue }) => !cue || clock.after(cue));
    const centers = events.map(({ time, y }) => [x(time), y]);
    for (const y of [382, 557, 729]) wire(ctx, api, [x(100), y], [x(cooldownEnd), y], centers, 2);
    for (const { time, y, id, color } of events) token(ctx, api, x(time), y, id, color);
    for (const t of [100, 101, 102, 103, 104, 108, 113])
      api.text(ctx, String(t), x(t), 846, 29, C.muted, 'center');
    if (clock.started('gate-cooldown')) {
      api.line(ctx, x(103), 644, x(103 + 10 * clock.p('gate-cooldown')), 644, C.yellow, 9);
      api.text(ctx, '10 s cooldown', x(108), 619, 31, C.yellow, 'center');
    }
  });
  api.text(ctx, 'Elapsed time in seconds', 100, 965, 31, C.muted);
}

function workerPermit(ctx, api, clock) {
  const { C } = api;
  const newGeneration = clock.started('old-reply');
  const grant = clock.after('atomic-grant');
  api.text(ctx, 'Two router workers  /  one primary slot', 150, 275, 45, C.ink);
  api.focus.target('waiting-request', () => {
    api.text(ctx, newGeneration ? 'Delayed reply' : 'Worker A', 160, 440, 37, C.ink);
    api.text(ctx, newGeneration ? 'Generation 7' : 'Acquire', 160, 518, 45, C.cyan);
    api.text(
      ctx,
      newGeneration ? 'Compare generations before updating' : 'Worker B',
      160,
      695,
      33,
      C.ink,
    );
    if (!newGeneration)
      api.text(
        ctx,
        grant ? 'Slot already held' : 'Acquire',
        160,
        778,
        40,
        grant ? C.yellow : C.cyan,
      );
  });
  api.focus.target('primary-permit', () => {
    api.text(ctx, 'Primary recovery slot', 1000, 393, 39, C.ink);
    api.rect(ctx, 995, 441, 630, 147, C.panel, C.blue, 12);
    api.text(
      ctx,
      newGeneration ? 'Held by generation 8' : grant ? 'Held by A  /  generation 7' : 'Empty',
      1310,
      529,
      41,
      C.ink,
      'center',
    );
    if (clock.after('lease-expiry'))
      api.text(ctx, 'Permit expires unless renewed', 1000, 697, 34, C.yellow);
  });
  if (newGeneration)
    api.text(ctx, '7 ≠ 8     ·     Leave the current breaker state alone', 160, 949, 43, C.yellow);
}

export function drawBreakerClock(ctx, scene, state, api) {
  const { C } = api;
  const clock = cueClock(scene, state);
  if (state.beat === 0) return failures(ctx, api, clock);
  if (state.beat === 4) return workerPermit(ctx, api, clock);
  const replay = state.beat === 3;
  if (replay && clock.started('regional-deployment')) {
    api.focus.target('regions', () => {
      for (const [x, region] of [
        [175, 'Primary region'],
        [1050, 'Fallback region'],
      ]) {
        api.rect(ctx, x, 365, 700, 455, C.panel, C.muted);
        api.text(ctx, region, x + 50, 463, 50, C.ink);
      }
      for (const [x, name] of [
        [235, 'Zone A'],
        [550, 'Zone B'],
      ]) {
        api.rect(ctx, x, 558, 255, 150, C.bg, C.blue);
        api.text(ctx, name, x + 128, 650, 39, C.blue, 'center');
      }
      api.rect(ctx, 1110, 558, 580, 150, C.bg, C.green);
      api.text(ctx, 'Supported deployment', 1400, 650, 39, C.green, 'center');
    });
    return;
  }
  const failed = !replay && clock.after('probe-fails');
  const newProbe = !replay && clock.started('next-probe');
  const recovered = !replay && clock.after('probe-success');
  const normal = recovered && clock.started('normal-arrival');
  const rejectedRoute = replay && clock.after('retention-change');
  const time = replay
    ? 114
    : normal
      ? 127
      : newProbe
        ? 126
        : clock.started('gate-116')
          ? 116
          : failed
            ? 115
            : 114;
  const occupied = replay || (clock.started('permit-a') && !failed) || (newProbe && !recovered);
  const primaryPath = [
    [480, 620],
    [825, 620],
    [825, 438],
    [1395, 438],
  ];
  const fallbackPath = [
    [480, 620],
    [825, 620],
    [825, 804],
    [1395, 804],
  ];
  const sendB = state.beat === 2 && clock.after('route-b');
  const showB = replay || (clock.started('arrival-b') && !sendB);
  const probe =
    occupied &&
    routePosition(primaryPath, replay ? 1 : newProbe ? clock.p('next-probe') : clock.p('permit-a'));
  const regular = normal && routePosition(primaryPath, clock.p('normal-arrival'));
  const diverted = sendB && !failed && routePosition(fallbackPath, clock.p('fallback-travel'));
  const nextDiverted =
    !replay &&
    failed &&
    clock.started('gate-116') &&
    !newProbe &&
    routePosition(fallbackPath, clock.p('gate-116'));
  const positions = [probe, regular, diverted, nextDiverted, showB && fallbackPath[0]];
  api.text(ctx, time + ' s', 155, 280, 65, C.ink);
  api.text(ctx, 'Primary probe capacity: 1', 1750, 274, 34, C.muted, 'right');
  wire(ctx, api, primaryPath[0], primaryPath[1], positions);
  for (const path of [primaryPath, fallbackPath]) {
    wire(ctx, api, path[1], path[2], positions);
    wire(ctx, api, path[2], path[3], positions);
  }
  api.focus.target('primary-permit', () => {
    api.text(
      ctx,
      recovered ? 'Primary open to regular traffic' : 'Primary recovery slot',
      1395,
      334,
      38,
      C.ink,
      'center',
    );
    dock(ctx, api, 438, C.blue);
    if (probe) token(ctx, api, ...probe, newProbe ? 'C' : 'A', C.cyan);
    if (regular) token(ctx, api, ...regular, 'D', C.blue);
    const label = normal
      ? 'Closed  /  normal admission'
      : recovered
        ? 'Success  /  failures reset to 0'
        : newProbe
          ? 'New recovery probe'
          : failed
            ? 'Open  /  cooldown restarts'
            : replay || clock.after('permit-a')
              ? 'Half-open  /  A pending'
              : 'Ready for one probe';
    api.text(ctx, label, 1395, 573, 31, C.blue, 'center');
  });
  api.focus.target('waiting-request', () => {
    api.text(ctx, 'Arrivals', 160, 633, 40, C.ink);
    if (showB) token(ctx, api, 480, 620, 'B', C.yellow);
    if (replay && clock.after('account-retention'))
      api.text(ctx, 'Keep at most 1 day', 480, 520, 43, C.yellow, 'center');
    if (replay && clock.after('hold-at-router'))
      api.text(ctx, 'Routing failure', 480, 708, 34, C.pink, 'center');
  });
  api.focus.target('fallback-route', () => {
    api.text(ctx, 'Fallback', 1395, 711, 38, C.ink, 'center');
    const fallbackColor = rejectedRoute ? C.pink : replay ? C.muted : C.green;
    dock(ctx, api, 804, fallbackColor);
    if (diverted) token(ctx, api, ...diverted, 'B', C.yellow);
    if (nextDiverted) token(ctx, api, ...nextDiverted, 'R', C.yellow);
    api.text(
      ctx,
      rejectedRoute
        ? 'Keeps requests for 7 days'
        : replay
          ? 'Checking retention'
          : 'Approved  /  capacity available',
      1395,
      930,
      rejectedRoute ? 43 : 31,
      fallbackColor,
      'center',
    );
  });
  if (state.beat === 1 && clock.after('arrival-b'))
    api.text(ctx, 'Where can B go?', 155, 973, 42, C.ink);
}

export default {
  id: 'breaker-clock',
  draw: drawBreakerClock,
  cues: [
    'gate-first',
    'gate-request-two',
    'gate-second',
    'gate-fallback',
    'gate-cooldown',
    'permit-a',
    'arrival-b',
    'route-b',
    'fallback-travel',
    'probe-fails',
    'gate-116',
    'next-probe',
    'probe-success',
    'normal-arrival',
    'account-retention',
    'retention-change',
    'hold-at-router',
    'regional-deployment',
    'atomic-grant',
    'lease-expiry',
    'old-reply',
  ],
};
