import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import { join } from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import { makeSceneTimeline } from '../lib/lesson.mjs';
import { writeLayoutReview } from '../lib/layout-review.mjs';

function fixture() {
  const scene = {
    id: 'odd-scene',
    title: 'Title </h1><script>alert("x")</script>',
    beats: [{ say: 'A short explanation.', hold: 0 }],
  };
  const timing = { ...makeSceneTimeline(scene, [0.1], 30), start: 4 };
  return {
    lesson: { id: 'review-test', title: 'Review <script>alert("title")</script>', scenes: [scene] },
    timeline: {
      fps: 30,
      intro: { id: 'leetllm-intro', start: 0, duration: 4, frames: 120, fps: 30 },
      scenes: [timing],
    },
  };
}

test('layout review renders each issue frame once and preserves clean, annotated evidence', async () => {
  const directory = await mkdtemp(join(os.tmpdir(), 'leetllm-layout-review-'));
  try {
    const { lesson, timeline } = fixture();
    const report = {
      passed: false,
      frames: 9,
      issueFrames: 2,
      scenes: [
        {
          scene: 'odd-scene',
          fps: 30,
          issues: [
            {
              type: 'label-overflow',
              text: '<script>label</script>',
              firstFrame: 5,
              lastFrame: 6,
              firstTime: 5 / 30,
              lastTime: 6 / 30,
              occurrences: 2,
              bounds: { x: 1600, y: 40, width: 360, height: 50 },
              container: { x: 120, y: 20, width: 1680, height: 80 },
            },
            {
              type: 'label-overlap',
              text: '<script>label</script>',
              other: 'counterpart & text',
              group: 'copy',
              firstFrame: 5,
              lastFrame: 5,
              firstTime: 5 / 30,
              lastTime: 5 / 30,
              occurrences: 1,
            },
            {
              type: 'clipped-shape',
              firstFrame: 7,
              lastFrame: 7,
              firstTime: 7 / 30,
              lastTime: 7 / 30,
              bounds: { x: -9, y: 200, width: 90, height: 70 },
            },
          ],
        },
      ],
    };
    const calls = [];
    const result = await writeLayoutReview({
      out: directory,
      lesson,
      timeline,
      report,
      renderFrame: async (sceneIndex, localTime) => {
        calls.push({ sceneIndex, localTime });
        const canvas = createCanvas(1920, 1080),
          ctx = canvas.getContext('2d');
        ctx.fillStyle = '#17233d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return {
          canvas,
          audit: {
            labels: [
              { text: '<script>label</script>', x: 300, y: 180, width: 210, height: 34, group: 0 },
              { text: 'counterpart & text', x: 460, y: 180, width: 220, height: 34, group: 0 },
            ],
            groups: [{ id: 'copy', index: 0, x: 260, y: 140, width: 500, height: 110 }],
          },
        };
      },
    });

    assert.equal(result.findings, 3);
    assert.equal(result.renderedFrames, 2);
    assert.deepEqual(
      calls.map((call) => call.sceneIndex),
      [0, 0],
    );
    assert.deepEqual(
      calls.map((call) => call.localTime),
      [5 / 30, 7 / 30],
    );

    const html = await readFile(result.html, 'utf8');
    const data = JSON.parse(await readFile(result.json, 'utf8'));
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /&lt;script&gt;label&lt;\/script&gt;/);
    assert.match(html, /counterpart &amp; text/);
    assert.match(html, /href="\.\/layout-review-frames\/frame-0001-clean\.png"/);
    assert.match(html, /href="\.\/layout-review-frames\/frame-0001-overlay\.png"/);
    assert.match(html, /does not judge whether a composition feels clear/);
    assert.equal(data.review.findings.length, 3);
    assert.equal(data.review.findings[0].evidence.clean, data.review.findings[1].evidence.clean);
    assert.equal(data.review.findings[0].issue.bounds.width, 360);
    assert.equal(data.review.findings[1].issue.text, '<script>label</script>');
    assert.ok(data.review.findings[1].evidence.overlay);
    for (const path of [
      data.review.findings[0].evidence.clean,
      data.review.findings[0].evidence.overlay,
      data.review.findings[2].evidence.clean,
      data.review.findings[2].evidence.overlay,
    ]) {
      const png = await readFile(join(directory, path));
      assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('a clean layout report states its registered-rule limits without rendering evidence frames', async () => {
  const directory = await mkdtemp(join(os.tmpdir(), 'leetllm-layout-review-clean-'));
  try {
    const { lesson, timeline } = fixture();
    let calls = 0;
    const result = await writeLayoutReview({
      out: directory,
      lesson,
      timeline,
      report: { passed: true, frames: 130, issueFrames: 0, scenes: [] },
      renderFrame: async () => {
        calls++;
        throw new Error('unexpected frame render');
      },
    });
    const html = await readFile(result.html, 'utf8');
    assert.equal(calls, 0);
    assert.equal(result.findings, 0);
    assert.match(html, /No registered layout findings were reported/);
    assert.match(html, /Unregistered visual defects require additional checks or human review/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
