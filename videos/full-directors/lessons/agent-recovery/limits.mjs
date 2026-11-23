import {
  C,
  arrow,
  center,
  dot,
  footer,
  heading,
  lamp,
  line,
  mix,
  mono,
  packet,
  plate,
  rr,
  slip,
  tag,
  txt,
} from './art.mjs';
import {
  demand,
  exercise,
  inProbe,
  inputs,
  life,
  longHint,
  pages,
  probe,
  race,
  readSamples,
  sum,
} from './examples.mjs';

function rule(g, x, y, width, range, step, unit = 's') {
  const px = (n) => x + (width * n) / range;
  line(g, x, y, px(range), y, C.dim, 1.5);
  const ticks = Math.round(range / step);
  for (let i = 0; i <= ticks; i++) {
    const n = i * step;
    line(g, px(n), y - 4, px(n), y + 5, C.dim, 1.2);
    mono(g, Number(n.toFixed(2)).toString(), px(n), y + 23, 13, C.dim, { align: 'center' });
  }
  mono(g, unit, px(range) + 16, y + 23, 13, C.dim);
  return px;
}
export function retryTiming(g, { b, cue }) {
  heading(
    g,
    'Read retry   /   Delay selection',
    b === 1
      ? 'Where can the next read land?'
      : b === 2
        ? 'When do the clients bunch up?'
        : 'Does the required wait fit?',
    true,
  );
  plate(g, 37, 136, 884, 265);
  if (b === 1) {
    const x = 209,
      scale = 150;
    const draw = cue(1, 'Watch where each sampled delay lands', 1.1);
    mono(g, 'FULL JITTER', 60, 168, 14, C.brass);
    readSamples.forEach(({ cap, jitter }, i) => {
      const y = 212 + i * 52;
      mono(g, 'retry ' + (i + 1), 65, y + 6, 16, C.ivory);
      line(g, x, y, x + scale * cap, y, C.track, 17);
      for (const t of [0, cap]) line(g, x + t * scale, y - 14, x + t * scale, y + 13, C.blue, 2);
      if (draw) {
        g.save();
        g.globalAlpha = draw;
        dot(g, x + jitter * scale, y, 7, C.brass);
        mono(g, jitter + ' s', x + jitter * scale, y - 12, 13, C.brass, { align: 'center' });
        g.restore();
      }
      mono(g, cap + ' s', x + cap * scale + 12, y + 6, 14, C.ivory);
    });
    footer(g, 'Each sample lies between zero and its capped exponential window.', true);
  } else if (b === 2) {
    const spread = cue(2, 'Add bounded jitter after the floor', 0.8);
    const floor = 5,
      draws = [0.02, 0.06, 0.11, 0.19],
      origin = 346,
      scale = 2050;
    mono(g, 'DETAIL AROUND THE 5 s FLOOR', 61, 168, 14, C.brass);
    draws.forEach((j, i) => {
      const y = 204 + 39 * i,
        end = origin + scale * j;
      mono(g, 'Client ' + (i + 1), 65, y + 5, 16, C.ivory);
      line(g, origin - 90, y, origin + scale * 0.22, y, C.track, 2);
      dot(g, origin, y, 5, C.teal);
      if (spread > 0) {
        g.save();
        g.globalAlpha = spread;
        line(g, origin, y, end, y, C.brass, 3);
        dot(g, end, y, 6, C.brass);
        mono(g, (floor + j).toFixed(2) + ' s', 812, y + 5, 15, C.ivory);
        g.restore();
      }
    });
    line(g, origin, 183, origin, 335, C.teal, 2, [4, 4]);
    for (const delta of [0, 0.1, 0.2])
      mono(g, (floor + delta).toFixed(1) + ' s', origin + scale * delta, 366, 14, C.dim, {
        align: 'center',
      });
    footer(
      g,
      spread > 0
        ? 'Adding each sampled offset places its client beyond the required minimum.'
        : 'Taking the larger of floor and draw puts all four clients at five seconds.',
      true,
    );
  } else {
    const px = rule(g, 111, 316, 702, 20, 5),
      stop = cue(3, 'Stop before another send');
    mono(g, 'TIME FROM NOW', 63, 168, 14, C.brass);
    rr(g, 111, 229, px(longHint.floor / 1000) - 111, 38, 5, C.blue);
    mono(g, '20 s minimum', 289, 254, 18, C.deep);
    const end = px(longHint.left / 1000);
    line(g, end, 204, end, 315, C.red, 3);
    mono(g, '3 s left', end, 194, 16, C.red, { align: 'center' });
    if (stop && !longHint.fits) tag(g, 'Retry unsent', 642, 352, 184, C.red);
    footer(
      g,
      stop
        ? 'The whole task expires before this retry could start.'
        : 'The provider’s minimum and the caller’s deadline share one clock.',
      true,
    );
  }
}

export function progress(g, { b, cue }) {
  const n =
    cue(1, 'first read brings page four') + cue(2, 'Page four again') + cue(2, 'comes page five');
  const p = pages[n - 1],
    blocked = cue(2, 'hard cap blocks');
  heading(
    g,
    'Log reader   /   Three-call limit',
    b === 3 ? 'Which boundary interrupted the run?' : 'Did another call buy new evidence?',
  );
  if (b === 3) {
    const routes = [
      ['Bad field', 'Recheck proposal', cue(3, 'Repair a bad field')],
      ['Transient read', 'Bounded retry', cue(3, 'transient read')],
      ['Dispatched write', 'Look up operation', cue(3, 'dispatched write')],
    ];
    plate(g, 39, 143, 880, 243);
    routes.forEach(([src, dst, show], i) => {
      const y = 195 + i * 69;
      mono(g, src, 69, y, 21, C.ivory);
      line(g, 321, y - 6, 591, y - 6, C.track, 3);
      if (show) {
        arrow(g, 321, y - 6, 591, y - 6, C.teal, 3);
        txt(g, dst, 622, y, 22, C.teal, { font: 'Serif' });
      }
    });
    footer(g, 'A new proposal, a repeated read and an uncertain write need different recovery.');
    return;
  }
  plate(g, 38, 143, 884, 235);
  mono(g, 'LOG PAGE INTAKE', 61, 174, 15, C.brass);
  for (let i = 0; i < 3; i++) {
    const x = 64 + 217 * i,
      y = 205,
      state = pages[i];
    rr(g, x, y, 195, 116, 7, '#0c222a');
    if (i < n) {
      slip(
        g,
        x + 6,
        y + 6,
        183,
        105,
        'Call ' + state.call,
        [state.page, state.gainedEvidence ? 'new evidence' : 'seen already'],
        state.gainedEvidence ? C.pine : C.brick,
      );
    } else center(g, 'unused', x + 97, y + 66, 19, C.dim, { font: 'Serif' });
  }
  mono(g, 'CALLS LEFT', 752, 210, 13, C.dim);
  txt(g, String(p?.remaining ?? 3), 755, 259, 41, C.ivory, { font: 'Serif' });
  mono(g, 'STALLS / 2', 752, 288, 13, C.dim);
  txt(g, String(p?.noProgress ?? 0), 755, 337, 37, C.brass, { font: 'Serif' });
  if (blocked) tag(g, 'Call 4 blocked', 64, 333, 212, C.red);
  footer(
    g,
    blocked
      ? 'Page 5 resets stalls to zero. All three calls have already been spent.'
      : 'Count each admitted read once. Compare page identifiers to detect progress.',
  );
}

function contact(g, x, y, w, state) {
  const left = x + w * 0.33,
    right = x + w * 0.69;
  line(g, x, y, left, y, C.dim, 5);
  line(g, right, y, x + w, y, C.dim, 5);
  const up = state === 'open' ? 57 : state === 'half-open' ? 29 : 0;
  line(g, left, y, right - 3, y - up, '#0b1c20', 13);
  line(
    g,
    left,
    y,
    right - 3,
    y - up,
    state === 'closed' ? C.teal : state === 'open' ? C.red : C.brass,
    8,
  );
  for (const cx of [left, right]) {
    dot(g, cx, y, 10, '#9b8969');
    dot(g, cx, y, 5, C.ink);
  }
}
export function racePicture(g, { cue }, recollection = false) {
  const open = recollection || cue(3, 'newer failure opens'),
    success = recollection || cue(3, 'A succeeds');
  const travel = recollection ? 1 : cue(4, 'Return A', 1.15),
    kept = recollection || cue(4, 'circuit stays open');
  const generation = open ? race.currentGeneration : race.olderGeneration;
  plate(g, 38, 135, 884, 261);
  mono(g, 'NEW CALLS', 70, 176, 14, C.dim);
  contact(g, 223, 205, 371, open ? race.stateAfterNewFailure : 'closed');
  tag(
    g,
    (open ? 'OPEN' : 'CLOSED') + '  /  GEN ' + generation,
    629,
    179,
    249,
    open ? C.red : C.teal,
  );
  line(g, 64, 257, 890, 257, C.track, 1);
  mono(g, 'CALL A', 65, 290, 14, C.dim);
  mono(g, 'caller', 67, 350, 17, C.ivory);
  line(g, 177, 335, 781, 335, C.dim, 3);
  dot(g, 781, 335, 7, C.blue);
  if (success)
    packet(g, mix(765, 201, travel), 335, 'OK · gen ' + race.olderGeneration, 125, C.teal);
  else
    mono(g, 'in flight · gen ' + race.olderGeneration, 460, 326, 16, C.blue, { align: 'center' });
  if (race.oldResultReturned && travel === 1) mono(g, 'Received', 68, 374, 14, C.teal);
  footer(
    g,
    kept
      ? 'Caller A owns its success. Generation 4 still rejects new calls.'
      : open
        ? 'Read the generation on the reply and the generation on the contact.'
        : 'Call A started before the breaker changed generation.',
    true,
  );
}
export function breaker(g, scene) {
  const { b, cue } = scene;
  heading(
    g,
    'Status service   /   Circuit breaker',
    b < 3 ? 'Can another request pass this contact?' : 'Where does the old success belong?',
    true,
  );
  if (b >= 3) {
    racePicture(g, scene);
    return;
  }
  const strikes = cue(1, 'first qualifying failure') + cue(1, 'second failure');
  const half = cue(2, 'becomes half-open'),
    held = cue(2, 'probe takes the slot'),
    healthy = cue(2, 'healthy probe closes'),
    failed = cue(2, 'qualifying failure instead reopens');
  const state = failed
    ? probe('failure').state
    : healthy
      ? probe('success').state
      : half
        ? life.halfOpen.state
        : strikes === 2
          ? life.opened.state
          : 'closed';
  plate(g, 38, 136, 884, 259);
  mono(g, 'CALLER', 69, 185, 16, C.ivory);
  mono(g, 'DEPENDENCY', 739, 185, 16, C.ivory);
  contact(g, 106, 248, 747, state);
  center(
    g,
    state.toUpperCase(),
    478,
    178,
    20,
    state === 'closed' ? C.teal : state === 'open' ? C.red : C.brass,
    { font: 'Mono', w: 600 },
  );
  if (b === 1) {
    mono(g, 'Qualifying failures', 69, 331, 17, C.dim);
    [0, 1].forEach((i) => lamp(g, 284 + i * 31, 324, strikes > i, C.red));
    mono(g, strikes + ' of 2', 373, 331, 17, C.ivory);
  } else {
    const status = failed
      ? 'Failed probe · cooldown'
      : healthy
        ? 'Healthy probe · normal traffic'
        : held
          ? 'One probe in flight'
          : half
            ? 'One slot available'
            : 'Cooling down';
    tag(
      g,
      status,
      62,
      310,
      340,
      state === 'open' ? C.red : state === 'half-open' ? C.brass : C.teal,
    );
    if (failed) mono(g, 'Alternative probe outcome', 498, 331, 16, C.dim);
  }
  footer(
    g,
    b === 1
      ? strikes === 2
        ? 'During cooldown, new calls stop at the open contact.'
        : 'Only qualifying dependency failures count toward the threshold.'
      : 'A probe tests one dependency under this breaker’s policy.',
    true,
  );
}

export function probePolicy(g, scene) {
  const { b, cue } = scene;
  heading(
    g,
    'Probe ownership   /   Tenant B',
    b === 4
      ? 'Can a local event settle a remote write?'
      : b === 1
        ? 'Whose circuit should open?'
        : 'What happens to the one probe slot?',
    true,
  );
  if (b === 4) {
    if (cue(4, 'local cancellation')) {
      plate(g, 38, 135, 884, 261);
      slip(g, 68, 186, 358, 146, 'Caller', ['Cancellation propagated', 'Probe slot released']);
      slip(
        g,
        527,
        186,
        357,
        146,
        'Remote write',
        ['Outcome unknown', 'Check destination'],
        C.brassDark,
      );
      footer(g, 'Releasing a local slot supplies no evidence about the remote effect.', true);
    } else racePicture(g, scene, true);
    return;
  }
  if (b === 1) {
    const opened = cue(1, 'B crosses the threshold');
    plate(g, 37, 142, 886, 246);
    ['A', 'B'].forEach((tenant, i) => {
      const y = 221 + i * 99,
        state = i && opened ? 'open' : 'closed';
      mono(g, 'Tenant ' + tenant, 61, y + 5, 21, C.ivory);
      contact(g, 230, y, 412, state);
      tag(g, state.toUpperCase(), 695, y - 20, 169, state === 'open' ? C.red : C.teal);
    });
    footer(
      g,
      'This breaker counts qualifying dependency failures separately for each tenant.',
      true,
    );
    return;
  }
  const canceled = cue(3, 'releases its slot'),
    reset = cue(3, 'separate experiment'),
    neutral = cue(3, 'non-health exception releases');
  const ready = cue(2, 'After its cooldown'),
    entered = cue(2, 'probe can enter');
  const current = neutral
    ? probe('other-error')
    : reset
      ? inProbe
      : canceled
        ? probe('cancel')
        : entered
          ? inProbe
          : ready
            ? life.halfOpen
            : life.opened;
  plate(g, 39, 143, 881, 243);
  mono(g, 'STATUS SERVICE   /   B', 64, 179, 15, C.dim);
  contact(g, 85, 252, 457, current.state);
  mono(g, current.state.toUpperCase(), 85, 320, 24, current.state === 'open' ? C.red : C.brass);
  rr(g, 578, 187, 292, 142, 12, C.deep, C.steel);
  mono(g, 'LOCAL PROBE SLOT', 599, 217, 14, C.dim);
  if (current.inFlight) packet(g, 727, 262, 'probe-B', 169, C.brass);
  else center(g, canceled ? 'Released' : 'Empty', 727, 273, 29, C.teal, { font: 'Serif' });
  mono(
    g,
    current.state === 'open'
      ? 'Cooldown blocks admission'
      : current.inFlight
        ? 'No second probe'
        : 'Probe may enter',
    599,
    308,
    14,
    C.ivory,
  );
  footer(
    g,
    neutral
      ? 'The error propagates. The next probe can enter without a health verdict.'
      : reset
        ? 'Replay the same admitted probe with a different outcome.'
        : canceled
          ? 'Cancellation propagates. A later cooldown may admit a new probe.'
          : 'One event loop owns this slot. An in-flight probe excludes a second one.',
    true,
  );
}

export function spend(g, { b, cue }) {
  const title =
    b <= 2
      ? 'How many sends could the layers allow?'
      : b <= 4
        ? 'How much input did the run submit?'
        : b === 5
          ? 'Can the next call reserve enough tokens?'
          : 'Which charges survive a timeout?';
  heading(g, 'Run budget   /   Transport and tokens', title, true);
  plate(g, 38, 135, 884, 267);
  if (b <= 2) {
    const triple = cue(1, 'four cubed'),
      nested = cue(1, 'three inner sends'),
      size = triple ? 4 : 3,
      sets = triple ? 4 : nested ? 3 : 1;
    const count = triple ? 4 ** 3 : sets * size;
    mono(g, 'POSSIBLE SENDS', 62, 169, 14, C.brass);
    for (let k = 0; k < sets; k++) {
      const x = 64 + k * (triple ? 120 : 146);
      rr(g, x, 194, triple ? 104 : 128, 142, 7, C.deep);
      for (let j = 0; j < (triple ? 16 : size); j++) {
        const dx = triple ? 17 + (j % 4) * 23 : 25 + j * 38,
          dy = triple ? 24 + Math.floor(j / 4) * 28 : 74;
        dot(g, x + dx, 194 + dy, triple ? 6 : 9, C.blue);
      }
    }
    const owner = cue(2, 'one layer ownership');
    mono(
      g,
      owner ? 'Configured bound' : triple ? '4 × 4 × 4' : nested ? '3 × 3' : '1 + 2',
      632,
      216,
      20,
      C.brass,
    );
    txt(g, String(count), 631, 287, 62, C.ivory, { font: 'Serif' });
    mono(g, 'possible sends', 633, 315, 16, C.dim);
    if (owner) mono(g, 'Count actual sends separately', 65, 371, 17, C.teal);
    footer(
      g,
      owner
        ? 'Choose one retry owner. Re-admit any new model proposal.'
        : 'The bound assumes each layer retries the same failures.',
      true,
    );
    return;
  }
  if (b <= 4) {
    const starts = ['one hundred', 'one hundred fifty', 'two hundred', 'two hundred fifty'];
    const n = starts.reduce((a, s) => a + cue(3, s), 0);
    const total = sum(inputs.slice(0, n));
    inputs.forEach((v, i) => {
      const y = 178 + i * 42;
      mono(g, 'Turn ' + (i + 1), 62, y + 5, 16, C.dim);
      if (i < n) {
        rr(g, 162, y - 12, 100 * 1.55, 22, 2, C.blue);
        if (v > 100) rr(g, 162 + 155, y - 12, (v - 100) * 1.55, 22, 2, C.teal);
        mono(g, String(v), 174 + v * 1.55, y + 5, 16, C.ivory);
      }
    });
    mono(g, 'SUBMITTED INPUT', 642, 181, 14, C.dim);
    txt(g, String(total), 639, 249, 53, C.brass, { font: 'Serif' });
    mono(g, 'tokens', 643, 276, 16, C.ivory);
    if (b === 4) {
      mono(g, 'n·h + s·n(n−1)/2', 63, 363, 20, C.ivory);
      mono(g, 'fixed prefix h, +s history per request', 338, 363, 14, C.dim);
    } else {
      mono(g, 'Fixed prefix', 62, 366, 14, C.blue);
      mono(g, 'Added history', 283, 366, 14, C.teal);
    }
    footer(
      g,
      'Each prompt contains its prefix and all the accumulated history in this example.',
      true,
    );
    return;
  }
  if (b === 5) {
    const x = 112,
      scale = 3.3,
      need = cue(5, 'hundred twenty plus eighty'),
      balance = cue(5, 'hundred fifty remain'),
      reject = cue(5, 'Reject it before dispatch');
    mono(g, 'REQUEST RESERVATION', 63, 174, 15, C.brass);
    if (need) {
      rr(g, x, 234, demand.input * scale, 48, 3, C.blue);
      rr(g, x + demand.input * scale, 234, demand.output * scale, 48, 3, C.brass);
      mono(g, 'Input ' + demand.input, x + 18, 265, 20, C.deep);
      mono(g, 'Output ≤ ' + demand.output, x + demand.input * scale + 12, 265, 18, C.deep);
    }
    if (balance) {
      const end = x + demand.balance * scale;
      line(g, end, 204, end, 233, C.red, 3);
      line(g, end, 283, end, 303, C.red, 3);
      mono(g, 'Balance ' + demand.balance, end, 194, 16, C.red, { align: 'center' });
    }
    if (reject && !demand.admit)
      mono(g, demand.need + ' required  >  ' + demand.balance + ' available', x, 350, 22, C.red);
    footer(
      g,
      reject
        ? 'The reservation fails before dispatch. No tokens leave the balance.'
        : 'Compare the entire reservation with the shared remaining balance.',
      true,
    );
    return;
  }
  mono(g, 'ACCOUNTING AFTER DISPATCH', 64, 174, 14, C.brass);
  slip(g, 70, 208, 368, 136, 'Prior requests', [
    sum(inputs) + ' input tokens',
    'Already submitted',
  ]);
  const timeout = cue(6, 'times out');
  slip(
    g,
    505,
    208,
    373,
    136,
    'Separate admitted call',
    [
      timeout ? 'Usage unknown' : 'Reservation held',
      timeout ? 'Retain until reconciled' : 'Await actual usage',
    ],
    C.brassDark,
  );
  footer(
    g,
    b === 6
      ? 'A shorter next prompt changes future spend. Prior submissions stay charged.'
      : 'Stopping the caller leaves the remote effect and charge to be reconciled.',
    true,
  );
}

export function finalWait(g, { during, settled }) {
  const hasFloor = settled(1, 'The required wait is one point two seconds'),
    hasJitter = settled(1, 'selected jitter of point three seconds'),
    hasDeadline = settled(1, 'Only one point four seconds remain'),
    joining = during(2, 'Slide the offset against the minimum wait'),
    totalShown = settled(2, 'The far edge is one point five seconds'),
    missed = !exercise.fits && settled(2, 'The deadline comes first'),
    stopped = missed && settled(2, 'Stop here with the retry unsent');
  heading(
    g,
    'Replay practice   /   One remaining deadline',
    'Is there time for another send?',
    true,
  );
  plate(g, 39, 139, 882, 257);
  const x = 99,
    barY = 234,
    barHeight = 38,
    rulerY = 347;
  const px = rule(g, x, rulerY, 718, 1.8, 0.2);
  const base = px(exercise.floor / 1000),
    edge = px(exercise.total / 1000),
    limit = px(exercise.left / 1000);
  mono(g, 'ACTIVE REPLAY CONTRACT', 62, 170, 14, C.teal);
  mono(g, 'Same key and payload', 61, 196, 16, C.ivory);
  tag(g, stopped ? 'Retry unsent' : 'Retry pending', 728, 154, 162, stopped ? C.red : C.pale);
  if (hasDeadline) {
    line(g, limit, 213, limit, barY - 4, C.red, 3);
    if (joining === 1) line(g, limit, barY + barHeight + 4, limit, rulerY - 8, C.red, 2, [4, 5]);
    dot(g, limit, rulerY, 6, C.red);
    mono(g, exercise.left / 1000 + ' s deadline', limit, 202, 17, C.red, { align: 'center' });
  }
  if (hasFloor) {
    rr(g, x, barY, base - x, barHeight, 3, C.blue);
    mono(g, 'Minimum ' + exercise.floor / 1000 + ' s', x + 14, barY + 26, 19, C.deep);
  }
  if (hasJitter) {
    const horizontal = Math.min(joining / 0.7, 1);
    const vertical = Math.max((joining - 0.7) / 0.3, 0);
    const jitterX = mix(x, base, horizontal);
    const jitterY = mix(291, barY, vertical);
    const jitterWidth = edge - base;
    rr(g, jitterX, jitterY, jitterWidth, barHeight, 3, C.brass);
    center(g, '+' + exercise.jitter / 1000 + ' s', jitterX + jitterWidth / 2, jitterY + 26, 16, C.deep, {
      font: 'Mono',
    });
  }
  if (totalShown) mono(g, exercise.total / 1000 + ' s', edge + 14, barY + 26, 20, C.ivory);
  if (missed) {
    line(g, limit, barY + barHeight - 7, limit, barY + barHeight + 8, C.brick, 3);
    line(g, limit, 302, edge, 302, C.red, 3);
    line(g, edge, 294, edge, 310, C.red, 2);
  }
  footer(
    g,
    stopped
      ? 'The minimum plus jitter crosses the deadline. The retry stays unsent.'
      : 'Compare the full wait with the original deadline.',
    true,
  );
}
