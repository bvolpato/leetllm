import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/docker-containerization-reproducible-ai.mjs';
const root = new URL('../..', import.meta.url).pathname;
const lesson = await readLesson(
  new URL('../lessons/docker-containerization-reproducible-ai.lesson.yaml', import.meta.url)
    .pathname,
  root,
);
registerLessonFonts();
function paint(id, beat, values) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = Object.fromEntries(
      scene.beats.flatMap((b) =>
        (b.visual_cues ?? []).map((c) => [
          c.id,
          { ...c, phase: 'before', progress: 0, strength: 0, active: false },
        ]),
      ),
    );
  for (const [k, p] of Object.entries(values))
    cues[k] = {
      ...cues[k],
      phase: p === 1 ? 'after' : p === 0 ? 'before' : 'during',
      progress: p,
      strength: p > 0 && p < 1 ? 1 : 0,
      active: p > 0 && p < 1,
    };
  const frame = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { t: 10, duration: 100, opacity: 1, beat, beatP: 0.5, cues, cueTiming: 'explicit-regression' },
    draw,
  );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  return frame.labels.filter((x) => x.alpha > 0.1);
}
const texts = (a) => a.map((x) => x.text);
test('the shell error opens the film and the row count waits for the container run', () => {
  const host = texts(paint('opening', 0, {}));
  assert(host.includes('bash: python: command not found'));
  assert(!host.includes('Eval rows: 3'));
  const run = { 'opening-script': 1, 'opening-data': 1, 'opening-run': 1, 'opening-entrypoint': 1 };
  for (const p of [0, 0.5, 0.999]) {
    const container = texts(paint('opening', 2, { ...run, 'opening-output': p }));
    assert(container.includes('python:3.12-slim-trixie'));
    assert(container.includes('python'));
    assert(!container.includes('Eval rows: 3'));
  }
  assert(texts(paint('opening', 2, { ...run, 'opening-output': 1 })).includes('Eval rows: 3'));
});
test('the fallback error precedes the mounted process exit status', () => {
  const failed = { 'mount-overlay': 1, 'mount-fallback': 1, 'mount-failure': 1 };
  const pending = texts(paint('mounts', 2, { ...failed, 'mount-exit': 0.999 }));
  assert(pending.includes('Standard error'));
  assert(pending.some((label) => label.startsWith('ERROR: assets/')));
  assert(!pending.includes('exit 1'));
  assert(texts(paint('mounts', 2, { ...failed, 'mount-exit': 1 })).includes('exit 1'));
});
test('source-edit reuse footer waits while current changed keys remain visible', () => {
  for (const p of [0, 0.5, 0.999]) {
    const a = texts(paint('cache', 1, { 'cache-source-edit': 1, 'cache-reuse': p }));
    assert(a.includes('script B'));
    assert(a.includes('same install inputs'));
    assert(!a.includes('Source edit: install work is reusable'));
  }
  assert(
    texts(paint('cache', 1, { 'cache-source-edit': 1, 'cache-reuse': 1 })).includes(
      'Source edit: install work is reusable',
    ),
  );
});
test('dependency-edit conclusion waits without freezing its input and key changes', () => {
  for (const p of [0.5, 0.999]) {
    const a = texts(paint('cache', 2, { 'cache-dependency-edit': p }));
    assert(a.includes('requirements B'));
    assert(!a.includes('Separate dependency edit: revisit installation'));
  }
  const a = texts(paint('cache', 2, { 'cache-dependency-edit': 1 }));
  assert(a.includes('new install inputs processed'));
  assert(a.includes('Separate dependency edit: revisit installation'));
});
test('successful exit waits while already earned standard output remains retained', () => {
  for (const p of [0, 0.5, 0.999]) {
    const a = texts(paint('evaluation', 2, { 'eval-exit': p }));
    assert(!a.includes('C1 exited · status 0'));
    assert(a.includes('0.667 (2/3)'));
    assert(a.includes('Gate passed. You may commit.'));
  }
  assert(texts(paint('evaluation', 2, { 'eval-exit': 1 })).includes('C1 exited · status 0'));
});
test('framework terminal failure follows the full import clause and retains successful probes', () => {
  for (const p of [0, 0.5, 0.999]) {
    const a = texts(paint('gpu', 1, { 'gpu-visible': 1, 'gpu-framework': p }));
    assert.equal(a.filter((x) => x === 'GPU visible').length, 2);
    assert(a.includes('>>> import torch'));
    assert(!a.some((x) => x.includes('ModuleNotFoundError')));
  }
  const a = texts(paint('gpu', 1, { 'gpu-visible': 1, 'gpu-framework': 1 }));
  assert(a.includes("ModuleNotFoundError: No module named 'torch'"));
});
test('changed-fixture diagnosis and color wait while true three-of-three score persists', () => {
  for (const p of [0, 0.5, 0.999]) {
    const a = paint('identity', 1, { 'identity-edit': 1, 'identity-exact': p });
    assert(texts(a).includes('3/3 · threshold PASS'));
    assert(!texts(a).includes('Exact reference: FAIL'));
    assert(!texts(a).includes('A higher score can still be a changed fixture'));
  }
  const a = texts(paint('identity', 1, { 'identity-edit': 1, 'identity-exact': 1 }));
  assert(a.includes('3/3 · threshold PASS'));
  assert(a.includes('Exact reference: FAIL'));
  assert(a.includes('A higher score can still be a changed fixture'));
});
