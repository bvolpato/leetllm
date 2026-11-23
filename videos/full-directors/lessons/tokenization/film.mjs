import { Press } from './press.mjs';
import { check } from './examples.mjs';
import { registration, granularity, corpus, replay, boundaries, bytes, association, wordpiece } from './cuts.mjs';
import { spaceMarkers, lattice, prune, regularize, normalization, lookup } from './paths.mjs';
import { economics, fertility, numbers, codePieces, glitches, requests, practice, outputPress } from './field.mjs';

const scenes = [
  registration, granularity, corpus, replay, boundaries, bytes, association, wordpiece,
  spaceMarkers, lattice, prune, regularize, normalization, lookup, economics, fertility,
  numbers, codePieces, glitches, requests, practice, outputPress
];
const slate = new Set([6,10,11,12,16,19]);
function draw(ctx, clock) {
  const chapter = clock.beat.chapterIndex;
  ctx.save();
  try {
    const press = new Press(ctx, clock, slate.has(chapter + 1) ? 'slate' : 'paper');
    scenes[chapter](press);
  } finally {
    ctx.restore();
  }
}

export default { title: 'Tokenization: Five Letters, How Many Positions?', draw, check };

