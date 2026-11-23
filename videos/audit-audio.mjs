#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2),
  option = (name, fallback) => {
    const i = args.indexOf(name);
    return i < 0 ? fallback : args[i + 1];
  };
if (args.includes('--help')) {
  console.log(
    'node videos/audit-audio.mjs [--input build/video-complete-curriculum] [--output report.json] [--jobs 4]',
  );
  process.exit(0);
}
for (let i = 0; i < args.length; i += 2) {
  if (
    !['--input', '--output', '--jobs'].includes(args[i]) ||
    !args[i + 1] ||
    args[i + 1].startsWith('--')
  )
    throw Error('Invalid audio-audit option: ' + args[i]);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.resolve(option('--input', path.join(root, 'build/video-complete-curriculum')));
const output = path.resolve(option('--output', path.join(input, 'audio-audit.json')));
const concurrency = Number(option('--jobs', '4'));
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 16)
  throw Error('--jobs must be 1..16');
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');
const manifest = path.join(input, 'manifest.json'),
  manifestBytes = await fs.readFile(manifest);
const receipts = JSON.parse(manifestBytes);
const sha = await fs.readFile(fileURLToPath(import.meta.url)).then(hash);
const results = [];
let next = 0;
async function scan(receipt) {
  const folder = path.join(input, receipt.id),
    movie = path.join(folder, receipt.id + '.mp4');
  const receiptFile = path.join(folder, 'verification.json'),
    receiptBytes = await fs.readFile(receiptFile);
  const currentReceipt = JSON.parse(receiptBytes);
  if (
    currentReceipt.id !== receipt.id ||
    currentReceipt.sha256 !== receipt.sha256 ||
    currentReceipt.fingerprint !== receipt.fingerprint
  )
    throw Error('Receipt does not match manifest: ' + receipt.id);
  if (hash(await fs.readFile(movie)) !== receipt.sha256)
    throw Error('Movie checksum mismatch: ' + receipt.id);
  const timelineFile = path.join(folder, 'timeline.json'),
    timelineBytes = await fs.readFile(timelineFile),
    timeline = JSON.parse(timelineBytes);
  const words = timeline.scenes.flatMap((scene) =>
    scene.sounds.flatMap((sound) => {
      const beat = scene.beats[sound.beatIndex];
      return (sound.words ?? []).map((word) => ({
        start: scene.start + beat.start + word.start,
        end: scene.start + beat.start + word.end,
      }));
    }),
  );
  const log = await new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', [
      '-hide_banner',
      '-nostats',
      '-threads',
      '1',
      '-i',
      movie,
      '-vn',
      '-af',
      'ebur128=peak=true:framelog=verbose,silencedetect=noise=-55dB:d=1.5',
      '-f',
      'null',
      '-',
    ]);
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve(stderr)
        : reject(Error(`FFmpeg audio decode failed: ${receipt.id} (${code})`)),
    );
  });
  if (hash(await fs.readFile(movie)) !== receipt.sha256)
    throw Error('Movie changed during audio audit: ' + receipt.id);
  if (hash(await fs.readFile(timelineFile)) !== hash(timelineBytes))
    throw Error('Timeline changed during audio audit: ' + receipt.id);
  if (hash(await fs.readFile(receiptFile)) !== hash(receiptBytes))
    throw Error('Receipt changed during audio audit: ' + receipt.id);
  const number = (pattern) => {
    const match = log.match(pattern);
    if (!match) throw Error('Missing audio measurement: ' + receipt.id);
    return Number(match[1]);
  };
  const integratedLufs = number(/Integrated loudness:\s+I:\s+(-?[\d.]+) LUFS/);
  const truePeakDbfs = number(/True peak:\s+Peak:\s+(-?[\d.]+) dBFS/);
  const loudnessRangeLu = number(/Loudness range:\s+LRA:\s+([\d.]+) LU/);
  const silence = [];
  let start = null;
  for (const match of log.matchAll(/silence_(start|end):\s*([\d.]+)/g)) {
    if (match[1] === 'start') start = Number(match[2]);
    else if (start !== null) {
      const end = Number(match[2]);
      const wordOverlap = words.reduce(
        (sum, word) => sum + Math.max(0, Math.min(end, word.end) - Math.max(start, word.start)),
        0,
      );
      silence.push({ start, end, duration: end - start, wordOverlap });
      start = null;
    }
  }
  const candidates = [];
  if (truePeakDbfs >= 0) candidates.push({ kind: 'peak', value: truePeakDbfs });
  if (integratedLufs < -24 || integratedLufs > -10)
    candidates.push({ kind: 'loudness', value: integratedLufs });
  for (const gap of silence)
    if (gap.wordOverlap > 0.25) candidates.push({ kind: 'silence-during-word-boundaries', ...gap });
  const normalize = (text) =>
    (text.toLocaleLowerCase('en').match(/[\p{L}\p{N}]+/gu) ?? []).join('|');
  const transcript = timeline.scenes.flatMap((scene) =>
    scene.beats.map((beat, index) => {
      const sound = scene.sounds.find((sound) => sound.beatIndex === index);
      const provided = (sound?.words ?? []).map((word) => word.text ?? '').join(' ');
      return {
        scene: scene.id,
        beat: index,
        complete: normalize(beat.say) === normalize(provided),
      };
    }),
  );
  for (const item of transcript)
    if (!item.complete)
      candidates.push({ kind: 'provider-transcript-mismatch', scene: item.scene, beat: item.beat });
  const transcriptCoverage = {
    totalBeats: transcript.length,
    completeBeats: transcript.filter((item) => item.complete).length,
  };
  const rates = timeline.scenes.flatMap((scene) =>
    scene.beats.map(
      (beat) =>
        ((beat.say.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu)?.length ?? 0) * 60) / beat.duration,
    ),
  );
  const result = {
    id: receipt.id,
    movieSha256: receipt.sha256,
    sourceFingerprint: receipt.fingerprint,
    receiptSha256: hash(receiptBytes),
    timelineSha256: hash(timelineBytes),
    integratedLufs,
    truePeakDbfs,
    loudnessRangeLu,
    silence,
    transcriptCoverage,
    maximumBeatWordsPerMinute: Math.max(...rates),
    medianBeatWordsPerMinute: [...rates].sort((a, b) => a - b)[Math.floor(rates.length / 2)],
    candidates,
    fullAudioDecode: 'passed',
  };
  results.push(result);
  console.log(
    JSON.stringify({ id: receipt.id, integratedLufs, truePeakDbfs, candidates: candidates.length }),
  );
}
await Promise.all(
  Array.from({ length: concurrency }, async () => {
    while (next < receipts.length) {
      const receipt = receipts[next++];
      await scan(receipt);
    }
  }),
);
const byId = new Map(results.map((item) => [item.id, item]));
const report = {
  version: 1,
  toolSha256: sha,
  manifestSha256: hash(manifestBytes),
  scope:
    'Full encoded audio decode with integrated loudness, true peak, silence measurements, and provider word-event coverage of the complete authored transcript. Candidate thresholds support review; this does not evaluate pronunciation, vocal expression, or semantic audio alignment.',
  lessons: receipts.map((receipt) => byId.get(receipt.id)),
};
const temporary = `${output}.${process.pid}.${randomUUID()}.tmp`;
await fs.mkdir(path.dirname(output), { recursive: true });
try {
  await fs.writeFile(temporary, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  if (hash(await fs.readFile(manifest)) !== hash(manifestBytes))
    throw Error('Manifest changed during audio audit');
  await fs.rename(temporary, output);
} finally {
  await fs.rm(temporary, { force: true });
}
