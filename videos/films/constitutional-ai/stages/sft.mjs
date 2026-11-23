import { revisionDistribution, voice } from '../construction.mjs';

export function drawSft(ctx, scene, state, api) {
  const { C } = api;
  const t = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  if (state.beat >= 3) {
    const fixed = voice(state, 'sft-helpful', 3) > 0;
    t('Public freeze runbook', 125, 302, 35, C.cyan);
    api.focus.target('training-request', () =>
      t('“Can we edit the docs during the freeze?”', 125, 409, 60),
    );
    api.line(ctx, 125, 475, 1795, 475, C.muted, 2);
    t('Reply from the incident example', 125, 582, 34, C.muted);
    t('Please request access through the support portal.', 125, 667, 48, fixed ? C.muted : C.ink);
    api.focus.target('training-target', () => {
      t('Target for the public request', 125, 800, 35, C.cyan);
      t(
        fixed ? 'Yes, documentation edits may continue.' : '…',
        125,
        896,
        57,
        fixed ? C.green : C.muted,
      );
    });
    return;
  }
  const step = voice(state, 'sft-step', 2);
  const example = revisionDistribution(2, step);
  const isTarget = voice(state, 'sft-target', 0) > 0;
  const showBars = state.beat >= 1;
  t('Case 17    /    revised answer', 125, 273, 34, C.blue);
  api.focus.target('answer-tokens', () => t('Please request', 125, 396, 66, C.ink));
  api.focus.target('selected-word', () =>
    t(isTarget ? example.words[2] : '…', 625, 396, 66, C.yellow),
  );
  t('through the support portal.', 885, 396, 61, C.muted);
  api.line(ctx, 125, 430, 592, 430, C.blue, 4);
  t('Request + these earlier words', 125, 488, 30, C.blue);
  if (isTarget) t('Target word', 625, 488, 30, C.yellow);
  if (!showBars) {
    if (isTarget) t('Predict the next token from its prefix.', 125, 731, 48);
    return;
  }
  const showStart = voice(state, 'sft-before', 1) > 0;
  api.focus.target('next-token-distribution', () => {
    t('Probability in a three-word vocabulary', 125, 606, 34, C.muted);
    example.choices.forEach((word, i) => {
      const y = 683 + i * 105;
      const color = i === 0 ? C.yellow : C.blue;
      t(word, 125, y + 26, 38, color);
      api.line(ctx, 335, y + 38, 905, y + 38, C.muted, 2);
      if (!showStart) return;
      const p = example.probabilities[i];
      api.rect(ctx, 335, y - 6, p * 570, 40, color, undefined, 3);
      const x = 335 + example.before[i] * 570;
      api.line(ctx, x, y + 45, x, y + 60, C.ink, 3);
      t(p.toFixed(3), 935, y + 26, 37, color);
    });
  });
  api.focus.target('target-loss', () => {
    t('Loss on “access”', 1180, 607, 38, C.yellow);
    if (state.beat < 2) {
      t('If its probability rises,', 1180, 725, 43);
      t('what happens to its loss?', 1180, 785, 43);
    } else {
      t('−ln(' + example.probabilities[0].toFixed(3) + ')', 1180, 748, 60);
      t(example.loss.toFixed(3) + ' nats', 1180, 850, 75, C.green);
      t('Before the step    ' + example.beforeLoss.toFixed(3) + ' nats', 1180, 929, 29, C.muted);
    }
  });
  if (step) t('White ticks mark the probabilities before the step.', 125, 1000, 29, C.muted);
}
export default {
  id: 'sft',
  draw: drawSft,
  cues: [
    'sft-prefix',
    'sft-target',
    'sft-before',
    'sft-wager',
    'sft-step',
    'sft-loss',
    'sft-public',
    'sft-helpful',
  ],
};
