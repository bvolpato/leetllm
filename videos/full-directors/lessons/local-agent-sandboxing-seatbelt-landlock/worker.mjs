import { C, cue, mix, ease } from './bench.mjs';
import {
  testCase,
  runTest,
  append,
  grantRows,
  filesystemRights,
  probe,
  experiment,
  reportRequest,
  helperFiles,
  editorRun,
  extendedRights,
} from './operations.mjs';

export function opening(b, k) {
  const read = cue(k, 0, 'reads four', 0.85);
  const computed = cue(k, 0, 'gets eight');
  const pending = cue(k, 0, 'single lowercase x');
  const approach = ease(cue(k, 1, 'Follow the x', 1.0));
  const choose = cue(k, 1, 'If the launcher grants');
  const grant = cue(k, 2, 'Grant the report directory');
  const commit = cue(k, 2, 'appends the x');
  const ordinary = cue(k, 2, 'ordinary terminal command');
  const scoped = cue(k, 2, 'trusted supervisor gives');
  const result = runTest(testCase);
  const output = append('', result.outputByte, Boolean(commit && grant));
  b.base('Test bench   /   planning the worker', 'Where will the test put its byte?');
  if (ordinary)
    b.mono(
      scoped
        ? 'Scoped worker   •   case read + report write'
        : 'Ordinary command   •   may inherit home and network access',
      480,
      124,
      16,
      scoped ? C.green : C.gold,
      'center',
    );
  b.folder(64, 159, 193, 'tests/');
  b.folder(700, 159, 193, 'src/', grant ? C.green : C.blue);
  b.file(78, 211, 165, 163, 'case.txt', String(testCase.input), 'test input');
  b.file(
    715,
    211,
    165,
    163,
    'report.txt',
    output,
    output.length + (output.length === 1 ? ' byte' : ' bytes'),
  );
  b.track(249, 710, 287);
  b.box(353, 207, 251, 156, '#334d59', C.line, 12, 2);
  b.box(366, 221, 225, 94, C.deep, '#768b8c', 6);
  b.mono('double(input)', 479, 244, 20, C.muted, 'center');
  b.mono(
    computed ? '4 × 2 = ' + result.actual : read >= 1 ? '4 × 2 = ?' : '…',
    479,
    282,
    25,
    C.ink,
    'center',
  );
  b.text('Expected  ' + testCase.expected, 479, 338, 18, C.paper, { align: 'center' });
  if (read > 0 && read < 1) b.byte(mix(249, 353, ease(read)), 287, '4');
  if (pending && !commit) b.byte(mix(624, 693, approach), 287);
  b.mono('READ', 161, 394, 14, C.blue, 'center');
  b.mono(
    grant ? 'DIRECTORY WRITE GRANTED' : 'EXISTING REPORT',
    797,
    394,
    14,
    grant ? C.green : C.muted,
    'center',
  );
  if (commit) b.footer('The report gained one byte. The test input still holds 4.');
  else if (grant) b.footer('The src grant is active. The report still holds zero bytes.');
  else if (choose) b.footer('Choose a directory grant     tests/     src/     .git/');
}

function rights(b, k, i) {
  const abi = 2,
    required = probe(abi);
  const inspected = cue(k, 0, 'version two');
  const refused = cue(k, 1, 'Keep it stopped');
  b.base('Linux   /   Landlock ABI probe', 'Does this kernel cover both operations?');
  b.mono('REQUIRED OPERATION', 57, 146, 15, C.muted);
  b.mono('AVAILABLE FROM', 464, 146, 15, C.muted);
  b.mono(inspected ? 'HOST ABI  ' + abi : 'HOST PROBE', 735, 146, 15, C.blue);
  filesystemRights.forEach((r, n) => {
    const y = 216 + n * 94,
      color = required.covered[n] ? C.green : C.coral;
    b.stroke(
      [
        [57, y + 38],
        [895, y + 38],
      ],
      C.line,
      1,
    );
    b.text(r.name, 58, y, 26);
    b.mono('ABI ' + r.since, 477, y, 23, C.paper);
    b.box(717, y - 24, 169, 48, C.deep, inspected ? color : C.line, 4);
    b.mono(
      inspected ? (required.covered[n] ? 'covered' : 'missing') : 'pending',
      802,
      y,
      20,
      inspected ? color : C.muted,
      'center',
    );
  });
  b.mono(
    refused && !required.canStart
      ? 'LAUNCH HELD   •   0 workers'
      : 'Required boundary before launch',
    57,
    392,
    21,
    refused ? C.coral : C.muted,
  );
  b.footer(
    i === 0
      ? 'Would a write rule cover a request to shorten the file?'
      : 'A verified alternative must cover truncation too.',
  );
}

function threads(b, k) {
  const setup = cue(k, 2, 'create a ruleset');
  const nnp = cue(k, 2, 'set no new privileges');
  const enforce = cue(k, 2, 'then enforce');
  const child = cue(k, 2, 'future child inherits');
  b.base('Linux   /   successful setup on a capable host', 'Who inherits the enforced ruleset?');
  b.mono('LAUNCHER', 54, 142, 15, C.muted);
  const steps = [
    ['Ruleset + grants', setup],
    ['No new privileges', nnp],
    ['Enforce on A', enforce],
  ];
  steps.forEach(([name, done], i) => {
    const x = 55 + 302 * i;
    b.box(x, 161, 243, 51, done ? '#31584f' : C.deep, done ? C.green : C.line);
    b.text(name, x + 121, 187, 20, done ? C.ink : C.muted, { align: 'center' });
    if (i < 2) b.arrow(x + 250, 187, x + 290);
  });
  b.mono('Thread A', 57, 281, 21);
  b.mono('Sibling B', 57, 363, 21);
  b.stroke(
    [
      [213, 281],
      [640, 281],
    ],
    enforce ? C.green : C.blue,
    6,
  );
  b.stroke(
    [
      [213, 363],
      [640, 363],
    ],
    C.line,
    6,
  );
  b.dot(214, 281, 8, C.blue);
  b.dot(214, 363, 8, C.muted);
  if (child) {
    b.stroke(
      [
        [508, 281],
        [554, 245],
        [640, 245],
      ],
      C.green,
      4,
    );
    b.text('Future child • restricted', 661, 245, 19, C.green);
  }
  b.text(enforce ? 'Restricted' : 'Original access', 661, 281, 19, enforce ? C.green : C.blue);
  b.text('Separate setup needed', 661, 363, 19, C.muted);
  b.footer('A ruleset descriptor takes effect when the thread enforces it.');
}

function handles(b, k) {
  const fresh = cue(k, 3, 'fresh open would be denied');
  const close = cue(k, 3, 'Close the unnecessary handle');
  b.base('Linux   /   descriptor inheritance', 'Which handle belongs in the worker?');
  b.file(55, 189, 185, 158, 'private/note', 'note', 'supervisor file');
  b.mono('Fresh open', 316, 185, 21);
  b.mono('Already open', 316, 315, 21);
  b.arrow(318, 222, 659);
  b.arrow(318, 352, 659, close ? C.line : C.gold);
  b.box(680, 195, 208, 52, C.deep, fresh ? C.coral : C.line);
  b.text(fresh ? 'Denied at open' : 'Check at open', 784, 221, 20, fresh ? C.coral : C.muted, {
    align: 'center',
  });
  b.box(680, 326, 208, 52, C.deep, close ? C.green : C.gold);
  b.text(close ? 'Closed before launch' : 'Read handle', 784, 352, 19, close ? C.green : C.gold, {
    align: 'center',
  });
  if (!close) {
    b.dot(497, 352, 13, C.gold);
    b.mono('r', 497, 352, 15, C.print, 'center');
  }
  b.footer(
    close
      ? 'The worker receives no descriptor for the private note.'
      : 'A fresh-open result tells you about that open.',
  );
}

function grants(b, k) {
  const child = cue(k, 4, 'Add a read grant');
  const explain = cue(k, 5, 'The parent still grants');
  const narrow = cue(k, 5, 'replace the project grant');
  const rows = grantRows(narrow ? 'src' : 'project', Boolean(child));
  b.base('Linux   /   grants inside one Landlock layer', 'Where does the write grant reach?');
  b.mono(narrow ? 'FRESH RULESET' : 'DRAFT RULESET', 55, 141, 15, C.blue);
  rows.forEach((row, i) => {
    const x = 61 + i * 287;
    b.folder(x, 192, 258, row.dir + '/', row.dir === '.git' ? C.archive : C.blue);
    if (row.write) b.box(x, 254, narrow ? 258 : Math.min(287, 832 - i * 287), 9, C.green, null, 0);
    b.text(
      narrow ? (row.write ? 'Write granted' : 'Outside write grant') : 'Parent write grant',
      x + 129,
      291,
      21,
      row.write ? C.green : C.muted,
      { align: 'center' },
    );
    if (row.readGrant) {
      b.box(x, 323, 258, 47, C.deep, C.blue);
      b.text('Child read grant', x + 129, 347, 20, C.blue, { align: 'center' });
    }
  });
  b.footer(
    narrow
      ? 'src/report.txt stays writable. Git metadata falls outside the grant.'
      : explain
        ? 'The parent grants the metadata write in this layer.'
        : 'Does adding a child read grant take away the parent write?',
  );
}

export function linux(b, k) {
  const i = k.beat.beatIndex;
  if (i < 2) rights(b, k, i);
  else if (i === 2) threads(b, k);
  else if (i === 3) handles(b, k);
  else if (i < 6) grants(b, k);
  else {
    const measured = cue(k, 6, 'reports version four');
    const held = cue(k, 7, 'Hold this launch');
    const result = probe(4, extendedRights);
    b.base(
      'Linux   /   a different job contract',
      'Can this kernel govern both required operations?',
    );
    b.mono('REQUIRED COVERAGE', 58, 149, 16, C.muted);
    b.mono('FIRST ABI', 552, 149, 16, C.muted);
    b.mono('RUNNING ABI', 747, 149, 16, C.muted);
    extendedRights.forEach((r, n) => {
      const y = 216 + 94 * n,
        ok = result.covered[n];
      b.text(r.name, 58, y, 24);
      b.mono(String(r.since), 588, y, 24, C.blue, 'center');
      b.mono(
        measured ? (ok ? '4 • covered' : '4 • missing') : 'pending',
        806,
        y,
        18,
        measured ? (ok ? C.green : C.coral) : C.muted,
        'center',
      );
      b.stroke(
        [
          [57, y + 38],
          [897, y + 38],
        ],
        C.line,
        1,
      );
    });
    b.mono(
      held && !result.canStart
        ? 'Launch held   •   required signal scoping unavailable'
        : 'Evaluate the running kernel against this job’s rights.',
      58,
      387,
      20,
      held ? C.coral : C.muted,
    );
    b.footer('Other operations have their own rights, including execute, create and rename.');
  }
}

function helper(b, k) {
  const test = cue(k, 3, 'Both pass');
  b.base(
    'Path helper   /   fixed-tree simulation',
    k.beat.beatIndex === 3
      ? 'Which names does the helper exclude?'
      : 'When is the resource checked?',
  );
  if (k.beat.beatIndex === 3) {
    b.mono('Workspace entry', 56, 146, 17, C.muted);
    b.mono('Helper', 505, 146, 17, C.muted);
    b.mono('src-only grant', 708, 146, 17, C.muted);
    helperFiles.forEach((row, i) => {
      const y = 194 + i * 60,
        visible = !row.helper || test;
      b.mono(row.name, 57, y, 23);
      b.text(
        visible ? (row.helper ? 'passes' : 'excluded') : '?',
        504,
        y,
        21,
        visible ? (row.helper ? C.green : C.coral) : C.gold,
      );
      b.text(test ? (row.grant ? 'inside' : 'outside') : '?', 708, y, 21, test ? C.muted : C.gold);
      b.stroke(
        [
          [58, y + 24],
          [896, y + 24],
        ],
        C.line,
        1,
      );
    });
    b.footer('Exact file names and protected subtrees give different results.');
  } else {
    const enforce = cue(k, 4, 'Enforce access when');
    b.mono('1   Helper checks a name', 53, 160, 22, C.blue);
    b.mono('2   Worker opens the file', 520, 160, 22, C.green);
    b.folder(84, 232, 294, 'resolved entry', C.blue);
    b.arrow(392, 255, 540, C.gold);
    b.folder(556, 232, 286, 'current entry', enforce ? C.green : C.blue);
    b.text('Directory entries can change in between.', 480, 344, 25, C.ink, { align: 'center' });
    b.footer(
      enforce
        ? 'Check link and rename operations under the enforced policy.'
        : 'The earlier prediction describes the earlier tree.',
    );
  }
}

// Follow the directory branches at their junctions, including the sibling report branch.
function along(points, t) {
  const lens = points.slice(1).map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let distance = t * lens.reduce((a, b) => a + b, 0);
  for (const [i, len] of lens.entries()) {
    if (distance <= len)
      return points[i].map((v, axis) => mix(v, points[i + 1][axis], distance / len));
    distance -= len;
  }
  return points.at(-1);
}
export function paths(b, k) {
  if (k.beat.beatIndex > 2) return helper(b, k);
  const enter = ease(cue(k, 0, 'Follow src into cache', 0.8));
  const link = ease(cue(k, 0, 'Follow the link', 0.95));
  const parent = ease(cue(k, 2, 'Go up one directory', 0.82));
  const last = ease(cue(k, 2, 'Now take the final entry', 0.9));
  const verdicts = [cue(k, 2, 'left report is writable'), cue(k, 2, 'right report is a protected')];
  b.base('Directory walk   /   two copies of the checkout', 'Where do the two dots take you?');
  b.mono(reportRequest, 480, 126, 24, C.gold, 'center');
  experiment.forEach((r, i) => {
    const x = 38 + i * 456;
    const X = [x + 100, x + 327],
      H = 186,
      M = 257,
      L = 337;
    b.mono('COPY ' + r.name, x + 9, 157, 13, C.muted);
    for (const [j, dir] of ['src', 'archive'].entries()) {
      const xx = X[j],
        tone = j === 0 ? C.blue : C.archive;
      b.stroke(
        [
          [xx - 63, H + 17],
          [xx - 77, H + 17],
        ],
        C.line,
        2,
      );
      b.stroke(
        [
          [xx - 77, H + 17],
          [xx - 77, L],
          [xx - 57, L],
        ],
        C.line,
        2,
      );
      b.stroke(
        [
          [xx - 77, M],
          [xx - 57, M],
        ],
        C.line,
        2,
      );
      b.folder(xx - 63, H - 8, 126, dir, tone);
      b.mono(j === 0 ? 'cache' : 'daily', xx, M, 18, tone, 'center');
      b.mono('report.txt', xx, L, 16, tone, 'center');
    }
    const actualDir = r.stops[2].includes('/archive/') ? 1 : 0;
    const j = X[actualDir],
      start = [X[0] - 77, H + 17],
      cache = [X[0] - 57, M];
    const target = [j - 57, M],
      root = [j - 77, H + 17];
    const bridge = [cache, [cache[0], M + 23], [target[0], M + 23], target];
    if (r.link) {
      b.stroke(bridge, link ? C.gold : C.line, 1.8, true);
      b.stroke([[target[0] - 5, M + 7], target, [target[0] + 5, M + 7]], link ? C.gold : C.line, 2);
    }
    let position = along([start, [start[0], M], cache], enter);
    if (link && r.link) position = along(bridge, link);
    if (parent) position = along([target, [root[0], M], root], parent);
    if (last) position = along([root, [root[0], L], [j - 57, L]], last);
    b.dot(...position, 6, C.gold, C.print);
    if (verdicts[i])
      b.text(
        r.resolved + (r.allowed ? '   •   writable' : '   •   protected'),
        x + 221,
        391,
        17,
        r.allowed ? C.green : C.coral,
        { align: 'center' },
      );
  });
  b.stroke(
    [
      [480, 155],
      [480, 404],
    ],
    C.line,
    1,
  );
  b.footer(
    verdicts[1]
      ? 'The name is identical. The resolved files have different parents.'
      : 'Only files under src may receive a data write.',
  );
}

const timeX = [263, 387, 511, 663, 839];
function history(b, row, y, ghost = false) {
  const d = ghost ? '#67838a' : C.blue,
    f = ghost ? '#67838a' : C.gold,
    host = ghost ? '#67838a' : C.green;
  b.stroke(
    [
      [timeX[0], y],
      [row.exited ? timeX[2] : row.saved ? timeX[1] : timeX[0] + 22, y],
    ],
    d,
    ghost ? 2 : 8,
  );
  if (row.taskOnDisk)
    b.stroke(
      [
        [timeX[1], y + 47],
        [row.opened ? timeX[4] : row.exited ? timeX[2] + 58 : timeX[1] + 25, y + 47],
      ],
      f,
      ghost ? 2 : 8,
    );
  if (row.saved && !row.taskOnDisk && !ghost) {
    b.stroke(
      [
        [timeX[1] - 7, y + 40],
        [timeX[1] + 7, y + 54],
      ],
      C.coral,
      3,
    );
    b.stroke(
      [
        [timeX[1] - 7, y + 54],
        [timeX[1] + 7, y + 40],
      ],
      C.coral,
      3,
    );
  }
  if (row.opened)
    b.stroke(
      [
        [timeX[3], y + 94],
        [
          row.formatter || !row.taskOnDisk
            ? timeX[4]
            : row.approved
              ? timeX[4] - 35
              : timeX[3] + 20,
          y + 94,
        ],
      ],
      host,
      ghost ? 2 : 8,
    );
  if (row.formatter) {
    b.stroke(
      [
        [timeX[4] - 30, y + 94],
        [timeX[4], y + 141],
        [899, y + 141],
      ],
      host,
      ghost ? 2 : 6,
    );
  }
}

export function lifetime(b, k) {
  const i = k.beat.beatIndex,
    replay = i === 3;
  const saved = replay ? cue(k, 3, 'save is denied') : cue(k, 0, 'saves a formatting task');
  const exited = replay ? cue(k, 3, 'worker exits') : cue(k, 0, 'worker exits');
  const opened = replay ? cue(k, 3, 'same host opens') : cue(k, 1, 'host editor opens');
  const approved = !replay && cue(k, 1, 'approves the task');
  const consumed = !replay && cue(k, 2, 'host editor starts');
  const reviewed = replay && cue(k, 3, 'contain no formatting task');
  const row = editorRun(
    replay,
    Boolean(saved),
    Boolean(exited),
    Boolean(opened),
    Boolean(approved),
    Boolean(consumed),
  );
  b.base('Workspace   /   saved configuration', 'Who starts the formatter?');
  b.mono(
    replay ? 'REPLAY   •   protected settings' : 'FIRST RUN   •   project-wide write grant',
    55,
    135,
    18,
    replay ? C.green : C.blue,
  );
  const laneY = 211;
  ['Worker', 'Saved task', 'Host editor', 'Formatter'].forEach((label, j) => {
    b.text(label, 57, laneY + j * 47, 20);
    b.stroke(
      [
        [240, laneY + j * 47],
        [900, laneY + j * 47],
      ],
      '#405966',
      1,
      true,
    );
  });
  ['start', 'save', 'exit', 'open', 'later'].forEach((t, j) =>
    b.mono(t, timeX[j], 172, 14, C.muted, 'center'),
  );
  if (replay) history(b, editorRun(false, true, true, true, true, true), laneY - 7, true);
  history(b, row, laneY);
  const status = row.formatter
    ? 'Formatter owner: host editor'
    : reviewed
      ? 'No task on disk for this host to run'
      : row.approved
        ? 'Approved by developer • ready to run'
        : row.opened
          ? 'Host opens the folder'
          : row.exited
            ? row.taskOnDisk
              ? 'Worker ended • saved task remains'
              : 'Worker ended • starting settings intact'
            : row.saved
              ? row.taskOnDisk
                ? 'Task saved on disk'
                : 'Write refused'
              : 'Clean starting configuration';
  b.mono(status, 57, 398, 18, row.formatter ? C.green : C.paper);
  b.footer(
    replay
      ? 'The fine lines keep the first run visible for comparison.'
      : 'Each lane follows one process or file through time.',
  );
}
