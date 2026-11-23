import { board } from './drawing.mjs';
import { checkExamples } from './examples.mjs';
import { query, cost } from './projections.mjs';
import { handoff } from './handoff.mjs';
import { heads } from './head-cuts.mjs';
import { feedForward } from './feed-forward.mjs';
import { adapters } from './adapters.mjs';
import { benchmarks } from './benchmarks.mjs';
import { deployment } from './deployment.mjs';

const painters = [query, cost, handoff, heads, feedForward, adapters, benchmarks, deployment];

// A spoken answer starts its own English caption. The painter can hold its result until the next clause.
const captionStarts = {
  'c01-b01': ['That costs', 'Two rank directions cost'],
  'c01-b04': ['Six frozen rows cost', 'The rank-one adapter'],
  'c01-b03': ['The adapter now costs', 'All sixty-four'],
  'c02-b01': ['Their area counts'],
  'c02-b03': ['The base now accounts', 'One rank-one target'],
  'c03-b02': ['Someone has supplied'],
  'c03-b03': ['Restore the matching'],
  'c03-b06': ['Divide ninety'],
  'c04-b02': ['The cutoff is'],
  'c04-b04': ['so the first head', 'and head two leaves'],
  'c04-b05': ['Only the last two gates survive', 'The caller skips', 'and all four survive'],
  'c05-b01': ['It is point two four six'],
  'c05-b02': ['Its down column', 'so this path contributes', 'They sum to nine'],
  'c05-b04': ['The first output is seven'],
  'c05-b05': ['both survivors come from B', 'one survives in each'],
  'c06-b01': ['The ratio is three tenths'],
  'c06-b03': ['The first insertion goes', 'Keep the second and fourth directions', 'Where is the cutoff now', 'The pooled median'],
  'c06-b04': ['the estimated loss change', 'sum to fourteen', 'The trainer score is two'],
  'c06-b05': ['The unscaled update is'],
  'c06-b07': ['The update is', 'would double both components'],
  'c07-b02': ['The faster row misses'],
  'c07-b03': ['The reported two point two'],
  'c07-b04': ['Inference speed rises'],
  'c08-b02': ['A expects head two', 'A gives eleven', 'Reject A'],
  'c08-b04': ['B sums to four', 'Rebuild the state'],
  'c08-b06': ['The aggregate is', 'the required slice scores'],
};
export default {
  title: 'Light-PEFT: From Importance Scores to Smaller Tensors',
  draw(ctx, clock) {
    for (const phrase of captionStarts[clock.beat.id] || []) clock.reveal(phrase, 0);
    painters[clock.beat.chapterIndex](board(ctx, clock));
  },
  check: checkExamples,
};
