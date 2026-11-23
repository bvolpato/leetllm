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
  wire,
  stamp,
  fade,
  bolt,
} from './atelier.mjs';
import {
  rows,
  fixturePath,
  rowId,
  searchResult,
  pipelineStatus,
  countInputs,
  names,
  job,
  replacement,
  termLog,
  termExit,
  loopSetup,
  loopBody,
  sameProcess,
  jsonl,
  newlineCount,
} from './run.mjs';

export function search(c, k) {
  const b = beat(k),
    count = cue(k, 1, 'word count prints three');
  if (b === 1) {
    const r = rows[0];
    printout(
      c,
      66,
      169,
      638,
      361,
      'head -n 1',
      [
        '{',
        '  "prompt": "' + r.prompt + '",',
        '  "expected": "' + r.expected + '",',
        '  "prediction": "' + r.prediction + '"',
        '}',
      ],
      { size: 22, step: 46 },
    );
    mid(c, 'LF bytes in this copy', 972, 242, 31, C.teal);
    for (let i = 0; i < 3; i++) {
      rect(c, 796 + i * 119, 290, 95, 78, '#acd0cb', 4);
      mid(c, '0A', 843 + i * 119, 342, 34, C.ink);
    }
    if (count) mid(c, 'wc -l   ' + newlineCount(jsonl(rows)), 969, 467, 44, C.ivory);
    rail(c, 'head -n 1 eval/access_requests.jsonl', 'first object, expanded');
  } else {
    const missing = cue(k, 2, 'Change only the filename', 0);
    const res = searchResult({ exists: !missing });
    const command = 'grep -c denied ' + (missing ? 'eval/missing.jsonl' : fixturePath);
    const stdout = missing
      ? cue(k, 3, 'standard output is empty', 0)
      : cue(k, 2, 'Grep prints zero', 0);
    const stderr = missing ? cue(k, 3, 'The error names', 0) : stdout;
    const status = missing ? cue(k, 3, 'returns status two', 0) : cue(k, 2, 'returns status one', 0);
    mono(c, '$ ' + command, 69, 188, 34, C.ivory);
    printout(c, 67, 244, 548, 246, 'Standard output', [stdout ? res.stdout || '(empty)' : '…'], {
      size: 38,
    });
    printout(
      c,
      665,
      244,
      548,
      246,
      'Standard error',
      stderr ? (res.stderr || '(empty)').split(/ (?=No such file)/) : ['…'],
      { size: 29, step: 61 },
    );
    if (status)
      stamp(
        c,
        665,
        519,
        'exit ' + res.status + '   •   ' + (missing ? 'read error' : 'no matches'),
        !missing,
        548,
      );
    rail(c, command, missing ? 'file absent' : 'existing file');
  }
}
export function helper(c, k) {
  const b = beat(k),
    trial = cue(k, 3, 'Run it again'),
    failed = cue(k, 4, 'failed read ends');
  const result = countInputs([true, !trial, true]);
  if (b === 5) {
    const separate = cue(k, 5, 'Now declare the variable'),
      status = cue(k, 5, 'so the helper returns one');
    terminal(c, 54, 166, 564, 328, 'Declaration wraps the read', [
      'local counts=$(read_batch)',
      ['read_batch   →  1', C.red],
      ['local        →  0', C.amber],
    ]);
    terminal(c, 663, 166, 562, 328, 'Separate assignment', [
      separate ? 'local counts' : null,
      separate ? 'counts=$(read_batch) || return' : null,
      status ? ['assignment   →  1', C.red] : null,
      status ? ['helper       →  1', C.red] : null,
    ]);
    commandRail(c, 'read_batch represents the find and wc command.', 'Bash function');
    return;
  }
  const missingDir =
    b === 4 &&
    cue(k, 4, 'directory itself is missing', 0.6, 'If the directory itself is missing') &&
    !cue(k, 4, 'Back to the unreadable file');
  if (missingDir) {
    const stopped = afterCue(k, 4, 'the disk usage check stops the helper before the first read');
    terminal(c, 64, 165, 652, 328, 'Different input directory', [
      '$ ds missing',
      'du: cannot access missing',
      ['No such file or directory', C.red],
    ]);
    if (stopped)
      printout(c, 759, 181, 447, 285, 'Return before find', [
        'files opened   0',
        'total          unprinted',
      ]);
    commandRail(c, 'du -sh -- "$target" || return', 'directory check fails');
    return;
  }
  const entered = cue(k, 2, 'Find passes each complete name', 1.25);
  mono(c, 'find -exec   →   sh argv', 78, 177, 26, C.teal);
  mono(c, 'wc -l < "$file"', 861, 177, 26, C.teal);
  names.forEach((n, i) => {
    const y = 200 + i * 100,
      x = mix(79, 178, entered);
    rect(c, 164, y + 5, 635, 79, '#172d2b', 9);
    rect(c, x, y, 616, 76, trial && i === 1 ? '#e6bd9e' : '#e7dfc5', 5);
    const lines = n.split('\n');
    lines.forEach((v, j) =>
      mono(c, v, x + 23, y + (lines.length === 1 ? 47 : 33 + j * 29), 26, C.ink),
    );
    if (trial && i === result.failed)
      txt(c, 'unreadable', x + 594, y + 47, 24, '#793b28', { align: 'right' });
    if (b >= 3) {
      const show = [
        cue(k, 3, 'first file has three'),
        cue(k, 3, 'second has two'),
        cue(k, 3, 'third has one'),
      ][i];
      if (show && i < result.counts.length) mid(c, result.counts[i], 1004, y + 51, 43, C.green);
      if (failed && i === result.failed) mid(c, 'read failed', 1004, y + 50, 30, C.red);
    }
  });
  if (b === 1)
    printout(
      c,
      849,
      204,
      361,
      273,
      'Read order',
      ['du -sh -- "$target"', 'find … -exec sh …', 'wc -l < "$file"'],
      { size: 22, step: 54 },
    );
  const total = cue(k, 3, 'That makes six');
  if (total && (!trial || failed))
    stamp(
      c,
      719,
      522,
      result.total == null ? 'No total printed' : 'Total   ' + result.total,
      result.total != null,
      484,
    );
  commandRail(
    c,
    b === 4
      ? 'wc -l < "$file" || exit'
      : "find \"$target\" -type f -name '*.jsonl' -exec sh -c '…' sh {} +",
    b === 4 ? 'batch fails → find fails' : 'Linux',
  );
}
function selector(c, x, y, on) {
  rect(c, x, y, 228, 68, '#8c9b8b', 12);
  rect(c, x + 9, y + 8, 210, 52, '#213e39', 9);
  rect(c, x + 12 + (on ? 98 : 0), y + 11, 107, 46, on ? '#e7c28d' : '#bccbb2', 7);
  mid(c, on ? 'ON' : 'OFF', x + 65 + (on ? 98 : 0), y + 43, 25, C.ink);
}
export function pipeline(c, k) {
  const bad = searchResult({ exists: false }),
    down = 0;
  const printed = cue(k, 1, 'It prints zero'),
    err = cue(k, 1, 'standard error'),
    initial = cue(k, 2, 'By default'),
    flip = cue(k, 2, 'Turn on pipefail', 0),
    decision = cue(k, 2, 'the error from grep');
  mono(c, '$ grep restored eval/missing.jsonl | wc -l', 63, 179, 32);
  wire(c, 370, 295, 836, 295, cue(k, 1, 'empty stream'));
  plate(c, 66, 214, 320, 169, '#bfd0ba');
  plate(c, 841, 214, 371, 169, '#bfd0ba');
  mid(c, 'grep', 226, 278, 53, C.ink);
  mid(c, 'wc -l', 1026, 278, 53, C.ink);
  if (err) mid(c, 'exit ' + bad.status, 226, 345, 31, '#813e2b');
  if (printed) mid(c, 'stdout  0    exit 0', 1026, 345, 26, '#255141');
  mid(c, 'stdout → stdin', 615, 267, 26, C.teal);
  if (printed) mid(c, '0 bytes', 615, 349, 27, C.ivory);
  if (err) {
    stroke(
      c,
      [
        [135, 384],
        [135, 424],
        [210, 424],
      ],
      C.red,
      4,
    );
    mono(c, 'stderr: No such file or directory', 230, 435, 25, C.red);
  }
  mono(c, 'pipefail', 71, 537, 31);
  selector(c, 265, 488, flip === 1);
  if ((initial && !flip) || decision)
    stamp(
      c,
      733,
      499,
      'Pipeline exit   ' + pipelineStatus([bad.status, down], flip === 1),
      flip !== 1,
      473,
    );
  rail(
    c,
    flip ? 'set -o pipefail' : 'Bash default',
    flip ? 'same stdout  •  same stderr' : 'read the pipeline status',
  );
}
export function strictShell(c, k) {
  const b = beat(k),
    statuses = [2, 7, 0];
  if (b <= 2) {
    const scan = cue(k, 1, 'take the first nonzero', 1.25),
      sel = pipelineStatus(statuses, true);
    statuses.forEach((s, i) => {
      const x = 120 + i * 384;
      plate(c, x, 214, 282, 167, '#b6c2af');
      mid(c, 'Stage ' + (i + 1), x + 141, 259, 29, C.ink);
      mid(c, 'exit ' + s, x + 141, 338, 51, C.ink);
    });
    const cx = mix(1029, 645, scan);
    poly(
      c,
      [
        [cx - 13, 420],
        [cx + 13, 420],
        [cx, 392],
      ],
      C.amber,
    );
    if (scan === 1) mid(c, 'rightmost failure  •  ' + sel, 645, 480, 32, C.amber);
    commandRail(
      c,
      b === 1 ? 'set -o pipefail' : 'pipeline_status=$?',
      b === 2 ? 'capture immediately' : 'foreground pipeline completed',
    );
  } else if (b === 3 && cue(k, 3, 'Now look at the function') === 0) {
    const fallback = cue(k, 3, 'Bash can use the fallback');
    terminal(c, 103, 158, 1058, 368, 'Bash with nounset', [
      '$ set -u',
      '$ echo "$UNSET"',
      ['UNSET: unbound variable', C.red],
      fallback ? '$ echo "${UNSET:-fallback}"' : null,
      fallback ? ['fallback', C.green] : null,
    ]);
    commandRail(c, '${UNSET:-fallback}', 'explicit default');
  } else if (b === 6) {
    const c1 = searchResult(),
      c2 = searchResult({ exists: false });
    printout(
      c,
      78,
      193,
      536,
      279,
      'A valid search',
      ['grep -q denied …', 'exit ' + c1.status, 'handle no matches'],
      { step: 60, size: 29 },
    );
    printout(
      c,
      668,
      193,
      536,
      279,
      'A read error',
      ['grep -q denied missing', 'exit ' + c2.status, 'propagate failure'],
      { step: 60, size: 29 },
    );
    commandRail(c, 'if grep -q …; then …; else search_status=$?; fi');
  } else {
    const printed = cue(k, 5, 'That successful print'),
      fixed = cue(k, 5, 'explicit return'),
      stop = cue(k, 5, 'The function returns one');
    terminal(
      c,
      59,
      153,
      693,
      395,
      'set -e   •   tested function',
      [
        'probe() {',
        fixed ? '  false || return' : '  false',
        '  printf "continued\\n"',
        '}',
        'if probe; then echo accepted; fi',
      ],
      { size: 27, step: 51 },
    );
    printout(
      c,
      795,
      183,
      413,
      288,
      'Standard output',
      fixed ? ['(empty)'] : printed ? ['continued', 'accepted'] : ['…'],
      { size: 34, step: 66 },
    );
    if ((printed && !fixed) || stop)
      stamp(c, 797, 499, 'Function exit  ' + (fixed ? '1' : '0'), !fixed, 411);
    commandRail(c, fixed ? 'false || return' : 'if probe; then …; fi', 'Bash tests the function');
  }
}
export function remote(c, k) {
  const b = beat(k);
  if (b === 1) {
    const installed = cue(k, 1, 'install its TERM trap'),
      checked = cue(k, 1, 'writes the next check number');
    terminal(
      c,
      54,
      155,
      655,
      364,
      'scripts/eval_loop.sh',
      [...loopSetup.slice(0, -1), [loopSetup.at(-1), installed ? C.teal : C.ivory]],
      { step: 38, size: 24 },
    );
    printout(c, 751, 163, 473, 347, 'Then enter the loop', loopBody, { step: 41, size: 24 });
    rail(
      c,
      installed ? './scripts/eval_loop.sh' : 'chmod +x scripts/eval_loop.sh',
      checked ? 'check 1' : 'from the project root',
    );
  } else if (b === 2) {
    const detached = cue(k, 2, 'SSH disconnects', 0.6, 'Now SSH disconnects'),
      second = cue(k, 2, 'another completed check', 0.6, 'It gains another completed check'),
      attached = cue(k, 2, 'Reattach to the named session');
    terminal(c, 52, 151, 559, 369, 'SSH client', [
      '$ tmux new -s eval',
      '$ ./scripts/eval_loop.sh',
      detached && !attached ? ['connection lost', C.red] : null,
      attached ? ['$ tmux attach -t eval', C.green] : null,
    ]);
    if (!detached || attached) wire(c, 611, 326, 680, 326, attached);
    else
      stroke(
        c,
        [
          [619, 327],
          [663, 327],
        ],
        C.red,
        4,
        [9, 10],
      );
    printout(c, 683, 166, 524, 324, 'Server  /  tmux: eval', ['check 1', second ? 'check 2' : ''], {
      size: 28,
      step: 64,
    });
    rail(c, 'tmux attach -t eval', 'same terminal on the server');
  } else {
    const launch = cue(k, 3, 'Start the same loop'),
      pid = cue(k, 3, 'Save its process ID'),
      priority = cue(k, 4, 'increase the loop');
    terminal(
      c,
      55,
      155,
      757,
      394,
      b === 3 ? 'Noninteractive launch' : 'Separate interactive run',
      b === 3
        ? [
            '$ mkdir -p runs',
            launch ? '$ nohup ./scripts/eval_loop.sh \\' : null,
            launch ? '    >runs/eval.log 2>&1 </dev/null &' : null,
            pid ? '$ job_pid=$!' : null,
          ]
        : ['$ tmux new -s eval-nice', priority ? '$ nice -n 10 ./scripts/eval_loop.sh' : null],
    );
    printout(
      c,
      854,
      185,
      354,
      306,
      b === 3 ? 'I/O routes' : 'Scheduler',
      b === 3
        ? ['stdin  /dev/null', 'stdout ↘', '        eval.log', 'stderr ↗']
        : ['CPU   nice +10', 'GPU   unchanged', 'reboot stops job'],
      { size: 24, step: 48 },
    );
    rail(
      c,
      b === 3 ? 'job_pid=$!' : 'nice -n 10 ./scripts/eval_loop.sh',
      b === 3 ? 'launching shell' : 'CPU contention',
    );
  }
}
function identity(c, x, y, w, title, proc) {
  printout(
    c,
    x,
    y,
    w,
    299,
    title,
    ['owner   ' + proc.owner, 'PID     ' + proc.pid, 'start   ' + proc.started, proc.command],
    { size: 26, step: 51 },
  );
}
export function processIdentity(c, k) {
  const b = beat(k);
  if (b <= 2) {
    identity(c, 66, 172, 543, 'Saved child', job);
    terminal(
      c,
      660,
      162,
      550,
      317,
      b === 1 ? 'Identify the process' : 'Before launch',
      b === 1
        ? ['$ ps -o user,pid,lstart,cmd \\', '    -p "$job_pid"', 'nvidia-smi: GPU candidates']
        : ['test -r eval/access_requests.jsonl', 'test -x scripts/run_eval.sh', 'CPU scorer'],
    );
    rail(c, 'ps -o user,pid,lstart,cmd -p "$job_pid"', 'identify your authorized job');
  } else if (b <= 4) {
    const term = cue(k, 3, 'Send TERM'),
      flushed = cue(k, 3, 'writes its final log line'),
      gone = cue(k, 3, 'PID disappears'),
      waited = cue(k, 4, 'This child returned zero');
    const marks = [
      ['TERM', term],
      ['on_term logs', flushed],
      ['exit', gone],
      ['wait', waited],
    ];
    stroke(
      c,
      [
        [154, 299],
        [1108, 299],
      ],
      '#9aa897',
      8,
    );
    marks.forEach(([s, t], i) => {
      const x = 157 + 315 * i;
      dot(c, x, 299, 27, t ? C.green : '#63796d');
      mid(c, s, x, 388, 32, t ? C.ivory : C.faint);
    });
    mono(c, 'PID ' + job.pid + '    ' + job.command, 77, 191, 29, C.teal);
    if (flushed) mono(c, 'log  ›  ' + termLog, 79, 486, 30, C.ivory);
    if (waited) stamp(c, 814, 515, 'Child exit ' + termExit, true, 369);
    commandRail(
      c,
      b === 3
        ? 'kill -TERM "$job_pid"   •   poll up to 10 × 1 s'
        : 'wait "$job_pid"   •   save status',
      'launching shell',
    );
  } else {
    const seen = cue(k, 5, 'Read the new process listing'),
      original = sameProcess(job, replacement);
    identity(c, 68, 170, 545, 'Completed child', job);
    if (seen) identity(c, 666, 170, 545, 'Current holder of PID ' + job.pid, replacement);
    if (cue(k, 6, 'Its start time is later'))
      stamp(
        c,
        665,
        508,
        original ? 'Same job' : 'Different job  •  leave it running',
        original,
        548,
      );
    commandRail(
      c,
      'kill -0 "$job_pid"',
      b === 7 ? 'KILL skips cleanup' : 'checks existence and permission',
    );
  }
}
