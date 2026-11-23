import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import test from 'node:test';
import timers from 'node:timers/promises';
import { prepareTakes } from '../lib/course-speech.mjs';

test('only retries rejected recordings and publishes complete validated takes', async (t) => {
  const historical = {
    profile: {
      provider: 'edge',
      voice: 'en-US-AndrewNeural',
      rate: '+0%',
      ttsScript: 'videos/tts.py',
    },
  };
  const prepare = (texts, output) => prepareTakes(texts, output, historical);
  const root = await fs.mkdtemp(join(tmpdir(), 'speech-retry-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const store = join(root, 'archive');
  const output = join(root, 'output');
  const uv = join(root, 'uv.cjs');
  const mp3 = join(root, 'take.mp3');
  execFileSync('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=duration=1', mp3]);
  for (const [name, value] of Object.entries({ UV: uv, LEETLLM_SPEECH_CACHE: store })) {
    const previous = process.env[name];
    process.env[name] = value;
    t.after(() => {
      if (previous === undefined) delete process.env[name];
      else process.env[name] = previous;
    });
  }
  await fs.writeFile(
    uv,
    `#!/usr/bin/env node
if (process.argv[2] === 'cache') process.exit(0);
const fs = require('node:fs');
const { join, dirname } = require('node:path');
const arg = (name) => process.argv[process.argv.indexOf(name) + 1];
const input = arg('--text-file');
const text = fs.readFileSync(input, 'utf8');
const log = join(__dirname, text + '.log');
const first = !fs.existsSync(log);
fs.appendFileSync(log, dirname(input) + '\\n');
fs.copyFileSync(join(__dirname, 'take.mp3'), arg('--output'));
if ((text === 'outage' && first) || text === 'offline' || text === 'invalid') {
  const reason = text === 'invalid' ? 'ValueError' : 'NoAudioReceived';
  console.error('tts.py: Edge TTS failed after 3 attempts: ' + reason + ': example');
  process.exit(1);
}
const end = text === 'broken' || (text === 'retry' && first) ? 4 : 0.8;
fs.writeFileSync(arg('--boundaries'), JSON.stringify({
  provider: 'edge-tts', voice: arg('--voice'), rate: '+0%', words: [{ text, start: 0.1, end }]
}));
`,
    { mode: 0o755 },
  );
  const attempts = async (word) =>
    (await fs.readFile(join(root, word + '.log'), 'utf8')).trim().split('\n');
  const probe = join(root, 'ffprobe');
  const realProbe = execFileSync('which', ['ffprobe'], { encoding: 'utf8' }).trim();
  const probeLog = join(root, 'probes.log');
  const previousPath = process.env.PATH;
  await fs.writeFile(
    probe,
    `#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(probeLog)}, args.at(-1) + '\\n');
const result = spawnSync(${JSON.stringify(realProbe)}, args, { stdio: 'inherit' });
process.exit(result.status ?? 1);
`,
    { mode: 0o755 },
  );
  process.env.PATH = root + delimiter + previousPath;
  t.after(() => {
    process.env.PATH = previousPath;
  });
  const probeCount = async () => (await fs.readFile(probeLog, 'utf8')).trim().split('\n').length;
  const { takes } = await prepare(['stable', 'retry'], output);
  assert.equal(await probeCount(), 3);
  assert.deepEqual(
    takes.map((take) => take.words[0].end),
    [0.8, 0.8],
  );
  await prepare(['stable', 'retry'], join(root, 'other'));
  assert.equal(await probeCount(), 5);
  assert.equal((await attempts('stable')).length, 1);
  assert.equal(new Set(await attempts('retry')).size, 2);
  await assert.rejects(prepare(['broken'], output), (error) => {
    assert.match(error.message, /Final word "broken" ends at 4s, audio lasts/);
    assert.ok(error.message.includes('after 3 recordings with ' + historical.profile.voice));
    return true;
  });
  assert.equal(new Set(await attempts('broken')).size, 3);
  const waits = [];
  t.mock.method(timers, 'setTimeout', async (ms) => {
    waits.push(ms);
  });
  const recovered = await prepare(['outage'], output);
  assert.equal(recovered.takes[0].words[0].text, 'outage');
  assert.equal(new Set(await attempts('outage')).size, 2);
  assert.deepEqual(waits, [60_000]);
  await assert.rejects(prepare(['offline'], output), /after 3 recordings/);
  assert.equal(new Set(await attempts('offline')).size, 3);
  assert.deepEqual(waits, [60_000, 60_000, 120_000]);
  await assert.rejects(prepare(['invalid'], output), /ValueError/);
  assert.equal((await attempts('invalid')).length, 1);
  assert.deepEqual(waits, [60_000, 60_000, 120_000]);
  assert.deepEqual(
    (await fs.readdir(store)).sort(),
    [...takes, ...recovered.takes].map(({ key }) => key).sort(),
  );
  assert.equal((await fs.readdir(join(output, '.audio-cache'))).length, 9);
});
