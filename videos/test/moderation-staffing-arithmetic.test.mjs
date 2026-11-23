import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { draw } from '../animations/design-real-time-content-moderation-system.mjs';

registerLessonFonts();
const cue = (id, progress) => ({
  id,
  phrase: id,
  targets: [],
  phase: progress === 1 ? 'after' : 'during',
  progress,
  reveal: progress,
  active: progress < 1,
  strength: progress,
});

test('staffing readouts retain exact arithmetic while their independent reveal cues progress', () => {
  for (const handling of [0.25, 0.5, 0.75, 1]) {
    for (const staffing of [0.25, 0.5, 0.75, 1]) {
      const frame = drawFrame(
        createCanvas(1920, 1080).getContext('2d'),
        {},
        { id: 'cascade', title: 'Spend context where it can change the answer' },
        {
          beat: 1,
          beatP: 0.9,
          t: 37,
          duration: 40,
          opacity: 1,
          cueTiming: 'provider-words',
          cues: {
            'cascade-human-work': cue('cascade-human-work', 1),
            'cascade-review-work': cue('cascade-review-work', handling),
            'cascade-staffing': cue('cascade-staffing', staffing),
          },
        },
        draw,
      );
      assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
      const labels = frame.labels.map((label) => label.text);
      assert(
        labels.includes('Human arrivals 100 / s · mean handling 120 s · target occupancy 70%'),
      );
      assert(labels.includes('100 × 120 = 12,000 busy reviewers'));
      assert(labels.includes('ceil(12,000 / 0.70) = 17,143 staff'));
    }
  }
});

test('the classifier calculation stays visible while its cue overlaps the human-work handoff', () => {
  const frame = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'cascade', title: 'Spend context where it can change the answer' },
    {
      beat: 1,
      beatP: 0.45,
      t: 28.75,
      duration: 40,
      opacity: 1,
      cueTiming: 'provider-words',
      cues: {
        'cascade-classifier-work': {
          ...cue('cascade-classifier-work', 1),
          active: true,
          strength: 0.972,
          targets: ['cascade-classifier-work'],
        },
        'cascade-human-work': {
          ...cue('cascade-human-work', 0.1),
          targets: ['cascade-human-inputs'],
        },
        'cascade-review-work': { ...cue('cascade-review-work', 0), phase: 'before', active: false },
        'cascade-staffing': { ...cue('cascade-staffing', 0), phase: 'before', active: false },
      },
    },
    draw,
  );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  const labels = frame.labels.map((label) => label.text);
  assert(labels.includes('Classifier work = 1,500 resolved + 500 escalated = 2,000 requests / s'));
  assert(labels.includes('Human arrivals 100 / s · mean handling 120 s · target occupancy 70%'));
});
