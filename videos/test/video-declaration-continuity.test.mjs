import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { evaluateMotionFrames, MOTION_SAMPLE_PROGRESS } from '../lib/motion-audit.mjs';
import { suppressNarrationFocus } from '../audit-narrated-motion.mjs';
import { draw as drawJudge } from '../animations/llm-judge.mjs';
import { draw as drawAgent } from '../animations/agent-evaluation.mjs';

registerLessonFonts();

async function fixture(id, sceneId) {
  const root = new URL('../../', import.meta.url).pathname;
  const lesson = await readLesson(root + `videos/lessons/${id}.lesson.yaml`, root);
  const scene = lesson.scenes.find((item) => item.id === sceneId);
  const sounds = scene.beats.map((beat, beatIndex) => ({
    beatIndex,
    words: beat.say
      .trim()
      .split(/\s+/)
      .map((text, i) => ({ text, start: i * 0.25, end: (i + 1) * 0.25 })),
  }));
  const timing = makeSceneTimeline(
    scene,
    sounds.map((sound) => sound.words.at(-1).end),
  );
  timing.sounds = sounds;
  timing.visualCues = resolveSceneCues(scene, timing);
  timing.cueTiming = 'provider-words';
  return { lesson, scene, timing };
}

test('the declared judge swap region samples the actual moving answers', async () => {
  const { lesson, scene, timing } = await fixture('llm-judge', 'order-swap');
  const beat = scene.beats.findIndex((item) => item.motion_check);
  const declaration = scene.beats[beat].motion_check,
    span = timing.beats[beat];
  const frames = MOTION_SAMPLE_PROGRESS.map((progress) => {
    const canvas = createCanvas(1920, 1080);
    const state = suppressNarrationFocus(
      frameState(timing, span.start + (span.until - span.start) * progress, 0, 1),
    );
    drawFrame(canvas.getContext('2d'), lesson, scene, state, drawJudge);
    const rgba = canvas.getContext('2d').getImageData(0, 0, 1920, 1080).data;
    const data = Buffer.alloc(1920 * 1080 * 3);
    for (let i = 0; i < 1920 * 1080; i++)
      for (let channel = 0; channel < 3; channel++) data[i * 3 + channel] = rgba[i * 4 + channel];
    return { width: 1920, height: 1080, data };
  });
  assert(
    evaluateMotionFrames(frames, declaration).passed,
    'The declared region must contain actual answer movement without a focus pulse',
  );
});

test('completed repeated-trial marks retain their opacity in later paragraphs', async () => {
  const { lesson, scene, timing } = await fixture('agent-evaluation', 'repeatability');
  const canvas = createCanvas(1920, 1080);
  const assertRetainedMarks = (audit) => {
    const marks = audit.labels.filter((label) => label.text === '✓' || label.text === '×');
    assert.equal(marks.length, 9, 'all nine completed trial marks must remain painted');
    assert.deepEqual(
      marks.map((label) => label.alpha),
      Array(9).fill(1),
      'completed marks must remain fully readable',
    );
    assert.equal(marks.filter((label) => label.text === '✓').length, 7);
    assert.equal(marks.filter((label) => label.text === '×').length, 2);
  };
  for (const beat of [1, 2])
    for (const beatP of [0, 0.01, 0.5, 1]) {
      const span = timing.beats[beat];
      const state = {
        ...suppressNarrationFocus(frameState(timing, span.start + beatP * span.duration, 0, 1)),
        opacity: 1,
      };
      assertRetainedMarks(drawFrame(canvas.getContext('2d'), lesson, scene, state, drawAgent));
    }
  const state = suppressNarrationFocus(frameState(timing, timing.beats[1].start, 0, 1));
  const fadedMarks = (ctx, scene, state, api) =>
    drawAgent(ctx, scene, state, {
      ...api,
      components: {
        ...api.components,
        card: (spec) =>
          api.components.card(
            spec.label === '✓' || spec.label === '×' ? { ...spec, opacity: 0.22 } : spec,
          ),
      },
    });
  assert.throws(
    () => assertRetainedMarks(drawFrame(canvas.getContext('2d'), lesson, scene, state, fadedMarks)),
    /completed trial marks|fully readable/,
    'the continuity check must reject dimmed actual trial cards',
  );
});

test('the all-three comparison emphasizes the actual successful task row', async () => {
  const { lesson, scene, timing } = await fixture('agent-evaluation', 'repeatability');
  const cue = timing.visualCues.find((item) => item.id === 'all-repetitions');
  const canvas = createCanvas(1920, 1080);
  drawFrame(
    canvas.getContext('2d'),
    lesson,
    scene,
    frameState(timing, (cue.start + cue.end) / 2, 0, 1),
    drawAgent,
  );
  for (let column = 0; column < 3; column++) {
    const pixels = canvas.getContext('2d').getImageData(760 + column * 169, 370, 115, 115).data;
    let brightGreen = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (
        Math.abs(pixels[i] - 143) < 15 &&
        Math.abs(pixels[i + 1] - 224) < 15 &&
        Math.abs(pixels[i + 2] - 138) < 15
      )
        brightGreen++;
    }
    assert(
      brightGreen > 20,
      `Catalog trial ${column + 1} must retain its bright painted success mark`,
    );
  }
});
