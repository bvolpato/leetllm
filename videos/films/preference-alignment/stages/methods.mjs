import { progress, heard } from '../clock.mjs';

const rollout = ['I’ll', 'send', 'tonight’s', 'change', 'to', 'a', 'reviewer.'];

export function drawMethods(ctx, scene, state, api) {
  const { C } = api;
  api.text(ctx, 'Same request    ·    Temporary admin access for tonight', 130, 263, 42, C.ink);
  api.focus.target('archive-lane', () => {
    const pass = heard(state, 'methods-reuse', 0) ? 2 : 1;
    api.text(ctx, 'DPO', 130, 430, 49, C.green);
    api.text(ctx, 'Read stored pair', 130, 493, 30, C.muted);
    api.text(ctx, 'A   Open a ticket and cite P-7.', 520, 417, 38, C.ink);
    api.text(ctx, 'B   Go ahead until tomorrow.', 520, 486, 38, C.ink);
    api.text(ctx, 'Vote    A over B', 520, 553, 32, C.green);
    api.text(ctx, 'Pass ' + pass, 1460, 428, 43, C.green);
    if (progress(state, 'methods-pair', 0) > 0) {
      api.text(ctx, 'Policy + reference', 1460, 493, 30, C.muted);
    }
  });
  api.line(ctx, 130, 610, 1780, 610, C.muted, 2);
  if (state.beat > 0)
    api.focus.target('rollout-lane', () => {
      api.text(ctx, 'PPO', 130, 730, 49, C.blue);
      api.text(ctx, 'Generate a reply', 130, 793, 30, C.muted);
      const n = Math.ceil(rollout.length * progress(state, 'methods-write', 1));
      const line = rollout.slice(0, n).join(' ');
      api.text(ctx, line || '…', 520, 737, 37, n ? C.ink : C.muted);
      api.text(
        ctx,
        n === rollout.length ? 'Completed rollout' : 'Actor writing',
        520,
        812,
        30,
        C.blue,
      );
      const scored = heard(state, 'methods-score', 1);
      api.text(
        ctx,
        scored ? 'Reward model' : 'Awaiting score',
        1460,
        737,
        35,
        scored ? C.yellow : C.muted,
      );
      if (scored) {
        api.arrow(ctx, 1275, 724, 1410, 724, C.yellow, 5);
        api.text(ctx, 'Score for this reply', 1460, 804, 28, C.muted);
      }
    });
  if (state.beat >= 2)
    api.focus.target('next-batch', () => {
      const added = heard(state, 'methods-collect', 2);
      api.text(
        ctx,
        added
          ? 'Newly judged replies can enter the next DPO dataset.'
          : 'What can training learn from fresh replies?',
        130,
        973,
        38,
        added ? C.green : C.ink,
      );
    });
}

export default {
  id: 'methods',
  draw: drawMethods,
  cues: ['methods-pair', 'methods-reuse', 'methods-write', 'methods-score', 'methods-collect'],
};
