import { cueAmount, cueDone } from '../defaults.mjs';

const benchmarks = [
  {
    name: 'HumanEval',
    baseline: 80.1,
    refined: 91,
    baselineCue: 'human-baseline',
    refinedCue: 'human-refined',
  },
  {
    name: 'MBPP',
    baseline: 80.1,
    refined: 77.1,
    baselineCue: 'mbpp-baseline',
    refinedCue: 'mbpp-refined',
  },
];

export function drawReflexionEvidence(ctx, scene, state, api) {
  const { C } = api;
  const x = 605;
  const scale = 9.5;
  function bar(y, label, score, cue, color) {
    api.text(ctx, label, x - 36, y + 35, 30, C.muted, 'right');
    api.rect(ctx, x, y, 100 * scale, 45, C.panel, undefined, 3);
    const progress = cueAmount(state, cue);
    if (progress > 0) api.rect(ctx, x, y, score * scale * progress, 45, color, undefined, 3);
    if (cueDone(state, cue)) api.text(ctx, score + '%', x + score * scale + 18, y + 36, 33, C.ink);
  }
  api.focus.target('aa-reflexion-evidence-mechanism', () => {
    api.text(ctx, 'Final solutions passing the benchmark', 150, 250, 38, C.ink);
    for (const [i, b] of benchmarks.entries()) {
      if (i > state.beat) break;
      const y = 360 + 240 * i;
      api.text(ctx, b.name + ' Python', 150, y - 38, 33, C.ink);
      bar(y, 'GPT-4 · one generation', b.baseline, b.baselineCue, C.blue);
      bar(
        y + 74,
        'Reflexion · final submission',
        b.refined,
        b.refinedCue,
        b.refined > b.baseline ? C.green : C.pink,
      );
    }
    if (cueAmount(state, 'self-test-group') > 0) {
      api.text(
        ctx,
        'Of the solutions that passed their own tests, how many were still wrong?',
        960,
        850,
        34,
        C.ink,
        'center',
      );
      if (cueDone(state, 'mbpp-self-test'))
        api.text(ctx, 'MBPP   16.3%', 670, 945, 43, C.pink, 'center');
      if (cueDone(state, 'human-self-test'))
        api.text(ctx, 'HumanEval   1.4%', 1240, 945, 43, C.cyan, 'center');
    }
  });
}

export default {
  id: 'reflexion-evidence',
  draw: drawReflexionEvidence,
  cues: [
    'aa-reflexion-evidence-0',
    'aa-reflexion-evidence-1',
    'human-baseline',
    'human-refined',
    'mbpp-baseline',
    'mbpp-refined',
    'self-test-group',
    'mbpp-self-test',
    'human-self-test',
  ],
};
