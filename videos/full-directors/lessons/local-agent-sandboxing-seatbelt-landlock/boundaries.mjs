import { C, cue, ease, mix } from './bench.mjs';
import {
  reads,
  wheelDigest,
  lockedDigest,
  seatbeltStartup,
  grantRows,
  brokerScope,
  dispatch,
  upstreamReply,
  experiment,
  reportRequest,
  inspectReceipt,
  exerciseMarker,
} from './operations.mjs';

function syscallGates(b, k) {
  const pass = cue(k, 0, 'filter admits both calls');
  const answer = cue(k, 1, 'filesystem admits the fixture');
  const denied = cue(k, 1, 'denies the private note');
  b.base('Linux   /   seccomp and filesystem policy', 'Which open reaches its file?');
  b.mono('REQUEST', 51, 144, 14, C.muted);
  b.mono('SYSCALL FILTER', 398, 144, 14, C.muted);
  b.mono('RESOURCE CHECK', 659, 144, 14, C.muted);
  reads.forEach((r, i) => {
    const y = 223 + 105 * i,
      known = i === 0 ? answer : denied;
    b.mono('openat', 52, y - 16, 23, C.blue);
    b.mono(r.file, 52, y + 17, 18, C.paper);
    b.arrow(259, y, 371);
    b.box(385, y - 31, 171, 62, C.deep, pass ? C.green : C.line, 8);
    b.text(pass && r.syscall ? 'Allowed' : 'Check call', 470, y, 23, pass ? C.green : C.muted, {
      align: 'center',
    });
    if (pass) b.arrow(564, y, 637, C.blue);
    b.box(648, y - 31, 224, 62, C.deep, known ? (r.read ? C.green : C.coral) : C.line, 8);
    b.text(
      known ? (r.resource ? 'File opens' : 'Read denied') : '?',
      760,
      y,
      24,
      known ? (r.read ? C.green : C.coral) : C.gold,
      { align: 'center' },
    );
  });
  b.mono('File read grant   •   project tests/', 51, 397, 16, C.blue);
  b.footer(
    denied
      ? 'Private note     allowed call  →  denied resource  →  denied read'
      : 'Both requests use the same syscall and a pointer to a filename.',
  );
}

function mounts(b, k) {
  const predicted = cue(k, 2, 'would block a write');
  const missing = cue(k, 2, 'filter descriptor is absent');
  const interpreted = cue(k, 3, 'in that run');
  b.base('Linux   /   Bubblewrap mount model', 'What would a failed metadata write show?');
  b.mono('WORKER FILESYSTEM', 55, 142, 15, C.blue);
  const mounts = [
    ['/app/src', 'read + write', C.green],
    ['/app/.git', 'read-only', C.blue],
    ['/usr', 'read-only', C.blue],
    ['/tmp', 'scratch', C.gold],
  ];
  mounts.forEach(([name, access, tone], i) => {
    const y = 192 + i * 58;
    b.stroke(
      [
        [60, 166],
        [60, y],
        [86, y],
      ],
      C.line,
      2,
    );
    b.mono(name, 101, y, 19);
    b.text(access, 288, y, 18, tone);
  });
  b.stroke(
    [
      [444, 152],
      [444, 390],
    ],
    C.line,
    1,
  );
  b.text('Metadata write', 486, 177, 23);
  b.box(486, 206, 392, 48, C.deep, predicted ? C.coral : C.line);
  b.mono(
    predicted ? 'Mount would block this write' : 'Predict from the mount',
    506,
    230,
    17,
    predicted ? C.coral : C.muted,
  );
  b.text('Seccomp filter descriptor', 486, 305, 23);
  b.box(486, 332, 392, 48, C.deep, C.line);
  b.mono(
    missing ? 'No filter supplied' : 'Inspect configuration',
    506,
    356,
    17,
    missing ? C.gold : C.muted,
  );
  b.footer(
    interpreted
      ? 'A refusal on the host would confirm that this write was blocked.'
      : 'Would a failed file write tell you whether process tracing is blocked?',
  );
}
function packages(b, k) {
  const match = cue(k, 4, 'compares the wheel');
  const mounted = cue(k, 4, 'mounts the matching package');
  const imported = cue(k, 4, 'worker imports');
  const equal = wheelDigest === lockedDigest;
  b.base('Linux   /   offline dependency fixture', 'Who verifies the package and who runs it?');
  b.mono('SUPERVISOR', 57, 149, 16, C.blue);
  b.mono('RESTRICTED WORKER', 568, 149, 16, C.green);
  b.stroke(
    [
      [478, 139],
      [478, 395],
    ],
    C.line,
    2,
    true,
  );
  b.text('Package bytes', 57, 199, 23);
  b.text('Trusted lockfile', 57, 278, 23);
  b.mono(wheelDigest.slice(0, 12), 58, 236, 24, C.gold);
  b.mono(match ? lockedDigest.slice(0, 12) : '…', 58, 315, 24, C.gold);
  if (match) b.mono(equal ? 'Digests match' : 'Mismatch', 58, 375, 21, C.green);
  b.arrow(336, 241, 533, mounted ? C.green : C.line);
  b.folder(565, 213, 293, 'package store', mounted ? C.green : C.blue);
  b.text(mounted ? 'Mounted read-only' : 'Waiting for verified bytes', 712, 297, 19, C.muted, {
    align: 'center',
  });
  if (imported) {
    b.worker(589, 364);
    b.text('Imported by test child', 638, 361, 21);
  }
  b.footer('Digest prefixes shown. The worker boundary governs execution.');
}
export function controls(b, k) {
  const i = k.beat.beatIndex;
  if (i < 2) syscallGates(b, k);
  else if (i < 4) mounts(b, k);
  else packages(b, k);
}

function launchRail(b, k) {
  const failed = cue(k, 0, 'load returns an error');
  const countFailed = cue(k, 1, 'Zero workers started');
  const second = cue(k, 1, 'On a second launch');
  const active = cue(k, 1, 'required profile becomes active');
  const start = cue(k, 1, 'launcher start the test');
  const movement = ease(cue(k, 1, 'launcher start the test', 1.1));
  b.base('macOS   /   required Seatbelt profile', 'When may the worker leave the start?');
  b.mono('Profile load', 54, 142, 17, C.muted);
  b.mono('Start position', 358, 142, 16, C.muted);
  b.mono('Test run', 745, 142, 16, C.muted);
  const runs = second ? 2 : 1;
  for (let i = 0; i < runs; i++) {
    const y = 218 + i * 119,
      loaded = i === 1 && active,
      error = i === 0 && failed;
    const state = seatbeltStartup(true, loaded ? 'loaded' : 'error');
    const launched = Boolean(i === 1 && start && state.launch);
    b.text('Run ' + (i ? 'B' : 'A'), 54, y - 21, 24);
    b.text(
      error ? 'Load error' : loaded ? 'Profile active' : 'Loading…',
      54,
      y + 17,
      21,
      error ? C.coral : loaded ? C.green : C.gold,
    );
    b.track(368, 864, y + 19);
    b.stroke(
      [
        [534, y - 52],
        [534, loaded ? y - 40 : y + 18],
      ],
      loaded ? C.green : C.coral,
      4,
    );
    b.stroke(
      [
        [514, loaded ? y - 40 : y - 12],
        [554, loaded ? y - 40 : y - 12],
      ],
      loaded ? C.green : C.coral,
      6,
    );
    b.worker(mix(389, 785, launched ? movement : 0), y, launched ? C.green : C.blue);
    if ((i === 0 && countFailed) || launched)
      b.mono(
        (launched ? state.workersStarted : 0) + ' started',
        866,
        y + 49,
        16,
        launched ? C.green : C.muted,
        'right',
      );
  }
  if (!second) b.mono('Launch requires an active profile.', 57, 357, 21, C.paper);
  b.footer('The carriage represents the pending test until the launcher starts it.');
}
function macScope(b, k) {
  const broad = cue(k, 2, 'permits writes to the whole project');
  const host = cue(k, 3, 'checkout runs as the host');
  const narrow = cue(k, 3, 'Narrow the writable scope');
  const rows = grantRows(narrow ? 'src' : 'project', false);
  b.base('macOS   /   scope of the article’s profile', 'What remains writable in the project?');
  b.text(narrow ? 'Proposed narrower grant' : 'Example CLI profile', 54, 145, 24);
  b.mono('Project', 54, 201, 21, C.blue);
  rows.forEach((r, i) => {
    const x = 57 + i * 210;
    b.folder(x, 254, 184, r.dir + '/', C.blue);
    const known = broad || narrow;
    b.mono(
      known ? (r.write ? 'write granted' : 'outside grant') : '?',
      x + 92,
      333,
      16,
      known ? (r.write ? C.green : C.muted) : C.gold,
      'center',
    );
  });
  b.stroke(
    [
      [694, 169],
      [694, 369],
    ],
    C.line,
    1,
  );
  b.text('Home paths', 723, 200, 22);
  ['SSH', 'AWS', 'Keychains'].forEach((s, i) => b.mono(s, 728, 243 + i * 38, 18, C.archive));
  b.mono('access denied', 722, 367, 16, C.coral);
  b.footer(
    host
      ? 'A later host checkout uses its own authority. Test the protected metadata.'
      : 'Check who can write the settings a host tool will consume.',
  );
}
export function mac(b, k) {
  if (k.beat.beatIndex < 2) launchRail(b, k);
  else macScope(b, k);
}

function key(b, x, y) {
  b.dot(x, y, 12, C.gold);
  b.dot(x, y, 5, C.deep);
  b.stroke(
    [
      [x + 10, y],
      [x + 36, y],
      [x + 36, y + 8],
      [x + 30, y + 8],
      [x + 30, y + 3],
    ],
    C.gold,
    5,
  );
}
function travelAfter(k, beat, phrase, duration = 0) {
  const active = k.beat.beatIndex;
  if (active !== beat) return Number(active > beat);
  const { start, end } = k.wordCue(phrase);
  const spoken = end - start;
  const phase = k.reveal(phrase, spoken + duration, { captionStart: false });
  if (phase === 1) return 1;
  return duration ? ease(Math.max(0, (phase * (spoken + duration) - spoken) / duration)) : 0;
}

export function broker(b, k) {
  const first = dispatch(brokerScope);
  const socket = cue(k, 0, 'local Unix socket', 0.9);
  const rule = cue(k, 0, 'checks the method');
  const sent = cue(k, 1, 'attaches its credential');
  const dispatching = travelAfter(k, 1, 'on the outbound request', 0.65);
  const got = cue(k, 1, 'reply contains') && dispatching === 1;
  const filtered = cue(k, 1, 'Only number and state');
  const change = cue(k, 2, 'Change the method') && travelAfter(k, 2, 'to POST');
  const approach = travelAfter(k, 2, 'to POST', 0.95);
  const refuse = cue(k, 3, 'Deny the request') && travelAfter(k, 3, 'before dispatch');
  const request = { ...brokerScope, method: change ? 'POST' : 'GET' },
    current = dispatch(request);
  b.base(
    'Local Unix socket   /   scoped pull-request lookup',
    change ? 'May the broker dispatch this POST?' : 'What crosses the broker socket?',
  );
  b.stroke(
    [
      [330, 148],
      [330, 395],
    ],
    C.line,
    2,
    true,
  );
  b.stroke(
    [
      [685, 148],
      [685, 395],
    ],
    C.line,
    2,
    true,
  );
  b.mono('WORKER', 52, 141, 15, C.blue);
  b.mono('HOST BROKER', 365, 141, 15, C.gold);
  b.mono('FIXED ORIGIN', 718, 141, 15, C.green);
  b.text('Request · caller ' + request.caller, 52, 185, 20, C.muted);
  b.mono(request.method + '   ' + request.repo, 52, 223, 23, change ? C.gold : C.ink);
  b.mono('pull #' + request.number, 52, 259, 19);
  b.arrow(270, 240, 353, C.blue);
  if (socket > 0 && socket < 1) b.dot(mix(270, 353, ease(socket)), 240, 7, C.gold);
  if (rule) {
    b.mono('GET only', 365, 193, 21);
    b.mono('owner/repo  #42', 365, 226, 19);
  }
  key(b, 381, 277);
  b.text('Host credential', 438, 278, 17, C.gold);
  if (sent) {
    if (change) b.text('Earlier authorized call', 719, 180, 16, C.muted);
    b.arrow(610, 219, 710, dispatching === 1 ? C.green : C.line);
    if (dispatching === 1) b.mono('GET × ' + first.upstream, 731, 213, 22, C.green);
    else if (dispatching > 0) b.dot(mix(610, 710, dispatching), 219, 7, C.green);
  }
  if (change) {
    const denied = refuse && !current.allowed;
    const status = denied ? C.coral : C.gold;
    b.stroke([[279, 327], [656, 327]], C.line, 2);
    b.stroke([[656, 306], [656, 348]], status, denied ? 5 : 3);
    const marker = mix(279, 620, approach);
    b.box(marker - 28, 313, 56, 28, C.deep, status, 4);
    b.mono('POST', marker, 327, 16, status, 'center');
    b.mono(denied ? 'Denied before dispatch' : 'Await authorization', 365, 392, 21, status);
  }
  if (got) {
    b.text('Reply fields', 719, 272, 18, C.muted);
    Object.entries(upstreamReply).forEach(([name, value], i) =>
      b.mono(
        name + '  ' + value,
        720,
        304 + 27 * i,
        name === 'debug' ? 14 : 17,
        name === 'debug' ? C.archive : C.paper,
      ),
    );
  }
  if (filtered) {
    b.arrow(352, 363, 269, C.green);
    b.text(change ? 'Earlier GET reply' : 'Returned to worker', 52, 320, 17, C.muted);
    b.mono('#' + first.reply.number + '   ' + first.reply.state, 52, 361, 25, C.green);
  }
  if (dispatching === 1)
    b.mono('Upstream calls: ' + (first.upstream + (refuse ? current.upstream : 0)), 719, 392, 17, C.green);
}

function afterPhrase(k, beat, phrase) {
  if (k.beat.beatIndex !== beat) return k.beat.beatIndex > beat;
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart: phrase }) === 1;
}

function byteCount(count) {
  return count + (count === 1 ? ' byte' : ' bytes');
}

function reportReadback(b, k) {
  const queued = cue(k, 0, 'each tried to append');
  const approach = ease(cue(k, 0, 'each tried to append', 0.85));
  const exits = [
    afterPhrase(k, 1, 'In A the append succeeds'),
    afterPhrase(k, 1, 'In B the append to the archive fixture is denied'),
  ];
  const error = afterPhrase(k, 1, 'operation not permitted');
  const ask = cue(k, 1, 'What should the host measure next');
  const comparing = cue(k, 2, 'supervisor compares');
  const copyB = afterPhrase(k, 2, 'B still has two empty files');
  const readbacks = [
    {
      src: afterPhrase(k, 2, 'A has one byte in the source report'),
      archive: afterPhrase(k, 2, 'and zero in archive'),
    },
    { src: copyB, archive: copyB },
  ];
  const startingBytes = 0;
  const fileWidth = 194;
  b.base('Recorded appends   /   macOS 26.7.1   /   Seatbelt', 'Which file changed on the host?');
  b.mono(reportRequest, 480, 131, 24, C.gold, 'center');
  b.stroke(
    [
      [480, 158],
      [480, 402],
    ],
    C.line,
    1,
  );
  experiment.forEach((run, i) => {
    const x = 48 + i * 462;
    const receipt = inspectReceipt(run);
    const target = run.resolved.startsWith('src/') ? 'src' : 'archive';
    const done = exits[i];
    b.mono('COPY ' + run.name + '   →   ' + run.resolved, x, 165, 19, C.ink);
    for (const [j, dir] of ['src', 'archive'].entries()) {
      const left = x + j * 216;
      const center = left + fileWidth / 2;
      const known = readbacks[i][dir];
      const count = receipt.observed[dir];
      const tone = dir === 'src' ? C.paper : '#ead3d1';
      if (dir === target && queued) {
        if (!done || (receipt.exit && !comparing)) {
          const entry = x + 205;
          b.track(Math.min(entry, center), Math.max(entry, center), 203);
          b.byte(mix(entry, center, approach), 203);
        }
        if (done && receipt.exit && !comparing) {
          b.stroke(
            [
              [center - 20, 223],
              [center + 20, 223],
            ],
            C.coral,
            4,
          );
        }
      }
      b.file(
        left,
        229,
        fileWidth,
        119,
        dir + '/report.txt',
        known ? String(count) : '?',
        known ? byteCount(count) + ' read back' : 'Readback pending',
        known && count > startingBytes ? C.gold : tone,
      );
      b.mono('Start: ' + byteCount(startingBytes), center, 369, 16, C.muted, 'center');
    }
    b.mono(
      done ? 'Shell exit ' + receipt.exit : queued ? 'Append requested' : 'Ready to append',
      x,
      402,
      18,
      done ? (receipt.exit ? C.coral : C.green) : C.muted,
    );
    if (error && done && receipt.message) b.mono(receipt.message, x + 147, 402, 16, C.coral);
  });
  b.footer(
    copyB
      ? 'Only A’s source report gained a byte.'
      : comparing
        ? 'Compare the host readback with the starting bytes.'
        : ask
          ? 'The shell reported both attempts. What should the host measure next?'
          : 'The profile permits data writes under src in both checkouts.',
  );
}
function practice(b, k) {
  const result = exerciseMarker();
  const ask = cue(k, 3, 'refused settings write');
  const verified = afterPhrase(k, 4, 'It should read clean, all five bytes');
  const positive = afterPhrase(k, 4, 'confirm the report gained its byte');
  b.base(
    'Practice   /   disposable settings fixture   /   expected results',
    'What should the supervisor read back?',
  );
  b.mono('STARTING COPY', 64, 144, 15, C.muted);
  b.mono('AFTER WORKER EXIT', 600, 144, 15, C.muted);
  b.file(
    66,
    168,
    230,
    167,
    'settings/marker',
    result.before,
    byteCount(result.before.length) + ' at start',
  );
  b.arrow(310, 247, 593, ask ? C.coral : C.line);
  b.box(340, 204, 225, 84, C.deep, ask ? C.coral : C.line);
  b.text(ask ? 'Write refused' : 'Try append', 452, 245, 23, ask ? C.coral : C.muted, {
    align: 'center',
  });
  b.file(
    610,
    168,
    230,
    167,
    'settings/marker',
    verified ? result.after : '?',
    verified ? result.after.length + ' bytes' : 'compare bytes',
    verified ? C.paper : '#d3d4bf',
  );
  b.mono(
    positive
      ? 'Passing control: report  0 → ' + result.report.length + ' byte'
      : 'Passing control: same worker updates its report',
    64,
    388,
    19,
    positive ? C.green : C.muted,
  );
  b.footer(
    verified
      ? 'A changed marker or a failed control keeps this runner on hold.'
      : 'Predict the exact contents, as well as the file length.',
  );
}
export function verify(b, k) {
  if (k.beat.beatIndex < 3) reportReadback(b, k);
  else practice(b, k);
}
