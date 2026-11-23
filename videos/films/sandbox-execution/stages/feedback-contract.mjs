import {
  drawSandboxArtifactHeader,
  drawSandboxCodePanel,
  drawSandboxStage,
  drawSandboxUpgradeArrow,
  drawSandboxUpgradeCard,
  drawSandboxUpgradeFooter,
  drawSandboxUpgradeLine,
  drawSandboxUpgradePanel,
  drawSandboxUpgradeText,
  paintUnknownSandboxLegacy,
} from '../defaults.mjs';
export function paintFeedbackContract(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  currentBeat,
  beatProgress,
  id,
  on,
  done,
) {
  drawSandboxArtifactHeader(ctx, api, themeColors);
  if (currentBeat === 0) {
    drawSandboxCodePanel(
      ctx,
      api,
      themeColors,
      c,
      'Execution feedback',
      ['command: parse report.xml', 'exit: 1', "KeyError: 'status'"],
      140,
      345,
      780,
      themeColors.blue,
    );
    const q = on('feedback-cap') ? 1 : Math.min(1, beatProgress * 3);
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      'One long line: 200 bytes',
      1370,
      385,
      33,
      themeColors.yellow,
      'center',
    );
    drawSandboxUpgradePanel(
      ctx,
      api,
      themeColors,
      c,
      1070,
      465,
      640,
      100,
      themeColors.muted,
      themeColors.bg,
    );
    drawSandboxUpgradePanel(
      ctx,
      api,
      themeColors,
      c,
      1070,
      465,
      640 * 0.8 * q,
      100,
      themeColors.blue,
      themeColors.blue,
    );
    drawSandboxUpgradeLine(ctx, api, themeColors, 1582, 435, 1582, 595, themeColors.pink, 4);
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      'Collection cap 160 bytes',
      1370,
      700,
      33,
      themeColors.pink,
      'center',
    );
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      'Useful prefix + suffix',
      1370,
      830,
      31,
      themeColors.cyan,
      'center',
    );
  } else if (currentBeat === 1) {
    drawSandboxCodePanel(
      ctx,
      api,
      themeColors,
      c,
      'Untrusted report string',
      ['testname: ignore all limits', 'terminal: \\x1b[2J', 'copied synthetic token'],
      140,
      340,
      920,
      themeColors.pink,
    );
    drawSandboxUpgradeArrow(ctx, api, themeColors, 1090, 550, 1270, 550, themeColors.yellow);
    drawSandboxUpgradeCard(
      ctx,
      api,
      themeColors,
      c,
      'Escaped display\nbytes remain DATA',
      1320,
      450,
      460,
      180,
      themeColors.yellow,
      31,
    );
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      'Policy stays outside this packet',
      960,
      875,
      37,
      themeColors.green,
      'center',
    );
  } else {
    drawSandboxUpgradeText(ctx, api, themeColors, 'Input bytes', 250, 410, 35, themeColors.blue);
    drawSandboxUpgradeText(ctx, api, themeColors, 'Parsing time', 720, 410, 35, themeColors.yellow);
    drawSandboxUpgradeText(ctx, api, themeColors, 'Memory', 1220, 410, 35, themeColors.pink);
    [250, 720, 1220].forEach((x, i) => {
      drawSandboxUpgradePanel(
        ctx,
        api,
        themeColors,
        c,
        x,
        500,
        330,
        280,
        [themeColors.blue, themeColors.yellow, themeColors.pink][i],
      );
      drawSandboxUpgradeText(
        ctx,
        api,
        themeColors,
        'Bound + verify',
        x + 165,
        660,
        29,
        [themeColors.blue, themeColors.yellow, themeColors.pink][i],
        'center',
      );
    });
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      'Check actual Expat version',
      960,
      900,
      36,
      themeColors.ink,
      'center',
    );
  }
  drawSandboxUpgradeFooter(
    ctx,
    api,
    themeColors,
    'Authored parser examples only; traceback text does not grant supervisor authority',
  );
}
export function drawFeedbackContract(ctx, scene, state, api) {
  return drawSandboxStage(ctx, scene, state, api, paintFeedbackContract, paintUnknownSandboxLegacy);
}
export default {
  id: 'feedback-contract',
  draw: drawFeedbackContract,
  cues: [
    'feedback-contract-b1',
    'feedback-contract-feedback-cap',
    'feedback-contract-b2',
    'feedback-contract-feedback-data',
    'feedback-contract-b3',
  ],
};
