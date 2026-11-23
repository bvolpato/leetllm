import {
  drawSandboxCard,
  drawSandboxCodePanel,
  drawSandboxStage,
  drawSandboxTransfer,
  drawSandboxUpgradeArrow,
  drawSandboxUpgradeCard,
  drawSandboxUpgradeFooter,
  drawSandboxUpgradePanel,
  drawSandboxUpgradeText,
} from '../defaults.mjs';
export function paintSubjectIntroLegacy(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  phase,
  t,
  currentBeat,
  beatProgress,
  routeProgress,
) {
  const traceback = api.focus.target('parser-error', () =>
    drawSandboxCard(
      ctx,
      api,
      themeColors,
      c,
      currentBeat < 1
        ? 'Parser attempt 1\nKeyError: status'
        : 'Repair clue\ninspect child elements',
      145,
      470,
      540,
      currentBeat < 1 ? themeColors.pink : themeColors.yellow,
      150,
      31,
    ),
  );
  const worker = api.focus.target('untrusted-worker', () =>
    drawSandboxCard(
      ctx,
      api,
      themeColors,
      c,
      'Untrusted candidate\nprocess + dependencies',
      760,
      470,
      500,
      themeColors.blue,
      150,
      30,
    ),
  );
  const host = api.focus.target('host-capabilities', () =>
    drawSandboxCard(
      ctx,
      api,
      themeColors,
      c,
      'Host authority\nfiles · network · CPU',
      1335,
      470,
      480,
      themeColors.pink,
      150,
      29,
    ),
  );
  drawSandboxTransfer(
    ctx,
    api,
    themeColors,
    routeProgress,
    t,
    traceback,
    worker,
    themeColors.yellow,
    routeProgress,
  );
  drawSandboxTransfer(
    ctx,
    api,
    themeColors,
    routeProgress,
    t,
    worker,
    host,
    themeColors.pink,
    routeProgress,
  );
}
export function paintSubjectIntro(
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
  drawSandboxCodePanel(
    ctx,
    api,
    themeColors,
    c,
    'The same report.xml',
    ['<testcase classname="ReportParser"', '  name="rejectsFailure"><failure/></testcase>'],
    130,
    310,
    1080,
    themeColors.blue,
  );
  drawSandboxUpgradeCard(
    ctx,
    api,
    themeColors,
    c,
    'case.attrib["status"]',
    130,
    610,
    690,
    95,
    themeColors.pink,
    32,
  );
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    "KeyError: 'status'",
    475,
    805,
    44,
    themeColors.pink,
    'center',
  );
  drawSandboxUpgradeArrow(ctx, api, themeColors, 850, 660, 1090, 660, themeColors.yellow);
  drawSandboxUpgradePanel(ctx, api, themeColors, c, 1250, 310, 540, 585, themeColors.pink);
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    'Host-user authority',
    1520,
    375,
    34,
    themeColors.pink,
    'center',
  );
  ['Files', 'Network routes', 'CPU / memory'].forEach((v, i) =>
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      v,
      1520,
      510 + i * 115,
      34,
      themeColors.pink,
      'center',
    ),
  );
  if (currentBeat > 0)
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      'Direct host execution can inherit this reach',
      960,
      940,
      34,
      themeColors.yellow,
      'center',
    );
  drawSandboxUpgradeFooter(
    ctx,
    api,
    themeColors,
    'A bounded repair packet and a separate execution boundary answer different questions',
  );
}
export function drawSubjectIntro(ctx, scene, state, api) {
  return drawSandboxStage(ctx, scene, state, api, paintSubjectIntro, paintSubjectIntroLegacy);
}
export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: [
    'subject-intro-b1-1',
    'subject-intro-b2-1',
    'subject-intro-b2-2',
    'subject-intro-host-authority',
    'subject-intro-b3-1',
  ],
};
