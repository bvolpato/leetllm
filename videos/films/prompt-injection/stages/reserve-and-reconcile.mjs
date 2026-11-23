import { cueBegun, cueProgress } from '../arithmetic.mjs';
import { drawPromptText } from '../defaults.mjs';

export function drawReserveAndReconcile(ctx, scene, state, api) {
  const { C } = api;
  const begun = (id) => cueBegun(state.cues, id, false);
  const progress = (id) => cueProgress(state.cues, id, 0);
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const text = (s, x, y, size, color = C.ink) => drawPromptText(ctx, api, s, x, y, size, color);
  const lookedUp = begun('recovery-status');
  const reserved = begun('recovery-reserve');
  const copies = [
    { name: 'A', y: 485, revealed: begun('recovery-before'), sent: false },
    { name: 'B', y: 735, revealed: begun('recovery-commit'), sent: true },
  ];

  text(
    reserved
      ? 'OP-9   /   Recovery design with a durable reservation'
      : 'OP-9   /   Two possible histories of the same operation',
    118,
    258,
    32,
    C.blue,
  );
  text('Worker', 200, 355, 35);
  text('Release service', 775, 355, 35);
  text(lookedUp ? 'Recovery lookup' : 'Worker’s inbox', 1370, 355, 35);
  for (const row of copies) {
    const { name, y, revealed, sent } = row;
    const sendProgress = sent ? progress('recovery-commit') : 0;
    const commitVisible = sent && after('recovery-commit');
    const crashVisible = !sent && after('recovery-before');
    const lost = sent && begun('recovery-lost');
    api.focus.target('recovery-worker-' + name.toLowerCase(), () => {
      text(name, 120, y + 19, 54, C.blue);
      text(reserved ? 'Reserve OP-9' : 'Approval removed', 200, y + 5, 33);
      text(reserved ? 'Durable record' : 'Local record', 200, y + 54, 28, C.muted);
    });
    api.focus.target('recovery-service-' + name.toLowerCase(), () => {
      api.line(ctx, 523, y, 722, y, C.muted, 3);
      if (revealed && sent) {
        api.line(ctx, 523, y, 523 + 199 * sendProgress, y, C.cyan, 5);
        api.circle(ctx, 523 + 199 * sendProgress, y, 10, C.cyan);
      }
      if (crashVisible) {
        api.line(ctx, 604, y - 15, 632, y + 15, C.pink, 5);
        api.line(ctx, 604, y + 15, 632, y - 15, C.pink, 5);
      }
      api.rect(ctx, 751, y - 70, 470, 142, C.panel, revealed ? C.blue : C.muted, 8);
      text(
        commitVisible ? 'OP-9   ·   Committed' : crashVisible ? 'No dispatch' : 'Status unknown',
        780,
        y - 7,
        36,
        revealed ? C.ink : C.muted,
      );
      if (commitVisible || crashVisible)
        text(
          commitVisible ? '1 release recorded' : '0 releases recorded',
          780,
          y + 44,
          29,
          commitVisible ? C.green : C.muted,
        );
    });
    api.focus.target('recovery-inbox-' + name.toLowerCase(), () => {
      if (lost && !lookedUp) {
        const distance = 92 * progress('recovery-lost');
        api.line(ctx, 1227, y, 1227 + distance, y, C.yellow, 4);
        if (!after('recovery-lost')) api.circle(ctx, 1227 + distance, y, 9, C.yellow);
        else {
          api.line(ctx, 1306, y - 14, 1332, y + 14, C.pink, 4);
          api.line(ctx, 1306, y + 14, 1332, y - 14, C.pink, 4);
        }
      }
      if (lookedUp) {
        const checked = after('recovery-status');
        api.line(ctx, 1227, y, 1227 + 96 * progress('recovery-status'), y, C.cyan, 4);
        text(
          checked ? (sent ? 'Recover result' : 'Check retry policy') : 'Query OP-9',
          1370,
          y + 6,
          38,
          C.cyan,
        );
      } else text('No receipt', 1370, y + 6, 43, C.yellow);
      api.line(ctx, 1370, y + 49, 1750, y + 49, C.muted, 2);
    });
  }

  api.focus.target('recovery-question', () => {
    const message = after('recovery-proof')
      ? 'OP-9 receipt recovered   ·   1 release on record'
      : lookedUp
      ? 'Read the OP-9 record before retrying.'
      : reserved
        ? 'One reservation for the same operation and arguments'
        : begun('recovery-question') && !begun('recovery-before')
          ? 'Can either worker tell from its inbox whether the release happened?'
          : begun('recovery-lost')
            ? 'Same empty inbox. Different release counts.'
            : '';
    api.line(ctx, 120, 887, 1800, 887, C.muted, 2);
    if (message) text(message, 122, 965, 39, lookedUp ? C.cyan : C.ink);
  });
}
export default {
  id: 'reserve-and-reconcile',
  draw: drawReserveAndReconcile,
  cues: [
    'recovery-local',
    'recovery-inbox',
    'recovery-question',
    'recovery-before',
    'recovery-commit',
    'recovery-lost',
    'recovery-reserve',
    'recovery-status',
    'recovery-proof',
  ],
};
