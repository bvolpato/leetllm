import { cueProgress } from '../pixel-study.mjs';

function predictionRow(ctx, api, { y, name, steps, prompt, comparison, target }) {
  const { C } = api;
  const tracks = comparison === undefined ? [prompt] : [prompt, comparison];
  const counts = tracks.map((progress) => Math.floor(steps * progress));
  api.focus.target(target, () => {
    api.text(ctx, name, 128, y - 57, 36, C.ink);
    for (let step = 0; step < steps; step++) {
      for (let branch = 0; branch < tracks.length; branch++) {
        const done = step < counts[branch];
        const color = branch === 0 ? C.cyan : C.yellow;
        api.circle(
          ctx,
          152 + 27 * step,
          y + 27 * branch,
          8,
          done ? color : C.panel,
          done ? color : C.muted,
          2,
        );
      }
    }
    api.text(ctx, String(counts.reduce((sum, n) => sum + n, 0)), 1715, y + 25, 62, C.ink, 'right');
  });
}

export function drawCompute(ctx, scene, state, api) {
  const { C } = api;
  const b = state.beat;
  if (b < 2) {
    api.text(ctx, 'Predictions per image', 1715, 247, 32, C.muted, 'right');
    const prompt = cueProgress(state, 'work-single', 0);
    predictionRow(ctx, api, {
      y: 367,
      name: '50 steps · prompt only',
      steps: 50,
      prompt,
      target: 'work-fifty',
    });
    if (prompt === 1)
      predictionRow(ctx, api, {
        y: 592,
        name: '50 steps · prompt and comparison',
        steps: 50,
        prompt,
        comparison: cueProgress(state, 'work-pairs', 0),
        target: 'work-guided',
      });
    if (b === 1)
      predictionRow(ctx, api, {
        y: 817,
        name: '6 steps · guidance-distilled student',
        steps: 6,
        prompt: cueProgress(state, 'work-student', 1),
        target: 'work-distilled',
      });
    return;
  }

  const baseline = { steps: 50, scale: 7.5, branches: 2 };
  const trials = [
    { ...baseline, shown: true, label: 'Baseline', target: 'work-baseline' },
    {
      ...baseline,
      steps: baseline.steps / 2,
      shown: cueProgress(state, 'work-steps-test', 2) > 0,
      label: 'Fewer steps',
      target: 'work-step-trial',
    },
    {
      ...baseline,
      scale: baseline.scale * 2,
      shown: cueProgress(state, 'work-guidance-test', 2) > 0,
      label: 'More guidance',
      target: 'work-guidance-trial',
    },
  ];
  for (const [x, label] of [
    [125, 'Matched trials'],
    [630, 'Steps'],
    [935, 'CFG scale'],
    [1295, 'Predictions / image'],
  ]) {
    api.text(ctx, label, x, 310, 33, C.muted);
  }
  for (const [i, t] of trials.entries()) {
    if (!t.shown) continue;
    const y = 445 + 160 * i;
    api.focus.target(t.target, () => {
      api.text(ctx, t.label, 125, y, 43, C.ink);
      api.text(ctx, String(t.steps), 630, y, 51, t.steps === baseline.steps ? C.ink : C.yellow);
      api.text(ctx, String(t.scale), 935, y, 51, t.scale === baseline.scale ? C.ink : C.yellow);
      api.text(ctx, `${t.steps} × ${t.branches} = ${t.steps * t.branches}`, 1295, y, 47, C.cyan);
    });
  }
  api.text(
    ctx,
    'Same model, prompts and seeds  ·  Clock from admission to first released preview',
    125,
    965,
    31,
    C.muted,
  );
}

export default {
  id: 'compute',
  draw: drawCompute,
  cues: [
    'work-single',
    'work-pairs',
    'work-double',
    'work-student',
    'work-steps-test',
    'work-guidance-test',
  ],
};
