import { scalarResume } from '../arithmetic.mjs';
import { phraseEnded } from '../construction.mjs';

export function drawCheckpointState(ctx, scene, state, api) {
  const { C } = api;
  const end = (id, beat, at) => phraseEnded(state, api, id, beat, at);
  const saved = { weight: 2, velocity: 0.4 };
  const gradient = 0.5;
  const branches = [
    {
      label: 'Full checkpoint',
      s: scalarResume(saved, gradient),
      result: end('resume-full', 1, 0.32),
    },
    {
      label: 'Weights only',
      s: scalarResume(saved, gradient, { weightOnly: true }),
      result: end('resume-reset', 1, 0.8),
    },
    {
      label: 'Wrong next batch',
      s: scalarResume(saved, -0.25),
      result: end('resume-wrong', 2, 0.73),
    },
  ];
  api.text(
    ctx,
    'Momentum toy    /    saved weight 2.00    /    saved velocity 0.40',
    125,
    268,
    38,
    C.ink,
  );
  api.text(ctx, 'v′ = 0.75 × v + g', 475, 370, 47, C.cyan, 'center');
  api.text(ctx, 'w′ = w − 0.10 × v′', 1405, 370, 47, C.cyan, 'center');
  const visible = 1 + Number(end('resume-weights', 1, 0.5)) + Number(end('resume-cursor', 2, 0.3));
  api.focus.target('resume-branches', () => {
    const centers = [403, 960, 1517];
    branches.slice(0, visible).forEach(({ label, s, result }, i) => {
      const x = centers[i],
        color = i === 0 ? C.blue : C.yellow;
      api.text(ctx, label, x, 505, 44, C.ink, 'center', 'serif');
      api.text(ctx, `w = ${s.restored.weight.toFixed(2)}`, x, 594, 36, C.ink, 'center');
      api.text(
        ctx,
        s.restored.velocity === undefined
          ? 'v missing → use 0'
          : `v = ${s.restored.velocity.toFixed(2)}`,
        x,
        664,
        35,
        i === 1 ? color : C.ink,
        'center',
      );
      api.text(
        ctx,
        `next g = ${s.gradient.toFixed(2)}`,
        x,
        734,
        36,
        i === 2 ? color : C.ink,
        'center',
      );
      api.line(ctx, x - 227, 786, x + 227, 786, color, 4);
      api.text(
        ctx,
        result ? `v′ = ${s.velocity.toFixed(2)}` : 'v′ = ?',
        x,
        869,
        38,
        color,
        'center',
      );
      api.text(
        ctx,
        result ? `w′ = ${Number(s.weight.toFixed(3))}` : 'w′ = ?',
        x,
        969,
        53,
        color,
        'center',
      );
    });
  });
}

export default {
  id: 'checkpoint-state',
  draw: drawCheckpointState,
  cues: [
    'resume-formula',
    'resume-full',
    'resume-weights',
    'resume-reset',
    'resume-cursor',
    'resume-wrong',
  ],
};
