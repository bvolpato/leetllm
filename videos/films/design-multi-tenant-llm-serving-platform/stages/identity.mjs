import { resultAfter } from '../../../lib/lesson-definition.mjs';

export function drawIdentity(ctx, scene, state, api) {
  const { C } = api;
  const changed = resultAfter(state, 'identity-select-b');
  const resolved = changed
    ? resultAfter(state, 'identity-deny-b')
    : resultAfter(state, 'identity-allow-a');
  const selected = changed ? 'B' : 'A';
  api.focus.target('identity-request', () => {
    api.text(ctx, 'Verified caller', 142, 324, 32, C.muted);
    api.text(ctx, 'Alice', 142, 411, 68, C.ink);
    api.text(ctx, 'Selects workspace', 142, 572, 32, C.muted);
    api.text(ctx, selected, 142, 677, 90, changed ? C.pink : C.blue);
    api.text(ctx, 'Current grant', 780, 324, 32, C.muted, 'center');
    api.text(ctx, 'Alice  →  A', 780, 411, 60, C.blue, 'center');
  });
  api.focus.target('workspace-gate', () => {
    api.line(ctx, 300, 645, 760, 645, changed ? C.pink : C.blue, 7);
    if (changed && resolved) {
      api.line(ctx, 784, 573, 784, 715, C.yellow, 12);
      api.text(ctx, 'Permission denied', 808, 775, 37, C.yellow, 'center');
    } else if (resolved) {
      api.arrow(ctx, 770, 645, 1145, 645, C.blue, 7);
      api.text(ctx, 'Authorized context', 825, 775, 35, C.blue, 'center');
    } else {
      api.circle(ctx, 778, 645, 13, C.yellow);
      api.text(ctx, 'Check grant', 780, 775, 36, C.yellow, 'center');
    }
    api.rect(ctx, 1180, 449, 580, 294, C.panel, C.muted, 16);
    api.text(ctx, 'Retrieval', 1470, 535, 45, C.ink, 'center');
    api.text(
      ctx,
      changed && resolved ? 'No lookup' : resolved ? 'A / Alice' : 'Waiting for context',
      1470,
      650,
      41,
      resolved && !changed ? C.blue : C.muted,
      'center',
    );
  });
  const note =
    changed && resolved
      ? 'A hot adapter in B supplies no grant to Alice.'
      : changed
        ? 'Alice selects B. Should retrieval run?'
        : 'The verified grant travels with the request.';
  api.text(ctx, note, 140, 964, 40, C.ink);
}
export default {
  id: 'identity',
  draw: drawIdentity,
  cues: [
    'identity-principal',
    'identity-allow-a',
    'identity-select-b',
    'identity-choice',
    'identity-deny-b',
  ],
};
