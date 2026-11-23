import { cueProgress, fieldDrawing } from '../field-drawing.mjs';
import { manuals } from '../fixtures.mjs';

function drawTickets(p, split, checked, local) {
  const { C, text, rect, target } = p;
  const outcomes = ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'error', 'review', 'review'];
  const answered = outcomes.filter((result) => result !== 'review').length;
  const errors = outcomes.filter((result) => result === 'error').length;
  target('ticket-outcomes', () => {
    text('Example cutoff  0.8', 150, 304, 50);
    text('Ten held-out tickets', 150, 404, 36, C.muted);
    outcomes.forEach((result, i) => {
      const x = 150 + i * 161;
      const review = split && result === 'review';
      const wrong = checked && result === 'error';
      const color = wrong ? C.pink : review ? C.yellow : split ? C.cyan : C.muted;
      rect(x, 455, 145, 128, C.panel, color, 8);
      text(String(i + 1), x + 72, 512, 42, C.ink, 'center');
      if (split)
        text(wrong ? 'wrong' : review ? 'review' : 'answered', x + 72, 555, 27, color, 'center');
    });
    if (split) {
      text(answered + ' / ' + outcomes.length + ' answered', 150, 692, 53, C.cyan);
      text(outcomes.length - answered + ' sent to review', 1250, 692, 48, C.yellow);
    }
    if (checked) text(errors + ' error / ' + answered + ' answers', 150, 790, 48, C.pink);
  });
  target('route-decision', () =>
    text(
      local ? 'All ten tickets stay on this handheld.' : 'Restricted handheld',
      960,
      938,
      43,
      local ? C.yellow : C.muted,
      'center',
    ),
  );
}

export function drawHybridScores(ctx, scene, state, api) {
  const p = fieldDrawing(ctx, api);
  const { C, text, rect, target } = p;
  const b = state.beat ?? 0;
  const ready = (key, beat, start, end) => cueProgress(state, key, beat, start, end) === 1;
  if (b === 2) {
    drawTickets(
      p,
      ready('answered-eight', 2, 0.15, 0.3),
      ready('one-wrong', 2, 0.31, 0.42),
      ready('edge-hybrid-scores-authority', 2, 0.75, 0.85),
    );
    return;
  }
  const certain = b > 0 || ready('edge-hybrid-scores-certain', 0, 0.83, 0.96);
  const probs = certain ? [1, 0] : [0.5, 0.5];
  const entropy = -probs.reduce((sum, v) => sum + (v ? v * Math.log2(v) : 0), 0);
  target('edge-hybrid-scores-mechanism', () => {
    text('Next-token probabilities', 150, 305, 45);
    probs.forEach((v, i) => {
      const x = 175 + i * 390;
      rect(x, 395, 270, 325, C.panel, C.muted);
      if (v) rect(x, 720 - v * 325, 270, v * 325, i === 0 ? C.blue : C.cyan);
      const name = b === 0 ? 'Token ' + (i + 1) : i === 0 ? 'covered' : 'other';
      text(name + '   ' + v.toFixed(1), x, 787, 37);
    });
    if (b === 0) {
      if (ready('edge-hybrid-scores-entropy', 0, 0.63, 0.83)) {
        text('Entropy', 1050, 454, 39, C.muted);
        text(entropy + ' ' + (entropy === 1 ? 'bit' : 'bits'), 1050, 549, 78);
        text('Top-two margin', 1050, 673, 39, C.muted);
        text(String(probs[0] - probs[1]), 1050, 767, 78);
      }
      return;
    }
    const wrong = ready('edge-hybrid-scores-wrong', 1, 0.22, 0.37);
    text('Sensor A   /   E2', 1040, 450, 49);
    text('Manual page M7', 1040, 560, 37, C.muted);
    if (wrong) {
      text(manuals.M7.meaning, 1040, 661, 72, C.yellow);
      text('“covered” misses the fault.', 1040, 785, 40, C.pink);
    }
  });
}

export default {
  id: 'hybrid-scores',
  draw: drawHybridScores,
  cues: [
    'edge-hybrid-scores-op-0',
    'edge-hybrid-scores-entropy',
    'edge-hybrid-scores-certain',
    'edge-hybrid-scores-op-1',
    'edge-hybrid-scores-wrong',
    'edge-hybrid-scores-op-2',
    'answered-eight',
    'one-wrong',
    'edge-hybrid-scores-authority',
  ],
};
