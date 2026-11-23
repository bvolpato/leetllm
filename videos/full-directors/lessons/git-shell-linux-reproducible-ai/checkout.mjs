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
} from './atelier.mjs';
import {
  rows,
  wrongRow,
  four,
  hookIndex,
  cloneFile,
  workingAfterEdit,
  stagedFile,
  fixturePath,
  root,
  resolveInput,
  rowId,
  score,
  labelScore,
  match,
  bisectTrace,
  runFile,
  strictLines,
  newlineCount,
  jsonl,
} from './run.mjs';

function firstRun(c, k) {
  const scan = cue(k, 1, 'scores three saved predictions', 1.65) * rows.length;
  const open = cue(k, 1, 'Open the same project', 1.15);
  const files = cue(k, 1, 'Watch the files', 0.5);
  const copy = cue(k, 1, 'as the commit arrives', 2.55);
  const settings = cue(k, 1, 'The settings file stays', 0.55);
  const x = mix(377.5, 54, open);
  terminal(c, x, 155, 525, 300, 'Original checkout', ['$ ./repro.sh']);
  rows.forEach((r, i) => {
    const reveal = Math.max(0, Math.min(1, scan - i));
    const left = x + 35 + i * 157;
    const color = match(r) ? C.green : C.amber;
    rect(c, left, 298, 144, 77, '#203936', 4);
    mono(c, rowId(r), left + 13, 330, 28, C.ivory);
    fade(c, reveal, () => {
      mono(c, match(r) ? 'match' : 'miss', left + 13, 359, 21, color);
    });
  });
  if (scan === rows.length) {
    const result = score(rows);
    mono(c, result.correct + ' of ' + result.total + ' match', x + 35, 416, 28, C.green);
  }
  fade(c, Math.max(0, (open - 0.65) / 0.35), () =>
    terminal(c, 701, 155, 525, 300, 'Fresh clone', [
      copy === 1 ? 'Checked out HEAD' : 'Checking out HEAD…',
    ]),
  );
  const scriptLeft = 89;
  const scriptRight = 742;
  const scriptTop = 490;
  fade(c, files, () => {
    rect(c, scriptLeft, scriptTop, 190, 51, '#b7d4bc', 4);
    mono(c, 'repro.sh', scriptLeft + 21, scriptTop + 35, 27, C.ink);
    mono(c, '.env', 90, 570, 26, C.paper);
    mono(c, fixturePath, 90, 597, 26, C.paper);
    fade(c, settings, () => txt(c, 'private setting', 175, 570, 23, C.amber));
    if (copy > 0) {
      const start = scriptLeft + 215;
      stroke(c, [[start, 515], [scriptRight - 15, 515]], C.teal, 3);
      if (copy < 1) {
        dot(c, mix(start, scriptRight - 15, copy), 515, 9, C.ivory);
      } else {
        rect(c, scriptRight, scriptTop, 190, 51, '#b7d4bc', 4);
        mono(c, 'repro.sh', scriptRight + 21, scriptTop + 35, 27, C.ink);
      }
    }
  });
}

export function terminals(c, k) {
  const b = beat(k);
  if (b === 1) return firstRun(c, k);
  const ignored = cue(k, 2, 'Two exclamation marks'),
    tree = cue(k, 2, 'The script is there'),
    bad = cue(k, 3, 'Exit one'),
    pwd = cue(k, 3, 'In each window');
  const left = [
    '$ ./repro.sh',
    'Eval rows: ' + rows.length,
    ['accuracy  ' + labelScore(rows), C.green],
  ];
  const right = [];
  if (b === 2) {
    left.splice(
      0,
      3,
      '$ git status --short --ignored -- .env',
      ignored ? ['!! .env', C.amber] : null,
    );
    right.splice(
      0,
      2,
      '$ git ls-tree --name-only HEAD \\',
      '    -- .env repro.sh',
      tree ? ['repro.sh', C.teal] : null,
    );
  }
  if (b === 3) {
    right.splice(
      0,
      2,
      '$ ./repro.sh',
      bad ? ['ERROR: eval/access_requests.jsonl', C.red] : null,
      bad ? ['       missing', C.red] : null,
      bad ? ['exit 1', C.red] : null,
    );
  }
  terminal(c, 54, 155, 525, 300, 'Original checkout', left);
  terminal(c, 701, 155, 525, 300, 'Fresh clone', right);
  wire(c, 577, 319, 701, 319);
  if (b === 2) printout(c, 260, 479, 760, 110, '.gitignore excerpt', ['.env*'], { size: 22 });
  else if (pwd) {
    mono(c, root, 70, 547, 25, C.teal);
    mono(c, '/tmp/clone/access-rag', 722, 547, 25, C.teal);
  } else {
    mono(c, '.env  (private)', 72, 530, 24, C.amber);
    mono(c, fixturePath, 72, 568, 24, C.paper);
    mono(c, 'repro.sh  •  from HEAD', 722, 542, 24, C.teal);
  }
  rail(
    c,
    pwd
      ? 'pwd   •   git rev-parse --show-toplevel'
      : b === 2
        ? 'git ls-tree --name-only HEAD -- .env repro.sh'
        : './repro.sh',
    pwd ? 'cwd = repo root in each shell' : '',
  );
}
export function paths(c, k) {
  const b = beat(k),
    moved = cue(k, 1, 'Move into scripts', 1);
  if (b <= 2) {
    const xs = [100, 540, 940];
    folder(c, xs[0], 183, 255, 102, 'access-rag', moved < 0.5);
    wire(c, 355, 250, 540, 234);
    wire(c, 355, 250, 540, 399, moved);
    folder(c, xs[1], 174, 225, 97, 'eval');
    folder(c, xs[1], 348, 225, 97, 'scripts', moved >= 0.5);
    wire(c, 765, 232, 913, 232);
    printout(c, 909, 162, 322, 117, 'Fixture', ['access_requests.jsonl']);
    if (moved > 0) {
      stroke(
        c,
        [
          [765, 406],
          [904, 406],
        ],
        C.red,
        3,
        [7, 8],
      );
      mono(c, 'eval/ ? ', 932, 420, 30, C.red);
    }
    mono(c, 'pwd', 100, 492, 24, C.teal);
    mono(c, moved >= 0.5 ? root + '/scripts' : root, 100, 544, 33);
    rail(
      c,
      resolveInput(moved >= 0.5 ? 'scripts' : '.'),
      moved >= 0.5 ? 'path absent' : 'input found',
    );
  } else if (b === 3) {
    const guard = cue(k, 3, 'The guard on screen');
    terminal(c, 57, 166, 590, 358, 'One path argument', [
      'input="two lines.jsonl"',
      'head -n 1 -- "$input"',
    ]);
    plate(c, 726, 183, 470, 106);
    mid(c, 'two lines.jsonl', 961, 252, 37, C.ink);
    printout(c, 719, 334, 497, 184, 'Directory guard', [
      'cd "$repo" || exit 1',
      guard ? ['failed cd  →  stop', '#984632'] : null,
    ]);
    rail(c, 'cd "$repo" || exit 1', 'guard the next command');
  } else {
    const steps = ['git init', 'git add', 'git commit', 'git push'];
    const reach = [
      cue(k, 4, 'Init creates'),
      cue(k, 4, 'Add selects'),
      cue(k, 4, 'Commit records'),
      cue(k, 4, 'a separate push'),
    ];
    steps.forEach((v, i) => {
      const x = 54 + i * 304;
      folder(c, x, 218, 259, 122, v, reach[i] > 0);
      fade(c, reach[i], () =>
        mid(
          c,
          ['local repo', 'index', 'local history', 'remote history'][i],
          x + 129,
          396,
          31,
          C.ivory,
          258,
        ),
      );
    });
    rail(c, 'git clone', 'check out a recorded tree');
  }
}
export function findFixture(c, k) {
  const b = beat(k),
    status = cue(k, 1, 'two question marks'),
    lookup = cue(k, 1, 'without a filename');
  if (b < 3) {
    terminal(c, 53, 166, 574, 331, 'Original machine', [
      '$ git status --short -uall',
      status ? ['?? ' + fixturePath, C.amber] : null,
    ]);
    terminal(c, 652, 166, 574, 331, 'Tree at HEAD', [
      '$ git ls-tree HEAD -- \\',
      '    ' + fixturePath,
      lookup ? '$' : null,
    ]);
    if (lookup) stamp(c, 677, 531, 'No entry in this tree', false, 472);
    rail(c, 'git status --short -uall', status ? '??  untracked in this checkout' : '');
  } else {
    printout(
      c,
      77,
      167,
      625,
      330,
      fixturePath,
      [
        'request       expected     prediction',
        ...rows.map((r) => rowId(r) + '           ' + r.expected.padEnd(12) + r.prediction),
      ],
      { size: 25, step: 53 },
    );
    disk(c, 808, 186, 306, 'Track with Git', [
      b === 3 ? 'test input' : '.env.example',
      b === 3 ? '3 saved rows' : 'ACCESS_API_KEY=',
    ]);
    rail(c, b === 3 ? 'One JSON object per line' : 'ACCESS_API_KEY=', 'share names and test data');
  }
}
export function ignore(c, k) {
  const b = beat(k);
  if (b <= 2) {
    printout(c, 58, 159, 465, 374, '.gitignore', ['.env*', '!.env.example', '.venv/', 'runs/'], {
      size: 31,
      step: 59,
    });
    const except = cue(k, 2, 'makes an exception');
    const names = ['.env', '.venv/', 'runs/', '.env.example', fixturePath];
    names.forEach((name, i) => {
      const y = 165 + i * 79;
      rect(c, 565, y, 650, 55, i > 2 ? '#37594f' : '#364441', 6);
      mono(c, name, 585, y + 37, 25, C.ivory, 378);
      const label =
        i < 3
          ? 'ignored'
          : i === 3
            ? except
              ? 'eligible'
              : ''
            : cue(k, 2, 'matches no ignore rule')
              ? 'eligible'
              : '';
      txt(c, label, 1194, y + 37, 23, i < 3 ? C.amber : C.teal, { align: 'right', width: 167 });
    });
    rail(c, 'git check-ignore -v .env', 'ordinary add of a new file');
  } else {
    const removal = cue(k, 4, 'removes that selection'),
      committed = afterCue(k, 4, 'Commit the removal'),
      historical = cue(k, 4, 'old history');
    const caps = ['Working file', 'Index', 'Older commit'];
    caps.forEach((title, i) => {
      const x = 68 + i * 416;
      disk(
        c,
        x,
        173,
        310,
        title,
        [
          i === 1 && removal ? '(no entry)' : '.env',
          i === 1 && removal
            ? committed
              ? 'removal committed'
              : 'deletion staged'
            : 'placeholder',
        ],
        i === 1 ? '#9eb9cf' : '#9bb79e',
      );
    });
    mono(c, '.gitignore   + .env', 69, 500, 33, C.amber);
    if (historical) stamp(c, 714, 467, 'Earlier commit still contains .env', false, 485);
    const stagedCommand = committed ? 'git commit' : 'git rm --cached .env';
    const command = b === 3 ? 'Add .env to .gitignore' : b === 4 ? stagedCommand : 'git diff --cached';
    const note = b === 5 ? 'inspect forced additions'
      : b === 4 && committed ? 'removal recorded in new commit' : 'tracked placeholder';
    rail(c, command, note);
  }
}
export function snapshot(c, k) {
  const b = beat(k);
  const staged = cue(k, 1, 'Git copies its current contents', 1.2);
  const edited = afterCue(
    k, 2, 'change the working prediction to blocked', 0, 'Now change the working prediction to blocked',
  );
  const recorded = afterCue(k, 4, 'Escalated travels from the index', 1.2);
  const working = edited ? workingAfterEdit : rows;
  const selected = stagedFile[1];
  const expected = afterCue(k, 1, 'The expected answer is blocked');
  const workingDiff = afterCue(k, 2, 'Git diff compares these two views');
  const stagedDiff = afterCue(k, 3, 'the selected difference includes the whole row');
  const replay = cue(k, 4, 'Run both files', 0);
  const laptopResult = afterCue(k, 4, 'The laptop gets all three right');
  const cloneResult = afterCue(k, 4, 'The clone gets two');
  const recall = afterCue(k, 4, 'The working diff showed the unstaged edit');
  const columns = [
    { x: 55, title: 'Working file', file: working, accent: '#b9d6b7' },
    {
      x: 457,
      title: 'Index',
      file: staged === 1 ? stagedFile : null,
      waiting: 'No staged file',
      accent: '#e2c494',
    },
    {
      x: 859,
      title: 'New commit',
      file: recorded === 1 ? cloneFile : null,
      waiting: 'Awaiting commit',
      accent: '#e2c494',
    },
  ];
  const width = 366;
  txt(c, 'Request ' + rowId(selected), 69, 165, 32, C.ivory, { weight: 700 });
  if (expected) mono(c, 'Expected: ' + selected.expected, 311, 165, 29, C.teal);
  for (const { x, title, file, waiting, accent } of columns) {
    rect(c, x, 190, width, 252, '#102825', 8);
    txt(c, title, x + 19, 227, 30, C.ivory, { weight: 700 });
    if (!file) {
      mid(c, waiting, x + width / 2, 338, 25, C.faint);
      continue;
    }
    file.forEach((row, i) => {
      const y = 247 + i * 63;
      const focus = rowId(row) === rowId(selected);
      rect(c, x + 13, y, width - 26, 51, focus ? accent : '#29433e', 4);
      mono(c, rowId(row), x + 24, y + 35, 27, focus ? C.ink : C.faint);
      mono(c, row.prediction, x + 108, y + 35, focus ? 34 : 27, focus ? C.ink : C.faint);
    });
  }
  const transfer = b === 1 ? staged : recorded;
  if ((b === 1 || b === 4) && transfer > 0 && transfer < 1) {
    const source = b === 1 ? 0 : 1;
    const from = columns[source].x + width / 2;
    const to = columns[source + 1].x + width / 2;
    const x = mix(from, to, transfer);
    const y = 490;
    stroke(
      c,
      [
        [from, 442],
        [from, y],
        [to, y],
        [to, 442],
      ],
      C.teal,
      3,
    );
    rect(c, x - 124, y - 27, 248, 53, columns[source + 1].accent, 5);
    mid(c, rowId(selected) + '  ' + selected.prediction, x, y + 8, 28, C.ink);
  }
  if ((b === 2 && workingDiff) || recall) {
    mono(
      c,
      '− ' + selected.prediction + '       + ' + working[1].prediction,
      70,
      recall ? 574 : 506,
      30,
      C.amber,
    );
  }
  if (b === 3 && stagedDiff) {
    txt(c, 'HEAD has no fixture', 70, 500, 27, C.faint);
    mono(
      c,
      '+ ' + rowId(selected) + '  ' + selected.expected + '  ' + selected.prediction,
      columns[1].x + 19,
      500,
      27,
      C.teal,
    );
  }
  if (laptopResult)
    stamp(c, columns[0].x, 463, 'Laptop  ' + labelScore(working), score(working).passes, width);
  if (cloneResult)
    stamp(c, columns[2].x, 463, 'Clone  ' + labelScore(cloneFile), score(cloneFile).passes, width);
  if (b === 1) rail(c, 'git add ' + fixturePath, 'working file → index');
  else if (b === 2 || recall) rail(c, 'git diff', 'index → working file');
  else if (b === 3) rail(c, 'git diff --cached', 'HEAD → index');
  else if (replay) rail(c, './repro.sh', 'same expected answers');
  else rail(c, 'git commit', 'index → new commit');
}
export function gauge(
  c,
  x,
  y,
  w,
  rs,
  {
    showResult = true,
    max = 18,
    markerRows = rs.length,
    showThreshold = true,
    showMatchCount = false,
    showMarker = true,
    showMatches = true,
  } = {},
) {
  const s = score(rs),
    a = 3 * s.correct,
    z = 2 * s.total,
    px = (n) => x + 30 + ((w - 60) * n) / max;
  plate(c, x, y, w, 178, '#c0c2ab');
  mono(c, showMatchCount ? '3 × matches = ' + a : '3 × matches', x + 24, y + 38, 21, C.ink);
  stroke(
    c,
    [
      [px(0), y + 79],
      [px(max), y + 79],
    ],
    '#839484',
    8,
  );
  if (showMatches && a)
    stroke(
      c,
      [
        [px(0), y + 79],
        [px(a), y + 79],
      ],
      '#206a59',
      13,
    );
  if (showMatches) dot(c, px(a), y + 79, 10, '#225846');
  if (showMarker) {
    const markX = px(2 * markerRows);
    stroke(
      c,
      [
        [markX, y + 54],
        [markX, y + 105],
      ],
      '#91492e',
      4,
    );
    poly(
      c,
      [
        [markX - 7, y + 110],
        [markX + 7, y + 110],
        [markX, y + 99],
      ],
      '#91492e',
    );
  }
  mono(c, showThreshold ? '2 × rows = ' + z : '2 × rows', x + 24, y + 145, 22, C.ink);
  if (showResult)
    txt(
      c,
      a + (s.passes ? ' ≥ ' : ' < ') + z + '   ' + (s.passes ? 'PASS' : 'FAIL'),
      x + w - 23,
      y + 39,
      25,
      s.passes ? '#205f42' : '#853a28',
      { align: 'right', weight: 700 },
    );
}
export function scoring(c, k) {
  const nextMiss = cue(k, 2, 'Suppose the next request', 0);
  const appended = cue(k, 3, 'append request one hundred four', 0, 'Now append request one hundred four');
  const failed = cue(k, 4, 'The scorer returns failure', 0);
  const seen = [
    cue(k, 1, 'one correct and one seen'),
    cue(k, 1, 'Only the total grows'),
    cue(k, 1, 'restored request matches'),
    appended,
  ].filter((n) => n === 1).length;
  const s = score(four.slice(0, seen)),
    b = beat(k);
  printout(
    c,
    59,
    159,
    585,
    379,
    'Scorer input',
    [
      'ID       expected      saved',
      ...four
        .slice(0, seen === 4 ? 4 : 3)
        .map((r, i) => [
          rowId(r) +
            '      ' +
            r.expected.padEnd(14) +
            r.prediction +
            (i < seen ? (match(r) ? '   =' : '   ×') : ''),
          i < seen ? (match(r) ? '#205942' : '#8b4530') : C.ink,
        ]),
    ],
    { size: 25, step: 56 },
  );
  mid(c, 'Matches / rows read', 938, 206, 28, C.teal);
  mid(c, s.correct + ' / ' + seen, 938, 304, 83, C.ivory);
  const verdict = (!nextMiss && cue(k, 2, 'so this run passes')) || failed;
  if (b >= 2) gauge(c, 684, 351, 540, four.slice(0, seen), { showResult: !!verdict, max: 9 });
  if (b === 2 && nextMiss)
    mono(
      c,
      'Next request: ' + wrongRow.expected + ' expected, ' + wrongRow.prediction + ' saved',
      71,
      579,
      23,
      C.amber,
    );
  if (b === 3) {
    const insert = cue(k, 3, 'Insert a newline');
    mono(
      c,
      '103 … }' + (insert ? '   0A' : '') + (appended ? '   { 104 … }' : ''),
      71,
      579,
      23,
      C.teal,
    );
  }
  if (b === 4 && cue(k, 4, 'a score to explain'))
    mono(c, '4 valid objects    accuracy ' + labelScore(four), 71, 579, 23, C.amber);
  rail(
    c,
    b === 3 ? 'One physical line per JSON object.' : './repro.sh',
    failed
      ? 'exit 1  •  score below gate'
      : b === 2 && !nextMiss
        ? 'stdout  ' + labelScore(rows)
        : '',
  );
}
export function parsing(c, k) {
  const b = beat(k);
  if (b <= 2) {
    const bad = cue(k, 1, 'empty array');
    printout(
      c,
      59,
      163,
      629,
      368,
      'One record',
      [
        '{',
        '  "prompt": "Access request 101 status?",',
        '  "expected": "approved",',
        '  "prediction": "approved"',
        '}',
      ],
      { size: 22, step: 48 },
    );
    terminal(
      c,
      740,
      166,
      472,
      355,
      'Scorer input',
      b === 2
        ? ['missing field', 'malformed JSON', 'empty dataset', ['stop before score', C.red]]
        : ['prompt', 'expected', 'prediction', bad ? ['[]  →  object required', C.red] : null],
    );
    rail(c, 'Read UTF-8  →  decode JSON  →  validate fields', 'nonempty strings');
  } else if (b <= 5) {
    const embedded = JSON.stringify({ ...rows[0], prompt: 'Access\u2028request' });
    const blank = cue(k, 4, 'Add a second line feed');
    const sample =
      b === 3
        ? embedded
        : b === 4
          ? jsonl(rows.slice(0, 1)) + (blank ? '\n' : '')
          : jsonl(rows.slice(0, 1)).trimEnd().slice(0, -1) + ',"cost":NaN}';
    const parsed = strictLines(sample);
    const labels =
      b === 3
        ? ['"prompt": "Access', 'U+2028', 'request"']
        : b === 4
          ? ['{ … 101 … }', '0A', blank ? '0A' : '']
          : ['"cost":', 'NaN', '}'];
    plate(c, 70, 181, 1140, 161, '#9baca2');
    labels.forEach((s, i) => {
      const x = [102, 577, 824][i];
      if (!s) return;
      rect(c, x, 212, [449, 210, 354][i], 94, i === 1 ? '#35595c' : '#e6ddc2', 5);
      mid(
        c,
        s,
        x + [224, 105, 177][i],
        273,
        i === 1 ? 37 : 31,
        i === 1 ? C.teal : C.ink,
        [421, 184, 330][i],
      );
    });
    printout(
      c,
      163,
      390,
      952,
      169,
      b === 3
        ? 'Read physical LF-delimited records'
        : b === 4
          ? 'A second LF starts an empty record'
          : 'Reject nonstandard numeric constants',
      [
        b === 3
          ? 'open(path, encoding="utf-8", newline="\\n")'
          : b === 4
            ? 'for n, line in enumerate(source, 1):'
            : 'json.loads(line, parse_constant=reject_constant)',
        parsed.error
          ? 'line ' + parsed.line + '  •  ' + parsed.error
          : parsed.records.length + ' valid record',
      ],
      { size: 26 },
    );
    rail(
      c,
      b === 3
        ? 'U+2028 belongs to the quoted prompt.'
        : b === 4
          ? 'Each physical line must carry a JSON value.'
          : 'A strict decoder reports the offending line.',
    );
  } else if (b === 6) {
    const trim = cue(k, 6, 'Both sides now hold'),
      different = afterCue(k, 6, 'prediction changes to escalated', 0, 'If the prediction changes'),
      compared = afterCue(k, 6, 'the words differ even after that cleanup');
    printout(c, 100, 188, 518, 267, 'Expected', ['" blocked "', trim ? '"blocked"' : ''], {
      size: 39,
      step: 75,
    });
    printout(
      c,
      664,
      188,
      518,
      267,
      'Prediction',
      [
        different ? '"escalated"' : '" BLOCKED "',
        trim ? (different ? '"escalated"' : '"blocked"') : '',
      ],
      { size: 39, step: 75 },
    );
    if (trim && (!different || compared))
      stamp(c, 465, 509, different ? 'different labels' : 'equal labels', !different, 350);
    rail(c, 'label.strip().lower()');
  } else {
    const removed = cue(k, 7, 'Remove only its final newline'),
      v = removed === 1 ? runFile : runFile + '\n';
    const parts = v.split('\n');
    rows.forEach((r, i) => {
      const y = 164 + i * 111;
      rect(c, 107, y, 836, 83, C.paper, 3);
      mono(
        c,
        rowId(r) + '     …    "prediction": "' + r.prediction + '"  }',
        135,
        y + 53,
        29,
        C.ink,
        777,
      );
      if (i < parts.length - 1) {
        rect(c, 963, y, 177, 83, '#92c7d3', 3);
        mid(c, '0A', 1051, y + 55, 40, C.ink);
      }
    });
    const n = cue(k, 8, 'Follow the braces'),
      m = cue(k, 8, 'The last prediction is intact');
    if (n) mono(c, 'wc -l  ' + newlineCount(v), 120, 550, 31, C.teal);
    if (m)
      mono(
        c,
        strictLines(v).records.length +
          ' objects    ' +
          score(strictLines(v).records).correct +
          ' matches',
        615,
        550,
        31,
        C.green,
      );
    rail(c, 'wc -l eval/access_requests.jsonl', '0A = line feed');
  }
}
export function hook(c, k) {
  const b = beat(k);
  if (b === 1 || b === 4) {
    const installed = cue(k, 1, 'places an executable copy');
    printout(
      c,
      66,
      180,
      521,
      267,
      'Tracked hook source',
      ['scripts/pre-commit-ai-eval.sh', './scripts/run_eval.sh'],
      { size: 26, step: 67 },
    );
    wire(c, 587, 321, 729, 321, installed);
    terminal(c, 729, 167, 489, 306, 'Private to this checkout', [
      '.git/hooks/pre-commit',
      b === 4
        ? ['different hook exists', C.amber]
        : installed
          ? ['installed  •  executable', C.green]
          : null,
      b === 4 ? ['installer stops', C.red] : null,
    ]);
    commandRail(
      c,
      b === 4 ? 'git config --get core.hooksPath' : './scripts/install_hooks.sh',
      b === 4 ? 'merge existing checks' : 'repeat in each clone',
    );
  } else {
    const added = cue(k, 2, 'Add the wrong fourth request'),
      staged = cue(k, 2, 'stage all four rows'),
      reading = cue(k, 2, 'Git runs the installed hook'),
      scored = cue(k, 3, 'The scorer returns one'),
      blocked = cue(k, 3, 'Git stops the commit');
    const working = added ? four : rows;
    hookLanes(c, working, staged ? hookIndex : stagedFile, reading, scored);
    if (blocked) stamp(c, 246, 421, 'Commit stopped', false, 338);
    rail(
      c,
      reading ? 'git commit' : 'git add ' + fixturePath,
      blocked ? '4 rows remain staged' : '',
    );
  }
}
export function lane(c, y, title, list, accent, detail = '', capacity = 4) {
  const x = 246,
    gap = 8,
    w = Math.min(152, (963 - (capacity - 1) * gap) / capacity);
  txt(c, title, 58, y + 42, 28, C.ivory, { width: 175 });
  list.forEach((r, i) => {
    const px = x + i * (w + gap);
    rect(c, px, y, w, 67, accent, 4);
    mono(c, rowId(r), px + 11, y + 28, 23, C.ink, w - 18);
    mono(c, r.prediction.trim(), px + 11, y + 52, 18, C.ink, w - 18);
  });
  if (detail) mono(c, detail, x + list.length * (w + gap) + 8, y + 42, 22, C.teal, 255);
}
function hookLanes(c, working, index, reading, scored) {
  mono(c, fixturePath, 246, 147, 20, C.faint);
  lane(c, 169, 'Working file', working, '#b9d6b7');
  lane(c, 270, 'Index', index, '#e2c494');
  if (reading) {
    const end = 246 + 160 * working.length - 8;
    wire(c, end, 202, 947, 202, reading);
  }
  rect(c, 947, 161, 277, 110, '#102825', 7);
  txt(c, 'Working-tree hook', 965, 195, 25, C.teal);
  if (scored) {
    const passed = score(working).passes;
    mono(c, labelScore(working), 965, 228, 24, passed ? C.green : C.red);
    mono(c, passed ? 'exit 0' : 'exit 1', 965, 257, 21, passed ? C.green : C.red);
  } else {
    mono(c, reading ? 'reading file…' : 'waiting for commit', 965, 237, 19, C.faint);
  }
}
export function boundary(c, k) {
  const removed = cue(k, 1, 'Remove the trial row') === 1,
    b = beat(k),
    read = cue(k, 2, 'local hook passes'),
    checkout = cue(k, 3, 'Request one hundred four came along'),
    verdict = cue(k, 3, 'C I read the four rows');
  hookLanes(c, removed ? rows : four, hookIndex, cue(k, 2, 'Watch the hook read'), read);
  if (checkout) lane(c, 371, 'CI checkout', hookIndex, '#e2c494');
  else {
    stroke(
      c,
      [
        [246, 402],
        [907, 402],
      ],
      '#8c9c90',
      2,
      [9, 9],
    );
    txt(c, 'CI checkout', 58, 410, 28, C.faint);
  }
  if (verdict) stamp(c, 246, 491, 'CI  ' + labelScore(hookIndex) + '   •   exit 1', false, 507);
  rail(
    c,
    b === 1
      ? removed
        ? 'git diff  →  −104        git diff --cached  →  +104'
        : 'git diff --cached  →  +104'
      : b === 4
        ? 'git show HEAD'
        : 'git commit',
    b === 2 ? 'hook reads working file' : '',
  );
}
export function history(c, k) {
  const trace = bisectTrace(),
    probes = [
      cue(k, 2, 'Commit three passes'),
      cue(k, 2, 'Commit five fails'),
      cue(k, 3, 'Commit four passes'),
    ];
  const setup = cue(k, 1, 'Mark a known passing commit'),
    states = new Map(
      setup
        ? [
            [0, true],
            [7, false],
          ]
        : [],
    );
  let lo = 0,
    hi = 7;
  trace.checks.forEach((t, i) => {
    if (probes[i] === 1) {
      states.set(t.mid, t.good);
      if (t.good) lo = t.mid;
      else hi = t.mid;
    }
  });
  const px = (n) => 125 + n * 147;
  stroke(
    c,
    [
      [px(0), 311],
      [px(7), 311],
    ],
    '#a9ac94',
    9,
  );
  for (let i = 0; i <= 7; i++) {
    const known = states.get(i);
    dot(c, px(i), 311, 42, known == null ? '#658075' : known ? '#a9dab0' : '#e6a78d');
    mid(c, 'c' + i, px(i), 322, 29, C.ink);
    if (known != null) mid(c, known ? 'good' : 'bad', px(i), 237, 26, known ? C.green : C.red);
  }
  if (setup) {
    stroke(
      c,
      [
        [px(lo), 380],
        [px(lo), 400],
        [px(hi), 400],
        [px(hi), 380],
      ],
      C.amber,
      5,
    );
    mid(c, 'interval under test', (px(lo) + px(hi)) / 2, 459, 27, C.amber);
  }
  if (probes[2] === 1)
    mono(c, 'c' + trace.firstBad + '   + request 104     ' + labelScore(four), 290, 540, 31, C.red);
  commandRail(
    c,
    beat(k) === 1
      ? 'git bisect start  •  git bisect bad  •  git bisect good <revision>'
      : beat(k) === 2
        ? './repro.sh   →   git bisect good / bad'
        : 'git bisect reset',
    beat(k) === 3 ? 'broken setup → skip' : 'same scorer',
  );
}
