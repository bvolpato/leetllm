import { kl } from '../arithmetic.mjs';
import { spokenProgress, spokenResult } from '../construction.mjs';
import { text } from '../defaults.mjs';

function drawTokenComparison(ctx, state, api) {
  const { C } = api;
  const teacher = [0.5, 0.5];
  const student = [1, 0];
  const forward = spokenProgress(state, api, 'forward-draw', 0, 0.21, 0.28);
  const unbounded = spokenResult(state, api, 'zero-forward', 0, 0.66);
  const turn = spokenProgress(state, api, 'reverse-draw', 0, 0.67, 0.73);
  const finished = spokenResult(state, api, 'zero-mass-kl', 0, 0.99);

  text(ctx, api, 'Token', 197, 307, 37, C.muted);
  text(ctx, api, 'Teacher', 455, 307, 48, C.blue);
  text(ctx, api, 'Student probability p', 1180, 307, 48, C.cyan);
  const top = 396;
  const spacing = 170;
  for (const [i, token] of ['A', 'B'].entries()) {
    const y = top + i * spacing;
    api.focus.target(i ? 'token-b' : 'token-a', () => {
      text(ctx, api, token, 196, y + 56, 68);
      for (const [x, mass, color] of [
        [455, teacher[i], C.blue],
        [1180, student[i], C.cyan],
      ]) {
        const width = 405;
        api.rect(ctx, x, y, width, 62, C.panel, undefined, 1);
        if (mass > 0) api.rect(ctx, x, y, width * mass, 62, color, undefined, 1);
        else api.line(ctx, x, y, x, y + 62, color, 4);
        text(ctx, api, mass.toFixed(1), x + width + 28, y + 50, 48, color);
      }
    });
  }

  // Follow the missing student mass on B, then the only draw the student can make.
  const y = top + spacing * (1 - turn);
  api.line(ctx, 149, y, 149, y + 62, C.yellow, 8);
  if (forward > 0) {
    api.focus.target('token-b', () => {
      const result = unbounded && kl(teacher, student) === Infinity ? ' → ∞' : '';
      text(ctx, api, 'Forward KL', 194, 806, 41, C.blue);
      text(ctx, api, 'As p(B) → 0,     ½ × ln(½ / p(B))' + result, 517, 806, 43);
    });
  }
  if (turn > 0) {
    api.focus.target('token-a', () => {
      const result = finished ? '     = ln 2 ≈ ' + kl(student, teacher).toFixed(3) + ' nats' : '';
      text(ctx, api, 'Reverse KL', 194, 932, 41, C.cyan);
      text(ctx, api, 'Only A counts     1 × ln(1 / ½)' + result, 517, 932, 43);
    });
  }
}

function drawCandidates(ctx, state, api) {
  const { C } = api;
  const teacher = [0.49, 0.02, 0.49];
  const family = [
    [0.98, 0.01, 0.01],
    [0.25, 0.5, 0.25],
    [0.01, 0.01, 0.98],
  ];
  const forward = family.map((student) => kl(teacher, student));
  const reverse = family.map((student) => kl(student, teacher));
  const showForward = spokenResult(state, api, 'forward-family', 2, 0.23);
  const showReverse = spokenResult(state, api, 'reverse-family', 2, 0.7);
  const exact = spokenResult(state, api, 'exact-family', 2, 0.99);
  api.focus.target('reverse-capacity-mechanism', () => {
    const baseline = 694;
    const scale = 298;
    api.line(ctx, 221, 256, 292, 256, C.blue, 7);
    text(ctx, api, 'Teacher probabilities     ' + teacher.join('   /   '), 320, 270, 38, C.blue);
    api.rect(ctx, 1233, 232, 47, 35, C.cyan);
    text(ctx, api, 'Student probabilities', 1300, 270, 38, C.cyan);
    for (const [i, values] of family.entries()) {
      const x = 348 + i * 608;
      text(ctx, api, ['Left', 'Center', 'Right'][i], x, 358, 44, C.ink, 'center');
      for (const [j, value] of values.entries()) {
        const center = x + (j - 1) * 143;
        const height = value * scale;
        api.rect(ctx, center - 41, baseline - height, 82, height, C.cyan, undefined, 0);
        const tick = baseline - scale * teacher[j];
        api.line(ctx, center - 54, tick, center + 54, tick, C.blue, 6);
        text(ctx, api, value.toFixed(2), center, baseline + 47, 30, C.cyan, 'center');
      }
      for (const [visible, name, scores, y] of [
        [showForward, 'Forward', forward, 817],
        [showReverse, 'Reverse', reverse, 885],
      ]) {
        if (!visible) continue;
        const best = Math.abs(scores[i] - Math.min(...scores)) < 1e-12;
        text(
          ctx,
          api,
          name + '  ' + scores[i].toFixed(3),
          x,
          y,
          37,
          best ? C.green : C.muted,
          'center',
        );
      }
    }
    if (state.beat === 1) {
      text(ctx, api, 'Which shape wins in each direction?', 960, 900, 42, C.yellow, 'center');
    }
    if (exact) {
      const loss = kl(teacher, teacher);
      text(
        ctx,
        api,
        'If the exact teacher shape is allowed     Forward ' + loss + '     Reverse ' + loss,
        960,
        995,
        37,
        C.ink,
        'center',
      );
    }
  });
}

export function drawReverseCapacity(ctx, scene, state, api) {
  if ((state.beat ?? 0) === 0) drawTokenComparison(ctx, state, api);
  else drawCandidates(ctx, state, api);
}

export default {
  id: 'reverse-capacity',
  draw: drawReverseCapacity,
  cues: [
    'forward-draw',
    'zero-forward',
    'reverse-draw',
    'zero-mass-kl',
    'forward-family',
    'reverse-family',
    'exact-family',
  ],
};
