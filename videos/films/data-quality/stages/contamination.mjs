import { fingerprint } from '../fixtures.mjs';

const training = ['migration blocked for 12 days', 'runbook link updated'];
const locked = ['MIGRATION blocked for 12 days', 'incident review still pending'];
const trainKeys = new Set(training.map(fingerprint));

export function drawContamination(ctx, scene, state, api) {
  const { C, focus, text, line, rect } = api;
  const showKeys = focus.progress('overlap-keys') > 0;
  const tested = focus.progress('overlap-result') > 0;
  focus.target('overlap-register', () => {
    text(ctx, 'Training snapshot', 135, 300, 40, C.blue);
    text(ctx, 'Locked evaluation set', 1005, 300, 40, C.cyan);
    [training, locked].forEach((rows, side) => {
      const x = 135 + side * 870;
      rows.forEach((message, i) => {
        const y = 352 + i * 190;
        const key = fingerprint(message);
        const match = trainKeys.has(key);
        rect(ctx, x, y, 790, 150, C.panel, tested && i === 0 ? C.yellow : C.muted, 6);
        text(ctx, message, x + 28, y + 64, 39);
        if (showKeys) text(ctx, key.slice(0, 12), x + 28, y + 121, 31, C.blue, 'left', 'mono');
        if (tested && side === 1)
          text(
            ctx,
            match ? 'found in training' : 'no exact match',
            x + 757,
            y + 121,
            27,
            match ? C.yellow : C.muted,
            'right',
          );
      });
    });
    if (tested) line(ctx, 925, 429, 1005, 429, C.yellow, 5);
    text(
      ctx,
      showKeys ? 'Compared using all 64 hex digits' : 'Normalize case and spacing before lookup',
      960,
      791,
      32,
      C.muted,
      'center',
    );
    text(
      ctx,
      tested
        ? 'Set the matching item aside and trace its source.'
        : 'Which locked message has a copy in training?',
      960,
      916,
      47,
      tested ? C.yellow : C.ink,
      'center',
      'serif',
    );
  });
}
export default {
  id: 'contamination',
  draw: drawContamination,
  cues: ['overlap-keys', 'overlap-result'],
};
