import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/reranking.mjs';
import { contracts } from './fixtures/result-contracts/reranking.mjs';
const lesson = await readLesson(
  new URL('../lessons/reranking.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
function paint(c, progress, overrides = {}) {
  const scene = lesson.scenes.find((s) => s.id === c.scene),
    cues = Object.fromEntries(
      scene.beats.flatMap((b, i) =>
        (b.visual_cues ?? []).map((q) => [
          q.id,
          {
            ...q,
            phase: i <= c.beat ? 'after' : 'before',
            progress: i <= c.beat ? 1 : 0,
            strength: 0,
            active: false,
          },
        ]),
      ),
    );
  for (const id of c.reset ?? [])
    cues[id] = { phase: 'before', progress: 0, strength: 0, active: false };
  cues[c.cue] = {
    phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
    progress,
    strength: 0,
    active: false,
  };
  Object.assign(cues, overrides);
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    {
      t: 35,
      duration: 100,
      opacity: 1,
      beat: c.beat,
      beatP: 0.75,
      cueTiming: 'explicit-test-cues',
      cues,
    },
    draw,
  );
}
for (const c of contracts)
  test(`${c.scene}: ${c.cue} waits for the full result clause`, () => {
    for (const p of [0, 0.01, 0.5, 0.999])
      assert.equal(c.has(paint(c, p)), false, `${c.cue} at ${p}`);
    assert.equal(c.has(paint(c, 1)), true, 'completed result is actually painted');
  });
test('the moving signed gap and displayed loss use the same current operands', () => {
  for (const p of [0.01, 0.25, 0.5, 0.75, 0.99]) {
    const a = paint({ scene: 'ranking-losses', beat: 1, cue: 'swap-gap' }, p),
      gap = 1 - 2 * p,
      loss = Math.log1p(Math.exp(-gap));
    assert(
      a.labels.some(
        (l) => l.text === String.raw`\Delta=${gap.toFixed(2)}\quad L=${loss.toFixed(3)}`,
      ),
    );
    assert(a.labels.some((l) => l.text === 'Δ = ' + gap.toFixed(2)));
  }
});
test('rank movement keeps its reciprocal-rank and MRR totals pending', () => {
  const a = paint({ scene: 'metrics-construction', beat: 0, cue: 'promote-first' }, 0.5);
  assert(a.labels.some((l) => l.text === 'RR pending'));
  assert(a.labels.some((l) => l.text === 'MRR pending'));
  assert(!a.labels.some((l) => l.text.includes('=\\frac49') || l.text.includes('=\\frac23')));
});
test('budget revalidation shows an operation before completed packing', () => {
  const a = paint({ scene: 'fresh-release', beat: 2, cue: 'packing-repair' }, 0.5);
  assert(a.labels.some((l) => l.text === 'Budget revalidation pending'));
  assert(
    !a.labels.some((l) => l.text === 'budget 44' || l.text.includes('both complete spans packed')),
  );
});
