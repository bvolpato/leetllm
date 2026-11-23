import { fmt } from '../arithmetic.mjs';
import { moeCue } from '../construction.mjs';
import { moeZ } from '../model.mjs';
import { circle, line, proportionStrip, tag, text } from '../defaults.mjs';

const position = (logit) => 240 + (logit + 2) * 280;

export function drawZPartition(ctx, scene, state, api) {
  const { C } = api;
  const shift = 3 * moeCue(state, 'z-shift', 'settle');
  const { logits, p, partition, loss } = moeZ(shift);
  const colors = [C.blue, C.pink];
  const [blue, pink] = logits.map(position);
  const baselineReady = moeCue(state, 'z-base');
  const resultReady = moeCue(state, 'z-result');

  api.focus.target('mo-z-partition-mechanism', () => {
    line(ctx, api, 186, 444, 1745, 444, C.muted, 3);
    for (let tick = -2; tick <= 3; tick++) {
      const x = position(tick);
      line(ctx, api, x, 444, x, 466, C.muted, 3);
      text(ctx, api, String(tick), x, 512, 32, C.muted, 'center', 'mono');
    }
    text(ctx, api, 'Router logit', 1755, 568, 32, C.muted, 'right');
    line(ctx, api, pink, 300, blue, 300, C.ink, 3);
    for (const x of [blue, pink]) line(ctx, api, x, 290, x, 310, C.ink, 3);
    text(
      ctx,
      api,
      'gap ≈ ' + (logits[0] - logits[1]).toFixed(2),
      (blue + pink) / 2,
      276,
      34,
      C.ink,
      'center',
    );
    logits.forEach((logit, i) => {
      const x = position(logit);
      circle(ctx, api, x, 444, 17, colors[i]);
      text(ctx, api, fmt(logit), x, 403, 40, colors[i], 'center', 'mono');
    });
  });

  const stripX = 180,
    stripWidth = 720;
  text(ctx, api, 'Router weight', stripX, 691, 42, C.ink);
  proportionStrip(ctx, api, colors, p, stripX, 746, stripWidth);
  let left = stripX;
  p.forEach((share, i) => {
    const width = share * stripWidth;
    text(
      ctx,
      api,
      Math.round(share * 100) + '%',
      left + width / 2,
      800,
      39,
      C.bg,
      'center',
      'mono',
    );
    left += width;
  });

  api.focus.target('z-penalty', () => {
    const x = 1430;
    const sumReady = shift > 0 ? moeCue(state, 'z-shift-sum') : moeCue(state, 'z-base-sum');
    const sum = logits.reduce((total, logit) => total + Math.exp(logit), 0);
    const sumLabel = shift > 0 ? 'Exponential sum = e³ ≈ ' + fmt(sum, 2) : 'Exponential sum = 1';
    text(ctx, api, sumReady ? sumLabel : 'Exponential sum', x, 690, 38, C.ink, 'center');
    if (resultReady || (baselineReady && shift === 0)) {
      tag(ctx, api, 'log partition = ' + fmt(partition), x, 787, 500, C.yellow);
      tag(ctx, api, 'z-loss = ' + fmt(loss), x, 891, 500, C.pink);
    } else if (shift > 0) {
      tag(ctx, api, 'Current log partition pending', x, 787, 500, C.muted);
      tag(ctx, api, 'Current z-loss pending', x, 891, 500, C.muted);
    }
  });
}

export default {
  id: 'z-partition',
  draw: drawZPartition,
  cues: [
    'mo-z-partition-op-0',
    'mo-z-base-sum',
    'mo-z-base',
    'mo-z-shift',
    'mo-z-partition-op-1',
    'mo-z-shift-sum',
    'mo-z-result',
    'mo-z-partition-op-2',
  ],
};
