import { cueProgress, openingRuns } from '../evidence.mjs';

function goalFlag(ctx, api, x, y) {
  const { C } = api;
  api.line(ctx, x, y, x, y - 83, C.ink, 6);
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      api.rect(
        ctx,
        x + col * 17,
        y - 83 + row * 17,
        17,
        17,
        (col + row) % 2 ? C.panel : C.ink,
        undefined,
        0,
      );
    }
  }
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  // Enter during move eleven. Its landing leaves one move for the viewer to predict.
  const landing = Math.min(1, 0.18 + state.t / 0.9);
  const finish = cueProgress(state, 'take-last-step', 1, 0, 0.29);
  const scored = finish === 1;
  const x = (square) => 420 + square * 205;
  if (state.t < 0.35) ctx.globalAlpha = 1;
  api.focus.target('episode-track', () => {
    api.text(ctx, 'Seed 14   /   Training episode 3', 130, 262, 36, C.muted);
    const step = finish > 0 ? 12 : 11;
    api.text(ctx, `Move ${step} of 12`, 1785, 262, 41, C.yellow, 'right');
    for (let s = 0; s <= 6; s++) {
      api.text(ctx, s === 6 ? '6   Goal' : String(s), x(s), 382, 36, C.ink, 'center');
    }
    openingRuns.forEach((run, i) => {
      const y = 502 + i * 218;
      const color = i ? C.cyan : C.blue;
      api.text(ctx, i ? 'Shaped' : 'Sparse', 130, y + 15, 42, color);
      api.rect(ctx, x(0) - 102, y - 82, x(6) - x(0) + 204, 164, C.panel, C.muted, 18);
      for (let s = 1; s <= 6; s++) {
        const seam = (x(s) + x(s - 1)) / 2;
        api.line(ctx, seam, y - 77, seam, y + 77, C.muted, 2);
      }
      goalFlag(ctx, api, x(6) + 18, y + 18);
      const position = run[10] + (run[11] - run[10]) * landing + (run[12] - run[11]) * finish;
      const phase = finish > 0 ? finish : landing;
      const hop = 40 * Math.sin(Math.PI * phase);
      api.circle(ctx, x(position), y - hop, 37, color, C.bg, 4);
      api.circle(ctx, x(position) - 9, y - hop - 10, 8, C.ink);
    });
    if (state.beat === 2) {
      if (cueProgress(state, 'goal-reward', 2, 0.15, 0.35) > 0)
        api.text(ctx, 'Goal reward', 420, 620, 33, C.blue);
      if (cueProgress(state, 'distance-feedback', 2, 0.36, 0.76) > 0)
        api.text(ctx, 'Goal reward + distance feedback', 420, 840, 33, C.cyan);
    }
    if (scored) {
      api.text(ctx, 'Goals this trip', 405, 920, 39, C.ink);
      api.text(
        ctx,
        `Sparse   ${Number(openingRuns[0].at(-1) === 6)}`,
        922,
        920,
        44,
        C.blue,
        'center',
      );
      api.text(
        ctx,
        `Shaped   ${Number(openingRuns[1].at(-1) === 6)}`,
        1375,
        920,
        44,
        C.cyan,
        'center',
      );
    } else {
      api.text(
        ctx,
        'Who can reach the flag on the last move?',
        960,
        920,
        52,
        C.ink,
        'center',
        'serif',
      );
    }
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['take-last-step', 'goal-reward', 'distance-feedback'],
};
