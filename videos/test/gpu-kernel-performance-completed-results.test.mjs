import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/gpu-kernel-performance-engineering-lab.mjs';
const lesson = await readLesson(
  new URL('../lessons/gpu-kernel-performance-engineering-lab.lesson.yaml', import.meta.url)
    .pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
function paint(id, beat, values) {
  const scene = lesson.scenes.find((s) => s.id === id),
    prefix = 'gpu-' + id + '-',
    cues = Object.fromEntries(
      scene.beats.flatMap((b) =>
        (b.visual_cues ?? []).map((c) => [
          c.id,
          { ...c, phase: 'before', progress: 0, strength: 0, active: false },
        ]),
      ),
    );
  for (const [key, p] of Object.entries(values)) {
    const name = prefix + key;
    cues[name] = {
      ...cues[name],
      phase: p === 1 ? 'after' : p === 0 ? 'before' : 'during',
      progress: p,
      strength: 0,
      active: false,
    };
  }
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { t: 10, duration: 100, opacity: 1, beat, beatP: 0.5, cues, cueTiming: 'explicit-regression' },
    draw,
  )
    .labels.filter((l) => l.alpha > 0.1)
    .map((l) => l.text);
}
const includes = (labels, text) => labels.some((l) => l.includes(text));
for (const c of [
  {
    name: 'mebibyte conversion',
    scene: 'logical-rate',
    beat: 0,
    cue: 'mebibytes',
    setup: { bytes: 1 },
    given: '134,217,728 B',
    result: '128 MiB',
  },
  {
    name: 'seconds conversion',
    scene: 'logical-rate',
    beat: 0,
    cue: 'seconds',
    setup: { time: 1 },
    given: '0.250 ms',
    result: '0.000250 s',
  },
  {
    name: 'racecheck exit status',
    scene: 'race-recovery',
    beat: 1,
    cue: 'exit',
    setup: { race: 1 },
    given: '4 hazards',
    result: 'exit 99',
  },
  {
    name: 'clean recovery summary',
    scene: 'race-recovery',
    beat: 2,
    cue: 'clean',
    setup: { restore: 1, matrix: 1 },
    given: 'N1024',
    result: '24 clean commands',
  },
])
  test(c.name + ' keeps earned inputs and waits for the complete result', () => {
    for (const p of [0, 0.5, 0.999]) {
      const labels = paint(c.scene, c.beat, { ...c.setup, [c.cue]: p });
      assert(includes(labels, c.given), c.name + ' retains input');
      assert(!includes(labels, c.result), c.name + ' remains pending at ' + p);
    }
    const labels = paint(c.scene, c.beat, { ...c.setup, [c.cue]: 1 });
    assert(includes(labels, c.given));
    assert(includes(labels, c.result));
  });
