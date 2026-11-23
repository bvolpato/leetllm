import { createHash } from 'node:crypto';
import { FIXTURE, PROJECT_FILES } from '../../../films/docker-containerization-reproducible-ai/fixtures.mjs';
import {
  BASE_KEYS,
  REQUIREMENT_KEYS,
  SOURCE_KEYS,
  reportLines,
  score,
  stageContents,
} from '../../../films/docker-containerization-reproducible-ai/model.mjs';
import {
  C,
  box,
  cap,
  circle,
  display,
  folder,
  foot,
  label,
  lerp,
  mono,
  plate,
  tape,
  well,
  wire,
} from './artwork.mjs';

export const projectLane = (f) =>
  !f.keep ? 'excluded' : f.path === 'requirements.txt' ? 'builder' : f.copy ? 'runtime' : 'recipe';
export const member = (builder, target) => ((target ?? builder) === 'amd64' ? 'A' : 'B');
const bytes = (v) => createHash('sha256').update(v).digest('hex');
export const wheels = ['wheel A teaching bytes', 'wheel B teaching bytes'].map(bytes);
export const acceptsWheel = (hash, approved) => approved.includes(hash);

function opening(c, { at, b }) {
  const base = at(1, 'Python three twelve'),
    script = at(1, 'Copy in'),
    run = at(2, 'Run the image');
  const entrypoint = at(2, 'This time Python', 0);
  const read = at(2, 'Later', 0);
  if (!base) {
    folder(c, 45, 113, 1110, 192, 'access-rag  /  fresh clone', [], C.ice);
    mono(c, 75, 223, 'scripts/score_access_requests.py', 36);
    mono(c, 75, 270, 'eval/access_requests.jsonl', 36);

    well(c, 45, 326, 1110, 237, 'TEAMMATE’S SHELL');
    mono(c, 75, 415, '$ python scripts/score_access_requests.py', 40, { color: C.pale });
    const wordWidth = c.measureText('python').width;
    const start = 75 + c.measureText('$ ').width;
    const focus = at(0, 'Watch the first word', 0.3);
    if (focus) box(c, start, 443, wordWidth * focus, 6, C.gold, 2);
    if (at(0, 'find Python'))
      mono(c, 75, 510, 'bash: python: command not found', 38, { color: C.blush });
    if (b === 1) foot(c, 'docker build -t access-rag:local .');
    else if (at(0, 'Which part of this run', 0))
      foot(c, 'Which part of this run must the laptop supply?');
    return;
  }
  well(c, 60, 143, 502, 389, 'IMAGE  /  BUILD CONTENTS');
  plate(c, 91, 424, 440, 78, 'Python 3.12', C.ice, 'python:3.12-slim-trixie');

  if (script > 0) {
    plate(
      c,
      91,
      lerp(251, 342, script),
      440,
      70,
      'Score access requests',
      C.ice,
      'scripts/score_access_requests.py',
    );
    plate(c, 91, lerp(161, 254, script), 440, 70, 'Three requests', C.ice, 'eval/access_requests.jsonl');
  }
  const terminalX = b === 2 ? 800 : 628;
  if (b === 2) {
    wire(c, [[562, 390], [terminalX, 390]], C.blue, run);
    if (entrypoint)
      mono(c, 681, 363, 'Python → scorer', 22, { align: 'center', color: C.blue });
  }
  display(
    c,
    terminalX,
    184,
    1140 - terminalX,
    294,
    b < 2 ? 'TEAMMATE’S SHELL' : 'RUNNING CONTAINER  /  STDOUT',
    b < 2
      ? [
          { t: '$ python scripts/score_access_requests.py', size: 20 },
          { t: 'bash: python: command not found', color: C.blush },
        ]
      : [{ t: read ? reportLines(score(FIXTURE))[0] : '', color: C.mint, size: 32 }],
  );
  foot(
    c,
    b === 1 ? 'docker build -t access-rag:local .' : 'Host shell   $ docker run --rm access-rag:local',
  );
}

function contract(c, { at, b }) {
  if (!b) {
    well(c, 64, 145, 560, 397, 'STORED IMAGE');
    ['Python + OS libraries', 'Installed packages', 'Scorer + three test rows'].forEach((v, i) =>
      plate(c, 90, 220 + i * 91, 508, 74, v, C.ice),
    );
    const p = at(0, 'supply the file');
    folder(c, lerp(823, 760, p), 248, 348, 185, 'A different day', ['host/eval/', 'arrives at run time']);
    foot(c, 'This local comparison needs Python, the scorer and its input rows.');
    return;
  }
  const vm = b === 2;
  plate(c, 70, 238, 315, 135, 'Docker client', C.ice, 'docker version');
  wire(
    c,
    [
      [385, 314],
      [450, 314],
      [450, 266],
      [543, 266],
    ],
    C.blue,
    at(1, 'client sends'),
  );
  well(c, 543, 143, 583, 388, vm ? 'DOCKER DESKTOP  /  LINUX VM' : 'LINUX ENGINE HOST');
  if (at(1, 'server in the response', 0.48, 'Look for the server'))
    plate(c, 578, 216, 516, 93, 'Docker Engine', C.mint, 'Server');
  if (at(1, 'shares that host') || vm) {
    plate(
      c,
      578,
      371,
      516,
      94,
      vm ? 'VM’s Linux kernel' : 'Host’s Linux kernel',
      C.ice,
      'processes  /  memory  /  devices',
    );
    wire(
      c,
      [
        [835, 310],
        [835, 370],
      ],
      C.ice,
    );
  }
  foot(
    c,
    vm
      ? 'Mac or Linux Desktop  →  Linux VM  →  shared Linux kernel'
      : 'docker version    Client  →  Server',
  );
}

function context(c, { at, b }) {
  const filter = at(1, 'Apply the rules'),
    copy = at(2, 'three copy instructions', 0.48, 'Follow the three copy instructions');
  cap(c, 64, 139, 'PROJECT');
  cap(c, 532, 139, 'BUILD CONTEXT');
  cap(c, 825, 139, 'DESTINATION');
  const guide = filter > 0 ? '#7b8f89' : '#bbc0b4';
  box(c, 524, 157, 258, 379, '#d0d3c3', 9, guide, 2);
  if (filter > 0) cap(c, 542, 551, '.dockerignore', { color: C.green });
  PROJECT_FILES.forEach((f, i) => {
    const y = 182 + i * 53,
      lane = projectLane(f),
      blocked = lane === 'excluded' && filter > 0;
    box(c, 62, y - 18, 420, 36, f.keep ? C.ice : C.gold, 3, C.line, 1);
    mono(c, 72, y, f.path, 19, { max: 394 });
    box(c, 546, y - 14, 212, 29, C.ink, 3);
    wire(
      c,
      [
        [482, y],
        [blocked ? 581 : 778, y],
      ],
      blocked ? C.red : C.blue,
      1,
      4,
    );
    if (blocked) {
      box(c, 577, y - 17, 9, 34, C.red, 2);
      cap(c, 605, y, 'excluded', { color: C.blush });
    } else if (copy > 0) {
      wire(
        c,
        [
          [778, y],
          [815, y],
        ],
        C.blue,
        copy,
        3,
      );
      label(c, 827, y, lane === 'recipe' ? 'Dockerfile instructions' : lane, 22, {
        bold: true,
        color: C.green,
      });
    }
    if (!blocked) {
      circle(c, 748, y, 5, C.mint);
    }
  });
  foot(
    c,
    b === 0
      ? 'Eligibility is permission to read. BuildKit can omit unused transfers.'
      : b === 1
        ? '.dockerignore excludes local files before COPY selects its inputs.'
        : at(2, 'builder stage itself')
          ? 'COPY --from=builder /opt/venv /opt/venv   ←   stage filesystem'
          : 'COPY requirements.txt   /   COPY scripts/…   /   COPY eval/',
  );
}

function assembly(c, { b, at }) {
  const venv = at(0, 'makes a virtual environment', 0.48, 'The builder makes a virtual environment'),
    emptyRequirements = at(0, 'pip finds an empty requirements file', 0, false),
    copy = at(1, 'copies the environment', 0.48, 'It copies the environment'),
    pathSet = at(1, "Set the runtime's search path", 0, false),
    app = at(1, 'Now copy'),
    evalRows = at(1, 'and evaluation rows', 0, false),
    user = at(2, 'selects an application account'),
    entrypoint = at(2, 'The entrypoint records', 0, false);
  well(c, 60, 144, 425, 410, 'STAGE 1  /  BUILDER');
  well(c, 716, 144, 425, 410, 'STAGE 2  /  RUNTIME');
  for (const x of [82, 738])
    plate(c, x, 449, 381, 74, 'Same Python base', C.ice, 'python:3.12-slim-trixie');
  if (!b && emptyRequirements)
    mono(c, 84, 272, 'requirements.txt  •  0 packages', 19, { color: C.gold, max: 375 });
  if (venv)
    plate(c, 82, 341, 381, 81, '/opt/venv', C.mint, emptyRequirements ? 'pip install -r requirements.txt' : '');
  if (copy > 0) {
    wire(
      c,
      [
        [485, 390],
        [715, 390],
      ],
      C.green,
      copy,
    );
    plate(c, lerp(489, 738, copy), 341, 381, 81, '/opt/venv', C.mint, 'Copied files');
  }
  if (pathSet) mono(c, 743, 203, 'PATH starts with /opt/venv/bin', 20, { color: C.mint });
  if (app > 0)
    plate(c, 738, 250, 381, 75, evalRows ? 'Scorer and fixture' : 'Scorer', C.ice,
      evalRows ? '/app/scripts   /app/eval' : '/app/scripts');
  if (user > 0) cap(c, 743, 230, 'USER appuser', { color: C.gold });
  let instruction = b === 0
    ? 'FROM python:3.12-slim-trixie AS builder'
    : 'FROM python:3.12-slim-trixie AS runtime';
  if (b === 0) {
    if (venv) instruction = 'RUN python -m venv /opt/venv';
    if (emptyRequirements) instruction = 'requirements.txt is empty. The scorer uses the standard library.';
  } else {
    if (copy) instruction = 'COPY --from=builder /opt/venv /opt/venv';
    if (pathSet) instruction = 'ENV PATH="/opt/venv/bin:$PATH"';
    if (app) instruction = 'COPY --chown=appuser:appuser scripts/score_access_requests.py scripts/';
    if (evalRows) instruction = 'COPY --chown=appuser:appuser eval/ eval/';
    if (user) instruction = 'USER appuser';
    if (entrypoint) instruction = 'ENTRYPOINT ["python", "scripts/score_access_requests.py"]';
  }
  foot(c, instruction);
}

function inheritance(c, { b, at }) {
  if (b < 2) {
    const inherit = at(1, 'FROM builder'),
      content = stageContents(inherit > 0);
    well(c, 58, 152, 460, 379, 'BUILDER');
    well(c, 690, 152, 460, 379, inherit ? 'FROM builder' : 'FRESH PYTHON BASE + COPY');
    const rows = [
      ['/opt/venv', true],
      ['/opt/helper.bin', content.files.includes('/opt/helper.bin')],
      ['ENV TOOL_MODE=review', !!content.env.TOOL_MODE],
    ];
    rows.forEach(([name, has], i) => {
      const y = 217 + i * 90;
      plate(c, 83, y, 410, 69, name, i === 2 ? C.gold : C.ice);
      const resolved = at(1, 'Only the environment');
      wire(
        c,
        [
          [519, y + 33],
          [690, y + 33],
        ],
        has ? C.blue : C.line,
        has ? resolved : 0,
        3,
      );
      if (b === 0) mono(c, 738, y + 34, '?', 29, { color: C.gold });
      if (has && resolved) plate(c, 714, y, 412, 69, name, i === 2 ? C.gold : C.ice);
    });
    foot(
      c,
      inherit
        ? 'FROM builder inherits its filesystem and image configuration.'
        : 'COPY --from=builder selects one directory from the earlier stage.',
    );
  } else if (b < 4) {
    const fixed = at(2, 'Add the matching library');
    plate(c, 77, 232, 424, 130, 'psycopg2 extension', C.ice, '/opt/venv');
    wire(
      c,
      [
        [501, 298],
        [707, 298],
      ],
      fixed ? C.green : C.red,
      1,
    );
    if (fixed) plate(c, 707, 232, 411, 130, 'libpq.so.5', C.mint, 'Debian package: libpq5');
    else {
      well(c, 707, 232, 411, 130, 'RUNTIME LIBRARY SLOT');
      mono(c, 739, 310, 'libpq.so.5   ?', 30, { color: C.gold });
    }
    display(c, 197, 401, 806, 129, 'FRESH PYTHON PROCESS', [
      {
        t:
          b === 3 && at(3, 'import succeeds', 0.48, 'This time the import succeeds')
            ? 'import psycopg2    →    OK'
            : b === 3
              ? 'import psycopg2'
              : at(2, 'can’t find', 0.48, "The loader can't find")
                ? 'ImportError    •    libpq.so.5 missing'
                : 'python -c "import psycopg2"',
        color: C.pale,
      },
    ]);
    foot(c, 'A copied Python extension can still depend on a shared OS library.');
  } else {
    folder(
      c,
      64,
      174,
      498,
      273,
      '/app',
      ['scripts/score_access_requests.py', 'eval/access_requests.jsonl'],
      C.ice,
    );
    const selected = at(5, 'selects the account', 0.48, 'USER selects the account');
    display(c, 644, 169, 498, 308, 'LAUNCH SETTINGS', [
      { t: 'WORKDIR  /app' },
      { t: 'COPY --chown=appuser:appuser', size: 20 },
      { t: selected ? 'USER     appuser' : 'File owner: appuser', color: C.mint },
      { t: b === 5 ? 'argv[1]  scripts/score_access_requests.py' : '', size: 19 },
    ]);
    wire(
      c,
      [
        [644, 378],
        [562, 378],
      ],
      C.blue,
      1,
    );
    foot(c, 'Working directory, file owner and process user answer different questions.');
  }
}

function platform(c, { b, at }) {
  const deployment = at(3, 'For Linux on x86', 0, false);
  if (!deployment) {
    const requested = at(1, 'ask both builders for Linux on Arm', 0);
    const route = at(1, 'Follow the two lines', 0.8);
    cap(c, 68, 145, 'BUILDERS');
    cap(c, 720, 145, b ? 'MEMBERS OF THE PINNED INDEX' : 'MEMBERS OF THE TAGGED INDEX');
    ['amd64', 'arm64'].forEach((arch, i) => {
      const y = 220 + i * 165;
      plate(c, 65, y, 346, 99, i ? 'Arm laptop' : 'x86 worker', C.ice, 'native linux/' + arch);
      const socket = (choice) => (choice === 'A' ? 269 : i ? 450 : 418);
      const endY = lerp(socket(member(arch)), socket(member(arch, 'arm64')), route);
      wire(
        c,
        [
          [411, y + 49],
          [464 + i * 37, y + 49],
          [655, endY],
          [718, endY],
        ],
        i ? C.amber : C.blue,
        at(0, 'By default'),
        4,
      );
      plate(c, 718, y, 410, 99, ['A', 'B'][i] + '    linux/' + arch, i ? C.gold : C.ice);
    });
    let caption = 'python:3.12-slim-trixie    →    multi-platform index';
    if (b === 1) {
      caption = 'The index digest fixes the set of members. Each builder still selects its native platform.';
      if (requested) caption = 'Requested on both builders:  --platform linux/arm64';
      if (route === 1 && at(1, 'Both machines test'))
        caption = '--platform linux/arm64     Both builders select member B.';
    }
    if (b === 2) caption = 'Production needs linux/amd64. Which run exercised member A?';
    if (b === 3) caption = 'Both tests used member B.';
    foot(c, caption);
  } else {
    const app = at(3, 'Add the scorer'),
      test = at(3, 'Run that application'),
      promote = at(3, 'promote the scorer');
    plate(c, 63, 227, 300, 145, 'Base A', C.ice, 'linux/amd64');
    wire(
      c,
      [
        [363, 305],
        [448, 305],
      ],
      C.blue,
      app,
    );
    if (app) plate(c, 448, 227, 312, 145, 'Application image', C.mint, 'base + scorer + fixture');
    wire(
      c,
      [
        [760, 305],
        [845, 305],
      ],
      C.green,
      test,
    );
    if (test) plate(c, 845, 227, 294, 145, 'Target test', C.mint, 'run on linux/amd64');
    if (promote)
      tape(c, 327, 427, 545, 101, C.pale, 'VERIFIED REGISTRY REFERENCE', ['access-rag@sha256:…']);
    let caption = 'Start the deployment build from member A.';
    if (app) caption = 'Test the application built from A on linux/amd64.';
    if (promote) caption = 'The registry digest belongs to the tested application image.';
    foot(c, caption);
  }
}

function dependencies(c, { b, at }) {
  if (b === 2) {
    folder(c, 75, 168, 456, 329, 'Dependency specifications', ['requirements.txt', 'uv.lock'], C.ice);
    const p = at(2, 'opens requirements', 0.48, 'It opens requirements');
    wire(
      c,
      [
        [532, 268],
        [654, 268],
        [654, 308],
        [725, 308],
      ],
      C.green,
      p,
    );
    display(c, 725, 211, 408, 230, 'INSTALLER', [
      { t: 'pip install -r' },
      { t: 'requirements.txt', color: C.mint },
    ]);
    foot(c, 'Export the reviewed lock into the file pip reads, or use a frozen install.');
    return;
  }
  const wheel = b === 3 ? 1 : 0,
    rejected = at(3, 'rejects the download', 0.48, 'Pip rejects the download'),
    observed = wheels[wheel],
    ok = acceptsWheel(observed, [wheels[0]]);
  if (b === 4) {
    tape(c, 70, 190, 490, 233, C.ice, 'APPROVED SOURCE ARCHIVE', [
      'source bytes fixed',
      '+ compiler',
      '+ system libraries',
    ]);
    tape(c, 636, 190, 490, 233, C.gold, 'WHEEL-ONLY INSTALL', [
      'clean environment',
      'no approved wheel',
      'for this platform',
    ]);
    if (at(4, 'install stops'))
      foot(c, '--only-binary=:all:     No compatible approved wheel → installation stops.', C.red);
    else foot(c, 'The source archive hash covers the input to the compiler.');
    return;
  }
  cap(c, 72, 143, 'EXAMPLE RELEASE 1.0   /   SHA-256 PREFIXES');
  [0, 1].forEach((i) =>
    plate(
      c,
      72,
      209 + i * 136,
      423,
      107,
      i ? 'Wheel B' : 'Wheel A',
      i ? C.gold : C.ice,
      wheels[i].slice(0, 12),
    ),
  );
  wire(
    c,
    [
      [495, 262 + wheel * 136],
      [574, 262 + wheel * 136],
      [648, 316],
      [698, 316],
    ],
    C.blue,
    at(0, 'Compare their hashes'),
  );
  tape(c, 697, 207, 438, 215, C.pale, 'APPROVED IN requirements.txt', [
    'version 1.0',
    wheels[0].slice(0, 12),
    b === 3 && rejected ? (ok ? 'accepted' : 'hash mismatch') : '',
  ]);
  // The two bands encode the same prefix printed on the wheel and approval slip.
  const marks = (x, y, sha) => {
    const bits = BigInt('0x' + sha.slice(0, 12))
      .toString(2)
      .padStart(48, '0');
    for (let i = 0; i < bits.length; i++) box(c, x + i * 7, y, 4, bits[i] === '1' ? 28 : 11, C.iron);
  };
  cap(c, 72, 488, 'OFFERED WHEEL');
  cap(c, 697, 488, 'APPROVED WHEEL');
  marks(72, 510, observed);
  marks(697, 510, wheels[0]);
  foot(
    c,
    b === 3 && rejected
      ? 'Fresh download rejected. Installed packages may satisfy a requirement without downloading.'
      : b === 1
        ? '--require-hashes applies to the pinned dependency closure.'
        : 'Two distributions can carry the same version and different bytes.',
    b === 3 && rejected ? C.red : C.ink,
  );
}

function cache(c, { b, at }) {
  const scorerEdit = at(1, 'Docker looks up', 0) && !at(2, 'This time', 0);
  const requirementsEdit = at(2, 'The cache has no entry', 0);
  const next = requirementsEdit ? REQUIREMENT_KEYS : scorerEdit ? SOURCE_KEYS : BASE_KEYS;
  const lookedUp = requirementsEdit ? at(2, 'Installation now', 0) : at(1, 'so Docker runs', 0);
  cap(c, 66, 139, 'CACHED BUILD');
  cap(c, 660, 139, requirementsEdit ? 'REQUIREMENTS EDIT' : scorerEdit ? 'SCORER EDIT' : 'CURRENT BUILD');
  ['base', 'install', 'application'].forEach((k, i) => {
    const y = 190 + i * 117,
      same = BASE_KEYS[k] === next[k],
      pending = !same && !lookedUp,
      title = ['Base image', 'Install from requirements', 'Copy application inputs'][i];
    plate(c, 62, y, 404, 92, title, C.ice, BASE_KEYS[k]);
    wire(
      c,
      [
        [467, y + 45],
        [656, y + 45],
      ],
      same ? C.green : pending ? C.edge : C.red,
      1,
      4,
    );
    plate(
      c,
      656,
      y,
      478,
      92,
      title,
      same ? C.mint : pending ? C.pale : C.gold,
      next[k] + (same ? '   cache hit' : pending ? '   checking…' : '   cache miss'),
    );
    // Read the two key prefixes as punched bit patterns either side of the seam.
    [BASE_KEYS[k], next[k]].forEach((key, side) => {
      const bits = parseInt(key.slice(0, 4), 16).toString(2).padStart(16, '0');
      [...bits].forEach((bit, j) => {
        const x = side ? 564 : 554;
        box(
          c,
          x + (side ? 0 : -28),
          y + 2 + j * 5.4,
          bit === '1' ? 30 : 13,
          3.9,
          side && !same && !pending ? C.amber : C.iron,
        );
      });
    });
  });
  let caption = 'Short teaching keys stand for the inputs to each operation.';
  if (b === 1) {
    caption = 'Change only the scorer. Which keys will still match?';
    if (scorerEdit) caption = 'Read the copy key beside its cached value.';
    if (lookedUp) caption = 'Docker runs the application copy again. The install result is reusable.';
  } else if (b === 2) {
    caption = scorerEdit ? 'Restore the original scorer.' : 'Now edit requirements.txt. Which key changes first?';
    if (requirementsEdit) caption = 'Compare the install key with the one in the cache.';
    if (requirementsEdit && lookedUp) caption = 'The install key misses. Docker runs the installation again.';
  }
  foot(c, caption);
}

export const builders = [
  opening,
  contract,
  context,
  assembly,
  inheritance,
  platform,
  dependencies,
  cache,
];
