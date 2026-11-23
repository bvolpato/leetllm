import { readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { parse } from 'yaml';
import { defineAnimation, sampleAnimation } from 'vizmatic';
import { captionBoundaryTokens, resolveSceneCues, sampleNarrationCues } from './narration-cues.mjs';

import { lexicalTokens } from './captions.mjs';

const SECONDS_PER_ESTIMATED_WORD = 0.4;

export async function readLesson(file, root) {
  const lesson = parse(await readFile(file, 'utf8'));
  const fail = (message) => {
    throw new Error(`${file}: ${message}`);
  };
  if (lesson.version !== 1) fail('version must be 1');
  if (lesson.opening !== undefined && lesson.opening !== 'lesson')
    fail('opening must be lesson when specified');
  if (!/^[a-z][a-z0-9-]*$/.test(lesson.id ?? '')) fail('id must be a lowercase slug');
  if (typeof lesson.title !== 'string' || !lesson.title.trim()) fail('title is required');
  if (typeof lesson.source !== 'string') fail('source is required');
  const contentRoot = resolve(root, 'web/src/content');
  const sourcePath = resolve(contentRoot, lesson.source);
  if (relative(contentRoot, sourcePath).startsWith('..')) fail('source must remain inside content');
  await readFile(sourcePath);
  if (!Array.isArray(lesson.scenes) || !lesson.scenes.length) fail('scenes must be nonempty');
  const ids = new Set();
  for (const scene of lesson.scenes) {
    if (!/^[a-z][a-z0-9-]*$/.test(scene.id ?? '') || ids.has(scene.id))
      fail(`invalid or duplicate scene id ${scene.id}`);
    ids.add(scene.id);
    if (typeof scene.title !== 'string' || !scene.title.trim() || typeof scene.visual !== 'string')
      fail(`${scene.id}: title and visual are required`);
    if (!Array.isArray(scene.beats) || !scene.beats.length)
      fail(`${scene.id}: beats must be nonempty`);
    for (const beat of scene.beats) {
      if (typeof beat.say !== 'string' || !beat.say.trim())
        fail(`${scene.id}: every beat needs narration`);
      if (
        !Number.isFinite(beat.hold ?? 0.45) ||
        (beat.hold ?? 0.45) < 0 ||
        (beat.hold ?? 0.45) > 10
      )
        fail(`${scene.id}: hold must be between 0 and 10 seconds`);
    }
    captionBoundaryTokens(scene);
  }
  return lesson;
}

export function makeSceneTimeline(scene, durations, fps = 30) {
  let cursor = 0.4;
  const beats = scene.beats.map((beat, i) => {
    const duration = durations[i];
    if (!Number.isFinite(duration) || duration <= 0)
      throw new Error(`Invalid audio duration for ${scene.id}/${i}`);
    const start = cursor;
    cursor += duration + (beat.hold ?? 0.45);
    return { ...beat, start, end: start + duration, duration, until: cursor };
  });
  const frames = Math.ceil((cursor + 0.3) * fps);
  return { id: scene.id, fps, frames, duration: frames / fps, beats };
}

export function estimatedSceneWithWords(scene, fps) {
  const sounds = scene.beats.map((beat, beatIndex) => {
    const tokens = lexicalTokens(beat.say);
    const words = tokens.map((text, index) => ({
      text,
      start: index * SECONDS_PER_ESTIMATED_WORD,
      end: (index + 1) * SECONDS_PER_ESTIMATED_WORD,
    }));
    return {
      beatIndex,
      words,
      duration: Math.max(SECONDS_PER_ESTIMATED_WORD, tokens.length * SECONDS_PER_ESTIMATED_WORD),
    };
  });
  return {
    ...makeSceneTimeline(
      scene,
      sounds.map((sound) => sound.duration),
      fps,
    ),
    sounds,
  };
}

export function estimateCanvasScene(scene, fps) {
  if (!scene.beats.some((beat) => beat.visual_cues?.length)) {
    return makeSceneTimeline(
      scene,
      scene.beats.map((beat) => beat.say.split(/\s+/).length / 2.5),
      fps,
    );
  }
  const timing = estimatedSceneWithWords(scene, fps);
  return { ...timing, visualCues: resolveSceneCues(scene, timing), cueTiming: 'estimated-words' };
}

export function makeLessonTimeline(scenes, leadIn = 0) {
  let cursor = leadIn;
  const captions = [];
  const positioned = scenes.map((scene) => {
    const start = cursor;
    for (const [i, sound] of scene.sounds.entries()) {
      captions.push(...wordCaptions(sound.words, start + scene.beats[i].start, scene.beats[i].say));
    }
    cursor += scene.duration;
    return {
      ...scene,
      start,
      visualCues: resolveSceneCues(scene, scene),
      cueTiming: 'provider-words',
    };
  });
  return { scenes: positioned, captions, duration: cursor };
}

const sampledTimelines = new WeakMap();

function animationFor(timeline) {
  let animation = sampledTimelines.get(timeline);
  if (animation) return animation;
  const beatTrack = [
    { type: 'hold', duration: 400 },
    ...timeline.beats.map((beat, i) => ({
      type: 'tween',
      to: i + 1,
      duration: (beat.until - beat.start) * 1000,
      easing: 'linear',
    })),
  ];
  const tail = (timeline.duration - timeline.beats.at(-1).until) * 1000;
  beatTrack.push({ type: 'hold', duration: tail });
  animation = defineAnimation({
    initial: { position: 0, opacity: 0 },
    fps: Math.min(timeline.fps ?? 30, 50),
    timeline: [
      {
        type: 'parallel',
        tracks: {
          position: beatTrack,
          opacity: [
            { type: 'tween', to: 1, duration: 350, easing: 'ease-in-out' },
            { type: 'hold', duration: timeline.duration * 1000 - 650 },
            { type: 'tween', to: 0, duration: 300, easing: 'ease-in-out' },
          ],
        },
      },
    ],
    render: () => null,
  });
  sampledTimelines.set(timeline, animation);
  return animation;
}

export function frameState(timeline, t, sceneIndex, sceneCount) {
  const { position, opacity } = sampleAnimation(animationFor(timeline), t * 1000);
  const beat = Math.min(Math.floor(position), timeline.beats.length - 1);
  const bound = (v) => Math.max(0, Math.min(1, v));
  return {
    p: bound(t / timeline.duration),
    t,
    duration: timeline.duration,
    beat,
    opacity,
    beatP: bound(position - beat),
    holdTime: t - timeline.beats[beat].end,
    sceneIndex,
    sceneCount,
    width: 1920,
    height: 1080,
    ...(timeline.visualCues
      ? { cues: sampleNarrationCues(timeline.visualCues, t), cueTiming: timeline.cueTiming }
      : {}),
  };
}

export function wordCaptions(words, offset = 0, transcript = '') {
  // Edge's word events omit punctuation in some voices. Restore punctuation
  // only when the original script and timed words have the same letter stream.
  const normalized = (value) => value.toLocaleLowerCase('en').replace(/[^\p{L}\p{N}]/gu, '');
  if (
    transcript &&
    normalized(transcript) === normalized(words.map((word) => word.text).join(' '))
  ) {
    let cursor = 0;
    const punctuation = new Map();
    for (const token of transcript.split(/\s+/)) {
      cursor += normalized(token).length;
      const suffix = token.match(/[.,!?;:]+["')\]]*$/)?.[0];
      if (suffix) punctuation.set(cursor, suffix);
    }
    cursor = 0;
    words = words.map((word) => {
      cursor += normalized(word.text).length;
      const suffix = punctuation.get(cursor);
      return suffix
        ? { ...word, text: word.text.replace(/[.,!?;:]+["')\]]*$/, '') + suffix }
        : word;
    });
  }
  const captions = [];
  let group = [];
  const flush = () => {
    if (!group.length) return;
    captions.push({
      start: offset + group[0].start,
      end: offset + group.at(-1).end,
      text: group.map((w) => w.text).join(' '),
    });
    group = [];
  };
  for (const [i, word] of words.entries()) {
    if (!Number.isFinite(word.start) || !Number.isFinite(word.end) || word.end < word.start)
      throw new Error('Invalid word boundary');
    if (
      group.length &&
      (group.map((w) => w.text).join(' ').length + word.text.length > 76 ||
        word.end - group[0].start > 4.5)
    ) {
      const previous = group.at(-1);
      const finishesPhrase = i === words.length - 1 || /[.!?]$/.test(word.text);
      const keepPair =
        finishesPhrase &&
        group.length >= 3 &&
        previous.text.length + 1 + word.text.length <= 76 &&
        word.end - previous.start <= 4.5;
      if (keepPair) group.pop();
      flush();
      if (keepPair) group.push(previous);
    }
    group.push(word);
    if (/[.!?]$/.test(word.text)) flush();
  }
  flush();
  return captions;
}

export function timestamp(seconds, separator = ',') {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const pad = (n, width = 2) => String(n).padStart(width, '0');
  return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)}${separator}${pad(ms % 1000, 3)}`;
}

export const srt = (captions) =>
  captions
    .map((c, i) => `${i + 1}\n${timestamp(c.start)} --> ${timestamp(c.end)}\n${c.text}\n`)
    .join('\n');
export const vtt = (captions) =>
  `WEBVTT\n\n${captions.map((c) => `${timestamp(c.start, '.')} --> ${timestamp(c.end, '.')}\n${c.text}\n`).join('\n')}`;
