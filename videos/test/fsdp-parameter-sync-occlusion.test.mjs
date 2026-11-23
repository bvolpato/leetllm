import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { draw, parameterSyncPosition } from '../animations/fsdp-zero.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('provider-timed updated parameter copies do not occlude settled rank labels', async () => {
  const lesson = await readLesson(path.join(root, 'videos/lessons/fsdp-zero.lesson.yaml'), root);
  const index = lesson.scenes.findIndex((scene) => scene.id === 'zero2'),
    scene = lesson.scenes[index];
  const measured = (await loadMeasuredTimeline('fsdp-zero')).scenes[0];
  const timing = { ...measured, visualCues: resolveSceneCues(scene, measured) };
  const canvas = createCanvas(1920, 1080);
  for (const frame of [1070, 1071, 1072, 1073, 1074]) {
    const audit = drawFrame(
      canvas.getContext('2d'),
      lesson,
      scene,
      frameState(timing, frame / 30, index, lesson.scenes.length),
      draw,
    );
    assert.deepEqual(layoutIssues(audit), [], `parameter copies at provider frame ${frame}`);
    assert(audit.labels.some((label) => label.text === 'B′'));
  }
});

test('new rank copies pass around completed replicas and settle on their own rank row', () => {
  for (let step = 1; step <= 2000; step++) {
    const progress = step / 2000;
    for (let rank = 1; rank < 4; rank++)
      for (let shard = 0; shard < 4; shard++) {
        const moving = parameterSyncPosition(rank, shard, progress);
        if (!moving.visible) continue;
        for (let earlier = 0; earlier < rank; earlier++)
          for (let previousShard = 0; previousShard < 4; previousShard++) {
            const settled = parameterSyncPosition(earlier, previousShard, progress);
            assert(settled.settled);
            assert(
              Math.hypot(moving.x - settled.x, moving.y - settled.y) >= 48,
              'two radius24 replicas must keep disjoint interiors',
            );
          }
      }
  }
  for (let rank = 0; rank < 4; rank++)
    for (let shard = 0; shard < 4; shard++) {
      const settled = parameterSyncPosition(rank, shard, 1);
      assert.equal(settled.x, 1210 + shard * 155);
      assert.equal(settled.y, 700 + rank * 65);
    }
});
