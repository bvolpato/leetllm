import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { BRAND_INTRO_SECONDS } from '../../lib/brand.mjs';
import { mixCourseBed } from '../../lib/course-bed.mjs';
import { prepareTakes } from '../../lib/course-speech.mjs';
import { srt, wordCaptions } from '../../lib/lesson.mjs';
import { fps } from './timeline.mjs';

export async function prepareSpeech(film, work) {
  process.env.LEETLLM_KOKORO_WARM ??= '1';
  const { takes } = await prepareTakes(
    film.beats.map((beat) => beat.say),
    work,
  );
  return takes;
}

// FFmetadata treats these characters as syntax, including in a chapter title.
const titleField = (value) =>
  'title=' +
  value
    .trim()
    .replace(/\s+/gu, ' ')
    .replace(/[\\#;=]/gu, '\\$&');

const bareDeterminer = /^(?:a|an|the|my|your|his|her|its|our|their)$/iu;

const captionStart = (seconds) => Math.ceil(seconds * 1000 - 1e-8) / 1000;

function reflowCaption(lead, next, words, beatStart) {
  let best;
  let bestScore = Infinity;
  let left = lead.text;
  const joined = lead.text + ' ' + next.text;
  for (let i = next.firstWord + 1; i < next.afterWord; i++) {
    const previousWord = words[i - 1];
    left += ' ' + previousWord.text;
    const right = joined.slice(left.length + 1);
    if (left.length > 76 || right.length > 76) continue;
    const start = captionStart(beatStart + words[i].start);
    const end = Math.min(beatStart + previousWord.end, start, next.end);
    if (
      Math.round(end * 1000) - Math.round(next.start * 1000) < 300 ||
      Math.round(next.end * 1000) - Math.round(start * 1000) < 300
    )
      continue;
    // A clause break takes priority. Among equal candidates, balance reading time.
    const penalty = /[,;:]$/u.test(previousWord.text) ? 0 : next.end - next.start;
    const score = penalty + Math.abs(end - next.start - (next.end - start));
    if (score < bestScore) {
      bestScore = score;
      best = [
        { text: left, start: next.start, end, firstWord: lead.firstWord, afterWord: i },
        { text: right, start, end: next.end, firstWord: i, afterWord: next.afterWord },
      ];
    }
  }
  return best;
}

function joinStrandedDeterminers(captions, first, anchoredStarts, words, beatStart) {
  // Use the same millisecond boundaries as the delivered SRT track.
  for (let i = captions.length - 2; i >= first; i--) {
    const lead = captions[i];
    const next = captions[i + 1];
    if (!bareDeterminer.test(lead.text) || anchoredStarts.has(lead.start)) continue;
    const endMs = Math.round(lead.end * 1000);
    if (endMs - Math.round(lead.start * 1000) >= 300 || Math.round(next.start * 1000) - endMs > 35)
      continue;
    const joined = lead.text + ' ' + next.text;
    if (joined.length <= 76) {
      next.text = joined;
      next.firstWord = lead.firstWord;
      captions.splice(i, 1);
    } else {
      const split = reflowCaption(lead, next, words, beatStart);
      if (split) captions.splice(i, 2, ...split);
    }
  }
}

export function filmText(film, schedule, { teachingChapters = false } = {}) {
  const captions = [];
  const chapters = [';FFMETADATA1', titleField(film.title)];
  function chapter(name, from, until) {
    chapters.push(
      '[CHAPTER]',
      'TIMEBASE=1/1000',
      `START=${Math.round(from * 1000)}`,
      `END=${Math.round(until * 1000)}`,
      titleField(name),
    );
  }
  chapter('LeetLLM', 0, BRAND_INTRO_SECONDS);
  for (const {
    index,
    beat,
    startFrame,
    frames,
    speechDuration,
    words,
    cueWordIndices,
  } of schedule) {
    const start = BRAND_INTRO_SECONDS + startFrame / fps;
    if (!teachingChapters) {
      chapter(beat.id.replace(/[-_]+/gu, ' '), start, start + frames / fps);
    } else if (beat.beatIndex === 0) {
      const last = schedule[index + beat.beatsInChapter - 1];
      chapter(
        beat.chapterTitle,
        start,
        BRAND_INTRO_SECONDS + (last.startFrame + last.frames) / fps,
      );
    }
    // A caption containing the answer opens when the reveal phrase is spoken.
    const cuts = [...new Set([0, ...cueWordIndices, words.length])].sort((a, b) => a - b);
    const firstCaption = captions.length;
    const anchoredStarts = new Set();
    for (let i = 1; i < cuts.length; i++) {
      const group = words.slice(cuts[i - 1], cuts[i]);
      let wordIndex = cuts[i - 1];
      for (const [j, cue] of wordCaptions(group, start).entries()) {
        const firstWord = wordIndex;
        // The captioner joins provider events with spaces. An event can itself contain spaces.
        for (let remaining = cue.text.length; remaining > 0; wordIndex++)
          remaining -= words[wordIndex].text.length + 1;
        const from = captionStart(cue.start);
        if (j === 0 && cueWordIndices.has(cuts[i - 1])) anchoredStarts.add(from);
        const end = Math.min(cue.end, start + speechDuration);
        const previous = captions.at(-1);
        if (previous?.start === from) {
          previous.text += ' ' + cue.text;
          previous.end = Math.max(previous.end, end);
          previous.afterWord = wordIndex;
        } else {
          if (previous) previous.end = Math.min(previous.end, from);
          captions.push({ text: cue.text, start: from, end, firstWord, afterWord: wordIndex });
        }
      }
    }
    joinStrandedDeterminers(captions, firstCaption, anchoredStarts, words, start);
  }
  if (captions.some((cue) => Math.round(cue.end * 1000) <= Math.round(cue.start * 1000)))
    throw new Error('A spoken caption has no duration in the subtitle track.');
  return { subtitles: srt(captions), metadata: chapters.join('\n') + '\n' };
}

export async function writeSound({ id, film, work, schedule }) {
  const voice = join(work, 'voice.wav');
  const audio = join(work, 'mixed.flac');
  const captions = join(work, 'phrases.srt');
  const chapters = join(work, 'chapters.ffmeta');
  const { subtitles, metadata } = filmText(film, schedule);
  await Promise.all([writeFile(captions, subtitles), writeFile(chapters, metadata)]);
  const filters = schedule.map(
    ({ frames }, i) =>
      `[${i}:a:0]aformat=sample_rates=48000:channel_layouts=stereo,apad,atrim=end_sample=${frames * (48000 / fps)},asetpts=PTS-STARTPTS[a${i}]`,
  );
  const segments = schedule.map((_, i) => `[a${i}]`).join('');
  filters.push(`${segments}concat=n=${schedule.length}:v=0:a=1[voice]`);
  execFileSync(
    'ffmpeg',
    [
      '-nostdin',
      '-v',
      'error',
      '-xerror',
      '-y',
      ...schedule.flatMap(({ audio }) => ['-threads', '1', '-i', audio]),
      '-filter_complex_threads',
      '1',
      '-filter_complex',
      filters.join(';'),
      '-map',
      '[voice]',
      '-ar',
      '48000',
      '-ac',
      '2',
      '-c:a',
      'pcm_s16le',
      voice,
    ],
    { stdio: 'inherit' },
  );
  await mixCourseBed({ lesson: id, voice, out: audio, introSeconds: 0 });
  return { audio, captions, chapters };
}
