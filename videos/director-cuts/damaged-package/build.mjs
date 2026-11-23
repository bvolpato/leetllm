import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const { DIRECTOR_MASTER: master, DIRECTOR_OUTPUT: output, DIRECTOR_WORK: work } = process.env;
const edits = JSON.parse(await readFile(join(here, 'edit.json'), 'utf8'));
const fps = 30;
function ffmpeg(...args) {
  execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-xerror', '-y', ...args], {
    cwd: work,
    stdio: 'inherit',
  });
}
ffmpeg('-ss', '15', '-i', master, '-frames:v', '1', 'source-frame.png');
execFileSync(process.execPath, [join(here, 'picture.mjs')], { cwd: work, stdio: 'inherit' });
ffmpeg(
  '-i',
  master,
  '-map',
  '0:v:0',
  '-frames:v',
  String(edits[0].end),
  '-c:v',
  'copy',
  '-map_chapters',
  '-1',
  'opening.mp4',
);
await writeFile(
  join(work, 'picture.concat'),
  "ffconcat version 1.0\nfile 'opening.mp4'\nfile 'redrawn-body.mp4'\n",
);
// The course score is part of each retained take. Short fades soften joins between takes.
const audio = edits.map(({ start, end }, index) => {
  const duration = (end - start) / fps;
  const tail = index === edits.length - 1 ? 0.55 : 0.018;
  const onset = index === 0 ? '' : ',afade=t=in:d=0.018';
  return `[1:a:0]atrim=start=${(start / fps).toFixed(9)}:end=${(end / fps).toFixed(9)},asetpts=PTS-STARTPTS${onset},afade=t=out:st=${(duration - tail).toFixed(9)}:d=${tail}[a${index}]`;
});
// The retained opening has no B-frames. Give its decode clock the lead required
// by the new body so the first B-frame can join without changing presentation times.
const delay = Number(
  execFileSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=has_b_frames',
      '-of',
      'csv=p=0',
      join(work, 'redrawn-body.mp4'),
    ],
    { encoding: 'utf8' },
  ).trim(),
);
const timestamps = `setts=pts=PTS:dts='if(lt(N,${edits[0].end}),DTS-${delay}*DURATION,DTS)'`;
audio.push(edits.map((_, i) => `[a${i}]`).join('') + `concat=n=${edits.length}:v=0:a=1[sound]`);
ffmpeg(
  '-f',
  'concat',
  '-safe',
  '0',
  '-i',
  'picture.concat',
  '-i',
  master,
  '-i',
  join(here, 'captions.srt'),
  '-filter_complex',
  audio.join(';'),
  '-map',
  '0:v:0',
  '-map',
  '[sound]',
  '-map',
  '2:s:0',
  '-map_chapters',
  '-1',
  '-c:v',
  'copy',
  '-bsf:v',
  timestamps,
  '-c:a',
  'aac',
  '-b:a',
  '224k',
  '-ar',
  '48000',
  '-c:s',
  'mov_text',
  '-metadata:s:s:0',
  'language=eng',
  '-disposition:s:0',
  'default',
  '-metadata',
  'title=Which parcel gets the inspection?',
  '-movflags',
  '+faststart',
  output,
);
