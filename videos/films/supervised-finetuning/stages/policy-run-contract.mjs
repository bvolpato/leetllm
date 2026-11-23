import { motion, spoken } from '../construction.mjs';
import { text, upgradeBox } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  const { C } = api;
  if (state.t < 0.35) ctx.globalAlpha = 1;

  const cutoff = 14;
  const age = 18;
  const x = (day) => 180 + (day - 10) * 135;
  const approach = api.clamp(state.t / 0.8, 0, 1);
  const travel = motion(state, 'key-age', 0, 0.27, 0.48);
  const day = 12 + (cutoff - 12) * approach + (age - cutoff) * travel;
  api.focus.target('age-scale', () => {
    text(ctx, api, 'Service key age', 165, 274, 42, C.ink);
    const pos = x(day);
    const y = 412;
    api.circle(ctx, pos, y, 52, C.bg, C.blue, 15);
    api.line(ctx, pos + 56, y, pos + 182, y, C.blue, 20);
    api.line(ctx, pos + 144, y, pos + 144, y + 27, C.blue, 17);
    api.line(ctx, pos + 177, y, pos + 177, y + 38, C.blue, 17);
    text(ctx, api, Math.floor(day) + ' days', pos, 341, 65, C.blue, 'center');
    api.line(ctx, pos, y + 65, pos, 518, C.blue, 4);
    api.line(ctx, 165, 521, x(cutoff), 521, C.muted, 5);
    api.line(ctx, x(cutoff), 521, 1755, 521, C.yellow, 8);
    api.line(ctx, x(cutoff), 500, x(cutoff), 549, C.yellow, 4);
    api.circle(ctx, pos, 521, 11, C.blue);
    text(ctx, api, cutoff + ' days', x(cutoff), 611, 45, C.ink, 'center');
    text(ctx, api, 'Rotation ticket required', x(cutoff) + 173, 611, 45, C.yellow);
  });

  api.focus.target('policy-reply', () => {
    const accepted = spoken(state, 'replace-reply', 1, 0.43);
    text(
      ctx,
      api,
      accepted ? 'Approved training reply' : 'Proposed training reply',
      165,
      739,
      35,
      C.muted,
    );
    upgradeBox(
      ctx,
      api,
      accepted
        ? 'Open a rotation ticket for security review.'
        : 'Rotation can wait until next month.',
      165,
      771,
      1590,
      127,
      accepted ? C.green : C.blue,
      56,
    );
    if (state.beat === 2)
      text(
        ctx,
        api,
        'Compare replies on new cases   ·   Prompt / Retrieval / Fine-tuning',
        960,
        996,
        35,
        C.ink,
        'center',
      );
    else if (accepted)
      text(ctx, api, 'Security decides whether access continues.', 960, 996, 37, C.ink, 'center');
  });
}

export default {
  id: 'policy-run-contract',
  draw,
  cues: ['key-age', 'wait-proposal', 'replace-reply', 'compare-interventions'],
};
