import { timedForecastScene } from '../construction.mjs';
import { pinball } from '../arithmetic.mjs';
import { text } from '../defaults.mjs';

const low = 10,
  high = 100,
  small = 9,
  count = small + 1,
  q = 0.9;
const mean = (small * low + high) / count;
const x = (jobs) => 265 + (jobs - low) * 15.3;
const left = 265,
  barWidth = x(high) - left;
const maxTotal = pinball(high, low, q);

const scene = timedForecastScene('discrete-quantile', (ctx, api, clock) => {
  const { C } = api;
  const prediction = Math.round(
    low + (mean - low) * clock.progress('move') + (high - mean) * clock.progress('sweep'),
  );
  const smallLoss = small * pinball(low, prediction, q);
  const largeLoss = pinball(high, prediction, q);
  const total = smallLoss + largeLoss;
  api.focus.target('quantile-ruler', () => {
    text(ctx, api, 'Ten equally likely outcomes  ·  jobs', 152, 239, 32, C.ink, 'left');
    const counted = Math.floor(small * clock.progress('count'));
    for (let i = 0; i < count; i++) {
      const cx = 283 + i * 150;
      const outline = i < small ? C.blue : C.pink;
      api.rect(ctx, cx - 59, 277, 118, 68, i < counted ? C.cyan : C.panel, outline, 6);
      text(ctx, api, i < small ? low : high, cx, 324, 36, i < counted ? C.bg : outline);
    }
    let tally = 'Nine small counts and one large count';
    if (clock.after('mean')) tally = 'Mean  ' + mean + ' jobs     ·     1 of 10 outcomes above it';
    if (clock.progress('threshold') > 0)
      tally = 'What’s the smallest job count that covers at least nine outcomes?';
    if (counted > 0) tally = counted + ' of ' + count + ' outcomes counted';
    if (clock.after('canonical'))
      tally = small + ' of ' + count + ' outcomes at or below ' + low + ' jobs';
    text(ctx, api, tally, 960, 410, 31, C.ink);
    api.line(ctx, left, 535, x(high), 535, C.muted, 4);
    for (const v of clock.after('mean') ? [low, mean, high] : [low, high]) {
      api.line(ctx, x(v), 523, x(v), 548, C.muted, 3);
      text(ctx, api, v, x(v), 586, 31, C.muted);
    }
    if (clock.beat > 0) {
      api.circle(ctx, x(prediction), 535, 14, C.yellow);
      text(ctx, api, 'Forecast  ' + prediction, x(prediction), 493, 35, C.yellow);
    }
    if (clock.after('canonical')) {
      api.circle(ctx, x(low), 535, 15, C.bg, C.cyan, 4);
      text(ctx, api, 'P90  ' + low, x(low), 493, 36, C.cyan);
    }
  });
  api.focus.target('quantile-loss', () => {
    const legend =
      clock.progress('weights') > 0
        ? 'From 10 to 100, each extra job adds 9 × 0.10 and saves 1 × 0.90'
        : 'Loss across all ten outcomes   ·   q = 0.90';
    text(ctx, api, legend, left, 663, 32, C.ink, 'left');
    api.rect(ctx, left, 706, barWidth, 58, C.panel, C.muted, 0);
    if (!clock.after('loss')) return;
    const cut = (barWidth * smallLoss) / maxTotal;
    if (cut > 0) api.rect(ctx, left, 706, cut, 58, C.blue, undefined, 0);
    if (largeLoss > 0)
      api.rect(ctx, left + cut, 706, (barWidth * largeLoss) / maxTotal, 58, C.pink, undefined, 0);
    text(
      ctx,
      api,
      'Nine small  ·  9 × ' + (smallLoss / small).toFixed(1) + ' = ' + smallLoss.toFixed(1),
      left,
      831,
      32,
      C.blue,
      'left',
    );
    text(ctx, api, 'One large  ·  ' + largeLoss.toFixed(1), x(high), 831, 32, C.pink, 'right');
  });
  api.focus.target('quantile-average', () => {
    const label =
      clock.progress('ask') > 0 && clock.progress('move') === 0
        ? 'Move the forecast to 19. Will the average loss change?'
        : clock.after('average')
          ? 'Average loss   ' +
            total.toFixed(0) +
            ' ÷ ' +
            count +
            ' = ' +
            (total / count).toFixed(1)
          : 'Average loss   =   total loss ÷ ' + count + ' outcomes';
    text(ctx, api, label, 960, 935, 40, C.ink);
  });
});

export const drawDiscreteQuantile = scene.draw;
export default scene;
