import { onlineCueProgress } from '../construction.mjs';
import { axis, line, text } from '../defaults.mjs';

export function drawValidLooking(ctx, scene, state, api) {
  const { C } = api;
  const budget = 0.05;
  const planned = 4;
  const seen = 2;
  const value = 0.016;
  const p = (id, beat) => onlineCueProgress(state, id, beat);
  const penciled = p('divisor-two', 1);
  const answer = p('divisor-keep', 2) === 1;
  if (state.beat === 3) {
    text(ctx, api, 'When may the team check for a difference?', 150, 278, 41);
    const methods = [
      ['One fixed horizon', 'One final analysis after follow-up', 'divisor-fixed'],
      [
        'Scheduled interim looks',
        'Later looks can spend more of the error budget',
        'divisor-scheduled',
      ],
      [
        'Always-valid inference',
        'Monitoring times allowed by the chosen method',
        'divisor-continuous',
      ],
    ];
    methods.forEach(([name, detail, cue], i) => {
      const y = 414 + i * 180;
      api.focus.target(cue + '-lane', () => {
        text(ctx, api, name, 150, y + 15, 37);
        line(ctx, api, 790, y, 1650, y, C.border, 4);
        if (p(cue, 3) === 0) return;
        if (i === 2) line(ctx, api, 790, y, 1650, y, C.cyan, 8);
        else
          for (const mark of i === 0 ? [1] : [0.25, 0.5, 0.75, 1]) {
            const x = 790 + 860 * mark;
            api.circle(ctx, x, y, 12, C.yellow);
          }
        text(ctx, api, detail, 790, y + 66, 30, C.muted);
      });
    });
    return;
  }
  text(ctx, api, 'Four looks registered before enrollment', 150, 270, 40);
  const start = 220;
  const width = 350;
  for (let i = 0; i < planned; i++) {
    const left = start + i * width;
    const y = 335;
    api.rect(ctx, left, y, width - 12, 62, i < seen ? C.blue : C.panel, undefined, 3);
    text(
      ctx,
      api,
      'Look ' + (i + 1) + (i < seen ? '  ·  observed' : '  ·  planned'),
      left + (width - 12) / 2,
      y + 107,
      29,
      i < seen ? C.blue : C.muted,
      'center',
    );
  }
  api.focus.target('divisor-ruler', () => {
    const x = axis(
      ctx,
      api,
      220,
      788,
      1450,
      0,
      budget,
      [0, 0.01, 0.02, 0.03, 0.04, 0.05],
      'p-value at look 2',
    );
    const threshold = budget / planned;
    line(ctx, api, x(threshold), 558, x(threshold), 788, C.yellow, 5);
    text(
      ctx,
      api,
      '0.05 ÷ 4 = ' + threshold.toFixed(4),
      x(threshold) - 20,
      575,
      33,
      C.yellow,
      'right',
    );
    if (p('divisor-value', 0) > 0) {
      api.circle(ctx, x(value), 706, 15, C.cyan);
      text(ctx, api, 'p = ' + value.toFixed(3), x(value) + 30, 717, 41, C.cyan);
    }
    if (penciled > 0) {
      const alternative = budget / seen;
      const mark = x(threshold + (alternative - threshold) * penciled);
      for (let y = 533; y < 675; y += 24) line(ctx, api, mark, y, mark, y + 12, C.muted, 4);
      if (penciled === 1)
        text(
          ctx,
          api,
          '0.05 ÷ 2 = ' + alternative.toFixed(3) + '  (looks so far)',
          x(alternative) + 26,
          558,
          32,
          C.muted,
        );
    }
  });
  const prompt = answer
    ? 'Keep collecting  ·  0.016 exceeds the registered 0.0125'
    : penciled === 1
      ? 'At p = 0.016, stop or keep collecting?'
      : 'Decision at the second scheduled look';
  text(ctx, api, prompt, 960, 977, 38, answer ? C.yellow : C.ink, 'center');
}
export default {
  id: 'valid-looking',
  draw: drawValidLooking,
  cues: [
    'divisor-value',
    'divisor-two',
    'divisor-keep',
    'divisor-fixed',
    'divisor-scheduled',
    'divisor-continuous',
  ],
};
