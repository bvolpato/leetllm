import { canonicalAction, canonicalVote } from '../construction.mjs';
import { cueAt } from '../cue-clock.mjs';

const samples = [
  'Merge release',
  'merge_release',
  'Auto merge approved change',
  'manual review',
  'force merge immediately',
];
const normalized = samples.map(canonicalAction);
const vote = canonicalVote(samples);
const caption = (action) =>
  ({ merge_release: 'Merge', manual_review: 'Review', abstain: 'Abstain' })[action] ?? 'Rejected';

export function drawCanonicalAnswerVote(ctx, scene, state, api) {
  api.focus.target('canonical-answer-vote-mechanism', () => {
    const { C, text, line, rect } = api;
    const three = cueAt(state, 'vote-three', 0, 0.27, 0.52);
    const n = cueAt(state, 'vote-invalid', 0, 0.74, 0.96).done
      ? 5
      : cueAt(state, 'vote-review', 0, 0.54, 0.7).done
        ? 4
        : Math.floor(three.progress * 3);
    const colors = { merge_release: C.cyan, manual_review: C.blue };
    text(ctx, 'Sampled final action', 190, 261, 35, C.muted);
    text(ctx, 'Allowed action', 1230, 261, 35, C.muted);
    line(ctx, 180, 289, 1740, 289, C.muted, 2);
    samples.forEach((sample, i) => {
      const y = 365 + i * 85;
      text(ctx, String(i + 1), 190, y, 33, C.muted);
      text(ctx, sample, 302, y, 36, C.ink, 'left', 'mono');
      if (i < n) {
        const action = normalized[i],
          color = colors[action] ?? C.pink;
        line(ctx, 929, y - 10, 1160, y - 10, color, 3);
        text(ctx, caption(action), 1230, y, 40, color);
      }
    });
    const start = 490,
      width = 194,
      y = 802,
      height = 85;
    text(ctx, 'All attempts', 185, y + 56, 37, C.ink);
    normalized.forEach((action, i) => {
      const x = start + i * width;
      const color = colors[action] ?? C.pink;
      rect(ctx, x + 4, y, width - 8, height, C.panel, i < n ? color : C.muted, 8);
      text(
        ctx,
        i < n ? caption(action) : String(i + 1),
        x + width / 2,
        y + 55,
        31,
        i < n ? color : C.muted,
        'center',
      );
    });
    const floor = cueAt(state, 'vote-floor', 1, 0.45, 0.75);
    const raised = cueAt(state, 'vote-raise', 2, 0.27, 0.46);
    if (floor.started) {
      const threshold = raised.done ? 0.8 : 0.6;
      const x = start + width * samples.length * (0.6 + 0.2 * raised.progress);
      line(ctx, x, y - 20, x, y - 2, C.yellow, 5);
      line(ctx, x, y + height + 2, x, y + height + 19, C.yellow, 5);
      const xLabel = Math.round(threshold * samples.length);
      if (!raised.started || raised.done)
        text(ctx, 'Need ' + xLabel + ' of 5', x, 944, 30, C.yellow, 'center');
      if (
        cueAt(state, 'vote-accept', 2, 0, 0.24).done &&
        (!raised.started || cueAt(state, 'vote-abstain', 2, 0.48, 0.65).done)
      ) {
        const decision = canonicalVote(samples, threshold).decision;
        text(
          ctx,
          vote.counts.merge_release + ' / ' + vote.total + '  →  ' + caption(decision),
          1690,
          y + 55,
          31,
          decision === 'abstain' ? C.yellow : C.cyan,
          'center',
        );
      }
    }
  });
}
export default {
  id: 'canonical-answer-vote',
  draw: drawCanonicalAnswerVote,
  cues: [
    'vote-three',
    'vote-review',
    'vote-invalid',
    'vote-floor',
    'vote-accept',
    'vote-raise',
    'vote-abstain',
    'vote-rule',
    'vote-policy',
  ],
};
