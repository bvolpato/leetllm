import { routeReplayComparison } from '../model.mjs';
import { text } from '../defaults.mjs';

const { cached, rebuilt } = routeReplayComparison();

export function drawHandleLifetime(ctx, scene, state, api) {
  const { C } = api;
  const b = state.beat;
  const cue = (name) => state.cues?.[name]?.progress ?? 0;
  const result = (name) => state.cues?.[name]?.phase === 'after';
  const branch = (run, y, label, color, first, finish, target) => {
    api.focus.target(target, () => {
      text(ctx, api, label, 135, y, 38, color);
      const [left, right] = run.mapping.a;
      const term = (r) => r.gate.toFixed(2) + ' × ' + r.raw[0];
      text(ctx, api, 'E' + left.expert, 770, y - 65, 31, color, 'center');
      text(ctx, api, 'E' + right.expert, 1130, y - 65, 31, color, 'center');
      text(ctx, api, first ? term(left) : '0.70 × ?', 770, y, 46, C.ink, 'center');
      text(ctx, api, '+', 950, y, 44, C.muted, 'center');
      text(ctx, api, term(right), 1130, y, 46, C.ink, 'center');
      text(ctx, api, '=', 1340, y, 44, C.muted, 'center');
      text(
        ctx,
        api,
        finish ? run.restored.a[0].toFixed(2) : '?',
        1585,
        y,
        65,
        finish ? color : C.muted,
        'center',
      );
      api.line(ctx, 130, y + 49, 1770, y + 49, C.muted, 2);
    });
  };

  text(
    ctx,
    api,
    'a = [1, 0]     ·     Router wants E2 and E3     ·     Expert k multiplies by k + 1',
    960,
    282,
    37,
    C.yellow,
    'center',
  );
  branch(
    cached,
    499,
    'Replay old handle',
    C.pink,
    true,
    b > 0 || result('de-handle-old'),
    'de-handle-old-row',
  );
  branch(
    rebuilt,
    768,
    'Fresh dispatch',
    C.cyan,
    b > 0 && (b > 1 || cue('de-handle-first') > 0),
    b > 1 || result('de-handle-new'),
    'de-handle-new-row',
  );
  api.focus.target('de-handle-storage', () => {
    const line =
      b === 2
        ? 'V2 can copy the indices     ·     V2.5 retains a reference'
        : b === 0
          ? 'What first coordinate belongs in a on the new route?'
          : 'Both runs return two coordinates to the same source row';
    text(ctx, api, line, 960, 940, 39, C.ink, 'center');
    if (b === 2)
      text(
        ctx,
        api,
        'Keep the indices unmodified and the storage live through the last consumer',
        960,
        1012,
        30,
        C.cyan,
        'center',
      );
  });
}
export default {
  id: 'handle-lifetime',
  draw: drawHandleLifetime,
  cues: ['de-handle-old', 'de-handle-ask', 'de-handle-first', 'de-handle-new', 'de-handle-storage'],
};
