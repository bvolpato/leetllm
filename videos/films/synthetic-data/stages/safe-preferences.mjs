import { LOG_ANSWERS } from '../fixtures.mjs';
import { checkSupportLog } from '../model.mjs';

const checked = LOG_ANSWERS.map(checkSupportLog);

export function drawSafePreferences(ctx, scene, state, api) {
  const { C, focus } = api;
  const progress = (id) => focus.progress(id, 0);
  const copying = progress('sft-copy');
  focus.target('policy', () => {
    const inRecord = progress('pair-fields') === 1;
    api.text(
      ctx,
      inRecord ? 'Preference record  /  same support prompt' : 'Support prompt',
      140,
      300,
      35,
      C.blue,
    );
    api.text(ctx, 'Can we log the customer’s email for this failed search?', 140, 380, 52, C.ink);
    api.text(
      ctx,
      'Policy   ·   request ID permitted   /   customer email private',
      140,
      465,
      34,
      C.yellow,
    );
  });
  const baseline = 615;
  for (const [i, response] of checked.entries()) {
    const x = 140 + 850 * i;
    const allowed = response.allowed;
    const classified = allowed ? progress('log-winner') === 1 : progress('checked-fields') === 1;
    const color = classified ? (allowed ? C.green : C.pink) : C.cyan;
    const resultReady = progress(allowed ? 'safe-target' : 'rejected-function-result') === 1;
    const role = allowed ? 'chosen' : 'rejected';
    const result = response.emailRequest === 'declined'
      ? 'reject bypass request'
      : 'return ' + response.emailRequest + ' for email request';
    focus.target(i ? 'log-b' : 'log-a', () => {
      api.text(
        ctx,
        resultReady ? role + ' → ' + result : 'Answer ' + (i ? 'B' : 'A'),
        x,
        baseline - 52,
        32,
        color,
      );
      api.rect(ctx, x, baseline - 19, 780, 105, C.panel, color);
      if (progress('log-options') > 0)
        api.text(ctx, response.answer, x + 35, baseline + 50, 46, C.ink);
      if (classified)
        api.text(
          ctx,
          response.fields.join(', ') + (allowed ? '   ✓' : '   ×'),
          x + 35,
          baseline + 140,
          32,
          color,
          'left',
          'mono',
        );
    });
  }
  focus.target('sft-output', () => {
    if (copying > 0) {
      api.line(ctx, 140, 785, 140, 785 + 120 * copying, C.green, 5);
      api.text(ctx, 'Supervised assistant target', 173, 853, 32, C.green);
      if (copying === 1)
        api.text(ctx, checked.find((row) => row.allowed).answer, 173, 932, 48, C.ink);
    }
  });
  if (progress('log-question') > 0 && !progress('log-winner'))
    api.text(ctx, 'Which answer belongs in the training target?', 960, 935, 44, C.yellow, 'center');
}
export default {
  id: 'safe-preferences',
  draw: drawSafePreferences,
  cues: [
    'log-policy',
    'log-options',
    'log-question',
    'log-winner',
    'checked-fields',
    'pair-fields',
    'safe-target',
    'rejected-function-result',
    'sft-copy',
    'keep-rejected',
    'equal-length',
  ],
};
