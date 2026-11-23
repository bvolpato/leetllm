import {
  drawSandboxArtifactHeader,
  drawSandboxStage,
  drawSandboxUpgradeArrow,
  drawSandboxUpgradeCard,
  drawSandboxUpgradeFooter,
  drawSandboxUpgradeLine,
  drawSandboxUpgradePanel,
  drawSandboxUpgradeText,
  paintUnknownSandboxLegacy,
} from '../defaults.mjs';
export function paintEarnedParserCase(
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
  const reveal = currentBeat > 1 || done('parser-result');
  if (currentBeat === 0 || currentBeat === 1) {
    const rows = [
      ['payments::retry', 'direct failure + error'],
      ['payments::later', 'direct skipped + error'],
      ['payments::nested', 'details → failure'],
      ['payments::retry', 'repeated direct failure'],
    ];
    rows.forEach(([name, tag], i) => {
      const y = 350 + i * 130;
      drawSandboxUpgradeText(
        ctx,
        api,
        themeColors,
        name,
        150,
        y + 30,
        30,
        reveal && i === 0 ? themeColors.green : themeColors.blue,
        'left',
        true,
      );
      drawSandboxUpgradeText(ctx, api, themeColors, tag, 700, y + 30, 29, themeColors.muted);
    });
    drawSandboxUpgradeLine(ctx, api, themeColors, 1200, 330, 1200, 870, themeColors.muted, 2);
    if (reveal) {
      api.focus.target('earned-parser-case-output', () => {
        drawSandboxUpgradeCard(
          ctx,
          api,
          themeColors,
          c,
          'payments::retry',
          1270,
          375,
          500,
          110,
          themeColors.green,
          32,
        );
        drawSandboxUpgradeText(
          ctx,
          api,
          themeColors,
          'Once; first-seen order',
          1520,
          595,
          30,
          themeColors.green,
          'center',
        );
      });
      if (on('unknown-cleanup')) {
        api.focus.target('earned-parser-case-verdicts', () => {
          drawSandboxUpgradeText(
            ctx,
            api,
            themeColors,
            'Functional: PASS',
            1520,
            730,
            34,
            themeColors.green,
            'center',
          );
          drawSandboxUpgradeText(
            ctx,
            api,
            themeColors,
            'Network: deny observed',
            1520,
            815,
            30,
            themeColors.green,
            'center',
          );
          drawSandboxUpgradeText(
            ctx,
            api,
            themeColors,
            done('quarantine-result') ? 'Cleanup: QUARANTINE' : 'Cleanup result pending',
            1520,
            900,
            31,
            done('quarantine-result') ? themeColors.pink : themeColors.muted,
            'center',
          );
        });
      }
    } else
      api.focus.target('earned-parser-case-output', () =>
        drawSandboxUpgradeText(
          ctx,
          api,
          themeColors,
          'Predict ordered output',
          1510,
          650,
          35,
          themeColors.yellow,
          'center',
        ),
      );
  } else {
    const newer = done('new-generation'),
      oldAction = done('late-id-result');
    drawSandboxUpgradePanel(ctx, api, themeColors, c, 150, 350, 900, 540, themeColors.blue);
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      'Slot A: next generation',
      600,
      430,
      38,
      themeColors.blue,
      'center',
    );
    drawSandboxUpgradeCard(
      ctx,
      api,
      themeColors,
      c,
      newer ? 'worker-A/g8' : 'Slot occupancy pending',
      310,
      535,
      580,
      120,
      newer ? themeColors.blue : themeColors.muted,
      newer ? 39 : 31,
    );
    drawSandboxUpgradeCard(
      ctx,
      api,
      themeColors,
      c,
      'Late cleanup targets g7',
      1200,
      390,
      590,
      120,
      themeColors.pink,
      32,
    );
    drawSandboxUpgradeArrow(ctx, api, themeColors, 1490, 550, 1490, 660, themeColors.pink);
    drawSandboxUpgradeCard(
      ctx,
      api,
      themeColors,
      c,
      oldAction ? 'Original ID only\nreplacement stays live' : 'Late cleanup result\npending',
      1200,
      720,
      590,
      150,
      oldAction ? themeColors.green : themeColors.muted,
      32,
    );
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      'Verified termination + reset precede reuse',
      960,
      960,
      35,
      themeColors.green,
      'center',
    );
  }
  drawSandboxUpgradeFooter(
    ctx,
    api,
    themeColors,
    'Fresh input, same parser artifact; functional result, enforced boundary evidence and cleanup stay separate',
  );
}
export function drawEarnedParserCase(ctx, scene, state, api) {
  return drawSandboxStage(ctx, scene, state, api, paintEarnedParserCase, paintUnknownSandboxLegacy);
}
export default {
  id: 'earned-parser-case',
  draw: drawEarnedParserCase,
  cues: [
    'earned-parser-case-b1',
    'earned-parser-case-b2',
    'earned-parser-case-parser-result',
    'earned-parser-case-unknown-cleanup',
    'earned-parser-case-quarantine-result',
    'earned-parser-case-b3',
    'earned-parser-case-new-generation',
    'earned-parser-case-late-id-result',
  ],
};
