import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { project, artifact, envPath, courseModule } from './common.mjs';

const timing = JSON.parse(readFileSync(artifact('timing.json'), 'utf8'));
const require = createRequire(
  join(process.env.DIRECTOR_MODULES || envPath('COURSE_VIDEOS'), 'consumer.cjs'),
);
const foley = join(dirname(require.resolve('vizmatic')), '..', 'tools', 'narration', 'soundbed.py');
execFileSync(
  'uv',
  ['run', '--no-project', '--script', foley, 'render', 'latch', '--out', artifact('latch.wav')],
  { stdio: 'inherit' },
);
const args = ['-nostdin', '-y', '-hide_banner', '-v', 'error'];
for (const b of timing.beats) args.push('-i', b.audio);
const catches = [
  ['ten', 'sheet'],
  ['forty', 'forty'],
];
const effects = catches.map(([id, word]) => {
  const beat = timing.beats.find((b) => b.id === id);
  const cue = beat.words.find((w) => w.text.toLowerCase().replace(/[^a-z]/g, '') === word);
  if (!cue) throw Error('Missing catch ' + id + '/' + word);
  return { id, at: beat.start + cue.end + 0.005 };
});
const rate = 48000,
  graph = timing.beats.map(
    (b, i) =>
      '[' +
      i +
      ':a]aresample=48000,aformat=channel_layouts=mono,adelay=' +
      Math.round(b.start * rate) +
      'S[part' +
      i +
      ']',
  );
for (const [j, e] of effects.entries()) {
  const i = timing.beats.length + j;
  args.push('-i', artifact('latch.wav'));
  graph.push(
    '[' +
      i +
      ':a]aresample=48000,aformat=channel_layouts=mono,volume=0.62,adelay=' +
      Math.round(rate * e.at) +
      'S[part' +
      i +
      ']',
  );
}
const parts = timing.beats.length + effects.length;
graph.push(
  Array.from({ length: parts }, (_, i) => '[part' + i + ']').join('') +
    'amix=inputs=' +
    parts +
    ':normalize=0,apad,atrim=end_sample=' +
    timing.frames * 1600 +
    '[voice]',
);
execFileSync(
  'ffmpeg',
  [
    ...args,
    '-filter_complex',
    graph.join(';'),
    '-map',
    '[voice]',
    '-c:a',
    'pcm_s16le',
    artifact('dialogue.wav'),
  ],
  { stdio: 'inherit' },
);
const { mixCourseBed } = await courseModule('course-bed.mjs');
const evidence = await mixCourseBed({
  lesson: project.lesson,
  voice: artifact('dialogue.wav'),
  out: artifact('mixed.flac'),
  introSeconds: 0,
});
writeFileSync(artifact('score.json'), JSON.stringify({ ...evidence, effects }, null, 2));
