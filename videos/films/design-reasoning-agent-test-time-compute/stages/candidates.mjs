import { eligible } from '../arithmetic.mjs';
import { candidates } from '../fixtures.mjs';
import { beatCue } from '../construction.mjs';

export function drawCandidates(ctx, scene, state, api) {
  const { C } = api;
  const paths = beatCue(state, 'paths-introduce', 0, 0.42);
  const scored = beatCue(state, 'paths-scores', 1, 0.02).done;
  const blocked = beatCue(state, 'paths-block', 1, 0.5).done;
  const selected = beatCue(state, 'paths-select', 2, 0.01).done;
  const follow = beatCue(state, 'paths-follow', 2, 0.34);
  const winner = candidates.filter((c) => eligible(c.path)).sort((a, b) => b.score - a.score)[0];
  const xs = [345, 920, 1480];
  api.focus.target('paths', () => {
    api.text(
      ctx,
      paths.started
        ? 'Two proposed repairs   /   example scores'
        : 'Parser flag change   /   latency spike',
      145,
      280,
      43,
      C.muted,
    );
    if (!paths.started) {
      api.text(ctx, 'Did the flag cause the spike?', 145, 510, 68, C.ink);
      api.text(ctx, 'Compare route timings and check compatibility.', 145, 700, 42, C.cyan);
      return;
    }
    candidates.forEach((c, i) => {
      const y = 495 + i * 245;
      const color = selected && c.id === winner.id ? C.green : C.cyan;
      api.text(ctx, c.id, 145, y + 21, 62, C.ink);
      const edgeEnd = xs[0] + 265;
      api.line(
        ctx,
        xs[0] + 22,
        y,
        blocked && !eligible(c.path) ? edgeEnd - 20 : xs[1] - 21,
        y,
        color,
        8,
      );
      if (blocked && !eligible(c.path)) {
        api.line(ctx, edgeEnd + 22, y, xs[1] - 21, y, C.muted, 5);
        api.line(ctx, edgeEnd - 11, y - 20, edgeEnd + 10, y + 20, C.pink, 7);
        api.line(ctx, edgeEnd + 10, y - 20, edgeEnd - 11, y + 20, C.pink, 7);
        api.text(ctx, 'Blocked', edgeEnd, y - 40, 33, C.pink, 'center');
      }
      api.line(ctx, xs[1] + 22, y, xs[2] - 21, y, color, 8);
      c.path.forEach((name, j) => {
        api.circle(ctx, xs[j], y, 15, C.bg, color, 6);
        api.text(ctx, name.replaceAll('_', ' '), xs[j], y + 76, 39, C.ink, 'center');
      });
      if (scored) api.text(ctx, 'Score ' + c.score.toFixed(2), 1770, y + 12, 35, C.muted, 'right');
      if (i === 1 && follow.started)
        api.circle(ctx, xs[0] + (xs[2] - xs[0]) * follow.p, y, 12, C.yellow);
    });
    api.text(
      ctx,
      selected
        ? 'Send path ' + winner.id + ' for review'
        : blocked
          ? 'Which complete path passes both hops?'
          : 'Both candidates propose an end-to-end path.',
      145,
      959,
      48,
      selected ? C.green : C.ink,
    );
  });
}

export default {
  id: 'candidates',
  draw: drawCandidates,
  cues: [
    'paths-introduce',
    'paths-branches',
    'paths-scores',
    'paths-block',
    'paths-select',
    'paths-follow',
  ],
};
