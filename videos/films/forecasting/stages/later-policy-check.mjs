import { timedForecastScene } from '../construction.mjs';
import { errors, intervalHalfWidth, weekdayNames } from '../fixtures.mjs';
import { text } from '../defaults.mjs';

const x = (error) => 845 + error * 125;
const row = (i) => 394 + i * 67;
const trialWidth = 2;

const scene = timedForecastScene('later-policy-check', (ctx, api, clock) => {
  const { C } = api;
  const half = api.lerp(intervalHalfWidth, trialWidth, clock.progress('narrow'));
  const signed = (n) => (n > 0 ? '+' + n : String(n));
  const crossings = errors.filter((n) => Math.abs(n) > half).length;
  api.focus.target('week-band', () => {
    text(ctx, api, 'Daily forecast errors  ·  jobs', 145, 239, 35, C.ink, 'left');
    text(ctx, api, 'Both edges included', 1740, 239, 28, C.muted, 'right');
    api.rect(ctx, x(-half), 341, x(half) - x(-half), 491, '#192e40', undefined, 0);
    for (const k of [-half, half]) api.line(ctx, x(k), 341, x(k), 832, C.blue, 4);
    for (let i = -4; i <= 5; i++) text(ctx, api, signed(i), x(i), 309, 28, C.muted);
    errors.forEach((error, i) => {
      const yy = row(i),
        outside = Math.abs(error) > half;
      text(ctx, api, weekdayNames[i], 257, yy + 10, 30, C.ink, 'right');
      api.line(ctx, x(-4), yy, x(5), yy, '#37414b', 1);
      if (error <= 5) {
        api.circle(ctx, x(error), yy, 12, outside ? C.pink : C.cyan);
      } else {
        api.line(ctx, x(5) + 15, yy, x(5) + 84, yy, C.pink, 4);
        api.line(ctx, x(5) + 71, yy - 10, x(5) + 84, yy, C.pink, 4);
        api.line(ctx, x(5) + 71, yy + 10, x(5) + 84, yy, C.pink, 4);
        text(ctx, api, signed(error) + ' jobs', x(5) + 103, yy + 10, 30, C.pink, 'left');
      }
    });
  });
  api.focus.target('week-tally', () => {
    const question = clock.progress('ask') > 0 && clock.progress('narrow') === 0;
    const label = question
      ? 'Proposed band  [−2, +2]    ·    Which day would join Friday?'
      : clock.after('coverage')
        ? errors.length -
          crossings +
          ' of 7 days covered   ·   ' +
          crossings +
          ' crossings   ·   Was Tuesday actionable?'
        : 'Current half-width  ' +
          half.toFixed(1) +
          ' jobs   ·   ' +
          crossings +
          (crossings === 1 ? ' crossing' : ' crossings');
    text(ctx, api, label, 960, 940, 38, question ? C.yellow : C.ink);
  });
});

export const drawLaterPolicyCheck = scene.draw;
export default scene;
