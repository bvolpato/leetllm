import { checkEvidence } from './evidence.mjs';
import {
  copier,
  inspectCut,
  windows,
  overlap,
  structure,
  tails,
  tokenLimit,
  compare,
} from './boundaries.mjs';
import { retrieval, expand, checked, semantic, lateOwner, scope } from './retrieval.mjs';
import { evaluation, manifest, transfer, checkFinalStates } from './release.mjs';

const chapters = [
  copier,
  inspectCut,
  windows,
  overlap,
  structure,
  tails,
  tokenLimit,
  compare,
  retrieval,
  expand,
  checked,
  semantic,
  lateOwner,
  scope,
  evaluation,
  manifest,
  transfer,
];
function draw(ctx, clock) {
  chapters[clock.beat.chapterIndex](ctx, clock);
}
function check() {
  checkEvidence();
  checkFinalStates();
}
const captionStarts = {
  'c04-b02': [
    'Follow the gold marks',
    'One seven-word hit now contains',
    'We paid for that by indexing',
    'from the same seventeen source words',
  ],
  'c04-b03': [
    'Now the index writes thirty-three word occurrences',
    'The count of hits containing the gold phrase is still one',
    'What about the entire paging rule',
    'It stretches across ten words',
    'Even the widest hit covers only seven',
  ],
  'c06-b02': [
    'and you get eight in the second child',
    'Move both boundaries instead',
    'Five, five and five fit',
    'The character ranges below',
    'Each range includes its start',
    'and stops before its end',
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
  title: 'Where to Cut a Document for Retrieval',
  draw,
  check,
  preparePicture: prepareCaptions,
};
