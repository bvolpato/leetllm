import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import { createKokoroWorker, KokoroWorkerExit } from '../lib/kokoro-worker.mjs';

async function fixture(t) {
  const root = await fs.mkdtemp(join(tmpdir(), 'kokoro-worker-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const uv = join(root, 'uv');
  await fs.writeFile(
    uv,
    `#!/usr/bin/env node
const fs = require('node:fs');
fs.appendFileSync('starts', process.pid + '\\n');
const lines = require('node:readline').createInterface({input: process.stdin});
let active=false;
lines.on('line', async line => {
  if (active) process.exit(20);
  active=true;
  const {input} = JSON.parse(line);
  if (input === 'crash') process.exit(21);
  if (input === 'stall') {
    fs.writeFileSync('stalled', String(process.pid));
    setInterval(()=>{},1000);
    return;
  }
  await new Promise(resolve => setTimeout(resolve,10));
  console.log(JSON.stringify(input==='bad'?{ok:false,error:'bad words'}:{ok:true}));
  active=false;
});
`,
    { mode: 0o755 },
  );
  const controller = new AbortController();
  const worker = createKokoroWorker({
    uv: () => uv,
    adapter: 'adapter.py',
    cwd: root,
    signal: controller.signal,
  });
  t.after(() => worker.close());
  return { worker, controller, root };
}

test('concurrent takes reuse one model and a crashed process can be replaced', async (t) => {
  const { worker, root } = await fixture(t);
  const record = (input) => worker.record({ input });
  assert.deepEqual(await fs.readdir(root), ['uv']);
  await Promise.all([record('one'), record('two')]);
  await assert.rejects(record('bad'), /bad words/);
  await record('after bad');
  assert.equal((await fs.readFile(join(root, 'starts'), 'utf8')).trim().split('\n').length, 1);
  await assert.rejects(record('crash'), KokoroWorkerExit);
  await record('recovered');
  assert.equal((await fs.readFile(join(root, 'starts'), 'utf8')).trim().split('\n').length, 2);
});

test(
  'aborting terminates a wedged worker and rejects queued requests',
  { timeout: 10000 },
  async (t) => {
    const { worker, controller, root } = await fixture(t);
    const first = assert.rejects(worker.record({ input: 'stall' }));
    const second = assert.rejects(worker.record({ input: 'next' }));
    let pid;
    for (let i = 0; i < 200; i++) {
      try {
        pid = Number(await fs.readFile(join(root, 'stalled'), 'utf8'));
        break;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      await delay(20);
    }
    assert.ok(pid);
    controller.abort();
    await Promise.all([first, second]);
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
  },
);

test('one worker gets MPS, a failed take moves to CPU and releases the GPU', async (t) => {
  const root = await fs.mkdtemp(join(tmpdir(), 'kokoro-device-'));
  const uv = join(root, 'uv');
  const adapter = join(root, 'adapter.py');
  await fs.writeFile(
    uv,
    '#!/bin/sh\nshift\nexport HOME="$PWD" PYTHONPATH="$PWD" LEETLLM_KOKORO_DEVICE=mps LEETLLM_KOKORO_SLOTS=4\nexec python3 "$@"\n',
    { mode: 0o755 },
  );
  await fs.writeFile(
    join(root, 'torch.py'),
    'from types import SimpleNamespace\nbackends = SimpleNamespace(mps=SimpleNamespace(is_available=lambda: True))\nset_num_threads = set_num_interop_threads = lambda n: None\n',
  );
  await fs.writeFile(
    join(root, 'kokoro.py'),
    `class KPipeline:
    def __init__(self, *, device, **kwargs):
        self.device = device
        self.model = self
        self.takes = 0
    def to(self, device):
        self.device = device
        return self
`,
  );
  await fs.writeFile(
    adapter,
    `LANGUAGE = 'a'
MODEL = 'test'
def require_synthesis_enabled(): pass
def write_take(pipeline, text, output, boundaries, voice, rate):
    device = pipeline.device
    if text == 'fail' and device == 'mps':
        raise RuntimeError('MPS unavailable for this take')
    pipeline.takes += 1
    output.write_text(f"{device}:{pipeline.takes}")
`,
  );
  const workers = Array.from({ length: 3 }, () =>
    createKokoroWorker({ uv: () => uv, adapter, cwd: root }),
  );
  t.after(async () => {
    await Promise.all(workers.map((worker) => worker.close()));
    await fs.rm(root, { recursive: true, force: true });
  });
  async function record(worker, text) {
    const input = join(root, text + '.txt');
    const output = join(root, text + '.mp3');
    await fs.writeFile(input, text);
    await worker.record({
      input,
      output,
      boundaries: join(root, text + '.json'),
      voice: 'af_heart',
      rate: '+12%',
    });
    return fs.readFile(output, 'utf8');
  }
  assert.equal(await record(workers[0], 'first'), 'mps:1');
  assert.equal(await record(workers[1], 'contender'), 'cpu:1');
  assert.equal(await record(workers[0], 'fail'), 'cpu:2');
  assert.equal(await record(workers[0], 'next'), 'cpu:3');
  assert.equal(await record(workers[1], 'promoted'), 'mps:2');
  assert.equal(await record(workers[2], 'waiting'), 'cpu:1');
  await workers[1].close();
  assert.equal(await record(workers[2], 'replacement'), 'mps:2');
});
