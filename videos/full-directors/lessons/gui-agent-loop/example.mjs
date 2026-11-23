import assert from 'node:assert/strict';

export const run = 'RUN-78432';
export const incident = 'INC-2048';
export const evidence = Object.freeze({
  test: 'ReportParser::rejectsFailure',
  file: 'parser.py',
  line: 18,
  error: "KeyError: 'status'",
  artifact: 'ci://RUN-78432/test-parser/log',
});
export const draft = { run, incident, ...evidence };
export function matchesDraft(note) {
  return Object.entries(draft).every(([key, value]) => note?.[key] === value);
}

export const request = {
  profile: 'Reused',
  sites: ['ci.example', 'mail.example'],
  access: 'Read + deploy',
};
export const pilot = { profile: 'Fresh', sites: ['ci.example'], access: 'Read only' };
export function admit(session) {
  return (
    session.profile === 'Fresh' &&
    session.sites.length === 1 &&
    session.sites[0] === 'ci.example' &&
    session.access === 'Read only'
  );
}

function scaled(p, from, to) {
  return p.map((n, i) => Math.floor((n * to[i]) / from[i]));
}
export function coordinateSpaces() {
  const pad = [32, 16],
    origin = [100, 50],
    rendered = [320, 200],
    crop = [640, 400];
  const model = [132, 66],
    local = model.map((n, i) => n - pad[i]);
  const enlarged = scaled(local, rendered, crop);
  const native = enlarged.map((n, i) => n + origin[i]);
  return [
    {
      name: 'Padded image',
      size: [384, 232],
      point: model,
      bounds: [...pad, ...rendered],
      op: 'Image origin',
      units: 'image px',
    },
    {
      name: 'Rendered crop',
      size: rendered,
      point: local,
      op: 'Subtract padding (32, 16)',
      units: 'crop px',
    },
    {
      name: 'Original crop',
      size: crop,
      point: enlarged,
      op: 'Multiply each axis by 2',
      units: 'crop px',
    },
    {
      name: 'Native viewport',
      size: [1024, 768],
      point: native,
      bounds: [...origin, ...crop],
      op: 'Add crop origin (100, 50)',
      units: 'device px',
    },
    {
      name: 'Driver viewport',
      size: [512, 384],
      point: native.map((n) => n / 2),
      bounds: [...origin, ...crop].map((n) => n / 2),
      op: 'Divide each axis by DPR 2',
      units: 'CSS px',
    },
  ];
}
export const exercise = { from: [600, 400], to: [1500, 1000], point: [180, 120] };
export const landing = scaled(exercise.point, exercise.from, exercise.to);
export const tabMark = { id: 7, tab: 1, frame: 2, name: 'Failed tests', box: [212, 184, 260, 74] };
export function currentMark(id, tab, frame) {
  return id === tabMark.id && tab === tabMark.tab && frame === tabMark.frame ? tabMark : null;
}

export const firstRowY = 427,
  pitch = 92,
  pointerX = 755;
const intended = 'Failed tests';
export function liveRows(insert) {
  const names = ['Overview', intended, 'Reports'];
  const rows = names.map((name, i) => ({
    name,
    y: firstRowY + (i + (i > 0 ? insert : 0)) * pitch,
    run,
    enabled: true,
  }));
  if (insert > 0) rows.push({ name: 'Artifacts', y: firstRowY + pitch, run, enabled: true });
  return rows;
}
export const oldFrame = {
  session: 'S9',
  frame: 2,
  run,
  rows: liveRows(0),
  open: 'Overview',
  clicks: 0,
};
export const newFrame = { ...oldFrame, frame: 3, rows: liveRows(1) };
export const otherTab = { name: intended, run: 'RUN-78431', enabled: true, y: 0 };
export function resolveTab(frame, scope = run, candidates = frame.rows) {
  const matches = candidates.filter(
    (row) => row.name === intended && (!scope || row.run === scope),
  );
  if (matches.length !== 1 || !matches[0].enabled) return null;
  return {
    session: frame.session,
    frame: frame.frame,
    run: scope,
    target: intended,
    x: pointerX,
    y: matches[0].y + 35,
  };
}
export const oldPoint = resolveTab(oldFrame),
  newPoint = resolveTab(newFrame);
export function hit(frame, p) {
  return frame.rows.find((row) => p.x >= 210 && p.x < 850 && p.y >= row.y && p.y < row.y + 74);
}
export function dispatch(frame, p) {
  if (!p || p.session !== frame.session || p.frame !== frame.frame) return frame;
  const target = hit(frame, p);
  if (target?.name !== intended || target.run !== p.run || !target.enabled) return frame;
  return { ...frame, frame: frame.frame + 1, open: target.name, clicks: frame.clicks + 1 };
}
export const held = dispatch(newFrame, oldPoint),
  opened = dispatch(held, newPoint);

export function noteState(sent, processed, verified) {
  const body = [run + '   /   ' + evidence.file + ':' + evidence.line, evidence.error];
  const queue = sent && !processed ? ['R1'] : [];
  const notes = sent && processed ? [{ id: 'N1', request: 'R1', incident, body: [...body] }] : [];
  const record = verified
    ? notes.find(
        (n) =>
          n.request === 'R1' && n.incident === incident && n.body.join('\n') === body.join('\n'),
      )
    : null;
  return {
    clicks: Number(sent),
    queue,
    notes,
    body,
    screenCount: 0,
    outcome: record ? 'Verified' : sent ? 'Unknown' : 'Unsent',
    record,
  };
}

export const batch = [
  { name: 'Read traceback', effect: 'read' },
  { name: 'Rerun deploy', effect: 'deploy' },
  { name: 'Scroll', effect: 'scroll' },
];
export function runBatch(steps, deployPermitted, approved) {
  let stopped = false;
  return steps.map(({ effect }) => {
    if (stopped) return 'Unsent';
    if (effect === 'deploy' && !(deployPermitted && approved)) {
      stopped = true;
      return deployPermitted ? 'Awaiting review' : 'Blocked';
    }
    return 'Executed';
  });
}
export const grant = {
  actor: 'on-call',
  session: 'S4',
  target: incident,
  version: 4,
  value: 'review_approved',
  expiry: 120,
};
export const before = [
  { id: incident, value: 'traceback_collected', version: 4 },
  { id: 'INC-9911', value: 'open', version: 7 },
];
export const observed = [
  { id: incident, value: grant.value, version: 5 },
  { id: 'INC-9911', value: 'closed', version: 8 },
];
export function verifyScope(records) {
  return before.map((prior, i) => {
    const expected =
      prior.id === grant.target
        ? { ...prior, value: grant.value, version: grant.version + 1 }
        : prior;
    return Object.keys(expected).every((k) => expected[k] === records[i]?.[k]);
  });
}
const pilotActions = new Set(['Read failure', 'Open run', 'Save local draft']);
export const policy = (action) => (pilotActions.has(action) ? 'Allowed' : 'Blocked');
export const surfaces = [
  ['Run status', 'Supported API'],
  ['Artifact link', 'Stable selector'],
  ['Saved screenshot', 'Image analysis'],
  ['Interactive canvas', 'Visual loop'],
];
export const runButton = { x: 917, y: 472, w: 228, h: 76 };
export const openRunPoint = { x: 1081, y: 506 };
const openHit =
  openRunPoint.x >= runButton.x &&
  openRunPoint.x < runButton.x + runButton.w &&
  openRunPoint.y >= runButton.y &&
  openRunPoint.y < runButton.y + runButton.h;
export const episode = [
  { name: 'Open run', outcome: openHit ? 'Dispatched' : 'Missed', click: true, hit: openHit },
  { name: 'Old failure tab', outcome: held === newFrame ? 'Stale frame' : 'Dispatched' },
  {
    name: 'Fresh failure tab',
    outcome: opened.clicks === 1 ? 'Dispatched' : 'Held',
    click: true,
    hit: hit(newFrame, newPoint)?.name === intended,
  },
  { name: 'Save local draft', outcome: matchesDraft(draft) ? 'Verified' : 'Failed' },
  { name: 'Deploy', outcome: 'Blocked', forbidden: policy('Deploy') === 'Blocked' },
];
export function scores(rows) {
  const clicks = rows.filter((r) => r.click && r.outcome === 'Dispatched');
  const attempts = rows.filter((r) => r.forbidden);
  return {
    hits: clicks.filter((r) => r.hit).length,
    clicks: clicks.length,
    attempts: attempts.length,
    violations: attempts.filter((r) => r.outcome === 'Dispatched').length,
    steps: rows.length,
    goal: rows.some((r) => r.name === 'Save local draft' && r.outcome === 'Verified'),
  };
}
export function checkExample() {
  assert.equal(admit(request), false);
  assert.equal(admit(pilot), true);
  for (const key of Object.keys(pilot))
    assert.equal(admit({ ...pilot, [key]: request[key] }), false);
  assert.deepEqual(
    coordinateSpaces().map((s) => s.point),
    [
      [132, 66],
      [100, 50],
      [200, 100],
      [300, 150],
      [150, 75],
    ],
  );
  assert.deepEqual(landing, [450, 300]);
  assert.deepEqual(currentMark(7, 1, 2)?.box, [212, 184, 260, 74]);
  assert.equal(currentMark(7, 1, 3), null);
  assert.equal(currentMark(7, 2, 2), null);
  assert.equal(hit(oldFrame, oldPoint).name, intended);
  assert.equal(hit(newFrame, oldPoint).name, 'Artifacts');
  assert.equal(oldPoint.y + pitch, newPoint.y);
  assert.equal(held, newFrame);
  assert.equal(held.clicks, 0);
  assert.equal(resolveTab(newFrame, null, [...newFrame.rows, otherTab]), null);
  assert.deepEqual(resolveTab(newFrame, run, [...newFrame.rows, otherTab]), newPoint);
  assert.equal(dispatch(newFrame, { ...newPoint, session: 'S8' }), newFrame);
  assert.equal(dispatch(newFrame, { ...newPoint, run: 'RUN-78431' }), newFrame);
  assert.equal(
    resolveTab({ ...newFrame, rows: newFrame.rows.map((r) => ({ ...r, enabled: false })) }),
    null,
  );
  assert.deepEqual([opened.frame, opened.open, opened.clicks], [4, intended, 1]);
  const pending = noteState(true, false, false),
    saved = noteState(true, true, false),
    result = noteState(true, true, true);
  assert.deepEqual(
    [pending.queue.length, pending.notes.length, pending.outcome],
    [1, 0, 'Unknown'],
  );
  assert.deepEqual([saved.queue.length, saved.notes.length, saved.outcome], [0, 1, 'Unknown']);
  assert.deepEqual(
    [result.record.id, result.clicks, result.screenCount, result.outcome],
    ['N1', 1, 0, 'Verified'],
  );
  assert.deepEqual(runBatch(batch, true, false), ['Executed', 'Awaiting review', 'Unsent']);
  assert.deepEqual(runBatch(batch, false, false), ['Executed', 'Blocked', 'Unsent']);
  assert.deepEqual(verifyScope(observed), [true, false]);
  assert.deepEqual(verifyScope([observed[0], before[1]]), [true, true]);
  assert.equal(matchesDraft({ ...draft, run: 'RUN-78431' }), false);
  assert.equal(policy('Deploy'), 'Blocked');
  assert.deepEqual(scores(episode), {
    hits: 2,
    clicks: 2,
    attempts: 1,
    violations: 0,
    steps: 5,
    goal: true,
  });
  const deployDispatched = episode.map((row) =>
    row.name === 'Deploy' ? { ...row, outcome: 'Dispatched', click: true, hit: true } : row,
  );
  assert.equal(scores(deployDispatched).attempts, 1);
  assert.equal(scores(deployDispatched).violations, 1);
}
