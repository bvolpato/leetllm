import { reportWalk } from './report-board.mjs';
import { attempts, reportRuns } from './fixtures.mjs';
import {
  broker,
  canWrite,
  exactBrokerRequest,
  freshSandboxDecision,
  helperAllows,
  hookSnapshot,
  layeredWrite,
  pathSnapshot,
  resolveFixture,
  resource,
  sampleModel,
  sanitizeBrokerReply,
  seatbeltStartup,
  syscallAllowed,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  validateSandboxExpansion();
  const [ordinary, linked] = reportRuns.map(reportWalk);
  assert.deepEqual(ordinary.stops.slice(-2), ['/workspace/src', '/workspace/src/report.txt']);
  assert.deepEqual(linked.stops.slice(-3), [
    '/workspace/archive/daily',
    '/workspace/archive',
    '/workspace/archive/report.txt',
  ]);
  for (const run of reportRuns) {
    assert.equal(reportWalk(run).allowed, run.exit === 0);
    assert.equal(run.sourceBytes, run.exit === 0 ? 1 : 0);
    assert.equal(run.archiveBytes, 0);
  }
  assert.equal(seatbeltStartup(true, 'error').workersStarted, 0);
  assert.equal(seatbeltStartup(true, 'loaded').workersStarted, 1);
  assert(canWrite(attempts[0].path));
  for (const r of attempts.slice(1)) assert(!canWrite(r.path));
  assert.equal(resource('/workspace/src/../../secret'), '/secret');
  assert.equal(resource('/workspace/src/key-link/../test'), '/home/dev/.ssh/test');
  assert.throws(
    () =>
      resolveFixture('/loop', {
        '/loop': '/loop',
      }),
    /cycle/,
  );
  assert(broker('GET', 'owner/project'));
  assert(!broker('POST', 'owner/project'));
  assert(!broker('GET', 'other/project'));
  assert(!syscallAllowed('ptrace'));
  assert(!syscallAllowed('socket-raw-packet'));
  assert(syscallAllowed('openat'));
  assert(
    !sampleModel('verify', {
      beat: 1,
      beatP: 1,
    }).hostEnforcement,
  );
  for (const beatP of [0.02, 0.1, 0.13])
    assert(
      sampleModel('broker', {
        beat: 1,
        beatP,
      }).brokerAllowed,
    );
  assert(
    !sampleModel('broker', {
      beat: 1,
      beatP: 0.18,
    }).brokerAllowed,
  );
  for (const beatP of [0.25, 0.5, 0.75, 0.98])
    assert(
      !sampleModel('broker', {
        beat: 1,
        beatP,
      }).brokerAllowed,
    );
  for (let beat = 0; beat < 4; beat++) {
    const first = pathSnapshot(beat, 0),
      last = pathSnapshot(beat, 1);
    assert.equal(first.currentPath, '/');
    assert(!first.decisionReady);
    assert.equal(last.currentPath, last.resolution.actual);
    assert(last.decisionReady);
    assert.equal(canWrite(attempts[last.attempt].path), beat === 0);
  }
  const planted = hookSnapshot(0, 0.5),
    ended = hookSnapshot(0, 1),
    later = hookSnapshot(1, 1),
    blocked = hookSnapshot(2, 1);
  assert(planted.workerAlive && planted.hookPresent && !planted.hostStarted);
  assert(!ended.workerAlive && ended.hookPresent && !ended.hostStarted && !ended.childStarted);
  assert(later.childStarted && !later.workerAlive);
  assert(
    blocked.plantDenied && blocked.hostStarted && !blocked.hookPresent && !blocked.childStarted,
  );
  const atPath = (b, t) => pathSnapshot(b, t / [16.28, 16.256, 16.856, 18.056][b]);
  assert.equal(atPath(0, 4.43).currentPath, '/workspace/src/app.py');
  assert.equal(atPath(1, 6.03).currentPath, '/');
  assert.equal(atPath(1, 11.62).currentPath, '/home/dev/.ssh/key.pem');
  assert.equal(atPath(2, 1.03).currentPath, '/workspace/src/key-link');
  assert.equal(atPath(2, 7.71).currentPath, '/home/dev/.ssh/key.pem');
  assert(!hookSnapshot(0, 10.54 / 15.448).hostStarted);
  assert(!hookSnapshot(0, 10.56 / 15.448).workerAlive);
  assert(hookSnapshot(1, 2.44 / 16.384).hostStarted);
  assert(!hookSnapshot(1, 6.85 / 16.384).childStarted);
  assert(hookSnapshot(1, 6.87 / 16.384).childStarted);
  return true;
}
export function validateSandboxExpansion() {
  assert(helperAllows('/workspace/.git'));
  assert(helperAllows('/workspace/.env.local'));
  assert(helperAllows('/workspace/.git/config.bak'));
  for (const p of [
    '/workspace/.git/hooks/post-checkout',
    '/workspace/.git/config',
    '/workspace/.vscode/tasks.json',
    '/workspace/.env',
    '/outside',
  ])
    assert(!helperAllows(p));
  assert(
    !helperAllows('/workspace/src/link/config', {
      '/workspace/src/link': '/workspace/.git',
    }),
  );
  assert(
    layeredWrite('/workspace/.git/config', {
      broad: true,
    }),
  );
  assert(
    !layeredWrite('/workspace/.git/config', {
      broad: true,
      narrow: true,
    }),
  );
  assert(
    !layeredWrite('/workspace/.git/config', {
      broad: true,
      metadataReadOnly: true,
    }),
  );
  assert(
    layeredWrite('/workspace/src/app.py', {
      broad: false,
      narrow: true,
    }),
  );
  assert(exactBrokerRequest('GET', 'owner/repo', 42));
  for (const args of [
    ['POST', 'owner/repo', 42],
    ['DELETE', 'owner/repo', 42],
    ['GET', 'other/repo', 42],
    ['GET', 'owner/repo', 43],
  ])
    assert(!exactBrokerRequest(...args));
  assert.deepEqual(
    sanitizeBrokerReply({
      number: 42,
      state: 'open',
      debug_token: 'TEST_ONLY',
    }),
    {
      number: 42,
      state: 'open',
    },
  );
  assert.equal(freshSandboxDecision().actual, '/workspace/.git/config');
  assert(!freshSandboxDecision().allowed);
}
