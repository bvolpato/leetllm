import {
  drawSandboxArtifactHeader,
  drawSandboxCodePanel,
  drawSandboxStage,
  drawSandboxUpgradeArrow,
  drawSandboxUpgradeCard,
  drawSandboxUpgradeFooter,
  drawSandboxUpgradeText,
  paintUnknownSandboxLegacy,
} from '../defaults.mjs';
export function paintPreparedDependencies(
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
      'Preparation with limited egress',
      [
        'Pinned artifacts / trusted lockfile',
        'Build scripts are untrusted',
        'No production secrets',
      ],
      130,
      350,
      760,
      themeColors.yellow,
    );
    drawSandboxCodePanel(
      ctx,
      api,
      themeColors,
      c,
      'Approved cache / image',
      [
        'Identity hash matches bytes',
        'Offline candidate execution',
        'Only needed mounted artifacts',
      ],
      1030,
      350,
      760,
      themeColors.blue,
    );
    drawSandboxUpgradeArrow(ctx, api, themeColors, 920, 530, 1000, 530, themeColors.cyan);
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      'Artifact identity ≠ benign behavior',
      960,
      890,
      39,
      themeColors.pink,
      'center',
    );
  } else if (currentBeat === 1) {
    drawSandboxUpgradeCard(
      ctx,
      api,
      themeColors,
      c,
      'Allowed TLS name',
      130,
      360,
      650,
      100,
      themeColors.blue,
      34,
    );
    drawSandboxUpgradeCard(
      ctx,
      api,
      themeColors,
      c,
      'Shared endpoint',
      1130,
      360,
      650,
      100,
      themeColors.yellow,
      34,
    );
    drawSandboxUpgradeArrow(ctx, api, themeColors, 820, 410, 1090, 410, themeColors.cyan);
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      'HTTP request names another domain',
      960,
      655,
      38,
      themeColors.pink,
      'center',
    );
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      'Resolve policy across DNS / redirects / IPv4 / IPv6 / proxies / sockets',
      960,
      855,
      31,
      themeColors.ink,
      'center',
    );
  } else {
    const encoded = Buffer.from('DEMO').toString('base64');
    drawSandboxCodePanel(
      ctx,
      api,
      themeColors,
      c,
      'Synthetic environment · toy value',
      ["TOKEN = 'DEMO'", 'base64(TOKEN) → ' + encoded],
      150,
      350,
      1050,
      themeColors.pink,
    );
    drawSandboxUpgradeArrow(
      ctx,
      api,
      themeColors,
      675,
      590,
      675,
      660,
      themeColors.yellow,
      Math.min(1, beatProgress * 4),
    );
    drawSandboxCodePanel(
      ctx,
      api,
      themeColors,
      c,
      'Exported output artifact',
      [encoded],
      330,
      710,
      690,
      themeColors.yellow,
    );
    drawSandboxUpgradeArrow(
      ctx,
      api,
      themeColors,
      1230,
      550,
      1410,
      550,
      themeColors.pink,
      Math.min(1, beatProgress * 4),
    );
    drawSandboxCodePanel(
      ctx,
      api,
      themeColors,
      c,
      'Supervisor log',
      [encoded, 'model context / review'],
      1450,
      420,
      350,
      themeColors.pink,
    );
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      'No outbound IP needed',
      960,
      970,
      35,
      themeColors.yellow,
      'center',
    );
  }
  drawSandboxUpgradeFooter(
    ctx,
    api,
    themeColors,
    'Two-phase dependency policy; network none retains loopback and ordinary output channels',
  );
}
export function drawPreparedDependencies(ctx, scene, state, api) {
  return drawSandboxStage(
    ctx,
    scene,
    state,
    api,
    paintPreparedDependencies,
    paintUnknownSandboxLegacy,
  );
}
export default {
  id: 'prepared-dependencies',
  draw: drawPreparedDependencies,
  cues: [
    'prepared-dependencies-b1',
    'prepared-dependencies-prepared-cache',
    'prepared-dependencies-b2',
    'prepared-dependencies-domain-front',
    'prepared-dependencies-b3',
    'prepared-dependencies-encoded-secret',
  ],
};
