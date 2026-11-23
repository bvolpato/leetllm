import { drawTable } from '../defaults.mjs';
import { sceneCues } from '../picture.mjs';

export function drawAuthorizedRouting(ctx, scene, state, api) {
  const cue = sceneCues(scene, state);
  const { C } = api;
  api.focus.target('authorized-routing-mechanism', () => {
    if (state.beat === 0) {
      drawTable(
        ctx,
        api,
        [
          ['Caller token', 'Environment', 'Expiry after now?', 'Production route'],
          ['Production', 'Production', 'Yes', cue.after('routing-allow') ? 'Allow' : ''],
          ['Expired', 'Production', 'No', 'Deny'],
          ['Staging', 'Staging', 'Yes', 'Deny'],
        ],
        150,
        335,
        1620,
        125,
      );
      return;
    }
    if (state.beat === 1) {
      const left = 620,
        right = 1620;
      api.text(ctx, 'Production primary', 145, 335, 41, C.ink);
      api.text(ctx, '503', left, 335, 55, C.pink, 'center');
      api.line(ctx, left, 451, right, 451, C.muted, 4);
      for (let i = 0; i <= 10; i++) {
        const x = left + ((right - left) * i) / 10;
        api.line(ctx, x, 443, x, 466, C.muted, 3);
      }
      api.text(ctx, '100', left, 530, 40, C.ink, 'center');
      api.text(ctx, '110', right, 530, 40, C.ink, 'center');
      const progress = cue.progress('authorized-routing-b2');
      if (progress > 0) {
        api.line(ctx, left, 451, left + (right - left) * progress, 451, C.yellow, 17);
        api.text(ctx, 'Cooldown', 145, 464, 41, C.yellow);
      }
      if (cue.after('authorized-routing-b2')) {
        api.text(ctx, 'During cooldown', 145, 650, 38, C.muted);
        api.text(ctx, 'Use approved production backup', left, 650, 51, C.cyan);
      }
      if (cue.after('routing-retry'))
        api.text(ctx, 'Retry allowed', right, 335, 42, C.yellow, 'center');
      if (cue.started('routing-quota')) {
        api.line(ctx, 145, 763, 1775, 763, C.muted, 2);
        api.text(ctx, 'If the reply is 429', 145, 874, 40, C.ink);
        if (cue.after('routing-limited'))
          api.text(ctx, 'Return rate limit to caller', left, 874, 46, C.ink);
      }
      return;
    }
    const checks = [
      ['Data', 'May this backup receive the request?'],
      ['Capacity', 'Can it carry the production load?'],
      ['Answer quality', 'Does it pass the same release cases?'],
    ];
    checks.forEach(([label, question], i) => {
      const y = 370 + i * 195;
      api.text(ctx, label, 160, y, 47, C.cyan);
      api.text(ctx, question, 650, y, 52, C.ink);
      api.line(ctx, 160, y + 54, 1760, y + 54, C.panel, 3);
    });
  });
}

export default {
  id: 'authorized-routing',
  draw: drawAuthorizedRouting,
  cues: [
    'authorized-routing-b1',
    'routing-allow',
    'authorized-routing-b2',
    'routing-retry',
    'routing-quota',
    'routing-limited',
    'authorized-routing-b3',
  ],
};
