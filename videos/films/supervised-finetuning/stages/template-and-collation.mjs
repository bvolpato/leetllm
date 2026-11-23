import { motion, spoken } from '../construction.mjs';
import { paddingExample } from '../token-strip.mjs';
import { text } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  if (state.beat < 2) {
    paddingExample(ctx, api, spoken(state, 'keep-stop', 1, 0.25) ? 'position' : 'inspect');
    return;
  }
  api.focus.target('pad-labels', () => {
    const { C } = api;
    const assistantOnly = motion(state, 'check-format', 2, 0.5, 0.72) > 0;
    const xs = [675, 1040, 1445];
    ['Prompt predictions', 'Reply text', 'Turn ending'].forEach((word, i) =>
      text(ctx, api, word, xs[i], 405, 35, C.muted, 'center'),
    );
    ['Prompt + completion', 'Messages'].forEach((row, r) => {
      const y = 557 + 170 * r;
      text(ctx, api, row, 120, y, 33, C.ink);
      xs.forEach((x, i) => {
        const score = i > 0 || (r === 1 && !assistantOnly);
        text(ctx, api, score ? 'score' : 'ignore', x, y, 42, score ? C.green : C.muted, 'center');
      });
    });
    text(
      ctx,
      api,
      assistantOnly
        ? 'Messages   /   assistant-only loss enabled   /   template has generation spans'
        : 'TRL 1.17   /   dataset-format defaults',
      960,
      920,
      35,
      C.blue,
      'center',
    );
  });
}

export default {
  id: 'template-and-collation',
  draw: draw,
  cues: ['same-id', 'keep-stop', 'check-format'],
};
