import { inspect } from '../model.mjs';
import { steps } from '../fixtures.mjs';
import { beatCue } from '../construction.mjs';

export function drawProcess(ctx, scene, state, api) {
  const { C } = api;
  const fourth = beatCue(state, 'process-fourth', 2, 0.01).done;
  const seen = ['first', 'second', 'third'].filter(
    (name, i) => beatCue(state, 'process-' + name, 0, [0.6, 0.71, 0.8][i]).done,
  ).length;
  const checked = inspect(steps.slice(0, seen));
  const fail = beatCue(state, 'process-check', 1, 0.18).done && checked.decision === 'PRUNE';
  const pos = (i) => 580 + i * 318;
  api.focus.target('calls', () => {
    const labels = ['Parse manifest', 'Pin parser v2', 'Call API', 'Draft advice'];
    for (let i = 0; i < 4; i++) {
      api.text(ctx, 'Call ' + (i + 1), pos(i), 319, 33, C.muted, 'center');
      api.text(ctx, labels[i], pos(i), 382, 39, C.ink, 'center');
    }
    for (const [i, label, count] of [
      [0, 'Check at end', fourth ? steps.length : seen],
      [1, 'Check each step', checked.checked.length],
    ]) {
      const y = 511 + i * 229;
      api.text(ctx, label, 130, y - 6, 41, C.ink);
      api.text(
        ctx,
        count + (count === 1 ? ' call issued' : ' calls issued'),
        130,
        y + 50,
        33,
        C.muted,
      );
      for (let j = 0; j < 4; j++) {
        if (j)
          api.line(
            ctx,
            pos(j - 1) + 28,
            y,
            pos(j) - 28,
            y,
            j < count ? C.cyan : C.muted,
            j < count ? 8 : 2,
          );
        const rejected = fail && j === 2 && (i === 1 || fourth);
        api.circle(
          ctx,
          pos(j),
          y,
          24,
          j >= count ? C.bg : rejected ? C.pink : C.cyan,
          j >= count ? C.muted : null,
          3,
        );
        if (j === 2 && rejected) api.text(ctx, 'API removed', pos(j), y + 75, 33, C.pink, 'center');
        if (i === 1 && j === 3 && fourth)
          api.text(ctx, 'Never issued', pos(j), y + 75, 33, C.muted, 'center');
      }
    }
  });
  api.focus.target('checker', () => {
    const badBool = beatCue(state, 'process-malformed', 3, 0.13);
    const badScore = beatCue(state, 'process-nan', 3, 0.5);
    if (badBool.started) {
      const record = badScore.started
        ? { exact: true, score: NaN }
        : { exact: 'false', score: 0.99 };
      let verdict;
      try {
        verdict = inspect([record]).decision;
      } catch (error) {
        verdict = error.message;
      }
      const input = badScore.started ? 'true   /   NaN' : '"false"   /   0.99';
      api.text(ctx, 'Verdict and score     ' + input, 140, 962, 38, C.ink);
      api.text(ctx, verdict, 1765, 962, 38, C.pink, 'right');
    } else {
      api.text(
        ctx,
        fourth
          ? 'One fewer generator call on this branch'
          : fail
            ? 'Who will issue call four?'
            : 'One mark per generator call',
        140,
        962,
        47,
        fourth ? C.green : C.ink,
      );
    }
  });
}

export default {
  id: 'process',
  draw: drawProcess,
  cues: [
    'process-first',
    'process-second',
    'process-third',
    'process-check',
    'process-fourth',
    'process-malformed',
    'process-nan',
  ],
};
