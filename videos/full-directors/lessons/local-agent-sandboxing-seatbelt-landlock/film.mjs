import assert from 'node:assert/strict';
import { Bench } from './bench.mjs';
import { opening, linux, paths, lifetime } from './worker.mjs';
import { controls, mac, broker, verify } from './boundaries.mjs';
import {
  testCase,
  runTest,
  append,
  grantWrites,
  grantRows,
  probe,
  experiment,
  helperFiles,
  editorRun,
  reads,
  seatbeltStartup,
  brokerScope,
  dispatch,
  lockedDigest,
  wheelDigest,
  inspectReceipt,
  exerciseMarker,
  extendedRights,
} from './operations.mjs';

const chapters = [opening, linux, paths, lifetime, controls, mac, broker, verify];

// Capture the semantic marks emitted by the same painters used by the course host.
function snapshot(painter, beatIndex, spoken = []) {
  const marks = [];
  const surface = {};
  for (const type of [
    'base',
    'footer',
    'text',
    'mono',
    'box',
    'dot',
    'poly',
    'stroke',
    'byte',
    'file',
    'track',
    'worker',
    'folder',
    'arrow',
  ])
    surface[type] = (...args) => marks.push({ type, args });
  painter(surface, {
    beat: { beatIndex },
    reveal: (phrase) => Number(spoken.includes(phrase)),
    wordCue: () => ({ start: 0, end: 1 }),
  });
  return {
    has: (word) => marks.some((m) => m.args[0] === word),
    labelX: (word) => marks.find((m) => m.type === 'mono' && m.args[0] === word)?.args[1],
    footer: marks.find((m) => m.type === 'footer')?.args[0],
    bytes: marks.filter((m) => m.type === 'byte').map((m) => m.args[2] ?? 'x'),
    file: (name) => marks.find((m) => m.type === 'file' && m.args[4] === name)?.args[5],
    contents: marks.filter((m) => m.type === 'file').map((m) => m.args.slice(5, 7)),
    workers: marks.filter((m) => m.type === 'worker').map((m) => m.args[0]),
  };
}
function check() {
  const { actual, outputByte } = runTest(testCase);
  assert.equal(actual, testCase.expected);
  assert.equal(outputByte, 'x');
  assert.equal(runTest({ ...testCase, expected: 9 }).outputByte, '');
  assert.equal(append('', outputByte, grantWrites('src', testCase.output)), 'x');
  assert.equal(append('4', outputByte, grantWrites('src', testCase.path)), '4');
  const pendingByte = snapshot(opening, 0, ['reads four', 'gets eight', 'single lowercase x']);
  assert.deepEqual(pendingByte.bytes, ['x']);
  assert.equal(pendingByte.file('case.txt'), '4');
  assert.equal(pendingByte.file('report.txt'), '');
  assert.equal(pendingByte.footer, undefined);
  const destination = snapshot(opening, 1, ['Follow the x']);
  assert.equal(destination.file('report.txt'), '');
  assert.equal(destination.footer, undefined);
  const choice = snapshot(opening, 1, ['Follow the x', 'If the launcher grants']);
  assert(choice.footer.includes('tests/     src/     .git/'));
  assert.deepEqual(choice.bytes, ['x']);
  assert.equal(choice.file('report.txt'), '');
  const wrote = snapshot(opening, 2, ['Grant the report directory', 'appends the x']);
  assert.equal(wrote.file('report.txt'), 'x');
  assert.equal(wrote.file('case.txt'), '4');
  assert.deepEqual(probe(2), { covered: [true, false], canStart: false });
  assert(probe(3).canStart);
  assert.deepEqual(probe(4, extendedRights), { covered: [true, false], canStart: false });
  assert.deepEqual(
    grantRows('project', true).map((r) => r.write),
    [true, true, true],
  );
  assert.deepEqual(
    grantRows('src', false).map((r) => r.write),
    [false, true, false],
  );
  assert(snapshot(linux, 5, ['replace the project grant']).has('Child read grant'));
  assert(!snapshot(linux, 2, ['create a ruleset']).has('Restricted'));
  assert(
    snapshot(linux, 2, ['then enforce', 'future child inherits']).has('Future child • restricted'),
  );
  assert(snapshot(linux, 3, ['fresh open would be denied']).has('Read handle'));
  assert(snapshot(linux, 3, ['Close the unnecessary handle']).has('Closed before launch'));
  assert.deepEqual(
    experiment.map((r) => r.stops.slice(-3)),
    [
      ['/workspace/src/cache', '/workspace/src', '/workspace/src/report.txt'],
      ['/workspace/archive/daily', '/workspace/archive', '/workspace/archive/report.txt'],
    ],
  );
  assert.deepEqual(
    helperFiles.map((r) => [r.helper, r.grant]),
    [
      [false, false],
      [true, false],
      [false, false],
      [true, false],
    ],
  );
  const waiting = editorRun(false, true, true, false, false, false);
  assert(waiting.taskOnDisk && waiting.exited && !waiting.formatter);
  assert(!editorRun(false, true, true, true, false, true).formatter);
  assert(editorRun(false, true, true, true, true, true).formatter);
  assert(!editorRun(true, true, true, true, true, true).formatter);
  assert.deepEqual(
    reads.map((r) => [r.syscall, r.resource, r.read]),
    [
      [true, true, true],
      [true, false, false],
    ],
  );
  assert(snapshot(controls, 0, ['filter admits both calls']).has('Allowed'));
  assert(!snapshot(controls, 0, ['filter admits both calls']).has('Read denied'));
  assert(
    snapshot(controls, 1, ['filesystem admits the fixture', 'denies the private note']).has(
      'Read denied',
    ),
  );
  const mountSetup = snapshot(controls, 2);
  assert(mountSetup.has('Linux   /   Bubblewrap mount model') && mountSetup.has('/app/.git'));
  assert(mountSetup.has('Predict from the mount') && mountSetup.has('Inspect configuration'));
  const mountPrediction = snapshot(controls, 2, ['would block a write']);
  assert(mountPrediction.has('Mount would block this write'));
  assert(mountPrediction.has('Inspect configuration'));
  const mountQuestion = snapshot(controls, 2, ['would block a write', 'filter descriptor is absent']);
  assert(mountQuestion.has('No filter supplied') && mountQuestion.footer.endsWith('?'));
  const mountAnswer = snapshot(controls, 3, ['in that run']);
  assert(mountAnswer.has('Mount would block this write') && mountAnswer.has('No filter supplied'));
  assert.equal(mountAnswer.footer, 'A refusal on the host would confirm that this write was blocked.');
  assert.equal(wheelDigest, lockedDigest);
  assert.equal(seatbeltStartup(true, 'error').workersStarted, 0);
  assert.equal(seatbeltStartup(true, 'loaded').workersStarted, 1);
  assert.deepEqual(snapshot(mac, 0, ['load returns an error']).workers, [389]);
  const loaded = ['On a second launch', 'required profile becomes active'];
  assert.deepEqual(snapshot(mac, 1, loaded).workers, [389, 389]);
  assert.deepEqual(snapshot(mac, 1, [...loaded, 'launcher start the test']).workers, [389, 785]);
  assert.deepEqual(dispatch(brokerScope), {
    allowed: true,
    upstream: 1,
    reply: { number: 42, state: 'open' },
  });
  for (const change of [
    { method: 'POST' },
    { repo: 'elsewhere' },
    { caller: 'another' },
    { number: 7 },
    { args: 'extra' },
  ])
    assert.deepEqual(dispatch({ ...brokerScope, ...change }), {
      allowed: false,
      upstream: 0,
      reply: null,
    });
  const pending = snapshot(broker, 2, ['Change the method', 'to POST']);
  assert(pending.has('POST   owner/repo') && pending.has('GET × 1') && pending.has('Await authorization'));
  assert(!pending.has('Denied before dispatch'));
  const denied = snapshot(broker, 3, ['Deny the request', 'before dispatch']);
  assert(denied.has('Denied before dispatch') && denied.has('Upstream calls: 1'));
  assert.equal(denied.labelX('POST'), pending.labelX('POST'));
  assert.equal(pending.labelX('POST'), 620);
  for (const r of experiment) {
    const receipt = inspectReceipt(r);
    assert.deepEqual(receipt.predicted, receipt.observed);
    assert.equal(r.allowed, receipt.exit === 0);
  }
  assert.deepEqual(
    experiment.map((r) => inspectReceipt(r).observed),
    [
      { src: 1, archive: 0 },
      { src: 0, archive: 0 },
    ],
  );
  assert.equal(inspectReceipt(experiment[1]).message, 'Operation not permitted');
  const awaitingReadback = Array.from({ length: 4 }, () => ['?', 'Readback pending']);
  const prediction = snapshot(verify, 0, ['each tried to append']);
  assert.deepEqual(prediction.bytes, ['x', 'x']);
  assert.deepEqual(prediction.contents, awaitingReadback);
  assert(!prediction.has('Shell exit 0') && !prediction.has('Shell exit 1'));
  const outcomes = snapshot(verify, 1, [
    'In A the append succeeds',
    'In B the append to the archive fixture is denied',
    'operation not permitted',
    'What should the host measure next',
  ]);
  assert.deepEqual(outcomes.contents, awaitingReadback);
  assert(
    outcomes.has('Shell exit 0') &&
      outcomes.has('Shell exit 1') &&
      outcomes.has('Operation not permitted'),
  );
  assert.deepEqual(snapshot(verify, 2, ['supervisor compares']).contents, awaitingReadback);
  const source = 'A has one byte in the source report';
  const archive = 'and zero in archive';
  const copyB = 'B still has two empty files';
  assert.deepEqual(snapshot(verify, 2, [source]).contents, [
    ['1', '1 byte read back'],
    ...awaitingReadback.slice(1),
  ]);
  assert.deepEqual(snapshot(verify, 2, [source, archive]).contents, [
    ['1', '1 byte read back'],
    ['0', '0 bytes read back'],
    ...awaitingReadback.slice(2),
  ]);
  assert.deepEqual(
    snapshot(verify, 2, [source, archive, copyB]).contents,
    [['1', '1 byte read back'], ...Array.from({ length: 3 }, () => ['0', '0 bytes read back'])],
  );
  assert.deepEqual(exerciseMarker(), { before: 'clean', after: 'clean', report: 'x' });
  assert.deepEqual(snapshot(verify, 4).contents.at(-1), ['?', 'compare bytes']);
  assert.deepEqual(snapshot(verify, 4, ['It should read clean, all five bytes']).contents.at(-1), [
    'clean',
    '5 bytes',
  ]);
  return true;
}

export default {
  title: 'Local Agent Sandboxing: Paths, Lifetimes and Real Boundaries',
  draw(ctx, clock) {
    chapters[clock.beat.chapterIndex](new Bench(ctx), clock);
  },
  check,
};
