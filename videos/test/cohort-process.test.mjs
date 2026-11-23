import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
const moduleUrl = process.env.LEETLLM_COHORT_PROCESS_UNDER_TEST
  ? pathToFileURL(process.env.LEETLLM_COHORT_PROCESS_UNDER_TEST)
  : new URL('../lib/cohort-process.mjs', import.meta.url);
const { spawnCohortProcess, runCohortPool } = await import(moduleUrl);

async function waitFor(file) {
  for (let i = 0; i < 100; i++) {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
    }
    await delay(25);
  }
  throw new Error(`Subprocess did not become ready: ${file}`);
}

test('ordinary coordinator SIGTERM stops its worker group, reaps the renderer and refuses the next job', async (t) => {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'cohort-interruption-'));
  const helper = new URL('../lib/cohort-process.mjs', import.meta.url).href;
  const renderer = `
    const fs=require('node:fs'), {spawn}=require('node:child_process');
    const grandchild=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});
    const closed=new Promise(resolve=>grandchild.once('close',resolve));
    process.on('SIGTERM',async()=>{await closed;process.exit(0)});
    fs.writeFileSync(process.argv[1],JSON.stringify({renderer:process.pid,grandchild:grandchild.pid}));
    setInterval(()=>{},1000);
  `;
  const driver = `
    import fs from 'node:fs/promises';
    import {withCohortSignals,spawnCohortProcess,runSerialCohort} from ${JSON.stringify(helper)};
    const root=${JSON.stringify(root)},lock=root+'/owned.lock';
    await withCohortSignals(async signal=>{
      const lease=await fs.open(lock,'wx');
      let directChildReaped=false;
      try {
        await runSerialCohort(['first','second'],async job=>{
          if(job==='second')return fs.writeFile(root+'/second-started','yes');
          const worker=spawnCohortProcess(process.execPath,['-e',${JSON.stringify(renderer)},root+'/ready.json'],{signal,stdio:'ignore'});
          const result=await worker.completion;
          directChildReaped=result.directChildReaped;
          if(result.reason)throw result.reason;
        },{signal});
      } catch(error) {
        await fs.writeFile(root+'/state.json',JSON.stringify({state:signal.aborted?'interrupted':'failed',directChildReaped}));
        process.exitCode=error.exitCode??1;
      } finally {await lease.close();await fs.unlink(lock)}
    });
  `;
  const coordinator = spawn(process.execPath, ['--input-type=module', '-e', driver], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '',
    pids;
  coordinator.stderr.on('data', (data) => {
    stderr += data;
  });
  const closed = once(coordinator, 'close');
  t.after(async () => {
    coordinator.kill('SIGKILL');
    if (pids) {
      try {
        process.kill(-pids.renderer, 'SIGKILL');
      } catch (error) {
        if (error.code !== 'ESRCH') throw error;
      }
    }
    await fs.rm(root, { recursive: true, force: true });
  });
  pids = await waitFor(path.join(root, 'ready.json'));
  coordinator.kill('SIGTERM');
  const [code, signal] = await closed;
  assert.equal(code, 143, stderr);
  assert.equal(signal, null);
  assert.deepEqual(await waitFor(path.join(root, 'state.json')), {
    state: 'interrupted',
    directChildReaped: true,
  });
  for (const pid of [pids.renderer, pids.grandchild])
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
  for (const name of ['owned.lock', 'second-started'])
    await assert.rejects(fs.stat(path.join(root, name)), { code: 'ENOENT' });
});

test('an owned worker that ignores TERM is escalated and reaped after abort', async (t) => {
  const controller = new AbortController(),
    reason = new Error('stop the owned test worker');
  const worker = spawnCohortProcess(
    process.execPath,
    ['-e', "process.on('SIGTERM',()=>{});process.stdout.write('ready');setInterval(()=>{},1000)"],
    {
      signal: controller.signal,
      killAfterMs: 75,
      stdio: ['ignore', 'pipe', 'ignore'],
    },
  );
  t.after(() => worker.stop(reason));
  await once(worker.child.stdout, 'data');
  controller.abort(reason);
  const result = await worker.completion;
  assert.equal(result.signal, 'SIGKILL');
  assert.equal(result.reason, reason);
  assert.throws(() => process.kill(worker.child.pid, 0), { code: 'ESRCH' });
});

test('a stopped group is drained after its direct parent exits while a grandchild ignores TERM', async (t) => {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'cohort-parent-exit-'));
  const pidFile = path.join(root, 'grandchild.json');
  const grandchild = `
    const fs = require('node:fs');
    process.on('SIGTERM', () => {});
    fs.writeFileSync(process.argv[1], JSON.stringify({ pid: process.pid }));
    setInterval(() => {}, 1000);
  `;
  const parent = `
    const { spawn } = require('node:child_process');
    spawn(process.execPath, ['-e', ${JSON.stringify(grandchild)}, process.argv[1]], { stdio: 'ignore' });
    setInterval(() => {}, 1000);
  `;
  const worker = spawnCohortProcess(process.execPath, ['-e', parent, pidFile], {
    stdio: 'ignore',
    killAfterMs: 75,
  });
  t.after(async () => {
    try {
      process.kill(-worker.child.pid, 'SIGKILL');
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
    await fs.rm(root, { recursive: true, force: true });
  });
  const { pid } = await waitFor(pidFile);
  const reason = new Error('stop the entire owned group');
  worker.stop(reason);
  const result = await worker.completion;
  await delay(150);
  let state;
  try {
    state = (await fs.readFile(`/proc/${pid}/status`, 'utf8')).match(/^State:\s+(\S)/m)?.[1];
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  assert([undefined, 'Z', 'X'].includes(state), `grandchild remains running in state ${state}`);
  assert.equal(result.reason, reason);
  assert.equal(result.directChildReaped, true);
  assert.equal(result.group.confirmedNonRunning, true);
  assert.equal(result.group.lastSignal, 'SIGKILL');
  assert.deepEqual(result.group.live, []);
  if (state === 'Z')
    assert(result.group.nonRunning.some((member) => member.pid === pid && member.state === 'Z'));
  t.diagnostic(
    JSON.stringify({
      directChild: worker.child.pid,
      grandchild: pid,
      observedGrandchildState: state ?? 'absent',
      directChildReaped: result.directChildReaped,
      group: result.group,
    }),
  );
});

test('a group observation failure still kills the known owned group and reports confirmation as unknown', async (t) => {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'cohort-observation-failure-'));
  const pidFile = path.join(root, 'grandchild.json');
  const grandchild = `
    const fs = require('node:fs');
    process.on('SIGTERM', () => {});
    fs.writeFileSync(process.argv[1], JSON.stringify({ pid: process.pid }));
    setInterval(() => {}, 1000);
  `;
  const parent = `
    const { spawn } = require('node:child_process');
    spawn(process.execPath, ['-e', ${JSON.stringify(grandchild)}, process.argv[1]], { stdio: 'ignore' });
    setInterval(() => {}, 1000);
  `;
  const worker = spawnCohortProcess(process.execPath, ['-e', parent, pidFile], {
    stdio: 'ignore',
    killAfterMs: 75,
  });
  const { pid } = await waitFor(pidFile);
  const read = fs.readFile;
  t.after(async () => {
    fs.readFile = read;
    try {
      process.kill(-worker.child.pid, 'SIGKILL');
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
    await fs.rm(root, { recursive: true, force: true });
  });
  fs.readFile = async (file, ...args) => {
    if (file === `/proc/${pid}/stat`)
      throw Object.assign(new Error('injected actual group observation denial'), {
        code: 'EACCES',
      });
    return read(file, ...args);
  };
  worker.stop(new Error('stop despite observation failure'));
  const result = await worker.completion;
  fs.readFile = read;
  await delay(150);
  let state;
  try {
    state = (await read(`/proc/${pid}/status`, 'utf8')).match(/^State:\s+(\S)/m)?.[1];
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  assert(
    [undefined, 'Z', 'X'].includes(state),
    `grandchild remains running after observation failure: ${state}`,
  );
  assert.match(result.error.message, /observation denial/);
  assert.equal(result.group.confirmedNonRunning, false);
  assert.match(result.group.observationError, /observation denial/);
  assert.equal(result.group.lastSignal, 'SIGKILL');
  t.diagnostic(
    JSON.stringify({
      directChild: worker.child.pid,
      grandchild: pid,
      observedGrandchildState: state ?? 'absent',
      directChildReaped: result.directChildReaped,
      group: result.group,
    }),
  );
});

test('four slots render each job once and admit the next job as a slot becomes available', async () => {
  const gate = Promise.withResolvers();
  const allStarted = Promise.withResolvers();
  const firstFour = [];
  const finished = [];
  let active = 0;
  let highWater = 0;
  await runCohortPool(
    [0, 1, 2, 3, 4, 5],
    async (job) => {
      active++;
      highWater = Math.max(highWater, active);
      if (job < 4) {
        firstFour.push(job);
        if (firstFour.length === 4) allStarted.resolve();
        await allStarted.promise;
      }
      if (job === 0) await gate.promise;
      if (job === 4) gate.resolve();
      finished.push(job);
      active--;
    },
    { signal: new AbortController().signal, concurrency: 4 },
  );
  assert.deepEqual(firstFour, [0, 1, 2, 3]);
  assert.deepEqual([...finished].sort(), [0, 1, 2, 3, 4, 5]);
  assert(finished.indexOf(4) < finished.indexOf(0));
  assert.equal(highWater, 4);
});

for (const trigger of ['worker failure', 'controller interruption']) {
  test(`${trigger} cancels active slots and waits for their worker groups before rejecting`, async (t) => {
    const controller = new AbortController();
    const ready = Promise.withResolvers();
    const started = [];
    const reaped = [];
    const reason = new Error('fixture render failed');
    const fixture = "process.stdout.write('ready');setInterval(()=>{},1000)";
    let readyCount = 0;
    await assert.rejects(
      runCohortPool(
        [0, 1, 2, 3, 4],
        async (job, { signal }) => {
          started.push(job);
          if (job === 0) {
            await ready.promise;
            if (trigger === 'worker failure') throw reason;
            controller.abort(reason);
            return;
          }
          const worker = spawnCohortProcess(process.execPath, ['-e', fixture], {
            signal,
            stdio: ['ignore', 'pipe', 'ignore'],
            killAfterMs: 100,
          });
          t.after(() => worker.stop(reason));
          await once(worker.child.stdout, 'data');
          if (++readyCount === 3) ready.resolve();
          const result = await worker.completion;
          assert.equal(result.reason, reason);
          assert.equal(result.directChildReaped, true);
          assert.equal(result.group.confirmedNonRunning, true);
          reaped.push(job);
        },
        { signal: controller.signal, concurrency: 4 },
      ),
      (e) => e === reason,
    );
    assert.deepEqual(started, [0, 1, 2, 3]);
    assert.deepEqual(reaped.sort(), [1, 2, 3]);
  });
}

test('a renderer that exits before its child leaves no running descendant', async () => {
  const script = `
    require('node:child_process').spawn(process.execPath, ['-e','setInterval(()=>{},1000)'], {stdio:'ignore'});
    process.exit(0);
  `;
  const worker = spawnCohortProcess(process.execPath, ['-e', script], {
    stdio: 'ignore',
    killAfterMs: 100,
  });
  const result = await worker.completion;
  assert.match(result.reason.message, /descendant still running/);
  assert.equal(result.directChildReaped, true);
  assert.equal(result.group.confirmedNonRunning, true);
});
