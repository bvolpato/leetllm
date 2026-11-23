import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function score(script, work, videos) {
  const speech = await import(pathToFileURL(join(videos, 'lib/course-speech.mjs')));
  const { mixCourseBed } = await import(pathToFileURL(join(videos, 'lib/course-bed.mjs')));
  process.env.LEETLLM_KOKORO_WARM ??= '1';
  const { takes } = await speech.prepareTakes(
    script.beats.map((beat) => beat.line),
    work,
  );
  const rate = 48000;
  let sample = Math.round(0.22 * rate);
  const schedule = script.beats.map((beat, i) => {
    const start = sample / rate;
    const { duration, words } = takes[i];
    sample += Math.round((duration + beat.hold) * rate);
    return { id: beat.id, start, duration, words };
  });
  const frames = Math.ceil((sample / rate) * 30);
  const inputs = takes.flatMap(({ audio }) => ['-i', audio]);
  const tracks = schedule.map(
    (beat, i) =>
      `[${i}:a]aresample=48000,aformat=channel_layouts=mono,adelay=${Math.round(beat.start * rate)}S[a${i}]`,
  );
  tracks.push(
    schedule.map((_, i) => `[a${i}]`).join('') +
      `amix=inputs=${takes.length}:normalize=0,apad,atrim=end_sample=${frames * 1600}[voice]`,
  );
  const voice = join(work, 'voice.wav');
  execFileSync('ffmpeg', [
    '-v',
    'error',
    '-nostdin',
    '-y',
    ...inputs,
    '-filter_complex',
    tracks.join(';'),
    '-map',
    '[voice]',
    '-c:a',
    'pcm_s16le',
    voice,
  ]);
  const audio = join(work, 'mixed.flac');
  const bed = await mixCourseBed({
    lesson: script.lesson,
    source: '',
    voice,
    out: audio,
    introSeconds: 0,
  });
  const timing = { fps: 30, frames, profile: speech.courseNarrator, schedule };
  await writeFile(join(work, 'timing.json'), JSON.stringify(timing, null, 2));
  await writeFile(join(work, 'bed.json'), JSON.stringify(bed, null, 2));
  return timing;
}
