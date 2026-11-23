import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
const require = createRequire(import.meta.url),
  mod = process.env.NCCL_SOURCE
    ? 'data:text/javascript;base64,' +
      Buffer.from(
        fs
          .readFileSync(process.env.NCCL_SOURCE, 'utf8')
          .replace(
            "from 'vizmatic'",
            "from '" + pathToFileURL(require.resolve('vizmatic')).href + "'",
          ),
      ).toString('base64')
    : new URL('../animations/deep-dive-nccl.mjs', import.meta.url),
  { draw } = await import(mod);
const lesson = await readLesson(
  new URL('../lessons/deep-dive-nccl.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
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
    ),
    text = [],
    lines = [],
    timelines = [];
  for (const [k, p] of Object.entries(values))
    cues[k] = {
      ...cues[k],
      phase: p === 1 ? 'after' : p === 0 ? 'before' : 'during',
      progress: p,
      strength: 0,
      active: false,
    };
  const a = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { t: 10, duration: 100, opacity: 1, beat, beatP: 0.8, cues },
    (ctx, s, state, api) =>
      draw(ctx, s, state, {
        ...api,
        components: {
          ...api.components,
          card: (options) => {
            text.push({ value: options.label, color: options.textColor });
            return api.components.card(options);
          },
        },
        text: (...args) => {
          text.push({ value: args[1], color: args[5] });
          return api.text(...args);
        },
        line: (...args) => {
          lines.push({ x: args[1], y: args[2], color: args[5] });
          return api.line(...args);
        },
        teaching: {
          ...api.teaching,
          timeline: (options) => {
            timelines.push(options);
            return api.teaching.timeline(options);
          },
        },
      }),
  );
  return { labels: a.labels.map((l) => l.text), text, lines, timelines };
}
test('replicated all-reduce vector waits while the earlier selected column sum remains', () => {
  for (const p of [0.85, 0.999]) {
    const a = paint('intro', 1, { 'intro-all-reduce': p, 'nc-intro-b1-s1': p });
    assert(a.labels.includes('Four independent local vectors'));
    assert(a.labels.includes('3+30+300+3000=3333'));
    assert(a.labels.includes('4000'));
  }
  const a = paint('intro', 1, { 'intro-all-reduce': 1, 'nc-intro-b1-s1': 1 });
  assert(a.labels.includes('The same sum on every rank'));
  assert.equal(a.labels.filter((x) => x === '1111').length, 4);
});
test('ordered-call divergence is pending during comparison while the literal Broadcast record remains', () => {
  for (const p of [0.01, 0.5, 0.999]) {
    const a = paint('agreement', 1, { 'agreement-mismatch': p, 'nc-agreement-b1-s0': p });
    assert(a.labels.some((l) => l === 'seq 1 · Broadcast'));
    assert(!a.labels.includes('C0 / seq 1: rank 2 diverges'));
    assert(!a.text.some((t) => t.value === 'seq 1 · Broadcast' && t.color === '#ff8fc0'));
  }
  const a = paint('agreement', 1, { 'agreement-mismatch': 1, 'nc-agreement-b1-s0': 1 });
  assert(a.labels.includes('C0 / seq 1: rank 2 diverges'));
  assert(a.text.some((t) => t.value === 'seq 1 · Broadcast' && t.color === '#ff8fc0'));
});
test('actual repair changes the call before the separate compatible-program summary', () => {
  const a = paint('agreement', 2, { 'agreement-repair': 0.8, 'nc-agreement-b2-s0': 0.8 });
  assert.equal(a.labels.filter((l) => l === 'seq 1 · All-gather').length, 4);
  assert(!a.labels.includes('Compatible ordered calls'));
  assert(
    paint('agreement', 2, { 'agreement-repair': 1, 'nc-agreement-b2-s0': 1 }).labels.includes(
      'Compatible ordered calls',
    ),
  );
});
test('supplied total and hidden time remain separate until the exposed wait result completes', () => {
  for (const p of [0, 0.5, 0.999]) {
    const a = paint('receipt', 2, { 'nc-receipt-b2-s1': p });
    assert(!a.timelines[0].intervals.some((x) => x.id === 'exposed'));
    assert(!a.labels.includes('exposed 2 ms'));
    assert(a.timelines[0].intervals.some((x) => x.end - x.start === 6));
    assert(a.timelines[0].intervals.some((x) => x.end - x.start === 4));
    assert(a.labels.includes('Algorithmic: 44.74 GB/s'));
    assert(a.labels.includes('Bus score: 67.11 GB/s'));
  }
  const a = paint('receipt', 2, { 'nc-receipt-b2-s1': 1 });
  assert(a.timelines[0].intervals.some((x) => x.id === 'exposed' && x.end - x.start === 2));
  assert(a.labels.includes('exposed 2 ms'));
});
test('rank-specific byte highlight, arrow and card earn the same completed offset', () => {
  for (const p of [0, 0.5, 0.999]) {
    const a = paint('inplace-offset', 1, { 'nc-inplace-offset-b1-s1': p });
    assert(a.labels.includes('byte 8'));
    assert(!a.text.some((t) => t.value === 'byte 8' && t.color === '#8fe08a'));
    assert(!a.lines.some((l) => l.x === 1125 && l.color === '#8fe08a'));
    assert(a.labels.includes('Rank 2 view · offset pending'));
    assert(a.labels.includes('300'));
  }
  const a = paint('inplace-offset', 1, { 'nc-inplace-offset-b1-s1': 1 });
  assert(a.text.some((t) => t.value === 'byte 8' && t.color === '#8fe08a'));
  assert(a.lines.some((l) => l.x === 1125 && l.color === '#8fe08a'));
  assert(a.labels.includes('Rank 2 view · byte 8'));
  assert(a.labels.includes('300'));
});
