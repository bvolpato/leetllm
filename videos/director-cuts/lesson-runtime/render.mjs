import { join } from 'node:path';
import { buildTimeline, loadFilm } from './timeline.mjs';
import { encodePicture } from './picture.mjs';
import { prepareSpeech, writeSound } from './sound.mjs';
import { finishMovie } from './delivery.mjs';

export async function renderLesson(id, work, staged) {
  const film = await loadFilm(id);
  const timeline = buildTimeline(film, await prepareSpeech(film, work));
  const body = join(work, 'picture.mp4');
  await encodePicture(film, timeline, body);
  // Drawing every frame collected the measured phrase starts for the subtitle track.
  const tracks = await writeSound({ id, film, work, schedule: timeline.schedule });
  finishMovie({
    body,
    ...tracks,
    staged,
    bodyFrames: timeline.frames,
    chapterCount: film.beats.length + 1,
  });
}
