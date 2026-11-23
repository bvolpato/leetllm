import { field, shot } from './studio.mjs';
import { opening, records, preference, redaction, rubric } from './records.mjs';
import { agreement, chance, uncertain, diversity, scoring, experiment } from './selection.mjs';
import { boundary, lineage, release, practice } from './release.mjs';
import { checkCases } from './cases.mjs';

const trialCaptionStarts = {
  'c11-b03': [
    'from sixty-one percent',
    'to sixty-four for random selection',
    'and sixty-eight for hybrid',
    'These are three and seven percentage points',
  ],
  'c11-b04': [
    'about one hundred and thirty-three point three',
    'versus fifty-seven point one labels per percentage point',
    'A harder queue can take longer to review',
    'reviewer time and compute',
  ],
};
function preparePicture(schedule) {
  for (const entry of schedule) {
    const phrases = trialCaptionStarts[entry.beat.id];
    if (!phrases) continue;
    for (const phrase of phrases) entry.markCaption(phrase);
    entry.cueWordIndices = new Set(entry.cueWordIndices);
  }
}

const painters = [
  opening,
  records,
  preference,
  redaction,
  rubric,
  agreement,
  chance,
  uncertain,
  diversity,
  scoring,
  experiment,
  boundary,
  lineage,
  release,
  practice,
];

export default {
  title: 'How Active Learning Chooses Feedback Cases',
  preparePicture,
  draw(ctx, clock) {
    ctx.save();
    ctx.scale(2, 2);
    const painter = painters[clock.beat.chapterIndex];
    field(ctx, painter === diversity);
    painter(ctx, shot(clock));
    ctx.restore();
  },
  check() {
    checkCases();
  },
};
