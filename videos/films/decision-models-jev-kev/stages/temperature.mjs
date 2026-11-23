import { softmax } from '../arithmetic.mjs';
import { pointer } from '../fixtures.mjs';
import { phraseProgress, phraseStarted } from '../clock.mjs';
import { drawScoreOptions, rowY, shareBar } from '../score-rows.mjs';

function drawThermometer(ctx, state, api) {
  const { C } = api;
  const initial = softmax(pointer);
  const temperature = 1 + phraseProgress(state, api, 'raise-temp', 1, 0.02, 0.19);
  const current = softmax(pointer, temperature);
  drawScoreOptions(ctx, api);
  api.text(ctx, 'Fixed logit', 815, 285, 35, C.muted, 'center');
  api.text(ctx, 'Logit / T', 1095, 285, 35, C.muted, 'center');
  api.text(ctx, 'Option probability', 1310, 285, 35, C.muted);
  pointer.forEach((score, i) => {
    const y = rowY(i);
    api.text(ctx, score.toFixed(3), 815, y, 49, C.ink, 'center');
    api.focus.target('temperature-value', () =>
      api.text(ctx, (score / temperature).toFixed(3), 1095, y, 47, C.yellow, 'center'),
    );
    api.focus.target('pointer-distribution', () => {
      const color = i === 1 ? C.cyan : C.blue;
      shareBar(ctx, api, 1310, y, 320, current[i], { original: initial[i], color });
      api.text(ctx, current[i].toFixed(3), 1804, y, 44, color, 'right');
    });
  });
  api.line(ctx, 110, 850, 1810, 850, C.muted, 2);
  api.focus.target('temperature-value', () =>
    api.text(ctx, 'Temperature   ' + temperature.toFixed(2), 110, 947, 48, C.yellow),
  );
  api.text(
    ctx,
    state.beat === 0
      ? 'At T = 2, what happens to B’s share and rank?'
      : 'Ticks show the shares at T = 1',
    885,
    947,
    36,
    C.muted,
  );
}

function drawReadouts(ctx, state, api) {
  const { C } = api;
  const rows = [
    ['Kev', 'Option and decision markers', 'Learned comparison', 'B', 'kev-origin', 'kev-readout'],
    [
      'SemIf',
      'Frozen model at next position',
      'Read letter logits',
      'B',
      'semif-origin',
      'semif-readout',
    ],
    ['Tev1', 'Prompt + one-letter target', 'Generate letter', 'B', 'tev-origin', 'tev-readout'],
    [
      'Jev',
      'Provider reports parallel decisions',
      'RLCD recipe undisclosed',
      'B',
      'jev-boundary',
      'jev-readout',
    ],
  ];
  api.text(ctx, 'Service', 110, 276, 38, C.muted);
  api.text(ctx, 'Source of the answer', 540, 276, 38, C.muted);
  api.text(ctx, 'Typed ID', 1710, 276, 35, C.muted, 'center');
  rows.forEach(([name, origin, operation, answer, cue, target], i) => {
    const relevantBeat = i === 3 ? 3 : 2;
    if (i > 0 && !phraseStarted(state, cue, relevantBeat, [0, 0.33, 0.58, 0.05][i])) return;
    const y = 393 + i * 158;
    const color = i === 3 ? C.yellow : C.cyan;
    api.focus.target(target, () => {
      api.text(ctx, name, 113, y + 17, 54, C.ink);
      api.text(ctx, origin, 540, y, 41, C.ink);
      api.text(ctx, operation, 540, y + 54, 32, C.muted);
      api.arrow(ctx, 1420, y + 3, 1599, y + 3, color, 3);
      api.text(ctx, answer, 1710, y + 19, 57, color, 'center');
    });
  });
}
export function drawTemperature(ctx, scene, state, api) {
  if (state.beat < 2) drawThermometer(ctx, state, api);
  else drawReadouts(ctx, state, api);
}
export default {
  id: 'temperature',
  draw: drawTemperature,
  cues: [
    'temp-original',
    'temp-call',
    'raise-temp',
    'read-shares',
    'kev-origin',
    'semif-origin',
    'tev-origin',
    'jev-boundary',
  ],
};
