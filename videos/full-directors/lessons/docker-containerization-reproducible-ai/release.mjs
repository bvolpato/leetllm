import { createHash } from 'node:crypto';
import {
  FIXTURE,
  CHANGED_FIXTURE,
  CHANGED_FIXTURE_JSONL,
  FRESH_FIXTURE,
  FRESH_EXPECTED_COUNTS,
  FRESH_MOUNTED,
  FRESH_REPAIRED,
  OBSERVED_IMAGE_ID,
} from '../../../films/docker-containerization-reproducible-ai/fixtures.mjs';
import {
  matchesReferenceReport,
  reportLines,
  score,
} from '../../../films/docker-containerization-reproducible-ai/model.mjs';
import {
  C,
  box,
  cap,
  circle,
  dial,
  display,
  folder,
  foot,
  label,
  mono,
  path,
  plate,
  readerBed,
  screw,
  tape,
  well,
  wire,
} from './artwork.mjs';

export const SCORE_THRESHOLD_LINE = 'Score threshold passed.';

export function snapshot(bytes) {
  const rows = bytes
    .toString('utf8')
    .trimEnd()
    .split('\n')
    .map((line) => JSON.parse(line));
  return {
    rows,
    score: score(rows),
    size: bytes.length,
    sha: createHash('sha256').update(bytes).digest('hex'),
  };
}
const saved = snapshot(Buffer.from(CHANGED_FIXTURE_JSONL));
const idPrefix = OBSERVED_IMAGE_ID.slice(7, 19);
export function runJobEvents(events) {
  const state = { tag: null, file: null, captured: null, baked: null, mounted: null };
  for (const event of events) {
    switch (event) {
      case 'build A':
        state.tag = 'A';
        break;
      case 'write A':
        state.file = 'A';
        break;
      case 'build B':
        state.tag = 'B';
        break;
      case 'read tag':
        state.captured = state.tag;
        break;
      case 'read file':
        state.captured = state.file;
        break;
      case 'baked':
      case 'mounted':
        state[event] = state.captured;
        break;
    }
  }
  return state;
}
export function lastReports({ image = FIXTURE, host = FIXTURE }) {
  return [image, host].map((rows) => score(rows));
}
export function firstFailed(host, runtime, framework) {
  return [host, runtime, framework].findIndex((value) => value === false);
}
function graphicsCard(c, x, y, active) {
  box(c, x, y, 353, 153, active ? '#437663' : '#626d64', 8, C.ink, 3);
  box(c, x - 6, y - 9, 10, 180, C.edge, 2, C.ink);
  for (let i = 0; i < 16; i++) box(c, x + 49 + i * 13, y + 151, 8, 13, C.gold);
  for (let i = 0; i < 11; i++) box(c, x + 140 + i * 16, y + 15, 6, 74, '#a7b6a7', 2);
  circle(c, x + 73, y + 64, 48, C.iron, C.ink, 3);
  for (let i = 0; i < 8; i++) {
    c.save();
    c.translate(x + 73, y + 64);
    c.rotate((Math.PI * i) / 4);
    path(
      c,
      [
        [0, 0],
        [2, -33],
        [15, -37],
        [24, -27],
        [19, -16],
      ],
      C.edge,
    );
    c.restore();
  }
  circle(c, x + 73, y + 64, 13, C.iron, C.line, 2);
  screw(c, x + 334, y + 132);
  mono(c, x + 17, y + 128, 'NVIDIA GPU', 22, { color: C.pale });
}

function gpu(c, { at, b }) {
  const host = at(0, 'ask the host driver'),
    hostListed = at(0, 'Can a container', 0),
    request = at(0, 'Start a plain Ubuntu', 0),
    listed = at(1, 'Now open Python', 0),
    missing = at(1, 'That image has', 0);
  graphicsCard(c, 70, 205, host);
  wire(
    c,
    [
      [423, 244],
      [514, 244],
      [514, 207],
      [626, 207],
    ],
    C.green,
    host,
  );
  wire(
    c,
    [
      [423, 283],
      [541, 283],
      [541, 346],
      [626, 346],
    ],
    C.blue,
    at(0, 'Run the same listing'),
  );
  plate(c, 627, 146, 496, 102, 'Host driver', C.mint, hostListed ? 'nvidia-smi     GPU listed' : 'nvidia-smi');
  plate(
    c,
    627,
    282,
    496,
    102,
    'Ubuntu container',
    C.ice,
    listed ? 'nvidia-smi     GPU listed' : request ? 'nvidia-smi' : 'awaiting launch',
  );
  if (b && listed)
    display(c, 627, 399, 496, 116, 'CPU SCORER IMAGE', [
      {
        t: missing ? "No module named 'torch'" : 'import torch',
        color: missing ? C.blush : C.pale,
        size: 22,
      },
    ]);
  if (request) {
    well(c, 56, 394, 538, 149, 'CONFIGURED LINUX ENGINE   /   DEVICE REQUEST');
    mono(c, 80, 450, 'docker run --rm \\', 25, { color: C.pale });
    mono(c, 80, 484, '--runtime=nvidia ', 25, { color: C.pale });
    const flagX = 80 + c.measureText('--runtime=nvidia ').width;
    mono(c, flagX, 484, '--gpus all', 25, { color: C.gold, bold: true });
    const afterFlag = flagX + c.measureText('--gpus all').width;
    mono(c, afterFlag, 484, ' \\', 25, { color: C.pale });
    mono(c, 80, 518, 'ubuntu nvidia-smi', 25, { color: C.pale });
  } else {
    foot(c, 'Check the driver on the machine running Docker Engine.');
  }
}

function probes(c, { b, at }) {
  if (b >= 4) {
    const rows = [
      ['Linux Engine', 'system daemon or user-scoped rootless daemon'],
      ['Windows Desktop', 'WSL 2 backend + compatible Windows driver'],
      ['Apple Silicon', b === 5 ? 'native PyTorch → Metal / MPS' : 'Linux CPU image'],
    ];
    rows.forEach(([platform, how], i) => {
      const y = 175 + i * 132;
      plate(c, 69, y, 312, 89, platform, i === 2 ? C.gold : C.ice);
      wire(
        c,
        [
          [381, y + 43],
          [495, y + 43],
        ],
        C.blue,
        1,
        3,
      );
      mono(c, 525, y + 43, how, 24, { max: 598 });
    });
    foot(
      c,
      b === 5
        ? 'Use compatible NVIDIA hardware to test the CUDA application.'
        : 'Choose the GPU setup for the host that runs Docker Engine.',
    );
    return;
  }
  const failed =
    b === 2
      ? at(2, 'only the container', 0.48, 'If only the container')
        ? firstFailed(true, false, null)
        : firstFailed(false, null, null)
      : b === 3
        ? firstFailed(true, true, false)
        : -1;
  const labels = ['Host driver', 'Container runtime', 'Application image'];
  const details = ['driver + GPU', 'requested devices', 'framework + CUDA libs'];
  const checks = ['nvidia-smi', 'GPU listing in Ubuntu', 'tensor operation'];
  labels.forEach((v, i) => {
    const x = 57 + i * 378,
      bad = failed === i,
      pending = failed >= 0 && i > failed;
    well(c, x, 181, 329, 257, v.toUpperCase());
    const shown =
      b === 0
        ? i === 0 ||
          (i === 1 && at(0, 'runtime exposes')) ||
          (i === 2 && at(0, 'application image supplies'))
        : true;
    if (shown) plate(c, x + 20, 251, 289, 86, details[i], bad ? C.blush : pending ? C.paper : C.ice);
    mono(
      c,
      x + 23,
      390,
      b === 0 ? '' : pending ? 'waiting' : bad ? 'probe failed' : b === 1 ? checks[i] : 'probe passed',
      21,
      { color: bad ? C.blush : C.mint, max: 284 },
    );
    if (i < 2)
      wire(
        c,
        [
          [x + 329, 305],
          [x + 378, 305],
        ],
        C.green,
        pending || bad ? 0 : 1,
        4,
      );
  });
  if (b === 1 && at(1, 'result of one')) {
    tape(c, 373, 469, 451, 83, C.mint, 'EXAMPLE CUDA RESULT', ['tensor sum  →  1.0']);
  }
  foot(
    c,
    b === 0
      ? 'The host supplies the kernel driver. The application supplies its framework.'
      : b === 1
        ? 'Example framework probe: torch.ones(1, device="cuda").sum().item()'
        : [
            'Repair the host driver first.',
            'Inspect Container Toolkit, runtime configuration and requested devices.',
            'Check the framework build, visible devices and driver compatibility.',
          ][failed],
  );
}

function reportPair(
  c,
  { files, last, compared = [false, false], thresholdShown = [true, true], identity, heading = 'LAST RUN', hasRun = true },
) {
  cap(c, 64, 141, 'LOCAL IMAGE   ' + identity);
  files.forEach((rows, i) => {
    const x = 62 + i * 570,
      tone = i ? C.gold : C.ice,
      result = last[i],
      row = rows.find((r) => r.id === 102);
    tape(c, x, 175, 503, 131, tone, i ? 'HOST BIND   /   ./eval' : 'BAKED   /   /app/eval', [
      '102   expected   ' + row.expected,
      '      predicted  ' + row.prediction,
    ]);
    wire(
      c,
      [
        [x + 251, 306],
        [x + 251, 347],
      ],
      i ? C.amber : C.blue,
      1,
      3,
    );
    const have = Array.isArray(hasRun) ? hasRun[i] : hasRun;
    display(
      c,
      x,
      348,
      503,
      167,
      heading,
      have
        ? [
            {
              t: result.fraction.toFixed(3) + '   (' + result.matches + '/' + result.total + ')',
              size: 30,
            },
            {
              t: thresholdShown[i] ? 'Threshold   ' + (result.threshold ? 'PASS' : 'FAIL') : '',
              size: 19,
              color: result.threshold ? C.mint : C.blush,
            },
            {
              t: compared[i]
                ? 'Reference   ' + (matchesReferenceReport(result, SCORE_THRESHOLD_LINE) ? 'MATCH' : 'CHANGED')
                : '',
              size: 19,
              color: matchesReferenceReport(result, SCORE_THRESHOLD_LINE) ? C.mint : C.blush,
            },
          ]
        : [{ t: 'awaiting report', color: C.ice }],
    );
  });
}

function identity(c, { b, at, speechDone }) {
  const edit = at(2, 'Which report', 0),
    restore = at(5, 'committed host row', 0.48, 'Restore the committed host row'),
    rerun = at(3, 'so it clears', 0),
    passed = at(3, 'Compare its report', 0),
    compared = at(3, 'The count tells', 0),
    again = at(5, 'Save those reports', 0);
  const file = edit && !restore ? CHANGED_FIXTURE : FIXTURE,
    lastHost = rerun && !again ? CHANGED_FIXTURE : FIXTURE,
    have = b > 1 || (b === 1 && speechDone);
  reportPair(c, {
    files: [FIXTURE, file],
    last: lastReports({ host: lastHost }),
    identity: idPrefix,
    thresholdShown: [true, !rerun || passed],
    compared: [have, have && (!rerun || compared)],
    hasRun: !!have,
  });
  foot(
    c,
    b === 0
      ? 'One image, two runs. Trace each open() to its source.'
      : b === 1
        ? 'Saved reference: 0.667 (2/3)'
        : b === 2
          ? edit
            ? 'The host row now says blocked. Which report will change on the next run?'
            : 'Change the host prediction for request 102 to blocked.'
          : b === 3
            ? compared
              ? 'The host scored higher. Its report differs from the saved 2/3.'
              : 'Follow the host read. Compare the new report with the saved 2/3.'
            : b === 4
              ? 'Git: 102 → escalated      Host: 102 → blocked'
              : again
                ? 'Save both reports and the local ID. Verify the application’s registry digest and platform.'
                : restore
                  ? 'Rerun the mounted scorer with the restored host row.'
                  : 'Restore request 102 from the committed host fixture.',
  );
}

function ciJobs(c, { at, b, speechDone }) {
  const replay = b > 4;
  const built = replay ? at(5, 'Now B builds', 0) : at(4, 'Job B moves', 0);
  const moved = replay ? at(5, 'The file still holds', 0) : at(4, 'Now A inspects', 0);
  const reading = replay ? b === 6 : moved;
  const captured = replay ? at(6, 'The variable now holds', 0) : at(4, "Both of A's", 0);
  const launchBaked = replay ? at(6, 'Pass it to the baked', 0) : captured;
  const launchMounted = replay ? at(6, 'Pass the same variable', 0) : captured;
  const events = [];
  if (built) {
    events.push('build A');
    if (replay) events.push('write A');
  }
  if (moved) events.push('build B');
  if (captured) events.push(replay ? 'read file' : 'read tag');
  if (replay ? launchMounted : speechDone) events.push('baked');
  if (replay ? at(6, 'Both commands used', 0) : speechDone) events.push('mounted');
  const job = runJobEvents(events);

  cap(c, 62, 134, replay ? 'REPLAY   /   FRESH BUILDS' : 'FIRST RUN   /   SHARED TAG LOOKUP');
  for (const [i, id] of ['A', 'B'].entries()) {
    const y = 170 + 117 * i;
    const ready = i ? moved : built;
    plate(c, 61, y, 208, 84, 'Job ' + id, i ? C.gold : C.ice, ready ? 'local ID ' + id : 'awaiting build');
    if (job.tag === id) {
      wire(c, [[269, y + 43], [303, y + 43]], C.amber, 1, 4);
      plate(c, 303, y + 1, 225, 82, 'Shared tag', C.gold, 'access-rag:check');
    }
  }
  if (replay)
    tape(c, 61, 415, 467, 121, C.mint, 'JOB A   /   PRIVATE BUILD OUTPUT', [
      '$job_dir/image.id', job.file ? 'local ID ' + job.file : 'awaiting build',
    ]);
  well(c, 557, 145, 587, 418, replay ? 'JOB A   /   NEW TEST RUNS' : 'JOB A   /   FIRST TEST RUNS');
  const x = 583;
  const heading = (y, title, value) => {
    cap(c, x, y, title, { color: C.ice });
    mono(c, 1115, y, value, 20, { color: C.mint, align: 'right' });
  };
  heading(226, 'CAPTURED IMAGE ID', job.captured ?? 'awaiting read');
  if (reading)
    mono(c, x, 267, replay ? 'image_id=$(cat "$job_dir/image.id")' : 'Inspect access-rag:check', 21, { color: C.pale });
  heading(335, 'BAKED TEST', job.baked ? 'image ' + job.baked : 'awaiting run');
  if (launchBaked)
    mono(c, x, 375, 'docker run --rm --read-only "$image_id"', 21, { color: C.pale });
  heading(412, 'MOUNTED TEST', job.mounted ? 'image ' + job.mounted : 'awaiting run');
  if (launchMounted) {
    mono(c, x, 445, 'docker run --rm --read-only --mount \\', 21, { color: C.pale });
    mono(c, x, 476, '  type=bind,source="$PWD/eval",target=/app/eval,readonly \\', 18, { color: C.pale, max: 534 });
    mono(c, x, 507, '  "$image_id"', 21, { color: C.pale });
  }
  const footer = replay
    ? b === 5
      ? 'docker build --iidfile "$job_dir/image.id" -t access-rag:check .'
      : job.mounted
        ? 'Both launches used the ID read from Job A’s private file.'
        : 'Follow the image ID from the private file to each docker run.'
    : moved
      ? "image_id=$(docker image inspect -f '{{.Id}}' access-rag:check)"
      : 'Which image owns the tag when Job A looks it up?';
  foot(c, footer);
}

function ci(c, { b, at, speechDone }) {
  if (b < 4) {
    const edit = at(2, 'edit to the host'),
      copy = at(2, 'Before the reports', 0),
      oldRerun = at(2, 'Now run the full', 0),
      both = at(3, 'Both clear two thirds', 0),
      passed = at(3, 'The script checks', 0),
      stopped = at(3, 'Bash stops', 0);
    const image = copy ? CHANGED_FIXTURE : FIXTURE,
      host = edit ? CHANGED_FIXTURE : FIXTURE;
    const hasRun = copy ? !!both : !!at(1, 'Testing both matters', 0);
    reportPair(c, {
      files: [image, host],
      last: lastReports({ image: both ? image : FIXTURE, host: oldRerun ? host : FIXTURE }),
      identity: copy ? 'new build  /  COPY eval' : idPrefix,
      thresholdShown: [!copy || passed, !copy || passed],
      compared: [hasRun && (!copy || stopped), hasRun && !copy && !oldRerun],
      hasRun,
    });
    foot(
      c,
      b === 0
        ? 'docker build --check .   →   build   →   inspect tag   →   run by captured ID'
        : b === 1
          ? 'A mounted run alone could hide a missing baked file.'
          : !copy
            ? 'Keep the old image and follow the host edit.'
            : !both
              ? 'New image, edited host file. Predict both reports.'
              : stopped
                ? 'ERROR: baked fixture report changed     •     gate exits 1'
                : passed
                  ? 'Compare the baked report with the saved 2/3.'
                  : 'Apply the two-thirds threshold to each count.',
    );
    return;
  }
  if (b <= 6) return ciJobs(c, { at, b, speechDone });
  at(8, 'reopening its path', 0);
  const read = at(7, 'once into memory'),
    parse = at(7, 'Parse those bytes'),
    hash = at(8, 'Hash those same bytes'),
    later = at(8, 'edits the host file', 0.48, 'If someone edits the host file');
  folder(c, 60, 205, 298, 242, 'Host fixture', ['row 102', later ? 'escalated' : 'blocked'], C.gold);
  wire(
    c,
    [
      [358, 312],
      [424, 312],
    ],
    C.amber,
    read,
  );
  tape(
    c,
    425,
    220,
    315,
    196,
    C.ice,
    'ONE BUFFER',
    read ? [saved.size + ' bytes', saved.rows[1].prediction] : ['awaiting read'],
  );
  wire(
    c,
    [
      [740, 280],
      [811, 280],
      [811, 207],
      [860, 207],
    ],
    C.blue,
    parse,
  );
  wire(
    c,
    [
      [740, 350],
      [811, 350],
      [811, 421],
      [860, 421],
    ],
    C.green,
    hash,
  );
  display(c, 859, 148, 280, 145, 'PARSE + SCORE', [
    { t: parse ? saved.score.matches + ' / ' + saved.score.total : '…' },
  ]);
  display(c, 859, 358, 280, 145, 'SHA-256 PREFIX', [
    { t: hash ? saved.sha.slice(0, 16) : '…', size: 19 },
  ]);
  foot(c, 'Count and hash the same bytes. The file can change after open().');
}

function handover(c, { b, at }) {
  if (b < 2) {
    const pairs = [
      ['Module missing', 'requirements.txt → rebuild'],
      ['Bind permission denied', 'host owner + modes'],
      ['Install repeats', 'cache + Dockerfile order'],
      ['Setting missing', 'declare runtime config'],
    ];
    pairs.forEach(([problem, action], i) => {
      const seen =
        i === 0 ||
        (i === 1 && at(0, 'Permission denied')) ||
        (i === 2 && at(0, 'every script edit', 0.48, 'Does every script edit')) ||
        (i === 3 && at(1, 'config disappears', 0.48, 'If config disappears'));
      const y = 157 + i * 92;
      if (seen) {
        plate(c, 69, y, 392, 70, problem, C.ice);
        wire(
          c,
          [
            [461, y + 34],
            [597, y + 34],
          ],
          C.blue,
          1,
          3,
        );
        mono(c, 630, y + 35, action, 24, { max: 493 });
      }
    });
    foot(
      c,
      b === 0
        ? 'Start at the first observable failure.'
        : 'Put stable dependency installation before the frequently edited scorer.',
    );
    return;
  }
  const revised = at(3, 'Change the final print', 0);
  const summary = at(3, 'The mounted report is still', 0);
  const savedOutput = at(4, 'Now a teammate', 0);
  const report = score(FIXTURE);
  const reportExcerpt = report.fraction.toFixed(3) + ' (' + report.matches + '/' + report.total + ')';
  if (b === 4) {
    folder(
      c,
      61,
      145,
      431,
      377,
      'Fresh clone',
      [
        'Dockerfile   .dockerignore',
        'requirements.txt   compose.yaml',
        'scripts/score_access_requests.py',
        'scripts/check_container.sh',
        'eval/access_requests.jsonl',
      ],
      C.ice,
    );
  } else {
    cap(c, 65, 139, 'SHELL VARIABLES   /   SCORE EXCERPTS');
    [false, true].forEach((host, i) =>
      tape(
        c,
        65,
        166 + i * 132,
        384,
        105,
        host ? C.gold : C.ice,
        host ? '$mounted_report' : '$baked_report',
        [reportExcerpt],
      ),
    );
  }
  const lines = reportLines(report, SCORE_THRESHOLD_LINE).map(t => ({ t, size: 19 }));
  if (b === 4) {
    const output = [];
    if (savedOutput) {
      for (const [source, color] of [['baked /app/eval', C.ice], ['bind ./eval', C.gold]]) {
        output.push({ t: 'Image <fresh build ID> | ' + source, color, size: 19 }, ...lines);
      }
    }
    display(c, 519, 145, 621, 377, 'FRESH CLONE  /  check-output.txt', output);
    if (at(4, 'Run the revised script'))
      foot(c, 'bash scripts/check_container.sh > check-output.txt');
    return;
  }
  if (summary) wire(c, [[449, 218], [532, 218]], C.blue);
  const output = summary
    ? [...lines, { t: 'Verified local image: ' + OBSERVED_IMAGE_ID.slice(0, 19) + '…', size: 19 }]
    : [];
  display(c, 532, 158, 608, 248, 'STDOUT   /   ORIGINAL SUCCESS SUMMARY', output);
  well(c, 54, 420, 1090, 135, revised ? 'EDITED SUCCESS PRINT' : 'scripts/check_container.sh   /   SUCCESS PRINT');
  if (revised) {
    mono(c, 79, 480, `printf 'Image %s | baked /app/eval\\n%s\\n' "$image_id" "$baked_report"`, 23, { color: C.ice });
    mono(c, 79, 519, `printf 'Image %s | bind ./eval\\n%s\\n' "$image_id" "$mounted_report"`, 23, { color: C.gold });
  } else {
    mono(c, 79, 515, `printf '%s\\n' "$baked_report" "Verified local image: $image_id"`, 25, { color: C.pale });
  }
  if (b === 2) foot(c, 'Which report reaches your teammate through stdout?');
  if (revised) foot(c, 'Run the edited script in the fresh clone to produce the new output.');
}

const focus = FRESH_FIXTURE.findIndex((row, i) => row.prediction !== FRESH_MOUNTED[i].prediction);
const shared = FRESH_FIXTURE.filter((_, i) => i !== focus);
export function practiceState(edited, reran) {
  return {
    hostFile: edited ? FRESH_REPAIRED : FRESH_MOUNTED,
    hostReport: score(reran ? FRESH_REPAIRED : FRESH_MOUNTED),
  };
}
function practice(c, { at, after, b }) {
  const edited = at(2, 'restore approved'),
    rerun = after(3, 'Five of seven again'),
    state = practiceState(edited > 0, rerun > 0);
  // The next spoken clause starts after the result the learner needs to hear.
  const imageCount = at(1, 'Three times five', 0);
  const imageComparison = at(1, 'Five out of seven also', 0);
  const imageReference = at(1, 'Now look at the host', 0);
  const hostCount = at(1, 'Three times four', 0);
  const hostComparison = rerun
    ? after(3, 'Fifteen clears the cutoff of fourteen')
    : at(1, 'That count is one below', 0);
  const hostReference = rerun
    ? after(3, 'The new count matches the reference')
    : at(1, 'Where would you', 0);
  const sharedCount = at(0, 'At request', 0);
  cap(c, 63, 130, 'SHARED ROWS');
  shared.forEach((row, i) => {
    const match = score([row]).matches === 1,
      x = 232 + i * 111;
    box(c, x, 109, 97, 40, sharedCount ? (match ? C.mint : C.blush) : C.pale, 3, C.iron, 1.2);
    mono(c, x + 11, 130, row.id, 19);
    if (sharedCount) label(c, x + 67, 129, match ? '✓' : '×', 20, { bold: true });
  });
  cap(c, 926, 130, sharedCount ? score(shared).matches + ' MATCHES / ' + shared.length : 'SAME IN BOTH');
  const first = FRESH_FIXTURE[focus],
    live = state.hostFile[focus],
    known = at(0, 'expected label');
  readerBed(c, 43, 163, 1107, 384);
  const strips = [
    [FRESH_FIXTURE, first, 'BAKED FIXTURE', C.ice],
    [state.hostFile, live, 'READ-ONLY HOST BIND', C.gold],
  ];
  strips.forEach(([rows, row, title, tone], i) => {
    const y = 189 + 182 * i;
    tape(c, 63, y, 648, 142, tone, title, []);
    const columns = [
      [84, 'REQUEST', first.id],
      [220, 'EXPECTED', row.expected],
      [422, 'PREDICTION', row.prediction],
    ];
    if (known) {
      for (const [x, heading, value] of columns) {
        cap(c, x, y + 59, heading);
        mono(c, x, y + 101, value, 29);
      }
      if (i && edited) {
        path(
          c,
          [
            [416, y + 77],
            [408, y + 77],
            [408, y + 120],
            [416, y + 120],
          ],
          null,
          C.green,
          3,
        );
        cap(c, 690, y + 25, 'RESTORED FROM GIT', { align: 'right', color: C.green });
      }
    } else mono(c, 84, y + 94, 'Inspect row ' + row.id, 26);
    const showCount = i ? hostCount : imageCount,
      rep = i ? state.hostReport : score(rows);
    wire(
      c,
      [
        [711, y + 67],
        [835, y + 67],
      ],
      i ? C.amber : C.blue,
      i ? at(1, 'It says escalated') : at(1, 'The image says approved'),
      4,
    );
    dial(
      c,
      913,
      y + 67,
      74,
      showCount ? rep.matches : null,
      rep.total,
      i ? C.amber : C.blue,
    );
    if (showCount) cap(c, 1003, y + 43, 'LAST RUN');
    if (i ? hostComparison : imageComparison) {
      mono(c, 1003, y + 76, rep.matches * 3 + (rep.threshold ? ' ≥ ' : ' < ') + rep.total * 2, 20, {
        color: rep.threshold ? C.green : C.red,
      });
    }
    if (i ? hostReference : imageReference) {
      const hit =
        rep.matches === FRESH_EXPECTED_COUNTS.matches && rep.total === FRESH_EXPECTED_COUNTS.total;
      cap(c, 1003, y + 108, hit ? 'MATCHES REF.' : 'MISSES REF.', { color: hit ? C.green : C.red });
    }
  });
  const target = FRESH_EXPECTED_COUNTS;
  foot(
    c,
    b === 0
      ? 'Reference: ' +
          target.matches +
          '/' +
          target.total +
          '     Which copy gives the scorer its fifth match?'
      : b === 1
        ? 'Red dial mark = two-thirds. Which copy would you repair?'
        : b === 2 && edited
          ? 'Host row restored from Git. The last run still reads 4/7.'
          : b === 2
            ? 'Check the committed prediction before editing the host file.'
            : at(3, 'The image stayed fixed', 0)
              ? 'Same image. Repaired host file. The new run matches the 5/7 reference.'
              : 'A fresh container opens the repaired host file.',
  );
}
export const release = [gpu, probes, identity, ci, handover, practice];
