import { alignmentMissingPair } from '../construction.mjs';
import { progress, heard } from '../clock.mjs';

export function drawUnseenProbability(ctx, scene, state, api) {
  const { C } = api;
  // Each column transfers all five of its percentage points in one change.
  const transferred = Math.round(8 * progress(state, 'mass-move', 2));
  const policy = alignmentMissingPair(transferred / 8);
  const [ticket, grant, exception] = policy.probabilities.map((p) => Math.round(p * 100));
  const colors = [C.green, C.blue, C.pink];
  api.focus.target('mass-grid', () => {
    api.text(ctx, 'One square = 1% chance of generating a reply', 120, 285, 38, C.ink);
    for (let col = 0; col < 20; col++) {
      for (let row = 0; row < 5; row++) {
        const reply = col >= grant ? 2 : row < 4 ? 0 : 1;
        api.rect(ctx, 125 + col * 55, 395 + row * 55, 48, 48, colors[reply], null, 3);
      }
    }
    for (const [i, [name, count]] of [
      ['A  ·  Open ticket', ticket],
      ['B  ·  Grant access', grant],
      ['C  ·  Invent exception', exception],
    ].entries()) {
      const y = 412 + i * 110;
      api.text(ctx, name, 1290, y, 35, colors[i]);
      api.text(ctx, count + '%', 1290, y + 57, 46, C.ink);
    }
  });
  api.focus.target('pair-odds', () => {
    api.text(ctx, 'Stored vote   A over B', 125, 762, 36, C.ink);
    api.text(
      ctx,
      'A/B = ' + ticket + '/' + grant + ' = ' + policy.odds.toFixed(0),
      125,
      836,
      48,
      C.yellow,
    );
    api.text(ctx, 'Equal reference shares    ·    β = 0.1', 125, 900, 29, C.muted);
  });
  const answer = heard(state, 'mass-answer', 3);
  api.focus.target('pair-losses', () => {
    if (state.beat >= 1) {
      api.text(ctx, 'Loss on the A-over-B vote', 1080, 762, 36, C.ink);
      const first = alignmentMissingPair(0).loss.toFixed(5);
      const loss =
        state.beat < 2 ? first : first + '   →   ' + (answer ? policy.loss.toFixed(5) : '?');
      api.text(ctx, loss, 1080, 839, 49, C.yellow);
    }
  });
  api.focus.target('pair-coverage', () => {
    const newPair = heard(state, 'mass-new-pair', 3);
    if (state.beat >= 2) {
      const status = newPair
        ? 'New comparison to collect    A  ·  ticket     vs.     C  ·  invented exception'
        : answer
          ? 'The file contains one comparison. C never appears in it.'
          : 'Would the loss rise, fall or stay the same?';
      api.text(ctx, status, 960, 985, 35, newPair ? C.green : C.ink, 'center');
    }
  });
}

export default {
  id: 'unseen-probability',
  draw: drawUnseenProbability,
  cues: ['mass-key', 'mass-odds', 'mass-move', 'mass-answer', 'mass-new-pair'],
};
