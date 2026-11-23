import { motion, settled } from '../construction.mjs';
import { freshHandoff } from '../model.mjs';
import { line, payloadSlots, slot, text } from '../defaults.mjs';

export function drawFreshHandoff(ctx, scene, state, api) {
  const { C } = api;
  const s = freshHandoff(state);
  const split = state.beat >= 2;
  const signalsShown = settled(state, 'fresh-stamps', 2, 0.6);
  const launch = motion(state, 'fresh-launch', 3, 0.23, 0.51);
  const read = motion(state, 'fresh-read', 3, 0.51, 0.57);

  if (!split) {
    const compared = Math.ceil(s.tokens.length * motion(state, 'fresh-path', 0, 0.07, 0.27));
    const namespaceKnown = settled(state, 'fresh-b', 0, 0.42);
    const receiving = motion(state, 'fresh-input', 0, 0.54, 0.78) > 0;
    const inventoryKnown = settled(state, 'fresh-input', 0, 0.78);
    api.focus.target('fresh-key', () => {
      text(ctx, api, 'Stored in A', 145, 346, 38, C.blue);
      text(ctx, api, namespaceKnown ? 'Requested in B' : 'Request', 145, 460, 38, C.blue);
      s.tokens.forEach((v, i) => {
        const x = 580 + i * 155 + (i >= s.page ? 30 : 0);
        slot(ctx, api, v, x, 279, 132, 91, C.blue);
        slot(ctx, api, i < compared ? v : '', x, 398, 132, 91, i < compared ? C.blue : C.muted);
      });
      line(ctx, api, 580, 514, 1177, 514, C.cyan, 3);
      text(ctx, api, 'One 4-token page', 880, 568, 32, C.cyan, 'center');
      if (s.reuseShown)
        text(ctx, api, s.reusable + ' reused from A', 1722, 568, 34, C.pink, 'right');
    });
    api.focus.target('fresh-buffer', () => {
      if (!namespaceKnown) return;
      text(ctx, api, 'B’s own transfer   ·   attempt 2', 145, 692, 38, C.ink);
      if (!receiving) return;
      text(
        ctx,
        api,
        (inventoryKnown ? Math.floor(s.receivedMiB) : '?') + ' / 96 MiB received',
        1730,
        692,
        38,
        C.cyan,
        'right',
      );
      payloadSlots(ctx, api, {
        x: 145,
        y: 735,
        width: 1585,
        height: 82,
        received: inventoryKnown ? s.receivedMiB : 0,
        reserved: 96,
        segments: 3,
      });
      if (s.missingShown)
        text(ctx, api, Math.ceil(s.missingMiB) + ' MiB missing', 1730, 890, 34, C.cyan, 'right');
    });
    if (inventoryKnown) {
      const note =
        state.beat === 0
          ? 'How many positions can B reuse from A? How much of B’s transfer is missing?'
          : s.missingMiB > 0
            ? 'B’s own KV is still arriving.'
            : 'The full buffer is waiting for the ready event.';
      text(ctx, api, note, 960, 982, 36, state.beat === 0 ? C.yellow : C.ink, 'center');
    }
    return;
  }

  text(
    ctx,
    api,
    'Same B request   ·   current attempt 2   ·   compatible layout',
    146,
    295,
    39,
    C.ink,
  );
  const cases = [
    { name: 'Left replay', x: 146, signal: 1, gate: s.stale },
    { name: 'Right replay', x: 1012, signal: 2, gate: s },
  ];
  for (const [i, trial] of cases.entries()) {
    const { x } = trial;
    const key = i ? 'right' : 'left';
    text(ctx, api, trial.name, x, 408, 38, C.ink);
    text(ctx, api, '96 / 96 MiB', x, 489, 34, C.cyan);
    payloadSlots(ctx, api, {
      x,
      y: 517,
      width: 744,
      height: 62,
      received: s.receivedMiB,
      reserved: 96,
      segments: 3,
    });
    if (s.decode && trial.gate.canDecode && read > 0) {
      const cursor = x + 744 * read;
      line(ctx, api, x, 596, cursor, 596, C.green, 7);
      line(ctx, api, cursor, 583, cursor, 607, C.green, 5);
    }
    api.focus.target('fresh-event-' + key, () => {
      text(ctx, api, 'Ready event', x, 670, 33, C.muted);
      slot(
        ctx,
        api,
        (i ? s.ready : signalsShown) ? 'Attempt ' + trial.signal : 'Awaiting event',
        x,
        703,
        305,
        91,
        C.blue,
        37,
      );
    });
    const revealed = s.decode;
    api.focus.target('fresh-reader-' + key, () => {
      const cx = x + 460;
      line(ctx, api, x + 323, 748, cx - 24, 748, C.muted, 3);
      if (revealed && trial.gate.canDecode && launch > 0)
        api.circle(ctx, x + 323 + (cx - 24 - x - 323) * launch, 748, 11, C.green);
      slot(
        ctx,
        api,
        revealed ? (trial.gate.canDecode ? 'Read KV' : 'Hold') : 'Read KV?',
        cx,
        703,
        284,
        91,
        revealed ? (trial.gate.canDecode ? C.green : C.pink) : C.yellow,
        39,
      );
      if (revealed && (!i || launch >= 1))
        text(
          ctx,
          api,
          i ? 'B’s decode step starts' : 'Await ready for attempt 2',
          x,
          882,
          34,
          i ? C.green : C.ink,
        );
    });
  }
  text(
    ctx,
    api,
    !s.decode
      ? 'Which replay can start decode?'
      : 'Both replays still reuse 0 positions from namespace A.',
    960,
    984,
    37,
    !s.decode ? C.yellow : C.ink,
    'center',
  );
}

export default {
  id: 'fresh-handoff',
  draw: drawFreshHandoff,
  cues: [
    'fresh-path',
    'fresh-b',
    'fresh-input',
    'sg-fresh-zero',
    'sg-fresh-missing',
    'sg-fresh-fill',
    'fresh-stamps',
    'sg-fresh-ready',
    'sg-fresh-decode',
    'fresh-launch',
    'fresh-read',
  ],
};
