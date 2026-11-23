import { SAMPLE_LOGPROBS, TARGETS } from '../fixtures.mjs';
import { timedScene } from '../timed-scene.mjs';

export default timedScene('datum-validation', [3, 2, 1, 3], (ctx, api, time) => {
  const { C, focus } = api;
  if (time.beat === 3) {
    focus.target('validation-lengths', () => {
      const fields = [
        ['model_input', [10]],
        ['target_tokens', [11, 20]],
        ['weights', [0, 1]],
      ];
      fields.forEach(([name, values], i) => {
        const y = 293 + i * 134;
        api.text(ctx, name, 190, y + 61, 37, C.ink, 'left', 'mono');
        values.forEach((value, j) => {
          const x = 655 + 348 * j;
          api.rect(ctx, x, y, 316, 90, C.panel, C.blue, 8);
          api.text(ctx, String(value), x + 158, y + 60, 45, C.ink, 'center');
        });
        api.text(ctx, 'length ' + values.length, 1440, y + 62, 37, C.yellow);
      });
      api.text(ctx, 'SDK constructs the object', 190, 790, 42, C.blue);
      if (time.done(3, 0))
        api.text(ctx, 'Local check rejects unequal lengths', 190, 882, 46, C.pink);
    });
    return;
  }
  const x = (i) => 655 + 455 * i;
  const swap = time.progress(0, 1) * (1 - time.progress(2, 0));
  const submitted = swap === 1 ? [0, SAMPLE_LOGPROBS[2], SAMPLE_LOGPROBS[1]] : SAMPLE_LOGPROBS;
  const sampled = TARGETS.slice(1).map((token, i) => [token, SAMPLE_LOGPROBS[i + 1]]);
  const proposal = TARGETS.slice(1).map((token, i) => [token, submitted[i + 1]]);
  const matches = proposal.every(
    ([id, score], i) => id === sampled[i][0] && score === sampled[i][1],
  );
  focus.target('validation-reference', () => {
    api.text(ctx, 'Target IDs', 125, 322, 36, C.ink);
    api.text(ctx, 'Sampler log p', 125, 466, 36, C.cyan);
    TARGETS.forEach((id, i) => {
      api.text(ctx, String(id), x(i), 325, 62, i ? C.yellow : C.blue, 'center');
      api.text(ctx, i ? String(SAMPLE_LOGPROBS[i]) : 'unused', x(i), 470, 50, C.cyan, 'center');
    });
  });
  focus.target('validation-proposal', () => {
    api.line(ctx, 125, 530, 1755, 530, C.muted, 2);
    api.text(ctx, 'Proposed log p', 125, 650, 36, C.ink);
    SAMPLE_LOGPROBS.forEach((score, i) => {
      const direction = i === 1 ? 1 : i === 2 ? -1 : 0;
      const cx = x(i) + direction * (x(1) - x(0)) * swap;
      const y = 639 + direction * Math.sin(Math.PI * swap) * 58;
      api.rect(ctx, cx - 88, y - 45, 176, 74, C.panel, C.cyan, 10);
      api.text(ctx, String(score), cx, y + 9, 42, C.cyan, 'center');
    });
  });
  focus.target('validation-check', () => {
    api.text(ctx, 'Length check', 125, 795, 30, C.muted);
    api.text(ctx, '3 targets   =   3 scores', 615, 795, 38, C.ink);
    const result = time.done(2, 0) || (time.done(1, 1) && !time.started(2, 0));
    const expression = 'list(zip(targets[1:], scores[1:])) == sampled';
    api.text(
      ctx,
      result ? expression : 'Would you submit these scores?',
      125,
      920,
      38,
      C.ink,
      'left',
      result ? 'mono' : 'sans',
    );
    if (result)
      api.text(ctx, matches ? 'True' : 'False', 1735, 922, 47, matches ? C.green : C.pink, 'right');
  });
});
