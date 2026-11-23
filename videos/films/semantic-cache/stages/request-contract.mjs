import {
  drawSemanticConstructionsArrow,
  drawSemanticConstructionsBox,
  drawSemanticConstructionsCenter,
  drawSemanticConstructionsFoot,
  drawSemanticConstructionsLine,
  drawSemanticConstructionsText,
  withSemanticConstructionFrame,
} from '../defaults.mjs';
export function paintRequestContract(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  t,
  id,
  currentBeat,
  beatProgress,
  done,
  progress,
  op,
) {
  drawSemanticConstructionsCenter(
    ctx,
    api,
    themeColors,
    'One fictional public policy · preserve the complete answer and its dependencies',
    245,
  );
  drawSemanticConstructionsBox(
    ctx,
    api,
    themeColors,
    c,
    'Question: revoked-key audit retention',
    165,
    340,
    770,
    themeColors.cyan,
    94,
  );
  drawSemanticConstructionsBox(
    ctx,
    api,
    themeColors,
    c,
    'Complete response: 30 days',
    1025,
    340,
    730,
    themeColors.blue,
    94,
  );
  drawSemanticConstructionsArrow(ctx, api, themeColors, 950, 387, 1005, 387);
  drawSemanticConstructionsText(
    ctx,
    api,
    themeColors,
    'Answer contract',
    160,
    565,
    32,
    themeColors.yellow,
  );
  const fields =
    currentBeat === 0
      ? ['public-policy read', 'same required field', 'current permission', 'reviewed answer bytes']
      : [
          'model / prompt / runtime',
          'corpus / policy release',
          'tenant / access / locale',
          'response schema / relevant context',
        ];
  fields.forEach((s, i) => {
    const y = 625 + i * 78,
      visible = op >= (i + 1) / 5;
    drawSemanticConstructionsLine(
      ctx,
      api,
      themeColors,
      520,
      y - 13,
      1660,
      y - 13,
      themeColors.panel,
      2,
    );
    if (visible)
      drawSemanticConstructionsText(
        ctx,
        api,
        themeColors,
        s,
        550,
        y + 17,
        31,
        op < (i + 2) / 5 ? themeColors.cyan : themeColors.blue,
      );
  });
  if (currentBeat === 0) {
    drawSemanticConstructionsText(
      ctx,
      api,
      themeColors,
      'live incident',
      160,
      705,
      27,
      themeColors.pink,
    );
    drawSemanticConstructionsText(
      ctx,
      api,
      themeColors,
      'key write',
      160,
      785,
      27,
      themeColors.pink,
    );
    drawSemanticConstructionsText(
      ctx,
      api,
      themeColors,
      'history follow-up',
      160,
      865,
      27,
      themeColors.pink,
    );
  } else
    drawSemanticConstructionsText(
      ctx,
      api,
      themeColors,
      'Changed dependency →\nnew identity or bypass',
      160,
      770,
      28,
      themeColors.yellow,
    );
  drawSemanticConstructionsFoot(
    ctx,
    api,
    themeColors,
    'A nearby vector proposes this stored response; its scope determines whether reuse is meaningful',
  );
}
export function drawRequestContract(ctx, scene, state, api) {
  withSemanticConstructionFrame(ctx, scene, state, api, paintRequestContract);
}
export default {
  id: 'request-contract',
  draw: drawRequestContract,
  cues: ['sc-request-contract-b0', 'sc-request-contract-b1'],
};
