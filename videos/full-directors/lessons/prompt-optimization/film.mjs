import { studio } from './studio.mjs';
import { check } from './examples.mjs';
import { postal, program, metric, splits, labeled, bootstrap } from './policy.mjs';
import { teacher, configure, budget } from './search.mjs';
import { engine, capped, replay, tallies } from './operations.mjs';
import { archive, restore, releaseGate } from './release.mjs';

const chapters = [
  postal,
  program,
  metric,
  splits,
  labeled,
  bootstrap,
  teacher,
  configure,
  budget,
  engine,
  capped,
  replay,
  (p) => tallies(p, { held: true }),
  archive,
  restore,
  releaseGate,
];
// Keep an answer out of the preceding subtitle when the result falls inside a beat.
// The host uses the measured start of each phrase when it segments the caption track.
const answerClauses = {
  'c02-b01': ['The reviewed answer'],
  'c03-b02': ['Both fields now match', 'The same reply earns zero'],
  'c07-b04': ['Both pass', 'Neither passes'],
  'c08-b03': ['That gives six choices'],
  'c09-b01': ['The candidates use two thousand', 'That makes two thousand fifty'],
  'c09-b05': ['That adds two hundred fifty thousand'],
  'c11-b03': ['The total reaches', 'That exceeds the cap'],
  'c11-b04': ['The revised plan needs', 'It fits'],
  'c12-b04': ['The baseline gets fourteen', 'Compiled A gets nineteen'],
  'c13-b02': ['Compiled A gets thirteen'],
  'c13-b03': ['In that arrangement'],
  'c13-b04': ['Now seven cases'],
  'c15-b02': ['It reaches model A', 'The file restored', 'The next call now goes to B'],
  'c16-b02': ['The candidate served'],
  'c16-b04': ['Hold this release'],
};
export default {
  title: 'Optimize, Budget and Release a Prompt Program',
  draw(ctx, clock) {
    chapters[clock.beat.chapterIndex](studio(ctx, clock));
    for (const phrase of answerClauses[clock.beat.id] ?? []) clock.reveal(phrase, 0);
  },
  check,
};
