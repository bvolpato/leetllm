import { SceneClock, Stage } from 'vizmatic/stage';
import { lexicalTokens, timedWordTokens } from '../../lib/captions.mjs';

export const width = 1920;
export const height = 1080;
export const fps = 30;
// Decimal speech times can land a few floating point units above a whole frame.
export const firstFrameAt = (seconds) => Math.ceil(seconds * fps - 1e-9);

export async function loadFilm(id) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error('Expected a lesson ID.');
  const { default: film } = await import(new URL(`../lessons/${id}/film.mjs`, import.meta.url));
  await checkFilm(film);
  return film;
}

export async function checkFilm(film) {
  if (typeof film?.title !== 'string' || !film.title.trim()) throw new Error('Missing film title.');
  if (typeof film.draw !== 'function' || typeof film.check !== 'function')
    throw new Error(`${film.title} requires draw(ctx, clock) and check().`);
  if (!Array.isArray(film.beats) || !film.beats.length)
    throw new Error('Expected at least one beat.');
  const ids = new Set();
  for (const [index, beat] of film.beats.entries()) {
    if (typeof beat?.id !== 'string' || !beat.id.trim() || ids.has(beat.id))
      throw new Error(`Beat ${index} needs a unique, nonempty id.`);
    ids.add(beat.id);
    if (typeof beat.say !== 'string' || !lexicalTokens(beat.say).length)
      throw new Error(`Beat ${beat.id} needs spoken words in say.`);
    if (!Number.isFinite(beat.hold) || beat.hold < 0)
      throw new Error(`Beat ${beat.id} needs a finite, nonnegative hold in seconds.`);
  }
  if ((await film.check()) === false) throw new Error(`Film check failed for ${film.title}.`);
}

// Keep the course estimate of 2.5 words per second for silent previews.
export function estimateTakes(film) {
  return film.beats.map(({ say }) => {
    const written = say.match(/\S+/gu).filter((text) => lexicalTokens(text).length);
    const words = written.map((text, i) => ({ text, start: i / 2.5, end: (i + 1) / 2.5 }));
    return { duration: words.at(-1).end, words };
  });
}

export function buildTimeline(film, takes) {
  if (takes.length !== film.beats.length) throw new Error('Expected one speech take per beat.');
  let frames = 0;
  const schedule = film.beats.map((beat, index) => {
    const { duration, audio, words } = takes[index];
    const tokens = timedWordTokens(words, beat.say);
    if (!Number.isFinite(duration) || duration <= 0 || words.at(-1).start >= duration)
      throw new Error(`Invalid speech duration for ${beat.id}.`);
    const startFrame = frames;
    // Each hold ends on a frame boundary. Audio and picture use that same boundary.
    const count = Math.max(1, firstFrameAt(duration + beat.hold));
    frames += count;
    if (!Number.isSafeInteger(frames)) throw new Error(`Invalid frame count for ${beat.id}.`);
    const cueWordIndices = new Set();
    const starts = new Map();
    const wordCues = new Map();
    const captionStarts = new Set();
    let spoken;
    let indexed;
    const phraseClock = (events, end) =>
      new SceneClock(new Stage({}), beat.id, 0, end, [
        { start: 0, end, until: end, text: beat.say, words: events },
      ]);
    function wordCue(phrase) {
      if (!wordCues.has(phrase)) {
        // A one-beat clock keeps the measured times relative to this take.
        spoken ??= phraseClock(words, duration);
        wordCues.set(phrase, Object.freeze(spoken.cue(phrase)));
      }
      return wordCues.get(phrase);
    }
    function markCaption(phrase) {
      if (captionStarts.has(phrase)) return;
      const { start } = wordCue(phrase);
      let wordIndex = words.findIndex((word) => word.start === start);
      if (words[wordIndex + 1]?.start === start) {
        // Tied times cannot identify the word. Give the same matcher each word's index as its time.
        indexed ??= phraseClock(
          words.map(({ text }, i) => ({ text, start: i, end: i + 1 })),
          words.length,
        );
        wordIndex = indexed.cue(phrase).start;
      }
      cueWordIndices.add(wordIndex);
      captionStarts.add(phrase);
    }
    function phraseStart(phrase) {
      if (!starts.has(phrase)) {
        const query = typeof phrase === 'string' && lexicalTokens(phrase);
        const first = query?.length
          ? tokens.findIndex((_, i) => query.every((value, j) => tokens[i + j]?.value === value))
          : -1;
        if (first < 0)
          throw new Error(`Beat ${beat.id} does not say the phrase ${JSON.stringify(phrase)}.`);
        const { wordIndex } = tokens[first];
        cueWordIndices.add(wordIndex);
        starts.set(phrase, words[wordIndex].start);
      }
      return starts.get(phrase);
    }
    return {
      index,
      beat,
      startFrame,
      frames: count,
      speechDuration: duration,
      words,
      audio,
      cueWordIndices,
      phraseStart,
      wordCue,
      markCaption,
    };
  });

  // Read any audio needed for the picture before the renderer releases its take files.
  const pictureData = film.preparePicture?.(schedule);
  if (typeof pictureData?.then === 'function')
    throw new TypeError('preparePicture(schedule) must return its picture data synchronously.');
  let current = 0;
  function clockAtFrame(frame, onReveal) {
    if (!Number.isInteger(frame) || frame < 0 || frame >= frames)
      throw new RangeError(`Frame ${frame} is outside this ${frames}-frame lesson body.`);
    // Rendering visits adjacent frames. Inspections can also seek back to a cue.
    while (current > 0 && frame < schedule[current].startFrame) current--;
    while (current + 1 < schedule.length && frame >= schedule[current + 1].startFrame) current++;
    const entry = schedule[current];
    const localFrame = frame - entry.startFrame;
    const elapsed = localFrame / fps;
    const progress = localFrame / Math.max(1, entry.frames - 1);
    return {
      ...(pictureData !== undefined && { pictureData }),
      width,
      height,
      index: entry.index,
      beat: entry.beat,
      seconds: frame / fps,
      elapsed,
      progress,
      ...(entry.beat.beatsInChapter && {
        chapterProgress: (entry.beat.beatIndex + progress) / entry.beat.beatsInChapter,
      }),
      speechDuration: entry.speechDuration,
      wordCue: entry.wordCue,
      reveal(phrase, transitionSeconds = 0.45, { captionStart } = {}) {
        if (!Number.isFinite(transitionSeconds) || transitionSeconds < 0)
          throw new Error(`Beat ${entry.beat.id} needs a finite, nonnegative reveal transition.`);
        let start;
        if (captionStart === undefined) {
          start = entry.phraseStart(phrase);
        } else {
          start = entry.wordCue(phrase).start;
          if (captionStart !== false) entry.markCaption(captionStart);
        }
        onReveal?.(start, transitionSeconds);
        if (localFrame >= firstFrameAt(start + transitionSeconds)) return 1;
        if (localFrame < firstFrameAt(start)) return 0;
        return Math.max(0, Math.min(1, (elapsed - start) / transitionSeconds));
      },
    };
  }
  return { schedule, frames, clockAtFrame };
}
