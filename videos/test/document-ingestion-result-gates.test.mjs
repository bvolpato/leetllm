import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/document-ingestion.mjs';
const lesson = await readLesson(
  new URL('../lessons/document-ingestion.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
const cases = [
  ['pdf-layout', 0, 'pdf-lengths', (a) => a.labels.some((l) => l.text === '64 characters')],
  [
    'version-publication',
    0,
    'version-diff',
    (a) => a.labels.some((l) => l.text === 'page 10' && l.y > 800),
  ],
  [
    'version-publication',
    2,
    'revoke-reader',
    (a) => a.labels.some((l) => l.text === 'security reader → DENY'),
  ],
  [
    'visual-retrieval',
    1,
    'late-original-result',
    (a) => a.labels.some((l) => l.text === '0.91+0.88=1.79'),
  ],
  ['visual-retrieval', 3, 'late-sum', (a) => a.labels.some((l) => l.text === '0.91+0.88=1.79')],
  [
    'visual-retrieval',
    4,
    'storage-total',
    (a) => a.labels.some((l) => l.text === '257.5 KiB per page'),
  ],
  [
    'fresh-case',
    1,
    'fresh-review',
    (a) => a.labels.some((l) => l.text === 'REVIEW · suspect critical value'),
  ],
  [
    'fresh-case',
    1,
    'fresh-correction',
    (a) =>
      a.labels.some(
        (l) =>
          l.text === 'source-verified correction' ||
          (l.text === '25 minutes with restore ID.' && l.x > 1000),
      ),
  ],
  [
    'fresh-case',
    1,
    'fresh-index',
    (a) =>
      a.labels.some(
        (l) => l.text === 'New reviewed expectation + trust + writer checks → permitted index',
      ),
  ],
  [
    'fresh-case',
    2,
    'fresh-deny',
    (a) => a.labels.some((l) => l.text === 'DENY · source scope no longer includes ops'),
  ],
  ['fresh-case', 4, 'fresh-deadline', (a) => a.labels.some((l) => l.text === '03:37')],
  ['fresh-case', 4, 'fresh-id', (a) => a.labels.some((l) => l.text === 'Include B-41')],
];
for (const [id, beat, result, has] of cases)
  test(`${id}: ${result} waits for its complete result clause`, () => {
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
        return drawFrame(
          createCanvas(1920, 1080).getContext('2d'),
          lesson,
          scene,
          {
            t: 5,
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
