import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { buildTimeline } from '../../director-cuts/lesson-runtime/timeline.mjs';
import { filmText } from '../../director-cuts/lesson-runtime/sound.mjs';
import { loadFullFilm } from '../film.mjs';
import { writeVoice } from '../sound.mjs';

const cli = (name) => fileURLToPath(new URL('../' + name + '.mjs', import.meta.url));
const host = (file, ...args) =>
  execFileSync(process.execPath, [file, ...args], { encoding: 'utf8', stdio: 'pipe' });
const chapter = (id, count, start) => ({
  id: 'unit-' + id,
  title: 'Shelf ' + id,
  sourceChapters: ['c' + String(id).padStart(2, '0')],
  beats: Array.from({ length: count }, (_, i) => ({
    id: 'take-' + (start + i),
    say: 'Which drawer? Turn green.',
    hold: 0.25,
  })),
});
const moduleText = `
import assert from 'node:assert/strict';
let checked = false;
export default {
  title: 'The drawers', check() { checked = true; },
  draw(ctx, clock) {
    assert(checked);
    const phase = clock.reveal('turn green', 0.25);
    ctx.fillStyle = phase === 0 ? '#ff0000' : phase === 1 ? '#00ff00' : '#0000ff';
    ctx.fillRect(0, 0, clock.width, clock.height);
  },
};
`;
async function fixture(t, chapters) {
  const root = await mkdtemp(join(tmpdir(), 'full-director-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const lessonsDir = join(root, 'lessons');
  const lesson = join(lessonsDir, 'fixture');
  await mkdir(lesson, { recursive: true });
  await writeFile(join(lesson, 'film.mjs'), moduleText);
  await writeFile(join(lesson, 'narration.json'), JSON.stringify(chapters));
  return { root, lesson, lessonsDir };
}

test('a silent preview prepares shared picture data before its first frame', () => {
  const beat = { id: 'door', say: 'Closed', hold: 0 };
  const take = { duration: 0.5, words: [{ text: 'Closed', start: 0.1, end: 0.4 }] };
  const film = { beats: [beat] };
  assert.equal(buildTimeline(film, [take]).clockAtFrame(0).pictureData, undefined);
  film.preparePicture = ([entry]) => ({ word: entry.words[0].text, recorded: Boolean(entry.audio) });
  const { clockAtFrame } = buildTimeline(film, [take]);
  const picture = clockAtFrame(0).pictureData;
  assert.deepEqual(picture, { word: 'Closed', recorded: false });
  assert.equal(clockAtFrame(7).pictureData, picture);
  film.preparePicture = async () => picture;
  assert.throws(() => buildTimeline(film, [take]), /synchronously/);
});

test('global and chapter ordinals follow the authored units with a shorter final unit', async (t) => {
  const chapters = [chapter(1, 2, 1), chapter(10, 3, 3), chapter(11, 1, 6)];
  chapters[1].title = 'Result #1 = blue';
  chapters[1].sourceChapters.push('c11');
  const { lessonsDir, lesson } = await fixture(t, chapters);
  const film = await loadFullFilm('fixture', { lessonsDir });
  const takes = film.beats.map((_, i) => ({
    duration: 1.147 + i * 0.12,
    words: [
      { text: 'Which', start: 0.041, end: 0.124 },
      { text: 'drawer?', start: 0.2, end: 0.405 },
      { text: 'Turn', start: 0.731 + i * 0.1, end: 0.81 + i * 0.1 },
      { text: 'green.', start: 0.932 + i * 0.1, end: 1.1 + i * 0.1 },
    ],
  }));
  const { schedule, clockAtFrame, frames } = buildTimeline(film, takes);
  assert.deepEqual(
    schedule.map((s) => s.startFrame),
    [0, 42, 88, 138, 191, 248],
  );
  assert.equal(frames, 308);
  assert.deepEqual(
    schedule.map(({ beat: b }) => [b.chapterIndex, b.beatIndex, b.beatsInChapter]),
    [
      [0, 0, 2],
      [0, 1, 2],
      [1, 0, 3],
      [1, 1, 3],
      [1, 2, 3],
      [2, 0, 1],
    ],
  );
  for (const entry of schedule.toReversed()) {
    const end = clockAtFrame(entry.startFrame + entry.frames - 1);
    const start = clockAtFrame(entry.startFrame);
    assert.equal(end.chapterProgress, (entry.beat.beatIndex + 1) / entry.beat.beatsInChapter);
    assert.equal(start.chapterProgress, entry.beat.beatIndex / entry.beat.beatsInChapter);
    assert.equal(start.index, entry.index);
    assert.equal(start.elapsed, 0);
    const wordFrame = Math.ceil(takes[entry.index].words[2].start * 30);
    assert.equal(clockAtFrame(entry.startFrame + wordFrame - 1).reveal('Turn green', 0), 0);
    assert.equal(clockAtFrame(entry.startFrame + wordFrame).reveal('Turn green', 0), 1);
  }
  const text = filmText(film, schedule, { teachingChapters: true });
  assert.equal(text.metadata.split('[CHAPTER]').length - 1, 4);
  assert.match(text.metadata, /START=4000\nEND=6933\ntitle=Shelf 1/);
  assert.match(text.metadata, /START=6933\nEND=12267\ntitle=Result \\#1 \\= blue/);
  assert.match(text.metadata, /START=12267\nEND=14267\ntitle=Shelf 11/);
  assert.match(text.subtitles, /00:00:13,498 --> 00:00:13,867\nTurn green\./);
  chapters[2].beats[0].id = 'take-1';
  await writeFile(join(lesson, 'narration.json'), JSON.stringify(chapters));
  await assert.rejects(loadFullFilm('fixture', { lessonsDir }), /unique/);
  await assert.rejects(loadFullFilm('../fixture', { lessonsDir }), /lesson ID/);
});

test('the JPEG index includes the partial final page and full-size chapter stills show the reveal', async (t) => {
  const chapters = Array.from({ length: 5 }, (_, i) => chapter(i + 1, 1, i + 1));
  const { root, lessonsDir, lesson } = await fixture(t, chapters);
  const sheet = join(root, 'shelf.jpg');
  const check = (...args) => host(cli('check'), 'fixture', '--lessons-dir', lessonsDir, ...args);
  const result = JSON.parse(check('--sheet', sheet));
  assert.deepEqual(result, JSON.parse(await readFile(join(root, 'shelf.json'))));
  assert.deepEqual(result.pages, [sheet, join(root, 'shelf.p02.jpg')]);
  assert.deepEqual(
    result.chapters.map((c) => c.id),
    chapters.map((c) => c.id),
  );
  const pictures = await Promise.all(result.pages.map((path) => loadImage(path)));
  assert.equal(pictures[0].height, 4 * pictures[1].height);
  for (const [index, ch] of result.chapters.entries()) {
    assert.equal(ch.chapterIndex, index);
    assert.equal(new Set(ch.samples.map((s) => s.bodyFrame)).size, 3);
    const image = pictures[Math.floor(index / 4)];
    const ctx = createCanvas(1, 1).getContext('2d');
    for (const [i, s] of ch.samples.entries()) {
      const { x, y, width, height } = s.rect;
      ctx.drawImage(image, x + width / 2, y + height / 2, 1, 1, 0, 0, 1, 1);
      const pixel = ctx.getImageData(0, 0, 1, 1).data;
      assert(pixel[[0, 2, 1][i]] > 242, `Expected ${s.phase} color in chapter ${ch.id}`);
    }
  }
  const detail = JSON.parse(check('--chapter', '05', '--stills', root));
  assert.deepEqual(
    detail.chapters.map((c) => c.id),
    ['unit-5'],
  );
  const still = await loadImage(detail.chapters[0].stills[1].path);
  assert.deepEqual([still.width, still.height], [1920, 1080]);
  check('--sheet', sheet, '--chapter', 'unit-1');
  await assert.rejects(readFile(join(root, 'shelf.p02.jpg')), { code: 'ENOENT' });
  const lastGood = await readFile(sheet);
  await writeFile(join(lesson, 'film.mjs'), moduleText.replace('turn green', 'turn left'));
  assert.throws(() => check('--sheet', sheet), /does not say the phrase/);
  assert.deepEqual(await readFile(sheet), lastGood);
  assert(!(await readdir(root)).some((f) => f.startsWith('.full-preview-')));
});

test('bounded PCM batches append exact padded and trimmed samples through the partial last batch', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'full-director-pcm-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sample = join(root, 'tone.wav'),
    voice = join(root, 'voice.wav');
  execFileSync('ffmpeg', [
    '-nostdin',
    '-v',
    'error',
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=600:sample_rate=24000:duration=0.05',
    '-c:a',
    'pcm_s16le',
    sample,
  ]);
  const schedule = Array.from({ length: 73 }, (_, i) => ({ frames: i % 2 ? 1 : 4, audio: sample }));
  writeVoice(schedule, voice);
  const pcm = await readFile(voice);
  let offset = 44;
  for (const { frames } of schedule) {
    const length = frames * 800 * 4;
    assert(pcm.readInt16LE(offset + 12) > 0);
    if (frames === 4) assert.equal(pcm.readInt16LE(offset + length - 4), 0);
    offset += length;
  }
  assert.equal(pcm.length, offset);
  assert.equal(pcm.readUInt32LE(40), offset - 44);
});

test('full IDs use their own modules and a failed load preserves the destination', async (t) => {
  const { root, lessonsDir } = await fixture(t, [chapter(1, 1, 1)]);
  const movie = join(root, 'existing.mp4');
  await writeFile(movie, 'previous fixture');
  for (const id of ['python', 'forecasting', 'damaged-package', 'geometry']) {
    const oldCli = fileURLToPath(new URL('../../director-cuts/render.mjs', import.meta.url));
    assert.throws(
      () => host(oldCli, id, '--master', movie, '--out', join(root, 'short.mp4')),
      /must match the SHA-256/,
    );
    assert.throws(
      () => host(cli('render'), id, '--lessons-dir', lessonsDir, '--out', movie),
      /narration.json/,
    );
  }
  assert.equal(await readFile(movie, 'utf8'), 'previous fixture');
});
