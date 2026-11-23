// A stage lesson is one continuous vector film that follows measured narration. Objects can
// carry across scenes, and each animation can land on a spoken word. Audio, captions, frame
// review, and delivery stay in the shared pipeline in render.mjs.
import { Resvg } from '@resvg/resvg-js';
import { compileFilm, film, isFilm } from 'vizmatic/stage';
import { estimatedSceneWithWords, makeLessonTimeline } from './lesson.mjs';
import { compileNarratedLesson, isNarratedLesson } from './narrated-lesson.mjs';

/** Files that decide a stage lesson's picture, in hash order. Packaging checks the same list. */
export function stageSourceFiles(id) {
  return [
    `stage-lessons/${id}.lesson.yaml`,
    `stage-lessons/${id}.film.mjs`,
    'render.mjs',
    'lib/stage-lesson.mjs',
    'stage-lessons/kit.mjs',
    'lib/fonts.mjs',
    'lib/lesson.mjs',
    'lib/narration-cues.mjs',
    'lib/captions.mjs',
    'lib/delivery.mjs',
    'lib/brand.mjs',
    'lib/frame-audit.mjs',
    'lib/layout-review.mjs',
    'assets/leetllm-mark.svg',
    'package-lock.json',
  ];
}

/** Define a stage lesson. `build(s, narration)` authors the film against the narration clock. */
export function stageLesson(options, build) {
  if (typeof options === 'function') {
    build = options;
    options = {};
  }
  if (typeof build !== 'function') throw new Error('stageLesson needs a build function');
  return Object.freeze({ kind: 'leetllm.stage-lesson', options, build });
}

export function isStageLesson(value) {
  return value?.kind === 'leetllm.stage-lesson';
}

class SceneClock {
  constructor(stage, timing, offset, used) {
    this.stage = stage;
    this.id = timing.id;
    this.start = offset;
    this.duration = timing.duration;
    this.end = offset + timing.duration;
    this.beats = timing.beats.map((beat) => ({
      start: offset + beat.start,
      end: offset + beat.end,
      until: offset + beat.until,
      duration: beat.end - beat.start,
    }));
    this.cues = new Map(
      (timing.visualCues ?? []).map((cue) => [
        cue.id,
        {
          ...cue,
          start: offset + cue.start,
          end: offset + cue.end,
          span: Math.max(0.2, cue.end - cue.start),
        },
      ]),
    );
    this.used = used;
  }

  beat(index) {
    const beat = this.beats[index];
    if (!beat) throw new Error(`Scene ${this.id} has no beat ${index}`);
    return beat;
  }

  cue(id) {
    const cue = this.cues.get(id);
    if (!cue)
      throw new Error(
        `Scene ${this.id} has no cue ${id}. Cues: ${[...this.cues.keys()].join(', ')}`,
      );
    this.used.add(`${this.id}/${id}`);
    return cue;
  }

  /** Spoken length of a cue, for an animation that should last as long as the phrase. */
  span(id) {
    return this.cue(id).span;
  }

  /** Author at the moment a phrase starts. An offset moves the start in seconds. */
  on(id, build, offset = 0) {
    this.stage.at(this.cue(id).start + offset, build);
    return this;
  }

  /** Author when a phrase finishes. */
  after(id, build, offset = 0) {
    this.stage.at(this.cue(id).end + offset, build);
    return this;
  }

  /** Author at the start of a beat. */
  onBeat(index, build, offset = 0) {
    this.stage.at(this.beat(index).start + offset, build);
    return this;
  }

  /** Author at a time measured from the start of the scene. */
  at(seconds, build) {
    this.stage.at(this.start + seconds, build);
    return this;
  }
}

class NarrationClock {
  constructor(stage, lesson, timeline) {
    this.stage = stage;
    this.lesson = lesson;
    this.used = new Set();
    const origin = timeline.scenes[0].start;
    this.scenes = new Map(
      timeline.scenes.map((timing) => [
        timing.id,
        new SceneClock(stage, timing, timing.start - origin, this.used),
      ]),
    );
    const last = timeline.scenes.at(-1);
    this.duration = last.start + last.duration - origin;
  }

  scene(id) {
    const scene = this.scenes.get(id);
    if (!scene)
      throw new Error(
        `Lesson ${this.lesson.id} has no scene ${id}. Scenes: ${[...this.scenes.keys()].join(', ')}`,
      );
    return scene;
  }

  title(id) {
    return this.lesson.scenes.find((scene) => scene.id === id)?.title ?? '';
  }

  declaredCues() {
    return [...this.scenes.values()].flatMap((scene) =>
      [...scene.cues.keys()].map((cue) => `${scene.id}/${cue}`),
    );
  }
}

/** Timing from word counts, so a film can compile and be reviewed with no speech. */
export function estimatedTimeline(lesson, fps = 30) {
  const scenes = lesson.scenes.map((scene) => estimatedSceneWithWords(scene, fps));
  return {
    id: lesson.id,
    fps,
    intro: { duration: 0, frames: 0, fps },
    ...makeLessonTimeline(scenes, 0),
    estimated: true,
  };
}

/** Compile a lesson's film against a timeline. Every declared cue must drive something. */
export async function compileStageLesson(definition, lesson, timeline, overrides = {}) {
  // A rebuilt lesson is a narrated film of Vizmatic. See lib/narrated-lesson.mjs.
  if (isNarratedLesson(definition)) {
    const result = await compileNarratedLesson(definition, lesson, timeline, overrides);
    if (result.pending.length)
      throw new Error(
        `${lesson.id}: these scenes are not rebuilt yet: ${result.pending.join(', ')}`,
      );
    return result;
  }
  if (!isStageLesson(definition))
    throw new Error(`${lesson.id}: the film module must export stageLesson(...) as its default`);
  if (typeof definition.validate === 'function') definition.validate(lesson);
  let declared = [],
    used = new Set(),
    total = 0;
  const definitionFilm = film(
    {
      title: lesson.title,
      description: lesson.title,
      fps: timeline.fps,
      bleed: true,
      ...definition.options,
      imageNetwork: 'deny',
    },
    async (stage) => {
      const narration = new NarrationClock(stage, lesson, timeline);
      await definition.build(stage, narration);
      if (stage.duration > narration.duration + 1 / timeline.fps) {
        throw new Error(
          `${lesson.id}: the film runs to ${stage.duration.toFixed(2)}s, past its narration at ${narration.duration.toFixed(2)}s`,
        );
      }
      stage.at(narration.duration, () => {});
      declared = narration.declaredCues();
      used = narration.used;
      total = narration.duration;
    },
  );
  if (!isFilm(definitionFilm)) throw new Error('Could not define the stage film');
  const compiled = await compileFilm(definitionFilm, {
    fps: timeline.fps,
    ...overrides,
    imageNetwork: 'deny',
  });
  const unused = declared.filter((id) => !used.has(id));
  if (unused.length)
    throw new Error(
      `${lesson.id}: these narration cues drive nothing, so the film and script have drifted: ${unused.join(', ')}`,
    );
  return { compiled, duration: total };
}

export function stageOpeningHasPicture(compiled) {
  const { pixels } = new Resvg(compiled.svg(0), {
    fitTo: { mode: 'width', value: 480 },
    font: { loadSystemFonts: false },
  }).render();
  for (let offset = 4; offset < pixels.length; offset += 4) {
    if (
      pixels[offset] !== pixels[0] ||
      pixels[offset + 1] !== pixels[1] ||
      pixels[offset + 2] !== pixels[2] ||
      pixels[offset + 3] !== pixels[3]
    )
      return true;
  }
  return false;
}

/** Where each scene sits on the film's own clock, which starts after the brand intro. */
export function sceneWindows(timeline) {
  const origin = timeline.scenes[0].start;
  return timeline.scenes.map((scene) => ({
    id: scene.id,
    from: scene.start - origin,
    to: scene.start - origin + scene.duration,
  }));
}
