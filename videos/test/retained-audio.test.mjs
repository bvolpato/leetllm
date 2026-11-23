import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { stringify } from 'yaml';
import { courseNarrator, speechKey } from '../lib/course-speech.mjs';
import { productionSourceManifest } from '../lib/lesson-production.mjs';

const run = promisify(execFile);
const repository = fileURLToPath(new URL('../../', import.meta.url));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('the actual renderer rejects missing and invalid retained audio before provider writes, and reuses valid media', async (t) => {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'retained-audio-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const manifest = await productionSourceManifest({ root: repository, id: 'cuda-execution' });
  for (const file of manifest.closure.files) {
    const target = path.join(root, file.path);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(path.join(repository, file.path), target);
  }
  if (process.env.LEETLLM_RENDERER_UNDER_TEST)
    await fs.copyFile(
      process.env.LEETLLM_RENDERER_UNDER_TEST,
      path.join(root, 'videos/render.mjs'),
    );
  await fs.symlink(
    path.join(repository, 'videos/node_modules'),
    path.join(root, 'videos/node_modules'),
  );
  await fs.mkdir(path.join(root, 'web/src/content/example'), { recursive: true });
  await fs.writeFile(path.join(root, 'web/src/content/example/content.md'), 'Article.');
  await fs.writeFile(
    path.join(root, 'videos/animations/example.mjs'),
    'export function draw() {}\n',
  );
  const say = 'Read. The word.';
  await fs.writeFile(
    path.join(root, 'videos/lessons/example.lesson.yaml'),
    stringify({
      version: 1,
      id: 'example',
      title: 'Example',
      voice: 'en-US-JennyNeural',
      source: 'example/content.md',
      scenes: [
        { id: 'only', title: 'One scene', visual: 'An empty canvas.', beats: [{ say, hold: 0.2 }] },
      ],
    }),
  );
  const adapter = "raise RuntimeError('PROVIDER MUST NOT RUN')\n";
  await fs.writeFile(path.join(root, 'videos/retained-test.py'), adapter);
  // A local executable trap detects provider launches even if the adapter errors.
  await fs.mkdir(path.join(root, 'bin'));
  await fs.writeFile(
    path.join(root, 'bin/uv'),
    '#!/bin/sh\ntouch "$RETAINED_PROVIDER_TRAP"\nexit 9\n',
    { mode: 0o755 },
  );
  const trap = path.join(root, 'provider-invoked');
  const output = path.join(root, 'output');
  const cache = path.join(output, '.audio-cache');
  const key = speechKey(say, courseNarrator, hash(adapter));
  const command = [
    path.join(root, 'videos/render.mjs'),
    '--lesson',
    'example',
    '--audio-only',
    '--retained-audio-only',
    '--output',
    output,
    '--tts-script',
    'videos/retained-test.py',
  ];
  const options = {
    cwd: root,
    env: {
      ...process.env,
      PATH: `${path.join(root, 'bin')}:${process.env.PATH}`,
      RETAINED_PROVIDER_TRAP: trap,
    },
  };
  const reject = () =>
    assert.rejects(run(process.execPath, command, options), (error) => {
      assert.match(error.stderr, /Retained speech cache is missing or invalid/);
      return true;
    });
  await reject();
  assert.equal((await fs.readdir(cache)).length, 0);
  await fs.writeFile(path.join(cache, `${key}.mp3`), 'invalid media');
  await fs.writeFile(
    path.join(cache, `${key}.json`),
    JSON.stringify({
      ...courseNarrator,
      voice: 'en-US-AndrewNeural',
      words: [
        { text: 'Read', start: 0, end: 0.2 },
        { text: 'the', start: 0.2, end: 0.3 },
        { text: 'word', start: 0.3, end: 0.6 },
      ],
    }),
  );
  await reject();
  assert.deepEqual((await fs.readdir(cache)).sort(), [`${key}.json`, `${key}.mp3`]);
  await assert.rejects(fs.stat(trap), { code: 'ENOENT' });
  await run('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-f',
    'lavfi',
    '-i',
    'anullsrc=r=24000:cl=mono',
    '-t',
    '1',
    '-c:a',
    'libmp3lame',
    path.join(cache, `${key}.mp3`),
  ]);
  // The bytes now decode, but a previous narrator must not pass under the course narrator's key.
  await reject();
  const boundaries = path.join(cache, key + '.json');
  const events = JSON.parse(await fs.readFile(boundaries, 'utf8'));
  await fs.writeFile(boundaries, JSON.stringify({ ...events, voice: courseNarrator.voice }));
  const before = hash(await fs.readFile(path.join(cache, `${key}.mp3`)));
  await run(process.execPath, command, options);
  const timeline = JSON.parse(
    await fs.readFile(path.join(output, 'previews/example/timeline.json')),
  );
  assert.equal(timeline.voice, courseNarrator.voice);
  assert.deepEqual(
    timeline.captions.map((cue) => cue.text),
    ['Read.', 'The word.'],
  );
  const beatStart = timeline.scenes[0].start + timeline.scenes[0].beats[0].start;
  const answerAt = beatStart + events.words[1].start;
  assert.ok(
    timeline.captions[1].start >= answerAt && timeline.captions[1].start < answerAt + 0.001,
  );
  assert.equal(timeline.scenes[0].sounds[0].audioHash, before);
  assert.equal(hash(await fs.readFile(path.join(cache, `${key}.mp3`))), before);
  await assert.rejects(fs.stat(trap), { code: 'ENOENT' });
  assert(!(await fs.readdir(cache)).some((name) => name.endsWith('.txt')));
});

test('full films and previews require the course narrator and adapter', async () => {
  for (const flags of [
    ['--voice', 'en-US-JennyNeural'],
    ['--stage', '--provider', 'edge'],
    ['--preview', '--tts-script', 'videos/tts.py'],
    ['--rate=+0%'],
  ]) {
    await assert.rejects(
      run(process.execPath, [
        path.join(repository, 'videos/render.mjs'),
        '--lesson',
        'example',
        ...flags,
      ]),
      (error) => {
        assert.ok(error.stderr.includes('Course films use ' + courseNarrator.voice));
        return true;
      },
    );
  }
});
