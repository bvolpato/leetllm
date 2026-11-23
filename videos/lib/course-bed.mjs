import { createHash } from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import { createReadStream } from 'node:fs';
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { extname, dirname, join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { measureCourseBed } from './course-bed-evidence.mjs';

const exec = promisify(execFile);
const root = fileURLToPath(new URL('../../', import.meta.url));
const pin = JSON.parse(await readFile(new URL('../soundbed.json', import.meta.url), 'utf8'));
const catalog = JSON.parse(
  await readFile(new URL('../collections/complete-curriculum.json', import.meta.url), 'utf8'),
);
const themes = new Map(catalog.lessons.map((row) => [row.id, row]));
const groupPalettes = {
  'Production ML Systems': 'low',
  'Inference & Production Scale': 'low',
  'System Design Capstones': 'low',
  'Advanced Agents & Retrieval': 'open',
  'Applied LLM Engineering': 'open',
  'Portfolio Capstones': 'open',
  'Project Deep Dives': 'open',
  'Computing Foundations': 'warm',
  'Math & Statistics': 'warm',
  'Preparation & Prerequisites': 'warm',
  'ML Algorithms & Evaluation': 'warm',
  'Core LLM Foundations': 'warm',
  'Transformer Deep Dives': 'warm',
  'Advanced Training & Adaptation': 'warm',
  'AI Lab Interviewing': 'warm',
};
const palettes = {
  foundations: 'warm',
  fundamentals: 'warm',
  training: 'warm',
  agents: 'open',
  retrieval: 'open',
  projects: 'open',
  llmops: 'low',
  'system-design': 'low',
};
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function fileHash(file) {
  const h = createHash('sha256');
  for await (const chunk of createReadStream(file)) h.update(chunk);
  return h.digest('hex');
}

export function courseBedPolicy(lesson, source = '', introSeconds = 4) {
  if (!Number.isFinite(introSeconds) || introSeconds < 0) throw new Error('Invalid intro duration');
  const group = themes.get(lesson)?.group ?? null;
  const sourceTopic = (source || themes.get(lesson)?.source || '').split('/')[0] || 'general';
  const seed = createHash('sha256')
    .update('leetllm-music-v1/' + lesson)
    .digest()
    .readUInt32BE();
  return {
    policyVersion: 1,
    group,
    sourceTopic,
    palette: Object.hasOwn(groupPalettes, group)
      ? groupPalettes[group]
      : Object.hasOwn(palettes, sourceTopic)
        ? palettes[sourceTopic]
        : 'warm',
    seed,
    dialogueBedDb: -22,
    maxActiveBedDb: -21,
    pauseBedDb: -15,
    introSeconds,
    fadeSeconds: 1,
    integratedLufs: -16,
    truePeakDbtp: -1.5,
    loudnessRangeLu: 11,
    library: pin,
  };
}

async function verified(dir, pin) {
  try {
    for (const [name, digest] of Object.entries(pin.files))
      if ((await fileHash(join(dir, name))) !== digest) return false;
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

// Prefer a matching installed package. A pinned copy supports older picture engines.
export async function soundbedDirectory(library = pin) {
  const installed = join(root, 'videos/node_modules/vizmatic/tools/narration');
  if (await verified(installed, library)) return installed;
  const parent = join(
    process.env.XDG_CACHE_HOME || join(homedir(), '.cache'),
    'leetllm',
    'vizmatic-audio',
  );
  const cached = join(parent, library.commit);
  if (await verified(cached, library)) return cached;
  await mkdir(cached, { recursive: true });
  const staging = await mkdtemp(join(parent, '.download-'));
  try {
    for (const [name, digest] of Object.entries(library.files)) {
      const response = await fetch(
        `https://raw.githubusercontent.com/bvolpato/vizmatic/${library.commit}/tools/narration/${name}`,
        { signal: AbortSignal.timeout(30000) },
      );
      if (!response.ok) throw new Error(`Cannot download ${name}: HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (hash(bytes) !== digest) throw new Error(`Vizmatic soundbed checksum mismatch: ${name}`);
      await writeFile(join(staging, name), bytes);
    }
    for (const name of Object.keys(library.files))
      await rename(join(staging, name), join(cached, name));
    return cached;
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

const ffmpeg = (args) =>
  exec('ffmpeg', ['-nostdin', '-y', '-hide_banner', '-loglevel', 'error', ...args]);

async function renderBed(tools, settings, encoding, bed, policy) {
  const composer = spawn(
    'uv',
    [
      'run',
      '--no-project',
      '--script',
      join(tools, 'soundbed.py'),
      'bed',
      ...settings,
      '--out',
      '-',
    ],
    {
      cwd: tmpdir(),
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  );
  const encoder = spawn(
    'ffmpeg',
    [
      '-nostdin',
      '-y',
      '-v',
      'error',
      '-xerror',
      '-i',
      'pipe:0',
      '-af',
      `afade=t=in:st=${policy.introSeconds}:d=${policy.fadeSeconds}`,
      '-ar',
      '48000',
      '-ac',
      '2',
      ...encoding,
      bed,
    ],
    { stdio: ['pipe', 'ignore', 'inherit'] },
  );

  const exits = [composer, encoder].map(async (child) => {
    const [code, signal] = await once(child, 'close');
    if (code !== 0) throw new Error(`${child.spawnfile} exited with ${signal ?? code}`);
  });
  const tasks = [...exits, pipeline(composer.stdout, encoder.stdin)];
  try {
    await Promise.all(tasks);
  } catch (error) {
    // Closing the pipe lets the Python writer exit before uv returns.
    composer.stdout.destroy();
    encoder.kill();
    await Promise.allSettled(tasks);
    throw error;
  }
}

export const mixCourseBed = (options) => mixBed(options, false);
export const mixCourseScore = (options) => mixBed(options, true);

async function mixBed({ lesson, source, voice, out, timing, introSeconds }, scoreOnly) {
  const policy = courseBedPolicy(lesson, source, introSeconds);
  const tools = await soundbedDirectory();
  const scratch = await mkdtemp(join(dirname(resolve(out)), '.course-bed-'));
  try {
    const bed = join(scratch, scoreOnly ? 'bed.flac' : 'bed.wav');
    const mix = join(scratch, extname(out) === '.flac' ? 'mix.flac' : 'mix.wav');
    const encoding = scoreOnly ? ['-sample_fmt', 's16', '-c:a', 'flac'] : ['-c:a', 'pcm_s16le'];
    const settings = [
      '--voice',
      resolve(voice),
      '--seed',
      String(policy.seed),
      '--palette',
      policy.palette,
    ];
    if (timing) settings.push('--timing', resolve(timing));
    await renderBed(tools, settings, encoding, bed, policy);
    let levels = await measureCourseBed(voice, bed, policy.introSeconds);
    const relative = levels.active.bedMinusVoiceDb;
    const trimDb =
      relative !== null && relative > policy.maxActiveBedDb ? policy.dialogueBedDb - relative : 0;
    if (trimDb < 0) {
      const quieter = join(scratch, 'quieter' + extname(bed));
      await ffmpeg(['-i', bed, '-af', `volume=${trimDb}dB`, ...encoding, quieter]);
      await rename(quieter, bed);
      levels = await measureCourseBed(voice, bed, policy.introSeconds);
    }
    const graph = `[0:a]aformat=sample_rates=48000:channel_layouts=stereo[voice];[voice][1:a]amix=inputs=2:duration=first:normalize=0,loudnorm=I=${policy.integratedLufs}:TP=${policy.truePeakDbtp}:LRA=${policy.loudnessRangeLu}[mix]`;
    await ffmpeg([
      '-i',
      voice,
      '-i',
      bed,
      '-filter_complex',
      graph,
      '-map',
      '[mix]',
      '-ar',
      '48000',
      '-ac',
      '2',
      '-c:a',
      extname(mix) === '.flac' ? 'flac' : 'pcm_s24le',
      mix,
    ]);
    if (scoreOnly) {
      await rename(mix, out);
      return { trimDb, levels };
    }
    const [voiceSha256, bedSha256, mixSha256] = await Promise.all([
      fileHash(voice),
      fileHash(bed),
      fileHash(mix),
    ]);
    await rename(mix, out);
    return {
      ...policy,
      voiceSha256,
      bedSha256,
      mixSha256,
      trimDb,
      timingSha256: timing ? await fileHash(timing) : null,
      levels,
    };
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}
