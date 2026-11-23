import { policy } from '../fixtures.mjs';

const cases = [
  { action: 'run_rollback', reply: 'Run the rollback.' },
  { action: 'run_rollback', reply: 'Do not run the rollback.' },
];

export function drawSeparateChecks(ctx, scene, state, api) {
  const { C, focus } = api;
  api.text(ctx, 'DEP-27   /   Allowed action in this field', 145, 259, 33, C.muted);
  api.text(ctx, policy.actions[1], 856, 259, 34, C.ink, 'left', 'mono');
  const checks = focus.progress('exact-fields', 0) === 1;
  const searched = focus.visible('search-word');
  const hits = focus.progress('keyword-hits', 0) === 1;
  const negated = focus.progress('negation', 0) === 1;
  const sentence = focus.visible('two-sentences');
  const columns = [145, 1015];
  cases.forEach(({ action, reply }, i) => {
    const x = columns[i];
    focus.target('exact-check', () => {
      api.text(ctx, 'Record ' + (i + 1), x, 370, 38, C.ink);
      api.line(ctx, x, 404, x + 760, 404, C.muted, 2);
      api.text(ctx, 'action = "' + action + '"', x, 482, 36, C.ink, 'left', 'mono');
      if (checks)
        api.text(
          ctx,
          action === policy.actions[1] ? 'Field matches' : 'Field differs',
          x,
          548,
          32,
          C.green,
        );
    });
    focus.target('sentences', () => {
      if (sentence && (i === 0 || focus.visible('opposite-meaning'))) {
        api.text(ctx, '“' + reply + '”', x, 676, 49, C.ink, 'left', 'serif');
        if (i === 1 && negated) api.text(ctx, 'Opposite instruction', x, 748, 34, C.pink);
      }
    });
    if (searched)
      focus.target('keyword', () => {
        api.text(ctx, '"rollback" in reply.lower()', x, 873, 34, C.yellow, 'left', 'mono');
        if (hits)
          api.text(
            ctx,
            reply.toLowerCase().includes('rollback') ? 'True' : 'False',
            x,
            966,
            53,
            C.ink,
            'left',
            'mono',
          );
      });
  });
}

export default {
  id: 'separate-checks',
  draw: drawSeparateChecks,
  cues: [
    'exact-fields',
    'two-sentences',
    'opposite-meaning',
    'search-word',
    'keyword-hits',
    'negation',
  ],
};
