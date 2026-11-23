import test from 'node:test';
import assert from 'node:assert/strict';
import { Resvg } from '@resvg/resvg-js';
import * as stage from 'vizmatic/stage';
import { narratedLesson } from '../lib/narrated-lesson.mjs';
import { compileStageLesson, estimatedTimeline, stageLesson } from '../lib/stage-lesson.mjs';

const lesson = {
  id: 'compatibility',
  title: 'Runtime compatibility',
  scenes: [
    {
      id: 'only',
      title: 'One scene',
      beats: [{ say: 'Read this word.', hold: 0.5 }],
    },
  ],
};
const timeline = estimatedTimeline(lesson, 30);

test('a narrated Stage film shows its teaching object on the first frame after the logo for either lesson setting', async () => {
  const definition = narratedLesson({
    id: lesson.id,
    scenes: { only: (s) => s.add(stage.rect(160, 140).fill('#ff0000')) },
  });
  for (const source of [lesson, { ...lesson, opening: 'lesson' }]) {
    const compile = () => compileStageLesson(definition, source, estimatedTimeline(source, 30));
    if (typeof stage.narrated !== 'function') {
      await assert.rejects(compile(), /Narrated lessons require .*CI_COMPATIBILITY\.md/);
    } else if (stage.firstSceneTransitions?.cut !== 'cut') {
      await assert.rejects(compile(), /firstSceneTransitions\.cut/);
    } else {
      const { compiled } = await compile();
      const raster = (time) =>
        new Resvg(compiled.svg(time), { fitTo: { mode: 'width', value: 320 } }).render().pixels;
      const first = raster(0);
      const center = (90 * 320 + 160) * 4;
      assert.deepEqual([...first.subarray(center, center + 4)], [255, 0, 0, 255]);
      assert.deepEqual(first, raster(0.5));
    }
  }
});

test('legacy stage lessons compile even when the runtime has no narrated export', async () => {
  const definition = stageLesson((s) => s.add(stage.text('Legacy')));
  const { compiled } = await compileStageLesson(definition, lesson, timeline);
  assert.match(compiled.svg(1), /<svg/);
  assert.equal(compiled.duration, timeline.duration);
});
