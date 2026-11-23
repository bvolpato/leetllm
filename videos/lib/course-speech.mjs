import { createHash, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { constants, existsSync, readFileSync } from 'node:fs';
import { copyFile, mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import timers from 'node:timers/promises';
import { promisify } from 'node:util';
import { createKokoroWorker, KokoroWorkerExit } from './kokoro-worker.mjs';
import { wordCaptions } from './lesson.mjs';

const run = promisify(execFile);
const root = fileURLToPath(new URL('../../', import.meta.url));
const hash = (value) => createHash('sha256').update(value).digest('hex');
export const courseNarrator = Object.freeze(
  JSON.parse(readFileSync(new URL('../narration.json', import.meta.url), 'utf8')),
);

// This order also identifies prior course recordings.
export function speechKey(text, { voice, rate, provider }, adapterHash) {
  return hash(JSON.stringify({ text, voice, rate, provider, adapterHash }));
}

async function findUv() {
  const name = process.platform === 'win32' ? 'uv.exe' : 'uv';
  const candidates = [
    ...(process.env.UV ? [process.env.UV] : []),
    ...(process.env.PATH ?? '').split(delimiter).map((dir) => resolve(dir, name)),
    join(homedir(), '.local', 'bin', name),
  ];
  const failures = [];
  for (const candidate of new Set(candidates)) {
    if (!existsSync(candidate)) continue;
    try {
      await run(candidate, ['cache', 'dir'], { cwd: root });
      return candidate;
    } catch (error) {
      failures.push(error.message);
    }
  }
  throw new Error(
    ['No compatible uv found. See required-version in uv.toml.', ...failures].join('\n'),
  );
}

class WordTimingMismatch extends Error {}

async function probeDuration(audio) {
  const { stdout } = await run('ffprobe', [
    '-v',
    'error',
    '-show_format',
    '-show_streams',
    '-of',
    'json',
    audio,
  ]);
  const media = JSON.parse(stdout),
    duration = Number(media.format.duration);
  if (
    !media.streams.some((s) => s.codec_type === 'audio') ||
    !Number.isFinite(duration) ||
    duration <= 0
  )
    throw new Error('Invalid speech: ' + audio);
  return duration;
}

async function inspect(directory, key, profile, measured) {
  const audio = join(directory, key + '.mp3'),
    boundaries = join(directory, key + '.json');
  const bytes = await readFile(boundaries);
  const metadata = JSON.parse(bytes);
  if (
    profile.provider === 'edge' &&
    (metadata.provider !== 'edge-tts' ||
      metadata.voice !== profile.voice ||
      metadata.rate !== profile.rate)
  )
    throw new Error('Cached narration has a different voice, rate or provider');
  if (profile.provider === 'kokoro') {
    const expected = {
      provider: profile.provider,
      model: profile.model ?? courseNarrator.model,
      voice: profile.voice,
      rate: profile.rate,
    };
    if (resolve(root, profile.ttsScript) === resolve(root, courseNarrator.ttsScript)) {
      Object.assign(expected, {
        speed: 1 + Number.parseFloat(profile.rate) / 100,
        engineVersion: courseNarrator.engineVersion,
        langCode: courseNarrator.langCode,
        sampleRate: courseNarrator.sampleRate,
      });
    }
    if (Object.entries(expected).some(([key, value]) => metadata[key] !== value))
      throw new Error('Cached narration has different Kokoro synthesis settings');
  }
  if (!Array.isArray(metadata.words) || !metadata.words.length)
    throw new Error('Missing speech boundaries');
  wordCaptions(metadata.words);
  const before = await stat(audio, { bigint: true });
  const audioHash = hash(await readFile(audio));
  const duration =
    measured?.audioHash === audioHash ? measured.duration : await probeDuration(audio);
  const after = await stat(audio, { bigint: true });
  if (
    before.dev !== after.dev ||
    before.ino !== after.ino ||
    before.ctimeNs !== after.ctimeNs ||
    before.size !== after.size
  )
    throw new Error('Recording changed during inspection: ' + audio);
  const last = metadata.words.at(-1);
  if (last.end > duration + 0.2)
    throw new WordTimingMismatch(
      `Word timing exceeds audio: ${boundaries}\nFinal word ${JSON.stringify(last.text)} ends at ${last.end}s, audio lasts ${duration}s`,
    );
  if (metadata.audioSha256 && metadata.audioSha256 !== audioHash)
    throw new Error('Word boundaries belong to a different recording: ' + boundaries);
  return {
    audio,
    boundaries,
    key,
    duration,
    words: metadata.words,
    audioHash,
    boundariesHash: hash(bytes),
  };
}

async function copyTake(source, destination, key) {
  await mkdir(destination, { recursive: true });
  for (const extension of ['txt', 'json', 'mp3']) {
    const name = key + '.' + extension;
    const temporary = join(destination, '.' + name + '.' + randomUUID());
    try {
      await copyFile(join(source, name), temporary, constants.COPYFILE_FICLONE);
      await rename(temporary, join(destination, name));
    } finally {
      await rm(temporary, { force: true });
    }
  }
}

/** Prepare measured speech for authored beats or captioned pictures. The result preserves input order. */
export async function prepareTakes(
  texts,
  outputRoot,
  { profile = courseNarrator, retainedOnly = false, onTake, signal } = {},
) {
  if (!Array.isArray(texts) || texts.some((t) => typeof t !== 'string' || !t.trim()))
    throw new Error('Expected an array of nonempty narration strings');
  const cache = join(resolve(outputRoot), '.audio-cache');
  await mkdir(cache, { recursive: true });
  const adapter = resolve(root, profile.ttsScript),
    adapterHash = hash(await readFile(adapter));
  const shared = process.env.LEETLLM_SPEECH_CACHE && resolve(process.env.LEETLLM_SPEECH_CACHE);
  const store = shared || join(cache, '.takes');
  let uv;
  const warm =
    process.env.LEETLLM_KOKORO_WARM === '1' &&
    profile.provider === 'kokoro' &&
    adapter === resolve(root, 'videos/adapters/course-kokoro.py')
      ? createKokoroWorker({ uv: () => (uv ??= findUv()), adapter, cwd: root, signal })
      : null;
  async function take(text) {
    const key = speechKey(text, profile, adapterHash);
    let invalid;
    if (existsSync(join(cache, key + '.mp3'))) {
      try {
        return await inspect(cache, key, profile);
      } catch (error) {
        invalid = error;
      }
    }
    const archived = join(store, key);
    if (existsSync(archived)) {
      const measured = await inspect(archived, key, profile);
      await copyTake(archived, cache, key);
      return inspect(cache, key, profile, measured);
    }
    if (retainedOnly)
      throw new Error('Retained speech cache is missing or invalid: ' + key, { cause: invalid });
    await mkdir(store, { recursive: true });
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const temp = await mkdtemp(join(store, '.record-'));
      try {
        const input = join(temp, key + '.txt');
        await writeFile(input, text);
        uv ??= findUv();
        let measured;
        try {
          if (warm) {
            await warm.record({
              input,
              output: join(temp, key + '.mp3'),
              boundaries: join(temp, key + '.json'),
              voice: profile.voice,
              rate: profile.rate,
            });
          } else
            await run(
              await uv,
              [
                'run',
                adapter,
                '--text-file',
                input,
                '--output',
                join(temp, key + '.mp3'),
                '--voice',
                profile.voice,
                '--rate=' + profile.rate,
                '--boundaries',
                join(temp, key + '.json'),
              ],
              { cwd: root },
            );
          measured = await inspect(temp, key, profile);
        } catch (error) {
          const noAudio =
            profile.provider === 'edge' &&
            /^tts\.py: Edge TTS failed after \d+ attempts: NoAudioReceived:/m.test(
              error.stderr ?? '',
            );
          if (
            signal?.aborted ||
            (!noAudio &&
              !(error instanceof WordTimingMismatch) &&
              !(error instanceof KokoroWorkerExit))
          )
            throw error;
          if (attempt === maxAttempts)
            throw new Error(`${error.message} after ${attempt} recordings with ${profile.voice}`, {
              cause: error,
            });
          if (noAudio) await timers.setTimeout(attempt * 60_000);
          continue;
        }
        const metadata = JSON.parse(await readFile(measured.boundaries, 'utf8'));
        await writeFile(
          measured.boundaries,
          JSON.stringify({ ...metadata, audioSha256: measured.audioHash }) + '\n',
        );
        // Concurrent writers publish whole takes. All readers copy the winning pair.
        try {
          await rename(temp, archived);
        } catch (error) {
          if (!['EEXIST', 'ENOTEMPTY'].includes(error.code)) throw error;
        }
        await copyTake(archived, cache, key);
        return inspect(cache, key, profile, measured);
      } finally {
        await rm(temp, { recursive: true, force: true });
      }
    }
  }
  const result = new Array(texts.length),
    pending = new Map();
  let next = 0;
  async function worker() {
    while (next < texts.length) {
      const i = next++,
        text = texts[i];
      if (!pending.has(text)) pending.set(text, take(text));
      result[i] = await pending.get(text);
      onTake?.(result[i], i);
    }
  }
  try {
    await Promise.all([worker(), worker()]);
  } finally {
    await warm?.close();
  }
  return { takes: result, adapterHash };
}
