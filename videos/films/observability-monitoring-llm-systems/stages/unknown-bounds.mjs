import { boundConstruction } from '../construction.mjs';

export function drawUnknownBounds(ctx, scene, state, api) {
  const { C, focus } = api;
  const q = boundConstruction(state);
  const text = (label, x, y, size, color, align = 'left') =>
    api.text(ctx, label, x, y, size, color, align);
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const showLower = after('known-count');
  const showUpper = q.changed ? after('expanded-count') : after('possible-count');
  const rows = Array.from({ length: 7 }, (_, i) => q.events.find((e) => e.id === 'R' + (i + 1)));
  const left = 548,
    step = 187;

  text('Seven requests entered', 120, 259, 41, C.ink);
  text('Possible unsafe deliveries across this whole window', 120, 325, 31, C.muted);
  const line = (y) => api.line(ctx, 120, y, 1800, y, C.panel, 3);
  line(435);
  line(654);
  text('Final delivery', 120, 504, 36, C.ink);
  text('Review verdict', 120, 597, 36, C.ink);
  text('Could count', 120, 742, 36, C.ink);

  rows.forEach((event, i) => {
    const x = left + i * step;
    focus.target('window-evidence', () => {
      text('R' + (i + 1), x, 402, 36, C.blue, 'center');
      text(
        event ? (event.served ? 'Delivered' : 'Withheld') : 'Missing',
        x,
        504,
        29,
        event ? C.ink : C.yellow,
        'center',
      );
      text(
        event?.unsafe == null ? 'Pending' : event.unsafe ? 'Unsafe' : 'Clear',
        x,
        597,
        29,
        event?.unsafe === true ? C.pink : C.muted,
        'center',
      );
    });
    const confirmed = event?.unsafe === true;
    const possible = event?.unsafe == null && event?.served !== false;
    focus.target('bound-slots', () => {
      const resolved = i === 6 && q.changed ? showUpper : after('possible-count');
      const counted = (confirmed && showLower) || (possible && resolved);
      const label =
        confirmed && showLower
          ? '1 known'
          : possible && resolved
            ? 'up to 1'
            : resolved
              ? '0'
              : '?';
      const color = counted ? (confirmed ? C.pink : C.yellow) : C.muted;
      api.rect(ctx, x - 76, 686, 152, 84, C.panel, color, 8);
      text(label, x, 740, 31, color, 'center');
    });
  });

  let caption = 'How few or how many unsafe deliveries are possible among these seven?';
  if (showLower) caption = 'At least ' + q.lowerCount + ' of 7';
  if (showUpper)
    caption = 'Unsafe deliveries: ' + q.lowerCount + ' of 7  to  ' + q.upperCount + ' of 7';
  if (q.changed && !showUpper)
    caption = 'R7’s final event is missing. How high can the count go now?';
  focus.target('count-range', () => text(caption, 120, 937, 43, showUpper ? C.ink : C.yellow));
}

export default {
  id: 'unknown-bounds',
  draw: drawUnknownBounds,
  cues: [
    'read-seven',
    'pending-deliveries',
    'known-count',
    'possible-count',
    'ob-unknown-bounds-3-1',
    'expanded-count',
  ],
};
