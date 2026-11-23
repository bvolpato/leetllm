import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);

function ratio(value) {
  const match = /^(\d+)(?:\/(\d+))?$/.exec(String(value));
  if (!match) return NaN;
  const numerator = Number(match[1]),
    denominator = Number(match[2] ?? 1);
  return numerator > 0 && denominator > 0 ? numerator / denominator : NaN;
}

export function checkPacketClock(
  stream,
  packets,
  timeline,
  receipt,
  fps,
  { requireBrand = false } = {},
) {
  const fail = (reason) => {
    throw new Error(`Invalid ${fps} fps picture clock: ${reason}`);
  };
  const average = ratio(stream.avg_frame_rate);
  const declared = ratio(receipt.fps);
  if (
    ratio(stream.r_frame_rate) !== fps ||
    timeline.fps !== fps ||
    !Number.isFinite(average) ||
    ![fps, average].includes(declared) ||
    (receipt.averageFps !== undefined &&
      (declared !== fps || ratio(receipt.averageFps) !== average))
  )
    fail('frame rate differs from receipt or timeline');
  const lengths = timeline.scenes.map((scene) => scene.frames);
  if (
    requireBrand &&
    (receipt.opening === 'lesson' ||
      timeline.opening === 'lesson' ||
      timeline.intro?.id !== 'leetllm-intro' ||
      timeline.intro.start !== 0 ||
      timeline.intro.frames !== 4 * fps ||
      timeline.intro.duration !== 4 ||
      receipt.brandIntro?.frames !== 4 * fps ||
      receipt.brandIntro.duration !== 4 ||
      timeline.scenes[0]?.start !== 4)
  )
    fail('missing brand intro or gap before the first lesson frame');
  if (receipt.opening === 'lesson' || timeline.opening === 'lesson') {
    if (
      receipt.opening !== 'lesson' ||
      timeline.opening !== 'lesson' ||
      timeline.intro !== null ||
      receipt.brandIntro !== null ||
      !lengths.length ||
      timeline.scenes[0].start !== 0
    )
      fail('lesson opening differs from receipt or timeline');
  } else {
    if (!timeline.intro) fail('missing brand intro');
    lengths.unshift(timeline.intro.frames);
  }
  let frames = 0;
  const cuts = new Set();
  for (const length of lengths) {
    if (!Number.isSafeInteger(length) || length <= 0) fail('invalid authored scene length');
    frames += length;
    cuts.add(frames);
  }
  const tick = ratio(stream.time_base),
    ticksPerFrame = 1 / (fps * tick);
  const ticks = packets.map((p) => Number(p.pts)).sort((a, b) => a - b);
  if (
    !Number.isFinite(tick) ||
    ticksPerFrame < 1 ||
    ticks.length !== frames ||
    receipt.frameAudit?.frames !== frames ||
    Number(stream.nb_frames) !== frames ||
    ticks[0] !== 0 ||
    Number(stream.start_pts) !== 0
  )
    fail('frame count, start or time base differs');
  // Exact frame ticks are common in MP4. Other time bases round presentation timestamps to a tick.
  const quantization = Number.isInteger(ticksPerFrame) ? 0 : 1;
  let sceneStart = 0;
  for (let i = 0; i < ticks.length; i++) {
    const pts = ticks[i];
    if (
      !Number.isSafeInteger(pts) ||
      (i && pts <= ticks[i - 1]) ||
      Math.abs(pts - i * ticksPerFrame) >= ticksPerFrame / 2
    )
      fail(`presentation timestamp at frame ${i}`);
    if (cuts.has(i)) {
      // The concat demuxer can round a preceding segment's duration to a millisecond.
      if (Math.abs(pts - ticks[i - 1] - ticksPerFrame) > 0.001 / tick + quantization)
        fail(`scene join at frame ${i}`);
      sceneStart = i;
    } else if (
      (i > 0 &&
        (pts - ticks[i - 1] < Math.floor(ticksPerFrame) ||
          pts - ticks[i - 1] > Math.ceil(ticksPerFrame))) ||
      Math.abs(pts - ticks[sceneStart] - (i - sceneStart) * ticksPerFrame) > quantization
    ) {
      fail(`within-scene timestamp at frame ${i}`);
    }
  }
  const end = Number(stream.duration_ts);
  if (
    !Number.isSafeInteger(end) ||
    Math.abs(average * end * tick - frames) > 0.000001 ||
    Math.abs(end - ticks.at(-1) - ticksPerFrame) > quantization ||
    Math.abs(end - frames * ticksPerFrame) >= ticksPerFrame / 2
  )
    fail('final frame duration');
}

export async function verifiedClockReceipt(
  movie,
  receipt,
  fps,
  { always = false, requireBrand = false } = {},
) {
  if (
    !always &&
    !requireBrand &&
    ratio(receipt.fps) === fps &&
    (receipt.averageFps === undefined || ratio(receipt.averageFps) === fps)
  )
    return receipt;
  const bytes = await readFile(join(dirname(movie), 'timeline.json'));
  if (
    createHash('sha256').update(bytes).digest('hex') !== receipt.artifactSha256?.['timeline.json']
  )
    throw new Error('Picture clock timeline checksum differs');
  const { stdout } = await exec(
    'ffprobe',
    [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=r_frame_rate,avg_frame_rate,time_base,nb_frames,start_pts,duration_ts:packet=pts',
      '-of',
      'json',
      movie,
    ],
    { maxBuffer: 128 * 1024 * 1024 },
  );
  const media = JSON.parse(stdout);
  checkPacketClock(media.streams[0], media.packets, JSON.parse(bytes), receipt, fps, {
    requireBrand,
  });
  return { ...receipt, fps };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const movie = process.argv[2];
  const receipt = JSON.parse(await readFile(join(dirname(movie), 'verification.json')));
  await verifiedClockReceipt(movie, receipt, Number(process.argv[3]), { always: true });
}
