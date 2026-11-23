import { beats } from './instruments.mjs';
import { opening, trace, intake, rack, archive, identity, checkDispatch } from './dispatch.mjs';
import {
  bins,
  accumulation,
  continuous,
  driftTypes,
  checkDistributions,
} from './distributions.mjs';
import { decisions, calibration, checkOutcomes } from './outcomes.mjs';
import { bundle, exposure, gates, triage, checkRollout } from './rollout.mjs';
import { policy, practice, checkRelease } from './release.mjs';

const scenes = [
  opening,
  trace,
  intake,
  bins,
  accumulation,
  continuous,
  driftTypes,
  rack,
  (c, s) => archive(c, s, false),
  (c, s) => archive(c, s, true),
  decisions,
  calibration,
  bundle,
  exposure,
  gates,
  triage,
  policy,
  identity,
  practice,
];
// These boundaries keep answer phrases in their own caption once measured speech is available.
const answerStarts = {
  'c01-b03': ['Block the nine', 'Use the forty'],
  'c04-b03': ['The oldest bucket quadrupled'],
  'c05-b04': ['The oldest bin contributes the most'],
  'c07-b05': ['The result is'],
  'c08-b04': ['Use the actual'],
  'c09-b02': ['Job six has until one'],
  'c10-b02': ['Four of the five'],
  'c11-b04': ['Both leave review', 'Dropping job three costs ten'],
  'c11-b05': ['Total error cost rises'],
  'c14-b04': ['The first five buckets contain', 'Two hundred fifty-seven'],
  'c14-b07': ['Seventy-five requests'],
  'c17-b01': ['That is half a percent', 'The queue exceeds its budget'],
  'c17-b04': ['the simulator returns an invalid metric'],
  'c17-b05': [
    'Twenty plus ten gives thirty',
    'that is exactly fifty per thousand',
    'Keep version four',
  ],
  'c19-b03': ['or ninety-five percent', 'The simulator returns insufficient evidence'],
  'c19-b05': ['gives thirty-six', 'That gives forty-five', 'Keep version four'],
  'c19-b07': ['That gives sixty', 'Propose a return'],
};
export default {
  title: 'Seeing a Model Change After Deployment',
  draw(ctx, clock) {
    for (const start of answerStarts[clock.beat.id] ?? []) clock.reveal(start, 0);
    scenes[clock.beat.chapterIndex](ctx, beats(clock));
  },
  check() {
    checkDispatch();
    checkDistributions();
    checkOutcomes();
    checkRollout();
    checkRelease();
  },
};
