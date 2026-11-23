import { namedSystemCue, spokenResult } from '../construction.mjs';
import { card, text } from '../defaults.mjs';

export function drawAgentState(ctx, scene, state, api) {
  const { C, focus } = api;
  const intent = namedSystemCue(state, 'agent-intent', 0, 0.23) > 0;
  const accepted = spokenResult(state, 'agent-accept', 0, 0.49);
  const lost = spokenResult(state, 'agent-timeout', 0, 0.7);
  const attached = spokenResult(state, 'agent-reconcile', 1, 0.41);
  const cancel = spokenResult(state, 'agent-cancel', 2, 0.24);
  const exited = spokenResult(state, 'agent-exit', 2, 0.49);
  text(ctx, api, 'T47   /   Repository task   /   Attempt W1', 150, 276, 44, C.ink);

  focus.target('agent-receiver', () => {
    text(ctx, api, 'Repository', 1180, 424, 46, C.ink);
    text(ctx, api, 'Commit history', 1180, 493, 32, C.muted);
    card(ctx, api, 'c41', 1180, 535, 193, C.blue, 84, 38);
    if (accepted) {
      api.line(ctx, 1373, 577, 1472, 577, C.cyan, 4);
      card(ctx, api, 'c42', 1472, 535, 193, C.cyan, 84, 38);
      text(ctx, api, 'Recorded for W1', 1180, 717, 37, C.cyan);
    }
  });

  focus.target('agent-local', () => {
    text(ctx, api, 'Worker log', 150, 424, 46, C.ink);
    const rows = [
      ['Attempt', 'W1'],
      ['Tool event', intent ? 'E7 · create commit' : 'Pending'],
      [
        'Reply',
        attached ? 'Reconciled · c42' : lost ? 'Missing after restart' : 'Awaiting receipt',
      ],
    ];
    if (state.beat >= 2)
      rows.push([
        'Sandbox',
        exited ? 'Exited · canceled' : cancel ? 'Cancel requested' : 'Running',
      ]);
    rows.forEach(([label, value], i) => {
      const y = 521 + i * 88;
      text(ctx, api, label, 150, y, 32, C.muted);
      text(ctx, api, value, 445, y, 36, i === 2 && lost && !attached ? C.yellow : C.ink);
      api.line(ctx, 150, y + 22, 958, y + 22, C.muted, 1);
    });
  });
  text(
    ctx,
    api,
    exited
      ? 'Sandbox exit confirmed. Commit c42 remains in the repository.'
      : attached
        ? 'The receipt belongs to the original attempt.'
        : 'Which record can establish whether the write happened?',
    150,
    951,
    43,
    C.ink,
  );
}
export default {
  id: 'agent-state',
  draw: drawAgentState,
  cues: [
    'agent-intent',
    'agent-accept',
    'agent-timeout',
    'agent-lookup',
    'agent-reconcile',
    'agent-cancel',
    'agent-exit',
    'agent-persists',
  ],
};
