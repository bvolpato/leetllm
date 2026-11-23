import { aggregateSwaps, identity } from '../arithmetic.mjs';
import { candidates, stableSwap, conflictingSwap } from '../fixtures.mjs';

const slotX = [145, 1025];
const cardWidth = 748;
const names = { compact: 'Compact', stepwise: 'Stepwise' };

function reply(ctx, api, id, x, y) {
  const { C } = api;
  const color = id === 'compact' ? C.green : C.cyan;
  const excerpt =
    id === 'compact'
      ? candidates[id].split(' and run')[0] + '…'
      : candidates[id].slice(candidates[id].indexOf('1.'), candidates[id].indexOf(' 2.'));
  api.rect(ctx, x, y, cardWidth, 118, C.panel, color, 9);
  api.text(ctx, names[id], x + 24, y + 43, 36, color);
  api.text(ctx, excerpt, x + 24, y + 94, 32, C.ink);
}

function receiptRow(ctx, api, target, label, y, record, showName) {
  const { C } = api;
  api.focus.target(target, () => {
    api.text(ctx, label, 158, y, 35, C.muted);
    api.text(
      ctx,
      record ? 'Slot ' + record.verdict : 'Awaiting receipt',
      580,
      y,
      41,
      record ? C.yellow : C.muted,
    );
    if (record) {
      api.arrow(ctx, 780, y - 13, 900, y - 13, C.muted, 3);
      const name = identity(record);
      api.text(
        ctx,
        showName ? names[name] : '?',
        950,
        y,
        42,
        showName ? (name === 'compact' ? C.green : C.cyan) : C.ink,
      );
    }
  });
}

export function drawOrderSwap(ctx, scene, state, api) {
  const { C, focus } = api;
  const progress = focus.progress('reverse-order', 0);
  const replay = focus.visible('replay');
  const receipts = replay ? conflictingSwap : stableSwap;
  const [first, second] = receipts;
  const firstSeen = focus.progress('slot-first-verdict', 0) === 1;
  const secondSeen = focus.progress(replay ? 'second-b' : 'slot-second-verdict', 0) === 1;
  const named = focus.progress(replay ? 'second-name' : 'stable-identity', 0) === 1;
  const resolved = focus.progress(replay ? 'conflicting-identities' : 'stable-identity', 0) === 1;
  const slot = secondSeen ? second.verdict : progress === 0 && firstSeen ? first.verdict : null;

  api.text(
    ctx,
    'DEP-27    /    Same replies, task, rubric and judge settings',
    145,
    240,
    31,
    C.muted,
  );
  api.focus.target('first-mapping', () => {
    ['A', 'B'].forEach((letter, i) => {
      const x = slotX[i];
      api.text(ctx, 'Slot ' + letter, x, 327, 39, C.ink);
      if (letter === slot) api.text(ctx, 'Selected', x + cardWidth, 327, 32, C.yellow, 'right');
      api.line(
        ctx,
        x,
        347,
        x + cardWidth,
        347,
        letter === slot ? C.yellow : C.muted,
        letter === slot ? 6 : 2,
      );
    });
  });

  // Separate the two paths vertically before either reply crosses the center.
  const slide = api.phase(progress, 0.2, 0.8);
  const lift = Math.min(api.phase(progress, 0, 0.2), 1 - api.phase(progress, 0.8, 1));
  api.focus.target('swapped-mapping', () => {
    first.order.forEach((id, i) => {
      const x = api.lerp(slotX[i], slotX[1 - i], slide);
      const y = 474 + (i ? 1 : -1) * 102 * lift;
      reply(ctx, api, id, x, y);
    });
  });

  api.line(ctx, 145, 728, 1775, 728, C.muted, 2);
  receiptRow(
    ctx,
    api,
    'first-receipt',
    'First call',
    790,
    firstSeen ? first : null,
    focus.progress('first-name', 0) === 1,
  );
  if (progress > 0 || focus.visible('slot-second-verdict'))
    receiptRow(
      ctx,
      api,
      'second-receipt',
      'Reversed order',
      866,
      secondSeen ? second : null,
      named,
    );
  if (focus.visible('ask-stable') || replay) {
    api.focus.target('decision', () => {
      const outcome = resolved ? aggregateSwaps(first, second) : null;
      const prompt = replay
        ? 'Which reply does the second B name? Can we record a winner?'
        : 'Do both receipts pick the same reply?';
      const decision =
        outcome === 'unresolved'
          ? 'Unresolved   /   Retain both receipts'
          : outcome
            ? 'One preference   /   ' + names[outcome]
            : prompt;
      api.text(ctx, decision, 960, 988, 43, resolved && replay ? C.pink : C.ink, 'center', 'serif');
    });
  }
}

export default {
  id: 'order-swap',
  draw: drawOrderSwap,
  cues: [
    'first-slots',
    'slot-first-verdict',
    'first-name',
    'reverse-order',
    'slot-second-verdict',
    'ask-stable',
    'stable-identity',
    'replay',
    'second-b',
    'ask-conflict',
    'second-name',
    'conflicting-identities',
  ],
};
