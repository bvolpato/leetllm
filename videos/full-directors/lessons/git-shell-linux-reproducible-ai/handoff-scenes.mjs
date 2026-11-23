import {
  C,
  beat,
  cue,
  afterCue,
  mix,
  rect,
  stroke,
  poly,
  dot,
  txt,
  mono,
  mid,
  rail,
  commandRail,
  plate,
  printout,
  terminal,
  disk,
  folder,
  wire,
  stamp,
  fade,
  bolt,
} from './atelier.mjs';
import {
  rows,
  score,
  labelScore,
  match,
  freshRows,
  eight,
  rowId,
  fixturePath,
  deviceEnumeration,
  lfsPayload,
  lfsPointer,
  lfsDigest,
  lfsAdd,
  lfsRule,
  cloneFile,
  cloneCommands,
  cloneTrial,
  callerCommands,
} from './run.mjs';
import { lane, gauge } from './checkout.mjs';

export function environment(c, k) {
  const b = beat(k);
  if (b <= 2) {
    const built = cue(k, 1, 'Build a new virtual environment'),
      selected = cue(k, 1, 'verify the version');
    printout(
      c,
      60,
      172,
      488,
      325,
      'Tracked setup',
      ['activate.sh', '.python-version', 'requirements.txt'],
      { size: 27, step: 61 },
    );
    wire(c, 549, 334, 719, 334, built);
    terminal(c, 720, 164, 498, 342, 'New checkout', [
      '$ source ./activate.sh',
      built ? '.venv/bin/python' : null,
      selected ? ['Python ≥ 3.12', C.green] : null,
      b === 2 ? 'packages: complete lock' : null,
    ]);
    rail(
      c,
      'requirements.txt',
      b === 1 ? 'stdlib scorer  •  no packages' : 'include transitive dependencies',
    );
  } else if (b === 3) {
    const local = cue(k, 3, 'copy the template');
    const filled = cue(k, 3, 'Set the key');
    printout(c, 59, 183, 526, 260, '.env.example', ['ACCESS_API_KEY=', 'tracked template'], {
      size: 28,
      step: 66,
    });
    wire(c, 585, 306, 711, 306, local);
    if (local)
      printout(
        c,
        712,
        183,
        506,
        260,
        '.env',
        [filled ? 'ACCESS_API_KEY=••••' : 'ACCESS_API_KEY=', 'ignored local copy'],
        {
          size: 28,
          step: 66,
        },
      );
    rail(c, 'cp .env.example .env', 'optional for an app that needs a key');
  } else {
    disk(c, 114, 159, 363, 'Git object', ['LFS pointer', 'oid sha256:…', 'size in bytes']);
    wire(c, 479, 328, 763, 328, cue(k, 4, 'fetches separate bytes'));
    plate(c, 765, 203, 410, 228, '#a6bca2');
    mid(c, 'Model storage', 970, 271, 38, C.ink);
    for (let i = 0; i < 6; i++) {
      rect(c, 804 + i * 56, 313, 38, 58, '#314f44', 4);
      stroke(
        c,
        [
          [809 + i * 56, 381],
          [836 + i * 56, 381],
        ],
        '#806837',
        6,
      );
    }
    rail(c, 'git lfs pull', 'verify required payloads');
  }
}
export function setup(c, k) {
  const b = beat(k);
  if (b <= 2) {
    const active = cue(k, 1, 'activates it', 0),
      verified = cue(k, 1, 'at least three point twelve', 0),
      exported = cue(k, 1, 'exports the environment', 0, 'It exports the environment');
    printout(
      c,
      62,
      164,
      388,
      305,
      'Interpreter selection',
      [
        '.python-version     3.12',
        'version manager hint',
        verified ? 'sys.version_info ≥ (3, 12)' : '',
      ],
      { size: 24, step: 59 },
    );
    terminal(c, 490, 164, 724, 323, 'Destination', [
      '$ python3 -m venv .venv',
      active ? '$ source .venv/bin/activate' : null,
      verified ? ['verified in this checkout', C.green] : null,
      exported ? '$ export PYTHON_BIN="$VIRTUAL_ENV/bin/python"' : null,
    ]);
    rail(
      c,
      b === 2 ? 'Rebuild .venv in the destination.' : 'source ./activate.sh',
      b === 2 ? 'paths can be absolute' : '',
    );
  } else if (b <= 4) {
    const pip = cue(k, 3, 'With pip');
    printout(
      c,
      63,
      166,
      540,
      333,
      'uv project',
      ['pyproject.toml', 'uv.lock', 'uv sync --locked'],
      { size: 29, step: 62 },
    );
    if (pip)
      printout(
        c,
        672,
        166,
        540,
        333,
        'pip requirements',
        [
          'direct + transitive pins',
          'accepted artifact hashes',
          'pip install --require-hashes \\',
          '    -r requirements.txt',
        ],
        { size: 25, step: 51 },
      );
    rail(
      c,
      'Python packages',
      b === 4 ? 'OS and driver belong to the host' : 'record the dependency closure',
    );
  } else {
    const failed = cue(k, 5, 'returns one in the helper'),
      bubbled = cue(k, 5, 'source returns one', 0.6, 'Now source returns one'),
      blocked = cue(k, 6, 'two ampersands'),
      semi = cue(k, 6, 'A semicolon');
    if (b < 7) {
      terminal(
        c,
        60,
        137,
        1160,
        185,
        'activate.sh  •  exported PYTHON_BIN points to a missing interpreter',
        [
          failed
            ? [
                'helper returns 1    →    cleanup' + (bubbled ? '    →    source returns 1' : ''),
                C.red,
              ]
            : 'looking for Python…',
        ],
      );
      printout(c, 61, 368, 1158, 206, 'Caller  •  errexit off (set +e)', callerCommands, {
        size: 27,
        step: 64,
      });
      if (blocked) mono(c, '→  runner skipped', 854, 460, 25, '#285240', 329);
      if (semi) mono(c, '→  runner starts', 854, 524, 25, '#923e30', 329);
      rail(c, 'source ./activate.sh', 'caller receives setup status');
    } else {
      printout(c, 83, 183, 536, 278, '.env', ['ACCESS_API_KEY=…', 'private local data'], {
        size: 29,
        step: 64,
      });
      terminal(c, 666, 174, 538, 278, 'activate.sh', ['.env stays unread', 'scorer needs no key']);
      rail(c, 'source runs shell code.', 'load trusted values deliberately');
    }
  }
}
function fan(c, x, y, r) {
  dot(c, x, y, r, '#1b3332');
  dot(c, x, y, r - 7, '#34524e');
  for (let i = 0; i < 7; i++) {
    c.save();
    c.translate(x, y);
    c.rotate((i * 2 * Math.PI) / 7);
    c.beginPath();
    c.moveTo(6, -2);
    c.quadraticCurveTo(18, -29, r - 11, -7);
    c.quadraticCurveTo(r - 7, 7, 8, 10);
    c.closePath();
    c.fillStyle = '#8baba0';
    c.fill();
    c.restore();
  }
  dot(c, x, y, 9, '#b3c1a7');
}
export function devices(c, k) {
  const b = beat(k);
  const mask = b <= 2 ? '2,0' : b === 3 || cue(k, 4, 'Unset the variable') === 0 ? '' : null;
  const now = deviceEnumeration([0, 1, 2], mask);
  const routed = afterCue(k, 2, 'Application zero maps to original CUDA device two', 0.55),
    second = afterCue(k, 2, 'application one maps to original CUDA device zero', 0.55);
  const revealEmpty = cue(k, 4, 'The host still has'),
    mapped = mask === null || (b === 2 && routed);
  mono(
    c,
    'CUDA_VISIBLE_DEVICES' + (mask === null ? '  (unset)' : '="' + mask + '"'),
    62,
    173,
    31,
    C.amber,
  );
  txt(c, 'CUDA ordinals before masking', 1212, 173, 25, C.teal, { align: 'right' });
  const x = [250, 638, 1026];
  for (let i = 0; i < 3; i++) {
    const xx = x[i] - 143;
    plate(c, xx, 203, 286, 127, '#95b39f');
    fan(c, xx + 63, 266, 46);
    mono(c, 'CUDA ' + i, xx + 125, 280, 30, C.ink);
    for (let n = 0; n < 11; n++) rect(c, xx + 63 + n * 14, 330, 9, 11, '#bdab75');
  }
  const tx = [315, 647, 979];
  if (mapped)
    now.forEach((d, i) => {
      if (b === 2 && i === 1 && !second) return;
      wire(
        c,
        x[d.physical],
        342,
        tx[i],
        455,
        b === 2 ? (i === 0 ? routed : second) : 1,
        i === 0 ? C.amber : C.teal,
      );
    });
  if (mapped)
    now.forEach((d, i) => {
      if (b === 2 && i === 1 && !second) return;
      rect(c, tx[i] - 119, 452, 238, 65, '#132f31', 6);
      mid(c, 'app index ' + d.logical, tx[i], 495, 28, C.ivory);
    });
  if (b === 1) mid(c, 'Where will application index 0 connect?', 642, 503, 37);
  if (mask === '' && (b === 3 || !revealEmpty))
    mid(c, 'Fresh process  •  how many devices?', 641, 505, 34);
  if (mask === '' && revealEmpty) mid(c, '0 devices visible', 641, 505, 45, C.amber);
  rail(
    c,
    'nvidia-smi    •    selected Python    •    framework probe',
    '3 physical GPUs on this host',
  );
}
export function objects(c, k) {
  const b = beat(k),
    pulled = cue(k, 2, 'pull it into the checkout'),
    verified = cue(k, 2, 'Its length and digest');
  if (b <= 3) {
    const digest = lfsPointer.split('\n')[1].slice('oid sha256:'.length);
    printout(
      c,
      58,
      164,
      611,
      340,
      'Git LFS pointer fields',
      [
        'version …/spec/v1',
        'oid sha256:',
        digest.slice(0, 32),
        digest.slice(32),
        'size ' + lfsPayload.length,
      ],
      { size: 24, step: 43 },
    );
    wire(c, 668, 326, 778, 326, pulled);
    plate(c, 778, 180, 429, 290, '#b3bca4');
    mid(c, pulled ? 'Checkout payload' : 'Payload required', 993, 237, 32, C.ink);
    Array.from(lfsPayload).forEach((v, i) => {
      const x = 810 + (i % 4) * 92,
        y = 270 + Math.floor(i / 4) * 73;
      rect(c, x, y, 77, 55, '#334f48', 4);
      mid(
        c,
        pulled ? v.toString(16).toUpperCase().padStart(2, '0') : '·',
        x + 38,
        y + 39,
        30,
        pulled ? C.ivory : C.faint,
      );
    });
    if (verified) stamp(c, 777, 509, 'SHA-256 and size match', true, 430);
    commandRail(
      c,
      b === 1
        ? 'git show HEAD:model.gguf'
        : b === 2
          ? 'git lfs pull'
          : 'git add .gitattributes .gitignore',
      b === 3 ? 'skeleton commit' : '8-byte teaching object',
    );
  } else {
    const tracked = cue(k, 4, 'Ask Git L F S to track'),
      removed = cue(k, 4, 'Remove the conflicting ignore pattern'),
      staged = cue(k, 4, 'stage all three paths'),
      committed = cue(k, 5, 'Commit all three changes together', 0),
      manifest = cue(k, 5, 'For changing datasets', 0);
    printout(c, 61, 151, 1158, 132, '.gitattributes', [tracked ? lfsRule : '# model attributes'], {
      size: 29,
    });
    printout(
      c,
      61,
      315,
      491,
      239,
      '.gitignore',
      [
        removed ? '(removed *.gguf)' : '*.gguf',
        removed ? 'model eligible for add' : 'model ignored',
      ],
      { size: 25, step: 55 },
    );
    terminal(
      c,
      599,
      311,
      619,
      252,
      committed
        ? 'Commit  •  git show --name-status HEAD'
        : 'Index  •  git diff --cached --name-status',
      staged
        ? [
            ['M    .gitattributes', C.green],
            ['M    .gitignore', C.green],
            ['A    model.gguf', C.green],
          ]
        : ['No staged changes'],
      { size: 23, step: 40 },
    );
    rail(
      c,
      manifest
        ? 'Versioned manifest  →  external dataset'
        : committed
          ? 'git commit'
          : removed
            ? lfsAdd
            : "git lfs track '*.gguf'",
      manifest
        ? 'record the dataset version'
        : committed
          ? 'pointer committed'
          : staged
            ? 'model staged as an LFS pointer'
            : '',
    );
  }
}
export function prove(c, k) {
  const b = beat(k),
    committed = cue(k, 1, 'then commit'),
    cloned = cue(k, 1, 'clone into it'),
    cd = cue(k, 2, 'Change into the clone'),
    found = cue(k, 2, 'Its name comes back');
  if (b < 3) {
    disk(
      c,
      82,
      157,
      350,
      committed ? 'New commit' : 'Index',
      committed
        ? ['repro.sh', 'setup scripts', '3 saved requests']
        : ['setup staged', 'stage test input'],
    );
    wire(c, 435, 328, 633, 328, cloned);
    terminal(c, 634, 153, 584, 361, 'Checking checkout', [
      '$ clone_root=$(mktemp -d)',
      cloned ? '$ git clone --no-local …' : null,
      cd ? '$ cd "$clone_root/access-rag" || exit 1' : null,
      found ? [fixturePath, C.green] : null,
    ]);
    commandRail(
      c,
      b === 1
        ? '( set -e; git clone --no-local "$repo_root" "$clone_root/access-rag"; … )'
        : 'git ls-files --error-unmatch -- eval/access_requests.jsonl',
      b === 1 ? 'cd still required' : 'lookup in clone index',
    );
  } else {
    const retry = b >= 5;
    const trial = cloneTrial(retry ? 0 : 1, cloneFile);
    const [strict, activate, repro, status] = cloneCommands;
    const installed = cue(
      k,
      retry ? 5 : 3,
      retry ? 'Repeat the check' : 'Install the tracked hook',
    );
    const sourced = cue(
      k,
      retry ? 5 : 3,
      retry ? 'Source the activation script' : 'Run the guarded source command',
    );
    const stopped = !retry && cue(k, 4, 'ends the checking subshell');
    const envReady = retry && cue(k, 5, 'setup verifies its version');
    const evaluating = envReady && cue(k, 5, 'Run the repository command');
    const result = evaluating && cue(k, 6, 'The scorer passed');
    const checking = result && trial.ranStatus && cue(k, 6, 'Ask Git for its short status');
    const clean = checking && cue(k, 6, 'It prints nothing here');
    const capture = retry ? cue(k, 7, 'save its status') : cue(k, 4, 'saves the status');
    const printed = retry
      ? cue(k, 7, 'Both checkouts used')
      : cue(k, 4, 'The scorer and Git status');
    const lines = [strict];
    if (installed) lines.push('./scripts/install_hooks.sh');
    if (sourced) lines.push(activate);
    if (stopped) lines.push(['interpreter missing', C.red], ['subshell exited', C.red]);
    if (envReady) lines.push(['…/access-rag/.venv/bin/python', C.green]);
    if (evaluating) lines.push(repro);
    if (result) lines.push([trial.result, C.green]);
    if (checking) lines.push(status);
    const cloneTitle = clean
      ? 'Fresh clone  •  clean worktree'
      : retry
        ? 'Fresh clone  •  after repair'
        : 'Fresh clone  •  missing Python';
    terminal(c, 661, 148, 565, 419, cloneTitle, lines, { step: 37, size: 23 });
    if (!retry || b >= 7) {
      terminal(
        c,
        54,
        148,
        543,
        334,
        'Parent shell  •  errexit off',
        [
          '$ ( … )',
          capture ? '$ clone_status=$?' : null,
          capture ? '$ echo "$clone_status"' : null,
          printed ? [String(trial.exit), trial.exit === 0 ? C.green : C.red] : null,
        ],
        { step: 48, size: 26 },
      );
    } else {
      terminal(c, 54, 148, 543, 334, 'Original checkout', [
        '$ ./repro.sh',
        'Eval rows: ' + rows.length,
        [labelScore(rows), C.green],
      ]);
    }
    if (stopped) txt(c, 'Scorer and status check skipped', 75, 551, 27, C.red);
    if (b >= 7 && printed) txt(c, 'Same host  •  tools, OS, driver', 75, 551, 27, C.teal);
    commandRail(c, '( ' + cloneCommands.join('; ') + ' )');
  }
}
export function practice(c, k) {
  const b = beat(k);
  if (b <= 2) {
    const required = afterCue(k, 2, 'Seven requests put the required mark at fourteen'),
      matched = afterCue(k, 2, 'Five matches put us at fifteen'),
      result = afterCue(k, 2, 'It passes'),
      printed = afterCue(k, 2, 'Five sevenths prints as zero point seven one four');
    printout(c, 55, 146, 669, 435, 'Seven saved requests', [], { size: 23 });
    mono(c, 'ID     expected      saved', 81, 234, 25, C.ink);
    freshRows.forEach((r, i) => {
      const y = 277 + i * 43;
      mono(
        c,
        rowId(r) + '    ' + r.expected.padEnd(12) + JSON.stringify(r.prediction),
        81,
        y,
        23,
        C.ink,
        582,
      );
      if (matched) {
        if (match(r))
          stroke(
            c,
            [
              [673, y - 8],
              [679, y - 2],
              [692, y - 17],
            ],
            '#27684a',
            3,
          );
        else {
          stroke(
            c,
            [
              [676, y - 16],
              [690, y - 2],
            ],
            '#9d492e',
            3,
          );
          stroke(
            c,
            [
              [690, y - 16],
              [676, y - 2],
            ],
            '#9d492e',
            3,
          );
        }
      }
    });
    if (b === 2) {
      gauge(c, 758, 214, 452, freshRows, {
        showMarker: !!required,
        showThreshold: !!required,
        showMatches: !!matched,
        showMatchCount: !!matched,
        showResult: !!result,
      });
      if (printed) stamp(c, 758, 446, labelScore(freshRows), true, 452);
    } else {
      mid(c, '3 × matches', 982, 273, 34, C.teal);
      mid(c, '≥', 982, 342, 57, C.amber);
      mid(c, '2 × requests', 982, 410, 34, C.teal);
    }
    rail(c, 'expected.strip().lower() == prediction.strip().lower()', 'exact count gate');
    return;
  }
  const append = cue(k, 3, 'Append a wrong eighth request'),
    stage = cue(k, 3, 'stage that file'),
    local = cue(k, 3, 'only in the working copy'),
    pass = cue(k, 3, 'and passes'),
    committed = afterCue(k, 3, 'You make a plain commit');
  const clone = cue(k, 4, 'Request two hundred eight came with it'),
    cross = cue(k, 4, 'moves the required mark', 1.1),
    threshold = afterCue(k, 4, 'Fifteen is below sixteen'),
    failed = afterCue(k, 4, 'the gate fails'),
    repair = cue(k, 5, 'Stage the removal'),
    newCommit = cue(k, 5, 'Record that change'),
    newClone = cue(k, 5, 'Rebuild from that commit'),
    rerun = afterCue(k, 5, 'The clone passes'),
    share = cue(k, 6, 'give them the commit and the command');
  const working = append && !local ? eight : freshRows,
    index = stage && !repair ? eight : freshRows,
    cloned = newClone ? freshRows : eight;
  lane(c, 146, 'Working file', working, '#c0d5b3', '', 8);
  lane(c, 234, 'Index', index, '#e5c99b', '', 8);
  if (clone) lane(c, 322, 'Fresh clone', cloned, '#e5c99b', '', 8);
  else {
    txt(c, 'Fresh clone', 58, 365, 28, C.faint);
    stroke(
      c,
      [
        [247, 354],
        [1199, 354],
      ],
      '#8fa094',
      2,
      [8, 9],
    );
  }
  if (b === 3) {
    if (append)
      mono(
        c,
        '208    expected ' + eight.at(-1).expected + '    saved ' + eight.at(-1).prediction,
        246,
        448,
        25,
        C.amber,
      );
    if (pass) stamp(c, 246, 478, 'Working hook   ' + labelScore(freshRows), true, 580);
    rail(
      c,
      committed
        ? 'git commit   →   records the staged file'
        : stage
          ? 'git diff --cached  →  +208'
          : 'Working file   •   append request 208',
      'what will the clone read?',
    );
  } else {
    const file = newClone ? freshRows : eight;
    const markerRows = newClone ? freshRows.length : mix(freshRows.length, eight.length, cross);
    const ready = newClone ? rerun : failed && cross === 1;
    if (clone && (!newClone || rerun))
      gauge(c, 81, 408, 628, file, {
        showResult: !!ready,
        markerRows,
        showThreshold: newClone || !!(threshold && cross === 1),
        showMatchCount: true,
      });
    if (ready)
      stamp(
        c,
        754,
        457,
        labelScore(file) + '  •  ' + (score(file).passes ? 'exit 0' : 'exit 1'),
        score(file).passes,
        432,
      );
    if (repair && !newCommit)
      rail(c, 'git diff --cached   •   − request 208', 'removal staged');
    else if (newCommit && !newClone)
      rail(c, 'git show HEAD   •   − request 208', 'earlier clone still has 8 requests');
    else if (share)
      commandRail(c, 'git rev-parse HEAD  •  ./repro.sh', 'commit ID and command');
    else
      rail(c, './repro.sh', rerun ? 'rebuilt from repaired commit' : 'inspect the committed file');
  }
}
