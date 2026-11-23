// @ts-check
import { stageLesson } from './stage-lesson.mjs';
import { validateVisualCues } from './narration-cues.mjs';

const slug = /^[a-z][a-z0-9-]*$/;

/** @param {unknown} value @param {string} label */
function requireId(value, label) {
  if (typeof value !== 'string' || !slug.test(value)) {
    throw new TypeError(`${label} must be a lowercase slug`);
  }
}

/**
 * @template {{ id: string, cues?: readonly string[] }} T
 * @param {string} id
 * @param {readonly T[]} scenes
 * @param {'draw' | 'build'} method
 * @returns {readonly Readonly<T>[]}
 */
function orderedScenes(id, scenes, method) {
  requireId(id, 'Lesson id');
  if (!Array.isArray(scenes) || scenes.length === 0) {
    throw new TypeError(`${id}: scenes must be a nonempty ordered array`);
  }

  const ids = new Set();
  return Object.freeze(
    scenes.map((scene) => {
      requireId(scene?.id, `${id}: scene id`);
      if (ids.has(scene.id)) throw new Error(`${id}: duplicate scene ${scene.id}`);
      ids.add(scene.id);
      if (typeof Reflect.get(scene, method) !== 'function') {
        throw new TypeError(`${id}/${scene.id}: ${method} must be a function`);
      }
      if (scene.cues !== undefined) {
        if (!Array.isArray(scene.cues)) {
          throw new TypeError(`${id}/${scene.id}: cues must be an array of cue IDs`);
        }
        const cues = new Set();
        for (const cue of scene.cues) {
          requireId(cue, `${id}/${scene.id}: cue id`);
          if (cues.has(cue)) throw new Error(`${id}/${scene.id}: duplicate cue ${cue}`);
          cues.add(cue);
        }
      }
      return Object.freeze({
        ...scene,
        ...(scene.cues === undefined ? {} : { cues: Object.freeze([...scene.cues]) }),
      });
    }),
  );
}

/**
 * @param {string} id
 * @param {readonly { id: string, cues?: readonly string[] }[]} scenes
 * @param {import('./lesson-definition.d.ts').LessonNarration} narration
 */
function validateNarration(id, scenes, narration) {
  if (narration?.id !== id) {
    throw new Error(`${id}: narration belongs to ${narration?.id ?? '(missing id)'}`);
  }
  if (!Array.isArray(narration.scenes)) {
    throw new TypeError(`${id}: narration needs an ordered scenes array`);
  }
  const actual = narration.scenes.map((scene) => scene.id);
  const expected = scenes.map((scene) => scene.id);
  if (actual.length !== expected.length || actual.some((value, i) => value !== expected[i])) {
    throw new Error(
      `${id}: scene order differs; definition [${expected.join(', ')}], narration [${actual.join(', ')}]`,
    );
  }
  for (const [i, scene] of scenes.entries()) {
    const declared = new Set(validateVisualCues(narration.scenes[i]).map((cue) => cue.id));
    for (const cue of scene.cues ?? []) {
      if (!declared.has(cue)) throw new Error(`${id}/${scene.id}: unknown narration cue ${cue}`);
    }
  }
}

/**
 * Compose ordinary scene functions without changing the audited Canvas draw signature.
 * @param {import('./lesson-definition.d.ts').CanvasLessonOptions} options
 * @returns {import('./lesson-definition.d.ts').CanvasLessonDefinition}
 */
export function defineCanvasLesson({ id, scenes, validateModel }) {
  const ordered = orderedScenes(id, scenes, 'draw');
  if (validateModel !== undefined && typeof validateModel !== 'function') {
    throw new TypeError(`${id}: validateModel must be a function`);
  }
  const byId = new Map(ordered.map((scene) => [scene.id, scene]));
  /** @param {import('./lesson-definition.d.ts').LessonNarration} narration */
  const validate = (narration) => validateNarration(id, ordered, narration);
  /** @type {import('./lesson-definition.d.ts').CanvasDraw} */
  const draw = (ctx, scene, state, api) => {
    const definition = byId.get(scene.id);
    if (!definition) throw new Error(`${id}: unknown scene ${scene.id}`);
    return definition.draw(ctx, scene, state, api);
  };
  return Object.freeze({
    kind: 'leetllm.canvas-lesson',
    id,
    scenes: ordered,
    validateModel,
    validate,
    draw,
  });
}

/**
 * Compose Stage scenes on the existing measured clock. Each scene owns its ordinary
 * build function; the composer adds no scheduler or implicit shared state.
 * @param {import('./lesson-definition.d.ts').StageLessonOptions} definition
 * @returns {import('./lesson-definition.d.ts').StageLessonDefinition}
 */
export function defineStageLesson({ id, scenes, options = {} }) {
  const ordered = orderedScenes(id, scenes, 'build');
  /** @param {import('./lesson-definition.d.ts').LessonNarration} narration */
  const validate = (narration) => validateNarration(id, ordered, narration);
  /** @type {import('./lesson-definition.d.ts').StageLessonDefinition['build']} */
  const build = async (stage, narration) => {
    validate(narration.lesson);
    for (const [i, scene] of ordered.entries()) {
      await scene.build(stage, narration.scene(scene.id), narration.lesson.scenes[i]);
    }
  };
  const lesson = stageLesson(Object.freeze({ ...options }), build);
  return Object.freeze({ ...lesson, id, scenes: ordered, validate });
}

/**
 * @param {import('./lesson-definition.d.ts').CueState} state
 * @param {string} id
 */
function requiredCue(state, id) {
  requireId(id, 'Cue id');
  const cue = state?.cues && Object.hasOwn(state.cues, id) ? state.cues[id] : undefined;
  if (!cue) throw new Error(`Unknown narration cue ${id}; use a resolved narration clock`);
  if (!['before', 'during', 'after'].includes(cue.phase)) {
    throw new Error(`${id}: invalid cue phase ${cue.phase}`);
  }
  if (
    cue.phase === 'during' &&
    (!Number.isFinite(cue.progress) || cue.progress < 0 || cue.progress > 1)
  ) {
    throw new Error(`${id}: operation progress must be finite and between 0 and 1`);
  }
  return cue;
}

/**
 * Current operation progress is independent of permission to show its final result.
 * @param {import('./lesson-definition.d.ts').CueState} state
 * @param {string} cueId
 */
export function operationProgress(state, cueId) {
  const cue = requiredCue(state, cueId);
  return cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : cue.progress;
}

/**
 * A completed result requires the full measured clause, even at progress 1 during it.
 * @param {import('./lesson-definition.d.ts').CueState} state
 * @param {string} cueId
 */
export function resultAfter(state, cueId) {
  return requiredCue(state, cueId).phase === 'after';
}
