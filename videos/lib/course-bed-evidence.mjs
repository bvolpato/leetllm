import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const sampleRate = 48000;
const windowFrames = 960;
const activeVoiceThreshold = 0.012;

async function probe(file, allowFlac = false) {
  const { stdout } = await exec('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=format_name:stream=codec_type,codec_name,channels,sample_rate,time_base,duration_ts,bits_per_raw_sample',
    '-of',
    'json',
    file,
  ]);
  const { format, streams } = JSON.parse(stdout);
  const [audio] = streams;
  const rate = Number(audio?.sample_rate);
  const frames = Number(audio?.duration_ts);
  const pcm16 = format.format_name === 'wav' && audio?.codec_name === 'pcm_s16le';
  const flac16 =
    allowFlac &&
    format.format_name === 'flac' &&
    audio?.codec_name === 'flac' &&
    Number(audio.bits_per_raw_sample) === 16;
  if (
    !(pcm16 || flac16) ||
    streams.length !== 1 ||
    ![1, 2].includes(audio.channels) ||
    !(rate > 0) ||
    audio.time_base !== '1/' + rate ||
    !Number.isSafeInteger(frames) ||
    frames <= 0
  )
    throw new Error('Expected 16-bit mono or stereo audio in ' + file);
  return { rate, frames, channels: audio.channels };
}

function accumulator() {
  return { windows: 0, frames: 0, voicePower: 0, bedPower: 0, voicePeak: 0, bedPeak: 0 };
}

function db(level) {
  return level > 0 ? 20 * Math.log10(level) : null;
}

function summarize(group) {
  const voice = Math.sqrt(group.voicePower / (2 * group.frames));
  const bed = Math.sqrt(group.bedPower / (2 * group.frames));
  return {
    windows: group.windows,
    voiceRmsDbfs: db(voice),
    bedRmsDbfs: db(bed),
    bedMinusVoiceDb: voice > 0 ? db(bed / voice) : null,
    voicePeakDbfs: db(group.voicePeak),
    bedPeakDbfs: db(group.bedPeak),
  };
}

export async function measureCourseBed(voiceWav, bedFile, skipSeconds = 4) {
  if (!Number.isFinite(skipSeconds) || skipSeconds < 0) throw new Error('Invalid intro duration');
  const [voice, bed] = await Promise.all([probe(voiceWav), probe(bedFile, true)]);
  if (bed.channels !== 2 || bed.rate !== sampleRate)
    throw new Error('Expected a stereo 48 kHz bed');
  if (Math.abs((voice.frames * sampleRate) / voice.rate - bed.frames) > 1)
    throw new Error('Voice and bed durations differ');
  const skip = Math.round(skipSeconds * sampleRate);
  if (skip >= bed.frames) throw new Error('No audio remains after the intro');
  const pan = voice.channels === 1 ? 'pan=stereo|c0=c0|c1=c0,' : '';
  const child = spawn(
    'ffmpeg',
    [
      '-nostdin',
      '-v',
      'error',
      '-xerror',
      '-i',
      voiceWav,
      '-i',
      bedFile,
      '-filter_complex',
      '[0:a]' +
        pan +
        'aresample=48000[v];[v][1:a]join=inputs=2:channel_layout=quad:map=0.0-FL|0.1-FR|1.0-BL|1.1-BR[out]',
      '-map',
      '[out]',
      '-c:a',
      'pcm_s16le',
      '-f',
      's16le',
      'pipe:1',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let errors = '';
  child.stderr.setEncoding('utf8').on('data', (data) => {
    errors = (errors + data).slice(-4096);
  });
  const exited = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code) =>
      code === 0 ? resolve() : reject(new Error('Audio decode failed: ' + errors)),
    );
  });
  const active = accumulator(),
    quiet = accumulator();
  let window = accumulator(),
    decoded = 0;
  function finishWindow() {
    if (!window.frames) return;
    const group =
      Math.sqrt(window.voicePower / (2 * window.frames)) > activeVoiceThreshold ? active : quiet;
    group.windows++;
    group.frames += window.frames;
    group.voicePower += window.voicePower;
    group.bedPower += window.bedPower;
    group.voicePeak = Math.max(group.voicePeak, window.voicePeak);
    group.bedPeak = Math.max(group.bedPeak, window.bedPeak);
    window = accumulator();
  }
  async function consume() {
    let tail = Buffer.alloc(0);
    for await (let chunk of child.stdout) {
      if (tail.length) chunk = Buffer.concat([tail, chunk]);
      const end = chunk.length - (chunk.length % 8);
      for (let i = 0; i < end; i += 8) {
        if (decoded++ < skip) continue;
        const vl = chunk.readInt16LE(i) / 32768,
          vr = chunk.readInt16LE(i + 2) / 32768;
        const bl = chunk.readInt16LE(i + 4) / 32768,
          br = chunk.readInt16LE(i + 6) / 32768;
        window.voicePower += vl * vl + vr * vr;
        window.bedPower += bl * bl + br * br;
        window.voicePeak = Math.max(window.voicePeak, Math.abs(vl), Math.abs(vr));
        window.bedPeak = Math.max(window.bedPeak, Math.abs(bl), Math.abs(br));
        if (++window.frames === windowFrames) finishWindow();
      }
      tail = chunk.subarray(end);
    }
    if (tail.length || Math.abs(decoded - bed.frames) > 1)
      throw new Error('Incomplete decoded audio');
    finishWindow();
  }
  try {
    await Promise.all([consume(), exited]);
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill();
  }
  return {
    durationSeconds: bed.frames / sampleRate,
    sampleRate,
    skipSeconds,
    windowSeconds: windowFrames / sampleRate,
    activeVoiceThreshold,
    active: summarize(active),
    quiet: summarize(quiet),
  };
}
