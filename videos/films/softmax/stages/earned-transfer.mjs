import {
  drawCompleteBox,
  drawCompleteHead,
  drawCompleteText,
  withSoftmaxCompleteFrame,
} from '../defaults.mjs';
export function paintSoftmaxCompleteEarnedTransfer(
  ctx,
  scene,
  state,
  api,
  C,
  m,
  f,
  b,
  colors,
  xs,
  started,
  progress,
) {
  const stage = f.freshStage,
    empty =
      b === 2 &&
      (state.cues?.['fresh-empty'] ? state.cues['fresh-empty'].phase !== 'before' : f.p > 0.2),
    emptyDecision = b === 2 && started('fresh-empty');
  drawCompleteHead(
    ctx,
    api,
    C,
    empty
      ? 'Counterfactual: all three targets ignored'
      : 'Fresh batch · no weights · one ignored target',
  );
  ['p(target) = ¼', 'p(target) = ½', b === 2 ? '[−50, 80, 20]' : '[100, −100, 0]'].forEach(
    (s, i) => {
      const y = 395 + i * 150;
      drawCompleteBox(
        ctx,
        api,
        C,
        'row ' + (i + 1),
        320,
        y,
        260,
        80,
        empty || i === 2 ? C.muted : colors[i],
        31,
      );
      drawCompleteText(ctx, api, C, s, 680, y + 10, 34, i === 2 ? C.muted : colors[i]);
      drawCompleteText(
        ctx,
        api,
        C,
        empty || i === 2 ? 'ignored' : 'supervised',
        1290,
        y + 10,
        31,
        empty || i === 2 ? C.muted : colors[i],
      );
      if (stage > 0)
        drawCompleteText(
          ctx,
          api,
          C,
          empty || i === 2 ? 'loss 0' : m.freshLosses[i].toFixed(6),
          1660,
          y + 10,
          31,
          empty || i === 2 ? C.muted : colors[i],
          'center',
        );
    },
  );
  if (empty)
    drawCompleteText(
      ctx,
      api,
      C,
      emptyDecision ? 'supervised count 0 → SKIP UPDATE' : 'supervised count 0 · update pending',
      960,
      920,
      39,
      C.yellow,
      'center',
    );
  else if (stage === 0) {
    drawCompleteText(
      ctx,
      api,
      C,
      'Dashboard divides by 3 stored rows.',
      960,
      865,
      35,
      C.pink,
      'center',
    );
    drawCompleteText(
      ctx,
      api,
      C,
      'Predict the correct mean. Can the ignored row change it?',
      960,
      970,
      34,
      C.yellow,
      'center',
    );
  } else if (stage === 1)
    drawCompleteText(
      ctx,
      api,
      C,
      'Two supervised negative logs · ignored row contributes0',
      960,
      935,
      36,
      C.green,
      'center',
    );
  else {
    const divisor = stage >= 3 ? 2 : 3;
    drawCompleteText(ctx, api, C, 'sum = ' + m.freshSum.toFixed(6), 600, 850, 37, C.cyan, 'center');
    drawCompleteBox(
      ctx,
      api,
      C,
      '÷ ' + divisor,
      1120,
      840,
      220,
      90,
      divisor === 2 ? C.green : C.pink,
      43,
    );
    drawCompleteText(
      ctx,
      api,
      C,
      divisor === 2 ? '= ' + (m.freshSum / divisor).toFixed(6) + ' nats' : '= pending',
      1510,
      850,
      37,
      divisor === 2 ? C.green : C.pink,
      'center',
    );
    drawCompleteText(
      ctx,
      api,
      C,
      divisor === 2
        ? 'Repair the denominator. Keep the same predictions.'
        : 'Stored-row dashboard · mean calculation pending',
      960,
      970,
      32,
      divisor === 2 ? C.green : C.pink,
      'center',
    );
    if (b === 1 && started('fresh-wrong-mean'))
      drawCompleteText(
        ctx,
        api,
        C,
        'Counterfactual stored-row mean: ' + (m.freshSum / 3).toFixed(6) + ' nats',
        960,
        1040,
        26,
        C.pink,
        'center',
      );
  }
}
export function drawEarnedTransferStage(ctx, scene, state, api) {
  withSoftmaxCompleteFrame(ctx, scene, state, api, paintSoftmaxCompleteEarnedTransfer);
}
export default {
  id: 'earned-transfer',
  draw: drawEarnedTransferStage,
  cues: [
    'earned-transfer-0',
    'earned-transfer-1',
    'fresh-two-losses',
    'fresh-loss-sum',
    'fresh-mean-repair',
    'fresh-wrong-mean',
    'earned-transfer-2',
    'fresh-empty',
  ],
};
