import { opening, rulebook, patches, learner, checkDispatch } from './dispatch.mjs';
import { search, interlock, checkEvaluation } from './evaluation.mjs';
import { history, checkHistory } from './history.mjs';
import { training, allocation, checkTraining } from './training.mjs';
import { serving, requests, practice, checkServing } from './serving.mjs';

const scenes = [
  opening,
  rulebook,
  patches,
  learner,
  search,
  interlock,
  history,
  training,
  allocation,
  serving,
  requests,
  practice,
];

const captionStarts = {
  'c10-b06': [
    'Add those to the first hundred billion',
    'and they meet at one hundred sixty-five billion tokens each',
    'Both plans have used',
    'Starting from zero',
    'Divide the full training premium',
    'by the saving on each serving token',
  ],
  'c12-b01': [
    'and returns the same answer',
    'At two hundred billion serving tokens each',
    'the smaller model leads',
    'Keep the answer and the larger model fixed',
    'Give the smaller one',
    'another hundred billion hidden reasoning tokens',
    'at six billion operations each',
    'Which plan uses fewer',
  ],
  'c12-b02': [
    'The extra tokens add six tenths',
    'The smaller model crosses',
    'and stops at nine',
    'The seven-billion model stays',
    'at eight point six eight zettaFLOPs',
    'and now uses less estimated work',
    'Count every processed token',
    'even when both answers look the same',
  ],
};

function prepareCaptions(schedule) {
  for (const entry of schedule) {
    const starts = captionStarts[entry.beat.id];
    if (!starts) continue;
    for (const phrase of starts) entry.markCaption(phrase);
    entry.cueWordIndices = new Set(entry.cueWordIndices);
  }
}

export default {
  title: 'The Bitter Lesson: Where Compute Goes',
  preparePicture: prepareCaptions,
  draw(ctx, clock) {
    ctx.save();
    try {
      ctx.scale(1920 / 1200, 1080 / 675);
      scenes[clock.beat.chapterIndex](ctx, clock);
    } finally {
      ctx.restore();
    }
  },
  check() {
    checkDispatch();
    checkEvaluation();
    checkHistory();
    checkTraining();
    checkServing();
  },
};
