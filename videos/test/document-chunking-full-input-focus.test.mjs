import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/document-chunking.mjs';
const lesson = await readLesson(
  new URL('../lessons/document-chunking.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
test('the longer-input encoding clause focuses its eight-token input rather than the local four-token span', () => {
  const scene = lesson.scenes.find((s) => s.id === 'semantic-and-late'),
    cue = scene.beats[1].visual_cues.find((c) => c.id === 'semantic-and-late-beat-2-focus-2');
  for (const progress of [0.1, 0.5, 0.9]) {
    const cues = Object.fromEntries(
      scene.beats.flatMap((b) =>
        (b.visual_cues ?? []).map((c) => [
          c.id,
          { ...c, phase: 'before', progress: 0, active: false, strength: 0 },
        ]),
      ),
    );
    cues[cue.id] = { ...cue, phase: 'during', progress, active: true, strength: 1 };
    const audit = drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      lesson,
      scene,
      {
        t: 1,
        duration: 50,
        opacity: 1,
        beat: 1,
        beatP: 0.16 + progress * 0.04,
        cueTiming: 'provider-words',
        cues,
      },
      draw,
    );
    assert.deepEqual([...audit.issues, ...layoutIssues(audit)], []);
    for (const id of cue.targets) {
      const targets = audit.targets.filter((t) => t.id === id);
      assert(targets.length);
      assert(
        targets.every((t) => t.x > 1000),
        'the named longer input is the right-hand shared input',
      );
      const region = targets[0];
      for (const word of ['Owner', 'is', 'Maya', 'page', 'the', 'service', 'owner'])
        assert(
          audit.labels.some(
            (l) =>
              l.text === word && l.x >= region.x && l.x + l.width <= region.x + region.width + 1,
          ),
          'the focus contains shared-input word ' + word,
        );
    }
  }
});
