import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../audit-audio.mjs', import.meta.url));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'leetllm-audio-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const folder = path.join(root, 'example'),
    bin = path.join(root, 'bin');
  await fs.mkdir(folder);
  await fs.mkdir(bin);
  const movie = Buffer.from('checked encoded fixture');
  const receipt = { id: 'example', sha256: hash(movie), fingerprint: 'render-source-fingerprint' };
  const timeline = {
    scenes: [
      {
        start: 4,
        beats: [{ start: 0, duration: 2, say: 'Three spoken words' }],
        sounds: [
          {
            beatIndex: 0,
            words: [
              { text: 'Three', start: 0.3, end: 0.8 },
              { text: 'spoken words', start: 0.9, end: 1.2 },
            ],
          },
        ],
      },
    ],
  };
  await fs.writeFile(path.join(folder, 'example.mp4'), movie);
  await fs.writeFile(path.join(folder, 'verification.json'), JSON.stringify(receipt));
  await fs.writeFile(path.join(folder, 'timeline.json'), JSON.stringify(timeline));
  await fs.writeFile(path.join(root, 'manifest.json'), JSON.stringify([receipt]));
  const output = path.join(root, 'audio-audit.json'),
    prior = '{"previous":"verified report"}\n';
  await fs.writeFile(output, prior);
  await fs.writeFile(
    path.join(bin, 'ffmpeg'),
    `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const movie = process.argv[process.argv.indexOf('-i') + 1], folder = path.dirname(movie);
const mode = process.env.AUDIO_TEST_CHANGE;
if (mode === 'movie') {
  fs.writeFileSync(movie + '.replacement', 'different encoded bytes');
  fs.renameSync(movie + '.replacement', movie);
} else if (['timeline', 'receipt', 'manifest'].includes(mode)) {
  const file = mode === 'manifest' ? path.join(folder, '..', 'manifest.json')
    : path.join(folder, mode === 'timeline' ? 'timeline.json' : 'verification.json');
  const data = JSON.parse(fs.readFileSync(file));
  if (mode === 'timeline') data.scenes[0].beats[0].duration = 3;
  else if (mode === 'manifest') data[0].fingerprint = 'changed manifest';
  else data.fingerprint = 'changed receipt';
  fs.writeFileSync(file, JSON.stringify(data));
}
process.stderr.write('Integrated loudness:\\n I: -16.0 LUFS\\nLoudness range:\\n LRA: 4.0 LU\\nTrue peak:\\n Peak: -1.5 dBFS\\nsilence_start: 4.2\\nsilence_end: 5.9\\n');
`,
    { mode: 0o755 },
  );
  const run = (mode) =>
    new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [cli, '--input', root, '--output', output, '--jobs', '1'],
        {
          env: {
            ...process.env,
            PATH: bin + path.delimiter + process.env.PATH,
            AUDIO_TEST_CHANGE: mode,
          },
        },
      );
      let stdout = '',
        stderr = '';
      child.stdout.on('data', (chunk) => {
        stdout += chunk;
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk;
      });
      child.on('error', reject);
      child.on('close', (code) => resolve({ code, stdout, stderr }));
    });
  return { root, folder, output, prior, receipt, run };
}

test('stable audio CLI inputs publish bound measurements and real word-overlap candidates', async (t) => {
  const f = await fixture(t),
    result = await f.run('stable');
  assert.equal(result.code, 0, result.stderr);
  const report = JSON.parse(await fs.readFile(f.output, 'utf8')),
    lesson = report.lessons[0];
  assert.equal(lesson.movieSha256, f.receipt.sha256);
  assert.equal(lesson.sourceFingerprint, f.receipt.fingerprint);
  assert.equal(
    lesson.receiptSha256,
    hash(await fs.readFile(path.join(f.folder, 'verification.json'))),
  );
  assert.equal(
    lesson.timelineSha256,
    hash(await fs.readFile(path.join(f.folder, 'timeline.json'))),
  );
  assert.equal(report.manifestSha256, hash(await fs.readFile(path.join(f.root, 'manifest.json'))));
  assert.equal(lesson.integratedLufs, -16);
  assert.equal(lesson.truePeakDbfs, -1.5);
  assert.equal(lesson.maximumBeatWordsPerMinute, 90);
  assert.equal(lesson.fullAudioDecode, 'passed');
  assert.deepEqual(lesson.transcriptCoverage, { totalBeats: 1, completeBeats: 1 });
  assert.equal(
    lesson.candidates.some((candidate) => candidate.kind === 'provider-transcript-mismatch'),
    false,
  );
  assert.equal(lesson.candidates[0].kind, 'silence-during-word-boundaries');
  assert.ok(Math.abs(lesson.candidates[0].wordOverlap - 0.8) < 1e-12);
});

for (const [mode, error] of [
  ['movie', /Movie changed during audio audit: example/],
  ['timeline', /Timeline changed during audio audit: example/],
  ['receipt', /Receipt changed during audio audit: example/],
  ['manifest', /Manifest changed during audio audit/],
]) {
  test(`${mode} replacement during the real CLI decode cannot replace a previous report`, async (t) => {
    const f = await fixture(t),
      result = await f.run(mode);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, error);
    assert.equal(await fs.readFile(f.output, 'utf8'), f.prior);
    assert.deepEqual(
      (await fs.readdir(f.root)).filter((name) => name.endsWith('.tmp')),
      [],
    );
  });
}

test('the audio audit detects missing, truncated, repeated, and merged provider transcript events', async (t) => {
  for (const replacement of [
    [],
    [{ text: 'Three spoken' }],
    [{ text: 'Three spoken words words' }],
    [{ text: 'Threespokenwords' }],
  ]) {
    const f = await fixture(t),
      file = path.join(f.folder, 'timeline.json');
    const timeline = JSON.parse(await fs.readFile(file, 'utf8'));
    timeline.scenes[0].sounds[0].words = replacement.map((word, i) => ({
      ...word,
      start: 0.3 + i * 0.2,
      end: 0.5 + i * 0.2,
    }));
    await fs.writeFile(file, JSON.stringify(timeline));
    const result = await f.run('stable');
    assert.equal(result.code, 0, result.stderr);
    const lesson = JSON.parse(await fs.readFile(f.output, 'utf8')).lessons[0];
    assert.equal(lesson.transcriptCoverage.completeBeats, 0);
    assert.equal(lesson.transcriptCoverage.totalBeats, 1);
    assert.equal(
      lesson.candidates.find((candidate) => candidate.kind === 'provider-transcript-mismatch').beat,
      0,
    );
  }
});
