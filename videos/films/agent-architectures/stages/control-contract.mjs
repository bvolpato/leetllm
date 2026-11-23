import { cueAmount, cueDone } from '../defaults.mjs';

export function drawControlContract(ctx, scene, state, api) {
  const { C } = api;
  const proposed = cueDone(state, 'control-propose');
  const checked = cueDone(state, 'control-validate');
  const sent = cueAmount(state, 'control-dispatch');
  const owner = cueDone(state, 'control-policy')
    ? 'Model chooses the work'
    : cueDone(state, 'control-code')
      ? 'Code selects the fallback'
      : 'Choice of next lookup';

  api.focus.target('proposal', () => {
    api.text(ctx, owner, 160, 323, 37, C.blue);
    api.text(ctx, 'Read opening hours', 160, 402, 46, C.ink);
    api.text(ctx, 'History Museum   /   today', 160, 464, 34, C.ink);
  });
  api.focus.target('host', () => {
    api.line(ctx, 945, 365, 945, 538, C.yellow, 6);
    api.line(ctx, 945, 695, 945, 846, C.yellow, 6);
    api.text(ctx, 'Host', 945, 304, 41, C.yellow, 'center');
    api.text(ctx, checked ? 'Read allowed' : 'Read permission', 945, 909, 31, C.yellow, 'center');
  });
  api.focus.target('dispatch', () => {
    api.text(ctx, 'Hours service', 1540, 403, 43, C.ink, 'center');
    api.text(
      ctx,
      sent === 1 ? 'Request received' : 'Waiting for a request',
      1540,
      468,
      32,
      sent === 1 ? C.blue : C.muted,
      'center',
    );
    const x = 190 + 1160 * sent;
    if (x > 250) api.line(ctx, 245, 620, x - 5, 620, C.muted, 3);
    if (x + 395 < 1680) api.line(ctx, x + 395, 620, 1680, 620, C.muted, 3);
    if (proposed || cueAmount(state, 'control-propose') > 0) {
      api.rect(ctx, x, 565, 390, 110, C.panel, C.blue, 12);
      api.text(ctx, 'hours-24', x + 195, 635, 41, C.blue, 'center', 'mono');
    }
    api.text(ctx, 'Completed hours results', 160, 802, 32, C.muted);
    api.text(ctx, '0', 160, 889, 63, C.ink);
    if (cueAmount(state, 'control-state') > 0)
      api.text(ctx, 'Store the reply here when it arrives', 270, 875, 31, C.ink);
  });
}
export default {
  id: 'control-contract',
  draw: drawControlContract,
  cues: [
    'control-propose',
    'control-validate',
    'control-dispatch',
    'control-code',
    'control-policy',
    'control-state',
  ],
};
