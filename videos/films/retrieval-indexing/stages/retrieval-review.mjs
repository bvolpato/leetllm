import { dense, fused, reranked, sparse } from '../credential-shortlist.mjs';
import { picture } from '../picture.mjs';

export function drawRetrievalReview(ctx, scene, state, api) {
  const { C, label, rule, box, started, after, target } = picture(ctx, state, api);
  const ranking = fused().map(([id]) => id);
  label('Tracking d2   ·   the credential guide', 150, 267, 53, C.ink, 'left', 'serif');
  const stages = ['Word search', 'Dense search', 'Fused shortlist', 'Reranked'];
  const drawTrace = (start, depth, showResult) => {
    const rows = [sparse, dense, ranking.slice(0, depth), showResult ? reranked(depth) : []];
    rows.forEach((row, i) => {
      const y = 473 + i * 112;
      row.forEach((id, j) => {
        const x = start + j * 145,
          c = id === 'd2' ? C.yellow : C.muted;
        box(x, y - 51, 112, 72, C.panel, c);
        label(id, x + 56, y, 41, c, 'center');
      });
    });
  };
  target('review-trace', () => {
    label('Two slots', 638, 375, 39);
    stages.forEach((name, i) => label(name, 150, 473 + i * 112, 40));
    drawTrace(638, 2, true);
  });
  target('review-replay', () => {
    if (started('review-cut')) {
      rule(1165, 349, 1165, 846, C.panel, 4);
      label(after('review-three') ? 'Three slots' : 'Replay', 1265, 375, 39, C.cyan);
      if (after('review-three')) drawTrace(1265, 3, after('review-back'));
    }
  });
  target('review-question', () => {
    const text = started('review-save')
      ? 'Repeat on the same eligible corpus and measure request latency.'
      : after('review-back')
        ? 'd2 first reappears at the fused cutoff.'
        : after('review-cut')
          ? 'Change the fused cutoff. Keep both lane orders and scores.'
          : 'Where did the dense lane’s first result disappear?';
    label(text, 150, 979, 40, C.yellow);
  });
}
export default {
  id: 'retrieval-review',
  draw: drawRetrievalReview,
  cues: ['review-lanes', 'review-ask', 'review-cut', 'review-three', 'review-back', 'review-save'],
};
