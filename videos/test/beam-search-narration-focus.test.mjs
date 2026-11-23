import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import { draw } from '../animations/beam-search.mjs';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

registerLessonFonts();

const contains = (outer, inner) =>
  inner.x >= outer.x - 1 &&
  inner.y >= outer.y - 1 &&
  inner.x + inner.width <= outer.x + outer.width + 1 &&
  inner.y + inner.height <= outer.y + outer.height + 1;

test('the spoken continuing path receives native focus while its identity and connection remain held', async () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const lesson = await readLesson(
    new URL('../lessons/beam-search.lesson.yaml', import.meta.url),
    root,
  );
  const index = lesson.scenes.findIndex((scene) => scene.id === 'search-lattice'),
    scene = lesson.scenes[index];
  // Measured production speech intervals, independent of generated build artifacts.
  const timing = makeSceneTimeline(scene, [13.464, 16.248, 12.96]);
  const windows = [
    [0.5, 1.15],
    [20.289, 22.189],
    [32.912, 36.2495],
    [36.662, 39.8245],
  ];
  timing.visualCues = scene.beats
    .flatMap((entry, beat) => entry.visual_cues.map((cue) => ({ ...cue, beat })))
    .map((cue, i) => ({
      ...cue,
      start: windows[i][0],
      end: windows[i][1],
      linger: cue.linger ?? 0.65,
    }));
  timing.cueTiming = 'provider-words';
  const cue = timing.visualCues.at(-1),
    canvas = createCanvas(1920, 1080);
  const times = [
    cue.start - 0.04,
    cue.start + 0.25,
    38.03333333333333,
    (cue.start + cue.end) / 2,
    cue.end - 0.05,
    cue.end + 0.3,
    cue.end + cue.linger + 0.04,
  ];
  for (const time of times) {
    const state = frameState(timing, time, index, lesson.scenes.length);
    const audit = drawFrame(canvas.getContext('2d'), lesson, scene, state, draw);
    assert.deepEqual(layoutIssues(audit), [], `native geometry at ${time}s`);
    const continuation = audit.labels.find((label) => label.text === 'quietly 0.10/0.013');
    const parent = audit.labels.find((label) => label.text === 'again 0.70/0.135');
    assert(
      continuation?.alpha > 0.25 && parent?.alpha > 0.25,
      'the continuing path remains painted',
    );
    const node = audit.shapes.find((shape) => contains(shape, continuation));
    assert(node);
    assert.deepEqual([node.x, node.y, node.width, node.height], [1275, 714, 250, 62]);
    const incoming = audit.connectors.find(
      (connector) =>
        connector.target &&
        contains(connector.target, continuation) &&
        contains(connector.source, parent),
    );
    assert(incoming, 'quietly keeps its connection from the retained again prefix');
    assert(Math.abs(incoming.fromGap - 12) < 1e-9 && Math.abs(incoming.toGap - 12) < 1e-9);

    const spoken = state.cues[cue.id];
    if (spoken.active && spoken.strength > 0.5) {
      const regions = audit.targets.filter((target) => spoken.targets.includes(target.id));
      assert(
        regions.some((region) => contains(region, node) && contains(region, incoming.source)),
        'the actual focus region must include the spoken continuation and its inherited path',
      );
      const brackets = audit.paths.filter((path) => path.id?.startsWith(`focus:${cue.id}:`));
      const points = brackets.flatMap((path) => path.points);
      assert(points.length > 0, 'native focus brackets must be painted');
      const bounds = {
        x: Math.min(...points.map((p) => p.x)),
        y: Math.min(...points.map((p) => p.y)),
      };
      bounds.width = Math.max(...points.map((p) => p.x)) - bounds.x;
      bounds.height = Math.max(...points.map((p) => p.y)) - bounds.y;
      assert(contains(bounds, node), 'painted brackets must surround the continuing node');
    }
  }
});
