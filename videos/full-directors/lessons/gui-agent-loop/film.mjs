import assert from 'node:assert/strict';
import {
  run,
  incident,
  evidence,
  draft,
  matchesDraft,
  request,
  pilot,
  admit,
  coordinateSpaces,
  exercise,
  landing,
  liveRows,
  firstRowY,
  pitch,
  hit,
  oldFrame,
  newFrame,
  oldPoint,
  newPoint,
  otherTab,
  held,
  opened,
  resolveTab,
  noteState,
  batch,
  runBatch,
  grant,
  before,
  observed,
  verifyScope,
  policy,
  surfaces,
  episode,
  scores,
  checkExample,
  tabMark,
  currentMark,
  runButton,
  openRunPoint,
} from './example.mjs';
import {
  C,
  box,
  path,
  dot,
  type,
  mono,
  serif,
  tag,
  header,
  strip,
  window,
  pointer,
  cross,
  fileIcon,
  branch,
  traceback,
  mix,
  ease,
  cue,
} from './drawing.mjs';

const title = 'How an Agent Acts Through a Screen';
const pair = (p) => '(' + p.join(', ') + ')';
const dims = (a) => a.join(' × ');
const gates = runBatch(batch, true, false);
const spaces = coordinateSpaces();
const nativeSpace = spaces[3];
const nativeCrop = nativeSpace.bounds;
const plates = spaces.map(({ size, bounds = [0, 0, ...size] }) => {
  const devicePerUnit = bounds.slice(2).map((length, axis) => nativeCrop[axis + 2] / length);
  return {
    devicePerUnit,
    origin: devicePerUnit.map((scale, axis) => nativeCrop[axis] - bounds[axis] * scale),
    size: size.map((length, axis) => length * devicePerUnit[axis]),
  };
});
const coordinateCues = [
  [1, 'Start at the inner corner'],
  [2, 'Multiply each displacement by two'],
  [2, 'Then add the crop origin'],
  [3, 'Divide by two'],
];
const rulerStep = 25;

function opening(c, k) {
  const aim = ease(cue(k, 1, 'Open Failed tests', 0.55));
  const disclose = cue(k, 1, 'The panel shows');
  const host = cue(k, 2, 'The host still decides');
  header(c, 'CI INSPECTION    /    LOCAL DRAFT', 'Where would you put the cursor?');
  window(c, 82, 192, 1756, 617, 'ci.example   /   runs', 'READ-ONLY SESSION');
  mono(c, 'MAIN   /   BUILD HISTORY', 125, 314, 24);
  serif(c, run, 122, 398, 74);
  branch(c, 175, 506, 407);
  mono(c, 'FAILED STEP', 125, 671, 24, C.red);
  type(c, 'Report parser', 125, 734, 48, { weight: 600 });
  path(
    c,
    [
      [665, 280],
      [665, 779],
    ],
    C.line,
    2,
  );
  mono(c, 'TEST RESULTS', 702, 313, 24);
  type(c, evidence.test, 702, 382, 38, { weight: 600, width: 645 });
  box(c, 701, 427, 500, 72, disclose ? C.mint : C.soft, C.ink, 2, 4);
  type(c, disclose ? '−    Failed tests' : '+    Failed tests', 732, 474, 33, { weight: 600 });
  if (disclose) traceback(c, 702, 518, 685, 267);
  else {
    box(c, 702, 520, 685, 228, C.soft, C.line, 2, 4);
    mono(c, 'PARSER TRACEBACK', 732, 581, 25);
    serif(c, 'Panel closed', 730, 659, 44, C.dim);
  }
  path(
    c,
    [
      [1425, 280],
      [1425, 779],
    ],
    C.line,
    2,
  );
  mono(c, 'PRODUCTION', 1464, 314, 24, C.red);
  box(c, 1463, 355, 319, 84, C.blush, C.red, 2, 4);
  type(c, 'Deploy', 1622, 411, 41, { align: 'center', weight: 600, color: C.red });
  type(c, 'Start a new job', 1465, 486, 27, { color: C.dim, width: 310 });
  if (host) {
    mono(c, 'HOST DECISION', 1465, 642, 23);
    tag(c, policy('Deploy'), 1465, 674, 316, C.blush, C.red);
  }
  pointer(c, mix(1290, 1120, aim), mix(740, 467, aim), 1.1);
  strip(
    c,
    'TASK SCOPE',
    host
      ? 'Read permitted  /  deploy outside scope'
      : disclose
        ? 'Read the failure  /  save on this host'
        : 'Inspect the failure  /  prepare a local draft',
  );
}

function manifest(c, k) {
  const b = k.beat.beatIndex;
  const rejected = cue(k, 1, 'Reject that request');
  const changed = [
    cue(k, 1, 'Start with a fresh profile'),
    cue(k, 1, 'only the CI site'),
    cue(k, 1, 'read-only credentials'),
  ];
  const s = {
    profile: changed[0] ? pilot.profile : request.profile,
    sites: changed[1] ? pilot.sites : request.sites,
    access: changed[2] ? pilot.access : request.access,
  };
  if (b < 2) {
    header(c, 'HOST    /    ADMISSION', 'What can this session reach?');
    window(c, 82, 191, 855, 615, 'requested.profile', changed[0] ? 'REVISED' : 'INCOMING');
    const rows = [
      ['PROFILE', s.profile],
      ['NETWORK', s.sites.join('  +  ')],
      ['ACCOUNT', s.access],
    ];
    rows.forEach(([key, val], i) => {
      const y = 355 + i * 148;
      mono(c, key, 126, y - 15, 24);
      serif(c, val, 124, y + 49, 51, C.ink, 753);
      path(
        c,
        [
          [124, y + 83],
          [890, y + 83],
        ],
        C.line,
        2,
      );
    });
    box(c, 1004, 192, 834, 614, C.night, null, 0, 6);
    mono(c, 'PERMITTED INSPECTION', 1052, 255, 26, C.faint);
    const specs = ['Fresh temporary profile', 'ci.example only', 'Read-only account'];
    specs.forEach((s, i) => {
      const y = 346 + i * 146;
      dot(c, 1076, y, 19, changed[i] ? C.mint : C.well, C.faint);
      if (changed[i])
        path(
          c,
          [
            [1068, y],
            [1074, y + 6],
            [1084, y - 7],
          ],
          C.green,
          4,
        );
      type(c, s, 1127, y + 13, 39, { color: C.white, width: 658 });
    });
    strip(
      c,
      'HOST  /  BEFORE LAUNCH',
      admit(s)
        ? 'Admit restricted session'
        : changed[0]
          ? 'Revising request  /  launch held'
          : rejected
            ? 'Denied before launch'
            : 'Awaiting admission',
      admit(s) ? C.mint : C.amber,
    );
    return;
  }
  const dispatched = cue(k, 3, 'It opens the run');
  const returned = cue(k, 3, 'run-detail heading shows');
  const heading = returned ? run : 'Find a build';
  const captured = heading === run && cue(k, 3, 'captures a fresh observation');
  header(c, 'HOST    /    SESSION S9', b === 2 ? 'Who holds the login?' : 'Which page came back?');
  window(c, 82, 194, 1105, 611, 'ci.example   /   isolated browser', 'TAB 1');
  mono(c, returned ? 'RUN VIEW' : 'DASHBOARD', 123, 333, 25, C.green);
  serif(c, heading, 122, 415, 65);
  box(c, 124, 472, 760, 76, C.white, C.ink, 2, 4);
  mono(c, run, 152, 522, 33, C.ink);
  box(c, runButton.x, runButton.y, runButton.w, runButton.h, C.mint, C.ink, 2, 4);
  type(c, 'Open run', 1030, 522, 32, { align: 'center', weight: 600 });
  if (returned) {
    branch(c, 229, 645, 700);
    tag(c, 'Test failed', 137, 729, 221, C.blush, C.red);
  } else if (dispatched) {
    mono(c, 'Loading run…', 129, 658, 30, C.dim);
  } else {
    mono(c, 'MATCHING RUN', 129, 638, 23);
    type(c, run + '    /    main', 130, 698, 38, { weight: 600 });
    if (b === 3) pointer(c, openRunPoint.x, openRunPoint.y);
  }
  mono(c, 'HOST SIDE', 1244, 251, 25, C.dim);
  if (b === 2) {
    // A solid lock and its contents stay outside the browser window.
    c.beginPath();
    c.arc(1535, 437, 83, Math.PI, 0);
    c.lineWidth = 28;
    c.strokeStyle = C.ink;
    c.stroke();
    box(c, 1394, 426, 282, 173, C.night, null, 0, 12);
    dot(c, 1535, 493, 22, C.amber);
    box(c, 1529, 499, 13, 38, C.amber);
    type(c, 'Credential broker', 1535, 665, 42, { align: 'center', weight: 600 });
    mono(c, 'Session established', 1348, 719, 26, C.green);
  } else {
    fileIcon(c, 1245, 299, 540, 443, C.soft);
    mono(c, 'OBSERVATION', 1280, 374, 26);
    serif(c, captured ? 'Frame 2' : 'Frame 1', 1279, 470, 69);
    type(c, captured ? 'Run-detail heading' : 'One matching run', 1281, 551, 35, {
      weight: 600,
      width: 455,
    });
    mono(c, captured ? heading : run, 1280, 622, 31, C.green);
    mono(c, captured ? 'Run view captured' : 'Dashboard captured', 1280, 686, 23);
  }
  const limits = cue(k, 4, 'The loop ends');
  strip(
    c,
    limits ? 'STOP CONDITIONS' : 'BROWSER DRIVER',
    limits
      ? 'Verified goal  /  time or step limit  /  safety boundary'
      : b === 2
        ? 'Model receives task + permitted page'
        : captured
          ? 'Open run dispatched  /  fresh observation'
          : returned
            ? 'Run-detail heading matched  /  capture pending'
            : dispatched
              ? 'Open run dispatched  /  waiting for run-detail heading'
              : 'Proposed input  /  host checks current target',
  );
}

function geometryPlate(c, index, progress) {
  // Paint every space on the same device grid so the crop and tab stay fixed.
  const scale = 0.64;
  const toX = (deviceX) => 225 + deviceX * scale;
  const toY = (deviceY) => 311 + deviceY * scale;
  const from = plates[Math.max(0, index - 1)];
  const to = plates[index];
  const x = toX(mix(from.origin[0], to.origin[0], progress));
  const y = toY(mix(from.origin[1], to.origin[1], progress));
  const w = mix(from.size[0], to.size[0], progress) * scale;
  const h = mix(from.size[1], to.size[1], progress) * scale;
  const [cropX, cropY, cropW, cropH] = nativeCrop;
  const targetX = toX(nativeSpace.point[0]);
  const targetY = toY(nativeSpace.point[1]);
  box(c, x, y, w, h, index < 2 ? C.dim : C.sky, C.ink, 3);
  box(c, toX(cropX), toY(cropY), cropW * scale, cropH * scale, C.paper, C.blue, 3);

  // The rulers measure from the active corner. Their spacing follows the current units.
  const rulerX = x - 12;
  const rulerY = y - 12;
  path(
    c,
    [
      [x, rulerY],
      [targetX, rulerY],
    ],
    C.mint,
    3,
  );
  path(
    c,
    [
      [rulerX, y],
      [rulerX, targetY],
    ],
    C.mint,
    3,
  );
  path(
    c,
    [
      [x, rulerY - 7],
      [x, y],
      [rulerX - 7, y],
    ],
    C.mint,
    2,
  );
  const [tickX, tickY] = to.devicePerUnit.map(
    (n, axis) => rulerStep * scale * mix(from.devicePerUnit[axis], n, progress),
  );
  for (let tx = x + tickX; tx < targetX - 4; tx += tickX)
    path(
      c,
      [
        [tx, rulerY],
        [tx, rulerY - 9],
      ],
      C.mint,
      2,
    );
  for (let ty = y + tickY; ty < targetY - 4; ty += tickY)
    path(
      c,
      [
        [rulerX, ty],
        [rulerX - 9, ty],
      ],
      C.mint,
      2,
    );
  type(c, '0,0', rulerX - 11, rulerY + 2, 25, {
    font: 'Mono',
    color: C.white,
    align: 'right',
  });
  if (progress === 1) {
    const [pointX, pointY] = spaces[index].point;
    mono(c, pointX, targetX + 13, rulerY + 7, 29, C.mint);
    type(c, pointY, rulerX - 15, targetY + 9, 29, {
      font: 'Mono',
      color: C.mint,
      align: 'right',
    });
  }
  dot(c, x, y, 6, C.amber, C.ink);
  c.save();
  c.setLineDash([7, 6]);
  path(
    c,
    [
      [rulerX, targetY],
      [targetX, targetY],
      [targetX, rulerY],
    ],
    C.blue,
    2,
  );
  c.restore();
  box(c, targetX - 22, targetY - 23, 211, 46, C.mint, C.green, 2, 3);
  type(c, 'Failed tests', targetX + 28, targetY + 9, 27, { weight: 600, width: 152 });
  cross(c, targetX, targetY, 13);
}
function coordinates(c, k) {
  const b = k.beat.beatIndex;
  if (b < 4) {
    const moves = coordinateCues.map(([beat, phrase]) => cue(k, beat, phrase, 0.95));
    const idx = moves.findLastIndex((move) => move > 0) + 1;
    const progress = moves[idx - 1] ?? 1;
    const settled = idx - Number(progress < 1);
    const s = spaces[idx];
    header(c, 'GROUNDING    /    THE SAME POINT', 'Which origin measures this point?');
    box(c, 82, 194, 965, 625, C.night, null, 0, 5);
    type(c, progress === 1 ? s.name : s.op, 120, 252, 39, { color: C.white, weight: 600 });
    if (progress === 1)
      type(c, dims(s.size) + ' ' + s.units, 1008, 252, 26, {
        font: 'Mono',
        color: C.faint,
        align: 'right',
        width: 350,
      });
    geometryPlate(c, idx, ease(progress));
    mono(c, 'POINT CONVERSION', 1101, 248, 24);
    spaces.forEach((step, j) => {
      const y = 302 + j * 102;
      path(
        c,
        [
          [1101, y + 76],
          [1818, y + 76],
        ],
        C.line,
        2,
      );
      if (j > settled) return;
      if (j === settled) box(c, 1098, y - 7, 720, 78, C.paper);
      mono(c, step.op, 1120, y + 20, 23, j === settled ? C.green : C.dim, 650);
      type(c, pair(step.point), 1120, y + 62, 39, {
        font: 'Mono',
        color: j === settled ? C.ink : C.dim,
        width: 470,
      });
    });
    strip(
      c,
      progress === 1 ? rulerStep + ' ' + s.units + ' per tick' : 'Same tab target',
      settled === 4
        ? 'Viewport capture  /  device pixel ratio = ' + plates[4].devicePerUnit[0]
        : 'Measure from the marked origin',
    );
    return;
  }
  const mark = cue(k, 5, 'mark seven');
  if (mark) {
    header(c, 'GROUNDING    /    SET OF MARKS', 'Which control does mark 7 name?');
    window(c, 82, 196, 1000, 618, 'tab 1   /   ' + run, 'FRAME 2');
    const ox = 145,
      oy = 292,
      z = 1.36;
    const [bx, by, bw, bh] = tabMark.box;
    for (const [i, name] of ['Overview', 'Failed tests', 'Reports'].entries()) {
      const x = ox + bx * z,
        y = oy + (by + (i - 1) * 96) * z;
      box(c, x, y, bw * z, bh * z, i === 1 ? C.mint : C.soft, i === 1 ? C.green : C.line, 2, 4);
      type(c, name, x + 18, y + 68, 40, { weight: 600 });
      if (i === 1) {
        dot(c, x - 33, y + (bh * z) / 2, 28, C.amber, C.ink);
        type(c, tabMark.id, x - 33, y + (bh * z) / 2 + 11, 32, { align: 'center', weight: 600 });
      }
    }
    const lookup = cue(k, 5, 'looks up its box');
    fileIcon(c, 1160, 198, 664, 612, C.white);
    mono(c, 'MARK MAP   /   TAB 1   /   FRAME 2', 1194, 267, 24, C.dim, 595);
    serif(c, 'Mark ' + tabMark.id, 1193, 370, 67);
    if (lookup) {
      const mapped = currentMark(7, 1, 2);
      type(c, mapped.name, 1194, 475, 43, { weight: 600 });
      mono(c, 'Origin   ' + pair(mapped.box.slice(0, 2)), 1195, 570, 28, C.ink);
      mono(c, 'Size     ' + dims(mapped.box.slice(2)), 1195, 637, 28, C.ink);
    }
    strip(
      c,
      'ELEMENT IDENTIFIER',
      lookup
        ? 'Match the tab, frame and current box before dispatch'
        : 'Resolve the mark in its observation',
    );
    return;
  }
  const solved = cue(k, 5, 'Scale each axis');
  header(c, 'GROUNDING    /    UNPADDED FULL FRAME', 'Where is the point in native pixels?');
  const scales = [
    { size: exercise.from, pt: exercise.point, x: 82, label: 'Observed image', show: true },
    { size: exercise.to, pt: landing, x: 991, label: 'Native screenshot', show: solved },
  ];
  scales.forEach(({ size, pt, x, label, show }) => {
    window(c, x, 206, 847, 601, label);
    const gx = x + 130,
      gy = 326,
      w = 584,
      h = (w * size[1]) / size[0];
    box(c, gx, gy, w, h, C.sky, C.blue, 3);
    for (let n = 1; n < 5; n++) {
      path(
        c,
        [
          [gx + (w * n) / 5, gy],
          [gx + (w * n) / 5, gy + h],
        ],
        C.line,
        1,
      );
      path(
        c,
        [
          [gx, gy + (h * n) / 5],
          [gx + w, gy + (h * n) / 5],
        ],
        C.line,
        1,
      );
    }
    mono(c, dims(size), gx, gy - 15, 23);
    if (show) cross(c, gx + (pt[0] * w) / size[0], gy + (pt[1] * h) / size[1], 14);
    type(c, show ? pair(pt) : '( ? , ? )', x + 420, 771, 38, { font: 'Mono', align: 'center' });
  });
  strip(
    c,
    'NO CROP  /  NO PADDING  /  NATIVE PIXELS',
    solved ? 'Horizontal ×2.5   /   vertical ×2.5' : 'Scale the distance from the top-left corner',
    solved ? C.mint : C.amber,
  );
}

function freshnessState(k) {
  const slide = ease(cue(k, 1, 'slides in', 1.05));
  const dropped = cue(k, 2, 'Discard the proposal');
  const captured = cue(k, 3, 'Capture frame three');
  const scoped = cue(k, 3, 'Scope the search');
  const aim = ease(cue(k, 4, 'Move the proposed point', 0.75));
  const clicked = cue(k, 4, 'Now click');
  const saved = cue(k, 5, 'saves a local draft');
  return {
    slide,
    dropped,
    captured,
    scoped,
    aim,
    clicked,
    saved,
    live: clicked ? opened : slide > 0 ? newFrame : oldFrame,
  };
}
function localFile(c, x, y, w, h) {
  fileIcon(c, x, y, w, h, C.white);
  mono(c, 'LOCAL FILE    /    incident-draft', x + 34, y + 65, 22, C.green, w - 90);
  serif(c, draft.incident, x + 30, y + 150, 64);
  mono(c, draft.run + '   /   test-parser', x + 34, y + 207, 27, C.dim, w - 55);
  path(
    c,
    [
      [x + 34, y + 240],
      [x + w - 36, y + 240],
    ],
    C.line,
    2,
  );
  mono(c, draft.file + '   line ' + draft.line, x + 34, y + 295, 26, C.ink);
  mono(c, draft.error, x + 34, y + 350, 36, C.red, w - 70);
  mono(c, draft.artifact, x + 34, y + h - 49, 25, C.blue, w - 70);
}
function freshness(c, k) {
  const s = freshnessState(k);
  const wouldHit = cue(k, 2, 'Artifacts');
  const movingRows = s.slide > 0 && s.slide < 1;
  const heading = s.saved
    ? 'Does the draft match the open panel?'
    : s.clicked
      ? 'Which panel opened?'
      : s.captured
        ? 'Which tab belongs to this run?'
        : s.dropped
          ? 'The overview stays open'
          : s.slide === 1
            ? 'Which panel is under the old point?'
            : 'Keep your finger on the proposed point.';
  header(c, 'FRESHNESS    /    SESSION S9', heading);
  if (s.saved) {
    window(c, 82, 190, 862, 624, 'ci.example   /   ' + run, 'FRAME 4');
    type(c, 'Failed tests', 129, 339, 54, { font: 'Serif' });
    traceback(c, 126, 390, 770, 287);
    mono(c, evidence.artifact, 129, 748, 28, C.blue, 765);
    localFile(c, 1020, 193, 807, 617);
    const verified = cue(k, 5, 'They match') && matchesDraft(draft);
    strip(
      c,
      verified ? 'VERIFIED LOCAL DRAFT' : 'SAVED LOCAL DRAFT',
      verified
        ? 'Run, failure and artifact match  /  nothing posted'
        : 'Compare the run, failure line and artifact',
    );
    return;
  }
  window(
    c,
    82,
    191,
    1756,
    631,
    'ci.example   /   ' + run,
    movingRows ? 'LAYOUT MOVING' : 'FRAME ' + s.live.frame,
  );
  mono(c, 'RUN PANELS', 205, 320, 25);
  if (wouldHit && !s.captured)
    mono(
      c,
      s.dropped
        ? 'Frame ' + oldFrame.frame + ' proposal discarded'
        : 'Old point would hit ' + hit(newFrame, oldPoint).name,
      205,
      373,
      28,
      C.red,
    );
  path(
    c,
    [
      [893, 276],
      [893, 791],
    ],
    C.line,
    2,
  );
  const rows = liveRows(s.slide).sort((a, b) =>
    a.name === 'Artifacts' ? -1 : b.name === 'Artifacts' ? 1 : a.y - b.y,
  );
  const rowHeight = 74;
  rows.forEach((row) => {
    if (row.name === 'Artifacts' && !s.slide) return;
    const selected = row.name === s.live.open;
    c.save();
    if (row.name === 'Artifacts') {
      c.beginPath();
      c.rect(209, firstRowY + pitch, 645, pitch * s.slide);
      c.clip();
    }
    box(c, 210, row.y, 640, rowHeight, selected ? C.night : C.soft, selected ? C.ink : C.line, 2, 4);
    if (row.name !== 'Artifacts' || pitch * s.slide >= rowHeight)
      type(c, row.name, 244, row.y + 49, 34, {
        weight: selected ? 600 : 400,
        color: selected ? C.white : C.ink,
      });
    c.restore();
  });
  if (s.clicked) {
    serif(c, 'Failed tests', 943, 358, 57);
    mono(c, evidence.test, 945, 423, 27, C.dim, 808);
    traceback(c, 944, 473, 827, 277);
  } else if (s.captured) {
    mono(c, 'ACCESSIBILITY TREE   /   FRAME 3', 944, 322, 25);
    serif(c, 'Find tab “Failed tests”', 942, 406, 43, C.ink, 823);
    const tabs = [{ run, name: 'Failed tests' }, otherTab];
    tabs.forEach((row, i) => {
      const y = 456 + i * 116;
      box(c, 942, y, 824, 93, s.scoped && row.run === run ? C.mint : C.soft, C.line, 2, 4);
      mono(c, row.run, 966, y + 37, 26, row.run === run ? C.ink : C.dim);
      type(c, 'tab   /   ' + row.name, 966, y + 76, 28, { color: C.dim });
    });
    const matches = s.scoped
      ? Number(Boolean(resolveTab(newFrame, run, [...newFrame.rows, otherTab])))
      : tabs.length;
    mono(
      c,
      matches + (matches === 1 ? ' match in this run' : ' matches on page'),
      950,
      747,
      27,
      C.green,
    );
  } else {
    serif(c, 'Run overview', 941, 378, 62);
    mono(c, 'main   /   parser suite', 945, 439, 26);
    branch(c, 1040, 574, 560);
    mono(c, 'OPEN PANEL   /   Overview', 947, 751, 26);
  }
  if (s.dropped && !s.aim) {
    const { x, y } = oldPoint;
    dot(c, x, y, 17, C.paper, C.red);
    path(
      c,
      [
        [x - 7, y - 7],
        [x + 7, y + 7],
      ],
      C.red,
      3,
    );
    path(
      c,
      [
        [x - 7, y + 7],
        [x + 7, y - 7],
      ],
      C.red,
      3,
    );
  } else {
    pointer(c, oldPoint.x, mix(oldPoint.y, newPoint.y, s.aim));
  }
  const description = s.clicked
    ? 'Traceback open'
    : s.aim === 1
      ? 'Fresh target'
      : s.captured
        ? 'New capture'
        : s.dropped
          ? 'No click sent'
          : 'Proposed point';
  strip(
    c,
    'CAPTURE ' +
      (s.captured ? newFrame.frame : oldFrame.frame) +
      '    /    LIVE ' +
      (movingRows ? 'CHANGING' : s.live.frame),
    description + '     /     failure clicks  ' + s.live.clicks,
    s.clicked ? C.mint : C.amber,
  );
}

function delayed(c, k) {
  const b = k.beat.beatIndex;
  const dispatch = b === 0
    ? k.reveal('clicks Submit once', 0.95, { captionStart: 'Watch the incident form' })
    : 1;
  const sent = dispatch > 0;
  const store = b === 2
    ? k.reveal('stores one note', 0.78, { captionStart: 'The server processes the request' })
    : Number(b > 2);
  const reading = cue(k, 3, 'Read the incident record', 0.7);
  const linked = cue(k, 3, 'The receipt links');
  const alternate = b === 4 &&
    k.reveal('had timed out', 0, { captionStart: 'Suppose the bounded read' });
  const prediction = b === 1 &&
    k.reveal('should the host click again', 0, { captionStart: 'From that screen alone' });
  let verified = b > 3;
  if (b === 3) {
    const phrase = 'and the content matches';
    const { start, end } = k.wordCue(phrase);
    verified = k.reveal(phrase, end - start, { captionStart: phrase }) === 1;
  }
  const model = noteState(sent, store === 1, verified && !alternate);
  header(
    c,
    'SEPARATELY AUTHORIZED NOTE    /    DELAYED PORTAL',
    alternate ? 'What if the record read times out?'
      : prediction ? 'Should the host click again?' : 'Has the note arrived?',
  );
  window(c, 82, 190, 844, 612, 'incidents.example   /   note form');
  mono(c, 'INCIDENT', 127, 326, 23);
  serif(c, incident, 125, 411, 69);
  mono(c, 'NOTES ON SCREEN    ' + model.screenCount, 128, 471, 26, C.dim);
  box(c, 127, 516, 747, 140, C.soft, C.line, 2, 3);
  mono(c, model.body[0], 150, 566, 25, C.ink);
  mono(c, model.body[1], 150, 624, 33, C.ink);
  box(c, 127, 697, 245, 77, C.mint, C.green, 2, 3);
  type(c, 'Submit', 249, 747, 35, { align: 'center', weight: 600, color: C.green });
  pointer(c, 323, 737, 0.85);
  if (dispatch > 0 && dispatch < 1) {
    c.save();
    c.globalAlpha = 1 - dispatch;
    dot(c, 323, 737, 14 + 25 * dispatch, C.mint, C.green);
    c.restore();
  }
  box(c, 997, 191, 840, 611, C.night, null, 0, 6);
  mono(c, 'SERVER CUTAWAY   /   ' + incident, 1040, 253, 26, C.faint);
  path(
    c,
    [
      [1040, 286],
      [1791, 286],
    ],
    C.dim,
    2,
  );
  mono(c, 'PENDING REQUESTS', 1040, 343, 24, C.faint);
  const pending = dispatch === 1 ? model.queue.length : 0;
  mono(c, String(pending), 1718, 375, 66, C.white);
  if (pending && store === 0)
    tag(c, model.queue[0] + '    /    submit note', 1041, 374, 454, C.amber, C.well);
  else if (!pending) mono(c, 'Queue empty', 1041, 413, 28, C.faint);
  path(
    c,
    [
      [1040, 461],
      [1791, 461],
    ],
    C.dim,
    2,
  );
  mono(c, 'STORED NOTES', 1040, 516, 24, C.faint);
  mono(c, String(model.notes.length), 1718, 540, 66, C.white);
  if (model.notes.length) {
    box(c, 1041, 555, 736, 146, C.mint, null, 0, 4);
    const note = model.notes[0];
    mono(c, note.id + '   ←   ' + note.request, 1066, 595, 30, C.green);
    mono(c, note.body[0], 1066, 642, 25, C.ink);
    mono(c, note.body[1], 1066, 681, 28, C.ink);
  } else if (store === 0) mono(c, 'No note yet', 1041, 612, 33, C.faint);
  if (dispatch > 0 && dispatch < 1) {
    const track = [[372, 735], [391, 813], [1015, 813], [1015, 399], [1041, 399]];
    const lengths = track.slice(1).map(([x, y], i) => Math.hypot(x - track[i][0], y - track[i][1]));
    let distance = dispatch * lengths.reduce((sum, len) => sum + len, 0);
    const segment = lengths.findIndex((len) => {
      if (distance <= len) return true;
      distance -= len;
      return false;
    });
    const [from, to] = [track[segment], track[segment + 1]];
    const t = distance / lengths[segment];
    dot(c, mix(from[0], to[0], t), mix(from[1], to[1], t), 12, C.amber, C.well);
  }
  if (store > 0 && store < 1) {
    const y = mix(374, 555, ease(store));
    tag(c, model.queue[0] + '    /    submit note', 1041, y, 454, C.amber, C.well);
  }
  if (reading > 0 && !alternate) {
    const left = 878, right = 1035, y = 602;
    path(c, [[left, y], [mix(left, right, reading), y]], C.green, 4);
    if (reading < 1) dot(c, mix(left, right, reading), y, 9, C.green);
    if (linked) box(c, 1036, 550, 746, 155, null, verified ? C.mint : C.amber, 5, 4);
    if (verified) box(c, 127, 516, 747, 140, null, C.green, 5, 3);
  }
  mono(
    c,
    alternate
      ? 'Host read: timed out'
      : model.record
        ? 'Receipt matched: R1 → N1'
        : linked
          ? 'Receipt found: checking incident and content'
          : reading
            ? 'Host read: inspecting the incident record'
            : 'Host read: no receipt yet',
    1041,
    752,
    27,
    model.record ? C.mint : C.amber,
    741,
  );
  c.save();
  c.translate(0, -25);
  strip(
    c,
    'SUBMIT CLICKS    ' + model.clicks,
    alternate
      ? 'Unknown  /  stop and escalate'
      : model.outcome === 'Verified'
        ? 'Verified  /  one accepted note'
        : sent
          ? 'Dispatched  /  outcome unknown'
          : 'Ready  /  exact note approved',
    model.record ? C.mint : C.amber,
  );
  c.restore();
}

function access(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    const blocked = cue(k, 0, 'outside that scope');
    header(c, 'POLICY    /    READ-ONLY PILOT', 'What would the click do?');
    localFile(c, 84, 196, 803, 616);
    window(c, 958, 193, 880, 617, 'ci.example   /   ' + run);
    mono(c, 'PRODUCTION', 1000, 331, 26, C.red);
    serif(c, 'Start another job', 997, 431, 58);
    box(c, 1001, 492, 660, 122, C.blush, C.red, 3, 4);
    type(c, 'Deploy', 1331, 573, 56, { align: 'center', color: C.red, weight: 600 });
    pointer(c, 1558, 552, 1.1);
    mono(
      c,
      blocked ? 'Host decision   /   ' + policy('Deploy') : 'Requested effect   /   create job',
      1001,
      716,
      29,
      blocked ? C.red : C.ink,
      779,
    );
    strip(
      c,
      'PILOT GRANT',
      blocked ? 'Production jobs started   0' : 'Inspect run  /  save local draft',
    );
    return;
  }
  if (b <= 2) {
    const read = cue(k, 2, 'Execute the read'),
      pause = cue(k, 2, 'Pause before the rerun');
    header(c, 'SEPARATE DEPLOY WORKFLOW    /    APPROVAL PENDING', 'How far may this batch run?');
    box(c, 82, 194, 1756, 620, C.paper, C.ink, 3, 6);
    mono(c, 'ORDERED ACTIONS', 129, 263, 26);
    mono(c, 'HOST RESULT', 1270, 263, 26);
    batch.forEach((a, i) => {
      const y = 310 + i * 153;
      box(c, 129, y, 1661, 128, i === 1 ? C.soft : C.paper, C.line, 2, 4);
      mono(c, '0' + (i + 1), 162, y + 78, 36, C.dim);
      type(c, a.name, 275, y + 81, 49, { font: 'Serif', width: 810 });
      const outcome = (i === 0 && read) || (i > 0 && pause) ? gates[i] : 'Proposed';
      tag(
        c,
        outcome,
        1271,
        y + 34,
        451,
        outcome === 'Executed' ? C.mint : outcome === 'Awaiting review' ? C.amber : C.soft,
      );
    });
    strip(
      c,
      'EACH INPUT GETS ITS OWN CHECK',
      pause
        ? 'One read executed  /  batch paused'
        : read
          ? 'One read executed'
          : 'Review required for a production rerun',
    );
    return;
  }
  const after = cue(k, 4, 'now reads review approved');
  const granted = cue(k, 3, 'reviewer grants');
  const evidenceVisible = cue(k, 4, 'Look at the other incident');
  const verdict = cue(k, 5, 'Stop');
  const valid = verifyScope(observed);
  header(
    c,
    'SEPARATE INCIDENT WORKFLOW    /    SCOPED GRANT',
    'Did only the approved record change?',
  );
  box(c, 82, 190, 1756, 183, C.night, null, 0, 5);
  mono(c, granted ? 'APPROVED CHANGE' : 'PROPOSED CHANGE', 122, 238, 24, C.faint);
  type(c, grant.target + '   ' + grant.value, 120, 314, 51, {
    color: C.white,
    font: 'Serif',
    width: 843,
  });
  mono(c, 'Actor ' + grant.actor + '  /  session ' + grant.session, 1030, 249, 27, C.white, 760);
  mono(
    c,
    'Expected v' + grant.version + '  /  valid at t < ' + grant.expiry,
    1030,
    314,
    27,
    C.amber,
    765,
  );
  mono(c, 'RECORD', 116, 439, 25);
  mono(c, 'BEFORE', 597, 439, 25);
  mono(c, 'AFTER', 1214, 439, 25);
  before.forEach((r, i) => {
    const y = 468 + i * 157;
    const shown = i === 0 ? after : evidenceVisible;
    box(c, 82, y, 1756, 127, C.paper, C.line, 2, 4);
    mono(c, r.id, 120, y + 76, 37, C.ink, 407);
    mono(c, r.value, 597, y + 60, 29, C.dim, 507);
    mono(c, 'v' + r.version, 597, y + 101, 24, C.dim);
    path(
      c,
      [
        [1112, y + 60],
        [1168, y + 60],
        [1156, y + 48],
      ],
      C.dim,
      3,
    );
    if (shown) {
      mono(c, observed[i].value, 1214, y + 60, 31, verdict && !valid[i] ? C.red : C.ink, 575);
      mono(c, 'v' + observed[i].version, 1214, y + 101, 24, C.dim);
    } else mono(c, 'Awaiting read', 1214, y + 77, 29, C.dim);
  });
  strip(
    c,
    'VERIFIER SCOPE   /   TWO INCIDENTS',
    verdict && !valid.every(Boolean)
      ? 'Failed  /  unexpected closure'
      : after
        ? 'Compare both records with the grant'
        : 'Review exact change against current version',
    verdict ? C.amber : C.mint,
  );
}

function pageData(c, k) {
  const b = k.beat.beatIndex;
  const selected = cue(k, 1, 'Read the failure line');
  const denied = cue(k, 1, 'blocks the proposed deploy');
  const logged = cue(k, 3, 'logs the observation reference');
  const closed = cue(k, 3, 'closes the isolated session');
  header(
    c,
    'OBSERVATION    /    UNTRUSTED PAGE CONTENT',
    logged ? 'What stays in the audit log?' : 'What may the host take from this page?',
  );
  if (logged) {
    window(c, 82, 194, 1062, 616, 'host.audit   /   restricted events');
    const events = [
      ['Session', 'S9'],
      ['Observation', 'Frame 4'],
      ['Effect', 'Start production job'],
      ['Decision', policy('Deploy')],
    ];
    events.forEach(([name, val], i) => {
      const y = 336 + i * 119;
      mono(c, name.toUpperCase(), 126, y, 24);
      mono(c, val, 512, y + 2, 35, i === 3 ? C.red : C.ink, 591);
      path(
        c,
        [
          [125, y + 38],
          [1099, y + 38],
        ],
        C.line,
        2,
      );
    });
    fileIcon(c, 1223, 195, 607, 615, closed ? C.soft : C.paper);
    mono(c, 'TEMPORARY PROFILE', 1264, 272, 25);
    serif(c, 'Session S9', 1262, 380, 61);
    type(c, closed ? 'Closed' : 'Active', 1264, 497, 57, {
      weight: 600,
      color: closed ? C.dim : C.green,
    });
    mono(c, closed ? 'Profile cleared' : 'CI read-only', 1265, 583, 30, C.dim);
    strip(c, 'RETAINED EVIDENCE', 'Host references  /  classified action  /  decision');
    return;
  }
  const clean = cue(k, 3, 'A clean screenshot');
  window(c, 82, 192, 1060, 620, 'ci.example   /   ' + run, clean ? 'FRAME 5' : 'FRAME 4');
  if (!clean) {
    box(c, 122, 285, 978, 85, C.blush, C.red, 2, 3);
    type(c, 'Portal notice', 148, 338, 29, { weight: 600, color: C.red });
    type(c, 'Rerun deployment', 415, 341, 34, { color: C.ink, width: 644 });
  } else mono(c, 'New observation  /  notice cleared', 127, 342, 29, C.dim);
  traceback(c, 122, 405, 978, 270);
  mono(c, evidence.artifact, 123, 751, 28, C.blue);
  if (b < 2) {
    mono(c, 'HOST POLICY', 1217, 252, 26);
    serif(c, 'Inspect a failure', 1214, 345, 52, C.ink, 588);
    path(
      c,
      [
        [1217, 395],
        [1818, 395],
      ],
      C.line,
      2,
    );
    mono(c, 'READ FAILURE', 1218, 460, 24);
    if (selected) tag(c, policy('Read failure'), 1218, 498, 455, C.mint, C.green);
    mono(c, 'RERUN DEPLOY', 1218, 629, 24);
    if (denied) tag(c, policy('Deploy'), 1218, 667, 455, C.blush, C.red);
  } else {
    const ax = cue(k, 2, 'accessibility tree'),
      px = cue(k, 2, 'screenshot preserves');
    mono(c, 'VIEWS OF THE CONTROL', 1203, 252, 25);
    const rows = [
      ['DOM', '<canvas>'],
      ['Accessibility tree', 'tab  /  Failed tests'],
      ['Pixels + OCR', evidence.error],
    ];
    rows.forEach(([key, value], i) => {
      const y = 297 + i * 161;
      box(c, 1199, y, 627, 133, C.paper, C.line, 2, 4);
      mono(c, key, 1226, y + 45, 23);
      if (i === 0 || (i === 1 && ax) || (i === 2 && px))
        type(c, value, 1225, y + 101, 36, { font: 'Mono', color: C.ink, width: 572 });
    });
  }
  strip(
    c,
    'AUTHORITY    /    HOST POLICY',
    denied
      ? 'Bounded reads allowed  /  deploy blocked'
      : 'Read-only account  /  no production writes',
    denied ? C.mint : C.amber,
  );
}

function surfaceArt(c, x, y, index) {
  if (index === 0) {
    mono(c, '{  "run": "78432",', x, y + 31, 23, C.blue);
    mono(c, '   "test": "failed"  }', x, y + 73, 23, C.blue);
  } else if (index === 1) {
    box(c, x, y, 346, 82, C.paper, C.ink, 2, 4);
    mono(c, 'parser.log', x + 28, y + 51, 30, C.blue);
    path(
      c,
      [
        [x + 28, y + 56],
        [x + 213, y + 56],
      ],
      C.blue,
      2,
    );
  } else if (index === 2) {
    box(c, x, y, 346, 83, C.sky, C.blue, 2, 3);
    mono(c, 'parser.py  line 18', x + 19, y + 50, 24, C.ink, 320);
  } else {
    box(c, x, y, 346, 83, C.well, null, 0, 4);
    mono(c, '+   Failed tests', x + 19, y + 52, 24, C.white, 310);
    pointer(c, x + 306, y + 45, 0.55);
  }
}
function practice(c, k) {
  const b = k.beat.beatIndex;
  if (b <= 1) {
    const select = cue(k, 1, 'Use the selector'),
      visual = cue(k, 1, 'Use the visual loop'),
      api = cue(k, 1, 'supported API'),
      image = cue(k, 1, 'read an existing image');
    header(c, 'PRACTICE    /    CHOOSE AN INTERFACE', 'Which job needs a visual agent?');
    const visible = b === 0 ? [1, 3] : [1, 3, 0, 2];
    visible.forEach((idx, j) => {
      const y = b === 0 ? 218 + j * 286 : 186 + j * 155;
      const h = b === 0 ? 250 : 140;
      box(c, 82, y, 1756, h, C.paper, C.line, 2, 4);
      const center = y + h / 2;
      surfaceArt(c, 126, center - 41, idx);
      type(c, surfaces[idx][0], 542, center + 16, 48, { font: 'Serif', width: 595 });
      const answer = [api, select, image, visual][idx];
      if (answer) tag(c, surfaces[idx][1], 1228, center - 23, 514, idx === 3 ? C.amber : C.mint);
      else mono(c, '?', 1488, center + 18, 43, C.dim);
    });
    strip(
      c,
      'SCOPE  /  APPROVED WORKFLOW',
      b === 0
        ? 'Choose a surface for each task'
        : 'Use the narrowest surface that completes each task',
      b === 0 ? C.amber : C.mint,
    );
    return;
  }
  if (b === 2 || b === 3) {
    const scored = cue(k, 3, 'One forbidden attempt');
    const m = scores(episode);
    header(
      c,
      'PRACTICE    /    ONE LOCAL TEST EPISODE',
      'Does a well-aimed click count as success?',
    );
    window(c, 82, 192, 1090, 628, 'host.trace   /   read-only pilot');
    const progress = [
      cue(k, 2, 'first click opened'),
      cue(k, 2, 'stale click was withheld'),
      cue(k, 2, 'fresh click reached'),
      cue(k, 2, 'saved the correct local draft'),
      cue(k, 2, 'The host blocked it'),
    ];
    episode.forEach((r, i) => {
      const y = 295 + i * 96;
      mono(c, String(i + 1).padStart(2, '0'), 120, y + 48, 26, C.dim);
      type(c, r.name, 208, y + 48, 35, { weight: 600, width: 491 });
      if (progress[i])
        tag(
          c,
          r.outcome,
          735,
          y + 9,
          389,
          r.forbidden ? C.blush : r.outcome === 'Stale frame' ? C.amber : C.mint,
        );
      path(
        c,
        [
          [118, y + 79],
          [1132, y + 79],
        ],
        C.line,
        2,
      );
    });
    mono(c, 'EPISODE SCORE', 1225, 249, 25);
    const rows = [
      ['Dispatched hits', m.hits + ' / ' + m.clicks],
      ['Local draft', m.goal ? 'Verified' : 'Missing'],
      ['Forbidden attempts', m.attempts + ' / ' + m.steps],
      ['Executed violations', String(m.violations)],
    ];
    rows.forEach(([name, value], i) => {
      const y = 293 + i * 129;
      mono(c, name, 1226, y + 26, 26, C.dim, 550);
      type(c, scored ? value : '?', 1224, y + 90, 51, {
        font: 'Mono',
        color: scored ? C.ink : C.dim,
        width: 570,
      });
      path(
        c,
        [
          [1224, y + 109],
          [1824, y + 109],
        ],
        C.line,
        2,
      );
    });
    strip(
      c,
      'GOAL   /   VERIFIED LOCAL DRAFT',
      scored
        ? `${m.steps} proposals   /   ${m.attempts} forbidden attempt   /   ${m.violations} executed violations`
        : 'Which proposals reached the browser?',
      scored ? C.mint : C.amber,
    );
    return;
  }
  if (b === 4) {
    const need = cue(k, 4, 'measure steps');
    header(
      c,
      'PILOT REVIEW    /    TRANSFER TO THE ACTUAL PORTAL',
      'Is a benchmark score enough to grant writes?',
    );
    box(c, 82, 195, 760, 618, C.night, null, 0, 5);
    mono(c, 'BENCHMARK   /   EXAMPLE', 124, 259, 25, C.faint);
    serif(c, '92%', 130, 489, 165, C.white, 641);
    type(c, 'Task success', 134, 592, 44, { color: C.mint });
    mono(c, 'Benchmark tasks and verifier', 134, 738, 25, C.faint, 654);
    mono(c, 'ON THIS CI PORTAL', 930, 259, 25);
    const rows = [
      'Grounding and final state',
      'Steps, calls, latency and cost',
      'Blocked and executed effects',
      'Reviews per episode',
    ];
    rows.forEach((r, i) => {
      const y = 316 + i * 115;
      box(c, 927, y + 6, 47, 47, C.soft, C.dim, 2, 3);
      if (need) mono(c, '?', 938, y + 41, 26, C.dim);
      type(c, r, 1007, y + 46, 35, { width: 803 });
      path(
        c,
        [
          [927, y + 82],
          [1821, y + 82],
        ],
        C.line,
        2,
      );
    });
    strip(
      c,
      'WRITE ACCESS',
      need ? 'Collect evidence in the read-only pilot' : 'Decision pending',
      C.amber,
    );
    return;
  }
  const done = cue(k, 5, 'verified local draft'),
    ext = cue(k, 5, 'Posting it needs');
  header(c, 'HANDOFF    /    READ-ONLY PILOT', 'What can the reviewer use today?');
  localFile(c, 82, 194, 869, 620);
  mono(c, 'REVIEWER COPY', 1030, 250, 25);
  serif(c, 'Local incident draft', 1026, 351, 61, C.ink, 787);
  type(c, done ? 'Evidence verified' : 'Compare with the run', 1030, 446, 41, {
    weight: 600,
    color: C.green,
    width: 766,
  });
  if (ext) {
    path(
      c,
      [
        [1030, 505],
        [1830, 505],
      ],
      C.line,
      2,
    );
    mono(c, 'TO POST A CHANGE', 1031, 563, 24);
    type(c, 'Scope  +  current version  +  exact diff', 1030, 643, 33, { width: 772 });
    type(c, 'Verify the record and related effects.', 1030, 712, 33, { width: 772 });
  }
  strip(
    c,
    'PILOT OUTCOME',
    done ? 'Verified draft on host   /   external writes   0' : 'Read-only inspection',
  );
}

const painters = {
  c01: opening,
  c02: manifest,
  c03: coordinates,
  c04: freshness,
  c05: delayed,
  c06: access,
  c07: pageData,
  c08: practice,
};
function check() {
  checkExample();
  plates.forEach(({ origin, devicePerUnit }, i) => {
    assert.deepEqual(
      spaces[i].point.map((n, axis) => origin[axis] + n * devicePerUnit[axis]),
      nativeSpace.point,
    );
  });
  const fake = (b, values) => ({ beat: { beatIndex: b }, reveal: (phrase) => values[phrase] ?? 0 });
  const partial = freshnessState(fake(1, { 'slides in': 0.5 }));
  assert.equal(partial.slide, 0.5);
  assert.equal(partial.aim, 0);
  assert.equal(partial.live.clicks, 0);
  assert.equal(freshnessState(fake(2, { 'Discard the proposal': 1 })).live.open, 'Overview');
  const moving = freshnessState(fake(4, { 'Move the proposed point': 0.5 }));
  assert.equal(moving.live.clicks, 0);
  assert.equal(moving.aim, 0.5);
  assert.equal(
    freshnessState(fake(4, { 'Move the proposed point': 1, 'Now click': 1 })).live,
    opened,
  );
}
export default {
  title,
  draw(c, k) {
    painters[k.beat.chapterId](c, k);
  },
  check,
};
