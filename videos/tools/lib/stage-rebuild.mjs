// What the two tools of a rebuilt lesson share: find the lesson, compile it on estimated timing,
// and name the moments at which the picture rests. No speech and no render. See
// stage-lessons/REBUILD.md.
import { existsSync, realpathSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { makeLessonTimeline, makeSceneTimeline, readLesson } from '../../lib/lesson.mjs';
import { compileNarratedLesson } from '../../lib/narrated-lesson.mjs';
import { estimatedTimeline, sceneWindows } from '../../lib/stage-lesson.mjs';

export const videos = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const root = resolve(videos, '..');

/** The folder of a rebuilt lesson: its narration, its index and its scenes. */
export const lessonFolder = (id) => join(videos, 'stage-lessons', id);

/** Review the draft in its folder or the promoted script used by the production renderer. */
export function rebuildScript(id) {
  const draft = join(lessonFolder(id), 'lesson.yaml');
  const published = join(videos, 'stage-lessons', `${id}.lesson.yaml`);
  if (existsSync(draft) && existsSync(published) && realpathSync(draft) !== realpathSync(published))
    throw new Error(`${id}: found two stage scripts. Keep one source before editing cues.`);
  if (existsSync(draft)) return draft;
  if (existsSync(join(lessonFolder(id), 'index.mjs')) && existsSync(published)) return published;
  throw new Error(`${id}: no draft or promoted narrated lesson script was found.`);
}

/** Each output of the tools is under this folder, in a folder of its lesson. */
export const scratchFolder = (id) =>
  join(process.env.LEETLLM_REBUILD_OUT ?? '/tmp/leetllm-rebuild', id);

/** The arguments of a tool: the lesson id first, then `--name value` pairs and flags. */
export function parseArguments(argv, { values = [], flags = [] }) {
  const options = {},
    rest = [];
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (values.includes(arg)) {
      if (argv[index + 1] === undefined) throw new Error(`${arg} needs a value`);
      options[arg.slice(2)] = argv[++index];
    } else if (flags.includes(arg)) options[arg.slice(2)] = true;
    else if (arg.startsWith('--'))
      throw new Error(
        `Unknown option ${arg}. The options are: ${[...values, ...flags].join(', ')}`,
      );
    else rest.push(arg);
  }
  if (rest.length !== 1) throw new Error('Give one lesson id, such as: softmax');
  return { id: rest[0], options };
}

const list = (value) =>
  value
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : undefined;

/** The sentences of the rebuilt lesson that differ from the lesson file of the course. */
function narrationChanges(lesson, original) {
  const changes = [];
  const before = new Map(original.scenes.map((scene) => [scene.id, scene]));
  if (
    lesson.scenes.map((scene) => scene.id).join() !==
    original.scenes.map((scene) => scene.id).join()
  )
    changes.push({ where: 'scenes', old: 'the order or the ids of the scenes', new: 'changed' });
  for (const scene of lesson.scenes) {
    const old = before.get(scene.id);
    if (!old) continue;
    if (old.title !== scene.title)
      changes.push({ where: `${scene.id} title`, old: old.title, new: scene.title });
    if (old.beats.length !== scene.beats.length)
      changes.push({
        where: scene.id,
        old: `${old.beats.length} beats`,
        new: `${scene.beats.length} beats`,
      });
    for (const [index, beat] of scene.beats.entries()) {
      const was = old.beats[index];
      if (!was) continue;
      if (was.say !== beat.say)
        changes.push({ where: `${scene.id} beat ${index}`, old: was.say, new: beat.say });
      if ((was.hold ?? 0.45) !== (beat.hold ?? 0.45))
        changes.push({
          where: `${scene.id} beat ${index} hold`,
          old: was.hold ?? 0.45,
          new: beat.hold ?? 0.45,
        });
    }
  }
  return changes;
}

/** Resolve today's visual cues against the recorded words and durations of the same script. */
export function recordedTimeline(lesson, recorded) {
  if (recorded.id !== lesson.id || recorded.scenes?.length !== lesson.scenes.length)
    throw new Error(`The recorded timeline does not match the scenes of ${lesson.id}.`);
  const fps = recorded.fps;
  if (!Number.isInteger(fps) || fps <= 0 || fps > 60 || !recorded.provider)
    throw new Error(`${lesson.id}: expected a timeline from the audio renderer.`);
  const scenes = lesson.scenes.map((scene, index) => {
    const previous = recorded.scenes[index];
    if (
      previous.id !== scene.id ||
      previous.beats.length !== scene.beats.length ||
      previous.sounds?.length !== scene.beats.length
    )
      throw new Error(`${scene.id}: recorded scenes or beats differ from the lesson.`);
    const sounds = scene.beats.map((beat, i) => {
      const sound = previous.sounds[i];
      if (previous.beats[i].say !== beat.say || sound.beatIndex !== i || !sound.words?.length)
        throw new Error(
          `${scene.id}, beat ${i}: the recording does not match the current narration.`,
        );
      return sound;
    });
    return {
      ...makeSceneTimeline(
        scene,
        sounds.map((sound) => sound.duration),
        fps,
      ),
      sounds,
    };
  });
  return { fps, ...makeLessonTimeline(scenes, recorded.intro?.duration ?? 0) };
}

/** Compile the selected scenes or the whole lesson. The production renderer checks coverage. */
export async function compileRebuild(id, { scenes, fps = 30, timelineFile } = {}) {
  const folder = lessonFolder(id);
  const lessonFile = rebuildScript(id),
    indexFile = join(folder, 'index.mjs');
  if (!existsSync(lessonFile) || !existsSync(indexFile))
    throw new Error(
      `No rebuilt lesson at videos/stage-lessons/${id}: it needs a stage lesson script and index.mjs. See videos/stage-lessons/REBUILD.md`,
    );
  const lesson = await readLesson(lessonFile, root);
  if (lesson.id !== id)
    throw new Error(`${lessonFile}: the id is ${lesson.id}, and the folder is ${id}`);
  const originalFile = join(videos, 'lessons', `${id}.lesson.yaml`);
  const changes = existsSync(originalFile)
    ? narrationChanges(lesson, await readLesson(originalFile, root))
    : [];
  // A motion_check is a part of the old canvas film: a region of its frame. No tool of the rebuild reads it.
  const motionChecks = lesson.scenes.flatMap((scene) =>
    scene.beats.flatMap((beat, index) => (beat.motion_check ? [`${scene.id}/${index}`] : [])),
  );
  const timeline = timelineFile
    ? recordedTimeline(lesson, JSON.parse(await readFile(timelineFile, 'utf8')))
    : estimatedTimeline(lesson, fps);
  const { default: definition } = await import(pathToFileURL(indexFile).href);
  const only = list(scenes);
  const result = await compileNarratedLesson(definition, lesson, timeline, { only });
  const windows = sceneWindows(timeline).map((window, index) => ({
    ...window,
    index,
    built: result.built.includes(window.id),
  }));
  return { id, lesson, timeline, changes, motionChecks, windows, ...result };
}

/**
 * The moments at which the picture of each built scene rests: the end of each beat, and the
 * moment before each cue that comes 1.2 seconds or more after the cue before it. These are the
 * moments that `render.mjs` checks.
 */
export function restMoments(timeline, windows) {
  return timeline.scenes.flatMap((scene, index) => {
    if (!windows[index].built) return [];
    const cues = (scene.visualCues ?? []).map((cue) => cue.start).sort((a, b) => a - b);
    const rests = cues
      .slice(1)
      .map((start, k) => [cues[k], start])
      .filter(([from, to]) => to - from > 1.2)
      .map(([, to]) => to - 0.05);
    return [...scene.beats.map((beat) => beat.until - 0.04), ...rests].map(
      (time) => windows[index].from + time,
    );
  });
}

/** The scene of a time of the film, and the time from the start of that scene. */
export function sceneAt(windows, time) {
  const window = windows.find((entry) => time >= entry.from && time < entry.to) ?? windows.at(-1);
  return { window, seconds: time - window.from };
}
