import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/sparse-autoencoders.mjs';
const lesson = await readLesson(
  new URL('../lessons/sparse-autoencoders.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
const cases = [
  [
    'ablation',
    1,
    'ablation-result',
    (a) => a.labels.some((l) => l.text === 'Edited score ≈ 10.00'),
  ],
  ['clamp-and-gradient', 1, 'clamp-ask', (a) => a.labels.some((l) => l.text === 'edited [1,1.5]')],
  [
    'clamp-and-gradient',
    1,
    'clamp-reencode',
    (a) => a.labels.some((l) => l.text.includes("z'=1+2(1.5)=4")),
  ],
  [
    'clamp-and-gradient',
    1,
    'clamp-sum-result',
    (a) => a.labels.some((l) => l.text === 'sum readout: 1.5 → 2.5'),
  ],
  [
    'clamp-and-gradient',
    2,
    'gradient-live',
    (a) => a.labels.some((l) => l.text === 'dz contribution: +3−3=0'),
  ],
  [
    'clamp-and-gradient',
    2,
    'gradient-stopped',
    (a) => a.labels.some((l) => l.text === 'feature derivative: 3'),
  ],
  [
    'training-evidence',
    1,
    'training-endpoints',
    (a) =>
      a.labels.some((l) => l.text === '0.128') ||
      a.labels.filter((l) => l.text === '1.426').length > 1,
  ],
  [
    'training-evidence',
    1,
    'training-active-support',
    (a) => a.labels.some((l) => l.text === 'active train 18.9 / held out 19.5 of64'),
  ],
  [
    'training-evidence',
    1,
    'training-fvu-result',
    (a) => a.labels.some((l) => l.text === 'held-out FVU = 0.169'),
  ],
  [
    'training-evidence',
    1,
    'training-alignment',
    (a) =>
      a.labels.some(
        (l) =>
          l.text === 'median best |cos|: 0.798 → 0.799' ||
          l.text === 'MSE improved substantially while dictionary recovery barely moved',
      ),
  ],
  [
    'feature-audit',
    2,
    'fresh-error-preserving',
    (a) => a.labels.some((l) => l.text === 'error-preserving edit: [0,0.04] → score2'),
  ],
  [
    'feature-audit',
    2,
    'fresh-reconstruction-only',
    (a) => a.labels.some((l) => l.text === 'reconstruction-only edit: [0,0] → score0'),
  ],
];
for (const [id, beat, result, has] of cases)
  test(`${id}: ${result} waits for its complete result`, () => {
    const scene = lesson.scenes.find((s) => s.id === id),
      paint = (p) => {
        const cues = Object.fromEntries(
          scene.beats.flatMap((b, i) =>
            (b.visual_cues ?? []).map((c) => {
              const progress = c.id === result ? p : i < beat ? 1 : 0;
              return [
                c.id,
                {
                  phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
                  progress,
                  strength: 0,
                  active: false,
                  targets: [],
                },
              ];
            }),
          ),
        );
        if (result === 'training-alignment')
          cues['training-endpoints'] = {
            phase: 'after',
            progress: 1,
            strength: 0,
            active: false,
            targets: [],
          };
        cues[result] = {
          phase: p === 0 ? 'before' : p === 1 ? 'after' : 'during',
          progress: p,
          strength: 0,
          active: false,
          targets: [],
        };
        return drawFrame(
          createCanvas(1920, 1080).getContext('2d'),
          lesson,
          scene,
          {
            t: 35,
            duration: 100,
            opacity: 1,
            beat,
            beatP: p,
            cueTiming: 'explicit-test-cues',
            cues,
          },
          draw,
        );
      };
    for (const p of [0, 0.01, 0.5, 0.999]) assert.equal(has(paint(p)), false, `${result} at ${p}`);
    assert.equal(has(paint(1)), true);
  });
