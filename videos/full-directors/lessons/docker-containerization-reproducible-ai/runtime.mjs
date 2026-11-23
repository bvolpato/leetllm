import { FIXTURE } from '../../../films/docker-containerization-reproducible-ai/fixtures.mjs';
import {
  permissionBits,
  score,
  visibleFixture,
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
  lerp,
  mono,
  path,
  plate,
  readerBed,
  tape,
  well,
  wire,
} from './artwork.mjs';

export function launchBind(exists, option) {
  const start = exists || option === '-v';
  return { start, existsAfter: start, reporter: start ? 'scorer' : 'Docker Engine' };
}
export const boundAccess = (owner) =>
  permissionBits(0o700, owner, 10001).traverse && permissionBits(0o644, 0, 10001).read;
export const mountFlags = (protectRoot, protectBind) => ({
  root: protectRoot ? 'read-only' : 'writable',
  bind: protectBind ? 'read-only' : 'writable',
});

function run(c, { b, at }) {
  well(c, 57, 152, 424, 323, 'STORED IMAGE');
  plate(c, 82, 216, 374, 85, 'Python 3.12', C.ice, '/opt/venv/bin/python');
  plate(c, 82, 338, 374, 85, 'Scorer + input', C.ice, '/app/scripts  /app/eval');
  const launch = at(0, 'creates a container'),
    output = at(1, 'standard output', 0.48, 'It goes to standard output');
  wire(
    c,
    [
      [481, 291],
      [644, 291],
    ],
    C.blue,
    launch,
  );
  well(c, 644, 151, 499, 209, 'CONTAINER INSTANCE');
  if (launch) plate(c, 670, 221, 444, 101, 'Python process', C.mint, 'appuser   •   reads fixture');
  at(0, 'or from the Linux virtual machine', 0);
  if (at(0, 'Linux kernel', 0.48, 'When it needs to read a file')) {
    path(
      c,
      [
        [719, 359],
        [719, 474],
      ],
      null,
      C.iron,
      5,
    );
    plate(c, 611, 470, 542, 78, 'Shared Linux kernel', C.ice, 'Engine host or Docker Desktop VM');
  }
  if (output) {
    wire(
      c,
      [
        [973, 361],
        [973, 380],
      ],
      C.green,
      output,
    );
    tape(c, 788, 381, 335, 77, C.pale, 'STANDARD OUTPUT', ['score report']);
  }
  foot(
    c,
    b ? 'docker run --rm --read-only access-rag:local' : 'docker run     image files  +  a new process',
  );
}

function permissions(c, { b, at }) {
  if (b <= 2) {
    const id = b < 2,
      found = at(0, 'reports the process user', 0.48, 'It reports the process user');
    tape(c, 65, 185, 478, 270, C.ice, 'IMAGE INSPECT', [
      'platform: linux/amd64',
      'user: appuser',
      'entrypoint: python + script',
    ]);
    display(
      c,
      619,
      166,
      524,
      313,
      id ? 'ENTRYPOINT OVERRIDE   /   id' : 'NORMAL ENTRYPOINT   /   SCORER',
      id
        ? [
            { t: '$ id' },
            { t: found ? 'uid=10001(appuser)' : '', color: C.mint },
            { t: at(0, 'Read the GID') ? 'gid=10001(appuser)' : '', color: C.mint },
          ]
        : [
            { t: 'root filesystem: read-only' },
            {
              t: at(2, 'we get a score', 0.48, 'Now we get a score') ? '0.667  (2/3)' : 'launching Python',
              color: C.mint,
            },
            { t: at(2, 'exit status', 0.48, false) ? 'exit 0' : '', color: C.mint },
          ],
    );
    foot(
      c,
      id
        ? 'docker run --rm --read-only --entrypoint id access-rag:local'
        : 'docker run --rm --read-only access-rag:local',
    );
    return;
  }
  if (b <= 4) {
    well(c, 60, 157, 495, 364, 'CONTAINER');
    plate(c, 88, 228, 440, 103, 'Scorer', C.ice, 'appuser  •  UID 10001');
    folder(
      c,
      695,
      182,
      435,
      266,
      'Engine host',
      b === 3 ? ['Docker daemon', 'management socket'] : ['writable bind', 'host file modes apply'],
    );
    if (b === 3) {
      path(
        c,
        [
          [555, 289],
          [623, 289],
        ],
        null,
        C.red,
        4,
      );
      path(
        c,
        [
          [623, 272],
          [623, 306],
        ],
        null,
        C.red,
        5,
      );
      mono(c, 91, 411, 'No daemon socket mounted', 22, { color: C.gold, max: 436 });
    } else
      wire(
        c,
        [
          [555, 289],
          [695, 289],
        ],
        C.amber,
        at(4, 'change host files'),
      );
    foot(
      c,
      b === 3
        ? 'Controlling a rootful Docker daemon can confer host-level authority.'
        : 'A writable bind still checks the process identity against host file permissions.',
    );
    return;
  }
  const fixed = at(6, 'give ownership'),
    owner = fixed ? 10001 : 0,
    readable = boundAccess(owner);
  plate(c, 59, 249, 305, 112, 'appuser', C.ice, 'UID 10001');
  folder(
    c,
    490,
    166,
    635,
    328,
    'Private host directory',
    ['eval/    owner ' + owner + '    mode 0700', 'access_requests.jsonl    mode 0644'],
    C.gold,
  );
  const y = 406;
  wire(
    c,
    [
      [221, 362],
      [221, y],
      [readable ? 873 : 475, y],
    ],
    readable ? C.green : C.red,
    1,
    5,
  );
  if (!readable)
    path(
      c,
      [
        [475, y - 17],
        [475, y + 17],
      ],
      null,
      C.red,
      6,
    );
  mono(c, 535, 454, readable ? 'directory traversed → file read' : 'traversal denied', 23, {
    color: readable ? C.green : C.red,
  });
  foot(
    c,
    b === 7
      ? 'This numeric-ID example assumes a Linux Engine without user-namespace remapping.'
      : 'The bind exposes the host directory’s owner and mode.',
  );
}

function comparison(c, { at, b, speechDone }) {
  const read = at(1, 'final pair agrees')
    ? 3
    : at(0, 'middle pair differs')
      ? 2
      : at(0, 'labels agree')
        ? 1
        : 0;
  const result = score(FIXTURE.slice(0, read)),
    all = score(FIXTURE);
  cap(c, 60, 144, 'REQUEST');
  cap(c, 211, 144, 'EXPECTED');
  cap(c, 437, 144, 'PREDICTION');
  FIXTURE.forEach((r, i) => {
    const y = 182 + i * 104,
      selected = i < read,
      good = score([r]).matches > 0;
    box(c, 58, y, 649, 79, selected ? (good ? C.mint : C.blush) : C.pale, 4, C.iron);
    mono(c, 82, y + 38, r.id, 26);
    mono(c, 210, y + 38, r.expected);
    mono(c, 437, y + 38, r.prediction);
    if (selected)
      label(c, 653, y + 38, good ? '✓' : '×', 31, { bold: true, color: good ? C.green : C.red });
  });
  dial(c, 937, 318, 132, read ? result.matches : null, 3, C.blue);
  cap(c, 937, 494, 'MATCHES  /  THREE INPUT ROWS', { align: 'center' });
  let caption = read + ' rows inspected   •   ' + result.matches + ' match' + (result.matches === 1 ? '' : 'es');
  if (b === 2) {
    if (at(2, 'If you used', 0)) caption = 'Printed: ' + all.fraction.toFixed(3) + '     Exact threshold: 2/3';
    if (at(2, 'Multiply the matches', 0)) caption = '3 × matches    ≥    2 × total rows';
    if (at(2, 'Here both sides', 0)) caption = `3 × ${all.matches}     ≥     2 × ${all.total}`;
    if (at(2, 'Equality passes', 0)) caption += `          ${3 * all.matches} ≥ ${2 * all.total}`;
    if (speechDone) caption += all.threshold ? '     →     pass' : '     →     fail';
  }
  if (b === 3) caption = 'Report printed to stdout    •    exit 0    •    --rm removes the container';
  foot(c, caption);
}

function readHead(c, { b, at, after }) {
  const cover = at(1, 'The gold host strip rises', 1.1);
  const detach = at(3, 'without the bind', 0.85);
  const overlay = cover * (1 - detach);
  const moving = overlay > 0 && overlay < 1;
  const rerun = b === 3;
  const view = visibleFixture(FIXTURE, overlay === 1 ? [] : null);
  const mounted = view.source === 'mount';
  const initialLookup = at(1, 'Follow the line from open', 0.85);
  const hostLookup = at(1, 'The same path now opens', 0.85);
  const retryLookup = at(3, 'Follow the same lookup', 0.85);
  const primary = rerun
    ? (detach === 1 ? retryLookup : 0)
    : (mounted ? hostLookup : initialLookup);
  const primaryMissing =
    !rerun &&
    view.missing &&
    primary === 1 &&
    after(1, 'The same path now opens the empty host directory');
  const fallback = b === 2 ? at(2, 'Follow the lower line', 1.05) : 0;
  const fallbackMissing =
    fallback === 1 &&
    after(2, 'Our Dockerfile copied eval and left out assets, so this lookup fails too');
  const errorNamed = fallbackMissing && after(2, 'The error names the last path it tried');
  const exited = errorNamed && after(2, 'The scorer exits with status one');
  const recovered = rerun && primary === 1 && after(3, 'Two of three again');

  const sourceX = 81;
  const sourceWidth = 475;
  const scorerX = 721;
  const primaryY = 246;
  const fallbackY = 472;
  readerBed(c, 51, 130, 531, 420);
  label(c, sourceX, 162, 'Mount point  /app/eval', 24, { bold: true });
  box(c, 69, 185, 500, 123, C.iron, 5);
  tape(c, sourceX, 191, sourceWidth, 109, C.ice, 'BAKED ROWS', [
    view.storedRows.map(row => row.id).join('     '),
  ]);
  tape(c, sourceX, lerp(324, 191, overlay), sourceWidth, 109, C.gold, 'READ-ONLY HOST BIND', [
    'Empty directory',
  ]);
  if (mounted) label(c, sourceX, 353, 'The empty bind hides the baked rows.', 24, { color: C.blue });

  const runLabel = rerun ? 'NEW CONTAINER' : mounted ? 'MOUNTED RUN' : 'IMAGE VIEW';
  well(c, scorerX, 130, 424, 420, runLabel + '   /   WORKDIR /app');
  mono(c, 747, 211, 'eval/access_requests.jsonl', 24, { color: C.pale, max: 371 });
  if (primaryMissing) mono(c, 747, 268, 'File missing', 27, { color: C.blush });
  if (recovered) {
    const { fraction, matches, total } = view.report;
    mono(c, 747, 268, fraction.toFixed(3) + '  (' + matches + '/' + total + ')', 29, { color: C.mint });
  }
  const primaryPath = [[scorerX, primaryY], [sourceX + sourceWidth, primaryY]];
  if (primary > 0 && !moving) wire(c, primaryPath, mounted ? C.amber : C.blue, primary);
  else path(c, primaryPath, null, C.line, 3);

  if (b >= 2) {
    mono(c, sourceX, fallbackY, '/app/assets', 25, { bold: true });
    mono(c, 747, 437, 'assets/access_requests.jsonl', 23, { color: C.pale, max: 371 });
    if (fallback) {
      path(c, [[752, 303], [752, 398]], null, C.line, 3);
      path(c, [[746, 392], [752, 398], [758, 392]], null, C.line, 3);
      const end = sourceX + sourceWidth;
      wire(c, [[scorerX, fallbackY], [end, fallbackY]], fallbackMissing ? C.red : C.blue, fallback);
      if (fallbackMissing) {
        path(c, [[end, fallbackY - 14], [end, fallbackY + 14]], null, C.red, 5);
        mono(c, sourceX, 516, 'Directory absent', 27, { color: C.red });
        mono(c, 747, 494, 'File missing', 27, { color: C.blush });
      }
    }
    if (exited) mono(c, 747, 527, 'exit ' + view.exitCode, 25, { color: C.blush });
    if (recovered) mono(c, 747, 494, 'Fallback skipped', 24, { color: C.ice });
  }
  if (b === 0) foot(c, 'Which rows will the scorer find after the bind?');
  if (b === 1) foot(c, '--mount type=bind,source=…,target=/app/eval,readonly');
  if (errorNamed) foot(c, view.error);
  if (recovered) foot(c, 'Same image. Same path. The baked rows are visible again.');
}

function launchHistory(c, { at, b }) {
  const options = ['--mount', '-v', '--mount'];
  const cases = [];
  let exists = false;
  for (const option of options) {
    const result = launchBind(exists, option);
    cases.push({ exists, ...result });
    exists = result.existsAfter;
  }
  const rejected = at(0, 'For a remote Engine', 0);
  const made = at(1, 'Python starts', 0);
  const removed = at(1, 'The directory stays', 0);
  const retry = at(1, 'Try the original mount flag', 0);
  const started = [rejected, at(1, 'then the scorer', 0), at(2, 'and reports', 0)];
  const reported = [rejected, at(1, 'When Python exits', 0), at(2, 'Remove the bind', 0)];
  const contents = made ? ['directory exists', '0 files'] : ['path absent'];
  if (removed) contents.push('still on host after --rm');
  folder(
    c,
    62,
    159,
    402,
    305,
    '/srv/lab/scratch',
    contents,
    made ? C.gold : C.paper,
  );
  cap(c, 527, 141, 'FLAG');
  cap(c, 727, 141, 'PYTHON');
  cap(c, 919, 141, 'ERROR FROM');
  cases.forEach((v, i) => {
    if ((i === 1 && b < 1) || (i === 2 && !retry)) return;
    const y = 200 + i * 106;
    box(c, 514, y - 26, 626, 72, C.pale, 4, C.line);
    mono(c, 536, y + 8, options[i], 23);
    if (started[i]) mono(c, 730, y + 8, v.start ? 'started' : 'idle', 21);
    if (reported[i])
      label(c, 920, y + 8, v.reporter, 23, { bold: true, color: v.start ? C.amber : C.red, max: 201 });
  });
  let caption = 'Try --mount with the missing host path. Does Python start?';
  if (rejected) caption = 'The Engine rejects the missing source before Python starts.';
  if (b >= 1) caption = 'Try -v with the same missing host path.';
  if (made) caption = 'Docker has created an empty directory on the host.';
  if (reported[1]) caption = 'The scorer reports the missing file. Remove the container.';
  if (removed) caption = 'Docker removed the container. The empty directory is still on the host.';
  if (retry) caption = 'Try --mount again. Who reports the missing file this time?';
  if (reported[2]) caption = 'The existing directory lets Python start. The scorer reports the missing file.';
  foot(c, caption);
}

function storage(c, { b, at }) {
  if (b < 2) {
    const wrote = at(0, 'save a cache entry'),
      removed = at(0, 'Remove the first container'),
      next = at(1, 'second container');
    if (removed < 1 || next)
      plate(
        c,
        71,
        240,
        392,
        135,
        next ? 'Container C2' : 'Container C1',
        C.ice,
        next ? (next === 1 ? 'reads the saved entry' : 'opening the volume') : wrote === 1 ? 'wrote a cache entry' : 'writable cache mount',
      );
    else {
      box(c, 72, 239, 390, 135, null, 6, C.line);
      label(c, 100, 305, 'C1 removed', 32, { color: C.edge });
    }
    // Three visible platters stay in place as their first client is removed.
    for (let i = 2; i >= 0; i--) {
      const y = 224 + i * 66;
      box(c, 678, y, 443, 73, C.iron);
      c.beginPath();
      c.ellipse(899.5, y + 72, 221.5, 27, 0, 0, Math.PI * 2);
      c.fillStyle = C.iron;
      c.fill();
      c.strokeStyle = C.edge;
      c.lineWidth = 2;
      c.stroke();
    }
    c.beginPath();
    c.ellipse(899.5, 222, 221.5, 45, 0, 0, Math.PI * 2);
    c.fillStyle = C.ice;
    c.fill();
    c.strokeStyle = C.iron;
    c.stroke();
    cap(c, 899, 222, 'NAMED VOLUME  /  scorer-cache', { align: 'center' });
    if (wrote === 1) tape(c, 702, 280, 399, 108, C.mint, 'SAVED ENTRY', ['cache-entry.json']);
    const pts = next
      ? [
          [673, 317],
          [461, 317],
        ]
      : [
          [464, 317],
          [673, 317],
        ];
    if (!removed || next) wire(c, pts, C.green, next || wrote);
    let caption = 'Write a cache entry to scorer-cache.';
    if (wrote === 1) caption = 'Remove C1. What will happen to cache-entry.json?';
    if (removed === 1) caption = 'C1 is gone. The named volume still holds cache-entry.json.';
    if (next) caption = next === 1 ? 'C2 reads the entry that C1 saved.' : 'Attach scorer-cache to C2.';
    foot(c, caption);
    return;
  }
  const archive = at(2, 'existing archive'),
    correct = at(3, 'intended source back', 0.48, 'Put the intended source back');
  const source = correct ? './eval' : archive ? './archive' : './missing';
  folder(
    c,
    67,
    194,
    371,
    220,
    source,
    correct ? ['intended fixture'] : archive ? ['different source'] : ['missing source'],
  );
  wire(
    c,
    [
      [438, 304],
      [632, 304],
    ],
    archive ? C.amber : C.red,
    1,
  );
  display(c, 632, 163, 504, 316, 'COMPOSE SERVICE', [
    { t: 'Service root     read-only' },
    { t: 'Input bind       read-only' },
    { t: 'target: /app/eval' },
    { t: 'create_host_path: false', color: C.gold },
  ]);
  foot(
    c,
    correct
      ? 'docker compose run --build --rm scorer'
      : archive
        ? 'An existing directory can mount successfully and still contain the wrong data.'
        : 'create_host_path: false    →    missing source stops launch',
  );
}

function compose(c, { b, at }) {
  if (b <= 1) {
    const flags = mountFlags(
      true,
      at(0, 'bind’s own read-only flag', 0.48, "Set the bind's own read-only flag") > 0,
    );
    well(c, 64, 150, 1070, 391, 'SERVICE  /  SCORER');
    plate(c, 99, 224, 446, 202, 'Root filesystem', C.ice, flags.root);
    plate(c, 649, 224, 447, 202, 'Input bind', flags.bind === 'writable' ? C.gold : C.mint, flags.bind);
    mono(c, 101, 481, 'service.read_only', 22, { color: C.ice });
    mono(c, 651, 481, 'volumes[].read_only', 22, { color: C.gold });
    foot(
      c,
      b
        ? 'image: access-rag:local    •    build: .    •    entrypoint inherited'
        : 'Set each write policy on the filesystem it protects.',
    );
    return;
  }
  if (b === 2) {
    const run = at(2, 'Run the service'),
      done = at(2, 'Python exits', 0.48, 'When Python exits');
    plate(c, 57, 219, 333, 146, 'Parse configuration', C.ice, 'compose config --quiet');
    wire(
      c,
      [
        [390, 294],
        [442, 294],
      ],
      C.blue,
      run,
    );
    plate(c, 442, 219, 299, 146, 'Build image', run ? C.mint : C.paper, '--build');
    wire(
      c,
      [
        [741, 294],
        [795, 294],
      ],
      C.green,
      run,
    );
    plate(c, 795, 219, 348, 146, 'Run scorer', run ? C.mint : C.paper, 'test the mounted file');
    foot(
      c,
      done
        ? '--rm removes the stopped container. Its image remains available.'
        : 'docker compose run --build --rm scorer',
    );
    return;
  }
  tape(c, 62, 173, 504, 306, C.ice, 'COMPOSE PLUGIN MISSING', [
    'Engine can still run',
    'docker run …',
    'optional check skipped',
  ]);
  tape(c, 633, 173, 504, 306, C.gold, 'PLUGIN INSTALLED', [
    'compose config --quiet',
    'required env file absent',
    'configuration error',
  ]);
  foot(
    c,
    b === 3
      ? 'An installed plugin must validate its configuration.'
      : 'A log level can come from an environment file. A credential needs a scoped secret.',
  );
}

function secrets(c, { b, at }) {
  if (b <= 1) {
    const on = at(1, 'mounts the selected file', 0.48, 'BuildKit mounts the selected file'),
      off = at(1, 'mount disappears'),
      out = at(1, 'download the package');
    folder(c, 67, 180, 319, 234, 'Build host', ['selected pip config']);
    well(c, 495, 151, 642, 360, b === 0 ? 'FUTURE PRIVATE INSTALL' : 'BUILD INSTRUCTION   /   RUN');
    wire(
      c,
      [
        [386, 292],
        [495, 292],
      ],
      C.amber,
      on * (1 - off),
    );
    if (on > 0 && off < 1)
      plate(
        c,
        lerp(398, 528, on * (1 - off)),
        229,
        566,
        89,
        'Mounted pip configuration',
        C.gold,
        'temporary secret file',
      );
    if (out) plate(c, 528, 358, 566, 89, 'Installed package', C.mint, '/opt/venv');
    if (!on)
      mono(c, 528, 323, b === 0 ? 'Which instruction needs access?' : 'Installer ready', 23, {
        color: C.pale,
      });
    foot(
      c,
      b === 0
        ? 'The current three-row scorer needs no credentials.'
        : 'RUN --mount=type=secret,id=pip_config,required=true …',
    );
    return;
  }
  const cloud = at(2, 'On Cloud Run'),
    read = at(2, 'reads the mounted file');
  plate(
    c,
    68,
    213,
    413,
    139,
    cloud ? 'Secret Manager' : 'Host secret file',
    C.gold,
    cloud ? 'service identity has access' : 'grant to the client service',
  );
  wire(
    c,
    [
      [481, 284],
      [685, 284],
    ],
    C.amber,
    cloud ? read : at(2, 'container starts'),
  );
  well(c, 685, 167, 452, 288, 'FUTURE API CLIENT');
  if (!cloud || read)
    plate(c, 715, 240, 392, 115, 'Runtime secret file', C.gold, 'read during execution');
  else mono(c, 722, 297, 'Deploy: access checked', 23, { color: C.mint });
  foot(
    c,
    cloud
      ? 'Cloud Run checks access at deploy and fetches the mounted value on read.'
      : 'Compose attaches the selected file when this service starts.',
  );
}

function layers(c, { b, at }) {
  if (b === 0) {
    const copied = at(0, 'debug file'),
      deleted = at(0, 'deletes the name');
    well(c, 63, 142, 663, 417, 'IMAGE LAYERS   /   CROSS SECTION');
    if (!copied) tape(c, 94, 388, 600, 102, C.pale, 'HARMLESS PLACEHOLDER', ['DEMO']);
    if (copied) plate(c, 94, 397, 600, 112, 'Earlier layer: create debug.txt', C.gold, 'contents: DEMO');
    if (deleted)
      plate(
        c,
        94,
        lerp(175, 251, deleted),
        600,
        112,
        'Later layer: delete debug.txt',
        C.ice,
        'whiteout hides the earlier name',
      );
    display(c, 778, 220, 355, 213, 'MERGED DIRECTORY', [
      { t: deleted ? 'debug.txt absent' : copied ? 'debug.txt' : 'empty', color: C.pale },
    ]);
    foot(c, 'A harmless placeholder lets us inspect what survives a later deletion.');
    return;
  }
  if (b === 1) {
    tape(c, 68, 187, 492, 258, C.ice, 'ENV', ['image configuration', 'available at run time']);
    tape(c, 638, 187, 492, 258, C.gold, 'ARG', [
      'build input',
      'may appear in history',
      'or detailed provenance',
    ]);
    foot(c, 'Keep credentials out of both image configuration and build arguments.');
    return;
  }
  if (b === 2) {
    const required = at(2, 'secret as required', 0.48, 'Mark the secret as required'),
      hit = at(2, 'cache hit');
    plate(c, 66, 233, 366, 130, 'Secret mount', C.gold, required ? 'required=true' : 'temporary input');
    wire(
      c,
      [
        [432, 296],
        [615, 296],
      ],
      C.amber,
      hit ? 0 : 1,
    );
    display(c, 615, 160, 522, 314, hit ? 'CACHE HIT' : 'EXECUTING INSTRUCTION', [
      { t: hit ? 'Reused installed files' : 'Keep package output', color: C.mint },
      { t: hit ? 'No install executed' : 'Keep logs credential-free' },
      {
        t: hit ? 'No new secret check' : required ? 'Missing secret → fail' : 'Temporary mount ends',
        color: C.gold,
      },
    ]);
    foot(c, 'required=true applies when the instruction executes.');
    return;
  }
  folder(c, 61, 175, 465, 282, 'Host secret file', [
    'restricted host permissions',
    'excluded from Git and context',
  ]);
  wire(
    c,
    [
      [526, 335],
      [654, 335],
    ],
    C.amber,
    at(3, 'mount a host secret'),
  );
  plate(c, 654, 246, 478, 153, 'Granted Compose service', C.ice, 'application user must be able to read');
  foot(c, 'Local file-backed secrets retain the host file’s storage and permission requirements.');
}
export const runtimes = [
  run,
  permissions,
  comparison,
  readHead,
  launchHistory,
  storage,
  compose,
  secrets,
  layers,
];
