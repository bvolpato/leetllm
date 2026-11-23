// A narrated lesson is a stage lesson whose film is a narrated film of Vizmatic. The course keeps
// its lesson file, its cue ids, its scene timing, its palette and its two gates. The library gives
// the shell that opens and closes each scene, the kit, the layout, and show, hide and swap.
//
// Each part that the library is going to have has a comment that starts with "LIBRARY:". Remove
// the part when the library has it. A scene file does not change then, because the clock of a
// scene here has the calls that the clock of the library is going to have.
import * as stage from 'vizmatic/stage';
import { lexicalTokens } from './captions.mjs';

const { LOOKS, Node, compileFilm, text } = stage;
const slug = /^[a-z][a-z0-9-]*$/;

/** The course gives each scene this time before its first word. See `makeSceneTimeline`. */
const SCENE_LEAD = 0.4;
/** A scene that is not the last one fades until this long after its end, as the shell does. */
const CLOSE_OVERRUN = 0.021;
/** Two times that are nearer than this are one time. */
const SAME_TIME = 1e-3;
/** A change of `show`, `hide` and `swap` starts this long before its phrase, in the library. */
const CUE_LEAD = 0.1;
/** A node with less opacity than this is not on the screen for a viewer. */
const SEEN_LEAST = 0.01;

/** The nodes of a node, a block of the layout, or a list of them. An animation has none. */
function nodesOf(items) {
  if (items instanceof Node) return [items];
  if (Array.isArray(items)) return items.flatMap(nodesOf);
  return Array.isArray(items?.nodes) ? items.nodes : [];
}

/** True when a viewer sees a node at a time, by the timeline as it is now. */
function seenAt(node, time) {
  if (!node.mounted) return false;
  for (let up = node; up; up = up.parent) {
    const visible = up.tracks?.get('visible');
    if (!(visible ? visible.sample(time) : up.base.visible)) return false;
  }
  const opacity = node.tracks?.get('opacity');
  return (opacity ? opacity.sample(time) : node.base.opacity) > SEEN_LEAST;
}

/**
 * The palette of the course as a look of Vizmatic. A scene writes a color by its name in the
 * course, which is also its name in the cues of a lesson file: cyan, blue, yellow, pink, green
 * and red. The other names of the midnight look stay: ink, dim, faint, surface, grid.
 */
// LIBRARY: the midnight look has no name for the blue of the course, and its `blue` is the cyan
// of the course. This look stays until the library has both names.
export const LESSON_LOOK = Object.freeze({
  ...LOOKS.midnight,
  name: 'leetllm',
  colors: Object.freeze({ ...LOOKS.midnight.colors, cyan: '#5cc4f0', blue: '#7fa8ff' }),
});

/**
 * Define a narrated lesson: `narratedLesson({ id, scenes: { intro, 'squared-vs-ce': squaredVsCe } })`.
 * A scene is a function `(s, c, film)`, as in a narrated film of Vizmatic. `c` is the clock of the
 * scene, and a cue is the id of a cue that the lesson file declares.
 */
export function narratedLesson({ id, scenes, options = {} }) {
  if (!slug.test(id ?? '')) throw new TypeError('narratedLesson: id must be a lowercase slug');
  if (!scenes || typeof scenes !== 'object' || Array.isArray(scenes))
    throw new TypeError(`${id}: scenes must be an object with one function for each scene id`);
  for (const [scene, build] of Object.entries(scenes)) {
    if (!slug.test(scene))
      throw new TypeError(`${id}: the scene id ${scene} must be a lowercase slug`);
    if (typeof build !== 'function') throw new TypeError(`${id}/${scene}: a scene is a function`);
  }
  return Object.freeze({
    kind: 'leetllm.narrated-lesson',
    id,
    scenes: Object.freeze({ ...scenes }),
    options: Object.freeze({ ...options }),
  });
}

export function isNarratedLesson(value) {
  return value?.kind === 'leetllm.narrated-lesson';
}

/** The words of a text as the lesson file counts them, joined by one space. */
const spoken = (value) => lexicalTokens(value).join(' ');

/**
 * The timing of a narrated film, from a timeline of the course: estimated, or measured speech.
 * A scene of the course starts 0.4 seconds before its first word and ends 0.3 seconds after its
 * last hold, on a whole frame. The library has one gap between scenes. So the gap is 0.4 seconds,
 * and the last hold of each scene takes the rest of the scene. The film then has the scene
 * windows of `sceneWindows`, and it ends with its narration.
 */
export function narratedTiming(lesson, timeline) {
  const lastScene = timeline.scenes.length - 1;
  return {
    intro: 0,
    lead: SCENE_LEAD,
    gap: SCENE_LEAD,
    tail: 0,
    scenes: timeline.scenes.map((scene, sceneIndex) => {
      const lastBeat = scene.beats.length - 1;
      if (Math.abs(scene.beats[0].start - SCENE_LEAD) > SAME_TIME)
        throw new Error(`${lesson.id}/${scene.id}: the first word must start at ${SCENE_LEAD} s`);
      return {
        id: scene.id,
        title: lesson.scenes[sceneIndex].title,
        beats: scene.beats.map((beat, index) => {
          const sound =
            scene.sounds?.find((entry) => entry.beatIndex === index) ?? scene.sounds?.[index];
          if (!sound?.words?.length)
            throw new Error(`${lesson.id}/${scene.id}: beat ${index} has no timed words`);
          // The film ends one gap after the last hold of the last scene, so that hold is one gap shorter.
          const rest = scene.duration - beat.end - (sceneIndex === lastScene ? SCENE_LEAD : 0);
          const hold = index === lastBeat ? rest : beat.until - beat.end;
          if (hold < 0)
            throw new Error(
              `${lesson.id}/${scene.id}: the last beat of the lesson needs a hold of 0.1 s or more`,
            );
          return {
            say: beat.say,
            duration: beat.duration,
            hold,
            // LIBRARY: the library finds a phrase by its ASCII letters, and the course by the letters
            // and digits of any script. The words in the form of the course make the two agree.
            words: sound.words.map((word) => ({ ...word, text: spoken(word.text) })),
          };
        }),
      };
    }),
  };
}

/** The cues that the lesson file declares for a scene, with their times on the clock of the film. */
function declaredCues(scene, timing, offset) {
  const cues = new Map();
  for (const [beat, entry] of scene.beats.entries()) {
    for (const cue of entry.visual_cues ?? []) {
      const resolved = timing.visualCues?.find((other) => other.id === cue.id);
      if (!resolved)
        throw new Error(`${scene.id}/${cue.id}: the timeline has no time for this cue`);
      cues.set(cue.id, {
        id: cue.id,
        phrase: cue.phrase,
        words: spoken(cue.phrase),
        beat,
        start: offset + resolved.start,
        end: offset + resolved.end,
        data: { targets: cue.targets, color: cue.color, linger: cue.linger },
      });
    }
  }
  return cues;
}

/**
 * The clock of one scene. It is the clock of a narrated film of Vizmatic, and a cue is an id of
 * the lesson file: `c.show('mass-raise', nodes)`. An index of a beat is a cue too. The option
 * `after: true` starts a change when the voice has said the whole phrase, for a result.
 */
// LIBRARY: declared cue ids, with `c.cue(id)`, and the option `after` of show, hide and swap. When
// the library has them, give the cues in the timing and hand the clock of the library to a scene.
class LessonClock {
  #clock;
  #cues;
  #used;
  #before;

  constructor(clock, scene, cues, used, before = new Set()) {
    this.#clock = clock;
    this.#cues = cues;
    this.#used = used;
    /** The nodes that were on the stage before this scene put its own there. */
    this.#before = before;
    /** The title of the scene in the lesson file, for `heading(c.title)`. */
    this.title = scene.title;
    // Every declared cue has one time. The library and the course must find it at the same words.
    for (const cue of cues.values()) {
      const said = this.#guard(() => clock.cue(cue.words, cue.beat));
      if (Math.abs(said.start - cue.start) > SAME_TIME || Math.abs(said.end - cue.end) > SAME_TIME)
        throw new Error(
          `${scene.id}/${cue.id}: the library finds the phrase at ${said.start.toFixed(2)} s and the course at ${cue.start.toFixed(2)} s. Use a phrase with plain words`,
        );
    }
  }

  get stage() {
    return this.#clock.stage;
  }
  get id() {
    return this.#clock.id;
  }
  get start() {
    return this.#clock.start;
  }
  get end() {
    return this.#clock.end;
  }
  get next() {
    return this.#clock.next;
  }
  get beats() {
    return this.#clock.beats;
  }
  get window() {
    return this.#clock.window;
  }
  /** The cues that the lesson file declares for this scene, in the order of the file. */
  get cues() {
    return [...this.#cues.values()].map(({ id, phrase, beat }) => ({ id, phrase, beat }));
  }

  /** Run a call of the library. An error names the cue id in place of the spoken phrase. */
  #guard(call) {
    try {
      return call();
    } catch (error) {
      // The compiler throws a value that is not an error while an asset loads. It must pass.
      if (!(error instanceof Error)) throw error;
      for (const cue of this.#cues.values())
        error.message = error.message.replaceAll(`"${cue.words}"`, `the cue "${cue.id}"`);
      throw error;
    }
  }

  #declared(id) {
    if (typeof id === 'number')
      throw new Error(
        `scene "${this.id}": this call takes a cue id, and it got the beat ${id}. For the start of a beat, use c.onBeat(${id}, build). Only show, hide, swap and swapAll take the index of a beat`,
      );
    const cue = this.#cues.get(id);
    if (!cue) {
      const ids = [...this.#cues.keys()].join(', ') || 'none';
      throw new Error(
        `scene "${this.id}": the lesson file declares no cue "${id}" for this scene. Its cues are: ${ids}. A cue is one of these ids, or the index of a beat. For a new moment, declare a cue in lesson.yaml`,
      );
    }
    this.#used.add(`${this.id}/${id}`);
    return cue;
  }

  /** The cue and the options of a call of the library, for a cue id or the index of a beat. */
  #translate(cue, options = {}) {
    const { after, ...rest } = options;
    if (typeof cue !== 'string') {
      const beat = this.beats[cue];
      if (!after || !beat) return [cue, rest];
      return [cue, { ...rest, lead: (rest.lead ?? 0) - (beat.end - beat.start) }];
    }
    const declared = this.#declared(cue);
    if (rest.beat !== undefined)
      throw new Error(
        `scene "${this.id}": the cue "${cue}" has its beat. Leave the option beat out`,
      );
    const lead = after ? (rest.lead ?? 0) - (declared.end - declared.start) : rest.lead;
    return [
      declared.words,
      { ...rest, beat: declared.beat, ...(lead === undefined ? {} : { lead }) },
    ];
  }

  /** When the voice says a cue, in film seconds, with its id, its phrase, its beat and its data. */
  cue(id) {
    const { words, beat, phrase, data } = this.#declared(id);
    return { ...this.#guard(() => this.#clock.cue(words, beat)), id, phrase, beat, data };
  }

  show(cue, items, options) {
    const [at, translated] = this.#translate(cue, options);
    this.#guard(() => this.#clock.show(at, items, translated));
    return this;
  }

  hide(cue, items, options) {
    const [at, translated] = this.#translate(cue, options);
    this.#guard(() => this.#clock.hide(at, items, translated));
    return this;
  }

  swap(cue, out, into, options) {
    const [at, translated] = this.#translate(cue, options);
    this.#guard(() => this.#clock.swap(at, out, into, translated));
    return this;
  }

  /**
   * Change the whole picture at a cue: `c.swapAll(1, next, { keep: [title, board] })`. Every node
   * that the scene has on the screen then leaves, and `into` arrives, as in `swap`. `keep` names
   * what stays. A node of `into` that shows already stays too. The call sees what the lines above
   * it put on the screen, so write it after them. Without `into`, the picture only leaves.
   */
  // LIBRARY: a swap of the whole picture of a scene. Remove this when the clock of the library has it.
  swapAll(cue, into = [], options = {}) {
    const { keep = [], ...rest } = options;
    const [at, translated] = this.#translate(cue, rest);
    const spoken = typeof cue === 'string' ? this.#cues.get(cue) : this.beats[cue];
    if (!spoken) throw new Error(`scene "${this.id}" has no beat ${cue}`);
    const lead = rest.lead ?? (rest.after ? 0 : CUE_LEAD);
    const time = Math.max(this.window.from, (rest.after ? spoken.end : spoken.start) - lead);
    const arriving = nodesOf(into);
    const stays = [...nodesOf(keep), ...arriving];
    // A node stays when the scene keeps it, or when it holds a node that the scene keeps.
    const held = (node) =>
      stays.some((kept) => {
        for (let up = kept; up; up = up.parent) if (up === node) return true;
        return false;
      });
    const out = this.stage.root.children.filter(
      (node) => !this.#before.has(node) && !held(node) && seenAt(node, time),
    );
    const shown = arriving.filter((node) => seenAt(node, time));
    const given = Array.isArray(into) ? into.length > 0 : Boolean(into);
    // A list whose nodes all show already has nothing to bring.
    const brings = given && !(arriving.length > 0 && shown.length === arriving.length);
    const withShown = shown.length ? { ...translated, skipShown: true } : translated;
    this.#guard(() => {
      if (out.length && brings) this.#clock.swap(at, out, into, withShown);
      else if (out.length) this.#clock.hide(at, out, translated);
      else if (brings) this.#clock.show(at, into, withShown);
    });
    return this;
  }

  /** Build when the voice starts a cue, for a play of the scene's own. */
  on(id, build, offset = 0) {
    const { words, beat } = this.#declared(id);
    this.#guard(() => this.#clock.on(words, build, offset, beat));
    return this;
  }

  /** Build when the voice has said a cue. */
  after(id, build, offset = 0) {
    const { words, beat } = this.#declared(id);
    this.#guard(() => this.#clock.after(words, build, offset, beat));
    return this;
  }

  onBeat(index, build, offset = 0) {
    this.#clock.onBeat(index, build, offset);
    return this;
  }

  at(seconds, build) {
    this.#clock.at(seconds, build);
    return this;
  }

  clear(...rest) {
    this.#clock.clear(...rest);
    return this;
  }

  keep(nodes) {
    this.#clock.keep(nodes);
    return this;
  }

  take(nodes, setup) {
    this.#clock.take(nodes, setup);
    return this;
  }
}

/** Stop when a play of a scene ends after the scene: the film would run past its narration. */
// LIBRARY: the error for a film that runs past its narration, scene by scene.
function checkPlays(id, plays, limit) {
  const late = plays.reduce((worst, clip) => (clip.t1 > (worst?.t1 ?? limit) ? clip : worst), null);
  if (!late) return;
  const name = [...new Set(late.labels)].filter(Boolean).join(' and ') || 'an animation';
  throw new Error(
    `scene "${id}": the play of ${name} that starts at ${late.t0.toFixed(2)} s ends at ${late.t1.toFixed(2)} s, and the scene ends at ${limit.toFixed(2)} s. The film would run past its narration. Give the play a shorter duration, or start it on an earlier cue`,
  );
}

/** A scene that the lesson does not define yet: its title and one line. A draft compiles with it. */
function pendingScene(scene) {
  return (s) => {
    s.add(text(scene.title, { size: 58 }).at(0, -40));
    s.add(text('This scene is not rebuilt yet.', { size: 40, color: 'dim' }).at(0, 60));
  };
}

/**
 * Compile a narrated lesson against a timeline of the course. Two gates of the course stop the
 * compile: a cue that the lesson file declares and no scene uses, and a film that runs past its
 * narration. `overrides.only` is a list of scene ids for a draft of some scenes. The result names
 * the scenes that the lesson does not define yet, and a caller that needs a whole film stops there.
 */
export async function compileNarratedLesson(definition, lesson, timeline, overrides = {}) {
  if (typeof stage.narrated !== 'function')
    throw new Error(
      'Narrated lessons require a development build of Vizmatic main. See videos/CI_COMPATIBILITY.md. The published runtime still supports legacy lessons.',
    );
  if (stage.firstSceneTransitions?.cut !== 'cut')
    throw new Error(
      `${lesson.id}: the first lesson frame requires a Vizmatic runtime with firstSceneTransitions.cut`,
    );
  if (!isNarratedLesson(definition))
    throw new Error(`${lesson.id}: the film module must export narratedLesson(...) as its default`);
  if (definition.id !== lesson.id)
    throw new Error(`${lesson.id}: the film module belongs to the lesson ${definition.id}`);
  const { only, ...compileOverrides } = overrides;
  const ids = lesson.scenes.map((scene) => scene.id);
  const unknown = [...Object.keys(definition.scenes), ...(only ?? [])].filter(
    (id) => !ids.includes(id),
  );
  if (unknown.length)
    throw new Error(
      `${lesson.id}: the lesson file has no scene ${unknown.join(', ')}. Its scenes are: ${ids.join(', ')}`,
    );

  const origin = timeline.scenes[0].start;
  const last = timeline.scenes.at(-1);
  const duration = last.start + last.duration - origin;
  const declared = [],
    used = new Set(),
    built = new Set(),
    pending = [];
  const scenes = {};
  for (const [index, scene] of lesson.scenes.entries()) {
    const build = definition.scenes[scene.id];
    if (!build) {
      pending.push(scene.id);
      scenes[scene.id] = pendingScene(scene);
      continue;
    }
    const timing = timeline.scenes[index];
    const cues = declaredCues(scene, timing, timing.start - origin);
    declared.push(...[...cues.keys()].map((cue) => `${scene.id}/${cue}`));
    scenes[scene.id] = (s, clock, film) => {
      built.add(scene.id);
      const first = s.clips.length;
      build(s, new LessonClock(clock, scene, cues, used, new Set(s.root.children)), film);
      const lastScene = index === lesson.scenes.length - 1;
      checkPlays(
        scene.id,
        s.clips.slice(first),
        lastScene ? film.end + SAME_TIME : clock.end + CLOSE_OVERRUN,
      );
    };
  }

  // The library reads the scenes of a draft from the environment, at the call of `narrated`.
  const before = process.env.VIZMATIC_SCENES;
  if (only?.length) process.env.VIZMATIC_SCENES = only.join(',');
  let film;
  try {
    film = stage.narrated({
      title: lesson.title,
      description: lesson.title,
      fps: timeline.fps,
      bleed: true,
      bloom: 0.12,
      look: LESSON_LOOK,
      ...definition.options,
      firstSceneTransition: stage.firstSceneTransitions.cut,
      imageNetwork: 'deny',
      // The course joins its brand intro as a movie of its own, and writes its own captions and chapters.
      intro: false,
      narration: { captions: false, chapters: false },
      timing: narratedTiming(lesson, timeline),
      scenes,
    });
  } finally {
    if (before === undefined) delete process.env.VIZMATIC_SCENES;
    else process.env.VIZMATIC_SCENES = before;
  }
  const compiled = await compileFilm(film, {
    fps: timeline.fps,
    ...compileOverrides,
    imageNetwork: 'deny',
  });

  // LIBRARY: the error for a film that runs past its narration.
  if (compiled.duration > duration + 1 / timeline.fps)
    throw new Error(
      `${lesson.id}: the film runs to ${compiled.duration.toFixed(2)}s, past its narration at ${duration.toFixed(2)}s`,
    );
  // LIBRARY: the error for a declared cue that drives nothing.
  const unused = declared.filter((id) => built.has(id.split('/')[0]) && !used.has(id));
  if (unused.length)
    throw new Error(
      `${lesson.id}: these narration cues drive nothing, so the film and script have drifted: ${unused.join(', ')}. Use each one in its scene, such as c.show('${unused[0].split('/')[1]}', nodes), or remove it from lesson.yaml`,
    );
  return { compiled, duration, pending, built: ids.filter((id) => built.has(id)) };
}
