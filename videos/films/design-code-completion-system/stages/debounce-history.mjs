import { fresh } from '../model.mjs';
import { snapshot } from '../editor.mjs';
import { code, text } from '../defaults.mjs';

export function drawDebounceHistory(ctx, scene, state, api) {
  const { C } = api;
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const typed = after('deb-dot') ? 3 : after('deb-next') ? 2 : after('deb-first') ? 1 : 0;
  const moved = after('deb-move'),
    revised = after('deb-policy');
  const live = snapshot(
    typed,
    moved ? 0 : typed,
    revised ? 8 : 7,
    revised ? 5 : moved ? 4 : typed,
    'handler.py',
  );
  const original = snapshot(3, 3, 7, 3, 'handler.py');
  const late = { ...original, epoch: 2 };
  const atCaret = snapshot(3, 0, 7, 4, 'handler.py');
  let ghost = after('deb-paint') && fresh(original, live) ? 'completion-3' : '';
  if (after('deb-late') && fresh(late, live)) ghost = 'late-completion-2';
  if (after('deb-again') && fresh(atCaret, live)) ghost = 'fresh';
  api.focus.target('deb-keys', () => {
    code(ctx, api, 'handler.py', 135, 270, 34, C.muted);
    for (let i = 0; i < 3; i++) {
      const x = 140 + i * 570;
      const color = i < typed ? C.ink : C.muted;
      api.rect(ctx, x, 323, 478, 120, C.panel, color, 2, 8);
      if (i < typed) {
        code(ctx, api, 'ro.'.slice(0, i + 1), x + 32, 407, 58);
        text(ctx, api, 'epoch ' + (i + 1), x + 447, 399, 32, C.muted, 'right');
        const message =
          i === 2 ? 'No timer delay' : typed > i + 1 ? 'Timer cancelled' : 'Timer set for 150 ms';
        text(ctx, api, message, x, 502, 34, i === 2 ? C.yellow : C.muted);
      }
    }
  });
  api.focus.target('deb-log', () => {
    const rows = [
      ['Send log', after('deb-send') ? '[3]' : '[]'],
      [
        'Editor',
        'epoch ' +
          live.epoch +
          '     v' +
          live.version +
          '     caret ' +
          live.cursor +
          '     policy ' +
          live.policy,
      ],
      ['Ghost', ghost || 'empty'],
    ];
    rows.forEach(([key, value], i) => {
      const y = 645 + i * 105;
      text(ctx, api, key, 146, y, 36, C.muted);
      code(ctx, api, value, 488, y, 42, i === 2 ? C.cyan : C.ink);
    });
    const message = revised
      ? 'Tab: no insertion'
      : moved
        ? 'No replacement sent'
        : after('deb-keep')
          ? 'Reply 2 discarded'
          : after('deb-late')
            ? 'Epoch 2 just arrived. Which reply stays visible?'
            : '';
    if (message) text(ctx, api, message, 960, 985, 37, C.yellow, 'center');
  });
}
export default {
  id: 'debounce-history',
  draw: drawDebounceHistory,
  cues: [
    'deb-first',
    'deb-next',
    'deb-dot',
    'deb-send',
    'deb-paint',
    'deb-late',
    'deb-keep',
    'deb-move',
    'deb-again',
    'deb-policy',
    'deb-summary',
  ],
};
